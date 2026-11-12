namespace AnimStudio.Domain.Publishing;

/// <summary>
/// What was last read from YouTube about one connected channel, and the advice made from it. Kept so the analysis page opens
/// without calling YouTube or a text model; both are asked again only when the person refreshes, and not more often than
/// the numbers can usefully change.
/// </summary>
public sealed class YouTubeChannelAnalysis
{
    /// <summary><c>yca_{guid}</c>. A person has at most one per channel; it is found by <see cref="UserId"/> and <see cref="ChannelId"/>.</summary>
    public string Id { get; set; } = string.Empty;

    public string UserId { get; set; } = string.Empty;
    public string ChannelId { get; set; } = string.Empty;
    public string ChannelTitle { get; set; } = string.Empty;

    /// <summary>Null when the owner hides the count, or it could not be read.</summary>
    public long? Subscribers { get; set; }

    public long? TotalViews { get; set; }
    public long? TotalVideos { get; set; }

    /// <summary>The channel's newest uploads with their counters, newest first.</summary>
    public List<YouTubeAnalyzedVideo> Videos { get; set; } = [];

    /// <summary>When the numbers were read from YouTube.</summary>
    public DateTime FetchedAtUtc { get; set; }

    /// <summary>Why the last read failed, in words safe to show; null when it worked.</summary>
    public string? FetchError { get; set; }

    public YouTubeChannelReport? Report { get; set; }

    /// <summary>When the YouTube Analytics numbers were last read; null when they never were (no permission, or not set up).</summary>
    public DateTime? AnalyticsFetchedAtUtc { get; set; }

    /// <summary>Why the Analytics numbers could not be read, in words safe to show; null when they were, or were not tried.</summary>
    public string? AnalyticsError { get; set; }

    /// <summary>The channel day by day over the last weeks, oldest first: views and subscribers won and lost.</summary>
    public List<YouTubeDailyPoint> Daily { get; set; } = [];

    /// <summary>Videos looked up by link, newest lookup first, at most a few dozen. Any channel's video can be looked up.</summary>
    public List<YouTubeVideoLookup> Lookups { get; set; } = [];

    public DateTime UpdatedAtUtc { get; set; }
}

/// <summary>One day of a channel's or a video's YouTube Analytics numbers.</summary>
public sealed class YouTubeDailyPoint
{
    /// <summary>The day, at midnight UTC (YouTube reports days in the channel's own time zone).</summary>
    public DateTime Day { get; set; }

    public long Views { get; set; }
    public double WatchMinutes { get; set; }
    public long SubscribersGained { get; set; }
    public long SubscribersLost { get; set; }
}

/// <summary>A video looked up by its link: its public counters, and for one of this channel's own videos, how it did day by day.</summary>
public sealed class YouTubeVideoLookup
{
    public string VideoId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? ChannelId { get; set; }

    /// <summary>The video is on the analysed channel, so YouTube Analytics can describe it.</summary>
    public bool Own { get; set; }

    public DateTime? PublishedAtUtc { get; set; }
    public double? DurationSeconds { get; set; }
    public string? Privacy { get; set; }
    public string? ThumbnailUrl { get; set; }
    public long? Views { get; set; }
    public long? Likes { get; set; }
    public long? Comments { get; set; }
    public List<string> Tags { get; set; } = [];

    /// <summary>Lifetime Analytics totals; null for another channel's video or without permission.</summary>
    public YouTubeVideoAnalytics? Analytics { get; set; }

    /// <summary>Day by day since it went up (the last year at most), oldest first. Empty without Analytics.</summary>
    public List<YouTubeDailyPoint> Daily { get; set; } = [];

    /// <summary>Why the Analytics part is missing, in words safe to show.</summary>
    public string? AnalyticsNote { get; set; }

    public DateTime LookedUpAtUtc { get; set; }
}

/// <summary>What YouTube Analytics says about one video over its life. Only the channel's owner can read these.</summary>
public sealed class YouTubeVideoAnalytics
{
    public double WatchMinutes { get; set; }

    /// <summary>The average time a view lasted.</summary>
    public double AverageViewSeconds { get; set; }

    /// <summary>The average share of the video a view watched, 0-100+ (rewatches can push a Short past 100).</summary>
    public double AverageViewPercent { get; set; }

    public long SubscribersGained { get; set; }
    public long SubscribersLost { get; set; }
    public long Shares { get; set; }
}

/// <summary>One upload as the analysis sees it: what it is, and how it has done.</summary>
public sealed class YouTubeAnalyzedVideo
{
    public string VideoId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public DateTime? PublishedAtUtc { get; set; }
    public double? DurationSeconds { get; set; }

    /// <summary><c>public</c>, <c>unlisted</c> or <c>private</c>. Only public videos count towards what works.</summary>
    public string? Privacy { get; set; }

    public long? Views { get; set; }
    public long? Likes { get; set; }
    public long? Comments { get; set; }
    public string? ThumbnailUrl { get; set; }

    /// <summary>The first few tags, enough to see what a video was aimed at.</summary>
    public List<string> Tags { get; set; } = [];

    /// <summary>Lifetime YouTube Analytics totals; null until they are read (they need the analytics permission).</summary>
    public YouTubeVideoAnalytics? Analytics { get; set; }
}

/// <summary>The advice: from a text model when one is on, otherwise worked out from the numbers by fixed rules.</summary>
public sealed class YouTubeChannelReport
{
    public string Summary { get; set; } = string.Empty;
    public List<string> WhatWorks { get; set; } = [];
    public List<string> WhatToFix { get; set; } = [];
    public List<YouTubeSuggestion> Suggestions { get; set; } = [];
    public List<YouTubePlanStep> Plan { get; set; } = [];
    public List<YouTubeVideoIdea> Ideas { get; set; } = [];

    /// <summary>The text engine that wrote it, or <c>built-in</c>.</summary>
    public string By { get; set; } = "built-in";

    /// <summary>The goal the person gave, if any.</summary>
    public string? Goal { get; set; }

    /// <summary>
    /// A digest of the numbers and the goal it was written from. While they are unchanged the same report is shown, so
    /// asking again does not cost a model call.
    /// </summary>
    public string DataFingerprint { get; set; } = string.Empty;

    public DateTime CreatedAtUtc { get; set; }
}

public sealed class YouTubeSuggestion
{
    public string Title { get; set; } = string.Empty;
    public string? Detail { get; set; }

    /// <summary><c>high</c>, <c>medium</c> or <c>low</c>.</summary>
    public string Priority { get; set; } = "medium";
}

public sealed class YouTubePlanStep
{
    public string? When { get; set; }
    public string Action { get; set; } = string.Empty;
}

public sealed class YouTubeVideoIdea
{
    public string Title { get; set; } = string.Empty;
    public string? Why { get; set; }

    /// <summary><c>short</c> or <c>long</c>.</summary>
    public string Format { get; set; } = "long";
}
