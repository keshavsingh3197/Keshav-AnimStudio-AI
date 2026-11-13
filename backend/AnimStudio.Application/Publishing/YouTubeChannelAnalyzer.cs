using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using AnimStudio.Application.Ai;
using AnimStudio.Domain.Publishing;

namespace AnimStudio.Application.Publishing;

/// <summary>A video with how it has done for its age: views a day since it went up.</summary>
public sealed record YouTubeVideoScore(YouTubeAnalyzedVideo Video, double ViewsPerDay, double? Engagement, bool IsShort);

/// <summary>A thing the numbers show. <c>Kind</c> is <c>good</c>, <c>warn</c> or <c>info</c>.</summary>
public sealed record YouTubeFinding(string Kind, string Text);

/// <summary>What the numbers show, worked out without any model: the base of the page, and what the model is given.</summary>
public sealed record YouTubeChannelInsights(
    int PublicVideos,
    double MedianViewsPerDay,
    double? Engagement,
    int Shorts,
    int LongVideos,
    double? ShortsMedianViewsPerDay,
    double? LongMedianViewsPerDay,
    double? DaysBetweenUploads,
    int? DaysSinceLastUpload,
    string? BestWeekday,
    IReadOnlyList<YouTubeVideoScore> Top,
    IReadOnlyList<YouTubeVideoScore> Low,
    IReadOnlyList<YouTubeFinding> Findings,
    YouTubeUploadRhythm? Rhythm = null);

/// <summary>How videos did when they went up this many days after the one before.</summary>
/// <param name="MedianScore">The median of each video's views a day over the typical video of its kind: 1 is typical, 2 is twice.</param>
public sealed record YouTubeGapBucket(string Label, int MinDays, int Videos, double MedianScore);

/// <summary>
/// How long to leave between uploads, learnt from this channel's own history where it shows something, and the upload it
/// counts from.
/// </summary>
/// <param name="RecommendedGapDays">Days to leave after the last upload before the next.</param>
/// <param name="FromHistory">True when the spacing comes from this channel's numbers; false when there were too few to tell.</param>
/// <param name="LastIsHot">The last upload is young and doing better than usual: give it room before the next.</param>
public sealed record YouTubeUploadRhythm(
    double RecommendedGapDays,
    bool FromHistory,
    IReadOnlyList<YouTubeGapBucket> Buckets,
    DateTime? LastUploadAtUtc,
    string? LastUploadTitle,
    bool LastIsShort,
    bool LastIsHot,
    string Reason);

/// <summary>
/// Reads a channel's recent uploads the way a creator would want them read: which videos are pulling views for their age,
/// whether Shorts or longer videos do better here, how often the channel posts, and what that suggests doing next.
/// </summary>
/// <remarks>
/// The public counters the YouTube Data API gives - views, likes, comments, lengths and dates - and, where the channel
/// allows it, YouTube Analytics' subscribers gained, watch time and the share of each video watched. Thumbnail
/// click-through is only in YouTube Studio, so nothing here claims to know it.
/// </remarks>
public static class YouTubeChannelAnalyzer
{
    /// <summary>A video this long or shorter is counted as a Short (YouTube allows Shorts of up to three minutes).</summary>
    public const double ShortMaxSeconds = 180;

    /// <summary>A video younger than this has not settled; it is listed but not ranked.</summary>
    public const double MinAgeDays = 2;

