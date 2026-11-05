using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Domain.Stories;
using Microsoft.Extensions.Logging;

namespace AnimStudio.Application.StoryAgent;

/// <summary>Where a new story finds its genre.</summary>
public interface IStoryGenreCatalog
{
    /// <summary>The genres, in picker order; with <paramref name="enabledOnly"/> only those offered for new stories.</summary>
    Task<IReadOnlyList<StoryGenre>> ListAsync(bool enabledOnly, CancellationToken ct);

    /// <summary>One genre, or null when there is none with that id.</summary>
    Task<StoryGenre?> GetAsync(string id, CancellationToken ct);
}

/// <summary>Why a genre change was refused, with the field it is about.</summary>
public sealed class StoryGenreException(string code, string message, string? field = null, bool notFound = false) : Exception(message)
{
    public string Code { get; } = code;
    public string? Field { get; } = field;
    public bool NotFound { get; } = notFound;
}

/// <summary>
/// The genres in the database, with the built-in ones written there on first use so that everything the app knows -
/// the devotional topics and the Granth pointers included - is in one place and can be edited without a deploy.
/// </summary>
/// <remarks>
/// If the database cannot be read the built-in genres are served instead, so the Story Agent keeps working; saving
/// needs the database and fails loudly.
/// </remarks>
public sealed class StoryGenreService(
    IStoryGenreRepository repository,
    TimeProvider clock,
    ILogger<StoryGenreService> logger) : IStoryGenreCatalog
{
    public async Task<IReadOnlyList<StoryGenre>> ListAsync(bool enabledOnly, CancellationToken ct)
    {
        IReadOnlyList<StoryGenre> stored;
        try
        {
            stored = await SeededAsync(ct).ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogError(ex, "Story genres could not be read from the database; serving the built-in ones.");
            stored = StoryGenres.All();
        }

        return [.. stored
            .Where(g => !enabledOnly || g.Enabled)
            .OrderBy(g => g.Order)
            .ThenBy(g => g.Name, StringComparer.OrdinalIgnoreCase)];
    }

    public async Task<StoryGenre?> GetAsync(string id, CancellationToken ct)
    {
        var key = id?.Trim().ToLowerInvariant();
        if (string.IsNullOrEmpty(key)) return null;
        return (await ListAsync(enabledOnly: false, ct).ConfigureAwait(false))
            .FirstOrDefault(g => string.Equals(g.Id, key, StringComparison.Ordinal));
    }

    /// <summary>Creates or replaces a genre. A built-in one keeps its built-in mark whatever the request says.</summary>
    public async Task<StoryGenre> SaveAsync(StoryGenre input, string? actor, bool creating, CancellationToken ct)
    {
        var (genre, problems) = StoryGenreRules.Normalize(input);
        if (genre is null)
        {
            var first = problems[0];
            throw new StoryGenreException(first.Code, string.Join(" ", problems.Select(p => p.Message).Distinct()), first.Field);
        }

        var existing = await repository.GetAsync(genre.Id, ct).ConfigureAwait(false);
        if (creating && existing is not null)
            throw new StoryGenreException("genre-exists", $"A genre with the id '{genre.Id}' already exists.", "id");
        if (!creating && existing is null && StoryGenres.Find(genre.Id) is null)
            throw new StoryGenreException("genre-not-found", "That genre does not exist.", notFound: true);

        genre.BuiltIn = StoryGenres.Find(genre.Id) is not null;
        genre.UpdatedAtUtc = clock.GetUtcNow().UtcDateTime;
        genre.UpdatedBy = actor;

        await repository.UpsertAsync(genre, ct).ConfigureAwait(false);
        return genre;
    }

    /// <summary>Removes a genre the administrator made, or puts a built-in one back as it shipped. Returns what is left, if anything.</summary>
    public async Task<StoryGenre?> DeleteOrResetAsync(string id, string? actor, CancellationToken ct)
    {
        var key = id?.Trim().ToLowerInvariant() ?? string.Empty;
        if (StoryGenres.Find(key) is { } shipped)
        {
            shipped.UpdatedAtUtc = clock.GetUtcNow().UtcDateTime;
            shipped.UpdatedBy = actor;
            await repository.UpsertAsync(shipped, ct).ConfigureAwait(false);
            return shipped;
        }

        if (!await repository.DeleteAsync(key, ct).ConfigureAwait(false))
            throw new StoryGenreException("genre-not-found", "That genre does not exist.", notFound: true);
        return null;
    }

    /// <summary>
    /// The stored genres, after writing any built-in one that is missing. Checked on every read - it costs nothing once
    /// they are all there - so a built-in genre removed from the database by hand comes back.
    /// </summary>
    private async Task<IReadOnlyList<StoryGenre>> SeededAsync(CancellationToken ct)
    {
        var stored = await repository.ListAsync(ct).ConfigureAwait(false);
        var have = stored.Select(g => g.Id).ToHashSet(StringComparer.Ordinal);
        var missing = StoryGenres.All().Where(g => !have.Contains(g.Id)).ToList();
        foreach (var genre in missing)
        {
            genre.UpdatedAtUtc = clock.GetUtcNow().UtcDateTime;
            genre.UpdatedBy = "built-in";
            await repository.UpsertAsync(genre, ct).ConfigureAwait(false);
        }

        if (missing.Count == 0) return stored;

        logger.LogInformation("Wrote {Count} built-in story genre(s) to the database.", missing.Count);
        return [.. stored, .. missing];
    }
}
