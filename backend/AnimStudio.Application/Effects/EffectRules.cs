using System.Text;
using System.Text.RegularExpressions;
using AnimStudio.Application.Common;
using AnimStudio.Application.Uploads;
using AnimStudio.Domain.Assets;
using AnimStudio.Domain.Effects;

namespace AnimStudio.Application.Effects;

/// <summary>Filters for listing the library. Null means "any".</summary>
public sealed record EffectQuery(EffectCategory? Category = null, AssetKind? Kind = null, string? Search = null, bool FavoritesOnly = false);

/// <summary>
/// The effects library's pure rules: what may be uploaded, how names and tags are cleaned,
/// where the bytes are stored and how the list is filtered and ordered. Kept free of I/O so
/// every rule is unit-tested on its own.
/// </summary>
public static partial class EffectRules
{
    public const int MaxNameLength = 80;
    public const int MaxTags = 12;
    public const int MaxTagLength = 32;
    public const int MaxSearchLength = 100;
    public const int MaxEffectsPerUser = 500;

    /// <summary>Stingers, end screens and green-screen clips are short; 200MB is minutes of 1080p.</summary>
    public const long MaxVideoBytes = 200L * 1024 * 1024;

    /// <summary>Stills and sounds, the same ceiling as a project upload.</summary>
    public const long MaxOtherBytes = 25L * 1024 * 1024;

    /// <summary>An effect is something laid over a video, not the video: ten minutes is generous.</summary>
    public const double MaxDurationSeconds = 10 * 60;

    /// <summary>Marks a project asset that was copied in from the effects library.</summary>
    public const string ProvenanceProvider = "effects-library";

    /// <summary>The extensions the library takes, before the bytes are checked.</summary>
    public static readonly IReadOnlyList<string> AllowedExtensions =
        [".mp4", ".webm", ".mov", ".png", ".jpg", ".jpeg", ".webp", ".mp3", ".wav", ".m4a"];

    private const int SniffBytes = 4096;

    [GeneratedRegex(@"^[0-9a-f]{32}$", RegexOptions.CultureInvariant)]
    private static partial Regex IdPattern();

    [GeneratedRegex(@"^[\p{L}\p{N}][\p{L}\p{N} _\-]*$", RegexOptions.CultureInvariant)]
    private static partial Regex TagPattern();

    [GeneratedRegex(@"\s+", RegexOptions.CultureInvariant)]
    private static partial Regex Whitespace();

    public static bool IsEffectId(string? id) => id is not null && IdPattern().IsMatch(id);

    /// <summary>Server-composed: the effect's own id and the sniffed extension, nothing from the client.</summary>
    public static string StorageKey(string effectId, string extension) => $"effects/{effectId}/clip{extension}";

    public static string ThumbnailKey(string effectId) => $"effects/{effectId}/thumb.jpg";

    /// <summary>A trimmed, single-spaced name of 1-<see cref="MaxNameLength"/> characters, or an error.</summary>
    public static string NormalizeName(string? name)
    {
        var clean = Whitespace().Replace(name ?? string.Empty, " ").Trim();
        if (clean.Length == 0 || clean.Length > MaxNameLength || clean.Any(char.IsControl))
            throw EditingException.Invalid("name-invalid", $"Give the effect a name of up to {MaxNameLength} characters.");
        return clean;
    }

    /// <summary>The upload's file name as a starting name: no path, no extension, cut to length.</summary>
    public static string NameFromFile(string? fileName)
    {
        var display = UploadValidator.SanitizeDisplayName(fileName ?? string.Empty);
        var stem = Path.GetFileNameWithoutExtension(display);
        stem = Whitespace().Replace(new string([.. stem.Where(c => !char.IsControl(c))]).Replace('_', ' '), " ").Trim();
        if (stem.Length == 0) stem = "Effect";
        return stem.Length > MaxNameLength ? stem[..MaxNameLength].TrimEnd() : stem;
    }

