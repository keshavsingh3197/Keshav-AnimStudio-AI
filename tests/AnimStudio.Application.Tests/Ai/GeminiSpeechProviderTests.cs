using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Ai;
using AnimStudio.Application.Options;
using AnimStudio.Domain.Ai;
using AnimStudio.Infrastructure.Ai.Providers;
using Microsoft.Extensions.Logging.Abstractions;

namespace AnimStudio.Application.Tests.Ai;

public class GeminiSpeechProviderTests
{
    private const string BaseUrl = "https://generativelanguage.googleapis.com/v1beta/";

    private static (GeminiSpeechProvider Provider, StubHandler Handler) Build()
    {
        var options = new AiOptions
        {
            Providers =
            {
                ["gemini-tts"] = new AiProviderOptions
                {
                    Enabled = true, BaseUrl = BaseUrl, Model = "gemini-3.8-flash-tts"
                }
            }
        };

        var handler = new StubHandler();

        var provider = new GeminiSpeechProvider(
            AiProviderId.Parse("gemini-tts"),
            new StubHttpClientFactory(handler, BaseUrl),
            new StubSecretResolver(),
            new StaticOptionsMonitor<AiOptions>(options),
            NullLogger<GeminiSpeechProvider>.Instance);

        return (provider, handler);
    }

    private static string AudioResponse(byte[] pcm) =>
        $$"""
          { "candidates": [ { "content": { "parts": [ { "inlineData": {
              "mimeType": "audio/L16;codec=pcm;rate=24000",
              "data": "{{Convert.ToBase64String(pcm)}}" } } ] } } ] }
          """;

    [Fact]
    public async Task It_wraps_the_pcm_in_a_wav_whose_header_gives_the_duration()
    {
        var (provider, handler) = Build();
        // One second of 24 kHz mono 16-bit silence.
        handler.RespondJson(AudioResponse(new byte[48_000]));

        var result = await provider.SynthesizeAsync(
            new AiSpeechRequest { Text = "नमस्ते दुनिया", VoiceId = "kore" }, CancellationToken.None);

        Assert.Equal(AiAudioValidator.Wav, result.MimeType);
        Assert.Equal(1.0, result.DurationSeconds!.Value, 3);

        var request = handler.Requests[0];
        Assert.Equal(BaseUrl + "models/gemini-3.8-flash-tts:generateContent", request.RequestUri!.ToString());
        Assert.Equal("test-key-value", request.Headers.GetValues("x-goog-api-key").Single());
        Assert.Null(request.Headers.Authorization);

        var config = handler.Sent().GetProperty("generationConfig");
        Assert.Equal("AUDIO", config.GetProperty("responseModalities")[0].GetString());
        Assert.Equal("Kore", config.GetProperty("speechConfig").GetProperty("voiceConfig")
            .GetProperty("prebuiltVoiceConfig").GetProperty("voiceName").GetString());
    }

    [Fact]
    public async Task It_refuses_a_voice_gemini_does_not_have_without_sending_anything()
    {
        var (provider, handler) = Build();

        var ex = await Assert.ThrowsAsync<AiProviderException>(() => provider.SynthesizeAsync(
            new AiSpeechRequest { Text = "Hello", VoiceId = "alloy\"}" }, CancellationToken.None));

        Assert.Equal("voice-required", ex.Code);
        Assert.Empty(handler.Requests);
    }

    [Fact]
    public async Task A_response_with_no_audio_part_is_an_empty_response()
    {
        var (provider, handler) = Build();
        handler.RespondJson("""{ "candidates": [ { "finishReason": "SAFETY" } ] }""");

        var ex = await Assert.ThrowsAsync<AiProviderException>(() => provider.SynthesizeAsync(
            new AiSpeechRequest { Text = "Hello", VoiceId = "Puck" }, CancellationToken.None));

        Assert.Equal("empty-response", ex.Code);
    }

