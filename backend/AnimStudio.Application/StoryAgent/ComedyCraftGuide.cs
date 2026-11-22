using System.Globalization;
using System.Text;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Domain.Assets;
using AnimStudio.Domain.Effects;
using AnimStudio.Domain.Rendering;
using AnimStudio.Domain.Stories;

namespace AnimStudio.Application.StoryAgent;

/// <summary>
/// Shared YouTube-tuned comedy configuration, authentic Hindi/English banter styles (Khadi Bhasha,
/// Tu-Tadak buddy banter, Roast &amp; Twist, Family Clean), and automatic mid-video meme placement across
/// Story Agent, Automation Hub, Templates, Comedy Workspace, and Procedural 3D renders.
/// </summary>
public static class ComedyCraftGuide
{
    public const int MaxPromptMemes = 14;
    private const double DefaultMemeSeconds = 1.6;

    public static bool IsComedyContext(
        string? genreId,
        string? genreCategory = null,
        BrandChannel? channel = null)
    {
        if (string.Equals(genreId, StoryGenres.FunnyId, StringComparison.OrdinalIgnoreCase))
            return true;
        if (string.Equals(genreCategory, "Comedy", StringComparison.OrdinalIgnoreCase))
            return true;
        if (channel is not null && (channel.IsComedyChannel ||
            ComedyChannelMatcher.IsComedyChannelHint(
                channel.Name,
                channel.Publishing?.YouTubeChannelHandle,
                channel.Publishing?.YouTubeChannelTitle)))
            return true;

        return false;
    }

    public static bool IsComedyRun(StoryRun? run, BrandChannel? channel = null) =>
        run is not null && IsComedyContext(run.Brief.GenreId, run.Genre?.Category, channel);

    private const int MemeLibraryFetchLimit = 200;

    /// <summary>Loads the run's comedy channel settings and owner's meme library when operating on a comedy run/channel.</summary>
    public static async Task<(BrandChannel? Channel, IReadOnlyList<EffectClip> Memes, bool IsComedy)> LoadContextAsync(
        StoryRun run,
        IEffectClipRepository? effects,
        IAiSettingsRepository? aiSettings,
        CancellationToken ct)
    {
        BrandChannel? channel = null;
        if (aiSettings is not null && !string.IsNullOrWhiteSpace(run.Brief.BrandChannelId) && !BrandChannel.IsDefault(run.Brief.BrandChannelId))
        {
            var settings = await aiSettings.GetAsync(ct).ConfigureAwait(false);
            channel = settings?.FindChannel(run.Brief.BrandChannelId);
        }

        var isComedy = IsComedyRun(run, channel);
        if (!isComedy || effects is null)
            return (channel, [], isComedy);

        var loaded = await effects.ListByUserAsync(run.UserId, MemeLibraryFetchLimit, ct).ConfigureAwait(false);
        return (channel, [.. loaded], true);
    }

    public static ComedyToneStyle EffectiveToneForRun(StoryRun run, BrandChannel? channel = null)
    {
        if (run.Brief.ComedyStyle != ComedyToneStyle.Auto)
            return run.Brief.ComedyStyle;
        if (channel is not null && channel.ComedyStyle != ComedyToneStyle.Auto)
            return channel.ComedyStyle;
        return ComedyToneStyle.Auto;
    }

