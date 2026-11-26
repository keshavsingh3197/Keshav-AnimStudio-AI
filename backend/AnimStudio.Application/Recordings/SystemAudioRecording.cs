namespace AnimStudio.Application.Recordings;

/// <summary>
/// Turns a system-audio take the browser recorded (a shared tab, window or screen, as
/// WebM/Opus or, on Safari, fragmented MP4) into an MP3 the library and timeline can use.
/// </summary>
public interface ISystemAudioEncoder
{
    /// <summary>False when ffmpeg isn't available on this server.</summary>
    bool IsAvailable { get; }

    /// <summary>Returns the take as a 48 kHz stereo MP3, with the silence at both ends trimmed.</summary>
    Task<byte[]> EncodeAsync(byte[] recording, SystemAudioContainer container, CancellationToken ct);
}

public enum SystemAudioContainer
{
    WebM,
    Mp4
}

public sealed class SystemAudioEncodingException(string message) : Exception(message);

public static class SystemAudioRecording
{
    public const int SampleRate = 48000;

    /// <summary>320 kbps: the take is music as often as speech, and it is encoded only once.</summary>
    public const string Bitrate = "320k";

    /// <summary>
    /// Only the dead air before the audio starts and after it stops is removed; nothing in
    /// between is touched, because this is someone else's finished mix, not a raw voice take.
    /// Trailing silence is trimmed by reversing, trimming the start and reversing back, since
    /// silenceremove's own end trimming also cuts quiet passages in the middle.
    /// </summary>
    public static string Filter { get; } = string.Join(',',
        "silenceremove=start_periods=1:start_threshold=-60dB",
        "areverse",
        "silenceremove=start_periods=1:start_threshold=-60dB",
        "areverse",
        $"aresample={SampleRate}");

    /// <summary>What the bytes say the take is; the declared type and file name are never trusted.</summary>
    public static SystemAudioContainer? Sniff(ReadOnlySpan<byte> head)
    {
        if (head.Length >= 4 && head[0] == 0x1A && head[1] == 0x45 && head[2] == 0xDF && head[3] == 0xA3)
            return SystemAudioContainer.WebM;
        if (head.Length >= 8 && head[4] == (byte)'f' && head[5] == (byte)'t' && head[6] == (byte)'y' && head[7] == (byte)'p')
            return SystemAudioContainer.Mp4;
        return null;
    }
}
