using System.Security.Cryptography;
using AnimStudio.Api.Common;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Abstractions.Workbooks;
using AnimStudio.Application.Security;
using AnimStudio.Application.Workbooks;
using Microsoft.AspNetCore.Mvc;

namespace AnimStudio.Api.Controllers;

/// <summary>
/// The no-AI way in: download a template, fill it in, upload one file with everything in it.
/// </summary>
/// <remarks>
/// <para>
/// Nothing on this controller touches an AI provider. That is the point of it - a bundle
/// carrying its own images and audio describes a complete production, so the whole feature
/// works with no key configured, no quota and no network.
/// </para>
/// <para>
/// Upload is two steps on purpose. One upload can rewrite sixty scenes and there is no undo
/// afterwards, so the preview is the undo: the first call says what would change and stages
/// the file, and the second applies a plan the user has actually seen.
/// </para>
/// </remarks>
[ApiController]
public sealed class BundleController(
    IProjectRepository projects,
    WorkbookImportService importer,
    BundleExportService exporter,
    IWorkbookImportStaging staging,
    ICurrentUser currentUser) : ControllerBase
{
    /// <summary>
    /// Matches the media budget the asset upload endpoint uses, times a realistic file
    /// count. The reader enforces its own per-entry and expanded-size limits underneath.
    /// </summary>
    private const long MaxBundleBytes = 200 * 1024 * 1024;

    /// <summary>
    /// The starter bundle: one CSV per sheet, a README, and a <c>media/</c> folder.
    /// </summary>
    [HttpGet("api/templates/bundle")]
    public IActionResult Template()
    {
        // Server-composed filename. A download name is a place client input has no business
        // reaching, because it is written to the user's disk.
        return File(BundleTemplateWriter.Write(), "application/zip", BundleTemplateWriter.FileName);
    }

    /// <summary>
    /// Prompts for filling the sheets in with any free AI chat tool - no key needed here,
    /// because the AI part happens outside this application entirely.
    /// </summary>
    [HttpGet("api/templates/ai-prompts")]
    public IActionResult PromptPack()
    {
        return File(
            System.Text.Encoding.UTF8.GetBytes(PromptPackWriter.Write()),
            "text/markdown; charset=utf-8",
            PromptPackWriter.FileName);
    }

    /// <summary>
    /// The project as a bundle: its sheets, and every picture and sound they refer to.
    /// </summary>
    /// <remarks>
    /// The other half of the round trip. Export, edit forty scenes in a spreadsheet,
    /// upload the same file back - and the same file moves the whole project to another
    /// machine with its artwork intact, which is also the honest backup.
    /// <para>
    /// <c>includeMedia=false</c> gives just the sheets, for when the artwork is already on
    /// the other end and only the numbers changed.
    /// </para>
    /// </remarks>
    [HttpGet("api/projects/{projectId}/bundle")]
    public async Task<IActionResult> Export(
        string projectId, [FromQuery] bool includeMedia = true, CancellationToken ct = default)
    {
        var project = await EnsureOwnedAsync(projectId, ct);

        var bytes = await exporter.ExportAsync(projectId, includeMedia, ct);

        // The download name is composed from the project's name by the exporter, which
        // strips it to letters and digits. A name written to someone's disk is not a place
        // for stored text to arrive intact.
        return File(bytes, "application/zip", BundleExportService.FileNameFor(project.Name));
    }

    /// <summary>Says what an upload would change, and changes nothing.</summary>
    [HttpPost("api/projects/{projectId}/bundle/preview")]
    [RequestSizeLimit(MaxBundleBytes)]
    public async Task<ActionResult<ApiResponse<WorkbookImportPreview>>> Preview(
        string projectId, IFormFile file, CancellationToken ct)
    {
        await EnsureOwnedAsync(projectId, ct);

        if (file is null || file.Length == 0)
        {
            return BadRequest(ApiResponse<WorkbookImportPreview>.Fail(
                "Choose a bundle to upload.",
                new ApiError("file-required", "Choose a bundle to upload.")));
        }

        // Read once into memory: the reader needs to seek the zip directory, and the same
        // bytes are then staged, so streaming twice would mean reading the request twice.
        using var buffer = new MemoryStream();
        await using (var upload = file.OpenReadStream())
        {
            await upload.CopyToAsync(buffer, ct);
        }

        buffer.Position = 0;
        var hash = Convert.ToHexStringLower(await SHA256.HashDataAsync(buffer, ct));

        buffer.Position = 0;
        var bundle = BundleReader.Read(buffer);

        buffer.Position = 0;
        var staged = await staging.StageAsync(projectId, buffer, hash, ct);

        var preview = await importer.PlanAsync(
            projectId, bundle, staged.Token, staged.ExpiresAtUtc, ct);

        return Ok(ApiResponse<WorkbookImportPreview>.Ok(preview));
    }

    /// <summary>Applies a preview the user has accepted.</summary>
    [HttpPost("api/projects/{projectId}/bundle/apply")]
    public async Task<ActionResult<ApiResponse<WorkbookImportResult>>> Apply(
        string projectId, [FromBody] ApplyBundleRequest request, CancellationToken ct)
    {
        await EnsureOwnedAsync(projectId, ct);

        if (string.IsNullOrWhiteSpace(request?.PreviewToken))
        {
            return BadRequest(ApiResponse<WorkbookImportResult>.Fail(
                "That import needs to be previewed first.",
                new ApiError("token-required", "That import needs to be previewed first.")));
        }

        await using var staged = await staging.OpenAsync(projectId, request.PreviewToken, ct);

        if (staged is null)
        {
            // One message for unknown, expired, already-used and wrong-project: they are the
            // same instruction to the user, and distinguishing them would tell a caller
            // which tokens exist.
            return BadRequest(ApiResponse<WorkbookImportResult>.Fail(
                "That preview has expired. Upload the bundle again.",
                new ApiError("preview-expired", "That preview has expired. Upload the bundle again.")));
        }

        var bundle = BundleReader.Read(staged);

        var result = await importer.ApplyAsync(
            projectId,
            bundle,
            new WorkbookImportOptions
            {
                OverwriteUserEdits = request.OverwriteUserEdits,
                RemoveMissingScenes = request.RemoveMissingScenes
            },
            ct);

        // Consumed only after the apply succeeded: a failed apply is worth retrying with
        // the same upload rather than making the user find the file again.
        await staging.ConsumeAsync(request.PreviewToken, ct);

        return Ok(ApiResponse<WorkbookImportResult>.Ok(result));
    }

    private async Task<Domain.Projects.Project> EnsureOwnedAsync(string projectId, CancellationToken ct)
    {
        var project = await projects.GetAsync(projectId, ct) ?? throw new KeyNotFoundException();

        if (!string.Equals(project.UserId, currentUser.UserId, StringComparison.Ordinal))
            throw new UnauthorizedAccessException();

        return project;
    }
}

public sealed record ApplyBundleRequest
{
    public string? PreviewToken { get; init; }

    /// <summary>Both default to the safe answer, so an omitted field never destroys work.</summary>
    public bool OverwriteUserEdits { get; init; }

    public bool RemoveMissingScenes { get; init; }
}
