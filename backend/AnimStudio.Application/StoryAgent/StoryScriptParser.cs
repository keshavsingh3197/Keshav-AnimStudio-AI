using System.Text.Json;
using AnimStudio.Application.Ai;
using AnimStudio.Domain.Stories;

namespace AnimStudio.Application.StoryAgent;

/// <summary>A script that could not be used. The message is safe to show.</summary>
public sealed class StoryScriptException(string code, string message) : Exception(message)
{
    public string Code { get; } = code;
}

/// <summary>A script made safe to build from, and the things about it worth a second look.</summary>
public sealed record StoryScriptResult(StoryScript Script, IReadOnlyList<string> Warnings);

/// <summary>
/// Turns what a text model (or a person pasting one's reply) produced into a script the build can
/// trust: sanitised text, citations checked against the catalogue and against what was fetched,
/// and honest warnings about anything a speech engine or a careful reader would trip over.
/// </summary>
/// <remarks>
/// The model's answer is untrusted. It never reaches a prompt, a filename or a process argument
/// from here - only a Hindi or English sentence that is read aloud and shown as a subtitle - and the
/// person reads it before anything is built.
/// </remarks>
public static class StoryScriptParser
{
    public const int MaxScenes = 60;
    public const int MaxNarrationChars = 1_600;
    public const int MaxTotalNarrationChars = 30_000;
    public const int MinScenes = 2;

    private const int MaxWarnings = 60;

    /// <summary>
    /// Reads a reply. <paramref name="tolerant"/> is for a reply pasted from a chat, which often wraps the
    /// JSON in a sentence or two: the object is taken from the first <c>{</c> to the last <c>}</c>. A reply
    /// from a provider is already validated against the schema and is read strictly.
    /// </summary>
    public static StoryScriptResult Parse(
        string? raw, StoryBrief brief, StoryResearch? research, string writtenBy, DateTime nowUtc, bool tolerant)
    {
        var text = AiJsonResponse.Unwrap(raw);
        if (text.Length == 0)
            throw new StoryScriptException("script-empty", "Nothing was pasted. Paste the model's reply, which is one JSON object.");

        if (tolerant && !text.StartsWith('{'))
        {
            var first = text.IndexOf('{');
            var last = text.LastIndexOf('}');
            if (first >= 0 && last > first) text = text[first..(last + 1)];
        }

        JsonDocument document;
        try
        {
            document = JsonDocument.Parse(text, new JsonDocumentOptions
            {
                AllowTrailingCommas = true,
                CommentHandling = JsonCommentHandling.Skip,
                MaxDepth = 16
            });
        }
        catch (JsonException)
        {
            throw new StoryScriptException("script-not-json",
                "That is not valid JSON. Ask the model to reply with the JSON object only, and paste all of it.");
        }

        using (document)
        {
            var root = document.RootElement;
            if (root.ValueKind != JsonValueKind.Object)
                throw new StoryScriptException("script-not-object", "The reply must be one JSON object with a \"scenes\" list.");
            if (Property(root, "scenes") is not { ValueKind: JsonValueKind.Array } scenes)
                throw new StoryScriptException("script-no-scenes", "The reply has no \"scenes\" list.");

            var script = new StoryScript
            {
                Title = AiOutputSanitizer.ToSafeLine(Text(root, "title"), 200) ?? brief.Title,
                TitleEnglish = AiOutputSanitizer.ToSafeLine(Text(root, "titleEnglish"), 200),
                Language = brief.Language,
                Summary = AiOutputSanitizer.ToSafeLine(Text(root, "summary"), 600),
                MusicQuery = AiOutputSanitizer.ToSafeLine(Text(root, "musicQuery"), 80),
                WrittenBy = writtenBy,
                CreatedAtUtc = nowUtc
            };

            if (Property(root, "reviewNotes") is { ValueKind: JsonValueKind.Array } notes)
            {
                foreach (var note in notes.EnumerateArray().Take(8))
                {
                    if (AiOutputSanitizer.ToSafeLine(note.ValueKind == JsonValueKind.String ? note.GetString() : null, 300) is { } safe)
                        script.ReviewNotes.Add(safe);
                }
            }

            var dropped = 0;
            foreach (var element in scenes.EnumerateArray().Take(MaxScenes))
            {
                if (element.ValueKind != JsonValueKind.Object) { dropped++; continue; }
                var scene = ReadScene(element);
                if (scene is null) { dropped++; continue; }
                script.Scenes.Add(scene);
            }

            var warnings = new List<string>();
            if (dropped > 0) warnings.Add($"{dropped} scene(s) in the reply had no narration and were left out.");
            if (scenes.GetArrayLength() > MaxScenes) warnings.Add($"Only the first {MaxScenes} scenes were kept.");

            var result = Normalize(script, brief, research);
            warnings.AddRange(result.Warnings);
            return new StoryScriptResult(result.Script, Cap(warnings));
        }
    }

