namespace AnimStudio.Domain.Publishing;

/// <summary>
/// A Google Drive a user connected for saving renders and sending them to their phone, at
/// rest. Each user has at most one personal Drive (no <see cref="ChannelId"/>) and at most one
/// per connected YouTube channel; a channel without its own uses the personal one. They are
/// separate sign-ins from the channels themselves: a brand-account channel has no Drive, and
/// a team may want each channel's videos to land in a different account.
/// <para>
/// Only the <c>drive.file</c> scope is asked for, so the app sees just the files and folders
/// it created itself - never the rest of the Drive. Like <see cref="YouTubeChannelConnection"/>,
/// the refresh token exists here only as ciphertext.
/// </para>
/// </summary>
public sealed class GoogleDriveConnection
{
    /// <summary><see cref="KeyFor"/> of the owner and channel.</summary>
    public string Id { get; set; } = string.Empty;

    public string UserId { get; set; } = string.Empty;

    /// <summary>The channel this Drive is for; null for the user's personal Drive.</summary>
    public string? ChannelId { get; set; }

    /// <summary>
    /// The storage key: the user id alone for the personal Drive (as stored before channels
    /// had their own), else the user and channel. YouTube channel ids never contain ':'.
    /// </summary>
    public static string KeyFor(string userId, string? channelId) =>
        string.IsNullOrEmpty(channelId) ? userId : $"{userId}:{channelId}";

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

    /// <summary>
    /// Personal Drive only: the folder chosen for each channel that has no Drive of its own.
    /// A channel not listed goes to a folder named after it.
    /// </summary>
    public List<GoogleDriveChannelFolder> ChannelFolders { get; set; } = [];

    public DateTime ConnectedAt { get; set; }

    /// <summary>When Google last refused the refresh token. Cleared by reconnecting.</summary>
    public DateTime? RevokedAt { get; set; }

    public const string DefaultFolderName = "AnimStudio Shorts";
}

/// <summary>The folder on the personal Drive that one channel's videos go to.</summary>
public sealed class GoogleDriveChannelFolder
{
    public string ChannelId { get; set; } = string.Empty;
    public string FolderName { get; set; } = string.Empty;
}

/// <summary>A folder the app created on the user's Drive.</summary>
public sealed class GoogleDriveFolder
{
    public string Name { get; set; } = string.Empty;

    /// <summary>Drive's own file id. Not called <c>Id</c>, which Mongo would take for a document id.</summary>
    public string FolderId { get; set; } = string.Empty;
}
