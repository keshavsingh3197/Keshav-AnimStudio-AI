using System.Text.Json;
using AnimStudio.Api.Common;
using AnimStudio.Api.Contracts;
using AnimStudio.Api.Security;
using AnimStudio.Application.Admin;
using AnimStudio.Application.Options;
using AnimStudio.Application.Security;
using AnimStudio.Infrastructure.Settings;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace AnimStudio.Api.Controllers;

/// <summary>
/// Deciding who may use AnimStudio: the access-request queue and the accounts it produced.
/// </summary>
/// <remarks>
/// <para>
/// The queue and the accounts live in the central identity service; this controller is a window
/// onto them that carries the administrator's own token, so that service still decides whether
/// the caller may do each thing. What it adds are limits on its own side:
/// </para>
/// <list type="bullet">
/// <item>Only requests made from AnimStudio (<see cref="StudioSignupRules.AppTag"/>) are listed or decided here.</item>
/// <item>An approval grants <see cref="StudioSignupRules.StudioRole"/> and no other role, whatever the client sends - the role the identity service refuses on every other site.</item>
/// <item>Only accounts holding that role and no other can be listed or switched off here. Anyone else's account is somebody else's to manage.</item>
/// <item>Every decision is written to the audit trail.</item>
/// </list>
/// </remarks>
[ApiController]
[Authorize(Policy = AdminAccess.Policy)]
[Route("api/admin")]
public sealed class AdminSignupsController(
    StudioIdentityClient identity,
    AdminAuditService audit,
    WebSettingsService webSettings,
    IOptionsMonitor<AdminOptions> options,
    ICurrentUser currentUser) : ControllerBase
{
    private const int FetchLimit = 500;

    // --- the queue -------------------------------------------------------------------------

    [HttpGet("signups")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<AdminSignupItem>>>> List(
        [FromQuery] string? status, CancellationToken ct)
    {
        var (items, failure) = await LoadRequestsAsync(IdpStatus(status), ct).ConfigureAwait(false);
        if (failure is not null) return Failed<IReadOnlyList<AdminSignupItem>>(failure);
        return Ok(ApiResponse<IReadOnlyList<AdminSignupItem>>.Ok(items!));
    }

    [HttpGet("signups/summary")]
    public async Task<ActionResult<ApiResponse<AdminSignupSummary>>> Summary(CancellationToken ct)
    {
        var (items, failure) = await LoadRequestsAsync(null, ct).ConfigureAwait(false);
        if (failure is not null) return Failed<AdminSignupSummary>(failure);

        var pending = items!.Count(i => i.Status == "Pending");
        var approved = items!.Count(i => i.Status == "Approved");
        var rejected = items!.Count(i => i.Status == "Rejected");
        return Ok(ApiResponse<AdminSignupSummary>.Ok(new AdminSignupSummary(pending, approved, rejected, items!.Count)));
    }

    /// <summary>Approve: creates the account, which can then sign in to AnimStudio only.</summary>
    [HttpPost("signups/{id}/approve")]
    public async Task<ActionResult<ApiResponse<AdminSignupItem>>> Approve(
        string id, [FromBody] AdminSignupDecisionRequest? body, CancellationToken ct)
    {
        var pending = await RequirePendingAsync(id, ct).ConfigureAwait(false);
        if (pending.Failure is not null) return Failed<AdminSignupItem>(pending.Failure);

        // The role is fixed here. Nothing in the request body can widen it.
        var reply = await identity.SendAsync(
            HttpMethod.Post, $"/api/account-requests/admin/{id}/approve",
            new { roles = new[] { StudioSignupRules.StudioRole }, note = StudioSignupRules.CleanNote(body?.Note) },
            HttpContext, forwardBearer: true, ct).ConfigureAwait(false);

        if (!reply.IsSuccess)
        {
            if (reply.Status == StatusCodes.Status400BadRequest)
            {
                const string roleRefused =
                    "The identity service didn't accept the AnimStudio-only role, so nothing was approved. " +
                    "It has to allow the “StudioUser” role for approvals before this can work.";
                return Failed<AdminSignupItem>(Problem(StatusCodes.Status502BadGateway, "identity-role-refused", roleRefused));
            }
            return Failed<AdminSignupItem>(MapFailure(reply, "approve"));
        }

        await audit.RecordAsync("signup.approved", id, null, $"Approved as {StudioSignupRules.StudioRole} (AnimStudio only)", RemoteAddress(), ct)
            .ConfigureAwait(false);
        return Ok(ApiResponse<AdminSignupItem>.Ok(pending.Item! with { Status = "Approved", DecidedAt = DateTime.UtcNow }));
    }

    [HttpPost("signups/{id}/reject")]
    public async Task<ActionResult<ApiResponse<AdminSignupItem>>> Reject(
        string id, [FromBody] AdminSignupDecisionRequest? body, CancellationToken ct)
    {
        var pending = await RequirePendingAsync(id, ct).ConfigureAwait(false);
        if (pending.Failure is not null) return Failed<AdminSignupItem>(pending.Failure);

        var reply = await identity.SendAsync(
            HttpMethod.Post, $"/api/account-requests/admin/{id}/reject",
            new { note = StudioSignupRules.CleanNote(body?.Note) },
            HttpContext, forwardBearer: true, ct).ConfigureAwait(false);
        if (!reply.IsSuccess) return Failed<AdminSignupItem>(MapFailure(reply, "reject"));

        await audit.RecordAsync("signup.rejected", id, null, "Access request rejected", RemoteAddress(), ct).ConfigureAwait(false);
        return Ok(ApiResponse<AdminSignupItem>.Ok(pending.Item! with { Status = "Rejected", DecidedAt = DateTime.UtcNow }));
    }

    // --- open or closed --------------------------------------------------------------------

    [HttpGet("signups/settings")]
    public ActionResult<ApiResponse<AdminSignupSettings>> GetSettings() =>
        Ok(ApiResponse<AdminSignupSettings>.Ok(new AdminSignupSettings(options.CurrentValue.Signup.Enabled)));

    [HttpPut("signups/settings")]
    public async Task<ActionResult<ApiResponse<AdminSignupSettings>>> PutSettings(
        [FromBody] AdminSignupSettingsRequest request, CancellationToken ct)
    {
        await webSettings.SetAsync("Admin:Signup:Enabled", request.Enabled ? "true" : "false", currentUser.UserId, ct).ConfigureAwait(false);
        await audit.RecordAsync("signup.settings", "signup", null, request.Enabled ? "Access requests opened" : "Access requests closed", RemoteAddress(), ct)
            .ConfigureAwait(false);
        return Ok(ApiResponse<AdminSignupSettings>.Ok(new AdminSignupSettings(options.CurrentValue.Signup.Enabled)));
    }

    // --- approved people -------------------------------------------------------------------

    [HttpGet("members")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<AdminMemberItem>>>> Members(CancellationToken ct)
    {
        var reply = await identity.SendAsync(HttpMethod.Get, "/api/users", null, HttpContext, forwardBearer: true, ct).ConfigureAwait(false);
        if (!reply.IsSuccess) return Failed<IReadOnlyList<AdminMemberItem>>(MapFailure(reply, "list"));

        using var doc = reply.Json();
        var members = new List<AdminMemberItem>();
        if (doc?.RootElement.ValueKind == JsonValueKind.Array)
        {
            foreach (var user in doc.RootElement.EnumerateArray())
            {
                if (!StudioSignupRules.IsStudioOnly(ReadStrings(user, "roles"))) continue;
                members.Add(ReadMember(user));
            }
        }
        members.Sort((a, b) => string.Compare(a.Email, b.Email, StringComparison.OrdinalIgnoreCase));
        return Ok(ApiResponse<IReadOnlyList<AdminMemberItem>>.Ok(members));
    }

    /// <summary>Switch an AnimStudio-only account off (ending its sessions) or back on.</summary>
    [HttpPut("members/{id}/active")]
    public async Task<ActionResult<ApiResponse<AdminMemberItem>>> SetActive(
        string id, [FromBody] AdminMemberActiveRequest request, CancellationToken ct)
    {
        if (!StudioSignupRules.IsValidRequestId(id))
            return Failed<AdminMemberItem>(Problem(StatusCodes.Status404NotFound, "member-not-found", "No such account."));

        // Fetch first, so an Admin's or Editor's account can never be switched off through here.
        var current = await identity.SendAsync(HttpMethod.Get, $"/api/users/{id}", null, HttpContext, forwardBearer: true, ct).ConfigureAwait(false);
        if (!current.IsSuccess) return Failed<AdminMemberItem>(MapFailure(current, "find"));
        using (var doc = current.Json())
        {
            if (doc is null || !StudioSignupRules.IsStudioOnly(ReadStrings(doc.RootElement, "roles")))
            {
                return Failed<AdminMemberItem>(Problem(StatusCodes.Status403Forbidden, "not-a-studio-account",
                    "Only AnimStudio-only accounts can be changed here."));
            }
        }

        var reply = await identity.SendAsync(HttpMethod.Put, $"/api/users/{id}", new { isActive = request.Active },
            HttpContext, forwardBearer: true, ct).ConfigureAwait(false);
        if (!reply.IsSuccess) return Failed<AdminMemberItem>(MapFailure(reply, "update"));

        await audit.RecordAsync(request.Active ? "member.reactivated" : "member.deactivated", id, null,
            request.Active ? "AnimStudio account switched on" : "AnimStudio account switched off; sessions revoked", RemoteAddress(), ct).ConfigureAwait(false);

        using var updated = reply.Json();
        return Ok(ApiResponse<AdminMemberItem>.Ok(updated is null ? new AdminMemberItem(id, string.Empty, string.Empty, request.Active, false, null, DateTime.UtcNow) : ReadMember(updated.RootElement)));
    }

    // --- helpers ---------------------------------------------------------------------------

    /// <summary>The identity service's status filter, or null for "all".</summary>
    private static string? IdpStatus(string? status) => status?.Trim().ToLowerInvariant() switch
    {
        "pending" => "Pending",
        "approved" => "Approved",
        "rejected" => "Rejected",
        _ => null,
    };

    private async Task<(IReadOnlyList<AdminSignupItem>? Items, ProblemResult? Failure)> LoadRequestsAsync(string? idpStatus, CancellationToken ct)
    {
        var path = $"/api/account-requests/admin?limit={FetchLimit}" + (idpStatus is null ? string.Empty : $"&status={idpStatus}");
        var reply = await identity.SendAsync(HttpMethod.Get, path, null, HttpContext, forwardBearer: true, ct).ConfigureAwait(false);
        if (!reply.IsSuccess) return (null, MapFailure(reply, "load"));

        using var doc = reply.Json();
        var items = new List<AdminSignupItem>();
        if (doc?.RootElement.ValueKind == JsonValueKind.Array)
        {
            foreach (var row in doc.RootElement.EnumerateArray())
            {
                var reason = ReadString(row, "reason");
                if (!StudioSignupRules.IsStudioRequest(reason)) continue;
                items.Add(new AdminSignupItem(
                    ReadString(row, "id") ?? string.Empty,
                    ReadString(row, "email") ?? string.Empty,
                    ReadString(row, "displayName") ?? string.Empty,
                    StudioSignupRules.ReasonForDisplay(reason),
                    ReadStatus(row),
                    ReadDate(row, "createdAt") ?? DateTime.UtcNow,
                    ReadDate(row, "decidedAt"),
                    ReadString(row, "decisionNote"),
                    ReadString(row, "createdUserId")));
            }
        }
        return (items, null);
    }

    /// <summary>The request, confirmed to be an AnimStudio one that is still waiting - or why not.</summary>
    private async Task<(AdminSignupItem? Item, ProblemResult? Failure)> RequirePendingAsync(string id, CancellationToken ct)
    {
        if (!StudioSignupRules.IsValidRequestId(id))
            return (null, Problem(StatusCodes.Status404NotFound, "request-not-found", "That request doesn't exist."));

        var (items, failure) = await LoadRequestsAsync("Pending", ct).ConfigureAwait(false);
        if (failure is not null) return (null, failure);

        var item = items!.FirstOrDefault(i => string.Equals(i.Id, id, StringComparison.OrdinalIgnoreCase) && i.Status == "Pending");
        return item is null
            ? (null, Problem(StatusCodes.Status409Conflict, "request-not-pending", "That request isn't waiting any more - it may already have been decided."))
            : (item, null);
    }

    private static ProblemResult MapFailure(IdpReply reply, string verb) => reply.Status switch
    {
        StatusCodes.Status401Unauthorized => Problem(StatusCodes.Status401Unauthorized, "identity-unauthorized",
            "Sign in with an administrator account to manage access requests."),
        StatusCodes.Status403Forbidden => Problem(StatusCodes.Status403Forbidden, "identity-forbidden",
            "The identity service says this account may not manage access requests."),
        StatusCodes.Status404NotFound => Problem(StatusCodes.Status404NotFound, "request-not-found", "That request doesn't exist."),
        StatusCodes.Status409Conflict => Problem(StatusCodes.Status409Conflict, "identity-conflict",
            reply.ErrorText() ?? "That request can't be decided again."),
        StatusCodes.Status503ServiceUnavailable => Problem(StatusCodes.Status503ServiceUnavailable, "identity-unavailable",
            "The identity service can't be reached right now. Try again shortly."),
        _ => Problem(StatusCodes.Status502BadGateway, "identity-error", $"The identity service couldn't {verb} that."),
    };

    private static ProblemResult Problem(int status, string code, string message) => new(status, code, message);

    private ActionResult<ApiResponse<T>> Failed<T>(ProblemResult problem) =>
        StatusCode(problem.Status, ApiResponse<T>.Fail(problem.Message, new ApiError(problem.Code, problem.Message)));

    private sealed record ProblemResult(int Status, string Code, string Message);

    private string? RemoteAddress() => HttpContext.Connection.RemoteIpAddress?.ToString();

    private static string? ReadString(JsonElement el, string name) =>
        el.ValueKind == JsonValueKind.Object && el.TryGetProperty(name, out var v) && v.ValueKind == JsonValueKind.String ? v.GetString() : null;

    private static bool ReadBool(JsonElement el, string name) =>
        el.ValueKind == JsonValueKind.Object && el.TryGetProperty(name, out var v) && v.ValueKind == JsonValueKind.True;

    private static DateTime? ReadDate(JsonElement el, string name) =>
        ReadString(el, name) is { } s && DateTime.TryParse(s, null, System.Globalization.DateTimeStyles.AdjustToUniversal | System.Globalization.DateTimeStyles.AssumeUniversal, out var d) ? d : null;

    private static List<string> ReadStrings(JsonElement el, string name)
    {
        var list = new List<string>();
        if (el.ValueKind == JsonValueKind.Object && el.TryGetProperty(name, out var arr) && arr.ValueKind == JsonValueKind.Array)
        {
            foreach (var item in arr.EnumerateArray())
                if (item.ValueKind == JsonValueKind.String && item.GetString() is { Length: > 0 } s) list.Add(s);
        }
        return list;
    }

    /// <summary>The service sends the status as a number or as its name, depending on how it is set up.</summary>
    private static string ReadStatus(JsonElement row)
    {
        if (!row.TryGetProperty("status", out var s)) return "Unknown";
        if (s.ValueKind == JsonValueKind.Number && s.TryGetInt32(out var n))
            return n switch { 0 => "Pending", 1 => "Approved", 2 => "Rejected", _ => "Unknown" };
        var text = s.ValueKind == JsonValueKind.String ? s.GetString() : null;
        return text?.ToLowerInvariant() switch { "pending" => "Pending", "approved" => "Approved", "rejected" => "Rejected", _ => "Unknown" };
    }

    private static AdminMemberItem ReadMember(JsonElement user) => new(
        ReadString(user, "id") ?? string.Empty,
        ReadString(user, "email") ?? string.Empty,
        ReadString(user, "displayName") ?? string.Empty,
        !user.TryGetProperty("isActive", out var active) || active.ValueKind != JsonValueKind.False,
        ReadBool(user, "twoFactorEnabled"),
        ReadDate(user, "lastLoginAt"),
        ReadDate(user, "createdAt") ?? DateTime.UtcNow);
}
