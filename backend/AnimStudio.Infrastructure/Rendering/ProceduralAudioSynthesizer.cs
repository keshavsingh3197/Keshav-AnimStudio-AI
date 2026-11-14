using System.Buffers.Binary;
using AnimStudio.Application.Rendering;

namespace AnimStudio.Infrastructure.Rendering;

/// <summary>
/// Pure managed C# stereo 16-bit PCM WAV synthesizer generating soothing harmonic ambient beds
/// tailored to each <see cref="ProceduralSceneTheme"/> with subtle beat chimes and smooth fades.
/// </summary>
public static class ProceduralAudioSynthesizer
{
    public const int SampleRate = 22050;
    private const short Channels = 2;
    private const short BitsPerSample = 16;

    public static async Task WriteAmbientWavAsync(
        string outputPath,
        ProceduralSceneTheme theme,
        int durationSeconds,
        CancellationToken ct)
    {
        var dur = Math.Max(1, durationSeconds);
        var totalSamples = SampleRate * dur;
        var dataBytes = totalSamples * Channels * (BitsPerSample / 8);

        var (rootHz, fifthHz, octaveHz, beatPulseHz) = theme switch
        {
            ProceduralSceneTheme.VedicTempleSunrise3D => (130.81, 196.00, 261.63, 0.35), // Warm C3-G3-C4 Tanpura resonance
            ProceduralSceneTheme.CosmosSacred3D => (108.00, 162.00, 216.00, 0.25),       // Deep 432Hz-harmonic Om pad
            ProceduralSceneTheme.HistoryChronicle3D => (146.83, 220.00, 293.66, 0.50),   // D3-A3-D4 noble chronicle fifth
            ProceduralSceneTheme.NeonCyberGrid3D => (110.00, 164.81, 220.00, 1.25),      // A2 synthwave pulse
            ProceduralSceneTheme.SereneNatureGlow => (174.61, 261.63, 349.23, 0.22),     // Warm serene F3-C4-F4 pad
            _ => (130.81, 196.00, 261.63, 0.35)
        };

        var pcm = new byte[44 + dataBytes];
        WriteWavHeader(pcm.AsSpan(0, 44), dataBytes);

        var fadeSamples = (int)(SampleRate * 0.85);
        for (var i = 0; i < totalSamples; i++)
        {
            var t = (double)i / SampleRate;
            var env = 1.0;
            if (i < fadeSamples) env = (double)i / fadeSamples;
            else if (i > totalSamples - fadeSamples) env = (double)(totalSamples - i) / fadeSamples;

            var breath = 0.72 + 0.28 * Math.Sin(2.0 * Math.PI * beatPulseHz * t);
            var drone =
                0.42 * Math.Sin(2.0 * Math.PI * rootHz * t) +
                0.28 * Math.Sin(2.0 * Math.PI * fifthHz * t + 0.4) +
                0.18 * Math.Sin(2.0 * Math.PI * octaveHz * t + 0.8) +
                0.08 * Math.Sin(2.0 * Math.PI * (octaveHz * 1.5) * t);

            // Soft chime accent every 4 seconds
            var chimeMod = t % 4.0;
            var chime = Math.Exp(-chimeMod * 3.2) * 0.22 * Math.Sin(2.0 * Math.PI * (octaveHz * 2.0) * t);

            var stereoDiff = 0.04 * Math.Sin(2.0 * Math.PI * 0.4 * t);
            var left = Math.Clamp((drone * breath + chime + stereoDiff) * env * 0.36, -0.95, 0.95);
            var right = Math.Clamp((drone * breath + chime - stereoDiff) * env * 0.36, -0.95, 0.95);

            var offset = 44 + i * 4;
            BinaryPrimitives.WriteInt16LittleEndian(pcm.AsSpan(offset, 2), (short)(left * short.MaxValue));
            BinaryPrimitives.WriteInt16LittleEndian(pcm.AsSpan(offset + 2, 2), (short)(right * short.MaxValue));
        }

        await File.WriteAllBytesAsync(outputPath, pcm, ct).ConfigureAwait(false);
    }

    private static void WriteWavHeader(Span<byte> header, int dataBytes)
    {
        "RIFF"u8.CopyTo(header);
        BinaryPrimitives.WriteInt32LittleEndian(header[4..8], 36 + dataBytes);
        "WAVE"u8.CopyTo(header[8..12]);
        "fmt "u8.CopyTo(header[12..16]);
        BinaryPrimitives.WriteInt32LittleEndian(header[16..20], 16);
        BinaryPrimitives.WriteInt16LittleEndian(header[20..22], 1); // PCM
        BinaryPrimitives.WriteInt16LittleEndian(header[22..24], Channels);
        BinaryPrimitives.WriteInt32LittleEndian(header[24..28], SampleRate);
        BinaryPrimitives.WriteInt32LittleEndian(header[28..32], SampleRate * Channels * (BitsPerSample / 8));
        BinaryPrimitives.WriteInt16LittleEndian(header[32..34], Channels * (BitsPerSample / 8));
        BinaryPrimitives.WriteInt16LittleEndian(header[34..36], BitsPerSample);
        "data"u8.CopyTo(header[36..40]);
        BinaryPrimitives.WriteInt32LittleEndian(header[40..44], dataBytes);
    }
}
