namespace AnimStudio.Application.Rendering.Models;

/// <summary>
/// Output encoding settings. These are deliberately identical for every scene, because
/// that is exactly what makes a stream-copy concat legal: same codec, resolution, pixel
/// format, frame rate, GOP and audio layout.
/// </summary>
public sealed record EncoderProfile(
    string VideoCodec = "libx264",
    string Preset = "medium",
    int Crf = 18,
    string PixelFormat = "yuv420p",
    string AudioCodec = "aac",
    int AudioBitrateKbps = 192,
    int AudioSampleRate = 48_000,
    int AudioChannels = 2)
{
    public static readonly EncoderProfile Default = new();
}
