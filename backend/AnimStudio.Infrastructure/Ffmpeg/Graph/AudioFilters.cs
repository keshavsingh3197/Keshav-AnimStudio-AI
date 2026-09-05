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
}
