using System.Net;
using System.Security.Claims;
using AnimStudio.Application.Options;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Options;

namespace AnimStudio.Api.Security;

/// <summary>The one authorization policy guarding every administrative endpoint.</summary>
public static class AdminAccess
{
    public const string Policy = "AnimStudioAdmin";
}

/// <summary>
/// Whether a caller may administer this server, stated once.
/// </summary>
/// <remarks>
/// <para>
/// Pure and static so that the authorization handler and the endpoint that tells the UI
/// whether to show an admin link cannot disagree. A second, more generous copy of this
/// rule written for the UI's convenience is the classic way an admin console ends up
/// showing controls that the server then refuses - or worse, the other way round.
/// </para>
/// <para>
/// The loopback test reads the connection's remote address, which is the TCP peer. It
/// deliberately ignores <c>X-Forwarded-For</c> and every other header: a header is written
/// by whoever sent the request, so honouring one would let any caller claim to be local.
/// That is also why <see cref="AdminAccessMode.LocalOnly"/> is refused in Production, where
/// a reverse proxy is normal - see <c>AdminAccessSetup</c>.
/// </para>
/// </remarks>
public static class AdminAccessRules
{
    public static bool IsAdmitted(AdminOptions options, HttpContext? http, ClaimsPrincipal? user) =>
        options.Mode switch
        {
            AdminAccessMode.LocalOnly => IsLoopback(http),
            AdminAccessMode.Jwt => HasAdminRole(user, options.Jwt),

            // Disabled, and anything a future enum value adds: denied until someone writes
            // the rule for it.
            _ => false
        };

    public static bool IsLoopback(HttpContext? http)
    {
        var address = http?.Connection.RemoteIpAddress;

        if (address is null) return false;

        // ::ffff:127.0.0.1 is loopback wearing a v6 hat, and is what Kestrel reports on a
        // dual-stack listener.
        if (address.IsIPv4MappedToIPv6) address = address.MapToIPv4();

        return IPAddress.IsLoopback(address);
    }

    private static bool HasAdminRole(ClaimsPrincipal? user, AdminJwtOptions jwt)
    {
        if (user?.Identity?.IsAuthenticated != true) return false;

        // Both names are checked because the identity provider emits a bare "role", while a
        // token that has been through inbound claim mapping carries the ClaimTypes URI.
        return user.Claims.Any(claim =>
            (claim.Type == jwt.RoleClaim || claim.Type == ClaimTypes.Role)
            && string.Equals(claim.Value, jwt.AdminRole, StringComparison.Ordinal));
    }
}

public sealed class AdminRequirement : IAuthorizationRequirement;

/// <summary>
/// Applies <see cref="AdminAccessRules"/> and records every refusal, because an
/// authorization failure is a security event and is worth being able to see afterwards.
/// </summary>
public sealed class AdminRequirementHandler(
    IOptionsMonitor<AdminOptions> options,
    IHttpContextAccessor accessor,
    ILogger<AdminRequirementHandler> logger) : AuthorizationHandler<AdminRequirement>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context, AdminRequirement requirement)
    {
        var settings = options.CurrentValue;
        var http = accessor.HttpContext;

        if (AdminAccessRules.IsAdmitted(settings, http, context.User))
        {
            context.Succeed(requirement);
            return Task.CompletedTask;
        }

        // Who, where and what - and nothing that could itself be sensitive. The subject
        // claim is an opaque id, never a name or an address.
        logger.LogWarning(
            "Admin access refused at {TimestampUtc:o}: mode {Mode}, path {Path}, " +
            "remote {RemoteAddress}, authenticated {Authenticated}, subject {Subject}.",
            DateTimeOffset.UtcNow,
            settings.Mode,
            http?.Request.Path.Value ?? "(none)",
            http?.Connection.RemoteIpAddress?.ToString() ?? "(unknown)",
            context.User.Identity?.IsAuthenticated == true,
            context.User.FindFirst(settings.Jwt.SubjectClaim)?.Value ?? "(none)");

        return Task.CompletedTask;
    }
}
