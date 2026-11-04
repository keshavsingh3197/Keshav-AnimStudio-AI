using System.Text.RegularExpressions;
using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Abstractions.Music;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Abstractions.Rendering;
using AnimStudio.Application.Abstractions.Storage;
using AnimStudio.Application.Abstractions.StoryAgent;
using AnimStudio.Application.Ai;
using AnimStudio.Application.StoryAgent.Stages;
using AnimStudio.Application.Voices;
using AnimStudio.Domain.Rendering;
using AnimStudio.Domain.Stories;
using AnimStudio.Domain.Voices;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AnimStudio.Application.StoryAgent;

public enum StoryRunErrorKind { Invalid = 0, NotFound = 1, Conflict = 2, Limit = 3, Unavailable = 4 }

/// <summary>A request the Story Agent refused, with a stable code and a message written for the person. The API maps the kind to a status.</summary>
public sealed class StoryRunException(StoryRunErrorKind kind, string code, string message, string? field = null) : Exception(message)
{
    public StoryRunErrorKind Kind { get; } = kind;
    public string Code { get; } = code;
    public string? Field { get; } = field;
}

public sealed record StorySourceEdit(string? Text, string? Ref, string? Note);

public sealed record StorySceneEdit(
    int Number,
    string? Headline,
    string? Narration,
    string? English,
    string? Basis,
    IReadOnlyList<StorySourceEdit>? Sources,
    string? ImagePrompt,
    IReadOnlyList<string>? ImageKeywords,
    string? Mood,
    string? VideoPrompt = null);

/// <summary>
/// Make the narration again. <paramref name="Scenes"/> are retaken as they are (a new take of the same words); a changed
/// voice, delivery or speed speaks every scene again. Nulls keep what the run has.
/// </summary>
public sealed record StoryVoiceRedo(
    IReadOnlyList<int>? Scenes,
    string? VoiceId = null,
    string? SpeechStyle = null,
    double? SpeechRate = null,
    bool? CastVoices = null);

/// <summary>Make the background music again: from a new brief or style, from another source, or none at all. Nulls keep what the run has.</summary>
public sealed record StoryMusicRedo(
    string? Prompt = null,
    string? Style = null,
    StoryMusicSource? Source = null,
    double? Volume = null,
    bool Off = false);

/// <summary>One scene's effect and transition as the person set them; <paramref name="Auto"/> hands it back to the automatic choice.</summary>
public sealed record StorySceneLookEdit(int Number, string? Effect, string? Transition, double? TransitionSeconds, bool Auto = false);

/// <summary>Build the video again with a different look: a fresh automatic pick, another style, or scenes set by hand.</summary>
public sealed record StoryLookRedo(
    bool NewLook,
    StoryLookStyle? Style = null,
    double? MusicVolume = null,
    IReadOnlyList<StorySceneLookEdit>? Scenes = null);

/// <summary>The script as the person edited it. Scenes carry the number they had, so what was made for them can be kept; files are never named by the client.</summary>
public sealed record StoryScriptEdit(
    string? Title,
    string? TitleEnglish,
    string? Summary,
    string? MusicQuery,
    IReadOnlyList<StorySceneEdit>? Scenes);

/// <summary>What the page needs to know to offer the right choices.</summary>
public sealed record StoryAgentCapabilities(
    bool Enabled,
    bool TextModel,
    bool SpeechEngine,
    bool ImageEngine,
    bool Music,
    bool Renderer,
    bool AudioFinishing,
    IReadOnlyList<StoryPack> Packs,
    IReadOnlyList<VoiceProfile> MyVoices,
    int MaxActiveRuns,
    bool MusicComposer = false);

