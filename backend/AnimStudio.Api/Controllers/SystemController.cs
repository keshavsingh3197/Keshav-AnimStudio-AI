using Microsoft.AspNetCore.Authorization;
using AnimStudio.Api.Common;
using AnimStudio.Api.Contracts;
using AnimStudio.Api.Security;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Abstractions.Rendering;
using AnimStudio.Application.Abstractions.Storage;
using AnimStudio.Application.Abstractions.Transcripts;
using AnimStudio.Application.Options;
using AnimStudio.Domain.Projects;
using AnimStudio.Domain.Rendering;
using AnimStudio.Application.Security;
using AnimStudio.Infrastructure.Ingest;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace AnimStudio.Api.Controllers;

[ApiController]
[Route("api/system")]
public sealed class SystemController(
    IRenderCapabilities capabilities,
    TranscriptSourceSelector sources,
    IOptions<IngestOptions> ingestOptions,
    IOptionsMonitor<AdminOptions> adminOptions,
    IAiSettingsRepository aiSettingsRepo,
    IAssetRepository assets,
    IObjectStore store,
    IStorageUsageService storageUsage,
    ICurrentUser currentUser) : ControllerBase
{
    /// <summary>
    /// How full the media store is, for the project hub's storage bar. Measured from the
    /// store itself (cached for a minute) against the quota set in server settings.
    /// </summary>
    [AllowAnonymous]
    [HttpGet("storage")]
    public async Task<ActionResult<ApiResponse<StorageSummaryResponse>>> GetStorage(CancellationToken ct)
    {
        var settings = await aiSettingsRepo.GetAsync(ct);
        var usage = await storageUsage.GetAsync(refresh: false, ct);
        return Ok(ApiResponse<StorageSummaryResponse>.Ok(usage.ToSummary(settings?.StorageQuotaGb)));
    }

    /// <summary>
    /// Whether this caller may administer the server.
    /// <para>
    /// Deliberately not itself behind the admin policy: a UI has to be able to ask "should
    /// I show an admin link?" without provoking a refusal it would then have to interpret.
    /// It discloses nothing a caller cannot already discover by trying, and it answers from
    /// <see cref="AdminAccessRules"/> - the same rule the policy enforces - so the screen
    /// and the server can never disagree about who is admitted.
    /// </para>
    /// </summary>
    [AllowAnonymous]
    [HttpGet("admin-access")]
    public ActionResult<ApiResponse<AdminAccessResponse>> AdminAccess()
    {
        var options = adminOptions.CurrentValue;
        var admitted = currentUser.IsAdmin && AdminAccessRules.IsAdmitted(options, HttpContext, User);

        var explanation = options.Mode switch
        {
            AdminAccessMode.Disabled =>
                "Administration is switched off on this server.",

            _ when !currentUser.IsAuthenticated =>
                "Sign in with an administrator account to access settings.",

            _ when !currentUser.IsAdmin =>
                "Administrator role required to access settings.",

            AdminAccessMode.LocalOnly when admitted =>
                "You are on the machine this server runs on and signed in with the Admin role.",

            AdminAccessMode.LocalOnly =>
                "Administration is only available from the machine this server runs on.",

            AdminAccessMode.Jwt when admitted =>
                "Signed in with the Admin role.",

            _ => "Sign in with an account that has the Admin role to change this server's settings."
        };

        return Ok(ApiResponse<AdminAccessResponse>.Ok(
            new AdminAccessResponse(options.Mode.ToString(), admitted, explanation)));
    }

    /// <summary>
    /// Current caller identity, active roles, guest access policy, and UI visibility rules.
    /// </summary>
    [HttpGet("session")]
    [Microsoft.AspNetCore.Authorization.AllowAnonymous]
    public ActionResult<ApiResponse<StudioSessionResponse>> Session([FromServices] ICurrentUser currentUser)
    {
        var options = adminOptions.CurrentValue;
        return Ok(ApiResponse<StudioSessionResponse>.Ok(new StudioSessionResponse(
            currentUser.IsAuthenticated,
            currentUser.UserId,
            currentUser.DisplayName,
            currentUser.Email,
            currentUser.IsAdmin,
            currentUser.Roles,
            options.AnonymousPolicy,
            options.UiNavigation)));
    }

    /// <summary>
    /// UI navigation visibility and sensitivity configurations.
    /// </summary>
    [HttpGet("ui-navigation")]
    [AllowAnonymous]
    public ActionResult<ApiResponse<UiNavigationSettings>> UiNavigation()
    {
        return Ok(ApiResponse<UiNavigationSettings>.Ok(adminOptions.CurrentValue.UiNavigation));
    }

    /// <summary>
    /// Lets the UI show why rendering is unavailable instead of letting the user queue a
    /// job that cannot succeed.
    /// </summary>
    [AllowAnonymous]
    [HttpGet("renderer")]
    public ActionResult<ApiResponse<RendererStatusResponse>> Renderer() =>
        Ok(ApiResponse<RendererStatusResponse>.Ok(new RendererStatusResponse(
            capabilities.IsAvailable,
            capabilities.Version,
            capabilities.UnavailableReason,
            capabilities.Supports(RenderFeature.BurnedSubtitles),
            capabilities.Supports(RenderFeature.KenBurns),
            capabilities.Supports(RenderFeature.CrossFadeTransitions))));

    /// <summary>
    /// Which transcript sources this server can actually use, so the UI can disable the
    /// ones that are not configured rather than offering an option that fails on submit.
    /// </summary>
    [AllowAnonymous]
    [HttpGet("/api/ingest/capabilities")]
    public async Task<ActionResult<ApiResponse<IngestCapabilitiesResponse>>> IngestCapabilities(
        CancellationToken ct)
    {
        var statuses = new List<TranscriptSourceStatus>();

        foreach (var source in sources.All)
        {
            var availability = await source.ProbeAsync(ct);
            statuses.Add(new TranscriptSourceStatus(
                source.Kind.ToString(),
                availability.IsAvailable,
                availability.UnavailableReasonCode,
                availability.ToolVersion,
                availability.RequiresAttestation));
        }

        var options = ingestOptions.Value;

        return Ok(ApiResponse<IngestCapabilitiesResponse>.Ok(new IngestCapabilitiesResponse(
            options.DefaultSource,
            options.AllowMediaDownload,
            statuses.OrderBy(s => s.Kind).ToList())));
    }

    /// <summary>
    /// Global branding & hallmark watermark configuration.
    /// Publicly readable so any project or client can inspect or inherit default branding.
    /// </summary>
    /// <param name="channel">A brand channel id; omitted (or unknown) means the default channel.</param>
    [AllowAnonymous]
    [HttpGet("branding")]
    public async Task<ActionResult<ApiResponse<WatermarkResponse?>>> GetBranding(
        [FromQuery] string? channel, CancellationToken ct)
    {
        // Only studio administrators may inspect internal studio branding/watermark
        if (!currentUser.IsAdmin)
        {
            return Ok(ApiResponse<WatermarkResponse?>.Ok(null));
        }

        var settings = await aiSettingsRepo.GetAsync(ct);
        return Ok(ApiResponse<WatermarkResponse?>.Ok(settings?.WatermarkFor(channel).ToResponse()));
    }

    /// <summary>
    /// The studio's brand channels (one per YouTube channel), default first - for a project
    /// to pick which channel's watermark and end card it uses.
    /// Non-admin users and anonymous guests are strictly isolated to an unbranded Default channel.
    /// </summary>
    [AllowAnonymous]
    [HttpGet("branding/channels")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<BrandChannelResponse>>>> GetBrandChannels(CancellationToken ct)
    {
        // Non-admin members and anonymous visitors NEVER see internal studio/admin brand channels
        if (!currentUser.IsAdmin)
        {
            return Ok(ApiResponse<IReadOnlyList<BrandChannelResponse>>.Ok([
                new BrandChannelResponse(
                    BrandChannel.DefaultId,
                    "Default",
                    IsDefault: true,
                    Watermark: null,
                    Outro: null,
                    YouTubeChannelId: null,
                    YouTubeChannelTitle: null,
                    YouTubeChannelHandle: null,
                    YouTubeThumbnailUrl: null)
            ]));
        }

        var settings = await aiSettingsRepo.GetAsync(ct);
        return Ok(ApiResponse<IReadOnlyList<BrandChannelResponse>>.Ok(settings.ToChannelResponses()));
    }

    /// <summary>
    /// Serves the global branding logo image file.
    /// </summary>
    [AllowAnonymous]
    [HttpGet("branding/logo")]
    public async Task<IActionResult> GetBrandingLogo([FromQuery] string? channel, CancellationToken ct)
    {
        if (!currentUser.IsAdmin)
            return NotFound();

        var settings = await aiSettingsRepo.GetAsync(ct);
        var logoId = settings?.WatermarkFor(channel)?.LogoAssetId;
        if (string.IsNullOrWhiteSpace(logoId))
            return NotFound();

        string storageKey = logoId;
        string mimeType = "image/png";

        var asset = await assets.GetAsync(logoId, ct);
        if (asset is not null)
        {
            storageKey = asset.StorageKey;
            mimeType = asset.MimeType;
        }

        var stream = await store.OpenAsync(storageKey, ct);
        if (stream is null)
            return NotFound();

        Response.Headers.XContentTypeOptions = "nosniff";
        return File(stream, mimeType);
    }

    /// <summary>
    /// Global branding &amp; channel outro bumper configuration.
    /// </summary>
    [AllowAnonymous]
    [HttpGet("branding/outro")]
    public async Task<ActionResult<ApiResponse<OutroResponse?>>> GetBrandingOutro(
        [FromQuery] string? channel, CancellationToken ct)
    {
        if (!currentUser.IsAdmin)
            return Ok(ApiResponse<OutroResponse?>.Ok(null));

        var settings = await aiSettingsRepo.GetAsync(ct);
        return Ok(ApiResponse<OutroResponse?>.Ok(settings?.OutroFor(channel).ToResponse()));
    }

    /// <summary>
    /// A channel's support-card QR image, for Camera Studio to put on air. Only an image
    /// asset is served, whatever the stored id points at.
    /// </summary>
    [AllowAnonymous]
    [HttpGet("branding/outro/qr")]
    public async Task<IActionResult> GetBrandingOutroQr([FromQuery] string? channel, CancellationToken ct)
    {
        if (!currentUser.IsAdmin)
            return NotFound();

        var settings = await aiSettingsRepo.GetAsync(ct);
        var qrAssetId = settings?.OutroFor(channel)?.QrAssetId;
        if (string.IsNullOrWhiteSpace(qrAssetId)) return NotFound();

        var asset = await assets.GetAsync(qrAssetId, ct);
        if (asset is null || asset.MimeType is not ("image/png" or "image/jpeg" or "image/webp")) return NotFound();

        var stream = await store.OpenAsync(asset.StorageKey, ct);
        if (stream is null) return NotFound();

        Response.Headers.XContentTypeOptions = "nosniff";
        return File(stream, asset.MimeType);
    }

    /// <summary>
    /// Serves or streams the global outro video or image file.
    /// </summary>
    [AllowAnonymous]
    [HttpGet("branding/outro/media")]
    public async Task<IActionResult> GetBrandingOutroMedia([FromQuery] string? channel, CancellationToken ct)
    {
        if (!currentUser.IsAdmin)
            return NotFound();

        var settings = await aiSettingsRepo.GetAsync(ct);
        var outroAssetId = settings?.OutroFor(channel)?.AssetId;
        if (string.IsNullOrWhiteSpace(outroAssetId))
            return NotFound();

        string storageKey = outroAssetId;
        string mimeType = "video/mp4";

        var asset = await assets.GetAsync(outroAssetId, ct);
        if (asset is not null)
        {
            storageKey = asset.StorageKey;
            mimeType = asset.MimeType;
        }

        var stream = await store.OpenAsync(storageKey, ct);
        if (stream is null)
            return NotFound();

        Response.Headers.XContentTypeOptions = "nosniff";
        return File(stream, mimeType, enableRangeProcessing: true);
    }

    /// <summary>
    /// Returns global media settings such as default chunk duration and availability.
    /// </summary>
    [HttpGet("media-settings")]
    public async Task<ActionResult<ApiResponse<MediaSystemSettingsResponse>>> GetMediaSettings(CancellationToken ct)
    {
        var settings = await aiSettingsRepo.GetAsync(ct);
        var chunkSec = settings?.DefaultChunkDurationSeconds ?? 10.0;
        var allowDownload = ingestOptions.Value.AllowMediaDownload;
        var ffmpegReady = capabilities.IsAvailable;
        var imageSec = settings?.DefaultImageDurationSeconds ?? ImageDurationLimits.Default;
        return Ok(ApiResponse<MediaSystemSettingsResponse>.Ok(new MediaSystemSettingsResponse(
            chunkSec, allowDownload, true, ffmpegReady, imageSec)));
    }

    /// <summary>
    /// Updates the global default for how long an image plays when added to the timeline.
    /// </summary>
    [HttpPut("image-duration")]
    [Microsoft.AspNetCore.Authorization.Authorize(Policy = AnimStudio.Api.Security.AdminAccess.Policy)]
    public async Task<ActionResult<ApiResponse<double>>> UpdateImageDuration(
        [FromBody] UpdateImageDurationRequest request, CancellationToken ct)
    {
        if (!ImageDurationLimits.IsValid(request.DefaultImageDurationSeconds))
        {
            var message = $"Image duration must be between {ImageDurationLimits.Min} and {ImageDurationLimits.Max} seconds.";
            return BadRequest(ApiResponse<double>.Fail(message, new ApiError("invalid-duration", message)));
        }

        var settings = await aiSettingsRepo.GetAsync(ct) ?? new AnimStudio.Domain.Ai.AiSettings();
        settings.DefaultImageDurationSeconds = request.DefaultImageDurationSeconds;
        settings.UpdatedAt = DateTime.UtcNow;
        await aiSettingsRepo.SaveAsync(settings, ct);

        return Ok(ApiResponse<double>.Ok(settings.DefaultImageDurationSeconds));
    }

    /// <summary>
    /// Updates the global default chunk duration in seconds.
    /// </summary>
    // A server-wide default: changing it is administration, like every other global setting.
    [HttpPut("chunk-duration")]
    [Microsoft.AspNetCore.Authorization.Authorize(Policy = AnimStudio.Api.Security.AdminAccess.Policy)]
    public async Task<ActionResult<ApiResponse<double>>> UpdateChunkDuration(
        [FromBody] UpdateChunkDurationRequest request, CancellationToken ct)
    {
        if (request.DefaultChunkDurationSeconds <= 0)
        {
            return BadRequest(ApiResponse<double>.Fail("Chunk duration must be positive.", new ApiError("invalid-duration", "Must be positive.")));
        }

        var settings = await aiSettingsRepo.GetAsync(ct) ?? new AnimStudio.Domain.Ai.AiSettings();
        settings.DefaultChunkDurationSeconds = request.DefaultChunkDurationSeconds;
        settings.UpdatedAt = DateTime.UtcNow;
        await aiSettingsRepo.SaveAsync(settings, ct);

        return Ok(ApiResponse<double>.Ok(settings.DefaultChunkDurationSeconds));
    }

    /// <summary>
    /// Returns the Project Hub configuration (aspect ratio presets, studio templates,
    /// quick-start actions, and current storage usage) so the Project Hub modal never 404s.
    /// </summary>
    [AllowAnonymous]
    [HttpGet("hub-config")]
    public async Task<ActionResult<ApiResponse<AnimStudio.Domain.System.HubConfig>>> GetHubConfig(CancellationToken ct)
    {
        var settings = await aiSettingsRepo.GetAsync(ct);
        var usage = await storageUsage.GetAsync(refresh: false, ct);
        var summary = usage.ToSummary(settings?.StorageQuotaGb);

        const double bytesPerGb = 1024.0 * 1024.0 * 1024.0;
        var usedGb = Math.Round(summary.UsedBytes / bytesPerGb, 2);
        var totalGb = summary.CapacityBytes.HasValue
            ? Math.Round(summary.CapacityBytes.Value / bytesPerGb, 2)
            : (settings?.StorageQuotaGb ?? 50.0);

        var config = new AnimStudio.Domain.System.HubConfig
        {
            Id = "default",
            StorageUsedGb = usedGb,
            StorageTotalGb = totalGb,
            Presets =
            [
                new() { Label = "YouTube (16:9)", Width = 1920, Height = 1080 },
                new() { Label = "Shorts / Reels (9:16)", Width = 1080, Height = 1920 },
                new() { Label = "Square (1:1)", Width = 1080, Height = 1080 },
                new() { Label = "Social Feed (4:5)", Width = 1080, Height = 1350 },
                new() { Label = "Ultrawide (21:9)", Width = 2560, Height = 1080 },
                new() { Label = "4K UHD (16:9)", Width = 3840, Height = 2160 }
            ],
            Templates =
            [
                new() { Id = "tpl-yt", Name = "YouTube Storytelling (16:9)", WireframeClass = "wf-16-9", Tags = ["1080p", "Landscape", "Subtitles"] },
                new() { Id = "tpl-shorts", Name = "Viral Shorts / Reels (9:16)", WireframeClass = "wf-9-16", Tags = ["Vertical", "Auto-Hook", "Fast Cut"] },
                new() { Id = "tpl-podcast", Name = "Podcast & Dialogue Cut", WireframeClass = "wf-16-9", Tags = ["2 Speakers", "Audio Sync"] },
                new() { Id = "tpl-music", Name = "Music Visualizer & Visualizer Bed", WireframeClass = "wf-1-1", Tags = ["Music", "YouTube Music"] }
            ],
            QuickStarts =
            [
                new() { Id = "qs-blank", Icon = "âœ¨", Label = "Blank Project", Tooltip = "Start a clean project on a 1080p canvas" },
                new() { Id = "qs-script", Icon = "ðŸ“", Label = "From Script / SRT", Tooltip = "Generate timed scenes from a transcript or subtitle file" },
                new() { Id = "qs-shorts", Icon = "âš¡", Label = "Auto Shorts Batch", Tooltip = "Cut vertical shorts from existing clips and hooks" },
                new() { Id = "qs-bundle", Icon = "ðŸ“¦", Label = "Import ZIP Bundle", Tooltip = "Build an entire project from a single ZIP bundle" }
            ]
        };

        return Ok(ApiResponse<AnimStudio.Domain.System.HubConfig>.Ok(config));
    }

    /// <summary>
    /// Tails recent entries from the server's rolling daily log files under <c>App_Data/logs</c>.
    /// Restricted by the same admission rule as the admin console so remote unauthenticated callers
    /// cannot read server logs.
    /// </summary>
    [HttpGet("logs")]
    public async Task<ActionResult<ApiResponse<ServerLogsResponse>>> GetServerLogs(
        [FromServices] AnimStudio.Infrastructure.Storage.AppDataPaths dataPaths,
        [FromQuery] string? file = null,
        [FromQuery] int lines = 250,
        [FromQuery] string? level = null,
        [FromQuery] string? search = null,
        CancellationToken ct = default)
    {
        if (!AdminAccessRules.IsAdmitted(adminOptions.CurrentValue, HttpContext, User))
        {
            return StatusCode(403, ApiResponse<ServerLogsResponse>.Fail(
                "Server logs are only available to local or administrator sessions.",
                new ApiError("forbidden", "Server logs require administrator access.")));
        }

        var logDir = dataPaths.Logs;
        if (!Directory.Exists(logDir))
        {
            return Ok(ApiResponse<ServerLogsResponse>.Ok(new ServerLogsResponse([], null, [])));
        }

        var dirInfo = new DirectoryInfo(logDir);
        var logFiles = dirInfo.GetFiles("*.log")
            .OrderByDescending(f => f.LastWriteTimeUtc)
            .Select(f => new ServerLogFileItem(f.Name, f.Length, f.LastWriteTimeUtc))
            .ToList();

        if (logFiles.Count == 0)
        {
            return Ok(ApiResponse<ServerLogsResponse>.Ok(new ServerLogsResponse([], null, [])));
        }

        var targetName = !string.IsNullOrWhiteSpace(file)
            && logFiles.Any(f => string.Equals(f.Name, file, StringComparison.OrdinalIgnoreCase))
            ? logFiles.First(f => string.Equals(f.Name, file, StringComparison.OrdinalIgnoreCase)).Name
            : logFiles[0].Name;

        var fullPath = Path.Combine(logDir, Path.GetFileName(targetName));
        var clampedLines = Math.Clamp(lines, 20, 1000);
        var entries = new List<ServerLogEntry>();

        if (System.IO.File.Exists(fullPath))
        {
            var rawLines = new List<string>();
            await using (var fs = new FileStream(fullPath, FileMode.Open, FileAccess.Read, FileShare.ReadWrite | FileShare.Delete))
            using (var reader = new StreamReader(fs))
            {
                while (await reader.ReadLineAsync(ct) is { } line)
                {
                    if (!string.IsNullOrWhiteSpace(line))
                        rawLines.Add(line);
                }
            }

            for (var i = rawLines.Count - 1; i >= 0 && entries.Count < clampedLines; i--)
            {
                var parsed = ParseLogLine(rawLines[i]);
                if (!string.IsNullOrWhiteSpace(level)
                    && !string.Equals(level, "ALL", StringComparison.OrdinalIgnoreCase)
                    && !string.Equals(parsed.Level, level, StringComparison.OrdinalIgnoreCase))
                {
                    continue;
                }

                if (!string.IsNullOrWhiteSpace(search)
                    && !parsed.Message.Contains(search, StringComparison.OrdinalIgnoreCase)
                    && !parsed.Category.Contains(search, StringComparison.OrdinalIgnoreCase))
                {
                    continue;
                }

                entries.Add(parsed);
            }
        }

        return Ok(ApiResponse<ServerLogsResponse>.Ok(
            new ServerLogsResponse(logFiles, targetName, entries)));
    }

    private static ServerLogEntry ParseLogLine(string raw)
    {
        // Format written by DailyFileLoggerProvider:
        // 2026-10-18 12:34:56.789 +05:30 [INF] Category.Name: Message
        try
        {
            var openBracket = raw.IndexOf('[');
            var closeBracket = openBracket > 0 ? raw.IndexOf(']', openBracket) : -1;
            if (openBracket > 0 && closeBracket > openBracket)
            {
                var timestamp = raw[..openBracket].Trim();
                var lvl = raw[(openBracket + 1)..closeBracket].Trim().ToUpperInvariant();
                var rest = raw[(closeBracket + 1)..].Trim();
                var colonIdx = rest.IndexOf(": ", StringComparison.Ordinal);
                if (colonIdx > 0)
                {
                    var cat = rest[..colonIdx].Trim();
                    var msg = rest[(colonIdx + 2)..].Trim();
                    return new ServerLogEntry(timestamp, NormalizeLevel(lvl), cat, msg, raw);
                }

                return new ServerLogEntry(timestamp, NormalizeLevel(lvl), "System", rest, raw);
            }
        }
        catch
        {
            // Fallback for continuation / stack trace lines
        }

        return new ServerLogEntry(string.Empty, "INFO", "Continuation", raw, raw);
    }

    private static string NormalizeLevel(string lvl) => lvl switch
    {
        "ERR" or "ERROR" or "FTL" or "CRT" or "CRITICAL" => "ERROR",
        "WRN" or "WARN" or "WARNING" => "WARN",
        "DBG" or "DEBUG" or "TRC" or "TRACE" => "DEBUG",
        _ => "INFO"
    };
}

public sealed record MediaSystemSettingsResponse(
    double DefaultChunkDurationSeconds,
    bool AllowMediaDownload,
    bool YtDlpAvailable,
    bool FfmpegAvailable,
    double DefaultImageDurationSeconds = ImageDurationLimits.Default);

public sealed record UpdateChunkDurationRequest(double DefaultChunkDurationSeconds);

public sealed record UpdateImageDurationRequest(double DefaultImageDurationSeconds);

public sealed record ServerLogFileItem(string Name, long SizeBytes, DateTime UpdatedAtUtc);

public sealed record ServerLogEntry(
    string Timestamp,
    string Level,
    string Category,
    string Message,
    string Raw);

public sealed record ServerLogsResponse(
    IReadOnlyList<ServerLogFileItem> Files,
    string? ActiveFile,
    IReadOnlyList<ServerLogEntry> Entries);


