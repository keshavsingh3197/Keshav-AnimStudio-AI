using System.Reflection;
using System.Text;
using AnimStudio.Domain.Stories;

namespace AnimStudio.Application.StoryAgent;

/// <summary>A script that ships with the app: a major festival or story, written and checked by hand.</summary>
/// <param name="Id">What <see cref="StoryBrief.PackId"/> carries.</param>
/// <param name="Title">The title the run starts with, in the pack's language.</param>
/// <param name="TitleEnglish">The same, in English, for the picker.</param>
/// <param name="Description">One or two sentences for the picker.</param>
/// <param name="TargetSeconds">About how long the video runs, so the picker can say.</param>
/// <param name="GenreId">The <see cref="StoryGenre"/> the pack is written for; it is only offered there.</param>
public sealed record StoryPack(
    string Id,
    string Title,
    string TitleEnglish,
    string Description,
    string Language,
    int TargetSeconds,
    string GenreId = StoryGenres.DefaultId);

/// <summary>
/// The built-in scripts. They are why the Story Agent works the very first time, with no text model and no key:
/// the script is already there, and it goes through the same checks as one a model wrote.
/// </summary>
/// <remarks>
/// A pack is one JSON file in <c>StoryAgent/Packs</c>, in the shape the script parser reads, embedded in the
/// assembly. To add one, add the file and a line to <see cref="All"/>; a test reads every pack through the parser.
/// </remarks>
public static class StoryPacks
{
    public static readonly IReadOnlyList<StoryPack> All =
    [
        new("diwali", "दीपावली: क्यों मनाते हैं, और कैसे शुरू हुई?", "Diwali: why we celebrate it and how it began",
            "Dhanvantari and Lakshmi from the churning of the ocean, Narakasura, Sri Rama's return to Ayodhya, Govardhan Puja and Bhai Dooj, with the sources named.",
            "hi", 200)
    ];

    public static StoryPack? Find(string? id) =>
        All.FirstOrDefault(p => string.Equals(p.Id, id?.Trim(), StringComparison.OrdinalIgnoreCase));

    /// <summary>The pack's JSON, as written. Throws if the file is missing from the assembly, which a test guards against.</summary>
    public static string Json(StoryPack pack)
    {
        using var stream = typeof(StoryPacks).Assembly.GetManifestResourceStream($"StoryPacks/{pack.Id}.json")
            ?? throw new InvalidOperationException($"The pack '{pack.Id}' is not embedded in the assembly.");
        using var reader = new StreamReader(stream, Encoding.UTF8);
        return reader.ReadToEnd();
    }

    /// <summary>The pack as a checked script for this run's research: citations verified, scenes numbered, warnings listed.</summary>
    public static StoryScriptResult Read(StoryPack pack, StoryBrief brief, StoryResearch? research, DateTime nowUtc) =>
        StoryScriptParser.Parse(Json(pack), brief, research, $"built-in pack: {pack.Id}", nowUtc, tolerant: false);
}
