using System.Text;
using System.Text.RegularExpressions;
using AnimStudio.Domain.Ai;
using AnimStudio.Domain.Publishing;

namespace AnimStudio.Application.Publishing;

/// <summary>
/// Turns a brand channel's <see cref="ChannelBranding"/> into the parts of a YouTube description
/// and comment that must be exact - credits, links, hashtags. These are added by code rather than
/// left to the model, which would otherwise be free to mistype a URL or drop a credit.
/// </summary>
public static partial class YouTubeBrandKit
{
    private const string Rule = "━━━━━━━━━━━━━━━━━━━━━━━━━━━";
    public const int MaxHashtags = 15;

    /// <summary>The studio's own branding, used by a channel that hasn't set any.</summary>
    public static ChannelBranding Default => new()
    {
        ChannelName = "OMKR",
        Tagline = "Devotional 3D Animations",
        ChannelUrl = "https://youtube.com/@omkr-shiv",
        StudioUrl = "https://studio.keshavsingh.in/",
        CreatorUrl = "https://keshavsingh.in/",
        EngineName = "AnimStudio",
        VisualsCredit = "OMKR 3D Devotional Animations",
        Hashtags = ["OMKR", "AnimStudio", "KeshavSingh"],
        Tags = ["AnimStudio", "omkr", "omkr shiv", "keshav singh"],
    };

    /// <summary>The channel's branding; when it has set none, the studio's own for the OMKR devotional tone and nothing otherwise.</summary>
    public static ChannelBranding Resolve(ChannelBranding? branding, string? toneId = null) =>
        branding ?? (string.Equals(toneId, "devotional-omkr", StringComparison.Ordinal) ? Default : new ChannelBranding());

    /// <summary>
    /// The branding a channel's videos actually carry, merged field by field:
    /// <list type="number">
    /// <item>the channel's own value (<see cref="ChannelPublishSettings.Branding"/>) when it typed one;</item>
    /// <item>else the studio-wide default (<c>AiSettings.StudioBranding</c>) - tagline, studio and
    /// creator links, tool and visuals credits, hashtags and tags (a non-empty list overrides as a whole);</item>
    /// <item>else, for the channel name and YouTube link only, what the linked YouTube channel says:
    /// its title (or <paramref name="brandChannelName"/>), and <c>youtube.com/@handle</c> or the
    /// <c>/channel/UC…</c> address.</item>
    /// </list>
    /// </summary>
    /// <remarks>
    /// Null when neither the channel nor the studio has set anything, so <see cref="Resolve"/> keeps
    /// its OMKR-tone fallback for a server nobody has branded yet. The YouTube-derived values alone
    /// don't count as "set": they fill in a branding someone asked for, they don't switch it on -
    /// otherwise linking a channel would quietly add credits to descriptions that had none.
    /// The result is a fresh object; nothing stored is modified.
    /// </remarks>
    public static ChannelBranding? Effective(AiSettings? settings, ChannelPublishSettings? publishing, string? brandChannelName = null)
    {
        var own = publishing?.Branding;
        var studio = settings?.StudioBranding;
        if (!HasAny(own) && !HasAny(studio)) return null;

        static string? Pick(params string?[] values) =>
            values.FirstOrDefault(v => !string.IsNullOrWhiteSpace(v))?.Trim();
        static List<string> PickList(List<string>? first, List<string>? second) =>
            first is { Count: > 0 } ? [.. first] : second is { Count: > 0 } ? [.. second] : [];

        return new ChannelBranding
        {
            ChannelName = Pick(own?.ChannelName, AutoChannelName(publishing, brandChannelName)),
            Tagline = Pick(own?.Tagline, studio?.Tagline),
            ChannelUrl = Pick(own?.ChannelUrl, AutoChannelUrl(publishing)),
            StudioUrl = Pick(own?.StudioUrl, studio?.StudioUrl),
            CreatorUrl = Pick(own?.CreatorUrl, studio?.CreatorUrl),
            EngineName = Pick(own?.EngineName, studio?.EngineName),
            VisualsCredit = Pick(own?.VisualsCredit, studio?.VisualsCredit),
            Hashtags = PickList(own?.Hashtags, studio?.Hashtags),
            Tags = PickList(own?.Tags, studio?.Tags),
        };
    }

