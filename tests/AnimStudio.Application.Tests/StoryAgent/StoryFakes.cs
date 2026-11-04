using System.Buffers.Binary;
using System.Text.Json;
using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Abstractions.Music;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Abstractions.StoryAgent;
using AnimStudio.Application.Music;
using AnimStudio.Application.StoryAgent;
using AnimStudio.Application.Tests.Ai;
using AnimStudio.Domain.Ai;
using AnimStudio.Domain.Assets;
using AnimStudio.Domain.Stories;
using AnimStudio.Domain.Voices;

namespace AnimStudio.Application.Tests.StoryAgent;

/// <summary>
/// Stores runs as JSON, the way the real repositories do, so a test sees what a restart would: nothing is shared with
/// the object that was saved, and anything that does not survive serialisation is lost.
/// </summary>
internal sealed class InMemoryStoryRuns : IStoryRunRepository
{
    private readonly Dictionary<string, string> _json = new(StringComparer.Ordinal);
    private static readonly JsonSerializerOptions Options = new() { PropertyNameCaseInsensitive = true, PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    public int Saves { get; private set; }

    public Task<StoryRun?> GetAsync(string id, CancellationToken ct) => Task.FromResult(Read(id));

    public Task<IReadOnlyList<StoryRun>> ListByUserAsync(string userId, int limit, CancellationToken ct) =>
        Task.FromResult<IReadOnlyList<StoryRun>>([.. All().Where(r => r.UserId == userId).OrderByDescending(r => r.UpdatedAtUtc).Take(limit)]);

    public Task<IReadOnlyList<StoryRun>> ListWorkingAsync(CancellationToken ct) =>
        Task.FromResult<IReadOnlyList<StoryRun>>([.. All().Where(r => r.IsWorking)]);

    public Task<int> CountWorkingByUserAsync(string userId, CancellationToken ct) =>
        Task.FromResult(All().Count(r => r.UserId == userId && r.IsWorking));

    public Task UpsertAsync(StoryRun run, CancellationToken ct)
    {
        lock (_json)
        {
            _json[run.Id] = JsonSerializer.Serialize(run, Options);
            Saves++;
        }
        return Task.CompletedTask;
    }

    public Task<bool> DeleteAsync(string id, CancellationToken ct)
    {
        lock (_json) return Task.FromResult(_json.Remove(id));
    }

    /// <summary>Puts a run in directly, with no save counted.</summary>
    public void Seed(StoryRun run)
    {
        lock (_json) _json[run.Id] = JsonSerializer.Serialize(run, Options);
    }

    public StoryRun? Read(string id)
    {
        lock (_json) return _json.TryGetValue(id, out var json) ? JsonSerializer.Deserialize<StoryRun>(json, Options) : null;
    }

    public IReadOnlyList<StoryRun> All()
    {
        lock (_json) return [.. _json.Values.Select(j => JsonSerializer.Deserialize<StoryRun>(j, Options)!)];
    }
}

internal sealed class FakeQueue : IStoryRunQueue
{
    public List<string> Enqueued { get; } = [];
    public List<string> CancelAsked { get; } = [];
    public Func<string, StoryCancelResult> OnCancel { get; set; } = _ => StoryCancelResult.NotRunning;

    public void Enqueue(string runId) => Enqueued.Add(runId);

    public Task<StoryCancelResult> CancelAsync(string runId, TimeSpan wait, CancellationToken ct)
    {
        CancelAsked.Add(runId);
        return Task.FromResult(OnCancel(runId));
    }
}

internal sealed class StoryClock(DateTimeOffset start) : TimeProvider
{
    private DateTimeOffset _now = start;
    public override DateTimeOffset GetUtcNow() => _now;
    public void Advance(TimeSpan by) => _now += by;
}

/// <summary>A stage whose work is a delegate, and which counts how often it was asked to work.</summary>
internal sealed class ScriptedStage(string id, Func<StoryStageContext, CancellationToken, Task<StoryStageOutcome>>? body = null) : IStoryStage
{
    public string Id => id;
    public int Calls { get; private set; }

    public async Task<StoryStageOutcome> RunAsync(StoryStageContext context, CancellationToken ct)
    {
        Calls++;
        return body is null ? StoryStageOutcome.Completed() : await body(context, ct);
    }
}

internal sealed class FakeAi : IAiExecutor
{
    public Func<AiTextRequest, AiOutcome<AiTextResult>> Text { get; set; } =
        _ => AiOutcome<AiTextResult>.Unavailable(AiUnavailableReason.NotConfigured);

