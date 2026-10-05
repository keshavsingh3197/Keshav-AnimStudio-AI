using System.Net;
using System.Text;
using System.Text.Json;
using AnimStudio.Application.LiveStreams;
using AnimStudio.Domain.Rendering;
using AnimStudio.Infrastructure.Ffmpeg;
using AnimStudio.Infrastructure.LiveStreams;
using AnimStudio.Infrastructure.Storage;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace AnimStudio.Application.Tests.LiveStreams;

public class CameraStreamValidatorTests
{
    private static readonly string[] Destinations = ["youtube"];

    [Fact]
    public void Settings_need_the_consent_confirmation()
    {
        Assert.NotNull(CameraStreamValidator.ValidateSettings(new CameraStreamSettings(), Destinations));
        Assert.Null(CameraStreamValidator.ValidateSettings(new CameraStreamSettings { RightsConfirmed = true }, Destinations));
    }

    [Fact]
    public void Settings_refuse_an_unknown_destination_or_container()
    {
        Assert.NotNull(CameraStreamValidator.ValidateSettings(new CameraStreamSettings { RightsConfirmed = true, Destination = "rtmp://evil" }, Destinations));
        Assert.NotNull(CameraStreamValidator.ValidateSettings(new CameraStreamSettings { RightsConfirmed = true, Container = (CameraContainer)9 }, Destinations));
        Assert.NotNull(CameraStreamValidator.ValidateSettings(null, Destinations));
    }

    [Fact]
    public void Recognises_webm_and_mp4_headers_only()
    {
        byte[] webm = [0x1A, 0x45, 0xDF, 0xA3, 0x01];
        var mp4 = new byte[] { 0, 0, 0, 0x20 }.Concat("ftypisom"u8.ToArray()).ToArray();

        Assert.True(CameraStreamValidator.StartsLike(CameraContainer.WebM, webm));
        Assert.True(CameraStreamValidator.StartsLike(CameraContainer.Mp4, mp4));
        Assert.False(CameraStreamValidator.StartsLike(CameraContainer.Mp4, webm));
        Assert.False(CameraStreamValidator.StartsLike(CameraContainer.WebM, "#!/bin/sh"u8));
        Assert.False(CameraStreamValidator.StartsLike(CameraContainer.WebM, ReadOnlySpan<byte>.Empty));
    }

    [Theory]
    [InlineData("UCBR8-60-B28hp2BmDPdntcQ", true)]
    [InlineData("UCshort", false)]
    [InlineData("UCBR8-60-B28hp2BmDPdntcQ&key=x", false)]
    public void Channel_ids_follow_youtubes_shape(string value, bool valid) =>
        Assert.Equal(valid, CameraStreamValidator.IsChannelId(value));

    [Theory]
    [InlineData("@YouTube", true)]
    [InlineData("@my.channel_name-1", true)]
    [InlineData("YouTube", false)]
    [InlineData("@a", false)]
    [InlineData("@bad/handle", false)]
    public void Handles_follow_youtubes_shape(string value, bool valid) =>
        Assert.Equal(valid, CameraStreamValidator.IsHandle(value));

    [Theory]
    [InlineData("dQw4w9WgXcQ", true)]
    [InlineData("dQw4w9WgXc", false)]
    [InlineData("dQw4w9WgXc?", false)]
    public void Video_ids_follow_youtubes_shape(string value, bool valid) =>
        Assert.Equal(valid, CameraStreamValidator.IsVideoId(value));
}

public class CameraPushArgumentsTests
{
    private const string Url = "rtmps://a.rtmps.youtube.com:443/live2/abcd-efgh-ijkl-mnop-qrst";

    private static string ValueAfter(IReadOnlyList<string> arguments, string flag)
    {
        var index = arguments.ToList().IndexOf(flag);
        Assert.True(index >= 0, $"{flag} missing");
        return arguments[index + 1];
    }

    [Theory]
    [InlineData(CameraContainer.WebM, "matroska")]
    [InlineData(CameraContainer.Mp4, "mp4")]
    public void Reads_the_recording_from_stdin_in_its_container(CameraContainer container, string demuxer)
    {
        var arguments = LiveStreamArguments.CameraPush(container, new CameraStreamSettings(), "veryfast", Url);

        Assert.Equal("pipe:0", ValueAfter(arguments, "-i"));
        Assert.Equal(demuxer, ValueAfter(arguments, "-f"));
        Assert.Equal(Url, arguments[^1]);
        Assert.Equal("flv", arguments[^2]);
    }

