using System.Net;
using System.Text;
using System.Text.Json;
using AnimStudio.Api.Common;
using AnimStudio.Api.Contracts;
using AnimStudio.Api.Controllers;
using AnimStudio.Api.Security;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Admin;
using AnimStudio.Application.Options;
using AnimStudio.Application.Security;
using AnimStudio.Domain.Ai;
using AnimStudio.Domain.System;
using AnimStudio.Infrastructure.Settings;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Infrastructure;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace AnimStudio.Application.Tests.Security;

/// <summary>
/// The limits on the administrator's side of access requests: which requests and accounts this
/// screen may touch, and the one role an approval can grant.
/// </summary>
public sealed class AdminSignupsControllerTests
{
    private const string Pending = "66f1b2c3d4e5f60718293a01";
    private const string Other = "66f1b2c3d4e5f60718293a02";
    private const string Done = "66f1b2c3d4e5f60718293a03";

    private sealed class FixedOptions(AdminOptions value) : IOptionsMonitor<AdminOptions>
    {
        public AdminOptions CurrentValue => value;
        public AdminOptions Get(string? name) => value;
        public IDisposable? OnChange(Action<AdminOptions, string?> listener) => null;
    }

    private sealed class Call(HttpRequestMessage request, string body)
    {
        public HttpMethod Method { get; } = request.Method;
        public string Path { get; } = request.RequestUri!.PathAndQuery;
        public string? Authorization { get; } = request.Headers.Authorization?.ToString();
        public string Body { get; } = body;
    }

