namespace AnimStudio.Infrastructure.Publishing;

/// <summary>
/// Publish to YouTube: an OAuth "Web application" client from Google Cloud Console with the
/// YouTube Data API v3 enabled. <see cref="ClientSecret"/> is a secret: set it with
/// <c>dotnet user-secrets set "YouTube:Publish:ClientSecret" "…"</c>, the
/// <c>YouTube__Publish__ClientSecret</c> environment variable, or Key Vault - never in
/// appsettings.json. <see cref="RedirectUri"/> must be listed, character for character,
/// under the client's "Authorized redirect URIs".
/// </summary>
public sealed class YouTubePublishOptions
{
    public const string Section = "YouTube:Publish";

    public string? ClientId { get; set; }
    public string? ClientSecret { get; set; }

    /// <summary>The app's <c>/youtube/callback</c> page, which hands the code to the API.</summary>
    public string RedirectUri { get; set; } = "http://localhost:4200/youtube/callback";

    /// <summary>Each request to Google sends this much of the file. Rounded to YouTube's 256 KiB granularity.</summary>
    public int ChunkSizeMegabytes { get; set; } = 8;

    public int MaxConcurrentUploads { get; set; } = 2;
    public int MaxUploadsPerUser { get; set; } = 3;

    /// <summary>How long a finished upload stays in the list.</summary>
    public int KeepFinishedHours { get; set; } = 24;

    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(ClientId)
        && !string.IsNullOrWhiteSpace(ClientSecret)
        && IsAllowedRedirect(RedirectUri);

    /// <summary>Google only accepts https redirects, except to the local machine.</summary>
    public static bool IsAllowedRedirect(string? uri) =>
        Uri.TryCreate(uri, UriKind.Absolute, out var parsed)
        && (parsed.Scheme == Uri.UriSchemeHttps || (parsed.Scheme == Uri.UriSchemeHttp && parsed.IsLoopback))
        && string.IsNullOrEmpty(parsed.Fragment);
}
