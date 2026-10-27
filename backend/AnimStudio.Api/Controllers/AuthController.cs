using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using AnimStudio.Api.Common;
using AnimStudio.Application.Options;
using AnimStudio.Application.Security;
using Microsoft.Extensions.Primitives;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Microsoft.Net.Http.Headers;

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

    /// <summary>
    /// A short-lived ticket the SPA appends as <c>?mt=</c> to media URLs (thumbnails, video,
    /// downloads), because a browser never sends the bearer header for those requests.
    /// Only a bearer-authenticated caller gets one, and it is accepted only by endpoints
    /// marked <see cref="Security.AllowMediaTicketAttribute"/>.
    /// </summary>
    [HttpPost("media-ticket")]
    public ActionResult<ApiResponse<MediaTicketResponse>> MediaTicket(
        [FromServices] Security.MediaTicketService tickets)
    {
        if (User.Identity?.IsAuthenticated != true)
        {
            return Unauthorized(ApiResponse<MediaTicketResponse>.Fail(
                "Sign in to load media.", new ApiError("unauthorized", "Sign in to load media.")));
        }

        var (ticket, expiresAt) = tickets.Issue(User);
        Response.Headers.CacheControl = "no-store";
        return Ok(ApiResponse<MediaTicketResponse>.Ok(new MediaTicketResponse(ticket, expiresAt)));
    }

    public sealed record MediaTicketResponse(string Ticket, DateTimeOffset ExpiresAt);

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] StudioLoginRequest request, CancellationToken ct)
    {
        // If twoFactorToken and code are supplied, route to 2FA verify
        if (!string.IsNullOrWhiteSpace(request.TwoFactorToken) && !string.IsNullOrWhiteSpace(request.TwoFactorCode))
        {
            var isBackup = !string.IsNullOrWhiteSpace(request.RecoveryCode) ||
                request.TwoFactorCode.Length == 8 ||
                request.TwoFactorCode.Contains('-') ||
                request.TwoFactorCode.Any(char.IsLetter);

            return await VerifyTwoFactor(new StudioTwoFactorVerifyRequest(
                request.TwoFactorToken,
                request.TwoFactorCode,
                isBackup ? 2 : 0), ct).ConfigureAwait(false);
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

            var (status, body) = await HandleIdpSessionResponseAsync(resp, content, idpBase, ct).ConfigureAwait(false);

            return new ContentResult
            {
                StatusCode = status,
                Content = body,
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

            var cleanCode = request.Code?.Trim();
            var isBackup = request.Method == 2 ||
                (cleanCode != null && (cleanCode.Length == 8 || cleanCode.Contains('-') || cleanCode.Any(char.IsLetter)));
            var methodInt = isBackup ? 2 : (request.Method ?? 0);

            var payload = new
            {
                twoFactorToken = request.TwoFactorToken,
                code = cleanCode,
                method = methodInt
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

            var (status, body) = await HandleIdpSessionResponseAsync(resp, content, idpBase, ct).ConfigureAwait(false);

            return new ContentResult
            {
                StatusCode = status,
                Content = body,
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

    [HttpPost("session/confirm")]
    public async Task<IActionResult> ConfirmSession([FromBody] StudioSessionConfirmRequest request, CancellationToken ct)
    {
        try
        {
            var idpBase = options.CurrentValue.Jwt.Issuer == "keshavsingh-idp"
                ? "https://id.keshavsingh.in"
                : "http://localhost:5000";

            var confirmUrl = $"{idpBase}/api/sso/session/confirm?app={StudioAppKey}";
            var payload = new
            {
                sessionConfirmationTicket = request.SessionConfirmationTicket,
                revokeAllOthers = request.RevokeAllOthers ?? true
            };

            var client = httpFactory.CreateClient("IdP");
            using var msg = new HttpRequestMessage(HttpMethod.Post, confirmUrl)
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
            logger.LogError(ex, "Failed to confirm session via central IdP.");
            return StatusCode(StatusCodes.Status503ServiceUnavailable,
                ApiResponse<EmptyPayload>.Fail("Identity service unavailable. Please try again shortly."));
        }
    }

    [HttpPost("passkeys/login/begin")]
    public async Task<IActionResult> PasskeyLoginBegin(CancellationToken ct)
    {
        try
        {
            var idpBase = options.CurrentValue.Jwt.Issuer == "keshavsingh-idp"
                ? "https://id.keshavsingh.in"
                : "http://localhost:5000";

            var url = $"{idpBase}/api/passkeys/login/begin";
            var client = httpFactory.CreateClient("IdP");
            using var msg = new HttpRequestMessage(HttpMethod.Post, url)
            {
                Content = new StringContent("{}", Encoding.UTF8, "application/json")
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
            logger.LogError(ex, "Failed to begin passkey login via IdP.");
            return StatusCode(StatusCodes.Status503ServiceUnavailable,
                ApiResponse<EmptyPayload>.Fail("Passkey service unavailable."));
        }
    }

    [HttpPost("passkeys/login/complete")]
    public async Task<IActionResult> PasskeyLoginComplete([FromBody] JsonElement payload, CancellationToken ct)
    {
        try
        {
            var idpBase = options.CurrentValue.Jwt.Issuer == "keshavsingh-idp"
                ? "https://id.keshavsingh.in"
                : "http://localhost:5000";

            var url = $"{idpBase}/api/passkeys/login/complete?app={StudioAppKey}";
            var client = httpFactory.CreateClient("IdP");
            using var msg = new HttpRequestMessage(HttpMethod.Post, url)
            {
                Content = new StringContent(payload.GetRawText(), Encoding.UTF8, "application/json")
            };

            if (HttpContext.Connection.RemoteIpAddress is { } ip)
                msg.Headers.TryAddWithoutValidation("X-Forwarded-For", ip.ToString());
            if (Request.Headers.UserAgent.ToString() is { Length: > 0 } ua)
                msg.Headers.TryAddWithoutValidation("User-Agent", ua);

            using var resp = await client.SendAsync(msg, ct).ConfigureAwait(false);
            var content = await resp.Content.ReadAsStringAsync(ct).ConfigureAwait(false);

            var (status, body) = await HandleIdpSessionResponseAsync(resp, content, idpBase, ct).ConfigureAwait(false);

            return new ContentResult
            {
                StatusCode = status,
                Content = body,
                ContentType = "application/json"
            };
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to complete passkey login via IdP.");
            return StatusCode(StatusCodes.Status503ServiceUnavailable,
                ApiResponse<EmptyPayload>.Fail("Passkey service unavailable."));
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
            ForwardResponseCookies(resp);
            Response.Cookies.Delete("ks_sso", new CookieOptions { Path = "/" });
            Response.Cookies.Delete("ks_sso");
            return NoContent();
        }
        catch
        {
            Response.Cookies.Delete("ks_sso", new CookieOptions { Path = "/" });
            Response.Cookies.Delete("ks_sso");
            return NoContent();
        }
    }

    private async Task<(int StatusCode, string Content)> HandleIdpSessionResponseAsync(
        HttpResponseMessage resp, string content, string idpBase, CancellationToken ct)
    {
        if (resp.IsSuccessStatusCode && !string.IsNullOrWhiteSpace(content))
        {
            try
            {
                using var doc = JsonDocument.Parse(content);
                var root = doc.RootElement;
                if (root.TryGetProperty("requiresSessionConfirmation", out var reqProp) && reqProp.GetBoolean() &&
                    root.TryGetProperty("sessionConfirmationTicket", out var ticketProp) && !string.IsNullOrWhiteSpace(ticketProp.GetString()))
                {
                    var ticket = ticketProp.GetString();
                    logger.LogInformation("Auto-confirming single session conflict for studio...");

                    var confirmUrl = $"{idpBase}/api/sso/session/confirm?app={StudioAppKey}";
                    var confirmPayload = new
                    {
                        sessionConfirmationTicket = ticket,
                        revokeAllOthers = true
                    };

                    var client = httpFactory.CreateClient("IdP");
                    using var confirmMsg = new HttpRequestMessage(HttpMethod.Post, confirmUrl)
                    {
                        Content = new StringContent(JsonSerializer.Serialize(confirmPayload, JsonOpts), Encoding.UTF8, "application/json")
                    };

                    if (HttpContext.Connection.RemoteIpAddress is { } ip)
                        confirmMsg.Headers.TryAddWithoutValidation("X-Forwarded-For", ip.ToString());
                    if (Request.Headers.UserAgent.ToString() is { Length: > 0 } ua)
                        confirmMsg.Headers.TryAddWithoutValidation("User-Agent", ua);

                    using var confirmResp = await client.SendAsync(confirmMsg, ct).ConfigureAwait(false);
                    var confirmContent = await confirmResp.Content.ReadAsStringAsync(ct).ConfigureAwait(false);

                    ForwardResponseCookies(confirmResp);
                    return ((int)confirmResp.StatusCode, confirmContent);
                }
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Failed to auto-confirm session conflict.");
            }
        }

        ForwardResponseCookies(resp);
        return ((int)resp.StatusCode, content);
    }

    private void ForwardResponseCookies(HttpResponseMessage resp)
    {
        if (!resp.Headers.TryGetValues("Set-Cookie", out var setCookies)) return;

        foreach (var cookieHeader in setCookies)
        {
            var cookie = SetCookieHeaderValue.Parse(new StringSegment(cookieHeader));
            if (string.Equals(cookie.Name.Value, "ks_sso", StringComparison.OrdinalIgnoreCase))
            {
                // The IdP's cookie domain does not match the API host. Re-scope the
                // session cookie to this host so the browser accepts it on localhost
                // and sends it back to the API on subsequent credentialed requests.
                cookie.Domain = null;
                cookie.Path = "/";
                cookie.SameSite = Microsoft.Net.Http.Headers.SameSiteMode.None;
                cookie.Secure = true;
            }

            Response.Headers.Append(HeaderNames.SetCookie, cookie.ToString());
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

public sealed record StudioSessionConfirmRequest(
    string SessionConfirmationTicket,
    bool? RevokeAllOthers = true);

public sealed record AuthMeResponse(
    bool IsAuthenticated,
    string UserId,
    string? DisplayName,
    string? Email,
    bool IsAdmin,
    IReadOnlyList<string> Roles);
