using AnimStudio.Application.LiveStreams;
using AnimStudio.Infrastructure.LiveStreams;

namespace AnimStudio.Application.Tests.LiveStreams;

public class LiveStreamArgumentsTests
{
    private const string Url = "rtmps://a.rtmps.youtube.com:443/live2/abcd-efgh-ijkl-mnop-qrst";

    private static string ValueAfter(IReadOnlyList<string> arguments, string flag)
    {
        var index = arguments.ToList().IndexOf(flag);
        Assert.True(index >= 0, $"{flag} missing");
        return arguments[index + 1];
    }

    [Theory]
    [InlineData(LiveStreamOrientation.Landscape, LiveStreamQuality.Hd720, 1280, 720)]
    [InlineData(LiveStreamOrientation.Landscape, LiveStreamQuality.Hd1080, 1920, 1080)]
    [InlineData(LiveStreamOrientation.Portrait, LiveStreamQuality.Hd720, 720, 1280)]
    [InlineData(LiveStreamOrientation.Portrait, LiveStreamQuality.Hd1080, 1080, 1920)]
    public void Frame_follows_orientation_and_quality(
        LiveStreamOrientation orientation, LiveStreamQuality quality, int width, int height)
    {
        var frame = LiveStreamArguments.FrameFor(orientation, quality);
        Assert.Equal((width, height), (frame.Width, frame.Height));
    }

    [Fact]
    public void Prepared_segments_follow_youtube_ingest_recommendations()
    {
        var arguments = LiveStreamArguments.ConformVideo("source.mp4", hasAudio: true, new LiveStreamSettings(), "item00.mp4");

        Assert.Equal("libx264", ValueAfter(arguments, "-c:v"));
        Assert.Equal("60", ValueAfter(arguments, "-g"));          // a keyframe every 2 s at 30 fps
        Assert.Equal("0", ValueAfter(arguments, "-sc_threshold")); // and only there
        Assert.Equal("3000k", ValueAfter(arguments, "-b:v"));
        Assert.Equal("aac", ValueAfter(arguments, "-c:a"));
        Assert.Equal("44100", ValueAfter(arguments, "-ar"));
        Assert.Equal("item00.mp4", arguments[^1]);
        // Preparing isn't real time: it runs as fast as the machine can.
        Assert.DoesNotContain("-re", arguments);
    }

    [Fact]
    public void Every_segment_kind_is_encoded_identically_so_they_join_without_re_encoding()
    {
        static IReadOnlyList<string> Tail(IReadOnlyList<string> args) =>
            args.SkipWhile(a => a != "-c:v").ToList();

        var settings = new LiveStreamSettings { Quality = LiveStreamQuality.Hd1080 };
        var video = Tail(LiveStreamArguments.ConformVideo("a.mp4", true, settings, "item00.mp4"));
        var silent = Tail(LiveStreamArguments.ConformVideo("b.mp4", false, settings, "item00.mp4"));
        var song = Tail(LiveStreamArguments.ConformCoverAndAudio("c.wav", "stage00.png", settings, "item00.mp4"));

        Assert.Equal(video, silent);
        Assert.Equal(video, song);
    }

    [Fact]
    public void A_silent_video_gets_a_silent_track_cut_to_the_picture()
    {
        var arguments = LiveStreamArguments.ConformVideo("source.mp4", hasAudio: false, new LiveStreamSettings(), "item00.mp4");

        Assert.Contains(arguments, a => a.StartsWith("anullsrc", StringComparison.Ordinal));
        Assert.Contains("-shortest", arguments);
        Assert.Contains("[1:a]", ValueAfter(arguments, "-filter_complex"));
    }

    [Fact]
    public void A_video_with_sound_uses_its_own_track_padded_to_the_picture()
    {
        var graph = ValueAfter(LiveStreamArguments.ConformVideo("source.mp4", true, new LiveStreamSettings(), "item00.mp4"), "-filter_complex");

        Assert.Contains("[0:a:0]", graph);
        Assert.Contains("apad", graph);
    }

    [Fact]
    public void Portrait_1080_letterboxes_into_a_vertical_frame()
    {
        var settings = new LiveStreamSettings { Orientation = LiveStreamOrientation.Portrait, Quality = LiveStreamQuality.Hd1080 };

        var graph = ValueAfter(LiveStreamArguments.ConformVideo("source.mp4", true, settings, "item00.mp4"), "-filter_complex");

        Assert.Contains("scale=1080:1920:force_original_aspect_ratio=decrease", graph);
        Assert.Contains("pad=1080:1920", graph);
    }

    [Fact]
    public void A_song_without_a_cover_gets_a_plain_backdrop()
    {
        var arguments = LiveStreamArguments.Stage(null, new LiveStreamSettings(), "stage00.png");

        Assert.Contains(arguments, a => a.StartsWith("color=", StringComparison.Ordinal));
        Assert.Equal("stage00.png", arguments[^1]);
    }