    [Fact]
    public void Encodes_for_low_latency_within_youtubes_ingest_rules()
    {
        var arguments = LiveStreamArguments.CameraPush(CameraContainer.WebM,
            new CameraStreamSettings { Quality = LiveStreamQuality.Hd1080 }, "veryfast", Url);

        Assert.Equal("zerolatency", ValueAfter(arguments, "-tune"));
        Assert.Equal("60", ValueAfter(arguments, "-g"));
        Assert.Equal("0", ValueAfter(arguments, "-sc_threshold"));
        Assert.Equal("6000k", ValueAfter(arguments, "-b:v"));
        Assert.Equal("44100", ValueAfter(arguments, "-ar"));
        Assert.Contains("scale=1920:1080", ValueAfter(arguments, "-filter_complex"));
    }

    [Theory]
    [InlineData("fast", "fast")]
    [InlineData("VeryFast", "veryfast")]
    [InlineData("placebo -x264opts evil", "veryfast")]
    [InlineData(null, "veryfast")]
    public void Only_known_presets_reach_the_command_line(string? configured, string expected) =>
        Assert.Equal(expected, LiveStreamArguments.SafePreset(configured));
}

public class YouTubeAudienceTests
{
    [Fact]
    public void Reads_a_channels_public_numbers()
    {
        using var json = JsonDocument.Parse("""
            {"items":[{"id":"UCBR8-60-B28hp2BmDPdntcQ","snippet":{"title":"YouTube"},
              "statistics":{"viewCount":"123","subscriberCount":"45600","hiddenSubscriberCount":false,"videoCount":"7"}}]}
            """);

        var stats = YouTubeAudienceService.ParseChannel(json.RootElement)!;

        Assert.Equal(("UCBR8-60-B28hp2BmDPdntcQ", "YouTube"), (stats.ChannelId, stats.Title));
        Assert.Equal(45600, stats.SubscriberCount);
        Assert.False(stats.SubscribersHidden);
        Assert.Equal(7, stats.VideoCount);
    }

    [Fact]
    public void A_hidden_subscriber_count_reads_as_unknown()
    {
        using var json = JsonDocument.Parse("""
            {"items":[{"id":"x","snippet":{"title":"t"},"statistics":{"subscriberCount":"0","hiddenSubscriberCount":true}}]}
            """);

        var stats = YouTubeAudienceService.ParseChannel(json.RootElement)!;

        Assert.True(stats.SubscribersHidden);
        Assert.Null(stats.SubscriberCount);
    }

    [Fact]
    public void Reads_a_live_broadcasts_viewers()
    {
        using var json = JsonDocument.Parse("""
            {"items":[{"id":"dQw4w9WgXcQ","snippet":{"title":"Live","liveBroadcastContent":"live"},
              "statistics":{"likeCount":"10"},"liveStreamingDetails":{"concurrentViewers":"321"}}]}
            """);

        var live = YouTubeAudienceService.ParseLive(json.RootElement)!;

        Assert.True(live.IsLive);
        Assert.Equal(321, live.ConcurrentViewers);
        Assert.Equal(10, live.LikeCount);
    }

    [Fact]
    public void No_items_means_not_found()
    {
        using var json = JsonDocument.Parse("""{"items":[]}""");
        Assert.Null(YouTubeAudienceService.ParseChannel(json.RootElement));
        Assert.Null(YouTubeAudienceService.ParseLive(json.RootElement));
    }

    [Fact]
    public async Task Sends_the_key_in_a_header_never_the_url_and_caches_answers()
    {
        var handler = new RecordingHandler("""{"items":[{"id":"UCBR8-60-B28hp2BmDPdntcQ","snippet":{"title":"T"},"statistics":{"subscriberCount":"5"}}]}""");
        var options = new StaticOptions<YouTubeDataOptions>(new YouTubeDataOptions { ApiKey = "secret-api-key", CacheSeconds = 30 });
        using var service = new YouTubeAudienceService(options, TimeProvider.System, NullLogger<YouTubeAudienceService>.Instance, handler);

        var first = await service.GetAsync("UCBR8-60-B28hp2BmDPdntcQ", null, CancellationToken.None);
        await service.GetAsync("UCBR8-60-B28hp2BmDPdntcQ", null, CancellationToken.None);

        Assert.Equal(5, first.Channel!.SubscriberCount);
        Assert.Single(handler.Requests);
        var request = handler.Requests[0];
        Assert.Equal("www.googleapis.com", request.Uri.Host);
        Assert.DoesNotContain("secret-api-key", request.Uri.ToString());
        Assert.Equal("secret-api-key", request.ApiKey);
    }

