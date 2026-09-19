namespace AnimStudio.Domain.System;

public sealed class HubPreset
{
    public string Label { get; set; } = string.Empty;
    public int Width { get; set; }
    public int Height { get; set; }
}

public sealed class HubTemplate
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string WireframeClass { get; set; } = string.Empty;
    public List<string> Tags { get; set; } = [];
}

public sealed class HubQuickStart
{
    public string Id { get; set; } = string.Empty;
    public string Icon { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string Tooltip { get; set; } = string.Empty;
}

public sealed class HubConfig
{
    public string Id { get; set; } = "default";
    public double StorageUsedGb { get; set; }
    public double StorageTotalGb { get; set; }
    
    public List<HubPreset> Presets { get; set; } = [];
    public List<HubTemplate> Templates { get; set; } = [];
    public List<HubQuickStart> QuickStarts { get; set; } = [];
}
