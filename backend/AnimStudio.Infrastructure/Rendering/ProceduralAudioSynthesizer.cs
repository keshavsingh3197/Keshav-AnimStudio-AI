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
        CancellationToken ct,
        bool sparseDialogueBed = false)
    {
        var totalSamples = Math.Max(SampleRate, (long)durationSeconds * SampleRate);
        var resolved = theme == ProceduralSceneTheme.Auto ? ProceduralSceneTheme.VedicTempleSunrise3D : theme;
        var progression = ProgressionFor(resolved);

        // Stream directly to disk in 1-second stereo chunks (192 KB RAM) so 60-minute videos never allocate huge PCM buffers.
        var dir = Path.GetDirectoryName(outputPath);
        if (!string.IsNullOrWhiteSpace(dir)) Directory.CreateDirectory(dir);
        await using var fs = new FileStream(outputPath, FileMode.Create, FileAccess.Write, FileShare.Read, 65536, useAsync: true);
        await WriteWavHeaderAsync(fs, totalSamples * Channels * sizeof(short), SampleRate, Channels, 16, ct).ConfigureAwait(false);

        const int ChunkSamples = SampleRate;
        var pcmChunk = new byte[ChunkSamples * Channels * sizeof(short)];

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
        var totalBars = Math.Max(1L, (long)Math.Ceiling(durationSeconds / barSeconds));
        var fadeSec = Math.Min(0.85, durationSeconds * 0.14);

        for (long chunkStart = 0; chunkStart < totalSamples; chunkStart += ChunkSamples)
        {
            ct.ThrowIfCancellationRequested();
            var count = (int)Math.Min(ChunkSamples, totalSamples - chunkStart);
            var span = pcmChunk.AsSpan(0, count * Channels * sizeof(short));

            for (var local = 0; local < count; local++)
            {
                var i = chunkStart + local;
                var t = (double)i / SampleRate;
                var barPos = t / barSeconds;
                var barIdx = Math.Min(totalBars - 1, (long)Math.Floor(barPos));
                var barFrac = barPos - barIdx;

                var chordIdx = (int)(barIdx % progression.BaseRootsHz.Length);
                var nextChordIdx = (int)((barIdx + 1) % progression.BaseRootsHz.Length);

                // Smooth crossfade between chords across the last 25% of each bar -> zero harmonic jumps
                var blend = barFrac > 0.75 ? SmoothStep((barFrac - 0.75) / 0.25) : 0.0;
                var rootA = progression.BaseRootsHz[chordIdx];
                var rootB = progression.BaseRootsHz[nextChordIdx];

                var padL = 0.0;
                var padR = 0.0;
                for (var n = 0; n < progression.Intervals.Length; n++)
                {
                    var ratio = progression.Intervals[n];
                    var freqA = rootA * ratio;
                    var freqB = rootB * ratio;
                    var amp = n == 0 ? 0.34 : n == 1 ? 0.28 : 0.18;

                    var sL = (1.0 - blend) * (Math.Sin(2.0 * Math.PI * freqA * 0.9985 * t) + 0.3 * Math.Sin(2.0 * Math.PI * freqA * 2.0 * t))
                           + blend * (Math.Sin(2.0 * Math.PI * freqB * 0.9985 * t) + 0.3 * Math.Sin(2.0 * Math.PI * freqB * 2.0 * t));
                    var sR = (1.0 - blend) * (Math.Sin(2.0 * Math.PI * freqA * 1.0015 * t) + 0.3 * Math.Sin(2.0 * Math.PI * freqA * 2.0 * t))
                           + blend * (Math.Sin(2.0 * Math.PI * freqB * 1.0015 * t) + 0.3 * Math.Sin(2.0 * Math.PI * freqB * 2.0 * t));

                    padL += sL * amp;
                    padR += sR * amp;
                }

                var pulsePeriod = 1.0 / progression.ArpRateHz;
                var pulsePhase = (t % pulsePeriod);
                var stepIdx = (int)Math.Floor(t / pulsePeriod);
                var noteFreq = rootA * progression.Intervals[stepIdx % progression.Intervals.Length] * 2.0;
                var attackEnv = Math.Min(1.0, pulsePhase / 0.045);
                var decayEnv = Math.Exp(-pulsePhase * 1.65);
                var pluckEnv = attackEnv * decayEnv;
                var pan = (stepIdx % 2 == 0) ? 0.62 : 0.38;
                var pluck = (Math.Sin(2.0 * Math.PI * noteFreq * t) + 0.25 * Math.Sin(2.0 * Math.PI * noteFreq * 2.0 * t)) * pluckEnv * 0.16;

                noiseState = noiseState * 1664525u + 1013904223u;
                var whiteL = ((noiseState >> 16) / 65535.0f) * 2f - 1f;
                noiseState = noiseState * 1664525u + 1013904223u;
                var whiteR = ((noiseState >> 16) / 65535.0f) * 2f - 1f;
                breezeL = breezeL * 0.985f + whiteL * 0.015f;
                breezeR = breezeR * 0.985f + whiteR * 0.015f;

                var swell = 0.85 + 0.15 * Math.Sin(2.0 * Math.PI * 0.14 * t);
                var env = swell;
                if (t < fadeSec) env *= SmoothStep(t / fadeSec);
                if (t > durationSeconds - fadeSec) env *= SmoothStep((durationSeconds - t) / fadeSec);

                // MJO dialogue breathing room: warm comic jingle on opening (<= 2.1s) and closing (last 2.7s),
                // then drops cleanly to silent room tone during dialogue so angry inflections & deadpan pauses hit hard.
                if (sparseDialogueBed && durationSeconds >= 12)
                {
                    var introWeight = t < 2.1 ? 1.0 : t < 2.9 ? 1.0 - SmoothStep((t - 2.1) / 0.8) : 0.0;
                    var outroStart = Math.Max(3.2, durationSeconds - 2.7);
                    var outroWeight = t >= outroStart ? SmoothStep(Math.Min(1.0, (t - outroStart) / 0.55)) : 0.0;
                    var dialogueFloor = 0.0;
                    env *= Math.Max(dialogueFloor, Math.Max(introWeight, outroWeight));
                }

                var rawL = (float)((padL * 0.28 + pluck * pan) * env + breezeL * progression.BreezeLevel * env);
                var rawR = (float)((padR * 0.28 + pluck * (1.0 - pan)) * env + breezeR * progression.BreezeLevel * env);

                lpL += alpha * (rawL - lpL);
                lpR += alpha * (rawR - lpR);

                var outL = (short)Math.Clamp(Math.Tanh(lpL * 0.95) * 6200.0, short.MinValue, short.MaxValue);
                var outR = (short)Math.Clamp(Math.Tanh(lpR * 0.95) * 6200.0, short.MinValue, short.MaxValue);

                var offset = local * Channels * sizeof(short);
                BinaryPrimitives.WriteInt16LittleEndian(span.Slice(offset, 2), outL);
                BinaryPrimitives.WriteInt16LittleEndian(span.Slice(offset + 2, 2), outR);
            }

            await fs.WriteAsync(pcmChunk.AsMemory(0, count * Channels * sizeof(short)), ct).ConfigureAwait(false);
        }
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

    private static async Task WriteWavHeaderAsync(
        FileStream fs,
        long dataBytes,
        int sampleRate,
        int channels,
        int bitsPerSample,
        CancellationToken ct)
    {
        var header = new byte[44];
        var hs = header.AsSpan();
        var dataLen = (int)Math.Min(int.MaxValue - 36L, Math.Max(0L, dataBytes));
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

        await fs.WriteAsync(header, ct).ConfigureAwait(false);
    }

    internal enum ComedySfxKind
    {
        Boing, Bonk, VineBoom, RecordScratch, TankCannon, Whoosh, AlarmDing, Footstep,
        TempleBell, EatingPop, Punch, KickThud, ComicGong, ComicSlap, ScissorSnip,
        GavelBang, PhoneRing, DoorKnock, Snore, TeacupClink, SpraySfx, AngrySteam,
        LaughChuckle, SadTrombone, ElectricZap, HornHonk, SnakeHiss,
        TireBrakeScreech, VehicleEngineRev, AchievementChime, CoinCashDing,
        RimshotPunch, SlideWhistleUp, SlideWhistleDown, DramaticGasp, PaperOfficeFlip, CricketChirp
    }

    internal static IReadOnlyList<(double Time, ComedySfxKind Kind, double Gain)> CollectComedySfxEvents(
        ProceduralDialoguePlan plan,
        bool comedyIntensity)
    {
        ArgumentNullException.ThrowIfNull(plan);
        var events = new List<(double Time, ComedySfxKind Kind, double Gain)>();

        foreach (var meme in plan.Memes)
        {
            var kind = meme.Name.Contains("bonk", StringComparison.OrdinalIgnoreCase) ? ComedySfxKind.Bonk
                : meme.Name.Contains("buffering", StringComparison.OrdinalIgnoreCase) ? ComedySfxKind.RecordScratch
                : ComedySfxKind.VineBoom;
            events.Add((Math.Max(0.15, meme.StartSeconds - 0.06), kind, 0.78));
        }

        string? prevCue = null;
        string? prevEmotion = null;
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

            var turnSpan = Math.Max(0.35, turn.EndSeconds - turn.StartSeconds);
            var txtLower = (turn.Text ?? string.Empty).ToLowerInvariant();
            if (comedyIntensity && (txtLower.Contains("कंटाप") || txtLower.Contains("थप्पड़") || txtLower.Contains("चाँटा") || txtLower.Contains("slap")))
            {
                events.Add((turn.StartSeconds + Math.Min(0.45, turnSpan * 0.4), ComedySfxKind.ComicSlap, 0.72));
            }
            var hasScissorsCue = turn.Action == "cutting"
                || turn.ListenerAction == "cutting"
                || string.Equals(turn.SpeakerProp, "scissors", StringComparison.OrdinalIgnoreCase)
                || string.Equals(turn.ListenerProp, "scissors", StringComparison.OrdinalIgnoreCase)
                || (comedyIntensity && (txtLower.Contains("केंची") || txtLower.Contains("कैंची") || txtLower.Contains("चक") || txtLower.Contains("कच") || txtLower.Contains("scissor") || txtLower.Contains("snip") || txtLower.Contains("haircut") || txtLower.Contains("trim")));
            if (hasScissorsCue)
            {
                var primaryCutting = turn.Action == "cutting" || txtLower.Contains("चक");
                var vol = primaryCutting ? 0.68 : 0.42;
                events.Add((turn.StartSeconds + Math.Min(0.10, turnSpan * 0.12), ComedySfxKind.ScissorSnip, vol));
                if (turnSpan > 0.75 && primaryCutting)
                    events.Add((turn.StartSeconds + Math.Min(0.54, turnSpan * 0.48), ComedySfxKind.ScissorSnip, vol * 0.92));
                if (turnSpan > 1.35 && primaryCutting)
                    events.Add((turn.StartSeconds + Math.Min(1.02, turnSpan * 0.76), ComedySfxKind.ScissorSnip, vol * 0.96));
            }
            if (turn.Action == "bangingGavel" || string.Equals(turn.SpeakerProp, "gavel", StringComparison.OrdinalIgnoreCase) || txtLower.Contains("ऑर्डर"))
                events.Add((turn.StartSeconds + 0.06, ComedySfxKind.GavelBang, 0.64));
            else if (turn.Action == "callingPhone" || string.Equals(turn.SpeakerProp, "phone", StringComparison.OrdinalIgnoreCase) || txtLower.Contains("ट्रिंग"))
                events.Add((turn.StartSeconds + 0.05, ComedySfxKind.PhoneRing, 0.48));
            else if (txtLower.Contains("खटखट") || txtLower.Contains("खट-खट") || txtLower.Contains("knock"))
                events.Add((turn.StartSeconds + 0.05, ComedySfxKind.DoorKnock, 0.56));
            else if (turn.Action == "removingTowel")
                events.Add((turn.StartSeconds + 0.08, ComedySfxKind.Whoosh, 0.45));
            else if (turn.Action == "spraying" || string.Equals(turn.SpeakerProp, "sprayBottle", StringComparison.OrdinalIgnoreCase))
            {
                events.Add((turn.StartSeconds + 0.08, ComedySfxKind.SpraySfx, 0.55));
                if (turnSpan > 1.0)
                    events.Add((turn.StartSeconds + 0.52, ComedySfxKind.SpraySfx, 0.48));
            }
            else if (turn.Action == "sipping" || string.Equals(turn.SpeakerProp, "teacup", StringComparison.OrdinalIgnoreCase))
                events.Add((turn.StartSeconds + 0.14, ComedySfxKind.TeacupClink, 0.36));
            else if (comedyIntensity && (txtLower.Contains("घंटी") || txtLower.Contains("gong") || txtLower.Contains("bell") || txtLower.Contains("rhyme")))
                events.Add((Math.Max(0.1, turn.EndSeconds - 0.15), ComedySfxKind.ComicGong, 0.56));

            var action = turn.Action ?? "none";
            if (action is "punching" or "kicking")
            {
                var hitKind = action == "kicking" ? ComedySfxKind.KickThud : ComedySfxKind.Punch;
                var hits = ProceduralStrikeTiming.ImpactTimes(action, turn.StartSeconds, turn.EndSeconds);
                for (var h = 0; h < hits.Count; h++)
                    events.Add((hits[h] - 0.004, hitKind, (comedyIntensity ? 0.66 : 0.58) * (h % 2 == 0 ? 1.0 : 0.88)));
                if (hits.Count > 0)
                    events.Add((Math.Max(0.05, hits[0] - 0.14), ComedySfxKind.Whoosh, 0.22));
                continue;
            }
            else if (action == "corpseSnapUp")
            {
                events.Add((Math.Max(0.02, turn.StartSeconds - 0.03), ComedySfxKind.RecordScratch, 0.56));
                events.Add((turn.StartSeconds + 0.05, ComedySfxKind.VineBoom, 0.72));
                events.Add((turn.StartSeconds + 0.14, ComedySfxKind.AngrySteam, 0.48));
            }
            else if (action == "brakeStop")
            {
                events.Add((turn.StartSeconds + 0.05, ComedySfxKind.HornHonk, 0.54));
                events.Add((turn.StartSeconds + Math.Min(0.45, turnSpan * 0.32), ComedySfxKind.TireBrakeScreech, 0.76));
            }
            else if (action == "celebrate")
            {
                events.Add((Math.Max(0.05, turn.EndSeconds + 0.02), ComedySfxKind.AchievementChime, 0.74));
            }
            else if (action == "hazardWire")
                events.Add((turn.StartSeconds + 0.10, ComedySfxKind.ElectricZap, 0.52));
            else if (action == "hazardTruck")
            {
                events.Add((turn.StartSeconds + 0.08, ComedySfxKind.HornHonk, 0.54));
                events.Add((turn.StartSeconds + 0.34, ComedySfxKind.TireBrakeScreech, 0.62));
            }
            else if (action == "hazardSnake")
                events.Add((turn.StartSeconds + 0.10, ComedySfxKind.SnakeHiss, 0.44));
            else if (action == "hazardPit" || action is "jumping" or "dancing")
                events.Add((turn.StartSeconds + 0.06, ComedySfxKind.Boing, 0.38));
            else if (action == "hazardTank")
                events.Add((turn.StartSeconds + 0.08, ComedySfxKind.Whoosh, 0.36));
            else if (action == "hazardFood")
                events.Add((turn.StartSeconds + 0.10, ComedySfxKind.EatingPop, 0.38));
            else if (action == "hazardPhone")
                events.Add((turn.StartSeconds + 0.06, ComedySfxKind.PhoneRing, 0.40));
            else if (turn.SpeakerRole == CharacterVisualRole.CartoonTank && turn.Emotion is "angry" or "proud")
                events.Add((turn.StartSeconds + 0.08, ComedySfxKind.TankCannon, 0.72));
            else if (action == "sleeping" || txtLower.Contains("ख्र्र") || txtLower.Contains("खर्र"))
                events.Add((turn.StartSeconds + 0.10, ComedySfxKind.Snore, 0.44));
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
                events.Add((turn.StartSeconds + 0.06, comedyIntensity && (txtLower.Contains("ओह तेरी") || txtLower.Contains("अब क्या")) ? ComedySfxKind.SadTrombone : ComedySfxKind.Bonk, comedyIntensity ? 0.48 : 0.24));
            else if (action == "eating")
                events.Add((turn.StartSeconds + 0.12, ComedySfxKind.EatingPop, 0.30));

            // Explicit or contextual SFX cues derived from vehicle, office, achievement, cash, and punchline speech beats
            if (comedyIntensity && !string.IsNullOrWhiteSpace(turn.SfxCue))
            {
                switch (turn.SfxCue.Trim().ToLowerInvariant())
                {
                    case "brake":
                        if (action != "brakeStop")
                        {
                            events.Add((turn.StartSeconds + Math.Min(0.35, turnSpan * 0.28), ComedySfxKind.TireBrakeScreech, 0.72));
                        }
                        break;
                    case "horn":
                        events.Add((turn.StartSeconds + 0.08, ComedySfxKind.HornHonk, 0.60));
                        break;
                    case "engine":
                        events.Add((turn.StartSeconds + 0.06, ComedySfxKind.VehicleEngineRev, 0.58));
                        break;
                    case "tada":
                        if (action != "celebrate")
                            events.Add((turn.EndSeconds + 0.02, ComedySfxKind.AchievementChime, 0.74));
                        break;
                    case "coin":
                        events.Add((turn.EndSeconds + 0.01, ComedySfxKind.CoinCashDing, 0.62));
                        break;
                    case "rimshot":
                        events.Add((turn.EndSeconds + 0.02, ComedySfxKind.RimshotPunch, 0.68));
                        break;
                    case "slideup":
                        events.Add((Math.Max(0.03, turn.StartSeconds - 0.02), ComedySfxKind.SlideWhistleUp, 0.52));
                        break;
                    case "slidedown":
                        events.Add((turn.EndSeconds + 0.01, ComedySfxKind.SlideWhistleDown, 0.56));
                        break;
                    case "trombone":
                        events.Add((turn.EndSeconds + 0.02, ComedySfxKind.SadTrombone, 0.68));
                        break;
                    case "gasp":
                        events.Add((Math.Max(0.03, turn.StartSeconds - 0.03), ComedySfxKind.DramaticGasp, 0.60));
                        break;
                    case "cricket":
                        events.Add((turn.EndSeconds + 0.04, ComedySfxKind.CricketChirp, 0.52));
                        break;
                    case "paper":
                        events.Add((turn.StartSeconds + 0.10, ComedySfxKind.PaperOfficeFlip, 0.46));
                        break;
                    case "boom":
                        events.Add((turn.StartSeconds + 0.04, ComedySfxKind.VineBoom, 0.68));
                        break;
                    case "slap":
                        events.Add((turn.StartSeconds + Math.Min(0.4, turnSpan * 0.4), ComedySfxKind.ComicSlap, 0.72));
                        break;
                    case "bonk":
                        events.Add((turn.StartSeconds + 0.06, ComedySfxKind.Bonk, 0.58));
                        break;
                }
            }

            var emotionChanged = !string.Equals(prevEmotion, turn.Emotion, StringComparison.OrdinalIgnoreCase);
            prevEmotion = turn.Emotion;

            if (turn.CameraShot == "crashPunch")
                events.Add((Math.Max(0.03, turn.StartSeconds - 0.02), ComedySfxKind.Whoosh, 0.34));
            else if (comedyIntensity && turn.Emotion is "surprised" && emotionChanged)
                events.Add((Math.Max(0.03, turn.StartSeconds - 0.02), ComedySfxKind.Boing, 0.38));
            else if (comedyIntensity && turn.Emotion is "scared" && emotionChanged)
                events.Add((Math.Max(0.03, turn.StartSeconds - 0.02), ComedySfxKind.DramaticGasp, 0.46));
            else if (comedyIntensity && turn.Emotion is "smug" && emotionChanged && string.IsNullOrWhiteSpace(turn.SfxCue))
                events.Add((turn.EndSeconds + 0.02, ComedySfxKind.RimshotPunch, 0.54));
            else if (comedyIntensity && turn.Emotion is "angry" && emotionChanged)
                events.Add((turn.StartSeconds + 0.16, ComedySfxKind.AngrySteam, 0.38));
            else if (comedyIntensity && (turn.Emotion is "laughing" || action == "laughing"))
                events.Add((Math.Max(turn.StartSeconds + 0.12, turn.EndSeconds - 0.45), ComedySfxKind.LaughChuckle, 0.38));
            else if (comedyIntensity && turn.Emotion is "sad" && emotionChanged && string.IsNullOrWhiteSpace(turn.SfxCue))
                events.Add((turn.EndSeconds + 0.02, ComedySfxKind.SadTrombone, 0.54));
            else if (comedyIntensity && turn.Emotion is "confused" && emotionChanged)
                events.Add((Math.Max(0.03, turn.StartSeconds - 0.02), ComedySfxKind.RecordScratch, 0.36));
        }

        return events;
    }

    /// <summary>
    /// Synthesizes deterministic cartoon, cinematic &amp; situational action sound effects aligned to turns, actions,
    /// camera smash-cuts, and meme cutaways. Streams out in 5-second windows so even 60-minute episodes use &lt; 4 MB RAM.
    /// </summary>
    public static async Task WriteComedySfxWavAsync(
        string outputPath,
        ProceduralDialoguePlan plan,
        int durationSeconds,
        CancellationToken ct,
        bool comedyIntensity = true)
    {
        ArgumentNullException.ThrowIfNull(plan);
        var totalSamples = Math.Max((long)SampleRate, (long)durationSeconds * SampleRate);
        var events = CollectComedySfxEvents(plan, comedyIntensity);

        // Precompute sound effects into a window-streamed PCM file (5s window = 240,000 samples = <2 MB RAM even for 60 min!).
        var dir = Path.GetDirectoryName(outputPath);
        if (!string.IsNullOrWhiteSpace(dir)) Directory.CreateDirectory(dir);
        await using var fs = new FileStream(outputPath, FileMode.Create, FileAccess.Write, FileShare.Read, 65536, useAsync: true);
        await WriteWavHeaderAsync(fs, totalSamples * Channels * sizeof(short), SampleRate, Channels, 16, ct).ConfigureAwait(false);

        const int WindowSamples = SampleRate * 5;
        var winMix = new double[WindowSamples];
        var pcmChunk = new byte[WindowSamples * Channels * sizeof(short)];
        var segments = BuildPlaceAmbienceSegments(plan, totalSamples / (double)SampleRate);

        var rng = new Random(0xC0DE5F);
        for (long winStart = 0; winStart < totalSamples; winStart += WindowSamples)
        {
            ct.ThrowIfCancellationRequested();
            var winCount = (int)Math.Min(WindowSamples, totalSamples - winStart);
            Array.Clear(winMix, 0, winCount);

            var winEndSample = winStart + winCount;
            foreach (var (time, kind, gain) in events)
            {
                var startIdx = (long)Math.Round(time * SampleRate);
                var sfxDur = SfxDurationSeconds(kind);
                var sfxSamples = (long)(sfxDur * SampleRate);
                var sfxEnd = Math.Min(totalSamples, startIdx + sfxSamples);
                if (sfxEnd <= winStart || startIdx >= winEndSample || startIdx < 0) continue;

                var overlapFrom = Math.Max(winStart, startIdx);
                var overlapTo = Math.Min(winEndSample, sfxEnd);
                var phase = 0.0;
                var phase2 = 0.0;
                var lpNoise = 0.0;
                // Advance deterministic phase cleanly up to overlapFrom so window seams match bit-for-bit
                for (var i = 0L; i < overlapTo - startIdx; i++)
                {
                    var u = i / (double)SampleRate;
                    var sampleVal = SynthesizeSfxSample(kind, u, sfxDur, ref phase, ref phase2, ref lpNoise, rng);
                    var globalSample = startIdx + i;
                    if (globalSample >= overlapFrom && globalSample < overlapTo)
                        winMix[(int)(globalSample - winStart)] += sampleVal * gain;
                }
            }

            MixPlaceAmbienceWindow(winMix, winStart, winCount, segments, totalSamples / (double)SampleRate);

            var span = pcmChunk.AsSpan(0, winCount * Channels * sizeof(short));
            for (var i = 0; i < winCount; i++)
            {
                var clamped = Math.Tanh(winMix[i]) * 0.90;
                var s = (short)Math.Clamp(clamped * short.MaxValue, short.MinValue, short.MaxValue);
                var o = i * Channels * 2;
                BinaryPrimitives.WriteInt16LittleEndian(span.Slice(o, 2), s);
                BinaryPrimitives.WriteInt16LittleEndian(span.Slice(o + 2, 2), s);
            }

            await fs.WriteAsync(pcmChunk.AsMemory(0, winCount * Channels * sizeof(short)), ct).ConfigureAwait(false);
        }
    }

    private static double SfxDurationSeconds(ComedySfxKind kind) => kind switch
    {
        ComedySfxKind.VineBoom or ComedySfxKind.TankCannon => 0.75,
        ComedySfxKind.TempleBell or ComedySfxKind.ComicGong or ComedySfxKind.SadTrombone => 0.95,
        ComedySfxKind.AchievementChime => 0.84,
        ComedySfxKind.CricketChirp => 0.72,
        ComedySfxKind.TireBrakeScreech => 0.68,
        ComedySfxKind.VehicleEngineRev => 0.64,
        ComedySfxKind.PhoneRing or ComedySfxKind.Snore or ComedySfxKind.AngrySteam or ComedySfxKind.LaughChuckle or ComedySfxKind.DramaticGasp => 0.56,
        ComedySfxKind.RimshotPunch or ComedySfxKind.SlideWhistleDown => 0.52,
        ComedySfxKind.Boing or ComedySfxKind.AlarmDing or ComedySfxKind.DoorKnock or ComedySfxKind.ElectricZap or ComedySfxKind.HornHonk or ComedySfxKind.SnakeHiss or ComedySfxKind.CoinCashDing or ComedySfxKind.SlideWhistleUp => 0.44,
        ComedySfxKind.GavelBang => 0.38,
        ComedySfxKind.ScissorSnip => 0.40,
        ComedySfxKind.PaperOfficeFlip => 0.34,
        ComedySfxKind.Whoosh or ComedySfxKind.TeacupClink or ComedySfxKind.SpraySfx => 0.28,
        ComedySfxKind.RecordScratch => 0.24,
        ComedySfxKind.Footstep => 0.11,
        ComedySfxKind.EatingPop or ComedySfxKind.ComicSlap => 0.18,
        ComedySfxKind.Punch => 0.22,
        ComedySfxKind.KickThud => 0.32,
        _ => 0.28
    };

    private static double SynthesizeSfxSample(
        ComedySfxKind kind,
        double u,
        double sfxDur,
        ref double phase,
        ref double phase2,
        ref double lpNoise,
        Random rng)
    {
        if (kind == ComedySfxKind.ScissorSnip)
        {
            // Two unmistakable stainless-steel barber scissor shears per cue (0.01s and 0.21s):
            // high-pass steel friction sweep (2.6->5.4kHz) + razor-sharp closure steel click (3.9 & 6.2kHz).
            var localU = u < 0.20 ? u - 0.01 : u - 0.21;
            if (localU < 0 || localU > 0.15) return 0.0;
            var freqSweep = 2750.0 + 2800.0 * Math.Min(1.0, localU / 0.07);
            phase += 2.0 * Math.PI * freqSweep / SampleRate;
            phase2 += 2.0 * Math.PI * (freqSweep * 1.56) / SampleRate;
            var white = rng.NextDouble() * 2.0 - 1.0;
            var hpNoise = white - lpNoise;
            lpNoise = 0.45 * white + 0.55 * lpNoise;
            var bladeSlide = Math.Exp(-Math.Pow((localU - 0.032) / 0.022, 2.0)) * (0.42 * hpNoise + 0.58 * Math.Sin(phase));
            var clickDt = localU - 0.062;
            var steelClick = clickDt >= 0
                ? Math.Exp(-clickDt * 82.0) * (0.68 * Math.Sin(phase2) + 0.35 * hpNoise)
                : 0.0;
            return Math.Tanh((bladeSlide * 0.72 + steelClick * 1.28) * 1.35);
        }

        if (kind == ComedySfxKind.GavelBang)
        {
            var localU = u < 0.19 ? u - 0.01 : u - 0.19;
            if (localU < 0 || localU > 0.16) return 0.0;
            var f = 225.0 * Math.Exp(-localU * 26.0) + 92.0;
            phase += 2.0 * Math.PI * f / SampleRate;
            var crack = (rng.NextDouble() * 2.0 - 1.0) * Math.Exp(-localU * 95.0);
            return Math.Tanh((0.78 * Math.Sin(phase) + 0.45 * crack) * Math.Exp(-localU * 18.0) * 1.6);
        }

        if (kind == ComedySfxKind.DoorKnock)
        {
            var slot = (int)(u / 0.13);
            var localU = u - slot * 0.13 - 0.01;
            if (slot > 2 || localU < 0 || localU > 0.10) return 0.0;
            var f = 175.0 * Math.Exp(-localU * 32.0) + 84.0;
            phase += 2.0 * Math.PI * f / SampleRate;
            return Math.Sin(phase) * Math.Exp(-localU * 28.0) * 0.92;
        }

        if (kind == ComedySfxKind.PhoneRing)
        {
            var pulseOn = (u >= 0.02 && u <= 0.24) || (u >= 0.30 && u <= 0.54);
            if (!pulseOn) return 0.0;
            phase += 2.0 * Math.PI * 960.0 / SampleRate;
            phase2 += 2.0 * Math.PI * 1185.0 / SampleRate;
            var trill = 0.5 + 0.5 * Math.Sin(2.0 * Math.PI * 24.0 * u);
            return (0.55 * Math.Sin(phase) + 0.45 * Math.Sin(phase2)) * trill * 0.58;
        }

        if (kind == ComedySfxKind.Snore)
        {
            var f = 92.0 + 18.0 * Math.Sin(Math.PI * u / sfxDur);
            phase += 2.0 * Math.PI * f / SampleRate;
            phase2 += 2.0 * Math.PI * (f * 1.48) / SampleRate;
            var rattle = 0.55 + 0.45 * Math.Sin(2.0 * Math.PI * 22.0 * u);
            var envSnore = Math.Sin(Math.PI * Math.Min(1.0, u / sfxDur));
            return Math.Tanh((0.65 * Math.Sin(phase) + 0.35 * Math.Sin(phase2)) * rattle) * envSnore * 0.62;
        }

        if (kind == ComedySfxKind.TeacupClink)
        {
            phase += 2.0 * Math.PI * 2920.0 / SampleRate;
            phase2 += 2.0 * Math.PI * 4380.0 / SampleRate;
            return (0.62 * Math.Sin(phase) + 0.38 * Math.Sin(phase2)) * Math.Min(1.0, u / 0.002) * Math.Exp(-u * 15.5);
        }

        if (kind == ComedySfxKind.ElectricZap)
        {
            var pulse = Math.Sin(2.0 * Math.PI * 19.0 * u) > -0.2 ? 1.0 : 0.15;
            var buzzFreq = 120.0 + 480.0 * Math.Abs(Math.Sin(2.0 * Math.PI * 33.0 * u));
            phase += 2.0 * Math.PI * buzzFreq / SampleRate;
            var spark = rng.NextDouble() * 2.0 - 1.0;
            return Math.Tanh((0.55 * Math.Sin(phase) + 0.65 * spark) * pulse) * Math.Exp(-u * 4.5) * 0.72;
        }
        if (kind == ComedySfxKind.HornHonk)
        {
            var second = u >= 0.02 && u <= 0.17 ? 1.0 : u >= 0.22 && u <= 0.41 ? 1.0 : 0.0;
            if (second == 0) return 0.0;
            phase += 2.0 * Math.PI * 415.0 / SampleRate;
            phase2 += 2.0 * Math.PI * 523.0 / SampleRate;
            return Math.Tanh((0.58 * Math.Sin(phase) + 0.48 * Math.Sin(phase2)) * 1.45) * 0.62;
        }
        if (kind == ComedySfxKind.SnakeHiss)
        {
            var white = rng.NextDouble() * 2.0 - 1.0;
            var hp = white - lpNoise;
            lpNoise = 0.28 * white + 0.72 * lpNoise;
            return Math.Tanh(hp * 1.65) * Math.Sin(Math.PI * Math.Min(1.0, u / sfxDur)) * 0.62;
        }

        if (kind == ComedySfxKind.SpraySfx)
        {
            var white = rng.NextDouble() * 2.0 - 1.0;
            var hp = white - lpNoise;
            lpNoise = 0.55 * white + 0.45 * lpNoise;
            var envSpray = Math.Sin(Math.PI * Math.Min(1.0, u / sfxDur));
            return Math.Tanh(hp * 1.45) * envSpray * 0.65;
        }

        if (kind == ComedySfxKind.AngrySteam)
        {
            var white = rng.NextDouble() * 2.0 - 1.0;
            var hp = white - lpNoise;
            lpNoise = 0.32 * white + 0.68 * lpNoise;
            var whistleF = 980.0 + 380.0 * Math.Min(1.0, u / sfxDur);
            phase += 2.0 * Math.PI * whistleF / SampleRate;
            var envSteam = Math.Min(1.0, u / 0.04) * Math.Exp(-Math.Max(0, u - 0.18) * 3.8);
            return Math.Tanh((0.55 * hp + 0.45 * Math.Sin(phase)) * 1.35) * envSteam * 0.72;
        }

        if (kind == ComedySfxKind.LaughChuckle)
        {
            // Bouncy 4-syllable comic marimba/chuckle bounce ("ha-ha-ha-ha!")
            var syl = (int)(u / 0.13);
            var localU = u - syl * 0.13;
            if (syl > 3 || localU < 0 || localU > 0.11) return 0.0;
            var f = 380.0 + syl * 45.0 - localU * 420.0;
            phase += 2.0 * Math.PI * f / SampleRate;
            return Math.Sin(phase) * Math.Min(1.0, localU / 0.008) * Math.Exp(-localU * 22.0) * 0.68;
        }

        if (kind == ComedySfxKind.SadTrombone)
        {
            // Classic descending 4-note comedy "wah-wah-wah-waaaah" punchline fail sting
            var f = u < 0.20 ? 311.1 : u < 0.40 ? 293.7 : u < 0.60 ? 277.2 : 261.6 - Math.Sin(u * 24.0) * 14.0;
            phase += 2.0 * Math.PI * f / SampleRate;
            phase2 += 2.0 * Math.PI * (f * 2.0) / SampleRate;
            var envTrombone = u < 0.60 ? Math.Sin(Math.PI * ((u % 0.20) / 0.20)) : Math.Exp(-Math.Max(0, u - 0.60) * 3.2);
            return Math.Tanh((0.68 * Math.Sin(phase) + 0.32 * Math.Sin(phase2)) * 1.8) * envTrombone * 0.56;
        }

        if (kind == ComedySfxKind.TireBrakeScreech)
        {
            // Sharp rubber-on-asphalt screech sweep + comic stop thud at the end
            var skidProg = Math.Min(1.0, u / Math.Max(0.1, sfxDur - 0.10));
            var squealA = 1480.0 - 520.0 * skidProg + 65.0 * Math.Sin(2.0 * Math.PI * 34.0 * u);
            var squealB = 2940.0 - 980.0 * skidProg + 110.0 * Math.Sin(2.0 * Math.PI * 41.0 * u);
            phase += 2.0 * Math.PI * squealA / SampleRate;
            phase2 += 2.0 * Math.PI * squealB / SampleRate;
            var white = rng.NextDouble() * 2.0 - 1.0;
            var grit = white - lpNoise;
            lpNoise = 0.42 * white + 0.58 * lpNoise;
            var envSkid = Math.Min(1.0, u / 0.015) * (1.0 - 0.65 * skidProg);
            var tireSqueal = Math.Tanh((0.55 * Math.Sin(phase) + 0.35 * Math.Sin(phase2) + 0.28 * grit) * 1.5) * envSkid;
            var stopDt = u - (sfxDur - 0.10);
            var thud = stopDt >= 0 ? Math.Sin(2.0 * Math.PI * (95.0 - stopDt * 300.0) * stopDt) * Math.Exp(-stopDt * 24.0) * 0.72 : 0.0;
            return Math.Clamp(tireSqueal * 0.66 + thud, -1.0, 1.0);
        }

        if (kind == ComedySfxKind.VehicleEngineRev)
        {
            // Pulsed scooter/motorcycle/auto throttle rev up then ease down
            var rise = u < 0.36 ? (u / 0.36) : Math.Max(0.0, 1.0 - (u - 0.36) / 0.28);
            var engineHz = 64.0 + 135.0 * Math.Pow(rise, 1.25);
            phase += 2.0 * Math.PI * engineHz / SampleRate;
            var flutter = 0.65 + 0.35 * Math.Sin(2.0 * Math.PI * (engineHz * 0.5) * u);
            var white = rng.NextDouble() * 2.0 - 1.0;
            lpNoise = 0.78 * lpNoise + 0.22 * white;
            var exhaust = Math.Tanh((0.68 * Math.Sin(phase) + 0.36 * Math.Sin(phase * 2.0) + 0.22 * lpNoise) * 1.9);
            var envEng = Math.Min(1.0, u / 0.04) * Math.Min(1.0, (sfxDur - u) / 0.09);
            return exhaust * flutter * envEng * 0.64;
        }

        if (kind == ComedySfxKind.AchievementChime)
        {
            // Bright ascending C5 -> E5 -> G5 -> C6 joyful "Ta-Da!" job-completed chime
            var noteIdx = u < 0.11 ? 0 : u < 0.22 ? 1 : u < 0.34 ? 2 : 3;
            var noteStart = noteIdx == 0 ? 0.0 : noteIdx == 1 ? 0.11 : noteIdx == 2 ? 0.22 : 0.34;
            var noteF = noteIdx switch { 0 => 523.25, 1 => 659.25, 2 => 783.99, _ => 1046.50 };
            phase += 2.0 * Math.PI * noteF / SampleRate;
            phase2 += 2.0 * Math.PI * (noteF * 1.5) / SampleRate;
            var dt = u - noteStart;
            var decayRate = noteIdx == 3 ? 4.2 : 12.0;
            var envNote = Math.Min(1.0, dt / 0.005) * Math.Exp(-dt * decayRate);
            return (0.66 * Math.Sin(phase) + 0.24 * Math.Sin(phase * 2.0) + 0.14 * Math.Sin(phase2)) * envNote * 0.78;
        }

        if (kind == ComedySfxKind.CoinCashDing)
        {
            // Crisp two-tone cash register / idea coin ding ("Bling-Ting!")
            var dt = u < 0.13 ? u : u - 0.13;
            var f = u < 0.13 ? 1318.51 : 1975.53;
            phase += 2.0 * Math.PI * f / SampleRate;
            phase2 += 2.0 * Math.PI * (f * 2.0) / SampleRate;
            var envCoin = Math.Min(1.0, dt / 0.003) * Math.Exp(-dt * (u < 0.13 ? 18.0 : 8.5));
            return (0.72 * Math.Sin(phase) + 0.28 * Math.Sin(phase2)) * envCoin * 0.72;
        }

        if (kind == ComedySfxKind.RimshotPunch)
        {
            // Classic comedy "Ba-Dum-Tss!" (0.00 snare, 0.13 tom, 0.25 crash cymbal hiss)
            var white = rng.NextDouble() * 2.0 - 1.0;
            var hp = white - lpNoise;
            lpNoise = 0.30 * white + 0.70 * lpNoise;
            if (u < 0.13)
            {
                phase += 2.0 * Math.PI * (240.0 * Math.Exp(-u * 18.0) + 125.0) / SampleRate;
                return (0.60 * Math.Sin(phase) + 0.45 * hp) * Math.Exp(-u * 26.0) * 0.78;
            }
            if (u < 0.25)
            {
                var dt = u - 0.13;
                phase += 2.0 * Math.PI * (185.0 * Math.Exp(-dt * 16.0) + 98.0) / SampleRate;
                return (0.68 * Math.Sin(phase) + 0.35 * hp) * Math.Exp(-dt * 24.0) * 0.78;
            }
            var cDt = u - 0.25;
            phase2 += 2.0 * Math.PI * 5400.0 / SampleRate;
            return Math.Tanh((0.76 * hp + 0.24 * Math.Sin(phase2)) * 1.4) * Math.Exp(-cDt * 7.8) * 0.65;
        }

        if (kind == ComedySfxKind.SlideWhistleUp || kind == ComedySfxKind.SlideWhistleDown)
        {
            var frac = Math.Clamp(u / sfxDur, 0.0, 1.0);
            var f = kind == ComedySfxKind.SlideWhistleUp
                ? 360.0 + 1120.0 * Math.Pow(frac, 1.35)
                : 1420.0 - 1180.0 * Math.Pow(frac, 0.85);
            phase += 2.0 * Math.PI * f / SampleRate;
            var envW = Math.Min(1.0, u / 0.025) * Math.Min(1.0, (sfxDur - u) / 0.045);
            return (0.82 * Math.Sin(phase) + 0.18 * Math.Sin(phase * 2.0)) * envW * 0.56;
        }

        if (kind == ComedySfxKind.DramaticGasp)
        {
            // Sharp tense orchestral minor-second sting + quick gasp breath
            var noteA = 392.0;
            var noteB = 415.3; // semitone clash for sudden comic shock!
            phase += 2.0 * Math.PI * noteA / SampleRate;
            phase2 += 2.0 * Math.PI * noteB / SampleRate;
            var white = rng.NextDouble() * 2.0 - 1.0;
            var hp = white - lpNoise;
            lpNoise = 0.50 * white + 0.50 * lpNoise;
            var breathEnv = u < 0.16 ? Math.Sin(Math.PI * (u / 0.16)) : 0.0;
            var stringEnv = Math.Min(1.0, u / 0.01) * Math.Exp(-u * 6.5);
            return Math.Tanh((0.46 * Math.Sin(phase) + 0.46 * Math.Sin(phase2)) * stringEnv * 1.4 + hp * breathEnv * 0.55) * 0.66;
        }

        if (kind == ComedySfxKind.PaperOfficeFlip)
        {
            // Twin rapid paper/file rustle snaps for office meeting / desk gags
            var slot = u < 0.16 ? 0 : 1;
            var dt = slot == 0 ? u : u - 0.16;
            if (dt > 0.14) return 0.0;
            var white = rng.NextDouble() * 2.0 - 1.0;
            var hp = white - lpNoise;
            lpNoise = 0.35 * white + 0.65 * lpNoise;
            return Math.Tanh(hp * 1.7) * Math.Sin(Math.PI * (dt / 0.14)) * 0.58;
        }

        if (kind == ComedySfxKind.CricketChirp)
        {
            // Classic 3-pulse field cricket chirp for deadpan awkward silence
            var slot = (int)(u / 0.24);
            var dt = u - slot * 0.24;
            if (slot > 2 || dt > 0.17) return 0.0;
            phase += 2.0 * Math.PI * 4420.0 / SampleRate;
            var pulseMod = Math.Max(0.0, Math.Sin(2.0 * Math.PI * 32.0 * dt));
            return Math.Sin(phase) * pulseMod * Math.Sin(Math.PI * (dt / 0.17)) * 0.46;
        }

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
            ComedySfxKind.ComicGong => 396.0 + 18.0 * Math.Exp(-u * 5.0),
            ComedySfxKind.EatingPop => 290.0 + 260.0 * (u / Math.Max(0.05, sfxDur)),
            ComedySfxKind.ComicSlap => 210.0 * Math.Exp(-u * 35.0) + 90.0,
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
            ComedySfxKind.TempleBell or ComedySfxKind.ComicGong => Math.Min(1.0, u / 0.006) * Math.Exp(-u * 2.4),
            ComedySfxKind.Whoosh => Math.Sin(Math.PI * Math.Min(1.0, u / sfxDur)),
            ComedySfxKind.Footstep => Math.Min(1.0, u / 0.003) * Math.Exp(-u * 24.0),
            ComedySfxKind.AlarmDing => Math.Min(1.0, u / 0.003) * Math.Exp(-u * 6.5),
            ComedySfxKind.Punch or ComedySfxKind.ComicSlap => Math.Min(1.0, u / 0.0015) * Math.Exp(-u * 22.0),
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
        else if (kind is ComedySfxKind.TempleBell or ComedySfxKind.ComicGong)
            raw = 0.62 * raw + 0.28 * Math.Sin(phase2) + 0.14 * Math.Sin(phase * 2.01);
        else if (kind == ComedySfxKind.AlarmDing)
            raw = 0.72 * raw + 0.28 * Math.Sin(phase * 1.5);
        else if (kind is ComedySfxKind.Punch or ComedySfxKind.KickThud or ComedySfxKind.ComicSlap)
        {
            var crack = (rng.NextDouble() * 2.0 - 1.0) * Math.Exp(-u * (kind == ComedySfxKind.Punch ? 160.0 : 120.0));
            raw = Math.Tanh(raw * 2.6 + crack * 1.4);
        }
        else if (kind == ComedySfxKind.Footstep)
            raw = Math.Tanh(raw * 1.4 + (rng.NextDouble() * 2.0 - 1.0) * 0.28 * Math.Exp(-u * 35.0));

        return raw * env;
    }

    [Flags]
    internal enum PlaceAmbience { None = 0, Wind = 1, Water = 2, Birds = 4, Crickets = 8, City = 16 }

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
            SceneSetting.NeighborhoodGate => PlaceAmbience.City,
            SceneSetting.Temple or SceneSetting.PalaceCourt => night ? PlaceAmbience.None : PlaceAmbience.Birds,
            _ => PlaceAmbience.None
        };
        var outdoors = setting is SceneSetting.ForestAshram or SceneSetting.Village or SceneSetting.RiverGhat
            or SceneSetting.Himalaya or SceneSetting.Battlefield or SceneSetting.Temple or SceneSetting.PalaceCourt;
        if (night && outdoors) bed |= PlaceAmbience.Crickets;
        return bed;
    }

    private static List<(double Start, double End, PlaceAmbience Bed, int SeedIdx)> BuildPlaceAmbienceSegments(
        ProceduralDialoguePlan plan,
        double totalSeconds)
    {
        var turns = plan.Turns;
        var segments = new List<(double Start, double End, PlaceAmbience Bed, int SeedIdx)>();
        for (var i = 0; i < turns.Count; i++)
        {
            var (setting, time) = SceneDirectives.FromCue(turns[i].SceneBackdropCue);
            var bed = AmbienceFor(setting, time);
            var start = i == 0 ? 0.0 : turns[i].StartSeconds;
            var end = i + 1 < turns.Count ? turns[i + 1].StartSeconds : totalSeconds;
            if (segments.Count > 0 && segments[^1].Bed == bed)
                segments[^1] = (segments[^1].Start, end, bed, segments[^1].SeedIdx);
            else
                segments.Add((start, end, bed, segments.Count));
        }
        return segments;
    }

    private static void MixPlaceAmbienceWindow(
        double[] winMix,
        long winStart,
        int winCount,
        IReadOnlyList<(double Start, double End, PlaceAmbience Bed, int SeedIdx)> segments,
        double totalSeconds)
    {
        const double fade = 0.35;
        foreach (var (start, end, bed, s) in segments)
        {
            if (bed == PlaceAmbience.None || end - start < 0.4) continue;
            var segStartSample = Math.Max(0L, (long)(start * SampleRate));
            var segEndSample = Math.Min((long)(totalSeconds * SampleRate), (long)(end * SampleRate));
            var from = Math.Max(winStart, segStartSample);
            var to = Math.Min(winStart + winCount, segEndSample);
            if (from >= to) continue;

            var rng = new Random(0xA4B1E + s * 7919 + (int)(from / SampleRate));
            double windLp = 0, waterHi = 0, waterLo = 0, cityLp = 0, birdPhase = 0, cricketPhase = 0;
            var nextChirpAt = (from / (double)SampleRate) + 0.4 + rng.NextDouble();
            double chirpStart = -1, chirpBaseHz = 3200;
            var chirpSyllables = 0;

            for (var i = from; i < to; i++)
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

                winMix[(int)(i - winStart)] += sample * env;
            }
        }
    }
}
