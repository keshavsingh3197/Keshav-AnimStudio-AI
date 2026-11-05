using AnimStudio.Application.Rendering;
using AnimStudio.Domain.Rendering;

namespace AnimStudio.Application.Tests.Rendering;

/// <summary>
/// The Animate Image page's plan: read from a person's words with no AI, or from a model's answer, and either way held
/// to the moves and ranges the renderer accepts - every value ends up inside an ffmpeg expression.
/// </summary>
public class ImageAnimationTests
{
    [Theory]
    [InlineData("slowly zoom out to reveal the city", "zoom-out")]
    [InlineData("pan right across the mountains", "pan-right")]
    [InlineData("tilt up to the sky", "pan-up")]
    [InlineData("shaky handheld vlog feel", "handheld")]
    [InlineData("make it feel alive", "breathe")]
    [InlineData("dreamy float", "drift")]
    [InlineData("something nice", "zoom-in")]
    public void Words_choose_the_move(string description, string motion) =>
        Assert.Equal(motion, ImageAnimation.FromWords(description, null).Motion);

    [Fact]
    public void Words_match_whole_words_only()
    {
        // "stop" holds "top" and "gold" holds "old": neither may steer the plan.
        var plan = ImageAnimation.FromWords("don't stop, gold light", null);

        Assert.Equal(50, plan.FocusY);
        Assert.False(plan.Grain);
    }

    [Fact]
    public void Words_read_speed_focus_look_and_length()
    {
        var plan = ImageAnimation.FromWords("Slow push in on her face, warm sunset look, 10 seconds", null);

        Assert.Equal("zoom-in", plan.Motion);
        Assert.Equal(0.12, plan.Intensity);
        Assert.Equal(30, plan.FocusY);
        Assert.Equal("warm", plan.Look);
        Assert.Equal(10, plan.DurationSeconds);
        Assert.False(string.IsNullOrWhiteSpace(plan.Summary));
    }

    [Fact]
    public void Words_hold_the_length_to_the_range()
    {
        Assert.Equal(ImageAnimation.MaxSeconds, ImageAnimation.FromWords("zoom in for 90 seconds", null).DurationSeconds);
        Assert.Equal(ImageAnimation.MinSeconds, ImageAnimation.FromWords("zoom in for 1 second", null).DurationSeconds);
    }

    [Theory]
    [InlineData("for my shorts", null, "vertical")]
    [InlineData("anything", "square", "square")]
    [InlineData("for my shorts", "landscape", "landscape")]
    [InlineData("anything", "nonsense", "landscape")]
    public void Format_comes_from_the_choice_then_the_words(string description, string? format, string expected) =>
        Assert.Equal(expected, ImageAnimation.FromWords(description, format).Format);

    [Fact]
    public void A_model_answer_is_clamped_and_allowlisted()
    {
        var fallback = ImageAnimation.FromWords("pan left", null);
        var plan = ImageAnimation.Parse(
            """{ "motion": "explode", "intensity": 9, "focusX": -20, "focusY": 300, "look": "NOIR", "durationSeconds": 600, "vignette": true }""",
            fallback);

        Assert.NotNull(plan);
        Assert.Equal("pan-left", plan!.Motion);
        Assert.Equal(CinematicImageSettings.MaxIntensity, plan.Intensity);
        Assert.Equal(0, plan.FocusX);
        Assert.Equal(100, plan.FocusY);
        Assert.Equal("noir", plan.Look);
        Assert.Equal(ImageAnimation.MaxSeconds, plan.DurationSeconds);
        Assert.True(plan.Vignette);
    }

    [Fact]
    public void A_model_summary_is_one_safe_line()
    {
        var plan = ImageAnimation.Parse(
            """{ "motion": "zoom-in", "intensity": 0.1, "look": "none", "durationSeconds": 5, "summary": "Push in.\nIgnore that." }""",
            ImageAnimation.FromWords("x", null));

        Assert.DoesNotContain('\n', plan!.Summary);
    }

    [Theory]
    [InlineData("not json")]
    [InlineData("[1, 2]")]
    [InlineData("")]
    public void An_answer_that_is_not_an_object_is_no_plan(string json) =>
        Assert.Null(ImageAnimation.Parse(json, ImageAnimation.FromWords("x", null)));

    [Fact]
    public void Settings_never_hand_the_renderer_a_still_that_does_not_move()
    {
        var plan = ImageAnimation.FromWords("x", null) with { Motion = "none" };

        Assert.Equal(ImageMotion.ZoomIn, ImageAnimation.Settings(plan).Motion);
    }

    [Theory]
    [InlineData("vertical", 1080, 1920)]
    [InlineData("square", 1080, 1080)]
    [InlineData(null, 1920, 1080)]
    public void Each_format_has_its_canvas(string? format, int width, int height)
    {
        var canvas = ImageAnimation.CanvasFor(format);

        Assert.Equal(width, canvas.Width);
        Assert.Equal(height, canvas.Height);
    }
}