    [Fact]
    public async Task A_dialogue_is_sent_as_two_named_speakers_each_with_their_voice()
    {
        var (provider, handler) = Build();
        handler.RespondJson(AudioResponse(new byte[4_800]));

        await provider.SynthesizeAsync(new AiSpeechRequest
        {
            Text = "Narrator: He said,\nSpeaker2: Let us go.",
            VoiceId = "Charon",
            Speakers = [new AiSpeechSpeaker("Narrator", "Charon"), new AiSpeechSpeaker("Speaker2", "puck")]
        }, CancellationToken.None);

        var speech = handler.Sent().GetProperty("generationConfig").GetProperty("speechConfig");
        Assert.False(speech.TryGetProperty("voiceConfig", out _));
        var speakers = speech.GetProperty("multiSpeakerVoiceConfig").GetProperty("speakerVoiceConfigs");
        Assert.Equal(["Narrator", "Speaker2"], speakers.EnumerateArray().Select(s => s.GetProperty("speaker").GetString()));
        Assert.Equal(["Charon", "Puck"], speakers.EnumerateArray().Select(s =>
            s.GetProperty("voiceConfig").GetProperty("prebuiltVoiceConfig").GetProperty("voiceName").GetString()));

        // One part per turn, its speaker in the metadata, so no label is read aloud.
        var parts = handler.Sent().GetProperty("contents")[0].GetProperty("parts").EnumerateArray().ToList();
        Assert.Equal(["He said,", "Let us go."], parts.Select(p => p.GetProperty("text").GetString()));
        Assert.Equal(["Narrator", "Speaker2"], parts.Select(p => p.GetProperty("speechMetadata").GetProperty("speaker").GetString()));
    }

    [Fact]
    public async Task A_dialogue_line_without_one_of_its_speakers_is_refused()
    {
        var (provider, handler) = Build();

        var ex = await Assert.ThrowsAsync<AiProviderException>(() => provider.SynthesizeAsync(new AiSpeechRequest
        {
            Text = "Narrator: He said,\nSomeone: Let us go.",
            VoiceId = "Charon",
            Speakers = [new AiSpeechSpeaker("Narrator", "Charon"), new AiSpeechSpeaker("Speaker2", "Puck")]
        }, CancellationToken.None));

        Assert.Equal("speakers-invalid", ex.Code);
        Assert.Empty(handler.Requests);
    }

    [Theory]
    [InlineData("Narrator", "Narrator")]
    [InlineData("Narrator", "राम")]
    [InlineData("Narrator", null)]
    public async Task Speakers_gemini_cannot_take_are_refused_without_sending_anything(string first, string? second)
    {
        var (provider, handler) = Build();
        List<AiSpeechSpeaker> speakers = [new(first, "Charon")];
        if (second is not null) speakers.Add(new(second, "Puck"));

        var ex = await Assert.ThrowsAsync<AiProviderException>(() => provider.SynthesizeAsync(
            new AiSpeechRequest { Text = "x", VoiceId = "Charon", Speakers = speakers }, CancellationToken.None));

        Assert.Equal("speakers-invalid", ex.Code);
        Assert.Empty(handler.Requests);
    }

    [Fact]
    public async Task It_lists_the_prebuilt_voices()
    {
        var (provider, _) = Build();

        var voices = await provider.ListVoicesAsync(CancellationToken.None);

        Assert.Equal(30, voices.Count);
        Assert.Contains(voices, v => v.VoiceId == "Kore" && v.DisplayName == "Kore - Firm");
    }

    private const string Catalog =
        """
        { "voices": [
            { "type": "prompted", "id": "voice_abc123", "display_name": "Warm Narrator",
              "description": "A calm storyteller", "gender": "male" },
            { "type": "replicated", "id": "voice_someone", "display_name": "Someone's voice" },
            { "type": "prebuilt", "id": "Puck", "display_name": "Puck" },
            { "type": "prebuilt", "id": "Ananya", "display_name": "Ananya", "language_code": "hi-IN",
              "gender": "female" },
            { "type": "prebuilt", "id": "bad id\"}", "display_name": "Broken" }
          ] }
        """;

