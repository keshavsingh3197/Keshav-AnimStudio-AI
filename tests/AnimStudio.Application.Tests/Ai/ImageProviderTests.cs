using System.Net;
using System.Text;
using System.Text.Json;
using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Ai;
using AnimStudio.Application.Options;
using AnimStudio.Domain.Ai;
using AnimStudio.Infrastructure.Ai.Providers;
using Microsoft.Extensions.Logging.Abstractions;

namespace AnimStudio.Application.Tests.Ai;

/// <summary>Byte payloads that are, and are not, the images they claim to be.</summary>
internal static class ImageBytes
{
    /// <summary>A PNG signature followed by enough filler to clear the minimum size.</summary>
    public static byte[] Png() =>
        [.. new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A }, .. new byte[400]];

    public static byte[] Jpeg()
    {
        var bytes = new byte[400];
        bytes[0] = 0xFF; bytes[1] = 0xD8; bytes[2] = 0xFF;
        bytes[^2] = 0xFF; bytes[^1] = 0xD9;
        return bytes;
    }

    public static byte[] WebP()
    {
        var bytes = new byte[400];
        "RIFF"u8.CopyTo(bytes);
        "WEBP"u8.CopyTo(bytes.AsSpan(8));
        return bytes;
    }

    /// <summary>What a free image endpoint returns when it has fallen over.</summary>
    public static byte[] HtmlErrorPage() =>
        Encoding.UTF8.GetBytes("<!doctype html><html><body>" + new string('x', 400) + "</body></html>");
}

public class AiImageValidatorTests
{
    [Fact]
    public void It_recognises_the_formats_the_render_pipeline_can_use()
    {
        Assert.Equal("image/png", AiImageValidator.Sniff(ImageBytes.Png()));
        Assert.Equal("image/jpeg", AiImageValidator.Sniff(ImageBytes.Jpeg()));
        Assert.Equal("image/webp", AiImageValidator.Sniff(ImageBytes.WebP()));
    }

    [Fact]
    public void An_error_page_is_not_an_image_however_it_is_labelled()
    {
        // The Content-Type header is the provider's claim, not a fact. These bytes would
        // otherwise reach the object store and fail three stages downstream in FFmpeg.
        Assert.Null(AiImageValidator.Sniff(ImageBytes.HtmlErrorPage()));

        var error = Assert.Throws<AiProviderException>(() =>
            AiImageValidator.Require(ImageBytes.HtmlErrorPage(), "pollinations"));

        Assert.Equal("not-an-image", error.Code);
    }

    [Fact]
    public void An_svg_is_refused_even_though_it_is_an_image()
    {
        // Allowlist, not denylist: an SVG is also a scripting container.
        var svg = Encoding.UTF8.GetBytes(
            "<svg xmlns='http://www.w3.org/2000/svg'>" + new string(' ', 400) + "</svg>");

        Assert.Null(AiImageValidator.Sniff(svg));
    }

    [Fact]
    public void A_truncated_jpeg_is_refused()
    {
        // A download cut short still starts with the right magic bytes.
        var bytes = ImageBytes.Jpeg();
        bytes[^1] = 0x00;

        Assert.Null(AiImageValidator.Sniff(bytes));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(8)]
    [InlineData(127)]
    public void Something_too_small_to_be_a_picture_is_refused(int length)
    {
        Assert.Null(AiImageValidator.Sniff(new byte[length]));
    }

    [Fact]
    public void Nothing_at_all_is_named_as_an_empty_response()
    {
        Assert.Equal("empty-response",
            Assert.Throws<AiProviderException>(() =>
                AiImageValidator.Require([], "pollinations")).Code);
    }

    [Fact]
    public void Only_the_formats_with_an_alpha_channel_claim_transparency()
    {
        Assert.True(AiImageValidator.SupportsTransparency("image/png"));
        Assert.True(AiImageValidator.SupportsTransparency("image/webp"));
        Assert.False(AiImageValidator.SupportsTransparency("image/jpeg"));
    }
}

