using System.Security.Cryptography;
using AnimStudio.Api.Common;
using AnimStudio.Api.Contracts;
using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Abstractions.Storage;
using AnimStudio.Application.Ai;
using AnimStudio.Application.Security;
using AnimStudio.Application.Transcripts.Parsing;
using AnimStudio.Application.Voices;
using Microsoft.AspNetCore.Mvc;

namespace AnimStudio.Api.Controllers;

/// <summary>
/// Help writing a voiceover script: say it out loud and get the words back as lines
/// (the <c>Ai:Chains:Transcription</c> chain), or have rough words rewritten so they read
/// aloud well (the <c>Ai:Chains:Text</c> chain). Neither saves anything: the result goes back
/// into the Script box, where the user reads it before any of it is spoken.
/// </summary>
[ApiController]
public sealed class VoiceScriptController(
    IAiExecutor ai,
    IProjectRepository projects,
    ISubtitleParser parser,
    IRenderWorkspaceFactory workspaces,
    ICurrentUser currentUser,
    ILogger<VoiceScriptController> logger) : ControllerBase
{
    /// <summary>Three minutes of the 16 kHz mono WAV the panel records, with room to spare.</summary>
    private const long MaxDictationBytes = 8 * 1024 * 1024;

    /// <summary>The languages the panel dictates in; anything else lets the recognizer detect it.</summary>
    private static readonly HashSet<string> Languages = new(StringComparer.Ordinal) { "en", "hi" };

    /// <summary>Recognition and rewriting keep a CPU (or a metered quota) busy, so only a couple run at once.</summary>
    private static readonly SemaphoreSlim Slots = new(2, 2);

    /// <summary>
    /// Multipart: <c>file</c> is the recording as 16 kHz mono WAV, <c>language</c> "en" or "hi"
    /// (optional). Returns what was said, one line per spoken phrase.
    /// </summary>
    [HttpPost("api/projects/{projectId}/voiceover/dictate")]
    [RequestSizeLimit(MaxDictationBytes + 64 * 1024)]
    [RequestFormLimits(MultipartBodyLengthLimit = MaxDictationBytes + 64 * 1024)]
    public async Task<ActionResult<ApiResponse<VoiceScriptDictationResponse>>> Dictate(
        string projectId, IFormFile? file, [FromForm] string? language, CancellationToken ct)
    {
        await EnsureOwnedAsync(projectId, ct);

        if (file is null || file.Length == 0)
            return Fail(StatusCodes.Status400BadRequest, "file-required", "Record the script first.", "file");
        if (file.Length > MaxDictationBytes)
            return Fail(StatusCodes.Status400BadRequest, "file-too-large",
                "That recording is too long. Dictate up to three minutes at a time.", "file");

        byte[] bytes;
        await using (var input = file.OpenReadStream())
        using (var buffer = new MemoryStream())
        {
            await input.CopyToAsync(buffer, ct);
            bytes = buffer.ToArray();
        }

        // The bytes decide what the file is; the declared type and name are never trusted.
        if (AiAudioValidator.Sniff(bytes) != AiAudioValidator.Wav)
            return Fail(StatusCodes.Status400BadRequest, "file-unsupported", "The recording must be a WAV file.", "file");

        var hint = language is not null && Languages.Contains(language) ? language : null;

        if (!await Slots.WaitAsync(TimeSpan.FromSeconds(30), ct)) return Busy();
        AiOutcome<AiTranscriptionResult> outcome;
        try
        {
            await using var workspace = await workspaces.CreateAsync($"dictate-{Guid.NewGuid():n}", ct);
            var path = workspace.Resolve("in/dictation.wav");
            await System.IO.File.WriteAllBytesAsync(path, bytes, ct);

            outcome = await ai.TranscribeAsync(
                new AiTranscriptionRequest
                {
                    AudioPath = path,
                    LanguageHint = hint,
                    CacheFingerprint = Convert.ToHexStringLower(SHA256.HashData(bytes))
                },
                new AiCallContext(projectId, currentUser.UserId), ct);
        }
        finally
        {
            Slots.Release();
        }

        if (outcome.Kind == AiOutcomeKind.Unavailable)
            return Fail(StatusCodes.Status503ServiceUnavailable, "dictation-unavailable",
                "No speech-to-text engine is turned on. Enable whispercpp-local, faster-whisper or groq-whisper " +
                "under Ai:Providers (see docs/SETUP.md), then restart the API.");
        if (!outcome.IsSuccess)
            return Fail(StatusCodes.Status502BadGateway, outcome.ErrorCode ?? "dictation-failed",
                outcome.ErrorCode switch
                {
                    "transport-failed" =>
                        @"The speech-to-text engine isn't running - nothing answered on its address. Install the local one with scripts\setup-dictation.ps1, then restart the API.",
                    "timeout" =>
                        "The speech-to-text engine took too long. The first recording after starting loads the model; try again, or dictate a shorter part.",
                    "not-configured" or "audio-missing" =>
                        @"The speech-to-text engine isn't set up correctly. Run scripts\setup-dictation.ps1, then restart the API.",
                    _ => "The speech-to-text engine could not make out that recording. Try again, closer to the microphone."
                });

        var result = outcome.Value!;
        var format = result.Format switch
        {
            AiTranscriptValidator.SubRip => SubtitleFormat.SubRip,
            AiTranscriptValidator.WebVtt => SubtitleFormat.WebVtt,
            _ => SubtitleFormat.PlainText
        };
        var lines = VoiceScriptPolish.LinesFrom(parser.Parse(result.SubtitleText, format).Cues.Where(c => !c.IsNonSpeech));
        if (lines.Count == 0)
            return Fail(StatusCodes.Status422UnprocessableEntity, "dictation-empty",
                "No words were heard. Check the microphone and speak a little louder.");

        // What was said is never logged: it can be personal data.
        logger.LogInformation("Dictated {Lines} script line(s) for project {ProjectId} with {Provider}.",
            lines.Count, projectId, result.Provenance.ProviderId);
        return Ok(ApiResponse<VoiceScriptDictationResponse>.Ok(new VoiceScriptDictationResponse(lines)));
    }

    /// <summary>Rewrites the script so it reads aloud well. Returns the new script for the user to keep or discard.</summary>
    [HttpPost("api/projects/{projectId}/voiceover/polish")]
    public async Task<ActionResult<ApiResponse<VoiceScriptPolishResponse>>> Polish(
        string projectId, [FromBody] VoiceScriptPolishRequest? body, CancellationToken ct)
    {
        await EnsureOwnedAsync(projectId, ct);

        var script = body?.Script?.Trim() ?? string.Empty;
        if (script.Length == 0)
            return Fail(StatusCodes.Status400BadRequest, "script-required", "Write or dictate the script first.", "script");
        if (script.Length > VoiceScriptPolish.MaxInputChars)
            return Fail(StatusCodes.Status400BadRequest, "script-too-long",
                $"A script can be at most {VoiceScriptPolish.MaxInputChars} characters to polish. Polish it in parts.", "script");

        if (!await Slots.WaitAsync(TimeSpan.FromSeconds(30), ct)) return Busy();
        AiOutcome<AiTextResult> outcome;
        try
        {
            outcome = await ai.TextAsync(VoiceScriptPolish.BuildRequest(script, body!.Fresh),
                new AiCallContext(projectId, currentUser.UserId), ct);
        }
        finally
        {
            Slots.Release();
        }

        if (outcome.Kind == AiOutcomeKind.Unavailable)
            return Fail(StatusCodes.Status503ServiceUnavailable, "polish-unavailable",
                "No AI text model is turned on. Enable one under Ai:Providers (Groq, Gemini, OpenRouter or a local Ollama), " +
                "then try again.");
        if (!outcome.IsSuccess)
            return Fail(StatusCodes.Status502BadGateway, outcome.ErrorCode ?? "polish-failed",
                outcome.ErrorCode switch
                {
                    "transport-failed" =>
                        "The AI text model isn't running - nothing answered on its address. Start Ollama (ollama serve), " +
                        "or turn on a hosted one (Groq or Gemini) under Admin > AI providers.",
                    "timeout" =>
                        "The AI text model took too long. A local model loads on its first request; try again in a moment.",
                    _ => "The AI model could not rewrite the script just now. Try again in a minute."
                });

        // The model's answer is untrusted: it becomes text in the Script box and nothing more.
        var polished = VoiceScriptPolish.Clean(outcome.Value!.Text);
        if (polished is null)
            return Fail(StatusCodes.Status502BadGateway, "polish-empty",
                "The AI model's answer wasn't a usable script. Try again.");

        logger.LogInformation("Polished a voice script for project {ProjectId} with {Provider}.",
            projectId, outcome.Value.Provenance.ProviderId);
        return Ok(ApiResponse<VoiceScriptPolishResponse>.Ok(
            new VoiceScriptPolishResponse(polished, outcome.Value.Provenance.ProviderId)));
    }

    private async Task EnsureOwnedAsync(string projectId, CancellationToken ct)
    {
        var project = await projects.GetAsync(projectId, ct) ?? throw new KeyNotFoundException();
        if (!string.Equals(project.UserId, currentUser.UserId, StringComparison.Ordinal))
        {
            logger.LogWarning("User {UserId} asked for help with project {ProjectId}, which is not theirs.",
                currentUser.UserId, projectId);
            throw new UnauthorizedAccessException();
        }
    }

    private ObjectResult Busy() =>
        Fail(StatusCodes.Status429TooManyRequests, "voice-script-busy",
            "Other scripts are being worked on right now. Try again in a minute.");

    private ObjectResult Fail(int status, string code, string message, string? field = null) =>
        StatusCode(status, ApiResponse<object>.Fail(message, new ApiError(code, message, field)));
}