    public Func<AiImageRequest, AiOutcome<AiImageResult>> Image { get; set; } =
        _ => AiOutcome<AiImageResult>.Unavailable(AiUnavailableReason.NotConfigured);

    public Func<AiSpeechRequest, AiOutcome<AiSpeechResult>> Speech { get; set; } =
        _ => AiOutcome<AiSpeechResult>.Unavailable(AiUnavailableReason.NotConfigured);

    public List<AiTextRequest> TextCalls { get; } = [];
    public List<AiImageRequest> ImageCalls { get; } = [];
    public List<AiSpeechRequest> SpeechCalls { get; } = [];
    public List<AiCallContext> Contexts { get; } = [];

    public Task<AiOutcome<AiTextResult>> TextAsync(AiTextRequest request, AiCallContext context, CancellationToken ct)
    {
        TextCalls.Add(request);
        Contexts.Add(context);
        return Task.FromResult(Text(request));
    }

    public Task<AiOutcome<AiImageResult>> ImageAsync(AiImageRequest request, AiCallContext context, CancellationToken ct)
    {
        ImageCalls.Add(request);
        Contexts.Add(context);
        return Task.FromResult(Image(request));
    }

    public Task<AiOutcome<AiSpeechResult>> SpeechAsync(AiSpeechRequest request, AiCallContext context, CancellationToken ct)
    {
        SpeechCalls.Add(request);
        Contexts.Add(context);
        return Task.FromResult(Speech(request));
    }

    public Task<AiOutcome<AiTranscriptionResult>> TranscribeAsync(AiTranscriptionRequest request, AiCallContext context, CancellationToken ct) =>
        throw new NotSupportedException();

    public static AiOutcome<AiTextResult> TextOk(string text, string provider = "stub-text") =>
        AiOutcome<AiTextResult>.Success(new AiTextResult(text, new AiProvenance { ProviderId = provider, Capability = AiCapability.Text }));

    public static AiOutcome<AiImageResult> ImageOk(byte[] content, string provider = "stub-image") =>
        AiOutcome<AiImageResult>.Success(new AiImageResult(content, "image/png", new AiProvenance { ProviderId = provider, Capability = AiCapability.Image }));

    public static AiOutcome<AiSpeechResult> SpeechOk(byte[] wav, string provider = "stub-speech") =>
        AiOutcome<AiSpeechResult>.Success(new AiSpeechResult(wav, "audio/wav", null, new AiProvenance { ProviderId = provider, Capability = AiCapability.Speech }));
}

internal sealed class FakePrompts : IPromptLibrary
{
    public List<(string Key, IReadOnlyDictionary<string, string?> Variables)> Rendered { get; } = [];
    public Exception? Throws { get; set; }

    public Task<RenderedPrompt> RenderAsync(string templateKey, IReadOnlyDictionary<string, string?> variables, CancellationToken ct)
    {
        if (Throws is not null) throw Throws;
        Rendered.Add((templateKey, variables));
        return Task.FromResult(new RenderedPrompt(templateKey, 1, "SYSTEM RULES", $"WRITE: {variables.GetValueOrDefault("title")}", """{"type":"object"}"""));
    }

    public Task<IReadOnlyList<PromptTemplate>> ListAsync(CancellationToken ct) => Task.FromResult<IReadOnlyList<PromptTemplate>>([]);

    public Task<PromptTemplate?> FindAsync(string templateKey, CancellationToken ct) => Task.FromResult<PromptTemplate?>(null);
}

/// <summary>Reports which capabilities exist; the providers behind them do nothing.</summary>
internal sealed class StubRegistry(int text = 0, int image = 0, int speech = 0, IReadOnlyList<ISpeechAiProvider>? extraSpeech = null) : IAiProviderRegistry
{
    public IReadOnlyList<ITextAiProvider> TextChain() => [.. Enumerable.Range(0, text).Select(i => new ScriptedTextProvider($"stub-text-{i}", _ => string.Empty))];

    public IReadOnlyList<ITextAiProvider> UsableTextProviders() => TextChain();

    public IReadOnlyList<IImageAiProvider> ImageChain() => [.. Enumerable.Range(0, image).Select(i => new ScriptedImageProvider($"stub-image-{i}", []))];

