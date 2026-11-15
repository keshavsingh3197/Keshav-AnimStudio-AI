using System.Diagnostics;
using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Ai;
using AnimStudio.Application.Rendering;
using AnimStudio.Application.StoryAgent;
using AnimStudio.Domain.Ai;
using AnimStudio.Infrastructure.Ffmpeg;
using Microsoft.Extensions.Logging;

namespace AnimStudio.Infrastructure.Rendering;

public sealed record ProceduralSpeechSynthesisResult(
    string SpeechWavPath,
    ProceduralDialoguePlan UpdatedPlan,
    int RecommendedDurationSeconds,
    string ProviderId,
    IReadOnlyList<string> VoicesUsed);

/// <summary>
/// Converts a procedural video's dialogue or narration plan into real spoken multi-speaker /
/// narrator audio using the configured AI speech chain, measures exact clip lengths, stitches
/// a clean time-aligned WAV track, and adjusts visual turn/subtitle timings so no speech is
/// cut short or out of sync with character mouth animations.
/// </summary>
internal static class ProceduralSpeechSynthesizer
{
    private const double LeadInSeconds = 0.35;
    private const double PauseBetweenTurnsSeconds = 0.22;
    private const double MinTitleHoldSeconds = 2.0;

    public static async Task<ProceduralSpeechSynthesisResult?> TrySynthesizeAsync(
        ProceduralVideoRequest request,
        ProceduralDialoguePlan initialPlan,
        string workspaceInputDir,
        string userId,
        int baseDurationSeconds,
        IAiExecutor? ai,
        IAiProviderRegistry? aiRegistry,
        FfmpegOptions ffmpegOptions,
        ILogger? logger,
        CancellationToken ct)
    {
        if (!request.IncludeSpeech || ai is null || aiRegistry is null)
            return null;

        var provider = ResolveProvider(aiRegistry, request.SpeechProviderId);
        if (provider is null)
        {
            logger?.LogDebug("Procedural video: no configured speech AI provider; rendering music bed only.");
            return null;
        }

        var (voiceA, voiceB) = await ResolveVoicesAsync(provider, initialPlan, request, ct).ConfigureAwait(false);
        var speechTurns = initialPlan.Turns.Where(t => !t.IsTitleHook).ToList();
        var spokenTitleOnly = false;
        if (speechTurns.Count == 0 && initialPlan.Turns.Count > 0)
        {
            speechTurns = [initialPlan.Turns[0]];
            spokenTitleOnly = true;
        }

        if (speechTurns.Count == 0)
            return null;

        Directory.CreateDirectory(workspaceInputDir);
        var langCode = string.Equals(request.Language?.Trim(), "en", StringComparison.OrdinalIgnoreCase) ? "en" : "hi";
        var clipBytesList = new List<byte[]>(speechTurns.Count);
        var clipDurations = new List<double>(speechTurns.Count);
        var voicesUsed = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        for (var i = 0; i < speechTurns.Count; i++)
        {
            var turn = speechTurns[i];
            var spokenText = DialogueScriptParser.ToSpokenText(turn.Text, langCode);
            if (string.IsNullOrWhiteSpace(spokenText))
            {
                clipBytesList.Add([]);
                clipDurations.Add(Math.Max(1.0, turn.EndSeconds - turn.StartSeconds));
                continue;
            }

            var isRight = turn.Slot == DialogueSpeakerSlot.Right;
            var voiceId = isRight ? voiceB : voiceA;
            var style = initialPlan.HasCharacters
                ? (isRight
                    ? "Curious, warm, attentive companion tone, clear pronunciation"
                    : "Calm, wise, engaging mentor tone, clear expressive delivery")
                : "Warm, clear, engaging narrator tone with balanced pacing";

            AiOutcome<AiSpeechResult> outcome;
            try
            {
                outcome = await ai.SpeechAsync(new AiSpeechRequest
                {
                    Text = spokenText,
                    VoiceId = voiceId,
                    Rate = 1.0,
                    LanguageCode = langCode,
                    Style = style,
                    ProviderId = provider.Id.Value
                }, new AiCallContext(null, string.IsNullOrWhiteSpace(userId) ? null : userId), ct).ConfigureAwait(false);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger?.LogWarning(ex, "Procedural speech turn {Index} threw for provider {Provider}.", i, provider.Id.Value);
                return null;
            }

            if (!outcome.IsSuccess || outcome.Value is not { Content.Length: > 0 } speech)
            {
                logger?.LogWarning("Procedural speech turn {Index} failed on {Provider}: {Code} - {Msg}",
                    i, provider.Id.Value, outcome.ErrorCode, outcome.Message);
                return null;
            }

            var normalizedWav = await EnsureStereo48kWavAsync(speech.Content, workspaceInputDir, i, ffmpegOptions, ct)
                .ConfigureAwait(false);
            if (normalizedWav is null)
            {
                logger?.LogWarning("Procedural speech turn {Index} returned unusable audio format.", i);
                return null;
            }

            var dur = speech.DurationSeconds is > 0.1 and < 120
                ? AiAudioValidator.TryGetWavDuration(normalizedWav) ?? speech.DurationSeconds.Value
                : AiAudioValidator.TryGetWavDuration(normalizedWav) ?? 0;

            if (dur <= 0.05)
                dur = Math.Max(1.2, spokenText.Length / 14.0);

            clipBytesList.Add(normalizedWav);
            clipDurations.Add(dur);
            voicesUsed.Add(voiceId);
        }

        // Assemble canonical 48kHz stereo PCM WAV with crisp lead-in and natural turn gaps
        var nonEmptyClips = new List<byte[]>(clipBytesList.Count + 1);
        var leadGap = BuildSilenceWavLike(clipBytesList.FirstOrDefault(b => b.Length > 44), LeadInSeconds);
        if (leadGap is not null) nonEmptyClips.Add(leadGap);

        var updatedTurns = new List<ProceduralDialogueTurn>(initialPlan.Turns.Count);
        var cursor = LeadInSeconds;

        var titleTurn = !spokenTitleOnly ? initialPlan.Turns.FirstOrDefault(t => t.IsTitleHook) : null;
        if (titleTurn is not null)
        {
            updatedTurns.Add(titleTurn with
            {
                StartSeconds = 0.12,
                EndSeconds = Math.Round(Math.Max(MinTitleHoldSeconds, Math.Min(3.2, cursor + (clipDurations.Count > 0 ? clipDurations[0] : 2.0))), 2)
            });
        }

        for (var i = 0; i < speechTurns.Count; i++)
        {
            var turn = speechTurns[i];
            var start = Math.Round(cursor, 2);
            var end = Math.Round(cursor + clipDurations[i], 2);

            if (clipBytesList[i].Length > 44)
                nonEmptyClips.Add(clipBytesList[i]);

            updatedTurns.Add(turn with
            {
                StartSeconds = start,
                EndSeconds = end
            });

            cursor += clipDurations[i];
            if (i < speechTurns.Count - 1)
            {
                var pause = BuildSilenceWavLike(clipBytesList.FirstOrDefault(b => b.Length > 44), PauseBetweenTurnsSeconds);
                if (pause is not null) nonEmptyClips.Add(pause);
                cursor += PauseBetweenTurnsSeconds;
            }
        }

        if (nonEmptyClips.Count == 0)
            return null;

        var joinedWav = StoryWav.Join(nonEmptyClips, gapSeconds: 0);
        if (joinedWav is null)
        {
            logger?.LogWarning("Procedural speech clips had mismatched formats and could not join cleanly.");
            return null;
        }

        var speechWavPath = Path.Combine(workspaceInputDir, "speech.wav");
        await File.WriteAllBytesAsync(speechWavPath, joinedWav, ct).ConfigureAwait(false);

        var totalSeconds = Math.Clamp(
            (int)Math.Ceiling(Math.Max(baseDurationSeconds, cursor + 0.75)),
            ProceduralVideoRequest.MinSeconds,
            ProceduralVideoRequest.MaxSeconds);

        var updatedPlan = DialogueScriptParser.WithMeasuredTurns(initialPlan, updatedTurns);
        return new ProceduralSpeechSynthesisResult(
            speechWavPath,
            updatedPlan,
            totalSeconds,
            provider.Id.Value,
            [.. voicesUsed]);
    }

