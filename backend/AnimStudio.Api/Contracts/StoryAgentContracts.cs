using System.ComponentModel.DataAnnotations;
using AnimStudio.Application.StoryAgent;
using AnimStudio.Domain.Jobs;
using AnimStudio.Domain.Stories;

namespace AnimStudio.Api.Contracts;

// ------------------------------------------------------------------------------------------------ requests

/// <summary>What the person asked for. A title is all that is needed; everything else has a default.</summary>
public sealed record CreateStoryRunRequest
{
    /// <summary>Optional only when a built-in story is chosen, which brings its own title.</summary>
    [StringLength(StoryRunService.MaxTitleChars, ErrorMessage = "The title can be up to 160 characters.")]
    public string? Title { get; init; }

    /// <summary>Points to cover, a rough story, or anything the title alone does not say.</summary>
    [StringLength(StoryRunService.MaxNotesChars, ErrorMessage = "The notes can be up to 2000 characters.")]
    public string? Notes { get; init; }

    /// <summary><c>hi</c> or <c>en</c>.</summary>
    [StringLength(8)]
    public string? Language { get; init; }

    public int TargetSeconds { get; init; } = 150;
    public StoryFormat Format { get; init; } = StoryFormat.Wide;
    public StoryWriterMode Writer { get; init; } = StoryWriterMode.Auto;

    /// <summary>The built-in story, when <see cref="Writer"/> is <c>BuiltIn</c>.</summary>
    [StringLength(64)]
    public string? PackId { get; init; }

    public StoryBuildOptionsRequest? Options { get; init; }
}

public sealed record StoryBuildOptionsRequest
{
    public StoryNarrationMode Narration { get; init; } = StoryNarrationMode.Stock;

    [StringLength(64)]
    public string? VoiceProfileId { get; init; }

    [StringLength(64)]
    public string? VoiceId { get; init; }

    [StringLength(40)]
    public string? SpeechEngine { get; init; }

    public double SpeechRate { get; init; } = 1.0;
    public bool ClosestToMyVoice { get; init; }
    public StoryVisualMode Visuals { get; init; } = StoryVisualMode.Auto;

    [StringLength(300)]
    public string? ImageStyle { get; init; }

    public bool Music { get; init; } = true;
    public bool UploadsAreAiMade { get; init; } = true;

    [StringLength(80)]
    public string? MusicQuery { get; init; }

    public double MusicVolume { get; init; } = 0.2;
    public bool RenderWhenReady { get; init; } = true;
    public bool AutoApprove { get; init; }

    public StoryBuildOptions ToOptions() => new()
    {
        Narration = Narration,
        VoiceProfileId = VoiceProfileId,
        VoiceId = VoiceId,
        SpeechEngine = SpeechEngine,
        SpeechRate = SpeechRate,
        ClosestToMyVoice = ClosestToMyVoice,
        Visuals = Visuals,
        ImageStyle = ImageStyle,
        Music = Music,
        UploadsAreAiMade = UploadsAreAiMade,
        MusicQuery = MusicQuery,
        MusicVolume = MusicVolume,
        RenderWhenReady = RenderWhenReady,
        AutoApprove = AutoApprove
    };
}

/// <summary>The reply a chat wrote, pasted as it came.</summary>
public sealed record PasteStoryScriptRequest
{
    [StringLength(StoryRunService.MaxScriptReplyChars, ErrorMessage = "That reply is far longer than any script. Paste only the JSON object.")]
    public string? Reply { get; init; }
}

public sealed record RewriteStoryScriptRequest
{
    /// <summary>Switch writer for the rewrite: <c>Auto</c> (the text model) or <c>Manual</c> (paste a reply). Null keeps the current one.</summary>
    public StoryWriterMode? Writer { get; init; }
}

// The limits below are the ones the service applies when it saves the script, so a value that is too long is refused
// here instead of being cut short without a word.
public sealed record EditStorySourceRequest
{
    [StringLength(100)] public string? Text { get; init; }
    [StringLength(80)] public string? Ref { get; init; }
    [StringLength(240)] public string? Note { get; init; }
}

public sealed record EditStorySceneRequest
{
    /// <summary>The number the scene had, so what was made for it stays with it; 0 for a scene added by hand.</summary>
    public int Number { get; init; }

