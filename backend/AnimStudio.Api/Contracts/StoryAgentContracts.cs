using System.ComponentModel.DataAnnotations;
using AnimStudio.Application.Abstractions.StoryAgent;
using AnimStudio.Application.StoryAgent;
using AnimStudio.Application.StoryAgent.Stages;
using AnimStudio.Domain.Jobs;
using AnimStudio.Domain.Rendering;
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

    /// <summary><c>Narrated</c> (a narrator, with the characters speaking now and then) or <c>CharactersOnly</c> (no narrator).</summary>
    public StoryVoicing Voicing { get; init; } = StoryVoicing.Narrated;

    /// <summary>The built-in story, when <see cref="Writer"/> is <c>BuiltIn</c>.</summary>
    [StringLength(64)]
    public string? PackId { get; init; }

    /// <summary>The genre the story is made in; empty for the devotional one.</summary>
    [StringLength(40)]
    public string? GenreId { get; init; }

    /// <summary>The text engine that writes the script, from the options' list; empty walks the chain.</summary>
    [StringLength(40)]
    public string? TextEngine { get; init; }

    /// <summary>The brand channel the story is for; empty or <c>default</c> is the default channel.</summary>
    [StringLength(64)]
    public string? BrandChannelId { get; init; }

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

    [StringLength(80)]
    public string? SpeechModel { get; init; }

    [StringLength(300)]
    public string? SpeechStyle { get; init; }

    public double SpeechRate { get; init; } = 1.0;
    public bool CastVoices { get; init; } = true;
    public bool ClosestToMyVoice { get; init; }
    public StoryVisualMode Visuals { get; init; } = StoryVisualMode.Auto;

    [StringLength(300)]
    public string? ImageStyle { get; init; }

    public bool Music { get; init; } = true;
    public StoryMusicSource MusicSource { get; init; } = StoryMusicSource.Auto;
    public bool UploadsAreAiMade { get; init; } = true;

    [StringLength(80)]
    public string? MusicQuery { get; init; }

    public double MusicVolume { get; init; } = 0.2;

    [StringLength(MusicStage.MaxPromptChars, ErrorMessage = "The music brief can be up to 1500 characters.")]
    public string? MusicPrompt { get; init; }

    public StoryLookStyle LookStyle { get; init; } = StoryLookStyle.Auto;
    public bool RenderWhenReady { get; init; } = true;
    public bool AutoApprove { get; init; }

    [Range(StoryVideoSpeed.Min, StoryVideoSpeed.Max)]
    public double VideoSpeed { get; init; } = 1.0;

    /// <summary>Let the app pick the speed from how fast the narration came out. Left out, it is on.</summary>
    public bool? AutoPace { get; init; }

    /// <summary>The pace the voice is brought to; Auto picks by the video's shape and audience.</summary>
    public StoryPaceStyle Pace { get; init; } = StoryPaceStyle.Auto;

    public StoryArtStyle ArtStyle { get; init; } = StoryArtStyle.Auto;

    public static StoryBuildOptionsRequest From(StoryBuildOptions o) => new()
    {
        Narration = o.Narration,
        VoiceProfileId = o.VoiceProfileId,
        VoiceId = o.VoiceId,
        SpeechEngine = o.SpeechEngine,
        SpeechModel = o.SpeechModel,
        SpeechStyle = o.SpeechStyle,
        SpeechRate = o.SpeechRate,
        CastVoices = o.CastVoices,
        ClosestToMyVoice = o.ClosestToMyVoice,
        Visuals = o.Visuals,
        ImageStyle = o.ImageStyle,
        Music = o.Music,
        MusicSource = o.MusicSource,
        UploadsAreAiMade = o.UploadsAreAiMade,
        MusicQuery = o.MusicQuery,
        MusicVolume = o.MusicVolume,
        MusicPrompt = o.MusicPrompt,
        LookStyle = o.LookStyle,
        RenderWhenReady = o.RenderWhenReady,
        AutoApprove = o.AutoApprove,
        VideoSpeed = o.VideoSpeed,
        AutoPace = o.AutoPace,
        Pace = o.Pace,
        ArtStyle = o.ArtStyle
    };

    public StoryBuildOptions ToOptions() => new()
    {
        Narration = Narration,
        VoiceProfileId = VoiceProfileId,
        VoiceId = VoiceId,
        SpeechEngine = SpeechEngine,
        SpeechModel = SpeechModel,
        SpeechStyle = SpeechStyle,
        SpeechRate = SpeechRate,
        CastVoices = CastVoices,
        ClosestToMyVoice = ClosestToMyVoice,
        Visuals = Visuals,
        ImageStyle = ImageStyle,
        Music = Music,
        MusicSource = MusicSource,
        UploadsAreAiMade = UploadsAreAiMade,
        MusicQuery = MusicQuery,
        MusicVolume = MusicVolume,
        MusicPrompt = MusicPrompt,
        LookStyle = LookStyle,
        RenderWhenReady = RenderWhenReady,
        AutoApprove = AutoApprove,
        VideoSpeed = VideoSpeed,
        AutoPace = AutoPace ?? true,
        Pace = Pace,
        ArtStyle = ArtStyle
    };
}

