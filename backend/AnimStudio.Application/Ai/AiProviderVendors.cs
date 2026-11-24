namespace AnimStudio.Application.Ai;

/// <summary>
/// Vendor group metadata that clusters related AI providers under shared API key pools
/// (for instance grouping <c>gemini-tts</c>, <c>gemini</c>, and <c>gemini-image</c> under Google).
/// </summary>
public sealed record AiVendorDescriptor(
    string Id,
    string DisplayName,
    string Description,
    string? KeyUrl,
    string? DefaultProbeUrl,
    IReadOnlyList<string> ProviderIds,
    bool ExpandedByDefault = false);

public static class AiProviderVendors
{
    public const string Google = "google";
    public const string Groq = "groq";
    public const string OpenRouter = "openrouter";
    public const string Together = "together";
    public const string Cloudflare = "cloudflare";
    public const string HuggingFace = "huggingface";
    public const string Pollinations = "pollinations";
    public const string OpenAiCompatible = "openai-compatible";

    /// <summary>Ordered vendor catalogue with Google first for AI Studio / Gemini key management.</summary>
    public static IReadOnlyList<AiVendorDescriptor> All { get; } =
    [
        new(
            Google,
            "Google (Gemini & AI Studio)",
            "Google AI Studio project keys shared across Gemini Speech (TTS), Gemini Text, and Gemini Image. Add multiple Tier 1 projects here for instant automatic failover when a project hits its daily quota.",
            "https://aistudio.google.com/apikey",
            "https://generativelanguage.googleapis.com/v1beta",
            [KnownAiProviders.GeminiTts, KnownAiProviders.Gemini, KnownAiProviders.GeminiImage],
            ExpandedByDefault: true),
        new(
            Groq,
            "Groq",
            "Ultra-fast open-weight text models and Groq Whisper transcription.",
            "https://console.groq.com/keys",
            "https://api.groq.com/openai/v1",
            [KnownAiProviders.Groq, KnownAiProviders.GroqWhisper]),
        new(
            OpenRouter,
            "OpenRouter",
            "Gateway to free and paid models with automatic credit failover.",
            "https://openrouter.ai/keys",
            "https://openrouter.ai/api/v1",
            [KnownAiProviders.OpenRouter]),
        new(
            Together,
            "Together AI",
            "Open-weight inference endpoints via Together.",
            "https://api.together.xyz/settings/api-keys",
            "https://api.together.xyz/v1",
            [KnownAiProviders.Together]),
        new(
            Cloudflare,
            "Cloudflare Workers AI",
            "Edge image generation under Workers AI.",
            "https://dash.cloudflare.com/profile/api-tokens",
            null,
            [KnownAiProviders.CloudflareWorkersAi]),
        new(
            HuggingFace,
            "Hugging Face",
            "Inference endpoints for FLUX and open image models.",
            "https://huggingface.co/settings/tokens",
            null,
            [KnownAiProviders.HuggingFace]),
        new(
            Pollinations,
            "Pollinations AI",
            "API token for higher rate limits on Pollinations image generation.",
            "https://enter.pollinations.ai",
            null,
            [KnownAiProviders.Pollinations]),
        new(
            OpenAiCompatible,
            "OpenAI-Compatible Endpoints",
            "Custom OpenAI-compatible speech and transcription endpoints.",
            null,
            null,
            [KnownAiProviders.OpenAiTts, KnownAiProviders.OpenAiAsr])
    ];

    public static AiVendorDescriptor? Find(string? vendorId) =>
        string.IsNullOrWhiteSpace(vendorId)
            ? null
            : All.FirstOrDefault(v => string.Equals(v.Id, vendorId.Trim(), StringComparison.OrdinalIgnoreCase));

    public static string VendorFor(string? providerId)
    {
        if (string.IsNullOrWhiteSpace(providerId)) return string.Empty;

        var trimmed = providerId.Trim();
        foreach (var vendor in All)
        {
            if (vendor.ProviderIds.Any(p => string.Equals(p, trimmed, StringComparison.OrdinalIgnoreCase)))
                return vendor.Id;
        }

        if (trimmed.StartsWith("gemini", StringComparison.OrdinalIgnoreCase)) return Google;
        if (trimmed.StartsWith("groq", StringComparison.OrdinalIgnoreCase)) return Groq;
        return trimmed.ToLowerInvariant();
    }

    public static IReadOnlyList<string> ProvidersForVendor(string vendor) =>
        Find(vendor)?.ProviderIds ?? [vendor.Trim().ToLowerInvariant()];

    public static string NormalizeVendor(string vendorOrProvider)
    {
        var normalized = vendorOrProvider?.Trim().ToLowerInvariant() ?? string.Empty;
        if (string.IsNullOrEmpty(normalized)) return string.Empty;
        return Find(normalized)?.Id ?? VendorFor(normalized);
    }
}
