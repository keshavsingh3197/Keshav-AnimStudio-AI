using AnimStudio.Api.Common;
using AnimStudio.Api.Security;
using AnimStudio.Application.Admin;
using AnimStudio.Application.Security;
using AnimStudio.Infrastructure.Settings;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AnimStudio.Api.Controllers;

/// <summary>
/// Application settings stored in the WebSettings table: list them with where each value
/// comes from, change or reset one (applied at once), and refresh to pick up rows changed in
/// the database directly. Admin only, and every change is in the audit trail.
/// </summary>
[ApiController]
[Route("api/admin/settings")]
[Authorize(Policy = AdminAccess.Policy)]
public sealed class AdminSettingsController(
    WebSettingsService settings,
    AdminAuditService audit,
    ICurrentUser currentUser) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<WebSettingsOverview>>> List(CancellationToken ct) =>
        Ok(ApiResponse<WebSettingsOverview>.Ok(await settings.DescribeAsync(ct)));

    [HttpPut]
    public async Task<ActionResult<ApiResponse<WebSettingsOverview>>> Set([FromBody] SetWebSettingRequest? request, CancellationToken ct)
    {
        try
        {
            var (before, after) = await settings.SetAsync(request?.Key, request?.Value, currentUser.UserId, ct);
            await audit.RecordAsync("settings.update", request!.Key, before, after, RemoteAddress(), ct);
            return Ok(ApiResponse<WebSettingsOverview>.Ok(await settings.DescribeAsync(ct)));
        }
        catch (WebSettingException ex)
        {
            return BadRequest(ApiResponse<WebSettingsOverview>.Fail(ex.Message, new ApiError(ex.Code, ex.Message, Field: "value")));
        }
    }

    [HttpPost("reset")]
    public async Task<ActionResult<ApiResponse<WebSettingsOverview>>> Reset([FromBody] ResetWebSettingRequest? request, CancellationToken ct)
    {
        try
        {
            var (before, after) = await settings.ResetAsync(request?.Key, currentUser.UserId, ct);
            await audit.RecordAsync("settings.reset", request!.Key, before, after, RemoteAddress(), ct);
            return Ok(ApiResponse<WebSettingsOverview>.Ok(await settings.DescribeAsync(ct)));
        }
        catch (WebSettingException ex)
        {
            return BadRequest(ApiResponse<WebSettingsOverview>.Fail(ex.Message, new ApiError(ex.Code, ex.Message, Field: "key")));
        }
    }

    /// <summary>Re-reads the WebSettings table and applies it, without a restart.</summary>
    [HttpPost("refresh")]
    public async Task<ActionResult<ApiResponse<WebSettingsOverview>>> Refresh(CancellationToken ct)
    {
        await settings.ReloadAsync(ct);
        await audit.RecordAsync("settings.refresh", null, null, null, RemoteAddress(), ct);
        return Ok(ApiResponse<WebSettingsOverview>.Ok(await settings.DescribeAsync(ct)));
    }

    private string? RemoteAddress() => HttpContext.Connection.RemoteIpAddress?.ToString();
}

public sealed record SetWebSettingRequest(string? Key, string? Value);
public sealed record ResetWebSettingRequest(string? Key);
