using AnimStudio.Api.Common;
using AnimStudio.Api.Contracts;
using AnimStudio.Api.Security;
using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Abstractions.Diagnostics;
using AnimStudio.Application.Admin;
using AnimStudio.Application.Ai;
using AnimStudio.Application.Options;
using AnimStudio.Application.Security;
using AnimStudio.Application.Uploads;
using AnimStudio.Domain.Ai;
using AnimStudio.Domain.Assets;
using AnimStudio.Domain.Rendering;
using AnimStudio.Infrastructure.Persistence.SqlServer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using AppObjectStore = AnimStudio.Application.Abstractions.Storage.IObjectStore;

namespace AnimStudio.Api.Controllers;

/// <summary>
/// Running the server: which AI providers exist, whether they work, what they have spent,
/// what the machine has installed, and what the render queue is doing.
/// </summary>
/// <remarks>
/// <para>
/// Every action here is behind <see cref="AdminAccess.Policy"/>, which is default deny -
/// the policy admits a caller only in a mode that has been explicitly configured, and
/// refuses in every other case including a mode nobody has written a rule for. The
/// attribute is on the class so a new action cannot be added unguarded by omission.
/// </para>
/// <para>
/// The one thing this controller will not do is hand back a key. A key can be installed,
/// rotated and removed; it can never be read, and no response shape here has a field it
/// could be returned in.
/// </para>
/// </remarks>
[ApiController]
[Authorize(Policy = AdminAccess.Policy)]
[Route("api/admin")]
public sealed class AdminController(
    IEnumerable<IAiProvider> providers,
    IAiProviderRegistry registry,
    IAiSettingsStore settings,
    IAiCredentialStore credentials,
    IAiQuotaGuard quota,
    IAiUsageRepository usage,
    IAiSecretResolver secrets,
    ISystemHealthService health,
    IRenderJobRepository jobs,
    IProjectRepository projects,
    AdminAuditService audit,
    ICurrentUser currentUser,
    IOptionsMonitor<AiOptions> aiOptions,
    IConfiguration configuration,
    IAiSettingsRepository aiSettingsRepo,
    IAssetRepository assets,
    AppObjectStore store,
    AnimStudio.Application.Abstractions.Storage.IStorageUsageService storageUsage,
    TimeProvider clock) : ControllerBase
{
    // --- storage -------------------------------------------------------------------------

    [HttpGet("storage")]
    public async Task<ActionResult<ApiResponse<StorageDetailResponse>>> GetStorage(
        [FromQuery] bool refresh, CancellationToken ct)
    {
        var stored = await aiSettingsRepo.GetAsync(ct);
        var usage = await storageUsage.GetAsync(refresh, ct);
        return Ok(ApiResponse<StorageDetailResponse>.Ok(usage.ToDetail(stored?.StorageQuotaGb)));
    }

    [HttpPut("storage")]
    public async Task<ActionResult<ApiResponse<StorageDetailResponse>>> UpdateStorageQuota(
        [FromBody] UpdateStorageQuotaRequest request, CancellationToken ct)
    {
        var stored = await aiSettingsRepo.GetAsync(ct) ?? new AiSettings();
        var before = stored.StorageQuotaGb;
        stored.StorageQuotaGb = request.QuotaGb;
        stored.UpdatedAt = DateTime.UtcNow;
        await aiSettingsRepo.SaveAsync(stored, ct);

        await audit.RecordAsync(
            "storage.quota.updated", "storage",
            before?.ToString(System.Globalization.CultureInfo.InvariantCulture) ?? "none",
            request.QuotaGb?.ToString(System.Globalization.CultureInfo.InvariantCulture) ?? "none",
            RemoteAddress(), ct);

        var usage = await storageUsage.GetAsync(refresh: false, ct);
        return Ok(ApiResponse<StorageDetailResponse>.Ok(usage.ToDetail(stored.StorageQuotaGb)));
    }

    /// <summary>A fortnight reads well on one screen and covers a free tier's reset cycle.</summary>
    private const int DefaultUsageDays = 14;
    private const int MaxUsageDays = 92;

    private const int DefaultJobLimit = 40;
    private const int DefaultAuditLimit = 50;

    // --- providers -----------------------------------------------------------------------

    [HttpGet("providers")]
    public async Task<ActionResult<ApiResponse<AdminProvidersResponse>>> Providers(
        CancellationToken ct)
    {
        var stored = await settings.GetAsync(ct);
        var options = aiOptions.CurrentValue;
        var keys = await credentials.DescribeAllAsync(ct);

        var rows = new List<AdminProviderResponse>();

        foreach (var provider in providers.OrderBy(p => p.Capability).ThenBy(p => p.Id.Value))
        {
            var descriptor = KnownAiProviders.Find(provider.Id.Value);
            var configured = options.ProviderFor(provider.Id);
            var key = keys.FirstOrDefault(k =>
                string.Equals(k.ProviderId, provider.Id.Value, StringComparison.OrdinalIgnoreCase))
                ?? AiCredentialStatus.NotConfigured(provider.Id.Value);

            var chain = options.ChainFor(provider.Capability);
            var position = chain
                .Select((id, index) => (id, index))
                .Where(entry => string.Equals(entry.id, provider.Id.Value, StringComparison.OrdinalIgnoreCase))
                .Select(entry => (int?)entry.index)
                .FirstOrDefault();

            var enabled = configured?.Enabled ?? false;
            var (ready, reason) = Readiness(provider, enabled);

            // Only asked for a provider that could actually spend it. A quota check is a
            // database count, and this endpoint already walks every provider.
            long? remaining = null;
            if (ready)
            {
                var verdict = await quota.CheckAsync(provider.Id, ct);
                remaining = verdict.DailyRemaining;
                if (!verdict.Allowed) (ready, reason) = (false, nameof(AiUnavailableReason.QuotaExhausted));
            }

            var needsExecutable = descriptor?.Family
                is AiProviderFamily.PiperSpeech or AiProviderFamily.WhisperCppTranscription;

            rows.Add(new AdminProviderResponse(
                provider.Id.Value,
                descriptor?.DisplayName ?? provider.Id.Value,
                provider.Capability.ToString(),
                (descriptor?.Family ?? Family(configured)).ToString(),
                descriptor?.RunsLocally ?? configured?.IsLocal ?? false,
                descriptor?.RequiresApiKey ?? !(configured?.IsLocal ?? false),
                descriptor?.FreeTierNote ?? "Configured on this server.",
                descriptor?.KeyUrl,
                enabled,
                configured?.Model,
                configured?.BaseUrl,
                configured?.DailyRequestLimit,
                configured?.MonthlyRequestLimit,
                configured?.TimeoutSeconds,
                configured?.SupportsJsonMode ?? true,
                stored.For(provider.Id.Value) is not null,
                new AdminKeyResponse(
                    key.Configured, key.Source.ToString(), key.Masked,
                    key.Fingerprint, key.CreatedAt, key.RotatedAt),
                ready,
                reason,
                remaining,
                position,
                needsExecutable,
                !string.IsNullOrWhiteSpace(configured?.ExecutablePath),
                !string.IsNullOrWhiteSpace(configured?.VoicesPath)
                    || !string.IsNullOrWhiteSpace(configured?.ModelsPath),
                descriptor?.DefaultBaseUrl,
                descriptor?.DefaultModel));
        }

        var chains = Enum.GetValues<AiCapability>()
            .Select(capability => new AdminChainResponse(
                capability.ToString(),
                options.ChainFor(capability),
                stored.Chains.ContainsKey(capability.ToString()),
                [.. providers.Where(p => p.Capability == capability)
                    .Select(p => p.Id.Value)
                    .OrderBy(id => id, StringComparer.Ordinal)]))
            .ToList();

        return Ok(ApiResponse<AdminProvidersResponse>.Ok(new AdminProvidersResponse(
            rows,
            chains,
            options.HostAllowlist,
            !string.IsNullOrWhiteSpace(configuration["Encryption:DataKey"]))));
    }

    [HttpPut("providers/{providerId}")]
    public async Task<ActionResult<ApiResponse<AdminProvidersResponse>>> UpdateProvider(
        string providerId, [FromBody] UpdateAdminProviderRequest request, CancellationToken ct)
    {
        var id = Parse(providerId);
        var before = Describe(id);

        await settings.SaveProviderAsync(
            id,
            new AiProviderSettingsRequest(
                request.Enabled, request.Model, request.BaseUrl,
                request.DailyRequestLimit, request.MonthlyRequestLimit,
                request.TimeoutSeconds, request.SupportsJsonMode),
            currentUser.UserId,
            ct);

        await audit.RecordAsync(
            AdminAuditService.ProviderUpdated, id.Value, before, Describe(id), RemoteAddress(), ct);

        return await Providers(ct);
    }

    [HttpPost("providers/{providerId}/reset")]
    public async Task<ActionResult<ApiResponse<AdminProvidersResponse>>> ResetProvider(
        string providerId, CancellationToken ct)
    {
        var id = Parse(providerId);
        var before = Describe(id);

        await settings.ResetProviderAsync(id, currentUser.UserId, ct);

        await audit.RecordAsync(
            AdminAuditService.ProviderReset, id.Value, before,
            "back to appsettings.json", RemoteAddress(), ct);

        return await Providers(ct);
    }

    /// <summary>
    /// Installs or rotates a provider's API key.
    /// </summary>
    /// <remarks>
    /// The key is encrypted before it is stored and is never returned, never logged and
    /// never put in an error message. What comes back is the same provider list everything
    /// else returns, with the mask updated - so the console can prove the key landed
    /// without ever having held it.
    /// </remarks>
    [HttpPut("providers/{providerId}/key")]
    public async Task<ActionResult<ApiResponse<AdminProvidersResponse>>> SetKey(
        string providerId, [FromBody] SetProviderKeyRequest request, CancellationToken ct)
    {
        var id = Parse(providerId);

        if (string.IsNullOrWhiteSpace(request?.Key))
        {
            return BadRequest(ApiResponse<AdminProvidersResponse>.Fail(
                "Paste the provider's API key.",
                new ApiError("key-required", "Paste the provider's API key.")));
        }

        if (string.IsNullOrWhiteSpace(configuration["Encryption:DataKey"]))
        {
            const string message =
                "This server has no encryption key configured, so a provider key cannot be " +
                "stored safely. Set Encryption:DataKey through user-secrets or the " +
                "Encryption__DataKey environment variable, or supply the provider key as " +
                "Ai__Secrets__" + "<provider> instead.";

            return BadRequest(ApiResponse<AdminProvidersResponse>.Fail(
                message, new ApiError("encryption-not-configured", message)));
        }

        var status = await credentials.SetAsync(id, request.Key, currentUser.UserId, ct);

        // The fingerprint, never the key. It identifies which key was installed without
        // disclosing any of it, which is exactly what an audit trail needs.
        await audit.RecordAsync(
            AdminAuditService.KeyInstalled, id.Value, null,
            $"fingerprint {status.Fingerprint}", RemoteAddress(), ct);

        return await Providers(ct);
    }

    [HttpDelete("providers/{providerId}/key")]
    public async Task<ActionResult<ApiResponse<AdminProvidersResponse>>> DeleteKey(
        string providerId, CancellationToken ct)
    {
        var id = Parse(providerId);
        var before = await credentials.DescribeAsync(id, ct);

        var removed = await credentials.DeleteAsync(id, ct);

        if (removed)
        {
            await audit.RecordAsync(
                AdminAuditService.KeyRemoved, id.Value,
                $"fingerprint {before.Fingerprint}", "no key", RemoteAddress(), ct);
        }

        return await Providers(ct);
    }

    /// <summary>
    /// Asks the provider itself whether it is reachable and whether the key works.
    /// </summary>
    /// <remarks>
    /// A real call, because the only useful answer to "did that key save correctly" is one
    /// the provider gave. The reason that comes back is the provider's own health summary,
    /// which is already written to be shown to a person.
    /// </remarks>
    [HttpPost("providers/{providerId}/test")]
    public async Task<ActionResult<ApiResponse<AdminProviderTestResponse>>> TestProvider(
        string providerId, CancellationToken ct)
    {
        var id = Parse(providerId);

        var provider = providers.FirstOrDefault(p => p.Id == id)
            ?? throw new KeyNotFoundException();

        // Refreshes the cached "is a key installed" flag first, so testing straight after
        // pasting a key does not report the state from before the paste.
        secrets.Invalidate(id);

        var result = await provider.CheckHealthAsync(ct);

        await audit.RecordAsync(
            AdminAuditService.ProviderTested, id.Value, null,
            result.IsHealthy ? "reachable" : "not reachable", RemoteAddress(), ct);

        return Ok(ApiResponse<AdminProviderTestResponse>.Ok(
            new AdminProviderTestResponse(id.Value, result.IsHealthy, result.Reason)));
    }

    [HttpPut("chains/{capability}")]
    public async Task<ActionResult<ApiResponse<AdminProvidersResponse>>> SaveChain(
        string capability, [FromBody] SaveChainRequest request, CancellationToken ct)
    {
        if (!Enum.TryParse<AiCapability>(capability, ignoreCase: true, out var parsed))
            throw new KeyNotFoundException();

        var before = string.Join(" -> ", aiOptions.CurrentValue.ChainFor(parsed));

        await settings.SaveChainAsync(
            parsed, request?.ProviderIds ?? [], currentUser.UserId, ct);

        await audit.RecordAsync(
            AdminAuditService.ChainSaved, parsed.ToString(), before,
            string.Join(" -> ", aiOptions.CurrentValue.ChainFor(parsed)), RemoteAddress(), ct);

        return await Providers(ct);
    }

    // --- usage ---------------------------------------------------------------------------

    [HttpGet("usage")]
    public async Task<ActionResult<ApiResponse<AdminUsageResponse>>> Usage(
        [FromQuery] int days = DefaultUsageDays, CancellationToken ct = default)
    {
        var window = Math.Clamp(days, 1, MaxUsageDays);
        var today = clock.GetUtcNow().UtcDateTime;
        var from = AiUsageRecord.BucketFor(today.AddDays(-(window - 1)));
        var to = AiUsageRecord.BucketFor(today);

        var totals = await usage.SummarizeAsync(from, to, ct);

        return Ok(ApiResponse<AdminUsageResponse>.Ok(new AdminUsageResponse(
            from, to,
            [.. totals.Select(t => new AdminUsageRowResponse(
                t.DayBucket, t.ProviderId, t.Capability.ToString(),
                t.Requests, t.Units, t.CacheHits, t.Failures))])));
    }

    // --- health --------------------------------------------------------------------------

    [HttpGet("health")]
    public async Task<ActionResult<ApiResponse<AdminHealthResponse>>> Health(CancellationToken ct)
    {
        var report = await health.CheckAsync(ct);

        return Ok(ApiResponse<AdminHealthResponse>.Ok(new AdminHealthResponse(
            report.Healthy,
            report.CheckedAtUtc,
            [.. report.Probes.Select(p => new AdminHealthProbeResponse(
                p.Key, p.DisplayName, p.State.ToString(), p.Detail, p.Advice, p.Required))])));
    }

    // --- job console ---------------------------------------------------------------------

    [HttpGet("jobs")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<AdminJobResponse>>>> Jobs(
        [FromQuery] int limit = DefaultJobLimit, CancellationToken ct = default)
    {
        var recent = await jobs.ListRecentAsync(limit, ct);

        // One lookup per distinct project rather than per job: a queue of forty renders is
        // usually a handful of projects.
        var names = new Dictionary<string, string?>(StringComparer.Ordinal);

        foreach (var projectId in recent.Select(j => j.ProjectId).Distinct(StringComparer.Ordinal))
            names[projectId] = (await projects.GetAsync(projectId, ct))?.Name;

        return Ok(ApiResponse<IReadOnlyList<AdminJobResponse>>.Ok(
            [.. recent.Select(job => new AdminJobResponse(
                job.Id, job.ProjectId, names.GetValueOrDefault(job.ProjectId),
                job.Status.ToString(), job.Progress, job.Message, job.CurrentStage.ToString(),
                job.ScenesTotal, job.ScenesDone, job.Attempts,
                job.ErrorCode, job.ErrorMessage,
                job.OutputStorageKey is not null, job.IsTerminal,
                job.CreatedAt, job.CompletedAt))]));
    }

    [HttpPost("jobs/{jobId}/cancel")]
    public async Task<ActionResult<ApiResponse<EmptyPayload>>> CancelJob(
        string jobId, CancellationToken ct)
    {
        var job = await jobs.GetAsync(jobId, ct) ?? throw new KeyNotFoundException();

        if (job.IsTerminal)
        {
            return BadRequest(ApiResponse<EmptyPayload>.Fail(
                "That render has already finished.",
                new ApiError("job-already-finished", "That render has already finished.")));
        }

        await jobs.RequestCancelAsync(jobId, ct);

        await audit.RecordAsync(
            AdminAuditService.JobCancelled, jobId, job.Status.ToString(), "cancel requested",
            RemoteAddress(), ct);

        return Ok(ApiResponse<EmptyPayload>.Ok(EmptyPayload.Value));
    }

    [HttpPost("jobs/{jobId}/retry")]
    public async Task<ActionResult<ApiResponse<EmptyPayload>>> RetryJob(
        string jobId, CancellationToken ct)
    {
        var job = await jobs.GetAsync(jobId, ct) ?? throw new KeyNotFoundException();

        if (!await jobs.RequeueAsync(jobId, ct))
        {
            const string message = "Only a failed or cancelled render can be queued again.";

            return BadRequest(ApiResponse<EmptyPayload>.Fail(
                message, new ApiError("job-not-retryable", message)));
        }

        await audit.RecordAsync(
            AdminAuditService.JobRequeued, jobId, job.Status.ToString(), "queued again",
            RemoteAddress(), ct);

        return Ok(ApiResponse<EmptyPayload>.Ok(EmptyPayload.Value));
    }

    // --- audit ---------------------------------------------------------------------------

    [HttpGet("audit")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<AdminAuditResponse>>>> Audit(
        [FromQuery] int limit = DefaultAuditLimit, CancellationToken ct = default)
    {
        var entries = await audit.ListRecentAsync(limit, ct);

        return Ok(ApiResponse<IReadOnlyList<AdminAuditResponse>>.Ok(
            [.. entries.Select(e => new AdminAuditResponse(
                e.Action, e.Target, e.ActorUserId, e.RemoteAddress, e.Before, e.After, e.AtUtc))]));
    }

    // --- database migration --------------------------------------------------------------

    [HttpPost("migrate-to-sql")]
    public async Task<ActionResult<ApiResponse<MigrationReport>>> MigrateToSql(
        [FromServices] IServiceProvider sp,
        CancellationToken ct)
    {
        var migrator = sp.GetService<MongoToSqlServerMigrator>();
        if (migrator is null)
        {
            return BadRequest(ApiResponse<MigrationReport>.Fail(
                "Migration is only available when Database:Provider is 'SqlServer' and MongoDb connection is configured."));
        }

        var report = await migrator.MigrateAllAsync(ct);

        await audit.RecordAsync(
            "database.migrate_to_sql",
            "SqlServer",
            "MongoDB",
            report.Success ? $"Migrated {report.Details.Sum(d => d.MigratedCount)} records" : "Failed",
            RemoteAddress(),
            ct);

        if (!report.Success)
        {
            return StatusCode(500, ApiResponse<MigrationReport>.Fail(report.Message));
        }

        return Ok(ApiResponse<MigrationReport>.Ok(report));
    }

    // --- branding & hallmark -------------------------------------------------------------

    // --- brand channels: one look (watermark + end card) per YouTube channel --------------

    [HttpGet("branding/channels")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<BrandChannelResponse>>>> ListChannels(CancellationToken ct)
    {
        var stored = await aiSettingsRepo.GetAsync(ct);
        return Ok(ApiResponse<IReadOnlyList<BrandChannelResponse>>.Ok(stored.ToChannelResponses()));
    }

    /// <summary>
    /// Adds a channel. It starts as a copy of another channel's look (the default unless
    /// <c>CopyFromChannelId</c> says otherwise), so a second channel is "change the logo and
    /// the QR code", not "set everything up again".
    /// </summary>
    [HttpPost("branding/channels")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<BrandChannelResponse>>>> CreateChannel(
        [FromBody] CreateBrandChannelRequest request, CancellationToken ct)
    {
        var stored = await aiSettingsRepo.GetAsync(ct) ?? new AiSettings();
        if (stored.Channels.Count >= BrandChannel.MaxChannels)
        {
            var limit = $"A studio can have up to {BrandChannel.MaxChannels} channels.";
            return BadRequest(ApiResponse<EmptyPayload>.Fail(limit, new ApiError("too-many-channels", limit)));
        }

        if (!TryChannel(stored, request.CopyFromChannelId, out var source)) return ChannelNotFound();

        var name = request.Name.Trim();
        if (IsNameTaken(stored, name, exceptId: null))
        {
            var taken = $"There is already a channel called \"{name}\".";
            return BadRequest(ApiResponse<EmptyPayload>.Fail(taken, new ApiError("channel-name-taken", taken)));
        }

        var channel = new BrandChannel
        {
            Id = MongoDB.Bson.ObjectId.GenerateNewId().ToString(),
            Name = name,
            Watermark = Copy(source?.Watermark ?? stored.DefaultWatermark) ?? new WatermarkSettings(),
            Outro = Copy(source?.Outro ?? stored.DefaultOutro) ?? new OutroSettings(),
        };
        stored.Channels.Add(channel);
        await aiSettingsRepo.SaveAsync(stored, ct);

        await audit.RecordAsync("branding.channel-created", ChannelAuditTarget(channel.Id),
            null, name, RemoteAddress(), ct);

        return Ok(ApiResponse<IReadOnlyList<BrandChannelResponse>>.Ok(stored.ToChannelResponses()));
    }

    [HttpPut("branding/channels/{channelId}")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<BrandChannelResponse>>>> RenameChannel(
        string channelId, [FromBody] RenameBrandChannelRequest request, CancellationToken ct)
    {
        var stored = await aiSettingsRepo.GetAsync(ct) ?? new AiSettings();
        if (!TryChannel(stored, channelId, out var channel)) return ChannelNotFound();

        var name = request.Name.Trim();
        if (IsNameTaken(stored, name, exceptId: channel?.Id ?? BrandChannel.DefaultId))
        {
            var taken = $"There is already a channel called \"{name}\".";
            return BadRequest(ApiResponse<EmptyPayload>.Fail(taken, new ApiError("channel-name-taken", taken)));
        }

        var before = channel?.Name ?? stored.DefaultChannelName;
        if (channel is null) stored.DefaultChannelName = name; else channel.Name = name;
        await aiSettingsRepo.SaveAsync(stored, ct);

        await audit.RecordAsync("branding.channel-renamed", ChannelAuditTarget(channelId),
            before, name, RemoteAddress(), ct);

        return Ok(ApiResponse<IReadOnlyList<BrandChannelResponse>>.Ok(stored.ToChannelResponses()));
    }

    /// <summary>
    /// Removes a channel. Projects that used it fall back to the default channel's end card
    /// (see <see cref="AiSettings.OutroFor"/>); the default itself cannot be deleted.
    /// </summary>
    /// <summary>
    /// How many projects publish under each channel, keyed by channel id. A project with no
    /// channel, or one naming a channel that no longer exists, counts under the default -
    /// that is the channel it actually renders with.
    /// </summary>
    [HttpGet("branding/channels/usage")]
    public async Task<ActionResult<ApiResponse<IReadOnlyDictionary<string, int>>>> ChannelUsage(CancellationToken ct)
    {
        var stored = await aiSettingsRepo.GetAsync(ct) ?? new AiSettings();
        var all = await projects.ListAllAsync(ct);

        var counts = new Dictionary<string, int>(StringComparer.Ordinal);
        foreach (var project in all)
        {
            var id = !BrandChannel.IsDefault(project.Settings.BrandChannelId) && stored.FindChannel(project.Settings.BrandChannelId) is { } c
                ? c.Id
                : BrandChannel.DefaultId;
            counts[id] = counts.GetValueOrDefault(id) + 1;
        }

        return Ok(ApiResponse<IReadOnlyDictionary<string, int>>.Ok(counts));
    }

    /// <param name="moveProjectsTo">
    /// The channel its projects move to. Omitted, they fall back to the default - which is
    /// what a render would do anyway, but saying where they go makes it a decision.
    /// </param>
    [HttpDelete("branding/channels/{channelId}")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<BrandChannelResponse>>>> DeleteChannel(
        string channelId, [FromQuery] string? moveProjectsTo, CancellationToken ct)
    {
        if (BrandChannel.IsDefault(channelId))
        {
            const string message = "The default channel cannot be deleted.";
            return BadRequest(ApiResponse<EmptyPayload>.Fail(message, new ApiError("default-channel", message)));
        }

        var stored = await aiSettingsRepo.GetAsync(ct) ?? new AiSettings();
        var channel = stored.FindChannel(channelId);
        if (channel is null) return ChannelNotFound();

        if (string.Equals(moveProjectsTo, channel.Id, StringComparison.Ordinal)
            || !TryChannel(stored, moveProjectsTo, out var destination))
        {
            const string message = "Choose another existing channel for its projects.";
            return BadRequest(ApiResponse<EmptyPayload>.Fail(message, new ApiError("invalid-destination", message)));
        }

        // Projects first: if this fails part-way, the channel still exists and the delete can
        // simply be repeated, instead of projects pointing at a channel that is gone.
        var moved = 0;
        foreach (var project in await projects.ListAllAsync(ct))
        {
            if (!string.Equals(project.Settings.BrandChannelId, channel.Id, StringComparison.Ordinal)) continue;
            project.Settings.BrandChannelId = destination?.Id;
            await projects.ReplaceAsync(project, ct);
            moved++;
        }

        stored.Channels.Remove(channel);
        await aiSettingsRepo.SaveAsync(stored, ct);

        await audit.RecordAsync("branding.channel-deleted", ChannelAuditTarget(channelId),
            channel.Name, $"{moved} project(s) moved to {destination?.Name ?? stored.DefaultChannelName}",
            RemoteAddress(), ct);

        return Ok(ApiResponse<IReadOnlyList<BrandChannelResponse>>.Ok(stored.ToChannelResponses()));
    }

    // --- branding & hallmark (per channel: ?channel=<id>, omitted = default) --------------

    [HttpGet("branding")]
    public async Task<ActionResult<ApiResponse<WatermarkResponse?>>> GetBranding(
        [FromQuery] string? channel, CancellationToken ct)
    {
        var stored = await aiSettingsRepo.GetAsync(ct) ?? new AiSettings();
        if (!TryChannel(stored, channel, out var target)) return ChannelNotFound();
        return Ok(ApiResponse<WatermarkResponse?>.Ok((target?.Watermark ?? stored.DefaultWatermark).ToResponse()));
    }

    [HttpPut("branding")]
    public async Task<ActionResult<ApiResponse<WatermarkResponse?>>> UpdateBranding(
        [FromBody] WatermarkRequest request, [FromQuery] string? channel, CancellationToken ct)
    {
        var stored = await aiSettingsRepo.GetAsync(ct) ?? new AiSettings();
        if (!TryChannel(stored, channel, out var target)) return ChannelNotFound();
        var before = (target?.Watermark ?? stored.DefaultWatermark)?.Kind.ToString() ?? "None";

        var watermark = request.ToSettings();
        watermark.Clamp();
        if (target is null) stored.DefaultWatermark = watermark; else target.Watermark = watermark;

        await aiSettingsRepo.SaveAsync(stored, ct);

        await audit.RecordAsync(
            "branding.updated",
            ChannelAuditTarget(channel),
            $"Kind: {before}",
            $"Kind: {watermark.Kind}, Text: {watermark.Text}, Logo: {watermark.LogoAssetId}",
            RemoteAddress(),
            ct);

        return Ok(ApiResponse<WatermarkResponse?>.Ok(watermark.ToResponse()));
    }

    [HttpPost("branding/logo")]
    [RequestSizeLimit(AssetsController.MaxUploadBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = AssetsController.MaxUploadBytes)]
    public async Task<ActionResult<ApiResponse<WatermarkResponse?>>> UploadBrandingLogo(
        IFormFile file, [FromQuery] string? channel, CancellationToken ct)
    {
        // Checked before anything is stored, so a bad channel id never leaves an orphan file.
        var stored = await aiSettingsRepo.GetAsync(ct) ?? new AiSettings();
        if (!TryChannel(stored, channel, out var target)) return ChannelNotFound();

        if (file is null || file.Length == 0)
        {
            return BadRequest(ApiResponse<WatermarkResponse?>.Fail(
                "Choose an image file to upload.",
                new ApiError("file-required", "Choose an image file to upload.")));
        }

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (ext is not (".png" or ".jpg" or ".jpeg" or ".webp"))
        {
            return BadRequest(ApiResponse<WatermarkResponse?>.Fail(
                "Logo must be a PNG, JPG, or WEBP image.",
                new ApiError("invalid-image-type", "Only PNG, JPG, and WEBP images are supported.")));
        }

        var mimeType = ext switch
        {
            ".png" => "image/png",
            ".jpg" or ".jpeg" => "image/jpeg",
            ".webp" => "image/webp",
            _ => "image/png"
        };

        var assetId = MongoDB.Bson.ObjectId.GenerateNewId().ToString();
        var storageKey = $"branding/global-logo-{assetId}{ext}";

        await using (var stream = file.OpenReadStream())
        {
            await store.SaveAsync(storageKey, stream, mimeType, ct);
        }

        var now = clock.GetUtcNow().UtcDateTime;
        var asset = new Asset
        {
            Id = assetId,
            ProjectId = "global",
            Name = Path.GetFileName(file.FileName),
            Kind = AssetKind.Image,
            StorageKey = storageKey,
            MimeType = mimeType,
            FileSizeBytes = file.Length,
            CreatedAt = now
        };

        await assets.InsertAsync(asset, ct);

        var watermark = target?.Watermark ?? (stored.DefaultWatermark ??= new WatermarkSettings());
        watermark.Kind = WatermarkKind.Logo;
        watermark.LogoAssetId = assetId;
        watermark.Clamp();

        await aiSettingsRepo.SaveAsync(stored, ct);

        await audit.RecordAsync(
            "branding.logo-uploaded",
            ChannelAuditTarget(channel),
            "Uploaded hallmark logo",
            asset.Name,
            RemoteAddress(),
            ct);

        return Ok(ApiResponse<WatermarkResponse?>.Ok(watermark.ToResponse()));
    }

    [HttpGet("branding/outro")]
    public async Task<ActionResult<ApiResponse<OutroResponse?>>> GetOutro(
        [FromQuery] string? channel, CancellationToken ct)
    {
        var stored = await aiSettingsRepo.GetAsync(ct) ?? new AiSettings();
        if (!TryChannel(stored, channel, out var target)) return ChannelNotFound();
        return Ok(ApiResponse<OutroResponse?>.Ok((target?.Outro ?? stored.DefaultOutro).ToResponse()));
    }

    [HttpPut("branding/outro")]
    public async Task<ActionResult<ApiResponse<OutroResponse?>>> UpdateOutro(
        [FromBody] OutroRequest request, [FromQuery] string? channel, CancellationToken ct)
    {
        var stored = await aiSettingsRepo.GetAsync(ct) ?? new AiSettings();
        if (!TryChannel(stored, channel, out var target)) return ChannelNotFound();

        var outro = request.ToSettings();
        outro.Clamp();
        if (target is null) stored.DefaultOutro = outro; else target.Outro = outro;

        await aiSettingsRepo.SaveAsync(stored, ct);

        await audit.RecordAsync(
            "branding.outro-updated",
            ChannelAuditTarget(channel),
            "Updated outro bumper",
            $"Kind: {outro.Kind}, Asset: {outro.AssetId}, Duration: {outro.DurationSeconds}s",
            RemoteAddress(),
            ct);

        return Ok(ApiResponse<OutroResponse?>.Ok(outro.ToResponse()));
    }

    [HttpPost("branding/outro/upload")]
    [RequestSizeLimit(AssetsController.MaxUploadBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = AssetsController.MaxUploadBytes)]
    public async Task<ActionResult<ApiResponse<OutroResponse?>>> UploadBrandingOutro(
        IFormFile file, [FromQuery] string? channel, CancellationToken ct)
    {
        var stored = await aiSettingsRepo.GetAsync(ct) ?? new AiSettings();
        if (!TryChannel(stored, channel, out var target)) return ChannelNotFound();

        if (file is null || file.Length == 0)
        {
            return BadRequest(ApiResponse<OutroResponse?>.Fail(
                "Choose a video or image file to upload.",
                new ApiError("file-required", "Choose a video or image file to upload.")));
        }

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        var isVideo = ext is ".mp4" or ".webm" or ".mov";
        var isImage = ext is ".png" or ".jpg" or ".jpeg" or ".webp";

        if (!isVideo && !isImage)
        {
            return BadRequest(ApiResponse<OutroResponse?>.Fail(
                "Outro bumper must be a video (MP4, WebM, MOV) or an image (PNG, JPG, WEBP).",
                new ApiError("invalid-media-type", "Only MP4, WebM, MOV, PNG, JPG, and WEBP files are supported.")));
        }

        var mimeType = ext switch
        {
            ".mp4" => "video/mp4",
            ".webm" => "video/webm",
            ".mov" => "video/quicktime",
            ".png" => "image/png",
            ".jpg" or ".jpeg" => "image/jpeg",
            ".webp" => "image/webp",
            _ => isVideo ? "video/mp4" : "image/png"
        };

        var assetId = MongoDB.Bson.ObjectId.GenerateNewId().ToString();
        var storageKey = $"branding/global-outro-{assetId}{ext}";

        await using (var stream = file.OpenReadStream())
        {
            await store.SaveAsync(storageKey, stream, mimeType, ct);
        }

        var now = clock.GetUtcNow().UtcDateTime;
        var asset = new Asset
        {
            Id = assetId,
            ProjectId = "global",
            Name = Path.GetFileName(file.FileName),
            Kind = isVideo ? AssetKind.Video : AssetKind.Image,
            StorageKey = storageKey,
            MimeType = mimeType,
            FileSizeBytes = file.Length,
            CreatedAt = now
        };

        await assets.InsertAsync(asset, ct);

        var outro = target?.Outro ?? (stored.DefaultOutro ??= new OutroSettings());
        outro.Kind = isVideo ? OutroKind.Video : OutroKind.Image;
        outro.AssetId = assetId;
        outro.Clamp();

        await aiSettingsRepo.SaveAsync(stored, ct);

        await audit.RecordAsync(
            "branding.outro-uploaded",
            ChannelAuditTarget(channel),
            "Uploaded outro media",
            asset.Name,
            RemoteAddress(),
            ct);

        return Ok(ApiResponse<OutroResponse?>.Ok(outro.ToResponse()));
    }

    /// <summary>
    /// Uploads the QR code (or any small image) for the "support us" end card and switches
    /// the outro to a card. Kept apart from the bumper upload so changing kinds never
    /// loses the other file.
    /// </summary>
    [HttpPost("branding/outro/qr")]
    [RequestSizeLimit(AssetsController.MaxUploadBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = AssetsController.MaxUploadBytes)]
    public async Task<ActionResult<ApiResponse<OutroResponse?>>> UploadOutroQr(
        IFormFile file, [FromQuery] string? channel, CancellationToken ct)
    {
        var stored = await aiSettingsRepo.GetAsync(ct) ?? new AiSettings();
        if (!TryChannel(stored, channel, out var target)) return ChannelNotFound();

        if (file is null || file.Length == 0)
        {
            return BadRequest(ApiResponse<OutroResponse?>.Fail(
                "Choose a QR code image to upload.",
                new ApiError("file-required", "Choose a QR code image to upload.")));
        }

        // Signature-checked, the same as every project upload: the declared type is a claim.
        UploadValidationResult validation;
        await using (var probe = file.OpenReadStream())
        {
            validation = await UploadValidator.ValidateAsync(file.FileName, file.ContentType, probe, ct);
        }

        if (!validation.IsValid || validation.Kind != AssetKind.Image)
        {
            const string message = "The QR code must be a PNG, JPG or WEBP image.";
            return BadRequest(ApiResponse<OutroResponse?>.Fail(
                message, new ApiError(validation.Code ?? "not-an-image", message)));
        }

        var assetId = MongoDB.Bson.ObjectId.GenerateNewId().ToString();
        var storageKey = $"branding/global-outro-qr-{assetId}{validation.CanonicalExtension}";

        await using (var stream = file.OpenReadStream())
        {
            await store.SaveAsync(storageKey, stream, validation.MimeType!, ct);
        }

        await assets.InsertAsync(new Asset
        {
            Id = assetId,
            ProjectId = "global",
            Name = UploadValidator.SanitizeDisplayName(file.FileName),
            Kind = AssetKind.Image,
            StorageKey = storageKey,
            MimeType = validation.MimeType!,
            FileSizeBytes = file.Length,
            CreatedAt = clock.GetUtcNow().UtcDateTime
        }, ct);

        var outro = target?.Outro ?? (stored.DefaultOutro ??= new OutroSettings());
        outro.Kind = OutroKind.Card;
        outro.QrAssetId = assetId;
        outro.Clamp();

        await aiSettingsRepo.SaveAsync(stored, ct);

        await audit.RecordAsync(
            "branding.outro-qr-uploaded", ChannelAuditTarget(channel),
            "Uploaded end card QR code", assetId, RemoteAddress(), ct);

        return Ok(ApiResponse<OutroResponse?>.Ok(outro.ToResponse()));
    }

    /// <summary>
    /// Renders the outro on its own as an MP4 - the form as submitted, so a card can be
    /// checked before it is saved - for previewing, and for downloading to attach to
    /// videos uploaded before the card existed.
    /// </summary>
    /// <param name="format">landscape (1920x1080), vertical (1080x1920) or square (1080x1080).</param>
    [HttpPost("branding/outro/preview")]
    public async Task<IActionResult> PreviewOutro(
        [FromBody] OutroRequest request, [FromQuery] string? format,
        [FromServices] AnimStudio.Application.Abstractions.Rendering.IOutroPreviewRenderer previews,
        CancellationToken ct)
    {
        Canvas? canvas = (format ?? "landscape").ToLowerInvariant() switch
        {
            "landscape" => Canvas.Hd1080p30,
            "vertical" => Canvas.Vertical1080x1920,
            "square" => Canvas.Square1080,
            _ => null
        };

        if (canvas is null)
        {
            const string message = "format must be landscape, vertical or square.";
            return BadRequest(ApiResponse<EmptyPayload>.Fail(message, new ApiError("invalid-format", message)));
        }

        var outro = request.ToSettings();
        outro.Clamp();

        var bytes = await previews.RenderAsync(outro, canvas, projectId: null, ct);
        if (bytes is null)
        {
            const string message = "Add a QR code or a headline (or upload a bumper) first.";
            return BadRequest(ApiResponse<EmptyPayload>.Fail(message, new ApiError("outro-empty", message)));
        }

        return File(bytes, "video/mp4", $"end-card-{format?.ToLowerInvariant() ?? "landscape"}.mp4");
    }

    // --- helpers -------------------------------------------------------------------------

    /// <summary>
    /// Resolves <c>?channel=</c>: true with null for the default channel, true with the
    /// channel for a known id, false for an id that names nothing.
    /// </summary>
    private static bool TryChannel(AiSettings settings, string? channelId, out BrandChannel? channel)
    {
        channel = settings.FindChannel(channelId);
        return BrandChannel.IsDefault(channelId) || channel is not null;
    }

    private NotFoundObjectResult ChannelNotFound()
    {
        const string message = "That brand channel does not exist (it may have been deleted).";
        return NotFound(ApiResponse<EmptyPayload>.Fail(message, new ApiError("channel-not-found", message)));
    }

    private static bool IsNameTaken(AiSettings settings, string name, string? exceptId)
    {
        bool Same(string other) => string.Equals(other.Trim(), name, StringComparison.OrdinalIgnoreCase);
        if (exceptId != BrandChannel.DefaultId && Same(settings.DefaultChannelName)) return true;
        return settings.Channels.Any(c => c.Id != exceptId && Same(c.Name));
    }

    private static string ChannelAuditTarget(string? channelId) =>
        BrandChannel.IsDefault(channelId) ? "global-branding" : $"global-branding:{channelId}";

    private static WatermarkSettings? Copy(WatermarkSettings? w) => w is null ? null : new WatermarkSettings
    {
        Kind = w.Kind, Text = w.Text, LogoAssetId = w.LogoAssetId, Position = w.Position,
        Opacity = w.Opacity, HeightFraction = w.HeightFraction, MarginFraction = w.MarginFraction,
        ColorHex = w.ColorHex, BackplateOpacity = w.BackplateOpacity,
    };

    private static OutroSettings? Copy(OutroSettings? o) => o is null ? null : new OutroSettings
    {
        Kind = o.Kind, AssetId = o.AssetId, DurationSeconds = o.DurationSeconds, Transition = o.Transition,
        TransitionDurationFrames = o.TransitionDurationFrames, QrAssetId = o.QrAssetId,
        Headline = o.Headline, Subtext = o.Subtext, HeadlineSecondary = o.HeadlineSecondary,
        SubtextSecondary = o.SubtextSecondary, BackgroundHex = o.BackgroundHex, TextHex = o.TextHex,
    };

    private static AiProviderId Parse(string providerId) =>
        AiProviderId.TryParse(providerId, out var id) ? id : throw new KeyNotFoundException();

    private static AiProviderFamily Family(AiProviderOptions? options) =>
        Enum.TryParse<AiProviderFamily>(options?.Family, ignoreCase: true, out var family)
            ? family
            : AiProviderFamily.OpenAiCompatibleText;

    /// <summary>
    /// Why a provider is or is not usable, at the provider level rather than the
    /// capability level - "Groq is off" is a different sentence from "nothing can write".
    /// </summary>
    private (bool Ready, string Reason) Readiness(IAiProvider provider, bool enabled)
    {
        if (!enabled) return (false, nameof(AiUnavailableReason.Disabled));
        if (!provider.IsConfigured) return (false, nameof(AiUnavailableReason.NotConfigured));

        var capability = registry.Describe(provider.Capability);

        return capability.Reason == AiUnavailableReason.CircuitOpen
               && string.Equals(capability.ProviderId, provider.Id.Value, StringComparison.Ordinal)
            ? (false, nameof(AiUnavailableReason.CircuitOpen))
            : (true, nameof(AiUnavailableReason.None));
    }

    /// <summary>A one-line summary for the audit trail. Never a key, never a full address.</summary>
    private string Describe(AiProviderId id)
    {
        var options = aiOptions.CurrentValue.ProviderFor(id);

        if (options is null) return "not configured";

        var host = Uri.TryCreate(options.BaseUrl, UriKind.Absolute, out var uri) ? uri.Host : "none";

        return $"enabled={options.Enabled}, model={options.Model ?? "default"}, host={host}, "
               + $"daily={options.DailyRequestLimit?.ToString() ?? "none"}";
    }

    private string? RemoteAddress() => HttpContext.Connection.RemoteIpAddress?.ToString();
}
