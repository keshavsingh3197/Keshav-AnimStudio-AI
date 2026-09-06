using System.Net;
using System.Security.Claims;
using AnimStudio.Api.Security;
using AnimStudio.Application.Options;
using Microsoft.AspNetCore.Http;

namespace AnimStudio.Application.Tests.Admin;

/// <summary>
/// Who is allowed to administer this server.
/// </summary>
/// <remarks>
/// The rule is short, which is the point: it is stated once and both the authorization
/// policy and the endpoint that tells the UI whether to show an admin link read it from
/// here, so a screen cannot offer a control the server would refuse.
/// </remarks>
public class AdminAccessRulesTests
{
    private static HttpContext From(string? remoteAddress)
    {
        var context = new DefaultHttpContext();

        context.Connection.RemoteIpAddress =
            remoteAddress is null ? null : IPAddress.Parse(remoteAddress);

        return context;
    }

    private static ClaimsPrincipal SignedIn(params (string Type, string Value)[] claims) =>
        new(new ClaimsIdentity([.. claims.Select(c => new Claim(c.Type, c.Value))], "test"));

    private static readonly ClaimsPrincipal Anonymous = new(new ClaimsIdentity());

    [Theory]
    [InlineData("127.0.0.1")]
    [InlineData("::1")]
    [InlineData("::ffff:127.0.0.1")]
    public void In_local_mode_a_caller_on_this_machine_is_admitted(string address)
    {
        var options = new AdminOptions { Mode = AdminAccessMode.LocalOnly };

        Assert.True(AdminAccessRules.IsAdmitted(options, From(address), Anonymous));
    }

    [Theory]
    [InlineData("203.0.113.7")]
    [InlineData("192.168.1.20")]
    public void In_local_mode_anyone_else_is_refused_including_the_local_network(string address)
    {
        // The machine, not the network. A laptop on the same wifi is somebody else.
        var options = new AdminOptions { Mode = AdminAccessMode.LocalOnly };

        Assert.False(AdminAccessRules.IsAdmitted(options, From(address), Anonymous));
    }

    [Fact]
    public void A_forwarded_header_claiming_to_be_local_changes_nothing()
    {
        // The check reads the connection's peer. A header is written by whoever sent the
        // request, so honouring one here would make the rule no rule at all.
        var options = new AdminOptions { Mode = AdminAccessMode.LocalOnly };
        var context = From("203.0.113.7");

        context.Request.Headers["X-Forwarded-For"] = "127.0.0.1";

        Assert.False(AdminAccessRules.IsAdmitted(options, context, Anonymous));
    }

    [Fact]
    public void A_request_with_no_peer_address_is_refused()
    {
        var options = new AdminOptions { Mode = AdminAccessMode.LocalOnly };

        Assert.False(AdminAccessRules.IsAdmitted(options, From(null), Anonymous));
        Assert.False(AdminAccessRules.IsAdmitted(options, null, Anonymous));
    }

    [Fact]
    public void When_administration_is_switched_off_nobody_is_admitted()
    {
        var options = new AdminOptions { Mode = AdminAccessMode.Disabled };

        Assert.False(AdminAccessRules.IsAdmitted(options, From("127.0.0.1"), Anonymous));
        Assert.False(AdminAccessRules.IsAdmitted(
            options, From("127.0.0.1"), SignedIn(("role", "Admin"))));
    }

    [Fact]
    public void In_token_mode_the_admin_role_is_admitted()
    {
        var options = new AdminOptions { Mode = AdminAccessMode.Jwt };

        Assert.True(AdminAccessRules.IsAdmitted(
            options, From("203.0.113.7"), SignedIn(("sub", "user-1"), ("role", "Admin"))));
    }

    [Theory]
    [InlineData("Editor")]
    [InlineData("Viewer")]
    [InlineData("admin")]
    public void In_token_mode_another_role_is_not_an_administrator(string role)
    {
        // Case-sensitive on purpose: the role names are a contract shared with the identity
        // provider, and matching "admin" loosely is how a typo becomes an escalation.
        var options = new AdminOptions { Mode = AdminAccessMode.Jwt };

        Assert.False(AdminAccessRules.IsAdmitted(
            options, From("203.0.113.7"), SignedIn(("sub", "user-1"), ("role", role))));
    }

    [Fact]
    public void In_token_mode_being_on_this_machine_is_not_enough()
    {
        // Otherwise switching a deployment to token mode would leave a way in for anything
        // that can reach the server over loopback - a co-located container, say.
        var options = new AdminOptions { Mode = AdminAccessMode.Jwt };

        Assert.False(AdminAccessRules.IsAdmitted(options, From("127.0.0.1"), Anonymous));
    }

    [Fact]
    public void An_unsigned_principal_carrying_the_right_claim_is_refused()
    {
        // ClaimsIdentity with no authentication type is not authenticated, and the rule has
        // to check that rather than only reading claims off it.
        var options = new AdminOptions { Mode = AdminAccessMode.Jwt };
        var unauthenticated = new ClaimsPrincipal(
            new ClaimsIdentity([new Claim("role", "Admin")]));

        Assert.False(AdminAccessRules.IsAdmitted(options, From("127.0.0.1"), unauthenticated));
    }
}
