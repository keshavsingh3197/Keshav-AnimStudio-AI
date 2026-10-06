using System.Globalization;
using System.Text;
using AnimStudio.Application.LiveStreams;

namespace AnimStudio.Infrastructure.LiveStreams;

/// <summary>
/// The ffmpeg command lines for a live stream, kept free of I/O so they can be tested.
/// <para>
/// A stream runs in two stages. <b>Prepare</b> converts every playlist item, whatever it
/// started as, into a segment with identical encoding: H.264 high profile at the stream's
/// bitrate, a keyframe exactly every two seconds (scene-cut keyframes off, or the interval
/// drifts and YouTube warns), AAC stereo at 44.1 kHz. <b>Push</b> then joins the segments
/// with the concat demuxer and copies them to the ingest at playback speed (<c>-re</c>)
/// without re-encoding.
/// </para>
/// <para>
/// That split is what makes a 24/7 stream cheap - a loop costs a file read, not a
/// real-time encode - and it is what lets the owner watch exactly what will be sent before
/// anything goes out, because the prepared segments are the broadcast.
/// </para>
/// </summary>
public static class LiveStreamArguments
{
    public const int Fps = 30;
    public const string PlaylistFile = "playlist.txt";

    public sealed record Frame(int Width, int Height, int VideoKbps);

    public static Frame FrameFor(LiveStreamOrientation orientation, LiveStreamQuality quality)
    {
        var (longSide, shortSide, kbps) = quality == LiveStreamQuality.Hd1080
            ? (1920, 1080, 6000)
            : (1280, 720, 3000);

        return orientation == LiveStreamOrientation.Portrait
            ? new Frame(shortSide, longSide, kbps)
            : new Frame(longSide, shortSide, kbps);
    }

    public static string SegmentFile(int index) => $"item{index.ToString("00", CultureInfo.InvariantCulture)}.mp4";

    public static string StageFile(int index) => $"stage{index.ToString("00", CultureInfo.InvariantCulture)}.png";

    /// <summary>Converts a video into a segment, letterboxed into the frame. A silent track is added when it has none.</summary>
    public static IReadOnlyList<string> ConformVideo(
        string sourceFile, bool hasAudio, LiveStreamSettings settings, string segmentFile)
    {
        var frame = FrameFor(settings.Orientation, settings.Quality);
        var (w, h) = (Num(frame.Width), Num(frame.Height));

        var arguments = new List<string>
        {
            "-y", "-hide_banner", "-nostats", "-loglevel", "error",
            "-i", sourceFile
        };

        if (!hasAudio)
            arguments.AddRange(["-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=44100"]);

        var audioIn = hasAudio ? "[0:a:0]" : "[1:a]";
        arguments.AddRange(
        [
            "-filter_complex",
            $"[0:v:0]scale={w}:{h}:force_original_aspect_ratio=decrease,"
            + $"pad={w}:{h}:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1,fps={Fps},format=yuv420p[v];"
            // apad + -shortest: the audio always runs exactly as long as the picture, so the
            // next segment starts in sync instead of inheriting a gap or an overhang.
            + $"{audioIn}aresample=44100:async=1,aformat=channel_layouts=stereo,apad[a]",
            "-map", "[v]", "-map", "[a]", "-shortest"
        ]);

        AddSegmentOutput(arguments, frame, segmentFile);
        return arguments;
    }

    /// <summary>
    /// Draws the still part of a song's frame once: the cover blurred to fill the frame with
    /// the sharp cover on top - or, with no cover, a plain dark backdrop.
    /// </summary>
    public static IReadOnlyList<string> Stage(string? coverFile, LiveStreamSettings settings, string stageFile)
    {
        var frame = FrameFor(settings.Orientation, settings.Quality);
        var (w, h) = (frame.Width, frame.Height);

        if (coverFile is null)
        {
            return
            [
                "-y", "-hide_banner", "-loglevel", "error",
                "-f", "lavfi", "-i", $"color=c=0x111827:s={Num(w)}x{Num(h)}",
                "-vf", "vignette=PI/4",
                "-frames:v", "1", "-update", "1", stageFile
            ];
        }

        var layout = Layout(frame);
        return
        [
            "-y", "-hide_banner", "-loglevel", "error", "-i", coverFile,
            "-filter_complex",
            "[0:v]split=2[a][b];"
            + $"[a]scale={Num(w)}:{Num(h)}:force_original_aspect_ratio=increase,crop={Num(w)}:{Num(h)},"
            + "boxblur=40:2,eq=brightness=-0.2[bg];"
            + $"[b]scale={Num(layout.Art)}:{Num(layout.Art)}:force_original_aspect_ratio=increase:flags=lanczos,"
            + $"crop={Num(layout.Art)}:{Num(layout.Art)}[art];"
            + $"[bg][art]overlay=(W-w)/2:{Num(layout.ArtTop)}",
            "-frames:v", "1", "-update", "1", stageFile
        ];
    }

