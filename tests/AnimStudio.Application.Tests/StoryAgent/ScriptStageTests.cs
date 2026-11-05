using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Abstractions.StoryAgent;
using AnimStudio.Application.Ai;
using AnimStudio.Application.StoryAgent;
using AnimStudio.Application.StoryAgent.Stages;
using AnimStudio.Domain.Stories;
using Microsoft.Extensions.Logging.Abstractions;

namespace AnimStudio.Application.Tests.StoryAgent;

public sealed class ScriptStageTests
{
    private static StoryStageContext Context(StoryRun run) => new()
    {
        Run = run,
        Report = (_, _) => Task.CompletedTask,
        Save = () => Task.CompletedTask
    };

    private static (ScriptStage Stage, FakeAi Ai, FakePrompts Prompts) Make()
    {
        var ai = new FakeAi();
        var prompts = new FakePrompts();
        return (new ScriptStage(ai, prompts, new StoryClock(new DateTimeOffset(StorySamples.Now)), NullLogger<ScriptStage>.Instance), ai, prompts);
    }

    private static StoryRun AutoRun(StoryWriterMode writer = StoryWriterMode.Auto)
    {
        var run = StoryTestData.Run(StoryRunStatus.WritingScript);
        run.Research = StorySamples.Research();
        run.Brief.Writer = writer;
        return run;
    }

