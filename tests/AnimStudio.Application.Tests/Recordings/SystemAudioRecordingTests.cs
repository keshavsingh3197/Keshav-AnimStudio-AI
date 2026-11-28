using AnimStudio.Application.Recordings;

namespace AnimStudio.Application.Tests.Recordings;

public sealed class SystemAudioRecordingTests
{
    [Fact]
    public void Sniff_recognises_webm_from_its_ebml_magic()
    {
        byte[] head = [0x1A, 0x45, 0xDF, 0xA3, 0x9F, 0x42, 0x86, 0x81];
        Assert.Equal(SystemAudioContainer.WebM, SystemAudioRecording.Sniff(head));
    }

    [Fact]
    public void Sniff_recognises_mp4_from_ftyp_at_offset_four()
    {
        byte[] head = [0x00, 0x00, 0x00, 0x20, (byte)'f', (byte)'t', (byte)'y', (byte)'p', (byte)'i', (byte)'s', (byte)'o', (byte)'m'];
        Assert.Equal(SystemAudioContainer.Mp4, SystemAudioRecording.Sniff(head));
    }

    [Theory]
    [InlineData(new byte[] { 0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x41, 0x56, 0x45 })] // WAV
    [InlineData(new byte[] { 0x49, 0x44, 0x33, 0x04, 0, 0, 0, 0 })]                         // MP3
    [InlineData(new byte[] { 0x4D, 0x5A, 0x90, 0x00 })]                                     // a Windows .exe
    [InlineData(new byte[] { 0x1A, 0x45 })]                                                 // too short
    [InlineData(new byte[0])]
    public void Sniff_refuses_anything_else(byte[] head)
    {
        Assert.Null(SystemAudioRecording.Sniff(head));
    }

    [Fact]
    public void Filter_only_trims_the_ends_and_never_changes_the_level()
    {
        Assert.Contains("silenceremove", SystemAudioRecording.Filter, StringComparison.Ordinal);
        Assert.DoesNotContain("loudnorm", SystemAudioRecording.Filter, StringComparison.Ordinal);
        Assert.DoesNotContain("acompressor", SystemAudioRecording.Filter, StringComparison.Ordinal);
        Assert.EndsWith($"aresample={SystemAudioRecording.SampleRate}", SystemAudioRecording.Filter, StringComparison.Ordinal);
    }
}
