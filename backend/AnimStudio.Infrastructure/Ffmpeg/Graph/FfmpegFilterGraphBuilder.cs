using System.Text;
using AnimStudio.Application.Abstractions.Rendering;
using AnimStudio.Application.Rendering;
using AnimStudio.Application.Rendering.Models;
using AnimStudio.Domain.Errors;
using AnimStudio.Domain.Rendering;

namespace AnimStudio.Infrastructure.Ffmpeg.Graph;

/// <summary>
/// Generates ffmpeg invocations from render plans.
/// <para>
/// Deterministic and side-effect free: same plan in, byte-identical graph out. It takes
/// workspace-relative paths (already resolved by the caller) and an injected capability
/// set, so it never touches storage and never probes the renderer. That is what lets the
/// entire compositing surface be asserted as golden strings with no ffmpeg installed.
/// </para>
/// </summary>
public sealed class FfmpegFilterGraphBuilder(IRenderCapabilities capabilities) : IFilterGraphBuilder
{
    public FilterGraphPlan BuildScene(SceneRenderPlan plan)
    {
        ArgumentNullException.ThrowIfNull(plan);
        plan.Canvas.Validate();

        if (plan.Duration.Value <= 0)
            throw new RenderException(RenderErrorCode.InvalidSceneDuration,
                $"Scene {plan.SceneIndex + 1} has no duration.");

        var rate = plan.Canvas.FrameRate;
        var seconds = FilterExpr.Sec(plan.Duration, rate);
        var warnings = new List<string>();
        var inputs = new List<FfmpegInputSpec>();
        var graph = new StringBuilder();

        // --- input 0: the background still, driven as a real timed stream so zoompan can
        // treat "on" as the output frame index.
        inputs.Add(new FfmpegInputSpec(
            ["-loop", "1", "-framerate", rate.ToFfmpegRate(), "-t", seconds],
            plan.BackgroundRelativePath));

        var motion = capabilities.Supports(RenderFeature.KenBurns)
            ? BackgroundMotionFilters.Build(plan.BackgroundAnimation, plan.Canvas, plan.Duration)
            : $"scale={plan.Canvas.Size}";

        if (!capabilities.Supports(RenderFeature.KenBurns)
            && plan.BackgroundAnimation.Background != BackgroundEffect.None)
        {
            warnings.Add("BACKGROUND_MOTION_UNAVAILABLE");
        }

        // Staying at 4:4:4 through the overlay and subtitle chain avoids blending sprite
        // edges in chroma-subsampled space, which shows up as colour fringing on every
        // character outline. The single conversion to yuv420p happens at the very end.
        graph.Append($"[0:v]{BackgroundMotionFilters.Prepare(plan.Canvas, plan.KenBurnsSupersample)},")
             .Append(motion)
             .Append(",format=yuv444p[bg];\n");

        // --- sprite inputs, ordered by z-order so later overlays land on top.
        var sprites = plan.Sprites.OrderBy(s => s.ZOrder).ToList();
        var spriteLabels = new List<(SpritePlan Sprite, string Closed, string? Open)>();

        foreach (var sprite in sprites)
        {
            var index = spriteLabels.Count;

            var closedInput = inputs.Count;
            // No -loop/-t: a sprite is a single frame and overlay's default eof_action
            // repeats it for the whole scene, so we decode 1 frame instead of hundreds.
            inputs.Add(new FfmpegInputSpec([], sprite.ClosedMouthRelativePath));

            var closedLabel = $"s{index}c";
            graph.Append(SpriteChain(closedInput, closedLabel, sprite));

            string? openLabel = null;
            if (sprite.OpenMouthRelativePath is not null && sprite.SpeakingWindows.Count > 0)
            {
                var openInput = inputs.Count;
                inputs.Add(new FfmpegInputSpec([], sprite.OpenMouthRelativePath));
                openLabel = $"s{index}o";
                graph.Append(SpriteChain(openInput, openLabel, sprite));
            }
            else if (sprite.OpenMouthRelativePath is null)
            {
                warnings.Add($"MOUTH_FLAP_UNAVAILABLE:{sprite.CharacterId}");
            }

            spriteLabels.Add((sprite, closedLabel, openLabel));
        }

        // --- composite the sprites over the background.
        var current = "bg";
        var stage = 0;
        foreach (var (sprite, closedLabel, openLabel) in spriteLabels)
        {
            var (x, y) = SpriteOverlayFilters.WithEntrance(sprite, rate);
            var (closedEnable, openEnable) =
                SpriteOverlayFilters.MouthEnables(sprite, rate, plan.MouthFlapHz);

            var next = $"v{++stage}";
            graph.Append(Overlay(current, closedLabel, next, x, y, closedEnable));
            current = next;

            if (openLabel is not null && openEnable.Length > 0)
            {
                next = $"v{++stage}";
                graph.Append(Overlay(current, openLabel, next, x, y, openEnable));
                current = next;
            }
        }

        // --- burned-in subtitles, per scene with scene-relative timings.
        if (plan.SubtitleRelativePath is not null)
        {
            if (capabilities.Supports(RenderFeature.BurnedSubtitles))
            {
                var next = $"v{++stage}";
                var fonts = plan.FontsDirRelativePath is null
                    ? string.Empty
                    : $":fontsdir={plan.FontsDirRelativePath}";
                graph.Append($"[{current}]subtitles=filename={plan.SubtitleRelativePath}{fonts}:alpha=1[{next}];\n");
                current = next;
            }
            else
            {
                // Degrade rather than fail: a render without subtitles is still useful.
                warnings.Add("SUBTITLES_DEGRADED");
            }
        }

        // --- scene fades, then the one conversion to the delivery pixel format.
        var fades = SceneFades(plan.BackgroundAnimation, plan.Duration, rate);
        graph.Append($"[{current}]{(fades.Length > 0 ? fades + "," : string.Empty)}format={plan.Encoder.PixelFormat}[vout];\n");

        // --- audio.
        int audioInput;
        if (plan.AudioRelativePath is not null)
        {
            audioInput = inputs.Count;
            inputs.Add(new FfmpegInputSpec([], plan.AudioRelativePath));
        }
        else
        {
            // Every scene must have exactly one video and one audio stream, or both concat
            // and the acrossfade chain break in confusing ways later.
            audioInput = inputs.Count;
            inputs.Add(new FfmpegInputSpec(
                ["-f", "lavfi", "-t", seconds],
                $"anullsrc=channel_layout=stereo:sample_rate={plan.Encoder.AudioSampleRate}")
            { IsLavfi = true });
        }

        var audioChain = AudioFilters.SceneChain(plan.Duration, rate, plan.Encoder,
            plan.AudioSliceStartSeconds, plan.AudioSliceEndSeconds);
        var audioFades = AudioFilters.SceneFades(plan.Duration, rate);
        graph.Append($"[{audioInput}:a]{audioChain}")
             .Append(audioFades.Length > 0 ? "," + audioFades : string.Empty)
             .Append("[aout]");

        return new FilterGraphPlan
        {
            Inputs = inputs,
            FilterComplex = graph.ToString(),
            OutputArguments = SceneOutputArguments(plan),
            OutputRelativePath = plan.OutputRelativePath,
            ExpectedFrames = plan.Duration,
            Warnings = warnings
        };
    }