/// <summary>The speed the story's video should play at; the video, its subtitles and chapters are made again to match.</summary>
public sealed record ChangeStorySpeedRequest
{
    [Range(StoryVideoSpeed.Min, StoryVideoSpeed.Max)] public double Speed { get; init; } = 1.0;
}

/// <summary>Ideas for the next part: the kept ones, or new ones when <see cref="Fresh"/>.</summary>
public sealed record SuggestNextPartsRequest
{
    public bool Fresh { get; init; }
}

/// <summary>Starts the next part of a story. Everything is optional: left out, it comes from the part it continues.</summary>
public sealed record ContinueStoryRequest
{
    [StringLength(StoryRunService.MaxTitleChars, ErrorMessage = "The title can be up to 160 characters.")]
    public string? Title { get; init; }

    [StringLength(StoryRunService.MaxNotesChars, ErrorMessage = "The notes can be up to 2000 characters.")]
    public string? Notes { get; init; }

    /// <summary>One of the suggested ideas, by its place in the list.</summary>
    [Range(0, 10)]
    public int? IdeaIndex { get; init; }

    /// <summary>Go on making parts by themselves until this part number.</summary>
    [Range(1, StorySeriesService.MaxParts)]
    public int? AutoContinueTo { get; init; }

    /// <summary>Make another take of the next part even though one exists.</summary>
    public bool Again { get; init; }

    public StoryBuildOptionsRequest? Options { get; init; }

    public StoryContinuation ToContinuation() => new(Title, Notes, IdeaIndex, AutoContinueTo, Again, Options?.ToOptions());
}

/// <summary>How far a series goes on by itself; null stops it.</summary>
public sealed record StorySeriesAutoRequest
{
    [Range(1, StorySeriesService.MaxParts)]
    public int? UpTo { get; init; }
}

/// <summary>Approving a step; with the music, the level the person chose while listening.</summary>
public sealed record ApproveStoryReviewRequest
{
    [Range(0.0, 1.0)] public double? MusicVolume { get; init; }
}

/// <summary>Scenes to take again as they are, and/or a changed voice for all of them. Nulls keep what the story has.</summary>
public sealed record RedoStoryNarrationRequest
{
    [MaxLength(StoryScriptParser.MaxScenes)]
    public List<int>? Scenes { get; init; }

    [StringLength(64)] public string? VoiceId { get; init; }
    [StringLength(300)] public string? SpeechStyle { get; init; }
    [Range(0.5, 2.0)] public double? SpeechRate { get; init; }
    public bool? CastVoices { get; init; }

    public StoryVoiceRedo ToRedo() => new(Scenes, VoiceId, SpeechStyle, SpeechRate, CastVoices);
}

/// <summary>A new brief, style or source for the music, or none at all. Nulls keep what the story has.</summary>
public sealed record RedoStoryMusicRequest
{
    [StringLength(MusicStage.MaxPromptChars, ErrorMessage = "The music brief can be up to 1500 characters.")]
    public string? Prompt { get; init; }

    [StringLength(80)] public string? Style { get; init; }
    public StoryMusicSource? Source { get; init; }
    [Range(0.0, 1.0)] public double? Volume { get; init; }
    public bool Off { get; init; }

    public StoryMusicRedo ToRedo() => new(Prompt, Style, Source, Volume, Off);
}

public sealed record EditStorySceneLookRequest
{
    public int Number { get; init; }

    /// <summary>A <c>BackgroundEffect</c> name, e.g. <c>ZoomIn</c>.</summary>
    [StringLength(32)] public string? Effect { get; init; }

