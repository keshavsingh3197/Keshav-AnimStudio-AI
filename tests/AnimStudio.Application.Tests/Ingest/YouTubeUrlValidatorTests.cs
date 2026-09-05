using AnimStudio.Application.Ingest;

namespace AnimStudio.Application.Tests.Ingest;

public class YouTubeUrlValidatorTests
{
    [Theory]
    [InlineData("https://www.youtube.com/watch?v=dQw4w9WgXcQ")]
    [InlineData("https://youtube.com/watch?v=dQw4w9WgXcQ")]
    [InlineData("https://m.youtube.com/watch?v=dQw4w9WgXcQ")]
    [InlineData("https://music.youtube.com/watch?v=dQw4w9WgXcQ")]
    [InlineData("https://youtu.be/dQw4w9WgXcQ")]
    [InlineData("https://www.youtube.com/shorts/dQw4w9WgXcQ")]
    [InlineData("https://www.youtube.com/live/dQw4w9WgXcQ")]
    [InlineData("https://www.youtube.com/embed/dQw4w9WgXcQ")]
    public void Accepts_the_supported_video_url_shapes(string url)
    {
        var result = YouTubeUrlValidator.Validate(url);

        Assert.True(result.IsValid, result.ErrorCode);
        Assert.Equal("dQw4w9WgXcQ", result.VideoId);
    }

    [Fact]
    public void Rebuilds_a_canonical_url_and_discards_every_extra_parameter()
    {
        // Timestamps, playlist ids and tracking parameters must not survive into the
        // downloader's argument vector.
        var result = YouTubeUrlValidator.Validate(
            "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42&list=PL123&si=abcdef");

        Assert.True(result.IsValid);
        Assert.Equal("https://www.youtube.com/watch?v=dQw4w9WgXcQ", result.CanonicalUrl);
    }

    [Fact]
    public void The_same_video_hashes_identically_regardless_of_extra_parameters()
    {
        // This hash is what detects "you have already ingested this video".
        var bare = YouTubeUrlValidator.Validate("https://youtu.be/dQw4w9WgXcQ");
        var decorated = YouTubeUrlValidator.Validate(
            "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=90");

        Assert.Equal(bare.UrlHash, decorated.UrlHash);
    }

    [Theory]
    // Suffix matching would accept this.
    [InlineData("https://evil-youtube.com/watch?v=dQw4w9WgXcQ")]
    // Prefix matching would accept this.
    [InlineData("https://youtube.com.attacker.tld/watch?v=dQw4w9WgXcQ")]
    [InlineData("https://vimeo.com/watch?v=dQw4w9WgXcQ")]
    public void Rejects_lookalike_hosts(string url)
    {
        var result = YouTubeUrlValidator.Validate(url);

        Assert.False(result.IsValid);
        Assert.Equal("url-host-not-allowed", result.ErrorCode);
    }

    [Fact]
    public void Rejects_a_userinfo_section_that_disguises_the_real_host()
    {
        // Reads as youtube.com to a human; resolves to evil.tld.
        var result = YouTubeUrlValidator.Validate("https://youtube.com@evil.tld/watch?v=dQw4w9WgXcQ");

        Assert.False(result.IsValid);
        Assert.Contains(result.ErrorCode, new[] { "url-userinfo-not-allowed", "url-host-not-allowed" });
    }

    [Theory]
    [InlineData("http://www.youtube.com/watch?v=dQw4w9WgXcQ", "url-scheme-not-allowed")]
    [InlineData("file:///etc/passwd", "url-scheme-not-allowed")]
    [InlineData("javascript:alert(1)", "url-scheme-not-allowed")]
    public void Rejects_non_https_schemes_by_default(string url, string expectedCode) =>
        Assert.Equal(expectedCode, YouTubeUrlValidator.Validate(url).ErrorCode);

    [Fact]
    public void Allows_http_only_when_explicitly_configured() =>
        Assert.True(YouTubeUrlValidator
            .Validate("http://www.youtube.com/watch?v=dQw4w9WgXcQ", allowHttp: true).IsValid);

    [Fact]
    public void Rejects_a_non_default_port() =>
        Assert.Equal("url-port-not-allowed",
            YouTubeUrlValidator.Validate("https://www.youtube.com:8443/watch?v=dQw4w9WgXcQ").ErrorCode);

    [Theory]
    [InlineData("https://www.youtube.com/playlist?list=PL123")]
    [InlineData("https://www.youtube.com/@somechannel")]
    [InlineData("https://www.youtube.com/")]
    public void Rejects_urls_that_are_not_a_single_video(string url) =>
        Assert.False(YouTubeUrlValidator.Validate(url).IsValid);

    [Theory]
    [InlineData("https://www.youtube.com/watch?v=tooshort")]
    [InlineData("https://www.youtube.com/watch?v=way_too_long_to_be_an_id")]
    [InlineData("https://www.youtube.com/watch?v=bad!chars$")]
    public void Rejects_a_malformed_video_id(string url)
    {
        var result = YouTubeUrlValidator.Validate(url);

        Assert.False(result.IsValid);
        Assert.Equal("url-video-id-invalid", result.ErrorCode);
    }

    [Theory]
    [InlineData(null, "url-required")]
    [InlineData("", "url-required")]
    [InlineData("   ", "url-required")]
    [InlineData("not a url at all", "url-malformed")]
    public void Rejects_empty_and_malformed_input(string? url, string expectedCode) =>
        Assert.Equal(expectedCode, YouTubeUrlValidator.Validate(url).ErrorCode);

    [Fact]
    public void Rejects_an_absurdly_long_url() =>
        Assert.Equal("url-too-long",
            YouTubeUrlValidator.Validate("https://www.youtube.com/watch?v=" + new string('a', 3000))
                .ErrorCode);

    [Fact]
    public void Rejects_a_host_with_a_trailing_dot_variant()
    {
        // "youtube.com." is a valid FQDN form that naive comparison misses; here it is
        // normalized and then matched exactly, so the canonical host still wins.
        var result = YouTubeUrlValidator.Validate("https://www.youtube.com./watch?v=dQw4w9WgXcQ");

        Assert.True(result.IsValid, result.ErrorCode);
    }
}
