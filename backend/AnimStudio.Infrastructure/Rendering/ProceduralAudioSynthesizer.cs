using System.Buffers.Binary;
using AnimStudio.Application.Ai;
using AnimStudio.Application.Rendering;

namespace AnimStudio.Infrastructure.Rendering;

/// <summary>
/// Pure managed DSP stereo WAV generator and speech-envelope analyzer.
/// <para>
/// Synthesizes warm, multi-bar low-pass filtered musical pads and subtle plucked/arpeggio
/// harmonics with calibrated -23 dBFS loudness (replacing harsh static sine drones), plus
/// extracts frame-accurate lip-sync RMS energy envelopes directly from spoken WAV tracks.
/// </para>
/// </summary>
public static class ProceduralAudioSynthesizer
{
    private const int SampleRate = 48_000;
    private const int Channels = 2;

    private readonly record struct ChordProgression(
        double[] BaseRootsHz,
        double[] Intervals,
        double ArpRateHz,
        double FilterCutoffHz,
        double BreezeLevel);

    public static async Task WriteAmbientWavAsync(
        string outputPath,
        ProceduralSceneTheme theme,
        int durationSeconds,
        CancellationToken ct)
    {
        var totalSamples = Math.Max(SampleRate, durationSeconds * SampleRate);
        var resolved = theme == ProceduralSceneTheme.Auto ? ProceduralSceneTheme.VedicTempleSunrise3D : theme;
        var progression = ProgressionFor(resolved);

        var pcmBytes = new byte[totalSamples * Channels * sizeof(short)];
        var span = pcmBytes.AsSpan();

        // Low-pass filter state per channel (removes harsh upper partials for velvet warmth)
        var alpha = (float)Math.Clamp(
            2.0 * Math.PI * progression.FilterCutoffHz / (SampleRate + 2.0 * Math.PI * progression.FilterCutoffHz),
            0.02, 0.45);
        var lpL = 0f;
        var lpR = 0f;
        var breezeL = 0f;
        var breezeR = 0f;
        uint noiseState = 0x9E3779B9u ^ ((uint)resolved * 2654435761u);

        const double barSeconds = 4.5;
        var totalBars = Math.Max(1, (int)Math.Ceiling(durationSeconds / barSeconds));
        var fadeSec = Math.Min(0.85, durationSeconds * 0.14);

        for (var i = 0; i < totalSamples; i++)
        {
            if ((i & 0x3FFF) == 0) ct.ThrowIfCancellationRequested();

            var t = (double)i / SampleRate;
            var barPos = t / barSeconds;
            var barIdx = Math.Min(totalBars - 1, (int)Math.Floor(barPos));
            var barFrac = barPos - barIdx;

            var chordIdx = barIdx % progression.BaseRootsHz.Length;
            var nextChordIdx = (barIdx + 1) % progression.BaseRootsHz.Length;

            // Smooth crossfade between chords across the last 25% of each bar -> zero harmonic jumps
            var blend = barFrac > 0.75 ? SmoothStep((barFrac - 0.75) / 0.25) : 0.0;
            var rootA = progression.BaseRootsHz[chordIdx];
            var rootB = progression.BaseRootsHz[nextChordIdx];

            // Warm multi-voice detuned chord pad
            var padL = 0.0;
            var padR = 0.0;
            for (var n = 0; n < progression.Intervals.Length; n++)
            {
                var ratio = progression.Intervals[n];
                var freqA = rootA * ratio;
                var freqB = rootB * ratio;
                var amp = n == 0 ? 0.34 : n == 1 ? 0.28 : 0.18;

                // Subtle stereo chorus detune (±0.15%) gives rich spatial width without phasing artifacts
                var sL = (1.0 - blend) * (Math.Sin(2.0 * Math.PI * freqA * 0.9985 * t) + 0.3 * Math.Sin(2.0 * Math.PI * freqA * 2.0 * t))
                       + blend * (Math.Sin(2.0 * Math.PI * freqB * 0.9985 * t) + 0.3 * Math.Sin(2.0 * Math.PI * freqB * 2.0 * t));
                var sR = (1.0 - blend) * (Math.Sin(2.0 * Math.PI * freqA * 1.0015 * t) + 0.3 * Math.Sin(2.0 * Math.PI * freqA * 2.0 * t))
                       + blend * (Math.Sin(2.0 * Math.PI * freqB * 1.0015 * t) + 0.3 * Math.Sin(2.0 * Math.PI * freqB * 2.0 * t));

                padL += sL * amp;
                padR += sR * amp;
            }

            // Gentle plucked kalimba/flute motif (soft cosine attack 45ms + velvet decay — never an abrupt beep)
            var pulsePeriod = 1.0 / progression.ArpRateHz;
            var pulsePhase = (t % pulsePeriod);
            var stepIdx = (int)Math.Floor(t / pulsePeriod);
            var noteFreq = rootA * progression.Intervals[stepIdx % progression.Intervals.Length] * 2.0;
            var attackEnv = Math.Min(1.0, pulsePhase / 0.045);
            var decayEnv = Math.Exp(-pulsePhase * 1.65);
            var pluckEnv = attackEnv * decayEnv;
            var pan = (stepIdx % 2 == 0) ? 0.62 : 0.38;
            var pluck = (Math.Sin(2.0 * Math.PI * noteFreq * t) + 0.25 * Math.Sin(2.0 * Math.PI * noteFreq * 2.0 * t)) * pluckEnv * 0.16;

            // Ultra-soft warm air/tanpura breeze floor (heavily smoothed noise)
            noiseState = noiseState * 1664525u + 1013904223u;
            var whiteL = ((noiseState >> 16) / 65535.0f) * 2f - 1f;
            noiseState = noiseState * 1664525u + 1013904223u;
            var whiteR = ((noiseState >> 16) / 65535.0f) * 2f - 1f;
            breezeL = breezeL * 0.985f + whiteL * 0.015f;
            breezeR = breezeR * 0.985f + whiteR * 0.015f;

            // Slow breathing swell + clean loop-boundary fades
            var swell = 0.85 + 0.15 * Math.Sin(2.0 * Math.PI * 0.14 * t);
            var env = swell;
            if (t < fadeSec) env *= SmoothStep(t / fadeSec);
            if (t > durationSeconds - fadeSec) env *= SmoothStep((durationSeconds - t) / fadeSec);

            var rawL = (float)((padL * 0.28 + pluck * pan) * env + breezeL * progression.BreezeLevel * env);
            var rawR = (float)((padR * 0.28 + pluck * (1.0 - pan)) * env + breezeR * progression.BreezeLevel * env);

            lpL += alpha * (rawL - lpL);
            lpR += alpha * (rawR - lpR);

            // Soft tanh limiting & calibrated ~ -22 dBFS master level so it sits comfortably behind voice
            var outL = (short)Math.Clamp(Math.Tanh(lpL * 0.95) * 6200.0, short.MinValue, short.MaxValue);
            var outR = (short)Math.Clamp(Math.Tanh(lpR * 0.95) * 6200.0, short.MinValue, short.MaxValue);

            var offset = i * Channels * sizeof(short);
            BinaryPrimitives.WriteInt16LittleEndian(span.Slice(offset, 2), outL);
            BinaryPrimitives.WriteInt16LittleEndian(span.Slice(offset + 2, 2), outR);
        }

        await WritePcmWavFileAsync(outputPath, pcmBytes, SampleRate, Channels, 16, ct).ConfigureAwait(false);
    }

