namespace AnimStudio.Application.Security;

/// <summary>
/// Who is making the request.
/// <para>
/// Introduced now, while the app is single-user and local, precisely so that every handler
/// and every ownership check is written against it from the start. Swapping the local
/// implementation for one that reads a JWT subject later is a one-class change, with no
/// retrofitting of authorization checks across the codebase.
/// </para>
/// </summary>
public interface ICurrentUser
{
    string UserId { get; }
    string? DisplayName { get; }
    string? Email { get; }
    bool IsAuthenticated { get; }
    bool IsAdmin { get; }
    IReadOnlyList<string> Roles { get; }
}

/// <summary>The local development identity, used until real authentication is added.</summary>
public sealed class LocalSingleUserProvider : ICurrentUser
{
    public const string LocalUserId = "local-user";

    public string UserId => LocalUserId;
    public string? DisplayName => "Local user";
    public string? Email => "admin@keshavsingh.in";
    public bool IsAuthenticated => true;
    public bool IsAdmin => true;
    public IReadOnlyList<string> Roles => new[] { "Admin" };
}
