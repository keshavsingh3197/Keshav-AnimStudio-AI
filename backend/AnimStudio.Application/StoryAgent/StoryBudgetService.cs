using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Abstractions.StoryAgent;
using AnimStudio.Application.Ai;
using AnimStudio.Application.Options;
using AnimStudio.Application.StoryAgent.Stages;
using AnimStudio.Domain.Ai;
using AnimStudio.Domain.Stories;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AnimStudio.Application.StoryAgent;

/// <summary>One daily limit a build would use.</summary>
/// <param name="Kind"><c>google</c> for a model's limit on Google's side, <c>app</c> for this app's own cap on a provider.</param>
/// <param name="Name">The model or provider id.</param>
/// <param name="Used">Requests already sent today, as this app counted them.</param>
/// <param name="Needed">Requests the build would send at most (narration and pictures already made and kept are not counted).</param>
/// <param name="Status"><c>ok</c>, <c>warn</c> (past the warning share) or <c>over</c> (past the limit).</param>
/// <param name="Fallback">What the person can switch to that does not use this limit.</param>
/// <param name="Area">What the limit is for: <c>speech</c>, <c>music</c> or <c>image</c>, so the right part is switched.</param>
public sealed record StoryBudgetLine(
    string Kind, string Name, string Label, long Used, int Needed, long Limit, int PercentAfter, string Status, string Fallback,
    string Area);

/// <param name="Status">The worst line's status, or <c>ok</c> with none.</param>
/// <param name="ResetsAtUtc">When Google's daily counts start again.</param>
public sealed record StoryBudgetReport(
    string Status, int WarnAtPercent, IReadOnlyList<StoryBudgetLine> Lines, DateTime ResetsAtUtc, IReadOnlyList<string> Notes)
{
    public static StoryBudgetReport Unchecked(DateTime resetsAtUtc) => new("ok", 0, [], resetsAtUtc, []);
}

