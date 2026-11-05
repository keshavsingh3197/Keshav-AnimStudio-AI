namespace AnimStudio.Domain.Stories;

/// <summary>How a genre's scripts are written and checked.</summary>
public enum StoryGenreMode
{
    /// <summary>Researched in the Granths, written by the <c>story-script</c> prompt, every citation checked.</summary>
    Scripture = 0,

    /// <summary>Written from the title, the notes and the genre's style guide. No research and no citations.</summary>
    Creative = 1
}

/// <summary>
/// A kind of story the Story Agent makes - devotional, funny, a bedtime story - and everything that comes with it: how the
/// script is written, which topics it knows, and the look, music, voice, tags and links of the finished video.
/// </summary>
/// <remarks>
/// A run takes a copy of its genre when it starts, so the whole bundle stays the same for that story even if the genre
/// is edited later. The built-in genres are written to the database on first use and are edited there like any other.
/// </remarks>
public sealed class StoryGenre
{
    /// <summary>A short slug, e.g. <c>devotional</c>. What <see cref="StoryBrief.GenreId"/> carries.</summary>
    public string Id { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;
    public string? NameHindi { get; set; }
    public string Description { get; set; } = string.Empty;

    /// <summary>One emoji for the picker and the video description.</summary>
    public string Icon { get; set; } = "📖";

    /// <summary>Where it sits in the picker, lowest first.</summary>
    public int Order { get; set; }

    /// <summary>A disabled genre is kept but not offered for new stories.</summary>
    public bool Enabled { get; set; } = true;

    /// <summary>Ships with the app. Deleting one puts the shipped version back instead of removing it.</summary>
    public bool BuiltIn { get; set; }

    public StoryGenreMode Mode { get; set; } = StoryGenreMode.Creative;

    /// <summary>
    /// What the script writer is told about this kind of story: who it is for, the tone, how it is shaped. Used by
    /// <see cref="StoryGenreMode.Creative"/> genres; a scripture genre has its rules in the <c>story-script</c> prompt.
    /// </summary>
    public string StyleGuide { get; set; } = string.Empty;

    /// <summary>The moods a scene may have. They pick each scene's motion and cut.</summary>
    public List<string> Moods { get; set; } = [];

    // --- what a new story starts with --------------------------------------------------------

    /// <summary><c>hi</c> or <c>en</c>.</summary>
    public string DefaultLanguage { get; set; } = "hi";

    public int DefaultTargetSeconds { get; set; } = 150;
    public StoryFormat DefaultFormat { get; set; } = StoryFormat.Wide;
    public StoryLookStyle LookStyle { get; set; } = StoryLookStyle.Auto;
    public string? ImageStyle { get; set; }
    public string? MusicQuery { get; set; }
    public string? SpeechStyle { get; set; }

    // --- what the YouTube kit says ---------------------------------------------------------------

    public List<string> Tags { get; set; } = [];
    public List<string> Hashtags { get; set; } = [];

    /// <summary>Links printed in every video description of this genre: a playlist, a website, a source library.</summary>
    public List<StoryGenreLink> Links { get; set; } = [];

    /// <summary>A second title option, after a bar: <c>Story | {suffix}</c>.</summary>
    public string? TitleSuffix { get; set; }

    /// <summary>The closing line of the pinned comment, such as a greeting or a catch-phrase.</summary>
    public string? PinnedLine { get; set; }

    /// <summary>The YouTube category the checklist suggests, e.g. <c>Education</c> or <c>Comedy</c>.</summary>
    public string Category { get; set; } = "Entertainment";

    /// <summary>Made for children, as YouTube means it. The checklist says which audience to set.</summary>
    public bool MadeForKids { get; set; }

    /// <summary>Subjects a title can be about, with what the writer should know and, for scripture, where the texts tell it.</summary>
    public List<StoryGenreTopic> Topics { get; set; } = [];

    public DateTime UpdatedAtUtc { get; set; }
    public string? UpdatedBy { get; set; }
}

/// <summary>A subject a title can be about, and the words that recognise it.</summary>
public sealed class StoryGenreTopic
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Hindi { get; set; }

    /// <summary>Words in a title or the notes that mean this topic, in English or Hindi.</summary>
    public List<string> Keywords { get; set; } = [];

    public string Summary { get; set; } = string.Empty;
    public string? MusicQuery { get; set; }

    /// <summary>For a scripture genre: where in the Granths the story is told. Empty for a creative one.</summary>
    public List<StoryGenreSource> Sources { get; set; } = [];
}

/// <summary>A place in a text of the catalogue that tells a topic's story.</summary>
public sealed class StoryGenreSource
{
    /// <summary>A catalogue id such as <c>bhagavata-purana</c>.</summary>
    public string TextId { get; set; } = string.Empty;

    public string Ref { get; set; } = string.Empty;
    public string? Note { get; set; }
    public StorySourceConfidence Confidence { get; set; } = StorySourceConfidence.Medium;
}

public sealed class StoryGenreLink
{
    public string Label { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
}
