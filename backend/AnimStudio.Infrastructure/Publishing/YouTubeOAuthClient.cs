using System.Net;
using System.Net.Http.Headers;
using System.Security.Authentication;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AnimStudio.Infrastructure.Publishing;

public sealed class YouTubePublishException(string code, string message) : Exception(message)
{
    public string Code { get; } = code;
}

public sealed record GoogleTokens(string AccessToken, string? RefreshToken, int ExpiresInSeconds, string Scope);

public sealed record YouTubeChannelInfo(string Id, string Title, string? Handle, string? ThumbnailUrl);

/// <summary>
/// The OAuth 2.0 authorization-code flow against Google, with PKCE, plus the one read
/// needed to learn which channel was chosen on the consent screen.
/// <para>
/// Hosts are fixed. Tokens travel only in request bodies and the <c>Authorization</c>
/// header, never in a URL, and nothing here logs a request - only Google's status and
/// reason code.
/// </para>
/// </summary>
public sealed class YouTubeOAuthClient : IDisposable
{
    private const string AuthorizeUrl = "https://accounts.google.com/o/oauth2/v2/auth";
    private const string TokenUrl = "https://oauth2.googleapis.com/token";
    private const string RevokeUrl = "https://oauth2.googleapis.com/revoke";
    private const string ChannelsUrl = "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true";

    /// <summary>
    /// Upload is the scope that matters; readonly is only so <c>channels.list?mine=true</c>
    /// can say which channel the user picked. Nothing here can edit or delete videos.
    /// </summary>
    public const string Scopes = "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly";

    private readonly IOptionsMonitor<YouTubePublishOptions> _options;
    private readonly ILogger<YouTubeOAuthClient> _logger;
    private readonly HttpClient _http;

    public YouTubeOAuthClient(IOptionsMonitor<YouTubePublishOptions> options, ILogger<YouTubeOAuthClient> logger)
        : this(options, logger, null)
    {
    }

    /// <summary>Tests pass a handler; production builds one with TLS 1.2+ and no redirects.</summary>
    public YouTubeOAuthClient(IOptionsMonitor<YouTubePublishOptions> options, ILogger<YouTubeOAuthClient> logger, HttpMessageHandler? handler)
    {
        _options = options;
        _logger = logger;
        _http = new HttpClient(handler ?? new SocketsHttpHandler
        {
            PooledConnectionLifetime = TimeSpan.FromMinutes(5),
            AutomaticDecompression = DecompressionMethods.All,
            SslOptions = { EnabledSslProtocols = SslProtocols.Tls12 | SslProtocols.Tls13 },
            AllowAutoRedirect = false
        })
        {
            Timeout = TimeSpan.FromSeconds(20)
        };
    }

    public bool IsConfigured => _options.CurrentValue.IsConfigured;

    public string BuildAuthorizationUrl(string state, string codeChallenge)
    {
        var options = RequireConfigured();
        var query = new Dictionary<string, string>
        {
            ["client_id"] = options.ClientId!.Trim(),
            ["redirect_uri"] = options.RedirectUri,
            ["response_type"] = "code",
            ["scope"] = Scopes,
            // offline + consent: a refresh token every time, even for a channel connected before.
            ["access_type"] = "offline",
            ["prompt"] = "consent select_account",
            ["include_granted_scopes"] = "false",
            ["state"] = state,
            ["code_challenge"] = codeChallenge,
            ["code_challenge_method"] = "S256"
        };
        return AuthorizeUrl + "?" + string.Join("&", query.Select(p => $"{p.Key}={Uri.EscapeDataString(p.Value)}"));
    }

    public Task<GoogleTokens> ExchangeCodeAsync(string code, string codeVerifier, CancellationToken ct)
    {
        var options = RequireConfigured();
        return TokenRequestAsync(new Dictionary<string, string>
        {
            ["grant_type"] = "authorization_code",
            ["code"] = code,
            ["code_verifier"] = codeVerifier,
            ["client_id"] = options.ClientId!.Trim(),
            ["client_secret"] = options.ClientSecret!.Trim(),
            ["redirect_uri"] = options.RedirectUri
        }, ct);
    }

