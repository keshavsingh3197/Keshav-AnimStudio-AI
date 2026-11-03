using System.Text;
using AnimStudio.Domain.Publishing;
using AnimStudio.Domain.Stories;
using AnimStudio.Application.Publishing;

namespace AnimStudio.Application.StoryAgent;

/// <summary>What the build did, which the kit has to describe truthfully.</summary>
/// <param name="SceneStarts">Start of each scene on the finished video, in seconds.</param>
/// <param name="AiPictures">Some pictures were made by an AI image tool: the app's, or the user's when they say theirs were.</param>
public sealed record StoryKitFacts(
    IReadOnlyList<double> SceneStarts,
    double TotalSeconds,
    bool AiPictures,
    StoryNarrationMode Narration,
    StoryMusicPick? Music,
    ChannelBranding? Branding);

/// <summary>
/// Writes the YouTube title, description, tags, chapters and comments for a finished video, from what the video
/// really contains. Deterministic and offline on purpose: the sources, the credits and the AI disclosure in it
/// are statements of fact, so they come from the run's records and not from a model's imagination.
/// </summary>
public static class StoryKitBuilder
{
    private const int DescriptionBudget = 4_900;
    private const int TagBudget = 450;
    private const int MaxTagChars = 40;

    public static StoryPublishKit Build(StoryScript script, StoryBrief brief, StoryResearch? research, StoryKitFacts facts)
    {
        var hindi = !string.Equals(brief.Language, "en", StringComparison.OrdinalIgnoreCase);
        var topics = research?.Topics.Count > 0
            ? [.. research.Topics.Select(t => GranthTopics.Get(t.TopicId)).OfType<GranthTopic>()]
            : GranthTopics.Match($"{brief.Title} {brief.Notes} {script.Title} {script.TitleEnglish}");

        var chapters = Chapters(script, facts);
        var sources = Sources(script);

        var hashtags = Hashtags(topics, facts.Branding, hindi);
        var description = Description(script, hindi, facts, sources, chapters, hashtags, script.Scenes.Any(s => s.Basis == StoryBasis.Tradition));

        var tags = Tags(script, topics, sources, facts.Branding, hindi);
        var jaikara = Jaikara(topics, hindi);

        var kit = new StoryPublishKit
        {
            TitleOptions = Titles(script, hindi),
            Description = description,
            Tags = tags,
            Hashtags = hashtags,
            Chapters = [.. chapters.Select(c => new StoryChapter { StartSeconds = c.StartSeconds, Stamp = c.Stamp, Title = c.Title })],
            PinnedComment = PinnedComment(script, jaikara, hindi),
            EngagementComment = EngagementComment(chapters, hindi),
            Checklist = Checklist(script, facts, sources, hindi)
        };
        kit.DescriptionBytes = Encoding.UTF8.GetByteCount(kit.Description);
        kit.TagsLength = YouTubePublishValidator.TagsLength(kit.Tags);
        return kit;
    }

    // ---------------------------------------------------------------- titles

    private static List<string> Titles(StoryScript script, bool hindi)
    {
        var native = script.Title.Trim();
        var english = script.TitleEnglish?.Trim();
        var options = new List<string>();

        void Add(string? title)
        {
            if (string.IsNullOrWhiteSpace(title)) return;
            var fitted = FitTitle(title);
            if (!options.Contains(fitted, StringComparer.OrdinalIgnoreCase)) options.Add(fitted);
        }

        if (hindi)
        {
            Add(english is null ? native : $"{native} | {english}");
            if (english is not null) Add($"{english} | {native}");
            Add(native);
            Add($"{native} | ग्रंथों से कथा, स्रोत सहित");
        }
        else
        {
            Add(native);
            Add($"{native}: Story, Sources and Meaning");
            if (english is not null && !string.Equals(english, native, StringComparison.OrdinalIgnoreCase)) Add(english);
            Add($"{native} | Told from the Granths");
        }

        return options;
    }

    internal static string FitTitle(string title)
    {
        var clean = string.Join(' ', title.Split([' ', '\n', '\r', '\t'], StringSplitOptions.RemoveEmptyEntries)).Replace("<", "").Replace(">", "");
        var max = YouTubePublishValidator.MaxTitleLength;
        if (clean.Length <= max) return clean;

        var cut = clean[..max];
        var space = cut.LastIndexOf(' ');
        return (space > max / 2 ? cut[..space] : cut).TrimEnd(' ', '|', '-', ':', ',');
    }

