using System.Globalization;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
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

    /// <summary>Suggested pinned comment encouraging viewer participation (e.g. Har Har Mahadev / Jai Mata Di).</summary>
    public string? PinnedComment { get; init; }

    /// <summary>Short interactive engagement question comment for the comments section.</summary>
    public string? EngagementComment { get; init; }

    /// <summary>Extracted spoken transcript / lyrics used to build the SEO package, when available.</summary>
    public string? TranscriptText { get; init; }
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
        ["devotional-omkr"] = "highly devotional, emotional, and high-CTR for the devotional YouTube channel 'OMKR' - mention 'AnimStudio (Built by Creator)' and 'OMKR 3D Devotional Animations', include channel link https://youtube.com/@omkr-shiv, include spoken lyrics/shloka, chapters and credits in description, and write a devotional pinned comment (encouraging Har Har Mahadev / Jai Mata Di / Jai Shree Shyam comments) and an interactive question comment",
        ["devotional"] = "devotional and respectful - warm, reverent, never flippant",
        ["funny"] = "funny and playful - light jokes, witty wording, a smile in the title",
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

            var options = new List<string>();
            if (doc.RootElement.TryGetProperty("titleOptions", out var optionArray) && optionArray.ValueKind == JsonValueKind.Array)
            {
                foreach (var item in optionArray.EnumerateArray().Take(5))
                {
                    if (item.ValueKind != JsonValueKind.String) continue;
                    var option = StripAngles(AiOutputSanitizer.ToSafeLine(item.GetString(), YouTubePublishValidator.MaxTitleLength));
                    if (option is null) continue;
                    if (!options.Contains(option, StringComparer.OrdinalIgnoreCase)) options.Add(option);
                }
            }
            if (doc.RootElement.TryGetProperty("titles", out var titlesArray) && titlesArray.ValueKind == JsonValueKind.Array)
            {
                foreach (var item in titlesArray.EnumerateArray().Take(5))
                {
                    if (item.ValueKind != JsonValueKind.String) continue;
                    var option = StripAngles(AiOutputSanitizer.ToSafeLine(item.GetString(), YouTubePublishValidator.MaxTitleLength));
                    if (option is null) continue;
                    if (!options.Contains(option, StringComparer.OrdinalIgnoreCase)) options.Add(option);
                }
            }

            var title = StripAngles(AiOutputSanitizer.ToSafeLine(ReadString(doc.RootElement, "title"),
                YouTubePublishValidator.MaxTitleLength)) ?? options.FirstOrDefault();
            if (title is null) return null;
            options.RemoveAll(o => string.Equals(o, title, StringComparison.OrdinalIgnoreCase));

            var description = StripAngles(AiOutputSanitizer.ToSafeText(ReadString(doc.RootElement, "description"), 3500)) ?? string.Empty;

            var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            var tags = ReadTags(doc.RootElement, "tags", seen);
            var tagIdeas = ReadTags(doc.RootElement, "tagIdeas", seen);

            var descriptionOptions = new List<string>();
            if (doc.RootElement.TryGetProperty("descriptionOptions", out var descArray) && descArray.ValueKind == JsonValueKind.Array)
            {
                foreach (var item in descArray.EnumerateArray().Take(3))
                {
                    if (item.ValueKind != JsonValueKind.String) continue;
                    var option = StripAngles(AiOutputSanitizer.ToSafeText(item.GetString(), 3500));
                    if (option is null || string.Equals(option, description, StringComparison.Ordinal)) continue;
                    if (!descriptionOptions.Contains(option, StringComparer.Ordinal)) descriptionOptions.Add(option);
                }
            }

            var pinnedComment = StripAngles(AiOutputSanitizer.ToSafeText(ReadString(doc.RootElement, "pinnedComment"), 1000));
            var engagementComment = StripAngles(AiOutputSanitizer.ToSafeText(ReadString(doc.RootElement, "engagementComment"), 600));

            return new YouTubeMetadataSuggestion(title, description, tags)
            {
                TitleOptions = options,
                DescriptionOptions = descriptionOptions,
                TagIdeas = tagIdeas,
                PinnedComment = pinnedComment,
                EngagementComment = engagementComment
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
        if (!root.TryGetProperty(name, out var prop)) return tags;
        if (prop.ValueKind == JsonValueKind.String && prop.GetString() is { } csv)
        {
            foreach (var raw in csv.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).Take(20))
            {
                var tag = AiOutputSanitizer.ToSafeLine(raw, 40)?.TrimStart('#').Trim();
                if (string.IsNullOrEmpty(tag) || tag.IndexOfAny(['<', '>', ',', '"']) >= 0) continue;
                if (seen.Add(tag)) tags.Add(tag);
            }
            return tags;
        }
        if (prop.ValueKind != JsonValueKind.Array) return tags;
        foreach (var item in prop.EnumerateArray().Take(20))
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

/// <summary>
/// 100% Free, Zero-Key YouTube SEO &amp; Devotional Metadata Generator.
/// Produces high-CTR titles, full ready-to-copy descriptions (with lyrics/transcript, shloka,
/// chapters, and OMKR / AnimStudio credits), tags, pinned comments, and engagement comments
/// in Pure Hindi (Devanagari) or English — and fills in any fields left empty by cloud LLMs.
/// </summary>
public static class YouTubeFreeSeoEngine
{
    public const string FreeLocalProviderId = "free-local-seo";
    public const string FreePollinationsProviderId = "pollinations-free";