public class PollinationsImageProviderTests
{
    private static (PollinationsImageProvider Provider, StubHandler Handler) Build()
    {
        var options = new AiOptions
        {
            Providers =
            {
                ["pollinations"] = new AiProviderOptions
                {
                    BaseUrl = "https://image.pollinations.ai/",
                    Model = "flux"
                }
            }
        };

        var handler = new StubHandler();

        return (new PollinationsImageProvider(
            AiProviderId.Parse("pollinations"),
            new StubHttpClientFactory(handler, "https://image.pollinations.ai/"),
            new StubSecretResolver(null),
            new StaticOptionsMonitor<AiOptions>(options),
            NullLogger<PollinationsImageProvider>.Instance), handler);
    }

    private static AiImageRequest Request(string prompt = "a wrestling ring, empty") => new()
    {
        Prompt = prompt,
        Width = 1024,
        Height = 576,
        Seed = 42
    };

    [Fact]
    public void It_is_configured_with_no_key_at_all()
    {
        // The one provider that works the moment it is switched on.
        var (provider, _) = Build();

        Assert.True(provider.IsConfigured);
    }

    [Fact]
    public async Task It_encodes_the_prompt_into_the_path_and_the_rest_into_the_query()
    {
        var (provider, handler) = Build();
        handler.RespondBytes(ImageBytes.Png());

        var result = await provider.GenerateAsync(Request(), CancellationToken.None);

        Assert.Equal("image/png", result.MimeType);

        // AbsoluteUri, not ToString: the latter returns the unescaped display form, which
        // would let a broken encoding pass this test.
        var url = handler.Requests[0].RequestUri!.AbsoluteUri;

        Assert.Contains("prompt/a%20wrestling%20ring%2C%20empty", url, StringComparison.Ordinal);
        Assert.Contains("width=1024", url, StringComparison.Ordinal);
        Assert.Contains("height=576", url, StringComparison.Ordinal);
        Assert.Contains("seed=42", url, StringComparison.Ordinal);
    }

    [Fact]
    public async Task A_slash_in_the_prompt_cannot_change_the_path()
    {
        var (provider, handler) = Build();
        handler.RespondBytes(ImageBytes.Png());

        await provider.GenerateAsync(Request("../../admin?x=1"), CancellationToken.None);

        var uri = handler.Requests[0].RequestUri!;

        Assert.StartsWith("/prompt/", uri.AbsolutePath, StringComparison.Ordinal);
        Assert.DoesNotContain("/admin", uri.AbsolutePath, StringComparison.Ordinal);
    }

    [Fact]
    public async Task An_over_long_prompt_is_refused_rather_than_truncated()
    {
        // Truncating would produce a different picture, invisibly.
        var (provider, handler) = Build();

        var error = await Assert.ThrowsAsync<AiProviderException>(() =>
            provider.GenerateAsync(Request(new string('a', 4000)), CancellationToken.None));

        Assert.Equal("prompt-too-long", error.Code);
        Assert.Empty(handler.Requests);
    }

    [Fact]
    public async Task An_html_error_page_returned_as_200_is_a_failure()
    {
        var (provider, handler) = Build();
        handler.RespondBytes(ImageBytes.HtmlErrorPage(), "image/png");

        var error = await Assert.ThrowsAsync<AiProviderException>(() =>
            provider.GenerateAsync(Request(), CancellationToken.None));

        Assert.Equal("not-an-image", error.Code);
    }

    [Fact]
    public async Task A_seed_is_sent_only_when_the_caller_pinned_one()
    {
        var (provider, handler) = Build();
        handler.RespondBytes(ImageBytes.Png());

        await provider.GenerateAsync(Request() with { Seed = null }, CancellationToken.None);

        Assert.DoesNotContain("seed=", handler.Requests[0].RequestUri!.Query, StringComparison.Ordinal);
    }
}

public class CloudflareWorkersAiImageProviderTests
{
    private const string BaseUrl = "https://api.cloudflare.com/client/v4/accounts/acct123/ai/run/";

    private static (CloudflareWorkersAiImageProvider Provider, StubHandler Handler) Build(
        string? model = "@cf/black-forest-labs/flux-1-schnell")
    {
        var options = new AiOptions
        {
            Providers =
            {
                ["cloudflare-ai"] = new AiProviderOptions { BaseUrl = BaseUrl, Model = model }
            }
        };

        var handler = new StubHandler();

        return (new CloudflareWorkersAiImageProvider(
            AiProviderId.Parse("cloudflare-ai"),
            new StubHttpClientFactory(handler, BaseUrl),
            new StubSecretResolver("cf-token-value"),
            new StaticOptionsMonitor<AiOptions>(options),
            NullLogger<CloudflareWorkersAiImageProvider>.Instance), handler);
    }