    public IReadOnlyList<ISpeechAiProvider> SpeechChain() =>
        [.. Enumerable.Range(0, speech).Select(i => (ISpeechAiProvider)new StubSpeech($"stub-speech-{i}")), .. extraSpeech ?? []];

    public IReadOnlyList<ITranscriptionProvider> TranscriptionChain() => [];

    public AiCapabilityStatus Describe(AiCapability capability) => new(capability, null, null, false, AiUnavailableReason.NotConfigured, []);

    public IReadOnlyList<AiCapabilityStatus> DescribeAll() => [];

    public void ReportOutcome(AiProviderId providerId, bool success)
    {
    }

    private sealed class StubSpeech(string id) : ISpeechAiProvider
    {
        public AiProviderId Id { get; } = AiProviderId.Parse(id);
        public AiCapability Capability => AiCapability.Speech;
        public bool IsConfigured => true;
        public Task<AiProviderHealth> CheckHealthAsync(CancellationToken ct) => Task.FromResult(AiProviderHealth.Healthy);
        public Task<IReadOnlyList<AiVoice>> ListVoicesAsync(CancellationToken ct) => Task.FromResult<IReadOnlyList<AiVoice>>([]);
        public Task<AiSpeechResult> SynthesizeAsync(AiSpeechRequest request, CancellationToken ct) => throw new NotSupportedException();
    }
}

internal sealed class FakeMusic : IMusicCatalog
{
    public string ProviderId => "jamendo";
    public bool IsConfigured { get; set; } = true;
    public Func<MusicSearchQuery, MusicSearchPage> Search { get; set; } = _ => new MusicSearchPage([], 1, false);
    public Func<MusicTrack, byte[]> Download { get; set; } = _ => Mp3Bytes();
    public List<MusicSearchQuery> Searches { get; } = [];
    public List<string> Downloads { get; } = [];

    public Task<MusicSearchPage> SearchAsync(MusicSearchQuery query, CancellationToken ct)
    {
        Searches.Add(query);
        return Task.FromResult(Search(query));
    }

    public Task<MusicTrack?> GetAsync(string trackId, CancellationToken ct) => Task.FromResult<MusicTrack?>(null);

    public Task<byte[]> DownloadAsync(MusicTrack track, long maxBytes, CancellationToken ct)
    {
        Downloads.Add(track.Id);
        return Task.FromResult(Download(track));
    }

    public static byte[] Mp3Bytes() => [.. "ID3"u8.ToArray(), .. new byte[200]];

    public static MusicTrack Track(string id, string licenseUrl = "https://creativecommons.org/licenses/by/3.0/", bool downloadable = true, double seconds = 240) =>
        new("jamendo", id, $"Track {id}", "An Artist", seconds, null, null, $"https://www.jamendo.com/track/{id}",
            MusicLicensing.Parse(licenseUrl), [], [], [], true, null, null, downloadable ? $"https://prod-1.storage.jamendo.com/download/{id}" : null);
}

internal sealed class FakeFinisher : IStoryAudioFinisher
{
    public bool IsAvailable { get; set; } = true;
    public int Calls { get; private set; }

    public Task<FinishedLine> FinishAsync(byte[] speech, double leadSeconds, double tailSeconds, CancellationToken ct)
    {
        Calls++;
        const double seconds = 2.0;
        return Task.FromResult(new FinishedLine(Wav(seconds + leadSeconds + tailSeconds), seconds + leadSeconds + tailSeconds,
            [new StoryPause { Start = 0, End = leadSeconds }]));
    }

    /// <summary>A real WAV header over silence: 8 kHz, mono, 16-bit.</summary>
    public static byte[] Wav(double seconds)
    {
        var data = new byte[(int)(seconds * 16_000)];
        var wav = new byte[44 + data.Length];
        "RIFF"u8.CopyTo(wav);
        BinaryPrimitives.WriteInt32LittleEndian(wav.AsSpan(4), 36 + data.Length);
        "WAVEfmt "u8.CopyTo(wav.AsSpan(8));
        BinaryPrimitives.WriteInt32LittleEndian(wav.AsSpan(16), 16);
        BinaryPrimitives.WriteInt16LittleEndian(wav.AsSpan(20), 1);
        BinaryPrimitives.WriteInt16LittleEndian(wav.AsSpan(22), 1);
        BinaryPrimitives.WriteInt32LittleEndian(wav.AsSpan(24), 8000);
        BinaryPrimitives.WriteInt32LittleEndian(wav.AsSpan(28), 16_000);
        BinaryPrimitives.WriteInt16LittleEndian(wav.AsSpan(32), 2);
        BinaryPrimitives.WriteInt16LittleEndian(wav.AsSpan(34), 16);
        "data"u8.CopyTo(wav.AsSpan(36));
        BinaryPrimitives.WriteInt32LittleEndian(wav.AsSpan(40), data.Length);
        return wav;
    }
}

internal sealed class InMemoryVoices : IVoiceProfileRepository
{
    public Dictionary<string, VoiceProfile> Items { get; } = new(StringComparer.Ordinal);

