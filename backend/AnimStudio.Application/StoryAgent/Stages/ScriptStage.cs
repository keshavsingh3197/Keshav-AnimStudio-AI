using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Abstractions.StoryAgent;
using AnimStudio.Application.Ai;
using AnimStudio.Domain.Rendering;
using AnimStudio.Domain.Stories;
using Microsoft.Extensions.Logging;

namespace AnimStudio.Application.StoryAgent.Stages;

/// <summary>
/// Gets a script: from a built-in pack, from the text model the app is set up with, or - when there is no model, or it
/// cannot be reached - by stopping and asking the person to paste one from any chat they like.
/// </summary>
/// <remarks>
/// Falling back to a person is deliberate. "No text model" is the normal state of this app, so it is a step in the
/// flow, not an error: the prompt is ready, and the reply is read by the same parser and checked against the same texts.
/// </remarks>
public sealed class ScriptStage(
    IAiExecutor ai,
    IPromptLibrary prompts,
    TimeProvider clock,
    ILogger<ScriptStage> logger,
    IEffectClipRepository? effects = null,
    IAiSettingsRepository? aiSettings = null) : IStoryStage
{
    private const int Attempts = 2;

    public string Id => StoryStageIds.Script;

    public async Task<StoryStageOutcome> RunAsync(StoryStageContext context, CancellationToken ct)
    {
        var run = context.Run;
        if (run.Script is not null) return StoryStageOutcome.Completed("The script is already written.");
        if (run.ImportedScript is not null) return await ReadImportedAsync(run, ct).ConfigureAwait(false);

        return run.Brief.Writer switch
        {
            StoryWriterMode.BuiltIn => ReadPack(run),
            StoryWriterMode.Manual => Wait(run, null),
            _ => await WriteWithModelAsync(context, ct).ConfigureAwait(false)
        };
    }

    private StoryStageOutcome ReadPack(StoryRun run)
    {
        var pack = StoryPacks.Find(run.Brief.PackId)
            ?? throw new StoryStageException("pack-not-found", "That built-in story is not available. Pick another, or write the story from your own title.");

        try
        {
            var result = StoryPacks.Read(pack, run.Brief, run.Research, clock.GetUtcNow().UtcDateTime);
            Keep(run, result);
            return StoryStageOutcome.Completed($"Loaded the built-in script: {pack.TitleEnglish}.");
        }
        catch (StoryScriptException ex)
        {
            logger.LogError("The built-in pack {Pack} could not be read: {Code}", pack.Id, ex.Code);
            throw new StoryStageException("pack-invalid", "That built-in story could not be read. Please report this.");
        }
    }

    /// <summary>
    /// The script an imported story file brought, read like a pasted reply - so its citations are checked against this
    /// run's research. A file that cannot be read leaves the story waiting for a script, with the reason beside it.
    /// </summary>
    private async Task<StoryStageOutcome> ReadImportedAsync(StoryRun run, CancellationToken ct)
    {
        var imported = run.ImportedScript;
        run.ImportedScript = null;
        try
        {
            var result = StoryScriptParser.Parse(imported, run.Brief, run.Research, "imported story file",
                clock.GetUtcNow().UtcDateTime, tolerant: true);
            var (channel, memes, isComedy) = await ComedyCraftGuide.LoadContextAsync(run, effects, aiSettings, ct).ConfigureAwait(false);
            if (isComedy)
            {
                ComedyCraftGuide.AutoAssignMidAndEndMemes(
                    result.Script, memes, run.Brief.AutoInsertMemes, ComedyCraftGuide.EffectiveToneForRun(run, channel));
            }
            Keep(run, result);
            return StoryStageOutcome.Completed("The script was read from the imported story file.");
        }
        catch (StoryScriptException ex)
        {
            logger.LogWarning("The imported script of story run {RunId} could not be read: {Code}", run.Id, ex.Code);
            return Wait(run, $"The script in the imported file could not be read ({ex.Message})");
        }
    }

    private async Task<StoryStageOutcome> WriteWithModelAsync(StoryStageContext context, CancellationToken ct)
    {
        var run = context.Run;

        var (channel, memes, isComedy) = await ComedyCraftGuide.LoadContextAsync(run, effects, aiSettings, ct).ConfigureAwait(false);
        var (templateKey, variables) = StoryScriptPrompt.For(run, memes, channel);
        var targetScenes = StoryScriptPrompt.SceneCount(run.Brief.TargetSeconds);

        if (targetScenes <= 26)
        {
            return await WriteSinglePassAsync(context, run, templateKey, variables, channel, memes, isComedy, ct).ConfigureAwait(false);
        }

        // Long-form episodes (10m-60m) exceed single-completion token budgets cleanly if requested in one JSON payload,
        // so split sequentially into ~22-scene cohesive Acts passing cast, storyline summary, and cliffhanger context forward.
        const int ScenesPerAct = 22;
        var totalActs = Math.Clamp((int)Math.Ceiling(targetScenes / (double)ScenesPerAct), 2, 8);
        var remainingScenes = targetScenes;
        var baseNotes = variables.TryGetValue("notes", out var n) ? n : "(none)";

        StoryScript? master = null;
        var allWarnings = new List<string>();
        var providersUsed = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        for (var act = 1; act <= totalActs && remainingScenes > 0; act++)
        {
            ct.ThrowIfCancellationRequested();
            var actScenes = Math.Min(ScenesPerAct, remainingScenes);
            remainingScenes -= actScenes;
            var pct = (int)Math.Clamp((act - 1) * 95.0 / totalActs, 5, 92);
            await context.Report(pct, $"Writing Act {act} of {totalActs} ({actScenes} scenes for long episode)")
                .ConfigureAwait(false);

            var actDuration = (int)Math.Max(60, Math.Round(run.Brief.TargetSeconds * (actScenes / (double)targetScenes)));
            var actVars = new Dictionary<string, string?>(variables, StringComparer.Ordinal)
            {
                ["sceneCount"] = actScenes.ToString(System.Globalization.CultureInfo.InvariantCulture),
                ["notes"] = BuildActNotes(baseNotes, act, totalActs, master, actDuration, actScenes)
            };

            RenderedPrompt rendered;
            try
            {
                rendered = await prompts.RenderAsync(templateKey, actVars, ct).ConfigureAwait(false);
            }
            catch (PromptTemplateException ex)
            {
                logger.LogError("The {Template} prompt could not be rendered: {Code}", templateKey, ex.Code);
                throw new StoryStageException("script-prompt-invalid", $"The script prompt could not be prepared. If the {templateKey} prompt template has been overridden, check it.");
            }

            var actBrief = new StoryBrief
            {
                Title = run.Brief.Title,
                Language = run.Brief.Language,
                TargetSeconds = actDuration,
                Format = run.Brief.Format,
                Writer = run.Brief.Writer,
                Voicing = run.Brief.Voicing,
                GenreId = run.Brief.GenreId,
                TextEngine = run.Brief.TextEngine,
                Notes = run.Brief.Notes,
                ComedyStyle = run.Brief.ComedyStyle,
                AutoInsertMemes = run.Brief.AutoInsertMemes,
                BrandChannelId = run.Brief.BrandChannelId
            };

            var (actResult, providerId, unavailableReason, failProblem) = await RequestActWithRetryAsync(
                rendered, run, actBrief, actScenes, attemptOverride: act, ct).ConfigureAwait(false);

            if (actResult is null)
            {
                if (master is null)
                {
                    return unavailableReason is not null
                        ? Wait(run, unavailableReason)
                        : Wait(run, $"The text model's reply could not be read as a script ({failProblem})");
                }
                allWarnings.Add($"Stopped long-episode expansion after Act {act - 1} ({failProblem ?? unavailableReason}); keeping {master.Scenes.Count} scenes already written.");
                break;
            }

            if (!string.IsNullOrWhiteSpace(providerId)) providersUsed.Add(providerId);
            if (master is null)
            {
                master = actResult.Script;
            }
            else
            {
                AppendActScript(master, actResult.Script);
            }
            allWarnings.AddRange(actResult.Warnings
                .Where(w => !w.Contains("against a target of", StringComparison.OrdinalIgnoreCase)));
        }

        if (master is null || master.Scenes.Count < StoryScriptParser.MinScenes)
            return Wait(run, "No scenes were generated for the long script.");

        for (var i = 0; i < master.Scenes.Count; i++)
            master.Scenes[i].Number = i + 1;

        var totalSeconds = (int)Math.Round(master.Scenes.Sum(s => Math.Max(4.0, s.EstimatedSeconds)));
        if (Math.Abs(totalSeconds - run.Brief.TargetSeconds) > run.Brief.TargetSeconds * 0.25)
            allWarnings.Add($"The combined long-episode script runs about {totalSeconds} seconds ({totalSeconds / 60}m {totalSeconds % 60:D2}s) against a target of {run.Brief.TargetSeconds} seconds.");

        if (isComedy)
        {
            ComedyCraftGuide.AutoAssignMidAndEndMemes(
                master, memes, run.Brief.AutoInsertMemes, ComedyCraftGuide.EffectiveToneForRun(run, channel));
        }

        Keep(run, new StoryScriptResult(master, [.. allWarnings.Distinct().Take(30)]));
        var by = providersUsed.Count > 0 ? string.Join(", ", providersUsed) : "AI";
        return StoryStageOutcome.Completed($"Long multi-act script ({master.Scenes.Count} scenes) written by {by}.");
    }

    private async Task<StoryStageOutcome> WriteSinglePassAsync(
        StoryStageContext context,
        StoryRun run,
        string templateKey,
        IReadOnlyDictionary<string, string?> variables,
        BrandChannel? channel,
        IReadOnlyList<Domain.Effects.EffectClip> memes,
        bool isComedy,
        CancellationToken ct)
    {
        RenderedPrompt rendered;
        try
        {
            rendered = await prompts.RenderAsync(templateKey, variables, ct).ConfigureAwait(false);
        }
        catch (PromptTemplateException ex)
        {
            logger.LogError("The {Template} prompt could not be rendered: {Code}", templateKey, ex.Code);
            throw new StoryStageException("script-prompt-invalid", $"The script prompt could not be prepared. If the {templateKey} prompt template has been overridden, check it.");
        }

        var (parsed, providerId, unavailableReason, problem) = await RequestActWithRetryAsync(
            rendered, run, run.Brief, StoryScriptPrompt.SceneCount(run.Brief.TargetSeconds), attemptOverride: 0, ct, context).ConfigureAwait(false);

        if (unavailableReason is not null)
            return Wait(run, unavailableReason);
        if (parsed is null)
            return Wait(run, $"The text model's reply could not be read as a script ({problem})");

        if (isComedy)
        {
            ComedyCraftGuide.AutoAssignMidAndEndMemes(
                parsed.Script, memes, run.Brief.AutoInsertMemes, ComedyCraftGuide.EffectiveToneForRun(run, channel));
        }
        Keep(run, parsed);
        return StoryStageOutcome.Completed($"The script was written by {providerId}.");
    }

    private async Task<(StoryScriptResult? Result, string? ProviderId, string? UnavailableReason, string? Problem)> RequestActWithRetryAsync(
        RenderedPrompt rendered,
        StoryRun run,
        StoryBrief briefForParse,
        int actScenes,
        int attemptOverride,
        CancellationToken ct,
        StoryStageContext? context = null)
    {
        string? problem = null;
        for (var attempt = 1; attempt <= Attempts; attempt++)
        {
            if (context is not null)
            {
                await context.Report(attempt == 1 ? 10 : 55,
                    attempt == 1 ? "Asking the text model to write the script" : "The reply could not be used; asking once more")
                    .ConfigureAwait(false);
            }

            var req = Request(rendered, run, actScenes, attempt + attemptOverride * 2, problem);
            var outcome = await ai.TextAsync(req, new AiCallContext(null, run.UserId), ct).ConfigureAwait(false);

            if (outcome.Kind == AiOutcomeKind.Unavailable)
            {
                var reason = run.Brief.TextEngine is { } engine
                    ? $"The AI engine picked for this story ({engine}) isn't available just now, so the script is waiting for you. Rewrite it with another engine, or paste one."
                    : "No text model is turned on, so the script is waiting for you.";
                return (null, null, reason, null);
            }

            if (!outcome.IsSuccess)
            {
                var reason = outcome.ErrorCode is { Length: > 0 } code
                    ? $"{outcome.Message ?? "The text model could not write the script."} ({code})"
                    : outcome.Message ?? "The text model could not write the script.";
                return (null, null, reason, null);
            }

            try
            {
                var written = StoryScriptParser.Parse(outcome.Value!.Text, briefForParse, run.Research,
                    outcome.Value.Provenance.ProviderId, clock.GetUtcNow().UtcDateTime, tolerant: true);
                return (written, outcome.Value.Provenance.ProviderId, null, null);
            }
            catch (StoryScriptException ex)
            {
                problem = ex.Message;
                logger.LogWarning("The text model's reply was not a usable script (attempt {Attempt}): {Code}", attempt, ex.Code);
            }
        }

        return (null, null, null, problem);
    }

    private static string BuildActNotes(string? baseNotes, int act, int totalActs, StoryScript? soFar, int actDuration, int actScenes)
    {
        var secPerScene = Math.Clamp((int)Math.Round(actDuration / (double)Math.Max(1, actScenes)), 12, 32);
        var wordsPerScene = Math.Clamp((int)Math.Round(secPerScene * 2.5), 25, 85);
        var sb = new System.Text.StringBuilder();
        sb.Append($"LONG EPISODE EXPANSION — ACT {act} of {totalActs}. ");
        sb.Append($"PACING TARGET: Fill ~{actDuration} seconds across {actScenes} scenes (~{secPerScene}s and {wordsPerScene}-{wordsPerScene + 15} spoken words of rich narration/dialogue per scene). ");
        if (act == 1)
        {
            sb.Append($"Write the opening scenes with rich character depth and vivid setting transitions. Leave room for Acts 2..{totalActs}.");
        }
        else if (soFar is not null)
        {
            var castNames = string.Join(", ", soFar.Cast.Select(c => c.Name));
            if (!string.IsNullOrWhiteSpace(castNames))
                sb.Append($"Keep existing cast names exactly consistent: {castNames}. ");
            var tailScenes = soFar.Scenes.TakeLast(2)
                .Select(s => $"Scene {s.Number} ({s.Headline}): {s.Narration}");
            sb.Append("Continue directly after: ").Append(string.Join(" | ", tailScenes));
            if (act == totalActs)
                sb.Append(" — Deliver the rewarding finale/payoff ending of the complete story.");
            else
                sb.Append(" — Escalate the conflict / deepen the episode smoothly into the next Act.");
        }
        if (!string.IsNullOrWhiteSpace(baseNotes) && baseNotes != "(none)")
            sb.Append("\nCreator notes: ").Append(baseNotes);
        return sb.ToString();
    }

    private static void AppendActScript(StoryScript master, StoryScript nextAct)
    {
        var existingCast = master.Cast.Select(c => c.Name).ToHashSet(StringComparer.OrdinalIgnoreCase);
        foreach (var member in nextAct.Cast)
        {
            if (master.Cast.Count >= StoryScriptParser.MaxCast) break;
            if (existingCast.Add(member.Name))
                master.Cast.Add(member);
        }

        var currentChars = master.Scenes.Sum(s => s.Narration.Length);
        foreach (var scene in nextAct.Scenes)
        {
            if (master.Scenes.Count >= StoryScriptParser.MaxScenes) break;
            if (currentChars + scene.Narration.Length > StoryScriptParser.MaxTotalNarrationChars) break;
            master.Scenes.Add(scene);
            currentChars += scene.Narration.Length;
        }
    }

    private static AiTextRequest Request(RenderedPrompt rendered, StoryRun run, int scenes, int attempt, string? problem)
    {
        var body = attempt == 1 || problem is null
            ? rendered.Body
            : $"{rendered.Body}\n\nYour previous reply could not be used: {problem}\nReply again with ONE JSON object only, in the shape described.";

        return new AiTextRequest
        {
            SystemPrompt = rendered.SystemPrompt,
            Prompt = body,
            // No JsonSchema: the provider's strict check would throw away a whole script over one
            // long citation or a null list. The tolerant parser judges it, and a reply it cannot
            // use is asked for again with the reason.
            PromptTemplateKey = rendered.TemplateKey,
            PromptTemplateVersion = rendered.Version,
            MaxOutputTokens = Math.Clamp(scenes * 900, 6_000, 16_000),
            Temperature = 0.7,

            // A rewrite, or a second try, must not be answered with the reply it is replacing.
            BypassCache = attempt > 1 || run.ScriptRevision > 0,
            Seed = run.ScriptRevision > 0 ? (attempt > 1 ? run.ScriptRevision + attempt - 1 : run.ScriptRevision) : null,
            ProviderId = run.Brief.TextEngine
        };
    }

    /// <summary>Stops and asks the person for the script. The reason, when there is one, is a warning beside it.</summary>
    private static StoryStageOutcome Wait(StoryRun run, string? reason)
    {
        if (reason is not null) StoryRunWarnings.Add(run, reason);
        return StoryStageOutcome.Paused(StoryRunStatus.AwaitingScript,
            "Waiting for the script: copy the prompt, paste it into any chat, and paste the reply back.");
    }

    private static void Keep(StoryRun run, StoryScriptResult result)
    {
        run.Script = result.Script;
        run.ScriptWarnings = [.. result.Warnings];
    }
}