    /// <summary>A <c>SceneTransition</c> name, e.g. <c>Fade</c>.</summary>
    [StringLength(32)] public string? Transition { get; init; }

    [Range(0.2, 1.5)] public double? TransitionSeconds { get; init; }

    /// <summary>Hand the scene back to the automatic choice.</summary>
    public bool Auto { get; init; }
}

/// <summary>A fresh automatic look, another style, a music level, or scenes set by hand.</summary>
public sealed record RedoStoryLookRequest
{
    public bool NewLook { get; init; }
    public StoryLookStyle? Style { get; init; }
    [Range(0.0, 1.0)] public double? MusicVolume { get; init; }

    [MaxLength(StoryScriptParser.MaxScenes)]
    public List<EditStorySceneLookRequest>? Scenes { get; init; }

    public StoryLookRedo ToRedo() => new(NewLook, Style, MusicVolume,
        [.. (Scenes ?? []).Select(s => new StorySceneLookEdit(s.Number, s.Effect, s.Transition, s.TransitionSeconds, s.Auto))]);
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

    /// <summary>The text engine to write it with. Null keeps the story's; empty hands it back to the chain.</summary>
    [StringLength(40)]
    public string? TextEngine { get; init; }
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
    [StringLength(800)] public string? VideoPrompt { get; init; }
    [MaxLength(8)] public List<string>? ImageKeywords { get; init; }
    [StringLength(30)] public string? Mood { get; init; }

    /// <summary>The scene's further pictures, in order; null keeps the ones it has.</summary>
    [MaxLength(StoryScriptParser.MaxShots)] public List<EditStoryShotRequest>? Shots { get; init; }
}

public sealed record EditStoryShotRequest
{
    /// <summary>The picture number it had (2 is the scene's first further picture), so its picture stays with it; 0 for a new one.</summary>
    public int Picture { get; init; }

    [StringLength(StoryScriptParser.MaxPromptChars)] public string? ImagePrompt { get; init; }
}

public sealed record EditStoryScriptRequest
{
    [StringLength(200)] public string? Title { get; init; }
    [StringLength(200)] public string? TitleEnglish { get; init; }
    [StringLength(600)] public string? Summary { get; init; }
    [StringLength(80)] public string? MusicQuery { get; init; }

    /// <summary>What the YouTube thumbnail shows; null keeps it, empty clears it.</summary>
    [StringLength(StoryScriptParser.MaxPromptChars)] public string? ThumbnailPrompt { get; init; }

    [MaxLength(StoryScriptParser.MaxScenes)]
    public List<EditStorySceneRequest>? Scenes { get; init; }

    public StoryScriptEdit ToEdit() => new(Title, TitleEnglish, Summary, MusicQuery,
        [.. (Scenes ?? []).Select(s => new StorySceneEdit(
            s.Number, s.Headline, s.Narration, s.English, s.Basis,
            [.. (s.Sources ?? []).Select(x => new StorySourceEdit(x.Text, x.Ref, x.Note))],
            s.ImagePrompt, s.ImageKeywords, s.Mood, s.VideoPrompt,
            s.Shots is null ? null : [.. s.Shots.Select(x => new StoryShotEdit(x.Picture, x.ImagePrompt))]))],
        ThumbnailPrompt);
}

/// <summary>Which of a story's YouTube videos gets its subtitles, and in which languages (none: every one it has).</summary>
public sealed record SendStoryCaptionsRequest
{
    [Required(ErrorMessage = "Choose the video to add the subtitles to.")]
    [RegularExpression("^[A-Za-z0-9_-]{11}$", ErrorMessage = "Choose the video to add the subtitles to.")]
    public string? VideoId { get; init; }

    [MaxLength(StoryCaptionPublisher.MaxLanguages)]
    public List<string>? Languages { get; init; }
}

// ------------------------------------------------------------------------------------------------ responses

public sealed record StoryPackResponse(string Id, string Title, string TitleEnglish, string Description, string Language, int TargetSeconds, string GenreId);

/// <summary>A genre as the new-story form offers it: what it is, and what picking it fills in.</summary>
public sealed record StoryGenreOptionResponse(
    string Id, string Name, string? NameHindi, string Description, string Icon, StoryGenreMode Mode, bool MadeForKids,
    string DefaultLanguage, int DefaultTargetSeconds, StoryFormat DefaultFormat, StoryLookStyle LookStyle,
    string? ImageStyle, string? MusicQuery, string? SpeechStyle,
    IReadOnlyList<StoryTopicSummaryResponse> Topics);

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
    IReadOnlyList<MyVoiceResponse> MyVoices,
    bool MusicComposer = false,
    IReadOnlyList<StoryGenreOptionResponse>? Genres = null,
    IReadOnlyList<StoryTextEngineResponse>? TextEngines = null);