    /// <summary>
    /// Reads a 16-bit PCM WAV file and returns a frame-indexed normalized amplitude envelope [0..1]
    /// so animated character mouths follow real spoken syllables and rest cleanly on silences.
    /// </summary>
    public static float[] ComputeFrameEnvelope(string wavPath, int totalFrames, double fps)
    {
        var envelope = new float[Math.Max(1, totalFrames)];
        if (!File.Exists(wavPath) || totalFrames <= 0 || fps <= 0)
            return envelope;

        var bytes = File.ReadAllBytes(wavPath);
        if (bytes.Length < 44
            || !bytes.AsSpan(0, 4).SequenceEqual("RIFF"u8)
            || !bytes.AsSpan(8, 4).SequenceEqual("WAVE"u8))
        {
            return envelope;
        }

        ushort channels = 1;
        uint sampleRate = 24_000;
        ushort bitsPerSample = 16;
        var dataStart = -1;
        var dataLength = 0;

        var offset = 12;
        while (offset + 8 <= bytes.Length)
        {
            var chunkId = bytes.AsSpan(offset, 4);
            var chunkSize = BinaryPrimitives.ReadInt32LittleEndian(bytes.AsSpan(offset + 4, 4));
            var body = offset + 8;

            if (chunkId.SequenceEqual("fmt "u8) && body + 16 <= bytes.Length)
            {
                channels = BinaryPrimitives.ReadUInt16LittleEndian(bytes.AsSpan(body + 2, 2));
                sampleRate = BinaryPrimitives.ReadUInt32LittleEndian(bytes.AsSpan(body + 4, 4));
                bitsPerSample = BinaryPrimitives.ReadUInt16LittleEndian(bytes.AsSpan(body + 14, 2));
            }
            else if (chunkId.SequenceEqual("data"u8))
            {
                dataStart = body;
                dataLength = Math.Min(Math.Max(0, chunkSize), bytes.Length - body);
                break;
            }

            if (chunkSize < 0) break;
            offset = body + chunkSize + (chunkSize & 1);
        }

        if (dataStart < 0 || dataLength <= 0 || bitsPerSample != 16 || channels == 0 || sampleRate == 0)
            return envelope;

        var blockAlign = channels * 2;
        var totalPcmFrames = dataLength / blockAlign;
        var samplesPerVideoFrame = Math.Max(1.0, sampleRate / fps);

        var smoothed = 0f;
        var peakRms = 0f;
        var rawRms = new float[totalFrames];

        for (var f = 0; f < totalFrames; f++)
        {
            var startSample = (int)Math.Floor(f * samplesPerVideoFrame);
            var endSample = Math.Min(totalPcmFrames, (int)Math.Ceiling((f + 1) * samplesPerVideoFrame));
            if (startSample >= endSample) continue;

            double sumSq = 0;
            var count = 0;
            for (var s = startSample; s < endSample; s++)
            {
                var p = dataStart + s * blockAlign;
                var val = BinaryPrimitives.ReadInt16LittleEndian(bytes.AsSpan(p, 2)) / 32768.0;
                sumSq += val * val;
                count++;
            }

            var rms = count > 0 ? (float)Math.Sqrt(sumSq / count) : 0f;
            rawRms[f] = rms;
            if (rms > peakRms) peakRms = rms;
        }

        var normScale = peakRms > 0.015f ? (1.0f / Math.Max(0.12f, peakRms * 0.72f)) : 4.5f;
        for (var f = 0; f < totalFrames; f++)
        {
            var instant = Math.Clamp((rawRms[f] - 0.008f) * normScale, 0f, 1f);
            // Faster attack, smooth release for natural speech articulation
            var k = instant > smoothed ? 0.58f : 0.32f;
            smoothed += k * (instant - smoothed);
            envelope[f] = smoothed < 0.02f ? 0f : smoothed;
        }

        return envelope;
    }

