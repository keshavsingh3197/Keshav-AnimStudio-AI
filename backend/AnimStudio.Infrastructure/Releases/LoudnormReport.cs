using System.Globalization;
using System.Text.Json;

namespace AnimStudio.Infrastructure.Releases;

/// <summary>
/// The JSON block ffmpeg's <c>loudnorm</c> filter prints to stderr with
/// <c>print_format=json</c>. Every value arrives as a string, and silence is reported as
/// "-inf", so parsing is done by hand rather than by binding to a type.
/// </summary>
public sealed record LoudnormReport(
    double InputIntegrated,
    double InputTruePeak,
    double InputLoudnessRange,
    double InputThreshold,
    double TargetOffset,
    string NormalizationType)
{
    /// <summary>Finds and parses the last loudnorm block in ffmpeg's stderr, or null when there is none.</summary>
    public static LoudnormReport? Parse(string stderr)
    {
        var key = stderr.LastIndexOf("\"input_i\"", StringComparison.Ordinal);
        if (key < 0) return null;

        var start = stderr.LastIndexOf('{', key);
        var end = stderr.IndexOf('}', key);
        if (start < 0 || end < 0) return null;

        try
        {
            using var document = JsonDocument.Parse(stderr.AsMemory(start, end - start + 1));
            var root = document.RootElement;

            return new LoudnormReport(
                Number(root, "input_i"),
                Number(root, "input_tp"),
                Number(root, "input_lra"),
                Number(root, "input_thresh"),
                Number(root, "target_offset"),
                root.TryGetProperty("normalization_type", out var type) ? type.GetString() ?? string.Empty : string.Empty);
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private static double Number(JsonElement root, string name)
    {
        if (!root.TryGetProperty(name, out var value)) return double.NaN;

        var text = value.ValueKind == JsonValueKind.String ? value.GetString() : value.GetRawText();
        return text switch
        {
            "-inf" => double.NegativeInfinity,
            "inf" => double.PositiveInfinity,
            _ => double.TryParse(text, NumberStyles.Float, CultureInfo.InvariantCulture, out var number)
                ? number
                : double.NaN
        };
    }
}