    // ---------------------------------------------------------------- sources, chapters

    private sealed record SourceLine(string Name, string Ref, string? Note, bool Verified);

    private static List<SourceLine> Sources(StoryScript script)
    {
        var lines = new List<SourceLine>();
        var seen = new HashSet<string>(StringComparer.Ordinal);
        foreach (var source in script.Scenes.SelectMany(s => s.Sources))
        {
            // A citation that does not exist must never be printed under a video.
            if (source.Check is CitationStatus.Invalid or CitationStatus.UnknownText) continue;
            if (source.TextName.Length == 0) continue;
            if (!seen.Add($"{source.TextId}|{source.Ref}")) continue;
            lines.Add(new SourceLine(source.TextName, source.Ref, source.Note, source.Check == CitationStatus.Verified));
        }
        return lines;
    }

    private static List<YouTubeChapter> Chapters(StoryScript script, StoryKitFacts facts)
    {
        var starts = facts.SceneStarts;
        var count = Math.Min(starts.Count, script.Scenes.Count);
        if (count < YouTubeChapterBuilder.MinChapters || facts.TotalSeconds < YouTubeChapterBuilder.MinVideoSeconds) return [];

        // Scenes are short; a chapter gathers as many as it takes to last long enough to be worth a heading.
        var minimum = Math.Max(YouTubeChapterBuilder.MinChapterSeconds + 2, facts.TotalSeconds / (YouTubeChapterBuilder.MaxChapters - 1));
        var groups = new List<(double Start, string Title)>();
        var i = 0;
        while (i < count)
        {
            var start = starts[i];
            var j = i;
            double Length(int index) => (index + 1 < count ? starts[index + 1] : facts.TotalSeconds) - start;
            while (Length(j) < minimum && j + 1 < count) j++;
            groups.Add((start, ChapterTitle(script.Scenes[i])));
            i = j + 1;
        }

        // A closing scrap shorter than a chapter may be is folded into the chapter before it.
        if (groups.Count > 1 && facts.TotalSeconds - groups[^1].Start < YouTubeChapterBuilder.MinChapterSeconds)
            groups.RemoveAt(groups.Count - 1);

        if (groups.Count < YouTubeChapterBuilder.MinChapters) return [];
        return [.. groups.Take(YouTubeChapterBuilder.MaxChapters)
            .Select((g, index) => new YouTubeChapter(index == 0 ? 0 : Math.Floor(g.Start), g.Title))];
    }

    private static string ChapterTitle(StoryScene scene)
    {
        var title = scene.Headline.Trim();
        if (title.Length > YouTubeChapterBuilder.MaxTitleChars) title = title[..YouTubeChapterBuilder.MaxTitleChars].TrimEnd();
        return title.Replace("<", "").Replace(">", "");
    }

    // ---------------------------------------------------------------- description

    private static string Description(
        StoryScript script, bool hindi, StoryKitFacts facts, List<SourceLine> sources,
        List<YouTubeChapter> chapters, List<string> hashtags, bool hasTradition)
    {
        var variants = new (bool Notes, bool Cta, bool Subscribe, bool Chapters)[]
        {
            (true, true, true, true), (false, true, true, true), (false, false, true, true),
            (false, false, false, true), (false, false, false, false)
        };

        string result = string.Empty;
        foreach (var (notes, cta, subscribe, withChapters) in variants)
        {
            result = Compose(script, hindi, facts, sources, chapters, hashtags, hasTradition, notes, cta, subscribe, withChapters);
            if (Encoding.UTF8.GetByteCount(result) <= DescriptionBudget) return result;
        }

        // Still too long: keep the first sources that fit.
        for (var keep = sources.Count - 1; keep >= 1; keep--)
        {
            result = Compose(script, hindi, facts, [.. sources.Take(keep)], [], hashtags, hasTradition, false, false, false, false);
            if (Encoding.UTF8.GetByteCount(result) <= DescriptionBudget) break;
        }
        return result;
    }