    [Fact]
    public async Task It_offers_designed_and_library_voices_but_never_a_replicated_one()
    {
        var (provider, handler) = Build();
        handler.RespondJson(Catalog);

        var voices = await provider.ListVoicesAsync(CancellationToken.None);

        Assert.Equal("voice_abc123", voices[0].VoiceId);
        Assert.Equal("Warm Narrator - A calm storyteller", voices[0].DisplayName);
        Assert.Contains(voices, v => v.VoiceId == "Ananya" && v.LanguageCode == "hi-IN" && v.Gender == "female");
        Assert.DoesNotContain(voices, v => v.VoiceId == "voice_someone");
        Assert.DoesNotContain(voices, v => v.DisplayName == "Broken");
        Assert.Single(voices, v => v.VoiceId == "Puck");
        Assert.Equal(32, voices.Count);
        Assert.StartsWith(BaseUrl + "voices?", handler.Requests[0].RequestUri!.ToString());
    }

    [Fact]
    public async Task A_designed_voice_is_sent_by_id_and_a_replicated_one_is_refused()
    {
        var (provider, handler) = Build();
        handler.RespondJson(Catalog);
        handler.RespondJson(AudioResponse(new byte[4_800]));

        await provider.SynthesizeAsync(
            new AiSpeechRequest { Text = "Hello", VoiceId = "voice_abc123" }, CancellationToken.None);

        var config = handler.Sent(1).GetProperty("generationConfig").GetProperty("speechConfig").GetProperty("voiceConfig");
        Assert.Equal("voice_abc123", config.GetProperty("voice").GetString());
        Assert.False(config.TryGetProperty("prebuiltVoiceConfig", out _));

        var ex = await Assert.ThrowsAsync<AiProviderException>(() => provider.SynthesizeAsync(
            new AiSpeechRequest { Text = "Hello", VoiceId = "voice_someone" }, CancellationToken.None));

        Assert.Equal("voice-required", ex.Code);
        // The catalogue was read a moment ago, so an unknown id does not read it again.
        Assert.Equal(2, handler.Requests.Count);
    }

    [Fact]
    public async Task An_unreadable_catalogue_falls_back_to_the_classic_voices()
    {
        var (provider, handler) = Build();
        handler.Respond(System.Net.HttpStatusCode.Forbidden, """{ "error": { "status": "PERMISSION_DENIED" } }""");

        var voices = await provider.ListVoicesAsync(CancellationToken.None);
        await provider.ListVoicesAsync(CancellationToken.None);

        Assert.Equal(30, voices.Count);
        // A failed read waits before trying again.
        Assert.Single(handler.Requests);
    }

    [Fact]
    public async Task The_style_and_pace_go_in_the_speech_metadata_and_the_chosen_model_in_the_path()
    {
        var (provider, handler) = Build();
        handler.RespondJson(AudioResponse(new byte[4_800]));

        await provider.SynthesizeAsync(new AiSpeechRequest
        {
            Text = "Once upon a time", VoiceId = "Sulafat", Rate = 1.2,
            Style = "warm and\nunhurried", Model = "gemini-3.8-flash-lite-tts"
        }, CancellationToken.None);

        Assert.Equal(BaseUrl + "models/gemini-3.8-flash-lite-tts:generateContent",
            handler.Requests[0].RequestUri!.ToString());
        var part = handler.Sent().GetProperty("contents")[0].GetProperty("parts")[0];
        Assert.Equal("warm and unhurried; speak faster than normal, at about 1.2x pace",
            part.GetProperty("speechMetadata").GetProperty("style").GetString());
    }