    /// <summary>
    /// The channel's name as viewers know it, from its YouTube link (else the brand channel's name),
    /// tidied the way <see cref="Normalize"/> tidies typed text: it lands in a description, where
    /// YouTube refuses &lt; and &gt;.
    /// </summary>
    public static string? AutoChannelName(ChannelPublishSettings? publishing, string? brandChannelName = null)
    {
        foreach (var candidate in new[] { publishing?.YouTubeChannelTitle, brandChannelName })
        {
            var clean = ControlRun().Replace(candidate ?? string.Empty, " ").Replace("<", string.Empty).Replace(">", string.Empty).Trim();
            if (clean.Length > 0) return clean.Length > 80 ? clean[..80].TrimEnd() : clean;
        }
        return null;
    }

    /// <summary>
    /// The channel's public YouTube address, built from what YouTube reported: the <c>@handle</c>
    /// form when known (what people share), else the permanent <c>/channel/UC…</c> one. Both parts
    /// are checked against an allowlist first, so a stored value can never smuggle a different
    /// host or path into a description.
    /// </summary>
    public static string? AutoChannelUrl(ChannelPublishSettings? publishing)
    {
        var handle = (publishing?.YouTubeChannelHandle ?? string.Empty).Trim().TrimStart('@');
        if (handle.Length is > 0 and <= 100 && HandleBody().IsMatch(handle)) return $"https://youtube.com/@{handle}";

        var id = (publishing?.YouTubeChannelId ?? string.Empty).Trim();
        return id.Length is > 0 and <= 64 && ChannelIdBody().IsMatch(id) ? $"https://www.youtube.com/channel/{id}" : null;
    }

    /// <summary>Whether a branding has anything typed into it at all.</summary>
    public static bool HasAny(ChannelBranding? b) =>
        b is not null && (
            new[] { b.ChannelName, b.Tagline, b.ChannelUrl, b.StudioUrl, b.CreatorUrl, b.EngineName, b.VisualsCredit }
                .Any(v => !string.IsNullOrWhiteSpace(v))
            || b.Hashtags is { Count: > 0 } || b.Tags is { Count: > 0 });

    /// <summary>
    /// Checks the studio-wide defaults with the same rules as a channel's (<see cref="Normalize"/>),
    /// then drops the channel name and YouTube link: those are per channel by nature, and a studio
    /// value would put one channel's subscribe link under every other channel's videos.
    /// Nothing left after that is stored as null.
    /// </summary>
    public static (ChannelBranding? Branding, IReadOnlyList<YouTubeCheck> Errors) NormalizeStudio(ChannelBranding? input)
    {
        var (normalized, errors) = Normalize(input);
        if (normalized is null) return (null, errors);
        normalized.ChannelName = null;
        normalized.ChannelUrl = null;
        return (HasAny(normalized) ? normalized : null, errors);
    }

    /// <summary>The branding as plain facts for the prompt (the prompt fences them as data).</summary>
    public static string PromptText(ChannelBranding branding)
    {
        var sb = new StringBuilder();
        void Line(string label, string? value)
        {
            if (!string.IsNullOrWhiteSpace(value)) sb.Append(label).Append(": ").Append(value.Trim()).Append('\n');
        }

        var name = string.IsNullOrWhiteSpace(branding.Tagline)
            ? branding.ChannelName
            : $"{branding.ChannelName} ({branding.Tagline})";
        Line("Channel name", name);
        Line("YouTube channel", branding.ChannelUrl);
        Line("Animation engine", branding.EngineName);
        Line("Visuals credit", branding.VisualsCredit);
        if (branding.Hashtags.Count > 0) Line("Brand hashtags (added for you)", string.Join(' ', branding.Hashtags.Select(h => "#" + h)));
        return sb.Length == 0
            ? "(no channel branding)"
            : sb.ToString().TrimEnd() + "\nThe credits, links and brand hashtags are added to the description for you; do not write them yourself.";
    }

