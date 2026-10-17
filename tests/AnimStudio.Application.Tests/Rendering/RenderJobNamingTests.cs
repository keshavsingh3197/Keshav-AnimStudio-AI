using AnimStudio.Application.Rendering;

namespace AnimStudio.Application.Tests.Rendering;

/// <summary>Project names here are synthetic.</summary>
public class RenderJobNamingTests
{
    private static readonly RenderNameContext Context =
        new("Test Badger", "Short", "9:16", 1080, 1920, 3, new DateTime(2026, 10, 10, 14, 5, 0, DateTimeKind.Utc));

    [Fact]
    public void Default_template_names_project_format_and_number()
    {
        Assert.Equal("Test Badger · Short 9:16 · #3", RenderJobNaming.Expand(null, Context));
    }

    [Fact]
    public void Every_token_expands()
    {
        var name = RenderJobNaming.Expand("{project}|{format}|{aspect}|{resolution}|{n}|{date}|{time}", Context);

        Assert.Equal("Test Badger|Short|9:16|1080×1920|3|2026-10-10|14:05", name);
    }

    [Fact]
    public void Tokens_are_case_insensitive_and_unknown_ones_stay_visible()
    {
        Assert.Equal("Test Badger {oops}", RenderJobNaming.Expand("{PROJECT} {oops}", Context));
    }

    [Fact]
    public void Missing_project_name_falls_back()
    {
        Assert.Equal("Render #3", RenderJobNaming.Expand("{project} #{n}", Context with { ProjectName = "  " }));
    }

    [Theory]
    [InlineData("  Badger\t\tcut  ", "Badger cut")]
    [InlineData("Line\none", "Line one")]
    [InlineData("<b>Bold</b>", "bBold/b")]
    [InlineData("   ", null)]
    [InlineData(null, null)]
    public void Normalize_cleans_what_users_type(string? input, string? expected) =>
        Assert.Equal(expected, RenderJobNaming.Normalize(input));

    [Fact]
    public void Normalize_caps_length_without_splitting_an_emoji()
    {
        var name = new string('a', RenderJobNaming.MaxLength - 1) + "😀";

        var cleaned = RenderJobNaming.Normalize(name)!;

        Assert.True(cleaned.Length <= RenderJobNaming.MaxLength);
        Assert.False(char.IsHighSurrogate(cleaned[^1]));
    }
}
