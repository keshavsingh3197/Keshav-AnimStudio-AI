using AnimStudio.Api.Common;
using AnimStudio.Api.Contracts;
using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Domain.Ai;
using Microsoft.AspNetCore.Mvc;

namespace AnimStudio.Api.Controllers;

[ApiController]
[Route("api/ai")]
public sealed class AiController(
    IAiProviderRegistry registry,
    IAiQuotaGuard quota) : ControllerBase
{
    /// <summary>
    /// What the server can currently do with AI, and why it cannot do the rest.
    /// <para>
    /// Read-only and safe for any signed-in user: it exposes provider ids and model names,
    /// which the UI needs in order to label a generated asset, but never a key, a
    /// fingerprint or a base URL. Managing providers is an admin concern and lives behind
    /// <c>/api/admin</c>.
    /// </para>
    /// </summary>
    [HttpGet("capabilities")]
    public async Task<ActionResult<ApiResponse<AiCapabilitiesResponse>>> Capabilities(
        CancellationToken ct)
    {
        var responses = new List<AiCapabilityResponse>();

        foreach (var status in registry.DescribeAll())
        {
            var available = status.Available;
            var reason = status.Reason;
            long? dailyRemaining = null;

            // Asked here rather than inside the registry because a quota check reads the
            // database, and the chain is composed on every AI call - the composition has to
            // stay cheap. This endpoint is called once per screen, so it can afford it, and
            // showing "0 left today" is exactly what stops a user starting a 40-scene run
            // that would stall halfway.
            if (available && AiProviderId.TryParse(status.ProviderId, out var providerId))
            {
                var verdict = await quota.CheckAsync(providerId, ct);
                dailyRemaining = verdict.DailyRemaining;

                if (!verdict.Allowed)
                {
                    available = false;
                    reason = AiUnavailableReason.QuotaExhausted;
                }
            }

            responses.Add(new AiCapabilityResponse(
                status.Capability.ToString(),
                status.ProviderId,
                status.Model,
                available,
                reason.ToString(),
                dailyRemaining,
                status.Chain));
        }

        return Ok(ApiResponse<AiCapabilitiesResponse>.Ok(new AiCapabilitiesResponse(responses)));
    }
}