    /// <exception cref="YouTubePublishException">
    /// <c>youtube-reconnect</c> when Google no longer honours the refresh token.
    /// </exception>
    public Task<GoogleTokens> RefreshAsync(string refreshToken, CancellationToken ct)
    {
        var options = RequireConfigured();
        return TokenRequestAsync(new Dictionary<string, string>
        {
            ["grant_type"] = "refresh_token",
            ["refresh_token"] = refreshToken,
            ["client_id"] = options.ClientId!.Trim(),
            ["client_secret"] = options.ClientSecret!.Trim()
        }, ct);
    }

    /// <summary>Best effort: a disconnect still removes the saved token if Google can't be reached.</summary>
    public async Task RevokeAsync(string token, CancellationToken ct)
    {
        try
        {
            using var content = new FormUrlEncodedContent(new Dictionary<string, string> { ["token"] = token });
            using var response = await _http.PostAsync(RevokeUrl, content, ct).ConfigureAwait(false);
            if (!response.IsSuccessStatusCode)
                _logger.LogInformation("Google answered {Status} to a token revocation", (int)response.StatusCode);
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException && !ct.IsCancellationRequested)
        {
            _logger.LogWarning("Google could not be reached to revoke a token: {ErrorType}", ex.GetType().Name);
        }
    }

