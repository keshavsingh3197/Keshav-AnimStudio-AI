using System.Text.Json;
using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Ai;
using AnimStudio.Application.Options;
using AnimStudio.Domain.Ai;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AnimStudio.Infrastructure.Ai.Providers;

/// <summary>
/// Images from Cloudflare Workers AI.
/// </summary>
/// <remarks>
/// <para>
/// The account id is part of the configured base URL
/// (<c>https://api.cloudflare.com/client/v4/accounts/{account}/ai/run/</c>) rather than a
/// separate option. That keeps the whole address under the endpoint guard's allowlist check
/// - an account id in its own field would be interpolated into a URL after that check had
/// already passed judgement on a different string.
/// </para>
/// <para>
/// Two quirks of this API are handled here rather than left to surface as failures. The
/// response is <b>sometimes raw image bytes and sometimes base64 inside JSON</b>, depending
/// on the model; both are accepted. And the Flux models reject the size and negative-prompt
/// parameters that every other model on the platform requires, so those are omitted for
/// Flux - otherwise the platform's own recommended default model would 400 on every call.
/// </para>
/// </remarks>
public sealed class CloudflareWorkersAiImageProvider(
    AiProviderId id,
    IAiHttpClientFactory clients,
    IAiSecretResolver secrets,
    IOptionsMonitor<AiOptions> options,
    ILogger<CloudflareWorkersAiImageProvider> logger)
    : HttpAiProviderBase(id, AiCapability.Image, clients, secrets, options, logger), IImageAiProvider
{
    private const string DefaultModel = "@cf/black-forest-labs/flux-1-schnell";
    private const int MaxImageBytes = 16 * 1024 * 1024;

    public async Task<AiImageResult> GenerateAsync(AiImageRequest request, CancellationToken ct)
    {
        var model = ModelPath();
        var isFlux = model.Contains("flux", StringComparison.OrdinalIgnoreCase);

        var body = new Dictionary<string, object?>(StringComparer.Ordinal)
        {
            ["prompt"] = request.Prompt
        };

        if (!isFlux)
        {
            body["width"] = Math.Clamp(request.Width, 256, 2048);
            body["height"] = Math.Clamp(request.Height, 256, 2048);

            if (!string.IsNullOrWhiteSpace(request.NegativePrompt))
                body["negative_prompt"] = request.NegativePrompt;
        }

        if (request.Seed is { } seed) body["seed"] = seed;

        using var httpRequest = JsonRequest(HttpMethod.Post, model, body);

        var payload = await SendForBytesAsync(httpRequest, MaxImageBytes, ct).ConfigureAwait(false);
        var bytes = Decode(payload);
        var mimeType = AiImageValidator.Require(bytes, Id.Value);

        return new AiImageResult(bytes, mimeType, new AiProvenance
        {
            ProviderId = Id.Value,
            Capability = AiCapability.Image,
            Model = model,
            PromptTemplateKey = request.PromptTemplateKey,
            PromptTemplateVersion = request.PromptTemplateVersion,
            Seed = request.Seed,
            GeneratedAtUtc = DateTime.UtcNow
        });
    }

    /// <summary>
    /// Returns the image bytes whichever way the model chose to answer: raw, or base64 in a
    /// <c>result.image</c> field.
    /// </summary>
    private byte[] Decode(byte[] payload)
    {
        // Raw bytes are the common case and are recognised without parsing anything.
        if (AiImageValidator.Sniff(payload) is not null) return payload;

        try
        {
            using var document = JsonDocument.Parse(payload);
            var root = document.RootElement;

            if (root.ValueKind != JsonValueKind.Object)
                throw new AiProviderException("malformed-response", $"'{Id.Value}' returned neither an image nor a result object.");

            // A 200 carrying success:false is how this API reports a model-level refusal.
            if (root.TryGetProperty("success", out var success) &&
                success.ValueKind == JsonValueKind.False)
            {
                throw new AiProviderException("provider-refused",
                    $"'{Id.Value}' reported the request as unsuccessful.");
            }

            if (!root.TryGetProperty("result", out var result) ||
                result.ValueKind != JsonValueKind.Object ||
                !result.TryGetProperty("image", out var image) ||
                image.ValueKind != JsonValueKind.String)
            {
                throw new AiProviderException("malformed-response",
                    $"'{Id.Value}' returned a result with no image in it.");
            }

            try
            {
                return Convert.FromBase64String(image.GetString()!);
            }
            catch (FormatException ex)
            {
                throw new AiProviderException("malformed-response",
                    $"'{Id.Value}' returned an image field that is not base64.", ex);
            }
        }
        catch (JsonException ex)
        {
            // Not an image and not JSON either - most often an HTML error page.
            throw new AiProviderException("not-an-image",
                $"'{Id.Value}' returned {payload.Length} bytes that are neither an image nor JSON.", ex);
        }
    }

    /// <summary>
    /// The model is a path segment, so it is validated. Slashes are allowed because a
    /// Workers AI model identifier genuinely contains them; a dot segment is not.
    /// </summary>
    private string ModelPath()
    {
        var configured = Model?.Trim();

        if (string.IsNullOrEmpty(configured)) return DefaultModel;

        if (!IsSafePathValue(configured, allowSlashes: true))
        {
            throw new AiProviderException("model-invalid",
                "The configured Workers AI model name is not a valid model identifier.");
        }

        return configured;
    }
}
