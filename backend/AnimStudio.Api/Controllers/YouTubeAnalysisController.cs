using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;
using AnimStudio.Api.Common;
using AnimStudio.Application.Ingest;
using AnimStudio.Application.Publishing;
using AnimStudio.Application.Security;
using AnimStudio.Domain.Publishing;
using AnimStudio.Infrastructure.Publishing;
using Microsoft.AspNetCore.Mvc;

namespace AnimStudio.Api.Controllers;

/// <summary>
/// Channel analysis: how a connected channel's recent videos are doing, and what to make and do next. Opening it reads only
/// what was kept from the last time; YouTube is asked again on refresh, the text model only for a plan on new numbers.
/// Every call is checked against the caller's own connected channels.
/// </summary>
[ApiController]
[Route("api/youtube/analysis")]
public sealed partial class YouTubeAnalysisController(
    YouTubeChannelAnalysisService analysis,
    ICurrentUser currentUser,
    TimeProvider clock) : ControllerBase
{
    /// <summary>Each refresh spends YouTube quota and each plan a model; only a few of either run at once.</summary>
    private static readonly SemaphoreSlim Slots = new(3, 3);

    [GeneratedRegex("^UC[A-Za-z0-9_-]{22}$")]
    private static partial Regex ChannelIdPattern();

    /// <summary>Every connected channel with what was last found out about it. Calls nothing outside the app.</summary>
    [HttpGet]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<YouTubeChannelAnalysisResponse>>>> List(CancellationToken ct)
    {
        var now = clock.GetUtcNow().UtcDateTime;
        var views = await analysis.ListAsync(currentUser.UserId, ct);
        return Ok(ApiResponse<IReadOnlyList<YouTubeChannelAnalysisResponse>>.Ok([.. views.Select(v => ToResponse(v, now))]));
    }

    [HttpGet("{channelId}")]
    public Task<ActionResult<ApiResponse<YouTubeChannelAnalysisResponse>>> Get(string channelId, CancellationToken ct) =>
        RunAsync(channelId, () => analysis.GetAsync(currentUser.UserId, channelId, ct), limited: false, ct);

    /// <summary>Reads the channel's numbers from YouTube again, unless they are under half an hour old.</summary>
    [HttpPost("{channelId}/refresh")]
    public Task<ActionResult<ApiResponse<YouTubeChannelAnalysisResponse>>> Refresh(string channelId, CancellationToken ct) =>
        RunAsync(channelId, () => analysis.RefreshAsync(currentUser.UserId, channelId, ct), limited: true, ct);

    /// <summary>The advice and the plan. Unchanged numbers and goal give back the kept plan unless <c>fresh</c>.</summary>
    [HttpPost("{channelId}/plan")]
    [RequestSizeLimit(16 * 1024)]
    public Task<ActionResult<ApiResponse<YouTubeChannelAnalysisResponse>>> Plan(
        string channelId, [FromBody] YouTubeChannelPlanRequest request, CancellationToken ct) =>
        RunAsync(channelId, () => analysis.PlanAsync(currentUser.UserId, channelId, request.Goal, request.Fresh, ct), limited: true, ct);

    /// <summary>
    /// Looks up one video by its link (or id): public numbers for any video, and for this channel's own, subscribers gained,
    /// watch time and how it did day by day. Kept, so asking again within a few hours costs nothing.
    /// </summary>
    [HttpPost("{channelId}/videos/lookup")]
    [RequestSizeLimit(8 * 1024)]
    public async Task<ActionResult<ApiResponse<YouTubeVideoLookupResponse>>> Lookup(
        string channelId, [FromBody] YouTubeVideoLookupRequest request, CancellationToken ct)
    {
        if (!ChannelIdPattern().IsMatch(channelId ?? string.Empty))
            return LookupNotFound();
        if (VideoIdFrom(request.Link) is not { } videoId)
        {
            const string invalid = "Paste a YouTube video link, such as https://youtu.be/… or https://www.youtube.com/shorts/…";
            return BadRequest(ApiResponse<YouTubeVideoLookupResponse>.Fail(invalid, new ApiError("video-link-invalid", invalid)));
        }

        if (!await Slots.WaitAsync(TimeSpan.FromSeconds(20), ct))
        {
            const string busy = "Other analyses are running. Try again in a minute.";
            return StatusCode(StatusCodes.Status429TooManyRequests,
                ApiResponse<YouTubeVideoLookupResponse>.Fail(busy, new ApiError("youtube-busy", busy)));
        }

        try
        {
            var found = await analysis.LookupAsync(currentUser.UserId, channelId, videoId, request.Fresh, ct);
            return Ok(ApiResponse<YouTubeVideoLookupResponse>.Ok(ToResponse(found, clock.GetUtcNow().UtcDateTime, withDaily: true)));
        }
        catch (YouTubeAnalysisException ex) when (ex.NotFound)
        {
            return LookupNotFound();
        }
        catch (YouTubeAnalysisException ex)
        {
            return BadRequest(ApiResponse<YouTubeVideoLookupResponse>.Fail(ex.Message, new ApiError(ex.Code, ex.Message)));
        }
        finally
        {
            Slots.Release();
        }
    }

    /// <summary>A video looked up before, with its day-by-day numbers, as it was kept. Calls nothing outside the app.</summary>
    [HttpGet("{channelId}/videos/{videoId}")]
    public async Task<ActionResult<ApiResponse<YouTubeVideoLookupResponse>>> GetLookup(string channelId, string videoId, CancellationToken ct)
    {
        if (!ChannelIdPattern().IsMatch(channelId ?? string.Empty) || !YouTubeRelatedVideos.IsVideoId(videoId))
            return LookupNotFound();
        try
        {
            return await analysis.GetLookupAsync(currentUser.UserId, channelId, videoId, ct) is { } kept
                ? Ok(ApiResponse<YouTubeVideoLookupResponse>.Ok(ToResponse(kept, clock.GetUtcNow().UtcDateTime, withDaily: true)))
                : LookupNotFound();
        }
        catch (YouTubeAnalysisException)
        {
            return LookupNotFound();
        }
    }

    [HttpDelete("{channelId}/videos/{videoId}")]
    public async Task<ActionResult<ApiResponse<object?>>> RemoveLookup(string channelId, string videoId, CancellationToken ct)
    {
        if (!ChannelIdPattern().IsMatch(channelId ?? string.Empty) || !YouTubeRelatedVideos.IsVideoId(videoId))
            return NotFound(ApiResponse<object?>.Fail("Not found.", new ApiError("not-found", "Not found.")));
        try
        {
            await analysis.RemoveLookupAsync(currentUser.UserId, channelId, videoId, ct);
            return Ok(ApiResponse<object?>.Ok(null));
        }
        catch (YouTubeAnalysisException)
        {
            return NotFound(ApiResponse<object?>.Fail("Not found.", new ApiError("not-found", "Not found.")));
        }
    }

    /// <summary>A bare 11-character id, or the id from a YouTube link - rebuilt by the validator, never used as given.</summary>
    private static string? VideoIdFrom(string? link)
    {
        var text = link?.Trim();
        if (YouTubeRelatedVideos.IsVideoId(text)) return text;
        if (text is not null && !text.Contains("://", StringComparison.Ordinal)) text = "https://" + text;
        var result = YouTubeUrlValidator.Validate(text, allowHttp: true);
        return result.IsValid ? result.VideoId : null;
    }

    private NotFoundObjectResult LookupNotFound()
    {
        const string message = "That video or channel isn't in your analysis.";
        return NotFound(ApiResponse<YouTubeVideoLookupResponse>.Fail(message, new ApiError("not-found", message)));
    }

    private async Task<ActionResult<ApiResponse<YouTubeChannelAnalysisResponse>>> RunAsync(
        string channelId, Func<Task<YouTubeChannelAnalysisView>> work, bool limited, CancellationToken ct)
    {
        if (!ChannelIdPattern().IsMatch(channelId ?? string.Empty))
            return Problem404();

        if (limited && !await Slots.WaitAsync(TimeSpan.FromSeconds(20), ct))
        {
            const string busy = "Other analyses are running. Try again in a minute.";
            return StatusCode(StatusCodes.Status429TooManyRequests,
                ApiResponse<YouTubeChannelAnalysisResponse>.Fail(busy, new ApiError("youtube-busy", busy)));
        }

        try
        {
            var view = await work();
            return Ok(ApiResponse<YouTubeChannelAnalysisResponse>.Ok(ToResponse(view, clock.GetUtcNow().UtcDateTime)));
        }
        catch (YouTubeAnalysisException ex) when (ex.NotFound)
        {
            return Problem404();
        }
        catch (YouTubeAnalysisException ex)
        {
            return BadRequest(ApiResponse<YouTubeChannelAnalysisResponse>.Fail(ex.Message, new ApiError(ex.Code, ex.Message)));
        }
        finally
        {
            if (limited) Slots.Release();
        }
    }

    private NotFoundObjectResult Problem404()
    {
        const string message = "That channel isn't connected to your account.";
        return NotFound(ApiResponse<YouTubeChannelAnalysisResponse>.Fail(message, new ApiError("channel-not-found", message)));
    }

    // ------------------------------------------------------------------------------------------------ the wire

    private static YouTubeChannelAnalysisResponse ToResponse(YouTubeChannelAnalysisView v, DateTime now)
    {
        var a = v.Analysis;
        var i = v.Insights;
        return new YouTubeChannelAnalysisResponse(
            v.Channel.ChannelId,
            v.Channel.ChannelTitle,
            v.Channel.ChannelHandle,
            v.Channel.ThumbnailUrl,
            v.Channel.NeedsReconnect,
            v.CanRefresh,
            v.NextRefreshAtUtc,
            a is null || a.FetchedAtUtc == default ? null : DateTime.SpecifyKind(a.FetchedAtUtc, DateTimeKind.Utc),
            a?.FetchError,
            a?.Subscribers,
            a?.TotalViews,
            a?.TotalVideos,
            i is null ? null : new YouTubeInsightsResponse(
                i.PublicVideos, i.MedianViewsPerDay, i.Engagement, i.Shorts, i.LongVideos,
                i.ShortsMedianViewsPerDay, i.LongMedianViewsPerDay, i.DaysBetweenUploads, i.DaysSinceLastUpload, i.BestWeekday,
                [.. i.Top.Select(ToResponse)], [.. i.Low.Select(ToResponse)],
                [.. i.Findings.Select(f => new YouTubeFindingResponse(f.Kind, f.Text))],
                i.Rhythm is { } rh ? new YouTubeRhythmResponse(
                    rh.RecommendedGapDays, rh.FromHistory,
                    [.. rh.Buckets.Select(b => new YouTubeGapBucketResponse(b.Label, b.MinDays, b.Videos, b.MedianScore))],
                    Utc(rh.LastUploadAtUtc), rh.LastUploadTitle, rh.LastIsShort, rh.LastIsHot, rh.Reason) : null),
            a is null ? [] : [.. a.Videos.Select(video => ToResponse(YouTubeChannelAnalyzer.Score(video, now)))],
            a?.Report is { } r ? new YouTubeReportResponse(
                r.Summary, r.WhatWorks, r.WhatToFix,
                [.. r.Suggestions.Select(s => new YouTubeSuggestionResponse(s.Title, s.Detail, s.Priority))],
                [.. r.Plan.Select(p => new YouTubePlanStepResponse(p.When, p.Action))],
                [.. r.Ideas.Select(d => new YouTubeVideoIdeaResponse(d.Title, d.Why, d.Format))],
                r.By, r.Goal, DateTime.SpecifyKind(r.CreatedAtUtc, DateTimeKind.Utc)) : null,
            v.Channel.CanReadAnalytics,
            Utc(a?.AnalyticsFetchedAtUtc),
            a?.AnalyticsError,
            a is null ? [] : [.. a.Daily.Select(ToResponse)],
            // The list carries each lookup without its day-by-day numbers; opening one reads them.
            a is null ? [] : [.. a.Lookups.Select(l => ToResponse(l, now, withDaily: false))]);
    }

    private static YouTubeAnalyzedVideoResponse ToResponse(YouTubeVideoScore s) => new(
        s.Video.VideoId, s.Video.Title,
        Utc(s.Video.PublishedAtUtc),
        s.Video.DurationSeconds, s.Video.Privacy, s.Video.Views, s.Video.Likes, s.Video.Comments, s.Video.ThumbnailUrl,
        s.ViewsPerDay, s.Engagement, s.IsShort,
        $"https://www.youtube.com/watch?v={s.Video.VideoId}",
        s.Video.Analytics is { } an ? ToResponse(an) : null);

    private static YouTubeVideoAnalyticsResponse ToResponse(YouTubeVideoAnalytics a) => new(
        Math.Round(a.WatchMinutes, 1), Math.Round(a.AverageViewSeconds, 1), a.AverageViewPercent, a.SubscribersGained, a.SubscribersLost, a.Shares);

    private static YouTubeDailyPointResponse ToResponse(YouTubeDailyPoint d) => new(
        d.Day.ToString("yyyy-MM-dd", System.Globalization.CultureInfo.InvariantCulture), d.Views, Math.Round(d.WatchMinutes, 1), d.SubscribersGained, d.SubscribersLost);

    private static YouTubeVideoLookupResponse ToResponse(YouTubeVideoLookup l, DateTime now, bool withDaily)
    {
        var score = YouTubeChannelAnalyzer.Score(new YouTubeAnalyzedVideo
        {
            VideoId = l.VideoId, PublishedAtUtc = l.PublishedAtUtc, DurationSeconds = l.DurationSeconds,
            Views = l.Views, Likes = l.Likes, Comments = l.Comments
        }, now);
        return new YouTubeVideoLookupResponse(
            l.VideoId, l.Title, l.Own, Utc(l.PublishedAtUtc), l.DurationSeconds, l.Privacy, l.ThumbnailUrl,
            l.Views, l.Likes, l.Comments, score.ViewsPerDay, score.Engagement, score.IsShort, l.Tags,
            l.Analytics is { } a ? ToResponse(a) : null,
            withDaily ? [.. l.Daily.Select(ToResponse)] : [],
            l.Daily.Count > 0, l.AnalyticsNote, DateTime.SpecifyKind(l.LookedUpAtUtc, DateTimeKind.Utc),
            $"https://www.youtube.com/watch?v={l.VideoId}");
    }

    private static DateTime? Utc(DateTime? at) => at is { } value ? DateTime.SpecifyKind(value, DateTimeKind.Utc) : null;
}