    public static string DescribeTone(ComedyToneStyle requested, string? language)
    {
        var isHindi = !string.Equals(language?.Trim(), "en", StringComparison.OrdinalIgnoreCase);
        if (!isHindi)
        {
            return requested switch
            {
                ComedyToneStyle.KhadiBhasha =>
                    "Desi-spiced earthy street banter in crisp English with cheeky rural-meets-city expressions and fast comebacks.",
                ComedyToneStyle.TuTadak =>
                    "Unfiltered casual best-friend banter ('bro wait', 'you serious?', 'stop lying') — teasing, rapid-fire, zero slurs or hate.",
                ComedyToneStyle.RoastAndTwist =>
                    "Dry deadpan confidence punctured by brutal 6-word friend roasts and an upside-down plot twist payoff.",
                ComedyToneStyle.FamilyClean =>
                    "Clean, bouncy situational slapstick comedy suitable for all ages — warm teasing with big animated reactions.",
                ComedyToneStyle.GlobalSlapstick =>
                    "Zero-dialogue / minimal-text worldwide 3D physical slapstick & seamless loop comedy: exaggerated reaction timing, doorway peek-a-boos, sky gauntlet gags, crisp cartoon SFX, zero language barrier so any country laughs.",
                ComedyToneStyle.TankSeries =>
                    "International 3D cartoon tank series (| EP XX): expressive googly-eyed tanks with personality, dramatic canyon standoffs, tiny cannon recoil twist, comic smoke puffs, crisp SFX punchline.",
                ComedyToneStyle.DesiKhadiSitcom =>
                    "MJO (@MakeJokeOf) / HardToonz viral Hindi comedy rhythm: 0:02 mid-shout cold open, snowball situational escalation every 60-90s, reverse OTS dialogue cuts + sudden bulging-eye angry close-ups, deadpan pauses before zingers, Kanpuria/UP colloquial puns, and crisp SFX reaction hits.",
                _ =>
                    "YouTube high-retention comedy blend: snappy buddy roast banter, exaggerated setups, instant interruptions, zero stiff lecturing."
            };
        }

        return requested switch
        {
            ComedyToneStyle.KhadiBhasha =>
                "असली खड़ी भाषा / देसी हरियाणवी-यूपी टच कॉमेडी (शुद्ध देवनागरी में): दोस्ताना देसी अंदाज़ इस्तेमाल करें जैसे 'अरे बावले', 'इब देख तमाशा', 'टैम खोटा ना कर', 'यो के जुगाड़ सै', 'म्हारा भैया सीधा सादा', 'दिमाग़ घुटनों में धर रखा सै क्या'। किताबी या औपचारिक हिंदी ('आप महोदय / आइए जानते हैं') बिल्कुल न लिखें।",
            ComedyToneStyle.TuTadak =>
                "बेबाक तू-तड़ाक याराना कॉमेडी (शुद्ध देवनागरी में): असली दोस्तों वाली नोकझोंक — 'अबे सुन', 'तू रहने दे भाई', 'तेरे से ना हो पाएगा', 'अबे ज़्यादा ज्ञान मत बाँट', 'ओए होए बड़ा आया शाहरुख़'। मज़ाक दोस्ताना और शालीन रहे (कोई गाली-गलौज या नफ़रत नहीं), पर औपचारिक 'आप/जी' हरगिज़ न लगाएँ।",
            ComedyToneStyle.RoastAndTwist =>
                "डेडपैन रोस्ट और सरप्राइज़ ट्विस्ट: एक किरदार बड़े आत्मविश्वास से फेंके, दूसरा 5-8 शब्दों में बेबाक रोस्ट कर दे, और आखिरी लाइन पूरा खेल पलट दे।",
            ComedyToneStyle.FamilyClean =>
                "साफ़-सुथरी फैमिली व बच्चों की स्लैपस्टिक कॉमेडी: 'अरे वाह' और मज़ेदार स्थितिजन्य गड़बड़ी — बिना 'अबे/तू' की कड़वाहट के सबके साथ देखने लायक हँसी।",
            ComedyToneStyle.GlobalSlapstick =>
                "इंटरनेशनल नॉन-डायलॉग 3D स्लैपस्टिक व सीमलेस लूप कॉमेडी: शब्दों से ज़्यादा चेहरे के एक्सप्रेशन, डोरवे पीक-अ-बू, स्काई ब्रिज बाधा और शॉकिंग कार्टून साउंड इफ़ेक्ट्स (ताकि पूरी दुनिया बिना भाषा की रुकावट के देखे)।",
            ComedyToneStyle.TankSeries =>
                "कार्टून टैंक कॉमेडी सीरीज़ (| EP XX): गोल-मटोल आँखों वाले 3D टैंक कैरेक्टर, रणभूमि में बड़ा दावा और अचानक फुस्स तोप का ज़बरदस्त ट्विस्ट।",
            ComedyToneStyle.DesiKhadiSitcom =>
                "MJO (@MakeJokeOf) स्टाइल देसी खड़ी/कानपुरिया कॉमेडी सिटकॉम (| EP XX): पहले 2 सेकंड में तेज़ नोकझोंक से शुरुआत, 'अरे बावले / टोपा हो का / अबे सुन' जैसी बोलचाल की भाषा, हर 60-90 सेकंड में नया पड़ोसी/किरदार या बखेड़ा (Snowball Escalation), रिवर्स क्लोज़-अप पंच और अंत में उल्टा ट्विस्ट + मुस्कुराने वाला आउट्रो ('Share this to make someone smile').",
            _ =>
                "यूट्यूब हाई-रिटेंशन देसी कॉमेडी (खड़ी भाषा + तू-तड़ाक याराना मिक्स): 'अबे सुन', 'इब के करैगो', 'अरे बावले', 'तू रहने दे भाई' जैसी आम बोलचाल की मज़ेदार भाषा बोलें। कोई किताबी उपदेश या 'आइए जानें / मित्र' वाली औपचारिकता बिल्कुल न रखें।"
        };
    }

