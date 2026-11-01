using AnimStudio.Application.Publishing;
using AnimStudio.Domain.Publishing;

namespace AnimStudio.Application.Tests.Publishing;

public sealed class YouTubeBrandKitTests
{
    private static ChannelBranding Brand() => new()
    {
        ChannelName = "Acme",
        Tagline = "Bhajans",
        ChannelUrl = "https://youtube.com/@acme",
        StudioUrl = "https://studio.example.com/",
        CreatorUrl = "https://example.com/",
        EngineName = "AnimStudio",
        VisualsCredit = "Acme 3D",
        Hashtags = ["Acme", "AnimStudio"],
        Tags = ["acme", "animstudio"],
    };

    [Fact]
    public void The_block_uses_the_channels_own_names_and_links_in_hindi()
    {
        var block = YouTubeBrandKit.Block(Brand(), "hi");

        Assert.Contains("प्रोडक्शन व क्रेडिट्स", block);
        Assert.Contains("https://studio.example.com/", block);
        Assert.Contains("https://example.com/", block);
        Assert.Contains("Subscribe to Acme: https://youtube.com/@acme", block);
        Assert.DoesNotContain("omkr", block, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void A_link_already_in_the_footer_is_not_repeated()
    {
        var block = YouTubeBrandKit.Block(Brand(), "en", footer: "Follow https://youtube.com/@acme");

        Assert.DoesNotContain("Subscribe", block);
        Assert.Contains("Studio: https://studio.example.com/", block);
    }

    [Fact]
    public void Compose_puts_hashtags_last_and_merges_the_brands()
    {
        var result = YouTubeBrandKit.Compose("Intro line\n\n#Bhajan #Acme", Brand(), "hi", footer: null,
            addInsights: body => body + "\n\n⏱️ Chapters:\n0:00 Start");

        var lines = result.Split('\n');
        Assert.Equal("#Bhajan #Acme #AnimStudio", lines[^1]);
        Assert.True(result.IndexOf("Chapters", StringComparison.Ordinal) < result.IndexOf("Credits", StringComparison.Ordinal));
        Assert.True(result.IndexOf("Credits", StringComparison.Ordinal) < result.LastIndexOf("#Bhajan", StringComparison.Ordinal));
    }

    [Fact]
    public void Compose_leaves_room_for_the_footer()
    {
        var footer = new string('f', 4000);
        var result = YouTubeBrandKit.Compose(new string('a', 900), Brand(), "hi", footer);

        Assert.True(System.Text.Encoding.UTF8.GetByteCount(result) + 2 + footer.Length <= YouTubePublishValidator.MaxDescriptionBytes);
    }

    [Fact]
    public void An_unbranded_channel_gets_nothing_added_except_for_the_omkr_tone()
    {
        Assert.Equal(string.Empty, YouTubeBrandKit.Block(YouTubeBrandKit.Resolve(null, "auto"), "hi"));
        Assert.Contains("studio.keshavsingh.in", YouTubeBrandKit.Block(YouTubeBrandKit.Resolve(null, "devotional-omkr"), "hi"));
        Assert.Equal("Acme", YouTubeBrandKit.Resolve(Brand(), "auto").ChannelName);
    }

    [Fact]
    public void A_pinned_comment_gets_the_channel_link_once()
    {
        var once = YouTubeBrandKit.WithLinks("Har Har Mahadev 🙏", Brand(), "hi");
        Assert.Contains("https://youtube.com/@acme", once);
        Assert.Equal(once, YouTubeBrandKit.WithLinks(once, Brand(), "hi"));
    }

    [Fact]
    public void Normalize_rejects_insecure_links_and_bad_hashtags()
    {
        var bad = Brand();
        bad.ChannelUrl = "http://youtube.com/@acme";
        bad.Hashtags = ["not valid"];

        var (branding, errors) = YouTubeBrandKit.Normalize(bad);

        Assert.Null(branding);
        Assert.Contains(errors, e => e.Code == "branding-url-invalid");
        Assert.Contains(errors, e => e.Code == "branding-hashtag-invalid");
    }

    [Fact]
    public void Normalize_keeps_a_valid_brand_and_tidies_hashtags()
    {
        var input = Brand();
        input.Hashtags = ["#Acme", "acme", " Bhakti "];

        var (branding, errors) = YouTubeBrandKit.Normalize(input);

        Assert.Empty(errors);
        Assert.Equal(["Acme", "Bhakti"], branding!.Hashtags);
    }
}