    [Fact]
    public async Task A_line_with_no_style_at_normal_pace_sends_no_speech_metadata()
    {
        var (provider, handler) = Build();
        handler.RespondJson(AudioResponse(new byte[4_800]));

        await provider.SynthesizeAsync(new AiSpeechRequest { Text = "Hi", VoiceId = "Kore", Rate = 1.0 }, CancellationToken.None);

        var part = handler.Sent().GetProperty("contents")[0].GetProperty("parts")[0];
        Assert.False(part.TryGetProperty("speechMetadata", out _));
    }

    [Fact]
    public async Task A_long_style_is_cut_to_the_limit()
    {
        var (provider, handler) = Build();
        handler.RespondJson(AudioResponse(new byte[4_800]));

        await provider.SynthesizeAsync(
            new AiSpeechRequest { Text = "Hi", VoiceId = "Kore", Style = new string('a', 1000) }, CancellationToken.None);

        var style = handler.Sent().GetProperty("contents")[0].GetProperty("parts")[0]
            .GetProperty("speechMetadata").GetProperty("style").GetString();
        Assert.Equal(300, style!.Length);
    }

    private static byte[] Wav(int samples = 4_800)
    {
        var pcm = samples * 2;
        var wav = new byte[44 + pcm];
        var span = wav.AsSpan();
        "RIFF"u8.CopyTo(span);
        System.Buffers.Binary.BinaryPrimitives.WriteInt32LittleEndian(span[4..], 36 + pcm);
        "WAVEfmt "u8.CopyTo(span[8..]);
        System.Buffers.Binary.BinaryPrimitives.WriteInt32LittleEndian(span[16..], 16);
        System.Buffers.Binary.BinaryPrimitives.WriteInt16LittleEndian(span[20..], 1);
        System.Buffers.Binary.BinaryPrimitives.WriteInt16LittleEndian(span[22..], 1);
        System.Buffers.Binary.BinaryPrimitives.WriteInt32LittleEndian(span[24..], 24_000);
        System.Buffers.Binary.BinaryPrimitives.WriteInt32LittleEndian(span[28..], 48_000);
        System.Buffers.Binary.BinaryPrimitives.WriteInt16LittleEndian(span[32..], 2);
        System.Buffers.Binary.BinaryPrimitives.WriteInt16LittleEndian(span[34..], 16);
        "data"u8.CopyTo(span[36..]);
        System.Buffers.Binary.BinaryPrimitives.WriteInt32LittleEndian(span[40..], pcm);
        return wav;
    }

    [Fact]
    public async Task Replicating_a_voice_posts_the_sample_and_the_consent_and_returns_the_id()
    {
        var (provider, handler) = Build();
        handler.RespondJson("""{ "id": "voice_r3pl1ca", "type": "replicated" }""");

        var id = await provider.ReplicateVoiceAsync(Wav(), Wav(100), "My voice\n(Hindi)", CancellationToken.None);

        Assert.Equal("voice_r3pl1ca", id);
        var request = handler.Requests[0];
        Assert.Equal(HttpMethod.Post, request.Method);
        Assert.Equal(BaseUrl + "voices", request.RequestUri!.ToString());

        var sent = handler.Sent();
        Assert.True(sent.GetProperty("store").GetBoolean());
        var voice = sent.GetProperty("voice");
        Assert.Equal("replicated", voice.GetProperty("type").GetString());
        Assert.Equal("gemini-3.8-flash-tts", voice.GetProperty("model").GetString());
        Assert.Equal("My voice(Hindi)", voice.GetProperty("display_name").GetString());
        var replicated = voice.GetProperty("replicated");
        Assert.Equal(Convert.ToBase64String(Wav()), replicated.GetProperty("source_audio").GetProperty("data").GetString());
        Assert.Equal("audio/wav", replicated.GetProperty("consent_audio").GetProperty("mime_type").GetString());
    }

    [Fact]
    public async Task A_replication_answer_without_a_voice_id_is_malformed()
    {
        var (provider, handler) = Build();
        handler.RespondJson("""{ "id": "../../evil" }""");

        var ex = await Assert.ThrowsAsync<AiProviderException>(() =>
            provider.ReplicateVoiceAsync(Wav(), Wav(), "Mine", CancellationToken.None));

        Assert.Equal("malformed-response", ex.Code);
    }