    private static string SpriteChain(int inputIndex, string label, SpritePlan sprite)
    {
        // -2 keeps the width even for yuv420p; format=rgba guarantees an alpha plane even
        // if the source was a palette PNG, which would otherwise composite as a solid box.
        var flip = sprite.FlipHorizontal ? "hflip," : string.Empty;
        return $"[{inputIndex}:v]scale=-2:{sprite.HeightPixels}:flags=lanczos,"
             + $"{flip}format=rgba,setsar=1[{label}];\n";
    }

    private static string Overlay(
        string baseLabel, string spriteLabel, string outLabel, string x, string y, string enable) =>
        $"[{baseLabel}][{spriteLabel}]overlay=eval=frame:format=yuv444:eof_action=repeat"
        + $":x={FilterExpr.Quote(x)}:y={FilterExpr.Quote(y)}"
        + $":enable={FilterExpr.Quote(enable)}[{outLabel}];\n";

    private static string SceneFades(AnimationSettings animation, FrameCount duration, FrameRate rate)
    {
        var parts = new List<string>();

        if (animation.FadeIn.Value > 0)
            parts.Add($"fade=t=in:st=0:d={FilterExpr.Sec(animation.FadeIn, rate)}");

        if (animation.FadeOut.Value > 0)
        {
            var start = duration.ToSeconds(rate) - animation.FadeOut.ToSeconds(rate);
            parts.Add($"fade=t=out:st={FilterExpr.N(Math.Max(start, 0))}"
                    + $":d={FilterExpr.Sec(animation.FadeOut, rate)}");
        }

        return string.Join(',', parts);
    }

