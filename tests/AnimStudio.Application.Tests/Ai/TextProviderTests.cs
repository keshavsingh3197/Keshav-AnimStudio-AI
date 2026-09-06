using System.Net;
using System.Text;
using System.Text.Json;
using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Ai;
using AnimStudio.Application.Options;
using AnimStudio.Domain.Ai;
using AnimStudio.Infrastructure.Ai;
using AnimStudio.Infrastructure.Ai.Providers;
using Microsoft.Extensions.Logging.Abstractions;

namespace AnimStudio.Application.Tests.Ai;

/// <summary>Serves canned responses and records exactly what the provider sent.</summary>
internal sealed class StubHandler : HttpMessageHandler
{
    private readonly Queue<(HttpStatusCode Status, byte[] Body, string ContentType)> _responses = new();

    public List<HttpRequestMessage> Requests { get; } = [];
    public List<string> Bodies { get; } = [];

    public StubHandler Respond(HttpStatusCode status, string body)
    {
        _responses.Enqueue((status, Encoding.UTF8.GetBytes(body), "application/json"));
        return this;
    }

    public StubHandler RespondJson(string body) => Respond(HttpStatusCode.OK, body);

    /// <summary>An image response - or something claiming to be one.</summary>
    public StubHandler RespondBytes(byte[] body, string contentType = "image/png")
    {
        _responses.Enqueue((HttpStatusCode.OK, body, contentType));
        return this;
    }

    protected override async Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request, CancellationToken cancellationToken)
    {
        Requests.Add(request);
        Bodies.Add(request.Content is null
            ? string.Empty
            : await request.Content.ReadAsStringAsync(cancellationToken));

        var (status, body, contentType) = _responses.Count > 0
            ? _responses.Dequeue()
            : (HttpStatusCode.OK, "{}"u8.ToArray(), "application/json");

        var content = new ByteArrayContent(body);
        content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(contentType);

        return new HttpResponseMessage(status) { Content = content };
    }

    public JsonElement Sent(int index = 0) => JsonDocument.Parse(Bodies[index]).RootElement;
}

internal sealed class StubHttpClientFactory(HttpMessageHandler handler, string baseUrl)
    : IAiHttpClientFactory
{
    public HttpClient Create(AiProviderId provider) =>
        new(handler, disposeHandler: false) { BaseAddress = new Uri(baseUrl) };
}

internal sealed class StubSecretResolver(string? secret = "test-key-value") : IAiSecretResolver
{
    public string? Secret { get; set; } = secret;
    public List<AiProviderId> Invalidated { get; } = [];

    public Task<string?> GetSecretAsync(AiProviderId provider, CancellationToken ct) =>
        Task.FromResult(Secret);

    public bool IsInstalled(AiProviderId provider) => !string.IsNullOrEmpty(Secret);

    public void Invalidate(AiProviderId provider) => Invalidated.Add(provider);

    public Task WarmAsync(CancellationToken ct) => Task.CompletedTask;
}

public class OpenAiCompatibleTextProviderTests
{
    private const string Schema =
        """
        { "type": "object", "required": ["text"],
          "properties": { "text": { "type": "string" } } }
        """;

    private static string Completion(string content, string? finishReason = "stop") =>
        $$"""
          { "choices": [ { "message": { "role": "assistant", "content": {{JsonSerializer.Serialize(content)}} },
                           "finish_reason": {{JsonSerializer.Serialize(finishReason)}} } ],
            "usage": { "prompt_tokens": 11, "completion_tokens": 22 } }
          """;

    private static (OpenAiCompatibleTextProvider Provider, StubHandler Handler, StubSecretResolver Secrets)
        Build(Action<AiProviderOptions>? configure = null, string? secret = "test-key-value")
    {
        var providerOptions = new AiProviderOptions
        {
            Enabled = true,
            BaseUrl = "https://api.groq.com/openai/v1/",
            Model = "llama-3.3-70b-versatile"
        };

        configure?.Invoke(providerOptions);

        var options = new AiOptions
        {
            Providers = { ["groq"] = providerOptions }
        };

        var handler = new StubHandler();
        var secrets = new StubSecretResolver(secret);

        var provider = new OpenAiCompatibleTextProvider(
            AiProviderId.Parse("groq"),
            new StubHttpClientFactory(handler, providerOptions.BaseUrl!),
            secrets,
            new StaticOptionsMonitor<AiOptions>(options),
            NullLogger<OpenAiCompatibleTextProvider>.Instance);

        return (provider, handler, secrets);
    }