    public static IReadOnlyList<EffectClip> RankReactionMemes(IEnumerable<EffectClip>? clips) =>
        (clips ?? [])
            .Where(c => c is not null && !string.IsNullOrWhiteSpace(c.Name))
            .OrderByDescending(c => c.Category == EffectCategory.Reaction)
            .ThenByDescending(c => c.Kind is AssetKind.Video or AssetKind.Image)
            .ThenByDescending(c => c.Tags.Count)
            .ThenByDescending(c => c.CreatedAt)
            .ToList();

    public static string MemeCatalogPromptBlock(IEnumerable<EffectClip>? clips)
    {
        var ranked = RankReactionMemes(clips).Take(MaxPromptMemes).ToList();
        if (ranked.Count == 0)
        {
            return "Available in-app memes: (creator library is currently empty — still place funny reaction meme cues with short reaction names like \"shocked_face\" / \"dimag_hang\" and a crisp caption so the editor holds a punchy zoom freeze-frame under it).";
        }

        var lines = ranked.Select(c =>
        {
            var kind = c.Kind == AssetKind.Video ? "video" : c.Kind == AssetKind.Image ? "image" : "sound";
            var tags = c.Tags.Count > 0 ? $" [tags: {string.Join(", ", c.Tags.Take(4))}]" : string.Empty;
            return $"- \"{c.Name}\" ({kind}{tags})";
        });
        return "CREATOR'S IN-APP MEMES (use these exact names cleanly when placing mid-video and ending memes):\n" +
               string.Join('\n', lines);
    }

