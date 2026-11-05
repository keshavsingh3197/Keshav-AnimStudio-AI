using AnimStudio.Application.Abstractions.StoryAgent;
using AnimStudio.Domain.Stories;
using Microsoft.Extensions.Logging;

namespace AnimStudio.Application.StoryAgent;

/// <summary>
/// The "search the Granths" step. From a title and a few notes it finds where the tradition tells
/// the story (the curated topics), reads those chapters from a real edition, and searches for any
/// Hindi or Sanskrit words the curated list does not cover. What comes back is the ground a script
/// is written on and later checked against.
/// </summary>
/// <remarks>
/// Research never fails a run. If the source is unreachable the pointers still stand and the
/// result says what was missing, so a person (or a model) can carry on knowingly.
/// </remarks>
public sealed class ScriptureResearcher(IScriptureSource source, TimeProvider clock, ILogger<ScriptureResearcher> logger)
{
    /// <summary>Chapters read in full per run; each one costs a polite pause at the source.</summary>
    public const int MaxChapters = 6;

    /// <summary>A pointer such as 10.24-25 names two chapters; none is followed past this many.</summary>
    public const int MaxChaptersPerPointer = 2;

    public const int MaxSearchQueries = 3;
    public const int MaxHitsPerQuery = 2;

    /// <summary>Chapters and search hits together; more would only crowd out the ones that matter.</summary>
    public const int MaxPassages = 8;

    private const int MinSearchWordLength = 4;

    /// <summary>Hindi words that say nothing about which story is meant.</summary>
    private static readonly HashSet<string> StopWords = new(StringComparer.Ordinal)
    {
        "कथा", "कहानी", "क्यों", "कैसे", "क्या", "मनाते", "मनाया", "मनाई", "मनाते", "जाता", "जाती", "वाली", "वाला",
        "बारे", "हमारे", "इसका", "उसका", "इसके", "उसके", "लिए", "साथ", "सभी", "सारी", "पूरी", "होती", "होता", "होते"
    };

    /// <param name="topics">The genre's curated topics; null for the catalogue that ships with the app.</param>
    public async Task<StoryResearch> ResearchAsync(
        StoryBrief brief, Func<string, Task>? report = null, CancellationToken ct = default, IReadOnlyList<GranthTopic>? topics = null)
    {
        var research = new StoryResearch { RetrievedAtUtc = clock.GetUtcNow().UtcDateTime };
        var text = $"{brief.Title} {brief.Notes}";

        foreach (var topic in GranthTopics.Match(text, topics ?? GranthTopics.All))
            research.Topics.Add(ToMatch(topic));

        if (research.Topics.Count == 0)
        {
            research.Warnings.Add(
                "No curated pointers matched this title, so the script has no chapters to start from and leans on the "
                + "writer's own knowledge. Citations are still checked for shape. Add the Hindi or Sanskrit name in the notes to search the texts.");
        }

        var chapters = PlanChapters(research.Topics);
        var failure = false;

        // Several pointers can lead to the same chapter; it is read once and every pointer to it is marked.
        var read = new Dictionary<(string TextId, int Division, int Unit), ScripturePassage?>();
        var directCount = 0;

        for (var i = 0; i < chapters.Count && directCount < MaxChapters && !failure; i++)
        {
            ct.ThrowIfCancellationRequested();
            var chapter = chapters[i];
            var key = (chapter.Source.TextId, chapter.Division, chapter.Unit);

            if (!read.TryGetValue(key, out var passage))
            {
                if (report is not null)
                    await report($"Reading {chapter.Source.TextName} {chapter.Source.Ref}").ConfigureAwait(false);

                try
                {
                    passage = await source.FetchChapterAsync(chapter.Source.TextId, chapter.Division, chapter.Unit, ct).ConfigureAwait(false);
                }
                catch (OperationCanceledException) when (ct.IsCancellationRequested)
                {
                    throw;
                }
                catch (Exception ex)
                {
                    failure = true;
                    logger.LogWarning("Reading {Text} {Ref} from {Source} failed: {ErrorType}",
                        chapter.Source.TextId, chapter.Source.Ref, source.Id, ex.GetType().Name);
                    research.Warnings.Add(
                        "The text source could not be reached, so no chapters were read. The script is written from the pointers alone; "
                        + "re-run the search later if it matters.");
                    break;
                }

                read[key] = passage;
                research.Queries.Add($"{chapter.Source.TextId} {chapter.Source.Ref}");

                if (passage is not null)
                {
                    passage.Direct = true;
                    if (!research.Passages.Any(p => p.TextId == passage.TextId && p.Ref == passage.Ref))
                    {
                        research.Passages.Add(passage);
                        directCount++;
                    }
                }
            }

            if (passage is not null)
            {
                chapter.Source.Grounded = true;
                chapter.Source.Url = passage.Url;
            }
        }

        if (!failure && research.Passages.Count < MaxPassages)
        {
            foreach (var word in SearchWords(text).Take(MaxSearchQueries))
            {
                ct.ThrowIfCancellationRequested();
                if (research.Passages.Count >= MaxPassages) break;

                if (report is not null) await report($"Searching the texts for \u201C{word}\u201D").ConfigureAwait(false);
                research.Queries.Add($"search: {word}");

                IReadOnlyList<ScripturePassage> hits;
                try
                {
                    hits = await source.SearchAsync(word, MaxHitsPerQuery, ct).ConfigureAwait(false);
                }
                catch (OperationCanceledException) when (ct.IsCancellationRequested)
                {
                    throw;
                }
                catch (Exception ex)
                {
                    logger.LogWarning("Searching {Source} failed: {ErrorType}", source.Id, ex.GetType().Name);
                    research.Warnings.Add("Searching the texts for your own words failed; the pointers above were still used.");
                    failure = true;
                    break;
                }

                foreach (var hit in hits)
                {
                    if (research.Passages.Count >= MaxPassages) break;
                    if (research.Passages.Any(p => p.Url == hit.Url)) continue;
                    hit.Direct = false;
                    research.Passages.Add(hit);
                }
            }
        }

        if (!failure && research.Passages.Count == 0 && research.Topics.Count > 0)
        {
            research.Warnings.Add(
                "None of the pointers could be read from the text source (it has no page for them), so the writer works from "
                + "the pointers and its own knowledge. Treat the citations as starting points to check.");
        }

        return research;
    }

