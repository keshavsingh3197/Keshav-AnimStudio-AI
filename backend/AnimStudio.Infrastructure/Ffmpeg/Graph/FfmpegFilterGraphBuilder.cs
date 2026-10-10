using System.Text;
using AnimStudio.Application.Abstractions.Rendering;
using AnimStudio.Application.Rendering;
using AnimStudio.Application.Rendering.Models;
using AnimStudio.Domain.Errors;
using AnimStudio.Domain.Jobs;
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

    /// <summary>
    /// Conforms one source clip to the canvas and burns in the watermark.
    /// <para>
    /// Everything here exists to make the JOIN cheap. Clips arrive from phones, screen
    /// recorders and other editors, so they agree on nothing: resolution, frame rate, pixel
    /// format, sample rate, channel count, even whether there is an audio track. This pass
    /// forces all of it to one shape - the same shape <see cref="BuildScene"/> produces -
    /// which is what lets <see cref="BuildMerge"/> stitch the results with a stream copy
    /// that takes seconds and loses nothing.
    /// </para>
    /// <para>
    /// The single most important line is the audio one. Every clip MUST come out with
    /// exactly one video and one audio stream of the same length, or the concat demuxer
    /// produces a file that plays the first clip and then stalls - and a silent clip in the
    /// middle of the list is the normal way to discover that.
    /// </para>
    /// </summary>
    public FilterGraphPlan BuildClip(ClipRenderPlan plan)
    {
        ArgumentNullException.ThrowIfNull(plan);
        plan.Canvas.Validate();

        if (plan.EndCard is { } card) return BuildEndCard(plan, card);

        var canvas = plan.Canvas;
        var rate = canvas.FrameRate;
        var warnings = new List<string>();
        var inputArgsList = new List<string>();
        if (plan.SourceIsImage)
        {
            inputArgsList.AddRange(["-loop", "1", "-t", FilterExpr.N(plan.ImageDurationSeconds)]);
        }
        else
        {
            if (plan.TrimStartSeconds.HasValue && plan.TrimStartSeconds.Value > 0)
            {
                inputArgsList.AddRange(["-ss", FilterExpr.N(plan.TrimStartSeconds.Value)]);
            }

            // Using -t (duration to extract) instead of -to is bulletproof across FFmpeg versions:
            // -to as an input option can prematurely stop depending on container start timestamps or keyframe seeking.
            double? durationToExtract = null;
            if (plan.TrimEndSeconds.HasValue && plan.TrimEndSeconds.Value > (plan.TrimStartSeconds ?? 0))
            {
                durationToExtract = plan.TrimEndSeconds.Value - (plan.TrimStartSeconds ?? 0);
            }
            else if (plan.DurationSeconds.HasValue && plan.DurationSeconds.Value > 0)
            {
                durationToExtract = plan.DurationSeconds.Value;
            }

            if (durationToExtract.HasValue && durationToExtract.Value > 0)
            {
                inputArgsList.AddRange(["-t", FilterExpr.N(durationToExtract.Value)]);
            }
        }
        var inputs = new List<FfmpegInputSpec> { new(inputArgsList, plan.SourceRelativePath) };
        var graph = new StringBuilder();

        var fit = plan.Fit;
        if (fit == ClipFit.BlurredBackdrop && !capabilities.Supports(RenderFeature.BlurBackdrop))
        {
            // Degrade rather than fail: black bars are a worse backdrop, not a broken video.
            warnings.Add("BLUR_BACKDROP_UNAVAILABLE");
            fit = ClipFit.Contain;
        }

        // The whole chain runs in the delivery pixel format, mark or no mark. Compositing a
        // watermark in 4:4:4 used to be the rule here, to keep chroma fringing off a logo's
        // edges - but it converts every full-resolution frame up and back down to soften a
        // 60-pixel strip. Measured on 1080p clips with the logo mark: 4:4:4 cost 29% of the
        // conform pass at veryfast, for an SSIM difference of 0.001 against a lossless
        // reference. Every clip of a watermarked stitch pays it, so it is not worth it.
        var mark = plan.Watermark;

        var drawsLogo = mark is { Kind: WatermarkKind.Logo }
                        && mark.LogoRelativePath is { Length: > 0 };

        var wantsText = mark is { Kind: WatermarkKind.Text }
                        && mark.TextRelativePath is { Length: > 0 };

        // A font FILE is as much a precondition as the drawtext filter itself. Without one
        // the only other spelling is font=, which resolves the family through fontconfig -
        // and on a build with fontconfig but no fonts.conf (every stock Windows ffmpeg)
        // that lookup crashes the process with an access violation instead of reporting a
        // missing font. Skipping the mark loses a decoration; emitting the filter loses the
        // render.
        var canDrawText = capabilities.Supports(RenderFeature.DrawText)
                          && mark?.FontFilePath is { Length: > 0 };

        if (wantsText && !canDrawText) warnings.Add("WATERMARK_UNAVAILABLE");

        var drawsText = wantsText && canDrawText;

        // Another mark burned into the source is wiped first, on the untouched frame, so
        // the region means the same patch of footage however the clip is then framed - and
        // our own watermark, drawn below, is never under it.
        var source = EraseFilters.Append(
            graph, "0:v", plan.EraseRegions, out var markAlreadyInBox, mark, capabilities, inputs, warnings);

        // A "My mark" box already put our watermark where theirs was; a second copy in the
        // corner is only drawn when the box asked for it.
        if (markAlreadyInBox)
        {
            drawsLogo = false;
            drawsText = false;
        }

        graph.Append(FitChain(fit, canvas, rate, plan.Encoder.PixelFormat, plan, source));

        var current = "base";
        var stage = 0;

        if (drawsLogo)
        {
            var logoInput = inputs.Count;
            // No -loop/-t: the logo is one frame, and overlay's eof_action=repeat holds it
            // for the whole clip, so we decode it once instead of once per frame.
            inputs.Add(new FfmpegInputSpec([], mark!.LogoRelativePath!));

            graph.Append(WatermarkFilters.LogoChain(logoInput, "wmk", mark));

            var next = $"w{++stage}";
            graph.Append(WatermarkFilters.LogoOverlay(current, "wmk", next, mark));
            current = next;
        }
        else if (drawsText)
        {
            var next = $"w{++stage}";
            graph.Append(WatermarkFilters.DrawText(current, next, mark!));
            current = next;
        }

        // Freeze-frame padding for transition overlap. xfade needs extra frames at each
        // clip boundary so the dissolve has real material to work with rather than stealing
        // from the clip's own visible content. tpad=stop_mode=clone repeats the last decoded
        // frame; tpad=start_mode=clone prepends copies of the first frame. Both happen BEFORE
        // the final format= so the padded region is already in the delivery pixel format when
        // xfade reads it. The video is padded first, then audio extends to match via apad
        // (-shortest in the output args ends the file at the video's last frame, which now
        // includes the frozen tail, so audio pads to exactly that length and no further).
        var needsTailFreeze = plan.FreezeTail && plan.TailOutSeconds > 0;
        var needsHeadFreeze = plan.FreezeHead && plan.LeadInSeconds > 0;

        if (needsHeadFreeze || needsTailFreeze)
        {
            var startPad = needsHeadFreeze
                ? $"start_mode=clone:start_duration={FilterExpr.N(plan.LeadInSeconds)}:"
                : string.Empty;
            var stopPad = needsTailFreeze
                ? $"stop_mode=clone:stop_duration={FilterExpr.N(plan.TailOutSeconds)}"
                : string.Empty;
            var padArgs = startPad + stopPad;
            // Trim trailing ':' if only one side is set.
            padArgs = padArgs.TrimEnd(':');
            var padLabel = $"p{++stage}";
            graph.Append($"[{current}]tpad={padArgs}[{padLabel}];\n");
            current = padLabel;
        }

        graph.Append($"[{current}]format={plan.Encoder.PixelFormat}[vout];\n");

        // --- audio.
        graph.Append(ClipAudio(plan, inputs));

        return new FilterGraphPlan
        {
            Inputs = inputs,
            FilterComplex = graph.ToString(),
            OutputArguments = ClipOutputArguments(plan),
            OutputRelativePath = plan.OutputRelativePath,
            ExpectedFrames = plan.ExpectedFrames,
            Warnings = warnings
        };
    }

    /// <summary>
    /// A "support us" end card: plain background, QR code on a white quiet-zone square,
    /// headline above and small text below. Output arguments and the silent audio stream
    /// are a normal clip's, so the card joins a stitch by stream copy like any other clip.
    /// <para>
    /// The code is scaled with <c>neighbor</c>: any smoothing blurs module edges, and a
    /// blurred QR code is one a phone takes noticeably longer to lock on to.
    /// </para>
    /// </summary>
    private FilterGraphPlan BuildEndCard(ClipRenderPlan plan, EndCardPlan card)
    {
        var canvas = plan.Canvas;
        var rate = canvas.FrameRate;
        var warnings = new List<string>();
        var duration = FilterExpr.N(plan.ImageDurationSeconds);

        var inputs = new List<FfmpegInputSpec>
        {
            new(["-f", "lavfi"],
                $"color=c=0x{card.BackgroundRgb}:s={canvas.Width}x{canvas.Height}"
                + $":r={rate.ToFfmpegRate()}:d={duration}")
            { IsLavfi = true }
        };

        var graph = new StringBuilder();
        graph.Append("[0:v]setsar=1");
        if (card.BoxSize > 0)
        {
            graph.Append($",drawbox=x={card.BoxX}:y={card.BoxY}:w={card.BoxSize}:h={card.BoxSize}")
                 .Append(":color=white:t=fill");
        }
        graph.Append("[bg];\n");
        var current = "bg";

        if (card.QrRelativePath is { Length: > 0 } qr && card.BoxSize > 0)
        {
            // One frame, held by eof_action=repeat - the same trick the logo watermark uses.
            var qrInput = inputs.Count;
            inputs.Add(new FfmpegInputSpec([], qr));

            graph.Append($"[{qrInput}:v]scale={card.QrSize}:{card.QrSize}")
                 .Append(":force_original_aspect_ratio=decrease:flags=neighbor,format=rgba[qr];\n")
                 .Append($"[{current}][qr]overlay=x={card.BoxX}+({card.BoxSize}-overlay_w)/2")
                 .Append($":y={card.BoxY}+({card.BoxSize}-overlay_h)/2:eof_action=repeat:format=auto[cq];\n");
            current = "cq";
        }

        var canDrawText = capabilities.Supports(RenderFeature.DrawText);
        if (card.Lines.Count > 0 && !canDrawText) warnings.Add("ENDCARD_TEXT_UNAVAILABLE");

        if (canDrawText)
        {
            // text_shaping is on by default where ffmpeg has HarfBuzz; it is what joins
            // Devanagari conjuncts and places vowel signs instead of drawing them loose.
            for (var i = 0; i < card.Lines.Count; i++)
            {
                var line = card.Lines[i];
                var label = $"ct{i}";

                graph.Append($"[{current}]drawtext=")
                     .Append($"textfile={FilterExpr.Quote(FilterExpr.Path(line.TextRelativePath))}")
                     .Append($":fontfile={FilterExpr.Quote(FilterExpr.Path(line.FontFilePath))}")
                     .Append($":reload=0:fontsize={line.FontPixels}")
                     .Append($":fontcolor=0x{card.TextRgb}@{FilterExpr.N(line.Opacity)}")
                     .Append($":x=(w-text_w)/2:y={line.Y}[{label}];\n");
                current = label;
            }
        }

        var fadeIn = card.FadeInSeconds > 0
            ? $"fade=t=in:st=0:d={FilterExpr.N(card.FadeInSeconds)},"
            : string.Empty;
        graph.Append($"[{current}]{fadeIn}format={plan.Encoder.PixelFormat}[vout];\n");
        graph.Append(ClipAudio(plan, inputs));

        return new FilterGraphPlan
        {
            Inputs = inputs,
            FilterComplex = graph.ToString(),
            OutputArguments = ClipOutputArguments(plan),
            OutputRelativePath = plan.OutputRelativePath,
            ExpectedFrames = plan.ExpectedFrames,
            Warnings = warnings
        };
    }

    /// <summary>
    /// One clip's audio, ending at <c>[aout]</c> - which every clip MUST produce, even a
    /// silent one, or the concat demuxer writes a file that plays the first clip and stalls.
    /// <para>
    /// Four cases, and they collapse into two questions: is the clip's own sound wanted,
    /// and is there another file to play over it. A level of zero is treated as "not
    /// wanted" rather than emitted as <c>volume=0</c>, which saves decoding a stream in
    /// order to multiply it by nothing.
    /// </para>
    /// <para>
    /// <c>apad</c> with no length, against <c>-shortest</c> on the output, is what keeps
    /// audio and video the same length however the source behaved - a sound shorter than
    /// its clip runs into silence, and one longer is cut at the clip's end. Trimming to a
    /// container's declared duration instead would truncate every clip whose header lies.
    /// </para>
    /// </summary>
    private string ClipAudio(ClipRenderPlan plan, List<FfmpegInputSpec> inputs)
    {
        var format = AudioFilters.Format(plan.Encoder);

        var ownVolume = Math.Clamp(plan.AudioVolume, 0, ClipAudioSpec.MaxGain);
        var usesOwn = plan.SourceHasAudio && !plan.MuteAudio && ownVolume > 0;

        var extraVolume = Math.Clamp(plan.ExtraAudioVolume, 0, ClipAudioSpec.MaxGain);
        var hasExtra = plan.ExtraAudioRelativePath is { Length: > 0 } && extraVolume > 0;

        var headDelayMs = plan.FreezeHead && plan.LeadInSeconds > 0
            ? (int)Math.Round(plan.LeadInSeconds * 1000)
            : 0;
        var headDelay = headDelayMs > 0
            ? $",adelay={headDelayMs}|{headDelayMs}"
            : string.Empty;

        if (hasExtra)
        {
            var extraArgs = new List<string>();
            if (plan.ExtraAudioTrimStartSeconds is > 0)
            {
                extraArgs.Add("-ss");
                extraArgs.Add(FilterExpr.N(plan.ExtraAudioTrimStartSeconds.Value));
            }
            if (plan.ExtraAudioTrimEndSeconds.HasValue)
            {
                extraArgs.Add("-to");
                extraArgs.Add(FilterExpr.N(plan.ExtraAudioTrimEndSeconds.Value));
            }

            var extraIndex = inputs.Count;
            inputs.Add(new FfmpegInputSpec(extraArgs.ToArray(), plan.ExtraAudioRelativePath!));

            // Not looped: a ten-second sting on a two-minute clip plays once and stops,
            // which is what "a sound for this clip" means. Looping is the music bed's job.
            var extra = $"[{extraIndex}:a]{format},asetpts=N/SR/TB{headDelay},"
                        + $"volume={FilterExpr.N(extraVolume)},apad";

            if (!usesOwn || !plan.KeepOwnAudio) return $"{extra}[aout]";

            // normalize=0 inside Mix is what makes the two levels mean what they say;
            // amix's default would halve both the moment a second input appeared.
            var own = $"[0:a]{format},{AudioFilters.FollowTimestamps}{headDelay},volume={FilterExpr.N(ownVolume)},apad";
            var limiter = capabilities.Supports(RenderFeature.AudioLimiter);

            return $"{own}[a0];\n{extra}[a1];\n[a0][a1]{AudioFilters.Mix(2, limiter)}[aout]";
        }

        if (usesOwn)
        {
            // A boost can push peaks past full scale, so it is caught by a limiter where
            // the host has one. Left alone at or below unity, where there is nothing to
            // catch and the filter would only cost a pass over every sample.
            var guard = ownVolume > 1 && capabilities.Supports(RenderFeature.AudioLimiter)
                ? ",alimiter=limit=0.95"
                : string.Empty;

            var level = ownVolume == 1
                ? string.Empty
                : $",volume={FilterExpr.N(ownVolume)}{guard}";

            return $"[0:a]{format},{AudioFilters.FollowTimestamps}{headDelay}{level},apad[aout]";
        }

        var silence = inputs.Count;
        inputs.Add(new FfmpegInputSpec(
            ["-f", "lavfi"],
            $"anullsrc=channel_layout=stereo:sample_rate={plan.Encoder.AudioSampleRate}")
        { IsLavfi = true });

        return $"[{silence}:a]{format}[aout]";
    }

    /// <summary>
    /// Scales the source onto the canvas, producing the label <c>base</c>.
    /// <para>
    /// <c>setsar=1</c> is not cosmetic. Phone and camera footage frequently carries a
    /// non-square pixel aspect ratio, and without normalising it the concat demuxer
    /// silently keeps the first clip's SAR for the whole output - so one anamorphic clip
    /// early in the list stretches every clip after it.
    /// </para>
    /// </summary>
    /// <param name="working">
    /// The pixel format the chain runs in - the delivery format, which is roughly half the
    /// plane data of 4:4:4 to scale, pad and blur.
    /// </param>
    private static string FitChain(ClipFit fit, Canvas canvas, FrameRate rate, string working, ClipRenderPlan plan, string source = "0:v")
    {
        var size = $"{FilterExpr.N(canvas.Width)}:{FilterExpr.N(canvas.Height)}";
        var conform = $"setsar=1,fps={rate.ToFfmpegRate()},format={working}";

        // Build an optional crop prefix. The crop filter trims edges BEFORE the scale/pad
        // step so that the FitChain sees only the intended region of the source frame.
        // Percentages are expressed as fractions: L/100, R/100, T/100, B/100.
        var cropPrefix = plan.HasCrop
            ? BuildCropFilter(plan)
            : string.Empty;

        var matchesExactCanvas = !plan.HasCrop
            && plan.SourceWidth.HasValue && plan.SourceWidth.Value == canvas.Width
            && plan.SourceHeight.HasValue && plan.SourceHeight.Value == canvas.Height;

        return fit switch
        {
            // Fill and centre-crop. No bars, at the cost of the edges.
            ClipFit.Cover => matchesExactCanvas
                ? $"[{source}]{conform}[base];\n"
                : $"[{source}]{cropPrefix}scale={size}:force_original_aspect_ratio=increase:flags=bicubic,"
                  + $"crop={size},{conform}[base];\n",

            // Letterbox over a blurred, cropped copy of the same frame. split comes first
            // so the source is decoded once and used twice.
            ClipFit.BlurredBackdrop =>
                $"[{source}]{cropPrefix}split=2[bgsrc][fgsrc];\n"
                + $"[bgsrc]scale={size}:force_original_aspect_ratio=increase,crop={size},"
                + $"gblur=sigma={FilterExpr.N(Math.Max(canvas.Height / 40, 4))}:steps=2,"
                + $"setsar=1,format={working}[bgblur];\n"
                + $"[fgsrc]scale={size}:force_original_aspect_ratio=decrease:flags=bicubic,"
                + $"setsar=1,format={working}[fgfit];\n"
                + "[bgblur][fgfit]overlay=format=auto:x=(main_w-overlay_w)/2"
                + $":y=(main_h-overlay_h)/2,fps={rate.ToFfmpegRate()}[base];\n",

            // Letterbox on the chosen colour, black unless told otherwise. Loses nothing.
            _ => matchesExactCanvas
                ? $"[{source}]{conform}[base];\n"
                : $"[{source}]{cropPrefix}scale={size}:force_original_aspect_ratio=decrease:flags=bicubic,"
                  + $"pad={size}:(ow-iw)/2:(oh-ih)/2:color={PadColor(plan.PadColorRgb)},{conform}[base];\n"
        };
    }

    /// <summary>
    /// <c>black</c> for the default, so every graph built before bar colours existed is the
    /// graph it always was; otherwise the colour as ffmpeg spells it.
    /// </summary>
    /// <summary>A pixel width yuv420p can carry: rounded to even, never below two.</summary>
    private static string EvenAtLeastTwo(double pixels) =>
        Math.Max(2, (int)Math.Round(pixels / 2) * 2).ToString(System.Globalization.CultureInfo.InvariantCulture);

    private static string PadColor(string rgb) =>
        rgb is "000000" || rgb.Length != 6 || !rgb.All(char.IsAsciiHexDigit) ? "black" : $"0x{rgb}";

    /// <summary>
    /// Builds an inline crop= filter fragment (no leading '[0:v]', no trailing '[out]').
    /// <para>
    /// Formula: crop=w=in_w*(1-L-R):h=in_h*(1-T-B):x=in_w*L:y=in_h*T
    /// where L/R/T/B are the fractional crop edges (e.g. 10% → 0.1).
    /// </para>
    /// </summary>
    private static string BuildCropFilter(ClipRenderPlan plan)
    {
        var l = FilterExpr.N(plan.CropLeft / 100.0);
        var r = FilterExpr.N(plan.CropRight / 100.0);
        var t = FilterExpr.N(plan.CropTop / 100.0);
        var b = FilterExpr.N(plan.CropBottom / 100.0);

        // Prevent w/h from reaching zero by clamping (caller already guards < 99 total,
        // but a double-rounding edge at render time is worth a no-op guard here too).
        return $"crop=w='max(1,in_w*(1-{l}-{r}))':h='max(1,in_h*(1-{t}-{b}))'"
             + $":x=in_w*{l}:y=in_h*{t},";
    }


    /// <summary>
    /// The clip's output arguments. Identical to a scene's in every respect that decides
    /// whether a stream-copy concat is legal, with two deliberate differences:
    /// <c>-frames:v</c> is absent because a clip's true length is not known until it has
    /// been decoded, and <c>-shortest</c> is present to end the file at the video's last
    /// frame now that the audio is padded open-endedly.
    /// </summary>
    private static List<string> ClipOutputArguments(ClipRenderPlan plan)
    {
        var rate = plan.Canvas.FrameRate;
        var enc = plan.Encoder;

        // Assemble video-codec-specific quality arguments. GPU encoders each have a
        // different quality-control argument; the universal -crf only applies to libx264.
        IEnumerable<string> qualityArgs = enc.VideoCodec switch
        {
            "h264_nvenc" =>
            [
                "-preset", enc.Preset,          // p1-p7 (p3 = balanced)
                "-rc", "vbr",                   // variable bitrate with quality target
                "-cq", FilterExpr.N(enc.Crf),   // analogous to CRF
                "-b:v", "0"                     // let -cq do the driving
            ],
            "h264_qsv" =>
            [
                "-preset", enc.Preset,
                "-global_quality", FilterExpr.N(enc.Crf),
                "-look_ahead", "1"
            ],
            "h264_videotoolbox" =>
            [
                "-q:v", FilterExpr.N(enc.Crf)
            ],
            _ =>
            [
                // CPU libx264 — original path.
                "-preset", enc.Preset,
                "-crf", FilterExpr.N(enc.Crf)
            ]
        };

        var args = new List<string>
        {
            "-map", "[vout]",
            "-map", "[aout]",
            "-shortest",
        };

        if (plan.SourceIsImage)
        {
            args.Add("-frames:v");
            args.Add(FilterExpr.N(plan.ExpectedFrames.Value));
        }

        args.Add("-c:v");
        args.Add(enc.VideoCodec);

        args.AddRange(qualityArgs);

        args.AddRange([
            "-pix_fmt", enc.PixelFormat,
            "-profile:v", "high",
            "-r", rate.ToFfmpegRate(),
            "-fps_mode", "cfr",
            // Fixed 2s GOP with no scene-cut keyframes: this is the precondition for the
            // -c copy concat that joins the clips afterwards.
            "-g", FilterExpr.N((int)(rate.AsDouble * 2)),
            "-keyint_min", FilterExpr.N((int)(rate.AsDouble * 2)),
            "-sc_threshold", "0",
            "-colorspace", "bt709",
            "-color_primaries", "bt709",
            "-color_trc", "bt709",
            "-c:a", enc.AudioCodec,
            "-b:a", $"{enc.AudioBitrateKbps}k",
            "-ar", FilterExpr.N(enc.AudioSampleRate),
            "-ac", FilterExpr.N(enc.AudioChannels),
            "-video_track_timescale", FilterExpr.N((int)(rate.AsDouble * 1000)),
            "-movflags", "+faststart"
        ]);

        if (plan.EncoderThreads > 0 && !enc.IsHardwareEncoder)
        {
            // -threads is a software-only option; GPU encoders manage their own threading.
            args.Add("-threads");
            args.Add(FilterExpr.N(plan.EncoderThreads));
        }

        if (!enc.IsHardwareEncoder && enc.Preset is "ultrafast" or "superfast" or "veryfast")
        {
            // -tune fastdecode is libx264-only; GPU encoders don't understand it.
            args.Add("-tune");
            args.Add("fastdecode");
        }

        return args;
    }


    public FilterGraphPlan BuildMerge(MergePlan plan)
    {
        ArgumentNullException.ThrowIfNull(plan);
        if (plan.Scenes.Count == 0)
            throw new RenderException(RenderErrorCode.NoScenes, "This project has no scenes to render.");

        var lengths = plan.Lengths;
        var durations = plan.TransitionDurations;
        RenderTimeline.Validate(lengths, durations);

        var hasMusic = plan.BackgroundMusicRelativePath is not null || plan.MusicTracks.Count > 0;
        var total = RenderTimeline.TotalLength(lengths, durations);

        var isHardCutOnly = durations.All(d => d.Value == 0);
        var canStreamCopyVideo = plan.Overlays.Count == 0 && isHardCutOnly;

        if (canStreamCopyVideo)
        {
            return hasMusic
                ? BuildConcatWithAudioMerge(plan, total)
                : BuildConcatMerge(plan, total);
        }

        return BuildXfadeMerge(plan, lengths, durations, total, hasMusic);
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

    /// <summary>
    /// Stream-copies the concatenated video while mixing audio (music bed, timed music tracks, ducking).
    /// Avoids re-encoding the entire video when all transitions are cuts and there are no overlays.
    /// Runs in seconds rather than minutes.
    /// </summary>
    private FilterGraphPlan BuildConcatWithAudioMerge(MergePlan plan, FrameCount total)
    {
        var rate = plan.Canvas.FrameRate;
        var inputs = new List<FfmpegInputSpec>
        {
            new(["-f", "concat", "-safe", "0"], plan.ConcatListRelativePath)
        };

        var graph = new StringBuilder();
        var audioFormat = AudioFilters.Format(plan.Encoder);

        // The concat list gives every clip its exact video length, so the demuxer stamps each
        // clip's audio where its picture starts. Following those stamps - not renumbering
        // the samples - is what stops the per-clip shortfall accumulating into drift. Then
        // held to exactly the video's length at both ends.
        var totalSeconds = FilterExpr.Sec(total, rate);
        graph.Append($"[0:a]{audioFormat},{AudioFilters.FollowTimestamps},")
             .Append($"apad=whole_dur={totalSeconds},atrim=end={totalSeconds}[clipaudio];\n");
        var mixLabels = new List<string> { "clipaudio" };

        var duckEnvelope = AudioFilters.DuckEnvelope(
            [.. plan.MusicDuckWindows.Select(w => (w.StartSeconds, w.EndSeconds, w.Level))]);
        var duckSuffix = duckEnvelope.Length > 0 ? "," + duckEnvelope : string.Empty;

        if (plan.BackgroundMusicRelativePath is { Length: > 0 } bedPath)
        {
            var musicInput = inputs.Count;
            inputs.Add(new FfmpegInputSpec(["-stream_loop", "-1"], bedPath));

            graph.Append($"[{musicInput}:a]")
                 .Append(AudioFilters.MusicBed(plan.BackgroundMusicVolume, total, rate, plan.Encoder))
                 .Append(duckSuffix)
                 .Append("[music];\n");
            mixLabels.Add("music");
        }

        for (var t = 0; t < plan.MusicTracks.Count; t++)
        {
            var track = plan.MusicTracks[t];
            var trackInput = inputs.Count;
            inputs.Add(new FfmpegInputSpec([], track.RelativePath));

            var label = $"mtrack{t}";
            graph.Append($"[{trackInput}:a]")
                 .Append(AudioFilters.TimedTrack(
                     track.Volume, track.StartSeconds, track.TrimStartSeconds,
                     track.TrimEndSeconds, plan.Encoder))
                 .Append(track.IsVoiceover ? string.Empty : duckSuffix)
                 .Append($"[{label}];\n");
            mixLabels.Add(label);
        }

        graph.Append('[').Append(string.Join("][", mixLabels)).Append(']')
             .Append(AudioFilters.Mix(mixLabels.Count, capabilities.Supports(RenderFeature.AudioLimiter)))
             .Append(plan.YouTubeLoudness ? "," + AudioFilters.YouTubeLoudness(plan.Encoder) : string.Empty)
             .Append("[afinal]");

        var outputArguments = new List<string>
        {
            "-map", "0:v",
            "-c:v", "copy",
            "-map", "[afinal]",
            "-frames:v", FilterExpr.N(total.Value),
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
            IsStreamCopy = true,
            OutputArguments = outputArguments,
            OutputRelativePath = plan.OutputRelativePath,
            ExpectedFrames = total
        };
    }

    private FilterGraphPlan BuildXfadeMerge(
        MergePlan plan, IReadOnlyList<FrameCount> lengths, IReadOnlyList<FrameCount> durations,
        FrameCount total, bool hasMusic)
    {
        var rate = plan.Canvas.FrameRate;
        var offsets = RenderTimeline.XfadeOffsets(lengths, durations);
        var graph = new StringBuilder();
        var inputs = new List<FfmpegInputSpec>();
        var warnings = new List<string>();

        // Every clip is opened at once - that is what an xfade chain's input list means -
        // so each decoder's thread count is multiplied by the clip count in memory. Capping
        // it per input is the difference between 2 GB and 900 MB on a 24-clip join, at the
        // same speed, because the output encoder is the bottleneck either way. See
        // MergePlan.DecoderThreadsPerInput.
        string[] decoderArguments = plan.DecoderThreadsPerInput > 0
            ? ["-threads", FilterExpr.N(plan.DecoderThreadsPerInput)]
            : [];

        foreach (var scene in plan.Scenes)
            inputs.Add(new FfmpegInputSpec(decoderArguments, scene.RelativePath));

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

        var currentVideoLabel = videoLabel;
        for (var idx = 0; idx < plan.Overlays.Count; idx++)
        {
            var overlay = plan.Overlays[idx];
            var nextVideoLabel = $"v_ov_{idx}";
            var startSec = FilterExpr.N(overlay.StartSeconds);
            var endSec = FilterExpr.N(overlay.StartSeconds + overlay.DurationSeconds);

            if (overlay.Type is "image" or "video" && overlay.RelativePath is { Length: > 0 })
            {
                var ovInput = inputs.Count;

                // A still is one frame: looped into a stream the overlay's length, so a fade
                // has frames to fade across rather than one frame held at alpha 0.
                inputs.Add(overlay.Type == "image"
                    ? new FfmpegInputSpec(
                        ["-loop", "1", "-framerate", rate.ToFfmpegRate(), "-t", FilterExpr.N(overlay.DurationSeconds)],
                        overlay.RelativePath)
                    : new FfmpegInputSpec([], overlay.RelativePath));

                var ovScaledLabel = $"ov_s_{idx}";
                var scaleStr = overlay.WidthPercent is { } widthPercent
                    ? $",scale={EvenAtLeastTwo(plan.Canvas.Width * widthPercent / 100)}:-2"
                    : overlay.Scale != 1.0 ? $",scale=iw*{FilterExpr.N(overlay.Scale)}:-1" : "";
                var opacityStr = overlay.Opacity < 1.0 ? $",colorchannelmixer=aa={FilterExpr.N(overlay.Opacity)}" : "";

                // Moved onto the joined video's clock, so it starts at its own start time
                // instead of playing (unseen) from zero, and the fades land where they belong.
                var fadeStr = $",setpts=PTS-STARTPTS+{startSec}/TB";
                if (overlay.TransitionIn == "fade" && overlay.TransitionInDuration > 0)
                {
                    fadeStr += $",fade=t=in:st={startSec}:d={FilterExpr.N(overlay.TransitionInDuration)}:alpha=1";
                }
                if (overlay.TransitionOut == "fade" && overlay.TransitionOutDuration > 0)
                {
                    var outStart = overlay.StartSeconds + Math.Max(0, overlay.DurationSeconds - overlay.TransitionOutDuration);
                    fadeStr += $",fade=t=out:st={FilterExpr.N(outStart)}:d={FilterExpr.N(overlay.TransitionOutDuration)}:alpha=1";
                }

                graph.Append($"[{ovInput}:v]format=rgba{scaleStr}{opacityStr}{fadeStr}[{ovScaledLabel}];\n");

                var xPos = overlay.X != 0 ? $"(W-w)/2+W*{FilterExpr.N(overlay.X / 100.0)}" : "(W-w)/2";
                var yPos = overlay.Y != 0 ? $"(H-h)/2+H*{FilterExpr.N(overlay.Y / 100.0)}" : "(H-h)/2";

                graph.Append($"[{currentVideoLabel}][{ovScaledLabel}]overlay=x={xPos}:y={yPos}:enable='between(t,{startSec},{endSec})'[{nextVideoLabel}];\n");
                currentVideoLabel = nextVideoLabel;
            }
            else if (overlay is { Type: "text", Text: { } text })
            {
                currentVideoLabel = TextOverlayFilters.Append(
                    graph, currentVideoLabel, $"v_ov_{idx}", overlay, text, plan.Canvas);
            }
        }

        graph.Append($"[{currentVideoLabel}]format={plan.Encoder.PixelFormat}[vfinal];\n");

        // Audio mirrors the video chain. acrossfade consumes audio with exactly the same
        // arithmetic xfade uses, so driving both from the same durations keeps them locked.
        // Using concat here instead would leave audio long by the sum of all transitions -
        // twenty 0.5s transitions is ten seconds of drift by the end.
        // Each clip's audio is held to exactly its video length first: a conformed clip's
        // sound ends a few ms short of its picture, and acrossfade would otherwise carry
        // every one of those shortfalls forward into the next clip.
        for (var i = 0; i < plan.Scenes.Count; i++)
        {
            var seconds = FilterExpr.Sec(lengths[i], rate);
            graph.Append($"[{i}:a]{AudioFilters.Format(plan.Encoder)},{AudioFilters.FollowTimestamps},")
                 .Append($"apad=whole_dur={seconds},atrim=end={seconds}[a{i}];\n");
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
            var mixLabels = new List<string> { audioLabel };

            // Built once and appended to every music source, so the bed and the timed tracks
            // duck together rather than one of them holding its level through the dialogue.
            var duckEnvelope = AudioFilters.DuckEnvelope(
                [.. plan.MusicDuckWindows.Select(w => (w.StartSeconds, w.EndSeconds, w.Level))]);
            var duckSuffix = duckEnvelope.Length > 0 ? "," + duckEnvelope : string.Empty;

            if (plan.BackgroundMusicRelativePath is { Length: > 0 } bedPath)
            {
                var musicInput = inputs.Count;
                inputs.Add(new FfmpegInputSpec(["-stream_loop", "-1"], bedPath));

                graph.Append($"[{musicInput}:a]")
                     .Append(AudioFilters.MusicBed(plan.BackgroundMusicVolume, total, rate, plan.Encoder))
                     .Append(duckSuffix)
                     .Append("[music];\n");
                mixLabels.Add("music");
            }

            for (var t = 0; t < plan.MusicTracks.Count; t++)
            {
                var track = plan.MusicTracks[t];
                var trackInput = inputs.Count;
                inputs.Add(new FfmpegInputSpec([], track.RelativePath));

                var label = $"mtrack{t}";
                graph.Append($"[{trackInput}:a]")
                     .Append(AudioFilters.TimedTrack(
                         track.Volume, track.StartSeconds, track.TrimStartSeconds,
                         track.TrimEndSeconds, plan.Encoder))
                     .Append(track.IsVoiceover ? string.Empty : duckSuffix)
                     .Append($"[{label}];\n");
                mixLabels.Add(label);
            }

            graph.Append('[').Append(string.Join("][", mixLabels)).Append(']')
                 .Append(AudioFilters.Mix(mixLabels.Count, capabilities.Supports(RenderFeature.AudioLimiter)))
                 .Append(plan.YouTubeLoudness ? "," + AudioFilters.YouTubeLoudness(plan.Encoder) : string.Empty)
                 .Append("[afinal]");
        }
        else
        {
            graph.Append($"[{audioLabel}]")
                 .Append(plan.YouTubeLoudness ? AudioFilters.YouTubeLoudness(plan.Encoder) : "anull")
                 .Append("[afinal]");
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
