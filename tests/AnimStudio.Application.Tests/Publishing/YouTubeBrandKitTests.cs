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
    public void An_unbranded_channel_gets_nothing_added_except_for_the_studio_tone()
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
    public void Effective_is_null_when_nothing_is_set_so_the_studio_fallback_still_applies()
    {
        var publishing = new ChannelPublishSettings { YouTubeChannelTitle = "Acme", YouTubeChannelHandle = "acme", Branding = new ChannelBranding() };

        var effective = YouTubeBrandKit.Effective(new AiSettings(), publishing);

        Assert.Null(effective);
        Assert.Equal("Omkar Shiv Bhakti", YouTubeBrandKit.Resolve(effective, "devotional-omkr").ChannelName);
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
    public void The_block_credits_the_creator_by_name()
    {
        var brand = Brand();
        brand.CreatorName = "Keshav Singh";

        Assert.Contains("Created by: Keshav Singh", YouTubeBrandKit.Block(brand, "en"));
        Assert.Contains("निर्माता (Created by): Keshav Singh", YouTubeBrandKit.Block(brand, "hi"));
        Assert.Contains("Keshav Singh", YouTubeBrandKit.Block(YouTubeBrandKit.Default, "en"));
    }

    [Fact]
    public void Effective_swaps_a_retired_name_and_link_for_what_youtube_says_now()
    {
        var publishing = new ChannelPublishSettings
        {
            YouTubeChannelTitle = "Omkar Shiv Bhakti",
            YouTubeChannelHandle = "OmkarShivBhakti",
            Branding = new ChannelBranding
            {
                ChannelName = "OMKR",
                ChannelUrl = "https://youtube.com/@omkr-shiv",
                VisualsCredit = "OMKR 3D Devotional Animations",
                Hashtags = ["OMKR", "AnimStudio"],
                Tags = ["omkr", "bhajan"],
            },
        };

        var effective = YouTubeBrandKit.Effective(new AiSettings(), publishing)!;

        Assert.Equal("Omkar Shiv Bhakti", effective.ChannelName);
        Assert.Equal("https://youtube.com/@OmkarShivBhakti", effective.ChannelUrl);
        Assert.Equal("Omkar Shiv Bhakti 3D Devotional Animations", effective.VisualsCredit);
        Assert.Equal(["OmkarShivBhakti", "AnimStudio"], effective.Hashtags);
        // People still search the old name, so the search tag stays.
        Assert.Contains("omkr", effective.Tags);
    }

    [Fact]
    public void CurrentText_rewrites_old_links_names_and_hashtags_but_not_lookalikes()
    {
        var text = "Subscribe to OMKR: https://www.youtube.com/@omkr-shiv/\n#OMKR #Bhakti\nomkr-style devotional-omkr";

        var current = YouTubeBrandKit.CurrentText(text, "Omkar Shiv Bhakti", "https://youtube.com/@OmkarShivBhakti")!;

        Assert.Contains("Subscribe to Omkar Shiv Bhakti: https://youtube.com/@OmkarShivBhakti", current);
        Assert.Contains("#OmkarShivBhakti #Bhakti", current);
        Assert.Contains("omkr-style devotional-omkr", current);
        Assert.DoesNotContain("omkr-shiv", current, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void CurrentFooter_updates_a_footer_written_before_the_rename()
    {
        var publishing = new ChannelPublishSettings
        {
            YouTubeChannelTitle = "Omkar Shiv Bhakti",
            YouTubeChannelHandle = "OmkarShivBhakti",
            DescriptionFooter = "  🔔 Subscribe: https://youtube.com/@omkr-shiv  ",
        };

        Assert.Equal("🔔 Subscribe: https://youtube.com/@OmkarShivBhakti", YouTubeBrandKit.CurrentFooter(publishing, null));
        Assert.Null(YouTubeBrandKit.CurrentFooter(new ChannelPublishSettings(), null));
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
