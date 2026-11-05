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

    /// <summary>
    /// Saved runs per person; past this the oldest that failed or were stopped are deleted. A finished story is kept
    /// whatever the count, because it has a video and may already be on YouTube.
    /// </summary>
    public int MaxSavedRunsPerUser { get; set; } = 40;

    /// <summary>The most runs the list and the storyboard show at once, newest first.</summary>
    public int MaxListedRuns { get; set; } = 300;

    public WikisourceOptions Wikisource { get; set; } = new();

    public StoryBudgetOptions Budget { get; set; } = new();
}

/// <summary>
/// The check before a build (<c>StoryAgent:Budget</c>): how many requests the build will send to each Google model and
/// each free image engine, set against what the app already sent today and the daily limit (Google's for a model, this
/// app's own cap for an image engine), so the person is warned before a build fails half-way or runs up a bill.
/// </summary>
public sealed class StoryBudgetOptions
{
    /// <summary>False skips the check: every build goes ahead without a warning.</summary>
    public bool Enabled { get; set; } = true;

    /// <summary>Warn when a build would take a model past this share of its daily limit.</summary>
    public int WarnAtPercent { get; set; } = 80;

    /// <summary>
    /// Requests per day per model, as Google's rate-limit page shows them for the project's tier. A model not listed is
    /// not checked. Google resets these at midnight Pacific time.
    /// </summary>
    public Dictionary<string, int> DailyRequestLimits { get; set; } = new(StringComparer.OrdinalIgnoreCase)
    {
        ["gemini-3.8-flash-tts"] = 100,
        ["gemini-3.8-flash-lite-tts"] = 100,
        ["gemini-3.1-flash-tts-preview"] = 100,
        ["gemini-2.5-flash-preview-tts"] = 100,
        ["gemini-2.5-pro-preview-tts"] = 50,
        ["lyria-3.5"] = 500,
        ["lyria-3-pro-preview"] = 500,
        ["lyria-3-clip-preview"] = 500,
        ["gemini-3.8-flash"] = 10_000,
        ["gemini-3.6-flash"] = 10_000,
        ["gemini-3.5-flash-lite"] = 10_000,
        ["gemini-3.1-flash-lite"] = 10_000
    };

    /// <summary>The time zone whose midnight starts a new day of requests; Google's is Pacific.</summary>
    public string ResetTimeZone { get; set; } = "America/Los_Angeles";
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
