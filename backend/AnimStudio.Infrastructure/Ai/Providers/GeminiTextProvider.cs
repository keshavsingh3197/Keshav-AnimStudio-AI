using System.Text;
using System.Text.Json;
using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Ai;
using AnimStudio.Application.Options;
using AnimStudio.Domain.Ai;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AnimStudio.Infrastructure.Ai.Providers;

/// <summary>
/// Text generation against Google's Generative Language API.
/// </summary>
/// <remarks>
/// <para>
/// Its own class rather than a configuration of the OpenAI-compatible one, because almost
/// nothing lines up: the model name is in the path, the system prompt is a separate
/// <c>systemInstruction</c> field, the content is a list of parts, JSON mode is a MIME type,
/// and a refusal arrives as a <c>finishReason</c> on an otherwise successful 200.
/// </para>
/// <para>
/// Gemini accepts its key either as a <c>?key=</c> query parameter or as a header. This uses
/// the header. A key in a URL ends up in request logs, in proxy logs and in any exception
/// that quotes the request URI, and none of those places are ones a credential should reach.
/// </para>
/// </remarks>
public sealed class GeminiTextProvider(
    AiProviderId id,
    IAiHttpClientFactory clients,
    IAiSecretResolver secrets,
    IOptionsMonitor<AiOptions> options,
    ILogger<GeminiTextProvider> logger)
    : HttpAiProviderBase(id, AiCapability.Text, clients, secrets, options, logger), ITextAiProvider
{
    private const string DefaultModel = "gemini-2.5-flash";

    /// <summary>Gemini is a hosted service; there is no local variant to fall back to.</summary>
    public override bool IsConfigured => base.IsConfigured && ProviderOptions?.IsLocal != true;

    protected override void ApplyAuthentication(HttpRequestMessage request, string secret) =>
        request.Headers.Add("x-goog-api-key", secret);

    public async Task<AiTextResult> CompleteAsync(AiTextRequest request, CancellationToken ct)
    {
        var model = ModelName();

        var generationConfig = new Dictionary<string, object?>(StringComparer.Ordinal)
        {
            ["temperature"] = Math.Clamp(request.Temperature, 0d, 2d),
            ["maxOutputTokens"] = Math.Clamp(request.MaxOutputTokens, 16, 32_768)
        };

        if (!string.IsNullOrWhiteSpace(request.JsonSchema))
            generationConfig["responseMimeType"] = "application/json";

        if (request.Seed is { } seed) generationConfig["seed"] = seed;

        var body = new Dictionary<string, object?>(StringComparer.Ordinal)
        {
            ["contents"] = new[]
            {
                new { role = "user", parts = new[] { new { text = request.Prompt } } }
            },
            ["generationConfig"] = generationConfig
        };

        if (!string.IsNullOrWhiteSpace(request.SystemPrompt))
        {
            body["systemInstruction"] = new
            {
                parts = new[] { new { text = request.SystemPrompt } }
            };
        }

        using var response = await PostJsonAsync(
            $"v1beta/models/{model}:generateContent", body, ct).ConfigureAwait(false);

        var root = response.RootElement;

        // A block arrives as a 200 with no candidates, which would otherwise read as an
        // empty answer rather than as the refusal it is.
        if (BlockReason(root) is { } blocked)
        {
            throw new AiProviderException("content-blocked",
                $"Gemini declined the request ({blocked}).");
        }

        var candidate = FirstCandidate(root);
        var finishReason = FinishReason(candidate);

        if (finishReason is "SAFETY" or "RECITATION" or "BLOCKLIST" or "PROHIBITED_CONTENT")
        {
            throw new AiProviderException("content-blocked",
                $"Gemini stopped generating ({finishReason}).");
        }

        var text = ReadText(candidate);

        if (string.IsNullOrWhiteSpace(text))
        {
            throw new AiProviderException("empty-response",
                finishReason is null
                    ? "Gemini returned no text."
                    : $"Gemini returned no text ({finishReason}).");
        }

        if (finishReason == "MAX_TOKENS")
        {
            if (!string.IsNullOrWhiteSpace(request.JsonSchema))
            {
                throw new AiProviderException("output-truncated",
                    "Gemini hit the output limit before finishing its JSON response.");
            }

            Logger.LogWarning(
                "Gemini hit the {Limit}-token output limit; the text is cut short.",
                request.MaxOutputTokens);
        }

        var content = string.IsNullOrWhiteSpace(request.JsonSchema)
            ? text
            : AiJsonResponse.Require(text, request.JsonSchema!);

        var (promptTokens, completionTokens) = ReadUsage(root);

        return new AiTextResult(
            content,
            new AiProvenance
            {
                ProviderId = Id.Value,
                Capability = AiCapability.Text,
                Model = model,
                PromptTemplateKey = request.PromptTemplateKey,
                PromptTemplateVersion = request.PromptTemplateVersion,
                Seed = request.Seed,
                GeneratedAtUtc = DateTime.UtcNow
            },
            promptTokens,
            completionTokens);
    }

    /// <summary>
    /// The model goes in the URL path, so it is validated rather than interpolated: an
    /// operator-supplied string reaching a request path is exactly how a call ends up
    /// somewhere other than where it was meant to.
    /// </summary>
    private string ModelName()
    {
        var configured = Model?.Trim();

        if (string.IsNullOrEmpty(configured)) return DefaultModel;

        // Accepts either "gemini-2.5-flash" or the fully qualified "models/gemini-2.5-flash".
        if (configured.StartsWith("models/", StringComparison.OrdinalIgnoreCase))
            configured = configured["models/".Length..];

        var valid = configured.Length is > 0 and <= 80 &&
                    configured.All(c => char.IsAsciiLetterOrDigit(c) || c is '-' or '.' or '_');

        if (!valid)
        {
            throw new AiProviderException("model-invalid",
                "The configured Gemini model name is not a valid model identifier.");
        }

        return configured;
    }

    private static string? BlockReason(JsonElement root) =>
        root.TryGetProperty("promptFeedback", out var feedback) &&
        feedback.ValueKind == JsonValueKind.Object &&
        feedback.TryGetProperty("blockReason", out var reason) &&
        reason.ValueKind == JsonValueKind.String
            ? reason.GetString()
            : null;

    private JsonElement FirstCandidate(JsonElement root)
    {
        if (!root.TryGetProperty("candidates", out var candidates) ||
            candidates.ValueKind != JsonValueKind.Array ||
            candidates.GetArrayLength() == 0)
        {
            throw new AiProviderException("empty-response", "Gemini returned no candidates.");
        }

        return candidates[0];
    }

    private static string? FinishReason(JsonElement candidate) =>
        candidate.TryGetProperty("finishReason", out var reason) &&
        reason.ValueKind == JsonValueKind.String
            ? reason.GetString()
            : null;

    /// <summary>Concatenates the text parts; a long answer can arrive split across several.</summary>
    private static string? ReadText(JsonElement candidate)
    {
        if (!candidate.TryGetProperty("content", out var content) ||
            content.ValueKind != JsonValueKind.Object ||
            !content.TryGetProperty("parts", out var parts) ||
            parts.ValueKind != JsonValueKind.Array)
        {
            return null;
        }

        var builder = new StringBuilder();

        foreach (var part in parts.EnumerateArray())
        {
            if (part.ValueKind == JsonValueKind.Object &&
                part.TryGetProperty("text", out var text) &&
                text.ValueKind == JsonValueKind.String)
            {
                builder.Append(text.GetString());
            }
        }

        return builder.Length == 0 ? null : builder.ToString();
    }

    private static (int? Prompt, int? Completion) ReadUsage(JsonElement root)
    {
        if (!root.TryGetProperty("usageMetadata", out var usage) ||
            usage.ValueKind != JsonValueKind.Object)
        {
            return (null, null);
        }

        return (Count(usage, "promptTokenCount"), Count(usage, "candidatesTokenCount"));

        static int? Count(JsonElement usage, string name) =>
            usage.TryGetProperty(name, out var value) &&
            value.ValueKind == JsonValueKind.Number &&
            value.TryGetInt32(out var count)
                ? count
                : null;
    }
}
