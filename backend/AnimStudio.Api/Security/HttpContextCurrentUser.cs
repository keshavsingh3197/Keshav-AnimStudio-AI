using AnimStudio.Application.Options;
using AnimStudio.Application.Security;
using Microsoft.Extensions.Options;

namespace AnimStudio.Api.Security;

/// <summary>
/// Who is making the request: the JWT subject when the server validates tokens, and the
/// single local user when it does not.
/// </summary>
/// <remarks>
/// <para>
/// Both cases are decided by <see cref="AdminOptions.Mode"/> rather than by whether a
/// token happens to be present, which matters: "use the subject if there is one, otherwise
/// fall back to the local user" would let an unauthenticated request quietly acquire the
/// local user's projects. In JWT mode every endpoint requires an authenticated caller
/// (the fallback policy in <see cref="AdminAccessSetup"/>), so a missing subject there is a
/// server misconfiguration and is refused rather than substituted.
/// </para>
/// <para>
/// Ownership checks throughout the application already compare against
/// <see cref="ICurrentUser.UserId"/>, so switching a server to JWT mode changes who owns
/// what without any of those checks being touched - which is exactly why the interface was
/// introduced before there was anything to put behind it.
/// </para>
/// </remarks>
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

            return string.IsNullOrWhiteSpace(subject)
                ? throw new UnauthorizedAccessException()
                : subject;
        }
    }

    public string? DisplayName
    {
        get
        {
            if (options.CurrentValue.Mode != AdminAccessMode.Jwt) return "Local user";

            var user = accessor.HttpContext?.User;

            return user?.FindFirst("name")?.Value
                   ?? user?.FindFirst("preferred_username")?.Value;
        }
    }
}
