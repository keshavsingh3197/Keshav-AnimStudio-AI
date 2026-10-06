namespace AnimStudio.Application.LiveStreams;

public enum LiveStreamOrientation
{
    /// <summary>16:9 - the normal YouTube live player. YouTube's "dual stream" crops a vertical feed from it.</summary>
    Landscape = 0,

    /// <summary>9:16 - a vertical-only stream for the Shorts feed.</summary>
    Portrait = 1
}

public enum LiveStreamQuality
{
    /// <summary>1280x720 at 30 fps, 3 Mbps - inside YouTube's 720p30 range and gentle on upload bandwidth.</summary>
    Hd720 = 0,

    /// <summary>1920x1080 at 30 fps, 6 Mbps - the top of YouTube's 1080p30 range.</summary>
    Hd1080 = 1
}

/// <summary>What one playlist item looks like on air.</summary>
public enum LiveStreamItemKind
{
    /// <summary>A video, letterboxed into the frame.</summary>
    Video = 0,

    /// <summary>A song shown radio-style: its cover (or a plain backdrop) with a live waveform.</summary>
    CoverAndAudio = 1
}

/// <summary>Where one playlist item comes from.</summary>
public enum LiveStreamItemSource
{
    /// <summary>Files sent with the request: a video, or a song with an optional cover.</summary>
    Upload = 0,

    /// <summary>One of the caller's finished renders - a project render or a Clip Studio export.</summary>
    Render = 1,

    /// <summary>A video or audio asset from one of the caller's projects, with an optional image asset as cover.</summary>
    Asset = 2,

    /// <summary>A link on a supported site, fetched on the server while the stream is prepared.</summary>
    Url = 3,

    /// <summary>One of the caller's release kits: its visualizer, or its master with the cover.</summary>
    ReleaseKit = 4
}

public enum LiveStreamItemState
{
    Waiting = 0,

    /// <summary>Being downloaded from its link.</summary>
    Fetching = 1,

    /// <summary>Being converted into the stream's exact format.</summary>
    Preparing = 2,

    /// <summary>Converted; it can be previewed and streamed.</summary>
    Ready = 3,

    Failed = 4
}

public enum LiveStreamState
{
    /// <summary>Items are being fetched and converted. Nothing is sent yet.</summary>
    Preparing = 0,

    /// <summary>Every item is converted and can be previewed. Waiting for Go live.</summary>
    Ready = 1,

    /// <summary>ffmpeg started and is handshaking with the ingest server.</summary>
    Connecting = 2,

    /// <summary>Media is being delivered.</summary>
    Live = 3,

    /// <summary>The connection dropped after going live; trying again from the current item.</summary>
    Reconnecting = 4,

    /// <summary>Every requested loop was sent, or the time limit was reached. It can be sent again.</summary>
    Ended = 5,

    /// <summary>The owner stopped it. It can be sent again.</summary>
    Stopped = 6,

    Failed = 7
}

/// <summary>Whether a channel has a usable saved key for a destination.</summary>
public enum LiveStreamKeyState
{
    /// <summary>No key is saved: paste one, or ask an admin to save one for the channel.</summary>
    Missing = 0,

    Saved = 1,

    /// <summary>
    /// The ingest refused the saved key - normally because it was reset in YouTube Studio.
    /// It needs to be set again before it can be used.
    /// </summary>
    Rejected = 2,

    /// <summary>A key is saved but can't be decrypted, usually after the data key was rotated without the old one kept.</summary>
    Unreadable = 3
}

/// <summary>
/// What the caller chooses about a stream. The destination is an id from the server's own
/// configured list - never a URL - so a request can only ever push to an approved ingest.
/// </summary>
public sealed record LiveStreamSettings
{
    public string Destination { get; init; } = "youtube";
    public LiveStreamOrientation Orientation { get; init; } = LiveStreamOrientation.Landscape;
    public LiveStreamQuality Quality { get; init; } = LiveStreamQuality.Hd720;

    /// <summary>How many times the whole playlist plays. 0 means until stopped (or the server's time limit).</summary>
    public int Loops { get; init; }

    /// <summary>Plays the items in a random order (chosen once, when the stream is prepared).</summary>
    public bool Shuffle { get; init; }

    /// <summary>After going live, a dropped connection is retried from the item that was playing.</summary>
    public bool AutoReconnect { get; init; } = true;

