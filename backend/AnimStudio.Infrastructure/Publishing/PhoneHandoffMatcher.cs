using AnimStudio.Domain.Publishing;

namespace AnimStudio.Infrastructure.Publishing;

/// <summary>A channel video offered as the phone upload; <see cref="Likely"/> when its length matches the render.</summary>
public sealed record PhoneUploadCandidate(YouTubeChannelVideo Video, bool Likely);

/// <summary>
/// Decides which of a channel's newest uploads is the one made from the phone for a handoff.
/// Deliberately cautious: details are only applied on their own when exactly one new video
/// has the render's length and no other waiting handoff could claim it. Anything less certain
/// is offered to the user to pick.
/// </summary>
public static class PhoneHandoffMatcher
{
    /// <summary>
    /// A Short gets re-encoded by the YouTube app, which can shift its length by a few frames;
    /// trimming it on the phone changes it by more, and then only the user can tell.
    /// </summary>
    public const double DurationToleranceSeconds = 1.5;

    /// <summary>Clock differences between this server and YouTube.</summary>
    private static readonly TimeSpan Slack = TimeSpan.FromMinutes(2);

    /// <summary>
    /// Videos published after the handoff was sent and not already accounted for, likely ones
    /// first, each group newest first.
    /// </summary>
    /// <param name="known">Video ids already uploaded from the app or claimed by another handoff.</param>
    public static IReadOnlyList<PhoneUploadCandidate> Candidates(
        PhoneHandoff handoff, IEnumerable<YouTubeChannelVideo> recent, IReadOnlySet<string> known)
    {
        var since = (handoff.SentAt ?? handoff.CreatedAt) - Slack;
        return [.. recent
            .Where(v => !known.Contains(v.VideoId) && (v.PublishedAt is null || v.PublishedAt >= since))
            .Select(v => new PhoneUploadCandidate(v, IsLikely(handoff, v)))
            .OrderByDescending(c => c.Likely)
            .ThenByDescending(c => c.Video.PublishedAt ?? DateTime.MaxValue)];
    }

    /// <summary>
    /// The one video to apply <paramref name="handoff"/>'s details to without asking, or null
    /// when that isn't certain.
    /// </summary>
    /// <param name="others">Other handoffs waiting on the same channel; a video that fits one of them too is left to the user.</param>
    public static string? AutoPick(PhoneHandoff handoff, IReadOnlyList<PhoneUploadCandidate> candidates, IEnumerable<PhoneHandoff> others)
    {
        var likely = candidates.Where(c => c.Likely).ToList();
        if (likely.Count != 1) return null;

        var video = likely[0].Video;
        return others.Any(o => o.Id != handoff.Id && IsLikely(o, video)) ? null : video.VideoId;
    }

    private static bool IsLikely(PhoneHandoff handoff, YouTubeChannelVideo video) =>
        handoff.DurationSeconds is { } expected && video.DurationSeconds is { } actual
        && Math.Abs(expected - actual) <= DurationToleranceSeconds;
}
