using AnimStudio.Domain.Assets;
using AnimStudio.Domain.Jobs;
using AnimStudio.Domain.Rendering;

namespace AnimStudio.Application.Clips;

/// <summary>How an auto short puts the user's lines on screen.</summary>
public enum AutoShortTextMode
{
    /// <summary>No words; the footage and pictures carry it.</summary>
    None = 0,

    /// <summary>One line held at the top for the whole short - the hook a Short opens on.</summary>
    Hook = 1,

    /// <summary>A different line under every shot.</summary>
    PerShot = 2,

    /// <summary>A hook at the top and a line under every shot.</summary>
    HookAndPerShot = 3
}

/// <summary>The pace and finish every short in a batch is cut to.</summary>
public enum AutoShortStyle
{
    /// <summary>Each short picks one of the styles below, so a batch does not look like one template.</summary>
    Mixed = 0,
    Energetic = 1,
    Cinematic = 2,
    Calm = 3
}

/// <summary>One library file the planner may cut from.</summary>
public sealed record AutoShortSource(string AssetId, AssetKind Kind, double? DurationSeconds);

/// <summary>Everything a batch is made from, already validated and resolved to assets.</summary>
public sealed record AutoShortBatch
{
    public required IReadOnlyList<AutoShortSource> Sources { get; init; }
    public IReadOnlyList<string> Lines { get; init; } = [];
    public IReadOnlyList<string> MusicAssetIds { get; init; } = [];

    public int Count { get; init; } = 3;
    public double TargetSeconds { get; init; } = 30;
    public AutoShortStyle Style { get; init; } = AutoShortStyle.Mixed;
    public AutoShortTextMode TextMode { get; init; } = AutoShortTextMode.Hook;

    /// <summary>Crossfades, slides and wipes between shots. Off cuts hard (and is what a renderer without xfade gets).</summary>
    public bool Transitions { get; init; } = true;

    /// <summary>Camera moves and grades on pictures.</summary>
    public bool Motion { get; init; } = true;

    /// <summary>Keep the footage's own sound under the music.</summary>
    public bool KeepClipAudio { get; init; } = true;

    public string ExportName { get; init; } = "Auto short";
    public int Width { get; init; } = 1080;
    public int Height { get; init; } = 1920;
    public ClipFit Fit { get; init; } = ClipFit.BlurredBackdrop;
    public ExportQuality Quality { get; init; } = ExportQuality.High;
    public WatermarkSettings Watermark { get; init; } = new();
    public bool IncludeOutro { get; init; }

    /// <summary>Same seed, same batch - so a result can be reproduced. Null draws a fresh one.</summary>
    public int? Seed { get; init; }
}

/// <summary>
/// Cuts several different shorts out of one pool of clips, pictures and lines, each one
/// landing exactly on the asked length.
/// <para>
/// Pure: no I/O, no clock, all chance from one seeded <see cref="Random"/>. Every short it
/// plans is an ordinary <see cref="ClipMergeCommand"/> - positional V1 items carrying a
/// trim window (footage) or a camera move (pictures), text on TXT1 - so the renderer needs
/// nothing new, and each short can be queued, polled, downloaded and published like any
/// other export.
/// </para>
/// <para>
/// Variety comes from a deck rather than from independent draws: the pool is shuffled and
/// dealt out across the whole batch, and only reshuffled once it runs out, so five shorts
/// from twenty clips use all twenty before any clip shows up twice. Each footage clip also
/// gets a different window per use, so even a reused clip shows different moments.
/// </para>
/// </summary>
public static class AutoShortPlanner
{
    public const int MaxCount = 20;
    public const double MinTargetSeconds = 5;
    public const double MaxTargetSeconds = 180;
    public const int MaxSources = 200;
    public const int MaxLines = 100;
    public const int MaxLineLength = 140;
    public const int MaxMusic = 20;

    /// <summary>Shortest shot. Under a second a cut reads as a glitch, not an edit.</summary>
    public const double MinShotSeconds = 1.0;

    /// <summary>Footage shorter than this cannot fill a shot and is left out.</summary>
    private const double MinUsableClipSeconds = 1.0;

    private sealed record Pace(
        double ShotMin, double ShotMax,
        SceneTransition[] Transitions, double TransitionMin, double TransitionMax,
        string[] Motions, double IntensityMin, double IntensityMax, string Easing,
        string[] Looks, bool Vignette);

