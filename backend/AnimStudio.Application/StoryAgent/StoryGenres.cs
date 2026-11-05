using AnimStudio.Domain.Stories;

namespace AnimStudio.Application.StoryAgent;

/// <summary>
/// The genres that ship with the app. They are written to the database the first time genres are read, and from then on
/// the database is what counts: an administrator edits them there, and deleting one puts this version back.
/// </summary>
/// <remarks>
/// Every call builds fresh objects, so a caller that edits one cannot change what the next caller gets.
/// </remarks>
public static class StoryGenres
{
    /// <summary>What a run with no genre is: every run before genres existed was devotional.</summary>
    public const string DefaultId = "devotional";

    public static IReadOnlyList<StoryGenre> All() =>
        [Devotional(), Funny(), Kids(), Bedtime(), Motivational(), Explainer(), Folk()];

    public static StoryGenre? Find(string? id) =>
        All().FirstOrDefault(g => string.Equals(g.Id, id?.Trim(), StringComparison.OrdinalIgnoreCase));

    /// <summary>The genre a run is made in: its own copy, or the devotional one for a run from before genres.</summary>
    public static StoryGenre Of(StoryRun run) => run.Genre ?? Devotional();

    /// <summary>A genre's topics in the shape the matcher and the researcher use.</summary>
    public static IReadOnlyList<GranthTopic> TopicsOf(StoryGenre genre) =>
        [.. genre.Topics.Select(t => new GranthTopic(
            t.Id, t.Name, t.Hindi ?? t.Name, t.Keywords, t.Summary,
            [.. t.Sources.Select(s => new GranthSourceRef(s.TextId, s.Ref, s.Note ?? string.Empty, s.Confidence))],
            t.MusicQuery ?? string.Empty))];

    // ------------------------------------------------------------------------------------------------ the genres

    /// <summary>The Story Agent as it always was: researched in the Granths, every source checked.</summary>
    public static StoryGenre Devotional() => new()
    {
        Id = DefaultId,
        Name = "Devotional",
        NameHindi = "भक्ति कथा",
        Description = "Festivals, deities and episodes from the Puranas, the Itihasa and the Gita, researched in the texts with every source checked.",
        Icon = "🙏",
        Order = 0,
        BuiltIn = true,
        Mode = StoryGenreMode.Scripture,
        StyleGuide = "Devotional and reverent, for an ordinary viewer. The rules for grounding and citing are in the story-script prompt.",
        Moods = ["devotional", "joyful", "solemn", "epic", "serene"],
        DefaultLanguage = "hi",
        DefaultTargetSeconds = 150,
        LookStyle = StoryLookStyle.Gentle,
        ImageStyle = "reverent devotional painting, warm golden light, rich traditional Indian detail",
        MusicQuery = "devotional sitar flute",
        SpeechStyle = "warm, unhurried storyteller",
        Tags = ["hindu mythology stories", "hindu scriptures", "puranic stories", "पौराणिक कथाएँ"],
        Hashtags = ["HinduMythology"],
        Links = [new() { Label = "Read the texts on Wikisource", Url = "https://sa.wikisource.org/" }],
        TitleSuffix = "Told from the Granths",
        PinnedLine = "जय श्री हरि 🙏",
        Category = "Education",
        Topics = [.. GranthTopics.All.Select(t => new StoryGenreTopic
        {
            Id = t.Id,
            Name = t.Name,
            Hindi = t.Hindi,
            Keywords = [.. t.Keywords],
            Summary = t.Summary,
            MusicQuery = t.MusicQuery,
            Sources = [.. t.Sources.Select(s => new StoryGenreSource { TextId = s.TextId, Ref = s.Ref, Note = s.Note, Confidence = s.Confidence })]
        })]
    };

    public static StoryGenre Funny() => new()
    {
        Id = "funny",
        Name = "Funny stories",
        NameHindi = "मज़ेदार कहानियाँ",
        Description = "Light, clean comedy for the whole family: everyday mix-ups, clever twists and a punchline at the end.",
        Icon = "😂",
        Order = 10,
        BuiltIn = true,
        Mode = StoryGenreMode.Creative,
        StyleGuide =
            "Clean family comedy that anyone can watch with their parents or children. Everyday situations - home, school, office, " +
            "a market, a wedding - that go wrong in a way the viewer sees coming a moment before the character does. One running joke " +
            "that pays off at the end, and a final scene with a clear punchline. Short, snappy sentences; let the characters talk. " +
            "The humour comes from the situation and the characters' reactions, never from insulting anyone.",
        Moods = ["playful", "joyful", "excited", "tense", "happy"],
        DefaultLanguage = "hi",
        DefaultTargetSeconds = 60,
        DefaultFormat = StoryFormat.Vertical,
        LookStyle = StoryLookStyle.Lively,
        ImageStyle = "bright 3D cartoon, expressive faces, bold colours, comic timing",
        MusicQuery = "funny quirky comedy",
        SpeechStyle = "playful, lively comic timing",
        Tags = ["funny stories", "comedy", "funny animation", "family comedy", "मज़ेदार कहानी"],
        Hashtags = ["FunnyStories", "Comedy", "Shorts"],
        TitleSuffix = "Funny Story",
        PinnedLine = "😂 Tag someone who does exactly this!",
        Category = "Comedy",
        Topics =
        [
            Topic("school", "School days", "स्कूल के दिन", ["school", "exam", "teacher", "homework", "स्कूल", "परीक्षा", "होमवर्क"],
                "Homework excuses, surprise tests and the class clown.", "funny quirky"),
            Topic("family", "Family mix-ups", "परिवार की गड़बड़", ["family", "mother", "father", "grandma", "wedding", "परिवार", "मम्मी", "पापा", "दादी", "शादी"],
                "Relatives, family functions and the chaos of a full house.", "comedy upbeat"),
            Topic("office", "Office life", "ऑफ़िस की बातें", ["office", "boss", "meeting", "work from home", "ऑफ़िस", "बॉस", "मीटिंग"],
                "Meetings that never end and the colleague who is always on mute.", "quirky comedy"),
            Topic("animals", "Clever animals", "चतुर जानवर", ["dog", "cat", "monkey", "parrot", "कुत्ता", "बिल्ली", "बंदर", "तोता"],
                "Pets and animals who are smarter than their owners.", "playful cartoon")
        ]
    };

