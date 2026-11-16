using System.Collections.Concurrent;
using AnimStudio.Application.LiveStreams;
using AnimStudio.Infrastructure.Publishing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using MongoDB.Bson;
using MongoDB.Driver;

namespace AnimStudio.Infrastructure.LiveStreams;

/// <summary>
/// Manages bilingual YouTube Live Stream Quiz rounds, YouTube Live Chat polling, cryptographic
/// random winner draws (merging Live Chat + Pratiyogita web verified entries via <c>AdminDb</c>),
/// and Keshav's First Live Launch Playbook.
/// </summary>
public sealed class LiveQuizService
{
    private const string SessionsCollection = "live_quiz_sessions";
    private const string EntriesCollection = "live_quiz_entries";
    private const string WinnersCollection = "live_quiz_winners";

    private readonly IServiceScopeFactory? _scopeFactory;
    private readonly YouTubeLiveClient? _liveClient;
    private readonly TimeProvider _clock;
    private readonly ILogger<LiveQuizService> _logger;

    private readonly IMongoCollection<BsonDocument>? _sessionsCol;
    private readonly IMongoCollection<BsonDocument>? _entriesCol;
    private readonly IMongoCollection<BsonDocument>? _winnersCol;

    private readonly ConcurrentDictionary<string, LiveQuizSession> _sessions = new(StringComparer.Ordinal);
    private readonly ConcurrentDictionary<string, ConcurrentDictionary<string, LiveQuizEntry>> _entries = new(StringComparer.Ordinal);
    private readonly ConcurrentDictionary<string, BsonDocument> _winners = new(StringComparer.Ordinal);
    private readonly SemaphoreSlim _indexesGate = new(1, 1);
    private volatile bool _indexesEnsured;

