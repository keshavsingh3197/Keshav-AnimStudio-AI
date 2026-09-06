using AnimStudio.Domain.Ai;

namespace AnimStudio.Application.Options;

public sealed class AiProviderOptions
{
    /// <summary>An operator kill switch that does not require deleting the configuration.</summary>
    public bool Enabled { get; set; } = true;

    public string? BaseUrl { get; set; }
    public string? Model { get; set; }

    /// <summary>
    /// Which wire format this endpoint speaks, e.g. <c>OpenAiCompatibleText</c>. Only needed
    /// for a provider that is not in <c>KnownAiProviders</c> - naming a family is what lets
    /// an operator point at a compatible service this build has never heard of without
    /// anyone writing a class for it.
    /// </summary>
    public string? Family { get; set; }

    /// <summary>For providers invoked as a process (Piper, whisper.cpp) rather than over HTTP.</summary>
    public string? ExecutablePath { get; set; }

    /// <summary>
    /// The directory holding a local synthesizer's voice models - Piper's <c>.onnx</c>
    /// files. A voice id names a file inside it and may never escape it.
    /// </summary>
    public string? VoicesPath { get; set; }

    /// <summary>
    /// The directory holding a local recognizer's model files - whisper.cpp's ggml
    /// <c>.bin</c> weights. <c>Model</c> names a file inside it and may never escape it.
    /// </summary>
    public string? ModelsPath { get; set; }

    /// <summary>
    /// A ComfyUI workflow exported in API format, overriding the built-in one. The file's
    /// <c>{{prompt}}</c>, <c>{{negativePrompt}}</c>, <c>{{width}}</c>, <c>{{height}}</c>,
    /// <c>{{seed}}</c> and <c>{{checkpoint}}</c> placeholders are filled in per request.
    /// </summary>
    public string? WorkflowPath { get; set; }

    /// <summary>
    /// Marks a provider as running on this machine. Only a local provider may point at a
    /// loopback or private address - see the SSRF guard in the HTTP layer.
    /// </summary>
    public bool IsLocal { get; set; }

    public int? DailyRequestLimit { get; set; }
    public int? MonthlyRequestLimit { get; set; }

    /// <summary>Licence class stamped on assets this provider generates. See <c>LicenseClass</c>.</summary>
    public string LicenseClass { get; set; } = "Unknown";

    public int TimeoutSeconds { get; set; } = 120;

    /// <summary>
    /// Whether the endpoint accepts a request for JSON-only output. True for the hosted
    /// services; a self-hosted build may be older than the feature, and a provider that
    /// rejects the parameter outright would fail every structured call. When a request that
    /// asked for JSON mode is refused, the provider retries once without it rather than
    /// making an operator work out which flag to turn off.
    /// </summary>
    public bool SupportsJsonMode { get; set; } = true;
}

public sealed class AiCacheOptions
{
    public bool Enabled { get; set; } = true;
    public int RetentionDays { get; set; } = 90;
}

public sealed class AiCircuitOptions
{
    /// <summary>Consecutive failures before a provider is skipped.</summary>
    public int FailureThreshold { get; set; } = 3;
    public int CooldownSeconds { get; set; } = 120;
}

/// <summary>
/// The whole AI configuration. Every part of it is optional: with no <c>Ai</c> section at
/// all, every chain is empty, every capability reports <c>NotConfigured</c>, and the
/// application behaves exactly as it did before AI existed. That is a requirement, not a
/// convenience - see section 2 of the blueprint.
/// </summary>
public sealed class AiOptions
{
    public const string Section = "Ai";

    /// <summary>Capability name to an ordered list of provider ids, best first.</summary>
    public Dictionary<string, List<string>> Chains { get; set; } = new(StringComparer.OrdinalIgnoreCase);

    public Dictionary<string, AiProviderOptions> Providers { get; set; } =
        new(StringComparer.OrdinalIgnoreCase);

    /// <summary>
    /// Hosts an outbound AI call may reach. Enforced because base URLs are operator input
    /// from the admin UI, which would otherwise make the server a request proxy.
    /// </summary>
    public List<string> HostAllowlist { get; set; } = [];

    public AiCacheOptions Cache { get; set; } = new();
    public AiCircuitOptions Circuit { get; set; } = new();

    public IReadOnlyList<string> ChainFor(AiCapability capability) =>
        Chains.TryGetValue(capability.ToString(), out var chain) ? chain : [];

    public AiProviderOptions? ProviderFor(AiProviderId id) =>
        !id.IsEmpty && Providers.TryGetValue(id.Value, out var options) ? options : null;
}
