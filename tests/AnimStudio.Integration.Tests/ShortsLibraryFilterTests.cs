using System.ComponentModel.DataAnnotations;
using AnimStudio.Api.Controllers;
using AnimStudio.Domain.Jobs;
using AnimStudio.Domain.Planning;
using AnimStudio.Domain.Publishing;

namespace AnimStudio.Integration.Tests;

public sealed class ShortsLibraryFilterTests
{
    private static readonly IReadOnlyDictionary<string, ContentTopic> Topics =
        new Dictionary<string, ContentTopic> { ["topic"] = new() { Id = "topic", Name = "Nature" } };

    private static readonly IReadOnlyDictionary<string, string> Names =
        new Dictionary<string, string> { ["project"] = "Mountain journey" };

    [Theory]
    [InlineData("short", "portrait")]
    [InlineData("video", "landscape")]
    [InlineData("square", "square")]
    [InlineData("unknown", "missing", "invalid")]
    public void FormatMatchesAcrossTheLibrary(string format, params string[] expected)
    {
        var copies = Copies();
        var jobs = Jobs();

        var matching = ShortsLibraryController.Filter(copies, new LibraryQuery { Format = format }, Topics, jobs, Names);

        Assert.Equal(expected, matching.Select(h => h.Id));
    }

    [Fact]
    public void FormatIsAppliedBeforePaging()
    {
        var copies = Copies();
        var matching = ShortsLibraryController.Filter(copies, new LibraryQuery { Format = "video", PageSize = 1 }, Topics, Jobs(), Names);

        Assert.Equal("landscape", Assert.Single(matching.Take(1)).Id);
    }

    [Fact]
    public void FormatCombinesWithStatusAndTopic()
    {
        var copies = Copies();
        copies[1].UsedAt = DateTime.UtcNow;
        copies[1].TopicId = "topic";

        var query = new LibraryQuery { Format = "video", View = "used", TopicId = "topic" };
        Assert.Equal("landscape", Assert.Single(ShortsLibraryController.Filter(copies, query, Topics, Jobs(), Names)).Id);
        Assert.Empty(ShortsLibraryController.Filter(copies, query with { View = "unused" }, Topics, Jobs(), Names));
        Assert.Empty(ShortsLibraryController.Filter(copies, query with { TopicId = "none" }, Topics, Jobs(), Names));
    }

    [Fact]
    public void SearchIncludesProjectNamesAndStillRespectsArchive()
    {
        var copies = Copies();
        copies[0].Archived = true;

        var query = new LibraryQuery { Search = " JOURNEY ", Format = "short" };
        Assert.Empty(ShortsLibraryController.Filter(copies, query, Topics, Jobs(), Names));
        Assert.Equal("portrait", Assert.Single(ShortsLibraryController.Filter(copies, query with { View = "archived" }, Topics, Jobs(), Names)).Id);
    }

    [Fact]
    public void AllFormatsPreservesUnknownAndSquareItems()
    {
        Assert.Equal(5, ShortsLibraryController.Filter(Copies(), new LibraryQuery(), Topics, Jobs(), Names).Count());
    }

    [Theory]
    [InlineData("short", true)]
    [InlineData("video", true)]
    [InlineData("square", true)]
    [InlineData("unknown", true)]
    [InlineData("all", false)]
    [InlineData("invalid", false)]
    public void FormatQueryIsValidated(string format, bool valid)
    {
        var query = new LibraryQuery { Format = format };
        Assert.Equal(valid, Validator.TryValidateObject(query, new ValidationContext(query), [], true));
    }

    private static List<PhoneHandoff> Copies() =>
        new[] { "portrait", "landscape", "square", "missing", "invalid" }
            .Select(id => new PhoneHandoff { Id = id, JobId = id, ProjectId = "project", Title = "Export" }).ToList();

    private static IReadOnlyDictionary<string, RenderJob> Jobs() =>
        new Dictionary<string, RenderJob>
        {
            ["portrait"] = new() { Width = 1080, Height = 1920 },
            ["landscape"] = new() { Width = 1920, Height = 1080 },
            ["square"] = new() { Width = 1080, Height = 1080 },
            ["invalid"] = new() { Width = 0, Height = 1080 },
        };
}
