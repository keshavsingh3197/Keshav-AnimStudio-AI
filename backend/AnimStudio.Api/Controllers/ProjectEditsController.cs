using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using AnimStudio.Api.Common;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Ingest;
using AnimStudio.Application.Publishing;
using AnimStudio.Application.Security;
using AnimStudio.Domain.Assets;
using AnimStudio.Domain.Jobs;
using AnimStudio.Domain.Projects;
using AnimStudio.Domain.Publishing;
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
    IAssetRepository assets,
    IRenderJobRepository renderJobs,
    IYouTubePublicationRepository publications,
    ICurrentUser currentUser) : ControllerBase
{
    /// <summary>A timeline is a few hundred KB even for a long video; this is far beyond that.</summary>
    private const int MaxDraftChars = 20 * 1024 * 1024;

    /// <summary>Starting clips one new cut takes; matches the import dialog's batch size.</summary>
    private const int MaxInitialAssets = 50;

    /// <summary>How many of the project's uploads are matched against its cuts' exports.</summary>
    private const int MaxPublicationsScanned = 500;

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

        /// <summary>For Blank: library videos the timeline starts with, in this order.</summary>
        [MaxLength(MaxInitialAssets)] public List<string>? InitialAssetIds { get; init; }
    }

    public sealed record RecordExportRequest
    {
        [Required, MaxLength(64)] public string JobId { get; init; } = string.Empty;
    }

    public sealed record MarkUploadedRequest
    {
        public bool Uploaded { get; init; }

        /// <summary>Optional: the video's YouTube link or 11-character id.</summary>
        [MaxLength(2048)] public string? YouTubeUrl { get; init; }
    }

    /// <summary>
    /// Where a cut stands: exported or not, on YouTube or not. Uploads from the app are found
    /// through the cut's exports; uploads made elsewhere only through the user's own mark.
    /// </summary>
    public enum ExportState { NotExported = 0, Exporting = 1, Exported = 2, Failed = 3 }
    public enum YouTubeState { NotUploaded = 0, Uploaded = 1, MarkedUploaded = 2 }

    public sealed record PublishInfo(
        ExportState ExportState, DateTime? LastExportedAt,
        YouTubeState YouTubeState, string? YouTubeVideoId, string? YouTubeUrl, string? YouTubeHealth,
        DateTime? UploadedAt)
    {
        public static readonly PublishInfo None = new(ExportState.NotExported, null, YouTubeState.NotUploaded, null, null, null, null);
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
        DateTime CreatedAt, DateTime UpdatedAt, int Number, IReadOnlyList<string> InitialAssetIds,
        PublishInfo Publish, string? DraftJson = null);

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
            main.Number = 1;
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

        await NumberUnnumberedAsync(list, ct);
        var info = await LoadPublishInfoAsync(projectId, list, ct);
        return Ok(ApiResponse<IReadOnlyList<EditResponse>>.Ok([.. list.Select(e => ToResponse(e, info))]));
    }

    [HttpGet("{editId}")]
    public async Task<ActionResult<ApiResponse<EditResponse>>> Get(string projectId, string editId, CancellationToken ct)
    {
        var edit = await LoadOwnedEditAsync(projectId, editId, ct);
        return Ok(ApiResponse<EditResponse>.Ok(await RespondAsync(edit, ct, withDraft: true)));
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
        if (existing.Any(e => ProjectEdit.SameName(e.Name, edit.Name)))
            return Conflict(ApiResponse<EditResponse>.Fail(NameTakenMessage(edit.Name)));
        edit.Number = NextNumber(existing);

        if (request.InitialAssetIds is { Count: > 0 } initialIds)
        {
            if (request.Mode != CreateMode.Blank)
                return BadRequest(ApiResponse<EditResponse>.Fail("Starting clips only go with an empty timeline."));

            // Only this project's videos, each once, in the order asked.
            var wanted = initialIds.Where(id => !string.IsNullOrWhiteSpace(id)).Distinct(StringComparer.Ordinal).ToList();
            var found = (await assets.GetManyAsync(wanted, ct))
                .Where(a => a.Kind == AssetKind.Video && string.Equals(a.ProjectId, projectId, StringComparison.Ordinal))
                .ToDictionary(a => a.Id, StringComparer.Ordinal);
            var ordered = wanted.Where(found.ContainsKey).Select(id => found[id]).ToList();
            if (ordered.Count == 0)
                return BadRequest(ApiResponse<EditResponse>.Fail("None of those videos are in this project's library."));

            edit.InitialAssetIds = [.. ordered.Select(a => a.Id)];
            edit.ClipCount = ordered.Count;
            edit.DurationSeconds = Math.Round(ordered.Sum(a => a.Probe.DurationSeconds ?? 0), 2);
            edit.ThumbnailAssetId = ordered[0].Id;
        }

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
                if (start < 0 || end - start < 1)
                    return BadRequest(ApiResponse<EditResponse>.Fail("The part to keep must be at least one second long."));

                // A source made from part of another and never opened still holds the whole
                // copied timeline, and the part chosen here is measured on its own (shorter)
                // timeline - so it is offset into that copy and kept inside its part.
                if (source.PendingRangeStart is { } sourceStart && source.PendingRangeEnd is { } sourceEnd)
                {
                    start += sourceStart;
                    end = Math.Min(end + sourceStart, sourceEnd);
                    if (end - start < 1)
                        return BadRequest(ApiResponse<EditResponse>.Fail("The part to keep must be at least one second long."));
                }

                edit.PendingRangeStart = start;
                edit.PendingRangeEnd = end;
                edit.DurationSeconds = end - start;
            }
            else
            {
                // A copy of a not-yet-opened part is that same part.
                edit.PendingRangeStart = source.PendingRangeStart;
                edit.PendingRangeEnd = source.PendingRangeEnd;
            }
        }

        await edits.InsertAsync(edit, ct);
        return Ok(ApiResponse<EditResponse>.Ok(ToResponse(edit, null)));
    }

    [HttpPatch("{editId}")]
    public async Task<ActionResult<ApiResponse<EditResponse>>> Update(
        string projectId, string editId, [FromBody] UpdateEditRequest request, CancellationToken ct)
    {
        var edit = await LoadOwnedEditAsync(projectId, editId, ct);

        var oldName = edit.Name;
        if (request.Name is not null) edit.Name = request.Name;
        if (request.Format is { } format) edit.Format = format;
        if (request.Category is not null) edit.Category = request.Category;
        if (request.Tags is not null) edit.Tags = request.Tags;
        edit.NormalizeLabels();

        if (!ProjectEdit.SameName(oldName, edit.Name))
        {
            var others = await edits.ListByProjectAsync(projectId, ct);
            if (others.Any(e => e.Id != edit.Id && ProjectEdit.SameName(e.Name, edit.Name)))
                return Conflict(ApiResponse<EditResponse>.Fail(NameTakenMessage(edit.Name)));
        }
        edit.UpdatedAt = DateTime.UtcNow;

        await edits.ReplaceAsync(edit, ct);
        return Ok(ApiResponse<EditResponse>.Ok(await RespondAsync(edit, ct)));
    }

    /// <summary>The editor queued an export of this cut; its result counts as this cut's.</summary>
    [HttpPost("{editId}/exports")]
    public async Task<ActionResult<ApiResponse<EditResponse>>> RecordExport(
        string projectId, string editId, [FromBody] RecordExportRequest request, CancellationToken ct)
    {
        var edit = await LoadOwnedEditAsync(projectId, editId, ct);

        var job = await renderJobs.GetAsync(request.JobId, ct);
        if (job is null
            || !string.Equals(job.ProjectId, projectId, StringComparison.Ordinal)
            || !string.Equals(job.UserId, currentUser.UserId, StringComparison.Ordinal))
            throw new KeyNotFoundException();

        edit.RecordExport(job.Id);
        await edits.ReplaceAsync(edit, ct);
        return Ok(ApiResponse<EditResponse>.Ok(await RespondAsync(edit, ct)));
    }

    /// <summary>
    /// "I uploaded this one myself": marks (or unmarks) the cut as on YouTube, for uploads
    /// made outside the app that it cannot see.
    /// </summary>
    [HttpPut("{editId}/uploaded")]
    public async Task<ActionResult<ApiResponse<EditResponse>>> MarkUploaded(
        string projectId, string editId, [FromBody] MarkUploadedRequest request, CancellationToken ct)
    {
        var edit = await LoadOwnedEditAsync(projectId, editId, ct);

        string? videoId = null;
        if (request.Uploaded && !string.IsNullOrWhiteSpace(request.YouTubeUrl))
        {
            var raw = request.YouTubeUrl.Trim();
            videoId = YouTubeRelatedVideos.IsVideoId(raw) ? raw : YouTubeUrlValidator.Validate(raw).VideoId;
            if (videoId is null)
                return BadRequest(ApiResponse<EditResponse>.Fail("That is not a YouTube video link."));
        }

        edit.MarkedUploaded = request.Uploaded;
        edit.MarkedYouTubeVideoId = request.Uploaded ? videoId : null;
        edit.MarkedUploadedAt = request.Uploaded ? DateTime.UtcNow : null;
        await edits.ReplaceAsync(edit, ct);
        return Ok(ApiResponse<EditResponse>.Ok(await RespondAsync(edit, ct)));
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
        // A saved timeline is the cut from now on; the clips it started with are in it.
        edit.InitialAssetIds = [];
        edit.UpdatedAt = DateTime.UtcNow;

        await edits.ReplaceAsync(edit, ct);
        return Ok(ApiResponse<EditResponse>.Ok(await RespondAsync(edit, ct)));
    }

    [HttpPost("{editId}/duplicate")]
    public async Task<ActionResult<ApiResponse<EditResponse>>> Duplicate(
        string projectId, string editId, CancellationToken ct)
    {
        var source = await LoadOwnedEditAsync(projectId, editId, ct);

        var existing = await edits.ListByProjectAsync(projectId, ct);
        if (existing.Count >= ProjectEdit.MaxPerProject)
            return BadRequest(ApiResponse<EditResponse>.Fail($"A project can hold up to {ProjectEdit.MaxPerProject} videos and Shorts."));

        var copy = NewEdit(projectId, UniqueCopyName(source.Name, existing), source.Format, source.Category, source.Tags);
        copy.Number = NextNumber(existing);
        copy.InitialAssetIds = [.. source.InitialAssetIds];
        copy.DraftJson = source.DraftJson;
        copy.SourceEditId = source.Id;
        copy.PendingRangeStart = source.PendingRangeStart;
        copy.PendingRangeEnd = source.PendingRangeEnd;
        copy.DurationSeconds = source.DurationSeconds;
        copy.ClipCount = source.ClipCount;
        copy.ThumbnailAssetId = source.ThumbnailAssetId;

        await edits.InsertAsync(copy, ct);
        return Ok(ApiResponse<EditResponse>.Ok(ToResponse(copy, null)));
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

    private static string NameTakenMessage(string name) =>
        $"This project already has a video named \"{name}\". Pick another name.";

    /// <summary>Numbers are never reused, so a deleted #5 stays a gap rather than a second #5.</summary>
    private static int NextNumber(IReadOnlyCollection<ProjectEdit> existing) =>
        Math.Max(existing.Count, existing.Select(e => e.Number).DefaultIfEmpty(0).Max()) + 1;

    /// <summary>"Short 3 (copy)", then "Short 3 (copy 2)"... - whichever is free.</summary>
    private static string UniqueCopyName(string name, IReadOnlyCollection<ProjectEdit> existing)
    {
        // Leaves room for the suffix inside the name limit.
        var stem = name.Length > ProjectEdit.MaxNameLength - 12 ? name[..(ProjectEdit.MaxNameLength - 12)].TrimEnd() : name;
        for (var n = 1; ; n++)
        {
            var candidate = n == 1 ? $"{stem} (copy)" : $"{stem} (copy {n})";
            if (!existing.Any(e => ProjectEdit.SameName(e.Name, candidate))) return candidate;
        }
    }

    /// <summary>Cuts from before numbering get numbers in the order they were made, once.</summary>
    private async Task NumberUnnumberedAsync(IReadOnlyList<ProjectEdit> list, CancellationToken ct)
    {
        var unnumbered = list.Where(e => e.Number <= 0).OrderBy(e => e.CreatedAt).ThenBy(e => e.Id, StringComparer.Ordinal).ToList();
        if (unnumbered.Count == 0) return;

        var next = list.Select(e => e.Number).DefaultIfEmpty(0).Max() + 1;
        foreach (var edit in unnumbered)
        {
            edit.Number = next++;
            // The listing leaves the timeline out; writing this copy back would erase it.
            var full = await edits.GetAsync(edit.Id, ct);
            if (full is null) continue;
            full.Number = edit.Number;
            await edits.ReplaceAsync(full, ct);
        }
    }

    /// <summary>
    /// Export and YouTube state for each cut. One read of the project's jobs and uploads,
    /// and only when some cut has exports to look up.
    /// </summary>
    private async Task<IReadOnlyDictionary<string, PublishInfo>> LoadPublishInfoAsync(
        string projectId, IReadOnlyCollection<ProjectEdit> list, CancellationToken ct)
    {
        var jobsById = new Dictionary<string, RenderJob>(StringComparer.Ordinal);
        var uploadsByJob = new Dictionary<string, YouTubePublication>(StringComparer.Ordinal);
        if (list.Any(e => e.ExportJobIds.Count > 0))
        {
            foreach (var job in await renderJobs.ListByProjectAsync(projectId, ct))
                if (string.Equals(job.UserId, currentUser.UserId, StringComparison.Ordinal)) jobsById[job.Id] = job;

            var uploads = await publications.ListByUserAsync(currentUser.UserId, projectId, MaxPublicationsScanned, ct);
            foreach (var p in uploads.Where(p => p.Health != YouTubeVideoHealth.Removed).OrderBy(p => p.PublishedAt))
                uploadsByJob[p.JobId] = p; // newest upload of a job wins
        }

        var result = new Dictionary<string, PublishInfo>(StringComparer.Ordinal);
        foreach (var e in list) result[e.Id] = Describe(e, jobsById, uploadsByJob);
        return result;
    }

    private static PublishInfo Describe(
        ProjectEdit e, IReadOnlyDictionary<string, RenderJob> jobs, IReadOnlyDictionary<string, YouTubePublication> uploads)
    {
        var exportState = ExportState.NotExported;
        DateTime? lastExported = null;
        // Newest first: the latest finished export is what the cut "is"; a newer one still
        // running or failed says so without hiding that an older one succeeded.
        foreach (var id in e.ExportJobIds)
        {
            if (!jobs.TryGetValue(id, out var job)) continue;
            var done = job.Status is RenderJobStatus.Completed or RenderJobStatus.CompletedWithWarnings;
            if (done)
            {
                lastExported = job.CompletedAt ?? job.CreatedAt;
                if (exportState == ExportState.NotExported) exportState = ExportState.Exported;
                break;
            }
            if (exportState == ExportState.NotExported)
                exportState = job.Status is RenderJobStatus.Pending or RenderJobStatus.Processing
                    ? ExportState.Exporting
                    : job.Status == RenderJobStatus.Failed ? ExportState.Failed : ExportState.NotExported;
        }

        var upload = e.ExportJobIds.Select(id => uploads.GetValueOrDefault(id)).OfType<YouTubePublication>()
            .OrderByDescending(p => p.PublishedAt).FirstOrDefault();
        if (upload is not null)
            return new PublishInfo(exportState, lastExported, YouTubeState.Uploaded, upload.VideoId,
                YouTubeRelatedVideos.WatchUrl(upload.VideoId), upload.Health.ToString(), upload.PublishedAt);

        if (e.MarkedUploaded)
            return new PublishInfo(exportState, lastExported, YouTubeState.MarkedUploaded, e.MarkedYouTubeVideoId,
                e.MarkedYouTubeVideoId is { } vid ? YouTubeRelatedVideos.WatchUrl(vid) : null, null, e.MarkedUploadedAt);

        return PublishInfo.None with { ExportState = exportState, LastExportedAt = lastExported };
    }

    private async Task<EditResponse> RespondAsync(ProjectEdit e, CancellationToken ct, bool withDraft = false) =>
        ToResponse(e, await LoadPublishInfoAsync(e.ProjectId, [e], ct), withDraft);

    private static EditResponse ToResponse(ProjectEdit e, IReadOnlyDictionary<string, PublishInfo>? info, bool withDraft = false) => new(
        e.Id, e.Name, e.Format, e.Category, e.Tags, e.DurationSeconds, e.ClipCount,
        e.ThumbnailAssetId, e.SourceEditId, e.PendingRangeStart, e.PendingRangeEnd,
        e.CreatedAt, e.UpdatedAt, e.Number, e.InitialAssetIds,
        info?.GetValueOrDefault(e.Id) ?? PublishInfo.None, // null only for a cut just made: nothing exported yet
        withDraft ? e.DraftJson : null);

    private async Task<Project> LoadOwnedProjectAsync(string projectId, CancellationToken ct)
    {
        var project = await projects.GetAsync(projectId, ct) ?? throw new KeyNotFoundException();
        if (currentUser.IsAdmin || string.IsNullOrEmpty(project.UserId) || string.IsNullOrEmpty(currentUser.UserId))
            return project;

        if (!string.Equals(project.UserId, currentUser.UserId, StringComparison.Ordinal))
            throw new UnauthorizedAccessException();
        return project;
    }

    /// <summary>The cut, only when it is in this project and the caller owns both.</summary>
    private async Task<ProjectEdit> LoadOwnedEditAsync(string projectId, string editId, CancellationToken ct)
    {
        await LoadOwnedProjectAsync(projectId, ct);
        var edit = await edits.GetAsync(editId, ct);
        if (edit is null || !string.Equals(edit.ProjectId, projectId, StringComparison.Ordinal))
            throw new KeyNotFoundException();

        if (currentUser.IsAdmin || string.IsNullOrEmpty(edit.UserId) || string.IsNullOrEmpty(currentUser.UserId))
            return edit;

        if (!string.Equals(edit.UserId, currentUser.UserId, StringComparison.Ordinal))
            throw new KeyNotFoundException();
        return edit;
    }
}
