using System.Diagnostics;
using System.Text;
using System.Text.Json;
using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Ai;
using AnimStudio.Application.Rendering;
using AnimStudio.Application.StoryAgent;
using AnimStudio.Application.Voices;
using AnimStudio.Domain.Ai;
using AnimStudio.Domain.Voices;
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
/// narrator audio using the configured AI speech chain (with automatic Windows local SAPI
/// fallback so videos never render silent with only mouth movement), measures exact clip
/// lengths, stitches a clean time-aligned WAV track, and syncs visual turn/subtitle timings.
/// </summary>
internal static class ProceduralSpeechSynthesizer
{
    private const double LeadInSeconds = 0.35;
    private const double PauseBetweenTurnsSeconds = 0.24;
    private const double ComedyStandardGapSeconds = 0.13;
    private const double ComedyInterruptGapSeconds = 0.05;
    private const double ComedyDeadpanBeatSeconds = 0.32;
    private const double MinTitleHoldSeconds = 1.25;
    private const double TailSeconds = 0.75;

    /// <summary>The fastest the narration may be sped up to fit a cap; past this Hindi speech starts to blur.</summary>
    private const double MaxSpeechTempo = 1.25;

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
        CancellationToken ct,
        VoiceProfile? customVoiceProfile = null,
        IStudioVoiceRenderer? studioVoiceRenderer = null)
    {
        if (!request.IncludeSpeech)
            return null;

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

        // Following the script exactly: every line at natural speed (no cap to fit into) and the video ends with the
        // narration instead of being padded with silence up to the target length.
        var fitCap = request.FollowScriptExactly ? null : request.MaxDurationSeconds;
        var minVideoSeconds = request.FollowScriptExactly ? ProceduralVideoRequest.MinSeconds : baseDurationSeconds;

        if (ai is not null && aiRegistry is not null)
        {
            var providers = ResolveProviders(aiRegistry, request.SpeechProviderId, customVoiceProfile, studioVoiceRenderer);
            foreach (var provider in providers)
            {
                var synthesized = await TrySynthesizeWithAiProviderAsync(
                    provider, request, initialPlan, speechTurns, langCode,
                    workspaceInputDir, userId, ai, ffmpegOptions, logger, ct,
                    customVoiceProfile, studioVoiceRenderer).ConfigureAwait(false);
                if (synthesized is not null)
                {
                    return await AssembleFinalSpeechTrackAsync(
                        synthesized.Value.ClipBytes, synthesized.Value.Durations,
                        initialPlan, speechTurns, spokenTitleOnly,
                        workspaceInputDir, minVideoSeconds, fitCap, ffmpegOptions,
                        provider.Id.Value, synthesized.Value.VoicesUsed, logger, ct).ConfigureAwait(false);
                }
            }
        }

        // Never fall back to offline OS Microsoft SAPI phonetic robotics on real videos; rely strictly on configured
        // AI/Google speech providers (gemini-tts -> gtts / kokoro / piper-local).
        logger?.LogWarning("Procedural video speech could not be synthesized from any configured AI/Google TTS provider.");
        return null;
    }

    private static async Task<(List<byte[]> ClipBytes, List<double> Durations, List<string> VoicesUsed)?> TrySynthesizeWithAiProviderAsync(
        ISpeechAiProvider provider,
        ProceduralVideoRequest request,
        ProceduralDialoguePlan initialPlan,
        List<ProceduralDialogueTurn> speechTurns,
        string langCode,
        string workspaceInputDir,
        string userId,
        IAiExecutor ai,
        FfmpegOptions ffmpegOptions,
        ILogger? logger,
        CancellationToken ct,
        VoiceProfile? customVoiceProfile = null,
        IStudioVoiceRenderer? studioVoiceRenderer = null)
    {
        var (voiceA, voiceB) = await ResolveVoicesAsync(provider, initialPlan, request, ct).ConfigureAwait(false);
        var isGemini = string.Equals(provider.Id.Value, KnownAiProviders.GeminiTts, StringComparison.OrdinalIgnoreCase)
            || provider.Id.Value.Contains("gemini", StringComparison.OrdinalIgnoreCase);
        var replicatedVoiceId = customVoiceProfile is not null
            ? MyVoiceReplication.VoiceFor(customVoiceProfile, provider.Id.Value)
            : null;
        var tunedVoiceId = customVoiceProfile is not null
            && replicatedVoiceId is null
            && !string.IsNullOrWhiteSpace(customVoiceProfile.TunedVoiceId)
            && provider.Id.Value.Contains("kokoro", StringComparison.OrdinalIgnoreCase)
                ? customVoiceProfile.TunedVoiceId
                : null;
        var canLocalReVoice = customVoiceProfile is not null
            && replicatedVoiceId is null
            && tunedVoiceId is null
            && !string.IsNullOrWhiteSpace(customVoiceProfile.StorageKey)
            && studioVoiceRenderer?.CanReVoice == true;

        var clipBytesList = new List<byte[]>(speechTurns.Count);
        var clipDurations = new List<double>(speechTurns.Count);
        var voicesUsed = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        string? overrideModel = null;

        for (var i = 0; i < speechTurns.Count; i++)
        {
            var turn = speechTurns[i];
            var spokenText = DialogueScriptParser.ToSpokenText(turn.Text, langCode);
            if (string.IsNullOrWhiteSpace(spokenText))
            {
                clipBytesList.Add([]);
                clipDurations.Add(FallbackSeconds(turn));
                continue;
            }

            request.Progress?.Report(new ProceduralRenderProgress(
                ProceduralRenderStages.VoicePercent(i, speechTurns.Count),
                $"Voice line {i + 1} of {speechTurns.Count} ({provider.Id.Value})"));

            var isComedy = IsComedyRequest(request, initialPlan);
            var speakerProfile = ResolveSpeakerProfile(initialPlan, turn);
            var useCustomForTurn = customVoiceProfile is not null
                && (!initialPlan.HasCharacters
                    || turn.Slot == DialogueSpeakerSlot.Narrator
                    || turn.SpeakerRole == CharacterVisualRole.Narrator
                    || (initialPlan.HasCharacters && turn.Slot == DialogueSpeakerSlot.Left && !speechTurns.Any(t => t.Slot == DialogueSpeakerSlot.Narrator)));

            var turnReplicatedVoiceId = useCustomForTurn ? replicatedVoiceId : null;
            var turnTunedVoiceId = useCustomForTurn ? tunedVoiceId : null;
            var baseProfileVoice = !string.IsNullOrWhiteSpace(customVoiceProfile?.BaseVoiceId)
                ? customVoiceProfile.BaseVoiceId
                : (isGemini ? voiceA : (turn.Slot == DialogueSpeakerSlot.Right ? voiceB : voiceA));

            var voiceId = turnReplicatedVoiceId is not null
                ? baseProfileVoice
                : turnTunedVoiceId is not null
                    ? turnTunedVoiceId
                    : isGemini
                        ? ResolveGeminiTurnVoice(initialPlan, request, turn, voiceA, voiceB, isComedy)
                        : (useCustomForTurn && canLocalReVoice ? baseProfileVoice : (turn.Slot == DialogueSpeakerSlot.Right ? voiceB : voiceA));
            var style = BuildSpeechStyle(turn, speakerProfile, isComedy, initialPlan.HasCharacters, langCode);
            var rate = ComputeSpeechRate(turn, speakerProfile, isComedy);

            Task<AiOutcome<AiSpeechResult>> CallSpeechAsync(string? model) =>
                ai.SpeechAsync(new AiSpeechRequest
                {
                    Text = spokenText,
                    VoiceId = voiceId,
                    Rate = rate,
                    LanguageCode = langCode,
                    Style = style,
                    Model = model,
                    ProviderId = provider.Id.Value,
                    ReplicatedVoiceId = turnReplicatedVoiceId
                }, new AiCallContext(null, string.IsNullOrWhiteSpace(userId) ? null : userId), ct);

            AiOutcome<AiSpeechResult> outcome;
            try
            {
                outcome = await CallSpeechAsync(overrideModel).ConfigureAwait(false);

                if (!outcome.IsSuccess
                    && string.Equals(outcome.ErrorCode, "endpoint-or-model-not-found", StringComparison.OrdinalIgnoreCase)
                    && overrideModel is null
                    && provider.Id.Value.Contains("gemini", StringComparison.OrdinalIgnoreCase))
                {
                    overrideModel = "gemini-2.5-flash-preview-tts";
                    outcome = await CallSpeechAsync(overrideModel).ConfigureAwait(false);
                }
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

            var rawAudio = speech.Content;
            var reVoicedLocally = false;
            if (useCustomForTurn && canLocalReVoice && customVoiceProfile!.StorageKey is { } sampleKey)
            {
                try
                {
                    var converted = await studioVoiceRenderer!.ReVoiceAsync(rawAudio, sampleKey, ct).ConfigureAwait(false);
                    if (converted.Length > 44)
                    {
                        rawAudio = converted;
                        reVoicedLocally = true;
                    }
                }
                catch (Exception ex) when (ex is not OperationCanceledException)
                {
                    logger?.LogWarning(ex, "Local studio voice conversion failed on turn {Index}; keeping base voice.", i);
                }
            }

            var normalizedWav = await EnsureStereo48kWavAsync(rawAudio, workspaceInputDir, i, ffmpegOptions, ct)
                .ConfigureAwait(false);
            if (normalizedWav is null)
            {
                logger?.LogWarning("Procedural speech turn {Index} returned unusable audio format.", i);
                return null;
            }

            var isCustomActiveOnTurn = turnReplicatedVoiceId is not null || turnTunedVoiceId is not null || reVoicedLocally;
            if (!isCustomActiveOnTurn)
            {
                var isSingleVoiceGoogle = string.Equals(provider.Id.Value, KnownAiProviders.GoogleTts, StringComparison.OrdinalIgnoreCase);
                normalizedWav = await ApplyTurnVoiceCharacterAsync(
                    normalizedWav,
                    turn,
                    speakerProfile,
                    isComedy,
                    isSingleVoiceGoogle,
                    workspaceInputDir,
                    200 + i,
                    ffmpegOptions,
                    ct).ConfigureAwait(false);
            }

            var dur = AiAudioValidator.TryGetWavDuration(normalizedWav) ?? speech.DurationSeconds ?? 0;
            if (dur <= 0.05)
                dur = Math.Max(1.2, spokenText.Length / 14.0);

            clipBytesList.Add(normalizedWav);
            clipDurations.Add(dur);
            if (turnReplicatedVoiceId is not null)
                voicesUsed.Add($"{customVoiceProfile!.Name} (Google)");
            else if (turnTunedVoiceId is not null)
                voicesUsed.Add($"{customVoiceProfile!.Name} (Tuned)");
            else if (reVoicedLocally)
                voicesUsed.Add($"{customVoiceProfile!.Name} (Converted)");
            else
                voicesUsed.Add(voiceId);
        }

        return (clipBytesList, clipDurations, [.. voicesUsed]);
    }

    /// <summary>
    /// Caption time for a line whose voice clip failed: its planned slot, but never longer than it takes to read the
    /// line (~13 characters a second), so a single failed clip cannot leave a long silent gap in the video.
    /// </summary>
    private static double FallbackSeconds(ProceduralDialogueTurn turn) =>
        Math.Max(1.0, Math.Min(turn.EndSeconds - turn.StartSeconds, 0.6 + (turn.Text?.Length ?? 0) / 13.0));

    private static async Task<ProceduralSpeechSynthesisResult?> AssembleFinalSpeechTrackAsync(
        List<byte[]> clipBytesList,
        List<double> clipDurations,
        ProceduralDialoguePlan initialPlan,
        List<ProceduralDialogueTurn> speechTurns,
        bool spokenTitleOnly,
        string workspaceInputDir,
        int baseDurationSeconds,
        int? maxDurationSeconds,
        FfmpegOptions ffmpegOptions,
        string providerId,
        IReadOnlyList<string> voicesUsed,
        ILogger? logger,
        CancellationToken ct)
    {
        var referenceClip = clipBytesList.FirstOrDefault(b => b.Length > 44);
        if (referenceClip is null)
            return null;

        var isComedyTrack = IsComedyPlan(initialPlan);
        var defaultTurnGap = isComedyTrack ? ComedyStandardGapSeconds : PauseBetweenTurnsSeconds;

        // Keep the finished video inside its cap (a Short must stay <= 180s): speed the voices up a little
        // and, when that is not enough, drop middle lines so the opening and the ending moral still play.
        var memePauseByTurnIdx = initialPlan.Memes
            .GroupBy(m => m.AfterTurnIndex)
            .ToDictionary(g => g.Key, g => Math.Clamp(g.First().Seconds * 0.65, 0.72, 1.05));
        var extraMemePauseSeconds = memePauseByTurnIdx.Values.Sum();
        var fit = SpeechFitPlanner.Plan(
            clipDurations, maxDurationSeconds, LeadInSeconds + extraMemePauseSeconds, defaultTurnGap, TailSeconds, MaxSpeechTempo);
        var speechWavPath = Path.Combine(workspaceInputDir, "speech.wav");

        var built = await WriteSpeechTrackAsync(fit.KeptIndices).ConfigureAwait(false);
        if (built is null)
            return null;
        var (updatedTurns, cursor) = built.Value;

        var tempo = fit.Tempo;
        if (maxDurationSeconds is > 0 and var capSec && cursor + TailSeconds > capSec + 0.05)
            tempo = Math.Clamp(Math.Max(tempo, cursor / Math.Max(0.5, capSec - LeadInSeconds - TailSeconds)), 1.0, MaxSpeechTempo);
        if (tempo > 1.001)
        {
            if (await TryApplyTempoAsync(speechWavPath, tempo, ffmpegOptions, logger, ct).ConfigureAwait(false))
            {
                var actualDur = AiAudioValidator.TryGetWavDuration(await File.ReadAllBytesAsync(speechWavPath, ct).ConfigureAwait(false));
                var scale = actualDur is > 0.2 && cursor > 0.2 ? (cursor / actualDur.Value) : tempo;
                updatedTurns = [.. updatedTurns.Select(t => t.IsTitleHook ? t : t with
                {
                    StartSeconds = Math.Round(t.StartSeconds / scale, 3),
                    EndSeconds = Math.Round(t.EndSeconds / scale, 3)
                })];
                cursor = actualDur ?? (cursor / tempo);
            }
            else
            {
                // No speed-up available: fit by dropping lines alone.
                var plain = SpeechFitPlanner.Plan(
                    clipDurations, maxDurationSeconds, LeadInSeconds + extraMemePauseSeconds, defaultTurnGap, TailSeconds, maxTempo: 1.0);
                built = await WriteSpeechTrackAsync(plain.KeptIndices).ConfigureAwait(false);
                if (built is null)
                    return null;
                (updatedTurns, cursor) = built.Value;
                fit = plain;
                tempo = 1.0;
            }
        }

        if (fit.KeptIndices.Count < speechTurns.Count || tempo > 1.001)
        {
            logger?.LogInformation(
                "Narration fitted into the {Max}s cap: kept {Kept}/{Total} lines at {Tempo:0.00}x speed ({Seconds:0.0}s).",
                maxDurationSeconds, fit.KeptIndices.Count, speechTurns.Count, tempo, cursor);
        }

        var totalSeconds = Math.Clamp(
            (int)Math.Ceiling(Math.Max(baseDurationSeconds, cursor + TailSeconds)),
            ProceduralVideoRequest.MinSeconds,
            ProceduralVideoRequest.MaxSeconds);
        if (maxDurationSeconds is > 0 and var cap)
            totalSeconds = Math.Min(totalSeconds, Math.Max(ProceduralVideoRequest.MinSeconds, cap));

        var updatedPlan = DialogueScriptParser.WithMeasuredTurns(initialPlan, updatedTurns);
        return new ProceduralSpeechSynthesisResult(
            speechWavPath,
            updatedPlan,
            totalSeconds,
            providerId,
            voicesUsed);

        async Task<(List<ProceduralDialogueTurn> Turns, double Cursor)?> WriteSpeechTrackAsync(IReadOnlyList<int> kept)
        {
            var nonEmptyClips = new List<byte[]>(kept.Count * 2 + 2);
            var leadGap = BuildSilenceWavLike(referenceClip, LeadInSeconds);
            var at = 0.0;
            if (leadGap is not null)
            {
                nonEmptyClips.Add(leadGap);
                at += AiAudioValidator.TryGetWavDuration(leadGap) ?? LeadInSeconds;
            }

            var turns = new List<ProceduralDialogueTurn>(kept.Count + 1);

            var titleTurn = !spokenTitleOnly ? initialPlan.Turns.FirstOrDefault(t => t.IsTitleHook) : null;
            if (titleTurn is not null)
            {
                turns.Add(titleTurn with
                {
                    StartSeconds = 0.04,
                    EndSeconds = Math.Round(Math.Clamp(at + 1.15, MinTitleHoldSeconds, 1.65), 3)
                });
            }

            for (var k = 0; k < kept.Count; k++)
            {
                var i = kept[k];
                var clip = clipBytesList[i];
                var clipDur = clip.Length > 44
                    ? (AiAudioValidator.TryGetWavDuration(clip) ?? clipDurations[i])
                    : clipDurations[i];
                if (clip.Length > 44)
                {
                    nonEmptyClips.Add(clip);
                }
                else
                {
                    var sfxOnlyGap = BuildSilenceWavLike(referenceClip, clipDur);
                    if (sfxOnlyGap is not null)
                    {
                        nonEmptyClips.Add(sfxOnlyGap);
                        clipDur = AiAudioValidator.TryGetWavDuration(sfxOnlyGap) ?? clipDur;
                    }
                }

                turns.Add(speechTurns[i] with
                {
                    StartSeconds = Math.Round(at, 3),
                    EndSeconds = Math.Round(at + clipDur, 3)
                });

                at += clipDur;

                // Dedicated silent reaction beat after turns carrying a [MEME] cue so memes & SFX never stomp dialogue;
                // otherwise use crisp comedy interruption gaps (0.05s) or deadpan stares (0.32s).
                var hasMemeHere = memePauseByTurnIdx.TryGetValue(speechTurns[i].Index, out var memeBeat);
                if (k < kept.Count - 1)
                {
                    var nextTurn = speechTurns[kept[k + 1]];
                    var pauseSecs = hasMemeHere
                        ? memeBeat
                        : ResolveTurnGapSeconds(speechTurns[i], nextTurn, isComedyTrack);
                    var pause = BuildSilenceWavLike(referenceClip, pauseSecs);
                    if (pause is not null)
                    {
                        nonEmptyClips.Add(pause);
                        at += AiAudioValidator.TryGetWavDuration(pause) ?? pauseSecs;
                    }
                    else
                    {
                        at += pauseSecs;
                    }
                }
                else if (hasMemeHere)
                {
                    var tailMemeGap = BuildSilenceWavLike(referenceClip, memeBeat);
                    if (tailMemeGap is not null)
                    {
                        nonEmptyClips.Add(tailMemeGap);
                        at += AiAudioValidator.TryGetWavDuration(tailMemeGap) ?? memeBeat;
                    }
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

            await File.WriteAllBytesAsync(speechWavPath, joinedWav, ct).ConfigureAwait(false);
            return (turns, at);
        }
    }

    /// <summary>Speeds a WAV up in place with FFmpeg's pitch-preserving <c>atempo</c>; false when FFmpeg is unavailable or fails.</summary>
    private static async Task<bool> TryApplyTempoAsync(
        string wavPath,
        double tempo,
        FfmpegOptions ffmpegOptions,
        ILogger? logger,
        CancellationToken ct)
    {
        var outPath = Path.ChangeExtension(wavPath, ".tempo.wav");
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
            "-i", wavPath,
            "-af", $"atempo={tempo.ToString("0.000", System.Globalization.CultureInfo.InvariantCulture)},aresample=48000,aformat=channel_layouts=stereo",
            "-c:a", "pcm_s16le",
            outPath
        })
        {
            psi.ArgumentList.Add(arg);
        }

        try
        {
            using var proc = Process.Start(psi);
            if (proc is null) return false;

            proc.StandardInput.Close();
            using var timeout = CancellationTokenSource.CreateLinkedTokenSource(ct);
            timeout.CancelAfter(TimeSpan.FromSeconds(90));
            _ = proc.StandardError.ReadToEndAsync(timeout.Token);
            await proc.WaitForExitAsync(timeout.Token).ConfigureAwait(false);

            if (proc.ExitCode != 0 || !File.Exists(outPath))
                return false;

            File.Move(outPath, wavPath, overwrite: true);
            return true;
        }
        catch (Exception ex) when (ex is not OperationCanceledException || !ct.IsCancellationRequested)
        {
            logger?.LogWarning(ex, "Could not speed up the narration with FFmpeg atempo; dropping lines instead.");
            return false;
        }
        finally
        {
            TryDelete(outPath);
        }
    }

    internal static IReadOnlyList<ISpeechAiProvider> ResolveProviders(
        IAiProviderRegistry registry,
        string? preferredProviderId,
        VoiceProfile? customVoiceProfile = null,
        IStudioVoiceRenderer? studioVoiceRenderer = null)
    {
        var configured = registry.SpeechChain().Where(p => p.IsConfigured).ToList();
        var priorityId = !string.IsNullOrWhiteSpace(preferredProviderId)
            ? preferredProviderId.Trim()
            : null;

        if (priorityId is null && customVoiceProfile is not null)
        {
            if (customVoiceProfile.GoogleVoiceProviderId is { Length: > 0 } gProvider
                && MyVoiceReplication.VoiceFor(customVoiceProfile, gProvider) is not null
                && configured.Any(p => string.Equals(p.Id.Value, gProvider, StringComparison.OrdinalIgnoreCase)))
            {
                priorityId = gProvider;
            }
            else if (!string.IsNullOrWhiteSpace(customVoiceProfile.TunedVoiceId)
                && configured.Any(p => p.Id.Value.Contains("kokoro", StringComparison.OrdinalIgnoreCase)))
            {
                priorityId = configured.First(p => p.Id.Value.Contains("kokoro", StringComparison.OrdinalIgnoreCase)).Id.Value;
            }
            else if (studioVoiceRenderer?.CanReVoice == true
                && !string.IsNullOrWhiteSpace(customVoiceProfile.StorageKey)
                && configured.Any(p => string.Equals(p.Id.Value, KnownAiProviders.GoogleTts, StringComparison.OrdinalIgnoreCase)))
            {
                // Local ReVoice needs fast keyless base speech to convert into the creator's own timbre.
                priorityId = KnownAiProviders.GoogleTts;
            }
        }

        if (string.IsNullOrWhiteSpace(priorityId))
            return configured;

        var preferred = configured
            .Where(p => string.Equals(p.Id.Value, priorityId, StringComparison.OrdinalIgnoreCase))
            .ToList();
        var rest = configured
            .Where(p => !string.Equals(p.Id.Value, priorityId, StringComparison.OrdinalIgnoreCase));
        return [.. preferred, .. rest];
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
            var isComedy = IsComedyRequest(request, plan);
            (voiceA, voiceB) = SelectGeminiCastVoices(plan, isComedy);
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

    internal static (string VoiceA, string VoiceB) SelectGeminiCastVoices(ProceduralDialoguePlan plan, bool isComedy)
    {
        var leftFemale = IsLikelyFemaleSpeaker(plan.LeftCharacter?.Name, plan.LeftCharacter?.Role);
        var rightFemale = IsLikelyFemaleSpeaker(plan.RightCharacter?.Name, plan.RightCharacter?.Role);

        var voiceA = leftFemale
            ? "Kore"
            : plan.LeftCharacter?.Role switch
            {
                CharacterVisualRole.KingCrown => "Orus",
                CharacterVisualRole.SageRishi => isComedy ? "Algenib" : "Rasalgethi",
                CharacterVisualRole.Divine => "Sadaltager",
                _ => isComedy ? "Fenrir" : "Orus"
            };

        var voiceB = rightFemale
            ? (string.Equals(voiceA, "Aoede", StringComparison.OrdinalIgnoreCase) ? "Leda" : "Aoede")
            : plan.RightCharacter?.Role switch
            {
                CharacterVisualRole.KingCrown => "Alnilam",
                CharacterVisualRole.SageRishi => isComedy ? "Algenib" : "Sadaltager",
                CharacterVisualRole.Divine => "Sulafat",
                _ => isComedy ? "Puck" : "Charon"
            };

        if (string.Equals(voiceA, voiceB, StringComparison.OrdinalIgnoreCase))
            voiceB = rightFemale ? "Zephyr" : (string.Equals(voiceA, "Puck", StringComparison.OrdinalIgnoreCase) ? "Algenib" : "Puck");

        return (voiceA, voiceB);
    }

    internal static string ResolveGeminiTurnVoice(
        ProceduralDialoguePlan plan,
        ProceduralVideoRequest request,
        ProceduralDialogueTurn turn,
        string voiceA,
        string voiceB,
        bool isComedy)
    {
        if (ResolveSpeakerProfile(plan, turn) is { VoiceId.Length: > 0 } castProfile)
            return castProfile.VoiceId.Trim();

        var speaker = turn.SpeakerName?.Trim();
        var matchesLeft = !string.IsNullOrWhiteSpace(speaker)
            && !string.IsNullOrWhiteSpace(plan.LeftCharacter?.Name)
            && string.Equals(speaker, plan.LeftCharacter.Name.Trim(), StringComparison.OrdinalIgnoreCase);
        var matchesRight = !string.IsNullOrWhiteSpace(speaker)
            && !string.IsNullOrWhiteSpace(plan.RightCharacter?.Name)
            && string.Equals(speaker, plan.RightCharacter.Name.Trim(), StringComparison.OrdinalIgnoreCase);

        if (!matchesLeft && !matchesRight && !string.IsNullOrWhiteSpace(speaker))
        {
            var supIdx = -1;
            for (var k = 0; k < plan.Supporting.Count; k++)
            {
                if (string.Equals(plan.Supporting[k].Name.Trim(), speaker, StringComparison.OrdinalIgnoreCase))
                {
                    supIdx = k;
                    break;
                }
            }

            if (supIdx >= 0 || (plan.LeftCharacter is not null && plan.RightCharacter is not null))
            {
                var slotIdx = supIdx >= 0 ? supIdx : Math.Abs(speaker.GetHashCode(StringComparison.OrdinalIgnoreCase));
                var role = supIdx >= 0 ? plan.Supporting[supIdx].Role : turn.SpeakerRole;
                if (IsLikelyFemaleSpeaker(speaker, role))
                {
                    var femalePool = new[] { "Aoede", "Leda", "Zephyr", "Kore" };
                    foreach (var v in femalePool)
                    {
                        if (!string.Equals(v, voiceA, StringComparison.OrdinalIgnoreCase)
                            && !string.Equals(v, voiceB, StringComparison.OrdinalIgnoreCase))
                            return v;
                    }
                    return femalePool[slotIdx % femalePool.Length];
                }

                var malePool = isComedy
                    ? new[] { "Algenib", "Sadachbia", "Alnilam", "Orus", "Rasalgethi" }
                    : new[] { "Charon", "Alnilam", "Rasalgethi", "Sadaltager" };
                for (var attempt = 0; attempt < malePool.Length; attempt++)
                {
                    var candidate = malePool[(Math.Max(0, slotIdx) + attempt) % malePool.Length];
                    if (!string.Equals(candidate, voiceA, StringComparison.OrdinalIgnoreCase)
                        && !string.Equals(candidate, voiceB, StringComparison.OrdinalIgnoreCase))
                        return candidate;
                }
                return malePool[Math.Max(0, slotIdx) % malePool.Length];
            }
        }

        if (turn.Slot == DialogueSpeakerSlot.Right)
            return !string.IsNullOrWhiteSpace(request.SpeakerBVoiceId) ? request.SpeakerBVoiceId.Trim() : voiceB;
        return !string.IsNullOrWhiteSpace(request.SpeakerAVoiceId) ? request.SpeakerAVoiceId.Trim() : voiceA;
    }

    internal static bool IsLikelyFemaleSpeaker(string? speakerName, CharacterVisualRole? role)
    {
        if (role == CharacterVisualRole.Divine && string.IsNullOrWhiteSpace(speakerName))
            return false;
        if (string.IsNullOrWhiteSpace(speakerName))
            return false;

        var s = speakerName.ToLowerInvariant();
        foreach (var marker in FemaleSpeakerMarkers)
        {
            if (s.Contains(marker, StringComparison.Ordinal))
                return true;
        }
        return false;
    }

    private static readonly string[] FemaleSpeakerMarkers =
    [
        "आंटी", "अम्मा", "दादी", "नानी", "मम्मी", "माँ", "माता", "दीदी", "भाभी", "बहन",
        "बेटी", "चची", "चाची", "ताई", "बुआ", "मामी", "मौसी", "रानी", "सुनीति", "सुरुचि",
        "सीता", "राधा", "पिंकी", "प्रिया", "मीरा", "देवी", "लक्ष्मी", "सरस्वती", "पार्वती",
        "aunty", "aunt", "mom", "mother", "sister", "queen", "girl", "lady",
        "dadi", "nani", "bhabhi", "didi", "rani", "suniti", "suruchi", "seeta", "radha", "pinki", "priya"
    ];

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
            return TrimLeadingAndTrailingSilence(rawAudio);

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
            {
                var converted = await File.ReadAllBytesAsync(dstPath, ct).ConfigureAwait(false);
                return TrimLeadingAndTrailingSilence(converted);
            }
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

        return kind == AiAudioValidator.Wav ? TrimLeadingAndTrailingSilence(rawAudio) : null;
    }

    /// <summary>
    /// Strips dead silence before speech onset and after speech completion from a 16-bit PCM WAV clip
    /// while preserving a clean 30ms lead-in and 50ms tail with 10ms soft fades. Prevents TTS model
    /// padding from delaying dialogue turn transitions, camera cuts, SFX, or karaoke subtitles.
    /// </summary>
    internal static byte[] TrimLeadingAndTrailingSilence(byte[] wav)
    {
        if (wav.Length < 44
            || !wav.AsSpan(0, 4).SequenceEqual("RIFF"u8)
            || !wav.AsSpan(8, 4).SequenceEqual("WAVE"u8))
        {
            return wav;
        }

        ushort format = 0;
        ushort channels = 0;
        var sampleRate = 0;
        ushort bits = 0;
        var dataOffset = -1;
        var dataLen = 0;

        var offset = 12;
        while (offset + 8 <= wav.Length)
        {
            var id = wav.AsSpan(offset, 4);
            var size = System.Buffers.Binary.BinaryPrimitives.ReadInt32LittleEndian(wav.AsSpan(offset + 4, 4));
            var body = offset + 8;
            if (id.SequenceEqual("fmt "u8) && body + 16 <= wav.Length)
            {
                format = System.Buffers.Binary.BinaryPrimitives.ReadUInt16LittleEndian(wav.AsSpan(body, 2));
                channels = System.Buffers.Binary.BinaryPrimitives.ReadUInt16LittleEndian(wav.AsSpan(body + 2, 2));
                sampleRate = (int)System.Buffers.Binary.BinaryPrimitives.ReadUInt32LittleEndian(wav.AsSpan(body + 4, 4));
                bits = System.Buffers.Binary.BinaryPrimitives.ReadUInt16LittleEndian(wav.AsSpan(body + 14, 2));
            }
            else if (id.SequenceEqual("data"u8))
            {
                dataOffset = body;
                dataLen = Math.Min(Math.Max(0, size), wav.Length - body);
                break;
            }
            if (size <= 0) break;
            offset = body + size + (size & 1);
        }

        if (format != 1 || channels == 0 || sampleRate <= 0 || bits != 16 || dataOffset < 0)
            return wav;

        var blockAlign = channels * 2;
        var totalFrames = dataLen / blockAlign;
        if (totalFrames < sampleRate / 4) // Under 250ms: never trim further
            return wav;

        var windowFrames = Math.Max(1, sampleRate / 100); // 10ms window
        var firstActiveFrame = -1;
        var lastActiveFrame = -1;

        for (var start = 0; start < totalFrames; start += windowFrames)
        {
            var end = Math.Min(totalFrames, start + windowFrames);
            double sumSq = 0;
            double maxAbs = 0;
            var count = 0;
            for (var f = start; f < end; f++)
            {
                var p = dataOffset + f * blockAlign;
                var s = System.Buffers.Binary.BinaryPrimitives.ReadInt16LittleEndian(wav.AsSpan(p, 2)) / 32768.0;
                var a = Math.Abs(s);
                if (a > maxAbs) maxAbs = a;
                sumSq += s * s;
                count++;
            }

            var rms = count > 0 ? Math.Sqrt(sumSq / count) : 0;
            if (rms >= 0.008 || maxAbs >= 0.025)
            {
                if (firstActiveFrame < 0) firstActiveFrame = start;
                lastActiveFrame = end;
            }
        }

        if (firstActiveFrame < 0 || lastActiveFrame <= firstActiveFrame)
            return wav;

        var preRoll = (int)Math.Round(0.03 * sampleRate);
        var tailRoll = (int)Math.Round(0.05 * sampleRate);
        var trimStart = Math.Max(0, firstActiveFrame - preRoll);
        var trimEnd = Math.Min(totalFrames, lastActiveFrame + tailRoll);
        var minKeep = (int)Math.Round(0.30 * sampleRate);
        if (trimEnd - trimStart < minKeep)
            return wav;
        if (trimStart <= preRoll && trimEnd >= totalFrames - tailRoll)
            return wav;

        var sliceBytes = (trimEnd - trimStart) * blockAlign;
        var result = new byte[44 + sliceBytes];
        var hs = result.AsSpan();
        "RIFF"u8.CopyTo(hs[..4]);
        System.Buffers.Binary.BinaryPrimitives.WriteInt32LittleEndian(hs.Slice(4, 4), 36 + sliceBytes);
        "WAVE"u8.CopyTo(hs.Slice(8, 4));
        "fmt "u8.CopyTo(hs.Slice(12, 4));
        System.Buffers.Binary.BinaryPrimitives.WriteInt32LittleEndian(hs.Slice(16, 4), 16);
        System.Buffers.Binary.BinaryPrimitives.WriteInt16LittleEndian(hs.Slice(20, 2), 1);
        System.Buffers.Binary.BinaryPrimitives.WriteInt16LittleEndian(hs.Slice(22, 2), (short)channels);
        System.Buffers.Binary.BinaryPrimitives.WriteInt32LittleEndian(hs.Slice(24, 4), sampleRate);
        System.Buffers.Binary.BinaryPrimitives.WriteInt32LittleEndian(hs.Slice(28, 4), sampleRate * blockAlign);
        System.Buffers.Binary.BinaryPrimitives.WriteInt16LittleEndian(hs.Slice(32, 2), (short)blockAlign);
        System.Buffers.Binary.BinaryPrimitives.WriteInt16LittleEndian(hs.Slice(34, 2), (short)bits);
        "data"u8.CopyTo(hs.Slice(36, 4));
        System.Buffers.Binary.BinaryPrimitives.WriteInt32LittleEndian(hs.Slice(40, 4), sliceBytes);

        Buffer.BlockCopy(wav, dataOffset + trimStart * blockAlign, result, 44, sliceBytes);

        // Apply gentle 10ms edge fade-in / fade-out on trimmed boundaries to avoid clicks.
        var fadeFrames = Math.Min((trimEnd - trimStart) / 4, (int)Math.Round(0.01 * sampleRate));
        for (var f = 0; f < fadeFrames; f++)
        {
            var gIn = trimStart > 0 ? 0.5 * (1.0 - Math.Cos(Math.PI * f / fadeFrames)) : 1.0;
            var gOut = trimEnd < totalFrames ? 0.5 * (1.0 - Math.Cos(Math.PI * f / fadeFrames)) : 1.0;
            for (var c = 0; c < channels; c++)
            {
                if (gIn < 1.0)
                {
                    var pIn = 44 + f * blockAlign + c * 2;
                    var s = (short)Math.Round(System.Buffers.Binary.BinaryPrimitives.ReadInt16LittleEndian(result.AsSpan(pIn, 2)) * gIn);
                    System.Buffers.Binary.BinaryPrimitives.WriteInt16LittleEndian(result.AsSpan(pIn, 2), s);
                }
                if (gOut < 1.0)
                {
                    var pOut = 44 + ((trimEnd - trimStart - 1 - f) * blockAlign) + c * 2;
                    var s = (short)Math.Round(System.Buffers.Binary.BinaryPrimitives.ReadInt16LittleEndian(result.AsSpan(pOut, 2)) * gOut);
                    System.Buffers.Binary.BinaryPrimitives.WriteInt16LittleEndian(result.AsSpan(pOut, 2), s);
                }
            }
        }

        return result;
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

    internal static bool IsComedyRequest(ProceduralVideoRequest request, ProceduralDialoguePlan plan) =>
        string.Equals(request.EventType, "FunnyComedy", StringComparison.OrdinalIgnoreCase)
        || request.Theme == ProceduralSceneTheme.ComedyStage3D
        || request.EnableComedySfx
        || request.SparseComedyAudio
        || IsComedyPlan(plan);

    internal static bool IsComedyPlan(ProceduralDialoguePlan plan) =>
        plan.LeftCharacter?.Role is CharacterVisualRole.ComicBobble or CharacterVisualRole.CartoonTank
        || plan.RightCharacter?.Role is CharacterVisualRole.ComicBobble or CharacterVisualRole.CartoonTank
        || plan.Memes.Count > 0
        || plan.Turns.Any(t => !t.IsTitleHook && (
            t.Emotion is "angry" or "laughing" or "sarcastic" or "mischievous"
            || t.Action is "cutting" or "spraying" or "punching" or "kicking" or "slapForehead" or "removingTowel" or "shockedFall"));

    internal static ProceduralCharacterProfile? ResolveSpeakerProfile(ProceduralDialoguePlan plan, ProceduralDialogueTurn turn)
    {
        var speaker = turn.SpeakerName?.Trim();
        if (!string.IsNullOrWhiteSpace(speaker))
        {
            if (plan.LeftCharacter is not null && string.Equals(plan.LeftCharacter.Name.Trim(), speaker, StringComparison.OrdinalIgnoreCase))
                return plan.LeftCharacter;
            if (plan.RightCharacter is not null && string.Equals(plan.RightCharacter.Name.Trim(), speaker, StringComparison.OrdinalIgnoreCase))
                return plan.RightCharacter;
            var sup = plan.Supporting.FirstOrDefault(s => string.Equals(s.Name.Trim(), speaker, StringComparison.OrdinalIgnoreCase));
            if (sup is not null)
                return sup;
        }

        if (turn.Slot == DialogueSpeakerSlot.Left && plan.LeftCharacter is not null)
            return plan.LeftCharacter;
        if (turn.Slot == DialogueSpeakerSlot.Right && plan.RightCharacter is not null)
            return plan.RightCharacter;
        return null;
    }

    internal static string BuildSpeechStyle(
        ProceduralDialogueTurn turn,
        ProceduralCharacterProfile? speakerProfile,
        bool isComedy,
        bool hasCharacters,
        string langCode)
    {
        var emotion = (turn.Emotion ?? "calm").Trim().ToLowerInvariant();
        if (!hasCharacters && !isComedy)
            return "Warm, clear, engaging narrator tone with balanced pacing";

        if (!isComedy)
        {
            if (emotion == "angry")
                return "Firm, intense, commanding dramatic dialogue delivery, clear pronunciation";
            if (emotion == "surprised")
                return "Awed, heightened emotional reaction dialogue delivery, clear pronunciation";
            if (emotion == "sad")
                return "Gentle, poignant emotional storytelling delivery, clear pronunciation";

            return turn.Slot == DialogueSpeakerSlot.Right
                ? "Curious, warm, expressive dialogue delivery, clear pronunciation"
                : "Calm, wise, engaging storytelling dialogue tone, clear expressive delivery";
        }

        var role = speakerProfile?.Role ?? turn.SpeakerRole;
        var persona = turn.Slot switch
        {
            DialogueSpeakerSlot.Left => role switch
            {
                CharacterVisualRole.SageRishi => "gruff irritable elder uncle scolding tone",
                CharacterVisualRole.KingCrown => "loud street-smart bossy swagger",
                _ => "assertive grumpy desi comic character"
            },
            DialogueSpeakerSlot.Right => role switch
            {
                CharacterVisualRole.KingCrown => "booming overconfident comic rival",
                CharacterVisualRole.SageRishi => "deadpan dry comic elder",
                _ => "frantic high-energy cheeky comic youth"
            },
            _ => "sharp animated bystander comic voice"
        };

        var emotionCue = emotion switch
        {
            "angry" => "Explosive angry furious shouting at top lung capacity, cracking exasperated MJO comedy rage, biting impatient interruption",
            "surprised" or "scared" => "Loud panicked shouting disbelief, frantic high-pitch gasp and rapid comic outrage",
            "laughing" => "Sharp mocking cackle and wicked giggling teasing belly-laugh",
            "proud" or "sarcastic" => "Loud cocky irritated swagger and snapping sarcastic comedy pressure",
            "confused" => "Incredulous aggressive yelling confusion, sharp impatient irritated interrogation",
            "sad" => "Exaggerated loud comical wailing whine and dramatic outrage",
            _ => "Heated irritated animated comedy snapping, high-energy urgent exasperation, punchy UP/Kanpuria outburst cadence"
        };

        var dialect = string.Equals(langCode, "hi", StringComparison.OrdinalIgnoreCase)
            ? "colloquial UP/Haryana Hindi flavour"
            : "vivid animated comedy delivery";

        return $"{emotionCue}; {persona}; {dialect}";
    }

    internal static double ComputeSpeechRate(ProceduralDialogueTurn turn, ProceduralCharacterProfile? speakerProfile, bool isComedy)
    {
        if (!isComedy) return 1.0;
        return (turn.Emotion ?? string.Empty).Trim().ToLowerInvariant() switch
        {
            "angry" => 1.18,
            "surprised" or "scared" => 1.16,
            "laughing" or "sarcastic" or "mischievous" => 1.11,
            "proud" or "confused" => 1.09,
            "sad" => 0.98,
            _ => 1.10
        };
    }

    internal static double ResolveTurnGapSeconds(ProceduralDialogueTurn current, ProceduralDialogueTurn next, bool isComedy)
    {
        if (!isComedy) return PauseBetweenTurnsSeconds;

        var trimmed = (current.Text ?? string.Empty).TrimEnd();
        var interruptedMidLine = trimmed.EndsWith("...", StringComparison.Ordinal)
            || trimmed.EndsWith('\u2026')
            || trimmed.EndsWith('\u2014')
            || trimmed.EndsWith('-');
        var nextEmotion = (next.Emotion ?? string.Empty).Trim().ToLowerInvariant();
        var currentEmotion = (current.Emotion ?? string.Empty).Trim().ToLowerInvariant();

        if (interruptedMidLine || nextEmotion is "angry" or "surprised" or "scared" || next.Action is "shockedFall")
            return ComedyInterruptGapSeconds;

        if (currentEmotion == "angry" && nextEmotion is "calm" or "sad" or "confused")
            return ComedyDeadpanBeatSeconds;

        return ComedyStandardGapSeconds;
    }

    internal static (double PitchRatio, double SpeedFactor, double VolumeGain, double MidBoostDb) ResolveVoiceCharacterDsp(
        ProceduralDialogueTurn turn,
        ProceduralCharacterProfile? speakerProfile,
        bool isComedy,
        bool isSingleVoiceGoogle = false)
    {
        if (!isComedy)
        {
            if (!isSingleVoiceGoogle || turn.Slot == DialogueSpeakerSlot.Narrator)
                return (1.0, 1.0, 1.0, 0.0);

            var gtRole = speakerProfile?.Role ?? turn.SpeakerRole;
            if (IsLikelyFemaleSpeaker(turn.SpeakerName, gtRole) || gtRole == CharacterVisualRole.ChildDevotee)
                return (1.03, 1.01, 1.0, 0.0);
            if (gtRole is CharacterVisualRole.Divine or CharacterVisualRole.SageRishi or CharacterVisualRole.KingCrown)
                return (0.96, 1.0, 1.02, 0.0);
            return (0.98, 1.0, 1.0, 0.0);
        }

        var role = speakerProfile?.Role ?? turn.SpeakerRole;
        var basePitch = turn.Slot switch
        {
            DialogueSpeakerSlot.Left => role is CharacterVisualRole.SageRishi or CharacterVisualRole.KingCrown ? 0.93 : 0.95,
            DialogueSpeakerSlot.Right => role is CharacterVisualRole.SageRishi ? 0.94 : role is CharacterVisualRole.KingCrown ? 0.98 : 1.07,
            _ => Math.Abs((turn.SpeakerName ?? string.Empty).GetHashCode(StringComparison.OrdinalIgnoreCase)) % 2 == 0 ? 0.92 : 1.05
        };

        var emotion = (turn.Emotion ?? string.Empty).Trim().ToLowerInvariant();
        var (emoPitchMul, emoSpeed, volGain, midDb) = emotion switch
        {
            "angry" => (1.04, 1.13, 1.32, 4.0),
            "surprised" or "scared" => (1.06, 1.10, 1.18, 2.5),
            "laughing" or "sarcastic" or "mischievous" => (1.02, 1.06, 1.12, 1.5),
            "proud" => (0.99, 1.03, 1.10, 1.5),
            "sad" => (0.97, 0.96, 0.95, 0.0),
            _ => (1.00, 1.02, 1.00, 0.5)
        };

        var pitch = Math.Clamp(basePitch * emoPitchMul, 0.86, 1.18);
        var speed = Math.Clamp(emoSpeed, 0.90, 1.22);
        return (Math.Round(pitch, 3), Math.Round(speed, 3), volGain, midDb);
    }

    private static async Task<byte[]> ApplyTurnVoiceCharacterAsync(
        byte[] wav48kStereo,
        ProceduralDialogueTurn turn,
        ProceduralCharacterProfile? speakerProfile,
        bool isComedy,
        bool isSingleVoiceGoogle,
        string dir,
        int index,
        FfmpegOptions ffmpegOptions,
        CancellationToken ct)
    {
        if ((!isComedy && !isSingleVoiceGoogle) || wav48kStereo.Length <= 44 || !IsStereo48kPcmWav(wav48kStereo))
            return wav48kStereo;

        var (pitch, speed, volGain, midDb) = ResolveVoiceCharacterDsp(turn, speakerProfile, isComedy, isSingleVoiceGoogle);
        if (Math.Abs(pitch - 1.0) < 0.01 && Math.Abs(speed - 1.0) < 0.01 && Math.Abs(volGain - 1.0) < 0.02 && midDb <= 0.1)
            return wav48kStereo;

        var srcPath = Path.Combine(dir, $"turn_{index:D3}.pre.wav");
        var dstPath = Path.Combine(dir, $"turn_{index:D3}.dsp.wav");
        var ffmpegPath = string.IsNullOrWhiteSpace(ffmpegOptions.FfmpegPath) ? "ffmpeg" : ffmpegOptions.FfmpegPath;

        var shiftedRate = Math.Clamp((int)Math.Round(48_000 * pitch), 38_000, 60_000);
        var tempoFix = Math.Clamp(speed / pitch, 0.55, 1.85);
        var inv = System.Globalization.CultureInfo.InvariantCulture;

        var afParts = new List<string>
        {
            $"asetrate={shiftedRate}",
            "aresample=48000",
            $"atempo={tempoFix.ToString("0.000", inv)}"
        };
        if (midDb > 0.2)
            afParts.Add($"equalizer=f=1900:t=q:w=1.1:g={midDb.ToString("0.0", inv)},equalizer=f=3200:t=q:w=1.2:g={(midDb * 0.75).ToString("0.0", inv)}");
        if (volGain > 1.15)
            afParts.Add("acompressor=threshold=-20dB:ratio=3.5:attack=4:release=85:makeup=2.0dB");
        if (Math.Abs(volGain - 1.0) >= 0.02)
            afParts.Add($"volume={volGain.ToString("0.00", inv)}");
        afParts.Add("alimiter=limit=0.95");
        afParts.Add("aformat=sample_fmts=s16:channel_layouts=stereo");

        await File.WriteAllBytesAsync(srcPath, wav48kStereo, ct).ConfigureAwait(false);
        var psi = new ProcessStartInfo
        {
            FileName = ffmpegPath,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            RedirectStandardInput = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };
        foreach (var arg in new[] { "-y", "-i", srcPath, "-af", string.Join(',', afParts), "-c:a", "pcm_s16le", dstPath })
            psi.ArgumentList.Add(arg);

        try
        {
            using var proc = Process.Start(psi);
            if (proc is null) return wav48kStereo;

            proc.StandardInput.Close();
            using var timeout = CancellationTokenSource.CreateLinkedTokenSource(ct);
            timeout.CancelAfter(TimeSpan.FromSeconds(15));
            _ = proc.StandardError.ReadToEndAsync(timeout.Token);
            await proc.WaitForExitAsync(timeout.Token).ConfigureAwait(false);

            if (proc.ExitCode == 0 && File.Exists(dstPath))
            {
                var shaped = await File.ReadAllBytesAsync(dstPath, ct).ConfigureAwait(false);
                if (IsStereo48kPcmWav(shaped) && shaped.Length > 44)
                    return TrimLeadingAndTrailingSilence(shaped);
            }
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            // Keep clean base WAV if FFmpeg DSP fails on host
        }
        finally
        {
            TryDelete(srcPath);
            TryDelete(dstPath);
        }

        return wav48kStereo;
    }
}
