using System.Text.Json.Serialization;
using AnimStudio.Api.Common;
using AnimStudio.Api.Security;
using AnimStudio.Application.Security;
using AnimStudio.Infrastructure;
using KeshavSingh.Core;
using Microsoft.AspNetCore.Mvc;

// Ensure AI_STUDIO directories exist on startup
Directory.CreateDirectory("D:/AI_STUDIO/objects");
Directory.CreateDirectory("D:/AI_STUDIO/temp");
Directory.CreateDirectory("D:/AI_STUDIO/downloads");
Directory.CreateDirectory("D:/AI_STUDIO/chunks");
Directory.CreateDirectory("D:/AI_STUDIO/logs");
Directory.CreateDirectory("D:/AI_STUDIO/thumbnails");

var builder = WebApplication.CreateBuilder(args);

// Write rolling logs to D:/AI_STUDIO/logs/ — one file per day.
builder.Logging.AddProvider(new DailyFileLoggerProvider("D:/AI_STUDIO/logs", "animstudio"));

builder.Services.AddAnimStudioInfrastructure(builder.Configuration);

// Who may administer this server, and who the caller is. Registered after the
// infrastructure so this ICurrentUser replaces the local-only one: in JWT mode the owner
// of a record is the token's subject, and every ownership check in the application already
// reads it from here.
builder.Services.AddAnimStudioAdminAccess(builder.Configuration, builder.Environment);
builder.Services.AddScoped<ICurrentUser, HttpContextCurrentUser>();

// Enums cross the wire as names, not numbers. Responses already map them with ToString(),
// so without this a client would have to READ "Fade" and WRITE 1 - and a reordered enum
// would silently change what an old client's number meant.
builder.Services.AddControllers()
    .ConfigureApiBehaviorOptions(options =>
    {
        options.InvalidModelStateResponseFactory = context =>
        {
            var errors = context.ModelState
                .Where(e => e.Value?.Errors.Count > 0)
                .SelectMany(e => e.Value!.Errors.Select(err => new ApiError(
                    e.Key.ToLowerInvariant(),
                    !string.IsNullOrWhiteSpace(err.ErrorMessage) ? err.ErrorMessage : "Invalid field value",
                    e.Key)))
                .ToArray();

            var firstMsg = errors.FirstOrDefault()?.Message ?? "Validation failed.";
            return new BadRequestObjectResult(ApiResponse<EmptyPayload>.Fail(firstMsg, errors));
        };
    })
    .AddJsonOptions(options =>
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.AddOpenApi();

// One envelope for every failure, and nothing internal in it.
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();

// CORS comes from KeshavSingh.Core so the whole family shares one policy definition.
// Localhost is allowed in development only - in production it buys nothing and would
// leave http://localhost:* as a credentialed origin.
const string CorsPolicy = "AnimStudioCors";
var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>() ?? [];
builder.Services.AddKeshavSsoCors(
    CorsPolicy,
    allowedOrigins,
    allowLocalhost: builder.Environment.IsDevelopment());

var app = builder.Build();

app.UseExceptionHandler();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// Baseline headers on every response. Cheap, and each one closes a class of attack that
// does not otherwise show up in testing.
app.Use(async (context, next) =>
{
    var headers = context.Response.Headers;
    headers["X-Content-Type-Options"] = "nosniff";
    headers["X-Frame-Options"] = "DENY";
    headers["Referrer-Policy"] = "no-referrer";
    await next();
});

app.UseCors(CorsPolicy);

// Authentication before authorization, and both before the endpoints they guard. In the
// local modes the scheme authenticates nobody and exists only to turn a failed policy into
// a clean 403 - see AdminAccessSetup.
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.MapGet("/health", () => Results.Ok(new { status = "ok" })).AllowAnonymous();

app.Run();
