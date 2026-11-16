using System.Text.Json;
using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Ai;
using AnimStudio.Application.Options;
using AnimStudio.Domain.Ai;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AnimStudio.Infrastructure.Ai.Providers;

/// <summary>
/// Google Gemini image generation (<c>gemini-2.5-flash-image</c> / Nano Banana) over the
/// native <c>generateContent</c> endpoint. Reuses the configured Google AI Studio key from
/// <c>gemini-image</c>, or falls back to <c>gemini-tts</c> / <c>gemini</c> when enabled.
/// </summary>
public sealed class GeminiImageProvider(
    AiProviderId id,
    IAiHttpClientFactory clients,
    IAiSecretResolver secrets,
    IOptionsMonitor<AiOptions> options,
    ILogger<GeminiImageProvider> logger)
    : HttpAiProviderBase(id, AiCapability.Image, clients, secrets, options, logger), IImageAiProvider
{
    internal const string DefaultModel = "gemini-2.5-flash-image";
    private const int MaxPromptLength = 4000;
    private const int MaxImageBytes = 15 * 1024 * 1024;

    private readonly IAiSecretResolver _secrets = secrets;

    public override bool IsConfigured
    {
        get
        {
            var opts = ProviderOptions;
            if (opts is null || !opts.Enabled || string.IsNullOrWhiteSpace(opts.BaseUrl))
                return false;

            return _secrets.IsInstalled(Id)
                || IsInstalled(KnownAiProviders.GeminiTts)
                || IsInstalled(KnownAiProviders.Gemini);
        }
    }

    protected override void ApplyAuthentication(HttpRequestMessage request, string secret) =>
        request.Headers.Add("x-goog-api-key", secret);

    protected override async Task<string?> GetSecretAsync(CancellationToken ct)
    {
        if (await base.GetSecretAsync(ct).ConfigureAwait(false) is { Length: > 0 } own)
            return own;

        if (AiProviderId.TryParse(KnownAiProviders.GeminiTts, out var ttsId) &&
            await _secrets.GetSecretAsync(ttsId, ct).ConfigureAwait(false) is { Length: > 0 } ttsKey)
            return ttsKey;

        if (AiProviderId.TryParse(KnownAiProviders.Gemini, out var textId) &&
            await _secrets.GetSecretAsync(textId, ct).ConfigureAwait(false) is { Length: > 0 } textKey)
            return textKey;

        return null;
    }

    public async Task<AiImageResult> GenerateAsync(AiImageRequest request, CancellationToken ct)
    {
        var model = string.IsNullOrWhiteSpace(Model) ? DefaultModel : Model.Trim();
        return await GenerateWithGeminiAsync(
            Id,
            request,
            model,
            (route, body, token) => PostJsonAsync(route, body, token),
            ct).ConfigureAwait(false);
    }

    internal static async Task<AiImageResult> GenerateWithGeminiAsync(
        AiProviderId providerId,
        AiImageRequest request,
        string model,
        Func<string, object, CancellationToken, Task<JsonDocument>> postJson,
        CancellationToken ct)
    {
        var prompt = request.Prompt?.Trim() ?? string.Empty;
        if (prompt.Length == 0)
            throw new AiProviderException("prompt-required", "An image prompt is required.");
        if (prompt.Length > MaxPromptLength)
            prompt = prompt[..MaxPromptLength].TrimEnd();

        if (!IsSafePathValue(model, allowSlashes: false, maxLength: 64))
            throw new AiProviderException("bad-request", "That model name can't be used.");

        var aspectRatio = ResolveAspectRatio(request.Width, request.Height);
        var aspectHint = aspectRatio switch
        {
            "9:16" => "Vertical 9:16 portrait composition.",
            "16:9" => "Widescreen 16:9 horizontal cinematic composition.",
            _ => "Square 1:1 composition."
        };
        var fullPrompt = $"{aspectHint} {prompt}";

        JsonDocument response;
        try
        {
            var bodyWithConfig = new
            {
                contents = new[] { new { parts = new object[] { new { text = fullPrompt } } } },
                generationConfig = new
                {
                    responseModalities = new[] { "IMAGE" },
                    imageConfig = new { aspectRatio }
                }
            };
            response = await postJson($"models/{model}:generateContent", bodyWithConfig, ct).ConfigureAwait(false);
        }
        catch (AiProviderException ex) when (ex.Code == "bad-request")
        {
            // Older/variant Gemini image deployments accept responseModalities without nested imageConfig.
            var fallbackBody = new
            {
                contents = new[] { new { parts = new object[] { new { text = fullPrompt } } } },
                generationConfig = new { responseModalities = new[] { "IMAGE" } }
            };
            response = await postJson($"models/{model}:generateContent", fallbackBody, ct).ConfigureAwait(false);
        }

        using var _ = response;
        var inline = GeminiSpeechProvider.ReadInlineImageData(response.RootElement)
            ?? throw new AiProviderException("empty-response", $"'{providerId.Value}' did not send a picture back.");

        if (inline.Data.Length / 4L * 3 > MaxImageBytes)
            throw new AiProviderException("response-too-large", $"'{providerId.Value}' sent back a picture larger than allowed.");

        byte[] bytes;
        try
        {
            bytes = Convert.FromBase64String(inline.Data);
        }
        catch (FormatException)
        {
            throw new AiProviderException("invalid-response", $"'{providerId.Value}' sent back a picture that could not be read.");
        }

        var mimeType = AiImageValidator.Sniff(bytes)
            ?? throw new AiProviderException("invalid-response", $"'{providerId.Value}' sent back something that is not a PNG, JPEG or WebP.");

        return new AiImageResult(bytes, mimeType, new AiProvenance
        {
            ProviderId = providerId.Value,
            Capability = AiCapability.Image,
            Model = model,
            PromptTemplateKey = request.PromptTemplateKey,
            PromptTemplateVersion = request.PromptTemplateVersion,
            Seed = request.Seed,
            GeneratedAtUtc = DateTime.UtcNow
        });
    }

    private bool IsInstalled(string rawId) =>
        AiProviderId.TryParse(rawId, out var parsed) && _secrets.IsInstalled(parsed);

    private static string ResolveAspectRatio(int width, int height)
    {
        if (width <= 0 || height <= 0) return "16:9";
        if (height > width * 1.15) return "9:16";
        if (width > height * 1.15) return "16:9";
        return "1:1";
    }
}
