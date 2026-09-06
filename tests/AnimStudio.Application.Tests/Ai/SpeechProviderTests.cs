using System.Buffers.Binary;
using System.Text;
using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Ai;
using AnimStudio.Application.Options;
using AnimStudio.Domain.Ai;
using AnimStudio.Infrastructure.Ai.Providers;
using Microsoft.Extensions.Logging.Abstractions;

namespace AnimStudio.Application.Tests.Ai;

internal static class AudioBytes
{
    public const int SampleRate = 22_050;
    public const int ByteRate = SampleRate * 2;

    /// <summary>A canonical 16-bit mono WAV carrying <paramref name="seconds"/> of silence.</summary>
    public static byte[] Wav(double seconds = 1.0)
    {
        var dataSize = (int)(ByteRate * seconds);
        var bytes = new byte[44 + dataSize];
        var span = bytes.AsSpan();

        "RIFF"u8.CopyTo(span);
        BinaryPrimitives.WriteUInt32LittleEndian(span[4..], (uint)(36 + dataSize));
        "WAVE"u8.CopyTo(span[8..]);

        "fmt "u8.CopyTo(span[12..]);
        BinaryPrimitives.WriteUInt32LittleEndian(span[16..], 16);
        BinaryPrimitives.WriteUInt16LittleEndian(span[20..], 1);
        BinaryPrimitives.WriteUInt16LittleEndian(span[22..], 1);
        BinaryPrimitives.WriteUInt32LittleEndian(span[24..], SampleRate);
        BinaryPrimitives.WriteUInt32LittleEndian(span[28..], ByteRate);
        BinaryPrimitives.WriteUInt16LittleEndian(span[32..], 2);
        BinaryPrimitives.WriteUInt16LittleEndian(span[34..], 16);

        "data"u8.CopyTo(span[36..]);
        BinaryPrimitives.WriteUInt32LittleEndian(span[40..], (uint)dataSize);

        return bytes;
    }

    public static byte[] Mp3()
    {
        var bytes = new byte[400];
        "ID3"u8.CopyTo(bytes);
        return bytes;
    }

