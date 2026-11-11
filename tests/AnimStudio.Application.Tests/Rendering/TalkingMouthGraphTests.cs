using AnimStudio.Application.Abstractions.Rendering;
using AnimStudio.Application.Rendering;
using AnimStudio.Application.Rendering.Models;
using AnimStudio.Domain.Rendering;
using AnimStudio.Domain.Scenes;
using AnimStudio.Infrastructure.Ffmpeg.Graph;

namespace AnimStudio.Application.Tests.Rendering;

/// <summary>Characters painted into a still talk: the jaw below each mouth moves while that character speaks.</summary>
public class TalkingMouthGraphTests
{
    private static MouthPlan Mouth(double x, double y, params (double Start, double End)[] speaking) => new()
    {
        X = x,
        Y = y,
        FaceWidth = 0.16,
        SpeakingWindows = [.. speaking.Select(w => FrameRange.FromSeconds(w.Start, w.End, FrameRate.Fps30))]
    };

    private static SceneRenderPlan Plan(params MouthPlan[] mouths) => new()
    {
        SceneIndex = 0,
        SceneId = "scene-1",
        Canvas = Canvas.Vertical1080x1920,
        Duration = new FrameCount(90),
        BackgroundRelativePath = "in/bg.png",
        BackgroundAnimation = new AnimationSettings(BackgroundEffect.ZoomIn),
        Mouths = mouths,
        OutputRelativePath = "scenes/scene_001.mp4"
    };

    [Fact]
    public void Each_mouth_moves_its_jaw_before_the_camera_move()
    {
        var graph = new FfmpegFilterGraphBuilder(new FakeCapabilities())
            .BuildScene(Plan(Mouth(0.45, 0.41, (0, 1.5)), Mouth(0.7, 0.45, (1.5, 3)))).FilterComplex;

        Assert.Contains("[0:v]format=rgba,split=3[tm0][tp0][tp1]", graph);
        Assert.Contains("[tm1][tq1]overlay=", graph);
        Assert.Contains("[talk]scale=", graph);
        Assert.True(graph.IndexOf("[talk]", StringComparison.Ordinal) < graph.IndexOf("zoompan", StringComparison.Ordinal));
        // Only while that character speaks.
        Assert.Contains("between(t\\,0\\,1.5)", graph);
        Assert.Contains("between(t\\,1.5\\,3)", graph);
    }

    [Fact]
    public void A_still_without_mouths_is_drawn_as_before()
    {
        var graph = new FfmpegFilterGraphBuilder(new FakeCapabilities()).BuildScene(Plan()).FilterComplex;

        Assert.DoesNotContain("geq", graph);
        Assert.Contains("[0:v]scale=", graph);
    }

    [Fact]
    public void Without_geq_the_still_renders_and_says_why_nobody_talks()
    {
        var result = new FfmpegFilterGraphBuilder(new FakeCapabilities(RenderFeature.TalkingMouths))
            .BuildScene(Plan(Mouth(0.5, 0.4, (0, 1))));

        Assert.DoesNotContain("geq", result.FilterComplex);
        Assert.Contains("TALKING_MOUTHS_UNAVAILABLE", result.Warnings);
    }

    [Fact]
    public void Mouths_that_never_speak_or_sit_outside_the_picture_are_held_in()
    {
        var scene = new Scene
        {
            DurationFrames = 60,
            Mouths =
            [
                new SceneMouth { X = 0.5, Y = 0.4, FaceWidth = 0.2 },
                new SceneMouth
                {
                    X = 4, Y = -1, FaceWidth = 9,
                    Windows = [new MouthWindow { StartFrame = 30, EndFrame = 500 }]
                }
            ]
        };

        var mouth = Assert.Single(RenderPlanFactory.Mouths(scene));
        Assert.Equal((1.0, 0.0, RenderPlanFactory.MaxFaceWidth), (mouth.X, mouth.Y, mouth.FaceWidth));
        Assert.Equal(new FrameRange(new FrameCount(30), new FrameCount(60)), Assert.Single(mouth.SpeakingWindows));
    }
}
