using AnimStudio.Application.Characters;
using AnimStudio.Application.Common;
using AnimStudio.Application.Voices;
using AnimStudio.Domain.Characters;
using AnimStudio.Infrastructure.Ffmpeg;

namespace AnimStudio.Application.Tests.Voices;

public class StudioVoiceGraphTests
{
    [Fact]
    public void Pitch_and_body_are_moved_separately_so_the_voice_sounds_like_another_person()
    {
        // Pitch down 5 with a body 2 semitones bigger: asetrate moves everything by the body,
        // rubberband puts the speed back and sets the remaining pitch with formants kept.
        var built = StudioVoiceGraph.Build([new StudioVoiceSegment(0, new CharacterVoice { PitchSemitones = -5, SizeSemitones = -2 })]);

        var rate = (int)Math.Round(48000 * Math.Pow(2, -2 / 12.0));
        var body = rate / 48000.0;
        Assert.Contains($"asetrate={rate},aresample=48000", built.FilterComplex);
        Assert.Contains($"rubberband=tempo={1 / body:0.######}:pitch={Math.Pow(2, -5 / 12.0) / body:0.######}:formant=preserved", built.FilterComplex);
    }

    [Fact]
    public void A_pitch_without_a_body_change_keeps_the_formants()
    {
        var built = StudioVoiceGraph.Build([new StudioVoiceSegment(0, new CharacterVoice { PitchSemitones = 12 })]);

        Assert.Contains("rubberband=pitch=2:formant=preserved", built.FilterComplex);
        Assert.DoesNotContain("asetrate", built.FilterComplex);
    }

    [Fact]
    public void Each_part_is_cut_at_its_switch_and_held_to_its_own_length()
    {
        var built = StudioVoiceGraph.Build(
        [
            new StudioVoiceSegment(0, null),
            new StudioVoiceSegment(2.5, new CharacterVoice { Echo = 0.5 }),
            new StudioVoiceSegment(7, null)
        ]);

        Assert.Contains("asplit=3[s0][s1][s2]", built.FilterComplex);
        Assert.Contains("[s0]atrim=start=0:end=2.5,asetpts=PTS-STARTPTS,apad=whole_dur=2.5,atrim=duration=2.5[v0]", built.FilterComplex);
        // The echo's tail is cut so the next part starts on time.
        Assert.Matches(@"\[s1\]atrim=start=2\.5:end=7,asetpts=PTS-STARTPTS,aecho=[^;]*,apad=whole_dur=4\.5,atrim=duration=4\.5\[v1\]", built.FilterComplex);
        // The last part simply ends with the recording.
        Assert.Contains("[s2]atrim=start=7,asetpts=PTS-STARTPTS[v2]", built.FilterComplex);
        Assert.Contains("[v0][v1][v2]concat=n=3:v=0:a=1,alimiter=limit=0.9:level=0[out]", built.FilterComplex);
        Assert.False(built.NeedsHall);
    }

    [Fact]
    public void A_hall_is_a_wet_layer_under_the_untouched_voice()
    {
        var built = StudioVoiceGraph.Build(
        [
            new StudioVoiceSegment(0, new CharacterVoice { Reverb = 0.5 }),
            new StudioVoiceSegment(3, new CharacterVoice { Reverb = 1 })
        ]);

        Assert.True(built.NeedsHall);
        Assert.Contains("[1:a]aformat=channel_layouts=mono,aresample=48000,asplit=2[ir0][ir1]", built.FilterComplex);
        Assert.Contains("[w0][ir0]afir=dry=1:wet=1:irnorm=0,volume=0.45[h0]", built.FilterComplex);
        Assert.Contains("[d0]volume=0.825[dd0]", built.FilterComplex);
        Assert.Contains("[dd0][h0]amix=inputs=2:normalize=0:duration=first,apad=whole_dur=3,atrim=duration=3[v0]", built.FilterComplex);
        Assert.Contains("[w1][ir1]afir", built.FilterComplex);
    }

    [Fact]
    public void Numbers_are_written_the_same_whatever_the_server_locale()
    {
        var previous = Thread.CurrentThread.CurrentCulture;
        Thread.CurrentThread.CurrentCulture = new System.Globalization.CultureInfo("de-DE");
        try
        {
            var built = StudioVoiceGraph.Build([new StudioVoiceSegment(0, new CharacterVoice { BassDecibels = 2.5 })]);
            Assert.Contains("bass=g=2.5:f=200", built.FilterComplex);
        }
        finally
        {
            Thread.CurrentThread.CurrentCulture = previous;
        }
    }

