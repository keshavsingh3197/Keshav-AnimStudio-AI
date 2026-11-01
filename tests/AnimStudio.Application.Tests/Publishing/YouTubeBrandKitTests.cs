using AnimStudio.Application.Publishing;
using AnimStudio.Domain.Ai;
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

    private static AiSettings Studio() => new()
    {
        StudioBranding = new ChannelBranding
        {
            StudioUrl = "https://studio.example.com/",
            CreatorUrl = "https://example.com/",
            EngineName = "AnimStudio",
            VisualsCredit = "Studio 3D",
            Hashtags = ["AnimStudio"],
            Tags = ["animstudio"],
        },
    };

    [Fact]
    public void Effective_inherits_studio_defaults_and_fills_name_and_link_from_youtube()
    {
        var publishing = new ChannelPublishSettings { YouTubeChannelId = "UC1234567890abcdefghijkl", YouTubeChannelTitle = "Acme Bhakti", YouTubeChannelHandle = "@acme" };

        var effective = YouTubeBrandKit.Effective(Studio(), publishing)!;

        Assert.Equal("Acme Bhakti", effective.ChannelName);
        Assert.Equal("https://youtube.com/@acme", effective.ChannelUrl);
        Assert.Equal("https://studio.example.com/", effective.StudioUrl);
        Assert.Equal("AnimStudio", effective.EngineName);
        Assert.Equal(["AnimStudio"], effective.Hashtags);
    }

    [Fact]
    public void Effective_lets_a_channel_override_field_by_field()
    {
        var publishing = new ChannelPublishSettings
        {
            YouTubeChannelId = "UC1234567890abcdefghijkl",
            Branding = new ChannelBranding { ChannelName = "Acme", VisualsCredit = "  ", Hashtags = ["Acme"] },
        };

        var effective = YouTubeBrandKit.Effective(Studio(), publishing)!;

        Assert.Equal("Acme", effective.ChannelName);
        Assert.Equal("Studio 3D", effective.VisualsCredit);
        Assert.Equal(["Acme"], effective.Hashtags);
        Assert.Equal(["animstudio"], effective.Tags);
        Assert.Equal("https://www.youtube.com/channel/UC1234567890abcdefghijkl", effective.ChannelUrl);
    }

    [Fact]
    public void Effective_is_null_when_nothing_is_set_so_the_omkr_fallback_still_applies()
    {
        var publishing = new ChannelPublishSettings { YouTubeChannelTitle = "Acme", YouTubeChannelHandle = "acme", Branding = new ChannelBranding() };

        var effective = YouTubeBrandKit.Effective(new AiSettings(), publishing);

        Assert.Null(effective);
        Assert.Equal("OMKR", YouTubeBrandKit.Resolve(effective, "devotional-omkr").ChannelName);
    }

    [Fact]
    public void Effective_never_builds_a_link_from_an_unsafe_handle()
    {
        var publishing = new ChannelPublishSettings { YouTubeChannelHandle = "evil/../x?y", YouTubeChannelTitle = "A <b>" };

        var effective = YouTubeBrandKit.Effective(Studio(), publishing)!;

        Assert.Null(effective.ChannelUrl);
        Assert.Equal("A b", effective.ChannelName);
    }

    [Fact]
    public void NormalizeStudio_drops_per_channel_fields_and_checks_links()
    {
        var (ok, okErrors) = YouTubeBrandKit.NormalizeStudio(Brand());
        Assert.Empty(okErrors);
        Assert.Null(ok!.ChannelName);
        Assert.Null(ok.ChannelUrl);
        Assert.Equal("https://studio.example.com/", ok.StudioUrl);

        var (bad, errors) = YouTubeBrandKit.NormalizeStudio(new ChannelBranding { StudioUrl = "http://studio.example.com/" });
        Assert.Null(bad);
        Assert.Contains(errors, e => e.Code == "branding-url-invalid");

        var (empty, none) = YouTubeBrandKit.NormalizeStudio(new ChannelBranding { ChannelName = "Only a name" });
        Assert.Empty(none);
        Assert.Null(empty);
    }
}
