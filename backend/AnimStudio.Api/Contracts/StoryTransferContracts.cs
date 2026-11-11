using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using AnimStudio.Domain.Stories;

namespace AnimStudio.Api.Contracts;

// A story as a file: what was asked for, how it is made, and its script - to keep, move to another account or server, or
// start again from. The script is in the shape a chat's reply has, so importing it goes through the parser and the
// citation checks a pasted reply does; nothing in the file is trusted because this app wrote it.

/// <summary>An exported story file. <see cref="Kind"/> and <see cref="Version"/> say what it is when it comes back.</summary>
public sealed record StoryExportFile(
    string Kind,
    int Version,
    DateTime ExportedAtUtc,
    CreateStoryRunRequest Story,
    StoryExportScript? Script);

public sealed record StoryExportScript(
    string Title,
    string? TitleEnglish,
    string? Summary,
    string? MusicQuery,
    IReadOnlyList<string> ReviewNotes,
    IReadOnlyList<StoryExportCastMember> Cast,
    IReadOnlyList<StoryExportScene> Scenes,
    string? ThumbnailPrompt = null);

public sealed record StoryExportCastMember(string Name, string? Gender, string? Age, string? Look = null);

public sealed record StoryExportScene(
    int Number,
    string Headline,
    string Narration,
    IReadOnlyList<StoryExportLine> Lines,
    string? English,
    string Basis,
    IReadOnlyList<StoryExportSource> Sources,
    string? ImagePrompt,
    string? VideoPrompt,
    IReadOnlyList<string> ImageKeywords,
    string? Mood,
    IReadOnlyList<string>? MoreImagePrompts = null,
    string? Background = null,
    IReadOnlyList<string>? Characters = null,
    string? Action = null,
    string? Camera = null,
    string? CameraSpeed = null,
    string? Transition = null,
    StoryExportMeme? FunnyEnding = null);

/// <summary>A scene's funny ending, under the names a story template uses, so an export imports the same way.</summary>
public sealed record StoryExportMeme(string Meme, string? MemeId, string? Caption, double? Seconds);

public sealed record StoryExportLine(string Speaker, string Text, string? Emotion = null);

/// <param name="Text">The catalogue id when the text is one the catalogue knows, its name otherwise - as a writer cites it.</param>
public sealed record StoryExportSource(string Text, string Ref, string? Note);

/// <summary>An exported story file, sent back to start a new story from.</summary>
public sealed record ImportStoryRunRequest
{
    [Required, StringLength(40)]
    public string Kind { get; init; } = string.Empty;

    public int Version { get; init; }

    [Required]
    public CreateStoryRunRequest? Story { get; init; }

    /// <summary>Read by the script parser, so it is kept as the JSON it came as.</summary>
    public JsonElement? Script { get; init; }
}

public static class StoryTransfer
{
    public const string Kind = "animstudio-story";
    public const int Version = 1;

    public static StoryExportFile Export(StoryRun run, DateTime now) => new(
        Kind,
        Version,
        now,
        new CreateStoryRunRequest
        {
            Title = run.Brief.Title,
            Notes = run.Brief.Notes,
            Language = run.Brief.Language,
            TargetSeconds = run.Brief.TargetSeconds,
            Format = run.Brief.Format,
            Writer = run.Brief.Writer,
            Voicing = run.Brief.Voicing,
            PackId = run.Brief.PackId,
            GenreId = run.Brief.GenreId,
            TextEngine = run.Brief.TextEngine,
            Options = StoryBuildOptionsRequest.From(run.Options)
        },
        run.Script is null ? null : Export(run.Script));

    private static StoryExportScript Export(StoryScript script) => new(
        script.Title,
        script.TitleEnglish,
        script.Summary,
        script.MusicQuery,
        script.ReviewNotes,
        [.. script.Cast.Select(c => new StoryExportCastMember(c.Name, c.Gender, c.Age, c.Look))],
        [.. script.Scenes.Select(s => new StoryExportScene(
            s.Number,
            s.Headline,
            s.Narration,
            [.. s.Lines.Select(l => new StoryExportLine(l.Speaker, l.Text, l.Emotion))],
            s.English,
            s.Basis.ToString().ToLowerInvariant(),
            [.. s.Sources.Select(r => new StoryExportSource(r.TextId.Length > 0 ? r.TextId : r.TextName, r.Ref, r.Note))],
            s.ImagePrompt,
            s.VideoPrompt,
            s.ImageKeywords,
            s.Mood,
            [.. s.Shots.Select(shot => shot.ImagePrompt).OfType<string>()],
            s.Background,
            s.OnScreen,
            s.Action,
            // Only a look the person or the template chose travels; an automatic one is chosen again on the next build.
            s.LookPinned ? Camera(s.Effect) : null,
            s.LookPinned ? Speed(s.EffectIntensity) : null,
            s.LookPinned && s.Transition is { Length: > 0 } t ? char.ToLowerInvariant(t[0]) + t[1..] : null,
            s.Meme is { } m ? new StoryExportMeme(m.Name, m.EffectId, m.Caption, m.Seconds) : null))],
        script.ThumbnailPrompt);

    private static string? Camera(string? effect) => effect switch
    {
        null or "" => null,
        "None" => "static",
        _ => char.ToLowerInvariant(effect[0]) + effect[1..]
    };

    private static string? Speed(double? intensity) => intensity switch
    {
        null => null,
        <= 0.08 => "slow",
        >= 0.18 => "fast",
        _ => "normal"
    };
}
