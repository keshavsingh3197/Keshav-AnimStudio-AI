using AnimStudio.Api.Common;
using AnimStudio.Application.LiveStreams;
using AnimStudio.Domain.LiveStreams;
using Microsoft.AspNetCore.Mvc;

namespace AnimStudio.Api.Controllers;

/// <summary>The saved record of the caller's streams: list, rename, delete one, or clear all.</summary>
public sealed partial class LiveStreamsController
{
    public sealed record LiveStreamHistoryRenameRequest(string? Name);

    [HttpGet("history")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<LiveStreamHistoryEntry>>>> ListHistory(CancellationToken ct)
    {
        var entries = await historyRepository.ListAsync(currentUser.UserId, ct);
        foreach (var entry in entries)
        {
            // A stream that was running when the server stopped will never finish on its own.
            if (entry.State is "Preparing" or "Connecting" or "Live" or "Reconnecting"
                && streams.Get(entry.Id, currentUser.UserId) is null)
            {
                entry.State = "Interrupted";
                entry.Message = "The server restarted while this stream was running.";
            }
        }
        return Ok(ApiResponse<IReadOnlyList<LiveStreamHistoryEntry>>.Ok(entries));
    }

    [HttpPut("history/{id}")]
    public async Task<ActionResult<ApiResponse<LiveStreamHistoryEntry>>> RenameHistory(
        string id, [FromBody] LiveStreamHistoryRenameRequest? request, CancellationToken ct)
    {
        var name = request?.Name?.Trim();
        if (string.IsNullOrEmpty(name) || name.Length > 80)
            return BadRequest(ApiResponse<LiveStreamHistoryEntry>.Fail("Give it a name of up to 80 characters.",
                new ApiError("history-invalid", "Invalid name.")));

        if (!LiveStreamValidator.IsValidId(id)
            || await historyRepository.GetAsync(currentUser.UserId, id, ct) is not { } entry)
            return HistoryNotFound();

        entry.Name = name;
        entry.UpdatedAtUtc = DateTime.UtcNow;
        await historyRepository.UpsertAsync(entry, ct);
        return Ok(ApiResponse<LiveStreamHistoryEntry>.Ok(entry));
    }

    [HttpDelete("history/{id}")]
    public async Task<IActionResult> DeleteHistory(string id, CancellationToken ct)
    {
        if (!LiveStreamValidator.IsValidId(id) || !await historyRepository.DeleteAsync(currentUser.UserId, id, ct))
            return HistoryNotFound();
        return NoContent();
    }

    [HttpDelete("history")]
    public async Task<IActionResult> ClearHistory(CancellationToken ct)
    {
        await historyRepository.DeleteAllAsync(currentUser.UserId, ct);
        return NoContent();
    }

    private NotFoundObjectResult HistoryNotFound() =>
        NotFound(ApiResponse<LiveStreamHistoryEntry>.Fail("That stream isn't in your history.",
            new ApiError("not-found", "History entry not found.")));
}