/// <summary>
/// Before a build: how many requests it would send to each paid Google model (speech and music) and to each free image
/// engine, set against what was sent today and the daily limit, so the person can be warned before a build fails
/// half-way, runs up a bill, or ends up with plain backgrounds.
/// </summary>
/// <remarks>
/// Only this app's own calls are counted. Another app or AI Studio itself using the same key is invisible here, so the
/// numbers are a floor, not the account's real total. A free image engine is checked against this app's own daily cap
/// for it; the engine's own allowance (Pollinations' throttle, Hugging Face's monthly credits) cannot be read and is
/// named in a note instead. The build writes no text with a model, so text is not counted.
/// </remarks>
public sealed class StoryBudgetService(
    IAiUsageRepository usage,
    StoryNarrator narrator,
    IAiProviderRegistry registry,
    IOptionsMonitor<AiOptions> aiOptions,
    IOptionsMonitor<StoryAgentOptions> options,
    TimeProvider clock,
    ILogger<StoryBudgetService> logger)
{
    public const string Ok = "ok";
    public const string Warn = "warn";
    public const string Over = "over";

    private const string SpeechFallback =
        "Use a free voice made on this machine (Kokoro or Piper), or subtitles only.";
    private const string MusicFallback =
        "Use a free royalty-free track from the music catalogue, or no music.";
    private const string ImageFallback =
        "Use plain backgrounds for scenes without a picture of yours (attach your own in the script review), or set up ComfyUI on this machine, which has no limit.";

    public const string SpeechArea = "speech";
    public const string MusicArea = "music";
    public const string ImageArea = "image";

    /// <summary>What each remote image engine limits on its own side, which this app cannot read.</summary>
    private static readonly Dictionary<string, string> ImageEngineNotes = new(StringComparer.OrdinalIgnoreCase)
    {
        [KnownAiProviders.Pollinations] =
            "Pollinations limits requests on its own side (sent without a key they are throttled, and may be refused), which this app cannot see; a refused picture moves to the next engine or a plain background.",
        [KnownAiProviders.HuggingFace] =
            "Hugging Face charges each picture to your account's monthly inference credits (a free account gets little or none), which this app cannot see; check huggingface.co/settings/billing.",
        [KnownAiProviders.CloudflareWorkersAi] =
            "Cloudflare's free allowance is counted in neurons per day on its side, which this app cannot see."
    };

    public async Task<StoryBudgetReport> CheckAsync(StoryRun run, StoryBuildOptions build, CancellationToken ct)
    {
        var budget = options.CurrentValue.Budget;
        var now = clock.GetUtcNow().UtcDateTime;
        var (dayStartUtc, resetsAtUtc) = GoogleDay(now, budget.ResetTimeZone);
        if (!budget.Enabled || run.Script is null) return StoryBudgetReport.Unchecked(resetsAtUtc);

        // The estimate reads the options the build would use; the run itself is put back as it was.
        var saved = run.Options;
        run.Options = build;
        List<(string ProviderId, string Model, int Requests, string Label, string Fallback, string Area)> needs;
        var notes = new List<string>();
        try
        {
            needs = await NeedsAsync(run, notes, ct).ConfigureAwait(false);
        }
        finally
        {
            run.Options = saved;
        }

        var pictures = PicturesNeeded(run, build);
        if (needs.Count == 0 && pictures == 0) return new StoryBudgetReport(Ok, budget.WarnAtPercent, [], resetsAtUtc, notes);

        IReadOnlyList<AiModelRequestCount> counts = [];
        if (needs.Count > 0)
        {
            try
            {
                counts = await usage.CountBillableRequestsByModelAsync(dayStartUtc, ct).ConfigureAwait(false);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                // A check that cannot read the counts must not stop the build; it says so instead.
                logger.LogWarning(ex, "Could not read today's AI usage for the build check.");
                return new StoryBudgetReport(Ok, budget.WarnAtPercent, [], resetsAtUtc,
                    [.. notes, "Today's usage could not be read, so the daily limits were not checked."]);
            }
        }

        var warnAt = Math.Clamp(budget.WarnAtPercent, 1, 100);
        var lines = new List<StoryBudgetLine>();

        foreach (var group in needs.GroupBy(n => n.Model, StringComparer.OrdinalIgnoreCase))
        {
            if (!budget.DailyRequestLimits.TryGetValue(group.Key, out var limit) || limit <= 0) continue;
            var used = counts.Where(c => string.Equals(ModelOf(c), group.Key, StringComparison.OrdinalIgnoreCase)).Sum(c => c.Requests);
            var first = group.First();
            lines.Add(Line("google", group.Key, first.Label, used, group.Sum(n => n.Requests), limit, warnAt, first.Fallback, first.Area));
        }

        // This app's own cap on a provider (Settings > AI), counted per UTC day like the guard that enforces it. Past it,
        // the app refuses the calls itself, whatever Google would allow.
        foreach (var group in needs.GroupBy(n => n.ProviderId, StringComparer.OrdinalIgnoreCase))
        {
            if (AppCap(group.Key) is not { } cap) continue;
            if (await UsedTodayAsync(group.Key, now, ct).ConfigureAwait(false) is not { } used) continue;

            var first = group.First();
            lines.Add(Line("app", group.Key, $"This app's daily cap for {DisplayName(group.Key)} (Settings > AI)", used, group.Sum(n => n.Requests), cap, warnAt,
                "Raise the provider's daily limit in Settings > AI, or " + char.ToLowerInvariant(first.Fallback[0]) + first.Fallback[1..], first.Area));
        }

        if (pictures > 0) await AddPictureLinesAsync(pictures, now, warnAt, lines, notes, ct).ConfigureAwait(false);

        if (lines.Any(l => l.Kind == "google"))
            notes.Add("Only this app's own requests are counted; other apps or AI Studio using the same key are not seen here.");
        if (lines.Any(l => l.Kind == "app"))
            notes.Add("This app's own daily caps start again at midnight UTC.");

        var status = lines.Any(l => l.Status == Over) ? Over : lines.Any(l => l.Status == Warn) ? Warn : Ok;
        return new StoryBudgetReport(status, warnAt, lines, resetsAtUtc, notes);
    }

    /// <summary>
    /// The scenes the Visuals stage would ask the image engine for: a build that makes pictures, a scene with a prompt
    /// and no picture of its own kept from before, and no clip of the person's playing over it.
    /// </summary>
    private static int PicturesNeeded(StoryRun run, StoryBuildOptions build)
    {
        if (build.Visuals != StoryVisualMode.Auto || run.Script is null) return 0;

        return run.Script.Scenes.Count(s =>
            !string.IsNullOrWhiteSpace(s.ImagePrompt)
            && !StoryObjectKeys.Owns(run.Id, s.ImageKey)
            && !(s.HasAttachedClip && StoryObjectKeys.Owns(run.Id, s.VideoKey)));
    }

    /// <summary>
    /// Follows the image chain the way the executor does: each engine with a daily cap takes pictures until the cap, the
    /// rest move on to the next, and the last engine is asked for whatever is left - past its cap, those scenes get plain
    /// backgrounds. An engine on this machine, or one with no cap, takes everything that reaches it.
    /// </summary>
    private async Task AddPictureLinesAsync(int pictures, DateTime now, int warnAt, List<StoryBudgetLine> lines, List<string> notes, CancellationToken ct)
    {
        IReadOnlyList<IImageAiProvider> chain;
        try
        {
            chain = registry.ImageChain();
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning(ex, "Could not read the image engines for the build check.");
            return;
        }

        if (chain.Count == 0) return;

        var left = pictures;
        for (var i = 0; i < chain.Count && left > 0; i++)
        {
            var id = chain[i].Id.Value;
            if (RunsLocally(chain[i].Id))
            {
                left = 0;
                break;
            }

            if (ImageEngineNotes.TryGetValue(id, out var note)) notes.Add(note);

            if (AppCap(id) is not { } cap)
            {
                notes.Add($"{DisplayName(id)} has no daily cap in this app (Settings > AI), so its pictures were not checked against one.");
                left = 0;
                break;
            }

            if (await UsedTodayAsync(id, now, ct).ConfigureAwait(false) is not { } used)
            {
                left = 0;
                break;
            }

            var last = i == chain.Count - 1;
            var take = last ? left : (int)Math.Min(left, Math.Max(0, cap - used));
            left -= take;

            lines.Add(Line("app", id, $"Free pictures from {DisplayName(id)} (this app's daily cap, Settings > AI)", used, take, cap, warnAt,
                last
                    ? ImageFallback
                    : "The rest go to the next image engine. " + ImageFallback,
                ImageArea));
        }
    }

    private long? AppCap(string providerId) =>
        AiProviderId.TryParse(providerId, out var id) && aiOptions.CurrentValue.ProviderFor(id)?.DailyRequestLimit is { } cap && cap > 0
            ? cap
            : null;

    private bool RunsLocally(AiProviderId id) =>
        aiOptions.CurrentValue.ProviderFor(id)?.IsLocal == true || KnownAiProviders.Find(id.Value)?.RunsLocally == true;

    private static string DisplayName(string providerId) => KnownAiProviders.Find(providerId)?.DisplayName ?? providerId;

    /// <summary>Requests this app sent the provider today (UTC, as its own cap counts them), or null when unreadable.</summary>
    private async Task<long?> UsedTodayAsync(string providerId, DateTime now, CancellationToken ct)
    {
        var today = AiUsageRecord.BucketFor(now);
        try
        {
            return await usage.CountBillableRequestsAsync(providerId, today, today, ct).ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning(ex, "Could not read today's usage of {ProviderId} for the build check.", providerId);
            return null;
        }
    }

    private static StoryBudgetLine Line(string kind, string name, string label, long used, int needed, long limit, int warnAt, string fallback,
        string area)
    {
        var after = used + needed;
        var percent = (int)Math.Min(999, after * 100 / limit);
        var status = after > limit ? Over : percent >= warnAt ? Warn : Ok;
        return new StoryBudgetLine(kind, name, label, used, needed, limit, percent, status, fallback, area);
    }

    /// <summary>The paid requests the build would send, per provider and model.</summary>
    private async Task<List<(string ProviderId, string Model, int Requests, string Label, string Fallback, string Area)>> NeedsAsync(
        StoryRun run, List<string> notes, CancellationToken ct)
    {
        var needs = new List<(string, string, int, string, string, string)>();
        var script = run.Script!;

        if (run.Options.Narration != StoryNarrationMode.None)
        {
            NarrationPlan? plan = null;
            try
            {
                plan = await narrator.PlanAsync(run, ct).ConfigureAwait(false);
            }
            catch (StoryStageException)
            {
                // The build itself will say what is wrong with the voice; there is nothing to count until it can speak.
            }

            var engine = plan is null ? null : plan.Engine ?? (plan.Profile is null ? registry.SpeechChain().FirstOrDefault()?.Id.Value : null);
            if (plan is not null && engine is not null && KnownAiProviders.Find(engine)?.Family == AiProviderFamily.GeminiSpeech)
            {
                var requests = script.Scenes
                    .Where(s => s.AudioTake > 0 || s.AudioSeconds is not > 0
                        || s.AudioKey != StoryObjectKeys.Narration(run.Id, s.Number, StoryNarrator.Fingerprint(plan, s)))
                    .Sum(s => StoryNarrator.RequestsFor(plan, s));

                if (requests > 0)
                {
                    var model = plan.Model ?? ModelFor(engine);
                    if (model is not null) needs.Add((engine, model, requests, "Google speech (narration)", SpeechFallback, SpeechArea));
                }
            }
        }

        var composer = registry.SpeechChain().OfType<IMusicGeneratingProvider>().FirstOrDefault(p => p.IsConfigured);
        if (composer is not null && MusicStage.WillCompose(run, composerConfigured: true))
        {
            // The first model is asked; the second only when the first fails for a reason other than the allowance.
            needs.Add((composer.Id.Value, MusicStage.ComposerModels[0], 1, "Google Lyria (music)", MusicFallback, MusicArea));
        }

        return needs;
    }

    /// <summary>The model a provider uses when a call names none.</summary>
    private string? ModelFor(string providerId) =>
        AiProviderId.TryParse(providerId, out var id) && aiOptions.CurrentValue.ProviderFor(id)?.Model is { Length: > 0 } configured
            ? configured
            : KnownAiProviders.Find(providerId)?.DefaultModel;

    private string? ModelOf(AiModelRequestCount count) => count.Model ?? ModelFor(count.ProviderId);

    /// <summary>When Google's current day began and when the next one begins, in UTC.</summary>
    public static (DateTime StartUtc, DateTime NextUtc) GoogleDay(DateTime nowUtc, string? timeZone)
    {
        var zone = FindZone(timeZone);
        var local = TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(nowUtc, DateTimeKind.Utc), zone);
        var start = TimeZoneInfo.ConvertTimeToUtc(DateTime.SpecifyKind(local.Date, DateTimeKind.Unspecified), zone);
        var next = TimeZoneInfo.ConvertTimeToUtc(DateTime.SpecifyKind(local.Date.AddDays(1), DateTimeKind.Unspecified), zone);
        return (start, next);
    }

    private static TimeZoneInfo FindZone(string? id)
    {
        foreach (var candidate in new[] { id, "America/Los_Angeles", "Pacific Standard Time" })
        {
            if (string.IsNullOrWhiteSpace(candidate)) continue;
            if (TimeZoneInfo.TryFindSystemTimeZoneById(candidate, out var zone)) return zone;
        }

        return TimeZoneInfo.Utc;
    }
}
