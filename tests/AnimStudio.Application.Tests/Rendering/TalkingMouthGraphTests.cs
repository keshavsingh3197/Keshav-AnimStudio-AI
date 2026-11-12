using AnimStudio.Application.Abstractions.Rendering;
using AnimStudio.Application.Rendering;
using AnimStudio.Application.Rendering.Models;
using AnimStudio.Domain.Rendering;
using AnimStudio.Domain.Scenes;
using AnimStudio.Infrastructure.Ffmpeg.Graph;

namespace AnimStudio.Application.Tests.Rendering;

/// <summary>
/// Characters painted into a still talk only with the still's own open-mouth version, blended in around each mouth while
/// that character speaks; without one the picture is left exactly as drawn.
/// </summary>
public class TalkingMouthGraphTests
{
    private static MouthPlan Mouth(double x, double y, params (double Start, double End)[] speaking) => new()
    {
        X = x,
        Y = y,
        FaceWidth = 0.16,
        SpeakingWindows = [.. speaking.Select(w => FrameRange.FromSeconds(w.Start, w.End, FrameRate.Fps30))]
    };

    private static SceneRenderPlan Plan(params MouthPlan[] mouths) => Plan(null, mouths);

    private static SceneRenderPlan Plan(TalkingBackgroundPlan? talking, params MouthPlan[] mouths) => new()
    {
        SceneIndex = 0,
        SceneId = "scene-1",
        Canvas = Canvas.Vertical1080x1920,
        Duration = new FrameCount(90),
        BackgroundRelativePath = "in/bg.png",
        BackgroundAnimation = new AnimationSettings(BackgroundEffect.ZoomIn),
        Mouths = mouths,
        TalkingBackground = talking,
        OutputRelativePath = "scenes/scene_001.mp4"
    };

    [Fact]
    public void Without_an_open_mouth_picture_baked_in_mouths_are_not_masked_or_deformed()
    {
        var result = new FfmpegFilterGraphBuilder(new FakeCapabilities())
            .BuildScene(Plan(Mouth(0.45, 0.41, (0, 1.5))));

        Assert.DoesNotContain("geq", result.FilterComplex);
        Assert.DoesNotContain("overlay=", result.FilterComplex);
        Assert.Contains("[0:v]scale=", result.FilterComplex);
        Assert.Empty(result.Warnings);
    }

    [Fact]
    public void Each_mouth_eases_in_the_open_mouth_artwork_before_the_camera_move()
    {
        var talking = new TalkingBackgroundPlan("in/bg-talk.png", 1000, 2000, 1000, 2000);
        var result = new FfmpegFilterGraphBuilder(new FakeCapabilities())
            .BuildScene(Plan(talking, Mouth(0.45, 0.41, (0, 1.5)), Mouth(0.7, 0.45, (1.5, 3))));
        var graph = result.FilterComplex;

        // The open still is one frame, scaled to the picture's own size, and never stretched.
        var open = Assert.Single(result.Inputs, i => i.RelativePath == "in/bg-talk.png");
        Assert.DoesNotContain("-loop", open.PreInputArguments);
        Assert.Contains("[1:v]setsar=1,format=rgba,split=2[to0][to1]", graph);
        Assert.DoesNotContain("eval=frame", graph[..graph.IndexOf("[talk]", StringComparison.Ordinal)]);

        // A 0.16 face on a 1000px picture: a 106x67 patch from under the nose to the chin.
        Assert.Contains("[to0]crop=106:67:397:802,scale=106:67:flags=bicubic,", graph);
        Assert.Contains("[tm0][tq0_0]overlay=x=397:y=802:format=rgb", graph);
        Assert.Contains("colorchannelmixer=aa=0.45", graph);
        Assert.Contains("[tq1_2]overlay=", graph);
        Assert.True(graph.IndexOf("[talk]", StringComparison.Ordinal) < graph.IndexOf("zoompan", StringComparison.Ordinal));

        // Only while that character speaks, easing in and out at each end.
        Assert.Contains("min(t-0\\,1.5-t)", graph);
        Assert.Contains("min(t-1.5\\,3-t)", graph);
        Assert.Empty(result.Warnings);
    }

    [Fact]
    public void Without_geq_the_still_renders_and_says_why_nobody_talks()
    {
        var result = new FfmpegFilterGraphBuilder(new FakeCapabilities(RenderFeature.TalkingMouths))
            .BuildScene(Plan(new TalkingBackgroundPlan("in/bg-talk.png", 1000, 2000, 1000, 2000), Mouth(0.5, 0.4, (0, 1))));

        Assert.DoesNotContain("geq", result.FilterComplex);
        Assert.Contains("TALKING_MOUTHS_UNAVAILABLE", result.Warnings);
    }

