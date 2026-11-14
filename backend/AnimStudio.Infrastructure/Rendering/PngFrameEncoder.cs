using System.Buffers.Binary;
using System.IO.Compression;

namespace AnimStudio.Infrastructure.Rendering;

/// <summary>
/// Pure managed RGBA-to-PNG encoder using .NET's built-in ZLibStream and IEEE CRC32.
/// Enables deterministic square promo card PNG generation even without native graphics libraries.
/// </summary>
internal static class PngFrameEncoder
{
    private static readonly byte[] PngSignature = [137, 80, 78, 71, 13, 10, 26, 10];
    private static readonly uint[] CrcTable = BuildCrcTable();

    public static byte[] EncodeRgba(ReadOnlySpan<byte> rgba, int width, int height)
    {
        if (width <= 0 || height <= 0)
            throw new ArgumentOutOfRangeException(nameof(width), "Image dimensions must be positive.");
        if (rgba.Length < width * height * 4)
            throw new ArgumentException("RGBA buffer is smaller than width * height * 4.", nameof(rgba));

        var stride = width * 4;
        var rawScanlines = new byte[(stride + 1) * height];
        for (var y = 0; y < height; y++)
        {
            var dstOffset = y * (stride + 1);
            rawScanlines[dstOffset] = 0; // PNG Filter type 0 (None)
            rgba.Slice(y * stride, stride).CopyTo(rawScanlines.AsSpan(dstOffset + 1, stride));
        }

        byte[] compressed;
        using (var zlibOut = new MemoryStream())
        {
            using (var zlib = new ZLibStream(zlibOut, CompressionLevel.Optimal, leaveOpen: true))
                zlib.Write(rawScanlines, 0, rawScanlines.Length);
            compressed = zlibOut.ToArray();
        }

        using var ms = new MemoryStream(compressed.Length + 64);
        ms.Write(PngSignature, 0, PngSignature.Length);

        Span<byte> ihdr = stackalloc byte[13];
        BinaryPrimitives.WriteInt32BigEndian(ihdr[..4], width);
        BinaryPrimitives.WriteInt32BigEndian(ihdr.Slice(4, 4), height);
        ihdr[8] = 8;  // bit depth
        ihdr[9] = 6;  // RGBA color type
        ihdr[10] = 0; // compression
        ihdr[11] = 0; // filter
        ihdr[12] = 0; // interlace
        WriteChunk(ms, "IHDR", ihdr);
        WriteChunk(ms, "IDAT", compressed);
        WriteChunk(ms, "IEND", ReadOnlySpan<byte>.Empty);
        return ms.ToArray();
    }

    private static void WriteChunk(Stream stream, string type, ReadOnlySpan<byte> data)
    {
        Span<byte> header = stackalloc byte[8];
        BinaryPrimitives.WriteInt32BigEndian(header[..4], data.Length);
        header[4] = (byte)type[0];
        header[5] = (byte)type[1];
        header[6] = (byte)type[2];
        header[7] = (byte)type[3];

        stream.Write(header[..4]);
        stream.Write(header.Slice(4, 4));
        if (!data.IsEmpty) stream.Write(data);

        var crc = ComputeCrc(header.Slice(4, 4), data);
        Span<byte> crcBytes = stackalloc byte[4];
        BinaryPrimitives.WriteUInt32BigEndian(crcBytes, crc);
        stream.Write(crcBytes);
    }

    private static uint ComputeCrc(ReadOnlySpan<byte> chunkType, ReadOnlySpan<byte> data)
    {
        var c = 0xFFFFFFFFu;
        foreach (var b in chunkType) c = CrcTable[(c ^ b) & 0xFF] ^ (c >> 8);
        foreach (var b in data) c = CrcTable[(c ^ b) & 0xFF] ^ (c >> 8);
        return c ^ 0xFFFFFFFFu;
    }

    private static uint[] BuildCrcTable()
    {
        var table = new uint[256];
        for (uint n = 0; n < 256; n++)
        {
            var c = n;
            for (var k = 0; k < 8; k++)
                c = (c & 1) != 0 ? 0xEDB88320u ^ (c >> 1) : c >> 1;
            table[n] = c;
        }
        return table;
    }
}
