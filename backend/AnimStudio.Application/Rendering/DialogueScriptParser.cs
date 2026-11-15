using System.Text.RegularExpressions;

namespace AnimStudio.Application.Rendering;

public enum DialogueSpeakerSlot
{
    Narrator = 0,
    Left = 1,
    Right = 2
}

public enum CharacterVisualRole
{
    Narrator = 0,
    KingCrown = 1,
    SageRishi = 2,
    Divine = 3,
    Scholar = 4,
    ChildDevotee = 5
}

public sealed record ProceduralCharacterProfile(
    DialogueSpeakerSlot Slot,
    string Name,
    CharacterVisualRole Role);

public sealed record ProceduralDialogueTurn(
    int Index,
    double StartSeconds,
    double EndSeconds,
    DialogueSpeakerSlot Slot,
    string SpeakerName,
    string Text,
    bool IsTitleHook);

public sealed record ProceduralDialoguePlan(
    bool HasCharacters,
    ProceduralCharacterProfile? LeftCharacter,
    ProceduralCharacterProfile? RightCharacter,
    IReadOnlyList<ProceduralDialogueTurn> Turns);

/// <summary>
/// Parses bilingual scripts for interactive character conversation turns (e.g.
/// <c>[Raja Harishchandra]: ...</c> / <c>[Maharishi Vishwamitra]: ...</c>) and computes
/// animated speaker timelines paired with visual character archetypes.
/// </summary>
public static partial class DialogueScriptParser
{
    private static readonly string[] KingTokens =
        ["raja", "king", "maharaj", "samrat", "emperor", "rana", "prince", "vikram", "harishchandra", "dasharath", "ashok", "राजा", "सम्राट", "महाराज", "हरिश्चंद्र"];

    private static readonly string[] SageTokens =
        ["rishi", "maharishi", "guru", "acharya", "pandit", "muni", "swami", "vishwamitra", "vasishtha", "chanakya", "narad", "narada", "devarshi", "valmiki", "vyas", "ऋषि", "महर्षि", "आचार्य", "गुरु", "मुनि", "नारद", "देवर्षि", "पंडित"];

    private static readonly string[] DivineTokens =
        ["shri", "lord", "bhagwan", "devi", "mata", "krishna", "ram", "shiv", "shiva", "vishnu", "surya", "hanuman", "durga", "parvati", "ganesh", "भगवान", "श्री", "माता", "विष्णु", "कृष्ण", "शिव"];

    private static readonly string[] ChildDevoteeTokens =
        ["dhruva", "dhruv", "prahlad", "bhakta", "bhakt", "bal", "shishya", "jigyasu", "nachiketa", "eklavya", "lav", "kush", "child", "ध्रुव", "प्रह्लाद", "भक्त", "बाल", "शिष्य", "जिज्ञासु"];