    private static AiTextRequest Request(string? schema = null) => new()
    {
        Prompt = "Who is speaking?",
        SystemPrompt = "You identify speakers.",
        JsonSchema = schema,
        MaxOutputTokens = 512,
        Temperature = 0.3
    };

    [Fact]
    public async Task It_sends_the_system_and_user_messages_and_returns_the_completion()
    {
        var (provider, handler, _) = Build();
        handler.RespondJson(Completion("Rahul is speaking."));

        var result = await provider.CompleteAsync(Request(), CancellationToken.None);

        Assert.Equal("Rahul is speaking.", result.Text);
        Assert.Equal(11, result.PromptTokens);
        Assert.Equal(22, result.CompletionTokens);

        var sent = handler.Sent();
        var messages = sent.GetProperty("messages");

        Assert.Equal("llama-3.3-70b-versatile", sent.GetProperty("model").GetString());
        Assert.Equal(2, messages.GetArrayLength());
        Assert.Equal("system", messages[0].GetProperty("role").GetString());
        Assert.Equal("user", messages[1].GetProperty("role").GetString());
    }

    [Fact]
    public async Task It_posts_to_the_versioned_path_rather_than_replacing_the_last_segment()
    {
        // The trailing-slash trap: "chat/completions" against ".../openai/v1" without one
        // resolves to ".../openai/chat/completions", a 404 that reads like an outage.
        var (provider, handler, _) = Build();
        handler.RespondJson(Completion("ok"));

        await provider.CompleteAsync(Request(), CancellationToken.None);

        Assert.Equal(
            "https://api.groq.com/openai/v1/chat/completions",
            handler.Requests[0].RequestUri!.ToString());
    }

    [Fact]
    public async Task It_sends_the_key_as_a_bearer_token()
    {
        var (provider, handler, _) = Build();
        handler.RespondJson(Completion("ok"));

        await provider.CompleteAsync(Request(), CancellationToken.None);

        var authorization = handler.Requests[0].Headers.Authorization;

        Assert.Equal("Bearer", authorization!.Scheme);
        Assert.Equal("test-key-value", authorization.Parameter);
    }

    [Fact]
    public async Task A_local_provider_sends_no_credential_at_all()
    {
        // Pointing at localhost must never send a key to whatever is listening there.
        var (provider, handler, _) = Build(
            o => { o.IsLocal = true; o.BaseUrl = "http://localhost:11434/v1/"; },
            secret: null);

        handler.RespondJson(Completion("ok"));

        await provider.CompleteAsync(Request(), CancellationToken.None);

        Assert.Null(handler.Requests[0].Headers.Authorization);
    }

    [Fact]
    public async Task Json_mode_is_requested_only_when_a_schema_is()
    {
        var (provider, handler, _) = Build();
        handler.RespondJson(Completion("""{"text":"hello"}"""));

        await provider.CompleteAsync(Request(Schema), CancellationToken.None);
        Assert.Equal("json_object", handler.Sent().GetProperty("response_format").GetProperty("type").GetString());

        handler.RespondJson(Completion("free prose"));
        await provider.CompleteAsync(Request(), CancellationToken.None);
        Assert.False(handler.Sent(1).TryGetProperty("response_format", out _));
    }

    [Fact]
    public async Task An_endpoint_that_refuses_json_mode_is_retried_without_it()
    {
        // Older self-hosted builds reject the parameter outright. Degrading beats making an
        // operator find a flag, and the schema check still guarantees the shape.
        var (provider, handler, _) = Build();

        handler.Respond(HttpStatusCode.BadRequest, """{"error":{"code":"unknown_parameter"}}""");
        handler.RespondJson(Completion("""{"text":"hello"}"""));

        var result = await provider.CompleteAsync(Request(Schema), CancellationToken.None);

        Assert.Equal("""{"text":"hello"}""", result.Text);
        Assert.Equal(2, handler.Requests.Count);
        Assert.True(handler.Sent(0).TryGetProperty("response_format", out _));
        Assert.False(handler.Sent(1).TryGetProperty("response_format", out _));
    }

