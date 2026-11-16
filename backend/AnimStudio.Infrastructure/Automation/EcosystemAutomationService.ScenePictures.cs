using System.Text;
using AnimStudio.Application.Automation;
using AnimStudio.Application.Rendering;
using AnimStudio.Domain.Automation;

namespace AnimStudio.Infrastructure.Automation;

/// <summary>One scene that gets its own picture: number, where and when, and the prompt to make it.</summary>
public sealed record AutomationScenePicture(int Number, string Setting, string TimeOfDay, string? Mood, string Prompt);

/// <summary>
/// The pictures an Enhanced 3D script needs, in the order the renderer uses them (picture n = scene n), plus one
/// numbered prompt that asks an outside image tool for the whole set at once.
/// </summary>
public sealed record AutomationScenePicturePlan(
    int Width,
    int Height,
    string AspectRatio,
    IReadOnlyList<AutomationScenePicture> Scenes,
    string BatchPrompt,
    string NegativePrompt);

public sealed record AutomationScenePicturePlanRequest(string? Script, AutomationStageSettings? Stage);

public sealed partial class EcosystemAutomationService
{
    /// <summary>Largest script read for a plan; a pasted reply is far smaller.</summary>
    private const int MaxScenePlanScriptChars = 60_000;

    private const string ScenePictureNegativePrompt =
        "people, person, faces, characters, hands, text, letters, captions, watermark, logo, cartoon, blurry, distorted";

    /// <summary>
    /// Plans the scene pictures for a script (the pasted reply, or the post's own script when none is given). Uses the
    /// renderer's own parser, so the numbering always matches how the video assigns pictures. Nothing is saved.
    /// </summary>
    public async Task<AutomationScenePicturePlan> GetScenePicturePlanAsync(
        string userId, string postId, AutomationScenePicturePlanRequest? request, CancellationToken ct)
    {
        var post = await LoadOwnedPostAsync(userId, postId, ct).ConfigureAwait(false);
        var raw = request?.Script;
        if (raw is { Length: > MaxScenePlanScriptChars }) raw = raw[..MaxScenePlanScriptChars];

        // The pasted reply goes through the same cleaning as when it is submitted.
        var script = string.IsNullOrWhiteSpace(raw) ? post.Script : CleanPastedDialogue(raw) ?? raw;
        var stage = DraftOrSavedStage(post, request?.Stage);
        return BuildScenePicturePlan(post, AutomationStageScript.WithLocation(script, stage?.LocationPrompt));
    }

    internal static AutomationScenePicturePlan BuildScenePicturePlan(AutomationPost post, string? script)
    {
        var (width, height, ratio) = post.Format switch
        {
            AutomationVideoFormat.Wide => (1920, 1080, "16:9"),
            AutomationVideoFormat.CommunityPost => (1080, 1080, "1:1"),
            _ => (1080, 1920, "9:16")
        };

        var plan = DialogueScriptParser.ParsePlan(
            post.Title, script, post.AiVideoPrompt, 60, enableDialogue: true,
            post.SpeakerAName, post.SpeakerBName, post.SourceType.ToString());
        var directed = plan.Scenes ?? [];

        var scenes = new List<AutomationScenePicture>();
        foreach (var cue in plan.SceneCueOrder.Take(DialogueScriptParser.MaxScenes))
        {
            var (setting, time) = SceneDirectives.FromCue(cue);
            var directive = SceneDirectives.SceneNumber(cue) is { } n && n <= directed.Count ? directed[n - 1] : null;
            scenes.Add(new AutomationScenePicture(
                scenes.Count + 1,
                setting.ToString(),
                time.ToString(),
                directive?.Mood,
                BuildSceneImagePrompt(directive, setting, time)));
        }

        return new AutomationScenePicturePlan(width, height, ratio, scenes,
            BuildBatchPicturePrompt(scenes, width, height, ratio), ScenePictureNegativePrompt);
    }

    /// <summary>
    /// One prompt for the whole set, for tools that make several pictures in a row (Gemini, ChatGPT...). It asks for
    /// the exact order and a consistent look, so the pictures can be uploaded straight back in that order.
    /// </summary>
    internal static string BuildBatchPicturePrompt(IReadOnlyList<AutomationScenePicture> scenes, int width, int height, string ratio)
    {
        if (scenes.Count == 0) return string.Empty;
        var orientation = ratio switch
        {
            "16:9" => "wide landscape",
            "1:1" => "square",
            _ => "tall vertical"
        };
        var sb = new StringBuilder();
        sb.AppendLine($"Create {scenes.Count} separate images, one for each numbered prompt below, in exactly this order (1 to {scenes.Count}).");
        sb.AppendLine($"Every image: {orientation} {ratio} frame ({width}x{height}), photorealistic cinematic background plate, the same art style, colour grade and lighting quality across the whole set.");
        sb.AppendLine("Empty scenes only: no people, no faces, no hands, no text, no letters, no watermark. Animated characters are added on top later, so keep open ground in the lower middle of the frame.");
        sb.AppendLine("Label each image with its number so the order is kept. Make one image per prompt; do not merge prompts into one picture.");
        sb.AppendLine();
        foreach (var scene in scenes)
            sb.AppendLine($"{scene.Number}. {scene.Prompt}");
        return sb.ToString().TrimEnd();
    }
}
