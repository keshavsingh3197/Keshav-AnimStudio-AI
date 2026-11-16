using AnimStudio.Application.Planning;
using AnimStudio.Domain.Publishing;

namespace AnimStudio.Application.Publishing;

/// <summary>
/// The publishing board's timing and retry rules, kept free of I/O so they can be tested on
/// their own: when an upload starts, which failures are worth another try and how long to
/// wait, and what an item may still be changed in each state.
/// </summary>
public static class PublishQueueRules
{
    public const int MaxNotesLength = 500;

    /// <summary>Items still waiting, held or uploading; finished ones don't count.</summary>
    public const int MaxOpenItemsPerUser = 500;

    public const int MaxBulk = 50;
    public const int MaxAttempts = 3;

    /// <summary>A time this far in the past is still read as "now" (the form was open a while).</summary>
    public static readonly TimeSpan PastTolerance = TimeSpan.FromMinutes(5);

    public static readonly TimeSpan MaxAhead = YouTubePublishValidator.MaxScheduleAhead;

    /// <summary>
    /// How long before the scheduled time a <see cref="PublishQueueMode.ReleaseOnYouTube"/> upload starts,
    /// so it is uploaded and processed by the time YouTube makes it public.
    /// </summary>
    public static readonly TimeSpan DefaultReleaseLead = TimeSpan.FromHours(2);

    /// <summary>
    /// Under this much time left, YouTube's publishAt is refused (<see cref="ContentPlanRules.MinScheduleLead"/>),
    /// with a little room for the upload to be accepted.
    /// </summary>
    public static readonly TimeSpan MinYouTubeReleaseLead = ContentPlanRules.MinScheduleLead + TimeSpan.FromMinutes(5);

    private static readonly TimeSpan[] RetryDelays = [TimeSpan.FromMinutes(5), TimeSpan.FromMinutes(15), TimeSpan.FromMinutes(45)];

    /// <summary>
    /// Failures that are about the moment, not the item: worth trying again later.
    /// <para>
    /// "queue-upload-lost" is deliberately NOT here: an upload whose process went away may already be on
    /// YouTube (it can finish sending before its record is saved), so retrying it automatically is how the same
    /// video ends up on a channel several times. It fails, and the owner checks YouTube Studio before trying
    /// again. "queue-upload-not-started" (claimed, but nothing was sent) is safe to retry.
    /// </para>
    /// </summary>
    private static readonly HashSet<string> TransientCodes = new(StringComparer.Ordinal)
    {
        "youtube-unreachable",
        "youtube-busy",
        "youtube-upload-failed",
        "queue-upload-not-started",
    };

    /// <summary>
    /// An upload held by another server process is only declared lost once that process has not reported it
    /// running for this long (its scheduler refreshes the heartbeat every round).
    /// </summary>
    public static readonly TimeSpan UploadHeartbeatTimeout = TimeSpan.FromMinutes(10);

    /// <summary>How often the owning process refreshes an upload's heartbeat.</summary>
    public static readonly TimeSpan UploadHeartbeatEvery = TimeSpan.FromMinutes(1);

    /// <summary>
    /// True when an upload this process can't see should be treated as lost: it belongs to this process
    /// (so it really is gone), or its owner stopped reporting it.
    /// </summary>
    public static bool IsUploadLost(string? uploadHost, string thisHost, DateTime? heartbeatAt, DateTime? startedAt, DateTime nowUtc)
    {
        if (string.Equals(uploadHost, thisHost, StringComparison.Ordinal)) return true;
        var lastSeen = heartbeatAt ?? startedAt;
        return lastSeen is null || nowUtc - lastSeen.Value > UploadHeartbeatTimeout;
    }

    /// <summary>Busy right now: put back without spending an attempt.</summary>
    public static bool IsBusy(string? code) => code is "youtube-too-many-uploads" or "youtube-busy";

    public static bool IsTransient(string? code) => code is not null && TransientCodes.Contains(code);

    /// <summary>The wait before attempt <paramref name="attemptsSoFar"/> + 1.</summary>
    public static TimeSpan RetryDelay(int attemptsSoFar) =>
        RetryDelays[Math.Clamp(attemptsSoFar - 1, 0, RetryDelays.Length - 1)];

    public static bool ShouldRetry(string? code, int attemptsSoFar) =>
        IsTransient(code) && attemptsSoFar < MaxAttempts;

    /// <summary>Only a public video can be released by YouTube; anything else goes up at the time.</summary>
    public static PublishQueueMode EffectiveMode(PublishQueueMode mode, string privacy) =>
        mode == PublishQueueMode.ReleaseOnYouTube && string.Equals(privacy, "public", StringComparison.Ordinal)
            ? PublishQueueMode.ReleaseOnYouTube
            : PublishQueueMode.UploadAtTime;

    /// <summary>When the scheduler should start the upload; null for an item it must leave alone.</summary>
    public static DateTime? DueAt(PublishQueueState state, DateTime? scheduledAt, PublishQueueMode mode, string privacy, TimeSpan releaseLead)
    {
        if (state != PublishQueueState.Waiting || scheduledAt is not { } at) return null;
        return EffectiveMode(mode, privacy) == PublishQueueMode.ReleaseOnYouTube ? at - releaseLead : at;
    }

    /// <summary>
    /// The publishAt to send when the upload starts at <paramref name="nowUtc"/>: the scheduled time when YouTube
    /// can still honour it, otherwise null (it goes up with its own visibility straight away).
    /// </summary>
    public static DateTime? YouTubeReleaseAt(PublishQueueMode mode, string privacy, DateTime? scheduledAt, DateTime nowUtc) =>
        EffectiveMode(mode, privacy) == PublishQueueMode.ReleaseOnYouTube
        && scheduledAt is { } at && at - nowUtc >= MinYouTubeReleaseLead
            ? at
            : null;

    /// <summary>A time the owner picked, read as UTC; a moment ago becomes now. Null and a reason when it can't be used.</summary>
    public static (DateTime? At, string? Error) CheckSchedule(DateTime? requested, DateTime nowUtc)
    {
        if (requested is not { } raw) return (null, "Pick when it should go out.");

        var at = raw.Kind switch
        {
            DateTimeKind.Utc => raw,
            DateTimeKind.Local => raw.ToUniversalTime(),
            _ => DateTime.SpecifyKind(raw, DateTimeKind.Utc)
        };

        if (at < nowUtc - PastTolerance) return (null, "That time has passed. Pick a time from now on.");
        if (at - nowUtc > MaxAhead) return (null, "Schedule at most a year ahead.");
        return (at < nowUtc ? nowUtc : at, null);
    }

    /// <summary>The details, the time and the channel can change until the upload starts, and again after it fails.</summary>
    public static bool CanEdit(PublishQueueState state) =>
        state is PublishQueueState.Waiting or PublishQueueState.Held or PublishQueueState.Failed or PublishQueueState.Cancelled;

    public static bool IsOpen(PublishQueueState state) =>
        state is PublishQueueState.Waiting or PublishQueueState.Held or PublishQueueState.Uploading;

    /// <summary>
    /// Spreads <paramref name="count"/> items from <paramref name="start"/>, <paramref name="every"/> apart.
    /// Used for a bulk add with a fixed interval.
    /// </summary>
    public static IReadOnlyList<DateTime> Spread(DateTime start, TimeSpan every, int count) =>
        [.. Enumerable.Range(0, Math.Max(0, count)).Select(i => start + every * i)];
}
