using AnimStudio.Domain.Ai;

namespace AnimStudio.Application.Tests.Ai;

public class AiProviderIdTests
{
    [Theory]
    [InlineData("groq", "groq")]
    [InlineData("  Groq  ", "groq")]
    [InlineData("comfyui-local", "comfyui-local")]
    [InlineData("gpt-4o-mini-2024", "gpt-4o-mini-2024")]
    public void Accepts_and_normalizes_a_well_formed_id(string raw, string expected)
    {
        Assert.True(AiProviderId.TryParse(raw, out var id));
        Assert.Equal(expected, id.Value);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("-leading")]
    [InlineData("trailing-")]
    [InlineData("double--hyphen")]
    [InlineData("has space")]
    [InlineData("has_underscore")]
    [InlineData("UPPER/slash")]
    public void Rejects_anything_that_is_not_a_plain_kebab_id(string? raw)
    {
        Assert.False(AiProviderId.TryParse(raw, out _));
    }

    [Theory]
    [InlineData("../../etc/passwd")]
    [InlineData("..")]
    [InlineData("a/b")]
    [InlineData("a\\b")]
    [InlineData("a.b")]
    public void Rejects_ids_that_could_traverse_a_path(string raw)
    {
        // Provider ids end up in cache keys and storage keys, so a traversal sequence
        // must never survive parsing.
        Assert.False(AiProviderId.TryParse(raw, out _));
    }

    [Fact]
    public void Rejects_an_id_longer_than_the_cap()
    {
        Assert.False(AiProviderId.TryParse(new string('a', AiProviderId.MaxLength + 1), out _));
        Assert.True(AiProviderId.TryParse(new string('a', AiProviderId.MaxLength), out _));
    }

    [Fact]
    public void Parse_throws_on_a_bad_id()
    {
        Assert.Throws<ArgumentException>(() => AiProviderId.Parse("not valid"));
    }

    [Fact]
    public void Ids_compare_by_value_after_normalization()
    {
        Assert.Equal(AiProviderId.Parse("Groq"), AiProviderId.Parse("groq"));
    }
}
