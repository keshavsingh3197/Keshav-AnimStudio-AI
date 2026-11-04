using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Abstractions.StoryAgent;
using AnimStudio.Application.Ai;
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
    ILogger<ScriptStage> logger) : IStoryStage
{
    private const int Attempts = 2;

    public string Id => StoryStageIds.Script;

    public async Task<StoryStageOutcome> RunAsync(StoryStageContext context, CancellationToken ct)
    {
        var run = context.Run;
        if (run.Script is not null) return StoryStageOutcome.Completed("The script is already written.");

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

    private async Task<StoryStageOutcome> WriteWithModelAsync(StoryStageContext context, CancellationToken ct)
    {
        var run = context.Run;

        RenderedPrompt rendered;
        try
        {
            rendered = await prompts.RenderAsync(BuiltInPrompts.StoryScript, StoryScriptPrompt.Variables(run.Brief, run.Research), ct)
                .ConfigureAwait(false);
        }
        catch (PromptTemplateException ex)
        {
            logger.LogError("The story-script prompt could not be rendered: {Code}", ex.Code);
            throw new StoryStageException("script-prompt-invalid", "The script prompt could not be prepared. If the story-script prompt template has been overridden, check it.");
        }

        string? problem = null;
        for (var attempt = 1; attempt <= Attempts; attempt++)
        {
            await context.Report(attempt == 1 ? 10 : 55,
                attempt == 1 ? "Asking the text model to write the script" : "The reply could not be used; asking once more")
                .ConfigureAwait(false);

            var outcome = await ai.TextAsync(Request(rendered, run, attempt, problem), new AiCallContext(null, run.UserId), ct)
                .ConfigureAwait(false);

            if (outcome.Kind == AiOutcomeKind.Unavailable)
                return Wait(run, "No text model is turned on, so the script is waiting for you.");
            if (!outcome.IsSuccess)
                return Wait(run, outcome.ErrorCode is { Length: > 0 } code
                    ? $"{outcome.Message ?? "The text model could not write the script."} ({code})"
                    : outcome.Message ?? "The text model could not write the script.");

            try
            {
                var written = StoryScriptParser.Parse(outcome.Value!.Text, run.Brief, run.Research,
                    outcome.Value.Provenance.ProviderId, clock.GetUtcNow().UtcDateTime, tolerant: true);
                Keep(run, written);
                return StoryStageOutcome.Completed($"The script was written by {outcome.Value.Provenance.ProviderId}.");
            }
            catch (StoryScriptException ex)
            {
                problem = ex.Message;
                logger.LogWarning("The text model's reply was not a usable script (attempt {Attempt}): {Code}", attempt, ex.Code);
            }
        }

        return Wait(run, $"The text model's reply could not be read as a script ({problem})");
    }

    private static AiTextRequest Request(RenderedPrompt rendered, StoryRun run, int attempt, string? problem)
    {
        var scenes = StoryScriptPrompt.SceneCount(run.Brief.TargetSeconds);
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
            Seed = run.ScriptRevision > 0 ? run.ScriptRevision : null
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
