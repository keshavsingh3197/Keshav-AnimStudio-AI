using System.Net;
using System.Text;
using System.Text.Json;
using AnimStudio.Application.Options;
using Microsoft.Extensions.Options;

namespace AnimStudio.Api.Security;

/// <summary>What the identity service answered: a status and the body as it came.</summary>
public sealed record IdpReply(int Status, string Body)
{
    public bool IsSuccess => Status is >= 200 and < 300;

    /// <summary>The body parsed, or null when it isn't JSON. Dispose it.</summary>
    public JsonDocument? Json()
    {
        if (string.IsNullOrWhiteSpace(Body)) return null;
        try
        {
            return JsonDocument.Parse(Body);
        }
        catch (JsonException)
        {
            return null;
        }
    }

    /// <summary>The identity service's own one-line error, when it sent one.</summary>
    public string? ErrorText()
    {
        using var doc = Json();
        if (doc is null || doc.RootElement.ValueKind != JsonValueKind.Object) return null;
        foreach (var name in new[] { "error", "message", "detail", "title" })
        {
            if (doc.RootElement.TryGetProperty(name, out var value) && value.ValueKind == JsonValueKind.String)
                return value.GetString();
        }
        return null;
    }
}

/// <summary>
/// The one place AnimStudio talks to the central identity service about people: the sign-up queue
/// and the accounts it creates. Everything else about identity (sign-in, sessions) stays in
/// <c>AuthController</c>.
/// </summary>
/// <remarks>
/// The address is fixed by configuration - never by a request - and every id that goes into a URL
/// is checked before it gets here. An administrator's own bearer token is passed through, so the
/// identity service decides, with its own rules, whether that person may do what is asked; this
/// class adds no authority of its own.
/// </remarks>
public sealed class StudioIdentityClient(IHttpClientFactory httpFactory, IOptionsMonitor<AdminOptions> options, ILogger<StudioIdentityClient> logger)
{
    private static readonly JsonSerializerOptions JsonOpts = new(JsonSerializerDefaults.Web);
    private static readonly TimeSpan Timeout = TimeSpan.FromSeconds(20);

    /// <summary>The identity service for this environment, as <c>AuthController</c> resolves it.</summary>
    public string BaseUrl => options.CurrentValue.Jwt.Issuer == "keshavsingh-idp"
        ? "https://id.keshavsingh.in"
        : "http://localhost:5000";

    /// <param name="forwardBearer">Pass the caller's own bearer token (admin calls); false for the public sign-up.</param>
    public async Task<IdpReply> SendAsync(
        HttpMethod method, string path, object? body, HttpContext http, bool forwardBearer, CancellationToken ct)
    {
        using var msg = new HttpRequestMessage(method, $"{BaseUrl}{path}");
        if (body is not null)
            msg.Content = new StringContent(JsonSerializer.Serialize(body, JsonOpts), Encoding.UTF8, "application/json");

        if (forwardBearer)
        {
            var auth = http.Request.Headers.Authorization.ToString();
            if (!auth.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                return new IdpReply((int)HttpStatusCode.Unauthorized, string.Empty);
            msg.Headers.TryAddWithoutValidation("Authorization", auth);
        }

        if (http.Connection.RemoteIpAddress is { } ip) msg.Headers.TryAddWithoutValidation("X-Forwarded-For", ip.ToString());
        if (http.Request.Headers.UserAgent.ToString() is { Length: > 0 } ua) msg.Headers.TryAddWithoutValidation("User-Agent", ua);

        using var timeout = CancellationTokenSource.CreateLinkedTokenSource(ct);
        timeout.CancelAfter(Timeout);
        try
        {
            var client = httpFactory.CreateClient("IdP");
            using var resp = await client.SendAsync(msg, timeout.Token).ConfigureAwait(false);
            var content = await resp.Content.ReadAsStringAsync(timeout.Token).ConfigureAwait(false);
            return new IdpReply((int)resp.StatusCode, content);
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException && !ct.IsCancellationRequested)
        {
            logger.LogWarning(ex, "The identity service could not be reached for {Method} {Path}.", method, path);
            return new IdpReply((int)HttpStatusCode.ServiceUnavailable, string.Empty);
        }
    }
}
