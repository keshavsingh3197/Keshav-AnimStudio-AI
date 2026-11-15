using System.Diagnostics;
using System.Globalization;
using System.Text;
using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Abstractions.Rendering;
using AnimStudio.Application.Abstractions.Storage;
using AnimStudio.Application.Ai;
using AnimStudio.Application.Rendering;
using AnimStudio.Domain.Errors;
using AnimStudio.Domain.Jobs;
using AnimStudio.Domain.Projects;
using AnimStudio.Domain.Rendering;
using AnimStudio.Domain.Scenes;
using AnimStudio.Infrastructure.Ffmpeg;
using AnimStudio.Infrastructure.Subtitles;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AnimStudio.Infrastructure.Rendering;

/// <summary>
/// Renders free, deterministic 2D/3D procedural animated MP4 videos directly on CPU by streaming
/// synthesized RGBA frames into FFmpeg alongside spoken multi-character/narrator TTS voices,
/// one-time cached clean BGM audio with sidechain ducking, and UTF-8 ASS subtitles, then
/// persists the finished video into <see cref="IObjectStore"/> and <see cref="IRenderJobRepository"/>.
/// </summary>
public sealed class ProceduralVideoGeneratorService(
    IOptions<FfmpegOptions> ffmpegOptions,
    IRenderCapabilities capabilities,
    IRenderWorkspaceFactory workspaces,
    ISubtitleWriter subtitleWriter,
    IObjectStore objectStore,
    IRenderJobRepository renderJobs,
    IProjectRepository projects,
    TimeProvider clock,
    ILogger<ProceduralVideoGeneratorService> logger,
    IAiExecutor? ai = null,
    IAiProviderRegistry? aiRegistry = null,
    ProceduralBgmCacheService? bgmCache = null) : IProceduralVideoGenerator
{
    private const string DefaultProjectName = "Procedural 3D Studio Renders";
    private const string TopCategoryStyleCharId = "top-category";
    private const string TopTitleStyleCharId = "top-header-title";
    private const string TitleStyleCharId = "title-hook";
    private const string SpeakerAStyleCharId = "speaker-a";
    private const string SpeakerBStyleCharId = "speaker-b";
    private const string BodyStyleCharId = "beat-body";
    private const string FooterStyleCharId = "footer-link";
    private static readonly TimeSpan EncodeTimeout = TimeSpan.FromMinutes(6);

    public async Task<ProceduralVideoResult> GenerateAsync(
        string userId,
        ProceduralVideoRequest request,
        CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(request);
        if (request.SaveAsRenderJob)
            ArgumentException.ThrowIfNullOrWhiteSpace(userId);

        if (!capabilities.IsAvailable)
        {
            throw new RenderException(
                RenderErrorCode.RendererUnavailable,
                capabilities.UnavailableReason ?? "Video rendering (FFmpeg) is not configured on this server.");
        }

        var title = string.IsNullOrWhiteSpace(request.Title) ? "AnimStudio 3D Motion" : request.Title.Trim();
        var durationSeconds = ProceduralVideoPlanner.ClampDuration(request.DurationSeconds);
        var fps = Math.Clamp(request.Fps <= 0 ? 24 : request.Fps, 12, 30);
        var (width, height, normalizedFormat) = ProceduralVideoPlanner.ResolveDimensions(request.Format, request.Resolution);
        var resolvedTheme = ProceduralVideoPlanner.InferTheme(request.Theme, title, request.Prompt, request.Script);
        var preset = ProceduralVideoPlanner.DescribeTheme(resolvedTheme);
        var palette = ProceduralEventPalette.Resolve(request.EventType, resolvedTheme);
        var dialoguePlan = DialogueScriptParser.ParsePlan(
            title,
            request.Script,
            request.Prompt,
            durationSeconds,
            request.EnableCharacterDialogue,
            request.SpeakerAName,
            request.SpeakerBName,
            request.EventType);

        var seed = StableSeed($"{title}|{resolvedTheme}|{palette.EventKey}|{normalizedFormat}");
        var swTotal = Stopwatch.StartNew();

        await using var workspace = await workspaces.CreateAsync($"proc3d-{Guid.NewGuid():n}", ct).ConfigureAwait(false);
        var outPath = workspace.Resolve("out/video.mp4");

        // 1. Optional spoken voiceover / 2-character dialogue via configured TTS provider
        float[]? speechEnvelope = null;
        var hasSpeech = false;
        string? voiceSummary = null;
        var speechResult = await ProceduralSpeechSynthesizer.TrySynthesizeAsync(
            request,
            dialoguePlan,
            workspace.Resolve("in"),
            userId,
            durationSeconds,
            ai,
            aiRegistry,
            ffmpegOptions.Value,
            logger,
            ct).ConfigureAwait(false);

        if (speechResult is not null && File.Exists(speechResult.SpeechWavPath))
        {
            hasSpeech = true;
            dialoguePlan = speechResult.UpdatedPlan;
            durationSeconds = speechResult.RecommendedDurationSeconds;
            speechEnvelope = ProceduralAudioSynthesizer.ComputeFrameEnvelope(
                speechResult.SpeechWavPath,
                durationSeconds * fps,
                fps);
            voiceSummary = $"{speechResult.ProviderId}:{string.Join('/', speechResult.VoicesUsed)}";
            logger.LogInformation(
                "Procedural 3D video speech synthesized via {Voices} ({Duration}s) for title '{Title}'.",
                voiceSummary, durationSeconds, title);
        }

        // 2. Clean stereo BGM bed (one-time cached reusable studio BGM preset when DI cache is wired, else warm pad)
        var hasBgm = false;
        string? bgmSource = null;
        if (request.IncludeAmbientAudio)
        {
            var bgmDst = workspace.Resolve("in/ambient.wav");
            if (bgmCache is not null)
            {
                var (cachedPath, src) = await bgmCache.EnsurePresetWavAsync(resolvedTheme, ct: ct).ConfigureAwait(false);
                if (File.Exists(cachedPath))
                {
                    Directory.CreateDirectory(Path.GetDirectoryName(bgmDst)!);
                    File.Copy(cachedPath, bgmDst, overwrite: true);
                    hasBgm = true;
                    bgmSource = src;
                }
            }

            if (!hasBgm)
            {
                await ProceduralAudioSynthesizer.WriteAmbientWavAsync(bgmDst, resolvedTheme, durationSeconds, ct).ConfigureAwait(false);
                hasBgm = true;
                bgmSource = "studio-pad-v2";
            }
        }

        // 3. Optional beat-synchronized ASS subtitle + top-header overlay (reuses ScriptFonts Devanagari resolution)
        var hasSubtitles = false;
        if (request.IncludeCaptions && capabilities.Supports(RenderFeature.BurnedSubtitles))
        {
            var assContent = BuildAssSubtitles(title, request, palette, dialoguePlan, width, height, fps, durationSeconds);
            await File.WriteAllTextAsync(workspace.Resolve("in/subs.ass"), assContent, new UTF8Encoding(false), ct)
                .ConfigureAwait(false);
            hasSubtitles = true;
        }

        // 4. Stream pure C# 3D procedural frames directly into FFmpeg stdin -> H.264 MP4
        var ffmpegExe = ffmpegOptions.Value.FfmpegPath;
        if (string.IsNullOrWhiteSpace(ffmpegExe)) ffmpegExe = "ffmpeg";

        var startInfo = new ProcessStartInfo
        {
            FileName = ffmpegExe,
            WorkingDirectory = workspace.RootPath,
            RedirectStandardInput = true,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };

        foreach (var arg in BuildFfmpegArguments(width, height, fps, durationSeconds, hasSpeech, hasBgm, hasSubtitles))
            startInfo.ArgumentList.Add(arg);

        using var process = new Process { StartInfo = startInfo };
        try
        {
            if (!process.Start())
                throw new RenderException(RenderErrorCode.RendererUnavailable, "Could not launch FFmpeg process.");
        }
        catch (Exception ex) when (ex is System.ComponentModel.Win32Exception or FileNotFoundException)
        {
            throw new RenderException(
                RenderErrorCode.RendererUnavailable,
                "FFmpeg could not be launched on this machine.",
                ex.Message,
                ex);
        }

        using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(ct);
        timeoutCts.CancelAfter(EncodeTimeout);
        var linkedCt = timeoutCts.Token;

        var stdoutTask = process.StandardOutput.ReadToEndAsync(linkedCt);
        var stderrTask = process.StandardError.ReadToEndAsync(linkedCt);

        var totalFrames = durationSeconds * fps;
        var swPrep = Stopwatch.StartNew();
        var rasterizer = new ProceduralSceneRasterizer(width, height, resolvedTheme, seed, palette, dialoguePlan, speechEnvelope, fps);

        try
        {
            await using (var stdin = process.StandardInput.BaseStream)
            {
                for (var frameIndex = 0; frameIndex < totalFrames; frameIndex++)
                {
                    linkedCt.ThrowIfCancellationRequested();
                    var timeSeconds = (double)frameIndex / fps;
                    var rgba = rasterizer.RenderFrame(timeSeconds, durationSeconds);
                    await stdin.WriteAsync(rasterizer.Buffer, 0, rgba.Length, linkedCt).ConfigureAwait(false);
                }

                await stdin.FlushAsync(linkedCt).ConfigureAwait(false);
            }
        }
        catch (IOException) when (process.HasExited)
        {
            // FFmpeg closed pipe early; stderr below reports why.
        }
        catch (OperationCanceledException) when (!ct.IsCancellationRequested)
        {
            TryKill(process);
            throw new RenderException(RenderErrorCode.Timeout, "3D procedural rendering timed out on this machine.");
        }

        await process.WaitForExitAsync(linkedCt).ConfigureAwait(false);
        _ = await stdoutTask.ConfigureAwait(false);
        var stderr = await stderrTask.ConfigureAwait(false);
        swPrep.Stop();

        if (process.ExitCode != 0 || !File.Exists(outPath))
        {
            workspace.MarkFailed($"exit-{process.ExitCode}");
            var tail = stderr.Length > 1200 ? stderr[^1200..] : stderr;
            logger.LogWarning("Procedural video encode failed (exit {ExitCode}): {Stderr}", process.ExitCode, tail);
            throw new RenderException(
                RenderErrorCode.FfmpegError,
                "Failed to encode procedural animated video.",
                tail);
        }

        var mp4Bytes = await File.ReadAllBytesAsync(outPath, ct).ConfigureAwait(false);
        swTotal.Stop();

        string? jobId = null;
        string? projectId = null;
        string? storageKey = null;

        if (request.SaveAsRenderJob)
        {
            projectId = await EnsureTargetProjectAsync(userId, request.ProjectId, width, height, fps, ct).ConfigureAwait(false);
            jobId = Guid.NewGuid().ToString("N");
            storageKey = $"renders/{jobId}.mp4";

            await using (var ms = new MemoryStream(mp4Bytes, writable: false))
                await objectStore.SaveAsync(storageKey, ms, "video/mp4", ct).ConfigureAwait(false);

            var now = clock.GetUtcNow().UtcDateTime;
            var job = new RenderJob
            {
                Id = jobId,
                ProjectId = projectId,
                UserId = userId,
                Name = title.Length > 90 ? title[..90].TrimEnd() : title,
                Kind = RenderJobKind.ProceduralAnimated,
                TopicId = string.IsNullOrWhiteSpace(request.TopicId) ? null : request.TopicId.Trim(),
                Status = RenderJobStatus.Completed,
                Progress = 100,
                Message = $"3D Animated ({preset.Name})",
                CurrentStage = Domain.Rendering.RenderStage.Completed,
                ScenesTotal = 1,
                ScenesDone = 1,
                OutputStorageKey = storageKey,
                OutputSizeBytes = mp4Bytes.Length,
                OutputDurationFrames = totalFrames,
                Width = width,
                Height = height,
                TargetFormat = normalizedFormat == "vertical" ? "Short" : normalizedFormat == "square" ? "Square" : "Video",
                CreatedAt = now,
                StartedAt = now.AddSeconds(-swTotal.Elapsed.TotalSeconds),
                CompletedAt = now,
                Diagnostics = new RenderDiagnostics
                {
                    TotalSeconds = Math.Round(swTotal.Elapsed.TotalSeconds, 1),
                    PreparingSeconds = Math.Round(swPrep.Elapsed.TotalSeconds, 1),
                    EncodingSeconds = Math.Round(swTotal.Elapsed.TotalSeconds, 1),
                    ItemsCount = 1,
                    OutputDurationSeconds = durationSeconds,
                    SpeedFactor = $"{durationSeconds / Math.Max(0.1, swTotal.Elapsed.TotalSeconds):0.1}x",
                    CompletedAt = now
                }
            };

            await renderJobs.InsertAsync(job, ct).ConfigureAwait(false);
        }

        logger.LogInformation(
            "Generated {Theme} 3D animated video ({Width}x{Height}, {Duration}s, {Bytes} bytes) in {Elapsed}ms for user {UserId}.",
            resolvedTheme, width, height, durationSeconds, mp4Bytes.Length, swTotal.ElapsedMilliseconds, userId);

        return new ProceduralVideoResult(
            jobId,
            projectId,
            resolvedTheme,
            preset.Name,
            width,
            height,
            durationSeconds,
            mp4Bytes.Length,
            storageKey,
            request.ReturnInlineBytes ? mp4Bytes : null,
            $"Rendered {durationSeconds}s {width}x{height} 3D animated MP4 ({preset.Name}) in {swTotal.Elapsed.TotalSeconds:0.1}s.");
    }

    private string BuildAssSubtitles(
        string title,
        ProceduralVideoRequest request,
        ProceduralEventPalette palette,
        ProceduralDialoguePlan dialoguePlan,
        int width,
        int height,
        int fps,
        int durationSeconds)
    {
        var canvas = new Canvas(width, height, new FrameRate(fps, 1));
        var lines = new List<DialogueLine>(dialoguePlan.Turns.Count + 4);
        var endFrame = Math.Max(2, (durationSeconds * fps) - 2);
        var index = 0;

        // 1. Fixed Top Header Template ("Content of the Day" badge + engaging top title)
        var categoryText = string.IsNullOrWhiteSpace(request.TopCategoryLabel)
            ? palette.HeaderBadgeText
            : request.TopCategoryLabel.Trim();
        lines.Add(new DialogueLine
        {
            Index = index++,
            SpeakerLabel = "Banner",
            SpeakerCharacterId = TopCategoryStyleCharId,
            Text = $"* {categoryText} *",
            RelativeStartFrame = 0,
            RelativeEndFrame = endFrame
        });

        var headerTitle = title.Length > 64 ? title[..63].TrimEnd() + "..." : title;
        lines.Add(new DialogueLine
        {
            Index = index++,
            SpeakerLabel = "HeaderTitle",
            SpeakerCharacterId = TopTitleStyleCharId,
            Text = headerTitle,
            RelativeStartFrame = 0,
            RelativeEndFrame = endFrame
        });

        // 2. Colorful Animated Subtitles (per speaker when 2-character dialogue is active)
        foreach (var turn in dialoguePlan.Turns)
        {
            var styleCharId = turn.IsTitleHook
                ? TitleStyleCharId
                : turn.Slot switch
                {
                    DialogueSpeakerSlot.Left => SpeakerAStyleCharId,
                    DialogueSpeakerSlot.Right => SpeakerBStyleCharId,
                    _ => BodyStyleCharId
                };

            var displayText = !turn.IsTitleHook && dialoguePlan.HasCharacters && !string.IsNullOrWhiteSpace(turn.SpeakerName)
                ? $"{turn.SpeakerName}: {turn.Text}"
                : turn.Text;

            lines.Add(new DialogueLine
            {
                Index = index++,
                SpeakerLabel = turn.SpeakerName,
                SpeakerCharacterId = styleCharId,
                Text = displayText,
                RelativeStartFrame = Math.Max(0, (int)Math.Round(turn.StartSeconds * fps)),
                RelativeEndFrame = Math.Max(1, (int)Math.Round(turn.EndSeconds * fps))
            });
        }

        if (!string.IsNullOrWhiteSpace(request.FooterLabel))
        {
            lines.Add(new DialogueLine
            {
                Index = index++,
                SpeakerLabel = "Source",
                SpeakerCharacterId = FooterStyleCharId,
                Text = request.FooterLabel.Trim(),
                RelativeStartFrame = 0,
                RelativeEndFrame = endFrame
            });
        }

        var motionPreset = (request.SubtitlePreset ?? "event-glow").Trim().ToLowerInvariant() switch
        {
            "karaoke-pulse" or "karaoke" => SubtitleMotionPreset.KaraokePulse,
            "classic-clean" or "clean" => SubtitleMotionPreset.None,
            _ => SubtitleMotionPreset.EventGlow
        };

        var topCategoryMargin = Math.Max(12, height / 64);
        var topTitleMargin = Math.Max(42, height / 20);
        var titleHookMargin = Math.Max(108, height / 8);
        var dialogueMargin = dialoguePlan.HasCharacters ? Math.Max(52, height / 15) : Math.Max(58, height / 16);
        var footerMargin = Math.Max(14, height / 68);

        var styles = new Dictionary<string, SubtitleStyle>(StringComparer.Ordinal)
        {
            [TopCategoryStyleCharId] = new("TopCategory", palette.PrimaryHex, Bold: true, Alignment: 8, MarginV: topCategoryMargin, FontScalePercent: 56, MotionPreset: SubtitleMotionPreset.TopBannerReveal),
            [TopTitleStyleCharId] = new("HeaderTitle", palette.TitleHex, Bold: true, Alignment: 8, MarginV: topTitleMargin, FontScalePercent: 78, MotionPreset: SubtitleMotionPreset.TopBannerReveal),
            [TitleStyleCharId] = new("TitleHook", palette.PrimaryHex, Bold: true, Alignment: 8, MarginV: titleHookMargin, FontScalePercent: 102, OutlineColorHex: "#111827", SecondaryColorHex: palette.SecondaryHex, MotionPreset: SubtitleMotionPreset.EventGlow),
            [SpeakerAStyleCharId] = new("SpeakerA", palette.SpeakerAHex, Bold: true, Alignment: 2, MarginV: dialogueMargin, FontScalePercent: 94, OutlineColorHex: "#0F172A", SecondaryColorHex: palette.PrimaryHex, MotionPreset: motionPreset),
            [SpeakerBStyleCharId] = new("SpeakerB", palette.SpeakerBHex, Bold: true, Alignment: 2, MarginV: dialogueMargin, FontScalePercent: 94, OutlineColorHex: "#0F172A", SecondaryColorHex: palette.SecondaryHex, MotionPreset: motionPreset),
            [BodyStyleCharId] = new("BeatBody", palette.TitleHex, Bold: true, Alignment: 2, MarginV: dialogueMargin, FontScalePercent: 96, OutlineColorHex: "#0F172A", SecondaryColorHex: palette.PrimaryHex, MotionPreset: motionPreset),
            [FooterStyleCharId] = new("FooterTag", "#CBD5E1", Bold: false, Alignment: 2, MarginV: footerMargin, FontScalePercent: 54, MotionPreset: SubtitleMotionPreset.None)
        };

        var fontSize = width >= height ? Math.Max(34, height / 17) : Math.Max(32, width / 18);
        return subtitleWriter.Write(new SubtitleRequest(
            canvas,
            lines,
            styles,
            AssSubtitleWriter.StockFontName,
            fontSize));
    }

    private static List<string> BuildFfmpegArguments(
        int width,
        int height,
        int fps,
        int durationSeconds,
        bool hasSpeech,
        bool hasBgm,
        bool hasSubtitles)
    {
        var args = new List<string>
        {
            "-hide_banner", "-nostdin", "-y",
            "-f", "rawvideo",
            "-pixel_format", "rgba",
            "-video_size", string.Create(CultureInfo.InvariantCulture, $"{width}x{height}"),
            "-framerate", fps.ToString(CultureInfo.InvariantCulture),
            "-i", "pipe:0"
        };

        var fadeOutStart = Math.Max(0.2, durationSeconds - 0.65).ToString("0.00", CultureInfo.InvariantCulture);
        var durStr = durationSeconds.ToString(CultureInfo.InvariantCulture);

        if (hasSpeech)
        {
            args.Add("-i");
            args.Add("in/speech.wav");
        }

        if (hasBgm)
        {
            args.AddRange(["-stream_loop", "-1", "-t", durStr, "-i", "in/ambient.wav"]);
        }

        if (hasSpeech && hasBgm)
        {
            // Loudness-normalize speech to -16 LUFS, split for sidechain key + dry voice, and duck loopable BGM cleanly.
            var videoFilter = hasSubtitles ? "[0:v]ass=in/subs.ass[vout];" : string.Empty;
            var audioFilter = string.Create(CultureInfo.InvariantCulture,
                $"[1:a]aresample=48000,aformat=channel_layouts=stereo,apad=whole_dur={durStr},loudnorm=I=-16:TP=-1.5:LRA=9,asplit=2[sp1][sp2];[2:a]aresample=48000,aformat=channel_layouts=stereo,volume=0.28[bg];[bg][sp1]sidechaincompress=threshold=0.018:ratio=6:attack=35:release=320[bgd];[sp2][bgd]amix=inputs=2:duration=first:normalize=0,afade=t=in:st=0:d=0.15,afade=t=out:st={fadeOutStart}:d=0.6[aout]");

            args.AddRange([
                "-filter_complex", videoFilter + audioFilter,
                "-map", hasSubtitles ? "[vout]" : "0:v",
                "-map", "[aout]"
            ]);
        }
        else if (hasSpeech)
        {
            args.AddRange([
                "-map", "0:v",
                "-map", "1:a",
                "-af", string.Create(CultureInfo.InvariantCulture, $"aresample=48000,aformat=channel_layouts=stereo,apad=whole_dur={durStr},loudnorm=I=-16:TP=-1.5:LRA=9")
            ]);
            if (hasSubtitles)
                args.AddRange(["-vf", "ass=in/subs.ass"]);
        }
        else if (hasBgm)
        {
            args.AddRange([
                "-map", "0:v",
                "-map", "1:a",
                "-af", string.Create(CultureInfo.InvariantCulture, $"aresample=48000,aformat=channel_layouts=stereo,afade=t=in:st=0:d=0.4,afade=t=out:st={fadeOutStart}:d=0.6")
            ]);
            if (hasSubtitles)
                args.AddRange(["-vf", "ass=in/subs.ass"]);
        }
        else
        {
            args.AddRange(["-map", "0:v"]);
            if (hasSubtitles)
                args.AddRange(["-vf", "ass=in/subs.ass"]);
        }

        args.AddRange(
        [
            "-c:v", "libx264",
            "-preset", "veryfast",
            "-crf", "22",
            "-pix_fmt", "yuv420p",
            "-movflags", "+faststart"
        ]);

        if (hasSpeech || hasBgm)
        {
            args.AddRange(["-c:a", "aac", "-b:a", "128k", "-t", durStr, "-shortest"]);
        }
        else
        {
            args.Add("-an");
        }

        args.Add("out/video.mp4");
        return args;
    }

    private async Task<string> EnsureTargetProjectAsync(
        string userId, string? requestedProjectId, int width, int height, int fps, CancellationToken ct)
    {
        if (!string.IsNullOrWhiteSpace(requestedProjectId))
        {
            var existing = await projects.GetAsync(requestedProjectId.Trim(), ct).ConfigureAwait(false);
            if (existing is not null && string.Equals(existing.UserId, userId, StringComparison.Ordinal))
                return existing.Id;
        }

        var userProjects = await projects.ListAsync(userId, ct).ConfigureAwait(false);
        var autoProject = userProjects.FirstOrDefault(p =>
            string.Equals(p.Name, DefaultProjectName, StringComparison.OrdinalIgnoreCase));
        if (autoProject is not null)
            return autoProject.Id;

        var now = clock.GetUtcNow().UtcDateTime;
        var created = new Project
        {
            Id = Guid.NewGuid().ToString("N"),
            UserId = userId,
            Name = DefaultProjectName,
            Description = "Auto-created container for built-in CPU 2D/3D procedural animated videos.",
            Status = ProjectStatus.Rendered,
            Settings = new ProjectSettings
            {
                Width = width,
                Height = height,
                FrameRateNum = fps,
                FrameRateDen = 1
            },
            CreatedAt = now,
            UpdatedAt = now
        };

        await projects.InsertAsync(created, ct).ConfigureAwait(false);
        return created.Id;
    }

    private static int StableSeed(string input)
    {
        unchecked
        {
            var h = 2166136261u;
            foreach (var ch in input)
                h = (h ^ ch) * 16777619u;
            return (int)(h & 0x7FFFFFFF);
        }
    }

    private static void TryKill(Process process)
    {
        try
        {
            if (!process.HasExited)
                process.Kill(entireProcessTree: true);
        }
        catch
        {
            // best effort
        }
    }
}
