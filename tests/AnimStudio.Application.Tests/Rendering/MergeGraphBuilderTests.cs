using AnimStudio.Application.Abstractions.Rendering;
using AnimStudio.Application.Rendering.Models;
using AnimStudio.Domain.Rendering;
using AnimStudio.Infrastructure.Ffmpeg.Graph;

namespace AnimStudio.Application.Tests.Rendering;

/// <summary>
/// The join graph, asserted as strings. The subject here is resource cost rather than
/// picture: an xfade chain opens every clip at once, and what that costs in memory is
/// decided by arguments that are invisible in the filtergraph itself.
/// </summary>
public class MergeGraphBuilderTests
{
    private static FfmpegFilterGraphBuilder NewBuilder(params RenderFeature[] unsupported) =>
        new(new FakeCapabilities(unsupported));

    private static MergePlan Plan(int scenes, int transitionFrames, int decoderThreads = 0) =>
        new()
        {
            Canvas = Canvas.Hd1080p30,
            Scenes = [.. Enumerable.Range(0, scenes).Select(i => new MergeSceneInput(
                $"clips/clip_{i + 1:D3}.mp4",
                new FrameCount(300),
                i == scenes - 1 || transitionFrames == 0
                    ? TransitionSettings.None
                    : new TransitionSettings(SceneTransition.Fade, new FrameCount(transitionFrames))))],
            OutputRelativePath = "out/final.mp4",
            DecoderThreadsPerInput = decoderThreads
        };

    [Fact]
    public void Caps_decoder_threads_on_every_input_of_a_crossfade_join()
    {
        // The measurement behind this: 24 1080p inputs peaked at 2068 MB of working set with
        // ffmpeg's default threading and 927 MB capped at two, in the same 35 seconds. A
        // multi-threaded h264 decoder sizes its frame pool by thread count, and an xfade
        // chain holds one decoder per clip, so the cap is worth more than twice the memory
        // for no time at all.
        var built = NewBuilder().BuildMerge(Plan(4, transitionFrames: 15, decoderThreads: 2));

        Assert.False(built.IsStreamCopy);
        Assert.Equal(4, built.Inputs.Count);
        Assert.All(built.Inputs, i => Assert.Equal(["-threads", "2"], i.PreInputArguments));
    }

    [Fact]
    public void Leaves_threading_to_ffmpeg_when_the_cap_is_zero()
    {
        // Zero means "not configured", not "zero threads" - which ffmpeg would reject.
        var built = NewBuilder().BuildMerge(Plan(3, transitionFrames: 15));

        Assert.All(built.Inputs, i => Assert.Empty(i.PreInputArguments));
    }

    [Fact]
    public void A_hard_cut_join_stays_a_single_input_stream_copy()
    {
        // The concat demuxer reads one file at a time, so it has neither the memory problem
        // nor anything to cap - and re-encoding here would throw away the whole point of
        // having conformed the clips in pass one.
        var built = NewBuilder().BuildMerge(Plan(20, transitionFrames: 0));

        Assert.True(built.IsStreamCopy);
        Assert.Single(built.Inputs);
        Assert.Contains("copy", built.OutputArguments);
    }

    private const string FollowTimestamps = "aresample=async=1:min_hard_comp=0.005:first_pts=0";

    [Fact]
    public void A_stream_copy_join_with_music_places_clip_audio_by_timestamp_not_end_to_end()
    {
        // Each conformed clip's sound ends ~10ms short of its picture. Renumbering samples
        // end to end (asetpts=N/SR/TB) carried every shortfall forward, so the sound ran
        // further ahead of the lips with each clip - 111ms after four clips.
        var built = NewBuilder().BuildMerge(
            Plan(4, transitionFrames: 0) with { BackgroundMusicRelativePath = "in/music.mp3" });

        Assert.True(built.IsStreamCopy);
        Assert.Contains($"stereo,{FollowTimestamps},apad=whole_dur=40,atrim=end=40[clipaudio]",
            built.FilterComplex);
        Assert.DoesNotContain("[0:a]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,asetpts",
            built.FilterComplex);
    }

    [Fact]
    public void A_crossfade_join_holds_every_clips_audio_to_exactly_its_video_length()
    {
        // acrossfade consumes audio with xfade's arithmetic, which only stays locked if each
        // input is exactly as long as the video it belongs to.
        var built = NewBuilder().BuildMerge(Plan(3, transitionFrames: 15));

        for (var i = 0; i < 3; i++)
        {
            Assert.Contains($"[{i}:a]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,"
                + $"{FollowTimestamps},apad=whole_dur=10,atrim=end=10[a{i}]", built.FilterComplex);
        }
    }
}
