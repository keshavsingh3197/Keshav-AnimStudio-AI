using System.Text.RegularExpressions;
using AnimStudio.Application.Ai;
using AnimStudio.Domain.Stories;

namespace AnimStudio.Application.StoryAgent;

/// <summary>One thing wrong with a genre, and which field it is in.</summary>
public sealed record StoryGenreProblem(string Code, string Message, string Field);

/// <summary>
/// What a genre may hold. Everything in one ends up in a prompt, a video description or a YouTube tag, so each value is
/// cleaned and held to a length, links must be web addresses, and a scripture topic may only point at texts the catalogue
/// knows (that is what lets the script's citations be checked).
/// </summary>
public static partial class StoryGenreRules
{
    public const int MaxNameChars = 60;
    public const int MaxDescriptionChars = 400;
    public const int MaxStyleGuideChars = 4_000;
    public const int MaxMoods = 8;
    public const int MaxTags = 30;
    public const int MaxTagChars = 40;
    public const int MaxHashtags = 10;
    public const int MaxLinks = 8;
    public const int MaxTopics = 80;
    public const int MaxKeywords = 40;
    public const int MaxSourcesPerTopic = 12;

    private static readonly string[] Categories =
    [
        "Education", "Entertainment", "Comedy", "Film & Animation", "People & Blogs", "Howto & Style",
        "Science & Technology", "Music", "Nonprofits & Activism", "Travel & Events", "Gaming", "Sports", "News & Politics"
    ];

    [GeneratedRegex(@"^[a-z0-9][a-z0-9-]{1,39}$", RegexOptions.CultureInvariant)]
    public static partial Regex IdPattern();

    [GeneratedRegex(@"^[a-z][a-z-]{1,19}$", RegexOptions.CultureInvariant)]
    private static partial Regex MoodPattern();

    public static IReadOnlyList<string> YouTubeCategories => Categories;

    /// <summary>A clean copy of <paramref name="input"/>, or the problems that stop it being saved.</summary>
    public static (StoryGenre? Genre, IReadOnlyList<StoryGenreProblem> Problems) Normalize(StoryGenre input)
    {
        var problems = new List<StoryGenreProblem>();
        void Problem(string code, string message, string field) => problems.Add(new(code, message, field));

        var id = input.Id?.Trim().ToLowerInvariant() ?? string.Empty;
        if (!IdPattern().IsMatch(id))
            Problem("genre-id-invalid", "The id is 2 to 40 lower-case letters, digits and dashes, starting with a letter or digit.", "id");

        var name = AiOutputSanitizer.ToSafeLine(input.Name, MaxNameChars);
        if (name is null || name.Length < 2) Problem("genre-name-required", "Give the genre a name.", "name");

        if (!Enum.IsDefined(input.Mode)) Problem("genre-mode-invalid", "Pick scripture or creative.", "mode");
        if (!Enum.IsDefined(input.DefaultFormat) || !Enum.IsDefined(input.LookStyle))
            Problem("genre-defaults-invalid", "That shape or look is not one this app knows.", "defaultFormat");

        var styleGuide = AiOutputSanitizer.ToSafeText(input.StyleGuide, MaxStyleGuideChars) ?? string.Empty;
        if (input.Mode == StoryGenreMode.Creative && styleGuide.Length < 20)
            Problem("genre-style-required", "A creative genre needs a style guide of a sentence or two: who it is for, the tone, the shape.", "styleGuide");

        var category = Categories.FirstOrDefault(c => string.Equals(c, input.Category?.Trim(), StringComparison.OrdinalIgnoreCase));
        if (category is null) Problem("genre-category-invalid", "Pick one of YouTube's categories.", "category");

        var links = new List<StoryGenreLink>();
        foreach (var link in (input.Links ?? []).Take(MaxLinks + 1))
        {
            if (links.Count == MaxLinks) { Problem("genre-links-too-many", $"Up to {MaxLinks} links.", "links"); break; }
            var label = AiOutputSanitizer.ToSafeLine(link.Label, 60);
            var url = SafeUrl(link.Url);
            if (label is null || url is null)
            {
                Problem("genre-link-invalid", "Each link needs a label and a full http or https address.", "links");
                continue;
            }
            links.Add(new StoryGenreLink { Label = label, Url = url });
        }

        var topics = new List<StoryGenreTopic>();
        var topicIds = new HashSet<string>(StringComparer.Ordinal);
        foreach (var topic in (input.Topics ?? []).Take(MaxTopics + 1))
        {
            if (topics.Count == MaxTopics) { Problem("genre-topics-too-many", $"Up to {MaxTopics} topics.", "topics"); break; }
            var cleaned = NormalizeTopic(topic, input.Mode, Problem);
            if (cleaned is null) continue;
            if (!topicIds.Add(cleaned.Id)) { Problem("genre-topic-duplicate", $"Two topics have the id '{cleaned.Id}'.", "topics"); continue; }
            topics.Add(cleaned);
        }

        if (problems.Count > 0) return (null, problems);

        return (new StoryGenre
        {
            Id = id,
            Name = name!,
            NameHindi = AiOutputSanitizer.ToSafeLine(input.NameHindi, MaxNameChars),
            Description = AiOutputSanitizer.ToSafeLine(input.Description, MaxDescriptionChars) ?? string.Empty,
            Icon = AiOutputSanitizer.ToSafeLine(input.Icon, 8) ?? "📖",
            Order = Math.Clamp(input.Order, -1000, 1000),
            Enabled = input.Enabled,
            BuiltIn = input.BuiltIn,
            Mode = input.Mode,
            StyleGuide = styleGuide,
            Moods = [.. (input.Moods ?? [])
                .Select(m => m?.Trim().ToLowerInvariant() ?? string.Empty)
                .Where(m => MoodPattern().IsMatch(m))
                .Distinct(StringComparer.Ordinal)
                .Take(MaxMoods)],
            DefaultLanguage = string.Equals(input.DefaultLanguage, "en", StringComparison.OrdinalIgnoreCase) ? "en" : "hi",
            DefaultTargetSeconds = Math.Clamp(input.DefaultTargetSeconds <= 0 ? 150 : input.DefaultTargetSeconds, StoryRunService.MinTargetSeconds, StoryRunService.MaxTargetSeconds),
            DefaultFormat = input.DefaultFormat,
            LookStyle = input.LookStyle,
            ImageStyle = AiOutputSanitizer.ToSafeLine(input.ImageStyle, 300),
            MusicQuery = AiOutputSanitizer.ToSafeLine(input.MusicQuery, 80),
            SpeechStyle = AiOutputSanitizer.ToSafeLine(input.SpeechStyle, 300),
            Tags = CleanList(input.Tags, MaxTags, MaxTagChars, hashtag: false),
            Hashtags = CleanList(input.Hashtags, MaxHashtags, MaxTagChars, hashtag: true),
            Links = links,
            TitleSuffix = AiOutputSanitizer.ToSafeLine(input.TitleSuffix, 60),
            PinnedLine = AiOutputSanitizer.ToSafeLine(input.PinnedLine, 200),
            Category = category!,
            MadeForKids = input.MadeForKids,
            Topics = topics
        }, []);
    }