    public static ProceduralDialoguePlan ParsePlan(
        string title,
        string? script,
        string? prompt,
        int durationSeconds,
        bool enableDialogue,
        string? preferredSpeakerA = null,
        string? preferredSpeakerB = null,
        string? eventType = null)
    {
        var total = Math.Max(5.0, durationSeconds);
        var cleanTitle = Clean(title);
        if (string.IsNullOrWhiteSpace(cleanTitle)) cleanTitle = "AnimStudio 3D";

        if (!enableDialogue)
        {
            var plainBeats = ProceduralVideoPlanner.BuildCaptionBeats(cleanTitle, script, prompt, durationSeconds);
            var turns = plainBeats.Select(b => new ProceduralDialogueTurn(
                b.Index, b.StartSeconds, b.EndSeconds,
                DialogueSpeakerSlot.Narrator,
                b.IsTitleHook ? "Title" : "Narrator",
                b.Text,
                b.IsTitleHook)).ToList();
            return new ProceduralDialoguePlan(false, null, null, turns);
        }

        var rawBody = !string.IsNullOrWhiteSpace(script) ? script : prompt ?? string.Empty;
        var parsedLines = ExtractDialogueSegments(rawBody, preferredSpeakerA, preferredSpeakerB, cleanTitle, eventType);

        if (parsedLines.Count == 0)
            parsedLines.Add((PreferredDefaultA(preferredSpeakerA, eventType), cleanTitle));

        var distinctSpeakers = parsedLines
            .Select(x => x.Speaker)
            .Where(s => !string.IsNullOrWhiteSpace(s) && !IsNarratorName(s))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(2)
            .ToList();

        var leftName = !string.IsNullOrWhiteSpace(preferredSpeakerA)
            ? preferredSpeakerA.Trim()
            : distinctSpeakers.ElementAtOrDefault(0);
        var rightName = !string.IsNullOrWhiteSpace(preferredSpeakerB)
            ? preferredSpeakerB.Trim()
            : distinctSpeakers.ElementAtOrDefault(1);

        if (string.IsNullOrWhiteSpace(leftName) || string.IsNullOrWhiteSpace(rightName))
        {
            var (inferredA, inferredB) = InferCharacterPairFromTitle(cleanTitle, eventType);
            leftName ??= inferredA;
            rightName ??= inferredB;
        }

        var hasTwoCharacters = !string.IsNullOrWhiteSpace(leftName)
            && !string.IsNullOrWhiteSpace(rightName)
            && !string.Equals(leftName, rightName, StringComparison.OrdinalIgnoreCase);

        if (!hasTwoCharacters)
        {
            var plainBeats = ProceduralVideoPlanner.BuildCaptionBeats(cleanTitle, script, prompt, durationSeconds);
            var turns = plainBeats.Select(b => new ProceduralDialogueTurn(
                b.Index, b.StartSeconds, b.EndSeconds,
                DialogueSpeakerSlot.Narrator,
                b.IsTitleHook ? "Title" : (leftName ?? "Narrator"),
                b.Text,
                b.IsTitleHook)).ToList();
            return new ProceduralDialoguePlan(false, null, null, turns);
        }

        var leftProfile = new ProceduralCharacterProfile(DialogueSpeakerSlot.Left, leftName!, InferRole(leftName!));
        var rightProfile = new ProceduralCharacterProfile(DialogueSpeakerSlot.Right, rightName!, InferRole(rightName!));

        var resultTurns = new List<ProceduralDialogueTurn>();
        var titleHold = Math.Min(2.8, total * 0.22);
        resultTurns.Add(new ProceduralDialogueTurn(
            0, 0.12, Math.Round(titleHold, 2),
            DialogueSpeakerSlot.Narrator,
            "Title",
            Truncate(cleanTitle, 110),
            IsTitleHook: true));

        var remaining = Math.Max(2.0, total - (titleHold + 0.25));
        var maxSlots = Math.Max(1, (int)Math.Floor(remaining / 1.0));
        var consolidated = ConsolidateDialogueTurns(parsedLines, maxSlots);
        var step = remaining / consolidated.Count;
        var start = titleHold + 0.12;

        for (var i = 0; i < consolidated.Count; i++)
        {
            var (rawSpeaker, lineText) = consolidated[i];
            var end = i == consolidated.Count - 1 ? total - 0.12 : start + step - 0.08;
            if (end <= start + 0.35) break;

            DialogueSpeakerSlot slot;
            string speakerLabel;
            if (string.Equals(rawSpeaker, leftProfile.Name, StringComparison.OrdinalIgnoreCase))
            {
                slot = DialogueSpeakerSlot.Left;
                speakerLabel = leftProfile.Name;
            }
            else if (string.Equals(rawSpeaker, rightProfile.Name, StringComparison.OrdinalIgnoreCase))
            {
                slot = DialogueSpeakerSlot.Right;
                speakerLabel = rightProfile.Name;
            }
            else
            {
                slot = (i % 2 == 0) ? DialogueSpeakerSlot.Left : DialogueSpeakerSlot.Right;
                speakerLabel = slot == DialogueSpeakerSlot.Left ? leftProfile.Name : rightProfile.Name;
            }

            resultTurns.Add(new ProceduralDialogueTurn(
                i + 1,
                Math.Round(start, 2),
                Math.Round(end, 2),
                slot,
                speakerLabel,
                Truncate(lineText, 240),
                IsTitleHook: false));

            start += step;
        }

        return new ProceduralDialoguePlan(true, leftProfile, rightProfile, resultTurns);
    }

    private static List<(string? Speaker, string Text)> ConsolidateDialogueTurns(
        List<(string? Speaker, string Text)> parsedLines,
        int maxSlots)
    {
        if (parsedLines.Count <= maxSlots)
            return parsedLines;

        var grouped = new List<(string? Speaker, string Text)>(maxSlots);
        var perSlot = (double)parsedLines.Count / maxSlots;
        for (var i = 0; i < maxSlots; i++)
        {
            var from = (int)Math.Floor(i * perSlot);
            var to = i == maxSlots - 1 ? parsedLines.Count : (int)Math.Floor((i + 1) * perSlot);
            if (to <= from) continue;

            var slice = parsedLines.Skip(from).Take(to - from).ToList();
            grouped.Add((slice[0].Speaker, string.Join(". ", slice.Select(s => s.Text))));
        }

        return grouped.Count > 0 ? grouped : parsedLines;
    }

