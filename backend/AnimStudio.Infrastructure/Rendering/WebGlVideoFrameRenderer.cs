using System.Diagnostics;
using System.Reflection;
using System.Text.Json;
using System.Text.Json.Serialization;
using AnimStudio.Application.Rendering;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace AnimStudio.Infrastructure.Rendering;

/// <summary>
/// Renders full hardware/WebGL2 3D scenes via headless Edge/Chromium + Three.js and streams
/// top-down RGBA frames over stdout directly into FFmpeg at zero recurring GPU cost.
/// Gracefully reports unavailability in headless test or browserless containers so callers
/// fall back automatically to <see cref="ProceduralSceneRasterizer"/>.
/// </summary>
internal static class WebGlVideoFrameRenderer
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter() }
    };

    private static readonly Lazy<(string? NodeExe, string? BrowserExe)> DiscoveredTools = new(DiscoverTools);

    public static bool IsAvailable(IConfiguration? configuration = null)
    {
        if (string.Equals(configuration?["Render:EnableWebGl3D"], "false", StringComparison.OrdinalIgnoreCase))
            return false;

        var (nodeExe, browserExe) = ResolveTools(configuration);
        return !string.IsNullOrWhiteSpace(nodeExe) && !string.IsNullOrWhiteSpace(browserExe);
    }

    public static string SerializeJobJson(
        int width,
        int height,
        int fps,
        int durationSeconds,
        int totalFrames,
        int seed,
        ProceduralSceneTheme resolvedTheme,
        ProceduralVideoRequest request,
        ProceduralEventPalette palette,
        ProceduralDialoguePlan dialoguePlan,
        float[]? speechEnvelope,
        int backdropCount)
    {
        var runs = ProceduralSceneRasterizer.BuildSceneRuns(dialoguePlan);
        var effectiveVfx = request.VfxStyle != ProceduralVfxStyle.Auto
            ? request.VfxStyle
            : resolvedTheme switch
            {
                ProceduralSceneTheme.ComedyStage3D => ProceduralVfxStyle.ComedyBurst,
                ProceduralSceneTheme.NeonCyberGrid3D => ProceduralVfxStyle.CyberNeon,
                ProceduralSceneTheme.HistoryChronicle3D => ProceduralVfxStyle.CinematicDrama,
                _ => ProceduralVfxStyle.DivineAura
            };

        var payload = new
        {
            width,
            height,
            fps,
            durationSeconds,
            totalFrames,
            seed,
            theme = resolvedTheme,
            vfxStyle = effectiveVfx,
            enableDynamicCamera = request.EnableDynamicCamera,
            isSeamlessLoop = request.IsSeamlessLoop,
            isComedyMode = resolvedTheme == ProceduralSceneTheme.ComedyStage3D
                || string.Equals(request.EventType, "FunnyComedy", StringComparison.OrdinalIgnoreCase),
            uniqueVariant = unchecked(seed ^ (request.EpisodeNumber * 7919)),
            topCategoryLabel = request.TopCategoryLabel,
            footerLabel = request.FooterLabel,
            title = request.Title,
            palette = new
            {
                primaryHex = palette.PrimaryHex,
                secondaryHex = palette.SecondaryHex,
                speakerAHex = palette.SpeakerAHex,
                speakerBHex = palette.SpeakerBHex,
                topBackdropHex = ToHex(palette.TopBackdropRgb),
                midBackdropHex = ToHex(palette.MidBackdropRgb),
                botBackdropHex = ToHex(palette.BotBackdropRgb),
                headerBadgeText = palette.HeaderBadgeText
            },
            hasCharacters = dialoguePlan.HasCharacters,
            leftCharacter = dialoguePlan.LeftCharacter,
            rightCharacter = dialoguePlan.RightCharacter,
            supportingCast = dialoguePlan.Supporting,
            turns = dialoguePlan.Turns,
            sceneRuns = runs.Select(r => new
            {
                startSeconds = r.Start,
                endSeconds = double.IsFinite(r.End) ? r.End : durationSeconds,
                setting = r.Setting,
                timeOfDay = r.Time,
                sceneIndex = r.Index
            }),
            speechEnvelope,
            backdropCount,
            stageLayout = request.StageLayout
        };

        return JsonSerializer.Serialize(payload, JsonOptions);
    }

    public static async Task<WebGlFrameSession?> TryStartSessionAsync(
        string workDir,
        int width,
        int height,
        int fps,
        int durationSeconds,
        int totalFrames,
        int seed,
        ProceduralSceneTheme resolvedTheme,
        ProceduralVideoRequest request,
        ProceduralEventPalette palette,
        ProceduralDialoguePlan dialoguePlan,
        float[]? speechEnvelope,
        IReadOnlyList<byte[]>? backdropFrames,
        IConfiguration? configuration,
        ILogger logger,
        CancellationToken ct)
    {
        if (request.RenderEngine == ProceduralRenderEngine.CpuFast)
            return null;
        if (string.Equals(configuration?["Render:EnableWebGl3D"], "false", StringComparison.OrdinalIgnoreCase))
            return null;

        var (nodeExe, browserExe) = ResolveTools(configuration);
        if (string.IsNullOrWhiteSpace(nodeExe) || string.IsNullOrWhiteSpace(browserExe))
            return null;

        Directory.CreateDirectory(workDir);
        var indexPath = Path.Combine(workDir, "index.html");
        var runnerPath = Path.Combine(workDir, "render-3d-frames.mjs");
        var bundlePath = Path.Combine(workDir, "scene-3d.bundle.js");
        var jobPath = Path.Combine(workDir, "job.json");

        await ExtractResourceAsync("AnimStudio.WebGl3D.index.html", indexPath, ct).ConfigureAwait(false);
        await ExtractResourceAsync("AnimStudio.WebGl3D.render-3d-frames.mjs", runnerPath, ct).ConfigureAwait(false);
        await ExtractResourceAsync("AnimStudio.WebGl3D.scene-3d.bundle.js", bundlePath, ct).ConfigureAwait(false);

        var backdropsDir = string.Empty;
        var backdropCount = 0;
        if (backdropFrames is { Count: > 0 })
        {
            backdropsDir = Path.Combine(workDir, "backdrops");
            Directory.CreateDirectory(backdropsDir);
            for (var i = 0; i < backdropFrames.Count; i++)
            {
                await File.WriteAllBytesAsync(Path.Combine(backdropsDir, $"{i}.rgba"), backdropFrames[i], ct)
                    .ConfigureAwait(false);
            }
            backdropCount = backdropFrames.Count;
        }

        var jobJson = SerializeJobJson(
            width, height, fps, durationSeconds, totalFrames, seed,
            resolvedTheme, request, palette, dialoguePlan, speechEnvelope, backdropCount);
        await File.WriteAllTextAsync(jobPath, jobJson, ct).ConfigureAwait(false);

        var psi = new ProcessStartInfo
        {
            FileName = nodeExe,
            WorkingDirectory = workDir,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };
        psi.ArgumentList.Add(runnerPath);
        psi.ArgumentList.Add("--job");
        psi.ArgumentList.Add(jobPath);
        psi.ArgumentList.Add("--browser");
        psi.ArgumentList.Add(browserExe);
        psi.ArgumentList.Add("--html");
        psi.ArgumentList.Add(indexPath);
        psi.ArgumentList.Add("--bundle");
        psi.ArgumentList.Add(bundlePath);
        if (!string.IsNullOrEmpty(backdropsDir))
        {
            psi.ArgumentList.Add("--backdrops");
            psi.ArgumentList.Add(backdropsDir);
        }

        var proc = new Process { StartInfo = psi };
        try
        {
            if (!proc.Start())
            {
                proc.Dispose();
                return null;
            }
        }
        catch (Exception ex) when (ex is System.ComponentModel.Win32Exception or FileNotFoundException)
        {
            logger.LogWarning(ex, "Could not launch Node WebGL 3D renderer.");
            proc.Dispose();
            return null;
        }

        return new WebGlFrameSession(proc, width * height * 4, logger);
    }

    private static async Task ExtractResourceAsync(string logicalName, string targetPath, CancellationToken ct)
    {
        var asm = typeof(WebGlVideoFrameRenderer).Assembly;
        await using var src = asm.GetManifestResourceStream(logicalName)
            ?? throw new InvalidOperationException($"Missing embedded WebGL 3D resource '{logicalName}'.");
        await using var dst = new FileStream(targetPath, FileMode.Create, FileAccess.Write, FileShare.None, 81920, useAsync: true);
        await src.CopyToAsync(dst, ct).ConfigureAwait(false);
    }

    private static string ToHex(RgbColor c) => $"#{c.R:X2}{c.G:X2}{c.B:X2}";

    private static (string? NodeExe, string? BrowserExe) ResolveTools(IConfiguration? config)
    {
        var (defNode, defBrowser) = DiscoveredTools.Value;
        var node = FirstExecutable(config?["Render:NodePath"]) ?? defNode;
        var browser = FirstExecutable(config?["Render:BrowserPath"]) ?? defBrowser;
        return (node, browser);
    }

    private static (string? NodeExe, string? BrowserExe) DiscoverTools()
    {
        var node = FindOnPath("node.exe", "node");
        string[] candidates = OperatingSystem.IsWindows()
            ?
            [
                @"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
                @"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
                @"C:\Program Files\Google\Chrome\Application\chrome.exe",
                @"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
            ]
            :
            [
                "/usr/bin/google-chrome",
                "/usr/bin/chromium",
                "/usr/bin/chromium-browser",
                "/usr/bin/microsoft-edge",
            ];

        var browser = candidates.FirstOrDefault(File.Exists)
            ?? FindOnPath("msedge", "google-chrome", "chromium", "chromium-browser");
        return (node, browser);
    }

    private static string? FirstExecutable(string? path) =>
        !string.IsNullOrWhiteSpace(path) && File.Exists(path) ? path : null;

    private static string? FindOnPath(params string[] names)
    {
        var raw = Environment.GetEnvironmentVariable("PATH") ?? string.Empty;
        var dirs = raw.Split(Path.PathSeparator, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        foreach (var name in names)
        {
            foreach (var dir in dirs)
            {
                var full = Path.Combine(dir, name);
                if (File.Exists(full)) return full;
            }
        }
        return null;
    }
}

