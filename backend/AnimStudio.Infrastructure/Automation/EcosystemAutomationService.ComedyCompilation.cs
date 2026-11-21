using System.Diagnostics;
using System.Globalization;
using System.Text;
using System.Text.Json;
using AnimStudio.Application.Automation;
using AnimStudio.Application.Common;
using AnimStudio.Application.Rendering;
using AnimStudio.Application.Songs;
using AnimStudio.Domain.Automation;
using AnimStudio.Domain.Jobs;
using AnimStudio.Domain.Projects;
using AnimStudio.Domain.Publishing;
using AnimStudio.Domain.Rendering;
using AnimStudio.Domain.Stories;
using Microsoft.Extensions.Logging;

namespace AnimStudio.Infrastructure.Automation;

public sealed record CreateComedyStudioPostDto(
    string Title,
    string? ScriptOrIdeas = null,
    string AudienceTrack = "local",
    string Language = "hi",
    AnimStudio.Domain.Stories.ComedyToneStyle ComedyStyle = AnimStudio.Domain.Stories.ComedyToneStyle.Auto,
    AutomationVideoFormat Format = AutomationVideoFormat.Vertical,
    AutomationNarrativeMode NarrativeMode = AutomationNarrativeMode.ShortReel,
    AutomationVisualEngine VisualEngine = AutomationVisualEngine.Procedural3D,
    int TargetSeconds = 30,
    string? SpeakerAName = null,
    string? SpeakerBName = null,
    string? SubtitlePreset = null,
    bool EnableCharacterDialogue = true,
    bool IncludeMidMemes = true,
    bool IncludeBackgroundMusic = true,
    string? BackgroundTemplateAssetId = null,
    AutomationBackdropMotion BackgroundMotion = AutomationBackdropMotion.Still,
    string? LocationPrompt = null,
    string? AttachedSongId = null,
    string? TargetChannelId = null,
    IReadOnlyList<string>? AttachedAssetIds = null,
    string RenderAction = "draft");

public sealed record DualComedyBootstrapResult(
    IReadOnlyList<AutomationRule> Rules,
    int CreatedCount);

public sealed record CompileComedyRequestDto(
    IReadOnlyList<string> PostIds,
    string? Title = null,
    int MaxSeconds = 180,
    string? TargetChannelId = null);

public sealed record ComedyCompilationResult(
    AutomationPost Post,
    string RenderJobId,
    double DurationSeconds,
    int ClipCount,
    IReadOnlyList<string> Chapters);

public sealed partial class EcosystemAutomationService
{
    internal sealed class TempFileLease(string? path) : IDisposable
    {
        public string? Path { get; } = path;

        public void Dispose()
        {
            if (string.IsNullOrWhiteSpace(Path)) return;
            try
            {
                if (File.Exists(Path)) File.Delete(Path);
            }
            catch
            {
                // best effort
            }
        }
    }

    private async Task<AnimStudio.Infrastructure.Publishing.YouTubeConnectionStatus?> ResolveBestComedyConnectionAsync(
        string userId,
        IReadOnlyList<AnimStudio.Infrastructure.Publishing.YouTubeConnectionStatus> connected,
        bool isInternational,
        CancellationToken ct)
    {
        if (connected.Count == 0) return null;
        var explicitComedyIds = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        if (aiSettingsRepo is not null)
        {
            var settings = await aiSettingsRepo.GetAsync(ct).ConfigureAwait(false);
            foreach (var bc in settings?.Channels ?? [])
            {
                var ytId = bc.Publishing?.YouTubeChannelId;
                var ytHandle = bc.Publishing?.YouTubeChannelHandle;
                if (!bc.IsComedyChannel && !ComedyChannelMatcher.IsComedyChannelHint(bc.Name, ytHandle))
                    continue;
                if (!string.IsNullOrWhiteSpace(ytId)) explicitComedyIds.Add(ytId.Trim());
                if (!string.IsNullOrWhiteSpace(ytHandle)) explicitComedyIds.Add(ytHandle.Trim().TrimStart('@'));
            }
        }

        return ComedyChannelMatcher.PickBestComedyChannel(
            connected,
            c =>
            {
                var handleNorm = c.ChannelHandle?.Trim().TrimStart('@') ?? string.Empty;
                var isExplicit = explicitComedyIds.Contains(c.ChannelId)
                    || (!string.IsNullOrEmpty(handleNorm) && explicitComedyIds.Contains(handleNorm));
                return (c.ChannelHandle, c.ChannelTitle, isExplicit);
            },
            isInternational);
    }

