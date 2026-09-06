using System.Buffers.Binary;

namespace AnimStudio.Application.Ai;

/// <summary>
/// Decides whether bytes returned by a speech provider are actually audio, and how long
/// that audio runs.
/// </summary>
/// <remarks>
/// <para>
/// The same reasoning as <see cref="AiImageValidator"/>: the <c>Content-Type</c> header is
/// the provider's claim rather than a fact, and an error page written into a scene's audio
/// track fails much later and much less legibly than it should.
/// </para>
/// <para>
/// Duration is read here rather than probed with FFmpeg because this pipeline times scenes
/// by their narration. Knowing the length at the moment the audio arrives is what lets a
/// scene be sized to its line without a second pass over the file - and for WAV it is a
/// header read, not a decode.
/// </para>
/// </remarks>
public static class AiAudioValidator
{
    public const int MinBytes = 64;

    public const string Wav = "audio/wav";
    public const string Mp3 = "audio/mpeg";
    public const string Ogg = "audio/ogg";
    public const string Flac = "audio/flac";

    public static string? Sniff(ReadOnlySpan<byte> bytes)
    {
        if (bytes.Length < MinBytes) return null;

        // WAV: "RIFF" .... "WAVE"
        if (bytes[..4].SequenceEqual("RIFF"u8) && bytes.Slice(8, 4).SequenceEqual("WAVE"u8))
            return Wav;

        if (bytes[..4].SequenceEqual("OggS"u8)) return Ogg;
        if (bytes[..4].SequenceEqual("fLaC"u8)) return Flac;

        // MP3: an ID3 tag, or a frame sync (11 set bits) at the very start.
        if (bytes[..3].SequenceEqual("ID3"u8)) return Mp3;
        if (bytes[0] == 0xFF && (bytes[1] & 0xE0) == 0xE0) return Mp3;

        return null;
    }

    public static string Require(byte[]? bytes, string providerId)
    {
        if (bytes is null || bytes.Length == 0)
            throw new AiProviderException("empty-response", $"'{providerId}' returned no audio.");

        return Sniff(bytes)
            ?? throw new AiProviderException("not-audio",
                $"'{providerId}' returned {bytes.Length} bytes that are not a recognised audio format.");
    }

    /// <summary>
    /// The length of a WAV in seconds, read from its header, or null when the bytes are not
    /// a WAV this can measure.
    /// </summary>
    /// <remarks>
    /// Only WAV is measured. A compressed format's length cannot be read from a header
    /// without decoding it - a VBR MP3 in particular has no honest answer there - and
    /// returning a confident wrong duration would mis-time every scene it touched. Null
    /// means "ask FFmpeg", which is why speech is requested as WAV in the first place.
    /// </remarks>
    public static double? TryGetWavDuration(ReadOnlySpan<byte> bytes)
    {
        if (bytes.Length < 44) return null;
        if (!bytes[..4].SequenceEqual("RIFF"u8) || !bytes.Slice(8, 4).SequenceEqual("WAVE"u8))
            return null;

        uint byteRate = 0;
        var offset = 12;

        while (offset + 8 <= bytes.Length)
        {
            var id = bytes.Slice(offset, 4);
            var size = BinaryPrimitives.ReadUInt32LittleEndian(bytes.Slice(offset + 4, 4));
            var body = offset + 8;

            if (id.SequenceEqual("fmt "u8) && body + 16 <= bytes.Length)
            {
                byteRate = BinaryPrimitives.ReadUInt32LittleEndian(bytes.Slice(body + 8, 4));
            }
            else if (id.SequenceEqual("data"u8))
            {
                if (byteRate == 0) return null;

                // A declared size longer than the file means a truncated download; measure
                // what is actually there rather than what the header hoped for.
                var actual = Math.Min((long)size, bytes.Length - body);

                return actual <= 0 ? null : actual / (double)byteRate;
            }

            // Chunks are word-aligned, and a zero size would spin this loop forever.
            if (size == 0) return null;

            offset = body + (int)size + ((size % 2 == 0) ? 0 : 1);
        }

        return null;
    }

    /// <summary>The length in seconds when it can be known from the bytes alone.</summary>
    public static double? TryGetDuration(byte[] bytes, string mimeType) =>
        mimeType == Wav ? TryGetWavDuration(bytes) : null;
}
