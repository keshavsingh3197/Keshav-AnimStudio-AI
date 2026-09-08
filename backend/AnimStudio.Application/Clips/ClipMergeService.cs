using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Abstractions.Rendering;
using AnimStudio.Application.Common;
using AnimStudio.Application.Projects;
using AnimStudio.Application.Security;
using AnimStudio.Domain.Assets;
using AnimStudio.Domain.Errors;
using AnimStudio.Domain.Jobs;
using AnimStudio.Domain.Rendering;

namespace AnimStudio.Application.Clips;

/// <summary>What to stitch, and how. The order of <see cref="AssetIds"/> is the edit.</summary>
public sealed record ClipMergeCommand
{
    public IReadOnlyList<string> AssetIds { get; init; } = [];

    public ClipFit Fit { get; init; } = ClipFit.Contain;

    public SceneTransition Transition { get; init; } = SceneTransition.None;

    /// <summary>Crossfade length. Ignored when the transition is a cut.</summary>
    public double TransitionSeconds { get; init; }

    public bool MuteClipAudio { get; init; }

    public string? BackgroundMusicAssetId { get; init; }
    public double BackgroundMusicVolume { get; init; } = 0.18;

    public WatermarkSettings Watermark { get; init; } = new();
}

/// <summary>
/// The clip stitch's front door: reads the library, resolves a running order, and queues
/// the job.
/// <para>
/// Everything that can be refused is refused HERE, before a job exists. A queued job that
/// cannot succeed is much worse than a rejected request: it occupies a worker, retries
/// twice, and reports its failure minutes later on a screen the user has already left.
/// </para>
/// </summary>
public sealed class ClipMergeService(
    IProjectRepository projects,
    IAssetRepository assets,
    IRenderJobRepository jobs,
    IRenderCapabilities capabilities,
    ProjectStatusService status,
    ICurrentUser currentUser,
    TimeProvider clock)
{
    /// <summary>Longest crossfade offered. Beyond a second or two it reads as a mistake.</summary>
    private const double MaxTransitionSeconds = 3.0;

    /// <summary>
    /// The project's video clips, in filename order.
    /// <para>
    /// Filename order rather than upload order because a multi-file drop arrives in
    /// whatever sequence the browser hands the files over - which is not the order they
    /// were selected in, and not the order they are named in. Sorting here means the list
    /// is usually already correct before anyone touches it.
    /// </para>
    /// </summary>
    public async Task<IReadOnlyList<Asset>> ListClipsAsync(string projectId, CancellationToken ct)
    {
        await EnsureOwnedAsync(projectId, ct).ConfigureAwait(false);

        var all = await assets.ListByProjectAsync(projectId, ct).ConfigureAwait(false);

        return
        [
            .. all.Where(a => a.Kind == AssetKind.Video && a.IsUsableInScene)
                  .OrderBy(a => a.Name, NaturalNameComparer.Instance)
        ];
    }

    /// <summary>
    /// Reads a written running order against a selection of clips.
    /// <para>
    /// The selection is passed in rather than inferred, because the point of the feature is
    /// to order the clips the user has CHOSEN - matching a pasted list against the whole
    /// library would pull in clips they had deliberately left out.
    /// </para>
    /// </summary>
    public async Task<ClipOrderResult> ResolveOrderAsync(
        string projectId, IReadOnlyList<string> selectedAssetIds, string? text, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(selectedAssetIds);

        if (text is { Length: > ClipOrderLimits.MaxTextLength })
        {
            throw EditingException.Invalid("order-text-too-long",
                "That running order is too long to read.");
        }

        var clips = await ListClipsAsync(projectId, ct).ConfigureAwait(false);
        var byId = clips.ToDictionary(c => c.Id, StringComparer.Ordinal);

        // Unknown ids are dropped rather than rejected: a clip deleted in another tab
        // should not make the whole paste fail.
        var candidates = selectedAssetIds
            .Where(byId.ContainsKey)
            .Select(id => new ClipCandidate(id, byId[id].Name))
            .ToList();

        if (candidates.Count == 0)
        {
            throw EditingException.Invalid("no-clips-selected",
                "Choose the clips you want to put in order first.");
        }

        return ClipOrderResolver.FromText(candidates, text);
    }

    public async Task<RenderJob> QueueAsync(
        string projectId, ClipMergeCommand command, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(command);

        var project = await EnsureOwnedAsync(projectId, ct).ConfigureAwait(false);

        // Refused up front rather than queued: a job that cannot possibly succeed still
        // costs three attempts and a confusing failure message.
        if (!capabilities.IsAvailable)
        {
            throw new RenderException(RenderErrorCode.RendererUnavailable,
                capabilities.UnavailableReason
                ?? "Video rendering is not configured on this server.");
        }

        var clipIds = command.AssetIds ?? [];

        if (clipIds.Count == 0)
        {
            throw EditingException.Invalid("no-clips",
                "Choose at least one clip to include.");
        }

        if (clipIds.Count > ClipMergeSpec.MaxClips)
        {
            throw EditingException.Invalid("too-many-clips",
                $"A single video can be built from at most {ClipMergeSpec.MaxClips} clips.");
        }

        // One round trip for the whole set. Duplicates are deliberately allowed - a sting
        // repeated between segments is a real edit - so the lookup is by distinct id and
        // the order is honoured separately.
        var referenced = clipIds
            .Concat(command.BackgroundMusicAssetId is { Length: > 0 } music ? [music] : [])
            .Concat(command.Watermark.LogoAssetId is { Length: > 0 } logo ? [logo] : [])
            .Distinct(StringComparer.Ordinal)
            .ToList();

        var loaded = await assets.GetManyAsync(referenced, ct).ConfigureAwait(false);
        var byId = loaded.ToDictionary(a => a.Id, StringComparer.Ordinal);

        foreach (var id in clipIds)
        {
            var asset = Require(byId, id, projectId, "clip");

            if (asset.Kind != AssetKind.Video)
            {
                throw EditingException.Invalid("not-a-video",
                    $"'{asset.Name}' is not a video clip.");
            }
        }

        var watermark = ValidateWatermark(command.Watermark, byId, projectId);

        if (command.BackgroundMusicAssetId is { Length: > 0 } musicId)
        {
            var asset = Require(byId, musicId, projectId, "music");

            if (asset.Kind is not (AssetKind.Audio or AssetKind.Video))
            {
                throw EditingException.Invalid("not-audio",
                    $"'{asset.Name}' has no sound in it.");
            }
        }

        if (command.MuteClipAudio && string.IsNullOrEmpty(command.BackgroundMusicAssetId))
        {
            throw EditingException.Invalid("silent-output",
                "Muting the clips with no background music would produce a silent video.");
        }

        if (command.TransitionSeconds is < 0 or > MaxTransitionSeconds)
        {
            throw EditingException.Invalid("transition-out-of-range",
                $"A transition must be between 0 and {MaxTransitionSeconds:0.#} seconds.");
        }

        if (command.BackgroundMusicVolume is < 0 or > 1)
        {
            throw EditingException.Invalid("volume-out-of-range",
                "Music volume must be between 0 and 1.");
        }

        var rate = project.Settings.ToCanvas().FrameRate;

        var transitionFrames = command.Transition == SceneTransition.None
            ? 0
            : FrameCount.FromSeconds(command.TransitionSeconds, rate).Value;

        var job = new RenderJob
        {
            ProjectId = projectId,
            UserId = currentUser.UserId,
            Kind = RenderJobKind.ClipMerge,
            Status = RenderJobStatus.Pending,
            ScenesTotal = clipIds.Count,
            Message = "Queued",
            CreatedAt = clock.GetUtcNow().UtcDateTime,
            ClipMerge = new ClipMergeSpec
            {
                AssetIds = [.. clipIds],
                Fit = command.Fit,
                Transition = command.Transition,
                TransitionFrames = transitionFrames,
                MuteClipAudio = command.MuteClipAudio,
                BackgroundMusicAssetId = command.BackgroundMusicAssetId,
                BackgroundMusicVolume = command.BackgroundMusicVolume,
                Watermark = watermark
            }
        };

        await jobs.InsertAsync(job, ct).ConfigureAwait(false);
        await status.MarkRenderingAsync(projectId, ct).ConfigureAwait(false);

        return job;
    }

    /// <summary>
    /// Checks the watermark and returns a clamped copy.
    /// <para>
    /// The text is sanitised rather than rejected, because it is a display string being
    /// written to a file that ffmpeg reads verbatim - and the useful guarantee is that
    /// whatever is stored is a single printable line, not that the user typed one.
    /// </para>
    /// </summary>
    private static WatermarkSettings ValidateWatermark(
        WatermarkSettings requested, Dictionary<string, Asset> byId, string projectId)
    {
        var watermark = new WatermarkSettings
        {
            Kind = requested.Kind,
            Position = requested.Position,
            Opacity = requested.Opacity,
            HeightFraction = requested.HeightFraction,
            MarginFraction = requested.MarginFraction,
            ColorHex = "#" + ClipPlanFactory.ParseRgb(requested.ColorHex),
            BackplateOpacity = requested.BackplateOpacity
        };

        switch (requested.Kind)
        {
            case WatermarkKind.Text:
                var text = ClipPlanFactory.SanitizeText(requested.Text ?? string.Empty);

                if (text.Length == 0)
                {
                    throw EditingException.Invalid("watermark-text-required",
                        "Type the text you want shown on the video, or turn the watermark off.");
                }

                watermark.Text = text;
                break;

            case WatermarkKind.Logo:
                if (requested.LogoAssetId is not { Length: > 0 } logoId)
                {
                    throw EditingException.Invalid("watermark-logo-required",
                        "Choose the image to use as the watermark, or turn the watermark off.");
                }

                var logo = Require(byId, logoId, projectId, "watermark");

                if (logo.Kind != AssetKind.Image)
                {
                    throw EditingException.Invalid("watermark-not-an-image",
                        $"'{logo.Name}' is not an image.");
                }

                watermark.LogoAssetId = logoId;
                break;
        }

        watermark.Clamp();
        return watermark;
    }

    /// <summary>
    /// Resolves a referenced asset and confirms it belongs to THIS project.
    /// <para>
    /// The project check is the access control, not a tidiness check: without it, a caller
    /// who owns one project could name any asset id in the database and have the renderer
    /// fetch it into their own output.
    /// </para>
    /// </summary>
    private static Asset Require(
        Dictionary<string, Asset> byId, string assetId, string projectId, string role)
    {
        if (!byId.TryGetValue(assetId, out var asset)
            || !string.Equals(asset.ProjectId, projectId, StringComparison.Ordinal))
        {
            throw EditingException.Invalid($"{role}-not-found",
                "One of the files you chose is no longer in this project.");
        }

        if (!asset.IsUsableInScene)
        {
            throw EditingException.Invalid($"{role}-not-usable",
                $"'{asset.Name}' has not been approved for use yet.");
        }

        return asset;
    }

    private async Task<Domain.Projects.Project> EnsureOwnedAsync(
        string projectId, CancellationToken ct)
    {
        var project = await projects.GetAsync(projectId, ct).ConfigureAwait(false)
            ?? throw new KeyNotFoundException();

        if (!string.Equals(project.UserId, currentUser.UserId, StringComparison.Ordinal))
            throw new UnauthorizedAccessException();

        return project;
    }
}
