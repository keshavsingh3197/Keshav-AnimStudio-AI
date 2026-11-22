using System.Text;
using System.Text.RegularExpressions;
using AnimStudio.Application.Rendering;
using AnimStudio.Domain.Automation;

namespace AnimStudio.Application.Automation;

/// <summary>
/// A ready image prompt for the background picture of an Enhanced 3D video, written for one post: the place, the light,
/// the frame shape, and where the two characters will stand, so the picture works behind them.
/// </summary>
/// <param name="Prompt">Paste into any image tool (Gemini, ChatGPT, Ideogram...) or send to the app's image engine.</param>
/// <param name="NegativePrompt">What the picture must not contain, for tools that take a negative prompt.</param>
/// <param name="AspectRatio">"9:16", "16:9" or "1:1".</param>
/// <param name="Width">Best upload width in pixels.</param>
/// <param name="Height">Best upload height in pixels.</param>
/// <param name="Basis">What the place was taken from: "location", "script", "topic" or "event".</param>
public sealed record AutomationBackgroundPrompt(
    string Prompt,
    string NegativePrompt,
    string AspectRatio,
    int Width,
    int Height,
    string Basis);

/// <summary>A background picture the image engine made for a post and saved to Studio Storage.</summary>
public sealed record AutomationGeneratedBackground(string AssetId, string Provider, string Prompt);

/// <summary>Body of the background picture prompt and generate calls: the wizard's unsaved stage, and an edited prompt.</summary>
public sealed class AutomationBackgroundPictureRequest
{
    public AutomationStageSettings? Stage { get; set; }

    /// <summary>The prompt as the user edited it; null or empty uses the built prompt.</summary>
    public string? Prompt { get; set; }
}

public static partial class AutomationBackgroundPromptBuilder
{
    public const int MaxPromptChars = 2000;

    public const string NegativePrompt =
        "people, person, faces, characters, hands, crowd, animals in the foreground, text, letters, words, captions, " +
        "subtitles, logo, watermark, signature, frame, border, cartoon, anime, low quality, blurry, distorted, oversaturated";

    /// <summary>Photoreal background subjects per painted setting; also used for per-scene backdrops.</summary>
    public static string SubjectFor(SceneSetting setting) => setting switch
    {
        SceneSetting.Temple => "ancient carved stone Hindu temple courtyard with brass bells, oil lamps, marigold garlands and soft incense haze",
        SceneSetting.ForestAshram => "sacred forest ashram clearing with a thatched hermitage hut, banyan trees and soft god rays",
        SceneSetting.RiverGhat => "holy river ghat with wide stone steps, floating diyas and distant temple spires reflected in calm water",
        SceneSetting.Himalaya => "majestic snow-capped Himalayan peaks above drifting clouds and a quiet stone meditation ledge",
        SceneSetting.PalaceCourt => "grand ancient Indian royal court with carved marble pillars, silk drapes and a golden throne",
        SceneSetting.Cosmos => "vast cosmic sky with nebula clouds, glowing stars and celestial light above a floating stone platform",
        SceneSetting.Village => "traditional Indian village square with mud huts, fields, a neem tree and cooking-fire smoke",
        SceneSetting.Battlefield => "ancient battlefield plain with banners, chariots in the far distance and dust in golden light",
        SceneSetting.Archive => "old library archive with tall wooden shelves of manuscripts, scrolls and a warm lamp",
        SceneSetting.ModernCity => "modern Indian city rooftop terrace with a skyline of glass towers and soft evening lights",
        SceneSetting.ChaiStall => "busy Indian street corner chai stall with a steaming kettle, glass jars, string lights and a wooden bench",
        SceneSetting.ComedyStage => "small warm comedy club stage with a brick wall, spotlight pool and a red curtain at the side",
        SceneSetting.SkyGauntlet => "vibrant stylized 3D floating sky gauntlet obstacle catwalk above sunlit clouds with glowing choice portals",
        SceneSetting.TankArena => "stylized cartoon canyon tank arena with sandbag bunkers, craters and dramatic sunset battle lighting",
        SceneSetting.DoorwaySet => "colorful slapstick 3D cartoon hallway with an oversized wooden doorway, checkerboard tiles and spotlight",
        SceneSetting.Bedroom => "cozy colorful 3D Indian bedroom interior with wooden charpai bed, soft pillows, warm bedside lamp and window daylight",
        SceneSetting.LivingRoom => "bright Indian family living room with sofa seating, coffee table, framed wall art, curtains and wooden door",
        SceneSetting.Kitchen => "lively Indian home kitchen with gas stove, steaming brass rabdi kadhai, spice rack jars and warm counter light",
        SceneSetting.SweetShop => "vibrant Indian halwai mithai sweet shop counter with stacked laddoo trays, marigold garlands and warm lantern glow",
        SceneSetting.BarberShop => "busy Indian neighborhood barber salon interior with framed wall mirror, barber swivel chair, hair tonic bottles on shelf and tiled floor",
        SceneSetting.Courtroom => "classic Indian courtroom interior with elevated wooden judge bench, brass justice scales, wood-paneled walls and witness stand",
        SceneSetting.DoctorClinic => "bright clean neighborhood doctor clinic room with wooden desk, examination bed, medical chart and cabinet",
        SceneSetting.Classroom => "traditional Indian school classroom with wooden benches, wide green chalkboard, ceiling fan and sunlit windows",
        SceneSetting.QuizStudio => "vibrant television quiz studio stage with glowing golden circular floor rings, twin podiums and dramatic spotlight beams",
        SceneSetting.NeighborhoodGate => "sunny Indian colony street main gate with brick boundary wall, wrought iron gate, banyan tree shade and street pole",
        _ => "cinematic Indian landscape with a clear open foreground"
    };

