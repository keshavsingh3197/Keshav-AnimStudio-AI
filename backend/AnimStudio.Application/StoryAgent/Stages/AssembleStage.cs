using System.Globalization;
using System.Security.Cryptography;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Abstractions.Rendering;
using AnimStudio.Application.Abstractions.Storage;
using AnimStudio.Application.Abstractions.StoryAgent;
using AnimStudio.Application.Ai;
using AnimStudio.Application.Projects;
using AnimStudio.Application.Workbooks;
using AnimStudio.Domain.Assets;
using AnimStudio.Domain.Effects;
using AnimStudio.Domain.Projects;
using AnimStudio.Domain.Rendering;
using AnimStudio.Domain.Stories;
using Microsoft.Extensions.Logging;

namespace AnimStudio.Application.StoryAgent.Stages;

/// <summary>
/// Turns the finished pieces into an ordinary project: a project, its scenes with their pictures, narration and
/// subtitles, and the music. It goes through the bundle importer that a spreadsheet upload uses, so the result can be
/// opened, edited, exported and re-imported like any other project.
/// </summary>
/// <remarks>
/// Running this stage again (a rebuild) replaces the same project's scenes rather than adding a second project, and the
/// project's id is saved before anything goes into it so a crash in between leaves nothing orphaned.
/// <para>
/// With a dub spoken (<see cref="StoryDub"/>), each scene is as long as the longer of its two voices, and a second project
/// is built the same way with the dub's voice and words: same pictures, looks, music and lengths, so the dub's render has
/// the story's timeline.
/// </para>
/// </remarks>
public sealed class AssembleStage(
    IProjectRepository projects,
    IEffectClipRepository effects,
    IAiSettingsRepository aiSettings,
    WorkbookImportService importer,
    ProjectStatusService status,
    IObjectStore store,
    IMediaProbeService probe,
    StoryFaceLocator faces,
    StoryMouthPainter painter,
    TimeProvider clock,
    ILogger<AssembleStage> logger) : IStoryStage
{
    private const int MaxProjectNameChars = 120;

    public string Id => StoryStageIds.Assemble;

    public async Task<StoryStageOutcome> RunAsync(StoryStageContext context, CancellationToken ct)
    {
        var run = context.Run;
        var script = run.Script ?? throw new StoryStageException("no-script", "There is no script to build a project from.");

        await context.Report(5, "Collecting the pictures and narration").ConfigureAwait(false);
        var scenes = new List<StoryBundleScene>(script.Scenes.Count);
        var memes = new MemeShelf(run.UserId);
        var dubbed = StoryDub.IsSpoken(run);
        var dubAudio = new List<byte[]?>(script.Scenes.Count);
        var talking = new FaceLookup();
        var painted = new MouthLookup();
        foreach (var scene in script.Scenes)
        {
            ct.ThrowIfCancellationRequested();

            var image = await ReadAsync(run, scene.ImageKey, ct).ConfigureAwait(false)
                ?? throw new StoryStageException("picture-missing", $"Scene {scene.Number} has no picture. Build again to make it.");
            var mime = AiImageValidator.Sniff(image)
                ?? throw new StoryStageException("picture-invalid", $"The picture for scene {scene.Number} is not a PNG, JPEG or WebP.");
            var audio = await ReadAsync(run, scene.AudioKey, ct).ConfigureAwait(false);
            var dub = dubbed ? await ReadAsync(run, scene.DubAudioKey, ct).ConfigureAwait(false) : null;
            dubAudio.Add(dub);
            // A clip the build animated plays only while animation is on; turning it off goes back to the picture.
            var clip = PlaysClip(run, scene) ? await ReadAsync(run, scene.VideoKey, ct).ConfigureAwait(false) : null;
            if (PlaysClip(run, scene) && clip is null)
                throw new StoryStageException("clip-missing", $"Scene {scene.Number}'s attached clip is missing. Attach it again before building.");
            MediaProbe? clipInfo = null;
            double? clipSeconds = null;
            if (clip is not null && (run.Options.MatchClipDuration || run.Options.KeepClipAudio))
            {
                clipInfo = await probe.ProbeAsync(scene.VideoKey!, ct).ConfigureAwait(false);
                clipSeconds = clipInfo.VideoDurationSeconds is > 0 ? clipInfo.VideoDurationSeconds : clipInfo.DurationSeconds;
                if (string.IsNullOrEmpty(clipInfo.VideoCodec) || clipSeconds is not > 0
                    || !double.IsFinite(clipSeconds.Value))
                    throw new StoryStageException("clip-probe-failed", $"Cannot read scene {scene.Number}'s clip duration or video stream. Check the MP4 and try again.");
                if (run.Options.MatchClipDuration && clipInfo.VideoDurationSeconds is not > 0)
                    StoryRunWarnings.AddRange(run, [$"Scene {scene.Number}: video-stream duration was unavailable; using the container duration. Check its timing."]);
            }
            var duration = SceneDuration(scene.EstimatedSeconds,
                StoryDub.LongerVoice(audio is not null ? scene.AudioSeconds : null, dub is not null ? scene.DubAudioSeconds : null),
                run.Options.MatchClipDuration ? clipSeconds : null);
            if (run.Options.MatchClipDuration && clipSeconds is > 0)
            {
                if (audio is not null && scene.AudioSeconds > duration)
                    StoryRunWarnings.AddRange(run, [$"Scene {scene.Number}: generated voice is longer than its clip and will be cut off. Shorten it or turn off clip-length timing."]);
            }
            if (clipInfo is not null && run.Options.KeepClipAudio && string.IsNullOrEmpty(clipInfo.AudioCodec))
                StoryRunWarnings.AddRange(run, [$"Scene {scene.Number}: the attached clip has no audio track."]);

            // Save speaker mouth anchors with each still picture as editing metadata.
            var speakers = clip is null && run.Options.TalkingFaces ? StoryFaces.Speakers(script, scene) : [];
            if (clip is null)
            {
                (scene.Faces, scene.FacesImageKey) = await FacesAsync(
                    run, scene.Number, speakers, scene.ImageKey, image, mime, scene.Faces, scene.FacesImageKey, talking, ct).ConfigureAwait(false);
            }
            StoryBundleTalkingImage? sceneTalking = null;
            if (clip is null && speakers.Count > 0)
            {
                (scene.TalkingImageKey, scene.TalkingImageFor, sceneTalking) = await TalkingAsync(
                    run, scene.Number, 1, scene.ImageKey, image, mime, scene.Faces, scene.TalkingImageKey, scene.TalkingImageFor, painted, ct)
                    .ConfigureAwait(false);
                if (sceneTalking is not null)
                {
                    // The image model redraws to its own sizes and may reframe, so each open mouth is found where it really is.
                    (scene.TalkingFaces, scene.TalkingFacesKey) = await FacesAsync(
                        run, scene.Number, speakers, scene.TalkingImageKey, sceneTalking.Content, sceneTalking.Mime,
                        scene.TalkingFaces, scene.TalkingFacesKey, talking, ct).ConfigureAwait(false);
                    sceneTalking = sceneTalking with { Faces = scene.TalkingFaces };
                }
            }

            // The scene's further pictures; one that is missing or not a picture is left out rather than stopping the build.
            var shots = new List<StoryBundleShot>();
            if (clip is null)
            {
                var picture = 1;
                foreach (var shot in scene.Shots)
                {
                    picture++;
                    if (await ReadAsync(run, shot.ImageKey, ct).ConfigureAwait(false) is not { } bytes
                        || AiImageValidator.Sniff(bytes) is not { } shotMime) continue;
                    (shot.Faces, shot.FacesImageKey) = await FacesAsync(
                        run, scene.Number, speakers, shot.ImageKey, bytes, shotMime, shot.Faces, shot.FacesImageKey, talking, ct).ConfigureAwait(false);
                    StoryBundleTalkingImage? shotTalking = null;
                    if (speakers.Count > 0)
                    {
                        (shot.TalkingImageKey, shot.TalkingImageFor, shotTalking) = await TalkingAsync(
                            run, scene.Number, picture, shot.ImageKey, bytes, shotMime, shot.Faces, shot.TalkingImageKey, shot.TalkingImageFor, painted, ct)
                            .ConfigureAwait(false);
                        if (shotTalking is not null)
                        {
                            (shot.TalkingFaces, shot.TalkingFacesKey) = await FacesAsync(
                                run, scene.Number, speakers, shot.TalkingImageKey, shotTalking.Content, shotTalking.Mime,
                                shot.TalkingFaces, shot.TalkingFacesKey, talking, ct).ConfigureAwait(false);
                            shotTalking = shotTalking with { Faces = shot.TalkingFaces };
                        }
                    }
                    shots.Add(new StoryBundleShot(bytes, shotMime, ImageNote(shot.ImageSource))
                    {
                        Faces = speakers.Count > 0 ? shot.Faces : [],
                        TalkingImage = shotTalking
                    });
                }
            }

            scenes.Add(new StoryBundleScene(
                scene.Number, image, mime, ImageNote(scene.ImageSource),
                audio, audio is null ? null : $"Narration in {scene.AudioSource}",
                duration,
                scene.Pauses)
            {
                Video = clip,
                VideoHasAudio = !string.IsNullOrEmpty(clipInfo?.AudioCodec),
                VideoNote = clip is null ? null
                    : scene.HasAttachedClip ? "A moving clip the person attached to the Story Agent."
                    : $"The scene's picture brought to life by the {scene.VideoSource} video engine (AI).",
                Shots = shots,
                Faces = speakers.Count > 0 ? scene.Faces : [],
                TalkingImage = sceneTalking,
                Meme = scene.Meme is null ? null
                    : await ReadMemeAsync(run, scene, memes, shots.LastOrDefault() ?? new StoryBundleShot(image, mime, ImageNote(scene.ImageSource)), ct)
                        .ConfigureAwait(false)
            });
        }

        // How each scene moves and cuts to the next, chosen from its mood unless the person set it; kept on the scene so
        // the page can show it, and so a new look can be asked for against it.
        var looks = StoryLook.Plan(script.Scenes, [.. scenes.Select(s => s.DurationSeconds)], run.Brief.Format, run.Options.LookStyle, run.LookTake,
            playsClip: s => PlaysClip(run, s));
        for (var i = 0; i < scenes.Count; i++)
        {
            scenes[i] = scenes[i] with { Look = looks[i] };
            var scene = script.Scenes[i];
            scene.Effect = looks[i].Effect.ToString();
            scene.EffectIntensity = looks[i].Intensity;
            scene.Transition = looks[i].Transition.ToString();
            scene.TransitionSeconds = looks[i].TransitionSeconds;
        }

        if (talking.Unavailable)
            StoryRunWarnings.AddRange(run, ["Speaker face positions were not saved because the Gemini image reader is not configured. Add its key in AI settings and build again."]);
        if (talking.Failed.Count > 0)
            StoryRunWarnings.AddRange(run, [$"Speaker face positions were not saved for scene {string.Join(", ", talking.Failed.Distinct())}. Build again to try once more."]);
        if (painted.Unavailable)
            StoryRunWarnings.AddRange(run, ["Talking faces were not drawn because no Gemini image model is configured, so speakers' faces stay still. Add the Gemini key in AI settings and build again."]);
        if (painted.Failed.Count > 0)
            StoryRunWarnings.AddRange(run, [$"The open-mouth pictures could not be drawn for scene {string.Join(", ", painted.Failed.Distinct())}, so those faces stay still. Build again to try once more."]);

        var music = await ReadMusicAsync(run, ct).ConfigureAwait(false);
        var name = ProjectName(script);
        var project = await EnsureProjectAsync(run, run.ProjectId, name, ct).ConfigureAwait(false);
        run.ProjectId = project.Id;

        // The project exists from here on, and the run says so before anything goes into it.
        await context.Save().ConfigureAwait(false);

        await context.Report(40, "Building the project").ConfigureAwait(false);
        var built = StoryBundleBuilder.Build(script, run.Brief, run.Options, name, scenes, music);
        var result = await importer.ApplyAsync(project.Id, built.Bundle,
            new WorkbookImportOptions { OverwriteUserEdits = true, RemoveMissingScenes = true, ClearEmptySceneAudio = true }, ct).ConfigureAwait(false);
        await status.RefreshAsync(project.Id, null, ct).ConfigureAwait(false);

        // The dub is built only when every scene's dub voice was found; one missing file means none.
        dubbed = dubbed && dubAudio.All(a => a is not null);
        run.DubSourceRenderJobId = null;
        if (dubbed)
        {
            await context.Report(70, $"Building the {StoryCaptions.LabelOf(StoryDub.LanguageOf(run))} dub").ConfigureAwait(false);
            await BuildDubAsync(context, script, scenes, dubAudio, music, name, ct).ConfigureAwait(false);
        }
        else if (run.Options.Dub && run.Options.Narration != StoryNarrationMode.None)
        {
            StoryRunWarnings.AddRange(run, ["The dub was not built: some scenes have no dub voice. Build again to speak them."]);
        }

        run.SceneStarts = [.. built.SceneStarts];
        run.TotalSeconds = built.TotalSeconds;
        // Timed at the project's own pace; the render stage moves them to the video's speed. A rebuilt project needs a new render.
        run.TimingSpeed = 1.0;
        run.SourceRenderJobId = null;
        run.RenderJobId = null;
        StoryRunWarnings.AddRange(run, built.Warnings);
        StoryRunWarnings.AddRange(run, result.Warnings);

        logger.LogInformation("Story run {RunId} built project {ProjectId}: {Scenes} scenes, {Pictures} pictures, {Seconds:0}s.",
            run.Id, project.Id, script.Scenes.Count, built.ProjectScenes, built.TotalSeconds);
        var pictures = built.ProjectScenes > script.Scenes.Count ? $" ({built.ProjectScenes} pictures)" : string.Empty;
        return StoryStageOutcome.Completed(
            $"Project built: {script.Scenes.Count} scenes{pictures}, {built.CaptionCount} subtitles, about {Duration(built.TotalSeconds)}.");
    }

    /// <summary>
    /// The dub's project: the story's scenes as they were just built - pictures, clips, looks and lengths - with the dub's
    /// voice and words, and the same music, so its render has the story's timeline.
    /// </summary>
    private async Task BuildDubAsync(
        StoryStageContext context, StoryScript script, IReadOnlyList<StoryBundleScene> scenes, IReadOnlyList<byte[]?> dubAudio,
        StoryBundleMusic? music, string name, CancellationToken ct)
    {
        var run = context.Run;
        var language = StoryDub.LanguageOf(run);
        var label = StoryCaptions.LabelOf(language);
        var dubScript = StoryDub.ScriptFor(script, language);
        var dubScenes = scenes.Select((scene, i) => scene with
        {
            Audio = dubAudio[i],
            AudioNote = $"{label} dub narration",
            Pauses = script.Scenes[i].DubPauses
        }).ToList();

        var dubName = Truncate($"{name} · {label} dub", MaxProjectNameChars);
        var project = await EnsureProjectAsync(run, run.DubProjectId, dubName, ct).ConfigureAwait(false);
        run.DubProjectId = project.Id;
        await context.Save().ConfigureAwait(false);

        var brief = new StoryBrief { Title = run.Brief.Title, Language = language, Format = run.Brief.Format };
        var built = StoryBundleBuilder.Build(dubScript, brief, run.Options, dubName, dubScenes, music);
        await importer.ApplyAsync(project.Id, built.Bundle,
            new WorkbookImportOptions { OverwriteUserEdits = true, RemoveMissingScenes = true, ClearEmptySceneAudio = true }, ct).ConfigureAwait(false);
        await status.RefreshAsync(project.Id, null, ct).ConfigureAwait(false);

        logger.LogInformation("Story run {RunId} built its {Language} dub as project {ProjectId}.", run.Id, language, project.Id);
    }

    /// <summary>What finding faces came to over one build, said once at the end rather than per picture.</summary>
    private sealed class FaceLookup
    {
        public bool Unavailable { get; set; }
        public List<int> Failed { get; } = [];
    }

    /// <summary>What drawing open mouths came to over one build, said once at the end rather than per picture.</summary>
    private sealed class MouthLookup
    {
        public bool Unavailable { get; set; }
        public List<int> Failed { get; } = [];
    }

    /// <summary>
    /// The open-mouth version of one picture: its key, the picture it was drawn from, and its bytes for the bundle. Drawn
    /// once per picture - a picture that already has one keeps it, a new picture is drawn afresh - and never for a
    /// picture with no faces found, since the renderer would have no mouth to lay it over.
    /// </summary>
    private async Task<(string? Key, string? For, StoryBundleTalkingImage? Image)> TalkingAsync(
        StoryRun run, int sceneNumber, int picture, string? imageKey, byte[] image, string mime, IReadOnlyList<StoryFace> found,
        string? knownKey, string? knownFor, MouthLookup lookup, CancellationToken ct)
    {
        if (found.Count == 0 || imageKey is null) return (knownKey, knownFor, null);

        if (string.Equals(knownFor, imageKey, StringComparison.Ordinal)
            && await ReadAsync(run, knownKey, ct).ConfigureAwait(false) is { } kept
            && AiImageValidator.Sniff(kept) is { } keptMime)
        {
            return (knownKey, knownFor, new StoryBundleTalkingImage(kept, keptMime));
        }

        if (!painter.IsAvailable)
        {
            lookup.Unavailable = true;
            return (null, null, null);
        }

        var edited = await painter.PaintAsync(run, sceneNumber, image, mime, found, ct).ConfigureAwait(false);
        if (edited is null)
        {
            lookup.Failed.Add(sceneNumber);
            return (null, null, null);
        }

        var key = StoryObjectKeys.TalkingImage(run.Id, sceneNumber, picture, StoryBundleBuilder.ImageExtension(edited.MimeType));
        await using (var content = new MemoryStream(edited.Content, writable: false))
            await store.SaveAsync(key, content, edited.MimeType, ct).ConfigureAwait(false);
        if (StoryObjectKeys.Owns(run.Id, knownKey) && !string.Equals(knownKey, key, StringComparison.Ordinal))
            await store.DeleteAsync(knownKey!, ct).ConfigureAwait(false);

        return (key, imageKey, new StoryBundleTalkingImage(edited.Content, edited.MimeType));
    }

    /// <summary>
    /// The speakers' faces in one picture and the picture they were found in. Found once per picture: a picture already
    /// looked at (or one whose faces the person placed) keeps them, and a new picture is looked at afresh.
    /// </summary>
    private async Task<(List<StoryFace> Faces, string? Key)> FacesAsync(
        StoryRun run, int sceneNumber, IReadOnlyList<StoryCastMember> speakers, string? imageKey, byte[] image, string mime,
        List<StoryFace> known, string? knownKey, FaceLookup lookup, CancellationToken ct)
    {
        if (speakers.Count == 0) return (known, knownKey);
        if (imageKey is not null && string.Equals(knownKey, imageKey, StringComparison.Ordinal)) return (known, knownKey);

        if (!faces.IsAvailable)
        {
            lookup.Unavailable = true;
            return ([], null);
        }

        var found = await faces.LocateAsync(run, sceneNumber, image, mime, speakers, ct).ConfigureAwait(false);
        if (found is null)
        {
            lookup.Failed.Add(sceneNumber);
            return ([], null);
        }

        return (found, imageKey);
    }

    private static string Truncate(string value, int max) => value.Length <= max ? value : value[..max].TrimEnd();

    /// <summary>True when the scene's clip, not its picture, is what the video shows.</summary>
    public static bool PlaysClip(StoryRun run, StoryScene scene) =>
        scene.HasAttachedClip;

    public static double SceneDuration(double estimatedSeconds, double? voiceSeconds, double? clipSeconds) =>
        clipSeconds is > 0 ? clipSeconds.Value : voiceSeconds is > 0 ? voiceSeconds.Value : estimatedSeconds;

    private async Task<byte[]?> ReadAsync(StoryRun run, string? key, CancellationToken ct)
    {
        if (!StoryObjectKeys.Owns(run.Id, key)) return null;

        await using var stream = await store.OpenAsync(key!, ct).ConfigureAwait(false);
        if (stream is null) return null;

        using var buffer = new MemoryStream();
        await stream.CopyToAsync(buffer, ct).ConfigureAwait(false);
        return buffer.ToArray();
    }

    /// <summary>The longest a clip meme plays when the template did not say; a punchline, not a second scene.</summary>
    private const double MaxClipMemeSeconds = 3.0;

    /// <summary>How long a still meme stays when the template did not say.</summary>
    private const double StillMemeSeconds = 1.5;

    /// <summary>The most of the owner's library looked through to find a meme by its name.</summary>
    private const int MemeLibraryLimit = 500;

    /// <summary>The owner's library, read once per build and only when a meme is named rather than given by id.</summary>
    private sealed class MemeShelf(string userId)
    {
        public string UserId { get; } = userId;
        public IReadOnlyList<EffectClip>? Clips { get; set; }
    }

    /// <summary>
    /// The scene's funny ending, from the run owner's own library: by id when the template gave one, by name or tag
    /// otherwise (a meme and reaction first), ignoring case, spaces, hyphens and underscores. One that cannot be found or
    /// played becomes a freeze-frame of <paramref name="lastPicture"/> with the meme's caption, with a warning; it never
    /// stops a build.
    /// </summary>
    private async Task<StoryBundleMeme?> ReadMemeAsync(StoryRun run, StoryScene scene, MemeShelf shelf, StoryBundleShot lastPicture, CancellationToken ct)
    {
        var beat = scene.Meme!;
        EffectClip? clip = null;
        if (beat.EffectId is { } id && await effects.GetAsync(id, ct).ConfigureAwait(false) is { } byId
            && string.Equals(byId.UserId, shelf.UserId, StringComparison.Ordinal))
            clip = byId;

        if (clip is null && beat.Name.Length > 0)
        {
            shelf.Clips ??= await effects.ListByUserAsync(shelf.UserId, MemeLibraryLimit, ct).ConfigureAwait(false);
            var wanted = MemeKey(beat.Name);
            clip = shelf.Clips
                .Where(c => string.Equals(c.UserId, shelf.UserId, StringComparison.Ordinal) && c.Kind != AssetKind.Audio)
                .Select(c => (Clip: c, ByName: MemeKey(c.Name) == wanted, ByTag: c.Tags.Any(t => MemeKey(t) == wanted)))
                .Where(m => m.ByName || m.ByTag)
                .OrderByDescending(m => m.ByName)
                .ThenByDescending(m => m.Clip.Category == EffectCategory.Reaction)
                .Select(m => m.Clip)
                .FirstOrDefault();
        }

        var label = beat.Name.Length > 0 ? $"\"{beat.Name}\"" : "its meme";
        if (clip is null)
            return FreezeFrame(run, scene, lastPicture, $"the funny ending {label} is not in your meme library");

        var isVideo = clip.Kind == AssetKind.Video && clip.ContentType == "video/mp4";
        if (!isVideo && clip.Kind != AssetKind.Image)
            return FreezeFrame(run, scene, lastPicture, $"the funny ending {label} is not an MP4 clip or a picture");

        byte[] content;
        await using (var stream = await store.OpenAsync(clip.StorageKey, ct).ConfigureAwait(false))
        {
            if (stream is null)
                return FreezeFrame(run, scene, lastPicture, $"the file of the funny ending {label} is missing");

            using var buffer = new MemoryStream();
            await stream.CopyToAsync(buffer, ct).ConfigureAwait(false);
            content = buffer.ToArray();
        }

        var mime = isVideo ? clip.ContentType : AiImageValidator.Sniff(content);
        if (mime is null)
            return FreezeFrame(run, scene, lastPicture, $"the funny ending {label} is not a PNG, JPEG or WebP picture");

        var length = clip.Probe.VideoDurationSeconds is > 0 ? clip.Probe.VideoDurationSeconds : clip.Probe.DurationSeconds;
        var seconds = beat.Seconds
            ?? (isVideo && length is > 0 && double.IsFinite(length.Value) ? Math.Min(length.Value, MaxClipMemeSeconds) : StillMemeSeconds);
        seconds = Math.Clamp(seconds, StoryMemeBeat.MinSeconds, StoryMemeBeat.MaxSeconds);

        return new StoryBundleMeme(content, mime, isVideo, isVideo && !string.IsNullOrEmpty(clip.Probe.AudioCodec), seconds, beat.Caption,
            $"\"{Truncate(clip.Name, 120)}\" from the owner's memes and reactions library.");
    }

    /// <summary>
    /// The built-in funny ending when the library has none to play: the scene's last picture held for a moment with a
    /// punch-in, under the meme's caption - or its name, read as words ("emotional_damage" says "Emotional damage!").
    /// </summary>
    private static StoryBundleMeme FreezeFrame(StoryRun run, StoryScene scene, StoryBundleShot lastPicture, string why)
    {
        var beat = scene.Meme!;
        StoryRunWarnings.AddRange(run, [$"Scene {scene.Number}: {why}, so the scene's last picture is held as a freeze-frame instead."]);
        var seconds = Math.Clamp(beat.Seconds ?? StillMemeSeconds, StoryMemeBeat.MinSeconds, StoryMemeBeat.MaxSeconds);
        return new StoryBundleMeme(lastPicture.Image, lastPicture.ImageMime, false, false, seconds,
            beat.Caption ?? MemeCaption(beat.Name), $"Freeze-frame of the scene's own picture. {lastPicture.ImageNote}");
    }

    /// <summary>A meme's name as a caption: separators read as spaces, the first letter capitalised; null for no words.</summary>
    public static string? MemeCaption(string name)
    {
        var words = string.Join(' ', name.Split([' ', '_', '-'], StringSplitOptions.RemoveEmptyEntries));
        if (words.Length == 0 || !words.Any(char.IsLetterOrDigit)) return null;
        words = char.ToUpperInvariant(words[0]) + words[1..];
        return char.IsPunctuation(words[^1]) ? words : words + "!";
    }

    /// <summary>A meme name or tag as it is matched: "Shocked Cat", "shocked_cat" and "shocked-cat" are one meme.</summary>
    public static string MemeKey(string value) =>
        string.Concat(value.Where(c => !char.IsWhiteSpace(c) && c is not '_' and not '-')).ToLowerInvariant();

    private async Task<StoryBundleMusic?> ReadMusicAsync(StoryRun run, CancellationToken ct)
    {
        if (run.Music is not { } pick) return null;

        var bytes = await ReadAsync(run, pick.StorageKey, ct).ConfigureAwait(false);
        if (bytes is null) return null;

        var license = Enum.TryParse<LicenseClass>(pick.LicenseClass, out var parsed) ? parsed : LicenseClass.Unknown;
        return new StoryBundleMusic(bytes, pick.Attribution, pick.PageUrl, license,
            pick.ContentType == AiAudioValidator.Wav ? AiAudioValidator.Wav : AiAudioValidator.Mp3);
    }

    /// <summary>The run's project <paramref name="existingId"/> while it is still the owner's; a new one otherwise.</summary>
    private async Task<Project> EnsureProjectAsync(StoryRun run, string? existingId, string name, CancellationToken ct)
    {
        if (!string.IsNullOrEmpty(existingId))
        {
            var existing = await projects.GetAsync(existingId, ct).ConfigureAwait(false);
            if (existing is not null && string.Equals(existing.UserId, run.UserId, StringComparison.Ordinal)) return existing;
        }

        // The channel picked when the story was started, while it still exists; the default channel otherwise.
        var channelId = BrandChannel.IsDefault(run.Brief.BrandChannelId)
            ? null
            : (await aiSettings.GetAsync(ct).ConfigureAwait(false))?.FindChannel(run.Brief.BrandChannelId)?.Id;

        var now = clock.GetUtcNow().UtcDateTime;
        var vertical = run.Brief.Format == StoryFormat.Vertical;
        var project = new Project
        {
            Id = NewObjectId(now),
            UserId = run.UserId,
            Name = name,
            Status = ProjectStatus.Draft,
            Settings = new ProjectSettings
            {
                Width = vertical ? 1080 : 1920,
                Height = vertical ? 1920 : 1080,
                FrameRateNum = StoryBundleBuilder.FramesPerSecond,
                FrameRateDen = 1,
                DistributionIntent = DistributionIntent.Monetized,
                ContentType = ProjectContentType.Video,
                DefaultWatermark = new WatermarkSettings(),
                BrandChannelId = channelId,
                FollowChannelWatermark = true
            },
            CreatedAt = now,
            UpdatedAt = now
        };

        await projects.InsertAsync(project, ct).ConfigureAwait(false);
        return project;
    }

    private static string ProjectName(StoryScript script)
    {
        var name = string.IsNullOrWhiteSpace(script.Title) ? script.TitleEnglish ?? "Story" : script.Title;
        name = name.Trim();
        return name.Length <= MaxProjectNameChars ? name : name[..MaxProjectNameChars].TrimEnd();
    }

    private static string ImageNote(string? source) => source switch
    {
        "upload" => "A picture the person attached to the Story Agent.",
        "placeholder" => "A plain background made by the Story Agent.",
        { Length: > 0 } provider => $"Generated by the {provider} image engine from the scene's description.",
        _ => "Added by the Story Agent."
    };

    private static string Duration(double seconds)
    {
        var total = (int)Math.Round(seconds);
        return total >= 60
            ? string.Create(CultureInfo.InvariantCulture, $"{total / 60}:{total % 60:00}")
            : string.Create(CultureInfo.InvariantCulture, $"{total}s");
    }

    /// <summary>A 24-character hex id with the clock in front, like the ids the projects page creates, valid for either database.</summary>
    private static string NewObjectId(DateTime nowUtc)
    {
        var bytes = new byte[12];
        System.Buffers.Binary.BinaryPrimitives.WriteUInt32BigEndian(bytes, (uint)new DateTimeOffset(nowUtc).ToUnixTimeSeconds());
        RandomNumberGenerator.Fill(bytes.AsSpan(4));
        return Convert.ToHexStringLower(bytes);
    }
}
