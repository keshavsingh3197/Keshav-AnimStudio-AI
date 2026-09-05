namespace AnimStudio.Domain.Rendering;

/// <summary>A half-open frame interval [Start, End).</summary>
public readonly record struct FrameRange(FrameCount Start, FrameCount End)
{
    public static FrameRange FromSeconds(double startSeconds, double endSeconds, FrameRate rate) =>
        new(FrameCount.FromSeconds(startSeconds, rate), FrameCount.FromSeconds(endSeconds, rate));

    public FrameCount Length => new(End.Value - Start.Value);

    public bool IsEmpty => End.Value <= Start.Value;

    public bool Overlaps(FrameRange other) =>
        Start.Value < other.End.Value && other.Start.Value < End.Value;

    public bool Contains(FrameCount frame) =>
        frame.Value >= Start.Value && frame.Value < End.Value;

    /// <summary>Clamps this range into <paramref name="bounds"/>; may return an empty range.</summary>
    public FrameRange Clamp(FrameRange bounds) => new(
        new FrameCount(Math.Clamp(Start.Value, bounds.Start.Value, bounds.End.Value)),
        new FrameCount(Math.Clamp(End.Value, bounds.Start.Value, bounds.End.Value)));

    public override string ToString() => $"[{Start.Value}..{End.Value})";
}
