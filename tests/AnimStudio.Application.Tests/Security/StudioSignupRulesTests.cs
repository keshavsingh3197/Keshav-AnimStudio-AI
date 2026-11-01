using AnimStudio.Application.Security;

namespace AnimStudio.Application.Tests.Security;

public sealed class StudioSignupRulesTests
{
    private const string GoodPassword = "correct-horse-battery";

    [Fact]
    public void A_complete_request_is_accepted()
    {
        Assert.Null(StudioSignupRules.Validate("asha@example.com", "Asha Rao", GoodPassword, "I make devotional animations."));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("not-an-email")]
    [InlineData("two@@example.com")]
    [InlineData("nodot@localhost")]
    public void A_bad_email_is_refused(string? email)
    {
        Assert.Equal("Enter a valid email address.", StudioSignupRules.Validate(email, "Asha Rao", GoodPassword, null));
    }

    [Fact]
    public void A_name_is_required()
    {
        Assert.NotNull(StudioSignupRules.Validate("asha@example.com", " ", GoodPassword, null));
        Assert.NotNull(StudioSignupRules.Validate("asha@example.com", null, GoodPassword, null));
    }

    [Theory]
    [InlineData("short1")]
    [InlineData("aaaaaaaaaaaaaaaa")]
    [InlineData("password12345")]
    [InlineData("asha-is-great-1234")]
    public void A_weak_password_is_refused(string password)
    {
        Assert.NotNull(StudioSignupRules.Validate("asha@example.com", "Asha Rao", password, null));
    }

    [Fact]
    public void A_password_containing_the_persons_name_is_refused()
    {
        Assert.NotNull(StudioSignupRules.Validate("someone@example.com", "Asha Rao", "xx-Asha Rao-xx-1234", null));
    }

    [Fact]
    public void The_reason_is_tagged_flattened_and_bounded()
    {
        var reason = StudioSignupRules.BuildReason("  I make\n\tshorts \u0007 " + new string('x', 2000));

        Assert.StartsWith(StudioSignupRules.AppTag + " I make shorts", reason);
        Assert.True(reason.Length <= StudioSignupRules.AppTag.Length + 1 + StudioSignupRules.MaxReasonLength);
        Assert.DoesNotContain('\u0007', reason);
    }

    [Fact]
    public void A_tag_typed_into_the_box_is_not_doubled()
    {
        Assert.Equal("[AnimStudio] hello", StudioSignupRules.BuildReason("[animstudio] hello"));
    }

    [Fact]
    public void An_empty_reason_is_just_the_tag()
    {
        Assert.Equal(StudioSignupRules.AppTag, StudioSignupRules.BuildReason(null));
        Assert.Equal(StudioSignupRules.AppTag, StudioSignupRules.BuildReason("   "));
    }

    [Theory]
    [InlineData("[AnimStudio] please", true)]
    [InlineData("  [animstudio]", true)]
    [InlineData("I want to comment on the blog", false)]
    [InlineData("see [AnimStudio] later", false)]
    [InlineData(null, false)]
    public void Only_tagged_requests_are_this_screens_to_decide(string? reason, bool expected)
    {
        Assert.Equal(expected, StudioSignupRules.IsStudioRequest(reason));
    }

    [Fact]
    public void The_reason_is_shown_without_the_tag()
    {
        Assert.Equal("please", StudioSignupRules.ReasonForDisplay("[AnimStudio] please"));
        Assert.Null(StudioSignupRules.ReasonForDisplay("[AnimStudio]"));
        Assert.Equal("plain", StudioSignupRules.ReasonForDisplay("plain"));
    }

    [Theory]
    [InlineData("66f1b2c3d4e5f60718293a4b", true)]
    [InlineData("66F1B2C3D4E5F60718293A4B", true)]
    [InlineData("66f1b2c3d4e5f60718293a4", false)]
    [InlineData("../admin", false)]
    [InlineData("66f1b2c3d4e5f60718293a4b/approve", false)]
    [InlineData("", false)]
    [InlineData(null, false)]
    public void Only_a_well_formed_id_ever_reaches_a_url(string? id, bool expected)
    {
        Assert.Equal(expected, StudioSignupRules.IsValidRequestId(id));
    }

    [Fact]
    public void Only_an_account_with_the_studio_role_and_no_other_is_manageable_here()
    {
        Assert.True(StudioSignupRules.IsStudioOnly(["StudioUser"]));
        Assert.True(StudioSignupRules.IsStudioOnly(["studiouser"]));
        Assert.False(StudioSignupRules.IsStudioOnly(["StudioUser", "Editor"]));
        Assert.False(StudioSignupRules.IsStudioOnly(["Admin"]));
        Assert.False(StudioSignupRules.IsStudioOnly(["Viewer"]));
        Assert.False(StudioSignupRules.IsStudioOnly([]));
        Assert.False(StudioSignupRules.IsStudioOnly(null));
    }

    [Fact]
    public void A_note_is_one_bounded_line()
    {
        Assert.Null(StudioSignupRules.CleanNote("  "));
        var note = StudioSignupRules.CleanNote("looks\nfine " + new string('y', 900));
        Assert.StartsWith("looks fine", note);
        Assert.True(note!.Length <= StudioSignupRules.MaxNoteLength);
    }
}
