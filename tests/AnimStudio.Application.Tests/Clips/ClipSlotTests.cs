using AnimStudio.Application.Clips;
using AnimStudio.Application.Rendering.Models;
using AnimStudio.Application.Tests.Rendering;
using AnimStudio.Domain.Assets;
using AnimStudio.Domain.Jobs;
using AnimStudio.Domain.Rendering;
using AnimStudio.Infrastructure.Ffmpeg.Graph;

namespace AnimStudio.Application.Tests.Clips;

/// <summary>
/// Slots: the blank stretches a cut opens for images, overlay videos and titles that play
/// between clips rather than over them. The editor lays them out; these hold the export to
/// the same positions.
/// </summary>
public class ClipSlotTests
{
    private static readonly FrameRate Rate = FrameRate.Fps30;

    private static ClipRenderPlan BlankSlot(WatermarkPlan? watermark = null, string pad = "000000") => new()
    {
        ClipIndex = 4,
        SourceRelativePath = string.Empty,
        Canvas = Canvas.Hd1080p30,
        OutputRelativePath = "clips/slot_001.mp4",
        ExpectedFrames = new FrameCount(75),
        PadColorRgb = pad,
        SourceIsImage = true,
        SourceIsBlank = true,
        ImageDurationSeconds = 2.5,
        Watermark = watermark
    };

    [Fact]
    public void A_slot_is_drawn_from_a_canvas_sized_colour_source_not_a_file()
    {
        var built = new FfmpegFilterGraphBuilder(new FakeCapabilities()).BuildClip(BlankSlot(pad: "ff0055"));

        var source = built.Inputs[0];
        Assert.True(source.IsLavfi);
        Assert.Equal(["-f", "lavfi"], source.PreInputArguments);
        Assert.Equal("color=c=0xff0055:s=1920x1080:r=30/1:d=2.5", source.RelativePath);

        // Fixed-length like an image clip, with generated silence so the join keeps one
        // audio stream per input.
        Assert.Contains("-frames:v", built.OutputArguments);
        Assert.Contains(built.Inputs, i => i.IsLavfi && i.RelativePath.StartsWith("anullsrc"));
    }

    [Fact]
    public void A_slot_keeps_the_watermark_every_clip_around_it_carries()
    {
        var mark = ClipPlanFactory.CreateWatermark(
            new WatermarkSettings { Kind = WatermarkKind.Logo, LogoAssetId = "logo-1" },
            Canvas.Hd1080p30, "in/img_logo-1.png", null, null)!;

        var built = new FfmpegFilterGraphBuilder(new FakeCapabilities()).BuildClip(BlankSlot(mark));

        Assert.Contains(built.Inputs, i => i.RelativePath == "in/img_logo-1.png");
        Assert.Contains("overlay", built.FilterComplex);
    }

    [Fact]
    public void Slots_at_one_position_merge_and_are_ordered_by_position()
    {
        var slots = ClipMergeService.BuildSlots(
            [new ClipSlot(2, 1.5), new ClipSlot(0, 3), new ClipSlot(2, 2), new ClipSlot(1, 0.001)]);

        Assert.Equal([(0, 3.0), (2, 3.5)], slots.Select(s => (s.BeforeClipIndex, s.Seconds)));
    }

    [Fact]
    public void Slot_seconds_are_tabled_per_position_and_strays_are_dropped()
    {
        var before = ClipMergeOrchestrator.SlotSecondsBefore(
            [
                new ClipSlotSpec { BeforeClipIndex = 0, Seconds = 2 },
                new ClipSlotSpec { BeforeClipIndex = 3, Seconds = 4 },
                new ClipSlotSpec { BeforeClipIndex = 9, Seconds = 5 },
                new ClipSlotSpec { BeforeClipIndex = 1, Seconds = double.NaN }
            ],
            clipCount: 3);

        Assert.Equal([2.0, 0, 0, 4.0], before);
    }

    private static readonly Dictionary<string, Asset> Assets = new()
    {
        ["a"] = new Asset { Id = "a", Name = "Intro", Kind = AssetKind.Video },
        ["b"] = new Asset { Id = "b", Name = "Finale", Kind = AssetKind.Video }
    };

    [Fact]
    public void Clips_after_a_slot_are_reported_where_they_play()
    {
        // 10s, a 5s slot, 10s, then a 3s slot and a 4s end card.
        var spec = new ClipMergeSpec
        {
            AssetIds = ["a", "b"],
            Slots = [new() { BeforeClipIndex = 1, Seconds = 5 }, new() { BeforeClipIndex = 2, Seconds = 3 }]
        };

        var timeline = ExportTimelineBuilder.Build(
            spec,
            id => Assets.GetValueOrDefault(id),
            new ExportTimelineFacts(
                [new FrameCount(300), new FrameCount(300), new FrameCount(120)],
                [FrameCount.Zero, FrameCount.Zero],
                [SceneTransition.None, SceneTransition.None],
                [0, 0],
                Rate,
                new FrameCount(960))
            {
                SlotsBefore = [FrameCount.Zero, new FrameCount(150), new FrameCount(90)]
            });

        var clips = timeline.Entries.Where(e => e.Kind == ExportTimelineKinds.Clip).ToList();
        Assert.Equal([(0.0, 10.0), (15.0, 25.0)], clips.Select(c => (c.StartSeconds, c.EndSeconds)));

        var endCard = Assert.Single(timeline.Entries, e => e.Kind == ExportTimelineKinds.EndCard);
        Assert.Equal((28.0, 32.0), (endCard.StartSeconds, endCard.EndSeconds));
    }

    [Fact]
    public void A_cut_with_no_clips_is_one_slot_and_its_pictures_and_end_card_follow_it()
    {
        // Pictures on IMG1 over a 27s slot, then a 4s end card. No V1 clip at all.
        var spec = new ClipMergeSpec
        {
            AssetIds = [],
            Slots = [new() { BeforeClipIndex = 0, Seconds = 27 }],
            TimelineItems =
            [
                new TimelineItemSpec { Id = "p1", Type = "image", TrackId = "IMG1", Src = "a", StartTime = 0, Duration = 13.5 },
                new TimelineItemSpec { Id = "p2", Type = "image", TrackId = "IMG1", Src = "b", StartTime = 13.5, Duration = 13.5 }
            ]
        };

        Assert.Equal([27.0], ClipMergeOrchestrator.SlotSecondsBefore(spec.Slots, clipCount: 0));

        var timeline = ExportTimelineBuilder.Build(
            spec,
            id => Assets.GetValueOrDefault(id),
            new ExportTimelineFacts(
                [new FrameCount(120)],
                [FrameCount.Zero],
                [SceneTransition.None],
                [],
                Rate,
                new FrameCount(930))
            {
                SlotsBefore = [new FrameCount(810)]
            });

        Assert.DoesNotContain(timeline.Entries, e => e.Kind == ExportTimelineKinds.Clip);
        Assert.Equal([(0.0, 13.5), (13.5, 27.0)],
            timeline.Entries.Where(e => e.Kind == ExportTimelineKinds.Overlay).Select(e => (e.StartSeconds, e.EndSeconds)));

        var endCard = Assert.Single(timeline.Entries, e => e.Kind == ExportTimelineKinds.EndCard);
        Assert.Equal((27.0, 31.0), (endCard.StartSeconds, endCard.EndSeconds));
    }
}
