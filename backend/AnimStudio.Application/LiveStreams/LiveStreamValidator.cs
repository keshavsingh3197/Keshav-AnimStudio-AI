using System.Text.RegularExpressions;
using AnimStudio.Application.Media;

namespace AnimStudio.Application.LiveStreams;

/// <summary>
/// Checks what a caller sends before a stream is prepared or goes live, and keeps the
/// stream key out of anything the server writes down.
/// <para>
/// The key is appended to the ingest URL as its last path segment, so it is held to an
/// allowlist of the characters real keys use: a "/", "?" or "@" in it could otherwise
/// re-point the URL at a different application or host.
/// </para>
/// </summary>
public static partial class LiveStreamValidator
{
    public const int MaxLoops = 1000;
    public const int MaxLabelLength = 120;
    public const int MaxItems = 50;
    public const int MaxTitleLength = 200;

    /// <summary>What a key is replaced with wherever text containing it would be shown or logged.</summary>
    public const string KeyMask = "[stream-key]";

    [GeneratedRegex("^[A-Za-z0-9][A-Za-z0-9_-]{7,127}$", RegexOptions.CultureInvariant)]
    private static partial Regex StreamKeyShape();

    /// <summary>Render, asset, kit and channel ids: what this app generates, nothing that could be a path.</summary>
    [GeneratedRegex("^[A-Za-z0-9_-]{1,128}$", RegexOptions.CultureInvariant)]
    private static partial Regex IdShape();

    /// <summary>Multipart part names for item files: <c>file0</c> to <c>file99</c>, <c>cover0</c> to <c>cover99</c>.</summary>
    [GeneratedRegex("^(file|cover)[0-9]{1,2}$", RegexOptions.CultureInvariant)]
    private static partial Regex FieldShape();

    public static bool IsValidId(string? id) => id is not null && IdShape().IsMatch(id);

    public static bool IsValidField(string? field) => field is not null && FieldShape().IsMatch(field);

    public static string? ValidateStreamKey(string? streamKey)
    {
        if (string.IsNullOrWhiteSpace(streamKey))
            return "Paste the stream key from YouTube Studio.";
        if (!StreamKeyShape().IsMatch(streamKey.Trim()))
            return "That doesn't look like a stream key. Copy it again with the Copy button in YouTube Studio.";
        return null;
    }

    public static string? ValidateSettings(LiveStreamSettings settings, IReadOnlyCollection<string> destinations)
    {
        if (string.IsNullOrWhiteSpace(settings.Destination) || !destinations.Contains(settings.Destination))
            return "Choose where to stream to.";
        if (!Enum.IsDefined(settings.Orientation))
            return "Orientation must be landscape or portrait.";
        if (!Enum.IsDefined(settings.Quality))
            return "Quality must be 720p or 1080p.";
        if (settings.Loops is < 0 or > MaxLoops)
            return $"Loops must be between 0 (until stopped) and {MaxLoops}.";
        if (settings.Label is { Length: > MaxLabelLength })
            return $"The label can be at most {MaxLabelLength} characters.";
        if (settings.Label is not null && settings.Label.Any(char.IsControl))
            return "The label can't contain line breaks.";
        if (!settings.RightsConfirmed)
            return "Confirm you have the rights to broadcast everything in this stream.";
        return null;
    }

    /// <summary>
    /// Checks the playlist's shape: how many items, and that each names exactly what its
    /// source needs. Link items are validated and rebuilt here, so what reaches the
    /// downloader is the canonical URL and never the caller's text.
    /// </summary>
    public static PlaylistCheck ValidateItems(IReadOnlyList<LiveStreamItemRequest>? items)
    {
        if (items is null || items.Count == 0)
            return PlaylistCheck.Fail("Add at least one item to stream.", null);
        if (items.Count > MaxItems)
            return PlaylistCheck.Fail($"A stream can have at most {MaxItems} items.", null);

        var canonicalUrls = new string?[items.Count];
        var usedFields = new HashSet<string>(StringComparer.Ordinal);

        for (var i = 0; i < items.Count; i++)
        {
            var item = items[i];
            var label = $"Item {i + 1}";

            if (item is null)
                return PlaylistCheck.Fail($"{label} is empty.", i);
            if (!Enum.IsDefined(item.Source))
                return PlaylistCheck.Fail($"{label} has an unknown source.", i);
            if (item.Title is { Length: > MaxTitleLength } || (item.Title?.Any(char.IsControl) ?? false))
                return PlaylistCheck.Fail($"{label}'s title is too long or contains line breaks.", i);

            switch (item.Source)
            {
                case LiveStreamItemSource.Upload:
                    if (!IsValidField(item.FileField) || !item.FileField!.StartsWith("file", StringComparison.Ordinal))
                        return PlaylistCheck.Fail($"{label} has no file.", i);
                    if (item.CoverField is not null
                        && (!IsValidField(item.CoverField) || !item.CoverField.StartsWith("cover", StringComparison.Ordinal)))
                        return PlaylistCheck.Fail($"{label}'s cover is not a valid upload.", i);
                    if (!usedFields.Add(item.FileField) || (item.CoverField is not null && !usedFields.Add(item.CoverField)))
                        return PlaylistCheck.Fail($"{label} reuses another item's file.", i);
                    break;

                case LiveStreamItemSource.Render:
                    if (!IsValidId(item.RenderJobId))
                        return PlaylistCheck.Fail($"{label} doesn't name a render.", i);
                    break;

                case LiveStreamItemSource.Asset:
                    if (!IsValidId(item.AssetId))
                        return PlaylistCheck.Fail($"{label} doesn't name an asset.", i);
                    if (item.CoverAssetId is not null && !IsValidId(item.CoverAssetId))
                        return PlaylistCheck.Fail($"{label}'s cover is not a valid asset.", i);
                    break;

                case LiveStreamItemSource.Url:
                    var url = MediaSourceValidator.Validate(item.Url);
                    if (!url.IsValid)
                        return PlaylistCheck.Fail($"{label}: {url.ErrorMessage ?? "that link can't be used."}", i);
                    canonicalUrls[i] = url.CanonicalUrl;
                    break;

                case LiveStreamItemSource.ReleaseKit:
                    if (!IsValidId(item.ReleaseKitId))
                        return PlaylistCheck.Fail($"{label} doesn't name a release kit.", i);
                    break;
            }
        }

        return new PlaylistCheck(null, null, canonicalUrls);
    }

    public sealed record PlaylistCheck(string? Error, int? ItemIndex, IReadOnlyList<string?> CanonicalUrls)
    {
        public bool IsValid => Error is null;

        public static PlaylistCheck Fail(string error, int? index) => new(error, index, []);
    }

    /// <summary>
    /// Replaces every occurrence of the key. ffmpeg names its output URL - key included - in
    /// its banner and in connection errors, so its stderr is never safe to keep unredacted.
    /// </summary>
    public static string Redact(string? text, string streamKey)
    {
        if (string.IsNullOrEmpty(text)) return string.Empty;
        return string.IsNullOrEmpty(streamKey)
            ? text
            : text.Replace(streamKey, KeyMask, StringComparison.Ordinal);
    }
}
