using System.Net.Mail;
using System.Text;
using System.Text.RegularExpressions;

namespace AnimStudio.Application.Security;

/// <summary>
/// The rules for "request AnimStudio access", stated once and kept free of HTTP so they can be
/// tested on their own.
/// </summary>
/// <remarks>
/// <para>
/// Nobody signs themselves up. A request goes to the central identity service's queue, an
/// administrator approves it there, and only then does an account exist. The account an approval
/// creates carries <see cref="StudioRole"/> and nothing else - the one role the identity service
/// refuses on every other site - so a person approved here can use AnimStudio and cannot sign in
/// to anything else that shares the single sign-on.
/// </para>
/// <para>
/// The identity queue is shared by every site, so a request made here is tagged with
/// <see cref="AppTag"/>. This screen lists and decides only tagged requests; the rest belong to
/// the other sites' administrators. A request that carries the tag without having come from here
/// can at worst be approved as a restricted AnimStudio-only account, which is why the tag can
/// safely be a plain text marker.
/// </para>
/// </remarks>
public static class StudioSignupRules
{
    /// <summary>The marker at the start of a request's reason that says it came from AnimStudio.</summary>
    public const string AppTag = "[AnimStudio]";

    /// <summary>The only role this screen ever grants; the identity service refuses it on every other site.</summary>
    public const string StudioRole = "StudioUser";

    public const int MinPasswordLength = 12;
    public const int MaxPasswordLength = 256;
    public const int MaxEmailLength = 256;
    public const int MaxDisplayNameLength = 120;

    /// <summary>The identity service allows 1000; the tag and a space come out of that.</summary>
    public const int MaxReasonLength = 900;

    public const int MaxNoteLength = 400;

    /// <summary>The reply to every well-formed sign-up, whatever the identity service made of it.</summary>
    public const string ReceivedMessage =
        "Thanks - your request has been sent. You will be able to sign in to AnimStudio once an administrator approves it.";

    private static readonly Regex ObjectId = new("^[0-9a-fA-F]{24}$", RegexOptions.Compiled | RegexOptions.CultureInvariant);

    /// <summary>The identity service's ids are 24 hex characters; anything else never reaches a URL.</summary>
    public static bool IsValidRequestId(string? id) => id is not null && ObjectId.IsMatch(id);

    /// <summary>
    /// What is wrong with a sign-up, in words for the applicant, or null when it is fine. The
    /// password rule is the identity service's (twelve characters or more) plus a few that keep out
    /// the passwords people reach for first.
    /// </summary>
    public static string? Validate(string? email, string? displayName, string? password, string? reason)
    {
        var cleanEmail = email?.Trim();
        if (string.IsNullOrEmpty(cleanEmail) || cleanEmail.Length > MaxEmailLength || !IsEmail(cleanEmail))
            return "Enter a valid email address.";

        var name = CleanLine(displayName, MaxDisplayNameLength);
        if (name.Length < 2) return "Enter your name.";

        if (string.IsNullOrEmpty(password) || password.Length < MinPasswordLength)
            return $"Use a password of at least {MinPasswordLength} characters.";
        if (password.Length > MaxPasswordLength) return $"Use a password of at most {MaxPasswordLength} characters.";
        if (password.Trim().Length == 0 || password.Distinct().Count() < 5)
            return "Choose a less repetitive password.";

        var local = cleanEmail.Split('@')[0];
        if (password.Contains(local, StringComparison.OrdinalIgnoreCase) && local.Length >= 4)
            return "Your password shouldn't contain your email name.";
        if (password.Contains(name, StringComparison.OrdinalIgnoreCase) && name.Length >= 4)
            return "Your password shouldn't contain your name.";
        if (CommonPasswords.Any(p => password.Equals(p, StringComparison.OrdinalIgnoreCase)))
            return "That password is too common. Choose another.";

        if (reason is not null && reason.Length > 4 * MaxReasonLength)
            return "Keep your note short.";
        return null;
    }

    /// <summary>The reason as the identity queue stores it: tagged, flattened and bounded.</summary>
    public static string BuildReason(string? reason)
    {
        var clean = CleanLine(reason, MaxReasonLength);
        // A tag typed into the box is dropped, so the one that counts is always the one added here.
        if (clean.StartsWith(AppTag, StringComparison.OrdinalIgnoreCase)) clean = clean[AppTag.Length..].TrimStart();
        return clean.Length == 0 ? AppTag : $"{AppTag} {clean}";
    }

    public static bool IsStudioRequest(string? reason) =>
        reason is not null && reason.TrimStart().StartsWith(AppTag, StringComparison.OrdinalIgnoreCase);

    /// <summary>The applicant's own words, without the marker.</summary>
    public static string? ReasonForDisplay(string? reason)
    {
        if (reason is null) return null;
        var trimmed = reason.TrimStart();
        if (!trimmed.StartsWith(AppTag, StringComparison.OrdinalIgnoreCase)) return trimmed;
        var rest = trimmed[AppTag.Length..].Trim();
        return rest.Length == 0 ? null : rest;
    }

    /// <summary>
    /// True for an account that holds <see cref="StudioRole"/> and no other role: the only kind of
    /// account this screen may list or change. An Admin, an Editor or anyone with another role
    /// is somebody else's to manage.
    /// </summary>
    public static bool IsStudioOnly(IEnumerable<string>? roles)
    {
        var list = roles?.Where(r => !string.IsNullOrWhiteSpace(r)).Select(r => r.Trim()).ToList();
        return list is { Count: 1 } && string.Equals(list[0], StudioRole, StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>A reviewer's note: one line, no control characters, bounded.</summary>
    public static string? CleanNote(string? note)
    {
        var clean = CleanLine(note, MaxNoteLength);
        return clean.Length == 0 ? null : clean;
    }

    private static bool IsEmail(string value)
    {
        try
        {
            var parsed = new MailAddress(value);
            return string.Equals(parsed.Address, value, StringComparison.OrdinalIgnoreCase) && value.Contains('.', StringComparison.Ordinal);
        }
        catch (FormatException)
        {
            return false;
        }
    }

    private static string CleanLine(string? value, int max)
    {
        if (string.IsNullOrWhiteSpace(value)) return string.Empty;
        var sb = new StringBuilder(Math.Min(value.Length, max));
        var lastSpace = false;
        foreach (var ch in value)
        {
            if (sb.Length >= max) break;
            if (char.IsWhiteSpace(ch) || char.IsControl(ch))
            {
                if (!lastSpace && sb.Length > 0) sb.Append(' ');
                lastSpace = true;
                continue;
            }
            sb.Append(ch);
            lastSpace = false;
        }
        return sb.ToString().Trim();
    }

    private static readonly string[] CommonPasswords =
    [
        "password1234", "123456789012", "qwertyuiop12", "iloveyou1234", "admin1234567",
        "welcome12345", "letmein12345", "password12345", "changeme1234", "studio123456",
    ];
}
