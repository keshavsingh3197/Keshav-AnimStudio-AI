using System.Text;

namespace AnimStudio.Application.Publishing;

/// <summary>What the user filled in on the publish dialog, before any checks.</summary>
public sealed record YouTubeVideoMetadata
{
    public string? Title { get; init; }
    public string? Description { get; init; }
    public IReadOnlyList<string>? Tags { get; init; }
    public string? CategoryId { get; init; }

    /// <summary><c>public</c>, <c>unlisted</c> or <c>private</c>.</summary>
    public string? Privacy { get; init; }

    /// <summary>YouTube requires an explicit answer, so null is an error rather than a default.</summary>
    public bool? MadeForKids { get; init; }

    public bool NotifySubscribers { get; init; } = true;
}

/// <summary>The metadata after trimming and normalizing, exactly as it will be sent.</summary>
public sealed record NormalizedYouTubeMetadata(
    string Title,
    string Description,
    IReadOnlyList<string> Tags,
    string CategoryId,
    string Privacy,
    bool MadeForKids,
    bool NotifySubscribers);

/// <summary>The facts about the file that YouTube's own limits depend on.</summary>
public sealed record YouTubeVideoFacts(
    bool IsCompleted,
    bool HasOutput,
    long? SizeBytes,
    double? DurationSeconds,
    int? Width,
    int? Height)
{
    public bool IsVertical => Width is > 0 && Height is > 0 && Height > Width;
}

public sealed record YouTubeCheck(string Field, string Code, string Message);

public sealed record YouTubePublishValidation(
    NormalizedYouTubeMetadata? Normalized,
    IReadOnlyList<YouTubeCheck> Errors,
    IReadOnlyList<YouTubeCheck> Warnings)
{
    public bool IsValid => Errors.Count == 0 && Normalized is not null;
}

/// <summary>
/// Checks a video and its details against YouTube's documented limits before anything is
/// sent, so a problem shows up next to the field it belongs to instead of as a failed
/// upload after the whole file has gone over the wire. Errors stop the publish; warnings
/// are things YouTube accepts but the user probably wants to know (a Short that is too
/// long to be shown as one, a video over the unverified-account limit).
/// </summary>
public static class YouTubePublishValidator
{
    public const int MaxTitleLength = 100;
    public const int MaxDescriptionBytes = 5000;
    public const int MaxTagsLength = 500;

    /// <summary>Not a YouTube limit: a bound on what this endpoint accepts at all.</summary>
    public const int MaxTagCount = 60;

    public const long MaxFileBytes = 256L * 1024 * 1024 * 1024;
    public const double MaxDurationSeconds = 12 * 60 * 60;
    public const double UnverifiedMaxSeconds = 15 * 60;
    public const double MaxShortSeconds = 3 * 60;

    public static readonly IReadOnlyList<string> Privacies = ["public", "unlisted", "private"];

    /// <summary>The categories YouTube lets an upload be assigned to (videoCategories.list, assignable=true).</summary>
    public static readonly IReadOnlyDictionary<string, string> Categories = new Dictionary<string, string>
    {
        ["1"] = "Film & Animation",
        ["2"] = "Autos & Vehicles",
        ["10"] = "Music",
        ["15"] = "Pets & Animals",
        ["17"] = "Sports",
        ["19"] = "Travel & Events",
        ["20"] = "Gaming",
        ["22"] = "People & Blogs",
        ["23"] = "Comedy",
        ["24"] = "Entertainment",
        ["25"] = "News & Politics",
        ["26"] = "Howto & Style",
        ["27"] = "Education",
        ["28"] = "Science & Technology",
        ["29"] = "Nonprofits & Activism"
    };

    public static YouTubePublishValidation Validate(YouTubeVideoMetadata? input, YouTubeVideoFacts video)
    {
        var errors = new List<YouTubeCheck>();
        var warnings = new List<YouTubeCheck>();

        CheckVideo(video, errors, warnings);

        if (input is null)
        {
            errors.Add(new("metadata", "metadata-missing", "Video details are required."));
            return new(null, errors, warnings);
        }

        var title = Clean(input.Title);
        if (title.Length == 0)
            errors.Add(new("title", "title-missing", "A title is required."));
        else if (title.Length > MaxTitleLength)
            errors.Add(new("title", "title-too-long", $"Titles can be at most {MaxTitleLength} characters (this one is {title.Length})."));
        if (HasAngleBrackets(title))
            errors.Add(new("title", "title-invalid-character", "YouTube doesn't allow < or > in a title."));

        var description = Clean(input.Description, keepNewLines: true);
        var descriptionBytes = Encoding.UTF8.GetByteCount(description);
        if (descriptionBytes > MaxDescriptionBytes)
            errors.Add(new("description", "description-too-long",
                $"Descriptions can be at most {MaxDescriptionBytes} bytes (this one is {descriptionBytes}; emoji and non-Latin letters count as more than one)."));
        if (HasAngleBrackets(description))
            errors.Add(new("description", "description-invalid-character", "YouTube doesn't allow < or > in a description."));

        var tags = NormalizeTags(input.Tags, errors);

        var categoryId = (input.CategoryId ?? string.Empty).Trim();
        if (!Categories.ContainsKey(categoryId))
            errors.Add(new("categoryId", "category-invalid", "Choose a category from the list."));

        var privacy = (input.Privacy ?? string.Empty).Trim().ToLowerInvariant();
        if (!Privacies.Contains(privacy))
            errors.Add(new("privacy", "privacy-invalid", "Visibility must be Public, Unlisted or Private."));

        if (input.MadeForKids is null)
            errors.Add(new("madeForKids", "audience-missing",
                "Say whether this video is made for kids - YouTube requires it for every upload."));

        if (errors.Count > 0) return new(null, errors, warnings);

        return new(
            new NormalizedYouTubeMetadata(title, description, tags, categoryId, privacy, input.MadeForKids!.Value, input.NotifySubscribers),
            errors, warnings);
    }

