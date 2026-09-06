using System.Text;
using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Ai;
using AnimStudio.Application.Options;
using AnimStudio.Domain.Ai;
using Microsoft.Extensions.Logging.Abstractions;

namespace AnimStudio.Application.Tests.Ai;

public class AiResultCacheTests
{
    private static readonly DateTimeOffset Now = new(2026, 9, 5, 12, 0, 0, TimeSpan.Zero);

    private static (AiResultCache Cache, InMemoryObjectStore Store) Build(AiOptions? options = null)
    {
        var store = new InMemoryObjectStore();

        var cache = new AiResultCache(
            store,
            new StaticOptionsMonitor<AiOptions>(options ?? new AiOptions()),
            new ManualTimeProvider(Now),
            NullLogger<AiResultCache>.Instance);

        return (cache, store);
    }

    private static AiCacheKey Key(string fingerprint = "prompt") =>
        AiCacheKey.Create(AiProviderId.Parse("groq"), AiCapability.Text, "llama", fingerprint);

    private static AiCacheEntry Entry(string text = "hello") =>
        new(Encoding.UTF8.GetBytes(text), "text/plain", "groq", "llama", default);

    [Fact]
    public async Task A_saved_entry_comes_back_intact()
    {
        var (cache, _) = Build();
        var key = Key();

        await cache.SaveAsync(key, Entry("generated"), CancellationToken.None);
        var hit = await cache.TryGetAsync(key, CancellationToken.None);

        Assert.NotNull(hit);
        Assert.Equal("generated", Encoding.UTF8.GetString(hit.Content));
        Assert.Equal("text/plain", hit.ContentType);
        Assert.Equal("groq", hit.ProviderId);
        Assert.Equal("llama", hit.Model);
        Assert.Equal(Now.UtcDateTime, hit.CreatedAtUtc);
    }

    [Fact]
    public async Task An_absent_entry_is_a_miss_rather_than_an_error()
    {
        var (cache, _) = Build();

        Assert.Null(await cache.TryGetAsync(Key("never-saved"), CancellationToken.None));
    }

    [Fact]
    public async Task Optional_facts_that_cannot_be_recomputed_from_the_bytes_survive()
    {
        // A cache hit that lost the audio duration or the subtitle format would be worse
        // than a miss: the caller would carry on with a silently wrong value.
        var (cache, _) = Build();
        var key = Key("speech");

        await cache.SaveAsync(
            key,
            new AiCacheEntry([1, 2, 3], "audio/wav", "piper-local", null, default,
                DurationSeconds: 3.25, Format: "srt", Language: "en"),
            CancellationToken.None);

        var hit = await cache.TryGetAsync(key, CancellationToken.None);

        Assert.NotNull(hit);
        Assert.Equal(3.25, hit.DurationSeconds);
        Assert.Equal("srt", hit.Format);
        Assert.Equal("en", hit.Language);
    }

    [Fact]
    public async Task A_payload_without_its_metadata_reads_as_a_miss()
    {
        // The metadata is the commit marker, so a write interrupted halfway can only ever
        // cost a regeneration - never hand back a truncated result as a real one.
        var (cache, store) = Build();
        var key = Key();

        await cache.SaveAsync(key, Entry(), CancellationToken.None);
        store.DropMetadata(key);

        Assert.Null(await cache.TryGetAsync(key, CancellationToken.None));
    }

    [Fact]
    public async Task Nothing_is_stored_or_returned_when_the_cache_is_disabled()
    {
        var options = new AiOptions();
        options.Cache.Enabled = false;

        var (cache, store) = Build(options);
        var key = Key();

        await cache.SaveAsync(key, Entry(), CancellationToken.None);

        Assert.Empty(store.Keys);
        Assert.Null(await cache.TryGetAsync(key, CancellationToken.None));
    }

    [Fact]
    public void The_same_inputs_produce_the_same_key_and_any_change_produces_a_different_one()
    {
        var baseline = AiCacheKey.Create(AiProviderId.Parse("groq"), AiCapability.Text, "llama", "p");

        Assert.Equal(
            baseline.Hash,
            AiCacheKey.Create(AiProviderId.Parse("groq"), AiCapability.Text, "llama", "p").Hash);

        Assert.NotEqual(
            baseline.Hash,
            AiCacheKey.Create(AiProviderId.Parse("gemini"), AiCapability.Text, "llama", "p").Hash);

        Assert.NotEqual(
            baseline.Hash,
            AiCacheKey.Create(AiProviderId.Parse("groq"), AiCapability.Text, "other", "p").Hash);

        Assert.NotEqual(
            baseline.Hash,
            AiCacheKey.Create(AiProviderId.Parse("groq"), AiCapability.Image, "llama", "p").Hash);

        Assert.NotEqual(
            baseline.Hash,
            AiCacheKey.Create(AiProviderId.Parse("groq"), AiCapability.Text, "llama", "q").Hash);
    }

    [Fact]
    public void Key_parts_cannot_run_together_into_the_same_hash()
    {
        // Without a separator, ("ab","c") and ("a","bc") would collide - two different
        // prompts served the same cached answer.
        var left = AiCacheKey.Create(AiProviderId.Parse("ab"), AiCapability.Text, "c", "x");
        var right = AiCacheKey.Create(AiProviderId.Parse("a"), AiCapability.Text, "bc", "x");

        Assert.NotEqual(left.Hash, right.Hash);
    }

    [Fact]
    public void The_storage_key_is_fanned_out_and_contains_nothing_but_safe_characters()
    {
        var key = Key();

        Assert.StartsWith("ai-cache/text/", key.StorageKey, StringComparison.Ordinal);
        Assert.Equal($"ai-cache/text/{key.Hash[..2]}/{key.Hash}", key.StorageKey);
        Assert.DoesNotContain("..", key.StorageKey, StringComparison.Ordinal);
        Assert.All(key.Hash, c => Assert.True(c is >= '0' and <= '9' or >= 'a' and <= 'f'));
    }
}
