using System.Text;
using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Ai;
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

    /// <summary>
    /// The template a run's script is written with, and its values: the Granth prompt for a scripture genre, the creative
    /// one - with the genre's style guide as data - for the rest.
    /// </summary>
    public static (string TemplateKey, IReadOnlyDictionary<string, string?> Variables) For(StoryRun run)
    {
        if (run.Brief.Mode != StoryGenreMode.Creative)
        {
            var variables = new Dictionary<string, string?>(Variables(run.Brief, run.Research), StringComparer.Ordinal)
            {
                ["notes"] = NotesFor(run)
            };
            return (BuiltInPrompts.StoryScript, variables);
        }

        var genre = StoryGenres.Of(run);
        return (BuiltInPrompts.StoryScriptCreative, new Dictionary<string, string?>(StringComparer.Ordinal)
        {
            ["title"] = run.Brief.Title,
            ["language"] = LanguageName(run.Brief.Language),
            ["sceneCount"] = SceneCount(run.Brief.TargetSeconds).ToString(System.Globalization.CultureInfo.InvariantCulture),
            ["notes"] = NotesFor(run),
            ["genre"] = GenreBlock(genre),
            ["research"] = IdeasBlock(run.Research)
        });
    }

    /// <summary>
    /// The creator's notes, and for a later part of a series what the writer must carry on from: the story so far, how the
    /// last part ended, and who speaks. It goes in the notes so it reaches the model as data, whichever template is in use.
    /// </summary>
    public static string NotesFor(StoryRun run)
    {
        var notes = string.IsNullOrWhiteSpace(run.Brief.Notes) ? null : run.Brief.Notes.Trim();
        if (run.Series is not { Part: > 1 } series) return notes ?? "(none)";

        var builder = new StringBuilder();
        builder.Append("This video is Part ").Append(series.Part).Append(" of the series \"").Append(series.Name)
            .Append("\". Continue the story; do not retell it. Open with a one-scene reminder of where it stopped, then go on from there.\n");
        if (!string.IsNullOrWhiteSpace(series.StorySoFar))
            builder.Append("\nThe story so far:\n").Append(series.StorySoFar.Trim()).Append('\n');
        if (!string.IsNullOrWhiteSpace(series.LastScene))
            builder.Append("\nHow the last part ended:\n").Append(series.LastScene.Trim()).Append('\n');
        if (series.Cast.Count > 0)
        {
            builder.Append("\nCharacters met so far - keep these exact names when they speak: ")
                .Append(string.Join(", ", series.Cast.Select(c => c.Name))).Append('\n');
        }
        builder.Append("\nEnd on a moment that makes the viewer want the next part, unless the creator's notes say this part ends the story.\n");
        if (notes is not null) builder.Append("\nThe creator's notes for this part:\n").Append(notes).Append('\n');
        return builder.ToString().TrimEnd();
    }

    /// <summary>The genre as the writer reads it: its name, who it is for, the style guide and the moods.</summary>
    public static string GenreBlock(StoryGenre genre)
    {
        var builder = new StringBuilder();
        builder.Append("Genre: ").Append(genre.Name).Append('\n');
        if (genre.MadeForKids) builder.Append("Audience: children\n");
        if (genre.StyleGuide.Length > 0) builder.Append(genre.StyleGuide.Trim()).Append('\n');
        if (genre.Moods.Count > 0) builder.Append("Moods: ").Append(string.Join(", ", genre.Moods)).Append('\n');
        return builder.ToString().TrimEnd();
    }

    private static string IdeasBlock(StoryResearch? research)
    {
        if (research is null || research.Topics.Count == 0) return "(none)";
        return string.Join('\n', research.Topics.Select(t =>
            string.IsNullOrWhiteSpace(t.Summary) ? $"- {t.Name}" : $"- {t.Name}: {t.Summary}"));
    }

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