    private static readonly Pace Energetic = new(
        1.6, 3.2,
        [SceneTransition.SlideLeft, SceneTransition.SlideRight, SceneTransition.WipeLeft, SceneTransition.WipeRight, SceneTransition.Fade],
        0.25, 0.45,
        ["zoom-in", "zoom-out", "pan-left", "pan-right", "handheld"], 0.18, 0.28, "linear",
        ["vivid", "none"], false);

    private static readonly Pace Cinematic = new(
        3.0, 5.0,
        [SceneTransition.Dissolve, SceneTransition.Fade, SceneTransition.CircleOpen],
        0.6, 1.0,
        ["drift", "zoom-in", "pan-left", "pan-right", "zoom-out"], 0.10, 0.18, "ease",
        ["cinematic", "warm", "cool"], true);

    private static readonly Pace Calm = new(
        4.0, 6.5,
        [SceneTransition.Fade, SceneTransition.Dissolve],
        0.8, 1.4,
        ["breathe", "zoom-in", "drift"], 0.06, 0.12, "ease",
        ["warm", "matte", "none"], true);

    private static Pace PaceFor(AutoShortStyle style, Random random) => style switch
    {
        AutoShortStyle.Energetic => Energetic,
        AutoShortStyle.Cinematic => Cinematic,
        AutoShortStyle.Calm => Calm,
        _ => Pick(random, [Energetic, Cinematic, Calm])
    };

    /// <summary>
    /// Plans the batch. Throws <see cref="ArgumentException"/> when there is nothing usable
    /// to cut from - the caller turns that into a refusal before anything is queued.
    /// </summary>
    public static IReadOnlyList<ClipMergeCommand> Plan(AutoShortBatch batch)
    {
        ArgumentNullException.ThrowIfNull(batch);

        var usable = batch.Sources
            .Where(s => s.Kind == AssetKind.Image
                        || (s.Kind == AssetKind.Video && s.DurationSeconds is >= MinUsableClipSeconds))
            .ToList();
        if (usable.Count == 0)
            throw new ArgumentException("None of the chosen files can be cut into a short.", nameof(batch));

        var count = Math.Clamp(batch.Count, 1, MaxCount);
        var target = Math.Clamp(double.IsFinite(batch.TargetSeconds) ? batch.TargetSeconds : 30, MinTargetSeconds, MaxTargetSeconds);
        var random = batch.Seed is { } seed ? new Random(seed) : new Random();

        var sourceDeck = new Deck<AutoShortSource>(usable, random);
        var lines = batch.Lines.Select(CleanLine).Where(l => l.Length > 0).Distinct(StringComparer.Ordinal).ToList();
        var lineDeck = lines.Count > 0 ? new Deck<string>(lines, random) : null;
        var musicDeck = batch.MusicAssetIds.Count > 0 ? new Deck<string>(batch.MusicAssetIds, random) : null;

        var name = string.IsNullOrWhiteSpace(batch.ExportName) ? "Auto short" : batch.ExportName.Trim();
        if (name.Length > 180) name = name[..180];

        return
        [
            .. Enumerable.Range(0, count).Select(k => PlanOne(
                batch, PaceFor(batch.Style, random), target, random, sourceDeck, lineDeck, musicDeck,
                count == 1 ? name : $"{name} #{k + 1}"))
        ];
    }