    public Task<VoiceProfile?> GetAsync(string id, CancellationToken ct) => Task.FromResult(Items.GetValueOrDefault(id));

    public Task<IReadOnlyList<VoiceProfile>> ListByUserAsync(string userId, CancellationToken ct) =>
        Task.FromResult<IReadOnlyList<VoiceProfile>>([.. Items.Values.Where(v => v.UserId == userId)]);

    public Task UpsertAsync(VoiceProfile profile, CancellationToken ct)
    {
        Items[profile.Id] = profile;
        return Task.CompletedTask;
    }

    public Task<bool> DeleteAsync(string id, CancellationToken ct) => Task.FromResult(Items.Remove(id));
}

internal static class StoryTestData
{
    /// <summary>A run with its stages and a script, in the given status, owned by <paramref name="userId"/>.</summary>
    /// <param name="reviewsApproved">The voice, music and video were already approved, so a build runs straight through.</param>
    public static StoryRun Run(StoryRunStatus status = StoryRunStatus.Researching, string userId = "user-1", bool withScript = false,
        bool reviewsApproved = false)
    {
        var run = new StoryRun
        {
            Id = $"sr_{Guid.NewGuid():n}",
            UserId = userId,
            Title = "दीपावली",
            Brief = StorySamples.Brief(),
            Options = new StoryBuildOptions { Music = false, RenderWhenReady = false },
            Status = status,
            Stages = StoryRun.NewStages(),
            CreatedAtUtc = StorySamples.Now,
            UpdatedAtUtc = StorySamples.Now
        };

        if (withScript)
        {
            run.Research = StorySamples.Research();
            run.Script = StoryScriptParser.Parse(StorySamples.ReplyJson, run.Brief, run.Research, "test", StorySamples.Now, tolerant: false).Script;
            foreach (var id in StoryStageIds.Planning) run.Stage(id).Status = StoryStageStatus.Completed;
        }

        if (reviewsApproved)
        {
            foreach (var id in StoryStageIds.Reviewed) run.SetApproval(id, StorySamples.Now);
        }

        return run;
    }

    public static byte[] Png(int scene = 1) => StoryPlaceholderImage.Create(scene, vertical: false);
}

/// <summary>The person's YouTube uploads, held in a list; a caption is "added" unless the test says YouTube refuses it.</summary>
internal sealed class FakeStoryPublishing : IStoryPublishing
{
    public List<StoryPublication> Videos { get; } = [];
    public List<(string UserId, string ChannelId, string VideoId, string Language, string Srt)> Captions { get; } = [];

    /// <summary>Languages YouTube refuses, with the code it refuses them with.</summary>
    public Dictionary<string, string> Refuse { get; } = new(StringComparer.Ordinal);

    public Task<IReadOnlyList<StoryPublication>> ListAsync(string userId, string? projectId, CancellationToken ct) =>
        Task.FromResult<IReadOnlyList<StoryPublication>>([.. Videos.Where(v => projectId is null || v.ProjectId == projectId)]);

    public Task<string> AddCaptionAsync(string userId, string channelId, string videoId, string language, string name, byte[] srt, CancellationToken ct)
    {
        if (Refuse.TryGetValue(language, out var code)) throw new StoryPublishingException(code, "YouTube said no.");
        Captions.Add((userId, channelId, videoId, language, System.Text.Encoding.UTF8.GetString(srt)));
        return Task.FromResult($"cap-{language}-{Captions.Count}");
    }

    public static StoryPublication Video(string projectId, string videoId = "abcdefghijk", string jobId = "job-1", bool canCaption = true,
        string privacy = "public", DateTime? publishAt = null) =>
        new(videoId, projectId, jobId, "UCchannel", "My channel", "A title", privacy, null, StorySamples.Now, publishAt,
            "Ok", null, $"https://youtu.be/{videoId}", $"https://studio.youtube.com/video/{videoId}/edit", null, canCaption);
}