    [Fact]
    public async Task A_built_in_pack_becomes_a_checked_script_without_asking_any_model()
    {
        var (stage, ai, _) = Make();
        var run = AutoRun(StoryWriterMode.BuiltIn);
        run.Brief.PackId = "diwali";

        var outcome = await stage.RunAsync(Context(run), CancellationToken.None);

        Assert.Equal(StoryStageResult.Completed, outcome.Result);
        Assert.Equal(19, run.Script!.Scenes.Count);
        Assert.Equal("built-in pack: diwali", run.Script.WrittenBy);
        Assert.Empty(ai.TextCalls);
        Assert.DoesNotContain(run.ScriptWarnings, w => w.Contains("not a text the catalogue knows", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task An_unknown_built_in_pack_stops_the_run_with_a_clear_code()
    {
        var (stage, _, _) = Make();
        var run = AutoRun(StoryWriterMode.BuiltIn);
        run.Brief.PackId = "no-such-pack";

        var error = await Assert.ThrowsAsync<StoryStageException>(() => stage.RunAsync(Context(run), CancellationToken.None));

        Assert.Equal("pack-not-found", error.Code);
    }

    [Fact]
    public async Task The_manual_writer_waits_for_a_paste_and_asks_no_model()
    {
        var (stage, ai, prompts) = Make();
        var run = AutoRun(StoryWriterMode.Manual);

        var outcome = await stage.RunAsync(Context(run), CancellationToken.None);

        Assert.Equal(StoryStageResult.Paused, outcome.Result);
        Assert.Equal(StoryRunStatus.AwaitingScript, outcome.NextStatus);
        Assert.Contains("paste", outcome.Message, StringComparison.OrdinalIgnoreCase);
        Assert.Empty(ai.TextCalls);
        Assert.Empty(prompts.Rendered);
        Assert.Empty(run.Warnings);
        Assert.Null(run.Script);
    }

    [Fact]
    public async Task With_no_text_model_turned_on_the_run_falls_back_to_waiting_for_a_paste_with_the_reason_beside_it()
    {
        var (stage, _, _) = Make();
        var run = AutoRun();

        var outcome = await stage.RunAsync(Context(run), CancellationToken.None);

        Assert.Equal(StoryStageResult.Paused, outcome.Result);
        Assert.Equal(StoryRunStatus.AwaitingScript, outcome.NextStatus);
        Assert.Contains(run.Warnings, w => w.Contains("No text model is turned on", StringComparison.Ordinal));
    }

    [Fact]
    public async Task A_models_reply_is_read_by_the_same_parser_and_credited_to_the_provider_that_wrote_it()
    {
        var (stage, ai, prompts) = Make();
        ai.Text = _ => FakeAi.TextOk(StorySamples.ReplyJson, "gemini");
        var run = AutoRun();

        var outcome = await stage.RunAsync(Context(run), CancellationToken.None);

        Assert.Equal(StoryStageResult.Completed, outcome.Result);
        Assert.Equal("gemini", run.Script!.WrittenBy);
        Assert.True(run.Script.Scenes.Count >= 2);

        Assert.Equal(StoryScriptPrompt.Variables(run.Brief, run.Research).Keys.Order(), prompts.Rendered[0].Variables.Keys.Order());
        Assert.Equal(BuiltInPrompts.StoryScript, prompts.Rendered[0].Key);

        var request = Assert.Single(ai.TextCalls);
        Assert.Equal("SYSTEM RULES", request.SystemPrompt);
        Assert.StartsWith("WRITE:", request.Prompt);
        Assert.Null(request.JsonSchema);
        Assert.Equal(BuiltInPrompts.StoryScript, request.PromptTemplateKey);
        Assert.InRange(request.MaxOutputTokens, 6_000, 16_000);
        Assert.False(request.BypassCache);
        Assert.Null(request.Seed);
        Assert.Equal(run.UserId, ai.Contexts[0].UserId);
    }

    [Fact]
    public async Task A_reply_that_cannot_be_read_is_asked_for_once_more_with_the_problem_named_and_without_the_cache()
    {
        var (stage, ai, _) = Make();
        var calls = 0;
        ai.Text = _ => ++calls == 1 ? FakeAi.TextOk("Sure! Here is a lovely story about Diwali.") : FakeAi.TextOk(StorySamples.ReplyJson);
        var run = AutoRun();

        var outcome = await stage.RunAsync(Context(run), CancellationToken.None);

        Assert.Equal(StoryStageResult.Completed, outcome.Result);
        Assert.Equal(2, ai.TextCalls.Count);
        Assert.False(ai.TextCalls[0].BypassCache);
        Assert.True(ai.TextCalls[1].BypassCache);
        Assert.Contains("could not be used", ai.TextCalls[1].Prompt, StringComparison.Ordinal);
        Assert.Contains("JSON", ai.TextCalls[1].Prompt, StringComparison.Ordinal);
        Assert.NotNull(run.Script);
    }

    [Fact]
    public async Task A_model_that_keeps_answering_with_something_unreadable_hands_the_run_to_the_person()
    {
        var (stage, ai, _) = Make();
        ai.Text = _ => FakeAi.TextOk("I cannot write that.");
        var run = AutoRun();

        var outcome = await stage.RunAsync(Context(run), CancellationToken.None);

        Assert.Equal(StoryStageResult.Paused, outcome.Result);
        Assert.Equal(2, ai.TextCalls.Count);
        Assert.Null(run.Script);
        Assert.Contains(run.Warnings, w => w.Contains("could not be read as a script", StringComparison.Ordinal));
    }

    [Fact]
    public async Task A_model_that_fails_hands_the_run_to_the_person_with_its_safe_message()
    {
        var (stage, ai, _) = Make();
        ai.Text = _ => AiOutcome<AiTextResult>.Failed("rate-limited", "The text model is busy.");
        var run = AutoRun();

        var outcome = await stage.RunAsync(Context(run), CancellationToken.None);

        Assert.Equal(StoryStageResult.Paused, outcome.Result);
        Assert.Single(ai.TextCalls);
        Assert.Contains("The text model is busy. (rate-limited)", run.Warnings);
    }

    [Fact]
    public async Task A_script_that_already_exists_is_not_written_again()
    {
        var (stage, ai, prompts) = Make();
        var run = StoryTestData.Run(StoryRunStatus.WritingScript, withScript: true);
        var before = run.Script;

        var outcome = await stage.RunAsync(Context(run), CancellationToken.None);

        Assert.Equal(StoryStageResult.Completed, outcome.Result);
        Assert.Same(before, run.Script);
        Assert.Empty(ai.TextCalls);
        Assert.Empty(prompts.Rendered);
    }

    [Fact]
    public async Task A_rewrite_bypasses_the_cache_and_changes_the_seed_so_it_is_not_answered_with_the_script_it_replaces()
    {
        var (stage, ai, _) = Make();
        ai.Text = _ => FakeAi.TextOk(StorySamples.ReplyJson);
        var run = AutoRun();
        run.ScriptRevision = 2;

        await stage.RunAsync(Context(run), CancellationToken.None);

        var request = Assert.Single(ai.TextCalls);
        Assert.True(request.BypassCache);
        Assert.Equal(2, request.Seed);
    }

    [Fact]
    public async Task A_prompt_that_cannot_be_prepared_fails_the_stage_with_a_pointer_to_the_template()
    {
        var (stage, _, prompts) = Make();
        prompts.Throws = new PromptTemplateException("template-invalid", "bad slot");
        var run = AutoRun();

        var error = await Assert.ThrowsAsync<StoryStageException>(() => stage.RunAsync(Context(run), CancellationToken.None));

        Assert.Equal("script-prompt-invalid", error.Code);
        Assert.DoesNotContain("bad slot", error.Message);
    }
}
