using System.Buffers.Binary;
using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Ai;
using AnimStudio.Application.Options;
using AnimStudio.Domain.Ai;
using AnimStudio.Infrastructure.Ai.Providers;
using Microsoft.Extensions.Logging.Abstractions;

namespace AnimStudio.Application.Tests.Ai;

public class GeminiTtsProviderTests
{
    private const string BaseUrl = "https://generativelanguage.googleapis.com/";

    private static (GeminiTtsProvider Provider, StubHandler Handler) Build(
        Action<AiProviderOptions>? configure = null)
    {
        var providerOptions = new AiProviderOptions
        {
            Enabled = true,
            BaseUrl = BaseUrl,
            Model = "gemini-2.5-flash-preview-tts"
        };

        configure?.Invoke(providerOptions);

        var options = new AiOptions { Providers = { ["gemini-tts"] = providerOptions } };
        var handler = new StubHandler();

        return (new GeminiTtsProvider(
            AiProviderId.Parse("gemini-tts"),
            new StubHttpClientFactory(handler, BaseUrl),
            new StubSecretResolver("gemini-key-value"),
            new StaticOptionsMonitor<AiOptions>(options),
            NullLogger<GeminiTtsProvider>.Instance), handler);
    }

    private static AiSpeechRequest Request(string text = "Namaste, aaj ka match shuru hota hai.", double rate = 1.0) => new()
    {
        Text = text,
        VoiceId = "Kore",
        Rate = rate
    };

    /// <summary>What the API answers: base64 PCM inside a candidate's inline data.</summary>
    private static string AudioCandidate(byte[] audio, string mimeType = "audio/L16;codec=pcm;rate=24000") =>
        $$"""
          { "candidates": [ { "content": { "parts": [ { "inlineData": {
              "mimeType": "{{mimeType}}", "data": "{{Convert.ToBase64String(audio)}}" } } ] },
              "finishReason": "STOP" } ] }
          """;

    [Fact]
    public async Task Raw_pcm_comes_back_as_a_wav_whose_header_gives_the_duration()
    {
        var (provider, handler) = Build();
        handler.RespondJson(AudioCandidate(new byte[24_000 * 2 * 3 / 2])); // 1.5 s at 24 kHz

        var result = await provider.SynthesizeAsync(Request(), CancellationToken.None);

        Assert.Equal("audio/wav", result.MimeType);
        Assert.Equal(1.5, result.DurationSeconds!.Value, precision: 3);
        Assert.Equal(24_000u, BinaryPrimitives.ReadUInt32LittleEndian(result.Content.AsSpan(24)));
    }

    [Fact]
    public async Task The_sample_rate_is_read_from_the_declared_type()
    {
        var (provider, handler) = Build();
        handler.RespondJson(AudioCandidate(new byte[16_000 * 2], "audio/L16;codec=pcm;rate=16000"));

        var result = await provider.SynthesizeAsync(Request(), CancellationToken.None);

        Assert.Equal(1.0, result.DurationSeconds!.Value, precision: 3);
    }

    [Fact]
    public async Task Pcm_that_opens_on_minus_one_is_not_mistaken_for_an_mp3()
    {
        // FF FF is a valid 16-bit sample and also an MP3 frame sync.
        var pcm = new byte[4_800];
        pcm[0] = 0xFF;
        pcm[1] = 0xFF;
        var (provider, handler) = Build();
        handler.RespondJson(AudioCandidate(pcm));

        var result = await provider.SynthesizeAsync(Request(), CancellationToken.None);

        Assert.Equal("audio/wav", result.MimeType);
    }

    [Fact]
    public async Task It_asks_for_audio_in_the_chosen_voice_with_the_model_in_the_path()
    {
        var (provider, handler) = Build();
        handler.RespondJson(AudioCandidate(new byte[4_800]));

        await provider.SynthesizeAsync(Request() with { VoiceId = "kore" }, CancellationToken.None);

        Assert.Contains("v1beta/models/gemini-2.5-flash-preview-tts:generateContent",
            handler.Requests[0].RequestUri!.ToString(), StringComparison.Ordinal);

        var sent = handler.Sent();
        var config = sent.GetProperty("generationConfig");
        Assert.Equal("AUDIO", config.GetProperty("responseModalities")[0].GetString());
        Assert.Equal("Kore", config.GetProperty("speechConfig").GetProperty("voiceConfig")
            .GetProperty("prebuiltVoiceConfig").GetProperty("voiceName").GetString());
        Assert.Equal("Namaste, aaj ka match shuru hota hai.",
            sent.GetProperty("contents")[0].GetProperty("parts")[0].GetProperty("text").GetString());
    }

