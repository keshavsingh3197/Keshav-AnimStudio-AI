using System.Text;
using AnimStudio.Api.Common;
using AnimStudio.Api.Contracts;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Abstractions.Storage;
using AnimStudio.Application.Abstractions.StoryAgent;
using AnimStudio.Application.Options;
using AnimStudio.Application.Security;
using AnimStudio.Application.StoryAgent;
using AnimStudio.Application.StoryAgent.Stages;
using AnimStudio.Domain.Jobs;
using AnimStudio.Domain.Stories;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.Extensions.Options;

namespace AnimStudio.Api.Controllers;

/// <summary>
/// The Story Agent: a title in, a researched, narrated video and its YouTube details out. A run belongs to the person who
/// started it and every call here is checked against that; a run that is someone else's answers exactly as one that does
/// not exist. Nothing is published by the run itself: it ends with a project, a render and a kit, and the person puts the
/// video on YouTube through the ordinary publish dialog. Here they can then add the story's subtitles to that video.
/// </summary>
[ApiController]
[StoryRunErrors]
[Route("api/story-agent")]
public sealed class StoryAgentController(
    StoryRunService stories,
    IRenderJobRepository jobs,
    IProjectRepository projects,
    IObjectStore store,
    IOptionsMonitor<AdminOptions> adminOptions,
    ICurrentUser currentUser,
    IStoryPublishing publishing,
    StoryCaptionPublisher captions) : ControllerBase
{
    private const long MaxImageRequestBytes = VisualsStage.MaxImageBytes + 64 * 1024;
    private const long MaxVideoRequestBytes = StoryRunService.MaxVideoBytes + 64 * 1024;
    private const long MaxMusicRequestBytes = StoryRunService.MaxMusicBytes + 64 * 1024;

    // Bodies are refused by size before they are read. A non-ASCII character can arrive as a six-byte \uXXXX escape,
    // so the biggest bodies are bounded at six bytes for every character the service would accept.
    private const long MaxBriefRequestBytes = 64 * 1024;
    private const long MaxReplyRequestBytes = StoryRunService.MaxScriptReplyChars * 6L + 16 * 1024;
    private const long MaxScriptRequestBytes = 4 * 1024 * 1024;
    private const long MaxSmallRequestBytes = 16 * 1024;

    // ------------------------------------------------------------------------------------------------ reading

    /// <summary>What this server can do, and the choices to offer: built-in stories, topics, the person's voices.</summary>
    [HttpGet("options")]
    public async Task<ActionResult<ApiResponse<StoryAgentOptionsResponse>>> Options(CancellationToken ct) =>
        Ok(ApiResponse<StoryAgentOptionsResponse>.Ok(
            StoryAgentMapper.ToResponse(await stories.DescribeAsync(currentUser.UserId, ct))));

    [HttpGet("runs")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<StoryRunSummaryResponse>>>> List(CancellationToken ct)
    {
        var mine = await stories.ListAsync(currentUser.UserId, ct);

        // One read of the person's uploads for the whole list, matched to each story by its project.
        var uploads = mine.Any(r => !string.IsNullOrEmpty(r.ProjectId)) && currentUser.IsAuthenticated
            ? await publishing.ListAsync(currentUser.UserId, null, ct)
            : [];
        var byProject = uploads.GroupBy(p => p.ProjectId, StringComparer.Ordinal)
            .ToDictionary(g => g.Key, g => (IReadOnlyList<StoryPublication>)[.. g], StringComparer.Ordinal);

        return Ok(ApiResponse<IReadOnlyList<StoryRunSummaryResponse>>.Ok([.. mine.Select(run =>
            StoryAgentMapper.ToSummary(run,
                run.ProjectId is { Length: > 0 } project && byProject.TryGetValue(project, out var videos) ? videos : []))]));
    }

    /// <summary>One run in full. This is what the page polls while a story is being made.</summary>
    [HttpGet("runs/{id}")]
    public async Task<ActionResult<ApiResponse<StoryRunResponse>>> Get(string id, CancellationToken ct) =>
        await DetailAsync(await stories.GetAsync(currentUser.UserId, id, ct), ct);

    /// <summary>The prompt to paste into any chat when the script is to be written by hand.</summary>
    [HttpGet("runs/{id}/prompt")]
    public async Task<ActionResult<ApiResponse<StoryPromptResponse>>> Prompt(string id, CancellationToken ct) =>
        Ok(ApiResponse<StoryPromptResponse>.Ok(new(await stories.ManualPromptAsync(currentUser.UserId, id, ct))));

    // ------------------------------------------------------------------------------------------------ starting

    [HttpPost("runs")]
    [RequestSizeLimit(MaxBriefRequestBytes)]
    public async Task<ActionResult<ApiResponse<StoryRunResponse>>> Create(
        [FromBody] CreateStoryRunRequest request, CancellationToken ct)
    {
        if (await GuestRefusalAsync(ct) is { } refused) return refused;

        var brief = new StoryBrief
        {
            Title = request.Title ?? string.Empty,
            Notes = request.Notes,
            Language = request.Language ?? "hi",
            TargetSeconds = request.TargetSeconds,
            Format = request.Format,
            Writer = request.Writer,
            PackId = request.PackId
        };

        var run = await stories.CreateAsync(currentUser.UserId, brief, request.Options?.ToOptions(), ct);
        return await DetailAsync(run, ct);
    }

    // ------------------------------------------------------------------------------------------------ the script

    /// <summary>Gives a run its script from the reply a chat wrote.</summary>
    [HttpPost("runs/{id}/script/paste")]
    [RequestSizeLimit(MaxReplyRequestBytes)]
    public async Task<ActionResult<ApiResponse<StoryRunResponse>>> Paste(
        string id, [FromBody] PasteStoryScriptRequest request, CancellationToken ct) =>
        await DetailAsync(await stories.SubmitScriptAsync(currentUser.UserId, id, request.Reply, ct), ct);

    /// <summary>Saves the person's edits to the script. The script is checked again, so what they see stays true.</summary>
    [HttpPut("runs/{id}/script")]
    [RequestSizeLimit(MaxScriptRequestBytes)]
    public async Task<ActionResult<ApiResponse<StoryRunResponse>>> Edit(
        string id, [FromBody] EditStoryScriptRequest request, CancellationToken ct) =>
        await DetailAsync(await stories.UpdateScriptAsync(currentUser.UserId, id, request.ToEdit(), ct), ct);

    /// <summary>"Go with this script": marks the words as approved. Nothing is made until Build.</summary>
    [HttpPost("runs/{id}/script/approve")]
    public async Task<ActionResult<ApiResponse<StoryRunResponse>>> Approve(string id, CancellationToken ct) =>
        await DetailAsync(await stories.ApproveScriptAsync(currentUser.UserId, id, ct), ct);

    /// <summary>Throws the script away and writes it again from the same research, by the model or by hand.</summary>
    [HttpPost("runs/{id}/script/rewrite")]
    [RequestSizeLimit(MaxSmallRequestBytes)]
    public async Task<ActionResult<ApiResponse<StoryRunResponse>>> Rewrite(
        string id, [FromBody(EmptyBodyBehavior = EmptyBodyBehavior.Allow)] RewriteStoryScriptRequest? request,
        CancellationToken ct) =>
        await DetailAsync(await stories.RewriteAsync(currentUser.UserId, id, request?.Writer, ct), ct);

    // ------------------------------------------------------------------------------------------------ pictures

    /// <summary>Multipart: <c>file</c> is a PNG, JPEG or WebP. What it is is decided from its bytes, never from its name.</summary>
    [HttpPut("runs/{id}/scenes/{number:int}/image")]
    [RequestSizeLimit(MaxImageRequestBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = MaxImageRequestBytes)]
    public async Task<ActionResult<ApiResponse<StoryRunResponse>>> AttachImage(
        string id, int number, IFormFile? file, CancellationToken ct)
    {
        if (file is null || file.Length == 0)
            throw new StoryRunException(StoryRunErrorKind.Invalid, "image-required", "Choose a picture for the scene.", "file");
        if (file.Length > VisualsStage.MaxImageBytes)
            throw new StoryRunException(StoryRunErrorKind.Invalid, "image-too-large", $"A picture can be at most {VisualsStage.MaxImageBytes / 1024 / 1024} MB.", "file");

        byte[] bytes;
        await using (var input = file.OpenReadStream())
        using (var buffer = new MemoryStream())
        {
            await input.CopyToAsync(buffer, ct);
            bytes = buffer.ToArray();
        }

        return await DetailAsync(await stories.AttachImageAsync(currentUser.UserId, id, number, bytes, file.FileName, ct), ct);
    }

    [HttpDelete("runs/{id}/scenes/{number:int}/image")]
    public async Task<ActionResult<ApiResponse<StoryRunResponse>>> RemoveImage(string id, int number, CancellationToken ct) =>
        await DetailAsync(await stories.RemoveImageAsync(currentUser.UserId, id, number, ct), ct);

    /// <summary>Multipart: <c>file</c> is an MP4 clip (from Google Flow, Veo or a phone), played in place of the scene's picture.</summary>
    [HttpPut("runs/{id}/scenes/{number:int}/video")]
    [RequestSizeLimit(MaxVideoRequestBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = MaxVideoRequestBytes)]
    public async Task<ActionResult<ApiResponse<StoryRunResponse>>> AttachVideo(
        string id, int number, IFormFile? file, CancellationToken ct)
    {
        if (file is null || file.Length == 0)
            throw new StoryRunException(StoryRunErrorKind.Invalid, "video-required", "Choose a clip for the scene.", "file");
        if (file.Length > StoryRunService.MaxVideoBytes)
            throw new StoryRunException(StoryRunErrorKind.Invalid, "video-too-large", $"A clip can be at most {StoryRunService.MaxVideoBytes / 1024 / 1024} MB.", "file");

        byte[] bytes;
        await using (var input = file.OpenReadStream())
        using (var buffer = new MemoryStream())
        {
            await input.CopyToAsync(buffer, ct);
            bytes = buffer.ToArray();
        }

        return await DetailAsync(await stories.AttachVideoAsync(currentUser.UserId, id, number, bytes, file.FileName, ct), ct);
    }

    [HttpDelete("runs/{id}/scenes/{number:int}/video")]
    public async Task<ActionResult<ApiResponse<StoryRunResponse>>> RemoveVideo(string id, int number, CancellationToken ct) =>
        await DetailAsync(await stories.RemoveVideoAsync(currentUser.UserId, id, number, ct), ct);

    /// <summary>
    /// A scene's picture, for the page to show. It is read through the run - not by a key the caller names - so only the
    /// run's own owner gets it, and only a file that belongs to the run.
    /// </summary>
    [HttpGet("runs/{id}/scenes/{number:int}/image")]
    public async Task<IActionResult> Image(string id, int number, CancellationToken ct)
    {
        var run = await stories.GetAsync(currentUser.UserId, id, ct);
        var key = run.Script?.Scenes.FirstOrDefault(s => s.Number == number)?.ImageKey;
        if (!StoryObjectKeys.Owns(run.Id, key))
            throw new StoryRunException(StoryRunErrorKind.NotFound, "image-not-found", "That scene has no picture yet.");

        var stream = await store.OpenAsync(key!, ct)
            ?? throw new StoryRunException(StoryRunErrorKind.NotFound, "image-not-found", "That scene has no picture yet.");

        // The picture can be replaced at any time, so the browser is not to keep one.
        Response.Headers.CacheControl = "private, no-store";
        Response.Headers.XContentTypeOptions = "nosniff";
        return File(stream, ContentTypeOf(key!));
    }

    // ------------------------------------------------------------------------------------------------ building

    /// <summary>Approves the script and starts making the video. Options in the body replace the ones the run started with.</summary>
    [HttpPost("runs/{id}/build")]
    [RequestSizeLimit(MaxBriefRequestBytes)]
    public async Task<ActionResult<ApiResponse<StoryRunResponse>>> Build(
        string id, [FromBody(EmptyBodyBehavior = EmptyBodyBehavior.Allow)] StoryBuildOptionsRequest? request,
        CancellationToken ct) =>
        await DetailAsync(await stories.BuildAsync(currentUser.UserId, id, request?.ToOptions(), ct), ct);

    /// <summary>Starts a story that failed or was stopped again, from the step it stopped at.</summary>
    [HttpPost("runs/{id}/retry")]
    public async Task<ActionResult<ApiResponse<StoryRunResponse>>> Retry(string id, CancellationToken ct) =>
        await DetailAsync(await stories.RetryAsync(currentUser.UserId, id, ct), ct);

    [HttpPost("runs/{id}/cancel")]
    public async Task<ActionResult<ApiResponse<StoryRunResponse>>> Cancel(string id, CancellationToken ct) =>
        await DetailAsync(await stories.CancelAsync(currentUser.UserId, id, ct), ct);

    // ------------------------------------------------------------------------------------------------ reviewing what was made

    /// <summary>
    /// "This is good, go on": approves the step the build is waiting on - <c>voice</c>, <c>music</c> or <c>video</c> - and
    /// lets the build carry on from it.
    /// </summary>
    [HttpPost("runs/{id}/review/{step}/approve")]
    [RequestSizeLimit(MaxSmallRequestBytes)]
    public async Task<ActionResult<ApiResponse<StoryRunResponse>>> ApproveReview(
        string id, string step, [FromBody(EmptyBodyBehavior = EmptyBodyBehavior.Allow)] ApproveStoryReviewRequest? request,
        CancellationToken ct) =>
        await DetailAsync(await stories.ApproveReviewAsync(currentUser.UserId, id, ReviewStage(step), ct, request?.MusicVolume), ct);

    /// <summary>Makes the narration again: chosen scenes as new takes, or all of it in a changed voice, delivery or speed.</summary>
    [HttpPost("runs/{id}/narration/redo")]
    [RequestSizeLimit(MaxSmallRequestBytes)]
    public async Task<ActionResult<ApiResponse<StoryRunResponse>>> RedoNarration(
        string id, [FromBody(EmptyBodyBehavior = EmptyBodyBehavior.Allow)] RedoStoryNarrationRequest? request, CancellationToken ct) =>
        await DetailAsync(await stories.RedoNarrationAsync(currentUser.UserId, id, (request ?? new()).ToRedo(), ct), ct);

    /// <summary>Makes the music again from a new brief, style or source, or takes it away.</summary>
    [HttpPost("runs/{id}/music/redo")]
    [RequestSizeLimit(MaxBriefRequestBytes)]
    public async Task<ActionResult<ApiResponse<StoryRunResponse>>> RedoMusic(
        string id, [FromBody(EmptyBodyBehavior = EmptyBodyBehavior.Allow)] RedoStoryMusicRequest? request, CancellationToken ct) =>
        await DetailAsync(await stories.RedoMusicAsync(currentUser.UserId, id, (request ?? new()).ToRedo(), ct), ct);

    /// <summary>Multipart: <c>file</c> is an MP3 or WAV the person made or chose. What it is is decided from its bytes.</summary>
    [HttpPut("runs/{id}/music")]
    [RequestSizeLimit(MaxMusicRequestBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = MaxMusicRequestBytes)]
    public async Task<ActionResult<ApiResponse<StoryRunResponse>>> AttachMusic(string id, IFormFile? file, CancellationToken ct)
    {
        if (file is null || file.Length == 0)
            throw new StoryRunException(StoryRunErrorKind.Invalid, "music-required", "Choose a music file.", "file");
        if (file.Length > StoryRunService.MaxMusicBytes)
            throw new StoryRunException(StoryRunErrorKind.Invalid, "music-too-large", $"A music file can be at most {StoryRunService.MaxMusicBytes / 1024 / 1024} MB.", "file");

        byte[] bytes;
        await using (var input = file.OpenReadStream())
        using (var buffer = new MemoryStream())
        {
            await input.CopyToAsync(buffer, ct);
            bytes = buffer.ToArray();
        }

        return await DetailAsync(await stories.AttachMusicAsync(currentUser.UserId, id, bytes, file.FileName, ct), ct);
    }

    /// <summary>Builds the video again with a new automatic look, another style, or effects and transitions set by hand.</summary>
    [HttpPost("runs/{id}/look/redo")]
    [RequestSizeLimit(MaxBriefRequestBytes)]
    public async Task<ActionResult<ApiResponse<StoryRunResponse>>> RedoLook(
        string id, [FromBody] RedoStoryLookRequest request, CancellationToken ct) =>
        await DetailAsync(await stories.RedoLookAsync(currentUser.UserId, id, request.ToRedo(), ct), ct);

    /// <summary>A scene's narration, to listen to before approving it. Read through the run, like a scene's picture.</summary>
    [HttpGet("runs/{id}/scenes/{number:int}/audio")]
    public async Task<IActionResult> Narration(string id, int number, CancellationToken ct)
    {
        var run = await stories.GetAsync(currentUser.UserId, id, ct);
        var key = run.Script?.Scenes.FirstOrDefault(s => s.Number == number)?.AudioKey;
        return await OwnedFileAsync(run, key, "audio-not-found", "That scene has no narration yet.", ct);
    }

    /// <summary>The background track, to listen to before approving it.</summary>
    [HttpGet("runs/{id}/music")]
    public async Task<IActionResult> Music(string id, CancellationToken ct)
    {
        var run = await stories.GetAsync(currentUser.UserId, id, ct);
        return await OwnedFileAsync(run, run.Music?.StorageKey, "music-not-found", "This story has no music yet.", ct);
    }

    /// <summary>Deletes the run and the files it made. The project and render it produced are the person's, and stay.</summary>
    [HttpDelete("runs/{id}")]
    public async Task<IActionResult> Delete(string id, CancellationToken ct)
    {
        await stories.DeleteAsync(currentUser.UserId, id, ct);
        return NoContent();
    }

    // ------------------------------------------------------------------------------------------------ subtitles

    /// <summary>
    /// One subtitle track as an SRT file, built from the run as the last build timed it: <c>hi</c> or <c>en</c>, whichever
    /// the story offers. UTF-8 with a byte-order mark, which some players need to show Devanagari.
    /// </summary>
    [HttpGet("runs/{id}/subtitles/{language}")]
    public async Task<IActionResult> Subtitles(string id, string language, CancellationToken ct)
    {
        var run = await stories.GetAsync(currentUser.UserId, id, ct);
        var code = (language ?? string.Empty).Trim().ToLowerInvariant();
        if (StoryCaptions.Tracks(run).All(t => t.Language != code))
            throw new StoryRunException(StoryRunErrorKind.NotFound, "subtitles-not-found", "This story has no subtitles in that language yet.");

        var srt = StoryCaptions.ToSrt(StoryCaptions.Build(run, code));
        byte[] bytes = [.. Encoding.UTF8.GetPreamble(), .. Encoding.UTF8.GetBytes(srt)];

        Response.Headers.CacheControl = "private, no-store";
        Response.Headers.XContentTypeOptions = "nosniff";
        // The name is built here from the run's id and a checked code, never from the title.
        return File(bytes, "application/x-subrip", $"{run.Id}.{code}.srt");
    }

    /// <summary>
    /// Adds the story's subtitle tracks to one of the YouTube videos made from it. Each language is reported on its own:
    /// one can be added while YouTube refuses another.
    /// </summary>
    [HttpPost("runs/{id}/subtitles/youtube")]
    [RequestSizeLimit(MaxSmallRequestBytes)]
    public async Task<ActionResult<ApiResponse<StoryCaptionsSentResponse>>> SendSubtitles(
        string id, [FromBody] SendStoryCaptionsRequest request, CancellationToken ct)
    {
        if (!currentUser.IsAuthenticated)
        {
            const string message = "Adding subtitles to YouTube needs a signed-in account.";
            return StatusCode(StatusCodes.Status403Forbidden,
                ApiResponse<StoryCaptionsSentResponse>.Fail(message, new ApiError("auth-required", message)));
        }

        var (run, results) = await captions.SendAsync(currentUser.UserId, id, request.VideoId, request.Languages, ct);
        var detail = await DescribeAsync(run, ct);
        return Ok(ApiResponse<StoryCaptionsSentResponse>.Ok(
            new StoryCaptionsSentResponse(detail, [.. results.Select(StoryAgentMapper.ToResponse)])));
    }

    // ------------------------------------------------------------------------------------------------ helpers

    /// <summary>
    /// A story makes a project, so a guest is held to the same rule as when they make one by hand. Stories still being
    /// made count as projects, or a guest could start several at once and step over the limit.
    /// </summary>
    private async Task<ObjectResult?> GuestRefusalAsync(CancellationToken ct)
    {
        if (currentUser.IsAuthenticated) return null;

        var policy = adminOptions.CurrentValue.AnonymousPolicy;
        if (!policy.AllowGuestProjectCreation)
        {
            const string message = "Guest project creation is disabled by platform policy. Please sign in to create projects.";
            return StatusCode(StatusCodes.Status403Forbidden,
                ApiResponse<StoryRunResponse>.Fail(message, new ApiError("guest-forbidden", message)));
        }

        var owned = (await projects.ListAsync(currentUser.UserId, ct)).Count;
        var coming = (await stories.ListAsync(currentUser.UserId, ct))
            .Count(r => string.IsNullOrEmpty(r.ProjectId) && r.Status is not (StoryRunStatus.Failed or StoryRunStatus.Cancelled));
        if (owned + coming >= policy.MaxGuestProjects)
        {
            var message = $"Guest project limit reached: anonymous visitors can create up to {policy.MaxGuestProjects} project(s). Please sign in for unlimited projects.";
            return BadRequest(ApiResponse<StoryRunResponse>.Fail(message, new ApiError("guest-limit-reached", message)));
        }

        return null;
    }

    /// <summary>
    /// The run as the page sees it. The render and the project are shown only while they exist and are the caller's, so a
    /// link the page draws never leads to a missing or someone else's page.
    /// </summary>
    private async Task<ActionResult<ApiResponse<StoryRunResponse>>> DetailAsync(StoryRun run, CancellationToken ct) =>
        Ok(ApiResponse<StoryRunResponse>.Ok(await DescribeAsync(run, ct)));

    private async Task<StoryRunResponse> DescribeAsync(StoryRun run, CancellationToken ct)
    {
        RenderJob? job = null;
        if (!string.IsNullOrEmpty(run.RenderJobId))
        {
            job = await jobs.GetAsync(run.RenderJobId, ct);
            if (job is not null && !string.Equals(job.UserId, currentUser.UserId, StringComparison.Ordinal)) job = null;
        }

        var ownProject = false;
        if (!string.IsNullOrEmpty(run.ProjectId))
        {
            var project = await projects.GetAsync(run.ProjectId, ct);
            ownProject = project is not null && string.Equals(project.UserId, currentUser.UserId, StringComparison.Ordinal);
        }

        // The videos made from the project, read only for a project that is still the caller's.
        var videos = ownProject && currentUser.IsAuthenticated
            ? await publishing.ListAsync(currentUser.UserId, run.ProjectId, ct)
            : [];

        var response = StoryAgentMapper.ToResponse(run, job, videos);
        return ownProject ? response : response with { ProjectId = null };
    }

    /// <summary>The kind of a stored file, from the extension the server itself gave the key when it saved the file.</summary>
    private static string ContentTypeOf(string key) => Path.GetExtension(key).ToLowerInvariant() switch
    {
        ".png" => "image/png",
        ".jpg" or ".jpeg" => "image/jpeg",
        ".webp" => "image/webp",
        ".wav" => "audio/wav",
        ".mp3" => "audio/mpeg",
        _ => "application/octet-stream"
    };

    /// <summary>The step a review URL names; anything else is refused before the service sees it.</summary>
    private static string ReviewStage(string step) => step switch
    {
        "voice" => StoryStageIds.Narration,
        "music" => StoryStageIds.Music,
        "video" => StoryStageIds.Render,
        _ => throw new StoryRunException(StoryRunErrorKind.NotFound, "review-not-found", "There is no such step to approve.")
    };

    /// <summary>A file the run's document points at, served only when the key is the run's own; never kept by the browser.</summary>
    private async Task<IActionResult> OwnedFileAsync(StoryRun run, string? key, string code, string message, CancellationToken ct)
    {
        if (!StoryObjectKeys.Owns(run.Id, key))
            throw new StoryRunException(StoryRunErrorKind.NotFound, code, message);

        var stream = await store.OpenAsync(key!, ct)
            ?? throw new StoryRunException(StoryRunErrorKind.NotFound, code, message);

        Response.Headers.CacheControl = "private, no-store";
        Response.Headers.XContentTypeOptions = "nosniff";
        return File(stream, ContentTypeOf(key!));
    }
}
