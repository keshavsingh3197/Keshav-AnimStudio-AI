namespace AnimStudio.Application.Music;

public sealed record MusicFilterOption(string Id, string Label);

/// <summary>
/// The filters the music picker offers. Allowlists: a value that isn't here is refused rather
/// than passed on to the provider, so the query string sent out is always one this app wrote.
/// </summary>
public static class MusicFilters
{
    public const int MaxTextLength = 100;
    public const int MaxPage = 50;
    public const int PageSize = 24;

    public static readonly IReadOnlyList<MusicFilterOption> Genres =
    [
        new("pop", "Pop"), new("rock", "Rock"), new("electronic", "Electronic"), new("hiphop", "Hip-hop"),
        new("lounge", "Lounge"), new("jazz", "Jazz"), new("classical", "Classical"), new("soundtrack", "Cinematic"),
        new("ambient", "Ambient"), new("world", "World"), new("folk", "Folk"), new("relaxation", "Relaxation"),
        new("funk", "Funk"), new("reggae", "Reggae"), new("metal", "Metal"), new("songwriter", "Singer-songwriter")
    ];

    public static readonly IReadOnlyList<MusicFilterOption> Moods =
    [
        new("happy", "Happy"), new("energetic", "Energetic"), new("uplifting", "Uplifting"), new("motivational", "Motivational"),
        new("calm", "Calm"), new("peaceful", "Peaceful"), new("romantic", "Romantic"), new("sad", "Sad"),
        new("epic", "Epic"), new("dark", "Dark"), new("funny", "Funny"), new("dreamy", "Dreamy")
    ];

    public static readonly IReadOnlyList<MusicFilterOption> Tempos =
    [
        new("verylow", "Very slow"), new("low", "Slow"), new("medium", "Medium"), new("high", "Fast"), new("veryhigh", "Very fast")
    ];

    /// <summary>Length presets, as (min, max) seconds.</summary>
    public static readonly IReadOnlyDictionary<string, (int? Min, int? Max)> Lengths = new Dictionary<string, (int?, int?)>
    {
        ["short"] = (null, 60),
        ["medium"] = (60, 180),
        ["long"] = (180, null)
    };

    public static readonly IReadOnlyList<MusicFilterOption> LengthOptions =
    [
        new("short", "Under 1 min (Shorts)"), new("medium", "1-3 min"), new("long", "Over 3 min")
    ];

    public sealed record Input(string? Text, string? Genre, string? Mood, string? Tempo, string? Length,
        bool InstrumentalOnly, string? Sort, int? Page);

    /// <summary>The search, checked, or the first thing wrong with it.</summary>
    public static (MusicSearchQuery? Query, string? Field, string? Error) Validate(Input input, bool includeNonCommercial)
    {
        var text = (input.Text ?? string.Empty).Trim();
        if (text.Length > MaxTextLength)
            return (null, "q", $"Search for up to {MaxTextLength} characters.");
        if (text.Any(char.IsControl))
            return (null, "q", "The search contains characters that can't be searched for.");

        if (!TryPick(Genres, input.Genre, out var genre)) return (null, "genre", "Choose a genre from the list.");
        if (!TryPick(Moods, input.Mood, out var mood)) return (null, "mood", "Choose a mood from the list.");
        if (!TryPick(Tempos, input.Tempo, out var tempo)) return (null, "tempo", "Choose a tempo from the list.");

        (int? Min, int? Max) length = (null, null);
        if (!string.IsNullOrWhiteSpace(input.Length) && !Lengths.TryGetValue(input.Length.Trim(), out length))
            return (null, "length", "Choose a length from the list.");

        MusicSort sort;
        if (string.IsNullOrWhiteSpace(input.Sort))
            sort = text.Length > 0 ? MusicSort.BestMatch : MusicSort.Trending;
        else if (!Enum.TryParse(input.Sort.Trim(), ignoreCase: true, out sort) || !Enum.IsDefined(sort))
            return (null, "sort", "Choose how to sort from the list.");
        // Best match needs something to match.
        if (sort == MusicSort.BestMatch && text.Length == 0) sort = MusicSort.Trending;

        var page = input.Page ?? 1;
        if (page < 1 || page > MaxPage) return (null, "page", $"Pages run from 1 to {MaxPage}.");

        return (new MusicSearchQuery(text.Length == 0 ? null : text, genre, mood, tempo, input.InstrumentalOnly,
            length.Min, length.Max, sort, page, includeNonCommercial), null, null);
    }

    private static bool TryPick(IReadOnlyList<MusicFilterOption> options, string? value, out string? picked)
    {
        picked = null;
        if (string.IsNullOrWhiteSpace(value)) return true;
        picked = options.FirstOrDefault(o => string.Equals(o.Id, value.Trim(), StringComparison.OrdinalIgnoreCase))?.Id;
        return picked is not null;
    }
}
