using System.ComponentModel.DataAnnotations;
using AnimStudio.Api.Common;
using AnimStudio.Api.Security;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Common;
using AnimStudio.Application.Publishing;
using AnimStudio.Domain.Projects;
using AnimStudio.Domain.Publishing;
using AnimStudio.Infrastructure.Publishing;
using Microsoft.AspNetCore.Mvc;

namespace AnimStudio.Api.Controllers;

/// <summary>
/// The publishing board: finished renders queued with their YouTube details and a time, sent
/// to YouTube by the scheduler when due - or released by YouTube itself at that time, uploaded
/// ahead as private. Videos are added one at a time from the publish dialog or many at once
/// from the exports, then watched, edited, paused, rescheduled or pushed out now from the board.
/// Every item is the caller's own; someone else's reads as not found.
/// </summary>
public sealed partial class YouTubePublishController
{
    [HttpGet("queue")]
    public async Task<ActionResult<ApiResponse<PublishQueueBoard>>> QueueBoard([FromServices] PublishQueueService queue, CancellationToken ct) =>
        Ok(ApiResponse<PublishQueueBoard>.Ok(await queue.BoardAsync(currentUser.UserId, ct)));

    [HttpGet("queue/{id}")]
    public async Task<ActionResult<ApiResponse<PublishQueueItemView>>> QueueItem(string id, [FromServices] PublishQueueService queue, CancellationToken ct) =>
        Ok(ApiResponse<PublishQueueItemView>.Ok(await queue.GetAsync(currentUser.UserId, QueueId(id), ct)));

    /// <summary>The picture uploaded as an item's thumbnail, for its card. Items using a frame show the frame instead.</summary>
    [AllowMediaTicket]
    [HttpGet("queue/{id}/thumbnail")]
    public async Task<IActionResult> QueueThumbnail(string id, [FromServices] PublishQueueService queue, CancellationToken ct)
    {
        var jpeg = await queue.ReadThumbnailAsync(currentUser.UserId, QueueId(id), ct) ?? throw new KeyNotFoundException();
        Response.Headers.CacheControl = "private, max-age=600";
        return File(jpeg, "image/jpeg");
    }

