using AnimStudio.Application.Music;

namespace AnimStudio.Application.Abstractions.Music;

/// <summary>
/// A searchable catalogue of music that is licensed for use in videos. Everything it returns
/// came from a third party and is treated as untrusted: URLs are checked against the
/// provider's own hosts and text is length-bounded before it leaves the adapter.
/// </summary>
public interface IMusicCatalog
{
    /// <summary>The provider id stored in an imported asset's provenance, e.g. <c>jamendo</c>.</summary>
    string ProviderId { get; }

    /// <summary>False until the provider's API key is set; search and import then explain why.</summary>
    bool IsConfigured { get; }

    Task<MusicSearchPage> SearchAsync(MusicSearchQuery query, CancellationToken ct);

    /// <summary>One track looked up again by id, so an import never trusts the client's copy of it.</summary>
    Task<MusicTrack?> GetAsync(string trackId, CancellationToken ct);

    /// <summary>The track's audio file, at most <paramref name="maxBytes"/> long.</summary>
    /// <exception cref="MusicCatalogException">The file can't be downloaded, or is too large.</exception>
    Task<byte[]> DownloadAsync(MusicTrack track, long maxBytes, CancellationToken ct);
}

public sealed class MusicCatalogException(string code, string message) : Exception(message)
{
    public string Code { get; } = code;
}
