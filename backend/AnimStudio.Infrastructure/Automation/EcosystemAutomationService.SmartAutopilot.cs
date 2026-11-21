using AnimStudio.Application.Automation;
using AnimStudio.Application.Publishing;
using AnimStudio.Domain.Automation;
using Microsoft.Extensions.Logging;

namespace AnimStudio.Infrastructure.Automation;

public sealed partial class EcosystemAutomationService
{
    /// <summary>
    /// Publishes a full-autopilot card that has a finished video. With
    /// <see cref="AutomationWorkspaceConfig.AutopilotReleaseAtPeakTime"/> on it first fills any missing title, tags,
    /// description and thumbnail (policy-sanitized), then uploads the video <b>private</b> right away and has YouTube
    /// release it at the next peak slot in the content's window; otherwise, or when no slot fits, it publishes now.
    /// </summary>
    private async Task PublishAutopilotPostAsync(AutomationPost post, AutomationWorkspaceConfig settings, CancellationToken ct)
    {
        if (!settings.AutopilotReleaseAtPeakTime || post.ScheduledAtUtc.HasValue)
        {
            await ExecutePublishAsync(post.UserId, post, publishNow: true, scheduledAtUtc: null, ct).ConfigureAwait(false);
            return;
        }

        try
        {
            post = await AutoFillMissingDetailsAsync(post.UserId, post.Id, ct).ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            // Missing SEO isn't worth blocking a release over; the upload path still validates the metadata.
            logger.LogInformation(ex, "Autopilot could not auto-fill details for post {PostId}; publishing with what it has", post.Id);
        }

        DateTime? releaseAt = null;
        try
        {
            var advice = await GetPublishAdviceAsync(post.UserId, post.SourceType, post.Format, post.TargetChannelId,
                settings.DefaultTimeZone, ct).ConfigureAwait(false);
            var tz = PublishSlotSuggester.ResolveTimeZone(settings.DefaultTimeZone);
            // A little more than YouTube's minimum, so processing a long upload can't make the release time stale.
            releaseAt = AutomationPublishAdvisor.PickAutopilotReleaseUtc(advice, post.SourceType, post.DateKey, tz, UtcNow,
                PublishQueueRules.MinYouTubeReleaseLead + TimeSpan.FromMinutes(10));
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogInformation(ex, "Autopilot could not compute a peak slot for post {PostId}; publishing now", post.Id);
        }

        if (releaseAt is { } at)
        {
            logger.LogInformation("Autopilot: uploading post {PostId} private now, YouTube releases it at {ReleaseAtUtc:o}", post.Id, at);
            await ExecutePublishAsync(post.UserId, post, publishNow: false, scheduledAtUtc: at, ct, scheduleOnYouTube: true)
                .ConfigureAwait(false);
        }
        else
        {
            await ExecutePublishAsync(post.UserId, post, publishNow: true, scheduledAtUtc: null, ct).ConfigureAwait(false);
        }
    }

    private async Task<bool> IsFullAutopilotPostAsync(AutomationPost post, AutomationWorkspaceConfig settings, CancellationToken ct)
    {
        if (!settings.GlobalAutopilotEnabled || string.IsNullOrWhiteSpace(post.RuleId)) return false;
        var rule = await repository.GetRuleAsync(post.RuleId, ct).ConfigureAwait(false);
        return rule?.Mode == AutomationPostMode.FullAutopilot;
    }
}