    public LiveQuizService(
        IConfiguration configuration,
        TimeProvider clock,
        ILogger<LiveQuizService> logger,
        IServiceScopeFactory? scopeFactory = null,
        YouTubeLiveClient? liveClient = null)
    {
        _clock = clock;
        _logger = logger;
        _scopeFactory = scopeFactory;
        _liveClient = liveClient;

        var enabled = !string.Equals(configuration["CentralMongo:Enabled"], "false", StringComparison.OrdinalIgnoreCase);
        if (!enabled) return;

        var connString = FirstNonEmpty(
            configuration["CentralMongo:ConnectionString"],
            Environment.GetEnvironmentVariable("CentralMongo__ConnectionString"),
            configuration["Mongo:ConnectionString"],
            Environment.GetEnvironmentVariable("Mongo__ConnectionString"),
            configuration["MongoDbSettings:ConnectionString"],
            Environment.GetEnvironmentVariable("MONGODB_CONNECTION_STRING"));
        var dbName = FirstNonEmpty(
            configuration["CentralMongo:DatabaseName"],
            configuration["CentralMongo:Database"],
            Environment.GetEnvironmentVariable("CentralMongo__DatabaseName"),
            Environment.GetEnvironmentVariable("CentralMongo__Database")) ?? "AdminDb";

        if (string.IsNullOrWhiteSpace(connString)) return;

        try
        {
            var settings = MongoClientSettings.FromConnectionString(connString);
            settings.ConnectTimeout = TimeSpan.FromSeconds(4);
            settings.ServerSelectionTimeout = TimeSpan.FromSeconds(4);
            settings.SocketTimeout = TimeSpan.FromSeconds(5);
            var db = new MongoClient(settings).GetDatabase(dbName);
            _sessionsCol = db.GetCollection<BsonDocument>(SessionsCollection);
            _entriesCol = db.GetCollection<BsonDocument>(EntriesCollection);
            _winnersCol = db.GetCollection<BsonDocument>(WinnersCollection);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "LiveQuizService could not initialize AdminDb collections; falling back to in-memory quiz state.");
        }
    }

    public FirstLivePlaybook GetFirstLivePlaybook() => LiveQuizEngine.BuildFirstLivePlaybook();

    public async Task<LiveQuizPublicView> CreateSessionAsync(
        string ownerUserId,
        CreateLiveQuizSessionInput input,
        CancellationToken ct = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(input.Question);
        var normalizedOptions = (input.Options ?? [])
            .Where(o => LiveQuizEngine.NormalizeOptionKey(o.Key) is not null && !string.IsNullOrWhiteSpace(o.Text))
            .Select(o => new LiveQuizOption(
                LiveQuizEngine.NormalizeOptionKey(o.Key)!,
                o.Text.Trim(),
                string.IsNullOrWhiteSpace(o.TextHi) ? null : o.TextHi.Trim()))
            .GroupBy(o => o.Key, StringComparer.Ordinal)
            .Select(g => g.First())
            .OrderBy(o => o.Key, StringComparer.Ordinal)
            .ToList();

        if (normalizedOptions.Count < 2)
            throw new ArgumentException("Provide at least two quiz options (A, B...).", nameof(input));

        var correctKey = LiveQuizEngine.NormalizeOptionKey(input.CorrectOptionKey);
        if (correctKey is null || !normalizedOptions.Any(o => o.Key == correctKey))
            throw new ArgumentException("Correct option key must match one of the provided options.", nameof(input));

        var now = _clock.GetUtcNow().UtcDateTime;

        if (input.ClosePreviousOpen)
        {
            await CloseOpenSessionsForOwnerAsync(ownerUserId, now, ct).ConfigureAwait(false);
        }

        var session = new LiveQuizSession
        {
            Id = "lqz_" + Guid.NewGuid().ToString("n")[..12],
            OwnerUserId = ownerUserId,
            StreamTitle = string.IsNullOrWhiteSpace(input.StreamTitle) ? "Keshav Network Live Quiz" : input.StreamTitle.Trim(),
            StreamChannelHandle = NormalizeHandle(input.StreamChannelHandle) ?? "@keshavsinghworld",
            BroadcastId = string.IsNullOrWhiteSpace(input.BroadcastId) ? null : input.BroadcastId.Trim(),
            YouTubeConnectionChannelId = string.IsNullOrWhiteSpace(input.YouTubeConnectionChannelId) ? null : input.YouTubeConnectionChannelId.Trim(),
            Question = input.Question.Trim(),
            QuestionHi = string.IsNullOrWhiteSpace(input.QuestionHi) ? null : input.QuestionHi.Trim(),
            Options = normalizedOptions,
            CorrectOptionKey = correctKey,
            PrizeTitle = string.IsNullOrWhiteSpace(input.PrizeTitle)
                ? "Pratiyogita Verified Winner Badge & Live Shoutout"
                : input.PrizeTitle.Trim(),
            Language = string.Equals(input.Language, "en", StringComparison.OrdinalIgnoreCase) ? "en" : "hi",
            Status = LiveQuizStatuses.Open,
            CreatedAtUtc = now
        };

        _sessions[session.Id] = session;
        _entries.TryAdd(session.Id, new ConcurrentDictionary<string, LiveQuizEntry>(StringComparer.OrdinalIgnoreCase));
        await PersistSessionAsync(session, ct).ConfigureAwait(false);

        return await BuildPublicViewAsync(session, ct).ConfigureAwait(false);
    }

    public async Task<LiveQuizPublicView?> GetActivePublicViewAsync(string? sessionId = null, CancellationToken ct = default)
    {
        LiveQuizSession? session = null;
        if (!string.IsNullOrWhiteSpace(sessionId))
        {
            session = await LoadSessionAsync(sessionId.Trim(), ct).ConfigureAwait(false);
        }
        else
        {
            var all = await LoadRecentSessionsAsync(ownerUserId: null, limit: 25, ct).ConfigureAwait(false);
            session = all.FirstOrDefault(s => s.Status == LiveQuizStatuses.Open)
                ?? all.FirstOrDefault(s => s.CreatedAtUtc >= _clock.GetUtcNow().UtcDateTime.AddHours(-12));
        }

        return session is null ? null : await BuildPublicViewAsync(session, ct).ConfigureAwait(false);
    }

    public async Task<IReadOnlyList<LiveQuizPublicView>> ListOwnerSessionsAsync(string ownerUserId, int limit = 20, CancellationToken ct = default)
    {
        var sessions = await LoadRecentSessionsAsync(ownerUserId, limit, ct).ConfigureAwait(false);
        var views = new List<LiveQuizPublicView>(sessions.Count);
        foreach (var session in sessions)
            views.Add(await BuildPublicViewAsync(session, ct).ConfigureAwait(false));
        return views;
    }

    public async Task<LiveQuizChatPollResult> PollYouTubeLiveChatAsync(
        string sessionId,
        string ownerUserId,
        string? broadcastOrVideoIdOverride,
        string? youTubeConnectionChannelIdOverride,
        CancellationToken ct = default)
    {
        var session = await RequireOwnedSessionAsync(sessionId, ownerUserId, ct).ConfigureAwait(false);
        if (session.Status != LiveQuizStatuses.Open)
            throw new InvalidOperationException("Only an Open quiz round can poll YouTube Live Chat.");

        var broadcastId = FirstNonEmpty(broadcastOrVideoIdOverride, session.BroadcastId);
        var ytChannelId = FirstNonEmpty(youTubeConnectionChannelIdOverride, session.YouTubeConnectionChannelId);

        if (string.IsNullOrWhiteSpace(broadcastId) || string.IsNullOrWhiteSpace(ytChannelId))
            throw new InvalidOperationException("Provide both a connected YouTube channel and a live Broadcast/Video ID before polling live chat.");

        if (_scopeFactory is null || _liveClient is null)
            throw new InvalidOperationException("YouTube Live polling services are unavailable in this host.");

        await using var scope = _scopeFactory.CreateAsyncScope();
        var connections = scope.ServiceProvider.GetRequiredService<YouTubeConnectionStore>();
        var accessToken = await connections.GetAccessTokenAsync(ownerUserId, ytChannelId, ct).ConfigureAwait(false);

        var chatId = session.ActiveLiveChatId;
        if (string.IsNullOrWhiteSpace(chatId) || !string.Equals(session.BroadcastId, broadcastId, StringComparison.Ordinal))
        {
            chatId = await _liveClient.GetActiveLiveChatIdAsync(broadcastId, accessToken, ct).ConfigureAwait(false);
            if (string.IsNullOrWhiteSpace(chatId))
                throw new YouTubePublishException("youtube-live-chat-unavailable", "This broadcast does not have an active YouTube Live Chat right now.");
            session.BroadcastId = broadcastId;
            session.YouTubeConnectionChannelId = ytChannelId;
            session.ActiveLiveChatId = chatId;
            session.NextPageToken = null;
        }

        var page = await _liveClient.ListLiveChatMessagesAsync(chatId, accessToken, session.NextPageToken, ct).ConfigureAwait(false);
        session.NextPageToken = page.NextPageToken;
        await PersistSessionAsync(session, ct).ConfigureAwait(false);

        var added = 0;
        foreach (var msg in page.Messages)
        {
            var option = LiveQuizEngine.ParseAnswerOption(msg.MessageText, session.Options);
            if (option is null) continue;

            var key = LiveQuizEngine.NormalizeParticipantKey(msg.AuthorChannelId, null, msg.AuthorDisplayName);
            var entry = new LiveQuizEntry
            {
                Id = "ent_" + Guid.NewGuid().ToString("n")[..12],
                SessionId = session.Id,
                ParticipantKey = key,
                Source = LiveQuizSources.YouTubeChat,
                YouTubeChannelId = msg.AuthorChannelId,
                ChannelTitle = msg.AuthorDisplayName,
                ChannelHandle = null,
                ThumbnailUrl = msg.AuthorProfileImageUrl,
                AnswerOption = option,
                RawMessage = msg.MessageText.Length > 140 ? msg.MessageText[..140] : msg.MessageText,
                IsCorrect = string.Equals(option, session.CorrectOptionKey, StringComparison.OrdinalIgnoreCase),
                SubmittedAtUtc = msg.PublishedAtUtc
            };

            if (await TryInsertEntryAsync(entry, ct).ConfigureAwait(false))
                added++;
        }

        var view = await BuildPublicViewAsync(session, ct).ConfigureAwait(false);
        return new LiveQuizChatPollResult(view, page.Messages.Count, added, page.PollingIntervalMillis);
    }

    /// <summary>Allows the host to test/rehearse a quiz round or add a verified chat entry in offline verification.</summary>
    public async Task<LiveQuizPublicView> AddEntrantAsync(
        string sessionId,
        string ownerUserId,
        AddQuizEntrantInput input,
        CancellationToken ct = default)
    {
        var session = await RequireOwnedSessionAsync(sessionId, ownerUserId, ct).ConfigureAwait(false);
        if (session.Status != LiveQuizStatuses.Open)
            throw new InvalidOperationException("Cannot add entries after the quiz round is closed or drawn.");

        var option = LiveQuizEngine.NormalizeOptionKey(input.AnswerOption)
            ?? throw new ArgumentException("AnswerOption must be A, B, C, or D.", nameof(input));

        var entry = new LiveQuizEntry
        {
            Id = "ent_" + Guid.NewGuid().ToString("n")[..12],
            SessionId = session.Id,
            ParticipantKey = LiveQuizEngine.NormalizeParticipantKey(input.YouTubeChannelId, input.ChannelHandle, input.ChannelTitle),
            Source = string.IsNullOrWhiteSpace(input.Source) ? LiveQuizSources.Rehearsal : input.Source.Trim(),
            YouTubeChannelId = (input.YouTubeChannelId ?? string.Empty).Trim(),
            ChannelTitle = string.IsNullOrWhiteSpace(input.ChannelTitle) ? "Viewer" : input.ChannelTitle.Trim(),
            ChannelHandle = NormalizeHandle(input.ChannelHandle),
            ThumbnailUrl = input.ThumbnailUrl,
            AnswerOption = option,
            RawMessage = input.RawMessage,
            IsCorrect = string.Equals(option, session.CorrectOptionKey, StringComparison.OrdinalIgnoreCase),
            SubmittedAtUtc = _clock.GetUtcNow().UtcDateTime
        };

        await TryInsertEntryAsync(entry, ct).ConfigureAwait(false);
        return await BuildPublicViewAsync(session, ct).ConfigureAwait(false);
    }

    public async Task<LiveQuizPublicView> CloseSessionAsync(string sessionId, string ownerUserId, CancellationToken ct = default)
    {
        var session = await RequireOwnedSessionAsync(sessionId, ownerUserId, ct).ConfigureAwait(false);
        if (session.Status == LiveQuizStatuses.Open)
        {
            session.Status = LiveQuizStatuses.Closed;
            session.ClosedAtUtc = _clock.GetUtcNow().UtcDateTime;
            await PersistSessionAsync(session, ct).ConfigureAwait(false);
        }

        return await BuildPublicViewAsync(session, ct).ConfigureAwait(false);
    }

    /// <summary>
    /// Combines all entries from YouTube Live Chat and Pratiyogita web verification,
    /// selects one verified correct winner using <see cref="System.Security.Cryptography.RandomNumberGenerator"/>,
    /// updates the quiz overlay state, and persists the winner in <c>AdminDb.live_quiz_winners</c>.
    /// </summary>
    public async Task<LiveQuizPublicView> DrawWinnerAsync(
        string sessionId,
        string ownerUserId,
        Func<int, int>? randomIndexProvider = null,
        CancellationToken ct = default)
    {
        var session = await RequireOwnedSessionAsync(sessionId, ownerUserId, ct).ConfigureAwait(false);
        var entries = await LoadEntriesAsync(session.Id, ct).ConfigureAwait(false);

        var (picked, eligibleCount, totalUnique) = LiveQuizEngine.SelectCryptographicWinner(entries, randomIndexProvider);
        if (picked is null)
            throw new InvalidOperationException("No correct verified entrants have answered this quiz round yet.");

        var now = _clock.GetUtcNow().UtcDateTime;
        var winnerId = "win_" + Guid.NewGuid().ToString("n")[..12];
        var winner = new LiveQuizWinnerSummary(
            WinnerId: winnerId,
            WinnerChannelId: picked.YouTubeChannelId,
            WinnerChannelTitle: picked.ChannelTitle,
            WinnerChannelHandle: picked.ChannelHandle,
            WinnerThumbnailUrl: picked.ThumbnailUrl,
            Source: picked.Source,
            PrizeTitle: session.PrizeTitle,
            TotalEntrants: totalUnique,
            EligibleEntrants: eligibleCount,
            DrawAlgorithm: LiveQuizEngine.CryptographicAlgorithmName,
            SelectedAtUtc: now);

        session.Status = LiveQuizStatuses.Drawn;
        session.ClosedAtUtc ??= now;
        session.DrawnAtUtc = now;
        session.Winner = winner;
        await PersistSessionAsync(session, ct).ConfigureAwait(false);

        var correctOptionText = session.Options.FirstOrDefault(o => o.Key == session.CorrectOptionKey)?.Text ?? session.CorrectOptionKey;
        await PersistWinnerArchiveAsync(session, winner, correctOptionText, ct).ConfigureAwait(false);

        return await BuildPublicViewAsync(session, ct).ConfigureAwait(false);
    }

    public async Task<IReadOnlyList<BsonDocument>> ListWinnersRawAsync(int limit = 30, CancellationToken ct = default)
    {
        var clamped = Math.Clamp(limit, 1, 100);
        if (_winnersCol is not null)
        {
            try
            {
                await EnsureIndexesAsync(ct).ConfigureAwait(false);
                return await _winnersCol
                    .Find(FilterDefinition<BsonDocument>.Empty)
                    .Sort(Builders<BsonDocument>.Sort.Descending("SelectedAtUtc"))
                    .Limit(clamped)
                    .ToListAsync(ct)
                    .ConfigureAwait(false);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _logger.LogWarning(ex, "Failed loading live_quiz_winners from AdminDb; falling back to in-memory winners.");
            }
        }

        return _winners.Values
            .OrderByDescending(d => d.TryGetValue("SelectedAtUtc", out var dt) ? dt.ToUniversalTime() : DateTime.MinValue)
            .Take(clamped)
            .ToList();
    }

    private async Task<LiveQuizSession> RequireOwnedSessionAsync(string sessionId, string ownerUserId, CancellationToken ct)
    {
        var session = await LoadSessionAsync(sessionId, ct).ConfigureAwait(false);
        if (session is null || !string.Equals(session.OwnerUserId, ownerUserId, StringComparison.Ordinal))
            throw new KeyNotFoundException("Live quiz session not found.");
        return session;
    }

    private async Task CloseOpenSessionsForOwnerAsync(string ownerUserId, DateTime now, CancellationToken ct)
    {
        foreach (var existing in _sessions.Values.Where(s => s.OwnerUserId == ownerUserId && s.Status == LiveQuizStatuses.Open))
        {
            existing.Status = LiveQuizStatuses.Closed;
            existing.ClosedAtUtc = now;
        }

        if (_sessionsCol is not null)
        {
            try
            {
                var filter = Builders<BsonDocument>.Filter.Eq("OwnerUserId", ownerUserId)
                    & Builders<BsonDocument>.Filter.Eq("Status", LiveQuizStatuses.Open);
                var update = Builders<BsonDocument>.Update
                    .Set("Status", LiveQuizStatuses.Closed)
                    .Set("ClosedAtUtc", now);
                await _sessionsCol.UpdateManyAsync(filter, update, cancellationToken: ct).ConfigureAwait(false);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _logger.LogWarning(ex, "Non-fatal: failed closing previous open quiz sessions in AdminDb.");
            }
        }
    }

    private async Task<LiveQuizPublicView> BuildPublicViewAsync(LiveQuizSession session, CancellationToken ct)
    {
        var entries = await LoadEntriesAsync(session.Id, ct).ConfigureAwait(false);
        var unique = entries
            .GroupBy(e => e.ParticipantKey, StringComparer.OrdinalIgnoreCase)
            .Select(g => g.OrderBy(x => x.SubmittedAtUtc).First())
            .ToList();

        var recent = unique
            .OrderByDescending(e => e.SubmittedAtUtc)
            .Take(15)
            .Select(e => new LiveQuizEntrantPreview(
                e.ChannelTitle,
                e.ChannelHandle,
                e.ThumbnailUrl,
                e.AnswerOption,
                e.Source,
                session.Status == LiveQuizStatuses.Open ? false : e.IsCorrect,
                e.SubmittedAtUtc))
            .ToList();

        var revealAnswer = session.Status != LiveQuizStatuses.Open ? session.CorrectOptionKey : null;
        return new LiveQuizPublicView(
            session.Id,
            session.StreamTitle,
            session.StreamChannelHandle,
            session.BroadcastId,
            session.Question,
            session.QuestionHi,
            session.Options,
            revealAnswer,
            session.PrizeTitle,
            session.Language,
            session.Status,
            TotalEntrants: unique.Count,
            EligibleEntrants: unique.Count(e => e.IsCorrect),
            ChatEntrantCount: unique.Count(e => e.Source == LiveQuizSources.YouTubeChat),
            WebEntrantCount: unique.Count(e => e.Source == LiveQuizSources.PratiyogitaWeb),
            session.CreatedAtUtc,
            session.ClosedAtUtc,
            session.DrawnAtUtc,
            session.Winner,
            recent);
    }

    private async Task<bool> TryInsertEntryAsync(LiveQuizEntry entry, CancellationToken ct)
    {
        var map = _entries.GetOrAdd(entry.SessionId, _ => new ConcurrentDictionary<string, LiveQuizEntry>(StringComparer.OrdinalIgnoreCase));
        if (!map.TryAdd(entry.ParticipantKey, entry))
            return false;

        if (_entriesCol is null) return true;

        try
        {
            await EnsureIndexesAsync(ct).ConfigureAwait(false);
            var doc = new BsonDocument
            {
                ["_id"] = $"{entry.SessionId}:{entry.ParticipantKey}",
                ["SessionId"] = entry.SessionId,
                ["ParticipantKey"] = entry.ParticipantKey,
                ["Source"] = entry.Source,
                ["YouTubeChannelId"] = entry.YouTubeChannelId,
                ["ChannelTitle"] = entry.ChannelTitle,
                ["ChannelHandle"] = entry.ChannelHandle ?? string.Empty,
                ["ThumbnailUrl"] = entry.ThumbnailUrl ?? string.Empty,
                ["AnswerOption"] = entry.AnswerOption,
                ["RawMessage"] = entry.RawMessage ?? string.Empty,
                ["IsCorrect"] = entry.IsCorrect,
                ["SubmittedAtUtc"] = entry.SubmittedAtUtc
            };
            var filter = Builders<BsonDocument>.Filter.Eq("_id", doc["_id"].AsString);
            await _entriesCol.ReplaceOneAsync(filter, doc, new ReplaceOptions { IsUpsert = true }, ct).ConfigureAwait(false);
            return true;
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogWarning(ex, "Non-fatal: failed persisting quiz entry into AdminDb.live_quiz_entries.");
            return true;
        }
    }

    private async Task<List<LiveQuizEntry>> LoadEntriesAsync(string sessionId, CancellationToken ct)
    {
        if (_entriesCol is not null)
        {
            try
            {
                await EnsureIndexesAsync(ct).ConfigureAwait(false);
                var docs = await _entriesCol
                    .Find(Builders<BsonDocument>.Filter.Eq("SessionId", sessionId))
                    .Sort(Builders<BsonDocument>.Sort.Ascending("SubmittedAtUtc"))
                    .Limit(2000)
                    .ToListAsync(ct)
                    .ConfigureAwait(false);

                var parsed = docs.Select(MapEntry).ToList();
                if (parsed.Count > 0)
                    return parsed;
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _logger.LogWarning(ex, "Failed reading AdminDb.live_quiz_entries; falling back to in-memory entries.");
            }
        }

        return _entries.TryGetValue(sessionId, out var map) ? [.. map.Values] : [];
    }

    private async Task PersistSessionAsync(LiveQuizSession session, CancellationToken ct)
    {
        _sessions[session.Id] = session;
        if (_sessionsCol is null) return;

        try
        {
            await EnsureIndexesAsync(ct).ConfigureAwait(false);
            var optionsArray = new BsonArray(session.Options.Select(o => new BsonDocument
            {
                ["Key"] = o.Key,
                ["Text"] = o.Text,
                ["TextHi"] = o.TextHi is null ? BsonNull.Value : o.TextHi
            }));

            BsonValue winnerVal = session.Winner is null
                ? BsonNull.Value
                : new BsonDocument
                {
                    ["WinnerId"] = session.Winner.WinnerId,
                    ["WinnerChannelId"] = session.Winner.WinnerChannelId,
                    ["WinnerChannelTitle"] = session.Winner.WinnerChannelTitle,
                    ["WinnerChannelHandle"] = session.Winner.WinnerChannelHandle is null ? BsonNull.Value : session.Winner.WinnerChannelHandle,
                    ["WinnerThumbnailUrl"] = session.Winner.WinnerThumbnailUrl is null ? BsonNull.Value : session.Winner.WinnerThumbnailUrl,
                    ["Source"] = session.Winner.Source,
                    ["PrizeTitle"] = session.Winner.PrizeTitle,
                    ["TotalEntrants"] = session.Winner.TotalEntrants,
                    ["EligibleEntrants"] = session.Winner.EligibleEntrants,
                    ["DrawAlgorithm"] = session.Winner.DrawAlgorithm,
                    ["SelectedAtUtc"] = session.Winner.SelectedAtUtc
                };

            var doc = new BsonDocument
            {
                ["_id"] = session.Id,
                ["OwnerUserId"] = session.OwnerUserId,
                ["StreamTitle"] = session.StreamTitle,
                ["StreamChannelHandle"] = session.StreamChannelHandle,
                ["BroadcastId"] = session.BroadcastId is null ? BsonNull.Value : session.BroadcastId,
                ["YouTubeConnectionChannelId"] = session.YouTubeConnectionChannelId is null ? BsonNull.Value : session.YouTubeConnectionChannelId,
                ["ActiveLiveChatId"] = session.ActiveLiveChatId is null ? BsonNull.Value : session.ActiveLiveChatId,
                ["NextPageToken"] = session.NextPageToken is null ? BsonNull.Value : session.NextPageToken,
                ["Question"] = session.Question,
                ["QuestionHi"] = session.QuestionHi is null ? BsonNull.Value : session.QuestionHi,
                ["Options"] = optionsArray,
                ["CorrectOptionKey"] = session.CorrectOptionKey,
                ["PrizeTitle"] = session.PrizeTitle,
                ["Language"] = session.Language,
                ["Status"] = session.Status,
                ["CreatedAtUtc"] = session.CreatedAtUtc,
                ["ClosedAtUtc"] = session.ClosedAtUtc.HasValue ? session.ClosedAtUtc.Value : BsonNull.Value,
                ["DrawnAtUtc"] = session.DrawnAtUtc.HasValue ? session.DrawnAtUtc.Value : BsonNull.Value,
                ["Winner"] = winnerVal
            };

            await _sessionsCol.ReplaceOneAsync(
                Builders<BsonDocument>.Filter.Eq("_id", session.Id),
                doc,
                new ReplaceOptions { IsUpsert = true },
                ct).ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogWarning(ex, "Non-fatal: failed persisting session {SessionId} to AdminDb.", session.Id);
        }
    }

    private async Task PersistWinnerArchiveAsync(
        LiveQuizSession session,
        LiveQuizWinnerSummary winner,
        string correctOptionText,
        CancellationToken ct)
    {
        var doc = new BsonDocument
        {
            ["_id"] = winner.WinnerId,
            ["SessionId"] = session.Id,
            ["StreamTitle"] = session.StreamTitle,
            ["BroadcastId"] = session.BroadcastId is null ? BsonNull.Value : session.BroadcastId,
            ["StreamChannelHandle"] = session.StreamChannelHandle,
            ["StreamDateUtc"] = session.CreatedAtUtc,
            ["Question"] = session.Question,
            ["QuestionHi"] = session.QuestionHi is null ? BsonNull.Value : session.QuestionHi,
            ["CorrectOptionKey"] = session.CorrectOptionKey,
            ["CorrectOptionText"] = correctOptionText,
            ["WinnerChannelId"] = winner.WinnerChannelId,
            ["WinnerChannelTitle"] = winner.WinnerChannelTitle,
            ["WinnerChannelHandle"] = winner.WinnerChannelHandle is null ? BsonNull.Value : winner.WinnerChannelHandle,
            ["WinnerThumbnailUrl"] = winner.WinnerThumbnailUrl is null ? BsonNull.Value : winner.WinnerThumbnailUrl,
            ["WinnerSource"] = winner.Source,
            ["PrizeTitle"] = winner.PrizeTitle,
            ["TotalEntrants"] = winner.TotalEntrants,
            ["EligibleEntrants"] = winner.EligibleEntrants,
            ["DrawAlgorithm"] = winner.DrawAlgorithm,
            ["SelectedAtUtc"] = winner.SelectedAtUtc,
            ["VerifiedByYouTubeReadonly"] = true
        };

        _winners[winner.WinnerId] = doc;
        if (_winnersCol is null) return;

        try
        {
            await EnsureIndexesAsync(ct).ConfigureAwait(false);
            await _winnersCol.ReplaceOneAsync(
                Builders<BsonDocument>.Filter.Eq("_id", winner.WinnerId),
                doc,
                new ReplaceOptions { IsUpsert = true },
                ct).ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogWarning(ex, "Non-fatal: failed persisting winner {WinnerId} to AdminDb.live_quiz_winners.", winner.WinnerId);
        }
    }

    private async Task<LiveQuizSession?> LoadSessionAsync(string sessionId, CancellationToken ct)
    {
        if (_sessions.TryGetValue(sessionId, out var mem))
            return mem;

        if (_sessionsCol is null) return null;

        try
        {
            var doc = await _sessionsCol
                .Find(Builders<BsonDocument>.Filter.Eq("_id", sessionId))
                .FirstOrDefaultAsync(ct)
                .ConfigureAwait(false);
            if (doc is null) return null;
            var mapped = MapSession(doc);
            _sessions[mapped.Id] = mapped;
            return mapped;
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogWarning(ex, "Failed reading quiz session {SessionId} from AdminDb.", sessionId);
            return null;
        }
    }

    private async Task<List<LiveQuizSession>> LoadRecentSessionsAsync(string? ownerUserId, int limit, CancellationToken ct)
    {
        var clamped = Math.Clamp(limit, 1, 50);
        if (_sessionsCol is not null)
        {
            try
            {
                await EnsureIndexesAsync(ct).ConfigureAwait(false);
                var filter = string.IsNullOrWhiteSpace(ownerUserId)
                    ? FilterDefinition<BsonDocument>.Empty
                    : Builders<BsonDocument>.Filter.Eq("OwnerUserId", ownerUserId);

                var docs = await _sessionsCol
                    .Find(filter)
                    .Sort(Builders<BsonDocument>.Sort.Descending("CreatedAtUtc"))
                    .Limit(clamped)
                    .ToListAsync(ct)
                    .ConfigureAwait(false);

                var mapped = docs.Select(MapSession).ToList();
                foreach (var s in mapped)
                    _sessions[s.Id] = s;
                return mapped;
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                _logger.LogWarning(ex, "Failed reading quiz sessions from AdminDb; falling back to memory.");
            }
        }

        return _sessions.Values
            .Where(s => string.IsNullOrWhiteSpace(ownerUserId) || string.Equals(s.OwnerUserId, ownerUserId, StringComparison.Ordinal))
            .OrderByDescending(s => s.CreatedAtUtc)
            .Take(clamped)
            .ToList();
    }

    private async Task EnsureIndexesAsync(CancellationToken ct)
    {
        if (_indexesEnsured || _sessionsCol is null || _entriesCol is null || _winnersCol is null) return;
        await _indexesGate.WaitAsync(ct).ConfigureAwait(false);
        try
        {
            if (_indexesEnsured) return;
            await _sessionsCol.Indexes.CreateOneAsync(
                new CreateIndexModel<BsonDocument>(
                    Builders<BsonDocument>.IndexKeys.Descending("CreatedAtUtc"),
                    new CreateIndexOptions { Name = "ix_live_quiz_sessions_created" }),
                cancellationToken: ct).ConfigureAwait(false);
            await _entriesCol.Indexes.CreateOneAsync(
                new CreateIndexModel<BsonDocument>(
                    Builders<BsonDocument>.IndexKeys.Ascending("SessionId").Ascending("ParticipantKey"),
                    new CreateIndexOptions { Name = "ux_live_quiz_entries_session_participant", Unique = true }),
                cancellationToken: ct).ConfigureAwait(false);
            await _winnersCol.Indexes.CreateOneAsync(
                new CreateIndexModel<BsonDocument>(
                    Builders<BsonDocument>.IndexKeys.Descending("SelectedAtUtc"),
                    new CreateIndexOptions { Name = "ix_live_quiz_winners_selected" }),
                cancellationToken: ct).ConfigureAwait(false);
            _indexesEnsured = true;
        }
        finally
        {
            _indexesGate.Release();
        }
    }

    private static LiveQuizSession MapSession(BsonDocument doc)
    {
        var options = new List<LiveQuizOption>();
        if (doc.TryGetValue("Options", out var optVal) && optVal.IsBsonArray)
        {
            foreach (var item in optVal.AsBsonArray.OfType<BsonDocument>())
            {
                options.Add(new LiveQuizOption(
                    Str(item, "Key") ?? "A",
                    Str(item, "Text") ?? string.Empty,
                    Str(item, "TextHi")));
            }
        }

        LiveQuizWinnerSummary? winner = null;
        if (doc.TryGetValue("Winner", out var wVal) && wVal.IsBsonDocument)
        {
            var w = wVal.AsBsonDocument;
            winner = new LiveQuizWinnerSummary(
                Str(w, "WinnerId") ?? string.Empty,
                Str(w, "WinnerChannelId") ?? string.Empty,
                Str(w, "WinnerChannelTitle") ?? string.Empty,
                Str(w, "WinnerChannelHandle"),
                Str(w, "WinnerThumbnailUrl"),
                Str(w, "Source") ?? LiveQuizSources.YouTubeChat,
                Str(w, "PrizeTitle") ?? string.Empty,
                w.TryGetValue("TotalEntrants", out var te) && te.IsInt32 ? te.AsInt32 : 0,
                w.TryGetValue("EligibleEntrants", out var ee) && ee.IsInt32 ? ee.AsInt32 : 0,
                Str(w, "DrawAlgorithm") ?? LiveQuizEngine.CryptographicAlgorithmName,
                w.TryGetValue("SelectedAtUtc", out var sa) && sa.IsValidDateTime ? sa.ToUniversalTime() : DateTime.UtcNow);
        }

        return new LiveQuizSession
        {
            Id = Str(doc, "_id") ?? string.Empty,
            OwnerUserId = Str(doc, "OwnerUserId") ?? string.Empty,
            StreamTitle = Str(doc, "StreamTitle") ?? "Keshav Network Live Quiz",
            StreamChannelHandle = Str(doc, "StreamChannelHandle") ?? "@keshavsinghworld",
            BroadcastId = Str(doc, "BroadcastId"),
            YouTubeConnectionChannelId = Str(doc, "YouTubeConnectionChannelId"),
            ActiveLiveChatId = Str(doc, "ActiveLiveChatId"),
            NextPageToken = Str(doc, "NextPageToken"),
            Question = Str(doc, "Question") ?? string.Empty,
            QuestionHi = Str(doc, "QuestionHi"),
            Options = options,
            CorrectOptionKey = Str(doc, "CorrectOptionKey") ?? "A",
            PrizeTitle = Str(doc, "PrizeTitle") ?? string.Empty,
            Language = Str(doc, "Language") ?? "hi",
            Status = Str(doc, "Status") ?? LiveQuizStatuses.Open,
            CreatedAtUtc = doc.TryGetValue("CreatedAtUtc", out var c) && c.IsValidDateTime ? c.ToUniversalTime() : DateTime.UtcNow,
            ClosedAtUtc = doc.TryGetValue("ClosedAtUtc", out var cl) && cl.IsValidDateTime ? cl.ToUniversalTime() : null,
            DrawnAtUtc = doc.TryGetValue("DrawnAtUtc", out var dr) && dr.IsValidDateTime ? dr.ToUniversalTime() : null,
            Winner = winner
        };
    }

    private static LiveQuizEntry MapEntry(BsonDocument doc) => new()
    {
        Id = Str(doc, "_id") ?? string.Empty,
        SessionId = Str(doc, "SessionId") ?? string.Empty,
        ParticipantKey = Str(doc, "ParticipantKey") ?? string.Empty,
        Source = Str(doc, "Source") ?? LiveQuizSources.PratiyogitaWeb,
        YouTubeChannelId = Str(doc, "YouTubeChannelId") ?? string.Empty,
        ChannelTitle = Str(doc, "ChannelTitle") ?? "Viewer",
        ChannelHandle = Str(doc, "ChannelHandle"),
        ThumbnailUrl = Str(doc, "ThumbnailUrl"),
        AnswerOption = Str(doc, "AnswerOption") ?? "A",
        RawMessage = Str(doc, "RawMessage"),
        IsCorrect = doc.TryGetValue("IsCorrect", out var ic) && ic.IsBoolean && ic.AsBoolean,
        SubmittedAtUtc = doc.TryGetValue("SubmittedAtUtc", out var sa) && sa.IsValidDateTime ? sa.ToUniversalTime() : DateTime.UtcNow
    };

    private static string? Str(BsonDocument doc, string name) =>
        doc.TryGetValue(name, out var v) && v.IsString && !string.IsNullOrWhiteSpace(v.AsString) ? v.AsString : null;

    private static string? NormalizeHandle(string? handle)
    {
        var h = handle?.Trim();
        if (string.IsNullOrWhiteSpace(h)) return null;
        return h.StartsWith('@') ? h : "@" + h;
    }

    private static string? FirstNonEmpty(params string?[] candidates) =>
        candidates.FirstOrDefault(s => !string.IsNullOrWhiteSpace(s))?.Trim();
}

public sealed record CreateLiveQuizSessionInput(
    string Question,
    string? QuestionHi,
    IReadOnlyList<LiveQuizOption> Options,
    string CorrectOptionKey,
    string? PrizeTitle = null,
    string? StreamTitle = null,
    string? StreamChannelHandle = null,
    string? BroadcastId = null,
    string? YouTubeConnectionChannelId = null,
    string Language = "hi",
    bool ClosePreviousOpen = true);

public sealed record AddQuizEntrantInput(
    string ChannelTitle,
    string? ChannelHandle,
    string? YouTubeChannelId,
    string AnswerOption,
    string? Source = null,
    string? ThumbnailUrl = null,
    string? RawMessage = null);
