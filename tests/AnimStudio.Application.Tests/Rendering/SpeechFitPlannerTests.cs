using AnimStudio.Application.Rendering;
using Xunit;

namespace AnimStudio.Application.Tests.Rendering;

public sealed class SpeechFitPlannerTests
{
    private const double Lead = 0.35, Pause = 0.25, Tail = 0.85, MaxTempo = 1.25;

    private static double SpokenLength(IReadOnlyList<double> clips, SpeechFit fit) =>
        (Lead + fit.KeptIndices.Sum(i => clips[i]) + Pause * Math.Max(0, fit.KeptIndices.Count - 1)) / fit.Tempo;

    [Fact]
    public void No_cap_keeps_every_line_at_normal_speed()
    {
        var clips = Enumerable.Repeat(10.0, 30).ToList();
        var fit = SpeechFitPlanner.Plan(clips, null, Lead, Pause, Tail, MaxTempo);
        Assert.Equal(30, fit.KeptIndices.Count);
        Assert.Equal(1.0, fit.Tempo);
    }

    [Fact]
    public void Narration_already_inside_the_cap_is_unchanged()
    {
        var clips = Enumerable.Repeat(8.0, 15).ToList(); // ~124s
        var fit = SpeechFitPlanner.Plan(clips, 180, Lead, Pause, Tail, MaxTempo);
        Assert.Equal(15, fit.KeptIndices.Count);
        Assert.Equal(1.0, fit.Tempo);
    }

    [Fact]
    public void Slightly_long_narration_is_sped_up_without_dropping_lines()
    {
        var clips = Enumerable.Repeat(10.0, 20).ToList(); // ~205s
        var fit = SpeechFitPlanner.Plan(clips, 180, Lead, Pause, Tail, MaxTempo);
        Assert.Equal(20, fit.KeptIndices.Count);
        Assert.InRange(fit.Tempo, 1.01, MaxTempo);
        Assert.True(SpokenLength(clips, fit) + Tail <= 180.01);
    }

    [Fact]
    public void A_274s_narration_fits_a_Short_and_keeps_the_opening_and_the_moral()
    {
        var clips = Enumerable.Range(0, 26).Select(i => 10.0 + (i % 3)).ToList(); // ~286s spoken
        var fit = SpeechFitPlanner.Plan(clips, 180, Lead, Pause, Tail, MaxTempo);

        Assert.True(SpokenLength(clips, fit) + Tail <= 180.01, $"spoken {SpokenLength(clips, fit):0.0}s");
        Assert.True(fit.Tempo <= MaxTempo);
        Assert.Equal(0, fit.KeptIndices[0]);
        Assert.Equal(25, fit.KeptIndices[^1]);
        Assert.Equal(fit.KeptIndices.OrderBy(i => i), fit.KeptIndices);
    }

    [Fact]
    public void Without_a_speed_up_lines_alone_bring_it_under_the_cap()
    {
        var clips = Enumerable.Repeat(12.0, 25).ToList();
        var fit = SpeechFitPlanner.Plan(clips, 180, Lead, Pause, Tail, maxTempo: 1.0);
        Assert.Equal(1.0, fit.Tempo);
        Assert.True(SpokenLength(clips, fit) + Tail <= 180.01);
    }
}
