using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Abstractions.Transcripts;
using AnimStudio.Application.Common;
using AnimStudio.Application.Transcripts.Parsing;
using AnimStudio.Domain.Errors;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace AnimStudio.Api.Common;

/// <summary>
/// Converts an unhandled exception into the standard envelope.
/// <para>
/// Two rules are enforced here. Nothing internal reaches the client - no stack trace, no
/// file path, no renderer stderr - because those leak the server's shape to anyone who can
/// trigger an error. And anything unrecognized becomes a generic 500 rather than being
/// echoed back, so a new exception type cannot accidentally start disclosing details.
/// </para>
/// </summary>
public sealed class GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger) : IExceptionHandler
{
    private const int ClientClosedRequest = 499;

    public async ValueTask<bool> TryHandleAsync(
        HttpContext context, Exception exception, CancellationToken ct)
    {
        var (status, code, message) = Classify(exception);

        // The full detail goes to the server log only.
        if (status >= StatusCodes.Status500InternalServerError)
            logger.LogError(exception, "Unhandled error on {Method} {Path}",
                context.Request.Method, context.Request.Path);
        else
            logger.LogInformation("Request rejected on {Method} {Path}: {Code}",
                context.Request.Method, context.Request.Path, code);

        context.Response.StatusCode = status;
        await context.Response
            .WriteAsJsonAsync(ApiResponse<EmptyPayload>.Fail(message, new ApiError(code, message)), ct)
            .ConfigureAwait(false);

        return true;
    }

    private static (int Status, string Code, string Message) Classify(Exception exception) =>
        exception switch
        {
            TranscriptIngestException ingest => (
                ingest.Code switch
                {
                    "forbidden" => StatusCodes.Status403Forbidden,
                    "project-not-found" => StatusCodes.Status404NotFound,
                    "media-download-disabled" => StatusCodes.Status403Forbidden,
                    "url-ingest-disabled" or "yt-dlp-disabled" or "yt-dlp-not-installed" =>
                        StatusCodes.Status422UnprocessableEntity,
                    _ => StatusCodes.Status400BadRequest
                },
                ingest.Code, ingest.Message),

            // A rejected edit: the caller can fix it, so it says exactly what is wrong.
            EditingException editing => (
                editing.IsConflict
                    ? StatusCodes.Status409Conflict
                    : StatusCodes.Status400BadRequest,
                editing.Code, editing.Message),

            // An administrator's settings change that was refused. Not a server fault: the
            // message names the field and is written to be shown.
            AiSettingsException aiSettings =>
                (StatusCodes.Status400BadRequest, aiSettings.Code, aiSettings.Message),

            // Never quotes the key, by construction - see AiCredentialStore.
            AiCredentialException credential =>
                (StatusCodes.Status400BadRequest, credential.Code, credential.Message),

            SubtitleParseException parse =>
                (StatusCodes.Status422UnprocessableEntity, parse.Code, parse.Message),

            RenderException render => (
                render.Code == RenderErrorCode.RendererUnavailable
                    ? StatusCodes.Status503ServiceUnavailable
                    : StatusCodes.Status400BadRequest,
                render.Code.ToString(), render.UserMessage),

            UnauthorizedAccessException =>
                (StatusCodes.Status403Forbidden, "forbidden", "You do not have access to that resource."),

            KeyNotFoundException =>
                (StatusCodes.Status404NotFound, "not-found", "That resource does not exist."),

            // 499 is nginx's client-closed-request code; ASP.NET has no constant for it.
            OperationCanceledException =>
                (ClientClosedRequest, "cancelled", "The request was cancelled."),

            // Deliberately generic: an unrecognized failure must not describe itself.
            _ => (StatusCodes.Status500InternalServerError, "internal-error",
                "Something went wrong. Please try again.")
        };
}