    /// <summary>
    /// The prompt for <paramref name="post"/> with the wizard's current (possibly unsaved) <paramref name="stage"/>.
    /// Only fixed phrases and the post's own cleaned text go into it.
    /// </summary>
    public static AutomationBackgroundPrompt Build(AutomationPost post, AutomationStageSettings? stage)
    {
        ArgumentNullException.ThrowIfNull(post);
        var location = AutomationStageScript.CleanLocation(stage?.LocationPrompt);
        var sceneImage = FirstSceneImage(post.Script);

        string subject;
        string basis;
        SceneTimeOfDay time;
        if (location is not null)
        {
            var setting = SceneDirectives.InferSetting(location);
            // The user's own words lead; a matched setting adds the details that make it photoreal.
            subject = setting == SceneSetting.Auto ? location : $"{location}: {SubjectFor(setting)}";
            time = SceneDirectives.InferTime(location);
            basis = "location";
        }
        else if (sceneImage is { } scene)
        {
            subject = scene.Image;
            time = scene.Time;
            basis = "script";
        }
        else
        {
            var topicText = $"{post.Title} {post.SourceTitle}";
            var setting = SceneDirectives.InferSetting(topicText);
            basis = setting == SceneSetting.Auto ? "event" : "topic";
            if (setting == SceneSetting.Auto) setting = DefaultSetting(post.SourceType);
            subject = SubjectFor(setting);
            time = SceneDirectives.InferTime(topicText);
        }
        if (time == SceneTimeOfDay.Auto) time = DefaultTime(post.SourceType);

        var (ratio, width, height, shape) = post.Format switch
        {
            AutomationVideoFormat.Wide => ("16:9", 1920, 1080, "Wide 16:9 landscape frame"),
            AutomationVideoFormat.CommunityPost => ("1:1", 1080, 1080, "Square 1:1 frame"),
            _ => ("9:16", 1080, 1920, "Tall 9:16 vertical frame for a YouTube Short")
        };

        var (left, right) = Spots(post.Format, stage);
        var title = CleanInline(post.Title, 120);

        var sb = new StringBuilder();
        sb.Append($"Photorealistic cinematic background plate: {subject.TrimEnd('.', ' ')}, {LightFor(time)}. ");
        sb.Append($"{shape} ({width}x{height}). ");
        sb.Append("An empty set with no people: two animated characters will be added on top later, so leave clear, flat, " +
                  $"uncluttered ground where they stand - one at about {left.X} across and {left.Y} down, the other at about " +
                  $"{right.X} across and {right.Y} down. ");
        sb.Append("Put the main landmark in the upper middle, between and behind those two spots. ");
        sb.Append("Keep the bottom quarter simple and a little darker, because captions go there. ");
        sb.Append($"Colour grade: {GradeFor(post.SourceType)}. Soft volumetric light, gentle depth of field, rich detail, 8k matte painting look. ");
        if (title.Length > 0)
            sb.Append($"Mood inspired by the video topic \"{title}\" - do not write this or any other text in the picture. ");
        sb.Append("No text, letters, logos, watermarks or frames anywhere.");

        return new AutomationBackgroundPrompt(sb.ToString(), NegativePrompt, ratio, width, height, basis);
    }

    /// <summary>
    /// A user-edited prompt made safe to send: one line, no control characters, at most <see cref="MaxPromptChars"/>.
    /// Null when nothing is left.
    /// </summary>
    public static string? CleanPrompt(string? prompt)
    {
        var clean = CleanInline(prompt, MaxPromptChars);
        return clean.Length == 0 ? null : clean;
    }