/// <summary>A text engine that is on and ready, offered as "who writes the script".</summary>
public sealed record StoryTextEngineResponse(string Id, string Name, bool RunsLocally);

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
    double? AudioSeconds,
    IReadOnlyList<StoryLineResponse> Lines,
    string? VideoPrompt = null,
    bool HasVideo = false,
    string? VideoName = null,
    int AudioTake = 0,
    string? Effect = null,
    string? Transition = null,
    double? TransitionSeconds = null,
    bool LookPinned = false,
    string? AnimationPrompt = null,
    bool Speaks = false,
    IReadOnlyList<StoryShotResponse>? Shots = null);

/// <summary>One of a scene's further pictures. <paramref name="Picture"/> counts the scene's own picture as 1.</summary>
public sealed record StoryShotResponse(int Picture, string? ImagePrompt, bool HasImage, string? ImageSource, string? ImageName);

/// <summary>Part of a scene's narration and who says it: <c>narrator</c> or a member of the cast.</summary>
public sealed record StoryLineResponse(string Speaker, string Text);

/// <param name="VoiceId">The voice they were given when the narration was last made; null before that.</param>
public sealed record StoryCastMemberResponse(string Name, string? Gender, string? Age, string? VoiceId);

public sealed record StoryScriptResponse(
    string Title,
    string? TitleEnglish,
    string Language,
    string? Summary,
    string? MusicQuery,
    IReadOnlyList<StorySceneResponse> Scenes,
    IReadOnlyList<string> ReviewNotes,
    string? WrittenBy,
    double EstimatedSeconds,
    IReadOnlyList<StoryCastMemberResponse> Cast,
    string? ThumbnailPrompt = null,
    bool HasThumbnail = false,
    string? ThumbnailSource = null,
    string? ThumbnailName = null);

public sealed record StoryTopicResponse(string TopicId, string Name, string? Summary, IReadOnlyList<StorySourceResponse> Sources);

public sealed record StoryPassageResponse(
    string TextId, string TextName, string Ref, string Title, string Language, string Url, string Excerpt, bool Direct, string License);

public sealed record StoryResearchResponse(
    IReadOnlyList<StoryTopicResponse> Topics,
    IReadOnlyList<StoryPassageResponse> Passages,
    IReadOnlyList<string> Queries,
    IReadOnlyList<string> Warnings,
    DateTime RetrievedAtUtc);

/// <param name="Source"><c>composed</c> (Google Lyria), <c>upload</c> (the person's own) or <c>catalogue</c>.</param>
/// <param name="Prompt">For a composed track, the brief it was composed from.</param>
public sealed record StoryMusicResponse(
    string Title, string Artist, string? PageUrl, string LicenseCode, string? LicenseUrl, string Attribution,
    string Source = "catalogue", string? Prompt = null, int? Seconds = null);

/// <summary>
/// What the composer would be asked for now, and how long the track should be: to read before composing, to edit, or to
/// paste into Google's own music tool when Lyria is not set up here.
/// </summary>
public sealed record StoryMusicBriefResponse(string Prompt, int Seconds);

/// <param name="Speed">The speed the video plays at (1 is the pace it was built at); its subtitles and chapters are timed to it.</param>
/// <param name="Seconds">How long the video runs at that speed.</param>
public sealed record StoryRenderResponse(
    string JobId, RenderJobStatus Status, int Progress, string? Message, bool Downloadable, double Speed = 1.0, double Seconds = 0);

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
    string Title, string? Notes, string Language, int TargetSeconds, StoryFormat Format, StoryWriterMode Writer, string? PackId,
    string GenreId = StoryGenres.DefaultId, string? GenreName = null, StoryGenreMode Mode = StoryGenreMode.Scripture,
    StoryVoicing Voicing = StoryVoicing.Narrated, string? TextEngine = null, string? BrandChannelId = null);

