using System.Diagnostics;
using System.Globalization;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Ai;
using AnimStudio.Application.Options;
using AnimStudio.Domain.Ai;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AnimStudio.Infrastructure.Ai.Providers;

/// <summary>
/// Images from a ComfyUI instance running on this machine.
/// </summary>
/// <remarks>
/// <para>
/// The only image provider with no quota, no key and nothing leaving the network, which
/// makes it the one that stays usable at volume - a hundred-scene video is a hundred
/// background images, and every hosted free tier runs out well before that.
/// </para>
/// <para>
/// It is also the only one that is not a single request. ComfyUI queues work: a POST
/// returns a <c>prompt_id</c>, the job runs, and the result has to be collected afterwards.
/// So this provider submits, polls the history until the job appears, and then fetches the
/// image - three round trips where the others make one. The whole sequence is bounded by
/// the provider's configured timeout, because a queue with something else in front of it
/// can otherwise wait indefinitely.
/// </para>
/// <para>
/// The built-in workflow is a plain text-to-image graph. A real installation usually has
/// its own, so <c>WorkflowPath</c> points at one exported in ComfyUI's API format, with
/// <c>{{prompt}}</c>-style placeholders where the per-request values go. The placeholders
/// are substituted as <b>JSON values, not as text</b>: a prompt is serialized to a quoted
/// JSON string, so a quotation mark in a character description cannot terminate the string
/// early and turn the rest of the prompt into part of the graph.
/// </para>
/// </remarks>
public sealed class ComfyUiLocalImageProvider(
    AiProviderId id,
    IAiHttpClientFactory clients,
    IAiSecretResolver secrets,
    IOptionsMonitor<AiOptions> options,
    ILogger<ComfyUiLocalImageProvider> logger)
    : HttpAiProviderBase(id, AiCapability.Image, clients, secrets, options, logger), IImageAiProvider
{
    private const int MaxImageBytes = 32 * 1024 * 1024;

    /// <summary>Frequent enough to feel responsive, rare enough not to hammer a busy queue.</summary>
    private static readonly TimeSpan PollInterval = TimeSpan.FromMilliseconds(750);

    /// <summary>Identifies this application in ComfyUI's queue, for a human reading it.</summary>
    private readonly string _clientId = $"animstudio-{Guid.NewGuid():N}";

    /// <summary>
    /// A minimal text-to-image graph in ComfyUI's API format. Placeholders sit where a JSON
    /// VALUE goes - unquoted in the template, quoted by the substitution.
    /// </summary>
    private const string BuiltInWorkflow =
        """
        {
          "3": { "class_type": "KSampler",
                 "inputs": { "seed": {{seed}}, "steps": 20, "cfg": 7.0,
                             "sampler_name": "euler", "scheduler": "normal", "denoise": 1.0,
                             "model": ["4", 0], "positive": ["6", 0],
                             "negative": ["7", 0], "latent_image": ["5", 0] } },
          "4": { "class_type": "CheckpointLoaderSimple",
                 "inputs": { "ckpt_name": {{checkpoint}} } },
          "5": { "class_type": "EmptyLatentImage",
                 "inputs": { "width": {{width}}, "height": {{height}}, "batch_size": 1 } },
          "6": { "class_type": "CLIPTextEncode",
                 "inputs": { "text": {{prompt}}, "clip": ["4", 1] } },
          "7": { "class_type": "CLIPTextEncode",
                 "inputs": { "text": {{negativePrompt}}, "clip": ["4", 1] } },
          "8": { "class_type": "VAEDecode",
                 "inputs": { "samples": ["3", 0], "vae": ["4", 2] } },
          "9": { "class_type": "SaveImage",
                 "inputs": { "filename_prefix": "animstudio", "images": ["8", 0] } }
        }
        """;

    /// <summary>Local: nothing to authenticate to, and nothing that should be sent one.</summary>
    protected override bool RequiresApiKey => false;

    public async Task<AiImageResult> GenerateAsync(AiImageRequest request, CancellationToken ct)
    {
        var seed = request.Seed ?? Random.Shared.NextInt64(0, uint.MaxValue);
        var workflow = await BuildWorkflowAsync(request, seed, ct).ConfigureAwait(false);

        var promptId = await SubmitAsync(workflow, ct).ConfigureAwait(false);
        var reference = await AwaitOutputAsync(promptId, ct).ConfigureAwait(false);
        var bytes = await FetchAsync(reference, ct).ConfigureAwait(false);

        var mimeType = AiImageValidator.Require(bytes, Id.Value);

        return new AiImageResult(bytes, mimeType, new AiProvenance
        {
            ProviderId = Id.Value,
            Capability = AiCapability.Image,
            Model = Model,
            PromptTemplateKey = request.PromptTemplateKey,
            PromptTemplateVersion = request.PromptTemplateVersion,

            // Recorded even though the caller may not have pinned one: reproducing this
            // exact image later needs the seed that was actually used, not the absence of one.
            Seed = seed,
            GeneratedAtUtc = DateTime.UtcNow
        });
    }

    // --- workflow ------------------------------------------------------------------

    private async Task<JsonNode> BuildWorkflowAsync(
        AiImageRequest request, long seed, CancellationToken ct)
    {
        var template = await ReadTemplateAsync(ct).ConfigureAwait(false);

        var values = new Dictionary<string, string>(StringComparer.Ordinal)
        {
            ["prompt"] = JsonSerializer.Serialize(request.Prompt ?? string.Empty),
            ["negativePrompt"] = JsonSerializer.Serialize(request.NegativePrompt ?? string.Empty),
            ["checkpoint"] = JsonSerializer.Serialize(Model ?? string.Empty),
            ["width"] = Math.Clamp(request.Width, 64, 4096).ToString(CultureInfo.InvariantCulture),
            ["height"] = Math.Clamp(request.Height, 64, 4096).ToString(CultureInfo.InvariantCulture),
            ["seed"] = seed.ToString(CultureInfo.InvariantCulture)
        };

        var builder = new StringBuilder(template);

        foreach (var (name, value) in values)
            builder.Replace($"{{{{{name}}}}}", value);

        var filled = builder.ToString();

        try
        {
            return JsonNode.Parse(filled)
                ?? throw new AiProviderException("workflow-invalid", "The workflow is empty.");
        }
        catch (JsonException ex)
        {
            // A custom workflow file is operator input, so this is a configuration mistake
            // rather than a provider fault - and the message must say which.
            throw new AiProviderException("workflow-invalid",
                "The ComfyUI workflow is not valid JSON once its placeholders are filled in.", ex);
        }
    }

    private async Task<string> ReadTemplateAsync(CancellationToken ct)
    {
        var path = ProviderOptions?.WorkflowPath;

        if (string.IsNullOrWhiteSpace(path)) return BuiltInWorkflow;

        try
        {
            return await File.ReadAllTextAsync(path, ct).ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is IOException or UnauthorizedAccessException)
        {
            // The path is not echoed: it is a local filesystem path and this message can
            // travel into a response.
            throw new AiProviderException("workflow-unreadable",
                $"The workflow file configured for '{Id.Value}' could not be read.", ex);
        }
    }

    // --- queue ---------------------------------------------------------------------

    private async Task<string> SubmitAsync(JsonNode workflow, CancellationToken ct)
    {
        var body = new JsonObject
        {
            ["prompt"] = workflow,
            ["client_id"] = _clientId
        };

        using var request = new HttpRequestMessage(HttpMethod.Post, "prompt")
        {
            Content = new StringContent(body.ToJsonString(), Encoding.UTF8, "application/json")
        };

        using var response = await SendForJsonAsync(request, ct).ConfigureAwait(false);

        if (!response.RootElement.TryGetProperty("prompt_id", out var promptId) ||
            promptId.ValueKind != JsonValueKind.String ||
            promptId.GetString() is not { Length: > 0 } value)
        {
            throw new AiProviderException("malformed-response",
                $"'{Id.Value}' accepted the job but returned no prompt id.");
        }

        return value;
    }

    /// <summary>
    /// Polls until the job appears in the history, or the provider's timeout runs out.
    /// </summary>
    private async Task<ImageReference> AwaitOutputAsync(string promptId, CancellationToken ct)
    {
        // A queue can have someone else's work in front of it, so the ceiling is the
        // provider's own timeout rather than a single request's.
        var budget = TimeSpan.FromSeconds(Math.Clamp(ProviderOptions?.TimeoutSeconds ?? 120, 5, 600));
        var elapsed = Stopwatch.StartNew();

        // The prompt id came from the service, but it reaches a URL, so it is checked like
        // any other value that does.
        if (!IsSafePathValue(promptId, allowSlashes: false))
        {
            throw new AiProviderException("malformed-response",
                $"'{Id.Value}' returned a prompt id that is not safe to put in a URL.");
        }

        while (true)
        {
            ct.ThrowIfCancellationRequested();

            using (var request = new HttpRequestMessage(HttpMethod.Get, $"history/{promptId}"))
            using (var response = await SendForJsonAsync(request, ct).ConfigureAwait(false))
            {
                if (response.RootElement.TryGetProperty(promptId, out var entry))
                {
                    FailIfErrored(entry);

                    if (FindImage(entry) is { } reference) return reference;
                }
            }

            if (elapsed.Elapsed >= budget)
            {
                throw new AiProviderException("timeout",
                    $"'{Id.Value}' did not finish the image within {budget.TotalSeconds:0} seconds.");
            }

            await Task.Delay(PollInterval, ct).ConfigureAwait(false);
        }
    }

    private void FailIfErrored(JsonElement entry)
    {
        if (!entry.TryGetProperty("status", out var status) ||
            status.ValueKind != JsonValueKind.Object)
        {
            return;
        }

        var failed = status.TryGetProperty("status_str", out var text) &&
                     text.ValueKind == JsonValueKind.String &&
                     string.Equals(text.GetString(), "error", StringComparison.OrdinalIgnoreCase);

        if (!failed) return;

        // ComfyUI's node errors are long and quote the prompt, so the code travels and the
        // detail does not.
        throw new AiProviderException("workflow-failed",
            $"'{Id.Value}' reported an error while running the workflow. " +
            "Check the ComfyUI console - the checkpoint named in the configuration is the " +
            "usual cause.");
    }

    /// <summary>
    /// Finds the first saved image in any output node, rather than assuming the built-in
    /// graph's node numbering - a custom workflow will have its own.
    /// </summary>
    private static ImageReference? FindImage(JsonElement entry)
    {
        if (!entry.TryGetProperty("outputs", out var outputs) ||
            outputs.ValueKind != JsonValueKind.Object)
        {
            return null;
        }

        foreach (var node in outputs.EnumerateObject())
        {
            if (node.Value.ValueKind != JsonValueKind.Object ||
                !node.Value.TryGetProperty("images", out var images) ||
                images.ValueKind != JsonValueKind.Array)
            {
                continue;
            }

            foreach (var image in images.EnumerateArray())
            {
                if (image.ValueKind != JsonValueKind.Object) continue;

                var filename = Text(image, "filename");
                if (filename is null) continue;

                return new ImageReference(
                    filename, Text(image, "subfolder") ?? string.Empty,
                    Text(image, "type") ?? "output");
            }
        }

        return null;

        static string? Text(JsonElement element, string name) =>
            element.TryGetProperty(name, out var value) && value.ValueKind == JsonValueKind.String
                ? value.GetString()
                : null;
    }

    private async Task<byte[]> FetchAsync(ImageReference reference, CancellationToken ct)
    {
        var url =
            $"view?filename={Uri.EscapeDataString(reference.Filename)}" +
            $"&subfolder={Uri.EscapeDataString(reference.Subfolder)}" +
            $"&type={Uri.EscapeDataString(reference.Type)}";

        using var request = new HttpRequestMessage(HttpMethod.Get, url);

        return await SendForBytesAsync(request, MaxImageBytes, ct).ConfigureAwait(false);
    }

    private sealed record ImageReference(string Filename, string Subfolder, string Type);
}
