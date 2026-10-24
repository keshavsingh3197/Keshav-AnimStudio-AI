using AnimStudio.Application.Options;
using AnimStudio.Application.Security;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AnimStudio.Infrastructure.Security;

public sealed class StudioAccessEvaluator(
    IOptionsMonitor<AdminOptions> options,
    ILogger<StudioAccessEvaluator> logger) : IStudioAccessEvaluator
{
    public bool HasPermission(ICurrentUser user, string permissionKey)
    {
        if (user.IsAdmin) return true;

        var policy = options.CurrentValue.AnonymousPolicy;

        if (!user.IsAuthenticated)
        {
            if (!policy.Enabled) return false;

            return permissionKey switch
            {
                "site.view" or "studio.view" => true,
                "site.studio.create" or "studio.create" => policy.AllowCloudSave,
                "site.studio.render" or "studio.render" => policy.AllowRender,
                "site.studio.publish" or "studio.publish" => policy.AllowYouTubePublish,
                "site.studio.admin" or "studio.admin" => false,
                _ => false
            };
        }

        // Authenticated users with StudioUser/Editor/Admin role have standard studio permissions
        return permissionKey switch
        {
            "site.studio.admin" or "studio.admin" => user.IsAdmin,
            _ => true
        };
    }

    public bool CanAccessFeature(ICurrentUser user, string featureKey)
    {
        if (user.IsAdmin) return true;

        if (!user.IsAuthenticated)
        {
            var policy = options.CurrentValue.AnonymousPolicy;
            if (!policy.Enabled) return false;

            if (string.Equals(featureKey, "youtube", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(featureKey, "youtube-publish", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(featureKey, "phone-handoff", StringComparison.OrdinalIgnoreCase))
            {
                return policy.AllowYouTubePublish;
            }

            return policy.AllowedFeatures.Any(f => string.Equals(f, featureKey, StringComparison.OrdinalIgnoreCase));
        }

        return true;
    }

    public (bool Allowed, string? Reason) CheckRenderQuota(ICurrentUser user, double requestedDurationSeconds)
    {
        if (user.IsAdmin) return (true, null);

        if (!user.IsAuthenticated)
        {
            var policy = options.CurrentValue.AnonymousPolicy;
            if (!policy.Enabled)
                return (false, "Anonymous access is currently disabled on this server. Please sign in.");

            if (!policy.AllowRender)
                return (false, "Video rendering requires an account. Please sign in or register to export videos.");

            if (requestedDurationSeconds > policy.MaxRenderDurationSeconds)
            {
                return (false,
                    $"Guest preview renders are limited to {policy.MaxRenderDurationSeconds} seconds. " +
                    "Please sign in or register for full-length project exports.");
            }
        }

        return (true, null);
    }

    public (bool Allowed, string? Reason) CheckAiQuota(ICurrentUser user)
    {
        if (user.IsAdmin) return (true, null);

        if (!user.IsAuthenticated)
        {
            var policy = options.CurrentValue.AnonymousPolicy;
            if (!policy.Enabled)
                return (false, "Anonymous access is disabled. Please sign in.");

            if (policy.MaxAiCallsPerDay <= 0)
                return (false, "AI generation features require an account. Please sign in or register.");
        }

        return (true, null);
    }
}

