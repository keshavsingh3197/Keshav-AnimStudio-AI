using AnimStudio.Application.Abstractions.StoryAgent;
using AnimStudio.Domain.Stories;

namespace AnimStudio.Application.StoryAgent.Stages;

/// <summary>
/// Searches the Granths for what the title is about, so the script is written from the texts and checked against them.
/// A creative genre has no texts to search: its topics are matched to the title and handed to the writer as ideas.
/// </summary>
public sealed class ResearchStage(ScriptureResearcher researcher, TimeProvider clock) : IStoryStage
{
    public string Id => StoryStageIds.Research;

    public async Task<StoryStageOutcome> RunAsync(StoryStageContext context, CancellationToken ct)
    {
        var run = context.Run;
        var topics = StoryGenres.TopicsOf(StoryGenres.Of(run));

        if (run.Brief.Mode == StoryGenreMode.Creative)
        {
            var ideas = new StoryResearch { RetrievedAtUtc = clock.GetUtcNow().UtcDateTime };
            foreach (var topic in GranthTopics.Match($"{run.Brief.Title} {run.Brief.Notes}", topics))
                ideas.Topics.Add(ScriptureResearcher.ToMatch(topic));

            run.Research = ideas;
            return StoryStageOutcome.Completed(ideas.Topics.Count == 0
                ? "Nothing to research for this genre; the script is written from the title and the genre's style."
                : $"Matched {ideas.Topics.Count} idea{(ideas.Topics.Count == 1 ? string.Empty : "s")} from the genre.");
        }

        var steps = 0;
        var research = await researcher.ResearchAsync(run.Brief, message =>
        {
            steps++;
            return context.Report(Math.Min(90, 8 + steps * 12), message);
        }, ct, topics.Count > 0 ? topics : null).ConfigureAwait(false);

        run.Research = research;
        StoryRunWarnings.AddRange(run, research.Warnings);

        var read = research.Passages.Count(p => p.Direct);
        var found = research.Passages.Count - read;
        var message = research.Topics.Count == 0
            ? "No curated topic matched; the script will rely on the writer's own knowledge."
            : $"Matched {research.Topics.Count} topic{(research.Topics.Count == 1 ? string.Empty : "s")} and read {read} chapter{(read == 1 ? string.Empty : "s")}"
              + (found > 0 ? $" and {found} more passage{(found == 1 ? string.Empty : "s")}." : ".");
        return StoryStageOutcome.Completed(message);
    }
}