    /// <summary>What a failing speech endpoint returns while claiming to be audio.</summary>
    public static byte[] JsonErrorBody() =>
        Encoding.UTF8.GetBytes(@"{""error"":""model not loaded"",""detail"":""" + new string('x', 300) + @"""}");
}

public class AiAudioValidatorTests
{
    [Fact]
    public void It_recognises_the_formats_a_speech_provider_returns()
    {
        Assert.Equal("audio/wav", AiAudioValidator.Sniff(AudioBytes.Wav()));
        Assert.Equal("audio/mpeg", AiAudioValidator.Sniff(AudioBytes.Mp3()));
    }

    [Fact]
    public void A_json_error_body_is_not_audio()
    {
        // Written into a scene's audio track it would fail much later and much less legibly.
        Assert.Null(AiAudioValidator.Sniff(AudioBytes.JsonErrorBody()));

        Assert.Equal("not-audio",
            Assert.Throws<AiProviderException>(() =>
                AiAudioValidator.Require(AudioBytes.JsonErrorBody(), "kokoro")).Code);
    }

    [Theory]
    [InlineData(0.5)]
    [InlineData(1.0)]
    [InlineData(2.75)]
    public void A_wav_reports_its_length_from_its_header(double seconds)
    {
        // Scene timing depends on this, and for WAV it is a header read rather than a decode.
        var duration = AiAudioValidator.TryGetWavDuration(AudioBytes.Wav(seconds));

        Assert.NotNull(duration);
        Assert.Equal(seconds, duration!.Value, precision: 3);
    }

    [Fact]
    public void A_truncated_wav_reports_what_is_actually_there()
    {
        // The header still claims the full length; measuring that would mis-time the scene.
        var full = AudioBytes.Wav(2.0);
        var truncated = full[..(44 + AudioBytes.ByteRate)];

        Assert.Equal(1.0, AiAudioValidator.TryGetWavDuration(truncated)!.Value, precision: 3);
    }

    [Fact]
    public void A_compressed_format_reports_no_duration_rather_than_a_guess()
    {
        // A VBR MP3 has no honest answer from its header, and a confident wrong duration
        // would mis-time every scene it touched.
        Assert.Null(AiAudioValidator.TryGetDuration(AudioBytes.Mp3(), "audio/mpeg"));
    }

    [Fact]
    public void A_wav_with_extra_chunks_before_the_data_is_still_measured()
    {
        // Real encoders write LIST and fact chunks; skipping them is what the walk is for.
        var original = AudioBytes.Wav(1.0);
        var extra = new byte[12];
        "LIST"u8.CopyTo(extra);
        BinaryPrimitives.WriteUInt32LittleEndian(extra.AsSpan(4), 4);

        var withChunk = new byte[original.Length + extra.Length];
        original.AsSpan(0, 36).CopyTo(withChunk);
        extra.CopyTo(withChunk.AsSpan(36));
        original.AsSpan(36).CopyTo(withChunk.AsSpan(36 + extra.Length));

        Assert.Equal(1.0, AiAudioValidator.TryGetWavDuration(withChunk)!.Value, precision: 3);
    }

    [Fact]
    public void A_zero_length_chunk_does_not_spin_forever()
    {
        var bytes = new byte[64];
        "RIFF"u8.CopyTo(bytes);
        "WAVE"u8.CopyTo(bytes.AsSpan(8));
        "junk"u8.CopyTo(bytes.AsSpan(12));

        Assert.Null(AiAudioValidator.TryGetWavDuration(bytes));
    }
}

public class OpenAiCompatibleTtsProviderTests
{
    private const string BaseUrl = "http://localhost:8880/v1/";

    private static (OpenAiCompatibleTtsProvider Provider, StubHandler Handler) Build(
        string? model = "kokoro", bool isLocal = true)
    {
        var options = new AiOptions
        {
            Providers =
            {
                ["kokoro"] = new AiProviderOptions
                {
                    BaseUrl = BaseUrl, Model = model, IsLocal = isLocal
                }
            }
        };

        var handler = new StubHandler();

        return (new OpenAiCompatibleTtsProvider(
            AiProviderId.Parse("kokoro"),
            new StubHttpClientFactory(handler, BaseUrl),
            new StubSecretResolver(isLocal ? null : "tts-key-value"),
            new StaticOptionsMonitor<AiOptions>(options),
            NullLogger<OpenAiCompatibleTtsProvider>.Instance), handler);
    }

    private static AiSpeechRequest Request(string text = "And the crowd goes wild.") => new()
    {
        Text = text,
        VoiceId = "af_bella",
        Rate = 1.0
    };

    [Fact]
    public async Task It_asks_for_wav_so_the_duration_is_known_without_a_second_pass()
    {
        var (provider, handler) = Build();
        handler.RespondBytes(AudioBytes.Wav(1.5), "audio/wav");

        var result = await provider.SynthesizeAsync(Request(), CancellationToken.None);

        Assert.Equal("audio/wav", result.MimeType);
        Assert.Equal(1.5, result.DurationSeconds!.Value, precision: 3);

        var sent = handler.Sent();
        Assert.Equal("wav", sent.GetProperty("response_format").GetString());
        Assert.Equal("af_bella", sent.GetProperty("voice").GetString());
        Assert.Equal("And the crowd goes wild.", sent.GetProperty("input").GetString());
    }

    [Fact]
    public async Task A_rate_is_sent_as_speed_and_clamped()
    {
        var (provider, handler) = Build();
        handler.RespondBytes(AudioBytes.Wav(), "audio/wav");

        await provider.SynthesizeAsync(Request() with { Rate = 99 }, CancellationToken.None);

        Assert.Equal(4.0, handler.Sent().GetProperty("speed").GetDouble());
    }

    [Fact]
    public async Task An_error_body_returned_as_audio_is_a_failure()
    {
        var (provider, handler) = Build();
        handler.RespondBytes(AudioBytes.JsonErrorBody(), "audio/wav");

        var error = await Assert.ThrowsAsync<AiProviderException>(() =>
            provider.SynthesizeAsync(Request(), CancellationToken.None));

        Assert.Equal("not-audio", error.Code);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public async Task Nothing_to_say_is_refused_before_the_network(string text)
    {
        var (provider, handler) = Build();

        var error = await Assert.ThrowsAsync<AiProviderException>(() =>
            provider.SynthesizeAsync(Request(text), CancellationToken.None));

        Assert.Equal("text-required", error.Code);
        Assert.Empty(handler.Requests);
    }

    [Fact]
    public async Task An_over_long_line_is_refused_with_a_reason()
    {
        var (provider, _) = Build();

        var error = await Assert.ThrowsAsync<AiProviderException>(() =>
            provider.SynthesizeAsync(Request(new string('a', 20_000)), CancellationToken.None));

        Assert.Equal("text-too-long", error.Code);
    }

    [Fact]
    public async Task A_missing_voice_is_refused()
    {
        var (provider, _) = Build();

        var error = await Assert.ThrowsAsync<AiProviderException>(() =>
            provider.SynthesizeAsync(Request() with { VoiceId = " " }, CancellationToken.None));

        Assert.Equal("voice-required", error.Code);
    }

    [Theory]
    [InlineData(@"{""voices"":[""af_bella"",""am_adam""]}")]
    [InlineData(@"[""af_bella"",""am_adam""]")]
    [InlineData(@"{""data"":[{""id"":""af_bella""},{""id"":""am_adam""}]}")]
    public async Task It_reads_a_voice_list_in_any_of_the_shapes_services_use(string body)
    {
        var (provider, handler) = Build();
        handler.RespondJson(body);

        var voices = await provider.ListVoicesAsync(CancellationToken.None);

        Assert.Equal(["af_bella", "am_adam"], voices.Select(v => v.VoiceId));
    }

    [Fact]
    public async Task A_service_with_no_voice_route_still_offers_a_picker()
    {
        // OpenAI itself has no voice-listing endpoint, so this is the normal case rather
        // than a fault.
        var (provider, handler) = Build();
        handler.Respond(System.Net.HttpStatusCode.NotFound, "{}");

        var voices = await provider.ListVoicesAsync(CancellationToken.None);

        Assert.NotEmpty(voices);
        Assert.Contains(voices, v => v.VoiceId == "alloy");
    }

    [Fact]
    public async Task A_voice_name_that_is_not_a_name_is_dropped_from_the_list()
    {
        // A voice id travels straight back into a request body.
        var (provider, handler) = Build();
        handler.RespondJson(@"{""voices"":[""af_bella"",""" + new string('x', 200) + @""",""ok_name""]}");

        var voices = await provider.ListVoicesAsync(CancellationToken.None);

        Assert.Equal(["af_bella", "ok_name"], voices.Select(v => v.VoiceId));
    }

    [Fact]
    public async Task A_local_endpoint_is_sent_no_credential()
    {
        var (provider, handler) = Build();
        handler.RespondBytes(AudioBytes.Wav(), "audio/wav");

        await provider.SynthesizeAsync(Request(), CancellationToken.None);

        Assert.Null(handler.Requests[0].Headers.Authorization);
    }

    [Fact]
    public async Task A_hosted_endpoint_is_sent_a_bearer_token()
    {
        var (provider, handler) = Build(isLocal: false);
        handler.RespondBytes(AudioBytes.Wav(), "audio/wav");

        await provider.SynthesizeAsync(Request(), CancellationToken.None);

        Assert.Equal("tts-key-value", handler.Requests[0].Headers.Authorization!.Parameter);
    }
}

public class PiperLocalSpeechProviderTests : IDisposable
{
    private readonly string _voicesDirectory =
        Path.Combine(Path.GetTempPath(), $"piper-voices-{Guid.NewGuid():N}");

    public PiperLocalSpeechProviderTests() => Directory.CreateDirectory(_voicesDirectory);

    public void Dispose()
    {
        try
        {
            Directory.Delete(_voicesDirectory, recursive: true);
        }
        catch (IOException)
        {
            // A leaked scratch directory is not worth failing a test run over.
        }

        GC.SuppressFinalize(this);
    }

    private void AddVoice(string name) =>
        File.WriteAllBytes(Path.Combine(_voicesDirectory, name + ".onnx"), new byte[16]);

    private PiperLocalSpeechProvider Build(
        string executable = "piper", string? voicesDirectory = null)
    {
        var options = new AiOptions
        {
            Providers =
            {
                ["piper-local"] = new AiProviderOptions
                {
                    Enabled = true,
                    ExecutablePath = executable,
                    VoicesPath = voicesDirectory ?? _voicesDirectory,
                    IsLocal = true,
                    TimeoutSeconds = 30
                }
            }
        };

        return new PiperLocalSpeechProvider(
            AiProviderId.Parse("piper-local"),
            new StaticOptionsMonitor<AiOptions>(options),
            NullLogger<PiperLocalSpeechProvider>.Instance);
    }

    private static AiSpeechRequest Request(string voiceId = "en_GB-alba-medium") => new()
    {
        Text = "And the crowd goes wild.",
        VoiceId = voiceId,
        Rate = 1.0
    };

    [Fact]
    public void It_needs_both_a_program_and_somewhere_to_find_voices()
    {
        Assert.True(Build().IsConfigured);
        Assert.False(Build(voicesDirectory: " ").IsConfigured);
    }

    [Fact]
    public async Task It_lists_the_voices_that_are_installed()
    {
        AddVoice("en_GB-alba-medium");
        AddVoice("hi_IN-pratham-medium");

        var voices = await Build().ListVoicesAsync(CancellationToken.None);

        Assert.Equal(["en_GB-alba-medium", "hi_IN-pratham-medium"], voices.Select(v => v.VoiceId));
        Assert.Equal("en-GB", voices[0].LanguageCode);
        Assert.Contains("alba", voices[0].DisplayName, StringComparison.Ordinal);
    }

    [Fact]
    public async Task A_missing_voices_directory_means_no_voices_rather_than_a_failure()
    {
        var missing = Path.Combine(Path.GetTempPath(), "nope-" + Guid.NewGuid().ToString("N"));

        Assert.Empty(await Build(voicesDirectory: missing).ListVoicesAsync(CancellationToken.None));
    }

    [Theory]
    [InlineData("../../../etc/passwd")]
    [InlineData("..")]
    [InlineData("sub/voice")]
    [InlineData("sub\\voice")]
    public async Task A_voice_id_that_could_escape_the_directory_is_refused(string voiceId)
    {
        // The id becomes a filesystem path, so it is checked before anything is launched.
        var error = await Assert.ThrowsAsync<AiProviderException>(() =>
            Build().SynthesizeAsync(Request(voiceId), CancellationToken.None));

        Assert.Equal("voice-invalid", error.Code);
    }

    [Fact]
    public async Task A_voice_that_is_not_installed_is_named_as_missing()
    {
        var error = await Assert.ThrowsAsync<AiProviderException>(() =>
            Build().SynthesizeAsync(Request("en_US-nobody-low"), CancellationToken.None));

        Assert.Equal("voice-not-found", error.Code);
    }

    [Fact]
    public async Task Nothing_to_say_is_refused_before_anything_is_launched()
    {
        var error = await Assert.ThrowsAsync<AiProviderException>(() =>
            Build().SynthesizeAsync(Request() with { Text = "  " }, CancellationToken.None));

        Assert.Equal("text-required", error.Code);
    }

    [Fact]
    public async Task A_missing_executable_is_reported_rather_than_thrown_raw()
    {
        AddVoice("en_GB-alba-medium");

        var missing = Path.Combine(Path.GetTempPath(), "no-such-piper-" + Guid.NewGuid().ToString("N"));

        var error = await Assert.ThrowsAsync<AiProviderException>(() =>
            Build(executable: missing).SynthesizeAsync(Request(), CancellationToken.None));

        Assert.Equal("executable-missing", error.Code);
    }

    [Fact]
    public async Task A_configured_executable_that_does_not_exist_is_caught_by_the_health_check()
    {
        var missing = Path.Combine(Path.GetTempPath(), "no-such-piper-" + Guid.NewGuid().ToString("N"));

        var health = await Build(executable: missing).CheckHealthAsync(CancellationToken.None);

        Assert.False(health.IsHealthy);
    }

    [Fact]
    public async Task It_speaks_a_line_by_running_the_program()
    {
        // The real end-to-end check of the process runner: arguments passed as a list, text
        // delivered on stdin, WAV collected from the scratch file. Unix only, because it
        // needs a stand-in program and a shell script is the portable way to write one there.
        if (OperatingSystem.IsWindows()) return;

        AddVoice("en_GB-alba-medium");

        var wavPath = Path.Combine(Path.GetTempPath(), $"stub-{Guid.NewGuid():N}.wav");
        await File.WriteAllBytesAsync(wavPath, AudioBytes.Wav(1.0), CancellationToken.None);

        using var stub = new StubExecutable(
            "#!/bin/sh\n" +
            "out=\"\"\n" +
            "while [ $# -gt 0 ]; do\n" +
            "  case \"$1\" in\n" +
            "    --output_file) out=\"$2\"; shift 2 ;;\n" +
            "    *) shift ;;\n" +
            "  esac\n" +
            "done\n" +
            "cat > /dev/null\n" +
            "cp \"" + wavPath + "\" \"$out\"\n");

        try
        {
            var result = await Build(executable: stub.Path)
                .SynthesizeAsync(Request(), CancellationToken.None);

            Assert.Equal("audio/wav", result.MimeType);
            Assert.Equal(1.0, result.DurationSeconds!.Value, precision: 3);
            Assert.Equal("en_GB-alba-medium", result.Provenance.Model);
        }
        finally
        {
            File.Delete(wavPath);
        }
    }

    [Fact]
    public async Task A_program_that_fails_becomes_a_named_error_rather_than_silence()
    {
        if (OperatingSystem.IsWindows()) return;

        AddVoice("en_GB-alba-medium");

        using var stub = new StubExecutable(
            "#!/bin/sh\ncat > /dev/null\necho \"could not load voice model\" >&2\nexit 3\n");

        var error = await Assert.ThrowsAsync<AiProviderException>(() =>
            Build(executable: stub.Path).SynthesizeAsync(Request(), CancellationToken.None));

        Assert.Equal("synthesis-failed", error.Code);
    }

    [Fact]
    public async Task A_program_that_exits_cleanly_but_writes_nothing_is_a_failure()
    {
        if (OperatingSystem.IsWindows()) return;

        AddVoice("en_GB-alba-medium");

        using var stub = new StubExecutable("#!/bin/sh\ncat > /dev/null\nexit 0\n");

        var error = await Assert.ThrowsAsync<AiProviderException>(() =>
            Build(executable: stub.Path).SynthesizeAsync(Request(), CancellationToken.None));

        Assert.Equal("synthesis-failed", error.Code);
    }
}

/// <summary>
/// A throwaway executable script, for testing the process path itself rather than a stand-in
/// for it. Shared by every local-tool provider's tests: whether arguments, stdin and scratch
/// files actually work is not something a fake can answer.
/// </summary>
internal sealed class StubExecutable : IDisposable
{
    public StubExecutable(string script)
    {
        Path = System.IO.Path.Combine(
            System.IO.Path.GetTempPath(), $"stub-{Guid.NewGuid():N}.sh");

        File.WriteAllText(Path, script);

        // Guarded rather than suppressed: this type is only ever constructed on Unix, and
        // the analyzer is right that the call site is otherwise reachable.
        if (!OperatingSystem.IsWindows())
        {
            File.SetUnixFileMode(Path,
                UnixFileMode.UserRead | UnixFileMode.UserWrite | UnixFileMode.UserExecute);
        }
    }

    public string Path { get; }

    public void Dispose()
    {
        try
        {
            File.Delete(Path);
        }
        catch (IOException)
        {
            // A leaked scratch file is not worth failing a test run over.
        }
    }
}