    private sealed class RoutingHandler(Func<HttpMethod, string, (HttpStatusCode Status, string Body)> route) : HttpMessageHandler
    {
        public List<Call> Calls { get; } = [];

        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            var sent = request.Content is null ? string.Empty : await request.Content.ReadAsStringAsync(cancellationToken);
            Calls.Add(new Call(request, sent));
            var (status, body) = route(request.Method, request.RequestUri!.PathAndQuery);
            return new HttpResponseMessage(status) { Content = new StringContent(body, Encoding.UTF8, "application/json") };
        }
    }

    private sealed class StubFactory(HttpMessageHandler handler) : IHttpClientFactory
    {
        public HttpClient CreateClient(string name) => new(handler, disposeHandler: false);
    }

    private sealed class MemoryAudit : IAdminAuditRepository
    {
        public List<AdminAuditEntry> Entries { get; } = [];
        public Task AppendAsync(AdminAuditEntry entry, CancellationToken ct) { Entries.Add(entry); return Task.CompletedTask; }
        public Task<IReadOnlyList<AdminAuditEntry>> ListRecentAsync(int limit, CancellationToken ct) => Task.FromResult<IReadOnlyList<AdminAuditEntry>>(Entries);
    }

    private sealed class MemorySettings : IWebSettingRepository
    {
        public Dictionary<string, WebSetting> Rows { get; } = new(StringComparer.OrdinalIgnoreCase);
        public Task<IReadOnlyList<WebSetting>> ListAsync(CancellationToken ct) => Task.FromResult<IReadOnlyList<WebSetting>>([.. Rows.Values]);
        public Task UpsertAsync(WebSetting setting, CancellationToken ct) { Rows[setting.Id] = setting; return Task.CompletedTask; }
        public Task<bool> DeleteAsync(string id, CancellationToken ct) => Task.FromResult(Rows.Remove(id));
    }

    private static string Row(string id, string email, string? reason, object status, string? note = null) =>
        JsonSerializer.Serialize(new { id, email, displayName = "Person " + id[^2..], reason, status, createdAt = "2026-10-30T10:00:00Z", decidedAt = (string?)null, decisionNote = note, createdUserId = (string?)null });

    private static string Queue(params string[] rows) => "[" + string.Join(",", rows) + "]";

    private static (AdminSignupsController Controller, RoutingHandler Idp, MemoryAudit Audit) Build(
        Func<HttpMethod, string, (HttpStatusCode, string)> route, bool bearer = true)
    {
        var handler = new RoutingHandler(route);
        var options = new FixedOptions(new AdminOptions());
        var identity = new StudioIdentityClient(new StubFactory(handler), options, NullLogger<StudioIdentityClient>.Instance);
        var audit = new MemoryAudit();
        var user = new LocalSingleUserProvider();
        var settings = new WebSettingsService(
            new MemorySettings(), new WebSettingsRuntime(new WebSettingsConfigurationSource(), TimeProvider.System),
            new ConfigurationBuilder().Build(), TimeProvider.System, NullLogger<WebSettingsService>.Instance);
        var controller = new AdminSignupsController(
            identity, new AdminAuditService(audit, user, TimeProvider.System, NullLogger<AdminAuditService>.Instance), settings, options, user)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };
        if (bearer) controller.HttpContext.Request.Headers.Authorization = "Bearer admin-token";
        return (controller, handler, audit);
    }

    private static (HttpStatusCode, string) Standard(HttpMethod method, string path)
    {
        if (method == HttpMethod.Get && path.StartsWith("/api/account-requests/admin", StringComparison.Ordinal))
        {
            return (HttpStatusCode.OK, Queue(
                Row(Pending, "asha@example.com", "[AnimStudio] I make shorts", 0),
                Row(Other, "reader@example.com", "I want to comment on the blog", "Pending"),
                Row(Done, "old@example.com", "[AnimStudio]", 1, "ok")));
        }
        return (HttpStatusCode.NoContent, string.Empty);
    }

    private static int? Status<T>(ActionResult<T> result) => (result.Result as IStatusCodeActionResult)?.StatusCode;

    private static T Data<T>(ActionResult<ApiResponse<T>> result) =>
        ((ApiResponse<T>)((OkObjectResult)result.Result!).Value!).Data!;

    // --- the queue ---------------------------------------------------------------------

    [Fact]
    public async Task Only_requests_made_from_animstudio_are_listed_and_the_tag_is_hidden()
    {
        var (controller, _, _) = Build(Standard);

        var result = await controller.List(null, CancellationToken.None);

        var items = Data(result);
        Assert.Equal([Pending, Done], items.Select(i => i.Id).ToArray());
        Assert.Equal("I make shorts", items[0].Reason);
        Assert.Null(items[1].Reason);
        Assert.Equal(new[] { "Pending", "Approved" }, items.Select(i => i.Status).ToArray());
    }

    [Fact]
    public async Task The_summary_counts_only_this_screens_requests()
    {
        var (controller, _, _) = Build(Standard);

        var summary = Data(await controller.Summary(CancellationToken.None));

        Assert.Equal(new AdminSignupSummary(1, 1, 0, 2), summary);
    }

    [Fact]
    public async Task Without_a_bearer_token_nothing_is_asked_of_the_identity_service()
    {
        var (controller, idp, _) = Build(Standard, bearer: false);

        var result = await controller.List(null, CancellationToken.None);

        Assert.Equal(StatusCodes.Status401Unauthorized, Status(result));
        Assert.Empty(idp.Calls);
    }

    // --- approving ---------------------------------------------------------------------

    [Fact]
    public async Task An_approval_grants_the_studio_role_and_nothing_else_and_passes_the_admins_token()
    {
        var (controller, idp, audit) = Build(Standard);

        var result = await controller.Approve(Pending, new AdminSignupDecisionRequest("welcome"), CancellationToken.None);

        Assert.Equal("Approved", Data(result).Status);
        var approve = Assert.Single(idp.Calls, c => c.Path.EndsWith("/approve", StringComparison.Ordinal));
        Assert.Equal(HttpMethod.Post, approve.Method);
        Assert.Equal($"/api/account-requests/admin/{Pending}/approve", approve.Path);
        Assert.Equal("Bearer admin-token", approve.Authorization);
        using var sent = JsonDocument.Parse(approve.Body);
        Assert.Equal(new[] { "StudioUser" }, sent.RootElement.GetProperty("roles").EnumerateArray().Select(r => r.GetString()!).ToArray());
        Assert.Equal("welcome", sent.RootElement.GetProperty("note").GetString());
        Assert.Contains(audit.Entries, e => e.Action == "signup.approved" && e.Target == Pending);
    }

    [Fact]
    public async Task A_request_from_another_site_is_not_this_screens_to_approve()
    {
        var (controller, idp, audit) = Build(Standard);

        var result = await controller.Approve(Other, new AdminSignupDecisionRequest(null), CancellationToken.None);

        Assert.Equal(StatusCodes.Status409Conflict, Status(result));
        Assert.DoesNotContain(idp.Calls, c => c.Method == HttpMethod.Post);
        Assert.Empty(audit.Entries);
    }

    [Fact]
    public async Task An_already_decided_request_cannot_be_approved_again()
    {
        var (controller, idp, _) = Build((m, p) => m == HttpMethod.Get
            ? (HttpStatusCode.OK, Queue(Row(Pending, "a@example.com", "[AnimStudio]", 1)))
            : (HttpStatusCode.NoContent, string.Empty));

        var result = await controller.Approve(Pending, new AdminSignupDecisionRequest(null), CancellationToken.None);

        Assert.Equal(StatusCodes.Status409Conflict, Status(result));
        Assert.DoesNotContain(idp.Calls, c => c.Method == HttpMethod.Post);
    }

    [Theory]
    [InlineData("../users")]
    [InlineData("66f1b2c3d4e5f60718293a01/../x")]
    [InlineData("not-an-id")]
    public async Task A_malformed_id_never_reaches_a_url(string id)
    {
        var (controller, idp, _) = Build(Standard);

        var result = await controller.Approve(id, new AdminSignupDecisionRequest(null), CancellationToken.None);

        Assert.Equal(StatusCodes.Status404NotFound, Status(result));
        Assert.Empty(idp.Calls);
    }

    [Fact]
    public async Task If_the_identity_service_refuses_the_studio_role_nothing_broader_is_tried()
    {
        var (controller, idp, audit) = Build((m, p) => m == HttpMethod.Post
            ? (HttpStatusCode.BadRequest, "{\"error\":\"One or more roles are invalid.\"}")
            : Standard(m, p));

        var result = await controller.Approve(Pending, new AdminSignupDecisionRequest(null), CancellationToken.None);

        Assert.Equal(StatusCodes.Status502BadGateway, Status(result));
        var posts = idp.Calls.Where(c => c.Method == HttpMethod.Post).ToList();
        Assert.Single(posts);
        Assert.DoesNotContain("Viewer", posts[0].Body);
        Assert.DoesNotContain("Editor", posts[0].Body);
        Assert.Empty(audit.Entries);
    }

    [Fact]
    public async Task A_rejection_is_passed_on_and_recorded()
    {
        var (controller, idp, audit) = Build(Standard);

        var result = await controller.Reject(Pending, new AdminSignupDecisionRequest("not a creator"), CancellationToken.None);

        Assert.Equal("Rejected", Data(result).Status);
        Assert.Contains(idp.Calls, c => c.Path == $"/api/account-requests/admin/{Pending}/reject");
        Assert.Contains(audit.Entries, e => e.Action == "signup.rejected" && e.Target == Pending);
    }

    // --- the people who were approved ----------------------------------------------------

    private static string User(string id, string email, string[] roles, bool active = true) =>
        JsonSerializer.Serialize(new { id, email, displayName = "N", roles, isActive = active, twoFactorEnabled = false, createdAt = "2026-10-01T00:00:00Z", lastLoginAt = (string?)null });

    [Fact]
    public async Task Only_studio_only_accounts_are_listed_as_members()
    {
        var (controller, _, _) = Build((m, p) => (HttpStatusCode.OK, "[" + string.Join(",",
            User(Pending, "studio@example.com", ["StudioUser"]),
            User(Other, "editor@example.com", ["Editor"]),
            User(Done, "both@example.com", ["StudioUser", "Admin"])) + "]"));

        var members = Data(await controller.Members(CancellationToken.None));

        Assert.Equal(["studio@example.com"], members.Select(x => x.Email).ToArray());
    }

    [Fact]
    public async Task An_admins_account_cannot_be_switched_off_from_here()
    {
        var (controller, idp, audit) = Build((m, p) => m == HttpMethod.Get
            ? (HttpStatusCode.OK, User(Other, "root@example.com", ["Admin"]))
            : (HttpStatusCode.OK, "{}"));

        var result = await controller.SetActive(Other, new AdminMemberActiveRequest(false), CancellationToken.None);

        Assert.Equal(StatusCodes.Status403Forbidden, Status(result));
        Assert.DoesNotContain(idp.Calls, c => c.Method == HttpMethod.Put);
        Assert.Empty(audit.Entries);
    }

    [Fact]
    public async Task A_studio_only_account_can_be_switched_off_and_the_change_is_recorded()
    {
        var (controller, idp, audit) = Build((m, p) => m == HttpMethod.Get
            ? (HttpStatusCode.OK, User(Pending, "studio@example.com", ["StudioUser"]))
            : (HttpStatusCode.OK, User(Pending, "studio@example.com", ["StudioUser"], active: false)));

        var result = await controller.SetActive(Pending, new AdminMemberActiveRequest(false), CancellationToken.None);

        Assert.False(Data(result).IsActive);
        var put = Assert.Single(idp.Calls, c => c.Method == HttpMethod.Put);
        Assert.Equal($"/api/users/{Pending}", put.Path);
        using var sent = JsonDocument.Parse(put.Body);
        Assert.False(sent.RootElement.GetProperty("isActive").GetBoolean());
        Assert.DoesNotContain("roles", put.Body, StringComparison.OrdinalIgnoreCase);
        Assert.Contains(audit.Entries, e => e.Action == "member.deactivated");
    }
}