    public static YouTubeMetadataSuggestion EnsureComplete(
        YouTubeMetadataSuggestion parsed,
        string summary,
        string style,
        string? toneId,
        string language,
        string? brief,
        string? transcriptText = null,
        YouTubeSeoExtras? extras = null)
    {
        var fallback = Generate(summary, style, toneId, language, brief, transcriptText, extras);
        return parsed with
        {
            TitleOptions = parsed.TitleOptions.Count > 0 ? parsed.TitleOptions : fallback.TitleOptions,
            DescriptionOptions = parsed.DescriptionOptions.Count > 0 ? parsed.DescriptionOptions : fallback.DescriptionOptions,
            Tags = parsed.Tags.Count > 0 ? parsed.Tags : fallback.Tags,
            TagIdeas = parsed.TagIdeas.Count > 0 ? parsed.TagIdeas : fallback.TagIdeas,
            PinnedComment = !string.IsNullOrWhiteSpace(parsed.PinnedComment) ? parsed.PinnedComment : fallback.PinnedComment,
            EngagementComment = !string.IsNullOrWhiteSpace(parsed.EngagementComment) ? parsed.EngagementComment : fallback.EngagementComment,
            TranscriptText = !string.IsNullOrWhiteSpace(parsed.TranscriptText) ? parsed.TranscriptText : transcriptText
        };
    }

    public static YouTubeMetadataSuggestion Generate(
        string summary,
        string style,
        string? toneId,
        string language,
        string? brief,
        string? transcriptText = null,
        YouTubeSeoExtras? extras = null)
    {
        extras ??= YouTubeSeoExtras.None;
        var isHindi = string.Equals(language, "hi", StringComparison.OrdinalIgnoreCase);
        var isShort = style.Contains("Short", StringComparison.OrdinalIgnoreCase);
        var isOmkr = string.Equals(toneId, "devotional-omkr", StringComparison.OrdinalIgnoreCase)
                     || summary.Contains("OMKR", StringComparison.OrdinalIgnoreCase)
                     || (brief?.Contains("OMKR", StringComparison.OrdinalIgnoreCase) ?? false);
        var isDevotional = isOmkr
                           || string.Equals(toneId, "devotional", StringComparison.OrdinalIgnoreCase)
                           || ContainsDevotionalKeywords(summary + " " + brief + " " + transcriptText);

        var rawSubject = ExtractBestSubject(summary, brief, transcriptText, isHindi, isDevotional);
        var cleanSubject = CleanTitleSubject(rawSubject);
        var lyricsSnippet = ExtractCleanLyricsBlock(summary, transcriptText);
        var firstLyricLine = ExtractFirstLyricLine(lyricsSnippet);

        // Content that isn't devotional gets plain, topic-led details - not OMKR's bhajan template.
        if (!isDevotional)
            return GenericSeo.Generate(summary, cleanSubject, firstLyricLine, lyricsSnippet, transcriptText, isHindi, isShort, extras);

        var deity = DetectDeity(summary + " " + brief + " " + transcriptText + " " + cleanSubject);

        var titles = BuildTitles(cleanSubject, firstLyricLine, deity, isHindi, isDevotional, isOmkr, isShort);
        var primaryTitle = titles[0];
        var titleOptions = titles.Skip(1).Take(4).ToList();

        var mainDesc = WithMusicCredits(BuildDescription(cleanSubject, lyricsSnippet, deity, isHindi, isDevotional, isOmkr, isShort, variant: 0, extras), extras);
        var shortDesc = WithMusicCredits(BuildDescription(cleanSubject, lyricsSnippet, deity, isHindi, isDevotional, isOmkr, isShort, variant: 1, extras), extras);
        var detailedDesc = WithMusicCredits(BuildDescription(cleanSubject, lyricsSnippet, deity, isHindi, isDevotional, isOmkr, isShort, variant: 2, extras), extras);

        var (tags, tagIdeas) = BuildTags(cleanSubject, deity, isHindi, isDevotional, isOmkr, isShort);
        var (pinnedComment, engagementComment) = BuildComments(cleanSubject, deity, isHindi, isDevotional, isOmkr);

        return new YouTubeMetadataSuggestion(primaryTitle, mainDesc, tags)
        {
            TitleOptions = titleOptions,
            DescriptionOptions = [shortDesc, detailedDesc],
            TagIdeas = tagIdeas,
            PinnedComment = pinnedComment,
            EngagementComment = engagementComment,
            TranscriptText = transcriptText
        };
    }

    /// <summary>The detected music credited at the end of a description, when it isn't already.</summary>
    private static string WithMusicCredits(string description, YouTubeSeoExtras extras) =>
        extras.Songs.Count == 0 ? description : YouTubeVideoInsights.AddChaptersAndCredits(description, extras with { Chapters = [] });

    /// <summary>
    /// Whether the text is about devotion. "ram" and "mata" must be whole words: "ram" in
    /// "program" or "mata" in "automatic" is not a bhajan.
    /// </summary>
    private static bool ContainsDevotionalKeywords(string text)
    {
        string[] keywords =
        [
            "shiv", "mahadev", "bholenath", "shankar", "om namah", "khatu", "shyam", "mata", "durga",
            "bhavani", "navratri", "hanuman", "bajrangbali", "ram", "krishna", "radha", "ganesh",
            "bhajan", "aarti", "mantra", "chalisa", "stotra", "devotional", "bhakti", "omkr",
        ];
        string[] devanagari =
        [
            "शिव", "महादेव", "भोलेनाथ", "श्याम", "खाटू", "माता", "दुर्गा", "हनुमान", "राम", "कृष्ण", "भजन", "आरती", "भक्ति"
        ];
        return keywords.Any(k => k is "ram" or "mata"
                   ? Regex.IsMatch(text, $@"(?<![\p{{L}}\p{{N}}]){k}(ji)?(?![\p{{L}}\p{{N}}])", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)
                   : text.Contains(k, StringComparison.OrdinalIgnoreCase))
               || devanagari.Any(k => text.Contains(k, StringComparison.Ordinal));
    }

