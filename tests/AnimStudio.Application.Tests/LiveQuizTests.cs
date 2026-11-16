using System.Reflection;
using System.Text.Json;
using AnimStudio.Api.Controllers;
using AnimStudio.Application.LiveStreams;
using AnimStudio.Infrastructure.LiveStreams;
using AnimStudio.Infrastructure.Publishing;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace AnimStudio.Application.Tests;

public sealed class LiveQuizTests
{
    private static readonly List<LiveQuizOption> SampleOptions =
    [
        new("A", "Om Namah Shivaya", "ॐ नमः शिवाय"),
        new("B", "Om Namo Bhagavate Vasudevaya", "ॐ नमो भगवते वासुदेवाय"),
        new("C", "Gayatri Mantra", "गायत्री मंत्र"),
        new("D", "Om Namo Narayanaya", "ॐ नमो नारायणाय")
    ];

    [Theory]
    [InlineData("!ans B", "B")]
    [InlineData("ans: c", "C")]
    [InlineData("विकल्प D", "D")]
    [InlineData("a)", "A")]
    [InlineData("2", "B")]
    [InlineData("Om Namo Bhagavate Vasudevaya", "B")]
    [InlineData("ॐ नमः शिवाय", "A")]
    [InlineData("A B C D", null)]
    [InlineData("maybe A or B", null)]
    [InlineData("hello stream!", null)]
    public void ParseAnswerOption_ExtractsSingleUnambiguousChoice(string message, string? expected)
    {
        var parsed = LiveQuizEngine.ParseAnswerOption(message, SampleOptions);
        Assert.Equal(expected, parsed);
    }

    [Fact]
    public void SelectCryptographicWinner_DeduplicatesEarliestAttemptAndPicksCorrectEntrant()
    {
        var t0 = new DateTime(2026, 11, 15, 18, 0, 0, DateTimeKind.Utc);
        var entries = new List<LiveQuizEntry>
        {
            // User 1 tried wrong first, then tried sneaking a correct answer later -> earliest attempt (wrong) stands!
            new() { Id = "1", SessionId = "s1", ParticipantKey = "yt:UC1", YouTubeChannelId = "UC1", ChannelTitle = "cheater", AnswerOption = "A", IsCorrect = false, SubmittedAtUtc = t0 },
            new() { Id = "2", SessionId = "s1", ParticipantKey = "yt:UC1", YouTubeChannelId = "UC1", ChannelTitle = "cheater", AnswerOption = "B", IsCorrect = true, SubmittedAtUtc = t0.AddSeconds(10) },
            // Eligible users 2 & 3
            new() { Id = "3", SessionId = "s1", ParticipantKey = "yt:UC2", YouTubeChannelId = "UC2", ChannelTitle = "Aarav", AnswerOption = "B", IsCorrect = true, SubmittedAtUtc = t0.AddSeconds(5) },
            new() { Id = "4", SessionId = "s1", ParticipantKey = "yt:UC3", YouTubeChannelId = "UC3", ChannelTitle = "Diya", AnswerOption = "B", IsCorrect = true, SubmittedAtUtc = t0.AddSeconds(15) },
        };

        var (winner, eligibleCount, totalUnique) = LiveQuizEngine.SelectCryptographicWinner(entries, count => count - 1);

        Assert.Equal(3, totalUnique);
        Assert.Equal(2, eligibleCount);
        Assert.NotNull(winner);
        Assert.Equal("UC3", winner!.YouTubeChannelId);
    }

