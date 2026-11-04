namespace AnimStudio.Domain.Stories;

/// <summary>The shape of the finished video.</summary>
public enum StoryFormat
{
    /// <summary>1920x1080, for YouTube.</summary>
    Wide = 0,

    /// <summary>1080x1920, for Shorts and Reels.</summary>
    Vertical = 1
}

/// <summary>Who writes the script.</summary>
public enum StoryWriterMode
{
    /// <summary>The configured text model, walking the provider chain. Falls back to <see cref="Manual"/> when none is on.</summary>
    Auto = 0,

    /// <summary>The app prepares the prompt, the person pastes it into any chat, and pastes the reply back. No key needed.</summary>
    Manual = 1,

    /// <summary>A hand-written script that ships with the app for a major festival. No text model needed.</summary>
    BuiltIn = 2
}

public enum StoryNarrationMode
{
    /// <summary>Subtitles only.</summary>
    None = 0,

    /// <summary>One of the speech engine's own voices.</summary>
    Stock = 1,

    /// <summary>The person's own voice, from a consented sample: the engine's tuned voice, or an AI voice conversion.</summary>
    MyVoice = 2
}

public enum StoryVisualMode
{
    /// <summary>The user's pictures first, then the AI image engine when one is on, then a plain background.</summary>
    Auto = 0,

    /// <summary>Only the pictures the user attached; any scene without one gets a plain background.</summary>
    UploadsOnly = 1
}

/// <summary>What the person asked for. Only the title is required.</summary>
public sealed class StoryBrief
{
    public string Title { get; set; } = string.Empty;

    /// <summary>Points to cover, a rough story, or anything the title alone does not say.</summary>
    public string? Notes { get; set; }

    /// <summary><c>hi</c> (Hindi in Devanagari) or <c>en</c>.</summary>
    public string Language { get; set; } = "hi";

    /// <summary>How long the video should run, in seconds. A target for the script, not a promise.</summary>
    public int TargetSeconds { get; set; } = 150;

    public StoryFormat Format { get; set; } = StoryFormat.Wide;
    public StoryWriterMode Writer { get; set; } = StoryWriterMode.Auto;

    /// <summary>The id of a built-in story pack, when <see cref="Writer"/> is <see cref="StoryWriterMode.BuiltIn"/>.</summary>
    public string? PackId { get; set; }
}

/// <summary>How the video is made once the script is approved.</summary>
public sealed class StoryBuildOptions
{
    public StoryNarrationMode Narration { get; set; } = StoryNarrationMode.Stock;

    /// <summary>The user's voice profile, for <see cref="StoryNarrationMode.MyVoice"/>.</summary>
    public string? VoiceProfileId { get; set; }

    /// <summary>The speech engine's own voice for the lines, or the voice a profile's lines are first spoken in.</summary>
    public string? VoiceId { get; set; }

    /// <summary>One named speech engine; null walks the configured chain.</summary>
    public string? SpeechEngine { get; set; }

    /// <summary>One of <see cref="SpeechEngine"/>'s offered models; null for its configured one.</summary>
    public string? SpeechModel { get; set; }

    /// <summary>How the lines are delivered ("warm, unhurried storyteller"), for an engine that takes one.</summary>
    public string? SpeechStyle { get; set; }

    public double SpeechRate { get; set; } = 1.0;

    /// <summary>
    /// Give each character of the script's cast a voice of their own (picked from the engine's voices by gender and
    /// age), with the narrator in the chosen voice. Only an engine that can speak a dialogue does this; the others
    /// read every line in the narrator's voice.
    /// </summary>
    public bool CastVoices { get; set; } = true;

    /// <summary>
    /// For my voice: convert every line with the AI voice converter even when a tuned voice exists.
    /// Closer to the person's own sound, and minutes slower on a CPU.
    /// </summary>
    public bool ClosestToMyVoice { get; set; }

    public StoryVisualMode Visuals { get; set; } = StoryVisualMode.Auto;

    /// <summary>The picture style every generated image is asked for, after the scene's own subject.</summary>
    public string? ImageStyle { get; set; }

    public bool Music { get; set; } = true;

