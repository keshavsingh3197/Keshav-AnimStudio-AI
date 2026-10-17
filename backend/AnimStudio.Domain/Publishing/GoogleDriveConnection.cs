namespace AnimStudio.Domain.Publishing;

/// <summary>
/// The Google Drive one user connected for sending videos to their phone, at rest. One per
/// user, and separate from the YouTube channels: a brand-account channel has no Drive, and
/// the Drive the phone shows is the person's own account.
/// <para>
/// Only the <c>drive.file</c> scope is asked for, so the app sees just the files and folders
/// it created itself - never the rest of the Drive. Like <see cref="YouTubeChannelConnection"/>,
/// the refresh token exists here only as ciphertext.
/// </para>
/// </summary>
public sealed class GoogleDriveConnection
{
    /// <summary>The user id - one Drive per user.</summary>
    public string Id { get; set; } = string.Empty;

    public string UserId { get; set; } = string.Empty;

    /// <summary>The account's display name and address, shown so the user knows which Drive it is.</summary>
    public string? AccountName { get; set; }
    public string? AccountEmail { get; set; }

    /// <summary>AES-256-GCM ciphertext of the refresh token, base64. Meaningless without the configured data key.</summary>
    public string RefreshTokenCipher { get; set; } = string.Empty;

    /// <summary>The scopes Google actually granted, space-separated.</summary>
    public string Scopes { get; set; } = string.Empty;

    /// <summary>The folder videos go to unless a send names another.</summary>
    public string FolderName { get; set; } = DefaultFolderName;

    /// <summary>
    /// Folders already made (or found) on this Drive, so each send doesn't search again. A list,
    /// not a dictionary: a folder name may contain dots, which a stored document's keys can't.
    /// </summary>
    public List<GoogleDriveFolder> Folders { get; set; } = [];

    public DateTime ConnectedAt { get; set; }

    /// <summary>When Google last refused the refresh token. Cleared by reconnecting.</summary>
    public DateTime? RevokedAt { get; set; }

    public const string DefaultFolderName = "AnimStudio Shorts";
}

/// <summary>A folder the app created on the user's Drive.</summary>
public sealed class GoogleDriveFolder
{
    public string Name { get; set; } = string.Empty;

    /// <summary>Drive's own file id. Not called <c>Id</c>, which Mongo would take for a document id.</summary>
    public string FolderId { get; set; } = string.Empty;
}
