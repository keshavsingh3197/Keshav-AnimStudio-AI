using AnimStudio.Api.Common;
using AnimStudio.Application.LiveStreams;
using AnimStudio.Domain.LiveStreams;
using Microsoft.AspNetCore.Mvc;

namespace AnimStudio.Api.Controllers;

/// <summary>
/// Saved Go Live setups: the playlist, settings and YouTube broadcast details a person uses
/// again and again. Saving one keeps no stream key; playing one is done by the page, which
/// fills itself from the preset and creates a new stream (and a new broadcast) each time.
/// </summary>
public sealed partial class LiveStreamsController
{
    [HttpGet("presets")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<LiveStreamPresetView>>>> ListPresets(CancellationToken ct)
    {
        var presets = await presetRepository.ListAsync(currentUser.UserId, ct);
        return Ok(ApiResponse<IReadOnlyList<LiveStreamPresetView>>.Ok(presets.Select(LiveStreamPresetView.From).ToList()));
    }

    [HttpPost("presets")]
    public async Task<ActionResult<ApiResponse<LiveStreamPresetView>>> CreatePreset(
        [FromBody] LiveStreamPresetRequest? request, CancellationToken ct)
    {
        if (PresetProblem(request) is { } invalid) return invalid;

        var existing = await presetRepository.ListAsync(currentUser.UserId, ct);
        if (existing.Count >= LiveStreamPresetValidator.MaxPresetsPerUser)
            return StatusCode(StatusCodes.Status429TooManyRequests, ApiResponse<LiveStreamPresetView>.Fail(
                $"You can keep at most {LiveStreamPresetValidator.MaxPresetsPerUser} presets. Delete one you no longer use first.",
                new ApiError("too-many-presets", "Too many presets.")));

        var now = DateTime.UtcNow;
        var preset = new LiveStreamPreset
        {
            Id = $"lsp_{Guid.NewGuid():n}",
            UserId = currentUser.UserId,
            CreatedAtUtc = now
        };
        Apply(preset, request!, now);
        await presetRepository.UpsertAsync(preset, ct);
        return Ok(ApiResponse<LiveStreamPresetView>.Ok(LiveStreamPresetView.From(preset)));
    }

    [HttpPut("presets/{id}")]
    public async Task<ActionResult<ApiResponse<LiveStreamPresetView>>> UpdatePreset(
        string id, [FromBody] LiveStreamPresetRequest? request, CancellationToken ct)
    {
        if (await OwnedPresetAsync(id, ct) is not { } preset) return PresetNotFound();
        if (PresetProblem(request) is { } invalid) return invalid;

        Apply(preset, request!, DateTime.UtcNow);
        await presetRepository.UpsertAsync(preset, ct);
        return Ok(ApiResponse<LiveStreamPresetView>.Ok(LiveStreamPresetView.From(preset)));
    }

    /// <summary>Records that the preset was played, so the most used ones come first.</summary>
    [HttpPost("presets/{id}/used")]
    public async Task<ActionResult<ApiResponse<LiveStreamPresetView>>> PresetUsed(string id, CancellationToken ct)
    {
        if (await OwnedPresetAsync(id, ct) is not { } preset) return PresetNotFound();

        preset.LastUsedAtUtc = DateTime.UtcNow;
        preset.Uses++;
        await presetRepository.UpsertAsync(preset, ct);
        return Ok(ApiResponse<LiveStreamPresetView>.Ok(LiveStreamPresetView.From(preset)));
    }

    [HttpDelete("presets/{id}")]
    public async Task<IActionResult> DeletePreset(string id, CancellationToken ct)
    {
        if (!LiveStreamValidator.IsValidId(id) || !await presetRepository.DeleteAsync(currentUser.UserId, id, ct))
            return PresetNotFound();
        return NoContent();
    }

    private async Task<LiveStreamPreset?> OwnedPresetAsync(string id, CancellationToken ct) =>
        LiveStreamValidator.IsValidId(id) ? await presetRepository.GetAsync(currentUser.UserId, id, ct) : null;

    private BadRequestObjectResult? PresetProblem(LiveStreamPresetRequest? request) =>
        LiveStreamPresetValidator.Validate(request, streams.Destinations.Keys.ToList()) is { } error
            ? BadRequest(ApiResponse<LiveStreamPresetView>.Fail(error, new ApiError("preset-invalid", error)))
            : null;

    private static void Apply(LiveStreamPreset preset, LiveStreamPresetRequest request, DateTime now)
    {
        var settings = request.Settings!;
        settings.Label = string.IsNullOrWhiteSpace(settings.Label) ? null : settings.Label.Trim();

        preset.Name = request.Name!.Trim();
        preset.Settings = settings;
        preset.Items = request.Items!;
        preset.KeyMode = request.KeyMode!;
        // Only what the key mode uses is kept; the stream key itself is never part of a preset.
        preset.ChannelId = request.KeyMode == "channel" ? request.ChannelId : null;
        preset.YouTube = request.KeyMode == "youtube" ? request.YouTube : null;
        preset.UpdatedAtUtc = now;
    }

    private NotFoundObjectResult PresetNotFound() =>
        NotFound(ApiResponse<LiveStreamPresetView>.Fail("That preset doesn't exist.",
            new ApiError("not-found", "Preset not found.")));
}
