using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Abstractions.Storage;
using AnimStudio.Application.Abstractions.StoryAgent;
using AnimStudio.Application.Ai;
using AnimStudio.Application.Voices;
using AnimStudio.Domain.Stories;
using AnimStudio.Domain.Voices;
using Microsoft.Extensions.Logging;

namespace AnimStudio.Application.StoryAgent;

/// <summary>Who will speak a run's narration, decided once, from what the person chose and what they own.</summary>
/// <param name="VoiceId">The speech engine's own voice for the lines, or the voice a profile's lines are first spoken in.</param>
public sealed record NarrationPlan(
    StoryNarrationMode Mode,
    string VoiceId,
    string? Engine,
    double Rate,
    VoiceProfile? Profile,
    bool ClosestToMyVoice,
    string? Model = null,
    string? Style = null,
    string? ReplicatedVoiceId = null,
    IReadOnlyDictionary<string, string>? Cast = null)
{
    public string Describe() => (Mode switch
    {
        StoryNarrationMode.MyVoice when ReplicatedVoiceId is not null => $"{Profile?.Name ?? "My voice"} (Google)",
        StoryNarrationMode.MyVoice => $"{Profile?.Name ?? "My voice"}{(ClosestToMyVoice ? " (converted)" : string.Empty)}",
        _ => $"voice {VoiceId}"
    }) + (Cast is { Count: > 0 } cast
        ? $", with {cast.Count} character voice{(cast.Count == 1 ? string.Empty : "s")}"
        : string.Empty);
}

public sealed record StoryNarration(byte[] Wav, double DurationSeconds, IReadOnlyList<StoryPause> Pauses);