    [Theory]
    [InlineData(0.6, "Say slowly and clearly: ")]
    [InlineData(1.5, "Say quickly: ")]
    [InlineData(1.02, "")]
    public async Task A_rate_is_asked_for_in_words_because_there_is_no_speed_field(double rate, string direction)
    {
        var (provider, handler) = Build();
        handler.RespondJson(AudioCandidate(new byte[4_800]));

        await provider.SynthesizeAsync(Request("Go!", rate), CancellationToken.None);

        Assert.Equal(direction + "Go!",
            handler.Sent().GetProperty("contents")[0].GetProperty("parts")[0].GetProperty("text").GetString());
    }

    [Fact]
    public async Task The_key_travels_in_a_header_never_in_the_url()
    {
        var (provider, handler) = Build();
        handler.RespondJson(AudioCandidate(new byte[4_800]));

        await provider.SynthesizeAsync(Request(), CancellationToken.None);

        var request = handler.Requests[0];
        Assert.Equal("gemini-key-value", request.Headers.GetValues("x-goog-api-key").Single());
        Assert.DoesNotContain("key=", request.RequestUri!.Query, StringComparison.Ordinal);
    }

    [Fact]
    public async Task A_voice_gemini_does_not_have_is_refused_before_the_network()
    {
        var (provider, handler) = Build();

        var ex = await Assert.ThrowsAsync<AiProviderException>(() =>
            provider.SynthesizeAsync(Request() with { VoiceId = "af_bella" }, CancellationToken.None));

        Assert.Equal("voice-required", ex.Code);
        Assert.Empty(handler.Requests);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public async Task Nothing_to_say_is_refused_before_the_network(string text)
    {
        var (provider, handler) = Build();

        var ex = await Assert.ThrowsAsync<AiProviderException>(() =>
            provider.SynthesizeAsync(Request(text), CancellationToken.None));

        Assert.Equal("text-required", ex.Code);
        Assert.Empty(handler.Requests);
    }

    [Fact]
    public async Task A_text_model_answering_in_words_is_named_as_the_mistake()
    {
        var (provider, handler) = Build();
        handler.RespondJson("""{ "candidates": [ { "content": { "parts": [ { "text": "Hello" } ] } } ] }""");

        var ex = await Assert.ThrowsAsync<AiProviderException>(() =>
            provider.SynthesizeAsync(Request(), CancellationToken.None));

        Assert.Equal("empty-response", ex.Code);
    }

    [Fact]
    public async Task A_blocked_line_is_a_refusal_not_silence()
    {
        var (provider, handler) = Build();
        handler.RespondJson("""{ "promptFeedback": { "blockReason": "SAFETY" } }""");

        var ex = await Assert.ThrowsAsync<AiProviderException>(() =>
            provider.SynthesizeAsync(Request(), CancellationToken.None));

        Assert.Equal("content-blocked", ex.Code);
    }

    [Fact]
    public async Task A_model_name_that_could_change_the_path_is_refused()
    {
        var (provider, _) = Build(o => o.Model = "../../v1/other");

        var ex = await Assert.ThrowsAsync<AiProviderException>(() =>
            provider.SynthesizeAsync(Request(), CancellationToken.None));

        Assert.Equal("model-invalid", ex.Code);
    }

    [Fact]
    public async Task It_offers_its_stock_voices_without_a_call()
    {
        var (provider, handler) = Build();

        var voices = await provider.ListVoicesAsync(CancellationToken.None);

        Assert.Equal(30, voices.Count);
        Assert.Contains(voices, v => v.VoiceId == "Kore" && v.DisplayName == "Kore (Firm)");
        Assert.All(voices, v => Assert.Equal("mul", v.LanguageCode));
        Assert.Empty(handler.Requests);
    }

    [Fact]
    public void It_is_never_configured_as_a_local_engine()
    {
        var (provider, _) = Build(o => o.IsLocal = true);

        Assert.False(provider.IsConfigured);
    }
}
