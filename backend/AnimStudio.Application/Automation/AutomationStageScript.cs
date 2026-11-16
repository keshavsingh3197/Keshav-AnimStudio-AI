using System.Text;
using System.Text.RegularExpressions;
using AnimStudio.Application.Rendering;
using AnimStudio.Domain.Automation;

namespace AnimStudio.Application.Automation;

/// <summary>
/// Turns a post's <see cref="AutomationStageSettings"/> into what the procedural renderer understands, and cleans the
/// user's stage input before it is stored.
/// </summary>
public static partial class AutomationStageScript
{
    public const int MaxLocationChars = 200;
    public const int MaxAssetIdChars = 64;

    /// <summary>
    /// Prepends <c>[SCENE]: location | IMAGE: location</c> to a script that has no scene lines of its own. Scene lines
    /// are never spoken; this one picks the 3D setting and light, and is the image prompt for a painted backdrop.
    /// A script that already directs its scenes is returned unchanged.
    /// </summary>
    public static string WithLocation(string? script, string? location)
    {
        var body = script ?? string.Empty;
        var place = CleanLocation(location);
        if (place is null || HasSceneLine(body)) return body;
        return $"[SCENE]: {place} | IMAGE: {place}{Environment.NewLine}{body}";
    }

    /// <summary>The renderer layout, or null when nothing differs from the default stage.</summary>
    public static ProceduralStageLayout? ToLayout(AutomationStageSettings? stage, bool usingTemplate)
    {
        var left = ToPlacement(stage?.LeftCharacter);
        var right = ToPlacement(stage?.RightCharacter);
        if (left is null && right is null && !usingTemplate) return null;
        var motion = usingTemplate
            ? (stage?.BackgroundMotion ?? AutomationBackdropMotion.Still) switch
            {
                AutomationBackdropMotion.GentleZoom => TemplateBackdropMotion.GentleZoom,
                AutomationBackdropMotion.SlowPan => TemplateBackdropMotion.SlowPan,
                _ => TemplateBackdropMotion.Still
            }
            : TemplateBackdropMotion.Still;
        return new ProceduralStageLayout(left, right, usingTemplate, motion);
    }

    /// <summary>
    /// A cleaned copy of user stage input: location trimmed to one plain line (no brackets or separators that could
    /// start another script directive), the asset id length-checked, and placements clamped into the frame.
    /// The asset's ownership is checked separately by the caller.
    /// </summary>
    public static AutomationStageSettings Normalize(AutomationStageSettings? input)
    {
        input ??= new AutomationStageSettings();
        var assetId = input.BackgroundTemplateAssetId?.Trim();
        if (string.IsNullOrEmpty(assetId)) assetId = null;
        else if (assetId.Length > MaxAssetIdChars || !AssetIdRegex().IsMatch(assetId))
            throw new ArgumentException("That background image id is not valid.", nameof(input));

        var songId = input.AttachedSongId?.Trim();
        if (string.IsNullOrEmpty(songId)) songId = null;
        else if (songId.Length > MaxAssetIdChars || !AssetIdRegex().IsMatch(songId))
            throw new ArgumentException("That attached song id is not valid.", nameof(input));

        // Order matters (picture n is scene n); the same picture may serve two scenes.
        var scenePictures = new List<string>();
        foreach (var raw in input.SceneBackgroundAssetIds ?? [])
        {
            var id = raw?.Trim();
            if (string.IsNullOrEmpty(id) || id.Length > MaxAssetIdChars || !AssetIdRegex().IsMatch(id))
                throw new ArgumentException("A scene picture id is not valid.", nameof(input));
            scenePictures.Add(id);
        }
        if (scenePictures.Count > DialogueScriptParser.MaxScenes)
            throw new ArgumentException($"At most {DialogueScriptParser.MaxScenes} scene pictures.", nameof(input));

        return new AutomationStageSettings
        {
            BackgroundTemplateAssetId = assetId,
            // A single background picture covers the whole video, so scene pictures would never show.
            SceneBackgroundAssetIds = assetId is null ? scenePictures : [],
            LocationPrompt = CleanLocation(input.LocationPrompt),
            LeftCharacter = ClampPlacement(input.LeftCharacter),
            RightCharacter = ClampPlacement(input.RightCharacter),
            IncludeBackgroundMusic = input.IncludeBackgroundMusic,
            FollowScriptExactly = input.FollowScriptExactly,
            ReviewSteps = input.ReviewSteps,
            AttachedSongId = songId,
            // An unknown number from the client falls back to the still picture.
            BackgroundMotion = Enum.IsDefined(input.BackgroundMotion) ? input.BackgroundMotion : AutomationBackdropMotion.Still
        };
    }

    /// <summary>One plain line of at most <see cref="MaxLocationChars"/> characters, or null when empty.</summary>
    public static string? CleanLocation(string? location)
    {
        if (string.IsNullOrWhiteSpace(location)) return null;
        var sb = new StringBuilder(location.Length);
        foreach (var ch in location)
        {
            // Brackets, pipes and line breaks would change the meaning of the [SCENE] line this text is placed in.
            if (char.IsControl(ch) || ch is '[' or ']' or '|' or '{' or '}' or '<' or '>') sb.Append(' ');
            else sb.Append(ch);
        }
        var clean = SpacesRegex().Replace(sb.ToString(), " ").Trim();
        if (clean.Length == 0) return null;
        return clean.Length <= MaxLocationChars ? clean : clean[..MaxLocationChars].TrimEnd();
    }

    private static bool HasSceneLine(string script)
    {
        foreach (Match m in TagRegex().Matches(script))
        {
            if (SceneDirectives.IsSceneTag(m.Groups[1].Value)) return true;
        }
        return false;
    }

    private static ProceduralStagePlacement? ToPlacement(AutomationCharacterPlacement? p) =>
        p is null ? null : ProceduralStagePlacement.Clamp(p.X, p.Y, p.Scale);

    private static AutomationCharacterPlacement? ClampPlacement(AutomationCharacterPlacement? p)
    {
        if (p is null) return null;
        var c = ProceduralStagePlacement.Clamp(p.X, p.Y, p.Scale);
        return new AutomationCharacterPlacement { X = c.X, Y = c.Y, Scale = c.Scale };
    }

    [GeneratedRegex(@"^\s*\[([^\]\r\n]{1,40})\]\s*:", RegexOptions.Multiline)]
    private static partial Regex TagRegex();

    [GeneratedRegex(@"\s+")]
    private static partial Regex SpacesRegex();

    [GeneratedRegex(@"^[A-Za-z0-9_\-]+$")]
    private static partial Regex AssetIdRegex();
}
