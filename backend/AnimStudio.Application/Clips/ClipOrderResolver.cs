namespace AnimStudio.Application.Clips;

/// <summary>One clip as the resolver sees it. Only the display name is ever matched on.</summary>
public sealed record ClipCandidate(string AssetId, string Name);

public enum ClipOrderMatch
{
    /// <summary>The line named exactly one clip that had not been claimed yet.</summary>
    Matched = 0,

    /// <summary>The line could be read as more than one clip, so it was left alone.</summary>
    Ambiguous = 1,

    /// <summary>Nothing in the selection resembles this line.</summary>
    Unmatched = 2,

    /// <summary>This line names a clip an earlier line already placed.</summary>
    Duplicate = 3
}

public sealed record ClipOrderLine(int Number, string Text, string? AssetId, ClipOrderMatch Match);

/// <summary>
/// The resolved running order, plus everything that did not line up.
/// <para>
/// <see cref="AssetIds"/> is always a complete, valid ordering of every clip that was
/// passed in - never a partial one. A list that only half matched still produces a usable
/// sequence, with the unnamed clips kept at the end and reported, which is a far better
/// answer than refusing the whole paste over one typo.
/// </para>
/// </summary>
public sealed record ClipOrderResult(
    IReadOnlyList<string> AssetIds,
    IReadOnlyList<ClipOrderLine> Lines,
    IReadOnlyList<string> AppendedAssetIds)
{
    /// <summary>True when the text named every clip exactly once and nothing was guessed.</summary>
    public bool IsExact => AppendedAssetIds.Count == 0
        && Lines.Count > 0
        && Lines.All(l => l.Match == ClipOrderMatch.Matched);
}

/// <summary>
/// Turns a written running order into a sequence of clips.
/// <para>
/// The point of this is that the order usually already exists somewhere - in a script, a
/// shot list, a message - and reproducing it as drag gestures is busywork that also
/// introduces mistakes. So a paste is accepted in whatever shape it arrives: bare
/// filenames, a numbered list, bullets, extensions present or missing, separators of any
/// kind, and plain position numbers.
/// </para>
/// <para>
/// Deliberately a pure function over names. It touches no repository and no storage, which
/// is what makes the whole matching surface testable as plain data - and matching is
/// exactly the sort of code where a subtle mistake produces a video in the wrong order
/// rather than an error anyone would notice.
/// </para>
/// </summary>
public static class ClipOrderResolver
{
    /// <summary>Filename order, read the way a person reads it. See NaturalNameComparer.</summary>
    public static IReadOnlyList<string> NaturalOrder(IEnumerable<ClipCandidate> clips) =>
        [.. clips.OrderBy(c => c.Name, NaturalNameComparer.Instance).Select(c => c.AssetId)];

    public static ClipOrderResult FromText(IReadOnlyList<ClipCandidate> clips, string? text)
    {
        ArgumentNullException.ThrowIfNull(clips);

        var entries = clips.Select((clip, index) => new Entry(clip, index)).ToList();
        var lines = SplitLines(text);

        var claimed = new HashSet<string>(StringComparer.Ordinal);
        var order = new List<string>(entries.Count);
        var report = new List<ClipOrderLine>(lines.Count);

        for (var i = 0; i < lines.Count; i++)
        {
            var line = lines[i];
            var available = entries.Where(e => !claimed.Contains(e.Clip.AssetId)).ToList();

            var (entry, match) = Resolve(available, entries, line);

            if (entry is not null && match == ClipOrderMatch.Matched)
            {
                claimed.Add(entry.Clip.AssetId);
                order.Add(entry.Clip.AssetId);
            }

            report.Add(new ClipOrderLine(i + 1, line, entry?.Clip.AssetId, match));
        }

        // Anything the text never named keeps its own sensible order at the end, rather
        // than being dropped: a clip silently missing from the output is much worse than
        // one that is present but late, and the caller is told which ones these are.
        var appended = entries
            .Where(e => !claimed.Contains(e.Clip.AssetId))
            .OrderBy(e => e.Clip.Name, NaturalNameComparer.Instance)
            .Select(e => e.Clip.AssetId)
            .ToList();

        order.AddRange(appended);

        return new ClipOrderResult(order, report, appended);
    }

    /// <summary>
    /// Runs the match passes in falling order of confidence and stops at the first that
    /// names exactly one clip. The sequence matters: an exact filename must always beat a
    /// coincidental substring, and a bare number may only be read as a position after every
    /// reading of it as a name has failed - otherwise a clip genuinely called "03" would be
    /// resolved as "the third one".
    /// </summary>
    private static (Entry? Entry, ClipOrderMatch Match) Resolve(
        List<Entry> available, List<Entry> all, string line)
    {
        var stripped = StripOrdinalMarker(line);
        var sawAmbiguity = false;

        foreach (var pass in Passes(line, stripped, all.Count))
        {
            var hits = pass(available);

            if (hits.Count == 1) return (hits[0], ClipOrderMatch.Matched);
            if (hits.Count > 1) sawAmbiguity = true;

            // Nothing available matched. If the same pass DOES match a clip an earlier line
            // already took, this line is a repeat rather than a mystery - the difference
            // between "you listed the intro twice" and "there is no clip called intro", and
            // only the first tells the user what to fix.
            if (hits.Count == 0 && pass(all).Count > 0)
                return (null, ClipOrderMatch.Duplicate);
        }

        return (null, sawAmbiguity ? ClipOrderMatch.Ambiguous : ClipOrderMatch.Unmatched);
    }

