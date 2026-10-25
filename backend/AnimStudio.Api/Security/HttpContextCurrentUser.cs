using System.Security.Claims;
using System.Text.RegularExpressions;
using AnimStudio.Application.Options;
using AnimStudio.Application.Security;
using Microsoft.Extensions.Options;

namespace AnimStudio.Api.Security;

/// <summary>
/// Identifies who is making the request with strict multi-user scoping:
/// 1. An authenticated JWT / SSO member receives their token subject and identity claims.
/// 2. An unauthenticated visitor is strictly scoped to an isolated guest session (via X-Guest-Id or peer IP),
///    preventing any cross-user data leakage.
/// 3. Loopback administration is preserved for local CLI/system callers when running in LocalOnly mode.
/// </summary>
public sealed class HttpContextCurrentUser(
    IHttpContextAccessor accessor,
    IOptionsMonitor<AdminOptions> options) : ICurrentUser
{
    private static readonly Regex SafeGuestIdRegex = new(@"[^a-zA-Z0-9_\-]", RegexOptions.Compiled);

    public string UserId
    {
        get
        {
            var settings = options.CurrentValue;
            var http = accessor.HttpContext;
            var user = http?.User;

            // 1. If an authenticated identity is present (from JWT bearer or cookie)
            if (user?.Identity?.IsAuthenticated == true)
            {
                var subject = user.FindFirst(settings.Jwt.SubjectClaim)?.Value
                    ?? user.FindFirst(ClaimTypes.NameIdentifier)?.Value
                    ?? user.FindFirst("sub")?.Value;

                if (!string.IsNullOrWhiteSpace(subject))
                {
                    return subject.Trim();
                }
            }

            // 2. If client supplied a guest identifier header, scope strictly to this guest session
            var guestHeader = http?.Request.Headers["X-Guest-Id"].ToString()?.Trim();
            if (!string.IsNullOrWhiteSpace(guestHeader) && guestHeader.Length <= 64)
            {
                var sanitized = SafeGuestIdRegex.Replace(guestHeader, "");
                if (!string.IsNullOrWhiteSpace(sanitized))
                {
                    return sanitized.StartsWith("guest_", StringComparison.OrdinalIgnoreCase)
                        ? sanitized
                        : "guest_" + sanitized;
                }
            }

            // 3. In LocalOnly mode, an unauthenticated loopback caller WITHOUT a guest header
            // (e.g. dotnet test, curl, local maintenance tooling) uses the local-user identity
            if (settings.Mode == AdminAccessMode.LocalOnly && AdminAccessRules.IsLoopback(http) && string.IsNullOrWhiteSpace(guestHeader))
            {
                return LocalSingleUserProvider.LocalUserId;
            }

            // 4. Fallback peer-based guest identifier for anonymous callers without headers
            var remoteIp = http?.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            var cleanIp = SafeGuestIdRegex.Replace(remoteIp.Replace(":", "_"), "");
            return "guest_ip_" + (string.IsNullOrWhiteSpace(cleanIp) ? "unknown" : cleanIp);
        }
    }

    public string? DisplayName
    {
        get
        {
            var http = accessor.HttpContext;
            var user = http?.User;

            if (IsAuthenticated)
            {
                return user?.FindFirst("name")?.Value
                       ?? user?.FindFirst("displayName")?.Value
                       ?? user?.FindFirst("preferred_username")?.Value
                       ?? user?.FindFirst(ClaimTypes.Name)?.Value
                       ?? user?.FindFirst(ClaimTypes.Email)?.Value
                       ?? user?.FindFirst("email")?.Value
                       ?? (options.CurrentValue.Mode == AdminAccessMode.LocalOnly && user?.Identity?.IsAuthenticated != true
                           ? "Local user"
                           : "Member");
            }

            var guestHeader = http?.Request.Headers["X-Guest-Id"].ToString()?.Trim();
            if (!string.IsNullOrWhiteSpace(guestHeader))
            {
                var displayId = guestHeader.Length > 12 ? guestHeader[..12] : guestHeader;
                return $"Guest ({displayId})";
            }

            return "Guest Visitor";
        }
    }

    public string? Email
    {
        get
        {
            if (!IsAuthenticated) return null;

            return accessor.HttpContext?.User?.FindFirst(ClaimTypes.Email)?.Value
                ?? accessor.HttpContext?.User?.FindFirst("email")?.Value
                ?? (options.CurrentValue.Mode == AdminAccessMode.LocalOnly && accessor.HttpContext?.User?.Identity?.IsAuthenticated != true
                    ? "admin@keshavsingh.in"
                    : null);
        }
    }

    public bool IsAuthenticated
    {
        get
        {
            var http = accessor.HttpContext;
            var user = http?.User;
            var settings = options.CurrentValue;

            if (user?.Identity?.IsAuthenticated == true)
            {
                var subject = user.FindFirst(settings.Jwt.SubjectClaim)?.Value
                    ?? user.FindFirst(ClaimTypes.NameIdentifier)?.Value
                    ?? user.FindFirst("sub")?.Value;

                if (!string.IsNullOrWhiteSpace(subject))
                {
                    return true;
                }
            }

            var guestHeader = http?.Request.Headers["X-Guest-Id"].ToString()?.Trim();
            // Explicit guest header without authenticated token => not authenticated
            if (!string.IsNullOrWhiteSpace(guestHeader))
            {
                return false;
            }

            // In LocalOnly mode without guest header, loopback callers are considered authenticated
            if (settings.Mode == AdminAccessMode.LocalOnly && AdminAccessRules.IsLoopback(http))
            {
                return true;
            }

            return false;
        }
    }

    public bool IsAdmin
    {
        get
        {
            if (!IsAuthenticated) return false;

            return AdminAccessRules.IsAdmitted(options.CurrentValue, accessor.HttpContext, accessor.HttpContext?.User);
        }
    }

    public IReadOnlyList<string> Roles
    {
        get
        {
            if (!IsAuthenticated)
            {
                return new[] { "Anonymous" };
            }

            var user = accessor.HttpContext?.User;
            if (user?.Identity?.IsAuthenticated == true)
            {
                var roleClaim = options.CurrentValue.Jwt.RoleClaim;
                var list = new List<string>();

                foreach (var claim in user.Claims)
                {
                    var isRoleType = claim.Type == roleClaim ||
                                     claim.Type == ClaimTypes.Role ||
                                     claim.Type.Equals("role", StringComparison.OrdinalIgnoreCase) ||
                                     claim.Type.Equals("roles", StringComparison.OrdinalIgnoreCase);

                    if (!isRoleType) continue;

                    var val = claim.Value?.Trim();
                    if (string.IsNullOrWhiteSpace(val)) continue;

                    if (val.StartsWith('[') && val.EndsWith(']'))
                    {
                        try
                        {
                            using var doc = System.Text.Json.JsonDocument.Parse(val);
                            if (doc.RootElement.ValueKind == System.Text.Json.JsonValueKind.Array)
                            {
                                foreach (var item in doc.RootElement.EnumerateArray())
                                {
                                    if (item.GetString() is { Length: > 0 } str)
                                        list.Add(str);
                                }
                                continue;
                            }
                        }
                        catch { /* not json */ }
                    }

                    list.Add(val);
                }

                var distinct = list.Distinct(StringComparer.OrdinalIgnoreCase).ToList();
                if (distinct.Count > 0) return distinct;
            }

            if (IsAdmin)
            {
                return new[] { "Admin" };
            }

            return new[] { "StudioUser" };
        }
    }
}
