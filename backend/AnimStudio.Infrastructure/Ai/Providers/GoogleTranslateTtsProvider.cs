using System.Diagnostics;
using System.Text;
using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Ai;
using AnimStudio.Application.Options;
using AnimStudio.Domain.Ai;
using AnimStudio.Infrastructure.Ffmpeg;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AnimStudio.Infrastructure.Ai.Providers;

/// <summary>
/// Free, keyless Google Translate TTS (<c>gTTS</c>) speech engine with natural Hindi and English
/// pronunciation across all machines (zero OS voice dependency). Long scripts are split into clean
/// clause chunks (&lt;= 180 chars) and joined via FFmpeg into a canonical 48kHz stereo PCM WAV.
/// </summary>
public sealed class GoogleTranslateTtsProvider(
    AiProviderId id,
    IAiHttpClientFactory clients,
    IAiSecretResolver secrets,
    IOptionsMonitor<AiOptions> options,
    IOptions<FfmpegOptions> ffmpegOptions,
    ILogger<GoogleTranslateTtsProvider> logger)
    : HttpAiProviderBase(id, AiCapability.Speech, clients, secrets, options, logger), ISpeechAiProvider
{
    private const int MaxChunkChars = 180;
    private const int MaxChunkAudioBytes = 4 * 1024 * 1024;
    private const string DefaultModel = "gtts-hi";

    private static readonly IReadOnlyList<AiVoice> Catalogue =
    [
        new("gtts-hi", "Google Hindi Standard (gTTS)", "hi", "female", "Clear natural Google Hindi voice (works on any machine, zero API key)"),
        new("gtts-en", "Google English (gTTS)", "en", "female", "Clear natural Google English voice (works on any machine, zero API key)")
    ];

    /// <summary>Google Translate TTS endpoint requires no API key.</summary>
    protected override bool RequiresApiKey => false;

    public Task<IReadOnlyList<AiVoice>> ListVoicesAsync(CancellationToken ct) =>
        Task.FromResult(Catalogue);

    public async Task<AiSpeechResult> SynthesizeAsync(AiSpeechRequest request, CancellationToken ct)
    {
        var text = request.Text?.Trim() ?? string.Empty;
        if (text.Length == 0)
            throw new AiProviderException("text-required", "There is nothing to speak.");

        var tl = ResolveLanguageCode(text, request.LanguageCode);
        var chunks = SplitIntoChunks(text, MaxChunkChars);
        if (chunks.Count == 0)
            throw new AiProviderException("text-required", "There is nothing to speak.");

        var mp3Chunks = new List<byte[]>(chunks.Count);
        foreach (var chunk in chunks)
        {
            var relUrl = $"translate_tts?ie=UTF-8&client=tw-ob&tl={Uri.EscapeDataString(tl)}&q={Uri.EscapeDataString(chunk)}";
            using var req = new HttpRequestMessage(HttpMethod.Get, relUrl);
            req.Headers.TryAddWithoutValidation("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
            var bytes = await SendForBytesAsync(req, MaxChunkAudioBytes, ct).ConfigureAwait(false);
            AiAudioValidator.Require(bytes, Id.Value);
            mp3Chunks.Add(bytes);
        }

        var model = Model?.Trim() is { Length: > 0 } m ? m : (tl == "en" ? "gtts-en" : DefaultModel);
        var provenance = new AiProvenance
        {
            ProviderId = Id.Value,
            Capability = AiCapability.Speech,
            Model = model,
            FromCache = false
        };

        var joinedWav = await ConvertAndJoinChunksToWavAsync(mp3Chunks, ct).ConfigureAwait(false);
        if (joinedWav is { Length: > 44 })
        {
            var duration = AiAudioValidator.TryGetWavDuration(joinedWav);
            return new AiSpeechResult(joinedWav, AiAudioValidator.Wav, duration, provenance);
        }

        // If FFmpeg isn't available (e.g. standalone lightweight environment) and 1 chunk arrived, hand back MP3 directly.
        if (mp3Chunks.Count == 1)
            return new AiSpeechResult(mp3Chunks[0], AiAudioValidator.Mp3, null, provenance);

        var totalBytes = mp3Chunks.Sum(c => c.Length);
        var rawMp3 = new byte[totalBytes];
        var offset = 0;
        foreach (var chunk in mp3Chunks)
        {
            Buffer.BlockCopy(chunk, 0, rawMp3, offset, chunk.Length);
            offset += chunk.Length;
        }
        return new AiSpeechResult(rawMp3, AiAudioValidator.Mp3, null, provenance);
    }

    internal static string ResolveLanguageCode(string text, string? requestedLang)
    {
        foreach (var ch in text)
        {
            if (ch is >= '\u0900' and <= '\u097F')
                return "hi";
        }
        if (!string.IsNullOrWhiteSpace(requestedLang))
        {
            var norm = requestedLang.Trim().ToLowerInvariant();
            if (norm.StartsWith("en", StringComparison.Ordinal)) return "en";
            if (norm.StartsWith("hi", StringComparison.Ordinal)) return "hi";
        }
        return "hi";
    }

    internal static IReadOnlyList<string> SplitIntoChunks(string text, int maxChars = MaxChunkChars)
    {
        var normalized = string.Join(' ', text.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries)).Trim();
        if (normalized.Length == 0) return [];
        if (normalized.Length <= maxChars) return [normalized];

        var chunks = new List<string>();
        var start = 0;
        while (start < normalized.Length)
        {
            var remaining = normalized.Length - start;
            if (remaining <= maxChars)
            {
                chunks.Add(normalized[start..].Trim());
                break;
            }

            var window = normalized.AsSpan(start, maxChars);
            var breakIdx = -1;
            for (var i = window.Length - 1; i >= Math.Max(20, maxChars / 3); i--)
            {
                var c = window[i];
                if (c is '।' or '.' or '!' or '?' or ';' or ':' or ',')
                {
                    breakIdx = i + 1;
                    break;
                }
            }
            if (breakIdx < 0)
                breakIdx = window.LastIndexOf(' ');
            if (breakIdx <= 0)
                breakIdx = maxChars;

            var piece = normalized.Substring(start, breakIdx).Trim();
            if (piece.Length > 0) chunks.Add(piece);
            start += breakIdx;
            while (start < normalized.Length && char.IsWhiteSpace(normalized[start])) start++;
        }

        return chunks;
    }

    private async Task<byte[]?> ConvertAndJoinChunksToWavAsync(IReadOnlyList<byte[]> mp3Chunks, CancellationToken ct)
    {
        var tempDir = Path.Combine(Path.GetTempPath(), "animstudio-gtts-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(tempDir);
        try
        {
            var chunkPaths = new List<string>(mp3Chunks.Count);
            for (var i = 0; i < mp3Chunks.Count; i++)
            {
                var p = Path.Combine(tempDir, $"c_{i:D3}.mp3");
                await File.WriteAllBytesAsync(p, mp3Chunks[i], ct).ConfigureAwait(false);
                chunkPaths.Add(p);
            }

            var outWav = Path.Combine(tempDir, "out.wav");
            var ffmpeg = string.IsNullOrWhiteSpace(ffmpegOptions.Value.FfmpegPath) ? "ffmpeg" : ffmpegOptions.Value.FfmpegPath;
            var psi = new ProcessStartInfo
            {
                FileName = ffmpeg,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                RedirectStandardInput = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };
            psi.ArgumentList.Add("-y");
            foreach (var p in chunkPaths)
            {
                psi.ArgumentList.Add("-i");
                psi.ArgumentList.Add(p);
            }
            if (chunkPaths.Count == 1)
            {
                psi.ArgumentList.Add("-af");
                psi.ArgumentList.Add("aresample=48000,aformat=channel_layouts=stereo");
            }
            else
            {
                var inputs = string.Concat(Enumerable.Range(0, chunkPaths.Count).Select(i => $"[{i}:a]"));
                psi.ArgumentList.Add("-filter_complex");
                psi.ArgumentList.Add($"{inputs}concat=n={chunkPaths.Count}:v=0:a=1,aresample=48000,aformat=channel_layouts=stereo[out]");
                psi.ArgumentList.Add("-map");
                psi.ArgumentList.Add("[out]");
            }
            psi.ArgumentList.Add("-c:a");
            psi.ArgumentList.Add("pcm_s16le");
            psi.ArgumentList.Add(outWav);

            using var proc = Process.Start(psi);
            if (proc is null) return null;
            proc.StandardInput.Close();
            using var timeout = CancellationTokenSource.CreateLinkedTokenSource(ct);
            timeout.CancelAfter(TimeSpan.FromSeconds(30));
            _ = proc.StandardError.ReadToEndAsync(timeout.Token);
            await proc.WaitForExitAsync(timeout.Token).ConfigureAwait(false);

            if (proc.ExitCode == 0 && File.Exists(outWav))
                return await File.ReadAllBytesAsync(outWav, ct).ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            Logger.LogDebug(ex, "Could not convert gTTS MP3 chunk(s) to WAV via FFmpeg; falling back to raw MP3.");
        }
        finally
        {
            try { if (Directory.Exists(tempDir)) Directory.Delete(tempDir, recursive: true); } catch { /* ignore */ }
        }
        return null;
    }
}
