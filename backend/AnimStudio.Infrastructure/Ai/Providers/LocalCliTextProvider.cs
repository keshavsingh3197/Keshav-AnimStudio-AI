using System.Text;
using System.Text.RegularExpressions;
using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Ai;
using AnimStudio.Application.Options;
using AnimStudio.Domain.Ai;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AnimStudio.Infrastructure.Ai.Providers;

/// <summary>
/// A text model reached through a command-line tool already signed in on this machine -
/// Claude Code (<c>claude -p</c>) or the GitHub Copilot CLI (<c>copilot -p</c>) - so the
/// user's existing subscription session does the writing and no API key is needed.
/// </summary>
/// <remarks>
/// <para>
/// These tools are agents, not plain completion endpoints, so they are run with as little
/// reach as the configuration allows: the arguments in appsettings switch their tools off,
/// the process starts in an empty scratch folder (no project files, no CLAUDE.md to pick
/// up), and this server's own secrets are removed from the environment it inherits.
/// </para>
/// <para>
/// The prompt goes to standard input unless the arguments say <c>{prompt}</c>. A prompt in
/// an argument is refused for a <c>.cmd</c>/<c>.bat</c> shim: Windows runs those through
/// cmd.exe, which would read <c>&amp;</c> or <c>|</c> in the user's brief as a second
/// command. Point <c>ExecutablePath</c> at the real <c>.exe</c> for those tools instead.
/// </para>
/// <para>
/// What comes back is untrusted like any model output: JSON is checked against the
/// template's schema before anyone uses it.
/// </para>
/// </remarks>
public sealed partial class LocalCliTextProvider(
    AiProviderId id,
    IOptionsMonitor<AiOptions> options,
    ILogger<LocalCliTextProvider> logger)
    : LocalProcessAiProvider(id, AiCapability.Text, options, logger), ITextAiProvider
{
    private const string PromptToken = "{prompt}";

    /// <summary>Well above any prompt this app writes, and well below Windows' 32K command-line limit.</summary>
    private const int MaxArgumentPromptChars = 24_000;

    [GeneratedRegex(@"\x1B\[[0-?]*[ -/]*[@-~]", RegexOptions.CultureInvariant)]
    private static partial Regex AnsiEscape { get; }

    public async Task<AiTextResult> CompleteAsync(AiTextRequest request, CancellationToken ct)
    {
        var providerOptions = ProviderOptions
            ?? throw new AiProviderException("not-configured", $"No configuration for '{Id.Value}'.");

        // The CLIs take one prompt, so the system prompt leads it.
        var prompt = string.IsNullOrWhiteSpace(request.SystemPrompt)
            ? request.Prompt
            : $"{request.SystemPrompt.Trim()}\n\n{request.Prompt}";

        var promptInArguments = providerOptions.Arguments.Any(a => a == PromptToken);
        if (promptInArguments)
        {
            var extension = Path.GetExtension(ExecutablePath ?? string.Empty);
            if (extension.Equals(".cmd", StringComparison.OrdinalIgnoreCase)
                || extension.Equals(".bat", StringComparison.OrdinalIgnoreCase))
            {
                throw new AiProviderException("not-configured",
                    $"'{Id.Value}' passes the prompt as an argument, which is unsafe through a .cmd/.bat shim. Set ExecutablePath to the tool's .exe.");
            }

            if (prompt.Length > MaxArgumentPromptChars)
                throw new AiProviderException("prompt-too-long", $"The prompt is too long for '{Id.Value}'.");
        }

        var arguments = providerOptions.Arguments
            .Select(a => a == PromptToken ? prompt : a)
            .ToList();

        if (!string.IsNullOrWhiteSpace(providerOptions.ModelArgument) && !string.IsNullOrWhiteSpace(providerOptions.Model))
        {
            arguments.Add(providerOptions.ModelArgument);
            arguments.Add(providerOptions.Model);
        }

        var scratch = Path.Combine(Path.GetTempPath(), "animstudio-ai-cli", Guid.NewGuid().ToString("n"));
        Directory.CreateDirectory(scratch);

        AiProcessResult result;
        try
        {
            result = await RunAsync(arguments, promptInArguments ? null : prompt, ct,
                workingDirectory: scratch, scrubAppSecrets: true).ConfigureAwait(false);
        }
        finally
        {
            TryDelete(scratch);
        }

        if (!result.Succeeded)
        {
            // stderr is not logged: it can echo the prompt, which carries the user's script.
            Logger.LogWarning("Local AI tool {ProviderId} exited with code {ExitCode}.", Id.Value, result.ExitCode);
            throw new AiProviderException("process-failed",
                $"'{Id.Value}' did not finish successfully. Check that it is installed and signed in.");
        }

        var text = AnsiEscape.Replace(Encoding.UTF8.GetString(result.StandardOutput), string.Empty).Trim();
        if (text.Length == 0)
            throw new AiProviderException("empty-response", $"'{Id.Value}' returned nothing.");

        var content = string.IsNullOrWhiteSpace(request.JsonSchema)
            ? text
            : AiJsonResponse.Require(text, request.JsonSchema!);

        return new AiTextResult(
            content,
            new AiProvenance
            {
                ProviderId = Id.Value,
                Capability = AiCapability.Text,
                Model = string.IsNullOrWhiteSpace(providerOptions.Model) ? null : providerOptions.Model,
                PromptTemplateKey = request.PromptTemplateKey,
                PromptTemplateVersion = request.PromptTemplateVersion,
                Seed = request.Seed,
                GeneratedAtUtc = DateTime.UtcNow
            });
    }

    private void TryDelete(string directory)
    {
        try
        {
            Directory.Delete(directory, recursive: true);
        }
        catch (Exception ex) when (ex is IOException or UnauthorizedAccessException)
        {
            Logger.LogDebug("Could not remove the scratch folder for {ProviderId}.", Id.Value);
        }
    }
}
