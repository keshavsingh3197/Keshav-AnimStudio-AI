using System.Diagnostics;
using System.Text;
using AnimStudio.Domain.Errors;
using AnimStudio.Domain.Rendering;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AnimStudio.Infrastructure.Ffmpeg;

public sealed class FfmpegRunner(
    IOptions<FfmpegOptions> options,
    ILogger<FfmpegRunner> logger) : IFfmpegRunner
{
    private readonly FfmpegOptions _options = options.Value;

    public async Task<FfmpegResult> RunAsync(
        FfmpegInvocation invocation, IProgress<FfmpegProgress>? progress, CancellationToken ct)
    {
        var executable = invocation.Tool == FfmpegTool.Ffmpeg
            ? _options.FfmpegPath
            : _options.FfprobePath;

        var startInfo = new ProcessStartInfo
        {
            FileName = executable,
            WorkingDirectory = invocation.WorkingDirectory,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            // ffmpeg reads the parent's stdin unless told not to, which can hang the process.
            RedirectStandardInput = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };

        // ArgumentList, never a joined string: .NET applies correct per-platform quoting,
        // and the filtergraph - full of : , ' [ ] \ - is a single element that never
        // touches a shell. This is the whole answer to filter-argument escaping.
        foreach (var argument in invocation.Arguments) startInfo.ArgumentList.Add(argument);

        using var process = new Process { StartInfo = startInfo };

        var stopwatch = Stopwatch.StartNew();
        try
        {
            if (!process.Start())
                throw new RenderException(RenderErrorCode.RendererUnavailable,
                    "The video renderer could not be started.");
        }
        catch (Exception ex) when (ex is System.ComponentModel.Win32Exception or FileNotFoundException)
        {
            throw new RenderException(RenderErrorCode.RendererUnavailable,
                "Video rendering is not configured on this server.",
                $"Could not launch '{executable}'.", ex);
        }

        process.StandardInput.Close();

        using var timeoutSource = CancellationTokenSource.CreateLinkedTokenSource(ct);
        timeoutSource.CancelAfter(invocation.Timeout);
        var token = timeoutSource.Token;

        // stdout and stderr MUST be drained concurrently. Reading only one lets the child
        // block on a full pipe buffer and deadlock - and ffmpeg's stderr can run to
        // megabytes on a long render.
        var stdoutTask = ReadStdOutAsync(process, invocation, progress, token);
        var stderrTask = ReadStdErrAsync(process, invocation, token);

        try
        {
            await process.WaitForExitAsync(token).ConfigureAwait(false);
        }
        catch (OperationCanceledException)
        {
            Kill(process);
            stopwatch.Stop();

            // Distinguish a caller cancel from a timeout: they mean different things to the job.
            if (ct.IsCancellationRequested) throw;

            throw new RenderException(RenderErrorCode.Timeout,
                "Rendering took too long and was stopped.",
                $"'{executable}' exceeded {invocation.Timeout}.");
        }

        var stdout = await stdoutTask.ConfigureAwait(false);
        var stderr = await stderrTask.ConfigureAwait(false);
        stopwatch.Stop();

        if (process.ExitCode != 0 && invocation.FailureExpected)
        {
            logger.LogDebug("ffmpeg exited with {ExitCode} after {Elapsed} (expected for this probe)",
                process.ExitCode, stopwatch.Elapsed);
        }
        else if (process.ExitCode != 0)
        {
            logger.LogWarning("ffmpeg exited with {ExitCode} after {Elapsed}",
                process.ExitCode, stopwatch.Elapsed);
        }

        return new FfmpegResult(process.ExitCode, stdout, stderr, stopwatch.Elapsed);
    }

    private async Task<string> ReadStdOutAsync(Process process, FfmpegInvocation invocation,
        IProgress<FfmpegProgress>? progress, CancellationToken ct)
    {
        // ffprobe returns JSON on stdout; ffmpeg with -progress pipe:1 returns key=value.
        if (!invocation.CaptureProgress)
            return await process.StandardOutput.ReadToEndAsync(ct).ConfigureAwait(false);

        var parser = new FfmpegProgressParser(FrameRate.Fps30);
        var builder = new StringBuilder();

        while (await process.StandardOutput.ReadLineAsync(ct).ConfigureAwait(false) is { } line)
        {
            builder.AppendLine(line);
            var snapshot = parser.Accept(line);
            if (snapshot is not null) progress?.Report(snapshot);
        }

        return builder.ToString();
    }

    private async Task<string> ReadStdErrAsync(
        Process process, FfmpegInvocation invocation, CancellationToken ct)
    {
        // Keep only a bounded tail for the error message; tee the full text to a log file
        // so a failed job stays diagnosable without holding megabytes in memory.
        var tail = new Queue<string>();
        var tailBytes = 0;
        StreamWriter? log = null;

        try
        {
            if (invocation.StderrLogPath is { } path)
            {
                var full = Path.Combine(invocation.WorkingDirectory, path);
                Directory.CreateDirectory(Path.GetDirectoryName(full)!);
                log = new StreamWriter(full, append: false, new UTF8Encoding(false));
            }

            while (await process.StandardError.ReadLineAsync(ct).ConfigureAwait(false) is { } line)
            {
                if (log is not null) await log.WriteLineAsync(line).ConfigureAwait(false);

                tail.Enqueue(line);
                tailBytes += line.Length + 1;
                while (tailBytes > _options.StderrTailBytes && tail.Count > 1)
                    tailBytes -= tail.Dequeue().Length + 1;
            }
        }
        catch (OperationCanceledException)
        {
            // The process is being killed; whatever we captured is enough.
        }
        finally
        {
            if (log is not null) await log.DisposeAsync().ConfigureAwait(false);
        }

        return string.Join('\n', tail);
    }

    private void Kill(Process process)
    {
        try
        {
            if (process.HasExited) return;
            // Kill the tree: ffmpeg can spawn helpers that would otherwise be orphaned.
            process.Kill(entireProcessTree: true);
            process.WaitForExit(5_000);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Could not terminate the renderer process cleanly.");
        }
    }
}
