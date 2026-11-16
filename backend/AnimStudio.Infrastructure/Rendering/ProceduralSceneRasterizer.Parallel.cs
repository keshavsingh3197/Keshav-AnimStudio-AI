namespace AnimStudio.Infrastructure.Rendering;

/// <summary>
/// Splits pixel work into horizontal bands that run on all cores. Every drawing primitive touches each pixel at most
/// once per call (or, for <see cref="DrawGlowLine"/>, in the same stamp order inside every band), so the frame is
/// byte-for-byte the same as drawing on one thread, only faster.
/// </summary>
public sealed partial class ProceduralSceneRasterizer
{
    /// <summary>Below this many pixel operations, starting threads costs more than it saves.</summary>
    private const long ParallelWorkThreshold = 64_000;

    /// <summary>Rows per band at minimum, so bands stay big enough to be worth a thread.</summary>
    private const int MinRowsPerBand = 8;

    /// <summary>Test hook: draw every band on the calling thread, to prove parallel output is identical.</summary>
    internal static bool ForceSingleThreadForTests;

    private static readonly int MaxBands = Math.Max(1, Environment.ProcessorCount * 2);

    /// <summary>
    /// Calls <paramref name="body"/> with <c>[bandStart, bandEnd)</c> row ranges covering <c>[minY, maxY)</c>, in
    /// parallel when <paramref name="work"/> (estimated pixel operations) is large. A body must only write rows inside
    /// its band and must not change shared state.
    /// </summary>
    private static void ForRowBands(int minY, int maxY, long work, Action<int, int> body)
    {
        var rows = maxY - minY;
        if (rows <= 0) return;

        var bands = work < ParallelWorkThreshold || ForceSingleThreadForTests ? 1 : Math.Min(MaxBands, rows / MinRowsPerBand);
        if (bands <= 1)
        {
            body(minY, maxY);
            return;
        }

        Parallel.For(0, bands, band =>
            body(minY + (int)((long)rows * band / bands), minY + (int)((long)rows * (band + 1) / bands)));
    }
}
