using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Abstractions.Music;
using AnimStudio.Application.Ai;
using AnimStudio.Application.Options;
using AnimStudio.Application.StoryAgent;
using AnimStudio.Application.Tests.Ai;
using AnimStudio.Domain.Ai;
using AnimStudio.Domain.Stories;
using Microsoft.Extensions.Logging.Abstractions;

namespace AnimStudio.Application.Tests.StoryAgent;

public sealed class StoryBudgetServiceTests
{
    private sealed class FakeComposer : ISpeechAiProvider, IMusicGeneratingProvider
    {
        public AiProviderId Id { get; } = AiProviderId.Parse("gemini-tts");
        public AiCapability Capability => AiCapability.Speech;
        public bool IsConfigured => true;
        public Task<AiProviderHealth> CheckHealthAsync(CancellationToken ct) => Task.FromResult(AiProviderHealth.Healthy);
        public Task<IReadOnlyList<AiVoice>> ListVoicesAsync(CancellationToken ct) => Task.FromResult<IReadOnlyList<AiVoice>>([]);
        public Task<AiSpeechResult> SynthesizeAsync(AiSpeechRequest request, CancellationToken ct) => throw new NotSupportedException();
        public Task<AiGeneratedMusic> GenerateMusicAsync(string prompt, string? model, CancellationToken ct) => throw new NotSupportedException();
    }

    private static (StoryBudgetService Service, InMemoryAiUsageRepository Usage) Make(AiOptions? ai = null, params string[] imageEngines)
    {
        var usage = new InMemoryAiUsageRepository();
        var store = new InMemoryObjectStore();
        // Narration is off in these tests, so the narrator is never asked to plan a voice.
        var narrator = new StoryNarrator(new FakeAi(), new InMemoryVoices(), null!, null!, store, new FakeFinisher(),
            NullLogger<StoryNarrator>.Instance);
        var registry = new StubRegistry(extraSpeech: [new FakeComposer()],
            extraImage: [.. imageEngines.Select(id => (IImageAiProvider)new ScriptedImageProvider(id, []))]);
        var service = new StoryBudgetService(usage, narrator, registry,
            new StaticOptionsMonitor<AiOptions>(ai ?? new AiOptions()), new StaticOptionsMonitor<StoryAgentOptions>(new StoryAgentOptions()),
            new StoryClock(new DateTimeOffset(StorySamples.Now)), NullLogger<StoryBudgetService>.Instance);
        return (service, usage);
    }

    private static AiOptions Caps(params (string Id, int Cap)[] caps)
    {
        var ai = new AiOptions();
        foreach (var (id, cap) in caps) ai.Providers[id] = new AiProviderOptions { DailyRequestLimit = cap };
        return ai;
    }

    private static void UsedImages(InMemoryAiUsageRepository usage, string providerId, int requests)
    {
        for (var i = 0; i < requests; i++)
        {
            usage.RecordAsync(new AiUsageRecord
            {
                ProviderId = providerId, Capability = AiCapability.Image, Outcome = AiCallOutcome.Succeeded,
                CreatedAt = StorySamples.Now.AddMinutes(-1), DayBucket = AiUsageRecord.BucketFor(StorySamples.Now)
            }, CancellationToken.None).GetAwaiter().GetResult();
        }
    }

    /// <summary>The pictures-only build: no narration, no music, every scene asks for a picture.</summary>
    private static (StoryRun Run, StoryBuildOptions Build, int Pictures) PictureRun()
    {
        var run = StoryTestData.Run(StoryRunStatus.Building, withScript: true);
        var build = new StoryBuildOptions { Narration = StoryNarrationMode.None, Music = false, Visuals = StoryVisualMode.Auto };
        return (run, build, run.Script!.Scenes.Count(s => !string.IsNullOrWhiteSpace(s.ImagePrompt)));
    }

    private static StoryRun Run(out StoryBuildOptions build)
    {
        var run = StoryTestData.Run(StoryRunStatus.Building, withScript: true);
        build = new StoryBuildOptions { Narration = StoryNarrationMode.None, Music = true, MusicSource = StoryMusicSource.Generate };
        return run;
    }

    private static void Used(InMemoryAiUsageRepository usage, string model, int requests)
    {
        for (var i = 0; i < requests; i++)
        {
            usage.RecordAsync(new AiUsageRecord
            {
                ProviderId = "gemini-tts", Capability = AiCapability.Speech, Model = model, Outcome = AiCallOutcome.Succeeded,
                CreatedAt = StorySamples.Now.AddMinutes(-1), DayBucket = AiUsageRecord.BucketFor(StorySamples.Now)
            }, CancellationToken.None).GetAwaiter().GetResult();
        }
    }