    private static List<string> SceneOutputArguments(SceneRenderPlan plan)
    {
        var rate = plan.Canvas.FrameRate;
        return
        [
            "-map", "[vout]",
            "-map", "[aout]",
            // Exact frame count, so every xfade offset downstream is exactly as planned.
            "-frames:v", FilterExpr.N(plan.Duration.Value),
            "-c:v", plan.Encoder.VideoCodec,
            "-preset", plan.Encoder.Preset,
            "-crf", FilterExpr.N(plan.Encoder.Crf),
            "-pix_fmt", plan.Encoder.PixelFormat,
            "-profile:v", "high",
            "-r", rate.ToFfmpegRate(),
            "-fps_mode", "cfr",
            // Fixed 2s GOP with no scene-cut keyframes keeps a later -c copy concat legal.
            "-g", FilterExpr.N((int)(rate.AsDouble * 2)),
            "-keyint_min", FilterExpr.N((int)(rate.AsDouble * 2)),
            "-sc_threshold", "0",
            "-colorspace", "bt709",
            "-color_primaries", "bt709",
            "-color_trc", "bt709",
            "-c:a", plan.Encoder.AudioCodec,
            "-b:a", $"{plan.Encoder.AudioBitrateKbps}k",
            "-ar", FilterExpr.N(plan.Encoder.AudioSampleRate),
            "-ac", FilterExpr.N(plan.Encoder.AudioChannels),
            // A timescale that is an exact multiple of the frame rate avoids PTS rounding
            // at the concat joins.
            "-video_track_timescale", FilterExpr.N((int)(rate.AsDouble * 1000)),
            "-movflags", "+faststart"
        ];
    }

    public FilterGraphPlan BuildMerge(MergePlan plan)
    {
        ArgumentNullException.ThrowIfNull(plan);
        if (plan.Scenes.Count == 0)
            throw new RenderException(RenderErrorCode.NoScenes, "This project has no scenes to render.");

        var lengths = plan.Lengths;
        var durations = plan.TransitionDurations;
        RenderTimeline.Validate(lengths, durations);

        var hasMusic = plan.BackgroundMusicRelativePath is not null;
        var total = RenderTimeline.TotalLength(lengths, durations);

        var canCopy = RenderTimeline.CanStreamCopy(durations, hasMusic)
                      || (durations.All(d => d.Value == 0)
                          && !capabilities.Supports(RenderFeature.CrossFadeTransitions));

        return canCopy
            ? BuildConcatMerge(plan, total)
            : BuildXfadeMerge(plan, lengths, durations, total, hasMusic);
    }

    /// <summary>
    /// Stream-copy concat. Legal only because every scene was encoded with identical
    /// settings; it costs seconds instead of minutes and loses no quality at all.
    /// </summary>
    private static FilterGraphPlan BuildConcatMerge(MergePlan plan, FrameCount total) =>
        new()
        {
            Inputs = [new FfmpegInputSpec(["-f", "concat", "-safe", "0"], plan.ConcatListRelativePath)],
            FilterComplex = string.Empty,
            IsStreamCopy = true,
            OutputArguments = ["-c", "copy", "-movflags", "+faststart"],
            OutputRelativePath = plan.OutputRelativePath,
            ExpectedFrames = total
        };

