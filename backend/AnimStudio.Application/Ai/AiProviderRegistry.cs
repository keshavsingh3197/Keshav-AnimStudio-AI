using System.Collections.Concurrent;
using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Options;
using AnimStudio.Domain.Ai;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AnimStudio.Application.Ai;

/// <summary>
/// Composes the per-capability provider chain from configuration, and keeps the circuit
/// state that decides whether a provider is currently worth trying.
/// </summary>
/// <remarks>
/// Registered as a singleton: the circuit state is process-wide on purpose, so a provider
/// that failed during scene 3's render is still skipped for scene 4 rather than being
/// rediscovered per request.
/// </remarks>
public sealed class AiProviderRegistry : IAiProviderRegistry
{
    private readonly IReadOnlyList<IAiProvider> _providers;
    private readonly IOptionsMonitor<AiOptions> _options;
    private readonly TimeProvider _clock;
    private readonly ILogger<AiProviderRegistry> _logger;

    private readonly ConcurrentDictionary<AiProviderId, CircuitState> _circuits = new();

    public AiProviderRegistry(
        IEnumerable<IAiProvider> providers,
        IOptionsMonitor<AiOptions> options,
        TimeProvider clock,
        ILogger<AiProviderRegistry> logger)
    {
        _providers = [.. providers];
        _options = options;
        _clock = clock;
        _logger = logger;
    }

    public IReadOnlyList<ITextAiProvider> TextChain() => Chain<ITextAiProvider>(AiCapability.Text);
    public IReadOnlyList<IImageAiProvider> ImageChain() => Chain<IImageAiProvider>(AiCapability.Image);
    public IReadOnlyList<ISpeechAiProvider> SpeechChain() => Chain<ISpeechAiProvider>(AiCapability.Speech);

    public IReadOnlyList<ITranscriptionProvider> TranscriptionChain() =>
        Chain<ITranscriptionProvider>(AiCapability.Transcription);

    public AiCapabilityStatus Describe(AiCapability capability)
    {
        var options = _options.CurrentValue;
        var configured = options.ChainFor(capability);

        // The chain shown to the UI is the configured order, so a user can see what would
        // be tried - not just what happens to be usable this second.
        var chainNames = configured.ToList();

        foreach (var name in configured)
        {
            if (!AiProviderId.TryParse(name, out var id)) continue;

            var provider = Find(id, capability);
            if (provider is null) continue;

            var reason = Unavailability(provider, options);
            if (reason != AiUnavailableReason.None) continue;

            return new AiCapabilityStatus(
                capability, id.Value, options.ProviderFor(id)?.Model, true,
                AiUnavailableReason.None, chainNames);
        }

        // Nothing usable: report the most informative reason we have rather than a blank.
        var firstReason = AiUnavailableReason.NotConfigured;
        foreach (var name in configured)
        {
            if (!AiProviderId.TryParse(name, out var id)) continue;
            var provider = Find(id, capability);
            if (provider is null) continue;

            firstReason = Unavailability(provider, options);
            break;
        }

        return new AiCapabilityStatus(capability, null, null, false, firstReason, chainNames);
    }

    public IReadOnlyList<AiCapabilityStatus> DescribeAll() =>
        [.. Enum.GetValues<AiCapability>().Select(Describe)];

    public void ReportOutcome(AiProviderId providerId, bool success)
    {
        if (providerId.IsEmpty) return;

        var now = _clock.GetUtcNow();
        var threshold = Math.Max(1, _options.CurrentValue.Circuit.FailureThreshold);
        var cooldown = TimeSpan.FromSeconds(Math.Max(1, _options.CurrentValue.Circuit.CooldownSeconds));

        _circuits.AddOrUpdate(
            providerId,
            _ => success ? CircuitState.Closed : CircuitState.AfterFailure(CircuitState.Closed, now, threshold, cooldown),
            (_, current) => success
                ? CircuitState.Closed
                : CircuitState.AfterFailure(current, now, threshold, cooldown));

        if (!success && IsCircuitOpen(providerId, now))
        {
            // Provider id only - never the request, which can contain the user's transcript.
            _logger.LogWarning(
                "AI provider {ProviderId} failed {Threshold} times in a row and is being skipped for {Cooldown}s.",
                providerId.Value, threshold, cooldown.TotalSeconds);
        }
    }

    private IReadOnlyList<T> Chain<T>(AiCapability capability) where T : class, IAiProvider
    {
        var options = _options.CurrentValue;
        var result = new List<T>();
        var seen = new HashSet<AiProviderId>();

        foreach (var name in options.ChainFor(capability))
        {
            if (!AiProviderId.TryParse(name, out var id))
            {
                _logger.LogWarning("Ignoring malformed AI provider id in the {Capability} chain.", capability);
                continue;
            }

            // A duplicate entry would otherwise be tried twice, wasting a retry budget.
            if (!seen.Add(id)) continue;

            if (Find(id, capability) is not T provider) continue;
            if (Unavailability(provider, options) != AiUnavailableReason.None) continue;

            result.Add(provider);
        }

        return result;
    }

    private IAiProvider? Find(AiProviderId id, AiCapability capability) =>
        _providers.FirstOrDefault(p => p.Id == id && p.Capability == capability);

    private AiUnavailableReason Unavailability(IAiProvider provider, AiOptions options)
    {
        var providerOptions = options.ProviderFor(provider.Id);

        if (providerOptions is { Enabled: false }) return AiUnavailableReason.Disabled;
        if (!provider.IsConfigured) return AiUnavailableReason.NotConfigured;
        if (IsCircuitOpen(provider.Id, _clock.GetUtcNow())) return AiUnavailableReason.CircuitOpen;

        return AiUnavailableReason.None;
    }

    private bool IsCircuitOpen(AiProviderId id, DateTimeOffset now) =>
        _circuits.TryGetValue(id, out var state) && state.IsOpenAt(now);

    private readonly record struct CircuitState(int ConsecutiveFailures, DateTimeOffset? OpenUntil)
    {
        public static readonly CircuitState Closed = new(0, null);

        public static CircuitState AfterFailure(
            CircuitState current, DateTimeOffset now, int threshold, TimeSpan cooldown)
        {
            var failures = current.ConsecutiveFailures + 1;
            return failures >= threshold
                ? new CircuitState(failures, now + cooldown)
                : new CircuitState(failures, current.OpenUntil);
        }

        public bool IsOpenAt(DateTimeOffset now) => OpenUntil is { } until && now < until;
    }
}
