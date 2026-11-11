using AnimStudio.Domain.Ai;

namespace AnimStudio.Application.Abstractions.Ai;

public sealed record AiProviderHealth(bool IsHealthy, string? Reason = null)
{
    public static readonly AiProviderHealth Healthy = new(true);
    public static AiProviderHealth Unhealthy(string reason) => new(false, reason);
}

/// <summary>
/// What every provider has regardless of what it does. A provider that is registered but
/// not configured is not an error: it is the normal state of this application, which must
/// run with no AI at all.
/// </summary>
public interface IAiProvider
{
    AiProviderId Id { get; }
    AiCapability Capability { get; }

    /// <summary>False when the operator has not supplied whatever this provider needs.</summary>
    bool IsConfigured { get; }

    Task<AiProviderHealth> CheckHealthAsync(CancellationToken ct);
}

public interface ITextAiProvider : IAiProvider
{
    Task<AiTextResult> CompleteAsync(AiTextRequest request, CancellationToken ct);
}

public interface IImageAiProvider : IAiProvider
{
    Task<AiImageResult> GenerateAsync(AiImageRequest request, CancellationToken ct);
}

public interface ISpeechAiProvider : IAiProvider
{
    /// <summary>Voices this provider offers, for the character voice picker.</summary>
    Task<IReadOnlyList<AiVoice>> ListVoicesAsync(CancellationToken ct);

    Task<AiSpeechResult> SynthesizeAsync(AiSpeechRequest request, CancellationToken ct);
}

/// <param name="Group">
/// Where the picker files the voice when its language does not say - "Designed voices", or
/// voices that speak any language. Null groups it by <paramref name="LanguageCode"/>.
/// </param>
public sealed record AiVoice(
    string VoiceId, string DisplayName, string? LanguageCode, string? Gender, string? Group = null);

/// <summary>
/// A speech engine that can make a voice of its own from a reference recording and keep it
/// (Kokoro-FastAPI's <c>/dev/tune</c>), so lines are spoken in that voice directly instead of
/// being spoken by a stock voice and re-voiced afterwards.
/// </summary>
public interface IVoiceTuningSpeechProvider : ISpeechAiProvider
{
    /// <summary>
    /// False unless the engine runs on this machine: the recording is a real person's voice,
    /// and it is never sent to a hosted service.
    /// </summary>
    bool CanTuneVoices { get; }

    /// <summary>
    /// Tunes a voice from <paramref name="referenceWav"/> and keeps it as <paramref name="name"/>;
    /// returns the voice id to speak with. Tuning the same name again returns the voice already kept.
    /// </summary>
    Task<string> TuneVoiceAsync(byte[] referenceWav, string name, CancellationToken ct);

    /// <summary>Deletes a voice <see cref="TuneVoiceAsync"/> kept. One that is already gone is not an error.</summary>
    Task DeleteTunedVoiceAsync(string voiceId, CancellationToken ct);
}

/// <summary>
/// A hosted speech engine that can replicate a person's voice from a sample plus their spoken
/// consent (Gemini's voice replication), and keeps the voice in the operator's account.
/// </summary>
/// <remarks>
/// This is the one place a person's recording leaves this machine, so it is only ever called
/// for a profile its owner explicitly sent, with a consent recording in their own voice.
/// </remarks>
public interface IVoiceReplicatingSpeechProvider : ISpeechAiProvider
{
    /// <summary>
    /// Replicates the voice in <paramref name="sampleWav"/> (10-30 s of one speaker), with
    /// <paramref name="consentWav"/> the same speaker reading the engine's consent statement.
    /// Returns the voice id to speak with as <see cref="AiSpeechRequest.ReplicatedVoiceId"/>.
    /// </summary>
    Task<string> ReplicateVoiceAsync(byte[] sampleWav, byte[] consentWav, string displayName, CancellationToken ct);

    /// <summary>Deletes a voice <see cref="ReplicateVoiceAsync"/> made. One that is already gone is not an error.</summary>
    Task DeleteReplicatedVoiceAsync(string voiceId, CancellationToken ct);
}

/// <summary>
/// A hosted engine on the same Google key that also composes music from a description (Lyria), so a story's background
/// track is made for it rather than searched for.
/// </summary>
public interface IMusicGeneratingProvider : IAiProvider
{
    /// <summary>
    /// A track from <paramref name="prompt"/> with <paramref name="model"/> (the engine's default when null).
    /// Returns MP3 or WAV bytes, checked to be one of them.
    /// </summary>
    Task<AiGeneratedMusic> GenerateMusicAsync(string prompt, string? model, CancellationToken ct);
}

public sealed record AiGeneratedMusic(byte[] Content, string MimeType, string Model);

/// <summary>
/// A hosted engine on the same Google key that looks at a picture and answers a question about it in JSON - used to
/// find where the characters drawn into a story's picture have their mouths, so the renderer can make them talk.
/// </summary>
public interface IImageReadingProvider : IAiProvider
{
    /// <summary>
    /// The engine's JSON answer to <paramref name="prompt"/> about <paramref name="image"/>, as text. It is the model's
    /// own words: the caller parses and checks every field before anything uses it.
    /// </summary>
    Task<string> ReadImageAsync(byte[] image, string mimeType, string prompt, string? model, CancellationToken ct);
}

public interface ITranscriptionProvider : IAiProvider
{
    Task<AiTranscriptionResult> TranscribeAsync(AiTranscriptionRequest request, CancellationToken ct);
}
