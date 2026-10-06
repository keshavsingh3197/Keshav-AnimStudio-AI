using System.Text.RegularExpressions;

namespace AnimStudio.Application.Releases;

public sealed record ReleaseFieldError(string Field, string Code, string Message);

public sealed record ReleaseMetadataValidation(
    ReleaseMetadata Normalized,
    IReadOnlyList<ReleaseFieldError> Errors,
    IReadOnlyList<ReleaseKitWarning> Warnings)
{
    public bool IsValid => Errors.Count == 0;
}

/// <summary>
/// Checks release metadata the way a distributor's ingestion would, so problems surface
/// here instead of as a rejection days after upload. Errors stop the kit; warnings are the
/// style rules stores enforce by hand ("feat." belongs in the artist field, not the title).
/// </summary>
public static partial class ReleaseMetadataValidator
{
    public const int MaxTitleLength = 200;
    public const int MaxNameLength = 120;
    public const int MaxNames = 20;
    public const int MaxGenreLength = 60;
    public const int MaxCopyrightLength = 200;
    public const int MaxLyricsLength = 20_000;

    /// <summary>The ISO 639-2 code stores use for "no linguistic content".</summary>
    public const string InstrumentalLanguage = "zxx";

    public static ReleaseMetadataValidation Validate(ReleaseMetadata? input, DateOnly today)
    {
        var errors = new List<ReleaseFieldError>();
        var warnings = new List<ReleaseKitWarning>();

        if (input is null)
        {
            errors.Add(new("metadata", "metadata-missing", "Release details are required."));
            return new(new ReleaseMetadata(), errors, warnings);
        }

        var title = Required(input.Title, "title", "Title", MaxTitleLength, errors);
        var versionTitle = Optional(input.VersionTitle, "versionTitle", "Version", MaxNameLength, errors);
        var artist = Required(input.PrimaryArtist, "primaryArtist", "Primary artist", MaxNameLength, errors);
        var featured = Names(input.FeaturedArtists, "featuredArtists", "Featured artist", errors);
        var songwriters = Names(input.Songwriters, "songwriters", "Songwriter", errors);
        var producers = Names(input.Producers, "producers", "Producer", errors);
        var genre = Required(input.Genre, "genre", "Genre", MaxGenreLength, errors);
        var secondaryGenre = Optional(input.SecondaryGenre, "secondaryGenre", "Secondary genre", MaxGenreLength, errors);
        var label = Optional(input.RecordLabel, "recordLabel", "Record label", MaxNameLength, errors);
        var pLine = Optional(input.RecordingCopyright, "recordingCopyright", "Recording copyright", MaxCopyrightLength, errors);
        var cLine = Optional(input.CompositionCopyright, "compositionCopyright", "Composition copyright", MaxCopyrightLength, errors);
        var lyrics = Lyrics(input.Lyrics, errors);

        var language = (input.Language ?? string.Empty).Trim().ToLowerInvariant();
        if (input.Instrumental)
        {
            language = InstrumentalLanguage;
            if (lyrics is not null)
                errors.Add(new("lyrics", "lyrics-on-instrumental", "An instrumental can't have lyrics."));
        }
        else if (!LanguagePattern().IsMatch(language))
        {
            errors.Add(new("language", "language-invalid",
                "Language must be a two-letter code such as en, hi or es."));
        }

        var isrc = NormalizeCode(input.Isrc);
        if (isrc is not null && !IsValidIsrc(isrc))
        {
            errors.Add(new("isrc", "isrc-invalid",
                "An ISRC is 12 characters: country, registrant, year and number, e.g. IN-A1B-26-00001."));
        }

        var upc = NormalizeCode(input.Upc);
        if (upc is not null && !IsValidGtin(upc))
        {
            errors.Add(new("upc", "upc-invalid",
                "A UPC is 12 digits (or 13 for an EAN) and its last digit must be the correct check digit."));
        }

        if (input.ReleaseDate is { } date)
        {
            if (date.Year < 1900 || date > today.AddYears(2))
                errors.Add(new("releaseDate", "release-date-invalid", "The release date is out of range."));
            else if (date < today)
                warnings.Add(new("release-date-past",
                    "The release date is in the past. Stores treat that as a re-release of an existing recording."));
        }

        if (!input.RightsConfirmed)
        {
            errors.Add(new("rightsConfirmed", "rights-not-confirmed",
                "Confirm that you own or control the rights to this recording, its composition and its artwork."));
        }

        if (title is not null && FeatureInTitlePattern().IsMatch(title))
        {
            warnings.Add(new("title-has-credits",
                "Stores reject titles containing \"feat.\", \"ft.\" or \"prod.\". Put those names in the featured artist or producer fields."));
        }

        if (title is { Length: > 3 } && title.Any(char.IsLetter) && title == title.ToUpperInvariant())
            warnings.Add(new("title-all-caps", "Stores usually reject titles in ALL CAPS unless that is the artist's established style."));

        if (songwriters.Count == 0)
            warnings.Add(new("no-songwriters", "Most distributors require at least one songwriter's full legal name."));

        if (isrc is null)
            warnings.Add(new("no-isrc", "No ISRC given. Your distributor will assign one; reuse it if you release this recording again."));

        var normalized = new ReleaseMetadata
        {
            Title = title ?? string.Empty,
            VersionTitle = versionTitle,
            PrimaryArtist = artist ?? string.Empty,
            FeaturedArtists = featured,
            Songwriters = songwriters,
            Producers = producers,
            Genre = genre ?? string.Empty,
            SecondaryGenre = secondaryGenre,
            Language = language,
            Explicit = input.Explicit,
            Instrumental = input.Instrumental,
            ReleaseDate = input.ReleaseDate,
            RecordLabel = label,
            RecordingCopyright = pLine,
            CompositionCopyright = cLine,
            Isrc = isrc,
            Upc = upc,
            Lyrics = lyrics,
            RightsConfirmed = input.RightsConfirmed
        };

        return new(normalized, errors, warnings);
    }

