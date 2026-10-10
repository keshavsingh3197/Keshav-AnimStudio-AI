using System.Text;
using AnimStudio.Application.Publishing;
using AnimStudio.Domain.Scenes;

namespace AnimStudio.Application.Tests.Publishing;

/// <summary>All project names, scripts and model answers here are synthetic.</summary>
public class YouTubeMetadataSuggesterTests
{
    [Fact]
    public void Summary_includes_name_description_chapters_and_active_scene_lines_in_order()
    {
        var scenes = new[]
        {
            Scene(2, "Second", "Narrator", "Then it slept."),
            Scene(1, "First", "Narrator", "The badger woke up."),
            new Scene { OrderKey = 3, Status = SceneStatus.Orphaned, Dialogue = [new DialogueLine { Text = "Removed line" }] }
        };

        var summary = YouTubeMetadataSuggester.BuildSummary("Test Badger", "A synthetic short.", scenes, ["Intro", "Nap"]);

        Assert.Contains("Project name: Test Badger", summary);
        Assert.Contains("About: A synthetic short.", summary);
        Assert.Contains("Chapters: Intro; Nap", summary);
        Assert.True(summary.IndexOf("woke up", StringComparison.Ordinal) < summary.IndexOf("slept", StringComparison.Ordinal));
        Assert.DoesNotContain("Removed line", summary);
    }

    [Fact]
    public void Summary_caps_a_long_script()
    {
        var scenes = Enumerable.Range(0, 400).Select(i => Scene(i, null, null, new string('x', 100))).ToList();

        var summary = YouTubeMetadataSuggester.BuildSummary("Long", null, scenes, null);

        Assert.True(summary.Length <= YouTubeMetadataSuggester.MaxSummaryChars + 200);
    }

    [Fact]
    public void Parses_a_model_answer_and_cleans_tags()
    {
        var json = """
            {"title":"Test Badger <Wakes>","description":"Line one.\nLine two.",
             "tags":["#Wildlife","wildlife","bad,tag","say \"hi\"","Nature Comedy", 5]}
            """;

        var suggestion = YouTubeMetadataSuggester.Parse(json);

        Assert.NotNull(suggestion);
        Assert.Equal("Test Badger Wakes", suggestion!.Title);
        Assert.Equal("Line one.\nLine two.", suggestion.Description);
        Assert.Equal(["Wildlife", "Nature Comedy"], suggestion.Tags);
    }

    [Fact]
    public void Unwraps_a_fenced_answer()
    {
        var suggestion = YouTubeMetadataSuggester.Parse("```json\n{\"title\":\"Fenced\",\"description\":\"d\"}\n```");

        Assert.Equal("Fenced", suggestion?.Title);
    }

    [Theory]
    [InlineData("not json")]
    [InlineData("[]")]
    [InlineData("{\"description\":\"no title\"}")]
    [InlineData("{\"title\":\"<>\",\"description\":\"d\"}")]
    public void Rejects_an_unusable_answer(string json) => Assert.Null(YouTubeMetadataSuggester.Parse(json));

    [Fact]
    public void Description_keeps_render_details_and_footer_below_the_suggestion()
    {
        var description = YouTubeMetadataSuggester.ComposeDescription("About the video.", "Chapters\n0:00 Intro\n", "Subscribe for more.");

        Assert.Equal("About the video.\n\nChapters\n0:00 Intro\n\nSubscribe for more.", description);
    }

    [Fact]
    public void Description_drops_render_details_that_would_not_fit()
    {
        var details = new string('d', YouTubePublishValidator.MaxDescriptionBytes);

        var description = YouTubeMetadataSuggester.ComposeDescription("About the video.", details, null);

        Assert.Equal("About the video.", description);
        Assert.True(Encoding.UTF8.GetByteCount(description) <= YouTubePublishValidator.MaxDescriptionBytes);
    }

    private static Scene Scene(double order, string? title, string? speaker, string text) => new()
    {
        OrderKey = order,
        Title = title,
        Dialogue = [new DialogueLine { SpeakerLabel = speaker, Text = text }]
    };
}
