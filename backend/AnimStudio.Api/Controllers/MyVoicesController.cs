using System.Text.RegularExpressions;
using AnimStudio.Api.Common;
using AnimStudio.Api.Contracts;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Abstractions.Rendering;
using AnimStudio.Application.Abstractions.Storage;
using AnimStudio.Application.Ai;
using AnimStudio.Application.LiveStreams;
using AnimStudio.Application.Security;
using AnimStudio.Domain.Voices;
using Microsoft.AspNetCore.Mvc;

namespace AnimStudio.Api.Controllers;

/// <summary>
/// The user's own voices for script voiceovers: a short sample of a real person, added with
/// their consent, that lines are re-voiced into. A voice belongs to the user and is offered in
/// every project; deleting it deletes the sample and every line converted into it.
/// </summary>
[ApiController]
[Route("api/voiceover/my-voices")]
public sealed class MyVoicesController(
    IVoiceProfileRepository voices,
    IObjectStore store,
    IMediaProbeService probe,
    ICurrentUser currentUser,
    TimeProvider clock,
    ILogger<MyVoicesController> logger) : ControllerBase
{
    private const long MaxSampleBytes = AssetsController.MaxUploadBytes;
    private const int MaxVoicesPerUser = 20;
    private const int MaxNameChars = 60;

    /// <summary>Shorter and the converter has too little to learn the voice from.</summary>
    private const double MinSampleSeconds = 4;
    private const double MaxSampleSeconds = 5 * 60;

    internal static readonly Regex IdPattern = new(@"^vp_[0-9a-f]{32}$", RegexOptions.CultureInvariant);

    private static readonly Regex BaseVoicePattern = new(@"^[A-Za-z0-9_.+\-]{1,64}$", RegexOptions.CultureInvariant);

    [HttpGet]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<MyVoiceResponse>>>> List(CancellationToken ct)
    {
        var mine = await voices.ListByUserAsync(currentUser.UserId, ct);
        return Ok(ApiResponse<IReadOnlyList<MyVoiceResponse>>.Ok([.. mine.Select(ToResponse)]));
    }

    /// <summary>
    /// Multipart: <c>file</c> is the sample (WAV, MP3, OGG, FLAC, or a browser recording in
    /// WebM/MP4), <c>name</c> what the picker shows, <c>baseVoiceId</c> the built-in voice that
    /// speaks the words before they are re-voiced, and <c>consent</c> must be true.
    /// </summary>
    [HttpPost]
    [RequestSizeLimit(MaxSampleBytes + 64 * 1024)]
    [RequestFormLimits(MultipartBodyLengthLimit = MaxSampleBytes + 64 * 1024)]
    public async Task<ActionResult<ApiResponse<MyVoiceResponse>>> Add(
        IFormFile? file, [FromForm] string? name, [FromForm] string? baseVoiceId, [FromForm] bool consent,
        CancellationToken ct)
    {
        if (!consent)
            return Fail(StatusCodes.Status400BadRequest, "consent-required",
                "Confirm this is your voice, or that its owner has agreed to it being used.", "consent");

        var label = (name ?? string.Empty).Trim();
        if (label.Length == 0 || label.Length > MaxNameChars || label.Any(char.IsControl))
            return Fail(StatusCodes.Status400BadRequest, "name-invalid", $"Give the voice a name of up to {MaxNameChars} characters.", "name");

        var baseVoice = (baseVoiceId ?? string.Empty).Trim();
        if (!BaseVoicePattern.IsMatch(baseVoice))
            return Fail(StatusCodes.Status400BadRequest, "voice-invalid", "Pick the voice that speaks the words.", "baseVoiceId");

        if (file is null || file.Length == 0)
            return Fail(StatusCodes.Status400BadRequest, "file-required", "Record or choose a sample of the voice.", "file");
        if (file.Length > MaxSampleBytes)
            return Fail(StatusCodes.Status400BadRequest, "file-too-large", "A sample can be at most 25MB. Half a minute is plenty.", "file");

        var existing = await voices.ListByUserAsync(currentUser.UserId, ct);
        if (existing.Count >= MaxVoicesPerUser)
            return Fail(StatusCodes.Status400BadRequest, "too-many-voices", $"You can keep up to {MaxVoicesPerUser} voices. Delete one first.");

        byte[] bytes;
        await using (var input = file.OpenReadStream())
        using (var buffer = new MemoryStream())
        {
            await input.CopyToAsync(buffer, ct);
            bytes = buffer.ToArray();
        }

        // The bytes decide what the file is; the declared type and name are never trusted.
        var (mimeType, extension) = SniffSample(bytes);
        if (mimeType is null)
            return Fail(StatusCodes.Status400BadRequest, "file-unsupported",
                "That file isn't a recording the studio can read (WAV, MP3, OGG, FLAC, WebM or MP4).", "file");

        var now = clock.GetUtcNow().UtcDateTime;
        var profile = new VoiceProfile
        {
            Id = $"vp_{Guid.NewGuid():n}",
            UserId = currentUser.UserId,
            Name = label,
            BaseVoiceId = baseVoice,
            MimeType = mimeType,
            FileSizeBytes = bytes.LongLength,
            ConsentAtUtc = now,
            CreatedAtUtc = now
        };
        profile.StorageKey = $"voice-profiles/{profile.Id}/sample{extension}";

        await using (var content = new MemoryStream(bytes, writable: false))
        {
            await store.SaveAsync(profile.StorageKey, content, mimeType, ct);
        }

        var duration = (await probe.ProbeAsync(profile.StorageKey, ct)).DurationSeconds;
        if (duration is not { } seconds || seconds < MinSampleSeconds || seconds > MaxSampleSeconds)
        {
            await store.DeleteAsync(profile.StorageKey, ct);
            return Fail(StatusCodes.Status400BadRequest, "sample-length",
                duration is null
                    ? "That recording couldn't be read. Try recording again, or upload a WAV or MP3."
                    : $"A sample must be {MinSampleSeconds:0}s to {MaxSampleSeconds / 60:0} minutes long; 15-30 seconds of clear speech works best.",
                "file");
        }
        profile.DurationSeconds = seconds;

        await voices.UpsertAsync(profile, ct);

        // Consent is a security-relevant event: who, when, which voice - never the sample or its name.
        logger.LogInformation("User {UserId} added voice {VoiceId} with consent at {ConsentAt:o}.",
            currentUser.UserId, profile.Id, profile.ConsentAtUtc);

        return Ok(ApiResponse<MyVoiceResponse>.Ok(ToResponse(profile)));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id, CancellationToken ct)
    {
        if (!IdPattern.IsMatch(id)) throw new KeyNotFoundException();

        var profile = await voices.GetAsync(id, ct) ?? throw new KeyNotFoundException();
        if (!string.Equals(profile.UserId, currentUser.UserId, StringComparison.Ordinal))
        {
            logger.LogWarning("User {UserId} tried to delete voice {VoiceId}, which is not theirs.", currentUser.UserId, id);
            throw new UnauthorizedAccessException();
        }

        await voices.DeleteAsync(id, ct);
        await store.DeleteAsync(profile.StorageKey, ct);
        foreach (var key in profile.CachedLineKeys) await store.DeleteAsync(key, ct);

        logger.LogInformation("User {UserId} deleted voice {VoiceId} and {Lines} converted line(s).",
            currentUser.UserId, id, profile.CachedLineKeys.Count);
        return NoContent();
    }

    internal static MyVoiceResponse ToResponse(VoiceProfile v) =>
        new(v.Id, v.Name, v.BaseVoiceId, v.DurationSeconds, v.CreatedAtUtc);

    private static (string? MimeType, string? Extension) SniffSample(byte[] bytes)
    {
        switch (AiAudioValidator.Sniff(bytes))
        {
            case AiAudioValidator.Wav: return (AiAudioValidator.Wav, ".wav");
            case AiAudioValidator.Mp3: return (AiAudioValidator.Mp3, ".mp3");
            case AiAudioValidator.Ogg: return (AiAudioValidator.Ogg, ".ogg");
            case AiAudioValidator.Flac: return (AiAudioValidator.Flac, ".flac");
        }
        if (CameraStreamValidator.StartsLike(CameraContainer.WebM, bytes)) return ("audio/webm", ".webm");
        if (CameraStreamValidator.StartsLike(CameraContainer.Mp4, bytes)) return ("audio/mp4", ".m4a");
        return (null, null);
    }

    private ObjectResult Fail(int status, string code, string message, string? field = null) =>
        StatusCode(status, ApiResponse<object>.Fail(message, new ApiError(code, message, field)));
}
