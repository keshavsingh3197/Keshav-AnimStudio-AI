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

        // Playful upbeat pizzicato/marimba comedy bounce (G major I-vi-IV-V feel)
        ProceduralSceneTheme.ComedyStage3D => new(
            [196.00, 164.81, 130.81, 146.83],
            [1.0, 1.25, 1.5, 2.0],
            ArpRateHz: 1.35,
            FilterCutoffHz: 1350,
            BreezeLevel: 0.08),

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

    private enum ComedySfxKind { Boing, Bonk, VineBoom, RecordScratch, TankCannon, Whoosh, AlarmDing, Footstep, TempleBell, EatingPop, Punch, KickThud }

    /// <summary>
    /// Synthesizes deterministic cartoon, cinematic &amp; situational action sound effects aligned to turns, actions,
    /// camera smash-cuts, and meme cutaways. Zero external copyright samples: every hit is procedural DSP waveform
    /// synthesis at 48kHz stereo.
    /// </summary>
    public static async Task WriteComedySfxWavAsync(
        string outputPath,
        ProceduralDialoguePlan plan,
        int durationSeconds,
        CancellationToken ct,
        bool comedyIntensity = true)
    {
        ArgumentNullException.ThrowIfNull(plan);
        var totalSamples = Math.Max(SampleRate, durationSeconds * SampleRate);
        var mix = new double[totalSamples];
        var events = new List<(double Time, ComedySfxKind Kind, double Gain)>();

        foreach (var meme in plan.Memes)
        {
            var kind = meme.Name.Contains("bonk", StringComparison.OrdinalIgnoreCase) ? ComedySfxKind.Bonk
                : meme.Name.Contains("buffering", StringComparison.OrdinalIgnoreCase) ? ComedySfxKind.RecordScratch
                : ComedySfxKind.VineBoom;
            events.Add((Math.Max(0.15, meme.StartSeconds - 0.06), kind, 0.78));
        }

        string? prevCue = null;
        foreach (var turn in plan.Turns)
        {
            if (turn.IsTitleHook)
            {
                prevCue = turn.SceneBackdropCue;
                continue;
            }

            if (!string.IsNullOrWhiteSpace(turn.SceneBackdropCue)
                && !string.Equals(turn.SceneBackdropCue, prevCue, StringComparison.Ordinal))
            {
                events.Add((Math.Max(0.05, turn.StartSeconds - 0.04), ComedySfxKind.Whoosh, comedyIntensity ? 0.36 : 0.24));
            }
            prevCue = turn.SceneBackdropCue;

            var action = turn.Action ?? "none";
            if (action is "punching" or "kicking")
            {
                // One hit per landed strike, on the same clock the 3D engine animates them with
                var hitKind = action == "kicking" ? ComedySfxKind.KickThud : ComedySfxKind.Punch;
                var hits = ProceduralStrikeTiming.ImpactTimes(action, turn.StartSeconds, turn.EndSeconds);
                for (var h = 0; h < hits.Count; h++)
                    events.Add((hits[h] - 0.004, hitKind, (comedyIntensity ? 0.66 : 0.58) * (h % 2 == 0 ? 1.0 : 0.88)));
                if (hits.Count > 0)
                    events.Add((Math.Max(0.05, hits[0] - 0.14), ComedySfxKind.Whoosh, 0.22));
                continue;
            }
            if (turn.SpeakerRole == CharacterVisualRole.CartoonTank && turn.Emotion is "angry" or "proud")
                events.Add((turn.StartSeconds + 0.08, ComedySfxKind.TankCannon, 0.72));
            else if (action == "wakingUp")
            {
                events.Add((turn.StartSeconds + 0.02, ComedySfxKind.AlarmDing, comedyIntensity ? 0.48 : 0.30));
                if (comedyIntensity)
                    events.Add((turn.StartSeconds + 0.16, ComedySfxKind.Boing, 0.42));
            }
            else if (action is "walking" or "running")
            {
                var stepGap = action == "running" ? 0.20 : 0.34;
                var stepCount = action == "running" ? 5 : 3;
                for (var s = 0; s < stepCount; s++)
                {
                    var st = turn.StartSeconds + 0.04 + s * stepGap;
                    if (st + 0.12 < turn.EndSeconds)
                        events.Add((st, ComedySfxKind.Footstep, comedyIntensity ? 0.28 : 0.20));
                }
            }
            else if (action == "praying")
                events.Add((turn.StartSeconds + 0.06, ComedySfxKind.TempleBell, comedyIntensity ? 0.28 : 0.24));
            else if (action == "shockedFall")
                events.Add((turn.StartSeconds + 0.04, comedyIntensity ? ComedySfxKind.VineBoom : ComedySfxKind.Whoosh, comedyIntensity ? 0.56 : 0.28));
            else if (action == "slapForehead")
                events.Add((turn.StartSeconds + 0.06, ComedySfxKind.Bonk, comedyIntensity ? 0.42 : 0.24));
            else if (action == "eating")
                events.Add((turn.StartSeconds + 0.12, ComedySfxKind.EatingPop, 0.30));
            else if (action is "jumping" or "dancing")
                events.Add((turn.StartSeconds + 0.06, ComedySfxKind.Boing, 0.38));
            else if (turn.CameraShot == "crashPunch")
                events.Add((turn.StartSeconds + 0.02, ComedySfxKind.Whoosh, 0.32));
            else if (comedyIntensity && turn.Emotion is "surprised")
                events.Add((turn.StartSeconds + 0.05, ComedySfxKind.Boing, 0.48));
            else if (comedyIntensity && turn.Emotion is "angry")
                events.Add((turn.StartSeconds + 0.05, ComedySfxKind.Bonk, 0.44));
            else if (comedyIntensity && turn.Emotion is "confused")
                events.Add((turn.StartSeconds + 0.05, ComedySfxKind.RecordScratch, 0.40));
        }

        var rng = new Random(0xC0DE5F);
        foreach (var (time, kind, gain) in events)
        {
            var startIdx = (int)Math.Round(time * SampleRate);
            var sfxDur = kind switch
            {
                ComedySfxKind.VineBoom or ComedySfxKind.TankCannon => 0.75,
                ComedySfxKind.TempleBell => 0.95,
                ComedySfxKind.Boing or ComedySfxKind.AlarmDing => 0.44,
                ComedySfxKind.Whoosh => 0.28,
                ComedySfxKind.RecordScratch => 0.24,
                ComedySfxKind.Footstep => 0.11,
                ComedySfxKind.EatingPop => 0.18,
                ComedySfxKind.Punch => 0.22,
                ComedySfxKind.KickThud => 0.32,
                _ => 0.28
            };
            var len = Math.Min(totalSamples - Math.Max(0, startIdx), (int)(sfxDur * SampleRate));
            if (startIdx < 0 || len <= 0) continue;

            var phase = 0.0;
            var phase2 = 0.0;
            var lpNoise = 0.0;
            for (var i = 0; i < len; i++)
            {
                var u = i / (double)SampleRate;
                var freq = kind switch
                {
                    ComedySfxKind.Boing => 220.0 + 340.0 * Math.Exp(-u * 6.0) + 75.0 * Math.Sin(u * 48.0),
                    ComedySfxKind.Bonk => 540.0 * Math.Exp(-u * 14.0) + 185.0,
                    ComedySfxKind.VineBoom => 118.0 * Math.Exp(-u * 5.2) + 36.0,
                    ComedySfxKind.TankCannon => 145.0 * Math.Exp(-u * 7.5) + 42.0,
                    ComedySfxKind.RecordScratch => 720.0 + 520.0 * Math.Sin(u * 82.0),
                    ComedySfxKind.AlarmDing => 1180.0 + 30.0 * Math.Sin(u * 62.0),
                    ComedySfxKind.Footstep => 130.0 * Math.Exp(-u * 26.0) + 48.0,
                    ComedySfxKind.TempleBell => 528.0,
                    ComedySfxKind.EatingPop => 290.0 + 260.0 * (u / Math.Max(0.05, sfxDur)),
                    ComedySfxKind.Whoosh => 260.0 + 480.0 * Math.Sin(Math.PI * Math.Min(1.0, u / sfxDur)),
                    ComedySfxKind.Punch => 150.0 * Math.Exp(-u * 30.0) + 58.0,
                    ComedySfxKind.KickThud => 110.0 * Math.Exp(-u * 18.0) + 42.0,
                    _ => 440.0
                };
                phase += 2.0 * Math.PI * freq / SampleRate;
                phase2 += 2.0 * Math.PI * (freq * 1.498) / SampleRate;
                var env = kind switch
                {
                    ComedySfxKind.VineBoom or ComedySfxKind.TankCannon => Math.Min(1.0, u / 0.008) * Math.Exp(-u * 3.8),
                    ComedySfxKind.TempleBell => Math.Min(1.0, u / 0.006) * Math.Exp(-u * 2.4),
                    ComedySfxKind.Whoosh => Math.Sin(Math.PI * Math.Min(1.0, u / sfxDur)),
                    ComedySfxKind.Footstep => Math.Min(1.0, u / 0.004) * Math.Exp(-u * 28.0),
                    ComedySfxKind.AlarmDing => Math.Min(1.0, u / 0.003) * Math.Exp(-u * 6.5),
                    ComedySfxKind.Punch => Math.Min(1.0, u / 0.0015) * Math.Exp(-u * 22.0),
                    ComedySfxKind.KickThud => Math.Min(1.0, u / 0.002) * Math.Exp(-u * 13.0),
                    _ => Math.Min(1.0, u / 0.004) * Math.Exp(-u * 7.5)
                };
                var raw = Math.Sin(phase);
                if (kind == ComedySfxKind.RecordScratch)
                    raw = 0.6 * raw + 0.4 * (rng.NextDouble() * 2.0 - 1.0);
                else if (kind == ComedySfxKind.TankCannon)
                    raw = Math.Tanh(raw * 2.2 + (rng.NextDouble() * 2.0 - 1.0) * 0.45 * Math.Exp(-u * 14.0));
                else if (kind == ComedySfxKind.VineBoom)
                    raw = Math.Tanh(raw * 2.4);
                else if (kind == ComedySfxKind.Whoosh)
                {
                    var white = rng.NextDouble() * 2.0 - 1.0;
                    lpNoise += 0.08 * (white - lpNoise);
                    raw = lpNoise * 0.72 + raw * 0.12;
                }
                else if (kind == ComedySfxKind.TempleBell)
                    raw = 0.62 * raw + 0.28 * Math.Sin(phase2) + 0.14 * Math.Sin(phase * 2.01);
                else if (kind == ComedySfxKind.AlarmDing)
                    raw = 0.72 * raw + 0.28 * Math.Sin(phase * 1.5);
                else if (kind is ComedySfxKind.Punch or ComedySfxKind.KickThud)
                {
                    // Body thump plus a short bright "smack" transient at the very start
                    var crack = (rng.NextDouble() * 2.0 - 1.0) * Math.Exp(-u * (kind == ComedySfxKind.Punch ? 160.0 : 110.0));
                    raw = Math.Tanh(raw * 2.6 + crack * 1.4);
                }
                else if (kind == ComedySfxKind.Footstep)
                    raw = Math.Tanh(raw * 1.4 + (rng.NextDouble() * 2.0 - 1.0) * 0.28 * Math.Exp(-u * 35.0));

                mix[startIdx + i] += raw * env * gain;
            }
        }

        AddPlaceAmbience(mix, plan, totalSamples);

        var pcmBytes = new byte[totalSamples * Channels * sizeof(short)];
        var span = pcmBytes.AsSpan();
        for (var i = 0; i < totalSamples; i++)
        {
            var clamped = Math.Tanh(mix[i]) * 0.90;
            var s = (short)Math.Clamp(clamped * short.MaxValue, short.MinValue, short.MaxValue);
            var o = i * Channels * 2;
            BinaryPrimitives.WriteInt16LittleEndian(span.Slice(o, 2), s);
            BinaryPrimitives.WriteInt16LittleEndian(span.Slice(o + 2, 2), s);
        }

        await WritePcmWavFileAsync(outputPath, pcmBytes, SampleRate, Channels, 16, ct).ConfigureAwait(false);
    }

    [Flags]
    internal enum PlaceAmbience { None = 0, Wind = 1, Water = 2, Birds = 4, Crickets = 8, City = 16 }

    /// <summary>
    /// The natural sound bed for a place, so a story that moves from a forest to a river to a city sounds like it:
    /// birds and breeze in the forest, flowing water at the ghat, wind on the mountain, traffic in town, crickets at
    /// night. Indoor sets stay quiet (the music and voices carry them).
    /// </summary>
    internal static PlaceAmbience AmbienceFor(SceneSetting setting, SceneTimeOfDay time)
    {
        var night = time == SceneTimeOfDay.Night;
        var bed = setting switch
        {
            SceneSetting.ForestAshram => PlaceAmbience.Wind | (night ? PlaceAmbience.None : PlaceAmbience.Birds),
            SceneSetting.Village => PlaceAmbience.Wind | (night ? PlaceAmbience.None : PlaceAmbience.Birds),
            SceneSetting.RiverGhat => PlaceAmbience.Water | (night ? PlaceAmbience.None : PlaceAmbience.Birds),
            SceneSetting.Himalaya => PlaceAmbience.Wind,
            SceneSetting.Battlefield => PlaceAmbience.Wind,
            SceneSetting.ModernCity => PlaceAmbience.City,
            SceneSetting.ChaiStall => PlaceAmbience.City,
            SceneSetting.Temple or SceneSetting.PalaceCourt => night ? PlaceAmbience.None : PlaceAmbience.Birds,
            _ => PlaceAmbience.None
        };
        var outdoors = setting is SceneSetting.ForestAshram or SceneSetting.Village or SceneSetting.RiverGhat
            or SceneSetting.Himalaya or SceneSetting.Battlefield or SceneSetting.Temple or SceneSetting.PalaceCourt;
        if (night && outdoors) bed |= PlaceAmbience.Crickets;
        return bed;
    }

    private static void AddPlaceAmbience(double[] mix, ProceduralDialoguePlan plan, int totalSamples)
    {
        var turns = plan.Turns;
        if (turns.Count == 0) return;
        const double fade = 0.35;
        var totalSeconds = totalSamples / (double)SampleRate;

        // Group consecutive turns that share a place into one segment, so the bed doesn't restart every line.
        var segments = new List<(double Start, double End, PlaceAmbience Bed)>();
        for (var i = 0; i < turns.Count; i++)
        {
            var (setting, time) = SceneDirectives.FromCue(turns[i].SceneBackdropCue);
            var bed = AmbienceFor(setting, time);
            var start = i == 0 ? 0.0 : turns[i].StartSeconds;
            var end = i + 1 < turns.Count ? turns[i + 1].StartSeconds : totalSeconds;
            if (segments.Count > 0 && segments[^1].Bed == bed)
                segments[^1] = (segments[^1].Start, end, bed);
            else
                segments.Add((start, end, bed));
        }

        for (var s = 0; s < segments.Count; s++)
        {
            var (start, end, bed) = segments[s];
            if (bed == PlaceAmbience.None || end - start < 0.4) continue;
            var rng = new Random(0xA4B1E + s * 7919);
            var i0 = Math.Max(0, (int)(start * SampleRate));
            var i1 = Math.Min(totalSamples, (int)(end * SampleRate));
            double windLp = 0, waterHi = 0, waterLo = 0, cityLp = 0, birdPhase = 0, cricketPhase = 0;
            var nextChirpAt = start + 0.4 + rng.NextDouble();
            double chirpStart = -1, chirpBaseHz = 3200;
            var chirpSyllables = 0;

            for (var i = i0; i < i1; i++)
            {
                var tt = i / (double)SampleRate;
                var env = Math.Min(1.0, Math.Min(tt - start, end - tt) / fade);
                if (env <= 0) continue;
                var white = rng.NextDouble() * 2.0 - 1.0;
                var sample = 0.0;

                if ((bed & PlaceAmbience.Wind) != 0)
                {
                    windLp += 0.012 * (white - windLp);
                    var gust = 0.55 + 0.45 * Math.Sin(2 * Math.PI * 0.09 * tt + s) * Math.Sin(2 * Math.PI * 0.031 * tt);
                    sample += windLp * 1.9 * gust * 0.32;
                }
                if ((bed & PlaceAmbience.Water) != 0)
                {
                    // Band-passed noise with a fast random swell: the babble of moving water
                    waterHi += 0.30 * (white - waterHi);
                    waterLo += 0.035 * (white - waterLo);
                    var babble = 0.6 + 0.4 * Math.Sin(2 * Math.PI * (1.7 + 0.6 * Math.Sin(tt * 0.7)) * tt);
                    sample += (waterHi - waterLo) * babble * 0.15;
                }
                if ((bed & PlaceAmbience.City) != 0)
                {
                    cityLp += 0.006 * (white - cityLp);
                    sample += cityLp * 2.4 * 0.30;
                }
                if ((bed & PlaceAmbience.Crickets) != 0)
                {
                    cricketPhase += 2 * Math.PI * 4650.0 / SampleRate;
                    var chirpGate = Math.Max(0, Math.Sin(2 * Math.PI * 29.0 * tt));
                    var burst = (tt * 1.1 % 1.0) < 0.32 ? 1.0 : 0.0;
                    sample += Math.Sin(cricketPhase) * chirpGate * burst * 0.022;
                }
                if ((bed & PlaceAmbience.Birds) != 0)
                {
                    if (chirpStart < 0 && tt >= nextChirpAt)
                    {
                        chirpStart = tt;
                        chirpBaseHz = 2600 + rng.NextDouble() * 2200;
                        chirpSyllables = 2 + rng.Next(3);
                    }
                    if (chirpStart >= 0)
                    {
                        const double syllable = 0.085;
                        var local = tt - chirpStart;
                        var idx = (int)(local / (syllable * 1.6));
                        if (idx >= chirpSyllables)
                        {
                            chirpStart = -1;
                            nextChirpAt = tt + 0.7 + rng.NextDouble() * 1.8;
                        }
                        else
                        {
                            var su = local - idx * syllable * 1.6;
                            if (su < syllable)
                            {
                                var f = chirpBaseHz * (1.0 + 0.35 * (su / syllable)) * (idx % 2 == 0 ? 1.0 : 0.92);
                                birdPhase += 2 * Math.PI * f / SampleRate;
                                sample += Math.Sin(birdPhase) * Math.Sin(Math.PI * su / syllable) * 0.028;
                            }
                        }
                    }
                }

                mix[i] += sample * env;
            }
        }
    }
}
