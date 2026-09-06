using System.Text.Json;
using AnimStudio.Application.Ai;

namespace AnimStudio.Application.Tests.Ai;

public class JsonShapeValidatorTests
{
    private const string CharacterSchema =
        """
        {
          "type": "array",
          "maxItems": 3,
          "items": {
            "type": "object",
            "required": ["name"],
            "properties": {
              "name": { "type": "string", "minLength": 1, "maxLength": 20 },
              "age": { "type": "integer", "minimum": 0, "maximum": 120 },
              "narrator": { "type": "boolean" },
              "aliases": { "type": "array", "items": { "type": "string" } }
            }
          }
        }
        """;

    private static ShapeResult Check(string json, string schema = CharacterSchema) =>
        JsonShapeValidator.Validate(JsonDocument.Parse(json).RootElement, schema);

    [Fact]
    public void A_well_formed_response_passes()
    {
        var result = Check("""[{"name":"Rahul","age":25,"narrator":false,"aliases":["Ra"]}]""");

        Assert.True(result.IsValid);
    }

    [Fact]
    public void A_missing_required_field_fails()
    {
        Assert.False(Check("""[{"age":25}]""").IsValid);
    }

    [Fact]
    public void A_required_field_set_to_null_counts_as_missing()
    {
        // A model that writes "name": null has not answered, and treating that as present
        // would put a null where the caller expects a name.
        Assert.False(Check("""[{"name":null}]""").IsValid);
    }

    [Fact]
    public void An_optional_field_set_to_null_is_simply_absent()
    {
        Assert.True(Check("""[{"name":"Rahul","age":null}]""").IsValid);
    }

    [Fact]
    public void An_unexpected_property_fails_by_default()
    {
        // additionalProperties defaults to false: an object that accepts anything is not a
        // shape, and a model inventing fields is a signal worth acting on.
        var result = Check("""[{"name":"Rahul","favouriteColour":"blue"}]""");

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.Message.Contains("Unexpected", StringComparison.Ordinal));
    }

    [Fact]
    public void Extra_properties_pass_when_the_schema_allows_them()
    {
        const string schema =
            """
            { "type": "object", "additionalProperties": true,
              "properties": { "name": { "type": "string" } } }
            """;

        Assert.True(Check("""{"name":"Rahul","extra":1}""", schema).IsValid);
    }

    [Theory]
    [InlineData("""[{"name":123}]""")]
    [InlineData("""[{"name":"Rahul","age":"twenty"}]""")]
    [InlineData("""[{"name":"Rahul","narrator":"yes"}]""")]
    [InlineData("""[{"name":"Rahul","aliases":"Ra"}]""")]
    public void A_wrong_type_fails(string json)
    {
        Assert.False(Check(json).IsValid);
    }

    [Fact]
    public void A_fractional_value_fails_an_integer_field()
    {
        Assert.False(Check("""[{"name":"Rahul","age":25.5}]""").IsValid);
    }

    [Fact]
    public void Bounds_are_enforced()
    {
        Assert.False(Check("""[{"name":"Rahul","age":-1}]""").IsValid);
        Assert.False(Check("""[{"name":"Rahul","age":500}]""").IsValid);
        Assert.False(Check("""[{"name":""}]""").IsValid);
        Assert.False(Check("""[{"name":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaa"}]""").IsValid);
        Assert.False(Check("""[{"name":"a"},{"name":"b"},{"name":"c"},{"name":"d"}]""").IsValid);
    }

    [Fact]
    public void An_enum_restricts_the_permitted_values()
    {
        const string schema =
            """
            { "type": "object", "required": ["kind"],
              "properties": { "kind": { "type": "string", "enum": ["Strike", "Kick"] } } }
            """;

        Assert.True(Check("""{"kind":"Kick"}""", schema).IsValid);
        Assert.False(Check("""{"kind":"Headbutt"}""", schema).IsValid);
        Assert.False(Check("""{"kind":"kick"}""", schema).IsValid);
    }

    [Fact]
    public void A_schema_using_an_unsupported_keyword_fails_closed()
    {
        // The alternative - ignoring it - means the author believes a constraint is being
        // enforced when it is not. That is worse than no validator.
        const string schema =
            """
            { "type": "string", "pattern": "^[a-z]+$" }
            """;

        var result = Check("\"abc\"", schema);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.Message.Contains("unsupported keyword", StringComparison.Ordinal));
    }

    [Fact]
    public void A_malformed_schema_is_reported_rather_than_thrown()
    {
        var result = Check("\"abc\"", "{ not json");

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.Path == "$schema");
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("not json at all")]
    [InlineData("Here is your JSON: [{\"name\":\"Rahul\"}]")]
    public void TryParse_rejects_a_response_that_is_not_clean_json(string? json)
    {
        // Models like to wrap JSON in prose. That must be a failure the caller sees, not a
        // parse that silently half-works.
        Assert.False(JsonShapeValidator.TryParse(json, CharacterSchema, out _, out var result));
        Assert.False(result.IsValid);
    }

    [Fact]
    public void TryParse_returns_an_element_that_outlives_the_document()
    {
        Assert.True(JsonShapeValidator.TryParse(
            """[{"name":"Rahul"}]""", CharacterSchema, out var value, out _));

        // Would throw ObjectDisposedException if the element still referenced a disposed
        // JsonDocument.
        Assert.Equal("Rahul", value[0].GetProperty("name").GetString());
    }

    [Fact]
    public void A_long_list_of_bad_rows_does_not_produce_an_unbounded_error_report()
    {
        var rows = string.Join(',', Enumerable.Repeat("""{"nope":1}""", 200));

        const string schema =
            """
            { "type": "array", "items": { "type": "object",
              "properties": { "name": { "type": "string" } } } }
            """;

        Assert.True(Check($"[{rows}]", schema).Errors.Count <= 60);
    }
}

