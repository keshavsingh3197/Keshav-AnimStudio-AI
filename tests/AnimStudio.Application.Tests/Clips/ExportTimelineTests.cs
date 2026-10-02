using AnimStudio.Application.Clips;
using AnimStudio.Domain.Assets;
using AnimStudio.Domain.Jobs;
using AnimStudio.Domain.Rendering;

namespace AnimStudio.Application.Tests.Clips;

/// <summary>
/// The export timeline: where each item lands in the delivered file, and the text forms
/// it downloads as. Chapters pasted into YouTube are only useful if they hit the frame.
/// </summary>
public class ExportTimelineTests
{
    private static readonly FrameRate Rate = FrameRate.Fps30;

    private static Asset Video(string id, string name) =>
        new() { Id = id, Name = name, Kind = AssetKind.Video };

    private static Asset Audio(string id, string name, double seconds, AssetProvenance? provenance = null) =>
        new() { Id = id, Name = name, Kind = AssetKind.Audio, Probe = new MediaProbe { DurationSeconds = seconds }, Provenance = provenance };

    private static readonly Dictionary<string, Asset> Assets = new()
    {
        ["a"] = Video("a", "Intro.mp4"),
        ["b"] = Video("b", "The chase"),
        ["c"] = Video("c", "Finale"),
        ["sting"] = Audio("sting", "Whoosh.wav", 2),
        ["song"] = Audio("song", "Song", 180),
        ["bed"] = Audio("bed", "Ambient bed", 60,
            new AssetProvenance { AttributionText = "Ambient by Jane Doe, CC BY 4.0", SourceUrl = "https://example.test/bed" })
    };

    /// <summary>
    /// 15s, 10s and 20s clips; a half-second fade after the first, a cut after the second.
    /// </summary>
    private static ExportTimeline ThreeClips(ClipMergeSpec? spec = null) =>
        ExportTimelineBuilder.Build(
            spec ?? new ClipMergeSpec { AssetIds = ["a", "b", "c"] },
            id => Assets.GetValueOrDefault(id),
            new ExportTimelineFacts(
                [new FrameCount(450), new FrameCount(300), new FrameCount(600)],
                [new FrameCount(15), FrameCount.Zero],
                [SceneTransition.Fade, SceneTransition.None],
                [0, 0.25, 0],
                Rate,
                new FrameCount(1335)));

    [Fact]
    public void Places_clips_at_their_measured_offsets_with_transitions_overlapping()
    {
        var timeline = ThreeClips();
        var clips = timeline.Entries.Where(e => e.Kind == ExportTimelineKinds.Clip).ToList();

        Assert.Equal(44.5, timeline.DurationSeconds);
        Assert.Equal([0, 14.5, 24.5], clips.Select(c => c.StartSeconds));
        Assert.Equal([15, 24.5, 44.5], clips.Select(c => c.EndSeconds));

        var fade = Assert.Single(timeline.Entries, e => e.Kind == ExportTimelineKinds.Transition);
        Assert.Equal((14.5, 15.0), (fade.StartSeconds, fade.EndSeconds));
        Assert.Equal("Fade", fade.Transition);
    }

    [Fact]
    public void Reports_sounds_music_and_text_where_they_play()
    {
        var spec = new ClipMergeSpec
        {
            AssetIds = ["a", "b", "c"],
            BackgroundMusicAssetId = "bed",
            ClipAudio = [new(), new() { AudioAssetId = "sting" }, new()],
            MusicTracks = [new TimedMusicClipSpec { AssetId = "song", StartSeconds = 5, TrimStartSeconds = 20, TrimEndSeconds = 30 }],
            TimelineItems = [new TimelineItemSpec { Type = "text", TrackId = "TXT1", StartTime = 3, Duration = 4, Src = "Hello" }]
        };

        var timeline = ThreeClips(spec);

        // After clip 2's quarter-second frozen lead-in, and as long as the sound itself.
        var sting = Assert.Single(timeline.Entries, e => e.Kind == ExportTimelineKinds.ClipSound);
        Assert.Equal((14.75, 16.75), (sting.StartSeconds, sting.EndSeconds));

        var song = Assert.Single(timeline.Entries, e => e.Kind == ExportTimelineKinds.Music);
        Assert.Equal((5.0, 15.0), (song.StartSeconds, song.EndSeconds));

        var bed = Assert.Single(timeline.Entries, e => e.Kind == ExportTimelineKinds.MusicBed);
        Assert.Equal((0.0, 44.5), (bed.StartSeconds, bed.EndSeconds));
        Assert.Equal("Ambient by Jane Doe, CC BY 4.0", bed.Credit);

        var text = Assert.Single(timeline.Entries, e => e.Kind == ExportTimelineKinds.Text);
        Assert.Equal(("Hello", 3.0, 7.0), (text.Label, text.StartSeconds, text.EndSeconds));
    }

    [Fact]
    public void YouTube_description_lists_chapters_from_zero_and_credits_the_music()
    {
        var spec = new ClipMergeSpec { AssetIds = ["a", "b", "c"], BackgroundMusicAssetId = "bed" };

        var text = ExportTimelineFormatter.ToYouTubeDescription(ThreeClips(spec), "My reel");

        Assert.StartsWith("My reel\n\nChapters\n0:00 Intro\n0:14 The chase\n0:24 Finale\n", text);
        Assert.Contains("0:00–0:44 Ambient bed — Ambient by Jane Doe, CC BY 4.0 (https://example.test/bed)", text);
    }

    [Fact]
    public void A_chapter_shorter_than_ten_seconds_is_folded_into_the_one_before()
    {
        // 15s, 4s, 15s: the 4s clip cannot be a chapter (Intro runs on to 0:19), leaving two - fewer than YouTube's
        // three, so no chapter list at all rather than one YouTube would reject.
        var timeline = ExportTimelineBuilder.Build(
            new ClipMergeSpec { AssetIds = ["a", "b", "c"] },
            id => Assets.GetValueOrDefault(id),
            new ExportTimelineFacts(
                [new FrameCount(450), new FrameCount(120), new FrameCount(450)],
                [FrameCount.Zero, FrameCount.Zero], [SceneTransition.None, SceneTransition.None],
                [0, 0, 0], Rate, new FrameCount(1020)));

        Assert.Equal([(0.0, "Intro"), (19.0, "Finale")],
            ExportTimelineFormatter.Chapters(timeline).Select(c => (c.Start, c.Label)));
        Assert.DoesNotContain("Chapters", ExportTimelineFormatter.ToYouTubeDescription(timeline, null));
    }

    [Fact]
    public void Csv_neutralises_labels_a_spreadsheet_would_run_as_formulas()
    {
        var timeline = new ExportTimeline
        {
            DurationSeconds = 10,
            Entries = [new ExportTimelineEntry { Label = "=HYPERLINK(\"x\")", StartSeconds = 0, EndSeconds = 10 }]
        };

        var row = ExportTimelineFormatter.ToCsv(timeline).Split("\r\n")[1];

        Assert.Contains("\"'=HYPERLINK(\"\"x\"\")\"", row);
        Assert.Contains("\"00:00:10.000\"", row);
    }
}