    /// <summary>The credits and subscribe lines; empty when the branding has nothing to say.</summary>
    public static string Block(ChannelBranding branding, string language, string? footer = null)
    {
        var hindi = YouTubeMetadataSuggester.NormalizeLanguage(language) == "hi";
        bool Shown(string? url) => !string.IsNullOrWhiteSpace(url)
            && (string.IsNullOrWhiteSpace(footer) || !footer.Contains(url.Trim().TrimEnd('/'), StringComparison.OrdinalIgnoreCase));

        var credits = new List<string>();
        if (!string.IsNullOrWhiteSpace(branding.EngineName))
            credits.Add(hindi
                ? $"एनिमेशन टूल (Animation Engine): {branding.EngineName.Trim()} (निर्माता द्वारा विकसित)"
                : $"Animation Engine: {branding.EngineName.Trim()}");
        if (Shown(branding.StudioUrl))
            credits.Add(hindi ? $"स्टूडियो लिंक (Studio Platform): {branding.StudioUrl!.Trim()}" : $"Studio: {branding.StudioUrl!.Trim()}");
        if (Shown(branding.CreatorUrl))
            credits.Add(hindi ? $"निर्माता प्रोफ़ाइल (Creator Portfolio): {branding.CreatorUrl!.Trim()}" : $"Creator: {branding.CreatorUrl!.Trim()}");
        if (!string.IsNullOrWhiteSpace(branding.VisualsCredit))
            credits.Add(hindi ? $"दृश्य निर्माण (Visuals & 3D Render): {branding.VisualsCredit.Trim()}" : $"Visuals: {branding.VisualsCredit.Trim()}");
        if (!string.IsNullOrWhiteSpace(branding.ChannelName))
            credits.Add(hindi ? $"प्रस्तुति (Presented by): {branding.ChannelName.Trim()}" : $"Presented by: {branding.ChannelName.Trim()}");

        var subscribe = Shown(branding.ChannelUrl)
            ? $"🔔 Subscribe{(string.IsNullOrWhiteSpace(branding.ChannelName) ? string.Empty : " to " + branding.ChannelName.Trim())}: {branding.ChannelUrl!.Trim()}"
            : null;

        if (credits.Count == 0 && subscribe is null) return string.Empty;

        var sb = new StringBuilder();
        if (credits.Count > 0)
        {
            sb.Append(Rule).Append('\n')
              .Append(hindi ? "🎬 प्रोडक्शन व क्रेडिट्स (Credits)" : "🎬 Production & Credits").Append('\n')
              .Append(Rule).Append('\n')
              .Append(string.Join('\n', credits));
        }
        if (subscribe is not null) sb.Append(sb.Length > 0 ? "\n\n" : string.Empty).Append(subscribe);
        return sb.ToString();
    }

