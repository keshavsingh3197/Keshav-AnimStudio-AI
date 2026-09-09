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
            capabilities.IsAvailable,
            capabilities.UnavailableReason,
            capabilities.Supports(RenderFeature.DrawText),
            // Overlaying an image needs nothing optional; if the renderer runs at all, it
            // can composite a logo.
            capabilities.IsAvailable,
            capabilities.Supports(RenderFeature.CrossFadeTransitions),
            capabilities.Supports(RenderFeature.BlurBackdrop))));
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
    /// Queues the stitch. Long-running, so it returns a job to poll - the same job shape,
    /// and the same poll and download endpoints, as a project render.
    /// </summary>
    [HttpPost("api/projects/{projectId}/clips/merge")]
    public async Task<ActionResult<ApiResponse<RenderJobResponse>>> Merge(
        string projectId, [FromBody] ClipMergeRequest request, CancellationToken ct)
    {
        var command = new ClipMergeCommand
        {
            AssetIds = request.AssetIds,
            Fit = request.Fit,
            Transition = request.Transition,
            TransitionSeconds = request.TransitionSeconds,
            Junctions = request.Junctions?
                .Select(j => new ClipJunctionOverride(j.Transition, j.TransitionSeconds))
                .ToList(),
            MuteClipAudio = request.MuteClipAudio,
            BackgroundMusicAssetId = request.BackgroundMusicAssetId,
            BackgroundMusicVolume = request.BackgroundMusicVolume,
            MusicTracks = request.MusicTracks
                .Select(t => new TimedMusicClip(
                    t.AssetId, t.StartSeconds, t.Volume, t.TrimStartSeconds, t.TrimEndSeconds))
                .ToList(),
            Watermark = request.Watermark.ToSettings()
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
