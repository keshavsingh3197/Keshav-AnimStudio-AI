using AnimStudio.Application.Abstractions.StoryAgent;
using AnimStudio.Domain.Stories;

namespace AnimStudio.Application.StoryAgent.Stages;

/// <summary>Searches the Granths for what the title is about, so the script is written from the texts and checked against them.</summary>
public sealed class ResearchStage(ScriptureResearcher researcher) : IStoryStage
{
    public string Id => StoryStageIds.Research;

    public async Task<StoryStageOutcome> RunAsync(StoryStageContext context, CancellationToken ct)
    {
        var run = context.Run;

        var steps = 0;
        var research = await researcher.ResearchAsync(run.Brief, message =>
        {
            steps++;
            return context.Report(Math.Min(90, 8 + steps * 12), message);
        }, ct).ConfigureAwait(false);

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