    public static StoryGenre Kids() => new()
    {
        Id = "kids-moral",
        Name = "Kids' moral stories",
        NameHindi = "बच्चों की नैतिक कहानियाँ",
        Description = "Simple animated stories for children with one clear lesson - honesty, kindness, sharing, courage.",
        Icon = "🧒",
        Order = 20,
        BuiltIn = true,
        Mode = StoryGenreMode.Creative,
        StyleGuide =
            "For children aged four to ten. Very simple words and short sentences. A child or a friendly animal is the hero, faces one " +
            "small problem, makes a choice, and learns one clear lesson that the narrator says plainly in the last scene " +
            "(\"The lesson of this story is...\"). Warm and safe: no frightening scenes, no violence, nothing a parent would mind.",
        Moods = ["joyful", "playful", "wonder", "calm", "sad"],
        DefaultLanguage = "hi",
        DefaultTargetSeconds = 150,
        LookStyle = StoryLookStyle.Gentle,
        ImageStyle = "soft colourful 3D children's animation, cute rounded characters, friendly and bright",
        MusicQuery = "children happy playful",
        SpeechStyle = "warm, friendly storyteller for children",
        Tags = ["moral stories", "kids stories", "stories for kids", "hindi kahani", "बच्चों की कहानी", "नैतिक कहानी"],
        Hashtags = ["MoralStories", "KidsStories"],
        TitleSuffix = "Moral Story for Kids",
        PinnedLine = "⭐ What did you learn from this story? Tell us below!",
        Category = "Education",
        MadeForKids = true,
        Topics =
        [
            Topic("honesty", "Honesty", "ईमानदारी", ["honesty", "honest", "truth", "lie", "ईमानदारी", "सच", "झूठ"], "Telling the truth even when it is hard.", "gentle children"),
            Topic("sharing", "Sharing and kindness", "बाँटना और दया", ["sharing", "kindness", "help", "friend", "दया", "मदद", "दोस्त", "बाँटना"], "Helping others and sharing what we have.", "happy children"),
            Topic("courage", "Courage", "साहस", ["courage", "brave", "fear", "साहस", "बहादुर", "डर"], "Facing a fear one small step at a time.", "adventure children"),
            Topic("greed", "Greed and contentment", "लालच", ["greed", "greedy", "lalach", "लालच", "लालची"], "Why wanting too much leaves us with less.", "gentle children")
        ]
    };

    public static StoryGenre Bedtime() => new()
    {
        Id = "bedtime",
        Name = "Bedtime stories",
        NameHindi = "सोने से पहले की कहानियाँ",
        Description = "Calm, slow stories that wind down to a gentle goodnight.",
        Icon = "🌙",
        Order = 30,
        BuiltIn = true,
        Mode = StoryGenreMode.Creative,
        StyleGuide =
            "A calm story to fall asleep to. Slow, soft, repetitive rhythm; gentle images of moonlight, stars, quiet forests, sleepy " +
            "animals. Nothing scary and no sudden surprises. The energy goes down scene by scene, and the last scene says goodnight.",
        Moods = ["calm", "serene", "wonder", "gentle"],
        DefaultLanguage = "hi",
        DefaultTargetSeconds = 240,
        LookStyle = StoryLookStyle.Gentle,
        ImageStyle = "dreamy soft watercolour, moonlit night, pastel colours, cosy and quiet",
        MusicQuery = "lullaby calm piano",
        SpeechStyle = "soft, slow and soothing, almost a whisper",
        Tags = ["bedtime stories", "sleep stories", "lullaby story", "सोने की कहानी"],
        Hashtags = ["BedtimeStories", "SleepStories"],
        TitleSuffix = "Bedtime Story",
        PinnedLine = "🌙 Goodnight, sweet dreams.",
        Category = "Education",
        MadeForKids = true
    };

