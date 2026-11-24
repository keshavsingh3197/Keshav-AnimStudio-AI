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

            var heroCopy = ThumbnailPosterCopy.ExtractComedyHooks(title, script);
            var emotionPalette = ProceduralThumbnailStyler.GetEmotionPalette(heroCopy.Emotion);

            // Step 1: Decode & hero-zoom raw RGBA pixels so characters fill 55-65% of the canvas
            var cropFilter = BuildHeroCropFilter(sourceIsCleanPng, isPortrait, outWidth, outHeight);
            var rawRgba = await DecodeToRgbaAsync(
                workspace,
                sourceInputPath,
                sourceIsCleanPng ? null : timestamp,
                cropFilter,
                outWidth,
                outHeight,
                ct).ConfigureAwait(false);
            if (rawRgba is null)
                return null;

            // Step 2: Apply radial emotion spotlight, 60-30-10 edge vignette & text safe-zone scrim
            ProceduralThumbnailStyler.ApplyHighCtrLightingRgba(rawRgba, outWidth, outHeight, heroCopy.Emotion, isPortrait);

            string? assRelPath = null;
            if (capabilities.Supports(RenderFeature.BurnedSubtitles))
            {
                var canvas = new Canvas(outWidth, outHeight, new FrameRate(1, 1));
                var lines = new List<DialogueLine>
                {
                    new()
                    {
                        Index = 0,
                        SpeakerLabel = "HeroHook",
                        SpeakerCharacterId = "ct-hero",
                        Text = WrapHookLines(heroCopy.HeroHook, isPortrait ? 20 : 18),
                        RelativeStartFrame = 0,
                        RelativeEndFrame = 2
                    },
                    new()
                    {
                        Index = 1,
                        SpeakerLabel = "ReactionBadge",
                        SpeakerCharacterId = "ct-badge",
                        Text = heroCopy.ReactionBadge,
                        RelativeStartFrame = 0,
                        RelativeEndFrame = 2
                    }
                };

                // Bold thick-stroked YouTube curiosity headline + vivid reaction pill safely inside mobile viewport
                var styles = isPortrait
                    ? new Dictionary<string, SubtitleStyle>(StringComparer.Ordinal)
                    {
                        ["ct-hero"] = new(
                            "ThumbHero",
                            emotionPalette.HeroTextHex,
                            Bold: true,
                            Alignment: 8,
                            MarginV: 44,
                            MarginL: 34,
                            MarginR: 34,
                            FontScalePercent: 146,
                            OutlineColorHex: emotionPalette.HeroOutlineHex,
                            BackColorHex: "#000000",
                            SecondaryColorHex: palette.PrimaryHex,
                            OpaqueBox: false,
                            OutlineWidth: 8.0,
                            ShadowDepth: 4.5,
                            AngleDegrees: -1.8),
                        ["ct-badge"] = new(
                            "ThumbBadge",
                            emotionPalette.PillTextHex,
                            Bold: true,
                            Alignment: 2,
                            MarginV: 144,
                            MarginL: 48,
                            MarginR: 48,
                            FontScalePercent: 98,
                            OutlineColorHex: emotionPalette.PillBgHex,
                            BackColorHex: emotionPalette.PillBgHex,
                            SecondaryColorHex: emotionPalette.AccentHex,
                            OpaqueBox: true)
                    }
                    : new Dictionary<string, SubtitleStyle>(StringComparer.Ordinal)
                    {
                        ["ct-hero"] = new(
                            "ThumbHero",
                            emotionPalette.HeroTextHex,
                            Bold: true,
                            Alignment: 7,
                            MarginV: 36,
                            MarginL: 44,
                            MarginR: 640,
                            FontScalePercent: 136,
                            OutlineColorHex: emotionPalette.HeroOutlineHex,
                            BackColorHex: "#000000",
                            SecondaryColorHex: palette.PrimaryHex,
                            OpaqueBox: false,
                            OutlineWidth: 8.5,
                            ShadowDepth: 4.5,
                            AngleDegrees: -1.5),
                        ["ct-badge"] = new(
                            "ThumbBadge",
                            emotionPalette.PillTextHex,
                            Bold: true,
                            Alignment: 1,
                            MarginV: 58,
                            MarginL: 48,
                            MarginR: 640,
                            FontScalePercent: 98,
                            OutlineColorHex: emotionPalette.PillBgHex,
                            BackColorHex: emotionPalette.PillBgHex,
                            SecondaryColorHex: emotionPalette.AccentHex,
                            OpaqueBox: true)
                    };

                var fontSize = isPortrait ? 52 : 56;
                var assText = subtitleWriter.Write(new SubtitleRequest(
                    canvas, lines, styles, AssSubtitleWriter.StockFontName, fontSize));
                var assFullPath = workspace.Resolve("in/thumb.ass");
                await File.WriteAllTextAsync(assFullPath, assText, new UTF8Encoding(false), ct).ConfigureAwait(false);
                assRelPath = "in/thumb.ass";
            }

            var colorGrade = string.Create(
                CultureInfo.InvariantCulture,
                $"eq=contrast={emotionPalette.ContrastBoost:0.00}:saturation={emotionPalette.SaturationBoost:0.00}:brightness=0.04,unsharp=5:5:1.10:5:5:0.0");
            var vfChain = assRelPath is not null ? $"{colorGrade},ass={assRelPath}" : colorGrade;

            foreach (var quality in new[] { 2, 4, 7 })
            {
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
                    "-hide_banner", "-loglevel", "error", "-y",
                    "-f", "rawvideo", "-pixel_format", "rgba",
                    "-video_size", string.Create(CultureInfo.InvariantCulture, $"{outWidth}x{outHeight}"),
                    "-framerate", "1", "-i", "pipe:0",
                    "-vf", vfChain,
                    "-frames:v", "1",
                    "-q:v", quality.ToString(CultureInfo.InvariantCulture),
                    "-f", "image2", "-c:v", "mjpeg",
                    outPath
                })
                {
                    psi.ArgumentList.Add(arg);
                }

                using var proc = new Process { StartInfo = psi };
                if (!proc.Start()) return null;
                await using (var stdin = proc.StandardInput.BaseStream)
                {
                    await stdin.WriteAsync(rawRgba, 0, rawRgba.Length, ct).ConfigureAwait(false);
                    await stdin.FlushAsync(ct).ConfigureAwait(false);
                }
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

    private static string BuildHeroCropFilter(bool sourceIsCleanPng, bool isPortrait, int outWidth, int outHeight)
    {
        if (sourceIsCleanPng)
        {
            return isPortrait
                // Preserve clean upper ceiling headroom for the safe-zone hero hook while cropping lower floor space
                ? $"crop=iw*0.88:ih*0.72:iw*0.06:ih*0.04,scale={outWidth}:{outHeight}:flags=lanczos,format=rgba"
                : $"crop=iw*0.82:ih*0.74:iw*0.06:ih*0.02,scale={outWidth}:{outHeight}:flags=lanczos,format=rgba";
        }
        return isPortrait
            ? $"crop=iw*0.88:ih*0.48:iw*0.06:ih*0.14,scale={outWidth}:{outHeight}:force_original_aspect_ratio=increase,crop={outWidth}:{outHeight},format=rgba"
            : $"crop=iw*0.78:ih*0.58:iw*0.10:ih*0.11,scale={outWidth}:{outHeight}:flags=lanczos,format=rgba";
    }

    private async Task<byte[]?> DecodeToRgbaAsync(
        IRenderWorkspace workspace,
        string sourceInputPath,
        double? seekSeconds,
        string vfFilter,
        int width,
        int height,
        CancellationToken ct)
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
        if (seekSeconds is { } ss)
        {
            args.Add("-ss");
            args.Add(ss.ToString("0.###", CultureInfo.InvariantCulture));
        }
        args.AddRange([
            "-i", sourceInputPath,
            "-vf", vfFilter,
            "-frames:v", "1",
            "-f", "rawvideo", "-pix_fmt", "rgba",
            "pipe:1"
        ]);
        foreach (var arg in args)
            psi.ArgumentList.Add(arg);

        using var proc = new Process { StartInfo = psi };
        if (!proc.Start()) return null;
        var expected = width * height * 4;
        using var ms = new MemoryStream(expected);
        await Task.WhenAll(
            proc.StandardOutput.BaseStream.CopyToAsync(ms, ct),
            proc.StandardError.ReadToEndAsync(ct)).ConfigureAwait(false);
        await proc.WaitForExitAsync(ct).ConfigureAwait(false);
        var bytes = ms.ToArray();
        return proc.ExitCode == 0 && bytes.Length == expected ? bytes : null;
    }

    private static string WrapHookLines(string text, int maxCharsPerLine)
    {
        var clean = (text ?? string.Empty).Trim();
        if (clean.Length <= maxCharsPerLine) return clean;
        var words = clean.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        if (words.Length <= 2) return clean;
        var mid = (words.Length + 1) / 2;
        return $"{string.Join(' ', words.Take(mid))}\n{string.Join(' ', words.Skip(mid))}";
    }

    private string ResolveFfmpegExe() =>
        string.IsNullOrWhiteSpace(ffmpegOptions.Value.FfmpegPath) ? "ffmpeg" : ffmpegOptions.Value.FfmpegPath;

    [GeneratedRegex(@"\b(angry|surprised|laughing|punch|kick|facepalm|crash|scared|mirr|glasses|cutting|chasma|corpseSnapUp)\b|अबे|बावले|गया|कांड|मर गए|तार|साँप|टंकी|गड्ढा|ओ मार भी दे|सब्र|😂|😡|😱", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex PeakCueRegex();
}
