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
    private const double PauseBetweenTurnsSeconds = 0.25;
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
                        workspaceInputDir, baseDurationSeconds,
                        provider.Id.Value, synthesized.Value.VoicesUsed, logger, ct).ConfigureAwait(false);
                }
            }
        }

        // Preserve sub-6s micro smoke renders when no AI registry is wired; for all real videos guarantee local spoken voice.
        if (ai is null && baseDurationSeconds <= 6)
            return null;

        if (OperatingSystem.IsWindows())
        {
            var local = await TrySynthesizeWithWindowsSapiAsync(
                speechTurns, langCode, workspaceInputDir, ffmpegOptions, logger, ct).ConfigureAwait(false);
            if (local is not null)
            {
                return await AssembleFinalSpeechTrackAsync(
                    local.Value.ClipBytes, local.Value.Durations,
                    initialPlan, speechTurns, spokenTitleOnly,
                    workspaceInputDir, baseDurationSeconds,
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
                clipDurations.Add(Math.Max(1.0, turn.EndSeconds - turn.StartSeconds));
                continue;
            }

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
                clipDurations.Add(Math.Max(1.0, speechTurns[i].EndSeconds - speechTurns[i].StartSeconds));
                continue;
            }

            var rawWav = await File.ReadAllBytesAsync(wavPath, ct).ConfigureAwait(false);
            TryDelete(wavPath);

            var normalized = await EnsureStereo48kWavAsync(rawWav, workspaceInputDir, 100 + i, ffmpegOptions, ct)
                .ConfigureAwait(false);
            if (normalized is null)
            {
                clipBytesList.Add([]);
                clipDurations.Add(Math.Max(1.0, speechTurns[i].EndSeconds - speechTurns[i].StartSeconds));
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
        string providerId,
        IReadOnlyList<string> voicesUsed,
        ILogger? logger,
        CancellationToken ct)
    {
        var nonEmptyClips = new List<byte[]>(clipBytesList.Count + 1);
        var referenceClip = clipBytesList.FirstOrDefault(b => b.Length > 44);
        if (referenceClip is null)
            return null;

        var leadGap = BuildSilenceWavLike(referenceClip, LeadInSeconds);
        if (leadGap is not null) nonEmptyClips.Add(leadGap);

        var updatedTurns = new List<ProceduralDialogueTurn>(initialPlan.Turns.Count);
        var cursor = LeadInSeconds;

        var titleTurn = !spokenTitleOnly ? initialPlan.Turns.FirstOrDefault(t => t.IsTitleHook) : null;
        if (titleTurn is not null)
        {
            updatedTurns.Add(titleTurn with
            {
                StartSeconds = 0.12,
                EndSeconds = Math.Round(Math.Max(MinTitleHoldSeconds, Math.Min(3.4, cursor + (clipDurations.Count > 0 ? clipDurations[0] : 2.2))), 2)
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
                var pause = BuildSilenceWavLike(referenceClip, PauseBetweenTurnsSeconds);
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
            (int)Math.Ceiling(Math.Max(baseDurationSeconds, cursor + 0.85)),
            ProceduralVideoRequest.MinSeconds,
            ProceduralVideoRequest.MaxSeconds);

        var updatedPlan = DialogueScriptParser.WithMeasuredTurns(initialPlan, updatedTurns);
        return new ProceduralSpeechSynthesisResult(
            speechWavPath,
            updatedPlan,
            totalSeconds,
            providerId,
            voicesUsed);
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