    public static YouTubeChannelInsights Insights(YouTubeChannelAnalysis analysis, DateTime now)
    {
        var scored = analysis.Videos
            .Where(v => IsPublic(v) && v.PublishedAtUtc is { } at && at <= now && v.Views is not null)
            .Select(v => Score(v, now))
            .ToList();
        var settled = scored.Where(s => Age(s.Video, now) >= MinAgeDays).ToList();

        var shorts = settled.Where(s => s.IsShort).ToList();
        var longs = settled.Where(s => !s.IsShort).ToList();
        var engagement = Engagement(scored.Select(s => s.Video));

        var dates = scored.Select(s => s.Video.PublishedAtUtc!.Value).OrderByDescending(d => d).ToList();
        double? gap = dates.Count >= 3 ? Math.Round((dates[0] - dates[^1]).TotalDays / (dates.Count - 1), 1) : null;
        int? since = dates.Count > 0 ? (int)Math.Floor((now - dates[0]).TotalDays) : null;

        var weekday = settled.Count >= 8
            ? settled.GroupBy(s => s.Video.PublishedAtUtc!.Value.DayOfWeek)
                .Where(g => g.Count() >= 2)
                .OrderByDescending(g => Median(g.Select(s => s.ViewsPerDay)))
                .Select(g => g.Key.ToString())
                .FirstOrDefault()
            : null;

        var ranked = settled.OrderByDescending(s => s.ViewsPerDay).ToList();
        var top = ranked.Take(5).ToList();
        var low = ranked.Count >= 8 ? ranked.TakeLast(5).Reverse().ToList() : [];

        var median = Median(settled.Select(s => s.ViewsPerDay));
        var insights = new YouTubeChannelInsights(
            scored.Count, Math.Round(median, 1), engagement,
            shorts.Count, longs.Count,
            shorts.Count >= 2 ? Math.Round(Median(shorts.Select(s => s.ViewsPerDay)), 1) : null,
            longs.Count >= 2 ? Math.Round(Median(longs.Select(s => s.ViewsPerDay)), 1) : null,
            gap, since, weekday, top, low, [], Rhythm(scored, settled, now));
        return insights with { Findings = Findings(insights, analysis) };
    }

    // ------------------------------------------------------------------------------------------------ upload rhythm

    private static readonly (string Label, int MinDays)[] GapBuckets =
        [("Same day", 0), ("1-2 days", 1), ("3-4 days", 3), ("5-7 days", 5), ("8-14 days", 8), ("15+ days", 15)];

    /// <summary>A bucket needs this many videos before its median is trusted.</summary>
    public const int MinBucketVideos = 2;

    /// <summary>
    /// Whether videos here do better when there is more room before them. Each settled video is scored against the typical
    /// video of its own kind (so a Short is compared with Shorts), grouped by the days since the upload before it, and the
    /// gap with the best median wins - when at least two gaps have enough videos and the best is clearly better.
    /// </summary>
    private static YouTubeUploadRhythm? Rhythm(List<YouTubeVideoScore> scored, List<YouTubeVideoScore> settled, DateTime now)
    {
        if (scored.Count == 0) return null;

        var byDate = scored.OrderBy(s => s.Video.PublishedAtUtc).ToList();
        var shortMedian = Median(settled.Where(s => s.IsShort).Select(s => s.ViewsPerDay));
        var longMedian = Median(settled.Where(s => !s.IsShort).Select(s => s.ViewsPerDay));
        var allMedian = Median(settled.Select(s => s.ViewsPerDay));
        double Typical(YouTubeVideoScore s) => (s.IsShort ? shortMedian : longMedian) is > 0 and var m ? m : allMedian;

        var points = new List<(double Gap, double Score)>();
        for (var i = 1; i < byDate.Count; i++)
        {
            var s = byDate[i];
            if (Age(s.Video, now) < MinAgeDays || Typical(s) <= 0) continue;
            var gapDays = (s.Video.PublishedAtUtc!.Value - byDate[i - 1].Video.PublishedAtUtc!.Value).TotalDays;
            points.Add((gapDays, s.ViewsPerDay / Typical(s)));
        }

        var buckets = GapBuckets
            .Select((b, i) =>
            {
                var upper = i + 1 < GapBuckets.Length ? GapBuckets[i + 1].MinDays : double.MaxValue;
                var inside = points.Where(p => p.Gap >= b.MinDays && p.Gap < upper).Select(p => p.Score).ToList();
                return new YouTubeGapBucket(b.Label, b.MinDays, inside.Count, Math.Round(Median(inside), 2));
            })
            .Where(b => b.Videos > 0)
            .ToList();

        var last = byDate[^1];
        var lastAge = Age(last.Video, now);
        var lastIsHot = lastAge < 7 && Typical(last) > 0 && last.ViewsPerDay >= Typical(last) * 1.5;
        var shortsMostly = scored.Count(s => s.IsShort) * 2 >= scored.Count;

        var trusted = buckets.Where(b => b.Videos >= MinBucketVideos).ToList();
        double gap;
        bool fromHistory;
        string reason;
        if (trusted.Count >= 2 && trusted.MaxBy(b => b.MedianScore) is { } best && best.MedianScore >= trusted.Min(b => b.MedianScore) * 1.15)
        {
            fromHistory = true;
            gap = Math.Max(1, best.MinDays);
            reason = $"Videos that went up {best.Label.ToLowerInvariant()} after the one before did best here ({N(best.MedianScore)}× a typical video, from {best.Videos}).";
        }
        else
        {
            fromHistory = false;
            gap = shortsMostly ? 2 : 4;
            reason = trusted.Count >= 2
                ? "The gap between uploads has made little difference here so far, so a steady rhythm is the safe choice."
                : $"Too few uploads to tell yet how much room each needs; {(shortsMostly ? "a Short every two days" : "a video every four days")} is a common start.";
        }

        // A young upload that is doing well is still being shown to new viewers; a new one now would compete with it.
        if (lastIsHot && gap < 3)
        {
            gap = 3;
            reason += " The last upload is doing better than usual, so give it at least three days.";
        }

        return new YouTubeUploadRhythm(gap, fromHistory, buckets, last.Video.PublishedAtUtc, last.Video.Title, last.IsShort, lastIsHot, reason);
    }