internal sealed class WebGlFrameSession : IAsyncDisposable
{
    private readonly Process _proc;
    private readonly int _frameBytes;
    private readonly ILogger _logger;
    private readonly Task<string> _stderrTask;
    private bool _disposed;

    public WebGlFrameSession(Process proc, int frameBytes, ILogger logger)
    {
        _proc = proc;
        _frameBytes = frameBytes;
        _logger = logger;
        _stderrTask = ReadTailAsync(proc.StandardError);
    }

    public async Task<bool> ReadNextFrameAsync(byte[] destination, CancellationToken ct)
    {
        if (destination.Length < _frameBytes)
            throw new ArgumentException("Destination buffer smaller than expected RGBA frame.", nameof(destination));

        var stream = _proc.StandardOutput.BaseStream;
        var total = 0;
        while (total < _frameBytes)
        {
            var n = await stream.ReadAsync(destination.AsMemory(total, _frameBytes - total), ct).ConfigureAwait(false);
            if (n == 0)
            {
                if (total == 0) return false;
                var err = await _stderrTask.ConfigureAwait(false);
                _logger.LogWarning("WebGL 3D renderer ended mid-frame ({Read}/{Expected} bytes): {Err}", total, _frameBytes, err);
                return false;
            }
            total += n;
        }
        return true;
    }

    public async Task<string> GetStderrAsync() => await _stderrTask.ConfigureAwait(false);

    public async ValueTask DisposeAsync()
    {
        if (_disposed) return;
        _disposed = true;
        try
        {
            if (!_proc.HasExited)
            {
                _proc.Kill(entireProcessTree: true);
            }
            await _proc.WaitForExitAsync(CancellationToken.None).ConfigureAwait(false);
        }
        catch { /* best effort */ }
        finally
        {
            _proc.Dispose();
        }
    }

    private static async Task<string> ReadTailAsync(StreamReader reader)
    {
        try
        {
            var text = await reader.ReadToEndAsync().ConfigureAwait(false);
            return text.Length > 1500 ? text[^1500..] : text;
        }
        catch
        {
            return string.Empty;
        }
    }
}