    private static string Compose(
        StoryScript script, bool hindi, StoryKitFacts facts, List<SourceLine> sources, List<YouTubeChapter> chapters,
        List<string> hashtags, bool hasTradition, bool notes, bool cta, bool subscribe, bool withChapters)
    {
        var blocks = new List<string>();
        var brand = facts.Branding;

        var hook = new StringBuilder();
        hook.Append("🙏 ").Append(script.Title);
        if (!string.IsNullOrWhiteSpace(script.Summary)) hook.Append(" - ").Append(script.Summary);
        blocks.Add(hook.ToString());

        if (hindi && !string.IsNullOrWhiteSpace(script.TitleEnglish))
            blocks.Add($"{script.TitleEnglish}: told in simple Hindi, with the Granths it comes from.");

        if (sources.Count > 0)
        {
            var list = new StringBuilder(hindi ? "📖 ग्रंथ-स्रोत (Sources)" : "📖 Sources");
            foreach (var source in sources)
            {
                list.Append("\n• ").Append(source.Name);
                if (source.Ref.Length > 0) list.Append(' ').Append(source.Ref);
                if (notes && !string.IsNullOrWhiteSpace(source.Note)) list.Append(": ").Append(source.Note);
            }
            if (hasTradition)
            {
                list.Append('\n').Append(hindi
                    ? "जो बात लोक-मान्यता की है, उसे वीडियो में “मान्यता है” कहकर बताया गया है।"
                    : "Where a story is handed down by tradition rather than stated in the text, the video says so.");
            }
            blocks.Add(list.ToString());
        }

        if (cta)
        {
            blocks.Add(hindi
                ? "🙏 वीडियो अच्छा लगे तो Like, Share और Subscribe करें, और कमेंट में अपना जयकारा लिखें।"
                : "🙏 If you liked this, please Like, Share and Subscribe, and write your jaikara in the comments.");
        }

        if (withChapters && chapters.Count >= YouTubeChapterBuilder.MinChapters)
            blocks.Add(YouTubeChapterBuilder.ToDescriptionBlock(chapters).Replace("Chapters:", hindi ? "Chapters (अध्याय):" : "Chapters:"));

        var credits = new List<string>();
        if (facts.AiPictures)
            credits.Add(hindi ? "चित्र: AI से बने भक्ति-चित्र - कलात्मक कल्पना" : "Pictures: made with AI - artistic imagination");
        credits.AddRange(facts.Narration switch
        {
            StoryNarrationMode.MyVoice => [hindi ? "स्वर: निर्माता की अपनी आवाज़ पर आधारित AI वॉइस" : "Voice: an AI voice made from the creator's own voice"],
            StoryNarrationMode.Stock => [hindi ? "स्वर: AI वॉइस" : "Voice: an AI voice"],
            _ => Array.Empty<string>()
        });
        if (!string.IsNullOrWhiteSpace(brand?.EngineName))
        {
            credits.Add(string.IsNullOrWhiteSpace(brand.StudioUrl)
                ? $"Animation Engine: {brand.EngineName}"
                : $"Animation Engine: {brand.EngineName} - {brand.StudioUrl}");
        }
        var creator = new List<string>();
        if (!string.IsNullOrWhiteSpace(brand?.CreatorUrl)) creator.Add($"Creator: {brand.CreatorUrl}");
        if (!string.IsNullOrWhiteSpace(brand?.ChannelName)) creator.Add($"Presented by: {brand.ChannelName}");
        if (creator.Count > 0) credits.Add(string.Join(" | ", creator));
        if (credits.Count > 0)
            blocks.Add((hindi ? "🎬 क्रेडिट्स (Credits)" : "🎬 Credits") + "\n" + string.Join('\n', credits));

        if (facts.Music is { } music)
        {
            // No brackets around the links: YouTube's link detection would swallow a closing one.
            var line = new StringBuilder($"• \"{music.Title}\" - {music.Artist}");
            if (!string.IsNullOrWhiteSpace(music.PageUrl)) line.Append(" · ").Append(music.PageUrl);
            line.Append(" · ").Append(music.LicenseCode);
            if (!string.IsNullOrWhiteSpace(music.LicenseUrl)) line.Append(": ").Append(music.LicenseUrl);
            blocks.Add("🎵 Music used:\n" + line);
        }

        if (subscribe && !string.IsNullOrWhiteSpace(brand?.ChannelUrl))
        {
            blocks.Add(string.IsNullOrWhiteSpace(brand.ChannelName)
                ? $"🔔 Subscribe: {brand.ChannelUrl}"
                : $"🔔 Subscribe to {brand.ChannelName}: {brand.ChannelUrl}");
        }

        if (hashtags.Count > 0) blocks.Add(string.Join(' ', hashtags));

        return string.Join("\n\n", blocks).Replace("<", "").Replace(">", "");
    }

