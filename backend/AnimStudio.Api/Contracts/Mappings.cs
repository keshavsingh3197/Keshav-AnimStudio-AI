using AnimStudio.Domain.Ai;
using AnimStudio.Domain.Assets;
using AnimStudio.Application.Characters;
using AnimStudio.Application.Clips;
using AnimStudio.Domain.Characters;
using AnimStudio.Domain.Jobs;
using AnimStudio.Domain.Ingest;
using AnimStudio.Domain.Projects;
using AnimStudio.Domain.Rendering;
using AnimStudio.Domain.Scenes;
using AnimStudio.Domain.Scripts;

namespace AnimStudio.Api.Contracts;

/// <summary>
/// Domain to wire shapes, in one place because several controllers return the same
/// entities and a second copy of these mappings is how two endpoints start disagreeing
/// about what a scene looks like.
/// <para>
/// This is also the boundary where frames become seconds: the pipeline counts frames so
/// that transitions and audio stay exact, but no client should have to know the project's
/// frame rate to render a duration.
/// </para>
/// </summary>
public static class Mappings
{
    public static ProjectResponse ToResponse(this Project p) => new(
        p.Id, p.Name, p.Description, p.Status.ToString(),
        p.Settings.Width, p.Settings.Height, p.Settings.FrameRateNum,
        p.Settings.DistributionIntent.ToString(), p.Settings.AcceptShareAlikeObligation,
        p.Settings.BackgroundMusicAssetId, p.Settings.BackgroundMusicVolume,
        p.CreatedAt, p.UpdatedAt,
        p.IsPinned,
        p.CustomThumbnail,
        p.Settings.DefaultWatermark.ToResponse(),
        p.Settings.DefaultOutro.ToResponse(),
        p.Settings.BrandChannelId,
        p.Settings.FollowsChannelWatermark);

    /// <summary>Every channel, the built-in default first.</summary>
    public static IReadOnlyList<BrandChannelResponse> ToChannelResponses(this AiSettings? s) =>
    [
        new BrandChannelResponse(
            BrandChannel.DefaultId, s?.DefaultChannelName ?? "Default", true,
            s?.DefaultWatermark.ToResponse(), s?.DefaultOutro.ToResponse(),
            s?.DefaultPublishing?.YouTubeChannelId, s?.DefaultPublishing?.YouTubeChannelTitle),
        .. (s?.Channels ?? []).Select(c => new BrandChannelResponse(
            c.Id, c.Name, false, c.Watermark.ToResponse(), c.Outro.ToResponse(),
            c.Publishing?.YouTubeChannelId, c.Publishing?.YouTubeChannelTitle)),
    ];

    public static WatermarkResponse? ToResponse(this WatermarkSettings? w) =>
        w is null ? null : new WatermarkResponse(
            w.Kind.ToString(),
            w.Text,
            w.LogoAssetId,
            w.Position.ToString(),
            w.Opacity,
            w.HeightFraction,
            w.MarginFraction,
            w.ColorHex,
            w.BackplateOpacity);

    public static OutroResponse? ToResponse(this OutroSettings? o) =>
        o is null ? null : new OutroResponse(
            o.Kind.ToString(),
            o.AssetId,
            o.DurationSeconds,
            o.Transition.ToString(),
            o.TransitionDurationFrames,
            o.QrAssetId, o.Headline, o.Subtext, o.BackgroundHex, o.TextHex,
            o.HeadlineSecondary, o.SubtextSecondary);

    public static CharacterVoiceCommand ToCommand(this CharacterVoiceRequest voice) => new()
    {
        Enabled = voice.Enabled,
        Preset = voice.Preset,
        PitchSemitones = voice.PitchSemitones,
        SizeSemitones = voice.SizeSemitones,
        BassDecibels = voice.BassDecibels,
        TrebleDecibels = voice.TrebleDecibels,
        Drive = voice.Drive,
        Robot = voice.Robot,
        RobotHertz = voice.RobotHertz,
        Radio = voice.Radio,
        Echo = voice.Echo,
        Reverb = voice.Reverb,
        AiSampleAssetId = voice.AiSampleAssetId,
        AiSampleConsent = voice.AiSampleConsent
    };

    public static CharacterResponse ToResponse(this Character c) => new(
        c.Id, c.Name, c.Description, c.Aliases,
        c.Sprites.ClosedMouthAssetId, c.Sprites.OpenMouthAssetId, c.IsNarrator, c.SubtitleColorHex,
        new CharacterAppearanceResponse(
            c.Appearance.Age, c.Appearance.Gender, c.Appearance.Hair,
            c.Appearance.Clothes, c.Appearance.AdditionalDetails),
        c.Voice is { } v
            ? new CharacterVoiceResponse(
                v.Preset, v.PitchSemitones, v.BassDecibels, v.TrebleDecibels,
                v.Drive, v.Robot, v.RobotHertz, v.Radio, v.Echo, v.Reverb, v.SizeSemitones,
                v.AiSampleAssetId, v.AiSampleConsent)
            : null);

