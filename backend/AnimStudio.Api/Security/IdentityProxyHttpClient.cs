namespace AnimStudio.Api.Security;

internal static class IdentityProxyHttpClient
{
    internal static IHttpClientBuilder AddIdentityProxyHttpClient(this IServiceCollection services) =>
        services.AddHttpClient("IdP")
            .ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler
            {
                // SSO cookies belong to each browser, not the pooled server-side handler.
                UseCookies = false,
                AllowAutoRedirect = false,
            });
}
