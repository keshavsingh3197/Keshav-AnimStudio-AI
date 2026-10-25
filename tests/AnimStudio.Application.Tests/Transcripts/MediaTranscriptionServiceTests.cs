using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Abstractions.Storage;
using AnimStudio.Application.Ai;
using AnimStudio.Application.Options;
using AnimStudio.Application.Tests.Editing;
using AnimStudio.Application.Transcripts;
using AnimStudio.Application.Transcripts.Parsing;
using AnimStudio.Domain.Ai;
using AnimStudio.Domain.Assets;
using Microsoft.Extensions.Logging.Abstractions;

namespace AnimStudio.Application.Tests.Transcripts;

public class MediaTranscriptionServiceTests
{
    private sealed class FakeWorkspace : IRenderWorkspace
    {
        public string JobId => "test";
        public string RootPath => "scratch";
        public string Resolve(string relativeName) => $"scratch/{relativeName}";
        public Task<string> MaterializeAsync(string storageKey, string relativeName, CancellationToken ct) => Task.FromResult(relativeName);
        public Task<string> WriteTextAsync(string relativeName, string content, CancellationToken ct) => Task.FromResult(relativeName);
        public Task PublishAsync(string relativeName, string storageKey, string contentType, CancellationToken ct) => Task.CompletedTask;
        public void MarkFailed(string reason) { }
        public ValueTask DisposeAsync() => ValueTask.CompletedTask;
    }

    private sealed class FakeWorkspaces : IRenderWorkspaceFactory
    {
        public Task<IRenderWorkspace> CreateAsync(string jobId, CancellationToken ct) => Task.FromResult<IRenderWorkspace>(new FakeWorkspace());
    }

    private sealed class FakeExtractor(int parts) : ISpeechAudioExtractor
    {
        public bool IsAvailable { get; set; } = true;
        public SpeechAudioExtractionException? Throws { get; set; }
        public int Calls { get; private set; }

        public Task<IReadOnlyList<SpeechAudioPart>> ExtractAsync(
            IRenderWorkspace workspace, string storageKey, TimeSpan partLength, TimeSpan maxLength, CancellationToken ct)
        {
            Calls++;
            if (Throws is not null) throw Throws;
            return Task.FromResult<IReadOnlyList<SpeechAudioPart>>(
                [.. Enumerable.Range(0, parts).Select(i => new SpeechAudioPart($"part-{i}.wav", partLength * i))]);
        }
    }

    /// <summary>Answers each part from a script keyed by its audio path; records what it was asked.</summary>
    private sealed class FakeAi(Func<AiTranscriptionRequest, AiOutcome<AiTranscriptionResult>> answer) : IAiExecutor
    {
        public List<AiTranscriptionRequest> Requests { get; } = [];

        public Task<AiOutcome<AiTranscriptionResult>> TranscribeAsync(
            AiTranscriptionRequest request, AiCallContext context, CancellationToken ct)
        {
            Requests.Add(request);
            return Task.FromResult(answer(request));
        }

        public Task<AiOutcome<AiTextResult>> TextAsync(AiTextRequest request, AiCallContext context, CancellationToken ct) => throw new NotSupportedException();
        public Task<AiOutcome<AiImageResult>> ImageAsync(AiImageRequest request, AiCallContext context, CancellationToken ct) => throw new NotSupportedException();
        public Task<AiOutcome<AiSpeechResult>> SpeechAsync(AiSpeechRequest request, AiCallContext context, CancellationToken ct) => throw new NotSupportedException();
    }

    private static AiOutcome<AiTranscriptionResult> Srt(string srt, string? language = null) =>
        AiOutcome<AiTranscriptionResult>.Success(new AiTranscriptionResult(
            srt, AiTranscriptValidator.SubRip,
            new AiProvenance { ProviderId = "whispercpp-local", Capability = AiCapability.Transcription },
            language));