    /// <summary>
    /// Makes a script ready to build: numbers the scenes, estimates their lengths, checks every citation, and
    /// lists what to look at. Run again after the user edits the script, so what they see stays true.
    /// </summary>
    public static StoryScriptResult Normalize(StoryScript script, StoryBrief brief, StoryResearch? research)
    {
        var scenes = script.Scenes
            .Where(s => !string.IsNullOrWhiteSpace(s.Narration))
            .Take(MaxScenes)
            .ToList();
        if (scenes.Count < MinScenes)
        {
            throw new StoryScriptException("script-too-short",
                $"A script needs at least {MinScenes} scenes with narration; this one has {scenes.Count}.");
        }

        var total = 0;
        foreach (var scene in scenes)
        {
            total += scene.Narration.Length;
            if (total > MaxTotalNarrationChars)
                throw new StoryScriptException("script-too-long", "That script is longer than a video this tool will make. Shorten it.");
        }

        var grounding = (research?.Passages ?? [])
            .Select(p => CitationValidator.Check(p.TextId, p.Ref))
            .Where(c => c.Status == CitationStatus.Verified && c.Division is not null)
            .ToList();

        var warnings = new List<string>();
        var number = 0;

        // A story told over several scenes says it is tradition once: "the Puranas tell that..." covers the scene after it.
        var hedgeCarries = false;
        foreach (var scene in scenes)
        {
            number++;
            scene.Number = number;
            scene.Narration = AiOutputSanitizer.ToSafeLine(scene.Narration, MaxNarrationChars) ?? string.Empty;
            scene.Headline = AiOutputSanitizer.ToSafeLine(scene.Headline, 160) ?? Derive(scene.Narration);
            scene.English = AiOutputSanitizer.ToSafeLine(scene.English, 1600);
            scene.ImagePrompt = AiOutputSanitizer.ToSafeLine(scene.ImagePrompt, 800);
            scene.Mood = AiOutputSanitizer.ToSafeLine(scene.Mood, 30)?.ToLowerInvariant();
            scene.ImageKeywords = [.. scene.ImageKeywords
                .Select(k => AiOutputSanitizer.ToSafeLine(k, 40)).OfType<string>().Take(8)];
            scene.EstimatedSeconds = StoryPacing.EstimateSeconds(scene.Narration);

            var sources = new List<StorySourceRef>();
            foreach (var source in scene.Sources.Take(8))
            {
                var checkedSource = CheckSource(source, grounding);
                sources.Add(checkedSource);
                if (checkedSource.Check is CitationStatus.Invalid or CitationStatus.UnknownText)
                {
                    warnings.Add($"Scene {number}: {Describe(checkedSource)} - {checkedSource.CheckMessage}");
                }
            }
            scene.Sources = sources;

            var usable = sources.Count(s => s.Check is CitationStatus.Verified or CitationStatus.Unchecked && s.TextId.Length > 0);
            if (scene.Basis == StoryBasis.Text && usable == 0)
            {
                scene.Basis = StoryBasis.Tradition;
                warnings.Add($"Scene {number} is written as coming from a text but cites none that could be found, so it is treated as tradition.");
            }

            if (scene.Basis == StoryBasis.Tradition)
            {
                var hedged = StoryPacing.UsesHedge(scene.Narration);
                if (!hedged && !hedgeCarries)
                {
                    warnings.Add($"Scene {number} rests on tradition, but its narration states it as fact. Say so in the words (\"it is believed\", \"मान्यता है\").");
                }

                hedgeCarries |= hedged;
            }
            else
            {
                hedgeCarries = false;
            }

            if (StoryPacing.HasDigits(scene.Narration))
                warnings.Add($"Scene {number} has digits in its narration. Write numbers as words so the voice reads them correctly.");
            if (brief.Language != "en" && StoryPacing.HasLatinLetters(scene.Narration))
                warnings.Add($"Scene {number} has English letters inside the Hindi narration, which most Hindi voices mispronounce.");
            if (scene.Narration.Length > 420)
                warnings.Add($"Scene {number} is long ({scene.Narration.Length} characters, about {scene.EstimatedSeconds:0} seconds). Consider splitting it.");
        }

        script.Scenes = scenes;
        script.Language = brief.Language;
        script.Title = AiOutputSanitizer.ToSafeLine(script.Title, 200) ?? brief.Title;
        script.TitleEnglish = AiOutputSanitizer.ToSafeLine(script.TitleEnglish, 200);
        script.Summary = AiOutputSanitizer.ToSafeLine(script.Summary, 600);
        script.MusicQuery = AiOutputSanitizer.ToSafeLine(script.MusicQuery, 80);
        script.ReviewNotes = [.. script.ReviewNotes
            .Select(n => AiOutputSanitizer.ToSafeLine(n, 300)).OfType<string>().Take(8)];

        if (brief.Language != "en" && !scenes.Any(s => s.Narration.Any(c => c is >= '\u0900' and <= '\u097F')))
            warnings.Add("The script was asked for in Hindi but is not written in Devanagari.");

        var seconds = scenes.Sum(s => s.EstimatedSeconds);
        if (brief.TargetSeconds > 0 && (seconds < brief.TargetSeconds * 0.6 || seconds > brief.TargetSeconds * 1.5))
        {
            warnings.Add(
                $"The script runs about {seconds:0} seconds against a target of {brief.TargetSeconds}. Add or trim scenes if the length matters.");
        }

        return new StoryScriptResult(script, Cap(warnings));
    }