    /// <summary>A name for the stream in this app's list only; it is not sent to YouTube.</summary>
    public string? Label { get; init; }

    /// <summary>
    /// The caller states they own or are licensed to broadcast everything in the playlist.
    /// Nothing is streamed without it: a live copyright claim ends the stream and strikes the channel.
    /// </summary>
    public bool RightsConfirmed { get; init; }
}

/// <summary>
/// One playlist entry as the client describes it. Exactly the fields its
/// <see cref="Source"/> needs are set; file fields name multipart parts (<c>file0</c>, ...),
/// never paths.
/// </summary>
public sealed record LiveStreamItemRequest
{
    public LiveStreamItemSource Source { get; init; }

    /// <summary>Shown in the playlist; defaults to the file, render or link title.</summary>
    public string? Title { get; init; }

    /// <summary>Upload: the part holding a video, or the song when <see cref="CoverField"/> is used.</summary>
    public string? FileField { get; init; }

    /// <summary>Upload: the part holding the cover image for a song. Optional.</summary>
    public string? CoverField { get; init; }

    public string? RenderJobId { get; init; }

    /// <summary>Asset: a video or audio asset.</summary>
    public string? AssetId { get; init; }

    /// <summary>Asset: an image asset shown as the cover of an audio asset. Optional.</summary>
    public string? CoverAssetId { get; init; }

    public string? Url { get; init; }

    /// <summary>Url: fetch only the audio and show it radio-style.</summary>
    public bool AudioOnly { get; init; }

    public string? ReleaseKitId { get; init; }

    /// <summary>ReleaseKit: stream the visualizer video instead of the master with its cover.</summary>
    public bool UseVisualizer { get; init; }
}

/// <summary>Where the stream key comes from when a stream goes live: a channel's saved key, or one pasted for this stream.</summary>
public sealed record LiveStreamGoLiveRequest
{
    /// <summary>A brand channel whose saved key for the stream's destination is used.</summary>
    public string? ChannelId { get; init; }

    /// <summary>A key used for this one stream and never stored.</summary>
    public string? StreamKey { get; init; }
}

public sealed record LiveStreamDestination(string Id, string Name, string? KeyHelpUrl);

public sealed record LiveStreamKeyStatus(
    string ChannelId,
    string DestinationId,
    LiveStreamKeyState State,
    string Masked,
    string? Fingerprint,
    DateTime? CreatedAt,
    DateTime? RotatedAt,
    DateTime? LastUsedAt,
    DateTime? RejectedAt);

/// <summary>A brand channel as Go Live sees it: its name and the state of its saved key for each destination.</summary>
public sealed record LiveStreamChannel(
    string Id,
    string Name,
    bool IsDefault,
    IReadOnlyList<LiveStreamKeyStatus> Keys);

/// <summary>What the Go Live and camera pages need up front.</summary>
/// <param name="CameraEnabled">Whether this server accepts camera / screen streams.</param>
/// <param name="AudienceStatsEnabled">Whether a YouTube Data API key is configured, so subscriber and viewer counts can be shown.</param>
public sealed record LiveStreamSetup(
    IReadOnlyList<LiveStreamDestination> Destinations,
    IReadOnlyList<LiveStreamChannel> Channels,
    bool CanUseSavedKeys,
    bool CanManageKeys,
    bool AllowLinks,
    int MaxItems,
    int MaxStreamsPerUser,
    bool CameraEnabled = false,
    int CameraMaxChunkBytes = 0,
    bool AudienceStatsEnabled = false);

public sealed record LiveStreamItemStatus(
    int Index,
    string Title,
    LiveStreamItemSource Source,
    LiveStreamItemKind Kind,
    LiveStreamItemState State,
    double Progress,
    double DurationSeconds,
    string? Message);

public sealed record LiveStreamStatus(
    string Id,
    string Label,
    string DestinationId,
    string DestinationName,
    LiveStreamOrientation Orientation,
    LiveStreamQuality Quality,
    int Loops,
    bool Shuffle,
    bool AutoReconnect,
    LiveStreamState State,
    bool CanGoLive,
    string? ChannelId,
    DateTime CreatedAt,
    DateTime? LiveSince,
    DateTime? EndedAt,
    double PlaylistDurationSeconds,
    double StreamedSeconds,
    int? CurrentItem,
    int Reconnects,
    double? Speed,
    string? Message,
    bool KeyNeedsAttention,
    IReadOnlyList<LiveStreamItemStatus> Items);
