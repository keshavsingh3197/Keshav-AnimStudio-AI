using AnimStudio.Application.StoryAgent;
using AnimStudio.Domain.Stories;

namespace AnimStudio.Application.Tests.StoryAgent;

/// <summary>The speed a story's video plays at, and its subtitles and chapters following it.</summary>
public sealed class StoryVideoSpeedTests
{
    /// <summary>A finished run built at its own pace: each scene ten seconds after the one before.</summary>
    private static StoryRun Built()
    {
        var run = StoryTestData.Run(StoryRunStatus.Completed, "user-1", withScript: true);
        run.Brief.Language = "hi";
        run.ProjectId = "p1";
        run.RenderJobId = "job-1";
        run.SceneStarts = [.. run.Script!.Scenes.Select((_, i) => i * 10.0)];
        run.TotalSeconds = run.Script.Scenes.Count * 10.0;
        foreach (var scene in run.Script.Scenes) scene.EstimatedSeconds = 10.45;
        return run;
    }

    [Theory]
    [InlineData(1.25, 1.25)]
    [InlineData(1.33, 1.35)]
    [InlineData(5.0, 2.0)]
    [InlineData(0.1, 0.5)]
    [InlineData(double.NaN, 1.0)]
    public void A_speed_is_kept_in_range_to_the_nearest_twentieth(double given, double stored) =>
        Assert.Equal(stored, StoryVideoSpeed.Normalize(given), 6);

    [Fact]
    public void Speeding_up_moves_the_scenes_earlier_and_shortens_the_video()
    {
        var run = Built();

        StoryVideoSpeed.Retime(run, 1.25);

        Assert.Equal(1.25, run.TimingSpeed);
        Assert.Equal(8.0, run.SceneStarts[1], 3);
        Assert.Equal(run.Script!.Scenes.Count * 8.0, run.TotalSeconds, 3);
    }

    [Fact]
    public void Changing_speed_again_starts_from_the_build_not_from_the_last_speed()
    {
        var run = Built();
        var original = run.TotalSeconds;

        StoryVideoSpeed.Retime(run, 1.5);
        StoryVideoSpeed.Retime(run, 2.0);
        Assert.Equal(original / 2, run.TotalSeconds, 3);

        StoryVideoSpeed.Retime(run, 1.0);
        Assert.Equal(original, run.TotalSeconds, 3);
        Assert.Equal(10.0, run.SceneStarts[1], 3);
    }

    [Fact]
    public void Subtitles_follow_the_faster_video_and_stay_inside_their_scenes()
    {
        var normal = StoryCaptions.Build(Built(), "hi");
        var run = Built();
        StoryVideoSpeed.Retime(run, 2.0);

        var fast = StoryCaptions.Build(run, "hi");

        Assert.Equal(normal.Count, fast.Count);
        for (var i = 0; i < fast.Count; i++)
        {
            Assert.Equal(normal[i].Start / 2, fast[i].Start, 2);
            Assert.True(fast[i].End <= run.TotalSeconds + 0.001);
        }

        for (var i = 1; i < fast.Count; i++) Assert.True(fast[i].Start >= fast[i - 1].End, $"cue {i} overlaps the one before");
    }
}
