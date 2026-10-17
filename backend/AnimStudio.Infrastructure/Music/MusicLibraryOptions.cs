namespace AnimStudio.Infrastructure.Music;

/// <summary>
/// The royalty-free music catalogue behind the music picker. The Jamendo client id comes from
/// user-secrets locally (<c>dotnet user-secrets set "Music:JamendoClientId" ...</c>) and from
/// Key Vault / the <c>Music__JamendoClientId</c> environment variable when deployed - never
/// from a committed appsettings file.
/// </summary>
public sealed class MusicLibraryOptions
{
    public const string Section = "Music";

    /// <summary>From devportal.jamendo.com. Without it the picker says search isn't set up.</summary>
    public string? JamendoClientId { get; set; }

    /// <summary>Matches the audio upload ceiling, so an import is no larger than a file the user could upload.</summary>
    public int MaxDownloadMegabytes { get; set; } = 25;

    /// <summary>How long a result page is reused, so paging back and forth doesn't spend the API quota.</summary>
    public int CacheMinutes { get; set; } = 10;

    public bool IsConfigured => !string.IsNullOrWhiteSpace(JamendoClientId);
}