    /// <summary>
    /// The description with the brand block and hashtags in their place: the body, then whatever
    /// <paramref name="addInsights"/> adds (chapters, music credits), the credits block, and the
    /// hashtags last - the model's own plus the brand's, up to <see cref="MaxHashtags"/>.
    /// Stays within <see cref="YouTubePublishValidator.MaxDescriptionBytes"/>, leaving room for <paramref name="footer"/>.
    /// </summary>
    public static string Compose(string description, ChannelBranding branding, string language, string? footer,
        Func<string, string>? addInsights = null)
    {
        var (body, written) = LiftHashtags(description);
        if (addInsights is not null) body = addInsights(body);

        var tags = new List<string>();
        foreach (var tag in written.Concat(branding.Hashtags.Select(h => "#" + h)))
        {
            if (tags.Count >= MaxHashtags) break;
            if (!tags.Contains(tag, StringComparer.OrdinalIgnoreCase)) tags.Add(tag);
        }
        var hashLine = string.Join(' ', tags);

        var budget = YouTubePublishValidator.MaxDescriptionBytes
                     - (string.IsNullOrWhiteSpace(footer) ? 0 : Encoding.UTF8.GetByteCount(footer.Trim()) + 2);

        var block = body.Contains(Rule, StringComparison.Ordinal) ? string.Empty : Block(branding, language, footer);
        foreach (var candidate in new[] { block, string.Empty })
        {
            var parts = new[] { body.Trim(), candidate, hashLine }.Where(p => p.Length > 0);
            var result = string.Join("\n\n", parts);
            if (Encoding.UTF8.GetByteCount(result) <= budget) return result;
        }

        // Too long even without the block: keep the body, and the hashtags if they fit.
        var plain = body.Trim();
        var withTags = hashLine.Length > 0 ? $"{plain}\n\n{hashLine}" : plain;
        return Encoding.UTF8.GetByteCount(withTags) <= budget ? withTags : plain;
    }

    /// <summary>The comment with the channel's subscribe link (and studio/creator links) added when it lacks them and they fit.</summary>
    public static string? WithLinks(string? comment, ChannelBranding branding, string language)
    {
        if (string.IsNullOrWhiteSpace(comment) || string.IsNullOrWhiteSpace(branding.ChannelUrl)) return comment;
        var hindi = YouTubeMetadataSuggester.NormalizeLanguage(language) == "hi";
        var result = comment.Trim();

        if (!result.Contains(branding.ChannelUrl.Trim().TrimEnd('/'), StringComparison.OrdinalIgnoreCase))
        {
            var subscribe = hindi
                ? $"🔔 ऐसे और दिव्य वीडियो के लिए चैनल को Subscribe करें: {branding.ChannelUrl.Trim()}"
                : $"🔔 Subscribe for more: {branding.ChannelUrl.Trim()}";
            result = Fit(result, subscribe);
        }

        var others = new[] { branding.StudioUrl, branding.CreatorUrl }
            .Where(u => !string.IsNullOrWhiteSpace(u) && !result.Contains(u!.Trim().TrimEnd('/'), StringComparison.OrdinalIgnoreCase))
            .Select(u => u!.Trim())
            .ToList();
        if (others.Count > 0) result = Fit(result, "🌐 " + string.Join(" | ", others));
        return result;

        static string Fit(string text, string addition) =>
            text.Length + 2 + addition.Length <= 1000 ? $"{text}\n\n{addition}" : text;
    }

    /// <summary>Hashtag lines at the end of the text, taken off it, and the hashtags they held.</summary>
    internal static (string Body, List<string> Hashtags) LiftHashtags(string description)
    {
        var lines = description.Replace("\r\n", "\n", StringComparison.Ordinal).Split('\n').ToList();
        var tags = new List<string>();
        while (lines.Count > 0)
        {
            var last = lines[^1].Trim();
            if (last.Length == 0) { lines.RemoveAt(lines.Count - 1); continue; }
            var tokens = last.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            if (!tokens.All(t => HashtagToken().IsMatch(t))) break;
            tags.InsertRange(0, tokens);
            lines.RemoveAt(lines.Count - 1);
        }
        return (string.Join('\n', lines).TrimEnd(), tags);
    }