    /// <summary>Converts a song into a segment: the drawn stage with a waveform of the song.</summary>
    public static IReadOnlyList<string> ConformCoverAndAudio(
        string audioFile, string stageFile, LiveStreamSettings settings, string segmentFile)
    {
        var frame = FrameFor(settings.Orientation, settings.Quality);
        var layout = Layout(frame);

        var arguments = new List<string>
        {
            "-y", "-hide_banner", "-nostats", "-loglevel", "error",
            "-loop", "1", "-framerate", Num(Fps), "-i", stageFile,
            "-i", audioFile,
            "-filter_complex",
            "[1:a]aresample=44100:async=1,aformat=channel_layouts=stereo,asplit=2[a][forwave];"
            // draw=full: the default "scale" draws dense passages nearly transparent.
            + $"[forwave]aformat=channel_layouts=mono,showwaves=s={Num(layout.WaveWidth)}x{Num(layout.WaveHeight)}:"
            + $"mode=cline:draw=full:rate={Num(Fps)}:colors=white,format=rgba,colorchannelmixer=aa=0.85[wave];"
            + $"[0:v][wave]overlay=(W-w)/2:{Num(layout.WaveTop)}:shortest=1,format=yuv420p[v]",
            "-map", "[v]", "-map", "[a]",
            // The still loops forever; the song decides when the segment ends.
            "-shortest"
        };

        AddSegmentOutput(arguments, frame, segmentFile);
        return arguments;
    }

    /// <summary>
    /// Sends the prepared segments to the ingest. Nothing is encoded: the segments already
    /// match YouTube's ingest settings, so this is a copy at playback speed.
    /// </summary>
    public static IReadOnlyList<string> Push(bool loopForever, string outputUrl) =>
    [
        "-hide_banner", "-nostats", "-loglevel", "warning",
        "-re",
        // The concat demuxer's default safe mode is kept: it only accepts plain relative
        // names, which is all the playlist file ever contains.
        "-f", "concat",
        .. (loopForever ? (string[])["-stream_loop", "-1"] : []),
        "-i", PlaylistFile,
        "-map", "0:v:0", "-map", "0:a:0",
        "-c", "copy",
        "-progress", "pipe:1",
        "-flvflags", "no_duration_filesize",
        "-f", "flv", outputUrl
    ];

    /// <summary>
    /// The concat list for a push that starts at <paramref name="startItem"/>. Segment names
    /// are only ever the generated <see cref="SegmentFile"/> names, which need no quoting.
    /// <para>
    /// For a looping-forever stream the list is the playlist rotated to start there and the
    /// push loops it. For a finite stream it is written out in full - the rest of the current
    /// pass, then each remaining pass - so a reconnect plays exactly what was left.
    /// </para>
    /// </summary>
    public static string PlaylistContent(IReadOnlyList<string> segments, int startItem, int? remainingFullLoops)
    {
        var itemCount = segments.Count;
        if (itemCount == 0) throw new ArgumentException("A playlist needs at least one segment.", nameof(segments));
        startItem = Math.Clamp(startItem, 0, itemCount - 1);

        var builder = new StringBuilder();
        void Add(int index) => builder.Append("file '").Append(segments[index]).Append("'\n");

        for (var i = 0; i < itemCount; i++)
        {
            var index = (startItem + i) % itemCount;
            // A finite list stops at the end of the current pass; the full passes follow.
            if (remainingFullLoops is not null && startItem + i >= itemCount) break;
            Add(index);
        }

        for (var loop = 0; loop < (remainingFullLoops ?? 0); loop++)
            for (var i = 0; i < itemCount; i++)
                Add(i);

        return builder.ToString();
    }

    /// <summary>
    /// Where playback is after <paramref name="streamedSeconds"/> of a push that started at
    /// item <paramref name="startItem"/> of pass <paramref name="startLoop"/>: the pass
    /// (0-based) and the item.
    /// </summary>
    public static (int Loop, int Item) Position(
        IReadOnlyList<double> durations, int startLoop, int startItem, double streamedSeconds)
    {
        if (durations.Count == 0) return (startLoop, 0);

        var loop = startLoop;
        var item = Math.Clamp(startItem, 0, durations.Count - 1);
        var remaining = Math.Max(0, streamedSeconds);

        // A pass with no measurable length would never advance; treat it as instant.
        if (durations.Sum() <= 0) return (loop, item);

        while (remaining >= Math.Max(0, durations[item]))
        {
            remaining -= Math.Max(0, durations[item]);
            item++;
            if (item == durations.Count)
            {
                item = 0;
                loop++;
            }
        }

        return (loop, item);
    }