    private static AiImageRequest Request() => new()
    {
        Prompt = "a wrestling ring",
        NegativePrompt = "blurry",
        Width = 1024,
        Height = 1024
    };

    [Fact]
    public async Task It_accepts_base64_inside_json()
    {
        var (provider, handler) = Build();

        handler.RespondJson(
            $$"""{"result":{"image":"{{Convert.ToBase64String(ImageBytes.Png())}}"},"success":true}""");

        var result = await provider.GenerateAsync(Request(), CancellationToken.None);

        Assert.Equal("image/png", result.MimeType);
        Assert.Equal(ImageBytes.Png().Length, result.Content.Length);
    }

    [Fact]
    public async Task It_accepts_raw_bytes_too()
    {
        // Which of the two you get depends on the model, so both have to work.
        var (provider, handler) = Build();
        handler.RespondBytes(ImageBytes.Png());

        var result = await provider.GenerateAsync(Request(), CancellationToken.None);

        Assert.Equal("image/png", result.MimeType);
    }

    [Fact]
    public async Task Flux_is_sent_only_the_parameters_it_accepts()
    {
        // The platform's own recommended default model rejects the size and negative-prompt
        // fields that every other model there requires.
        var (provider, handler) = Build();
        handler.RespondBytes(ImageBytes.Png());

        await provider.GenerateAsync(Request(), CancellationToken.None);

        var sent = handler.Sent();

        Assert.Equal("a wrestling ring", sent.GetProperty("prompt").GetString());
        Assert.False(sent.TryGetProperty("width", out _));
        Assert.False(sent.TryGetProperty("negative_prompt", out _));
    }

    [Fact]
    public async Task Every_other_model_is_sent_the_full_set()
    {
        var (provider, handler) = Build("@cf/stabilityai/stable-diffusion-xl-base-1.0");
        handler.RespondBytes(ImageBytes.Png());

        await provider.GenerateAsync(Request(), CancellationToken.None);

        var sent = handler.Sent();

        Assert.Equal(1024, sent.GetProperty("width").GetInt32());
        Assert.Equal("blurry", sent.GetProperty("negative_prompt").GetString());
    }

    [Fact]
    public async Task The_model_becomes_the_path_under_the_configured_account()
    {
        var (provider, handler) = Build();
        handler.RespondBytes(ImageBytes.Png());

        await provider.GenerateAsync(Request(), CancellationToken.None);

        Assert.Equal(
            BaseUrl + "@cf/black-forest-labs/flux-1-schnell",
            handler.Requests[0].RequestUri!.ToString());
    }

    [Theory]
    [InlineData("@cf/../../../v4/accounts/other/ai/run/x")]
    [InlineData("/absolute/model")]
    [InlineData("model with spaces")]
    public async Task A_model_name_that_could_change_the_path_is_refused(string model)
    {
        var (provider, handler) = Build(model);

        var error = await Assert.ThrowsAsync<AiProviderException>(() =>
            provider.GenerateAsync(Request(), CancellationToken.None));

        Assert.Equal("model-invalid", error.Code);
        Assert.Empty(handler.Requests);
    }

    [Fact]
    public async Task A_success_false_body_is_a_refusal_rather_than_an_image()
    {
        var (provider, handler) = Build();
        handler.RespondJson("""{"success":false,"errors":[{"code":7003}]}""");

        var error = await Assert.ThrowsAsync<AiProviderException>(() =>
            provider.GenerateAsync(Request(), CancellationToken.None));

        Assert.Equal("provider-refused", error.Code);
    }

    [Fact]
    public async Task It_sends_the_key_as_a_bearer_token()
    {
        var (provider, handler) = Build();
        handler.RespondBytes(ImageBytes.Png());

        await provider.GenerateAsync(Request(), CancellationToken.None);

        Assert.Equal("cf-token-value", handler.Requests[0].Headers.Authorization!.Parameter);
    }
}