    private async Task<AutomationRule> BuildFunnyComedyStarterRuleAsync(
        string userId,
        int sortOrder,
        (string ChannelId, string Title, string? Handle)? fallbackChannel,
        AutomationWorkspaceConfig settings,
        DateTime now,
        CancellationToken ct)
    {
        var connected = await connections.ListAsync(userId, ct).ConfigureAwait(false);
        var matched = await ResolveBestComedyConnectionAsync(userId, connected, isInternational: false, ct).ConfigureAwait(false);
        var comedyChannel = matched is not null
            ? (matched.ChannelId, matched.ChannelTitle, matched.ChannelHandle)
            : fallbackChannel;

        var rule = BuildStarterRule(
            userId,
            sortOrder,
            "Funny 3D Comedy Shorts (@KESHAV-ANIM-FF)",
            "Fast YouTube-tuned Khadi Bhasha & Tu-Tadak Indian comedy skits with mid-video reaction memes and twist punchlines.",
            AutomationSourceType.FunnyComedy,
            comedyChannel,
            null,
            "21:00",
            settings,
            ["studio", "pratiyogita", "social"],
            "23",
            now);

        rule.TargetSeconds = 25;
        rule.Language = "hi";
        rule.EnableCharacterDialogue = true;
        rule.SpeakerAName = "पप्पू भैया";
        rule.SpeakerBName = "बबलू यार";
        rule.NarrativeMode = AutomationNarrativeMode.ShortReel;
        rule.SubtitlePreset = "karaoke-pulse";
        rule.ComedyStyle = AnimStudio.Domain.Stories.ComedyToneStyle.Auto;
        rule.AutoInsertMemes = true;
        return rule;
    }

    public async Task<DualComedyBootstrapResult> BootstrapDualComedyPipelinesAsync(
        string userId,
        CancellationToken ct)
    {
        var settings = await GetWorkspaceConfigAsync(ct).ConfigureAwait(false);
        var existingRules = await repository.ListRulesAsync(userId, ct).ConfigureAwait(false);
        var connected = await connections.ListAsync(userId, ct).ConfigureAwait(false);
        var now = UtcNow;
        var nextOrder = existingRules.Count > 0 ? existingRules.Max(r => r.SortOrder) + 1 : 6;
        var resultRules = existingRules.Where(r => r.SourceType == AutomationSourceType.FunnyComedy).ToList();
        var created = 0;

        var hasLocal = resultRules.Any(r =>
            !string.Equals(r.Language, "en", StringComparison.OrdinalIgnoreCase)
            || ComedyChannelMatcher.IsComedyChannelHint(r.TargetChannelHandle, r.Name)
               && !ComedyChannelMatcher.IsInternationalComedyHint(r.Name));
        if (!hasLocal)
        {
            var localMatch = await ResolveBestComedyConnectionAsync(userId, connected, isInternational: false, ct).ConfigureAwait(false);
            var localTuple = localMatch is null ? ((string, string, string?)?)null : (localMatch.ChannelId, localMatch.ChannelTitle, localMatch.ChannelHandle);
            var localRule = await BuildFunnyComedyStarterRuleAsync(userId, nextOrder++, localTuple, settings, now, ct).ConfigureAwait(false);
            localRule.FunnelWebsiteKeys = ["hub", "studio", "pratiyogita"];
            localRule.VisualEngine = AutomationVisualEngine.Procedural3D;
            await repository.UpsertRuleAsync(localRule, ct).ConfigureAwait(false);
            resultRules.Add(localRule);
            created++;
        }

        var hasInternational = resultRules.Any(r =>
            string.Equals(r.Language, "en", StringComparison.OrdinalIgnoreCase)
            || r.ComedyStyle is AnimStudio.Domain.Stories.ComedyToneStyle.GlobalSlapstick or AnimStudio.Domain.Stories.ComedyToneStyle.TankSeries);
        if (!hasInternational)
        {
            var intlMatch = await ResolveBestComedyConnectionAsync(userId, connected, isInternational: true, ct).ConfigureAwait(false);
            var intlTuple = intlMatch is null ? ((string, string, string?)?)null : (intlMatch.ChannelId, intlMatch.ChannelTitle, intlMatch.ChannelHandle);
            var intlRule = BuildStarterRule(
                userId,
                nextOrder,
                "International 3D Comedy Loop (Global English)",
                "Worldwide visual 3D slapstick loops, doorway gags & Cartoon Tank episodes crafted for global audiences.",
                AutomationSourceType.FunnyComedy,
                intlTuple,
                null,
                "22:00",
                settings,
                ["hub", "studio", "social"],
                "23",
                now);
            intlRule.Language = "en";
            intlRule.TargetSeconds = 30;
            intlRule.EnableCharacterDialogue = true;
            intlRule.SpeakerAName = "Woody Buddy";
            intlRule.SpeakerBName = "Cuppy Mug";
            intlRule.NarrativeMode = AutomationNarrativeMode.ShortReel;
            intlRule.SubtitlePreset = "karaoke-pulse";
            intlRule.ComedyStyle = AnimStudio.Domain.Stories.ComedyToneStyle.GlobalSlapstick;
            intlRule.VisualEngine = AutomationVisualEngine.Procedural3D;
            intlRule.AutoInsertMemes = true;
            await repository.UpsertRuleAsync(intlRule, ct).ConfigureAwait(false);
            resultRules.Add(intlRule);
            created++;
        }

        return new DualComedyBootstrapResult(resultRules, created);
    }

