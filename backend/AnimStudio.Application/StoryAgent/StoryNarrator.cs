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
    bool ClosestToMyVoice)
{
    public string Describe() => Mode switch
    {
        StoryNarrationMode.MyVoice => $"{Profile?.Name ?? "My voice"}{(ClosestToMyVoice ? " (converted)" : string.Empty)}",
        _ => $"voice {VoiceId}"
    };
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
/// whatever engine was named. The profile must belong to the run's owner; a run holds only an id.
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

    private const int MaxCachedLinesPerVoice = 400;
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

        var voiceId = !string.IsNullOrWhiteSpace(options.VoiceId)
            ? options.VoiceId.Trim()
            : profile?.BaseVoiceId is { Length: > 0 } own
                ? own
                : string.Equals(run.Brief.Language, "en", StringComparison.OrdinalIgnoreCase) ? DefaultEnglishVoice : DefaultHindiVoice;

        if (!VoiceIdPattern().IsMatch(voiceId) || MyVoiceTuning.IsTunedVoice(voiceId))
            throw new StoryStageException("voice-invalid", "That voice can't be used. Pick one from the voice list.");

        var rate = double.IsFinite(options.SpeechRate) ? Math.Clamp(options.SpeechRate, MinRate, MaxRate) : 1.0;
        var engine = profile is null && !string.IsNullOrWhiteSpace(options.SpeechEngine) ? options.SpeechEngine.Trim() : null;

        return new NarrationPlan(options.Narration, voiceId, engine, rate, profile, profile is not null && options.ClosestToMyVoice);
    }

    /// <summary>
    /// A short stable name for what a line sounds like, so a scene's narration is only made again when the words or the voice
    /// change. It is part of the narration file's key.
    /// </summary>
    public static string Fingerprint(NarrationPlan plan, string text) =>
        Sha256Hex(string.Join('\n', "story-v1", text, plan.Mode, plan.VoiceId, plan.Engine, Invariant(plan.Rate),
            plan.Profile?.Id, plan.Profile?.TunedVoiceId, plan.ClosestToMyVoice))[..16];

    public async Task<StoryNarration> SpeakAsync(NarrationPlan plan, string text, string userId, CancellationToken ct)
    {
        if (!finisher.IsAvailable)
            throw new StoryStageException("ffmpeg-missing", "ffmpeg isn't available on this server, so narration can't be finished.");

        var profile = plan.Profile;
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
            outcome = await SynthesizeAsync(plan, text, tunedVoice, userId, MyVoiceTuning.LanguageOf(plan.VoiceId), ct).ConfigureAwait(false);
            if (!outcome.IsSuccess && voiceRenderer.CanReVoice)
            {
                // The engine lost the voice or is down: the converter can still make the line.
                logger.LogWarning("The tuned voice of {VoiceId} could not speak a line ({Code}); converting instead.", profile!.Id, outcome.ErrorCode);
                outcome = null;
                reVoice = true;
            }
        }

        outcome ??= await SynthesizeAsync(plan, text, plan.VoiceId, userId, null, ct).ConfigureAwait(false);
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
        NarrationPlan plan, string text, string voiceId, string userId, string? language, CancellationToken ct) =>
        ai.SpeechAsync(new AiSpeechRequest
        {
            Text = text,
            VoiceId = voiceId,
            Rate = plan.Rate,
            LanguageCode = language,
            ProviderId = plan.Engine
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