    public static AssetResponse ToResponse(this Asset a) => new(
        a.Id, a.Name, a.Kind.ToString(), a.MimeType, a.FileSizeBytes,
        a.Probe.Width, a.Probe.Height, a.Probe.HasAlpha, a.Probe.DurationSeconds,
        a.ReviewStatus.ToString(), a.FolderId);

    public static SceneResponse ToResponse(this Scene s, FrameRate rate) => new(
        s.Id, s.SceneNumber, s.Title, s.DurationFrames, s.Duration.ToSeconds(rate),
        s.BackgroundAssetId, s.Dialogue.Count,
        s.TransitionToNext.ToString(), s.Animation.Background.ToString(),
        new FrameCount(s.TransitionDurationFrames).ToSeconds(rate),
        s.Audio.AssetId, s.Audio.SliceStartSeconds.HasValue && s.Audio.SliceEndSeconds.HasValue,
        s.Characters.Count, s.Origin.ToString(), s.IsUserEdited);

    public static ScriptSummaryResponse ToSummary(this Script script) => new(
        script.Id, script.IngestId, script.Version, script.Status.ToString(),
        script.TimingSource.ToString(), script.HasSourceTimings,
        script.Segments.Count, script.Segments.Sum(seg => seg.Lines.Count),
        TotalSeconds(script), [.. script.Warnings], script.CreatedAt);

    /// <summary>
    /// The full script. Segments are capped rather than streamed: a 20,000-cue transcript
    /// would otherwise put megabytes through one response, and nobody reviews that in a
    /// table anyway.
    /// </summary>
    public static ScriptDetailResponse ToDetail(this Script script, int maxSegments) => new(
        script.Id, script.ProjectId, script.IngestId, script.Version, script.Status.ToString(),
        script.TimingSource.ToString(), script.HasSourceTimings,
        script.Segments.Count, script.Segments.Sum(seg => seg.Lines.Count),
        TotalSeconds(script),
        [.. script.Segments.OrderBy(seg => seg.Order).Take(maxSegments).Select(seg =>
            new ScriptSegmentResponse(
                seg.Order, seg.SegmentKey, seg.SuggestedTitle, seg.DominantSpeakerLabel,
                seg.SourceStart.TotalSeconds, seg.SourceEnd.TotalSeconds,
                seg.TimelineStart.TotalSeconds, seg.TimelineEnd.TotalSeconds,
                seg.BreakReason.ToString(),
                [.. seg.Lines.Select(line => new ScriptLineResponse(
                    line.SpeakerLabel, line.Text,
                    line.SourceStart.TotalSeconds, line.SourceEnd.TotalSeconds))]))],
        script.Segments.Count > maxSegments,
        [.. script.Warnings], script.CreatedAt);

    public static IngestSummaryResponse ToSummary(this TranscriptIngest ingest) => new(
        ingest.Id, ingest.SourceKind.ToString(), ingest.Status.ToString(), ingest.ScriptId,
        ingest.CueCount, ingest.TimingSource.ToString(),
        ingest.SourceTitle, ingest.CaptionLanguage, ingest.CaptionIsAutoGenerated,
        ingest.CaptionsOnly, ingest.RightsAttestation?.BasisCode,
        ingest.ToolName, ingest.ToolVersion,
        [.. ingest.Warnings], ingest.ErrorCode, ingest.CreatedAt, ingest.CompletedAt);

    private static double TotalSeconds(Script script) =>
        script.Segments.Count == 0
            ? 0
            : script.Segments.Max(seg => seg.TimelineEnd.TotalSeconds);