    private static ClipMergeCommand PlanOne(
        AutoShortBatch batch, Pace pace, double target, Random random,
        Deck<AutoShortSource> sources, Deck<string>? lines, Deck<string>? music, string exportName)
    {
        var lengths = new Queue<double>(ShotLengths(target, pace.ShotMin, pace.ShotMax, random));
        var shots = new List<AutoShortSource>();
        var items = new List<TimelineItemSpec>();
        var junctions = new List<ClipJunctionOverride>();
        var look = batch.Motion ? Pick(random, pace.Looks) : null;

        // A clip shorter than its shot plays whole and hands the rest on; whatever is still
        // owed after the planned shots becomes extra shots, so the short lands on its length.
        var at = 0.0;
        var owed = 0.0;
        var guard = 0;
        while ((lengths.Count > 0 || owed >= 0.05) && guard++ < 400 && shots.Count < ClipMergeSpec.MaxClips)
        {
            var len = lengths.Count > 0 ? lengths.Dequeue() + owed : Math.Max(MinShotSeconds, owed);
            owed = 0;
            var shot = sources.Next();
            var k = items.Count;

            var item = new TimelineItemSpec
            {
                Id = $"auto_{k}",
                TrackId = "V1",
                StartTime = Round(at),
                Duration = Round(len),
                Src = shot.AssetId,
            };

            if (shot.Kind == AssetKind.Video)
            {
                // A window of the clip, placed at random, so a clip used twice shows two
                // different moments.
                var clipLen = shot.DurationSeconds!.Value;
                var window = Math.Min(len, clipLen);
                var start = clipLen - window > 0.05 ? random.NextDouble() * (clipLen - window) : 0;
                item.Type = "video";
                item.Duration = Round(window);
                item.TrimStartSeconds = Round(start);
                item.TrimEndSeconds = Round(Math.Min(clipLen, start + window));
                owed = Math.Max(0, len - window);
            }
            else
            {
                item.Type = "image";
                item.Transform = new TimelineItemTransformSpec
                {
                    Motion = batch.Motion ? Pick(random, pace.Motions) : "none",
                    MotionIntensity = Round(Between(random, pace.IntensityMin, pace.IntensityMax)),
                    MotionEasing = pace.Easing,
                    FocusX = Round(Between(random, 35, 65)),
                    FocusY = Round(Between(random, 30, 60)),
                    Look = look is null or "none" ? null : look,
                    Vignette = batch.Motion && pace.Vignette,
                };
            }

            shots.Add(shot);
            items.Add(item);
            at += item.Duration;
        }

        for (var k = 0; k + 1 < shots.Count; k++)
        {
            if (!batch.Transitions)
            {
                junctions.Add(new ClipJunctionOverride(SceneTransition.None, 0));
                continue;
            }

            // Never longer than half the shorter neighbour, or the dissolve eats the shot.
            var room = Math.Min(items[k].Duration, items[k + 1].Duration) / 2;
            var secs = Round(Math.Min(room, Between(random, pace.TransitionMin, pace.TransitionMax)));
            var kind = secs >= 0.2 ? Pick(random, pace.Transitions) : SceneTransition.None;
            secs = kind == SceneTransition.None ? 0 : secs;

            // Split the overlap evenly. Footage borrows real frames past its trim when it
            // has them; a picture, or a clip with none to spare, is frozen by the server.
            junctions.Add(new ClipJunctionOverride(kind, secs, secs / 2, secs / 2));
        }

        var total = Round(at);
        items.AddRange([.. TextItems(batch.TextMode, lines, [.. items], junctions, total)]);

        var musicId = music?.Next();
        return new ClipMergeCommand
        {
            ExportName = exportName,
            AssetIds = [.. shots.Select(s => s.AssetId)],
            Fit = batch.Fit,
            OutputWidth = batch.Width,
            OutputHeight = batch.Height,
            Quality = batch.Quality,
            Transition = SceneTransition.None,
            TransitionSeconds = 0,
            Junctions = junctions,
            // Only muted when there is music to replace it - a silent short is never the intent.
            MuteClipAudio = !batch.KeepClipAudio && musicId is not null,
            BackgroundMusicAssetId = musicId,
            BackgroundMusicVolume = batch.KeepClipAudio ? 0.22 : 0.8,
            Watermark = batch.Watermark,
            IncludeOutro = batch.IncludeOutro,
            YouTubeLoudness = true,
            TimelineItems = items,
        };
    }

    /// <summary>
    /// Shot lengths that add up to exactly <paramref name="target"/>: random lengths in the
    /// pace's range, then the last one stretched or folded into its neighbour so the sum
    /// lands on the target without leaving a sub-second sliver.
    /// </summary>
    public static List<double> ShotLengths(double target, double shotMin, double shotMax, Random random)
    {
        ArgumentNullException.ThrowIfNull(random);
        var lengths = new List<double>();
        var left = target;
        while (left > 0.001)
        {
            var len = Round(Between(random, shotMin, shotMax));
            if (left - len < MinShotSeconds)
            {
                // What is left would be a sliver: this shot takes all of it, or - when that
                // would make it longer than the pace allows - the two split it evenly.
                if (left <= shotMax || lengths.Count == 0) { lengths.Add(Round(left)); break; }
                var half = Round(left / 2);
                lengths.Add(half);
                lengths.Add(Round(left - half));
                break;
            }
            lengths.Add(len);
            left = Round(left - len);
        }
        return lengths;
    }

