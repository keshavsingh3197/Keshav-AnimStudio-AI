using System.IO.Compression;
using System.Text;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Abstractions.Storage;
using AnimStudio.Domain.Assets;
using AnimStudio.Domain.Characters;
using AnimStudio.Domain.Projects;
using AnimStudio.Domain.Rendering;
using AnimStudio.Domain.Scenes;
using Microsoft.Extensions.Logging;

namespace AnimStudio.Application.Workbooks;

/// <summary>
/// Writes a live project back out as a bundle: the sheets, and every picture and sound
/// they refer to, in one <c>.zip</c>.
/// </summary>
/// <remarks>
/// <para>
/// The mirror of <see cref="BundleReader"/>, and the half that makes the format worth
/// having. With both directions a project is portable - it can leave one machine and
/// arrive on another with its artwork intact - and it is also the honest backup story,
/// because what comes out is a file a person can open and read rather than a database dump.
/// </para>
/// <para>
/// It is also the fastest way to edit in bulk: export, sort forty scenes in a spreadsheet,
/// re-import. That round trip only works because the exporter writes the columns
/// <see cref="WorkbookSchema"/> defines, in the order it defines them, so the file that
/// comes out is the file the importer expects.
/// </para>
/// <para>
/// Every cell goes through <see cref="CellText.ForExport"/>. Export is the dangerous
/// direction for a spreadsheet: a character called <c>=cmd|...</c> is inert text in this
/// database and a live formula the moment the file is opened on someone's machine.
/// </para>
/// </remarks>
public sealed class BundleExportService(
    IProjectRepository projects,
    ICharacterRepository characters,
    ISceneRepository scenes,
    IAssetRepository assets,
    IObjectStore store,
    ILogger<BundleExportService> logger)
{
    /// <summary>
    /// A ceiling on what one export may pull out of storage. Reached only by a project with
    /// hundreds of large images, and the alternative is a request that quietly consumes the
    /// process's memory.
    /// </summary>
    public const long MaxMediaBytes = 512L * 1024 * 1024;

    private const int MaxMediaNameLength = 60;

    public async Task<byte[]> ExportAsync(string projectId, bool includeMedia, CancellationToken ct)
    {
        var project = await projects.GetAsync(projectId, ct) ?? throw new KeyNotFoundException();

        var castList = await characters.ListByProjectAsync(projectId, ct);
        var sceneList = await scenes.ListByProjectAsync(projectId, ct);
        var assetList = await assets.ListByProjectAsync(projectId, ct);

        var rate = project.Settings.ToCanvas().FrameRate;

        // Asset id to the path it will occupy inside the bundle, decided once so every
        // sheet that refers to a file writes the same name for it.
        var paths = MediaPaths(assetList);

        using var buffer = new MemoryStream();

        using (var zip = new ZipArchive(buffer, ZipArchiveMode.Create, leaveOpen: true))
        {
            AddText(zip, "README.txt", ReadMe(project, includeMedia));

            AddText(zip, $"{WorkbookSchema.ProjectSheet}.csv",
                Csv(WorkbookSchema.Project, [ProjectRow(project, paths)]));

            AddText(zip, $"{WorkbookSchema.CharactersSheet}.csv",
                Csv(WorkbookSchema.Characters, [.. castList.Select(c => CharacterRow(c, paths))]));

            AddText(zip, $"{WorkbookSchema.ScenesSheet}.csv",
                Csv(WorkbookSchema.Scenes,
                    [.. sceneList.Select(s => SceneRow(s, castList, paths, rate))]));

            AddText(zip, $"{WorkbookSchema.DialogueSheet}.csv",
                Csv(WorkbookSchema.Dialogue, [.. DialogueRows(sceneList, castList, rate)]));

            AddText(zip, $"{WorkbookSchema.AssetsSheet}.csv",
                Csv(WorkbookSchema.Assets, [.. assetList.Select(a => AssetRow(a, paths))]));

            if (includeMedia)
                await AddMediaAsync(zip, assetList, paths, ct).ConfigureAwait(false);
        }

        return buffer.ToArray();
    }

    /// <summary>A download name composed by the server, from the project's name.</summary>
    public static string FileNameFor(string projectName)
    {
        var safe = new string([.. projectName
            .Trim()
            .Select(c => char.IsLetterOrDigit(c) ? char.ToLowerInvariant(c) : '-')])
            .Trim('-');

        while (safe.Contains("--", StringComparison.Ordinal))
            safe = safe.Replace("--", "-", StringComparison.Ordinal);

        if (safe.Length > 40) safe = safe[..40].Trim('-');

        return string.IsNullOrEmpty(safe) ? "animstudio-bundle.zip" : $"{safe}-bundle.zip";
    }

    // --- media -------------------------------------------------------------------------

    /// <summary>
    /// Names each asset's file inside the bundle. Derived from the asset's name rather than
    /// the original upload filename, and made unique - two assets both called "arena" have
    /// to survive being written into one folder.
    /// </summary>
    private static Dictionary<string, string> MediaPaths(IReadOnlyList<Asset> assetList)
    {
        var paths = new Dictionary<string, string>(StringComparer.Ordinal);
        var used = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var asset in assetList)
        {
            var stem = Slug(asset.Name);
            var extension = Extension(asset);

            var candidate = stem + extension;
            var suffix = 2;

            while (!used.Add(candidate))
            {
                candidate = $"{stem}-{suffix}{extension}";
                suffix++;
            }

            paths[asset.Id] = BundlePaths.MediaFolder + candidate;
        }

        return paths;
    }

    private async Task AddMediaAsync(
        ZipArchive zip,
        IReadOnlyList<Asset> assetList,
        Dictionary<string, string> paths,
        CancellationToken ct)
    {
        long written = 0;

        foreach (var asset in assetList)
        {
            if (written + asset.FileSizeBytes > MaxMediaBytes)
            {
                logger.LogWarning(
                    "Bundle export for project {ProjectId} stopped adding media at {Bytes} bytes.",
                    asset.ProjectId, written);
                break;
            }

            Stream? content;

            try
            {
                content = await store.OpenAsync(asset.StorageKey, ct).ConfigureAwait(false);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                // One unreadable file must not cost the whole export. The row stays in the
                // Assets sheet, so what is missing is visible rather than silently absent.
                logger.LogWarning(ex,
                    "Bundle export could not read asset {AssetId}; its row is exported without the file.",
                    asset.Id);
                continue;
            }

            if (content is null) continue;

            await using (content)
            {
                var entry = zip.CreateEntry(paths[asset.Id], CompressionLevel.Optimal);
                await using var target = entry.Open();
                await content.CopyToAsync(target, ct).ConfigureAwait(false);
            }

            written += asset.FileSizeBytes;
        }
    }

    private static string Extension(Asset asset)
    {
        // From the recorded MIME type, which was decided by sniffing the bytes at upload -
        // not from the client's filename, which is a claim.
        var known = asset.MimeType.ToLowerInvariant() switch
        {
            "image/png" => ".png",
            "image/jpeg" => ".jpg",
            "image/webp" => ".webp",
            "image/gif" => ".gif",
            "audio/wav" or "audio/x-wav" => ".wav",
            "audio/mpeg" => ".mp3",
            "audio/ogg" => ".ogg",
            "audio/flac" or "audio/x-flac" => ".flac",
            "video/mp4" => ".mp4",
            _ => null
        };

        if (known is not null) return known;

        return asset.Kind switch
        {
            AssetKind.Image => ".png",
            AssetKind.Audio => ".wav",
            AssetKind.Video => ".mp4",
            _ => ".bin"
        };
    }

    private static string Slug(string name)
    {
        var slug = new string([.. name
            .Trim()
            .Select(c => char.IsLetterOrDigit(c) ? char.ToLowerInvariant(c) : '-')])
            .Trim('-');

        while (slug.Contains("--", StringComparison.Ordinal))
            slug = slug.Replace("--", "-", StringComparison.Ordinal);

        if (slug.Length > MaxMediaNameLength) slug = slug[..MaxMediaNameLength].Trim('-');

        return string.IsNullOrEmpty(slug) ? "file" : slug;
    }

    // --- rows --------------------------------------------------------------------------

    private static IReadOnlyList<string?> ProjectRow(Project project, Dictionary<string, string> paths) =>
    [
        project.Name,
        project.Description,
        project.Settings.Width.ToString(),
        project.Settings.Height.ToString(),
        Round(project.Settings.FrameRateNum / (double)Math.Max(1, project.Settings.FrameRateDen)),
        project.Settings.DistributionIntent.ToString(),
        Reference(project.Settings.BackgroundMusicAssetId, paths),
        Round(project.Settings.BackgroundMusicVolume)
    ];

    private static IReadOnlyList<string?> CharacterRow(
        Character character, Dictionary<string, string> paths) =>
    [
        character.Name,
        string.Join("; ", character.Aliases),
        character.Description,
        Flag(character.IsNarrator),
        character.Appearance.Age?.ToString(),
        character.Appearance.Gender,
        character.Appearance.Hair,
        character.Appearance.Clothes,
        character.Appearance.AdditionalDetails,
        Reference(character.Sprites.ClosedMouthAssetId, paths),
        Reference(character.Sprites.OpenMouthAssetId, paths),
        character.Staging.Anchor.ToString(),
        Round(character.Staging.HeightFraction),
        Round(character.Staging.OffsetXFraction),
        Flag(character.Staging.FlipHorizontal)
    ];

    private static IReadOnlyList<string?> SceneRow(
        Scene scene,
        IReadOnlyList<Character> cast,
        Dictionary<string, string> paths,
        FrameRate rate) =>
    [
        scene.SceneNumber.ToString(),
        scene.Title,
        scene.Description,
        Round(new FrameCount(scene.DurationFrames).ToSeconds(rate)),
        Reference(scene.BackgroundAssetId, paths),
        string.Join("; ", scene.Characters
            .Select(placement => cast.FirstOrDefault(c => c.Id == placement.CharacterId)?.Name)
            .Where(name => !string.IsNullOrEmpty(name))),
        scene.Animation.Background.ToString(),
        Round(scene.Animation.Intensity),
        scene.TransitionToNext.ToString(),
        Round(new FrameCount(scene.TransitionDurationFrames).ToSeconds(rate)),
        Reference(scene.Audio.AssetId, paths)
    ];

    private static IEnumerable<IReadOnlyList<string?>> DialogueRows(
        IReadOnlyList<Scene> sceneList, IReadOnlyList<Character> cast, FrameRate rate)
    {
        foreach (var scene in sceneList)
        {
            // Numbered from one within the scene, because that is what the sheet's Order
            // column means - the stored Index is a zero-based array position.
            var order = 1;

            foreach (var line in scene.Dialogue.OrderBy(d => d.Index))
            {
                yield return
                [
                    scene.SceneNumber.ToString(),
                    order.ToString(),
                    line.SpeakerCharacterId is null
                        ? line.SpeakerLabel
                        : cast.FirstOrDefault(c => c.Id == line.SpeakerCharacterId)?.Name,
                    line.Text,
                    Round(new FrameCount(line.RelativeStartFrame).ToSeconds(rate)),
                    Round(new FrameCount(line.RelativeEndFrame).ToSeconds(rate))
                ];

                order++;
            }
        }
    }

    private static IReadOnlyList<string?> AssetRow(Asset asset, Dictionary<string, string> paths) =>
    [
        asset.Name,
        paths.GetValueOrDefault(asset.Id),
        asset.Kind.ToString(),
        (asset.Provenance?.LicenseClass ?? LicenseClass.Unknown).ToString(),
        asset.Provenance?.AttributionText,
        asset.Provenance?.SourceUrl
    ];

    // --- writing -----------------------------------------------------------------------

    private static string Csv(WorkbookSheet sheet, IReadOnlyList<IReadOnlyList<string?>> rows) =>
        CsvGrid.Write([.. sheet.Columns.Select(c => c.Name)], rows.Select(row => row));

    private static string? Reference(string? assetId, Dictionary<string, string> paths) =>
        assetId is null ? null : paths.GetValueOrDefault(assetId);

    /// <summary>TRUE / FALSE, which is what a spreadsheet writes and the reader accepts.</summary>
    private static string Flag(bool value) => value ? "TRUE" : "FALSE";

    /// <summary>
    /// Invariant decimals, and never in exponent form. A German Excel writes 0,5 and this
    /// has to be readable everywhere, so the file is written one way and the reader accepts
    /// the local variations rather than the other way round.
    /// </summary>
    private static string Round(double value) =>
        Math.Round(value, 3).ToString("0.###", System.Globalization.CultureInfo.InvariantCulture);

    private static void AddText(ZipArchive zip, string path, string content)
    {
        var entry = zip.CreateEntry(path, CompressionLevel.Optimal);
        using var stream = entry.Open();

        // No byte-order mark: this application's own reader strips one, but plenty of
        // other tools do not, and a file it writes should not need that forgiveness.
        var bytes = new UTF8Encoding(encoderShouldEmitUTF8Identifier: false).GetBytes(content);
        stream.Write(bytes, 0, bytes.Length);
    }

    private static string ReadMe(Project project, bool includeMedia) =>
        $"""
         AnimStudio AI - project bundle
         ==============================

         Project: {project.Name}
         Exported: {DateTime.UtcNow:yyyy-MM-dd HH:mm} UTC
         Format version: {WorkbookSchema.Version}

         This is the whole project in one file. Edit the sheets in any spreadsheet program,
         then upload this zip again on the project's Bundle tab. Nothing here needs an AI
         provider, a key, or an internet connection.

         Sheets
         ------
         Project.csv     One row: canvas size, frame rate, background music.
         Characters.csv  One row per character. The Name column is the identity.
         Scenes.csv      One row per scene, keyed by SceneNumber.
         Dialogue.csv    One row per spoken line.
         Assets.csv      One row per file, with its licence.

         {(includeMedia
             ? "media/          The pictures and sounds the sheets refer to."
             : "Media was not included in this export, so the media/ references point at files\r\n"
               + "that are not in this zip. Re-export with media to get a bundle that stands alone.")}

         Editing safely
         --------------
         Identity is by key column, never by row position - sorting a sheet is harmless.
         Rename a character and you get a NEW character, so rename in every sheet at once.
         Leave a cell empty to keep whatever the project already has.

         Uploading is two steps: the preview shows exactly what would change before
         anything is written, and a scene you have edited by hand is kept unless you say
         otherwise.
         """;
}