    /// <summary>Where the background track comes from.</summary>
    public StoryMusicSource MusicSource { get; set; } = StoryMusicSource.Auto;

    /// <summary>
    /// True when the pictures the user attaches were made with an AI image tool (Google Flow, for one), so the
    /// credits and the reminder to tick YouTube's AI disclosure say the right thing.
    /// </summary>
    public bool UploadsAreAiMade { get; set; } = true;

    /// <summary>What to search the music catalogue for, or the style to compose in; empty uses the script's own suggestion.</summary>
    public string? MusicQuery { get; set; }

    public double MusicVolume { get; set; } = 0.2;

    /// <summary>The whole brief for the composer, written or edited by the person; empty builds one from the script.</summary>
    public string? MusicPrompt { get; set; }

    /// <summary>The feel of the effects and transitions chosen for each scene.</summary>
    public StoryLookStyle LookStyle { get; set; } = StoryLookStyle.Auto;

    /// <summary>Queue the render as soon as the project is built.</summary>
    public bool RenderWhenReady { get; set; } = true;

    /// <summary>Skip the review and build as soon as the script exists.</summary>
    public bool AutoApprove { get; set; }
}

public enum StoryMusicSource
{
    /// <summary>Composed for the story with Google's Lyria when Gemini speech is set up, otherwise searched.</summary>
    Auto = 0,

    /// <summary>Composed for the story with Google's Lyria.</summary>
    Generate = 1,

    /// <summary>A royalty-free track from the music catalogue.</summary>
    Search = 2
}

/// <summary>The feel of the motion and the cuts the build picks for each scene.</summary>
public enum StoryLookStyle
{
    /// <summary>Picked from each scene's mood: slow pushes for calm, faster moves and cuts for drama.</summary>
    Auto = 0,

    /// <summary>Slow, small moves and soft crossfades throughout. Suits devotional and reflective stories.</summary>
    Gentle = 1,

    /// <summary>Deliberate pushes and pulls, longer dissolves, a reveal at the turning points.</summary>
    Cinematic = 2,

    /// <summary>Quicker moves and slides, for a Short that has to hold attention.</summary>
    Lively = 3
}

public enum StorySourceConfidence
{
    /// <summary>A chapter the catalogue is sure of.</summary>
    High = 0,

    /// <summary>The right text and section, with the exact chapter worth checking.</summary>
    Medium = 1,

    /// <summary>A traditional pointer rather than a chapter; the person must look it up.</summary>
    Low = 2
}

/// <summary>The outcome of checking a citation against the shape of the text it names.</summary>
public enum CitationStatus
{
    /// <summary>The text exists and the place named is inside it.</summary>
    Verified = 0,

    /// <summary>The text exists, but the reference cannot be checked against a numbered structure.</summary>
    Unchecked = 1,

    /// <summary>The text exists and the place named is outside it ("Bhagavata Purana 13.2").</summary>
    Invalid = 2,

    /// <summary>Not a text the catalogue knows.</summary>
    UnknownText = 3
}

/// <summary>A place in a Granth: which text, and where in it.</summary>
public sealed class StorySourceRef
{
    /// <summary>The catalogue id, e.g. <c>bhagavata-purana</c>. Empty when the text is not one the catalogue knows.</summary>
    public string TextId { get; set; } = string.Empty;

    public string TextName { get; set; } = string.Empty;

    /// <summary>The place in the text, e.g. <c>10.59</c> (skandha 10, chapter 59).</summary>
    public string Ref { get; set; } = string.Empty;

    public string? Note { get; set; }
    public StorySourceConfidence Confidence { get; set; } = StorySourceConfidence.High;
    public string? Url { get; set; }

    /// <summary>For a script's citation: whether the place exists in the text. Curated pointers leave this as it is.</summary>
    public CitationStatus Check { get; set; } = CitationStatus.Unchecked;

    /// <summary>For a script's citation: the chapter was among the passages the research fetched, so the writer was shown it.</summary>
    public bool Grounded { get; set; }

    public string? CheckMessage { get; set; }
}

