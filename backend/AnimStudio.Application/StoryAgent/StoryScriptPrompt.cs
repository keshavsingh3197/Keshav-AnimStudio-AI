using System.Text;
using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Domain.Stories;

namespace AnimStudio.Application.StoryAgent;

/// <summary>
/// Fills the <c>story-script</c> prompt from a brief and what the search of the Granths found, and
/// turns the rendered prompt into one block of text a person can paste into any chat.
/// </summary>
public static class StoryScriptPrompt
{
    /// <summary>The text model gets at most this much of what was found; the rest is left out, not truncated mid-passage.</summary>
    public const int DefaultResearchChars = 24_000;

    /// <summary>The pointers are short and always shown; they get their own allowance before the passages.</summary>
    private const int PointerChars = 3_200;

    /// <summary>About how long a scene runs, so the target length turns into a number of scenes.</summary>
    private const double SecondsPerScene = 13.0;

    public static int SceneCount(int targetSeconds) =>
        Math.Clamp((int)Math.Round(Math.Clamp(targetSeconds, 30, 900) / SecondsPerScene), 4, 40);

    /// <summary>The variables of the <c>story-script</c> template.</summary>
    public static IReadOnlyDictionary<string, string?> Variables(
        StoryBrief brief, StoryResearch? research, int maxResearchChars = DefaultResearchChars) =>
        new Dictionary<string, string?>(StringComparer.Ordinal)
        {
            ["title"] = brief.Title,
            ["language"] = LanguageName(brief.Language),
            ["sceneCount"] = SceneCount(brief.TargetSeconds).ToString(System.Globalization.CultureInfo.InvariantCulture),
            ["notes"] = string.IsNullOrWhiteSpace(brief.Notes) ? "(none)" : brief.Notes,
            ["research"] = ResearchBlock(research, maxResearchChars),
            ["sources"] = SourcesBlock()
        };

    /// <summary>A literal-safe language name: a single word.</summary>
    public static string LanguageName(string? language) =>
        string.Equals(language, "en", StringComparison.OrdinalIgnoreCase) ? "English" : "Hindi";

    /// <summary>
    /// What the search found, as plain text for the model: the topics, the curated pointers with how
    /// sure the catalogue is of each, then the passages themselves, chapters asked for by name first.
    /// </summary>
    public static string ResearchBlock(StoryResearch? research, int maxChars = DefaultResearchChars)
    {
        if (research is null) return "(nothing was found; rely on what you reliably know and mark scenes as tradition)";

        var builder = new StringBuilder();

        foreach (var topic in research.Topics)
        {
            builder.Append("Topic: ").Append(topic.Name);
            if (!string.IsNullOrWhiteSpace(topic.Summary)) builder.Append(" - ").Append(topic.Summary);
            builder.Append('\n');
        }

        var pointers = new StringBuilder();
        foreach (var source in research.Topics.SelectMany(t => t.Sources)
                     .DistinctBy(s => (s.TextId, s.Ref)))
        {
            var line = $"- {source.TextName} {source.Ref} [{source.Confidence.ToString().ToLowerInvariant()}]: {source.Note}\n";
            if (pointers.Length + line.Length > PointerChars) break;
            pointers.Append(line);
        }

        if (pointers.Length > 0)
        {
            builder.Append("\nWhere the tradition points (the confidence is the catalogue's; check low and medium ones against the passages):\n");
            builder.Append(pointers);
        }

        var passages = research.Passages.OrderByDescending(p => p.Direct).ToList();
        if (passages.Count == 0)
        {
            builder.Append("\nNo passages could be fetched. Use the pointers and what you reliably know, and mark scenes you cannot support as tradition.\n");
            return builder.ToString().TrimEnd();
        }

        builder.Append("\nPassages from the texts (read these before you write; cite only chapters you saw or are sure of):\n");
        var room = Math.Max(2_000, maxChars - builder.Length);
        var share = Math.Max(600, room / passages.Count);
        var index = 1;
        foreach (var passage in passages)
        {
            var excerpt = passage.Excerpt.Length > share ? passage.Excerpt[..share].TrimEnd() + " ..." : passage.Excerpt;
            var entry = $"\n[{index}] {passage.TextName} {passage.Ref} ({LanguageLabel(passage.Language)}, {passage.Title})\n{excerpt}\n";
            if (builder.Length + entry.Length > maxChars) break;
            builder.Append(entry);
            index++;
        }

        return builder.ToString().TrimEnd();
    }

    /// <summary>The texts a citation may name, by id, so the model's answer can be checked.</summary>
    public static string SourcesBlock()
    {
        var builder = new StringBuilder();
        foreach (var text in GranthCatalog.Texts)
        {
            builder.Append("- ").Append(text.Id).Append(": ").Append(text.English);
            if (text.IsStructured)
            {
                builder.Append(" (").Append(text.IsSingleDivision
                    ? $"chapters 1-{text.Divisions[0].Units}"
                    : $"{text.Divisions.Count} {text.DivisionLabel.ToLowerInvariant()}s");
                builder.Append(')');
            }
            builder.Append('\n');
        }
        return builder.ToString().TrimEnd();
    }

    private static string LanguageLabel(string code) => code switch
    {
        "sa" => "Sanskrit",
        "hi" => "Hindi",
        "en" => "English",
        _ => code
    };

    /// <summary>
    /// One block to paste into a chat: the instructions, the filled task, and the shape of the answer.
    /// The chat does not know the JSON schema, so it is spelled out with a short example.
    /// </summary>
    public static string ManualPrompt(RenderedPrompt rendered) =>
        $"""
        {rendered.SystemPrompt}

        ----

        {rendered.Body}

        ----

        Reply with ONE JSON object and nothing else (no explanation, no code fence). Shape:

        {ExampleJson}
        """;

    private const string ExampleJson =
        """
        {
          "title": "...", "titleEnglish": "...", "summary": "...", "musicQuery": "sitar flute devotional",
          "reviewNotes": ["..."],
          "cast": [ { "name": "...", "gender": "male", "age": "adult" } ],
          "scenes": [
            {
              "headline": "...", "narration": "...", "english": "...", "basis": "text",
              "sources": [ { "text": "bhagavata-purana", "ref": "10.59", "note": "..." } ],
              "imagePrompt": "...", "videoPrompt": "...", "imageKeywords": ["...", "..."], "mood": "devotional",
              "lines": [ { "speaker": "narrator", "text": "..." }, { "speaker": "...", "text": "..." } ]
            }
          ]
        }
        """;
}
