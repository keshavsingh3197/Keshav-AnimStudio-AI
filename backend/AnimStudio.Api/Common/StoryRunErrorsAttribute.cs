using AnimStudio.Application.StoryAgent;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace AnimStudio.Api.Common;

/// <summary>
/// Turns a refusal from the Story Agent into the standard envelope, with the field it is about so the page can put the
/// message next to the right input. The message is written for the person and the code is stable; nothing else about
/// the failure is sent.
/// </summary>
/// <remarks>
/// A filter rather than a branch in <see cref="GlobalExceptionHandler"/> because that handler's result has no field, and
/// a run's refusals are only ever raised under the Story Agent's own controller.
/// </remarks>
[AttributeUsage(AttributeTargets.Class)]
public sealed class StoryRunErrorsAttribute : ExceptionFilterAttribute
{
    public override void OnException(ExceptionContext context)
    {
        if (context.Exception is not StoryRunException refusal) return;

        var status = StatusFor(refusal.Kind);
        context.HttpContext.RequestServices.GetService<ILoggerFactory>()?
            .CreateLogger<StoryRunErrorsAttribute>()
            .LogInformation("Story Agent request rejected on {Method} {Path}: {Code}",
                context.HttpContext.Request.Method, context.HttpContext.Request.Path, refusal.Code);

        context.Result = new ObjectResult(ApiResponse<EmptyPayload>.Fail(
            refusal.Message, new ApiError(refusal.Code, refusal.Message, refusal.Field)))
        {
            StatusCode = status
        };
        context.ExceptionHandled = true;
    }

    internal static int StatusFor(StoryRunErrorKind kind) => kind switch
    {
        StoryRunErrorKind.Invalid => StatusCodes.Status400BadRequest,
        StoryRunErrorKind.NotFound => StatusCodes.Status404NotFound,
        StoryRunErrorKind.Conflict => StatusCodes.Status409Conflict,
        StoryRunErrorKind.Limit => StatusCodes.Status429TooManyRequests,
        StoryRunErrorKind.Unavailable => StatusCodes.Status503ServiceUnavailable,
        _ => StatusCodes.Status400BadRequest
    };
}
