namespace AnimStudio.Application.Rendering;

/// <summary>One on-screen piece of a long spoken line and the share of the line's time it is shown for.</summary>
public sealed record CaptionChunk(string Text, double StartSeconds, double EndSeconds);

/// <summary>
/// Splits a long spoken line into captions that fit on screen, shown one after another while the line is spoken,
/// so the whole line is readable instead of being cut off with an ellipsis. Chunks break at sentence ends first,
/// then at commas, then between words, and each one is timed in proportion to its length.
/// </summary>
public static class CaptionChunker
{
    private static readonly char[] SentenceEnds = ['.', '!', '?', '।', '॥'];
    private static readonly char[] ClauseEnds = [',', ';', ':', '—'];

    public static IReadOnlyList<CaptionChunk> Split(string? text, double startSeconds, double endSeconds, int maxChars)
    {
        var clean = string.Join(' ', (text ?? string.Empty).Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries));
        if (clean.Length == 0) return [];
        if (endSeconds < startSeconds) endSeconds = startSeconds;
        maxChars = Math.Max(16, maxChars);
        if (clean.Length <= maxChars) return [new CaptionChunk(clean, startSeconds, endSeconds)];

        var pieces = new List<string>();
        var rest = clean;
        while (rest.Length > maxChars)
        {
            var cut = LastBreak(rest, maxChars, SentenceEnds, minFraction: 0.45)
                ?? LastBreak(rest, maxChars, ClauseEnds, minFraction: 0.45)
                ?? LastSpace(rest, maxChars)
                ?? maxChars;
            pieces.Add(rest[..cut].Trim());
            rest = rest[cut..].TrimStart();
        }
        if (rest.Length > 0) pieces.Add(rest);

        var total = pieces.Sum(p => (double)p.Length);
        var span = endSeconds - startSeconds;
        var chunks = new List<CaptionChunk>(pieces.Count);
        var at = startSeconds;
        for (var i = 0; i < pieces.Count; i++)
        {
            var end = i == pieces.Count - 1 ? endSeconds : at + span * pieces[i].Length / total;
            chunks.Add(new CaptionChunk(pieces[i], Math.Round(at, 3), Math.Round(end, 3)));
            at = end;
        }
        return chunks;
    }

    /// <summary>Index just after the last break character within the limit, if followed by whitespace/end and not inside a time or decimal (e.g. 05:56 AM).</summary>
    private static int? LastBreak(string text, int maxChars, char[] breaks, double minFraction)
    {
        var limit = Math.Min(maxChars, text.Length) - 1;
        while (limit >= 0)
        {
            var idx = text.LastIndexOfAny(breaks, limit);
            if (idx < 0 || idx < maxChars * minFraction)
                return null;
            if (idx + 1 >= text.Length || char.IsWhiteSpace(text[idx + 1]))
                return idx + 1;
            limit = idx - 1;
        }
        return null;
    }

    private static int? LastSpace(string text, int maxChars)
    {
        var idx = text.LastIndexOf(' ', Math.Min(maxChars, text.Length - 1));
        return idx > 0 ? idx : null;
    }
}
