using AnimStudio.Api.Common;
using AnimStudio.Api.Contracts;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Abstractions.Rendering;
using AnimStudio.Application.Clips;
using AnimStudio.Application.Security;
using AnimStudio.Domain.Assets;
using AnimStudio.Domain.Jobs;
using AnimStudio.Infrastructure.Ffmpeg;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace AnimStudio.Api.Controllers;

/// <summary>
/// Joining whole video clips into one file.
/// <para>
/// A separate path from <see cref="RenderController"/> on purpose: that one composites
/// scenes out of backgrounds, sprites and dialogue, while this one takes finished footage
/// and puts it in order. They share the queue, the progress record and the download
/// endpoint - a stitch is polled and downloaded through <c>/api/render-jobs/{id}</c> like
/// any other render - and nothing else.
/// </para>
/// </summary>
[ApiController]
public sealed class ClipsController(
    ClipMergeService clips,
    IAssetRepository assets,
    IProjectRepository projects,
    IRenderCapabilities capabilities,
    IOptions<RenderOptions> renderOptions,
    ICurrentUser currentUser) : ControllerBase
{
    /// <summary>
    /// Everything the clip screen needs to draw itself: the clips, what may be used as a
    /// watermark or a music bed, the server's defaults, and what this machine's renderer can
    /// actually do.
    /// <para>
    /// One request rather than five, because every one of these is needed before the screen
    /// can render anything at all - and because the capability flags have to arrive with the
    /// options they gate, or the UI briefly offers a transition the server cannot perform.
    /// </para>
    /// </summary>
    [HttpGet("api/projects/{projectId}/clips")]
    public async Task<ActionResult<ApiResponse<ClipStudioResponse>>> List(
        string projectId, CancellationToken ct)
    {
        var clipList = await clips.ListClipsAsync(projectId, ct);
        var all = await assets.ListByProjectAsync(projectId, ct);
        var project = await projects.GetAsync(projectId, ct);

        var options = renderOptions.Value;

        return Ok(ApiResponse<ClipStudioResponse>.Ok(new ClipStudioResponse(
            [.. clipList.Select(Mappings.ToClipResponse)],
            // A watermark wants a transparent PNG, so alpha is what the list is sorted by -
            // an opaque logo composites as a solid rectangle over the video.
            [
                .. all.Where(a => a.Kind == AssetKind.Image && a.IsUsableInScene)
                      .OrderByDescending(a => a.Probe.HasAlpha)
                      .ThenBy(a => a.Name, NaturalNameComparer.Instance)
                      .Select(Mappings.ToResponse)
            ],
            [
                .. all.Where(a => a.Kind == AssetKind.Audio && a.IsUsableInScene)
                      .OrderBy(a => a.Name, NaturalNameComparer.Instance)
                      .Select(Mappings.ToResponse)
            ],
            string.IsNullOrWhiteSpace(options.WatermarkText) ? null : options.WatermarkText,
            ClipMergeSpec.MaxClips,
            ClipMergeSpec.MaxMusicTracks,
            AssetsController.MaxVideoUploadBytes,
            // A watermark image or a music file goes in from this screen too, and it is
            // held to the general ceiling rather than the video one.
            AssetsController.MaxUploadBytes,
            capabilities.IsAvailable,
            capabilities.UnavailableReason,
            capabilities.Supports(RenderFeature.DrawText),
            // Overlaying an image needs nothing optional; if the renderer runs at all, it
            // can composite a logo.
            capabilities.IsAvailable,
            capabilities.Supports(RenderFeature.CrossFadeTransitions),
            capabilities.Supports(RenderFeature.BlurBackdrop),
            project?.StudioDraftJson)));
    }

    /// <summary>
    /// Reads a written running order and answers with the sequence it means.
    /// <para>
    /// Deliberately a read: it queues nothing and stores nothing, so a user can paste, look
    /// at what was matched, fix a line and paste again for free. The answer is always a
    /// complete ordering - clips the text never named are kept at the end and reported -
    /// because a half-applied order is not something a UI can do anything sensible with.
    /// </para>
    /// </summary>
    [HttpPost("api/projects/{projectId}/clips/order")]
    public async Task<ActionResult<ApiResponse<ClipOrderResponse>>> Order(
        string projectId, [FromBody] ClipOrderRequest request, CancellationToken ct)
    {
        var result = await clips.ResolveOrderAsync(projectId, request.AssetIds, request.Text, ct);
        return Ok(ApiResponse<ClipOrderResponse>.Ok(result.ToResponse()));
    }

    /// <summary>
    /// Saves the Video editor's complete running order so a page refresh and the next
    /// render open the clips exactly where the editor left them.
    /// </summary>
    [HttpPut("api/projects/{projectId}/clips/order")]
    public async Task<ActionResult<ApiResponse<object>>> SaveOrder(
        string projectId, [FromBody] SaveClipOrderRequest request, CancellationToken ct)
    {
        await clips.SaveOrderAsync(projectId, request.AssetIds, ct);
        return Ok(ApiResponse<object>.Ok(new { }));
    }

    /// <summary>
    /// Persists the complete timeline state, including audio cues, voiceovers, text overlays,
    /// image overlays, and clip transformations directly into the project database record.
    /// </summary>
    [HttpPut("api/projects/{projectId}/clips/draft")]
    public async Task<ActionResult<ApiResponse<object>>> SaveDraft(
        string projectId, [FromBody] SaveStudioDraftRequest request, CancellationToken ct)
    {
        var project = await projects.GetAsync(projectId, ct) ?? throw new KeyNotFoundException();

        if (!string.Equals(project.UserId, currentUser.UserId, StringComparison.Ordinal))
            throw new UnauthorizedAccessException();

        project.StudioDraftJson = request.DraftJson;
        project.UpdatedAt = DateTime.UtcNow;
        await projects.ReplaceAsync(project, ct);

        return Ok(ApiResponse<object>.Ok(new { }));
    }

    /// <summary>
    /// Queues the stitch. Long-running, so it returns a job to poll - the same job shape,
    /// and the same poll and download endpoints, as a project render.
    /// </summary>
    [HttpPost("api/projects/{projectId}/clips/merge")]
    public async Task<ActionResult<ApiResponse<RenderJobResponse>>> Merge(
        string projectId, [FromBody] ClipMergeRequest request, CancellationToken ct)
    {
        var command = new ClipMergeCommand
        {
            ExportName = request.ExportName,
            AssetIds = request.AssetIds,
            Fit = request.Fit,
            BackgroundColor = request.BackgroundColor,
            OutputWidth = request.OutputWidth,
            OutputHeight = request.OutputHeight,
            Quality = request.Quality,
            Transition = request.Transition,
            TransitionSeconds = request.TransitionSeconds,
            Junctions = request.Junctions?
                .Select(j => new ClipJunctionOverride(
                    j.Transition, j.TransitionSeconds, j.LeadInSeconds, j.TailOutSeconds, j.FreezeHead, j.FreezeTail))
                .ToList(),
            MuteClipAudio = request.MuteClipAudio,
            BackgroundMusicAssetId = request.BackgroundMusicAssetId,
            BackgroundMusicVolume = request.BackgroundMusicVolume,
            MusicTracks = request.MusicTracks
                .Select(t => new TimedMusicClip(
                    t.AssetId, t.StartSeconds, t.Volume, t.TrimStartSeconds, t.TrimEndSeconds, t.IsVoiceover))
                .ToList(),
            MusicDuckWindows = request.MusicDuckWindows
                .Select(w => new MusicDuckWindow(w.StartSeconds, w.EndSeconds, w.Level))
                .ToList(),
            ClipAudio = request.ClipAudio?
                .Select(c => new ClipAudioTrack(
                    c.Volume, c.AudioAssetId, c.AudioVolume, c.KeepOriginalAudio, c.TrimStartSeconds, c.TrimEndSeconds))
                .ToList(),
            Watermark = request.Watermark.ToSettings(),
            IncludeOutro = request.IncludeOutro,
            OutroHoldSeconds = request.OutroHoldSeconds,
            YouTubeLoudness = request.YouTubeLoudness,
            TimelineItems = request.TimelineItems?
                .Select(t => new TimelineItemSpec
                {
                    Id = t.Id,
                    Type = t.Type,
                    TrackId = t.TrackId,
                    StartTime = t.StartTime,
                    Duration = t.Duration,
                    Src = t.Src,
                    Name = t.Name,
                    Transform = t.Transform is null ? null : new TimelineItemTransformSpec
                    {
                        Scale = t.Transform.Scale,
                        WidthPercent = t.Transform.WidthPercent,
                        X = t.Transform.X,
                        Y = t.Transform.Y,
                        Opacity = t.Transform.Opacity,
                        Rotation = t.Transform.Rotation,
                        CropLeft = t.Transform.CropLeft,
                        CropRight = t.Transform.CropRight,
                        CropTop = t.Transform.CropTop,
                        CropBottom = t.Transform.CropBottom,
                        Stabilization = t.Transform.Stabilization,
                        EraseRegions = (t.Transform.EraseRegions ?? [])
                            .Select(r => new EraseRegionSpec
                            {
                                X = r.X, Y = r.Y, Width = r.Width, Height = r.Height,
                                Style = r.Style, FillColor = r.FillColor,
                                Strength = r.Strength, Feather = r.Feather,
                                Opacity = r.Opacity, Source = r.Source,
                                KeepCornerMark = r.KeepCornerMark
                            }.Normalized())
                            .OfType<EraseRegionSpec>()
                            .Take(EraseRegionSpec.MaxPerClip)
                            .ToList(),
                        TransitionIn = t.Transform.TransitionIn,
                        TransitionInDuration = t.Transform.TransitionInDuration,
                        TransitionOut = t.Transform.TransitionOut,
                        TransitionOutDuration = t.Transform.TransitionOutDuration,
                    },
                    TextStyle = t.TextStyle is null ? null : new TimelineItemTextStyleSpec
                    {
                        FontSize = t.TextStyle.FontSize,
                        Color = t.TextStyle.Color,
                        BackgroundColor = t.TextStyle.BackgroundColor,
                        Position = t.TextStyle.Position,
                        X = t.TextStyle.X,
                        Y = t.TextStyle.Y,
                        BoxStyle = t.TextStyle.BoxStyle,
                        BoxColor = t.TextStyle.BoxColor,
                        BoxOpacity = t.TextStyle.BoxOpacity,
                        OutlineColor = t.TextStyle.OutlineColor,
                        OutlineWidth = t.TextStyle.OutlineWidth,
                        Shadow = t.TextStyle.Shadow,
                        Uppercase = t.TextStyle.Uppercase,
                        TransitionIn = t.TextStyle.TransitionIn,
                        TransitionInDuration = t.TextStyle.TransitionInDuration,
                        TransitionOut = t.TextStyle.TransitionOut,
                        TransitionOutDuration = t.TextStyle.TransitionOutDuration,
                    },
                    Volume = t.Volume,
                    TrimStartSeconds = t.TrimStartSeconds,
                    TrimEndSeconds = t.TrimEndSeconds
                })
                .ToList()
        };

        var job = await clips.QueueAsync(projectId, command, ct);

        return Accepted(ApiResponse<RenderJobResponse>.Ok(job.ToResponse()));
    }

    /// <summary>
    /// Deletes several clips in one call.
    /// <para>
    /// Exists because a bulk drag-and-drop import is routinely followed by a bulk mistake -
    /// the wrong folder, or the same folder twice - and undoing that one confirmation at a
    /// time is the sort of friction that makes people give up on the feature. Each id still
    /// goes through the same per-asset ownership and reference checks; failures are reported
    /// rather than aborting the rest, so one clip that is in use by a scene does not block
    /// the other nineteen.
    /// </para>
    /// </summary>
    [HttpPost("api/projects/{projectId}/clips/delete")]
    public async Task<ActionResult<ApiResponse<int>>> DeleteMany(
        string projectId, [FromBody] ClipIdsRequest request,
 Application.Assets.AssetLibraryService library, CancellationToken ct)
    {
        var project = await projects.GetAsync(projectId, ct) ?? throw new KeyNotFoundException();

        if (!string.Equals(project.UserId, currentUser.UserId, StringComparison.Ordinal))
            throw new UnauthorizedAccessException();

        var deleted = 0;
        var refused = new List<ApiError>();

        foreach (var id in request.AssetIds.Distinct(StringComparer.Ordinal))
        {
            try
            {
                // Scoped to the project in the route: a clip id from another project is
                // treated as already gone rather than deleted from under that project.
                var asset = await assets.GetAsync(id, ct);
                if (asset is null || !string.Equals(asset.ProjectId, projectId, StringComparison.Ordinal))
                    continue;

                await library.DeleteAsync(id, currentUser.UserId, ct);
                deleted++;
            }
            catch (Application.Common.EditingException ex)
            {
                refused.Add(new ApiError(ex.Code, ex.Message, id));
            }
            catch (KeyNotFoundException)
            {
                // Already gone. The caller asked for it to not exist, and it does not.
            }
        }

        return refused.Count == 0
            ? Ok(ApiResponse<int>.Ok(deleted))
            : Ok(new ApiResponse<int>
            {
                Success = true,
                Data = deleted,
                Message = $"{deleted} deleted, {refused.Count} still in use.",
                Errors = refused
            });
    }
}