    private FilterGraphPlan BuildXfadeMerge(
        MergePlan plan, IReadOnlyList<FrameCount> lengths, IReadOnlyList<FrameCount> durations,
        FrameCount total, bool hasMusic)
    {
        var rate = plan.Canvas.FrameRate;
        var offsets = RenderTimeline.XfadeOffsets(lengths, durations);
        var graph = new StringBuilder();
        var inputs = new List<FfmpegInputSpec>();
        var warnings = new List<string>();

        foreach (var scene in plan.Scenes)
            inputs.Add(new FfmpegInputSpec([], scene.RelativePath));

        // Normalize every input. Two constraints, both easy to break by "tidying" this line:
        //
        //  1. setpts=PTS-STARTPTS is required because xfade measures its offset on the
        //     first input's timeline, so a non-zero start PTS shifts every transition.
        //  2. The FILTER ORDER MATTERS. setpts rewrites timestamps and in doing so
        //     invalidates the stream's frame-rate metadata, so fps= must come AFTER it.
        //     With fps first (or with settb=AVTB anywhere in the chain), xfade rejects the
        //     input with "The inputs needs to be a constant frame rate; current rate of
        //     1/0 is invalid".
        for (var i = 0; i < plan.Scenes.Count; i++)
        {
            graph.Append($"[{i}:v]format={plan.Encoder.PixelFormat},setsar=1,")
                 .Append($"setpts=PTS-STARTPTS,fps={rate.ToFfmpegRate()}[v{i}];\n");
        }

        var videoLabel = "v0";
        for (var k = 0; k < durations.Count; k++)
        {
            var transition = plan.Scenes[k].TransitionToNext;
            var name = transition.ToXfadeName() ?? "fade";
            var next = $"vx{k}";

            graph.Append($"[{videoLabel}][v{k + 1}]xfade=transition={name}")
                 .Append($":duration={FilterExpr.Sec(durations[k], rate)}")
                 .Append($":offset={FilterExpr.Sec(offsets[k], rate)}[{next}];\n");
            videoLabel = next;
        }

        graph.Append($"[{videoLabel}]format={plan.Encoder.PixelFormat}[vfinal];\n");

        // Audio mirrors the video chain. acrossfade consumes audio with exactly the same
        // arithmetic xfade uses, so driving both from the same durations keeps them locked.
        // Using concat here instead would leave audio long by the sum of all transitions -
        // twenty 0.5s transitions is ten seconds of drift by the end.
        for (var i = 0; i < plan.Scenes.Count; i++)
        {
            graph.Append($"[{i}:a]{AudioFilters.Format(plan.Encoder)},asetpts=N/SR/TB[a{i}];\n");
        }

        var audioLabel = "a0";
        var useAudioCrossfade = capabilities.Supports(RenderFeature.AudioCrossFade);
        if (!useAudioCrossfade && durations.Count > 0) warnings.Add("AUDIO_CROSSFADE_UNAVAILABLE");

        for (var k = 0; k < durations.Count; k++)
        {
            var next = $"ax{k}";
            if (useAudioCrossfade)
            {
                // Filter options attach with '=', not ':': "acrossfade:d=0.5" is a parse error.
                graph.Append($"[{audioLabel}][a{k + 1}]acrossfade")
                     .Append($"=d={FilterExpr.Sec(durations[k], rate)}:c1=tri:c2=tri[{next}];\n");
            }
            else
            {
                graph.Append($"[{audioLabel}][a{k + 1}]concat=n=2:v=0:a=1[{next}];\n");
            }

            audioLabel = next;
        }

        if (hasMusic)
        {
            var musicInput = inputs.Count;
            inputs.Add(new FfmpegInputSpec(["-stream_loop", "-1"], plan.BackgroundMusicRelativePath!));

            graph.Append($"[{musicInput}:a]")
                 .Append(AudioFilters.MusicBed(plan.BackgroundMusicVolume, total, rate, plan.Encoder))
                 .Append("[music];\n")
                 .Append($"[{audioLabel}][music]")
                 .Append(AudioFilters.Mix(capabilities.Supports(RenderFeature.AudioLimiter)))
                 .Append("[afinal]");
        }
        else
        {
            graph.Append($"[{audioLabel}]anull[afinal]");
        }

        var rateArguments = new List<string>
        {
            "-map", "[vfinal]",
            "-map", "[afinal]",
            "-frames:v", FilterExpr.N(total.Value),
            "-c:v", plan.Encoder.VideoCodec,
            "-preset", plan.Encoder.Preset,
            "-crf", FilterExpr.N(plan.Encoder.Crf),
            "-pix_fmt", plan.Encoder.PixelFormat,
            "-r", rate.ToFfmpegRate(),
            "-fps_mode", "cfr",
            "-c:a", plan.Encoder.AudioCodec,
            "-b:a", $"{plan.Encoder.AudioBitrateKbps}k",
            "-ar", FilterExpr.N(plan.Encoder.AudioSampleRate),
            "-ac", FilterExpr.N(plan.Encoder.AudioChannels),
            "-movflags", "+faststart"
        };

        return new FilterGraphPlan
        {
            Inputs = inputs,
            FilterComplex = graph.ToString(),
            OutputArguments = rateArguments,
            OutputRelativePath = plan.OutputRelativePath,
            ExpectedFrames = total,
            Warnings = warnings
        };
    }
}
