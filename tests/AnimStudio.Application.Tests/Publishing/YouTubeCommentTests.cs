using System.Net;
using System.Text;
using AnimStudio.Application.Publishing;
using AnimStudio.Infrastructure.Publishing;
using Microsoft.Extensions.Logging.Abstractions;

namespace AnimStudio.Application.Tests.Publishing;

/// <summary>Everything here talks to a fake handler; no request leaves the machine.</summary>
public class YouTubeCommentTests
{
    [Theory]
    [InlineData(null)]
    [InlineData("   \r\n ")]
    public void An_empty_comment_posts_nothing(string? input)
    {
        var (text, error) = YouTubeCommentRules.Normalize(input);
        Assert.Null(text);
        Assert.Null(error);
    }

    [Fact]
    public void A_comment_is_trimmed_and_keeps_its_line_breaks()
    {
        var (text, error) = YouTubeCommentRules.Normalize("  Thanks for watching!\r\nSubscribe ✨  ");
        Assert.Null(error);
        Assert.Equal("Thanks for watching!\nSubscribe ✨", text);
    }

    [Fact]
    public void An_overlong_or_binary_comment_is_refused()
    {
        Assert.Equal("comment-too-long", YouTubeCommentRules.Normalize(new string('a', YouTubeCommentRules.MaxLength + 1)).Error?.Code);
        Assert.Equal("comment-invalid-character", YouTubeCommentRules.Normalize("hi\u0007").Error?.Code);
    }

    [Theory]
    [InlineData("public", false, false)]
    [InlineData("unlisted", false, false)]
    [InlineData("private", false, true)]
    [InlineData("public", true, true)]
    public void Comments_are_skipped_where_YouTube_turns_them_off(string privacy, bool madeForKids, bool skipped)
    {
        var metadata = new NormalizedYouTubeMetadata("t", "", [], "1", privacy, madeForKids, true);
        Assert.Equal(skipped, YouTubeCommentRules.WhyNotPostable(metadata) is not null);
    }

    [Fact]
    public void Only_a_connection_granted_force_ssl_may_comment()
    {
        Assert.True(YouTubeOAuthClient.AllowsComments(YouTubeOAuthClient.Scopes));
        Assert.False(YouTubeOAuthClient.AllowsComments(
            "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly"));
        Assert.False(YouTubeOAuthClient.AllowsComments(null));
    }

    [Fact]
    public async Task A_comment_is_posted_as_a_top_level_thread_with_a_bearer_token()
    {
        HttpRequestMessage? seen = null;
        string? body = null;
        var handler = new StubHandler(async r =>
        {
            seen = r;
            body = await r.Content!.ReadAsStringAsync();
            return Json(HttpStatusCode.OK, """{"id":"Ugz-thread-1"}""");
        });
        using var client = new YouTubeCommentClient(NullLogger<YouTubeCommentClient>.Instance, handler);

        var id = await client.PostAsync("dQw4w9WgXcQ", "First!", "token-123", CancellationToken.None);

        Assert.Equal("Ugz-thread-1", id);
        Assert.Equal("www.googleapis.com", seen!.RequestUri!.Host);
        Assert.Equal("Bearer", seen.Headers.Authorization!.Scheme);
        Assert.DoesNotContain("token-123", seen.RequestUri.ToString());
        Assert.Contains("\"videoId\":\"dQw4w9WgXcQ\"", body);
        Assert.Contains("\"textOriginal\":\"First!\"", body);
    }

    [Theory]
    [InlineData(HttpStatusCode.Forbidden, "insufficientPermissions", "youtube-comment-scope")]
    [InlineData(HttpStatusCode.Forbidden, "commentsDisabled", "youtube-comments-disabled")]
    [InlineData(HttpStatusCode.NotFound, "videoNotFound", "youtube-comment-not-ready")]
    [InlineData(HttpStatusCode.BadRequest, "invalidCommentMetadata", "youtube-comment-failed")]
    public async Task Google_errors_become_codes_the_upload_can_act_on(HttpStatusCode status, string reason, string code)
    {
        var handler = new StubHandler(_ => Task.FromResult(
            Json(status, $$$"""{"error":{"errors":[{"reason":"{{{reason}}}"}]}}""")));
        using var client = new YouTubeCommentClient(NullLogger<YouTubeCommentClient>.Instance, handler);

        var ex = await Assert.ThrowsAsync<YouTubePublishException>(() =>
            client.PostAsync("dQw4w9WgXcQ", "hi", "t", CancellationToken.None));
        Assert.Equal(code, ex.Code);
    }

    private static HttpResponseMessage Json(HttpStatusCode status, string json) =>
        new(status) { Content = new StringContent(json, Encoding.UTF8, "application/json") };

    private sealed class StubHandler(Func<HttpRequestMessage, Task<HttpResponseMessage>> respond) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct) => respond(request);
    }
}
