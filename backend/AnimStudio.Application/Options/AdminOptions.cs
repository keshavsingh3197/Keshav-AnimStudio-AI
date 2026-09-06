namespace AnimStudio.Application.Options;

/// <summary>How the server decides that a caller may administer it.</summary>
public enum AdminAccessMode
{
    /// <summary>Nobody may reach <c>/api/admin</c>. The setting for a server nobody administers.</summary>
    Disabled = 0,

    /// <summary>
    /// Only a request whose TCP peer is this machine. The desktop-application model, and
    /// the right one while AnimStudio runs on the operator's own computer: the operator is
    /// the only person who can open a socket to it.
    /// <para>
    /// The check reads the connection's remote address, never a header. <c>X-Forwarded-For</c>
    /// is caller-supplied text and would turn this into no check at all, which is why this
    /// mode is refused outright when the app runs in Production - see
    /// <c>AdminAccessSetup</c>.
    /// </para>
    /// </summary>
    LocalOnly = 1,

    /// <summary>
    /// A signed JWT from the family identity provider carrying the <c>Admin</c> role. The
    /// only mode fit for a server anyone else can reach.
    /// </summary>
    Jwt = 2
}

/// <summary>
/// Token validation parameters, shared byte-for-byte with every other app in the family -
/// a token minted at the identity provider has to work here unchanged.
/// </summary>
public sealed class AdminJwtOptions
{
    public string Issuer { get; set; } = "keshavsingh-idp";
    public string Audience { get; set; } = "keshavsingh-apps";

    /// <summary>
    /// The HS256 signing secret. A secret: it comes from user-secrets, an environment
    /// variable (<c>Admin__Jwt__SigningKey</c>) or a vault, and never from appsettings.json.
    /// Startup fails when <see cref="AdminAccessMode.Jwt"/> is selected without it.
    /// </summary>
    public string? SigningKey { get; set; }

    /// <summary>
    /// The claim carrying roles. The identity provider emits bare <c>role</c>; inbound claim
    /// mapping is switched off so it arrives under that name rather than the long
    /// SOAP-era URI.
    /// </summary>
    public string RoleClaim { get; set; } = "role";

    /// <summary>Must match <c>KeshavSingh.Core.Roles.Admin</c>; drift breaks authorization silently.</summary>
    public string AdminRole { get; set; } = "Admin";

    /// <summary>The claim carrying the user id, used for record ownership.</summary>
    public string SubjectClaim { get; set; } = "sub";
}

/// <summary>
/// Who may administer this server.
/// </summary>
/// <remarks>
/// Default deny is expressed by having no default that trusts anybody remote:
/// <see cref="AdminAccessMode.LocalOnly"/> admits only a caller on this machine, and it is
/// rejected at startup in Production, so a deployment cannot inherit the development
/// answer by omission.
/// </remarks>
public sealed class AdminOptions
{
    public const string Section = "Admin";

    public AdminAccessMode Mode { get; set; } = AdminAccessMode.LocalOnly;

    public AdminJwtOptions Jwt { get; set; } = new();
}
