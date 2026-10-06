using System.Text.Json;
using AnimStudio.Api.Common;
using AnimStudio.Application.Releases;
using AnimStudio.Application.Security;
using AnimStudio.Domain.Errors;
using AnimStudio.Infrastructure.Releases;
using AnimStudio.Infrastructure.Storage;
using Microsoft.AspNetCore.Mvc;

namespace AnimStudio.Api.Controllers;

/// <summary>
/// Music release preparation: turns a finished song into the files and metadata a
/// distributor asks for. Delivery to the stores themselves stays with the distributor -
/// they require a contract this app does not have - so the output is a kit to upload there.
/// </summary>
[ApiController]
[Route("api/releases")]
public sealed class ReleaseKitController(
    FfmpegReleaseKitBuilder builder,
    ReleaseKitStore kits,
    ICurrentUser currentUser,
    AppDataPaths dataPaths,
    TimeProvider clock,
    ILogger<ReleaseKitController> logger) : ControllerBase
{
    private const long MaxRequestBytes = ReleaseUploadValidator.MaxAudioBytes + ReleaseUploadValidator.MaxCoverBytes + 1024 * 1024;
    private const int MaxJsonFieldLength = 64 * 1024;

    // A full-song visualizer is a long encode; two at once is what one machine handles
    // without starving the render queue.
    private static readonly SemaphoreSlim BuildSlots = new(2, 2);

    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    /// <summary>
    /// Builds a release kit from an uploaded song, its cover, and its metadata. The caller
    /// must confirm they hold the rights; nothing is built otherwise.
    /// </summary>
    [HttpPost("kits")]
    [RequestSizeLimit(MaxRequestBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = MaxRequestBytes)]
    public async Task<ActionResult<ApiResponse<ReleaseKitResult>>> CreateKit(
        [FromForm] IFormFile? audio,
        [FromForm] IFormFile? cover,
        [FromForm] string? metadata,
        [FromForm] string? options,
        CancellationToken ct)
    {
        var userId = currentUser.UserId;

        if (!TryReadJson(metadata, out ReleaseMetadata? parsedMetadata))
            return Invalid("metadata-invalid", "The release details could not be read.", "metadata");

        ReleaseKitOptions? parsedOptions = new();
        if (!string.IsNullOrWhiteSpace(options) && !TryReadJson(options, out parsedOptions))
            return Invalid("options-invalid", "The master settings could not be read.", "options");
        parsedOptions ??= new ReleaseKitOptions();

        if (ReleaseUploadValidator.ValidateOptions(parsedOptions) is { } optionsError)
            return Invalid("options-invalid", optionsError, "options");

        var today = DateOnly.FromDateTime(clock.GetUtcNow().UtcDateTime);
        var validation = ReleaseMetadataValidator.Validate(parsedMetadata, today);
        if (!validation.IsValid)
        {
            return BadRequest(ApiResponse<ReleaseKitResult>.Fail(
                validation.Errors[0].Message,
                validation.Errors.Select(e => new ApiError(e.Code, e.Message, Field: e.Field)).ToArray()));
        }

        if (audio is null)
            return Invalid("audio-missing", "Choose the audio file for this release.", "audio");

        ReleaseUploadValidator.AudioCheck audioCheck;
        await using (var audioStream = audio.OpenReadStream())
            audioCheck = await ReleaseUploadValidator.ValidateAudioAsync(audio.FileName, audio.Length, audioStream, ct);
        if (!audioCheck.IsValid)
            return Invalid(audioCheck.Code!, audioCheck.Message!, "audio");

        string? coverExtension = null;
        if (cover is not null)
        {
            await using var coverStream = cover.OpenReadStream();
            var coverCheck = await ReleaseUploadValidator.ValidateCoverAsync(cover.FileName, cover.ContentType, cover.Length, coverStream, ct);
            if (!coverCheck.IsValid)
                return Invalid(coverCheck.Code ?? "cover-invalid", coverCheck.Message ?? "That cover image can't be used.", "cover");
            coverExtension = coverCheck.CanonicalExtension;
        }

        if (!await BuildSlots.WaitAsync(TimeSpan.Zero, ct))
        {
            return StatusCode(StatusCodes.Status429TooManyRequests, ApiResponse<ReleaseKitResult>.Fail(
                "Two release kits are already being built. Try again in a few minutes.",
                new ApiError("busy", "The release kit builder is busy.")));
        }

        kits.PurgeExpired();

        var jobId = Guid.NewGuid().ToString("n");
        var workDir = Path.Combine(dataPaths.Releases, jobId);

        try
        {
            Directory.CreateDirectory(workDir);

            // Generated names only: the client's file name never decides where a file lands.
            var audioFile = "source" + audioCheck.Extension;
            await SaveAsync(audio, Path.Combine(workDir, audioFile), ct);

            string? coverFile = null;
            if (cover is not null)
            {
                coverFile = "cover_source" + coverExtension;
                await SaveAsync(cover, Path.Combine(workDir, coverFile), ct);
            }

            logger.LogInformation("Release kit {JobId} started for user {UserId}", jobId, userId);

            var result = await builder.BuildAsync(new ReleaseKitBuildRequest(
                jobId, workDir, audioFile, audioCheck.Lossless, coverFile,
                validation.Normalized, parsedOptions, validation.Warnings), ct);

            // The uploads are not part of the kit and are not kept.
            System.IO.File.Delete(Path.Combine(workDir, audioFile));
            if (coverFile is not null) System.IO.File.Delete(Path.Combine(workDir, coverFile));

            kits.Add(jobId, new ReleaseKitTicket(userId, workDir,
                result.Files.Select(f => f.Name).ToHashSet(StringComparer.Ordinal), clock.GetUtcNow().UtcDateTime));

            logger.LogInformation("Release kit {JobId} finished with {FileCount} files", jobId, result.Files.Count);
            return Ok(ApiResponse<ReleaseKitResult>.Ok(result));
        }
        catch (ReleaseKitException ex)
        {
            TryDelete(workDir);
            return UnprocessableEntity(ApiResponse<ReleaseKitResult>.Fail(ex.Message, new ApiError(ex.Code, ex.Message)));
        }
        catch (RenderException ex) when (ex.Code is RenderErrorCode.RendererUnavailable)
        {
            TryDelete(workDir);
            return StatusCode(StatusCodes.Status503ServiceUnavailable, ApiResponse<ReleaseKitResult>.Fail(
                "FFmpeg isn't available on the API machine.",
                new ApiError("ffmpeg-missing", ex.UserMessage, Hint: "Install FFmpeg or set Ffmpeg:FfmpegPath, then restart the API.")));
        }
        catch (RenderException ex) when (ex.Code is RenderErrorCode.Timeout)
        {
            TryDelete(workDir);
            return StatusCode(StatusCodes.Status504GatewayTimeout, ApiResponse<ReleaseKitResult>.Fail(
                "Building the release kit took too long and was stopped.",
                new ApiError("timeout", ex.UserMessage)));
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            TryDelete(workDir);
            logger.LogError(ex, "Release kit {JobId} failed", jobId);
            return StatusCode(StatusCodes.Status500InternalServerError, ApiResponse<ReleaseKitResult>.Fail(
                "Building the release kit failed. Check the Logs page for details.",
                new ApiError("release-kit-failed", "Building the release kit failed.")));
        }
        catch (OperationCanceledException)
        {
            TryDelete(workDir);
            throw;
        }
        finally
        {
            BuildSlots.Release();
        }
    }

    /// <summary>One file from a finished kit. Only the caller's own kits, and only files the kit lists.</summary>
    [HttpGet("kits/{jobId}/files/{name}")]
    public IActionResult DownloadFile(string jobId, string name)
    {
        var kit = kits.TryGetOwned(jobId, currentUser.UserId);
        if (kit is null) return KitNotFound();

        // The kit's own file list is the allowlist, so a name can never point outside it.
        if (ReleaseKitStore.FilePath(kit, name) is not { } path
            || !FfmpegReleaseKitBuilder.KitFiles.TryGetValue(name, out var info))
            return KitNotFound();

        var stream = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.Read, 4096, FileOptions.Asynchronous);
        return File(stream, info.Mime, name, enableRangeProcessing: true);
    }

    private NotFoundObjectResult KitNotFound() =>
        NotFound(ApiResponse<string>.Fail("That release kit has expired or doesn't exist.",
            new ApiError("not-found", "Release kit not found.")));

    private BadRequestObjectResult Invalid(string code, string message, string field) =>
        BadRequest(ApiResponse<ReleaseKitResult>.Fail(message, new ApiError(code, message, Field: field)));

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
        catch (IOException ex)
        {
            logger.LogWarning(ex, "Could not remove release kit folder {Folder}", Path.GetFileName(directory));
        }
        catch (UnauthorizedAccessException ex)
        {
            logger.LogWarning(ex, "Could not remove release kit folder {Folder}", Path.GetFileName(directory));
        }
    }
}
