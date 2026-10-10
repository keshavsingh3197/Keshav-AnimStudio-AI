using AnimStudio.Application.Ai;

namespace AnimStudio.Infrastructure.Ai.Providers;

/// <summary>
/// Gemini puts the model in the URL path, so an operator-supplied name is validated rather
/// than interpolated: a configured string reaching a request path is exactly how a call ends
/// up somewhere other than where it was meant to.
/// </summary>
internal static class GeminiModelName
{
    /// <summary>Accepts either "gemini-2.5-flash" or the fully qualified "models/gemini-2.5-flash".</summary>
    public static string Resolve(string? configured, string fallback)
    {
        var name = configured?.Trim();

        if (string.IsNullOrEmpty(name)) return fallback;

        if (name.StartsWith("models/", StringComparison.OrdinalIgnoreCase))
            name = name["models/".Length..];

        var valid = name.Length is > 0 and <= 80 &&
                    name.All(c => char.IsAsciiLetterOrDigit(c) || c is '-' or '.' or '_');

        if (!valid)
        {
            throw new AiProviderException("model-invalid",
                "The configured Gemini model name is not a valid model identifier.");
        }

        return name;
    }
}
