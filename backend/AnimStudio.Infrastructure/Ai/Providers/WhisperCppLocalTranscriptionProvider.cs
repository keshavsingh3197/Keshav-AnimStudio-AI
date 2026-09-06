using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Ai;
using AnimStudio.Application.Options;
using AnimStudio.Domain.Ai;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AnimStudio.Infrastructure.Ai.Providers;

/// <summary>
/// Transcription from whisper.cpp, running on this machine.
/// </summary>
/// <remarks>
/// <para>
/// This is the provider that makes "paste a link and get a video" free. Every hosted
/// recognizer meters by the minute of audio, and a single match is an hour of it; whisper.cpp
/// has no quota and never sends the audio anywhere, which also means a private recording
/// stays private. It is slower than a hosted call and that is the whole trade.
/// </para>
/// <para>
/// The direction is the mirror of <see cref="PiperLocalSpeechProvider"/>: audio goes in as a
/// file and subtitles come out as one. whisper.cpp writes its SubRip beside a base path
/// given by <c>--output-file</c> rather than to stdout, so the scratch file is created up
/// front and deleted afterwards whatever happens.
/// </para>
/// <para>
/// It expects 16 kHz mono PCM. The pipeline already normalises audio through ffmpeg before
/// anything reaches here, so a file that fails on format is a bug upstream rather than
/// something to paper over with a second conversion inside a provider.
/// </para>
/// </remarks>
public sealed class WhisperCppLocalTranscriptionProvider(
    AiProviderId id,
    IOptionsMonitor<AiOptions> options,
    ILogger<WhisperCppLocalTranscriptionProvider> logger)
    : LocalProcessAiProvider(id, AiCapability.Transcription, options, logger), ITranscriptionProvider
{
    private const string ModelExtension = ".bin";
    private const string OutputExtension = ".srt";

    /// <summary>Needs a program, a folder of weights, and which of them to load.</summary>
    public override bool IsConfigured =>
        base.IsConfigured &&
        !string.IsNullOrWhiteSpace(ProviderOptions?.ModelsPath) &&
        !string.IsNullOrWhiteSpace(ProviderOptions?.Model);

    public async Task<AiTranscriptionResult> TranscribeAsync(
        AiTranscriptionRequest request, CancellationToken ct)
    {
        var audioPath = request.AudioPath;

        // Server-composed, so this is a consistency check rather than a trust boundary -
        // but a missing file otherwise surfaces as an opaque non-zero exit.
        if (string.IsNullOrWhiteSpace(audioPath) || !File.Exists(audioPath))
        {
            throw new AiProviderException("audio-missing",
                $"'{Id.Value}' was given an audio file that does not exist.");
        }

        var providerOptions = ProviderOptions;

        var modelsPath = providerOptions?.ModelsPath
            ?? throw new AiProviderException("not-configured",
                $"No models directory is configured for '{Id.Value}'.");

        var modelName = providerOptions?.Model
            ?? throw new AiProviderException("not-configured",
                $"No model is configured for '{Id.Value}'.");

        var modelPath = ResolveInsideDirectory(
            modelsPath, modelName, ModelExtension, Id.Value, kind: "model");

        using var output = new TemporaryFile(OutputExtension);

        // whisper.cpp appends the format's extension to --output-file, so it is handed the
        // scratch path with that extension removed and writes exactly the file the
        // TemporaryFile will clean up. Trimming a suffix this class itself just added is
        // safe in a way that trimming an arbitrary path would not be.
        var outputBase = output.Path[..^OutputExtension.Length];

        var arguments = new List<string>
        {
            "--model", modelPath,
            "--file", audioPath,
            "--output-srt",
            "--output-file", outputBase
        };

        if (LanguageArgument(request.LanguageHint) is { } language)
        {
            arguments.Add("--language");
            arguments.Add(language);
        }

        if (request.RequestWordTimings)
        {
            // One word per cue. That is not the final subtitle - SubtitleParser recognises
            // this shape and rebuilds sensible cues from it - but the per-word times are
            // what drive mouth flap and karaoke captions, and they cannot be recovered
            // once the recognizer has merged words into a sentence.
            arguments.Add("--max-len");
            arguments.Add("1");
            arguments.Add("--split-on-word");
        }

        var result = await RunAsync(arguments, standardInput: null, ct).ConfigureAwait(false);

        if (!result.Succeeded)
        {
            Logger.LogWarning(
                "AI provider {ProviderId} exited with {ExitCode}: {Error}",
                Id.Value, result.ExitCode, Tail(result.StandardError));

            throw new AiProviderException("transcription-failed",
                $"'{Id.Value}' could not transcribe that audio (exit code {result.ExitCode}).");
        }

        var subtitles = AiTranscriptValidator.Require(
            await ReadOutputAsync(output.Path, ct).ConfigureAwait(false), Id.Value);

        return new AiTranscriptionResult(
            subtitles,
            AiTranscriptValidator.SniffFormat(subtitles),
            new AiProvenance
            {
                ProviderId = Id.Value,
                Capability = AiCapability.Transcription,
                Model = modelName,
                GeneratedAtUtc = DateTime.UtcNow
            },
            // whisper.cpp reports a detected language only in its progress output, which is
            // not a contract worth parsing. A hint that was honoured is knowledge; a guess
            // at what it detected is not.
            Language: NormalizeLanguage(request.LanguageHint));
    }

    private async Task<string?> ReadOutputAsync(string path, CancellationToken ct)
    {
        try
        {
            return File.Exists(path)
                ? await File.ReadAllTextAsync(path, ct).ConfigureAwait(false)
                : null;
        }
        catch (Exception ex) when (ex is IOException or UnauthorizedAccessException)
        {
            throw new AiProviderException("transcription-failed",
                $"'{Id.Value}' reported success but wrote no transcript.", ex);
        }
    }

    /// <summary>
    /// The language to ask for, or null to let whisper detect one.
    /// </summary>
    /// <remarks>
    /// A hint arrives from a caller and becomes a process argument. <c>ArgumentList</c>
    /// already makes it one argument rather than several, so this is not about injection:
    /// it is that whisper refuses an unknown code outright, and a whole transcription
    /// failing because a locale string had a stray character in it is a poor trade for a
    /// hint. Anything that is not a language code is dropped and auto-detection is used.
    /// </remarks>
    private static string? LanguageArgument(string? hint)
    {
        var language = NormalizeLanguage(hint);

        // whisper takes the base code: "en", not "en-GB".
        return language?.Split('-', 2)[0];
    }

    private static string? NormalizeLanguage(string? hint)
    {
        if (string.IsNullOrWhiteSpace(hint)) return null;

        var trimmed = hint.Trim();

        if (trimmed.Length is < 2 or > 5) return null;

        foreach (var c in trimmed)
        {
            if (!char.IsAsciiLetter(c) && c is not ('-' or '_')) return null;
        }

        return trimmed.Replace('_', '-').ToLowerInvariant();
    }
}