public class AiOutputSanitizerTests
{
    [Theory]
    [InlineData("../../../etc/passwd", "etc passwd")]
    [InlineData("Rahul", "Rahul")]
    [InlineData("Rahul Sharma", "Rahul Sharma")]
    [InlineData("scene-01_final", "scene-01_final")]
    [InlineData("..", null)]
    [InlineData("../..", null)]
    [InlineData("C:\\Windows\\System32", "C Windows System32")]
    [InlineData("name; rm -rf /", "name rm -rf")]
    [InlineData("$(whoami)", "whoami")]
    [InlineData("   ", null)]
    [InlineData(null, null)]
    public void ToSafeName_strips_anything_that_could_reach_a_path_or_an_argument(
        string? input, string? expected)
    {
        Assert.Equal(expected, AiOutputSanitizer.ToSafeName(input));
    }

    [Fact]
    public void ToSafeName_keeps_letters_from_other_scripts()
    {
        // A character called "राहुल" is a name, not an attack.
        Assert.Equal("राहुल", AiOutputSanitizer.ToSafeName("राहुल"));
    }

    [Fact]
    public void ToSafeName_caps_the_length()
    {
        Assert.Equal(10, AiOutputSanitizer.ToSafeName(new string('a', 200), 10)!.Length);
    }

    [Fact]
    public void ToSafeText_keeps_prose_and_removes_invisible_characters()
    {
        var cleaned = AiOutputSanitizer.ToSafeText("Line one.\nLine two.\u0007\u200B");

        Assert.Contains("Line one.\nLine two.", cleaned, StringComparison.Ordinal);
        Assert.DoesNotContain('\u0007', cleaned!);
    }

    [Fact]
    public void ToSafeLine_collapses_newlines_because_a_subtitle_cannot_wrap_unexpectedly()
    {
        Assert.Equal("one two three", AiOutputSanitizer.ToSafeLine("one\ntwo\r\nthree"));
    }

    [Theory]
    [InlineData("#ff8800", "#FF8800")]
    [InlineData("ff8800", "#FF8800")]
    [InlineData("#f80", "#FF8800")]
    [InlineData("red", null)]
    [InlineData("#ff88000", null)]
    [InlineData("#gg8800", null)]
    [InlineData("", null)]
    public void ToSafeHexColor_returns_a_colour_or_nothing(string input, string? expected)
    {
        // This value ends up inside an ASS subtitle header, where an arbitrary string would
        // corrupt the file rather than merely look wrong.
        Assert.Equal(expected, AiOutputSanitizer.ToSafeHexColor(input));
    }

    [Fact]
    public void ToSafeKey_makes_the_same_place_produce_the_same_key()
    {
        // This is what lets forty scenes in one arena share a single generated background.
        Assert.Equal("the ring", AiOutputSanitizer.ToSafeKey("The RING!"));
        Assert.Equal("the ring", AiOutputSanitizer.ToSafeKey("  the   ring  "));
        Assert.Equal(AiOutputSanitizer.ToSafeKey("Wrestling Ring"),
                     AiOutputSanitizer.ToSafeKey("wrestling ring"));
    }

    [Fact]
    public void Numbers_are_clamped_into_the_range_the_caller_can_use()
    {
        Assert.Equal(1.0, AiOutputSanitizer.ToRange(5.0, 0, 1));
        Assert.Equal(0.0, AiOutputSanitizer.ToRange(-2.0, 0, 1));
        Assert.Equal(0.5, AiOutputSanitizer.ToRange(0.5, 0, 1));
        Assert.Equal(0.0, AiOutputSanitizer.ToRange(double.NaN, 0, 1));
    }
}
