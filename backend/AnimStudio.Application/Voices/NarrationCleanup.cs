namespace AnimStudio.Application.Voices;

/// <summary>
/// Cleans a narration the user recorded themselves - in a room, on a laptop microphone - so it
/// sits in a video like a studio take.
/// </summary>
public interface INarrationCleaner
{
    /// <summary>False when ffmpeg isn't available on this server.</summary>
    bool IsAvailable { get; }

    /// <summary>Returns the cleaned take as 48 kHz mono 16-bit WAV.</summary>
    Task<byte[]> CleanAsync(byte[] recording, CancellationToken ct);
}

public sealed class NarrationCleanupException(string message) : Exception(message);

public static class NarrationCleanup
{
    public const int SampleRate = 48000;

    /// <summary>
    /// The chain, in the order an engineer would work:
    /// <list type="number">
    /// <item>cut rumble below the voice (desk knocks, traffic, fan hum);</item>
    /// <item>take the steady room and fan noise down by learning its floor;</item>
    /// <item>drop the silence before the first word and after the last, keeping a breath;</item>
    /// <item>even out loud and quiet words with a gentle compressor;</item>
    /// <item>level to -16 LUFS, the spoken-word norm, with peaks held under -1.5 dBTP. The export
    ///   can still level the whole mix to YouTube's -14; this makes each take match the next.</item>
    /// </list>
    /// Trailing silence is trimmed by reversing, trimming the start, and reversing back:
    /// silenceremove's own end trimming also cuts pauses in the middle of a sentence.
    /// </summary>
    public static string Filter { get; } = string.Join(',',
        "highpass=f=80",
        "afftdn=nf=-25:tn=1",
        "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.25",
        "areverse",
        "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.35",
        "areverse",
        "acompressor=threshold=-21dB:ratio=3:attack=5:release=120:makeup=2",
        "loudnorm=I=-16:TP=-1.5:LRA=11",
        $"aresample={SampleRate}");
}
