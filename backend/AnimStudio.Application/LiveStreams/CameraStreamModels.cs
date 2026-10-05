namespace AnimStudio.Application.LiveStreams;

/// <summary>The container the browser's MediaRecorder produces. Chromium and Firefox record WebM; Safari records fragmented MP4.</summary>
public enum CameraContainer
{
    WebM = 0,
    Mp4 = 1
}

/// <summary>
/// A camera stream's lifecycle. Unlike a playlist there is nothing to prepare: the browser
/// sends what it records, and the server encodes it for the ingest as it arrives.
/// </summary>
public enum CameraStreamState
{
    /// <summary>The encoder is running and waiting for the first media to reach the ingest.</summary>
    Connecting = 0,

    /// <summary>Media is being delivered.</summary>
    Live = 1,

    /// <summary>
    /// The connection to the ingest dropped after going live. The encoder was restarted and
    /// the browser is asked to start a fresh recording, because a recording can't be joined
    /// mid-way.
    /// </summary>
    Reconnecting = 2,

    /// <summary>The browser finished the stream, stopped sending, or the time limit was reached.</summary>
    Ended = 3,

    /// <summary>The owner stopped it.</summary>
    Stopped = 4,

    Failed = 5
}

/// <summary>
/// What the caller chooses about a camera stream. The destination is an id from the
/// server's configured list - never a URL - exactly as for a playlist.
/// </summary>
public sealed record CameraStreamSettings
{
    public string Destination { get; init; } = "youtube";
    public LiveStreamOrientation Orientation { get; init; } = LiveStreamOrientation.Landscape;
    public LiveStreamQuality Quality { get; init; } = LiveStreamQuality.Hd720;
    public CameraContainer Container { get; init; } = CameraContainer.WebM;

    /// <summary>After going live, a dropped connection is retried with a fresh recording.</summary>
    public bool AutoReconnect { get; init; } = true;

    /// <summary>A name for the stream in this app only; it is not sent to YouTube.</summary>
    public string? Label { get; init; }

    /// <summary>
    /// The caller confirms that everyone on camera agreed to be broadcast, and that they hold
    /// the rights to anything else shown or played.
    /// </summary>
    public bool RightsConfirmed { get; init; }
}

public sealed record CameraStreamStartRequest
{
    public CameraStreamSettings? Settings { get; init; }

    /// <summary>The key source, as for a playlist's Go live: a channel's saved key or a pasted one.</summary>
    public LiveStreamGoLiveRequest? GoLive { get; init; }
}

/// <param name="Generation">Which recording the server expects. It changes when the encoder is restarted.</param>
/// <param name="NextSequence">The next chunk the server expects within <paramref name="Generation"/>.</param>
public sealed record CameraStreamStatus(
    string Id,
    string Label,
    string DestinationId,
    string DestinationName,
    LiveStreamOrientation Orientation,
    LiveStreamQuality Quality,
    CameraContainer Container,
    CameraStreamState State,
    string? ChannelId,
    DateTime CreatedAt,
    DateTime? LiveSince,
    DateTime? EndedAt,
    int Generation,
    long NextSequence,
    long ReceivedBytes,
    double StreamedSeconds,
    double? Speed,
    int Reconnects,
    string? Message,
    bool KeyNeedsAttention);

/// <summary>What happened to one chunk of recorded media.</summary>
public enum CameraChunkOutcome
{
    Accepted = 0,

    /// <summary>Already received (a retry after a lost response). Nothing is written twice.</summary>
    Duplicate = 1,

    /// <summary>A chunk was skipped. The browser resends from the status's <c>NextSequence</c>.</summary>
    OutOfOrder = 2,

    /// <summary>The encoder was restarted; the browser must start a new recording for the current generation.</summary>
    RestartRecording = 3,

    /// <summary>The first chunk isn't the container that was declared.</summary>
    NotMedia = 4,

    TooLarge = 5,

    /// <summary>The stream is no longer sending.</summary>
    Ended = 6,

    NotFound = 7
}

/// <summary>A channel's public numbers, as YouTube reports them to anyone.</summary>
/// <param name="SubscriberCount">YouTube rounds this to three significant figures. Null when the channel hides it.</param>
public sealed record YouTubeChannelStats(
    string ChannelId,
    string Title,
    long? SubscriberCount,
    bool SubscribersHidden,
    long? ViewCount,
    long? VideoCount);

/// <summary>A live broadcast's public numbers.</summary>
/// <param name="ConcurrentViewers">Only reported while the broadcast is live, and not for every broadcast.</param>
public sealed record YouTubeLiveStats(
    string VideoId,
    string Title,
    bool IsLive,
    long? ConcurrentViewers,
    long? LikeCount,
    long? ViewCount);

public sealed record YouTubeAudienceStats(
    YouTubeChannelStats? Channel,
    YouTubeLiveStats? Live,
    DateTime FetchedAt);
