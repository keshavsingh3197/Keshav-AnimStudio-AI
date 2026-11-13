using AnimStudio.Domain.Stories;

namespace AnimStudio.Application.StoryAgent;

/// <summary>
/// The emotions a line of a story can be said with, and what each one asks of the voice and of the face. The names are the
/// app's own and nothing else is kept: the script writer's word is read through <see cref="Normalize"/>, so a line never
/// carries free text into a speech or video prompt.
/// </summary>
public static class StoryEmotions
{
    /// <param name="Id">What the line stores.</param>
    /// <param name="Delivery">For a speech engine that takes a delivery instruction.</param>
    /// <param name="Adverb">"speaks {adverb}, saying..." in the animation prompt.</param>
    /// <param name="Face">What the speaker's face and body do while they say it.</param>
    /// <param name="Reaction">How the others react, in a comic scene.</param>
    public sealed record Emotion(string Id, string Label, string Emoji, string Delivery, string Adverb, string Face, string Reaction);

    public static readonly IReadOnlyList<Emotion> All =
    [
        new("happy", "Happy", "😄", "happily, with a smile in the voice", "happily",
            "a big warm smile, bright eyes", "the others smile back"),
        new("excited", "Excited", "🤩", "excitedly, bursting with energy", "excitedly",
            "wide sparkling eyes, eyebrows up, bouncing on their toes, hands waving", "the others lean in, eyes wide"),
        new("laughing", "Laughing", "😂", "laughing while speaking, amused and giggly", "while laughing",
            "laughing with eyes squeezed shut, shoulders shaking, a hand on the belly", "the others burst out laughing too"),
        new("sad", "Sad", "😢", "sadly, softly, close to tears", "sadly",
            "drooping eyebrows, a trembling lip, shoulders slumped, eyes cast down", "the others look on with sympathy"),
        new("angry", "Angry", "😠", "angrily, sharp and forceful", "angrily",
            "furrowed brows, narrowed eyes, clenched jaw, a pointing finger, stamping a foot", "the others flinch and lean back"),
        new("scared", "Scared", "😱", "fearfully, voice shaking", "fearfully",
            "eyes wide with fright, trembling, hands raised, stepping back", "the others jump and huddle together"),
        new("surprised", "Surprised", "😲", "in surprise, voice rising", "in surprise",
            "jaw dropping, eyebrows shooting up, a quick lean back", "the others do a comic double-take"),
        new("confused", "Confused", "🤔", "puzzled, unsure", "in confusion",
            "head tilted, one eyebrow raised, scratching the head", "the others exchange puzzled looks and shrug"),
        new("shy", "Shy", "😳", "shyly, quietly", "shyly",
            "blushing cheeks, a small smile, looking down, fiddling with their hands", "the others grin knowingly"),
        new("proud", "Proud", "😎", "proudly, full of confidence", "proudly",
            "chin up, chest out, hands on hips, a confident grin", "the others roll their eyes or clap"),
        new("sarcastic", "Sarcastic", "😏", "sarcastically, with a dry, teasing tone", "sarcastically",
            "a smirk, a slow eye-roll, arms folded", "the others give a deadpan stare"),
        new("whispering", "Whispering", "🤫", "in a whisper, secretive", "in a whisper",
            "leaning close, a hand cupped by the mouth, eyes darting around", "the others lean in to listen"),
        new("shouting", "Shouting", "📢", "loudly, shouting", "loudly, shouting",
            "mouth wide open, hands cupped around the mouth, leaning forward", "the others cover their ears"),
        new("worried", "Worried", "😟", "nervously, worried", "nervously",
            "biting a lip, wringing hands, glancing around", "the others look worried too"),
        new("calm", "Calm", "😌", "calmly, gently and unhurried", "calmly",
            "a relaxed, gentle face, slow nods", "the others relax"),
        new("hopeful", "Hopeful", "🥺", "hopefully, warm and wishing", "hopefully",
            "big pleading eyes, hands clasped together, a small hopeful smile", "the others look at each other, unsure"),
        new("relieved", "Relieved", "😮‍💨", "with relief, letting out a breath", "with relief",
            "a long sigh, shoulders dropping, a hand on the chest", "the others breathe out too"),
        new("disgusted", "Disgusted", "🤢", "in disgust, nose wrinkled", "in disgust",
            "a wrinkled nose, tongue out, leaning away, waving a hand in front of the face", "the others pull back and grimace"),
        new("bored", "Bored", "🥱", "flatly, bored and drawn out", "in a bored voice",
            "half-closed eyes, chin on a hand, a big yawn", "the others nudge them awake"),
        new("sleepy", "Sleepy", "😴", "sleepily, slow and mumbling", "sleepily",
            "drooping eyelids, nodding off, rubbing the eyes", "the others wave a hand in front of their face"),
        new("loving", "Loving", "🥰", "lovingly, soft and tender", "lovingly",
            "a soft smile, dreamy eyes, hands on the heart", "the others go \"aww\""),
        new("determined", "Determined", "😤", "with determination, firm and steady", "firmly",
            "a set jaw, fists clenched, eyes fixed ahead, rolling up the sleeves", "the others straighten up and nod"),
        new("jealous", "Jealous", "😒", "jealously, sulky and bitter", "jealously",
            "a side-eye glare, arms crossed, a pout", "the others pretend not to notice"),
        new("guilty", "Guilty", "😬", "guiltily, a little too quickly", "guiltily",
            "an awkward grin, eyes darting away, hiding something behind the back", "the others stare suspiciously"),
        new("innocent", "Innocent", "😇", "innocently, sweet and soft", "innocently",
            "wide innocent eyes, a sweet smile, hands behind the back, rocking on the heels", "the others are not fooled and raise an eyebrow"),
        new("mischievous", "Mischievous", "😈", "mischievously, with a sly giggle", "mischievously",
            "a sly grin, rubbing the hands together, eyebrows wiggling", "the others back away warily"),
        new("dramatic", "Dramatic", "🎭", "dramatically, over the top", "dramatically",
            "a hand to the forehead, a theatrical swoon, sweeping arm gestures", "the others roll their eyes")
    ];

