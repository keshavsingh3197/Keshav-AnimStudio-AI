using System.Collections.Concurrent;
using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Abstractions.Storage;
using AnimStudio.Domain.Ai;

namespace AnimStudio.Application.Tests.Ai;

/// <summary>An in-memory object store, so cache behaviour is testable without a disk.</summary>
internal sealed class InMemoryObjectStore : IObjectStore
{
    private readonly ConcurrentDictionary<string, byte[]> _objects = new(StringComparer.Ordinal);

    public int SaveCount { get; private set; }
    public IReadOnlyCollection<string> Keys => _objects.Keys.ToList();

    public Task SaveAsync(string key, Stream content, string contentType, CancellationToken ct = default)
    {
        using var buffer = new MemoryStream();
        content.CopyTo(buffer);
        _objects[key] = buffer.ToArray();
        SaveCount++;
        return Task.CompletedTask;
    }

    public Task<Stream?> OpenAsync(string key, CancellationToken ct = default) =>
        Task.FromResult<Stream?>(
            _objects.TryGetValue(key, out var bytes) ? new MemoryStream(bytes, writable: false) : null);

    public Task DeleteAsync(string key, CancellationToken ct = default)
    {
        _objects.TryRemove(key, out _);
        return Task.CompletedTask;
    }

    /// <summary>Simulates a process that died between writing the payload and committing it.</summary>
    public void DropMetadata(AiCacheKey key) => _objects.TryRemove(key.MetadataKey, out _);
}

internal sealed class InMemoryAiUsageRepository : IAiUsageRepository
{
    private readonly List<AiUsageRecord> _records = [];

    public IReadOnlyList<AiUsageRecord> Records => _records;

    /// <summary>Set to make the repository throw, to prove the guard fails open.</summary>
    public Exception? ReadFailure { get; set; }

    public Task RecordAsync(AiUsageRecord record, CancellationToken ct)
    {
        _records.Add(record);
        return Task.CompletedTask;
    }

    public Task<long> CountBillableRequestsAsync(
        string providerId, string fromDayBucket, string toDayBucket, CancellationToken ct)
    {
        if (ReadFailure is not null) throw ReadFailure;

        var count = _records.Count(r =>
            r.ProviderId == providerId
            && string.CompareOrdinal(r.DayBucket, fromDayBucket) >= 0
            && string.CompareOrdinal(r.DayBucket, toDayBucket) <= 0
            && r.Outcome is AiCallOutcome.Succeeded or AiCallOutcome.Failed);

        return Task.FromResult((long)count);
    }

    public Task<IReadOnlyList<AiUsageDailyTotal>> SummarizeAsync(
        string fromDayBucket, string toDayBucket, CancellationToken ct) =>
        Task.FromResult<IReadOnlyList<AiUsageDailyTotal>>([]);
}

/// <summary>A quota guard the test drives directly, so executor tests need no repository.</summary>
internal sealed class StubQuotaGuard(bool allowed = true) : IAiQuotaGuard
{
    private readonly HashSet<string> _blocked = new(StringComparer.Ordinal);

    public bool DefaultAllowed { get; set; } = allowed;

    public void Block(string providerId) => _blocked.Add(providerId);

    public Task<AiQuotaVerdict> CheckAsync(AiProviderId provider, CancellationToken ct) =>
        Task.FromResult(_blocked.Contains(provider.Value) || !DefaultAllowed
            ? new AiQuotaVerdict(false, 0, null)
            : AiQuotaVerdict.Unlimited);
}

/// <summary>A text provider whose behaviour each test chooses.</summary>
internal sealed class ScriptedTextProvider(string id, Func<AiTextRequest, string> respond)
    : ITextAiProvider
{
    public AiProviderId Id { get; } = AiProviderId.Parse(id);
    public AiCapability Capability => AiCapability.Text;
    public bool IsConfigured => true;

    public int CallCount { get; private set; }
    public Exception? Throws { get; set; }

    public Task<AiProviderHealth> CheckHealthAsync(CancellationToken ct) =>
        Task.FromResult(AiProviderHealth.Healthy);

    public Task<AiTextResult> CompleteAsync(AiTextRequest request, CancellationToken ct)
    {
        CallCount++;
        if (Throws is not null) throw Throws;

        return Task.FromResult(new AiTextResult(
            respond(request),
            new AiProvenance { ProviderId = Id.Value, Capability = AiCapability.Text }));
    }
}

internal sealed class ScriptedImageProvider(string id, byte[] content) : IImageAiProvider
{
    public AiProviderId Id { get; } = AiProviderId.Parse(id);
    public AiCapability Capability => AiCapability.Image;
    public bool IsConfigured => true;

    public int CallCount { get; private set; }

    public Task<AiProviderHealth> CheckHealthAsync(CancellationToken ct) =>
        Task.FromResult(AiProviderHealth.Healthy);

    public Task<AiImageResult> GenerateAsync(AiImageRequest request, CancellationToken ct)
    {
        CallCount++;
        return Task.FromResult(new AiImageResult(
            content, "image/png",
            new AiProvenance { ProviderId = Id.Value, Capability = AiCapability.Image }));
    }
}