    /// <summary>
    /// Prepares a line of caption/script text for natural speech synthesis: strips structural markers,
    /// cleans bullet punctuation, expands shorthand like <c>(+1d)</c>, and turns raw UTM URLs into a
    /// natural call-to-action reference so every fact is spoken clearly without reading URL query strings.
    /// </summary>
    public static string ToSpokenText(string? rawText, string? language)
    {
        if (string.IsNullOrWhiteSpace(rawText)) return string.Empty;
        var isHindi = !string.Equals(language?.Trim(), "en", StringComparison.OrdinalIgnoreCase);

        var text = SectionMarkerRegex().Replace(rawText, " ");
        text = UrlRegex().Replace(text, isHindi ? " नीचे डिस्क्रिप्शन और पिन कमेंट के लिंक पर " : " via the link in the description and pinned comment ");
        text = text.Replace("(+1d)", isHindi ? " अगले दिन " : " next day ", StringComparison.OrdinalIgnoreCase)
                   .Replace("•", ", ")
                   .Replace("|", ", ")
                   .Replace("—", ", ")
                   .Replace("👇", string.Empty)
                   .Replace("🔗", string.Empty);

        text = MultiSpaceRegex().Replace(text, " ").Trim(' ', ',', ';');
        return text;
    }

    /// <summary>Rebuilds the dialogue plan turns using measured real-audio timings while preserving characters.</summary>
    public static ProceduralDialoguePlan WithMeasuredTurns(
        ProceduralDialoguePlan plan,
        IReadOnlyList<ProceduralDialogueTurn> updatedTurns) =>
        plan with { Turns = updatedTurns };

    public static CharacterVisualRole InferRole(string speakerName)
    {
        var lower = speakerName.Trim().ToLowerInvariant();
        if (ChildDevoteeTokens.Any(lower.Contains)) return CharacterVisualRole.ChildDevotee;
        if (KingTokens.Any(lower.Contains)) return CharacterVisualRole.KingCrown;
        if (SageTokens.Any(lower.Contains)) return CharacterVisualRole.SageRishi;
        if (DivineTokens.Any(lower.Contains)) return CharacterVisualRole.Divine;
        return CharacterVisualRole.Scholar;
    }

    public static (string? SpeakerA, string? SpeakerB) InferCharacterPairFromTitle(string title, string? eventType)
    {
        var matches = PairSplitRegex().Matches(title ?? string.Empty);
        (string Left, string Right)? bestPair = null;
        var bestScore = -1;
        foreach (Match match in matches)
        {
            var left = CleanEntityName(match.Groups[1].Value);
            var right = CleanEntityName(match.Groups[2].Value);
            if (string.IsNullOrWhiteSpace(left) || string.IsNullOrWhiteSpace(right)) continue;

            var score = (InferRole(left) != CharacterVisualRole.Scholar ? 2 : 0)
                      + (InferRole(right) != CharacterVisualRole.Scholar ? 2 : 0)
                      + (match.Value.Contains('&') ? 2 : 0);
            if (score > bestScore)
            {
                bestScore = score;
                bestPair = (left, right);
            }
        }
        if (bestPair is { } pair)
            return pair;

        return eventType switch
        {
            "HinduPanchang" => ("आचार्य", "जिज्ञासु"),
            "HinduFestival" => ("पंडित जी", "भक्त"),
            "DailyKatha" => ("देवर्षि नारद", "भक्त"),
            "AajKaItihaas" => ("इतिहासकार", "सूत्रधार"),
            "Pratiyogita" => ("मेंटर", "प्रतिभागी"),
            _ => ("सूत्रधार", "विद्वान")
        };
    }

