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

    /// <summary>More speaking characters than this in a short video is a crowd; the rest are read by the narrator.</summary>
    public const int MaxCast = 8;

    /// <summary>The most pictures a scene has after its own; the build gives each at least <see cref="StoryBundleBuilder.MinShotSeconds"/>.</summary>
    public const int MaxShots = 5;

    public const int MaxPromptChars = 800;

    private const int MaxLinesPerScene = 24;
    private const int MaxNameChars = 60;

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
                ThumbnailPrompt = AiOutputSanitizer.ToSafeLine(Text(root, "thumbnailPrompt"), MaxPromptChars),
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

            if (Property(root, "cast") is { ValueKind: JsonValueKind.Array } cast)
            {
                foreach (var member in cast.EnumerateArray().Take(MaxCast * 2))
                {
                    if (member.ValueKind != JsonValueKind.Object) continue;
                    script.Cast.Add(new StoryCastMember
                    {
                        Name = Text(member, "name") ?? string.Empty,
                        Gender = Text(member, "gender"),
                        Age = Text(member, "age")
                    });
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
        var cast = NormalizeCast(script.Cast);

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
            scene.VideoPrompt = AiOutputSanitizer.ToSafeLine(scene.VideoPrompt, 800);
            scene.Mood = AiOutputSanitizer.ToSafeLine(scene.Mood, 30)?.ToLowerInvariant();
            scene.ImageKeywords = [.. scene.ImageKeywords
                .Select(k => AiOutputSanitizer.ToSafeLine(k, 40)).OfType<string>().Take(8)];
            foreach (var shot in scene.Shots) shot.ImagePrompt = AiOutputSanitizer.ToSafeLine(shot.ImagePrompt, MaxPromptChars);
            // A shot with neither a prompt nor a picture has nothing to show.
            scene.Shots = [.. scene.Shots.Where(s => s.ImagePrompt is not null || !string.IsNullOrEmpty(s.ImageKey)).Take(MaxShots)];
            scene.EstimatedSeconds = StoryPacing.EstimateSeconds(scene.Narration);
            scene.Lines = NormalizeLines(scene, cast, out var mismatch);
            if (mismatch)
                warnings.Add($"Scene {number}: the characters' lines did not match the narration, so the narrator reads all of it.");
            else if (brief.Voicing == StoryVoicing.CharactersOnly
                     && (scene.Lines.Count == 0 || scene.Lines.Any(l => l.Speaker == StoryCastMember.Narrator)))
                warnings.Add($"Scene {number} has words no character speaks, so a narrator reads them. Give them to a character for a story with no narrator.");

            // A creative genre's story is the storyteller's own: it cites nothing and claims nothing about a text.
            if (brief.Mode == StoryGenreMode.Creative)
            {
                scene.Sources = [];
                scene.Basis = StoryBasis.Reflection;
            }

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
        // Only those who still speak a line; their voice is given again when narration is made.
        var speaking = scenes.SelectMany(s => s.Lines).Select(l => l.Speaker).ToHashSet(StringComparer.Ordinal);
        script.Cast = [.. cast.Where(c => speaking.Contains(c.Name))];
        script.Language = brief.Language;
        script.Title = AiOutputSanitizer.ToSafeLine(script.Title, 200) ?? brief.Title;
        script.TitleEnglish = AiOutputSanitizer.ToSafeLine(script.TitleEnglish, 200);
        script.Summary = AiOutputSanitizer.ToSafeLine(script.Summary, 600);
        script.MusicQuery = AiOutputSanitizer.ToSafeLine(script.MusicQuery, 80);
        script.ThumbnailPrompt = AiOutputSanitizer.ToSafeLine(script.ThumbnailPrompt, MaxPromptChars);
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
            VideoPrompt = AiOutputSanitizer.ToSafeLine(Text(element, "videoPrompt"), 800),
            Mood = AiOutputSanitizer.ToSafeLine(Text(element, "mood"), 30)
        };

        if (Property(element, "imageKeywords") is { ValueKind: JsonValueKind.Array } keywords)
        {
            scene.ImageKeywords = [.. keywords.EnumerateArray()
                .Select(k => k.ValueKind == JsonValueKind.String ? AiOutputSanitizer.ToSafeLine(k.GetString(), 40) : null)
                .OfType<string>().Take(8)];
        }

        // Further pictures of the same moment. "imagePrompts" is the same idea as a list, its first being the scene's own.
        var more = Strings(element, "moreImagePrompts");
        if (more.Count == 0 && Strings(element, "imagePrompts") is { Count: > 0 } all)
        {
            scene.ImagePrompt ??= all[0];
            more = [.. all.Skip(1)];
        }
        scene.Shots = [.. more.Take(MaxShots).Select(p => new StoryShot { ImagePrompt = p })];

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

        if (Property(element, "lines") is { ValueKind: JsonValueKind.Array } lines)
        {
            foreach (var line in lines.EnumerateArray().Take(MaxLinesPerScene))
            {
                if (line.ValueKind != JsonValueKind.Object) continue;
                scene.Lines.Add(new StoryLine
                {
                    Speaker = Text(line, "speaker") ?? StoryCastMember.Narrator,
                    Text = Text(line, "text") ?? string.Empty
                });
            }
        }

        scene.Basis = Text(element, "basis")?.Trim().ToLowerInvariant() switch
        {
            "text" or "scripture" or "textual" => StoryBasis.Text,
            "tradition" or "traditional" or "belief" => StoryBasis.Tradition,
            "reflection" or "moral" or "greeting" or "hook" => StoryBasis.Reflection,
            _ => sources.Count > 0 ? StoryBasis.Text : StoryBasis.Tradition
        };

        return scene;
    }

    /// <summary>One entry per name, with a gender and age the casting understands, and never someone called "narrator".</summary>
    private static List<StoryCastMember> NormalizeCast(IEnumerable<StoryCastMember> cast)
    {
        var result = new List<StoryCastMember>();
        foreach (var member in cast)
        {
            var name = AiOutputSanitizer.ToSafeLine(member.Name, MaxNameChars);
            if (name is null || IsNarrator(name) || result.Any(c => SameName(c.Name, name))) continue;

            result.Add(new StoryCastMember
            {
                Name = name,
                Gender = member.Gender?.Trim().ToLowerInvariant() switch
                {
                    "male" or "m" or "man" or "boy" => "male",
                    "female" or "f" or "woman" or "girl" => "female",
                    _ => null
                },
                Age = member.Age?.Trim().ToLowerInvariant() switch
                {
                    "child" or "kid" or "boy" or "girl" => "child",
                    "young" or "youth" or "teen" or "teenager" => "young",
                    "elder" or "old" or "elderly" or "aged" => "elder",
                    "adult" => "adult",
                    _ => null
                },
                VoiceId = member.VoiceId
            });
            if (result.Count == MaxCast) break;
        }

        return result;
    }

    /// <summary>
    /// The scene's lines, each spoken by the narrator or a member of the cast. They are kept only when they say the same
    /// words as the narration (the subtitles), punctuation aside; otherwise the narrator reads the whole scene.
    /// </summary>
    private static List<StoryLine> NormalizeLines(StoryScene scene, IReadOnlyList<StoryCastMember> cast, out bool mismatch)
    {
        mismatch = false;
        if (scene.Lines.Count == 0) return [];

        var lines = new List<StoryLine>();
        foreach (var line in scene.Lines.Take(MaxLinesPerScene))
        {
            var text = AiOutputSanitizer.ToSafeLine(line.Text, MaxNarrationChars);
            if (text is null) continue;

            var name = line.Speaker?.Trim() ?? string.Empty;
            var speaker = cast.FirstOrDefault(c => SameName(c.Name, name))?.Name ?? StoryCastMember.Narrator;

            // Two lines in a row by the same voice are one line.
            if (lines.Count > 0 && lines[^1].Speaker == speaker) lines[^1].Text += " " + text;
            else lines.Add(new StoryLine { Speaker = speaker, Text = text });
        }

        if (lines.All(l => l.Speaker == StoryCastMember.Narrator)) return [];

        if (!string.Equals(Spoken(string.Concat(lines.Select(l => l.Text))), Spoken(scene.Narration), StringComparison.Ordinal))
        {
            mismatch = true;
            return [];
        }

        return lines;
    }

    private static bool IsNarrator(string name) =>
        string.Equals(name.Trim(), StoryCastMember.Narrator, StringComparison.OrdinalIgnoreCase);

    private static bool SameName(string a, string b) =>
        string.Equals(a.Trim(), b.Trim(), StringComparison.OrdinalIgnoreCase);

    /// <summary>Only what is pronounced: letters, digits and the vowel signs Devanagari writes as marks.</summary>
    private static string Spoken(string text)
    {
        var builder = new System.Text.StringBuilder(text.Length);
        foreach (var c in text)
        {
            if (char.IsLetterOrDigit(c)
                || char.GetUnicodeCategory(c) is System.Globalization.UnicodeCategory.NonSpacingMark
                    or System.Globalization.UnicodeCategory.SpacingCombiningMark)
            {
                builder.Append(char.ToLowerInvariant(c));
            }
        }
        return builder.ToString();
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

    /// <summary>The prompts in a list of strings, made safe; empty when there is no such list.</summary>
    private static List<string> Strings(JsonElement element, string name) =>
        Property(element, name) is { ValueKind: JsonValueKind.Array } list
            ? [.. list.EnumerateArray().Take(MaxShots + 1)
                .Select(p => p.ValueKind == JsonValueKind.String ? AiOutputSanitizer.ToSafeLine(p.GetString(), MaxPromptChars) : null)
                .OfType<string>()]
            : [];

    private static IReadOnlyList<string> Cap(List<string> warnings) =>
        [.. warnings.Distinct(StringComparer.Ordinal).Take(MaxWarnings)];
}
