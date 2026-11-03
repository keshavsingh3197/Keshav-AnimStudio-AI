using AnimStudio.Domain.Stories;

namespace AnimStudio.Application.StoryAgent;

/// <summary>Where a stage says "this is worth a second look". Shown beside the script, never hidden, never repeated.</summary>
public static class StoryRunWarnings
{
    public const int Max = 80;
    private const int MaxLength = 600;

    public static void Add(StoryRun run, string? warning)
    {
        if (string.IsNullOrWhiteSpace(warning) || run.Warnings.Count >= Max) return;

        var text = warning.Trim();
        if (text.Length > MaxLength) text = text[..MaxLength].TrimEnd() + "...";
        if (!run.Warnings.Contains(text, StringComparer.Ordinal)) run.Warnings.Add(text);
    }

    public static void AddRange(StoryRun run, IEnumerable<string> warnings)
    {
        foreach (var warning in warnings) Add(run, warning);
    }
}
