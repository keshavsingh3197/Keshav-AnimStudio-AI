using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Ai;
using AnimStudio.Application.Options;
using AnimStudio.Domain.Ai;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AnimStudio.Infrastructure.Ai.Providers;

/// <summary>
/// The part of every HTTP-based provider that has nothing to do with which service it is:
/// deciding whether it is usable, getting a guarded client, attaching the key, and turning
/// a failure response into a named error code.
/// </summary>
/// <remarks>
/// <para>
/// Providers are singletons because the registry holds them for the life of the process.
/// They therefore take <see cref="IAiSecretResolver"/> rather than the scoped credential
/// store - see that interface for why.
/// </para>
/// <para>
/// One rule runs through the whole class: <b>a response body never reaches a log line or
/// an exception message.</b> A provider's error body frequently echoes the request, and the
/// request contains the user's transcript. Status codes and the short machine-readable
/// error identifiers are kept, because those are what an operator actually needs, and
/// prose is dropped.
/// </para>
/// </remarks>
public abstract class HttpAiProviderBase : IAiProvider
{
    private readonly IAiHttpClientFactory _clients;
    private readonly IAiSecretResolver _secrets;
    private readonly IOptionsMonitor<AiOptions> _options;

    protected HttpAiProviderBase(
        AiProviderId id,
        AiCapability capability,
        IAiHttpClientFactory clients,
        IAiSecretResolver secrets,
        IOptionsMonitor<AiOptions> options,
        ILogger logger)
    {
        Id = id;
        Capability = capability;
        _clients = clients;
        _secrets = secrets;
        _options = options;
        Logger = logger;
    }

    public AiProviderId Id { get; }
    public AiCapability Capability { get; }

    protected ILogger Logger { get; }

    protected AiProviderOptions? ProviderOptions => _options.CurrentValue.ProviderFor(Id);

    /// <summary>
    /// A provider on this machine needs no key. Derived from configuration rather than
    /// declared per class, so pointing a provider at localhost can never leave a key
    /// requirement behind that sends credentials to a local process.
    /// </summary>
    protected virtual bool RequiresApiKey => ProviderOptions?.IsLocal != true;

    /// <summary>The model to ask for, or null when the endpoint decides (LM Studio).</summary>
    protected string? Model => ProviderOptions?.Model;

    public virtual bool IsConfigured
    {
        get
        {
            var options = ProviderOptions;

            if (options is null || !options.Enabled) return false;
            if (string.IsNullOrWhiteSpace(options.BaseUrl)) return false;

            return !RequiresApiKey || _secrets.IsInstalled(Id);
        }
    }

    /// <summary>
    /// Validates configuration and the endpoint, and deliberately sends nothing.
    /// <para>
    /// A health check that made a real request would spend the free-tier allowance this
    /// whole layer exists to conserve - and on the providers that matter, one probe per
    /// dashboard refresh is a meaningful fraction of a day's quota. Whether the service is
    /// actually up is discovered by the first real call, which then opens the circuit.
    /// </para>
    /// </summary>
    public virtual async Task<AiProviderHealth> CheckHealthAsync(CancellationToken ct)
    {
        var options = ProviderOptions;

        if (options is null)
            return AiProviderHealth.Unhealthy("No configuration for this provider.");

        if (!options.Enabled)
            return AiProviderHealth.Unhealthy("Disabled.");

        if (RequiresApiKey && string.IsNullOrEmpty(await GetSecretAsync(ct).ConfigureAwait(false)))
            return AiProviderHealth.Unhealthy("No API key is installed.");

        try
        {
            _ = _clients.Create(Id);
            return AiProviderHealth.Healthy;
        }
        catch (AiEndpointException ex)
        {
            return AiProviderHealth.Unhealthy($"Endpoint rejected: {ex.Rejection}.");
        }
    }

    /// <summary>The guarded client for this provider, or a failure naming the broken rule.</summary>
    protected HttpClient Client()
    {
        try
        {
            return _clients.Create(Id);
        }
        catch (AiEndpointException ex)
        {
            throw new AiProviderException("endpoint-rejected", ex.Message, ex);
        }
    }

    protected virtual Task<string?> GetSecretAsync(CancellationToken ct) =>
        _secrets.GetSecretAsync(Id, ct);

