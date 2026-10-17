using System.Text;
using System.Text.Json;
using AnimStudio.Application.Ai;
using AnimStudio.Domain.Scenes;

namespace AnimStudio.Application.Publishing;

/// <summary>A suggested title, description and tags for the publish dialog to fill in.</summary>
public sealed record YouTubeMetadataSuggestion(string Title, string Description, IReadOnlyList<string> Tags)
{
    /// <summary>Other titles to choose from, <see cref="Title"/> not among them. Empty from a v1 prompt.</summary>
    public IReadOnlyList<string> TitleOptions { get; init; } = [];

    /// <summary>Other descriptions in different styles, <see cref="Description"/> not among them. Empty before v3.</summary>
    public IReadOnlyList<string> DescriptionOptions { get; init; } = [];

    /// <summary>More tags to pick from, none of them already in <see cref="Tags"/>. Empty before v3.</summary>
    public IReadOnlyList<string> TagIdeas { get; init; } = [];
}

/// <summary>
/// Asks the configured text model (the built-in <c>video-metadata</c> prompt) for a title,
/// description and tags, from what the project already knows about itself: its name, its
/// description and the words spoken in its scenes.
/// <para>
/// The model's answer is untrusted. It only ever fills fields in the publish dialog, where
/// the user reads and edits it, and the publish itself runs it through
/// <see cref="YouTubePublishValidator"/> like anything typed by hand.
/// </para>
/// </summary>
public static class YouTubeMetadataSuggester
{
    public const string TemplateKey = BuiltInPrompts.VideoMetadata;

    /// <summary>Enough of a script to say what the video is about; the prompt fences anything longer anyway.</summary>
    public const int MaxSummaryChars = 6_000;

    /// <summary>Languages the prompt is asked to write in; anything else falls back to English.</summary>
    public static readonly IReadOnlySet<string> Languages = new HashSet<string>(StringComparer.Ordinal) { "en", "hi" };

    /// <summary>The longest creator brief sent to the model.</summary>
    public const int MaxBriefChars = 1_000;

    /// <summary>
    /// The tones the dialog offers, by id. An allowlist: the id comes from the client, and only
    /// this server-side wording ever reaches the prompt.
    /// </summary>
    public static readonly IReadOnlyDictionary<string, string> Tones = new Dictionary<string, string>(StringComparer.Ordinal)
    {
        ["auto"] = "whatever suits the material best",
        ["funny"] = "funny and playful - light jokes, witty wording, a smile in the title",
        ["devotional"] = "devotional and respectful - warm, reverent, never flippant",
        ["emotional"] = "emotional and heartfelt",
        ["dramatic"] = "dramatic and suspenseful, building curiosity",
        ["informative"] = "clear and informative, like a good explainer",
        ["energetic"] = "high-energy and hype, short punchy phrases",
        ["kids"] = "simple, cheerful and suitable for children",
        ["motivational"] = "motivational and uplifting",
        ["clickbait-free"] = "honest and plain - no exaggeration, no all-caps, no clickbait",
    };

    /// <summary>The tone's wording for the prompt; an unknown id reads as "auto".</summary>
    public static string ToneText(string? toneId) =>
        toneId is not null && Tones.TryGetValue(toneId, out var text) ? text : Tones["auto"];

    /// <summary>
    /// A user's brief made safe to fence into a prompt: control characters dropped, whitespace
    /// collapsed, cut to <see cref="MaxBriefChars"/>. Empty when there is nothing left.
    /// </summary>
    public static string CleanBrief(string? brief)
    {
        if (string.IsNullOrWhiteSpace(brief)) return string.Empty;
        var sb = new StringBuilder(Math.Min(brief.Length, MaxBriefChars));
        var lastWasSpace = false;
        foreach (var ch in brief)
        {
            if (sb.Length >= MaxBriefChars) break;
            if (char.IsWhiteSpace(ch) || char.IsControl(ch))
            {
                if (!lastWasSpace && sb.Length > 0) sb.Append(' ');
                lastWasSpace = true;
                continue;
            }
            sb.Append(ch);
            lastWasSpace = false;
        }
        return sb.ToString().Trim();
    }

