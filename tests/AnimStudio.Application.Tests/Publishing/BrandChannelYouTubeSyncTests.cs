using AnimStudio.Application.Publishing;
using AnimStudio.Domain.Ai;
using AnimStudio.Domain.Publishing;
using AnimStudio.Domain.Rendering;
using AnimStudio.Infrastructure.Publishing;

namespace AnimStudio.Application.Tests.Publishing;

/// <summary>All channel ids, names and URLs here are synthetic.</summary>
public class BrandChannelYouTubeSyncTests
{
    private const string ChannelA = "UCaaaaaaaaaaaaaaaaaaaaaa";
    private const string ChannelB = "UCbbbbbbbbbbbbbbbbbbbbbb";
    private const string Picture = "https://yt3.ggpht.com/synthetic-picture=s800";

    private static int _ids;
    private static string NewId() => $"brand-{++_ids}";

    private static YouTubeChannelIdentity Identity(string id, string title, string? handle = null, string? picture = Picture) =>
        new(id, title, handle, picture);

    [Fact]
    public void A_brand_linked_to_a_renamed_youtube_channel_takes_the_new_name_and_picture()
    {
        var settings = new AiSettings();
        settings.Channels.Add(new BrandChannel
        {
            Id = "b1", Name = "old-handle-4522",
            Publishing = new ChannelPublishSettings { YouTubeChannelId = ChannelA, YouTubeChannelTitle = "Old Title" }
        });

        var result = BrandChannelYouTubeSync.Apply(settings, [Identity(ChannelA, "Test Studio World", "@teststudioworld")], createMissing: false, NewId);

        Assert.True(result.Changed);
        var brand = settings.Channels[0];
        Assert.Equal("Test Studio World", brand.Name);
        Assert.Equal("@teststudioworld", brand.Publishing!.YouTubeChannelHandle);
        Assert.Equal(Picture, brand.Publishing.YouTubeThumbnailUrl);
        Assert.Equal(new BrandChannelRename("b1", "old-handle-4522", "Test Studio World"), Assert.Single(result.Renamed));
    }

    [Fact]
    public void The_default_channel_follows_its_youtube_channel_too()
    {
        var settings = new AiSettings { DefaultPublishing = new ChannelPublishSettings { YouTubeChannelId = ChannelA } };

        BrandChannelYouTubeSync.Apply(settings, [Identity(ChannelA, "Test Studio World")], createMissing: true, NewId);

        Assert.Equal("Test Studio World", settings.DefaultChannelName);
        Assert.Empty(settings.Channels);
    }

    [Fact]
    public void A_connected_channel_with_no_brand_gets_one_with_the_default_look()
    {
        var settings = new AiSettings
        {
            DefaultWatermark = new WatermarkSettings { Kind = WatermarkKind.Text, Text = "Synthetic" },
            DefaultPublishing = new ChannelPublishSettings { YouTubeChannelId = ChannelA, Privacy = "unlisted", Tags = ["synthetic"] }
        };

        var result = BrandChannelYouTubeSync.Apply(settings, [Identity(ChannelB, "Second Test Channel")], createMissing: true, NewId);

        var created = Assert.Single(result.Created);
        Assert.Equal("Second Test Channel", created.Name);
        Assert.Equal(ChannelB, created.Publishing!.YouTubeChannelId);
        Assert.Equal("unlisted", created.Publishing.Privacy);
        Assert.Equal(["synthetic"], created.Publishing.Tags);
        Assert.Equal("Synthetic", created.Watermark.Text);
        Assert.NotSame(settings.DefaultWatermark, created.Watermark);
    }

    [Fact]
    public void Nothing_is_created_unless_asked()
    {
        var settings = new AiSettings();

        var result = BrandChannelYouTubeSync.Apply(settings, [Identity(ChannelB, "Second Test Channel")], createMissing: false, NewId);

        Assert.False(result.Changed);
        Assert.Empty(settings.Channels);
    }

    [Fact]
    public void Syncing_twice_changes_nothing_the_second_time()
    {
        var settings = new AiSettings();
        BrandChannelYouTubeSync.Apply(settings, [Identity(ChannelB, "Second Test Channel")], createMissing: true, NewId);

        var again = BrandChannelYouTubeSync.Apply(settings, [Identity(ChannelB, "Second Test Channel")], createMissing: true, NewId);

        Assert.False(again.Changed);
        Assert.Single(settings.Channels);
    }