    [Fact]
    public async Task A_refused_consent_is_a_bad_request()
    {
        var (provider, handler) = Build();
        handler.Respond(System.Net.HttpStatusCode.BadRequest, """{ "error": { "status": "INVALID_ARGUMENT" } }""");

        var ex = await Assert.ThrowsAsync<AiProviderException>(() =>
            provider.ReplicateVoiceAsync(Wav(), Wav(), "Mine", CancellationToken.None));

        Assert.Equal("bad-request", ex.Code);
    }

    [Fact]
    public async Task A_server_error_while_replicating_is_tried_once_more()
    {
        var (provider, handler) = Build();
        handler.Respond(System.Net.HttpStatusCode.InternalServerError, """{ "error": { "code": 500, "status": "INTERNAL" } }""")
            .RespondJson("""{ "id": "voice_r3pl1ca" }""");

        var id = await provider.ReplicateVoiceAsync(Wav(), Wav(), "Mine", CancellationToken.None);

        Assert.Equal("voice_r3pl1ca", id);
        Assert.Equal(2, handler.Requests.Count);
    }

    [Fact]
    public async Task A_second_server_error_while_replicating_is_reported()
    {
        var (provider, handler) = Build();
        handler.Respond(System.Net.HttpStatusCode.InternalServerError, """{ "error": { "code": 500, "status": "INTERNAL" } }""")
            .Respond(System.Net.HttpStatusCode.InternalServerError, """{ "error": { "code": 500, "status": "INTERNAL" } }""");

        var ex = await Assert.ThrowsAsync<AiProviderException>(() =>
            provider.ReplicateVoiceAsync(Wav(), Wav(), "Mine", CancellationToken.None));

        Assert.Equal("provider-error", ex.Code);
        Assert.Equal(2, handler.Requests.Count);
    }

    [Fact]
    public async Task A_replicated_voice_set_by_the_server_is_spoken_without_reading_the_catalogue()
    {
        var (provider, handler) = Build();
        handler.RespondJson(AudioResponse(new byte[4_800]));

        await provider.SynthesizeAsync(new AiSpeechRequest
        {
            Text = "नमस्ते", VoiceId = "hm_omega", ReplicatedVoiceId = "voice_r3pl1ca", Style = "warm"
        }, CancellationToken.None);

        Assert.Single(handler.Requests);
        var config = handler.Sent().GetProperty("generationConfig").GetProperty("speechConfig").GetProperty("voiceConfig");
        Assert.Equal("voice_r3pl1ca", config.GetProperty("voice").GetString());
    }

    [Fact]
    public async Task A_replicated_voice_id_that_does_not_look_like_one_is_refused_without_sending_anything()
    {
        var (provider, handler) = Build();

        var ex = await Assert.ThrowsAsync<AiProviderException>(() => provider.SynthesizeAsync(
            new AiSpeechRequest { Text = "Hi", VoiceId = "Kore", ReplicatedVoiceId = "voice_\"}" }, CancellationToken.None));

        Assert.Equal("voice-required", ex.Code);
        Assert.Empty(handler.Requests);
    }

    [Fact]
    public async Task Deleting_a_replicated_voice_that_is_already_gone_is_not_an_error()
    {
        var (provider, handler) = Build();
        handler.Respond(System.Net.HttpStatusCode.NotFound, """{ "error": { "status": "NOT_FOUND" } }""");

        await provider.DeleteReplicatedVoiceAsync("voice_r3pl1ca", CancellationToken.None);

        Assert.Equal(HttpMethod.Delete, handler.Requests[0].Method);
        Assert.Equal(BaseUrl + "voices/voice_r3pl1ca", handler.Requests[0].RequestUri!.ToString());
        await Assert.ThrowsAsync<ArgumentException>(() => provider.DeleteReplicatedVoiceAsync("../x", CancellationToken.None));
    }
}
