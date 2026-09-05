using AnimStudio.Domain.Rendering;

namespace AnimStudio.Application.Rendering.Models;

/// <summary>Pre-input arguments plus the input file, in ffmpeg's input order.</summary>
public sealed record FfmpegInputSpec(IReadOnlyList<string> PreInputArguments, string RelativePath)
{
    /// <summary>A generated silent source, which has no file on disk.</summary>
    public bool IsLavfi { get; init; }
}

/// <summary>
/// A complete, ready-to-run ffmpeg invocation described as data. Produced by a pure
/// function, so the whole compositing surface can be asserted as a golden string with no
/// renderer installed.
/// </summary>
public sealed record FilterGraphPlan
{
    public required IReadOnlyList<FfmpegInputSpec> Inputs { get; init; }

    /// <summary>Written verbatim to a script file rather than the command line.</summary>
    public required string FilterComplex { get; init; }

    public required IReadOnlyList<string> OutputArguments { get; init; }
    public required string OutputRelativePath { get; init; }
    public required FrameCount ExpectedFrames { get; init; }

    /// <summary>Degradations that must not fail the render, e.g. subtitles unavailable.</summary>
    public IReadOnlyList<string> Warnings { get; init; } = [];

    /// <summary>True when the merge is a stream copy and needs no filtergraph at all.</summary>
    public bool IsStreamCopy { get; init; }
}