    private sealed record PlannedChapter(StorySourceRef Source, int Division, int Unit);

    /// <summary>The chapters worth reading, surest pointers first, each named once.</summary>
    private static List<PlannedChapter> PlanChapters(IEnumerable<StoryTopicMatch> topics)
    {
        var planned = new List<PlannedChapter>();
        var sources = topics.SelectMany(t => t.Sources).OrderBy(s => s.Confidence).ToList();

        foreach (var source in sources)
        {
            var check = CitationValidator.Check(source.TextId, source.Ref);
            if (check.Status != CitationStatus.Verified || check.Division is not { } division) continue;

            if (check.UnitFrom is not { } from)
            {
                // A bare chapter of a text divided into chapters and verses (the Gita), or a division with
                // no chapter named; the source knows which of these it can read.
                planned.Add(new PlannedChapter(source, division, 0));
                continue;
            }

            var to = Math.Min(check.UnitTo ?? from, from + MaxChaptersPerPointer - 1);
            for (var unit = from; unit <= to; unit++)
                planned.Add(new PlannedChapter(source, division, unit));
        }

        return planned;
    }

    /// <summary>Hindi or Sanskrit words in a title or notes, longest first: the specific ones are the ones that find pages.</summary>
    public static IReadOnlyList<string> SearchWords(string? text) =>
    [
        .. GranthTopics.Fold(text)
            .Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .Where(w => w.Length >= MinSearchWordLength && w.Any(c => c is >= '\u0900' and <= '\u097F') && !StopWords.Contains(w))
            .Distinct(StringComparer.Ordinal)
            .OrderByDescending(w => w.Length)
    ];

    internal static StoryTopicMatch ToMatch(GranthTopic topic) => new()
    {
        TopicId = topic.Id,
        Name = topic.Name,
        Summary = topic.Summary,
        Sources = [.. topic.Sources.Select(ToRef)]
    };

    private static StorySourceRef ToRef(GranthSourceRef pointer)
    {
        var check = CitationValidator.Check(pointer.TextId, pointer.Ref);
        return new StorySourceRef
        {
            TextId = pointer.TextId,
            TextName = GranthCatalog.Get(pointer.TextId)?.English ?? pointer.TextId,
            Ref = pointer.Ref,
            Note = pointer.Note,
            Confidence = pointer.Confidence,
            Check = check.Status,
            CheckMessage = check.Message
        };
    }
}
