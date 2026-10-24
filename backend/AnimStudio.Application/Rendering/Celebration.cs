namespace AnimStudio.Application.Rendering;

/// <summary>What a celebration overlay rains down (or sends up) over the video.</summary>
public enum CelebrationKind { Confetti, Cannon, Flowers, Petals, Hearts, Sparkles, Snow, Balloons, Cosmic }

/// <summary>Once, like YouTube's celebration shower, or falling for as long as the item lasts.</summary>
public enum CelebrationMode { Burst, Rain }

/// <summary>The drawn shape of one particle; each is a small <c>geq</c> mask on the server and a path in the preview.</summary>
public enum ParticleShape { Ribbon, Petal, Marigold, Heart, Star, Flake, Balloon }

/// <summary>How a particle travels across the frame.</summary>
public enum ParticleMotion { Fall, Rise, Cannon, Twinkle }

/// <summary>A celebration item, checked: every value ends up inside an ffmpeg expression.</summary>
public sealed record CelebrationSettings(CelebrationKind Kind, CelebrationMode Mode, int Density, double Size, double Speed, int Seed);

/// <summary>
/// One particle. Positions are fractions of the canvas, speeds in canvas heights per second, so the
/// same plan draws at any size. <paramref name="Delay"/> is seconds after the celebration starts.
/// <paramref name="Y0"/> is the height for sparkles; for falling and rising particles in a burst,
/// how far beyond the edge they start, so the shower arrives staggered rather than in one line.
/// </summary>
public sealed record CelebrationParticle(
    ParticleShape Shape, string Rgb, int Width, int Height, ParticleMotion Motion,
    double X0, double Y0, double Delay, double Speed, double SwayAmplitude, double SwayHz, double Phase,
    double SpinDegreesPerSecond, double VelocityX, double TwinkleHz, double Drag = 0);

/// <summary>
/// Turns a celebration item into particles. Deterministic: the same item always yields the
/// same particles, and the studio preview runs the same generator (mulberry32 with the same
/// seed) so what is seen in the editor is what is exported.
/// </summary>
public static class CelebrationPlanner
{
    public const int MinDensity = 1;
    public const int MaxDensity = 100;
    public const double MinSize = 0.5;
    public const double MaxSize = 2.0;
    public const double MinSpeed = 0.5;
    public const double MaxSpeed = 2.0;

    /// <summary>Particles per celebration at full density; each is one small overlay in the graph.</summary>
    public const int MaxParticles = 48;

    /// <summary>Celebrations one export takes; past it the rest are dropped with a warning.</summary>
    public const int MaxCelebrations = 6;

    /// <summary>Seconds the whole layer takes to fade in and out.</summary>
    public const double FadeSeconds = 0.4;

    private static readonly IReadOnlyDictionary<string, CelebrationKind> Kinds =
        Enum.GetValues<CelebrationKind>().ToDictionary(k => k.ToString().ToLowerInvariant(), k => k);

    private static readonly string[] ConfettiColors = ["ff4d6d", "ffd166", "06d6a0", "4cc9f0", "9b5de5", "f15bb5", "ffffff"];
    private static readonly string[] MarigoldColors = ["ff9f1c", "ffb703", "fb8500", "ffd60a"];
    private static readonly string[] RoseColors = ["e63946", "ff4d6d", "c9184a", "ff8fab"];
    private static readonly string[] HeartColors = ["ff4d6d", "ff006e", "ff8fab", "e5383b"];
    private static readonly string[] SparkleColors = ["fff3b0", "ffd166", "ffffff", "ffe8a3"];
    private static readonly string[] BalloonColors = ["ef476f", "ffd166", "06d6a0", "118ab2", "9b5de5", "f78c6b"];
    private static readonly string[] CosmicColors = ["38bdf8", "818cf8", "c084fc", "bae6fd", "f8fafc", "facc15"];

    /// <summary>The kind a client names, or null when it isn't one of ours.</summary>
    public static CelebrationKind? ParseKind(string? value) =>
        value is not null && Kinds.TryGetValue(value.Trim().ToLowerInvariant(), out var kind) ? kind : null;

