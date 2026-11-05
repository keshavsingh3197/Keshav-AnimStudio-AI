using System.Globalization;
using AnimStudio.Api.Common;
using AnimStudio.Api.Contracts;
using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Abstractions.Rendering;
using AnimStudio.Application.Ai;
using AnimStudio.Application.Rendering;
using AnimStudio.Application.Security;
using Microsoft.AspNetCore.Mvc;

namespace AnimStudio.Api.Controllers;

/// <summary>
/// The Animate Image page: a picture and what the person wants it to do, back as a short MP4 with a camera move and a
/// grade. The plan is read from their words by the configured text AI when there is one, and by keywords when there is
/// not, so the page works with no AI at all. Nothing is stored - the picture lives only as long as its render.
/// </summary>
[ApiController]
[Route("api/animate")]
public sealed class AnimateController(
    IImageAnimationRenderer renderer,
    IRenderCapabilities capabilities,
    IAiExecutor ai,
    IPromptLibrary prompts,
    IStudioAccessEvaluator access,
    ICurrentUser currentUser,
    ILogger<AnimateController> logger) : ControllerBase
{
    /// <summary>The picture plus the form fields.</summary>
    private const long MaxRequestBytes = ImageAnimation.MaxImageBytes + 64 * 1024;

    /// <summary>Each render holds a CPU-bound ffmpeg for seconds; more than this at once only slows them all.</summary>
    private static readonly SemaphoreSlim RenderSlots = new(2, 2);

    [HttpGet("capabilities")]
    public ActionResult<ApiResponse<AnimateCapabilitiesResponse>> Capabilities() =>
        Ok(ApiResponse<AnimateCapabilitiesResponse>.Ok(new AnimateCapabilitiesResponse(
            capabilities.IsAvailable && capabilities.Supports(RenderFeature.KenBurns),
            capabilities.UnavailableReason,
            ImageAnimation.MinSeconds,
            ImageAnimation.MaxSeconds,
            ImageAnimation.MaxImageBytes,
            ImageAnimation.Motions,
            ImageAnimation.Looks,
            ImageAnimation.Formats)));

    /// <summary>Turns "slowly zoom into her face, warm sunset look" into settings the page shows and can adjust.</summary>
    [HttpPost("plan")]
    public async Task<ActionResult<ApiResponse<AnimatePlanResponse>>> Plan(
        [FromBody] AnimatePlanRequest? request, CancellationToken ct)
    {
        var description = request?.Description?.Trim();
        if (string.IsNullOrEmpty(description))
            return BadRequest(ApiResponse<AnimatePlanResponse>.Fail(
                "Describe how the picture should move.",
                new ApiError("description-required", "Describe how the picture should move.", Field: "description")));
        if (description.Length > ImageAnimation.MaxDescriptionChars)
            return BadRequest(ApiResponse<AnimatePlanResponse>.Fail(
                "That description is too long.",
                new ApiError("description-too-long",
                    $"Keep the description to {ImageAnimation.MaxDescriptionChars} characters.", Field: "description")));

        var words = ImageAnimation.FromWords(description, request!.Format);
        if (!request.UseAi)
            return Ok(ApiResponse<AnimatePlanResponse>.Ok(ToResponse(words, "built-in", null)));

        var (allowed, reason) = access.CheckAiQuota(currentUser);
        if (!allowed)
            return Ok(ApiResponse<AnimatePlanResponse>.Ok(ToResponse(words, "built-in", reason)));

        var rendered = await prompts.RenderAsync(
            BuiltInPrompts.ImageMotionPlan,
            new Dictionary<string, string?> { ["description"] = description },
            ct);

        var outcome = await ai.TextAsync(new AiTextRequest
        {
            SystemPrompt = rendered.SystemPrompt,
            Prompt = rendered.Body,
            JsonSchema = rendered.OutputJsonSchema,
            PromptTemplateKey = rendered.TemplateKey,
            PromptTemplateVersion = rendered.Version,
            MaxOutputTokens = 400,
            Temperature = 0.3
        }, new AiCallContext(null, currentUser.UserId), ct);

        if (outcome.IsSuccess && ImageAnimation.Parse(outcome.Value!.Text, words) is { } planned)
        {
            logger.LogInformation("Planned an image animation with {Provider}.", outcome.Value.Provenance.ProviderId);
            return Ok(ApiResponse<AnimatePlanResponse>.Ok(
                ToResponse(planned, outcome.Value.Provenance.ProviderId.ToString(), null)));
        }

        var note = outcome.Kind == AiOutcomeKind.Unavailable
            ? "No AI text engine is set up, so the built-in reader planned this. Add a free Groq or Gemini key in Settings > AI providers for smarter plans."
            : "The AI engine couldn't plan this just now, so the built-in reader did.";
        return Ok(ApiResponse<AnimatePlanResponse>.Ok(ToResponse(words, "built-in", note)));
    }

    /// <summary>
    /// Multipart: <c>file</c> (PNG, JPEG or WebP - the bytes decide), and the plan's fields: <c>motion</c>,
    /// <c>intensity</c>, <c>focusX</c>, <c>focusY</c> (percent), <c>easing</c>, <c>look</c>, <c>vignette</c>,
    /// <c>grain</c>, <c>cinemaBars</c>, <c>durationSeconds</c> and <c>format</c>. Returns the MP4.
    /// </summary>
    [HttpPost("render")]
    [RequestSizeLimit(MaxRequestBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = MaxRequestBytes)]
    public async Task<IActionResult> Render(
        IFormFile? file,
        [FromForm] string? motion,
        [FromForm] string? intensity,
        [FromForm] string? focusX,
        [FromForm] string? focusY,
        [FromForm] string? easing,
        [FromForm] string? look,
        [FromForm] bool vignette,
        [FromForm] bool grain,
        [FromForm] bool cinemaBars,
        [FromForm] string? durationSeconds,
        [FromForm] string? format,
        CancellationToken ct)
    {
        if (!capabilities.IsAvailable || !capabilities.Supports(RenderFeature.KenBurns))
            return Fail(StatusCodes.Status503ServiceUnavailable, "renderer-unavailable",
                "Video rendering isn't available on this server right now.");

        if (file is null || file.Length == 0)
            return Fail(StatusCodes.Status400BadRequest, "file-required", "Choose a picture to animate.");
        if (file.Length > ImageAnimation.MaxImageBytes)
            return Fail(StatusCodes.Status400BadRequest, "file-too-large",
                $"Pictures can be up to {ImageAnimation.MaxImageBytes / (1024 * 1024)} MB.");

        var seconds = ImageAnimation.ClampSeconds(Number(durationSeconds, ImageAnimation.DefaultSeconds));
        var (allowed, reason) = access.CheckRenderQuota(currentUser, seconds);
        if (!allowed)
            return Fail(StatusCodes.Status403Forbidden, "render-not-allowed", reason ?? "Rendering isn't allowed.");

        byte[] bytes;
        await using (var stream = file.OpenReadStream())
        using (var buffer = new MemoryStream((int)file.Length))
        {
            await stream.CopyToAsync(buffer, ct);
            bytes = buffer.ToArray();
        }

        // The bytes decide, never the name or the browser's claim.
        var extension = AiImageValidator.Sniff(bytes) switch
        {
            AiImageValidator.Png => ".png",
            AiImageValidator.Jpeg => ".jpg",
            AiImageValidator.WebP => ".webp",
            _ => null
        };
        if (extension is null)
            return Fail(StatusCodes.Status400BadRequest, "file-not-image", "That file isn't a PNG, JPEG or WebP picture.");

        var plan = new ImageMotionPlan(
            motion ?? "zoom-in",
            Number(intensity, CinematicImageSettings.DefaultIntensity),
            Number(focusX, 50),
            Number(focusY, 50),
            easing ?? "ease-in-out",
            look ?? "none",
            vignette, grain, cinemaBars, seconds,
            format ?? "landscape",
            string.Empty);
        var settings = ImageAnimation.Settings(plan);

        if (!await RenderSlots.WaitAsync(TimeSpan.FromSeconds(30), ct))
            return Fail(StatusCodes.Status429TooManyRequests, "animate-busy",
                "Other pictures are being animated right now. Try again in a minute.");

        byte[] video;
        try
        {
            video = await renderer.RenderAsync(bytes, extension, settings, ImageAnimation.CanvasFor(format), seconds, ct);
        }
        finally
        {
            RenderSlots.Release();
        }

        logger.LogInformation("Animated an image: {Motion}, {Seconds}s, {Bytes} bytes.",
            ImageAnimation.MotionId(settings.Motion), seconds, video.Length);

        Response.Headers.XContentTypeOptions = "nosniff";
        Response.Headers.CacheControl = "no-store";
        return File(video, "video/mp4", "animated.mp4");
    }

    private ObjectResult Fail(int status, string code, string message) =>
        StatusCode(status, ApiResponse<EmptyPayload>.Fail(message, new ApiError(code, message)));

    /// <summary>Form numbers are read invariantly: a server in a comma-decimal locale must not read "0.15" as 15.</summary>
    private static double Number(string? value, double fallback) =>
        double.TryParse(value, NumberStyles.Float, CultureInfo.InvariantCulture, out var n) && double.IsFinite(n)
            ? n
            : fallback;

    private static AnimatePlanResponse ToResponse(ImageMotionPlan plan, string plannedBy, string? note) => new(
        plan.Motion, plan.Intensity, plan.FocusX, plan.FocusY, plan.Easing, plan.Look,
        plan.Vignette, plan.Grain, plan.CinemaBars, plan.DurationSeconds, plan.Format, plan.Summary,
        plannedBy, note);
}
