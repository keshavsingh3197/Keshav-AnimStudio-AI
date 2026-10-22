using System.Globalization;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace AnimStudio.Application.Publishing;

/// <summary>One caption line and when it starts, in seconds from the start of the video.</summary>
public sealed record YouTubeCaptionSegment(double StartSeconds, string Text);

/// <summary>
/// A song or piece of music a video credits or YouTube recognised in it. Best effort: nothing
/// here is verified, and every value came from YouTube or the video's own description.
/// </summary>
/// <param name="Source">
/// <see cref="YouTubeMusicDetector.SourceMusicCard"/> (YouTube's own "Music" section) or
/// <see cref="YouTubeMusicDetector.SourceDescription"/> (credit lines in the description).
/// </param>
/// <param name="Credits">Other people credited with it - composer, lyricist, label - in one line.</param>
public sealed record YouTubeDetectedSong(string Title, string? Artist, string? Album, string Source, string? Credits = null);

/// <summary>A chapter marker for the description: "0:00 Title".</summary>
public sealed record YouTubeChapter(double StartSeconds, string Title)
{
    public string Stamp => YouTubeChapterBuilder.Stamp(StartSeconds);
}

/// <summary>What the suggestion engines get on top of the summary: songs to credit and real chapters.</summary>
public sealed record YouTubeSeoExtras(IReadOnlyList<YouTubeDetectedSong> Songs, IReadOnlyList<YouTubeChapter> Chapters)
{
    public static readonly YouTubeSeoExtras None = new([], []);

    public bool IsEmpty => Songs.Count == 0 && Chapters.Count == 0;
}

/// <summary>
/// Finds the music a video uses, from two free places: the "Music" section YouTube shows under
/// a watch page (the Innertube <c>next</c> response) and credit lines in the description
/// ("Song:", "Singer:", "♪ … - …", the "Provided to YouTube by …" block of auto-generated
/// music videos). Pure parsing: no network, and anything unexpected is skipped, never thrown.
/// </summary>
public static partial class YouTubeMusicDetector
{
    public const string SourceMusicCard = "youtube-music-card";
    public const string SourceDescription = "description";

    /// <summary>More than this is a compilation's track list; the first ones are plenty to credit.</summary>
    public const int MaxSongs = 12;

    private const int MaxValueChars = 100;
    private const int MaxDescriptionLines = 200;

    /// <summary>The Innertube JSON is YouTube's and not ours; a walk this deep or this long is not a watch page.</summary>
    private const int MaxDepth = 48;
    private const int MaxNodes = 400_000;

    private enum Role { Song, Artist, Album, Composer, Lyrics, Label }

    /// <summary>Credit-line labels, lowercased, as they appear before the colon. An allowlist.</summary>
    private static readonly IReadOnlyDictionary<string, Role> Labels = new Dictionary<string, Role>(StringComparer.Ordinal)
    {
        ["song"] = Role.Song, ["song name"] = Role.Song, ["song title"] = Role.Song, ["track"] = Role.Song,
        ["track name"] = Role.Song, ["track title"] = Role.Song, ["bhajan"] = Role.Song,
        ["गीत"] = Role.Song, ["गाना"] = Role.Song, ["भजन"] = Role.Song,

        ["singer"] = Role.Artist, ["singers"] = Role.Artist, ["singer(s)"] = Role.Artist, ["artist"] = Role.Artist,
        ["artists"] = Role.Artist, ["artist(s)"] = Role.Artist, ["vocals"] = Role.Artist, ["vocal"] = Role.Artist,
        ["vocalist"] = Role.Artist, ["voice"] = Role.Artist, ["sung by"] = Role.Artist, ["performed by"] = Role.Artist,
        ["गायक"] = Role.Artist, ["गायिका"] = Role.Artist, ["स्वर"] = Role.Artist, ["आवाज़"] = Role.Artist, ["आवाज"] = Role.Artist,

        ["album"] = Role.Album, ["एल्बम"] = Role.Album,

        ["music"] = Role.Composer, ["music by"] = Role.Composer, ["composer"] = Role.Composer, ["composed by"] = Role.Composer,
        ["music director"] = Role.Composer, ["music composer"] = Role.Composer, ["music producer"] = Role.Composer,
        ["संगीत"] = Role.Composer, ["संगीतकार"] = Role.Composer,

        ["lyrics"] = Role.Lyrics, ["lyricist"] = Role.Lyrics, ["lyrics by"] = Role.Lyrics, ["written by"] = Role.Lyrics,
        ["गीतकार"] = Role.Lyrics, ["बोल"] = Role.Lyrics, ["रचना"] = Role.Lyrics,

        ["label"] = Role.Label, ["music label"] = Role.Label, ["music on"] = Role.Label,
    };