    /// <summary>The material the prompt describes: name, description, chapters and the spoken script.</summary>
    public static string BuildSummary(string? projectName, string? projectDescription, IEnumerable<Scene> scenes,
        IEnumerable<string>? chapterLabels, IEnumerable<string>? onScreenText = null, IEnumerable<string>? clipLabels = null)
    {
        var sb = new StringBuilder();
        if (!string.IsNullOrWhiteSpace(projectName)) sb.Append("Project name: ").Append(projectName.Trim()).Append('\n');
        if (!string.IsNullOrWhiteSpace(projectDescription)) sb.Append("About: ").Append(projectDescription.Trim()).Append('\n');

        var chapters = chapterLabels?.Where(l => !string.IsNullOrWhiteSpace(l)).ToList() ?? [];
        if (chapters.Count > 0) sb.Append("Chapters: ").Append(string.Join("; ", chapters)).Append('\n');

        // A clip edit's clip names are usually the best account of what is on screen.
        var clips = clipLabels?.Where(l => !string.IsNullOrWhiteSpace(l)).Select(l => l.Trim()).Take(60).ToList() ?? [];
        if (clips.Count > 0)
        {
            var joined = string.Join("; ", clips);
            if (joined.Length > MaxSummaryChars / 3) joined = joined[..(MaxSummaryChars / 3)];
            sb.Append("Clips shown, in order: ").Append(joined).Append('\n');
        }

        // A clip edit has no script, but its captions say what the video is about.
        var captions = onScreenText?
            .Select(t => t?.Trim())
            .OfType<string>()
            .Where(t => t.Length > 0)
            .Distinct(StringComparer.Ordinal)
            .ToList() ?? [];
        if (captions.Count > 0)
        {
            var joined = string.Join(" / ", captions);
            if (joined.Length > MaxSummaryChars / 2) joined = joined[..(MaxSummaryChars / 2)];
            sb.Append("On-screen text: ").Append(joined).Append('\n');
        }

        var spoken = new StringBuilder();
        foreach (var scene in scenes.Where(s => s.Status == SceneStatus.Active).OrderBy(s => s.OrderKey))
        {
            if (!string.IsNullOrWhiteSpace(scene.Title)) spoken.Append('[').Append(scene.Title.Trim()).Append("] ");
            foreach (var line in scene.Dialogue.OrderBy(d => d.Index))
            {
                if (string.IsNullOrWhiteSpace(line.Text)) continue;
                if (!string.IsNullOrWhiteSpace(line.SpeakerLabel)) spoken.Append(line.SpeakerLabel.Trim()).Append(": ");
                spoken.Append(line.Text.Trim()).Append('\n');
            }
            if (spoken.Length >= MaxSummaryChars) break;
        }
        if (spoken.Length > 0)
            sb.Append("Script:\n").Append(spoken.Length > MaxSummaryChars ? spoken.ToString(0, MaxSummaryChars) : spoken.ToString());

        return sb.ToString().Trim();
    }

