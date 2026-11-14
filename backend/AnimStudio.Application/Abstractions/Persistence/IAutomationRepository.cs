using AnimStudio.Domain.Automation;

namespace AnimStudio.Application.Abstractions.Persistence;

public interface IAutomationRepository
{
    Task<IReadOnlyList<AutomationRule>> ListRulesAsync(string userId, CancellationToken ct);
    Task<IReadOnlyList<AutomationRule>> ListAllEnabledRulesAsync(int limit, CancellationToken ct);
    Task<AutomationRule?> GetRuleAsync(string id, CancellationToken ct);
    Task UpsertRuleAsync(AutomationRule rule, CancellationToken ct);
    Task<bool> DeleteRuleAsync(string id, CancellationToken ct);

    Task<IReadOnlyList<AutomationPost>> ListPostsAsync(
        string userId,
        string? fromDateKey,
        string? toDateKey,
        AutomationPostStatus? status,
        int limit,
        CancellationToken ct);

    Task<IReadOnlyList<AutomationPost>> ListPostsByStatusesAsync(
        IReadOnlyList<AutomationPostStatus> statuses,
        int limit,
        CancellationToken ct);

    Task<AutomationPost?> GetPostAsync(string id, CancellationToken ct);
    Task<AutomationPost?> FindPostByFingerprintAsync(string userId, string fingerprint, CancellationToken ct);
    Task UpsertPostAsync(AutomationPost post, CancellationToken ct);
    Task<bool> DeletePostAsync(string id, CancellationToken ct);
}
