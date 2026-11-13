using AnimStudio.Application.Publishing;
using AnimStudio.Domain.LiveStreams;

namespace AnimStudio.Application.LiveStreams;

/// <summary>What the page sends to save a preset. The owner, id and times are the server's.</summary>
public sealed record LiveStreamPresetRequest
{
    public string? Name { get; init; }
    public LiveStreamPresetSettings? Settings { get; init; }
    public List<LiveStreamPresetItem>? Items { get; init; }
    public string? KeyMode { get; init; }
    public string? ChannelId { get; init; }
    public LiveStreamPresetYouTube? YouTube { get; init; }
}

/// <summary>A preset as the page sees it.</summary>
public sealed record LiveStreamPresetView(
    string Id,
    string Name,
    LiveStreamPresetSettings Settings,
    IReadOnlyList<LiveStreamPresetItem> Items,
    string KeyMode,
    string? ChannelId,
    LiveStreamPresetYouTube? YouTube,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    DateTime? LastUsedAt,
    int Uses)
{
    public static LiveStreamPresetView From(LiveStreamPreset p) => new(
        p.Id, p.Name, p.Settings, p.Items, p.KeyMode, p.ChannelId, p.YouTube, p.CreatedAtUtc, p.UpdatedAtUtc, p.LastUsedAtUtc, p.Uses);
}

/// <summary>
/// Checks a preset before it is saved. The playlist and settings go through the same checks a
/// stream does, so a preset that saves is one that can be played; ownership of renders and
/// assets is checked again when it is played, since it can change in between.
/// </summary>
public static class LiveStreamPresetValidator
{
    public const int MaxPresetsPerUser = 50;
    public const int MaxNameLength = 80;
    public const int MaxShortText = 200;
    public const int MaxTopicLength = 300;
    public const int MaxBriefLength = 1000;
    public const int MaxThumbnailUrlLength = 2048;

    public static readonly IReadOnlyList<string> KeyModes = ["channel", "paste", "youtube"];

    /// <summary>Null when the preset can be saved; otherwise what is wrong, for the person.</summary>
    public static string? Validate(LiveStreamPresetRequest? request, IReadOnlyCollection<string> destinations)
    {
        if (request is null) return "The preset could not be read.";

        var name = request.Name?.Trim();
        if (string.IsNullOrEmpty(name)) return "Give the preset a name.";
        if (name.Length > MaxNameLength || name.Any(char.IsControl))
            return $"The name can be at most {MaxNameLength} characters, on one line.";

        if (request.Settings is not { } s) return "The stream settings are missing.";
        if (!TryParseName(s.Quality, out LiveStreamQuality quality))
            return "Quality must be 720p or 1080p.";
        if (!TryParseName(s.Orientation, out LiveStreamOrientation orientation))
            return "Orientation must be landscape, portrait or both.";
        var settingsError = LiveStreamValidator.ValidateSettings(new LiveStreamSettings
        {
            Destination = s.Destination,
            Quality = quality,
            Orientation = orientation,
            Loops = s.Loops,
            Shuffle = s.Shuffle,
            AutoReconnect = s.AutoReconnect,
            Label = s.Label,
            // Confirmed again each time the preset is played.
            RightsConfirmed = true
        }, destinations);
        if (settingsError is not null) return settingsError;

        if (ValidateItems(request.Items) is { } itemsError) return itemsError;

        var keyMode = request.KeyMode;
        if (keyMode is null || !KeyModes.Contains(keyMode)) return "Choose where the stream key comes from.";
        if (keyMode == "channel" && !LiveStreamValidator.IsValidId(request.ChannelId))
            return "Choose the channel whose saved key is used.";
        if (keyMode == "youtube")
        {
            if (request.YouTube is null) return "Add the YouTube broadcast's title and details.";
            if (ValidateYouTube(request.YouTube) is { } youTubeError) return youTubeError;
        }

        return null;
    }

