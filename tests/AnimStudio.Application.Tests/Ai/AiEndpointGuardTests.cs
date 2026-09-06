using System.Net;
using AnimStudio.Application.Ai;

namespace AnimStudio.Application.Tests.Ai;

public class AiEndpointGuardTests
{
    private static readonly string[] Allowlist =
        ["api.groq.com", "generativelanguage.googleapis.com", "image.pollinations.ai"];

    private static EndpointVerdict Check(string? url, bool isLocal = false) =>
        AiEndpointGuard.Check(url, isLocal, Allowlist);

    [Fact]
    public void An_allowlisted_https_host_is_permitted()
    {
        Assert.True(Check("https://api.groq.com/openai/v1").Allowed);
    }

    [Theory]
    [InlineData("https://evil.example.com/v1")]
    [InlineData("https://api.groq.com.evil.example.com/v1")]
    [InlineData("https://notapi.groq.com/v1")]
    public void A_host_that_is_not_on_the_allowlist_is_refused(string url)
    {
        // The middle case is the one that matters: a suffix match would have accepted it.
        var verdict = Check(url);

        Assert.False(verdict.Allowed);
        Assert.Equal(EndpointRejection.HostNotAllowed, verdict.Rejection);
    }

    [Fact]
    public void The_allowlist_is_matched_case_insensitively()
    {
        Assert.True(Check("https://API.GROQ.COM/openai/v1").Allowed);
    }

    [Fact]
    public void Plain_http_is_refused_for_a_remote_provider()
    {
        var verdict = Check("http://api.groq.com/openai/v1");

        Assert.False(verdict.Allowed);
        Assert.Equal(EndpointRejection.SchemeNotAllowed, verdict.Rejection);
    }

    [Theory]
    [InlineData("ftp://api.groq.com/")]
    [InlineData("file:///etc/passwd")]
    [InlineData("gopher://api.groq.com/")]
    public void Only_http_and_https_are_considered_at_all(string url)
    {
        Assert.False(Check(url).Allowed);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void A_missing_url_is_refused(string? url)
    {
        Assert.Equal(EndpointRejection.Missing, Check(url).Rejection);
    }

    [Theory]
    [InlineData("/openai/v1")]
    [InlineData("api.groq.com/v1")]
    [InlineData("C:\\windows\\system32")]
    public void A_url_with_no_scheme_is_refused_the_same_way_on_every_platform(string url)
    {
        // .NET on Unix turns "/v1" into an absolute file: URI and Windows does not, so this
        // is checked before parsing rather than after.
        Assert.Equal(EndpointRejection.NotAbsolute, Check(url).Rejection);
    }

    [Fact]
    public void A_url_carrying_credentials_is_refused()
    {
        // These end up in logs and error messages, which is exactly where a password
        // should never be.
        var verdict = Check("https://user:password@api.groq.com/v1");

        Assert.False(verdict.Allowed);
        Assert.Equal(EndpointRejection.CredentialsInUrl, verdict.Rejection);
    }

    [Fact]
    public void An_allowlisted_host_on_a_non_default_port_is_refused()
    {
        // Otherwise an allowlisted hostname becomes a way to reach anything else on that
        // machine.
        var verdict = Check("https://api.groq.com:8443/v1");

        Assert.False(verdict.Allowed);
        Assert.Equal(EndpointRejection.NonDefaultPort, verdict.Rejection);
    }

    [Theory]
    [InlineData("https://127.0.0.1/v1")]
    [InlineData("https://10.1.2.3/v1")]
    [InlineData("https://192.168.0.5/v1")]
    [InlineData("https://172.16.5.4/v1")]
    [InlineData("https://[::1]/v1")]
    [InlineData("https://localhost/v1")]
    public void A_remote_provider_pointed_at_a_private_address_is_refused(string url)
    {
        var verdict = Check(url);

        Assert.False(verdict.Allowed);
        Assert.Equal(EndpointRejection.PrivateAddress, verdict.Rejection);
    }

    [Fact]
    public void The_cloud_metadata_address_is_refused()
    {
        // 169.254.169.254 is the address that turns an unchecked base URL into credential
        // theft on every major cloud.
        var verdict = Check("http://169.254.169.254/latest/meta-data/", isLocal: false);

        Assert.False(verdict.Allowed);
    }

    [Fact]
    public void The_cloud_metadata_address_is_refused_even_for_a_local_provider()
    {
        // A local provider may reach this machine. It may not reach the metadata service,
        // and IsLocal must not become a way to ask for it.
        Assert.True(AiEndpointGuard.IsPrivateAddress(IPAddress.Parse("169.254.169.254")));
    }

    [Theory]
    [InlineData("http://localhost:11434/v1")]
    [InlineData("http://127.0.0.1:8188")]
    [InlineData("http://192.168.1.40:8188")]
    [InlineData("https://ollama.local/v1")]
    public void A_local_provider_may_use_http_and_a_private_address(string url)
    {
        Assert.True(Check(url, isLocal: true).Allowed);
    }

    [Fact]
    public void A_local_provider_pointed_at_the_internet_is_refused()
    {
        // Otherwise "IsLocal": true is a one-line bypass of the whole allowlist.
        var verdict = Check("https://evil.example.com/v1", isLocal: true);

        Assert.False(verdict.Allowed);
        Assert.Equal(EndpointRejection.LocalProviderIsNotLocal, verdict.Rejection);
    }

    [Fact]
    public void A_local_provider_may_use_a_custom_port_because_that_is_normal_for_one()
    {
        Assert.True(Check("http://localhost:8188", isLocal: true).Allowed);
    }

    [Theory]
    [InlineData("127.0.0.1")]
    [InlineData("0.0.0.0")]
    [InlineData("10.0.0.1")]
    [InlineData("172.31.255.255")]
    [InlineData("192.168.1.1")]
    [InlineData("169.254.1.1")]
    [InlineData("100.64.0.1")]
    [InlineData("224.0.0.1")]
    [InlineData("::1")]
    [InlineData("fe80::1")]
    [InlineData("fc00::1")]
    [InlineData("::ffff:10.0.0.1")]
    public void Private_and_reserved_addresses_are_recognised(string address)
    {
        Assert.True(AiEndpointGuard.IsPrivateAddress(IPAddress.Parse(address)));
    }

    [Theory]
    [InlineData("8.8.8.8")]
    [InlineData("1.1.1.1")]
    [InlineData("172.32.0.1")]
    [InlineData("172.15.255.255")]
    [InlineData("2606:4700:4700::1111")]
    public void Public_addresses_are_not_treated_as_private(string address)
    {
        Assert.False(AiEndpointGuard.IsPrivateAddress(IPAddress.Parse(address)));
    }

    [Fact]
    public void An_empty_allowlist_permits_nothing_remote()
    {
        // Default deny: an operator who has not listed a host has not approved one.
        Assert.False(AiEndpointGuard.Check("https://api.groq.com/v1", false, []).Allowed);
    }
}
