namespace AnimStudio.Application.StoryAgent;

/// <summary>
/// Settings for the Story Agent (<c>StoryAgent</c> in configuration). Everything has a default
/// that works on a single-user machine, so none of this has to be set to try it.
/// </summary>
public sealed class StoryAgentOptions
{
    public const string Section = "StoryAgent";

    /// <summary>Turns the feature off: the API answers 404 and no worker runs.</summary>
    public bool Enabled { get; set; } = true;

    /// <summary>
    /// Runs one person can have building at once. A build speaks every scene and renders a video,
    /// which is minutes of CPU, so the default is small.
    /// </summary>
    public int MaxActiveRunsPerUser { get; set; } = 2;

    /// <summary>Saved runs per person; the oldest finished ones are deleted past this.</summary>
    public int MaxSavedRunsPerUser { get; set; } = 40;

    public WikisourceOptions Wikisource { get; set; } = new();
}

/// <summary>Where the text of the Granths is read from, and how gently.</summary>
public sealed class WikisourceOptions
{
    /// <summary>False keeps the search offline: only the curated pointers are used.</summary>
    public bool Enabled { get; set; } = true;

    /// <summary>
    /// The least time between two requests. Wikimedia asks automated readers to go one request at a
    /// time and slowly; a burst gets a 429. Zero is for tests.
    /// </summary>
    public int MinIntervalMs { get; set; } = 1500;

    /// <summary>A chapter is kept this long, so re-running a story does not read it again.</summary>
    public int CacheHours { get; set; } = 24;

    /// <summary>The most of a chapter that is kept. The writer sees even less of it.</summary>
    public int MaxExcerptChars { get; set; } = 12_000;

    /// <summary>The largest reply read. A page of verses is a few hundred kilobytes at most.</summary>
    public int MaxResponseKilobytes { get; set; } = 4096;

    /// <summary>
    /// Appended to the User-Agent so the site can reach whoever runs this if it misbehaves, as
    /// Wikimedia's policy asks. Optional; the project address is always sent.
    /// </summary>
    public string? Contact { get; set; }
}