    [StringLength(160)] public string? Headline { get; init; }
    [StringLength(StoryScriptParser.MaxNarrationChars, ErrorMessage = "A scene's narration can be up to 1600 characters. Split it into two scenes.")]
    public string? Narration { get; init; }
    [StringLength(1_600)] public string? English { get; init; }

    /// <summary><c>text</c>, <c>tradition</c> or <c>reflection</c>.</summary>
    [StringLength(32)] public string? Basis { get; init; }

    [MaxLength(8)] public List<EditStorySourceRequest>? Sources { get; init; }
    [StringLength(800)] public string? ImagePrompt { get; init; }
    [MaxLength(8)] public List<string>? ImageKeywords { get; init; }
    [StringLength(30)] public string? Mood { get; init; }
}

public sealed record EditStoryScriptRequest
{
    [StringLength(200)] public string? Title { get; init; }
    [StringLength(200)] public string? TitleEnglish { get; init; }
    [StringLength(600)] public string? Summary { get; init; }
    [StringLength(80)] public string? MusicQuery { get; init; }

    [MaxLength(StoryScriptParser.MaxScenes)]
    public List<EditStorySceneRequest>? Scenes { get; init; }

    public StoryScriptEdit ToEdit() => new(Title, TitleEnglish, Summary, MusicQuery,
        [.. (Scenes ?? []).Select(s => new StorySceneEdit(
            s.Number, s.Headline, s.Narration, s.English, s.Basis,
            [.. (s.Sources ?? []).Select(x => new StorySourceEdit(x.Text, x.Ref, x.Note))],
            s.ImagePrompt, s.ImageKeywords, s.Mood))]);
}

// ------------------------------------------------------------------------------------------------ responses

public sealed record StoryPackResponse(string Id, string Title, string TitleEnglish, string Description, string Language, int TargetSeconds);

public sealed record StoryTopicSummaryResponse(string Id, string Name, string Hindi, string Summary);

public sealed record StoryAgentOptionsResponse(
    bool Enabled,
    bool TextModel,
    bool SpeechEngine,
    bool ImageEngine,
    bool Music,
    bool Renderer,
    bool AudioFinishing,
    int MaxActiveRuns,
    IReadOnlyList<StoryPackResponse> Packs,
    IReadOnlyList<StoryTopicSummaryResponse> Topics,
    IReadOnlyList<MyVoiceResponse> MyVoices);

public sealed record StoryStageResponse(
    string Id, StoryStageStatus Status, int Progress, string? Message, string? Code, DateTime? StartedAtUtc, DateTime? CompletedAtUtc);

public sealed record StorySourceResponse(
    string TextId, string TextName, string Ref, string? Note, StorySourceConfidence Confidence,
    string? Url, CitationStatus Check, bool Grounded, string? CheckMessage);

public sealed record StorySceneResponse(
    int Number,
    string Headline,
    string Narration,
    string? English,
    StoryBasis Basis,
    IReadOnlyList<StorySourceResponse> Sources,
    string? ImagePrompt,
    IReadOnlyList<string> ImageKeywords,
    string? Mood,
    double EstimatedSeconds,
    bool HasImage,
    string? ImageSource,
    string? ImageName,
    bool HasAudio,
    double? AudioSeconds);

public sealed record StoryScriptResponse(
    string Title,
    string? TitleEnglish,
    string Language,
    string? Summary,
    string? MusicQuery,
    IReadOnlyList<StorySceneResponse> Scenes,
    IReadOnlyList<string> ReviewNotes,
    string? WrittenBy,
    double EstimatedSeconds);

public sealed record StoryTopicResponse(string TopicId, string Name, string? Summary, IReadOnlyList<StorySourceResponse> Sources);

public sealed record StoryPassageResponse(
    string TextId, string TextName, string Ref, string Title, string Language, string Url, string Excerpt, bool Direct, string License);

public sealed record StoryResearchResponse(
    IReadOnlyList<StoryTopicResponse> Topics,
    IReadOnlyList<StoryPassageResponse> Passages,
    IReadOnlyList<string> Queries,
    IReadOnlyList<string> Warnings,
    DateTime RetrievedAtUtc);

public sealed record StoryMusicResponse(string Title, string Artist, string? PageUrl, string LicenseCode, string? LicenseUrl, string Attribution);

public sealed record StoryRenderResponse(string JobId, RenderJobStatus Status, int Progress, string? Message, bool Downloadable);

