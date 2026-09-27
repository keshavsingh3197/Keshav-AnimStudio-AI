using AnimStudio.Application.Abstractions.Rendering;
using AnimStudio.Application.Rendering;
using AnimStudio.Application.Rendering.Models;
using AnimStudio.Domain.Rendering;
using AnimStudio.Infrastructure.Ffmpeg.Graph;

namespace AnimStudio.Application.Tests.Rendering;

/// <summary>
/// Tests verifying that transitions do not steal visible duration from clips,
/// whether paying for the transition overlap via spare media or via freeze-frame padding.
/// </summary>
public class TransitionDurationTests
{
    private static FfmpegFilterGraphBuilder NewBuilder(params RenderFeature[] unsupported) =>
        new(new FakeCapabilities(unsupported));

    [Fact]
    public void Duration_is_preserved_when_transitions_borrow_from_spare_media()
    {
        // Two clips, each having an intended duration of 10.0s (300 frames at 30fps).
        // A 0.5s (15 frames) dissolve junction joins them.
        // With spare media:
        // - Clip 1 conformed pass decoded extra 8 frames beyond trimEnd -> 308 frames.
        // - Clip 2 conformed pass decoded extra 7 frames before trimStart -> 307 frames.
        // Total conformed length (308 + 307) - transition (15) = 600 frames exactly.

        var plan = new MergePlan
        {
            Canvas = Canvas.Hd1080p30,
            Scenes =
            [
                new MergeSceneInput("clips/clip_001.mp4", new FrameCount(308),
                    new TransitionSettings(SceneTransition.Dissolve, new FrameCount(15))),
                new MergeSceneInput("clips/clip_002.mp4", new FrameCount(307), TransitionSettings.None)
            ],
            OutputRelativePath = "out/final.mp4"
        };

        var built = NewBuilder().BuildMerge(plan);

        // Intended duration of both clips: 300 + 300 = 600 frames.
        Assert.Equal(600, built.ExpectedFrames.Value);

        // FilterComplex contains the xfade transition with correct duration and offset.
        // Offset = 308 - 15 = 293 frames = 9.766667 seconds.
        Assert.Contains("xfade=transition=dissolve", built.FilterComplex);
        Assert.Contains(":duration=0.5", built.FilterComplex);
        Assert.Contains(":offset=9.766667", built.FilterComplex);
    }

    [Fact]
    public void Duration_is_preserved_on_freeze_frame_fallback()
    {
        // When a clip lacks spare media, BuildClip applies tpad to freeze the first or last frame.
        var builder = NewBuilder();
        var clipPlan = new ClipRenderPlan
        {
            ClipIndex = 0,
            SourceRelativePath = "src/video1.mp4",
            Canvas = Canvas.Hd1080p30,
            OutputRelativePath = "clips/clip_001.mp4",
            ExpectedFrames = new FrameCount(300),
            LeadInSeconds = 0.25,
            TailOutSeconds = 0.25,
            FreezeHead = true,
            FreezeTail = true,
            SourceHasAudio = true
        };

        var clipBuilt = builder.BuildClip(clipPlan);

        // Check that tpad was emitted with start_mode and stop_mode:
        Assert.Contains("tpad=start_mode=clone:start_duration=0.25:stop_mode=clone:stop_duration=0.25", clipBuilt.FilterComplex);
        // Check that audio is delayed by LeadInSeconds (250ms) to maintain A/V sync during head freeze:
        Assert.Contains("adelay=250|250", clipBuilt.FilterComplex);

        // When merged downstream, the padded clips give the exact intended 600 frames:
        var mergePlan = new MergePlan
        {
            Canvas = Canvas.Hd1080p30,
            Scenes =
            [
                new MergeSceneInput("clips/clip_001.mp4", new FrameCount(308),
                    new TransitionSettings(SceneTransition.Fade, new FrameCount(15))),
                new MergeSceneInput("clips/clip_002.mp4", new FrameCount(307), TransitionSettings.None)
            ],
            OutputRelativePath = "out/final.mp4"
        };

        var mergeBuilt = builder.BuildMerge(mergePlan);

        Assert.Equal(600, mergeBuilt.ExpectedFrames.Value);
        Assert.Contains("xfade=transition=fade", mergeBuilt.FilterComplex);
    }

    [Fact]
    public void Zero_length_transition_produces_byte_identical_filtergraph_to_hard_cut()
    {
        var builder = NewBuilder();

        // Plan with SceneTransition.None
        var nonePlan = new MergePlan
        {
            Canvas = Canvas.Hd1080p30,
            Scenes =
            [
                new MergeSceneInput("clips/clip_001.mp4", new FrameCount(300), TransitionSettings.None),
                new MergeSceneInput("clips/clip_002.mp4", new FrameCount(300), TransitionSettings.None)
            ],
            OutputRelativePath = "out/final.mp4"
        };

        // Plan with a transition specified as Fade but with 0 duration frames
        var zeroDurPlan = new MergePlan
        {
            Canvas = Canvas.Hd1080p30,
            Scenes =
            [
                new MergeSceneInput("clips/clip_001.mp4", new FrameCount(300),
                    new TransitionSettings(SceneTransition.Fade, FrameCount.Zero)),
                new MergeSceneInput("clips/clip_002.mp4", new FrameCount(300), TransitionSettings.None)
            ],
            OutputRelativePath = "out/final.mp4"
        };

        var builtNone = builder.BuildMerge(nonePlan);
        var builtZeroDur = builder.BuildMerge(zeroDurPlan);

        Assert.True(builtNone.IsStreamCopy);
        Assert.True(builtZeroDur.IsStreamCopy);
        Assert.Equal(builtNone.FilterComplex, builtZeroDur.FilterComplex);
        Assert.Equal(builtNone.OutputArguments, builtZeroDur.OutputArguments);
        Assert.Equal(builtNone.ExpectedFrames.Value, builtZeroDur.ExpectedFrames.Value);
    }
}
