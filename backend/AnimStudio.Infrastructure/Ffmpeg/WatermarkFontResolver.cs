using AnimStudio.Application.Rendering.Models;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AnimStudio.Infrastructure.Ffmpeg;

/// <summary>
/// Finds the font FILE a text watermark is drawn with.
/// <para>
/// A file, never a family name, and that is the whole point of this class. drawtext's
/// <c>font=</c> option resolves through fontconfig, and on a machine where fontconfig is
/// compiled in but has no <c>fonts.conf</c> - which is every stock Windows ffmpeg build -
/// the lookup returns nothing and drawtext dereferences it. The process does not report a
/// missing font, it takes an access violation: exit <c>0xC0000005</c> after
/// <c>Fontconfig error: Cannot load default config file</c>, which surfaces as a render
/// that failed for no visible reason. <c>fontfile=</c> hands freetype the bytes directly
/// and never touches fontconfig.
/// </para>
/// <para>
/// Resolved once and cached: the answer depends on the machine, not on the job, and a
/// per-clip directory scan would be repeated work with a fixed result.
/// </para>
/// </summary>
public sealed class WatermarkFontResolver
{
    /// <summary>
    /// Bold before regular, because a watermark sits over arbitrary footage and the weight
    /// is what keeps it legible. Ordered by platform; every entry is checked, so a list
    /// naming Windows paths costs nothing on Linux.
    /// </summary>
    private static readonly string[] KnownFonts =
    [
        // Windows.
        @"C:\Windows\Fonts\segoeuib.ttf",
        @"C:\Windows\Fonts\arialbd.ttf",
        @"C:\Windows\Fonts\seguisb.ttf",
        @"C:\Windows\Fonts\verdanab.ttf",
        @"C:\Windows\Fonts\tahomabd.ttf",
        @"C:\Windows\Fonts\calibrib.ttf",
        @"C:\Windows\Fonts\segoeui.ttf",
        @"C:\Windows\Fonts\arial.ttf",

        // Debian/Ubuntu - the layout the container images use.
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
        "/usr/share/fonts/truetype/noto/NotoSans-Bold.ttf",

        // Fedora/RHEL/Alpine.
        "/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/dejavu-sans-fonts/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/liberation-sans/LiberationSans-Bold.ttf",
        "/usr/share/fonts/TTF/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/noto/NotoSans-Bold.ttf",

        // macOS.
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/Library/Fonts/Arial.ttf"
    ];

    /// <summary>
    /// Searched only when nothing above matched, for a host that keeps fonts somewhere
    /// unexpected - a slim image with one font dropped in, most often.
    /// </summary>
    private static readonly string[] FontDirectories =
    [
        @"C:\Windows\Fonts",
        "/usr/share/fonts",
        "/usr/local/share/fonts",
        "/System/Library/Fonts",
        "/Library/Fonts"
    ];

    private readonly Lazy<string?> _resolved;

    public WatermarkFontResolver(
        IOptions<RenderOptions> options, ILogger<WatermarkFontResolver> logger)
    {
        ArgumentNullException.ThrowIfNull(options);
        ArgumentNullException.ThrowIfNull(logger);

        var configured = options.Value.WatermarkFontFile;

        _resolved = new Lazy<string?>(() =>
        {
            if (!string.IsNullOrWhiteSpace(configured))
            {
                // Made absolute deliberately: ffmpeg runs with the render workspace as its
                // working directory, so a relative path in configuration would be looked
                // up somewhere the operator never meant.
                var full = Path.GetFullPath(configured.Trim());

                if (File.Exists(full))
                {
                    logger.LogInformation("Watermark font: {FontFile} (configured).", full);
                    return full;
                }

                logger.LogWarning(
                    "Render:WatermarkFontFile points at {FontFile}, which does not exist; "
                    + "looking for a system font instead.", full);
            }

            var found = FindSystemFont();

            if (found is not null)
                logger.LogInformation("Watermark font: {FontFile} (auto-detected).", found);
            else
                logger.LogWarning(
                    "No usable font file was found, so text watermarks will be skipped. "
                    + "Set Render:WatermarkFontFile to an absolute path to a .ttf or .otf.");

            return found;
        }, LazyThreadSafetyMode.ExecutionAndPublication);
    }

    /// <summary>
    /// An absolute path to a font file, or null when the host has none - in which case a
    /// text watermark is skipped with a warning rather than drawn with <c>font=</c>.
    /// </summary>
    public string? FontFilePath => _resolved.Value;

    private readonly System.Collections.Concurrent.ConcurrentDictionary<string, string?> _byScript = new();

    /// <summary>
    /// A font that can actually draw <paramref name="text"/>. Latin-only text gets
    /// <see cref="FontFilePath"/>; text with Hindi (or another script that face lacks) gets
    /// a face that has those glyphs - Nirmala UI on Windows, Noto on Linux - which also
    /// carries Latin, so a mixed line like "QR कोड स्कैन करें" draws whole.
    /// <para>
    /// Null when the host has no face for that script. Callers leave the line off rather
    /// than draw it in the Latin face, which renders every letter as an empty box.
    /// </para>
    /// </summary>
    public string? FontFor(string text)
    {
        var script = ScriptFonts.Detect(text);
        return script is null
            ? FontFilePath
            : _byScript.GetOrAdd(script, s => ScriptFonts.Find(s));
    }

    /// <summary>
    /// <paramref name="line"/> cut into runs per face, so emoji and symbols that
    /// <paramref name="primaryFont"/> lacks draw from a face that has them. Null when the
    /// whole line draws in <paramref name="primaryFont"/>. See <see cref="FontRunSplitter"/>.
    /// </summary>
    public FontRunLine? RunsFor(string line, string primaryFont) => FontRunSplitter.Split(line, primaryFont);

    /// <summary>
    /// The first font file this machine actually has. Public and static so the render
    /// tests find their font the same way the server does, rather than keeping a second
    /// list that drifts.
    /// </summary>
    public static string? FindSystemFont()
    {
        var named = Array.Find(KnownFonts, Exists);
        if (named is not null) return named;

        foreach (var directory in FontDirectories)
        {
            var scanned = FirstFontIn(directory);
            if (scanned is not null) return scanned;
        }

        return null;
    }

    /// <summary>
    /// Alphabetically first .ttf/.otf under a directory, so the choice is stable across
    /// runs on the same host instead of depending on directory-enumeration order.
    /// </summary>
    private static string? FirstFontIn(string directory)
    {
        try
        {
            if (!Directory.Exists(directory)) return null;

            return Directory
                .EnumerateFiles(directory, "*.*", SearchOption.AllDirectories)
                .Where(path => path.EndsWith(".ttf", StringComparison.OrdinalIgnoreCase)
                               || path.EndsWith(".otf", StringComparison.OrdinalIgnoreCase))
                .OrderBy(path => path, StringComparer.OrdinalIgnoreCase)
                .FirstOrDefault();
        }
        catch (Exception ex) when (ex is IOException or UnauthorizedAccessException)
        {
            // An unreadable font directory is not a render failure: it just means this
            // candidate contributes nothing.
            return null;
        }
    }

    private static bool Exists(string path)
    {
        try
        {
            return File.Exists(path);
        }
        catch (Exception ex) when (ex is IOException or UnauthorizedAccessException)
        {
            return false;
        }
    }
}
