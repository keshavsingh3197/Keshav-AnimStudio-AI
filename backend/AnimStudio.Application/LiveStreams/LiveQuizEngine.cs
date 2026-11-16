using System.Security.Cryptography;
using System.Text.RegularExpressions;

namespace AnimStudio.Application.LiveStreams;

/// <summary>
/// Pure domain logic for bilingual live-stream quizzes: answer extraction from YouTube Live Chat,
/// participant deduplication, unbiased CSPRNG winner selection, and Keshav's First Live Playbook.
/// </summary>
public static partial class LiveQuizEngine
{
    public const string CryptographicAlgorithmName = "CSPRNG (RandomNumberGenerator.GetInt32)";

    private static readonly string[] ValidKeys = ["A", "B", "C", "D"];

    public static string? NormalizeOptionKey(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return null;
        var s = raw.Trim().ToUpperInvariant();
        if (s is "1") return "A";
        if (s is "2") return "B";
        if (s is "3") return "C";
        if (s is "4") return "D";
        return Array.IndexOf(ValidKeys, s) >= 0 ? s : null;
    }

    /// <summary>
    /// Extracts a single unambiguous answer option ("A".."D") from a YouTube Live Chat message.
    /// Rejects spam messages containing multiple options (e.g. "A B C D" or "1 or 2").
    /// </summary>
    public static string? ParseAnswerOption(string? rawText, IReadOnlyList<LiveQuizOption>? options = null)
    {
        if (string.IsNullOrWhiteSpace(rawText)) return null;
        var trimmed = rawText.Trim();
        if (trimmed.Length > 240) trimmed = trimmed[..240];

        // 1. Explicit command syntax first: !ans B, /ans C, ans: D, answer A, विकल्प B
        var commandMatch = CommandOptionPattern().Match(trimmed);
        if (commandMatch.Success)
            return NormalizeOptionKey(commandMatch.Groups[1].Value);

        // 2. Reject multi-option spam messages such as "A B C" or "A, B"
        var allLetterTokens = AllOptionLettersPattern().Matches(trimmed);
        var distinctTokens = allLetterTokens
            .Select(m => NormalizeOptionKey(m.Groups[1].Value))
            .Where(k => k is not null)
            .Distinct(StringComparer.Ordinal)
            .ToList();

        if (distinctTokens.Count > 1)
            return null;

        // 3. Standalone letter or numeric key (with optional brackets/punctuation)
        var standalone = StandaloneOptionPattern().Match(trimmed);
        if (standalone.Success)
        {
            var normalized = NormalizeOptionKey(standalone.Groups[1].Value);
            if (normalized is not null && (options is null || options.Any(o => string.Equals(o.Key, normalized, StringComparison.OrdinalIgnoreCase))))
                return normalized;
        }

        // 4. Exact or high-confidence match against one option's English or Hindi text
        if (options is { Count: > 0 })
        {
            var folded = NormalizeText(trimmed);
            if (folded.Length >= 2)
            {
                var matchedKeys = options
                    .Where(o =>
                        (!string.IsNullOrWhiteSpace(o.Text) && NormalizeText(o.Text) == folded) ||
                        (!string.IsNullOrWhiteSpace(o.TextHi) && NormalizeText(o.TextHi) == folded))
                    .Select(o => NormalizeOptionKey(o.Key))
                    .Where(k => k is not null)
                    .Distinct(StringComparer.Ordinal)
                    .ToList();

                if (matchedKeys.Count == 1)
                    return matchedKeys[0];
            }
        }

        return null;
    }

    public static string NormalizeParticipantKey(string? channelId, string? handle, string? title)
    {
        var cid = (channelId ?? string.Empty).Trim();
        if (!string.IsNullOrWhiteSpace(cid))
            return "yt:" + cid;

        var h = (handle ?? string.Empty).Trim().TrimStart('@').ToLowerInvariant();
        if (!string.IsNullOrWhiteSpace(h))
            return "h:" + h;

        var t = (title ?? string.Empty).Trim().ToLowerInvariant();
        return string.IsNullOrWhiteSpace(t) ? "anon:" + Guid.NewGuid().ToString("n")[..8] : "n:" + t;
    }

