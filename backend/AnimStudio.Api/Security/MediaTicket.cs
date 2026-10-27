using System.Security.Claims;
using System.Security.Cryptography;
using System.Text.Encodings.Web;
using System.Text.Json;
using AnimStudio.Api.Common;
using AnimStudio.Application.Options;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.Extensions.Options;

namespace AnimStudio.Api.Security;

/// <summary>
/// Marks a GET/HEAD endpoint whose response a browser loads by itself - an &lt;img&gt;,
/// &lt;video&gt; or &lt;audio&gt; source, or a download link - and so may be authenticated with
/// a media ticket in the query string instead of a bearer header.
/// <para>
/// Opt-in per action on purpose: a ticket is only ever a key to media reads, never to the
/// JSON API, so a ticket that leaks through browser history opens nothing else.
/// </para>
/// </summary>
[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
public sealed class AllowMediaTicketAttribute : Attribute;

/// <summary>
/// Issues and reads media tickets: short-lived, encrypted and authenticated (Data Protection)
/// copies of the caller's subject and roles.
/// <para>
/// Browsers never attach an Authorization header to a media element's request, so without
/// this every thumbnail and video of a signed-in user arrives anonymous and fails its
/// ownership check. The ticket carries the same identity the bearer token did, so every
/// ownership check downstream runs unchanged.
/// </para>
/// </summary>
public sealed class MediaTicketService(
    IDataProtectionProvider dataProtection,
    IOptionsMonitor<AdminOptions> options,
    TimeProvider clock)
{
    public const string QueryKey = "mt";

    /// <summary>Long enough that a library page does not reload mid-session, short enough to age out of history.</summary>
    public static readonly TimeSpan Lifetime = TimeSpan.FromHours(2);

    private readonly ITimeLimitedDataProtector protector = dataProtection
        .CreateProtector("AnimStudio.MediaTicket.v1")
        .ToTimeLimitedDataProtector();

    public (string Ticket, DateTimeOffset ExpiresAt) Issue(ClaimsPrincipal user)
    {
        var jwt = options.CurrentValue.Jwt;
        var subject = user.FindFirst(jwt.SubjectClaim)?.Value
            ?? user.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? throw new InvalidOperationException("A media ticket needs an authenticated subject.");

        var roles = user.Claims
            .Where(c => c.Type == jwt.RoleClaim || c.Type == ClaimTypes.Role ||
                        c.Type.Equals("roles", StringComparison.OrdinalIgnoreCase))
            .Select(c => c.Value)
            .Where(v => !string.IsNullOrWhiteSpace(v))
            .Distinct(StringComparer.Ordinal)
            .ToArray();

        var expiresAt = clock.GetUtcNow().Add(Lifetime);
        var payload = JsonSerializer.Serialize(new TicketPayload(subject, roles));

        return (protector.Protect(payload, expiresAt), expiresAt);
    }

    /// <summary>The ticket's identity, or null for one that is forged, tampered with or expired.</summary>
    public ClaimsPrincipal? Read(string? ticket)
    {
        if (string.IsNullOrWhiteSpace(ticket) || ticket.Length > 4096) return null;

        TicketPayload? payload;
        try
        {
            payload = JsonSerializer.Deserialize<TicketPayload>(protector.Unprotect(ticket, out _));
        }
        catch (Exception ex) when (ex is CryptographicException or FormatException or JsonException)
        {
            return null;
        }

        if (payload is null || string.IsNullOrWhiteSpace(payload.Sub)) return null;

        var jwt = options.CurrentValue.Jwt;
        var claims = new List<Claim> { new(jwt.SubjectClaim, payload.Sub) };
        claims.AddRange((payload.Roles ?? []).Select(r => new Claim(jwt.RoleClaim, r)));

        return new ClaimsPrincipal(new ClaimsIdentity(
            claims, MediaTicketAuthenticationHandler.SchemeName, jwt.SubjectClaim, jwt.RoleClaim));
    }

    /// <summary>
    /// True when this request should be authenticated by its ticket: a GET/HEAD to an
    /// endpoint marked <see cref="AllowMediaTicketAttribute"/>, carrying a ticket and no
    /// bearer header. A bearer header always wins, so API calls are never affected.
    /// </summary>
    public static bool Applies(HttpContext context)
    {
        var request = context.Request;

        if (!HttpMethods.IsGet(request.Method) && !HttpMethods.IsHead(request.Method)) return false;
        if (request.Headers.Authorization.Count > 0) return false;
        if (!request.Query.ContainsKey(QueryKey)) return false;

        return context.GetEndpoint()?.Metadata.GetMetadata<AllowMediaTicketAttribute>() is not null;
    }

    private sealed record TicketPayload(string Sub, string[]? Roles);
}

/// <summary>Authenticates a media request from its <c>mt</c> ticket. Selected only when <see cref="MediaTicketService.Applies"/>.</summary>
public sealed class MediaTicketAuthenticationHandler(
    IOptionsMonitor<AuthenticationSchemeOptions> options,
    ILoggerFactory logger,
    UrlEncoder encoder,
    MediaTicketService tickets) : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    public const string SchemeName = "MediaTicket";

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var principal = tickets.Read(Request.Query[MediaTicketService.QueryKey].ToString());

        if (principal is null)
        {
            // A refused credential is a security event; the ticket itself is never logged.
            Logger.LogWarning("Media ticket refused on {Method} {Path} from {RemoteIp}",
                Request.Method, Request.Path, Context.Connection.RemoteIpAddress);
            return Task.FromResult(AuthenticateResult.Fail("Invalid or expired media ticket."));
        }

        return Task.FromResult(AuthenticateResult.Success(new AuthenticationTicket(principal, SchemeName)));
    }

    protected override Task HandleChallengeAsync(AuthenticationProperties properties) =>
        Deny(StatusCodes.Status401Unauthorized, "media-ticket-invalid", "This media link has expired. Reload the page.");

    protected override Task HandleForbiddenAsync(AuthenticationProperties properties) =>
        Deny(StatusCodes.Status403Forbidden, "forbidden", "You do not have access to this media.");

    private Task Deny(int status, string code, string message)
    {
        Response.StatusCode = status;
        return Response.WriteAsJsonAsync(ApiResponse<EmptyPayload>.Fail(message, new ApiError(code, message)));
    }
}