    private sealed record DeityProfile(
        string NameHi, string NameEn, string Emoji, string GreetingHi, string GreetingEn,
        string ShlokaHi, string ShlokaMeaningHi, string HashtagsHi, string HashtagsEn, string[] ExtraTags);

    private static DeityProfile DetectDeity(string text)
    {
        if (text.Contains("khatu", StringComparison.OrdinalIgnoreCase) ||
            text.Contains("shyam", StringComparison.OrdinalIgnoreCase) ||
            text.Contains("खाटू", StringComparison.Ordinal) ||
            text.Contains("श्याम", StringComparison.Ordinal))
        {
            return new DeityProfile(
                "खाटू श्याम बाबा", "Khatu Shyam Baba", "🚩",
                "जय श्री श्याम 🙏 हारे का सहारा बाबा श्याम हमारा",
                "Jai Shree Shyam 🙏 Hare Ka Sahara Baba Shyam Hamara",
                "ॐ श्री श्याम देवाय नमः ✨\nहारे का सहारा, बाबा श्याम हमारा!",
                "कलियुग के अवतारी खाटू श्याम जी की कृपा से हर भक्त के दुख दूर होते हैं।",
                "#KhatuShyam #JaiShreeShyam #ShyamBaba #BhaktiShorts #OMKR #Shorts",
                "#KhatuShyam #JaiShreeShyam #ShyamBhajan #DevotionalShorts #OMKR #Shorts",
                ["khatu shyam", "jai shree shyam", "khatu shyam bhajan", "shyam baba status", "hare ka sahara"]);
        }

        if (text.Contains("mata", StringComparison.OrdinalIgnoreCase) ||
            text.Contains("durga", StringComparison.OrdinalIgnoreCase) ||
            text.Contains("bhavani", StringComparison.OrdinalIgnoreCase) ||
            text.Contains("ambe", StringComparison.OrdinalIgnoreCase) ||
            text.Contains("kali", StringComparison.OrdinalIgnoreCase) ||
            text.Contains("माता", StringComparison.Ordinal) ||
            text.Contains("दुर्गा", StringComparison.Ordinal) ||
            text.Contains("मैया", StringComparison.Ordinal))
        {
            return new DeityProfile(
                "माँ दुर्गा भवानी", "Maa Durga Bhavani", "🌺",
                "जय माता दी ❤️🙏",
                "Jai Mata Di ❤️🙏",
                "सर्वमंगल मांगल्ये शिवे सर्वार्थ साधिके।\nशरण्ये त्र्यम्बके गौरि नारायणि नमोऽस्तु ते॥ 🙏",
                "माँ जगदम्बा आपके जीवन में सुख, शांति और समृद्धि का आशीर्वाद प्रदान करें।",
                "#JaiMataDi #MaaDurga #MataRani #NavratriSpecial #OMKR #Shorts",
                "#JaiMataDi #MaaDurga #DeviBhajan #DevotionalShorts #OMKR #Shorts",
                ["jai mata di", "maa durga bhajan", "mata rani status", "devi bhakti song", "shakti animation"]);
        }

        if (text.Contains("hanuman", StringComparison.OrdinalIgnoreCase) ||
            text.Contains("bajrang", StringComparison.OrdinalIgnoreCase) ||
            text.Contains("balaji", StringComparison.OrdinalIgnoreCase) ||
            text.Contains("हनुमान", StringComparison.Ordinal) ||
            text.Contains("बजरंग", StringComparison.Ordinal))
        {
            return new DeityProfile(
                "संकटमोचन हनुमान जी", "Lord Hanuman Ji", "🚩",
                "जय श्री राम 🚩 जय बजरंगबली 🙏",
                "Jai Shree Ram 🚩 Jai Bajrangbali 🙏",
                "मनोजवं मारुततुल्यवेगं जितेन्द्रियं बुद्धिमतां वरिष्ठम्।\nवातात्मजं वानरयूथमुख्यं श्रीरामदूतं शरणं प्रपद्ये॥ 🙏",
                "संकटमोचन हनुमान जी आपके सभी संकटों का नाश करें और बल-बुद्धि प्रदान करें।",
                "#JaiBajrangbali #HanumanJi #JaiShreeRam #HanumanBhajan #OMKR #Shorts",
                "#HanumanJi #JaiBajrangbali #JaiShreeRam #DevotionalShorts #OMKR #Shorts",
                ["jai bajrangbali", "hanuman bhajan", "hanuman chalisa", "sankat mochan", "balaji status"]);
        }

        if (text.Contains("krishna", StringComparison.OrdinalIgnoreCase) ||
            text.Contains("radha", StringComparison.OrdinalIgnoreCase) ||
            text.Contains("kanha", StringComparison.OrdinalIgnoreCase) ||
            text.Contains("कृष्ण", StringComparison.Ordinal) ||
            text.Contains("राधा", StringComparison.Ordinal) ||
            text.Contains("कान्हा", StringComparison.Ordinal))
        {
            return new DeityProfile(
                "श्री राधा कृष्ण", "Shree Radha Krishna", "🪈",
                "राधे राधे ❤️ जय श्री कृष्णा 🙏",
                "Radhe Radhe ❤️ Jai Shree Krishna 🙏",
                "हरे कृष्ण हरे कृष्ण, कृष्ण कृष्ण हरे हरे।\nहरे राम हरे राम, राम राम हरे हरे॥ 🪈",
                "श्री राधा-कृष्ण के पावन प्रेम और भक्ति में डूब जाएं।",
                "#RadheRadhe #JaiShreeKrishna #KrishnaBhajan #BhaktiShorts #OMKR #Shorts",
                "#RadheRadhe #KrishnaBhajan #RadhaKrishna #DevotionalShorts #OMKR #Shorts",
                ["radhe radhe", "jai shree krishna", "krishna bhajan", "radha krishna status", "vrindavan bhakti"]);
        }

        // Default devotional deity: Mahadev / Lord Shiva (OMKR primary channel theme)
        return new DeityProfile(
            "देवाधिदेव महादेव", "Lord Shiva Mahadev", "🔱",
            "हर हर महादेव 🔱🙏 जय माता दी ❤️",
            "Har Har Mahadev 🔱🙏 Jai Mata Di ❤️",
            "कर्पूरगौरं करुणावतारं संसारसारं भुजगेन्द्रहारम्।\nसदावसन्तं हृदयारविन्दे भवं भवानीसहितं नमामि॥ 🔱",
            "भोलेनाथ और माता पार्वती की असीम कृपा आप और आपके परिवार पर सदैव बनी रहे।",
            "#HarHarMahadev #Bholenath #Mahakal #ShivBhajan #OMKR #Shorts",
            "#HarHarMahadev #LordShiva #MahadevStatus #ShivBhajan #OMKR #Shorts",
            ["har har mahadev", "om namah shivaya", "bholenath bhajan", "mahadev 3d animation", "shiv tandav", "mahakal status"]);
    }

