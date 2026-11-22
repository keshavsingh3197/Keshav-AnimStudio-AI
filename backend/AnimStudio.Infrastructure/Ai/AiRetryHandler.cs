using System.Globalization;
using System.Net;
using System.Net.Sockets;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Logging;

namespace AnimStudio.Infrastructure.Ai;

/// <summary>
/// Retries the failures that are worth retrying, and nothing else.
/// </summary>
/// <remarks>
/// <para>
/// Free tiers rate-limit constantly, so a 429 that is retried after the interval the
/// provider asked for is the difference between a render that finishes and one that dies
/// at scene twelve. Both HTTP <c>Retry-After</c> and Google RPC <c>RetryInfo.retryDelay</c>
/// JSON bodies are honoured when present, because sub-second guessing wastes the allowance
/// before a per-minute window can refill. Daily quota exhaustion (<c>PerDay</c>) fails fast
/// instead of burning retries.
/// </para>
/// <para>
/// A plain 500 is deliberately NOT retried. It can mean the request was accepted and then
/// failed partway, and retrying that spends quota on work that may already have happened.
/// 502/503/504 are different: they say the request never reached anything.
/// </para>
/// </remarks>
public sealed partial class AiRetryHandler(ILogger<AiRetryHandler> logger) : DelegatingHandler
{
    private const int MaxAttempts = 3;

    private static readonly HttpStatusCode[] Retryable =
    [
        HttpStatusCode.TooManyRequests,
        HttpStatusCode.BadGateway,
        HttpStatusCode.ServiceUnavailable,
        HttpStatusCode.GatewayTimeout
    ];

    /// <summary>Never wait longer than this per retry, however patient the provider asks us to be.</summary>
    private static readonly TimeSpan MaxDelay = TimeSpan.FromSeconds(45);

    /// <summary>A rate-limit ask beyond this window will not clear within a single request retry loop.</summary>
    private static readonly TimeSpan UnrecoverableRetryAfter = TimeSpan.FromSeconds(60);

