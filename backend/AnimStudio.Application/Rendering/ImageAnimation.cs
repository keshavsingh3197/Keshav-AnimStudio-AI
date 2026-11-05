using System.Text.Json;
using System.Text.RegularExpressions;
using AnimStudio.Application.Ai;
using AnimStudio.Domain.Rendering;

namespace AnimStudio.Application.Rendering;

/// <summary>
/// One still turned into a short clip on its own - the Animate Image page - with the same camera moves, grades and
/// lens finish an image clip gets in the editor.
/// </summary>
/// <param name="Format">The shape asked for: <c>landscape</c>, <c>vertical</c> or <c>square</c>.</param>
public sealed record ImageMotionPlan(
    string Motion,
    double Intensity,
    double FocusX,
    double FocusY,
    string Easing,
    string Look,
    bool Vignette,
    bool Grain,
    bool CinemaBars,
    double DurationSeconds,
    string Format,
    string Summary);

public static partial class ImageAnimation
{
    public const double MinSeconds = 2;
    public const double MaxSeconds = 20;
    public const double DefaultSeconds = 6;

    /// <summary>A phone photo is a few MB; this leaves room for a large PNG and no more.</summary>
    public const long MaxImageBytes = 20 * 1024 * 1024;

    public const int MaxDescriptionChars = 500;

    public static readonly IReadOnlyList<string> Motions =
        ["zoom-in", "zoom-out", "pan-left", "pan-right", "pan-up", "pan-down", "drift", "handheld", "breathe"];

    public static readonly IReadOnlyList<string> Looks =
        ["none", "cinematic", "warm", "cool", "vintage", "noir", "vivid", "matte"];

    public static readonly IReadOnlyList<string> Formats = ["landscape", "vertical", "square"];

    public static Canvas CanvasFor(string? format) => Normalize(format) switch
    {
        "vertical" => Canvas.Vertical1080x1920,
        "square" => Canvas.Square1080,
        _ => Canvas.Hd1080p30
    };

    public static double ClampSeconds(double seconds) =>
        double.IsFinite(seconds) ? Math.Clamp(seconds, MinSeconds, MaxSeconds) : DefaultSeconds;

    public static string MotionId(ImageMotion motion) => motion switch
    {
        ImageMotion.ZoomOut => "zoom-out",
        ImageMotion.PanLeft => "pan-left",
        ImageMotion.PanRight => "pan-right",
        ImageMotion.PanUp => "pan-up",
        ImageMotion.PanDown => "pan-down",
        ImageMotion.Drift => "drift",
        ImageMotion.Handheld => "handheld",
        ImageMotion.Breathe => "breathe",
        _ => "zoom-in"
    };

    public static string LookId(ImageLook look) => look switch
    {
        ImageLook.Cinematic => "cinematic",
        ImageLook.Warm => "warm",
        ImageLook.Cool => "cool",
        ImageLook.Vintage => "vintage",
        ImageLook.Noir => "noir",
        ImageLook.Vivid => "vivid",
        ImageLook.Matte => "matte",
        _ => "none"
    };

    /// <summary>
    /// The settings the renderer is given. Every value passes through
    /// <see cref="CinematicImageSettings.From"/>, so whatever wrote the plan - a person, the keyword reader or a model -
    /// only ever reaches ffmpeg as an allowlisted move and a clamped number.
    /// </summary>
    public static CinematicImageSettings Settings(ImageMotionPlan plan)
    {
        // An image page that does not move is not what anyone came for; "none" falls back to a gentle push in.
        var motion = CinematicImageSettings.ParseMotion(plan.Motion);
        if (motion == ImageMotion.None) motion = ImageMotion.ZoomIn;

        var settings = CinematicImageSettings.From(
            MotionId(motion), plan.Intensity, plan.FocusX, plan.FocusY,
            plan.Easing, plan.Look, plan.Vignette, plan.Grain, plan.CinemaBars);
        return settings!;
    }