    /// <summary>The file-only half, for the dialog to show before anything is typed.</summary>
    public static IReadOnlyList<YouTubeCheck> CheckVideo(YouTubeVideoFacts video, out IReadOnlyList<YouTubeCheck> warnings)
    {
        var errors = new List<YouTubeCheck>();
        var found = new List<YouTubeCheck>();
        CheckVideo(video, errors, found);
        warnings = found;
        return errors;
    }

    /// <summary>
    /// YouTube counts the tag field as it would be typed: tags joined by commas, with a tag
    /// that contains a space counted with the quotes it needs.
    /// </summary>
    public static int TagsLength(IEnumerable<string> tags)
    {
        var total = 0;
        var count = 0;
        foreach (var tag in tags)
        {
            total += tag.Length + (tag.Contains(' ') ? 2 : 0);
            count++;
        }
        return total + Math.Max(0, count - 1);
    }

    private static void CheckVideo(YouTubeVideoFacts video, List<YouTubeCheck> errors, List<YouTubeCheck> warnings)
    {
        if (!video.IsCompleted || !video.HasOutput)
        {
            errors.Add(new("video", "video-not-ready", "This render hasn't finished, so there is no video to publish yet."));
            return;
        }

        if (video.SizeBytes is <= 0)
            errors.Add(new("video", "video-empty", "The rendered file is empty."));
        else if (video.SizeBytes > MaxFileBytes)
            errors.Add(new("video", "video-too-large", "YouTube accepts files up to 256 GB."));

        if (video.DurationSeconds is not { } seconds)
        {
            warnings.Add(new("video", "video-length-unknown", "The video's length wasn't recorded, so the length limits couldn't be checked."));
            return;
        }

        if (seconds <= 0)
            errors.Add(new("video", "video-empty", "The rendered video has no length."));
        else if (seconds > MaxDurationSeconds)
            errors.Add(new("video", "video-too-long", "YouTube accepts videos up to 12 hours long."));
        else if (seconds > UnverifiedMaxSeconds)
            warnings.Add(new("video", "video-needs-verified-account",
                "This video is longer than 15 minutes. It only uploads if the channel is verified (youtube.com/verify)."));

        if (video.IsVertical && seconds > MaxShortSeconds)
            warnings.Add(new("video", "short-too-long",
                "This is a vertical video longer than 3 minutes, so YouTube will show it as a regular video, not a Short."));
    }

    private static List<string> NormalizeTags(IReadOnlyList<string>? input, List<YouTubeCheck> errors)
    {
        var tags = new List<string>();
        if (input is null) return tags;

        if (input.Count > MaxTagCount)
        {
            errors.Add(new("tags", "tags-too-many", $"Use at most {MaxTagCount} tags."));
            return tags;
        }

        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var raw in input)
        {
            // "#Wildlife" is how tags are often pasted from a caption; the tag itself is "Wildlife".
            var tag = Clean(raw).TrimStart('#').Trim();
            if (tag.Length == 0) continue;

            if (HasAngleBrackets(tag) || tag.Contains(',') || tag.Contains('"'))
            {
                errors.Add(new("tags", "tag-invalid-character", "Tags can't contain <, >, commas or quotes."));
                return tags;
            }

            if (seen.Add(tag)) tags.Add(tag);
        }

        var length = TagsLength(tags);
        if (length > MaxTagsLength)
            errors.Add(new("tags", "tags-too-long", $"Tags can total at most {MaxTagsLength} characters (these are {length})."));

        return tags;
    }

    private static bool HasAngleBrackets(string value) => value.Contains('<') || value.Contains('>');

    /// <summary>Trims, and drops control characters YouTube would reject (keeping line breaks in a description).</summary>
    private static string Clean(string? value, bool keepNewLines = false)
    {
        if (string.IsNullOrEmpty(value)) return string.Empty;

        var builder = new StringBuilder(value.Length);
        foreach (var c in value.Replace("\r\n", "\n"))
        {
            if (c == '\n' && keepNewLines) builder.Append(c);
            else if (char.IsControl(c)) builder.Append(c is '\t' or '\n' ? ' ' : '\0');
            else builder.Append(c);
        }
        return builder.Replace("\0", string.Empty).ToString().Trim();
    }
}
