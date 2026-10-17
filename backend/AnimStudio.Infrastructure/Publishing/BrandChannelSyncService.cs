using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Admin;
using AnimStudio.Application.Publishing;
using AnimStudio.Domain.Ai;

namespace AnimStudio.Infrastructure.Publishing;

/// <summary>
/// Applies <see cref="BrandChannelYouTubeSync"/> to the stored settings and audits what it
/// changed. Brand channels are studio-wide, so callers only use this for an admin.
/// </summary>
public sealed class BrandChannelSyncService(IAiSettingsRepository settingsRepo, AdminAuditService audit)
{
    public async Task<BrandChannelSyncResult> SyncAsync(
        IEnumerable<YouTubeConnectionStatus> connections, bool createMissing, string? remoteAddress, CancellationToken ct)
    {
        var settings = await settingsRepo.GetAsync(ct) ?? new AiSettings();
        var result = BrandChannelYouTubeSync.Apply(
            settings,
            connections.Select(YouTubeConnectionStore.ToIdentity),
            createMissing,
            () => MongoDB.Bson.ObjectId.GenerateNewId().ToString());

        if (!result.Changed) return result;
        await settingsRepo.SaveAsync(settings, ct).ConfigureAwait(false);

        foreach (var created in result.Created)
        {
            await audit.RecordAsync("branding.channel-created", $"global-branding:{created.Id}", null,
                $"{created.Name} (from YouTube {created.Publishing?.YouTubeChannelId})", remoteAddress, ct).ConfigureAwait(false);
        }
        foreach (var renamed in result.Renamed)
        {
            await audit.RecordAsync("branding.channel-renamed",
                renamed.BrandChannelId == Domain.Rendering.BrandChannel.DefaultId ? "global-branding" : $"global-branding:{renamed.BrandChannelId}",
                renamed.Before, $"{renamed.After} (from YouTube)", remoteAddress, ct).ConfigureAwait(false);
        }

        return result;
    }
}
