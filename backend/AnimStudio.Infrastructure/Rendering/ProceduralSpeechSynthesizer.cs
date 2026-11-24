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

internal sealed record ProceduralSpeechSynthesisOutcome(
    ProceduralSpeechSynthesisResult? Result,
    string? FailureReason = null);

/// <summary>
/// Converts a procedural video's dialogue or narration plan into real spoken multi-speaker /
/// narrator audio using the configured AI speech chain (e.g. Google Gemini TTS -> gTTS -> Kokoro -> Piper),
/// preserving partial progress across per-turn fallbacks, measuring exact clip lengths,
/// stitching a clean time-aligned WAV track, and keeping visuals &amp; captions synchronized.
/// Never falls back to offline OS Microsoft SAPI voices.
/// </summary>
internal static class ProceduralSpeechSynthesizer
{
    private const double LeadInSeconds = 0.35;
    private const double PauseBetweenTurnsSeconds = 0.24;
    private const double ComedyStandardGapSeconds = 0.15;
    private const double ComedyInterruptGapSeconds = 0.05;
    private const double ComedyDeadpanBeatSeconds = 0.32;
    private const double ComedySfxReactionGapSeconds = 0.52;
    private const double MinTitleHoldSeconds = 1.25;
    private const double TailSeconds = 0.75;
    private static readonly TimeSpan DefaultRateLimitCooldown = TimeSpan.FromSeconds(18);

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
        IStudioVoiceRenderer? studioVoiceRenderer = null,
        TimeSpan? rateLimitCooldown = null)
    {
        var outcome = await TrySynthesizeWithDiagnosticsAsync(
            request, initialPlan, workspaceInputDir, userId, baseDurationSeconds,
            ai, aiRegistry, ffmpegOptions, logger, ct,
            customVoiceProfile, studioVoiceRenderer, rateLimitCooldown).ConfigureAwait(false);
        return outcome.Result;
    }

    public static async Task<ProceduralSpeechSynthesisOutcome> TrySynthesizeWithDiagnosticsAsync(
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
        IStudioVoiceRenderer? studioVoiceRenderer = null,
        TimeSpan? rateLimitCooldown = null)
    {
        if (!request.IncludeSpeech)
            return new(null);

        var speechTurns = initialPlan.Turns.Where(t => !t.IsTitleHook).ToList();
        var spokenTitleOnly = false;
        if (speechTurns.Count == 0 && initialPlan.Turns.Count > 0)
        {
            speechTurns = [initialPlan.Turns[0]];
            spokenTitleOnly = true;
        }

        if (speechTurns.Count == 0 || ai is null || aiRegistry is null)
            return new(null);

        Directory.CreateDirectory(workspaceInputDir);
        var langCode = string.Equals(request.Language?.Trim(), "en", StringComparison.OrdinalIgnoreCase) ? "en" : "hi";

        // Following the script exactly: every line at natural speed (no cap to fit into) and the video ends with the
        // narration instead of being padded with silence up to the target length.
        var fitCap = request.FollowScriptExactly ? null : request.MaxDurationSeconds;
        var minVideoSeconds = request.FollowScriptExactly ? ProceduralVideoRequest.MinSeconds : baseDurationSeconds;

        var providers = ResolveProviders(aiRegistry, request.SpeechProviderId, customVoiceProfile, studioVoiceRenderer);
        if (providers.Count == 0)
        {
            const string noProviderReason = "No Speech AI provider is enabled/configured (configure gemini-tts or your preferred Pro Speech provider in Admin -> AI Providers).";
            logger?.LogWarning("Procedural video speech skipped: {Reason}", noProviderReason);
            return new(null, noProviderReason);
        }

        var synth = await SynthesizeAcrossProvidersAsync(
            providers, request, initialPlan, speechTurns, langCode,
            workspaceInputDir, userId, ai, ffmpegOptions, logger, ct,
            customVoiceProfile, studioVoiceRenderer,
            rateLimitCooldown ?? DefaultRateLimitCooldown).ConfigureAwait(false);

        if (synth.Result is null)
        {
            // Never fall back to offline OS Microsoft SAPI phonetic robotics on real videos; rely strictly on configured
            // AI/Google speech providers (gemini-tts -> gtts / kokoro / piper-local).
            logger?.LogWarning("Procedural video speech could not be synthesized: {Reason}",
                synth.FailureReason ?? "all configured Speech providers failed.");
            return new(null, synth.FailureReason);
        }

        var (clipBytes, clipDurations, providerLabel, voicesUsed) = synth.Result.Value;
        var assembled = await AssembleFinalSpeechTrackAsync(
            clipBytes, clipDurations,
            initialPlan, speechTurns, spokenTitleOnly,
            workspaceInputDir, minVideoSeconds, fitCap, ffmpegOptions,
            providerLabel, voicesUsed, logger, ct).ConfigureAwait(false);

        return assembled is not null
            ? new(assembled)
            : new(null, "Failed to assemble synthesized audio clips into speech track.");
    }

    private sealed record TurnSynthesisAttempt(
        bool Succeeded,
        byte[]? NormalizedWav,
        double DurationSeconds,
        string? VoiceLabel,
        string? ErrorCode,
        string? FailureSummary)
    {
        public static TurnSynthesisAttempt Ok(byte[] wav, double dur, string voiceLabel) =>
            new(true, wav, dur, voiceLabel, null, null);
        public static TurnSynthesisAttempt Fail(string code, string summary) =>
            new(false, null, 0, null, code, summary);
    }

    private sealed record ProviderContext(
        ISpeechAiProvider Provider,
        string VoiceA,
        string VoiceB,
        bool IsGemini,
        string? ReplicatedVoiceId,
        string? TunedVoiceId,
        bool CanLocalReVoice);

    private static async Task<((List<byte[]> ClipBytes, List<double> Durations, string ProviderLabel, List<string> VoicesUsed)? Result, string? FailureReason)>
        SynthesizeAcrossProvidersAsync(
            IReadOnlyList<ISpeechAiProvider> providers,
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
            VoiceProfile? customVoiceProfile,
            IStudioVoiceRenderer? studioVoiceRenderer,
            TimeSpan rateLimitCooldown)
    {
        var contexts = new ProviderContext?[providers.Count];
        var overrideModels = new string?[providers.Count];
        var blocked = new bool[providers.Count];
        var clipBytesList = new List<byte[]>(speechTurns.Count);
        var clipDurations = new List<double>(speechTurns.Count);
        var voicesUsed = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var usedProvidersInOrder = new List<string>(providers.Count);

        var activeIdx = 0;
        var successfulClips = 0;
        var nonEmptySpokenTurns = 0;
        var totalExpectedSpokenTurns = speechTurns.Count(t =>
            !string.IsNullOrWhiteSpace(DialogueScriptParser.ToSpokenText(t.Text, langCode)));
        var brokeEarly = false;
        var rpmRecoveryWaits = 0;
        var consecutiveProviderWideFails = 0;
        string? lastFailureSummary = null;
        string? lastFailureCode = null;
        var isComedy = IsComedyRequest(request, initialPlan);

        Dictionary<int, (byte[] Wav, double Duration, string VoiceLabel)> preSynthesized = [];
        if (providers.Count > 0 && !blocked[activeIdx])
        {
            var firstCtx = contexts[activeIdx] ??= await CreateProviderContextAsync(
                providers[activeIdx], initialPlan, request, activeIdx == 0,
                customVoiceProfile, studioVoiceRenderer, ct).ConfigureAwait(false);
            if (firstCtx.IsGemini && !isComedy && totalExpectedSpokenTurns >= 12)
            {
                var (batchCode, batchSummary, batchModel) = await TrySynthesizeGeminiBatchesAsync(
                    firstCtx,
                    overrideModels[activeIdx],
                    request,
                    initialPlan,
                    speechTurns,
                    langCode,
                    isComedy,
                    workspaceInputDir,
                    userId,
                    ai,
                    ffmpegOptions,
                    logger,
                    customVoiceProfile,
                    studioVoiceRenderer,
                    rateLimitCooldown,
                    preSynthesized,
                    ct).ConfigureAwait(false);
                overrideModels[activeIdx] = batchModel;
                if (batchCode is not null)
                {
                    lastFailureCode = batchCode;
                    lastFailureSummary = batchSummary;
                    if (IsTerminalProviderFailure(batchCode))
                        blocked[activeIdx] = true;
                }
            }
        }

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

            nonEmptySpokenTurns++;
            if (preSynthesized.TryGetValue(i, out var batched))
            {
                clipBytesList.Add(batched.Wav);
                clipDurations.Add(batched.Duration);
                var pName = contexts[activeIdx]?.Provider.Id.Value ?? KnownAiProviders.GeminiTts;
                if (usedProvidersInOrder.Count == 0 || !string.Equals(usedProvidersInOrder[^1], pName, StringComparison.OrdinalIgnoreCase))
                    usedProvidersInOrder.Add(pName);
                voicesUsed.Add(batched.VoiceLabel);
                successfulClips++;
                consecutiveProviderWideFails = 0;
                continue;
            }

            var candidateIndices = BuildCandidateOrder(activeIdx, blocked);
            if (candidateIndices.Count == 0)
            {
                clipBytesList.Add([]);
                clipDurations.Add(FallbackSeconds(turn));
                consecutiveProviderWideFails++;
                brokeEarly = true;
                break;
            }

            var resolvedForTurn = false;
            var primaryErrorCodeForTurn = (string?)null;

            foreach (var pIdx in candidateIndices)
            {
                var ctx = contexts[pIdx] ??= await CreateProviderContextAsync(
                    providers[pIdx], initialPlan, request, pIdx == 0,
                    customVoiceProfile, studioVoiceRenderer, ct).ConfigureAwait(false);

                request.Progress?.Report(new ProceduralRenderProgress(
                    ProceduralRenderStages.VoicePercent(i, speechTurns.Count),
                    $"Voice line {i + 1} of {speechTurns.Count} ({ctx.Provider.Id.Value})"));

                var canTryRpmWait = pIdx == candidateIndices[^1]
                    && candidateIndices.Count == 1
                    && rpmRecoveryWaits < 24
                    && rateLimitCooldown > TimeSpan.Zero;

                var (attempt, updatedOverride) = await SynthesizeSingleTurnAsync(
                    ctx, request, initialPlan, speechTurns, turn, i, spokenText, langCode,
                    isComedy, workspaceInputDir, userId, ai, ffmpegOptions, logger,
                    overrideModels[pIdx], customVoiceProfile, studioVoiceRenderer,
                    canTryRpmWait ? rateLimitCooldown : TimeSpan.Zero, ct).ConfigureAwait(false);

                overrideModels[pIdx] = updatedOverride;
                if (attempt.ErrorCode == "rate-limited-retried-after-cooldown")
                    rpmRecoveryWaits++;

                if (attempt.Succeeded && attempt.NormalizedWav is not null)
                {
                    clipBytesList.Add(attempt.NormalizedWav);
                    clipDurations.Add(attempt.DurationSeconds);
                    if (!string.IsNullOrWhiteSpace(attempt.VoiceLabel))
                        voicesUsed.Add(attempt.VoiceLabel);
                    if (!usedProvidersInOrder.Contains(ctx.Provider.Id.Value, StringComparer.OrdinalIgnoreCase))
                        usedProvidersInOrder.Add(ctx.Provider.Id.Value);

                    if (pIdx != activeIdx && IsProviderWideFailure(primaryErrorCodeForTurn))
                    {
                        blocked[activeIdx] = true;
                        activeIdx = pIdx;
                        logger?.LogInformation(
                            "Switched procedural speech synthesis to fallback provider {FallbackProvider} at turn {TurnIndex} after {PrimaryCode}.",
                            ctx.Provider.Id.Value, i, primaryErrorCodeForTurn);
                    }

                    successfulClips++;
                    consecutiveProviderWideFails = 0;
                    resolvedForTurn = true;
                    break;
                }

                lastFailureCode = attempt.ErrorCode;
                lastFailureSummary = attempt.FailureSummary;
                if (pIdx == activeIdx)
                    primaryErrorCodeForTurn = attempt.ErrorCode;

                // Permanently broken/unconfigured providers need not be retried turn after turn.
                if (IsTerminalProviderFailure(attempt.ErrorCode))
                    blocked[pIdx] = true;
            }

            if (!resolvedForTurn)
            {
                clipBytesList.Add([]);
                clipDurations.Add(FallbackSeconds(turn));

                if (IsProviderWideFailure(lastFailureCode))
                {
                    consecutiveProviderWideFails++;
                    if (consecutiveProviderWideFails >= 8 || blocked.All(b => b))
                    {
                        logger?.LogWarning(
                            "Stopping procedural speech synthesis early after {Consecutive} consecutive provider-wide failures ({Summary}).",
                            consecutiveProviderWideFails, lastFailureSummary);
                        brokeEarly = true;
                        break;
                    }
                }
                else
                {
                    consecutiveProviderWideFails = 0;
                }
            }
        }

        if (successfulClips == 0)
            return (null, lastFailureSummary ?? "All configured Speech providers failed.");

        if (totalExpectedSpokenTurns >= 4 && (brokeEarly || successfulClips * 4 < totalExpectedSpokenTurns * 3))
        {
            var reason = $"Only {successfulClips} of {totalExpectedSpokenTurns} spoken lines succeeded ({lastFailureSummary ?? "rate-limited"}).";
            logger?.LogWarning("Discarding incomplete procedural speech track: {Reason}", reason);
            return (null, reason);
        }

        var providerLabel = usedProvidersInOrder.Count > 0
            ? string.Join('+', usedProvidersInOrder)
            : providers[0].Id.Value;

        return ((clipBytesList, clipDurations, providerLabel, [.. voicesUsed]), null);
    }

    private static List<int> BuildCandidateOrder(int activeIdx, bool[] blocked)
    {
        var list = new List<int>(blocked.Length);
        if (activeIdx >= 0 && activeIdx < blocked.Length && !blocked[activeIdx])
            list.Add(activeIdx);
        for (var p = 0; p < blocked.Length; p++)
        {
            if (p != activeIdx && !blocked[p])
                list.Add(p);
        }
        return list;
    }

    private static bool IsProviderWideFailure(string? code) =>
        code is "rate-limited" or "rate-limited-retried-after-cooldown"
            or "quota-exhausted" or "circuit-open" or "credential-rejected"
            or "endpoint-or-model-not-found" or "transport-failed" or "timeout" or "provider-error";

    private static bool IsTerminalProviderFailure(string? code) =>
        code is "quota-exhausted" or "circuit-open" or "credential-rejected" or "endpoint-or-model-not-found";

    private static async Task<ProviderContext> CreateProviderContextAsync(
        ISpeechAiProvider provider,
        ProceduralDialoguePlan initialPlan,
        ProceduralVideoRequest request,
        bool isPrimary,
        VoiceProfile? customVoiceProfile,
        IStudioVoiceRenderer? studioVoiceRenderer,
        CancellationToken ct)
    {
        var (voiceA, voiceB) = await ResolveVoicesAsync(provider, initialPlan, request, ct, isPrimary).ConfigureAwait(false);
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

        return new ProviderContext(provider, voiceA, voiceB, isGemini, replicatedVoiceId, tunedVoiceId, canLocalReVoice);
    }

    private static async Task<(TurnSynthesisAttempt Attempt, string? OverrideModel)> SynthesizeSingleTurnAsync(
        ProviderContext ctx,
        ProceduralVideoRequest request,
        ProceduralDialoguePlan initialPlan,
        List<ProceduralDialogueTurn> speechTurns,
        ProceduralDialogueTurn turn,
        int turnIndex,
        string spokenText,
        string langCode,
        bool isComedy,
        string workspaceInputDir,
        string userId,
        IAiExecutor ai,
        FfmpegOptions ffmpegOptions,
        ILogger? logger,
        string? overrideModel,
        VoiceProfile? customVoiceProfile,
        IStudioVoiceRenderer? studioVoiceRenderer,
        TimeSpan rpmCooldownIfRateLimited,
        CancellationToken ct)
    {
        var provider = ctx.Provider;
        var speakerProfile = ResolveSpeakerProfile(initialPlan, turn);
        var useCustomForTurn = customVoiceProfile is not null
            && (!initialPlan.HasCharacters
                || turn.Slot == DialogueSpeakerSlot.Narrator
                || turn.SpeakerRole == CharacterVisualRole.Narrator
                || (initialPlan.HasCharacters && turn.Slot == DialogueSpeakerSlot.Left && !speechTurns.Any(t => t.Slot == DialogueSpeakerSlot.Narrator)));

        var turnReplicatedVoiceId = useCustomForTurn ? ctx.ReplicatedVoiceId : null;
        var turnTunedVoiceId = useCustomForTurn ? ctx.TunedVoiceId : null;
        var baseProfileVoice = !string.IsNullOrWhiteSpace(customVoiceProfile?.BaseVoiceId)
            ? customVoiceProfile.BaseVoiceId
            : (ctx.IsGemini ? ctx.VoiceA : (turn.Slot == DialogueSpeakerSlot.Right ? ctx.VoiceB : ctx.VoiceA));

        var voiceId = turnReplicatedVoiceId is not null
            ? baseProfileVoice
            : turnTunedVoiceId is not null
                ? turnTunedVoiceId
                : ctx.IsGemini
                    ? ResolveGeminiTurnVoice(initialPlan, request, turn, ctx.VoiceA, ctx.VoiceB, isComedy)
                    : (useCustomForTurn && ctx.CanLocalReVoice ? baseProfileVoice : (turn.Slot == DialogueSpeakerSlot.Right ? ctx.VoiceB : ctx.VoiceA));
        var style = BuildSpeechStyle(turn, speakerProfile, isComedy, initialPlan.HasCharacters, langCode);
        var rate = ComputeSpeechRate(turn, speakerProfile, isComedy);

        Task<AiOutcome<AiSpeechResult>> CallSpeechAsync(string? model, string? textOverride = null, bool bypassCache = false) =>
            ai.SpeechAsync(new AiSpeechRequest
            {
                Text = textOverride ?? spokenText,
                VoiceId = voiceId,
                Rate = rate,
                LanguageCode = langCode,
                Style = style,
                Model = model,
                ProviderId = provider.Id.Value,
                ReplicatedVoiceId = turnReplicatedVoiceId,
                BypassCache = bypassCache
            }, new AiCallContext(null, string.IsNullOrWhiteSpace(userId) ? null : userId), ct);

        AiOutcome<AiSpeechResult> outcome;
        var usedCooldownRetry = false;
        try
        {
            outcome = await CallSpeechAsync(overrideModel).ConfigureAwait(false);
            if (!outcome.IsSuccess && string.Equals(outcome.ErrorCode, "endpoint-or-model-not-found", StringComparison.OrdinalIgnoreCase))
            {
                logger?.LogWarning("Speech provider {ProviderId} rejected configured model ({Error}); keeping configuration strict with no lower-tier fallback.", provider.Id.Value, outcome.ErrorCode);
            }

            if (!outcome.IsSuccess
                && outcome.ErrorCode is "empty-response" or "malformed-response"
                && rpmCooldownIfRateLimited > TimeSpan.Zero)
            {
                // Gemini 2.5 preview TTS can transiently return empty/OTHER on short ellipses ("हूँ..."), colons or dashes; retry immediately with cleaned text.
                var cleanedRetryText = spokenText
                    .Replace("...", ", ")
                    .Replace("…", ", ")
                    .Replace("?!", "?")
                    .Replace("—", ", ")
                    .Replace("–", ", ")
                    .Replace(":", ", ")
                    .Trim();
                var gentlePlainText = System.Text.RegularExpressions.Regex
                    .Replace(cleanedRetryText, @"[^\p{L}\p{N}\s,।.?!'\-]", " ")
                    .Trim();
                if (!string.IsNullOrWhiteSpace(gentlePlainText) && gentlePlainText[^1] is not ('.' or '।' or '?' or '!'))
                    gentlePlainText += langCode.StartsWith("hi", StringComparison.OrdinalIgnoreCase) ? "।" : ".";

                for (var emptyTry = 0; emptyTry < 2 && !outcome.IsSuccess && outcome.ErrorCode is "empty-response" or "malformed-response"; emptyTry++)
                {
                    logger?.LogInformation(
                        "Speech provider {Provider} returned {Code} at turn {Index}; retrying after 2.5s.",
                        provider.Id.Value, outcome.ErrorCode, turnIndex);
                    await Task.Delay(TimeSpan.FromSeconds(2.5), ct).ConfigureAwait(false);
                    var retryText = emptyTry == 0
                        ? (string.IsNullOrWhiteSpace(cleanedRetryText) ? spokenText : cleanedRetryText)
                        : (string.IsNullOrWhiteSpace(gentlePlainText) ? spokenText : gentlePlainText);
                    outcome = await CallSpeechAsync(overrideModel, retryText).ConfigureAwait(false);
                }
            }

            var isDailyQuotaCap = !outcome.IsSuccess
                && string.Equals(outcome.ErrorCode, "rate-limited", StringComparison.OrdinalIgnoreCase)
                && outcome.Message is { } errMsg
                && (errMsg.Contains("PerDay", StringComparison.OrdinalIgnoreCase)
                    || errMsg.Contains("Daily", StringComparison.OrdinalIgnoreCase));

            if (isDailyQuotaCap)
            {
                logger?.LogWarning(
                    "Speech provider {Provider} reported daily quota exhaustion at turn {Index} ({Msg}); skipping RPM cooldown.",
                    provider.Id.Value, turnIndex, outcome.Message);
                return (TurnSynthesisAttempt.Fail("quota-exhausted", $"{provider.Id.Value}: quota-exhausted ({outcome.Message})"), overrideModel);
            }

            if (!outcome.IsSuccess
                && string.Equals(outcome.ErrorCode, "rate-limited", StringComparison.OrdinalIgnoreCase)
                && rpmCooldownIfRateLimited > TimeSpan.Zero)
            {
                usedCooldownRetry = true;
                var firstWait = TimeSpan.FromSeconds(Math.Max(22, rpmCooldownIfRateLimited.TotalSeconds));
                logger?.LogInformation(
                    "Speech provider {Provider} hit rate limit at turn {Index}; waiting {Seconds:0}s for window recovery before retry.",
                    provider.Id.Value, turnIndex, firstWait.TotalSeconds);
                await Task.Delay(firstWait, ct).ConfigureAwait(false);
                outcome = await CallSpeechAsync(overrideModel).ConfigureAwait(false);

                if (!outcome.IsSuccess
                    && string.Equals(outcome.ErrorCode, "rate-limited", StringComparison.OrdinalIgnoreCase))
                {
                    var secondWait = TimeSpan.FromSeconds(38);
                    logger?.LogInformation(
                        "Speech provider {Provider} still rate-limited at turn {Index}; waiting {Seconds:0}s more to clear 60s RPM bucket.",
                        provider.Id.Value, turnIndex, secondWait.TotalSeconds);
                    await Task.Delay(secondWait, ct).ConfigureAwait(false);
                    outcome = await CallSpeechAsync(overrideModel).ConfigureAwait(false);
                }
            }
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger?.LogWarning(ex, "Procedural speech turn {Index} threw for provider {Provider}.", turnIndex, provider.Id.Value);
            return (TurnSynthesisAttempt.Fail("provider-threw", $"{provider.Id.Value}: {ex.Message}"), overrideModel);
        }

        if (!outcome.IsSuccess || outcome.Value is not { Content.Length: > 0 } speech)
        {
            var code = outcome.ErrorCode ?? (outcome.Reason == AiUnavailableReason.QuotaExhausted ? "quota-exhausted"
                : outcome.Reason == AiUnavailableReason.CircuitOpen ? "circuit-open" : "speech-failed");
            logger?.LogWarning("Procedural speech turn {Index} failed on {Provider}: {Code} - {Msg}",
                turnIndex, provider.Id.Value, code, outcome.Message);
            var reportCode = usedCooldownRetry && code == "rate-limited" ? "rate-limited-retried-after-cooldown" : code;
            return (TurnSynthesisAttempt.Fail(reportCode, $"{provider.Id.Value}: {code}"), overrideModel);
        }

        var rawAudio = speech.Content;
        var reVoicedLocally = false;
        if (useCustomForTurn && ctx.CanLocalReVoice && customVoiceProfile!.StorageKey is { } sampleKey)
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
                logger?.LogWarning(ex, "Local studio voice conversion failed on turn {Index}; keeping base voice.", turnIndex);
            }
        }

        var normalizedWav = await EnsureStereo48kWavAsync(rawAudio, workspaceInputDir, turnIndex, ffmpegOptions, ct)
            .ConfigureAwait(false);
        if (normalizedWav is null)
        {
            var headHex = rawAudio.Length > 0
                ? Convert.ToHexString(rawAudio.AsSpan(0, Math.Min(12, rawAudio.Length)))
                : "empty";
            logger?.LogWarning(
                "Procedural speech turn {Index} got unusable audio from {Provider} (mime={Mime}, sniff={Sniff}, len={Len}, head={Head}); retrying with BypassCache=true.",
                turnIndex, provider.Id.Value, speech.MimeType, AiAudioValidator.Sniff(rawAudio), rawAudio.Length, headHex);

            var freshOutcome = await CallSpeechAsync(overrideModel, bypassCache: true).ConfigureAwait(false);
            if (freshOutcome.IsSuccess && freshOutcome.Value is { Content.Length: > 0 } freshSpeech)
            {
                speech = freshSpeech;
                rawAudio = freshSpeech.Content;
                normalizedWav = await EnsureStereo48kWavAsync(rawAudio, workspaceInputDir, turnIndex, ffmpegOptions, ct)
                    .ConfigureAwait(false);
            }
        }
        if (normalizedWav is null)
        {
            logger?.LogWarning("Procedural speech turn {Index} returned unusable audio format on {Provider}.", turnIndex, provider.Id.Value);
            return (TurnSynthesisAttempt.Fail("unusable-audio", $"{provider.Id.Value}: unusable-audio"), overrideModel);
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
                200 + turnIndex,
                ffmpegOptions,
                ct).ConfigureAwait(false);
        }

        var dur = AiAudioValidator.TryGetWavDuration(normalizedWav) ?? speech.DurationSeconds ?? 0;
        if (dur <= 0.05)
            dur = Math.Max(1.2, spokenText.Length / 14.0);

        var voiceLabel = turnReplicatedVoiceId is not null
            ? $"{customVoiceProfile!.Name} (Google)"
            : turnTunedVoiceId is not null
                ? $"{customVoiceProfile!.Name} (Tuned)"
                : reVoicedLocally
                    ? $"{customVoiceProfile!.Name} (Converted)"
                    : voiceId;

        return (TurnSynthesisAttempt.Ok(normalizedWav, dur, voiceLabel), overrideModel);
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
        CancellationToken ct,
        bool isPrimaryProvider = true)
    {
        var isHindi = !string.Equals(request.Language?.Trim(), "en", StringComparison.OrdinalIgnoreCase);
        var pid = provider.Id.Value;

        string voiceA;
        string voiceB;
        IReadOnlyList<AiVoice>? listedVoices = null;

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
                listedVoices = await provider.ListVoicesAsync(ct).ConfigureAwait(false);
                var matching = listedVoices
                    .Where(v => string.IsNullOrWhiteSpace(v.LanguageCode)
                        || v.LanguageCode.StartsWith(isHindi ? "hi" : "en", StringComparison.OrdinalIgnoreCase))
                    .ToList();
                if (matching.Count == 0) matching = [.. listedVoices];
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

        bool AllowsRequestedVoice(string requestedVoiceId) =>
            isPrimaryProvider
            || (listedVoices is not null && listedVoices.Any(v =>
                string.Equals(v.VoiceId, requestedVoiceId, StringComparison.OrdinalIgnoreCase)));

        if (!string.IsNullOrWhiteSpace(request.SpeakerAVoiceId) && AllowsRequestedVoice(request.SpeakerAVoiceId.Trim()))
            voiceA = request.SpeakerAVoiceId.Trim();
        if (!string.IsNullOrWhiteSpace(request.SpeakerBVoiceId) && AllowsRequestedVoice(request.SpeakerBVoiceId.Trim()))
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

    /// <summary>
    /// Synthesizes adjacent non-custom Gemini dialogue/narration turns in multi-speaker (or single-speaker multi-line)
    /// batches of 2-4 turns (using <see cref="AiSpeechRequest.Speakers"/>) and slices the returned WAV at inter-turn
    /// energy valleys. Cuts Gemini Pro TTS RPD API calls by 3x-4x while preserving distinct cast voices and timings.
    /// </summary>
    private static async Task<(string? TerminalErrorCode, string? FailureSummary, string? OverrideModel)> TrySynthesizeGeminiBatchesAsync(
        ProviderContext ctx,
        string? overrideModel,
        ProceduralVideoRequest request,
        ProceduralDialoguePlan initialPlan,
        List<ProceduralDialogueTurn> speechTurns,
        string langCode,
        bool isComedy,
        string workspaceInputDir,
        string userId,
        IAiExecutor ai,
        FfmpegOptions ffmpegOptions,
        ILogger? logger,
        VoiceProfile? customVoiceProfile,
        IStudioVoiceRenderer? studioVoiceRenderer,
        TimeSpan rpmCooldownIfRateLimited,
        Dictionary<int, (byte[] Wav, double Duration, string VoiceLabel)> outClips,
        CancellationToken ct)
    {
        var (entries, batches) = BuildGeminiSpeechBatches(
            ctx.VoiceA, ctx.VoiceB, ctx.CanLocalReVoice, ctx.ReplicatedVoiceId,
            request, initialPlan, speechTurns, langCode, isComedy, customVoiceProfile);

        if (batches.Count == 0)
            return (null, null, overrideModel);

        logger?.LogInformation(
            "Batching {TurnCount} of {EligibleCount} Gemini speech turns into {BatchCount} multi-turn calls on {Provider} to conserve daily RPD quota.",
            batches.Sum(b => b.Count), entries.Count, batches.Count, ctx.Provider.Id.Value);

        for (var bIdx = 0; bIdx < batches.Count; bIdx++)
        {
            var batch = batches[bIdx];
            var speakersList = batch
                .Select(b => (b.VoiceId, b.ReplicatedVoiceId))
                .DistinctBy(k => $"{k.VoiceId}|{k.ReplicatedVoiceId}", StringComparer.OrdinalIgnoreCase)
                .ToList();

            string promptText;
            IReadOnlyList<AiSpeechSpeaker>? speakers = null;
            IReadOnlyList<string?>? lineStyles = null;
            if (speakersList.Count == 2)
            {
                const string label1 = "Speaker1";
                const string label2 = "Speaker2";
                speakers =
                [
                    new AiSpeechSpeaker(label1, speakersList[0].VoiceId, speakersList[0].ReplicatedVoiceId),
                    new AiSpeechSpeaker(label2, speakersList[1].VoiceId, speakersList[1].ReplicatedVoiceId)
                ];
                var sb = new StringBuilder();
                var styles = new List<string?>(batch.Count);
                foreach (var item in batch)
                {
                    var isFirst = string.Equals(item.VoiceId, speakersList[0].VoiceId, StringComparison.OrdinalIgnoreCase)
                        && string.Equals(item.ReplicatedVoiceId, speakersList[0].ReplicatedVoiceId, StringComparison.Ordinal);
                    sb.Append(isFirst ? label1 : label2).Append(": ").AppendLine(item.SpokenText);
                    styles.Add(item.Style);
                }
                promptText = sb.ToString().TrimEnd();
                lineStyles = styles;
            }
            else
            {
                promptText = string.Join("\n\n", batch.Select(b => b.SpokenText));
            }

            var batchRate = batch[0].Rate;
            var batchStyle = batch[0].Style;
            var batchPrimaryVoice = speakersList[0].VoiceId;
            var batchPrimaryRep = speakersList[0].ReplicatedVoiceId;

            Task<AiOutcome<AiSpeechResult>> CallBatchAsync(string? model, bool bypassCache = false) =>
                ai.SpeechAsync(new AiSpeechRequest
                {
                    Text = promptText,
                    VoiceId = batchPrimaryVoice,
                    Rate = batchRate,
                    LanguageCode = langCode,
                    Style = batchStyle,
                    ProviderId = ctx.Provider.Id.Value,
                    Model = model,
                    ReplicatedVoiceId = speakers is null ? batchPrimaryRep : null,
                    Speakers = speakers,
                    LineStyles = lineStyles,
                    BypassCache = bypassCache
                }, new AiCallContext(null, string.IsNullOrWhiteSpace(userId) ? null : userId), ct);

            var outcome = await CallBatchAsync(overrideModel).ConfigureAwait(false);
            if (!outcome.IsSuccess && string.Equals(outcome.ErrorCode, "rate-limited", StringComparison.OrdinalIgnoreCase) && rpmCooldownIfRateLimited > TimeSpan.Zero)
            {
                var wait = TimeSpan.FromSeconds(Math.Max(22, rpmCooldownIfRateLimited.TotalSeconds));
                logger?.LogInformation("Gemini batch {Batch}/{Total} hit RPM limit; waiting {Sec:0}s.", bIdx + 1, batches.Count, wait.TotalSeconds);
                await Task.Delay(wait, ct).ConfigureAwait(false);
                outcome = await CallBatchAsync(overrideModel).ConfigureAwait(false);
            }

            if (!outcome.IsSuccess || outcome.Value is not { Content.Length: > 0 } speech)
            {
                var code = outcome.ErrorCode ?? (outcome.Reason == AiUnavailableReason.CircuitOpen ? "circuit-open" : "speech-failed");
                var summary = $"{ctx.Provider.Id.Value}: {code}";
                logger?.LogWarning("Gemini speech batch {Batch}/{Total} failed with {Code}; falling back cleanly.", bIdx + 1, batches.Count, code);
                if (IsTerminalProviderFailure(code))
                    return (code, summary, overrideModel);
                continue;
            }

            var normalizedBatch = await EnsureStereo48kWavAsync(speech.Content, workspaceInputDir, 900 + bIdx, ffmpegOptions, ct)
                .ConfigureAwait(false);
            if (normalizedBatch is null || !IsStereo48kPcmWav(normalizedBatch))
                continue;

            var splitClips = SplitBatchWavIntoTurnClips(normalizedBatch, [.. batch.Select(x => x.SpokenText)]);
            if (splitClips is null || splitClips.Count != batch.Count)
            {
                logger?.LogInformation("Gemini speech batch {Batch}/{Total} could not be split unambiguously into {Count} turn clips; falling back to per-turn synthesis.", bIdx + 1, batches.Count, batch.Count);
                continue;
            }

            for (var k = 0; k < batch.Count; k++)
            {
                var item = batch[k];
                var turnWav = await ApplyTurnVoiceCharacterAsync(
                    splitClips[k],
                    item.Turn,
                    item.Profile,
                    isComedy,
                    isSingleVoiceGoogle: false,
                    workspaceInputDir,
                    400 + item.TurnIndex,
                    ffmpegOptions,
                    ct).ConfigureAwait(false);
                var dur = AiAudioValidator.TryGetWavDuration(turnWav) ?? 0;
                if (dur < 0.45) dur = Math.Max(1.0, item.SpokenText.Length / 14.0);
                var vLabel = item.ReplicatedVoiceId is not null
                    ? $"{item.VoiceId} (Google My Voice)"
                    : item.VoiceId;
                outClips[item.TurnIndex] = (turnWav, dur, vLabel);
            }
        }

        return (null, null, overrideModel);
    }

    internal sealed record GeminiBatchEntry(
        int TurnIndex,
        ProceduralDialogueTurn Turn,
        ProceduralCharacterProfile? Profile,
        string SpokenText,
        string VoiceId,
        string? ReplicatedVoiceId,
        string Style,
        double Rate);

    internal static (List<GeminiBatchEntry> Entries, List<List<GeminiBatchEntry>> Batches) BuildGeminiSpeechBatches(
        string voiceA,
        string voiceB,
        bool canLocalReVoice,
        string? replicatedVoiceId,
        ProceduralVideoRequest request,
        ProceduralDialoguePlan initialPlan,
        IReadOnlyList<ProceduralDialogueTurn> speechTurns,
        string langCode,
        bool isComedy,
        VoiceProfile? customVoiceProfile)
    {
        const int maxBatchTurns = 4;
        const int maxBatchChars = 1100;

        var entries = new List<GeminiBatchEntry>();
        var hasAnyNarrator = speechTurns.Any(t => t.Slot == DialogueSpeakerSlot.Narrator);

        for (var i = 0; i < speechTurns.Count; i++)
        {
            var turn = speechTurns[i];
            var spoken = DialogueScriptParser.ToSpokenText(turn.Text, langCode)
                .Replace("\r", " ", StringComparison.Ordinal)
                .Replace("\n", " ", StringComparison.Ordinal)
                .Trim();
            if (string.IsNullOrWhiteSpace(spoken)) continue;

            var useCustomForTurn = customVoiceProfile is not null
                && (!initialPlan.HasCharacters
                    || turn.Slot == DialogueSpeakerSlot.Narrator
                    || turn.SpeakerRole == CharacterVisualRole.Narrator
                    || (initialPlan.HasCharacters && turn.Slot == DialogueSpeakerSlot.Left && !hasAnyNarrator));

            if (useCustomForTurn && canLocalReVoice)
                continue;

            var profile = ResolveSpeakerProfile(initialPlan, turn);
            var repVoice = useCustomForTurn ? replicatedVoiceId : null;
            var baseProfileVoice = !string.IsNullOrWhiteSpace(customVoiceProfile?.BaseVoiceId)
                ? customVoiceProfile.BaseVoiceId
                : voiceA;
            var voiceId = repVoice is not null
                ? baseProfileVoice
                : ResolveGeminiTurnVoice(initialPlan, request, turn, voiceA, voiceB, isComedy);
            var style = BuildSpeechStyle(turn, profile, isComedy, initialPlan.HasCharacters, langCode);
            var rate = ComputeSpeechRate(turn, profile, isComedy);

            entries.Add(new GeminiBatchEntry(i, turn, profile, spoken, voiceId, repVoice, style, rate));
        }

        var batches = new List<List<GeminiBatchEntry>>();
        if (entries.Count < 2) return (entries, batches);

        var pos = 0;
        while (pos < entries.Count)
        {
            var cur = new List<GeminiBatchEntry> { entries[pos] };
            var charSum = entries[pos].SpokenText.Length;
            var distinct = new List<(string VoiceId, string? RepVoice)> { (entries[pos].VoiceId, entries[pos].ReplicatedVoiceId) };

            var next = pos + 1;
            while (next < entries.Count && cur.Count < maxBatchTurns)
            {
                var cand = entries[next];
                if (cand.TurnIndex != cur[^1].TurnIndex + 1) break;
                if (charSum + cand.SpokenText.Length > maxBatchChars) break;
                if (Math.Abs(cand.Rate - cur[0].Rate) > 0.25) break;

                var key = (cand.VoiceId, cand.ReplicatedVoiceId);
                if (!distinct.Any(d => string.Equals(d.VoiceId, key.VoiceId, StringComparison.OrdinalIgnoreCase) && string.Equals(d.RepVoice, key.ReplicatedVoiceId, StringComparison.Ordinal)))
                {
                    if (distinct.Count >= 2) break;
                    distinct.Add(key);
                }

                cur.Add(cand);
                charSum += cand.SpokenText.Length;
                next++;
            }

            if (cur.Count >= 2)
                batches.Add(cur);

            pos = cur.Count >= 2 ? next : pos + 1;
        }

        return (entries, batches);
    }

    /// <summary>
    /// Splits a combined multi-turn 48kHz stereo 16-bit PCM WAV into per-turn WAV clips by finding the quietest
    /// inter-turn pause valley near each character-proportion expected boundary.
    /// </summary>
    internal static IReadOnlyList<byte[]>? SplitBatchWavIntoTurnClips(byte[] stereo48kWav, IReadOnlyList<string> spokenTexts)
    {
        var count = spokenTexts.Count;
        if (count <= 1 || !IsStereo48kPcmWav(stereo48kWav))
            return count == 1 ? [stereo48kWav] : null;

        const int sampleRate = 48_000;
        const int blockAlign = 4;
        const int dataOffset = 44;
        if (!TryLocateWavDataChunk(stereo48kWav, out var chunkStart, out var dataLen))
            return null;

        var totalFrames = dataLen / blockAlign;
        var windowFrames = sampleRate / 50; // 20ms analysis window (960 frames)
        var totalWindows = totalFrames / windowFrames;
        var minTurnWindows = 22; // 0.44s minimum per turn
        if (totalWindows < count * minTurnWindows)
            return null;

        var rmsValues = new double[totalWindows];
        var nonZero = new List<double>(totalWindows);
        for (var w = 0; w < totalWindows; w++)
        {
            double sumSq = 0;
            var startFrame = w * windowFrames;
            for (var f = 0; f < windowFrames; f++)
            {
                var p = chunkStart + (startFrame + f) * blockAlign;
                var s = System.Buffers.Binary.BinaryPrimitives.ReadInt16LittleEndian(stereo48kWav.AsSpan(p, 2)) / 32768.0;
                sumSq += s * s;
            }
            var rms = Math.Sqrt(sumSq / windowFrames);
            rmsValues[w] = rms;
            if (rms > 1e-4) nonZero.Add(rms);
        }

        if (nonZero.Count == 0)
            return null;

        nonZero.Sort();
        var p85 = nonZero[(int)Math.Floor((nonZero.Count - 1) * 0.85)];
        var silenceThresh = Math.Clamp(p85 * 0.09, 0.004, 0.022);

        var weights = spokenTexts.Select(t => Math.Max(4.0, (double)t.Trim().Length)).ToArray();
        var weightTotal = weights.Sum();
        var cuts = new int[count + 1];
        cuts[0] = 0;
        cuts[count] = totalWindows;

        double cumWeight = 0;
        for (var j = 1; j < count; j++)
        {
            cumWeight += weights[j - 1];
            var expW = (int)Math.Round(totalWindows * (cumWeight / weightTotal));
            var radius = Math.Max(110, totalWindows / (count * 2));
            var minW = cuts[j - 1] + minTurnWindows;
            var maxW = totalWindows - (count - j) * minTurnWindows;
            var lo = Math.Clamp(expW - radius, minW, maxW);
            var hi = Math.Clamp(expW + radius, minW, maxW);

            if (lo >= hi)
            {
                cuts[j] = minW;
                continue;
            }

            var bestW = Math.Clamp(expW, lo, hi);
            var bestScore = double.MaxValue;
            for (var w = lo; w <= hi; w++)
            {
                var wLo = Math.Max(lo, w - 1);
                var wHi = Math.Min(hi, w + 1);
                double avgRms = 0;
                for (var k = wLo; k <= wHi; k++) avgRms += rmsValues[k];
                avgRms /= (wHi - wLo + 1);

                var distPenalty = 0.015 * Math.Abs(w - expW) / Math.Max(1, radius);
                var silenceBonus = avgRms <= silenceThresh ? -0.02 : 0.0;
                var score = avgRms + distPenalty + silenceBonus;
                if (score < bestScore)
                {
                    bestScore = score;
                    bestW = w;
                }
            }

            cuts[j] = bestW;
        }

        var clips = new List<byte[]>(count);
        for (var j = 0; j < count; j++)
        {
            var frameStart = cuts[j] * windowFrames;
            var frameEnd = j == count - 1 ? totalFrames : cuts[j + 1] * windowFrames;
            var frameCount = frameEnd - frameStart;
            if (frameCount < sampleRate * 4 / 10)
                return null;

            var sliceLen = frameCount * blockAlign;
            var seg = new byte[dataOffset + sliceLen];
            WriteStereo48kWavHeader(seg, sliceLen);
            Buffer.BlockCopy(stereo48kWav, chunkStart + frameStart * blockAlign, seg, dataOffset, sliceLen);

            var trimmed = TrimLeadingAndTrailingSilence(seg);
            var dur = AiAudioValidator.TryGetWavDuration(trimmed) ?? 0;
            if (dur < 0.42 && spokenTexts[j].Trim().Length >= 8)
                return null;

            clips.Add(trimmed);
        }

        return clips;
    }

    private static bool TryLocateWavDataChunk(byte[] wav, out int dataStart, out int dataLength)
    {
        dataStart = -1;
        dataLength = 0;
        if (wav.Length < 44 || !wav.AsSpan(0, 4).SequenceEqual("RIFF"u8) || !wav.AsSpan(8, 4).SequenceEqual("WAVE"u8))
            return false;

        var offset = 12;
        while (offset + 8 <= wav.Length)
        {
            var id = wav.AsSpan(offset, 4);
            var size = System.Buffers.Binary.BinaryPrimitives.ReadInt32LittleEndian(wav.AsSpan(offset + 4, 4));
            var body = offset + 8;
            if (id.SequenceEqual("data"u8))
            {
                dataStart = body;
                dataLength = Math.Min(Math.Max(0, size), wav.Length - body);
                return dataLength > 0;
            }
            if (size <= 0) break;
            offset = body + size + (size & 1);
        }
        return false;
    }

    private static void WriteStereo48kWavHeader(byte[] wav, int dataLen)
    {
        const int sampleRate = 48_000;
        const short channels = 2;
        const short bits = 16;
        const short blockAlign = 4;
        var hs = wav.AsSpan();
        "RIFF"u8.CopyTo(hs[..4]);
        System.Buffers.Binary.BinaryPrimitives.WriteInt32LittleEndian(hs.Slice(4, 4), 36 + dataLen);
        "WAVE"u8.CopyTo(hs.Slice(8, 4));
        "fmt "u8.CopyTo(hs.Slice(12, 4));
        System.Buffers.Binary.BinaryPrimitives.WriteInt32LittleEndian(hs.Slice(16, 4), 16);
        System.Buffers.Binary.BinaryPrimitives.WriteInt16LittleEndian(hs.Slice(20, 2), 1);
        System.Buffers.Binary.BinaryPrimitives.WriteInt16LittleEndian(hs.Slice(22, 2), channels);
        System.Buffers.Binary.BinaryPrimitives.WriteInt32LittleEndian(hs.Slice(24, 4), sampleRate);
        System.Buffers.Binary.BinaryPrimitives.WriteInt32LittleEndian(hs.Slice(28, 4), sampleRate * blockAlign);
        System.Buffers.Binary.BinaryPrimitives.WriteInt16LittleEndian(hs.Slice(32, 2), blockAlign);
        System.Buffers.Binary.BinaryPrimitives.WriteInt16LittleEndian(hs.Slice(34, 2), bits);
        "data"u8.CopyTo(hs.Slice(36, 4));
        System.Buffers.Binary.BinaryPrimitives.WriteInt32LittleEndian(hs.Slice(40, 4), dataLen);
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

    private static bool IsExplicitNonComedyEventType(string? eventType) =>
        !string.IsNullOrWhiteSpace(eventType)
        && (string.Equals(eventType, "DailyKatha", StringComparison.OrdinalIgnoreCase)
            || string.Equals(eventType, "HinduFestival", StringComparison.OrdinalIgnoreCase)
            || string.Equals(eventType, "HinduPanchang", StringComparison.OrdinalIgnoreCase)
            || string.Equals(eventType, "DevotionalPrarthana", StringComparison.OrdinalIgnoreCase)
            || string.Equals(eventType, "DailyRashifal", StringComparison.OrdinalIgnoreCase)
            || string.Equals(eventType, "AajKaItihaas", StringComparison.OrdinalIgnoreCase)
            || string.Equals(eventType, "EcosystemSpotlight", StringComparison.OrdinalIgnoreCase)
            || string.Equals(eventType, "Pratiyogita", StringComparison.OrdinalIgnoreCase));

    internal static bool IsComedyRequest(ProceduralVideoRequest request, ProceduralDialoguePlan plan) =>
        string.Equals(request.EventType, "FunnyComedy", StringComparison.OrdinalIgnoreCase)
        || request.Theme == ProceduralSceneTheme.ComedyStage3D
        || request.EnableComedySfx
        || request.SparseComedyAudio
        || (!IsExplicitNonComedyEventType(request.EventType) && IsComedyPlan(plan));

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
            "surprised" => "Loud panicked shouting disbelief, frantic high-pitch gasp and rapid comic outrage",
            "scared" => "Trembling terrified stammer and frantic high-pitched comic panic, catching breath while caught red-handed",
            "laughing" => "Sharp mocking cackle and wicked giggling teasing belly-laugh",
            "smug" => "Sarcastic deadpan dry swagger, slow cocky eyebrow-raised mocking delivery",
            "proud" => "Booming victorious chest-thumping triumph and celebratory swagger",
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
            "laughing" => 1.11,
            "smug" or "sarcastic" or "mischievous" => 1.03,
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

        if (interruptedMidLine || (current.SfxCue is null && (nextEmotion is "angry" or "surprised" || next.Action is "shockedFall")))
            return ComedyInterruptGapSeconds;

        if (current.Action is "celebrate" or "brakeStop"
            || current.SfxCue is "tada" or "brake" or "rimshot" or "trombone" or "coin" or "cricket" or "slidedown")
            return ComedySfxReactionGapSeconds;

        if ((currentEmotion == "angry" && nextEmotion is "calm" or "sad" or "confused" or "scared" or "smug")
            || currentEmotion == "smug")
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
            "scared" => (1.07, 1.12, 1.16, 2.2),
            "surprised" => (1.06, 1.10, 1.18, 2.5),
            "laughing" => (1.02, 1.06, 1.12, 1.5),
            "smug" or "sarcastic" or "mischievous" => (0.98, 1.00, 1.08, 1.8),
            "proud" => (0.99, 1.03, 1.12, 1.8),
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
