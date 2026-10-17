using System.Text.RegularExpressions;

namespace AnimStudio.Application.Publishing;

/// <summary>What the checkup knows about one video on the channel.</summary>
/// <param name="InPlaylist">Null when the channel's playlists couldn't be read, so no verdict is given.</param>
/// <param name="MadeForKids">Null when the audience was never declared.</param>
public sealed record YouTubeDetailsFacts(
    string Title,
    string Description,
    IReadOnlyList<string> Tags,
    bool? InPlaylist,
    bool? MadeForKids,
    bool IsShort);

/// <summary>One thing missing from a video's details. <c>Severity</c> is <c>high</c> or <c>low</c>.</summary>
public sealed record YouTubeDetailsIssue(string Code, string Severity, string Message);

/// <summary>
/// The details checkup: what a video on the channel is missing that viewers and search use -
/// a description, tags, hashtags, a playlist, a declared audience, a real title. Plain rules,
/// no network, so the page and the tests agree on what "complete" means.
/// </summary>
public static partial class YouTubeDetailsAudit
{
    /// <summary>Below this a description says next to nothing; above it, it's the creator's call.</summary>
    public const int ShortDescriptionChars = 80;

    public static IReadOnlyList<YouTubeDetailsIssue> Check(YouTubeDetailsFacts video)
    {
        var issues = new List<YouTubeDetailsIssue>();
        var description = video.Description.Trim();
        var title = video.Title.Trim();

        if (description.Length == 0)
            issues.Add(new("description-missing", "high", "No description."));
        else if (description.Length < ShortDescriptionChars)
            issues.Add(new("description-short", "low", "The description is only a line or two."));

        if (video.Tags.Count == 0)
            issues.Add(new("tags-missing", "high", "No tags."));

        if (!Hashtag().IsMatch(title + "\n" + description))
            issues.Add(new("hashtags-missing", video.IsShort ? "high" : "low",
                video.IsShort ? "No hashtags - add #shorts and a few topic hashtags." : "No hashtags."));

        if (video.InPlaylist == false)
            issues.Add(new("playlist-missing", "low", "Not in any playlist."));

        if (video.MadeForKids is null)
            issues.Add(new("audience-unset", "high", "The audience (made for kids or not) isn't set."));

        if (LooksLikeFileName(title))
            issues.Add(new("title-default", "high", "The title looks like a file name."));

        return issues;
    }

    /// <summary>A title left as the uploaded file's name, or the app's own placeholder.</summary>
    public static bool LooksLikeFileName(string title) =>
        title.Length == 0
        || FileExtension().IsMatch(title)
        || string.Equals(title, "AnimStudio video", StringComparison.OrdinalIgnoreCase)
        || PlaceholderTitle().IsMatch(title);

    [GeneratedRegex(@"(^|\s)#[\p{L}\p{M}\p{N}_]+")]
    private static partial Regex Hashtag();

    [GeneratedRegex(@"\.(mp4|mov|m4v|webm|mkv|avi)$", RegexOptions.IgnoreCase)]
    private static partial Regex FileExtension();

    /// <summary>"VID_20261017_1234", "IMG 1234", "Short 1", "video (3)".</summary>
    [GeneratedRegex(@"^((VID|IMG|PXL|MOV)[\s_-]?\d[\d_\s-]*|(short|video|clip|untitled)\s*[#(]?\d*\)?)$", RegexOptions.IgnoreCase)]
    private static partial Regex PlaceholderTitle();
}