/// <summary>
/// Speaks a line of a story: with the speech engine's own voice, or in the person's own voice - their tuned voice when
/// the engine has one (seconds), or by converting a stock line with the AI voice converter (minutes on a CPU) - and
/// finishes it for the video.
/// </summary>
/// <remarks>
/// <para>
/// This is the same policy the voiceover panel follows, so a story sounds like the same voice the person already
/// previewed there, and a line converted in either place is reused by the other (the converted line's cache key is
/// built the same way).
/// </para>
/// <para>
/// The person's recording is never sent to a hosted engine: for their own voice only the local paths above are used,
/// whatever engine was named - unless they sent that voice to the named engine themselves, with their spoken consent
/// (<see cref="MyVoiceReplication"/>); then the engine speaks it. The profile must belong to the run's owner; a run
/// holds only an id.
/// </para>
/// </remarks>
public sealed partial class StoryNarrator(
    IAiExecutor ai,
    IVoiceProfileRepository myVoices,
    IStudioVoiceRenderer voiceRenderer,
    MyVoiceTuning tuning,
    IObjectStore store,
    IStoryAudioFinisher finisher,
    ILogger<StoryNarrator> logger)
{
    public const string DefaultHindiVoice = "hm_omega";
    public const string DefaultEnglishVoice = "am_michael";
    public const string DefaultGeminiVoice = "Charon";

    private const int MaxCachedLinesPerVoice = 400;

    /// <summary>The breath between one speaker's line and the next one's, when they are spoken in separate calls.</summary>
    private const double LineGapSeconds = 0.25;
    private const double MinRate = 0.5;
    private const double MaxRate = 2.0;

    [GeneratedRegex(@"^[A-Za-z0-9_.+\-]{1,64}$", RegexOptions.CultureInvariant)]
    private static partial Regex VoiceIdPattern();

    public async Task<NarrationPlan> PlanAsync(StoryRun run, CancellationToken ct)
    {
        var options = run.Options;
        VoiceProfile? profile = null;

        if (options.Narration == StoryNarrationMode.MyVoice)
        {
            if (string.IsNullOrWhiteSpace(options.VoiceProfileId))
                throw new StoryStageException("my-voice-missing", "Pick one of your voices, or choose another narration.");

            profile = await myVoices.GetAsync(options.VoiceProfileId, ct).ConfigureAwait(false);
            if (profile is null || !string.Equals(profile.UserId, run.UserId, StringComparison.Ordinal))
            {
                if (profile is not null)
                    logger.LogWarning("Story run {RunId} named a voice that is not its owner's.", run.Id);
                throw new StoryStageException("my-voice-missing", "That voice isn't available any more. Pick one of your voices, or choose another narration.");
            }
        }

        // Their own voice is made on this machine - unless they sent it to the engine named, with their consent.
        var named = string.IsNullOrWhiteSpace(options.SpeechEngine) ? null : options.SpeechEngine.Trim();
        var replicated = profile is null ? null : MyVoiceReplication.VoiceFor(profile, named);
        var engine = profile is null || replicated is not null ? named : null;

        var voiceId = !string.IsNullOrWhiteSpace(options.VoiceId)
            ? options.VoiceId.Trim()
            : profile?.BaseVoiceId is { Length: > 0 } own
                ? own
                // Gemini's voices speak every language, and it knows none of Kokoro's names.
                : KnownAiProviders.Find(engine ?? string.Empty)?.Family == AiProviderFamily.GeminiSpeech
                    ? DefaultGeminiVoice
                    : string.Equals(run.Brief.Language, "en", StringComparison.OrdinalIgnoreCase) ? DefaultEnglishVoice : DefaultHindiVoice;

        if (!VoiceIdPattern().IsMatch(voiceId) || MyVoiceTuning.IsTunedVoice(voiceId))
            throw new StoryStageException("voice-invalid", "That voice can't be used. Pick one from the voice list.");

        var rate = double.IsFinite(options.SpeechRate) ? Math.Clamp(options.SpeechRate, MinRate, MaxRate) : 1.0;
        var model = engine is not null && !string.IsNullOrWhiteSpace(options.SpeechModel) ? options.SpeechModel.Trim() : null;
        var style = SupportsStyle(engine) && !string.IsNullOrWhiteSpace(options.SpeechStyle) ? options.SpeechStyle.Trim() : null;

        // A voice for each character from the engine's voices in the story's language. Not with a voice made on this
        // machine (theirs, tuned or converted), and not from an engine whose voices are unknown here: the narrator reads.
        var cast = options.CastVoices && run.Script?.Cast is { Count: > 0 } members
            && (profile is null || replicated is not null)
            ? StoryVoiceCasting.Assign(members, voiceId, engine, run.Brief.Language) is { Count: > 0 } assigned ? assigned : null
            : null;

        return new NarrationPlan(options.Narration, voiceId, engine, rate, profile,
            profile is not null && replicated is null && options.ClosestToMyVoice, model, style, replicated, cast);
    }

    /// <summary>Engines that take a delivery instruction with a line; the rest would ignore it.</summary>
    public static bool SupportsStyle(string? engine) =>
        engine is not null && KnownAiProviders.Find(engine)?.Family == AiProviderFamily.GeminiSpeech;

    /// <summary>Engines that speak two voices in one call, so a scene with a character costs one request, not three.</summary>
    public static bool SpeaksDialogue(string? engine) =>
        engine is not null && KnownAiProviders.Find(engine)?.Family == AiProviderFamily.GeminiSpeech;

    /// <summary>The scene has a character's line, and the plan has a voice for them.</summary>
    private static bool UsesCast(NarrationPlan plan, StoryScene scene) =>
        plan.Cast is { Count: > 0 } cast && scene.Lines.Any(l => cast.ContainsKey(l.Speaker));

    /// <summary>
    /// As <see cref="Fingerprint(NarrationPlan, string)"/>, with who says which line when characters speak, and the take
    /// when the person asked for the scene again (only then, so narration made before retakes existed is still found).
    /// </summary>
    public static string Fingerprint(NarrationPlan plan, StoryScene scene) =>
        Fingerprint(plan, (UsesCast(plan, scene)
                ? scene.Narration + "\ncast:" + string.Join('\n', scene.Lines.Select(l => $"{VoiceOf(plan, l) ?? "-"}|{l.Text}"))
                : scene.Narration)
            + (scene.AudioTake > 0 ? $"\ntake:{scene.AudioTake}" : string.Empty));

    /// <summary>The character's voice, or null for the narrator's.</summary>
    private static string? VoiceOf(NarrationPlan plan, StoryLine line) =>
        plan.Cast is { } cast && cast.TryGetValue(line.Speaker, out var voice) ? voice : null;

    /// <summary>
    /// A short stable name for what a line sounds like, so a scene's narration is only made again when the words or the voice
    /// change. It is part of the narration file's key.
    /// </summary>
    public static string Fingerprint(NarrationPlan plan, string text) =>
        Sha256Hex(string.Join('\n', "story-v1", text, plan.Mode, plan.VoiceId, plan.Engine, Invariant(plan.Rate),
            plan.Profile?.Id, plan.Profile?.TunedVoiceId, plan.ClosestToMyVoice)
            // Appended only when set, so narration made before models and styles could be chosen is still found.
            + (plan.Model is null ? string.Empty : $"\nmodel:{plan.Model}")
            + (plan.Style is null ? string.Empty : $"\nstyle:{plan.Style}")
            + (plan.ReplicatedVoiceId is null ? string.Empty : $"\nreplicated:{plan.ReplicatedVoiceId}"))[..16];

    /// <summary>A scene: in the narrator's voice, or with each character's lines in their own voice.</summary>
    /// <remarks>A retake (<see cref="StoryScene.AudioTake"/>) asks the engine afresh rather than reusing its earlier answer.</remarks>
    public async Task<StoryNarration> SpeakAsync(NarrationPlan plan, StoryScene scene, string userId, CancellationToken ct)
    {
        var fresh = scene.AudioTake > 0;
        if (!UsesCast(plan, scene)) return await SpeakAsync(plan, scene.Narration, userId, ct, fresh).ConfigureAwait(false);

        if (!finisher.IsAvailable)
            throw new StoryStageException("ffmpeg-missing", "ffmpeg isn't available on this server, so narration can't be finished.");

        var parts = new List<byte[]>();
        foreach (var chunk in Dialogue(plan, scene.Lines, SpeaksDialogue(plan.Engine) ? 2 : 1))
        {
            var outcome = await ai.SpeechAsync(chunk with
            {
                Rate = plan.Rate,
                ProviderId = plan.Engine,
                Model = plan.Model,
                Style = plan.Style,
                BypassCache = fresh
            }, new AiCallContext(null, userId), ct).ConfigureAwait(false);
            Check(outcome, plan);

            if (AiAudioValidator.Sniff(outcome.Value!.Content) != AiAudioValidator.Wav)
                throw new StoryStageException("speech-format", "The speech engine returned audio in a format the studio can't use (WAV needed).");
            parts.Add(outcome.Value.Content);
        }

        var joined = StoryWav.Join(parts, LineGapSeconds)
            ?? throw new StoryStageException("speech-format", "The speech engine returned the lines of a scene in different audio formats.");

        var finished = await finisher.FinishAsync(joined, StoryPacing.LeadSeconds, StoryPacing.TailSeconds, ct).ConfigureAwait(false);
        return new StoryNarration(finished.Wav, finished.DurationSeconds, finished.Pauses);
    }

    /// <summary>
    /// The scene's lines as requests of at most <paramref name="maxVoices"/> voices each, in order: one voice is a plain
    /// line, two a dialogue the engine speaks in one call.
    /// </summary>
    private static IEnumerable<AiSpeechRequest> Dialogue(NarrationPlan plan, IReadOnlyList<StoryLine> lines, int maxVoices)
    {
        var chunk = new List<(string? Voice, string Text)>();
        foreach (var line in lines)
        {
            var voice = VoiceOf(plan, line);
            if (chunk.Select(t => t.Voice).Append(voice).Distinct().Count() > maxVoices)
            {
                yield return Request(plan, chunk);
                chunk = [];
            }
            chunk.Add((voice, line.Text));
        }

        if (chunk.Count > 0) yield return Request(plan, chunk);
    }

    private static AiSpeechRequest Request(NarrationPlan plan, List<(string? Voice, string Text)> chunk)
    {
        var voices = chunk.Select(t => t.Voice).Distinct().ToList();
        if (voices.Count == 1)
        {
            return new AiSpeechRequest
            {
                Text = string.Join(' ', chunk.Select(t => t.Text)),
                VoiceId = voices[0] ?? plan.VoiceId,
                ReplicatedVoiceId = voices[0] is null ? plan.ReplicatedVoiceId : null
            };
        }

        // Plain labels the model reads as speaker names, never says aloud; the characters' own names may not be ASCII.
        var labels = voices.Select((v, i) => v is null ? "Narrator" : $"Speaker{i + 1}").ToList();
        return new AiSpeechRequest
        {
            Text = string.Join('\n', chunk.Select(t => $"{labels[voices.IndexOf(t.Voice)]}: {t.Text}")),
            VoiceId = plan.VoiceId,
            Speakers = [.. voices.Select((v, i) => new AiSpeechSpeaker(labels[i], v ?? plan.VoiceId, v is null ? plan.ReplicatedVoiceId : null))]
        };
    }

    public async Task<StoryNarration> SpeakAsync(NarrationPlan plan, string text, string userId, CancellationToken ct, bool fresh = false)
    {
        if (!finisher.IsAvailable)
            throw new StoryStageException("ffmpeg-missing", "ffmpeg isn't available on this server, so narration can't be finished.");

        // Their voice as Google replicated it: spoken there directly, nothing to tune or convert.
        var profile = plan.ReplicatedVoiceId is null ? plan.Profile : null;
        var tunedVoice = profile is not null && !plan.ClosestToMyVoice
            ? await tuning.VoiceForAsync(profile, plan.VoiceId, ct).ConfigureAwait(false)
            : null;

        if (profile is not null && tunedVoice is null && !voiceRenderer.CanReVoice)
        {
            throw new StoryStageException("my-voice-unavailable",
                @"Your own voice needs Kokoro with voice tuning (scripts\setup-voiceover.ps1), or the AI voice converter (scripts\setup-voice-ai.ps1). Choose another narration, or set one of them up.");
        }

        var reVoice = profile is not null && tunedVoice is null;
        AiOutcome<AiSpeechResult>? outcome = null;
        if (tunedVoice is not null)
        {
            outcome = await SynthesizeAsync(plan, text, tunedVoice, userId, MyVoiceTuning.LanguageOf(plan.VoiceId), fresh, ct).ConfigureAwait(false);
            if (!outcome.IsSuccess && voiceRenderer.CanReVoice)
            {
                // The engine lost the voice or is down: the converter can still make the line.
                logger.LogWarning("The tuned voice of {VoiceId} could not speak a line ({Code}); converting instead.", profile!.Id, outcome.ErrorCode);
                outcome = null;
                reVoice = true;
            }
        }

        outcome ??= await SynthesizeAsync(plan, text, plan.VoiceId, userId, null, fresh, ct).ConfigureAwait(false);
        Check(outcome, plan);

        var content = outcome.Value!.Content;
        if (reVoice) content = await ReVoiceAsync(content, profile!, text, plan, ct).ConfigureAwait(false);

        // The bytes, not the engine's Content-Type, say what this is.
        if (AiAudioValidator.Sniff(content) is not (AiAudioValidator.Wav or AiAudioValidator.Mp3))
            throw new StoryStageException("speech-format", "The speech engine returned audio in a format the studio can't use (WAV or MP3 needed).");

        var finished = await finisher.FinishAsync(content, StoryPacing.LeadSeconds, StoryPacing.TailSeconds, ct).ConfigureAwait(false);
        return new StoryNarration(finished.Wav, finished.DurationSeconds, finished.Pauses);
    }

    private Task<AiOutcome<AiSpeechResult>> SynthesizeAsync(
        NarrationPlan plan, string text, string voiceId, string userId, string? language, bool fresh, CancellationToken ct) =>
        ai.SpeechAsync(new AiSpeechRequest
        {
            Text = text,
            VoiceId = voiceId,
            Rate = plan.Rate,
            LanguageCode = language,
            ProviderId = plan.Engine,
            Model = plan.Model,
            Style = plan.Style,
            BypassCache = fresh,
            ReplicatedVoiceId = voiceId == plan.VoiceId ? plan.ReplicatedVoiceId : null
        }, new AiCallContext(null, userId), ct);

    private static void Check(AiOutcome<AiSpeechResult> outcome, NarrationPlan plan)
    {
        if (outcome.IsSuccess) return;

        if (outcome.Kind == AiOutcomeKind.Unavailable)
        {
            throw new StoryStageException("no-speech-engine", plan.Engine is not null
                ? "The chosen speech engine is off, out of today's allowance, or being skipped after failing. Pick another engine, or try again later."
                : @"No speech engine is available: it is turned off, or it is being skipped for a couple of minutes after failing. Start it with scripts\setup-voiceover.ps1, then retry - or choose subtitles only.");
        }

        throw new StoryStageException(outcome.ErrorCode ?? "speech-failed", outcome.ErrorCode switch
        {
            "transport-failed" => @"The speech engine is not running (nothing answered on its address). Start it with scripts\setup-voiceover.ps1, then retry.",
            "timeout" => "The speech engine took too long. The first line after starting it loads the model; retry in a moment.",
            "endpoint-or-model-not-found" => "The speech engine does not know that voice. Pick another voice from the list.",
            "voice-required" => "That voice belongs to a different speech engine. Pick a voice from the list for this engine.",
            "credential-rejected" or "credential-missing" => "The speech engine refused its API key. Check the key in Settings.",
            "rate-limited" => "The speech engine is getting too many requests right now. Wait a minute and retry.",
            "content-blocked" => "The speech engine declined to speak a line of the script.",
            _ => "The speech engine could not speak a line of the script."
        });
    }

    /// <summary>
    /// A line in the person's own voice. Converting is slow on a CPU, so each result is kept under the voice and reused.
    /// The key is built the way the voiceover panel builds it, so a line made there is found here, and the other way round.
    /// </summary>
    private async Task<byte[]> ReVoiceAsync(byte[] speech, VoiceProfile voice, string text, NarrationPlan plan, CancellationToken ct)
    {
        var fingerprint = Sha256Hex(string.Join('\n', text, plan.VoiceId, plan.Rate.ToString("R", CultureInfo.InvariantCulture),
            voice.Id, voice.StorageKey, voice.TunedVoiceId, MyVoiceTuning.Revision, null, null));
        var cacheKey = $"voice-profiles/{voice.Id}/lines/{fingerprint}.wav";

        await using (var cached = await store.OpenAsync(cacheKey, ct).ConfigureAwait(false))
        {
            if (cached is not null)
            {
                using var buffer = new MemoryStream();
                await cached.CopyToAsync(buffer, ct).ConfigureAwait(false);
                return buffer.ToArray();
            }
        }

        byte[] revoiced;
        try
        {
            revoiced = await voiceRenderer.ReVoiceAsync(speech, voice.StorageKey, ct).ConfigureAwait(false);
        }
        catch (StudioVoiceException ex)
        {
            logger.LogWarning("Converting a line into voice {VoiceId} failed: {Reason}", voice.Id, ex.Message);
            throw new StoryStageException("my-voice-failed", ex.Message);
        }

        await using (var content = new MemoryStream(revoiced, writable: false))
            await store.SaveAsync(cacheKey, content, AiAudioValidator.Wav, ct).ConfigureAwait(false);

        // Re-read so two lines finishing together don't drop each other's key.
        var fresh = await myVoices.GetAsync(voice.Id, ct).ConfigureAwait(false);
        if (fresh is null)
        {
            await store.DeleteAsync(cacheKey, ct).ConfigureAwait(false);
            return revoiced;
        }

        if (!fresh.CachedLineKeys.Contains(cacheKey, StringComparer.Ordinal)) fresh.CachedLineKeys.Add(cacheKey);
        while (fresh.CachedLineKeys.Count > MaxCachedLinesPerVoice)
        {
            await store.DeleteAsync(fresh.CachedLineKeys[0], ct).ConfigureAwait(false);
            fresh.CachedLineKeys.RemoveAt(0);
        }

        await myVoices.UpsertAsync(fresh, ct).ConfigureAwait(false);
        return revoiced;
    }

    private static string Invariant(double value) => value.ToString("R", CultureInfo.InvariantCulture);

    private static string Sha256Hex(string value) =>
        Convert.ToHexStringLower(SHA256.HashData(Encoding.UTF8.GetBytes(value)));
}