    private static List<(string? Speaker, string Text)> ExtractDialogueSegments(
        string raw,
        string? preferredA,
        string? preferredB,
        string title,
        string? eventType)
    {
        var list = new List<(string? Speaker, string Text)>();
        var rawLines = raw.Replace("\r\n", "\n", StringComparison.Ordinal).Split('\n');
        var (defaultA, defaultB) = !string.IsNullOrWhiteSpace(preferredA) && !string.IsNullOrWhiteSpace(preferredB)
            ? (preferredA.Trim(), preferredB.Trim())
            : InferCharacterPairFromTitle(title, eventType);

        var currentSpeaker = defaultA;
        foreach (var line in rawLines)
        {
            var trimmed = line.Trim();
            if (string.IsNullOrWhiteSpace(trimmed)) continue;
            if (trimmed.StartsWith("http://", StringComparison.OrdinalIgnoreCase)
                || trimmed.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
                continue;

            var speakerMatch = SpeakerPrefixRegex().Match(trimmed);
            if (speakerMatch.Success)
            {
                currentSpeaker = Clean(speakerMatch.Groups[1].Value);
                trimmed = Clean(speakerMatch.Groups[2].Value);
            }
            else
            {
                trimmed = Clean(SectionMarkerRegex().Replace(trimmed, " "));
            }

            if (string.IsNullOrWhiteSpace(trimmed)) continue;
            if (trimmed.StartsWith("http://", StringComparison.OrdinalIgnoreCase)
                || trimmed.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
                continue;

            var parts = trimmed.Split(['।', '|', '•', ';'], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            foreach (var part in parts)
            {
                var cleanedPart = Clean(UrlRegex().Replace(part, " ")).TrimEnd(':').Trim();
                if (cleanedPart.Length < 4) continue;
                if (cleanedPart.Length <= 140)
                {
                    list.Add((currentSpeaker, cleanedPart));
                    if (!speakerMatch.Success)
                        currentSpeaker = string.Equals(currentSpeaker, defaultA, StringComparison.OrdinalIgnoreCase) ? defaultB : defaultA;
                }
                else
                {
                    var sentences = cleanedPart.Split([". ", "! ", "? "], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
                    foreach (var s in sentences)
                    {
                        var sc = Clean(s);
                        if (sc.Length < 4) continue;
                        list.Add((currentSpeaker, sc));
                        if (!speakerMatch.Success)
                            currentSpeaker = string.Equals(currentSpeaker, defaultA, StringComparison.OrdinalIgnoreCase) ? defaultB : defaultA;
                    }
                }
            }
        }

        return list;
    }

    private static string? PreferredDefaultA(string? preferredA, string? eventType) =>
        !string.IsNullOrWhiteSpace(preferredA)
            ? preferredA.Trim()
            : InferCharacterPairFromTitle(string.Empty, eventType).SpeakerA;

    private static bool IsNarratorName(string name) =>
        name.Equals("Title", StringComparison.OrdinalIgnoreCase)
        || name.Equals("Narrator", StringComparison.OrdinalIgnoreCase)
        || name.Equals("Sutradhar", StringComparison.OrdinalIgnoreCase);

    private static string Clean(string? value) =>
        MultiSpaceRegex().Replace(value ?? string.Empty, " ").Trim();

    private static string CleanEntityName(string raw)
    {
        var stripped = Clean(SectionMarkerRegex().Replace(raw, " "));
        var colonIdx = stripped.LastIndexOf(':');
        if (colonIdx >= 0 && colonIdx + 1 < stripped.Length)
            stripped = stripped[(colonIdx + 1)..].Trim();

        stripped = TrailingConnectorRegex().Replace(stripped, string.Empty).Trim();
        var words = stripped.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        if (words.Length > 3)
            stripped = string.Join(' ', words.TakeLast(2));
        return stripped.Length > 26 ? stripped[..26].Trim() : stripped;
    }

    private static string Truncate(string value, int maxLen) =>
        value.Length <= maxLen ? value : value[..(maxLen - 1)].TrimEnd() + "…";

    [GeneratedRegex(@"^\[([^\[\]]{2,34})\]:\s*(.+)$")]
    private static partial Regex SpeakerPrefixRegex();

    [GeneratedRegex(@"\[[^\]]+\]")]
    private static partial Regex SectionMarkerRegex();

    [GeneratedRegex(@"([A-Za-z\u0900-\u097F][A-Za-z\u0900-\u097F\s]{1,28})\s*(?:&|and|vs\.?|Aur|और|एवं)\s*([A-Za-z\u0900-\u097F][A-Za-z\u0900-\u097F\s]{1,28})", RegexOptions.IgnoreCase)]
    private static partial Regex PairSplitRegex();

    [GeneratedRegex(@"\s+(?:की\s+कथा|का\s+संवाद|की\s+कहानी|katha|story|samvad|dialogue).*$", RegexOptions.IgnoreCase)]
    private static partial Regex TrailingConnectorRegex();

    [GeneratedRegex(@"https?://\S+", RegexOptions.IgnoreCase)]
    private static partial Regex UrlRegex();

    [GeneratedRegex(@"\s+")]
    private static partial Regex MultiSpaceRegex();
}