    /// <summary>
    /// Lower-case, de-duplicated tags. A leading '#' is dropped; anything else outside letters,
    /// digits, spaces, '-' and '_' is refused rather than silently stripped.
    /// </summary>
    public static List<string> NormalizeTags(IEnumerable<string>? tags)
    {
        var result = new List<string>();
        foreach (var raw in tags ?? [])
        {
            var tag = Whitespace().Replace((raw ?? string.Empty).Trim().TrimStart('#'), " ").Trim().ToLowerInvariant();
            if (tag.Length == 0) continue;
            if (tag.Length > MaxTagLength || !TagPattern().IsMatch(tag))
                throw EditingException.Invalid("tag-invalid", $"Tags are letters, numbers, spaces, - and _, up to {MaxTagLength} characters.");
            if (!result.Contains(tag, StringComparer.Ordinal)) result.Add(tag);
        }

        if (result.Count > MaxTags)
            throw EditingException.Invalid("too-many-tags", $"Use at most {MaxTags} tags.");
        return result;
    }

    /// <summary>A category by name, from the allowlist only. Null or empty means none was given.</summary>
    public static EffectCategory? ParseCategory(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        foreach (var category in Enum.GetValues<EffectCategory>())
        {
            if (string.Equals(category.ToString(), value.Trim(), StringComparison.OrdinalIgnoreCase)) return category;
        }
        throw EditingException.Invalid("category-invalid", "That is not an effect category.");
    }

    /// <summary>Image, Video or Audio by name; null or "any" for no filter.</summary>
    public static AssetKind? ParseKind(string? value) => value?.Trim().ToLowerInvariant() switch
    {
        null or "" or "any" => null,
        "image" => AssetKind.Image,
        "video" => AssetKind.Video,
        "audio" => AssetKind.Audio,
        _ => throw EditingException.Invalid("kind-invalid", "Filter by image, video or audio.")
    };

    /// <summary>What an effect is filed under when the uploader didn't say.</summary>
    public static EffectCategory DefaultCategory(AssetKind kind) =>
        kind == AssetKind.Audio ? EffectCategory.SoundEffect : EffectCategory.Overlay;

    /// <summary>Sounds are sound effects (or anything but picture-only categories); nothing silent is a sound effect.</summary>
    public static void EnsureCategoryFits(EffectCategory category, AssetKind kind)
    {
        if (category == EffectCategory.SoundEffect && kind != AssetKind.Audio)
            throw EditingException.Invalid("category-mismatch", "Only audio files can be sound effects.");

        if (kind == AssetKind.Audio && category is EffectCategory.GreenScreen or EffectCategory.LowerThird or EffectCategory.Overlay)
            throw EditingException.Invalid("category-mismatch", "A sound can't be a picture effect. File it as a sound effect.");
    }

    /// <summary>The per-kind size ceiling.</summary>
    public static long MaxBytesFor(AssetKind kind) => kind == AssetKind.Video ? MaxVideoBytes : MaxOtherBytes;

    /// <summary>
    /// The project asset's name for a copy of this effect: the effect's name with the file's
    /// extension, because the studio tells video, stills and sound apart by it.
    /// </summary>
    public static string AssetNameFor(EffectClip effect)
    {
        var extension = Path.GetExtension(effect.StorageKey);
        return effect.Name.EndsWith(extension, StringComparison.OrdinalIgnoreCase) ? effect.Name : effect.Name + extension;
    }

    /// <summary>The owner's list filtered, favourites first, then most used, then newest.</summary>
    public static IReadOnlyList<EffectClip> Filter(IEnumerable<EffectClip> effects, EffectQuery query)
    {
        var search = query.Search?.Trim();
        if (search?.Length > MaxSearchLength)
            throw EditingException.Invalid("search-invalid", $"Search for at most {MaxSearchLength} characters.");

        var words = string.IsNullOrEmpty(search)
            ? []
            : search.ToLowerInvariant().Split(' ', StringSplitOptions.RemoveEmptyEntries);

        return
        [
            .. effects
                .Where(e => query.Category is null || e.Category == query.Category)
                .Where(e => query.Kind is null || e.Kind == query.Kind)
                .Where(e => !query.FavoritesOnly || e.Favorite)
                .Where(e => words.Length == 0 || words.All(w =>
                    e.Name.Contains(w, StringComparison.OrdinalIgnoreCase)
                    || e.Category.ToString().Contains(w, StringComparison.OrdinalIgnoreCase)
                    || e.Tags.Any(t => t.Contains(w, StringComparison.Ordinal))))
                .OrderByDescending(e => e.Favorite)
                .ThenByDescending(e => e.UseCount)
                .ThenByDescending(e => e.CreatedAt)
        ];
    }