    /// <summary>Songs credited in a description, in the order they appear.</summary>
    public static IReadOnlyList<YouTubeDetectedSong> FromDescription(string? description)
    {
        if (string.IsNullOrWhiteSpace(description)) return [];
        var lines = description.Replace("\r\n", "\n", StringComparison.Ordinal).Replace('\r', '\n')
            .Split('\n').Take(MaxDescriptionLines).Select(l => l.Trim()).ToList();

        var songs = new List<YouTubeDetectedSong>();

        // "Provided to YouTube by <label>" / blank / "Title · Artist · Artist" / blank / "Album" - YouTube's own art-track text.
        for (var i = 0; i < lines.Count; i++)
        {
            if (!lines[i].StartsWith("Provided to YouTube by", StringComparison.OrdinalIgnoreCase)) continue;
            var label = Value(lines[i]["Provided to YouTube by".Length..]);
            var next = NextNonEmpty(lines, i + 1);
            if (next < 0) break;
            var parts = lines[next].Split(" · ", StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            var title = Value(parts.FirstOrDefault());
            if (title is null) continue;
            var artist = parts.Length > 1 ? Value(string.Join(", ", parts.Skip(1))) : null;
            var albumLine = NextNonEmpty(lines, next + 1);
            var album = albumLine >= 0 && !IsLegalLine(lines[albumLine]) ? Value(lines[albumLine]) : null;
            songs.Add(new YouTubeDetectedSong(title, artist, album, SourceDescription, label is null ? null : "Label: " + label));
        }

        // Credit lines. Each "Song:" starts an entry; the lines after it fill it in.
        Pending? current = null;
        Pending? loose = null;
        foreach (var raw in lines)
        {
            if (raw.Length == 0 || raw.Length > 300) continue;

            // "♪ Title - Artist" - but "🎵 Song: Title" is a credit line with a note in front.
            if (MusicNoteLine().Match(raw) is { Success: true } note && !IsCreditLine(note.Groups["rest"].Value))
            {
                var (title, artist) = SplitTitleArtist(note.Groups["rest"].Value);
                if (title is not null) songs.Add(new YouTubeDetectedSong(title, artist, null, SourceDescription));
                continue;
            }

            // "Singer: A | Music: B" puts several credits on one line.
            foreach (var part in raw.Split([" | ", " • ", " ‖ "], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            {
                var match = CreditLine().Match(StripLeadingDecoration(part));
                if (!match.Success) continue;
                var key = Regex.Replace(match.Groups["key"].Value.Trim().ToLowerInvariant(), @"\s+", " ");
                if (!Labels.TryGetValue(key, out var role)) continue;
                var value = Value(match.Groups["value"].Value);
                if (value is null) continue;

                if (role == Role.Song)
                {
                    if (current is not null) songs.Add(current.ToSong());
                    current = new Pending { Title = value };
                    if (loose is not null) { current.Absorb(loose); loose = null; }
                    continue;
                }
                (current ?? (loose ??= new Pending())).Set(role, value);
            }
        }
        if (current is not null)
        {
            songs.Add(current.ToSong());
        }
        else if (loose is not null && loose.HasAny)
        {
            // Credits with no "Song:" line belong to the song already found (an art track's
            // "Composer:" lines), or stand alone as the video's music credits.
            if (songs.Count > 0)
            {
                var first = songs[0];
                var extra = loose.ToSong();
                songs[0] = first with
                {
                    Artist = first.Artist ?? extra.Artist,
                    Album = first.Album ?? extra.Album,
                    Credits = string.Join(" · ", new[] { first.Credits, extra.Credits }.Where(c => !string.IsNullOrEmpty(c))) is { Length: > 0 } c ? c : null,
                };
            }
            else
            {
                songs.Add(loose.ToSong());
            }
        }

        return Dedupe(songs);
    }

    /// <summary>
    /// Songs in the "Music" section of an Innertube <c>next</c> response: the newer card list
    /// (<c>horizontalCardListRenderer</c> of <c>videoAttributeViewModel</c>s under a "Music"
    /// header) and the older <c>videoDescriptionMusicSectionRenderer</c> with SONG/ARTIST/ALBUM rows.
    /// </summary>
    public static IReadOnlyList<YouTubeDetectedSong> FromInnertubeNext(JsonElement root)
    {
        var songs = new List<YouTubeDetectedSong>();
        var nodes = 0;
        Walk(root, 0, songs, ref nodes);
        return Dedupe(songs);
    }

    /// <summary>The cards first (YouTube recognised those), then credit lines that add a song not already there.</summary>
    public static IReadOnlyList<YouTubeDetectedSong> Merge(params IEnumerable<YouTubeDetectedSong>[] lists) =>
        Dedupe(lists.SelectMany(l => l));

    /// <summary>A "🎵 Music" block crediting the songs, for the end of a description; empty when there are none.</summary>
    public static string CreditsBlock(IReadOnlyList<YouTubeDetectedSong> songs)
    {
        if (songs.Count == 0) return string.Empty;
        var sb = new StringBuilder("🎵 Music used:\n");
        foreach (var s in songs.Take(MaxSongs))
        {
            sb.Append("• ");
            sb.Append(s.Title == UntitledCredits ? "Music" : s.Title);
            if (!string.IsNullOrWhiteSpace(s.Artist)) sb.Append(" - ").Append(s.Artist);
            if (!string.IsNullOrWhiteSpace(s.Album)) sb.Append(" (").Append(s.Album).Append(')');
            if (!string.IsNullOrWhiteSpace(s.Credits)) sb.Append(" · ").Append(s.Credits);
            sb.Append('\n');
        }
        return sb.ToString().TrimEnd();
    }

    /// <summary>The title used when a description credits people but names no song.</summary>
    public const string UntitledCredits = "Music credits";

    private static void Walk(JsonElement element, int depth, List<YouTubeDetectedSong> songs, ref int nodes)
    {
        if (depth > MaxDepth || ++nodes > MaxNodes || songs.Count >= MaxSongs) return;
        switch (element.ValueKind)
        {
            case JsonValueKind.Object:
                foreach (var property in element.EnumerateObject())
                {
                    if (property.NameEquals("horizontalCardListRenderer") && property.Value.ValueKind == JsonValueKind.Object)
                    {
                        if (IsMusicHeader(property.Value)) ReadCards(property.Value, songs);
                        continue;
                    }
                    if (property.NameEquals("videoDescriptionMusicSectionRenderer") && property.Value.ValueKind == JsonValueKind.Object)
                    {
                        ReadLockups(property.Value, songs);
                        continue;
                    }
                    Walk(property.Value, depth + 1, songs, ref nodes);
                }
                break;
            case JsonValueKind.Array:
                foreach (var item in element.EnumerateArray()) Walk(item, depth + 1, songs, ref nodes);
                break;
        }
    }

    private static bool IsMusicHeader(JsonElement cardList)
    {
        if (!cardList.TryGetProperty("header", out var header) || header.ValueKind != JsonValueKind.Object) return false;
        foreach (var renderer in header.EnumerateObject())
        {
            if (renderer.Value.ValueKind != JsonValueKind.Object) continue;
            var title = renderer.Value.TryGetProperty("title", out var t) ? Text(t) : null;
            if (title is not null && (title.Contains("music", StringComparison.OrdinalIgnoreCase) || title.Contains("संगीत", StringComparison.Ordinal)))
                return true;
        }
        return false;
    }

    private static void ReadCards(JsonElement cardList, List<YouTubeDetectedSong> songs)
    {
        if (!cardList.TryGetProperty("cards", out var cards) || cards.ValueKind != JsonValueKind.Array) return;
        foreach (var card in cards.EnumerateArray())
        {
            if (songs.Count >= MaxSongs) return;
            if (card.ValueKind != JsonValueKind.Object || !card.TryGetProperty("videoAttributeViewModel", out var vm)
                || vm.ValueKind != JsonValueKind.Object) continue;
            var title = Value(vm.TryGetProperty("title", out var t) ? Text(t) : null);
            if (title is null) continue;
            var artist = Value(vm.TryGetProperty("subtitle", out var s) ? Text(s) : null);
            var album = Value(vm.TryGetProperty("secondarySubtitle", out var a) ? Text(a) : null);
            songs.Add(new YouTubeDetectedSong(title, artist, album, SourceMusicCard));
        }
    }

    private static void ReadLockups(JsonElement section, List<YouTubeDetectedSong> songs)
    {
        if (!section.TryGetProperty("carouselLockups", out var lockups) || lockups.ValueKind != JsonValueKind.Array) return;
        foreach (var lockup in lockups.EnumerateArray())
        {
            if (songs.Count >= MaxSongs) return;
            if (lockup.ValueKind != JsonValueKind.Object || !lockup.TryGetProperty("carouselLockupRenderer", out var renderer)
                || renderer.ValueKind != JsonValueKind.Object) continue;
            string? title = null, artist = null, album = null;
            var credits = new List<string>();
            if (renderer.TryGetProperty("infoRows", out var rows) && rows.ValueKind == JsonValueKind.Array)
            {
                foreach (var row in rows.EnumerateArray())
                {
                    if (row.ValueKind != JsonValueKind.Object || !row.TryGetProperty("infoRowRenderer", out var info)
                        || info.ValueKind != JsonValueKind.Object) continue;
                    var label = info.TryGetProperty("title", out var lt) ? Text(lt)?.Trim().ToUpperInvariant() : null;
                    var value = Value(info.TryGetProperty("defaultMetadata", out var dm) ? Text(dm)
                        : info.TryGetProperty("expandedMetadata", out var em) ? Text(em) : null);
                    if (label is null || value is null) continue;
                    switch (label)
                    {
                        case "SONG": title ??= value; break;
                        case "ARTIST": artist ??= value; break;
                        case "ALBUM": album ??= value; break;
                        case "WRITERS" or "COMPOSERS" or "COMPOSER": credits.Add("Writers: " + value); break;
                    }
                }
            }
            // An unnamed row still has the song's own video as the lockup's title.
            if (title is null && renderer.TryGetProperty("videoLockup", out var video) && video.ValueKind == JsonValueKind.Object)
            {
                foreach (var inner in video.EnumerateObject())
                {
                    if (inner.Value.ValueKind == JsonValueKind.Object && inner.Value.TryGetProperty("title", out var vt))
                    {
                        title = Value(Text(vt));
                        break;
                    }
                }
            }
            if (title is null) continue;
            songs.Add(new YouTubeDetectedSong(title, artist, album, SourceMusicCard, credits.Count == 0 ? null : string.Join(" · ", credits)));
        }
    }

    /// <summary>Innertube text in any of its shapes: a string, <c>simpleText</c>, <c>runs</c> or a view model's <c>content</c>.</summary>
    private static string? Text(JsonElement element)
    {
        switch (element.ValueKind)
        {
            case JsonValueKind.String:
                return element.GetString();
            case JsonValueKind.Object:
                if (element.TryGetProperty("simpleText", out var simple) && simple.ValueKind == JsonValueKind.String) return simple.GetString();
                if (element.TryGetProperty("content", out var content) && content.ValueKind == JsonValueKind.String) return content.GetString();
                if (element.TryGetProperty("runs", out var runs) && runs.ValueKind == JsonValueKind.Array)
                {
                    var sb = new StringBuilder();
                    foreach (var run in runs.EnumerateArray().Take(20))
                    {
                        if (run.ValueKind == JsonValueKind.Object && run.TryGetProperty("text", out var text) && text.ValueKind == JsonValueKind.String)
                            sb.Append(text.GetString());
                    }
                    return sb.Length == 0 ? null : sb.ToString();
                }
                return null;
            default:
                return null;
        }
    }

    private static IReadOnlyList<YouTubeDetectedSong> Dedupe(IEnumerable<YouTubeDetectedSong> songs)
    {
        var seen = new HashSet<string>(StringComparer.Ordinal);
        var list = new List<YouTubeDetectedSong>();
        foreach (var song in songs)
        {
            if (!seen.Add(Key(song.Title) + "|" + (song.Title == UntitledCredits ? Key(song.Credits ?? song.Artist ?? "") : ""))) continue;
            list.Add(song);
            if (list.Count >= MaxSongs) break;
        }
        return list;
    }

    private static string Key(string text) =>
        new(text.Where(char.IsLetterOrDigit).Select(char.ToLowerInvariant).ToArray());

    /// <summary>A credit's value cleaned for display and prompts: one line, no control characters or angle brackets, capped.</summary>
    private static string? Value(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return null;
        var sb = new StringBuilder(Math.Min(raw.Length, MaxValueChars));
        var lastSpace = false;
        foreach (var ch in raw)
        {
            if (char.IsControl(ch) || char.IsWhiteSpace(ch))
            {
                if (!lastSpace && sb.Length > 0) sb.Append(' ');
                lastSpace = true;
                continue;
            }
            if (ch is '<' or '>') continue;
            sb.Append(ch);
            lastSpace = false;
        }
        var text = sb.ToString().Trim().Trim('|', '-', '–', '—', ',', ';', ':').Trim();
        if (text.Length > MaxValueChars) text = text[..MaxValueChars].TrimEnd();
        return text.Length == 0 ? null : text;
    }

    private static (string? Title, string? Artist) SplitTitleArtist(string rest)
    {
        var text = rest.Trim();
        foreach (var note in new[] { "♪", "♫", "🎵", "🎶" })
        {
            if (text.EndsWith(note, StringComparison.Ordinal)) text = text[..^note.Length].TrimEnd();
        }
        foreach (var separator in new[] { " - ", " – ", " — ", " by ", " | " })
        {
            var at = text.IndexOf(separator, StringComparison.OrdinalIgnoreCase);
            if (at > 0) return (Value(text[..at]), Value(text[(at + separator.Length)..]));
        }
        return (Value(text), null);
    }

    private static string StripLeadingDecoration(string line)
    {
        // Bullets, emoji and dashes before the label; an emoji's surrogate halves aren't letters either.
        var i = 0;
        while (i < line.Length && !char.IsLetterOrDigit(line[i])) i++;
        return i == 0 ? line : line[i..];
    }

    private static bool IsCreditLine(string text) =>
        CreditLine().Match(StripLeadingDecoration(text.Trim())) is { Success: true } m
        && Labels.ContainsKey(Regex.Replace(m.Groups["key"].Value.Trim().ToLowerInvariant(), @"\s+", " "));

    private static bool IsLegalLine(string line) =>
        line.StartsWith('℗') || line.StartsWith('©') || line.StartsWith("Released on", StringComparison.OrdinalIgnoreCase)
        || line.StartsWith("Auto-generated", StringComparison.OrdinalIgnoreCase);

    private static int NextNonEmpty(List<string> lines, int from)
    {
        for (var i = from; i < lines.Count && i < from + 4; i++)
        {
            if (lines[i].Length > 0) return i;
        }
        return -1;
    }

    private sealed class Pending
    {
        public string? Title;
        public string? Artist;
        public string? Album;
        public string? Composer;
        public string? Lyrics;
        public string? Label;

        public bool HasAny => Artist is not null || Album is not null || Composer is not null || Lyrics is not null;

        public void Set(Role role, string value)
        {
            switch (role)
            {
                case Role.Artist: Artist ??= value; break;
                case Role.Album: Album ??= value; break;
                case Role.Composer: Composer ??= value; break;
                case Role.Lyrics: Lyrics ??= value; break;
                case Role.Label: Label ??= value; break;
            }
        }

        public void Absorb(Pending other)
        {
            Artist ??= other.Artist;
            Album ??= other.Album;
            Composer ??= other.Composer;
            Lyrics ??= other.Lyrics;
            Label ??= other.Label;
        }

        public YouTubeDetectedSong ToSong()
        {
            var credits = new List<string>();
            if (Composer is not null) credits.Add("Music: " + Composer);
            if (Lyrics is not null) credits.Add("Lyrics: " + Lyrics);
            if (Label is not null) credits.Add("Label: " + Label);
            return new YouTubeDetectedSong(Title ?? UntitledCredits, Artist, Album, SourceDescription,
                credits.Count == 0 ? null : string.Join(" · ", credits));
        }
    }

    /// <summary>"♪ Title - Artist", "🎵 Title by Artist" and the like.</summary>
    [GeneratedRegex(@"^\s*(?:♪|♫|🎵|🎶)\s*(?<rest>[^♪♫].{1,200})$", RegexOptions.CultureInvariant)]
    private static partial Regex MusicNoteLine();

    /// <summary>"Label: value" with a colon, dash or bar; the label is checked against <see cref="Labels"/>.</summary>
    [GeneratedRegex(@"^(?<key>[\p{L}\p{M}()][\p{L}\p{M}() ]{0,24}?)\s*(?::|：|\s-\s|\s–\s|\s—\s|\s\|\s)\s*(?<value>.+)$", RegexOptions.CultureInvariant)]
    private static partial Regex CreditLine();
}

/// <summary>
/// Chapters from caption timing: real timestamps where the video's own words start, instead of
/// guesses. YouTube only shows chapters when the first is at 0:00, there are at least three,
/// and each lasts at least ten seconds - so anything that can't meet that returns none.
/// </summary>
public static partial class YouTubeChapterBuilder
{
    /// <summary>Shorter videos don't get chapters; YouTube's own rules make them pointless.</summary>
    public const double MinVideoSeconds = 60;
    public const int MinChapters = 3;
    public const int MaxChapters = 12;
    public const double MinChapterSeconds = 10;
    public const int MaxTitleChars = 60;

    public static IReadOnlyList<YouTubeChapter> FromSegments(IReadOnlyList<YouTubeCaptionSegment>? segments, double? durationSeconds)
    {
        if (segments is null || segments.Count == 0) return [];

        var usable = segments
            .Where(s => double.IsFinite(s.StartSeconds) && s.StartSeconds >= 0)
            .Select(s => new YouTubeCaptionSegment(s.StartSeconds, CleanText(s.Text)))
            .Where(s => s.Text.Length >= 2)
            .OrderBy(s => s.StartSeconds)
            .ToList();
        if (usable.Count < MinChapters) return [];

        var duration = durationSeconds is > 0 ? durationSeconds.Value : usable[^1].StartSeconds + 5;
        if (duration < MinVideoSeconds) return [];

        var target = Math.Clamp((int)Math.Round(duration / 75.0), MinChapters, MaxChapters);
        var spacing = duration / target;
        var chapters = new List<YouTubeChapter> { new(0, TitleAt(usable, 0)) };

        var cursor = 0;
        for (var i = 1; i < target; i++)
        {
            var wanted = i * spacing;
            var previous = chapters[^1];
            for (var j = cursor; j < usable.Count; j++)
            {
                var s = usable[j];
                if (s.StartSeconds < wanted || s.StartSeconds < previous.StartSeconds + MinChapterSeconds) continue;
                if (s.StartSeconds > duration - MinChapterSeconds) { j = usable.Count; break; }
                var title = TitleAt(usable, j);
                if (string.Equals(title, previous.Title, StringComparison.OrdinalIgnoreCase)) continue;
                chapters.Add(new YouTubeChapter(Math.Floor(s.StartSeconds), title));
                cursor = j + 1;
                break;
            }
        }

        return chapters.Count >= MinChapters ? chapters : [];
    }

    /// <summary>"[mm:ss] text" lines (what the transcript fetcher writes) back into segments.</summary>
    public static IReadOnlyList<YouTubeCaptionSegment> ParseTimestamped(string? transcript)
    {
        if (string.IsNullOrWhiteSpace(transcript)) return [];
        var list = new List<YouTubeCaptionSegment>();
        foreach (var line in transcript.Split('\n'))
        {
            var m = StampedLine().Match(line.Trim());
            if (!m.Success) continue;
            var h = m.Groups["h"].Success ? int.Parse(m.Groups["h"].Value, CultureInfo.InvariantCulture) : 0;
            var min = int.Parse(m.Groups["m"].Value, CultureInfo.InvariantCulture);
            var sec = int.Parse(m.Groups["s"].Value, CultureInfo.InvariantCulture);
            list.Add(new YouTubeCaptionSegment(h * 3600 + min * 60 + sec, m.Groups["text"].Value.Trim()));
        }
        return list;
    }

    /// <summary>The chapter lines for a description, or empty.</summary>
    public static string ToDescriptionBlock(IReadOnlyList<YouTubeChapter> chapters) =>
        chapters.Count < MinChapters
            ? string.Empty
            : "⏱️ Chapters:\n" + string.Join('\n', chapters.Select(c => $"{c.Stamp} {c.Title}"));

    /// <summary>Whether a description already has a chapter list (a line starting "0:00").</summary>
    public static bool HasChapters(string? description) =>
        !string.IsNullOrEmpty(description) && ChapterZeroLine().IsMatch(description);

    public static string Stamp(double seconds)
    {
        var t = TimeSpan.FromSeconds(Math.Max(0, Math.Floor(seconds)));
        return t.TotalHours >= 1
            ? $"{(int)t.TotalHours}:{t.Minutes:00}:{t.Seconds:00}"
            : $"{t.Minutes}:{t.Seconds:00}";
    }

    private static string TitleAt(List<YouTubeCaptionSegment> segments, int index)
    {
        var text = segments[index].Text;
        // A fragment of three words says little; borrow the next line when it follows straight on.
        if (text.Length < 18 && index + 1 < segments.Count && segments[index + 1].StartSeconds - segments[index].StartSeconds < 8)
            text = $"{text} {segments[index + 1].Text}";
        if (text.Length > MaxTitleChars)
        {
            var cut = text[..MaxTitleChars];
            var space = cut.LastIndexOf(' ');
            text = (space > MaxTitleChars / 2 ? cut[..space] : cut).TrimEnd(',', '.', ';', ':', '-', ' ') + "…";
        }
        return text.Length > 0 ? char.ToUpper(text[0], CultureInfo.InvariantCulture) + text[1..] : text;
    }

    /// <summary>Caption text without "[Music]"-style cues, notes, angle brackets or control characters.</summary>
    private static string CleanText(string? text)
    {
        if (string.IsNullOrWhiteSpace(text)) return string.Empty;
        var stripped = CueText().Replace(text, " ");
        var sb = new StringBuilder(stripped.Length);
        var lastSpace = false;
        foreach (var ch in stripped)
        {
            if (char.IsControl(ch) || char.IsWhiteSpace(ch) || ch is '♪' or '♫' or '<' or '>')
            {
                if (!lastSpace && sb.Length > 0) sb.Append(' ');
                lastSpace = true;
                continue;
            }
            sb.Append(ch);
            lastSpace = false;
        }
        return sb.ToString().Trim(' ', '-', '–', '"', '\'');
    }

    [GeneratedRegex(@"\[[^\]]{0,40}\]|\([^)]{0,20}(music|applause|laughter|संगीत|तालियाँ)[^)]{0,20}\)", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex CueText();

    [GeneratedRegex(@"^\[(?:(?<h>\d{1,2}):)?(?<m>\d{1,2}):(?<s>\d{2})(?:\.\d+)?\]\s*(?<text>.*)$", RegexOptions.CultureInvariant)]
    private static partial Regex StampedLine();

    [GeneratedRegex(@"(^|\n)\s*0?0:00\b", RegexOptions.CultureInvariant)]
    private static partial Regex ChapterZeroLine();
}

/// <summary>Puts what was found about a video - its chapters and music - into a suggested description.</summary>
public static class YouTubeVideoInsights
{
    /// <summary>
    /// The description with the chapter list and music credits added when it lacks them,
    /// each only if the whole still fits YouTube's 5,000-byte limit.
    /// </summary>
    public static string AddChaptersAndCredits(string description, YouTubeSeoExtras extras)
    {
        var body = description.Trim();
        if (extras.Chapters.Count >= YouTubeChapterBuilder.MinChapters && !YouTubeChapterBuilder.HasChapters(body))
            body = Fit(body, YouTubeChapterBuilder.ToDescriptionBlock(extras.Chapters));

        var missing = extras.Songs.Where(s => s.Title == YouTubeMusicDetector.UntitledCredits
                                              || !body.Contains(s.Title, StringComparison.OrdinalIgnoreCase)).ToList();
        if (missing.Count > 0 && !body.Contains("🎵 Music used", StringComparison.Ordinal))
            body = Fit(body, YouTubeMusicDetector.CreditsBlock(missing));
        return body;
    }

    /// <summary>Lines for the prompt's summary: what music to credit and where the chapters are.</summary>
    public static string PromptLines(YouTubeSeoExtras extras)
    {
        var sb = new StringBuilder();
        if (extras.Songs.Count > 0)
        {
            sb.Append("Music used (credit these in the description): ");
            sb.Append(string.Join("; ", extras.Songs.Take(YouTubeMusicDetector.MaxSongs).Select(s =>
                (s.Title == YouTubeMusicDetector.UntitledCredits ? "music" : s.Title)
                + (string.IsNullOrWhiteSpace(s.Artist) ? string.Empty : " by " + s.Artist)
                + (string.IsNullOrWhiteSpace(s.Credits) ? string.Empty : " (" + s.Credits + ")"))));
            sb.Append('\n');
        }
        if (extras.Chapters.Count > 0)
        {
            sb.Append("Chapters (from caption timing; keep these timestamps exactly): ");
            sb.Append(string.Join("; ", extras.Chapters.Select(c => $"{c.Stamp} {c.Title}")));
            sb.Append('\n');
        }
        return sb.ToString().TrimEnd();
    }

    private static string Fit(string body, string block)
    {
        if (block.Length == 0) return body;
        var combined = body.Length == 0 ? block : $"{body}\n\n{block}";
        return Encoding.UTF8.GetByteCount(combined) <= YouTubePublishValidator.MaxDescriptionBytes ? combined : body;
    }
}
