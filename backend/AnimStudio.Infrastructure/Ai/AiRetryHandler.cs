using System.Net;
using Microsoft.Extensions.Logging;

namespace AnimStudio.Infrastructure.Ai;

/// <summary>
/// Retries the failures that are worth retrying, and nothing else.
/// </summary>
/// <remarks>
/// <para>
/// Free tiers rate-limit constantly, so a 429 that is retried after the interval the
/// provider asked for is the difference between a render that finishes and one that dies
/// at scene twelve. <c>Retry-After</c> is honoured when present, because guessing a backoff
/// when the provider has told you the answer just wastes the allowance twice.
/// </para>
/// <para>
/// A plain 500 is deliberately NOT retried. It can mean the request was accepted and then
/// failed partway, and retrying that spends quota on work that may already have happened.
/// 502/503/504 are different: they say the request never reached anything.
/// </para>
/// </remarks>
public sealed class AiRetryHandler(ILogger<AiRetryHandler> logger) : DelegatingHandler
{
    private const int MaxAttempts = 3;

    private static readonly HttpStatusCode[] Retryable =
    [
        HttpStatusCode.TooManyRequests,
        HttpStatusCode.BadGateway,
        HttpStatusCode.ServiceUnavailable,
        HttpStatusCode.GatewayTimeout
    ];

    /// <summary>Never wait longer than this, however patient the provider asks us to be.</summary>
    private static readonly TimeSpan MaxDelay = TimeSpan.FromSeconds(30);

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
            catch (HttpRequestException) when (attempt < MaxAttempts)
            {
                // A transport failure never reached the provider, so it is always safe to
                // try again.
                response = null;
            }

            var delay = DelayFor(response, attempt);

            logger.LogInformation(
                "Retrying an AI request in {DelayMs}ms (attempt {Attempt} of {MaxAttempts}).",
                (int)delay.TotalMilliseconds, attempt, MaxAttempts);

            await Task.Delay(delay, ct).ConfigureAwait(false);
        }
    }

    private static TimeSpan DelayFor(HttpResponseMessage? response, int attempt)
    {
        var retryAfter = response?.Headers.RetryAfter;

        if (retryAfter?.Delta is { } delta && delta > TimeSpan.Zero)
            return delta > MaxDelay ? MaxDelay : delta;

        if (retryAfter?.Date is { } date)
        {
            var until = date - DateTimeOffset.UtcNow;
            if (until > TimeSpan.Zero) return until > MaxDelay ? MaxDelay : until;
        }

        // Exponential, with jitter so parallel scene renders do not all retry on the same
        // tick and reproduce the burst that caused the 429.
        var backoff = TimeSpan.FromMilliseconds(400 * Math.Pow(2, attempt - 1));
        var jitter = TimeSpan.FromMilliseconds(Random.Shared.Next(0, 250));
        var total = backoff + jitter;

        return total > MaxDelay ? MaxDelay : total;
    }
}