public sealed record StoryOptionsResponse(
    StoryNarrationMode Narration, string? VoiceProfileId, string? VoiceId, string? SpeechEngine, double SpeechRate, bool ClosestToMyVoice,
    StoryVisualMode Visuals, string? ImageStyle, bool Music, bool UploadsAreAiMade, string? MusicQuery, double MusicVolume,
    bool RenderWhenReady, bool AutoApprove, string? SpeechModel = null, string? SpeechStyle = null, bool CastVoices = true,
    StoryMusicSource MusicSource = StoryMusicSource.Auto, string? MusicPrompt = null, StoryLookStyle LookStyle = StoryLookStyle.Auto,
    double VideoSpeed = 1.0, bool AutoPace = false, StoryArtStyle ArtStyle = StoryArtStyle.Auto,
    StoryPaceStyle Pace = StoryPaceStyle.Auto);

/// <summary>A subtitle track the story can offer as an SRT file, and send to YouTube.</summary>
public sealed record StorySubtitleResponse(string Language, string Label, string Source, int Cues);

/// <summary>A YouTube video made from the story's project.</summary>
/// <param name="CurrentRender">It is the story's latest render, not an earlier build of it.</param>
/// <param name="Captions">The subtitle languages added to it from the Story Agent.</param>
public sealed record StoryPublicationResponse(
    string VideoId,
    string ChannelTitle,
    string Title,
    string Privacy,
    string? PrivacyStatus,
    DateTime PublishedAtUtc,
    DateTime? PublishAtUtc,
    string Health,
    string? IssueMessage,
    string VideoUrl,
    string StudioUrl,
    string? ThumbnailUrl,
    bool CanCaption,
    bool CurrentRender,
    IReadOnlyList<string> Captions);

public sealed record StoryCaptionResultResponse(string Language, string Label, string Outcome, string? Message);

public sealed record StoryCaptionsSentResponse(StoryRunResponse Run, IReadOnlyList<StoryCaptionResultResponse> Results);

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
    DateTime UpdatedAtUtc,
    DateTime? ScriptApprovedAtUtc,
    IReadOnlyList<StorySubtitleResponse> Subtitles,
    IReadOnlyList<StoryPublicationResponse> Publications,
    string? Review = null,
    DateTime? VoiceApprovedAtUtc = null,
    DateTime? MusicApprovedAtUtc = null,
    DateTime? VideoApprovedAtUtc = null,
    StoryMusicBriefResponse? MusicBrief = null,
    StorySeriesLinkResponse? Series = null,
    IReadOnlyList<StoryNextPartIdeaResponse>? NextParts = null,
    string? NextPartsBy = null,
    string? NextRunId = null,
    StoryPaceResponse? Pace = null);

/// <summary>A run in the list and on the storyboard: enough to draw a card, place it in its column and open it.</summary>
/// <param name="CoverScene">The first scene with a picture of its own, for the card; null when there is none yet.</param>
/// <param name="Publication">The newest YouTube video made from the story, if any.</param>
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
    DateTime UpdatedAtUtc,
    string Language,
    StoryFormat Format,
    int SceneCount,
    double DurationSeconds,
    DateTime? ScriptApprovedAtUtc,
    bool HasRender,
    int? CoverScene,
    int PublicationCount,
    StoryPublicationResponse? Publication,
    string? SeriesId = null,
    string? SeriesName = null,
    int? Part = null);

public sealed record StoryPromptResponse(string Prompt);

/// <param name="PreviousRunId">The part this one continues; null for Part 1.</param>
/// <param name="AutoContinueTo">The part the series goes on to by itself; null when it does not.</param>
public sealed record StorySeriesLinkResponse(string Id, string Name, int Part, string? PreviousRunId, int? AutoContinueTo, bool HasStorySoFar);

public sealed record StoryNextPartIdeaResponse(string Title, string Notes, string? Hook);

/// <param name="Verdict"><c>slow</c>, <c>good</c> or <c>fast</c>.</param>
/// <param name="Applied">The suggested speed was made the video's, because the app was choosing the pace.</param>
public sealed record StoryPaceResponse(double WordsPerMinute, double TargetWordsPerMinute, double SuggestedSpeed, string Verdict, bool Applied);

