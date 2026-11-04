using System.Text;

namespace AnimStudio.Application.Publishing;

/// <param name="Confidence">"strong", "good" or "weak" - how much the words point at it.</param>
/// <param name="Reason">Why, in words for the dialog: the matched words, or the default it fell back on.</param>
public sealed record YouTubeCategorySuggestion(string CategoryId, string Name, int Score, string Confidence, string Reason);

/// <summary>What a video is known by when its category is suggested. Every field is optional.</summary>
public sealed record YouTubeCategoryInput(
    string? Title,
    string? Description,
    IReadOnlyList<string>? Tags,
    string? ProjectName = null,
    bool IsMusicProject = false,
    /// <summary>The channel's own default category, offered last when nothing else matches.</summary>
    string? ChannelDefault = null);

/// <summary>
/// Suggests YouTube categories from the words a video is described with - title, tags,
/// description and project name, in English, Hinglish and a little Hindi - with the matched
/// words as the reason. Deterministic and offline, so it can run on every keystroke and on
/// every item of a bulk add without spending a model's quota. A suggestion only fills a
/// field the user can see and change.
/// </summary>
public static class YouTubeCategorySuggester
{
    public const int MaxSuggestions = 3;

    /// <summary>An animation studio's videos are Film &amp; Animation unless the words say otherwise.</summary>
    public const string FallbackCategoryId = "1";

    private const int TitleWeight = 3;
    private const int TagWeight = 2;
    private const int ProjectWeight = 2;
    private const int DescriptionWeight = 1;

    /// <summary>Only the start of a long description counts: the footer and links say little about the video.</summary>
    private const int DescriptionChars = 1500;

    private static readonly IReadOnlyDictionary<string, string[]> Keywords = new Dictionary<string, string[]>
    {
        ["10"] =
        [
            "song", "songs", "music", "lyrics", "lyric", "lyrical", "album", "single", "remix", "lofi", "lo-fi", "beat", "beats",
            "instrumental", "melody", "cover", "karaoke", "audio", "playlist", "rap", "hip hop", "singer", "chant", "chanting",
            "bhajan", "bhajans", "aarti", "arti", "kirtan", "mantra", "mantras", "stotram", "chalisa", "gaana", "gana", "geet",
            "sangeet", "qawwali", "ghazal", "jaap", "naam jap", "dhun",
            "भजन", "आरती", "मंत्र", "गीत", "गाना", "संगीत", "चालीसा", "कीर्तन",
        ],
        ["1"] =
        [
            "animation", "animated", "cartoon", "cartoons", "anime", "3d", "2d", "short film", "film", "movie", "story", "stories",
            "kahani", "kahaniyan", "katha", "tale", "tales", "fable", "fables", "storytelling", "episode", "scene", "pixar",
            "devotional story", "mythology", "mythological", "ramayan", "ramayana", "mahabharat", "mahabharata", "puran", "leela", "lila",
            "कहानी", "कथा", "कार्टून", "एनीमेशन",
        ],
        ["27"] =
        [
            "learn", "learning", "lesson", "lessons", "tutorial", "explained", "explainer", "facts", "history", "education",
            "educational", "school", "class", "study", "abc", "alphabet", "numbers", "counting", "phonics", "rhymes", "nursery rhyme",
            "gyan", "gyaan", "shiksha", "knowledge", "quiz", "meaning", "significance", "why do", "what is",
            "ज्ञान", "शिक्षा", "इतिहास",
        ],
        ["26"] =
        [
            "how to", "howto", "diy", "recipe", "recipes", "cooking", "tips", "tricks", "hack", "hacks", "guide", "step by step",
            "makeup", "fashion", "style", "craft", "crafts", "decoration", "rangoli", "mehndi", "puja vidhi", "vidhi",
        ],
        ["23"] = ["funny", "comedy", "prank", "meme", "memes", "joke", "jokes", "hasya", "mazedar", "lol", "hilarious", "roast", "spoof", "parody", "मज़ेदार", "हास्य"],
        ["24"] =
        [
            "entertainment", "trailer", "teaser", "reaction", "challenge", "viral", "bollywood", "celebrity", "serial", "show",
            "drama", "status", "whatsapp status", "trending", "festival", "celebration", "wishes", "greetings",
        ],
        ["20"] = ["game", "games", "gaming", "gameplay", "gamer", "minecraft", "roblox", "pubg", "bgmi", "free fire", "freefire", "gta", "walkthrough", "speedrun", "esports"],
        ["17"] = ["cricket", "football", "soccer", "ipl", "match", "goal", "sports", "workout", "fitness", "gym", "yoga", "kabaddi", "olympics", "tennis"],
        ["25"] = ["news", "breaking", "election", "politics", "political", "samachar", "headlines", "update", "updates", "समाचार", "खबर"],
        ["28"] =
        [
            "tech", "technology", "ai", "artificial intelligence", "gadget", "gadgets", "unboxing", "smartphone", "phone review",
            "coding", "programming", "software", "science", "space", "nasa", "robot", "robots", "experiment", "computer",
        ],
        ["22"] = ["vlog", "vlogs", "daily", "my life", "family", "motivation", "motivational", "shayari", "podcast", "thoughts", "quotes", "life lessons", "day in the life"],
        ["19"] = ["travel", "trip", "tour", "yatra", "darshan", "pilgrimage", "temple visit", "places to visit", "itinerary", "road trip", "यात्रा", "दर्शन"],
        ["15"] = ["dog", "dogs", "cat", "cats", "pet", "pets", "puppy", "kitten", "animal", "animals", "wildlife", "birds", "cow", "gau seva"],
        ["2"] = ["car", "cars", "bike", "bikes", "motorcycle", "drive", "automobile", "suv", "ev", "electric vehicle", "test drive"],
        ["29"] = ["charity", "ngo", "donate", "donation", "awareness", "social cause", "volunteer", "fundraiser", "seva"],
    };

