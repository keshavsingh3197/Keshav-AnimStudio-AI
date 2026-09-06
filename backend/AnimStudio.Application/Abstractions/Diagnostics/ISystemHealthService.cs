namespace AnimStudio.Application.Abstractions.Diagnostics;

public enum HealthState
{
    /// <summary>Present and working.</summary>
    Ok = 0,

    /// <summary>Working, with something worth knowing about.</summary>
    Degraded = 1,

    /// <summary>Not installed or not configured. Normal for an optional tool.</summary>
    Missing = 2,

    /// <summary>Configured, and the check failed.</summary>
    Failed = 3
}

/// <summary>
/// One thing the server depends on, and whether it is there.
/// </summary>
/// <param name="Detail">
/// A version string or a short reason. Deliberately never a filesystem path: the screen
/// answers "is the tool there, and which version", and echoing back where the server keeps
/// its files describes the machine rather than the problem.
/// </param>
/// <param name="Advice">What to do about it, when there is something to do.</param>
/// <param name="Required">
/// False for everything optional. Most of this list is optional on purpose - a bundle plus
/// ffmpeg is already a complete production.
/// </param>
public sealed record HealthProbe(
    string Key,
    string DisplayName,
    HealthState State,
    string? Detail = null,
    string? Advice = null,
    bool Required = false);

public sealed record SystemHealthReport(DateTime CheckedAtUtc, IReadOnlyList<HealthProbe> Probes)
{
    /// <summary>True when nothing required is missing or broken.</summary>
    public bool Healthy => Probes.All(p =>
        !p.Required || p.State is HealthState.Ok or HealthState.Degraded);
}

/// <summary>
/// Probes the external tools and services this server needs, so an operator can see what
/// is installed instead of discovering it from a render that fails twenty minutes in.
/// </summary>
public interface ISystemHealthService
{
    Task<SystemHealthReport> CheckAsync(CancellationToken ct);
}
