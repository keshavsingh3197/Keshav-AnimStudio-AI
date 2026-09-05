using AnimStudio.Api.Common;
using AnimStudio.Infrastructure;
using KeshavSingh.Core;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddAnimStudioInfrastructure(builder.Configuration);

builder.Services.AddControllers();
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

app.UseCors(CorsPolicy);
app.MapControllers();

app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

app.Run();
