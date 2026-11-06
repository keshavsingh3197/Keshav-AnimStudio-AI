using System.Buffers.Binary;
using System.Text;
using AnimStudio.Application.Abstractions.StoryAgent;
using AnimStudio.Application.StoryAgent;
using AnimStudio.Application.StoryAgent.Stages;
using AnimStudio.Application.Tests.Ai;
using AnimStudio.Application.Workbooks;
using AnimStudio.Domain.Stories;
using Microsoft.Extensions.Logging.Abstractions;

namespace AnimStudio.Application.Tests.StoryAgent;

/// <summary>A scene told over several pictures, and the picture the video is found by on YouTube.</summary>
public sealed class StoryShotsAndThumbnailTests
{
    private static readonly byte[] Jpeg = [0xFF, 0xD8, 0xFF, 0xE0, 0, 16, 0x4A, 0x46, 0x49, 0x46];

    [Fact]
    public void A_reply_gives_each_scene_its_further_pictures_and_the_story_a_thumbnail()
    {
        const string json = """
            { "thumbnailPrompt": "Krishna lifting the hill, close and bright",
              "scenes": [
              { "narration": "एक।", "imagePrompt": "A lamp at dusk", "moreImagePrompts": ["A face lit by it", "", "The village around it", "4", "5", "6", "7"] },
              { "narration": "दो।", "imagePrompts": ["The river", "A boat on it"] },
              { "narration": "तीन।" } ] }
            """;

        var script = StoryScriptParser.Parse(json, StorySamples.Brief(), null, "x", StorySamples.Now, false).Script;

        Assert.Equal("Krishna lifting the hill, close and bright", script.ThumbnailPrompt);
        Assert.Equal(["A face lit by it", "The village around it", "4", "5", "6"], script.Scenes[0].Shots.Select(s => s.ImagePrompt));
        Assert.Equal("The river", script.Scenes[1].ImagePrompt);
        Assert.Equal("A boat on it", Assert.Single(script.Scenes[1].Shots).ImagePrompt);
        Assert.Empty(script.Scenes[2].Shots);
    }

    [Fact]
    public void A_stretch_of_a_wav_is_cut_on_whole_frames_with_its_own_header()
    {
        var wav = FakeFinisher.Wav(2.0);

        var middle = StoryWav.Slice(wav, 0.5, 1.5)!;
        var tail = StoryWav.Slice(wav, 1.0, null)!;

        Assert.Equal(16_000, BinaryPrimitives.ReadInt32LittleEndian(middle.AsSpan(40)));
        Assert.Equal(44 + 16_000, middle.Length);
        Assert.Equal(8000, BinaryPrimitives.ReadInt32LittleEndian(middle.AsSpan(24)));
        Assert.Equal(16_000, BinaryPrimitives.ReadInt32LittleEndian(tail.AsSpan(40)));
        Assert.Null(StoryWav.Slice(Encoding.ASCII.GetBytes("not a wav at all, not at all"), 0, 1));
    }

    private static List<StoryBundleScene> Media(StoryScript script) =>
        [.. script.Scenes.Select(s => new StoryBundleScene(
            s.Number, Jpeg, "image/jpeg", "Generated", FakeFinisher.Wav(8.0 + s.Number), "Narration",
            8.0 + s.Number, [new StoryPause { Start = 0, End = 0.4 }, new StoryPause { Start = 4.0, End = 4.5 }]))];

    [Fact]
    public void A_scene_with_three_pictures_becomes_three_project_scenes_in_the_time_it_had()
    {
        var script = StorySamples.Script();
        var plain = Media(script);
        var media = Media(script);
        media[2] = media[2] with { Shots = [new(Jpeg, "image/jpeg", "Second"), new(Jpeg, "image/jpeg", "Third")] };

        var before = StoryBundleBuilder.Build(script, StorySamples.Brief(), new StoryBuildOptions(), "Story", plain, null);
        var after = StoryBundleBuilder.Build(script, StorySamples.Brief(), new StoryBuildOptions(), "Story", media, null);
        var data = WorkbookReader.Read(after.Bundle.Workbook);

        Assert.Empty(data.Errors);
        Assert.Empty(after.Warnings);
        Assert.Equal(script.Scenes.Count + 2, data.Scenes.Count);
        Assert.Equal(script.Scenes.Count + 2, after.ProjectScenes);
        // The script's scenes start where they did, and the video is as long: the pictures share the scene's time.
        Assert.Equal(before.SceneStarts, after.SceneStarts);
        Assert.Equal(before.TotalSeconds, after.TotalSeconds);

        // Scene 3 (11 s) is project scenes 3, 4 and 5: its pictures in order, the first cut on the pause at four seconds.
        Assert.Equal(["media/img-s03.jpg", "media/img-s03-2.jpg", "media/img-s03-3.jpg"],
            data.Scenes.Skip(2).Take(3).Select(s => s.Text("Background")));
        var first = data.Scenes[2].Number("DurationSeconds")!.Value - data.Scenes[2].Number("TransitionSeconds")!.Value;
        Assert.InRange(first, 4.2, 4.3);
        Assert.NotEqual(data.Scenes[2].Text("Effect"), data.Scenes[3].Text("Effect"));

        // Each picture carries its stretch of the narration on through the cut, so the voice is whole across it.
        Assert.Equal(["media/narration-s03.wav", "media/narration-s03-2.wav", "media/narration-s03-3.wav"],
            data.Scenes.Skip(2).Take(3).Select(s => s.Text("Audio")));
        for (var p = 0; p < 3; p++)
        {
            var row = data.Scenes[2 + p];
            var audio = after.Bundle.Media[row.Text("Audio")!].Content;
            var seconds = BinaryPrimitives.ReadInt32LittleEndian(audio.AsSpan(40)) / 16_000.0;
            Assert.Equal(row.Number("DurationSeconds")!.Value, seconds, 1);
        }

        // Every subtitle is under the picture it is spoken over, timed from that picture's start.
        Assert.All(data.Dialogue, line => Assert.InRange(line.Integer("SceneNumber")!.Value, 1, data.Scenes.Count));
        Assert.All(data.Dialogue.Where(l => l.Integer("SceneNumber") is >= 3 and <= 5), line =>
        {
            var scene = data.Scenes[line.Integer("SceneNumber")!.Value - 1];
            Assert.InRange(line.Number("EndSeconds")!.Value, 0, scene.Number("DurationSeconds")!.Value + 0.01);
        });
    }