    public async Task<YouTubeChannelInfo> GetMyChannelAsync(string accessToken, CancellationToken ct)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, ChannelsUrl);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        using var response = await SendAsync(request, ct).ConfigureAwait(false);
        if (!response.IsSuccessStatusCode)
        {
            var reason = await GoogleErrors.ReadReasonAsync(response, ct).ConfigureAwait(false);
            _logger.LogWarning("YouTube channels.list answered {Status} ({Reason})", (int)response.StatusCode, reason ?? "unknown");
            throw new YouTubePublishException("youtube-channel-failed", "YouTube didn't say which channel was chosen. Try connecting again.");
        }

        await using var body = await response.Content.ReadAsStreamAsync(ct).ConfigureAwait(false);
        using var document = await JsonDocument.ParseAsync(body, cancellationToken: ct).ConfigureAwait(false);
        return ParseChannel(document.RootElement)
            ?? throw new YouTubePublishException("youtube-no-channel",
                "That Google account has no YouTube channel yet. Create one on youtube.com, then connect again.");
    }

    public static YouTubeChannelInfo? ParseChannel(JsonElement root)
    {
        if (root.ValueKind != JsonValueKind.Object || !root.TryGetProperty("items", out var items)
            || items.ValueKind != JsonValueKind.Array || items.GetArrayLength() == 0) return null;

        var item = items[0];
        var id = item.TryGetProperty("id", out var idElement) ? idElement.GetString() : null;
        if (string.IsNullOrWhiteSpace(id)) return null;

        item.TryGetProperty("snippet", out var snippet);
        string? Text(string name) =>
            snippet.ValueKind == JsonValueKind.Object && snippet.TryGetProperty(name, out var v) ? v.GetString() : null;

        string? thumbnail = null;
        if (snippet.ValueKind == JsonValueKind.Object && snippet.TryGetProperty("thumbnails", out var thumbs)
            && thumbs.ValueKind == JsonValueKind.Object)
        {
            foreach (var size in new[] { "default", "medium", "high" })
            {
                if (thumbs.TryGetProperty(size, out var t) && t.TryGetProperty("url", out var url)
                    && Uri.TryCreate(url.GetString(), UriKind.Absolute, out var parsed) && parsed.Scheme == Uri.UriSchemeHttps)
                {
                    thumbnail = parsed.ToString();
                    break;
                }
            }
        }

        return new YouTubeChannelInfo(id, Text("title") ?? id, Text("customUrl"), thumbnail);
    }

    private async Task<GoogleTokens> TokenRequestAsync(Dictionary<string, string> form, CancellationToken ct)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, TokenUrl) { Content = new FormUrlEncodedContent(form) };
        using var response = await SendAsync(request, ct).ConfigureAwait(false);

        await using var body = await response.Content.ReadAsStreamAsync(ct).ConfigureAwait(false);
        JsonDocument document;
        try
        {
            document = await JsonDocument.ParseAsync(body, cancellationToken: ct).ConfigureAwait(false);
        }
        catch (JsonException)
        {
            _logger.LogWarning("Google's token endpoint answered {Status} with a body that isn't JSON", (int)response.StatusCode);
            throw new YouTubePublishException("youtube-token-failed", "Google didn't complete the sign-in. Try connecting again.");
        }

        using (document)
        {
            var root = document.RootElement;
            if (!response.IsSuccessStatusCode)
            {
                var error = root.TryGetProperty("error", out var e) && e.ValueKind == JsonValueKind.String ? e.GetString() : null;
                var safe = error is { Length: <= 64 } && error.All(c => char.IsAsciiLetterOrDigit(c) || c == '_') ? error : "unknown";
                _logger.LogWarning("Google's token endpoint answered {Status} ({Error})", (int)response.StatusCode, safe);

                throw safe switch
                {
                    "invalid_grant" => new YouTubePublishException("youtube-reconnect",
                        "YouTube access for this channel has expired or was removed. Connect the channel again."),
                    "invalid_client" or "unauthorized_client" => new YouTubePublishException("youtube-not-configured",
                        "The server's Google OAuth client is not set up correctly. Ask an admin to check YouTube:Publish."),
                    _ => new YouTubePublishException("youtube-token-failed", "Google didn't complete the sign-in. Try connecting again.")
                };
            }

            var accessToken = root.TryGetProperty("access_token", out var at) ? at.GetString() : null;
            if (string.IsNullOrEmpty(accessToken))
                throw new YouTubePublishException("youtube-token-failed", "Google didn't complete the sign-in. Try connecting again.");

            return new GoogleTokens(
                accessToken,
                root.TryGetProperty("refresh_token", out var rt) ? rt.GetString() : null,
                root.TryGetProperty("expires_in", out var exp) && exp.TryGetInt32(out var seconds) ? seconds : 3600,
                root.TryGetProperty("scope", out var scope) ? scope.GetString() ?? string.Empty : string.Empty);
        }
    }

    private async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct)
    {
        try
        {
            return await _http.SendAsync(request, ct).ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException && !ct.IsCancellationRequested)
        {
            _logger.LogWarning("Google could not be reached: {ErrorType}", ex.GetType().Name);
            throw new YouTubePublishException("youtube-unreachable", "Google couldn't be reached. Check the server's internet connection and try again.");
        }
    }

    private YouTubePublishOptions RequireConfigured()
    {
        var options = _options.CurrentValue;
        if (!options.IsConfigured)
            throw new YouTubePublishException("youtube-not-configured",
                "Publishing to YouTube isn't set up on this server. Ask an admin to set YouTube:Publish:ClientId, ClientSecret and RedirectUri.");
        return options;
    }

    public void Dispose() => _http.Dispose();
}

internal static class GoogleErrors
{
    /// <summary>Google's first <c>error.errors[].reason</c>, if it is a plain identifier safe to log.</summary>
    public static async Task<string?> ReadReasonAsync(HttpResponseMessage response, CancellationToken ct)
    {
        try
        {
            await using var body = await response.Content.ReadAsStreamAsync(ct).ConfigureAwait(false);
            using var document = await JsonDocument.ParseAsync(body, cancellationToken: ct).ConfigureAwait(false);
            if (document.RootElement.TryGetProperty("error", out var error) && error.ValueKind == JsonValueKind.Object
                && error.TryGetProperty("errors", out var errors) && errors.ValueKind == JsonValueKind.Array
                && errors.GetArrayLength() > 0 && errors[0].TryGetProperty("reason", out var reason))
            {
                var text = reason.GetString();
                return text is { Length: <= 64 } && text.All(char.IsAsciiLetterOrDigit) ? text : null;
            }
        }
        catch (JsonException)
        {
            // Not JSON; the status says enough.
        }
        return null;
    }
}