    public static YouTubeVideoScore Score(YouTubeAnalyzedVideo video, DateTime now)
    {
        var days = Math.Max(1, Age(video, now));
        var views = video.Views ?? 0;
        double? engagement = views > 0 ? Math.Round(((video.Likes ?? 0) + (video.Comments ?? 0)) / (double)views * 100, 2) : null;
        return new YouTubeVideoScore(video, Math.Round(views / days, 1), engagement, video.DurationSeconds is > 0 and <= ShortMaxSeconds);
    }

    private static double Age(YouTubeAnalyzedVideo video, DateTime now) =>
        video.PublishedAtUtc is { } at ? (now - at).TotalDays : 0;

    private static bool IsPublic(YouTubeAnalyzedVideo video) =>
        string.Equals(video.Privacy, "public", StringComparison.OrdinalIgnoreCase);

    /// <summary>Likes and comments per hundred views, across the videos.</summary>
    private static double? Engagement(IEnumerable<YouTubeAnalyzedVideo> videos)
    {
        long views = 0, reactions = 0;
        foreach (var v in videos)
        {
            views += v.Views ?? 0;
            reactions += (v.Likes ?? 0) + (v.Comments ?? 0);
        }
        return views > 0 ? Math.Round(reactions / (double)views * 100, 2) : null;
    }

    public static double Median(IEnumerable<double> values)
    {
        var sorted = values.OrderBy(v => v).ToList();
        if (sorted.Count == 0) return 0;
        var mid = sorted.Count / 2;
        return sorted.Count % 2 == 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    }

    // ------------------------------------------------------------------------------------------------ findings

