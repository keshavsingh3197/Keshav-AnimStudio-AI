namespace AnimStudio.Application.Security;

/// <summary>
/// Fine-grained permission evaluator for AnimStudio AI.
/// Governs anonymous quotas, standard member feature grants, and administrator overrides.
/// </summary>
public interface IStudioAccessEvaluator
{
    /// <summary>Whether the current user has access to a specific permission key (e.g. site.studio.create).</summary>
    bool HasPermission(ICurrentUser user, string permissionKey);

    /// <summary>Whether a specific feature (e.g. youtube-publish, camera-studio) is accessible for this user tier.</summary>
    bool CanAccessFeature(ICurrentUser user, string featureKey);

    /// <summary>Evaluates whether a render request is within permitted duration and tier quotas.</summary>
    (bool Allowed, string? Reason) CheckRenderQuota(ICurrentUser user, double requestedDurationSeconds);

    /// <summary>Evaluates whether an AI execution request is permitted under this user tier's quota.</summary>
    (bool Allowed, string? Reason) CheckAiQuota(ICurrentUser user);
}

