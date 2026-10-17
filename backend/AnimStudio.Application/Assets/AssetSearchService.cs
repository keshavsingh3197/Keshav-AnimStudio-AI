using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Common;
using AnimStudio.Domain.Assets;
using AnimStudio.Domain.Projects;
using AnimStudio.Domain.Rendering;

namespace AnimStudio.Application.Assets;

/// <summary>Where a search for files to reuse looks.</summary>
public enum AssetSearchScope
{
    /// <summary>The user's other projects on the same brand channel as the target project.</summary>
    Channel,

    /// <summary>All of the user's other projects, same-channel ones still ranked first.</summary>
    All
}

/// <summary>How the matches are ordered.</summary>
public enum AssetSearchSort
{
    /// <summary>Same channel first, then the best name match, then the newest.</summary>
    Relevance,
    Newest,
    Oldest,
    Name,
    Largest
}

public sealed record AssetSearchQuery
{
    public required string TargetProjectId { get; init; }
    public required string UserId { get; init; }
    public string? Text { get; init; }
    public AssetSearchScope Scope { get; init; } = AssetSearchScope.Channel;

    /// <summary>Only projects on this brand channel; overrides <see cref="Scope"/>.</summary>
    public string? ChannelId { get; init; }

    /// <summary>Only this one of the user's projects.</summary>
    public string? SourceProjectId { get; init; }

    public AssetKind? Kind { get; init; }
    public AssetSearchSort Sort { get; init; } = AssetSearchSort.Relevance;

    /// <summary>How many of the ordered matches to skip, for paging.</summary>
    public int Offset { get; init; }

    public int Limit { get; init; } = AssetSearchService.DefaultLimit;
}

/// <summary>One file from another project that could be brought into the target.</summary>
/// <param name="AlreadyAdded">A copy of it is already in the target project.</param>
public sealed record AssetSearchHit(Asset Asset, Project Project, string ChannelId, bool SameChannel, bool AlreadyAdded);

/// <summary>A project the search looked in, with how many of its files match (ignoring the project filter).</summary>
public sealed record AssetSearchProjectFacet(string ProjectId, string Name, string ChannelId, bool SameChannel, int Matches);

/// <param name="Hits">One page of the matches.</param>
/// <param name="Total">Every match, across all pages.</param>
/// <param name="ProjectsSearched">How many of the user's projects were looked in.</param>
/// <param name="Truncated">More matches follow this page.</param>
/// <param name="KindCounts">Matches per file type, ignoring the type filter, so the chips can show counts.</param>
/// <param name="Projects">Projects with at least one match, ignoring the project filter.</param>
public sealed record AssetSearchResult(
    IReadOnlyList<AssetSearchHit> Hits,
    int Total,
    int ProjectsSearched,
    bool Truncated,
    IReadOnlyDictionary<AssetKind, int> KindCounts,
    IReadOnlyList<AssetSearchProjectFacet> Projects);

/// <summary>
/// Finds files in the user's other projects - uploads, downloads, exported cuts - so one
/// made for an earlier video can be reused in this one without uploading it again.
/// <para>
/// Only ever the caller's own projects: the project list comes from the user id, never from
/// the request. Bringing a hit over goes through
/// <see cref="AssetLibraryService.CopyIntoProjectAsync"/>, which checks ownership again
/// and gives the target its own copy of the bytes.
/// </para>
/// <para>
/// Ranking: same brand channel first (a channel's videos share intros, logos and music),
/// then how well the name matches, then the newest.
/// </para>
/// </summary>
public sealed class AssetSearchService(IAssetRepository assets, IProjectRepository projects)
{
    public const int DefaultLimit = 40;
    public const int MaxLimit = 100;
    public const int MaxQueryLength = 100;

    /// <summary>Paging stops here; past it, narrowing the search is the better tool.</summary>
    public const int MaxOffset = 10_000;

    /// <summary>
    /// The most projects one search opens, most recently updated first. Assets are listed
    /// per project, so this bounds the work a single request can cause.
    /// </summary>
    public const int MaxProjectsSearched = 200;

    public async Task<AssetSearchResult> SearchAsync(AssetSearchQuery query, CancellationToken ct)
    {
        var text = (query.Text ?? string.Empty).Trim();
        if (text.Length > MaxQueryLength)
            throw EditingException.Invalid("query-too-long", $"Search for at most {MaxQueryLength} characters.");

        var limit = Math.Clamp(query.Limit, 1, MaxLimit);
        var offset = Math.Clamp(query.Offset, 0, MaxOffset);

        var target = await projects.GetAsync(query.TargetProjectId, ct).ConfigureAwait(false)
            ?? throw new KeyNotFoundException();

        if (!string.Equals(target.UserId, query.UserId, StringComparison.Ordinal))
            throw new UnauthorizedAccessException();

        var targetChannel = ChannelKey(target.Settings.BrandChannelId);
        // A named channel wins over the scope; "This channel" is just the target's channel.
        var onlyChannel = query.ChannelId is not null ? ChannelKey(query.ChannelId)
            : query.Scope == AssetSearchScope.Channel ? targetChannel
            : null;

        var candidates = (await projects.ListAsync(query.UserId, ct).ConfigureAwait(false))
            .Where(p => !string.Equals(p.Id, target.Id, StringComparison.Ordinal))
            .Where(p => onlyChannel is null
                        || string.Equals(ChannelKey(p.Settings.BrandChannelId), onlyChannel, StringComparison.Ordinal))
            .OrderByDescending(p => string.Equals(ChannelKey(p.Settings.BrandChannelId), targetChannel, StringComparison.Ordinal))
            .ThenByDescending(p => p.UpdatedAt)
            .Take(MaxProjectsSearched)
            .ToList();

        // What the target already holds a copy of, so the dialog can say "added" instead of
        // offering to add it a second time.
        var copiedHere = (await assets.ListByProjectAsync(target.Id, ct).ConfigureAwait(false))
            .Where(a => a.CopiedFromAssetId is not null)
            .Select(a => a.CopiedFromAssetId!)
            .ToHashSet(StringComparer.Ordinal);

        var terms = text.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries);
        var scored = new List<(AssetSearchHit Hit, int Score)>();
        var kindCounts = new Dictionary<AssetKind, int>();
        var projectFacets = new List<AssetSearchProjectFacet>();

