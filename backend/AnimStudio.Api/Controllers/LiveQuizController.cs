using AnimStudio.Api.Common;
using AnimStudio.Application.LiveStreams;
using AnimStudio.Application.Security;
using AnimStudio.Infrastructure.LiveStreams;
using AnimStudio.Infrastructure.Publishing;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;

namespace AnimStudio.Api.Controllers;

/// <summary>
/// Live Stream Interactive Quiz Host &amp; On-Stream Winner Reveal Overlay API.
/// Polls YouTube Live Chat, merges verified entries from Pratiyogita (<c>AdminDb</c>),
/// and draws an unbiased winner via <c>RandomNumberGenerator.GetInt32</c>.
/// </summary>
[ApiController]
[Route("api/live-quiz")]
public sealed class LiveQuizController(
    LiveQuizService quizzes,
    ICurrentUser currentUser,
    ILogger<LiveQuizController> logger) : ControllerBase
{
    [HttpGet("playbook")]
    [AllowAnonymous]
    public ActionResult<ApiResponse<FirstLivePlaybook>> Playbook() =>
        Ok(ApiResponse<FirstLivePlaybook>.Ok(quizzes.GetFirstLivePlaybook()));

    [HttpGet("active")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<LiveQuizPublicView?>>> Active(
        [FromQuery] string? sessionId,
        CancellationToken ct)
    {
        var active = await quizzes.GetActivePublicViewAsync(sessionId, ct);
        return Ok(ApiResponse<LiveQuizPublicView?>.Ok(active));
    }

    [HttpGet("winners")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<LiveQuizArchiveWinnerDto>>>> Winners(
        [FromQuery] int limit = 30,
        CancellationToken ct = default)
    {
        var raw = await quizzes.ListWinnersRawAsync(limit, ct);
        var mapped = raw.Select(MapArchiveWinner).ToList();
        return Ok(ApiResponse<IReadOnlyList<LiveQuizArchiveWinnerDto>>.Ok(mapped));
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<LiveQuizPublicView>>>> List(CancellationToken ct)
    {
        if (!currentUser.IsAuthenticated)
            return AuthRequired<IReadOnlyList<LiveQuizPublicView>>();

        var list = await quizzes.ListOwnerSessionsAsync(currentUser.UserId, 20, ct);
        return Ok(ApiResponse<IReadOnlyList<LiveQuizPublicView>>.Ok(list));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<LiveQuizPublicView>>> Create(
        [FromBody] CreateLiveQuizSessionInput? request,
        CancellationToken ct)
    {
        if (!currentUser.IsAuthenticated)
            return AuthRequired<LiveQuizPublicView>();

        if (request is null || string.IsNullOrWhiteSpace(request.Question))
            return BadRequest(ApiResponse<LiveQuizPublicView>.Fail("Quiz question is required.",
                new ApiError("quiz-question-missing", "Quiz question is required.")));

        try
        {
            var created = await quizzes.CreateSessionAsync(currentUser.UserId, request, ct);
            return Ok(ApiResponse<LiveQuizPublicView>.Ok(created));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ApiResponse<LiveQuizPublicView>.Fail(ex.Message, new ApiError("quiz-invalid", ex.Message)));
        }
    }

    [HttpPost("{id}/poll-chat")]
    public async Task<ActionResult<ApiResponse<LiveQuizChatPollResult>>> PollChat(
        string id,
        [FromBody] PollLiveQuizChatRequest? request,
        CancellationToken ct)
    {
        if (!currentUser.IsAuthenticated)
            return AuthRequired<LiveQuizChatPollResult>();

        try
        {
            var result = await quizzes.PollYouTubeLiveChatAsync(
                id, currentUser.UserId, request?.BroadcastId, request?.YouTubeChannelId, ct);
            return Ok(ApiResponse<LiveQuizChatPollResult>.Ok(result));
        }
        catch (KeyNotFoundException)
        {
            return NotFound(ApiResponse<LiveQuizChatPollResult>.Fail("Live quiz round not found.",
                new ApiError("quiz-not-found", "Live quiz round not found.")));
        }
        catch (YouTubePublishException ex)
        {
            logger.LogWarning("YouTube live chat poll failed for quiz {QuizId}: {Code}", id, ex.Code);
            return BadRequest(ApiResponse<LiveQuizChatPollResult>.Fail(ex.Message, new ApiError(ex.Code, ex.Message)));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<LiveQuizChatPollResult>.Fail(ex.Message, new ApiError("quiz-poll-invalid", ex.Message)));
        }
    }

    [HttpPost("{id}/entrants")]
    public async Task<ActionResult<ApiResponse<LiveQuizPublicView>>> AddEntrant(
        string id,
        [FromBody] AddQuizEntrantInput? request,
        CancellationToken ct)
    {
        if (!currentUser.IsAuthenticated)
            return AuthRequired<LiveQuizPublicView>();

        if (request is null)
            return BadRequest(ApiResponse<LiveQuizPublicView>.Fail("Entrant payload required."));

        try
        {
            var updated = await quizzes.AddEntrantAsync(id, currentUser.UserId, request, ct);
            return Ok(ApiResponse<LiveQuizPublicView>.Ok(updated));
        }
        catch (KeyNotFoundException)
        {
            return NotFound(ApiResponse<LiveQuizPublicView>.Fail("Live quiz round not found."));
        }
        catch (Exception ex) when (ex is ArgumentException or InvalidOperationException)
        {
            return BadRequest(ApiResponse<LiveQuizPublicView>.Fail(ex.Message));
        }
    }

    [HttpPost("{id}/close")]
    public async Task<ActionResult<ApiResponse<LiveQuizPublicView>>> Close(string id, CancellationToken ct)
    {
        if (!currentUser.IsAuthenticated)
            return AuthRequired<LiveQuizPublicView>();

        try
        {
            var closed = await quizzes.CloseSessionAsync(id, currentUser.UserId, ct);
            return Ok(ApiResponse<LiveQuizPublicView>.Ok(closed));
        }
        catch (KeyNotFoundException)
        {
            return NotFound(ApiResponse<LiveQuizPublicView>.Fail("Live quiz round not found."));
        }
    }

    [HttpPost("{id}/draw-winner")]
    public async Task<ActionResult<ApiResponse<LiveQuizPublicView>>> DrawWinner(string id, CancellationToken ct)
    {
        if (!currentUser.IsAuthenticated)
            return AuthRequired<LiveQuizPublicView>();

        try
        {
            var drawn = await quizzes.DrawWinnerAsync(id, currentUser.UserId, randomIndexProvider: null, ct);
            return Ok(ApiResponse<LiveQuizPublicView>.Ok(drawn));
        }
        catch (KeyNotFoundException)
        {
            return NotFound(ApiResponse<LiveQuizPublicView>.Fail("Live quiz round not found."));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<LiveQuizPublicView>.Fail(ex.Message, new ApiError("quiz-no-eligible", ex.Message)));
        }
    }

    private ActionResult<ApiResponse<T>> AuthRequired<T>() =>
        StatusCode(StatusCodes.Status403Forbidden, ApiResponse<T>.Fail(
            "Sign in with a creator/admin account to manage live quiz rounds.",
            new ApiError("auth-required", "Sign in required.")));

    private static LiveQuizArchiveWinnerDto MapArchiveWinner(BsonDocument d) => new(
        Id: d.TryGetValue("_id", out var id) && id.IsString ? id.AsString : string.Empty,
        SessionId: Str(d, "SessionId") ?? string.Empty,
        StreamTitle: Str(d, "StreamTitle") ?? string.Empty,
        StreamChannelHandle: Str(d, "StreamChannelHandle") ?? string.Empty,
        Question: Str(d, "Question") ?? string.Empty,
        QuestionHi: Str(d, "QuestionHi"),
        WinnerChannelId: Str(d, "WinnerChannelId") ?? string.Empty,
        WinnerChannelTitle: Str(d, "WinnerChannelTitle") ?? string.Empty,
        WinnerChannelHandle: Str(d, "WinnerChannelHandle"),
        WinnerThumbnailUrl: Str(d, "WinnerThumbnailUrl"),
        WinnerSource: Str(d, "WinnerSource") ?? string.Empty,
        PrizeTitle: Str(d, "PrizeTitle") ?? string.Empty,
        TotalEntrants: d.TryGetValue("TotalEntrants", out var te) && te.IsInt32 ? te.AsInt32 : 0,
        EligibleEntrants: d.TryGetValue("EligibleEntrants", out var ee) && ee.IsInt32 ? ee.AsInt32 : 0,
        SelectedAtUtc: d.TryGetValue("SelectedAtUtc", out var sa) && sa.IsValidDateTime ? sa.ToUniversalTime() : DateTime.UtcNow);

    private static string? Str(BsonDocument doc, string name) =>
        doc.TryGetValue(name, out var v) && v.IsString && !string.IsNullOrWhiteSpace(v.AsString) ? v.AsString : null;
}

public sealed record PollLiveQuizChatRequest(string? BroadcastId, string? YouTubeChannelId);

public sealed record LiveQuizArchiveWinnerDto(
    string Id,
    string SessionId,
    string StreamTitle,
    string StreamChannelHandle,
    string Question,
    string? QuestionHi,
    string WinnerChannelId,
    string WinnerChannelTitle,
    string? WinnerChannelHandle,
    string? WinnerThumbnailUrl,
    string WinnerSource,
    string PrizeTitle,
    int TotalEntrants,
    int EligibleEntrants,
    DateTime SelectedAtUtc);