/// <summary>
/// Everything a person can do to a Story Agent run: start one, give it a script, edit the script, attach pictures, press
/// Build, stop it, retry it, rewrite it, delete it. Each call checks the run is theirs and is in a state that allows it.
/// </summary>
/// <remarks>
/// While a worker is on a run nobody else writes it. The only calls that reach a run that might be working are
/// <see cref="CancelAsync"/> and <see cref="DeleteAsync"/>, and both first ask the worker to let go and wait for it to.
/// </remarks>
public sealed partial class StoryRunService(
    IStoryRunRepository runs,
    IStoryRunQueue queue,
    IPromptLibrary prompts,
    IObjectStore store,
    IVoiceProfileRepository voices,
    IAiProviderRegistry registry,
    IMusicCatalog music,
    IRenderCapabilities renderer,
    IStoryAudioFinisher finisher,
    IOptionsMonitor<StoryAgentOptions> options,
    TimeProvider clock,
    ILogger<StoryRunService> logger)
{
    public const int MinTitleChars = 3;
    public const int MaxTitleChars = 160;
    public const int MaxNotesChars = 2_000;
    public const int MinTargetSeconds = 45;
    public const int MaxTargetSeconds = 600;
    public const int MaxScriptReplyChars = 120_000;

    private static readonly TimeSpan StopWait = TimeSpan.FromSeconds(20);

    [GeneratedRegex(@"^vp_[0-9a-f]{32}$", RegexOptions.CultureInvariant)]
    private static partial Regex ProfileIdPattern();

    [GeneratedRegex(@"^[A-Za-z0-9_.+\-]{1,64}$", RegexOptions.CultureInvariant)]
    private static partial Regex VoiceIdPattern();

    [GeneratedRegex(@"^[A-Za-z0-9_.\-]{1,40}$", RegexOptions.CultureInvariant)]
    private static partial Regex EnginePattern();

    [GeneratedRegex(@"\s+", RegexOptions.CultureInvariant)]
    private static partial Regex Whitespace();

    // ------------------------------------------------------------------------------------------------ reading

    public async Task<StoryAgentCapabilities> DescribeAsync(string userId, CancellationToken ct) =>
        new(options.CurrentValue.Enabled,
            registry.TextChain().Count > 0,
            registry.SpeechChain().Count > 0,
            registry.ImageChain().Count > 0,
            music.IsConfigured,
            renderer.IsAvailable,
            finisher.IsAvailable,
            StoryPacks.All,
            await voices.ListByUserAsync(userId, ct).ConfigureAwait(false),
            options.CurrentValue.MaxActiveRunsPerUser,
            registry.SpeechChain().OfType<IMusicGeneratingProvider>().Any(p => p.IsConfigured));

    public async Task<IReadOnlyList<StoryRun>> ListAsync(string userId, CancellationToken ct) =>
        await runs.ListByUserAsync(userId, Math.Max(options.CurrentValue.MaxListedRuns, 1), ct).ConfigureAwait(false);

    public Task<StoryRun> GetAsync(string userId, string id, CancellationToken ct) => OwnedAsync(userId, id, ct);

    // ------------------------------------------------------------------------------------------------ starting

    public async Task<StoryRun> CreateAsync(string userId, StoryBrief brief, StoryBuildOptions? build, CancellationToken ct)
    {
        var settings = options.CurrentValue;
        if (!settings.Enabled) throw new StoryRunException(StoryRunErrorKind.NotFound, "story-agent-off", "The Story Agent is switched off on this server.");

        var checkedBrief = CheckBrief(brief);
        var checkedOptions = await CheckOptionsAsync(userId, build ?? new StoryBuildOptions(), ct).ConfigureAwait(false);

        var working = await runs.CountWorkingByUserAsync(userId, ct).ConfigureAwait(false);
        if (working >= settings.MaxActiveRunsPerUser)
        {
            throw new StoryRunException(StoryRunErrorKind.Limit, "too-many-runs",
                $"{working} of your stories are being made right now. Wait for one to finish, or stop one, then start this.");
        }

        var now = clock.GetUtcNow().UtcDateTime;
        var run = new StoryRun
        {
            Id = $"sr_{Guid.NewGuid():n}",
            UserId = userId,
            Title = checkedBrief.Title,
            Brief = checkedBrief,
            Options = checkedOptions,
            Status = StoryRunStatus.Researching,
            Stages = StoryRun.NewStages(),
            CreatedAtUtc = now,
            UpdatedAtUtc = now
        };

        await runs.UpsertAsync(run, ct).ConfigureAwait(false);
        queue.Enqueue(run.Id);
        logger.LogInformation("Story run {RunId} started for a {Writer} script.", run.Id, run.Brief.Writer);

        await PruneAsync(userId, run.Id, ct).ConfigureAwait(false);
        return run;
    }

    // ------------------------------------------------------------------------------------------------ the script

    /// <summary>The text to paste into any chat: the instructions, what the research found, and the shape of the answer.</summary>
    public async Task<string> ManualPromptAsync(string userId, string id, CancellationToken ct)
    {
        var run = await OwnedAsync(userId, id, ct).ConfigureAwait(false);
        if (run.Research is null)
            throw new StoryRunException(StoryRunErrorKind.Conflict, "research-not-ready", "The search of the Granths is still running. The prompt is ready when it finishes.");

        RenderedPrompt rendered;
        try
        {
            rendered = await prompts.RenderAsync(BuiltInPrompts.StoryScript, StoryScriptPrompt.Variables(run.Brief, run.Research), ct).ConfigureAwait(false);
        }
        catch (PromptTemplateException ex)
        {
            logger.LogError("The story-script prompt could not be rendered: {Code}", ex.Code);
            throw new StoryRunException(StoryRunErrorKind.Unavailable, "script-prompt-invalid", "The script prompt could not be prepared. If the story-script prompt template has been overridden, check it.");
        }

        return StoryScriptPrompt.ManualPrompt(rendered);
    }

    /// <summary>Takes the reply a chat wrote and reads it as the script. The same checks as a model's own reply.</summary>
    public async Task<StoryRun> SubmitScriptAsync(string userId, string id, string? reply, CancellationToken ct)
    {
        var run = await OwnedAsync(userId, id, ct).ConfigureAwait(false);
        if (run.Status is not (StoryRunStatus.AwaitingScript or StoryRunStatus.ScriptReady))
        {
            throw new StoryRunException(StoryRunErrorKind.Conflict, "script-not-accepted",
                "This story is not waiting for a script. Rewrite the script first if you want to replace it.");
        }

        if (reply is { Length: > MaxScriptReplyChars })
            throw new StoryRunException(StoryRunErrorKind.Invalid, "script-too-long", "That reply is far longer than any script. Paste only the JSON object.", "reply");

        StoryScriptResult result;
        try
        {
            result = StoryScriptParser.Parse(reply, run.Brief, run.Research, "pasted reply", clock.GetUtcNow().UtcDateTime, tolerant: true);
        }
        catch (StoryScriptException ex)
        {
            throw new StoryRunException(StoryRunErrorKind.Invalid, ex.Code, ex.Message, "reply");
        }

        await DeleteScriptFilesAsync(run, ct).ConfigureAwait(false);
        run.Script = result.Script;
        run.ScriptWarnings = [.. result.Warnings];
        run.ScriptApprovedAtUtc = null;
        MarkScriptStageDone(run, "The script was pasted in.");
        return await SettleAfterScriptAsync(run, ct).ConfigureAwait(false);
    }

    /// <summary>Saves the person's edits to the script and checks it again, so what they see stays true.</summary>
    public async Task<StoryRun> UpdateScriptAsync(string userId, string id, StoryScriptEdit edit, CancellationToken ct)
    {
        var run = await OwnedAsync(userId, id, ct).ConfigureAwait(false);
        var current = RequireEditableScript(run);

        var script = new StoryScript
        {
            Title = AiOutputSanitizer.ToSafeLine(edit.Title, 200) ?? current.Title,
            TitleEnglish = AiOutputSanitizer.ToSafeLine(edit.TitleEnglish, 200),
            Language = run.Brief.Language,
            Summary = AiOutputSanitizer.ToSafeLine(edit.Summary, 600),
            MusicQuery = AiOutputSanitizer.ToSafeLine(edit.MusicQuery, 80),
            ReviewNotes = current.ReviewNotes,
            // The cast is the writer's; the editor changes words, and lines that no longer match them are dropped below.
            Cast = current.Cast,
            WrittenBy = current.WrittenBy is { } author && !author.EndsWith("(edited)", StringComparison.Ordinal) ? $"{author} (edited)" : current.WrittenBy,
            CreatedAtUtc = current.CreatedAtUtc
        };

        var before = current.Scenes.ToDictionary(s => s.Number);
        var kept = new HashSet<int>();
        foreach (var incoming in (edit.Scenes ?? []).Take(StoryScriptParser.MaxScenes))
        {
            var narration = AiOutputSanitizer.ToSafeLine(incoming.Narration, StoryScriptParser.MaxNarrationChars);
            if (narration is null) continue;

            var scene = new StoryScene
            {
                Narration = narration,
                Headline = AiOutputSanitizer.ToSafeLine(incoming.Headline, 160) ?? string.Empty,
                English = AiOutputSanitizer.ToSafeLine(incoming.English, 1600),
                ImagePrompt = AiOutputSanitizer.ToSafeLine(incoming.ImagePrompt, 800),
                VideoPrompt = AiOutputSanitizer.ToSafeLine(incoming.VideoPrompt, 800),
                Mood = AiOutputSanitizer.ToSafeLine(incoming.Mood, 30)?.ToLowerInvariant(),
                ImageKeywords = [.. (incoming.ImageKeywords ?? []).Select(k => AiOutputSanitizer.ToSafeLine(k, 40)).OfType<string>().Take(8)],
                Basis = incoming.Basis?.Trim().ToLowerInvariant() switch
                {
                    "tradition" => StoryBasis.Tradition,
                    "reflection" => StoryBasis.Reflection,
                    _ => StoryBasis.Text
                },
                Sources = [.. (incoming.Sources ?? []).Take(8).Select(s => new StorySourceRef
                {
                    TextId = AiOutputSanitizer.ToSafeLine(s.Text, 100) ?? string.Empty,
                    Ref = AiOutputSanitizer.ToSafeLine(s.Ref, 80) ?? string.Empty,
                    Note = AiOutputSanitizer.ToSafeLine(s.Note, 240)
                }).Where(s => s.TextId.Length > 0)]
            };

            // What was made for a scene stays with it. Only the server's own record is trusted for that: the client names
            // a scene by its number and never a file.
            if (incoming.Number > 0 && before.TryGetValue(incoming.Number, out var old) && kept.Add(incoming.Number))
            {
                scene.ImageKey = old.ImageKey;
                scene.ImageSource = old.ImageSource;
                scene.ImageName = old.ImageName;
                scene.VideoKey = old.VideoKey;
                scene.VideoName = old.VideoName;
                scene.AudioKey = old.AudioKey;
                scene.AudioSeconds = old.AudioSeconds;
                scene.AudioName = old.AudioName;
                scene.AudioSource = old.AudioSource;
                scene.Pauses = old.Pauses;
                scene.Lines = old.Lines;
            }

            script.Scenes.Add(scene);
        }

        StoryScriptResult result;
        try
        {
            result = StoryScriptParser.Normalize(script, run.Brief, run.Research);
        }
        catch (StoryScriptException ex)
        {
            throw new StoryRunException(StoryRunErrorKind.Invalid, ex.Code, ex.Message, "scenes");
        }

        // Pictures and narration of scenes that were taken out go with them.
        foreach (var gone in before.Values.Where(s => !kept.Contains(s.Number)))
            await DeleteFilesAsync(run, [gone.ImageKey, gone.AudioKey, gone.VideoKey], ct).ConfigureAwait(false);

        run.Script = result.Script;
        run.ScriptWarnings = [.. result.Warnings];
        // An approval was of the words as they were; changed words need reading again.
        run.ScriptApprovedAtUtc = null;
        ReopenForEditing(run);
        await Save(run, ct).ConfigureAwait(false);
        return run;
    }

    /// <summary>
    /// The person has read the script and wants to go with it. Nothing is made yet: this only marks the words as approved,
    /// so the page moves on to the pictures and the build. Saved like every other change, so it is never lost.
    /// </summary>
    public async Task<StoryRun> ApproveScriptAsync(string userId, string id, CancellationToken ct)
    {
        var run = await OwnedAsync(userId, id, ct).ConfigureAwait(false);
        RequireEditableScript(run);
        if (run.Status == StoryRunStatus.AwaitingScript)
            throw new StoryRunException(StoryRunErrorKind.Conflict, "approve-not-allowed", "Paste the script in before approving it.");

        if (run.ScriptApprovedAtUtc is null)
        {
            run.ScriptApprovedAtUtc = clock.GetUtcNow().UtcDateTime;
            await Save(run, ct).ConfigureAwait(false);
            logger.LogInformation("Story run {RunId}: script approved.", run.Id);
        }

        return run;
    }

    /// <summary>
    /// Notes subtitle tracks that were added to a YouTube video, so the same language is not sent to the same video twice.
    /// Read again before writing, and refused while a worker has the run, as every other write is.
    /// </summary>
    public async Task<StoryRun> RecordCaptionsAsync(string userId, string id, IReadOnlyList<StoryCaptionUpload> added, CancellationToken ct)
    {
        var run = await OwnedAsync(userId, id, ct).ConfigureAwait(false);
        if (added.Count == 0) return run;
        if (run.IsWorking)
            throw new StoryRunException(StoryRunErrorKind.Conflict, "story-busy", "The story is being made again. Add the subtitles once it is done.");

        run.CaptionUploads.RemoveAll(old => added.Any(a => a.VideoId == old.VideoId && a.Language == old.Language));
        run.CaptionUploads.AddRange(added);
        await Save(run, ct).ConfigureAwait(false);
        return run;
    }

    /// <summary>Attaches the person's own picture to a scene, replacing whatever it had.</summary>
    public async Task<StoryRun> AttachImageAsync(string userId, string id, int sceneNumber, byte[] image, string? fileName, CancellationToken ct)
    {
        var run = await OwnedAsync(userId, id, ct).ConfigureAwait(false);
        var scene = RequireScene(RequireEditableScript(run), sceneNumber);

        if (image.Length > VisualsStage.MaxImageBytes)
            throw new StoryRunException(StoryRunErrorKind.Invalid, "image-too-large", $"A picture can be at most {VisualsStage.MaxImageBytes / 1024 / 1024} MB.", "image");
        var mime = AiImageValidator.Sniff(image)
            ?? throw new StoryRunException(StoryRunErrorKind.Invalid, "image-invalid", "That is not a PNG, JPEG or WebP picture.", "image");

        var key = StoryObjectKeys.Image(run.Id, scene.Number, StoryBundleBuilder.ImageExtension(mime));
        await using (var content = new MemoryStream(image, writable: false))
            await store.SaveAsync(key, content, mime, ct).ConfigureAwait(false);

        await DeleteFilesAsync(run, [scene.ImageKey], ct).ConfigureAwait(false);
        scene.ImageKey = key;
        scene.ImageSource = "upload";
        scene.ImageName = SafeFileLabel(fileName) ?? $"Scene {scene.Number}";
        ReopenForEditing(run);
        await Save(run, ct).ConfigureAwait(false);
        return run;
    }

    public async Task<StoryRun> RemoveImageAsync(string userId, string id, int sceneNumber, CancellationToken ct)
    {
        var run = await OwnedAsync(userId, id, ct).ConfigureAwait(false);
        var scene = RequireScene(RequireEditableScript(run), sceneNumber);

        await DeleteFilesAsync(run, [scene.ImageKey], ct).ConfigureAwait(false);
        scene.ImageKey = null;
        scene.ImageSource = null;
        scene.ImageName = null;
        ReopenForEditing(run);
        await Save(run, ct).ConfigureAwait(false);
        return run;
    }

    /// <summary>The largest moving clip a scene takes: an 8-second 1080p clip from Flow or Veo is well under this.</summary>
    public const int MaxVideoBytes = 100 * 1024 * 1024;

    /// <summary>Attaches a moving clip (MP4) to a scene; it plays in place of the picture, looped if the scene is longer.</summary>
    public async Task<StoryRun> AttachVideoAsync(string userId, string id, int sceneNumber, byte[] video, string? fileName, CancellationToken ct)
    {
        var run = await OwnedAsync(userId, id, ct).ConfigureAwait(false);
        var scene = RequireScene(RequireEditableScript(run), sceneNumber);

        if (video.Length > MaxVideoBytes)
            throw new StoryRunException(StoryRunErrorKind.Invalid, "video-too-large", $"A clip can be at most {MaxVideoBytes / 1024 / 1024} MB.", "video");
        if (!IsMp4(video))
            throw new StoryRunException(StoryRunErrorKind.Invalid, "video-invalid", "That is not an MP4 video.", "video");

        var key = StoryObjectKeys.Video(run.Id, scene.Number);
        await using (var content = new MemoryStream(video, writable: false))
            await store.SaveAsync(key, content, "video/mp4", ct).ConfigureAwait(false);

        await DeleteFilesAsync(run, [scene.VideoKey], ct).ConfigureAwait(false);
        scene.VideoKey = key;
        scene.VideoName = SafeFileLabel(fileName) ?? $"Scene {scene.Number} clip";
        ReopenForEditing(run);
        await Save(run, ct).ConfigureAwait(false);
        return run;
    }

    public async Task<StoryRun> RemoveVideoAsync(string userId, string id, int sceneNumber, CancellationToken ct)
    {
        var run = await OwnedAsync(userId, id, ct).ConfigureAwait(false);
        var scene = RequireScene(RequireEditableScript(run), sceneNumber);

        await DeleteFilesAsync(run, [scene.VideoKey], ct).ConfigureAwait(false);
        scene.VideoKey = null;
        scene.VideoName = null;
        ReopenForEditing(run);
        await Save(run, ct).ConfigureAwait(false);
        return run;
    }

    /// <summary>An ISO media file (MP4, or a QuickTime file of the same family) starts with a box whose type is <c>ftyp</c>.</summary>
    public static bool IsMp4(ReadOnlySpan<byte> content) =>
        content.Length >= 12 && content[4] == (byte)'f' && content[5] == (byte)'t' && content[6] == (byte)'y' && content[7] == (byte)'p';

    /// <summary>Throws the script away and asks again, with the same research. A rewrite is never answered from a cache.</summary>
    public async Task<StoryRun> RewriteAsync(string userId, string id, StoryWriterMode? writer, CancellationToken ct)
    {
        var run = await OwnedAsync(userId, id, ct).ConfigureAwait(false);
        if (run.IsWorking || run.Research is null)
            throw new StoryRunException(StoryRunErrorKind.Conflict, "rewrite-not-allowed", "The script can be rewritten once the search has finished and nothing is being made.");
        if (writer is StoryWriterMode.BuiltIn)
            throw new StoryRunException(StoryRunErrorKind.Invalid, "writer-invalid", "A built-in story is not rewritten; start a new one from your own title.", "writer");

        await CheckCapacityAsync(userId, ct).ConfigureAwait(false);
        await DeleteScriptFilesAsync(run, ct).ConfigureAwait(false);

        if (writer is { } chosen) run.Brief.Writer = chosen;
        run.Script = null;
        run.ScriptApprovedAtUtc = null;
        ClearReviews(run);
        run.ScriptWarnings = [];
        run.ScriptRevision++;
        run.Kit = null;
        run.RenderJobId = null;
        run.ErrorCode = null;
        run.ErrorMessage = null;
        run.CancelRequested = false;
        ResetStages(run, StoryStageIds.Script, StoryStageIds.Building);
        run.Status = StoryRunStatus.WritingScript;

        await Save(run, ct).ConfigureAwait(false);
        queue.Enqueue(run.Id);
        return run;
    }

    // ------------------------------------------------------------------------------------------------ building

    /// <summary>Approves the script and starts the build: pictures, narration, music, the project, the render and the YouTube kit.</summary>
    public async Task<StoryRun> BuildAsync(string userId, string id, StoryBuildOptions? build, CancellationToken ct)
    {
        var run = await OwnedAsync(userId, id, ct).ConfigureAwait(false);
        if (run.Script is null || run.IsWorking || run.Status == StoryRunStatus.AwaitingScript)
            throw new StoryRunException(StoryRunErrorKind.Conflict, "build-not-allowed", "There is no script to build yet, or this story is already being made.");

        var checkedOptions = await CheckOptionsAsync(userId, build ?? run.Options, ct).ConfigureAwait(false);
        Preflight(checkedOptions);
        await CheckCapacityAsync(userId, ct).ConfigureAwait(false);

        run.Options = checkedOptions;
        // Pressing Build is saying yes to the script as it stands, and asks again about everything made from it.
        run.ScriptApprovedAtUtc ??= clock.GetUtcNow().UtcDateTime;
        ClearReviews(run);
        run.Kit = null;
        run.RenderJobId = null;
        run.ErrorCode = null;
        run.ErrorMessage = null;
        run.CancelRequested = false;
        ResetStages(run, StoryStageIds.Visuals, StoryStageIds.Building);
        run.Status = StoryRunStatus.Building;

        await Save(run, ct).ConfigureAwait(false);
        queue.Enqueue(run.Id);
        logger.LogInformation("Story run {RunId} approved for building.", run.Id);
        return run;
    }

    /// <summary>Starts a failed or stopped run again from the step it stopped at; everything already made is kept.</summary>
    public async Task<StoryRun> RetryAsync(string userId, string id, CancellationToken ct)
    {
        var run = await OwnedAsync(userId, id, ct).ConfigureAwait(false);
        if (run.Status is not (StoryRunStatus.Failed or StoryRunStatus.Cancelled))
            throw new StoryRunException(StoryRunErrorKind.Conflict, "retry-not-allowed", "Only a story that failed or was stopped can be retried.");

        await CheckCapacityAsync(userId, ct).ConfigureAwait(false);

        // A run that had begun building carries on building; one that never got a script goes back to getting one.
        var building = run.Script is not null && StoryStageIds.Building.Any(s => run.Stage(s).Status != StoryStageStatus.Pending);
        foreach (var state in run.Stages.Where(s => s.Status is StoryStageStatus.Failed or StoryStageStatus.Running))
        {
            state.Status = StoryStageStatus.Pending;
            state.Code = null;
            state.Message = null;
        }

        run.ErrorCode = null;
        run.ErrorMessage = null;
        run.CancelRequested = false;
        run.Review = null;
        run.Status = building ? StoryRunStatus.Building : StoryRunStatus.Researching;

        await Save(run, ct).ConfigureAwait(false);
        queue.Enqueue(run.Id);
        return run;
    }

    // ------------------------------------------------------------------------------------------------ reviewing what was made

    /// <summary>The person heard or watched what a step made and is happy with it: the build goes on from there.</summary>
    /// <param name="musicVolume">With the music: the level the person settled on while listening, mixed in when the video is built.</param>
    public async Task<StoryRun> ApproveReviewAsync(string userId, string id, string stageId, CancellationToken ct, double? musicVolume = null)
    {
        var run = await OwnedAsync(userId, id, ct).ConfigureAwait(false);
        if (run.Status != StoryRunStatus.AwaitingReview || !string.Equals(run.Review, stageId, StringComparison.Ordinal))
            throw new StoryRunException(StoryRunErrorKind.Conflict, "review-not-waiting", "That step is not waiting for your approval. Reload the page to see where the story is.");

        await CheckCapacityAsync(userId, ct).ConfigureAwait(false);
        if (stageId == StoryStageIds.Music && musicVolume is { } volume && double.IsFinite(volume))
            run.Options.MusicVolume = Math.Clamp(volume, 0.0, 1.0);
        run.SetApproval(stageId, clock.GetUtcNow().UtcDateTime);
        run.Review = null;
        run.Status = StoryRunStatus.Building;

        await Save(run, ct).ConfigureAwait(false);
        queue.Enqueue(run.Id);
        logger.LogInformation("Story run {RunId}: the {Stage} was approved.", run.Id, stageId);
        return run;
    }

    /// <summary>
    /// Makes the narration again: the named scenes as new takes, or every scene in a changed voice. The music is kept (it is
    /// made again only if it was never approved), and the video is built again from the new voice.
    /// </summary>
    public async Task<StoryRun> RedoNarrationAsync(string userId, string id, StoryVoiceRedo redo, CancellationToken ct)
    {
        var run = await OwnedAsync(userId, id, ct).ConfigureAwait(false);
        var script = RequireReviewable(run, StoryStageIds.Narration);
        if (run.Options.Narration == StoryNarrationMode.None)
            throw new StoryRunException(StoryRunErrorKind.Conflict, "narration-off", "This story has no narration. Turn it on in the build options and build again.");

        // The options pass through the same checks as Build, so a voice or a style is never taken on trust.
        var options = await CheckOptionsAsync(userId, run.Options, ct).ConfigureAwait(false);
        if (redo.VoiceId is not null) options.VoiceId = string.IsNullOrWhiteSpace(redo.VoiceId) ? null : redo.VoiceId;
        if (redo.SpeechStyle is not null) options.SpeechStyle = string.IsNullOrWhiteSpace(redo.SpeechStyle) ? null : redo.SpeechStyle;
        if (redo.SpeechRate is { } rate) options.SpeechRate = rate;
        if (redo.CastVoices is { } cast) options.CastVoices = cast;
        options = await CheckOptionsAsync(userId, options, ct).ConfigureAwait(false);
        Preflight(options);

        var retake = (redo.Scenes ?? []).Distinct().ToHashSet();
        if (retake.Count == 0 && SameVoice(run.Options, options))
        {
            // Nothing named and nothing changed: every scene is taken again.
            retake = [.. script.Scenes.Select(s => s.Number)];
        }

        foreach (var number in retake) RequireScene(script, number).AudioTake++;

        await CheckCapacityAsync(userId, ct).ConfigureAwait(false);
        run.Options = options;
        run.VoiceApprovedAtUtc = null;
        run.VideoApprovedAtUtc = null;
        RestartFrom(run, StoryStageIds.Narration);

        await Save(run, ct).ConfigureAwait(false);
        queue.Enqueue(run.Id);
        logger.LogInformation("Story run {RunId}: narration asked for again ({Scenes} scene takes).", run.Id, retake.Count);
        return run;
    }

    /// <summary>Makes the background music again from a new brief, style or source - or takes it away.</summary>
    public async Task<StoryRun> RedoMusicAsync(string userId, string id, StoryMusicRedo redo, CancellationToken ct)
    {
        var run = await OwnedAsync(userId, id, ct).ConfigureAwait(false);
        RequireReviewable(run, StoryStageIds.Music);

        var options = await CheckOptionsAsync(userId, run.Options, ct).ConfigureAwait(false);
        options.Music = !redo.Off;
        if (redo.Prompt is not null) options.MusicPrompt = redo.Prompt;
        if (redo.Style is not null) options.MusicQuery = redo.Style;
        if (redo.Source is { } source) options.MusicSource = source;
        if (redo.Volume is { } volume) options.MusicVolume = volume;
        options = await CheckOptionsAsync(userId, options, ct).ConfigureAwait(false);

        await CheckCapacityAsync(userId, ct).ConfigureAwait(false);
        await DeleteFilesAsync(run, [run.Music?.StorageKey], ct).ConfigureAwait(false);
        run.Music = null;
        run.MusicTake++;
        run.Options = options;
        run.MusicApprovedAtUtc = null;
        run.VideoApprovedAtUtc = null;
        RestartFrom(run, StoryStageIds.Music);

        await Save(run, ct).ConfigureAwait(false);
        queue.Enqueue(run.Id);
        logger.LogInformation("Story run {RunId}: music asked for again (take {Take}).", run.Id, run.MusicTake + 1);
        return run;
    }

    /// <summary>The largest music file a person can attach: the same ceiling as any uploaded audio.</summary>
    public const long MaxMusicBytes = MusicStage.MaxBytes;

    /// <summary>
    /// Uses a track the person made or chose themselves (from Google's music tool with the brief shown here, say). Before a
    /// build it is simply kept; after one, the music is to be approved again and the video built again with it.
    /// </summary>
    public async Task<StoryRun> AttachMusicAsync(string userId, string id, byte[] audio, string? fileName, CancellationToken ct)
    {
        var run = await OwnedAsync(userId, id, ct).ConfigureAwait(false);
        if (run.Script is null || run.IsWorking)
            throw new StoryRunException(StoryRunErrorKind.Conflict, "music-locked", "Music can be added once the script is written and while nothing is being made.");
        if (audio.Length > MaxMusicBytes)
            throw new StoryRunException(StoryRunErrorKind.Invalid, "music-too-large", $"A music file can be at most {MaxMusicBytes / 1024 / 1024} MB.", "file");

        var type = AiAudioValidator.Sniff(audio);
        if (type is not (AiAudioValidator.Mp3 or AiAudioValidator.Wav))
            throw new StoryRunException(StoryRunErrorKind.Invalid, "music-invalid", "That is not an MP3 or WAV file.", "file");

        await DeleteFilesAsync(run, [run.Music?.StorageKey], ct).ConfigureAwait(false);
        var key = StoryObjectKeys.Music(run.Id, type);
        await using (var content = new MemoryStream(audio, writable: false))
            await store.SaveAsync(key, content, type, ct).ConfigureAwait(false);

        var name = SafeFileLabel(fileName) ?? "My track";
        run.Music = new StoryMusicPick
        {
            Provider = MusicStage.UploadedProvider,
            TrackId = "upload",
            Title = name,
            Artist = "Added by you",
            LicenseCode = "Own",
            // The person vouches for it; the kit reminds them to credit it if its licence asks.
            LicenseClass = "Unknown",
            Attribution = string.Empty,
            StorageKey = key,
            ContentType = type
        };
        run.Options.Music = true;

        // Already built once: the new track is checked and the video made again with it. Before a build it simply waits.
        var music = run.Stage(StoryStageIds.Music);
        if (IsPastBuild(run) && music.Status is StoryStageStatus.Completed or StoryStageStatus.Skipped)
        {
            RestartFrom(run, StoryStageIds.Assemble);
            music.Status = StoryStageStatus.Completed;
            music.Code = null;
            music.Message = $"Using your track “{name}”.";
            run.MusicApprovedAtUtc = null;
            run.VideoApprovedAtUtc = null;
            run.Status = StoryRunStatus.AwaitingReview;
            run.Review = StoryStageIds.Music;
        }

        await Save(run, ct).ConfigureAwait(false);
        logger.LogInformation("Story run {RunId}: the person attached their own music ({Type}).", run.Id, type);
        return run;
    }

    /// <summary>Builds the video again with a fresh automatic look, another style, or effects and transitions set by hand.</summary>
    public async Task<StoryRun> RedoLookAsync(string userId, string id, StoryLookRedo redo, CancellationToken ct)
    {
        var run = await OwnedAsync(userId, id, ct).ConfigureAwait(false);
        var script = RequireReviewable(run, StoryStageIds.Assemble);

        // Checked in full before anything changes, so a bad name never leaves half a look applied.
        var edits = new List<(StoryScene Scene, StorySceneLookEdit Edit, BackgroundEffect? Effect, SceneTransition? Transition)>();
        foreach (var edit in redo.Scenes ?? [])
        {
            var scene = RequireScene(script, edit.Number);
            edits.Add((scene, edit, ParseName<BackgroundEffect>(edit.Effect, "effect"), ParseName<SceneTransition>(edit.Transition, "transition")));
        }

        if (redo.Style is { } style && !Enum.IsDefined(style))
            throw new StoryRunException(StoryRunErrorKind.Invalid, "look-invalid", "Pick one of the looks offered.", "style");

        foreach (var (scene, edit, effect, transition) in edits)
        {
            if (edit.Auto)
            {
                scene.LookPinned = false;
                continue;
            }

            scene.LookPinned = true;
            if (effect is { } e) scene.Effect = e.ToString();
            if (transition is { } t) scene.Transition = t.ToString();
            if (edit.TransitionSeconds is { } seconds && double.IsFinite(seconds))
                scene.TransitionSeconds = Math.Clamp(seconds, 0.2, StoryLook.MaxTransitionSeconds);
        }

        await CheckCapacityAsync(userId, ct).ConfigureAwait(false);
        if (redo.NewLook) run.LookTake++;
        if (redo.Style is { } chosen) run.Options.LookStyle = chosen;
        if (redo.MusicVolume is { } volume && double.IsFinite(volume)) run.Options.MusicVolume = Math.Clamp(volume, 0.0, 1.0);
        run.VideoApprovedAtUtc = null;
        RestartFrom(run, StoryStageIds.Assemble);

        await Save(run, ct).ConfigureAwait(false);
        queue.Enqueue(run.Id);
        logger.LogInformation("Story run {RunId}: a new look was asked for (take {Take}, {Edits} scenes set by hand).", run.Id, run.LookTake, edits.Count);
        return run;
    }

    public async Task<StoryRun> CancelAsync(string userId, string id, CancellationToken ct)
    {
        var run = await OwnedAsync(userId, id, ct).ConfigureAwait(false);
        if (run.IsTerminal) return run;

        await LetGoAsync(run.Id, ct).ConfigureAwait(false);

        // Read again: if a worker had it, it has just written its last word. If nobody had it, the run is ours to settle.
        run = await runs.GetAsync(id, ct).ConfigureAwait(false) ?? throw NotFound();
        if (!run.IsTerminal)
        {
            foreach (var state in run.Stages.Where(s => s.Status == StoryStageStatus.Running))
            {
                state.Status = StoryStageStatus.Pending;
                state.Message = "Stopped.";
            }

            run.Status = StoryRunStatus.Cancelled;
            run.CancelRequested = true;
            await Save(run, ct).ConfigureAwait(false);
        }

        return run;
    }

    /// <summary>Deletes the run and the files it made. The project and any render it produced are the person's, and stay.</summary>
    public async Task DeleteAsync(string userId, string id, CancellationToken ct)
    {
        var run = await OwnedAsync(userId, id, ct).ConfigureAwait(false);
        await LetGoAsync(run.Id, ct).ConfigureAwait(false);

        run = await runs.GetAsync(id, ct).ConfigureAwait(false) ?? throw NotFound();
        await DeleteAllFilesAsync(run, ct).ConfigureAwait(false);
        await runs.DeleteAsync(run.Id, ct).ConfigureAwait(false);
    }

    // ------------------------------------------------------------------------------------------------ checks

    private StoryBrief CheckBrief(StoryBrief brief)
    {
        var pack = brief.Writer == StoryWriterMode.BuiltIn
            ? StoryPacks.Find(brief.PackId) ?? throw new StoryRunException(StoryRunErrorKind.Invalid, "pack-invalid", "Pick one of the built-in stories.", "packId")
            : null;

        var title = AiOutputSanitizer.ToSafeLine(brief.Title, MaxTitleChars);
        if (title is null && pack is not null) title = pack.Title;
        if (title is not null) title = Whitespace().Replace(title, " ");
        if (title is null || title.Length < MinTitleChars)
            throw new StoryRunException(StoryRunErrorKind.Invalid, "title-required", $"Give the story a title of at least {MinTitleChars} characters.", "title");

        if (!Enum.IsDefined(brief.Writer) || !Enum.IsDefined(brief.Format))
            throw new StoryRunException(StoryRunErrorKind.Invalid, "brief-invalid", "That writer or format is not one this app knows.", "writer");

        var language = pack?.Language ?? (string.Equals(brief.Language, "en", StringComparison.OrdinalIgnoreCase) ? "en" : "hi");
        var seconds = pack?.TargetSeconds ?? Math.Clamp(brief.TargetSeconds <= 0 ? 150 : brief.TargetSeconds, MinTargetSeconds, MaxTargetSeconds);

        return new StoryBrief
        {
            Title = title,
            Notes = AiOutputSanitizer.ToSafeText(brief.Notes, MaxNotesChars),
            Language = language,
            TargetSeconds = seconds,
            Format = brief.Format,
            Writer = brief.Writer,
            PackId = pack?.Id
        };
    }

    private async Task<StoryBuildOptions> CheckOptionsAsync(string userId, StoryBuildOptions o, CancellationToken ct)
    {
        if (!Enum.IsDefined(o.Narration) || !Enum.IsDefined(o.Visuals))
            throw new StoryRunException(StoryRunErrorKind.Invalid, "options-invalid", "That narration or picture choice is not one this app knows.", "narration");

        var voiceId = string.IsNullOrWhiteSpace(o.VoiceId) ? null : o.VoiceId.Trim();
        if (voiceId is not null && (!VoiceIdPattern().IsMatch(voiceId) || MyVoiceTuning.IsTunedVoice(voiceId)))
            throw new StoryRunException(StoryRunErrorKind.Invalid, "voice-invalid", "Pick a voice from the list.", "voiceId");

        var engine = string.IsNullOrWhiteSpace(o.SpeechEngine) ? null : o.SpeechEngine.Trim();
        if (engine is not null && !EnginePattern().IsMatch(engine))
            throw new StoryRunException(StoryRunErrorKind.Invalid, "engine-invalid", "Pick a speech engine from the list.", "speechEngine");

        // A model is part of a provider's request path, so only one the named engine offers is kept.
        var model = string.IsNullOrWhiteSpace(o.SpeechModel) ? null : o.SpeechModel.Trim();
        if (model is not null && (engine is null || KnownAiProviders.Find(engine) is not { } descriptor || !descriptor.Allows(model, null)))
            throw new StoryRunException(StoryRunErrorKind.Invalid, "model-invalid", "Pick a model the chosen speech engine offers.", "speechModel");

        // Sent only to an engine that takes a delivery instruction; elsewhere it would only split the narration's key.
        var style = StoryNarrator.SupportsStyle(engine) ? AiOutputSanitizer.ToSafeLine(o.SpeechStyle, 300) : null;

        string? profileId = null;
        var onGoogle = false;
        if (o.Narration == StoryNarrationMode.MyVoice)
        {
            profileId = o.VoiceProfileId?.Trim();
            if (profileId is null || !ProfileIdPattern().IsMatch(profileId))
                throw new StoryRunException(StoryRunErrorKind.Invalid, "my-voice-invalid", "Pick one of your voices.", "voiceProfileId");

            var profile = await voices.GetAsync(profileId, ct).ConfigureAwait(false);
            if (profile is null || !string.Equals(profile.UserId, userId, StringComparison.Ordinal))
                throw new StoryRunException(StoryRunErrorKind.Invalid, "my-voice-invalid", "Pick one of your voices.", "voiceProfileId");

            // Spoken by the engine only when the person sent this voice there; otherwise made on this machine.
            onGoogle = MyVoiceReplication.VoiceFor(profile, engine) is not null;
        }

        var keepDelivery = o.Narration != StoryNarrationMode.MyVoice || onGoogle;
        return new StoryBuildOptions
        {
            Narration = o.Narration,
            VoiceProfileId = profileId,
            VoiceId = voiceId,
            SpeechEngine = engine,
            SpeechModel = keepDelivery ? model : null,
            SpeechStyle = keepDelivery ? style : null,
            SpeechRate = double.IsFinite(o.SpeechRate) ? Math.Clamp(o.SpeechRate, 0.5, 2.0) : 1.0,
            CastVoices = o.CastVoices,
            ClosestToMyVoice = o.ClosestToMyVoice && o.Narration == StoryNarrationMode.MyVoice,
            Visuals = o.Visuals,
            ImageStyle = AiOutputSanitizer.ToSafeLine(o.ImageStyle, 300),
            Music = o.Music,
            MusicSource = Enum.IsDefined(o.MusicSource) ? o.MusicSource : StoryMusicSource.Auto,
            UploadsAreAiMade = o.UploadsAreAiMade,
            MusicQuery = AiOutputSanitizer.ToSafeLine(o.MusicQuery, 80),
            MusicVolume = double.IsFinite(o.MusicVolume) ? Math.Clamp(o.MusicVolume, 0.0, 1.0) : 0.2,
            // Sent to the composer as written, so it gets the same cleaning as anything else a person types for a model.
            MusicPrompt = AiOutputSanitizer.ToSafeText(o.MusicPrompt, MusicStage.MaxPromptChars),
            LookStyle = Enum.IsDefined(o.LookStyle) ? o.LookStyle : StoryLookStyle.Auto,
            RenderWhenReady = o.RenderWhenReady,
            AutoApprove = o.AutoApprove
        };
    }

    /// <summary>Says up front what a build cannot do on this server, instead of failing partway through it.</summary>
    private void Preflight(StoryBuildOptions o)
    {
        if (o.Narration != StoryNarrationMode.None)
        {
            if (!finisher.IsAvailable)
                throw new StoryRunException(StoryRunErrorKind.Unavailable, "ffmpeg-missing", "ffmpeg isn't available on this server, so narration can't be made. Choose subtitles only.", "narration");
            if (registry.SpeechChain().Count == 0)
                throw new StoryRunException(StoryRunErrorKind.Unavailable, "no-speech-engine", @"No speech engine is turned on. Start one with scripts\setup-voiceover.ps1, or choose subtitles only.", "narration");
        }

        if (o.RenderWhenReady && !renderer.IsAvailable)
            throw new StoryRunException(StoryRunErrorKind.Unavailable, "renderer-unavailable", renderer.UnavailableReason ?? "Video rendering isn't set up on this server (it needs ffmpeg).", "renderWhenReady");
    }

    private async Task CheckCapacityAsync(string userId, CancellationToken ct)
    {
        var working = await runs.CountWorkingByUserAsync(userId, ct).ConfigureAwait(false);
        if (working >= options.CurrentValue.MaxActiveRunsPerUser)
        {
            throw new StoryRunException(StoryRunErrorKind.Limit, "too-many-runs",
                $"{working} of your stories are being made right now. Wait for one to finish, or stop one, first.");
        }
    }

    // ------------------------------------------------------------------------------------------------ helpers

    private async Task<StoryRun> OwnedAsync(string userId, string id, CancellationToken ct)
    {
        var run = string.IsNullOrWhiteSpace(id) ? null : await runs.GetAsync(id, ct).ConfigureAwait(false);

        // The same answer whether it does not exist or is someone else's, so ids reveal nothing.
        if (run is null || !string.Equals(run.UserId, userId, StringComparison.Ordinal)) throw NotFound();
        return run;
    }

    private static StoryRunException NotFound() =>
        new(StoryRunErrorKind.NotFound, "story-not-found", "That story was not found.");

    private static StoryScript RequireEditableScript(StoryRun run)
    {
        if (run.Script is null || run.IsWorking)
            throw new StoryRunException(StoryRunErrorKind.Conflict, "script-locked", "The script can be changed once it is written and while nothing is being made.");
        return run.Script;
    }

    /// <summary>The build got as far as making something to look at: it is waiting for a review, done, or stopped after it.</summary>
    private static bool IsPastBuild(StoryRun run) =>
        run.Status is StoryRunStatus.AwaitingReview or StoryRunStatus.Completed or StoryRunStatus.Failed or StoryRunStatus.Cancelled;

    /// <summary>The run's script, when the step named has made something and nothing is being made now, so it can be made again.</summary>
    private static StoryScript RequireReviewable(StoryRun run, string stageId)
    {
        if (run.Script is null || run.IsWorking || !IsPastBuild(run)
            || run.Stage(stageId).Status is not (StoryStageStatus.Completed or StoryStageStatus.Skipped))
        {
            throw new StoryRunException(StoryRunErrorKind.Conflict, "redo-not-allowed",
                "That can be made again once the build has made it and nothing is being made.");
        }

        return run.Script;
    }

    /// <summary>The voice is the same when everything that decides how a line sounds is the same.</summary>
    private static bool SameVoice(StoryBuildOptions a, StoryBuildOptions b) =>
        a.VoiceId == b.VoiceId && a.SpeechStyle == b.SpeechStyle && a.SpeechRate.Equals(b.SpeechRate) && a.CastVoices == b.CastVoices
        && a.SpeechEngine == b.SpeechEngine && a.SpeechModel == b.SpeechModel && a.VoiceProfileId == b.VoiceProfileId && a.Narration == b.Narration;

    /// <summary>A named effect or transition, exactly as the app names it; null when none was sent.</summary>
    private static T? ParseName<T>(string? name, string field) where T : struct, Enum
    {
        if (string.IsNullOrWhiteSpace(name)) return null;
        if (Enum.TryParse<T>(name.Trim(), ignoreCase: false, out var value) && Enum.IsDefined(value) && !int.TryParse(name, out _)) return value;
        throw new StoryRunException(StoryRunErrorKind.Invalid, "look-invalid", $"Pick a {field} from the list.", field);
    }

    /// <summary>Starts the build again at <paramref name="stageId"/>: it and every step after it are made again, the ones before are kept.</summary>
    private static void RestartFrom(StoryRun run, string stageId)
    {
        var following = StoryStageIds.Building.SkipWhile(s => s != stageId).ToList();
        ResetStages(run, stageId, following);
        if (following.Contains(StoryStageIds.Render)) run.RenderJobId = null;
        run.Kit = null;
        run.ErrorCode = null;
        run.ErrorMessage = null;
        run.CancelRequested = false;
        run.Review = null;
        run.Status = StoryRunStatus.Building;
    }

    private static void ClearReviews(StoryRun run)
    {
        run.Review = null;
        run.VoiceApprovedAtUtc = null;
        run.MusicApprovedAtUtc = null;
        run.VideoApprovedAtUtc = null;
    }

    /// <summary>
    /// The script or a picture changed while a step was waiting to be checked: what was made no longer matches, so the story
    /// goes back to the build. Building again keeps every file that still fits (narration of unchanged words, the music).
    /// </summary>
    private static void ReopenForEditing(StoryRun run)
    {
        if (run.Status != StoryRunStatus.AwaitingReview) return;

        ClearReviews(run);
        ResetStages(run, StoryStageIds.Visuals, StoryStageIds.Building);
        run.RenderJobId = null;
        run.Kit = null;
        run.Status = StoryRunStatus.ScriptReady;
    }

    private static StoryScene RequireScene(StoryScript script, int number) =>
        script.Scenes.FirstOrDefault(s => s.Number == number)
        ?? throw new StoryRunException(StoryRunErrorKind.NotFound, "scene-not-found", "That scene is not in the script.");

    /// <summary>A name for an attached picture: the file's name as the person gave it, with any path (either kind) and anything odd stripped.</summary>
    private static string? SafeFileLabel(string? fileName) =>
        AiOutputSanitizer.ToSafeLine((fileName ?? string.Empty).Split('/', '\\')[^1], 120);

    private void MarkScriptStageDone(StoryRun run, string message)
    {
        var state = run.Stage(StoryStageIds.Script);
        state.Status = StoryStageStatus.Completed;
        state.Progress = 100;
        state.Message = message;
        state.Code = null;
        state.CompletedAtUtc = clock.GetUtcNow().UtcDateTime;
    }

    /// <summary>After a script arrives: the person reads it, or - if they asked to skip that - the build begins.</summary>
    private async Task<StoryRun> SettleAfterScriptAsync(StoryRun run, CancellationToken ct)
    {
        if (run.Options.AutoApprove)
        {
            await CheckCapacityAsync(run.UserId, ct).ConfigureAwait(false);
            Preflight(run.Options);
            run.ScriptApprovedAtUtc = clock.GetUtcNow().UtcDateTime;
            run.Status = StoryRunStatus.Building;
            await Save(run, ct).ConfigureAwait(false);
            queue.Enqueue(run.Id);
            return run;
        }

        run.Status = StoryRunStatus.ScriptReady;
        await Save(run, ct).ConfigureAwait(false);
        return run;
    }

    private static void ResetStages(StoryRun run, string first, IReadOnlyList<string> following)
    {
        var ids = new HashSet<string>(following, StringComparer.Ordinal) { first };
        foreach (var state in run.Stages.Where(s => ids.Contains(s.Id)))
        {
            state.Status = StoryStageStatus.Pending;
            state.Progress = 0;
            state.Message = null;
            state.Code = null;
            state.StartedAtUtc = null;
            state.CompletedAtUtc = null;
        }
    }

    private Task Save(StoryRun run, CancellationToken ct)
    {
        run.UpdatedAtUtc = clock.GetUtcNow().UtcDateTime;
        return runs.UpsertAsync(run, ct);
    }

    /// <summary>Takes the run off the queue, or stops the worker that has it, and waits for it to let go. Throws if it will not in time.</summary>
    private async Task LetGoAsync(string runId, CancellationToken ct)
    {
        var result = await queue.CancelAsync(runId, StopWait, ct).ConfigureAwait(false);
        if (result == StoryCancelResult.StillStopping)
        {
            throw new StoryRunException(StoryRunErrorKind.Conflict, "still-stopping",
                "The current step is still finishing (an external program is closing down). Try again in a moment.");
        }
    }

    private async Task DeleteScriptFilesAsync(StoryRun run, CancellationToken ct)
    {
        foreach (var scene in run.Script?.Scenes ?? [])
            await DeleteFilesAsync(run, [scene.ImageKey, scene.AudioKey, scene.VideoKey], ct).ConfigureAwait(false);
    }

    private async Task DeleteAllFilesAsync(StoryRun run, CancellationToken ct) =>
        await DeleteFilesAsync(run, StoryObjectKeys.All(run), ct).ConfigureAwait(false);

    private async Task DeleteFilesAsync(StoryRun run, IEnumerable<string?> keys, CancellationToken ct)
    {
        foreach (var key in keys)
        {
            // Only this run's own files, whatever the document says.
            if (!StoryObjectKeys.Owns(run.Id, key)) continue;

            try
            {
                await store.DeleteAsync(key!, ct).ConfigureAwait(false);
            }
            catch (Exception ex) when (ex is IOException or UnauthorizedAccessException)
            {
                logger.LogWarning("A file of story run {RunId} could not be deleted: {ErrorType}", run.Id, ex.GetType().Name);
            }
        }
    }

    /// <summary>
    /// Keeps a person's saved runs near the limit by deleting their oldest ones that came to nothing - failed or stopped.
    /// A finished story is never deleted by this: it has a video, and may be on YouTube. Only its owner deletes it.
    /// </summary>
    private async Task PruneAsync(string userId, string keep, CancellationToken ct)
    {
        var limit = options.CurrentValue.MaxSavedRunsPerUser;
        var all = await runs.ListByUserAsync(userId, limit + 25, ct).ConfigureAwait(false);
        foreach (var old in all.Skip(limit).Where(r => r.Status is StoryRunStatus.Failed or StoryRunStatus.Cancelled && r.Id != keep))
        {
            await DeleteAllFilesAsync(old, ct).ConfigureAwait(false);
            await runs.DeleteAsync(old.Id, ct).ConfigureAwait(false);
        }
    }
}
