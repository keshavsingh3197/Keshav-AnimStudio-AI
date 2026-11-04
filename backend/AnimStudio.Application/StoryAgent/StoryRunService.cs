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
    string? Mood);

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
    int MaxActiveRuns);

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
            options.CurrentValue.MaxActiveRunsPerUser);

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
            await DeleteFilesAsync(run, [gone.ImageKey, gone.AudioKey], ct).ConfigureAwait(false);

        run.Script = result.Script;
        run.ScriptWarnings = [.. result.Warnings];
        // An approval was of the words as they were; changed words need reading again.
        run.ScriptApprovedAtUtc = null;
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
        await Save(run, ct).ConfigureAwait(false);
        return run;
    }

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
        // Pressing Build is saying yes to the script as it stands.
        run.ScriptApprovedAtUtc ??= clock.GetUtcNow().UtcDateTime;
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
        run.Status = building ? StoryRunStatus.Building : StoryRunStatus.Researching;

        await Save(run, ct).ConfigureAwait(false);
        queue.Enqueue(run.Id);
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
            UploadsAreAiMade = o.UploadsAreAiMade,
            MusicQuery = AiOutputSanitizer.ToSafeLine(o.MusicQuery, 80),
            MusicVolume = double.IsFinite(o.MusicVolume) ? Math.Clamp(o.MusicVolume, 0.0, 1.0) : 0.2,
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
            await DeleteFilesAsync(run, [scene.ImageKey, scene.AudioKey], ct).ConfigureAwait(false);
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