    /// <summary>
    /// Encodes what the browser records - read from stdin as it arrives - and sends it to the
    /// ingest. The browser has already drawn the picture (masks, overlays, scenes), so this
    /// only fits it to the frame and meets YouTube's ingest rules: constant 30 fps, a
    /// keyframe every two seconds, AAC stereo at 44.1 kHz. <c>zerolatency</c> keeps x264
    /// from holding frames back for look-ahead.
    /// </summary>
    public static IReadOnlyList<string> CameraPush(CameraContainer container, CameraStreamSettings settings, string preset, string outputUrl)
    {
        var frame = FrameFor(settings.Orientation, settings.Quality);
        var (w, h) = (Num(frame.Width), Num(frame.Height));
        var kbps = frame.VideoKbps;
        var gop = Num(Fps * 2);

        return
        [
            "-hide_banner", "-nostats", "-loglevel", "warning",
            // Timestamps come from the recorder; regenerate any it leaves out.
            "-fflags", "+genpts",
            "-thread_queue_size", "1024",
            "-f", container == CameraContainer.Mp4 ? "mp4" : "matroska",
            "-i", "pipe:0",
            "-filter_complex",
            $"[0:v:0]scale={w}:{h}:force_original_aspect_ratio=decrease,"
            + $"pad={w}:{h}:(ow-iw)/2:(oh-ih)/2:color=black,setsar=1,fps={Num(Fps)},format=yuv420p[v];"
            + "[0:a:0]aresample=44100:async=1,aformat=channel_layouts=stereo[a]",
            "-map", "[v]", "-map", "[a]",
            "-c:v", "libx264", "-preset", SafePreset(preset), "-tune", "zerolatency", "-profile:v", "high", "-pix_fmt", "yuv420p",
            "-b:v", $"{Num(kbps)}k", "-maxrate", $"{Num(kbps)}k", "-bufsize", $"{Num(kbps * 2)}k",
            "-g", gop, "-keyint_min", gop, "-sc_threshold", "0",
            "-c:a", "aac", "-b:a", "128k", "-ar", "44100", "-ac", "2",
            "-progress", "pipe:1",
            "-flvflags", "no_duration_filesize",
            "-f", "flv", outputUrl
        ];
    }

    private static readonly string[] Presets = ["ultrafast", "superfast", "veryfast", "faster", "fast", "medium"];

    /// <summary>Only x264's own preset names reach the command line; anything else falls back to veryfast.</summary>
    public static string SafePreset(string? preset) =>
        Presets.FirstOrDefault(p => string.Equals(p, preset, StringComparison.OrdinalIgnoreCase)) ?? "veryfast";

    public static string OutputUrl(string ingestUrl, string streamKey) =>
        ingestUrl.TrimEnd('/') + "/" + streamKey;

    private sealed record StageLayout(int Art, int ArtTop, int WaveWidth, int WaveHeight, int WaveTop);

    private static StageLayout Layout(Frame frame)
    {
        int Even(double value) => (int)Math.Round(value / 2) * 2;

        if (frame.Height > frame.Width)
        {
            // Portrait: a large cover in the upper middle, the waveform below it and clear
            // of the bottom fifth, which the Shorts player covers with its own controls.
            var art = Even(frame.Width * 0.8);
            var artTop = Even(frame.Height * 0.2);
            var waveHeight = Even(frame.Height * 0.08);
            return new StageLayout(art, artTop, Even(frame.Width * 0.9), waveHeight, artTop + art + Even(frame.Height * 0.05));
        }

        var landscapeArt = Even(frame.Height * 0.62);
        var landscapeWave = Even(frame.Height * 0.16);
        return new StageLayout(
            landscapeArt, Even(frame.Height * 0.08),
            Even(frame.Width * 0.83), landscapeWave,
            frame.Height - landscapeWave - Even(frame.Height * 0.05));
    }

    private static void AddSegmentOutput(List<string> arguments, Frame frame, string segmentFile)
    {
        var kbps = frame.VideoKbps;
        var gop = Num(Fps * 2);

        arguments.AddRange(
        [
            // "fast" rather than the "veryfast" a real-time encoder needs: preparing isn't
            // bound to playback speed, so the extra effort buys picture quality at the same bitrate.
            "-c:v", "libx264", "-preset", "fast", "-profile:v", "high", "-pix_fmt", "yuv420p",
            "-b:v", $"{Num(kbps)}k", "-maxrate", $"{Num(kbps)}k", "-bufsize", $"{Num(kbps * 2)}k",
            "-g", gop, "-keyint_min", gop, "-sc_threshold", "0",
            "-c:a", "aac", "-b:a", "128k", "-ar", "44100", "-ac", "2",
            // One timescale for every segment, so the concat demuxer joins them without rescaling.
            "-video_track_timescale", "15360",
            "-movflags", "+faststart",
            "-progress", "pipe:1",
            segmentFile
        ]);
    }

    private static string Num(int value) => value.ToString(CultureInfo.InvariantCulture);
}
