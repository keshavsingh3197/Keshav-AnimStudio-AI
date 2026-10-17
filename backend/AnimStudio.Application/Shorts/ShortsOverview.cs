using AnimStudio.Domain.Assets;
using AnimStudio.Domain.Jobs;

namespace AnimStudio.Application.Shorts;

/// <summary>Targets the Shorts page measures the user's output against.</summary>
public sealed class ShortsOptions
{
    public const string Section = "Shorts";

    /// <summary>Shorts the user means to make a week. 0 turns the reminder off.</summary>
    public int WeeklyGoal { get; set; }

    /// <summary>Warn when a project that makes auto shorts has fewer unused clips and pictures than this.</summary>
    public int LowStockThreshold { get; set; } = 5;

    /// <summary>Remind about a finished short not yet on YouTube after this many days.</summary>
    public int UnpublishedReminderDays { get; set; } = 2;
}

/// <summary>A project's clips and pictures, and how many no short has used yet.</summary>
public sealed record ShortsPool(
    string ProjectId, string ProjectName,
    int Videos, int Images, int UnusedVideos, int UnusedImages,
    int Batches, int Shorts)
{
    public int Total => Videos + Images;
    public int Unused => UnusedVideos + UnusedImages;
}

/// <summary>Something on the Shorts page that wants the user's attention.</summary>
/// <param name="Code">Stable id the page keys on: pool-empty, pool-low, weekly-goal, not-on-youtube, render-failed, drive-failed.</param>
/// <param name="Severity">info, warning or error.</param>
public sealed record ShortsAlert(string Code, string Severity, string Message, string? ProjectId, int Count);

/// <summary>Where one finished or running short stands, as the alerts need it.</summary>
public sealed record ShortState(RenderJob Job, bool OnYouTube, bool OnDrive, bool DriveFailed);

/// <summary>
/// Which library files the user's shorts have used, and what needs attention. Pure: the
/// caller loads the user's own jobs, assets and publish records and passes them in.
/// </summary>
public static class ShortsOverview
{
    /// <summary>
    /// Every library file a render puts on screen: the running order and any timeline item
    /// that points at a file. Text items carry words, not ids, so they are left out.
    /// </summary>
    public static IEnumerable<string> AssetIdsIn(RenderJob job)
    {
        if (job.ClipMerge is not { } spec) return [];
        return spec.AssetIds
            .Concat(spec.TimelineItems.Where(i => i.Type is "video" or "image" && !string.IsNullOrEmpty(i.Src)).Select(i => i.Src))
            .Where(id => !string.IsNullOrWhiteSpace(id))
            .Distinct(StringComparer.Ordinal);
    }

    /// <summary>
    /// How many renders each file appears in. A failed or cancelled render never reached
    /// anyone, so it does not use a file up.
    /// </summary>
    public static Dictionary<string, int> CountUses(IEnumerable<RenderJob> jobs)
    {
        var uses = new Dictionary<string, int>(StringComparer.Ordinal);
        foreach (var job in jobs)
        {
            if (job.Status is RenderJobStatus.Failed or RenderJobStatus.Cancelled) continue;
            foreach (var id in AssetIdsIn(job))
                uses[id] = uses.GetValueOrDefault(id) + 1;
        }
        return uses;
    }

    /// <summary>A file an auto short can be cut from: footage or a picture, cleared for use, and not itself an export.</summary>
    public static bool IsShortSource(Asset asset) =>
        asset.Kind is AssetKind.Video or AssetKind.Image
        && asset.IsUsableInScene
        && !asset.StorageKey.StartsWith("renders/", StringComparison.Ordinal);

    public static ShortsPool Pool(string projectId, string projectName, IEnumerable<Asset> assets, IReadOnlyCollection<RenderJob> jobs)
    {
        var uses = CountUses(jobs);
        var sources = assets.Where(IsShortSource).ToList();
        var videos = sources.Where(a => a.Kind == AssetKind.Video).ToList();
        var images = sources.Where(a => a.Kind == AssetKind.Image).ToList();
        return new ShortsPool(
            projectId, projectName,
            videos.Count, images.Count,
            videos.Count(a => !uses.ContainsKey(a.Id)), images.Count(a => !uses.ContainsKey(a.Id)),
            jobs.Where(j => j.Batch is not null).Select(j => j.Batch!.Id).Distinct(StringComparer.Ordinal).Count(),
            jobs.Count(j => j.Batch is not null));
    }

    /// <summary>
    /// What to tell the user, most urgent first. Stock alerts only cover projects that make
    /// auto shorts - a project that never has is not "running out" of anything.
    /// </summary>
    public static IReadOnlyList<ShortsAlert> Alerts(
        IReadOnlyList<ShortState> shorts, IReadOnlyList<ShortsPool> pools, ShortsOptions options, DateTime nowUtc)
    {
        var alerts = new List<ShortsAlert>();

        var failed = shorts.Count(s => s.Job.Status == RenderJobStatus.Failed);
        if (failed > 0)
            alerts.Add(new("render-failed", "error", $"{failed} short{Plural(failed)} failed to render. Retry or delete {(failed == 1 ? "it" : "them")}.", null, failed));

        var driveFailed = shorts.Count(s => s.DriveFailed && !s.OnDrive);
        if (driveFailed > 0)
            alerts.Add(new("drive-failed", "error", $"{driveFailed} cop{(driveFailed == 1 ? "y" : "ies")} to Google Drive failed. Select them and save to Drive again.", null, driveFailed));

        foreach (var pool in pools.Where(p => p.Batches > 0))
        {
            if (pool.Total > 0 && pool.Unused == 0)
                alerts.Add(new("pool-empty", "warning",
                    $"Every clip and picture in {pool.ProjectName} has been used in a short. Add new ones to keep the shorts fresh.",
                    pool.ProjectId, 0));
            else if (pool.Unused < Math.Max(1, options.LowStockThreshold))
                alerts.Add(new("pool-low", "info",
                    $"Only {pool.Unused} unused clip{Plural(pool.Unused)} or picture{Plural(pool.Unused)} left in {pool.ProjectName}.",
                    pool.ProjectId, pool.Unused));
        }

        if (options.WeeklyGoal > 0)
        {
            var made = shorts.Count(s => s.Job.CreatedAt >= nowUtc.AddDays(-7)
                                         && s.Job.Status is not (RenderJobStatus.Failed or RenderJobStatus.Cancelled));
            if (made < options.WeeklyGoal)
                alerts.Add(new("weekly-goal", "warning",
                    $"{made} of {options.WeeklyGoal} shorts made in the last 7 days. Make {options.WeeklyGoal - made} more to stay on target.",
                    null, options.WeeklyGoal - made));
        }

        var waitingSince = nowUtc.AddDays(-Math.Max(0, options.UnpublishedReminderDays));
        var unpublished = shorts.Count(s => IsReady(s.Job) && !s.OnYouTube && (s.Job.CompletedAt ?? s.Job.CreatedAt) <= waitingSince);
        if (unpublished > 0)
            alerts.Add(new("not-on-youtube", "info",
                $"{unpublished} finished short{Plural(unpublished)} {(unpublished == 1 ? "has" : "have")} been waiting {options.UnpublishedReminderDays}+ days without going to YouTube.",
                null, unpublished));

        return alerts;
    }

    public static bool IsReady(RenderJob job) =>
        job.Status is RenderJobStatus.Completed or RenderJobStatus.CompletedWithWarnings && job.OutputStorageKey is not null;

    private static string Plural(int n) => n == 1 ? string.Empty : "s";
}