    /// <summary>
    /// The model's JSON as a suggestion fit for the dialog, or null when it holds no usable
    /// title. The executor has already checked the shape against the template's schema; this
    /// checks the values against YouTube's rules, dropping what can't be fixed.
    /// </summary>
    public static YouTubeMetadataSuggestion? Parse(string? json)
    {
        JsonDocument doc;
        try
        {
            doc = JsonDocument.Parse(AiJsonResponse.Unwrap(json));
        }
        catch (JsonException)
        {
            return null;
        }

        using (doc)
        {
            if (doc.RootElement.ValueKind != JsonValueKind.Object) return null;

            var title = StripAngles(AiOutputSanitizer.ToSafeLine(ReadString(doc.RootElement, "title"),
                YouTubePublishValidator.MaxTitleLength));
            if (title is null) return null;

            var description = StripAngles(AiOutputSanitizer.ToSafeText(ReadString(doc.RootElement, "description"), 3000)) ?? string.Empty;

            var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            var tags = ReadTags(doc.RootElement, "tags", seen);
            var tagIdeas = ReadTags(doc.RootElement, "tagIdeas", seen);

            var options = new List<string>();
            if (doc.RootElement.TryGetProperty("titleOptions", out var optionArray) && optionArray.ValueKind == JsonValueKind.Array)
            {
                foreach (var item in optionArray.EnumerateArray().Take(5))
                {
                    if (item.ValueKind != JsonValueKind.String) continue;
                    var option = StripAngles(AiOutputSanitizer.ToSafeLine(item.GetString(), YouTubePublishValidator.MaxTitleLength));
                    if (option is null || string.Equals(option, title, StringComparison.OrdinalIgnoreCase)) continue;
                    if (!options.Contains(option, StringComparer.OrdinalIgnoreCase)) options.Add(option);
                }
            }

            var descriptionOptions = new List<string>();
            if (doc.RootElement.TryGetProperty("descriptionOptions", out var descArray) && descArray.ValueKind == JsonValueKind.Array)
            {
                foreach (var item in descArray.EnumerateArray().Take(3))
                {
                    if (item.ValueKind != JsonValueKind.String) continue;
                    var option = StripAngles(AiOutputSanitizer.ToSafeText(item.GetString(), 3000));
                    if (option is null || string.Equals(option, description, StringComparison.Ordinal)) continue;
                    if (!descriptionOptions.Contains(option, StringComparer.Ordinal)) descriptionOptions.Add(option);
                }
            }

            return new YouTubeMetadataSuggestion(title, description, tags)
            {
                TitleOptions = options,
                DescriptionOptions = descriptionOptions,
                TagIdeas = tagIdeas
            };
        }
    }

    /// <summary>
    /// The suggested description with what the render itself knows (chapters, credits) and
    /// the brand channel's footer below it, keeping whatever fits in YouTube's limit.
    /// </summary>
    public static string ComposeDescription(string suggested, string? renderDetails, string? footer)
    {
        var body = suggested.Trim();
        if (!string.IsNullOrWhiteSpace(renderDetails))
        {
            var withDetails = body.Length == 0 ? renderDetails.Trim() : $"{body}\n\n{renderDetails.Trim()}";
            if (Encoding.UTF8.GetByteCount(withDetails) <= YouTubePublishValidator.MaxDescriptionBytes) body = withDetails;
        }
        return YouTubePublishValidator.WithFooter(body, footer);
    }

    /// <summary>Short search phrases, no "#", none YouTube would refuse; <paramref name="seen"/> keeps them unique across lists.</summary>
    private static List<string> ReadTags(JsonElement root, string name, HashSet<string> seen)
    {
        var tags = new List<string>();
        if (!root.TryGetProperty(name, out var array) || array.ValueKind != JsonValueKind.Array) return tags;
        foreach (var item in array.EnumerateArray().Take(20))
        {
            if (item.ValueKind != JsonValueKind.String) continue;
            var tag = AiOutputSanitizer.ToSafeLine(item.GetString(), 40)?.TrimStart('#').Trim();
            if (string.IsNullOrEmpty(tag) || tag.IndexOfAny(['<', '>', ',', '"']) >= 0) continue;
            if (seen.Add(tag)) tags.Add(tag);
        }
        return tags;
    }

    private static string? ReadString(JsonElement root, string name) =>
        root.TryGetProperty(name, out var value) && value.ValueKind == JsonValueKind.String ? value.GetString() : null;

    private static string? StripAngles(string? value)
    {
        if (value is null) return null;
        var stripped = value.Replace("<", string.Empty, StringComparison.Ordinal).Replace(">", string.Empty, StringComparison.Ordinal).Trim();
        return stripped.Length == 0 ? null : stripped;
    }
}
