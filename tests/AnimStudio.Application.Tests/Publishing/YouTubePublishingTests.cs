using System.Net;
using System.Text;
using AnimStudio.Application.Publishing;
using AnimStudio.Infrastructure.Publishing;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace AnimStudio.Application.Tests.Publishing;

/// <summary>Everything here talks to a fake handler; no request leaves the machine.</summary>
public class YouTubePublishingTests
{
    [Theory]
    [InlineData("/projects/abc/render?youtubePublish=123", "/projects/abc/render?youtubePublish=123")]
    [InlineData("//evil.example/path", "/")]
    [InlineData("/\\evil.example", "/")]
    [InlineData("https://evil.example/", "/")]
    [InlineData("javascript:alert(1)", "/")]
    [InlineData("/projects/<x>", "/")]
    [InlineData(null, "/")]
    public void Return_paths_stay_inside_the_app(string? input, string expected)
    {
        Assert.Equal(expected, YouTubeConnectionStore.SafeReturnPath(input));
    }

    [Fact]
    public void A_sign_in_state_is_single_use_and_bound_to_its_user()
    {
        var cache = new YouTubeOAuthStateCache(TimeProvider.System);
        var (state, challenge) = cache.Create("user-a", "/");

        Assert.NotEmpty(challenge);
        Assert.Null(cache.Take(state, "user-b"));

        var (second, _) = cache.Create("user-a", "/back");
        var taken = cache.Take(second, "user-a");
        Assert.Equal("/back", taken!.ReturnPath);
        Assert.Null(cache.Take(second, "user-a"));
    }

    [Fact]
    public async Task Uploads_in_chunks_and_resumes_from_what_youtube_confirms()
    {
        var file = new byte[(int)(2.5 * 1024 * 1024)];
        Random.Shared.NextBytes(file);
        var handler = new FakeYouTube(file.Length);
        using var uploader = new YouTubeVideoUploader(Options(), NullLogger<YouTubeVideoUploader>.Instance, handler);

        var progress = new List<long>();
        var video = await uploader.UploadAsync(
            new NonSeekableStream(file), file.Length, Metadata(),
            (_, _) => Task.FromResult("token"),
            new SyncProgress(progress.Add),
            CancellationToken.None);

        Assert.Equal("vid12345678", video.VideoId);
        Assert.Equal(file, handler.Received.ToArray());
        Assert.Equal(file.Length, progress[^1]);
        Assert.Contains("\"selfDeclaredMadeForKids\":false", handler.SessionBody);
    }

    [Fact]
    public async Task A_quota_refusal_becomes_a_readable_error()
    {
        var handler = new StubHandler(_ => new HttpResponseMessage(HttpStatusCode.Forbidden)
        {
            Content = new StringContent("""{"error":{"errors":[{"reason":"quotaExceeded"}]}}""", Encoding.UTF8, "application/json")
        });
        using var uploader = new YouTubeVideoUploader(Options(), NullLogger<YouTubeVideoUploader>.Instance, handler);

        var ex = await Assert.ThrowsAsync<YouTubePublishException>(() => uploader.UploadAsync(
            new MemoryStream(new byte[10]), 10, Metadata(), (_, _) => Task.FromResult("token"),
            new SyncProgress(_ => { }), CancellationToken.None));

        Assert.Equal("youtube-quota", ex.Code);
    }

    [Fact]
    public async Task A_session_url_off_googles_upload_host_is_refused()
    {
        var handler = new StubHandler(_ =>
        {
            var response = new HttpResponseMessage(HttpStatusCode.OK);
            response.Headers.Location = new Uri("https://attacker.example/upload");
            return response;
        });
        using var uploader = new YouTubeVideoUploader(Options(), NullLogger<YouTubeVideoUploader>.Instance, handler);

        var ex = await Assert.ThrowsAsync<YouTubePublishException>(() => uploader.UploadAsync(
            new MemoryStream(new byte[10]), 10, Metadata(), (_, _) => Task.FromResult("token"),
            new SyncProgress(_ => { }), CancellationToken.None));

        Assert.Equal("youtube-upload-failed", ex.Code);
    }

    private static NormalizedYouTubeMetadata Metadata() =>
        new("Synthetic title", "Synthetic description", ["test"], "1", "private", false, true);

    private static IOptionsMonitor<YouTubePublishOptions> Options() =>
        new StaticOptions(new YouTubePublishOptions { ChunkSizeMegabytes = 1 });

    private sealed class StaticOptions(YouTubePublishOptions value) : IOptionsMonitor<YouTubePublishOptions>
    {
        public YouTubePublishOptions CurrentValue => value;
        public YouTubePublishOptions Get(string? name) => value;
        public IDisposable? OnChange(Action<YouTubePublishOptions, string?> listener) => null;
    }

    private sealed class SyncProgress(Action<long> report) : IProgress<long>
    {
        public void Report(long value) => report(value);
    }

    private sealed class StubHandler(Func<HttpRequestMessage, HttpResponseMessage> respond) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct) =>
            Task.FromResult(respond(request));
    }

    /// <summary>A resumable session that only ever keeps the first half of each chunk it is sent.</summary>
    private sealed class FakeYouTube(long total) : HttpMessageHandler
    {
        public MemoryStream Received { get; } = new();
        public string SessionBody { get; private set; } = string.Empty;

        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct)
        {
            if (request.Method == HttpMethod.Post)
            {
                SessionBody = await request.Content!.ReadAsStringAsync(ct);
                var opened = new HttpResponseMessage(HttpStatusCode.OK);
                opened.Headers.Location = new Uri("https://www.googleapis.com/upload/youtube/v3/videos?upload_id=synthetic");
                return opened;
            }

            var range = request.Content!.Headers.ContentRange!;
            Assert.Equal(Received.Length, range.From);
            var bytes = await request.Content.ReadAsByteArrayAsync(ct);

            var keep = range.To == total - 1 ? bytes.Length : Math.Max(1, bytes.Length / 2);
            Received.Write(bytes, 0, keep);

            if (Received.Length == total)
            {
                return new HttpResponseMessage(HttpStatusCode.OK)
                {
                    Content = new StringContent("""{"id":"vid12345678","status":{"uploadStatus":"uploaded"}}""", Encoding.UTF8, "application/json")
                };
            }

            var incomplete = new HttpResponseMessage((HttpStatusCode)308);
            incomplete.Headers.TryAddWithoutValidation("Range", $"bytes=0-{Received.Length - 1}");
            return incomplete;
        }
    }

    private sealed class NonSeekableStream(byte[] data) : MemoryStream(data)
    {
        public override bool CanSeek => false;
    }
}
