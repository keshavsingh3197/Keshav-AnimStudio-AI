using System.Net;
using System.Text;
using System.Text.Json;
using AnimStudio.Api.Controllers;
using AnimStudio.Api.Contracts;
using AnimStudio.Api.Security;
using AnimStudio.Application.Options;
using AnimStudio.Application.Security;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Infrastructure;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace AnimStudio.Application.Tests.Security;

public sealed class StudioSignupControllerTests
{
    private const string GoodPassword = "correct-horse-battery";

    private sealed class FixedOptions(AdminOptions value) : IOptionsMonitor<AdminOptions>
    {
        public AdminOptions CurrentValue => value;
        public AdminOptions Get(string? name) => value;
        public IDisposable? OnChange(Action<AdminOptions, string?> listener) => null;
    }

    private sealed class StubHandler(HttpStatusCode status, string body = "{}") : HttpMessageHandler
    {
        public List<(HttpRequestMessage Request, string Body)> Calls { get; } = [];

        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            var sent = request.Content is null ? string.Empty : await request.Content.ReadAsStringAsync(cancellationToken);
            Calls.Add((request, sent));
            return new HttpResponseMessage(status) { Content = new StringContent(body, Encoding.UTF8, "application/json") };
        }
    }

    private sealed class StubFactory(HttpMessageHandler handler) : IHttpClientFactory
    {
        public HttpClient CreateClient(string name) => new(handler, disposeHandler: false);
    }

    private static (StudioSignupController Controller, StubHandler Handler) Build(HttpStatusCode idpStatus, bool open = true)
    {
        var handler = new StubHandler(idpStatus);
        var options = new AdminOptions { Signup = new SignupPolicy { Enabled = open } };
        var monitor = new FixedOptions(options);
        var identity = new StudioIdentityClient(new StubFactory(handler), monitor, NullLogger<StudioIdentityClient>.Instance);
        var controller = new StudioSignupController(identity, monitor, NullLogger<StudioSignupController>.Instance)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };
        return (controller, handler);
    }

    private static StudioSignupRequest Valid(string? website = null) =>
        new("  asha@example.com ", " Asha Rao ", GoodPassword, "I make shorts", website);

    private static int? Status(IActionResult result) => (result as IStatusCodeActionResult)?.StatusCode;

    [Fact]
    public async Task A_valid_request_goes_to_the_identity_queue_tagged_and_without_any_bearer()
    {
        var (controller, handler) = Build(HttpStatusCode.Accepted);
        controller.HttpContext.Request.Headers.Authorization = "Bearer someone-elses-token";

        var result = await controller.Submit(Valid(), CancellationToken.None);

        Assert.Equal(StatusCodes.Status202Accepted, Status(result));
        var call = Assert.Single(handler.Calls);
        Assert.Equal(HttpMethod.Post, call.Request.Method);
        Assert.EndsWith("/api/account-requests", call.Request.RequestUri!.AbsolutePath);
        Assert.False(call.Request.Headers.Contains("Authorization"));

        using var sent = JsonDocument.Parse(call.Body);
        Assert.Equal("asha@example.com", sent.RootElement.GetProperty("email").GetString());
        Assert.Equal("Asha Rao", sent.RootElement.GetProperty("displayName").GetString());
        Assert.Equal(GoodPassword, sent.RootElement.GetProperty("password").GetString());
        Assert.StartsWith(StudioSignupRules.AppTag, sent.RootElement.GetProperty("reason").GetString());
    }

    [Fact]
    public async Task The_hidden_field_gets_the_normal_answer_and_sends_nothing()
    {
        var (controller, handler) = Build(HttpStatusCode.Accepted);

        var result = await controller.Submit(Valid(website: "http://spam.example"), CancellationToken.None);

        Assert.Equal(StatusCodes.Status202Accepted, Status(result));
        Assert.Empty(handler.Calls);
    }

    [Fact]
    public async Task A_closed_door_sends_nothing()
    {
        var (controller, handler) = Build(HttpStatusCode.Accepted, open: false);

        var result = await controller.Submit(Valid(), CancellationToken.None);

        Assert.Equal(StatusCodes.Status403Forbidden, Status(result));
        Assert.Empty(handler.Calls);
    }

    [Fact]
    public async Task A_weak_password_is_refused_before_it_leaves()
    {
        var (controller, handler) = Build(HttpStatusCode.Accepted);

        var result = await controller.Submit(Valid() with { Password = "short" }, CancellationToken.None);

        Assert.Equal(StatusCodes.Status400BadRequest, Status(result));
        Assert.Empty(handler.Calls);
    }

    [Fact]
    public async Task A_missing_body_is_a_bad_request_not_a_crash()
    {
        var (controller, handler) = Build(HttpStatusCode.Accepted);

        var result = await controller.Submit(null, CancellationToken.None);

        Assert.Equal(StatusCodes.Status400BadRequest, Status(result));
        Assert.Empty(handler.Calls);
    }

    [Theory]
    [InlineData(HttpStatusCode.BadRequest, StatusCodes.Status400BadRequest)]
    [InlineData(HttpStatusCode.TooManyRequests, StatusCodes.Status429TooManyRequests)]
    [InlineData(HttpStatusCode.InternalServerError, StatusCodes.Status503ServiceUnavailable)]
    [InlineData(HttpStatusCode.Forbidden, StatusCodes.Status503ServiceUnavailable)]
    public async Task What_the_identity_service_says_is_never_passed_on(HttpStatusCode idp, int expected)
    {
        var (controller, _) = Build(idp);

        var result = await controller.Submit(Valid(), CancellationToken.None);

        Assert.Equal(expected, Status(result));
    }
}
