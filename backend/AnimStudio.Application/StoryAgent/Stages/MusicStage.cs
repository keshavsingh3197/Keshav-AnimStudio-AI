using AnimStudio.Application.Abstractions.Music;
using AnimStudio.Application.Abstractions.Storage;
using AnimStudio.Application.Abstractions.StoryAgent;
using AnimStudio.Application.Ai;
using AnimStudio.Application.Music;
using AnimStudio.Domain.Projects;
using AnimStudio.Domain.Stories;
using Microsoft.Extensions.Logging;

namespace AnimStudio.Application.StoryAgent.Stages;

/// <summary>
/// Picks a background track from the royalty-free catalogue: instrumental, long enough for the video, and licensed for a
/// monetized video (no non-commercial or no-derivatives tracks). The credit its licence asks for is kept with the pick.
/// </summary>
/// <remarks>
/// Music is never allowed to fail a run. With no catalogue key, no result, or a track that cannot be downloaded, the stage
/// is skipped and the video is made without it, with the reason said.
/// </remarks>
public sealed class MusicStage(IMusicCatalog catalog, IObjectStore store, ILogger<MusicStage> logger) : IStoryStage
{
    /// <summary>The same ceiling an uploaded audio file gets.</summary>
    public const long MaxBytes = 25L * 1024 * 1024;

    private const string FallbackQuery = "devotional sitar flute";

    public string Id => StoryStageIds.Music;

    public async Task<StoryStageOutcome> RunAsync(StoryStageContext context, CancellationToken ct)
    {
        var run = context.Run;
        var script = run.Script ?? throw new StoryStageException("no-script", "There is no script to choose music for.");

        if (!run.Options.Music)
        {
            await DropAsync(run, ct).ConfigureAwait(false);
            return StoryStageOutcome.Skipped("music-off", "Background music is off.");
        }

        if (StoryObjectKeys.Owns(run.Id, run.Music?.StorageKey) && await ExistsAsync(run.Music!.StorageKey, ct).ConfigureAwait(false))
            return StoryStageOutcome.Completed($"Using \u201C{run.Music.Title}\u201D by {run.Music.Artist}.");

        if (!catalog.IsConfigured)
        {
            StoryRunWarnings.Add(run, "Music search is not set up (it needs a Jamendo client id), so the video has no background music.");
            return StoryStageOutcome.Skipped("music-not-configured", "Music search isn't set up, so the video has no background music.");
        }

        await context.Report(15, "Searching for a track").ConfigureAwait(false);
        var query = Query(run, script);
        var seconds = (int)Math.Floor(script.Scenes.Sum(s => s.AudioSeconds ?? s.EstimatedSeconds));
        var settings = new ProjectSettings { DistributionIntent = DistributionIntent.Monetized };

        MusicTrack? pick = null;
        try
        {
            foreach (var (text, minimum) in Attempts(query, seconds))
            {
                ct.ThrowIfCancellationRequested();
                var page = await catalog.SearchAsync(new MusicSearchQuery(
                    text, Genre: null, Mood: null, Tempo: null, InstrumentalOnly: true,
                    MinSeconds: minimum, MaxSeconds: null, MusicSort.BestMatch, Page: 1, IncludeNonCommercial: false), ct).ConfigureAwait(false);

                pick = page.Tracks.FirstOrDefault(t => t.Downloadable && MusicLicensing.WhyNotUsable(t.License, settings) is null);
                if (pick is not null) break;
            }

            if (pick is null)
            {
                StoryRunWarnings.Add(run, "No royalty-free track matched, so the video has no background music. Add one in the project's music panel.");
                return StoryStageOutcome.Skipped("music-none", "No suitable track was found, so the video has no background music.");
            }

            await context.Report(55, $"Downloading \u201C{pick.Title}\u201D").ConfigureAwait(false);
            var audio = await catalog.DownloadAsync(pick, MaxBytes, ct).ConfigureAwait(false);

            // The file is saved as an MP3, so only an MP3 is kept.
            if (AiAudioValidator.Sniff(audio) != AiAudioValidator.Mp3)
            {
                StoryRunWarnings.Add(run, "The music track could not be used (it was not an MP3), so the video has no background music.");
                return StoryStageOutcome.Skipped("music-format", "The track was not an MP3, so the video has no background music.");
            }

            var key = StoryObjectKeys.Music(run.Id);
            await using (var content = new MemoryStream(audio, writable: false))
                await store.SaveAsync(key, content, AiAudioValidator.Mp3, ct).ConfigureAwait(false);

            run.Music = new StoryMusicPick
            {
                Provider = pick.Provider,
                TrackId = pick.Id,
                Title = pick.Title,
                Artist = pick.Artist,
                PageUrl = pick.PageUrl,
                LicenseCode = pick.License.Code,
                LicenseUrl = pick.License.Url,
                LicenseClass = pick.License.Class.ToString(),
                Attribution = MusicLicensing.Attribution(pick),
                StorageKey = key
            };
            return StoryStageOutcome.Completed($"Music: \u201C{pick.Title}\u201D by {pick.Artist} ({pick.License.Code}).");
        }
        catch (MusicCatalogException ex)
        {
            logger.LogWarning("Story run {RunId}: the music catalogue refused: {Code}", run.Id, ex.Code);
            StoryRunWarnings.Add(run, $"Background music could not be added ({ex.Message}). The video was made without it.");
            return StoryStageOutcome.Skipped(ex.Code, "Background music could not be added.");
        }
        catch (HttpRequestException ex)
        {
            logger.LogWarning("Story run {RunId}: the music catalogue could not be reached: {ErrorType}", run.Id, ex.GetType().Name);
            StoryRunWarnings.Add(run, "The music catalogue could not be reached, so the video has no background music.");
            return StoryStageOutcome.Skipped("music-unreachable", "The music catalogue could not be reached.");
        }
    }

    /// <summary>The person's words first, then the script's own suggestion, then the topic's, then a plain devotional one.</summary>
    private static string Query(StoryRun run, StoryScript script)
    {
        var topic = run.Research?.Topics.Select(t => GranthTopics.Get(t.TopicId)).OfType<GranthTopic>().FirstOrDefault();
        foreach (var candidate in new[] { run.Options.MusicQuery, script.MusicQuery, topic?.MusicQuery })
        {
            if (!string.IsNullOrWhiteSpace(candidate)) return candidate.Trim()[..Math.Min(candidate.Trim().Length, 80)];
        }

        return FallbackQuery;
    }

    /// <summary>
    /// The search is narrowed first (the query, a track as long as the video) and then relaxed, because the catalogue's search
    /// wants every word to match and a long query finds nothing.
    /// </summary>
    private static IEnumerable<(string Text, int? MinSeconds)> Attempts(string query, int seconds)
    {
        var first = query.Split(' ', StringSplitOptions.RemoveEmptyEntries)[0];
        var minimum = seconds >= 30 ? seconds : (int?)null;

        yield return (query, minimum);
        yield return (query, null);
        if (!string.Equals(first, query, StringComparison.Ordinal))
        {
            yield return (first, minimum);
            yield return (first, null);
        }
    }

    private async Task<bool> ExistsAsync(string key, CancellationToken ct)
    {
        await using var stream = await store.OpenAsync(key, ct).ConfigureAwait(false);
        return stream is not null;
    }

    private async Task DropAsync(StoryRun run, CancellationToken ct)
    {
        if (StoryObjectKeys.Owns(run.Id, run.Music?.StorageKey)) await store.DeleteAsync(run.Music!.StorageKey, ct).ConfigureAwait(false);
        run.Music = null;
    }
}