    private static readonly Dictionary<string, Emotion> ById = All.ToDictionary(e => e.Id, StringComparer.Ordinal);

    /// <summary>Words a writer uses for one of the emotions.</summary>
    private static readonly Dictionary<string, string> Synonyms = new(StringComparer.Ordinal)
    {
        ["joyful"] = "happy", ["cheerful"] = "happy", ["glad"] = "happy", ["smiling"] = "happy", ["delighted"] = "happy",
        ["pleased"] = "happy", ["content"] = "happy", ["grateful"] = "happy", ["thankful"] = "happy",
        ["thrilled"] = "excited", ["eager"] = "excited", ["energetic"] = "excited", ["ecstatic"] = "excited", ["overjoyed"] = "excited",
        ["laugh"] = "laughing", ["laughs"] = "laughing", ["giggling"] = "laughing", ["amused"] = "laughing", ["funny"] = "laughing",
        ["hysterical"] = "laughing", ["chuckling"] = "laughing",
        ["crying"] = "sad", ["upset"] = "sad", ["sorrowful"] = "sad", ["unhappy"] = "sad", ["heartbroken"] = "sad",
        ["disappointed"] = "sad", ["emotional"] = "sad", ["depressed"] = "sad", ["hurt"] = "sad", ["lonely"] = "sad",
        ["furious"] = "angry", ["annoyed"] = "angry", ["irritated"] = "angry", ["mad"] = "angry", ["frustrated"] = "angry",
        ["enraged"] = "angry", ["outraged"] = "angry", ["livid"] = "angry", ["grumpy"] = "angry", ["rage"] = "angry",
        ["afraid"] = "scared", ["frightened"] = "scared", ["terrified"] = "scared", ["fearful"] = "scared",
        ["horrified"] = "scared", ["panicked"] = "scared", ["panicking"] = "scared",
        ["shocked"] = "surprised", ["amazed"] = "surprised", ["astonished"] = "surprised", ["stunned"] = "surprised",
        ["speechless"] = "surprised", ["startled"] = "surprised",
        ["puzzled"] = "confused", ["curious"] = "confused", ["unsure"] = "confused", ["doubtful"] = "confused",
        ["skeptical"] = "confused", ["sceptical"] = "confused", ["suspicious"] = "confused", ["thinking"] = "confused",
        ["embarrassed"] = "shy", ["awkward"] = "shy", ["blushing"] = "shy",
        ["nervous"] = "worried", ["anxious"] = "worried", ["tense"] = "worried", ["concerned"] = "worried", ["stressed"] = "worried",
        ["confident"] = "proud", ["boastful"] = "proud", ["smug"] = "proud", ["cocky"] = "proud", ["arrogant"] = "proud",
        ["teasing"] = "sarcastic", ["mocking"] = "sarcastic", ["ironic"] = "sarcastic", ["deadpan"] = "sarcastic",
        ["whisper"] = "whispering", ["shout"] = "shouting", ["yelling"] = "shouting", ["loud"] = "shouting", ["screaming"] = "shouting",
        ["neutral"] = "calm", ["gentle"] = "calm", ["peaceful"] = "calm", ["serene"] = "calm", ["relaxed"] = "calm", ["normal"] = "calm",
        ["hoping"] = "hopeful", ["pleading"] = "hopeful", ["begging"] = "hopeful", ["wishful"] = "hopeful", ["optimistic"] = "hopeful",
        ["relief"] = "relieved", ["phew"] = "relieved",
        ["disgust"] = "disgusted", ["grossed"] = "disgusted", ["eww"] = "disgusted", ["repulsed"] = "disgusted",
        ["uninterested"] = "bored", ["unimpressed"] = "bored", ["tired"] = "sleepy", ["exhausted"] = "sleepy", ["yawning"] = "sleepy",
        ["love"] = "loving", ["romantic"] = "loving", ["affectionate"] = "loving", ["caring"] = "loving", ["tender"] = "loving",
        ["serious"] = "determined", ["brave"] = "determined", ["motivated"] = "determined", ["focused"] = "determined",
        ["envious"] = "jealous", ["sulking"] = "jealous", ["sulky"] = "jealous",
        ["ashamed"] = "guilty", ["sorry"] = "guilty", ["apologetic"] = "guilty", ["caught"] = "guilty",
        ["sweet"] = "innocent", ["naive"] = "innocent",
        ["naughty"] = "mischievous", ["sly"] = "mischievous", ["cheeky"] = "mischievous", ["playful"] = "mischievous", ["evil"] = "mischievous",
        ["theatrical"] = "dramatic", ["overacting"] = "dramatic"
    };

