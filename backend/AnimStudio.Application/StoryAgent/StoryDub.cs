using System.Globalization;
using System.Text;
using System.Text.Json;
using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Ai;
using AnimStudio.Domain.Stories;
using Microsoft.Extensions.Logging;

namespace AnimStudio.Application.StoryAgent;

/// <summary>
/// The story told again in its other language for YouTube's multi-language audio: Hindi for India, English for the rest
/// of the world. One video is uploaded; the dub is added to it as a second audio track and each viewer hears the language
/// their YouTube is set to, while views, likes and comments stay on the one video.
/// </summary>
/// <remarks>
/// <para>
/// The dub must run exactly as long as the video, scene by scene, so each scene is as long as the longer of its two
/// voices and both projects - the story's and the dub's - are built with the same lengths, looks and music. The dub's own
/// render then has the same timeline, and its sound is the dub track.
/// </para>
/// <para>
/// A dub is all or nothing: the dub project is built only when every scene has its dub voice.
/// </para>
/// </remarks>
public static class StoryDub
{
    /// <summary>The dub's language: English for a Hindi story, Hindi for an English one.</summary>
    public static string LanguageOf(StoryRun run) => run.Brief.Language == "en" ? "hi" : "en";

    /// <summary>What the dub says in the scene: the English meaning of a Hindi story, the Hindi of an English one.</summary>
    public static string? TextOf(StoryScene scene, string language) =>
        (language == "hi" ? scene.Hindi : scene.English) is { } text && !string.IsNullOrWhiteSpace(text) ? text.Trim() : null;

    /// <summary>True when the run asked for a dub and every scene's dub voice is still the run's own file.</summary>
    public static bool IsSpoken(StoryRun run) =>
        run.Options.Dub && run.Options.Narration != StoryNarrationMode.None
        && run.Script is { Scenes.Count: > 0 } script
        && script.Scenes.All(s => StoryObjectKeys.Owns(run.Id, s.DubAudioKey) && s.DubAudioSeconds is > 0);

    /// <summary>The longer of the scene's two voices, so neither is ever cut off; null when it has no voice.</summary>
    public static double? LongerVoice(double? voiceSeconds, double? dubSeconds) =>
        voiceSeconds is > 0 && dubSeconds is > 0 ? Math.Max(voiceSeconds.Value, dubSeconds.Value)
        : voiceSeconds is > 0 ? voiceSeconds : null;

    /// <summary>
    /// The script as the dub tells it, for the bundle builder: each scene's words are the dub's (they become the dub
    /// project's subtitles), with no character lines, since the dub's narrator reads them all.
    /// </summary>
    public static StoryScript ScriptFor(StoryScript script, string language) => new()
    {
        Title = language == "en" && !string.IsNullOrWhiteSpace(script.TitleEnglish) ? script.TitleEnglish! : script.Title,
        TitleEnglish = script.TitleEnglish,
        Language = language,
        Summary = script.Summary,
        MusicQuery = script.MusicQuery,
        Cast = [],
        Scenes = [.. script.Scenes.Select(s => new StoryScene
        {
            Number = s.Number,
            Headline = s.Headline,
            Narration = TextOf(s, language) ?? s.Narration,
            English = s.English,
            Basis = s.Basis,
            Mood = s.Mood,
            EstimatedSeconds = s.EstimatedSeconds,
            AudioKey = s.DubAudioKey,
            AudioSeconds = s.DubAudioSeconds,
            Pauses = [.. s.DubPauses]
        })],
        CreatedAtUtc = script.CreatedAtUtc
    };

    /// <summary>Forgets a scene's dub voice; the caller deletes the file.</summary>
    public static void Forget(StoryScene scene)
    {
        scene.DubAudioKey = null;
        scene.DubAudioSeconds = null;
        scene.DubPauses = [];
    }
}

