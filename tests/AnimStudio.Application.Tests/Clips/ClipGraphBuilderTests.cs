using AnimStudio.Application.Abstractions.Rendering;
using AnimStudio.Application.Clips;
using AnimStudio.Application.Rendering.Models;
using AnimStudio.Application.Tests.Rendering;
using AnimStudio.Domain.Rendering;
using AnimStudio.Infrastructure.Ffmpeg.Graph;

namespace AnimStudio.Application.Tests.Clips;

/// <summary>
/// The per-clip conform pass and the watermark, asserted as strings with no ffmpeg
/// installed - the same contract the scene graph tests hold to.
/// </summary>
public class ClipGraphBuilderTests
{
    private static FfmpegFilterGraphBuilder NewBuilder(params RenderFeature[] unsupported) =>
        new(new FakeCapabilities(unsupported));

    /// <summary>
    /// Never opened - the graph builder is a pure function over the plan. It is a Windows
    /// path on purpose: the drive colon and the backslashes are exactly what has to survive
    /// escaping into a drawtext option.
    /// </summary>
    private const string TestFontFile = @"C:\Windows\Fonts\segoeuib.ttf";

    private static WatermarkPlan TextMark(
        WatermarkPosition position = WatermarkPosition.TopRight,
        double backplate = 0.3) =>
        ClipPlanFactory.CreateWatermark(
            new WatermarkSettings
            {
                Kind = WatermarkKind.Text,
                Text = "animstudio.example",
                Position = position,
                BackplateOpacity = backplate
            },
            Canvas.Hd1080p30, null, "wm/watermark.txt", TestFontFile)!;

    private static WatermarkPlan LogoMark(
        WatermarkPosition position = WatermarkPosition.TopRight) =>
        ClipPlanFactory.CreateWatermark(
            new WatermarkSettings
            {
                Kind = WatermarkKind.Logo,
                LogoAssetId = "logo-1",
                Position = position
            },
            Canvas.Hd1080p30, "in/img_logo-1.png", null, null)!;

    private static ClipRenderPlan Plan(
        ClipFit fit = ClipFit.Contain,
        WatermarkPlan? watermark = null,
        bool hasAudio = true,
        bool mute = false,
        double volume = 1.0,
        string? extraAudio = null,
        double extraVolume = 1.0,
        bool keepOwnAudio = false) =>
        new()
        {
            ClipIndex = 0,
            SourceRelativePath = "in/vid_abc.mp4",
            Canvas = Canvas.Hd1080p30,
            OutputRelativePath = "clips/clip_001.mp4",
            ExpectedFrames = new FrameCount(300),
            Fit = fit,
            SourceHasAudio = hasAudio,
            MuteAudio = mute,
            AudioVolume = volume,
            ExtraAudioRelativePath = extraAudio,
            ExtraAudioVolume = extraVolume,
            KeepOwnAudio = keepOwnAudio,
            Watermark = watermark
        };

    // --- conforming ---------------------------------------------------------

    [Fact]
    public void Normalizes_the_pixel_aspect_ratio_and_the_frame_rate()
    {
        // Both are silent killers of a stream-copy concat. Camera footage often carries a
        // non-square SAR, and the demuxer keeps the FIRST clip's SAR for the whole output -
        // so one anamorphic clip early on stretches every clip after it.
        var graph = NewBuilder().BuildClip(Plan()).FilterComplex;

        Assert.Contains("setsar=1", graph);
        Assert.Contains("fps=30/1", graph);
    }

    [Fact]
    public void Letterboxes_by_default_rather_than_cropping()
    {
        var graph = NewBuilder().BuildClip(Plan()).FilterComplex;

        Assert.Contains("scale=1920:1080:force_original_aspect_ratio=decrease", graph);
        Assert.Contains("pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=black", graph);
        Assert.DoesNotContain("crop=", graph);
    }

