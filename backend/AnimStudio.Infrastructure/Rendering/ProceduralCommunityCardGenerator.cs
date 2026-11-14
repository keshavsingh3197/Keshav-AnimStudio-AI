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
/// Synthesizes a 1080x1080 event-themed PNG Promo Card for YouTube Community Posts &amp; Social sharing
/// using the exact fixed <see cref="ProceduralEventPalette"/> colors, animated 2-character dialogue stage,
/// and crisp ASS typography (falling back gracefully to pure managed PNG encoding when FFmpeg is unavailable).
/// </summary>
public sealed class ProceduralCommunityCardGenerator(
    IOptions<FfmpegOptions> ffmpegOptions,
    IRenderCapabilities capabilities,
    IRenderWorkspaceFactory workspaces,
    ISubtitleWriter subtitleWriter,
    IObjectStore objectStore,
    ILogger<ProceduralCommunityCardGenerator> logger)
{
    public const int CardSize = 1080;

    public async Task<(string StorageKey, long SizeBytes)> GenerateAndStoreAsync(
        string postId,
        string title,
        string? subtitle,
        string? eventType,
        string? footerUrl,
        bool enableCharacterDialogue,
        string? speakerAName,
        string? speakerBName,
        CancellationToken ct)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(postId);

        var safeTitle = string.IsNullOrWhiteSpace(title) ? "Keshav Network Update" : title.Trim();
        var resolvedTheme = ProceduralVideoPlanner.InferTheme(ProceduralSceneTheme.Auto, safeTitle, subtitle, eventType);
        var palette = ProceduralEventPalette.Resolve(eventType, resolvedTheme);
        var dialoguePlan = DialogueScriptParser.ParsePlan(
            safeTitle, subtitle, safeTitle, 18,
            enableCharacterDialogue, speakerAName, speakerBName, eventType);

        var rasterizer = new ProceduralSceneRasterizer(
            CardSize,
            CardSize,
            resolvedTheme,
            StableSeed($"{postId}|{palette.EventKey}"),
            palette,
            dialoguePlan);

        rasterizer.RenderFrame(timeSeconds: 4.5, durationSeconds: 18.0);

        byte[] pngBytes;
        if (capabilities.IsAvailable && capabilities.Supports(RenderFeature.BurnedSubtitles))
        {
            pngBytes = await TryBurnTextViaFfmpegAsync(
                rasterizer.Buffer, safeTitle, subtitle, palette, footerUrl, ct).ConfigureAwait(false)
                ?? PngFrameEncoder.EncodeRgba(rasterizer.Buffer, CardSize, CardSize);
        }
        else
        {
            pngBytes = PngFrameEncoder.EncodeRgba(rasterizer.Buffer, CardSize, CardSize);
        }

        var storageKey = $"automation-cards/{postId}.png";
        await using var ms = new MemoryStream(pngBytes, writable: false);
        await objectStore.SaveAsync(storageKey, ms, "image/png", ct).ConfigureAwait(false);
        return (storageKey, pngBytes.LongLength);
    }

    private async Task<byte[]?> TryBurnTextViaFfmpegAsync(
        byte[] rgbaFrame,
        string title,
        string? subtitle,
        ProceduralEventPalette palette,
        string? footerUrl,
        CancellationToken ct)
    {
        try
        {
            await using var workspace = await workspaces.CreateAsync($"card-{Guid.NewGuid():n}", ct).ConfigureAwait(false);
            var outPath = workspace.Resolve("out/card.png");

            var canvas = new Canvas(CardSize, CardSize, new FrameRate(1, 1));
            var lines = new List<DialogueLine>
            {
                new()
                {
                    Index = 0,
                    SpeakerLabel = "Badge",
                    SpeakerCharacterId = "card-badge",
                    Text = $"* {palette.HeaderBadgeText} *",
                    RelativeStartFrame = 0,
                    RelativeEndFrame = 2
                },
                new()
                {
                    Index = 1,
                    SpeakerLabel = "Headline",
                    SpeakerCharacterId = "card-title",
                    Text = title.Length > 74 ? title[..73].TrimEnd() + "..." : title,
                    RelativeStartFrame = 0,
                    RelativeEndFrame = 2
                }
            };

            if (!string.IsNullOrWhiteSpace(subtitle))
            {
                var summary = subtitle.Trim().Split(['\n', '।'], StringSplitOptions.RemoveEmptyEntries).FirstOrDefault()?.Trim();
                if (!string.IsNullOrWhiteSpace(summary))
                {
                    lines.Add(new DialogueLine
                    {
                        Index = 2,
                        SpeakerLabel = "Summary",
                        SpeakerCharacterId = "card-body",
                        Text = summary.Length > 105 ? summary[..104].TrimEnd() + "..." : summary,
                        RelativeStartFrame = 0,
                        RelativeEndFrame = 2
                    });
                }
            }

            if (!string.IsNullOrWhiteSpace(footerUrl))
            {
                lines.Add(new DialogueLine
                {
                    Index = 3,
                    SpeakerLabel = "Link",
                    SpeakerCharacterId = "card-footer",
                    Text = $"Visit: {footerUrl.Trim()}",
                    RelativeStartFrame = 0,
                    RelativeEndFrame = 2
                });
            }

            var styles = new Dictionary<string, SubtitleStyle>(StringComparer.Ordinal)
            {
                ["card-badge"] = new("CardBadge", palette.PrimaryHex, Bold: true, Alignment: 8, MarginV: 28, FontScalePercent: 60),
                ["card-title"] = new("CardTitle", palette.TitleHex, Bold: true, Alignment: 8, MarginV: 84, FontScalePercent: 90),
                ["card-body"] = new("CardBody", palette.SpeakerAHex, Bold: true, Alignment: 2, MarginV: 112, FontScalePercent: 78),
                ["card-footer"] = new("CardFooter", "#E2E8F0", Bold: false, Alignment: 2, MarginV: 34, FontScalePercent: 56)
            };

            var ass = subtitleWriter.Write(new SubtitleRequest(
                canvas, lines, styles, AssSubtitleWriter.StockFontName, 44));
            await File.WriteAllTextAsync(workspace.Resolve("in/card.ass"), ass, new UTF8Encoding(false), ct)
                .ConfigureAwait(false);

            var ffmpegExe = string.IsNullOrWhiteSpace(ffmpegOptions.Value.FfmpegPath)
                ? "ffmpeg"
                : ffmpegOptions.Value.FfmpegPath;

            var psi = new ProcessStartInfo
            {
                FileName = ffmpegExe,
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
                "-video_size", string.Create(CultureInfo.InvariantCulture, $"{CardSize}x{CardSize}"),
                "-framerate", "1", "-i", "pipe:0",
                "-vf", "ass=in/card.ass",
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
            logger.LogDebug(ex, "Falling back to raw PNG encoding for community card.");
        }

        return null;
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
