using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using AnimStudio.Api.Common;
using AnimStudio.Application.Options;
using AnimStudio.Application.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace AnimStudio.Api.Controllers;

/// <summary>
/// Authentication and session controller for AnimStudio AI.
/// Connects to the central Identity Provider (id.keshavsingh.in) with appKey="studio",
/// enforcing that registered Studio accounts are scoped strictly to AnimStudio.
/// </summary>
[ApiController]
[Route("api/auth")]
[AllowAnonymous]
public sealed class AuthController(
    IHttpClientFactory httpFactory,
    IOptionsMonitor<AdminOptions> options,
    ICurrentUser currentUser,
    ILogger<AuthController> logger) : ControllerBase
{
    private const string StudioAppKey = "studio";
    private static readonly JsonSerializerOptions JsonOpts = new(JsonSerializerDefaults.Web);

    [HttpGet("me")]
    public ActionResult<ApiResponse<AuthMeResponse>> Me() =>
        Ok(ApiResponse<AuthMeResponse>.Ok(new AuthMeResponse(
            currentUser.IsAuthenticated,
            currentUser.UserId,
            currentUser.DisplayName,
            currentUser.Email,
            currentUser.IsAdmin,
            currentUser.Roles)));

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] StudioLoginRequest request, CancellationToken ct)
    {
        // If twoFactorToken and code are supplied, route to 2FA verify
        if (!string.IsNullOrWhiteSpace(request.TwoFactorToken) && !string.IsNullOrWhiteSpace(request.TwoFactorCode))
        {
            return await VerifyTwoFactor(new StudioTwoFactorVerifyRequest(
                request.TwoFactorToken,
                request.TwoFactorCode,
                string.IsNullOrWhiteSpace(request.RecoveryCode) ? 0 : 2), ct).ConfigureAwait(false);
        }

        try
        {
            var idpBase = options.CurrentValue.Jwt.Issuer == "keshavsingh-idp"
                ? "https://id.keshavsingh.in"
                : "http://localhost:5000";

            var idpUrl = $"{idpBase}/api/sso/login";

            var payload = new
            {
                email = request.Email?.Trim(),
                password = request.Password,
                appKey = StudioAppKey
            };

            var client = httpFactory.CreateClient("IdP");
            using var msg = new HttpRequestMessage(HttpMethod.Post, idpUrl)
            {
                Content = new StringContent(JsonSerializer.Serialize(payload, JsonOpts), Encoding.UTF8, "application/json")
            };

            // Forward incoming client IP and User-Agent
            if (HttpContext.Connection.RemoteIpAddress is { } ip)
                msg.Headers.TryAddWithoutValidation("X-Forwarded-For", ip.ToString());
            if (Request.Headers.UserAgent.ToString() is { Length: > 0 } ua)
                msg.Headers.TryAddWithoutValidation("User-Agent", ua);

            using var resp = await client.SendAsync(msg, ct).ConfigureAwait(false);
            var content = await resp.Content.ReadAsStringAsync(ct).ConfigureAwait(false);

            // Forward any SSO cookies issued by IdP
            ForwardResponseCookies(resp);

            return new ContentResult
            {
                StatusCode = (int)resp.StatusCode,
                Content = content,
                ContentType = "application/json"
            };
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to authenticate via central IdP.");
            return StatusCode(StatusCodes.Status503ServiceUnavailable,
                ApiResponse<EmptyPayload>.Fail("Identity service unavailable. Please try again shortly."));
        }
    }

    [HttpPost("2fa/verify")]
    public async Task<IActionResult> VerifyTwoFactor([FromBody] StudioTwoFactorVerifyRequest request, CancellationToken ct)
    {
        try
        {
            var idpBase = options.CurrentValue.Jwt.Issuer == "keshavsingh-idp"
                ? "https://id.keshavsingh.in"
                : "http://localhost:5000";

            var verifyUrl = $"{idpBase}/api/sso/2fa/verify?app={StudioAppKey}";

            var payload = new
            {
                twoFactorToken = request.TwoFactorToken,
                code = request.Code?.Trim(),
                method = request.Method ?? 0
            };

            var client = httpFactory.CreateClient("IdP");
            using var msg = new HttpRequestMessage(HttpMethod.Post, verifyUrl)
            {
                Content = new StringContent(JsonSerializer.Serialize(payload, JsonOpts), Encoding.UTF8, "application/json")
            };

            if (HttpContext.Connection.RemoteIpAddress is { } ip)
                msg.Headers.TryAddWithoutValidation("X-Forwarded-For", ip.ToString());
            if (Request.Headers.UserAgent.ToString() is { Length: > 0 } ua)
                msg.Headers.TryAddWithoutValidation("User-Agent", ua);

            using var resp = await client.SendAsync(msg, ct).ConfigureAwait(false);
            var content = await resp.Content.ReadAsStringAsync(ct).ConfigureAwait(false);

            ForwardResponseCookies(resp);

            return new ContentResult
            {
                StatusCode = (int)resp.StatusCode,
                Content = content,
                ContentType = "application/json"
            };
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to verify 2FA via central IdP.");
            return StatusCode(StatusCodes.Status503ServiceUnavailable,
                ApiResponse<EmptyPayload>.Fail("Identity service unavailable. Please try again shortly."));
        }
    }

    [HttpPost("session")]
    public async Task<IActionResult> Session(CancellationToken ct)
    {
        try
        {
            var idpUrl = options.CurrentValue.Jwt.Issuer == "keshavsingh-idp"
                ? "https://id.keshavsingh.in/api/sso/session?app=studio"
                : "http://localhost:5000/api/sso/session?app=studio";

            var client = httpFactory.CreateClient("IdP");
            using var msg = new HttpRequestMessage(HttpMethod.Post, idpUrl);

            // Forward cookie from client to IdP
            if (Request.Cookies.TryGetValue("ks_sso", out var ssoCookie) && !string.IsNullOrWhiteSpace(ssoCookie))
            {
                msg.Headers.TryAddWithoutValidation("Cookie", $"ks_sso={ssoCookie}");
            }
            else
            {
                return Unauthorized(new { error = "No active session cookie." });
            }

            using var resp = await client.SendAsync(msg, ct).ConfigureAwait(false);
            var content = await resp.Content.ReadAsStringAsync(ct).ConfigureAwait(false);

            ForwardResponseCookies(resp);

            return new ContentResult
            {
                StatusCode = (int)resp.StatusCode,
                Content = content,
                ContentType = "application/json"
            };
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Silent SSO session refresh failed.");
            return StatusCode(StatusCodes.Status503ServiceUnavailable,
                ApiResponse<EmptyPayload>.Fail("Identity service unavailable."));
        }
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout(CancellationToken ct)
    {
        try
        {
            var idpUrl = options.CurrentValue.Jwt.Issuer == "keshavsingh-idp"
                ? "https://id.keshavsingh.in/api/sso/logout"
                : "http://localhost:5000/api/sso/logout";

            var client = httpFactory.CreateClient("IdP");
            using var msg = new HttpRequestMessage(HttpMethod.Post, idpUrl);

            if (Request.Cookies.TryGetValue("ks_sso", out var ssoCookie))
                msg.Headers.TryAddWithoutValidation("Cookie", $"ks_sso={ssoCookie}");

            using var resp = await client.SendAsync(msg, ct).ConfigureAwait(false);
            Response.Cookies.Delete("ks_sso");
            return NoContent();
        }
        catch
        {
            Response.Cookies.Delete("ks_sso");
            return NoContent();
        }
    }

    private void ForwardResponseCookies(HttpResponseMessage resp)
    {
        if (!resp.Headers.TryGetValues("Set-Cookie", out var setCookies)) return;

        foreach (var cookieHeader in setCookies)
        {
            Response.Headers.Append("Set-Cookie", cookieHeader);
        }
    }
}

public sealed record StudioLoginRequest(
    string? Email,
    string? Password,
    string? TwoFactorCode = null,
    string? RecoveryCode = null,
    string? TwoFactorToken = null);

public sealed record StudioTwoFactorVerifyRequest(
    string TwoFactorToken,
    string Code,
    int? Method = 0);

public sealed record AuthMeResponse(
    bool IsAuthenticated,
    string UserId,
    string? DisplayName,
    string? Email,
    bool IsAdmin,
    IReadOnlyList<string> Roles);
