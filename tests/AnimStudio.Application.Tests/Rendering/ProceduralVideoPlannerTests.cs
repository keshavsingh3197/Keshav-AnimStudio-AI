using AnimStudio.Application.Rendering;

namespace AnimStudio.Application.Tests.Rendering;

public sealed class ProceduralVideoPlannerTests
{
    [Theory]
    [InlineData("vertical", "720p", 720, 1280, "vertical")]
    [InlineData("vertical", "1080p", 1080, 1920, "vertical")]
    [InlineData("landscape", "720p", 1280, 720, "landscape")]
    [InlineData("wide", "1080p", 1920, 1080, "landscape")]
    [InlineData("square", "720p", 720, 720, "square")]
    [InlineData(null, null, 720, 1280, "vertical")]
    public void ResolveDimensions_picks_expected_canvas(string? format, string? res, int expectedW, int expectedH, string expectedNorm)
    {
        var (w, h, norm) = ProceduralVideoPlanner.ResolveDimensions(format, res);
        Assert.Equal(expectedW, w);
        Assert.Equal(expectedH, h);
        Assert.Equal(expectedNorm, norm);
    }

    [Fact]
    public void InferTheme_selects_matching_procedural_worlds_from_bilingual_prompts()
    {
        Assert.Equal(
            ProceduralSceneTheme.CosmosSacred3D,
            ProceduralVideoPlanner.InferTheme(ProceduralSceneTheme.Auto, "आज का शुभ पंचांग", "tithi and nakshatra", null));

        Assert.Equal(
            ProceduralSceneTheme.HistoryChronicle3D,
            ProceduralVideoPlanner.InferTheme(ProceduralSceneTheme.Auto, "Aaj Ka Itihaas", "historical event", null));

        Assert.Equal(
            ProceduralSceneTheme.NeonCyberGrid3D,
            ProceduralVideoPlanner.InferTheme(ProceduralSceneTheme.Auto, "Pratiyogita Quiz", "coding algorithm", null));

        Assert.Equal(
            ProceduralSceneTheme.SereneNatureGlow,
            ProceduralVideoPlanner.InferTheme(ProceduralSceneTheme.Auto, "Shanti Morning", "peaceful river nature", null));

        Assert.Equal(
            ProceduralSceneTheme.VedicTempleSunrise3D,
            ProceduralVideoPlanner.InferTheme(ProceduralSceneTheme.Auto, "Mahadev Katha", "temple bells aarti", null));
    }

    [Fact]
    public void InferTheme_respects_explicit_theme_override()
    {
        var chosen = ProceduralVideoPlanner.InferTheme(
            ProceduralSceneTheme.HistoryChronicle3D, "Panchang", "nakshatra", null);
        Assert.Equal(ProceduralSceneTheme.HistoryChronicle3D, chosen);
    }

    [Fact]
    public void BuildCaptionBeats_strips_bracket_markers_and_urls_while_preserving_devanagari()
    {
        var script = """
            [HOOK 0-4s] हर हर महादेव! आज का पंचांग देखें।
            [CORE 4-20s] शुभ अभिजीत मुहूर्त दोपहर १२ बजे से प्रारंभ होगा।
            https://panchang.keshavsingh.in/
            """;

        var beats = ProceduralVideoPlanner.BuildCaptionBeats("आज का पंचांग", script, null, 18);

        Assert.True(beats.Count >= 2);
        Assert.True(beats[0].IsTitleHook);
        Assert.Equal("आज का पंचांग", beats[0].Text);
        Assert.DoesNotContain(beats, b => b.Text.Contains("[HOOK", StringComparison.Ordinal));
        Assert.DoesNotContain(beats, b => b.Text.Contains("https://", StringComparison.Ordinal));
        Assert.Contains(beats, b => b.Text.Contains("अभिजीत मुहूर्त", StringComparison.Ordinal));
    }
}