/// <summary>A series and its parts, in order, each as it appears on the storyboard.</summary>
/// <param name="NextParts">Ideas for the part after the latest one, if any were asked for.</param>
public sealed record StorySeriesResponse(
    string Id,
    string Name,
    IReadOnlyList<StoryRunSummaryResponse> Parts,
    string LatestRunId,
    int? AutoContinueTo,
    IReadOnlyList<StoryNextPartIdeaResponse> NextParts,
    string? NextPartsBy,
    DateTime UpdatedAtUtc);

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
        [.. caps.Packs.Select(p => new StoryPackResponse(p.Id, p.Title, p.TitleEnglish, p.Description, p.Language, p.TargetSeconds, p.GenreId))],
        [.. GranthTopics.All.Select(t => new StoryTopicSummaryResponse(t.Id, t.Name, t.Hindi, t.Summary))],
        [.. caps.MyVoices.Select(Controllers.MyVoicesController.ToResponse)],
        caps.MusicComposer,
        [.. (caps.Genres ?? StoryGenres.All()).Select(ToOption)],
        [.. (caps.TextEngines ?? []).Select(e => new StoryTextEngineResponse(e.Id, e.Name, e.RunsLocally))]);

    public static StoryGenreOptionResponse ToOption(StoryGenre g) => new(
        g.Id, g.Name, g.NameHindi, g.Description, g.Icon, g.Mode, g.MadeForKids,
        g.DefaultLanguage, g.DefaultTargetSeconds, g.DefaultFormat, g.LookStyle, g.ImageStyle, g.MusicQuery, g.SpeechStyle,
        [.. g.Topics.Select(t => new StoryTopicSummaryResponse(t.Id, t.Name, t.Hindi ?? t.Name, t.Summary))]);

    public static StoryRunSummaryResponse ToSummary(StoryRun run) => ToSummary(run, []);

    /// <param name="publications">The person's uploads of this run's project, newest first.</param>
    public static StoryRunSummaryResponse ToSummary(StoryRun run, IReadOnlyList<StoryPublication> publications)
    {
        WithoutRetiredStages(run);
        var running = run.Stages.FirstOrDefault(s => s.Status == StoryStageStatus.Running);
        var message = run.Status switch
        {
            StoryRunStatus.Failed => run.ErrorMessage,
            StoryRunStatus.Cancelled => "Stopped.",
            StoryRunStatus.Completed => "Done.",
            StoryRunStatus.ScriptReady => "Script ready to read.",
            StoryRunStatus.AwaitingScript => "Waiting for the script.",
            StoryRunStatus.AwaitingReview => run.Review switch
            {
                StoryStageIds.Narration => "Listen to the voice and approve it.",
                StoryStageIds.Music => "Listen to the music and approve it.",
                _ => "Watch the video and approve it."
            },
            _ => running?.Message
        };

        var scenes = run.Script?.Scenes ?? [];
        var cover = scenes.FirstOrDefault(s => StoryObjectKeys.Owns(run.Id, s.ImageKey) && s.ImageSource is not "placeholder");
        var latest = publications.Count == 0 ? null : publications.MaxBy(p => p.PublishedAtUtc);

        return new(run.Id, run.Title, run.Status, run.IsWorking, Overall(run), message, !string.IsNullOrEmpty(run.ProjectId),
            run.Kit is not null, run.CreatedAtUtc, run.UpdatedAtUtc,
            run.Brief.Language, run.Brief.Format, scenes.Count,
            run.TotalSeconds > 0 ? run.TotalSeconds : Math.Round(scenes.Sum(x => x.AudioSeconds is > 0 ? x.AudioSeconds.Value : x.EstimatedSeconds), 1),
            run.ScriptApprovedAtUtc, !string.IsNullOrEmpty(run.RenderJobId), cover?.Number,
            publications.Count, latest is null ? null : ToResponse(run, latest),
            run.Series?.Id, run.Series?.Name, run.Series?.Part);
    }

    public static StoryRunResponse ToResponse(StoryRun run, RenderJob? job) => ToResponse(run, job, []);

    /// <param name="publications">The person's uploads of this run's project.</param>
    public static StoryRunResponse ToResponse(StoryRun run, RenderJob? job, IReadOnlyList<StoryPublication> publications) =>
        ToResponseWithAllStages(WithAllStages(run), job, publications);

    /// <summary>A run saved before a step existed is shown with it, so the timeline always has every step.</summary>
    private static StoryRun WithAllStages(StoryRun run)
    {
        WithoutRetiredStages(run);
        foreach (var id in StoryStageIds.All) run.Stage(id);
        return run;
    }

    /// <summary>A run saved while a step existed that has since been removed (scene animation) is shown without it.</summary>
    private static void WithoutRetiredStages(StoryRun run) => run.Stages.RemoveAll(s => !StoryStageIds.All.Contains(s.Id));

    private static StoryRunResponse ToResponseWithAllStages(StoryRun run, RenderJob? job, IReadOnlyList<StoryPublication> publications) => new(
        run.Id,
        run.Title,
        new StoryBriefResponse(run.Brief.Title, run.Brief.Notes, run.Brief.Language, run.Brief.TargetSeconds, run.Brief.Format, run.Brief.Writer, run.Brief.PackId,
            run.Brief.GenreId ?? StoryGenres.DefaultId, StoryGenres.Of(run).Name, run.Brief.Mode, run.Brief.Voicing, run.Brief.TextEngine,
            run.Brief.BrandChannelId ?? BrandChannel.DefaultId),
        ToResponse(run.Options),
        run.Status,
        run.IsWorking,
        [.. run.Stages.Select(s => new StoryStageResponse(s.Id, s.Status, s.Progress, s.Message, s.Code, s.StartedAtUtc, s.CompletedAtUtc))],
        run.Research is null ? null : ToResponse(run.Research),
        run.Script is null ? null : ToResponse(run, run.Script),
        run.Warnings,
        run.ScriptWarnings,
        run.ProjectId,
        job is null ? null : new StoryRenderResponse(job.Id, job.Status, job.Progress,
            job.Status == RenderJobStatus.Failed ? job.ErrorMessage ?? job.Message : job.Message,
            (job.Status is RenderJobStatus.Completed or RenderJobStatus.CompletedWithWarnings) && !string.IsNullOrEmpty(job.OutputStorageKey),
            run.TimingSpeed > 0 ? run.TimingSpeed : 1.0, run.TotalSeconds),
        run.Kit is null ? null : ToResponse(run.Kit),
        run.Music is null ? null : ToResponse(run.Music),
        run.ErrorCode,
        run.ErrorMessage,
        run.CreatedAtUtc,
        run.UpdatedAtUtc,
        run.ScriptApprovedAtUtc,
        [.. StoryCaptions.Tracks(run).Select(t => new StorySubtitleResponse(t.Language, t.Label, t.Source, t.Cues))],
        [.. publications.OrderByDescending(p => p.PublishedAtUtc).Select(p => ToResponse(run, p))],
        run.Status == StoryRunStatus.AwaitingReview ? run.Review : null,
        run.VoiceApprovedAtUtc,
        run.MusicApprovedAtUtc,
        run.VideoApprovedAtUtc,
        run.Script is null ? null : MusicBrief(run, run.Script),
        run.Series is null ? null : ToResponse(run.Series),
        [.. run.NextParts.Select(ToResponse)],
        run.NextPartsBy,
        run.NextRunId,
        run.Pace is null ? null : new StoryPaceResponse(run.Pace.WordsPerMinute, run.Pace.TargetWordsPerMinute,
            run.Pace.SuggestedSpeed, run.Pace.Verdict, run.Pace.Applied));

    private static StorySeriesLinkResponse ToResponse(StorySeriesLink s) =>
        new(s.Id, s.Name, s.Part, s.PreviousRunId, s.AutoContinueTo, !string.IsNullOrWhiteSpace(s.StorySoFar));

    private static StoryNextPartIdeaResponse ToResponse(StoryNextPartIdea i) => new(i.Title, i.Notes, i.Hook);

    /// <param name="publications">The person's uploads, matched to each part by its project.</param>
    public static StorySeriesResponse ToResponse(StorySeries series, Func<StoryRun, IReadOnlyList<StoryPublication>> publications)
    {
        var latest = series.Latest;
        return new StorySeriesResponse(
            series.Id,
            series.Name,
            [.. series.Parts.Select(p => ToSummary(p, publications(p)))],
            latest.Id,
            latest.Series?.AutoContinueTo,
            [.. latest.NextParts.Select(ToResponse)],
            latest.NextPartsBy,
            series.Parts.Max(p => p.UpdatedAtUtc));
    }

    private static StoryMusicResponse ToResponse(StoryMusicPick m) => new(
        m.Title, m.Artist, m.PageUrl, m.LicenseCode, m.LicenseUrl, m.Attribution,
        m.Provider switch
        {
            MusicStage.ComposedProvider => "composed",
            MusicStage.UploadedProvider => "upload",
            _ => "catalogue"
        },
        m.Prompt, m.Seconds);

    private static StoryMusicBriefResponse MusicBrief(StoryRun run, StoryScript script)
    {
        // Without the take note: that is for the composer, not something the person should copy elsewhere.
        var (prompt, seconds) = MusicStage.Brief(run, script, forComposer: false);
        return new StoryMusicBriefResponse(prompt, seconds);
    }

    public static StoryCaptionResultResponse ToResponse(StoryCaptionResult r) => new(r.Language, r.Label, r.Outcome, r.Message);

    private static StoryPublicationResponse ToResponse(StoryRun run, StoryPublication p) => new(
        p.VideoId, p.ChannelTitle, p.Title, p.Privacy, p.PrivacyStatus, p.PublishedAtUtc, p.PublishAtUtc, p.Health, p.IssueMessage,
        p.VideoUrl, p.StudioUrl, p.ThumbnailUrl, p.CanCaption,
        !string.IsNullOrEmpty(run.RenderJobId) && string.Equals(p.JobId, run.RenderJobId, StringComparison.Ordinal),
        [.. run.CaptionUploads.Where(c => c.VideoId == p.VideoId).Select(c => c.Language).Distinct()]);

    private static StoryOptionsResponse ToResponse(StoryBuildOptions o) => new(
        o.Narration, o.VoiceProfileId, o.VoiceId, o.SpeechEngine, o.SpeechRate, o.ClosestToMyVoice, o.Visuals, o.ImageStyle,
        o.Music, o.UploadsAreAiMade, o.MusicQuery, o.MusicVolume, o.RenderWhenReady, o.AutoApprove, o.SpeechModel, o.SpeechStyle, o.CastVoices, o.MusicSource,
        o.MusicPrompt, o.LookStyle, o.VideoSpeed, o.AutoPace, o.ArtStyle, o.Pace);

    private static StoryResearchResponse ToResponse(StoryResearch r) => new(
        [.. r.Topics.Select(t => new StoryTopicResponse(t.TopicId, t.Name, t.Summary, [.. t.Sources.Select(ToResponse)]))],
        [.. r.Passages.Select(p => new StoryPassageResponse(p.TextId, p.TextName, p.Ref, p.Title, p.Language, p.Url,
            p.Excerpt.Length <= ExcerptChars ? p.Excerpt : p.Excerpt[..ExcerptChars].TrimEnd() + "...", p.Direct, p.License))],
        r.Queries, r.Warnings, r.RetrievedAtUtc);

    private static StoryScriptResponse ToResponse(StoryRun run, StoryScript s) => ToResponse(run, run.Id, s);

    private static StoryScriptResponse ToResponse(StoryRun run, string runId, StoryScript s) => new(
        s.Title, s.TitleEnglish, s.Language, s.Summary, s.MusicQuery,
        [.. s.Scenes.Select(scene => new StorySceneResponse(
            scene.Number, scene.Headline, scene.Narration, scene.English, scene.Basis,
            [.. scene.Sources.Select(ToResponse)],
            scene.ImagePrompt, scene.ImageKeywords, scene.Mood, scene.EstimatedSeconds,
            StoryObjectKeys.Owns(runId, scene.ImageKey), scene.ImageSource, scene.ImageName,
            StoryObjectKeys.Owns(runId, scene.AudioKey), scene.AudioSeconds,
            [.. scene.Lines.Select(l => new StoryLineResponse(l.Speaker, l.Text))],
            scene.VideoPrompt, StoryObjectKeys.Owns(runId, scene.VideoKey) && scene.HasAttachedClip, scene.VideoName,
            scene.AudioTake, scene.Effect, scene.Transition, scene.TransitionSeconds, scene.LookPinned,
            StoryAnimation.Prompt(run, scene), StoryAnimation.HasSpeech(scene),
            [.. scene.Shots.Select((shot, i) => new StoryShotResponse(
                i + 2, shot.ImagePrompt, StoryObjectKeys.Owns(runId, shot.ImageKey), shot.ImageSource, shot.ImageName))]))],
        s.ReviewNotes, s.WrittenBy, Math.Round(s.Scenes.Sum(x => x.AudioSeconds is > 0 ? x.AudioSeconds.Value : x.EstimatedSeconds), 1),
        [.. s.Cast.Select(c => new StoryCastMemberResponse(c.Name, c.Gender, c.Age, c.VoiceId))],
        s.ThumbnailPrompt, StoryObjectKeys.Owns(runId, s.ThumbnailKey), s.ThumbnailSource, s.ThumbnailName);

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
