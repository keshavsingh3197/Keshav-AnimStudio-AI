using System.Text.RegularExpressions;
using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Ai;
using AnimStudio.Domain.Voices;
using Microsoft.Extensions.Logging;

namespace AnimStudio.Application.Voices;

/// <summary>
/// Gives each of the user's own voices a voice of the speech engine's own, tuned from their
/// sample, so lines are spoken in it directly: seconds instead of the minutes a re-voice takes
/// on a CPU. Tuned the first time a line asks for it, once, and then used for every language
/// the engine speaks: the pack is only a timbre, and each line says which language reads it.
/// </summary>
/// <remarks>
/// The engine keeps tuned voices in one folder it lists to every caller. Each is named after
/// its profile's unguessable id, hidden from voice lists, and refused as a voice in a request,
/// so a voice is only ever spoken through the profile, which is checked against its owner.
/// </remarks>
public sealed class MyVoiceTuning(
    IAiProviderRegistry registry,
    IEnumerable<IAiProvider> providers,
    IStudioVoiceRenderer renderer,
    IVoiceProfileRepository voices,
    TimeProvider clock,
    ILogger<MyVoiceTuning> logger)
{
    /// <summary>
    /// A stock Kokoro voice: its language letter (<c>a</c> US, <c>b</c> UK English, <c>h</c> Hindi,
    /// ...) then gender. The letter is the engine's language code for reading the line.
    /// </summary>
    private static readonly Regex StockVoice = new(@"^([abefhijpz])([fm])_", RegexOptions.CultureInvariant);

    /// <summary>
    /// Part of a line's fingerprint when it is in one of the user's voices, so lines saved
    /// before tuned voices spoke every language are spoken again rather than reused.
    /// </summary>
    public const string Revision = "tuned-any-language";

    /// <summary>Anywhere in a voice id, so a blend such as <c>af_bella+af_vp…_tuned</c> is caught too.</summary>
    private static readonly Regex TunedVoice = new(@"_vp[0-9a-f]{32}_tuned", RegexOptions.CultureInvariant);

    /// <summary>The engine tunes one voice at a time, and answers "busy" to a second.</summary>
    private static readonly SemaphoreSlim Tuning = new(1, 1);

    /// <summary>True for a voice that belongs to one user's profile and must not be listed or asked for by id.</summary>
    public static bool IsTunedVoice(string voiceId) => TunedVoice.IsMatch(voiceId);

    /// <summary>True when an engine is set up that can tune voices.</summary>
    public bool CanTune => renderer.CanPrepareReference && Tuner() is not null;

    /// <summary>
    /// The engine's language code for a line the stock voice <paramref name="lineVoiceId"/> would
    /// read, which a tuned voice must be given since its own name always says English.
    /// </summary>
    public static string? LanguageOf(string lineVoiceId) =>
        StockVoice.Match(lineVoiceId) is { Success: true } m ? m.Groups[1].Value : null;

    /// <summary>
    /// The voice to speak a line in, for a line the stock voice <paramref name="lineVoiceId"/>
    /// would read: the profile's tuned voice, tuning it first when it never has been. Speak it
    /// with <see cref="LanguageOf"/> the line's voice. Null when the line's voice is not a stock
    /// Kokoro one or no voice can be tuned; the caller then re-voices instead.
    /// </summary>
    public async Task<string?> VoiceForAsync(VoiceProfile profile, string lineVoiceId, CancellationToken ct)
    {
        if (!StockVoice.IsMatch(lineVoiceId)) return null;
        if (profile.TunedVoiceId is { } tuned) return tuned;
        if (profile.TuneRefusedAtUtc is not null || !renderer.CanPrepareReference) return null;
        if (Tuner() is not { } tuner) return null;

        await Tuning.WaitAsync(ct);
        try
        {
            // Another line may have tuned it while this one waited.
            var fresh = await voices.GetAsync(profile.Id, ct);
            if (fresh is null) return null;
            if (fresh.TunedVoiceId is not null || fresh.TuneRefusedAtUtc is not null) return fresh.TunedVoiceId;

            // Named as US English whatever it will read, so any engine that tunes accepts the
            // name and one voice serves every language; only the gender is the base voice's.
            var gender = StockVoice.Match(fresh.BaseVoiceId) is { Success: true } own
                ? own.Groups[2].Value
                : StockVoice.Match(lineVoiceId).Groups[2].Value;
            var name = $"a{gender}_vp{fresh.Id["vp_".Length..]}";

            string voiceId;
            try
            {
                var reference = await renderer.ReferenceClipAsync(fresh.StorageKey, ct);
                voiceId = await tuner.TuneVoiceAsync(reference, name, ct);
            }
            catch (AiProviderException ex) when (ex.Code is "bad-request")
            {
                // The engine read the sample and refused it (too short, silent, several
                // speakers). It will refuse it again, so it is not asked on every line.
                logger.LogInformation("Speech engine {Provider} would not tune voice {VoiceId} from its sample.", tuner.Id, fresh.Id);
                fresh.TuneRefusedAtUtc = clock.GetUtcNow().UtcDateTime;
                await voices.UpsertAsync(fresh, ct);
                return null;
            }
            catch (Exception ex) when (ex is AiProviderException or StudioVoiceException)
            {
                // Not running, busy, or tuning switched off: worth trying again on a later line.
                logger.LogWarning("Tuning voice {VoiceId} on {Provider} failed: {Code}", fresh.Id, tuner.Id,
                    ex is AiProviderException typed ? typed.Code : ex.GetType().Name);
                return null;
            }

            // Deleted while it was tuning: don't leave its voice behind.
            var current = await voices.GetAsync(fresh.Id, ct);
            if (current is null)
            {
                await DeleteQuietlyAsync(tuner, voiceId, fresh.Id, ct);
                return null;
            }

            current.TunedVoiceId = voiceId;
            current.TunedVoiceProviderId = tuner.Id.Value;
            await voices.UpsertAsync(current, ct);
            logger.LogInformation("Voice {VoiceId} tuned on {Provider}.", current.Id, tuner.Id);
            return voiceId;
        }
        finally
        {
            Tuning.Release();
        }
    }

    /// <summary>Deletes the profile's tuned voice from the engine that keeps it. Never throws: the profile is going regardless.</summary>
    public async Task ForgetAsync(VoiceProfile profile, CancellationToken ct)
    {
        if (profile.TunedVoiceId is not { } voiceId) return;

        var keeper = providers.OfType<IVoiceTuningSpeechProvider>()
            .FirstOrDefault(p => string.Equals(p.Id.Value, profile.TunedVoiceProviderId, StringComparison.Ordinal));
        if (keeper is null)
        {
            logger.LogWarning("Voice {VoiceId} was deleted, but the speech engine that keeps its tuned voice is no longer set up.", profile.Id);
            return;
        }

        await DeleteQuietlyAsync(keeper, voiceId, profile.Id, ct);
    }

    private IVoiceTuningSpeechProvider? Tuner() =>
        registry.SpeechChain().OfType<IVoiceTuningSpeechProvider>().FirstOrDefault(p => p.CanTuneVoices);

    private async Task DeleteQuietlyAsync(IVoiceTuningSpeechProvider keeper, string voiceId, string profileId, CancellationToken ct)
    {
        try
        {
            await keeper.DeleteTunedVoiceAsync(voiceId, ct);
        }
        catch (Exception ex) when (ex is AiProviderException or ArgumentException)
        {
            logger.LogWarning("The tuned voice of {VoiceId} could not be deleted from {Provider}: {Code}", profileId, keeper.Id,
                ex is AiProviderException typed ? typed.Code : ex.GetType().Name);
        }
    }
}
