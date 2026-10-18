using System.Net;
using System.Text;
using AnimStudio.Application.Ai;
using AnimStudio.Application.Publishing;
using AnimStudio.Infrastructure.Publishing;
using Microsoft.Extensions.Logging.Abstractions;

namespace AnimStudio.Application.Tests.Publishing;

/// <summary>Everything here talks to a fake handler; no request leaves the machine.</summary>
public class YouTubeLiveTests
{
    private static readonly NormalizedYouTubeMetadata Metadata =
        new("Live: Q&A", "Ask anything", ["q and a", "live"], "22", "unlisted", false, true);

    [Fact]
    public async Task Creating_a_broadcast_makes_a_stream_binds_it_and_sets_tags()
    {
        var calls = new List<(string Method, string Path, string Body)>();
        var handler = new StubHandler(async r =>
        {
            var body = r.Content is null ? string.Empty : await r.Content.ReadAsStringAsync();
            calls.Add((r.Method.Method, r.RequestUri!.PathAndQuery, body));
            Assert.Equal("www.googleapis.com", r.RequestUri.Host);
            Assert.Equal("Bearer", r.Headers.Authorization!.Scheme);
            return r.RequestUri.AbsolutePath switch
            {
                "/youtube/v3/liveStreams" => Json(HttpStatusCode.OK, """{"id":"stream-1"}"""),
                "/youtube/v3/liveBroadcasts" => Json(HttpStatusCode.OK, """{"id":"abcdefghijk"}"""),
                _ => Json(HttpStatusCode.OK, "{}")
            };
        });
        using var client = new YouTubeLiveClient(NullLogger<YouTubeLiveClient>.Instance, handler);

        var created = await client.CreateAsync(Metadata, new DateTime(2030, 1, 1, 12, 0, 0, DateTimeKind.Utc), true, "token-1", CancellationToken.None);

        Assert.Equal("abcdefghijk", created.BroadcastId);
        Assert.Equal("https://www.youtube.com/watch?v=abcdefghijk", created.WatchUrl);
        Assert.Collection(calls,
            c => Assert.StartsWith("/youtube/v3/liveStreams?", c.Path),
            c =>
            {
                Assert.StartsWith("/youtube/v3/liveBroadcasts?", c.Path);
                Assert.Contains("\"enableAutoStart\":true", c.Body);
                Assert.Contains("\"enableAutoStop\":true", c.Body);
                Assert.Contains("\"privacyStatus\":\"unlisted\"", c.Body);
                Assert.Contains("\"scheduledStartTime\":\"2030-01-01T12:00:00Z\"", c.Body);
            },
            c => Assert.Equal("/youtube/v3/liveBroadcasts/bind?part=id,contentDetails&id=abcdefghijk&streamId=stream-1", c.Path),
            c =>
            {
                Assert.Equal("PUT", c.Method);
                Assert.Contains("\"tags\":[\"q and a\",\"live\"]", c.Body);
                Assert.Contains("\"categoryId\":\"22\"", c.Body);
            });
        Assert.DoesNotContain(calls, c => c.Path.Contains("token-1"));
    }

    [Fact]
    public async Task A_failed_tag_update_still_returns_the_working_broadcast()
    {
        var handler = new StubHandler(r => Task.FromResult(r.RequestUri!.AbsolutePath switch
        {
            "/youtube/v3/liveStreams" => Json(HttpStatusCode.OK, """{"id":"stream-1"}"""),
            "/youtube/v3/liveBroadcasts" => Json(HttpStatusCode.OK, """{"id":"abcdefghijk"}"""),
            "/youtube/v3/videos" => Json(HttpStatusCode.BadRequest, """{"error":{"errors":[{"reason":"invalidTags"}]}}"""),
            _ => Json(HttpStatusCode.OK, "{}")
        }));
        using var client = new YouTubeLiveClient(NullLogger<YouTubeLiveClient>.Instance, handler);

        var created = await client.CreateAsync(Metadata, DateTime.UtcNow.AddMinutes(5), true, "t", CancellationToken.None);

        Assert.Equal("abcdefghijk", created.BroadcastId);
    }

