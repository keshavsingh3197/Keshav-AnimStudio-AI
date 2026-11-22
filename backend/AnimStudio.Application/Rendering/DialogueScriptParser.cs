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
    ChildDevotee = 5,
    NobleWoman = 6,
    Warrior = 7,
    BrainrotLog = 8,
    CupDancer = 9,
    CartoonTank = 10,
    ComicBobble = 11
}

public sealed record ProceduralCharacterProfile(
    DialogueSpeakerSlot Slot,
    string Name,
    CharacterVisualRole Role,
    string? RobeHex = null,
    bool? HasGlasses = null,
    string? VoiceId = null);

public sealed record ProceduralDialogueTurn(
    int Index,
    double StartSeconds,
    double EndSeconds,
    DialogueSpeakerSlot Slot,
    string SpeakerName,
    string Text,
    bool IsTitleHook,
    CharacterVisualRole? SpeakerRole = null,
    string? SceneBackdropCue = null,
    string? Emotion = null,
    string? Action = null,
    string? ListenerAction = null,
    string? CameraShot = null,
    string? StageTarget = null,
    string? SpeakerProp = null,
    string? ListenerProp = null,
    string? SpeakerGlasses = null,
    string? ListenerGlasses = null);

/// <param name="AfterTurnIndex">The 0-based index in <see cref="ProceduralDialoguePlan.Turns"/> that this meme punctuates.</param>
public sealed record ProceduralMemeCue(
    int AfterTurnIndex,
    string Name,
    string? Caption,
    double Seconds,
    double StartSeconds);

/// <param name="SupportingCast">Up to three extra characters shown in the back row; they step forward when they speak.</param>
/// <param name="Scenes">The <c>[SCENE]</c> directions in script order (setting, time, image prompt).</param>
/// <param name="MemeCues">Mid-video and climax reaction meme cues anchored to dialogue turns.</param>
public sealed record ProceduralDialoguePlan(
    bool HasCharacters,
    ProceduralCharacterProfile? LeftCharacter,
    ProceduralCharacterProfile? RightCharacter,
    IReadOnlyList<ProceduralDialogueTurn> Turns,
    IReadOnlyList<ProceduralCharacterProfile>? SupportingCast = null,
    IReadOnlyList<SceneDirective>? Scenes = null,
    IReadOnlyList<ProceduralMemeCue>? MemeCues = null)
{
    public IReadOnlyList<ProceduralCharacterProfile> Supporting => SupportingCast ?? [];
    public IReadOnlyList<ProceduralMemeCue> Memes => MemeCues ?? [];

    /// <summary>The distinct scene cues in order of first appearance (drives per-scene backdrop photos).</summary>
    public IReadOnlyList<string> SceneCueOrder =>
        [.. Turns.Select(t => t.SceneBackdropCue).Where(c => !string.IsNullOrWhiteSpace(c)).Select(c => c!).Distinct(StringComparer.Ordinal)];
}

/// <summary>
/// Parses bilingual scripts for interactive character conversation turns (e.g.
/// <c>[Raja Harishchandra]: ...</c> / <c>[Maharishi Vishwamitra]: ...</c>) and computes
/// animated speaker timelines paired with visual character archetypes.
/// </summary>
public static partial class DialogueScriptParser
{
    private static readonly string[] KingTokens =
        ["raja", "king", "maharaj", "samrat", "emperor", "rana", "prince", "vikram", "harishchandra", "dasharath", "ashok", "yamraj", "dharmaraj", "hiranyakashipu", "राजा", "सम्राट", "महाराज", "हरिश्चंद्र", "यमराज", "धर्मराज", "हिरण्यकशिपु"];

    private static readonly string[] SageTokens =
        ["rishi", "maharishi", "guru", "acharya", "pandit", "muni", "swami", "vishwamitra", "vasishtha", "chanakya", "narad", "narada", "devarshi", "valmiki", "vyas", "mrikandu", "historian", "ऋषि", "महर्षि", "आचार्य", "गुरु", "मुनि", "नारद", "देवर्षि", "पंडित", "मृकण्डु", "इतिहासकार", "विश्लेषक"];

    private static readonly string[] DivineTokens =
        ["shri", "lord", "bhagwan", "devi", "mata", "krishna", "ram", "shiv", "shiva", "vishnu", "narasimha", "surya", "hanuman", "durga", "parvati", "ganesh", "mahadev", "shambho", "neelkanth", "भगवान", "श्री", "माता", "विष्णु", "नरसिंह", "कृष्ण", "शिव", "महादेव", "शंभो", "नीलकंठ"];

    private static readonly string[] NobleWomanTokens =
        ["rani", "queen", "sita", "radha", "parvati", "durga", "lakshmi", "laxmi", "saraswati", "devi", "mata", "mother", "suniti", "suruchi", "kunti", "draupadi", "yashoda", "savitri", "anasuya", "marudmati", "princess",
         "रानी", "सीता", "राधा", "पार्वती", "दुर्गा", "लक्ष्मी", "सरस्वती", "देवी", "माता", "सुनीति", "सुरुचि", "कुंती", "द्रौपदी", "यशोदा", "सावित्री", "मरुदमती"];

    private static readonly string[] WarriorTokens =
        ["warrior", "soldier", "general", "sainik", "yoddha", "senapati", "arjun", "bhima", "karna", "abhimanyu", "birsa", "bhagat singh", "revolutionary",
         "योद्धा", "सैनिक", "सेनापति", "अर्जुन", "भीम", "कर्ण", "अभिमन्यु", "बिरसा", "क्रांतिकारी"];

    private static readonly string[] ChildDevoteeTokens =
        ["dhruva", "dhruv", "prahlad", "markandeya", "bhakta", "bhakt", "bal", "shishya", "jigyasu", "nachiketa", "eklavya", "lav", "kush", "child", "student", "learner", "ध्रुव", "प्रह्लाद", "मार्कण्डेय", "भक्त", "बाल", "शिष्य", "जिज्ञासु", "विद्यार्थी", "छात्र"];

    private static readonly string[] CartoonTankTokens =
        ["kv-2", "panzer", "tank", "cannon", "turret", "टैंक", "तोप"];

    private static readonly string[] BrainrotLogTokens =
        ["brainrot", "sahur", "tung", "wooden log", "log", "lakda", "लकड़ा", "लाठी"];

    private static readonly string[] CupDancerTokens =
        ["teacup", "cup dancer", "kulhad", "espresso", "cup", "mug", "कप", "कुल्हड़"];

    private static readonly string[] ComicBobbleTokens =
        ["bobble", "mjo", "joker", "comedian", "prankster", "मसखरा"];

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
        var (parsedLines, castDirectives, sceneDirectives, rawMemes) = ExtractDialogueSegments(rawBody, preferredSpeakerA, preferredSpeakerB, cleanTitle, eventType);

        if (parsedLines.Count == 0)
            parsedLines.Add((PreferredDefaultA(preferredSpeakerA, eventType), cleanTitle, null, null, null, null));

        var isComedyContext = string.Equals(eventType, "FunnyComedy", StringComparison.OrdinalIgnoreCase)
            || sceneDirectives.Any(s => s.Setting is SceneSetting.ComedyStage or SceneSetting.ChaiStall or SceneSetting.Bedroom
                or SceneSetting.LivingRoom or SceneSetting.Kitchen or SceneSetting.SweetShop
                or SceneSetting.BarberShop or SceneSetting.Courtroom or SceneSetting.DoctorClinic
                or SceneSetting.Classroom or SceneSetting.QuizStudio or SceneSetting.NeighborhoodGate
                or SceneSetting.DoorwaySet or SceneSetting.SkyGauntlet or SceneSetting.TankArena);

