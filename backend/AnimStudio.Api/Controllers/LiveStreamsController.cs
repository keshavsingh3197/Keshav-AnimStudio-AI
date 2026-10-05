using System.Text.Json;
using System.Text.Json.Serialization;
using AnimStudio.Api.Common;
using AnimStudio.Api.Security;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Abstractions.Storage;
using AnimStudio.Application.Admin;
using AnimStudio.Application.LiveStreams;
using AnimStudio.Application.Options;
using AnimStudio.Application.Releases;
using AnimStudio.Application.Security;
using AnimStudio.Application.Uploads;
using AnimStudio.Domain.Assets;
using AnimStudio.Domain.Errors;
using AnimStudio.Domain.Jobs;
using AnimStudio.Domain.Rendering;
using AnimStudio.Infrastructure.LiveStreams;
using AnimStudio.Infrastructure.Releases;
using AnimStudio.Infrastructure.Storage;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace AnimStudio.Api.Controllers;

/// <summary>
/// Go Live: sends a playlist - videos, renders and Clip Studio exports, project assets,
/// songs with their covers, release kits, and links on supported sites - to YouTube Live
/// the way an encoder such as OBS would.
/// <para>
/// A stream is <b>prepared</b> first: every item is converted on the server into the exact
/// format that will be sent, and each one can be watched before anything goes out. Going
/// live then copies those segments to the ingest. The key is either a brand channel's saved
/// key (admins, or everyone when the server allows it) or one pasted for that stream.
/// </para>
/// </summary>
[ApiController]
[Route("api/live-streams")]
public sealed partial class LiveStreamsController(
    LiveStreamManager streams,
    CameraStreamManager cameras,
    YouTubeAudienceService audience,
    LiveStreamKeyStore keys,
    ReleaseKitStore releaseKits,
    IRenderJobRepository jobs,
    IAssetRepository assets,
    IProjectRepository projects,
    IAiSettingsRepository settingsRepository,
    IObjectStore store,
    ICurrentUser currentUser,
    AdminAuditService audit,
    IOptionsMonitor<AdminOptions> adminOptions,
    IOptions<IngestOptions> ingestOptions,
    AppDataPaths dataPaths,
    ILogger<LiveStreamsController> logger) : ControllerBase
{
    public const long MaxVideoBytes = 2L * 1024 * 1024 * 1024;
    private const long MaxRequestBytes = 4L * 1024 * 1024 * 1024;
    private const int MaxJsonFieldLength = 64 * 1024;

    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter(allowIntegerValues: false) }
    };

    /// <summary>Everything the Go Live page needs up front: destinations, channels and their key states, and what this caller may do.</summary>
    [HttpGet("setup")]
    public async Task<ActionResult<ApiResponse<LiveStreamSetup>>> Setup(CancellationToken ct)
    {
        var destinations = DestinationList();
        var settings = await settingsRepository.GetAsync(ct);
        var saved = (await keys.DescribeAllAsync(ct))
            .ToDictionary(k => (k.ChannelId, k.DestinationId));

        var channels = ChannelList(settings)
            .Select(c => new LiveStreamChannel(c.Id, c.Name, c.IsDefault,
                destinations.Select(d => saved.TryGetValue((c.Id, d.Id), out var status)
                    ? status
                    : LiveStreamKeyStore.Missing(c.Id, d.Id)).ToList()))
            .ToList();

        var isAdmin = IsAdmin();
        return Ok(ApiResponse<LiveStreamSetup>.Ok(new LiveStreamSetup(
            destinations,
            channels,
            CanUseSavedKeys: isAdmin || streams.AllowSavedKeysForNonAdmins,
            CanManageKeys: isAdmin,
            AllowLinks: ingestOptions.Value.AllowMediaDownload,
            MaxItems: LiveStreamValidator.MaxItems,
            MaxStreamsPerUser: streams.MaxStreamsPerUser,
            CameraEnabled: cameras.Enabled,
            CameraMaxChunkBytes: cameras.MaxChunkBytes,
            AudienceStatsEnabled: audience.IsConfigured)));
    }

    [HttpGet("destinations")]
    public ActionResult<ApiResponse<IReadOnlyList<LiveStreamDestination>>> Destinations() =>
        Ok(ApiResponse<IReadOnlyList<LiveStreamDestination>>.Ok(DestinationList()));

    [HttpGet]
    public ActionResult<ApiResponse<IReadOnlyList<LiveStreamStatus>>> List() =>
        Ok(ApiResponse<IReadOnlyList<LiveStreamStatus>>.Ok(streams.List(currentUser.UserId)));

    [HttpGet("{id}")]
    public ActionResult<ApiResponse<LiveStreamStatus>> Get(string id) =>
        streams.Get(id, currentUser.UserId) is { } status
            ? Ok(ApiResponse<LiveStreamStatus>.Ok(status))
            : StreamNotFound();

    /// <summary>A prepared item exactly as it will be sent, for the owner to watch first.</summary>
    [HttpGet("{id}/items/{index:int}/preview")]
    public IActionResult Preview(string id, int index)
    {
        if (streams.PreviewPath(id, currentUser.UserId, index) is not { } path) return StreamNotFound();
        return PhysicalFile(path, "video/mp4", enableRangeProcessing: true);
    }

    /// <summary>Stops sending (or preparing). The prepared items are kept so it can be sent again.</summary>
    [HttpPost("{id}/stop")]
    public ActionResult<ApiResponse<LiveStreamStatus>> Stop(string id)
    {
        if (!streams.Stop(id, currentUser.UserId)) return StreamNotFound();
        return Ok(ApiResponse<LiveStreamStatus>.Ok(streams.Get(id, currentUser.UserId)!));
    }

    /// <summary>Stops the stream if it is running and deletes it with its prepared items.</summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Discard(string id)
    {
        if (!await streams.DiscardAsync(id, currentUser.UserId)) return StreamNotFound();
        return NoContent();
    }

    /// <summary>Sends a prepared stream - or sends an ended one again - with a channel's saved key or a pasted one.</summary>
    [HttpPost("{id}/go-live")]
    public async Task<ActionResult<ApiResponse<LiveStreamStatus>>> GoLive(
        string id, [FromBody] LiveStreamGoLiveRequest? request, CancellationToken ct)
    {
        var current = streams.Get(id, currentUser.UserId);
        if (current is null) return StreamNotFound();

        var (target, error) = await ResolveKeyTargetAsync(request, current.DestinationId, ct);
        if (error is not null) return error;

        if (await RtmpsProblemAsync(ct) is { } rtmps) return rtmps;

        return streams.TryGoLive(id, currentUser.UserId, target!, out var status) switch
        {
            LiveStreamGoLiveOutcome.Started => Ok(ApiResponse<LiveStreamStatus>.Ok(status!)),
            LiveStreamGoLiveOutcome.AlreadyRunning => Conflict(ApiResponse<LiveStreamStatus>.Fail(
                "This stream is already preparing or sending.", new ApiError("already-running", "Stream is busy."))),
            LiveStreamGoLiveOutcome.NotReady => Conflict(ApiResponse<LiveStreamStatus>.Fail(
                "This stream isn't ready yet. Wait until every item is prepared.", new ApiError("not-ready", "Stream not ready."))),
            LiveStreamGoLiveOutcome.Busy => Busy(),
            _ => StreamNotFound()
        };
    }

    /// <summary>
    /// Prepares a stream from a playlist. Multipart: <c>settings</c> (JSON), <c>items</c> (JSON
    /// array), the item files as <c>file0</c>... / <c>cover0</c>..., and optionally <c>goLive</c>
    /// (JSON, as for <see cref="GoLive"/>) to send it as soon as it is ready. Returns once the
    /// playlist is accepted; poll the stream for progress.
    /// </summary>
    [HttpPost]
    [RequestSizeLimit(MaxRequestBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = MaxRequestBytes)]
    public async Task<ActionResult<ApiResponse<LiveStreamStatus>>> Create(CancellationToken ct)
    {
        var userId = currentUser.UserId;
        if (!Request.HasFormContentType)
            return Invalid("form-invalid", "Send the playlist as a form.", "form");

        var form = await Request.ReadFormAsync(ct);

        if (!TryReadJson(form["settings"], out LiveStreamSettings? settings))
            return Invalid("settings-invalid", "The stream settings could not be read.", "settings");
        if (LiveStreamValidator.ValidateSettings(settings!, streams.Destinations.Keys.ToList()) is { } settingsError)
            return Invalid("settings-invalid", settingsError, "settings");

        if (!TryReadJson(form["items"], out List<LiveStreamItemRequest>? items))
            return Invalid("items-invalid", "The playlist could not be read.", "items");
        var check = LiveStreamValidator.ValidateItems(items);
        if (!check.IsValid)
            return Invalid("items-invalid", check.Error!, check.ItemIndex is { } i ? $"items[{i}]" : "items");

        var playlist = items!;
        if (playlist.Any(i => i.Source == LiveStreamItemSource.Url) && !ingestOptions.Value.AllowMediaDownload)
            return Invalid("links-disabled", "Streaming from links is switched off on this server.", "items");

        LiveStreamKeyTarget? autoStart = null;
        var goLiveJson = form["goLive"].ToString();
        if (!string.IsNullOrWhiteSpace(goLiveJson))
        {
            if (!TryReadJson(goLiveJson, out LiveStreamGoLiveRequest? goLive))
                return Invalid("go-live-invalid", "The Go live settings could not be read.", "goLive");
            var (target, error) = await ResolveKeyTargetAsync(goLive, settings!.Destination, ct);
            if (error is not null) return error;
            autoStart = target;
        }

        // Checked before anything is saved: a multi-gigabyte upload must not land only to be refused.
        if (!streams.HasRoomFor(userId))
            return TooManyStreams();
        if (await RtmpsProblemAsync(ct) is { } rtmps) return rtmps;

        var workDir = Path.Combine(dataPaths.LiveStreams, Guid.NewGuid().ToString("n"));
        try
        {
            Directory.CreateDirectory(workDir);

            var inputs = new List<LiveStreamItemInput>(playlist.Count);
            for (var i = 0; i < playlist.Count; i++)
            {
                var (input, error) = await ResolveItemAsync(playlist[i], i, check.CanonicalUrls[i], form.Files, workDir, ct);
                if (error is not null)
                {
                    TryDelete(workDir);
                    return error;
                }
                inputs.Add(input!);
            }

            var outcome = streams.TryCreate(new LiveStreamCreateRequest(userId, workDir, settings!, inputs, autoStart), out var status);
            switch (outcome)
            {
                case LiveStreamCreateOutcome.Created:
                    return Ok(ApiResponse<LiveStreamStatus>.Ok(status!));
                case LiveStreamCreateOutcome.UnknownDestination:
                    TryDelete(workDir);
                    return Invalid("settings-invalid", "Choose where to stream to.", "settings");
                default:
                    TryDelete(workDir);
                    return TooManyStreams();
            }
        }
        catch (OperationCanceledException)
        {
            TryDelete(workDir);
            throw;
        }
        catch (Exception ex)
        {
            TryDelete(workDir);
            logger.LogError("Preparing a live stream for user {UserId} failed: {ErrorType}", userId, ex.GetType().Name);
            return StatusCode(StatusCodes.Status500InternalServerError, ApiResponse<LiveStreamStatus>.Fail(
                "The stream couldn't be prepared. Check the Logs page for details.",
                new ApiError("live-stream-failed", "The stream couldn't be prepared.")));
        }
    }

    // ------------------------------------------------------------------ saved keys (admin)

    /// <summary>Saves (or replaces) a channel's stream key for a destination. Returned masked only.</summary>
    [HttpPut("keys/{channelId}/{destinationId}")]
    [Authorize(Policy = AdminAccess.Policy)]
    public async Task<ActionResult<ApiResponse<LiveStreamKeyStatus>>> SaveKey(
        string channelId, string destinationId, [FromBody] SaveStreamKeyRequest? request, CancellationToken ct)
    {
        if (await ValidateChannelAndDestinationAsync(channelId, destinationId, ct) is { } invalid) return invalid;

        var before = await keys.DescribeAsync(channelId, destinationId, ct);
        try
        {
            var saved = await keys.SetAsync(channelId, destinationId, request?.StreamKey, currentUser.UserId, ct);
            await audit.RecordAsync("live.key-saved", $"{channelId}/{destinationId}",
                before.Fingerprint ?? "none", saved.Fingerprint, RemoteAddress(), ct);
            return Ok(ApiResponse<LiveStreamKeyStatus>.Ok(saved));
        }
        catch (LiveStreamKeyException ex)
        {
            return BadRequest(ApiResponse<LiveStreamKeyStatus>.Fail(ex.Message, new ApiError(ex.Code, ex.Message, Field: "streamKey")));
        }
    }

    [HttpDelete("keys/{channelId}/{destinationId}")]
    [Authorize(Policy = AdminAccess.Policy)]
    public async Task<IActionResult> DeleteKey(string channelId, string destinationId, CancellationToken ct)
    {
        if (!LiveStreamValidator.IsValidId(channelId) || !streams.Destinations.ContainsKey(destinationId))
            return NotFound(ApiResponse<string>.Fail("No such key.", new ApiError("not-found", "Key not found.")));

        var before = await keys.DescribeAsync(channelId, destinationId, ct);
        if (!await keys.DeleteAsync(channelId, destinationId, ct))
            return NotFound(ApiResponse<string>.Fail("No key is saved for that channel.", new ApiError("not-found", "Key not found.")));

        await audit.RecordAsync("live.key-removed", $"{channelId}/{destinationId}", before.Fingerprint, "none", RemoteAddress(), ct);
        return NoContent();
    }

    // ------------------------------------------------------------------ items

    /// <summary>
    /// Checks one item's source - ownership included - and writes its files into the work
    /// directory under generated names. A link item is only recorded: it is downloaded
    /// while the stream is prepared.
    /// </summary>
    private async Task<(LiveStreamItemInput? Input, ActionResult? Error)> ResolveItemAsync(
        LiveStreamItemRequest item, int index, string? canonicalUrl, IFormFileCollection files, string workDir, CancellationToken ct)
    {
        var field = $"items[{index}]";
        var label = $"Item {index + 1}";
        var stem = $"source{index:00}";
        string Title(string fallback) => string.IsNullOrWhiteSpace(item.Title) ? fallback : item.Title.Trim();

        switch (item.Source)
        {
            case LiveStreamItemSource.Upload:
            {
                var file = files.GetFile(item.FileField!);
                if (file is not { Length: > 0 })
                    return (null, Invalid("file-missing", $"{label}'s file didn't arrive.", field));

                string sourceName;
                var isVideo = string.Equals(Path.GetExtension(file.FileName), ".mp4", StringComparison.OrdinalIgnoreCase);
                await using (var content = file.OpenReadStream())
                {
                    if (isVideo)
                    {
                        if (file.Length > MaxVideoBytes)
                            return (null, Invalid("video-too-large", $"{label} is larger than 2 GB.", field));
                        var videoCheck = await UploadValidator.ValidateAsync(file.FileName, file.ContentType, content, ct);
                        if (!videoCheck.IsValid || videoCheck.Kind != AssetKind.Video)
                            return (null, Invalid(videoCheck.Code ?? "video-invalid", $"{label}: {videoCheck.Message ?? "use an MP4 video."}", field));
                        sourceName = stem + videoCheck.CanonicalExtension;
                    }
                    else
                    {
                        var audioCheck = await ReleaseUploadValidator.ValidateAudioAsync(file.FileName, file.Length, content, ct);
                        if (!audioCheck.IsValid)
                            return (null, Invalid(audioCheck.Code!, $"{label}: {audioCheck.Message}", field));
                        sourceName = stem + audioCheck.Extension;
                    }
                }

                string? coverName = null;
                if (item.CoverField is not null)
                {
                    var cover = files.GetFile(item.CoverField);
                    if (cover is not { Length: > 0 })
                        return (null, Invalid("cover-missing", $"{label}'s cover didn't arrive.", field));

                    await using var coverContent = cover.OpenReadStream();
                    var coverCheck = await ReleaseUploadValidator.ValidateCoverAsync(cover.FileName, cover.ContentType, cover.Length, coverContent, ct);
                    if (!coverCheck.IsValid)
                        return (null, Invalid(coverCheck.Code ?? "cover-invalid", $"{label}: {coverCheck.Message ?? "that cover can't be used."}", field));
                    coverName = $"cover{index:00}{coverCheck.CanonicalExtension}";
                    await SaveAsync(cover, Path.Combine(workDir, coverName), ct);
                }

                await SaveAsync(file, Path.Combine(workDir, sourceName), ct);
                return (new LiveStreamItemInput(item.Source, Title(Path.GetFileNameWithoutExtension(file.FileName)), sourceName, coverName), null);
            }

            case LiveStreamItemSource.Render:
            {
                var job = await jobs.GetAsync(item.RenderJobId!, ct);
                if (job is null || !string.Equals(job.UserId, currentUser.UserId, StringComparison.Ordinal))
                {
                    if (job is not null)
                        logger.LogWarning("User {UserId} was refused render {JobId} as a live source: owned by another user", currentUser.UserId, job.Id);
                    return (null, NotFound(ApiResponse<LiveStreamStatus>.Fail($"{label}: that render doesn't exist.",
                        new ApiError("render-not-found", "Render not found.", Field: field))));
                }

                if (job.OutputStorageKey is null || job.Status is not (RenderJobStatus.Completed or RenderJobStatus.CompletedWithWarnings))
                    return (null, Invalid("render-not-finished", $"{label}: that render hasn't finished yet.", field));

                var name = stem + ".mp4";
                if (!await CopyFromStoreAsync(job.OutputStorageKey, Path.Combine(workDir, name), ct))
                    return (null, Invalid("render-output-missing", $"{label}: that render's video file is no longer available.", field));

                return (new LiveStreamItemInput(item.Source, Title($"Render {job.Id[..Math.Min(8, job.Id.Length)]}"), name, null), null);
            }

            case LiveStreamItemSource.Asset:
            {
                var asset = await OwnedAssetAsync(item.AssetId!, ct);
                if (asset is null || asset.Kind is not (AssetKind.Video or AssetKind.Audio))
                    return (null, NotFound(ApiResponse<LiveStreamStatus>.Fail($"{label}: that video or audio asset doesn't exist.",
                        new ApiError("asset-not-found", "Asset not found.", Field: field))));

                var name = stem + SafeExtension(asset.Name, asset.Kind == AssetKind.Video ? ".mp4" : ".m4a");
                if (!await CopyFromStoreAsync(asset.StorageKey, Path.Combine(workDir, name), ct))
                    return (null, Invalid("asset-missing", $"{label}: that asset's file is no longer available.", field));

                string? coverName = null;
                if (item.CoverAssetId is not null)
                {
                    var cover = await OwnedAssetAsync(item.CoverAssetId, ct);
                    var extension = cover?.MimeType switch
                    {
                        "image/png" => ".png",
                        "image/jpeg" => ".jpg",
                        "image/webp" => ".webp",
                        _ => null
                    };
                    if (cover is null || cover.Kind != AssetKind.Image || extension is null)
                        return (null, NotFound(ApiResponse<LiveStreamStatus>.Fail($"{label}: that cover image doesn't exist.",
                            new ApiError("asset-not-found", "Cover asset not found.", Field: field))));

                    coverName = $"cover{index:00}{extension}";
                    if (!await CopyFromStoreAsync(cover.StorageKey, Path.Combine(workDir, coverName), ct))
                        return (null, Invalid("asset-missing", $"{label}: the cover image is no longer available.", field));
                }

                return (new LiveStreamItemInput(item.Source, Title(Path.GetFileNameWithoutExtension(asset.Name)), name, coverName), null);
            }

            case LiveStreamItemSource.Url:
                return (new LiveStreamItemInput(item.Source, Title(canonicalUrl!), null, null, canonicalUrl, item.AudioOnly), null);

            case LiveStreamItemSource.ReleaseKit:
            {
                var kit = releaseKits.TryGetOwned(item.ReleaseKitId!, currentUser.UserId);
                if (kit is null)
                    return (null, NotFound(ApiResponse<LiveStreamStatus>.Fail($"{label}: that release kit has expired or doesn't exist.",
                        new ApiError("kit-not-found", "Release kit not found.", Field: field))));

                var visualizer = item.UseVisualizer ? ReleaseKitStore.FilePath(kit, FfmpegReleaseKitBuilder.VisualizerFile) : null;
                if (visualizer is not null)
                {
                    var name = stem + ".mp4";
                    System.IO.File.Copy(visualizer, Path.Combine(workDir, name));
                    return (new LiveStreamItemInput(item.Source, Title("Release visualizer"), name, null), null);
                }

                var master = ReleaseKitStore.FilePath(kit, FfmpegReleaseKitBuilder.MasterFile);
                if (master is null)
                    return (null, Invalid("kit-incomplete", $"{label}: that release kit has no master to stream.", field));

                var audioName = stem + ".wav";
                System.IO.File.Copy(master, Path.Combine(workDir, audioName));

                string? coverName = null;
                if (ReleaseKitStore.FilePath(kit, FfmpegReleaseKitBuilder.CoverFile) is { } coverPath)
                {
                    coverName = $"cover{index:00}.jpg";
                    System.IO.File.Copy(coverPath, Path.Combine(workDir, coverName));
                }

                return (new LiveStreamItemInput(item.Source, Title("Release master"), audioName, coverName), null);
            }

            default:
                return (null, Invalid("items-invalid", $"{label} has an unknown source.", field));
        }
    }

    private async Task<Asset?> OwnedAssetAsync(string assetId, CancellationToken ct)
    {
        var asset = await assets.GetAsync(assetId, ct);
        if (asset is null) return null;

        // The shared libraries are readable by everyone; anything else must be in the caller's own project.
        if (string.Equals(asset.ProjectId, "global", StringComparison.OrdinalIgnoreCase)
            || string.Equals(asset.ProjectId, "system", StringComparison.OrdinalIgnoreCase))
            return asset;

        var project = await projects.GetAsync(asset.ProjectId, ct);
        if (project is not null && string.Equals(project.UserId, currentUser.UserId, StringComparison.Ordinal))
            return asset;

        logger.LogWarning("User {UserId} was refused asset {AssetId} as a live source: not their project", currentUser.UserId, assetId);
        return null;
    }

    private async Task<bool> CopyFromStoreAsync(string storageKey, string path, CancellationToken ct)
    {
        await using var source = await store.OpenAsync(storageKey, ct);
        if (source is null) return false;

        await using var target = new FileStream(path, FileMode.CreateNew, FileAccess.Write);
        await source.CopyToAsync(target, ct);
        return true;
    }

    /// <summary>A short alphanumeric extension from a stored name, or the fallback - it only hints ffmpeg's demuxer.</summary>
    private static string SafeExtension(string? name, string fallback)
    {
        var extension = Path.GetExtension(name ?? string.Empty).ToLowerInvariant();
        return extension.Length is >= 2 and <= 6 && extension[1..].All(char.IsAsciiLetterOrDigit) ? extension : fallback;
    }

    // ------------------------------------------------------------------ keys and channels

    /// <summary>Turns a Go live request into a key target, or the response that explains why it can't be used.</summary>
    private async Task<(LiveStreamKeyTarget? Target, ActionResult? Error)> ResolveKeyTargetAsync(
        LiveStreamGoLiveRequest? request, string destinationId, CancellationToken ct)
    {
        var hasKey = !string.IsNullOrWhiteSpace(request?.StreamKey);
        var hasChannel = !string.IsNullOrWhiteSpace(request?.ChannelId);

        if (hasKey == hasChannel)
            return (null, Invalid("key-source-invalid", "Choose a channel with a saved key, or paste a stream key.", "streamKey"));

        if (hasKey)
        {
            if (LiveStreamValidator.ValidateStreamKey(request!.StreamKey) is { } keyError)
                return (null, Invalid("stream-key-invalid", keyError, "streamKey"));
            return (new LiveStreamKeyTarget(null, request.StreamKey!.Trim()), null);
        }

        var channelId = request!.ChannelId!.Trim();
        if (!IsAdmin() && !streams.AllowSavedKeysForNonAdmins)
        {
            logger.LogWarning("User {UserId} was refused the saved stream key of channel {ChannelId}: not an admin", currentUser.UserId, channelId);
            return (null, StatusCode(StatusCodes.Status403Forbidden, ApiResponse<LiveStreamStatus>.Fail(
                "Only admins can stream with a channel's saved key. Paste a stream key instead.",
                new ApiError("saved-keys-admin-only", "Saved keys are admin-only.", Field: "channelId"))));
        }

        if (await ValidateChannelAndDestinationAsync(channelId, destinationId, ct) is { } invalid)
            return (null, invalid);

        // Checked now so a missing or refused key is a prompt to reconfigure, not a failed stream later.
        var status = await keys.DescribeAsync(channelId, destinationId, ct);
        if (status.State == LiveStreamKeyState.Saved)
            return (new LiveStreamKeyTarget(channelId, null), null);

        var (code, message) = status.State == LiveStreamKeyState.Rejected
            ? ("stream-key-rejected", "YouTube refused this channel's saved stream key last time - it was probably reset. Set it again, or paste a key.")
            : ("stream-key-missing", "This channel has no saved stream key yet. Save one, or paste a key.");

        return (null, Conflict(ApiResponse<LiveStreamStatus>.Fail(message,
            new ApiError(code, message, Field: "channelId", Hint: "Settings → Channels → 🔑 Stream key"))));
    }

    private async Task<ActionResult?> ValidateChannelAndDestinationAsync(string channelId, string destinationId, CancellationToken ct)
    {
        if (!streams.Destinations.ContainsKey(destinationId))
            return Invalid("destination-invalid", "That destination isn't configured on this server.", "destinationId");

        var settings = await settingsRepository.GetAsync(ct);
        if (!LiveStreamValidator.IsValidId(channelId) || ChannelList(settings).All(c => c.Id != channelId))
            return Invalid("channel-invalid", "That channel doesn't exist.", "channelId");

        return null;
    }

    private static IEnumerable<(string Id, string Name, bool IsDefault)> ChannelList(Domain.Ai.AiSettings? settings) =>
    [
        (BrandChannel.DefaultId, settings?.DefaultChannelName ?? "Default", true),
        .. (settings?.Channels ?? []).Select(c => (c.Id, c.Name, false)),
    ];

    private List<LiveStreamDestination> DestinationList() =>
        streams.Destinations.Select(d => new LiveStreamDestination(d.Key, d.Value.Name, d.Value.KeyHelpUrl)).ToList();

    private bool IsAdmin() => AdminAccessRules.IsAdmitted(adminOptions.CurrentValue, HttpContext, User);

    private async Task<ActionResult?> RtmpsProblemAsync(CancellationToken ct)
    {
        try
        {
            if (await streams.SupportsRtmpsAsync(ct)) return null;
            return StatusCode(StatusCodes.Status503ServiceUnavailable, ApiResponse<LiveStreamStatus>.Fail(
                "This FFmpeg build can't stream over RTMPS.",
                new ApiError("rtmps-unsupported", "This FFmpeg build can't stream over RTMPS.",
                    Hint: "Install a full FFmpeg build (for example 'winget install Gyan.FFmpeg') and restart the API.")));
        }
        catch (RenderException ex) when (ex.Code is RenderErrorCode.RendererUnavailable)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, ApiResponse<LiveStreamStatus>.Fail(
                "FFmpeg isn't available on the API machine.",
                new ApiError("ffmpeg-missing", ex.UserMessage, Hint: "Install FFmpeg or set Ffmpeg:FfmpegPath, then restart the API.")));
        }
    }

    // ------------------------------------------------------------------ responses

    private ObjectResult Busy() =>
        StatusCode(StatusCodes.Status429TooManyRequests, ApiResponse<LiveStreamStatus>.Fail(
            $"This server is already sending {streams.MaxConcurrentStreams} live streams. Stop one first.",
            new ApiError("busy", "The live streamer is busy.")));

    private ObjectResult TooManyStreams() =>
        StatusCode(StatusCodes.Status429TooManyRequests, ApiResponse<LiveStreamStatus>.Fail(
            $"You already have {streams.MaxStreamsPerUser} streams. Delete one you no longer need first.",
            new ApiError("too-many-streams", "Too many streams.")));

    private NotFoundObjectResult StreamNotFound() =>
        NotFound(ApiResponse<LiveStreamStatus>.Fail("That stream has expired or doesn't exist.",
            new ApiError("not-found", "Live stream not found.")));

    private BadRequestObjectResult Invalid(string code, string message, string field) =>
        BadRequest(ApiResponse<LiveStreamStatus>.Fail(message, new ApiError(code, message, Field: field)));

    private string? RemoteAddress() => HttpContext.Connection.RemoteIpAddress?.ToString();

    private static bool TryReadJson<T>(string? json, out T? value) where T : class
    {
        value = null;
        if (string.IsNullOrWhiteSpace(json) || json.Length > MaxJsonFieldLength) return false;

        try
        {
            value = JsonSerializer.Deserialize<T>(json, Json);
            return value is not null;
        }
        catch (JsonException)
        {
            return false;
        }
    }

    private static async Task SaveAsync(IFormFile file, string path, CancellationToken ct)
    {
        await using var target = new FileStream(path, FileMode.CreateNew, FileAccess.Write);
        await file.CopyToAsync(target, ct);
    }

    private void TryDelete(string directory)
    {
        try
        {
            if (Directory.Exists(directory)) Directory.Delete(directory, recursive: true);
        }
        catch (Exception ex) when (ex is IOException or UnauthorizedAccessException)
        {
            logger.LogWarning(ex, "Could not remove live stream folder {Folder}", Path.GetFileName(directory));
        }
    }
}

public sealed record SaveStreamKeyRequest(string? StreamKey);
