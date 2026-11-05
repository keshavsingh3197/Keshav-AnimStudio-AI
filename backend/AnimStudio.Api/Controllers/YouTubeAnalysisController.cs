using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;
using AnimStudio.Api.Common;
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
                [.. i.Findings.Select(f => new YouTubeFindingResponse(f.Kind, f.Text))]),
            a is null ? [] : [.. a.Videos.Select(video => ToResponse(YouTubeChannelAnalyzer.Score(video, now)))],
            a?.Report is { } r ? new YouTubeReportResponse(
                r.Summary, r.WhatWorks, r.WhatToFix,
                [.. r.Suggestions.Select(s => new YouTubeSuggestionResponse(s.Title, s.Detail, s.Priority))],
                [.. r.Plan.Select(p => new YouTubePlanStepResponse(p.When, p.Action))],
                [.. r.Ideas.Select(d => new YouTubeVideoIdeaResponse(d.Title, d.Why, d.Format))],
                r.By, r.Goal, DateTime.SpecifyKind(r.CreatedAtUtc, DateTimeKind.Utc)) : null);
    }

    private static YouTubeAnalyzedVideoResponse ToResponse(YouTubeVideoScore s) => new(
        s.Video.VideoId, s.Video.Title,
        s.Video.PublishedAtUtc is { } at ? DateTime.SpecifyKind(at, DateTimeKind.Utc) : null,
        s.Video.DurationSeconds, s.Video.Privacy, s.Video.Views, s.Video.Likes, s.Video.Comments, s.Video.ThumbnailUrl,
        s.ViewsPerDay, s.Engagement, s.IsShort,
        $"https://www.youtube.com/watch?v={s.Video.VideoId}");
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
    YouTubeReportResponse? Report);

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
    IReadOnlyList<YouTubeFindingResponse> Findings);

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
    string Url);

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
