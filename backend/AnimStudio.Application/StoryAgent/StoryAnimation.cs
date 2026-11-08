using System.Text;
using AnimStudio.Application.Ai;
using AnimStudio.Domain.Stories;

namespace AnimStudio.Application.StoryAgent;

/// <summary>
/// The look a story's pictures share, and the motion prompt offered for each scene: the person copies it into a video tool
/// (Google Flow), makes the clip there and attaches it to the scene.
/// </summary>
/// <remarks>
/// <para>
/// The prompt is composed here rather than kept as an editable template: the template renderer fences every value as
/// data for a text model, and a video model would draw those fences. What the person edits instead is each scene's own
/// motion description (<see cref="StoryScene.VideoPrompt"/>), and the composed prompt is shown next to it.
/// </para>
/// <para>
/// A speaking scene names who speaks and quotes their words, so the tool moves their lips for those words; the sound
/// it makes is thrown away and the scene's narration is heard instead, which keeps the voices the person approved.
/// </para>
/// </remarks>
public static class StoryAnimation
{
    /// <summary>The most of a speaker's words quoted to the engine; an eight-second clip holds about this much speech.</summary>
    private const int MaxQuotedChars = 220;

    private const int MaxActionChars = 800;

    /// <summary>The picture style a generated picture is asked for: the art style's own, with what the person typed after it.</summary>
    public static string PictureStyle(StoryRun run, string fallback)
    {
        var typed = string.IsNullOrWhiteSpace(run.Options.ImageStyle) ? null : run.Options.ImageStyle.Trim();
        if (run.Options.ArtStyle == StoryArtStyle.Auto) return typed ?? fallback;

        var preset = ImageStyleOf(run.Options.ArtStyle);

        // The genre's style was copied in as a default; a chosen art style replaces it rather than arguing with it.
        if (typed is null || string.Equals(typed, run.Genre?.ImageStyle?.Trim(), StringComparison.OrdinalIgnoreCase)) return preset;
        return $"{preset}, {typed}";
    }

    public static string ImageStyleOf(StoryArtStyle style) => style switch
    {
        StoryArtStyle.Painting =>
            "classical Indian painting, rich jewel colours, fine gold detail, warm golden light, no text, no watermark",
        StoryArtStyle.Realistic =>
            "cinematic photorealistic film still, natural skin and textures, soft natural light, shallow depth of field, no text, no watermark",
        StoryArtStyle.Cartoon =>
            "2D hand-drawn cartoon illustration, bold clean outlines, flat bright colours, expressive faces, simple painted background, no text, no watermark",
        StoryArtStyle.Cartoon3D =>
            "3D animated feature film style, soft rounded characters, big expressive eyes, warm cinematic lighting, rich textures, no text, no watermark",
        _ => string.Empty
    };

    /// <summary>The art style the motion follows: the one chosen, or the one the picture style reads as.</summary>
    public static StoryArtStyle EffectiveStyle(StoryRun run)
    {
        if (run.Options.ArtStyle != StoryArtStyle.Auto) return run.Options.ArtStyle;

        var style = $"{run.Options.ImageStyle} {run.Genre?.ImageStyle}".ToLowerInvariant();
        if (style.Contains("3d", StringComparison.Ordinal) || style.Contains("pixar", StringComparison.Ordinal)) return StoryArtStyle.Cartoon3D;
        if (style.Contains("cartoon", StringComparison.Ordinal) || style.Contains("comic", StringComparison.Ordinal)
            || style.Contains("anime", StringComparison.Ordinal)) return StoryArtStyle.Cartoon;
        if (style.Contains("photo", StringComparison.Ordinal) || style.Contains("realistic", StringComparison.Ordinal)
            || style.Contains("cinematic", StringComparison.Ordinal)) return StoryArtStyle.Realistic;
        return StoryArtStyle.Painting;
    }

    /// <summary>True when a character (not the narrator) says something in the scene.</summary>
    public static bool HasSpeech(StoryScene scene) =>
        scene.Lines.Any(l => !IsNarrator(l.Speaker) && !string.IsNullOrWhiteSpace(l.Text));

