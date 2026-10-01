namespace AnimStudio.Domain.Rendering;

/// <summary>
/// How hard an export works for picture quality, chosen per export.
/// <para>
/// <see cref="High"/> is deliberately the zero value, so a job written before this setting
/// existed - or a request that leaves it out - gets the high-quality encode rather than
/// the fast one.
/// </para>
/// </summary>
public enum ExportQuality
{
    /// <summary>The default: visibly as good as Best for most footage, at a fraction of its time.</summary>
    High = 0,

    /// <summary>Quickest and smallest; for drafts and previews.</summary>
    Fast = 1,

    /// <summary>Near-transparent master quality; several times slower than High.</summary>
    Best = 2
}
