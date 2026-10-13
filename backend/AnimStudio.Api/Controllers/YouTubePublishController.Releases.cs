using System.Text.RegularExpressions;
using AnimStudio.Api.Common;
using AnimStudio.Application.Publishing;
using AnimStudio.Infrastructure.Publishing;
using AnimStudio.Infrastructure.Releases;
using Microsoft.AspNetCore.Mvc;

namespace AnimStudio.Api.Controllers;

/// <summary>
/// Publish a song to YouTube Music: a release kit's visualizer (cover art, waveform and the
/// mastered audio) goes up as a Music-category video on the connected channel, which is how
/// a channel's songs appear in YouTube Music. Same dialog, checks and uploader as a render;
/// only the source file and the pre-filled details differ. Audio-only Art Tracks are not
/// something the YouTube API can create - those still come from a distributor.
/// </summary>
public sealed partial class YouTubePublishController
{
    /// <summary>The visualizer is rendered at a fixed size, see <see cref="FfmpegReleaseKitBuilder"/>.</summary>
    private const int VisualizerWidth = 1920;
    private const int VisualizerHeight = 1080;

    [HttpGet("release-kits/{kitId}/draft")]
    public async Task<ActionResult<ApiResponse<YouTubeDraftResponse>>> ReleaseDraft(string kitId, CancellationToken ct)
    {
        var (kit, path) = LoadOwnedVisualizer(kitId);
        var song = YouTubeMusicMetadata.Compose(kit.Metadata!);

        var facts = VisualizerFacts(kit, path);
        var errors = YouTubePublishValidator.CheckVideo(facts, out var warnings);

        // A song has no project, so the studio's default brand channel decides where it goes.
        var brandSettings = await settingsRepo.GetAsync(ct);
        var defaults = brandSettings?.PublishingFor(null);
        var brandName = brandSettings?.DefaultChannelName ?? "Default";

        return Ok(ApiResponse<YouTubeDraftResponse>.Ok(new YouTubeDraftResponse(
            song.Title,
            YouTubePublishValidator.WithFooter(song.Description, defaults?.DescriptionFooter),
            song.Tags,
            defaults?.Tags ?? [],
            // Always Music, whatever the channel's default: that is what lists it on YouTube Music.
            YouTubeMusicMetadata.MusicCategoryId,
            defaults?.Privacy ?? "public",
            defaults?.MadeForKids ?? false,
            defaults?.NotifySubscribers ?? true,
            defaults?.YouTubeChannelId,
            brandName,
            new YouTubeVideoFactsResponse(facts.DurationSeconds, facts.SizeBytes, facts.Width, facts.Height, facts.IsVertical),
            errors,
            warnings,
            defaults?.FirstComment,
            IsMusic: true)));
    }

    /// <summary>Checks everything, then queues the visualizer's upload. Returns at once with an upload to poll.</summary>
    [HttpPost("release-kits/{kitId}/publish")]
    public async Task<ActionResult<ApiResponse<YouTubeUploadStatus>>> PublishRelease(
        string kitId, [FromBody] YouTubePublishRequest? request, CancellationToken ct)
    {
        var (kit, path) = LoadOwnedVisualizer(kitId);
        var facts = VisualizerFacts(kit, path);

        return await QueueUploadAsync(request, facts, "release kit", (connection, metadata, related, firstComment) => new YouTubeUploadRequest(
            currentUser.UserId,
            kitId,
            StorageKey: string.Empty,
            facts.SizeBytes ?? 0,
            connection.ChannelId,
            connection.ChannelTitle,
            metadata,
            ProjectId: string.Empty,
            related,
            firstComment,
            LocalFilePath: path), ct);
    }

    /// <summary>
    /// The caller's own kit and its visualizer's path. Someone else's kit, an expired one, or a
    /// kit built without a visualizer all read as not found.
    /// </summary>
    private (ReleaseKitTicket Kit, string Path) LoadOwnedVisualizer(string kitId)
    {
        if (!KitIdPattern().IsMatch(kitId)) throw new KeyNotFoundException();

        var kit = releaseKits.TryGetOwned(kitId, currentUser.UserId) ?? throw new KeyNotFoundException();
        var path = ReleaseKitStore.FilePath(kit, FfmpegReleaseKitBuilder.VisualizerFile);
        if (path is null || kit.Metadata is null) throw new KeyNotFoundException();

        return (kit, path);
    }

    private static YouTubeVideoFacts VisualizerFacts(ReleaseKitTicket kit, string path) => new(
        IsCompleted: true,
        HasOutput: true,
        new FileInfo(path).Length,
        kit.Result?.DurationSeconds,
        VisualizerWidth,
        VisualizerHeight);

    /// <summary>Kit ids are <c>Guid.ToString("n")</c>.</summary>
    [GeneratedRegex("^[0-9a-f]{32}$")]
    private static partial Regex KitIdPattern();
}
