using System.Security.Claims;
using AnimStudio.Application.Options;
using AnimStudio.Application.Security;
using Microsoft.Extensions.Options;

namespace AnimStudio.Api.Security;

/// <summary>
/// Who is making the request: the JWT subject when authenticated, a guest identifier when anonymous,
/// and the single local user when running in LocalOnly mode.
/// </summary>
public sealed class HttpContextCurrentUser(
    IHttpContextAccessor accessor,
    IOptionsMonitor<AdminOptions> options) : ICurrentUser
{
    public string UserId
    {
        get
        {
            var settings = options.CurrentValue;

            if (settings.Mode != AdminAccessMode.Jwt) return LocalSingleUserProvider.LocalUserId;

            var subject = accessor.HttpContext?.User.FindFirst(settings.Jwt.SubjectClaim)?.Value;
            if (!string.IsNullOrWhiteSpace(subject)) return subject;

            // Anonymous / guest identifier (from guest header or remote peer)
            var http = accessor.HttpContext;
            var guestHeader = http?.Request.Headers["X-Guest-Id"].ToString();
            if (!string.IsNullOrWhiteSpace(guestHeader) && guestHeader.Length <= 64)
            {
                return "guest_" + guestHeader.Trim();
            }

            var remoteIp = http?.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            return "guest_" + remoteIp.Replace(":", "_");
        }
    }

    public string? DisplayName
    {
        get
        {
            if (options.CurrentValue.Mode != AdminAccessMode.Jwt) return "Local user";

            var user = accessor.HttpContext?.User;

            return user?.FindFirst("name")?.Value
                   ?? user?.FindFirst("preferred_username")?.Value
                   ?? (IsAuthenticated ? "Member" : "Guest Visitor");
        }
    }

    public string? Email =>
        accessor.HttpContext?.User?.FindFirst(ClaimTypes.Email)?.Value
        ?? accessor.HttpContext?.User?.FindFirst("email")?.Value;

    public bool IsAuthenticated =>
        options.CurrentValue.Mode != AdminAccessMode.Jwt ||
        (accessor.HttpContext?.User?.Identity?.IsAuthenticated == true &&
         !string.IsNullOrWhiteSpace(accessor.HttpContext?.User.FindFirst(options.CurrentValue.Jwt.SubjectClaim)?.Value));

    public bool IsAdmin =>
        AdminAccessRules.IsAdmitted(options.CurrentValue, accessor.HttpContext, accessor.HttpContext?.User);

    public IReadOnlyList<string> Roles
    {
        get
        {
            if (options.CurrentValue.Mode != AdminAccessMode.Jwt)
                return new[] { KeshavSingh.Core.Roles.Admin };

            var user = accessor.HttpContext?.User;
            if (user?.Identity?.IsAuthenticated != true)
                return new[] { "Anonymous" };

            var roleClaim = options.CurrentValue.Jwt.RoleClaim;
            return user.Claims
                .Where(c => c.Type == roleClaim || c.Type == ClaimTypes.Role)
                .Select(c => c.Value)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();
        }
    }
}
