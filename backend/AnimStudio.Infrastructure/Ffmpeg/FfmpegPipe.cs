using System.Diagnostics;
using AnimStudio.Domain.Errors;
using AnimStudio.Domain.Rendering;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AnimStudio.Infrastructure.Ffmpeg;

/// <summary>
/// A long-running ffmpeg that reads its input from stdin, for media that arrives while it
/// runs (a browser's camera recording). <see cref="IFfmpegRunner"/> closes stdin at once and
/// runs to completion, so it can't be used for this.
/// </summary>
public interface IFfmpegPipe : IAsyncDisposable
{
    /// <summary>ffmpeg's stdin. Writes block while ffmpeg is behind, which is the back-pressure the sender needs.</summary>
    Stream Input { get; }

    /// <summary>Completes with the exit code once the process has exited and its output is drained.</summary>
    Task<int> Exited { get; }

    /// <summary>The last part of stderr. It can name the output URL, so callers redact it before logging.</summary>
    string StderrTail { get; }

    /// <summary>Closes stdin so ffmpeg flushes what it has and exits on its own.</summary>
    Task CloseInputAsync();

    void Kill();
}

public interface IFfmpegPipeFactory
{
    /// <exception cref="RenderException">FFmpeg can't be started on this machine.</exception>
    IFfmpegPipe Start(string workingDirectory, IReadOnlyList<string> arguments, IProgress<FfmpegProgress>? progress);
}

public sealed class FfmpegPipeFactory(IOptions<FfmpegOptions> options, ILogger<FfmpegPipeFactory> logger) : IFfmpegPipeFactory
{
    public IFfmpegPipe Start(string workingDirectory, IReadOnlyList<string> arguments, IProgress<FfmpegProgress>? progress)
    {
        var executable = options.Value.FfmpegPath;
        var startInfo = new ProcessStartInfo
        {
            FileName = executable,
            WorkingDirectory = workingDirectory,
            RedirectStandardInput = true,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };

        // ArgumentList, never a joined string - see FfmpegRunner.
        foreach (var argument in arguments) startInfo.ArgumentList.Add(argument);

        var process = new Process { StartInfo = startInfo };
        try
        {
            if (!process.Start())
                throw new RenderException(RenderErrorCode.RendererUnavailable, "FFmpeg could not be started.");
        }
        catch (Exception ex) when (ex is System.ComponentModel.Win32Exception or FileNotFoundException)
        {
            process.Dispose();
            throw new RenderException(RenderErrorCode.RendererUnavailable,
                "Video encoding is not configured on this server.", $"Could not launch '{executable}'.", ex);
        }

        return new Pipe(process, progress, Math.Max(4096, options.Value.StderrTailBytes), logger);
    }

    private sealed class Pipe : IFfmpegPipe
    {
        private readonly Process _process;
        private readonly ILogger _logger;
        private readonly int _tailBytes;
        private readonly Queue<string> _tail = new();
        private readonly object _tailGate = new();
        private int _tailLength;
        private int _inputClosed;

        public Pipe(Process process, IProgress<FfmpegProgress>? progress, int tailBytes, ILogger logger)
        {
            _process = process;
            _logger = logger;
            _tailBytes = tailBytes;
            Input = process.StandardInput.BaseStream;

            // stdout and stderr are drained concurrently, or a full pipe buffer stalls ffmpeg.
            var stdout = ReadProgressAsync(progress);
            var stderr = ReadStderrAsync();
            Exited = WaitAsync(stdout, stderr);
        }

        public Stream Input { get; }
        public Task<int> Exited { get; }

        public string StderrTail
        {
            get { lock (_tailGate) return string.Join('\n', _tail); }
        }

        public async Task CloseInputAsync()
        {
            if (Interlocked.Exchange(ref _inputClosed, 1) == 1) return;
            try
            {
                await Input.FlushAsync().ConfigureAwait(false);
                Input.Close();
            }
            catch (Exception ex) when (ex is IOException or ObjectDisposedException)
            {
                // ffmpeg has already gone; there is nothing left to tell it.
            }
        }

        public void Kill()
        {
            try
            {
                if (!_process.HasExited) _process.Kill(entireProcessTree: true);
            }
            catch (Exception ex) when (ex is InvalidOperationException or System.ComponentModel.Win32Exception)
            {
                _logger.LogWarning("Could not stop an ffmpeg pipe cleanly: {ErrorType}", ex.GetType().Name);
            }
        }

        public async ValueTask DisposeAsync()
        {
            Kill();
            try
            {
                await Exited.WaitAsync(TimeSpan.FromSeconds(5)).ConfigureAwait(false);
            }
            catch (TimeoutException)
            {
                _logger.LogWarning("An ffmpeg pipe did not exit within 5 s of being stopped");
            }
            _process.Dispose();
        }

        private async Task<int> WaitAsync(Task stdout, Task stderr)
        {
            await _process.WaitForExitAsync().ConfigureAwait(false);
            await Task.WhenAll(stdout, stderr).ConfigureAwait(false);
            return _process.ExitCode;
        }

        private async Task ReadProgressAsync(IProgress<FfmpegProgress>? progress)
        {
            var parser = new FfmpegProgressParser(FrameRate.Fps30);
            try
            {
                while (await _process.StandardOutput.ReadLineAsync().ConfigureAwait(false) is { } line)
                {
                    if (parser.Accept(line) is { } snapshot) progress?.Report(snapshot);
                }
            }
            catch (Exception ex) when (ex is IOException or ObjectDisposedException)
            {
                // The process is gone; nothing more will be reported.
            }
        }

        private async Task ReadStderrAsync()
        {
            try
            {
                while (await _process.StandardError.ReadLineAsync().ConfigureAwait(false) is { } line)
                {
                    lock (_tailGate)
                    {
                        _tail.Enqueue(line);
                        _tailLength += line.Length + 1;
                        while (_tailLength > _tailBytes && _tail.Count > 1)
                            _tailLength -= _tail.Dequeue().Length + 1;
                    }
                }
            }
            catch (Exception ex) when (ex is IOException or ObjectDisposedException)
            {
                // As above.
            }
        }
    }
}