    [Fact]
    public async Task Refuses_to_call_without_a_key()
    {
        var options = new StaticOptions<YouTubeDataOptions>(new YouTubeDataOptions());
        using var service = new YouTubeAudienceService(options, TimeProvider.System, NullLogger<YouTubeAudienceService>.Instance, new RecordingHandler("{}"));

        var ex = await Assert.ThrowsAsync<YouTubeAudienceException>(() => service.GetAsync("@YouTube", null, CancellationToken.None));
        Assert.Equal("youtube-not-configured", ex.Code);
    }

    private sealed class RecordingHandler(string body) : HttpMessageHandler
    {
        public List<(Uri Uri, string? ApiKey)> Requests { get; } = [];

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Requests.Add((request.RequestUri!, request.Headers.TryGetValues("X-Goog-Api-Key", out var values) ? values.Single() : null));
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK) { Content = new StringContent(body, Encoding.UTF8, "application/json") });
        }
    }
}

public class CameraStreamManagerTests : IDisposable
{
    private const string User = "user-1";
    private static readonly byte[] WebmHead = [0x1A, 0x45, 0xDF, 0xA3, 0x42, 0x86];
    private static readonly LiveStreamDestinationOptions YouTube = new() { Name = "YouTube Live", IngestUrl = "rtmps://a.rtmps.youtube.com:443/live2" };
    private static readonly CameraStreamSettings Settings = new() { RightsConfirmed = true };
    private static readonly LiveStreamKeyTarget Pasted = new(null, "abcd-efgh-ijkl-mnop-qrst");

    private readonly FakePipes _pipes = new();
    private readonly FakeKeys _keys = new();
    private readonly ManualClock _clock = new();
    private readonly string _root = Path.Combine(Path.GetTempPath(), "animstudio-camera-tests-" + Guid.NewGuid().ToString("n"));
    private readonly CameraStreamManager _manager;

    public CameraStreamManagerTests()
    {
        var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?> { ["Storage:DataRoot"] = _root }).Build();
        var paths = AppDataPaths.Resolve(config, _root);
        paths.EnsureCreated();

