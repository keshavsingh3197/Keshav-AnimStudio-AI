using System.IO.Compression;
using System.Text;
using AnimStudio.Application.Ai;
using AnimStudio.Domain.Assets;

namespace AnimStudio.Application.Workbooks;

/// <summary>
/// Reads a project bundle: a <c>.zip</c> holding the sheets, the media and optionally a
/// transcript.
/// </summary>
/// <remarks>
/// <para>
/// Uses <c>System.IO.Compression</c> and nothing else, deliberately. This is the path that
/// has to keep working with no AI configured and no spreadsheet package installed, so it
/// must not be the thing that drags either in.
/// </para>
/// <para>
/// An uploaded archive is hostile input, and archives have two classic attacks that need
/// separate answers:
/// </para>
/// <para>
/// <b>Zip slip.</b> An entry named <c>../../etc/cron.d/x</c> escapes wherever it is written.
/// Nothing here is written to disk - entries are read into memory - but the entry name still
/// becomes a lookup key and an asset's display name, and a later change that does extract to
/// disk must not have to rediscover this rule. Such an entry is <b>refused, not sanitized</b>:
/// stripping the <c>..</c> and carrying on means importing a file the user did not describe.
/// </para>
/// <para>
/// <b>Zip bombs.</b> A few hundred kilobytes can expand to gigabytes. Every limit below is
/// enforced <b>while decompressing</b>, against bytes actually read - the length declared in
/// the archive's own directory is written by whoever built the archive and is not evidence.
/// </para>
/// </remarks>
public static class BundleReader
{
    /// <summary>A production is dozens of files, not thousands.</summary>
    public const int MaxEntries = 500;

    /// <summary>One picture or one audio track.</summary>
    public const int MaxEntryBytes = 64 * 1024 * 1024;

    /// <summary>Everything, expanded. The ceiling that actually stops a bomb.</summary>
    public const long MaxTotalBytes = 512L * 1024 * 1024;

    /// <summary>
    /// Beyond this, an entry is compressed far better than real media can be. Media is
    /// already compressed and barely shrinks; text does not reach this either.
    /// </summary>
    public const int MaxCompressionRatio = 500;

    private const string TranscriptStem = "transcript";

    public static ProjectBundle Read(Stream archive)
    {
        ArgumentNullException.ThrowIfNull(archive);

        using var zip = OpenArchive(archive);

        var workbook = new WorkbookDocument();
        var media = new Dictionary<string, BundleMedia>(StringComparer.Ordinal);
        var warnings = new List<string>();

        string? transcript = null;
        var total = 0L;
        var count = 0;

        foreach (var entry in zip.Entries)
        {
            // A directory entry, which carries no content and needs no checking.
            if (entry.FullName.EndsWith('/') || entry.FullName.EndsWith('\\')) continue;

            if (++count > MaxEntries)
            {
                throw new WorkbookFormatException("too-many-files",
                    $"A bundle may contain at most {MaxEntries} files.");
            }

            var path = SafePath(entry.FullName);
            var content = ReadEntry(entry, ref total);

            // The normalised path is the lookup key; the name the user actually typed is
            // what any message has to quote back, or they go looking for a file that is not
            // spelled the way the warning spells it.
            var display = entry.FullName;

            if (path.StartsWith(BundlePaths.MediaFolder, StringComparison.Ordinal))
            {
                AddMedia(media, warnings, path, display, content);
                continue;
            }

            var stem = Path.GetFileNameWithoutExtension(path);
            var extension = Path.GetExtension(path);

            if (extension is ".csv")
            {
                AddSheet(workbook, warnings, stem, Path.GetFileNameWithoutExtension(display), content);
                continue;
            }

            if (string.Equals(stem, TranscriptStem, StringComparison.Ordinal) &&
                extension is ".srt" or ".vtt" or ".txt")
            {
                transcript = Decode(content);
                continue;
            }

            // Named so the user can see why the file they added did nothing, rather than
            // wondering whether it was read.
            warnings.Add($"Ignored '{display}': a bundle reads .csv sheets, files under media/, "
                       + "and an optional transcript.srt.");
        }

        return new ProjectBundle
        {
            Workbook = workbook,
            Media = media,
            TranscriptText = transcript,
            Warnings = warnings
        };
    }

