using System.ComponentModel.DataAnnotations;
using AnimStudio.Api.Common;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Publishing;
using AnimStudio.Application.Shorts;
using AnimStudio.Domain.Projects;
using AnimStudio.Infrastructure.Publishing;
using Microsoft.AspNetCore.Mvc;

namespace AnimStudio.Api.Controllers;

public sealed partial class YouTubePublishController
{
    /// <summary>
    /// Publishes many finished renders to one channel in one go. Each is checked and queued
    /// exactly as a single publish is (<see cref="Publish"/>) - same validation, same upload
    /// queue, which already limits how many go up at once - with the details each one would
    /// open the publish dialog with: its own name as the title, the project's description
    /// and music credits, and the channel's defaults for the rest. Anything the request sets
    /// applies to all of them.
    /// <para>
    /// Renders already on YouTube, or on their way, are skipped unless
    /// <see cref="YouTubeBulkPublishRequest.SkipPublished"/> is turned off.
    /// </para>
    /// </summary>
    [HttpPost("render-jobs/bulk-publish")]
    public async Task<ActionResult<ApiResponse<ShortsBulkResponse>>> BulkPublish(
        [FromBody] YouTubeBulkPublishRequest request, [FromServices] IYouTubePublicationRepository publicationRecords, CancellationToken ct)
    {
        if (!request.JobIds.All(ShortsIds.IsEntityId))
            return BadRequest(ApiResponse<ShortsBulkResponse>.Fail("Unknown render.", new ApiError("job-invalid", "Unknown render.", Field: "jobIds")));
        if (!IsChannelId(request.ChannelId))
            return BadRequest(ApiResponse<ShortsBulkResponse>.Fail("Choose a channel to publish to.",
                new ApiError("channel-missing", "Choose a channel to publish to.", Field: "channelId")));

        var userId = currentUser.UserId;
        var alreadyPublished = (await publicationRecords.ListByUserAsync(userId, null, 2000, ct))
            .Select(p => p.JobId).Where(id => !string.IsNullOrEmpty(id)).ToHashSet(StringComparer.Ordinal);
        var inFlight = uploads.List(userId, null)
            .Where(u => u.State is YouTubeUploadState.Queued or YouTubeUploadState.Uploading or YouTubeUploadState.Completed)
            .Select(u => u.JobId).ToHashSet(StringComparer.Ordinal);
        var brand = await settingsRepo.GetAsync(ct);
        var projectCache = new Dictionary<string, Project?>(StringComparer.Ordinal);

        var results = new List<ShortsBulkResult>();
        foreach (var jobId in request.JobIds.Distinct(StringComparer.Ordinal))
        {
            var job = await jobs.GetAsync(jobId, ct);
            // Someone else's render is reported exactly like a missing one.
            if (job is null || !string.Equals(job.UserId, userId, StringComparison.Ordinal))
            {
                results.Add(ShortsBulkResult.Refuse(jobId, "not-found", "This render is no longer there."));
                continue;
            }
            if (!ShortsOverview.IsReady(job))
            {
                results.Add(ShortsBulkResult.Refuse(jobId, "render-not-ready", "This render hasn't finished yet."));
                continue;
            }
            if (request.SkipPublished && (alreadyPublished.Contains(job.Id) || inFlight.Contains(job.Id)))
            {
                results.Add(ShortsBulkResult.Skip(jobId, "already-on-youtube", "Already on YouTube, or on its way."));
                continue;
            }

            if (!projectCache.TryGetValue(job.ProjectId, out var project))
                projectCache[job.ProjectId] = project = await projects.GetAsync(job.ProjectId, ct);
            var defaults = brand?.PublishingFor(project?.Settings.BrandChannelId);

            var description = string.IsNullOrWhiteSpace(request.Description)
                ? YouTubePublishValidator.WithFooter(await DefaultDescriptionAsync(job, project, ct), defaults?.DescriptionFooter)
                : request.Description.Trim();
            var metadata = new YouTubeVideoMetadata
            {
                Title = BulkTitle(job.Name ?? project?.Name, request.TitleSuffix),
                Description = description,
                Tags = request.Tags ?? defaults?.Tags ?? [],
                CategoryId = request.CategoryId ?? defaults?.CategoryId ?? "1",
                Privacy = request.Privacy ?? defaults?.Privacy ?? "public",
                MadeForKids = request.MadeForKids ?? defaults?.MadeForKids ?? false,
                NotifySubscribers = request.NotifySubscribers ?? defaults?.NotifySubscribers ?? true,
            };

            var outcome = await Publish(job.Id,
                new YouTubePublishRequest(request.ChannelId, metadata, FirstComment: request.FirstComment ?? defaults?.FirstComment), ct);
            var body = (outcome.Result as ObjectResult)?.Value as ApiResponse<YouTubeUploadStatus>;
            results.Add(body is { Success: true }
                ? ShortsBulkResult.Start(jobId, "Queued for YouTube.")
                : ShortsBulkResult.Refuse(jobId, body?.Errors.FirstOrDefault()?.Code ?? "youtube-failed", body?.Message ?? "YouTube refused this one."));

            // One bad channel answer (reconnect, not configured) fails every render the same way; stop there.
            if (body is { Success: false } && body.Errors.FirstOrDefault()?.Code is "youtube-channel-not-connected" or "youtube-reconnect" or "youtube-not-configured")
                break;
        }

        logger.LogInformation("User {UserId} bulk-queued {Count} renders for YouTube channel {ChannelId}",
            userId, results.Count(r => r.Ok && !r.Skipped), request.ChannelId);
        return Accepted(ApiResponse<ShortsBulkResponse>.Ok(ShortsBulkResponse.From(results)));
    }

    /// <summary>The render's name, with the suffix (e.g. "#shorts") added when it fits YouTube's title limit.</summary>
    private static string BulkTitle(string? name, string? suffix)
    {
        var title = string.IsNullOrWhiteSpace(name) ? "New short" : name.Trim();
        var tail = string.IsNullOrWhiteSpace(suffix) ? string.Empty : " " + suffix.Trim();
        var room = YouTubePublishValidator.MaxTitleLength - tail.Length;
        if (title.Length > room) title = title[..Math.Max(1, room)].TrimEnd();
        return title + tail;
    }
}

/// <summary>Many renders to one channel. Unset details come from each render's own draft and the channel's defaults.</summary>
public sealed record YouTubeBulkPublishRequest
{
    [Required, MinLength(1), MaxLength(50)]
    public List<string> JobIds { get; init; } = [];

    [Required] public string? ChannelId { get; init; }

    [RegularExpression("^(public|unlisted|private)$")] public string? Privacy { get; init; }
    public bool? MadeForKids { get; init; }
    public bool? NotifySubscribers { get; init; }
    [StringLength(4)] public string? CategoryId { get; init; }

    /// <summary>Added after each title, e.g. "#shorts".</summary>
    [StringLength(40)] public string? TitleSuffix { get; init; }

    /// <summary>One description for all of them; empty keeps each render's own.</summary>
    [StringLength(5000)] public string? Description { get; init; }

    [MaxLength(60)] public List<string>? Tags { get; init; }

    [StringLength(10000)] public string? FirstComment { get; init; }

    public bool SkipPublished { get; init; } = true;
}