    /// <summary>What a video tool is asked to make of the scene's picture.</summary>
    public static string Prompt(StoryRun run, StoryScene scene)
    {
        var builder = new StringBuilder();
        var cast = run.Script?.Cast ?? [];

        var action = Clean(scene.VideoPrompt, MaxActionChars) ?? Clean(scene.ImagePrompt, MaxActionChars);
        builder.Append("Bring this picture to life as one continuous shot. ");
        if (action is not null) builder.Append(Sentence(action)).Append(' ');

        var speeches = scene.Lines
            .Where(l => !IsNarrator(l.Speaker) && !string.IsNullOrWhiteSpace(l.Text))
            .Select(l => (Speaker: Clean(l.Speaker, 60) ?? "The character", Words: Quote(l.Text), Emotion: StoryEmotions.Find(l.Emotion)))
            .Where(l => l.Words.Length > 0)
            .ToList();

        var comic = IsComic(run, scene);
        if (speeches.Count > 0)
        {
            var room = MaxQuotedChars;
            var said = new List<string>();
            var reactions = new List<string>();
            foreach (var (speaker, words, emotion) in speeches)
            {
                if (room <= 20) break;
                var quoted = words.Length <= room ? words : words[..room].TrimEnd() + "…";
                room -= quoted.Length;
                said.Add(emotion is null
                    ? $"{speaker}{Describe(cast, speaker)} speaks, saying: “{quoted}”"
                    : $"{speaker}{Describe(cast, speaker)} speaks {emotion.Adverb}, with {emotion.Face}, saying: “{quoted}”");
                if (emotion is not null) reactions.Add(emotion.Reaction);
            }

            builder.Append(string.Join(" Then ", said)).Append(". ");
            builder.Append(
                "Whoever speaks faces the viewer or the one they talk to, and their lips, jaw and cheeks move clearly and in time " +
                "with every word, with natural blinks, small nods and head turns, and hand gestures that match what they say. ");
            if (comic)
            {
                builder.Append("The others react with big, funny cartoon reactions timed to what is said");
                builder.Append(reactions.Count > 0 ? $": {string.Join(", then ", reactions.Distinct())}. " : ". ");
                builder.Append("Expressions are exaggerated and easy to read, with comic timing: a beat of stillness before each reaction. ");
            }
            else
            {
                builder.Append("The others listen and react with their eyes and faces. ");
            }
        }
        else
        {
            builder.Append(
                "Nobody talks: the characters act without speaking, with natural breathing, blinking, small head and body " +
                "movements and the action described, so the picture feels alive. ");
            if (comic)
                builder.Append("Play it for laughs with exaggerated, easy-to-read cartoon acting and comic timing. ");
        }

        builder.Append("The background moves too where it would in life: cloth, hair, leaves, water, smoke, flames, light. ");
        if (scene.VideoPrompt is null || !MentionsCamera(scene.VideoPrompt)) builder.Append(Camera(scene.Mood)).Append(' ');
        if (Clean(scene.Mood, 30) is { } mood) builder.Append("The mood is ").Append(mood).Append(". ");

        builder.Append(MotionStyle(EffectiveStyle(run))).Append(' ');
        if (run.Brief.Mode == StoryGenreMode.Scripture)
            builder.Append("Reverent and dignified: deities and sages move with grace, nothing comic or disrespectful. ");
        if (run.Genre?.MadeForKids == true)
            builder.Append("Gentle and friendly, right for young children. ");

        builder.Append(
            "Start exactly from the given picture and keep every character's face, body, clothes and colours and the setting " +
            "the same throughout. Smooth, steady motion. No text, captions, subtitles, letters, logos or watermarks.");
        return builder.ToString();
    }

    /// <summary>Moods of a scene meant to make the viewer laugh.</summary>
    private static readonly string[] ComicMoods = ["playful", "funny", "comic", "silly", "mischiev"];

    /// <summary>
    /// A scene played for laughs: in the funny genre, or with a playful mood. Never in a scripture story, whatever its mood.
    /// </summary>
    public static bool IsComic(StoryRun run, StoryScene scene)
    {
        if (run.Brief.Mode == StoryGenreMode.Scripture) return false;
        if (string.Equals(run.Genre?.Id ?? run.Brief.GenreId, StoryGenres.FunnyId, StringComparison.Ordinal)) return true;
        var mood = scene.Mood?.ToLowerInvariant() ?? string.Empty;
        return ComicMoods.Any(m => mood.Contains(m, StringComparison.Ordinal));
    }