        var options = Microsoft.Extensions.Options.Options.Create(new LiveStreamOptions
        {
            ReconnectAttempts = 3,
            Camera = new CameraStreamOptions { MaxConcurrent = 2, IdleTimeoutSeconds = 20 }
        });
        _manager = new CameraStreamManager(_pipes, _keys, options, paths, _clock, NullLogger<CameraStreamManager>.Instance);
    }

    public void Dispose()
    {
        _manager.Dispose();
        try { Directory.Delete(_root, recursive: true); } catch (IOException) { }
    }

    private async Task<CameraStreamStatus> StartAsync(string user = User, LiveStreamKeyTarget? target = null)
    {
        var result = await _manager.StartStreamAsync(user, Settings, YouTube, target ?? Pasted, CancellationToken.None);
        Assert.Equal(CameraStartOutcome.Started, result.Outcome);
        return result.Status!;
    }

    private Task<CameraChunkResult> SendAsync(string id, long sequence, byte[]? bytes = null, int generation = 0, string user = User) =>
        _manager.AppendAsync(id, user, generation, sequence, bytes ?? (sequence == 0 ? WebmHead : [1, 2, 3]), CancellationToken.None);

    private static async Task WaitUntilAsync(Func<bool> condition)
    {
        for (var i = 0; i < 200 && !condition(); i++) await Task.Delay(20);
        Assert.True(condition(), "Condition was not met in time.");
    }

    [Fact]
    public async Task Writes_chunks_in_order_and_acknowledges_retries_without_writing_twice()
    {
        var stream = await StartAsync();

        Assert.Equal(CameraChunkOutcome.Accepted, (await SendAsync(stream.Id, 0)).Outcome);
        Assert.Equal(CameraChunkOutcome.Accepted, (await SendAsync(stream.Id, 1)).Outcome);
        Assert.Equal(CameraChunkOutcome.Duplicate, (await SendAsync(stream.Id, 1)).Outcome);
        var skipped = await SendAsync(stream.Id, 3);

        Assert.Equal(CameraChunkOutcome.OutOfOrder, skipped.Outcome);
        Assert.Equal(2, skipped.Status!.NextSequence);
        Assert.Equal(WebmHead.Length + 3, _pipes.Started[0].Written.Length);
    }

    [Fact]
    public async Task Refuses_a_first_chunk_that_isnt_the_declared_container()
    {
        var stream = await StartAsync();

        var result = await SendAsync(stream.Id, 0, "#!/bin/sh\nrm -rf /"u8.ToArray());

        Assert.Equal(CameraChunkOutcome.NotMedia, result.Outcome);
        Assert.Empty(_pipes.Started[0].Written);
    }

    [Fact]
    public async Task Another_users_stream_reads_as_missing()
    {
        var stream = await StartAsync();

        Assert.Null(_manager.Get(stream.Id, "someone-else"));
        Assert.Null(_manager.Stop(stream.Id, "someone-else"));
        Assert.Equal(CameraChunkOutcome.NotFound, (await SendAsync(stream.Id, 0, user: "someone-else")).Outcome);
        Assert.Empty(_pipes.Started[0].Written);
    }

    [Fact]
    public async Task Allows_one_camera_stream_per_user_and_caps_the_server()
    {
        await StartAsync();
        var again = await _manager.StartStreamAsync(User, Settings, YouTube, Pasted, CancellationToken.None);
        Assert.Equal(CameraStartOutcome.AlreadyStreaming, again.Outcome);

        await StartAsync("user-2");
        var third = await _manager.StartStreamAsync("user-3", Settings, YouTube, Pasted, CancellationToken.None);
        Assert.Equal(CameraStartOutcome.Busy, third.Outcome);
    }

    [Fact]
    public async Task The_stream_key_goes_only_to_the_encoders_output_url()
    {
        await StartAsync();

        Assert.Equal("rtmps://a.rtmps.youtube.com:443/live2/abcd-efgh-ijkl-mnop-qrst", _pipes.Started[0].Arguments[^1]);
    }

    [Fact]
    public async Task Stopping_lets_the_encoder_finish_and_refuses_later_chunks()
    {
        var stream = await StartAsync();
        await SendAsync(stream.Id, 0);

        _manager.Stop(stream.Id, User);
        await WaitUntilAsync(() => _manager.Get(stream.Id, User)!.State == CameraStreamState.Stopped);

        Assert.True(_pipes.Started[0].InputClosed);
        Assert.Equal(CameraChunkOutcome.Ended, (await SendAsync(stream.Id, 1)).Outcome);
    }

    [Fact]
    public async Task Goes_live_when_the_ingest_accepts_media()
    {
        var stream = await StartAsync();
        await SendAsync(stream.Id, 0);

        _pipes.Started[0].ReportSent(TimeSpan.FromSeconds(2));

        await WaitUntilAsync(() => _manager.Get(stream.Id, User)!.State == CameraStreamState.Live);
        Assert.NotNull(_manager.Get(stream.Id, User)!.LiveSince);
    }

    [Fact]
    public async Task A_refused_saved_key_is_marked_and_the_stream_fails()
    {
        _keys.Saved = ("saved-key-123456", "fp1");
        var stream = await StartAsync(target: new LiveStreamKeyTarget("brand", null));
        await SendAsync(stream.Id, 0);

        _pipes.Started[0].Exit(1, "rtmps://a.rtmps.youtube.com/live2/saved-key-123456: I/O error");

        await WaitUntilAsync(() => _manager.Get(stream.Id, User)!.State == CameraStreamState.Failed);
        var status = _manager.Get(stream.Id, User)!;
        Assert.True(status.KeyNeedsAttention);
        Assert.Equal(("brand", "fp1"), _keys.Rejected.Single());
    }

    [Fact]
    public async Task A_dropped_connection_after_going_live_restarts_the_encoder_under_a_new_generation()
    {
        var stream = await StartAsync();
        await SendAsync(stream.Id, 0);
        _pipes.Started[0].ReportSent(TimeSpan.FromSeconds(5));
        await WaitUntilAsync(() => _manager.Get(stream.Id, User)!.State == CameraStreamState.Live);

        _pipes.Started[0].Exit(1, "Connection reset by peer");
        await WaitUntilAsync(() => _manager.Get(stream.Id, User)!.Generation == 1);

        // The old recording is refused; a fresh one goes to the new encoder once it runs.
        Assert.Equal(CameraChunkOutcome.RestartRecording, (await SendAsync(stream.Id, 1)).Outcome);
        Assert.Equal(CameraChunkOutcome.Accepted, (await SendAsync(stream.Id, 0, generation: 1)).Outcome);
        Assert.Equal(2, _pipes.Started.Count);
        Assert.Equal(WebmHead, _pipes.Started[1].Written);
        Assert.Equal(1, _manager.Get(stream.Id, User)!.Reconnects);
    }

    [Fact]
    public async Task A_page_that_stops_sending_ends_the_stream()
    {
        var stream = await StartAsync();
        await SendAsync(stream.Id, 0);

        _clock.Advance(TimeSpan.FromSeconds(21));
        _manager.Sweep();

        await WaitUntilAsync(() => _manager.Get(stream.Id, User)!.State == CameraStreamState.Ended);
        Assert.Contains("stopped sending", _manager.Get(stream.Id, User)!.Message);
    }

    [Fact]
    public async Task A_missing_saved_key_is_a_key_problem_before_anything_starts()
    {
        var result = await _manager.StartStreamAsync(User, Settings, YouTube, new LiveStreamKeyTarget("brand", null), CancellationToken.None);

        Assert.Equal(CameraStartOutcome.KeyProblem, result.Outcome);
        Assert.Empty(_pipes.Started);
    }

    [Fact]
    public void Recognises_an_unreadable_recording() =>
        Assert.True(CameraStreamManager.IsInputFailure("pipe:0: Invalid data found when processing input"));

    // ------------------------------------------------------------------ fakes

    private sealed class FakePipes : IFfmpegPipeFactory
    {
        public List<FakePipe> Started { get; } = [];

        public IFfmpegPipe Start(string workingDirectory, IReadOnlyList<string> arguments, IProgress<FfmpegProgress>? progress)
        {
            var pipe = new FakePipe(arguments, progress);
            lock (Started) Started.Add(pipe);
            return pipe;
        }
    }

    private sealed class FakePipe(IReadOnlyList<string> arguments, IProgress<FfmpegProgress>? progress) : IFfmpegPipe
    {
        private readonly MemoryStream _input = new();
        private readonly TaskCompletionSource<int> _exit = new(TaskCreationOptions.RunContinuationsAsynchronously);
        private string _stderr = string.Empty;

        public IReadOnlyList<string> Arguments { get; } = arguments;
        public byte[] Written => _input.ToArray();
        public bool InputClosed { get; private set; }

        public Stream Input => _input;
        public Task<int> Exited => _exit.Task;
        public string StderrTail => _stderr;

        public void ReportSent(TimeSpan sent) => progress?.Report(new FfmpegProgress(new FrameCount(0), sent, 1.0, false));

        public void Exit(int code, string stderr)
        {
            _stderr = stderr;
            _exit.TrySetResult(code);
        }

        public Task CloseInputAsync()
        {
            InputClosed = true;
            _exit.TrySetResult(0);
            return Task.CompletedTask;
        }

        public void Kill() => _exit.TrySetResult(-1);

        public ValueTask DisposeAsync() => ValueTask.CompletedTask;
    }

    private sealed class FakeKeys : ILiveStreamKeyLookup
    {
        public (string Key, string Fingerprint)? Saved { get; set; }
        public List<(string Channel, string Fingerprint)> Rejected { get; } = [];

        public Task<(string? Key, string? Fingerprint, LiveStreamKeyState State)> GetKeyAsync(string channelId, string destinationId, CancellationToken ct) =>
            Task.FromResult(Saved is { } saved
                ? ((string?)saved.Key, (string?)saved.Fingerprint, LiveStreamKeyState.Saved)
                : ((string?)null, (string?)null, LiveStreamKeyState.Missing));

        public Task MarkUsedAsync(string channelId, string destinationId, string fingerprint) => Task.CompletedTask;

        public Task MarkRejectedAsync(string channelId, string destinationId, string fingerprint)
        {
            lock (Rejected) Rejected.Add((channelId, fingerprint));
            return Task.CompletedTask;
        }
    }

    /// <summary>Wall-clock time that a test moves by hand. Timers still run on real time.</summary>
    private sealed class ManualClock : TimeProvider
    {
        private DateTimeOffset _now = DateTimeOffset.UtcNow;
        public override DateTimeOffset GetUtcNow() => _now;
        public void Advance(TimeSpan by) => _now += by;
    }
}

internal sealed class StaticOptions<T>(T value) : IOptionsMonitor<T>
{
    public T CurrentValue => value;
    public T Get(string? name) => value;
    public IDisposable? OnChange(Action<T, string?> listener) => null;
}