    public static double? TryGetWavDurationSeconds(string wavPath)
    {
        if (!File.Exists(wavPath)) return null;
        var bytes = File.ReadAllBytes(wavPath);
        return AiAudioValidator.TryGetWavDuration(bytes);
    }

    private static ChordProgression ProgressionFor(ProceduralSceneTheme theme) => theme switch
    {
        // Warm devotional tanpura / flute pentatonic palette (C-G-D-E / Raga Bhupali movement)
        ProceduralSceneTheme.VedicTempleSunrise3D => new(
            [130.81, 146.83, 110.00, 130.81],
            [1.0, 1.5, 2.0, 2.5],
            ArpRateHz: 0.45,
            FilterCutoffHz: 950,
            BreezeLevel: 0.14),

        ProceduralSceneTheme.CosmosSacred3D => new(
            [110.00, 130.81, 98.00, 110.00],
            [1.0, 1.5, 2.25, 3.0],
            ArpRateHz: 0.38,
            FilterCutoffHz: 880,
            BreezeLevel: 0.18),

        // Warm archival cello-like fifths and minor ninths
        ProceduralSceneTheme.HistoryChronicle3D => new(
            [116.54, 98.00, 103.83, 87.31],
            [1.0, 1.5, 2.0, 2.4],
            ArpRateHz: 0.35,
            FilterCutoffHz: 820,
            BreezeLevel: 0.12),

        // Smooth ambient synth pad
        ProceduralSceneTheme.NeonCyberGrid3D => new(
            [110.00, 87.31, 98.00, 123.47],
            [1.0, 1.5, 1.8, 2.25],
            ArpRateHz: 0.65,
            FilterCutoffHz: 1150,
            BreezeLevel: 0.10),

        // Peaceful serene acoustic breeze
        _ => new(
            [130.81, 110.00, 146.83, 196.00],
            [1.0, 1.25, 1.5, 2.25],
            ArpRateHz: 0.42,
            FilterCutoffHz: 1050,
            BreezeLevel: 0.22),
    };