    [Fact]
    public async Task A_request_without_json_mode_is_not_retried()
    {
        var (provider, handler, _) = Build();
        handler.Respond(HttpStatusCode.BadRequest, "{}");

        await Assert.ThrowsAsync<AiProviderException>(() =>
            provider.CompleteAsync(Request(), CancellationToken.None));

        Assert.Single(handler.Requests);
    }

    [Theory]
    [InlineData(HttpStatusCode.Unauthorized, "credential-rejected")]
    [InlineData(HttpStatusCode.Forbidden, "credential-rejected")]
    [InlineData(HttpStatusCode.NotFound, "endpoint-or-model-not-found")]
    [InlineData(HttpStatusCode.TooManyRequests, "rate-limited")]
    [InlineData(HttpStatusCode.InternalServerError, "provider-error")]
    [InlineData(HttpStatusCode.ServiceUnavailable, "provider-error")]
    public async Task A_failure_status_becomes_a_named_code(HttpStatusCode status, string expected)
    {
        var (provider, handler, _) = Build();
        handler.Respond(status, "{}");

        var error = await Assert.ThrowsAsync<AiProviderException>(() =>
            provider.CompleteAsync(Request(), CancellationToken.None));

        Assert.Equal(expected, error.Code);
    }

    [Fact]
    public async Task An_error_body_contributes_its_identifier_and_never_its_prose()
    {
        // A provider's error message routinely quotes the request, and the request contains
        // the user's transcript. The short code is useful; the message is a disclosure.
        var (provider, handler, _) = Build();

        handler.Respond(HttpStatusCode.BadRequest,
            """
            {"error":{"code":"model_not_found",
                      "message":"No model for prompt: Rahul said the secret is hunter2"}}
            """);

        var error = await Assert.ThrowsAsync<AiProviderException>(() =>
            provider.CompleteAsync(Request(), CancellationToken.None));

        Assert.Contains("model_not_found", error.Message, StringComparison.Ordinal);
        Assert.DoesNotContain("hunter2", error.Message, StringComparison.Ordinal);
        Assert.DoesNotContain("Rahul", error.Message, StringComparison.Ordinal);
    }

    [Fact]
    public async Task A_response_that_does_not_match_the_schema_fails_rather_than_being_returned()
    {
        // Failing here is what keeps an invalid answer out of the result cache, where it
        // would be served forever.
        var (provider, handler, _) = Build();
        handler.RespondJson(Completion("""{"wrong":"shape"}"""));

        var error = await Assert.ThrowsAsync<AiProviderException>(() =>
            provider.CompleteAsync(Request(Schema), CancellationToken.None));

        Assert.Equal("schema-mismatch", error.Code);
    }

    [Fact]
    public async Task A_fenced_json_response_is_accepted()
    {
        var (provider, handler, _) = Build();
        handler.RespondJson(Completion("```json\n{\"text\":\"hello\"}\n```"));

        var result = await provider.CompleteAsync(Request(Schema), CancellationToken.None);

        Assert.Equal("""{"text":"hello"}""", result.Text);
    }

    [Fact]
    public async Task Content_returned_as_typed_parts_is_concatenated()
    {
        // Some models behind OpenRouter answer this way; handling only the string form
        // would work for most models and mysteriously fail for a few.
        var (provider, handler, _) = Build();

        handler.RespondJson(
            """
            { "choices": [ { "message": { "content": [ {"type":"text","text":"one "},
                                                       {"type":"text","text":"two"} ] },
                             "finish_reason": "stop" } ] }
            """);

        var result = await provider.CompleteAsync(Request(), CancellationToken.None);

        Assert.Equal("one two", result.Text);
    }

    [Fact]
    public async Task Truncated_output_fails_a_structured_request_and_is_kept_for_a_free_one()
    {
        var (provider, handler, _) = Build();
        handler.RespondJson(Completion("""{"text":"half""", finishReason: "length"));

        var error = await Assert.ThrowsAsync<AiProviderException>(() =>
            provider.CompleteAsync(Request(Schema), CancellationToken.None));

        Assert.Equal("output-truncated", error.Code);

        // Free text is the caller's own sizing decision, so the partial answer is returned.
        handler.RespondJson(Completion("a long line cut sh", finishReason: "length"));

        var result = await provider.CompleteAsync(Request(), CancellationToken.None);
        Assert.Equal("a long line cut sh", result.Text);
    }

