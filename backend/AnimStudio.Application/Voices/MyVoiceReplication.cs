using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Ai;
using AnimStudio.Domain.Voices;
using Microsoft.Extensions.Logging;

namespace AnimStudio.Application.Voices;

/// <summary>
/// Sends one of the user's own voices to Google, at their explicit request and with a recording
/// of them reading Google's consent statement, so Gemini TTS can speak in it - with delivery
/// styles and every language Gemini speaks. The only path by which a sample leaves this machine.
/// </summary>
/// <remarks>
/// The voice Google makes is kept in the operator's Google project and spoken only through the
/// profile, checked against its owner, as <see cref="AiSpeechRequest.ReplicatedVoiceId"/>.
/// Deleting the profile, or taking it off Google, deletes it there too.
/// </remarks>
public sealed class MyVoiceReplication(
    IAiProviderRegistry registry,
    IEnumerable<IAiProvider> providers,
    IStudioVoiceRenderer renderer,
    IVoiceProfileRepository voices,
    TimeProvider clock,
    ILogger<MyVoiceReplication> logger)
{
    /// <summary>Google refuses a replication sample shorter than this.</summary>
    public const double MinSampleSeconds = 10;

    /// <summary>The engine that can replicate a voice now, or null when none is on and configured.</summary>
    public IVoiceReplicatingSpeechProvider? Replicator() =>
        renderer.CanPrepareReference ? registry.SpeechChain().OfType<IVoiceReplicatingSpeechProvider>().FirstOrDefault() : null;

    /// <summary>
    /// The replicated voice to speak <paramref name="profile"/>'s lines in when <paramref name="engine"/> is
    /// the engine that keeps it; null otherwise, and the line is then made on this machine.
    /// </summary>
    public static string? VoiceFor(VoiceProfile profile, string? engine) =>
        profile.GoogleVoiceId is { } id && engine is not null &&
        string.Equals(profile.GoogleVoiceProviderId, engine, StringComparison.OrdinalIgnoreCase)
            ? id
            : null;

    /// <summary>
    /// Replicates <paramref name="profile"/> from its sample and the consent recording at
    /// <paramref name="consentStorageKey"/>, and records it on the profile. Throws
    /// <see cref="AiProviderException"/> when the engine refuses (a consent that does not match,
    /// a sample it cannot use) and <see cref="StudioVoiceException"/> when a recording can't be read.
    /// </summary>
    public async Task<VoiceProfile> ReplicateAsync(
        VoiceProfile profile, string consentStorageKey, string userId, CancellationToken ct)
    {
        var replicator = Replicator()
            ?? throw new AiProviderException("not-configured", "No speech engine that can replicate a voice is set up.");

        var sample = await renderer.ReferenceClipAsync(profile.StorageKey, ct);
        var consent = await renderer.ReferenceClipAsync(consentStorageKey, ct);
        var voiceId = await replicator.ReplicateVoiceAsync(sample, consent, profile.Name, ct);

        // Deleted while Google was making it: don't leave its voice behind.
        var current = await voices.GetAsync(profile.Id, ct);
        if (current is null || !string.Equals(current.UserId, userId, StringComparison.Ordinal))
        {
            await DeleteQuietlyAsync(replicator, voiceId, profile.Id, ct);
            throw new KeyNotFoundException();
        }

        // Replaces one made before: the old voice would only use up the project's allowance.
        var previous = current.GoogleVoiceId is { } old && old != voiceId ? (old, current.GoogleVoiceProviderId) : default;

        current.GoogleVoiceId = voiceId;
        current.GoogleVoiceProviderId = replicator.Id.Value;
        current.GoogleConsentAtUtc = clock.GetUtcNow().UtcDateTime;
        await voices.UpsertAsync(current, ct);

        if (previous.old is not null) await ForgetAsync(previous.old, previous.GoogleVoiceProviderId, current.Id, ct);

        // Consent is a security-relevant event: who, when, which voice - never the recordings.
        logger.LogInformation("User {UserId} sent voice {VoiceId} to {Provider} with spoken consent at {ConsentAt:o}.",
            userId, current.Id, replicator.Id, current.GoogleConsentAtUtc);
        return current;
    }

    /// <summary>Deletes the profile's replicated voice where it is kept. Never throws: the caller is removing it regardless.</summary>
    public Task ForgetAsync(VoiceProfile profile, CancellationToken ct) =>
        profile.GoogleVoiceId is { } voiceId
            ? ForgetAsync(voiceId, profile.GoogleVoiceProviderId, profile.Id, ct)
            : Task.CompletedTask;

    private async Task ForgetAsync(string voiceId, string? providerId, string profileId, CancellationToken ct)
    {
        var keeper = providers.OfType<IVoiceReplicatingSpeechProvider>()
            .FirstOrDefault(p => string.Equals(p.Id.Value, providerId, StringComparison.Ordinal));
        if (keeper is null)
        {
            logger.LogWarning("The Google copy of voice {VoiceId} could not be deleted: the engine that keeps it is no longer set up.", profileId);
            return;
        }

        await DeleteQuietlyAsync(keeper, voiceId, profileId, ct);
    }

    private async Task DeleteQuietlyAsync(IVoiceReplicatingSpeechProvider keeper, string voiceId, string profileId, CancellationToken ct)
    {
        try
        {
            await keeper.DeleteReplicatedVoiceAsync(voiceId, ct);
            logger.LogInformation("The Google copy of voice {VoiceId} was deleted from {Provider}.", profileId, keeper.Id);
        }
        catch (Exception ex) when (ex is AiProviderException or ArgumentException)
        {
            logger.LogWarning("The Google copy of voice {VoiceId} could not be deleted from {Provider}: {Code}", profileId, keeper.Id,
                ex is AiProviderException typed ? typed.Code : ex.GetType().Name);
        }
    }
}