    private static List<YouTubeFinding> Findings(YouTubeChannelInsights i, YouTubeChannelAnalysis analysis)
    {
        var found = new List<YouTubeFinding>();
        if (i.PublicVideos == 0)
        {
            found.Add(new("info", "There are no public videos with numbers yet. Publish a few, then come back for advice."));
            return found;
        }

        if (i.ShortsMedianViewsPerDay is { } s && i.LongMedianViewsPerDay is { } l && s > 0 && l > 0)
        {
            if (s >= l * 1.5) found.Add(new("good", $"Shorts get {Ratio(s, l)} the views a day of longer videos here ({N(s)} against {N(l)}). Make more of them, and use them to point viewers to the long ones."));
            else if (l >= s * 1.5) found.Add(new("good", $"Longer videos get {Ratio(l, s)} the views a day of Shorts here ({N(l)} against {N(s)}). They are this channel's strength."));
        }
        else if (i.Shorts == 0 && i.LongVideos >= 3)
        {
            found.Add(new("info", "There are no Shorts yet. A vertical cut of the best moment of each story is a cheap way to be found."));
        }

        if (i.DaysSinceLastUpload is > 14)
            found.Add(new("warn", $"The last upload was {i.DaysSinceLastUpload} days ago. A steady rhythm matters more than volume - pick a day and keep to it."));
        if (i.DaysBetweenUploads is > 10)
            found.Add(new("warn", $"Videos go up about every {N(i.DaysBetweenUploads.Value)} days. Once or twice a week gives YouTube more to recommend."));
        else if (i.DaysBetweenUploads is { } gap and <= 4)
            found.Add(new("good", $"A video about every {N(gap)} days: a strong rhythm. Keep the quality even."));

        if (i.Engagement is { } e)
        {
            if (e < 2) found.Add(new("warn", $"Only {N(e)} likes and comments per hundred views. End each video with one clear question to answer in the comments, and pin a reply."));
            else if (e >= 5) found.Add(new("good", $"{N(e)} likes and comments per hundred views: viewers care. Reply to comments in the first hour after publishing."));
        }

        if (i.Top.Count > 0 && i.MedianViewsPerDay > 0 && i.Top[0].ViewsPerDay >= i.MedianViewsPerDay * 3)
            found.Add(new("good", $"\"{i.Top[0].Video.Title}\" is doing {Ratio(i.Top[0].ViewsPerDay, i.MedianViewsPerDay)} better than a typical video. A follow-up or a second part of it is the safest next video."));

        if (i.BestWeekday is { } day)
            found.Add(new("info", $"Videos published on a {day} have done best so far. Try that day for the next few, then compare."));

        if (i.Rhythm is { FromHistory: true } rhythm)
            found.Add(new("info", rhythm.Reason));

        var measured = analysis.Videos.Where(v => IsPublic(v) && v.Analytics is not null && v.Views is > 0).ToList();
        if (measured.Count >= 5)
        {
            if (measured.MaxBy(v => v.Analytics!.SubscribersGained) is { Analytics.SubscribersGained: > 0 } magnet)
                found.Add(new("good", $"\"{magnet.Title}\" brought the most subscribers ({magnet.Analytics!.SubscribersGained:N0}). Videos like it grow the channel, not just the views."));

            var shortsSubs = SubsPerThousand(measured.Where(v => v.DurationSeconds is > 0 and <= ShortMaxSeconds));
            var longSubs = SubsPerThousand(measured.Where(v => v.DurationSeconds is > ShortMaxSeconds));
            if (shortsSubs is { } ss && longSubs is { } ls && ss > 0 && ls > 0 && Math.Max(ss, ls) >= Math.Min(ss, ls) * 1.5)
                found.Add(new("info", ls > ss
                    ? $"Longer videos win {N(ls)} subscribers per thousand views, Shorts {N(ss)}. Shorts bring reach; the longer ones turn viewers into subscribers."
                    : $"Shorts win {N(ss)} subscribers per thousand views, longer videos {N(ls)}. Here Shorts are the subscriber engine."));

            var longRetention = measured.Where(v => v.DurationSeconds is > ShortMaxSeconds).Select(v => v.Analytics!.AverageViewPercent).ToList();
            if (longRetention.Count >= 3 && Median(longRetention) is var kept and < 35)
                found.Add(new("warn", $"Viewers watch about {N(kept)}% of a longer video on average. Tighten the first 30 seconds and cut slow middles."));
            var shortRetention = measured.Where(v => v.DurationSeconds is > 0 and <= ShortMaxSeconds).Select(v => v.Analytics!.AverageViewPercent).ToList();
            if (shortRetention.Count >= 3 && Median(shortRetention) is var held and >= 80)
                found.Add(new("good", $"Shorts are watched to about {N(held)}% on average - they hold attention. Keep the hook in the first second."));
        }

        var untagged = analysis.Videos.Count(v => IsPublic(v) && v.Tags.Count == 0);
        if (untagged >= 3)
            found.Add(new("warn", $"{untagged} public videos have no tags. Tags matter little for ranking, but they help with misspelt searches - add a few."));

        var longTitles = analysis.Videos.Count(v => IsPublic(v) && v.Title.Length > 70);
        if (longTitles >= 3)
            found.Add(new("info", $"{longTitles} titles are over 70 characters and get cut off on phones. Put the hook in the first 40."));

        return found;
    }

