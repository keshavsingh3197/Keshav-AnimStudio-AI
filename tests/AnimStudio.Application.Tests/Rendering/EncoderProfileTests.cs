using AnimStudio.Application.Rendering.Models;

namespace AnimStudio.Application.Tests.Rendering;

/// <summary>
/// The intermediate profile, which exists to make the conform pass cheap without changing
/// what the viewer gets.
/// </summary>
public class EncoderProfileTests
{
    [Fact]
    public void An_intermediate_changes_the_preset_and_nothing_else()
    {
        // This is the whole safety argument. A stream-copy concat is legal only while every
        // input agrees on codec, pixel format and audio layout, so the intermediate profile
        // is allowed to touch exactly one field. If it ever starts changing the codec or the
        // sample rate to save time, the join stops being a copy and starts being silent
        // corruption.
        var delivery = EncoderProfile.Default;
        var intermediate = delivery.ForIntermediate("veryfast");

        Assert.Equal("veryfast", intermediate.Preset);
        Assert.Equal(delivery with { Preset = "veryfast" }, intermediate);
    }

    [Fact]
    public void An_intermediate_keeps_the_crf()
    {
        // Preset and CRF are not interchangeable knobs. Under CRF the preset buys
        // compression efficiency at a FIXED quality target, so dropping it makes a bigger
        // file that looks the same. Dropping the CRF would make a worse-looking one - which
        // would matter, because a transition-free stitch stream-copies these very files
        // straight to the viewer.
        var intermediate = EncoderProfile.Default.ForIntermediate("ultrafast");

        Assert.Equal(EncoderProfile.Default.Crf, intermediate.Crf);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public void An_unset_intermediate_preset_leaves_the_profile_alone(string? preset)
    {
        // Configuring the setting to empty means "do not do this", not "encode with no
        // preset" - which ffmpeg would reject on every clip of every job.
        Assert.Equal(EncoderProfile.Default, EncoderProfile.Default.ForIntermediate(preset!));
    }
}