/// <summary>
/// Puts each scene's narration into the dub's language with a text model, for scenes that do not have it yet. A Hindi
/// script usually comes with its English meaning already; an English one never has Hindi, so its dub needs this.
/// </summary>
public sealed class StoryDubTranslator(
    IAiExecutor ai,
    IPromptLibrary prompts,
    IAiProviderRegistry registry,
    ILogger<StoryDubTranslator> logger)
{
    /// <summary>Scenes sent in one request, so a long story's answer stays well inside a model's output limit.</summary>
    private const int ScenesPerRequest = 12;

    private const int MaxTextChars = 1600;

    /// <summary>Fills the dub's words of every scene that has none. Returns how many scenes are still without them.</summary>
    public async Task<int> FillAsync(StoryRun run, string language, CancellationToken ct)
    {
        var missing = run.Script!.Scenes.Where(s => StoryDub.TextOf(s, language) is null && !string.IsNullOrWhiteSpace(s.Narration)).ToList();
        foreach (var batch in missing.Chunk(ScenesPerRequest))
        {
            var answers = await TranslateAsync(run, batch, language, ct).ConfigureAwait(false);
            foreach (var scene in batch)
            {
                if (!answers.TryGetValue(scene.Number, out var text)) continue;
                if (language == "hi") scene.Hindi = text;
                else scene.English = text;
            }
        }

        return run.Script.Scenes.Count(s => StoryDub.TextOf(s, language) is null);
    }

    private async Task<Dictionary<int, string>> TranslateAsync(
        StoryRun run, IReadOnlyList<StoryScene> scenes, string language, CancellationToken ct)
    {
        var block = new StringBuilder();
        foreach (var scene in scenes)
            block.Append("Scene ").Append(scene.Number.ToString(CultureInfo.InvariantCulture)).Append(": ").Append(scene.Narration.Trim()).Append('\n');

        RenderedPrompt rendered;
        try
        {
            rendered = await prompts.RenderAsync(BuiltInPrompts.StoryDubTranslate, new Dictionary<string, string?>(StringComparer.Ordinal)
            {
                ["language"] = StoryScriptPrompt.LanguageName(language),
                ["scenes"] = block.ToString()
            }, ct).ConfigureAwait(false);
        }
        catch (PromptTemplateException ex)
        {
            logger.LogError("The {Template} prompt could not be rendered: {Code}", BuiltInPrompts.StoryDubTranslate, ex.Code);
            return [];
        }

        var engine = string.IsNullOrWhiteSpace(run.Brief.TextEngine)
            ? null
            : registry.UsableTextProviders().Select(p => p.Id.Value)
                .FirstOrDefault(id => string.Equals(id, run.Brief.TextEngine.Trim(), StringComparison.OrdinalIgnoreCase));
        var outcome = await ai.TextAsync(new AiTextRequest
        {
            SystemPrompt = rendered.SystemPrompt,
            Prompt = rendered.Body,
            JsonSchema = rendered.OutputJsonSchema,
            PromptTemplateKey = rendered.TemplateKey,
            PromptTemplateVersion = rendered.Version,
            MaxOutputTokens = 8_000,
            Temperature = 0.3,
            ProviderId = engine
        }, new AiCallContext(null, run.UserId), ct).ConfigureAwait(false);

        if (!outcome.IsSuccess)
        {
            logger.LogInformation("Story run {RunId}: no {Language} translation for the dub from a text model ({Kind}).", run.Id, language, outcome.Kind);
            return [];
        }

        return Parse(outcome.Value!.Text, scenes.Select(s => s.Number).ToHashSet());
    }

    /// <summary>The model's translations of the scenes asked for, each cleaned like any other model output.</summary>
    public static Dictionary<int, string> Parse(string? json, IReadOnlySet<int> asked)
    {
        var answers = new Dictionary<int, string>();
        try
        {
            using var doc = JsonDocument.Parse(AiJsonResponse.Unwrap(json));
            if (!doc.RootElement.TryGetProperty("scenes", out var list) || list.ValueKind != JsonValueKind.Array) return answers;

            foreach (var item in list.EnumerateArray())
            {
                if (item.ValueKind != JsonValueKind.Object
                    || !item.TryGetProperty("number", out var number) || number.ValueKind != JsonValueKind.Number || !number.TryGetInt32(out var n) || !asked.Contains(n)
                    || !item.TryGetProperty("text", out var value) || value.ValueKind != JsonValueKind.String) continue;

                if (AiOutputSanitizer.ToSafeLine(value.GetString(), MaxTextChars) is { Length: > 0 } text) answers.TryAdd(n, text);
            }
        }
        catch (JsonException)
        {
            // An answer that is not JSON translates nothing; the dub says which scenes it is missing.
        }

        return answers;
    }
}
