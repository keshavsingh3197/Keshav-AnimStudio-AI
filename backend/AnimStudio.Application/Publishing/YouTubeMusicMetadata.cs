using System.Globalization;
using System.Text;
using AnimStudio.Application.Releases;

namespace AnimStudio.Application.Publishing;

/// <summary>The pre-filled details for a song's video, before the user edits them.</summary>
public sealed record YouTubeMusicDraft(string Title, string Description, IReadOnlyList<string> Tags);

/// <summary>
/// Turns a release's metadata into the title, description and tags of its YouTube music
/// video. Uploaded with the Music category, the video is what YouTube Music lists under the
/// artist's channel; audio-only "Art Tracks" only come from a distributor, never this API.
/// Everything returned already fits <see cref="YouTubePublishValidator"/>'s limits.
/// </summary>
public static class YouTubeMusicMetadata
{
    public const string MusicCategoryId = "10";
    public const string VideoLabel = "Official Visualizer";

    public static YouTubeMusicDraft Compose(ReleaseMetadata release) =>
        new(Title(release), Description(release), Tags(release));

    /// <summary>"Artist - Title (feat. X) [Version] (Official Visualizer)", the suffixes dropped first if too long.</summary>
    public static string Title(ReleaseMetadata release)
    {
        var artist = Clean(release.PrimaryArtist);
        var song = Clean(release.Title);
        var featured = Names(release.FeaturedArtists);
        var version = Clean(release.VersionTitle);

        var core = artist.Length == 0 ? song : $"{artist} - {song}";
        var candidates = new[]
        {
            Join(core, featured.Length == 0 ? null : $"(feat. {featured})", version.Length == 0 ? null : $"[{version}]", $"({VideoLabel})"),
            Join(core, featured.Length == 0 ? null : $"(feat. {featured})", version.Length == 0 ? null : $"[{version}]"),
            Join(core, version.Length == 0 ? null : $"[{version}]"),
            core,
        };

        var title = candidates.FirstOrDefault(c => c.Length <= YouTubePublishValidator.MaxTitleLength)
                    ?? core[..YouTubePublishValidator.MaxTitleLength].TrimEnd();
        return title;
    }

    /// <summary>The song, its credits and the (P)/(C) lines; lyrics are added only when the whole fits.</summary>
    public static string Description(ReleaseMetadata release)
    {
        var lines = new List<string>();

        var featured = Names(release.FeaturedArtists);
        var heading = $"\"{Clean(release.Title)}\" by {Clean(release.PrimaryArtist)}";
        if (featured.Length > 0) heading += $" feat. {featured}";
        lines.Add(heading);
        if (release.ReleaseDate is { } date)
            lines.Add($"Released {date.ToString("d MMMM yyyy", CultureInfo.InvariantCulture)}");

        var credits = new List<string>();
        AddCredit(credits, "Written by", Names(release.Songwriters));
        AddCredit(credits, "Produced by", Names(release.Producers));
        AddCredit(credits, "Genre", Join(Clean(release.Genre), Clean(release.SecondaryGenre).Length == 0 ? null : $"/ {Clean(release.SecondaryGenre)}"));
        AddCredit(credits, "Label", Clean(release.RecordLabel));
        AddCredit(credits, "℗", Clean(release.RecordingCopyright));
        AddCredit(credits, "©", Clean(release.CompositionCopyright));
        AddCredit(credits, "ISRC", Clean(release.Isrc));

        var description = lines.Count > 0 ? string.Join("\n", lines) : string.Empty;
        if (credits.Count > 0) description += "\n\n" + string.Join("\n", credits);

        var lyrics = CleanMultiline(release.Lyrics);
        if (!release.Instrumental && lyrics.Length > 0)
        {
            var withLyrics = $"{description}\n\nLyrics\n{lyrics}";
            if (Fits(withLyrics)) description = withLyrics;
        }

        return Fits(description) ? description : Truncate(description);
    }

    /// <summary>Artist, song, genres and featured artists, stopped before YouTube's tag budget runs out.</summary>
    public static IReadOnlyList<string> Tags(ReleaseMetadata release)
    {
        var artist = TagText(release.PrimaryArtist);
        var song = TagText(release.Title);
        var wanted = new List<string> { artist, song };
        if (artist.Length > 0 && song.Length > 0) wanted.Add($"{artist} {song}");
        wanted.Add(TagText(release.Genre));
        wanted.Add(TagText(release.SecondaryGenre));
        wanted.AddRange(release.FeaturedArtists.Select(TagText));
        wanted.Add(release.Instrumental ? "instrumental" : "music");
        wanted.Add("official visualizer");

        var tags = new List<string>();
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var tag in wanted)
        {
            if (tag.Length == 0 || !seen.Add(tag)) continue;
            if (YouTubePublishValidator.TagsLength([.. tags, tag]) > YouTubePublishValidator.MaxTagsLength) break;
            tags.Add(tag);
        }
        return tags;
    }

    private static void AddCredit(List<string> credits, string label, string value)
    {
        // ℗ and © are read as part of the line ("℗ 2026 Label"), the rest as "Label: value".
        if (value.Length > 0) credits.Add(label is "℗" or "©" ? $"{label} {value}" : $"{label}: {value}");
    }

    private static string Join(string first, params string?[] rest) =>
        string.Join(" ", new[] { first }.Concat(rest).Where(s => !string.IsNullOrWhiteSpace(s)));

    private static string Names(IReadOnlyList<string> names) =>
        string.Join(", ", names.Select(Clean).Where(n => n.Length > 0));

    private static bool Fits(string description) =>
        Encoding.UTF8.GetByteCount(description) <= YouTubePublishValidator.MaxDescriptionBytes;

    /// <summary>Cuts on a character boundary so the UTF-8 byte count fits; a surrogate pair is never split.</summary>
    private static string Truncate(string description)
    {
        var builder = new StringBuilder();
        var bytes = 0;
        foreach (var rune in description.EnumerateRunes())
        {
            bytes += rune.Utf8SequenceLength;
            if (bytes > YouTubePublishValidator.MaxDescriptionBytes) break;
            builder.Append(rune.ToString());
        }
        return builder.ToString().TrimEnd();
    }

    /// <summary>YouTube rejects &lt; and &gt; anywhere in the details; tags also can't hold commas or quotes.</summary>
    private static string TagText(string? value) =>
        Clean(value).Replace(",", " ").Replace("\"", string.Empty).Trim();

    private static string Clean(string? value) =>
        new string((value ?? string.Empty).Where(c => !char.IsControl(c) && c is not '<' and not '>').ToArray()).Trim();

    private static string CleanMultiline(string? value) =>
        string.Join("\n", (value ?? string.Empty).Replace("\r\n", "\n").Split('\n').Select(Clean)).Trim();
}
