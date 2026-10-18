using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Domain.Ai;
using AnimStudio.Domain.LiveStreams;
using AnimStudio.Domain.Publishing;
using AnimStudio.Domain.Rendering;
using AnimStudio.Infrastructure.LiveStreams;
using KeshavSingh.Security;
using Microsoft.Extensions.Logging.Abstractions;

namespace AnimStudio.Application.Tests.Settings;

/// <summary>Making a channel the default swaps it with the old one. All names and keys are synthetic.</summary>
public class DefaultChannelSwapTests
{
    [Fact]
    public void Swapping_moves_name_look_and_publishing_both_ways()
    {
        var settings = new AiSettings
        {
            DefaultChannelName = "Old Default",
            DefaultWatermark = new WatermarkSettings { Kind = WatermarkKind.Text, Text = "old" },
            DefaultOutro = new OutroSettings { Headline = "old outro" },
            DefaultPublishing = new ChannelPublishSettings { YouTubeChannelId = "UCaaaaaaaaaaaaaaaaaaaaaa" },
        };
        var channel = new BrandChannel
        {
            Id = "b1", Name = "Test Studio World",
            Watermark = new WatermarkSettings { Kind = WatermarkKind.Text, Text = "new" },
            Outro = new OutroSettings { Headline = "new outro" },
            Publishing = new ChannelPublishSettings { YouTubeChannelId = "UCbbbbbbbbbbbbbbbbbbbbbb" },
        };
        settings.Channels.Add(channel);

        settings.SwapWithDefault(channel);

        Assert.Equal("Test Studio World", settings.DefaultChannelName);
        Assert.Equal("new", settings.DefaultWatermark!.Text);
        Assert.Equal("new outro", settings.DefaultOutro!.Headline);
        Assert.Equal("UCbbbbbbbbbbbbbbbbbbbbbb", settings.DefaultPublishing!.YouTubeChannelId);

        Assert.Equal("b1", channel.Id);
        Assert.Equal("Old Default", channel.Name);
        Assert.Equal("old", channel.Watermark.Text);
        Assert.Equal("old outro", channel.Outro.Headline);
        Assert.Equal("UCaaaaaaaaaaaaaaaaaaaaaa", channel.Publishing!.YouTubeChannelId);
    }

    [Fact]
    public void A_default_that_was_never_set_up_becomes_a_channel_with_no_watermark_or_end_card()
    {
        var settings = new AiSettings();
        var channel = new BrandChannel { Id = "b1", Name = "Brand", Watermark = new WatermarkSettings { Kind = WatermarkKind.Logo } };
        settings.Channels.Add(channel);

        settings.SwapWithDefault(channel);

        Assert.Equal(WatermarkKind.Logo, settings.DefaultWatermark!.Kind);
        Assert.Equal(WatermarkKind.None, channel.Watermark.Kind);
        Assert.Equal(OutroKind.None, channel.Outro.Kind);
        Assert.Null(channel.Publishing);
    }

    [Fact]
    public async Task Stream_keys_swap_channels_and_unrelated_keys_stay()
    {
        var repo = new MemoryKeys();
        await repo.UpsertAsync(Key("default", "youtube", "aaaa"), default);
        await repo.UpsertAsync(Key("b1", "youtube", "bbbb"), default);
        await repo.UpsertAsync(Key("b1", "twitch", "cccc"), default);
        await repo.UpsertAsync(Key("b2", "youtube", "dddd"), default);
        var store = new LiveStreamKeyStore(repo, new Lazy<DataProtector>(() => throw new InvalidOperationException("not used")),
            TimeProvider.System, NullLogger<LiveStreamKeyStore>.Instance);

        var moved = await store.SwapChannelsAsync("default", "b1", default);

        Assert.Equal(3, moved);
        var byId = repo.Keys.ToDictionary(k => k.Key, k => k.Value.Last4);
        Assert.Equal(new Dictionary<string, string>
        {
            ["default:youtube"] = "bbbb",
            ["default:twitch"] = "cccc",
            ["b1:youtube"] = "aaaa",
            ["b2:youtube"] = "dddd",
        }, byId);
        Assert.All(repo.Keys, k => Assert.Equal(k.Key, LiveStreamKey.IdFor(k.Value.ChannelId, k.Value.DestinationId)));
    }

    private static LiveStreamKey Key(string channel, string destination, string last4) => new()
    {
        Id = LiveStreamKey.IdFor(channel, destination), ChannelId = channel, DestinationId = destination,
        CipherText = $"cipher-{last4}", Fingerprint = last4 + last4, Last4 = last4,
    };

    private sealed class MemoryKeys : ILiveStreamKeyRepository
    {
        public Dictionary<string, LiveStreamKey> Keys { get; } = [];

        public Task<LiveStreamKey?> GetAsync(string id, CancellationToken ct) => Task.FromResult(Keys.GetValueOrDefault(id));
        public Task<IReadOnlyList<LiveStreamKey>> ListAsync(CancellationToken ct) => Task.FromResult<IReadOnlyList<LiveStreamKey>>([.. Keys.Values]);
        public Task UpsertAsync(LiveStreamKey key, CancellationToken ct) { Keys[key.Id] = key; return Task.CompletedTask; }
        public Task<bool> DeleteAsync(string id, CancellationToken ct) => Task.FromResult(Keys.Remove(id));
    }
}