    [Fact]
    public void ParseLiveChatPage_ExtractsChannelDetailsAndMessage()
    {
        const string json = """
        {
          "nextPageToken": "PAGE_2",
          "pollingIntervalMillis": 4500,
          "items": [
            {
              "id": "msg_1",
              "snippet": {
                "displayMessage": "!ans B",
                "publishedAt": "2026-11-15T18:10:00Z"
              },
              "authorDetails": {
                "channelId": "UC_VIEWER_99",
                "displayName": "Keshav Fan",
                "profileImageUrl": "https://yt3.ggpht.com/avatar.jpg",
                "isChatSponsor": true,
                "isChatModerator": false,
                "isChatOwner": false
              }
            }
          ]
        }
        """;

        using var doc = JsonDocument.Parse(json);
        var page = YouTubeLiveClient.ParseLiveChatPage("chat_123", doc.RootElement);

        Assert.Equal("PAGE_2", page.NextPageToken);
        Assert.Equal(4500, page.PollingIntervalMillis);
        var msg = Assert.Single(page.Messages);
        Assert.Equal("UC_VIEWER_99", msg.AuthorChannelId);
        Assert.Equal("Keshav Fan", msg.AuthorDisplayName);
        Assert.Equal("!ans B", msg.MessageText);
        Assert.True(msg.IsChatSponsor);
    }

    [Fact]
    public async Task LiveQuizService_CreateMasksCorrectAnswerAndDrawsCryptographicWinner()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["CentralMongo:Enabled"] = "false" })
            .Build();
        var service = new LiveQuizService(config, TimeProvider.System, NullLogger<LiveQuizService>.Instance);

        var session = await service.CreateSessionAsync("owner-1", new CreateLiveQuizSessionInput(
            Question: "Which channel hosts 3D comedy?",
            QuestionHi: "3D कॉमेडी किस चैनल पर है?",
            Options:
            [
                new("A", "@OmkarShivBhakti"),
                new("B", "@KESHAV-ANIM-FF"),
            ],
            CorrectOptionKey: "B",
            PrizeTitle: "Verified Fan Crown",
            StreamChannelHandle: "@keshavsinghworld"));

        Assert.Null(session.RevealedCorrectOptionKey);
        Assert.Equal(LiveQuizStatuses.Open, session.Status);

        await service.AddEntrantAsync(session.Id, "owner-1", new AddQuizEntrantInput(
            ChannelTitle: "Wrong Viewer",
            ChannelHandle: "@wrong",
            YouTubeChannelId: "UC_W",
            AnswerOption: "A",
            Source: LiveQuizSources.YouTubeChat));

        await service.AddEntrantAsync(session.Id, "owner-1", new AddQuizEntrantInput(
            ChannelTitle: "Winner Viewer",
            ChannelHandle: "@winner",
            YouTubeChannelId: "UC_WIN",
            AnswerOption: "B",
            Source: LiveQuizSources.PratiyogitaWeb));

        var drawn = await service.DrawWinnerAsync(session.Id, "owner-1");

        Assert.Equal(LiveQuizStatuses.Drawn, drawn.Status);
        Assert.Equal("B", drawn.RevealedCorrectOptionKey);
        Assert.NotNull(drawn.Winner);
        Assert.Equal("UC_WIN", drawn.Winner!.WinnerChannelId);
        Assert.Equal(2, drawn.Winner.TotalEntrants);
        Assert.Equal(1, drawn.Winner.EligibleEntrants);

        var winnersArchive = await service.ListWinnersRawAsync(10);
        Assert.Single(winnersArchive);
        Assert.Equal("UC_WIN", winnersArchive[0]["WinnerChannelId"].AsString);
    }

    [Fact]
    public void LiveQuizEngine_PlaybookContains35MinScheduleAndStarterQuestions()
    {
        var pb = LiveQuizEngine.BuildFirstLivePlaybook();
        Assert.Equal(35, pb.TotalMinutes);
        Assert.Equal(6, pb.Segments.Count);
        Assert.Equal(4, pb.StarterQuestions.Count);
        Assert.Equal(35, pb.Segments.Sum(s => s.DurationMinutes));
    }

    [Fact]
    public void LiveQuizController_PublicReadEndpointsAllowAnonymous()
    {
        var publicMethods = new[]
        {
            nameof(LiveQuizController.Playbook),
            nameof(LiveQuizController.Active),
            nameof(LiveQuizController.Winners),
        };
        foreach (var name in publicMethods)
        {
            var m = typeof(LiveQuizController).GetMethod(name);
            Assert.NotNull(m);
            Assert.NotNull(m!.GetCustomAttribute<AllowAnonymousAttribute>());
        }
    }
}