    private static IEnumerable<Func<List<Entry>, List<Entry>>> Passes(
        string line, string stripped, int clipCount)
    {
        // 1. The whole line is a filename, with or without its extension.
        yield return pool =>
        [
            .. pool.Where(e => NaturalNameComparer.NameEquals(e.Name, line)
                               || NaturalNameComparer.NameEquals(e.Stem, line))
        ];

        // 2. The same, ignoring punctuation, spacing and case.
        var normalizedLine = NaturalNameComparer.Normalize(line);
        if (normalizedLine.Length > 0)
        {
            yield return pool =>
            [
                .. pool.Where(e => e.NormalizedName == normalizedLine
                                   || e.NormalizedStem == normalizedLine)
            ];
        }

        // 3. Now allow a list marker to have been stripped: "1. intro", "- intro".
        if (!string.Equals(stripped, line, StringComparison.Ordinal))
        {
            yield return pool =>
            [
                .. pool.Where(e => NaturalNameComparer.NameEquals(e.Name, stripped)
                                   || NaturalNameComparer.NameEquals(e.Stem, stripped))
            ];

            var normalizedStripped = NaturalNameComparer.Normalize(stripped);
            if (normalizedStripped.Length > 0)
            {
                yield return pool =>
                [
                    .. pool.Where(e => e.NormalizedName == normalizedStripped
                                       || e.NormalizedStem == normalizedStripped)
                ];
            }
        }

        // 4. A unique prefix. This is what resolves an abbreviated running order - "03",
        // "intro" - and it comes before reading a number as a position, so a clip actually
        // named "03 - titles" wins over whatever happens to be third in the list.
        var fragment = NaturalNameComparer.Normalize(stripped);
        if (fragment.Length > 0)
        {
            yield return pool =>
            [
                .. pool.Where(e =>
                    e.NormalizedStem.StartsWith(fragment, StringComparison.Ordinal)
                    || e.NormalizedName.StartsWith(fragment, StringComparison.Ordinal))
            ];
        }

        // 5. A unique containment, either way round, so "the intro clip" finds "intro" and
        // "intro" finds "01_intro_final". Three characters minimum: below that a fragment
        // matches nearly everything, and a wrong guess is worse than no guess.
        if (fragment.Length >= 3)
        {
            yield return pool =>
            [
                .. pool.Where(e => e.NormalizedStem.Length >= 3
                                   && (e.NormalizedStem.Contains(fragment, StringComparison.Ordinal)
                                       || fragment.Contains(e.NormalizedStem, StringComparison.Ordinal)))
            ];
        }

        // 6. Last resort: a bare number is a position in the selection as it stands.
        if (NaturalNameComparer.TryParseIndex(stripped, out var position)
            && position >= 1 && position <= clipCount)
        {
            yield return pool => [.. pool.Where(e => e.Index == position - 1)];
        }
    }

    /// <summary>
    /// Splits a paste into lines.
    /// <para>
    /// Newlines first, because that is how a list is nearly always written. A single line is
    /// then split again on the separators people use inline - but only when there is exactly
    /// one line, so a comma inside a filename on a multi-line list cannot tear that entry in
    /// half.
    /// </para>
    /// </summary>
    private static List<string> SplitLines(string? text)
    {
        if (string.IsNullOrWhiteSpace(text)) return [];

        var newlines = new[] { '\n', '\r' };
        var lines = text
            .Split(newlines, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .ToList();

        if (lines.Count == 1)
        {
            var separators = new[] { ',', ';', '|', '>' };
            var inline = lines[0]
                .Split(separators,
                    StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .ToList();

            if (inline.Count > 1) lines = inline;
        }

        // A cap in the same spirit as the clip cap: this is parsing caller-supplied text.
        return [.. lines.Take(ClipOrderLimits.MaxLines)];
    }

    /// <summary>
    /// Removes a leading list marker - "1.", "2)", "03 -", "-", "*", a bullet - and nothing
    /// else. Only ever consulted AFTER the whole line has failed to match, so a filename
    /// that genuinely starts with a number is never damaged.
    /// </summary>
    private static string StripOrdinalMarker(string line)
    {
        var index = 0;
        while (index < line.Length && char.IsAsciiDigit(line[index])) index++;

        var digits = index;

        if (digits == 0)
        {
            // A bullet or dash marker carries no digits at all.
            if (index >= line.Length || line[index] is not ('-' or '*' or '•' or '·'))
                return line;

            index++;
        }
        else if (index < line.Length && line[index] is '.' or ')' or ':' or '-')
        {
            index++;
        }

        var separators = new[] { ' ', '\t', '-', '–', '—' };
        var rest = line[index..].TrimStart(separators);

        // "12" on its own is a position, not a marker followed by an empty name.
        return rest.Length == 0 ? line : rest;
    }

    private sealed class Entry(ClipCandidate clip, int index)
    {
        public ClipCandidate Clip { get; } = clip;
        public int Index { get; } = index;

        public string Name { get; } = clip.Name;
        public string Stem { get; } = StemOf(clip.Name);
        public string NormalizedName { get; } = NaturalNameComparer.Normalize(clip.Name);
        public string NormalizedStem { get; } = NaturalNameComparer.Normalize(StemOf(clip.Name));

        /// <summary>
        /// The name without its extension. Done by hand rather than with
        /// Path.GetFileNameWithoutExtension, because this is a display name and must never
        /// be interpreted as a path.
        /// </summary>
        private static string StemOf(string name)
        {
            var dot = name.LastIndexOf('.');
            return dot > 0 && dot >= name.Length - 6 ? name[..dot] : name;
        }
    }
}

public static class ClipOrderLimits
{
    /// <summary>Bounds the work one paste can cause. Well above any real running order.</summary>
    public const int MaxLines = 500;

    public const int MaxTextLength = 20_000;
}
