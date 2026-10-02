namespace AnimStudio.Domain.Rendering;

/// <summary>
/// One channel's look - a YouTube channel, or any brand the studio publishes under: the
/// watermark stamped on its videos and the end card they finish with. A project picks one.
/// <para>
/// The studio's original single watermark and outro are the built-in "Default" channel
/// (<see cref="DefaultId"/>), kept where they always were on the settings document, so
/// nothing stored before channels existed needs migrating.
/// </para>
/// </summary>
public sealed class BrandChannel
{
    /// <summary>The built-in channel; also what a project with no channel chosen uses.</summary>
    public const string DefaultId = "default";

    public const int MaxNameLength = 60;
    /// <summary>
    /// Ceiling, not a target. Channels live in one settings document; a thousand with a
    /// watermark and end card each is well under a megabyte of it.
    /// </summary>
    public const int MaxChannels = 1000;

    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public WatermarkSettings Watermark { get; set; } = new();
    public OutroSettings Outro { get; set; } = new();

    /// <summary>Null, blank and "default" all mean the built-in channel.</summary>
    public static bool IsDefault(string? id) =>
        string.IsNullOrWhiteSpace(id) || string.Equals(id, DefaultId, StringComparison.OrdinalIgnoreCase);
}