    /// <summary>
    /// Full YouTube-retention comedy direction shared across Story Agent, Automation AI/templates, and Comedy Workspace.
    /// </summary>
    public static string BuildPromptGuidance(
        ComedyToneStyle style,
        string? language,
        int targetSeconds,
        IEnumerable<EffectClip>? libraryClips,
        bool includeMidMemes = true,
        bool isProceduralFormat = false)
    {
        var sb = new StringBuilder();
        sb.AppendLine("YOUTUBE FUNNIER CHANNEL AUTO-CONFIG & RETENTION FORMULA (MANDATORY FOR COMEDY):");
        sb.AppendLine($"- Spoken Dialect & Voice: {DescribeTone(style, language)}");
        sb.AppendLine(targetSeconds <= 45
            ? "- 0-2.5s Cold-Open Hook: Start mid-argument, absurd lie, or hilarious chaos on line 1 (NEVER 'नमस्कार दोस्तों' / 'आज की कहानी है')."
            : targetSeconds >= 600
                ? "- Long Episode Snowball Arc (10m-60m): Start immediately inside a funny everyday friction (barber queue, neighborhood gate, courtroom, clinic, classroom, tea shop), escalate absurdly every 60-90 seconds as stubborn bystanders join with wild misunderstandings, land deadpan silent beats before zingers, and end on an ironic reversal twist."
                : "- Fast Retention Pacing: Open with a provocative comic problem in the first 3 seconds, then escalate via Rule of Three (small exaggeration -> double-down -> hilarious crash).");
        sb.AppendLine("- Angry Interruptions, Clear Blame & Contrast Voices: Write snappy conversational cut-offs where one character's bragging/excuse trails off (`...`) and the victim/listener IMMEDIATELY explodes back with `(angry)` or `(surprised)` rage — keep fault & perspective 100% logical (only the victim who got bald/cheated yells 'तूने मुझे टकला कर दिया!', never the barber blaming the victim awkwardly), vary energy fiercely with loud irritated shouting & deadpan stares instead of flat polite narration.");
        sb.AppendLine("- Punchy Timing: Keep dialogue lines crisp (6-16 words), interrupting each other with quick comebacks and wild emotion switches (proud -> angry cut-off -> panicked excuse -> cheeky laugh).");
        sb.AppendLine("- Ending: End on a sudden comedic reversal, deadpan mic-drop, or relatable comment-bait roast — NEVER give a pious 'कथा की सीख / Moral of the story' sermon.");
        if (isProceduralFormat)
        {
            sb.AppendLine("- Physical Comedy, Props & Blocking Tags: Start a line with action/prop cues in brackets so the 3D cast visibly holds tools and acts it out — e.g. `(cutting)`, `(combing)`, `(spraying)`, `(removing towel)`, `(look in mirror)`, `(adjusting glasses)`, `(phone)`, `(key)`, `(gavel)`, `(mic)`, `(tea)`, `(ladle)`, `(running)`, `(dancing)`, `(eating)`, `(facepalm)`, `(angry)`, `(laughing)`, `(surprised)`, `(sleeping)`, `(punch)`, `(kick)` or `[PROP]: scissors | comb | towel | sprayBottle`.");
            sb.AppendLine("- Show Don't Just Tell: Whenever dialogue mentions scissors/कटिंग/केंची, towel/तौलिया, upside-down/crooked glasses (चश्मा उल्टा), mirror check (शीशे में देख), phone call/फ़ोन, key/चाबी, teacup/चाय, gavel/ऑर्डर, mic, stethoscope, or cooking kadhai, write explicit action/emotion contrast (`angry` triggers red cheek flush + ear steam + kettle SFX; `laughing` triggers crescent-eye guffaws) AND keep mechanical sounds only in SFX triggers rather than robotic spoken reading.");
            sb.AppendLine("- Slapstick Only: a (punch)/(kick) beat must be cartoon slapstick between friends (bonk, dhishoom, both laugh after) — no blood, weapons, injury detail or real people, so the video stays advertiser-friendly.");
            sb.AppendLine("- Places: a `[SCENE]: <place> | <dawn/day/sunset/night> | <mood>` line moves the story (barber shop, courtroom, doctor clinic, classroom, quiz studio, neighborhood gate, forest, river ghat, village, city, chai stall, kitchen, living room, bedroom); outdoor places add their natural ambience automatically.");
        }

        if (includeMidMemes)
        {
            sb.AppendLine(isProceduralFormat
                ? "- Mid-Video & Climax Meme Cutaways: Insert 1 or 2 `[MEME]: <meme name> | <short funny reaction caption>` lines right IN THE MIDDLE of the story after the boldest lie/roast AND 1 at the climax payoff (never spoken aloud)."
                : "- Mid-Video & Climax Meme Cutaways: Put `\"funnyEnding\": {\"meme\": \"<meme name>\", \"caption\": \"<short 2-5 word punchline>\", \"seconds\": 1.6}` on 1-2 MIDDLE buildup reaction scenes (around 40%-70% mark) as well as the climax scene!");
            sb.AppendLine(MemeCatalogPromptBlock(libraryClips));
        }

        return sb.ToString().TrimEnd();
    }

