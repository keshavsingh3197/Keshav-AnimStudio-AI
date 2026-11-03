using System.Buffers.Binary;
using System.IO.Compression;

namespace AnimStudio.Application.StoryAgent;

/// <summary>
/// A plain gradient picture, made in code, for a scene that has no picture of its own. A scene without a background
/// cannot be rendered, so "no picture" has to become something: a soft glow in a devotional colour, which the
/// captions and the music sit on well, rather than a failed video or a black screen.
/// </summary>
/// <remarks>
/// A smooth gradient has nothing to lose by being small, so it is made at a fraction of the video's size and the
/// renderer scales it up. Written straight to PNG, so it needs no image library and no ffmpeg.
/// </remarks>
public static class StoryPlaceholderImage
{
    public const int LongSide = 480;
    public const int ShortSide = 270;

    private static readonly (byte R, byte G, byte B)[] Centers =
        [(0x4B, 0x2E, 0x83), (0x9A, 0x3B, 0x1E), (0x1F, 0x6F, 0x78), (0xC7, 0x7A, 0x1B)];

    private static readonly (byte R, byte G, byte B)[] Edges =
        [(0x0F, 0x0A, 0x24), (0x2A, 0x0A, 0x0A), (0x06, 0x1A, 0x24), (0x2B, 0x14, 0x06)];

    private static readonly byte[] Signature = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];

    /// <summary>A PNG with the video's proportions; the palette changes from scene to scene so a run of them is not monotonous.</summary>
    public static byte[] Create(int sceneNumber, bool vertical)
    {
        var width = vertical ? ShortSide : LongSide;
        var height = vertical ? LongSide : ShortSide;
        var palette = (int)(((sceneNumber - 1L) % Centers.Length + Centers.Length) % Centers.Length);
        var (cr, cg, cb) = Centers[palette];
        var (er, eg, eb) = Edges[palette];

        var stride = width * 3 + 1;
        var raw = new byte[stride * height];
        var halfW = (width - 1) / 2.0;
        var halfH = (height - 1) / 2.0;

        for (var y = 0; y < height; y++)
        {
            var row = y * stride;
            raw[row] = 0;
            for (var x = 0; x < width; x++)
            {
                var dx = (x - halfW) / halfW;
                var dy = (y - halfH) / halfH;
                var distance = Math.Min(1.0, Math.Sqrt(dx * dx + dy * dy) / Math.Sqrt(2.0) * 1.35);
                var glow = 1.0 - Math.Pow(distance, 1.5);

                var at = row + 1 + x * 3;
                raw[at] = (byte)(er + (cr - er) * glow);
                raw[at + 1] = (byte)(eg + (cg - eg) * glow);
                raw[at + 2] = (byte)(eb + (cb - eb) * glow);
            }
        }

        using var png = new MemoryStream();
        png.Write(Signature);

        Span<byte> header = stackalloc byte[13];
        BinaryPrimitives.WriteInt32BigEndian(header, width);
        BinaryPrimitives.WriteInt32BigEndian(header[4..], height);
        header[8] = 8; // bit depth
        header[9] = 2; // truecolour (RGB)
        header[10] = 0; // deflate
        header[11] = 0; // adaptive filtering
        header[12] = 0; // no interlace
        WriteChunk(png, "IHDR"u8, header);

        using (var deflated = new MemoryStream())
        {
            using (var zlib = new ZLibStream(deflated, CompressionLevel.Optimal, leaveOpen: true))
                zlib.Write(raw);
            WriteChunk(png, "IDAT"u8, deflated.ToArray());
        }

        WriteChunk(png, "IEND"u8, []);
        return png.ToArray();
    }

    private static void WriteChunk(Stream output, ReadOnlySpan<byte> type, ReadOnlySpan<byte> data)
    {
        Span<byte> word = stackalloc byte[4];
        BinaryPrimitives.WriteInt32BigEndian(word, data.Length);
        output.Write(word);
        output.Write(type);
        output.Write(data);

        var crc = Crc32(type, 0xFFFFFFFFu);
        crc = Crc32(data, crc);
        BinaryPrimitives.WriteUInt32BigEndian(word, crc ^ 0xFFFFFFFFu);
        output.Write(word);
    }

    private static readonly uint[] CrcTable = BuildCrcTable();

    private static uint[] BuildCrcTable()
    {
        var table = new uint[256];
        for (uint n = 0; n < 256; n++)
        {
            var c = n;
            for (var k = 0; k < 8; k++) c = (c & 1) != 0 ? 0xEDB88320u ^ (c >> 1) : c >> 1;
            table[n] = c;
        }
        return table;
    }

    private static uint Crc32(ReadOnlySpan<byte> data, uint crc)
    {
        foreach (var b in data) crc = CrcTable[(crc ^ b) & 0xFF] ^ (crc >> 8);
        return crc;
    }
}
