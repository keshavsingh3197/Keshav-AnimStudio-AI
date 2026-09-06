using System.Net;
using System.Net.Sockets;

namespace AnimStudio.Application.Ai;

public enum EndpointRejection
{
    None = 0,
    Missing = 1,
    NotAbsolute = 2,
    SchemeNotAllowed = 3,
    CredentialsInUrl = 4,
    HostNotAllowed = 5,
    PrivateAddress = 6,
    LocalProviderIsNotLocal = 7,
    NonDefaultPort = 8
}

public sealed record EndpointVerdict(bool Allowed, EndpointRejection Rejection)
{
    public static readonly EndpointVerdict Ok = new(true, EndpointRejection.None);

    public static EndpointVerdict Reject(EndpointRejection rejection) => new(false, rejection);
}

/// <summary>
/// Decides whether the server may make an outbound request to a configured AI endpoint.
/// </summary>
/// <remarks>
/// <para>
/// This exists because provider base URLs are operator input: the admin console lets
/// someone type one, which is exactly what is needed for Ollama, ComfyUI or a self-hosted
/// model, and exactly what turns a server into a request proxy if it is unchecked. Without
/// this an admin - or anyone who reaches the admin API - could point a "provider" at
/// <c>http://169.254.169.254/</c> and have the application dutifully fetch cloud instance
/// metadata for them.
/// </para>
/// <para>
/// Pure and synchronous on purpose: this is the rule, stated once, testable without a
/// network. Name resolution is a separate concern and is checked again at connect time,
/// because an allowlisted hostname that resolves to a loopback address passes every check
/// that only looks at the string.
/// </para>
/// </remarks>
public static class AiEndpointGuard
{
    public static EndpointVerdict Check(
        string? baseUrl, bool isLocal, IReadOnlyCollection<string> hostAllowlist)
    {
        if (string.IsNullOrWhiteSpace(baseUrl))
            return EndpointVerdict.Reject(EndpointRejection.Missing);

        // Checked before parsing, because .NET on Unix happily turns "/v1" into an absolute
        // file: URI while Windows rejects it - and a security rule that reports a different
        // reason per platform is a rule nobody can reason about.
        if (!baseUrl.Contains("://", StringComparison.Ordinal))
            return EndpointVerdict.Reject(EndpointRejection.NotAbsolute);

        if (!Uri.TryCreate(baseUrl, UriKind.Absolute, out var uri))
            return EndpointVerdict.Reject(EndpointRejection.NotAbsolute);

        // Plain HTTP only for something on this machine. Everything else is TLS, per the
        // organisation's transport rule, and there is no override.
        var schemeOk = uri.Scheme == Uri.UriSchemeHttps || (isLocal && uri.Scheme == Uri.UriSchemeHttp);
        if (!schemeOk) return EndpointVerdict.Reject(EndpointRejection.SchemeNotAllowed);

        // http://user:pass@host smuggles a credential into what looks like a plain URL, and
        // would land in logs and error messages.
        if (!string.IsNullOrEmpty(uri.UserInfo))
            return EndpointVerdict.Reject(EndpointRejection.CredentialsInUrl);

        var isPrivate = IsPrivateHost(uri);

        if (isLocal)
        {
            // A provider marked local must actually be local. Otherwise "IsLocal" becomes a
            // one-line bypass of the allowlist, which is the opposite of what it is for.
            return isPrivate
                ? EndpointVerdict.Ok
                : EndpointVerdict.Reject(EndpointRejection.LocalProviderIsNotLocal);
        }

        if (isPrivate) return EndpointVerdict.Reject(EndpointRejection.PrivateAddress);

        var allowed = hostAllowlist.Any(h =>
            string.Equals(h, uri.Host, StringComparison.OrdinalIgnoreCase));

        if (!allowed) return EndpointVerdict.Reject(EndpointRejection.HostNotAllowed);

        // A real hosted API is on the scheme's default port. Requiring that stops an
        // allowlisted hostname from being used to reach anything else on that host.
        if (!uri.IsDefaultPort) return EndpointVerdict.Reject(EndpointRejection.NonDefaultPort);

        return EndpointVerdict.Ok;
    }

    /// <summary>
    /// True for anything that names this machine or a network the server can reach
    /// privately. Hostnames that are not IP literals are treated as private only when they
    /// are unambiguously local names - a public hostname's resolved address is checked at
    /// connect time instead, because DNS can change between this call and the connection.
    /// </summary>
    private static bool IsPrivateHost(Uri uri)
    {
        if (IPAddress.TryParse(uri.Host.Trim('[', ']'), out var literal))
            return IsPrivateAddress(literal);

        var host = uri.Host;

        return string.Equals(host, "localhost", StringComparison.OrdinalIgnoreCase)
               || host.EndsWith(".localhost", StringComparison.OrdinalIgnoreCase)
               || host.EndsWith(".local", StringComparison.OrdinalIgnoreCase)
               || host.EndsWith(".internal", StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>
    /// Loopback, link-local (which includes the cloud metadata address), and the RFC 1918
    /// / RFC 4193 private ranges. Used both here and at connect time.
    /// </summary>
    public static bool IsPrivateAddress(IPAddress address)
    {
        if (IPAddress.IsLoopback(address)) return true;

        if (address.AddressFamily == AddressFamily.InterNetworkV6)
        {
            if (address.IsIPv6LinkLocal || address.IsIPv6SiteLocal || address.IsIPv6UniqueLocal)
                return true;

            // ::ffff:10.0.0.1 is a private IPv4 address wearing a v6 hat.
            if (address.IsIPv4MappedToIPv6)
                return IsPrivateAddress(address.MapToIPv4());

            return address.Equals(IPAddress.IPv6Any) || address.Equals(IPAddress.IPv6None);
        }

        if (address.AddressFamily != AddressFamily.InterNetwork) return true;

        var octets = address.GetAddressBytes();

        return octets[0] switch
        {
            0 => true,                                        // 0.0.0.0/8
            10 => true,                                       // 10.0.0.0/8
            127 => true,                                      // loopback
            169 when octets[1] == 254 => true,                 // link-local, incl. 169.254.169.254
            172 when octets[1] >= 16 && octets[1] <= 31 => true,// 172.16.0.0/12
            192 when octets[1] == 168 => true,                 // 192.168.0.0/16
            100 when octets[1] >= 64 && octets[1] <= 127 => true,// carrier-grade NAT
            >= 224 => true,                                    // multicast and reserved
            _ => false
        };
    }
}