    private static StorySourceRef CheckSource(StorySourceRef source, IReadOnlyList<CitationCheck> grounding)
    {
        var check = CitationValidator.Check(
            source.TextId.Length > 0 ? source.TextId : source.TextName,
            source.Ref);

        var result = new StorySourceRef
        {
            TextId = check.TextId ?? string.Empty,
            TextName = check.TextId is null
                ? AiOutputSanitizer.ToSafeLine(source.TextName.Length > 0 ? source.TextName : source.TextId, 100) ?? string.Empty
                : check.TextName,
            Ref = check.Status == CitationStatus.Verified && check.Normalized.Length > 0
                ? ReadableRef(check)
                : AiOutputSanitizer.ToSafeLine(source.Ref, 80) ?? string.Empty,
            Note = AiOutputSanitizer.ToSafeLine(source.Note, 240),
            Confidence = source.Confidence,
            Check = check.Status,
            CheckMessage = check.Message,
            Url = null
        };

        if (check.Status == CitationStatus.Verified && check.Division is { } division)
        {
            var from = check.UnitFrom ?? 0;
            var to = check.UnitTo ?? check.UnitFrom ?? int.MaxValue;
            result.Grounded = grounding.Any(g =>
                g.TextId == check.TextId
                && g.Division == division
                && (check.UnitFrom is null || g.UnitFrom is null || (g.UnitFrom <= to && (g.UnitTo ?? g.UnitFrom) >= from)));
        }

        return result;
    }