        foreach (var project in candidates)
        {
            var channel = ChannelKey(project.Settings.BrandChannelId);
            var sameChannel = string.Equals(channel, targetChannel, StringComparison.Ordinal);
            var inProject = query.SourceProjectId is null
                            || string.Equals(project.Id, query.SourceProjectId, StringComparison.Ordinal);
            var list = await assets.ListByProjectAsync(project.Id, ct).ConfigureAwait(false);
            var projectMatches = 0;

            foreach (var asset in list)
            {
                if (asset.Kind == AssetKind.Unknown) continue;

                var match = MatchScore(asset, project, text, terms);
                if (match < 0) continue;

                // Each facet ignores its own filter, so it can say what picking another value would show.
                var kindOk = query.Kind is not { } kind || asset.Kind == kind;
                if (inProject) kindCounts[asset.Kind] = kindCounts.GetValueOrDefault(asset.Kind) + 1;
                if (kindOk) projectMatches++;
                if (!kindOk || !inProject) continue;

                var hit = new AssetSearchHit(asset, project, channel, sameChannel,
                    copiedHere.Contains(asset.Id));
                scored.Add((hit, (sameChannel ? 1000 : 0) + match));
            }

            if (projectMatches > 0)
                projectFacets.Add(new AssetSearchProjectFacet(project.Id, project.Name, channel, sameChannel, projectMatches));
        }

        var ordered = Order(scored, query.Sort).ToList();

        return new AssetSearchResult(
            [.. ordered.Skip(offset).Take(limit).Select(s => s.Hit)],
            ordered.Count,
            candidates.Count,
            ordered.Count > offset + limit,
            kindCounts,
            projectFacets);
    }

    private static IEnumerable<(AssetSearchHit Hit, int Score)> Order(
        List<(AssetSearchHit Hit, int Score)> scored, AssetSearchSort sort)
    {
        var first = sort switch
        {
            AssetSearchSort.Newest => scored.OrderByDescending(s => s.Hit.Asset.CreatedAt),
            AssetSearchSort.Oldest => scored.OrderBy(s => s.Hit.Asset.CreatedAt),
            AssetSearchSort.Name => scored.OrderBy(s => s.Hit.Asset.Name, StringComparer.OrdinalIgnoreCase),
            AssetSearchSort.Largest => scored.OrderByDescending(s => s.Hit.Asset.FileSizeBytes),
            _ => scored.OrderByDescending(s => s.Score).ThenByDescending(s => s.Hit.Asset.CreatedAt),
        };
        // The id tie-break keeps pages stable, so nothing repeats or goes missing between them.
        return first.ThenBy(s => s.Hit.Asset.Id, StringComparer.Ordinal);
    }

    /// <summary>
    /// How well a file matches, higher is better; -1 for no match. Every word typed must
    /// appear in the file's name, its original file name, or its project's name. A blank
    /// search matches everything equally, so recency decides.
    /// </summary>
    internal static int MatchScore(Asset asset, Project project, string text, IReadOnlyList<string> terms)
    {
        if (terms.Count == 0) return 0;

        var name = asset.Name;
        var fileName = asset.DisplayFileName ?? string.Empty;
        var projectName = project.Name;

        var inName = 0;
        foreach (var term in terms)
        {
            if (Contains(name, term) || Contains(fileName, term)) inName++;
            else if (!Contains(projectName, term)) return -1;
        }

        if (string.Equals(name, text, StringComparison.OrdinalIgnoreCase)) return 400;
        if (name.StartsWith(text, StringComparison.OrdinalIgnoreCase)) return 300;
        if (Contains(name, text)) return 200;
        if (inName == terms.Count) return 100;

        // Some words only matched the project's name: a weaker hit, but still a hit.
        return 10 + inName;
    }

    private static bool Contains(string haystack, string needle) =>
        haystack.Contains(needle, StringComparison.OrdinalIgnoreCase);

    /// <summary>Null, blank and "default" all name the built-in channel.</summary>
    private static string ChannelKey(string? channelId) =>
        BrandChannel.IsDefault(channelId) ? BrandChannel.DefaultId : channelId!;
}
