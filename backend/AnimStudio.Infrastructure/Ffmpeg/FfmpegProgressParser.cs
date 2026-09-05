using System.Globalization;
using AnimStudio.Domain.Rendering;

namespace AnimStudio.Infrastructure.Ffmpeg;

public sealed record FfmpegProgress(FrameCount FramesDone, TimeSpan OutTime, double? Speed, bool IsComplete);

/// <summary>
/// Parses ffmpeg's "-progress" key=value stream.
/// <para>
/// Reading this machine-readable stream beats scraping stderr, but it has one notorious
/// trap: <c>out_time_ms</c> is a long-standing misnomer and actually carries MICROseconds.
/// Treating it as milliseconds inflates progress by 1000x. This parser prefers
/// <c>out_time_us</c> and treats <c>out_time_ms</c> as microseconds too.
/// </para>
/// </summary>
public sealed class FfmpegProgressParser(FrameRate frameRate)
{
    private readonly Dictionary<string, string> _block = new(StringComparer.Ordinal);

    /// <summary>
    /// Feeds one stdout line. Returns a progress snapshot only when a block completes,
    /// because a partial block can carry stale or N/A values.
    /// </summary>
    public FfmpegProgress? Accept(string line)
    {
        var separator = line.IndexOf('=');
        if (separator <= 0) return null;

        var key = line[..separator].Trim();
        var value = line[(separator + 1)..].Trim();
        _block[key] = value;

        // "progress" terminates every block.
        if (!string.Equals(key, "progress", StringComparison.Ordinal)) return null;

        var isComplete = string.Equals(value, "end", StringComparison.Ordinal);
        var snapshot = Snapshot(isComplete);
        _block.Clear();
        return snapshot;
    }

    private FfmpegProgress? Snapshot(bool isComplete)
    {
        var outTime = ReadOutTime();
        var frames = ReadFrames();

        // Neither metric available yet (the first block is often all N/A).
        if (frames is null && outTime is null) return isComplete
            ? new FfmpegProgress(FrameCount.Zero, TimeSpan.Zero, null, true)
            : null;

        var resolvedTime = outTime ?? TimeSpan.Zero;
        var resolvedFrames = frames
            // Audio-only output has no "frame" key, so derive it from elapsed time.
            ?? new FrameCount((int)Math.Round(resolvedTime.TotalSeconds * frameRate.AsDouble));

        return new FfmpegProgress(resolvedFrames, resolvedTime, ReadSpeed(), isComplete);
    }

    private TimeSpan? ReadOutTime()
    {
        // Both keys carry microseconds despite the "_ms" name.
        if (TryReadLong("out_time_us", out var micros) || TryReadLong("out_time_ms", out micros))
            return TimeSpan.FromMilliseconds(micros / 1000.0);

        if (_block.TryGetValue("out_time", out var text)
            && TimeSpan.TryParse(text, CultureInfo.InvariantCulture, out var parsed))
            return parsed;

        return null;
    }

    private FrameCount? ReadFrames() =>
        TryReadLong("frame", out var frames) ? new FrameCount((int)frames) : null;

    private double? ReadSpeed()
    {
        if (!_block.TryGetValue("speed", out var text)) return null;
        var trimmed = text.TrimEnd('x', ' ');
        return double.TryParse(trimmed, NumberStyles.Float, CultureInfo.InvariantCulture, out var speed)
            ? speed
            : null;
    }

    private bool TryReadLong(string key, out long value)
    {
        value = 0;
        return _block.TryGetValue(key, out var text)
               && !string.Equals(text, "N/A", StringComparison.OrdinalIgnoreCase)
               && long.TryParse(text, NumberStyles.Integer, CultureInfo.InvariantCulture, out value);
    }
}
