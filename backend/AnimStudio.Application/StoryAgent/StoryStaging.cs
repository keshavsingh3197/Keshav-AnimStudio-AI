using System.Globalization;
using System.Text.Json;
using AnimStudio.Application.Ai;
using AnimStudio.Domain.Rendering;
using AnimStudio.Domain.Stories;

namespace AnimStudio.Application.StoryAgent;

/// <summary>
/// The staging a story template gives a scene - where it happens, who is seen, what they do, how the camera moves, the
/// cut into the next and a funny ending - read from a reply and made safe. Nothing here costs a call to any engine: the
/// camera and the cut are the renderer's own moves, and the picture prompt is composed from the template's words.
/// </summary>
/// <remarks>
/// Like the rest of the reply this is untrusted text. It only ever becomes a prompt the person reads, a subtitle, or a
/// name looked up in the owner's own meme library - never a file name, a key or a process argument.
/// </remarks>
public static class StoryStaging
{
    public const int MaxBackgroundChars = 400;
    public const int MaxActionChars = 400;
    public const int MaxLookChars = 300;
    public const int MaxOnScreen = 8;
    public const int MaxMemeNameChars = 80;
    public const int MaxCaptionChars = 120;
    private const int MaxNameChars = 60;
    private const int MaxEffectIdChars = 64;

    /// <summary>The camera moves a template may name, as it names them.</summary>
    public static readonly IReadOnlyList<string> CameraMoves = ["static", "zoomIn", "zoomOut", "panLeft", "panRight", "panUp", "panDown"];

    /// <summary>Reads the staging of one scene into <paramref name="scene"/>.</summary>
    public static void Read(JsonElement element, StoryScene scene)
    {
        scene.Background = AiOutputSanitizer.ToSafeLine(Text(element, "background") ?? Text(element, "setting"), MaxBackgroundChars);
        scene.Action = AiOutputSanitizer.ToSafeLine(Text(element, "action") ?? Text(element, "motion"), MaxActionChars);
        scene.OnScreen = Names(Property(element, "characters") ?? Property(element, "onScreen"));
        scene.Meme = Meme(Property(element, "funnyEnding") ?? Property(element, "meme"));

        var effect = Camera(Text(element, "camera"));
        var transition = Transition(Text(element, "transition"));
        if (effect is null && transition is null) return;

        // A template's choice is the person's: pinned, so a new look leaves it. A cut alone still needs a move to pin it to.
        scene.Effect = (effect ?? BackgroundEffect.ZoomIn).ToString();
        scene.EffectIntensity = Speed(Text(element, "cameraSpeed"));
        scene.Transition = (transition ?? SceneTransition.Fade).ToString();
        scene.TransitionSeconds = transition == SceneTransition.None ? 0 : StoryLook.DefaultTransitionSeconds;
        scene.LookPinned = true;
    }

    /// <summary>What a cast member looks like, from any of the names a template uses for it.</summary>
    public static string? Look(JsonElement member) =>
        AiOutputSanitizer.ToSafeLine(Text(member, "look") ?? Text(member, "appearance") ?? Text(member, "description"), MaxLookChars);

    /// <summary>Makes the staging safe again after an edit, and drops what is empty.</summary>
    public static void Normalize(StoryScene scene)
    {
        scene.Background = AiOutputSanitizer.ToSafeLine(scene.Background, MaxBackgroundChars);
        scene.Action = AiOutputSanitizer.ToSafeLine(scene.Action, MaxActionChars);
        scene.OnScreen = [.. scene.OnScreen
            .Select(n => AiOutputSanitizer.ToSafeLine(n, MaxNameChars)).OfType<string>()
            .Distinct(StringComparer.OrdinalIgnoreCase).Take(MaxOnScreen)];
        if (scene.Meme is { } meme)
        {
            meme.Name = AiOutputSanitizer.ToSafeLine(meme.Name, MaxMemeNameChars) ?? string.Empty;
            meme.EffectId = EffectId(meme.EffectId);
            meme.Caption = AiOutputSanitizer.ToSafeLine(meme.Caption, MaxCaptionChars);
            meme.Seconds = meme.Seconds is { } s && double.IsFinite(s)
                ? Math.Clamp(s, StoryMemeBeat.MinSeconds, StoryMemeBeat.MaxSeconds)
                : null;
            if (meme.Name.Length == 0 && meme.EffectId is null) scene.Meme = null;
        }
    }

