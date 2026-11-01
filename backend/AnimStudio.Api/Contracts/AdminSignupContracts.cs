namespace AnimStudio.Api.Contracts;

// --- asking for access --------------------------------------------------------------------

/// <summary>
/// The sign-in dialog's "Request access" form. <paramref name="Website"/> is a trap: a field no
/// person sees, which only a script fills in.
/// </summary>
public sealed record StudioSignupRequest(string? Email, string? DisplayName, string? Password, string? Reason, string? Website);

public sealed record StudioSignupResponse(bool Received, string Message);

public sealed record StudioSignupStatusResponse(bool Open);

// --- deciding on it -----------------------------------------------------------------------

/// <summary>One access request, as the administrator sees it. Never carries the password.</summary>
public sealed record AdminSignupItem(
    string Id,
    string Email,
    string DisplayName,
    string? Reason,
    string Status,
    DateTime CreatedAt,
    DateTime? DecidedAt,
    string? DecisionNote,
    string? CreatedUserId);

public sealed record AdminSignupSummary(int Pending, int Approved, int Rejected, int Total);

public sealed record AdminSignupDecisionRequest(string? Note);

public sealed record AdminSignupSettings(bool Enabled);

public sealed record AdminSignupSettingsRequest(bool Enabled);

// --- the people who were approved ---------------------------------------------------------

/// <summary>An approved AnimStudio-only account.</summary>
public sealed record AdminMemberItem(
    string Id,
    string Email,
    string DisplayName,
    bool IsActive,
    bool TwoFactorEnabled,
    DateTime? LastLoginAt,
    DateTime CreatedAt);

public sealed record AdminMemberActiveRequest(bool Active);
