using AnimStudio.Api.Common;
using AnimStudio.Api.Contracts;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Abstractions.Rendering;
using AnimStudio.Application.Abstractions.Storage;
using AnimStudio.Application.Security;
using AnimStudio.Application.Uploads;
using AnimStudio.Domain.Assets;
using Microsoft.AspNetCore.Mvc;

namespace AnimStudio.Api.Controllers;

[ApiController]
[Route("api/projects/{projectId}/assets")]
public sealed class AssetsController(
    IAssetRepository assets,
    IProjectRepository projects,
    IObjectStore store,
    IMediaProbeService probe,
    ICurrentUser currentUser,
    TimeProvider clock) : ControllerBase
{
    /// <summary>25MB, also enforced by the counting stream during the copy.</summary>
    private const long MaxUploadBytes = 25 * 1024 * 1024;

    [HttpGet]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<AssetResponse>>>> List(
        string projectId, CancellationToken ct)
    {
        await EnsureOwnedAsync(projectId, ct);

        var list = await assets.ListByProjectAsync(projectId, ct);
        return Ok(ApiResponse<IReadOnlyList<AssetResponse>>.Ok([.. list.Select(Map)]));
    }

    [HttpPost]
    [RequestSizeLimit(MaxUploadBytes)]
    public async Task<ActionResult<ApiResponse<AssetResponse>>> Upload(
        string projectId, IFormFile file, CancellationToken ct)
    {
        await EnsureOwnedAsync(projectId, ct);

        if (file is null || file.Length == 0)
            return BadRequest(ApiResponse<AssetResponse>.Fail(
                "Choose a file to upload.", new ApiError("file-required", "Choose a file to upload.")));

        if (file.Length > MaxUploadBytes)
            return BadRequest(ApiResponse<AssetResponse>.Fail(
                "That file is too large.", new ApiError("file-too-large", "That file is too large.")));

        // Extension, declared content type AND sniffed magic bytes must all agree. A
        // client-declared content type is never trusted on its own.
        await using var probeStream = file.OpenReadStream();
        var validation = await UploadValidator
            .ValidateAsync(file.FileName, file.ContentType, probeStream, ct);

        if (!validation.IsValid)
            return BadRequest(ApiResponse<AssetResponse>.Fail(
                validation.Message!, new ApiError(validation.Code!, validation.Message!)));

        // Server-composed key with a generated filename: the client's name is never used
        // on disk, only kept for display.
        var storageKey =
            $"projects/{projectId}/assets/{Guid.NewGuid():n}{validation.CanonicalExtension}";

        await using (var content = file.OpenReadStream())
        {
            await store.SaveAsync(storageKey, content, validation.MimeType!, ct);
        }

        var asset = new Asset
        {
            ProjectId = projectId,
            Name = UploadValidator.SanitizeDisplayName(file.FileName),
            DisplayFileName = UploadValidator.SanitizeDisplayName(file.FileName),
            StorageKey = storageKey,
            Kind = validation.Kind,
            MimeType = validation.MimeType!,
            FileSizeBytes = file.Length,
            // Uploaded material needs no licence review; only searched assets do.
            ReviewStatus = AssetReviewStatus.NotRequired,
            UsageScope = AssetUsageScope.SceneUse,
            CreatedAt = clock.GetUtcNow().UtcDateTime
        };

        // Probed now, so a sprite with no transparency is caught here rather than
        // appearing as an opaque rectangle in a finished render.
        asset.Probe = await probe.ProbeAsync(storageKey, ct);

        await assets.InsertAsync(asset, ct);

        return Ok(ApiResponse<AssetResponse>.Ok(Map(asset)));
    }

    private async Task EnsureOwnedAsync(string projectId, CancellationToken ct)
    {
        var project = await projects.GetAsync(projectId, ct) ?? throw new KeyNotFoundException();

        if (!string.Equals(project.UserId, currentUser.UserId, StringComparison.Ordinal))
            throw new UnauthorizedAccessException();
    }

    private static AssetResponse Map(Asset a) => new(
        a.Id, a.Name, a.Kind.ToString(), a.MimeType, a.FileSizeBytes,
        a.Probe.Width, a.Probe.Height, a.Probe.HasAlpha, a.Probe.DurationSeconds,
        a.ReviewStatus.ToString());
}