    /// <summary>Generation size for the image engine (the same sizes the per-scene backdrops use).</summary>
    public static (int Width, int Height) EngineSize(AutomationVideoFormat format) => format switch
    {
        AutomationVideoFormat.Wide => (1344, 768),
        AutomationVideoFormat.CommunityPost => (1024, 1024),
        _ => (768, 1344)
    };

    private static ((string X, string Y) Left, (string X, string Y) Right) Spots(AutomationVideoFormat format, AutomationStageSettings? stage)
    {
        // Defaults mirror ProceduralCharacterRenderer / the wizard's placement editor.
        var (lx, ly, rx, ry) = format == AutomationVideoFormat.Wide ? (0.24, 0.77, 0.76, 0.77) : (0.27, 0.555, 0.73, 0.555);
        var l = stage?.LeftCharacter is { } lc ? ProceduralStagePlacement.Clamp(lc.X, lc.Y, lc.Scale) : null;
        var r = stage?.RightCharacter is { } rc ? ProceduralStagePlacement.Clamp(rc.X, rc.Y, rc.Scale) : null;
        return ((Pct(l?.X ?? lx), Pct(l?.Y ?? ly)), (Pct(r?.X ?? rx), Pct(r?.Y ?? ry)));
    }

    private static string Pct(double fraction) => $"{Math.Round(fraction * 100):0}%";

    private static (string Image, SceneTimeOfDay Time)? FirstSceneImage(string? script)
    {
        if (string.IsNullOrWhiteSpace(script)) return null;
        foreach (Match m in SceneLineRegex().Matches(script))
        {
            if (!SceneDirectives.IsSceneTag(m.Groups[1].Value)) continue;
            var directive = SceneDirectives.ParseScene(m.Groups[2].Value);
            var image = CleanInline(directive.ImagePrompt, 400);
            if (image.Length > 0) return (image, directive.TimeOfDay);
        }
        return null;
    }

    private static SceneSetting DefaultSetting(AutomationSourceType source) => source switch
    {
        AutomationSourceType.HinduPanchang or AutomationSourceType.HinduFestival => SceneSetting.Temple,
        AutomationSourceType.DailyKatha => SceneSetting.ForestAshram,
        AutomationSourceType.AajKaItihaas or AutomationSourceType.Pratiyogita => SceneSetting.Archive,
        AutomationSourceType.EcosystemSpotlight => SceneSetting.ModernCity,
        AutomationSourceType.FunnyComedy => SceneSetting.ChaiStall,
        _ => SceneSetting.Auto
    };

    private static SceneTimeOfDay DefaultTime(AutomationSourceType source) => source switch
    {
        AutomationSourceType.HinduPanchang => SceneTimeOfDay.Dawn,
        AutomationSourceType.HinduFestival => SceneTimeOfDay.Sunset,
        AutomationSourceType.EcosystemSpotlight => SceneTimeOfDay.Night,
        _ => SceneTimeOfDay.Day
    };

    private static string LightFor(SceneTimeOfDay time) => time switch
    {
        SceneTimeOfDay.Dawn => "golden sunrise light with long soft shadows",
        SceneTimeOfDay.Sunset => "warm sunset glow with a saffron sky",
        SceneTimeOfDay.Night => "moonlit night lit by warm lamps",
        SceneTimeOfDay.Day => "bright natural daylight",
        _ => "soft cinematic light"
    };

    private static string GradeFor(AutomationSourceType source) => source switch
    {
        AutomationSourceType.HinduPanchang => "devotional saffron and gold",
        AutomationSourceType.HinduFestival => "festive marigold orange, magenta and gold",
        AutomationSourceType.DailyKatha => "warm saffron with deep forest green",
        AutomationSourceType.AajKaItihaas => "sepia and antique gold",
        AutomationSourceType.Pratiyogita => "deep royal blue and gold",
        AutomationSourceType.EcosystemSpotlight => "teal and violet neon",
        AutomationSourceType.FunnyComedy => "bright, warm and playful",
        _ => "natural cinematic"
    };

    private static string CleanInline(string? text, int max)
    {
        if (string.IsNullOrWhiteSpace(text)) return string.Empty;
        var sb = new StringBuilder(Math.Min(text.Length, max + 16));
        foreach (var ch in text)
            sb.Append(char.IsControl(ch) ? ' ' : ch);
        var clean = SpacesRegex().Replace(sb.ToString(), " ").Trim();
        return clean.Length <= max ? clean : clean[..max].TrimEnd();
    }

    [GeneratedRegex(@"^\s*\[([^\]\r\n]{1,40})\]\s*:(.*)$", RegexOptions.Multiline)]
    private static partial Regex SceneLineRegex();

    [GeneratedRegex(@"\s+")]
    private static partial Regex SpacesRegex();
}
