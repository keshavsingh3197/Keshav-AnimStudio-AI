using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Ai;
using AnimStudio.Application.Publishing;
using AnimStudio.Domain.Publishing;
using Microsoft.Extensions.Logging;

namespace AnimStudio.Infrastructure.Publishing;

/// <summary>A connected channel and what was last found out about it; <see cref="Analysis"/> is null before the first read.</summary>
public sealed record YouTubeChannelAnalysisView(
    YouTubeConnectionStatus Channel,
    YouTubeChannelAnalysis? Analysis,
    YouTubeChannelInsights? Insights,
    bool CanRefresh,
    DateTime? NextRefreshAtUtc);

/// <summary>Why an analysis could not be read or made. The message is safe to show.</summary>
public sealed class YouTubeAnalysisException(string code, string message, bool notFound = false) : Exception(message)
{
    public string Code { get; } = code;
    public bool NotFound { get; } = notFound;
}

/// <summary>
/// Reads a connected channel's recent uploads and their counters, keeps them, and turns them into advice. The page opens
/// from what was kept - no call to YouTube, no model - and each is asked again only when it can tell something new.
/// </summary>
/// <remarks>
/// <para>
/// A refresh costs a few units of the server's daily YouTube quota (one list call per 50 uploads, one details and one
/// counters call per 50 videos), so the numbers are read again at most every <see cref="MinRefresh"/>, and only when asked.
/// </para>
/// <para>
/// A plan is written by the text model once per set of numbers and goal: asking again with nothing changed gives back the
/// same plan. With no model on, the plan is made from the findings by fixed rules, so the page is useful either way.
/// </para>
/// </remarks>
public sealed class YouTubeChannelAnalysisService(
    IYouTubeChannelAnalysisRepository analyses,
    YouTubeConnectionStore connections,
    YouTubeOAuthClient oauth,
    YouTubeStatsClient stats,
    YouTubeChannelVideosClient videos,
    YouTubeAnalyticsClient analytics,
    IAiExecutor ai,
    IPromptLibrary prompts,
    TimeProvider clock,
    ILogger<YouTubeChannelAnalysisService> logger)
{
    /// <summary>The numbers are not read again sooner than this, however often refresh is pressed.</summary>
    public static readonly TimeSpan MinRefresh = TimeSpan.FromMinutes(30);

    /// <summary>How many of the newest uploads are read.</summary>
    public const int MaxVideos = 100;

    public const int MaxGoalChars = 300;

    /// <summary>How many looked-up videos are kept per channel; the oldest lookup goes first.</summary>
    public const int MaxLookups = 30;

    /// <summary>A video looked up again within this time is answered from what was kept, without calling YouTube.</summary>
    public static readonly TimeSpan LookupFresh = TimeSpan.FromHours(3);

    /// <summary>How many days of the channel's day-by-day numbers are read on refresh.</summary>
    public const int DailyDays = 90;

    /// <summary>A looked-up video's day-by-day numbers go back at most this far.</summary>
    public const int MaxVideoDailyDays = 365;

    public async Task<IReadOnlyList<YouTubeChannelAnalysisView>> ListAsync(string userId, CancellationToken ct)
    {
        var channels = await connections.ListAsync(userId, ct).ConfigureAwait(false);
        var kept = await analyses.ListByUserAsync(userId, ct).ConfigureAwait(false);
        var now = Now;
        return [.. channels.Select(c => View(c, kept.FirstOrDefault(a => a.ChannelId == c.ChannelId), now))];
    }

    public async Task<YouTubeChannelAnalysisView> GetAsync(string userId, string channelId, CancellationToken ct)
    {
        var channel = await OwnedChannelAsync(userId, channelId, ct).ConfigureAwait(false);
        return View(channel, await analyses.GetAsync(userId, channelId, ct).ConfigureAwait(false), Now);
    }

    /// <summary>Reads the channel's numbers from YouTube again, unless they were read less than <see cref="MinRefresh"/> ago.</summary>
    public async Task<YouTubeChannelAnalysisView> RefreshAsync(string userId, string channelId, CancellationToken ct)
    {
        var channel = await OwnedChannelAsync(userId, channelId, ct).ConfigureAwait(false);
        var analysis = await analyses.GetAsync(userId, channelId, ct).ConfigureAwait(false);
        var now = Now;

        if (analysis is not null && analysis.FetchError is null && now - analysis.FetchedAtUtc < MinRefresh)
            return View(channel, analysis, now);

        if (!oauth.IsConfigured)
            throw new YouTubeAnalysisException("youtube-not-configured", "YouTube isn't set up on this server.");
        if (channel.NeedsReconnect)
            throw new YouTubeAnalysisException("youtube-reconnect", "YouTube access for this channel has expired or was removed. Connect the channel again.");

        analysis ??= new YouTubeChannelAnalysis { Id = $"yca_{Guid.NewGuid():n}", UserId = userId, ChannelId = channelId };
        analysis.ChannelTitle = channel.ChannelTitle;

        try
        {
            var token = await connections.GetAccessTokenAsync(userId, channelId, ct).ConfigureAwait(false);
            var counters = await stats.GetMyChannelAsync(token, ct).ConfigureAwait(false);
            var uploads = await videos.ListUploadsDetailedAsync(token, channelId, MaxVideos, ct).ConfigureAwait(false);

            var numbers = new Dictionary<string, YouTubeVideoStats>(StringComparer.Ordinal);
            foreach (var batch in uploads.Select(u => u.VideoId).Where(YouTubeRelatedVideos.IsVideoId).Distinct().Chunk(YouTubeStatsClient.MaxIdsPerCall))
                foreach (var (id, s) in await stats.GetVideosAsync(batch, token, ct).ConfigureAwait(false))
                    numbers[id] = s;

            analysis.Subscribers = counters?.Subscribers;
            analysis.TotalViews = counters?.Views;
            analysis.TotalVideos = counters?.Videos;
            analysis.Videos = [.. uploads.Select(u =>
            {
                numbers.TryGetValue(u.VideoId, out var n);
                return new YouTubeAnalyzedVideo
                {
                    VideoId = u.VideoId,
                    Title = u.Title,
                    PublishedAtUtc = u.ScheduledAt is { } at && at > now ? null : u.PublishedAt,
                    DurationSeconds = u.DurationSeconds,
                    // A video scheduled to go public later is private until then.
                    Privacy = u.ScheduledAt is { } later && later > now ? "private" : u.PrivacyStatus,
                    Views = n?.Views,
                    Likes = n?.Likes,
                    Comments = n?.Comments,
                    ThumbnailUrl = u.ThumbnailUrl,
                    Tags = [.. u.Tags.Take(8)]
                };
            })];
            analysis.FetchedAtUtc = now;
            analysis.FetchError = null;

            if (channel.CanReadAnalytics)
                await ReadAnalyticsAsync(analysis, token, now, ct).ConfigureAwait(false);
        }
        catch (YouTubePublishException ex)
        {
            // Our own user-safe sentence, never Google's raw answer. The numbers read before are kept.
            logger.LogInformation("Couldn't read YouTube numbers for the analysis of channel {ChannelId}: {Code}", channelId, ex.Code);
            analysis.FetchError = ex.Message;
        }

        analysis.UpdatedAtUtc = now;
        await analyses.UpsertAsync(analysis, ct).ConfigureAwait(false);
        return View(channel, analysis, now);
    }

    /// <summary>
    /// Subscribers gained, watch time and retention for every video read, and the channel day by day. A refusal is kept as
    /// a note beside the numbers instead of failing the refresh: the public counters are still worth showing.
    /// </summary>
    private async Task ReadAnalyticsAsync(YouTubeChannelAnalysis analysis, string token, DateTime now, CancellationToken ct)
    {
        var today = DateOnly.FromDateTime(now);
        var dated = analysis.Videos.Where(v => v.PublishedAtUtc is not null && YouTubeRelatedVideos.IsVideoId(v.VideoId)).ToList();
        try
        {
            if (dated.Count > 0)
            {
                var from = DateOnly.FromDateTime(dated.Min(v => v.PublishedAtUtc!.Value));
                var totals = new Dictionary<string, YouTubeVideoAnalytics>(StringComparer.Ordinal);
                foreach (var batch in dated.Select(v => v.VideoId).Distinct().Chunk(YouTubeAnalyticsClient.MaxIdsPerCall))
                    foreach (var (id, t) in await analytics.GetVideoTotalsAsync(batch, from, today, token, ct).ConfigureAwait(false))
                        totals[id] = t;
                // YouTube leaves out a video with no views yet: that is zeros, not unknown.
                foreach (var v in dated)
                    v.Analytics = totals.TryGetValue(v.VideoId, out var t) ? t : new YouTubeVideoAnalytics();
            }

            analysis.Daily = [.. await analytics.GetDailyAsync(null, today.AddDays(-(DailyDays - 1)), today, token, ct).ConfigureAwait(false)];
            analysis.AnalyticsFetchedAtUtc = now;
            analysis.AnalyticsError = null;
        }
        catch (YouTubePublishException ex)
        {
            logger.LogInformation("Couldn't read YouTube Analytics for channel {ChannelId}: {Code}", analysis.ChannelId, ex.Code);
            analysis.AnalyticsError = ex.Message;
        }
    }

    /// <summary>The video looked up before, as it was kept; null when it was not. Calls nothing outside the app.</summary>
    public async Task<YouTubeVideoLookup?> GetLookupAsync(string userId, string channelId, string videoId, CancellationToken ct)
    {
        await OwnedChannelAsync(userId, channelId, ct).ConfigureAwait(false);
        var analysis = await analyses.GetAsync(userId, channelId, ct).ConfigureAwait(false);
        return analysis?.Lookups.FirstOrDefault(l => l.VideoId == videoId);
    }

    /// <summary>
    /// Reads one video by its id: its public counters, and - for one of this channel's own videos, when the channel allows
    /// Analytics - its lifetime totals and how it did day by day. Kept with the analysis; asked again within
    /// <see cref="LookupFresh"/> it is answered from what was kept unless <paramref name="fresh"/>.
    /// </summary>
    public async Task<YouTubeVideoLookup> LookupAsync(string userId, string channelId, string videoId, bool fresh, CancellationToken ct)
    {
        if (!YouTubeRelatedVideos.IsVideoId(videoId))
            throw new YouTubeAnalysisException("video-link-invalid", "That isn't a YouTube video link.");

        var channel = await OwnedChannelAsync(userId, channelId, ct).ConfigureAwait(false);
        var analysis = await analyses.GetAsync(userId, channelId, ct).ConfigureAwait(false)
                       ?? new YouTubeChannelAnalysis { Id = $"yca_{Guid.NewGuid():n}", UserId = userId, ChannelId = channelId, ChannelTitle = channel.ChannelTitle };
        var now = Now;

        var kept = analysis.Lookups.FirstOrDefault(l => l.VideoId == videoId);
        if (!fresh && kept is not null && now - kept.LookedUpAtUtc < LookupFresh)
            return kept;

        if (!oauth.IsConfigured)
            throw new YouTubeAnalysisException("youtube-not-configured", "YouTube isn't set up on this server.");
        if (channel.NeedsReconnect)
            throw new YouTubeAnalysisException("youtube-reconnect", "YouTube access for this channel has expired or was removed. Connect the channel again.");

        YouTubeVideoLookup lookup;
        try
        {
            var token = await connections.GetAccessTokenAsync(userId, channelId, ct).ConfigureAwait(false);
            var details = await videos.GetVideoAsync(token, videoId, ct).ConfigureAwait(false)
                          ?? throw new YouTubeAnalysisException("video-not-found", "YouTube has no video with that link that this channel can see.");
            (await stats.GetVideosAsync([videoId], token, ct).ConfigureAwait(false)).TryGetValue(videoId, out var counters);

            lookup = new YouTubeVideoLookup
            {
                VideoId = videoId,
                Title = details.Title,
                ChannelId = details.ChannelId,
                Own = string.Equals(details.ChannelId, channelId, StringComparison.Ordinal),
                PublishedAtUtc = details.ScheduledAt is { } at && at > now ? null : details.PublishedAt,
                DurationSeconds = details.DurationSeconds,
                Privacy = details.PrivacyStatus,
                ThumbnailUrl = details.ThumbnailUrl,
                Views = counters?.Views,
                Likes = counters?.Likes,
                Comments = counters?.Comments,
                Tags = [.. details.Tags.Take(12)],
                LookedUpAtUtc = now
            };

            if (!lookup.Own)
                lookup.AnalyticsNote = "This video is on another channel. YouTube shares watch time and subscribers only with a channel's owner, so its public numbers are shown.";
            else if (!channel.CanReadAnalytics)
                lookup.AnalyticsNote = "Connect this channel again and allow \"View YouTube Analytics reports\" to see subscribers gained, watch time and when it was watched.";
            else if (lookup.PublishedAtUtc is { } published)
            {
                var today = DateOnly.FromDateTime(now);
                var start = DateOnly.FromDateTime(published);
                try
                {
                    lookup.Analytics = (await analytics.GetVideoTotalsAsync([videoId], start, today, token, ct).ConfigureAwait(false))
                        .GetValueOrDefault(videoId) ?? new YouTubeVideoAnalytics();
                    var dailyFrom = start < today.AddDays(-(MaxVideoDailyDays - 1)) ? today.AddDays(-(MaxVideoDailyDays - 1)) : start;
                    lookup.Daily = [.. await analytics.GetDailyAsync(videoId, dailyFrom, today, token, ct).ConfigureAwait(false)];
                }
                catch (YouTubePublishException ex)
                {
                    logger.LogInformation("Couldn't read YouTube Analytics for a looked-up video on channel {ChannelId}: {Code}", channelId, ex.Code);
                    lookup.AnalyticsNote = ex.Message;
                }
            }
        }
        catch (YouTubePublishException ex)
        {
            throw new YouTubeAnalysisException(ex.Code, ex.Message);
        }

        // An own video that is also in the list gets the fresher numbers there too.
        if (lookup.Own && analysis.Videos.FirstOrDefault(v => v.VideoId == videoId) is { } listed)
        {
            listed.Views = lookup.Views ?? listed.Views;
            listed.Likes = lookup.Likes ?? listed.Likes;
            listed.Comments = lookup.Comments ?? listed.Comments;
            listed.Analytics = lookup.Analytics ?? listed.Analytics;
        }

        analysis.Lookups = [lookup, .. analysis.Lookups.Where(l => l.VideoId != videoId).Take(MaxLookups - 1)];
        analysis.UpdatedAtUtc = now;
        await analyses.UpsertAsync(analysis, ct).ConfigureAwait(false);
        return lookup;
    }

    /// <summary>Forgets a looked-up video. Nothing happens when it was not kept.</summary>
    public async Task RemoveLookupAsync(string userId, string channelId, string videoId, CancellationToken ct)
    {
        await OwnedChannelAsync(userId, channelId, ct).ConfigureAwait(false);
        var analysis = await analyses.GetAsync(userId, channelId, ct).ConfigureAwait(false);
        if (analysis is null || analysis.Lookups.RemoveAll(l => l.VideoId == videoId) == 0) return;
        analysis.UpdatedAtUtc = Now;
        await analyses.UpsertAsync(analysis, ct).ConfigureAwait(false);
    }

    /// <summary>
    /// The advice and the plan. The kept plan is given back while the numbers and the goal are unchanged, unless
    /// <paramref name="fresh"/> asks the model to think again.
    /// </summary>
    public async Task<YouTubeChannelAnalysisView> PlanAsync(string userId, string channelId, string? goal, bool fresh, CancellationToken ct)
    {
        var channel = await OwnedChannelAsync(userId, channelId, ct).ConfigureAwait(false);
        var analysis = await analyses.GetAsync(userId, channelId, ct).ConfigureAwait(false);
        if (analysis is null || analysis.Videos.Count == 0)
        {
            var refreshed = await RefreshAsync(userId, channelId, ct).ConfigureAwait(false);
            analysis = refreshed.Analysis;
            if (analysis is null || analysis.Videos.Count == 0)
                throw new YouTubeAnalysisException("no-videos", analysis?.FetchError ?? "This channel has no videos to analyse yet.");
        }

        var now = Now;
        var cleanGoal = AiOutputSanitizer.ToSafeLine(goal, MaxGoalChars);
        var fingerprint = YouTubeChannelAnalyzer.Fingerprint(analysis, cleanGoal);
        if (!fresh && analysis.Report is { } kept && kept.DataFingerprint == fingerprint)
            return View(channel, analysis, now);

        var insights = YouTubeChannelAnalyzer.Insights(analysis, now);
        var report = await AskAsync(analysis, insights, cleanGoal, fresh, now, ct).ConfigureAwait(false)
                     ?? YouTubeChannelAnalyzer.RuleReport(analysis, insights, cleanGoal, now);
        report.DataFingerprint = fingerprint;
        report.Goal = cleanGoal;
        report.CreatedAtUtc = now;

        analysis.Report = report;
        analysis.UpdatedAtUtc = now;
        await analyses.UpsertAsync(analysis, ct).ConfigureAwait(false);
        return View(channel, analysis, now);
    }

    private async Task<YouTubeChannelReport?> AskAsync(
        YouTubeChannelAnalysis analysis, YouTubeChannelInsights insights, string? goal, bool fresh, DateTime now, CancellationToken ct)
    {
        RenderedPrompt rendered;
        try
        {
            rendered = await prompts.RenderAsync(BuiltInPrompts.YouTubeChannelPlan, new Dictionary<string, string?>(StringComparer.Ordinal)
            {
                ["channel"] = YouTubeChannelAnalyzer.ChannelBlock(analysis, insights),
                ["videos"] = YouTubeChannelAnalyzer.VideosBlock(analysis, now),
                ["goal"] = goal ?? "(none)"
            }, ct).ConfigureAwait(false);
        }
        catch (PromptTemplateException ex)
        {
            logger.LogError("The {Template} prompt could not be rendered: {Code}", BuiltInPrompts.YouTubeChannelPlan, ex.Code);
            return null;
        }

        var outcome = await ai.TextAsync(new AiTextRequest
        {
            SystemPrompt = rendered.SystemPrompt,
            Prompt = rendered.Body,
            JsonSchema = rendered.OutputJsonSchema,
            PromptTemplateKey = rendered.TemplateKey,
            PromptTemplateVersion = rendered.Version,
            MaxOutputTokens = 4_000,
            Temperature = 0.4,
            BypassCache = fresh
        }, new AiCallContext(null, analysis.UserId), ct).ConfigureAwait(false);

        if (!outcome.IsSuccess)
        {
            logger.LogInformation("No channel plan from a text model ({Kind}); using the built-in rules.", outcome.Kind);
            return null;
        }

        var report = YouTubeChannelAnalyzer.ParseReport(outcome.Value!.Text);
        if (report is not null) report.By = outcome.Value.Provenance.ProviderId;
        return report;
    }

    private async Task<YouTubeConnectionStatus> OwnedChannelAsync(string userId, string channelId, CancellationToken ct)
    {
        // Only a channel this person connected; anyone else's answers as one that does not exist.
        var channels = await connections.ListAsync(userId, ct).ConfigureAwait(false);
        return channels.FirstOrDefault(c => string.Equals(c.ChannelId, channelId, StringComparison.Ordinal))
            ?? throw new YouTubeAnalysisException("channel-not-found", "That channel isn't connected to your account.", notFound: true);
    }

    private YouTubeChannelAnalysisView View(YouTubeConnectionStatus channel, YouTubeChannelAnalysis? analysis, DateTime now)
    {
        var next = analysis is { FetchError: null } ? analysis.FetchedAtUtc + MinRefresh : (DateTime?)null;
        return new YouTubeChannelAnalysisView(
            channel,
            analysis,
            // A record made only to keep a lookup has no numbers read yet: no insights to show from it.
            analysis is null || analysis.FetchedAtUtc == default ? null : YouTubeChannelAnalyzer.Insights(analysis, now),
            oauth.IsConfigured && !channel.NeedsReconnect && (next is null || next <= now),
            next is { } at && at > now ? DateTime.SpecifyKind(at, DateTimeKind.Utc) : null);
    }

    private DateTime Now => clock.GetUtcNow().UtcDateTime;
}