    /// <summary>
    /// Automatically ensures comedy runs get mid-video + climax meme cutaways from the user's Effects library
    /// (or punchline freeze-frames if no meme clip is uploaded yet) and binds AI meme names to real library clips.
    /// </summary>
    public static void AutoAssignMidAndEndMemes(
        StoryScript script,
        IEnumerable<EffectClip>? libraryClips,
        bool autoInsertMemes,
        ComedyToneStyle style = ComedyToneStyle.Auto)
    {
        ArgumentNullException.ThrowIfNull(script);
        if (!autoInsertMemes || script.Scenes.Count < 2)
            return;

        var library = RankReactionMemes(libraryClips);
        var playables = library.Where(c => c.Kind is AssetKind.Video or AssetKind.Image).ToList();
        var usedIds = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        // 1. Bind any existing scene memes lacking an EffectId cleanly to matching Reaction library clips.
        foreach (var scene in script.Scenes)
        {
            if (scene.Meme is null) continue;
            if (!string.IsNullOrWhiteSpace(scene.Meme.EffectId))
            {
                usedIds.Add(scene.Meme.EffectId);
                continue;
            }

            if (MatchLibraryMeme(scene.Meme.Name, playables) is { } matched)
            {
                scene.Meme.EffectId = matched.Id;
                scene.Meme.Name = matched.Name;
                usedIds.Add(matched.Id);
            }
        }

        var isHindi = !string.Equals(script.Language, "en", StringComparison.OrdinalIgnoreCase);

        // 2. Ensure at least one MIDDLE scene (when 3+ scenes exist) delivers a mid-video meme pattern interrupt.
        if (script.Scenes.Count >= 3)
        {
            var midHasMeme = script.Scenes
                .Skip(1)
                .Take(script.Scenes.Count - 2)
                .Any(s => s.Meme is not null);

            if (!midHasMeme)
            {
                var target = PickBestMidReactionScene(script.Scenes);
                target.Meme = CreateMemeBeat(target, playables, usedIds, style, isHindi, isClimax: false);
            }
        }

        // 3. Ensure the climax/final scene also lands a punchline meme payoff if missing.
        var last = script.Scenes[^1];
        if (last.Meme is null)
        {
            last.Meme = CreateMemeBeat(last, playables, usedIds, style, isHindi, isClimax: true);
        }
    }

    public static EffectClip? MatchLibraryMeme(string? cueName, IReadOnlyList<EffectClip> library)
    {
        if (library.Count == 0 || string.IsNullOrWhiteSpace(cueName)) return null;
        var target = Squash(cueName);
        if (target.Length == 0) return null;

        // Exact normalized name or tag match first
        foreach (var clip in library)
        {
            if (Squash(clip.Name) == target || clip.Tags.Any(t => Squash(t) == target))
                return clip;
        }

        // Partial keyword overlap (e.g. cue "shocked reaction" -> library clip "Shocked Face")
        var words = Tokenize(cueName);
        EffectClip? best = null;
        var bestScore = 0;
        foreach (var clip in library)
        {
            var clipTokens = Tokenize(clip.Name).Concat(clip.Tags.SelectMany(Tokenize)).ToHashSet(StringComparer.OrdinalIgnoreCase);
            var overlap = words.Count(w => clipTokens.Contains(w));
            if (overlap > bestScore)
            {
                bestScore = overlap;
                best = clip;
            }
        }

        return bestScore > 0 ? best : null;
    }

    private static StoryScene PickBestMidReactionScene(IReadOnlyList<StoryScene> scenes)
    {
        StoryScene best = scenes[scenes.Count / 2];
        var bestScore = int.MinValue;
        for (var i = 1; i < scenes.Count - 1; i++)
        {
            var scene = scenes[i];
            var score = 0;
            foreach (var line in scene.Lines)
            {
                score += line.Emotion switch
                {
                    "surprised" or "sarcastic" or "laughing" or "angry" => 4,
                    "confused" or "shouting" or "disgusted" or "mischievous" => 3,
                    "excited" or "scared" or "proud" => 2,
                    _ => 0
                };
            }
            if (scene.Narration.Contains('?') || scene.Narration.Contains('!')) score += 2;
            // Mild preference for right around 45%-65% through the video
            var midDist = Math.Abs(i - scenes.Count / 2);
            score -= midDist;
            if (score > bestScore)
            {
                bestScore = score;
                best = scene;
            }
        }
        return best;
    }

