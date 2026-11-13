namespace AnimStudio.Domain.LiveStreams;

/// <summary>
/// A record of one Go Live stream, kept after the stream itself is gone (streams only live in
/// memory). Holds what was streamed and how it went - never a stream key.
/// </summary>
public sealed class LiveStreamHistoryEntry
{
    /// <summary>The stream's id.</summary>
    public string Id { get; set; } = string.Empty;

    public string UserId { get; set; } = string.Empty;

    /// <summary>What the owner calls it. Starts as the stream's label and can be renamed.</summary>
    public string Name { get; set; } = string.Empty;

    public string DestinationId { get; set; } = string.Empty;
    public string DestinationName { get; set; } = string.Empty;
    public string Quality { get; set; } = string.Empty;
    public string Orientation { get; set; } = string.Empty;
    public int Loops { get; set; }
    public bool Shuffle { get; set; }
    public string? ChannelId { get; set; }

    public List<string> ItemTitles { get; set; } = [];

    public string State { get; set; } = string.Empty;
    public string? Message { get; set; }
    public double StreamedSeconds { get; set; }
    public int Reconnects { get; set; }

    public DateTime CreatedAtUtc { get; set; }
    public DateTime UpdatedAtUtc { get; set; }
    public DateTime? LiveSinceUtc { get; set; }
    public DateTime? EndedAtUtc { get; set; }
}
