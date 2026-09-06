using System.Collections.Concurrent;
using System.Net;
using System.Net.Sockets;
using AnimStudio.Application.Ai;
using AnimStudio.Application.Options;
using AnimStudio.Domain.Ai;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AnimStudio.Infrastructure.Ai;

/// <summary>Thrown when a provider's configured endpoint fails the guard. Names the rule it broke.</summary>
public sealed class AiEndpointException(EndpointRejection rejection, string message)
    : Exception(message)
{
    public EndpointRejection Rejection { get; } = rejection;
}

public interface IAiHttpClientFactory
{
    /// <summary>
    /// A client bound to the provider's base URL, or an exception naming why that URL is
    /// not permitted. Never returns a client that could reach an unapproved host.
    /// </summary>
    HttpClient Create(AiProviderId provider);
}

/// <summary>
/// Builds one long-lived <see cref="HttpClient"/> per provider endpoint, with the timeout,
/// retry policy and address checks every AI call needs.
/// </summary>
/// <remarks>
/// <para>
/// Clients are cached by provider AND base URL so that changing a base URL in the admin
/// console produces a new client rather than silently reusing a connection pool aimed at
/// the old host. Each handler sets <c>PooledConnectionLifetime</c>, which is what keeps a
/// long-lived client from pinning a stale DNS answer.
/// </para>
/// <para>
/// The important part is <c>ConnectCallback</c>. <see cref="AiEndpointGuard"/> can only
/// judge the URL string; a hostname on the allowlist that resolves to 127.0.0.1 - whether
/// by accident or by someone controlling that DNS record - would pass it. Checking the
/// resolved address immediately before connecting is what actually closes that door.
/// </para>
/// </remarks>
public sealed class AiHttpClientFactory(
    IOptionsMonitor<AiOptions> options,
    ILogger<AiHttpClientFactory> logger,
    ILoggerFactory loggerFactory) : IAiHttpClientFactory, IDisposable
{
    private readonly ConcurrentDictionary<string, HttpClient> _clients = new(StringComparer.Ordinal);

    public HttpClient Create(AiProviderId provider)
    {
        var configuration = options.CurrentValue;
        var providerOptions = configuration.ProviderFor(provider)
            ?? throw new AiEndpointException(EndpointRejection.Missing,
                $"AI provider '{provider.Value}' is not configured.");

        var verdict = AiEndpointGuard.Check(
            providerOptions.BaseUrl, providerOptions.IsLocal, configuration.HostAllowlist);

        if (!verdict.Allowed)
        {
            // The rejection reason is safe to log; the URL is operator input and is not.
            logger.LogWarning(
                "Refusing to call AI provider {ProviderId}: endpoint rejected ({Rejection}).",
                provider.Value, verdict.Rejection);

            throw new AiEndpointException(verdict.Rejection,
                $"The endpoint configured for '{provider.Value}' is not permitted ({verdict.Rejection}).");
        }

        var cacheKey = $"{provider.Value}|{providerOptions.BaseUrl}|{providerOptions.TimeoutSeconds}";

        return _clients.GetOrAdd(cacheKey, _ => Build(providerOptions));
    }

    private HttpClient Build(AiProviderOptions providerOptions)
    {
        var handler = new SocketsHttpHandler
        {
            // Long enough to be worth pooling, short enough that a DNS change is picked up.
            PooledConnectionLifetime = TimeSpan.FromMinutes(5),
            ConnectTimeout = TimeSpan.FromSeconds(15),
            AutomaticDecompression = DecompressionMethods.All,

            // Redirects are off: a 302 is how an allowlisted host sends the request
            // somewhere that was never checked.
            AllowAutoRedirect = false,

            ConnectCallback = (context, ct) =>
                ConnectAsync(context, providerOptions.IsLocal, ct)
        };

        var retry = new AiRetryHandler(loggerFactory.CreateLogger<AiRetryHandler>())
        {
            InnerHandler = handler
        };

        return new HttpClient(retry, disposeHandler: true)
        {
            // The trailing slash matters and is easy to lose. Without it, .NET resolves a
            // relative "chat/completions" against "https://host/openai/v1" by REPLACING the
            // last segment, giving "https://host/openai/chat/completions" - a 404 that looks
            // like a provider outage. Normalised here so no provider has to remember.
            BaseAddress = new Uri(
                providerOptions.BaseUrl!.EndsWith('/')
                    ? providerOptions.BaseUrl!
                    : providerOptions.BaseUrl + "/",
                UriKind.Absolute),
            Timeout = TimeSpan.FromSeconds(Math.Clamp(providerOptions.TimeoutSeconds, 5, 600)),
            DefaultRequestHeaders = { { "User-Agent", "AnimStudio/1.0" } },

            // A model that streams forever, or a provider that returns a huge body, must not
            // be able to exhaust memory.
            MaxResponseContentBufferSize = 32 * 1024 * 1024
        };
    }

    private async ValueTask<Stream> ConnectAsync(
        SocketsHttpConnectionContext context, bool isLocal, CancellationToken ct)
    {
        var endpoint = context.DnsEndPoint;

        var addresses = IPAddress.TryParse(endpoint.Host, out var literal)
            ? [literal]
            : await Dns.GetHostAddressesAsync(endpoint.Host, ct).ConfigureAwait(false);

        // Checked here rather than trusted from the URL: this is the only point at which the
        // address actually being dialled is known.
        var permitted = addresses
            .Where(address => AiEndpointGuard.IsPrivateAddress(address) == isLocal)
            .ToArray();

        if (permitted.Length == 0)
        {
            throw new AiEndpointException(
                isLocal ? EndpointRejection.LocalProviderIsNotLocal : EndpointRejection.PrivateAddress,
                isLocal
                    ? "That local provider's host does not resolve to this machine."
                    : "That provider's host resolves to a private address.");
        }

        var socket = new Socket(SocketType.Stream, ProtocolType.Tcp) { NoDelay = true };

        try
        {
            await socket.ConnectAsync(permitted, endpoint.Port, ct).ConfigureAwait(false);
            return new NetworkStream(socket, ownsSocket: true);
        }
        catch
        {
            socket.Dispose();
            throw;
        }
    }

    public void Dispose()
    {
        foreach (var client in _clients.Values) client.Dispose();
        _clients.Clear();
    }
}