    /// <summary>The app's name for the emotion a word means, or null for a word it does not know.</summary>
    public static string? Normalize(string? word)
    {
        var key = word?.Trim().ToLowerInvariant();
        if (string.IsNullOrEmpty(key) || key.Length > 24) return null;
        if (ById.ContainsKey(key)) return key;
        return Synonyms.TryGetValue(key, out var id) ? id : null;
    }

    public static Emotion? Find(string? id) => id is not null && ById.TryGetValue(id, out var emotion) ? emotion : null;

    /// <summary>The scene's delivery for one line: the story's own, then this line's emotion.</summary>
    public static string? Delivery(string? storyStyle, string? emotion)
    {
        var line = Find(emotion)?.Delivery;
        if (line is null) return storyStyle;
        return string.IsNullOrWhiteSpace(storyStyle) ? line : $"{storyStyle.Trim()}; {line}";
    }

    /// <summary>
    /// The delivery for lines spoken in one request with one voice: each different emotion in turn, so a line that starts
    /// calm and ends laughing is asked for that way.
    /// </summary>
    public static string? Delivery(string? storyStyle, IEnumerable<string?> emotions)
    {
        var said = emotions.Select(e => Find(e)?.Delivery).OfType<string>().Distinct(StringComparer.Ordinal).ToList();
        if (said.Count == 0) return storyStyle;
        var line = said.Count == 1 ? said[0] : "first " + string.Join(", then ", said);
        return string.IsNullOrWhiteSpace(storyStyle) ? line : $"{storyStyle.Trim()}; {line}";
    }

    /// <summary>True when the scene's lines carry any emotion.</summary>
    public static bool Any(StoryScene scene) => scene.Lines.Any(l => Find(l.Emotion) is not null);
}
