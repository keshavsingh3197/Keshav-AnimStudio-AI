namespace AnimStudio.Domain.Rendering;

/// <summary>
/// A duration measured in whole frames.
/// <para>
/// Every duration in the rendering pipeline is a frame count, never a floating-point
/// number of seconds. A 3.33s scene at 30fps is 99.9 frames; if durations stayed
/// fractional, ffmpeg would round each one independently, xfade offsets would drift,
/// and by the twentieth scene the transitions and audio would land in the wrong place.
/// Seconds exist only at the API boundary and when emitting filter expressions.
/// </para>
/// </summary>
public readonly record struct FrameCount(int Value) : IComparable<FrameCount>
{
    public static readonly FrameCount Zero = new(0);

    public static FrameCount FromSeconds(double seconds, FrameRate rate)
    {
        if (double.IsNaN(seconds) || double.IsInfinity(seconds))
            throw new ArgumentOutOfRangeException(nameof(seconds), "Duration must be a real number.");
        if (seconds < 0)
            throw new ArgumentOutOfRangeException(nameof(seconds), "Duration cannot be negative.");
        return new FrameCount((int)Math.Round(seconds * rate.AsDouble, MidpointRounding.AwayFromZero));
    }

    public static FrameCount FromTimeSpan(TimeSpan span, FrameRate rate) =>
        FromSeconds(span.TotalSeconds, rate);

    public double ToSeconds(FrameRate rate) => Value * (double)rate.Den / rate.Num;

    public TimeSpan ToTimeSpan(FrameRate rate) => TimeSpan.FromSeconds(ToSeconds(rate));

    public static FrameCount operator +(FrameCount a, FrameCount b) => new(a.Value + b.Value);
    public static FrameCount operator -(FrameCount a, FrameCount b) => new(a.Value - b.Value);
    public static bool operator <(FrameCount a, FrameCount b) => a.Value < b.Value;
    public static bool operator >(FrameCount a, FrameCount b) => a.Value > b.Value;
    public static bool operator <=(FrameCount a, FrameCount b) => a.Value <= b.Value;
    public static bool operator >=(FrameCount a, FrameCount b) => a.Value >= b.Value;

    public static FrameCount Min(FrameCount a, FrameCount b) => a.Value <= b.Value ? a : b;
    public static FrameCount Max(FrameCount a, FrameCount b) => a.Value >= b.Value ? a : b;

    public int CompareTo(FrameCount other) => Value.CompareTo(other.Value);

    public override string ToString() => $"{Value}f";
}
