namespace AnimStudio.Infrastructure.LiveStreams;

public sealed class LiveStreamOptions
{
    public const string Section = "LiveStream";

    /// <summary>
    /// Streams being sent at once. Sending copies prepared segments without re-encoding, so
    /// each costs little CPU; the real limit is upload bandwidth (3-6 Mbps per stream).
    /// </summary>
    public int MaxConcurrentStreams { get; set; } = 4;

    /// <summary>
    /// Playlist items converted at once, across all users. Converting is a full x264 encode,
    /// so the default leaves the machine to the render queue as much as it can.
    /// </summary>
    public int MaxConcurrentPreparations { get; set; } = 1;

    /// <summary>Prepared streams one user can hold at once. Each keeps its converted segments on disk.</summary>
    public int MaxStreamsPerUser { get; set; } = 5;

    /// <summary>
    /// A "loop until stopped" stream still ends here. The server never streams forever
    /// unattended because a forgotten stream costs upload bandwidth all day.
    /// </summary>
    public int MaxHours { get; set; } = 12;

    /// <summary>
    /// How long a stream that isn't sending - prepared, ended, stopped or failed - is kept,
    /// with its segments, so it can be previewed or sent again without preparing it again.
    /// </summary>
    public int KeepIdleMinutes { get; set; } = 360;

    /// <summary>Times a dropped connection is retried after going live, with growing pauses.</summary>
    public int ReconnectAttempts { get; set; } = 5;

    /// <summary>The largest file a link item may download.</summary>
    public long MaxFetchBytes { get; set; } = 2L * 1024 * 1024 * 1024;

    /// <summary>
    /// Whether callers who aren't admins may send with a channel's saved key. Off by
    /// default: a saved key lets anyone who can use it broadcast on that channel, so only
    /// admins can, and everyone else pastes a key for their stream.
    /// </summary>
    public bool AllowSavedKeysForNonAdmins { get; set; }

    /// <summary>
    /// Where a stream may be sent, by id. Callers pick an id and never send a URL, so the
    /// server can't be used to push media to an arbitrary host. Each URL must be rtmps://:
    /// plain RTMP would carry the stream key in clear text. Entries that aren't are
    /// ignored and logged at startup.
    /// </summary>
    public Dictionary<string, LiveStreamDestinationOptions> Destinations { get; set; } = new(StringComparer.Ordinal);

    /// <summary>Streaming from the browser's camera or screen.</summary>
    public CameraStreamOptions Camera { get; set; } = new();
}

public sealed class CameraStreamOptions
{
    public bool Enabled { get; set; } = true;

    /// <summary>
    /// Camera streams sent at once, across all users. Unlike a playlist, each one is a
    /// real-time x264 encode, so this is bounded by CPU as well as upload bandwidth.
    /// </summary>
    public int MaxConcurrent { get; set; } = 2;

    /// <summary>The largest single chunk the browser may send. About two seconds of 1080p at a generous bitrate.</summary>
    public int MaxChunkBytes { get; set; } = 8 * 1024 * 1024;

    /// <summary>A stream whose page stops sending for this long is ended, so a closed tab doesn't hold an encoder.</summary>
    public int IdleTimeoutSeconds { get; set; } = 20;

    /// <summary>x264 preset for the real-time encode. Slower presets look better but must keep up with 1.0× speed.</summary>
    public string Preset { get; set; } = "veryfast";

    /// <summary>How long a finished camera stream stays in the list.</summary>
    public int KeepFinishedMinutes { get; set; } = 30;
}

/// <summary>
/// The YouTube Data API, used only to read public audience numbers (subscribers, live
/// viewers) for the camera page's overlays. The key is a secret: set it with
/// <c>dotnet user-secrets set "YouTube:ApiKey" "…"</c>, the <c>YouTube__ApiKey</c>
/// environment variable, or Key Vault - never in appsettings.json.
/// </summary>
public sealed class YouTubeDataOptions
{
    public const string Section = "YouTube";

    public string? ApiKey { get; set; }

    /// <summary>How long one lookup is reused. Each one costs quota, and YouTube itself only updates these numbers every few seconds.</summary>
    public int CacheSeconds { get; set; } = 30;
}

public sealed class LiveStreamDestinationOptions
{
    public string Name { get; set; } = string.Empty;

    /// <summary>The server URL; the key is appended as the last path segment, as encoders do.</summary>
    public string IngestUrl { get; set; } = string.Empty;

    /// <summary>Where the owner finds or resets the key, shown next to the key field. Optional.</summary>
    public string? KeyHelpUrl { get; set; }
}
