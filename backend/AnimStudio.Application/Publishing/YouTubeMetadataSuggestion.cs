using System.Text;
using System.Text.Json;
using AnimStudio.Application.Ai;
using AnimStudio.Domain.Scenes;

namespace AnimStudio.Application.Publishing;

/// <summary>A suggested title, description and tags for the publish dialog to fill in.</summary>
public sealed record YouTubeMetadataSuggestion(string Title, string Description, IReadOnlyList<string> Tags);

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

    /// <summary>The material the prompt describes: name, description, chapters and the spoken script.</summary>
    public static string BuildSummary(string? projectName, string? projectDescription, IEnumerable<Scene> scenes,
        IEnumerable<string>? chapterLabels)
    {
        var sb = new StringBuilder();
        if (!string.IsNullOrWhiteSpace(projectName)) sb.Append("Project name: ").Append(projectName.Trim()).Append('\n');
        if (!string.IsNullOrWhiteSpace(projectDescription)) sb.Append("About: ").Append(projectDescription.Trim()).Append('\n');

        var chapters = chapterLabels?.Where(l => !string.IsNullOrWhiteSpace(l)).ToList() ?? [];
        if (chapters.Count > 0) sb.Append("Chapters: ").Append(string.Join("; ", chapters)).Append('\n');

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

            var tags = new List<string>();
            var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            if (doc.RootElement.TryGetProperty("tags", out var tagArray) && tagArray.ValueKind == JsonValueKind.Array)
            {
                foreach (var item in tagArray.EnumerateArray().Take(20))
                {
                    if (item.ValueKind != JsonValueKind.String) continue;
                    var tag = AiOutputSanitizer.ToSafeLine(item.GetString(), 40)?.TrimStart('#').Trim();
                    if (string.IsNullOrEmpty(tag) || tag.IndexOfAny(['<', '>', ',', '"']) >= 0) continue;
                    if (seen.Add(tag)) tags.Add(tag);
                }
            }

            return new YouTubeMetadataSuggestion(title, description, tags);
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

    private static string? ReadString(JsonElement root, string name) =>
        root.TryGetProperty(name, out var value) && value.ValueKind == JsonValueKind.String ? value.GetString() : null;

    private static string? StripAngles(string? value)
    {
        if (value is null) return null;
        var stripped = value.Replace("<", string.Empty, StringComparison.Ordinal).Replace(">", string.Empty, StringComparison.Ordinal).Trim();
        return stripped.Length == 0 ? null : stripped;
    }
}
