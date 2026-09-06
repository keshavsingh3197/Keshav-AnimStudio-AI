namespace AnimStudio.Application.Abstractions.Workbooks;

/// <summary>A staged upload, waiting for the user to say yes.</summary>
public sealed record StagedImport(
    string Token,
    string ProjectId,
    string StorageKey,
    string ContentHash,
    DateTime ExpiresAtUtc);

/// <summary>
/// Holds an uploaded bundle between the preview and the apply.
/// </summary>
/// <remarks>
/// <para>
/// The alternative is uploading the file twice - once to see the diff, once to accept it -
/// which for a bundle carrying forty images is not a reasonable thing to ask.
/// </para>
/// <para>
/// A token is <b>single-use, short-lived, and bound to its project</b>. It is unguessable
/// on its own, but it is never the only check: the project in the route is authorized
/// separately, so a leaked token cannot be replayed against someone else's project.
/// </para>
/// </remarks>
public interface IWorkbookImportStaging
{
    Task<StagedImport> StageAsync(
        string projectId, Stream content, string contentHash, CancellationToken ct);

    /// <summary>
    /// The staged upload, or null when the token is unknown, expired, already used, or
    /// belongs to a different project. All four are the same answer to a caller: ask the
    /// user to upload again.
    /// </summary>
    Task<Stream?> OpenAsync(string projectId, string token, CancellationToken ct);

    /// <summary>Called after a successful apply, so a token cannot be replayed.</summary>
    Task ConsumeAsync(string token, CancellationToken ct);
}
