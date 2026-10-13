using System.Text.RegularExpressions;
using AnimStudio.Api.Common;
using AnimStudio.Api.Security;
using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Admin;
using AnimStudio.Application.Ai;
using AnimStudio.Application.Clips;
using AnimStudio.Application.Music;
using AnimStudio.Application.Publishing;
using AnimStudio.Application.Security;
using AnimStudio.Domain.Jobs;
using AnimStudio.Domain.Publishing;
using AnimStudio.Infrastructure.Publishing;
using AnimStudio.Infrastructure.Releases;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AnimStudio.Api.Controllers;

/// <summary>
/// Publish to YouTube: connect one or more channels once with Google sign-in, then send a
/// finished render to the chosen channel in one click - title, description, tags, category,
/// visibility and audience checked against YouTube's limits first, the file uploaded in
/// the background with resumable chunks.
/// <para>
/// Google's redirect lands on the app's own <c>/youtube/callback</c> page, which posts the
/// code here as an ordinary authenticated call. So there is no anonymous endpoint: the
/// <c>state</c> must also belong to the user completing the sign-in.
/// </para>
/// </summary>
[ApiController]
[Route("api/youtube")]
public sealed partial class YouTubePublishController(
    YouTubeConnectionStore connections,
    YouTubeUploadManager uploads,
    YouTubePublicationService publications,
    YouTubeOAuthClient oauth,
    IRenderJobRepository jobs,
    IProjectRepository projects,
    IAssetRepository assets,
    IAiSettingsRepository settingsRepo,
    ISceneRepository scenes,
    IAiExecutor ai,
    IAiProviderRegistry aiProviders,
    IPromptLibrary prompts,
    ICurrentUser currentUser,
    AdminAuditService audit,
    BrandChannelSyncService brandSync,
    ReleaseKitStore releaseKits,
    IAuthorizationService authorization,
    ILogger<YouTubePublishController> logger) : ControllerBase
{
    /// <summary>Brand channels are studio-wide settings, so only an admin's connections change them.</summary>
    private async Task<bool> IsAdminAsync() =>
        (await authorization.AuthorizeAsync(User, AdminAccess.Policy)).Succeeded;

    /// <summary>Writing suggestions keeps a model (or a metered quota) busy, so only a couple run at once.</summary>
    private static readonly SemaphoreSlim SuggestSlots = new(2, 2);

    /// <summary>Health checks call YouTube once per channel; a few at a time is plenty.</summary>
    private static readonly SemaphoreSlim RefreshSlots = new(3, 3);

    [HttpGet("status")]
    public async Task<ActionResult<ApiResponse<YouTubePublishStatusResponse>>> Status(CancellationToken ct)
    {
        var connected = await connections.ListAsync(currentUser.UserId, ct);
        return Ok(ApiResponse<YouTubePublishStatusResponse>.Ok(new YouTubePublishStatusResponse(
            oauth.IsConfigured,
            connected,
            [.. YouTubePublishValidator.Categories.Select(c => new YouTubeCategoryResponse(c.Key, c.Value))],
            new YouTubeLimitsResponse(
                YouTubePublishValidator.MaxTitleLength,
                YouTubePublishValidator.MaxDescriptionBytes,
                YouTubePublishValidator.MaxTagsLength))));
    }

    [HttpPost("oauth/start")]
    public ActionResult<ApiResponse<YouTubeConnectStartResponse>> StartConnect([FromBody] YouTubeConnectStartRequest? request)
    {
        try
        {
            var url = connections.BeginConnect(currentUser.UserId, request?.ReturnPath);
            return Ok(ApiResponse<YouTubeConnectStartResponse>.Ok(new YouTubeConnectStartResponse(url)));
        }
        catch (YouTubePublishException ex)
        {
            return Failure<YouTubeConnectStartResponse>(ex);
        }
    }

    [HttpPost("oauth/complete")]
    public async Task<ActionResult<ApiResponse<YouTubeConnectCompleteResponse>>> CompleteConnect(
        [FromBody] YouTubeConnectCompleteRequest? request, CancellationToken ct)
    {
        try
        {
            var (connection, returnPath) = await connections.CompleteConnectAsync(
                currentUser.UserId, request?.Code, request?.State, ct);

            await audit.RecordAsync("youtube.channel.connect", connection.ChannelId, null, connection.ChannelTitle, RemoteAddress(), ct);

            // An admin connecting a channel gets its brand channel without typing a name:
            // created if none publishes there yet, renamed if the channel was renamed on YouTube.
            if (await IsAdminAsync())
                await brandSync.SyncAsync([connection], createMissing: true, RemoteAddress(), ct);

            return Ok(ApiResponse<YouTubeConnectCompleteResponse>.Ok(new YouTubeConnectCompleteResponse(connection, returnPath)));
        }
        catch (YouTubePublishException ex)
        {
            logger.LogWarning("YouTube connect failed for user {UserId} from {RemoteAddress}: {Code}",
                currentUser.UserId, RemoteAddress(), ex.Code);
            return Failure<YouTubeConnectCompleteResponse>(ex);
        }
    }

    /// <summary>
    /// Re-reads the caller's connected channels from YouTube (name, handle, picture). For an
    /// admin, brand channels publishing to them follow; nothing new is created here.
    /// </summary>
    [HttpPost("channels/refresh")]
    public async Task<ActionResult<ApiResponse<YouTubeRefreshResult>>> RefreshChannels(CancellationToken ct)
    {
        if (!oauth.IsConfigured)
            return Ok(ApiResponse<YouTubeRefreshResult>.Ok(new YouTubeRefreshResult(await connections.ListAsync(currentUser.UserId, ct), [])));

        if (!await RefreshSlots.WaitAsync(TimeSpan.FromSeconds(20), ct))
            return StatusCode(StatusCodes.Status429TooManyRequests, ApiResponse<YouTubeRefreshResult>.Fail(
                "Other checks are running. Try again in a minute.", new ApiError("youtube-busy", "Other checks are running. Try again in a minute.")));
        try
        {
            var result = await connections.RefreshAsync(currentUser.UserId, ct);
            if (await IsAdminAsync())
                await brandSync.SyncAsync(result.Channels, createMissing: false, RemoteAddress(), ct);
            return Ok(ApiResponse<YouTubeRefreshResult>.Ok(result));
        }
        finally
        {
            RefreshSlots.Release();
        }
    }

    [HttpDelete("channels/{channelId}")]
    public async Task<IActionResult> Disconnect(string channelId, CancellationToken ct)
    {
        if (!IsChannelId(channelId) || !await connections.DisconnectAsync(currentUser.UserId, channelId, ct))
            return NotFound(ApiResponse<string>.Fail("That channel isn't connected.", new ApiError("not-found", "That channel isn't connected.")));

        await audit.RecordAsync("youtube.channel.disconnect", channelId, "connected", "none", RemoteAddress(), ct);
        return NoContent();
    }

    /// <summary>
    /// The text engines that could write suggestions right now - hosted ones with a key and
    /// local signed-in CLIs alike - and the tones on offer, for the dialog's pickers.
    /// </summary>
    [HttpGet("suggest-options")]
    public ActionResult<ApiResponse<YouTubeSuggestOptionsResponse>> SuggestOptions()
    {
        var engines = aiProviders.UsableTextProviders()
            .Select(p =>
            {
                var descriptor = KnownAiProviders.Find(p.Id.Value);
                return new YouTubeSuggestEngine(p.Id.Value, descriptor?.DisplayName ?? p.Id.Value, descriptor?.RunsLocally ?? false);
            })
            .ToList();
        var tones = YouTubeMetadataSuggester.Tones.Keys.ToList();
        return Ok(ApiResponse<YouTubeSuggestOptionsResponse>.Ok(new YouTubeSuggestOptionsResponse(engines, tones)));
    }

    /// <summary>Pre-filled details and the file's own checks, for the dialog to open with.</summary>
    [HttpGet("render-jobs/{jobId}/draft")]
    public async Task<ActionResult<ApiResponse<YouTubeDraftResponse>>> Draft(string jobId, CancellationToken ct)
    {
        var job = await LoadOwnedJobAsync(jobId, ct);
        var project = await projects.GetAsync(job.ProjectId, ct);

        var title = (project?.Name ?? string.Empty).Trim();
        if (title.Length > YouTubePublishValidator.MaxTitleLength) title = title[..YouTubePublishValidator.MaxTitleLength].TrimEnd();

        // The project's own description, then what a clip export knows: chapters and credits.
        var details = job.Timeline is { } timeline ? ExportTimelineFormatter.ToPublishingDetails(timeline) : string.Empty;
        // Licensed music asks for credit; a CC BY track without it would breach its licence.
        var musicIds = MusicCredits.AssetIdsUsedBy(job, project);
        var musicCredits = musicIds.Count == 0
            ? string.Empty
            : MusicCredits.Compose((await assets.GetManyAsync(musicIds, ct)).Where(a => a.ProjectId == job.ProjectId));
        var description = string.Join("\n\n",
            new[] { project?.Description?.Trim(), details.Trim(), musicCredits }.Where(p => !string.IsNullOrEmpty(p)));

        var facts = Facts(job);
        var errors = YouTubePublishValidator.CheckVideo(facts, out var warnings);

        // The project's brand channel decides where it goes and what every upload starts with.
        var brandChannelId = project?.Settings.BrandChannelId;
        var brandSettings = await settingsRepo.GetAsync(ct);
        var defaults = brandSettings?.PublishingFor(brandChannelId);
        var brandName = brandSettings?.FindChannel(brandChannelId)?.Name ?? brandSettings?.DefaultChannelName ?? "Default";

        return Ok(ApiResponse<YouTubeDraftResponse>.Ok(new YouTubeDraftResponse(
            title,
            YouTubePublishValidator.WithFooter(description.Trim(), defaults?.DescriptionFooter),
            // The video's own tags start empty; the channel's defaults are added on top of them.
            [],
            defaults?.Tags ?? [],
            defaults?.CategoryId ?? "1",
            defaults?.Privacy ?? "public",
            defaults?.MadeForKids ?? false,
            defaults?.NotifySubscribers ?? true,
            defaults?.YouTubeChannelId,
            brandName,
            new YouTubeVideoFactsResponse(facts.DurationSeconds, facts.SizeBytes, facts.Width, facts.Height, facts.IsVertical),
            errors,
            warnings,
            defaults?.FirstComment)));
    }

    /// <summary>
    /// Suggests a title, description and tags from the project's name, description and
    /// script, with the render's chapters/credits and the brand channel's footer kept below.
    /// Saves nothing: the dialog fills its fields, and the user reviews them before publishing.
    /// </summary>
    [HttpPost("render-jobs/{jobId}/suggest")]
    public async Task<ActionResult<ApiResponse<YouTubeSuggestResponse>>> Suggest(
        string jobId, [FromBody] YouTubeSuggestRequest? request, CancellationToken ct)
    {
        if (request?.Brief is { Length: > YouTubeMetadataSuggester.MaxBriefChars * 4 }
            || request?.Tone is { } tone && !YouTubeMetadataSuggester.Tones.ContainsKey(tone))
            return SuggestFailure(StatusCodes.Status400BadRequest, "suggest-input-invalid",
                $"Keep the notes under {YouTubeMetadataSuggester.MaxBriefChars} characters and pick a tone from the list.");

        var job = await LoadOwnedJobAsync(jobId, ct);
        var project = await projects.GetAsync(job.ProjectId, ct);
        var projectScenes = project is null ? [] : await scenes.ListByProjectAsync(project.Id, ct);

        var chapters = job.Timeline is { } timeline ? ExportTimelineFormatter.Chapters(timeline).Select(c => c.Label) : null;
        var captions = job.ClipMerge?.TimelineItems.Where(i => i.Type == "text").Select(i => i.Src);
        var clipLabels = job.Timeline is { } clipTimeline ? ExportTimelineFormatter.ClipLabels(clipTimeline) : null;
        var summary = YouTubeMetadataSuggester.BuildSummary(project?.Name, project?.Description, projectScenes, chapters, captions, clipLabels);
        var brief = YouTubeMetadataSuggester.CleanBrief(request?.Brief);
        if (summary.Length == 0 && brief.Length > 0) summary = "(Only the creator's notes describe this video.)";
        if (summary.Length == 0)
            return SuggestFailure(StatusCodes.Status400BadRequest, "suggest-nothing-to-go-on",
                "This render has no project name, description or script to write from. Describe the video in the notes box, or fill in the details by hand.");

        // An engine the client names must be one that can answer now; anything else is refused
        // rather than silently falling back to a different (possibly paid) engine.
        string? engine = null;
        if (!string.IsNullOrWhiteSpace(request?.ProviderId))
        {
            engine = aiProviders.UsableTextProviders()
                .Select(p => p.Id.Value)
                .FirstOrDefault(id => string.Equals(id, request.ProviderId, StringComparison.OrdinalIgnoreCase));
            if (engine is null)
                return SuggestFailure(StatusCodes.Status400BadRequest, "suggest-engine-unavailable",
                    "That AI engine isn't turned on or isn't ready. Pick another, or choose Auto.");
        }
        var toneText = YouTubeMetadataSuggester.ToneText(request?.Tone);
        var style = job.ClipMerge is not null ? "an edited short video made from clips" : "animated";

        var language = request?.Language is { } lang && YouTubeMetadataSuggester.Languages.Contains(lang) ? lang : "en";

        RenderedPrompt rendered;
        try
        {
            // An admin-edited (v1) template may not declare tone and brief; they then ride along in
            // "style", which is fenced prose too, so nothing reaches the prompt unfenced.
            var template = await prompts.FindAsync(YouTubeMetadataSuggester.TemplateKey, ct);
            var declared = template?.Variables.ToHashSet(StringComparer.Ordinal) ?? [];
            var briefText = brief.Length > 0 ? brief : "(none)";
            var variables = new Dictionary<string, string?>
            {
                ["summary"] = summary,
                ["language"] = language,
                ["style"] = declared.Contains("tone")
                    ? style
                    : $"{style}. Tone: {toneText}. Creator's notes: {briefText}",
            };
            if (declared.Contains("tone")) variables["tone"] = toneText;
            if (declared.Contains("brief")) variables["brief"] = briefText;

            rendered = await prompts.RenderAsync(YouTubeMetadataSuggester.TemplateKey, variables, ct);
        }
        catch (PromptTemplateException ex)
        {
            logger.LogWarning("YouTube metadata prompt could not be rendered: {Code}", ex.Code);
            return SuggestFailure(StatusCodes.Status503ServiceUnavailable, "suggest-unavailable",
                "The video-metadata prompt is turned off or broken. Check it under Admin > AI prompts.");
        }

        if (!await SuggestSlots.WaitAsync(TimeSpan.FromSeconds(30), ct))
            return SuggestFailure(StatusCodes.Status429TooManyRequests, "youtube-busy",
                "Other suggestions are being written right now. Try again in a minute.");
        AiOutcome<AiTextResult> outcome;
        try
        {
            outcome = await ai.TextAsync(new AiTextRequest
            {
                SystemPrompt = rendered.SystemPrompt,
                Prompt = rendered.Body,
                JsonSchema = rendered.OutputJsonSchema,
                PromptTemplateKey = rendered.TemplateKey,
                PromptTemplateVersion = rendered.Version,
                MaxOutputTokens = 4000,
                Temperature = 0.6,
                BypassCache = request?.Fresh == true,
                ProviderId = engine
            }, new AiCallContext(job.ProjectId, currentUser.UserId), ct);
        }
        finally
        {
            SuggestSlots.Release();
        }

        if (outcome.Kind == AiOutcomeKind.Unavailable && engine is not null)
            return SuggestFailure(StatusCodes.Status503ServiceUnavailable, "suggest-unavailable",
                "That AI engine isn't available just now (off, out of quota, or paused after errors). Try Auto or another engine.");
        if (outcome.Kind == AiOutcomeKind.Unavailable)
            return SuggestFailure(StatusCodes.Status503ServiceUnavailable, "suggest-unavailable",
                "No AI text model is turned on. Enable one under Admin > AI providers, or fill in the details by hand.");
        if (!outcome.IsSuccess)
            return SuggestFailure(StatusCodes.Status502BadGateway, outcome.ErrorCode ?? "suggest-failed",
                "The AI model couldn't write suggestions just now. Try again in a minute.");

        // The model's answer is untrusted: it only fills dialog fields, which publish validates again.
        var suggestion = YouTubeMetadataSuggester.Parse(outcome.Value!.Text);
        if (suggestion is null)
            return SuggestFailure(StatusCodes.Status502BadGateway, "suggest-empty",
                "The AI model's answer wasn't usable. Try again.");

        var brandSettings = await settingsRepo.GetAsync(ct);
        var footer = brandSettings?.PublishingFor(project?.Settings.BrandChannelId)?.DescriptionFooter;
        var renderDetails = job.Timeline is { } t ? ExportTimelineFormatter.ToPublishingDetails(t) : null;

        logger.LogInformation("Suggested YouTube details for render {JobId} with {Provider}.",
            job.Id, outcome.Value.Provenance.ProviderId);
        return Ok(ApiResponse<YouTubeSuggestResponse>.Ok(new YouTubeSuggestResponse(
            suggestion.Title,
            YouTubeMetadataSuggester.ComposeDescription(suggestion.Description, renderDetails, footer),
            suggestion.Tags,
            outcome.Value.Provenance.ProviderId,
            suggestion.TitleOptions,
            // Each option carries the same chapters, credits and footer, so picking one is complete.
            [.. suggestion.DescriptionOptions.Select(d => YouTubeMetadataSuggester.ComposeDescription(d, renderDetails, footer))],
            suggestion.TagIdeas)));
    }

    /// <summary>Checks everything, then queues the upload. Returns at once with an upload to poll.</summary>
    [HttpPost("render-jobs/{jobId}/publish")]
    public async Task<ActionResult<ApiResponse<YouTubeUploadStatus>>> Publish(
        string jobId, [FromBody] YouTubePublishRequest? request, CancellationToken ct)
    {
        var job = await LoadOwnedJobAsync(jobId, ct);

        return await QueueUploadAsync(request, Facts(job), "render", (connection, metadata, related, firstComment) => new YouTubeUploadRequest(
            currentUser.UserId,
            job.Id,
            job.OutputStorageKey!,
            job.OutputSizeBytes ?? 0,
            connection.ChannelId,
            connection.ChannelTitle,
            metadata,
            job.ProjectId,
            related,
            firstComment), ct);
    }

    /// <summary>
    /// The checks every publish shares - channel, related videos, details against YouTube's
    /// limits and the file's facts, first comment - then the upload, queued through
    /// <see cref="YouTubeUploadManager"/>, the one path any video takes to YouTube.
    /// </summary>
    private async Task<ActionResult<ApiResponse<YouTubeUploadStatus>>> QueueUploadAsync(
        YouTubePublishRequest? request,
        YouTubeVideoFacts facts,
        string sourceKind,
        Func<YouTubeChannelConnection, NormalizedYouTubeMetadata, IReadOnlyList<string>, string?, YouTubeUploadRequest> buildUpload,
        CancellationToken ct)
    {
        if (request is null || !IsChannelId(request.ChannelId))
            return BadRequest(ApiResponse<YouTubeUploadStatus>.Fail("Choose a channel to publish to.",
                new ApiError("channel-missing", "Choose a channel to publish to.", Field: "channelId")));

        var connection = await connections.GetAsync(currentUser.UserId, request.ChannelId!, ct);
        if (connection is null)
            return BadRequest(ApiResponse<YouTubeUploadStatus>.Fail("That channel isn't connected.",
                new ApiError("youtube-channel-not-connected", "That channel isn't connected. Connect it first.", Field: "channelId")));
        if (connection.RevokedAt is not null)
            return BadRequest(ApiResponse<YouTubeUploadStatus>.Fail("Reconnect this channel.",
                new ApiError("youtube-reconnect", "YouTube access for this channel has expired or was removed. Connect the channel again.", Field: "channelId")));

        // Related videos must be the user's own app-published videos; the links are built here
        // from stored ids, then the whole description is validated against YouTube's limits.
        var relatedIds = (request.RelatedVideoIds ?? []).Distinct(StringComparer.Ordinal).ToList();
        if (relatedIds.Count > YouTubeRelatedVideos.MaxRelated || relatedIds.Any(id => !YouTubeRelatedVideos.IsVideoId(id)))
            return BadRequest(ApiResponse<YouTubeUploadStatus>.Fail("Choose up to 10 related videos from the list.",
                new ApiError("related-invalid", $"Choose up to {YouTubeRelatedVideos.MaxRelated} related videos from the list.", Field: "relatedVideoIds")));

        var related = await publications.ResolveRelatedAsync(currentUser.UserId, relatedIds, ct);
        if (related.Count != relatedIds.Count)
            return BadRequest(ApiResponse<YouTubeUploadStatus>.Fail("A related video is no longer in your list.",
                new ApiError("related-not-found", "A related video is no longer in your list. Pick again.", Field: "relatedVideoIds")));

        var metadata = request.Metadata is null || related.Count == 0
            ? request.Metadata
            : request.Metadata with { Description = YouTubeRelatedVideos.AppendToDescription(request.Metadata.Description ?? string.Empty, related) };

        var validation = YouTubePublishValidator.Validate(metadata, facts);
        if (!validation.IsValid)
        {
            var first = validation.Errors[0];
            return BadRequest(ApiResponse<YouTubeUploadStatus>.Fail(first.Message,
                [.. validation.Errors.Select(e => new ApiError(e.Code, e.Message, Field: e.Field))]));
        }

        var (firstComment, commentError) = YouTubeCommentRules.Normalize(request.FirstComment);
        if (commentError is not null)
            return BadRequest(ApiResponse<YouTubeUploadStatus>.Fail(commentError.Message,
                new ApiError(commentError.Code, commentError.Message, Field: commentError.Field)));
        // Caught here rather than after the upload, where it could only be a warning.
        if (firstComment is not null && !YouTubeOAuthClient.AllowsComments(connection.Scopes))
            return BadRequest(ApiResponse<YouTubeUploadStatus>.Fail("Reconnect this channel to post comments.",
                new ApiError("youtube-comment-scope",
                    "This channel was connected before AnimStudio could post comments. Reconnect it, or leave the first comment empty.",
                    Field: "firstComment")));

        try
        {
            var upload = buildUpload(connection, validation.Normalized!, [.. related.Select(r => r.VideoId)], firstComment);
            var status = uploads.Start(upload);

            logger.LogInformation("User {UserId} queued {Source} {JobId} for YouTube channel {ChannelId} ({Privacy}, category {CategoryId})",
                currentUser.UserId, sourceKind, upload.JobId, connection.ChannelId, upload.Metadata.Privacy, upload.Metadata.CategoryId);
            return Accepted(ApiResponse<YouTubeUploadStatus>.Ok(status));
        }
        catch (YouTubePublishException ex)
        {
            return Failure<YouTubeUploadStatus>(ex);
        }
    }

    [HttpGet("uploads")]
    public ActionResult<ApiResponse<IReadOnlyList<YouTubeUploadStatus>>> ListUploads([FromQuery] string? jobId) =>
        Ok(ApiResponse<IReadOnlyList<YouTubeUploadStatus>>.Ok(
            uploads.List(currentUser.UserId, string.IsNullOrWhiteSpace(jobId) ? null : jobId)));

    [HttpGet("uploads/{uploadId}")]
    public ActionResult<ApiResponse<YouTubeUploadStatus>> GetUpload(string uploadId) =>
        IsUploadId(uploadId) && uploads.Get(currentUser.UserId, uploadId) is { } status
            ? Ok(ApiResponse<YouTubeUploadStatus>.Ok(status))
            : throw new KeyNotFoundException();

    [HttpPost("uploads/{uploadId}/cancel")]
    public IActionResult CancelUpload(string uploadId) =>
        IsUploadId(uploadId) && uploads.Cancel(currentUser.UserId, uploadId)
            ? NoContent()
            : throw new KeyNotFoundException();

    /// <summary>
    /// Videos uploaded from the app, newest first: the render page's YouTube links and the
    /// related-videos picker. Always the caller's own; <paramref name="projectId"/> only narrows.
    /// </summary>
    [HttpGet("videos")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<YouTubePublicationStatus>>>> ListVideos(
        [FromQuery] string? projectId, CancellationToken ct)
    {
        if (projectId is not null && !IsEntityId(projectId))
            return BadRequest(ApiResponse<IReadOnlyList<YouTubePublicationStatus>>.Fail("Unknown project.",
                new ApiError("project-invalid", "Unknown project.", Field: "projectId")));

        return Ok(ApiResponse<IReadOnlyList<YouTubePublicationStatus>>.Ok(
            await publications.ListAsync(currentUser.UserId, projectId, ct)));
    }

    /// <summary>
    /// Asks YouTube how the caller's videos are doing (rejected, failed, deleted…) and returns
    /// the updated list. Videos checked in the last few minutes are not asked about again, so
    /// reopening the page doesn't spend quota.
    /// </summary>
    [HttpPost("videos/refresh")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<YouTubePublicationStatus>>>> RefreshVideos(
        [FromBody] YouTubeVideosRefreshRequest? request, CancellationToken ct)
    {
        var projectId = request?.ProjectId;
        if (projectId is not null && !IsEntityId(projectId))
            return BadRequest(ApiResponse<IReadOnlyList<YouTubePublicationStatus>>.Fail("Unknown project.",
                new ApiError("project-invalid", "Unknown project.", Field: "projectId")));

        if (!oauth.IsConfigured)
            return Ok(ApiResponse<IReadOnlyList<YouTubePublicationStatus>>.Ok(
                await publications.ListAsync(currentUser.UserId, projectId, ct)));

        if (!await RefreshSlots.WaitAsync(TimeSpan.FromSeconds(20), ct))
            return StatusCode(StatusCodes.Status429TooManyRequests, ApiResponse<IReadOnlyList<YouTubePublicationStatus>>.Fail(
                "Other checks are running. Try again in a minute.", new ApiError("youtube-busy", "Other checks are running. Try again in a minute.")));
        try
        {
            var minAge = request?.Force == true ? TimeSpan.FromSeconds(30) : TimeSpan.FromMinutes(5);
            return Ok(ApiResponse<IReadOnlyList<YouTubePublicationStatus>>.Ok(
                await publications.RefreshAsync(currentUser.UserId, projectId, minAge, ct)));
        }
        finally
        {
            RefreshSlots.Release();
        }
    }

    /// <summary>
    /// The YouTube page: connected channels with subscriber and view counts, and every video
    /// uploaded from the app with its views, likes and comments. Counters are cached for a few
    /// minutes; <paramref name="force"/> re-reads them if the last read is over a minute old.
    /// </summary>
    [HttpGet("dashboard")]
    public async Task<ActionResult<ApiResponse<YouTubeDashboard>>> Dashboard(
        [FromServices] YouTubeDashboardService dashboard, [FromQuery] bool force, CancellationToken ct)
    {
        if (!await RefreshSlots.WaitAsync(TimeSpan.FromSeconds(20), ct))
            return StatusCode(StatusCodes.Status429TooManyRequests, ApiResponse<YouTubeDashboard>.Fail(
                "Other checks are running. Try again in a minute.", new ApiError("youtube-busy", "Other checks are running. Try again in a minute.")));
        try
        {
            return Ok(ApiResponse<YouTubeDashboard>.Ok(await dashboard.GetAsync(currentUser.UserId, force, ct)));
        }
        finally
        {
            RefreshSlots.Release();
        }
    }

    /// <summary>Forgets the app's link to a video. The video on YouTube is not touched.</summary>
    [HttpDelete("videos/{id}")]
    public async Task<IActionResult> ForgetVideo(string id, CancellationToken ct)
    {
        if (!IsUploadId(id) || !await publications.ForgetAsync(currentUser.UserId, id, ct))
            return NotFound(ApiResponse<string>.Fail("That video isn't in your list.", new ApiError("not-found", "That video isn't in your list.")));

        await audit.RecordAsync("youtube.video.forget", id, "linked", "none", RemoteAddress(), ct);
        return NoContent();
    }

    private async Task<RenderJob> LoadOwnedJobAsync(string jobId, CancellationToken ct)
    {
        var job = await jobs.GetAsync(jobId, ct) ?? throw new KeyNotFoundException();

        // Ownership is re-verified on the job itself, not inferred from possessing its id.
        if (!string.Equals(job.UserId, currentUser.UserId, StringComparison.Ordinal))
            throw new UnauthorizedAccessException();

        return job;
    }

    private static YouTubeVideoFacts Facts(RenderJob job) => new(
        job.Status is RenderJobStatus.Completed or RenderJobStatus.CompletedWithWarnings,
        job.OutputStorageKey is not null,
        job.OutputSizeBytes,
        job.Diagnostics?.OutputDurationSeconds,
        job.Width,
        job.Height);

    private ActionResult<ApiResponse<T>> Failure<T>(YouTubePublishException ex)
    {
        var body = ApiResponse<T>.Fail(ex.Message, new ApiError(ex.Code, ex.Message));
        return ex.Code switch
        {
            "youtube-not-configured" or "encryption-not-configured" => StatusCode(StatusCodes.Status503ServiceUnavailable, body),
            "youtube-unreachable" => StatusCode(StatusCodes.Status502BadGateway, body),
            "youtube-busy" or "youtube-too-many-uploads" => StatusCode(StatusCodes.Status429TooManyRequests, body),
            _ => BadRequest(body)
        };
    }

    private ObjectResult SuggestFailure(int status, string code, string message) =>
        StatusCode(status, ApiResponse<YouTubeSuggestResponse>.Fail(message, new ApiError(code, message)));

    private string? RemoteAddress() => HttpContext.Connection.RemoteIpAddress?.ToString();

    private static bool IsChannelId(string? value) => value is not null && ChannelIdPattern().IsMatch(value);
    private static bool IsUploadId(string value) => UploadIdPattern().IsMatch(value);
    private static bool IsEntityId(string value) => EntityIdPattern().IsMatch(value);

    [GeneratedRegex("^UC[A-Za-z0-9_-]{22}$")]
    private static partial Regex ChannelIdPattern();

    [GeneratedRegex("^[0-9a-f]{32}$")]
    private static partial Regex UploadIdPattern();

    [GeneratedRegex("^[A-Za-z0-9_-]{1,64}$")]
    private static partial Regex EntityIdPattern();
}

public sealed record YouTubeConnectStartRequest(string? ReturnPath);
public sealed record YouTubeConnectStartResponse(string AuthorizationUrl);
public sealed record YouTubeConnectCompleteRequest(string? Code, string? State);
public sealed record YouTubeConnectCompleteResponse(YouTubeConnectionStatus Connection, string ReturnPath);

public sealed record YouTubePublishRequest(string? ChannelId, YouTubeVideoMetadata? Metadata, IReadOnlyList<string>? RelatedVideoIds = null,
    /// <summary>Posted as a comment once the video is on YouTube; empty posts nothing.</summary>
    string? FirstComment = null);
public sealed record YouTubeVideosRefreshRequest(string? ProjectId, bool Force);

public sealed record YouTubeSuggestRequest(string? Language, bool Fresh, string? Tone = null, string? Brief = null, string? ProviderId = null);
public sealed record YouTubeSuggestResponse(string Title, string Description, IReadOnlyList<string> Tags, string ProviderId,
    IReadOnlyList<string> TitleOptions, IReadOnlyList<string> DescriptionOptions, IReadOnlyList<string> TagIdeas);
public sealed record YouTubeSuggestEngine(string Id, string Name, bool RunsLocally);
public sealed record YouTubeSuggestOptionsResponse(IReadOnlyList<YouTubeSuggestEngine> Engines, IReadOnlyList<string> Tones);

public sealed record YouTubeCategoryResponse(string Id, string Name);
public sealed record YouTubeLimitsResponse(int MaxTitleLength, int MaxDescriptionBytes, int MaxTagsLength);

public sealed record YouTubePublishStatusResponse(
    bool Configured,
    IReadOnlyList<YouTubeConnectionStatus> Channels,
    IReadOnlyList<YouTubeCategoryResponse> Categories,
    YouTubeLimitsResponse Limits);

public sealed record YouTubeVideoFactsResponse(double? DurationSeconds, long? SizeBytes, int? Width, int? Height, bool IsVertical);

public sealed record YouTubeDraftResponse(
    string Title,
    string Description,
    IReadOnlyList<string> Tags,
    /// <summary>The brand channel's default tags (Admin > Publishing), added to every upload's own.</summary>
    IReadOnlyList<string> ChannelTags,
    string CategoryId,
    string Privacy,
    bool MadeForKids,
    bool NotifySubscribers,
    /// <summary>The YouTube channel the project's brand channel publishes to, if one is set up.</summary>
    string? ChannelId,
    string BrandChannelName,
    YouTubeVideoFactsResponse Video,
    IReadOnlyList<YouTubeCheck> Errors,
    IReadOnlyList<YouTubeCheck> Warnings,
    /// <summary>The brand channel's default first comment, if one is set.</summary>
    string? FirstComment = null);
