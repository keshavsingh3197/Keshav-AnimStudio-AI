using AnimStudio.Domain.Stories;

namespace AnimStudio.Application.StoryAgent;

/// <summary>
/// Where a run keeps its files in the object store. Every key is composed here from the run's own id, never from
/// anything a client sent, and every file a run owns can be found again from the run's document (the store cannot
/// be listed), which is how deleting a run takes its files with it.
/// </summary>
public static class StoryObjectKeys
{
    public static string Root(string runId) => $"story-runs/{runId}";

    public static string Image(string runId, int scene, string extension) =>
        $"{Root(runId)}/images/s{scene:00}-{Guid.NewGuid().ToString("N")[..12]}{extension}";

    public static string Narration(string runId, int scene, string fingerprint) =>
        $"{Root(runId)}/narration/s{scene:00}-{fingerprint}.wav";

    public static string Music(string runId) => $"{Root(runId)}/music.mp3";

    /// <summary>Every file the run's document points at.</summary>
    public static IReadOnlyList<string> All(StoryRun run)
    {
        var keys = new List<string>();
        foreach (var scene in run.Script?.Scenes ?? [])
        {
            if (!string.IsNullOrEmpty(scene.ImageKey)) keys.Add(scene.ImageKey);
            if (!string.IsNullOrEmpty(scene.AudioKey)) keys.Add(scene.AudioKey);
        }

        if (!string.IsNullOrEmpty(run.Music?.StorageKey)) keys.Add(run.Music.StorageKey);
        return [.. keys.Distinct(StringComparer.Ordinal)];
    }

    /// <summary>True for a key that belongs to this run, so a document that was tampered with cannot make a delete reach another's files.</summary>
    public static bool Owns(string runId, string? key) =>
        !string.IsNullOrEmpty(key) && key.StartsWith(Root(runId) + "/", StringComparison.Ordinal) && !key.Contains("..", StringComparison.Ordinal);
}
