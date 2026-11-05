using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Abstractions.Music;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Abstractions.Storage;
using AnimStudio.Application.Abstractions.StoryAgent;
using AnimStudio.Application.Ai;
using AnimStudio.Application.Music;
using AnimStudio.Domain.Ai;
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
public sealed class MusicStage(
    IMusicCatalog catalog,
    IObjectStore store,
    IAiProviderRegistry registry,
    ILogger<MusicStage> logger,
    IAiUsageRepository? usage = null,
    TimeProvider? clock = null) : IStoryStage
{
    /// <summary>What a composed track's pick is filed under.</summary>
    public const string ComposedProvider = "google-lyria";

    /// <summary>The full-length model first (a track as long as the video), then the 30-second clip the renderer loops.</summary>
    public static readonly IReadOnlyList<string> ComposerModels = ["lyria-3.5", "lyria-3-clip-preview"];

    private const int MinComposedSeconds = 30;
    private const int MaxComposedSeconds = 180;

    /// <summary>The longest brief a person can write for the composer; the composer itself takes 2,000 characters.</summary>
    public const int MaxPromptChars = 1_500;

    /// <summary>The same ceiling an uploaded audio file gets.</summary>
    public const long MaxBytes = 25L * 1024 * 1024;

    /// <summary>A track the person made elsewhere (in Google's own music tool, say) and attached.</summary>
    public const string UploadedProvider = "upload";

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

        var composer = run.Options.MusicSource == StoryMusicSource.Search ? null : Composer();
        if (run.Options.MusicSource == StoryMusicSource.Generate && composer is null)
            StoryRunWarnings.Add(run, "Composing music needs Google Gemini speech set up in Settings, so a royalty-free track was searched for instead.");

        // A track from before is kept only while it still comes from where the person asked for it to come from. One they
        // attached themselves is always kept: they chose it over anything this stage would pick.
        var composedBefore = string.Equals(run.Music?.Provider, ComposedProvider, StringComparison.Ordinal);
        var uploaded = string.Equals(run.Music?.Provider, UploadedProvider, StringComparison.Ordinal);
        if (StoryObjectKeys.Owns(run.Id, run.Music?.StorageKey)
            && (uploaded || ((composer is null || composedBefore) && (run.Options.MusicSource != StoryMusicSource.Search || !composedBefore)))
            && await ExistsAsync(run.Music!.StorageKey, ct).ConfigureAwait(false))
        {
            return StoryStageOutcome.Completed($"Using \u201C{run.Music.Title}\u201D by {run.Music.Artist}.");
        }

        if (composer is not null)
        {
            var composed = await ComposeAsync(context, composer, script, ct).ConfigureAwait(false);
            if (composed is not null) return composed;
        }

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

            await DropAsync(run, ct).ConfigureAwait(false);
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

    /// <summary>
    /// True when a build with these options would ask the composer for a track (a paid request): music is on, it is not
    /// to be searched for, a composer is set up, and there is no track from before that the stage keeps.
    /// </summary>
    public static bool WillCompose(StoryRun run, bool composerConfigured)
    {
        if (!run.Options.Music || run.Options.MusicSource == StoryMusicSource.Search || !composerConfigured) return false;
        if (!StoryObjectKeys.Owns(run.Id, run.Music?.StorageKey)) return true;
        return run.Music!.Provider is not (ComposedProvider or UploadedProvider);
    }

    /// <summary>
    /// Kept with the other AI calls so the check before a build knows how many of the day's composer requests are gone.
    /// Never fails the stage: the record is bookkeeping, the track is what matters.
    /// </summary>
    private async Task RecordAsync(StoryRun run, IMusicGeneratingProvider composer, string model, AiCallOutcome outcome, string? code, CancellationToken ct)
    {
        if (usage is null) return;
        try
        {
            var now = (clock ?? TimeProvider.System).GetUtcNow().UtcDateTime;
            await usage.RecordAsync(new AiUsageRecord
            {
                ProviderId = composer.Id.Value,
                Capability = AiCapability.Speech,
                Model = model,
                UserId = run.UserId,
                DayBucket = AiUsageRecord.BucketFor(now),
                Units = 1,
                Outcome = outcome,
                ErrorCode = code,
                CreatedAt = now
            }, ct).ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning("Story run {RunId}: the music request could not be recorded: {ErrorType}", run.Id, ex.GetType().Name);
        }
    }

    /// <summary>The configured engine that can compose music, if any.</summary>
    private IMusicGeneratingProvider? Composer() =>
        registry.SpeechChain().OfType<IMusicGeneratingProvider>().FirstOrDefault(p => p.IsConfigured);

    /// <summary>
    /// A track composed for the story, saved and credited; null when it could not be made, so the catalogue is tried.
    /// </summary>
    private async Task<StoryStageOutcome?> ComposeAsync(
        StoryStageContext context, IMusicGeneratingProvider composer, StoryScript script, CancellationToken ct)
    {
        var run = context.Run;
        var (prompt, seconds) = Brief(run, script);

        foreach (var model in ComposerModels)
        {
            ct.ThrowIfCancellationRequested();
            await context.Report(15, "Composing music with Google Lyria").ConfigureAwait(false);

            AiGeneratedMusic music;
            try
            {
                music = await composer.GenerateMusicAsync(prompt, model, ct).ConfigureAwait(false);
                await RecordAsync(run, composer, model, AiCallOutcome.Succeeded, null, ct).ConfigureAwait(false);
            }
            catch (AiProviderException ex)
            {
                await RecordAsync(run, composer, model, AiCallOutcome.Failed, ex.Code, ct).ConfigureAwait(false);
                logger.LogWarning("Story run {RunId}: {Model} could not compose music: {Code}", run.Id, model, ex.Code);

                // Out of allowance or refused the key: the other model shares both.
                if (ex.Code is "rate-limited" or "credential-rejected" or "credential-missing" or "quota-exhausted") break;
                continue;
            }

            // Lyria answers in MP3 or WAV; both are kept (a WAV used to be thrown away here, and the catalogue searched instead).
            var type = AiAudioValidator.Sniff(music.Content);
            if (type is not (AiAudioValidator.Mp3 or AiAudioValidator.Wav) || music.Content.Length > MaxBytes)
            {
                logger.LogWarning("Story run {RunId}: {Model} returned music that can't be used ({Type}, {Bytes} bytes).",
                    run.Id, model, type ?? "unknown", music.Content.Length);
                continue;
            }

            await DropAsync(run, ct).ConfigureAwait(false);
            var key = StoryObjectKeys.Music(run.Id, type);
            await using (var content = new MemoryStream(music.Content, writable: false))
                await store.SaveAsync(key, content, type, ct).ConfigureAwait(false);

            var title = $"{(string.IsNullOrWhiteSpace(script.TitleEnglish) ? script.Title : script.TitleEnglish)} (score)";
            run.Music = new StoryMusicPick
            {
                Provider = ComposedProvider,
                TrackId = music.Model,
                Title = title.Length > 120 ? title[..120] : title,
                Artist = "Google Lyria",
                LicenseCode = "AI-generated",
                // Composed for this video: credited, and nobody else's licence to keep to.
                LicenseClass = "AttributionOnly",
                Attribution = "Music generated with Google Lyria (AI)",
                StorageKey = key,
                ContentType = type,
                Prompt = prompt,
                Seconds = seconds
            };
            return StoryStageOutcome.Completed($"Music composed for this story with Google Lyria ({music.Model}).");
        }

        StoryRunWarnings.Add(run, "Google Lyria could not compose the music this time, so a royalty-free track was searched for instead.");
        return null;
    }

    /// <summary>
    /// What the composer is asked for, and how long the track should run: the person's own brief when they wrote one,
    /// otherwise one built from the script. Shown to the person too, to edit or to paste into Google's own music tool.
    /// </summary>
    /// <param name="forComposer">False for the brief shown to the person, which leaves out the note that asks for a new take.</param>
    public static (string Prompt, int Seconds) Brief(StoryRun run, StoryScript script, bool forComposer = true)
    {
        // The narration as it will play, plus a little for the music to settle under the last line.
        var seconds = Math.Clamp((int)Math.Ceiling(script.Scenes.Sum(s => s.AudioSeconds ?? s.EstimatedSeconds)) + 2,
            MinComposedSeconds, MaxComposedSeconds);
        var prompt = string.IsNullOrWhiteSpace(run.Options.MusicPrompt) ? ComposerPrompt(run, script, seconds) : run.Options.MusicPrompt.Trim();

        // Asked again: the same brief would come back as much the same piece, so a new take asks for a new one.
        if (forComposer && run.MusicTake > 0)
            prompt += $" Take {run.MusicTake + 1}: a fresh melody and arrangement, different from earlier versions.";
        return (prompt, seconds);
    }

    /// <summary>An instrumental brief for the composer: the style asked for, the scenes' moods, and the video's length.</summary>
    internal static string ComposerPrompt(StoryRun run, StoryScript script, int seconds)
    {
        var style = Query(run, script);
        var moods = script.Scenes.Select(s => s.Mood?.Trim()).Where(m => !string.IsNullOrEmpty(m))
            .Distinct(StringComparer.OrdinalIgnoreCase).Take(4).ToList();
        var length = Math.Clamp(seconds, MinComposedSeconds, MaxComposedSeconds);
        var title = string.IsNullOrWhiteSpace(script.TitleEnglish) ? null : script.TitleEnglish.Trim();

        var prompt = "Instrumental background score for a narrated Indian mythological story video"
            + (title is null ? string.Empty : $" titled \"{(title.Length > 80 ? title[..80] : title)}\"")
            + $". Style and instruments: {style}."
            + (moods.Count > 0 ? $" Mood, in order: {string.Join(", then ", moods)}." : string.Empty)
            + $" About {length} seconds long, with a gentle opening, a fuller middle and a calm ending."
            + " Keep it soft and steady so a voice speaking over it stays clear."
            + " Instrumental only: no vocals, no singing, no lyrics, no spoken words.";
        return prompt;
    }

    /// <summary>The person's words first, then the script's own suggestion, then the topic's, then the genre's, then a plain devotional one.</summary>
    private static string Query(StoryRun run, StoryScript script)
    {
        var genre = StoryGenres.Of(run);
        var topic = run.Research?.Topics
            .Select(t => genre.Topics.FirstOrDefault(g => g.Id == t.TopicId)?.MusicQuery)
            .FirstOrDefault(q => !string.IsNullOrWhiteSpace(q));
        foreach (var candidate in new[] { run.Options.MusicQuery, script.MusicQuery, topic, genre.MusicQuery })
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
