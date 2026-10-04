using AnimStudio.Application.Media;

namespace AnimStudio.Application.Tests.Media;

public class MediaSourceValidatorTests
{
    [Theory]
    [InlineData("https://www.youtube.com/shorts/dQw4w9WgXcQ?t=15&feature=share", "youtube")]
    [InlineData("https://www.linkedin.com/posts/renucorpsolutions_survival-of-the-fittest-ugcPost-7509870755388755968-cpYB/?utm_source=share", "linkedin")]
    [InlineData("https://www.linkedin.com/feed/update/urn:li:activity:7509969000680972288/", "linkedin")]
    [InlineData("https://www.instagram.com/reel/C1a2b3c4d5e/", "instagram")]
    [InlineData("https://x.com/someone/status/1790000000000000000", "x")]
    [InlineData("https://twitter.com/someone/status/1790000000000000000", "x")]
    [InlineData("https://www.tiktok.com/@someone/video/7300000000000000000", "tiktok")]
    [InlineData("https://www.facebook.com/watch?v=123456789", "facebook")]
    [InlineData("https://vimeo.com/123456789", "vimeo")]
    [InlineData("https://clips.twitch.tv/SomeClipSlug", "twitch")]
    public void Detects_the_platform_of_supported_video_links(string url, string platformId)
    {
        var result = MediaSourceValidator.Validate(url);

        Assert.True(result.IsValid, result.ErrorMessage);
        Assert.Equal(platformId, result.Platform!.Id);
    }

    [Fact]
    public void Strips_tracking_parameters_from_a_shared_linkedin_link()
    {
        var result = MediaSourceValidator.Validate(
            "https://www.linkedin.com/posts/renucorpsolutions_survival-ugcPost-7509870755388755968-cpYB/" +
            "?highlightedUpdateUrn=urn%3Ali%3Aactivity%3A7509969000680972288&utm_source=social_share_send&rcm=ACoAACKg");

        Assert.True(result.IsValid);
        Assert.Equal(
            "https://www.linkedin.com/posts/renucorpsolutions_survival-ugcPost-7509870755388755968-cpYB/",
            result.CanonicalUrl);
    }

    [Fact]
    public void Keeps_only_the_query_keys_a_platform_needs()
    {
        var result = MediaSourceValidator.Validate("https://www.facebook.com/watch?v=123456789&ref=share&mibextid=abc");

        Assert.Equal("https://www.facebook.com/watch?v=123456789", result.CanonicalUrl);
    }

    [Theory]
    [InlineData("https://evil.example/video.mp4", "url-host-not-allowed")]
    [InlineData("https://linkedin.com.attacker.tld/posts/x", "url-host-not-allowed")]
    [InlineData("https://notlinkedin.com/posts/x", "url-host-not-allowed")]
    [InlineData("https://lnkd.in/abc123", "url-host-not-allowed")]
    [InlineData("https://www.linkedin.com@evil.example/posts/x", "url-userinfo-not-allowed")]
    [InlineData("https://www.linkedin.com:8443/posts/x", "url-port-not-allowed")]
    [InlineData("ftp://www.linkedin.com/posts/x", "url-scheme-not-allowed")]
    [InlineData("not a url", "url-malformed")]
    [InlineData("", "url-required")]
    public void Rejects_links_outside_the_allowlist(string url, string expectedCode)
    {
        var result = MediaSourceValidator.Validate(url);

        Assert.False(result.IsValid);
        Assert.Equal(expectedCode, result.ErrorCode);
        Assert.False(string.IsNullOrWhiteSpace(result.ErrorMessage));
    }

    [Theory]
    [InlineData("https://www.linkedin.com/in/someone/")]
    [InlineData("https://www.linkedin.com/company/acme/")]
    [InlineData("https://x.com/someone")]
    [InlineData("https://www.instagram.com/someone/")]
    [InlineData("https://www.tiktok.com/")]
    public void Explains_when_a_supported_site_link_is_not_a_video(string url)
    {
        var result = MediaSourceValidator.Validate(url);

        Assert.False(result.IsValid);
        Assert.Equal("url-not-a-video", result.ErrorCode);
        Assert.NotNull(result.Platform);
        Assert.False(string.IsNullOrWhiteSpace(result.Hint));
    }

    [Fact]
    public void A_youtube_playlist_is_still_refused()
    {
        var result = MediaSourceValidator.Validate("https://www.youtube.com/playlist?list=PL123");

        Assert.False(result.IsValid);
        Assert.Equal("youtube", result.Platform!.Id);
    }
}

public class MediaDownloadFailureClassifierTests
{
    [Theory]
    [InlineData("ERROR: [Instagram] C1a2b3: Requested content is not available, rate-limit reached or login required. Use --cookies", "login-required")]
    [InlineData("ERROR: [youtube] abc: Sign in to confirm you're not a bot", "bot-check")]
    [InlineData("ERROR: [LinkedIn] 123: No video formats found!", "no-video")]
    [InlineData("ERROR: [youtube] abc: Video unavailable. This video has been removed by the uploader", "unavailable")]
    [InlineData("ERROR: [youtube] aaaaaaaaaaa: This video is unavailable", "unavailable")]
    [InlineData("ERROR: [youtube] abc: The uploader has not made this video available in your country", "geo-blocked")]
    [InlineData("ERROR: Unable to download webpage: HTTP Error 429: Too Many Requests", "rate-limited")]
    [InlineData("ERROR: [generic] Unsupported URL: https://example.com/", "unsupported-url")]
    [InlineData("ERROR: Unable to download webpage: <urlopen error [Errno 11001] getaddrinfo failed>", "network")]
    [InlineData("ERROR: [LinkedIn] 123: Unable to extract video; please report this issue on https://github.com/yt-dlp/yt-dlp/issues", "downloader-outdated")]
    [InlineData("ERROR: ffmpeg not found. Please install or provide the path using --ffmpeg-location", "ffmpeg-missing")]
    [InlineData("something entirely unexpected", "download-failed")]
    public void Maps_yt_dlp_errors_to_actionable_causes(string stderr, string expectedCode)
    {
        var failure = MediaDownloadFailureClassifier.Classify(stderr, "LinkedIn");

        Assert.Equal(expectedCode, failure.Code);
        Assert.False(string.IsNullOrWhiteSpace(failure.Hint));
    }

    [Fact]
    public void Detail_drops_file_system_paths_and_bug_report_boilerplate()
    {
        var detail = MediaDownloadFailureClassifier.ExtractDetail(
            "[info] something\nERROR: unable to open for writing: D:\\AI_STUDIO\\downloads\\abc\\x.mp4; please report this issue on https://github.com/yt-dlp/yt-dlp");

        Assert.Equal("ERROR: unable to open for writing: <path>", detail);
    }
}
