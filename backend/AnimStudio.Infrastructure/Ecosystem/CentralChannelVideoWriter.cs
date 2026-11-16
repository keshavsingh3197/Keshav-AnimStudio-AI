using AnimStudio.Domain.Automation;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MongoDB.Bson;
using MongoDB.Driver;

namespace AnimStudio.Infrastructure.Ecosystem;

/// <summary>
/// Direct writer to <c>AdminDb.channel_videos</c> so published and removed YouTube videos from
/// AnimStudio AI are immediately searchable on keshavsingh.in without inter-service HTTP hops.
/// Best-effort and non-fatal if CentralMongo is unconfigured (e.g. local offline mode / tests).
/// </summary>
public sealed class CentralChannelVideoWriter
{
    private const string VideosCollection = "channel_videos";
    private readonly IMongoCollection<BsonDocument>? _collection;
    private readonly ILogger<CentralChannelVideoWriter> _logger;

    public CentralChannelVideoWriter(IConfiguration configuration, ILogger<CentralChannelVideoWriter> logger)
    {
        _logger = logger;
        var enabled = !string.Equals(configuration["CentralMongo:Enabled"], "false", StringComparison.OrdinalIgnoreCase);
        if (!enabled) return;

        var connString = FirstNonEmpty(
            configuration["CentralMongo:ConnectionString"],
            Environment.GetEnvironmentVariable("CentralMongo__ConnectionString"),
            configuration["Mongo:ConnectionString"],
            Environment.GetEnvironmentVariable("Mongo__ConnectionString"),
            configuration["MongoDbSettings:ConnectionString"],
            Environment.GetEnvironmentVariable("MONGODB_CONNECTION_STRING"));
        var dbName = FirstNonEmpty(
            configuration["CentralMongo:DatabaseName"],
            configuration["CentralMongo:Database"],
            Environment.GetEnvironmentVariable("CentralMongo__DatabaseName"),
            Environment.GetEnvironmentVariable("CentralMongo__Database")) ?? "AdminDb";

        if (string.IsNullOrWhiteSpace(connString)) return;

        try
        {
            var settings = MongoClientSettings.FromConnectionString(connString);
            settings.ConnectTimeout = TimeSpan.FromSeconds(4);
            settings.ServerSelectionTimeout = TimeSpan.FromSeconds(4);
            settings.SocketTimeout = TimeSpan.FromSeconds(5);
            var client = new MongoClient(settings);
            _collection = client.GetDatabase(dbName).GetCollection<BsonDocument>(VideosCollection);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not initialize Central AdminDb channel_videos writer.");
        }
    }

    public async Task UpsertPublishedPostAsync(AutomationPost post, CancellationToken ct = default)
    {
        if (_collection is null || post is null || string.IsNullOrWhiteSpace(post.PublishedVideoId))
            return;

        try
        {
            var videoId = post.PublishedVideoId.Trim();
            var isShort = post.Format == AutomationVideoFormat.Vertical ||
                          (post.PublishedVideoUrl?.Contains("/shorts/", StringComparison.OrdinalIgnoreCase) ?? false);
            var url = !string.IsNullOrWhiteSpace(post.PublishedVideoUrl)
                ? post.PublishedVideoUrl.Trim()
                : (isShort ? $"https://www.youtube.com/shorts/{videoId}" : $"https://www.youtube.com/watch?v={videoId}");
            var handle = (post.TargetChannelHandle ?? string.Empty).Trim();
            if (!string.IsNullOrEmpty(handle) && !handle.StartsWith('@'))
                handle = "@" + handle;

            var channelKey = handle.TrimStart('@').ToLowerInvariant();
            var channelName = !string.IsNullOrWhiteSpace(post.PublishedChannelTitle)
                ? post.PublishedChannelTitle.Trim()
                : (post.TargetChannelTitle ?? handle).Trim();

            var tags = (post.Tags ?? [])
                .Where(t => !string.IsNullOrWhiteSpace(t))
                .Select(t => t.Trim().TrimStart('#').ToLowerInvariant())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .Take(15)
                .ToArray();

            var filter = Builders<BsonDocument>.Filter.Eq("VideoId", videoId);
            var update = Builders<BsonDocument>.Update
                .SetOnInsert("_id", $"vid:{videoId}")
                .Set("VideoId", videoId)
                .Set("Title", post.Title.Length > 200 ? post.Title[..200] : post.Title)
                .Set("Description", post.Description.Length > 1000 ? post.Description[..1000] : post.Description)
                .Set("Url", url)
                .Set("ThumbnailUrl", $"https://i.ytimg.com/vi/{Uri.EscapeDataString(videoId)}/hqdefault.jpg")
                .Set("ChannelKey", channelKey)
                .Set("ChannelName", channelName)
                .Set("ChannelHandle", handle)
                .Set("Platform", "YouTube")
                .Set("Niche", ResolveNiche(post.SourceType))
                .Set("Language", string.Equals(post.Language, "en", StringComparison.OrdinalIgnoreCase) ? "en" : "hi")
                .Set("Format", isShort ? "Short" : "Video")
                .Set("SourceApp", "AnimStudio")
                .Set("AutomationSourceType", post.SourceType.ToString())
                .Set("DurationSeconds", 0)
                .Set("Tags", new BsonArray(tags))
                .Set("PublishedAtUtc", (post.PublishedAtUtc ?? DateTimeOffset.UtcNow).UtcDateTime)
                .Set("UpdatedAtUtc", DateTime.UtcNow)
                .Set("IsRemoved", false);

            await _collection.UpdateOneAsync(filter, update, new UpdateOptions { IsUpsert = true }, ct).ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogWarning(ex, "Non-fatal: failed to upsert video {VideoId} into AdminDb.channel_videos.", post.PublishedVideoId);
        }
    }

    public async Task MarkRemovedAsync(string? videoId, CancellationToken ct = default)
    {
        if (_collection is null || string.IsNullOrWhiteSpace(videoId))
            return;

        try
        {
            var filter = Builders<BsonDocument>.Filter.Eq("VideoId", videoId.Trim());
            var update = Builders<BsonDocument>.Update
                .Set("IsRemoved", true)
                .Set("UpdatedAtUtc", DateTime.UtcNow);
            await _collection.UpdateOneAsync(filter, update, cancellationToken: ct).ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogWarning(ex, "Non-fatal: failed to mark removed video {VideoId} in AdminDb.channel_videos.", videoId);
        }
    }

    private static string ResolveNiche(AutomationSourceType sourceType) => sourceType switch
    {
        AutomationSourceType.FunnyComedy => "Comedy & 3D Skits",
        AutomationSourceType.HinduPanchang or AutomationSourceType.HinduFestival or AutomationSourceType.DailyKatha => "Devotional & Panchang",
        AutomationSourceType.AajKaItihaas => "History & GK",
        AutomationSourceType.Pratiyogita => "Quiz & Competitions",
        _ => "Animation & Creator Studio"
    };

    private static string? FirstNonEmpty(params string?[] values) =>
        values.FirstOrDefault(v => !string.IsNullOrWhiteSpace(v))?.Trim();
}