    /// <summary>Subscribers gained per thousand views across the videos; null when they have no views.</summary>
    private static double? SubsPerThousand(IEnumerable<YouTubeAnalyzedVideo> videos)
    {
        long views = 0, subs = 0;
        foreach (var v in videos)
        {
            views += v.Views ?? 0;
            subs += v.Analytics?.SubscribersGained ?? 0;
        }
        return views > 0 ? Math.Round(subs * 1000.0 / views, 2) : null;
    }

    private static string Ratio(double a, double b) => $"{(a / b).ToString("0.#", CultureInfo.InvariantCulture)}×";

    private static string N(double value) => value.ToString(value >= 100 ? "N0" : "0.#", CultureInfo.InvariantCulture);

    // ------------------------------------------------------------------------------------------------ for the model

    /// <summary>The channel and the findings, as data for the model.</summary>
    public static string ChannelBlock(YouTubeChannelAnalysis analysis, YouTubeChannelInsights i)
    {
        var b = new StringBuilder();
        b.Append("Channel: ").Append(analysis.ChannelTitle).Append('\n');
        if (analysis.Subscribers is { } subs) b.Append("Subscribers: ").Append(subs).Append('\n');
        if (analysis.TotalViews is { } views) b.Append("Total views: ").Append(views).Append('\n');
        if (analysis.TotalVideos is { } count) b.Append("Total videos: ").Append(count).Append('\n');
        b.Append("Public videos analysed: ").Append(i.PublicVideos).Append('\n');
        b.Append("Median views a day per video: ").Append(N(i.MedianViewsPerDay)).Append('\n');
        if (i.Engagement is { } e) b.Append("Likes and comments per 100 views: ").Append(N(e)).Append('\n');
        b.Append("Shorts: ").Append(i.Shorts).Append(i.ShortsMedianViewsPerDay is { } s ? $" (median {N(s)} views a day)" : string.Empty).Append('\n');
        b.Append("Longer videos: ").Append(i.LongVideos).Append(i.LongMedianViewsPerDay is { } l ? $" (median {N(l)} views a day)" : string.Empty).Append('\n');
        if (i.DaysBetweenUploads is { } gap) b.Append("Days between uploads: ").Append(N(gap)).Append('\n');
        if (i.DaysSinceLastUpload is { } since) b.Append("Days since the last upload: ").Append(since).Append('\n');
        if (i.BestWeekday is { } day) b.Append("Best day to publish so far: ").Append(day).Append('\n');
        if (i.Rhythm is { } r)
        {
            b.Append("Upload rhythm: leave about ").Append(N(r.RecommendedGapDays)).Append(" days between uploads. ").Append(r.Reason).Append('\n');
            foreach (var g in r.Buckets)
                b.Append("- uploaded ").Append(g.Label.ToLowerInvariant()).Append(" after the one before: ").Append(g.Videos)
                    .Append(" videos, median ").Append(N(g.MedianScore)).Append("× a typical video\n");
        }
        if (analysis.Daily.Count > 0)
        {
            var gained = analysis.Daily.Sum(d => d.SubscribersGained);
            var lost = analysis.Daily.Sum(d => d.SubscribersLost);
            b.Append("Subscribers over the last ").Append(analysis.Daily.Count).Append(" days: +").Append(gained).Append(" / -").Append(lost).Append('\n');
        }
        if (i.Findings.Count > 0)
        {
            b.Append("\nAlready noticed:\n");
            foreach (var f in i.Findings) b.Append("- ").Append(f.Text).Append('\n');
        }
        return b.ToString().TrimEnd();
    }

