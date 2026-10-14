using System.Globalization;
using AnimStudio.Application.Abstractions.Rendering;
using AnimStudio.Application.Abstractions.Storage;
using AnimStudio.Application.Transcripts;
using AnimStudio.Domain.Errors;
using Microsoft.Extensions.Logging;

namespace AnimStudio.Infrastructure.Ffmpeg;

/// <summary>
/// One ffmpeg pass that takes the first sound track of a stored file down to 16 kHz mono
/// 16-bit WAV and cuts it into equal parts with the segment muxer. PCM has no frames to
/// round to, so part <c>n</c> starts at exactly <c>n × partLength</c>.
/// </summary>
public sealed class FfmpegSpeechAudioExtractor(
    IFfmpegRunner runner,
    IRenderCapabilities capabilities,
    ILogger<FfmpegSpeechAudioExtractor> logger) : ISpeechAudioExtractor
{
    /// <summary>Decoding two hours of audio takes a minute or two; this only stops a hung process.</summary>
    private static readonly TimeSpan Timeout = TimeSpan.FromMinutes(15);

    public bool IsAvailable => capabilities is FfmpegCapabilities { IsAvailable: true };

    public async Task<IReadOnlyList<SpeechAudioPart>> ExtractAsync(
        IRenderWorkspace workspace, string storageKey, TimeSpan partLength, TimeSpan maxLength, CancellationToken ct)
    {
        string input;
        try
        {
            input = await workspace.MaterializeAsync(storageKey, "in/media", ct).ConfigureAwait(false);
        }
        catch (RenderException ex) when (ex.Code == RenderErrorCode.AssetMissing)
        {
            throw new SpeechAudioExtractionException(noAudio: false, "The stored file is missing.");
        }

        var result = await runner.RunAsync(new FfmpegInvocation
        {
            Tool = FfmpegTool.Ffmpeg,
            WorkingDirectory = workspace.RootPath,
            Arguments =
            [
                "-hide_banner", "-nostdin", "-y",
                "-i", input,
                // The first sound track, and no fallback: a file without one fails here with
                // a message that says so, instead of producing silence to transcribe.
                "-map", "0:a:0",
                "-vn", "-sn", "-dn",
                "-t", Seconds(maxLength),
                "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le",
                "-f", "segment", "-segment_time", Seconds(partLength), "-reset_timestamps", "1",
                "out/speech-%03d.wav"
            ],
            Timeout = Timeout
        }, progress: null, ct).ConfigureAwait(false);

        if (result.ExitCode != 0)
        {
            // Older ffmpeg says the map "matches no streams"; 9.x says it failed to set '0:a:0'.
            // Either way it is the one -map here that found no sound track.
            var noAudio = result.StderrTail.Contains("matches no streams", StringComparison.OrdinalIgnoreCase)
                || result.StderrTail.Contains("'0:a:0'", StringComparison.Ordinal);
            logger.LogWarning("Reading the speech out of a file failed (exit {ExitCode}): {Stderr}",
                result.ExitCode, LogSanitizer.Sanitize(result.StderrTail, 1000));
            throw new SpeechAudioExtractionException(noAudio, "ffmpeg could not read a sound track out of the file.");
        }

        // The segment muxer cuts on packet boundaries, so a "ten-minute" part is a few
        // milliseconds longer; each offset is the real length of the parts before it, or
        // the lines of a two-hour file would drift.
        var parts = new List<SpeechAudioPart>();
        var offset = TimeSpan.Zero;
        foreach (var path in Directory.GetFiles(workspace.Resolve("out"), "speech-*.wav").Order(StringComparer.Ordinal))
        {
            parts.Add(new SpeechAudioPart(path, offset));
            offset += PcmLength(path) ?? partLength;
        }

        if (parts.Count == 0)
            throw new SpeechAudioExtractionException(noAudio: true, "ffmpeg found no sound in the file.");

        return parts;
    }

    /// <summary>16 kHz mono 16-bit: 32,000 bytes a second. Null when the file has no readable data chunk.</summary>
    private static TimeSpan? PcmLength(string path)
    {
        const int BytesPerSecond = 16000 * 2;

        using var file = File.OpenRead(path);
        using var reader = new BinaryReader(file);
        if (file.Length < 12) return null;
        file.Position = 12; // past "RIFF", size, "WAVE"

        while (file.Position + 8 <= file.Length)
        {
            var id = System.Text.Encoding.ASCII.GetString(reader.ReadBytes(4));
            var size = reader.ReadUInt32();
            // ffmpeg writes 0 or 0xFFFFFFFF into the data size when it couldn't seek back; the rest of the file is the data.
            if (id == "data")
                return TimeSpan.FromSeconds((size is 0 or uint.MaxValue ? file.Length - file.Position : size) / (double)BytesPerSecond);
            file.Position += size + (size & 1);
        }

        return null;
    }

    private static string Seconds(TimeSpan t) => t.TotalSeconds.ToString("0.###", CultureInfo.InvariantCulture);
}
