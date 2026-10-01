using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Abstractions.Rendering;
using AnimStudio.Application.Common;
using AnimStudio.Application.Projects;
using AnimStudio.Application.Security;
using AnimStudio.Domain.Assets;
using AnimStudio.Domain.Errors;
using AnimStudio.Domain.Jobs;
using AnimStudio.Domain.Rendering;

namespace AnimStudio.Application.Clips;

/// <summary>One junction override, in seconds - not yet converted to frames.</summary>
public sealed record ClipJunctionOverride(
    SceneTransition Transition,
    double TransitionSeconds,
    double LeadInSeconds = 0,
    double TailOutSeconds = 0,
    bool FreezeHead = false,
    bool FreezeTail = false);


/// <summary>One music (or other audio) clip placed at its own point on the timeline.</summary>
public sealed record TimedMusicClip(
    string AssetId, double StartSeconds, double Volume,
    double? TrimStartSeconds, double? TrimEndSeconds);

/// <summary>
/// One stretch of the finished timeline over which the music plays at a reduced level,
/// as resolved by the client's overlap rules.
/// </summary>
public sealed record MusicDuckWindow(double StartSeconds, double EndSeconds, double Level);

/// <summary>
/// One clip's sound: the level of its own audio, and optionally a sound of its own that
/// either replaces that audio or plays over it. Position in the list IS the clip it names.
/// </summary>
public sealed record ClipAudioTrack(
    double Volume, string? AudioAssetId, double AudioVolume, bool KeepOriginalAudio, double? TrimStartSeconds, double? TrimEndSeconds);

/// <summary>What to stitch, and how. The order of <see cref="AssetIds"/> is the edit.</summary>
public sealed record ClipMergeCommand
{
    public string? ExportName { get; init; }
    public IReadOnlyList<string> AssetIds { get; init; } = [];

    public ClipFit Fit { get; init; } = ClipFit.Contain;

    public int? OutputWidth { get; init; }
    public int? OutputHeight { get; init; }

    public ExportQuality Quality { get; init; } = ExportQuality.High;

    public SceneTransition Transition { get; init; } = SceneTransition.None;

    /// <summary>Crossfade length. Ignored when the transition is a cut.</summary>
    public double TransitionSeconds { get; init; }

    /// <summary>
    /// One entry per gap between consecutive clips, overriding the uniform
    /// <see cref="Transition"/>/<see cref="TransitionSeconds"/> pair for that gap only.
    /// Null (the common case) means every gap uses the uniform pair.
    /// </summary>
    public IReadOnlyList<ClipJunctionOverride>? Junctions { get; init; }

    public bool MuteClipAudio { get; init; }

    public string? BackgroundMusicAssetId { get; init; }
    public double BackgroundMusicVolume { get; init; } = 0.18;

    /// <summary>Extra music clips, each starting at its own point on the finished timeline.</summary>
    public IReadOnlyList<TimedMusicClip> MusicTracks { get; init; } = [];

    /// <summary>
    /// Where the music steps back under the clips above it, as resolved by the client's
    /// overlap rules. Empty means the music holds one level throughout.
    /// </summary>
    public IReadOnlyList<MusicDuckWindow> MusicDuckWindows { get; init; } = [];

    /// <summary>
    /// One entry per clip in <see cref="AssetIds"/>, or null for "every clip as recorded".
    /// A partial list is refused rather than padded: guessing which clips the missing
    /// entries belong to is how one clip ends up with another clip's voice-over.
    /// </summary>
    public IReadOnlyList<ClipAudioTrack>? ClipAudio { get; init; }

    public WatermarkSettings Watermark { get; init; } = new();

    public IReadOnlyList<TimelineItemSpec>? TimelineItems { get; init; }
}