    [Fact]
    public void A_scene_too_short_for_its_pictures_shows_the_first_and_says_so()
    {
        var script = StorySamples.Script();
        var media = Media(script);
        media[0] = media[0] with
        {
            DurationSeconds = 3.0,
            Audio = FakeFinisher.Wav(3.0),
            Shots = [new(Jpeg, "image/jpeg", "Second"), new(Jpeg, "image/jpeg", "Third")]
        };

        var output = StoryBundleBuilder.Build(script, StorySamples.Brief(), new StoryBuildOptions(), "Story", media, null);

        Assert.Equal(script.Scenes.Count, output.ProjectScenes);
        Assert.Contains(output.Warnings, w => w.Contains("too short", StringComparison.Ordinal));
    }

    [Fact]
    public void A_scene_that_plays_a_clip_keeps_to_the_clip()
    {
        var script = StorySamples.Script();
        var media = Media(script);
        media[1] = media[1] with
        {
            Video = Encoding.ASCII.GetBytes("\0\0\0\u0018ftypmp42"),
            Shots = [new(Jpeg, "image/jpeg", "Second")]
        };

        var output = StoryBundleBuilder.Build(script, StorySamples.Brief(), new StoryBuildOptions(), "Story", media, null);

        Assert.Equal(script.Scenes.Count, output.ProjectScenes);
        Assert.DoesNotContain(output.Bundle.Media.Keys, k => k.StartsWith("media/img-s02-", StringComparison.Ordinal));
    }

    [Fact]
    public async Task The_image_engine_draws_the_further_pictures_and_a_wide_thumbnail()
    {
        var ai = new FakeAi { Image = _ => FakeAi.ImageOk(StoryTestData.Png(), "pollinations") };
        var store = new InMemoryObjectStore();
        var stage = new VisualsStage(ai, store, NullLogger<VisualsStage>.Instance);
        var run = StoryTestData.Run(StoryRunStatus.Building, withScript: true);
        run.Brief.Format = StoryFormat.Vertical;
        foreach (var scene in run.Script!.Scenes) scene.ImagePrompt ??= $"A lamp for scene {scene.Number}";
        run.Script.Scenes[0].Shots = [new StoryShot { ImagePrompt = "A face in its light" }, new StoryShot()];
        run.Script.ThumbnailPrompt = "The lamp, close and bright";

        var outcome = await stage.RunAsync(new StoryStageContext
        {
            Run = run,
            Report = (_, _) => Task.CompletedTask,
            Save = () => Task.CompletedTask
        }, CancellationToken.None);

        var shots = run.Script.Scenes[0].Shots;
        Assert.Equal("pollinations", shots[0].ImageSource);
        Assert.True(StoryObjectKeys.Owns(run.Id, shots[0].ImageKey));
        // A shot with nothing to draw from is left without a picture, never given a plain one.
        Assert.Null(shots[1].ImageKey);
        Assert.True(StoryObjectKeys.Owns(run.Id, run.Script.ThumbnailKey));
        var thumbnail = ai.ImageCalls.Single(c => c.Prompt.StartsWith("The lamp, close and bright", StringComparison.Ordinal));
        Assert.True(thumbnail.Width > thumbnail.Height);
        Assert.Contains("thumbnail", outcome.Message);
        Assert.Contains(shots[0].ImageKey, StoryObjectKeys.All(run));
        Assert.Contains(run.Script.ThumbnailKey, StoryObjectKeys.All(run));
    }
}