    [Fact]
    public async Task An_empty_completion_is_treated_as_a_failure()
    {
        // A blank completion is how several services express a refusal.
        var (provider, handler, _) = Build();
        handler.RespondJson(Completion(""));

        var error = await Assert.ThrowsAsync<AiProviderException>(() =>
            provider.CompleteAsync(Request(), CancellationToken.None));

        Assert.Equal("empty-response", error.Code);
    }

    [Fact]
    public void IsConfigured_follows_the_key_the_endpoint_and_the_switch()
    {
        var (withKey, _, secrets) = Build();
        Assert.True(withKey.IsConfigured);

        secrets.Secret = null;
        Assert.False(withKey.IsConfigured);

        var (disabled, _, _) = Build(o => o.Enabled = false);
        Assert.False(disabled.IsConfigured);

        var (noUrl, _, _) = Build(o => o.BaseUrl = " ");
        Assert.False(noUrl.IsConfigured);

        // A local provider is configured without any key at all.
        var (local, _, _) = Build(o => o.IsLocal = true, secret: null);
        Assert.True(local.IsConfigured);
    }

    [Fact]
    public async Task A_key_removed_between_the_check_and_the_call_fails_cleanly()
    {
        var (provider, handler, secrets) = Build();
        secrets.Secret = null;

        // IsConfigured was true when the chain was composed; the key has gone since.
        var error = await Assert.ThrowsAsync<AiProviderException>(() =>
            provider.CompleteAsync(Request(), CancellationToken.None));

        Assert.Equal("credential-missing", error.Code);
        Assert.Empty(handler.Requests);
    }

    [Fact]
    public async Task A_health_check_costs_no_quota()
    {
        // Probing on every dashboard refresh would spend the free allowance this layer
        // exists to conserve.
        var (provider, handler, _) = Build();

        var health = await provider.CheckHealthAsync(CancellationToken.None);

        Assert.True(health.IsHealthy);
        Assert.Empty(handler.Requests);
    }
}

public class GeminiTextProviderTests
{
    private const string Schema =
        """
        { "type": "object", "required": ["text"],
          "properties": { "text": { "type": "string" } } }
        """;

    private static (GeminiTextProvider Provider, StubHandler Handler) Build(
        Action<AiProviderOptions>? configure = null)
    {
        var providerOptions = new AiProviderOptions
        {
            Enabled = true,
            BaseUrl = "https://generativelanguage.googleapis.com/",
            Model = "gemini-2.5-flash"
        };

        configure?.Invoke(providerOptions);

        var options = new AiOptions { Providers = { ["gemini"] = providerOptions } };
        var handler = new StubHandler();

        var provider = new GeminiTextProvider(
            AiProviderId.Parse("gemini"),
            new StubHttpClientFactory(handler, providerOptions.BaseUrl!),
            new StubSecretResolver("gemini-key-value"),
            new StaticOptionsMonitor<AiOptions>(options),
            NullLogger<GeminiTextProvider>.Instance);

        return (provider, handler);
    }

    private static AiTextRequest Request(string? schema = null) => new()
    {
        Prompt = "Name the setting.",
        SystemPrompt = "You name settings.",
        JsonSchema = schema
    };

    private static string Candidate(string text, string finishReason = "STOP") =>
        $$"""
          { "candidates": [ { "content": { "parts": [ { "text": {{JsonSerializer.Serialize(text)}} } ] },
                              "finishReason": "{{finishReason}}" } ],
            "usageMetadata": { "promptTokenCount": 7, "candidatesTokenCount": 9 } }
          """;

    [Fact]
    public async Task The_key_travels_in_a_header_never_in_the_url()
    {
        // A key in a query string ends up in request logs, proxy logs and any exception
        // that quotes the URI.
        var (provider, handler) = Build();
        handler.RespondJson(Candidate("The wrestling ring."));

        await provider.CompleteAsync(Request(), CancellationToken.None);

        var request = handler.Requests[0];

        Assert.Equal("gemini-key-value", request.Headers.GetValues("x-goog-api-key").Single());
        Assert.DoesNotContain("gemini-key-value", request.RequestUri!.ToString(), StringComparison.Ordinal);
        Assert.DoesNotContain("key=", request.RequestUri.Query, StringComparison.Ordinal);
    }

