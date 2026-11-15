using System.Collections.Concurrent;
using System.Diagnostics;
using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Abstractions.Music;
using AnimStudio.Application.Ai;
using AnimStudio.Application.Music;
using AnimStudio.Application.Rendering;
using AnimStudio.Infrastructure.Ffmpeg;
using AnimStudio.Infrastructure.Storage;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AnimStudio.Infrastructure.Rendering;

public sealed record StudioBgmPresetInfo(
    string Id,
    ProceduralSceneTheme Theme,
    string Name,
    string BestFor,
    bool IsCached,
    string Source);

/// <summary>
/// One-time persistent cache of clean, musical stereo BGM tracks per procedural visual theme.
/// <para>
/// Generates or sources each theme's master WAV track once under <c>{DataRoot}/bgm-presets/</c>
/// (preferring Google Lyria via <see cref="IMusicGeneratingProvider"/>, then licensed instrumental
/// tracks via <see cref="IMusicCatalog"/>, then our warm multi-bar <see cref="ProceduralAudioSynthesizer"/>
/// chord pad) so all future animated videos, Auto-Posts, and Video Editor Auto-Shorts reuse clean,
/// non-grating background music with zero repeated synthesis cost.
/// </para>
/// </summary>
public sealed class ProceduralBgmCacheService(
    IOptions<FfmpegOptions> ffmpegOptions,
    AppDataPaths? paths = null,
    IAiProviderRegistry? aiRegistry = null,
    IMusicCatalog? musicCatalog = null,
    ILogger<ProceduralBgmCacheService>? logger = null)
{
    private const int DefaultPresetSeconds = 36;
    private const long MaxCatalogDownloadBytes = 20 * 1024 * 1024;
    private static readonly string[] LyriaModels = ["lyria-3.5", "lyria-3-pro-preview", "lyria-3-clip-preview"];
    private static readonly ConcurrentDictionary<ProceduralSceneTheme, SemaphoreSlim> ThemeLocks = new();

    private string PresetsDir => Path.Combine(
        paths?.Root is { Length: > 0 } root ? root : Path.Combine(Path.GetTempPath(), "animstudio-data"),
        "bgm-presets");

    public IReadOnlyList<StudioBgmPresetInfo> ListPresets()
    {
        return
        [
            Describe(ProceduralSceneTheme.VedicTempleSunrise3D, "vedic-sunrise", "Vedic Sunrise Tanpura & Bansuri", "Panchang, Katha & Temple Devotional"),
            Describe(ProceduralSceneTheme.CosmosSacred3D, "cosmos-sacred", "Sacred Cosmos Meditative Pad", "Daily Panchang, Nakshatra & Astronomy"),
            Describe(ProceduralSceneTheme.HistoryChronicle3D, "history-chronicle", "Archival Cello & Documentary Bed", "Aaj Ka Itihaas & Historical Stories"),
            Describe(ProceduralSceneTheme.NeonCyberGrid3D, "neon-cyber", "Modern Chill Synth Underscore", "Tech, Pratiyogita Quizzes & Tutorials"),
            Describe(ProceduralSceneTheme.SereneNatureGlow, "serene-nature", "Serene Acoustic Morning Breeze", "Wisdom Quotes, Motivation & Calm Shorts")
        ];
    }

    public ProceduralSceneTheme? ResolveThemeByPresetId(string? id) => (id ?? string.Empty).Trim().ToLowerInvariant() switch
    {
        "vedic-sunrise" => ProceduralSceneTheme.VedicTempleSunrise3D,
        "cosmos-sacred" => ProceduralSceneTheme.CosmosSacred3D,
        "history-chronicle" => ProceduralSceneTheme.HistoryChronicle3D,
        "neon-cyber" => ProceduralSceneTheme.NeonCyberGrid3D,
        "serene-nature" => ProceduralSceneTheme.SereneNatureGlow,
        _ => null
    };

    public async Task<(string WavPath, string Source)> EnsurePresetWavAsync(
        ProceduralSceneTheme requestedTheme,
        bool forceRefresh = false,
        CancellationToken ct = default)
    {
        var theme = requestedTheme == ProceduralSceneTheme.Auto
            ? ProceduralSceneTheme.VedicTempleSunrise3D
            : requestedTheme;

        Directory.CreateDirectory(PresetsDir);
        var slug = SlugFor(theme);
        var wavPath = Path.Combine(PresetsDir, $"{slug}.wav");
        var sourcePath = Path.Combine(PresetsDir, $"{slug}.source");

        if (!forceRefresh && IsValidNonEmptyWav(wavPath))
        {
            var cachedSource = File.Exists(sourcePath)
                ? (await File.ReadAllTextAsync(sourcePath, ct).ConfigureAwait(false)).Trim()
                : "cached";
            return (wavPath, string.IsNullOrWhiteSpace(cachedSource) ? "cached" : cachedSource);
        }

        var gate = ThemeLocks.GetOrAdd(theme, _ => new SemaphoreSlim(1, 1));
        await gate.WaitAsync(ct).ConfigureAwait(false);
        try
        {
            if (!forceRefresh && IsValidNonEmptyWav(wavPath))
            {
                var cachedSource = File.Exists(sourcePath)
                    ? (await File.ReadAllTextAsync(sourcePath, ct).ConfigureAwait(false)).Trim()
                    : "cached";
                return (wavPath, string.IsNullOrWhiteSpace(cachedSource) ? "cached" : cachedSource);
            }

            // Tier 1: One-time Google Lyria instrumental generation (when configured)
            var lyriaResult = await TryCreateWithLyriaAsync(theme, wavPath, ct).ConfigureAwait(false);
            if (lyriaResult is not null)
            {
                await File.WriteAllTextAsync(sourcePath, lyriaResult, ct).ConfigureAwait(false);
                return (wavPath, lyriaResult);
            }

            // Tier 2: One-time royalty-free instrumental Jamendo download (when configured)
            var jamendoResult = await TryCreateWithCatalogAsync(theme, wavPath, ct).ConfigureAwait(false);
            if (jamendoResult is not null)
            {
                await File.WriteAllTextAsync(sourcePath, jamendoResult, ct).ConfigureAwait(false);
                return (wavPath, jamendoResult);
            }

            // Tier 3: Clean, warm multi-bar studio pad synthesized once and reused across videos/clips
            var tmpWav = Path.Combine(PresetsDir, $"{slug}.{Guid.NewGuid():n}.tmp.wav");
            try
            {
                await ProceduralAudioSynthesizer.WriteAmbientWavAsync(tmpWav, theme, DefaultPresetSeconds, ct).ConfigureAwait(false);
                File.Move(tmpWav, wavPath, overwrite: true);
            }
            finally
            {
                TryDelete(tmpWav);
            }

            const string padSource = "studio-pad-v2";
            await File.WriteAllTextAsync(sourcePath, padSource, ct).ConfigureAwait(false);
            return (wavPath, padSource);
        }
        finally
        {
            gate.Release();
        }
    }

    private StudioBgmPresetInfo Describe(ProceduralSceneTheme theme, string id, string name, string bestFor)
    {
        var wavPath = Path.Combine(PresetsDir, $"{id}.wav");
        var sourcePath = Path.Combine(PresetsDir, $"{id}.source");
        var isCached = IsValidNonEmptyWav(wavPath);
        var source = isCached && File.Exists(sourcePath)
            ? File.ReadAllText(sourcePath).Trim()
            : isCached ? "cached" : "auto-generate";
        return new StudioBgmPresetInfo(id, theme, name, bestFor, isCached, source);
    }

    private async Task<string?> TryCreateWithLyriaAsync(ProceduralSceneTheme theme, string targetWavPath, CancellationToken ct)
    {
        var composer = aiRegistry?.SpeechChain().OfType<IMusicGeneratingProvider>().FirstOrDefault(p => p.IsConfigured);
        if (composer is null) return null;

        var prompt = MusicPromptFor(theme);
        foreach (var model in LyriaModels)
        {
            ct.ThrowIfCancellationRequested();
            try
            {
                var generated = await composer.GenerateMusicAsync(prompt, model, ct).ConfigureAwait(false);
                var sniffed = AiAudioValidator.Sniff(generated.Content);
                if (sniffed is null) continue;

                var ext = sniffed == AiAudioValidator.Mp3 ? ".mp3" : ".wav";
                var rawTemp = Path.Combine(PresetsDir, $"lyria-{Guid.NewGuid():n}{ext}");
                var normTemp = Path.Combine(PresetsDir, $"lyria-{Guid.NewGuid():n}.norm.wav");
                try
                {
                    await File.WriteAllBytesAsync(rawTemp, generated.Content, ct).ConfigureAwait(false);
                    var converted = await NormalizeToLoopableWavAsync(rawTemp, normTemp, ct).ConfigureAwait(false);
                    if (converted && IsValidNonEmptyWav(normTemp))
                    {
                        File.Move(normTemp, targetWavPath, overwrite: true);
                        logger?.LogInformation("Cached one-time studio BGM preset for {Theme} using {Model}.", theme, generated.Model);
                        return $"lyria:{generated.Model}";
                    }
                }
                finally
                {
                    TryDelete(rawTemp);
                    TryDelete(normTemp);
                }
            }
            catch (AiProviderException ex)
            {
                logger?.LogDebug("BGM preset {Theme}: Lyria model {Model} skipped ({Code}).", theme, model, ex.Code);
                if (ex.Code is "rate-limited" or "credential-rejected" or "credential-missing" or "quota-exhausted")
                    break;
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger?.LogDebug(ex, "BGM preset {Theme}: Lyria model {Model} failed.", theme, model);
            }
        }

        return null;
    }

    private async Task<string?> TryCreateWithCatalogAsync(ProceduralSceneTheme theme, string targetWavPath, CancellationToken ct)
    {
        if (musicCatalog is null || !musicCatalog.IsConfigured) return null;

        try
        {
            var (searchText, mood) = CatalogQueryFor(theme);
            var page = await musicCatalog.SearchAsync(new MusicSearchQuery(
                Text: searchText,
                Genre: null,
                Mood: mood,
                Tempo: "low",
                InstrumentalOnly: true,
                MinSeconds: 25,
                MaxSeconds: 180,
                Sort: MusicSort.PopularMonth,
                Page: 1,
                IncludeNonCommercial: false), ct).ConfigureAwait(false);

            var track = page.Tracks.FirstOrDefault(t => t.Downloadable);
            if (track is null) return null;

            var bytes = await musicCatalog.DownloadAsync(track, MaxCatalogDownloadBytes, ct).ConfigureAwait(false);
            if (AiAudioValidator.Sniff(bytes) is null) return null;

            var rawTemp = Path.Combine(PresetsDir, $"cat-{Guid.NewGuid():n}.mp3");
            var normTemp = Path.Combine(PresetsDir, $"cat-{Guid.NewGuid():n}.norm.wav");
            try
            {
                await File.WriteAllBytesAsync(rawTemp, bytes, ct).ConfigureAwait(false);
                var converted = await NormalizeToLoopableWavAsync(rawTemp, normTemp, ct).ConfigureAwait(false);
                if (converted && IsValidNonEmptyWav(normTemp))
                {
                    File.Move(normTemp, targetWavPath, overwrite: true);
                    logger?.LogInformation("Cached one-time studio BGM preset for {Theme} from {Provider} ({Title}).",
                        theme, musicCatalog.ProviderId, track.Title);
                    return $"{musicCatalog.ProviderId}:{track.Id}";
                }
            }
            finally
            {
                TryDelete(rawTemp);
                TryDelete(normTemp);
            }
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger?.LogDebug(ex, "BGM preset {Theme}: catalog lookup failed cleanly; falling back to warm studio pad.", theme);
        }

        return null;
    }

    private async Task<bool> NormalizeToLoopableWavAsync(string inputPath, string outputWavPath, CancellationToken ct)
    {
        var ffmpegPath = string.IsNullOrWhiteSpace(ffmpegOptions.Value.FfmpegPath)
            ? "ffmpeg"
            : ffmpegOptions.Value.FfmpegPath;

        var startInfo = new ProcessStartInfo
        {
            FileName = ffmpegPath,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            RedirectStandardInput = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };

        // Keep up to 45s of clean instrumental normalized to -22 LUFS so voice always sits clearly in front.
        foreach (var arg in new[]
        {
            "-y",
            "-i", inputPath,
            "-vn",
            "-t", "45",
            "-af", "aresample=48000,aformat=channel_layouts=stereo,highpass=f=60,lowpass=f=12000,loudnorm=I=-22:TP=-2:LRA=8,afade=t=in:st=0:d=0.6",
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
        timeoutCts.CancelAfter(TimeSpan.FromSeconds(45));
        _ = proc.StandardError.ReadToEndAsync(timeoutCts.Token);
        await proc.WaitForExitAsync(timeoutCts.Token).ConfigureAwait(false);
        return proc.ExitCode == 0 && File.Exists(outputWavPath);
    }

    private static bool IsValidNonEmptyWav(string path)
    {
        if (!File.Exists(path)) return false;
        var fi = new FileInfo(path);
        return fi.Length > 4096;
    }

    private static string SlugFor(ProceduralSceneTheme theme) => theme switch
    {
        ProceduralSceneTheme.VedicTempleSunrise3D => "vedic-sunrise",
        ProceduralSceneTheme.CosmosSacred3D => "cosmos-sacred",
        ProceduralSceneTheme.HistoryChronicle3D => "history-chronicle",
        ProceduralSceneTheme.NeonCyberGrid3D => "neon-cyber",
        ProceduralSceneTheme.SereneNatureGlow => "serene-nature",
        _ => "vedic-sunrise"
    };

    private static string MusicPromptFor(ProceduralSceneTheme theme) => theme switch
    {
        ProceduralSceneTheme.VedicTempleSunrise3D =>
            "Serene Indian morning Bansuri flute over soft warm tanpura drone and gentle temple bells, calm devotional background underscore suitable behind spoken voice, instrumental only, no vocals, no harsh percussion.",
        ProceduralSceneTheme.CosmosSacred3D =>
            "Warm meditative celestial ambient pad with soft Indian Bansuri overtones and subtle glass harmonic chimes, peaceful spiritual background bed behind narration, instrumental only, no vocals.",
        ProceduralSceneTheme.HistoryChronicle3D =>
            "Warm cinematic documentary underscore with gentle cello, soft acoustic plucked lute and atmospheric pad, noble timeless mood suitable behind storytelling narration, instrumental only, no vocals.",
        ProceduralSceneTheme.NeonCyberGrid3D =>
            "Smooth warm chillwave electric piano and subtle soft analog synth pad, calm modern educational underscore suitable behind voiceover, instrumental only, no vocals.",
        _ =>
            "Peaceful fingerpicked acoustic guitar and soft warm morning flute breeze pad, gentle uplifting meditation underscore behind voiceover, instrumental only, no vocals."
    };

    private static (string Text, string? Mood) CatalogQueryFor(ProceduralSceneTheme theme) => theme switch
    {
        ProceduralSceneTheme.VedicTempleSunrise3D => ("meditation flute indian ambient", "calm"),
        ProceduralSceneTheme.CosmosSacred3D => ("ambient spiritual pad meditation", "calm"),
        ProceduralSceneTheme.HistoryChronicle3D => ("cinematic documentary piano cello", "inspirational"),
        ProceduralSceneTheme.NeonCyberGrid3D => ("chill lo-fi ambient synth", "hopeful"),
        _ => ("peaceful acoustic nature ambient", "calm")
    };

    private static void TryDelete(string path)
    {
        try { if (File.Exists(path)) File.Delete(path); } catch { /* ignore */ }
    }
}