public sealed record YouTubeVideoLookupRequest
{
    /// <summary>A YouTube video link or a bare video id.</summary>
    [Required, StringLength(2048)]
    public string? Link { get; init; }

    /// <summary>Read it from YouTube again even if it was looked up a moment ago.</summary>
    public bool Fresh { get; init; }
}

public sealed record YouTubeChannelPlanRequest
{
    [StringLength(YouTubeChannelAnalysisService.MaxGoalChars)]
    public string? Goal { get; init; }

    /// <summary>Ask the model again even though the numbers and goal are unchanged.</summary>
    public bool Fresh { get; init; }
}

/// <param name="CanRefresh">The numbers can be read again now.</param>
/// <param name="NextRefreshAtUtc">When they can be read again, while they are fresh.</param>
/// <param name="FetchedAtUtc">When the numbers shown were read; null before the first read.</param>
public sealed record YouTubeChannelAnalysisResponse(
    string ChannelId,
    string ChannelTitle,
    string? ChannelHandle,
    string? ThumbnailUrl,
    bool NeedsReconnect,
    bool CanRefresh,
    DateTime? NextRefreshAtUtc,
    DateTime? FetchedAtUtc,
    string? FetchError,
    long? Subscribers,
    long? TotalViews,
    long? TotalVideos,
    YouTubeInsightsResponse? Insights,
    IReadOnlyList<YouTubeAnalyzedVideoResponse> Videos,
    YouTubeReportResponse? Report,
    bool CanReadAnalytics,
    DateTime? AnalyticsFetchedAtUtc,
    string? AnalyticsError,
    IReadOnlyList<YouTubeDailyPointResponse> Daily,
    IReadOnlyList<YouTubeVideoLookupResponse> Lookups);

