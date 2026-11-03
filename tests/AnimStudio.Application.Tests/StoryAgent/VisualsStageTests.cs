using System.Buffers.Binary;
using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Abstractions.StoryAgent;
using AnimStudio.Application.Ai;
using AnimStudio.Application.StoryAgent;
using AnimStudio.Application.StoryAgent.Stages;
using AnimStudio.Application.Tests.Ai;
using AnimStudio.Domain.Stories;
using Microsoft.Extensions.Logging.Abstractions;

namespace AnimStudio.Application.Tests.StoryAgent;

public sealed class VisualsStageTests
{
    private static StoryStageContext Context(StoryRun run) => new()
    {
        Run = run,
        Report = (_, _) => Task.CompletedTask,
        Save = () => Task.CompletedTask
    };

    private static (VisualsStage Stage, FakeAi Ai, InMemoryObjectStore Store) Make()
    {
        var ai = new FakeAi();
        var store = new InMemoryObjectStore();
        return (new VisualsStage(ai, store, NullLogger<VisualsStage>.Instance), ai, store);
    }

    /// <summary>A run with a script whose every scene can be drawn (the shared sample leaves two without a picture prompt).</summary>
    private static StoryRun BuildingRun()
    {
        var run = StoryTestData.Run(StoryRunStatus.Building, withScript: true);
        foreach (var scene in run.Script!.Scenes) scene.ImagePrompt ??= $"A glowing lamp for scene {scene.Number}";
        return run;
    }

    [Fact]
    public async Task With_no_image_engine_every_scene_gets_a_plain_background_and_the_engine_is_only_asked_once()
    {
        var (stage, ai, store) = Make();
        var run = BuildingRun();

        var outcome = await stage.RunAsync(Context(run), CancellationToken.None);

        Assert.Equal(StoryStageResult.Completed, outcome.Result);
        Assert.Single(ai.ImageCalls);
        Assert.All(run.Script!.Scenes, scene =>
        {
            Assert.Equal("placeholder", scene.ImageSource);
            Assert.True(StoryObjectKeys.Owns(run.Id, scene.ImageKey));
            Assert.EndsWith(".png", scene.ImageKey);
        });
        Assert.Equal(run.Script.Scenes.Count, store.Keys.Count);
        Assert.Contains(run.Warnings, w => w.Contains("plain background", StringComparison.Ordinal));
        Assert.Contains("plain", outcome.Message);
    }

    [Fact]
    public async Task Each_plain_background_is_a_real_png_in_the_videos_proportions()
    {
        var (stage, _, store) = Make();
        var run = BuildingRun();
        run.Brief.Format = StoryFormat.Vertical;

        await stage.RunAsync(Context(run), CancellationToken.None);

        await using var stream = await store.OpenAsync(run.Script!.Scenes[0].ImageKey!);
        using var buffer = new MemoryStream();
        await stream!.CopyToAsync(buffer);
        var png = buffer.ToArray();
        Assert.Equal("image/png", AiImageValidator.Sniff(png));
        Assert.True(BinaryPrimitives.ReadInt32BigEndian(png.AsSpan(16)) < BinaryPrimitives.ReadInt32BigEndian(png.AsSpan(20)));
    }

    [Fact]
    public async Task A_working_engine_is_asked_for_each_scene_in_the_videos_size_with_the_style_appended()
    {
        var (stage, ai, store) = Make();
        ai.Image = _ => FakeAi.ImageOk(StoryTestData.Png(), "pollinations");
        var run = BuildingRun();
        var scenes = run.Script!.Scenes;

        var outcome = await stage.RunAsync(Context(run), CancellationToken.None);

        Assert.Equal(scenes.Count, ai.ImageCalls.Count);
        Assert.All(ai.ImageCalls, call =>
        {
            Assert.Equal(1344, call.Width);
            Assert.Equal(768, call.Height);
            Assert.EndsWith(VisualsStage.DefaultStyle, call.Prompt);
        });
        Assert.StartsWith(scenes[0].ImagePrompt!.TrimEnd('.', ' '), ai.ImageCalls[0].Prompt);
        Assert.Equal(scenes.Count, ai.ImageCalls.Select(c => c.Seed).Distinct().Count());
        Assert.All(scenes, s => Assert.Equal("pollinations", s.ImageSource));
        Assert.Equal(scenes.Count, store.Keys.Count);
        Assert.Contains("generated", outcome.Message);
        Assert.DoesNotContain(run.Warnings, w => w.Contains("plain background", StringComparison.Ordinal));
    }

