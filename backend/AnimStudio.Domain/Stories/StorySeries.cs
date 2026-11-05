namespace AnimStudio.Domain.Stories;

/// <summary>
/// Where a run sits in a story told over several videos: Part 1, Part 2 and on. Every part of one series carries the same
/// <see cref="Id"/>. The first part gets a link only when it is first continued; a story nobody continued has none.
/// </summary>
/// <remarks>
/// A part keeps what its writer needs to carry the story on - the story so far and the characters - so writing it never
/// has to read the earlier parts back, and a part still reads right after an earlier one is deleted.
/// </remarks>
public sealed class StorySeriesLink
{
    /// <summary><c>ss_{guid}</c>, shared by every part.</summary>
    public string Id { get; set; } = string.Empty;

    /// <summary>The series' name: the first part's title, unless the person renamed it.</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>1 for the story that started it.</summary>
    public int Part { get; set; } = 1;

    /// <summary>The run this part continues; null for Part 1.</summary>
    public string? PreviousRunId { get; set; }

    /// <summary>
    /// What happened in the earlier parts, one short paragraph each, newest last - built from their scripts when this part
    /// was started, with no model call. Null for Part 1.
    /// </summary>
    public string? StorySoFar { get; set; }

    /// <summary>How the previous part ended: its last scenes, so this one picks up there.</summary>
    public string? LastScene { get; set; }

    /// <summary>The characters who spoke in the earlier parts, so they keep their names (and so their voices) here.</summary>
    public List<StoryCastMember> Cast { get; set; } = [];

    /// <summary>
    /// When set above <see cref="Part"/>: start the next part by itself when this one is finished, from the first
    /// suggestion, until the series reaches this part. Bounded so a series can never make videos without end.
    /// </summary>
    public int? AutoContinueTo { get; set; }
}

/// <summary>An idea for the next part of a story, suggested by the text model or worked out from the script.</summary>
public sealed class StoryNextPartIdea
{
    public string Title { get; set; } = string.Empty;

    /// <summary>What happens in it, as notes for the writer.</summary>
    public string Notes { get; set; } = string.Empty;

    /// <summary>Why a viewer of the last part would click it: the question it answers or the cliffhanger it pays off.</summary>
    public string? Hook { get; set; }
}

/// <summary>
/// How fast the narration came out, measured from the audio, and the speed that would bring it to a comfortable pace. Worked
/// out every time the narration is made; costs no call to any engine.
/// </summary>
public sealed class StoryPace
{
    /// <summary>Words a minute the voice actually spoke, breaths before and after each scene left out.</summary>
    public double WordsPerMinute { get; set; }

    /// <summary>The pace aimed for, from the language and whether the story is for children.</summary>
    public double TargetWordsPerMinute { get; set; }

    /// <summary>The video speed that brings the voice to the target; 1 when it is already comfortable.</summary>
    public double SuggestedSpeed { get; set; } = 1.0;

    /// <summary><c>slow</c>, <c>good</c> or <c>fast</c>, as heard at the project's own pace.</summary>
    public string Verdict { get; set; } = "good";

    /// <summary>True when the suggestion was made the video's speed because <see cref="StoryBuildOptions.AutoPace"/> was on.</summary>
    public bool Applied { get; set; }

    public DateTime MeasuredAtUtc { get; set; }
}
