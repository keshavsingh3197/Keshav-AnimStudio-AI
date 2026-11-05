namespace AnimStudio.Domain.Stories;

/// <summary>Where a Story Agent run is. Terminal states are <see cref="Completed"/>, <see cref="Failed"/> and <see cref="Cancelled"/>.</summary>
public enum StoryRunStatus
{
    /// <summary>Searching the Granths for what the title is about.</summary>
    Researching = 0,

    /// <summary>The text model is writing the script from what was found.</summary>
    WritingScript = 1,

    /// <summary>Manual writer: the prompt is ready and the run waits for the reply to be pasted back.</summary>
    AwaitingScript = 2,

    /// <summary>A script exists and is waiting for the user to read it and press Build.</summary>
    ScriptReady = 3,

    /// <summary>Pictures, narration, music, the project and the render are being made.</summary>
    Building = 4,

    Completed = 5,
    Failed = 6,
    Cancelled = 7,

    /// <summary>
    /// The build stopped for the person to check what a step made - the voice, the music or the video - before it goes on.
    /// <see cref="StoryRun.Review"/> says which.
    /// </summary>
    AwaitingReview = 8
}

public enum StoryStageStatus { Pending = 0, Running = 1, Completed = 2, Skipped = 3, Failed = 4 }

/// <summary>The stages of a run, in the order they happen. Ids are what the browser and the logs see.</summary>
public static class StoryStageIds
{
    public const string Research = "research";
    public const string Script = "script";
    public const string Visuals = "visuals";
    public const string Narration = "narration";
    public const string Music = "music";
    public const string Assemble = "assemble";
    public const string Render = "render";
    public const string Kit = "kit";

    public static readonly IReadOnlyList<string> All =
        [Research, Script, Visuals, Narration, Music, Assemble, Render, Kit];

    /// <summary>The stages that run before the user is asked to approve the script.</summary>
    public static readonly IReadOnlyList<string> Planning = [Research, Script];

    /// <summary>The stages that run after the user presses Build.</summary>
    public static readonly IReadOnlyList<string> Building = [Visuals, Narration, Music, Assemble, Render, Kit];

    /// <summary>The stages whose result the person hears or watches and approves before the build goes on.</summary>
    public static readonly IReadOnlyList<string> Reviewed = [Narration, Music, Render];
}

/// <summary>One stage of a run: what it is doing, how far it has got, and why it stopped if it did.</summary>
public sealed class StoryStageState
{
    public string Id { get; set; } = string.Empty;
    public StoryStageStatus Status { get; set; } = StoryStageStatus.Pending;

    /// <summary>0-100 within this stage.</summary>
    public int Progress { get; set; }

    /// <summary>A sentence for the person watching: "Narrating scene 4 of 12".</summary>
    public string? Message { get; set; }

    /// <summary>A short machine code when the stage failed or was skipped, e.g. <c>no-speech-engine</c>.</summary>
    public string? Code { get; set; }

    public DateTime? StartedAtUtc { get; set; }
    public DateTime? CompletedAtUtc { get; set; }
}

