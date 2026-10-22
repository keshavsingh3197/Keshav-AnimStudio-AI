using AnimStudio.Api.Common;
using AnimStudio.Api.Contracts;
using AnimStudio.Application.Planning;
using AnimStudio.Application.Security;
using AnimStudio.Infrastructure.Planning;
using AnimStudio.Infrastructure.Publishing;
using Microsoft.AspNetCore.Mvc;

namespace AnimStudio.Api.Controllers;

/// <summary>
/// The content calendar: topics, the posts they plan, the YouTube video each one became, and
/// the source links saved per topic. Everything is the caller's own; ownership is checked by
/// <see cref="ContentPlanningService"/> on every read and write.
/// </summary>
[ApiController]
[Route("api/calendar")]
public sealed class ContentCalendarController(
    ContentPlanningService planning,
    ContentCalendarYouTubeService youTube,
    ICurrentUser currentUser) : ControllerBase
{
    // ---------------------------------------------------------------- topics

    [HttpGet("topics")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ContentTopicResponse>>>> ListTopics(CancellationToken ct)
    {
        var list = await planning.ListTopicsAsync(currentUser.UserId, ct);
        return Ok(ApiResponse<IReadOnlyList<ContentTopicResponse>>.Ok([.. list.Select(t => t.ToResponse())]));
    }

    [HttpPost("topics")]
    public async Task<ActionResult<ApiResponse<ContentTopicResponse>>> CreateTopic([FromBody] ContentTopicRequest request, CancellationToken ct)
    {
        var topic = await planning.CreateTopicAsync(currentUser.UserId, request.ToCommand(), ct);
        return Ok(ApiResponse<ContentTopicResponse>.Ok(topic.ToResponse()));
    }

    [HttpPut("topics/{id}")]
    public async Task<ActionResult<ApiResponse<ContentTopicResponse>>> UpdateTopic(string id, [FromBody] ContentTopicRequest request, CancellationToken ct)
    {
        var topic = await planning.UpdateTopicAsync(id, currentUser.UserId, request.ToCommand(), ct);
        return Ok(ApiResponse<ContentTopicResponse>.Ok(topic.ToResponse()));
    }

    /// <summary>Deletes a topic; <paramref name="deletePosts"/> must be true when it still has posts.</summary>
    [HttpDelete("topics/{id}")]
    public async Task<ActionResult<ApiResponse<EmptyPayload>>> DeleteTopic(string id, [FromQuery] bool deletePosts, CancellationToken ct)
    {
        await planning.DeleteTopicAsync(id, currentUser.UserId, deletePosts, ct);
        return Ok(ApiResponse<EmptyPayload>.Ok(EmptyPayload.Value));
    }

    /// <summary>Adds the posts the topic's cadence asks for right now, instead of waiting for the background planner.</summary>
    [HttpPost("topics/{id}/plan")]
    public async Task<ActionResult<ApiResponse<int>>> PlanTopic(string id, CancellationToken ct)
    {
        var topic = await planning.GetTopicAsync(id, currentUser.UserId, ct);
        return Ok(ApiResponse<int>.Ok(await planning.PlanSlotsAsync(topic, ct)));
    }

    // ---------------------------------------------------------------- posts

    /// <summary>Posts going live in [from, to), earliest first. Defaults to the past week through the next eight.</summary>
    [HttpGet("items")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ContentPlanItemResponse>>>> ListItems(
        [FromQuery] DateTime? from, [FromQuery] DateTime? to, [FromQuery] string? topicId, CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        var list = await planning.ListItemsAsync(currentUser.UserId,
            (from ?? now.AddDays(-7)).ToUniversalTime(), (to ?? now.AddDays(56)).ToUniversalTime(),
            string.IsNullOrWhiteSpace(topicId) ? null : topicId, ct);
        return Ok(ApiResponse<IReadOnlyList<ContentPlanItemResponse>>.Ok([.. list.Select(v => v.ToResponse())]));
    }

    [HttpGet("items/{id}")]
    public async Task<ActionResult<ApiResponse<ContentPlanItemResponse>>> GetItem(string id, CancellationToken ct) =>
        Ok(ApiResponse<ContentPlanItemResponse>.Ok((await planning.GetItemViewAsync(id, currentUser.UserId, ct)).ToResponse()));

    [HttpPost("items")]
    public async Task<ActionResult<ApiResponse<ContentPlanItemResponse>>> CreateItem([FromBody] ContentPlanItemRequest request, CancellationToken ct)
    {
        var view = await planning.CreateItemAsync(currentUser.UserId, request.ToCommand(), ct);
        return Ok(ApiResponse<ContentPlanItemResponse>.Ok(view.ToResponse()));
    }

    [HttpPut("items/{id}")]
    public async Task<ActionResult<ApiResponse<ContentPlanItemResponse>>> UpdateItem(string id, [FromBody] ContentPlanItemRequest request, CancellationToken ct)
    {
        var view = await planning.UpdateItemAsync(id, currentUser.UserId, request.ToCommand(), ct);
        return Ok(ApiResponse<ContentPlanItemResponse>.Ok(await FollowPlanAsync(view, ct)));
    }

    // ---------------------------------------------------------------- when a post won't be ready

    /// <summary>The next free day for the post and the ready posts it could trade places with.</summary>
    [HttpGet("items/{id}/recovery")]
    public async Task<ActionResult<ApiResponse<ContentRecoveryResponse>>> Recovery(string id, CancellationToken ct) =>
        Ok(ApiResponse<ContentRecoveryResponse>.Ok((await planning.RecoveryOptionsAsync(id, currentUser.UserId, ct)).ToResponse()));

    [HttpPost("items/{id}/postpone")]
    public async Task<ActionResult<ApiResponse<ContentPlanItemResponse>>> Postpone(string id, [FromBody] ContentPostponeRequest request, CancellationToken ct)
    {
        var view = await planning.PostponeAsync(id, currentUser.UserId, request.PublishAt, ct);
        return Ok(ApiResponse<ContentPlanItemResponse>.Ok(await FollowPlanAsync(view, ct)));
    }

    /// <summary>Trades days with another post of the same topic; returns both.</summary>
    [HttpPost("items/{id}/swap")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ContentPlanItemResponse>>>> Swap(string id, [FromBody] ContentSwapRequest request, CancellationToken ct)
    {
        var views = await planning.SwapAsync(id, request.OtherId, currentUser.UserId, ct);
        var list = new List<ContentPlanItemResponse>(views.Count);
        foreach (var view in views) list.Add(await FollowPlanAsync(view, ct));
        return Ok(ApiResponse<IReadOnlyList<ContentPlanItemResponse>>.Ok(list));
    }

    /// <summary>Quick status change from the calendar (e.g. "mark ready").</summary>
    [HttpPut("items/{id}/status")]
    public async Task<ActionResult<ApiResponse<ContentPlanItemResponse>>> SetStatus(string id, [FromBody] ContentStatusRequest request, CancellationToken ct)
    {
        var view = await planning.SetStatusAsync(id, currentUser.UserId, request.Status, ct);
        return Ok(ApiResponse<ContentPlanItemResponse>.Ok(view.ToResponse()));
    }

    [HttpDelete("items/{id}")]
    public async Task<ActionResult<ApiResponse<EmptyPayload>>> DeleteItem(string id, CancellationToken ct)
    {
        await planning.DeleteItemAsync(id, currentUser.UserId, ct);
        return Ok(ApiResponse<EmptyPayload>.Ok(EmptyPayload.Value));
    }

    // ---------------------------------------------------------------- the YouTube video

    [HttpPut("items/{id}/video")]
    public Task<ActionResult<ApiResponse<ContentPlanItemResponse>>> LinkVideo(string id, [FromBody] ContentLinkVideoRequest request, CancellationToken ct) =>
        OnYouTubeAsync(id, (item, token) => youTube.LinkAsync(item, request.Video, token), ct);

    [HttpDelete("items/{id}/video")]
    public Task<ActionResult<ApiResponse<ContentPlanItemResponse>>> UnlinkVideo(string id, CancellationToken ct) =>
        OnYouTubeAsync(id, youTube.UnlinkAsync, ct);

    [HttpPost("items/{id}/video/confirm")]
    public Task<ActionResult<ApiResponse<ContentPlanItemResponse>>> ConfirmVideo(string id, CancellationToken ct) =>
        OnYouTubeAsync(id, youTube.ConfirmLinkAsync, ct);

    [HttpPost("items/{id}/video/sync")]
    public Task<ActionResult<ApiResponse<ContentPlanItemResponse>>> SyncVideo(string id, CancellationToken ct) =>
        OnYouTubeAsync(id, youTube.SyncAsync, ct);

    /// <summary>Makes the linked video private with YouTube publishing it at the planned time.</summary>
    [HttpPost("items/{id}/video/schedule")]
    public Task<ActionResult<ApiResponse<ContentPlanItemResponse>>> ScheduleVideo(string id, CancellationToken ct) =>
        OnYouTubeAsync(id, youTube.ApplyScheduleAsync, ct);

    /// <summary>Recent uploads on the topic's channel the post could be linked to.</summary>
    [HttpGet("items/{id}/video/candidates")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ContentUploadCandidateResponse>>>> Candidates(string id, CancellationToken ct)
    {
        var item = await planning.GetItemAsync(id, currentUser.UserId, ct);
        try
        {
            var list = await youTube.CandidatesAsync(item, ct);
            return Ok(ApiResponse<IReadOnlyList<ContentUploadCandidateResponse>>.Ok([.. list.Select(c => c.ToResponse())]));
        }
        catch (YouTubePublishException ex)
        {
            return Failure<IReadOnlyList<ContentUploadCandidateResponse>>(ex);
        }
    }

    // ---------------------------------------------------------------- source links

    [HttpGet("links")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ContentSourceLinkResponse>>>> ListLinks(
        [FromQuery] string? topicId, [FromQuery] string? planItemId, CancellationToken ct)
    {
        var list = await planning.ListLinksAsync(currentUser.UserId,
            string.IsNullOrWhiteSpace(topicId) ? null : topicId,
            string.IsNullOrWhiteSpace(planItemId) ? null : planItemId, ct);
        return Ok(ApiResponse<IReadOnlyList<ContentSourceLinkResponse>>.Ok([.. list.Select(l => l.ToResponse())]));
    }

    [HttpPost("links")]
    public async Task<ActionResult<ApiResponse<ContentSourceLinkResponse>>> AddLink([FromBody] ContentSourceLinkRequest request, CancellationToken ct)
    {
        var link = await planning.AddLinkAsync(currentUser.UserId, request.ToCommand(), ct);
        return Ok(ApiResponse<ContentSourceLinkResponse>.Ok(link.ToResponse()));
    }

    [HttpPut("links/{id}")]
    public async Task<ActionResult<ApiResponse<ContentSourceLinkResponse>>> UpdateLink(string id, [FromBody] ContentSourceLinkRequest request, CancellationToken ct)
    {
        var link = await planning.UpdateLinkAsync(id, currentUser.UserId, request.ToCommand(), ct);
        return Ok(ApiResponse<ContentSourceLinkResponse>.Ok(link.ToResponse()));
    }

    [HttpDelete("links/{id}")]
    public async Task<ActionResult<ApiResponse<EmptyPayload>>> DeleteLink(string id, CancellationToken ct)
    {
        await planning.DeleteLinkAsync(id, currentUser.UserId, ct);
        return Ok(ApiResponse<EmptyPayload>.Ok(EmptyPayload.Value));
    }

    // ---------------------------------------------------------------- helpers

    /// <summary>A moved post's linked video follows the new time on YouTube (when the topic allows).</summary>
    private async Task<ContentPlanItemResponse> FollowPlanAsync(ContentPlanItemView view, CancellationToken ct)
    {
        if (view.Item.VideoId is null) return view.ToResponse();
        var item = await youTube.FollowPlanAsync(view.Item, ct);
        return (await planning.ViewAsync(item, ct)).ToResponse();
    }

    private async Task<ActionResult<ApiResponse<ContentPlanItemResponse>>> OnYouTubeAsync(
        string id, Func<Domain.Planning.ContentPlanItem, CancellationToken, Task<Domain.Planning.ContentPlanItem>> action, CancellationToken ct)
    {
        var item = await planning.GetItemAsync(id, currentUser.UserId, ct);
        try
        {
            var updated = await action(item, ct);
            return Ok(ApiResponse<ContentPlanItemResponse>.Ok((await planning.ViewAsync(updated, ct)).ToResponse()));
        }
        catch (YouTubePublishException ex)
        {
            return Failure<ContentPlanItemResponse>(ex);
        }
    }

    private ActionResult<ApiResponse<T>> Failure<T>(YouTubePublishException ex)
    {
        var body = ApiResponse<T>.Fail(ex.Message, new ApiError(ex.Code, ex.Message));
        return ex.Code switch
        {
            "youtube-not-configured" or "encryption-not-configured" => StatusCode(StatusCodes.Status503ServiceUnavailable, body),
            "youtube-unreachable" => StatusCode(StatusCodes.Status502BadGateway, body),
            "youtube-quota" => StatusCode(StatusCodes.Status429TooManyRequests, body),
            _ => BadRequest(body)
        };
    }
}