    private static IEnumerable<TimelineItemSpec> TextItems(
        AutoShortTextMode mode, Deck<string>? lines, List<TimelineItemSpec> shots,
        List<ClipJunctionOverride> junctions, double total)
    {
        if (lines is null || mode == AutoShortTextMode.None) yield break;

        if (mode is AutoShortTextMode.Hook or AutoShortTextMode.HookAndPerShot)
        {
            yield return new TimelineItemSpec
            {
                Id = "auto_hook",
                Type = "text",
                TrackId = "TXT1",
                StartTime = 0,
                Duration = total,
                Src = lines.Next(),
                Name = "Hook",
                TextStyle = new TimelineItemTextStyleSpec
                {
                    FontSize = 30, Color = "#ffffff", Position = "top",
                    BoxStyle = "box", BoxColor = "#000000", BoxOpacity = 0.55,
                    OutlineColor = "#000000", OutlineWidth = 1.5, Shadow = true, Uppercase = true,
                    TransitionIn = "slide-up", TransitionInDuration = 0.4, TransitionOut = "fade", TransitionOutDuration = 0.4,
                },
            };
        }

        if (mode is not (AutoShortTextMode.PerShot or AutoShortTextMode.HookAndPerShot)) yield break;

        for (var k = 0; k < shots.Count; k++)
        {
            // Clear of the transitions either side, so a line never straddles a cut.
            var padIn = k > 0 ? junctions[k - 1].TransitionSeconds / 2 : 0;
            var padOut = k < junctions.Count ? junctions[k].TransitionSeconds / 2 : 0;
            var duration = shots[k].Duration - padIn - padOut;
            if (duration < 0.8) continue;

            yield return new TimelineItemSpec
            {
                Id = $"auto_caption_{k}",
                Type = "text",
                TrackId = "TXT1",
                StartTime = Round(shots[k].StartTime + padIn),
                Duration = Round(duration),
                Src = lines.Next(),
                Name = "Caption",
                TextStyle = new TimelineItemTextStyleSpec
                {
                    FontSize = 24, Color = "#ffffff", Position = "custom", X = 50, Y = 74,
                    BoxStyle = "none", OutlineColor = "#000000", OutlineWidth = 2, Shadow = true,
                    TransitionIn = "typewriter", TransitionInDuration = 0.6, TransitionOut = "fade", TransitionOutDuration = 0.3,
                },
            };
        }
    }

    /// <summary>One line, single-spaced, with control characters dropped and the length capped.</summary>
    public static string CleanLine(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return string.Empty;
        var chars = raw.Where(c => !char.IsControl(c) || c == ' ').ToArray();
        var line = string.Join(' ', new string(chars).Split(' ', StringSplitOptions.RemoveEmptyEntries));
        return line.Length > MaxLineLength ? line[..MaxLineLength].TrimEnd() : line;
    }

    private static double Between(Random random, double min, double max) => min + random.NextDouble() * (max - min);

    private static T Pick<T>(Random random, IReadOnlyList<T> options) => options[random.Next(options.Count)];

    private static double Round(double v) => Math.Round(v, 2, MidpointRounding.AwayFromZero);

    /// <summary>
    /// Deals items in a shuffled order and reshuffles only when it runs dry, never dealing
    /// the same item twice in a row across the reshuffle when there is a choice.
    /// </summary>
    private sealed class Deck<T>(IReadOnlyList<T> items, Random random)
    {
        private readonly List<T> pile = [];
        private T? last;
        private bool hasLast;

        public T Next()
        {
            if (pile.Count == 0)
            {
                pile.AddRange(items);
                for (var i = pile.Count - 1; i > 0; i--)
                {
                    var j = random.Next(i + 1);
                    (pile[i], pile[j]) = (pile[j], pile[i]);
                }
                if (hasLast && pile.Count > 1 && EqualityComparer<T>.Default.Equals(pile[^1], last))
                    (pile[0], pile[^1]) = (pile[^1], pile[0]);
            }

            var next = pile[^1];
            pile.RemoveAt(pile.Count - 1);
            last = next;
            hasLast = true;
            return next;
        }
    }
}
