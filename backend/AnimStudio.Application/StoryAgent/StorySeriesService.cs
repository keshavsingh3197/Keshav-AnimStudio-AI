using System.Globalization;
using System.Text;
using System.Text.Json;
using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Ai;
using AnimStudio.Domain.Stories;
using Microsoft.Extensions.Logging;

namespace AnimStudio.Application.StoryAgent;

/// <summary>One series: its parts in order. Built from the person's runs; a series is not stored on its own.</summary>
public sealed record StorySeries(string Id, string Name, IReadOnlyList<StoryRun> Parts)
{
    public StoryRun Latest => Parts[^1];
}

/// <summary>What the person chose for the next part. Anything left out comes from the part it continues.</summary>
/// <param name="IdeaIndex">One of the suggested ideas to make, by its place in the list.</param>
/// <param name="AutoContinueTo">Keep making parts by themselves until this one; null keeps what the series had.</param>
/// <param name="Again">Continue a part that was already continued, as a second take on what comes next.</param>
public sealed record StoryContinuation(
    string? Title = null,
    string? Notes = null,
    int? IdeaIndex = null,
    int? AutoContinueTo = null,
    bool Again = false,
    StoryBuildOptions? Options = null);

/// <summary>
/// Stories told over several videos: Part 1, then Part 2 carrying on from where it stopped, and on. A new part is an
/// ordinary run whose writer is also given the story so far, the way the last part ended and the characters' names - all
/// taken from the earlier part's script when the part is started, so no model is asked to summarise anything.
/// </summary>
/// <remarks>
/// Ideas for the next part are the one model call here. They are kept on the part they follow, so reopening it costs
/// nothing; new ones are asked for only when the person wants them. With no text model they are worked out from the
/// script, so the series still goes on.
/// </remarks>
public sealed class StorySeriesService(
    IStoryRunRepository runs,
    StoryRunService stories,
    IAiExecutor ai,
    IPromptLibrary prompts,
    TimeProvider clock,
    ILogger<StorySeriesService> logger)
{
    /// <summary>The most parts a series can be told to make by itself past the one it is on.</summary>
    public const int MaxAutoParts = 10;

    public const int MaxParts = 200;
    public const int IdeaCount = 4;

    /// <summary>The story so far is kept to this length; the oldest parts are shortened first.</summary>
    public const int MaxStorySoFarChars = 3_000;

    private const int MaxListed = 500;

    // ------------------------------------------------------------------------------------------------ reading

    /// <summary>Every series the person has, the one touched most recently first.</summary>
    public async Task<IReadOnlyList<StorySeries>> ListAsync(string userId, CancellationToken ct)
    {
        var mine = await runs.ListByUserAsync(userId, MaxListed, ct).ConfigureAwait(false);
        return [.. mine.Where(r => r.Series is { Id.Length: > 0 })
            .GroupBy(r => r.Series!.Id, StringComparer.Ordinal)
            .Select(g =>
            {
                var parts = g.OrderBy(r => r.Series!.Part).ThenBy(r => r.CreatedAtUtc).ToList();
                return new StorySeries(g.Key, parts[0].Series!.Name, parts);
            })
            .OrderByDescending(s => s.Parts.Max(p => p.UpdatedAtUtc))];
    }

    /// <summary>One series, by the id its parts share. Someone else's answers as one that does not exist.</summary>
    public async Task<StorySeries> GetAsync(string userId, string seriesId, CancellationToken ct) =>
        (await ListAsync(userId, ct).ConfigureAwait(false)).FirstOrDefault(s => string.Equals(s.Id, seriesId, StringComparison.Ordinal))
        ?? throw new StoryRunException(StoryRunErrorKind.NotFound, "series-not-found", "That series was not found.");

    // ------------------------------------------------------------------------------------------------ ideas

    /// <summary>
    /// Ideas for the part after <paramref name="runId"/>: the ones already kept, unless there are none or
    /// <paramref name="fresh"/> asks for new ones.
    /// </summary>
    public async Task<StoryRun> SuggestAsync(string userId, string runId, bool fresh, CancellationToken ct)
    {
        var run = await stories.GetAsync(userId, runId, ct).ConfigureAwait(false);
        var script = RequireContinuable(run);
        if (!fresh && run.NextParts.Count > 0) return run;

        var (ideas, by) = await AskAsync(run, script, fresh, ct).ConfigureAwait(false) ?? (Fallback(run, script), "built-in");
        run.NextParts = ideas;
        run.NextPartsBy = by;
        await SaveAsync(run, ct).ConfigureAwait(false);
        return run;
    }

    private async Task<(List<StoryNextPartIdea>, string)?> AskAsync(StoryRun run, StoryScript script, bool fresh, CancellationToken ct)
    {
        RenderedPrompt rendered;
        try
        {
            rendered = await prompts.RenderAsync(BuiltInPrompts.StoryNextParts, new Dictionary<string, string?>(StringComparer.Ordinal)
            {
                ["story"] = StoryBlock(run, script),
                ["genre"] = StoryScriptPrompt.GenreBlock(StoryGenres.Of(run)),
                ["count"] = IdeaCount.ToString(CultureInfo.InvariantCulture),
                ["language"] = StoryScriptPrompt.LanguageName(run.Brief.Language)
            }, ct).ConfigureAwait(false);
        }
        catch (PromptTemplateException ex)
        {
            logger.LogError("The {Template} prompt could not be rendered: {Code}", BuiltInPrompts.StoryNextParts, ex.Code);
            return null;
        }

        var outcome = await ai.TextAsync(new AiTextRequest
        {
            SystemPrompt = rendered.SystemPrompt,
            Prompt = rendered.Body,
            JsonSchema = rendered.OutputJsonSchema,
            PromptTemplateKey = rendered.TemplateKey,
            PromptTemplateVersion = rendered.Version,
            MaxOutputTokens = 2_500,
            Temperature = 0.8,
            BypassCache = fresh,
            ProviderId = stories.UsableTextEngine(run.Brief.TextEngine)
        }, new AiCallContext(null, run.UserId), ct).ConfigureAwait(false);

        if (!outcome.IsSuccess)
        {
            logger.LogInformation("No ideas for the next part of story run {RunId} from a text model ({Kind}).", run.Id, outcome.Kind);
            return null;
        }

        var ideas = ParseIdeas(outcome.Value!.Text);
        return ideas.Count == 0 ? null : (ideas, outcome.Value.Provenance.ProviderId);
    }

    /// <summary>The model's ideas, each cleaned like any other model output before it is stored or shown.</summary>
    public static List<StoryNextPartIdea> ParseIdeas(string? json)
    {
        var ideas = new List<StoryNextPartIdea>();
        try
        {
            using var doc = JsonDocument.Parse(AiJsonResponse.Unwrap(json));
            if (!doc.RootElement.TryGetProperty("ideas", out var list) || list.ValueKind != JsonValueKind.Array) return ideas;

            foreach (var item in list.EnumerateArray())
            {
                if (item.ValueKind != JsonValueKind.Object) continue;
                var title = AiOutputSanitizer.ToSafeLine(Text(item, "title"), StoryRunService.MaxTitleChars);
                var notes = AiOutputSanitizer.ToSafeText(Text(item, "notes"), 1_500);
                if (title is null || title.Length < StoryRunService.MinTitleChars || notes is null) continue;

                ideas.Add(new StoryNextPartIdea { Title = title, Notes = notes, Hook = AiOutputSanitizer.ToSafeLine(Text(item, "hook"), 400) });
                if (ideas.Count == 6) break;
            }
        }
        catch (JsonException)
        {
            // An answer that is not JSON gives no ideas; the caller falls back to the script's own.
        }
        return ideas;
    }

    private static string? Text(JsonElement item, string name) =>
        item.TryGetProperty(name, out var value) && value.ValueKind == JsonValueKind.String ? value.GetString() : null;

    /// <summary>Ideas worked out from the script alone, for when no text model is on: plain, but enough to go on.</summary>
    public static List<StoryNextPartIdea> Fallback(StoryRun run, StoryScript script)
    {
        var name = run.Series?.Name ?? run.Title;
        var next = (run.Series?.Part ?? 1) + 1;
        var ending = script.Scenes.LastOrDefault();
        var where = ending?.English ?? ending?.Headline ?? script.Summary ?? run.Title;
        var who = script.Cast.Count > 0 ? string.Join(", ", script.Cast.Take(3).Select(c => c.Name)) : null;

        return
        [
            new()
            {
                Title = PartTitle(name, next, run.Brief.Language),
                Notes = $"Pick up right where the last part ended: {where} Show what happens next{(who is null ? string.Empty : $" to {who}")}, and end on a new question.",
                Hook = "What happens after the last part's ending."
            },
            new()
            {
                Title = PartTitle(name, next, run.Brief.Language) + (run.Brief.Language == "en" ? ": The Challenge" : ": नई चुनौती"),
                Notes = $"A new problem tests the main character{(who is null ? string.Empty : $" ({who})")}. They try, fail once, and find a better way. Close with the lesson and a hint of what comes next.",
                Hook = "A harder test for a character the viewer already knows."
            }
        ];
    }

    // ------------------------------------------------------------------------------------------------ continuing

    /// <summary>Starts the next part of the story <paramref name="runId"/> told. It is an ordinary run, made like any other.</summary>
    public async Task<StoryRun> ContinueAsync(string userId, string runId, StoryContinuation request, CancellationToken ct)
    {
        var previous = await stories.GetAsync(userId, runId, ct).ConfigureAwait(false);
        var script = RequireContinuable(previous);

        if (!request.Again && previous.NextRunId is { Length: > 0 } nextId
            && await runs.GetAsync(nextId, ct).ConfigureAwait(false) is { } next && next.UserId == userId)
        {
            throw new StoryRunException(StoryRunErrorKind.Conflict, "already-continued",
                $"This story already has its next part, \"{next.Title}\". Open that one, or make another take of it.");
        }

        var series = previous.Series ?? new StorySeriesLink
        {
            Id = $"ss_{Guid.NewGuid():n}",
            Name = previous.Title,
            Part = 1
        };
        var part = series.Part + 1;
        if (part > MaxParts)
            throw new StoryRunException(StoryRunErrorKind.Limit, "series-too-long", $"A series can have up to {MaxParts} parts.");

        var idea = request.IdeaIndex is { } i && i >= 0 && i < previous.NextParts.Count ? previous.NextParts[i] : null;
        var title = Clean(request.Title) ?? idea?.Title ?? PartTitle(series.Name, part, previous.Brief.Language);
        var notes = Clean(request.Notes) ?? (idea is null ? null : string.IsNullOrWhiteSpace(idea.Hook) ? idea.Notes : $"{idea.Notes}\n{idea.Hook}");

        var autoTo = request.AutoContinueTo ?? series.AutoContinueTo;
        var link = new StorySeriesLink
        {
            Id = series.Id,
            Name = series.Name,
            Part = part,
            PreviousRunId = previous.Id,
            StorySoFar = StorySoFar(previous, script),
            LastScene = Ending(script),
            Cast = Cast(previous, script),
            AutoContinueTo = autoTo is { } to && to > part ? Math.Min(to, part + MaxAutoParts) : null
        };

        var brief = new StoryBrief
        {
            Title = title,
            Notes = notes is { Length: > StoryRunService.MaxNotesChars } ? notes[..StoryRunService.MaxNotesChars] : notes,
            Language = previous.Brief.Language,
            TargetSeconds = previous.Brief.TargetSeconds,
            Format = previous.Brief.Format,
            // A built-in pack is one story; what comes after it is written.
            Writer = previous.Brief.Writer == StoryWriterMode.BuiltIn ? StoryWriterMode.Auto : previous.Brief.Writer,
            Voicing = previous.Brief.Voicing,
            GenreId = previous.Brief.GenreId,
            // The engine the series was written with, while it is still on; the chain otherwise.
            TextEngine = stories.UsableTextEngine(previous.Brief.TextEngine),
            // Every part of a series goes out on the channel the first was made for.
            BrandChannelId = previous.Brief.BrandChannelId
        };

        var created = await stories.CreateAsync(userId, brief, request.Options ?? SameAs(previous.Options), ct, link).ConfigureAwait(false);

        previous.Series = series;
        previous.NextRunId = created.Id;
        await SaveAsync(previous, ct).ConfigureAwait(false);

        logger.LogInformation("Story run {RunId} started as part {Part} of series {SeriesId}.", created.Id, part, series.Id);
        return created;
    }

    /// <summary>
    /// Sets how far the series goes on by itself, on a part that is not being made (one being made is written only by the
    /// worker). Null stops it.
    /// </summary>
    public async Task<StoryRun> SetAutoContinueAsync(string userId, string runId, int? upTo, CancellationToken ct)
    {
        var run = await stories.GetAsync(userId, runId, ct).ConfigureAwait(false);
        if (run.IsWorking)
            throw new StoryRunException(StoryRunErrorKind.Conflict, "story-busy", "Wait for this part to finish being made, then change this.");

        run.Series ??= new StorySeriesLink { Id = $"ss_{Guid.NewGuid():n}", Name = run.Title, Part = 1 };
        run.Series.AutoContinueTo = upTo is { } to && to > run.Series.Part ? Math.Min(to, run.Series.Part + MaxAutoParts) : null;
        await SaveAsync(run, ct).ConfigureAwait(false);
        return run;
    }

    /// <summary>
    /// Called when a run stops working. If it finished and its series is set to go on by itself, starts the next part from
    /// the first idea. Anything that goes wrong is a warning on the finished part; the part itself is never undone.
    /// </summary>
    public async Task ContinueIfDueAsync(string runId, CancellationToken ct)
    {
        var run = await runs.GetAsync(runId, ct).ConfigureAwait(false);
        if (run is not { Status: StoryRunStatus.Completed, Series.AutoContinueTo: { } to } || to <= run.Series.Part
            || !string.IsNullOrEmpty(run.NextRunId) || run.Script is null)
            return;

        try
        {
            if (run.NextParts.Count == 0) run = await SuggestAsync(run.UserId, run.Id, fresh: false, ct).ConfigureAwait(false);
            await ContinueAsync(run.UserId, run.Id, new StoryContinuation(IdeaIndex: 0), ct).ConfigureAwait(false);
        }
        catch (StoryRunException ex)
        {
            logger.LogWarning("Story run {RunId}: the next part could not be started by itself: {Code}", runId, ex.Code);
            var fresh = await runs.GetAsync(runId, ct).ConfigureAwait(false);
            if (fresh is null || fresh.IsWorking) return;
            StoryRunWarnings.Add(fresh, $"The next part was not started by itself: {ex.Message}");
            await SaveAsync(fresh, ct).ConfigureAwait(false);
        }
    }

    // ------------------------------------------------------------------------------------------------ what the writer is given

    /// <summary>The earlier parts' story so far, with this part's added at the end and the oldest shortened to fit.</summary>
    public static string StorySoFar(StoryRun previous, StoryScript script)
    {
        var lines = (previous.Series?.StorySoFar ?? string.Empty)
            .Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .ToList();
        lines.Add(PartLine(previous, script));

        // The newest parts matter most to what happens next; the oldest are cut to a sentence, then dropped.
        while (lines.Sum(l => l.Length + 1) > MaxStorySoFarChars && lines.Count > 1)
        {
            var oldest = lines[0];
            var stop = oldest.IndexOf(". ", StringComparison.Ordinal);
            if (stop > 0 && stop + 1 < oldest.Length - 1) lines[0] = oldest[..(stop + 1)];
            else lines.RemoveAt(0);
        }

        var text = string.Join('\n', lines);
        return text.Length > MaxStorySoFarChars ? text[^MaxStorySoFarChars..] : text;
    }

    /// <summary>One part, in a line: its title, its one-sentence summary, and the headlines of what happened.</summary>
    private static string PartLine(StoryRun run, StoryScript script)
    {
        var builder = new StringBuilder();
        builder.Append("Part ").Append(run.Series?.Part ?? 1).Append(" - ").Append(script.TitleEnglish ?? script.Title).Append(": ");
        if (!string.IsNullOrWhiteSpace(script.Summary)) builder.Append(script.Summary.Trim()).Append(' ');

        var beats = script.Scenes.Select(s => s.Headline).Where(h => !string.IsNullOrWhiteSpace(h)).Take(12).ToList();
        if (beats.Count > 0) builder.Append("Scenes: ").Append(string.Join("; ", beats)).Append('.');
        return Flatten(builder.ToString(), 900);
    }

    /// <summary>The last two scenes as they were told (in English when the script has it), so the next part picks up there.</summary>
    public static string? Ending(StoryScript script)
    {
        var last = script.Scenes.TakeLast(2).Select(s => s.English ?? s.Narration).Where(t => !string.IsNullOrWhiteSpace(t)).ToList();
        return last.Count == 0 ? null : Flatten(string.Join(' ', last), 800);
    }

    /// <summary>Everyone who has spoken in the series so far, once each, by name.</summary>
    private static List<StoryCastMember> Cast(StoryRun previous, StoryScript script) =>
        [.. (previous.Series?.Cast ?? []).Concat(script.Cast)
            .Where(c => !string.IsNullOrWhiteSpace(c.Name))
            .GroupBy(c => c.Name.Trim(), StringComparer.OrdinalIgnoreCase)
            .Select(g => g.Last())
            .Select(c => new StoryCastMember { Name = c.Name.Trim(), Gender = c.Gender, Age = c.Age })
            .Take(20)];

    /// <summary>What the idea writer reads: the series, the story so far, and the part just made.</summary>
    private static string StoryBlock(StoryRun run, StoryScript script)
    {
        var builder = new StringBuilder();
        var part = run.Series?.Part ?? 1;
        builder.Append("Series: ").Append(run.Series?.Name ?? run.Title).Append('\n');
        builder.Append("The part just made: Part ").Append(part).Append(", \"").Append(run.Title).Append("\"\n");
        if (!string.IsNullOrWhiteSpace(run.Series?.StorySoFar)) builder.Append("\nBefore it:\n").Append(run.Series.StorySoFar).Append('\n');
        builder.Append("\nThis part:\n").Append(PartLine(run, script)).Append('\n');
        if (Ending(script) is { } ending) builder.Append("\nHow it ended: ").Append(ending).Append('\n');
        if (script.Cast.Count > 0) builder.Append("\nCharacters: ").Append(string.Join(", ", script.Cast.Select(c => c.Name))).Append('\n');
        return builder.ToString().TrimEnd();
    }

    // ------------------------------------------------------------------------------------------------ helpers

    public static string PartTitle(string name, int part, string? language)
    {
        var suffix = string.Equals(language, "en", StringComparison.OrdinalIgnoreCase) ? $" - Part {part}" : $" - भाग {part}";
        var room = StoryRunService.MaxTitleChars - suffix.Length;
        return (name.Length > room ? name[..room].TrimEnd() : name) + suffix;
    }

    /// <summary>A copy of the earlier part's choices: the same voice, music and look. A speed the app chose is measured afresh.</summary>
    private static StoryBuildOptions SameAs(StoryBuildOptions o)
    {
        var copy = JsonSerializer.Deserialize<StoryBuildOptions>(JsonSerializer.Serialize(o)) ?? new StoryBuildOptions();
        if (copy.AutoPace) copy.VideoSpeed = 1.0;
        return copy;
    }

    private static StoryScript RequireContinuable(StoryRun run)
    {
        if (run.IsWorking)
            throw new StoryRunException(StoryRunErrorKind.Conflict, "story-busy", "Wait for this part to finish being made, then try again.");
        if (run.Script is null)
            throw new StoryRunException(StoryRunErrorKind.Conflict, "no-script", "A story can be continued once its script is written.");
        return run.Script;
    }

    private static string? Clean(string? text) => string.IsNullOrWhiteSpace(text) ? null : text.Trim();

    private static string Flatten(string text, int max)
    {
        var flat = string.Join(' ', text.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries));
        return flat.Length > max ? flat[..max].TrimEnd() + "..." : flat;
    }

    private Task SaveAsync(StoryRun run, CancellationToken ct)
    {
        if (run.IsWorking)
            throw new StoryRunException(StoryRunErrorKind.Conflict, "story-busy", "Wait for this part to finish being made, then try again.");
        run.UpdatedAtUtc = clock.GetUtcNow().UtcDateTime;
        return runs.UpsertAsync(run, ct);
    }
}
