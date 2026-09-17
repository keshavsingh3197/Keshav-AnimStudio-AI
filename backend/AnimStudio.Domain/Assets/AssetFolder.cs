using System;

namespace AnimStudio.Domain.Assets;

public sealed class AssetFolder
{
    public string Id { get; set; } = string.Empty;
    public string ProjectId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? ParentId { get; set; }
    public DateTime CreatedAt { get; set; }
}
