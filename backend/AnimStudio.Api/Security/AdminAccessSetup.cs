using System.Text;
using System.Text.Encodings.Web;
using AnimStudio.Api.Common;
using AnimStudio.Application.Options;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace AnimStudio.Api.Security;

/// <summary>
/// Wires up the admin authorization boundary, and refuses to start in a configuration
/// that would leave it open.
/// </summary>
public static class AdminAccessSetup
{
    /// <summary>
    /// HS256 needs a key with at least as much entropy as the digest it produces. A shorter
    /// one is accepted by the algorithm and is not worth the trouble of having a boundary.
    /// </summary>
    private const int MinimumSigningKeyBytes = 32;

    public static IServiceCollection AddAnimStudioAdminAccess(
        this IServiceCollection services,
        IConfiguration configuration,
        IWebHostEnvironment environment)
    {
        services.Configure<AdminOptions>(configuration.GetSection(AdminOptions.Section));

        var options = configuration.GetSection(AdminOptions.Section).Get<AdminOptions>()
                      ?? new AdminOptions();

        Validate(options, environment);

        services.AddHttpContextAccessor();
        services.AddSingleton<IAuthorizationHandler, AdminRequirementHandler>();

        if (options.Mode == AdminAccessMode.Jwt)
        {
            services
                .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddJwtBearer(bearer =>
                {
                    // Claims arrive verbatim: the family's tokens carry "sub" and "role",
                    // and the default mapping would rewrite both into SOAP-era URIs that no
                    // other app in the family agrees with.
                    bearer.MapInboundClaims = false;
                    bearer.RequireHttpsMetadata = !environment.IsDevelopment();
                    bearer.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidIssuer = options.Jwt.Issuer,
                        ValidAudience = options.Jwt.Audience,
                        IssuerSigningKey = new SymmetricSecurityKey(
                            Encoding.UTF8.GetBytes(options.Jwt.SigningKey!)),
                        ValidateIssuer = true,
                        ValidateAudience = true,
                        ValidateIssuerSigningKey = true,
                        ValidateLifetime = true,
                        ClockSkew = TimeSpan.FromSeconds(30)
                    };
                });
        }
        else
        {
            // No token is validated in the local modes, but a scheme still has to exist:
            // a failed policy has to be turned into a 403 by something, and without a
            // registered scheme ASP.NET raises an InvalidOperationException instead, which
            // would surface as a 500 and read like a bug rather than a refusal.
            services
                .AddAuthentication(RefusalAuthenticationHandler.SchemeName)
                .AddScheme<AuthenticationSchemeOptions, RefusalAuthenticationHandler>(
                    RefusalAuthenticationHandler.SchemeName, _ => { });
        }

        services.AddAuthorization(auth =>
        {
            auth.AddPolicy(AdminAccess.Policy, policy => policy.AddRequirements(new AdminRequirement()));

            // In JWT mode every endpoint requires a signed token, not just the admin ones -
            // record ownership is read from the token's subject, so an anonymous request
            // has no owner to check against. The local modes have exactly one user and no
            // sign-in, so they keep the open API they have always had.
            if (options.Mode == AdminAccessMode.Jwt)
            {
                auth.FallbackPolicy = new AuthorizationPolicyBuilder()
                    .RequireAuthenticatedUser()
                    .Build();
            }
        });

        return services;
    }

    /// <summary>
    /// Fails closed at startup rather than at the first admin request, because the
    /// dangerous configurations here are the ones nobody would notice working.
    /// </summary>
    private static void Validate(AdminOptions options, IWebHostEnvironment environment)
    {
        if (options.Mode == AdminAccessMode.Jwt)
        {
            var key = options.Jwt.SigningKey;

            if (string.IsNullOrWhiteSpace(key))
            {
                throw new InvalidOperationException(
                    "Admin:Mode is Jwt but no signing key is configured. The key is a secret and " +
                    "must never be committed to appsettings.json. Supply it with either:\n" +
                    "  dotnet user-secrets set \"Admin:Jwt:SigningKey\" \"<the family signing key>\"\n" +
                    "or the environment variable Admin__Jwt__SigningKey.\n" +
                    "It has to be byte-identical to the key used by the identity provider.");
            }

            if (Encoding.UTF8.GetByteCount(key) < MinimumSigningKeyBytes)
            {
                throw new InvalidOperationException(
                    $"Admin:Jwt:SigningKey is shorter than {MinimumSigningKeyBytes} bytes, which is " +
                    "too short for HS256. Use the family signing key.");
            }

            return;
        }

        if (!environment.IsProduction()) return;

        // Reached only by a deployment that left the development default in place. Behind a
        // reverse proxy the TCP peer is the proxy, which can be loopback - so LocalOnly in
        // Production is not a weaker boundary, it is potentially no boundary at all.
        throw new InvalidOperationException(
            $"Admin:Mode is {options.Mode} in the Production environment, which is refused. " +
            "LocalOnly trusts the connection's peer address, and behind a reverse proxy that " +
            "peer is the proxy rather than the caller. Set Admin:Mode to Jwt and configure " +
            "Admin:Jwt:SigningKey, or to Disabled to switch the admin API off entirely.");
    }
}

/// <summary>
/// The authentication scheme used when there is no token to validate: it authenticates
/// nobody, and turns a failed authorization policy into a clean 403 in the standard
/// envelope instead of an empty body.
/// </summary>
public sealed class RefusalAuthenticationHandler(
    IOptionsMonitor<AuthenticationSchemeOptions> options,
    ILoggerFactory logger,
    UrlEncoder encoder) : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    public const string SchemeName = "AnimStudioLocal";

    protected override Task<AuthenticateResult> HandleAuthenticateAsync() =>
        Task.FromResult(AuthenticateResult.NoResult());

    protected override Task HandleChallengeAsync(AuthenticationProperties properties) => Deny();

    protected override Task HandleForbiddenAsync(AuthenticationProperties properties) => Deny();

    private Task Deny()
    {
        const string message =
            "Administration is only available from the machine this server runs on.";

        Response.StatusCode = StatusCodes.Status403Forbidden;

        return Response.WriteAsJsonAsync(
            ApiResponse<EmptyPayload>.Fail(message, new ApiError("admin-forbidden", message)));
    }
}
