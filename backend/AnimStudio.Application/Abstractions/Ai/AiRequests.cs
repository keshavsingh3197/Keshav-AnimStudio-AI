using AnimStudio.Domain.Ai;

namespace AnimStudio.Application.Abstractions.Ai;

/// <summary>
/// Who and what a call is for. Carried separately from the request so that quota
/// accounting, usage records and cache scoping do not have to be threaded through every
/// provider implementation.
/// </summary>
public sealed record AiCallContext(string? ProjectId = null, string? UserId = null)
{
    public static readonly AiCallContext None = new();
}

public sealed record AiTextRequest
{
    public required string Prompt { get; init; }
    public string? SystemPrompt { get; init; }

    /// <summary>When set, the response must parse against this JSON Schema or the call fails.</summary>
    public string? JsonSchema { get; init; }

    public string? PromptTemplateKey { get; init; }
    public int PromptTemplateVersion { get; init; }

    public int MaxOutputTokens { get; init; } = 1024;
    public double Temperature { get; init; } = 0.2;
    public long? Seed { get; init; }

    /// <summary>Set for "regenerate this one" - skips the result cache for this call only.</summary>
    public bool BypassCache { get; init; }
}

public sealed record AiTextResult(
    string Text,
    AiProvenance Provenance,
    int? PromptTokens = null,
    int? CompletionTokens = null);

public sealed record AiImageRequest
{
    public required string Prompt { get; init; }
    public string? NegativePrompt { get; init; }

    public int Width { get; init; } = 1024;
    public int Height { get; init; } = 1024;

    /// <summary>Fixed per subject so a character keeps its face across poses and re-runs.</summary>
    public long? Seed { get; init; }

    public string? PromptTemplateKey { get; init; }
    public int PromptTemplateVersion { get; init; }
    public bool TransparentBackground { get; init; }
    public bool BypassCache { get; init; }
}

public sealed record AiImageResult(byte[] Content, string MimeType, AiProvenance Provenance);

public sealed record AiSpeechRequest
{
    public required string Text { get; init; }
    public required string VoiceId { get; init; }
    public double Rate { get; init; } = 1.0;
    public double Pitch { get; init; }
    public string? LanguageCode { get; init; }
    public bool BypassCache { get; init; }

    /// <summary>
    /// The one engine to speak with, instead of walking the chain. No fallback: voice ids
    /// belong to one engine, so another would only fail on the same voice.
    /// </summary>
    public string? ProviderId { get; init; }

    /// <summary>A model the caller checked against the engine's offered models; null for the configured one.</summary>
    public string? Model { get; init; }
}

public sealed record AiSpeechResult(
    byte[] Content, string MimeType, double? DurationSeconds, AiProvenance Provenance);

public sealed record AiTranscriptionRequest
{
    /// <summary>Local path to the audio file. Server-composed; never client input.</summary>
    public required string AudioPath { get; init; }
    public string? LanguageHint { get; init; }

    /// <summary>Word timings drive mouth flap and karaoke captions when the provider offers them.</summary>
    public bool RequestWordTimings { get; init; }

    /// <summary>
    /// A stable digest of the audio - normally the asset's content hash - supplied by the
    /// caller so the result can be cached. Null means "do not cache": the executor will not
    /// read the file to hash it itself, because the Application layer has no business
    /// touching a disk, and re-transcribing is merely slow rather than wrong.
    /// </summary>
    public string? CacheFingerprint { get; init; }
}

/// <summary>
/// Deliberately returns subtitle TEXT rather than a parsed model: it feeds the existing
/// <c>SubtitleParser</c>, so an ASR transcript travels the exact same code path as an
/// uploaded .srt and inherits every normalisation, dedup and speaker rule already tested.
/// </summary>
public sealed record AiTranscriptionResult(
    string SubtitleText,
    string Format,
    AiProvenance Provenance,
    string? Language = null,
    double? Confidence = null);
