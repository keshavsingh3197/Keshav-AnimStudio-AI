using System.Globalization;
using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Ai;
using AnimStudio.Application.Options;
using AnimStudio.Domain.Ai;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AnimStudio.Infrastructure.Ai.Providers;

/// <summary>
/// Speech from Piper, a small neural synthesizer that runs on this machine.
/// </summary>
/// <remarks>
/// <para>
/// A narrated video is one synthesis call per line, and a transcript has hundreds. No
/// hosted free tier survives that, so a local synthesizer is not a fallback here - it is
/// the only option that finishes a long video without a bill. Piper is CPU-only and fast
/// enough to keep up.
/// </para>
/// <para>
/// Piper takes its text on stdin and writes a WAV to a file. It has no option to write
/// audio to stdout in every build, so a scratch file is used and deleted afterwards -
/// which is also why the text never appears in an argument, and therefore never in a
/// process listing where the machine's other users could read the script.
/// </para>
/// </remarks>
public sealed class PiperLocalSpeechProvider(
    AiProviderId id,
    IOptionsMonitor<AiOptions> options,
    ILogger<PiperLocalSpeechProvider> logger)
    : LocalProcessAiProvider(id, AiCapability.Speech, options, logger), ISpeechAiProvider
{
    private const string VoiceExtension = ".onnx";
    private const int MaxTextLength = 20_000;

    /// <summary>Needs both a program and somewhere to find voices.</summary>
    public override bool IsConfigured =>
        base.IsConfigured && !string.IsNullOrWhiteSpace(ProviderOptions?.VoicesPath);

    public Task<IReadOnlyList<AiVoice>> ListVoicesAsync(CancellationToken ct)
    {
        var directory = ProviderOptions?.VoicesPath;

        if (string.IsNullOrWhiteSpace(directory) || !Directory.Exists(directory))
            return Task.FromResult<IReadOnlyList<AiVoice>>([]);

        try
        {
            var voices = Directory
                .EnumerateFiles(directory, $"*{VoiceExtension}", SearchOption.TopDirectoryOnly)
                .Select(path => Path.GetFileNameWithoutExtension(path))
                .Where(name => !string.IsNullOrWhiteSpace(name))
                .OrderBy(name => name, StringComparer.Ordinal)
                .Select(name => new AiVoice(name!, DisplayName(name!), LanguageOf(name!), null))
                .ToList();

            return Task.FromResult<IReadOnlyList<AiVoice>>(voices);
        }
        catch (Exception ex) when (ex is IOException or UnauthorizedAccessException)
        {
            // An unreadable voices directory means no voices, not a broken application.
            Logger.LogWarning(ex,
                "Could not list the voices installed for AI provider {ProviderId}.", Id.Value);

            return Task.FromResult<IReadOnlyList<AiVoice>>([]);
        }
    }

    public async Task<AiSpeechResult> SynthesizeAsync(
        AiSpeechRequest request, CancellationToken ct)
    {
        var text = request.Text?.Trim() ?? string.Empty;

        if (text.Length == 0)
            throw new AiProviderException("text-required", "There is nothing to speak.");

        if (text.Length > MaxTextLength)
        {
            throw new AiProviderException("text-too-long",
                $"'{Id.Value}' was given {text.Length} characters to speak in one call.");
        }

        var directory = ProviderOptions?.VoicesPath
            ?? throw new AiProviderException("not-configured",
                $"No voices directory is configured for '{Id.Value}'.");

        var modelPath = ResolveInsideDirectory(directory, request.VoiceId, VoiceExtension, Id.Value);

        using var output = new TemporaryFile(".wav");

        var arguments = new List<string>
        {
            "--model", modelPath,
            "--output_file", output.Path
        };

        // Piper expresses speed as the inverse: a longer length is slower speech. Clamped
        // because a rate of zero is a division and a rate of ten is unintelligible.
        var rate = Math.Clamp(request.Rate <= 0 ? 1.0 : request.Rate, 0.5, 2.0);

        if (Math.Abs(rate - 1.0) > 0.001)
        {
            arguments.Add("--length_scale");
            arguments.Add((1.0 / rate).ToString("0.###", CultureInfo.InvariantCulture));
        }

        // Piper has no pitch control. Saying so once beats silently ignoring a setting the
        // user changed and watched do nothing.
        if (Math.Abs(request.Pitch) > 0.001)
        {
            Logger.LogInformation(
                "AI provider {ProviderId} does not support pitch adjustment; it is being ignored.",
                Id.Value);
        }

        var result = await RunAsync(arguments, text, ct).ConfigureAwait(false);

        if (!result.Succeeded)
        {
            Logger.LogWarning(
                "AI provider {ProviderId} exited with {ExitCode}: {Error}",
                Id.Value, result.ExitCode, Tail(result.StandardError));

            throw new AiProviderException("synthesis-failed",
                $"'{Id.Value}' could not speak that line (exit code {result.ExitCode}).");
        }

        var bytes = await ReadOutputAsync(output.Path, ct).ConfigureAwait(false);
        var mimeType = AiAudioValidator.Require(bytes, Id.Value);

        return new AiSpeechResult(
            bytes,
            mimeType,
            AiAudioValidator.TryGetDuration(bytes, mimeType),
            new AiProvenance
            {
                ProviderId = Id.Value,
                Capability = AiCapability.Speech,
                Model = request.VoiceId,
                GeneratedAtUtc = DateTime.UtcNow
            });
    }

    private async Task<byte[]> ReadOutputAsync(string path, CancellationToken ct)
    {
        try
        {
            return await File.ReadAllBytesAsync(path, ct).ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is IOException or UnauthorizedAccessException)
        {
            // Exit code zero and no file is a real Piper failure mode when the voice model
            // is present but unreadable.
            throw new AiProviderException("synthesis-failed",
                $"'{Id.Value}' reported success but wrote no audio.", ex);
        }
    }

    /// <summary>
    /// Piper names its voices <c>en_GB-alba-medium</c>. Split into something a person can
    /// read in a picker without having to learn the convention.
    /// </summary>
    private static string DisplayName(string voiceId)
    {
        var parts = voiceId.Split('-', StringSplitOptions.RemoveEmptyEntries);

        return parts.Length >= 2
            ? $"{parts[1]} ({string.Join(", ", parts.Skip(2).Prepend(parts[0]))})"
            : voiceId;
    }

    private static string? LanguageOf(string voiceId)
    {
        var language = voiceId.Split('-', 2)[0];

        return language.Length is >= 2 and <= 5 ? language.Replace('_', '-') : null;
    }
}