    /// <summary>A burst for the one-off showers, rain for weather.</summary>
    public static CelebrationMode DefaultMode(CelebrationKind kind) =>
        kind is CelebrationKind.Snow or CelebrationKind.Sparkles or CelebrationKind.Cosmic ? CelebrationMode.Rain : CelebrationMode.Burst;

    /// <summary>Clamps everything the client sent; an unknown kind is null and draws nothing.</summary>
    public static CelebrationSettings? Normalize(string? kind, string? mode, int? density, double? size, double? speed, string seedSource)
    {
        if (ParseKind(kind) is not { } k) return null;
        var m = mode?.Trim().ToLowerInvariant() switch
        {
            "rain" => CelebrationMode.Rain,
            "burst" => CelebrationMode.Burst,
            _ => DefaultMode(k)
        };
        return new CelebrationSettings(
            k, m,
            Math.Clamp(density ?? 50, MinDensity, MaxDensity),
            Finite(size, 1, MinSize, MaxSize),
            Finite(speed, 1, MinSpeed, MaxSpeed),
            Seed(seedSource));
    }

    /// <summary>The particles for a celebration lasting <paramref name="seconds"/> on a canvas.</summary>
    public static IReadOnlyList<CelebrationParticle> Plan(CelebrationSettings s, int canvasWidth, int canvasHeight, double seconds)
    {
        var random = new Mulberry32((uint)s.Seed);
        var count = (int)Math.Round(8 + (MaxParticles - 8) * (s.Density - 1) / (double)(MaxDensity - 1));
        var unit = Math.Min(canvasWidth, canvasHeight) / 100.0 * s.Size;
        var list = new List<CelebrationParticle>(count);

        // A burst drops everything in the first part, so the last particle still clears the frame.
        var window = s.Mode == CelebrationMode.Burst ? Math.Max(0.3, Math.Min(seconds * 0.45, 2.5)) : seconds;

        for (var i = 0; i < count; i++)
        {
            double R() => random.Next();
            double Between(double a, double b) => a + (b - a) * R();
            string Pick(string[] colors) => colors[(int)(R() * colors.Length) % colors.Length];

            var delay = Between(0, window);
            var phase = Between(0, Math.PI * 2);
            switch (s.Kind)
            {
                case CelebrationKind.Confetti:
                {
                    var w = Px(unit * Between(1.8, 2.8));
                    list.Add(new(ParticleShape.Ribbon, Pick(ConfettiColors), w, Px(w * 0.45), ParticleMotion.Fall,
                        R(), Between(0, 0.4), delay, Between(0.32, 0.55) * s.Speed, Between(0.01, 0.04), Between(0.4, 1.1), phase,
                        Between(180, 540) * Sign(R()), 0, 0));
                    break;
                }
                case CelebrationKind.Cannon:
                {
                    var w = Px(unit * Between(1.8, 2.8));
                    var left = i % 2 == 0;
                    list.Add(new(ParticleShape.Ribbon, Pick(ConfettiColors), w, Px(w * 0.45), ParticleMotion.Cannon,
                        left ? 0.04 : 0.96, 1, Between(0, Math.Min(0.6, window)), Between(0.9, 2.3) * s.Speed, Between(0.005, 0.03), Between(0.4, 1.2), phase,
                        Between(240, 720) * Sign(R()), (left ? 1 : -1) * Between(0.08, 0.85) * s.Speed, 0, Between(1.2, 3.6)));
                    break;
                }
                case CelebrationKind.Flowers:
                case CelebrationKind.Petals:
                {
                    var marigold = s.Kind == CelebrationKind.Flowers && R() < 0.55;
                    var w = Px(unit * (marigold ? Between(3.0, 4.6) : Between(2.4, 3.6)));
                    list.Add(new(marigold ? ParticleShape.Marigold : ParticleShape.Petal,
                        marigold ? Pick(MarigoldColors) : Pick(RoseColors),
                        w, marigold ? w : Px(w * 0.62), ParticleMotion.Fall,
                        R(), Between(0, 0.25), delay, Between(0.2, 0.36) * s.Speed, Between(0.02, 0.05), Between(0.25, 0.6), phase,
                        Between(40, 160) * Sign(R()), 0, 0));
                    break;
                }
                case CelebrationKind.Hearts:
                {
                    var w = Px(unit * Between(2.8, 4.6));
                    list.Add(new(ParticleShape.Heart, Pick(HeartColors), w, w, ParticleMotion.Rise,
                        Between(0.05, 0.95), Between(0, 0.4), delay, Between(0.16, 0.3) * s.Speed, Between(0.015, 0.04), Between(0.3, 0.7), phase,
                        Between(-25, 25), 0, 0));
                    break;
                }
                case CelebrationKind.Sparkles:
                {
                    var w = Px(unit * Between(2.2, 4.2));
                    list.Add(new(ParticleShape.Star, Pick(SparkleColors), w, w, ParticleMotion.Twinkle,
                        R(), Between(0.04, 0.96), delay, Between(0.01, 0.04) * s.Speed, Between(0.004, 0.012), Between(0.2, 0.5), phase,
                        Between(20, 70) * Sign(R()), 0, Between(0.6, 1.6) * s.Speed));
                    break;
                }
                case CelebrationKind.Snow:
                {
                    var w = Px(unit * Between(0.8, 2.0));
                    list.Add(new(ParticleShape.Flake, "ffffff", w, w, ParticleMotion.Fall,
                        R(), Between(0, 0.4), delay, Between(0.08, 0.18) * s.Speed, Between(0.01, 0.03), Between(0.15, 0.4), phase,
                        0, 0, 0));
                    break;
                }
                case CelebrationKind.Balloons:
                {
                    var w = Px(unit * Between(4.2, 6.0));
                    list.Add(new(ParticleShape.Balloon, Pick(BalloonColors), w, Px(w * 1.35), ParticleMotion.Rise,
                        Between(0.05, 0.95), Between(0, 0.4), delay, Between(0.14, 0.24) * s.Speed, Between(0.01, 0.025), Between(0.2, 0.45), phase,
                        Between(-12, 12), 0, 0));
                    break;
                }
                case CelebrationKind.Cosmic:
                {
                    var star = i % 2 == 0;
                    var w = Px(unit * (star ? Between(1.8, 3.6) : Between(1.2, 2.8)));
                    list.Add(new(star ? ParticleShape.Star : ParticleShape.Flake, Pick(CosmicColors), w, w, ParticleMotion.Twinkle,
                        R(), Between(0.03, 0.97), delay, Between(0.015, 0.05) * s.Speed, Between(0.006, 0.018), Between(0.18, 0.45), phase,
                        star ? Between(15, 55) * Sign(R()) : 0, 0, Between(0.45, 1.35) * s.Speed));
                    break;
                }
            }
        }

        return list;
    }