    private static StoryMemeBeat CreateMemeBeat(
        StoryScene scene,
        IReadOnlyList<EffectClip> playables,
        HashSet<string> usedIds,
        ComedyToneStyle style,
        bool isHindi,
        bool isClimax)
    {
        var sceneHints = string.Join(' ', scene.Lines.Select(l => l.Emotion)) + " " + scene.Mood + " " + scene.Headline;
        var hintWords = Tokenize(sceneHints);

        EffectClip? picked = null;
        var bestScore = -1;
        foreach (var clip in playables)
        {
            if (usedIds.Contains(clip.Id) && playables.Count > usedIds.Count) continue;
            var tokens = Tokenize(clip.Name).Concat(clip.Tags.SelectMany(Tokenize)).ToHashSet(StringComparer.OrdinalIgnoreCase);
            var score = hintWords.Count(tokens.Contains) * 3 + (clip.Category == EffectCategory.Reaction ? 2 : 0) + (clip.Kind == AssetKind.Video ? 1 : 0);
            if (score > bestScore)
            {
                bestScore = score;
                picked = clip;
            }
        }

        if (picked is not null)
        {
            usedIds.Add(picked.Id);
            return new StoryMemeBeat
            {
                Name = picked.Name,
                EffectId = picked.Id,
                Caption = DefaultCaptionForScene(scene, style, isHindi, isClimax),
                Seconds = picked.Kind == AssetKind.Video ? DefaultMemeSeconds : 1.5
            };
        }

        // Graceful freeze-frame meme reaction caption when user hasn't uploaded library memes yet.
        return new StoryMemeBeat
        {
            Name = isClimax
                ? (isHindi ? "khatam_tata_bye" : "emotional_damage")
                : (style == ComedyToneStyle.KhadiBhasha ? "are_baawle_shock" : "dimag_hang"),
            Caption = DefaultCaptionForScene(scene, style, isHindi, isClimax),
            Seconds = 1.5
        };
    }

    private static string DefaultCaptionForScene(StoryScene scene, ComedyToneStyle style, bool isHindi, bool isClimax)
    {
        var lastEmotion = scene.Lines.LastOrDefault()?.Emotion ?? scene.Mood ?? string.Empty;
        if (!isHindi)
        {
            return isClimax
                ? "Plot twist nobody survived!"
                : lastEmotion switch
                {
                    "surprised" => "Wait... WHAT did he say?!",
                    "sarcastic" or "mischievous" => "Bro forgot his own lie!",
                    _ => "Hold up — reality check!"
                };
        }

        if (style == ComedyToneStyle.KhadiBhasha)
        {
            return isClimax
                ? "इब बोल... मोये मोये हो गया!"
                : "अरे बावले, यो के बोल दिया!";
        }

        return isClimax
            ? "ख़त्म... टाटा... बाय-बाय!"
            : lastEmotion switch
            {
                "sarcastic" => "भाई का ओवरकॉन्फिडेंस लीक!",
                "angry" => "अब बचेगा नहीं ये!",
                _ => "दिमाग़ सिस्टम हैंग हो गया!"
            };
    }

    private static string Squash(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return string.Empty;
        return new string([.. value.Where(char.IsLetterOrDigit)]).ToLower(CultureInfo.InvariantCulture);
    }

    private static IReadOnlyList<string> Tokenize(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return [];
        return value.Split([' ', '_', '-', ',', '.', '!', '?'], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(t => t.ToLowerInvariant())
            .Where(t => t.Length >= 3)
            .ToList();
    }
}
