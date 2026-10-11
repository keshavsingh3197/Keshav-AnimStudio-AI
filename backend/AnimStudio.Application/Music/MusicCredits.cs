using AnimStudio.Domain.Assets;
using AnimStudio.Domain.Jobs;
using AnimStudio.Domain.Projects;

namespace AnimStudio.Application.Music;

/// <summary>The "Music" block of a YouTube description: one credit per licensed track a render used.</summary>
public static class MusicCredits
{
    /// <summary>
    /// The music a render used: a clip export records its own; a project render used the
    /// project's bed. Voiceover lines are the user's own and need no credit.
    /// </summary>
    public static IReadOnlyList<string> AssetIdsUsedBy(RenderJob job, Project? project)
    {
        IEnumerable<string?> ids = job.ClipMerge is { } merge
            ? [merge.BackgroundMusicAssetId, .. merge.MusicTracks.Where(t => !t.IsVoiceover).Select(t => t.AssetId)]
            : [project?.Settings.BackgroundMusicAssetId];
        return [.. ids.Where(id => !string.IsNullOrWhiteSpace(id)).Select(id => id!).Distinct(StringComparer.Ordinal)];
    }

    /// <summary>Empty when none of the assets carries a credit.</summary>
    public static string Compose(IEnumerable<Asset> assets)
    {
        var lines = assets
            .Select(a => a.Provenance?.AttributionText?.Trim())
            .Where(t => !string.IsNullOrEmpty(t))
            // YouTube refuses < and > anywhere in a description.
            .Select(t => "• " + t!.Replace('<', '‹').Replace('>', '›'))
            .Distinct(StringComparer.Ordinal)
            .ToList();
        return lines.Count == 0 ? string.Empty : "🎵 Music\n" + string.Join("\n", lines);
    }
}