public sealed record StoryChapterResponse(double StartSeconds, string Stamp, string Title);

public sealed record StoryKitResponse(
    IReadOnlyList<string> TitleOptions,
    string Description,
    IReadOnlyList<string> Tags,
    IReadOnlyList<string> Hashtags,
    IReadOnlyList<StoryChapterResponse> Chapters,
    string PinnedComment,
    string EngagementComment,
    IReadOnlyList<string> Checklist,
    int DescriptionBytes,
    int TagsLength);

public sealed record StoryBriefResponse(
    string Title, string? Notes, string Language, int TargetSeconds, StoryFormat Format, StoryWriterMode Writer, string? PackId);

public sealed record StoryOptionsResponse(
    StoryNarrationMode Narration, string? VoiceProfileId, string? VoiceId, string? SpeechEngine, double SpeechRate, bool ClosestToMyVoice,
    StoryVisualMode Visuals, string? ImageStyle, bool Music, bool UploadsAreAiMade, string? MusicQuery, double MusicVolume,
    bool RenderWhenReady, bool AutoApprove);

public sealed record StoryRunResponse(
    string Id,
    string Title,
    StoryBriefResponse Brief,
    StoryOptionsResponse Options,
    StoryRunStatus Status,
    bool Working,
    IReadOnlyList<StoryStageResponse> Stages,
    StoryResearchResponse? Research,
    StoryScriptResponse? Script,
    IReadOnlyList<string> Warnings,
    IReadOnlyList<string> ScriptWarnings,
    string? ProjectId,
    StoryRenderResponse? Render,
    StoryKitResponse? Kit,
    StoryMusicResponse? Music,
    string? ErrorCode,
    string? ErrorMessage,
    DateTime CreatedAtUtc,
    DateTime UpdatedAtUtc);

/// <summary>A run in the list: enough to draw a card and open it.</summary>
public sealed record StoryRunSummaryResponse(
    string Id,
    string Title,
    StoryRunStatus Status,
    bool Working,
    int Progress,
    string? Message,
    bool HasProject,
    bool HasKit,
    DateTime CreatedAtUtc,
    DateTime UpdatedAtUtc);

public sealed record StoryPromptResponse(string Prompt);

// ------------------------------------------------------------------------------------------------ mapping

/// <summary>
/// The run as the browser sees it. A storage key, the owner's id and the voice profile's file never cross the wire: a
/// picture is fetched by scene number through the API, which checks the run is the caller's.
/// </summary>
public static class StoryAgentMapper
{
    private const int ExcerptChars = 360;

    public static StoryAgentOptionsResponse ToResponse(StoryAgentCapabilities caps) => new(
        caps.Enabled, caps.TextModel, caps.SpeechEngine, caps.ImageEngine, caps.Music, caps.Renderer, caps.AudioFinishing, caps.MaxActiveRuns,
        [.. caps.Packs.Select(p => new StoryPackResponse(p.Id, p.Title, p.TitleEnglish, p.Description, p.Language, p.TargetSeconds))],
        [.. GranthTopics.All.Select(t => new StoryTopicSummaryResponse(t.Id, t.Name, t.Hindi, t.Summary))],
        [.. caps.MyVoices.Select(Controllers.MyVoicesController.ToResponse)]);

    public static StoryRunSummaryResponse ToSummary(StoryRun run)
    {
        var running = run.Stages.FirstOrDefault(s => s.Status == StoryStageStatus.Running);
        var message = run.Status switch
        {
            StoryRunStatus.Failed => run.ErrorMessage,
            StoryRunStatus.Cancelled => "Stopped.",
            StoryRunStatus.Completed => "Done.",
            StoryRunStatus.ScriptReady => "Script ready to read.",
            StoryRunStatus.AwaitingScript => "Waiting for the script.",
            _ => running?.Message
        };

        return new(run.Id, run.Title, run.Status, run.IsWorking, Overall(run), message, !string.IsNullOrEmpty(run.ProjectId),
            run.Kit is not null, run.CreatedAtUtc, run.UpdatedAtUtc);
    }

