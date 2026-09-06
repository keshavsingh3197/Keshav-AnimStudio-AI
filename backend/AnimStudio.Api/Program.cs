using System.Text.Json.Serialization;
using AnimStudio.Api.Common;
using AnimStudio.Api.Security;
using AnimStudio.Application.Security;
using AnimStudio.Infrastructure;
using KeshavSingh.Core;

var builder = WebApplication.CreateBuilder(args);

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
