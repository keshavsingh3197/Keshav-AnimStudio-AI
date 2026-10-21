using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Domain.Planning;
using AnimStudio.Infrastructure.Publishing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AnimStudio.Infrastructure.Planning;

public sealed class ContentCalendarOptions
{
    public const string Section = "ContentCalendar";

    /// <summary>How often topics are planned ahead and linked videos re-read on YouTube. 0 turns the background pass off.</summary>
    public int SyncMinutes { get; set; } = 30;

    /// <summary>Posts this many days past their time are no longer synced.</summary>
    public int SyncPastDays { get; set; } = 3;

    /// <summary>Posts further ahead than this are not synced yet.</summary>
    public int SyncAheadDays { get; set; } = 60;
}

/// <summary>
/// Keeps the calendar honest without anyone opening it: every pass plans each topic's next
/// slots, links fresh uploads (from the phone too) to the post they match, and re-reads every
/// linked video so a post shows as scheduled or live - or as not scheduled, with the planned
/// time put on it when the topic allows. YouTube quota: one list call per channel plus one
/// read per linked post per pass.
/// </summary>
public sealed class ContentCalendarMonitor(
    IServiceScopeFactory scopes,
    IOptionsMonitor<ContentCalendarOptions> options,
    IOptionsMonitor<YouTubePublishOptions> youTubeOptions,
    TimeProvider clock,
    ILogger<ContentCalendarMonitor> logger) : BackgroundService
{
    private const int MaxTopics = 2000;
    private const int MaxPosts = 2000;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Let startup (index creation, schema) finish first.
        try { await Task.Delay(TimeSpan.FromMinutes(1), clock, stoppingToken).ConfigureAwait(false); }
        catch (OperationCanceledException) { return; }

        while (!stoppingToken.IsCancellationRequested)
        {
            var interval = TimeSpan.FromMinutes(Math.Clamp(options.CurrentValue.SyncMinutes, 0, 24 * 60));
            if (interval > TimeSpan.Zero)
            {
                try
                {
                    await SweepAsync(stoppingToken).ConfigureAwait(false);
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    return;
                }
                catch (Exception ex)
                {
                    // One bad pass must not stop the next; the detail stays in the log.
                    logger.LogError(ex, "Content calendar pass failed");
                }
            }

            try
            {
                await Task.Delay(interval > TimeSpan.Zero ? interval : TimeSpan.FromMinutes(30), clock, stoppingToken).ConfigureAwait(false);
            }
            catch (OperationCanceledException)
            {
                return;
            }
        }
    }

    private async Task SweepAsync(CancellationToken ct)
    {
        await using var scope = scopes.CreateAsyncScope();
        var topicRepository = scope.ServiceProvider.GetRequiredService<IContentTopicRepository>();
        var itemRepository = scope.ServiceProvider.GetRequiredService<IContentPlanItemRepository>();
        var service = scope.ServiceProvider.GetRequiredService<ContentCalendarYouTubeService>();

        var active = await topicRepository.ListActiveAsync(MaxTopics, ct).ConfigureAwait(false);
        var planned = await service.PlanAllAsync(active, ct).ConfigureAwait(false);
        if (planned > 0) logger.LogInformation("Content calendar planned {Count} new post(s)", planned);

        if (!youTubeOptions.CurrentValue.IsConfigured) return;

        var current = options.CurrentValue;
        var now = clock.GetUtcNow().UtcDateTime;
        var posts = await itemRepository.ListInWindowAsync(
            now.AddDays(-Math.Clamp(current.SyncPastDays, 0, 30)),
            now.AddDays(Math.Clamp(current.SyncAheadDays, 1, 365)), MaxPosts, ct).ConfigureAwait(false);

        var topicById = active.ToDictionary(t => t.Id, StringComparer.Ordinal);
        var groups = posts
            .Where(p => p.ChannelId is not null && p.Status != ContentPlanStatus.Skipped && topicById.ContainsKey(p.TopicId))
            .GroupBy(p => (p.UserId, ChannelId: p.ChannelId!));

        foreach (var group in groups)
        {
            ct.ThrowIfCancellationRequested();
            await service.SweepChannelAsync(group.Key.UserId, group.Key.ChannelId, [.. group], topicById, ct).ConfigureAwait(false);
        }
    }
}