    public static StoryRunResponse ToResponse(StoryRun run, RenderJob? job) => new(
        run.Id,
        run.Title,
        new StoryBriefResponse(run.Brief.Title, run.Brief.Notes, run.Brief.Language, run.Brief.TargetSeconds, run.Brief.Format, run.Brief.Writer, run.Brief.PackId),
        ToResponse(run.Options),
        run.Status,
        run.IsWorking,
        [.. run.Stages.Select(s => new StoryStageResponse(s.Id, s.Status, s.Progress, s.Message, s.Code, s.StartedAtUtc, s.CompletedAtUtc))],
        run.Research is null ? null : ToResponse(run.Research),
        run.Script is null ? null : ToResponse(run.Id, run.Script),
        run.Warnings,
        run.ScriptWarnings,
        run.ProjectId,
        job is null ? null : new StoryRenderResponse(job.Id, job.Status, job.Progress,
            job.Status == RenderJobStatus.Failed ? job.ErrorMessage ?? job.Message : job.Message,
            (job.Status is RenderJobStatus.Completed or RenderJobStatus.CompletedWithWarnings) && !string.IsNullOrEmpty(job.OutputStorageKey)),
        run.Kit is null ? null : ToResponse(run.Kit),
        run.Music is null ? null : new StoryMusicResponse(run.Music.Title, run.Music.Artist, run.Music.PageUrl, run.Music.LicenseCode, run.Music.LicenseUrl, run.Music.Attribution),
        run.ErrorCode,
        run.ErrorMessage,
        run.CreatedAtUtc,
        run.UpdatedAtUtc);

    private static StoryOptionsResponse ToResponse(StoryBuildOptions o) => new(
        o.Narration, o.VoiceProfileId, o.VoiceId, o.SpeechEngine, o.SpeechRate, o.ClosestToMyVoice, o.Visuals, o.ImageStyle,
        o.Music, o.UploadsAreAiMade, o.MusicQuery, o.MusicVolume, o.RenderWhenReady, o.AutoApprove);

    private static StoryResearchResponse ToResponse(StoryResearch r) => new(
        [.. r.Topics.Select(t => new StoryTopicResponse(t.TopicId, t.Name, t.Summary, [.. t.Sources.Select(ToResponse)]))],
        [.. r.Passages.Select(p => new StoryPassageResponse(p.TextId, p.TextName, p.Ref, p.Title, p.Language, p.Url,
            p.Excerpt.Length <= ExcerptChars ? p.Excerpt : p.Excerpt[..ExcerptChars].TrimEnd() + "...", p.Direct, p.License))],
        r.Queries, r.Warnings, r.RetrievedAtUtc);

    private static StoryScriptResponse ToResponse(string runId, StoryScript s) => new(
        s.Title, s.TitleEnglish, s.Language, s.Summary, s.MusicQuery,
        [.. s.Scenes.Select(scene => new StorySceneResponse(
            scene.Number, scene.Headline, scene.Narration, scene.English, scene.Basis,
            [.. scene.Sources.Select(ToResponse)],
            scene.ImagePrompt, scene.ImageKeywords, scene.Mood, scene.EstimatedSeconds,
            StoryObjectKeys.Owns(runId, scene.ImageKey), scene.ImageSource, scene.ImageName,
            StoryObjectKeys.Owns(runId, scene.AudioKey), scene.AudioSeconds))],
        s.ReviewNotes, s.WrittenBy, Math.Round(s.Scenes.Sum(x => x.AudioSeconds is > 0 ? x.AudioSeconds.Value : x.EstimatedSeconds), 1));

    private static StorySourceResponse ToResponse(StorySourceRef s) =>
        new(s.TextId, s.TextName, s.Ref, s.Note, s.Confidence, s.Url, s.Check, s.Grounded, s.CheckMessage);

    private static StoryKitResponse ToResponse(StoryPublishKit k) => new(
        k.TitleOptions, k.Description, k.Tags, k.Hashtags,
        [.. k.Chapters.Select(c => new StoryChapterResponse(c.StartSeconds, c.Stamp, c.Title))],
        k.PinnedComment, k.EngagementComment, k.Checklist, k.DescriptionBytes, k.TagsLength);

    /// <summary>How far along the whole run is: each finished step counts in full, the running one by its own progress.</summary>
    private static int Overall(StoryRun run)
    {
        if (run.Stages.Count == 0) return 0;
        var total = run.Stages.Sum(s => s.Status is StoryStageStatus.Completed or StoryStageStatus.Skipped
            ? 100
            : s.Status == StoryStageStatus.Running ? s.Progress : 0);
        return total / run.Stages.Count;
    }
}
