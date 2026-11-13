using System.Text;
using AnimStudio.Application.StoryAgent;
using AnimStudio.Application.Workbooks;
using AnimStudio.Domain.Assets;
using AnimStudio.Domain.Rendering;
using AnimStudio.Domain.Stories;

namespace AnimStudio.Application.Tests.StoryAgent;

public class StoryTemplateStagingTests
{
    private const string StagedJson = """
        {
          "cast": [
            { "name": "Golu", "gender": "male", "age": "child", "look": "chubby boy in a yellow t-shirt" },
            { "name": "Dadi", "gender": "female", "age": "elder", "look": "grandmother with round glasses" }
          ],
          "scenes": [
            {
              "narration": "Where is my laddoo? It is in your pocket.",
              "lines": [
                { "speaker": "Golu", "text": "Where is my laddoo?", "emotion": "confused" },
                { "speaker": "Dadi", "text": "It is in your pocket.", "emotion": "laughing" }
              ],
              "background": "A sunny village kitchen with brass pots",
              "characters": ["Golu", "Dadi"],
              "action": "Golu searches the shelves while Dadi points at his pocket",
              "camera": "push in",
              "cameraSpeed": "fast",
              "transition": "whip",
              "funnyEnding": { "meme": "Bruh", "memeId": "abc123", "caption": "Classic Golu", "seconds": 9 }
            },
            {
              "narration": "Oh no!",
              "lines": [ { "speaker": "Golu", "text": "Oh no!", "emotion": "surprised" } ],
              "imagePrompt": "Golu blushing",
              "funnyEnding": "Laugh track"
            }
          ]
        }
        """;

    private static StoryScript Staged() =>
        StoryScriptParser.Parse(StagedJson, Creative(), null, "chatgpt", StorySamples.Now, tolerant: true).Script;

    private static StoryBrief Creative() => new() { Title = "Laddoo", Language = "en", Mode = StoryGenreMode.Creative, Voicing = StoryVoicing.CharactersOnly };

    [Fact]
    public void A_staged_scene_keeps_its_background_characters_action_and_funny_ending()
    {
        var scene = Staged().Scenes[0];

        Assert.Equal("A sunny village kitchen with brass pots", scene.Background);
        Assert.Equal(["Golu", "Dadi"], scene.OnScreen);
        Assert.Equal("Golu searches the shelves while Dadi points at his pocket", scene.Action);
        Assert.NotNull(scene.Meme);
        Assert.Equal("Bruh", scene.Meme!.Name);
        Assert.Equal("abc123", scene.Meme.EffectId);
        Assert.Equal("Classic Golu", scene.Meme.Caption);
        Assert.Equal(StoryMemeBeat.MaxSeconds, scene.Meme.Seconds);
        Assert.Equal("Laugh track", Staged().Scenes[1].Meme!.Name);
    }

    [Fact]
    public void The_camera_and_cut_a_template_names_are_pinned_so_a_new_look_keeps_them()
    {
        var scene = Staged().Scenes[0];

        Assert.True(scene.LookPinned);
        Assert.Equal(nameof(BackgroundEffect.ZoomIn), scene.Effect);
        Assert.Equal(0.2, scene.EffectIntensity);
        Assert.Equal(nameof(SceneTransition.SlideLeft), scene.Transition);

        var looks = StoryLook.Plan(Staged().Scenes, [5, 5], StoryFormat.Vertical, StoryLookStyle.Lively, take: 3);
        Assert.Equal(BackgroundEffect.ZoomIn, looks[0].Effect);
        Assert.Equal(SceneTransition.SlideLeft, looks[0].Transition);
        Assert.False(Staged().Scenes[1].LookPinned);
    }

    [Fact]
    public void A_staged_scene_without_a_picture_prompt_gets_one_with_its_characters_looks()
    {
        var scenes = Staged().Scenes;

        Assert.Contains("village kitchen", scenes[0].ImagePrompt);
        Assert.Contains("Golu (chubby boy in a yellow t-shirt)", scenes[0].ImagePrompt);
        Assert.Contains("Dadi (grandmother with round glasses)", scenes[0].ImagePrompt);
        Assert.Contains("points at his pocket", scenes[0].ImagePrompt);
        Assert.Equal("Golu blushing", scenes[1].ImagePrompt);
    }