    [Fact]
    public void Sending_copies_the_prepared_segments_at_playback_speed()
    {
        var arguments = LiveStreamArguments.Push(loopForever: false, Url);

        Assert.Contains("-re", arguments);
        Assert.Equal("concat", ValueAfter(arguments, "-f"));
        Assert.Equal("copy", ValueAfter(arguments, "-c"));
        Assert.Equal(LiveStreamArguments.PlaylistFile, ValueAfter(arguments, "-i"));
        Assert.DoesNotContain("-stream_loop", arguments);
        // The concat demuxer stays in safe mode: the list only ever names plain relative files.
        Assert.DoesNotContain("-safe", arguments);
        Assert.Equal(Url, arguments[^1]);
    }

    [Fact]
    public void A_forever_stream_loops_the_list()
    {
        var arguments = LiveStreamArguments.Push(loopForever: true, Url);
        Assert.Equal("-1", ValueAfter(arguments, "-stream_loop"));
    }

    [Fact]
    public void The_key_appears_only_in_the_output_url() =>
        Assert.Single(LiveStreamArguments.Push(true, Url), a => a.Contains("abcd-efgh-ijkl-mnop-qrst", StringComparison.Ordinal));

    [Fact]
    public void Output_url_appends_the_key_as_one_segment() =>
        Assert.Equal(
            "rtmps://a.rtmps.youtube.com/live2/KEY-1234",
            LiveStreamArguments.OutputUrl("rtmps://a.rtmps.youtube.com/live2/", "KEY-1234"));

    private static readonly string[] Three = ["item00.mp4", "item01.mp4", "item02.mp4"];

    private static string[] Files(string content) =>
        content.Split('\n', StringSplitOptions.RemoveEmptyEntries).Select(l => l["file '".Length..^1]).ToArray();

    [Fact]
    public void A_finite_playlist_is_written_out_pass_by_pass() =>
        Assert.Equal(
            ["item00.mp4", "item01.mp4", "item02.mp4", "item00.mp4", "item01.mp4", "item02.mp4"],
            Files(LiveStreamArguments.PlaylistContent(Three, startItem: 0, remainingFullLoops: 1)));

    [Fact]
    public void A_reconnect_resumes_at_the_item_that_was_playing() =>
        Assert.Equal(
            ["item02.mp4", "item00.mp4", "item01.mp4", "item02.mp4"],
            Files(LiveStreamArguments.PlaylistContent(Three, startItem: 2, remainingFullLoops: 1)));

    [Fact]
    public void A_forever_playlist_is_rotated_to_start_where_it_left_off() =>
        Assert.Equal(
            ["item01.mp4", "item02.mp4", "item00.mp4"],
            Files(LiveStreamArguments.PlaylistContent(Three, startItem: 1, remainingFullLoops: null)));

    [Fact]
    public void Skipped_items_are_simply_not_in_the_list() =>
        Assert.Equal(
            ["item00.mp4", "item02.mp4"],
            Files(LiveStreamArguments.PlaylistContent(["item00.mp4", "item02.mp4"], 0, 0)));

    [Theory]
    [InlineData(0, 0, 0)]
    [InlineData(9.9, 0, 0)]
    [InlineData(10, 0, 1)]
    [InlineData(25, 0, 2)]
    [InlineData(30, 1, 0)]   // 10 + 5 + 15 = one full pass
    [InlineData(71, 2, 1)]
    public void Position_follows_the_item_durations(double seconds, int loop, int item) =>
        Assert.Equal((loop, item), LiveStreamArguments.Position([10, 5, 15], 0, 0, seconds));

    [Fact]
    public void Position_counts_from_where_the_connection_started() =>
        Assert.Equal((1, 0), LiveStreamArguments.Position([10, 5, 15], startLoop: 0, startItem: 2, streamedSeconds: 16));

    [Theory]
    [InlineData("[tcp @ 0x1] Failed to resolve hostname a.rtmps.youtube.com", false, "internet")]
    [InlineData("rtmps://a.rtmps.youtube.com/live2/[stream-key]: I/O error", false, "stream key")]
    [InlineData("Connection reset by peer", true, "dropped")]
    [InlineData("something unexpected", false, "Logs page")]
    public void Explains_failures_in_terms_of_what_to_check(string stderr, bool wentLive, string expected) =>
        Assert.Contains(expected, LiveStreamManager.Explain(stderr, wentLive));

    [Theory]
    [InlineData("rtmps://a.rtmps.youtube.com/live2/[stream-key]: I/O error", true)]
    [InlineData("Connection reset by peer", true)]
    [InlineData("Failed to resolve hostname a.rtmps.youtube.com: I/O error", false)]
    [InlineData("Connection timed out", false)]
    public void Only_a_refusal_by_the_server_counts_against_the_key(string stderr, bool refusal) =>
        Assert.Equal(refusal, LiveStreamManager.LooksLikeRefusal(stderr));
}
