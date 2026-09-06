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
/// Text generation against any endpoint that speaks OpenAI's <c>/chat/completions</c>.
/// </summary>
/// <remarks>
/// <para>
/// One class covers Groq, OpenRouter, Together, Ollama and LM Studio, because they all
/// implement the same request and response shape. Which one an instance is talking to comes
/// entirely from configuration - the id, base URL, model and whether it is local - so adding
/// another compatible service is a config entry, not a class.
/// </para>
/// <para>
/// The only place they genuinely differ is JSON mode, which older self-hosted builds do not
/// implement and reject outright. That is handled by degrading rather than by asking the
/// operator to find a flag: a request refused with a 400 while JSON mode was on is retried
/// once without it, and the prompt already instructs the model to answer in JSON, so the
/// schema check on the way out is what actually guarantees the shape either way.
/// </para>
/// </remarks>
public sealed class OpenAiCompatibleTextProvider(
    AiProviderId id,
    IAiHttpClientFactory clients,
    IAiSecretResolver secrets,
    IOptionsMonitor<AiOptions> options,
    ILogger<OpenAiCompatibleTextProvider> logger)
    : HttpAiProviderBase(id, AiCapability.Text, clients, secrets, options, logger), ITextAiProvider
{
    private const string Endpoint = "chat/completions";

    public async Task<AiTextResult> CompleteAsync(AiTextRequest request, CancellationToken ct)
    {
        var wantsJson = !string.IsNullOrWhiteSpace(request.JsonSchema);
        var useJsonMode = wantsJson && ProviderOptions?.SupportsJsonMode != false;

        try
        {
            return await AttemptAsync(request, useJsonMode, ct).ConfigureAwait(false);
        }
        catch (AiProviderException ex) when (useJsonMode && ex.Code == "bad-request")
        {
            Logger.LogInformation(
                "AI provider {ProviderId} refused a JSON-mode request; retrying without it.",
                Id.Value);

            return await AttemptAsync(request, useJsonMode: false, ct).ConfigureAwait(false);
        }
    }

    private async Task<AiTextResult> AttemptAsync(
        AiTextRequest request, bool useJsonMode, CancellationToken ct)
    {
        var messages = new List<object>(2);

        if (!string.IsNullOrWhiteSpace(request.SystemPrompt))
            messages.Add(new { role = "system", content = request.SystemPrompt });

        messages.Add(new { role = "user", content = request.Prompt });

        var body = new Dictionary<string, object?>(StringComparer.Ordinal)
        {
            ["messages"] = messages,
            ["max_tokens"] = Math.Clamp(request.MaxOutputTokens, 16, 32_768),
            ["temperature"] = Math.Clamp(request.Temperature, 0d, 2d),
            ["stream"] = false
        };

        // LM Studio serves whichever model is loaded and takes the field as advisory, so an
        // unset model is legitimate rather than a misconfiguration.
        if (!string.IsNullOrWhiteSpace(Model)) body["model"] = Model;

        // Sent only when the caller pinned one: an unrequested seed would make every call
        // for the same prompt return the identical answer, including a bad one.
        if (request.Seed is { } seed) body["seed"] = seed;

        if (useJsonMode) body["response_format"] = new { type = "json_object" };

        using var response = await PostJsonAsync(Endpoint, body, ct).ConfigureAwait(false);

        var choice = FirstChoice(response.RootElement);
        var text = ReadContent(choice);

        if (string.IsNullOrWhiteSpace(text))
        {
            // A blank completion is how several services express a safety refusal. Treated
            // as a provider failure so the chain moves on instead of returning nothing.
            throw new AiProviderException("empty-response",
                $"'{Id.Value}' returned an empty completion.");
        }

        var truncated = choice.TryGetProperty("finish_reason", out var finish) &&
                        finish.ValueKind == JsonValueKind.String &&
                        string.Equals(finish.GetString(), "length", StringComparison.Ordinal);

        if (truncated && !string.IsNullOrWhiteSpace(request.JsonSchema))
        {
            // Truncated JSON cannot be repaired by guessing the closing braces.
            throw new AiProviderException("output-truncated",
                $"'{Id.Value}' hit the output limit before finishing its JSON response.");
        }

        if (truncated)
        {
            Logger.LogWarning(
                "AI provider {ProviderId} hit the {Limit}-token output limit; the text is cut short.",
                Id.Value, request.MaxOutputTokens);
        }

        var content = string.IsNullOrWhiteSpace(request.JsonSchema)
            ? text
            : AiJsonResponse.Require(text, request.JsonSchema!);

        var (promptTokens, completionTokens) = ReadUsage(response.RootElement);

        return new AiTextResult(
            content,
            new AiProvenance
            {
                ProviderId = Id.Value,
                Capability = AiCapability.Text,
                Model = Model,
                PromptTemplateKey = request.PromptTemplateKey,
                PromptTemplateVersion = request.PromptTemplateVersion,
                Seed = request.Seed,
                GeneratedAtUtc = DateTime.UtcNow
            },
            promptTokens,
            completionTokens);
    }

    private JsonElement FirstChoice(JsonElement root)
    {
        if (!root.TryGetProperty("choices", out var choices) ||
            choices.ValueKind != JsonValueKind.Array ||
            choices.GetArrayLength() == 0)
        {
            throw new AiProviderException("malformed-response",
                $"'{Id.Value}' returned no choices.");
        }

        return choices[0];
    }

    /// <summary>
    /// Reads <c>message.content</c>, which is normally a string but which some models
    /// behind OpenRouter return as an array of typed parts. Both are handled because the
    /// alternative is a provider that works for most models and mysteriously fails for a few.
    /// </summary>
    private static string? ReadContent(JsonElement choice)
    {
        if (!choice.TryGetProperty("message", out var message) ||
            message.ValueKind != JsonValueKind.Object)
        {
            return null;
        }

        if (!message.TryGetProperty("content", out var content)) return null;

        switch (content.ValueKind)
        {
            case JsonValueKind.String:
                return content.GetString();

            case JsonValueKind.Array:
                var builder = new StringBuilder();

                foreach (var part in content.EnumerateArray())
                {
                    if (part.ValueKind == JsonValueKind.String)
                    {
                        builder.Append(part.GetString());
                    }
                    else if (part.ValueKind == JsonValueKind.Object &&
                             part.TryGetProperty("text", out var partText) &&
                             partText.ValueKind == JsonValueKind.String)
                    {
                        builder.Append(partText.GetString());
                    }
                }

                return builder.Length == 0 ? null : builder.ToString();

            default:
                return null;
        }
    }

    private static (int? Prompt, int? Completion) ReadUsage(JsonElement root)
    {
        if (!root.TryGetProperty("usage", out var usage) ||
            usage.ValueKind != JsonValueKind.Object)
        {
            return (null, null);
        }

        return (Count(usage, "prompt_tokens"), Count(usage, "completion_tokens"));

        static int? Count(JsonElement usage, string name) =>
            usage.TryGetProperty(name, out var value) &&
            value.ValueKind == JsonValueKind.Number &&
            value.TryGetInt32(out var count)
                ? count
                : null;
    }
}
