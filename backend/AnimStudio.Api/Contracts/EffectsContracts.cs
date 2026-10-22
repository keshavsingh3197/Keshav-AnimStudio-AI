using System.ComponentModel.DataAnnotations;
using AnimStudio.Application.Effects;
using AnimStudio.Domain.Effects;

namespace AnimStudio.Api.Contracts;

/// <summary>One file in the caller's effects library.</summary>
/// <param name="Kind">Image, Video or Audio.</param>
/// <param name="HasThumbnail">A video has a still to show on its card; stills are their own.</param>
public sealed record EffectClipResponse(
    string Id,
    string Name,
    string Category,
    string Kind,
    IReadOnlyList<string> Tags,
    double? DurationSeconds,
    int? Width,
    int? Height,
    bool HasAlpha,
    bool IsGreenScreen,
    bool Favorite,
    int UseCount,
    long SizeBytes,
    string ContentType,
    bool HasThumbnail,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    DateTime? LastUsedAt);

/// <summary>A partial edit; a null field is left as it is.</summary>
public sealed record EffectUpdateRequest
{
    [MaxLength(EffectRules.MaxNameLength * 2)] public string? Name { get; init; }
    [MaxLength(32)] public string? Category { get; init; }
    [MaxLength(EffectRules.MaxTags * 2)] public List<string>? Tags { get; init; }
    public bool? IsGreenScreen { get; init; }
    public bool? Favorite { get; init; }

    public EffectUpdateCommand ToCommand() => new(Name, Category, Tags, IsGreenScreen, Favorite);
}

public sealed record EffectUseRequest
{
    [Required, MaxLength(128)] public string ProjectId { get; init; } = string.Empty;
}

/// <summary>The project asset the effect became; <paramref name="Reused"/> when the project already had it.</summary>
public sealed record EffectUseResponse(AssetResponse Asset, EffectClipResponse Effect, bool Reused);

public sealed record EffectFromAssetRequest
{
    [Required, MaxLength(128)] public string ProjectId { get; init; } = string.Empty;
    [Required, MaxLength(128)] public string AssetId { get; init; } = string.Empty;
    [MaxLength(32)] public string? Category { get; init; }
}

public static class EffectMappings
{
    public static EffectClipResponse ToResponse(this EffectClip e) => new(
        e.Id, e.Name, e.Category.ToString(), e.Kind.ToString(), e.Tags,
        e.Probe.DurationSeconds, e.Probe.Width, e.Probe.Height, e.Probe.HasAlpha,
        e.IsGreenScreen, e.Favorite, e.UseCount, e.SizeBytes, e.ContentType,
        e.ThumbnailKey is not null || e.Kind == AnimStudio.Domain.Assets.AssetKind.Image,
        e.CreatedAt, e.UpdatedAt, e.LastUsedAt);
}