    public async Task<AutomationPost> CreateComedyStudioPostAsync(
        string userId,
        CreateComedyStudioPostDto request,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Title) || request.Title.Trim().Length < 3)
            throw EditingException.Invalid("title", "Provide a comedy title of at least 3 characters.");

        var settings = await GetWorkspaceConfigAsync(ct).ConfigureAwait(false);
        var ecosystem = await ecosystemProvider.GetAsync(forceRefresh: false, ct).ConfigureAwait(false);
        var connected = await connections.ListAsync(userId, ct).ConfigureAwait(false);
        var now = UtcNow;
        var dateKey = ResolveDateKey(null, settings.DefaultTimeZone);

        var isIntl = string.Equals(request.AudienceTrack, "international", StringComparison.OrdinalIgnoreCase)
            || string.Equals(request.Language, "en", StringComparison.OrdinalIgnoreCase)
            || request.ComedyStyle is AnimStudio.Domain.Stories.ComedyToneStyle.GlobalSlapstick
                or AnimStudio.Domain.Stories.ComedyToneStyle.TankSeries;
        var effectiveLang = isIntl ? "en" : "hi";
        var effectiveTone = request.ComedyStyle == AnimStudio.Domain.Stories.ComedyToneStyle.Auto && isIntl
            ? AnimStudio.Domain.Stories.ComedyToneStyle.GlobalSlapstick
            : request.ComedyStyle;

        var chosenChannel = !string.IsNullOrWhiteSpace(request.TargetChannelId)
            ? connected.FirstOrDefault(c => string.Equals(c.ChannelId, request.TargetChannelId.Trim(), StringComparison.Ordinal))
            : await ResolveBestComedyConnectionAsync(userId, connected, isIntl, ct).ConfigureAwait(false);
        chosenChannel ??= await ResolveBestComedyConnectionAsync(userId, connected, isIntl, ct).ConfigureAwait(false);

        var existingComedyRules = (await repository.ListRulesAsync(userId, ct).ConfigureAwait(false))
            .Where(r => r.SourceType == AutomationSourceType.FunnyComedy)
            .ToList();
        var matchingRule = existingComedyRules.FirstOrDefault(r =>
            string.Equals(r.Language, effectiveLang, StringComparison.OrdinalIgnoreCase))
            ?? existingComedyRules.FirstOrDefault();

        var channelTuple = chosenChannel is null
            ? ((string, string, string?)?)null
            : (chosenChannel.ChannelId, chosenChannel.ChannelTitle, chosenChannel.ChannelHandle);

        var tempRule = BuildStarterRule(
            userId,
            99,
            isIntl ? "International 3D Comedy Studio" : "Local Desi 3D Comedy Studio",
            "Created directly from Comedy Studio workspace.",
            AutomationSourceType.FunnyComedy,
            channelTuple,
            null,
            isIntl ? "22:00" : "21:00",
            settings,
            ["hub", "studio", "pratiyogita", "social"],
            "23",
            now);
        tempRule.Id = matchingRule?.Id ?? tempRule.Id;
        tempRule.Language = effectiveLang;
        tempRule.ComedyStyle = effectiveTone;
        tempRule.VideoFormat = request.Format;
        tempRule.NarrativeMode = request.NarrativeMode;
        tempRule.VisualEngine = request.VisualEngine;
        tempRule.TargetSeconds = Math.Clamp(request.TargetSeconds > 0 ? request.TargetSeconds : 30, 10, MaxSecondsFor(request.Format));
        tempRule.EnableCharacterDialogue = request.EnableCharacterDialogue;
        tempRule.SpeakerAName = string.IsNullOrWhiteSpace(request.SpeakerAName) ? (isIntl ? "Woody Buddy" : "पप्पू भैया") : request.SpeakerAName.Trim();
        tempRule.SpeakerBName = string.IsNullOrWhiteSpace(request.SpeakerBName) ? (isIntl ? "Cuppy Mug" : "बबलू यार") : request.SpeakerBName.Trim();
        tempRule.SubtitlePreset = NormalizeSubtitlePreset(request.SubtitlePreset);
        tempRule.AutoInsertMemes = request.IncludeMidMemes;
        tempRule.CustomTopicPrompt = request.Title.Trim();

        var signals = await signalsClient.FetchAsync(dateKey, settings.DefaultLocation,
            settings.PanchangApiBaseUrl, settings.SocialApiBaseUrl, settings.PratiyogitaApiBaseUrl, ct).ConfigureAwait(false);
        var composed = AutomationContentComposer.ComposeForRule(tempRule, signals, ecosystem).First();

        var customTitle = request.Title.Trim();
        var sanitizedPkg = AnimStudio.Application.Publishing.YouTubePolicyComplianceSanitizer.Sanitize(
            rawTitle: customTitle,
            rawDescription: composed.Description,
            rawTags: composed.Tags,
            rawPinnedComment: composed.PinnedComment,
            fallbackTopicTitle: composed.SourceTitle,
            primaryDestinationUrl: composed.PrimaryDestinationUrl,
            requestedMadeForKids: false,
            isShort: request.Format == AutomationVideoFormat.Vertical,
            language: effectiveLang);
        var safeTitle = sanitizedPkg.Title;
        var customScript = string.IsNullOrWhiteSpace(request.ScriptOrIdeas)
            ? composed.Script
            : request.ScriptOrIdeas.Trim();

        var stage = AutomationStageScript.Normalize(new AutomationStageSettings
        {
            BackgroundTemplateAssetId = request.BackgroundTemplateAssetId,
            BackgroundMotion = request.BackgroundMotion,
            LocationPrompt = request.LocationPrompt,
            IncludeBackgroundMusic = request.IncludeBackgroundMusic,
            AttachedSongId = request.AttachedSongId,
            FollowScriptExactly = true,
        });
        if (stage.BackgroundTemplateAssetId is { } bgId && !await IsOwnedImageAsync(userId, bgId, ct).ConfigureAwait(false))
            throw EditingException.Invalid("template-not-found", "Selected background picture was not found in your Studio Storage.");

        var post = new AutomationPost
        {
            Id = $"ap_cmd_{Guid.NewGuid():n}"[..24],
            UserId = userId,
            RuleId = tempRule.Id,
            RuleName = tempRule.Name,
            SourceType = AutomationSourceType.FunnyComedy,
            DateKey = dateKey,
            Fingerprint = $"comedy-studio:{now.Ticks}:{Guid.NewGuid():n}"[..36],
            SourceItemKey = composed.SourceItemKey,
            SourceTitle = safeTitle,
            SourceSummary = composed.SourceSummary,
            TargetChannelId = chosenChannel?.ChannelId,
            TargetChannelHandle = chosenChannel?.ChannelHandle,
            TargetChannelTitle = chosenChannel?.ChannelTitle,
            Title = safeTitle,
            Script = customScript,
            AiVideoPrompt = composed.AiVideoPrompt,
            AiThumbnailPrompt = composed.AiThumbnailPrompt,
            Description = sanitizedPkg.Description,
            PinnedComment = sanitizedPkg.PinnedComment,
            Tags = [.. sanitizedPkg.Tags],
            CategoryId = "23",
            Privacy = "public",
            MadeForKids = false,
            Format = request.Format,
            Language = effectiveLang,
            PrimaryDestinationUrl = composed.PrimaryDestinationUrl,
            TrackedFunnelUrls = [.. composed.TrackedLinks],
            HeaderBannerText = composed.HeaderBannerText,
            EventColorHex = composed.EventColorHex,
            EnableCharacterDialogue = request.EnableCharacterDialogue,
            SpeakerAName = tempRule.SpeakerAName,
            SpeakerBName = tempRule.SpeakerBName,
            SubtitlePreset = tempRule.SubtitlePreset,
            VisualEngine = request.VisualEngine,
            NarrativeMode = request.NarrativeMode,
            ComedyStyle = effectiveTone,
            AutoInsertMemes = request.IncludeMidMemes,
            TargetSeconds = tempRule.TargetSeconds,
            AttachedAssetIds = request.AttachedAssetIds is { Count: > 0 } ? [.. request.AttachedAssetIds.Take(40)] : [],
            Stage = stage,
            Status = AutomationPostStatus.PreparedPreview,
            ScheduledAtUtc = ComputeScheduledUtc(dateKey, tempRule.PreferredPublishTime, settings.DefaultTimeZone),
            CreatedAtUtc = now,
            UpdatedAtUtc = now,
        };

        await repository.UpsertPostAsync(post, ct).ConfigureAwait(false);
        post = await AutoFillMissingDetailsAsync(userId, post.Id, ct).ConfigureAwait(false);

        if (string.Equals(request.RenderAction, "render3d", StringComparison.OrdinalIgnoreCase))
        {
            return await GenerateAnimatedVideoAsync(
                userId,
                post.Id,
                ProceduralSceneTheme.ComedyStage3D,
                tempRule.TargetSeconds,
                "720p",
                ct,
                format: request.Format.ToString(),
                enableCharacterDialogue: request.EnableCharacterDialogue,
                subtitlePreset: tempRule.SubtitlePreset,
                speakerAName: tempRule.SpeakerAName,
                speakerBName: tempRule.SpeakerBName,
                narrativeMode: request.NarrativeMode,
                attachedAssetIds: post.AttachedAssetIds).ConfigureAwait(false);
        }

        if (string.Equals(request.RenderAction, "renderAi", StringComparison.OrdinalIgnoreCase))
        {
            return await GenerateAiVideoAsync(
                userId,
                post.Id,
                ct,
                visualEngine: request.VisualEngine == AutomationVisualEngine.Auto ? AutomationVisualEngine.AiRealisticStory : request.VisualEngine,
                narrativeMode: request.NarrativeMode,
                targetSeconds: tempRule.TargetSeconds,
                attachedAssetIds: post.AttachedAssetIds,
                useTemplateScript: false).ConfigureAwait(false);
        }

        return post;
    }

    private async Task<TempFileLease> MaterializeStageSongLeaseAsync(
        string userId,
        string? attachedSongId,
        CancellationToken ct)
    {
        if (songLibrary is null || string.IsNullOrWhiteSpace(attachedSongId) || !SongLibrary.IsSongId(attachedSongId))
            return new TempFileLease(null);

        try
        {
            var opened = await songLibrary.OpenAudioAsync(userId, attachedSongId.Trim(), ct).ConfigureAwait(false);
            if (opened is null) return new TempFileLease(null);

            await using var content = opened.Value.Content;
            var ext = string.IsNullOrWhiteSpace(opened.Value.Song.MimeType) ? ".wav" :
                opened.Value.Song.MimeType.Contains("mpeg", StringComparison.OrdinalIgnoreCase) ? ".mp3" : ".wav";
            var tempPath = Path.Combine(Path.GetTempPath(), $"animstudio-stage-song-{Guid.NewGuid():n}{ext}");
            await using (var fs = File.Create(tempPath))
            {
                await content.CopyToAsync(fs, ct).ConfigureAwait(false);
            }
            return new TempFileLease(tempPath);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning(ex, "Could not load attached song {SongId} for 3D automation audio mix; using preset BGM.", attachedSongId);
            return new TempFileLease(null);
        }
    }

    public async Task<ComedyCompilationResult> BuildComedyCompilationAsync(
        string userId,
        CompileComedyRequestDto request,
        CancellationToken ct)
    {
        if (request?.PostIds is not { Count: >= 2 })
            throw EditingException.Invalid("postIds", "Select at least 2 rendered comedy posts to compile.");

        var maxTotalSeconds = Math.Clamp(request.MaxSeconds, 30, 180);
        var dedupIds = request.PostIds
            .Where(id => !string.IsNullOrWhiteSpace(id))
            .Select(id => id.Trim())
            .Distinct(StringComparer.Ordinal)
            .Take(12)
            .ToList();

        var selectedPosts = new List<(AutomationPost Post, RenderJob Job)>();
        foreach (var postId in dedupIds)
        {
            var post = await LoadOwnedPostAsync(userId, postId, ct).ConfigureAwait(false);
            var job = await ResolveUsableRenderJobAsync(userId, post, ct).ConfigureAwait(false);
            if (job is null || string.IsNullOrWhiteSpace(job.OutputStorageKey))
                continue;
            selectedPosts.Add((post, job));
        }

        if (selectedPosts.Count < 2)
            throw EditingException.Invalid("postIds", "At least 2 selected posts must already have a rendered MP4 video attached.");

        var workDir = Path.Combine(Path.GetTempPath(), $"animstudio-comedy-comp-{Guid.NewGuid():n}");
        Directory.CreateDirectory(workDir);

        try
        {
            var ffprobeExe = string.IsNullOrWhiteSpace(ffmpegOptions?.Value.FfprobePath) ? "ffprobe" : ffmpegOptions!.Value.FfprobePath;
            var ffmpegExe = string.IsNullOrWhiteSpace(ffmpegOptions?.Value.FfmpegPath) ? "ffmpeg" : ffmpegOptions!.Value.FfmpegPath;

            var included = new List<(AutomationPost Post, string Path, double DurationSec, int Width, int Height, bool HasAudio)>();
            double totalDuration = 0;

            foreach (var (post, job) in selectedPosts)
            {
                await using var stream = await objectStore.OpenAsync(job.OutputStorageKey!, ct).ConfigureAwait(false);
                if (stream is null) continue;

                var clipPath = Path.Combine(workDir, $"clip_{included.Count:D2}.mp4");
                await using (var fs = File.Create(clipPath))
                {
                    await stream.CopyToAsync(fs, ct).ConfigureAwait(false);
                }

                var probe = await ProbeClipAsync(ffprobeExe, clipPath, ct).ConfigureAwait(false);
                var clipDur = probe.DurationSec > 0.5 ? probe.DurationSec : Math.Max(5.0, (job.OutputDurationFrames ?? 300) / 30.0);

                if (included.Count >= 2 && totalDuration + clipDur > maxTotalSeconds)
                    break;

                included.Add((post, clipPath, clipDur,
                    probe.Width > 0 ? probe.Width : (job.Width ?? 1080),
                    probe.Height > 0 ? probe.Height : (job.Height ?? 1920),
                    probe.HasAudio));
                totalDuration += clipDur;

                if (totalDuration >= maxTotalSeconds)
                    break;
            }

            if (included.Count < 2)
                throw EditingException.Invalid("postIds", "Could not download at least 2 rendered MP4 clips for compilation.");

            var first = included[0];
            var outW = first.Width >= first.Height ? 1920 : 1080;
            var outH = first.Width >= first.Height ? 1080 : 1920;
            var outPath = Path.Combine(workDir, "compiled_comedy.mp4");

            var filter = new StringBuilder();
            var args = new List<string> { "-hide_banner", "-loglevel", "error", "-y" };

            for (var i = 0; i < included.Count; i++)
            {
                args.Add("-i");
                args.Add(included[i].Path);

                filter.Append(CultureInfo.InvariantCulture,
                    $"[{i}:v]scale={outW}:{outH}:force_original_aspect_ratio=decrease,pad={outW}:{outH}:(ow-iw)/2:(oh-ih)/2:black,setsar=1,fps=30,format=yuv420p[v{i}];");

                if (included[i].HasAudio)
                {
                    filter.Append(CultureInfo.InvariantCulture,
                        $"[{i}:a]aformat=sample_rates=48000:channel_layouts=stereo,asetpts=PTS-STARTPTS[a{i}];");
                }
                else
                {
                    filter.Append(CultureInfo.InvariantCulture,
                        $"aevalsrc=0:channel_layout=stereo:sample_rate=48000:d={included[i].DurationSec.ToString("0.###", CultureInfo.InvariantCulture)}[a{i}];");
                }
            }

            for (var i = 0; i < included.Count; i++)
                filter.Append(CultureInfo.InvariantCulture, $"[v{i}][a{i}]");

            filter.Append(CultureInfo.InvariantCulture,
                $"concat=n={included.Count}:v=1:a=1[vcat][acat];[acat]loudnorm=I=-16:TP=-1.5:LRA=11[aout]");

            args.AddRange([
                "-filter_complex", filter.ToString(),
                "-map", "[vcat]",
                "-map", "[aout]",
                "-c:v", "libx264",
                "-preset", "veryfast",
                "-crf", "20",
                "-c:a", "aac",
                "-b:a", "192k",
                "-movflags", "+faststart",
                "-t", maxTotalSeconds.ToString(CultureInfo.InvariantCulture),
                outPath
            ]);

            await RunFfmpegProcessAsync(ffmpegExe, args, TimeSpan.FromMinutes(10), ct).ConfigureAwait(false);
            if (!File.Exists(outPath))
                throw new InvalidOperationException("Comedy compilation FFmpeg encode did not produce an MP4 output.");

            var finalProbe = await ProbeClipAsync(ffprobeExe, outPath, ct).ConfigureAwait(false);
            var finalDuration = finalProbe.DurationSec > 0 ? Math.Min(maxTotalSeconds, finalProbe.DurationSec) : Math.Min(maxTotalSeconds, totalDuration);

            var chapters = new List<string>(included.Count);
            double cursor = 0;
            foreach (var item in included)
            {
                var ts = TimeSpan.FromSeconds(cursor);
                var label = item.Post.Title.Length > 55 ? item.Post.Title[..55].TrimEnd() + "..." : item.Post.Title;
                chapters.Add($"{(int)ts.TotalMinutes:D2}:{ts.Seconds:D2} {label}");
                cursor += item.DurationSec;
            }

            var jobId = Guid.NewGuid().ToString("N");
            var storageKey = $"renders/{jobId}.mp4";
            var bytes = await File.ReadAllBytesAsync(outPath, ct).ConfigureAwait(false);
            await using (var ms = new MemoryStream(bytes, writable: false))
                await objectStore.SaveAsync(storageKey, ms, "video/mp4", ct).ConfigureAwait(false);

            var userProjects = await projects.ListAsync(userId, ct).ConfigureAwait(false);
            var projectId = userProjects.FirstOrDefault()?.Id ?? string.Empty;
            var now = UtcNow;
            var customTitle = string.IsNullOrWhiteSpace(request.Title)
                ? $"Best of Comedy Shorts 😂 ({included.Count} Clips • {(int)Math.Ceiling(finalDuration)}s)"
                : request.Title.Trim();

            await renderJobs.InsertAsync(new RenderJob
            {
                Id = jobId,
                ProjectId = projectId,
                UserId = userId,
                Name = customTitle.Length > 90 ? customTitle[..90].TrimEnd() : customTitle,
                Kind = RenderJobKind.ProceduralAnimated,
                Status = RenderJobStatus.Completed,
                Progress = 100,
                Message = $"3D Comedy Compilation ({included.Count} clips, {finalDuration:0.#}s)",
                CurrentStage = RenderStage.Completed,
                ScenesTotal = included.Count,
                ScenesDone = included.Count,
                OutputStorageKey = storageKey,
                OutputSizeBytes = bytes.Length,
                OutputDurationFrames = (int)Math.Round(finalDuration * 30.0),
                Width = outW,
                Height = outH,
                TargetFormat = outH > outW ? "Short" : "Video",
                CreatedAt = now,
                StartedAt = now,
                CompletedAt = now
            }, ct).ConfigureAwait(false);

            var targetChannel = string.IsNullOrWhiteSpace(request.TargetChannelId)
                ? null
                : await connections.GetAsync(userId, request.TargetChannelId.Trim(), ct).ConfigureAwait(false);

            var anchor = included[0].Post;
            var chapterBlock = string.Join('\n', chapters);
            var sanitizedComp = AnimStudio.Application.Publishing.YouTubePolicyComplianceSanitizer.Sanitize(
                rawTitle: customTitle,
                rawDescription: $"😂 Non-stop 3D comedy punchlines compilation ({included.Count} skits under 3 minutes)!\n\nChapters:\n{chapterBlock}\n\n#ComedyShorts #KeshavAnimFF #Funny3D",
                rawTags: anchor.Tags.Count > 0 ? anchor.Tags : ["Comedy Shorts", "KESHAV-ANIM-FF", "Compilation"],
                rawPinnedComment: anchor.PinnedComment,
                fallbackTopicTitle: customTitle,
                primaryDestinationUrl: anchor.PrimaryDestinationUrl,
                requestedMadeForKids: false,
                isShort: anchor.Format == AutomationVideoFormat.Vertical,
                language: anchor.Language);

            var compiledPost = new AutomationPost
            {
                Id = $"ap_comp_{Guid.NewGuid():n}"[..24],
                UserId = userId,
                RuleId = anchor.RuleId,
                RuleName = "Comedy Best-Of Compilation (<3m)",
                DateKey = anchor.DateKey,
                SourceType = AutomationSourceType.FunnyComedy,
                Language = anchor.Language,
                Format = anchor.Format,
                NarrativeMode = AutomationNarrativeMode.FullStory,
                TargetChannelId = targetChannel?.ChannelId ?? anchor.TargetChannelId,
                TargetChannelTitle = targetChannel?.ChannelTitle ?? anchor.TargetChannelTitle,
                TargetChannelHandle = targetChannel?.ChannelHandle ?? anchor.TargetChannelHandle,
                Privacy = anchor.Privacy,
                CategoryId = "23",
                MadeForKids = false,
                Title = sanitizedComp.Title,
                Description = sanitizedComp.Description,
                PinnedComment = sanitizedComp.PinnedComment,
                Script = string.Join("\n\n", included.Select((c, idx) => $"[Clip {idx + 1}: {c.Post.Title}]\n{c.Post.Script}")),
                AiVideoPrompt = anchor.AiVideoPrompt,
                AiThumbnailPrompt = anchor.AiThumbnailPrompt,
                Tags = [.. sanitizedComp.Tags],
                PrimaryDestinationUrl = anchor.PrimaryDestinationUrl,
                TrackedFunnelUrls = anchor.TrackedFunnelUrls,
                AttachedRenderJobId = jobId,
                Status = AutomationPostStatus.VideoReadyForReview,
                StoryStageSummary = $"Compiled {included.Count} comedy clips ({finalDuration:0.#}s) ready to preview & publish.",
                Fingerprint = $"comedy-comp:{string.Join(':', included.Select(c => c.Post.Id))}:{now.Ticks}",
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            };

            await repository.UpsertPostAsync(compiledPost, ct).ConfigureAwait(false);
            return new ComedyCompilationResult(compiledPost, jobId, Math.Round(finalDuration, 1), included.Count, chapters);
        }
        finally
        {
            try { Directory.Delete(workDir, recursive: true); } catch { }
        }
    }

    private sealed record ClipProbeInfo(double DurationSec, int Width, int Height, bool HasAudio);

    private static async Task<ClipProbeInfo> ProbeClipAsync(string ffprobeExe, string path, CancellationToken ct)
    {
        try
        {
            var psi = new ProcessStartInfo
            {
                FileName = ffprobeExe,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };
            foreach (var arg in new[] { "-v", "quiet", "-print_format", "json", "-show_format", "-show_streams", path })
                psi.ArgumentList.Add(arg);

            using var proc = Process.Start(psi);
            if (proc is null) return new ClipProbeInfo(0, 0, 0, true);
            using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(ct);
            timeoutCts.CancelAfter(TimeSpan.FromSeconds(15));
            var json = await proc.StandardOutput.ReadToEndAsync(timeoutCts.Token).ConfigureAwait(false);
            await proc.WaitForExitAsync(timeoutCts.Token).ConfigureAwait(false);
            if (proc.ExitCode != 0 || string.IsNullOrWhiteSpace(json)) return new ClipProbeInfo(0, 0, 0, true);

            using var doc = JsonDocument.Parse(json);
            double dur = 0;
            if (doc.RootElement.TryGetProperty("format", out var fmt)
                && fmt.TryGetProperty("duration", out var dEl)
                && double.TryParse(dEl.GetString(), NumberStyles.Float, CultureInfo.InvariantCulture, out var parsedDur))
            {
                dur = parsedDur;
            }

            int w = 0, h = 0;
            bool hasAudio = false;
            if (doc.RootElement.TryGetProperty("streams", out var streams) && streams.ValueKind == JsonValueKind.Array)
            {
                foreach (var st in streams.EnumerateArray())
                {
                    var codecType = st.TryGetProperty("codec_type", out var ctEl) ? ctEl.GetString() : null;
                    if (codecType == "video" && w == 0)
                    {
                        if (st.TryGetProperty("width", out var wEl) && wEl.TryGetInt32(out var pw)) w = pw;
                        if (st.TryGetProperty("height", out var hEl) && hEl.TryGetInt32(out var ph)) h = ph;
                    }
                    else if (codecType == "audio")
                    {
                        hasAudio = true;
                    }
                }
            }
            return new ClipProbeInfo(dur, w, h, hasAudio);
        }
        catch
        {
            return new ClipProbeInfo(0, 0, 0, true);
        }
    }

    private static async Task RunFfmpegProcessAsync(string ffmpegExe, IReadOnlyList<string> args, TimeSpan timeout, CancellationToken ct)
    {
        var psi = new ProcessStartInfo
        {
            FileName = ffmpegExe,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };
        foreach (var a in args) psi.ArgumentList.Add(a);

        using var proc = Process.Start(psi) ?? throw new InvalidOperationException("Could not start ffmpeg for compilation.");
        using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(ct);
        timeoutCts.CancelAfter(timeout);
        var errTask = proc.StandardError.ReadToEndAsync(timeoutCts.Token);
        _ = proc.StandardOutput.ReadToEndAsync(timeoutCts.Token);
        await proc.WaitForExitAsync(timeoutCts.Token).ConfigureAwait(false);
        var err = await errTask.ConfigureAwait(false);
        if (proc.ExitCode != 0)
            throw new InvalidOperationException($"FFmpeg compilation failed (exit {proc.ExitCode}): {(err.Length > 400 ? err[^400..] : err)}");
    }
}