    [Fact]
    public void Cover_fills_the_canvas_and_crops_the_overflow()
    {
        var graph = NewBuilder().BuildClip(Plan(ClipFit.Cover)).FilterComplex;

        Assert.Contains("force_original_aspect_ratio=increase", graph);
        Assert.Contains("crop=1920:1080", graph);
        Assert.DoesNotContain("pad=", graph);
    }

    [Fact]
    public void A_blurred_backdrop_decodes_the_source_once_and_uses_it_twice()
    {
        var graph = NewBuilder().BuildClip(Plan(ClipFit.BlurredBackdrop)).FilterComplex;

        Assert.Contains("[0:v]split=2[bgsrc][fgsrc];", graph);
        Assert.Contains("gblur=", graph);
        Assert.Contains("overlay=format=auto:x=(main_w-overlay_w)/2:y=(main_h-overlay_h)/2", graph);
    }

    [Fact]
    public void Falls_back_to_black_bars_when_the_renderer_has_no_blur()
    {
        var built = NewBuilder(RenderFeature.BlurBackdrop).BuildClip(Plan(ClipFit.BlurredBackdrop));

        Assert.DoesNotContain("gblur", built.FilterComplex);
        Assert.Contains("pad=1920:1080", built.FilterComplex);
        Assert.Contains("BLUR_BACKDROP_UNAVAILABLE", built.Warnings);
    }

    // --- audio --------------------------------------------------------------

    [Fact]
    public void Pads_the_clips_audio_open_endedly_and_ends_on_the_video()
    {
        // apad plus -shortest is what makes audio and video exactly the same length
        // whatever the source did. Trimming to a declared duration instead would truncate
        // any clip whose container lies about its length.
        var built = NewBuilder().BuildClip(Plan());

        Assert.Contains("apad[aout]", built.FilterComplex);
        Assert.Contains("-shortest", built.OutputArguments);
    }

    [Fact]
    public void Generates_silence_for_a_clip_that_has_no_audio_track()
    {
        // Without this, the concat demuxer produces a file that stops at the first silent
        // clip - which is how a single screen recording breaks a whole stitch.
        var built = NewBuilder().BuildClip(Plan(hasAudio: false));

        Assert.Contains(built.Inputs, i => i.IsLavfi && i.RelativePath.StartsWith("anullsrc"));
        Assert.Contains("[1:a]", built.FilterComplex);
    }

    [Fact]
    public void Muting_replaces_the_clips_audio_with_silence_rather_than_dropping_the_stream()
    {
        var built = NewBuilder().BuildClip(Plan(mute: true));

        Assert.Contains(built.Inputs, i => i.IsLavfi);
        Assert.Contains("[aout]", built.FilterComplex);
        Assert.Contains("-map", built.OutputArguments);
    }

    // --- per-clip sound -----------------------------------------------------

    [Fact]
    public void Leaves_a_clip_at_its_recorded_level_alone()
    {
        // No volume filter at unity: it would be a pass over every sample to multiply it
        // by one, and it would make the untouched case impossible to assert.
        var graph = NewBuilder().BuildClip(Plan()).FilterComplex;

        Assert.DoesNotContain("volume=", graph);
    }

    [Fact]
    public void Applies_a_per_clip_level_to_the_clips_own_audio()
    {
        var graph = NewBuilder().BuildClip(Plan(volume: 0.4)).FilterComplex;

        Assert.Contains("volume=0.4", graph);
        Assert.Contains("apad[aout]", graph);
    }

    [Fact]
    public void Silences_one_clip_by_generating_silence_rather_than_scaling_to_zero()
    {
        // volume=0 would still decode the source stream in order to multiply it away.
        var built = NewBuilder().BuildClip(Plan(volume: 0));

        Assert.Contains(built.Inputs, i => i.IsLavfi && i.RelativePath.StartsWith("anullsrc"));
        Assert.DoesNotContain("volume=0", built.FilterComplex);
    }

