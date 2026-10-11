using AnimStudio.Api.Common;
using AnimStudio.Application.LiveStreams;
using AnimStudio.Application.Publishing;
using AnimStudio.Infrastructure.LiveStreams;
using AnimStudio.Infrastructure.Publishing;
using Microsoft.AspNetCore.Mvc;

namespace AnimStudio.Api.Controllers;

/// <summary>
/// The third key source: a broadcast created on one of the caller's connected YouTube channels
/// (see <see cref="YouTubeLiveController"/>). Its key is read from YouTube at go-live with the
/// caller's own token, so it never reaches the browser and is never stored - only held for
/// this stream, like a pasted key.
/// </summary>
public sealed partial class LiveStreamsController
{
    private async Task<(LiveStreamKeyTarget? Target, ActionResult? Error)> ResolveYouTubeBroadcastAsync(
        LiveStreamYouTubeBroadcast broadcast, string destinationId, CancellationToken ct)
    {
        var channelId = broadcast.ChannelId?.Trim();
        var broadcastId = broadcast.BroadcastId?.Trim();
        if (!YouTubePublishValidator.IsYouTubeChannelId(channelId) || !YouTubeLiveClient.IsBroadcastId(broadcastId))
            return (null, Invalid("broadcast-invalid", "Choose a YouTube broadcast to stream to.", "youTube"));

        // A YouTube key only works on YouTube's ingest; never send it anywhere else.
        if (!streams.Destinations.TryGetValue(destinationId, out var destination)
            || !Uri.TryCreate(destination.IngestUrl, UriKind.Absolute, out var ingest)
            || !(ingest.Host.Equals("youtube.com", StringComparison.OrdinalIgnoreCase)
                 || ingest.Host.EndsWith(".youtube.com", StringComparison.OrdinalIgnoreCase)))
            return (null, Invalid("broadcast-destination", "A YouTube broadcast can only be streamed to the YouTube destination.", "destinationId"));

        // The connection is looked up under the caller's own id, so someone else's channel can't be used.
        var connection = await youTubeConnections.GetAsync(currentUser.UserId, channelId!, ct);
        if (connection is null || connection.RevokedAt is not null)
            return (null, Conflict(ApiResponse<LiveStreamStatus>.Fail("That YouTube channel isn't connected. Connect it again under YouTube.",
                new ApiError("youtube-channel-not-connected", "That YouTube channel isn't connected.", Field: "youTube", Hint: "YouTube → Connect a channel"))));

        try
        {
            var token = await youTubeConnections.GetAccessTokenAsync(currentUser.UserId, channelId!, ct);
            var ingestInfo = await youTubeLive.GetIngestAsync(broadcastId!, token, ct);

            if (LiveStreamValidator.ValidateStreamKey(ingestInfo.StreamKey) is not null)
            {
                logger.LogWarning("YouTube returned a stream key for broadcast {BroadcastId} that failed validation", broadcastId);
                return (null, Conflict(ApiResponse<LiveStreamStatus>.Fail("YouTube returned an unusable stream key. Create a new broadcast.",
                    new ApiError("youtube-live-failed", "Unusable stream key from YouTube.", Field: "youTube"))));
            }

            logger.LogInformation("User {UserId} is streaming to YouTube broadcast {BroadcastId} on channel {ChannelId}",
                currentUser.UserId, broadcastId, channelId);
            return (new LiveStreamKeyTarget(null, ingestInfo.StreamKey), null);
        }
        catch (YouTubePublishException ex)
        {
            logger.LogWarning("YouTube broadcast {BroadcastId} couldn't be used by user {UserId}: {Code}", broadcastId, currentUser.UserId, ex.Code);
            var body = ApiResponse<LiveStreamStatus>.Fail(ex.Message, new ApiError(ex.Code, ex.Message, Field: "youTube"));
            return (null, ex.Code switch
            {
                "youtube-unreachable" => StatusCode(StatusCodes.Status502BadGateway, body),
                "youtube-busy" => StatusCode(StatusCodes.Status429TooManyRequests, body),
                "youtube-not-configured" or "encryption-not-configured" => StatusCode(StatusCodes.Status503ServiceUnavailable, body),
                _ => Conflict(body)
            });
        }
    }
}
