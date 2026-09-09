using AnimStudio.Application.Rendering.Models;
using AnimStudio.Domain.Rendering;

namespace AnimStudio.Infrastructure.Ffmpeg.Graph;

/// <summary>
/// Audio chains for scenes and for the merge.
/// </summary>
internal static class AudioFilters
{
    /// <summary>Canonical sample format, so every scene's audio is concat-compatible.</summary>
    public static string Format(EncoderProfile encoder) =>
        $"aformat=sample_fmts=fltp:sample_rates={encoder.AudioSampleRate}:channel_layouts=stereo";

    /// <summary>
    /// A scene's audio, clamped to exactly the scene length.
    /// <para>
    /// This is the keystone of A/V sync. <c>atrim</c> cuts audio that runs long,
    /// <c>apad=whole_dur</c> pads audio that falls short with silence, and
    /// <c>asetpts</c> rebases timestamps to zero. The result is that audio length equals
    /// video length exactly, for every scene. Because acrossfade then consumes audio with
    /// the same arithmetic xfade uses on video, the two chains stay locked with no offset
    /// bookkeeping - and cross-scene drift becomes impossible rather than merely unlikely.
    /// </para>
    /// </summary>
    public static string SceneChain(
        FrameCount duration, FrameRate rate, EncoderProfile encoder,
        double? sliceStartSeconds, double? sliceEndSeconds)
    {
        var seconds = FilterExpr.Sec(duration, rate);
        var parts = new List<string> { Format(encoder) };

        // Slice from the ORIGINAL media clock. Padding is applied to the slice only and is
        // never written back to the source timings, so repeated re-ingests cannot creep.
        if (sliceStartSeconds.HasValue && sliceEndSeconds.HasValue)
        {
            var start = Math.Max(sliceStartSeconds.Value, 0);
            parts.Add($"atrim=start={FilterExpr.N(start)}:end={FilterExpr.N(sliceEndSeconds.Value)}");
            parts.Add("asetpts=N/SR/TB");
        }

        parts.Add($"atrim=start=0:end={seconds}");
        parts.Add("asetpts=N/SR/TB");
        parts.Add($"apad=whole_dur={seconds}");

        return string.Join(',', parts);
    }

    /// <summary>Short fades that stop clicks at scene boundaries.</summary>
    public static string SceneFades(FrameCount duration, FrameRate rate)
    {
        const double fade = 0.25;
        var total = duration.ToSeconds(rate);
        if (total <= fade * 2) return string.Empty;

        return $"afade=t=in:st=0:d={FilterExpr.N(fade)},"
             + $"afade=t=out:st={FilterExpr.N(total - fade)}:d={FilterExpr.N(fade)}";
    }

    /// <summary>
    /// Background music bed: looped, level-adjusted, trimmed to the final length and
    /// faded at both ends.
    /// </summary>
    public static string MusicBed(double volume, FrameCount totalLength, FrameRate rate,
        EncoderProfile encoder)
    {
        var seconds = totalLength.ToSeconds(rate);
        var fadeIn = Math.Min(1.5, seconds / 4);
        var fadeOut = Math.Min(2.0, seconds / 4);

        return $"{Format(encoder)},volume={FilterExpr.N(volume)},"
             + $"atrim=start=0:end={FilterExpr.N(seconds)},asetpts=N/SR/TB,"
             + $"afade=t=in:st=0:d={FilterExpr.N(fadeIn)},"
             + $"afade=t=out:st={FilterExpr.N(seconds - fadeOut)}:d={FilterExpr.N(fadeOut)}";
    }

    /// <summary>
    /// Mixes dialogue with the music bed.
    /// <para>
    /// <c>normalize=0</c> is essential: amix divides by the input count by default, which
    /// would halve the dialogue the moment music is added. Levels are set explicitly via
    /// volume instead, and a limiter catches the peaks where both land together.
    /// </para>
    /// </summary>
    public static string Mix(bool hasLimiter) =>
        "amix=inputs=2:duration=first:normalize=0" + (hasLimiter ? ",alimiter=limit=0.95" : string.Empty);

    /// <summary>
    /// Mixes dialogue with however many audio beds and timed tracks are actually present.
    /// <c>duration=first</c> means the DIALOGUE input still decides the output length, so a
    /// music clip placed near the end of a long clip cannot stretch the finished video.
    /// </summary>
    public static string Mix(int inputCount, bool hasLimiter) =>
        $"amix=inputs={FilterExpr.N(inputCount)}:duration=first:normalize=0"
        + (hasLimiter ? ",alimiter=limit=0.95" : string.Empty);

    /// <summary>
    /// One music clip placed at its own point on the timeline rather than looped under the
    /// whole thing.
    /// <para>
    /// <c>adelay</c> silences the track until its start time instead of shifting the whole
    /// stream, which is exactly "starts playing at this point" - and because the final mix
    /// runs with <c>duration=first</c>, a track that starts late or runs past the video's
    /// own length is simply cut off rather than lengthening the output.
    /// </para>
    /// </summary>
    public static string TimedTrack(
        double volume, double startSeconds, double? trimStartSeconds, double? trimEndSeconds,
        EncoderProfile encoder)
    {
        var parts = new List<string> { Format(encoder) };

        // A slice of the SOURCE file, not the timeline - "the chorus", not "the first
        // ten seconds of the finished video".
        if (trimStartSeconds.HasValue || trimEndSeconds.HasValue)
        {
            var start = Math.Max(trimStartSeconds ?? 0, 0);
            var trim = trimEndSeconds.HasValue
                ? $"atrim=start={FilterExpr.N(start)}:end={FilterExpr.N(trimEndSeconds.Value)}"
                : $"atrim=start={FilterExpr.N(start)}";
            parts.Add(trim);
            parts.Add("asetpts=N/SR/TB");
        }

        const double clickGuard = 0.15;
        parts.Add($"afade=t=in:st=0:d={FilterExpr.N(clickGuard)}");
        parts.Add($"volume={FilterExpr.N(Math.Clamp(volume, 0, 1))}");

        var delayMs = Math.Max(0, (int)Math.Round(Math.Max(startSeconds, 0) * 1000));
        if (delayMs > 0) parts.Add($"adelay={FilterExpr.N(delayMs)}:all=1");

        return string.Join(',', parts);
    }
}
