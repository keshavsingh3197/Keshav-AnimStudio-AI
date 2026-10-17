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

public sealed record AiVoice(string VoiceId, string DisplayName, string? LanguageCode, string? Gender);

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

public interface ITranscriptionProvider : IAiProvider
{
    Task<AiTranscriptionResult> TranscribeAsync(AiTranscriptionRequest request, CancellationToken ct);
}