/// <param name="Day">yyyy-MM-dd.</param>
public sealed record YouTubeDailyPointResponse(string Day, long Views, double WatchMinutes, long SubscribersGained, long SubscribersLost);

public sealed record YouTubeVideoAnalyticsResponse(
    double WatchMinutes, double AverageViewSeconds, double AverageViewPercent, long SubscribersGained, long SubscribersLost, long Shares);

public sealed record YouTubeGapBucketResponse(string Label, int MinDays, int Videos, double MedianScore);

public sealed record YouTubeRhythmResponse(
    double RecommendedGapDays,
    bool FromHistory,
    IReadOnlyList<YouTubeGapBucketResponse> Buckets,
    DateTime? LastUploadAtUtc,
    string? LastUploadTitle,
    bool LastIsShort,
    bool LastIsHot,
    string Reason);

/// <param name="HasDaily">There are day-by-day numbers, even when this answer leaves them out.</param>
public sealed record YouTubeVideoLookupResponse(
    string VideoId,
    string Title,
    bool Own,
    DateTime? PublishedAtUtc,
    double? DurationSeconds,
    string? Privacy,
    string? ThumbnailUrl,
    long? Views,
    long? Likes,
    long? Comments,
    double ViewsPerDay,
    double? Engagement,
    bool IsShort,
    IReadOnlyList<string> Tags,
    YouTubeVideoAnalyticsResponse? Analytics,
    IReadOnlyList<YouTubeDailyPointResponse> Daily,
    bool HasDaily,
    string? AnalyticsNote,
    DateTime LookedUpAtUtc,
    string Url);