public class HuggingFaceImageProviderTests
{
    private static (HuggingFaceImageProvider Provider, StubHandler Handler) Build(
        string? model = "black-forest-labs/FLUX.1-schnell")
    {
        var options = new AiOptions
        {
            Providers =
            {
                ["huggingface"] = new AiProviderOptions
                {
                    BaseUrl = "https://api-inference.huggingface.co/",
                    Model = model
                }
            }
        };

        var handler = new StubHandler();

        return (new HuggingFaceImageProvider(
            AiProviderId.Parse("huggingface"),
            new StubHttpClientFactory(handler, "https://api-inference.huggingface.co/"),
            new StubSecretResolver("hf_token_value"),
            new StaticOptionsMonitor<AiOptions>(options),
            NullLogger<HuggingFaceImageProvider>.Instance), handler);
    }

    private static AiImageRequest Request() => new()
    {
        Prompt = "a wrestling ring",
        NegativePrompt = "blurry",
        Width = 768,
        Height = 768
    };

    [Fact]
    public async Task It_posts_the_prompt_to_the_model_and_returns_the_bytes()
    {
        var (provider, handler) = Build();
        handler.RespondBytes(ImageBytes.Jpeg());

        var result = await provider.GenerateAsync(Request(), CancellationToken.None);

        Assert.Equal("image/jpeg", result.MimeType);
        Assert.Equal(
            "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell",
            handler.Requests[0].RequestUri!.ToString());

        var sent = handler.Sent();
        Assert.Equal("a wrestling ring", sent.GetProperty("inputs").GetString());
        Assert.Equal("blurry", sent.GetProperty("parameters").GetProperty("negative_prompt").GetString());
    }

    [Fact]
    public async Task It_asks_the_service_to_wait_for_a_sleeping_model()
    {
        // Otherwise a cold start arrives as a 503, looks like an outage, and opens the
        // circuit - taking the provider out of the chain because the model was asleep.
        var (provider, handler) = Build();
        handler.RespondBytes(ImageBytes.Png());

        await provider.GenerateAsync(Request(), CancellationToken.None);

        Assert.Equal("true", handler.Requests[0].Headers.GetValues("x-wait-for-model").Single());
    }

    [Fact]
    public async Task A_repository_id_keeps_its_slash_but_not_a_dot_segment()
    {
        var (ok, handler) = Build();
        handler.RespondBytes(ImageBytes.Png());
        await ok.GenerateAsync(Request(), CancellationToken.None);
        Assert.Contains("models/black-forest-labs/FLUX.1-schnell",
            handler.Requests[0].RequestUri!.ToString(), StringComparison.Ordinal);

        var (bad, _) = Build("owner/../../etc");

        Assert.Equal("model-invalid",
            (await Assert.ThrowsAsync<AiProviderException>(() =>
                bad.GenerateAsync(Request(), CancellationToken.None))).Code);
    }
}

public class ComfyUiLocalImageProviderTests
{
    private const string BaseUrl = "http://localhost:8188/";

    private static (ComfyUiLocalImageProvider Provider, StubHandler Handler) Build(
        int timeoutSeconds = 30)
    {
        var options = new AiOptions
        {
            Providers =
            {
                ["comfyui-local"] = new AiProviderOptions
                {
                    BaseUrl = BaseUrl,
                    Model = "sd_xl_base_1.0.safetensors",
                    IsLocal = true,
                    TimeoutSeconds = timeoutSeconds
                }
            }
        };

        var handler = new StubHandler();

        return (new ComfyUiLocalImageProvider(
            AiProviderId.Parse("comfyui-local"),
            new StubHttpClientFactory(handler, BaseUrl),
            new StubSecretResolver(null),
            new StaticOptionsMonitor<AiOptions>(options),
            NullLogger<ComfyUiLocalImageProvider>.Instance), handler);
    }

    private static AiImageRequest Request(string prompt = "a wrestling ring") => new()
    {
        Prompt = prompt,
        NegativePrompt = "blurry",
        Width = 1024,
        Height = 576,
        Seed = 7
    };

    private const string FinishedHistory =
        """
        { "abc123": { "status": { "status_str": "success" },
                      "outputs": { "9": { "images": [ { "filename": "animstudio_001.png",
                                                        "subfolder": "", "type": "output" } ] } } } }
        """;

    [Fact]
    public void It_needs_no_key_because_it_is_on_this_machine()
    {
        var (provider, _) = Build();

        Assert.True(provider.IsConfigured);
    }

