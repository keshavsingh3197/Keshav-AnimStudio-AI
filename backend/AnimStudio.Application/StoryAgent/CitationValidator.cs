using System.Globalization;
using System.Text.RegularExpressions;
using AnimStudio.Domain.Stories;

namespace AnimStudio.Application.StoryAgent;

/// <summary>The outcome of checking one citation.</summary>
/// <param name="Normalized">The place in a standard form, e.g. <c>10.24-25</c>; the raw reference when it could not be read.</param>
public sealed record CitationCheck(
    CitationStatus Status,
    string? TextId,
    string TextName,
    int? Division,
    int? UnitFrom,
    int? UnitTo,
    string Normalized,
    string? Message)
{
    /// <summary>True when the check found nothing wrong, even if it could not prove everything.</summary>
    public bool IsAcceptable => Status is CitationStatus.Verified or CitationStatus.Unchecked;

    /// <summary>The same chapter or a chapter inside the other's range, in the same division.</summary>
    public bool Overlaps(int division, int unitFrom, int unitTo) =>
        Division == division
        && UnitFrom is { } from
        && from <= unitTo
        && (UnitTo ?? from) >= unitFrom;
}

/// <summary>
/// Checks a citation against the shape of the text it names. A text model is good at sounding sure
/// and poor at counting; this is the counting. It cannot say a verse says what the narration says,
/// only that the place exists - which still catches the most embarrassing mistakes.
/// </summary>
public static partial class CitationValidator
{
    /// <summary>Words that label a part of a text, and carry no information beyond the number after them.</summary>
    private static readonly HashSet<string> Labels = new(StringComparer.Ordinal)
    {
        "kanda", "khanda", "skandha", "skanda", "amsha", "amsa", "parva", "samhita", "mandala", "adhyaya", "adhyay",
        "sarga", "chapter", "canto", "book", "verse", "shloka", "sloka", "sukta", "doha", "chaupai", "ch", "v",
        "काण्ड", "कांड", "खण्ड", "खंड", "स्कन्ध", "स्कंध", "अंश", "अध्याय", "सर्ग", "पर्व", "संहिता", "मण्डल", "मंडल", "श्लोक", "सूक्त", "दोहा", "चौपाई"
    };

    public static CitationCheck Check(string? text, string? reference)
    {
        var found = GranthCatalog.Find(text);
        var raw = ToAsciiDigits((reference ?? string.Empty).Trim());

        if (found is null)
        {
            return new CitationCheck(CitationStatus.UnknownText, null, text?.Trim() ?? string.Empty, null, null, null, raw,
                "This is not a text the catalogue knows, so its reference could not be checked.");
        }

        if (raw.Length == 0)
        {
            return new CitationCheck(CitationStatus.Unchecked, found.Id, found.English, null, null, null, string.Empty,
                "No place within the text was given.");
        }

        if (!found.IsStructured)
        {
            return new CitationCheck(CitationStatus.Unchecked, found.Id, found.English, null, null, null, raw,
                $"{found.English} is cited by section name, which the catalogue cannot check.");
        }

        var tokens = Tokenize(raw);
        if (tokens.Count == 0)
        {
            return new CitationCheck(CitationStatus.Unchecked, found.Id, found.English, null, null, null, raw,
                "The place could not be read as a number.");
        }

        // A named division ("Yuddha 128") or a numbered one ("10.59").
        GranthDivision? division = null;
        var index = 0;
        if (found.IsSingleDivision)
        {
            // "Devi Mahatmya 2-4": the only division is understood, and the numbers are chapters.
            division = found.Divisions[0];
            while (index < tokens.Count && !tokens[index].IsNumber) index++;
        }
        else if (tokens[0].IsNumber)
        {
            division = found.Division(tokens[0].Number);
            index = 1;
            if (division is null)
            {
                return Invalid(found, raw,
                    $"{found.English} has {found.Divisions.Count} {Plural(found.DivisionLabel)}, so {found.DivisionLabel.ToLowerInvariant()} {tokens[0].Number} does not exist.");
            }
        }
        else
        {
            (division, index) = MatchNamedDivision(found, tokens);
            if (division is null)
            {
                return new CitationCheck(CitationStatus.Unchecked, found.Id, found.English, null, null, null, raw,
                    "The part of the text could not be matched to a known division.");
            }
        }

        var (from, to) = ReadUnits(tokens, index);

        // "Bhagavad Gita 1-18": a run of divisions rather than of units.
        if (!found.IsSingleDivision && tokens[0].IsNumber && tokens.Count >= 3
            && !tokens[1].IsNumber && tokens[1].Word == "to" && tokens[2].IsNumber)
        {
            var last = tokens[2].Number;
            if (last < division.Number)
                return Invalid(found, raw, "The range of parts is not valid.");
            if (last > found.Divisions.Count)
            {
                return Invalid(found, raw,
                    $"{found.English} has {found.Divisions.Count} {Plural(found.DivisionLabel)}, so {found.DivisionLabel.ToLowerInvariant()} {last} does not exist.");
            }

            return new CitationCheck(CitationStatus.Verified, found.Id, found.English, division.Number, null, null,
                $"{division.Number}-{last}", null);
        }

        if (from is null)
        {
            return new CitationCheck(CitationStatus.Verified, found.Id, found.English, division.Number, null, null,
                division.Number.ToString(CultureInfo.InvariantCulture), null);
        }

        if (from < 1 || (to is not null && to < from))
            return Invalid(found, raw, "The chapter range is not valid.");

        var highest = to ?? from;
        if (division.Units is { } max && highest > max)
        {
            return Invalid(found, raw,
                $"{found.English} {division.Name} has {max} {Plural(found.UnitLabel)}, so {found.UnitLabel.ToLowerInvariant()} {highest} does not exist.");
        }

        var normalized = to is null || to == from
            ? $"{division.Number}.{from}"
            : $"{division.Number}.{from}-{to}";
        return new CitationCheck(CitationStatus.Verified, found.Id, found.English, division.Number, from, to ?? from, normalized, null);
    }