    [Fact]
    public async Task A_composed_track_counts_one_lyria_request_and_is_fine_on_a_quiet_day()
    {
        var (service, _) = Make();
        var run = Run(out var build);

        var report = await service.CheckAsync(run, build, CancellationToken.None);

        var line = Assert.Single(report.Lines);
        Assert.Equal("lyria-3.5", line.Name);
        Assert.Equal(1, line.Needed);
        Assert.Equal(StoryBudgetService.Ok, report.Status);
    }

    [Theory]
    [InlineData(398, "ok")]
    [InlineData(399, "warn")]
    [InlineData(500, "over")]
    public async Task The_build_is_warned_at_80_percent_and_stopped_past_the_limit(int usedToday, string status)
    {
        var (service, usage) = Make();
        Used(usage, "lyria-3.5", usedToday);
        var run = Run(out var build);

        var report = await service.CheckAsync(run, build, CancellationToken.None);

        Assert.Equal(status, report.Status);
        Assert.Equal(usedToday, Assert.Single(report.Lines).Used);
    }

    [Fact]
    public async Task A_searched_track_and_no_narration_use_no_paid_limit()
    {
        var (service, usage) = Make();
        Used(usage, "lyria-3.5", 500);
        var run = Run(out var build);
        build.MusicSource = StoryMusicSource.Search;
        var before = run.Options;

        var report = await service.CheckAsync(run, build, CancellationToken.None);

        Assert.Equal(StoryBudgetService.Ok, report.Status);
        Assert.Empty(report.Lines);
        Assert.Same(before, run.Options);
    }

    [Fact]
    public void Google_s_day_starts_at_midnight_pacific()
    {
        var (start, next) = StoryBudgetService.GoogleDay(new DateTime(2026, 11, 5, 4, 0, 0, DateTimeKind.Utc), "America/Los_Angeles");

        Assert.Equal(new DateTime(2026, 11, 4, 8, 0, 0, DateTimeKind.Utc), start);
        Assert.Equal(new DateTime(2026, 11, 5, 8, 0, 0, DateTimeKind.Utc), next);
    }

    [Fact]
    public async Task Pictures_fill_the_first_free_image_engine_to_its_cap_and_the_rest_go_to_the_next()
    {
        var (service, usage) = Make(Caps(("huggingface", 100), ("pollinations", 500)), "huggingface", "pollinations");
        UsedImages(usage, "huggingface", 99);
        var (run, build, pictures) = PictureRun();
        Assert.True(pictures > 1);

        var report = await service.CheckAsync(run, build, CancellationToken.None);

        Assert.Equal(StoryBudgetService.Warn, report.Status);
        var hf = Assert.Single(report.Lines, l => l.Name == "huggingface");
        Assert.Equal((StoryBudgetService.ImageArea, 99L, 1, 100, StoryBudgetService.Warn), (hf.Area, hf.Used, hf.Needed, hf.PercentAfter, hf.Status));
        var pollinations = Assert.Single(report.Lines, l => l.Name == "pollinations");
        Assert.Equal((pictures - 1, StoryBudgetService.Ok), (pollinations.Needed, pollinations.Status));
        Assert.Contains(report.Notes, n => n.Contains("Hugging Face", StringComparison.Ordinal));
        Assert.Contains(report.Notes, n => n.Contains("Pollinations", StringComparison.Ordinal));
    }

    [Fact]
    public async Task The_last_image_engine_past_its_cap_means_plain_backgrounds()
    {
        var (service, usage) = Make(Caps(("pollinations", 10)), "pollinations");
        UsedImages(usage, "pollinations", 10);
        var (run, build, pictures) = PictureRun();

        var report = await service.CheckAsync(run, build, CancellationToken.None);

        Assert.Equal(StoryBudgetService.Over, report.Status);
        var line = Assert.Single(report.Lines);
        Assert.Equal((StoryBudgetService.ImageArea, pictures, StoryBudgetService.Over), (line.Area, line.Needed, line.Status));
        Assert.Contains("plain backgrounds", line.Fallback, StringComparison.Ordinal);
    }

    [Fact]
    public async Task Uploads_only_asks_no_image_engine()
    {
        var (service, usage) = Make(Caps(("pollinations", 10)), "pollinations");
        UsedImages(usage, "pollinations", 10);
        var (run, build, _) = PictureRun();
        build.Visuals = StoryVisualMode.UploadsOnly;

        var report = await service.CheckAsync(run, build, CancellationToken.None);

        Assert.Equal(StoryBudgetService.Ok, report.Status);
        Assert.Empty(report.Lines);
    }

    [Fact]
    public async Task An_image_engine_on_this_machine_takes_every_picture_with_no_limit()
    {
        var (service, usage) = Make(Caps(("pollinations", 10)), "comfyui-local", "pollinations");
        UsedImages(usage, "pollinations", 10);
        var (run, build, _) = PictureRun();

        var report = await service.CheckAsync(run, build, CancellationToken.None);

        Assert.Equal(StoryBudgetService.Ok, report.Status);
        Assert.Empty(report.Lines);
    }
}