    private const string Namaste = "1\n00:00:01,000 --> 00:00:03,000\nनमस्ते दोस्तों\n\n";
    private const string Welcome = "1\n00:00:02,000 --> 00:00:04,500\nWelcome back\n\n";

    private static (MediaTranscriptionService Service, EditingWorld World, FakeExtractor Extractor, FakeAi Ai) Create(
        Func<AiTranscriptionRequest, AiOutcome<AiTranscriptionResult>> answer, int parts = 1)
    {
        var world = new EditingWorld();
        var extractor = new FakeExtractor(parts);
        var ai = new FakeAi(answer);
        var service = new MediaTranscriptionService(
            world.Projects, world.Assets, world.Store, new FakeWorkspaces(), extractor, ai,
            new SubtitleParser(new ParsingOptions()),
            Microsoft.Extensions.Options.Options.Create(new IngestOptions()),
            TimeProvider.System, world.AssetScope, NullLogger<MediaTranscriptionService>.Instance);
        return (service, world, extractor, ai);
    }

    private static Asset AddVideo(EditingWorld world, string id = "clip", string? projectId = null)
    {
        var asset = world.AddAsset(id, AssetKind.Video, projectId, duration: 1500);
        asset.Probe.AudioCodec = "aac";
        asset.Name = "Interview.mp4";
        return asset;
    }

    private static MediaTranscriptionCommand Command(string assetId = "clip", string userId = EditingWorld.UserId,
        string? language = null, bool save = false) =>
        new("project-1", assetId, userId, language, save);

    [Fact]
    public async Task Parts_are_put_back_on_the_files_timeline()
    {
        var (service, world, _, _) = Create(r => Srt(r.AudioPath == "part-0.wav" ? Namaste : Welcome, "hi"), parts: 2);
        AddVideo(world);

        var result = await service.TranscribeAsync(Command(), CancellationToken.None);

        Assert.Collection(result.Lines,
            l => { Assert.Equal("नमस्ते दोस्तों", l.Text); Assert.Equal(TimeSpan.FromSeconds(1), l.Start); },
            l => { Assert.Equal("Welcome back", l.Text); Assert.Equal(TimeSpan.FromMinutes(10) + TimeSpan.FromSeconds(2), l.Start); });
        Assert.Equal("hi", result.Language);
        Assert.Contains("00:10:02,000 --> 00:10:04,500", result.SubRip);
        Assert.Null(result.SavedSubtitle);
    }

    [Fact]
    public async Task Each_part_is_cached_on_its_own_and_the_language_hint_is_passed_through()
    {
        var (service, world, _, ai) = Create(_ => Srt(Namaste), parts: 2);
        AddVideo(world);

        await service.TranscribeAsync(Command(language: "hi"), CancellationToken.None);

        Assert.All(ai.Requests, r => Assert.Equal("hi", r.LanguageHint));
        Assert.Equal(2, ai.Requests.Select(r => r.CacheFingerprint).Distinct().Count());
    }

    [Fact]
    public async Task An_unknown_language_falls_back_to_detection()
    {
        var (service, world, _, ai) = Create(_ => Srt(Namaste));
        AddVideo(world);

        await service.TranscribeAsync(Command(language: "--model x"), CancellationToken.None);

        Assert.Null(Assert.Single(ai.Requests).LanguageHint);
    }

    [Fact]
    public async Task A_silent_part_is_skipped_rather_than_failing_the_file()
    {
        var (service, world, _, _) = Create(r => r.AudioPath == "part-0.wav"
            ? AiOutcome<AiTranscriptionResult>.Failed("empty-response")
            : Srt(Welcome), parts: 2);
        AddVideo(world);

        var result = await service.TranscribeAsync(Command(), CancellationToken.None);

        Assert.Equal("Welcome back", Assert.Single(result.Lines).Text);
    }