    [Fact]
    public void Limits_a_boosted_clip_where_the_host_can()
    {
        // A boost pushes peaks past full scale, and the difference between "louder" and
        // "distorted" is this filter.
        var graph = NewBuilder().BuildClip(Plan(volume: 1.8)).FilterComplex;

        Assert.Contains("volume=1.8", graph);
        Assert.Contains("alimiter=limit=0.95", graph);
    }

    [Fact]
    public void Skips_the_limiter_on_a_host_without_it_rather_than_failing()
    {
        var graph = NewBuilder(RenderFeature.AudioLimiter)
            .BuildClip(Plan(volume: 1.8)).FilterComplex;

        Assert.Contains("volume=1.8", graph);
        Assert.DoesNotContain("alimiter", graph);
    }

    [Fact]
    public void Clamps_a_level_beyond_the_ceiling_instead_of_emitting_it()
    {
        // The API range-checks this too; the graph is the last line of defence, and a
        // gain of 40 would be inaudible distortion rather than a loud clip.
        var graph = NewBuilder().BuildClip(Plan(volume: 40)).FilterComplex;

        Assert.Contains("volume=2", graph);
        Assert.DoesNotContain("volume=40", graph);
    }

    [Fact]
    public void Replaces_a_clips_sound_with_its_own_audio_file()
    {
        var built = NewBuilder().BuildClip(Plan(extraAudio: "in/aud_vo.wav", extraVolume: 0.9));

        // The file is a real input, and the clip's own audio is not in the graph at all.
        Assert.Contains(built.Inputs, i => i.RelativePath == "in/aud_vo.wav");
        Assert.Contains("volume=0.9", built.FilterComplex);
        Assert.DoesNotContain("[0:a]", built.FilterComplex);

        // apad, not a loop: a short voice-over runs into silence rather than repeating.
        Assert.Contains("apad[aout]", built.FilterComplex);
    }

    [Fact]
    public void Mixes_a_clips_own_audio_under_its_added_sound_when_asked()
    {
        var built = NewBuilder().BuildClip(Plan(
            volume: 0.3, extraAudio: "in/aud_vo.wav", extraVolume: 1.0, keepOwnAudio: true));

        Assert.Contains("[0:a]", built.FilterComplex);
        Assert.Contains("volume=0.3", built.FilterComplex);
        Assert.Contains("[a0][a1]amix=inputs=2:duration=first:normalize=0", built.FilterComplex);

        // normalize=0 is the whole point: without it amix halves both levels the moment a
        // second input appears, so the numbers the user set would stop meaning anything.
        Assert.DoesNotContain("normalize=1", built.FilterComplex);
    }

    [Fact]
    public void Plays_an_added_sound_alone_on_a_silent_clip_even_when_asked_to_keep_its_audio()
    {
        // "Keep the clip's own sound" cannot mix in a track that does not exist. The
        // result must still be exactly one audio stream, or the concat stalls.
        var built = NewBuilder().BuildClip(Plan(
            hasAudio: false, extraAudio: "in/aud_vo.wav", keepOwnAudio: true));

        Assert.DoesNotContain("amix", built.FilterComplex);
        Assert.DoesNotContain("[0:a]", built.FilterComplex);
        Assert.Contains("[aout]", built.FilterComplex);
    }

    [Fact]
    public void Keeps_an_added_sound_when_the_whole_video_has_its_clip_audio_muted()
    {
        // Muting drops the FOOTAGE's sound. A voice-over recorded for this clip is not
        // the footage's sound, so it survives - that is the point of muting a reel.
        var built = NewBuilder().BuildClip(Plan(mute: true, extraAudio: "in/aud_vo.wav"));

        Assert.Contains(built.Inputs, i => i.RelativePath == "in/aud_vo.wav");
        Assert.DoesNotContain("[0:a]", built.FilterComplex);
        Assert.DoesNotContain(built.Inputs, i => i.IsLavfi);
    }