/// <summary>A topic from the catalogue that the title matched, with the places the catalogue sends you.</summary>
public sealed class StoryTopicMatch
{
    public string TopicId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Summary { get; set; }
    public List<StorySourceRef> Sources { get; set; } = [];
}

/// <summary>A piece of an actual text, fetched for the script writer to read.</summary>
public sealed class ScripturePassage
{
    public string TextId { get; set; } = string.Empty;
    public string TextName { get; set; } = string.Empty;
    public string Ref { get; set; } = string.Empty;

    /// <summary>The page the passage came from, e.g. a Wikisource title.</summary>
    public string Title { get; set; } = string.Empty;

    /// <summary><c>sa</c>, <c>hi</c> or <c>en</c>: the language the passage is written in.</summary>
    public string Language { get; set; } = string.Empty;

    public string Url { get; set; } = string.Empty;
    public string Excerpt { get; set; } = string.Empty;

    /// <summary>True for a chapter the catalogue asked for by name; false for a search hit.</summary>
    public bool Direct { get; set; }

    public string License { get; set; } = string.Empty;
}

/// <summary>What the search of the Granths found for a title.</summary>
public sealed class StoryResearch
{
    public List<StoryTopicMatch> Topics { get; set; } = [];
    public List<ScripturePassage> Passages { get; set; } = [];
    public List<string> Queries { get; set; } = [];
    public List<string> Warnings { get; set; } = [];
    public DateTime RetrievedAtUtc { get; set; }
}

/// <summary>What stands behind a scene's words.</summary>
public enum StoryBasis
{
    /// <summary>The text says it. The scene cites where.</summary>
    Text = 0,

    /// <summary>Handed down by tradition; the narration says so ("it is believed").</summary>
    Tradition = 1,

    /// <summary>The storyteller's own reflection, greeting or hook. Not a claim about a text.</summary>
    Reflection = 2
}

/// <summary>One scene: what is said, what it cites, and what it looks like.</summary>
public sealed class StoryScene
{
    public int Number { get; set; }

    /// <summary>A few words, shown as the scene's title in the project.</summary>
    public string Headline { get; set; } = string.Empty;

    /// <summary>What the narrator says, in the script's language. Becomes the subtitles.</summary>
    public string Narration { get; set; } = string.Empty;

    /// <summary>
    /// The narration split by who speaks it, in order, when a character speaks in the scene; empty when the narrator
    /// says it all. The lines say the same words as <see cref="Narration"/>, which stays the subtitles.
    /// </summary>
    public List<StoryLine> Lines { get; set; } = [];

    /// <summary>The meaning in English, so the person can check a Hindi script without reading Hindi.</summary>
    public string? English { get; set; }

    public StoryBasis Basis { get; set; } = StoryBasis.Text;
    public List<StorySourceRef> Sources { get; set; } = [];

    /// <summary>What the picture shows, in English, for an image model.</summary>
    public string? ImagePrompt { get; set; }

    /// <summary>
    /// The same moment as a short moving shot (about 8 seconds), in English, for a video model such as Google Flow or
    /// Veo: what moves and how the camera goes. The person makes the clip there and attaches it.
    /// </summary>
    public string? VideoPrompt { get; set; }

    public List<string> ImageKeywords { get; set; } = [];
    public string? Mood { get; set; }

    /// <summary>A guess at how long the narration takes, used until real audio exists.</summary>
    public double EstimatedSeconds { get; set; }

    // --- what the build produced or the user attached -----------------------------------

    /// <summary>Object-store key of the scene's picture, once there is one.</summary>
    public string? ImageKey { get; set; }

    /// <summary><c>upload</c>, <c>ai</c> or <c>plain</c>.</summary>
    public string? ImageSource { get; set; }

    public string? ImageName { get; set; }

    /// <summary>Object-store key of a moving clip the person attached; when there is one it plays instead of the picture.</summary>
    public string? VideoKey { get; set; }

    public string? VideoName { get; set; }

    public string? AudioKey { get; set; }
    public string? AudioName { get; set; }
    public string? AudioSource { get; set; }

    /// <summary>The length of the narration once it exists, with the breath before and after it.</summary>
    public double? AudioSeconds { get; set; }