    private static ISpeechAiProvider? ResolveProvider(IAiProviderRegistry registry, string? preferredProviderId)
    {
        var chain = registry.SpeechChain();
        if (!string.IsNullOrWhiteSpace(preferredProviderId))
        {
            return chain.FirstOrDefault(p =>
                p.IsConfigured && string.Equals(p.Id.Value, preferredProviderId.Trim(), StringComparison.OrdinalIgnoreCase));
        }
        return chain.FirstOrDefault(p => p.IsConfigured);
    }

    private static async Task<(string VoiceA, string VoiceB)> ResolveVoicesAsync(
        ISpeechAiProvider provider,
        ProceduralDialoguePlan plan,
        ProceduralVideoRequest request,
        CancellationToken ct)
    {
        var isHindi = !string.Equals(request.Language?.Trim(), "en", StringComparison.OrdinalIgnoreCase);
        var pid = provider.Id.Value;

        string voiceA;
        string voiceB;

        if (string.Equals(pid, KnownAiProviders.GeminiTts, StringComparison.OrdinalIgnoreCase)
            || pid.Contains("gemini", StringComparison.OrdinalIgnoreCase))
        {
            voiceA = plan.LeftCharacter?.Role switch
            {
                CharacterVisualRole.KingCrown => "Orus",
                CharacterVisualRole.SageRishi => "Rasalgethi",
                CharacterVisualRole.Divine => "Sadaltager",
                _ => "Charon"
            };
            voiceB = plan.RightCharacter?.Role switch
            {
                CharacterVisualRole.KingCrown => "Alnilam",
                CharacterVisualRole.SageRishi => "Sadaltager",
                CharacterVisualRole.Divine => "Sulafat",
                _ => "Aoede"
            };
            if (string.Equals(voiceA, voiceB, StringComparison.OrdinalIgnoreCase))
                voiceB = "Puck";
        }
        else if (pid.Contains("kokoro", StringComparison.OrdinalIgnoreCase))
        {
            voiceA = isHindi ? "hm_omega" : "am_michael";
            voiceB = isHindi ? "hf_alpha" : "af_heart";
        }
        else if (pid.Contains("openai", StringComparison.OrdinalIgnoreCase))
        {
            voiceA = "onyx";
            voiceB = "nova";
        }
        else
        {
            voiceA = "default";
            voiceB = "default";
            try
            {
                var voices = await provider.ListVoicesAsync(ct).ConfigureAwait(false);
                var matching = voices
                    .Where(v => string.IsNullOrWhiteSpace(v.LanguageCode)
                        || v.LanguageCode.StartsWith(isHindi ? "hi" : "en", StringComparison.OrdinalIgnoreCase))
                    .ToList();
                if (matching.Count == 0) matching = [.. voices];
                if (matching.Count > 0)
                {
                    voiceA = matching[0].VoiceId;
                    voiceB = matching.Count > 1 ? matching[1].VoiceId : voiceA;
                }
            }
            catch
            {
                // Keep default fallback gracefully
            }
        }

        if (!string.IsNullOrWhiteSpace(request.SpeakerAVoiceId))
            voiceA = request.SpeakerAVoiceId.Trim();
        if (!string.IsNullOrWhiteSpace(request.SpeakerBVoiceId))
            voiceB = request.SpeakerBVoiceId.Trim();

        return (voiceA, voiceB);
    }