    [Fact]
    public void Produces_exactly_one_audio_output_label_in_every_case()
    {
        // The single invariant the concat demuxer depends on, asserted across the whole
        // matrix rather than case by case.
        ClipRenderPlan[] plans =
        [
            Plan(),
            Plan(hasAudio: false),
            Plan(mute: true),
            Plan(volume: 0),
            Plan(volume: 1.5),
            Plan(extraAudio: "in/aud_vo.wav"),
            Plan(extraAudio: "in/aud_vo.wav", keepOwnAudio: true),
            Plan(extraAudio: "in/aud_vo.wav", extraVolume: 0, volume: 0),
            Plan(hasAudio: false, extraAudio: "in/aud_vo.wav", keepOwnAudio: true),
        ];

        foreach (var plan in plans)
        {
            var graph = NewBuilder().BuildClip(plan).FilterComplex;

            Assert.Equal(1, graph.Split("[aout]").Length - 1);
        }
    }

    // --- the settings that keep the join a stream copy ----------------------

    [Fact]
    public void Encodes_a_clip_with_the_same_gop_settings_a_scene_gets()
    {
        // Identical codec, pixel format, frame rate, GOP and audio layout is the ENTIRE
        // precondition for joining with -c copy. Any drift here turns a two-second merge
        // into a full re-encode, or produces a file that stutters at every join.
        var arguments = NewBuilder().BuildClip(Plan()).OutputArguments;

        Assert.Contains("-g", arguments);
        Assert.Contains("60", arguments);
        Assert.Contains("-sc_threshold", arguments);
        Assert.Contains("0", arguments);
        Assert.Contains("-fps_mode", arguments);
        Assert.Contains("cfr", arguments);
        Assert.Contains("yuv420p", arguments);
    }

    [Fact]
    public void Does_not_force_a_frame_count_on_a_clip()
    {
        // A scene knows its own length to the frame; a clip's length is whatever the file
        // turns out to hold. Forcing one would truncate or freeze real footage.
        Assert.DoesNotContain("-frames:v", NewBuilder().BuildClip(Plan()).OutputArguments);
    }

    // --- watermark placement ------------------------------------------------

    [Theory]
    [InlineData(WatermarkPosition.TopRight, "x=w-text_w-43:y=43")]
    [InlineData(WatermarkPosition.TopLeft, "x=43:y=43")]
    [InlineData(WatermarkPosition.TopCenter, "x=(w-text_w)/2:y=43")]
    [InlineData(WatermarkPosition.BottomRight, "x=w-text_w-43:y=h-text_h-43")]
    [InlineData(WatermarkPosition.BottomLeft, "x=43:y=h-text_h-43")]
    public void Pins_text_to_the_requested_edge(WatermarkPosition position, string expected)
    {
        var graph = NewBuilder().BuildClip(Plan(watermark: TextMark(position))).FilterComplex;

        Assert.Contains(expected, graph);
    }

    [Fact]
    public void The_default_position_is_below_the_top_edge_and_never_the_middle()
    {
        // The point of the default: clear of the player's bottom chrome and clear of the
        // picture. A y expression involving the frame height would put it in the middle.
        var mark = TextMark();

        Assert.Equal(WatermarkPosition.TopRight, mark.Position);

        var graph = NewBuilder().BuildClip(Plan(watermark: mark)).FilterComplex;

        Assert.Contains(":y=43:", graph + ":");
        Assert.DoesNotContain("y=(h-text_h)/2", graph);
    }

    [Fact]
    public void Reads_the_watermark_line_from_a_file_rather_than_the_filtergraph()
    {
        // A watermark is nearly always a URL, and every character that makes a URL a URL is
        // syntax to drawtext's option parser. textfile removes the escaping problem instead
        // of re-solving it.
        var graph = NewBuilder().BuildClip(Plan(watermark: TextMark())).FilterComplex;

        Assert.Contains("textfile='wm/watermark.txt'", graph);
        Assert.Contains("reload=0", graph);
        Assert.DoesNotContain("animstudio.example", graph);
    }

