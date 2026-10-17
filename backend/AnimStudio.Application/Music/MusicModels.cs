using AnimStudio.Domain.Assets;

namespace AnimStudio.Application.Music;

/// <summary>How a result list is ordered. Trending is this week's plays; Top is all time.</summary>
public enum MusicSort { Trending = 0, PopularMonth = 1, Top = 2, Newest = 3, BestMatch = 4 }

/// <summary>A search, already checked against <see cref="MusicFilters"/>.</summary>
public sealed record MusicSearchQuery(
    string? Text,
    string? Genre,
    string? Mood,
    string? Tempo,
    bool InstrumentalOnly,
    int? MinSeconds,
    int? MaxSeconds,
    MusicSort Sort,
    int Page,
    /// <summary>False asks the provider to leave out non-commercial tracks (a monetized project).</summary>
    bool IncludeNonCommercial);

/// <summary>A Creative Commons licence, read from its deed URL.</summary>
public sealed record MusicLicense(
    string Code,
    string? Version,
    string? Url,
    bool NonCommercial,
    bool NoDerivatives,
    bool ShareAlike,
    bool PublicDomain)
{
    /// <summary>The most restrictive term wins, so a filter on the class never under-reports.</summary>
    public LicenseClass Class =>
        PublicDomain ? LicenseClass.PublicDomain
        : NoDerivatives ? LicenseClass.NoDerivatives
        : NonCommercial ? LicenseClass.NonCommercial
        : ShareAlike ? LicenseClass.ShareAlike
        : Code.Length > 0 ? LicenseClass.AttributionOnly
        : LicenseClass.Unknown;
}

public sealed record MusicTrack(
    string Provider,
    string Id,
    string Title,
    string Artist,
    double DurationSeconds,
    string? ImageUrl,
    /// <summary>A streamable MP3 on the provider's own host, for the browser to preview.</summary>
    string? PreviewUrl,
    string? PageUrl,
    MusicLicense License,
    IReadOnlyList<string> Genres,
    IReadOnlyList<string> Moods,
    IReadOnlyList<string> Instruments,
    bool Instrumental,
    string? Tempo,
    string? ReleaseDate,
    /// <summary>Server-side only: never sent to the browser.</summary>
    string? DownloadUrl)
{
    public bool Downloadable => DownloadUrl is not null;
}

public sealed record MusicSearchPage(IReadOnlyList<MusicTrack> Tracks, int Page, bool HasMore);
