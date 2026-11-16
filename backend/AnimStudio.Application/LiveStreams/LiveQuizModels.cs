namespace AnimStudio.Application.LiveStreams;

public static class LiveQuizStatuses
{
    public const string Open = "Open";
    public const string Closed = "Closed";
    public const string Drawn = "Drawn";
}

public static class LiveQuizSources
{
    public const string YouTubeChat = "youtube_chat";
    public const string PratiyogitaWeb = "pratiyogita_web";
    public const string Rehearsal = "rehearsal";
}

public sealed record LiveQuizOption(
    string Key,
    string Text,
    string? TextHi = null);

public sealed record LiveQuizWinnerSummary(
    string WinnerId,
    string WinnerChannelId,
    string WinnerChannelTitle,
    string? WinnerChannelHandle,
    string? WinnerThumbnailUrl,
    string Source,
    string PrizeTitle,
    int TotalEntrants,
    int EligibleEntrants,
    string DrawAlgorithm,
    DateTime SelectedAtUtc);

public sealed class LiveQuizSession
{
    public string Id { get; set; } = string.Empty;
    public string OwnerUserId { get; set; } = string.Empty;
    public string StreamTitle { get; set; } = string.Empty;
    public string StreamChannelHandle { get; set; } = "@keshavsinghworld";
    public string? BroadcastId { get; set; }
    public string? YouTubeConnectionChannelId { get; set; }
    public string? ActiveLiveChatId { get; set; }
    public string? NextPageToken { get; set; }
    public string Question { get; set; } = string.Empty;
    public string? QuestionHi { get; set; }
    public List<LiveQuizOption> Options { get; set; } = [];
    public string CorrectOptionKey { get; set; } = "A";
    public string PrizeTitle { get; set; } = "Pratiyogita Verified Winner Badge & Live Shoutout";
    public string Language { get; set; } = "hi";
    public string Status { get; set; } = LiveQuizStatuses.Open;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? ClosedAtUtc { get; set; }
    public DateTime? DrawnAtUtc { get; set; }
    public LiveQuizWinnerSummary? Winner { get; set; }
}

public sealed class LiveQuizEntry
{
    public string Id { get; set; } = string.Empty;
    public string SessionId { get; set; } = string.Empty;
    public string ParticipantKey { get; set; } = string.Empty;
    public string Source { get; set; } = LiveQuizSources.YouTubeChat;
    public string YouTubeChannelId { get; set; } = string.Empty;
    public string ChannelTitle { get; set; } = string.Empty;
    public string? ChannelHandle { get; set; }
    public string? ThumbnailUrl { get; set; }
    public string AnswerOption { get; set; } = string.Empty;
    public string? RawMessage { get; set; }
    public bool IsCorrect { get; set; }
    public DateTime SubmittedAtUtc { get; set; } = DateTime.UtcNow;
}

public sealed record LiveQuizEntrantPreview(
    string ChannelTitle,
    string? ChannelHandle,
    string? ThumbnailUrl,
    string AnswerOption,
    string Source,
    bool IsCorrect,
    DateTime SubmittedAtUtc);

public sealed record LiveQuizPublicView(
    string Id,
    string StreamTitle,
    string StreamChannelHandle,
    string? BroadcastId,
    string Question,
    string? QuestionHi,
    IReadOnlyList<LiveQuizOption> Options,
    string? RevealedCorrectOptionKey,
    string PrizeTitle,
    string Language,
    string Status,
    int TotalEntrants,
    int EligibleEntrants,
    int ChatEntrantCount,
    int WebEntrantCount,
    DateTime CreatedAtUtc,
    DateTime? ClosedAtUtc,
    DateTime? DrawnAtUtc,
    LiveQuizWinnerSummary? Winner,
    IReadOnlyList<LiveQuizEntrantPreview> RecentEntrants);

public sealed record LiveQuizChatPollResult(
    LiveQuizPublicView Session,
    int MessagesScanned,
    int NewEntriesAdded,
    int PollingIntervalMillis);

public sealed record PlaybookSegment(
    int Order,
    string TimeRange,
    int DurationMinutes,
    string Channel,
    string Title,
    string TitleHi,
    string ActionCue,
    string ActionCueHi,
    bool TriggersQuizRound);

public sealed record StarterQuizQuestion(
    string Id,
    string Question,
    string QuestionHi,
    IReadOnlyList<LiveQuizOption> Options,
    string CorrectOptionKey,
    string PrizeTitle);

public sealed record FirstLivePlaybook(
    string PlanTitle,
    string PlanTitleHi,
    int TotalMinutes,
    string SuggestedBroadcastTitle,
    string SuggestedBroadcastTitleHi,
    string SuggestedDescription,
    IReadOnlyList<string> SuggestedTags,
    string PratiyogitaWinnersUrl,
    IReadOnlyList<PlaybookSegment> Segments,
    IReadOnlyList<StarterQuizQuestion> StarterQuestions,
    IReadOnlyList<string> PreFlightChecklist);
