using System.Globalization;
using System.Text;
using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Ai;
using AnimStudio.Application.Options;
using AnimStudio.Domain.Ai;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AnimStudio.Infrastructure.Ai.Providers;

/// <summary>
/// Images from Pollinations, which needs no account and no key at all.
/// </summary>
/// <remarks>
/// <para>
/// The only provider in the catalogue that works the moment it is switched on, which makes
/// it the one that lets someone see the AI path work before deciding whether to sign up for
/// anything. That is worth a lot for a tool meant to take less input.
/// </para>
/// <para>
/// <b>It sends the prompt in the URL.</b> That is the service's design, not a choice made
/// here, and it has two consequences worth stating plainly. The prompt is derived from the
/// user's transcript and will appear in any log or proxy along the way, so this provider is
/// a poorer fit than the others for private material. And URLs have length limits, so an
/// over-long prompt is refused here rather than being silently truncated into a different
/// picture.
/// </para>
/// </remarks>
public sealed class PollinationsImageProvider(
    AiProviderId id,
    IAiHttpClientFactory clients,
    IAiSecretResolver secrets,
    IOptionsMonitor<AiOptions> options,
    ILogger<PollinationsImageProvider> logger)
    : HttpAiProviderBase(id, AiCapability.Image, clients, secrets, options, logger), IImageAiProvider
{
    /// <summary>Long enough for any prompt this pipeline builds, short of the URL limit.</summary>
    private const int MaxPromptLength = 1200;

    private const int MaxImageBytes = 16 * 1024 * 1024;
    private const string DefaultModel = "flux";

    /// <summary>Keyless by design - there is no account to have.</summary>
    protected override bool RequiresApiKey => false;

    public async Task<AiImageResult> GenerateAsync(AiImageRequest request, CancellationToken ct)
    {
        var prompt = request.Prompt?.Trim() ?? string.Empty;

        if (prompt.Length == 0)
            throw new AiProviderException("prompt-required", "An image prompt is required.");

        if (prompt.Length > MaxPromptLength)
        {
            // Truncating would produce a different picture from the one that was asked for,
            // and would do it invisibly.
            throw new AiProviderException("prompt-too-long",
                $"'{Id.Value}' takes the prompt in the URL, so it is limited to " +
                $"{MaxPromptLength} characters.");
        }

        var query = new StringBuilder()
            .Append("?width=").Append(Dimension(request.Width))
            .Append("&height=").Append(Dimension(request.Height))
            .Append("&nologo=true")
            .Append("&model=").Append(Uri.EscapeDataString(Model?.Trim() is { Length: > 0 } m ? m : DefaultModel));

        // Sent only when the caller pinned one, because Pollinations otherwise varies the
        // image per request - which is what you want for a background and not for a
        // character who has to look the same in every scene.
        if (request.Seed is { } seed)
            query.Append("&seed=").Append(seed.ToString(CultureInfo.InvariantCulture));

        var url = $"prompt/{Uri.EscapeDataString(prompt)}{query}";

        using var httpRequest = new HttpRequestMessage(HttpMethod.Get, url);

        var bytes = await SendForBytesAsync(httpRequest, MaxImageBytes, ct).ConfigureAwait(false);

        // Sniffed rather than trusted: this endpoint answers 200 with an HTML error page
        // when it is overloaded, and those bytes would otherwise reach FFmpeg as a sprite.
        var mimeType = AiImageValidator.Require(bytes, Id.Value);

        if (request.TransparentBackground && !AiImageValidator.SupportsTransparency(mimeType))
        {
            Logger.LogInformation(
                "AI provider {ProviderId} returned {MimeType}, which has no alpha channel; " +
                "the caller asked for a transparent background.",
                Id.Value, mimeType);
        }

        return new AiImageResult(bytes, mimeType, new AiProvenance
        {
            ProviderId = Id.Value,
            Capability = AiCapability.Image,
            Model = Model ?? DefaultModel,
            PromptTemplateKey = request.PromptTemplateKey,
            PromptTemplateVersion = request.PromptTemplateVersion,
            Seed = request.Seed,
            GeneratedAtUtc = DateTime.UtcNow
        });
    }

    /// <summary>Clamped to what an image model will actually produce.</summary>
    private static string Dimension(int value) =>
        Math.Clamp(value, 64, 2048).ToString(CultureInfo.InvariantCulture);
}
