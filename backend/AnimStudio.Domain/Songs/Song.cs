namespace AnimStudio.Domain.Songs;

/// <summary>
/// A song composed on the Songs page: its lyrics (written by the person, or drafted by the text model and then edited),
/// the style it was asked for, and the audio Google Lyria made from them. Kept in the user's song index in object
/// storage, next to its audio file.
/// </summary>
public sealed class Song
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;

    /// <summary>What the song is about: a story, a festival, a deity, or the script of an auto post.</summary>
    public string? Theme { get; set; }

    /// <summary><c>hi</c> or <c>en</c>.</summary>
    public string Language { get; set; } = "hi";

    /// <summary>The musical style asked for, e.g. "bhajan" or "aarti".</summary>
    public string Style { get; set; } = string.Empty;

    public string? Mood { get; set; }

    /// <summary>The words that were sung; null for an instrumental.</summary>
    public string? Lyrics { get; set; }

    public bool Instrumental { get; set; }

    /// <summary>The Lyria model that composed it.</summary>
    public string Model { get; set; } = string.Empty;

    public string MimeType { get; set; } = string.Empty;

    /// <summary>Object-store key of the audio; set by the server only.</summary>
    public string AudioKey { get; set; } = string.Empty;

    public double? DurationSeconds { get; set; }

    /// <summary>The auto post this song was written for, when it was started from one.</summary>
    public string? SourcePostId { get; set; }

    public DateTime CreatedAtUtc { get; set; }
}