    [Fact]
    public void A_still_without_mouths_is_drawn_as_before()
    {
        var graph = new FfmpegFilterGraphBuilder(new FakeCapabilities()).BuildScene(Plan()).FilterComplex;

        Assert.DoesNotContain("geq", graph);
        Assert.Contains("[0:v]scale=", graph);
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

    [Fact]
    public void A_reframed_open_mouth_picture_is_cut_where_its_mouth_is_and_scaled_to_the_face()
    {
        // As Gemini sends it back: half the size, and the face moved and drawn larger.
        var talking = new TalkingBackgroundPlan("in/bg-talk.png", 1000, 2000, 500, 900);
        var mouth = Mouth(0.45, 0.41, (0, 1.5)) with { OpenX = 0.5, OpenY = 0.45, OpenFaceWidth = 0.2 };

        var graph = new FfmpegFilterGraphBuilder(new FakeCapabilities()).BuildScene(Plan(talking, mouth)).FilterComplex;

        // In the 500px open picture the 0.2 face is 100px: a 66x42 patch round (250, 405+10), laid over the 106x67 one.
        Assert.Contains("[to0]crop=66:42:217:394,scale=106:67:flags=bicubic,", graph);
        Assert.Contains("overlay=x=397:y=802:", graph);
    }

    [Fact]
    public void The_place_in_the_open_mouth_picture_reads_back_from_the_mouths_cell()
    {
        var rate = FrameRate.Fps30;
        var mouths = AnimStudio.Application.Workbooks.MouthCell.Parse("Pappu: 0.77 0.5 0.2 > 0.82 0.47 0.24 @ 6.2-8.8; Masterji: 0.46 0.41 0.19 @ 0-4", rate, out var error)!;

        Assert.Null(error);
        Assert.Equal((0.82, 0.47, 0.24), (mouths[0].OpenX!.Value, mouths[0].OpenY!.Value, mouths[0].OpenFaceWidth!.Value));
        Assert.Null(mouths[1].OpenX);
        Assert.Equal("Pappu: 0.77 0.5 0.2 > 0.82 0.47 0.24 @ 6.2-8.8; Masterji: 0.46 0.41 0.19 @ 0-4", AnimStudio.Application.Workbooks.MouthCell.Format(mouths, rate));
        Assert.Null(AnimStudio.Application.Workbooks.MouthCell.Parse("Pappu: 0.7 0.5 0.2 > 1.5 0.4 0.2 @ 0-1", rate, out error));
    }

    [Theory]
    [InlineData(false, 768, 1344, false)] // reframed and its mouth not found there: left still
    [InlineData(true, 768, 1344, true)]   // reframed but its mouth found: talks
    [InlineData(false, 768, 1376, true)]  // the same shape, only smaller: talks from the same place
    public void The_plan_uses_an_open_mouth_picture_only_where_each_mouth_can_be_lined_up(
        bool foundInOpenPicture, int openWidth, int openHeight, bool talks)
    {
        var mouth = new SceneMouth
        {
            X = 0.46, Y = 0.41, FaceWidth = 0.19,
            Windows = [new MouthWindow { StartFrame = 0, EndFrame = 30 }]
        };
        if (foundInOpenPicture) (mouth.OpenX, mouth.OpenY, mouth.OpenFaceWidth) = (0.5, 0.44, 0.22);
        var scene = new Scene
        {
            Id = "scene-1", DurationFrames = 60, BackgroundAssetId = "bg", TalkingBackgroundAssetId = "talk", Mouths = [mouth]
        };
        static Domain.Assets.Asset Image(string id, int w, int h) => new()
        {
            Id = id, Kind = Domain.Assets.AssetKind.Image, UsageScope = Domain.Assets.AssetUsageScope.SceneUse,
            Probe = new Domain.Assets.MediaProbe { Width = w, Height = h }
        };
        var context = new SceneRenderContext(
            scene, Canvas.Vertical1080x1920, new Dictionary<string, Domain.Characters.Character>(),
            new Dictionary<string, Domain.Assets.Asset> { ["bg"] = Image("bg", 1536, 2752), ["talk"] = Image("talk", openWidth, openHeight) },
            new Dictionary<string, string> { ["bg"] = "in/bg.jpg", ["talk"] = "in/talk.png" },
            null, 1, 8);

        var plan = RenderPlanFactory.Create(context, 0, "scenes/scene_001.mp4");

        Assert.Equal(talks, plan.TalkingBackground is not null);
        Assert.Equal(!talks, plan.TalkingBackgroundUnusable);
        if (talks) Assert.Equal((openWidth, openHeight), (plan.TalkingBackground!.OpenWidth, plan.TalkingBackground.OpenHeight));
    }
}