    [Fact]
    public void Names_the_watermark_font_by_file_and_never_by_family()
    {
        // The one that matters. font= resolves the family through fontconfig, and on a
        // build that has fontconfig but no fonts.conf - every stock Windows ffmpeg - the
        // failed lookup is dereferenced and the process dies with an access violation
        // (0xC0000005) instead of reporting a missing font. So the graph must carry a
        // fontfile= and nothing else, with the drive colon escaped so the path survives
        // drawtext's option parser.
        var graph = NewBuilder().BuildClip(Plan(watermark: TextMark())).FilterComplex;

        Assert.Contains(@"fontfile='C\:/Windows/Fonts/segoeuib.ttf'", graph);
        Assert.DoesNotContain(":font=", graph);
        Assert.DoesNotContain("=font=", graph);
        Assert.DoesNotContain(@"C:\Windows", graph);
    }

    [Fact]
    public void Skips_the_text_watermark_rather_than_crashing_the_renderer_without_a_font()
    {
        // No font file and no family-name fallback: the fallback IS the crash. Losing the
        // mark costs a decoration, and the warning says so; emitting font= would cost the
        // whole render, which is how "Clip 1 could not be prepared" used to happen.
        var mark = ClipPlanFactory.CreateWatermark(
            new WatermarkSettings { Kind = WatermarkKind.Text, Text = "site" },
            Canvas.Hd1080p30, null, "wm/watermark.txt", fontFileAbsolutePath: null)!;

        var built = NewBuilder().BuildClip(Plan(watermark: mark));

        Assert.DoesNotContain("drawtext", built.FilterComplex);
        Assert.Contains("WATERMARK_UNAVAILABLE", built.Warnings);
    }

    [Fact]
    public void Insets_a_plated_mark_far_enough_that_the_plate_stays_on_screen()
    {
        // The box grows OUTWARD from the text, so at a small margin it would hang off the
        // frame. 1080 * 0.055 = 59px of text, so the border is 18px and the inset must be
        // at least that.
        var mark = ClipPlanFactory.CreateWatermark(
            new WatermarkSettings
            {
                Kind = WatermarkKind.Text,
                Text = "site",
                MarginFraction = 0,
                BackplateOpacity = 0.4
            },
            Canvas.Hd1080p30, null, "wm/watermark.txt", TestFontFile)!;

        var graph = NewBuilder().BuildClip(Plan(watermark: mark)).FilterComplex;

        Assert.Contains("boxborderw=18", graph);
        Assert.Contains("y=18", graph);
    }

    [Fact]
    public void Adds_a_shadow_when_there_is_no_plate_to_read_against()
    {
        var graph = NewBuilder()
            .BuildClip(Plan(watermark: TextMark(backplate: 0))).FilterComplex;

        Assert.DoesNotContain("box=1", graph);
        Assert.Contains("shadowcolor=", graph);
    }

    [Fact]
    public void Degrades_to_no_watermark_rather_than_failing_without_drawtext()
    {
        var built = NewBuilder(RenderFeature.DrawText)
            .BuildClip(Plan(watermark: TextMark()));

        Assert.DoesNotContain("drawtext", built.FilterComplex);
        Assert.Contains("WATERMARK_UNAVAILABLE", built.Warnings);
    }

    // --- watermark: logo ----------------------------------------------------

    [Fact]
    public void Forces_an_alpha_plane_on_the_logo_before_fading_it()
    {
        // A logo saved as a palette or plain-RGB PNG has no alpha at all, and
        // colorchannelmixer would then have nothing to scale - the mark would composite as
        // a solid rectangle over the video.
        var graph = NewBuilder().BuildClip(Plan(watermark: LogoMark())).FilterComplex;

        var format = graph.IndexOf("format=rgba", StringComparison.Ordinal);
        var mixer = graph.IndexOf("colorchannelmixer=aa=", StringComparison.Ordinal);

        Assert.True(format >= 0 && mixer > format);
    }

