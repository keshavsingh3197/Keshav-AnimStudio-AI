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
    public virtual Task<AiProviderHealth> CheckHealthAsync(CancellationToken ct)
    {
        var options = ProviderOptions;

        if (options is null)
            return Task.FromResult(AiProviderHealth.Unhealthy("No configuration for this provider."));

        if (!options.Enabled)
            return Task.FromResult(AiProviderHealth.Unhealthy("Disabled."));

        if (RequiresApiKey && !_secrets.IsInstalled(Id))
            return Task.FromResult(AiProviderHealth.Unhealthy("No API key is installed."));

        try
        {
            _ = _clients.Create(Id);
            return Task.FromResult(AiProviderHealth.Healthy);
        }
        catch (AiEndpointException ex)
        {
            return Task.FromResult(AiProviderHealth.Unhealthy($"Endpoint rejected: {ex.Rejection}."));
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

    protected Task<string?> GetSecretAsync(CancellationToken ct) =>
        _secrets.GetSecretAsync(Id, ct);

    /// <summary>
    /// Attaches the key. Overridden by providers that do not use a bearer token.
    /// </summary>
    protected virtual void ApplyAuthentication(HttpRequestMessage request, string secret) =>
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", secret);

    /// <summary>
    /// Sends a request with the key attached, mapping every transport failure and failure
    /// status onto an <see cref="AiProviderException"/> the executor can record.
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
        var secret = RequiresApiKey ? await GetSecretAsync(ct).ConfigureAwait(false) : null;

        if (RequiresApiKey && string.IsNullOrEmpty(secret))
        {
            // Reachable despite IsConfigured: a key can be deleted between chain
            // composition and the call. A named code makes the chain fall through cleanly.
            request.Dispose();

            throw new AiProviderException("credential-missing",
                $"No API key is installed for '{Id.Value}'.");
        }

        if (secret is not null) ApplyAuthentication(request, secret);

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
            // Not the caller cancelling - HttpClient reports its own timeout this way.
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
            // Gemini's Prepay plan: a $0 wallet stops every key on the billing account.
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
    protected static string? ShortErrorIdentifier(string? payload)
    {
        if (string.IsNullOrWhiteSpace(payload) || payload.Length > 64 * 1024) return null;

        try
        {
            using var document = JsonDocument.Parse(payload);

            var root = document.RootElement;
            if (root.ValueKind != JsonValueKind.Object) return null;

            if (root.TryGetProperty("error", out var error) &&
                error.ValueKind == JsonValueKind.Object)
            {
                root = error;
            }

            foreach (var name in (string[])["code", "type", "status"])
            {
                if (!root.TryGetProperty(name, out var value)) continue;

                var text = value.ValueKind switch
                {
                    JsonValueKind.String => value.GetString(),
                    JsonValueKind.Number => value.ToString(),
                    _ => null
                };

                if (IsTokenShaped(text)) return text;
            }
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