    /// <summary>
    /// The plan a description reads as without any AI: keywords for the move, its speed, where it heads, the grade and
    /// the length. Always answers, so the page works on a server with no AI configured.
    /// </summary>
    public static ImageMotionPlan FromWords(string? description, string? format)
    {
        // Words, space-padded, so "top" is not found in "stop" nor "old" in "gold".
        var said = Normalize(description);
        var text = $" {string.Join(' ', WordPattern().Matches(said).Select(m => m.Value))} ";

        var motion =
            Has(text, "zoom out", "pull back", "pull out", "reveal", "move away") ? ImageMotion.ZoomOut
            : Has(text, "pan left", "move left", "slide left", "to the left") ? ImageMotion.PanLeft
            : Has(text, "pan right", "move right", "slide right", "to the right", "sideways") ? ImageMotion.PanRight
            : Has(text, "pan up", "tilt up", "move up", "rise", "rising", "upward") ? ImageMotion.PanUp
            : Has(text, "pan down", "tilt down", "move down", "descend", "downward") ? ImageMotion.PanDown
            : Has(text, "handheld", "shaky", "shake", "documentary", "vlog") ? ImageMotion.Handheld
            : Has(text, "breathe", "breathing", "pulse", "alive", "heartbeat") ? ImageMotion.Breathe
            : Has(text, "drift", "float", "glide", "dreamy", "travel") ? ImageMotion.Drift
            : ImageMotion.ZoomIn;

        var intensity =
            Has(text, "very slow", "subtle", "slight", "barely", "tiny") ? 0.08
            : Has(text, "slow", "gentle", "soft", "calm") ? 0.12
            : Has(text, "fast", "dramatic", "strong", "big", "intense", "quick") ? 0.32
            : CinematicImageSettings.DefaultIntensity;

        var focusX = Has(text, "left side", "on the left", "left edge") ? 25.0
            : Has(text, "right side", "on the right", "right edge") ? 75.0
            : 50.0;
        var focusY = Has(text, "face", "eyes", "head", "sky", "top", "moon", "sun") ? 30.0
            : Has(text, "feet", "ground", "floor", "bottom", "water") ? 75.0
            : 50.0;

        var look =
            Has(text, "black and white", "b&w", "noir", "monochrome") ? ImageLook.Noir
            : Has(text, "vintage", "retro", "old film", "nostalgic") ? ImageLook.Vintage
            : Has(text, "warm", "sunset", "golden", "sunrise", "cozy") ? ImageLook.Warm
            : Has(text, "cool", "cold", "blue", "night", "winter", "moonlight") ? ImageLook.Cool
            : Has(text, "vivid", "colorful", "colourful", "bright", "vibrant") ? ImageLook.Vivid
            : Has(text, "matte", "faded", "washed") ? ImageLook.Matte
            : Has(text, "cinematic", "movie", "film") ? ImageLook.Cinematic
            : ImageLook.None;

        var cinematic = Has(text, "cinematic", "movie", "film", "epic");
        var vignette = cinematic || look == ImageLook.Noir || Has(text, "vignette", "dark edges", "moody", "mysterious");
        var grain = look == ImageLook.Vintage || Has(text, "grain", "grainy", "film", "old");
        var bars = Has(text, "cinema bars", "letterbox", "widescreen", "epic");

        var seconds = DefaultSeconds;
        if (SecondsPattern().Match(said) is { Success: true } match
            && double.TryParse(match.Groups[1].Value, System.Globalization.CultureInfo.InvariantCulture, out var asked))
        {
            seconds = asked;
        }

        var plan = new ImageMotionPlan(
            MotionId(motion), intensity, focusX, focusY,
            Has(text, "linear", "constant", "steady") ? "linear" : "ease-in-out",
            LookId(look), vignette, grain, bars, ClampSeconds(seconds),
            FormatOf(text, format), string.Empty);
        return plan with { Summary = Describe(plan) };
    }