    // ---------------------------------------------------------------- hashtags and tags

    private static List<string> Hashtags(IReadOnlyList<GranthTopic> topics, ChannelBranding? brand, bool hindi)
    {
        var tags = new List<string>();

        void Add(string? token)
        {
            var clean = new string((token ?? string.Empty).Where(c => char.IsLetterOrDigit(c) || char.GetUnicodeCategory(c) is
                System.Globalization.UnicodeCategory.NonSpacingMark or System.Globalization.UnicodeCategory.SpacingCombiningMark).ToArray());
            if (clean.Length is < 2 or > 40) return;
            var tag = "#" + clean;
            if (!tags.Contains(tag, StringComparer.OrdinalIgnoreCase)) tags.Add(tag);
        }

        if (topics.Count > 0)
        {
            var topic = topics[0];
            if (hindi) Add(topic.Keywords.FirstOrDefault(k => k.Any(c => c is >= '\u0900' and <= '\u097F')));
            Add(Pascal(topic.Keywords.FirstOrDefault(k => k.All(c => char.IsAsciiLetter(c) || c == ' '))));
            if (topics.Count > 1) Add(Pascal(topics[1].Keywords.FirstOrDefault(k => k.All(c => char.IsAsciiLetter(c) || c == ' '))));
        }
        Add("HinduMythology");

        foreach (var tag in (brand?.Hashtags ?? []).Take(2)) Add(tag.TrimStart('#'));
        return [.. tags.Take(5)];
    }

    private static string Pascal(string? words) =>
        string.Concat((words ?? string.Empty).Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .Select(w => char.ToUpperInvariant(w[0]) + w[1..]));

    private static List<string> Tags(
        StoryScript script, IReadOnlyList<GranthTopic> topics, List<SourceLine> sources, ChannelBranding? brand, bool hindi)
    {
        var tags = new List<string>();

        void Add(string? raw)
        {
            var tag = (raw ?? string.Empty).Replace(",", " ").Replace("<", "").Replace(">", "").Replace("#", "").Trim();
            tag = string.Join(' ', tag.Split(' ', StringSplitOptions.RemoveEmptyEntries));
            if (tag.Length is 0 or > MaxTagChars) return;
            if (tags.Contains(tag, StringComparer.OrdinalIgnoreCase)) return;
            if (YouTubePublishValidator.TagsLength([.. tags, tag]) > TagBudget) return;
            tags.Add(tag);
        }

        if (script.TitleEnglish is { Length: > 0 } english)
        {
            Add(english.ToLowerInvariant());
            if (hindi) Add($"{english.ToLowerInvariant()} in hindi");
        }
        Add(script.Title);

        foreach (var topic in topics)
        {
            Add(topic.Name.ToLowerInvariant());
            Add(topic.Hindi);
            foreach (var keyword in topic.Keywords.Where(k => k.All(c => char.IsAsciiLetterOrDigit(c) || c == ' ')).Take(3)) Add(keyword);
            foreach (var keyword in topic.Keywords.Where(k => k.Any(c => c is >= '\u0900' and <= '\u097F')).Take(2)) Add(keyword);
        }

        foreach (var name in sources.Select(s => s.Name.ToLowerInvariant()).Distinct().Take(4)) Add(name);
        Add("hindu mythology stories");
        Add("hindu scriptures");
        Add("puranic stories");
        if (hindi) Add("पौराणिक कथाएँ");

        foreach (var tag in brand?.Tags ?? []) Add(tag);
        foreach (var tag in brand?.Hashtags ?? []) Add(tag);
        return tags;
    }

    // ---------------------------------------------------------------- comments and checklist

