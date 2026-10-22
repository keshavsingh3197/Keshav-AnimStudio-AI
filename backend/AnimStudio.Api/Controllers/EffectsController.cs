using AnimStudio.Api.Common;
using AnimStudio.Api.Contracts;
using AnimStudio.Application.Effects;
using AnimStudio.Application.Security;
using Microsoft.AspNetCore.Mvc;

namespace AnimStudio.Api.Controllers;

/// <summary>
/// The caller's effects library: subscribe buttons, stingers, end screens, lower thirds,
/// sound effects and green-screen clips, uploaded once and reused in every project. Every
/// effect is the caller's own; <see cref="EffectLibraryService"/> checks ownership of the
/// effect - and of the project, where one is named - on every request.
/// </summary>
[ApiController]
[Route("api/effects")]
public sealed class EffectsController(
    EffectLibraryService library,
    ICurrentUser currentUser) : ControllerBase
{
    /// <summary>The request ceiling: the video limit plus room for the form fields.</summary>
    private const long MaxRequestBytes = EffectRules.MaxVideoBytes + 64 * 1024;

    /// <summary>The caller's effects, favourites first, then most used, then newest.</summary>
    [HttpGet]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<EffectClipResponse>>>> List(
        [FromQuery] string? category, [FromQuery] string? kind, [FromQuery] string? q, [FromQuery] bool favorites,
        CancellationToken ct)
    {
        var query = new EffectQuery(EffectRules.ParseCategory(category), EffectRules.ParseKind(kind), q, favorites);
        var list = await library.ListAsync(currentUser.UserId, query, ct);
        return Ok(ApiResponse<IReadOnlyList<EffectClipResponse>>.Ok([.. list.Select(e => e.ToResponse())]));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<EffectClipResponse>>> Get(string id, CancellationToken ct) =>
        Ok(ApiResponse<EffectClipResponse>.Ok((await library.GetAsync(id, currentUser.UserId, ct)).ToResponse()));

    /// <summary>
    /// Multipart: <c>file</c> (MP4, WebM, MOV, PNG, JPG, WEBP, MP3, WAV or M4A), and optionally
    /// <c>name</c>, <c>category</c>, <c>tags</c> (repeated or comma-separated) and
    /// <c>isGreenScreen</c>. The file's bytes decide its type.
    /// </summary>
    [HttpPost]
    [RequestSizeLimit(MaxRequestBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = MaxRequestBytes)]
    public async Task<ActionResult<ApiResponse<EffectClipResponse>>> Upload(
        IFormFile? file,
        [FromForm] string? name,
        [FromForm] string? category,
        [FromForm] List<string>? tags,
        [FromForm] bool isGreenScreen,
        CancellationToken ct)
    {
        if (file is null || file.Length == 0)
            return BadRequest(ApiResponse<EffectClipResponse>.Fail(
                "Choose a file to upload.", new ApiError("file-required", "Choose a file to upload.")));

        var splitTags = tags?
            .SelectMany(t => (t ?? string.Empty).Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries))
            .Take(EffectRules.MaxTags + 1)
            .ToList();

        var effect = await library.AddAsync(currentUser.UserId, new EffectUploadCommand(
            string.IsNullOrWhiteSpace(name) ? null : name,
            category,
            splitTags,
            isGreenScreen,
            file.FileName,
            file.ContentType,
            file.Length,
            file.OpenReadStream), ct);

        return Ok(ApiResponse<EffectClipResponse>.Ok(effect.ToResponse()));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<EffectClipResponse>>> Update(
        string id, [FromBody] EffectUpdateRequest request, CancellationToken ct)
    {
        var effect = await library.UpdateAsync(id, currentUser.UserId, request.ToCommand(), ct);
        return Ok(ApiResponse<EffectClipResponse>.Ok(effect.ToResponse()));
    }

    /// <summary>Deletes the effect and its file. Copies already added to projects stay in them.</summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<EmptyPayload>>> Delete(string id, CancellationToken ct)
    {
        await library.DeleteAsync(id, currentUser.UserId, ct);
        return Ok(ApiResponse<EmptyPayload>.Ok(EmptyPayload.Value));
    }

    /// <summary>
    /// The effect's file, for previews. Safe inline: only sniffed video, still and audio types
    /// are ever stored, and nosniff stops a browser deciding otherwise. Range requests are
    /// honoured when the store's stream can seek, so a long clip can be scrubbed.
    /// </summary>
    [HttpGet("{id}/content")]
    [HttpHead("{id}/content")]
    public Task<IActionResult> Content(string id, CancellationToken ct) => ServeAsync(id, thumbnail: false, ct);

    /// <summary>A still for the card: a frame of a video, or the still itself. 404 for a sound.</summary>
    [HttpGet("{id}/thumbnail")]
    [HttpHead("{id}/thumbnail")]
    public Task<IActionResult> Thumbnail(string id, CancellationToken ct) => ServeAsync(id, thumbnail: true, ct);

    /// <summary>
    /// Adds the effect to one of the caller's projects as an ordinary asset the editor can
    /// place, and counts the use. The same effect added to the same project again returns the
    /// copy already there.
    /// </summary>
    [HttpPost("{id}/use")]
    public async Task<ActionResult<ApiResponse<EffectUseResponse>>> Use(
        string id, [FromBody] EffectUseRequest request, CancellationToken ct)
    {
        var result = await library.UseInProjectAsync(id, currentUser.UserId, request.ProjectId, ct);
        return Ok(ApiResponse<EffectUseResponse>.Ok(
            new EffectUseResponse(result.Asset.ToResponse(), result.Effect.ToResponse(), result.Reused)));
    }

    /// <summary>Saves a file from one of the caller's projects to the library.</summary>
    [HttpPost("from-asset")]
    public async Task<ActionResult<ApiResponse<EffectClipResponse>>> FromAsset(
        [FromBody] EffectFromAssetRequest request, CancellationToken ct)
    {
        var effect = await library.SaveFromAssetAsync(
            currentUser.UserId, request.ProjectId, request.AssetId, request.Category, ct);
        return Ok(ApiResponse<EffectClipResponse>.Ok(effect.ToResponse()));
    }

    private async Task<IActionResult> ServeAsync(string id, bool thumbnail, CancellationToken ct)
    {
        try
        {
            var (stream, type) = await library.OpenAsync(id, currentUser.UserId, thumbnail, ct);

            Response.Headers.XContentTypeOptions = "nosniff";
            // The caller's own file: a shared cache must never keep it.
            Response.Headers.CacheControl = "private, max-age=3600";
            return File(stream, type, enableRangeProcessing: stream.CanSeek);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            // The player moved on (a hover preview ended); nothing to answer.
            return new EmptyResult();
        }
    }
}
