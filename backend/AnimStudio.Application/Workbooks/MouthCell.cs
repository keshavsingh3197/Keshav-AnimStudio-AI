using System.Globalization;
using System.Text.RegularExpressions;
using AnimStudio.Domain.Rendering;
using AnimStudio.Domain.Scenes;

namespace AnimStudio.Application.Workbooks;

/// <summary>
/// The Scenes sheet's <c>Mouths</c> cell: the mouths drawn into a scene's picture and when each talks, as text a person
/// can read and fix in a spreadsheet.
/// <code>Teacher: 0.456 0.406 0.16 @ 0-1.5 3.2-4; Pappu: 0.71 0.45 0.14 @ 1.6-3.1</code>
/// Each mouth is its middle across and down the picture and the face's width, all fractions of the picture, then the
/// seconds from the scene's start in which it talks. The name is optional and only for the reader.
/// </summary>
public static partial class MouthCell
{
    public const int MaxMouths = 8;
    public const int MaxWindows = 64;
    private const int MaxNameChars = 60;

    public static string Format(IReadOnlyList<SceneMouth> mouths, FrameRate rate) =>
        string.Join("; ", mouths.Select(m =>
        {
            var name = Name(m.Name) is { } n ? $"{n}: " : string.Empty;
            var windows = string.Join(' ', m.Windows.Select(w =>
                $"{N(new FrameCount(w.StartFrame).ToSeconds(rate))}-{N(new FrameCount(w.EndFrame).ToSeconds(rate))}"));
            return $"{name}{N(m.X)} {N(m.Y)} {N(m.FaceWidth)} @ {windows}";
        }));

    /// <summary>Reads the cell; null with the reason when it does not read as mouths. Empty reads as none.</summary>
    public static List<SceneMouth>? Parse(string? text, FrameRate rate, out string? error)
    {
        error = null;
        var mouths = new List<SceneMouth>();
        if (string.IsNullOrWhiteSpace(text)) return mouths;

        var parts = text.Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        if (parts.Length > MaxMouths)
        {
            error = $"At most {MaxMouths} mouths a scene.";
            return null;
        }

        foreach (var part in parts)
        {
            var match = MouthPattern().Match(part);
            if (!match.Success)
            {
                error = $"'{Shorten(part)}' should read like 'Name: 0.45 0.40 0.16 @ 0-1.5 3-4'.";
                return null;
            }

            var x = Number(match.Groups["x"].Value);
            var y = Number(match.Groups["y"].Value);
            var width = Number(match.Groups["w"].Value);
            if (x > 1 || y > 1 || width is <= 0 or > 1)
            {
                error = $"'{Shorten(part)}': the position and face width are fractions of the picture, from 0 to 1.";
                return null;
            }

            var windows = new List<MouthWindow>();
            foreach (Match window in WindowPattern().Matches(match.Groups["windows"].Value))
            {
                var start = Number(window.Groups["s"].Value);
                var end = Number(window.Groups["e"].Value);
                if (end <= start || end > 3600) continue;
                windows.Add(new MouthWindow
                {
                    StartFrame = FrameCount.FromSeconds(start, rate).Value,
                    EndFrame = FrameCount.FromSeconds(end, rate).Value
                });
            }

            if (windows.Count > MaxWindows)
            {
                error = $"'{Shorten(part)}': at most {MaxWindows} stretches of talking a mouth.";
                return null;
            }

            mouths.Add(new SceneMouth { Name = Name(match.Groups["name"].Value), X = x, Y = y, FaceWidth = width, Windows = windows });
        }

        return mouths;
    }

    private static string? Name(string? name)
    {
        var trimmed = name?.Trim();
        if (string.IsNullOrEmpty(trimmed)) return null;
        trimmed = new string([.. trimmed.Where(c => !char.IsControl(c) && c is not (';' or ':' or '@'))]);
        return trimmed.Length == 0 ? null : trimmed.Length <= MaxNameChars ? trimmed : trimmed[..MaxNameChars];
    }

    private static string Shorten(string text) => text.Length <= 40 ? text : text[..40] + "…";

    private static double Number(string text) => double.Parse(text, NumberStyles.AllowDecimalPoint, CultureInfo.InvariantCulture);

    private static string N(double value) => value.ToString("0.###", CultureInfo.InvariantCulture);

    [GeneratedRegex(
        @"^(?:(?<name>[^:;@]{1,60}):)?\s*(?<x>(?:\d{1,3}(?:\.\d{1,6})?|\.\d{1,6}))\s+(?<y>(?:\d{1,3}(?:\.\d{1,6})?|\.\d{1,6}))\s+(?<w>(?:\d{1,3}(?:\.\d{1,6})?|\.\d{1,6}))\s*@\s*(?<windows>(?:\d{1,4}(?:\.\d{1,3})?\s*-\s*\d{1,4}(?:\.\d{1,3})?\s*)+)$",
        RegexOptions.CultureInvariant)]
    private static partial Regex MouthPattern();

    [GeneratedRegex(@"(?<s>\d{1,4}(?:\.\d{1,3})?)\s*-\s*(?<e>\d{1,4}(?:\.\d{1,3})?)", RegexOptions.CultureInvariant)]
    private static partial Regex WindowPattern();
}