    private static string MotionStyle(StoryArtStyle style) => style switch
    {
        StoryArtStyle.Realistic => "Realistic, film-like motion with natural weight, timing and expressions.",
        StoryArtStyle.Cartoon =>
            "Classic 2D cartoon animation: lively, bouncy, expressive acting with a little squash and stretch, keeping the bold outlines and flat colours.",
        StoryArtStyle.Cartoon3D =>
            "3D animated feature acting: appealing, smooth and expressive, with big readable expressions and soft cinematic light.",
        _ => "Animate it as a living painting: graceful, gentle motion that keeps the painted look, colours and brush texture."
    };

    /// <summary>One camera move that suits the mood, the same words the look planner listens for.</summary>
    private static string Camera(string? mood)
    {
        var m = mood?.ToLowerInvariant() ?? string.Empty;
        if (new[] { "dramatic", "tense", "intense", "fierce", "angry", "battle", "war", "danger", "storm", "epic" }.Any(w => m.Contains(w, StringComparison.Ordinal)))
            return "The camera pushes in slowly and steadily towards the main character.";
        if (new[] { "joy", "happy", "festive", "celebrat", "playful", "cheer", "excite" }.Any(w => m.Contains(w, StringComparison.Ordinal)))
            return "The camera glides gently sideways with the action.";
        if (new[] { "sad", "sorrow", "grief", "longing", "lonely", "loss", "reflect" }.Any(w => m.Contains(w, StringComparison.Ordinal)))
            return "The camera pulls back very slowly.";
        if (new[] { "awe", "wonder", "divine", "myster", "majest", "sacred", "miracle", "heaven", "blessing" }.Any(w => m.Contains(w, StringComparison.Ordinal)))
            return "The camera rises slowly, revealing the scene.";
        return "The camera makes one slow, gentle push in.";
    }

    private static bool MentionsCamera(string prompt) =>
        prompt.Contains("camera", StringComparison.OrdinalIgnoreCase) || prompt.Contains("pan", StringComparison.OrdinalIgnoreCase)
        || prompt.Contains("push in", StringComparison.OrdinalIgnoreCase) || prompt.Contains("zoom", StringComparison.OrdinalIgnoreCase);

    /// <summary>"(an elderly man)" for a cast member the script described, so the engine knows whose lips to move.</summary>
    private static string Describe(IReadOnlyList<StoryCastMember> cast, string speaker)
    {
        var member = cast.FirstOrDefault(c => string.Equals(c.Name, speaker, StringComparison.OrdinalIgnoreCase));
        if (member is null) return string.Empty;

        var age = member.Age switch { "child" => "young", "elder" => "elderly", "young" => "young", _ => null };
        var who = member.Gender switch
        {
            "male" => member.Age == "child" ? "boy" : "man",
            "female" => member.Age == "child" ? "girl" : "woman",
            _ => null
        };
        if (who is null) return string.Empty;
        return age is null || member.Age == "child" ? $" (the {who})" : $" (the {age} {who})";
    }

    private static bool IsNarrator(string? speaker) =>
        string.IsNullOrWhiteSpace(speaker) || string.Equals(speaker.Trim(), StoryCastMember.Narrator, StringComparison.OrdinalIgnoreCase);

    /// <summary>The words as they can sit inside quotation marks: one line, no quotation marks of their own.</summary>
    private static string Quote(string text) =>
        (Clean(text, 600) ?? string.Empty).Replace("\"", string.Empty, StringComparison.Ordinal)
            .Replace("“", string.Empty, StringComparison.Ordinal).Replace("”", string.Empty, StringComparison.Ordinal).Trim();

    private static string? Clean(string? text, int max) => AiOutputSanitizer.ToSafeLine(text, max);

    private static string Sentence(string text)
    {
        text = text.Trim();
        return text.EndsWith('.') || text.EndsWith('!') || text.EndsWith('?') ? text : text + ".";
    }
}
