using System.Globalization;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using AnimStudio.Domain.Jobs;

namespace AnimStudio.Application.Clips;

/// <summary>The downloadable forms of an <see cref="ExportTimeline"/>.</summary>
public enum ExportTimelineFormat
{
    /// <summary>A ready-to-paste description: chapters, music credits, footage list.</summary>
    YouTube,
    /// <summary>One row per item, for a spreadsheet or an edit decision list.</summary>
    Csv,
    /// <summary>The timeline as stored, for scripts and other tools.</summary>
    Json
}

/// <summary>
/// Renders an export timeline as text. Pure, so each format is pinned by unit tests.
/// </summary>
public static class ExportTimelineFormatter
{
    /// <summary>YouTube ignores the whole chapter list unless every chapter is at least this long.</summary>
    public const double MinChapterSeconds = 10;

    /// <summary>...and unless there are at least this many of them.</summary>
    public const int MinChapters = 3;

    /// <summary>Only these are stripped, so a label such as "Scene 1.5" keeps its ".5".</summary>
    private static readonly HashSet<string> MediaExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".mp4", ".mov", ".mkv", ".webm", ".avi", ".m4v", ".mp3", ".wav", ".m4a", ".aac",
        ".ogg", ".opus", ".flac", ".png", ".jpg", ".jpeg", ".gif", ".webp"
    };

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        WriteIndented = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    public static (string Content, string ContentType, string Extension) Format(
        ExportTimeline timeline, ExportTimelineFormat format, string? title) => format switch
        {
            ExportTimelineFormat.Csv => (ToCsv(timeline), "text/csv", "csv"),
            ExportTimelineFormat.Json => (JsonSerializer.Serialize(timeline, JsonOptions), "application/json", "json"),
            _ => (ToYouTubeDescription(timeline, title), "text/plain", "txt")
        };

    /// <summary>
    /// A description draft. Chapters follow YouTube's rules - first at 0:00, each at
    /// least ten seconds, at least three - by folding a too-short clip into the chapter
    /// before it rather than emitting a list YouTube would silently reject.
    /// </summary>
    public static string ToYouTubeDescription(ExportTimeline timeline, string? title)
    {
        ArgumentNullException.ThrowIfNull(timeline);

        var total = timeline.DurationSeconds;
        var useHours = total >= 3600;
        var sb = new StringBuilder();

        if (!string.IsNullOrWhiteSpace(title)) sb.Append(title.Trim()).Append("\n\n");

        var chapters = Chapters(timeline);
        if (chapters.Count >= MinChapters)
        {
            sb.Append("Chapters\n");
            foreach (var (start, label) in chapters)
                sb.Append(Stamp(start, useHours)).Append(' ').Append(label).Append('\n');
            sb.Append('\n');
        }

        AppendCredits(sb, "Music", timeline.Entries
            .Where(e => e.Kind is ExportTimelineKinds.MusicBed or ExportTimelineKinds.Music), useHours);

        AppendCredits(sb, "Sound", timeline.Entries
            .Where(e => e.Kind is ExportTimelineKinds.Audio or ExportTimelineKinds.ClipSound), useHours);

        var footage = timeline.Entries
            .Where(e => e.Kind is ExportTimelineKinds.Clip or ExportTimelineKinds.Image
                        or ExportTimelineKinds.Overlay)
            .ToList();
        if (footage.Count > 0)
        {
            sb.Append("Footage\n");
            foreach (var e in footage)
            {
                sb.Append(Stamp(e.StartSeconds, useHours)).Append('–').Append(Stamp(e.EndSeconds, useHours))
                  .Append(' ').Append(Clean(e.Label));
                AppendCredit(sb, e);
                sb.Append('\n');
            }
        }

        return sb.ToString().TrimEnd() + "\n";
    }

    /// <summary>
    /// What a YouTube description needs from the render, for viewers rather than editors:
    /// the chapter list (when YouTube would accept it), the music, and sound and footage
    /// credits. Sound and footage without a credit or source are left out - their file
    /// names and timestamps mean nothing to a viewer. Empty when there is nothing to say.
    /// </summary>
    public static string ToPublishingDetails(ExportTimeline timeline)
    {
        ArgumentNullException.ThrowIfNull(timeline);

        var useHours = timeline.DurationSeconds >= 3600;
        var sb = new StringBuilder();

        var chapters = Chapters(timeline);
        if (chapters.Count >= MinChapters)
        {
            sb.Append("Chapters\n");
            foreach (var (start, label) in chapters)
                sb.Append(Stamp(start, useHours)).Append(' ').Append(label).Append('\n');
            sb.Append('\n');
        }

        AppendCredits(sb, "Music", timeline.Entries
            .Where(e => e.Kind is ExportTimelineKinds.MusicBed or ExportTimelineKinds.Music), useHours);

        AppendCredits(sb, "Sound", timeline.Entries
            .Where(e => e.Kind is ExportTimelineKinds.Audio or ExportTimelineKinds.ClipSound), useHours, creditsOnly: true);

        AppendCredits(sb, "Footage", timeline.Entries
            .Where(e => e.Kind is ExportTimelineKinds.Clip or ExportTimelineKinds.Image or ExportTimelineKinds.Overlay), useHours, creditsOnly: true);

        var text = sb.ToString().TrimEnd();
        return text.Length == 0 ? string.Empty : text + "\n";
    }

    /// <summary>The readable names of the clips and pictures, in order, each once - what the video shows.</summary>
    public static List<string> ClipLabels(ExportTimeline timeline) =>
    [
        .. timeline.Entries
            .Where(e => e.Kind is ExportTimelineKinds.Clip or ExportTimelineKinds.Image)
            .OrderBy(e => e.StartSeconds)
            .Select(e => Clean(e.Label))
            .Where(l => l.Length > 0)
            .Distinct(StringComparer.OrdinalIgnoreCase)
    ];

    /// <summary>
    /// One chapter per clip. A clip gets its own chapter only when it is itself at least
    /// ten seconds long AND starts ten seconds after the previous chapter; otherwise it is
    /// folded into the chapter before it, so a chapter never carries the name of a short
    /// clip that is mostly some other clip's footage.
    /// </summary>
    public static List<(double Start, string Label)> Chapters(ExportTimeline timeline)
    {
        var clips = timeline.Entries
            .Where(e => e.Kind is ExportTimelineKinds.Clip or ExportTimelineKinds.Image)
            .OrderBy(e => e.StartSeconds)
            .ToList();

        var chapters = new List<(double Start, string Label)>();
        for (var i = 0; i < clips.Count; i++)
        {
            // The first chapter must read 0:00, wherever the first clip says it starts.
            if (chapters.Count == 0)
            {
                chapters.Add((0, Clean(clips[i].Label)));
                continue;
            }

            var start = Math.Floor(clips[i].StartSeconds);
            var next = i + 1 < clips.Count ? clips[i + 1].StartSeconds : timeline.DurationSeconds;

            if (start - chapters[^1].Start >= MinChapterSeconds && next - start >= MinChapterSeconds)
                chapters.Add((start, Clean(clips[i].Label)));
        }

        if (chapters.Count > 1 && timeline.DurationSeconds - chapters[^1].Start < MinChapterSeconds)
            chapters.RemoveAt(chapters.Count - 1);

        return chapters;
    }

    public static string ToCsv(ExportTimeline timeline)
    {
        ArgumentNullException.ThrowIfNull(timeline);

        var sb = new StringBuilder();
        sb.Append("kind,track,clip,label,start,end,duration,start_seconds,end_seconds,source_in,source_out,transition,credit,source_url,asset_id\r\n");

        foreach (var e in timeline.Entries)
        {
            string[] cells =
            [
                e.Kind, e.Track, e.ClipNumber?.ToString(CultureInfo.InvariantCulture) ?? "",
                e.Label, Timecode(e.StartSeconds), Timecode(e.EndSeconds),
                Timecode(e.EndSeconds - e.StartSeconds),
                Num(e.StartSeconds), Num(e.EndSeconds),
                e.SourceInSeconds is { } si ? Num(si) : "", e.SourceOutSeconds is { } so ? Num(so) : "",
                e.Transition ?? "", e.Credit ?? "", e.SourceUrl ?? "", e.AssetId ?? ""
            ];
            sb.Append(string.Join(',', cells.Select(CsvCell))).Append("\r\n");
        }

        return sb.ToString();
    }

    /// <summary>
    /// Quoted always, with a leading formula character neutralised. Labels are user text,
    /// and a spreadsheet would otherwise EXECUTE a label like <c>=HYPERLINK(...)</c>.
    /// </summary>
    private static string CsvCell(string value)
    {
        if (value.Length > 0 && value[0] is '=' or '+' or '-' or '@' or '\t' or '\r')
            value = "'" + value;
        return "\"" + value.Replace("\"", "\"\"") + "\"";
    }

    private static void AppendCredits(
        StringBuilder sb, string heading, IEnumerable<ExportTimelineEntry> entries, bool useHours, bool creditsOnly = false)
    {
        var list = entries
            .Where(e => !creditsOnly || !string.IsNullOrWhiteSpace(e.Credit) || !string.IsNullOrWhiteSpace(e.SourceUrl))
            .ToList();
        if (list.Count == 0) return;

        sb.Append(heading).Append('\n');
        foreach (var e in list)
        {
            sb.Append(Stamp(e.StartSeconds, useHours)).Append('–').Append(Stamp(e.EndSeconds, useHours))
              .Append(' ').Append(Clean(e.Label));
            AppendCredit(sb, e);
            sb.Append('\n');
        }
        sb.Append('\n');
    }

    private static void AppendCredit(StringBuilder sb, ExportTimelineEntry e)
    {
        if (!string.IsNullOrWhiteSpace(e.Credit)) sb.Append(" — ").Append(Clean(e.Credit));
        if (!string.IsNullOrWhiteSpace(e.SourceUrl)) sb.Append(" (").Append(e.SourceUrl.Trim()).Append(')');
    }

    /// <summary>
    /// A label on one line, without the file extension an uploaded name usually carries.
    /// YouTube's description box keeps angle brackets out, so they are dropped too.
    /// A file-style name is made readable: "59_CLIP_059_Golden_Arrow_1080p_20260922195933"
    /// reads "Golden Arrow". A label that is already prose, like "Scene 1.5", is kept.
    /// </summary>
    private static string Clean(string label)
    {
        var oneLine = string.Join(' ', label.Split(['\r', '\n', '\t'], StringSplitOptions.RemoveEmptyEntries)).Trim();
        var ext = Path.GetExtension(oneLine);
        if (MediaExtensions.Contains(ext)) oneLine = oneLine[..^ext.Length];
        oneLine = oneLine.Replace("<", "").Replace(">", "");
        return LooksLikeFileName(oneLine) ? Humanize(oneLine) : oneLine;
    }

    /// <summary>Underscores between words and no spaces: a name a camera or a generator made up.</summary>
    private static bool LooksLikeFileName(string label) =>
        label.Contains('_') && !label.Contains(' ');

    private static string Humanize(string label)
    {
        var words = label.Replace('_', ' ').Split(' ', StringSplitOptions.RemoveEmptyEntries).ToList();

        // Leading numbering and generic prefixes: "59", "CLIP", "059", "IMG", "VID_0012"...
        while (words.Count > 0 && IsNumberingWord(words[0])) words.RemoveAt(0);

        // Technical tags anywhere: resolutions, frame rates, long date/time stamps.
        words.RemoveAll(IsTechnicalWord);

        var readable = string.Join(' ', words).Trim();
        return readable.Length > 0 ? readable : label.Replace('_', ' ').Trim();
    }

    private static readonly HashSet<string> NumberingPrefixes = new(StringComparer.OrdinalIgnoreCase)
    {
        "clip", "img", "image", "vid", "video", "mov", "dsc", "pxl", "scene", "shot", "part", "take"
    };

    private static bool IsNumberingWord(string word)
    {
        if (word.All(char.IsAsciiDigit)) return true;
        var letters = word.TrimEnd("0123456789".ToCharArray()).TrimEnd('-');
        return NumberingPrefixes.Contains(letters);
    }

    private static bool IsTechnicalWord(string word)
    {
        var w = word.ToLowerInvariant();
        if (w.Length >= 6 && w.All(char.IsAsciiDigit)) return true;                  // 20260922195933
        if (w is "4k" or "8k" or "hd" or "fhd" or "uhd" or "hdr" or "final") return true;
        if (w.Length is >= 4 and <= 5 && w[^1] == 'p' && w[..^1].All(char.IsAsciiDigit)) return true;   // 1080p
        if (w.EndsWith("fps", StringComparison.Ordinal) && w[..^3].All(char.IsAsciiDigit) && w.Length > 3) return true;
        return false;
    }

    /// <summary>m:ss, or h:mm:ss on a video an hour or longer - the forms YouTube links.</summary>
    private static string Stamp(double seconds, bool useHours)
    {
        var t = TimeSpan.FromSeconds(Math.Max(0, Math.Floor(seconds)));
        return useHours
            ? $"{(int)t.TotalHours}:{t.Minutes:00}:{t.Seconds:00}"
            : $"{(int)t.TotalMinutes}:{t.Seconds:00}";
    }

    private static string Timecode(double seconds)
    {
        var t = TimeSpan.FromSeconds(Math.Max(0, seconds));
        return $"{(int)t.TotalHours:00}:{t.Minutes:00}:{t.Seconds:00}.{t.Milliseconds:000}";
    }

    private static string Num(double value) => value.ToString("0.###", CultureInfo.InvariantCulture);
}
