using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using AnimStudio.Api.Common;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Security;
using AnimStudio.Domain.Projects;
using Microsoft.AspNetCore.Mvc;

namespace AnimStudio.Api.Controllers;

/// <summary>
/// A project's cuts - the full video, Shorts, teasers - each with its own Video editor
/// timeline over the same project assets.
/// </summary>
[ApiController]
[Route("api/projects/{projectId}/edits")]
public class ProjectEditsController(
    IProjectEditRepository edits,
    IProjectRepository projects,
    ICurrentUser currentUser) : ControllerBase
{
    /// <summary>A timeline is a few hundred KB even for a long video; this is far beyond that.</summary>
    private const int MaxDraftChars = 20 * 1024 * 1024;

    public enum CreateMode { Blank = 0, Copy = 1, Range = 2 }

    public sealed record CreateEditRequest
    {
        [Required, MaxLength(ProjectEdit.MaxNameLength)] public string Name { get; init; } = string.Empty;
        [EnumDataType(typeof(EditFormat))] public EditFormat Format { get; init; } = EditFormat.Video;
        [MaxLength(ProjectEdit.MaxCategoryLength)] public string? Category { get; init; }
        [MaxLength(ProjectEdit.MaxTags)] public List<string>? Tags { get; init; }
        [EnumDataType(typeof(CreateMode))] public CreateMode Mode { get; init; } = CreateMode.Blank;

        /// <summary>The cut to copy from, for Copy and Range.</summary>
        [MaxLength(64)] public string? SourceEditId { get; init; }

        [Range(0, 24 * 60 * 60)] public double? RangeStart { get; init; }
        [Range(0, 24 * 60 * 60)] public double? RangeEnd { get; init; }
    }

    public sealed record UpdateEditRequest
    {
        [MaxLength(ProjectEdit.MaxNameLength)] public string? Name { get; init; }
        [EnumDataType(typeof(EditFormat))] public EditFormat? Format { get; init; }
        [MaxLength(ProjectEdit.MaxCategoryLength)] public string? Category { get; init; }
        [MaxLength(ProjectEdit.MaxTags)] public List<string>? Tags { get; init; }
    }

    public sealed record SaveEditDraftRequest
    {
        [Required] public string DraftJson { get; init; } = string.Empty;
        [Range(0, 24 * 60 * 60)] public double DurationSeconds { get; init; }
        [Range(0, 100_000)] public int ClipCount { get; init; }
        [MaxLength(64)] public string? ThumbnailAssetId { get; init; }

        /// <summary>The editor has applied the pending range; forget it.</summary>
        public bool ClearPendingRange { get; init; }
    }

    public sealed record EditResponse(
        string Id, string Name, EditFormat Format, string? Category, IReadOnlyList<string> Tags,
        double DurationSeconds, int ClipCount, string? ThumbnailAssetId, string? SourceEditId,
        double? PendingRangeStart, double? PendingRangeEnd,
        DateTime CreatedAt, DateTime UpdatedAt, string? DraftJson = null);

    [HttpGet]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<EditResponse>>>> List(string projectId, CancellationToken ct)
    {
        var project = await LoadOwnedProjectAsync(projectId, ct);
        var list = await edits.ListByProjectAsync(projectId, ct);

        // Projects from before cuts existed have exactly one timeline, on the project. It
        // becomes the first cut the first time anyone looks, so nothing is ever lost.
        if (list.Count == 0)
        {
            var settings = project.Settings;
            var main = NewEdit(projectId, "Main video",
                settings.Height > settings.Width ? EditFormat.Short
                : settings.Height == settings.Width ? EditFormat.Square : EditFormat.Video,
                "Full video", []);
            main.DraftJson = string.IsNullOrWhiteSpace(project.StudioDraftJson) ? null : project.StudioDraftJson;
            // A fixed id: the editor and the list page often load together, and the second
            // insert then fails on the key instead of making a second "Main video".
            main.Id = $"main-{projectId}";
            try
            {
                await edits.InsertAsync(main, ct);
            }
            catch (Exception)
            {
                // The other request won and its copy is identical; anything else is real.
                if (await edits.GetAsync(main.Id, ct) is null) throw;
            }
            list = await edits.ListByProjectAsync(projectId, ct);
        }

        return Ok(ApiResponse<IReadOnlyList<EditResponse>>.Ok([.. list.Select(e => ToResponse(e))]));
    }

    [HttpGet("{editId}")]
    public async Task<ActionResult<ApiResponse<EditResponse>>> Get(string projectId, string editId, CancellationToken ct)
    {
        var edit = await LoadOwnedEditAsync(projectId, editId, ct);
        return Ok(ApiResponse<EditResponse>.Ok(ToResponse(edit, withDraft: true)));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<EditResponse>>> Create(
        string projectId, [FromBody] CreateEditRequest request, CancellationToken ct)
    {
        await LoadOwnedProjectAsync(projectId, ct);

        var existing = await edits.ListByProjectAsync(projectId, ct);
        if (existing.Count >= ProjectEdit.MaxPerProject)
            return BadRequest(ApiResponse<EditResponse>.Fail($"A project can hold up to {ProjectEdit.MaxPerProject} videos and Shorts."));

        var edit = NewEdit(projectId, request.Name, request.Format, request.Category, request.Tags ?? []);

        if (request.Mode != CreateMode.Blank)
        {
            if (string.IsNullOrEmpty(request.SourceEditId))
                return BadRequest(ApiResponse<EditResponse>.Fail("Choose which video to start from."));

            var source = await LoadOwnedEditAsync(projectId, request.SourceEditId, ct);
            edit.DraftJson = source.DraftJson;
            edit.SourceEditId = source.Id;
            edit.DurationSeconds = source.DurationSeconds;
            edit.ClipCount = source.ClipCount;
            edit.ThumbnailAssetId = source.ThumbnailAssetId;

            if (request.Mode == CreateMode.Range)
            {
                var start = request.RangeStart ?? 0;
                var end = request.RangeEnd ?? 0;
                if (end - start < 1)
                    return BadRequest(ApiResponse<EditResponse>.Fail("The part to keep must be at least one second long."));

                edit.PendingRangeStart = start;
                edit.PendingRangeEnd = end;
                edit.DurationSeconds = end - start;
            }
        }

        await edits.InsertAsync(edit, ct);
        return Ok(ApiResponse<EditResponse>.Ok(ToResponse(edit)));
    }

    [HttpPatch("{editId}")]
    public async Task<ActionResult<ApiResponse<EditResponse>>> Update(
        string projectId, string editId, [FromBody] UpdateEditRequest request, CancellationToken ct)
    {
        var edit = await LoadOwnedEditAsync(projectId, editId, ct);

        if (request.Name is not null) edit.Name = request.Name;
        if (request.Format is { } format) edit.Format = format;
        if (request.Category is not null) edit.Category = request.Category;
        if (request.Tags is not null) edit.Tags = request.Tags;
        edit.NormalizeLabels();
        edit.UpdatedAt = DateTime.UtcNow;

        await edits.ReplaceAsync(edit, ct);
        return Ok(ApiResponse<EditResponse>.Ok(ToResponse(edit)));
    }

    [HttpPut("{editId}/draft")]
    public async Task<ActionResult<ApiResponse<EditResponse>>> SaveDraft(
        string projectId, string editId, [FromBody] SaveEditDraftRequest request, CancellationToken ct)
    {
        var edit = await LoadOwnedEditAsync(projectId, editId, ct);

        // Stored verbatim and handed back to the editor, so it must at least be a JSON object.
        if (request.DraftJson.Length > MaxDraftChars || !IsJsonObject(request.DraftJson))
            return BadRequest(ApiResponse<EditResponse>.Fail("The timeline could not be saved: it is not a valid editor document."));

        edit.DraftJson = request.DraftJson;
        edit.DurationSeconds = request.DurationSeconds;
        edit.ClipCount = request.ClipCount;
        edit.ThumbnailAssetId = request.ThumbnailAssetId;
        if (request.ClearPendingRange)
        {
            edit.PendingRangeStart = null;
            edit.PendingRangeEnd = null;
        }
        edit.UpdatedAt = DateTime.UtcNow;

        await edits.ReplaceAsync(edit, ct);
        return Ok(ApiResponse<EditResponse>.Ok(ToResponse(edit)));
    }

    [HttpPost("{editId}/duplicate")]
    public async Task<ActionResult<ApiResponse<EditResponse>>> Duplicate(
        string projectId, string editId, CancellationToken ct)
    {
        var source = await LoadOwnedEditAsync(projectId, editId, ct);

        var existing = await edits.ListByProjectAsync(projectId, ct);
        if (existing.Count >= ProjectEdit.MaxPerProject)
            return BadRequest(ApiResponse<EditResponse>.Fail($"A project can hold up to {ProjectEdit.MaxPerProject} videos and Shorts."));

        var copy = NewEdit(projectId, $"{source.Name} (copy)", source.Format, source.Category, source.Tags);
        copy.DraftJson = source.DraftJson;
        copy.SourceEditId = source.Id;
        copy.PendingRangeStart = source.PendingRangeStart;
        copy.PendingRangeEnd = source.PendingRangeEnd;
        copy.DurationSeconds = source.DurationSeconds;
        copy.ClipCount = source.ClipCount;
        copy.ThumbnailAssetId = source.ThumbnailAssetId;

        await edits.InsertAsync(copy, ct);
        return Ok(ApiResponse<EditResponse>.Ok(ToResponse(copy)));
    }

    [HttpDelete("{editId}")]
    public async Task<ActionResult<ApiResponse<EmptyPayload>>> Delete(
        string projectId, string editId, CancellationToken ct)
    {
        await LoadOwnedEditAsync(projectId, editId, ct);

        // The last cut is the project's only timeline; removing it would just bring the
        // old project-level draft back as "Main video" on the next visit.
        var existing = await edits.ListByProjectAsync(projectId, ct);
        if (existing.Count <= 1)
            return BadRequest(ApiResponse<EmptyPayload>.Fail("A project keeps at least one video. Create another before deleting this one."));

        await edits.DeleteAsync(editId, ct);
        return Ok(ApiResponse<EmptyPayload>.Ok(EmptyPayload.Value));
    }

    private ProjectEdit NewEdit(string projectId, string name, EditFormat format, string? category, IEnumerable<string> tags)
    {
        var now = DateTime.UtcNow;
        var edit = new ProjectEdit
        {
            Id = Guid.NewGuid().ToString("N"),
            ProjectId = projectId,
            UserId = currentUser.UserId,
            Name = name,
            Format = Enum.IsDefined(format) ? format : EditFormat.Video,
            Category = category,
            Tags = [.. tags],
            CreatedAt = now,
            UpdatedAt = now
        };
        edit.NormalizeLabels();
        return edit;
    }

    private static bool IsJsonObject(string json)
    {
        try
        {
            using var doc = JsonDocument.Parse(json);
            return doc.RootElement.ValueKind == JsonValueKind.Object;
        }
        catch (JsonException)
        {
            return false;
        }
    }

    private static EditResponse ToResponse(ProjectEdit e, bool withDraft = false) => new(
        e.Id, e.Name, e.Format, e.Category, e.Tags, e.DurationSeconds, e.ClipCount,
        e.ThumbnailAssetId, e.SourceEditId, e.PendingRangeStart, e.PendingRangeEnd,
        e.CreatedAt, e.UpdatedAt, withDraft ? e.DraftJson : null);

    private async Task<Project> LoadOwnedProjectAsync(string projectId, CancellationToken ct)
    {
        var project = await projects.GetAsync(projectId, ct) ?? throw new KeyNotFoundException();
        if (!string.Equals(project.UserId, currentUser.UserId, StringComparison.Ordinal))
            throw new UnauthorizedAccessException();
        return project;
    }

    /// <summary>The cut, only when it is in this project and the caller owns both.</summary>
    private async Task<ProjectEdit> LoadOwnedEditAsync(string projectId, string editId, CancellationToken ct)
    {
        await LoadOwnedProjectAsync(projectId, ct);
        var edit = await edits.GetAsync(editId, ct);
        if (edit is null
            || !string.Equals(edit.ProjectId, projectId, StringComparison.Ordinal)
            || !string.Equals(edit.UserId, currentUser.UserId, StringComparison.Ordinal))
            throw new KeyNotFoundException();
        return edit;
    }
}