    /// <summary>Checks a channel's branding for the admin form: https links only, short plain text, tidy hashtags and tags.</summary>
    public static (ChannelBranding? Branding, IReadOnlyList<YouTubeCheck> Errors) Normalize(ChannelBranding? input)
    {
        var errors = new List<YouTubeCheck>();
        if (input is null) return (null, errors);

        string? Text(string? value, string field, int max)
        {
            var clean = ControlRun().Replace(value ?? string.Empty, " ").Trim();
            if (clean.Length == 0) return null;
            if (clean.Contains('<') || clean.Contains('>'))
                errors.Add(new($"branding.{field}", "branding-invalid-character", "Branding text can't contain < or >."));
            else if (clean.Length > max)
                errors.Add(new($"branding.{field}", "branding-too-long", $"Keep this under {max} characters."));
            return clean;
        }

        string? Url(string? value, string field)
        {
            var clean = (value ?? string.Empty).Trim();
            if (clean.Length == 0) return null;
            if (clean.Length > 300 || clean.Any(char.IsWhiteSpace) || clean.Contains('<') || clean.Contains('>')
                || !Uri.TryCreate(clean, UriKind.Absolute, out var uri) || uri.Scheme != Uri.UriSchemeHttps)
                errors.Add(new($"branding.{field}", "branding-url-invalid", "Use a full https:// link."));
            return clean;
        }

        var hashtags = new List<string>();
        foreach (var raw in input.Hashtags ?? [])
        {
            var tag = (raw ?? string.Empty).Trim().TrimStart('#');
            if (tag.Length == 0) continue;
            if (tag.Length > 30 || !HashtagBody().IsMatch(tag))
                errors.Add(new("branding.hashtags", "branding-hashtag-invalid", $"'{raw}' isn't a valid hashtag: letters, numbers and _ only."));
            else if (!hashtags.Contains(tag, StringComparer.OrdinalIgnoreCase)) hashtags.Add(tag);
        }
        if (hashtags.Count > 10) errors.Add(new("branding.hashtags", "branding-too-many", "Keep brand hashtags to 10 or fewer."));

        var tags = new List<string>();
        foreach (var raw in input.Tags ?? [])
        {
            var tag = (raw ?? string.Empty).Trim().TrimStart('#');
            if (tag.Length == 0) continue;
            if (tag.Length > 40 || tag.IndexOfAny(['<', '>', ',', '"']) >= 0)
                errors.Add(new("branding.tags", "branding-tag-invalid", $"'{raw}' isn't a valid tag."));
            else if (!tags.Contains(tag, StringComparer.OrdinalIgnoreCase)) tags.Add(tag);
        }
        if (tags.Count > 15) errors.Add(new("branding.tags", "branding-too-many", "Keep brand tags to 15 or fewer."));

        var normalized = new ChannelBranding
        {
            ChannelName = Text(input.ChannelName, "channelName", 80),
            Tagline = Text(input.Tagline, "tagline", 120),
            ChannelUrl = Url(input.ChannelUrl, "channelUrl"),
            StudioUrl = Url(input.StudioUrl, "studioUrl"),
            CreatorUrl = Url(input.CreatorUrl, "creatorUrl"),
            EngineName = Text(input.EngineName, "engineName", 60),
            VisualsCredit = Text(input.VisualsCredit, "visualsCredit", 120),
            Hashtags = hashtags,
            Tags = tags,
        };
        return (errors.Count > 0 ? null : normalized, errors);
    }

    [GeneratedRegex(@"^#[\p{L}\p{M}\p{N}_]+$", RegexOptions.CultureInvariant)]
    private static partial Regex HashtagToken();

    [GeneratedRegex(@"^[\p{L}\p{M}\p{N}_]+$", RegexOptions.CultureInvariant)]
    private static partial Regex HashtagBody();

    [GeneratedRegex(@"[\p{C}\s]+", RegexOptions.CultureInvariant)]
    private static partial Regex ControlRun();

    /// <summary>A YouTube handle without its "@": letters, marks, digits, '.', '_' and '-' (YouTube's own charset).</summary>
    [GeneratedRegex(@"^[\p{L}\p{M}\p{N}._-]+$", RegexOptions.CultureInvariant)]
    private static partial Regex HandleBody();

    [GeneratedRegex(@"^[A-Za-z0-9_-]+$", RegexOptions.CultureInvariant)]
    private static partial Regex ChannelIdBody();
}
