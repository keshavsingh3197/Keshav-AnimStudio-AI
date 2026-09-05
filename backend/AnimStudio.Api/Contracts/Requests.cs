using System.ComponentModel.DataAnnotations;
using AnimStudio.Domain.Projects;

namespace AnimStudio.Api.Contracts;

public sealed record CreateProjectRequest
{
    [Required, StringLength(120, MinimumLength = 1)]
    public string Name { get; init; } = string.Empty;

    [StringLength(2000)]
    public string? Description { get; init; }

    [Range(320, 3840)] public int Width { get; init; } = 1920;
    [Range(240, 2160)] public int Height { get; init; } = 1080;
    [Range(1, 60)] public int Fps { get; init; } = 30;

    public DistributionIntent DistributionIntent { get; init; } = DistributionIntent.Personal;
}

public sealed record RightsAttestationRequest
{
    public bool IsOwnerOrLicensed { get; init; }

    /// <summary>One of RightsBasis's values; validated server-side against that closed set.</summary>
    [Required, StringLength(40)]
    public string BasisCode { get; init; } = string.Empty;

    [StringLength(1000)] public string? BasisNotes { get; init; }
    [StringLength(200)] public string? AttestedByName { get; init; }
    [StringLength(40)] public string? AcceptedTermsVersion { get; init; }
}

public sealed record CreateIngestRequest
{
    /// <summary>PastedText, SubtitleFile or YouTubeCaptions.</summary>
    [Required, StringLength(30)]
    public string Source { get; init; } = "PastedText";

    [StringLength(2048)] public string? Url { get; init; }
    [StringLength(400_000)] public string? Text { get; init; }
    [StringLength(300)] public string? SubtitleObjectKey { get; init; }
    [StringLength(64)] public string? MediaAssetId { get; init; }

    /// <summary>Honoured only if the server also allows media download.</summary>
    public bool IncludeMedia { get; init; }

    [StringLength(80)] public string? IdempotencyKey { get; init; }

    public RightsAttestationRequest? RightsAttestation { get; init; }
}

public sealed record CreateCharacterRequest
{
    [Required, StringLength(80, MinimumLength = 1)]
    public string Name { get; init; } = string.Empty;

    [StringLength(1000)] public string? Description { get; init; }
    public List<string> Aliases { get; init; } = [];

    [StringLength(64)] public string? ClosedMouthAssetId { get; init; }
    [StringLength(64)] public string? OpenMouthAssetId { get; init; }

    /// <summary>Hex colour used for this character's subtitles, e.g. "#FFE164".</summary>
    [StringLength(9)] public string? SubtitleColorHex { get; init; }
}

public sealed record AssignSceneBackgroundRequest
{
    [Required, StringLength(64)] public string AssetId { get; init; } = string.Empty;
}
