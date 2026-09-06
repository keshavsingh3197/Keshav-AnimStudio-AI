using System.Diagnostics;
using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Ai;
using AnimStudio.Application.Options;
using AnimStudio.Domain.Ai;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AnimStudio.Infrastructure.Ai.Providers;

/// <summary>What a local tool wrote, and whether it worked.</summary>
public sealed record AiProcessResult(int ExitCode, byte[] StandardOutput, string StandardError)
{
    public bool Succeeded => ExitCode == 0;
}

/// <summary>
/// The shared half of a provider that runs a program on this machine rather than calling a
/// service.
/// </summary>
/// <remarks>
/// <para>
/// These providers are the reason the whole pipeline can stay free at volume: no key, no
/// quota, and nothing leaving the network. What they cost instead is process handling, and
/// the two rules below are the ones that actually matter.
/// </para>
/// <para>
/// <b>Arguments go through <c>ArgumentList</c>, never a joined string.</b> A voice id, a
/// model name and a file path all end up as arguments, and building a command line by
/// concatenation is how a value with a space or a quote in it becomes a second command.
/// .NET applies the correct per-platform quoting to each element and no shell is involved
/// at any point - <c>UseShellExecute</c> is false.
/// </para>
/// <para>
/// <b>stdout and stderr are drained concurrently.</b> Reading one to completion before the
/// other lets the child block on a full pipe buffer, and a deadlocked synthesizer looks
/// exactly like a slow one until the timeout fires.
/// </para>
/// </remarks>
public abstract class LocalProcessAiProvider(
    AiProviderId id,
    AiCapability capability,
    IOptionsMonitor<AiOptions> options,
    ILogger logger) : IAiProvider
{
    public AiProviderId Id { get; } = id;
    public AiCapability Capability { get; } = capability;

    protected ILogger Logger { get; } = logger;

    protected AiProviderOptions? ProviderOptions => options.CurrentValue.ProviderFor(Id);

    protected string? ExecutablePath => ProviderOptions?.ExecutablePath;

    public virtual bool IsConfigured
    {
        get
        {
            var providerOptions = ProviderOptions;

            return providerOptions is { Enabled: true } &&
                   !string.IsNullOrWhiteSpace(providerOptions.ExecutablePath);
        }
    }

    /// <summary>
    /// Reports what can be known without running anything. A configured executable that is
    /// missing from the filesystem is the one failure worth catching before a render starts,
    /// so it is checked - but only when the path is a path rather than a name resolved
    /// through PATH, which cannot be probed without launching it.
    /// </summary>
    public virtual Task<AiProviderHealth> CheckHealthAsync(CancellationToken ct)
    {
        var providerOptions = ProviderOptions;

        if (providerOptions is null)
            return Task.FromResult(AiProviderHealth.Unhealthy("No configuration for this provider."));

        if (!providerOptions.Enabled)
            return Task.FromResult(AiProviderHealth.Unhealthy("Disabled."));

        var path = providerOptions.ExecutablePath;

        if (string.IsNullOrWhiteSpace(path))
            return Task.FromResult(AiProviderHealth.Unhealthy("No executable is configured."));

        if (LooksLikeAPath(path) && !File.Exists(path))
            return Task.FromResult(AiProviderHealth.Unhealthy("The configured executable does not exist."));

        return Task.FromResult(AiProviderHealth.Healthy);
    }

    private static bool LooksLikeAPath(string value) =>
        value.Contains('/', StringComparison.Ordinal) ||
        value.Contains('\\', StringComparison.Ordinal);

    /// <summary>
    /// Runs the tool and returns what it produced. Never throws for a non-zero exit - the
    /// caller decides what a failure means for its own capability.
    /// </summary>
    protected async Task<AiProcessResult> RunAsync(
        IReadOnlyList<string> arguments, string? standardInput, CancellationToken ct)
    {
        var executable = ExecutablePath
            ?? throw new AiProviderException("not-configured",
                $"No executable is configured for '{Id.Value}'.");

        var startInfo = new ProcessStartInfo
        {
            FileName = executable,
            RedirectStandardInput = true,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };

        foreach (var argument in arguments) startInfo.ArgumentList.Add(argument);

        using var process = new Process { StartInfo = startInfo };

        try
        {
            process.Start();
        }
        catch (Exception ex) when (ex is System.ComponentModel.Win32Exception or FileNotFoundException)
        {
            throw new AiProviderException("executable-missing",
                $"The program configured for '{Id.Value}' could not be started.", ex);
        }

        var timeout = TimeSpan.FromSeconds(Math.Clamp(ProviderOptions?.TimeoutSeconds ?? 120, 5, 600));

        using var timeoutSource = CancellationTokenSource.CreateLinkedTokenSource(ct);
        timeoutSource.CancelAfter(timeout);
        var token = timeoutSource.Token;

        // Started before stdin is written: a tool that answers while still being fed would
        // otherwise fill its output pipe and stall.
        var stdoutTask = ReadStdOutAsync(process, token);
        var stderrTask = ReadStdErrAsync(process, token);

        try
        {
            if (standardInput is not null)
            {
                await process.StandardInput.WriteAsync(standardInput.AsMemory(), token)
                    .ConfigureAwait(false);
            }

            process.StandardInput.Close();

            await process.WaitForExitAsync(token).ConfigureAwait(false);
        }
        catch (OperationCanceledException)
        {
            Kill(process);

            // A caller cancel and a timeout mean different things to the job above.
            if (ct.IsCancellationRequested) throw;

            throw new AiProviderException("timeout",
                $"'{Id.Value}' did not finish within {timeout.TotalSeconds:0} seconds.");
        }
        catch (IOException ex)
        {
            // The tool exited before reading its input - a broken pipe, not a crash of ours.
            Kill(process);

            throw new AiProviderException("process-failed",
                $"'{Id.Value}' closed before it had read its input.", ex);
        }

        return new AiProcessResult(
            process.ExitCode,
            await stdoutTask.ConfigureAwait(false),
            await stderrTask.ConfigureAwait(false));
    }

    private static async Task<byte[]> ReadStdOutAsync(Process process, CancellationToken ct)
    {
        using var buffer = new MemoryStream();

        await process.StandardOutput.BaseStream.CopyToAsync(buffer, ct).ConfigureAwait(false);

        return buffer.ToArray();
    }

    private static Task<string> ReadStdErrAsync(Process process, CancellationToken ct) =>
        process.StandardError.ReadToEndAsync(ct);

    private static void Kill(Process process)
    {
        try
        {
            if (!process.HasExited) process.Kill(entireProcessTree: true);
        }
        catch (Exception ex) when (ex is InvalidOperationException or NotSupportedException)
        {
            // It exited between the check and the kill. Nothing to do.
        }
    }

    /// <summary>
    /// Resolves a caller-supplied id to a file inside <paramref name="directory"/>, and
    /// proves the result is actually inside it.
    /// </summary>
    /// <remarks>
    /// <para>
    /// Two checks, because either alone is insufficient. The id is rejected outright if it
    /// contains a separator or a dot segment; and the resolved absolute path is then
    /// required to sit under the directory, which is what catches a symlink pointing
    /// somewhere else entirely.
    /// </para>
    /// <para>
    /// <paramref name="kind"/> only names what is being looked up, so the error a caller
    /// sees reads <c>voice-not-found</c> for a synthesizer and <c>model-not-found</c> for a
    /// recognizer. The rule enforced is identical either way.
    /// </para>
    /// </remarks>
    protected static string ResolveInsideDirectory(
        string directory, string id, string extension, string providerId, string kind = "voice")
    {
        if (string.IsNullOrWhiteSpace(id) ||
            id.Length > 128 ||
            id is "." or ".." ||
            id.Contains('/', StringComparison.Ordinal) ||
            id.Contains('\\', StringComparison.Ordinal) ||
            id.Contains("..", StringComparison.Ordinal) ||
            id.Any(c => char.IsControl(c) || c == '\0'))
        {
            throw new AiProviderException($"{kind}-invalid",
                $"'{id}' is not a valid {kind} for '{providerId}'.");
        }

        var root = Path.GetFullPath(directory);
        var candidate = Path.GetFullPath(Path.Combine(root, id + extension));

        var rootWithSeparator = root.EndsWith(Path.DirectorySeparatorChar)
            ? root
            : root + Path.DirectorySeparatorChar;

        if (!candidate.StartsWith(rootWithSeparator, StringComparison.Ordinal))
        {
            throw new AiProviderException($"{kind}-invalid",
                $"'{id}' does not resolve to a file inside the configured directory.");
        }

        if (!File.Exists(candidate))
        {
            throw new AiProviderException($"{kind}-not-found",
                $"'{providerId}' has no {kind} called '{id}' installed.");
        }

        return candidate;
    }

    /// <summary>
    /// The last few lines of a tool's stderr, for a log line. Capped, because a failing
    /// synthesizer can produce a great deal of it.
    /// </summary>
    protected static string Tail(string? text, int maxLength = 400)
    {
        if (string.IsNullOrWhiteSpace(text)) return string.Empty;

        var trimmed = text.Trim();

        return trimmed.Length <= maxLength
            ? trimmed
            : string.Concat("...", trimmed.AsSpan(trimmed.Length - maxLength));
    }

    /// <summary>A scratch file that deletes itself, for tools that only write to disk.</summary>
    protected sealed class TemporaryFile : IDisposable
    {
        public TemporaryFile(string extension) =>
            Path = System.IO.Path.Combine(
                System.IO.Path.GetTempPath(), $"animstudio-{Guid.NewGuid():N}{extension}");

        public string Path { get; }

        public void Dispose()
        {
            try
            {
                if (File.Exists(Path)) File.Delete(Path);
            }
            catch (Exception ex) when (ex is IOException or UnauthorizedAccessException)
            {
                // A leaked scratch file is not worth failing a render over.
            }
        }
    }
}