    /// <summary>
    /// Deduplicates submissions per participant (keeping earliest answer so answers cannot be
    /// changed mid-round), filters to correct entries, and chooses a winner with <see cref="RandomNumberGenerator"/>.
    /// </summary>
    public static (LiveQuizEntry? Winner, int EligibleCount, int TotalUniqueEntrants) SelectCryptographicWinner(
        IEnumerable<LiveQuizEntry> entries,
        Func<int, int>? randomIndexProvider = null)
    {
        var uniqueByParticipant = entries
            .Where(e => !string.IsNullOrWhiteSpace(e.ParticipantKey))
            .OrderBy(e => e.SubmittedAtUtc)
            .ThenBy(e => e.Id, StringComparer.Ordinal)
            .GroupBy(e => e.ParticipantKey, StringComparer.OrdinalIgnoreCase)
            .Select(g => g.First())
            .ToList();

        var eligible = uniqueByParticipant
            .Where(e => e.IsCorrect)
            .OrderBy(e => e.SubmittedAtUtc)
            .ThenBy(e => e.ParticipantKey, StringComparer.Ordinal)
            .ToList();

        if (eligible.Count == 0)
            return (null, 0, uniqueByParticipant.Count);

        var idx = randomIndexProvider is not null
            ? Math.Clamp(randomIndexProvider(eligible.Count), 0, eligible.Count - 1)
            : RandomNumberGenerator.GetInt32(eligible.Count);

        return (eligible[idx], eligible.Count, uniqueByParticipant.Count);
    }