    private static string ExtractBestSubject(string summary, string? brief, string? transcript, bool isHindi, bool isDevotional)
    {
        foreach (var line in summary.Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        {
            if (line.StartsWith("Current title:", StringComparison.OrdinalIgnoreCase))
            {
                var val = line["Current title:".Length..].Trim();
                if (!string.IsNullOrWhiteSpace(val) && !IsGenericTitle(val)) return val;
            }
            if (line.StartsWith("Project name:", StringComparison.OrdinalIgnoreCase))
            {
                var val = line["Project name:".Length..].Trim();
                if (!string.IsNullOrWhiteSpace(val) && !IsGenericTitle(val)) return val;
            }
        }
        if (!string.IsNullOrWhiteSpace(brief))
            return brief.Length <= 55 ? brief : brief[..55].Trim();

        var firstLine = ExtractFirstLyricLine(transcript);
        if (!string.IsNullOrWhiteSpace(firstLine)) return firstLine;

        return isHindi
            ? (isDevotional ? "महादेव की अद्भुत भक्ति महिमा" : "शानदार 3D एनिमेशन वीडियो")
            : (isDevotional ? "Divine 3D Devotional Animation" : "Amazing 3D Animated Story");
    }

    private static bool IsGenericTitle(string val) =>
        val.Equals("(none)", StringComparison.OrdinalIgnoreCase)
        || val.Equals("Untitled", StringComparison.OrdinalIgnoreCase)
        || Regex.IsMatch(val, @"^(VID|IMG|MOV|mp4|short)[-_0-9\s]*$", RegexOptions.IgnoreCase);

    private static string CleanTitleSubject(string raw)
    {
        var cleaned = Regex.Replace(raw, @"#\S+", "").Trim(' ', '|', '-', '•', '_', '.', ',');
        if (cleaned.Length > 48) cleaned = cleaned[..48].Trim();
        return string.IsNullOrWhiteSpace(cleaned) ? raw.Trim() : cleaned;
    }

    private static string ExtractCleanLyricsBlock(string summary, string? transcriptText)
    {
        var source = !string.IsNullOrWhiteSpace(transcriptText) ? transcriptText : string.Empty;
        if (string.IsNullOrWhiteSpace(source))
        {
            var idx = summary.IndexOf("Spoken transcript", StringComparison.OrdinalIgnoreCase);
            if (idx < 0) idx = summary.IndexOf("Script:", StringComparison.OrdinalIgnoreCase);
            if (idx >= 0) source = summary[idx..];
        }
        if (string.IsNullOrWhiteSpace(source)) return string.Empty;

        var lines = source
            .Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Where(l => !l.StartsWith("Spoken transcript", StringComparison.OrdinalIgnoreCase)
                        && !l.StartsWith("Script:", StringComparison.OrdinalIgnoreCase)
                        && !l.StartsWith("No captions", StringComparison.OrdinalIgnoreCase)
                        && !l.StartsWith("Transcript not available", StringComparison.OrdinalIgnoreCase))
            .Take(25)
            .ToList();

        return lines.Count > 0 ? string.Join("\n", lines) : string.Empty;
    }

    private static string ExtractFirstLyricLine(string? lyricsBlock)
    {
        if (string.IsNullOrWhiteSpace(lyricsBlock)) return string.Empty;
        foreach (var line in lyricsBlock.Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        {
            var stripped = Regex.Replace(line, @"^\[[0-9:\.]+\]\s*", "").Trim();
            if (stripped.Length >= 6)
                return stripped.Length <= 42 ? stripped : stripped[..42].Trim();
        }
        return string.Empty;
    }

    private static List<string> BuildTitles(
        string subject, string firstLyric, DeityProfile deity,
        bool isHindi, bool isDevotional, bool isOmkr, bool isShort)
    {
        var shortTag = isShort ? " #Shorts" : "";
        var omkrTag = isOmkr ? " #OMKR" : "";
        var lyricHook = !string.IsNullOrWhiteSpace(firstLyric) && !string.Equals(firstLyric, subject, StringComparison.OrdinalIgnoreCase)
            ? firstLyric
            : subject;

        List<string> raw;
        if (isHindi)
        {
            if (isDevotional)
            {
                raw =
                [
                    $"{deity.Emoji} {subject} 🙏 | {deity.NameHi} का दिल छू लेने वाला भजन ✨{shortTag}{omkrTag}",
                    $"🚩 {lyricHook} | {deity.NameHi} की अद्भुत महिमा 🙏{shortTag} #Bhakti",
                    $"✨ {subject} — यह भजन सुनकर मन शांत हो जाएगा {deity.Emoji}{shortTag}{omkrTag}",
                    $"🕉️ सच्चे भक्त ज़रूर देखें: {subject} 🙏 | {deity.GreetingHi.Split(' ')[0]}{shortTag}"
                ];
            }
            else
            {
                raw =
                [
                    $"✨ {subject} 🔥 | अद्भुत वीडियो ज़रूर देखें!{shortTag}",
                    $"🎬 {lyricHook} — अंत तक देखें 😮{shortTag}",
                    $"⚡ {subject} | न्यू वायरल वीडियो ✨{shortTag}",
                    $"🌟 {subject} | शानदार प्रस्तुति 🎯{shortTag}"
                ];
            }
        }
        else
        {
            if (isDevotional)
            {
                raw =
                [
                    $"{deity.Emoji} {subject} 🙏 | Divine 3D {deity.NameEn} Bhajan ✨{shortTag}{omkrTag}",
                    $"🚩 {lyricHook} | Soulful Devotional Animation 🙏{shortTag} #Bhakti",
                    $"✨ {subject} — Feel the Divine Grace of {deity.NameEn} {deity.Emoji}{shortTag}{omkrTag}",
                    $"🕉️ {subject} | High-Vibration Devotional Visuals 🙏{shortTag}"
                ];
            }
            else
            {
                raw =
                [
                    $"✨ {subject} 🔥 | Must-Watch Visual Story!{shortTag}",
                    $"🎬 {lyricHook} — Watch Till the End! ⚡{shortTag}",
                    $"🚀 {subject} | High-Impact Breakdown & Highlights{shortTag}",
                    $"🌟 {subject} | Official AnimStudio Feature{shortTag}"
                ];
            }
        }

        return raw.Select(t => TrimToLength(t, YouTubePublishValidator.MaxTitleLength)).Distinct(StringComparer.OrdinalIgnoreCase).ToList();
    }

    private static string BuildDescription(
        string subject, string lyricsBlock, DeityProfile deity,
        bool isHindi, bool isDevotional, bool isOmkr, bool isShort, int variant, YouTubeSeoExtras extras)
    {
        var sb = new StringBuilder();
        if (isHindi)
        {
            if (isDevotional)
            {
                if (variant == 1)
                {
                    sb.AppendLine($"{deity.Emoji} {subject} — {deity.NameHi} को समर्पित एक पावन और भावुक 3D भक्ति प्रस्तुति। 🙏✨");
                    sb.AppendLine($"कमेंट में '{deity.GreetingHi}' लिखकर अपनी हाज़िरी ज़रूर लगाएं!");
                }
                else
                {
                    sb.AppendLine($"{deity.Emoji} {deity.GreetingHi}!");
                    sb.AppendLine($"प्रस्तुत है \"{subject}\" — {deity.NameHi} की भक्ति, आस्था और दिव्य ऊर्जा से भरपूर एक विशेष प्रस्तुति। {deity.ShlokaMeaningHi}");
                    sb.AppendLine();
                    sb.AppendLine("🕉️ पावन श्लोक / मंत्र:");
                    sb.AppendLine(deity.ShlokaHi);
                }

                if (!string.IsNullOrWhiteSpace(lyricsBlock) && variant != 1)
                {
                    sb.AppendLine();
                    sb.AppendLine("📜 भजन के बोल / Spoken Lyrics & Transcript:");
                    sb.AppendLine(lyricsBlock);
                }

                // Only real chapters, from the captions' timing; made-up timestamps mislead viewers and YouTube.
                if (variant == 2 && extras.Chapters.Count >= YouTubeChapterBuilder.MinChapters)
                {
                    sb.AppendLine();
                    sb.AppendLine("⏱️ वीडियो के मुख्य भाग (Chapters):");
                    foreach (var chapter in extras.Chapters) sb.AppendLine($"{chapter.Stamp} {chapter.Title}");
                }

                sb.AppendLine();
                sb.AppendLine("🎬 Credits & Visuals Engine:");
                sb.AppendLine("• Visuals & Animation Engine: AnimStudio (Built by Creator)");
                sb.AppendLine("• Production: OMKR 3D Devotional Animations");
                sb.AppendLine("• Official Channel: https://youtube.com/@omkr-shiv");
                sb.AppendLine();
                sb.AppendLine("🔔 अगर यह भक्ति वीडियो आपके दिल को छूए, तो वीडियो को Like करें, भक्तों के साथ Share करें और चैनल को Subscribe ज़रूर करें!");
                sb.AppendLine();
                sb.AppendLine(deity.HashtagsHi);
            }
            else
            {
                sb.AppendLine($"✨ {subject} — शानदार प्रस्तुति! इस वीडियो को अंत तक ज़रूर देखें।");
                if (!string.IsNullOrWhiteSpace(lyricsBlock) && variant != 1)
                {
                    sb.AppendLine();
                    sb.AppendLine("📜 ट्रांसक्रिप्ट / मुख्य बातें:");
                    sb.AppendLine(lyricsBlock);
                }
                sb.AppendLine();
                sb.AppendLine("🎬 Powered by: AnimStudio (Built by Creator)");
                sb.AppendLine(isShort ? "#Shorts #HindiShorts #AnimStudio #Viral" : "#HindiVideo #AnimStudio #Trending");
            }
        }
        else
        {
            if (isDevotional)
            {
                sb.AppendLine($"{deity.Emoji} {deity.GreetingEn}!");
                sb.AppendLine($"Experience \"{subject}\" — a soulful 3D devotional presentation dedicated to {deity.NameEn}. Let these sacred vibrations bring peace, positivity, and divine blessings to your home.");
                if (variant != 1)
                {
                    sb.AppendLine();
                    sb.AppendLine("🕉️ Sacred Mantra / Shloka:");
                    sb.AppendLine(deity.ShlokaHi);
                }
                if (!string.IsNullOrWhiteSpace(lyricsBlock) && variant != 1)
                {
                    sb.AppendLine();
                    sb.AppendLine("📜 Spoken Transcript / Lyrics:");
                    sb.AppendLine(lyricsBlock);
                }
                sb.AppendLine();
                sb.AppendLine("🎬 Production & Engine Credits:");
                sb.AppendLine("• Visuals & Engine: AnimStudio (Built by Creator)");
                sb.AppendLine("• Studio: OMKR 3D Devotional Animations");
                sb.AppendLine("• Subscribe: https://youtube.com/@omkr-shiv");
                sb.AppendLine();
                sb.AppendLine(deity.HashtagsEn);
            }
            else
            {
                sb.AppendLine($"✨ {subject} — Watch this high-impact visual presentation crafted in AnimStudio.");
                if (!string.IsNullOrWhiteSpace(lyricsBlock) && variant != 1)
                {
                    sb.AppendLine();
                    sb.AppendLine("📜 Spoken Transcript / Key Moments:");
                    sb.AppendLine(lyricsBlock);
                }
                sb.AppendLine();
                sb.AppendLine("🎬 Created with AnimStudio (Built by Creator)");
                sb.AppendLine(isShort ? "#Shorts #AnimStudio #ViralShorts #3DAnimation" : "#AnimStudio #VideoProduction #3DAnimation");
            }
        }
        return sb.ToString().Trim();
    }

    private static (List<string> Tags, List<string> TagIdeas) BuildTags(
        string subject, DeityProfile deity, bool isHindi, bool isDevotional, bool isOmkr, bool isShort)
    {
        var tags = new List<string>();
        var ideas = new List<string>();
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        void AddMain(string t)
        {
            var clean = t.Trim().TrimStart('#');
            if (!string.IsNullOrWhiteSpace(clean) && clean.Length <= 40 && seen.Add(clean)) tags.Add(clean);
        }
        void AddIdea(string t)
        {
            var clean = t.Trim().TrimStart('#');
            if (!string.IsNullOrWhiteSpace(clean) && clean.Length <= 40 && seen.Add(clean)) ideas.Add(clean);
        }

        if (subject.Length <= 38) AddMain(subject);
        if (isOmkr || isDevotional)
        {
            AddMain("omkr");
            AddMain("AnimStudio");
            AddMain("omkr shiv");
            AddMain("3d devotional animation");
            foreach (var dt in deity.ExtraTags) AddMain(dt);
            AddMain("hindi bhajan");
            AddMain("bhakti shorts");
            if (isShort) AddMain("youtube shorts");

            AddIdea("omkr 3d devotional animations");
            AddIdea("devotional status");
            AddIdea("morning bhajan");
            AddIdea("sanatan dharma");
            AddIdea("spiritual shorts");
            AddIdea("bhakti song hindi");
            AddIdea("divine animation");
            AddIdea("lord shiva status");
            AddIdea("jai mata di status");
        }
        else
        {
            AddMain("AnimStudio");
            if (isShort) AddMain("shorts");
            AddMain(isHindi ? "hindi shorts" : "viral shorts");
            AddMain("3d animation");
            AddIdea("trending video");
            AddIdea("animated story");
        }

        return (tags, ideas);
    }

    private static (string PinnedComment, string EngagementComment) BuildComments(
        string subject, DeityProfile deity, bool isHindi, bool isDevotional, bool isOmkr)
    {
        if (isHindi)
        {
            if (isDevotional || isOmkr)
            {
                var pinned = $"{deity.Emoji} सच्चे मन से कमेंट में \"{deity.GreetingHi}\" ज़रूर लिखें! {deity.NameHi} आपकी सभी मनोकामनाएं पूर्ण करें। 🙏✨ ऐसे और दिव्य 3D भक्ति एनिमेशन के लिए हमारे चैनल https://youtube.com/@omkr-shiv को Subscribe ज़रूर करें! 🔔";
                var engage = $"🙏 इस भजन की कौन सी लाइन आपके दिल को सबसे ज़्यादा छू गई? कमेंट में ज़रूर बताएं 👇✨";
                return (pinned, engage);
            }
            return (
                $"✨ यह वीडियो आपको कैसा लगा? कमेंट में अपनी राय ज़रूर लिखें और चैनल को Subscribe करें! 🔔",
                $"💬 इस वीडियो का कौन सा भाग आपको सबसे ज़्यादा पसंद आया? नीचे कमेंट करें 👇"
            );
        }

        if (isDevotional || isOmkr)
        {
            var pinned = $"{deity.Emoji} Type \"{deity.GreetingEn}\" in the comments to receive divine blessings! 🙏✨ Subscribe to https://youtube.com/@omkr-shiv for more 3D devotional animations crafted in AnimStudio! 🔔";
            var engage = $"🙏 Which line or moment from this devotional video touched your heart the most? Share in the comments below 👇✨";
            return (pinned, engage);
        }
        return (
            $"✨ Thanks for watching! Drop your thoughts in the comments below and subscribe for more! 🔔",
            $"💬 Which moment in \"{subject}\" stood out to you the most? Let us know below 👇"
        );
    }

    private static string TrimToLength(string value, int maxLength)
    {
        if (value.Length <= maxLength) return value;
        return value[..maxLength].TrimEnd();
    }
}

/// <summary>
/// The free engine's details for anything that isn't devotional: led by the video's own topic
/// (its title, tags and the words spoken in it), with real chapters and music credits when
/// they were found, and no channel branding the video didn't ask for.
/// </summary>
internal static partial class GenericSeo
{
    private static readonly HashSet<string> StopWords = new(StringComparer.OrdinalIgnoreCase)
    {
        "the", "and", "for", "with", "this", "that", "from", "your", "you", "are", "was", "were", "have", "has", "had",
        "will", "what", "when", "where", "which", "who", "how", "why", "about", "into", "they", "them", "their", "there",
        "then", "than", "just", "like", "also", "but", "not", "all", "can", "our", "out", "its", "it's", "get", "got",
        "one", "two", "very", "more", "most", "some", "any", "here", "now", "only", "over", "such", "these", "those",
        "been", "being", "would", "could", "should", "let", "lets", "let's", "i'm", "don't", "video", "videos",
        "watch", "subscribe", "channel", "share", "comment", "official", "full", "new", "shorts", "short",
        "music", "song", "none", "current", "title", "description", "tags", "http", "https", "www", "com",
        "है", "हैं", "के", "की", "का", "में", "और", "को", "से", "यह", "पर", "भी", "तो", "ही", "कि", "ना", "जो", "था",
        "थी", "एक", "वो", "वह", "हम", "तुम", "आप", "मैं", "मेरे", "मेरी", "क्या", "नहीं", "कर", "रहा", "रही", "गया",
    };

    public static YouTubeMetadataSuggestion Generate(
        string summary, string subject, string firstLyric, string lyricsBlock, string? transcript,
        bool isHindi, bool isShort, YouTubeSeoExtras extras)
    {
        var currentTags = ReadLine(summary, "Current tags:")?
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Where(t => t.Length is > 1 and <= 40)
            .ToList() ?? [];
        var currentDescription = ReadLine(summary, "Current description:");
        var madeInAnimStudio = summary.Contains("Project name:", StringComparison.Ordinal);

        var keywords = Keywords(subject, currentTags, transcript ?? lyricsBlock);
        var hashtags = Hashtags(keywords, isShort);

        var titles = Titles(subject, firstLyric, keywords, isHindi, isShort);
        var lead = Lead(subject, currentDescription, isHindi);

        string Describe(int variant)
        {
            var sb = new StringBuilder();
            sb.AppendLine(lead);
            var lines = KeyLines(lyricsBlock, variant == 1 ? 0 : variant == 2 ? 12 : 6);
            if (lines.Length > 0)
            {
                sb.AppendLine();
                sb.AppendLine(isHindi ? "📝 इस वीडियो में:" : "📝 In this video:");
                sb.AppendLine(lines);
            }
            var withExtras = YouTubeVideoInsights.AddChaptersAndCredits(sb.ToString().Trim(),
                variant == 1 ? extras with { Chapters = [] } : extras);
            sb.Clear().Append(withExtras).AppendLine().AppendLine();
            sb.AppendLine(isHindi
                ? "👍 वीडियो अच्छा लगे तो Like, Share और Subscribe ज़रूर करें।"
                : "👍 If you enjoyed this, like, share and subscribe for more.");
            if (madeInAnimStudio) sb.AppendLine(isHindi ? "🎬 AnimStudio में बनाया गया" : "🎬 Made with AnimStudio");
            if (hashtags.Count > 0)
            {
                sb.AppendLine();
                sb.Append(string.Join(' ', hashtags));
            }
            return sb.ToString().Trim();
        }

        var tags = new List<string>();
        var ideas = new List<string>();
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        void Add(List<string> list, string? raw)
        {
            var tag = raw?.Trim().TrimStart('#').Trim();
            if (string.IsNullOrEmpty(tag) || tag.Length > 40 || tag.IndexOfAny(['<', '>', ',', '"']) >= 0 || !seen.Add(tag)) return;
            list.Add(tag);
        }
        if (subject.Length <= 40) Add(tags, subject.ToLowerInvariant());
        foreach (var t in currentTags.Take(12)) Add(tags, t);
        foreach (var s in extras.Songs.Take(4))
        {
            if (s.Title != YouTubeMusicDetector.UntitledCredits) Add(tags, s.Title.ToLowerInvariant());
            if (!string.IsNullOrWhiteSpace(s.Artist)) Add(tags, s.Artist.ToLowerInvariant());
        }
        foreach (var k in keywords.Take(8)) Add(tags, k);
        if (isShort) Add(tags, "shorts");
        foreach (var k in keywords.Skip(8).Take(8)) Add(ideas, k);
        for (var i = 0; i + 1 < Math.Min(keywords.Count, 6); i += 2) Add(ideas, $"{keywords[i]} {keywords[i + 1]}");
        if (madeInAnimStudio) Add(ideas, "AnimStudio");

        var pinned = isHindi
            ? $"🙏 देखने के लिए धन्यवाद! \"{subject}\" में आपको सबसे अच्छा क्या लगा? कमेंट में बताएं और ऐसे और वीडियो के लिए Subscribe करें 🔔"
            : $"🙏 Thanks for watching! What did you like most about \"{subject}\"? Tell us below and subscribe for more 🔔";
        var engage = isHindi
            ? "💬 आप अगला वीडियो किस बारे में देखना चाहेंगे? नीचे कमेंट करें 👇"
            : "💬 What should the next video be about? Drop your ideas below 👇";

        return new YouTubeMetadataSuggestion(titles[0], Describe(0), tags)
        {
            TitleOptions = [.. titles.Skip(1).Take(4)],
            DescriptionOptions = [Describe(1), Describe(2)],
            TagIdeas = ideas,
            PinnedComment = pinned,
            EngagementComment = engage,
            TranscriptText = transcript,
        };
    }

    /// <summary>Topic words, most telling first: the title's own words, then the existing tags', then what is said most.</summary>
    private static List<string> Keywords(string subject, IReadOnlyList<string> currentTags, string? spoken)
    {
        var score = new Dictionary<string, double>(StringComparer.OrdinalIgnoreCase);
        var order = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        void Count(string? text, double weight)
        {
            if (string.IsNullOrWhiteSpace(text)) return;
            foreach (Match m in Word().Matches(StampPrefix().Replace(text, " ")))
            {
                var w = m.Value.Trim('\'').ToLowerInvariant();
                if (w.Length < 3 || StopWords.Contains(w)) continue;
                score[w] = score.GetValueOrDefault(w) + weight;
                order.TryAdd(w, order.Count);
            }
        }
        Count(subject, 4);
        Count(string.Join(' ', currentTags), 2);
        Count(spoken is { Length: > 6000 } ? spoken[..6000] : spoken, 1);
        return [.. score
            .Where(kv => kv.Value >= 2)
            .OrderByDescending(kv => kv.Value)
            .ThenBy(kv => order[kv.Key])
            .Select(kv => kv.Key)
            .Take(20)];
    }

    private static List<string> Hashtags(IReadOnlyList<string> keywords, bool isShort)
    {
        var tags = keywords.Take(3)
            .Select(k => new string(k.Where(c => char.IsLetterOrDigit(c)
                || CharUnicodeInfo.GetUnicodeCategory(c) is UnicodeCategory.NonSpacingMark or UnicodeCategory.SpacingCombiningMark).ToArray()))
            .Where(k => k.Length > 1)
            .Select(k => "#" + (char.IsLower(k[0]) ? char.ToUpperInvariant(k[0]) + k[1..] : k))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
        if (isShort) tags.Insert(0, "#Shorts");
        return tags;
    }

    private static List<string> Titles(string subject, string firstLyric, IReadOnlyList<string> keywords, bool isHindi, bool isShort)
    {
        var suffix = isShort ? " #Shorts" : string.Empty;
        var hook = !string.IsNullOrWhiteSpace(firstLyric) && !firstLyric.Equals(subject, StringComparison.OrdinalIgnoreCase) ? firstLyric : null;
        var topic = keywords.FirstOrDefault(k => !subject.Contains(k, StringComparison.OrdinalIgnoreCase));
        var raw = new List<string> { subject + suffix };
        if (hook is not null) raw.Add($"{subject} | {hook}{suffix}");
        if (topic is not null) raw.Add($"{subject} - {Capitalize(topic)}{suffix}");
        raw.Add(isHindi ? $"{subject} | पूरा वीडियो ज़रूर देखें{suffix}" : $"{subject} | Watch Till the End{suffix}");
        if (hook is not null) raw.Add($"\"{hook}\" - {subject}");
        return [.. raw.Select(t => t.Length <= YouTubePublishValidator.MaxTitleLength ? t : t[..YouTubePublishValidator.MaxTitleLength].TrimEnd())
            .Distinct(StringComparer.OrdinalIgnoreCase)];
    }

    /// <summary>The opening line: the video's own first line when it has a real one, else a plain one about the subject.</summary>
    private static string Lead(string subject, string? currentDescription, bool isHindi)
    {
        var own = currentDescription?.Split(['\n', '|'], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .FirstOrDefault(l => l.Length >= 25 && !l.Contains("http", StringComparison.OrdinalIgnoreCase) && !l.StartsWith('#'));
        if (own is not null) return (own.Length > 200 ? own[..200].TrimEnd() + "…" : own).Replace("<", "").Replace(">", "");
        return isHindi ? $"✨ {subject} - पूरा वीडियो देखें।" : $"✨ {subject} - watch the full video.";
    }

    /// <summary>A few spoken lines without timestamps, as a peek at what the video says.</summary>
    private static string KeyLines(string lyricsBlock, int max)
    {
        if (max <= 0 || string.IsNullOrWhiteSpace(lyricsBlock)) return string.Empty;
        var lines = lyricsBlock.Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(l => StampPrefix().Replace(l, string.Empty).Trim())
            .Where(l => l.Length >= 6 && !l.StartsWith('['))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(max)
            .Select(l => "• " + l.Replace("<", "").Replace(">", ""));
        return string.Join('\n', lines);
    }

    private static string? ReadLine(string summary, string prefix)
    {
        foreach (var line in summary.Split('\n'))
        {
            var t = line.Trim();
            if (!t.StartsWith(prefix, StringComparison.OrdinalIgnoreCase)) continue;
            var v = t[prefix.Length..].Trim();
            return v.Length == 0 || v.Equals("(none)", StringComparison.OrdinalIgnoreCase) ? null : v;
        }
        return null;
    }

    private static string Capitalize(string word) =>
        word.Length == 0 ? word : char.ToUpperInvariant(word[0]) + word[1..];

    [GeneratedRegex(@"[\p{L}\p{M}][\p{L}\p{M}\p{N}']*", RegexOptions.CultureInvariant)]
    private static partial Regex Word();

    [GeneratedRegex(@"^\s*\[[0-9:\.]+\]\s*", RegexOptions.Multiline | RegexOptions.CultureInvariant)]
    private static partial Regex StampPrefix();
}