    /// <summary>
    /// Ordered secret candidates tried sequentially when a key fails with quota/rate/auth errors.
    /// Defaults to delegating to <see cref="GetSecretAsync"/> when a subclass only overrides single-key lookup.
    /// </summary>
    protected virtual async Task<IReadOnlyList<AiSecretCandidate>> GetSecretCandidatesAsync(CancellationToken ct)
    {
        var candidates = await _secrets.GetSecretCandidatesAsync(Id, ct).ConfigureAwait(false);
        if (candidates.Count > 0) return candidates;

        var fallback = await GetSecretAsync(ct).ConfigureAwait(false);
        return string.IsNullOrEmpty(fallback)
            ? []
            : [new AiSecretCandidate(null, "single", fallback)];
    }

    /// <summary>
    /// Attaches the key. Overridden by providers that do not use a bearer token.
    /// </summary>
    protected virtual void ApplyAuthentication(HttpRequestMessage request, string secret) =>
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", secret);

    /// <summary>
    /// Sends a request with the key attached, mapping every transport failure and failure
    /// status onto an <see cref="AiProviderException"/> the executor can record. When
    /// multiple backup keys are configured in the pool, key-level failures (<c>quota-exhausted</c>,
    /// <c>rate-limited</c>, <c>credential-rejected</c>, <c>billing-required</c>) fail over
    /// automatically to the next healthy key before bubbling up.
    /// </summary>
    /// <remarks>
    /// The caller owns the returned response and must dispose it. Failure bodies are read
    /// and discarded here, so no caller has to remember that reading one is safe only
    /// through <see cref="Failure"/>.
    /// </remarks>
    protected async Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request, CancellationToken ct)
    {
        var client = Client();
        if (!RequiresApiKey)
            return await SendSingleAsync(client, request, ct).ConfigureAwait(false);

        var candidates = await GetSecretCandidatesAsync(ct).ConfigureAwait(false);
        if (candidates.Count == 0)
        {
            request.Dispose();

            var cooldown = _secrets.GetPoolCooldown(Id);
            if (cooldown.AllInCooldown)
            {
                var resetHint = cooldown.EarliestResetUtc is { } reset
                    ? $" (resets around {reset:HH:mm} UTC)"
                    : string.Empty;
                throw new AiProviderException(
                    cooldown.Reason ?? "quota-exhausted",
                    $"All configured API keys for '{Id.Value}' are in cooldown{resetHint}.");
            }

            throw new AiProviderException("credential-missing",
                $"No API key is installed for '{Id.Value}'.");
        }

        var buffered = candidates.Count > 1
            ? await BufferedHttpRequest.CaptureAsync(request, ct).ConfigureAwait(false)
            : null;

        AiProviderException? lastFailure = null;
        for (var i = 0; i < candidates.Count; i++)
        {
            var candidate = candidates[i];
            var attempt = buffered is null ? request : buffered.BuildAttempt();
            ApplyAuthentication(attempt, candidate.Secret);

            HttpResponseMessage response;
            try
            {
                response = await client.SendAsync(attempt, ct).ConfigureAwait(false);
            }
            catch (OperationCanceledException) when (ct.IsCancellationRequested)
            {
                if (buffered is not null) attempt.Dispose();
                throw;
            }
            catch (TaskCanceledException ex)
            {
                if (buffered is not null) attempt.Dispose();
                throw new AiProviderException("timeout", $"'{Id.Value}' did not respond in time.", ex);
            }
            catch (HttpRequestException ex)
            {
                if (buffered is not null) attempt.Dispose();
                throw new AiProviderException("transport-failed", $"Could not reach '{Id.Value}'.", ex);
            }

            if (response.IsSuccessStatusCode)
            {
                await _secrets.RecordSecretOutcomeAsync(
                    Id, candidate.KeyId, candidate.Fingerprint, AiSecretOutcomeKind.Succeeded,
                    null, null, CancellationToken.None).ConfigureAwait(false);
                return response;
            }

            var retryAfterUtc = ResolveRetryAfterUtc(response);
            using (response)
            {
                var payload = await ReadErrorBodyAsync(response, ct).ConfigureAwait(false);
                if (buffered is not null) attempt.Dispose();
                lastFailure = Failure(response.StatusCode, payload);
            }

            var outcome = MapFailureToSecretOutcome(lastFailure.Code);
            if (outcome is { } secretOutcome)
            {
                await _secrets.RecordSecretOutcomeAsync(
                    Id, candidate.KeyId, candidate.Fingerprint, secretOutcome,
                    lastFailure.Code, retryAfterUtc, CancellationToken.None).ConfigureAwait(false);

                if (i + 1 < candidates.Count)
                {
                    Logger.LogWarning(
                        "AI provider {ProviderId} key {Fingerprint} hit {ErrorCode}; failing over to backup key {NextFingerprint}.",
                        Id.Value, candidate.Fingerprint, lastFailure.Code, candidates[i + 1].Fingerprint);
                    continue;
                }
            }

            throw lastFailure;
        }

        throw lastFailure ?? new AiProviderException("credential-missing",
            $"No API key is installed for '{Id.Value}'.");
    }

    private async Task<HttpResponseMessage> SendSingleAsync(
        HttpClient client, HttpRequestMessage request, CancellationToken ct)
    {
        HttpResponseMessage response;
        try
        {
            response = await client.SendAsync(request, ct).ConfigureAwait(false);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            throw;
        }
        catch (TaskCanceledException ex)
        {
            throw new AiProviderException("timeout", $"'{Id.Value}' did not respond in time.", ex);
        }
        catch (HttpRequestException ex)
        {
            throw new AiProviderException("transport-failed", $"Could not reach '{Id.Value}'.", ex);
        }

        if (response.IsSuccessStatusCode) return response;

        using (response)
        {
            var payload = await ReadErrorBodyAsync(response, ct).ConfigureAwait(false);
            throw Failure(response.StatusCode, payload);
        }
    }

    private static AiSecretOutcomeKind? MapFailureToSecretOutcome(string errorCode) => errorCode switch
    {
        "quota-exhausted" => AiSecretOutcomeKind.QuotaExhausted,
        "rate-limited" => AiSecretOutcomeKind.RateLimited,
        "credential-rejected" or "billing-required" => AiSecretOutcomeKind.CredentialRejected,
        _ => null
    };

    private static DateTime? ResolveRetryAfterUtc(HttpResponseMessage response)
    {
        var ra = response.Headers.RetryAfter;
        if (ra?.Delta is { } delta && delta > TimeSpan.Zero)
            return DateTime.UtcNow + delta;
        if (ra?.Date is { } date)
            return date.UtcDateTime;
        return null;
    }

    private sealed class BufferedHttpRequest
    {
        public required HttpMethod Method { get; init; }
        public required Uri? RequestUri { get; init; }
        public required Version Version { get; init; }
        public required HttpVersionPolicy VersionPolicy { get; init; }
        public required List<KeyValuePair<string, IEnumerable<string>>> Headers { get; init; }
        public byte[]? ContentBytes { get; init; }
        public List<KeyValuePair<string, IEnumerable<string>>>? ContentHeaders { get; init; }

        public static async Task<BufferedHttpRequest> CaptureAsync(HttpRequestMessage source, CancellationToken ct)
        {
            byte[]? bytes = null;
            List<KeyValuePair<string, IEnumerable<string>>>? contentHeaders = null;
            if (source.Content is not null)
            {
                bytes = await source.Content.ReadAsByteArrayAsync(ct).ConfigureAwait(false);
                contentHeaders = [.. source.Content.Headers];
            }

            var headers = source.Headers
                .Where(h => !string.Equals(h.Key, "Authorization", StringComparison.OrdinalIgnoreCase)
                         && !string.Equals(h.Key, "x-goog-api-key", StringComparison.OrdinalIgnoreCase))
                .ToList();

            return new BufferedHttpRequest
            {
                Method = source.Method,
                RequestUri = source.RequestUri,
                Version = source.Version,
                VersionPolicy = source.VersionPolicy,
                Headers = headers,
                ContentBytes = bytes,
                ContentHeaders = contentHeaders
            };
        }

        public HttpRequestMessage BuildAttempt()
        {
            var clone = new HttpRequestMessage(Method, RequestUri)
            {
                Version = Version,
                VersionPolicy = VersionPolicy
            };

            foreach (var header in Headers)
                clone.Headers.TryAddWithoutValidation(header.Key, header.Value);

            if (ContentBytes is not null)
            {
                var content = new ByteArrayContent(ContentBytes);
                if (ContentHeaders is not null)
                {
                    foreach (var header in ContentHeaders)
                        content.Headers.TryAddWithoutValidation(header.Key, header.Value);
                }
                clone.Content = content;
            }

            return clone;
        }
    }

    /// <summary>A JSON request body, serialized with the shared options.</summary>
    protected static HttpRequestMessage JsonRequest(HttpMethod method, string url, object body) =>
        new(method, url)
        {
            Content = new StringContent(
                JsonSerializer.Serialize(body, SerializerOptions), Encoding.UTF8, "application/json")
        };

    /// <summary>
    /// Sends a JSON request and returns the parsed response. The caller owns the document.
    /// </summary>
    protected async Task<JsonDocument> PostJsonAsync(
        string relativeUrl, object body, CancellationToken ct) =>
        await SendForJsonAsync(JsonRequest(HttpMethod.Post, relativeUrl, body), ct)
            .ConfigureAwait(false);

    /// <summary>Sends a request and parses the response as JSON. The caller owns the document.</summary>
    protected async Task<JsonDocument> SendForJsonAsync(
        HttpRequestMessage request, CancellationToken ct)
    {
        using var response = await SendAsync(request, ct).ConfigureAwait(false);

        var payload = await response.Content.ReadAsStringAsync(ct).ConfigureAwait(false);

        try
        {
            return JsonDocument.Parse(payload);
        }
        catch (JsonException ex)
        {
            throw new AiProviderException("malformed-response",
                $"'{Id.Value}' returned a body that is not JSON.", ex);
        }
    }

    /// <summary>
    /// Sends a request and returns the raw body, for the providers that answer with an
    /// image rather than a description of one.
    /// </summary>
    /// <remarks>
    /// <paramref name="maxBytes"/> is enforced here as well as by the client's own buffer
    /// limit, so the ceiling is a decision this layer makes rather than one inherited from
    /// transport configuration that someone may later raise for an unrelated reason.
    /// </remarks>
    protected async Task<byte[]> SendForBytesAsync(
        HttpRequestMessage request, int maxBytes, CancellationToken ct)
    {
        using var response = await SendAsync(request, ct).ConfigureAwait(false);

        if (response.Content.Headers.ContentLength is { } declared && declared > maxBytes)
        {
            throw new AiProviderException("response-too-large",
                $"'{Id.Value}' returned {declared} bytes, more than the {maxBytes} allowed.");
        }

        var bytes = await response.Content.ReadAsByteArrayAsync(ct).ConfigureAwait(false);

        // Checked again: a response with no Content-Length, or a dishonest one, gets past
        // the header check.
        if (bytes.Length > maxBytes)
        {
            throw new AiProviderException("response-too-large",
                $"'{Id.Value}' returned more than the {maxBytes} bytes allowed.");
        }

        return bytes;
    }

    /// <summary>
    /// Reads a failure body, capped, and never lets a failure while reading it replace the
    /// status code the caller actually needs to see.
    /// </summary>
    private static async Task<string?> ReadErrorBodyAsync(
        HttpResponseMessage response, CancellationToken ct)
    {
        try
        {
            return await response.Content.ReadAsStringAsync(ct).ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            return null;
        }
    }

    /// <summary>
    /// Validates a value that will be interpolated into a request path - a model name, an
    /// account segment.
    /// </summary>
    /// <remarks>
    /// Operator input reaching a request path is how a call ends up somewhere other than
    /// where it was meant to. Slashes are permitted only where a model identifier genuinely
    /// contains them (<c>@cf/black-forest-labs/flux-1-schnell</c>), and a dot segment is
    /// refused either way, because <c>..</c> is the whole attack.
    /// </remarks>
    protected static bool IsSafePathValue(string? value, bool allowSlashes, int maxLength = 120)
    {
        if (string.IsNullOrWhiteSpace(value) || value.Length > maxLength) return false;
        if (value[0] == '/' || value[^1] == '/') return false;

        foreach (var c in value)
        {
            var ok = char.IsAsciiLetterOrDigit(c) || c is '-' or '.' or '_' or '@' or ':'
                     || (allowSlashes && c == '/');

            if (!ok) return false;
        }

        return !value.Split('/').Any(segment => segment is "." or "..");
    }

    /// <summary>
    /// Turns a failure status into a coded exception, carrying the provider's own short
    /// error identifier when there is one and never its prose.
    /// </summary>
    protected AiProviderException Failure(HttpStatusCode status, string? payload)
    {
        var code = (int)status switch
        {
            400 => "bad-request",
            401 or 403 => "credential-rejected",
            // A prepaid plan with an empty wallet.
            402 => "billing-required",
            404 => "endpoint-or-model-not-found",
            408 => "timeout",
            413 => "request-too-large",
            422 => "bad-request",
            429 => "rate-limited",
            >= 500 => "provider-error",
            _ => $"http-{(int)status}"
        };

        var identifier = ShortErrorIdentifier(payload);
        if (code == "rate-limited"
            && identifier is not null
            && (identifier.Contains("PerDay", StringComparison.OrdinalIgnoreCase)
                || identifier.Contains("Daily", StringComparison.OrdinalIgnoreCase)))
        {
            code = "quota-exhausted";
        }
        else if (code == "bad-request"
            && identifier is not null
            && identifier.StartsWith("API_KEY_", StringComparison.OrdinalIgnoreCase))
        {
            code = "credential-rejected";
        }

        Logger.LogWarning(
            "AI provider {ProviderId} returned {StatusCode} ({Code}){Identifier}.",
            Id.Value, (int)status, code,
            identifier is null ? string.Empty : $" identifier={identifier}");

        return new AiProviderException(code,
            identifier is null
                ? $"'{Id.Value}' returned {(int)status}."
                : $"'{Id.Value}' returned {(int)status} ({identifier}).");
    }

    /// <summary>
    /// Pulls a machine-readable error identifier out of a failure body - the
    /// <c>model_not_found</c> that tells an operator what to fix.
    /// </summary>
    /// <remarks>
    /// Only <c>code</c>, <c>type</c> and <c>status</c> are read, and only when they are
    /// short and token-shaped. <c>message</c> is never read: providers put the offending
    /// input in it, and the offending input is the user's transcript.
    /// </remarks>
    internal static string? ShortErrorIdentifier(string? payload)
    {
        if (string.IsNullOrWhiteSpace(payload) || payload.Length > 64 * 1024) return null;

        try
        {
            using var document = JsonDocument.Parse(payload);

            var root = document.RootElement;
            if (root.ValueKind == JsonValueKind.Array && root.GetArrayLength() > 0)
            {
                root = root[0];
            }
            if (root.ValueKind != JsonValueKind.Object) return null;

            if (root.TryGetProperty("error", out var error) &&
                error.ValueKind == JsonValueKind.Object)
            {
                root = error;
            }

            // Google's details name the exact reason ("API_KEY_INVALID") under error.details[].reason,
            // or quota violation id ("GenerateRequestsPerDayPerProjectPerModel-FreeTier") under error.details[].violations[].quotaId.
            if (root.TryGetProperty("details", out var details) && details.ValueKind == JsonValueKind.Array)
            {
                foreach (var detail in details.EnumerateArray())
                {
                    if (detail.ValueKind != JsonValueKind.Object) continue;
                    if (detail.TryGetProperty("reason", out var reason)
                        && reason.ValueKind == JsonValueKind.String && IsTokenShaped(reason.GetString()))
                    {
                        return reason.GetString();
                    }
                    if (detail.TryGetProperty("violations", out var violations) && violations.ValueKind == JsonValueKind.Array)
                    {
                        foreach (var violation in violations.EnumerateArray())
                        {
                            if (violation.ValueKind == JsonValueKind.Object
                                && violation.TryGetProperty("quotaId", out var quotaId)
                                && quotaId.ValueKind == JsonValueKind.String
                                && IsTokenShaped(quotaId.GetString()))
                            {
                                return quotaId.GetString();
                            }
                        }
                    }
                }
            }

            // A word ("INVALID_ARGUMENT", "model_not_found") says what to fix; a number is usually the HTTP status again
            // (Google sends "code": 400 beside "status"), so a number is only the answer when there is no word.
            string? number = null;
            foreach (var name in (string[])["code", "type", "status"])
            {
                if (!root.TryGetProperty(name, out var value)) continue;

                if (value.ValueKind == JsonValueKind.String && IsTokenShaped(value.GetString())) return value.GetString();
                if (value.ValueKind == JsonValueKind.Number) number ??= value.ToString();
            }

            if (IsTokenShaped(number)) return number;
        }
        catch (JsonException)
        {
            // A failure body that is not JSON tells us nothing we are allowed to repeat.
        }

        return null;
    }

    /// <summary>An identifier, not a sentence: this is what keeps prose out of the log.</summary>
    private static bool IsTokenShaped(string? text) =>
        text is { Length: > 0 and <= 64 } &&
        text.All(c => char.IsAsciiLetterOrDigit(c) || c is '_' or '-' or '.');

    protected static readonly JsonSerializerOptions SerializerOptions = new()
    {
        DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
    };
}