/// <summary>
/// The clip stitch's front door: reads the library, resolves a running order, and queues
/// the job.
/// <para>
/// Everything that can be refused is refused HERE, before a job exists. A queued job that
/// cannot succeed is much worse than a rejected request: it occupies a worker, retries
/// twice, and reports its failure minutes later on a screen the user has already left.
/// </para>
/// </summary>
public sealed class ClipMergeService(
    IProjectRepository projects,
    IAssetRepository assets,
    IRenderJobRepository jobs,
    IRenderCapabilities capabilities,
    ProjectStatusService status,
    ICurrentUser currentUser,
    TimeProvider clock)
{
    /// <summary>Longest crossfade offered. Beyond a second or two it reads as a mistake.</summary>
    private const double MaxTransitionSeconds = 3.0;

    /// <summary>
    /// The project's video clips in the saved Video editor order.
    /// <para>
    /// Newly uploaded clips are appended in filename order. That makes an untouched batch
    /// predictable while preserving any explicit drag, reverse, typed, or sort-by-name
    /// order across a refresh.
    /// </para>
    /// </summary>
    public async Task<IReadOnlyList<Asset>> ListClipsAsync(string projectId, CancellationToken ct)
    {
        var project = await EnsureOwnedAsync(projectId, ct).ConfigureAwait(false);

        var all = await assets.ListByProjectAsync(projectId, ct).ConfigureAwait(false);
        var clips = all.Where(a => (a.Kind == AssetKind.Video || a.Kind == AssetKind.Image) && a.IsUsableInScene).ToList();
        var savedPosition = project.Settings.ClipOrderAssetIds
            .Select((id, index) => (id, index))
            .ToDictionary(entry => entry.id, entry => entry.index, StringComparer.Ordinal);

        return
        [
            .. clips.OrderBy(c => savedPosition.TryGetValue(c.Id, out var index) ? 0 : 1)
                     .ThenBy(c => savedPosition.TryGetValue(c.Id, out var index) ? index : int.MaxValue)
                     .ThenBy(c => c.Name, NaturalNameComparer.Instance)
        ];
    }

    /// <summary>
    /// Stores the complete running order from the Video editor. The list includes clips
    /// outside the current cut too, so ticking one back in later never loses its position.
    /// </summary>
    /// <summary>
    /// Strips synthetic clip suffixes (such as _dup_..., _part_..., _a_..., _b_...) to return the canonical base asset ID.
    /// </summary>
    public static string CleanClipId(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return string.Empty;
        var trimmed = raw.Trim();
        var underscoreIdx = trimmed.IndexOf('_');
        if (underscoreIdx >= 24)
        {
            return trimmed[..underscoreIdx];
        }

        return System.Text.RegularExpressions.Regex.Replace(
            trimmed,
            @"(_(dup|part|[ab]|copy|split).*)$",
            "",
            System.Text.RegularExpressions.RegexOptions.IgnoreCase);
    }

    public async Task SaveOrderAsync(
        string projectId, IReadOnlyList<string> assetIds, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(assetIds);

        var project = await EnsureOwnedAsync(projectId, ct).ConfigureAwait(false);
        var distinctIds = assetIds.Distinct(StringComparer.Ordinal).ToList();
        if (distinctIds.Count > ClipMergeSpec.MaxClips)
        {
            throw EditingException.Invalid("too-many-clips",
                $"A single video can be built from at most {ClipMergeSpec.MaxClips} clips.");
        }

        var clips = await assets.ListByProjectAsync(projectId, ct).ConfigureAwait(false);
        var usableIds = clips
            .Where(a => (a.Kind == AssetKind.Video || a.Kind == AssetKind.Image) && a.IsUsableInScene)
            .Select(a => a.Id)
            .ToHashSet(StringComparer.Ordinal);

        var cleanedDistinctIds = distinctIds.Select(CleanClipId).Distinct().ToList();
        if (cleanedDistinctIds.Any(id => !usableIds.Contains(id)))
        {
            throw EditingException.Invalid("clip-not-found",
                "One of the clips in this order is no longer in this project.");
        }

        project.Settings.ClipOrderAssetIds = cleanedDistinctIds;
        project.UpdatedAt = clock.GetUtcNow().UtcDateTime;
        await projects.ReplaceAsync(project, ct).ConfigureAwait(false);
    }

    /// <summary>
    /// Reads a written running order against a selection of clips.
    /// <para>
    /// The selection is passed in rather than inferred, because the point of the feature is
    /// to order the clips the user has CHOSEN - matching a pasted list against the whole
    /// library would pull in clips they had deliberately left out.
    /// </para>
    /// </summary>
    public async Task<ClipOrderResult> ResolveOrderAsync(
        string projectId, IReadOnlyList<string> selectedAssetIds, string? text, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(selectedAssetIds);

        if (text is { Length: > ClipOrderLimits.MaxTextLength })
        {
            throw EditingException.Invalid("order-text-too-long",
                "That running order is too long to read.");
        }

        var clips = await ListClipsAsync(projectId, ct).ConfigureAwait(false);
        var byId = clips.ToDictionary(c => c.Id, StringComparer.Ordinal);

        // Unknown ids are dropped rather than rejected: a clip deleted in another tab
        // should not make the whole paste fail.
        var candidates = selectedAssetIds
            .Select(id =>
            {
                if (byId.TryGetValue(id, out var c)) return new ClipCandidate(id, c.Name);
                var clean = CleanClipId(id);
                if (byId.TryGetValue(clean, out c)) return new ClipCandidate(id, c.Name);
                return null;
            })
            .Where(c => c is not null)
            .Select(c => c!)
            .ToList();

        if (candidates.Count == 0)
        {
            throw EditingException.Invalid("no-clips-selected",
                "Choose the clips you want to put in order first.");
        }

        return ClipOrderResolver.FromText(candidates, text);
    }

    public async Task<RenderJob> QueueAsync(
        string projectId, ClipMergeCommand command, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(command);

        var project = await EnsureOwnedAsync(projectId, ct).ConfigureAwait(false);

        // Refused up front rather than queued: a job that cannot possibly succeed still
        // costs three attempts and a confusing failure message.
        if (!capabilities.IsAvailable)
        {
            throw new RenderException(RenderErrorCode.RendererUnavailable,
                capabilities.UnavailableReason
                ?? "Video rendering is not configured on this server.");
        }

        var clipIds = command.AssetIds ?? [];

        if (clipIds.Count == 0)
        {
            throw EditingException.Invalid("no-clips",
                "Choose at least one clip to include.");
        }

        if (clipIds.Count > ClipMergeSpec.MaxClips)
        {
            throw EditingException.Invalid("too-many-clips",
                $"A single video can be built from at most {ClipMergeSpec.MaxClips} clips.");
        }

        // One round trip for the whole set. Duplicates are deliberately allowed - a sting
        // repeated between segments is a real edit - so the lookup is by distinct id and
        // the order is honoured separately.
        var referenced = clipIds
            .Concat(command.BackgroundMusicAssetId is { Length: > 0 } music ? [music] : [])
            .Concat(command.Watermark.LogoAssetId is { Length: > 0 } logo ? [logo] : [])
            .Concat(command.MusicTracks.Select(t => t.AssetId))
            .Concat(command.ClipAudio?
                        .Select(c => c.AudioAssetId)
                        .Where(id => id is { Length: > 0 })
                        .Select(id => id!)
                    ?? [])
            .Distinct(StringComparer.Ordinal)
            .ToList();

        var queryIds = new HashSet<string>(StringComparer.Ordinal);
        foreach (var id in referenced)
        {
            queryIds.Add(id);
            var clean = CleanClipId(id);
            if (!string.IsNullOrEmpty(clean)) queryIds.Add(clean);
        }

        var loaded = await assets.GetManyAsync(queryIds, ct).ConfigureAwait(false);
        var byId = new Dictionary<string, Asset>(StringComparer.Ordinal);
        foreach (var a in loaded)
        {
            byId[a.Id] = a;
            foreach (var origId in referenced)
            {
                if (string.Equals(origId, a.Id, StringComparison.Ordinal) || CleanClipId(origId) == a.Id)
                {
                    byId[origId] = a;
                }
            }
        }

        foreach (var id in clipIds)
        {
            var asset = Require(byId, id, projectId, "clip");
            if (asset.Kind != AssetKind.Video && asset.Kind != AssetKind.Image)
            {
                throw EditingException.Invalid("not-a-video-or-image",
                    $"'{asset.Name}' is not a video or image clip.");
            }
        }

        var watermark = ValidateWatermark(command.Watermark, byId, projectId);

        if (command.BackgroundMusicAssetId is { Length: > 0 } musicId)
        {
            var asset = Require(byId, musicId, projectId, "music");

            if (asset.Kind is not (AssetKind.Audio or AssetKind.Video))
            {
                throw EditingException.Invalid("not-audio",
                    $"'{asset.Name}' has no sound in it.");
            }
        }

        // A clip carrying a sound of its own is sound, so it counts here: muting the
        // footage of a reel that is entirely voice-over is a perfectly sensible edit.
        var hasPerClipSound = command.ClipAudio?
            .Any(c => c.AudioAssetId is { Length: > 0 } && c.AudioVolume > 0) ?? false;

        var hasVideoWithAudio = clipIds.Any(id => byId.TryGetValue(id, out var a) && a.Kind == AssetKind.Video && !string.IsNullOrEmpty(a.Probe.AudioCodec));

        if (command.MuteClipAudio
            && string.IsNullOrEmpty(command.BackgroundMusicAssetId)
            && command.MusicTracks.Count == 0
            && !hasPerClipSound
            && hasVideoWithAudio)
        {
            throw EditingException.Invalid("silent-output",
                "Muting the clips with no background music would produce a silent video.");
        }

        if (command.TransitionSeconds is < 0 or > MaxTransitionSeconds)
        {
            throw EditingException.Invalid("transition-out-of-range",
                $"A transition must be between 0 and {MaxTransitionSeconds:0.#} seconds.");
        }

        if (command.BackgroundMusicVolume is < 0 or > ClipAudioSpec.MaxGain)
        {
            throw EditingException.Invalid("volume-out-of-range",
                $"Music volume must be between 0 and {ClipAudioSpec.MaxGain:0.#}.");
        }

        if (command.Junctions is { } junctions && junctions.Count != clipIds.Count - 1)
        {
            throw EditingException.Invalid("junction-count-mismatch",
                "There must be exactly one transition setting for every gap between clips.");
        }

        if (command.Junctions is not null)
        {
            foreach (var junction in command.Junctions)
            {
                if (junction.TransitionSeconds is < 0 or > MaxTransitionSeconds)
                {
                    throw EditingException.Invalid("transition-out-of-range",
                        $"A transition must be between 0 and {MaxTransitionSeconds:0.#} seconds.");
                }
            }
        }

        if (command.MusicTracks.Count > ClipMergeSpec.MaxMusicTracks)
        {
            throw EditingException.Invalid("too-many-music-tracks",
                $"At most {ClipMergeSpec.MaxMusicTracks} music clips can be placed on one video.");
        }

        foreach (var track in command.MusicTracks)
        {
            var asset = Require(byId, track.AssetId, projectId, "music");

            if (asset.Kind is not (AssetKind.Audio or AssetKind.Video))
            {
                throw EditingException.Invalid("not-audio",
                    $"'{asset.Name}' has no sound in it.");
            }

            if (track.Volume is < 0 or > ClipAudioSpec.MaxGain)
            {
                throw EditingException.Invalid("volume-out-of-range",
                    $"Music volume must be between 0 and {ClipAudioSpec.MaxGain:0.#}.");
            }

            if (track.StartSeconds < 0)
            {
                throw EditingException.Invalid("start-out-of-range",
                    "A music clip cannot start before the beginning of the video.");
            }

            if (track.TrimStartSeconds is < 0 || track.TrimEndSeconds is < 0)
            {
                throw EditingException.Invalid("trim-out-of-range",
                    "A music clip's trim cannot be negative.");
            }

            if (track.TrimStartSeconds.HasValue && track.TrimEndSeconds.HasValue
                && track.TrimEndSeconds.Value <= track.TrimStartSeconds.Value)
            {
                throw EditingException.Invalid("trim-out-of-range",
                    "A music clip's trim end must come after its trim start.");
            }
        }

        if (command.ClipAudio is { } clipAudio)
        {
            if (clipAudio.Count != clipIds.Count)
            {
                throw EditingException.Invalid("clip-audio-count-mismatch",
                    "There must be exactly one sound setting for every clip in the video.");
            }

            foreach (var entry in clipAudio)
            {
                if (entry.Volume is < 0 || entry.Volume > ClipAudioSpec.MaxGain
                    || entry.AudioVolume is < 0 || entry.AudioVolume > ClipAudioSpec.MaxGain)
                {
                    throw EditingException.Invalid("volume-out-of-range",
                        $"A clip's sound level must be between 0 and {ClipAudioSpec.MaxGain:0.#}.");
                }

                if (entry.AudioAssetId is not { Length: > 0 } soundId) continue;

                var asset = Require(byId, soundId, projectId, "sound");

                if (asset.Kind is not (AssetKind.Audio or AssetKind.Video))
                {
                    throw EditingException.Invalid("not-audio",
                        $"'{asset.Name}' has no sound in it.");
                }
            }
        }

        var rate = project.Settings.ToCanvas().FrameRate;

        var transitionFrames = command.Transition == SceneTransition.None
            ? 0
            : FrameCount.FromSeconds(command.TransitionSeconds, rate).Value;

        var junctionSpecs = command.Junctions?
            .Select(j => new ClipJunctionSpec
            {
                Transition = j.Transition,
                TransitionFrames = j.Transition == SceneTransition.None
                    ? 0
                    : FrameCount.FromSeconds(j.TransitionSeconds, rate).Value,
                LeadInSeconds = j.LeadInSeconds,
                TailOutSeconds = j.TailOutSeconds,
                FreezeHead = j.FreezeHead,
                FreezeTail = j.FreezeTail
            })
            .ToList() ?? [];

        var duckWindowSpecs = BuildDuckWindows(command.MusicDuckWindows);

        var musicTrackSpecs = command.MusicTracks
            .Select(t => new TimedMusicClipSpec
            {
                AssetId = t.AssetId,
                StartSeconds = t.StartSeconds,
                Volume = t.Volume,
                TrimStartSeconds = t.TrimStartSeconds,
                TrimEndSeconds = t.TrimEndSeconds
            })
            .ToList();

        // Stored only when it says something: an all-default list would make every job
        // document carry one entry per clip to express "as recorded".
        var clipAudioSpecs = command.ClipAudio is { Count: > 0 } tracks
                             && tracks.Any(t => t.Volume != 1.0
                                                || t.AudioAssetId is { Length: > 0 })
            ? tracks
                .Select(t => new ClipAudioSpec
                {
                    Volume = t.Volume,
                    AudioAssetId = t.AudioAssetId is { Length: > 0 } id ? id : null,
                    AudioVolume = t.AudioVolume,
                    KeepOriginalAudio = t.KeepOriginalAudio,
                    TrimStartSeconds = t.TrimStartSeconds,
                    TrimEndSeconds = t.TrimEndSeconds
                })
                .ToList()
            : [];

        var jobWidth = command.OutputWidth ?? project.Settings.Width;
        var jobHeight = command.OutputHeight ?? project.Settings.Height;
        var targetFormat = (jobWidth < jobHeight) ? "Short" : (jobWidth == jobHeight ? "Square" : "Video");

        var job = new RenderJob
        {
            ProjectId = projectId,
            UserId = currentUser.UserId,
            Kind = RenderJobKind.ClipMerge,
            Status = RenderJobStatus.Pending,
            ScenesTotal = clipIds.Count,
            Message = "Queued",
            Width = jobWidth,
            Height = jobHeight,
            TargetFormat = targetFormat,
            CreatedAt = clock.GetUtcNow().UtcDateTime,
            ClipMerge = new ClipMergeSpec
            {
                ExportName = command.ExportName,
                AssetIds = [.. clipIds],
                Fit = command.Fit,
                OutputWidth = command.OutputWidth,
                OutputHeight = command.OutputHeight,
                Quality = command.Quality,
                Transition = command.Transition,
                TransitionFrames = transitionFrames,
                Junctions = junctionSpecs,
                MuteClipAudio = command.MuteClipAudio,
                BackgroundMusicAssetId = command.BackgroundMusicAssetId,
                BackgroundMusicVolume = command.BackgroundMusicVolume,
                MusicTracks = musicTrackSpecs,
                MusicDuckWindows = duckWindowSpecs,
                ClipAudio = clipAudioSpecs,
                Watermark = watermark,
                TimelineItems = command.TimelineItems?.ToList() ?? []
            }
        };

        await jobs.InsertAsync(job, ct).ConfigureAwait(false);
        await status.MarkRenderingAsync(projectId, ct).ConfigureAwait(false);

        return job;
    }

    /// <summary>
    /// Checks the watermark and returns a clamped copy.
    /// <para>
    /// The text is sanitised rather than rejected, because it is a display string being
    /// written to a file that ffmpeg reads verbatim - and the useful guarantee is that
    /// whatever is stored is a single printable line, not that the user typed one.
    /// </para>
    /// </summary>
    private static WatermarkSettings ValidateWatermark(
        WatermarkSettings requested, Dictionary<string, Asset> byId, string projectId)
    {
        var watermark = new WatermarkSettings
        {
            Kind = requested.Kind,
            Position = requested.Position,
            Opacity = requested.Opacity,
            HeightFraction = requested.HeightFraction,
            MarginFraction = requested.MarginFraction,
            ColorHex = "#" + ClipPlanFactory.ParseRgb(requested.ColorHex),
            BackplateOpacity = requested.BackplateOpacity
        };

        switch (requested.Kind)
        {
            case WatermarkKind.Text:
                var text = ClipPlanFactory.SanitizeText(requested.Text ?? string.Empty);

                if (text.Length == 0)
                {
                    throw EditingException.Invalid("watermark-text-required",
                        "Type the text you want shown on the video, or turn the watermark off.");
                }

                watermark.Text = text;
                break;

            case WatermarkKind.Logo:
                if (requested.LogoAssetId is not { Length: > 0 } logoId)
                {
                    throw EditingException.Invalid("watermark-logo-required",
                        "Choose the image to use as the watermark, or turn the watermark off.");
                }

                var logo = Require(byId, logoId, projectId, "watermark");

                if (logo.Kind != AssetKind.Image)
                {
                    throw EditingException.Invalid("watermark-not-an-image",
                        $"'{logo.Name}' is not an image.");
                }

                watermark.LogoAssetId = logoId;
                break;
        }

        watermark.Clamp();
        return watermark;
    }

    /// <summary>
    /// Resolves a referenced asset and confirms it belongs to THIS project.
    /// <para>
    /// The project check is the access control, not a tidiness check: without it, a caller
    /// who owns one project could name any asset id in the database and have the renderer
    /// fetch it into their own output.
    /// </para>
    /// </summary>
    private static Asset Require(
        Dictionary<string, Asset> byId, string assetId, string projectId, string role)
    {
        if (!byId.TryGetValue(assetId, out var asset))
        {
            var clean = CleanClipId(assetId);
            byId.TryGetValue(clean, out asset);
        }

        if (asset is null
            || (!string.Equals(asset.ProjectId, projectId, StringComparison.Ordinal)
                && !string.Equals(asset.ProjectId, "global", StringComparison.OrdinalIgnoreCase)
                && !string.Equals(asset.ProjectId, "system", StringComparison.OrdinalIgnoreCase)))
        {
            throw EditingException.Invalid($"{role}-not-found",
                "One of the files you chose is no longer in this project.");
        }

        if (!asset.IsUsableInScene)
        {
            throw EditingException.Invalid($"{role}-not-usable",
                $"'{asset.Name}' has not been approved for use yet.");
        }

        return asset;
    }

    private async Task<Domain.Projects.Project> EnsureOwnedAsync(
        string projectId, CancellationToken ct)
    {
        var project = await projects.GetAsync(projectId, ct).ConfigureAwait(false)
            ?? throw new KeyNotFoundException();

        if (!string.Equals(project.UserId, currentUser.UserId, StringComparison.Ordinal))
            throw new UnauthorizedAccessException();

        return project;
    }
    /// <summary>
    /// Drops windows that would do nothing, clamps the rest into range and merges ones that
    /// touch at the same level, so a long dialogue run is one envelope step rather than a
    /// separate duck per cut.
    /// </summary>
    private static List<MusicDuckWindowSpec> BuildDuckWindows(IReadOnlyList<MusicDuckWindow> windows)
    {
        var result = new List<MusicDuckWindowSpec>();

        foreach (var w in windows.OrderBy(w => w.StartSeconds))
        {
            var level = Math.Clamp(w.Level, 0.0, 1.0);
            var start = Math.Max(0.0, w.StartSeconds);
            var end = w.EndSeconds;
            if (end <= start || level >= 1.0) continue;

            var last = result.Count > 0 ? result[^1] : null;
            if (last is not null
                && Math.Abs(last.Level - level) < 0.0005
                && start <= last.EndSeconds + 0.001)
            {
                last.EndSeconds = Math.Max(last.EndSeconds, end);
                continue;
            }

            if (result.Count >= ClipMergeSpec.MaxDuckWindows) break;
            result.Add(new MusicDuckWindowSpec { StartSeconds = start, EndSeconds = end, Level = level });
        }

        return result;
    }


}