        var castByName = castDirectives
            .GroupBy(c => c.Name, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(g => g.Key, g => g.First(), StringComparer.OrdinalIgnoreCase);
        CharacterVisualRole RoleOf(string name, DialogueSpeakerSlot preferredSlot = DialogueSpeakerSlot.Narrator)
        {
            if (castByName.TryGetValue(name, out var c)) return c.Role;
            var inferred = InferRole(name);
            if (isComedyContext && inferred == CharacterVisualRole.Scholar)
                return preferredSlot == DialogueSpeakerSlot.Left ? CharacterVisualRole.ComicBobble : CharacterVisualRole.Scholar;
            return inferred;
        }
        string? RobeOf(string name, DialogueSpeakerSlot preferredSlot = DialogueSpeakerSlot.Narrator)
        {
            if (castByName.TryGetValue(name, out var c) && !string.IsNullOrWhiteSpace(c.RobeHex))
                return c.RobeHex;
            if (!isComedyContext) return null;
            return preferredSlot switch
            {
                DialogueSpeakerSlot.Left => "#F59E0B",
                DialogueSpeakerSlot.Right => "#0EA5E9",
                _ => null
            };
        }

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

        string? VoiceOf(string name) =>
            castByName.TryGetValue(name, out var c) && !string.IsNullOrWhiteSpace(c.VoiceId) ? c.VoiceId : null;

        var leftRole = RoleOf(leftName!, DialogueSpeakerSlot.Left);
        var rightRole = RoleOf(rightName!, DialogueSpeakerSlot.Right);
        var leftRobe = RobeOf(leftName!, DialogueSpeakerSlot.Left);
        var rightRobe = RobeOf(rightName!, DialogueSpeakerSlot.Right);
        if (isComedyContext && leftRole == CharacterVisualRole.Scholar && rightRole == CharacterVisualRole.Scholar)
            leftRole = CharacterVisualRole.ComicBobble;
        var leftProfile = new ProceduralCharacterProfile(DialogueSpeakerSlot.Left, leftName!, leftRole, leftRobe, VoiceId: VoiceOf(leftName!));
        var rightProfile = new ProceduralCharacterProfile(DialogueSpeakerSlot.Right, rightName!, rightRole, rightRobe, VoiceId: VoiceOf(rightName!));

        // Everyone else who speaks, then [CAST] extras, fills the supporting ensemble (up to 5 supporting = 7 cast total!).
        var supporting = parsedLines
            .Select(x => x.Speaker)
            .Concat(castDirectives.Select(c => c.Name))
            .Where(n => !string.IsNullOrWhiteSpace(n) && !IsNarratorName(n!)
                && !string.Equals(n, leftProfile.Name, StringComparison.OrdinalIgnoreCase)
                && !string.Equals(n, rightProfile.Name, StringComparison.OrdinalIgnoreCase))
            .Select(n => n!.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(MaxSupportingCast)
            .Select(n => new ProceduralCharacterProfile(DialogueSpeakerSlot.Narrator, n, RoleOf(n), RobeOf(n), VoiceId: VoiceOf(n)))
            .ToList();

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

        var prevSceneCue = (string?)null;
        var sleepingSlot = (DialogueSpeakerSlot?)null;
        var turnInScene = 0;

        for (var i = 0; i < consolidated.Count; i++)
        {
            var (rawSpeaker, lineText, sceneCue, pendingAction, pendingShot, pendingProp) = consolidated[i];
            var end = i == consolidated.Count - 1 ? total - 0.12 : start + step - 0.08;
            if (end <= start + 0.35) break;

            DialogueSpeakerSlot slot;
            string speakerLabel;
            CharacterVisualRole? speakerRole = null;
            if (!string.IsNullOrWhiteSpace(rawSpeaker) && IsNarratorName(rawSpeaker))
            {
                slot = DialogueSpeakerSlot.Narrator;
                speakerLabel = rawSpeaker.Trim();
                speakerRole = CharacterVisualRole.Narrator;
            }
            else if (string.Equals(rawSpeaker, leftProfile.Name, StringComparison.OrdinalIgnoreCase))
            {
                slot = DialogueSpeakerSlot.Left;
                speakerLabel = leftProfile.Name;
                speakerRole = leftProfile.Role;
            }
            else if (string.Equals(rawSpeaker, rightProfile.Name, StringComparison.OrdinalIgnoreCase))
            {
                slot = DialogueSpeakerSlot.Right;
                speakerLabel = rightProfile.Name;
                speakerRole = rightProfile.Role;
            }
            else if (!string.IsNullOrWhiteSpace(rawSpeaker))
            {
                speakerLabel = rawSpeaker.Trim();
                speakerRole = RoleOf(speakerLabel);
                slot = speakerRole is CharacterVisualRole.Divine or CharacterVisualRole.SageRishi
                    ? DialogueSpeakerSlot.Right
                    : speakerRole is CharacterVisualRole.ChildDevotee or CharacterVisualRole.KingCrown
                        ? DialogueSpeakerSlot.Left
                        : ((i % 2 == 0) ? DialogueSpeakerSlot.Left : DialogueSpeakerSlot.Right);
            }
            else
            {
                slot = (i % 2 == 0) ? DialogueSpeakerSlot.Left : DialogueSpeakerSlot.Right;
                speakerLabel = slot == DialogueSpeakerSlot.Left ? leftProfile.Name : rightProfile.Name;
                speakerRole = slot == DialogueSpeakerSlot.Left ? leftProfile.Role : rightProfile.Role;
            }

            if (!string.Equals(sceneCue, prevSceneCue, StringComparison.Ordinal))
            {
                turnInScene = 0;
                prevSceneCue = sceneCue;
            }

            var (cleanLineText, emotion, inlineAction, inlineShot, inlineProp) = ExtractInlineStageCues(lineText);
            var (setting, _) = SceneDirectives.FromCue(sceneCue);
            var partnerName = slot == DialogueSpeakerSlot.Left ? rightProfile.Name : leftProfile.Name;
            var (action, listenerAction, cameraShot, stageTarget, speakerProp, listenerProp) = ResolveTurnCinematics(
                cleanLineText,
                emotion,
                pendingAction ?? inlineAction,
                pendingShot ?? inlineShot,
                pendingProp ?? inlineProp,
                speakerLabel,
                partnerName,
                slot,
                setting,
                turnInScene,
                i,
                consolidated.Count,
                eventType,
                ref sleepingSlot);

            resultTurns.Add(new ProceduralDialogueTurn(
                i + 1,
                Math.Round(start, 2),
                Math.Round(end, 2),
                slot,
                speakerLabel,
                Truncate(cleanLineText, MaxSpokenLineChars),
                IsTitleHook: false,
                SpeakerRole: speakerRole,
                SceneBackdropCue: sceneCue,
                Emotion: emotion,
                Action: action,
                ListenerAction: listenerAction,
                CameraShot: cameraShot,
                StageTarget: stageTarget,
                SpeakerProp: speakerProp,
                ListenerProp: listenerProp));

            turnInScene++;
            start += step;
        }

        // The title card and opening narrator beat inherit the first scene cue so the stage opens inside the first set.
        var firstCue = resultTurns.Select(t => t.SceneBackdropCue).FirstOrDefault(c => !string.IsNullOrWhiteSpace(c));
        if (firstCue is not null)
        {
            for (var j = 0; j < resultTurns.Count && string.IsNullOrWhiteSpace(resultTurns[j].SceneBackdropCue); j++)
            {
                resultTurns[j] = resultTurns[j] with
                {
                    SceneBackdropCue = firstCue,
                    CameraShot = j == 0 ? "wideEstablishing" : resultTurns[j].CameraShot
                };
            }
        }

        // Story-arc continuity pass for comedy visual gags (Ulta -> Sidha Chasma, Mirror look, Towel prop):
        // Detects if any lead character confesses "चश्मा उल्टा पहना था" / mentions glasses and animates
        // upside-down frames before that confession, flipping right-side up when corrected, and crooked on shock/anger!
        (leftProfile, rightProfile) = ApplyVisualContinuityArcs(resultTurns, leftProfile, rightProfile);

        var memeCues = MapMemeCues(rawMemes, parsedLines.Count, resultTurns);
        return new ProceduralDialoguePlan(true, leftProfile, rightProfile, resultTurns, supporting, sceneDirectives, memeCues);
    }

    public const int MaxSupportingCast = 5;
    public const int MaxMemeCues = 4;

    /// <summary>A spoken line is kept whole up to this length (about 120 words); captions split it into readable chunks.</summary>
    public const int MaxSpokenLineChars = 800;

    private static List<(string? Speaker, string Text, string? Cue, string? Action, string? Shot, string? Prop)> ConsolidateDialogueTurns(
        List<(string? Speaker, string Text, string? Cue, string? Action, string? Shot, string? Prop)> parsedLines,
        int maxSlots)
    {
        if (parsedLines.Count <= maxSlots)
            return parsedLines;

        var grouped = new List<(string? Speaker, string Text, string? Cue, string? Action, string? Shot, string? Prop)>(maxSlots);
        var perSlot = (double)parsedLines.Count / maxSlots;
        for (var i = 0; i < maxSlots; i++)
        {
            var from = (int)Math.Floor(i * perSlot);
            var to = i == maxSlots - 1 ? parsedLines.Count : (int)Math.Floor((i + 1) * perSlot);
            if (to <= from) continue;

            var slice = parsedLines.Skip(from).Take(to - from).ToList();
            grouped.Add((slice[0].Speaker, string.Join(". ", slice.Select(s => s.Text)), slice[0].Cue, slice[0].Action, slice[0].Shot, slice[0].Prop));
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
        // Strip mechanical/tool/animal onomatopoeia tokens ("चक-चक-चक", "ख्र्र्र", "ट्रिंग-ट्रिंग", "snip-snip", "zzz")
        // so voices never speak sound effects aloud while original Turn.Text retains them for Foley SFX cues.
        text = SfxOnomatopoeiaRegex().Replace(text, " ");
        text = text.Replace("(+1d)", isHindi ? " अगले दिन " : " next day ", StringComparison.OrdinalIgnoreCase)
                   .Replace("•", ", ")
                   .Replace("|", ", ")
                   .Replace("—", ", ")
                   .Replace("👇", string.Empty)
                   .Replace("🔗", string.Empty);

        text = OrphanedPunctuationRegex().Replace(text, "$1");
        text = MultiSpaceRegex().Replace(text, " ")
            .TrimStart(' ', ',', ';', '-', '—', '!', '?', '।', '.')
            .Trim(' ', ',', ';');
        return text;
    }

    /// <summary>Rebuilds the dialogue plan turns using measured real-audio timings while preserving characters and syncing meme cues.</summary>
    public static ProceduralDialoguePlan WithMeasuredTurns(
        ProceduralDialoguePlan plan,
        IReadOnlyList<ProceduralDialogueTurn> updatedTurns)
    {
        if (plan.MemeCues is null || plan.MemeCues.Count == 0 || updatedTurns.Count == 0)
            return plan with { Turns = updatedTurns };

        var synced = plan.MemeCues.Select(m =>
        {
            var anchorPos = -1;
            for (var i = 0; i < updatedTurns.Count; i++)
            {
                if (!updatedTurns[i].IsTitleHook && updatedTurns[i].Index == m.AfterTurnIndex)
                {
                    anchorPos = i;
                    break;
                }
            }
            if (anchorPos < 0)
                anchorPos = Math.Clamp(m.AfterTurnIndex, 0, updatedTurns.Count - 1);

            var anchorTurn = updatedTurns[anchorPos];
            var nextTurn = anchorPos + 1 < updatedTurns.Count ? updatedTurns[anchorPos + 1] : null;
            var availableGap = nextTurn is not null ? nextTurn.StartSeconds - anchorTurn.EndSeconds : m.Seconds;

            if (availableGap >= 0.45)
            {
                var start = Math.Round(anchorTurn.EndSeconds + 0.04, 3);
                var dur = Math.Round(Math.Clamp(availableGap - 0.08, 0.45, Math.Max(0.45, m.Seconds)), 3);
                return m with { StartSeconds = start, Seconds = dur };
            }

            var fallbackAnchor = Math.Max(0.25, anchorTurn.EndSeconds + 0.02);
            return m with { StartSeconds = Math.Round(fallbackAnchor, 3) };
        }).ToList();
        return plan with { Turns = updatedTurns, MemeCues = synced };
    }

    public static CharacterVisualRole InferRole(string speakerName)
    {
        var lower = speakerName.Trim().ToLowerInvariant();
        if (CartoonTankTokens.Any(t => SceneDirectives.IndexOfWord(lower, t) >= 0)) return CharacterVisualRole.CartoonTank;
        if (BrainrotLogTokens.Any(t => SceneDirectives.IndexOfWord(lower, t) >= 0)) return CharacterVisualRole.BrainrotLog;
        if (CupDancerTokens.Any(t => SceneDirectives.IndexOfWord(lower, t) >= 0)) return CharacterVisualRole.CupDancer;
        if (ComicBobbleTokens.Any(t => SceneDirectives.IndexOfWord(lower, t) >= 0)) return CharacterVisualRole.ComicBobble;
        if (ChildDevoteeTokens.Any(lower.Contains)) return CharacterVisualRole.ChildDevotee;
        if (NobleWomanTokens.Any(lower.Contains)) return CharacterVisualRole.NobleWoman;
        if (WarriorTokens.Any(lower.Contains)) return CharacterVisualRole.Warrior;
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
            "AajKaItihaas" => ("इतिहासकार", "विद्यार्थी"),
            "Pratiyogita" => ("मेंटर", "प्रतिभागी"),
            "FunnyComedy" => ("पप्पू भैया", "बबलू यार"),
            _ => ("आचार्य", "जिज्ञासु")
        };
    }

    private static List<ProceduralMemeCue> MapMemeCues(
        List<(int AfterLineIndex, MemeDirective Directive)> rawMemes,
        int parsedLineCount,
        List<ProceduralDialogueTurn> resultTurns)
    {
        if (rawMemes.Count == 0 || resultTurns.Count <= 1) return [];
        var spokenTurnCount = resultTurns.Count - 1;
        var ratio = parsedLineCount > 0 ? (double)spokenTurnCount / parsedLineCount : 1.0;
        var cues = new List<ProceduralMemeCue>(rawMemes.Count);
        foreach (var (afterLineIdx, directive) in rawMemes)
        {
            var mappedSpokenIdx = Math.Clamp((int)Math.Floor(afterLineIdx * ratio), 0, spokenTurnCount - 1);
            var turnIndex = 1 + mappedSpokenIdx;
            var anchor = Math.Max(0.25, resultTurns[turnIndex].EndSeconds - Math.Min(0.25, directive.Seconds * 0.15));
            cues.Add(new ProceduralMemeCue(turnIndex, directive.Name, directive.Caption, directive.Seconds, Math.Round(anchor, 2)));
        }
        return cues;
    }

    private static (List<(string? Speaker, string Text, string? Cue, string? Action, string? Shot, string? Prop)> Lines, List<CastDirective> Cast, List<SceneDirective> Scenes, List<(int AfterLineIndex, MemeDirective Directive)> Memes) ExtractDialogueSegments(
        string raw,
        string? preferredA,
        string? preferredB,
        string title,
        string? eventType)
    {
        var list = new List<(string? Speaker, string Text, string? Cue, string? Action, string? Shot, string? Prop)>();
        var cast = new List<CastDirective>();
        var scenes = new List<SceneDirective>();
        var memes = new List<(int AfterLineIndex, MemeDirective Directive)>();
        var rawLines = raw.Replace("\r\n", "\n", StringComparison.Ordinal).Split('\n');

        // Explicit [SCENE] directions win; without any, a spoken line that names a place moves the stage there.
        var hasExplicitScenes = rawLines.Any(l => SpeakerPrefixRegex().Match(l.Trim()) is { Success: true } m && SceneDirectives.IsSceneTag(m.Groups[1].Value));
        string? currentCue = null;
        string? pendingAction = null;
        string? pendingShot = null;
        string? pendingProp = null;
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
            if (speakerMatch.Success && SceneDirectives.IsSceneTag(speakerMatch.Groups[1].Value))
            {
                var scene = SceneDirectives.ParseScene(speakerMatch.Groups[2].Value);
                if (scenes.Count >= MaxScenes) continue; // further scene lines keep the last scene's picture
                scenes.Add(scene);
                // Numbered, so each directed scene has its own picture even when place and light repeat.
                currentCue = SceneDirectives.ToCue(scene.Setting, scene.TimeOfDay, scenes.Count);
                continue;
            }
            if (speakerMatch.Success && SceneDirectives.IsCastTag(speakerMatch.Groups[1].Value))
            {
                if (SceneDirectives.ParseCast(speakerMatch.Groups[2].Value) is { } member && cast.Count < 8)
                    cast.Add(member);
                continue;
            }
            if (speakerMatch.Success && SceneDirectives.IsMemeTag(speakerMatch.Groups[1].Value))
            {
                if (SceneDirectives.ParseMeme(speakerMatch.Groups[2].Value) is { } meme && memes.Count < MaxMemeCues)
                    memes.Add((Math.Max(0, list.Count - 1), meme));
                continue;
            }
            if (speakerMatch.Success && IsStagePropTag(speakerMatch.Groups[1].Value))
            {
                var body = speakerMatch.Groups[2].Value;
                foreach (var token in body.Split(['|', ',', ';'], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
                    pendingProp ??= NormalizePropTag(token);
                continue;
            }
            if (speakerMatch.Success && IsStageActionTag(speakerMatch.Groups[1].Value))
            {
                var body = speakerMatch.Groups[2].Value;
                foreach (var token in body.Split(['|', ',', ';'], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
                {
                    pendingAction ??= NormalizeActionTag(token);
                    pendingShot ??= NormalizeCameraShotTag(token);
                    pendingProp ??= NormalizePropTag(token);
                }
                continue;
            }

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

            if (!hasExplicitScenes && SceneDirectives.InferSetting(trimmed) is var named and not SceneSetting.Auto)
                currentCue = SceneDirectives.ToCue(named, SceneDirectives.InferTime(trimmed));

            var parts = trimmed.Split(['।', '|', '•', ';'], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            foreach (var part in parts)
            {
                var cleanedPart = Clean(UrlRegex().Replace(part, " ")).TrimEnd(':').Trim();
                if (cleanedPart.Length < 4) continue;
                if (cleanedPart.Length <= 140)
                {
                    list.Add((currentSpeaker, cleanedPart, currentCue, pendingAction, pendingShot, pendingProp));
                    pendingAction = null;
                    pendingShot = null;
                    pendingProp = null;
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
                        list.Add((currentSpeaker, sc, currentCue, pendingAction, pendingShot, pendingProp));
                        pendingAction = null;
                        pendingShot = null;
                        pendingProp = null;
                        if (!speakerMatch.Success)
                            currentSpeaker = string.Equals(currentSpeaker, defaultA, StringComparison.OrdinalIgnoreCase) ? defaultB : defaultA;
                    }
                }
            }
        }

        return (list, cast, scenes, memes);
    }

    public const int MaxScenes = 120;

    private static string? PreferredDefaultA(string? preferredA, string? eventType) =>
        !string.IsNullOrWhiteSpace(preferredA)
            ? preferredA.Trim()
            : InferCharacterPairFromTitle(string.Empty, eventType).SpeakerA;

    private static bool IsNarratorName(string name) =>
        name.Equals("Title", StringComparison.OrdinalIgnoreCase)
        || name.Equals("Narrator", StringComparison.OrdinalIgnoreCase)
        || name.Equals("Sutradhar", StringComparison.OrdinalIgnoreCase)
        || name.Equals("सूत्रधार", StringComparison.Ordinal)
        || name.Equals("कथावाचक", StringComparison.Ordinal)
        || name.Equals("Storyteller", StringComparison.OrdinalIgnoreCase)
        || name.Equals("Moral", StringComparison.OrdinalIgnoreCase);

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

    private static (string CleanText, string Emotion, string? Action, string? CameraShot, string? Prop) ExtractInlineStageCues(string text)
    {
        var raw = text ?? string.Empty;
        string? explicitEmotion = null;
        string? explicitAction = null;
        string? explicitShot = null;
        string? explicitProp = null;

        // Strip recognized leading or inline parenthetical stage directions without removing factual time/date notes.
        raw = InlineCueParenRegex().Replace(raw, match =>
        {
            var inner = match.Groups[1].Value;
            var tokens = inner.Split([',', ';', '|'], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            if (tokens.Length == 0) return match.Value;

            var matchedAny = false;
            var allMatched = true;
            foreach (var token in tokens)
            {
                var emo = NormalizeEmotionTag(token);
                var act = NormalizeActionTag(token);
                var shot = NormalizeCameraShotTag(token);
                var prop = NormalizePropTag(token);
                if (emo is null && act is null && shot is null && prop is null)
                {
                    allMatched = false;
                    continue;
                }
                matchedAny = true;
                explicitEmotion ??= emo;
                explicitAction ??= act;
                explicitShot ??= shot;
                explicitProp ??= prop;
            }
            return matchedAny && allMatched ? " " : match.Value;
        });

        raw = Clean(raw);
        if (string.IsNullOrWhiteSpace(raw)) raw = text ?? string.Empty;
        return (raw, explicitEmotion ?? InferEmotion(raw), explicitAction, explicitShot, explicitProp);
    }

    private static (string Action, string ListenerAction, string CameraShot, string StageTarget, string? SpeakerProp, string? ListenerProp) ResolveTurnCinematics(
        string text,
        string emotion,
        string? explicitAction,
        string? explicitShot,
        string? explicitProp,
        string speakerName,
        string partnerName,
        DialogueSpeakerSlot slot,
        SceneSetting setting,
        int turnInScene,
        int turnIndex,
        int totalTurns,
        string? eventType,
        ref DialogueSpeakerSlot? sleepingSlot)
    {
        var lower = (text ?? string.Empty).ToLowerInvariant();
        var speakerLower = (speakerName ?? string.Empty).ToLowerInvariant();
        var partnerLower = (partnerName ?? string.Empty).ToLowerInvariant();
        var isComedy = string.Equals(eventType, "FunnyComedy", StringComparison.OrdinalIgnoreCase)
            || setting is SceneSetting.ComedyStage or SceneSetting.ChaiStall or SceneSetting.DoorwaySet
                or SceneSetting.SkyGauntlet or SceneSetting.TankArena or SceneSetting.Bedroom
                or SceneSetting.LivingRoom or SceneSetting.Kitchen or SceneSetting.SweetShop
                or SceneSetting.BarberShop or SceneSetting.Courtroom or SceneSetting.DoctorClinic
                or SceneSetting.Classroom or SceneSetting.QuizStudio or SceneSetting.NeighborhoodGate;

        var (inferredProp, inferredPropAction) = InferPropAndAction(lower, speakerLower, setting);
        var speakerProp = string.Equals(explicitProp, "none", StringComparison.OrdinalIgnoreCase)
            ? null
            : explicitProp ?? inferredProp;

        // Role Lock in practitioner/customer sets (BarberShop, Courtroom, DoctorClinic):
        // Saying "कटिंग करना" as a Customer describes what you want on your hair — it must NOT turn
        // the Customer into the Barber holding scissors or move both characters onto barberStand!
        var hasBarberInCast = IsBarberName(speakerLower) || IsBarberName(partnerLower);
        var isSupportingGuest = slot == DialogueSpeakerSlot.Narrator
            || ContainsAnyToken(speakerLower, "चाचा", "आंटी", "पड़ोसी", "uncle", "aunt", "neighbor", "friend", "teacher", "guest", "बबलू", "छोटू", "मामा", "दादा");
        var isBarberRole = !isSupportingGuest && (IsBarberName(speakerLower) || (!hasBarberInCast && slot == DialogueSpeakerSlot.Right));
        if (setting == SceneSetting.BarberShop && !isBarberRole)
        {
            if (speakerProp is "scissors" or "comb" or "sprayBottle")
                speakerProp = null;
            if (inferredPropAction is "cutting" or "combing")
                inferredPropAction = null;
        }
        var hasJudgeInCast = IsJudgeName(speakerLower) || IsJudgeName(partnerLower);
        var isJudgeRole = IsJudgeName(speakerLower) || (!hasJudgeInCast && slot == DialogueSpeakerSlot.Left);
        if (setting == SceneSetting.Courtroom && !isJudgeRole)
        {
            if (speakerProp is "gavel")
                speakerProp = null;
            if (inferredPropAction is "bangingGavel")
                inferredPropAction = null;
        }
        var hasDoctorInCast = IsDoctorName(speakerLower) || IsDoctorName(partnerLower);
        var isDoctorRole = IsDoctorName(speakerLower) || (!hasDoctorInCast && slot == DialogueSpeakerSlot.Left);
        if (setting == SceneSetting.DoctorClinic && !isDoctorRole)
        {
            if (speakerProp is "stethoscope" or "syringe")
                speakerProp = null;
            if (inferredPropAction is "examining")
                inferredPropAction = null;
        }

        string? listenerProp = null;
        if (setting == SceneSetting.BarberShop)
        {
            if (isBarberRole)
            {
                speakerProp ??= "scissors";
                listenerProp = "cape";
            }
            else if (slot is DialogueSpeakerSlot.Left or DialogueSpeakerSlot.Right)
            {
                if (!ContainsAnyToken(lower, "तौलिया", "towel", "remove", "हटा"))
                    speakerProp ??= "cape";
                listenerProp = IsBarberName(partnerLower) ? "scissors" : null;
            }
            else if (IsBarberName(partnerLower))
            {
                listenerProp = "scissors";
            }
        }
        else if (setting == SceneSetting.Courtroom)
        {
            if (isJudgeRole) speakerProp ??= "gavel";
            else listenerProp = "gavel";
        }
        else if (setting == SceneSetting.DoctorClinic)
        {
            if (isDoctorRole) speakerProp ??= "stethoscope";
        }
        else if (setting == SceneSetting.QuizStudio)
        {
            speakerProp ??= "mic";
        }

        var action = explicitAction;
        if (action is null)
        {
            var wasThisSpeakerSleeping = sleepingSlot == slot;
            if (ContainsAnyToken(lower, "सो रहा", "सोते", "सोने दे", "सोने दो", "खर्राटे", "ख्र्र", "खर्र", "नींद", "sleeping", "snoring", "asleep", "zzz", "in bed", "five more minutes", "पाँच मिनट", "पांच मिनट"))
            {
                if (lower.Contains('?') && ContainsAnyToken(lower, "तू", "तुम", "you", "bro", "क्या"))
                {
                    action = "pointing";
                }
                else
                {
                    action = "sleeping";
                }
            }
            else if (wasThisSpeakerSleeping
                || ContainsAnyToken(lower, "उठ जा", "उठो", "जागो", "wake up", "woke up", "get up"))
            {
                action = "wakingUp";
            }
            else if (ContainsAnyToken(lower, KickTokens))
            {
                action = "kicking";
            }
            else if (ContainsAnyToken(lower, PunchTokens) && !ContainsAnyToken(lower, "heart attack", "हार्ट अटैक"))
            {
                action = "punching";
            }
            else if (ContainsAnyToken(lower, "तौलिया तो हटा", "तौलिया हटा", "तौलिया हटाया", "तौलिया खींच", "हटा तौलिया", "remove towel", "cape off"))
            {
                action = "removingTowel";
                speakerProp = "towel";
            }
            else if (ContainsAnyToken(lower, "शीशे में", "शीशा देख", "mirror") && setting == SceneSetting.BarberShop)
            {
                action = isBarberRole || ContainsAnyToken(speakerLower, "चाचा", "पड़ोसी") ? "pointing" : "lookInMirror";
            }
            else if (ContainsAnyToken(lower, "चश्मा उल्टा", "उल्टा चश्मा", "चश्मा सीधा", "ulta chasma", "upside down glasses"))
            {
                action = "adjustingGlasses";
            }
            else if (inferredPropAction is not null
                && !(emotion == "surprised" && inferredPropAction is "eating" or "stirring" or "sipping"))
            {
                action = inferredPropAction;
            }
            else if (ContainsAnyToken(lower, "भाग", "दौड़", "run", "running", "sprint", "chase", "flee", "चप्पल"))
            {
                action = "running";
            }
            else if (ContainsAnyToken(lower, "चल", "चलो", "आ रहा", "जा रहा", "निकल पड़ा", "पहुँच", "walk", "coming", "step aside", "tip-toe", "वन की ओर"))
            {
                action = "walking";
            }
            else if (emotion != "surprised"
                && ContainsAnyToken(lower, "रबड़ी", "rabdi", "समोसा", "samosa", "छोले", "भटूरे", "मिठाई", "जलेबी", "पनीर", "चाय", "खा", "पी", "eat", "snack", "coffee", "tea"))
            {
                action = lower.Contains('?') ? "pointing" : "eating";
            }
            else if (ContainsAnyToken(lower, "बैठ", "तपस्या", "ध्यान", "सिंहासन", "सोफे", "कुर्सी", "sit", "sofa", "couch", "chair", "meditate"))
            {
                action = "sitting";
            }
            else if (ContainsAnyToken(lower, "प्रणाम", "नमस्ते", "आरती", "पूजा", "मंत्र", "वरदान", "प्रभु", "श्रीहरि", "नारायण", "pray", "bless", "mantra", "aarti", "ॐ"))
            {
                action = "praying";
            }
            else if (ContainsAnyToken(lower, "अदाब", "adaab", "aadaab", "salam", "सलाम"))
            {
                action = "adaab";
            }
            else if (ContainsAnyToken(lower, "चक्कर", "chakkar", "twirl", "spin", "sufi"))
            {
                action = "sufiSpin";
            }
            else if (ContainsAnyToken(lower, "नाच", "dance", "kathak", "party", "कूद", "jump", "bouncy"))
            {
                action = "dancing";
            }
            else if (ContainsAnyToken(lower, "दिमाग़", "पागल", "बावले", "बंद ताले", "gadbadi", "गड़बड़", "स्कैम", "udhaar", "उधार"))
            {
                action = isComedy ? "slapForehead" : "pointing";
            }
            else
            {
                action = emotion switch
                {
                    "surprised" => "shockedFall",
                    "angry" => "pointing",
                    "laughing" => "laughing",
                    "confused" => "slapForehead",
                    "proud" => setting is SceneSetting.Temple or SceneSetting.ForestAshram or SceneSetting.Himalaya ? "praying" : "pointing",
                    "happy" => "waving",
                    "sad" => "sitting",
                    _ => isComedy ? (turnIndex % 2 == 0 ? "pointing" : "waving") : "none"
                };
            }
        }

        if (action == "sleeping" && slot != DialogueSpeakerSlot.Narrator)
            sleepingSlot = slot;
        else if (action == "wakingUp" && sleepingSlot == slot)
            sleepingSlot = null;

        var listenerAction = "none";
        if (slot is DialogueSpeakerSlot.Left or DialogueSpeakerSlot.Right)
        {
            if (sleepingSlot is { } sleeper && sleeper != slot)
            {
                var wakeSignal = ContainsAnyToken(lower, "उठ", "जाग", "wake", "अलार्म", "सो रहा")
                    || emotion is "angry" or "surprised"
                    || lower.Contains('!');
                listenerAction = wakeSignal ? "wakingUp" : "sleeping";
                if (listenerAction == "wakingUp") sleepingSlot = null;
            }
            else if (action == "punching")
            {
                listenerAction = "hitReact";
            }
            else if (action == "kicking")
            {
                listenerAction = "shockedFall";
            }
            else if (setting == SceneSetting.BarberShop && ContainsAnyToken(lower, "शीशे में", "शीशा देख", "mirror"))
            {
                listenerAction = "lookInMirror";
            }
            else if (listenerProp == "scissors")
            {
                listenerAction = "cutting";
            }
            else if (action is "shockedFall" or "wakingUp")
            {
                listenerAction = isComedy ? "laughing" : "shockedFall";
            }
            else if (emotion == "laughing" && action != "eating")
            {
                listenerAction = isComedy ? "slapForehead" : "waving";
            }
            else if (emotion == "angry" || action == "pointing")
            {
                listenerAction = isComedy ? "shockedFall" : "calm";
            }
            else if (action == "praying")
            {
                listenerAction = "praying";
            }
        }

        // Stage target tells WebGL where the speaker moves/sits/interacts inside the 3D set
        var stageTarget = setting switch
        {
            SceneSetting.BarberShop => isBarberRole ? "barberStand" : "barberChair",
            SceneSetting.Courtroom => isJudgeRole ? "judgeBench" : "witnessStand",
            SceneSetting.DoctorClinic => isDoctorRole ? "doctorDesk" : "patientBed",
            SceneSetting.Bedroom when action is "sleeping" or "wakingUp" or "sitting" => "bed",
            SceneSetting.LivingRoom when action is "sitting" or "sleeping" => "sofa",
            SceneSetting.Kitchen or SceneSetting.SweetShop or SceneSetting.ChaiStall when action is "eating" or "stirring" or "sipping" or "walking" or "pointing" => "counter",
            SceneSetting.DoorwaySet when action is "walking" or "running" => "door",
            _ when action is "walking" or "running" => "center",
            _ => "default"
        };

        var cameraShot = explicitShot;
        if (cameraShot is null)
        {
            if (turnInScene == 0 || action is "walking" or "running" || slot == DialogueSpeakerSlot.Narrator)
                cameraShot = "wideEstablishing";
            else if (action is "punching" or "kicking")
                cameraShot = "twoShot";
            else if (action is "shockedFall" or "wakingUp" || (turnIndex == totalTurns - 1 && isComedy))
                cameraShot = "crashPunch";
            else if (action is "removingTowel" or "lookInMirror")
                cameraShot = "twoShot";
            else if (action is "cutting" or "combing")
                cameraShot = turnIndex % 2 == 0 ? "twoShot" : "overShoulder";
            else if (emotion is "angry" or "confused" || action is "slapForehead" || action is "eating" or "callingPhone" or "showingKey")
                cameraShot = "closeUpSpeaker";
            else if (emotion == "surprised")
                cameraShot = isComedy ? "reactionZoom" : "closeUpSpeaker";
            else if (action is "praying" or "aarti" || emotion == "proud")
                cameraShot = "lowDramatic";
            else if (isComedy)
                cameraShot = (turnIndex % 5) switch
                {
                    0 => "closeUpSpeaker",
                    1 => "overShoulder",
                    2 => "reactionZoom",
                    3 => "closeUpSpeaker",
                    _ => "twoShot"
                };
            else
                cameraShot = (turnIndex % 3) switch
                {
                    0 => "closeUpSpeaker",
                    1 => "twoShot",
                    _ => "overShoulder"
                };
        }

        return (action, listenerAction, cameraShot, stageTarget, speakerProp, listenerProp);
    }

    private static (string? Prop, string? Action) InferPropAndAction(string lower, string speakerLower, SceneSetting setting)
    {
        if (ContainsAnyToken(lower, "केंची", "कैंची", "scissor", "कटिंग", "हेयरकट", "haircut", "ट्रिम", "trim", "चक-चक", "चक चक", "बाहुबली कट", "जीरो", "शेव", "shave"))
            return ("scissors", "cutting");
        if (ContainsAnyToken(lower, "स्प्रे", "spray", "पानी छिड़क", "फुस्स-फुस्स"))
            return ("sprayBottle", "spraying");
        if (ContainsAnyToken(lower, "कंघी", "comb"))
            return ("comb", "combing");
        if (ContainsAnyToken(lower, "चाबी", "key", "unlock", "जेब में", "pocket"))
            return ("key", "showingKey");
        if (ContainsAnyToken(lower, "फ़ोन", "फोन", "phone", "call", "नंबर", "मिलाओ", "mobile"))
            return ("phone", "callingPhone");
        if (ContainsAnyToken(lower, "ऑर्डर", "order", "तारीख", "फ़ैसला", "सजा", "ज़मानत", "मुकदमा", "gavel", "अदालत"))
            return ("gavel", "bangingGavel");
        if (ContainsAnyToken(lower, "इंजेक्शन", "सुई", "injection", "syringe"))
            return ("syringe", "examining");
        if (ContainsAnyToken(lower, "बुखार", "नब्ज़", "चेकअप", "stethoscope", "दवा", "doctor", "डॉक्टर"))
            return ("stethoscope", "examining");
        if (ContainsAnyToken(lower, "करोड़पति", "सवाल", "ऑप्शन", "माइक", "mic", "quiz", "anchor", "लॉक कर"))
            return ("mic", "holdingMic");
        if (ContainsAnyToken(lower, "करछी", "चम्मच", "stir", "cook", "पका", "खड़का"))
            return ("ladle", "stirring");
        if (ContainsAnyToken(lower, "कड़ाही", "रबड़ी", "लड्डू", "जलेबी", "बर्फी", "मिठाई", "समोसा", "laddoo", "sweet"))
            return ("sweetplate", "eating");
        if (ContainsAnyToken(lower, "चाय", "tea", "कुल्हड़", "कॉफी", "coffee", "केतली"))
            return ("teacup", "sipping");
        if (ContainsAnyToken(lower, "ब्लैकबोर्ड", "चॉक", "chalk", "board"))
            return ("chalk", "writingBoard");
        if (ContainsAnyToken(lower, "किताब", "कॉपी", "होमवर्क", "ग्रंथ", "शास्त्र", "वेद", "book", "scroll"))
            return ("book", "pointing");
        if (ContainsAnyToken(lower, "हवलदार", "दरोगा", "पुलिस", "कानून", "डंडा", "केस", "police", "constable"))
            return ("baton", "pointing");
        if (ContainsAnyToken(lower, "आरती", "दीया", "दीप", "aarti", "lamp"))
            return ("diya", "aarti");
        if (ContainsAnyToken(lower, "बाँसुरी", "बांसुरी", "मुरली", "flute"))
            return ("flute", "playingFlute");
        if (ContainsAnyToken(lower, "त्रिशूल", "trishul"))
            return ("trishul", "pointing");
        if (ContainsAnyToken(lower, "धनुष", "बाण", "bow"))
            return ("bow", "pointing");
        if (ContainsAnyToken(lower, "पैसे", "रुपये", "उधार", "नोट", "बिल", "money", "rupee", "bill", "wallet"))
            return ("money", "pointing");
        if (ContainsAnyToken(lower, "झाड़ू", "broom"))
            return ("broom", "sweeping");
        if (ContainsAnyToken(lower, "छाता", "छतरी", "umbrella"))
            return ("umbrella", "pointing");

        if (setting == SceneSetting.BarberShop && IsBarberName(speakerLower))
            return ("scissors", "cutting");
        if (setting == SceneSetting.ChaiStall)
            return ("teacup", null);
        if (setting == SceneSetting.Kitchen)
            return ("ladle", null);
        return (null, null);
    }

    private static bool IsBarberName(string lowerName) =>
        ContainsAnyToken(lowerName, "नाई", "barber", "salon", "amrendra", "अमरेंद्र", "stylist", "कटिंग मास्टर", "हेयर", "hair");

    private static bool IsJudgeName(string lowerName) =>
        ContainsAnyToken(lowerName, "जज", "judge", "न्यायाधीश", "magistrate");

    private static bool IsDoctorName(string lowerName) =>
        ContainsAnyToken(lowerName, "डॉक्टर", "doctor", "dr.", "वैद्य");

    private static bool IsStageActionTag(string tag) =>
        tag.Trim().Equals("ACTION", StringComparison.OrdinalIgnoreCase)
        || tag.Trim().Equals("STAGE", StringComparison.OrdinalIgnoreCase)
        || tag.Trim().Equals("SHOT", StringComparison.OrdinalIgnoreCase)
        || tag.Trim().Equals("CAMERA", StringComparison.OrdinalIgnoreCase);

    private static bool IsStagePropTag(string tag) =>
        tag.Trim().Equals("PROP", StringComparison.OrdinalIgnoreCase)
        || tag.Trim().Equals("PROPS", StringComparison.OrdinalIgnoreCase)
        || tag.Trim().Equals("TOOL", StringComparison.OrdinalIgnoreCase);

    internal static string InferEmotion(string? text)
    {
        if (string.IsNullOrWhiteSpace(text)) return "calm";
        var lower = text.ToLowerInvariant();
        if (ContainsAnyToken(lower, "क्रोध", "गुस्सा", "चिल्ला", "खबरदार", "पकड़ लिया", "नालायक", "बावले", "टोपा", "टकला", "अबे", "दिमाग़", "दिमाग", "बकवास", "मारूँगा", "थप्पड़", "चप्पल", "बदतमीज़", "छोड़ूँगा", "किस बात का", "angry", "furious", "rage", "shut up", "beware", "stop!"))
            return "angry";
        if (ContainsAnyToken(lower, "हाहा", "हँस", "हंस", "haha", "hehe", "lol", "laugh", "funny", "मज़ाक", "कमाल कर दिया"))
            return "laughing";
        if (ContainsAnyToken(lower, "अरे", "हैरान", "चौंक", "omg", "what!", "shocked", "surprised", "gasp", "असंभव", "सच में"))
            return "surprised";
        if (ContainsAnyToken(lower, "दुःख", "दुख", "क्षमा", "रो", "sad", "sorry", "tears", "worried", "चिंता"))
            return "sad";
        if (ContainsAnyToken(lower, "गर्व", "वरदान", "शाबाश", "ध्रुव तारा", "proud", "victory", "triumph", "bless", "आशीर्वाद"))
            return "proud";
        if (ContainsAnyToken(lower, "वाह", "धन्य", "जय", "नमस्ते", "प्रणाम", "शुभ", "बधाई", "happy", "congrats", "joy"))
            return "happy";
        if (lower.Contains('?'))
            return "confused";
        if (lower.TrimEnd().EndsWith('!'))
            return "angry";
        return "calm";
    }

    private static string? NormalizeEmotionTag(string rawTag)
    {
        var tag = rawTag.Trim().ToLowerInvariant();
        return tag switch
        {
            "laugh" or "laughing" or "excited" => "laughing",
            "surprised" or "shocked" or "gasp" => "surprised",
            "angry" or "shouting" or "determined" => "angry",
            "sad" or "worried" or "scared" => "sad",
            "proud" or "dramatic" => "proud",
            "happy" or "loving" or "hopeful" or "relieved" => "happy",
            "confused" or "shy" => "confused",
            "calm" or "whispering" or "neutral" => "calm",
            "mischievous" or "sarcastic" or "playful" => "laughing",
            _ => null
        };
    }

    private static string? NormalizeActionTag(string rawTag)
    {
        var tag = rawTag.Trim().ToLowerInvariant();
        return tag switch
        {
            "sleep" or "sleeping" or "snoring" or "asleep" or "सो रहा" or "सोते हुए" or "नींद" => "sleeping",
            "wake" or "wakeup" or "wake up" or "waking" or "waking up" or "उठते हुए" or "जागते हुए" or "उठकर" => "wakingUp",
            "walk" or "walking" or "enter" or "stroll" or "चलते हुए" or "आते हुए" or "टहलते हुए" => "walking",
            "run" or "running" or "sprint" or "chase" or "दौड़ते हुए" or "भागते हुए" => "running",
            "sit" or "sitting" or "seated" or "बैठकर" or "बैठते हुए" or "तपस्या" => "sitting",
            "pray" or "praying" or "namaste" or "aarti" or "प्रणाम" or "प्रार्थना" => "praying",
            "point" or "pointing" or "इशारा" or "उंगली दिखाकर" => "pointing",
            "fall" or "falling" or "shocked fall" or "stumble" or "गिरते हुए" or "चौंका" => "shockedFall",
            "facepalm" or "slap forehead" or "headslap" or "माथा पकड़कर" or "सिर पकड़कर" => "slapForehead",
            "eat" or "eating" or "drinking" or "sipping" or "खाते हुए" or "पीते हुए" => "eating",
            "dance" or "dancing" or "kathak" or "नाचते हुए" => "dancing",
            "adaab" or "aadaab" or "salam" or "अदाब" or "सलाम" => "adaab",
            "spin" or "sufispin" or "chakkar" or "twirl" or "चक्कर" => "sufiSpin",
            "jump" or "jumping" or "hop" or "कूदते हुए" => "jumping",
            "wave" or "waving" or "लहराते हुए" => "waving",
            "punch" or "punching" or "attack" or "attacking" or "fight" or "fighting" or "hit" or "dhishoom"
                or "मुक्का मारते हुए" or "घूंसा मारते हुए" or "लड़ते हुए" or "हमला" => "punching",
            "kick" or "kicking" or "flying kick" or "लात मारते हुए" or "किक" => "kicking",
            "hit react" or "hurt" or "ouch" or "चोट खाकर" => "hitReact",
            "cut" or "cutting" or "snip" or "snipping" or "केंची चलाते" or "केंची" => "cutting",
            "comb" or "combing" or "कंघी" => "combing",
            "stir" or "stirring" or "चलाते हुए" => "stirring",
            "sip" or "sipping" or "चाय पीते" => "sipping",
            "gavel" or "banging gavel" or "ऑर्डर" => "bangingGavel",
            "examining" or "checkup" or "इंजेक्शन" => "examining",
            "phone" or "calling" or "calling phone" or "फ़ोन" => "callingPhone",
            "mic" or "holding mic" or "माइक" => "holdingMic",
            "key" or "showing key" or "चाबी" => "showingKey",
            "removing towel" or "towel" or "तौलिया" => "removingTowel",
            "spray" or "spraying" or "स्प्रे" => "spraying",
            "mirror" or "शीशा" or "look in mirror" => "lookInMirror",
            "glasses" or "chasma" or "चश्मा" or "adjusting glasses" => "adjustingGlasses",
            "aarti" or "diya" or "आरती" => "aarti",
            "flute" or "playing flute" or "बाँसुरी" => "playingFlute",
            "sweep" or "sweeping" or "झाड़ू" => "sweeping",
            _ => null
        };
    }

    private static string? NormalizePropTag(string rawTag)
    {
        var tag = rawTag.Trim().ToLowerInvariant();
        return tag switch
        {
            "none" or "empty" or "nothing" => "none",
            "scissors" or "scissor" or "kainchi" or "केंची" or "कैंची" => "scissors",
            "comb" or "kanghi" or "कंघी" => "comb",
            "towel" or "तौलिया" => "towel",
            "cape" or "apron" => "cape",
            "spray" or "spraybottle" or "spray bottle" => "sprayBottle",
            "tea" or "teacup" or "cup" or "chai" or "kulhad" or "चाय" => "teacup",
            "ladle" or "spoon" or "karchhi" or "करछी" => "ladle",
            "sweet" or "sweetplate" or "laddoo" or "लड्डू" => "sweetplate",
            "key" or "keys" or "chabi" or "चाबी" => "key",
            "phone" or "mobile" or "cell" or "फ़ोन" or "फोन" => "phone",
            "gavel" or "hammer" or "हथौड़ा" => "gavel",
            "stethoscope" or "doctor" => "stethoscope",
            "syringe" or "injection" or "सुई" => "syringe",
            "mic" or "microphone" or "माइक" => "mic",
            "chalk" or "चॉक" => "chalk",
            "book" or "scroll" or "किताब" => "book",
            "baton" or "stick" or "डंडा" => "baton",
            "diya" or "lamp" or "दीया" => "diya",
            "flute" or "bansuri" or "बाँसुरी" or "बांसुरी" => "flute",
            "trishul" or "त्रिशूल" => "trishul",
            "bow" or "धनुष" => "bow",
            "money" or "cash" or "पैसे" => "money",
            "broom" or "झाड़ू" => "broom",
            "umbrella" or "छाता" => "umbrella",
            _ => null
        };
    }

    private static string? NormalizeCameraShotTag(string rawTag)
    {
        var tag = rawTag.Trim().ToLowerInvariant();
        return tag switch
        {
            "closeup" or "close up" or "close-up" or "tight shot" => "closeUpSpeaker",
            "wide" or "wide shot" or "establishing" => "wideEstablishing",
            "twoshot" or "two shot" or "two-shot" or "2-shot" => "twoShot",
            "crash zoom" or "crashzoom" or "crash" or "punch" => "crashPunch",
            "reaction" or "reaction zoom" => "reactionZoom",
            "low angle" or "low dramatic" => "lowDramatic",
            "over shoulder" or "ots" => "overShoulder",
            _ => null
        };
    }

    private static (ProceduralCharacterProfile Left, ProceduralCharacterProfile Right) ApplyVisualContinuityArcs(
        List<ProceduralDialogueTurn> turns,
        ProceduralCharacterProfile left,
        ProceduralCharacterProfile right)
    {
        var leftIsBarber = IsBarberName(left.Name.ToLowerInvariant());
        var rightIsBarber = IsBarberName(right.Name.ToLowerInvariant());
        var leftHasGlasses = left.HasGlasses ?? leftIsBarber || (!rightIsBarber);
        var rightHasGlasses = right.HasGlasses ?? rightIsBarber;
        int? ultaTurnLeft = null;
        int? ultaTurnRight = null;

        for (var i = 0; i < turns.Count; i++)
        {
            var t = turns[i];
            if (t.IsTitleHook) continue;
            var lower = (t.Text ?? string.Empty).ToLowerInvariant();
            if (!ContainsAnyToken(lower, "चश्मा", "chasma", "specs", "glasses", "ऐनक")) continue;

            var speakerIsRight = string.Equals(t.SpeakerName?.Trim(), right.Name.Trim(), StringComparison.OrdinalIgnoreCase);
            var speakerIsLeft = string.Equals(t.SpeakerName?.Trim(), left.Name.Trim(), StringComparison.OrdinalIgnoreCase);
            var speakerLower = (t.SpeakerName ?? string.Empty).ToLowerInvariant();
            var selfClaimsReverse = ContainsAnyToken(lower, "पहना था मैंने", "मेरा चश्मा", "मैंने उल्टा", "my glasses");

            if (leftIsBarber && !rightIsBarber && (!speakerIsRight || !selfClaimsReverse))
            {
                leftHasGlasses = true;
                if (ContainsAnyToken(lower, "उल्टा", "ulta", "upside down") && (speakerIsLeft || ultaTurnLeft is not null || ContainsAnyToken(lower, "तेरा", "अमरेंद्र", "नाई")))
                    ultaTurnLeft = i;
            }
            else if (rightIsBarber && !leftIsBarber && (!speakerIsLeft || !selfClaimsReverse))
            {
                rightHasGlasses = true;
                if (ContainsAnyToken(lower, "उल्टा", "ulta", "upside down") && (speakerIsRight || ultaTurnRight is not null || ContainsAnyToken(lower, "तेरा", "अमरेंद्र", "नाई")))
                    ultaTurnRight = i;
            }
            else if (speakerIsRight)
            {
                rightHasGlasses = true;
                if (ContainsAnyToken(lower, "उल्टा", "ulta", "upside down"))
                    ultaTurnRight ??= i;
            }
            else if (speakerIsLeft)
            {
                leftHasGlasses = true;
                if (ContainsAnyToken(lower, "उल्टा", "ulta", "upside down"))
                    ultaTurnLeft ??= i;
            }
        }

        for (var i = 0; i < turns.Count; i++)
        {
            var t = turns[i];
            var lower = (t.Text ?? string.Empty).ToLowerInvariant();
            string stateForSlot(DialogueSpeakerSlot s, int? revealIdx, bool hasSpec, string? act)
            {
                if (!hasSpec) return "none";
                if (revealIdx is { } rIdx)
                {
                    if (i < rIdx) return "ulta";
                    if (i == rIdx) return "flipping";
                }
                if (ContainsAnyToken(lower, "चश्मा उतार", "उतार दे", "take off glasses", "remove glasses"))
                    return "forehead";
                if (act is "hitReact" or "shockedFall" or "slapForehead")
                    return "crooked";
                return "normal";
            }

            var leftAction = t.Slot == DialogueSpeakerSlot.Left ? t.Action : t.ListenerAction;
            var rightAction = t.Slot == DialogueSpeakerSlot.Right ? t.Action : t.ListenerAction;
            var leftState = stateForSlot(DialogueSpeakerSlot.Left, ultaTurnLeft, leftHasGlasses, leftAction);
            var rightState = stateForSlot(DialogueSpeakerSlot.Right, ultaTurnRight, rightHasGlasses, rightAction);

            // When a supporting guest tells the customer to look in the mirror ("शीशे में देख"), trigger customer lookInMirror!
            var updatedListenerAct = t.ListenerAction;
            if (ContainsAnyToken(lower, "शीशे में", "शीशा देख", "mirror")
                && t.Action is not "lookInMirror"
                && t.ListenerAction is null or "none" or "laughing" or "calm" or "cutting")
            {
                updatedListenerAct = "lookInMirror";
            }

            turns[i] = t with
            {
                ListenerAction = updatedListenerAct,
                SpeakerGlasses = t.Slot == DialogueSpeakerSlot.Left ? leftState
                    : t.Slot == DialogueSpeakerSlot.Right ? rightState
                    : leftState,
                ListenerGlasses = t.Slot == DialogueSpeakerSlot.Left ? rightState
                    : t.Slot == DialogueSpeakerSlot.Right ? leftState
                    : rightState
            };
        }

        return (left with { HasGlasses = leftHasGlasses }, right with { HasGlasses = rightHasGlasses });
    }

    private static bool ContainsAnyToken(string haystack, params string[] tokens) =>
        tokens.Any(haystack.Contains);

    // Fight cues for plain substring matching, so every token must be unable to hide inside an everyday word:
    // no bare "पंच" (पंचांग), "लात" (हालात), "वार" (परिवार / रविवार), "मार" (बीमार) or "hit" (white).
    private static readonly string[] KickTokens =
        ["kick", "किक", "लात मार", "लात खा", "लात पड़"];

    private static readonly string[] PunchTokens =
        ["punch", "dhishoom", "dishoom", "attack", "fight", "smack", "मुक्का", "घूंसा", "घूँसा", "थप्पड़", "ढिशुम",
         "धिशुम", "हमला", "लड़ाई", "मारूँगा", "मारूंगा", "मार दूँगा", "मार दूंगा"];

    [GeneratedRegex(@"\(([^()]{2,48})\)")]
    private static partial Regex InlineCueParenRegex();

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

    [GeneratedRegex(@"(?<=^|[\s,!.।:;?\-—""'()])(?:(?:चक|चक्|कच|खच|टप|फुस|फुस्स|सूं|भौं|म्याऊँ)(?:[\s-]*(?:चक|चक्|कच|खच|टप|फुस|फुस्स|सूं))*|ख्र+[\u0900-\u097F]*|खर्र+[\u0900-\u097F]*|(?:ट्रिंग|टिक|खट|टन|घन|फट)(?:[\s-]*(?:ट्रिंग|टिक|खट|टन|घन|फट))+|खटखट|ढिशुम|धिशुम|धड़ाम|(?:snip|tick|knock|ring|ding)(?:[\s-]*(?:snip|tick|knock|ring|ding))+|z{3,})(?=$|[\s,!.।:;?\-—""'()])", RegexOptions.IgnoreCase)]
    private static partial Regex SfxOnomatopoeiaRegex();

    [GeneratedRegex(@"\s+([!।?.,])")]
    private static partial Regex OrphanedPunctuationRegex();

    [GeneratedRegex(@"\s+")]
    private static partial Regex MultiSpaceRegex();
}