    private static double SmoothStep(double x)
    {
        var c = Math.Clamp(x, 0.0, 1.0);
        return c * c * (3.0 - 2.0 * c);
    }

    private static async Task WritePcmWavFileAsync(
        string path,
        byte[] pcmData,
        int sampleRate,
        int channels,
        int bitsPerSample,
        CancellationToken ct)
    {
        var dir = Path.GetDirectoryName(path);
        if (!string.IsNullOrWhiteSpace(dir)) Directory.CreateDirectory(dir);

        var header = new byte[44];
        var hs = header.AsSpan();
        var dataLen = pcmData.Length;
        var byteRate = sampleRate * channels * (bitsPerSample / 8);
        var blockAlign = (short)(channels * (bitsPerSample / 8));

        "RIFF"u8.CopyTo(hs[..4]);
        BinaryPrimitives.WriteInt32LittleEndian(hs.Slice(4, 4), 36 + dataLen);
        "WAVE"u8.CopyTo(hs.Slice(8, 4));
        "fmt "u8.CopyTo(hs.Slice(12, 4));
        BinaryPrimitives.WriteInt32LittleEndian(hs.Slice(16, 4), 16);
        BinaryPrimitives.WriteInt16LittleEndian(hs.Slice(20, 2), 1);
        BinaryPrimitives.WriteInt16LittleEndian(hs.Slice(22, 2), (short)channels);
        BinaryPrimitives.WriteInt32LittleEndian(hs.Slice(24, 4), sampleRate);
        BinaryPrimitives.WriteInt32LittleEndian(hs.Slice(28, 4), byteRate);
        BinaryPrimitives.WriteInt16LittleEndian(hs.Slice(32, 2), blockAlign);
        BinaryPrimitives.WriteInt16LittleEndian(hs.Slice(34, 2), (short)bitsPerSample);
        "data"u8.CopyTo(hs.Slice(36, 4));
        BinaryPrimitives.WriteInt32LittleEndian(hs.Slice(40, 4), dataLen);

        await using var fs = new FileStream(path, FileMode.Create, FileAccess.Write, FileShare.Read, 65536, useAsync: true);
        await fs.WriteAsync(header, ct).ConfigureAwait(false);
        await fs.WriteAsync(pcmData, ct).ConfigureAwait(false);
    }
}
