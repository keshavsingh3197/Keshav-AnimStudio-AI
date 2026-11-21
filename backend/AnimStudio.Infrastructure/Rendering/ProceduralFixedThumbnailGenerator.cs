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
        int Height = 720);

    public async Task<(byte[] ImageBytes, string ContentType)> RenderAsync(FixedThumbnailSpec spec, CancellationToken ct)
    {
        var width = Math.Clamp(spec.Width <= 0 ? 1280 : spec.Width, 640, 1920);
        var height = Math.Clamp(spec.Height <= 0 ? 720 : spec.Height, 640, 1920);
        var title = string.IsNullOrWhiteSpace(spec.TitleText) ? "Aaj Ka Panchang" : spec.TitleText.Trim();
        var subtitle = spec.SubtitleText?.Trim() ?? string.Empty;
        var dateLabel = string.IsNullOrWhiteSpace(spec.DateText) ? DateTime.UtcNow.ToString("yyyy-MM-dd") : spec.DateText.Trim();

        var resolvedTheme = ProceduralVideoPlanner.InferTheme(ProceduralSceneTheme.Auto, title, subtitle, spec.EventType);
        var palette = ProceduralEventPalette.Resolve(spec.EventType, resolvedTheme);
        var dialoguePlan = DialogueScriptParser.ParsePlan(title, subtitle, title, 12, enableDialogue: false, eventType: spec.EventType);

        IReadOnlyList<byte[]>? backdropFrames = null;
        if (spec.BackgroundImageBytes is { Length: > 0 } && capabilities.IsAvailable)
        {
            var decoded = await TryDecodeImageToRgbaAsync(spec.BackgroundImageBytes, width, height, ct).ConfigureAwait(false);
            if (decoded is not null)
            {
                // Apply subtle contrast scrim so fixed title & date overlays remain ultra legible over any photo.
                for (var p = 0; p + 3 < decoded.Length; p += 4)
                {
                    decoded[p] = (byte)(decoded[p] * 0.68);
                    decoded[p + 1] = (byte)(decoded[p + 1] * 0.68);
                    decoded[p + 2] = (byte)(decoded[p + 2] * 0.68);
                }
                backdropFrames = [decoded];
            }
        }

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
            backdropFrames: backdropFrames);

        rasterizer.RenderFrame(timeSeconds: 3.5, durationSeconds: 12.0);

        if (capabilities.IsAvailable && capabilities.Supports(RenderFeature.BurnedSubtitles))
        {
            var burned = await TryBurnTemplateTextAsync(rasterizer.Buffer, width, height, spec, palette, ct).ConfigureAwait(false);
            if (burned is not null)
                return (burned, "image/png");
        }

        var fallback = PngFrameEncoder.EncodeRgba(rasterizer.Buffer, width, height);
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
        ProceduralEventPalette palette,
        CancellationToken ct)
    {
        try
        {
            await using var workspace = await workspaces.CreateAsync($"fthumb-{Guid.NewGuid():n}", ct).ConfigureAwait(false);
            var outPath = workspace.Resolve("out/thumb.png");

            var canvas = new Canvas(width, height, new FrameRate(1, 1));
            var titleText = spec.TitleText.Trim();
            if (titleText.Length > 76) titleText = titleText[..75].TrimEnd() + "…";
            var dateBadge = string.IsNullOrWhiteSpace(spec.DateText)
                ? palette.HeaderBadgeText
                : $"{palette.HeaderBadgeText} • {spec.DateText.Trim()}";

            var lines = new List<DialogueLine>
            {
                new()
                {
                    Index = 0,
                    SpeakerLabel = "DateBadge",
                    SpeakerCharacterId = "ft-date",
                    Text = dateBadge,
                    RelativeStartFrame = 0,
                    RelativeEndFrame = 2
                },
                new()
                {
                    Index = 1,
                    SpeakerLabel = "Headline",
                    SpeakerCharacterId = "ft-title",
                    Text = titleText,
                    RelativeStartFrame = 0,
                    RelativeEndFrame = 2
                }
            };

            if (!string.IsNullOrWhiteSpace(spec.SubtitleText))
            {
                var sub = spec.SubtitleText.Trim();
                if (sub.Length > 110) sub = sub[..109].TrimEnd() + "…";
                lines.Add(new DialogueLine
                {
                    Index = 2,
                    SpeakerLabel = "Subtitle",
                    SpeakerCharacterId = "ft-sub",
                    Text = sub,
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

            var isPortrait = height > width;
            var styles = new Dictionary<string, SubtitleStyle>(StringComparer.Ordinal)
            {
                ["ft-date"] = new("FtDate", palette.PrimaryHex, Bold: true, Alignment: 8, MarginV: isPortrait ? 64 : 36, FontScalePercent: isPortrait ? 62 : 70),
                ["ft-title"] = new("FtTitle", palette.TitleHex, Bold: true, Alignment: 5, MarginV: 24, FontScalePercent: isPortrait ? 105 : 120),
                ["ft-sub"] = new("FtSub", palette.SpeakerAHex, Bold: true, Alignment: 2, MarginV: isPortrait ? 140 : 88, FontScalePercent: isPortrait ? 78 : 86),
                ["ft-mark"] = new("FtMark", "#E2E8F0", Bold: false, Alignment: 3, MarginV: 24, FontScalePercent: 52)
            };

            var ass = subtitleWriter.Write(new SubtitleRequest(
                canvas, lines, styles, AssSubtitleWriter.StockFontName, isPortrait ? 44 : 48));
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
