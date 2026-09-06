namespace AnimStudio.Domain.Ai;

/// <summary>
/// How a generated artefact came to exist. Stamped onto every asset an AI provider
/// produces.
/// <para>
/// This is what makes the originality report (P10) answerable and what makes a
/// regeneration reproducible: the seed and the prompt hash together are enough to know
/// whether two images should look the same. It stores the prompt's HASH, never the prompt
/// itself, because a prompt can contain the user's transcript.
/// </para>
/// </summary>
public sealed class AiProvenance
{
    public string ProviderId { get; set; } = string.Empty;
    public AiCapability Capability { get; set; }
    public string? Model { get; set; }

    public string? PromptTemplateKey { get; set; }
    public int PromptTemplateVersion { get; set; }

    /// <summary>SHA-256 of the rendered prompt. Never the prompt text.</summary>
    public string? PromptHash { get; set; }
    public string? ParametersHash { get; set; }

    /// <summary>Fixed per character/scene so a regeneration produces the same subject.</summary>
    public long? Seed { get; set; }

    /// <summary>True when this artefact was served from the result cache rather than generated.</summary>
    public bool FromCache { get; set; }

    public DateTime GeneratedAtUtc { get; set; }
}