    [Fact]
    public async Task The_key_is_read_from_the_stream_bound_to_the_broadcast()
    {
        var handler = new StubHandler(r => Task.FromResult(r.RequestUri!.AbsolutePath switch
        {
            "/youtube/v3/liveBroadcasts" => Json(HttpStatusCode.OK,
                """{"items":[{"id":"abcdefghijk","snippet":{"title":"x"},"status":{"lifeCycleStatus":"ready","privacyStatus":"public"},"contentDetails":{"boundStreamId":"stream-1"}}]}"""),
            "/youtube/v3/liveStreams" => Json(HttpStatusCode.OK,
                """{"items":[{"id":"stream-1","cdn":{"ingestionInfo":{"streamName":"abcd-efgh-ijkl-mnop-qrst","rtmpsIngestionAddress":"rtmps://a.rtmps.youtube.com/live2"}}}]}"""),
            _ => Json(HttpStatusCode.NotFound, "{}")
        }));
        using var client = new YouTubeLiveClient(NullLogger<YouTubeLiveClient>.Instance, handler);

        var ingest = await client.GetIngestAsync("abcdefghijk", "t", CancellationToken.None);

        Assert.Equal("abcd-efgh-ijkl-mnop-qrst", ingest.StreamKey);
    }

    [Theory]
    [InlineData("""{"items":[]}""", "youtube-live-not-found")]
    [InlineData("""{"items":[{"id":"abcdefghijk","status":{"lifeCycleStatus":"complete"},"contentDetails":{"boundStreamId":"s"}}]}""", "youtube-live-ended")]
    [InlineData("""{"items":[{"id":"abcdefghijk","status":{"lifeCycleStatus":"ready"},"contentDetails":{}}]}""", "youtube-live-unbound")]
    public async Task A_broadcast_that_cant_be_streamed_to_is_explained(string broadcasts, string code)
    {
        var handler = new StubHandler(_ => Task.FromResult(Json(HttpStatusCode.OK, broadcasts)));
        using var client = new YouTubeLiveClient(NullLogger<YouTubeLiveClient>.Instance, handler);

        var ex = await Assert.ThrowsAsync<YouTubePublishException>(() => client.GetIngestAsync("abcdefghijk", "t", CancellationToken.None));

        Assert.Equal(code, ex.Code);
    }

    [Theory]
    [InlineData(HttpStatusCode.Forbidden, "insufficientPermissions", "youtube-live-scope")]
    [InlineData(HttpStatusCode.Forbidden, "liveStreamingNotEnabled", "youtube-live-not-enabled")]
    [InlineData(HttpStatusCode.Forbidden, "quotaExceeded", "youtube-busy")]
    [InlineData(HttpStatusCode.InternalServerError, null, "youtube-live-failed")]
    public void Google_errors_become_explainable_codes(HttpStatusCode status, string? reason, string code) =>
        Assert.Equal(code, YouTubeLiveClient.Classify(status, reason).Code);

    [Theory]
    [InlineData("abcdefghijk", true)]
    [InlineData("abc-_EFGH12", true)]
    [InlineData("short", false)]
    [InlineData("abcdefghij/", false)]
    [InlineData(null, false)]
    public void Only_well_formed_broadcast_ids_are_accepted(string? id, bool ok) =>
        Assert.Equal(ok, YouTubeLiveClient.IsBroadcastId(id));

    [Fact]
    public void Live_details_are_checked_without_a_video_file()
    {
        var ok = YouTubePublishValidator.ValidateDetails(new YouTubeVideoMetadata
        {
            Title = "Live now", Description = "d", Tags = ["a"], CategoryId = "22", Privacy = "public", MadeForKids = false
        });
        Assert.True(ok.IsValid);

        var bad = YouTubePublishValidator.ValidateDetails(new YouTubeVideoMetadata { Title = "<b>", CategoryId = "22", Privacy = "public" });
        Assert.Contains(bad.Errors, e => e.Code == "title-invalid-character");
        Assert.Contains(bad.Errors, e => e.Code == "audience-missing");
        Assert.DoesNotContain(bad.Errors, e => e.Field == "video");
    }

    [Fact]
    public void The_live_prompt_ships_with_the_same_answer_shape_as_uploads()
    {
        var live = BuiltInPrompts.Find(BuiltInPrompts.LiveMetadata);
        Assert.NotNull(live);
        Assert.Equal(BuiltInPrompts.Find(BuiltInPrompts.VideoMetadata)!.OutputJsonSchema, live!.OutputJsonSchema);
    }

    private static HttpResponseMessage Json(HttpStatusCode status, string json) =>
        new(status) { Content = new StringContent(json, Encoding.UTF8, "application/json") };

    private sealed class StubHandler(Func<HttpRequestMessage, Task<HttpResponseMessage>> respond) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct) => respond(request);
    }
}