    private static ZipArchive OpenArchive(Stream archive)
    {
        try
        {
            return new ZipArchive(archive, ZipArchiveMode.Read, leaveOpen: true);
        }
        catch (InvalidDataException ex)
        {
            throw new WorkbookFormatException("not-a-zip",
                "That file could not be read as a .zip bundle.", ex);
        }
    }

    /// <summary>
    /// Decompresses one entry, refusing it the moment it goes past a limit rather than
    /// after.
    /// </summary>
    private static byte[] ReadEntry(ZipArchiveEntry entry, ref long total)
    {
        using var stream = entry.Open();
        using var buffer = new MemoryStream();

        var chunk = new byte[81_920];
        var written = 0L;

        while (true)
        {
            var read = stream.Read(chunk, 0, chunk.Length);
            if (read <= 0) break;

            written += read;

            if (written > MaxEntryBytes)
            {
                throw new WorkbookFormatException("file-too-large",
                    $"'{entry.Name}' is larger than the {MaxEntryBytes / (1024 * 1024)}MB "
                    + "allowed for one file.");
            }

            if (total + written > MaxTotalBytes)
            {
                throw new WorkbookFormatException("bundle-too-large",
                    "That bundle expands to more than this importer will accept.");
            }

            buffer.Write(chunk, 0, read);
        }

        // Checked after the fact because it needs the final size, but it cannot run away
        // first: the two limits above already bounded what was read.
        if (entry.CompressedLength > 0 && written / entry.CompressedLength > MaxCompressionRatio)
        {
            throw new WorkbookFormatException("suspicious-compression",
                $"'{entry.Name}' is compressed far beyond what real media compresses to.");
        }

        total += written;
        return buffer.ToArray();
    }

    /// <summary>
    /// The entry's path, or a refusal. Refusal rather than repair: an entry that tried to
    /// escape is not a file this bundle honestly described.
    /// </summary>
    private static string SafePath(string entryName)
    {
        var normalised = BundlePaths.Normalise(entryName);

        if (normalised.Length == 0)
            throw new WorkbookFormatException("unsafe-path", "The bundle contains an unnamed file.");

        var unsafeSegment =
            normalised.Split('/').Any(segment => segment is "." or "..") ||
            normalised.Contains(':', StringComparison.Ordinal) ||
            entryName.StartsWith('/') ||
            entryName.StartsWith('\\') ||
            Path.IsPathRooted(entryName) ||
            normalised.Any(char.IsControl);

        if (unsafeSegment)
        {
            throw new WorkbookFormatException("unsafe-path",
                "The bundle contains a file whose name tries to write outside it.");
        }

        return normalised;
    }

    private static void AddSheet(
        WorkbookDocument workbook, List<string> warnings, string stem, string display,
        byte[] content)
    {
        var sheet = WorkbookSchema.Find(stem);

        if (sheet is null)
        {
            warnings.Add($"Ignored the sheet '{display}': it is not part of the workbook format.");
            return;
        }

        workbook.Add(CsvGrid.Read(sheet.Name, Decode(content)));
    }

    private static void AddMedia(
        Dictionary<string, BundleMedia> media, List<string> warnings, string path,
        string display, byte[] content)
    {
        if (content.Length == 0)
        {
            warnings.Add($"Ignored '{display}': the file is empty.");
            return;
        }

        // Sniffed, never trusted from the extension - the same rule the AI providers follow
        // for anything they are handed, and for the same reason: the extension is a claim
        // and the bytes are the fact.
        var image = AiImageValidator.Sniff(content);
        var audio = image is null ? AiAudioValidator.Sniff(content) : null;

        if (image is null && audio is null)
        {
            warnings.Add($"Ignored '{display}': it is not an image or an audio file this "
                       + "application can read.");
            return;
        }

        media[path] = new BundleMedia(
            path,
            Path.GetFileName(display),
            content,
            image ?? audio!,
            image is null ? AssetKind.Audio : AssetKind.Image);
    }

    /// <summary>
    /// UTF-8, with the byte order mark a spreadsheet leaves behind handled by the parsers
    /// downstream rather than here.
    /// </summary>
    private static string Decode(byte[] content) =>
        new UTF8Encoding(encoderShouldEmitUTF8Identifier: false).GetString(content);
}
