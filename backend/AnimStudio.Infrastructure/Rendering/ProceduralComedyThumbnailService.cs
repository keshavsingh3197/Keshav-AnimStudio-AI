using System.Diagnostics;
using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using AnimStudio.Application.Abstractions.Rendering;
using AnimStudio.Application.Abstractions.Storage;
using AnimStudio.Application.Publishing;
using AnimStudio.Application.Rendering;
using AnimStudio.Domain.Jobs;
using AnimStudio.Domain.Rendering;
using AnimStudio.Domain.Scenes;
using AnimStudio.Infrastructure.Ffmpeg;
using AnimStudio.Infrastructure.Storage;
using AnimStudio.Infrastructure.Subtitles;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AnimStudio.Infrastructure.Rendering;

/// <summary>
/// Automatically creates high-CTR 1280x720 YouTube thumbnails directly from rendered 3D animations
/// by extracting the peak dramatic/comedy frame, cropping cleanly past subtitles, grading colors,
/// and burning a bold Hindi/English hook headline via FFmpeg + LibAss.
/// </summary>
public sealed partial class ProceduralComedyThumbnailService(
    IObjectStore objectStore,
    AppDataPaths dataPaths,
    IOptions<FfmpegOptions> ffmpegOptions,
    IRenderCapabilities capabilities,
    IRenderWorkspaceFactory workspaces,
    ISubtitleWriter subtitleWriter,
    ILogger<ProceduralComedyThumbnailService> logger)
{
    private const int WideThumbWidth = 1280;
    private const int WideThumbHeight = 720;
    private const int PortraitThumbWidth = 720;
    private const int PortraitThumbHeight = 1280;

    public static (int Width, int Height) ResolveOutputDimensions(int jobWidth, int jobHeight)
    {
        var isPortrait = jobHeight is > 0 && jobWidth is > 0 && jobHeight > jobWidth;
        return isPortrait ? (PortraitThumbWidth, PortraitThumbHeight) : (WideThumbWidth, WideThumbHeight);
    }

    public async Task<byte[]?> TryGenerateFromRenderAsync(
        RenderJob job,
        string title,
        string? script,
        string? badgeLabel,
        string? eventType,
        CancellationToken ct)
    {
        if (!capabilities.IsAvailable || string.IsNullOrWhiteSpace(job.OutputStorageKey))
            return null;

        try
        {
            var duration = job.Diagnostics?.OutputDurationSeconds;
            var timestamp = PickPeakDramaTimestamp(script, duration);
            var (outWidth, outHeight) = ResolveOutputDimensions(job.Width ?? 0, job.Height ?? 0);
            var isPortrait = outHeight > outWidth;
            var resolvedTheme = ProceduralVideoPlanner.InferTheme(ProceduralSceneTheme.Auto, title, script ?? title, eventType);
            var palette = ProceduralEventPalette.Resolve(eventType, resolvedTheme);

            await using var workspace = await workspaces.CreateAsync($"c3dthumb-{Guid.NewGuid():n}", ct).ConfigureAwait(false);
            var outPath = workspace.Resolve("out/thumb.jpg");

            var cleanPath = workspace.Resolve("in/clean.png");
            var sourceIsCleanPng = false;
            var cleanThumbKey = $"renders/{job.Id}.cleanthumb.png";
            await using (var cleanStream = await objectStore.OpenAsync(cleanThumbKey, ct).ConfigureAwait(false))
            {
                if (cleanStream is not null)
                {
                    await using var dst = File.Create(cleanPath);
                    await cleanStream.CopyToAsync(dst, ct).ConfigureAwait(false);
                    sourceIsCleanPng = File.Exists(cleanPath) && new FileInfo(cleanPath).Length > 256;
                }
            }

            string sourceInputPath;
            if (sourceIsCleanPng)
            {
                sourceInputPath = "in/clean.png";
            }
            else
            {
                var videoPath = await RenderPreviewFile.EnsureAsync(objectStore, dataPaths, job, ct).ConfigureAwait(false);
                if (!File.Exists(videoPath) || new FileInfo(videoPath).Length < 2048)
                    return null;
                sourceInputPath = videoPath;
            }

            var hookHeadline = ExtractPunchHookHeadline(title);
            string? assRelPath = null;
            if (capabilities.Supports(RenderFeature.BurnedSubtitles) && !string.IsNullOrWhiteSpace(hookHeadline))
            {
                var canvas = new Canvas(outWidth, outHeight, new FrameRate(1, 1));
                var lines = new List<DialogueLine>
                {
                    new()
                    {
                        Index = 0,
                        SpeakerLabel = "Hook",
                        SpeakerCharacterId = "ct-hook",
                        Text = hookHeadline,
                        RelativeStartFrame = 0,
                        RelativeEndFrame = 2
                    }
                };

                // Single punchy MJO-style opaque hook pill cleanly positioned away from character faces (top-center on 9:16, bottom-left on 16:9)
                var styles = new Dictionary<string, SubtitleStyle>(StringComparer.Ordinal)
                {
                    ["ct-hook"] = new(
                        "ThumbHook",
                        "#FEF08A",
                        Bold: true,
                        Alignment: isPortrait ? 8 : 1,
                        MarginV: isPortrait ? 24 : 26,
                        MarginL: isPortrait ? 24 : 28,
                        MarginR: isPortrait ? 24 : 320,
                        FontScalePercent: isPortrait ? 116 : 108,
                        OutlineColorHex: "#7F1D1D",
                        BackColorHex: "#DC2626",
                        SecondaryColorHex: palette.PrimaryHex,
                        OpaqueBox: true)
                };

                var fontSize = isPortrait ? 52 : 56;
                var assText = subtitleWriter.Write(new SubtitleRequest(
                    canvas, lines, styles, AssSubtitleWriter.StockFontName, fontSize));
                var assFullPath = workspace.Resolve("in/thumb.ass");
                await File.WriteAllTextAsync(assFullPath, assText, new UTF8Encoding(false), ct).ConfigureAwait(false);
                assRelPath = "in/thumb.ass";
            }

            // Aggressive zoomed MJO upper-body & face composition: frame from above hair/mirror down to waist (cropping out floor/shoes)
            var colorGrade = "eq=contrast=1.22:saturation=1.42:brightness=0.04,unsharp=5:5:0.95:5:5:0.0";
            var assFilter = assRelPath is not null ? $",ass={assRelPath}" : string.Empty;
            string filterComplex;
            if (sourceIsCleanPng)
            {
                filterComplex = isPortrait
                    ? $"[0:v]crop=iw*0.92:ih*0.70:iw*0.04:ih*0.09,scale={outWidth}:{outHeight}:flags=lanczos,{colorGrade}{assFilter}[v]"
                    : $"[0:v]crop=iw*0.86:ih*0.78:iw*0.07:ih*0.02,scale={outWidth}:{outHeight}:flags=lanczos,{colorGrade}{assFilter}[v]";
            }
            else
            {
                filterComplex = isPortrait
                    ? $"[0:v]crop=iw*0.92:ih*0.48:iw*0.04:ih*0.16,scale={outWidth}:{outHeight}:force_original_aspect_ratio=increase,crop={outWidth}:{outHeight},{colorGrade}{assFilter}[v]"
                    : $"[0:v]crop=iw*0.78:ih*0.58:iw*0.11:ih*0.14,scale={outWidth}:{outHeight}:flags=lanczos,{colorGrade}{assFilter}[v]";
            }

            foreach (var quality in new[] { 2, 4, 7 })
            {
                var psi = new ProcessStartInfo
                {
                    FileName = ResolveFfmpegExe(),
                    WorkingDirectory = workspace.RootPath,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };
                var args = new List<string> { "-hide_banner", "-loglevel", "error", "-y" };
                if (!sourceIsCleanPng)
                {
                    args.Add("-ss");
                    args.Add(timestamp.ToString("0.###", CultureInfo.InvariantCulture));
                }
                args.AddRange([
                    "-i", sourceInputPath,
                    "-filter_complex", filterComplex,
                    "-map", "[v]",
                    "-frames:v", "1",
                    "-q:v", quality.ToString(CultureInfo.InvariantCulture),
                    "-f", "image2", "-c:v", "mjpeg",
                    outPath
                ]);
                foreach (var arg in args)
                    psi.ArgumentList.Add(arg);

                using var proc = new Process { StartInfo = psi };
                if (!proc.Start()) return null;
                _ = proc.StandardError.ReadToEndAsync(ct);
                await proc.WaitForExitAsync(ct).ConfigureAwait(false);

                if (proc.ExitCode == 0 && File.Exists(outPath))
                {
                    var bytes = await File.ReadAllBytesAsync(outPath, ct).ConfigureAwait(false);
                    if (bytes.Length > 0 && bytes.Length <= YouTubeThumbnailRules.MaxYouTubeBytes)
                        return bytes;
                }
            }
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogDebug(ex, "Procedural 3D scene thumbnail generation fell back for job {JobId}.", job.Id);
        }

        return null;
    }

    public static double PickPeakDramaTimestamp(string? script, double? durationSeconds)
    {
        var dur = durationSeconds is { } d && double.IsFinite(d) && d > 1.5 ? d : 16.0;
        var lines = (script ?? string.Empty)
            .Split(['\r', '\n'], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Where(l => !l.StartsWith("[SCENE", StringComparison.OrdinalIgnoreCase)
                     && !l.StartsWith("[CAST", StringComparison.OrdinalIgnoreCase)
                     && !l.StartsWith("[PROP", StringComparison.OrdinalIgnoreCase)
                     && !l.StartsWith("[SHOT", StringComparison.OrdinalIgnoreCase))
            .ToList();

        if (lines.Count > 2)
        {
            var bestIdx = -1;
            var bestScore = 0;
            for (var i = 0; i < lines.Count; i++)
            {
                var line = lines[i];
                var score = 0;
                if (PeakCueRegex().IsMatch(line)) score += 3;
                if (line.Contains("[MEME", StringComparison.OrdinalIgnoreCase)) score += 2;
                if (line.Contains('!') || line.Contains('?')) score += 1;
                // Prefer expressive reaction window (25%..78% into the story) rather than frame 0
                var ratio = (i + 0.5) / lines.Count;
                if (ratio is >= 0.22 and <= 0.78) score += 2;
                if (score > bestScore)
                {
                    bestScore = score;
                    bestIdx = i;
                }
            }

            if (bestIdx >= 0 && bestScore > 1)
            {
                var est = dur * ((bestIdx + 0.45) / lines.Count);
                return Math.Round(Math.Clamp(est, Math.Min(1.2, dur * 0.2), Math.Max(1.3, dur - 1.2)), 1);
            }
        }

        return Math.Round(Math.Clamp(dur * 0.42, Math.Min(1.2, dur * 0.25), Math.Max(1.3, dur - 1.2)), 1);
    }

    public static string ExtractPunchHookHeadline(string? title)
    {
        if (string.IsNullOrWhiteSpace(title))
            return "धमाकेदार कॉमेडी 😂";

        var primary = title.Split(['|', '•', '—', '\n'], StringSplitOptions.RemoveEmptyEntries)[0].Trim();
        var words = Regex.Split(primary, @"\s+").Where(w => w.Length > 0).Take(4).ToArray();
        var joined = words.Length > 0 ? string.Join(' ', words) : primary;
        if (joined.Length > 28) joined = joined[..27].TrimEnd() + "…";
        return joined;
    }

    private string ResolveFfmpegExe() =>
        string.IsNullOrWhiteSpace(ffmpegOptions.Value.FfmpegPath) ? "ffmpeg" : ffmpegOptions.Value.FfmpegPath;

    [GeneratedRegex(@"\b(angry|surprised|laughing|punch|kick|facepalm|crash|scared|mirr|glasses|cutting|chasma)\b|अबे|बावले|गया|कांड|😂|😡|😱", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex PeakCueRegex();
}