    /// <summary>Finished renders that could go on the board, newest first.</summary>
    [HttpGet("queue/candidates")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<PublishQueueCandidate>>>> QueueCandidates(
        [FromServices] PublishQueueService queue, [FromQuery] int? limit, CancellationToken ct) =>
        Ok(ApiResponse<IReadOnlyList<PublishQueueCandidate>>.Ok(await queue.CandidatesAsync(currentUser.UserId, limit ?? 200, ct)));

    /// <summary>The next good times on a channel, on the caller's clock (an IANA zone such as "Asia/Kolkata").</summary>
    [HttpGet("queue/slots")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<PublishSlot>>>> QueueSlots(
        [FromServices] PublishQueueService queue, [FromQuery] string? channelId, [FromQuery] string? timeZone,
        [FromQuery] bool vertical, [FromQuery] int? count, CancellationToken ct)
    {
        if (channelId is not null && !IsChannelId(channelId))
            return BadRequest(ApiResponse<IReadOnlyList<PublishSlot>>.Fail("Choose a channel from the list.",
                new ApiError("channel-invalid", "Choose a channel from the list.", Field: "channelId")));

        return Ok(ApiResponse<IReadOnlyList<PublishSlot>>.Ok(await queue.SuggestSlotsAsync(
            currentUser.UserId, channelId, PublishSlotSuggester.ResolveTimeZone(timeZone), vertical, count ?? 6, ct)));
    }

    /// <summary>
    /// The categories the video's words point at, best first, with why. With a render, its
    /// project and the channel's default are taken into account too. Saves nothing.
    /// </summary>
    [HttpPost("queue/suggest-category")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<YouTubeCategorySuggestion>>>> SuggestCategory(
        [FromBody] CategorySuggestRequest request, CancellationToken ct)
    {
        Project? project = null;
        if (request.JobId is { } jobId)
        {
            if (!IsEntityId(jobId)) throw new KeyNotFoundException();
            var job = await LoadOwnedJobAsync(jobId, ct);
            project = await projects.GetAsync(job.ProjectId, ct);
        }

        var brand = await settingsRepo.GetAsync(ct);
        return Ok(ApiResponse<IReadOnlyList<YouTubeCategorySuggestion>>.Ok(YouTubeCategorySuggester.Suggest(new YouTubeCategoryInput(
            request.Title, request.Description, request.Tags, project?.Name,
            project?.Settings.ContentType == ProjectContentType.Music,
            brand?.PublishingFor(project?.Settings.BrandChannelId)?.CategoryId))));
    }

    /// <summary>Puts one render on the board with everything the publish dialog collected.</summary>
    [HttpPost("render-jobs/{jobId}/queue")]
    public async Task<ActionResult<ApiResponse<PublishQueueItemView>>> QueueRender(
        string jobId, [FromBody] QueueAddRequest request, [FromServices] PublishQueueService queue, CancellationToken ct)
    {
        RequireMember();
        if (!IsEntityId(jobId)) throw new KeyNotFoundException();
        if (!IsChannelId(request.ChannelId))
            return BadRequest(ApiResponse<PublishQueueItemView>.Fail("Choose a channel to publish to.",
                new ApiError("channel-missing", "Choose a channel to publish to.", Field: "channelId")));

        var view = await queue.AddAsync(currentUser.UserId, new PublishQueueDraft(
            jobId, request.ChannelId, request.Metadata, request.RelatedVideoIds, request.FirstComment, request.Thumbnail,
            request.PlanItemId, request.ScheduledAt, request.Mode, request.Hold, request.Notes), ct);
        return Ok(ApiResponse<PublishQueueItemView>.Ok(view));
    }

    /// <summary>
    /// Many renders onto the board at once, each with the details it would open the publish dialog
    /// with and (unless one is given) the category its own words suggest. Times come from the
    /// suggested slots, a fixed interval, or none (held).
    /// </summary>
    [HttpPost("queue/bulk")]
    public async Task<ActionResult<ApiResponse<ShortsBulkResponse>>> QueueBulk(
        [FromBody] QueueBulkRequest request, [FromServices] PublishQueueService queue,
        [FromServices] IYouTubePublicationRepository publicationRecords, CancellationToken ct)
    {
        RequireMember();
        if (!request.JobIds.All(IsEntityId))
            return BadRequest(ApiResponse<ShortsBulkResponse>.Fail("Unknown render.", new ApiError("job-invalid", "Unknown render.", Field: "jobIds")));
        if (!IsChannelId(request.ChannelId))
            return BadRequest(ApiResponse<ShortsBulkResponse>.Fail("Choose a channel to publish to.",
                new ApiError("channel-missing", "Choose a channel to publish to.", Field: "channelId")));
        if (request.CategoryId is { } pickedCategory && pickedCategory != "auto" && !YouTubePublishValidator.Categories.ContainsKey(pickedCategory))
            return BadRequest(ApiResponse<ShortsBulkResponse>.Fail("Choose a category from the list.",
                new ApiError("category-invalid", "Choose a category from the list.", Field: "categoryId")));

        var userId = currentUser.UserId;
        var jobIds = request.JobIds.Distinct(StringComparer.Ordinal).ToList();
        var loaded = new List<Domain.Jobs.RenderJob>();
        var results = new List<ShortsBulkResult>();
        foreach (var id in jobIds)
        {
            var job = await jobs.GetAsync(id, ct);
            // Someone else's render is reported exactly like a missing one.
            if (job is null || !string.Equals(job.UserId, userId, StringComparison.Ordinal))
                results.Add(ShortsBulkResult.Refuse(id, "not-found", "This render is no longer there."));
            else loaded.Add(job);
        }

        if (request.SkipPublished)
        {
            var published = (await publicationRecords.ListByUserAsync(userId, null, 2000, ct)).Select(p => p.JobId).ToHashSet(StringComparer.Ordinal);
            var board = await queue.BoardAsync(userId, ct);
            var queued = board.Items.Where(i => i.State is PublishQueueState.Waiting or PublishQueueState.Held or PublishQueueState.Uploading)
                .Select(i => i.JobId).ToHashSet(StringComparer.Ordinal);
            foreach (var job in loaded.Where(j => published.Contains(j.Id) || queued.Contains(j.Id)).ToList())
            {
                results.Add(ShortsBulkResult.Skip(job.Id, "already-queued", "Already on YouTube or on the board."));
                loaded.Remove(job);
            }
        }

        var times = await BulkTimesAsync(request, loaded, queue, ct);
        var brand = await settingsRepo.GetAsync(ct);
        var projectCache = new Dictionary<string, Project?>(StringComparer.Ordinal);

        for (var i = 0; i < loaded.Count; i++)
        {
            var job = loaded[i];
            if (!projectCache.TryGetValue(job.ProjectId, out var project))
                projectCache[job.ProjectId] = project = await projects.GetAsync(job.ProjectId, ct);
            var defaults = brand?.PublishingFor(project?.Settings.BrandChannelId);

            var title = BulkTitle(job.Name ?? project?.Name, request.TitleSuffix);
            var description = string.IsNullOrWhiteSpace(request.Description)
                ? YouTubePublishValidator.WithFooter(await DefaultDescriptionAsync(job, project, ct), YouTubeBrandKit.CurrentFooter(defaults, null))
                : request.Description.Trim();
            var tags = request.Tags ?? defaults?.Tags ?? [];
            var isMusic = project?.Settings.ContentType == ProjectContentType.Music;
            var category = request.CategoryId is { } picked && picked != "auto"
                ? picked
                : YouTubeCategorySuggester.Best(new YouTubeCategoryInput(title, description, tags, project?.Name, isMusic, defaults?.CategoryId));

            var metadata = new YouTubeVideoMetadata
            {
                Title = title,
                Description = description,
                Tags = tags,
                CategoryId = category,
                Privacy = request.Privacy ?? defaults?.Privacy ?? "public",
                MadeForKids = request.MadeForKids ?? defaults?.MadeForKids ?? false,
                NotifySubscribers = request.NotifySubscribers ?? defaults?.NotifySubscribers ?? true,
            };

            // Run out of suggested slots: the rest wait on the board rather than going out now.
            var hold = request.Strategy == QueueBulkStrategy.Hold || (request.Strategy == QueueBulkStrategy.Slots && i >= times.Count);
            try
            {
                var view = await queue.AddAsync(userId, new PublishQueueDraft(
                    job.Id, request.ChannelId, metadata, null, request.FirstComment ?? defaults?.FirstComment, null, null,
                    times.ElementAtOrDefault(i), request.Mode, hold, null), ct);
                results.Add(ShortsBulkResult.Start(job.Id, view.ScheduledAt is { } at ? $"Queued for {at:u}." : "On the board, held."));
            }
            catch (EditingException ex)
            {
                results.Add(ShortsBulkResult.Refuse(job.Id, ex.Code, ex.Message));
                // One bad channel answer fails every render the same way; stop there.
                if (ex.Code is "youtube-channel-not-connected" or "youtube-reconnect" or "queue-full") break;
            }
        }

        logger.LogInformation("User {UserId} bulk-queued {Count} renders for YouTube channel {ChannelId} ({Strategy})",
            userId, results.Count(r => r.Ok && !r.Skipped), request.ChannelId, request.Strategy);
        return Ok(ApiResponse<ShortsBulkResponse>.Ok(ShortsBulkResponse.From(results)));
    }

    /// <summary>One time per render, in order; null entries mean "as soon as possible" (or held).</summary>
    private async Task<IReadOnlyList<DateTime?>> BulkTimesAsync(QueueBulkRequest request, IReadOnlyList<Domain.Jobs.RenderJob> loaded, PublishQueueService queue, CancellationToken ct)
    {
        switch (request.Strategy)
        {
            case QueueBulkStrategy.Slots:
                // Shorts get the short-form hours (several a day); anything else one a day.
                var isShort = loaded.Count > 0 && loaded.All(j => j.Height > j.Width && (j.Diagnostics?.OutputDurationSeconds ?? 0) <= YouTubePublishValidator.MaxShortSeconds);
                var slots = await queue.SuggestSlotsAsync(currentUser.UserId, request.ChannelId,
                    PublishSlotSuggester.ResolveTimeZone(request.TimeZone), isShort, loaded.Count, ct);
                return [.. slots.Select(s => (DateTime?)s.At)];
            case QueueBulkStrategy.Interval:
                var start = request.StartAt ?? DateTime.UtcNow;
                var every = TimeSpan.FromHours(Math.Clamp(request.IntervalHours ?? 24, 1, 24 * 30));
                return [.. PublishQueueRules.Spread(start, every, loaded.Count).Select(t => (DateTime?)t)];
            case QueueBulkStrategy.Hold when request.StartAt is not null:
                // Held but with a time to resume at: spread like an interval.
                return [.. PublishQueueRules.Spread(request.StartAt.Value, TimeSpan.FromHours(Math.Clamp(request.IntervalHours ?? 24, 1, 24 * 30)), loaded.Count)
                    .Select(t => (DateTime?)t)];
            default:
                return [];
        }
    }

    [HttpPut("queue/{id}")]
    public async Task<ActionResult<ApiResponse<PublishQueueItemView>>> UpdateQueueItem(
        string id, [FromBody] QueueUpdateRequest request, [FromServices] PublishQueueService queue, CancellationToken ct)
    {
        RequireMember();
        if (request.ChannelId is not null && !IsChannelId(request.ChannelId))
            return BadRequest(ApiResponse<PublishQueueItemView>.Fail("Choose a channel from the list.",
                new ApiError("channel-invalid", "Choose a channel from the list.", Field: "channelId")));

        return Ok(ApiResponse<PublishQueueItemView>.Ok(await queue.UpdateAsync(currentUser.UserId, QueueId(id), new PublishQueueChange(
            request.ChannelId, request.Title, request.Description, request.Tags, request.CategoryId, request.Privacy,
            request.MadeForKids, request.NotifySubscribers, request.FirstComment, request.ScheduledAt, request.Mode, request.Notes,
            request.RemoveThumbnail), ct)));
    }

    [HttpPost("queue/{id}/hold")]
    public async Task<ActionResult<ApiResponse<PublishQueueItemView>>> HoldQueueItem(string id, [FromServices] PublishQueueService queue, CancellationToken ct)
    {
        RequireMember();
        return Ok(ApiResponse<PublishQueueItemView>.Ok(await queue.HoldAsync(currentUser.UserId, QueueId(id), ct)));
    }

    /// <summary>Back on the schedule: at the time given, or its own when that is still ahead.</summary>
    [HttpPost("queue/{id}/schedule")]
    public async Task<ActionResult<ApiResponse<PublishQueueItemView>>> ScheduleQueueItem(
        string id, [FromBody] QueueScheduleRequest? request, [FromServices] PublishQueueService queue, CancellationToken ct)
    {
        RequireMember();
        return Ok(ApiResponse<PublishQueueItemView>.Ok(await queue.ScheduleAsync(currentUser.UserId, QueueId(id), request?.ScheduledAt, ct)));
    }

    [HttpPost("queue/{id}/publish-now")]
    public async Task<ActionResult<ApiResponse<PublishQueueItemView>>> PublishQueueItemNow(string id, [FromServices] PublishQueueService queue, CancellationToken ct)
    {
        RequireMember();
        if (!oauth.IsConfigured)
            return StatusCode(StatusCodes.Status503ServiceUnavailable, ApiResponse<PublishQueueItemView>.Fail(
                "YouTube publishing isn't set up on this server.", new ApiError("youtube-not-configured", "YouTube publishing isn't set up on this server.")));
        return Ok(ApiResponse<PublishQueueItemView>.Ok(await queue.PublishNowAsync(currentUser.UserId, QueueId(id), ct)));
    }

    [HttpPost("queue/{id}/cancel")]
    public async Task<ActionResult<ApiResponse<PublishQueueItemView>>> CancelQueueItem(string id, [FromServices] PublishQueueService queue, CancellationToken ct)
    {
        RequireMember();
        return Ok(ApiResponse<PublishQueueItemView>.Ok(await queue.CancelAsync(currentUser.UserId, QueueId(id), ct)));
    }

    /// <summary>Takes the video off the board. One already on YouTube stays there.</summary>
    [HttpDelete("queue/{id}")]
    public async Task<IActionResult> RemoveQueueItem(string id, [FromServices] PublishQueueService queue, CancellationToken ct)
    {
        RequireMember();
        await queue.RemoveAsync(currentUser.UserId, QueueId(id), ct);
        return NoContent();
    }

    /// <summary>Changing the board sends videos to YouTube, so it needs a signed-in member, as publishing does.</summary>
    private void RequireMember()
    {
        if (!currentUser.IsAuthenticated) throw new UnauthorizedAccessException();
    }

    /// <summary>Queue ids are <c>Guid.ToString("N")</c>; anything else is simply not there.</summary>
    private static string QueueId(string id) => IsUploadId(id) ? id : throw new KeyNotFoundException();
}

public sealed record CategorySuggestRequest(
    [StringLength(64)] string? JobId,
    [StringLength(200)] string? Title,
    [StringLength(10000)] string? Description,
    [MaxLength(80)] IReadOnlyList<string>? Tags);

/// <summary>A render for the board: the publish dialog's request plus when and how it goes out.</summary>
public sealed record QueueAddRequest
{
    [Required] public string? ChannelId { get; init; }
    public YouTubeVideoMetadata? Metadata { get; init; }
    [MaxLength(10)] public List<string>? RelatedVideoIds { get; init; }
    [StringLength(10000)] public string? FirstComment { get; init; }
    public YouTubeThumbnailChoice? Thumbnail { get; init; }
    [StringLength(64)] public string? PlanItemId { get; init; }

    /// <summary>When it should be out (UTC). Null goes out as soon as possible, unless <see cref="Hold"/>.</summary>
    public DateTime? ScheduledAt { get; init; }

    public PublishQueueMode Mode { get; init; } = PublishQueueMode.ReleaseOnYouTube;

    /// <summary>On the board but paused: not pushed until scheduled.</summary>
    public bool Hold { get; init; }

    [StringLength(PublishQueueRules.MaxNotesLength)] public string? Notes { get; init; }
}

public enum QueueBulkStrategy
{
    /// <summary>The suggested slots: the channel's usual hours, else the audience peaks.</summary>
    Slots = 0,

    /// <summary>From <see cref="QueueBulkRequest.StartAt"/>, every <see cref="QueueBulkRequest.IntervalHours"/>.</summary>
    Interval = 1,

    /// <summary>On the board without a time (or with times to resume at, when a start is given).</summary>
    Hold = 2,

    /// <summary>All of them as soon as possible; the upload manager takes them a few at a time.</summary>
    Now = 3
}

/// <summary>Many renders to one channel. Unset details come from each render's own draft and the channel's defaults.</summary>
public sealed record QueueBulkRequest
{
    [Required, MinLength(1), MaxLength(PublishQueueRules.MaxBulk)]
    public List<string> JobIds { get; init; } = [];

    [Required] public string? ChannelId { get; init; }

    public QueueBulkStrategy Strategy { get; init; } = QueueBulkStrategy.Slots;
    public DateTime? StartAt { get; init; }
    [Range(1, 24 * 30)] public int? IntervalHours { get; init; }

    /// <summary>The caller's IANA zone, for the suggested slots' hours.</summary>
    [StringLength(64)] public string? TimeZone { get; init; }

    public PublishQueueMode Mode { get; init; } = PublishQueueMode.ReleaseOnYouTube;

    [RegularExpression("^(public|unlisted|private)$")] public string? Privacy { get; init; }
    public bool? MadeForKids { get; init; }
    public bool? NotifySubscribers { get; init; }

    /// <summary>A category id, or "auto" (the default) to suggest one per video from its own words.</summary>
    [StringLength(4)] public string? CategoryId { get; init; }

    [StringLength(40)] public string? TitleSuffix { get; init; }
    [StringLength(5000)] public string? Description { get; init; }
    [MaxLength(60)] public List<string>? Tags { get; init; }
    [StringLength(10000)] public string? FirstComment { get; init; }

    public bool SkipPublished { get; init; } = true;
}

/// <summary>Changes from the board. A null field is left as it is.</summary>
public sealed record QueueUpdateRequest
{
    public string? ChannelId { get; init; }
    [StringLength(200)] public string? Title { get; init; }
    [StringLength(10000)] public string? Description { get; init; }
    [MaxLength(80)] public List<string>? Tags { get; init; }
    [StringLength(4)] public string? CategoryId { get; init; }
    [RegularExpression("^(public|unlisted|private)$")] public string? Privacy { get; init; }
    public bool? MadeForKids { get; init; }
    public bool? NotifySubscribers { get; init; }
    [StringLength(10000)] public string? FirstComment { get; init; }
    public DateTime? ScheduledAt { get; init; }
    public PublishQueueMode? Mode { get; init; }
    [StringLength(PublishQueueRules.MaxNotesLength)] public string? Notes { get; init; }
    public bool RemoveThumbnail { get; init; }
}

public sealed record QueueScheduleRequest(DateTime? ScheduledAt);
