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
            Describe(ProceduralSceneTheme.SereneNatureGlow, "serene-nature", "Serene Acoustic Morning Breeze", "Wisdom Quotes, Motivation & Calm Shorts"),
            Describe(ProceduralSceneTheme.ComedyStage3D, "comedy-stage", "Upbeat Comedy & Tapri Pluck Groove", "Funny Shorts, Jokes & @KESHAV-ANIM-FF")
        ];
    }

    public ProceduralSceneTheme? ResolveThemeByPresetId(string? id) => (id ?? string.Empty).Trim().ToLowerInvariant() switch
    {
        "vedic-sunrise" => ProceduralSceneTheme.VedicTempleSunrise3D,
        "cosmos-sacred" => ProceduralSceneTheme.CosmosSacred3D,
        "history-chronicle" => ProceduralSceneTheme.HistoryChronicle3D,
        "neon-cyber" => ProceduralSceneTheme.NeonCyberGrid3D,
        "serene-nature" => ProceduralSceneTheme.SereneNatureGlow,
        "comedy-stage" => ProceduralSceneTheme.ComedyStage3D,
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

        if (!forceRefresh && IsValidNonEmptyWav(wavPath) && IsStereo48kWav(wavPath))
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
                if (!IsStereo48kWav(wavPath))
                {
                    var tmpNorm = Path.Combine(PresetsDir, $"{slug}.{Guid.NewGuid():n}.48k.wav");
                    try
                    {
                        if (await NormalizeToLoopableWavAsync(wavPath, tmpNorm, ct).ConfigureAwait(false)
                            && IsStereo48kWav(tmpNorm)
                            && IsValidNonEmptyWav(tmpNorm))
                        {
                            File.Move(tmpNorm, wavPath, overwrite: true);
                        }
                    }
                    finally
                    {
                        TryDelete(tmpNorm);
                    }
                }

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

    public Task<bool> NormalizeCustomAudioToWavAsync(
        string inputPath,
        string outputWavPath,
        int maxSeconds,
        CancellationToken ct) =>
        NormalizeToLoopableWavAsync(inputPath, outputWavPath, ct, Math.Clamp(maxSeconds, 10, 600));

    private async Task<bool> NormalizeToLoopableWavAsync(
        string inputPath,
        string outputWavPath,
        CancellationToken ct,
        int maxSeconds = 45)
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

        // Keep up to 45s of clean instrumental normalized to -22 LUFS and resampled back to 48kHz stereo after loudnorm (which upsamples to 192kHz internally).
        foreach (var arg in new[]
        {
            "-y",
            "-i", inputPath,
            "-vn",
            "-t", maxSeconds.ToString(System.Globalization.CultureInfo.InvariantCulture),
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

    internal static bool IsStereo48kWav(string path)
    {
        try
        {
            if (!File.Exists(path)) return false;
            using var fs = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.ReadWrite);
            if (fs.Length < 44) return false;

            Span<byte> buf = stackalloc byte[(int)Math.Min(fs.Length, 4096)];
            var read = fs.Read(buf);
            if (read < 44) return false;
            if (buf[0] != 'R' || buf[1] != 'I' || buf[2] != 'F' || buf[3] != 'F') return false;
            if (buf[8] != 'W' || buf[9] != 'A' || buf[10] != 'V' || buf[11] != 'E') return false;

            var offset = 12;
            while (offset + 8 <= read)
            {
                var isFmt = buf[offset] == 'f' && buf[offset + 1] == 'm' && buf[offset + 2] == 't' && buf[offset + 3] == ' ';
                var chunkSize = System.Buffers.Binary.BinaryPrimitives.ReadUInt32LittleEndian(buf.Slice(offset + 4, 4));
                var payloadOffset = offset + 8;

                if (isFmt)
                {
                    if (chunkSize < 16 || payloadOffset + 16 > read) return false;
                    var audioFormat = System.Buffers.Binary.BinaryPrimitives.ReadUInt16LittleEndian(buf.Slice(payloadOffset, 2));
                    var channels = System.Buffers.Binary.BinaryPrimitives.ReadUInt16LittleEndian(buf.Slice(payloadOffset + 2, 2));
                    var sampleRate = System.Buffers.Binary.BinaryPrimitives.ReadUInt32LittleEndian(buf.Slice(payloadOffset + 4, 4));
                    var bitsPerSample = System.Buffers.Binary.BinaryPrimitives.ReadUInt16LittleEndian(buf.Slice(payloadOffset + 14, 2));
                    return audioFormat == 1 && channels == 2 && sampleRate == 48_000 && bitsPerSample == 16;
                }

                var step = 8L + chunkSize + (chunkSize & 1);
                if (step <= 8 || offset + step > read) break;
                offset += (int)step;
            }
            return false;
        }
        catch
        {
            return false;
        }
    }

    private static string SlugFor(ProceduralSceneTheme theme) => theme switch
    {
        ProceduralSceneTheme.VedicTempleSunrise3D => "vedic-sunrise",
        ProceduralSceneTheme.CosmosSacred3D => "cosmos-sacred",
        ProceduralSceneTheme.HistoryChronicle3D => "history-chronicle",
        ProceduralSceneTheme.NeonCyberGrid3D => "neon-cyber",
        ProceduralSceneTheme.SereneNatureGlow => "serene-nature",
        ProceduralSceneTheme.ComedyStage3D => "comedy-stage",
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
        ProceduralSceneTheme.ComedyStage3D =>
            "Playful upbeat Indian comedy underscore with light pizzicato strings, soft marimba plucks and cheerful bounce suitable behind funny dialogue punchlines, instrumental only, no vocals.",
        _ =>
            "Peaceful fingerpicked acoustic guitar and soft warm morning flute breeze pad, gentle uplifting meditation underscore behind voiceover, instrumental only, no vocals."
    };

    private static (string Text, string? Mood) CatalogQueryFor(ProceduralSceneTheme theme) => theme switch
    {
        ProceduralSceneTheme.VedicTempleSunrise3D => ("meditation flute indian ambient", "calm"),
        ProceduralSceneTheme.CosmosSacred3D => ("ambient spiritual pad meditation", "calm"),
        ProceduralSceneTheme.HistoryChronicle3D => ("cinematic documentary piano cello", "inspirational"),
        ProceduralSceneTheme.NeonCyberGrid3D => ("chill lo-fi ambient synth", "hopeful"),
        ProceduralSceneTheme.ComedyStage3D => ("playful comedy pizzicato upbeat", "happy"),
        _ => ("peaceful acoustic nature ambient", "calm")
    };

    private static void TryDelete(string path)
    {
        try { if (File.Exists(path)) File.Delete(path); } catch { /* ignore */ }
    }
}
