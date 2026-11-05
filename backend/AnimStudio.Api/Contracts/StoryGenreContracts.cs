using System.ComponentModel.DataAnnotations;
using AnimStudio.Application.StoryAgent;
using AnimStudio.Domain.Stories;

namespace AnimStudio.Api.Contracts;

// ------------------------------------------------------------------------------------------------ requests

/// <summary>A genre as the admin console sends it. <see cref="StoryGenreRules"/> cleans and checks every field.</summary>
public sealed record StoryGenreRequest
{
    [Required, StringLength(40)] public string Id { get; init; } = string.Empty;
    [Required, StringLength(StoryGenreRules.MaxNameChars)] public string Name { get; init; } = string.Empty;
    [StringLength(StoryGenreRules.MaxNameChars)] public string? NameHindi { get; init; }
    [StringLength(StoryGenreRules.MaxDescriptionChars)] public string? Description { get; init; }
    [StringLength(16)] public string? Icon { get; init; }
    public int Order { get; init; }
    public bool Enabled { get; init; } = true;
    public StoryGenreMode Mode { get; init; } = StoryGenreMode.Creative;
    [StringLength(StoryGenreRules.MaxStyleGuideChars)] public string? StyleGuide { get; init; }
    [MaxLength(StoryGenreRules.MaxMoods)] public List<string>? Moods { get; init; }
    [StringLength(8)] public string? DefaultLanguage { get; init; }
    public int DefaultTargetSeconds { get; init; } = 150;
    public StoryFormat DefaultFormat { get; init; } = StoryFormat.Wide;
    public StoryLookStyle LookStyle { get; init; } = StoryLookStyle.Auto;
    [StringLength(300)] public string? ImageStyle { get; init; }
    [StringLength(80)] public string? MusicQuery { get; init; }
    [StringLength(300)] public string? SpeechStyle { get; init; }
    [MaxLength(StoryGenreRules.MaxTags)] public List<string>? Tags { get; init; }
    [MaxLength(StoryGenreRules.MaxHashtags)] public List<string>? Hashtags { get; init; }
    [MaxLength(StoryGenreRules.MaxLinks)] public List<StoryGenreLinkDto>? Links { get; init; }
    [StringLength(60)] public string? TitleSuffix { get; init; }
    [StringLength(200)] public string? PinnedLine { get; init; }
    [StringLength(40)] public string? Category { get; init; }
    public bool MadeForKids { get; init; }
    [MaxLength(StoryGenreRules.MaxTopics)] public List<StoryGenreTopicDto>? Topics { get; init; }

    public StoryGenre ToGenre() => new()
    {
        Id = Id,
        Name = Name,
        NameHindi = NameHindi,
        Description = Description ?? string.Empty,
        Icon = Icon ?? string.Empty,
        Order = Order,
        Enabled = Enabled,
        Mode = Mode,
        StyleGuide = StyleGuide ?? string.Empty,
        Moods = Moods ?? [],
        DefaultLanguage = DefaultLanguage ?? "hi",
        DefaultTargetSeconds = DefaultTargetSeconds,
        DefaultFormat = DefaultFormat,
        LookStyle = LookStyle,
        ImageStyle = ImageStyle,
        MusicQuery = MusicQuery,
        SpeechStyle = SpeechStyle,
        Tags = Tags ?? [],
        Hashtags = Hashtags ?? [],
        Links = [.. (Links ?? []).Select(l => new StoryGenreLink { Label = l.Label, Url = l.Url })],
        TitleSuffix = TitleSuffix,
        PinnedLine = PinnedLine,
        Category = Category ?? string.Empty,
        MadeForKids = MadeForKids,
        Topics = [.. (Topics ?? []).Select(t => new StoryGenreTopic
        {
            Id = t.Id,
            Name = t.Name,
            Hindi = t.Hindi,
            Keywords = t.Keywords ?? [],
            Summary = t.Summary ?? string.Empty,
            MusicQuery = t.MusicQuery,
            Sources = [.. (t.Sources ?? []).Select(s => new StoryGenreSource { TextId = s.TextId, Ref = s.Ref, Note = s.Note, Confidence = s.Confidence })]
        })]
    };
}

public sealed record StoryGenreLinkDto(
    [property: StringLength(60)] string Label,
    [property: StringLength(300)] string Url);

public sealed record StoryGenreTopicDto
{
    [StringLength(40)] public string Id { get; init; } = string.Empty;
    [StringLength(120)] public string Name { get; init; } = string.Empty;
    [StringLength(120)] public string? Hindi { get; init; }
    [MaxLength(StoryGenreRules.MaxKeywords)] public List<string>? Keywords { get; init; }
    [StringLength(600)] public string? Summary { get; init; }
    [StringLength(80)] public string? MusicQuery { get; init; }
    [MaxLength(StoryGenreRules.MaxSourcesPerTopic)] public List<StoryGenreSourceDto>? Sources { get; init; }
}

public sealed record StoryGenreSourceDto(
    [property: StringLength(64)] string TextId,
    [property: StringLength(80)] string Ref,
    [property: StringLength(200)] string? Note,
    StorySourceConfidence Confidence);

// ------------------------------------------------------------------------------------------------ responses

/// <summary>A text a scripture topic may point at, so the console can offer them in a list.</summary>
public sealed record GranthTextResponse(string Id, string English, string Hindi, string Kind, string DivisionLabel, string UnitLabel);

/// <summary>Everything the genre page needs: the genres, and the lists its fields choose from.</summary>
public sealed record StoryGenresPageResponse(
    IReadOnlyList<StoryGenre> Genres,
    IReadOnlyList<GranthTextResponse> Texts,
    IReadOnlyList<string> Categories,
    string ScriptureSource);