    public static StoryGenre Motivational() => new()
    {
        Id = "motivational",
        Name = "Motivational",
        NameHindi = "प्रेरक कहानियाँ",
        Description = "Short stories of effort, failure and comeback that end with a line worth remembering.",
        Icon = "🔥",
        Order = 40,
        BuiltIn = true,
        Mode = StoryGenreMode.Creative,
        StyleGuide =
            "For teenagers and adults. One ordinary person, a real struggle, a turning point and a comeback. Concrete details, not " +
            "slogans. Build slowly, rise at the turning point, and end with one short, memorable line spoken straight to the viewer. " +
            "The person is invented; never claim it is a true story about a real, named person.",
        Moods = ["reflective", "tense", "uplifting", "triumph", "powerful"],
        DefaultLanguage = "hi",
        DefaultTargetSeconds = 90,
        DefaultFormat = StoryFormat.Vertical,
        LookStyle = StoryLookStyle.Cinematic,
        ImageStyle = "cinematic realistic illustration, dramatic light, determined expressions",
        MusicQuery = "inspiring cinematic piano",
        SpeechStyle = "confident, rising, inspiring",
        Tags = ["motivational story", "inspirational story", "success story", "प्रेरक कहानी"],
        Hashtags = ["Motivation", "Inspiration"],
        TitleSuffix = "Motivational Story",
        PinnedLine = "🔥 Which line will you remember? Write it below.",
        Category = "People & Blogs"
    };

    public static StoryGenre Explainer() => new()
    {
        Id = "explainer",
        Name = "Explainers and facts",
        NameHindi = "रोचक तथ्य",
        Description = "Curious questions answered as a story: science, nature, history and how things work.",
        Icon = "💡",
        Order = 50,
        BuiltIn = true,
        Mode = StoryGenreMode.Creative,
        StyleGuide =
            "Answer the title's question as a small journey: start with a surprising fact or question, explain step by step with " +
            "everyday comparisons, and end with a one-line summary. Only well-established facts; no exaggeration, no made-up numbers. " +
            "Friendly and clear, for a curious twelve-year-old and their parents.",
        Moods = ["wonder", "curious", "joyful", "dramatic", "calm"],
        DefaultLanguage = "hi",
        DefaultTargetSeconds = 120,
        LookStyle = StoryLookStyle.Cinematic,
        ImageStyle = "clean educational 3D illustration, clear subject, bright studio light",
        MusicQuery = "curious documentary light",
        SpeechStyle = "clear, curious, friendly teacher",
        Tags = ["facts", "science explained", "amazing facts", "रोचक तथ्य", "जानकारी"],
        Hashtags = ["Facts", "Explained"],
        TitleSuffix = "Explained",
        PinnedLine = "💡 What should we explain next?",
        Category = "Education"
    };

    public static StoryGenre Folk() => new()
    {
        Id = "folk-tales",
        Name = "Folk tales and fables",
        NameHindi = "लोक कथाएँ",
        Description = "Retold fables and folk tales in the public domain - clever animals, wise kings, foolish thieves.",
        Icon = "🦊",
        Order = 60,
        BuiltIn = true,
        Mode = StoryGenreMode.Creative,
        StyleGuide =
            "Retell a traditional fable or folk tale that is in the public domain, in the voice of a village storyteller (\"Long ago...\"). " +
            "Keep the traditional plot and its ending, say where the tale is told, and end with its moral. When the title names no " +
            "known tale, write a new one in the same spirit.",
        Moods = ["wonder", "playful", "tense", "joyful", "calm"],
        DefaultLanguage = "hi",
        DefaultTargetSeconds = 180,
        LookStyle = StoryLookStyle.Gentle,
        ImageStyle = "storybook illustration, warm earthy colours, traditional Indian village and forest",
        MusicQuery = "folk flute storytelling",
        SpeechStyle = "warm village storyteller",
        Tags = ["folk tales", "fables", "panchatantra style stories", "लोक कथा", "दंतकथा"],
        Hashtags = ["FolkTales", "Fables"],
        TitleSuffix = "Folk Tale",
        PinnedLine = "🦊 Which tale should we tell next?",
        Category = "Film & Animation",
        Topics =
        [
            Topic("clever-animals", "Clever animals", "चतुर जानवर", ["fox", "crow", "jackal", "rabbit", "lion", "monkey", "crocodile", "लोमड़ी", "कौआ", "सियार", "खरगोश", "शेर", "बंदर", "मगरमच्छ"],
                "Small, clever animals outwitting big, proud ones.", "folk flute playful"),
            Topic("wise-ruler", "Wise rulers and ministers", "बुद्धिमान राजा", ["king", "minister", "court", "riddle", "राजा", "मंत्री", "दरबार", "पहेली"],
                "Riddles and judgements in a king's court.", "folk storytelling")
        ]
    };

    private static StoryGenreTopic Topic(string id, string name, string hindi, List<string> keywords, string summary, string music) =>
        new() { Id = id, Name = name, Hindi = hindi, Keywords = keywords, Summary = summary, MusicQuery = music };
}