    private static StoryGenreTopic? NormalizeTopic(StoryGenreTopic topic, StoryGenreMode mode, Action<string, string, string> problem)
    {
        var id = topic.Id?.Trim().ToLowerInvariant() ?? string.Empty;
        var name = AiOutputSanitizer.ToSafeLine(topic.Name, 120);
        if (!IdPattern().IsMatch(id) || name is null)
        {
            problem("genre-topic-invalid", $"Topic '{topic.Name}': it needs a name and an id of lower-case letters, digits and dashes.", "topics");
            return null;
        }

        var keywords = CleanList(topic.Keywords, MaxKeywords, 60, hashtag: false);
        if (keywords.Count == 0)
        {
            problem("genre-topic-keywords", $"Topic '{name}': give at least one keyword that a title would contain.", "topics");
            return null;
        }

        var sources = new List<StoryGenreSource>();
        if (mode == StoryGenreMode.Scripture)
        {
            foreach (var source in (topic.Sources ?? []).Take(MaxSourcesPerTopic))
            {
                var text = GranthCatalog.Get(source.TextId?.Trim());
                var reference = AiOutputSanitizer.ToSafeLine(source.Ref, 80);
                if (text is null || reference is null || !Enum.IsDefined(source.Confidence))
                {
                    problem("genre-source-invalid",
                        $"Topic '{name}': a source must name a text from the catalogue (such as bhagavata-purana) and a place in it.", "topics");
                    continue;
                }
                sources.Add(new StoryGenreSource
                {
                    TextId = text.Id,
                    Ref = reference,
                    Note = AiOutputSanitizer.ToSafeLine(source.Note, 200),
                    Confidence = source.Confidence
                });
            }
        }

        return new StoryGenreTopic
        {
            Id = id,
            Name = name,
            Hindi = AiOutputSanitizer.ToSafeLine(topic.Hindi, 120),
            Keywords = keywords,
            Summary = AiOutputSanitizer.ToSafeLine(topic.Summary, 600) ?? string.Empty,
            MusicQuery = AiOutputSanitizer.ToSafeLine(topic.MusicQuery, 80),
            Sources = sources
        };
    }

    private static List<string> CleanList(IEnumerable<string>? values, int max, int maxChars, bool hashtag) =>
    [
        .. (values ?? [])
            .Select(v => AiOutputSanitizer.ToSafeLine(hashtag ? v?.Trim().TrimStart('#') : v?.Replace(",", " "), maxChars))
            .OfType<string>()
            .Select(v => hashtag ? new string([.. v.Where(char.IsLetterOrDigit)]) : v)
            .Where(v => v.Length > 0)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(max)
    ];

    /// <summary>An absolute http(s) address with a host and nothing that could break out of a description line, or null.</summary>
    private static string? SafeUrl(string? value)
    {
        var text = value?.Trim();
        if (string.IsNullOrEmpty(text) || text.Length > 300 || text.Any(c => char.IsWhiteSpace(c) || char.IsControl(c) || c is '<' or '>' or '"'))
            return null;
        return Uri.TryCreate(text, UriKind.Absolute, out var uri)
               && (uri.Scheme == Uri.UriSchemeHttps || uri.Scheme == Uri.UriSchemeHttp)
               && !string.IsNullOrEmpty(uri.Host)
            ? uri.AbsoluteUri
            : null;
    }
}
