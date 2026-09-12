using AnimStudio.Application.Rendering.Models;
using AnimStudio.Domain.Assets;
using AnimStudio.Domain.Rendering;

namespace AnimStudio.Application.Clips;

/// <summary>
/// Where a clip stitch's fractions and probe readings become pixels and frame counts.
/// <para>
/// Pure functions on purpose. All the arithmetic that decides whether a watermark lands on
/// screen and whether a clip's length is believable lives here, so it can be asserted
/// directly instead of being inferred from a rendered video.
/// </para>
/// </summary>
public static class ClipPlanFactory
{
    /// <summary>
    /// Widest a logo may be drawn, as a fraction of canvas width. A logo file is often a
    /// wordmark several times wider than it is tall, and scaling by height alone would let
    /// one span most of the frame.
    /// </summary>
    private const double LogoMaxWidthFraction = 0.35;

    /// <summary>
    /// What to assume when a clip's duration was never probed - a stale asset, or an
    /// ffprobe that was unavailable at upload time. Used ONLY to weight the progress bar;
    /// the real length is measured after the clip is encoded, so a wrong guess here costs
    /// a progress bar that moves unevenly and nothing else.
    /// </summary>
    private static readonly TimeSpan AssumedClipLength = TimeSpan.FromSeconds(10);

    /// <summary>
    /// Turns the stored watermark settings into pixels against this canvas.
    /// <para>
    /// Returns null when there is nothing to draw, which is the normal case rather than an
    /// error - a stitch with no watermark is a perfectly good stitch.
    /// </para>
    /// </summary>
    /// <param name="fontFileAbsolutePath">
    /// The font file the text is drawn with. Null is allowed and means the mark cannot be
    /// drawn: there is no family-name fallback on purpose, because <c>drawtext</c>'s
    /// <c>font=</c> crashes ffmpeg builds whose fontconfig has no configuration file.
    /// </param>
    public static WatermarkPlan? CreateWatermark(
        WatermarkSettings settings, Canvas canvas,
        string? logoRelativePath, string? textRelativePath,
        string? fontFileAbsolutePath)
    {
        ArgumentNullException.ThrowIfNull(settings);
        ArgumentNullException.ThrowIfNull(canvas);

        if (!settings.IsEnabled) return null;

        var isLogo = settings.Kind == WatermarkKind.Logo;

        // A mark with no source to draw from is not a mark. This can happen legitimately:
        // the logo asset was deleted between queueing the job and running it.
        if (isLogo && string.IsNullOrEmpty(logoRelativePath)) return null;
        if (!isLogo && string.IsNullOrEmpty(textRelativePath)) return null;

        // Height, not width: the same fraction then reads the same on a wide canvas and on
        // a vertical one, instead of a mark that doubles in size when the video is rotated.
        var height = Math.Max(8, (int)Math.Round(canvas.Height * settings.HeightFraction));
        var rawMargin = Math.Max(0, (int)Math.Round(canvas.Height * settings.MarginFraction));

        // For vertical videos (Shorts/TikTok/Reels), apply mobile safe-area padding so the
        // watermark/logo is never clipped by rounded display edges or hidden under platform overlay UI.
        var isVertical = canvas.Height > canvas.Width;
        var minSafeMargin = isVertical
            ? Math.Max(32, (int)Math.Round(canvas.Width * 0.05))
            : 0;
        var margin = Math.Max(rawMargin, minSafeMargin);

        // Even, because the logo is scaled with force_original_aspect_ratio and an odd
        // target is where scale quietly rounds in a direction nobody predicted.
        var maxWidth = Math.Max(2,
            (int)Math.Round(canvas.Width * LogoMaxWidthFraction) & ~1);

        return new WatermarkPlan
        {
            Kind = settings.Kind,
            Position = settings.Position,
            TextRelativePath = isLogo ? null : textRelativePath,
            LogoRelativePath = isLogo ? logoRelativePath : null,
            HeightPixels = height,
            MarginPixels = margin,
            MaxWidthPixels = maxWidth,
            Opacity = settings.Opacity,
            ColorRgb = ParseRgb(settings.ColorHex),
            BackplateOpacity = settings.BackplateOpacity,
            FontFilePath = isLogo ? null : fontFileAbsolutePath
        };
    }