    public static IReadOnlyList<YouTubeCategorySuggestion> Suggest(YouTubeCategoryInput input)
    {
        var fields = new (string Text, int Weight)[]
        {
            (Normalize(input.Title), TitleWeight),
            (Normalize(string.Join(" , ", input.Tags ?? [])), TagWeight),
            (Normalize(input.ProjectName), ProjectWeight),
            (Normalize(Head(input.Description)), DescriptionWeight),
        };

        var scored = new List<(string Id, int Score, List<string> Matched)>();
        foreach (var (id, words) in Keywords)
        {
            var score = 0;
            var matched = new List<string>();
            foreach (var word in words)
            {
                var padded = $" {word} ";
                var hit = 0;
                foreach (var (text, weight) in fields)
                {
                    if (text.Contains(padded, StringComparison.Ordinal)) hit = Math.Max(hit, weight);
                }
                if (hit == 0) continue;
                score += hit;
                if (matched.Count < 4) matched.Add(word);
            }
            if (score > 0) scored.Add((id, score, matched));
        }

        // A music project goes to YouTube Music, which needs the Music category whatever its words say.
        if (input.IsMusicProject)
        {
            var music = scored.FindIndex(s => s.Id == YouTubeMusicMetadata.MusicCategoryId);
            if (music >= 0) scored[music] = scored[music] with { Score = scored[music].Score + 10 };
            else scored.Add((YouTubeMusicMetadata.MusicCategoryId, 10, ["music project"]));
        }

        var list = scored
            .OrderByDescending(s => s.Score)
            .ThenBy(s => s.Id == FallbackCategoryId ? 0 : 1)
            .Take(MaxSuggestions)
            .Select(s => new YouTubeCategorySuggestion(s.Id, NameOf(s.Id), s.Score, Confidence(s.Score), "Matches: " + string.Join(", ", s.Matched)))
            .ToList();

        // Something to offer even when the words say nothing: the channel's default, then animation.
        foreach (var (id, reason) in new[] { (input.ChannelDefault, "Your channel's default"), (FallbackCategoryId, "Default for animated videos") })
        {
            if (list.Count >= MaxSuggestions) break;
            if (id is null || !YouTubePublishValidator.Categories.ContainsKey(id) || list.Any(s => s.CategoryId == id)) continue;
            list.Add(new YouTubeCategorySuggestion(id, NameOf(id), 0, "weak", reason));
        }

        return list;
    }

    /// <summary>The best guess's id; never null.</summary>
    public static string Best(YouTubeCategoryInput input) => Suggest(input).FirstOrDefault()?.CategoryId ?? FallbackCategoryId;

    private static string Confidence(int score) => score switch
    {
        >= 6 => "strong",
        >= 3 => "good",
        _ => "weak"
    };

    private static string NameOf(string id) => YouTubePublishValidator.Categories.TryGetValue(id, out var name) ? name : id;

    private static string? Head(string? text) => text is { Length: > DescriptionChars } ? text[..DescriptionChars] : text;

    /// <summary>Lower case, '#' and punctuation to spaces, padded so a keyword only matches whole words.</summary>
    private static string Normalize(string? text)
    {
        if (string.IsNullOrWhiteSpace(text)) return " ";
        var sb = new StringBuilder(text.Length + 2).Append(' ');
        foreach (var ch in text.ToLowerInvariant())
        {
            // Devanagari marks are letters to us too, or "भजन" would be split apart.
            sb.Append(char.IsLetterOrDigit(ch) || ch == '-' || char.GetUnicodeCategory(ch) is System.Globalization.UnicodeCategory.NonSpacingMark
                or System.Globalization.UnicodeCategory.SpacingCombiningMark ? ch : ' ');
        }
        sb.Append(' ');
        // Collapse runs of spaces so multi-word keywords match across punctuation.
        return System.Text.RegularExpressions.Regex.Replace(sb.ToString(), " {2,}", " ");
    }
}