    [Fact]
    public async Task A_vertical_video_asks_for_a_tall_picture_and_the_persons_own_style_replaces_the_default()
    {
        var (stage, ai, _) = Make();
        ai.Image = _ => FakeAi.ImageOk(StoryTestData.Png());
        var run = BuildingRun();
        run.Brief.Format = StoryFormat.Vertical;
        run.Options.ImageStyle = "watercolour, soft pastel";

        await stage.RunAsync(Context(run), CancellationToken.None);

        Assert.All(ai.ImageCalls, call =>
        {
            Assert.Equal(768, call.Width);
            Assert.Equal(1344, call.Height);
            Assert.EndsWith("watercolour, soft pastel", call.Prompt);
            Assert.DoesNotContain("no watermark", call.Prompt);
        });
    }

    [Fact]
    public async Task The_same_run_asks_for_the_same_picture_each_time()
    {
        var (first, aiOne, _) = Make();
        var (second, aiTwo, _) = Make();
        aiOne.Image = aiTwo.Image = _ => FakeAi.ImageOk(StoryTestData.Png());
        var run = BuildingRun();
        var again = BuildingRun();
        again.Id = run.Id;

        await first.RunAsync(Context(run), CancellationToken.None);
        await second.RunAsync(Context(again), CancellationToken.None);

        Assert.Equal(aiOne.ImageCalls.Select(c => c.Seed), aiTwo.ImageCalls.Select(c => c.Seed));
    }

    [Fact]
    public async Task Pictures_the_person_attached_are_kept_and_never_replaced()
    {
        var (stage, ai, store) = Make();
        ai.Image = _ => FakeAi.ImageOk(StoryTestData.Png());
        var run = BuildingRun();
        var first = run.Script!.Scenes[0];
        first.ImageKey = StoryObjectKeys.Image(run.Id, first.Number, ".png");
        first.ImageSource = "upload";
        first.ImageName = "my-picture.png";
        await store.SaveAsync(first.ImageKey, new MemoryStream(StoryTestData.Png(9)), "image/png");

        var outcome = await stage.RunAsync(Context(run), CancellationToken.None);

        Assert.Equal("upload", first.ImageSource);
        Assert.Equal(run.Script.Scenes.Count - 1, ai.ImageCalls.Count);
        Assert.Contains("1 of yours", outcome.Message);
    }

    [Fact]
    public async Task Uploads_only_never_asks_the_engine_and_fills_the_gaps_with_plain_backgrounds()
    {
        var (stage, ai, _) = Make();
        ai.Image = _ => FakeAi.ImageOk(StoryTestData.Png());
        var run = BuildingRun();
        run.Options.Visuals = StoryVisualMode.UploadsOnly;

        await stage.RunAsync(Context(run), CancellationToken.None);

        Assert.Empty(ai.ImageCalls);
        Assert.All(run.Script!.Scenes, s => Assert.Equal("placeholder", s.ImageSource));
    }

    [Fact]
    public async Task A_retry_keeps_the_pictures_already_made_and_asks_only_for_the_missing_ones()
    {
        var (stage, ai, store) = Make();
        ai.Image = _ => FakeAi.ImageOk(StoryTestData.Png());
        var run = BuildingRun();
        await stage.RunAsync(Context(run), CancellationToken.None);
        var scenes = run.Script!.Scenes;
        var calls = ai.ImageCalls.Count;
        var kept = scenes[0].ImageKey;

        // One picture is lost; the rest stay.
        await store.DeleteAsync(scenes[1].ImageKey!);
        await stage.RunAsync(Context(run), CancellationToken.None);

        Assert.Equal(calls + 1, ai.ImageCalls.Count);
        Assert.Equal(kept, scenes[0].ImageKey);
        Assert.All(scenes, s => Assert.NotNull(s.ImageKey));
    }