    private static async Task<byte[]?> EnsureStereo48kWavAsync(
        byte[] rawAudio,
        string dir,
        int index,
        FfmpegOptions ffmpegOptions,
        CancellationToken ct)
    {
        var kind = AiAudioValidator.Sniff(rawAudio);
        if (kind is null) return null;

        // Fast-path when already canonical 48kHz stereo 16-bit PCM WAV (avoids unnecessary FFmpeg spawns)
        if (kind == AiAudioValidator.Wav && IsStereo48kPcmWav(rawAudio))
            return rawAudio;

        // Normalize every turn to stereo 48kHz PCM WAV cleanly so StoryWav.Join never hits sample-rate mismatch
        // (e.g. 24kHz mono Gemini WAV vs 48kHz stereo BGM) and lip-sync amplitude envelope reads uniform PCM.
        var ext = kind == AiAudioValidator.Mp3 ? ".mp3"
                : kind == AiAudioValidator.Ogg ? ".ogg"
                : kind == AiAudioValidator.Flac ? ".flac"
                : ".wav";
        var srcPath = Path.Combine(dir, $"turn_{index:D2}.raw{ext}");
        var dstPath = Path.Combine(dir, $"turn_{index:D2}.pcm.wav");
        await File.WriteAllBytesAsync(srcPath, rawAudio, ct).ConfigureAwait(false);

        var ffmpegPath = string.IsNullOrWhiteSpace(ffmpegOptions.FfmpegPath) ? "ffmpeg" : ffmpegOptions.FfmpegPath;
        var psi = new ProcessStartInfo
        {
            FileName = ffmpegPath,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            RedirectStandardInput = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };
        foreach (var arg in new[]
        {
            "-y",
            "-i", srcPath,
            "-af", "aresample=48000,aformat=channel_layouts=stereo",
            "-c:a", "pcm_s16le",
            dstPath
        })
        {
            psi.ArgumentList.Add(arg);
        }

        try
        {
            using var proc = Process.Start(psi);
            if (proc is null)
                return kind == AiAudioValidator.Wav ? rawAudio : null;

            proc.StandardInput.Close();
            using var timeout = CancellationTokenSource.CreateLinkedTokenSource(ct);
            timeout.CancelAfter(TimeSpan.FromSeconds(25));
            _ = proc.StandardError.ReadToEndAsync(timeout.Token);
            await proc.WaitForExitAsync(timeout.Token).ConfigureAwait(false);

            if (proc.ExitCode == 0 && File.Exists(dstPath))
                return await File.ReadAllBytesAsync(dstPath, ct).ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            // Fallback below if FFmpeg is missing or fails on WAV input
        }
        finally
        {
            TryDelete(srcPath);
            TryDelete(dstPath);
        }

        return kind == AiAudioValidator.Wav ? rawAudio : null;
    }