/// <summary>
/// One title turned into a video: the brief, what was found in the Granths, the script, the
/// build choices, and the project it became. Stored as one document so a run can be reopened,
/// resumed after a restart, or retried from the stage that failed.
/// </summary>
/// <remarks>
/// A run never publishes anything. It ends with a project, a render and a publish kit; putting
/// the video on YouTube stays a decision the person makes after reading the script.
/// </remarks>
public sealed class StoryRun
{
    public string Id { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;
    public StoryBrief Brief { get; set; } = new();
    public StoryBuildOptions Options { get; set; } = new();

    /// <summary>
    /// The genre as it was when the run started: the prompt, the topics, the tags and links all come from this copy, so
    /// editing the genre later does not change a story already under way. Null on runs from before genres.
    /// </summary>
    public StoryGenre? Genre { get; set; }

    public StoryRunStatus Status { get; set; } = StoryRunStatus.Researching;
    public List<StoryStageState> Stages { get; set; } = [];

    public StoryResearch? Research { get; set; }
    public StoryScript? Script { get; set; }

    /// <summary>
    /// The script an imported story file brought, as JSON in the shape a chat's reply has. The script stage reads it once
    /// the research is in - with the same parser and checks as a pasted reply - and clears it.
    /// </summary>
    public string? ImportedScript { get; set; }

    /// <summary>How many times the script has been rewritten. A rewrite asks the model afresh instead of reusing its cached answer.</summary>
    public int ScriptRevision { get; set; }

    /// <summary>
    /// When the person said "go with this script". Any change to the words clears it, so an approval always means the
    /// script as it now reads. Pressing Build approves it too.
    /// </summary>
    public DateTime? ScriptApprovedAtUtc { get; set; }

    /// <summary>While <see cref="Status"/> is <see cref="StoryRunStatus.AwaitingReview"/>: the stage waiting to be approved.</summary>
    public string? Review { get; set; }

    /// <summary>When the person approved the voice. Remaking any of it takes the approval back.</summary>
    public DateTime? VoiceApprovedAtUtc { get; set; }

    /// <summary>When the person approved the background music (or having none).</summary>
    public DateTime? MusicApprovedAtUtc { get; set; }

    /// <summary>When the person approved the rendered video, its effects and transitions.</summary>
    public DateTime? VideoApprovedAtUtc { get; set; }

    /// <summary>How many times the music was asked for again, so a new take is asked for a different arrangement.</summary>
    public int MusicTake { get; set; }

    /// <summary>How many times a new look was asked for; varies the effects and transitions chosen automatically.</summary>
    public int LookTake { get; set; }

    /// <summary>The subtitle tracks sent to YouTube, so the same language is not added to the same video twice.</summary>
    public List<StoryCaptionUpload> CaptionUploads { get; set; } = [];

    /// <summary>The project the build made. Set as soon as it exists so a retry can replace it rather than add a second.</summary>
    public string? ProjectId { get; set; }

    /// <summary>Where each scene starts on the finished video, in seconds. Set when the project is built; the kit's chapters come from it.</summary>
    public List<double> SceneStarts { get; set; } = [];

    /// <summary>How long the finished video runs, in seconds.</summary>
    public double TotalSeconds { get; set; }

    /// <summary>
    /// The story's video: what is watched, downloaded and sent to YouTube. The project's own render, or the copy of it at
    /// <see cref="StoryBuildOptions.VideoSpeed"/> when the speed is not 1.
    /// </summary>
    public string? RenderJobId { get; set; }

    /// <summary>
    /// The project's own render, at the pace it was built. Kept when only the speed changes so a new speed is a quick copy
    /// of it instead of a whole new render. Null on runs from before speeds existed (their <see cref="RenderJobId"/> is it).
    /// </summary>
    public string? SourceRenderJobId { get; set; }

    /// <summary>
    /// The speed <see cref="SceneStarts"/> and <see cref="TotalSeconds"/> are measured at: 1 when the project is built,
    /// the video's speed once the copy at that speed exists. Narration lengths and pauses are always at 1.
    /// </summary>
    public double TimingSpeed { get; set; } = 1.0;

    public StoryPublishKit? Kit { get; set; }

    /// <summary>The series this run is a part of; null for a story nobody has continued.</summary>
    public StorySeriesLink? Series { get; set; }

    /// <summary>
    /// Ideas for the part after this one. Kept once suggested, so opening the story again costs no model call; asked for
    /// afresh only when the person wants new ones.
    /// </summary>
    public List<StoryNextPartIdea> NextParts { get; set; } = [];

    /// <summary>The text engine that suggested <see cref="NextParts"/>, or <c>built-in</c> when they were worked out here.</summary>
    public string? NextPartsBy { get; set; }

    /// <summary>The part started from this one, so it is not continued twice by accident.</summary>
    public string? NextRunId { get; set; }

    /// <summary>How fast the narration came out, once it exists.</summary>
    public StoryPace? Pace { get; set; }

    /// <summary>The background track chosen for the video, kept so a retry does not download another.</summary>
    public StoryMusicPick? Music { get; set; }

    /// <summary>Things worth a second look, from every stage. Shown next to the script, never hidden.</summary>
    public List<string> Warnings { get; set; } = [];

    /// <summary>
    /// What checking the script found: a citation that cannot exist, a number the voice would misread. Kept apart from
    /// <see cref="Warnings"/> because it is worked out again, in full, every time the script is pasted or edited.
    /// </summary>
    public List<string> ScriptWarnings { get; set; } = [];

    public string? ErrorCode { get; set; }
    public string? ErrorMessage { get; set; }

    /// <summary>Set by the cancel endpoint and read back by the stage that is running.</summary>
    public bool CancelRequested { get; set; }

    public DateTime CreatedAtUtc { get; set; }
    public DateTime UpdatedAtUtc { get; set; }

    public bool IsTerminal => Status is StoryRunStatus.Completed or StoryRunStatus.Failed or StoryRunStatus.Cancelled;

    /// <summary>The statuses in which a worker has something to do for the run.</summary>
    public static readonly StoryRunStatus[] WorkingStatuses =
        [StoryRunStatus.Researching, StoryRunStatus.WritingScript, StoryRunStatus.Building];

    /// <summary>True while a worker is researching, writing or building for this run.</summary>
    public bool IsWorking => Array.IndexOf(WorkingStatuses, Status) >= 0;

    /// <summary>When the result of a reviewed stage was approved; null when it was not, or the stage is not reviewed.</summary>
    public DateTime? ApprovedAt(string stageId) => stageId switch
    {
        StoryStageIds.Narration => VoiceApprovedAtUtc,
        StoryStageIds.Music => MusicApprovedAtUtc,
        StoryStageIds.Render => VideoApprovedAtUtc,
        _ => null
    };

    public void SetApproval(string stageId, DateTime? at)
    {
        switch (stageId)
        {
            case StoryStageIds.Narration: VoiceApprovedAtUtc = at; break;
            case StoryStageIds.Music: MusicApprovedAtUtc = at; break;
            case StoryStageIds.Render: VideoApprovedAtUtc = at; break;
        }
    }

    /// <remarks>
    /// A run saved before a stage existed gets it here, in its place: pending when nothing after it has happened yet,
    /// otherwise skipped, so a finished story does not suddenly look unfinished.
    /// </remarks>
    public StoryStageState Stage(string id)
    {
        var found = Stages.FirstOrDefault(s => string.Equals(s.Id, id, StringComparison.Ordinal));
        if (found is not null) return found;

        var order = StoryStageIds.All.ToList();
        var position = order.IndexOf(id);
        if (position < 0) throw new InvalidOperationException($"The run has no '{id}' stage.");

        var later = Stages.Where(s => order.IndexOf(s.Id) > position).ToList();
        var state = new StoryStageState
        {
            Id = id,
            Status = later.Any(s => s.Status != StoryStageStatus.Pending) ? StoryStageStatus.Skipped : StoryStageStatus.Pending,
            Progress = 0
        };

        var before = later.Count == 0 ? Stages.Count : Stages.IndexOf(later[0]);
        Stages.Insert(before, state);
        return state;
    }

    /// <summary>A run starts with every stage pending, so a client can draw the whole timeline at once.</summary>
    public static List<StoryStageState> NewStages() =>
        [.. StoryStageIds.All.Select(id => new StoryStageState { Id = id })];
}

/// <summary>One subtitle track added to a YouTube video made from the run.</summary>
public sealed class StoryCaptionUpload
{
    public string VideoId { get; set; } = string.Empty;

