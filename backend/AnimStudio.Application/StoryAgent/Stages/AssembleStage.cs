using System.Globalization;
using System.Security.Cryptography;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Abstractions.Storage;
using AnimStudio.Application.Abstractions.StoryAgent;
using AnimStudio.Application.Ai;
using AnimStudio.Application.Projects;
using AnimStudio.Application.Workbooks;
using AnimStudio.Domain.Assets;
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
/// </remarks>
public sealed class AssembleStage(
    IProjectRepository projects,
    WorkbookImportService importer,
    ProjectStatusService status,
    IObjectStore store,
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
        foreach (var scene in script.Scenes)
        {
            ct.ThrowIfCancellationRequested();

            var image = await ReadAsync(run, scene.ImageKey, ct).ConfigureAwait(false)
                ?? throw new StoryStageException("picture-missing", $"Scene {scene.Number} has no picture. Build again to make it.");
            var mime = AiImageValidator.Sniff(image)
                ?? throw new StoryStageException("picture-invalid", $"The picture for scene {scene.Number} is not a PNG, JPEG or WebP.");
            var audio = await ReadAsync(run, scene.AudioKey, ct).ConfigureAwait(false);
            // A clip the build animated plays only while animation is on; turning it off goes back to the picture.
            var clip = PlaysClip(run, scene) ? await ReadAsync(run, scene.VideoKey, ct).ConfigureAwait(false) : null;

            scenes.Add(new StoryBundleScene(
                scene.Number, image, mime, ImageNote(scene),
                audio, audio is null ? null : $"Narration in {scene.AudioSource}",
                audio is not null && scene.AudioSeconds is > 0 ? scene.AudioSeconds.Value : scene.EstimatedSeconds,
                scene.Pauses)
            {
                Video = clip,
                VideoNote = clip is null ? null
                    : scene.HasAttachedClip ? "A moving clip the person attached to the Story Agent."
                    : $"The scene's picture brought to life by the {scene.VideoSource} video engine (AI)."
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

        var music = await ReadMusicAsync(run, ct).ConfigureAwait(false);
        var name = ProjectName(script);
        var project = await EnsureProjectAsync(run, name, ct).ConfigureAwait(false);

        // The project exists from here on, and the run says so before anything goes into it.
        await context.Save().ConfigureAwait(false);

        await context.Report(40, "Building the project").ConfigureAwait(false);
        var built = StoryBundleBuilder.Build(script, run.Brief, run.Options, name, scenes, music);
        var result = await importer.ApplyAsync(project.Id, built.Bundle,
            new WorkbookImportOptions { OverwriteUserEdits = true, RemoveMissingScenes = true }, ct).ConfigureAwait(false);
        await status.RefreshAsync(project.Id, null, ct).ConfigureAwait(false);

        run.SceneStarts = [.. built.SceneStarts];
        run.TotalSeconds = built.TotalSeconds;
        // Timed at the project's own pace; the render stage moves them to the video's speed. A rebuilt project needs a new render.
        run.TimingSpeed = 1.0;
        run.SourceRenderJobId = null;
        run.RenderJobId = null;
        StoryRunWarnings.AddRange(run, result.Warnings);

        logger.LogInformation("Story run {RunId} built project {ProjectId}: {Scenes} scenes, {Seconds:0}s.",
            run.Id, project.Id, script.Scenes.Count, built.TotalSeconds);
        return StoryStageOutcome.Completed(
            $"Project built: {script.Scenes.Count} scenes, {built.CaptionCount} subtitles, about {Duration(built.TotalSeconds)}.");
    }

    /// <summary>True when the scene's clip, not its picture, is what the video shows.</summary>
    public static bool PlaysClip(StoryRun run, StoryScene scene) =>
        scene.HasAttachedClip;

    private async Task<byte[]?> ReadAsync(StoryRun run, string? key, CancellationToken ct)
    {
        if (!StoryObjectKeys.Owns(run.Id, key)) return null;

        await using var stream = await store.OpenAsync(key!, ct).ConfigureAwait(false);
        if (stream is null) return null;

        using var buffer = new MemoryStream();
        await stream.CopyToAsync(buffer, ct).ConfigureAwait(false);
        return buffer.ToArray();
    }

    private async Task<StoryBundleMusic?> ReadMusicAsync(StoryRun run, CancellationToken ct)
    {
        if (run.Music is not { } pick) return null;

        var bytes = await ReadAsync(run, pick.StorageKey, ct).ConfigureAwait(false);
        if (bytes is null) return null;

        var license = Enum.TryParse<LicenseClass>(pick.LicenseClass, out var parsed) ? parsed : LicenseClass.Unknown;
        return new StoryBundleMusic(bytes, pick.Attribution, pick.PageUrl, license,
            pick.ContentType == AiAudioValidator.Wav ? AiAudioValidator.Wav : AiAudioValidator.Mp3);
    }

    private async Task<Project> EnsureProjectAsync(StoryRun run, string name, CancellationToken ct)
    {
        if (!string.IsNullOrEmpty(run.ProjectId))
        {
            var existing = await projects.GetAsync(run.ProjectId, ct).ConfigureAwait(false);
            if (existing is not null && string.Equals(existing.UserId, run.UserId, StringComparison.Ordinal)) return existing;
        }

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
                FollowChannelWatermark = true
            },
            CreatedAt = now,
            UpdatedAt = now
        };

        await projects.InsertAsync(project, ct).ConfigureAwait(false);
        run.ProjectId = project.Id;
        return project;
    }

    private static string ProjectName(StoryScript script)
    {
        var name = string.IsNullOrWhiteSpace(script.Title) ? script.TitleEnglish ?? "Story" : script.Title;
        name = name.Trim();
        return name.Length <= MaxProjectNameChars ? name : name[..MaxProjectNameChars].TrimEnd();
    }

    private static string ImageNote(StoryScene scene) => scene.ImageSource switch
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
