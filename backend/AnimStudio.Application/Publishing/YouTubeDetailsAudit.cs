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

    /// <summary>YouTube ignores every hashtag on a video when the total passes 15 and treats heavy repetition as metadata spam.</summary>
    public const int MaxHashtagsPerVideo = 15;

    /// <summary>Mobile feeds and search results truncate titles after ~70 characters.</summary>
    public const int MaxVisibleTitleChars = 70;

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

        var hashtagCount = CountHashtags(title + "\n" + description);
        if (hashtagCount == 0)
            issues.Add(new("hashtags-missing", video.IsShort ? "high" : "low",
                video.IsShort ? "No hashtags - add #shorts and a few topic hashtags." : "No hashtags."));
        else if (hashtagCount > MaxHashtagsPerVideo)
            issues.Add(new("hashtag-stuffing", "high",
                $"Too many hashtags ({hashtagCount}): YouTube ignores all hashtags past {MaxHashtagsPerVideo} and flags stuffing under metadata spam."));

        if (HasDescriptionTagStuffing(description))
            issues.Add(new("description-tag-stuffing", "high",
                "Description contains a comma-separated keyword/tag dump, which violates YouTube metadata spam rules. Move keywords to the Tags field."));

        if (video.InPlaylist == false)
            issues.Add(new("playlist-missing", "low", "Not in any playlist."));

        if (video.MadeForKids is null)
            issues.Add(new("audience-unset", "high", "The audience (made for kids or not) isn't set."));

        if (YouTubeBrandKit.RetiredChannelUrls.Any(url => description.Contains(url, StringComparison.OrdinalIgnoreCase)))
            issues.Add(new("channel-link-old", "high", "Links to the channel's old address, which no longer opens."));

        if (LooksLikeFileName(title))
            issues.Add(new("title-default", "high", "The title looks like a file name."));
        else if (title.Length > MaxVisibleTitleChars)
            issues.Add(new("title-too-long", "low", $"Title is {title.Length} characters and cuts off on mobile feeds (put the core hook in the first 55 chars)."));

        if (HasReusedClue(title, description))
            issues.Add(new("reused-clue", "high",
                "Title looks like an unedited status/reupload clip with almost no original context in the description — risky under YouTube's Reused Content policy."));

        return issues;
    }

    public static int CountHashtags(string text) => Hashtag().Matches(text).Count;

    public static bool HasDescriptionTagStuffing(string description)
    {
        if (string.IsNullOrWhiteSpace(description)) return false;
        foreach (var rawLine in description.Split(['\r', '\n'], StringSplitOptions.RemoveEmptyEntries))
        {
            var line = rawLine.Trim();
            if (line.Length == 0) continue;
            if (line.StartsWith("http://", StringComparison.OrdinalIgnoreCase)
                || line.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
                continue;
            if (TagsLabelLine().IsMatch(line))
                return true;

            var parts = line.Split(',');
            if (parts.Length >= 6 && parts.Count(p => p.Trim().Length is >= 2 and <= 32) >= 6)
                return true;
        }
        return false;
    }

    public static bool HasReusedClue(string title, string description)
    {
        if (string.IsNullOrWhiteSpace(title)) return false;
        return ReusedClipPhrase().IsMatch(title) && description.Trim().Length < 160;
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

    [GeneratedRegex(@"^(?:tags|keywords|related\s+searches|queries)\s*:", RegexOptions.IgnoreCase)]
    private static partial Regex TagsLabelLine();

    [GeneratedRegex(@"\b(?:whatsapp\s*status|status\s*video|re-?upload|full\s*episode|movie\s*scene|movie\s*clip|tiktok\s*compilation|reels\s*compilation)\b", RegexOptions.IgnoreCase)]
    private static partial Regex ReusedClipPhrase();
}