    /// <summary>The videos, one line each, newest first.</summary>
    public static string VideosBlock(YouTubeChannelAnalysis analysis, DateTime now, int max = 50)
    {
        var b = new StringBuilder();
        foreach (var v in analysis.Videos.Where(IsPublic).Take(max))
        {
            var score = Score(v, now);
            b.Append(v.Title.Replace('|', '/')).Append(" | ")
                .Append(v.PublishedAtUtc?.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture) ?? "?").Append(" | ")
                .Append(v.DurationSeconds is { } d ? $"{(int)d / 60}:{(int)d % 60:00}" : "?").Append(" | ")
                .Append(v.Views?.ToString(CultureInfo.InvariantCulture) ?? "?").Append(" | ")
                .Append(N(score.ViewsPerDay)).Append(" | ")
                .Append(v.Likes?.ToString(CultureInfo.InvariantCulture) ?? "hidden").Append(" | ")
                .Append(v.Comments?.ToString(CultureInfo.InvariantCulture) ?? "?").Append(" | ")
                .Append(score.IsShort ? "short" : "long").Append(" | ")
                .Append(v.Analytics?.SubscribersGained.ToString(CultureInfo.InvariantCulture) ?? "?").Append(" | ")
                .Append(v.Analytics is { } a ? N(a.AverageViewPercent) : "?").Append('\n');
        }
        return b.Length == 0 ? "(no public videos)" : b.ToString().TrimEnd();
    }

    /// <summary>
    /// A digest of what a report is written from: the videos and their counters (rounded, so a handful of new views does
    /// not count as new data) and the goal.
    /// </summary>
    public static string Fingerprint(YouTubeChannelAnalysis analysis, string? goal)
    {
        var b = new StringBuilder();
        b.Append(goal?.Trim()).Append('\n');
        foreach (var v in analysis.Videos.Where(IsPublic))
        {
            b.Append(v.VideoId).Append(':').Append(Bucket(v.Views)).Append(':').Append(Bucket(v.Likes));
            // Only when there are Analytics numbers, so a plan kept from before them still matches its numbers.
            if (v.Analytics is { } a) b.Append(':').Append(Bucket(a.SubscribersGained));
            b.Append('\n');
        }
        return Convert.ToHexStringLower(SHA256.HashData(Encoding.UTF8.GetBytes(b.ToString())))[..32];
    }

    /// <summary>Counters to two significant figures: 1234 and 1260 are the same, 1234 and 1600 are not.</summary>
    private static long Bucket(long? value)
    {
        if (value is not > 0) return 0;
        var magnitude = (long)Math.Pow(10, Math.Max(0, (int)Math.Floor(Math.Log10(value.Value)) - 1));
        return value.Value / magnitude * magnitude;
    }

    // ------------------------------------------------------------------------------------------------ reports

    /// <summary>The model's report, every string cleaned like any other model output before it is kept or shown.</summary>
    public static YouTubeChannelReport? ParseReport(string? json)
    {
        try
        {
            using var doc = JsonDocument.Parse(AiJsonResponse.Unwrap(json));
            var root = doc.RootElement;
            var summary = AiOutputSanitizer.ToSafeText(Text(root, "summary"), 1_500);
            if (summary is null) return null;

            return new YouTubeChannelReport
            {
                Summary = summary,
                WhatWorks = Strings(root, "whatWorks", 6, 500),
                WhatToFix = Strings(root, "whatToFix", 6, 500),
                Suggestions = [.. Objects(root, "suggestions", 10).Select(o =>
                    AiOutputSanitizer.ToSafeLine(Text(o, "title"), 120) is { } title
                        ? new YouTubeSuggestion
                        {
                            Title = title,
                            Detail = AiOutputSanitizer.ToSafeText(Text(o, "detail"), 800),
                            Priority = Text(o, "priority")?.Trim().ToLowerInvariant() is ("high" or "low") and var p ? p : "medium"
                        }
                        : null).OfType<YouTubeSuggestion>()],
                Plan = [.. Objects(root, "plan", 16).Select(o =>
                    AiOutputSanitizer.ToSafeText(Text(o, "action"), 500) is { } action
                        ? new YouTubePlanStep { When = AiOutputSanitizer.ToSafeLine(Text(o, "when"), 40), Action = action }
                        : null).OfType<YouTubePlanStep>()],
                Ideas = [.. Objects(root, "ideas", 8).Select(o =>
                    AiOutputSanitizer.ToSafeLine(Text(o, "title"), 160) is { } title
                        ? new YouTubeVideoIdea
                        {
                            Title = title,
                            Why = AiOutputSanitizer.ToSafeLine(Text(o, "why"), 400),
                            Format = string.Equals(Text(o, "format")?.Trim(), "short", StringComparison.OrdinalIgnoreCase) ? "short" : "long"
                        }
                        : null).OfType<YouTubeVideoIdea>()]
            };
        }
        catch (JsonException)
        {
            return null;
        }
    }

    /// <summary>A report from the findings alone, for when no text model is on. Plainer, never invented.</summary>
    public static YouTubeChannelReport RuleReport(YouTubeChannelAnalysis analysis, YouTubeChannelInsights i, string? goal, DateTime now)
    {
        var report = new YouTubeChannelReport
        {
            Summary = i.PublicVideos == 0
                ? $"{analysis.ChannelTitle} has no public videos with numbers yet."
                : $"{analysis.ChannelTitle}: {i.PublicVideos} public videos analysed. A typical video gets about {N(i.MedianViewsPerDay)} views a day."
                  + (i.Top.Count > 0 ? $" The strongest recently is \"{i.Top[0].Video.Title}\"." : string.Empty),
            WhatWorks = [.. i.Findings.Where(f => f.Kind == "good").Select(f => f.Text)],
            WhatToFix = [.. i.Findings.Where(f => f.Kind == "warn").Select(f => f.Text)],
            Goal = goal,
            By = "built-in",
            CreatedAtUtc = now
        };

        if (i.Top.Count > 0)
        {
            var best = i.Top[0].Video;
            report.Suggestions.Add(new() { Title = "Follow up your best video", Priority = "high", Detail = $"Make a second part or a sequel to \"{best.Title}\", and link the two with an end screen and a pinned comment." });
            report.Ideas.Add(new() { Title = $"{best.Title} - Part 2", Why = "It builds on the video that is already doing best.", Format = i.Top[0].IsShort ? "short" : "long" });
        }
        if (i.Shorts == 0 || (i.ShortsMedianViewsPerDay ?? 0) >= (i.LongMedianViewsPerDay ?? double.MaxValue))
            report.Suggestions.Add(new() { Title = "Cut a Short from each story", Priority = "medium", Detail = "Take the most surprising 30-45 seconds, vertical, with the question it raises as the first line." });
        if (i.DaysSinceLastUpload is > 7 || i.DaysBetweenUploads is > 7)
            report.Suggestions.Add(new() { Title = "Keep a weekly rhythm", Priority = "high", Detail = "Schedule the next videos ahead, on the same day each week." + (i.BestWeekday is { } d ? $" {d} has done best so far." : string.Empty) });
        report.Suggestions.Add(new() { Title = "Check retention in YouTube Studio", Priority = "medium", Detail = "Open Analytics > Engagement for your last three videos and see where viewers leave. Make the first 15 seconds tighter if most leave early." });

        report.Plan =
        [
            new() { When = "Day 1", Action = report.Ideas.Count > 0 ? $"Write and make \"{report.Ideas[0].Title}\"." : "Make the next story." },
            i.Rhythm is { } rhythm
                ? new() { When = $"Day {1 + (int)Math.Ceiling(rhythm.RecommendedGapDays)}", Action = $"Publish it, leaving about {N(rhythm.RecommendedGapDays)} days after the last upload. {rhythm.Reason}" }
                : new() { When = "Day 3", Action = "Cut a Short from it and schedule both, the Short a day earlier." },
            new() { When = "Week 2", Action = "Come back here, refresh the numbers, and compare the new videos with the median." }
        ];
        return report;
    }

    private static string? Text(JsonElement element, string name) =>
        element.ValueKind == JsonValueKind.Object && element.TryGetProperty(name, out var value) && value.ValueKind == JsonValueKind.String
            ? value.GetString()
            : null;

    private static List<string> Strings(JsonElement root, string name, int max, int maxChars) =>
        root.TryGetProperty(name, out var list) && list.ValueKind == JsonValueKind.Array
            ? [.. list.EnumerateArray()
                .Where(e => e.ValueKind == JsonValueKind.String)
                .Select(e => AiOutputSanitizer.ToSafeText(e.GetString(), maxChars))
                .OfType<string>()
                .Take(max)]
            : [];

    private static IEnumerable<JsonElement> Objects(JsonElement root, string name, int max) =>
        root.TryGetProperty(name, out var list) && list.ValueKind == JsonValueKind.Array
            ? list.EnumerateArray().Where(e => e.ValueKind == JsonValueKind.Object).Take(max).ToList()
            : [];
}
