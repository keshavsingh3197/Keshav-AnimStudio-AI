using System.Text.Json;
using AnimStudio.Infrastructure.Publishing;

namespace AnimStudio.Application.Tests.Publishing;

public class YouTubeStatsClientTests
{
    [Fact]
    public void Channel_counters_are_read_from_digit_strings()
    {
        using var doc = JsonDocument.Parse("""
            {"items":[{"id":"UCabcdefghijklmnopqrstuv","statistics":{"viewCount":"12345","subscriberCount":"678","hiddenSubscriberCount":false,"videoCount":"9"}}]}
            """);

        var stats = YouTubeStatsClient.ParseChannel(doc.RootElement)!;

        Assert.Equal("UCabcdefghijklmnopqrstuv", stats.ChannelId);
        Assert.Equal(678, stats.Subscribers);
        Assert.False(stats.SubscribersHidden);
        Assert.Equal(12345, stats.Views);
        Assert.Equal(9, stats.Videos);
    }

    [Fact]
    public void A_hidden_subscriber_count_is_not_reported()
    {
        using var doc = JsonDocument.Parse("""
            {"items":[{"id":"UCabcdefghijklmnopqrstuv","statistics":{"subscriberCount":"100","hiddenSubscriberCount":true}}]}
            """);

        var stats = YouTubeStatsClient.ParseChannel(doc.RootElement)!;

        Assert.Null(stats.Subscribers);
        Assert.True(stats.SubscribersHidden);
    }

    [Fact]
    public void No_channel_means_null()
    {
        using var doc = JsonDocument.Parse("""{"items":[]}""");
        Assert.Null(YouTubeStatsClient.ParseChannel(doc.RootElement));
    }

    [Fact]
    public void Video_counters_skip_bad_ids_and_tolerate_hidden_likes()
    {
        using var doc = JsonDocument.Parse("""
            {"items":[
              {"id":"dQw4w9WgXcQ","statistics":{"viewCount":"42","commentCount":"3"}},
              {"id":"not a video id","statistics":{"viewCount":"1"}},
              {"id":"abcdefghijk","statistics":{"viewCount":"-5","likeCount":"oops"}}
            ]}
            """);

        var stats = YouTubeStatsClient.ParseVideos(doc.RootElement);

        Assert.Equal(2, stats.Count);
        Assert.Equal(new YouTubeVideoStats(42, null, 3), stats["dQw4w9WgXcQ"]);
        Assert.Equal(new YouTubeVideoStats(null, null, null), stats["abcdefghijk"]);
    }
}
