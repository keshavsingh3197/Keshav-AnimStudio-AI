using System.Diagnostics;
using System.Globalization;
using System.Text;
using AnimStudio.Application.Abstractions.Rendering;
using AnimStudio.Application.Abstractions.Storage;
using AnimStudio.Application.Rendering;
using AnimStudio.Domain.Rendering;
using AnimStudio.Domain.Scenes;
using AnimStudio.Infrastructure.Ffmpeg;
using AnimStudio.Infrastructure.Subtitles;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AnimStudio.Infrastructure.Rendering;

/// <summary>
/// Fast deterministic fixed-layout thumbnail renderer (zero external AI waits) supporting editable Date, Title,
/// Subtitle, optional background picture, and explicit watermark visibility toggle for 2D Panchang, Rashifal &amp; Hub posts.
/// </summary>
public sealed class ProceduralFixedThumbnailGenerator(
    IOptions<FfmpegOptions> ffmpegOptions,
    IRenderCapabilities capabilities,
    IRenderWorkspaceFactory workspaces,
    ISubtitleWriter subtitleWriter,
    ILogger<ProceduralFixedThumbnailGenerator> logger)
{
    public sealed record FixedThumbnailSpec(
        string DateText,
        string TitleText,
        string? SubtitleText,
        string? EventType,
        byte[]? BackgroundImageBytes = null,
        bool ShowWatermark = false,
        string? WatermarkText = null,
        int Width = 1280,
        int Height = 720,
        bool MaskBottomRightWatermark = false);

    public async Task<(byte[] ImageBytes, string ContentType)> RenderAsync(FixedThumbnailSpec spec, CancellationToken ct)
    {
        var width = Math.Clamp(spec.Width <= 0 ? 1280 : spec.Width, 640, 1920);
        var height = Math.Clamp(spec.Height <= 0 ? 720 : spec.Height, 640, 1920);
        var title = string.IsNullOrWhiteSpace(spec.TitleText) ? "Aaj Ka Panchang" : spec.TitleText.Trim();
        var subtitle = spec.SubtitleText?.Trim() ?? string.Empty;
        var dateLabel = string.IsNullOrWhiteSpace(spec.DateText) ? DateTime.UtcNow.ToString("yyyy-MM-dd") : spec.DateText.Trim();

        var resolvedTheme = ProceduralVideoPlanner.InferTheme(ProceduralSceneTheme.Auto, title, subtitle, spec.EventType);
        var palette = ProceduralEventPalette.Resolve(spec.EventType, resolvedTheme);
        var dialoguePlan = DialogueScriptParser.ParsePlan(title, subtitle, title, 12, enableDialogue: true, eventType: spec.EventType);

        IReadOnlyList<byte[]>? backdropFrames = null;
        if (spec.BackgroundImageBytes is { Length: > 0 } && capabilities.IsAvailable)
        {
            var decoded = await TryDecodeImageToRgbaAsync(spec.BackgroundImageBytes, width, height, ct).ConfigureAwait(false);
            if (decoded is not null)
            {
                backdropFrames = [decoded];
            }
        }

        byte[] baseRgba;
        if (backdropFrames is { Count: > 0 })
        {
            baseRgba = backdropFrames[0];
        }
        else
        {
            var rasterizer = new ProceduralSceneRasterizer(
                width,
                height,
                resolvedTheme,
                StableSeed($"{dateLabel}|{title}|{palette.EventKey}"),
                palette,
                dialoguePlan,
                speechEnvelope: null,
                fps: 1.0,
                storyHint: title,
                backdropFrames: null);
            baseRgba = rasterizer.RenderFrame(timeSeconds: 3.5, durationSeconds: 12.0).ToArray();
        }

        // Apply crisp emotion-matched spotlight + periphery vignette + safe-zone scrim so outlined hero text pops cleanly
        var posterCopy = ThumbnailPosterCopy.Build(
            spec.EventType,
            title,
            subtitle,
            dateLabel,
            height > width);
        ProceduralThumbnailStyler.ApplyHighCtrLightingRgba(
            baseRgba,
            width,
            height,
            posterCopy.Emotion,
            isPortrait: height > width,
            maskBottomRightWatermark: spec.MaskBottomRightWatermark);

        if (capabilities.IsAvailable && capabilities.Supports(RenderFeature.BurnedSubtitles))
        {
            var burned = await TryBurnTemplateTextAsync(baseRgba, width, height, spec, posterCopy, ct).ConfigureAwait(false);
            if (burned is not null)
                return (burned, "image/png");
        }

        var fallback = PngFrameEncoder.EncodeRgba(baseRgba, width, height);
        return (fallback, "image/png");
    }

    private async Task<byte[]?> TryDecodeImageToRgbaAsync(byte[] imageBytes, int width, int height, CancellationToken ct)
    {
        try
        {
            await using var workspace = await workspaces.CreateAsync($"thbg-{Guid.NewGuid():n}", ct).ConfigureAwait(false);
            var inFile = workspace.Resolve("in/bg.img");
            await File.WriteAllBytesAsync(inFile, imageBytes, ct).ConfigureAwait(false);

            var ffmpegExe = ResolveFfmpegExe();
            var psi = new ProcessStartInfo
            {
                FileName = ffmpegExe,
                WorkingDirectory = workspace.RootPath,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };
            foreach (var arg in new[]
            {
                "-hide_banner", "-nostdin", "-y",
                "-i", inFile,
                "-vf", $"scale={width}:{height}:force_original_aspect_ratio=increase,crop={width}:{height},format=rgba",
                "-frames:v", "1",
                "-f", "rawvideo", "-pix_fmt", "rgba",
                "pipe:1"
            })
            {
                psi.ArgumentList.Add(arg);
            }

            using var proc = new Process { StartInfo = psi };
            if (!proc.Start()) return null;

            using var ms = new MemoryStream(width * height * 4);
            var stdoutTask = proc.StandardOutput.BaseStream.CopyToAsync(ms, ct);
            var stderrTask = proc.StandardError.ReadToEndAsync(ct);
            await Task.WhenAll(stdoutTask, stderrTask).ConfigureAwait(false);
            await proc.WaitForExitAsync(ct).ConfigureAwait(false);

            var expected = width * height * 4;
            var raw = ms.ToArray();
            return proc.ExitCode == 0 && raw.Length == expected ? raw : null;
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogDebug(ex, "Could not decode custom background for fixed thumbnail.");
            return null;
        }
    }

    private async Task<byte[]?> TryBurnTemplateTextAsync(
        byte[] rgbaFrame,
        int width,
        int height,
        FixedThumbnailSpec spec,
        PosterOverlayCopy posterCopy,
        CancellationToken ct)
    {
        try
        {
            await using var workspace = await workspaces.CreateAsync($"fthumb-{Guid.NewGuid():n}", ct).ConfigureAwait(false);
            var outPath = workspace.Resolve("out/thumb.png");

            var isPortrait = height > width;
            var canvas = new Canvas(width, height, new FrameRate(1, 1));

            var heroText = string.IsNullOrWhiteSpace(posterCopy.HeroTitle) ? spec.TitleText.Trim() : posterCopy.HeroTitle;
            var purposePill = posterCopy.CategoryPill;
            var subText = posterCopy.PurposeSubline;

            var lines = new List<DialogueLine>
            {
                new()
                {
                    Index = 0,
                    SpeakerLabel = "HeroTitle",
                    SpeakerCharacterId = "ft-hero",
                    Text = WrapPosterLines(heroText, isPortrait ? 16 : 22, maxLines: 3),
                    RelativeStartFrame = 0,
                    RelativeEndFrame = 2
                }
            };

            if (!string.IsNullOrWhiteSpace(purposePill))
            {
                lines.Add(new DialogueLine
                {
                    Index = 1,
                    SpeakerLabel = "CategoryPill",
                    SpeakerCharacterId = "ft-pill",
                    Text = purposePill,
                    RelativeStartFrame = 0,
                    RelativeEndFrame = 2
                });
            }

            if (!string.IsNullOrWhiteSpace(subText))
            {
                lines.Add(new DialogueLine
                {
                    Index = 2,
                    SpeakerLabel = "PurposeSub",
                    SpeakerCharacterId = "ft-sub",
                    Text = WrapPosterLines(subText, isPortrait ? 30 : 28, maxLines: 2),
                    RelativeStartFrame = 0,
                    RelativeEndFrame = 2
                });
            }

            if (spec.ShowWatermark && !string.IsNullOrWhiteSpace(spec.WatermarkText))
            {
                lines.Add(new DialogueLine
                {
                    Index = 3,
                    SpeakerLabel = "Watermark",
                    SpeakerCharacterId = "ft-mark",
                    Text = spec.WatermarkText.Trim(),
                    RelativeStartFrame = 0,
                    RelativeEndFrame = 2
                });
            }

            var emotionPalette = ProceduralThumbnailStyler.GetEmotionPalette(posterCopy.Emotion);
            var styles = isPortrait
                ? new Dictionary<string, SubtitleStyle>(StringComparer.Ordinal)
                {
                    // Date/Category badge + large thick-outlined headline in 9:16 mobile safe zone + lower emotion hook
                    ["ft-pill"] = new("FtPill", emotionPalette.PillTextHex, Bold: true, Alignment: 8, MarginV: 94, FontScalePercent: 86, OutlineColorHex: emotionPalette.PillBgHex, BackColorHex: emotionPalette.PillBgHex, MarginL: 40, MarginR: 40, OpaqueBox: true),
                    ["ft-hero"] = new("FtHero", emotionPalette.HeroTextHex, Bold: true, Alignment: 8, MarginV: 158, FontScalePercent: 185, OutlineColorHex: emotionPalette.HeroOutlineHex, BackColorHex: "#000000", MarginL: 34, MarginR: 34, OpaqueBox: false, OutlineWidth: 7.5, ShadowDepth: 4.0),
                    ["ft-sub"] = new("FtSub", "#FEF08A", Bold: true, Alignment: 2, MarginV: 178, FontScalePercent: 94, OutlineColorHex: "#0F172A", BackColorHex: "#111827", MarginL: 34, MarginR: 34, OpaqueBox: true),
                    ["ft-mark"] = new("FtMark", "#E2E8F0", Bold: false, Alignment: 3, MarginV: 24, FontScalePercent: 48)
                }
                : new Dictionary<string, SubtitleStyle>(StringComparer.Ordinal)
                {
                    // Rule-of-Thirds split poster: thick-outlined hero headline on left scrim keeping right characters bright
                    ["ft-hero"] = new("FtHero", emotionPalette.HeroTextHex, Bold: true, Alignment: 4, MarginV: 14, FontScalePercent: 148, OutlineColorHex: emotionPalette.HeroOutlineHex, BackColorHex: "#000000", MarginL: 54, MarginR: 450, OpaqueBox: false, OutlineWidth: 7.5, ShadowDepth: 4.0),
                    ["ft-pill"] = new("FtPill", emotionPalette.PillTextHex, Bold: true, Alignment: 7, MarginV: 56, FontScalePercent: 84, OutlineColorHex: emotionPalette.PillBgHex, BackColorHex: emotionPalette.PillBgHex, MarginL: 54, MarginR: 450, OpaqueBox: true),
                    ["ft-sub"] = new("FtSub", "#FFFFFF", Bold: true, Alignment: 1, MarginV: 68, FontScalePercent: 100, OutlineColorHex: "#0F172A", BackColorHex: "#111827", MarginL: 54, MarginR: 450, OpaqueBox: true),
                    ["ft-mark"] = new("FtMark", "#E2E8F0", Bold: false, Alignment: 3, MarginV: 22, FontScalePercent: 48)
                };

            var ass = subtitleWriter.Write(new SubtitleRequest(
                canvas, lines, styles, AssSubtitleWriter.StockFontName, isPortrait ? 46 : 48));
            await File.WriteAllTextAsync(workspace.Resolve("in/thumb.ass"), ass, new UTF8Encoding(false), ct)
                .ConfigureAwait(false);

            var psi = new ProcessStartInfo
            {
                FileName = ResolveFfmpegExe(),
                WorkingDirectory = workspace.RootPath,
                RedirectStandardInput = true,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };
            foreach (var arg in new[]
            {
                "-hide_banner", "-nostdin", "-y",
                "-f", "rawvideo", "-pixel_format", "rgba",
                "-video_size", string.Create(CultureInfo.InvariantCulture, $"{width}x{height}"),
                "-framerate", "1", "-i", "pipe:0",
                "-vf", "ass=in/thumb.ass",
                "-frames:v", "1",
                outPath
            })
            {
                psi.ArgumentList.Add(arg);
            }

            using var proc = new Process { StartInfo = psi };
            if (!proc.Start()) return null;

            await using (var stdin = proc.StandardInput.BaseStream)
            {
                await stdin.WriteAsync(rgbaFrame, 0, rgbaFrame.Length, ct).ConfigureAwait(false);
                await stdin.FlushAsync(ct).ConfigureAwait(false);
            }

            await proc.WaitForExitAsync(ct).ConfigureAwait(false);
            if (proc.ExitCode == 0 && File.Exists(outPath))
                return await File.ReadAllBytesAsync(outPath, ct).ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogDebug(ex, "Falling back to raw PNG encoding for fixed template thumbnail.");
        }

        return null;
    }

    private string ResolveFfmpegExe() =>
        string.IsNullOrWhiteSpace(ffmpegOptions.Value.FfmpegPath) ? "ffmpeg" : ffmpegOptions.Value.FfmpegPath;

    private static string WrapPosterLines(string text, int maxCharsPerLine, int maxLines)
    {
        var clean = string.Join(' ', (text ?? string.Empty).Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries));
        if (clean.Length <= maxCharsPerLine || maxLines <= 1) return clean;
        var words = clean.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        var lines = new List<string>(maxLines);
        var cur = new StringBuilder();
        var consumedWords = 0;
        foreach (var word in words)
        {
            if (cur.Length > 0 && cur.Length + 1 + word.Length > maxCharsPerLine)
            {
                lines.Add(cur.ToString());
                cur.Clear();
                if (lines.Count >= maxLines - 1)
                {
                    var tail = new StringBuilder();
                    var maxTail = maxCharsPerLine + 10;
                    for (var i = consumedWords; i < words.Length; i++)
                    {
                        var candidate = tail.Length == 0 ? words[i] : $"{tail} {words[i]}";
                        if (tail.Length > 0 && candidate.Length > maxTail)
                            break;
                        if (tail.Length > 0) tail.Append(' ');
                        tail.Append(words[i]);
                    }
                    lines.Add(tail.ToString());
                    return string.Join('\n', lines);
                }
            }
            if (cur.Length > 0) cur.Append(' ');
            cur.Append(word);
            consumedWords++;
        }
        if (cur.Length > 0) lines.Add(cur.ToString());
        return string.Join('\n', lines);
    }

    private static int StableSeed(string input)
    {
        unchecked
        {
            var h = 2166136261u;
            foreach (var ch in input) h = (h ^ ch) * 16777619u;
            return (int)(h & 0x7FFFFFFF);
        }
    }
}
