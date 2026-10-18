using System.Buffers.Binary;
using System.Collections.Concurrent;

namespace AnimStudio.Infrastructure.Ffmpeg;

/// <summary>
/// The little of a TrueType/OpenType file a line needs before drawtext sees it: which code
/// points the face has a glyph for, how far each glyph advances, and the face's ascent and
/// descent - all in ems. Read straight from the <c>cmap</c>, <c>hmtx</c>, <c>hhea</c> and
/// <c>head</c> tables; a <c>.ttc</c> collection is read as its first face.
/// <para>
/// Advances are unshaped - no kerning, no ligatures, no conjuncts - so a measured width is
/// close to drawtext's, not equal to it. That is enough to place the pieces of a line drawn
/// in different faces next to each other.
/// </para>
/// </summary>
internal sealed class FontFileMetrics
{
    private static readonly ConcurrentDictionary<string, FontFileMetrics?> Cache = new(StringComparer.OrdinalIgnoreCase);

    private readonly byte[] _cmap;
    private readonly int _cmapFormat;
    private readonly ushort[] _advances;
    private readonly double _unitsPerEm;

    public double Ascent { get; }
    public double Descent { get; }

    private FontFileMetrics(byte[] cmap, int cmapFormat, ushort[] advances, int unitsPerEm, int ascender, int descender)
    {
        _cmap = cmap;
        _cmapFormat = cmapFormat;
        _advances = advances;
        _unitsPerEm = unitsPerEm;
        Ascent = ascender / _unitsPerEm;
        Descent = Math.Abs(descender) / _unitsPerEm;
    }

    /// <summary>The metrics of a font file, or null when it is missing or not a font this can read.</summary>
    public static FontFileMetrics? Load(string path) => Cache.GetOrAdd(path, static p =>
    {
        try
        {
            return File.Exists(p) ? Parse(File.ReadAllBytes(p)) : null;
        }
        catch (Exception ex) when (ex is IOException or UnauthorizedAccessException
                                       or ArgumentOutOfRangeException or IndexOutOfRangeException)
        {
            // A face that cannot be read is one the splitter does not use; the line is
            // then drawn whole in its own face, exactly as before.
            return null;
        }
    });

    public bool Has(int codePoint) => Glyph(codePoint) != 0;

    /// <summary>Advance of <paramref name="codePoint"/> in ems; zero when the face has no glyph for it.</summary>
    public double Advance(int codePoint)
    {
        var glyph = Glyph(codePoint);
        if (glyph == 0 || _advances.Length == 0) return 0;
        return _advances[Math.Min(glyph, _advances.Length - 1)] / _unitsPerEm;
    }

    private int Glyph(int codePoint) => _cmapFormat == 12 ? Glyph12(codePoint) : Glyph4(codePoint);

    private int Glyph12(int c)
    {
        var groups = (int)U32(_cmap, 12);
        int lo = 0, hi = groups - 1;
        while (lo <= hi)
        {
            var mid = (lo + hi) >>> 1;
            var at = 16 + mid * 12;
            var start = U32(_cmap, at);
            var end = U32(_cmap, at + 4);
            if (c < start) hi = mid - 1;
            else if (c > end) lo = mid + 1;
            else return (int)(U32(_cmap, at + 8) + (uint)c - start);
        }
        return 0;
    }

    private int Glyph4(int c)
    {
        if (c > 0xFFFF) return 0;
        var segments = U16(_cmap, 6) / 2;
        var ends = 14;
        var starts = ends + segments * 2 + 2;
        var deltas = starts + segments * 2;
        var ranges = deltas + segments * 2;

        for (var i = 0; i < segments; i++)
        {
            if (U16(_cmap, ends + i * 2) < c) continue;
            var start = U16(_cmap, starts + i * 2);
            if (start > c) return 0;

            var delta = U16(_cmap, deltas + i * 2);
            var rangeAt = ranges + i * 2;
            var range = U16(_cmap, rangeAt);
            if (range == 0) return (c + delta) & 0xFFFF;

            var glyph = U16(_cmap, rangeAt + range + (c - start) * 2);
            return glyph == 0 ? 0 : (glyph + delta) & 0xFFFF;
        }
        return 0;
    }

    private static FontFileMetrics? Parse(byte[] file)
    {
        var face = 0;
        if (file.Length >= 16 && U32(file, 0) == 0x74746366) // "ttcf"
            face = (int)U32(file, 12);

        int head = -1, hhea = -1, hmtx = -1, cmap = -1;
        var tables = U16(file, face + 4);
        for (var i = 0; i < tables; i++)
        {
            var record = face + 12 + i * 16;
            var offset = (int)U32(file, record + 8);
            switch (U32(file, record))
            {
                case 0x68656164: head = offset; break; // head
                case 0x68686561: hhea = offset; break; // hhea
                case 0x686D7478: hmtx = offset; break; // hmtx
                case 0x636D6170: cmap = offset; break; // cmap
            }
        }
        if (head < 0 || hhea < 0 || hmtx < 0 || cmap < 0) return null;

        var unitsPerEm = U16(file, head + 18);
        if (unitsPerEm == 0) return null;

        var metricCount = U16(file, hhea + 34);
        var advances = new ushort[metricCount];
        for (var i = 0; i < metricCount; i++) advances[i] = (ushort)U16(file, hmtx + i * 4);

        // Full-repertoire Unicode first, then the BMP, then a symbol font's own map.
        (int Offset, int Format)? best = null;
        var rank = int.MaxValue;
        var subtables = U16(file, cmap + 2);
        for (var i = 0; i < subtables; i++)
        {
            var record = cmap + 4 + i * 8;
            var platform = U16(file, record);
            var encoding = U16(file, record + 2);
            var offset = cmap + (int)U32(file, record + 4);
            var format = U16(file, offset);

            var r = (platform, encoding, format) switch
            {
                (3, 10, 12) or (0, 4, 12) or (0, 6, 12) => 0,
                (3, 1, 4) or (0, 3, 4) => 1,
                (0, _, 4) => 2,
                (3, 0, 4) => 3,
                _ => int.MaxValue
            };
            if (r < rank) (rank, best) = (r, (offset, format));
        }
        if (best is not { } chosen) return null;

        var length = chosen.Format == 12 ? (int)U32(file, chosen.Offset + 4) : U16(file, chosen.Offset + 2);
        var subtable = file.AsSpan(chosen.Offset, Math.Min(length, file.Length - chosen.Offset)).ToArray();

        return new FontFileMetrics(subtable, chosen.Format, advances, unitsPerEm,
            (short)U16(file, hhea + 4), (short)U16(file, hhea + 6));
    }

    private static int U16(byte[] b, int at) => BinaryPrimitives.ReadUInt16BigEndian(b.AsSpan(at, 2));

    private static uint U32(byte[] b, int at) => BinaryPrimitives.ReadUInt32BigEndian(b.AsSpan(at, 4));
}