    /// <summary>
    /// Confirms an upload is one of the library's types from its own bytes. MP4, stills, MP3,
    /// WAV and M4A go through the project upload's three-signal check; WebM and MOV, which
    /// projects don't take directly, are matched on their container signature here. GIF is
    /// refused with a pointer to WebM, because the render reads a still with ffmpeg's image
    /// loop, which an animated GIF can't take.
    /// </summary>
    public static async Task<UploadValidationResult> SniffAsync(string? fileName, string? declaredContentType, Stream content, CancellationToken ct)
    {
        var extension = Path.GetExtension(fileName ?? string.Empty).ToLowerInvariant();
        if (extension == ".gif")
            return UploadValidationResult.Invalid("gif-not-supported", "GIFs can't be used yet. Convert it to WebM or MP4 (or PNG for a still).");

        if (!AllowedExtensions.Contains(extension, StringComparer.Ordinal))
            return UploadValidationResult.Invalid("file-type-not-allowed", "Effects can be MP4, WebM, MOV, PNG, JPG, WEBP, MP3, WAV or M4A.");

        var buffer = new byte[SniffBytes];
        var read = await content.ReadAtLeastAsync(buffer, buffer.Length, throwOnEndOfStream: false, ct).ConfigureAwait(false);
        var header = buffer[..read];

        if (extension is not ".webm" and not ".mov")
            return await UploadValidator.ValidateAsync(fileName, declaredContentType, new MemoryStream(header, writable: false), ct).ConfigureAwait(false);

        if (read < 12)
            return UploadValidationResult.Invalid("file-unreadable", "That file could not be read.");

        // A declared type that contradicts the bytes is a reason to refuse, not to guess.
        if (!string.IsNullOrWhiteSpace(declaredContentType)
            && !declaredContentType.StartsWith("video/", StringComparison.OrdinalIgnoreCase))
            return UploadValidationResult.Invalid("file-type-mismatch", "That file's contents do not match its type.");

        if (extension == ".webm")
        {
            // EBML magic, and the "webm" doc type - plain Matroska (.mkv) is not taken.
            var isEbml = header[0] == 0x1A && header[1] == 0x45 && header[2] == 0xDF && header[3] == 0xA3;
            return isEbml && IndexOf(header, "webm"u8) >= 0
                ? UploadValidationResult.Valid(AssetKind.Video, "video/webm", ".webm")
                : UploadValidationResult.Invalid("file-content-mismatch", "That file's contents do not match its extension.");
        }

        // QuickTime: an ISO-BMFF "ftyp" box, or one of the classic top-level atoms, at offset 4.
        var atom = Encoding.ASCII.GetString(header, 4, 4);
        return atom is "ftyp" or "moov" or "mdat" or "wide" or "free" or "skip" or "pnot"
            ? UploadValidationResult.Valid(AssetKind.Video, "video/quicktime", ".mov")
            : UploadValidationResult.Invalid("file-content-mismatch", "That file's contents do not match its extension.");
    }

    /// <summary>The library's type for a project asset being saved into it, by its stored extension.</summary>
    public static bool IsLibraryType(Asset asset) =>
        asset.Kind is AssetKind.Image or AssetKind.Video or AssetKind.Audio
        && AllowedExtensions.Contains(Path.GetExtension(asset.StorageKey).ToLowerInvariant(), StringComparer.Ordinal);

    private static int IndexOf(byte[] haystack, ReadOnlySpan<byte> needle) => haystack.AsSpan().IndexOf(needle);
}