    /// <summary>
    /// A stable seed from the item's id. <see cref="string.GetHashCode()"/> changes between
    /// runs, so this is FNV-1a; the studio computes the same number.
    /// </summary>
    public static int Seed(string source)
    {
        var hash = 2166136261u;
        foreach (var c in source)
        {
            hash ^= c;
            hash *= 16777619u;
        }
        return (int)(hash & 0x7FFFFFFF);
    }

    private static int Px(double value) => Math.Max(4, (int)Math.Round(value / 2) * 2);

    private static double Sign(double r) => r < 0.5 ? -1 : 1;

    private static double Finite(double? value, double fallback, double min, double max) =>
        value is { } v && double.IsFinite(v) ? Math.Clamp(v, min, max) : fallback;

    /// <summary>mulberry32: tiny, fast, and easy to match exactly in TypeScript.</summary>
    private sealed class Mulberry32(uint seed)
    {
        private uint _state = seed;

        public double Next()
        {
            unchecked
            {
                _state += 0x6D2B79F5u;
                var t = _state;
                t = (t ^ (t >> 15)) * (t | 1u);
                t ^= t + (t ^ (t >> 7)) * (t | 61u);
                return ((t ^ (t >> 14)) >> 0) / 4294967296.0;
            }
        }
    }
}