public sealed record YouTubeInsightsResponse(
    int PublicVideos,
    double MedianViewsPerDay,
    double? Engagement,
    int Shorts,
    int LongVideos,
    double? ShortsMedianViewsPerDay,
    double? LongMedianViewsPerDay,
    double? DaysBetweenUploads,
    int? DaysSinceLastUpload,
    string? BestWeekday,
    IReadOnlyList<YouTubeAnalyzedVideoResponse> Top,
    IReadOnlyList<YouTubeAnalyzedVideoResponse> Low,
    IReadOnlyList<YouTubeFindingResponse> Findings,
    YouTubeRhythmResponse? Rhythm);

public sealed record YouTubeFindingResponse(string Kind, string Text);

/// <param name="Engagement">Likes and comments per hundred views.</param>
public sealed record YouTubeAnalyzedVideoResponse(
    string VideoId,
    string Title,
    DateTime? PublishedAtUtc,
    double? DurationSeconds,
    string? Privacy,
    long? Views,
    long? Likes,
    long? Comments,
    string? ThumbnailUrl,
    double ViewsPerDay,
    double? Engagement,
    bool IsShort,
    string Url,
    YouTubeVideoAnalyticsResponse? Analytics);

/// <param name="By">The text engine that wrote it, or <c>built-in</c>.</param>
public sealed record YouTubeReportResponse(
    string Summary,
    IReadOnlyList<string> WhatWorks,
    IReadOnlyList<string> WhatToFix,
    IReadOnlyList<YouTubeSuggestionResponse> Suggestions,
    IReadOnlyList<YouTubePlanStepResponse> Plan,
    IReadOnlyList<YouTubeVideoIdeaResponse> Ideas,
    string By,
    string? Goal,
    DateTime CreatedAtUtc);

public sealed record YouTubeSuggestionResponse(string Title, string? Detail, string Priority);

public sealed record YouTubePlanStepResponse(string? When, string Action);

public sealed record YouTubeVideoIdeaResponse(string Title, string? Why, string Format);
