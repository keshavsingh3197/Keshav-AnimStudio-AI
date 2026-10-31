using AnimStudio.Api.Security;
using AnimStudio.Api.Controllers;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Net.Http.Headers;

namespace AnimStudio.Integration.Tests;

public sealed class IdentityProxyHttpClientTests
{
    [Fact]
    public void PooledProxyDoesNotStoreBrowserCookiesOrFollowRedirects()
    {
        var services = new ServiceCollection();
        services.AddIdentityProxyHttpClient();
        using var provider = services.BuildServiceProvider();
        var handler = provider.GetRequiredService<IHttpMessageHandlerFactory>().CreateHandler("IdP");
        while (handler is DelegatingHandler delegating)
            handler = delegating.InnerHandler!;

        var primary = Assert.IsType<HttpClientHandler>(handler);
        Assert.False(primary.UseCookies);
        Assert.False(primary.AllowAutoRedirect);
    }

    [Theory]
    [InlineData("api.studio.keshavsingh.in", ".keshavsingh.in")]
    [InlineData("keshavsingh.in", ".keshavsingh.in")]
    [InlineData("localhost", null)]
    [InlineData("127.0.0.1", null)]
    [InlineData("notkeshavsingh.in", null)]
    [InlineData("keshavsingh.in.example.invalid", null)]
    public void CookieSharesIdentityDomainOnlyOnMatchingHosts(string host, string? expectedDomain)
    {
        var cookie = SetCookieHeaderValue.Parse("ks_sso=test-only; Domain=.keshavsingh.in; Path=/; HttpOnly");
        AuthController.AdaptSsoCookie(cookie, host);
        Assert.Equal(expectedDomain, cookie.Domain.Value);
        Assert.Equal("/", cookie.Path.Value);
        Assert.True(cookie.Secure);
        Assert.True(cookie.HttpOnly);
        Assert.Equal(SameSiteMode.None, cookie.SameSite);
    }

    [Fact]
    public void CookieDeletionKeepsSharedDomainAndExpiry()
    {
        var cookie = SetCookieHeaderValue.Parse(
            "ks_sso=; Domain=.keshavsingh.in; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT");
        AuthController.AdaptSsoCookie(cookie, "api.studio.keshavsingh.in");
        Assert.Equal(".keshavsingh.in", cookie.Domain.Value);
        Assert.True(cookie.Expires < DateTimeOffset.UtcNow);
    }
}