    [Fact]
    public async Task A_key_in_the_document_that_is_not_this_runs_is_ignored_and_the_scene_gets_its_own_picture()
    {
        var (stage, ai, store) = Make();
        var run = BuildingRun();
        var foreign = "story-runs/sr_someoneelse/images/s01-secret.png";
        await store.SaveAsync(foreign, new MemoryStream(StoryTestData.Png()), "image/png");
        run.Script!.Scenes[0].ImageKey = foreign;
        run.Script.Scenes[0].ImageSource = "upload";

        await stage.RunAsync(Context(run), CancellationToken.None);

        Assert.NotEqual(foreign, run.Script.Scenes[0].ImageKey);
        Assert.True(StoryObjectKeys.Owns(run.Id, run.Script.Scenes[0].ImageKey));
    }

    [Fact]
    public async Task Bytes_that_are_not_a_picture_are_not_kept_and_the_scene_falls_back_to_a_plain_background()
    {
        var (stage, ai, store) = Make();
        ai.Image = _ => FakeAi.ImageOk(new byte[400]);
        var run = BuildingRun();

        await stage.RunAsync(Context(run), CancellationToken.None);

        Assert.All(run.Script!.Scenes, s => Assert.Equal("placeholder", s.ImageSource));
        Assert.Equal(run.Script.Scenes.Count, store.Keys.Count);
    }

    [Fact]
    public async Task An_engine_that_fails_three_times_running_is_given_up_on_for_the_rest_of_the_run()
    {
        var (stage, ai, _) = Make();
        ai.Image = _ => AiOutcome<AiImageResult>.Failed("transport-failed", "down");
        var run = BuildingRun();
        run.Script!.Scenes.AddRange(Enumerable.Range(10, 3).Select(i => new StoryScene { Number = i, Narration = "x", ImagePrompt = "a lamp" }));

        await stage.RunAsync(Context(run), CancellationToken.None);

        Assert.Equal(3, ai.ImageCalls.Count);
        Assert.Contains(run.Warnings, w => w.Contains("kept failing", StringComparison.Ordinal));
        Assert.All(run.Script.Scenes, s => Assert.Equal("placeholder", s.ImageSource));
    }

    [Fact]
    public async Task A_scene_with_nothing_to_draw_from_gets_a_plain_background_without_asking()
    {
        var (stage, ai, _) = Make();
        ai.Image = _ => FakeAi.ImageOk(StoryTestData.Png());
        var run = BuildingRun();
        run.Script!.Scenes[1].ImagePrompt = null;

        await stage.RunAsync(Context(run), CancellationToken.None);

        Assert.Equal("placeholder", run.Script.Scenes[1].ImageSource);
        Assert.Equal(run.Script.Scenes.Count - 1, ai.ImageCalls.Count);
    }

    [Fact]
    public async Task Without_a_script_the_stage_fails_clearly()
    {
        var (stage, _, _) = Make();
        var run = StoryTestData.Run(StoryRunStatus.Building);

        var error = await Assert.ThrowsAsync<StoryStageException>(() => stage.RunAsync(Context(run), CancellationToken.None));

        Assert.Equal("no-script", error.Code);
    }

    [Fact]
    public async Task Stopping_the_run_stops_the_pictures()
    {
        var (stage, _, _) = Make();
        var run = BuildingRun();
        using var stop = new CancellationTokenSource();
        await stop.CancelAsync();

        await Assert.ThrowsAnyAsync<OperationCanceledException>(() => stage.RunAsync(Context(run), stop.Token));
    }
}