    [Fact]
    public async Task It_puts_the_model_in_the_path_and_the_system_prompt_in_its_own_field()
    {
        var (provider, handler) = Build();
        handler.RespondJson(Candidate("The wrestling ring."));

        var result = await provider.CompleteAsync(Request(), CancellationToken.None);

        Assert.Equal("The wrestling ring.", result.Text);
        Assert.Equal(7, result.PromptTokens);
        Assert.Equal(9, result.CompletionTokens);

        Assert.EndsWith(
            "v1beta/models/gemini-2.5-flash:generateContent",
            handler.Requests[0].RequestUri!.ToString(), StringComparison.Ordinal);

        var sent = handler.Sent();
        Assert.Equal("You name settings.",
            sent.GetProperty("systemInstruction").GetProperty("parts")[0].GetProperty("text").GetString());
    }

    [Fact]
    public async Task A_structured_request_asks_for_a_json_mime_type()
    {
        var (provider, handler) = Build();
        handler.RespondJson(Candidate("""{"text":"hello"}"""));

        await provider.CompleteAsync(Request(Schema), CancellationToken.None);

        Assert.Equal("application/json",
            handler.Sent().GetProperty("generationConfig").GetProperty("responseMimeType").GetString());
    }

    [Fact]
    public async Task A_blocked_prompt_is_a_refusal_rather_than_an_empty_answer()
    {
        // Gemini returns 200 with no candidates, which would otherwise read as success.
        var (provider, handler) = Build();
        handler.RespondJson("""{"promptFeedback":{"blockReason":"SAFETY"}}""");

        var error = await Assert.ThrowsAsync<AiProviderException>(() =>
            provider.CompleteAsync(Request(), CancellationToken.None));

        Assert.Equal("content-blocked", error.Code);
    }

    [Theory]
    [InlineData("SAFETY")]
    [InlineData("RECITATION")]
    [InlineData("PROHIBITED_CONTENT")]
    public async Task A_stopped_generation_is_a_refusal(string finishReason)
    {
        var (provider, handler) = Build();
        handler.RespondJson(Candidate("partial", finishReason));

        var error = await Assert.ThrowsAsync<AiProviderException>(() =>
            provider.CompleteAsync(Request(), CancellationToken.None));

        Assert.Equal("content-blocked", error.Code);
    }

    [Fact]
    public async Task Text_split_across_parts_is_joined()
    {
        var (provider, handler) = Build();

        handler.RespondJson(
            """
            { "candidates": [ { "content": { "parts": [ {"text":"the "}, {"text":"ring"} ] },
                                "finishReason": "STOP" } ] }
            """);

        var result = await provider.CompleteAsync(Request(), CancellationToken.None);

        Assert.Equal("the ring", result.Text);
    }

    [Fact]
    public async Task A_fully_qualified_model_name_is_accepted_without_doubling_the_prefix()
    {
        var (provider, handler) = Build(o => o.Model = "models/gemini-2.0-flash");
        handler.RespondJson(Candidate("ok"));

        await provider.CompleteAsync(Request(), CancellationToken.None);

        Assert.EndsWith(
            "v1beta/models/gemini-2.0-flash:generateContent",
            handler.Requests[0].RequestUri!.ToString(), StringComparison.Ordinal);
    }

    [Theory]
    [InlineData("../../v1beta/models/other")]
    [InlineData("gemini flash")]
    [InlineData("gemini/../../etc")]
    public async Task A_model_name_that_could_change_the_path_is_refused(string model)
    {
        // The model is operator input and goes into the request path.
        var (provider, handler) = Build(o => o.Model = model);

        var error = await Assert.ThrowsAsync<AiProviderException>(() =>
            provider.CompleteAsync(Request(), CancellationToken.None));

        Assert.Equal("model-invalid", error.Code);
        Assert.Empty(handler.Requests);
    }

    [Fact]
    public async Task Truncated_json_fails_rather_than_being_repaired()
    {
        var (provider, handler) = Build();
        handler.RespondJson(Candidate("""{"text":"ha""", "MAX_TOKENS"));

        var error = await Assert.ThrowsAsync<AiProviderException>(() =>
            provider.CompleteAsync(Request(Schema), CancellationToken.None));

        Assert.Equal("output-truncated", error.Code);
    }
}

