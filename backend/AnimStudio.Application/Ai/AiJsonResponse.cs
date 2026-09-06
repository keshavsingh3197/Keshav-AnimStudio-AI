using System.Text.Json;

namespace AnimStudio.Application.Ai;

/// <summary>
/// Turns what a language model actually returns into the JSON the caller asked for.
/// </summary>
/// <remarks>
/// <para>
/// Models wrap JSON in markdown code fences even when told not to. That is common enough,
/// and unambiguous enough, to unwrap here rather than to fail on. What is NOT unwrapped is
/// prose around the JSON: hunting for the first <c>{</c> in a paragraph means guessing
/// where the model stopped talking and started answering, and a guess that is wrong
/// produces a half-parsed object the caller believes. A response with prose in it fails,
/// the provider counts as having failed, and the next provider in the chain gets a turn -
/// which is a better outcome than a confident wrong shape.
/// </para>
/// <para>
/// Validation happens here, inside the provider call, so that an invalid response never
/// reaches the result cache. A cached bad answer would be returned forever.
/// </para>
/// </remarks>
public static class AiJsonResponse
{
    /// <summary>
    /// Strips a surrounding markdown code fence, with or without a language tag. Anything
    /// else is returned trimmed and otherwise untouched.
    /// </summary>
    public static string Unwrap(string? raw)
    {
        var text = raw?.Trim() ?? string.Empty;

        if (!text.StartsWith("```", StringComparison.Ordinal)) return text;

        var firstLineEnd = text.IndexOf('\n');
        if (firstLineEnd < 0) return text;

        // The opening fence line is "```" or "```json" - anything longer is not a fence.
        var tag = text[3..firstLineEnd].Trim();
        if (tag.Length > 16) return text;

        var closing = text.LastIndexOf("```", StringComparison.Ordinal);
        if (closing <= firstLineEnd) return text;

        return text[(firstLineEnd + 1)..closing].Trim();
    }

    /// <summary>
    /// Unwraps, parses and validates against <paramref name="schema"/>, returning the JSON
    /// text to hand back to the caller. Throws <see cref="AiProviderException"/> when the
    /// model did not answer in the requested shape.
    /// </summary>
    /// <remarks>
    /// The exception message names the failing paths but never quotes the values at them.
    /// A value here is model output derived from the user's transcript, and this message
    /// travels into logs.
    /// </remarks>
    public static string Require(string? raw, string schema)
    {
        var text = Unwrap(raw);

        if (text.Length == 0)
            throw new AiProviderException("empty-response", "The model returned nothing.");

        if (!JsonShapeValidator.TryParse(text, schema, out _, out var result))
        {
            var paths = string.Join(", ", result.Errors.Take(5).Select(e => e.Path));

            throw new AiProviderException(
                "schema-mismatch",
                $"The model's response did not match the requested shape ({result.Errors.Count} " +
                $"problem(s) at: {paths}).");
        }

        return text;
    }

    /// <summary>
    /// True when the text parses as JSON at all - used to decide whether a retry without
    /// the provider's JSON mode is worth attempting.
    /// </summary>
    public static bool LooksLikeJson(string? raw)
    {
        var text = Unwrap(raw);
        if (text.Length == 0) return false;
        if (text[0] is not ('{' or '[')) return false;

        try
        {
            using var _ = JsonDocument.Parse(text);
            return true;
        }
        catch (JsonException)
        {
            return false;
        }
    }
}