    /// <summary>
    /// A model's answer to the <see cref="BuiltInPrompts.ImageMotionPlan"/> prompt, read field by field and held to the
    /// same choices and ranges as everything else. Null when it is not an object; a field that is missing or wrong
    /// takes the keyword reading's value, so a half-good answer still helps.
    /// </summary>
    public static ImageMotionPlan? Parse(string? json, ImageMotionPlan fallback)
    {
        if (string.IsNullOrWhiteSpace(json)) return null;
        try
        {
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;
            if (root.ValueKind != JsonValueKind.Object) return null;

            var motion = Choice(root, "motion", Motions) ?? fallback.Motion;
            var look = Choice(root, "look", Looks) ?? fallback.Look;
            var plan = new ImageMotionPlan(
                motion,
                Number(root, "intensity") is { } i
                    ? Math.Clamp(i, CinematicImageSettings.MinIntensity, CinematicImageSettings.MaxIntensity)
                    : fallback.Intensity,
                Number(root, "focusX") is { } fx ? Math.Clamp(fx, 0, 100) : fallback.FocusX,
                Number(root, "focusY") is { } fy ? Math.Clamp(fy, 0, 100) : fallback.FocusY,
                Choice(root, "easing", ["linear", "ease-in-out"]) ?? fallback.Easing,
                look,
                Flag(root, "vignette") ?? fallback.Vignette,
                Flag(root, "grain") ?? fallback.Grain,
                Flag(root, "cinemaBars") ?? fallback.CinemaBars,
                Number(root, "durationSeconds") is { } s ? ClampSeconds(s) : fallback.DurationSeconds,
                fallback.Format,
                string.Empty);

            // The summary is model text shown on the page: one plain line, or ours instead.
            var summary = root.TryGetProperty("summary", out var said) && said.ValueKind == JsonValueKind.String
                ? AiOutputSanitizer.ToSafeLine(said.GetString(), 200)
                : null;
            return plan with { Summary = summary ?? Describe(plan) };
        }
        catch (JsonException)
        {
            return null;
        }
    }

    /// <summary>"Slow zoom in towards the top, warm grade, film grain, 6 s" - what the plan will do, in words.</summary>
    public static string Describe(ImageMotionPlan plan)
    {
        var speed = plan.Intensity switch { < 0.1 => "Subtle", < 0.14 => "Slow", > 0.28 => "Strong", _ => "Smooth" };
        var move = plan.Motion switch
        {
            "zoom-out" => "pull back",
            "pan-left" => "pan to the left",
            "pan-right" => "pan to the right",
            "pan-up" => "tilt upwards",
            "pan-down" => "tilt downwards",
            "drift" => "drifting push in",
            "handheld" => "handheld sway",
            "breathe" => "breathing zoom",
            _ => "push in"
        };

        var parts = new List<string> { $"{speed} {move}" };
        if (plan.Look != "none") parts.Add($"{plan.Look} grade");
        if (plan.Vignette) parts.Add("vignette");
        if (plan.Grain) parts.Add("film grain");
        if (plan.CinemaBars) parts.Add("cinema bars");
        parts.Add($"{plan.DurationSeconds:0.#} s");
        return string.Join(", ", parts);
    }

    private static string FormatOf(string text, string? format)
    {
        var asked = Normalize(format);
        if (Formats.Contains(asked)) return asked;
        if (Has(text, "vertical", "portrait", "shorts", "reel", "9:16", "tiktok")) return "vertical";
        if (Has(text, "square", "1:1", "instagram post")) return "square";
        return "landscape";
    }

    private static string? Choice(JsonElement root, string name, IReadOnlyList<string> allowed) =>
        root.TryGetProperty(name, out var value) && value.ValueKind == JsonValueKind.String
        && Normalize(value.GetString()) is var v && allowed.Contains(v)
            ? v
            : null;

    private static double? Number(JsonElement root, string name) =>
        root.TryGetProperty(name, out var value) && value.ValueKind == JsonValueKind.Number
        && value.TryGetDouble(out var d) && double.IsFinite(d)
            ? d
            : null;

    private static bool? Flag(JsonElement root, string name) =>
        root.TryGetProperty(name, out var value) && value.ValueKind is JsonValueKind.True or JsonValueKind.False
            ? value.GetBoolean()
            : null;

    private static bool Has(string text, params string[] words) =>
        words.Any(w => text.Contains($" {w} ", StringComparison.Ordinal));

    [GeneratedRegex(@"[a-z0-9&:]+", RegexOptions.CultureInvariant)]
    private static partial Regex WordPattern();

    private static string Normalize(string? value) =>
        string.IsNullOrWhiteSpace(value) ? string.Empty : value.Trim().ToLowerInvariant();

    [GeneratedRegex(@"(\d{1,2}(?:\.\d)?)\s*(?:s|sec|secs|second|seconds)\b", RegexOptions.CultureInvariant)]
    private static partial Regex SecondsPattern();
}
