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
        var resolvedTheme = ProceduralVideoPlanner.InferTheme(request.Theme, title, request.Prompt, request.Script, request.EventType);
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

        var backdropFrames = await DecodeBackdropFramesAsync(
            request.BackgroundImagePaths,
            ffmpegExe,
            width,
            height,
            ct).ConfigureAwait(false);

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
        var rasterizer = new ProceduralSceneRasterizer(width, height, resolvedTheme, seed, palette, dialoguePlan, speechEnvelope, fps, $"{title} {request.Prompt}", backdropFrames);

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

        var summaryVoice = string.IsNullOrWhiteSpace(voiceSummary) ? string.Empty : $", voice={voiceSummary}";
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
            $"Rendered {durationSeconds}s {width}x{height} 3D animated MP4 ({preset.Name}{summaryVoice}) in {swTotal.Elapsed.TotalSeconds:0.1}s.");
    }

    private string BuildAssSubtitles(
        string title,
        ProceduralVideoRequest request,
        ProceduralEventPalette palette,
        ProceduralDialoguePlan dialoguePlan,
        int width,
        int height,
        int fps,
        int durationSeconds) =>
        BuildAssSubtitlesWithWriter(
            subtitleWriter,
            title,
            request,
            palette,
            dialoguePlan,
            width,
            height,
            fps,
            durationSeconds);

    internal static string BuildAssSubtitlesWithWriter(
        ISubtitleWriter subtitleWriter,
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
        var isPortrait = height > width;
        var isHindi = !string.Equals(request.Language?.Trim(), "en", StringComparison.OrdinalIgnoreCase);

        // 1. Fixed Top Header Template ("Content of the Day" badge + clean 2-line full title without "..." cutoff)
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

        var headerTitle = WrapLinesForAss(title, isPortrait ? 34 : 56, maxLines: 2);
        lines.Add(new DialogueLine
        {
            Index = index++,
            SpeakerLabel = "HeaderTitle",
            SpeakerCharacterId = TopTitleStyleCharId,
            Text = headerTitle,
            RelativeStartFrame = 0,
            RelativeEndFrame = endFrame
        });

        // 2. Colorful Animated Subtitles (safe-zoned above YouTube Shorts UI on 9:16 portrait)
        var bodyWrapWidth = isPortrait ? 30 : 54;
        foreach (var turn in dialoguePlan.Turns)
        {
            if (turn.IsTitleHook)
            {
                if (dialoguePlan.HasCharacters
                    && dialoguePlan.LeftCharacter is not null
                    && dialoguePlan.RightCharacter is not null)
                {
                    var introText = isHindi
                        ? $"पात्र संवाद: {dialoguePlan.LeftCharacter.Name} एवं {dialoguePlan.RightCharacter.Name}"
                        : $"Dialogue: {dialoguePlan.LeftCharacter.Name} & {dialoguePlan.RightCharacter.Name}";
                    lines.Add(new DialogueLine
                    {
                        Index = index++,
                        SpeakerLabel = "TitleHook",
                        SpeakerCharacterId = TitleStyleCharId,
                        Text = introText,
                        RelativeStartFrame = Math.Max(0, (int)Math.Round(turn.StartSeconds * fps)),
                        RelativeEndFrame = Math.Max(1, (int)Math.Round(turn.EndSeconds * fps))
                    });
                }
                continue;
            }

            var styleCharId = turn.Slot switch
            {
                DialogueSpeakerSlot.Left => SpeakerAStyleCharId,
                DialogueSpeakerSlot.Right => SpeakerBStyleCharId,
                _ => BodyStyleCharId
            };

            var displayText = dialoguePlan.HasCharacters
                && !string.IsNullOrWhiteSpace(turn.SpeakerName)
                && !turn.Text.StartsWith(turn.SpeakerName + ":", StringComparison.OrdinalIgnoreCase)
                ? $"{turn.SpeakerName}: {turn.Text}"
                : turn.Text;

            lines.Add(new DialogueLine
            {
                Index = index++,
                SpeakerLabel = turn.SpeakerName,
                SpeakerCharacterId = styleCharId,
                Text = WrapLinesForAss(displayText, bodyWrapWidth, maxLines: 3),
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

        var topCategoryMargin = Math.Max(14, height / 62);
        var topTitleMargin = isPortrait ? Math.Max(48, height / 23) : Math.Max(42, height / 20);
        var titleHookMargin = isPortrait ? Math.Max(215, (int)Math.Round(height * 0.175)) : Math.Max(118, (int)Math.Round(height * 0.165));

        // On 9:16 mobile Shorts, reserve bottom ~27% for YouTube @handle/title/Share overlay and right ~18% for Like/Save/Comment/Share buttons.
        var dialogueMargin = isPortrait
            ? Math.Max(310, (int)Math.Round(height * 0.275))
            : Math.Max(58, height / 11);
        var captionMarginL = isPortrait ? Math.Max(46, width / 16) : Math.Max(68, width / 14);
        var captionMarginR = isPortrait ? Math.Max(126, (int)Math.Round(width * 0.18)) : Math.Max(68, width / 14);
        var footerMargin = isPortrait
            ? Math.Max(265, (int)Math.Round(height * 0.228))
            : Math.Max(18, height / 50);

        var styles = new Dictionary<string, SubtitleStyle>(StringComparer.Ordinal)
        {
            [TopCategoryStyleCharId] = new("TopCategory", palette.PrimaryHex, Bold: true, Alignment: 8, MarginV: topCategoryMargin, FontScalePercent: isPortrait ? 54 : 56, MotionPreset: SubtitleMotionPreset.TopBannerReveal, MarginL: 40, MarginR: 40),
            [TopTitleStyleCharId] = new("HeaderTitle", palette.TitleHex, Bold: true, Alignment: 8, MarginV: topTitleMargin, FontScalePercent: isPortrait ? 70 : 76, MotionPreset: SubtitleMotionPreset.TopBannerReveal, MarginL: 38, MarginR: 38),
            [TitleStyleCharId] = new("TitleHook", palette.PrimaryHex, Bold: true, Alignment: 8, MarginV: titleHookMargin, FontScalePercent: isPortrait ? 82 : 90, OutlineColorHex: "#111827", SecondaryColorHex: palette.SecondaryHex, MotionPreset: SubtitleMotionPreset.EventGlow, MarginL: captionMarginL, MarginR: isPortrait ? captionMarginR : captionMarginL),
            [SpeakerAStyleCharId] = new("SpeakerA", palette.SpeakerAHex, Bold: true, Alignment: 2, MarginV: dialogueMargin, FontScalePercent: isPortrait ? 88 : 94, OutlineColorHex: "#0F172A", SecondaryColorHex: palette.PrimaryHex, MotionPreset: motionPreset, MarginL: captionMarginL, MarginR: captionMarginR),
            [SpeakerBStyleCharId] = new("SpeakerB", palette.SpeakerBHex, Bold: true, Alignment: 2, MarginV: dialogueMargin, FontScalePercent: isPortrait ? 88 : 94, OutlineColorHex: "#0F172A", SecondaryColorHex: palette.SecondaryHex, MotionPreset: motionPreset, MarginL: captionMarginL, MarginR: captionMarginR),
            [BodyStyleCharId] = new("BeatBody", palette.TitleHex, Bold: true, Alignment: 2, MarginV: dialogueMargin, FontScalePercent: isPortrait ? 90 : 96, OutlineColorHex: "#0F172A", SecondaryColorHex: palette.PrimaryHex, MotionPreset: motionPreset, MarginL: captionMarginL, MarginR: captionMarginR),
            [FooterStyleCharId] = new("FooterTag", "#E2E8F0", Bold: false, Alignment: 2, MarginV: footerMargin, FontScalePercent: isPortrait ? 52 : 54, OutlineColorHex: "#0F172A", MotionPreset: SubtitleMotionPreset.None, MarginL: captionMarginL, MarginR: captionMarginR)
        };

        var fontSize = width >= height ? Math.Max(34, height / 17) : Math.Max(32, width / 19);
        return subtitleWriter.Write(new SubtitleRequest(
            canvas,
            lines,
            styles,
            AssSubtitleWriter.StockFontName,
            fontSize));
    }

    private static string WrapLinesForAss(string text, int maxCharsPerLine, int maxLines)
    {
        var clean = System.Text.RegularExpressions.Regex.Replace(text ?? string.Empty, @"\s+", " ").Trim();
        if (clean.Length <= maxCharsPerLine || maxLines <= 1)
            return clean;

        var words = clean.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        var wrapped = new List<string>(maxLines);
        var current = new StringBuilder();

        foreach (var word in words)
        {
            if (current.Length > 0 && current.Length + 1 + word.Length > maxCharsPerLine)
            {
                wrapped.Add(current.ToString());
                current.Clear();
                if (wrapped.Count == maxLines - 1)
                {
                    // Last line absorbs remaining text cleanly without chopping mid-phrase unnecessarily
                    var tail = string.Join(' ', words.Skip(Math.Max(0, wrapped.Sum(l => l.Split(' ').Length))));
                    var maxTail = maxCharsPerLine * 2 + 8;
                    wrapped.Add(tail.Length <= maxTail ? tail : tail[..(maxTail - 1)].TrimEnd() + "…");
                    return string.Join('\n', wrapped);
                }
            }
            if (current.Length > 0) current.Append(' ');
            current.Append(word);
        }

        if (current.Length > 0)
            wrapped.Add(current.ToString());

        return string.Join('\n', wrapped);
    }

    internal static List<string> BuildFfmpegArguments(
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
            // Loudness-normalize speech to -16 LUFS, resample back from loudnorm's 192kHz to 48kHz stereo, then duck loopable BGM cleanly.
            var videoFilter = hasSubtitles ? "[0:v]ass=in/subs.ass[vout];" : string.Empty;
            var audioFilter = string.Create(CultureInfo.InvariantCulture,
                $"[1:a]aresample=48000,aformat=channel_layouts=stereo,apad=whole_dur={durStr},loudnorm=I=-16:TP=-1.5:LRA=9,aresample=48000,aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,asplit=2[sp1][sp2];[2:a]aresample=48000,aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,volume=0.45[bg];[bg][sp1]sidechaincompress=threshold=0.025:ratio=3.5:attack=25:release=380[bgd];[sp2][bgd]amix=inputs=2:duration=first:normalize=0,aresample=async=1:min_hard_comp=0.005:first_pts=0,aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,afade=t=in:st=0:d=0.15,afade=t=out:st={fadeOutStart}:d=0.6[aout]");

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
                "-af", string.Create(CultureInfo.InvariantCulture, $"aresample=48000,aformat=channel_layouts=stereo,apad=whole_dur={durStr},loudnorm=I=-16:TP=-1.5:LRA=9,aresample=async=1:min_hard_comp=0.005:first_pts=0,aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo")
            ]);
            if (hasSubtitles)
                args.AddRange(["-vf", "ass=in/subs.ass"]);
        }
        else if (hasBgm)
        {
            args.AddRange([
                "-map", "0:v",
                "-map", "1:a",
                "-af", string.Create(CultureInfo.InvariantCulture, $"aresample=async=1:min_hard_comp=0.005:first_pts=0,aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,afade=t=in:st=0:d=0.4,afade=t=out:st={fadeOutStart}:d=0.6")
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
            args.AddRange(["-c:a", "aac", "-profile:a", "aac_low", "-ar", "48000", "-ac", "2", "-b:a", "192k", "-t", durStr, "-shortest"]);
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

    private async Task<List<byte[]>> DecodeBackdropFramesAsync(
        IReadOnlyList<string>? paths,
        string ffmpegExe,
        int width,
        int height,
        CancellationToken ct)
    {
        var result = new List<byte[]>();
        if (paths is null || paths.Count == 0) return result;

        var expectedBytes = width * height * 4;
        var vf = $"scale={width}:{height}:force_original_aspect_ratio=increase,crop={width}:{height}";

        foreach (var path in paths.Take(20))
        {
            ct.ThrowIfCancellationRequested();
            if (string.IsNullOrWhiteSpace(path) || !File.Exists(path)) continue;

            try
            {
                using var decodeCts = CancellationTokenSource.CreateLinkedTokenSource(ct);
                decodeCts.CancelAfter(TimeSpan.FromSeconds(20));

                var startInfo = new ProcessStartInfo
                {
                    FileName = ffmpegExe,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };
                startInfo.ArgumentList.Add("-hide_banner");
                startInfo.ArgumentList.Add("-loglevel");
                startInfo.ArgumentList.Add("error");
                startInfo.ArgumentList.Add("-nostdin");
                startInfo.ArgumentList.Add("-y");
                startInfo.ArgumentList.Add("-i");
                startInfo.ArgumentList.Add(path);
                startInfo.ArgumentList.Add("-vf");
                startInfo.ArgumentList.Add(vf);
                startInfo.ArgumentList.Add("-frames:v");
                startInfo.ArgumentList.Add("1");
                startInfo.ArgumentList.Add("-f");
                startInfo.ArgumentList.Add("rawvideo");
                startInfo.ArgumentList.Add("-pix_fmt");
                startInfo.ArgumentList.Add("rgba");
                startInfo.ArgumentList.Add("pipe:1");

                using var proc = Process.Start(startInfo);
                if (proc is null) continue;

                var errTask = proc.StandardError.ReadToEndAsync(decodeCts.Token);
                await using var ms = new MemoryStream(expectedBytes);
                await proc.StandardOutput.BaseStream.CopyToAsync(ms, decodeCts.Token).ConfigureAwait(false);
                await proc.WaitForExitAsync(decodeCts.Token).ConfigureAwait(false);
                var err = await errTask.ConfigureAwait(false);

                if (proc.ExitCode == 0 && ms.Length == expectedBytes)
                {
                    result.Add(ms.ToArray());
                }
                else
                {
                    logger.LogDebug(
                        "Skipping procedural backdrop '{Path}': exit {ExitCode}, got {Bytes}/{Expected} bytes. {Err}",
                        path, proc.ExitCode, ms.Length, expectedBytes, err);
                }
            }
            catch (OperationCanceledException) when (!ct.IsCancellationRequested)
            {
                logger.LogDebug("Timed out decoding procedural backdrop '{Path}'.", path);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogDebug(ex, "Could not decode procedural backdrop '{Path}'.", path);
            }
        }

        return result;
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
