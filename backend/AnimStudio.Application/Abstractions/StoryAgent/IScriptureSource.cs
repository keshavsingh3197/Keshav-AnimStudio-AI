using AnimStudio.Domain.Stories;

namespace AnimStudio.Application.Abstractions.StoryAgent;

/// <summary>
/// Somewhere the text of the Granths can be read from. The research step asks for chapters it
/// already knows by place, and for pages that mention words it could not place.
/// </summary>
public interface IScriptureSource
{
    /// <summary>A short name for logs and for the passage's licence line.</summary>
    string Id { get; }

    /// <summary>
    /// The text of one chapter, or null when this source does not hold it (or has no page for that
    /// kind of reference). For a text divided into chapters with verses inside, such as the Gita,
    /// <paramref name="division"/> is the chapter and the whole chapter comes back.
    /// </summary>
    /// <exception cref="ScriptureSourceException">The source could not be reached or is refusing requests.</exception>
    Task<ScripturePassage?> FetchChapterAsync(string textId, int division, int unit, CancellationToken ct);

    /// <summary>Pages that match these words, read in full, best match first; at most <paramref name="max"/>.</summary>
    /// <exception cref="ScriptureSourceException">The source could not be reached or is refusing requests.</exception>
    Task<IReadOnlyList<ScripturePassage>> SearchAsync(string query, int max, CancellationToken ct);
}

/// <summary>The source is unreachable, rate-limiting, or answered with something unusable. Carries a stable code.</summary>
public sealed class ScriptureSourceException(string code, string message) : Exception(message)
{
    public string Code { get; } = code;
}
