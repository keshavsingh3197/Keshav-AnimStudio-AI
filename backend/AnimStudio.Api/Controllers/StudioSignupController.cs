using AnimStudio.Api.Common;
using AnimStudio.Api.Contracts;
using AnimStudio.Api.Security;
using AnimStudio.Application.Options;
using AnimStudio.Application.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;

namespace AnimStudio.Api.Controllers;

/// <summary>
/// "Request access" - the only way in for someone who has no account, and it does not let them in.
/// It puts a request in the central identity service's queue; an administrator approves it
/// (<see cref="AdminSignupsController"/>), and that creates an account which can sign in to
/// AnimStudio and to nothing else.
/// </summary>
/// <remarks>
/// Anonymous by necessity, so: limited per address, every field bounded and checked here before
/// it is forwarded, a hidden field that catches scripts, and the same reply whatever the
/// identity service made of the request (it never says whether an address already has an account,
/// so this cannot be used to find out).
/// </remarks>
[ApiController]
[Route("api/auth/signup")]
[AllowAnonymous]
public sealed class StudioSignupController(
    StudioIdentityClient identity,
    IOptionsMonitor<AdminOptions> options,
    ILogger<StudioSignupController> logger) : ControllerBase
{
    /// <summary>Whether the dialog should offer "Request access".</summary>
    [HttpGet("status")]
    public ActionResult<ApiResponse<StudioSignupStatusResponse>> Status() =>
        Ok(ApiResponse<StudioSignupStatusResponse>.Ok(new StudioSignupStatusResponse(options.CurrentValue.Signup.Enabled)));

    [HttpPost]
    [EnableRateLimiting(StudioSignupLimits.PolicyName)]
    public async Task<IActionResult> Submit([FromBody] StudioSignupRequest? request, CancellationToken ct)
    {
        if (!options.CurrentValue.Signup.Enabled)
        {
            return StatusCode(StatusCodes.Status403Forbidden, ApiResponse<StudioSignupResponse>.Fail(
                "Access requests are closed right now.", new ApiError("signup-closed", "Access requests are closed right now.")));
        }

        // A bot fills every field. It gets the normal answer and nothing is sent anywhere.
        if (!string.IsNullOrWhiteSpace(request?.Website))
        {
            logger.LogInformation("Access request dropped: the hidden field was filled.");
            return Accepted(ApiResponse<StudioSignupResponse>.Ok(new StudioSignupResponse(true, StudioSignupRules.ReceivedMessage)));
        }

        var problem = StudioSignupRules.Validate(request?.Email, request?.DisplayName, request?.Password, request?.Reason);
        if (problem is not null)
        {
            return BadRequest(ApiResponse<StudioSignupResponse>.Fail(problem, new ApiError("signup-invalid", problem)));
        }

        var reply = await identity.SendAsync(
            HttpMethod.Post, "/api/account-requests",
            new
            {
                email = request!.Email!.Trim(),
                displayName = request.DisplayName!.Trim(),
                password = request.Password,
                reason = StudioSignupRules.BuildReason(request.Reason),
            },
            HttpContext, forwardBearer: false, ct).ConfigureAwait(false);

        if (reply.IsSuccess)
        {
            return Accepted(ApiResponse<StudioSignupResponse>.Ok(new StudioSignupResponse(true, StudioSignupRules.ReceivedMessage)));
        }

        // Nothing the identity service said is passed on - only what the applicant can act on.
        logger.LogWarning("The identity service refused an access request with status {Status}.", reply.Status);
        return reply.Status switch
        {
            StatusCodes.Status400BadRequest => BadRequest(ApiResponse<StudioSignupResponse>.Fail(
                "Check your details and try again.", new ApiError("signup-invalid", "Check your details and try again."))),
            StatusCodes.Status429TooManyRequests => StatusCode(StatusCodes.Status429TooManyRequests, ApiResponse<StudioSignupResponse>.Fail(
                "Too many requests. Wait a little and try again.", new ApiError("rate-limited", "Too many requests. Wait a little and try again."))),
            _ => StatusCode(StatusCodes.Status503ServiceUnavailable, ApiResponse<StudioSignupResponse>.Fail(
                "Requests can't be taken right now. Try again shortly.", new ApiError("identity-unavailable", "Requests can't be taken right now. Try again shortly."))),
        };
    }
}

/// <summary>The limit on anonymous access requests.</summary>
public static class StudioSignupLimits
{
    public const string PolicyName = "studio-signup";

    /// <summary>Per address; a person fixing a typo needs a few tries, a script needs far more.</summary>
    public const int PermitsPerWindow = 5;

    public static readonly TimeSpan Window = TimeSpan.FromMinutes(15);
}