    private static string Jaikara(IReadOnlyList<GranthTopic> topics, bool hindi)
    {
        var id = topics.FirstOrDefault()?.Id;
        var (hi, en) = id switch
        {
            "diwali" or "lakshmi" or "dhanteras" or "narak-chaturdashi" or "bhai-dooj" =>
                ("जय श्री राम 🚩 | जय माता लक्ष्मी 🪔 | जय श्री कृष्ण 🙏", "Jai Shri Ram 🚩 | Jai Mata Lakshmi 🪔 | Jai Shri Krishna 🙏"),
            "rama-navami" or "dussehra" or "ramayana" => ("जय श्री राम 🚩 | जय सियाराम 🙏", "Jai Shri Ram 🚩 | Jai Siyaram 🙏"),
            "navratri" => ("जय माता दी 🙏 | जय माँ दुर्गा 🚩", "Jai Mata Di 🙏 | Jai Maa Durga 🚩"),
            "janmashtami" or "krishna-leela" or "govardhan" => ("राधे राधे ❤️ | जय श्री कृष्ण 🙏", "Radhe Radhe ❤️ | Jai Shri Krishna 🙏"),
            "hanuman" => ("जय श्री राम 🚩 | जय बजरंगबली 🙏", "Jai Shri Ram 🚩 | Jai Bajrangbali 🙏"),
            "shivratri" => ("हर हर महादेव 🔱", "Har Har Mahadev 🔱"),
            "ganesh" => ("गणपति बप्पा मोरया 🙏", "Ganpati Bappa Morya 🙏"),
            _ => ("जय श्री हरि 🙏", "Jai Shri Hari 🙏")
        };
        return hindi ? hi : en;
    }

    private static string PinnedComment(StoryScript script, string jaikara, bool hindi) =>
        hindi
            ? $"🙏 {script.Title}\nआपको यह कथा कैसी लगी? कमेंट में अपना जयकारा लिखिए 👇\n{jaikara}"
            : $"🙏 {script.Title}\nHow did you like this story? Write your jaikara in the comments 👇\n{jaikara}";

    private static string EngagementComment(List<YouTubeChapter> chapters, bool hindi)
    {
        var numbers = new[] { "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣" };
        var picks = chapters.Count >= 4 ? chapters.Skip(1).Take(5).ToList() : [];
        var options = string.Join("  ", picks.Select((c, i) => $"{numbers[i]} {c.Title}"));
        if (hindi)
        {
            return picks.Count == 0
                ? "इस वीडियो का कौन-सा प्रसंग आपको सबसे प्रिय लगा? कमेंट में बताइए 👇"
                : $"इस वीडियो का कौन-सा प्रसंग आपको सबसे प्रिय लगा? नंबर लिखकर बताइए 👇\n{options}";
        }
        return picks.Count == 0
            ? "Which part of this video did you like the most? Tell us below 👇"
            : $"Which part of this video did you like the most? Reply with its number 👇\n{options}";
    }

    private static List<string> Checklist(StoryScript script, StoryKitFacts facts, List<SourceLine> sources, bool hindi)
    {
        var items = new List<string>
        {
            "Read the script once more for facts and pronunciation. Check the chapter numbers in your own edition; the ones marked as checked only exist, they are not proof the verse says that.",
            "Add this year's date from a panchang if the video is for one particular day; dates differ by region.",
            $"In YouTube Studio: audience \"No, it's not made for kids\"; category Education; language {(hindi ? "Hindi" : "English")}; comments on, with potentially inappropriate comments held for review."
        };

        if (facts.AiPictures || facts.Narration != StoryNarrationMode.None)
            items.Insert(1, "Set \"AI use\" to Yes when uploading: the pictures or the voice were made with AI. Disclosing does not limit reach or earnings.");
        if (facts.Music is not null)
            items.Add("Keep the music credit in the description; the track's licence requires it.");
        if (script.Scenes.Any(s => s.Sources.Any(x => x.Check is CitationStatus.Invalid or CitationStatus.UnknownText)))
            items.Add("Some citations in the script do not exist; they were left out of the description. Fix or remove them in the script.");
        if (sources.Count == 0)
            items.Add("The script cites no source the catalogue could place. Add the Granths it comes from before publishing.");

        items.Add("After it is live: post the pinned comment, pin it, and add the video to a playlist.");
        return items;
    }
}
