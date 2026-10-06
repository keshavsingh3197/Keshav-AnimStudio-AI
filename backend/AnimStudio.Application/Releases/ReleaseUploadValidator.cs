using AnimStudio.Application.Uploads;
using AnimStudio.Domain.Assets;

namespace AnimStudio.Application.Releases;

/// <summary>
/// Accepts the files a release starts from. Masters arrive as FLAC and AIFF as often as
/// WAV, which the general asset allowlist deliberately does not take, so audio gets its
/// own allowlist here; cover art goes through the shared <see cref="UploadValidator"/>.
/// Like that validator, the file's own bytes decide - never the name or declared type.
/// </summary>
public static class ReleaseUploadValidator
{
    public const long MaxAudioBytes = 512L * 1024 * 1024;
    public const long MaxCoverBytes = 25L * 1024 * 1024;

    private sealed record AudioType(string Extension, string Mime, bool Lossless, string[] Extensions);

    private static readonly AudioType Wav = new(".wav", "audio/wav", true, [".wav", ".wave"]);
    private static readonly AudioType Flac = new(".flac", "audio/flac", true, [".flac"]);
    private static readonly AudioType Aiff = new(".aiff", "audio/aiff", true, [".aif", ".aiff"]);
    private static readonly AudioType Mp3 = new(".mp3", "audio/mpeg", false, [".mp3"]);
    private static readonly AudioType M4a = new(".m4a", "audio/mp4", false, [".m4a"]);

    private static readonly AudioType[] AudioTypes = [Wav, Flac, Aiff, Mp3, M4a];

    public sealed record AudioCheck(bool IsValid, string? Extension, bool Lossless, string? Code, string? Message);

    public static async Task<AudioCheck> ValidateAudioAsync(
        string? fileName, long length, Stream content, CancellationToken ct)
    {
        if (length <= 0)
            return Fail("audio-missing", "Choose the audio file for this release.");
        if (length > MaxAudioBytes)
            return Fail("audio-too-large", "The audio file is larger than 512 MB.");

        var extension = Path.GetExtension(fileName ?? string.Empty).ToLowerInvariant();
        var claimed = Array.Find(AudioTypes, t => t.Extensions.Contains(extension));
        if (claimed is null)
            return Fail("audio-type-not-allowed", "Use a WAV, FLAC, AIFF, MP3 or M4A file.");

        var header = new byte[16];
        var read = await content.ReadAtLeastAsync(header, header.Length, throwOnEndOfStream: false, ct)
            .ConfigureAwait(false);
        if (read < 12)
            return Fail("audio-unreadable", "That audio file could not be read.");

        var sniffed = Sniff(header.AsSpan(0, read));
        if (sniffed is null || sniffed != claimed)
            return Fail("audio-content-mismatch", "That file's contents don't match its extension.");

        return new AudioCheck(true, sniffed.Extension, sniffed.Lossless, null, null);
    }

    public static async Task<UploadValidationResult> ValidateCoverAsync(
        string? fileName, string? contentType, long length, Stream content, CancellationToken ct)
    {
        if (length <= 0)
            return UploadValidationResult.Invalid("cover-missing", "Choose a cover image.");
        if (length > MaxCoverBytes)
            return UploadValidationResult.Invalid("cover-too-large", "The cover image is larger than 25 MB.");

        var result = await UploadValidator.ValidateAsync(fileName, contentType, content, ct).ConfigureAwait(false);
        return result.IsValid && result.Kind != AssetKind.Image
            ? UploadValidationResult.Invalid("cover-not-image", "Cover art must be a PNG, JPG or WEBP image.")
            : result;
    }

    /// <summary>
    /// Checks the requested technical targets against what distributors accept. Out-of-range
    /// values are an error rather than silently corrected, so the master is never made to
    /// a spec the user didn't ask for.
    /// </summary>
    public static string? ValidateOptions(ReleaseKitOptions options)
    {
        if (double.IsNaN(options.TargetLufs) || options.TargetLufs is < -24 or > -6)
            return "Target loudness must be between -24 and -6 LUFS.";
        if (double.IsNaN(options.TruePeakDb) || options.TruePeakDb is < -3 or > 0)
            return "True-peak ceiling must be between -3 and 0 dBTP.";
        if (options.SampleRate is not (44_100 or 48_000 or 96_000))
            return "Sample rate must be 44100, 48000 or 96000 Hz.";
        if (options.BitDepth is not (16 or 24))
            return "Bit depth must be 16 or 24.";
        return null;
    }

    private static AudioType? Sniff(ReadOnlySpan<byte> h)
    {
        if (h.StartsWith("RIFF"u8) && h[8..].StartsWith("WAVE"u8)) return Wav;
        if (h.StartsWith("fLaC"u8)) return Flac;
        if (h.StartsWith("FORM"u8) && (h[8..].StartsWith("AIFF"u8) || h[8..].StartsWith("AIFC"u8))) return Aiff;
        if (h[4..].StartsWith("ftyp"u8)) return M4a;
        if (h.StartsWith("ID3"u8)) return Mp3;

        // A bare MPEG audio frame: 11 sync bits, then a layer field that is not "reserved".
        if (h[0] == 0xFF && (h[1] & 0xE0) == 0xE0 && (h[1] & 0x06) != 0) return Mp3;

        return null;
    }

    private static AudioCheck Fail(string code, string message) => new(false, null, false, code, message);
}
