using System.Text;
using AnimStudio.Domain.Ai;
using AnimStudio.Domain.Publishing;
using AnimStudio.Domain.Rendering;

namespace AnimStudio.Application.Publishing;

/// <summary>Who a YouTube channel is, as YouTube itself last reported it.</summary>
public sealed record YouTubeChannelIdentity(string ChannelId, string Title, string? Handle, string? ThumbnailUrl);

public sealed record BrandChannelRename(string BrandChannelId, string Before, string After);

public sealed record BrandChannelSyncResult(
    IReadOnlyList<BrandChannelRename> Renamed,
    IReadOnlyList<BrandChannel> Created,
    bool Changed);

/// <summary>
/// Keeps brand channels in step with the YouTube channels they publish to, so a channel's
/// name and picture are managed in one place - YouTube - and never typed in twice.
/// <para>
/// A brand channel linked to a YouTube channel (Settings → YouTube publishing) takes its
/// name, handle and picture from it. Renamed on YouTube, it follows on the next connect or
/// sync. A connected YouTube channel that no brand channel publishes to yet can get one
/// created for it, starting from the default channel's look.
/// </para>
/// Pure: it edits the settings it is given and says what changed; saving is the caller's.
/// </summary>
public static class BrandChannelYouTubeSync
{
    private const int MaxTitleLength = 200;
    private const int MaxHandleLength = 100;

    public static BrandChannelSyncResult Apply(
        AiSettings settings,
        IEnumerable<YouTubeChannelIdentity> identities,
        bool createMissing,
        Func<string> newId)
    {
        var renamed = new List<BrandChannelRename>();
        var created = new List<BrandChannel>();
        var changed = false;

        foreach (var identity in identities)
        {
            if (!YouTubePublishValidator.IsYouTubeChannelId(identity.ChannelId)) continue;
            var linked = false;

            // The default first, so it keeps the plain name if two brands share a channel.
            if (IsLinked(settings.DefaultPublishing, identity.ChannelId))
            {
                linked = true;
                changed |= Stamp(settings.DefaultPublishing!, identity);
                var name = UniqueName(settings, NameFor(identity), BrandChannel.DefaultId);
                if (!string.Equals(settings.DefaultChannelName, name, StringComparison.Ordinal))
                {
                    renamed.Add(new(BrandChannel.DefaultId, settings.DefaultChannelName, name));
                    settings.DefaultChannelName = name;
                    changed = true;
                }
            }

            foreach (var channel in settings.Channels.Where(c => IsLinked(c.Publishing, identity.ChannelId)))
            {
                linked = true;
                changed |= Stamp(channel.Publishing!, identity);
                var name = UniqueName(settings, NameFor(identity), channel.Id);
                if (!string.Equals(channel.Name, name, StringComparison.Ordinal))
                {
                    renamed.Add(new(channel.Id, channel.Name, name));
                    channel.Name = name;
                    changed = true;
                }
            }

            if (linked || !createMissing || settings.Channels.Count >= BrandChannel.MaxChannels) continue;

            var publishing = settings.DefaultPublishing?.CopyDefaults() ?? new ChannelPublishSettings();
            publishing.YouTubeChannelId = identity.ChannelId;
            Stamp(publishing, identity);

            var brand = new BrandChannel
            {
                Id = newId(),
                Name = UniqueName(settings, NameFor(identity), exceptId: null),
                Watermark = settings.DefaultWatermark?.Clone() ?? new WatermarkSettings(),
                Outro = settings.DefaultOutro?.Clone() ?? new OutroSettings(),
                Publishing = publishing,
            };
            settings.Channels.Add(brand);
            created.Add(brand);
            changed = true;
        }

        return new BrandChannelSyncResult(renamed, created, changed);
    }

    /// <summary>Whether a brand channel's name comes from YouTube, and so can't be edited here.</summary>
    public static bool NameFollowsYouTube(AiSettings settings, string? brandChannelId) =>
        !string.IsNullOrWhiteSpace(settings.PublishingFor(brandChannelId)?.YouTubeChannelId);

    /// <summary>Names are unique ignoring case, across the default and every other channel.</summary>
    public static bool IsNameTaken(AiSettings settings, string name, string? exceptId)
    {
        bool Same(string other) => string.Equals(other.Trim(), name, StringComparison.OrdinalIgnoreCase);
        if (exceptId != BrandChannel.DefaultId && Same(settings.DefaultChannelName)) return true;
        return settings.Channels.Any(c => c.Id != exceptId && Same(c.Name));
    }

    /// <summary>
    /// Copies the identity onto a publishing setup. Only an https picture is kept, since the
    /// console shows it as an image. Returns whether anything changed.
    /// </summary>
    public static bool Stamp(ChannelPublishSettings publishing, YouTubeChannelIdentity identity)
    {
        var title = Truncate(OneLine(identity.Title), MaxTitleLength);
        var handle = string.IsNullOrWhiteSpace(identity.Handle) ? null : Truncate(OneLine(identity.Handle), MaxHandleLength);
        var thumbnail = Uri.TryCreate(identity.ThumbnailUrl, UriKind.Absolute, out var uri) && uri.Scheme == Uri.UriSchemeHttps
            ? uri.ToString()
            : null;

        var changed = publishing.YouTubeChannelTitle != (title.Length == 0 ? null : title)
            || publishing.YouTubeChannelHandle != handle
            || publishing.YouTubeThumbnailUrl != thumbnail;

        publishing.YouTubeChannelTitle = title.Length == 0 ? null : title;
        publishing.YouTubeChannelHandle = handle;
        publishing.YouTubeThumbnailUrl = thumbnail;
        return changed;
    }

    /// <summary>The brand name for a YouTube channel: its title, else its handle, else its id.</summary>
    public static string NameFor(YouTubeChannelIdentity identity)
    {
        foreach (var candidate in new[] { identity.Title, identity.Handle, identity.ChannelId })
        {
            var name = Truncate(OneLine(candidate), BrandChannel.MaxNameLength);
            if (name.Length > 0) return name;
        }
        return identity.ChannelId;
    }

    private static string UniqueName(AiSettings settings, string name, string? exceptId)
    {
        if (!IsNameTaken(settings, name, exceptId)) return name;
        for (var i = 2; ; i++)
        {
            var suffix = $" ({i})";
            var candidate = Truncate(name, BrandChannel.MaxNameLength - suffix.Length).TrimEnd() + suffix;
            if (!IsNameTaken(settings, candidate, exceptId)) return candidate;
        }
    }

    private static bool IsLinked(ChannelPublishSettings? publishing, string channelId) =>
        string.Equals(publishing?.YouTubeChannelId, channelId, StringComparison.Ordinal);

    /// <summary>One line of printable text with runs of whitespace collapsed.</summary>
    private static string OneLine(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return string.Empty;
        var builder = new StringBuilder(value.Length);
        var space = false;
        foreach (var c in value.Trim())
        {
            if (char.IsWhiteSpace(c) || char.IsControl(c))
            {
                space = true;
                continue;
            }
            if (space && builder.Length > 0) builder.Append(' ');
            space = false;
            builder.Append(c);
        }
        return builder.ToString();
    }

    private static string Truncate(string value, int max) => value.Length <= max ? value : value[..max].TrimEnd();
}
