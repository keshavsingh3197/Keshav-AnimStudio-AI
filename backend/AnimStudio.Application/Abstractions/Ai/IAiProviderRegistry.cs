using AnimStudio.Domain.Ai;

namespace AnimStudio.Application.Abstractions.Ai;

/// <summary>Why a capability is unusable right now, in a form the UI can show.</summary>
public enum AiUnavailableReason
{
    None = 0,
    NotConfigured = 1,
    Disabled = 2,
    CircuitOpen = 3,
    QuotaExhausted = 4
}

/// <summary>What <c>GET /api/ai/capabilities</c> reports for one capability.</summary>
public sealed record AiCapabilityStatus(
    AiCapability Capability,
    string? ProviderId,
    string? Model,
    bool Available,
    AiUnavailableReason Reason,
    IReadOnlyList<string> Chain);

/// <summary>
/// Turns configuration plus the registered providers into an ordered list of candidates
/// per capability.
/// <para>
/// Callers get a chain rather than a single provider on purpose: a free tier that has
/// just returned 429 should cost one skipped provider, not a failed render. The chain is
/// already filtered - unregistered, disabled, unconfigured and circuit-broken providers
/// are gone - so a caller only has to walk it and stop at the first success.
/// </para>
/// </summary>
public interface IAiProviderRegistry
{
    IReadOnlyList<ITextAiProvider> TextChain();
    IReadOnlyList<IImageAiProvider> ImageChain();
    IReadOnlyList<ISpeechAiProvider> SpeechChain();
    IReadOnlyList<ITranscriptionProvider> TranscriptionChain();

    AiCapabilityStatus Describe(AiCapability capability);
    IReadOnlyList<AiCapabilityStatus> DescribeAll();

    /// <summary>
    /// Reported by the caller after every attempt. Consecutive failures open the
    /// provider's circuit so the next render does not spend its latency budget
    /// rediscovering that a provider is down.
    /// </summary>
    void ReportOutcome(AiProviderId providerId, bool success);
}