    [Fact]
    public async Task It_submits_polls_and_then_collects_the_image()
    {
        // Three round trips rather than one, because ComfyUI queues work.
        var (provider, handler) = Build();

        handler.RespondJson("""{"prompt_id":"abc123"}""");
        handler.RespondJson(FinishedHistory);
        handler.RespondBytes(ImageBytes.Png());

        var result = await provider.GenerateAsync(Request(), CancellationToken.None);

        Assert.Equal("image/png", result.MimeType);
        Assert.Equal(3, handler.Requests.Count);

        Assert.Equal(BaseUrl + "prompt", handler.Requests[0].RequestUri!.ToString());
        Assert.Equal(BaseUrl + "history/abc123", handler.Requests[1].RequestUri!.ToString());
        Assert.Contains("view?filename=animstudio_001.png",
            handler.Requests[2].RequestUri!.ToString(), StringComparison.Ordinal);
    }

    [Fact]
    public async Task It_keeps_polling_while_the_job_is_still_queued()
    {
        var (provider, handler) = Build();

        handler.RespondJson("""{"prompt_id":"abc123"}""");
        handler.RespondJson("{}");
        handler.RespondJson("{}");
        handler.RespondJson(FinishedHistory);
        handler.RespondBytes(ImageBytes.Png());

        var result = await provider.GenerateAsync(Request(), CancellationToken.None);

        Assert.Equal("image/png", result.MimeType);
        Assert.Equal(5, handler.Requests.Count);
    }

    [Fact]
    public async Task The_request_values_reach_the_workflow_as_json_values()
    {
        var (provider, handler) = Build();

        handler.RespondJson("""{"prompt_id":"abc123"}""");
        handler.RespondJson(FinishedHistory);
        handler.RespondBytes(ImageBytes.Png());

        await provider.GenerateAsync(Request(), CancellationToken.None);

        var workflow = handler.Sent().GetProperty("prompt");

        Assert.Equal("a wrestling ring",
            workflow.GetProperty("6").GetProperty("inputs").GetProperty("text").GetString());
        Assert.Equal("blurry",
            workflow.GetProperty("7").GetProperty("inputs").GetProperty("text").GetString());
        Assert.Equal(1024,
            workflow.GetProperty("5").GetProperty("inputs").GetProperty("width").GetInt32());
        Assert.Equal(7,
            workflow.GetProperty("3").GetProperty("inputs").GetProperty("seed").GetInt64());
        Assert.Equal("sd_xl_base_1.0.safetensors",
            workflow.GetProperty("4").GetProperty("inputs").GetProperty("ckpt_name").GetString());
    }

    [Fact]
    public async Task A_quotation_mark_in_the_prompt_cannot_rewrite_the_graph()
    {
        // The placeholder is substituted as a JSON value, not as text, so the prompt cannot
        // terminate its own string and continue as part of the workflow.
        var (provider, handler) = Build();

        handler.RespondJson("""{"prompt_id":"abc123"}""");
        handler.RespondJson(FinishedHistory);
        handler.RespondBytes(ImageBytes.Png());

        const string attack = """a ring", "steps": 1, "x": "b""";

        await provider.GenerateAsync(Request(attack), CancellationToken.None);

        var workflow = handler.Sent().GetProperty("prompt");

        Assert.Equal(attack,
            workflow.GetProperty("6").GetProperty("inputs").GetProperty("text").GetString());
        Assert.Equal(20,
            workflow.GetProperty("3").GetProperty("inputs").GetProperty("steps").GetInt32());
    }

    [Fact]
    public async Task A_workflow_error_is_reported_without_quoting_the_prompt()
    {
        var (provider, handler) = Build();

        handler.RespondJson("""{"prompt_id":"abc123"}""");
        handler.RespondJson(
            """
            { "abc123": { "status": { "status_str": "error",
                                      "messages": [["execution_error", {"exception_message":
                                        "value not in list for prompt: a wrestling ring"}]] } } }
            """);

        var error = await Assert.ThrowsAsync<AiProviderException>(() =>
            provider.GenerateAsync(Request(), CancellationToken.None));

        Assert.Equal("workflow-failed", error.Code);
        Assert.DoesNotContain("wrestling", error.Message, StringComparison.Ordinal);
    }