    [Fact]
    public void Two_brands_on_one_youtube_channel_get_distinct_names_and_keep_them()
    {
        var settings = new AiSettings { DefaultPublishing = new ChannelPublishSettings { YouTubeChannelId = ChannelA } };
        settings.Channels.Add(new BrandChannel { Id = "b1", Name = "x", Publishing = new() { YouTubeChannelId = ChannelA } });

        BrandChannelYouTubeSync.Apply(settings, [Identity(ChannelA, "Test Studio World")], createMissing: false, NewId);
        var again = BrandChannelYouTubeSync.Apply(settings, [Identity(ChannelA, "Test Studio World")], createMissing: false, NewId);

        Assert.Equal("Test Studio World", settings.DefaultChannelName);
        Assert.Equal("Test Studio World (2)", settings.Channels[0].Name);
        Assert.False(again.Changed);
    }

    [Fact]
    public void A_name_that_would_clash_with_an_unlinked_brand_gets_a_suffix()
    {
        var settings = new AiSettings();
        settings.Channels.Add(new BrandChannel { Id = "manual", Name = "test studio world" });

        var result = BrandChannelYouTubeSync.Apply(settings, [Identity(ChannelB, "Test Studio World")], createMissing: true, NewId);

        Assert.Equal("Test Studio World (2)", Assert.Single(result.Created).Name);
        Assert.Equal("test studio world", settings.Channels[0].Name);
    }

    [Theory]
    [InlineData("  Test \n\t Studio  ", "Test Studio")]
    [InlineData("", "@handle")]
    public void Names_are_one_clean_line_with_fallbacks(string title, string expected)
    {
        Assert.Equal(expected, BrandChannelYouTubeSync.NameFor(Identity(ChannelA, title, "@handle")));
    }

    [Fact]
    public void Long_titles_fit_the_brand_name_limit()
    {
        var name = BrandChannelYouTubeSync.NameFor(Identity(ChannelA, new string('a', 300)));
        Assert.Equal(BrandChannel.MaxNameLength, name.Length);
    }

    [Fact]
    public void Only_an_https_picture_is_kept()
    {
        var publishing = new ChannelPublishSettings();
        BrandChannelYouTubeSync.Stamp(publishing, Identity(ChannelA, "T", picture: "http://yt3.ggpht.com/x"));
        Assert.Null(publishing.YouTubeThumbnailUrl);
    }

    [Fact]
    public void Ids_that_arent_youtube_channel_ids_are_ignored()
    {
        var settings = new AiSettings();
        var result = BrandChannelYouTubeSync.Apply(settings, [Identity("not-a-channel", "T")], createMissing: true, NewId);
        Assert.False(result.Changed);
    }

    [Fact]
    public void A_linked_brand_name_is_reported_as_following_youtube()
    {
        var settings = new AiSettings();
        settings.Channels.Add(new BrandChannel { Id = "b1", Name = "x", Publishing = new() { YouTubeChannelId = ChannelA } });
        settings.Channels.Add(new BrandChannel { Id = "b2", Name = "y" });

        Assert.True(BrandChannelYouTubeSync.NameFollowsYouTube(settings, "b1"));
        Assert.False(BrandChannelYouTubeSync.NameFollowsYouTube(settings, "b2"));
        Assert.False(BrandChannelYouTubeSync.NameFollowsYouTube(settings, BrandChannel.DefaultId));
    }

    [Theory]
    [InlineData("https://yt3.ggpht.com/abc=s800", true)]
    [InlineData("https://lh3.googleusercontent.com/abc", true)]
    [InlineData("http://yt3.ggpht.com/abc", false)]
    [InlineData("https://yt3.ggpht.com:8443/abc", false)]
    [InlineData("https://user@yt3.ggpht.com/abc", false)]
    [InlineData("https://ggpht.com.attacker.example/abc", false)]
    [InlineData("https://127.0.0.1/abc", false)]
    [InlineData("https://localhost/abc", false)]
    [InlineData(null, false)]
    public void Pictures_are_fetched_only_from_googles_image_hosts(string? url, bool allowed)
    {
        Assert.Equal(allowed, YouTubeAvatarDownloader.IsAllowed(url));
    }

    [Fact]
    public void Downloaded_bytes_must_really_be_an_image()
    {
        Assert.Equal("image/png", YouTubeAvatarDownloader.Sniff([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0])!.MimeType);
        Assert.Equal("image/jpeg", YouTubeAvatarDownloader.Sniff([0xFF, 0xD8, 0xFF, 0xE0])!.MimeType);
        Assert.Equal("image/webp", YouTubeAvatarDownloader.Sniff("RIFF\0\0\0\0WEBPVP8 "u8.ToArray())!.MimeType);
        Assert.Null(YouTubeAvatarDownloader.Sniff("<html>"u8.ToArray()));
        Assert.Null(YouTubeAvatarDownloader.Sniff([]));
    }
}
