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

public interface ITranscriptionProvider : IAiProvider
{
    Task<AiTranscriptionResult> TranscribeAsync(AiTranscriptionRequest request, CancellationToken ct);
}