    /// <summary>
    /// A picture prompt for a scene the template staged but gave none: the place, the people in it as they look, and
    /// what they do. Null when there is nothing to compose from.
    /// </summary>
    public static string? ComposeImagePrompt(StoryScene scene, IReadOnlyList<StoryCastMember> cast)
    {
        if (scene.Background is null && scene.Action is null && scene.OnScreen.Count == 0) return null;

        var parts = new List<string>();
        if (scene.Background is { } background) parts.Add(background.TrimEnd('.'));
        var people = scene.OnScreen
            .Select(name => cast.FirstOrDefault(c => string.Equals(c.Name.Trim(), name, StringComparison.OrdinalIgnoreCase)) is { Look: { } look }
                ? $"{name} ({look.TrimEnd('.')})"
                : name)
            .ToList();
        if (people.Count > 0) parts.Add("Characters: " + string.Join("; ", people));
        if (scene.Action is { } action) parts.Add(action.TrimEnd('.'));
        parts.Add("no text");

        return AiOutputSanitizer.ToSafeLine(string.Join(". ", parts) + ".", StoryScriptParser.MaxPromptChars);
    }

    /// <summary>The renderer's move for a camera a template named; null for a name it does not know.</summary>
    public static BackgroundEffect? Camera(string? value) => Squash(value) switch
    {
        null => null,
        "zoomin" or "pushin" or "dollyin" or "closeup" or "push" => BackgroundEffect.ZoomIn,
        "zoomout" or "pullback" or "pullout" or "dollyout" or "reveal" or "pull" => BackgroundEffect.ZoomOut,
        "panleft" or "left" => BackgroundEffect.PanLeft,
        "panright" or "right" or "pan" => BackgroundEffect.PanRight,
        "panup" or "tiltup" or "up" => BackgroundEffect.PanUp,
        "pandown" or "tiltdown" or "down" => BackgroundEffect.PanDown,
        "static" or "still" or "none" or "hold" or "locked" or "fixed" => BackgroundEffect.None,
        _ => null
    };

    /// <summary>The cut into the next scene a template named; null for a name it does not know.</summary>
    public static SceneTransition? Transition(string? value)
    {
        var squashed = Squash(value);
        switch (squashed)
        {
            case null: return null;
            case "cut" or "hardcut" or "none": return SceneTransition.None;
            case "crossfade": return SceneTransition.Fade;
            case "whip" or "whippan": return SceneTransition.SlideLeft;
        }

        return Enum.GetValues<SceneTransition>().Cast<SceneTransition?>()
            .FirstOrDefault(t => string.Equals(t.ToString(), squashed, StringComparison.OrdinalIgnoreCase));
    }

    private static double? Speed(string? value) => Squash(value) switch
    {
        "slow" or "gentle" => 0.06,
        "fast" or "quick" => 0.2,
        "normal" or "medium" => StoryBundleBuilder.EffectIntensity,
        _ => null
    };

    private static StoryMemeBeat? Meme(JsonElement? element)
    {
        StoryMemeBeat? meme = element switch
        {
            { ValueKind: JsonValueKind.String } name => new StoryMemeBeat { Name = name.GetString() ?? string.Empty },
            { ValueKind: JsonValueKind.Object } value => new StoryMemeBeat
            {
                Name = Text(value, "meme") ?? Text(value, "name") ?? string.Empty,
                EffectId = Text(value, "memeId") ?? Text(value, "id"),
                Caption = Text(value, "caption") ?? Text(value, "text"),
                Seconds = Property(value, "seconds") is { ValueKind: JsonValueKind.Number } n && n.TryGetDouble(out var s) ? s : null
            },
            _ => null
        };
        if (meme is null) return null;

        var scene = new StoryScene { Meme = meme };
        Normalize(scene);
        return scene.Meme;
    }

    /// <summary>A library id is the app's own GUID; anything else a template wrote there is ignored.</summary>
    private static string? EffectId(string? value)
    {
        var id = value?.Trim();
        return !string.IsNullOrEmpty(id) && id.Length <= MaxEffectIdChars && id.All(c => char.IsAsciiLetterOrDigit(c) || c == '-')
            ? id
            : null;
    }

    private static List<string> Names(JsonElement? element)
    {
        if (element is not { ValueKind: JsonValueKind.Array } list) return [];
        return [.. list.EnumerateArray()
            .Select(n => n.ValueKind switch
            {
                JsonValueKind.String => n.GetString(),
                JsonValueKind.Object => Text(n, "name"),
                _ => null
            })
            .Select(n => AiOutputSanitizer.ToSafeLine(n, MaxNameChars)).OfType<string>()
            .Distinct(StringComparer.OrdinalIgnoreCase).Take(MaxOnScreen)];
    }

    /// <summary>Lower case, without the spaces, dashes and underscores people put between words.</summary>
    private static string? Squash(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        var squashed = new string([.. value.Where(char.IsLetterOrDigit)]).ToLower(CultureInfo.InvariantCulture);
        return squashed.Length == 0 ? null : squashed;
    }

    private static JsonElement? Property(JsonElement element, string name)
    {
        foreach (var property in element.EnumerateObject())
        {
            if (string.Equals(property.Name, name, StringComparison.OrdinalIgnoreCase)) return property.Value;
        }
        return null;
    }

    private static string? Text(JsonElement element, string name) =>
        Property(element, name) is { ValueKind: JsonValueKind.String } value ? value.GetString() : null;
}
