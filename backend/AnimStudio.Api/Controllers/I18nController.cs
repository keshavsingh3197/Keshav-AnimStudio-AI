using AnimStudio.Api.Common;
using AnimStudio.Api.Security;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Security;
using AnimStudio.Domain.System;
using AnimStudio.Infrastructure.Ecosystem;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AnimStudio.Api.Controllers;

/// <summary>
/// Studio UI bilingual localization API backed directly by AdminDb MongoDB with an optional
/// per-site Studio Admin override. Affects Studio UI chrome/navigation labels only; video and song
/// audio generation languages remain independently controlled per project/post.
/// </summary>
[ApiController]
[Route("api")]
public sealed class I18nController(
    CentralLocalizationService localization,
    ICurrentUser currentUser) : ControllerBase
{
    [HttpGet("i18n/manifest")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<LocalizationManifestResponse>>> Manifest(CancellationToken ct)
    {
        var res = await localization.GetManifestAsync(ct).ConfigureAwait(false);
        return Ok(ApiResponse<LocalizationManifestResponse>.Ok(res));
    }

    [HttpGet("i18n/bundle")]
    [HttpGet("i18n/bundle/{locale}")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<LocalizationBundleResponse>>> Bundle(
        string? locale = null,
        [FromQuery(Name = "lang")] string? lang = null,
        CancellationToken ct = default)
    {
        var effective = !string.IsNullOrWhiteSpace(locale) ? locale : lang;
        var res = await localization.GetBundleAsync(effective, ct).ConfigureAwait(false);
        return Ok(ApiResponse<LocalizationBundleResponse>.Ok(res));
    }

    [HttpGet("settings/localization")]
    [Authorize(Policy = AdminAccess.Policy)]
    public async Task<ActionResult<ApiResponse<SiteLocalizationAdminStateResponse>>> GetAdminSettings(CancellationToken ct)
    {
        var state = await localization.GetAdminStateAsync(ct).ConfigureAwait(false);
        return Ok(ApiResponse<SiteLocalizationAdminStateResponse>.Ok(state));
    }

    [HttpPut("settings/localization")]
    [Authorize(Policy = AdminAccess.Policy)]
    public async Task<ActionResult<ApiResponse<SiteLocalizationAdminStateResponse>>> UpdateAdminSettings(
        [FromBody] UpdateSiteLocalizationRequest request,
        CancellationToken ct)
    {
        var updated = await localization.UpdateLocalSettingsAsync(request, currentUser.UserId, ct).ConfigureAwait(false);
        return Ok(ApiResponse<SiteLocalizationAdminStateResponse>.Ok(updated));
    }
}
