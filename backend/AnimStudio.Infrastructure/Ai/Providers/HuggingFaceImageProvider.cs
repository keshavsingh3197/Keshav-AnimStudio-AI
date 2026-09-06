using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Ai;
using AnimStudio.Application.Options;
using AnimStudio.Domain.Ai;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AnimStudio.Infrastructure.Ai.Providers;

/// <summary>
/// Images from the Hugging Face inference API, which puts the widest range of open models
/// behind one key.
/// </summary>
/// <remarks>
/// A free-tier model that has not been used recently is unloaded, and the first request
/// wakes it up. Left alone that arrives as a 503 which looks exactly like an outage, opens
/// the circuit after three of them, and takes the provider out of the chain for a cooldown
/// - all because the model was asleep. The <c>x-wait-for-model</c> header asks the service
/// to hold the connection until it is ready instead, which turns a spurious failure into a
/// slow success. The request timeout is what bounds the wait.
/// </remarks>
public sealed class HuggingFaceImageProvider(
    AiProviderId id,
    IAiHttpClientFactory clients,
    IAiSecretResolver secrets,
    IOptionsMonitor<AiOptions> options,
    ILogger<HuggingFaceImageProvider> logger)
    : HttpAiProviderBase(id, AiCapability.Image, clients, secrets, options, logger), IImageAiProvider
{
    private const string DefaultModel = "black-forest-labs/FLUX.1-schnell";
    private const int MaxImageBytes = 16 * 1024 * 1024;

    public async Task<AiImageResult> GenerateAsync(AiImageRequest request, CancellationToken ct)
    {
        var model = ModelPath();

        var parameters = new Dictionary<string, object?>(StringComparer.Ordinal)
        {
            ["width"] = Math.Clamp(request.Width, 256, 2048),
            ["height"] = Math.Clamp(request.Height, 256, 2048)
        };

        if (!string.IsNullOrWhiteSpace(request.NegativePrompt))
            parameters["negative_prompt"] = request.NegativePrompt;

        if (request.Seed is { } seed) parameters["seed"] = seed;

        var body = new Dictionary<string, object?>(StringComparer.Ordinal)
        {
            ["inputs"] = request.Prompt,
            ["parameters"] = parameters
        };

        using var httpRequest = JsonRequest(HttpMethod.Post, $"models/{model}", body);

        httpRequest.Headers.Add("x-wait-for-model", "true");

        var bytes = await SendForBytesAsync(httpRequest, MaxImageBytes, ct).ConfigureAwait(false);
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

    /// <summary>A repository id is <c>owner/name</c>, so slashes are expected here.</summary>
    private string ModelPath()
    {
        var configured = Model?.Trim();

        if (string.IsNullOrEmpty(configured)) return DefaultModel;

        if (!IsSafePathValue(configured, allowSlashes: true))
        {
            throw new AiProviderException("model-invalid",
                "The configured Hugging Face model id is not a valid repository name.");
        }

        return configured;
    }
}