    private static CitationCheck Invalid(GranthText text, string raw, string message) =>
        new(CitationStatus.Invalid, text.Id, text.English, null, null, null, raw, message);

    private static string Plural(string label) => label.ToLowerInvariant() + "s";

    /// <summary>Devanagari and other Unicode digits as ASCII, so "१०.५९" reads like "10.59".</summary>
    internal static string ToAsciiDigits(string value)
    {
        if (value.All(c => c < '\u0080')) return value;

        var builder = new System.Text.StringBuilder(value.Length);
        foreach (var c in value)
        {
            builder.Append(char.IsDigit(c) && !char.IsAsciiDigit(c)
                ? (char)('0' + (int)char.GetNumericValue(c))
                : c);
        }
        return builder.ToString();
    }

    private readonly record struct Token(string Word, int Number, bool IsNumber)
    {
        public static Token Of(string word) => new(word, 0, false);
        public static Token Of(int number) => new(string.Empty, number, true);
    }

    private static List<Token> Tokenize(string raw)
    {
        // "24-25" becomes "24 to 25", so a range survives losing its punctuation.
        var spaced = RangePattern().Replace(raw, "$1 to $2");

        var tokens = new List<Token>();
        foreach (Match m in TokenPattern().Matches(spaced))
        {
            var value = m.Value;
            if (value.All(char.IsAsciiDigit))
            {
                if (int.TryParse(value, NumberStyles.None, CultureInfo.InvariantCulture, out var n) && n <= 100_000)
                    tokens.Add(Token.Of(n));
                continue;
            }

            var word = GranthCatalog.NormalizeName(value);
            if (word.Length == 0 || Labels.Contains(word)) continue;
            tokens.Add(Token.Of(word));
        }

        return tokens;
    }

    /// <summary>Finds the division a leading name refers to: "Yuddha", "Koti Rudra", "Sundara".</summary>
    private static (GranthDivision? Division, int Next) MatchNamedDivision(GranthText text, List<Token> tokens)
    {
        foreach (var length in new[] { 2, 1 })
        {
            if (tokens.Count < length || tokens.Take(length).Any(t => t.IsNumber)) continue;

            var spelled = string.Concat(tokens.Take(length).Select(t => t.Word));
            foreach (var division in text.Divisions)
            {
                var names = new[] { division.Name }.Concat(division.Aliases)
                    .Where(n => !n.Any(char.IsAsciiDigit))
                    .Select(GranthCatalog.NormalizeName);
                if (names.Contains(spelled, StringComparer.Ordinal)) return (division, length);
            }
        }

        return (null, 0);
    }

    private static (int? From, int? To) ReadUnits(List<Token> tokens, int index)
    {
        var rest = tokens.Skip(index).ToList();
        var numbers = rest.Where(t => t.IsNumber).Select(t => t.Number).ToList();
        if (numbers.Count == 0) return (null, null);

        var from = numbers[0];
        var hasRange = rest.Any(t => !t.IsNumber && t.Word == "to") && numbers.Count >= 2;
        return (from, hasRange ? numbers[1] : null);
    }

    [GeneratedRegex(@"(\d+)\s*[-–—]\s*(\d+)", RegexOptions.CultureInvariant)]
    private static partial Regex RangePattern();

    [GeneratedRegex(@"\d+|[\p{L}\p{M}]+", RegexOptions.CultureInvariant)]
    private static partial Regex TokenPattern();
}