    private static string? ValidateItems(List<LiveStreamPresetItem>? items)
    {
        if (items is null || items.Count == 0) return "Add at least one item to the playlist.";

        var requests = new List<LiveStreamItemRequest>(items.Count);
        for (var i = 0; i < items.Count; i++)
        {
            var item = items[i];
            var label = $"Item {i + 1}";
            if (item is null) return $"{label} is empty.";
            if (!TryParseName(item.Source, out LiveStreamItemSource source))
                return $"{label} has an unknown source.";
            if (source == LiveStreamItemSource.Upload)
                return $"{label} is a file from this computer, which a preset can't keep. Add it to a project's media first.";
            if (!IsShortText(item.TypeLabel) || !IsShortText(item.Detail))
                return $"{label}'s description is too long.";
            if (item.DurationSeconds is < 0 or > 7 * 24 * 3600 || item.Width is < 0 or > 16384 || item.Height is < 0 or > 16384)
                return $"{label}'s length or size is out of range.";
            if (item.ThumbnailUrl is not null && !IsHttpsUrl(item.ThumbnailUrl))
                return $"{label}'s thumbnail must be an https link.";

            requests.Add(new LiveStreamItemRequest
            {
                Source = source,
                Title = item.Title,
                RenderJobId = item.RenderJobId,
                AssetId = item.AssetId,
                CoverAssetId = item.CoverAssetId,
                Url = item.Url,
                AudioOnly = item.AudioOnly,
                ReleaseKitId = item.ReleaseKitId,
                UseVisualizer = item.UseVisualizer
            });
        }

        var check = LiveStreamValidator.ValidateItems(requests);
        return check.IsValid ? null : check.Error;
    }

    private static string? ValidateYouTube(LiveStreamPresetYouTube y)
    {
        if (!YouTubePublishValidator.IsYouTubeChannelId(y.ChannelId)) return "Choose the YouTube channel to create the broadcast on.";
        if (string.IsNullOrWhiteSpace(y.Title)) return "Add a title for the YouTube broadcast.";
        if (y.Title.Length > YouTubePublishValidator.MaxTitleLength)
            return $"YouTube titles can be at most {YouTubePublishValidator.MaxTitleLength} characters.";
        if (System.Text.Encoding.UTF8.GetByteCount(y.Description ?? string.Empty) > YouTubePublishValidator.MaxDescriptionBytes)
            return $"YouTube descriptions can be at most {YouTubePublishValidator.MaxDescriptionBytes} bytes.";
        if (y.Title.Contains('<') || y.Title.Contains('>') || (y.Description?.Contains('<') ?? false) || (y.Description?.Contains('>') ?? false))
            return "Remove < and > from the title and description (YouTube doesn't allow them).";
        if (y.Tags is null || y.Tags.Any(t => t is null || t.Any(char.IsControl))
            || YouTubePublishValidator.TagsLength(y.Tags) > YouTubePublishValidator.MaxTagsLength)
            return $"Tags can be at most {YouTubePublishValidator.MaxTagsLength} characters in all.";
        if (!YouTubePublishValidator.Privacies.Contains(y.Privacy)) return "Visibility must be public, unlisted or private.";
        if (!YouTubePublishValidator.Categories.ContainsKey(y.CategoryId ?? string.Empty)) return "Choose a YouTube category.";
        if (y.Topic is { Length: > MaxTopicLength } || y.Brief is { Length: > MaxBriefLength }
            || !IsShortText(y.Tone) || !IsShortText(y.Language))
            return "The AI notes are too long.";
        return null;
    }

    /// <summary>Only an enum's own names - not numbers - so what is stored is what the page reads back.</summary>
    private static bool TryParseName<T>(string? value, out T result) where T : struct, Enum
    {
        result = default;
        return value is not null && Enum.GetNames<T>().Contains(value) && Enum.TryParse(value, out result);
    }

    private static bool IsShortText(string? value) => value is null || (value.Length <= MaxShortText && !value.Any(char.IsControl));

    private static bool IsHttpsUrl(string value) =>
        value.Length <= MaxThumbnailUrlLength
        && Uri.TryCreate(value, UriKind.Absolute, out var uri)
        && uri.Scheme == Uri.UriSchemeHttps;
}
