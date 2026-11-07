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

    /// <summary>A scene's further picture; <paramref name="shot"/> counts from 2, the scene's own picture being the first.</summary>
    public static string ShotImage(string runId, int scene, int shot, string extension) =>
        $"{Root(runId)}/images/s{scene:00}-{shot}-{Guid.NewGuid().ToString("N")[..12]}{extension}";

    public static string Thumbnail(string runId, string extension) =>
        $"{Root(runId)}/images/thumbnail-{Guid.NewGuid().ToString("N")[..12]}{extension}";

    public static string Narration(string runId, int scene, string fingerprint) =>
        $"{Root(runId)}/narration/s{scene:00}-{fingerprint}.wav";

    public static string Video(string runId, int scene) =>
        $"{Root(runId)}/clips/s{scene:00}-{Guid.NewGuid().ToString("N")[..12]}.mp4";

    public static string Music(string runId) => $"{Root(runId)}/music.mp3";

    /// <summary>The background track as an MP3 or a WAV, by its content type.</summary>
    public static string Music(string runId, string contentType) =>
        contentType == "audio/wav" ? $"{Root(runId)}/music.wav" : Music(runId);

    /// <summary>Every file the run's document points at.</summary>
    public static IReadOnlyList<string> All(StoryRun run)
    {
        var keys = new List<string>();
        foreach (var scene in run.Script?.Scenes ?? [])
        {
            if (!string.IsNullOrEmpty(scene.ImageKey)) keys.Add(scene.ImageKey);
            if (!string.IsNullOrEmpty(scene.AudioKey)) keys.Add(scene.AudioKey);
            if (!string.IsNullOrEmpty(scene.VideoKey)) keys.Add(scene.VideoKey);
            keys.AddRange(scene.Shots.Select(s => s.ImageKey).OfType<string>().Where(k => k.Length > 0));
        }

        if (!string.IsNullOrEmpty(run.Script?.ThumbnailKey)) keys.Add(run.Script.ThumbnailKey);

        if (!string.IsNullOrEmpty(run.Music?.StorageKey)) keys.Add(run.Music.StorageKey);
        return [.. keys.Distinct(StringComparer.Ordinal)];
    }

    /// <summary>True for a key that belongs to this run, so a document that was tampered with cannot make a delete reach another's files.</summary>
    public static bool Owns(string runId, string? key) =>
        !string.IsNullOrEmpty(key) && key.StartsWith(Root(runId) + "/", StringComparison.Ordinal) && !key.Contains("..", StringComparison.Ordinal);
}