    public static SceneDetailResponse ToDetail(this Scene s, FrameRate rate) => new(
        s.Id, s.ProjectId, s.SceneNumber, s.Title, s.Description,
        s.DurationFrames, s.Duration.ToSeconds(rate),
        s.BackgroundAssetId,
        s.Animation.Background.ToString(), s.Animation.Intensity, s.Animation.Easing.ToString(),
        s.Animation.FadeIn.ToSeconds(rate), s.Animation.FadeOut.ToSeconds(rate),
        s.TransitionToNext.ToString(), new FrameCount(s.TransitionDurationFrames).ToSeconds(rate),
        s.Audio.AssetId, s.Audio.SliceStartSeconds, s.Audio.SliceEndSeconds,
        [.. s.Dialogue.Select(line => new DialogueLineResponse(
            line.Index, line.SpeakerCharacterId, line.SpeakerLabel, line.Text,
            new FrameCount(line.RelativeStartFrame).ToSeconds(rate),
            new FrameCount(line.RelativeEndFrame).ToSeconds(rate)))],
        [.. s.Characters.OrderBy(c => c.ZOrder).Select(c => new CharacterPlacementResponse(
            c.CharacterId, c.Anchor.ToString(), c.HeightFraction,
            c.OffsetXFraction, c.OffsetYFraction, c.FlipHorizontal, c.ZOrder,
            c.Entrance.ToString(), new FrameCount(c.EntranceDurationFrames).ToSeconds(rate),
            new FrameCount(c.PresenceStartFrame).ToSeconds(rate),
            new FrameCount(c.PresenceEndFrame).ToSeconds(rate)))],
        s.Origin.ToString(), s.IsUserEdited, s.UpdatedAt);

    /// <summary>
    /// A render job as the client sees it.
    /// <para>
    /// Lives here rather than in a controller because two endpoints hand back jobs - a
    /// project render and a clip stitch - and a second copy of this mapping is how the two
    /// screens start disagreeing about what "progress" means.
    /// </para>
    /// </summary>
    public static RenderJobResponse ToResponse(this RenderJob job)
    {
        var diag = job.Diagnostics is not null
            ? new RenderDiagnosticsResponse(
                job.Diagnostics.TotalSeconds,
                job.Diagnostics.PreparingSeconds,
                job.Diagnostics.EncodingSeconds,
                job.Diagnostics.MergingSeconds,
                job.Diagnostics.PublishingSeconds,
                job.Diagnostics.ItemsCount,
                job.Diagnostics.OutputDurationSeconds,
                job.Diagnostics.SpeedFactor,
                job.Diagnostics.CompletedAt,
                job.Diagnostics.HardwareEncoder)
            : null;

        return new RenderJobResponse(
            job.Id, job.ProjectId, job.Kind.ToString(), job.Status.ToString(),
            job.Progress, job.Message,
            job.CurrentStage.ToString(), job.ScenesTotal, job.ScenesDone,
            job.ErrorCode, job.ErrorMessage, job.Warnings,
            job.OutputStorageKey is not null,
            job.OutputDurationFrames.HasValue
                ? new FrameCount(job.OutputDurationFrames.Value).ToSeconds(FrameRate.Fps30)
                : null,
            job.CreatedAt, job.CompletedAt,
            job.Width, job.Height, job.TargetFormat,
            diag,
            job.Timeline is { Entries.Count: > 0 });
    }

    /// <summary>One video or image clip, with the facts a running order is laid out from.</summary>
    public static ClipResponse ToClipResponse(this Asset a) => new(
        a.Id, a.Name, a.FileSizeBytes,
        a.Probe.DurationSeconds ?? (a.Kind == AssetKind.Image ? 5.0 : null),
        a.Probe.Width, a.Probe.Height,
        !string.IsNullOrEmpty(a.Probe.AudioCodec),
        // Renders publish under renders/ and are saved back as assets in the Exports folder.
        a.StorageKey.StartsWith("renders/", StringComparison.Ordinal));

    public static ClipOrderResponse ToResponse(this ClipOrderResult result) => new(
        result.AssetIds,
        [.. result.Lines.Select(l =>
            new ClipOrderLineResponse(l.Number, l.Text, l.AssetId, l.Match.ToString()))],
        result.AppendedAssetIds,
        result.IsExact);
}

public static class StorageMappings
{
    private const double BytesPerGb = 1024d * 1024 * 1024;

    public static StorageSummaryResponse ToSummary(this AnimStudio.Application.Abstractions.Storage.StorageUsage usage, double? quotaGb)
    {
        var (capacity, source) = quotaGb is > 0
            ? ((long?)(quotaGb.Value * BytesPerGb), "quota")
            : usage.DiskTotalBytes is { } disk ? (disk, "disk") : ((long?)null, "none");

        return new StorageSummaryResponse(
            usage.Provider, usage.IsMeasurable, usage.UsedBytes, capacity, source, usage.MeasuredAt);
    }

    public static StorageDetailResponse ToDetail(this AnimStudio.Application.Abstractions.Storage.StorageUsage usage, double? quotaGb) =>
        new(usage.ToSummary(quotaGb), quotaGb, usage.FileCount, usage.DiskTotalBytes, usage.DiskFreeBytes,
            usage.Folders.Select(f => new StorageFolderResponse(f.Name, f.Bytes, f.Files)).ToList());
}
