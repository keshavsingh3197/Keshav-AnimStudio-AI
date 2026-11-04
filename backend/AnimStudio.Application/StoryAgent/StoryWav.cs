using System.Buffers.Binary;

namespace AnimStudio.Application.StoryAgent;

/// <summary>Joins PCM WAV clips of one format end to end, with a short silence between them.</summary>
public static class StoryWav
{
    private readonly record struct Format(ushort Encoding, ushort Channels, uint SampleRate, ushort BlockAlign, ushort Bits);

    /// <summary>One WAV, or null when a clip is not plain PCM or does not share the first clip's format.</summary>
    public static byte[]? Join(IReadOnlyList<byte[]> clips, double gapSeconds)
    {
        if (clips.Count == 0) return null;
        if (clips.Count == 1) return clips[0];

        Format? format = null;
        var datas = new List<ReadOnlyMemory<byte>>(clips.Count);
        foreach (var clip in clips)
        {
            if (Read(clip) is not { } read || read.Format.Encoding != 1 || read.Format.BlockAlign == 0) return null;
            if (format is { } first && first != read.Format) return null;
            format = read.Format;
            datas.Add(read.Data);
        }

        var f = format!.Value;
        var gap = (int)Math.Round(Math.Max(0, gapSeconds) * f.SampleRate) * f.BlockAlign;
        var size = datas.Sum(d => (long)d.Length) + (long)gap * (datas.Count - 1);
        if (size > int.MaxValue - 44) return null;

        var wav = new byte[44 + size];
        var span = wav.AsSpan();
        "RIFF"u8.CopyTo(span);
        BinaryPrimitives.WriteUInt32LittleEndian(span[4..], (uint)(36 + size));
        "WAVE"u8.CopyTo(span[8..]);
        "fmt "u8.CopyTo(span[12..]);
        BinaryPrimitives.WriteUInt32LittleEndian(span[16..], 16);
        BinaryPrimitives.WriteUInt16LittleEndian(span[20..], 1);
        BinaryPrimitives.WriteUInt16LittleEndian(span[22..], f.Channels);
        BinaryPrimitives.WriteUInt32LittleEndian(span[24..], f.SampleRate);
        BinaryPrimitives.WriteUInt32LittleEndian(span[28..], f.SampleRate * f.BlockAlign);
        BinaryPrimitives.WriteUInt16LittleEndian(span[32..], f.BlockAlign);
        BinaryPrimitives.WriteUInt16LittleEndian(span[34..], f.Bits);
        "data"u8.CopyTo(span[36..]);
        BinaryPrimitives.WriteUInt32LittleEndian(span[40..], (uint)size);

        var offset = 44;
        for (var i = 0; i < datas.Count; i++)
        {
            // The silence between clips is the zeroes the array already holds.
            if (i > 0) offset += gap;
            datas[i].Span.CopyTo(span[offset..]);
            offset += datas[i].Length;
        }

        return wav;
    }

    private static (Format Format, ReadOnlyMemory<byte> Data)? Read(byte[] bytes)
    {
        var span = bytes.AsSpan();
        if (span.Length < 44 || !span[..4].SequenceEqual("RIFF"u8) || !span.Slice(8, 4).SequenceEqual("WAVE"u8)) return null;

        Format? format = null;
        var offset = 12;
        while (offset + 8 <= span.Length)
        {
            var id = span.Slice(offset, 4);
            var size = BinaryPrimitives.ReadUInt32LittleEndian(span.Slice(offset + 4, 4));
            var body = offset + 8;

            if (id.SequenceEqual("fmt "u8) && body + 16 <= span.Length)
            {
                format = new Format(
                    BinaryPrimitives.ReadUInt16LittleEndian(span.Slice(body, 2)),
                    BinaryPrimitives.ReadUInt16LittleEndian(span.Slice(body + 2, 2)),
                    BinaryPrimitives.ReadUInt32LittleEndian(span.Slice(body + 4, 4)),
                    BinaryPrimitives.ReadUInt16LittleEndian(span.Slice(body + 12, 2)),
                    BinaryPrimitives.ReadUInt16LittleEndian(span.Slice(body + 14, 2)));
            }
            else if (id.SequenceEqual("data"u8))
            {
                if (format is not { } f) return null;
                // A declared size past the end is a stream that never filled it in; take what is there, whole frames only.
                var length = (int)Math.Min(size, (uint)(span.Length - body));
                length -= f.BlockAlign == 0 ? 0 : length % f.BlockAlign;
                return (f, bytes.AsMemory(body, length));
            }

            if (size == 0 && !id.SequenceEqual("data"u8)) return null;
            var next = body + (long)size + (size % 2);
            if (next > span.Length) return null;
            offset = (int)next;
        }

        return null;
    }
}