    [Fact]
    public async Task A_file_with_nobody_speaking_says_so()
    {
        var (service, world, _, _) = Create(_ => AiOutcome<AiTranscriptionResult>.Failed("empty-response"));
        AddVideo(world);

        var ex = await Assert.ThrowsAsync<MediaTranscriptionException>(
            () => service.TranscribeAsync(Command(), CancellationToken.None));
        Assert.Equal("no-speech", ex.Code);
    }

    [Fact]
    public async Task No_recognizer_turned_on_is_reported_as_unavailable()
    {
        var (service, world, _, _) = Create(_ => AiOutcome<AiTranscriptionResult>.Unavailable(AiUnavailableReason.NotConfigured));
        AddVideo(world);

        var ex = await Assert.ThrowsAsync<MediaTranscriptionException>(
            () => service.TranscribeAsync(Command(), CancellationToken.None));
        Assert.Equal("transcription-unavailable", ex.Code);
    }

    [Fact]
    public async Task Someone_elses_project_is_refused_before_any_work()
    {
        var (service, world, extractor, _) = Create(_ => Srt(Namaste));
        AddVideo(world);

        var ex = await Assert.ThrowsAsync<MediaTranscriptionException>(
            () => service.TranscribeAsync(Command(userId: EditingWorld.OtherUserId), CancellationToken.None));
        Assert.Equal("forbidden", ex.Code);
        Assert.Equal(0, extractor.Calls);
    }

    [Fact]
    public async Task An_asset_of_another_project_reads_as_not_found()
    {
        var (service, world, extractor, _) = Create(_ => Srt(Namaste));
        AddVideo(world, "elsewhere", projectId: "project-2");

        var ex = await Assert.ThrowsAsync<MediaTranscriptionException>(
            () => service.TranscribeAsync(Command("elsewhere"), CancellationToken.None));
        Assert.Equal("asset-not-found", ex.Code);
        Assert.Equal(0, extractor.Calls);
    }

    [Fact]
    public async Task Images_and_silent_videos_are_refused()
    {
        var (service, world, extractor, _) = Create(_ => Srt(Namaste));
        world.AddAsset("photo", AssetKind.Image);
        world.AddAsset("mute", AssetKind.Video, duration: 30);

        Assert.Equal("not-audible", (await Assert.ThrowsAsync<MediaTranscriptionException>(
            () => service.TranscribeAsync(Command("photo"), CancellationToken.None))).Code);
        Assert.Equal("no-audio", (await Assert.ThrowsAsync<MediaTranscriptionException>(
            () => service.TranscribeAsync(Command("mute"), CancellationToken.None))).Code);
        Assert.Equal(0, extractor.Calls);
    }

    [Fact]
    public async Task A_file_ffmpeg_finds_no_sound_in_is_reported_as_no_audio()
    {
        var (service, world, extractor, _) = Create(_ => Srt(Namaste));
        AddVideo(world);
        extractor.Throws = new SpeechAudioExtractionException(noAudio: true, "none");

        var ex = await Assert.ThrowsAsync<MediaTranscriptionException>(
            () => service.TranscribeAsync(Command(), CancellationToken.None));
        Assert.Equal("no-audio", ex.Code);
    }

    [Fact]
    public async Task Saving_keeps_the_transcript_beside_the_file_as_a_reference_only_subtitle()
    {
        var (service, world, _, _) = Create(_ => Srt(Namaste));
        var video = AddVideo(world);
        video.FolderId = "folder-1";

        var result = await service.TranscribeAsync(Command(save: true), CancellationToken.None);

        var saved = Assert.IsType<Asset>(result.SavedSubtitle);
        Assert.Equal(AssetKind.Subtitle, saved.Kind);
        Assert.Equal(AssetUsageScope.ReferenceOnly, saved.UsageScope);
        Assert.Equal("folder-1", saved.FolderId);
        Assert.Equal("Interview - transcript.srt", saved.Name);
        Assert.StartsWith("projects/project-1/assets/", saved.StorageKey);
        Assert.Equal(result.SubRip, System.Text.Encoding.UTF8.GetString(world.Store.Contents[saved.StorageKey]));
    }
}