    [Fact]
    public async Task A_missing_prompt_id_is_a_malformed_response()
    {
        var (provider, handler) = Build();
        handler.RespondJson("""{"node_errors":{}}""");

        var error = await Assert.ThrowsAsync<AiProviderException>(() =>
            provider.GenerateAsync(Request(), CancellationToken.None));

        Assert.Equal("malformed-response", error.Code);
    }

    [Fact]
    public async Task A_prompt_id_that_is_not_safe_in_a_url_is_refused()
    {
        // It came from the service, but it still reaches a URL.
        var (provider, handler) = Build();
        handler.RespondJson("""{"prompt_id":"../../../etc/passwd"}""");

        var error = await Assert.ThrowsAsync<AiProviderException>(() =>
            provider.GenerateAsync(Request(), CancellationToken.None));

        Assert.Equal("malformed-response", error.Code);
        Assert.Single(handler.Requests);
    }

    [Fact]
    public async Task The_generated_seed_is_recorded_even_when_the_caller_pinned_none()
    {
        // Reproducing this exact image later needs the seed that was used, not the absence
        // of one.
        var (provider, handler) = Build();

        handler.RespondJson("""{"prompt_id":"abc123"}""");
        handler.RespondJson(FinishedHistory);
        handler.RespondBytes(ImageBytes.Png());

        var result = await provider.GenerateAsync(
            Request() with { Seed = null }, CancellationToken.None);

        Assert.NotNull(result.Provenance.Seed);

        var used = handler.Sent().GetProperty("prompt")
            .GetProperty("3").GetProperty("inputs").GetProperty("seed").GetInt64();

        Assert.Equal(used, result.Provenance.Seed);
    }

    [Fact]
    public async Task An_unreadable_workflow_file_names_the_configuration_as_the_problem()
    {
        var options = new AiOptions
        {
            Providers =
            {
                ["comfyui-local"] = new AiProviderOptions
                {
                    BaseUrl = BaseUrl,
                    IsLocal = true,
                    WorkflowPath = Path.Combine(Path.GetTempPath(), $"missing-{Guid.NewGuid():N}.json")
                }
            }
        };

        var provider = new ComfyUiLocalImageProvider(
            AiProviderId.Parse("comfyui-local"),
            new StubHttpClientFactory(new StubHandler(), BaseUrl),
            new StubSecretResolver(null),
            new StaticOptionsMonitor<AiOptions>(options),
            NullLogger<ComfyUiLocalImageProvider>.Instance);

        var error = await Assert.ThrowsAsync<AiProviderException>(() =>
            provider.GenerateAsync(Request(), CancellationToken.None));

        Assert.Equal("workflow-unreadable", error.Code);
    }

    [Fact]
    public async Task A_custom_workflow_is_used_and_its_placeholders_filled()
    {
        var path = Path.Combine(Path.GetTempPath(), $"workflow-{Guid.NewGuid():N}.json");

        await File.WriteAllTextAsync(path,
            """{ "1": { "class_type": "Custom", "inputs": { "text": {{prompt}}, "seed": {{seed}} } } }""",
            CancellationToken.None);

        try
        {
            var options = new AiOptions
            {
                Providers =
                {
                    ["comfyui-local"] = new AiProviderOptions
                    {
                        BaseUrl = BaseUrl, IsLocal = true, WorkflowPath = path
                    }
                }
            };

            var handler = new StubHandler();
            handler.RespondJson("""{"prompt_id":"abc123"}""");
            handler.RespondJson(
                """
                { "abc123": { "outputs": { "1": { "images": [ { "filename": "out.png",
                                                                "subfolder": "", "type": "output" } ] } } } }
                """);
            handler.RespondBytes(ImageBytes.Png());

            var provider = new ComfyUiLocalImageProvider(
                AiProviderId.Parse("comfyui-local"),
                new StubHttpClientFactory(handler, BaseUrl),
                new StubSecretResolver(null),
                new StaticOptionsMonitor<AiOptions>(options),
                NullLogger<ComfyUiLocalImageProvider>.Instance);

            await provider.GenerateAsync(Request(), CancellationToken.None);

            var workflow = handler.Sent().GetProperty("prompt");

            Assert.Equal("a wrestling ring",
                workflow.GetProperty("1").GetProperty("inputs").GetProperty("text").GetString());
            Assert.Equal(7,
                workflow.GetProperty("1").GetProperty("inputs").GetProperty("seed").GetInt64());
        }
        finally
        {
            File.Delete(path);
        }
    }
}
