using System.Diagnostics;
using System.Globalization;
using System.Text;
using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Abstractions.Rendering;
using AnimStudio.Application.Abstractions.Storage;
using AnimStudio.Application.Ai;
using AnimStudio.Application.Rendering;
using AnimStudio.Application.StoryAgent;
using AnimStudio.Application.Voices;
using AnimStudio.Domain.Assets;
using AnimStudio.Domain.Effects;
using AnimStudio.Domain.Errors;
using AnimStudio.Domain.Jobs;
using AnimStudio.Domain.Projects;
using AnimStudio.Domain.Rendering;
using AnimStudio.Domain.Scenes;
using AnimStudio.Domain.Voices;
using AnimStudio.Infrastructure.Ffmpeg;
using AnimStudio.Infrastructure.Subtitles;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AnimStudio.Infrastructure.Rendering;

/// <summary>
/// Renders free, deterministic 3D animated MP4 videos — preferring hardware/WebGL2 Three.js 3D
/// (characters, soft shadows, shaders, particle VFX, dynamic speaker cameras) via headless Edge/Chrome
/// when available and falling back seamlessly to pure-C# <see cref="ProceduralSceneRasterizer"/> —
/// streaming synthesized RGBA frames into FFmpeg alongside multi-character/narrator TTS voices,
/// one-time cached BGM audio with sidechain ducking, and UTF-8 ASS subtitles.
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
    ProceduralBgmCacheService? bgmCache = null,
    IConfiguration? configuration = null,
    IEffectClipRepository? effects = null,
    IVoiceProfileRepository? voiceProfiles = null,
    IStudioVoiceRenderer? studioVoiceRenderer = null) : IProceduralVideoGenerator
{
    private const string DefaultProjectName = "Procedural 3D Studio Renders";
    private const string TopCategoryStyleCharId = "top-category";
    private const string TopTitleStyleCharId = "top-header-title";
    private const string TitleStyleCharId = "title-hook";
    private const string MemePopStyleCharId = "meme-pop";
    private const string SpeakerAStyleCharId = "speaker-a";
    private const string SpeakerBStyleCharId = "speaker-b";
    private const string BodyStyleCharId = "beat-body";
    private const string FooterStyleCharId = "footer-link";
    /// <summary>
    /// How long a render may go without any progress (no frame accepted by FFmpeg, no output from FFmpeg) before it is
    /// treated as hung. There is deliberately no limit on total time: a slow machine or a long video just takes longer.
    /// </summary>
    internal static readonly TimeSpan RenderStallLimit = TimeSpan.FromMinutes(3);

    /// <summary>Keep only this much FFmpeg output; the error message uses the last 1,200 characters.</summary>
    private const int MaxFfmpegLogChars = 32 * 1024;

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
        // Following the script exactly means no length cap: the narration decides how long the video is.
        var lengthCap = request.FollowScriptExactly ? null : request.MaxDurationSeconds;
        if (lengthCap is > 0 and var cap)
            durationSeconds = Math.Min(durationSeconds, ProceduralVideoPlanner.ClampDuration(cap));
        var fps = Math.Clamp(request.Fps <= 0 ? 24 : request.Fps, 12, 30);
        var (width, height, normalizedFormat) = ProceduralVideoPlanner.ResolveDimensions(request.Format, request.Resolution);
        var resolvedTheme = ProceduralVideoPlanner.InferTheme(request.Theme, title, request.Prompt, request.Script, request.EventType);
        var preset = ProceduralVideoPlanner.DescribeTheme(resolvedTheme);
        var palette = ProceduralEventPalette.Resolve(request.EventType, resolvedTheme);
        // Plan over the longest allowed video when following the script, so no line is merged into another (a merged
        // line would be spoken in the first speaker's voice). Real timings come from the measured voices below.
        ProceduralDialoguePlan PlanFor(int seconds) => DialogueScriptParser.ParsePlan(
            title,
            request.Script,
            request.Prompt,
            seconds,
            request.EnableCharacterDialogue,
            request.SpeakerAName,
            request.SpeakerBName,
            request.EventType);
        var dialoguePlan = PlanFor(request.FollowScriptExactly ? ProceduralVideoRequest.MaxSeconds : durationSeconds);

        var seed = StableSeed($"{title}|{resolvedTheme}|{palette.EventKey}|{normalizedFormat}");
        var swTotal = Stopwatch.StartNew();
        var progress = request.Progress;
        progress?.Report(new ProceduralRenderProgress(ProceduralRenderStages.VoicesStart, "Synthesizing character voices"));

        await using var workspace = await workspaces.CreateAsync($"proc3d-{Guid.NewGuid():n}", ct).ConfigureAwait(false);
        var outPath = workspace.Resolve("out/video.mp4");

        // 1. Optional spoken voiceover / 2-character dialogue via configured TTS provider (plus creator custom voice)
        VoiceProfile? customVoiceProfile = null;
        if (!string.IsNullOrWhiteSpace(request.VoiceProfileId) && voiceProfiles is not null && !string.IsNullOrWhiteSpace(userId))
        {
            var candidate = await voiceProfiles.GetAsync(request.VoiceProfileId.Trim(), ct).ConfigureAwait(false);
            if (candidate is not null && string.Equals(candidate.UserId, userId, StringComparison.Ordinal))
                customVoiceProfile = candidate;
            else
                logger.LogWarning("Requested custom voice {VoiceProfileId} was not found for user {UserId}; falling back to stock voice.",
                    request.VoiceProfileId, userId);
        }

        float[]? speechEnvelope = null;
        var hasSpeech = false;
        string? voiceSummary = null;
        string? speechWarning = null;
        var speechOutcome = await ProceduralSpeechSynthesizer.TrySynthesizeWithDiagnosticsAsync(
            request,
            dialoguePlan,
            workspace.Resolve("in"),
            userId,
            durationSeconds,
            ai,
            aiRegistry,
            ffmpegOptions.Value,
            logger,
            ct,
            customVoiceProfile,
            studioVoiceRenderer).ConfigureAwait(false);
        var speechResult = speechOutcome.Result;

        if (speechResult is not null && File.Exists(speechResult.SpeechWavPath))
        {
            hasSpeech = true;
            dialoguePlan = speechResult.UpdatedPlan;
            durationSeconds = lengthCap is > 0 and var speechCap
                ? Math.Min(speechResult.RecommendedDurationSeconds, ProceduralVideoPlanner.ClampDuration(speechCap))
                : speechResult.RecommendedDurationSeconds;
            speechEnvelope = ProceduralAudioSynthesizer.ComputeFrameEnvelope(
                speechResult.SpeechWavPath,
                durationSeconds * fps,
                fps);
            voiceSummary = $"{speechResult.ProviderId}:{string.Join('/', speechResult.VoicesUsed)}";
            logger.LogInformation(
                "Procedural 3D video speech synthesized via {Voices} ({Duration}s) for title '{Title}'.",
                voiceSummary, durationSeconds, title);
        }
        else
        {
            if (request.IncludeSpeech && !string.IsNullOrWhiteSpace(speechOutcome.FailureReason))
                speechWarning = speechOutcome.FailureReason;
            if (request.FollowScriptExactly)
            {
                // No voices: lay the captions out over the actual video length instead of the planning maximum.
                dialoguePlan = PlanFor(durationSeconds);
            }
        }

        // 2. Clean stereo BGM bed (MJO dialogue breathing room on comedy, or cached studio pad)
        var isComedy = string.Equals(request.EventType, "FunnyComedy", StringComparison.OrdinalIgnoreCase)
            || resolvedTheme == ProceduralSceneTheme.ComedyStage3D
            || request.EnableComedySfx;
        var sparseComedyBgm = request.SparseComedyAudio || (isComedy && string.IsNullOrWhiteSpace(request.CustomBgmPath));

        var effectiveBgmPercent = request.BgmVolumePercent is { } bgmPct
            ? Math.Clamp(bgmPct, 0, 100)
            : (request.StageLayout?.DevotionalReelFrame == true ? 18 : 45);
        var bgmGain = effectiveBgmPercent / 100.0;

        var hasBgm = false;
        string? bgmSource = null;
        if (request.IncludeAmbientAudio && bgmGain > 0.005)
        {
            progress?.Report(new ProceduralRenderProgress(ProceduralRenderStages.Music, "Preparing background music"));
            var bgmDst = workspace.Resolve("in/ambient.wav");
            if (!string.IsNullOrWhiteSpace(request.CustomBgmPath) && File.Exists(request.CustomBgmPath))
            {
                var customOk = bgmCache is not null
                    ? await bgmCache.NormalizeCustomAudioToWavAsync(request.CustomBgmPath, bgmDst, durationSeconds, ct).ConfigureAwait(false)
                    : await TranscodeCustomBgmAsync(ffmpegOptions.Value.FfmpegPath is { Length: > 0 } p ? p : "ffmpeg", request.CustomBgmPath, bgmDst, durationSeconds, ct).ConfigureAwait(false);
                if (customOk && File.Exists(bgmDst))
                {
                    hasBgm = true;
                    bgmSource = "custom-song";
                }
            }
            if (!hasBgm && bgmCache is not null && !sparseComedyBgm)
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
                await ProceduralAudioSynthesizer.WriteAmbientWavAsync(bgmDst, resolvedTheme, durationSeconds, ct, sparseDialogueBed: sparseComedyBgm).ConfigureAwait(false);
                hasBgm = true;
                bgmSource = sparseComedyBgm ? "mjo-comic-jingle-v1" : "studio-pad-v2";
            }
        }

        var ffmpegExe = ffmpegOptions.Value.FfmpegPath;
        if (string.IsNullOrWhiteSpace(ffmpegExe)) ffmpegExe = "ffmpeg";

        // 2.5 Optional mid-video & climax reaction meme cutaways from creator's Effects library
        var (effectiveMemeCues, memeOverlays) = await ResolveMemeCutawaysAsync(
            userId, request, dialoguePlan, workspace, ffmpegExe, width, height, durationSeconds, ct).ConfigureAwait(false);
        if (effectiveMemeCues.Count > 0 && dialoguePlan.Memes.Count == 0)
            dialoguePlan = dialoguePlan with { MemeCues = effectiveMemeCues };

        // 2.6 Deterministic cartoon & situational action SFX layer (comedy + multi-scene story renders)
        var hasActions = dialoguePlan.Turns.Any(t => !t.IsTitleHook && !string.IsNullOrWhiteSpace(t.Action) && t.Action != "none");
        // A story set somewhere real (forest, river ghat, mountain, city, night) gets its natural sound bed even
        // when nobody moves, so long narrated stories feel like a place rather than a voice over music.
        var hasPlaceBed = dialoguePlan.Turns.Any(t =>
        {
            var (setting, time) = SceneDirectives.FromCue(t.SceneBackdropCue);
            return ProceduralAudioSynthesizer.AmbienceFor(setting, time) != ProceduralAudioSynthesizer.PlaceAmbience.None;
        });
        var hasSfx = false;
        if ((isComedy || (request.IncludeAmbientAudio && (hasActions || hasPlaceBed)))
            && (dialoguePlan.Memes.Count > 0 || dialoguePlan.Turns.Count > 1 || hasPlaceBed))
        {
            var sfxDst = workspace.Resolve("in/sfx.wav");
            await ProceduralAudioSynthesizer.WriteComedySfxWavAsync(sfxDst, dialoguePlan, durationSeconds, ct, comedyIntensity: isComedy).ConfigureAwait(false);
            hasSfx = File.Exists(sfxDst);
        }

        // 3. Optional beat-synchronized ASS subtitle + top-header overlay (reuses ScriptFonts Devanagari resolution)
        var hasSubtitles = false;
        if (request.IncludeCaptions && capabilities.Supports(RenderFeature.BurnedSubtitles))
        {
            progress?.Report(new ProceduralRenderProgress(ProceduralRenderStages.Captions, "Building subtitles"));
            var assContent = BuildAssSubtitles(title, request, palette, dialoguePlan, width, height, fps, durationSeconds);
            await File.WriteAllTextAsync(workspace.Resolve("in/subs.ass"), assContent, new UTF8Encoding(false), ct)
                .ConfigureAwait(false);
            hasSubtitles = true;
        }

        // 4. Stream pure C# 3D procedural frames directly into FFmpeg stdin -> H.264 MP4

        if (request.BackgroundImagePaths is { Count: > 0 })
            progress?.Report(new ProceduralRenderProgress(ProceduralRenderStages.Backdrops, "Loading backdrop images"));
        var backdropFrames = await DecodeBackdropFramesAsync(
            request.BackgroundImagePaths,
            ffmpegExe,
            width,
            height,
            ct).ConfigureAwait(false);

        var totalFrames = durationSeconds * fps;
        var swPrep = Stopwatch.StartNew();
        var frameBytes = width * height * 4;
        byte[][] handOff = [new byte[frameBytes], new byte[frameBytes]];
        var cleanThumbFrameIdx = request.SaveAsRenderJob
            ? PickPeakCleanThumbnailFrame(dialoguePlan, fps, totalFrames)
            : -1;
        var cleanThumbRgba = request.SaveAsRenderJob ? new byte[frameBytes] : null;
        var hasCleanThumbRgba = false;

        // Prefer real-time Three.js WebGL2 3D rendering when Node + Edge/Chrome are available; verify frame 0
        // BEFORE starting FFmpeg so Auto mode can fall back seamlessly to the C# CPU rasterizer.
        // For long videos (15m-60m), stream in 2,400-frame Chromium epochs so GPU/JS memory stays flat and resilient.
        const int WebGlEpochFrames = 2400;
        var epochIndex = 0;
        var epochEndFrame = Math.Min(totalFrames, WebGlEpochFrames);
        WebGlFrameSession? webGlSession = null;
        var hasFirstWebGlFrame = false;
        var isDevotionalReel = request.StageLayout?.DevotionalReelFrame == true;
        if (request.RenderEngine != ProceduralRenderEngine.CpuFast && !isDevotionalReel)
        {
            webGlSession = await WebGlVideoFrameRenderer.TryStartSessionAsync(
                workspace.Resolve($"webgl3d-e{epochIndex}"),
                width, height, fps, durationSeconds, totalFrames, seed,
                resolvedTheme, request, palette, dialoguePlan, speechEnvelope, backdropFrames,
                configuration, logger, ct, startFrame: 0, endFrame: epochEndFrame).ConfigureAwait(false);

            if (webGlSession is not null)
            {
                hasFirstWebGlFrame = await webGlSession.ReadNextFrameAsync(handOff[0], ct).ConfigureAwait(false);
                if (!hasFirstWebGlFrame)
                {
                    var webGlErr = await webGlSession.GetStderrAsync().ConfigureAwait(false);
                    await webGlSession.DisposeAsync().ConfigureAwait(false);
                    webGlSession = null;
                    if (request.RenderEngine == ProceduralRenderEngine.WebGl3D)
                    {
                        throw new RenderException(
                            RenderErrorCode.RendererUnavailable,
                            "WebGL 3D engine could not start on this machine.",
                            webGlErr);
                    }
                    logger.LogWarning("WebGL 3D frame 0 unavailable ({Err}); falling back to CPU rasterizer.", webGlErr);
                }
            }
            else if (request.RenderEngine == ProceduralRenderEngine.WebGl3D)
            {
                throw new RenderException(
                    RenderErrorCode.RendererUnavailable,
                    "WebGL 3D engine requires Node.js and Microsoft Edge or Chrome installed on this machine.");
            }
        }

        var useWebGl = webGlSession is not null && hasFirstWebGlFrame;
        var engineLabel = useWebGl ? "webgl-3d" : "cpu-fast";
        ProceduralSceneRasterizer? rasterizer = useWebGl
            ? null
            : new ProceduralSceneRasterizer(width, height, resolvedTheme, seed, palette, dialoguePlan, speechEnvelope, fps, $"{title} {request.Prompt}", backdropFrames,
                request.StageLayout);

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

        foreach (var arg in BuildFfmpegArguments(width, height, fps, durationSeconds, hasSpeech, hasBgm, hasSubtitles, memeOverlays, hasSfx, bgmGain))
            startInfo.ArgumentList.Add(arg);

        using var process = new Process { StartInfo = startInfo };
        try
        {
            if (!process.Start())
                throw new RenderException(RenderErrorCode.RendererUnavailable, "Could not launch FFmpeg process.");
        }
        catch (Exception ex) when (ex is System.ComponentModel.Win32Exception or FileNotFoundException)
        {
            if (webGlSession is not null)
                await webGlSession.DisposeAsync().ConfigureAwait(false);
            throw new RenderException(
                RenderErrorCode.RendererUnavailable,
                "FFmpeg could not be launched on this machine.",
                ex.Message,
                ex);
        }

        // No total time limit: the render runs as long as it keeps moving. Only a render that makes no progress at all
        // for RenderStallLimit (hung FFmpeg, stuck frame) is stopped.
        using var watchdog = new RenderStallWatchdog(RenderStallLimit, ct, clock);
        var renderCt = watchdog.Token;

        var stdoutTask = DrainAsync(process.StandardOutput, watchdog, renderCt);
        var stderrTask = DrainAsync(process.StandardError, watchdog, renderCt);

        try
        {
            await using (var stdin = process.StandardInput.BaseStream)
            {
                var pendingWrite = Task.CompletedTask;
                var lastReportedPercent = -1;
                for (var frameIndex = 0; frameIndex < totalFrames; frameIndex++)
                {
                    renderCt.ThrowIfCancellationRequested();
                    if (progress is not null)
                    {
                        var pct = ProceduralRenderStages.FramePercent(frameIndex, totalFrames);
                        if (pct != lastReportedPercent)
                        {
                            lastReportedPercent = pct;
                            progress.Report(new ProceduralRenderProgress(pct,
                                useWebGl
                                    ? $"Rendering Real 3D WebGL ({frameIndex / fps}s of {durationSeconds}s)"
                                    : $"Animating 3D frames ({frameIndex / fps}s of {durationSeconds}s)"));
                        }
                    }

                    var buffer = handOff[frameIndex & 1];
                    if (useWebGl)
                    {
                        if (frameIndex >= epochEndFrame)
                        {
                            if (webGlSession is not null)
                            {
                                await webGlSession.DisposeAsync().ConfigureAwait(false);
                                webGlSession = null;
                            }
                            epochIndex++;
                            epochEndFrame = Math.Min(totalFrames, frameIndex + WebGlEpochFrames);
                            webGlSession = await WebGlVideoFrameRenderer.TryStartSessionAsync(
                                workspace.Resolve($"webgl3d-e{epochIndex}"),
                                width, height, fps, durationSeconds, totalFrames, seed,
                                resolvedTheme, request, palette, dialoguePlan, speechEnvelope, backdropFrames,
                                configuration, logger, renderCt, startFrame: frameIndex, endFrame: epochEndFrame).ConfigureAwait(false);

                            var gotEpochHead = webGlSession is not null
                                && await webGlSession.ReadNextFrameAsync(buffer, renderCt).ConfigureAwait(false);
                            if (!gotEpochHead)
                            {
                                if (webGlSession is not null)
                                {
                                    await webGlSession.DisposeAsync().ConfigureAwait(false);
                                    webGlSession = null;
                                }
                                if (request.RenderEngine == ProceduralRenderEngine.WebGl3D)
                                {
                                    throw new RenderException(RenderErrorCode.FfmpegError,
                                        $"WebGL 3D renderer failed starting chunk at frame {frameIndex} of {totalFrames}.");
                                }
                                // Fail-safe seamlessly into CPU 3D rasterizer so long renders NEVER leave missing frames
                                logger.LogWarning("WebGL epoch {Epoch} unavailable at frame {Frame}; completing remaining frames via CPU 3D rasterizer.", epochIndex, frameIndex);
                                useWebGl = false;
                                engineLabel = "webgl-cpu-hybrid";
                                rasterizer ??= new ProceduralSceneRasterizer(width, height, resolvedTheme, seed, palette, dialoguePlan, speechEnvelope, fps, $"{title} {request.Prompt}", backdropFrames, request.StageLayout);
                                rasterizer.RenderFrame((double)frameIndex / fps, durationSeconds).CopyTo(buffer);
                            }
                        }
                        else if (frameIndex > 0)
                        {
                            var gotFrame = await webGlSession!.ReadNextFrameAsync(buffer, renderCt).ConfigureAwait(false);
                            if (!gotFrame)
                            {
                                var errTail = await webGlSession.GetStderrAsync().ConfigureAwait(false);
                                await webGlSession.DisposeAsync().ConfigureAwait(false);
                                webGlSession = null;
                                if (request.RenderEngine == ProceduralRenderEngine.WebGl3D)
                                {
                                    throw new RenderException(
                                        RenderErrorCode.FfmpegError,
                                        $"WebGL 3D renderer stopped early at frame {frameIndex} of {totalFrames}.",
                                        errTail);
                                }
                                logger.LogWarning("WebGL 3D stopped early at frame {Frame}; completing remaining frames seamlessly via CPU 3D rasterizer: {Err}", frameIndex, errTail);
                                useWebGl = false;
                                engineLabel = "webgl-cpu-hybrid";
                                rasterizer ??= new ProceduralSceneRasterizer(width, height, resolvedTheme, seed, palette, dialoguePlan, speechEnvelope, fps, $"{title} {request.Prompt}", backdropFrames, request.StageLayout);
                                rasterizer.RenderFrame((double)frameIndex / fps, durationSeconds).CopyTo(buffer);
                            }
                        }
                    }
                    else
                    {
                        var timeSeconds = (double)frameIndex / fps;
                        rasterizer!.RenderFrame(timeSeconds, durationSeconds).CopyTo(buffer);
                    }

                    if (cleanThumbRgba is not null && (frameIndex == cleanThumbFrameIdx || (!hasCleanThumbRgba && frameIndex == totalFrames - 1)))
                    {
                        Buffer.BlockCopy(buffer, 0, cleanThumbRgba, 0, frameBytes);
                        hasCleanThumbRgba = true;
                    }

                    await pendingWrite.ConfigureAwait(false);
                    watchdog.Touch();
                    pendingWrite = stdin.WriteAsync(buffer, renderCt).AsTask();
                }

                await pendingWrite.ConfigureAwait(false);
                await stdin.FlushAsync(renderCt).ConfigureAwait(false);
                watchdog.Touch();
            }
            progress?.Report(new ProceduralRenderProgress(ProceduralRenderStages.Encode, "Finishing MP4 encode"));
            await process.WaitForExitAsync(renderCt).ConfigureAwait(false);
        }
        catch (IOException) when (process.HasExited)
        {
            // FFmpeg closed pipe early; stderr below reports why.
        }
        catch (OperationCanceledException) when (watchdog.Stalled && !ct.IsCancellationRequested)
        {
            TryKill(process);
            workspace.MarkFailed("stalled");
            logger.LogWarning(
                "Procedural render stalled: no progress for {Minutes} min (renderer or FFmpeg stopped responding).",
                RenderStallLimit.TotalMinutes);
            throw new RenderException(
                RenderErrorCode.Timeout,
                $"3D render stopped responding (no progress for {RenderStallLimit.TotalMinutes:0} minutes). Please try again.");
        }
        catch (OperationCanceledException)
        {
            TryKill(process);
            throw;
        }
        finally
        {
            if (webGlSession is not null)
                await webGlSession.DisposeAsync().ConfigureAwait(false);
        }

        if (!process.HasExited) await process.WaitForExitAsync(ct).ConfigureAwait(false);
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

        var outputBytesCount = new FileInfo(outPath).Length;
        byte[]? inlineMp4Bytes = request.ReturnInlineBytes
            ? await File.ReadAllBytesAsync(outPath, ct).ConfigureAwait(false)
            : null;
        swTotal.Stop();

        string? jobId = null;
        string? projectId = null;
        string? storageKey = null;

        if (request.SaveAsRenderJob)
        {
            progress?.Report(new ProceduralRenderProgress(ProceduralRenderStages.Save, "Saving video to Studio"));
            projectId = await EnsureTargetProjectAsync(userId, request.ProjectId, width, height, fps, ct).ConfigureAwait(false);
            jobId = Guid.NewGuid().ToString("N");
            storageKey = $"renders/{jobId}.mp4";

            await using (var fs = new FileStream(outPath, FileMode.Open, FileAccess.Read, FileShare.Read, 65536, useAsync: true))
                await objectStore.SaveAsync(storageKey, fs, "video/mp4", ct).ConfigureAwait(false);

            if (hasCleanThumbRgba && cleanThumbRgba is not null)
            {
                var cleanPng = PngFrameEncoder.EncodeRgba(cleanThumbRgba, width, height);
                await using var cleanMs = new MemoryStream(cleanPng, writable: false);
                await objectStore.SaveAsync($"renders/{jobId}.cleanthumb.png", cleanMs, "image/png", ct).ConfigureAwait(false);
            }

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
                Message = useWebGl ? $"Real 3D WebGL ({preset.Name})" : $"3D Animated ({preset.Name})",
                CurrentStage = Domain.Rendering.RenderStage.Completed,
                ScenesTotal = 1,
                ScenesDone = 1,
                OutputStorageKey = storageKey,
                OutputSizeBytes = outputBytesCount,
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
            "Generated {Theme} 3D animated video via {Engine} ({Width}x{Height}, {Duration}s, {Bytes} bytes) in {Elapsed}ms for user {UserId}.",
            resolvedTheme, engineLabel, width, height, durationSeconds, outputBytesCount, swTotal.ElapsedMilliseconds, userId);

        var summaryVoice = string.IsNullOrWhiteSpace(voiceSummary) ? string.Empty : $", voice={voiceSummary}";
        return new ProceduralVideoResult(
            jobId,
            projectId,
            resolvedTheme,
            preset.Name,
            width,
            height,
            durationSeconds,
            outputBytesCount,
            storageKey,
            inlineMp4Bytes,
            $"Rendered {durationSeconds}s {width}x{height} 3D animated MP4 ({preset.Name}{summaryVoice}, engine={engineLabel}) in {swTotal.Elapsed.TotalSeconds:0.1}s.",
            SpeechWarning: speechWarning);
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

        var isComedyEvent = string.Equals(request.EventType, "FunnyComedy", StringComparison.OrdinalIgnoreCase);
        var isDevotionalReel = request.StageLayout?.DevotionalReelFrame == true;

        // 1. Safe-zoned cover header & opening poster title (skipped in DevotionalImageReel so the top dark area
        // belongs cleanly to spoken prarthana/katha captions above the rounded deity frame).
        var posterCopy = ThumbnailPosterCopy.Build(request.EventType, title, request.Prompt, request.TopCategoryLabel, isPortrait);
        var categoryText = !isComedyEvent && isPortrait && !string.IsNullOrWhiteSpace(posterCopy.CategoryPill)
            ? posterCopy.CategoryPill
            : string.IsNullOrWhiteSpace(request.TopCategoryLabel)
                ? palette.HeaderBadgeText
                : request.TopCategoryLabel.Trim();
        var coverEndFrame = Math.Clamp((int)Math.Round(2.5 * fps), 2, Math.Max(2, endFrame));

        if (!isDevotionalReel && !isComedyEvent && isPortrait)
        {
            lines.Add(new DialogueLine
            {
                Index = index++,
                SpeakerLabel = "Banner",
                SpeakerCharacterId = TopCategoryStyleCharId,
                Text = categoryText,
                RelativeStartFrame = 0,
                RelativeEndFrame = endFrame
            });
            lines.Add(new DialogueLine
            {
                Index = index++,
                SpeakerLabel = "HeaderTitle",
                SpeakerCharacterId = TopTitleStyleCharId,
                Text = WrapLinesForAss(posterCopy.HeroTitle, 20, maxLines: 2),
                RelativeStartFrame = 0,
                RelativeEndFrame = endFrame
            });
            if (!string.IsNullOrWhiteSpace(posterCopy.PurposeSubline))
            {
                lines.Add(new DialogueLine
                {
                    Index = index++,
                    SpeakerLabel = "TitleHook",
                    SpeakerCharacterId = TitleStyleCharId,
                    Text = WrapLinesForAss(posterCopy.PurposeSubline, 26, maxLines: 2),
                    RelativeStartFrame = 0,
                    RelativeEndFrame = coverEndFrame
                });
            }
        }
        else if (!isDevotionalReel)
        {
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
        }

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

            var prefix = !isDevotionalReel
                && dialoguePlan.HasCharacters
                && !string.IsNullOrWhiteSpace(turn.SpeakerName)
                && !turn.Text.StartsWith(turn.SpeakerName + ":", StringComparison.OrdinalIgnoreCase)
                ? $"{turn.SpeakerName}: "
                : string.Empty;

            // A long line is shown as consecutive on-screen chunks while it is spoken, never cut off with "…".
            var effectiveWrapWidth = isDevotionalReel ? (isPortrait ? 26 : 48) : bodyWrapWidth;
            var chunkChars = Math.Max(22, effectiveWrapWidth * (isDevotionalReel ? 2 : 3) - prefix.Length - 2);
            foreach (var chunk in CaptionChunker.Split(turn.Text, turn.StartSeconds, turn.EndSeconds, chunkChars))
            {
                lines.Add(new DialogueLine
                {
                    Index = index++,
                    SpeakerLabel = turn.SpeakerName,
                    SpeakerCharacterId = styleCharId,
                    Text = WrapLinesForAss(prefix + chunk.Text, effectiveWrapWidth, maxLines: isDevotionalReel ? 2 : 3),
                    RelativeStartFrame = Math.Max(0, (int)Math.Round(chunk.StartSeconds * fps)),
                    RelativeEndFrame = Math.Max(1, (int)Math.Round(chunk.EndSeconds * fps))
                });
            }
        }

        foreach (var cue in dialoguePlan.Memes)
        {
            var memeLabel = !string.IsNullOrWhiteSpace(cue.Caption) ? cue.Caption!.Trim() : cue.Name.Trim();
            if (string.IsNullOrWhiteSpace(memeLabel)) continue;
            var startFrame = Math.Max(1, (int)Math.Round(cue.StartSeconds * fps));
            var cueEndFrame = Math.Clamp((int)Math.Round((cue.StartSeconds + cue.Seconds) * fps), startFrame + 1, Math.Max(startFrame + 1, endFrame));
            lines.Add(new DialogueLine
            {
                Index = index++,
                SpeakerLabel = "MemePop",
                SpeakerCharacterId = MemePopStyleCharId,
                Text = WrapLinesForAss(memeLabel, isPortrait ? 24 : 38, maxLines: 2),
                RelativeStartFrame = startFrame,
                RelativeEndFrame = cueEndFrame
            });
        }

        if (request.ShowWatermark && !string.IsNullOrWhiteSpace(request.FooterLabel))
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

        var topCategoryMargin = isPortrait
            ? (isComedyEvent ? Math.Max(14, height / 68) : Math.Max(92, (int)Math.Round(height * 0.072)))
            : 12;
        var topTitleMargin = isPortrait
            ? (isComedyEvent ? Math.Max(54, (int)Math.Round(height * 0.045)) : Math.Max(134, (int)Math.Round(height * 0.105)))
            : Math.Max(42, (int)Math.Round(height * 0.060));
        var titleHookMargin = isPortrait
            ? (isComedyEvent ? Math.Max(152, (int)Math.Round(height * 0.120)) : Math.Max(228, (int)Math.Round(height * 0.178)))
            : Math.Max(94, (int)Math.Round(height * 0.132));

        // On 9:16 mobile Shorts, reserve bottom ~27% for YouTube @handle/title/Share overlay and right ~18% for Like/Save/Comment/Share buttons.
        // In DevotionalImageReel mode, spoken captions sit cleanly in the upper black header band (Alignment=8) above the rounded image frame.
        var dialogueAlignment = isDevotionalReel ? 8 : 2;
        var dialogueMargin = isDevotionalReel
            ? (isPortrait ? Math.Max(82, (int)Math.Round(height * 0.072)) : Math.Max(36, (int)Math.Round(height * 0.05)))
            : (isPortrait ? Math.Max(310, (int)Math.Round(height * 0.275)) : Math.Max(58, height / 11));
        var captionMarginL = isDevotionalReel
            ? (isPortrait ? Math.Max(52, width / 14) : Math.Max(68, width / 14))
            : (isPortrait ? Math.Max(46, width / 16) : Math.Max(68, width / 14));
        var captionMarginR = isDevotionalReel
            ? (isPortrait ? Math.Max(52, width / 14) : Math.Max(68, width / 14))
            : (isPortrait ? Math.Max(126, (int)Math.Round(width * 0.18)) : Math.Max(68, width / 14));
        var footerMargin = isDevotionalReel
            ? (isPortrait ? Math.Max(225, (int)Math.Round(height * 0.195)) : Math.Max(22, height / 36))
            : (isPortrait ? Math.Max(265, (int)Math.Round(height * 0.228)) : Math.Max(18, height / 50));

        var karaokeSecondary = motionPreset == SubtitleMotionPreset.KaraokePulse;
        var styles = new Dictionary<string, SubtitleStyle>(StringComparer.Ordinal)
        {
            [TopCategoryStyleCharId] = new("TopCategory", isPortrait && !isComedyEvent ? "#FFFFFF" : palette.PrimaryHex, Bold: true, Alignment: 8, MarginV: topCategoryMargin, FontScalePercent: isPortrait ? (isComedyEvent ? 52 : 66) : 48, OutlineColorHex: isPortrait ? (isComedyEvent ? "#111827" : "#9A3412") : null, BackColorHex: isPortrait ? (isComedyEvent ? "#111827" : "#9A3412") : null, MotionPreset: SubtitleMotionPreset.TopBannerReveal, MarginL: 40, MarginR: 40, OpaqueBox: isPortrait),
            [TopTitleStyleCharId] = new("HeaderTitle", isPortrait ? "#FACC15" : palette.TitleHex, Bold: true, Alignment: 8, MarginV: topTitleMargin, FontScalePercent: isPortrait ? (isComedyEvent ? 72 : 112) : 66, OutlineColorHex: isPortrait ? (isComedyEvent ? "#B91C1C" : "#1C1917") : "#020617", BackColorHex: isPortrait ? (isComedyEvent ? "#B91C1C" : "#7C2D12") : null, MotionPreset: SubtitleMotionPreset.TopBannerReveal, MarginL: 42, MarginR: 42, OpaqueBox: isPortrait && isComedyEvent),
            [TitleStyleCharId] = new("TitleHook", isPortrait && !isComedyEvent ? "#FFFFFF" : palette.PrimaryHex, Bold: true, Alignment: 8, MarginV: titleHookMargin, FontScalePercent: isPortrait ? (isComedyEvent ? 68 : 78) : 80, OutlineColorHex: isPortrait && !isComedyEvent ? "#B91C1C" : "#111827", BackColorHex: isPortrait && !isComedyEvent ? "#B91C1C" : null, SecondaryColorHex: palette.SecondaryHex, MotionPreset: SubtitleMotionPreset.EventGlow, MarginL: captionMarginL, MarginR: isPortrait && isComedyEvent ? captionMarginR : captionMarginL, OpaqueBox: isPortrait && !isComedyEvent),
            [MemePopStyleCharId] = new("MemePop", "#FEF08A", Bold: true, Alignment: 8, MarginV: isPortrait ? Math.Max(255, (int)Math.Round(height * 0.20)) : Math.Max(130, (int)Math.Round(height * 0.17)), FontScalePercent: isPortrait ? 86 : 92, OutlineColorHex: "#7C2D12", BackColorHex: isPortrait ? "#7C2D12" : null, SecondaryColorHex: "#F97316", MotionPreset: SubtitleMotionPreset.EventGlow, MarginL: 48, MarginR: 48, OpaqueBox: isPortrait),
            [SpeakerAStyleCharId] = new("SpeakerA", isDevotionalReel ? "#FFFFFF" : palette.SpeakerAHex, Bold: true, Alignment: dialogueAlignment, MarginV: dialogueMargin, FontScalePercent: isDevotionalReel ? (isPortrait ? 94 : 96) : (isPortrait ? 90 : 96), OutlineColorHex: "#020617", SecondaryColorHex: isDevotionalReel ? "#FDE68A" : (karaokeSecondary ? "#FFFFFF" : palette.PrimaryHex), MotionPreset: isDevotionalReel && motionPreset == SubtitleMotionPreset.None ? SubtitleMotionPreset.EventGlow : motionPreset, MarginL: captionMarginL, MarginR: captionMarginR),
            [SpeakerBStyleCharId] = new("SpeakerB", isDevotionalReel ? "#FDE68A" : palette.SpeakerBHex, Bold: true, Alignment: dialogueAlignment, MarginV: dialogueMargin, FontScalePercent: isDevotionalReel ? (isPortrait ? 94 : 96) : (isPortrait ? 90 : 96), OutlineColorHex: "#020617", SecondaryColorHex: karaokeSecondary ? "#FFFFFF" : palette.SecondaryHex, MotionPreset: motionPreset, MarginL: captionMarginL, MarginR: captionMarginR),
            [BodyStyleCharId] = new("BeatBody", isDevotionalReel ? "#FFFFFF" : palette.TitleHex, Bold: true, Alignment: dialogueAlignment, MarginV: dialogueMargin, FontScalePercent: isDevotionalReel ? (isPortrait ? 96 : 98) : (isPortrait ? 92 : 98), OutlineColorHex: "#020617", SecondaryColorHex: isDevotionalReel ? "#FDE68A" : (karaokeSecondary ? "#FFFFFF" : palette.PrimaryHex), MotionPreset: motionPreset, MarginL: captionMarginL, MarginR: captionMarginR),
            [FooterStyleCharId] = new("FooterTag", isDevotionalReel ? "#CBD5E1" : "#E2E8F0", Bold: false, Alignment: 2, MarginV: footerMargin, FontScalePercent: isDevotionalReel ? (isPortrait ? 48 : 54) : (isPortrait ? 52 : 54), OutlineColorHex: "#0F172A", MotionPreset: SubtitleMotionPreset.None, MarginL: captionMarginL, MarginR: captionMarginR)
        };

        var fontSize = width >= height ? Math.Max(34, height / 17) : Math.Max(32, width / 19);
        return subtitleWriter.Write(new SubtitleRequest(
            canvas,
            lines,
            styles,
            AssSubtitleWriter.StockFontName,
            fontSize));
    }

    internal static int PickPeakCleanThumbnailFrame(ProceduralDialoguePlan plan, int fps, int totalFrames)
    {
        if (totalFrames <= 1 || fps <= 0)
            return 0;

        var activeTurns = plan.Turns.Where(t => !t.IsTitleHook).ToList();
        if (activeTurns.Count == 0)
            return Math.Clamp((int)Math.Round(totalFrames * 0.45), 0, totalFrames - 1);

        var totalSeconds = Math.Max(1.0, activeTurns.Max(t => t.EndSeconds));
        ProceduralDialogueTurn best = activeTurns[activeTurns.Count / 2];
        var bestScore = int.MinValue;

        var isDevotionalOrHistory = plan.Memes.Count == 0
            && !activeTurns.Any(t => t.SpeakerRole == CharacterVisualRole.ComicBobble
                || t.Action is "lookInMirror" or "shockedFall" or "slapForehead" or "removingTowel" or "cutting");
        foreach (var turn in activeTurns)
        {
            var score = 0;
            if (turn.Action is "lookInMirror" or "shockedFall" or "slapForehead" or "removingTowel") score += 14;
            if (turn.SpeakerRole == CharacterVisualRole.Divine) score += 16;
            else if (turn.SpeakerRole == CharacterVisualRole.ChildDevotee) score += 7;
            else if (isDevotionalOrHistory && turn.SpeakerRole == CharacterVisualRole.KingCrown) score -= 5;
            if (turn.SpeakerProp is "trishul" or "flute" or "bow" or "diya" or "scroll" or "kalash") score += 8;
            if (turn.Action is "aarti" or "praying" or "blessing" or "pointing" or "walking") score += 6;
            if (!isDevotionalOrHistory && turn.Emotion is "angry" or "surprised") score += 9;
            else if (turn.Emotion is "serene" or "devotional" or "inspired" or "happy") score += 6;
            else if (turn.Emotion is "laughing" or "confused" or "sarcastic") score += 4;
            if (turn.CameraShot is "twoShot" or "reactionZoom" or "crashPunch") score += (isDevotionalOrHistory ? 14 : 8);
            else if (turn.CameraShot == "lowDramatic") score += 7;
            else if (turn.CameraShot == "wideEstablishing" && isDevotionalOrHistory) score += 5;
            else if (turn.CameraShot is "closeUpSpeaker" && !isDevotionalOrHistory && turn.Slot == DialogueSpeakerSlot.Right) score += 6;
            else if (turn.CameraShot == "closeUpSpeaker" && isDevotionalOrHistory) score -= 4;
            if (turn.CameraShot == "overShoulder") score -= 12;
            if (turn.Action == "cutting" && turn.CameraShot == "closeUpSpeaker") score -= 6;
            if (!string.IsNullOrWhiteSpace(turn.Text))
            {
                var lower = turn.Text.ToLowerInvariant();
                if (lower.Contains("टकला") || lower.Contains("कटोरा") || lower.Contains("चाँद") || lower.Contains("चांद")
                    || lower.Contains("बकवास") || lower.Contains("बाप रे") || lower.Contains("नालायक"))
                    score += 7;
                if (lower.Contains("प्रकट") || lower.Contains("अमर") || lower.Contains("महादेव")
                    || lower.Contains("भगवान") || lower.Contains("शिव") || lower.Contains("वरदान")
                    || lower.Contains("नरसिंह") || lower.Contains("विष्णु") || lower.Contains("प्रह्लाद") || lower.Contains("मार्कण्डेय"))
                    score += 7;
            }
            if (isDevotionalOrHistory && turn.StartSeconds >= totalSeconds * 0.50 && turn.EndSeconds <= totalSeconds * 0.96)
                score += 6;
            else if (turn.StartSeconds >= totalSeconds * 0.28 && turn.EndSeconds <= totalSeconds * 0.94)
                score += 3;

            if (score > bestScore)
            {
                bestScore = score;
                best = turn;
            }
        }

        var peakSeconds = best.StartSeconds + (Math.Max(0.2, best.EndSeconds - best.StartSeconds) * 0.62);
        var minFrame = Math.Min(totalFrames - 1, (int)Math.Round(fps * 2.2));
        var targetFrame = (int)Math.Round(peakSeconds * fps);
        return Math.Clamp(targetFrame, Math.Min(minFrame, Math.Max(0, totalFrames - 1)), Math.Max(0, totalFrames - 2));
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

    internal sealed record ResolvedMemeOverlay(string RelativePath, double StartSeconds, double EndSeconds);

    internal static List<string> BuildFfmpegArguments(
        int width,
        int height,
        int fps,
        int durationSeconds,
        bool hasSpeech,
        bool hasBgm,
        bool hasSubtitles,
        IReadOnlyList<ResolvedMemeOverlay>? memeOverlays = null,
        bool hasSfx = false,
        double bgmGain = 0.45)
    {
        var bgmGainStr = Math.Clamp(bgmGain, 0.0, 1.0).ToString("0.00", CultureInfo.InvariantCulture);
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
        var nextInput = 1;
        var speechIdx = -1;
        var bgmIdx = -1;
        var sfxIdx = -1;

        if (hasSpeech)
        {
            speechIdx = nextInput++;
            args.Add("-i");
            args.Add("in/speech.wav");
        }

        if (hasBgm)
        {
            bgmIdx = nextInput++;
            args.AddRange(["-stream_loop", "-1", "-t", durStr, "-i", "in/ambient.wav"]);
        }

        if (hasSfx)
        {
            sfxIdx = nextInput++;
            args.Add("-i");
            args.Add("in/sfx.wav");
        }

        var overlays = memeOverlays?.Where(o => !string.IsNullOrWhiteSpace(o.RelativePath)).ToList() ?? [];
        var overlayInputs = new List<(int InputIndex, ResolvedMemeOverlay Overlay)>(overlays.Count);
        foreach (var ov in overlays)
        {
            overlayInputs.Add((nextInput++, ov));
            args.Add("-i");
            args.Add(ov.RelativePath);
        }

        if (overlays.Count == 0 && !hasSfx)
        {
            if (hasSpeech && hasBgm)
            {
                // Loudness-normalize speech to -16 LUFS, resample back from loudnorm's 192kHz to 48kHz stereo, then duck loopable BGM cleanly.
                var videoFilter = hasSubtitles ? "[0:v]ass=in/subs.ass[vout];" : string.Empty;
                var audioFilter = string.Create(CultureInfo.InvariantCulture,
                    $"[{speechIdx}:a]aresample=48000,aformat=channel_layouts=stereo,apad=whole_dur={durStr},loudnorm=I=-16:TP=-1.5:LRA=9,aresample=48000,aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,asplit=2[sp1][sp2];[{bgmIdx}:a]aresample=48000,aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,volume={bgmGainStr}[bg];[bg][sp1]sidechaincompress=threshold=0.025:ratio=3.5:attack=25:release=380[bgd];[sp2][bgd]amix=inputs=2:duration=first:normalize=0,aresample=async=1:min_hard_comp=0.005:first_pts=0,aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,afade=t=in:st=0:d=0.15,afade=t=out:st={fadeOutStart}:d=0.6[aout]");

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
                    "-map", $"{speechIdx}:a",
                    "-af", string.Create(CultureInfo.InvariantCulture, $"aresample=48000,aformat=channel_layouts=stereo,apad=whole_dur={durStr},loudnorm=I=-16:TP=-1.5:LRA=9,aresample=async=1:min_hard_comp=0.005:first_pts=0,aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo")
                ]);
                if (hasSubtitles)
                    args.AddRange(["-vf", "ass=in/subs.ass"]);
            }
            else if (hasBgm)
            {
                args.AddRange([
                    "-map", "0:v",
                    "-map", $"{bgmIdx}:a",
                    "-af", string.Create(CultureInfo.InvariantCulture, $"volume={bgmGainStr},aresample=async=1:min_hard_comp=0.005:first_pts=0,aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,afade=t=in:st=0:d=0.4,afade=t=out:st={fadeOutStart}:d=0.6")
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
        }
        else
        {
            var fc = new StringBuilder();
            var currentVideo = "0:v";
            var overlayYExpr = height >= width ? "H*0.16" : "H*0.19";
            for (var i = 0; i < overlayInputs.Count; i++)
            {
                var (idx, ov) = overlayInputs[i];
                var nextLabel = i == overlayInputs.Count - 1 && !hasSubtitles ? "vout" : $"vm{i}";
                var s = ov.StartSeconds.ToString("0.00", CultureInfo.InvariantCulture);
                var e = ov.EndSeconds.ToString("0.00", CultureInfo.InvariantCulture);
                fc.Append(CultureInfo.InvariantCulture,
                    $"[{currentVideo}][{idx}:v]overlay=(W-w)/2:{overlayYExpr}:eof_action=repeat:enable='between(t,{s},{e})'[{nextLabel}];");
                currentVideo = nextLabel;
            }
            if (hasSubtitles)
            {
                fc.Append(CultureInfo.InvariantCulture, $"[{currentVideo}]ass=in/subs.ass[vout];");
                currentVideo = "vout";
            }

            string? audioMap = null;
            var baseAudioLabel = hasSfx ? "abase" : "aout";
            if (hasSpeech && hasBgm)
            {
                fc.Append(CultureInfo.InvariantCulture,
                    $"[{speechIdx}:a]aresample=48000,aformat=channel_layouts=stereo,apad=whole_dur={durStr},loudnorm=I=-16:TP=-1.5:LRA=9,aresample=48000,aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,asplit=2[sp1][sp2];[{bgmIdx}:a]aresample=48000,aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,volume={bgmGainStr}[bg];[bg][sp1]sidechaincompress=threshold=0.025:ratio=3.5:attack=25:release=380[bgd];[sp2][bgd]amix=inputs=2:duration=first:normalize=0,aresample=async=1:min_hard_comp=0.005:first_pts=0,aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,afade=t=in:st=0:d=0.15,afade=t=out:st={fadeOutStart}:d=0.6[{baseAudioLabel}];");
                audioMap = $"[{baseAudioLabel}]";
            }
            else if (hasSpeech)
            {
                fc.Append(CultureInfo.InvariantCulture,
                    $"[{speechIdx}:a]aresample=48000,aformat=channel_layouts=stereo,apad=whole_dur={durStr},loudnorm=I=-16:TP=-1.5:LRA=9,aresample=async=1:min_hard_comp=0.005:first_pts=0,aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo[{baseAudioLabel}];");
                audioMap = $"[{baseAudioLabel}]";
            }
            else if (hasBgm)
            {
                fc.Append(CultureInfo.InvariantCulture,
                    $"[{bgmIdx}:a]volume={bgmGainStr},aresample=async=1:min_hard_comp=0.005:first_pts=0,aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,afade=t=in:st=0:d=0.4,afade=t=out:st={fadeOutStart}:d=0.6[{baseAudioLabel}];");
                audioMap = $"[{baseAudioLabel}]";
            }

            if (hasSfx)
            {
                if (audioMap is not null)
                {
                    fc.Append(CultureInfo.InvariantCulture,
                        $"[{sfxIdx}:a]aresample=48000,aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,volume=0.88[sfx];{audioMap}[sfx]amix=inputs=2:duration=first:normalize=0[aout];");
                    audioMap = "[aout]";
                }
                else
                {
                    fc.Append(CultureInfo.InvariantCulture,
                        $"[{sfxIdx}:a]aresample=async=1:min_hard_comp=0.005:first_pts=0,aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo[aout];");
                    audioMap = "[aout]";
                }
            }

            if (fc.Length > 0)
            {
                args.AddRange(["-filter_complex", fc.ToString().TrimEnd(';'), "-map", currentVideo == "0:v" ? "0:v" : $"[{currentVideo}]"]);
            }
            else
            {
                args.AddRange(["-map", "0:v"]);
            }
            if (audioMap is not null) args.AddRange(["-map", audioMap]);
        }

        args.AddRange(
        [
            "-c:v", "libx264",
            "-preset", "veryfast",
            "-crf", "22",
            "-pix_fmt", "yuv420p",
            "-movflags", "+faststart"
        ]);

        if (hasSpeech || hasBgm || hasSfx)
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

    private async Task<(List<ProceduralMemeCue> Cues, List<ResolvedMemeOverlay> Overlays)> ResolveMemeCutawaysAsync(
        string userId,
        ProceduralVideoRequest request,
        ProceduralDialoguePlan dialoguePlan,
        IRenderWorkspace workspace,
        string ffmpegExe,
        int width,
        int height,
        int durationSeconds,
        CancellationToken ct)
    {
        var cues = dialoguePlan.Memes.ToList();
        var isComedy = string.Equals(request.EventType, "FunnyComedy", StringComparison.OrdinalIgnoreCase)
            || request.Theme == ProceduralSceneTheme.ComedyStage3D;

        List<EffectClip> playables = [];
        if (effects is not null && !string.IsNullOrWhiteSpace(userId) && (cues.Count > 0 || isComedy))
        {
            try
            {
                var all = await effects.ListByUserAsync(userId, 200, ct).ConfigureAwait(false);
                playables = ComedyCraftGuide.RankReactionMemes(all)
                    .Where(c => c.Kind is AssetKind.Image or AssetKind.Video && !string.IsNullOrWhiteSpace(c.StorageKey))
                    .ToList();
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogDebug(ex, "Could not list user effects for procedural meme cutaways.");
            }
        }

        // Auto-inject one climax reaction meme for FunnyComedy when library memes exist and script didn't include [MEME]
        // (placed cleanly right as the punchline lands so it never blocks mid-dialogue speech).
        if (cues.Count == 0 && isComedy && playables.Count > 0 && dialoguePlan.Turns.Count >= 4)
        {
            var lastSpokenIdx = Math.Max(1, dialoguePlan.Turns.Count - 1);
            var anchor = Math.Max(1.0, dialoguePlan.Turns[lastSpokenIdx].EndSeconds - 0.10);
            cues.Add(new ProceduralMemeCue(lastSpokenIdx, playables[0].Name, playables[0].Name, 1.05, Math.Round(anchor, 2)));
        }

        if (cues.Count == 0 || playables.Count == 0)
            return (cues, []);

        var overlays = new List<ResolvedMemeOverlay>();
        var boxW = Math.Clamp((int)Math.Round(width * 0.36), 196, 440);
        var boxH = Math.Clamp((int)Math.Round(boxW * 0.68), 145, 320);
        var usedIds = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        for (var i = 0; i < cues.Count && i < DialogueScriptParser.MaxMemeCues; i++)
        {
            var cue = cues[i];
            var matched = ComedyCraftGuide.MatchLibraryMeme(cue.Name, playables)
                ?? playables.FirstOrDefault(p => !usedIds.Contains(p.Id))
                ?? playables[0];
            usedIds.Add(matched.Id);

            try
            {
                await using var stream = await objectStore.OpenAsync(matched.StorageKey!, ct).ConfigureAwait(false);
                if (stream is null) continue;

                var ext = matched.Kind == AssetKind.Video ? ".mp4" : ".img";
                var srcRel = $"in/meme_src_{i}{ext}";
                var srcAbs = workspace.Resolve(srcRel);
                Directory.CreateDirectory(Path.GetDirectoryName(srcAbs)!);
                await using (var fs = File.Create(srcAbs))
                {
                    await stream.CopyToAsync(fs, ct).ConfigureAwait(false);
                }

                var pngRel = $"in/meme_{i}.png";
                var pngAbs = workspace.Resolve(pngRel);
                if (await RenderMemeOverlayPngAsync(ffmpegExe, srcAbs, pngAbs, boxW, boxH, matched.Kind == AssetKind.Video, ct).ConfigureAwait(false))
                {
                    var start = Math.Clamp(cue.StartSeconds, 0.4, Math.Max(0.5, durationSeconds - 0.8));
                    var end = Math.Clamp(start + cue.Seconds, start + 0.5, Math.Max(start + 0.5, durationSeconds - 0.1));
                    overlays.Add(new ResolvedMemeOverlay(pngRel, start, end));
                }
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogDebug(ex, "Skipping meme cutaway '{Name}' during procedural render.", cue.Name);
            }
        }

        return (cues, overlays);
    }

    private static async Task<bool> RenderMemeOverlayPngAsync(
        string ffmpegExe,
        string srcPath,
        string outPngPath,
        int boxW,
        int boxH,
        bool isVideo,
        CancellationToken ct)
    {
        var startInfo = new ProcessStartInfo
        {
            FileName = ffmpegExe,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            RedirectStandardInput = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };
        startInfo.ArgumentList.Add("-hide_banner");
        startInfo.ArgumentList.Add("-loglevel");
        startInfo.ArgumentList.Add("error");
        startInfo.ArgumentList.Add("-y");
        if (isVideo)
        {
            startInfo.ArgumentList.Add("-ss");
            startInfo.ArgumentList.Add("0.4");
        }
        startInfo.ArgumentList.Add("-i");
        startInfo.ArgumentList.Add(srcPath);
        startInfo.ArgumentList.Add("-vf");
        startInfo.ArgumentList.Add($"scale={boxW - 12}:{boxH - 12}:force_original_aspect_ratio=decrease,pad={boxW}:{boxH}:(ow-iw)/2:(oh-ih)/2:color=#F97316@0.92,format=rgba");
        startInfo.ArgumentList.Add("-frames:v");
        startInfo.ArgumentList.Add("1");
        startInfo.ArgumentList.Add(outPngPath);

        using var proc = Process.Start(startInfo);
        if (proc is null) return false;
        proc.StandardInput.Close();
        using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(ct);
        timeoutCts.CancelAfter(TimeSpan.FromSeconds(15));
        _ = proc.StandardError.ReadToEndAsync(timeoutCts.Token);
        await proc.WaitForExitAsync(timeoutCts.Token).ConfigureAwait(false);
        return proc.ExitCode == 0 && File.Exists(outPngPath);
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

    /// <summary>
    /// Reads an FFmpeg output stream to the end, counting every chunk as progress for the watchdog, and keeps only the
    /// tail so a chatty encode cannot grow memory without bound.
    /// </summary>
    private static async Task<string> DrainAsync(StreamReader reader, RenderStallWatchdog watchdog, CancellationToken ct)
    {
        var log = new StringBuilder();
        var chunk = new char[4096];
        try
        {
            int read;
            while ((read = await reader.ReadAsync(chunk.AsMemory(), ct).ConfigureAwait(false)) > 0)
            {
                watchdog.Touch();
                log.Append(chunk, 0, read);
                if (log.Length > MaxFfmpegLogChars * 2) log.Remove(0, log.Length - MaxFfmpegLogChars);
            }
        }
        catch (OperationCanceledException)
        {
            // The render was cancelled or stalled; the caller reports that, and whatever was read is still useful.
        }
        return log.ToString();
    }

    private static async Task<bool> TranscodeCustomBgmAsync(
        string ffmpegExe,
        string inputPath,
        string outputWavPath,
        int maxSeconds,
        CancellationToken ct)
    {
        var dir = Path.GetDirectoryName(outputWavPath);
        if (!string.IsNullOrWhiteSpace(dir)) Directory.CreateDirectory(dir);

        var startInfo = new ProcessStartInfo
        {
            FileName = ffmpegExe,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            RedirectStandardInput = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };
        var limit = Math.Clamp(maxSeconds, 10, ProceduralVideoRequest.MaxSeconds).ToString(System.Globalization.CultureInfo.InvariantCulture);
        foreach (var arg in new[]
        {
            "-y",
            "-i", inputPath,
            "-vn",
            "-t", limit,
            "-af", "aresample=48000,aformat=channel_layouts=stereo,highpass=f=60,lowpass=f=12000,loudnorm=I=-22:TP=-2:LRA=8,aresample=48000,aformat=sample_fmts=s16:sample_rates=48000:channel_layouts=stereo,afade=t=in:st=0:d=0.6",
            "-ar", "48000",
            "-ac", "2",
            "-c:a", "pcm_s16le",
            outputWavPath
        })
        {
            startInfo.ArgumentList.Add(arg);
        }

        using var proc = Process.Start(startInfo);
        if (proc is null) return false;
        proc.StandardInput.Close();
        using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(ct);
        timeoutCts.CancelAfter(TimeSpan.FromSeconds(Math.Max(45, maxSeconds / 12)));
        _ = proc.StandardError.ReadToEndAsync(timeoutCts.Token);
        await proc.WaitForExitAsync(timeoutCts.Token).ConfigureAwait(false);
        return proc.ExitCode == 0 && File.Exists(outputWavPath);
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