    /// <summary>The silent stretches in the narration, used to line subtitles up with the voice.</summary>
    public List<StoryPause> Pauses { get; set; } = [];

    /// <summary>How many times the person asked for this scene's narration again. A new take is a new file, spoken afresh.</summary>
    public int AudioTake { get; set; }

    // --- how the scene moves and leads into the next ---------------------------------------

    /// <summary>The picture's motion (a <c>BackgroundEffect</c> name). Chosen automatically unless <see cref="LookPinned"/>.</summary>
    public string? Effect { get; set; }

    /// <summary>How much it moves: the zoom or the pan travel as a fraction of the frame.</summary>
    public double? EffectIntensity { get; set; }

    /// <summary>The cut into the next scene (a <c>SceneTransition</c> name); none after the last.</summary>
    public string? Transition { get; set; }

    public double? TransitionSeconds { get; set; }

    /// <summary>The person chose this scene's effect and transition themselves, so a new look leaves them as they are.</summary>
    public bool LookPinned { get; set; }
}

/// <summary>Part of a scene's narration and who says it.</summary>
public sealed class StoryLine
{
    /// <summary><see cref="StoryCastMember.Narrator"/>, or the name of a member of the script's cast.</summary>
    public string Speaker { get; set; } = StoryCastMember.Narrator;

    public string Text { get; set; } = string.Empty;
}

/// <summary>A character who speaks in the story.</summary>
public sealed class StoryCastMember
{
    /// <summary>The speaker of every line that is not a character's.</summary>
    public const string Narrator = "narrator";

    /// <summary>As the script names them, in its language.</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary><c>male</c>, <c>female</c>, or null when it does not matter.</summary>
    public string? Gender { get; set; }

    /// <summary><c>child</c>, <c>young</c>, <c>adult</c> or <c>elder</c>; null for an adult.</summary>
    public string? Age { get; set; }

    /// <summary>The voice they were last given, so the person can see who speaks whom. Set when narration is made.</summary>
    public string? VoiceId { get; set; }
}

/// <summary>A quiet stretch in a clip, in seconds from its start.</summary>
public sealed class StoryPause
{
    public double Start { get; set; }
    public double End { get; set; }
}

/// <summary>The script a run builds from.</summary>
public sealed class StoryScript
{
    public string Title { get; set; } = string.Empty;
    public string? TitleEnglish { get; set; }
    public string Language { get; set; } = "hi";
    public string? Summary { get; set; }

    /// <summary>What to search the music catalogue for.</summary>
    public string? MusicQuery { get; set; }

    public List<StoryScene> Scenes { get; set; } = [];

    /// <summary>The characters who speak in the scenes' lines. Empty when the narrator tells it all.</summary>
    public List<StoryCastMember> Cast { get; set; } = [];

    /// <summary>Things the writer wants checked before this is published.</summary>
    public List<string> ReviewNotes { get; set; } = [];

    /// <summary>The text engine that wrote it, <c>manual</c> for a pasted reply, or <c>built-in</c>.</summary>
    public string? WrittenBy { get; set; }

    public DateTime CreatedAtUtc { get; set; }
}

/// <summary>A YouTube chapter: where it starts, and what it is called.</summary>
public sealed class StoryChapter
{
    public double StartSeconds { get; set; }
    public string Stamp { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
}

/// <summary>Everything needed to upload the finished video, checked against YouTube's own limits.</summary>
public sealed class StoryPublishKit
{
    /// <summary>The first is the one to use; the rest are different angles.</summary>
    public List<string> TitleOptions { get; set; } = [];

    public string Description { get; set; } = string.Empty;
    public List<string> Tags { get; set; } = [];
    public List<string> Hashtags { get; set; } = [];
    public List<StoryChapter> Chapters { get; set; } = [];
    public string PinnedComment { get; set; } = string.Empty;
    public string EngagementComment { get; set; } = string.Empty;

    /// <summary>What to do and check before and after uploading.</summary>
    public List<string> Checklist { get; set; } = [];

    public int DescriptionBytes { get; set; }
    public int TagsLength { get; set; }
}