    /// <summary>
    /// CC-XXX-YY-NNNNN: ISO country, alphanumeric registrant, two-digit year, five-digit
    /// designation. Hyphens and spaces are formatting only and are stripped before this runs.
    /// </summary>
    public static bool IsValidIsrc(string code) => IsrcPattern().IsMatch(code);

    /// <summary>UPC-A (12) or EAN-13 (13) with a correct GS1 mod-10 check digit.</summary>
    public static bool IsValidGtin(string code)
    {
        if (code.Length is not (12 or 13) || !code.All(char.IsAsciiDigit)) return false;

        // Weights alternate 3,1,3,1... counting leftward from the digit before the check digit.
        var sum = 0;
        for (var i = code.Length - 2; i >= 0; i--)
            sum += (code[i] - '0') * ((code.Length - 2 - i) % 2 == 0 ? 3 : 1);

        return (10 - sum % 10) % 10 == code[^1] - '0';
    }

    private static string? NormalizeCode(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return null;
        var compact = new string(raw.Where(c => c is not ('-' or ' ')).ToArray()).ToUpperInvariant();
        return compact.Length == 0 ? null : compact;
    }

    private static string? Required(string? value, string field, string label, int max, List<ReleaseFieldError> errors)
    {
        var trimmed = value?.Trim();
        if (string.IsNullOrEmpty(trimmed))
        {
            errors.Add(new(field, $"{field}-required", $"{label} is required."));
            return null;
        }

        return CheckText(trimmed, field, label, max, errors);
    }

    private static string? Optional(string? value, string field, string label, int max, List<ReleaseFieldError> errors)
    {
        var trimmed = value?.Trim();
        return string.IsNullOrEmpty(trimmed) ? null : CheckText(trimmed, field, label, max, errors);
    }

    private static string? CheckText(string value, string field, string label, int max, List<ReleaseFieldError> errors)
    {
        if (value.Length > max)
        {
            errors.Add(new(field, $"{field}-too-long", $"{label} must be {max} characters or fewer."));
            return null;
        }

        if (value.Any(char.IsControl))
        {
            errors.Add(new(field, $"{field}-invalid", $"{label} contains characters that aren't allowed."));
            return null;
        }

        return value;
    }

    private static IReadOnlyList<string> Names(
        IReadOnlyList<string>? values, string field, string label, List<ReleaseFieldError> errors)
    {
        var names = new List<string>();
        if (values is null) return names;

        foreach (var raw in values)
        {
            var name = Optional(raw, field, label, MaxNameLength, errors);
            if (name is not null && !names.Contains(name, StringComparer.OrdinalIgnoreCase))
                names.Add(name);
        }

        if (names.Count > MaxNames)
        {
            errors.Add(new(field, $"{field}-too-many", $"List at most {MaxNames} names."));
            return names.Take(MaxNames).ToList();
        }

        return names;
    }

    private static string? Lyrics(string? value, List<ReleaseFieldError> errors)
    {
        var text = value?.Replace("\r\n", "\n").Trim();
        if (string.IsNullOrEmpty(text)) return null;

        if (text.Length > MaxLyricsLength)
        {
            errors.Add(new("lyrics", "lyrics-too-long", $"Lyrics must be {MaxLyricsLength:N0} characters or fewer."));
            return null;
        }

        if (text.Any(c => char.IsControl(c) && c is not ('\n' or '\t')))
        {
            errors.Add(new("lyrics", "lyrics-invalid", "Lyrics contain characters that aren't allowed."));
            return null;
        }

        return text;
    }

    [GeneratedRegex("^[A-Z]{2}[A-Z0-9]{3}[0-9]{7}$", RegexOptions.CultureInvariant, matchTimeoutMilliseconds: 100)]
    private static partial Regex IsrcPattern();

    [GeneratedRegex("^[a-z]{2}$", RegexOptions.CultureInvariant, matchTimeoutMilliseconds: 100)]
    private static partial Regex LanguagePattern();

    [GeneratedRegex(@"[\(\[\s](feat\.?|ft\.|featuring|prod\.?)\s", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant, matchTimeoutMilliseconds: 100)]
    private static partial Regex FeatureInTitlePattern();
}