    [Fact]
    public void An_ai_part_comes_from_the_converter_and_keeps_only_its_effects()
    {
        var person = new CharacterVoice { PitchSemitones = -5, SizeSemitones = -2, BassDecibels = 3, Reverb = 0.4, AiSampleAssetId = "sample" };
        var built = StudioVoiceGraph.Build(
            [new StudioVoiceSegment(0, null), new StudioVoiceSegment(2, person), new StudioVoiceSegment(5, null)],
            new Dictionary<int, int> { [1] = 2 });

        // The recording no longer supplies part 1; input 2 (after the hall) does.
        Assert.Contains("[0:a]aformat=channel_layouts=mono,aresample=48000,asplit=2[s0][s2]", built.FilterComplex);
        Assert.Contains("[2:a]aformat=channel_layouts=mono,aresample=48000,asetpts=PTS-STARTPTS,bass=g=3:f=200,asplit=2[d1][w1]", built.FilterComplex);
        // The person's own voice sets pitch and body, so neither is shifted again.
        Assert.DoesNotContain("rubberband", built.FilterComplex);
        Assert.Contains("apad=whole_dur=3,atrim=duration=3[v1]", built.FilterComplex);
    }

    [Fact]
    public void A_converted_last_part_is_still_held_to_the_recording_length()
    {
        var built = StudioVoiceGraph.Build(
            [new StudioVoiceSegment(0, null), new StudioVoiceSegment(4, new CharacterVoice { AiSampleAssetId = "sample" })],
            new Dictionary<int, int> { [1] = 1 });

        Assert.Contains("asplit=2[s0][ref1]", built.FilterComplex);
        Assert.Contains("[ref1]atrim=start=4,asetpts=PTS-STARTPTS,volume=0[z1]", built.FilterComplex);
        Assert.Contains("[1:a]aformat=channel_layouts=mono,aresample=48000,asetpts=PTS-STARTPTS[y1]", built.FilterComplex);
        Assert.Contains("[z1][y1]amix=inputs=2:normalize=0:duration=first[v1]", built.FilterComplex);
    }

    [Fact]
    public void The_hall_impulse_is_a_mono_48k_wav()
    {
        var wav = StudioVoiceGraph.HallImpulse();

        Assert.Equal("RIFF"u8.ToArray(), wav[..4]);
        Assert.Equal(1, BitConverter.ToInt16(wav, 22));
        Assert.Equal(48000, BitConverter.ToInt32(wav, 24));
        Assert.Equal(44 + (int)(48000 * 2.8) * 2, wav.Length);
    }
}

public class StudioVoiceValidatorTests
{
    [Fact]
    public void A_timeline_must_start_at_the_beginning_and_move_forward()
    {
        Assert.Equal("voice-timeline-invalid", Refused([new(1, null)]));
        Assert.Equal("voice-timeline-invalid", Refused([new(0, null), new(3, null), new(3, null)]));
        Assert.Equal("voice-timeline-invalid", Refused([new(0, null), new(double.NaN, null)]));
        Assert.Equal("voice-timeline-empty", Refused([]));
    }

    [Fact]
    public void A_timeline_has_a_limit_on_switches()
    {
        var many = Enumerable.Range(0, StudioVoiceValidator.MaxSegments + 1)
            .Select(i => new StudioVoiceSegmentCommand(i, null)).ToList();

        Assert.Equal("voice-timeline-too-long", Refused(many));
    }

    [Fact]
    public void Each_voice_is_held_to_the_character_rules()
    {
        Assert.Equal("voice-out-of-range",
            Refused([new(0, new CharacterVoiceCommand { Enabled = true, SizeSemitones = 7 })]));
    }

    [Fact]
    public void An_ai_voice_needs_consent_for_its_sample()
    {
        Assert.Equal("voice-consent-required",
            Refused([new(0, new CharacterVoiceCommand { Enabled = true, AiSampleAssetId = "sample" })]));

        var segments = StudioVoiceValidator.Validate(
            [new(0, new CharacterVoiceCommand { Enabled = true, AiSampleAssetId = "sample", AiSampleConsent = true })]);
        Assert.Equal("sample", segments[0].Voice?.AiSampleAssetId);
        Assert.True(segments[0].Voice?.AiSampleConsent);
    }

    [Fact]
    public void A_valid_timeline_keeps_own_voice_parts_as_null()
    {
        var segments = StudioVoiceValidator.Validate(
        [
            new(0, new CharacterVoiceCommand { Enabled = true, PitchSemitones = -3, SizeSemitones = -1 }),
            new(4.2, null),
            new(6, new CharacterVoiceCommand { Enabled = false })
        ]);

        Assert.Equal(-1, segments[0].Voice?.SizeSemitones);
        Assert.Null(segments[1].Voice);
        Assert.Null(segments[2].Voice);
    }

    private static string Refused(List<StudioVoiceSegmentCommand> segments) =>
        Assert.Throws<EditingException>(() => StudioVoiceValidator.Validate(segments)).Code;
}