    [Fact]
    public void Holds_the_single_frame_logo_for_the_whole_clip()
    {
        // Without eof_action=repeat the overlay - and therefore the output - ends after one
        // frame.
        var graph = NewBuilder().BuildClip(Plan(watermark: LogoMark())).FilterComplex;

        Assert.Contains("eof_action=repeat", graph);
        Assert.Contains("x=main_w-overlay_w-43:y=43", graph);
    }

    [Fact]
    public void Bounds_the_logo_width_so_a_wordmark_cannot_span_the_frame()
    {
        // 1920 * 0.35 = 672, rounded down to even.
        var graph = NewBuilder().BuildClip(Plan(watermark: LogoMark())).FilterComplex;

        Assert.Contains("scale=672:59:force_original_aspect_ratio=decrease", graph);
    }

    [Fact]
    public void Composites_the_mark_in_4_4_4_and_converts_once_at_the_end()
    {
        var graph = NewBuilder().BuildClip(Plan(watermark: LogoMark())).FilterComplex;

        Assert.Contains("format=yuv444p[base]", graph);
        Assert.Contains("format=yuv420p[vout]", graph);
    }

    // --- working pixel format ------------------------------------------------

    [Fact]
    public void Conforms_in_the_delivery_format_when_there_is_nothing_to_composite()
    {
        // 4:4:4 buys one thing: a mark's edges blended at full chroma resolution. With no
        // mark there is nothing to blend, and carrying it anyway makes scale, pad and fps
        // all run on three full planes instead of one and a half - about a quarter of the
        // conform pass, for a file written out as 4:2:0 either way.
        var graph = NewBuilder().BuildClip(Plan()).FilterComplex;

        Assert.Contains("format=yuv420p[base]", graph);
        Assert.DoesNotContain("yuv444p", graph);
    }

    [Fact]
    public void Does_not_pay_for_4_4_4_for_a_mark_it_turns_out_it_cannot_draw()
    {
        // The two decisions - which pixel format to conform in, and whether the mark gets
        // drawn - have to be the same decision. Made separately, a text mark with no font
        // upgrades the whole chain to 4:4:4 and then draws nothing with it.
        var mark = ClipPlanFactory.CreateWatermark(
            new WatermarkSettings { Kind = WatermarkKind.Text, Text = "site" },
            Canvas.Hd1080p30, null, "wm/watermark.txt", fontFileAbsolutePath: null)!;

        var built = NewBuilder().BuildClip(Plan(watermark: mark));

        Assert.DoesNotContain("yuv444p", built.FilterComplex);
        Assert.Contains("WATERMARK_UNAVAILABLE", built.Warnings);
    }

    [Fact]
    public void Keeps_4_4_4_out_of_the_blur_backdrop_chain_too_when_unmarked()
    {
        // The blurred backdrop is where full-chroma working space costs the most - gblur
        // runs at canvas resolution - and the overlay it feeds is an opaque rectangle
        // placement, not an alpha blend, so there is nothing to lose.
        var graph = NewBuilder().BuildClip(Plan(fit: ClipFit.BlurredBackdrop)).FilterComplex;

        Assert.Contains("gblur=", graph);
        Assert.DoesNotContain("yuv444p", graph);
    }

    [Fact]
    public void Uses_the_encoder_profile_it_is_given_rather_than_a_hardcoded_preset()
    {
        var built = NewBuilder().BuildClip(Plan() with
        {
            Encoder = EncoderProfile.Default with { Preset = "veryfast", Crf = 20 }
        });

        Assert.Contains("veryfast", built.OutputArguments);
        Assert.Contains("20", built.OutputArguments);
        Assert.DoesNotContain("medium", built.OutputArguments);
    }
}