    [Theory]
    [InlineData("zoom out", BackgroundEffect.ZoomOut)]
    [InlineData("Pan_Left", BackgroundEffect.PanLeft)]
    [InlineData("tilt up", BackgroundEffect.PanUp)]
    [InlineData("static", BackgroundEffect.None)]
    [InlineData("spin wildly", null)]
    public void Camera_names_people_write_map_to_the_renderers_moves(string name, BackgroundEffect? expected) =>
        Assert.Equal(expected, StoryStaging.Camera(name));

    [Theory]
    [InlineData("fadeBlack", SceneTransition.FadeBlack)]
    [InlineData("circle-open", SceneTransition.CircleOpen)]
    [InlineData("hard cut", SceneTransition.None)]
    [InlineData("teleport", null)]
    public void Transition_names_map_to_the_renderers_cuts(string name, SceneTransition? expected) =>
        Assert.Equal(expected, StoryStaging.Transition(name));

    [Fact]
    public void A_meme_id_that_is_not_a_plain_id_is_ignored_and_the_name_is_used()
    {
        const string json = """
            { "scenes": [
              { "narration": "One.", "funnyEnding": { "meme": "Bruh", "memeId": "../../etc/passwd" } },
              { "narration": "Two.", "funnyEnding": { "caption": "nothing to play" } } ] }
            """;

        var scenes = StoryScriptParser.Parse(json, Creative(), null, "x", StorySamples.Now, false).Script.Scenes;

        Assert.Null(scenes[0].Meme!.EffectId);
        Assert.Equal("Bruh", scenes[0].Meme!.Name);
        Assert.Null(scenes[1].Meme);
    }

    [Fact]
    public void A_scene_with_a_funny_ending_cuts_to_the_meme_which_takes_over_the_cut_into_the_next()
    {
        var script = Staged();
        var media = script.Scenes.Select(s => new StoryBundleScene(s.Number, Jpeg, "image/jpeg", "uploaded", null, null, 4, [])).ToList();
        media[0] = media[0] with { Meme = new StoryBundleMeme(Mp4, "video/mp4", IsVideo: true, HasAudio: true, Seconds: 2, "Classic Golu", "library") };
        media[1] = media[1] with { Meme = new StoryBundleMeme(Jpeg, "image/jpeg", IsVideo: false, HasAudio: false, Seconds: 1.5, null, "library") };

        var output = StoryBundleBuilder.Build(script, Creative(), new StoryBuildOptions(), "Laddoo", media, null);
        var data = WorkbookReader.Read(output.Bundle.Workbook);

        Assert.Empty(data.Errors);
        Assert.Equal(4, data.Scenes.Count);
        Assert.Equal("None", data.Scenes[0].Text("Transition"));
        Assert.Equal("media/meme-s01.mp4", data.Scenes[1].Text("Background"));
        Assert.Equal("None", data.Scenes[1].Text("Effect"));
        Assert.True(data.Scenes[1].Flag("BackgroundAudio"));
        Assert.NotEqual("None", data.Scenes[1].Text("Transition"));
        Assert.Equal(AssetKind.Video, output.Bundle.Media["media/meme-s01.mp4"].Kind);
        Assert.Contains(data.Dialogue, d => d.Text("Text") == "Classic Golu");
        // The last scene's meme ends the video cleanly.
        Assert.Equal("ZoomIn", data.Scenes[3].Text("Effect"));
        Assert.Equal("None", data.Scenes[3].Text("Transition"));
        // Chapters still start at the story's scenes, not at the memes.
        Assert.Equal(2, output.SceneStarts.Count);
        Assert.True(output.SceneStarts[1] > 4 + 2 - 0.1);
    }

    private static readonly byte[] Jpeg = [0xFF, 0xD8, 0xFF, 0xE0, 0, 16, 0x4A, 0x46, 0x49, 0x46];
    private static readonly byte[] Mp4 = Encoding.ASCII.GetBytes("\0\0\0\u0018ftypmp42");
}
