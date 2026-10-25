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

public sealed class AnonymousAccessPolicy
{
    public bool Enabled { get; set; } = true;
    public bool AllowRender { get; set; } = true;
    public int MaxRenderDurationSeconds { get; set; } = 30;
    public int MaxAiCallsPerDay { get; set; } = 3;
    public bool AllowYouTubePublish { get; set; } = false;
    public bool AllowCloudSave { get; set; } = false;
    public bool AllowGoogleDrivePublish { get; set; } = false;
    public int MaxGuestProjects { get; set; } = 5;
    public bool AllowGuestProjectCreation { get; set; } = true;
    public List<string> AllowedFeatures { get; set; } = new()
    {
        "camera-studio",
        "motion-copy",
        "media-tools",
        "demo-projects"
    };
}

public sealed class UiNavigationItemConfig
{
    public string Id { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string Path { get; set; } = string.Empty;
    public string Icon { get; set; } = string.Empty;
    public bool VisibleToAnonymous { get; set; }
    public bool VisibleToMembers { get; set; } = true;
    public bool RequiresAuth { get; set; }
    public bool IsSensitive { get; set; }
    public bool Enabled { get; set; } = true;
    public string? Description { get; set; }
}

public sealed class UiNavigationSettings
{
    public bool EnforceGuestRestrictions { get; set; } = true;
    public List<UiNavigationItemConfig> Tabs { get; set; } = new();

    public static UiNavigationSettings CreateDefault() => new()
    {
        EnforceGuestRestrictions = true,
        Tabs = new List<UiNavigationItemConfig>
        {
            new() { Id = "projects", Label = "Projects", Path = "/projects", Icon = "folder", VisibleToAnonymous = true, VisibleToMembers = true, RequiresAuth = false, IsSensitive = false, Description = "Personal video projects and timeline workspace" },
            new() { Id = "shorts", Label = "Shorts", Path = "/shorts", Icon = "video", VisibleToAnonymous = true, VisibleToMembers = true, RequiresAuth = false, IsSensitive = false, Description = "Vertical video clips and batch shorts generator" },
            new() { Id = "calendar", Label = "Calendar", Path = "/calendar", Icon = "calendar", VisibleToAnonymous = false, VisibleToMembers = true, RequiresAuth = true, IsSensitive = false, Description = "Social media scheduling and release planning" },
            new() { Id = "effects", Label = "Effects", Path = "/effects", Icon = "sparkles", VisibleToAnonymous = true, VisibleToMembers = true, RequiresAuth = false, IsSensitive = false, Description = "Stingers, overlays, sound effects and visual elements" },
            new() { Id = "clips", Label = "Video Editor", Path = "/projects", Icon = "film", VisibleToAnonymous = true, VisibleToMembers = true, RequiresAuth = false, IsSensitive = false, Description = "Scene sequence and clip editor" },
            new() { Id = "tools", Label = "Media Studio", Path = "/tools", Icon = "sliders", VisibleToAnonymous = true, VisibleToMembers = true, RequiresAuth = false, IsSensitive = false, Description = "Audio/video chunking, extraction, and format conversions" },
            new() { Id = "release", Label = "Music Release", Path = "/release", Icon = "music", VisibleToAnonymous = false, VisibleToMembers = true, RequiresAuth = true, IsSensitive = true, Description = "Music master distribution and visualizer publishing" },
            new() { Id = "youtube", Label = "YouTube", Path = "/youtube", Icon = "youtube", VisibleToAnonymous = false, VisibleToMembers = true, RequiresAuth = true, IsSensitive = true, Description = "Direct YouTube channel integration and video analytics" },
            new() { Id = "details", Label = "Video Details", Path = "/youtube/details", Icon = "search", VisibleToAnonymous = true, VisibleToMembers = true, RequiresAuth = false, IsSensitive = false, Description = "SEO audit and video metadata generator" },
            new() { Id = "live", Label = "Go Live", Path = "/live", Icon = "radio", VisibleToAnonymous = false, VisibleToMembers = true, RequiresAuth = true, IsSensitive = true, Description = "YouTube live stream broadcaster" },
            new() { Id = "camera", Label = "Camera Studio", Path = "/live/camera", Icon = "camera", VisibleToAnonymous = true, VisibleToMembers = true, RequiresAuth = false, IsSensitive = false, Description = "Local camera feed capture and background removal" },
            new() { Id = "motion-copy", Label = "Motion Copy", Path = "/motion-copy", Icon = "user", VisibleToAnonymous = true, VisibleToMembers = true, RequiresAuth = false, IsSensitive = false, Description = "Pose estimation and motion transfer to avatars" },
            new() { Id = "collab", Label = "Collab", Path = "/collab", Icon = "users", VisibleToAnonymous = false, VisibleToMembers = true, RequiresAuth = true, IsSensitive = false, Description = "Multi-creator collaboration and workspace sharing" },
            new() { Id = "logs", Label = "Logs", Path = "/logs", Icon = "terminal", VisibleToAnonymous = false, VisibleToMembers = false, RequiresAuth = true, IsSensitive = true, Description = "System diagnosis and server operational logs (Admins only)" },
            new() { Id = "admin", Label = "Settings", Path = "/admin", Icon = "settings", VisibleToAnonymous = false, VisibleToMembers = false, RequiresAuth = true, IsSensitive = true, Description = "Platform administration and UI control matrix" }
        }
    };
}

/// <summary>
/// Server profile configuration for deployment environments (e.g. lightweight free servers).
/// </summary>
public sealed class ServerProfileOptions
{
    public const string Section = "ServerProfile";

    public bool FreeTier { get; set; }
    public bool SkipMissingDependencies { get; set; }
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

    public AnonymousAccessPolicy AnonymousPolicy { get; set; } = new();

    public UiNavigationSettings UiNavigation { get; set; } = UiNavigationSettings.CreateDefault();
}