    private static bool IsStereo48kPcmWav(byte[] wav)
    {
        if (wav.Length < 44) return false;
        // RIFF / WAVEfmt + PCM(1) + 2 channels + 48000Hz + 16-bit
        var format = wav[20] | (wav[21] << 8);
        var channels = wav[22] | (wav[23] << 8);
        var sampleRate = wav[24] | (wav[25] << 8) | (wav[26] << 16) | (wav[27] << 24);
        var bits = wav[34] | (wav[35] << 8);
        return format == 1 && channels == 2 && sampleRate == 48_000 && bits == 16;
    }

    private static byte[]? BuildSilenceWavLike(byte[]? referenceWav, double seconds)
    {
        if (seconds <= 0) return null;
        var sampleRate = 48_000;
        var channels = 2;
        var bits = 16;

        if (referenceWav is { Length: >= 44 }
            && referenceWav.AsSpan(0, 4).SequenceEqual("RIFF"u8))
        {
            channels = System.Buffers.Binary.BinaryPrimitives.ReadUInt16LittleEndian(referenceWav.AsSpan(22, 2));
            sampleRate = (int)System.Buffers.Binary.BinaryPrimitives.ReadUInt32LittleEndian(referenceWav.AsSpan(24, 4));
            bits = System.Buffers.Binary.BinaryPrimitives.ReadUInt16LittleEndian(referenceWav.AsSpan(34, 2));
        }

        if (channels <= 0 || sampleRate <= 0 || bits <= 0) return null;
        var blockAlign = (short)(channels * (bits / 8));
        var frames = (int)Math.Round(seconds * sampleRate);
        var dataLen = frames * blockAlign;
        var wav = new byte[44 + dataLen];
        var hs = wav.AsSpan();

        "RIFF"u8.CopyTo(hs[..4]);
        System.Buffers.Binary.BinaryPrimitives.WriteInt32LittleEndian(hs.Slice(4, 4), 36 + dataLen);
        "WAVE"u8.CopyTo(hs.Slice(8, 4));
        "fmt "u8.CopyTo(hs.Slice(12, 4));
        System.Buffers.Binary.BinaryPrimitives.WriteInt32LittleEndian(hs.Slice(16, 4), 16);
        System.Buffers.Binary.BinaryPrimitives.WriteInt16LittleEndian(hs.Slice(20, 2), 1);
        System.Buffers.Binary.BinaryPrimitives.WriteInt16LittleEndian(hs.Slice(22, 2), (short)channels);
        System.Buffers.Binary.BinaryPrimitives.WriteInt32LittleEndian(hs.Slice(24, 4), sampleRate);
        System.Buffers.Binary.BinaryPrimitives.WriteInt32LittleEndian(hs.Slice(28, 4), sampleRate * blockAlign);
        System.Buffers.Binary.BinaryPrimitives.WriteInt16LittleEndian(hs.Slice(32, 2), blockAlign);
        System.Buffers.Binary.BinaryPrimitives.WriteInt16LittleEndian(hs.Slice(34, 2), (short)bits);
        "data"u8.CopyTo(hs.Slice(36, 4));
        System.Buffers.Binary.BinaryPrimitives.WriteInt32LittleEndian(hs.Slice(40, 4), dataLen);
        return wav;
    }

    private static void TryDelete(string path)
    {
        try { if (File.Exists(path)) File.Delete(path); } catch { /* ignore */ }
    }
}
