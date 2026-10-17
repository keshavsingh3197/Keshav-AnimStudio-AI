using System.Globalization;
using System.Text.RegularExpressions;
using AnimStudio.Domain.Jobs;

namespace AnimStudio.Application.Publishing;

/// <summary>
/// Where a render goes inside its Drive folder, so a channel's folder stays browsable however
/// many shorts land in it: one folder per project, inside it one per day and batch, and the
/// batch's shorts numbered in order.
/// <code>
/// OMKR Shorts/
///   KATHU SHYAM/
///     2026-10-17 KATHU SHYAM shorts/
///       01 KATHU SHYAM short #1.mp4
///       02 KATHU SHYAM short #2.mp4
///     2026-10-17 Single exports/
///       Main video.mp4
/// </code>
/// Dates are UTC: the server has no idea of the viewer's time zone, and a stable answer
/// matters more here than a local one.
/// </summary>
public static partial class DriveLayout
{
    public const string SingleExports = "Single exports";
    public const string UntitledProject = "Untitled project";

    /// <summary>The longest folder name Drive queries are built from (see <c>GoogleDriveClient.IsValidFolderName</c>).</summary>
    public const int MaxFolderName = 100;

    /// <summary>The folders below the channel's (or Drive's) own folder, outermost first.</summary>
    public static IReadOnlyList<string> FoldersFor(string? projectName, RenderJob job)
    {
        var project = CleanFolderName(projectName, UntitledProject);
        var day = (job.Batch?.CreatedAt is { } batchAt && batchAt != default ? batchAt : job.CreatedAt)
            .ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
        var group = job.Batch is { } batch ? CleanFolderName(batch.Name, "Auto shorts") : SingleExports;
        return [project, CleanFolderName($"{day} {group}", day)];
    }

    /// <summary>What copies were called before renders without a name got one of their own.</summary>
    public const string PlaceholderFileName = "AnimStudio video.mp4";

    /// <summary>
    /// The title a render is copied and filed under: its own name, else the export name typed
    /// for a clip merge, else one made from the project, the format and a piece of the job's
    /// id - so ten unnamed exports of one project don't all land as the same file name.
    /// </summary>
    public static string TitleFor(RenderJob job, string? projectName)
    {
        if (!string.IsNullOrWhiteSpace(job.Name)) return job.Name.Trim();
        if (job.ClipMerge?.ExportName is { } exportName && !string.IsNullOrWhiteSpace(exportName)) return exportName.Trim();

        var project = string.IsNullOrWhiteSpace(projectName) ? "AnimStudio" : projectName.Trim();
        var format = string.IsNullOrWhiteSpace(job.TargetFormat) ? "video" : job.TargetFormat.Trim().ToLowerInvariant();
        var id = job.Id.Trim();
        return id.Length == 0 ? $"{project} {format}" : $"{project} {format} {id[^Math.Min(6, id.Length)..]}";
    }

    /// <summary>
    /// The file's title before it is made a safe file name: a batch's shorts are numbered so
    /// Drive's name sort keeps them in the order they were made.
    /// </summary>
    public static string FileTitleFor(string title, RenderJob job)
    {
        var trimmed = title.Trim();
        if (job.Batch is not { } batch) return trimmed;
        var width = Math.Max(2, batch.Count.ToString(CultureInfo.InvariantCulture).Length);
        return (batch.Index + 1).ToString(CultureInfo.InvariantCulture).PadLeft(width, '0') + " " + trimmed;
    }

    /// <summary>
    /// <paramref name="value"/> as a folder name Drive's queries can hold: letters, digits,
    /// spaces and <c>- _ . ( ) &amp;</c>, at most <see cref="MaxFolderName"/> characters.
    /// </summary>
    public static string CleanFolderName(string? value, string fallback)
    {
        if (string.IsNullOrWhiteSpace(value)) return fallback;
        var cleaned = Whitespace().Replace(FolderUnsafe().Replace(value, " "), " ").Trim();
        if (cleaned.Length > MaxFolderName) cleaned = cleaned[..MaxFolderName].TrimEnd();
        return cleaned.Length == 0 ? fallback : cleaned;
    }

    [GeneratedRegex(@"[^\p{L}\p{M}\p{N} _.\-()&]")]
    private static partial Regex FolderUnsafe();

    [GeneratedRegex(@"\s+")]
    private static partial Regex Whitespace();
}