    /// <summary>
    /// The place as it is shown: the standard form ("10.59"), except for a whole division, which a bare number would hide.
    /// "Skanda Purana 2" reads as a chapter; "Skanda Purana Vaishnava Khanda" says what it is, and reads back to the same
    /// division when the person edits it.
    /// </summary>
    private static string ReadableRef(CitationCheck check)
    {
        if (check.UnitFrom is not null || check.Division is not { } number || check.TextId is null) return check.Normalized;
        if (!string.Equals(check.Normalized, number.ToString(System.Globalization.CultureInfo.InvariantCulture), StringComparison.Ordinal)) return check.Normalized;

        var text = GranthCatalog.Get(check.TextId);
        var division = text?.Division(number);
        if (text is null || division is null) return check.Normalized;

        // A division numbered in the catalogue is already called by its number ("Skandha 8"); the others by their name ("Yuddha").
        return division.Name.Any(char.IsDigit) ? division.Name : $"{division.Name} {text.DivisionLabel}";
    }

    private static string Describe(StorySourceRef source) =>
        source.TextName.Length == 0 ? source.Ref : $"{source.TextName} {source.Ref}".Trim();

    private static StoryScene? ReadScene(JsonElement element)
    {
        var narration = AiOutputSanitizer.ToSafeLine(Text(element, "narration"), MaxNarrationChars);
        if (narration is null) return null;

        var scene = new StoryScene
        {
            Narration = narration,
            Headline = AiOutputSanitizer.ToSafeLine(Text(element, "headline"), 160) ?? string.Empty,
            English = AiOutputSanitizer.ToSafeLine(Text(element, "english"), 1600),
            ImagePrompt = AiOutputSanitizer.ToSafeLine(Text(element, "imagePrompt"), 800),
            Mood = AiOutputSanitizer.ToSafeLine(Text(element, "mood"), 30)
        };

        if (Property(element, "imageKeywords") is { ValueKind: JsonValueKind.Array } keywords)
        {
            scene.ImageKeywords = [.. keywords.EnumerateArray()
                .Select(k => k.ValueKind == JsonValueKind.String ? AiOutputSanitizer.ToSafeLine(k.GetString(), 40) : null)
                .OfType<string>().Take(8)];
        }

        var sources = new List<StorySourceRef>();
        if (Property(element, "sources") is { ValueKind: JsonValueKind.Array } list)
        {
            foreach (var item in list.EnumerateArray().Take(8))
            {
                if (item.ValueKind != JsonValueKind.Object) continue;
                var text = AiOutputSanitizer.ToSafeLine(Text(item, "text") ?? Text(item, "textId") ?? Text(item, "source"), 100);
                var reference = AiOutputSanitizer.ToSafeLine(Text(item, "ref") ?? Text(item, "reference"), 80);
                if (text is null) continue;
                sources.Add(new StorySourceRef
                {
                    TextId = text,
                    Ref = reference ?? string.Empty,
                    Note = AiOutputSanitizer.ToSafeLine(Text(item, "note"), 240)
                });
            }
        }
        scene.Sources = sources;

        scene.Basis = Text(element, "basis")?.Trim().ToLowerInvariant() switch
        {
            "text" or "scripture" or "textual" => StoryBasis.Text,
            "tradition" or "traditional" or "belief" => StoryBasis.Tradition,
            "reflection" or "moral" or "greeting" or "hook" => StoryBasis.Reflection,
            _ => sources.Count > 0 ? StoryBasis.Text : StoryBasis.Tradition
        };

        return scene;
    }

    /// <summary>The first few words of the narration, for a scene the model left without a headline.</summary>
    private static string Derive(string narration)
    {
        var words = narration.Split(' ', StringSplitOptions.RemoveEmptyEntries).Take(5);
        var text = string.Join(' ', words).TrimEnd('।', '.', ',', '!', '?');
        return text.Length == 0 ? "Scene" : text;
    }

    private static JsonElement? Property(JsonElement element, string name)
    {
        foreach (var property in element.EnumerateObject())
        {
            if (string.Equals(property.Name, name, StringComparison.OrdinalIgnoreCase)) return property.Value;
        }
        return null;
    }

    private static string? Text(JsonElement element, string name) =>
        Property(element, name) is { ValueKind: JsonValueKind.String } value ? value.GetString() : null;

    private static IReadOnlyList<string> Cap(List<string> warnings) =>
        [.. warnings.Distinct(StringComparer.Ordinal).Take(MaxWarnings)];
}
