using AnimStudio.Application.Abstractions.Rendering;
using AnimStudio.Application.Abstractions.Storage;
using AnimStudio.Application.Voices;
using Microsoft.Extensions.Logging;

namespace AnimStudio.Infrastructure.Ffmpeg;

/// <summary>
/// Runs <see cref="StudioVoiceGraph"/> over one recording in its own scratch workspace. The
/// picture is stream-copied and only the voice is re-encoded, so a ten-minute take renders in
/// about the time the audio filters take, not the time a video encode would.
/// <para>
/// Parts spoken as an AI voice go through the converter first: each is cut out of the take,
/// turned into the person's voice from their sample, and fed back in as its own input.
/// </para>
/// </summary>
public sealed class FfmpegStudioVoiceRenderer(
    IFfmpegRunner runner,
    IRenderWorkspaceFactory workspaces,
    IRenderCapabilities capabilities,
    IVoiceConverter converter,
    ILogger<FfmpegStudioVoiceRenderer> logger) : IStudioVoiceRenderer
{
    private static readonly TimeSpan Timeout = TimeSpan.FromMinutes(20);

    /// <summary>Seed-VC's own rate, and the most of a sample it listens to.</summary>
    private const int ConverterSampleRate = 22050;
    private const int SampleSeconds = 25;

    /// <summary>Kokoro's own rate; its tuner listens to 3-30 s of the reference.</summary>
    private const int ReferenceSampleRate = 24000;

    private readonly FfmpegCapabilities? _ffmpeg = capabilities as FfmpegCapabilities;

    public bool IsAvailable =>
        _ffmpeg is { IsAvailable: true, HasRubberband: true, HasAfir: true, HasAlimiter: true }
        && (_ffmpeg.HasLibopus || _ffmpeg.HasAac);

    public async Task<StudioVoiceOutput> RenderAsync(
        Stream recording, StudioVoiceContainer container,
        IReadOnlyList<StudioVoiceSegment> segments,
        IReadOnlyDictionary<string, string> samples, CancellationToken ct)
    {
        var ffmpeg = _ffmpeg;
        var webm = container == StudioVoiceContainer.WebM;
        if (!IsAvailable || ffmpeg is null || (webm ? !ffmpeg.HasLibopus : !ffmpeg.HasAac))
            throw new StudioVoiceException("Studio voice isn't available on this server: its ffmpeg can't do it.");

        var extension = webm ? "webm" : "mp4";
        var input = $"take.{extension}";
        var output = $"studio.{extension}";
        var aiParts = Enumerable.Range(0, segments.Count)
            .Where(i => segments[i].Voice?.AiSampleAssetId is not null).ToList();
        if (aiParts.Count > 0 && !converter.IsAvailable)
            throw new StudioVoiceException("AI voices aren't set up on this server, so this take can't use one.");

        await using var workspace = await workspaces.CreateAsync($"voice-{Guid.NewGuid():n}", ct).ConfigureAwait(false);

        await using (var file = File.Create(workspace.Resolve(input)))
            await recording.CopyToAsync(file, ct).ConfigureAwait(false);

        var converted = await ConvertAsync(workspace, input, segments, aiParts, samples, ct).ConfigureAwait(false);
        var built = StudioVoiceGraph.Build(segments, converted.Inputs);

        var arguments = new List<string> { "-hide_banner", "-nostdin", "-y", "-i", input };
        if (built.NeedsHall)
        {
            await File.WriteAllBytesAsync(workspace.Resolve(StudioVoiceGraph.HallFileName), StudioVoiceGraph.HallImpulse(), ct)
                .ConfigureAwait(false);
            arguments.AddRange(["-i", StudioVoiceGraph.HallFileName]);
        }
        foreach (var file in converted.Files) arguments.AddRange(["-i", file]);

        // From a file where ffmpeg can read one: a line-by-line dub makes a graph longer
        // than a Windows command line allows.
        if (ffmpeg.Supports(RenderFeature.FilterGraphFromFile))
        {
            await workspace.WriteTextAsync("voice.graph", built.FilterComplex, ct).ConfigureAwait(false);
            arguments.AddRange(["-/filter_complex", "voice.graph"]);
        }
        else
        {
            arguments.AddRange(["-filter_complex", built.FilterComplex]);
        }

        // "0:v?" keeps the picture when there is one: a dub recorded with the microphone only has none.
        arguments.AddRange(["-map", "0:v?", "-map", "[out]", "-c:v", "copy"]);
        arguments.AddRange(webm
            ? ["-c:a", "libopus", "-b:a", "160k", "-f", "webm"]
            : ["-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", "-f", "mp4"]);
        arguments.Add(output);

        var result = await runner.RunAsync(new FfmpegInvocation
        {
            Tool = FfmpegTool.Ffmpeg,
            WorkingDirectory = workspace.RootPath,
            Arguments = arguments,
            Timeout = Timeout
        }, progress: null, ct).ConfigureAwait(false);

        var produced = workspace.Resolve(output);
        if (result.ExitCode != 0 || !File.Exists(produced) || new FileInfo(produced).Length == 0)
        {
            workspace.MarkFailed($"ffmpeg exited {result.ExitCode}");
            logger.LogWarning("Studio voice render failed (exit {ExitCode}): {Stderr}",
                result.ExitCode, LogSanitizer.Sanitize(result.StderrTail, 1000));
            throw new StudioVoiceException("The studio voice couldn't be made from that recording.");
        }

        // Moved out of the workspace (which is deleted on dispose) into a file that deletes
        // itself once the response has been sent.
        var kept = Path.Combine(Path.GetTempPath(), $"animstudio-voice-{Guid.NewGuid():n}.{extension}");
        File.Move(produced, kept);
        var stream = new FileStream(kept, FileMode.Open, FileAccess.Read, FileShare.Read | FileShare.Delete,
            81920, FileOptions.Asynchronous | FileOptions.DeleteOnClose);

        logger.LogInformation("Studio voice rendered: {Segments} part(s), {Bytes} bytes in {Elapsed}.",
            segments.Count, stream.Length, result.Elapsed);
        return new StudioVoiceOutput(stream, webm ? "video/webm" : "video/mp4");
    }

    public bool CanReVoice => _ffmpeg is { IsAvailable: true } && converter.IsAvailable;

    public async Task<byte[]> ReVoiceAsync(byte[] speech, string sampleStorageKey, CancellationToken ct)
    {
        if (!CanReVoice)
            throw new StudioVoiceException("AI voices aren't set up on this server.");

        await using var workspace = await workspaces.CreateAsync($"revoice-{Guid.NewGuid():n}", ct).ConfigureAwait(false);

        await File.WriteAllBytesAsync(workspace.Resolve("line.audio"), speech, ct).ConfigureAwait(false);
        var stored = await workspace.MaterializeAsync(sampleStorageKey, "in/sample", ct).ConfigureAwait(false);

        // The same preparation a studio take's AI parts get.
        await FfmpegAsync(workspace, ["-i", stored, "-vn", "-ac", "1", "-ar", $"{ConverterSampleRate}", "-t", $"{SampleSeconds}", "sample.wav"], ct)
            .ConfigureAwait(false);
        await FfmpegAsync(workspace, ["-i", "line.audio", "-vn", "-ac", "1", "-ar", $"{ConverterSampleRate}", "line.wav"], ct)
            .ConfigureAwait(false);

        var voiced = workspace.Resolve("voiced.wav");
        await converter.ConvertAsync(
            [new VoiceConversionJob(workspace.Resolve("line.wav"), workspace.Resolve("sample.wav"), voiced)],
            workspace.RootPath, ct).ConfigureAwait(false);

        // Re-encoded to plain 16-bit PCM so the result is a WAV every player and the export read the same way.
        await FfmpegAsync(workspace, ["-i", "voiced.wav", "-ac", "1", "-c:a", "pcm_s16le", "out.wav"], ct).ConfigureAwait(false);
        var bytes = await File.ReadAllBytesAsync(workspace.Resolve("out.wav"), ct).ConfigureAwait(false);
        logger.LogInformation("Voiceover line re-voiced: {Bytes} bytes.", bytes.Length);
        return bytes;
    }

    public bool CanPrepareReference => _ffmpeg is { IsAvailable: true };

    public async Task<byte[]> ReferenceClipAsync(string sampleStorageKey, CancellationToken ct)
    {
        if (!CanPrepareReference)
            throw new StudioVoiceException("ffmpeg isn't available on this server.");

        await using var workspace = await workspaces.CreateAsync($"reference-{Guid.NewGuid():n}", ct).ConfigureAwait(false);
        var stored = await workspace.MaterializeAsync(sampleStorageKey, "in/sample", ct).ConfigureAwait(false);

        await FfmpegAsync(workspace,
            ["-i", stored, "-vn", "-ac", "1", "-ar", $"{ReferenceSampleRate}", "-t", $"{SampleSeconds}", "-c:a", "pcm_s16le", "reference.wav"], ct)
            .ConfigureAwait(false);
        return await File.ReadAllBytesAsync(workspace.Resolve("reference.wav"), ct).ConfigureAwait(false);
    }

    private sealed record Converted(IReadOnlyDictionary<int, int> Inputs, IReadOnlyList<string> Files);

    /// <summary>
    /// Cuts each AI part out of the take, prepares each person's sample, and converts them all
    /// in one run. Returns which ffmpeg input carries each converted part.
    /// </summary>
    private async Task<Converted> ConvertAsync(
        IRenderWorkspace workspace, string take, IReadOnlyList<StudioVoiceSegment> segments,
        IReadOnlyList<int> aiParts, IReadOnlyDictionary<string, string> samples, CancellationToken ct)
    {
        if (aiParts.Count == 0) return new Converted(new Dictionary<int, int>(), []);

        var sampleFiles = new Dictionary<string, string>(StringComparer.Ordinal);
        var jobs = new List<VoiceConversionJob>();
        var files = new List<string>();
        var inputs = new Dictionary<int, int>();
        var firstInput = segments.Any(s => s.Voice is { Reverb: > 0 }) ? 2 : 1;

        foreach (var i in aiParts)
        {
            var assetId = segments[i].Voice!.AiSampleAssetId!;
            if (!sampleFiles.TryGetValue(assetId, out var sample))
            {
                if (!samples.TryGetValue(assetId, out var storageKey))
                    throw new StudioVoiceException("A voice sample this take needs is missing.");
                var stored = await workspace.MaterializeAsync(storageKey, $"in/sample-{sampleFiles.Count}", ct).ConfigureAwait(false);
                sample = $"sample-{sampleFiles.Count}.wav";
                await FfmpegAsync(workspace, ["-i", stored, "-vn", "-ac", "1", "-ar", $"{ConverterSampleRate}", "-t", $"{SampleSeconds}", sample], ct)
                    .ConfigureAwait(false);
                sampleFiles[assetId] = sample;
            }

            var start = segments[i].StartSeconds;
            double? end = i + 1 < segments.Count ? segments[i + 1].StartSeconds : null;
            var part = $"part-{i}.wav";
            var cut = new List<string> { "-i", take, "-vn", "-ss", Seconds(start) };
            if (end is { } e) cut.AddRange(["-to", Seconds(e)]);
            cut.AddRange(["-ac", "1", "-ar", $"{ConverterSampleRate}", part]);
            await FfmpegAsync(workspace, cut, ct).ConfigureAwait(false);

            var output = $"voiced-{i}.wav";
            jobs.Add(new VoiceConversionJob(workspace.Resolve(part), workspace.Resolve(sample), workspace.Resolve(output)));
            inputs[i] = firstInput + files.Count;
            files.Add(output);
        }

        await converter.ConvertAsync(jobs, workspace.RootPath, ct).ConfigureAwait(false);
        return new Converted(inputs, files);
    }

    private async Task FfmpegAsync(IRenderWorkspace workspace, IReadOnlyList<string> arguments, CancellationToken ct)
    {
        var result = await runner.RunAsync(new FfmpegInvocation
        {
            Tool = FfmpegTool.Ffmpeg,
            WorkingDirectory = workspace.RootPath,
            Arguments = ["-hide_banner", "-nostdin", "-y", .. arguments],
            Timeout = Timeout
        }, progress: null, ct).ConfigureAwait(false);

        if (result.ExitCode != 0)
        {
            logger.LogWarning("Preparing an AI voice part failed (exit {ExitCode}): {Stderr}",
                result.ExitCode, LogSanitizer.Sanitize(result.StderrTail, 1000));
            throw new StudioVoiceException("The AI voice couldn't be made from that recording.");
        }
    }

    private static string Seconds(double value) => value.ToString("0.######", System.Globalization.CultureInfo.InvariantCulture);
}