public class AiJsonResponseTests
{
    [Theory]
    [InlineData("```json\n{\"a\":1}\n```", "{\"a\":1}")]
    [InlineData("```\n{\"a\":1}\n```", "{\"a\":1}")]
    [InlineData("  {\"a\":1}  ", "{\"a\":1}")]
    public void A_code_fence_is_unwrapped(string raw, string expected)
    {
        Assert.Equal(expected, AiJsonResponse.Unwrap(raw));
    }

    [Fact]
    public void Prose_around_the_json_is_not_unwrapped()
    {
        // Hunting for the first brace means guessing where the model stopped talking, and a
        // wrong guess produces a half-parsed object the caller believes.
        const string raw = "Here you go: {\"a\":1} - hope that helps!";

        Assert.Equal(raw, AiJsonResponse.Unwrap(raw));
        Assert.Throws<AiProviderException>(() =>
            AiJsonResponse.Require(raw, """{"type":"object"}"""));
    }

    [Fact]
    public void Require_returns_the_json_when_it_matches()
    {
        const string schema =
            """{ "type": "object", "required": ["a"], "properties": { "a": { "type": "integer" } } }""";

        Assert.Equal("{\"a\":1}", AiJsonResponse.Require("```json\n{\"a\":1}\n```", schema));
    }

    [Fact]
    public void Require_names_the_failing_paths_but_never_quotes_the_values()
    {
        const string schema =
            """{ "type": "object", "required": ["a"], "properties": { "a": { "type": "integer" } } }""";

        var error = Assert.Throws<AiProviderException>(() =>
            AiJsonResponse.Require("""{"a":"the transcript said hunter2"}""", schema));

        Assert.Equal("schema-mismatch", error.Code);
        Assert.DoesNotContain("hunter2", error.Message, StringComparison.Ordinal);
    }

    [Fact]
    public void An_empty_response_is_named_as_such()
    {
        Assert.Equal("empty-response",
            Assert.Throws<AiProviderException>(() =>
                AiJsonResponse.Require("   ", """{"type":"object"}""")).Code);
    }
}

public class AiHttpClientFactoryTests
{
    private static AiHttpClientFactory Build(string baseUrl, bool isLocal, params string[] allowlist)
    {
        var options = new AiOptions
        {
            HostAllowlist = [.. allowlist],
            Providers =
            {
                ["groq"] = new AiProviderOptions
                {
                    BaseUrl = baseUrl,
                    IsLocal = isLocal,
                    TimeoutSeconds = 30
                }
            }
        };

        return new AiHttpClientFactory(
            new StaticOptionsMonitor<AiOptions>(options),
            NullLogger<AiHttpClientFactory>.Instance,
            NullLoggerFactory.Instance);
    }

    [Theory]
    [InlineData("https://api.groq.com/openai/v1", "https://api.groq.com/openai/v1/")]
    [InlineData("https://api.groq.com/openai/v1/", "https://api.groq.com/openai/v1/")]
    public void A_base_url_always_ends_in_a_slash(string configured, string expected)
    {
        // Without the trailing slash, a relative "chat/completions" replaces the last
        // segment instead of extending it - a 404 that reads like a provider outage.
        using var factory = Build(configured, isLocal: false, "api.groq.com");

        var client = factory.Create(AiProviderId.Parse("groq"));

        Assert.Equal(expected, client.BaseAddress!.ToString());
        Assert.Equal(
            "https://api.groq.com/openai/v1/chat/completions",
            new Uri(client.BaseAddress, "chat/completions").ToString());
    }

    [Fact]
    public void The_same_provider_and_endpoint_reuse_one_client()
    {
        using var factory = Build("https://api.groq.com/openai/v1", isLocal: false, "api.groq.com");

        var first = factory.Create(AiProviderId.Parse("groq"));
        var second = factory.Create(AiProviderId.Parse("groq"));

        Assert.Same(first, second);
    }

    [Fact]
    public void A_host_that_is_not_on_the_allowlist_never_yields_a_client()
    {
        using var factory = Build("https://evil.example.com/v1", isLocal: false, "api.groq.com");

        var error = Assert.Throws<AiEndpointException>(() =>
            factory.Create(AiProviderId.Parse("groq")));

        Assert.Equal(EndpointRejection.HostNotAllowed, error.Rejection);
    }
}