    /// <summary>
    /// The length to assume for a clip while its real length is unknown.
    /// <para>
    /// Weights the progress bar so a two-minute clip advances it sixty times as far as a
    /// two-second one. A missing or absurd probe reading falls back to a fixed guess rather
    /// than to zero, because a zero-weight clip makes the bar jump.
    /// </para>
    /// </summary>
    public static FrameCount EstimateLength(MediaProbe probe, FrameRate rate)
    {
        ArgumentNullException.ThrowIfNull(probe);

        var seconds = probe.DurationSeconds;

        var usable = seconds is > 0 and < 24 * 60 * 60
            ? seconds.Value
            : AssumedClipLength.TotalSeconds;

        return FrameCount.Max(FrameCount.FromSeconds(usable, rate), new FrameCount(1));
    }

    /// <summary>
    /// Fits the requested transition to the clips it actually has to join.
    /// <para>
    /// A crossfade consumes its whole duration from the END of one clip and the START of
    /// the next, so a transition longer than half of either neighbour leaves xfade short of
    /// frames - which ffmpeg reports as a freeze rather than an error. Clip lengths are only
    /// known after they have been encoded, so this clamp cannot happen when the job is
    /// queued; it happens here, per join, with the measured numbers.
    /// </para>
    /// </summary>
    public static IReadOnlyList<FrameCount> ClampTransitions(
        IReadOnlyList<FrameCount> lengths, FrameCount requested)
    {
        ArgumentNullException.ThrowIfNull(lengths);

        if (lengths.Count < 2) return [];

        var clamped = new List<FrameCount>(lengths.Count - 1);

        for (var k = 0; k < lengths.Count - 1; k++)
        {
            var budget = Math.Min(lengths[k].Value, lengths[k + 1].Value) / 2;
            clamped.Add(new FrameCount(Math.Clamp(requested.Value, 0, Math.Max(budget, 0))));
        }

        return clamped;
    }

    /// <summary>
    /// Same clamp, but with its own requested duration per junction rather than one value
    /// applied to all of them - what a timeline whose transitions were customised one gap
    /// at a time needs. <paramref name="requestedPerJunction"/> must have one entry per
    /// gap, i.e. <c>lengths.Count - 1</c>.
    /// </summary>
    public static IReadOnlyList<FrameCount> ClampTransitions(
        IReadOnlyList<FrameCount> lengths, IReadOnlyList<FrameCount> requestedPerJunction)
    {
        ArgumentNullException.ThrowIfNull(lengths);
        ArgumentNullException.ThrowIfNull(requestedPerJunction);

        if (lengths.Count < 2) return [];

        if (requestedPerJunction.Count != lengths.Count - 1)
        {
            throw new ArgumentException(
                "One requested transition is needed per gap between clips.",
                nameof(requestedPerJunction));
        }

        var clamped = new List<FrameCount>(lengths.Count - 1);

        for (var k = 0; k < lengths.Count - 1; k++)
        {
            var budget = Math.Min(lengths[k].Value, lengths[k + 1].Value) / 2;
            clamped.Add(new FrameCount(
                Math.Clamp(requestedPerJunction[k].Value, 0, Math.Max(budget, 0))));
        }

        return clamped;
    }

    /// <summary>
    /// Reads "#RRGGBB" (or "RRGGBB") into the bare hex ffmpeg wants. Anything else becomes
    /// white: a watermark drawn in the wrong colour is a cosmetic problem, and failing a
    /// finished render over it would not be.
    /// </summary>
    public static string ParseRgb(string? hex)
    {
        const string fallback = "FFFFFF";

        if (string.IsNullOrWhiteSpace(hex)) return fallback;

        var text = hex.Trim().TrimStart('#');
        if (text.Length != 6) return fallback;

        foreach (var ch in text)
        {
            if (!Uri.IsHexDigit(ch)) return fallback;
        }

        return text.ToUpperInvariant();
    }

    /// <summary>
    /// Sanitises the watermark line.
    /// <para>
    /// Reduced to a single line of printable characters. Newlines and control characters are
    /// removed rather than escaped because this string is written to a file that ffmpeg's
    /// drawtext reads verbatim: a newline in it would silently turn a one-line site address
    /// into a two-line block that covers part of the frame.
    /// </para>
    /// </summary>
    public static string SanitizeText(string text, int maxLength = 120)
    {
        ArgumentNullException.ThrowIfNull(text);

        var builder = new System.Text.StringBuilder(text.Length);

        foreach (var ch in text)
        {
            if (char.IsControl(ch)) continue;

            // Bidi controls (U+202A-U+202E, U+2066-U+2069) can make a mark read as
            // something other than what is stored, which is exactly the wrong property for
            // an attribution.
            if (ch is >= (char)0x202A and <= (char)0x202E) continue;
            if (ch is >= (char)0x2066 and <= (char)0x2069) continue;

            builder.Append(ch);
        }

        var cleaned = builder.ToString().Trim();
        return cleaned.Length <= maxLength ? cleaned : cleaned[..maxLength];
    }
}