    protected override async Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request, CancellationToken ct)
    {
        HttpResponseMessage? response = null;

        for (var attempt = 1; ; attempt++)
        {
            ct.ThrowIfCancellationRequested();

            try
            {
                response?.Dispose();
                response = await base.SendAsync(request, ct).ConfigureAwait(false);

                if (attempt >= MaxAttempts || Array.IndexOf(Retryable, response.StatusCode) < 0)
                    return response;
            }
            catch (HttpRequestException ex) when (attempt < MaxAttempts && !IsUnreachableHost(ex))
            {
                // A transient transport failure never reached the provider, so it is safe to
                // try again; a refused connection (local server not running) is not retried.
                response = null;
            }

            var (abortRetries, delay) = await ResolveDelayAsync(response, attempt, ct).ConfigureAwait(false);
            if (abortRetries && response is not null)
                return response;

            logger.LogInformation(
                "Retrying an AI request in {DelayMs}ms (attempt {Attempt} of {MaxAttempts}).",
                (int)delay.TotalMilliseconds, attempt, MaxAttempts);

            await Task.Delay(delay, ct).ConfigureAwait(false);
        }
    }

    private static async Task<(bool AbortRetries, TimeSpan Delay)> ResolveDelayAsync(
        HttpResponseMessage? response, int attempt, CancellationToken ct)
    {
        var retryAfter = response?.Headers.RetryAfter;

        if (retryAfter?.Delta is { } delta && delta > TimeSpan.Zero)
            return delta > UnrecoverableRetryAfter ? (true, TimeSpan.Zero) : (false, Cap(delta));

        if (retryAfter?.Date is { } date)
        {
            var until = date - DateTimeOffset.UtcNow;
            if (until > UnrecoverableRetryAfter) return (true, TimeSpan.Zero);
            if (until > TimeSpan.Zero) return (false, Cap(until));
        }

        if (response?.StatusCode == HttpStatusCode.TooManyRequests && response.Content is not null)
        {
            try
            {
                // Buffer in memory (never logged) so callers inspecting final errors still read the same body.
                var body = await response.Content.ReadAsStringAsync(ct).ConfigureAwait(false);
                var analyzed = AnalyzeRateLimitBody(body, attempt);
                if (analyzed.AbortRetries || analyzed.Delay > TimeSpan.Zero)
                    return analyzed;
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                // Fall back to default exponential backoff if body cannot be read.
            }
        }

        return (false, ExponentialJitter(attempt));
    }

    internal static (bool AbortRetries, TimeSpan Delay) AnalyzeRateLimitBody(string? body, int attempt)
    {
        if (string.IsNullOrWhiteSpace(body) || body.Length > 64 * 1024)
            return (false, ExponentialJitter(attempt));

        var parsedDelay = TryParseGoogleRetryDelay(body);
        var isDailyLimit = body.Contains("PerDay", StringComparison.OrdinalIgnoreCase)
            || body.Contains("RequestsPerDay", StringComparison.OrdinalIgnoreCase);

        if (parsedDelay is { } hint)
        {
            if (hint > UnrecoverableRetryAfter)
                return (true, TimeSpan.Zero);

            var jitter = TimeSpan.FromMilliseconds(Random.Shared.Next(200, 650));
            return (false, Cap(hint + jitter));
        }

        if (isDailyLimit)
            return (true, TimeSpan.Zero);

        if (body.Contains("RESOURCE_EXHAUSTED", StringComparison.OrdinalIgnoreCase))
        {
            // Google RPM/TPM rate limits rarely clear inside 0.5s; give the token bucket real room.
            var baseSecs = Math.Min(30, 6 * attempt);
            var jitter = TimeSpan.FromMilliseconds(Random.Shared.Next(250, 750));
            return (false, Cap(TimeSpan.FromSeconds(baseSecs) + jitter));
        }

        return (false, ExponentialJitter(attempt));
    }

    internal static TimeSpan? TryParseGoogleRetryDelay(string body)
    {
        try
        {
            using var doc = JsonDocument.Parse(body);
            if (FindRetryDelaySeconds(doc.RootElement, depth: 0) is { } secs && secs >= 0)
                return TimeSpan.FromSeconds(secs);
        }
        catch (JsonException)
        {
            // Non-JSON rate-limit body falls through to text pattern lookup below.
        }

        var match = RetryInSecondsPattern().Match(body);
        if (match.Success && double.TryParse(match.Groups[1].Value, NumberStyles.Float, CultureInfo.InvariantCulture, out var parsed)
            && parsed >= 0)
        {
            return TimeSpan.FromSeconds(parsed);
        }

        return null;
    }

    private static double? FindRetryDelaySeconds(JsonElement element, int depth)
    {
        if (depth > 8) return null;

        switch (element.ValueKind)
        {
            case JsonValueKind.Object:
                if (element.TryGetProperty("retryDelay", out var delayProp) && delayProp.ValueKind == JsonValueKind.String
                    && TryParseDurationToken(delayProp.GetString(), out var secs))
                {
                    return secs;
                }

                foreach (var prop in element.EnumerateObject())
                {
                    if (FindRetryDelaySeconds(prop.Value, depth + 1) is { } found)
                        return found;
                }
                return null;

            case JsonValueKind.Array:
                foreach (var item in element.EnumerateArray())
                {
                    if (FindRetryDelaySeconds(item, depth + 1) is { } found)
                        return found;
                }
                return null;

            default:
                return null;
        }
    }

    private static bool TryParseDurationToken(string? raw, out double seconds)
    {
        seconds = 0;
        if (string.IsNullOrWhiteSpace(raw)) return false;
        var span = raw.AsSpan().Trim();
        if (span.EndsWith("s", StringComparison.OrdinalIgnoreCase))
            span = span[..^1];
        return double.TryParse(span, NumberStyles.Float, CultureInfo.InvariantCulture, out seconds) && seconds >= 0;
    }

    private static TimeSpan ExponentialJitter(int attempt)
    {
        // Exponential, with jitter so parallel scene renders do not all retry on the same
        // tick and reproduce the burst that caused the 429.
        var backoff = TimeSpan.FromMilliseconds(400 * Math.Pow(2, attempt - 1));
        var jitter = TimeSpan.FromMilliseconds(Random.Shared.Next(0, 250));
        return Cap(backoff + jitter);
    }

    private static TimeSpan Cap(TimeSpan delay) => delay > MaxDelay ? MaxDelay : delay;

    [GeneratedRegex(@"retry\s+(?:in|after)\s+(\d+(?:\.\d+)?)\s*s", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex RetryInSecondsPattern();

    private static bool IsUnreachableHost(HttpRequestException ex) =>
        ex.InnerException is SocketException
        {
            SocketErrorCode: SocketError.ConnectionRefused
                or SocketError.HostNotFound
                or SocketError.HostUnreachable
                or SocketError.AddressNotAvailable
        };
}
