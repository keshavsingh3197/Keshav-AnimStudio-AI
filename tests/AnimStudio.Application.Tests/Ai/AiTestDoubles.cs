using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Options;
using AnimStudio.Domain.Ai;
using Microsoft.Extensions.Options;

namespace AnimStudio.Application.Tests.Ai;

/// <summary>An <see cref="IOptionsMonitor{T}"/> over a value the test can swap.</summary>
internal sealed class StaticOptionsMonitor<T>(T value) : IOptionsMonitor<T>
{
    public T CurrentValue { get; set; } = value;

    public T Get(string? name) => CurrentValue;

    public IDisposable? OnChange(Action<T, string?> listener) => null;
}

/// <summary>A clock the test moves by hand, so cooldowns are assertable without sleeping.</summary>
internal sealed class ManualTimeProvider(DateTimeOffset start) : TimeProvider
{
    private DateTimeOffset _now = start;

    public override DateTimeOffset GetUtcNow() => _now;

    public void Advance(TimeSpan by) => _now += by;
}

internal sealed class FakeTextProvider(string id, bool configured = true) : ITextAiProvider
{
    public AiProviderId Id { get; } = AiProviderId.Parse(id);
    public AiCapability Capability => AiCapability.Text;
    public bool IsConfigured { get; set; } = configured;

    public Task<AiProviderHealth> CheckHealthAsync(CancellationToken ct) =>
        Task.FromResult(AiProviderHealth.Healthy);

    public Task<AiTextResult> CompleteAsync(AiTextRequest request, CancellationToken ct) =>
        Task.FromResult(new AiTextResult(
            $"{Id.Value}:{request.Prompt}",
            new AiProvenance { ProviderId = Id.Value, Capability = AiCapability.Text }));
}

internal sealed class FakeImageProvider(string id, bool configured = true) : IImageAiProvider
{
    public AiProviderId Id { get; } = AiProviderId.Parse(id);
    public AiCapability Capability => AiCapability.Image;
    public bool IsConfigured { get; set; } = configured;

    public Task<AiProviderHealth> CheckHealthAsync(CancellationToken ct) =>
        Task.FromResult(AiProviderHealth.Healthy);

    public Task<AiImageResult> GenerateAsync(AiImageRequest request, CancellationToken ct) =>
        Task.FromResult(new AiImageResult(
            [1, 2, 3], "image/png",
            new AiProvenance { ProviderId = Id.Value, Capability = AiCapability.Image }));
}

internal static class AiOptionsBuilder
{
    public static AiOptions WithChain(AiCapability capability, params string[] providerIds)
    {
        var options = new AiOptions();
        options.Chains[capability.ToString()] = [.. providerIds];

        foreach (var id in providerIds)
            options.Providers[id] = new AiProviderOptions();

        return options;
    }
}
