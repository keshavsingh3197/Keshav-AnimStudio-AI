using System.Diagnostics;
using System.Text;
using System.Text.Json;
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
/// narrator audio using the configured AI speech chain (with automatic Windows local SAPI
/// fallback so videos never render silent with only mouth movement), measures exact clip
/// lengths, stitches a clean time-aligned WAV track, and syncs visual turn/subtitle timings.
/// </summary>
internal static class ProceduralSpeechSynthesizer
{
    private const double LeadInSeconds = 0.35;
    private const double PauseBetweenTurnsSeconds = 0.24;
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
        CancellationToken ct)
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
            var providers = ResolveProviders(aiRegistry, request.SpeechProviderId);
            foreach (var provider in providers)
            {
                var synthesized = await TrySynthesizeWithAiProviderAsync(
                    provider, request, initialPlan, speechTurns, langCode,
                    workspaceInputDir, userId, ai, ffmpegOptions, logger, ct).ConfigureAwait(false);
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

        // Preserve sub-6s micro smoke renders when no AI registry is wired; for all real videos guarantee local spoken voice.
        if (ai is null && baseDurationSeconds <= 6)
            return null;

        if (OperatingSystem.IsWindows())
        {
            request.Progress?.Report(new ProceduralRenderProgress(
                ProceduralRenderStages.VoicesStart, "Synthesizing voices with the local Windows voice"));
            var local = await TrySynthesizeWithWindowsSapiAsync(
                speechTurns, langCode, workspaceInputDir, ffmpegOptions, logger, ct).ConfigureAwait(false);
            if (local is not null)
            {
                return await AssembleFinalSpeechTrackAsync(
                    local.Value.ClipBytes, local.Value.Durations,
                    initialPlan, speechTurns, spokenTitleOnly,
                    workspaceInputDir, minVideoSeconds, fitCap, ffmpegOptions,
                    local.Value.ProviderLabel, local.Value.VoicesUsed, logger, ct).ConfigureAwait(false);
            }
        }

        logger?.LogWarning("Procedural video speech could not be synthesized from either AI TTS chain or OS speech engine.");
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
        CancellationToken ct)
    {
        var (voiceA, voiceB) = await ResolveVoicesAsync(provider, initialPlan, request, ct).ConfigureAwait(false);
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

            var isRight = turn.Slot == DialogueSpeakerSlot.Right;
            var voiceId = isRight ? voiceB : voiceA;
            var style = initialPlan.HasCharacters
                ? (isRight
                    ? "Curious, warm, expressive dialogue delivery, clear pronunciation"
                    : "Calm, wise, engaging storytelling dialogue tone, clear expressive delivery")
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
                    Model = overrideModel,
                    ProviderId = provider.Id.Value
                }, new AiCallContext(null, string.IsNullOrWhiteSpace(userId) ? null : userId), ct).ConfigureAwait(false);

                if (!outcome.IsSuccess
                    && string.Equals(outcome.ErrorCode, "endpoint-or-model-not-found", StringComparison.OrdinalIgnoreCase)
                    && overrideModel is null
                    && provider.Id.Value.Contains("gemini", StringComparison.OrdinalIgnoreCase))
                {
                    overrideModel = "gemini-2.5-flash-preview-tts";
                    outcome = await ai.SpeechAsync(new AiSpeechRequest
                    {
                        Text = spokenText,
                        VoiceId = voiceId,
                        Rate = 1.0,
                        LanguageCode = langCode,
                        Style = style,
                        Model = overrideModel,
                        ProviderId = provider.Id.Value
                    }, new AiCallContext(null, string.IsNullOrWhiteSpace(userId) ? null : userId), ct).ConfigureAwait(false);
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

            var normalizedWav = await EnsureStereo48kWavAsync(speech.Content, workspaceInputDir, i, ffmpegOptions, ct)
                .ConfigureAwait(false);
            if (normalizedWav is null)
            {
                logger?.LogWarning("Procedural speech turn {Index} returned unusable audio format.", i);
                return null;
            }

            var dur = AiAudioValidator.TryGetWavDuration(normalizedWav) ?? speech.DurationSeconds ?? 0;
            if (dur <= 0.05)
                dur = Math.Max(1.2, spokenText.Length / 14.0);

            clipBytesList.Add(normalizedWav);
            clipDurations.Add(dur);
            voicesUsed.Add(voiceId);
        }

        return (clipBytesList, clipDurations, [.. voicesUsed]);
    }

    private sealed record LocalTtsTurnPayload(int Index, string Slot, string Text, string OutputPath);

    private static async Task<(List<byte[]> ClipBytes, List<double> Durations, string ProviderLabel, List<string> VoicesUsed)?> TrySynthesizeWithWindowsSapiAsync(
        List<ProceduralDialogueTurn> speechTurns,
        string langCode,
        string workspaceInputDir,
        FfmpegOptions ffmpegOptions,
        ILogger? logger,
        CancellationToken ct)
    {
        var payloadPath = Path.Combine(workspaceInputDir, "sapi_turns.json");
        var metaOutPath = Path.Combine(workspaceInputDir, "sapi_meta.txt");
        var scriptPath = Path.Combine(workspaceInputDir, "sapi_synth.ps1");

        var rawItems = new List<LocalTtsTurnPayload>(speechTurns.Count);
        var hasHindi = false;

        for (var i = 0; i < speechTurns.Count; i++)
        {
            var spoken = DialogueScriptParser.ToSpokenText(speechTurns[i].Text, langCode);
            if (ContainsDevanagari(spoken)) hasHindi = true;
            var outWav = Path.Combine(workspaceInputDir, $"sapi_turn_{i:D2}.wav");
            rawItems.Add(new LocalTtsTurnPayload(
                i,
                speechTurns[i].Slot == DialogueSpeakerSlot.Right ? "right" : "left",
                spoken,
                outWav));
        }

        // First probe & synthesize in a single clean PowerShell execution; script chooses hi-IN / en-IN SAPI voice if present,
        // otherwise converts Devanagari cleanly to phonetic Roman syllables so en-US voices pronounce Hindi dialogue audibly.
        var phoneticItems = rawItems.Select(item => new
        {
            item.Index,
            item.Slot,
            RawText = item.Text,
            PhoneticText = ContainsDevanagari(item.Text) ? DevanagariToPhonetic(item.Text) : item.Text,
            item.OutputPath
        }).ToList();

        await File.WriteAllTextAsync(payloadPath, JsonSerializer.Serialize(phoneticItems), Encoding.UTF8, ct).ConfigureAwait(false);

        const string psScript = """
            param([string]$PayloadPath, [string]$MetaOutPath, [string]$Lang)
            $ErrorActionPreference = 'Stop'
            Add-Type -AssemblyName System.Speech
            $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
            $voices = @($synth.GetInstalledVoices() | Where-Object { $_.Enabled } | ForEach-Object { $_.VoiceInfo })
            $hindiVoices = @($voices | Where-Object { $_.Culture.Name -like 'hi*' -or $_.Culture.Name -eq 'en-IN' })
            $hasNativeHindi = $hindiVoices.Count -gt 0
            $pool = if ($hasNativeHindi) { $hindiVoices } else { $voices }
            $leftVoice = ($pool | Select-Object -First 1).Name
            $rightVoice = if ($pool.Count -gt 1) { ($pool | Select-Object -Last 1).Name } else { $leftVoice }
            Set-Content -Path $MetaOutPath -Value "$hasNativeHindi|$leftVoice|$rightVoice" -Encoding UTF8

            $items = Get-Content -Path $PayloadPath -Raw -Encoding UTF8 | ConvertFrom-Json
            foreach ($item in $items) {
                $textToSpeak = if ($hasNativeHindi -or $Lang -eq 'en') { $item.RawText } else { $item.PhoneticText }
                if ([string]::IsNullOrWhiteSpace($textToSpeak)) { continue }
                $voice = if ($item.Slot -eq 'right') { $rightVoice } else { $leftVoice }
                if (-not [string]::IsNullOrWhiteSpace($voice)) {
                    $synth.SelectVoice($voice)
                }
                $synth.Rate = if ($item.Slot -eq 'right' -and $leftVoice -eq $rightVoice) { 1 } else { 0 }
                $synth.Volume = 100
                $synth.SetOutputToWaveFile($item.OutputPath)
                $synth.Speak($textToSpeak)
                $synth.SetOutputToNull()
            }
            $synth.Dispose()
            """;

        await File.WriteAllTextAsync(scriptPath, psScript, Encoding.UTF8, ct).ConfigureAwait(false);

        var psi = new ProcessStartInfo
        {
            FileName = "powershell",
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };
        psi.ArgumentList.Add("-NoProfile");
        psi.ArgumentList.Add("-NonInteractive");
        psi.ArgumentList.Add("-ExecutionPolicy");
        psi.ArgumentList.Add("Bypass");
        psi.ArgumentList.Add("-File");
        psi.ArgumentList.Add(scriptPath);
        psi.ArgumentList.Add("-PayloadPath");
        psi.ArgumentList.Add(payloadPath);
        psi.ArgumentList.Add("-MetaOutPath");
        psi.ArgumentList.Add(metaOutPath);
        psi.ArgumentList.Add("-Lang");
        psi.ArgumentList.Add(langCode);

        try
        {
            using var proc = Process.Start(psi);
            if (proc is null) return null;

            using var timeout = CancellationTokenSource.CreateLinkedTokenSource(ct);
            timeout.CancelAfter(TimeSpan.FromSeconds(50));
            var errTask = proc.StandardError.ReadToEndAsync(timeout.Token);
            _ = proc.StandardOutput.ReadToEndAsync(timeout.Token);
            await proc.WaitForExitAsync(timeout.Token).ConfigureAwait(false);
            var stderr = await errTask.ConfigureAwait(false);
            if (proc.ExitCode != 0)
            {
                logger?.LogWarning("Windows SAPI speech fallback exited {Code}: {Error}", proc.ExitCode, stderr);
                return null;
            }
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger?.LogWarning(ex, "Windows SAPI speech fallback failed to run.");
            return null;
        }
        finally
        {
            TryDelete(payloadPath);
            TryDelete(scriptPath);
        }

        var metaParts = File.Exists(metaOutPath)
            ? (await File.ReadAllTextAsync(metaOutPath, ct).ConfigureAwait(false)).Trim().Split('|')
            : [];
        TryDelete(metaOutPath);

        var usedNativeHindi = metaParts.Length > 0 && string.Equals(metaParts[0], "True", StringComparison.OrdinalIgnoreCase);
        var voiceAName = metaParts.Length > 1 && !string.IsNullOrWhiteSpace(metaParts[1]) ? metaParts[1].Trim() : "Windows-SAPI-A";
        var voiceBName = metaParts.Length > 2 && !string.IsNullOrWhiteSpace(metaParts[2]) ? metaParts[2].Trim() : "Windows-SAPI-B";

        var clipBytesList = new List<byte[]>(rawItems.Count);
        var clipDurations = new List<double>(rawItems.Count);
        var voicesUsed = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        for (var i = 0; i < rawItems.Count; i++)
        {
            var wavPath = rawItems[i].OutputPath;
            if (!File.Exists(wavPath))
            {
                clipBytesList.Add([]);
                clipDurations.Add(FallbackSeconds(speechTurns[i]));
                continue;
            }

            var rawWav = await File.ReadAllBytesAsync(wavPath, ct).ConfigureAwait(false);
            TryDelete(wavPath);

            var normalized = await EnsureStereo48kWavAsync(rawWav, workspaceInputDir, 100 + i, ffmpegOptions, ct)
                .ConfigureAwait(false);
            if (normalized is null)
            {
                clipBytesList.Add([]);
                clipDurations.Add(FallbackSeconds(speechTurns[i]));
                continue;
            }

            var dur = AiAudioValidator.TryGetWavDuration(normalized) ?? Math.Max(1.2, rawItems[i].Text.Length / 13.0);
            clipBytesList.Add(normalized);
            clipDurations.Add(dur);
            voicesUsed.Add(rawItems[i].Slot == "right" ? ShortVoiceName(voiceBName) : ShortVoiceName(voiceAName));
        }

        if (clipBytesList.All(b => b.Length <= 44))
            return null;

        var providerLabel = hasHindi && !usedNativeHindi ? "local-sapi-phonetic" : "local-sapi";
        return (clipBytesList, clipDurations, providerLabel, [.. voicesUsed]);
    }

    /// <summary>
    /// Caption time for a line whose voice clip failed: its planned slot, but never longer than it takes to read the
    /// line (~13 characters a second), so a single failed clip cannot leave a long silent gap in the video.
    /// </summary>
    private static double FallbackSeconds(ProceduralDialogueTurn turn) =>
        Math.Max(1.0, Math.Min(turn.EndSeconds - turn.StartSeconds, 0.6 + (turn.Text?.Length ?? 0) / 13.0));

    private static string ShortVoiceName(string full) =>
        full.Replace("Microsoft ", string.Empty, StringComparison.OrdinalIgnoreCase)
            .Replace(" Desktop", string.Empty, StringComparison.OrdinalIgnoreCase)
            .Trim();

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

        // Keep the finished video inside its cap (a Short must stay <= 180s): speed the voices up a little
        // and, when that is not enough, drop middle lines so the opening and the ending moral still play.
        var memePauseByTurnIdx = initialPlan.Memes
            .GroupBy(m => m.AfterTurnIndex)
            .ToDictionary(g => g.Key, g => Math.Clamp(g.First().Seconds * 0.65, 0.72, 1.05));
        var extraMemePauseSeconds = memePauseByTurnIdx.Values.Sum();
        var fit = SpeechFitPlanner.Plan(
            clipDurations, maxDurationSeconds, LeadInSeconds + extraMemePauseSeconds, PauseBetweenTurnsSeconds, TailSeconds, MaxSpeechTempo);
        var speechWavPath = Path.Combine(workspaceInputDir, "speech.wav");

        var built = await WriteSpeechTrackAsync(fit.KeptIndices).ConfigureAwait(false);
        if (built is null)
            return null;
        var (updatedTurns, cursor) = built.Value;

        var tempo = fit.Tempo;
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
                    clipDurations, maxDurationSeconds, LeadInSeconds + extraMemePauseSeconds, PauseBetweenTurnsSeconds, TailSeconds, maxTempo: 1.0);
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
                    nonEmptyClips.Add(clip);

                turns.Add(speechTurns[i] with
                {
                    StartSeconds = Math.Round(at, 3),
                    EndSeconds = Math.Round(at + clipDur, 3)
                });

                at += clipDur;

                // Dedicated silent reaction beat after turns carrying a [MEME] cue so memes & SFX never stomp dialogue.
                var hasMemeHere = memePauseByTurnIdx.TryGetValue(speechTurns[i].Index, out var memeBeat);
                if (k < kept.Count - 1)
                {
                    var pauseSecs = hasMemeHere ? memeBeat : PauseBetweenTurnsSeconds;
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

    private static IReadOnlyList<ISpeechAiProvider> ResolveProviders(IAiProviderRegistry registry, string? preferredProviderId)
    {
        var configured = registry.SpeechChain().Where(p => p.IsConfigured).ToList();
        if (string.IsNullOrWhiteSpace(preferredProviderId))
            return configured;

        var preferred = configured
            .Where(p => string.Equals(p.Id.Value, preferredProviderId.Trim(), StringComparison.OrdinalIgnoreCase))
            .ToList();
        var rest = configured
            .Where(p => !string.Equals(p.Id.Value, preferredProviderId.Trim(), StringComparison.OrdinalIgnoreCase));
        return [.. preferred, .. rest];
    }

    private static bool ContainsDevanagari(string text)
    {
        foreach (var ch in text)
        {
            if (ch is >= '\u0900' and <= '\u097F') return true;
        }
        return false;
    }

    /// <summary>
    /// Transliterates Devanagari Hindi into clean phonetic Romanized syllables so English-only
    /// Windows SAPI voices still speak every Hindi word aloud when native Hindi voices or cloud
    /// Gemini TTS are not configured.
    /// </summary>
    internal static string DevanagariToPhonetic(string input)
    {
        if (string.IsNullOrEmpty(input)) return string.Empty;
        var sb = new StringBuilder(input.Length * 2);
        var i = 0;

        while (i < input.Length)
        {
            var ch = input[i];
            if (ch == '\u0950') // Om ॐ
            {
                sb.Append("Om ");
                i++;
                continue;
            }
            if (ch == '\u0964' || ch == '\u0965') // Danda । ॥
            {
                sb.Append(". ");
                i++;
                continue;
            }

            if (DevanagariDigits.TryGetValue(ch, out var digit))
            {
                sb.Append(digit);
                i++;
                continue;
            }

            if (IndependentVowels.TryGetValue(ch, out var indep))
            {
                sb.Append(indep);
                i++;
                continue;
            }

            if (Consonants.TryGetValue(ch, out var cons))
            {
                // Handle nukta modifier \u093C right after consonant
                if (i + 1 < input.Length && input[i + 1] == '\u093C')
                {
                    cons = NuktaConsonant(ch, cons);
                    i++;
                }

                sb.Append(cons);
                i++;

                // Consume halant, dependent matra, or inherit clean 'a'
                if (i < input.Length && input[i] == '\u094D') // Virama / Halant
                {
                    i++;
                }
                else if (i < input.Length && DependentMatras.TryGetValue(input[i], out var matra))
                {
                    sb.Append(matra);
                    i++;
                }
                else
                {
                    var isWordEnd = i >= input.Length || !IsDevanagariLetter(input[i]);
                    if (!isWordEnd)
                        sb.Append('a');
                }
                continue;
            }

            if (ch == '\u0902') { sb.Append('n'); i++; continue; } // Anusvara
            if (ch == '\u0901') { sb.Append('n'); i++; continue; } // Chandrabindu
            if (ch == '\u0903') { sb.Append("ha"); i++; continue; } // Visarga
            if (ch == '\u093C' || ch == '\u094D') { i++; continue; }

            sb.Append(ch);
            i++;
        }

        return sb.ToString();
    }

    private static bool IsDevanagariLetter(char ch) =>
        IndependentVowels.ContainsKey(ch) || Consonants.ContainsKey(ch);

    private static string NuktaConsonant(char baseChar, string fallback) => baseChar switch
    {
        '\u0915' => "k",
        '\u0916' => "kh",
        '\u0917' => "g",
        '\u091C' => "z",
        '\u0921' => "r",
        '\u0922' => "rh",
        '\u092B' => "f",
        _ => fallback
    };

    private static readonly Dictionary<char, string> DevanagariDigits = new()
    {
        ['\u0966'] = "0", ['\u0967'] = "1", ['\u0968'] = "2", ['\u0969'] = "3", ['\u096A'] = "4",
        ['\u096B'] = "5", ['\u096C'] = "6", ['\u096D'] = "7", ['\u096E'] = "8", ['\u096F'] = "9"
    };

    private static readonly Dictionary<char, string> IndependentVowels = new()
    {
        ['\u0905'] = "a", ['\u0906'] = "aa", ['\u0907'] = "i", ['\u0908'] = "ee",
        ['\u0909'] = "u", ['\u090A'] = "oo", ['\u090B'] = "ri", ['\u090F'] = "e",
        ['\u0910'] = "ai", ['\u0913'] = "o", ['\u0914'] = "au", ['\u090D'] = "ae", ['\u0911'] = "o"
    };

    private static readonly Dictionary<char, string> DependentMatras = new()
    {
        ['\u093E'] = "aa", ['\u093F'] = "i", ['\u0940'] = "ee", ['\u0941'] = "u",
        ['\u0942'] = "oo", ['\u0943'] = "ri", ['\u0947'] = "e", ['\u0948'] = "ai",
        ['\u094B'] = "o", ['\u094C'] = "au", ['\u0945'] = "ae", ['\u0949'] = "o"
    };

    private static readonly Dictionary<char, string> Consonants = new()
    {
        ['\u0915'] = "k", ['\u0916'] = "kh", ['\u0917'] = "g", ['\u0918'] = "gh", ['\u0919'] = "ng",
        ['\u091A'] = "ch", ['\u091B'] = "chh", ['\u091C'] = "j", ['\u091D'] = "jh", ['\u091E'] = "ny",
        ['\u091F'] = "t", ['\u0920'] = "th", ['\u0921'] = "d", ['\u0922'] = "dh", ['\u0923'] = "n",
        ['\u0924'] = "t", ['\u0925'] = "th", ['\u0926'] = "d", ['\u0927'] = "dh", ['\u0928'] = "n",
        ['\u092A'] = "p", ['\u092B'] = "ph", ['\u092C'] = "b", ['\u092D'] = "bh", ['\u092E'] = "m",
        ['\u092F'] = "y", ['\u0930'] = "r", ['\u0932'] = "l", ['\u0935'] = "v",
        ['\u0936'] = "sh", ['\u0937'] = "sh", ['\u0938'] = "s", ['\u0939'] = "h"
    };

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
}
