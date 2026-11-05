using AnimStudio.Application.StoryAgent;
using AnimStudio.Domain.Stories;

namespace AnimStudio.Application.Tests.StoryAgent;

public sealed class StoryAnimationTests
{
    [Fact]
    public void A_speaking_scene_names_the_speaker_and_quotes_their_words_and_a_silent_one_says_nobody_talks()
    {
        var run = StoryTestData.Run(StoryRunStatus.ScriptReady, withScript: true);
        var silent = run.Script!.Scenes[0];
        silent.Lines = [new StoryLine { Speaker = StoryCastMember.Narrator, Text = "Long ago, by the river." }];
        var speaking = run.Script.Scenes[2];
        speaking.Lines =
        [
            new StoryLine { Speaker = StoryCastMember.Narrator, Text = "Yamraj said," },
            new StoryLine { Speaker = "Yamraj", Text = "Whoever eats at his sister's home today need not fear an early death." }
        ];
        run.Script.Cast = [new StoryCastMember { Name = "Yamraj", Gender = "male", Age = "elder" }];

        var spoken = StoryAnimation.Prompt(run, speaking);

        Assert.Contains("Yamraj (the elderly man) speaks", spoken);
        Assert.Contains("an early death", spoken);
        Assert.Contains("lips", spoken);
        Assert.DoesNotContain("<<<", spoken);
        Assert.True(StoryAnimation.HasSpeech(speaking));
        Assert.Contains("Nobody talks", StoryAnimation.Prompt(run, silent));
        Assert.False(StoryAnimation.HasSpeech(silent));
    }

    [Fact]
    public void A_chosen_art_style_replaces_the_genres_picture_style_but_keeps_what_the_person_typed()
    {
        var run = StoryTestData.Run();
        run.Genre = new StoryGenre { ImageStyle = "devotional painting" };
        run.Options.ArtStyle = StoryArtStyle.Cartoon;
        run.Options.ImageStyle = "devotional painting";
        Assert.Equal(StoryAnimation.ImageStyleOf(StoryArtStyle.Cartoon), StoryAnimation.PictureStyle(run, "fallback"));

        run.Options.ImageStyle = "night sky";
        Assert.EndsWith(", night sky", StoryAnimation.PictureStyle(run, "fallback"));

        run.Options.ArtStyle = StoryArtStyle.Auto;
        Assert.Equal("night sky", StoryAnimation.PictureStyle(run, "fallback"));
    }
}