    public static FirstLivePlaybook BuildFirstLivePlaybook() =>
        new(
            PlanTitle: "Keshav Network Grand First Live: 3D Stories, Comedy Shorts & Live Quiz Winners",
            PlanTitleHi: "केशव नेटवर्क पहला लाइव विशेष: 3D कथा, कॉमेडी शॉर्ट्स और लाइव क्विज़ विजेता",
            TotalMinutes: 35,
            SuggestedBroadcastTitle: "🔴 LIVE: Bhakta Dhruva 3D Katha + @KESHAV-ANIM-FF Comedy & Live Quiz 🏆 | Pratiyogita Winners",
            SuggestedBroadcastTitleHi: "🔴 LIVE: भक्त ध्रुव 3D कथा + @KESHAV-ANIM-FF मजेदार शॉर्ट्स और लाइव क्विज़ विजेता 🏆",
            SuggestedDescription:
                "Welcome to Keshav Singh's First Interactive Ecosystem Live Stream!\n\n" +
                "🎉 HOW TO WIN THE LIVE QUIZ:\n" +
                "1. Watch each 3D Katha, Panchang & @KESHAV-ANIM-FF comedy block.\n" +
                "2. Reply in Live Chat (!ans A / B / C / D) OR verify cleanly at https://pratiyogita.keshavsingh.in/winners (zero-log YouTube sign-in — no tokens or personal data stored!).\n" +
                "3. Random verified winner revealed LIVE on screen and archived permanently on the Hall of Winners.\n\n" +
                "🌐 Explore the Ecosystem: https://keshavsingh.in\n" +
                "📺 Channels: @omkarshivbhakti | @KESHAV-ANIM-FF | @keshavsinghworld | @pratiyogitaindia",
            SuggestedTags:
            [
                "Keshav Singh Live", "3D Animation India", "KESHAV-ANIM-FF", "OmkarShivBhakti",
                "Pratiyogita Quiz", "Live Quiz Winners", "Bhakta Dhruva", "Hindi 3D Story"
            ],
            PratiyogitaWinnersUrl: "https://pratiyogita.keshavsingh.in/winners",
            Segments:
            [
                new(1, "00:00 – 03:00", 3, "@keshavsinghworld",
                    "Welcome, Ecosystem Tour (keshavsingh.in) & Zero-Log Quiz Rules",
                    "स्वागत, वेबसाइट परिचय (keshavsingh.in) और लाइव क्विज़ नियम",
                    "Greet viewers in Hindi + English, open the OBS /live/quiz-overlay browser source, explain !ans A/B/C/D and https://pratiyogita.keshavsingh.in/winners.",
                    "हिंदी और अंग्रेज़ी में दर्शकों का स्वागत करें, /live/quiz-overlay स्क्रीन दिखाएँ और प्रतयोगिता पोर्टल पर जीरो-लॉग चैनल सत्यापन समझाएँ।",
                    false),
                new(2, "03:00 – 10:00", 7, "@omkarshivbhakti",
                    "Today's Panchang + Bhakta Dhruva 3D Animated Katha + Quiz Round #1",
                    "आज का पंचांग + भक्त ध्रुव 3D कथा + क्विज़ राउंड #1",
                    "Play prepared 3D Bhakta Dhruva short/story + Lyria bhajan track, launch Round #1 on Live Quiz Console, poll chat & draw winner #1.",
                    "तैयार 3D भक्त ध्रुव कथा व भजन चलाएँ, क्विज़ राउंड #1 शुरू करें और लाइव चैट से पहला विजेता चुनें।",
                    true),
                new(3, "10:00 – 18:00", 8, "@KESHAV-ANIM-FF",
                    "Funny Comedy Reel Showcase (15s–30s Loops & 2-Min Compilation) + Quiz Round #2",
                    "@KESHAV-ANIM-FF मजेदार 3D कॉमेडी रील्स और 2-मिनट संकलन + क्विज़ राउंड #2",
                    "Play the new @KESHAV-ANIM-FF 3D comedy shorts & musical parody reel, ask viewers which punchline won, and draw winner #2.",
                    "@KESHAV-ANIM-FF के नए 3D कॉमेडी शॉर्ट्स और पैरोडी गीत दिखाएँ, दर्शकों की प्रतिक्रिया लें और क्विज़ राउंड #2 का विजेता घोषित करें।",
                    true),
                new(4, "18:00 – 25:00", 7, "@keshavsinghworld",
                    "Songs Studio (AI Lyria Track -> 3D Video) + Live Q&A + Quiz Round #3",
                    "सॉन्ग्स स्टूडियो से 3D वीडियो डेमो + लाइव सवाल-जवाब + क्विज़ राउंड #3",
                    "Demonstrate how keshavsingh.in connects YouTube videos, Panchang, Social Analytics & AnimStudio AI; draw Pratiyogita web-verified winner #3.",
                    "keshavsingh.in पर वीडियो खोज व अन्य प्रोजेक्ट दिखाएँ, प्रतयोगिता वेब से सत्यापित तीसरे विजेता की घोषणा करें।",
                    true),
                new(5, "25:00 – 32:00", 7, "@pratiyogitaindia",
                    "Bumper Finale Quiz Round #4 + Hall of Winners Walkthrough",
                    "बंपर फाइनल क्विज़ राउंड #4 + प्रतयोगिता विजेता सूची प्रदर्शन",
                    "Launch high-stakes Round #4, combine YouTube Chat + Pratiyogita verified pool, trigger On-Stream Winner Reveal, and verify live update at /winners.",
                    "अंतिम बंपर प्रश्न पूछें, चैट व वेब प्रतिभागियों को मिलाकर CSPRNG रैंडम विजेता चुनें और /winners पेज पर तुरंत दिखाएँ।",
                    true),
                new(6, "32:00 – 35:00", 3, "@keshavsinghworld",
                    "Next Episode Teaser, Feedback & Post-Stream Short Cut",
                    "अगले लाइव की घोषणा, धन्यवाद और शॉर्ट्स क्लिप प्लान",
                    "Thank all winners, pin Hall of Winners link, and mark top funny/reveal timestamps to slice into tomorrow's Shorts.",
                    "सभी विजेताओं को बधाई दें, Hall of Winners लिंक पिन करें और कल के शॉर्ट्स के लिए मजेदार क्लिप्स चिन्हित करें।",
                    false)
            ],
            StarterQuestions:
            [
                new("q1",
                    "Which sacred mantra did Devrishi Narada teach young Bhakta Dhruva?",
                    "देवर्षि नारद ने बालक भक्त ध्रुव को किस महामंत्र की दीक्षा दी थी?",
                    [
                        new("A", "Om Namah Shivaya", "ॐ नमः शिवाय"),
                        new("B", "Om Namo Bhagavate Vasudevaya", "ॐ नमो भगवते वासुदेवाय"),
                        new("C", "Gayatri Mantra", "गायत्री मंत्र"),
                        new("D", "Om Namo Narayanaya", "ॐ नमो नारायणाय")
                    ],
                    "B",
                    "Round #1 Featured Shoutout + Verified Winner Badge"),
                new("q2",
                    "Which new Keshav Network YouTube channel is dedicated to 3D comedy shorts & musical parodies?",
                    "केशव नेटवर्क का कौन-सा नया चैनल 3D कॉमेडी शॉर्ट्स और पैरोडी वीडियो के लिए बनाया गया है?",
                    [
                        new("A", "@OmkarShivBhakti", "@OmkarShivBhakti"),
                        new("B", "@KESHAV-ANIM-FF", "@KESHAV-ANIM-FF"),
                        new("C", "@pratiyogitaindia", "@pratiyogitaindia"),
                        new("D", "@keshavsinghworld", "@keshavsinghworld")
                    ],
                    "B",
                    "Round #2 Comedy Superfan Badge + Next Short Mention"),
                new("q3",
                    "Where can you search all published channel videos across Keshav Network in Hindi or English?",
                    "केशव नेटवर्क के सभी चैनलों के प्रकाशित वीडियो हिंदी या अंग्रेज़ी में कहाँ खोजे जा सकते हैं?",
                    [
                        new("A", "keshavsingh.in", "keshavsingh.in (मुख्य पोर्टल)"),
                        new("B", "youtube.com/feed/history", "यूट्यूब हिस्ट्री"),
                        new("C", "localhost only", "केवल लोकल कंप्यूटर"),
                        new("D", "None of these", "इनमें से कोई नहीं")
                    ],
                    "A",
                    "Round #3 Ecosystem Explorer Badge + Winner Timeline Entry"),
                new("q4",
                    "Does Pratiyogita store or log your Google OAuth token when verifying your YouTube channel?",
                    "क्या प्रतयोगिता आपका यूट्यूब चैनल सत्यापित करते समय आपका Google OAuth टोकन सेव या लॉग करता है?",
                    [
                        new("A", "Yes, saved forever in cookies", "हाँ, हमेशा के लिए कुकीज़ में सेव होता है"),
                        new("B", "No — zero-log, in-memory channel name read only", "नहीं — ज़ीरो-लॉग, केवल मेमोरी में सार्वजनिक चैनल नाम पढ़ा जाता है"),
                        new("C", "Yes, emailed to admins", "हाँ, एडमिन को ईमेल किया जाता है"),
                        new("D", "Uploads videos on your behalf", "आपकी ओर से वीडियो अपलोड करता है")
                    ],
                    "B",
                    "Round #4 Grand Finale Winner Crown on pratiyogita.keshavsingh.in/winners")
            ],
            PreFlightChecklist:
            [
                "Verify at least one YouTube channel is connected under YouTube Setup with Live permission enabled.",
                "Add 2 prepared 3D videos (e.g. Bhakta Dhruva Katha + 30s @KESHAV-ANIM-FF comedy short) into Step 1 Playlist or test Camera mode.",
                "Open /live/quiz-overlay in a second browser window or OBS Browser Source (1920x1080 or 1080x1920).",
                "Check https://pratiyogita.keshavsingh.in/winners in a mobile browser to confirm active question + Hindi/English switcher.",
                "Do a 60-second Unlisted test draw using CSPRNG before flipping Privacy to Public."
            ]);

    private static string NormalizeText(string text) =>
        WhitespaceCollapsePattern().Replace(text.Trim().ToLowerInvariant(), " ");

    [GeneratedRegex(@"^(?:!ans(?:wer)?|/ans(?:wer)?|ans(?:wer)?\s*:?|option|opt|विकल्प|उत्तर)\s*[:=\-#]?\s*([A-Da-d1-4])(?:\b|[\.\)\-:!]*$)", RegexOptions.IgnoreCase)]
    private static partial Regex CommandOptionPattern();

    [GeneratedRegex(@"^\s*[\(\[#]*([A-Da-d1-4])[\)\]\.\-:!]*\s*$")]
    private static partial Regex StandaloneOptionPattern();

    [GeneratedRegex(@"(?<![A-Za-z0-9])([A-Da-d1-4])(?![A-Za-z0-9])")]
    private static partial Regex AllOptionLettersPattern();

    [GeneratedRegex(@"\s+")]
    private static partial Regex WhitespaceCollapsePattern();
}