    /// <summary>The track's language, e.g. <c>hi</c> or <c>en</c>.</summary>
    public string Language { get; set; } = string.Empty;

    /// <summary>YouTube's id for the caption track.</summary>
    public string CaptionId { get; set; } = string.Empty;

    public DateTime UploadedAtUtc { get; set; }
}

/// <summary>The background track picked for a run, with the credit its licence asks for.</summary>
public sealed class StoryMusicPick
{
    public string Provider { get; set; } = string.Empty;
    public string TrackId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Artist { get; set; } = string.Empty;
    public string? PageUrl { get; set; }
    public string LicenseCode { get; set; } = string.Empty;
    public string? LicenseUrl { get; set; }

    /// <summary>The licence class as <c>LicenseClass</c> text, so this document needs no reference to the asset types.</summary>
    public string LicenseClass { get; set; } = "Unknown";

    public string Attribution { get; set; } = string.Empty;

    /// <summary>Object-store key of the track (MP3, or WAV for a composed or uploaded one) under the run's folder.</summary>
    public string StorageKey { get; set; } = string.Empty;

    /// <summary><c>audio/mpeg</c> or <c>audio/wav</c>.</summary>
    public string ContentType { get; set; } = "audio/mpeg";

    /// <summary>For a composed track: the brief the composer was given, so the person can read it, change it and ask again.</summary>
    public string? Prompt { get; set; }

    /// <summary>For a composed track: the length it was asked for, in seconds.</summary>
    public int? Seconds { get; set; }
}
