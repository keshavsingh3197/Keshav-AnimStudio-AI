using System.Net;
using System.Text;
using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Ai;
using AnimStudio.Application.Options;
using AnimStudio.Domain.Ai;
using AnimStudio.Infrastructure.Ai.Providers;
using Microsoft.Extensions.Logging.Abstractions;

namespace AnimStudio.Application.Tests.Ai;

public class AiTranscriptValidatorTests
{
    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   \n\n  ")]
    public void Nothing_at_all_is_a_failure_rather_than_an_empty_transcript(string? text)
    {
        // Passing "" down the chain would turn a failed recognition into a project with a
        // transcript of no cues, which reads like a successful render of a silent video.
        var error = Assert.Throws<AiProviderException>(
            () => AiTranscriptValidator.Require(text, "whispercpp-local"));

        Assert.Equal("empty-response", error.Code);
    }

    [Fact]
    public void A_transcript_of_nothing_but_invisible_characters_is_also_empty()
    {
        var error = Assert.Throws<AiProviderException>(
            () => AiTranscriptValidator.Require("\u0007\u0001\uFEFF", "whispercpp-local"));

        Assert.Equal("empty-response", error.Code);
    }

    [Fact]
    public void An_enormous_transcript_is_refused_rather_than_cleaned()
    {
        var error = Assert.Throws<AiProviderException>(() => AiTranscriptValidator.Require(
            new string('a', AiTranscriptValidator.MaxCharacters + 1), "whispercpp-local"));

        Assert.Equal("response-too-large", error.Code);
    }

    [Fact]
    public void Newlines_and_tabs_survive_and_every_other_control_character_does_not()
    {
        var cleaned = AiTranscriptValidator.Require(
            "1\n00:00:00,000 --> 00:00:01,000\nHello\u0007\tthere.", "whispercpp-local");

        Assert.Contains("\n00:00:00,000 --> 00:00:01,000\n", cleaned, StringComparison.Ordinal);
        Assert.Contains("Hello\tthere.", cleaned, StringComparison.Ordinal);
        Assert.DoesNotContain('\u0007', cleaned);
    }

    [Fact]
    public void Line_endings_are_normalised_whatever_platform_the_recognizer_ran_on()
    {
        Assert.Equal("a\nb\nc", AiTranscriptValidator.Require("a\r\nb\rc", "whispercpp-local"));
    }

    [Fact]
    public void A_byte_order_mark_does_not_become_part_of_the_first_cue()
    {
        Assert.Equal("1", AiTranscriptValidator.Require("\uFEFF1", "whispercpp-local"));
    }

    [Theory]
    [InlineData("WEBVTT\n\n00:00.000 --> 00:01.000\nHi", "vtt")]
    [InlineData("1\n00:00:00,000 --> 00:00:01,000\nHi", "srt")]
    [InlineData("Just some words with no timings at all.", "text")]
    [InlineData("", "text")]
    public void The_format_is_named_so_the_parser_does_not_have_to_sniff_it_again(
        string text, string expected)
    {
        Assert.Equal(expected, AiTranscriptValidator.SniffFormat(text));
    }
}

public class WhisperCppLocalTranscriptionProviderTests : IDisposable
{
    private readonly string _modelsDirectory =
        Path.Combine(Path.GetTempPath(), $"whisper-models-{Guid.NewGuid():N}");

    private readonly string _audioPath =
        Path.Combine(Path.GetTempPath(), $"whisper-audio-{Guid.NewGuid():N}.wav");

    public WhisperCppLocalTranscriptionProviderTests()
    {
        Directory.CreateDirectory(_modelsDirectory);
        File.WriteAllBytes(_audioPath, new byte[64]);
    }

    public void Dispose()
    {
        try
        {
            Directory.Delete(_modelsDirectory, recursive: true);
            File.Delete(_audioPath);
        }
        catch (IOException)
        {
            // A leaked scratch file is not worth failing a test run over.
        }

        GC.SuppressFinalize(this);
    }

    private void AddModel(string name) =>
        File.WriteAllBytes(Path.Combine(_modelsDirectory, name + ".bin"), new byte[16]);

    private WhisperCppLocalTranscriptionProvider Build(
        string executable = "whisper-cli",
        string? modelsDirectory = null,
        string? model = "ggml-base.en")
    {
        var options = new AiOptions
        {
            Providers =
            {
                ["whispercpp-local"] = new AiProviderOptions
                {
                    Enabled = true,
                    ExecutablePath = executable,
                    ModelsPath = modelsDirectory ?? _modelsDirectory,
                    Model = model,
                    IsLocal = true,
                    TimeoutSeconds = 30
                }
            }
        };

        return new WhisperCppLocalTranscriptionProvider(
            AiProviderId.Parse("whispercpp-local"),
            new StaticOptionsMonitor<AiOptions>(options),
            NullLogger<WhisperCppLocalTranscriptionProvider>.Instance);
    }

    private AiTranscriptionRequest Request(string? language = null, bool words = false) => new()
    {
        AudioPath = _audioPath,
        LanguageHint = language,
        RequestWordTimings = words
    };

    /// <summary>
    /// A stand-in for whisper.cpp that records the arguments it was given and writes a
    /// SubRip file beside the base path it was handed, which is the contract that matters.
    /// </summary>
    private static StubExecutable Recorder(string argumentsPath, bool writeOutput = true)
    {
        var script = new StringBuilder()
            .Append("#!/bin/sh\n")
            .Append("out=\"\"\n")
            .Append(": > \"").Append(argumentsPath).Append("\"\n")
            .Append("while [ $# -gt 0 ]; do\n")
            .Append("  echo \"$1\" >> \"").Append(argumentsPath).Append("\"\n")
            .Append("  case \"$1\" in --output-file) out=\"$2\" ;; esac\n")
            .Append("  shift\n")
            .Append("done\n");

        if (writeOutput)
        {
            script.Append(
                "printf '1\\n00:00:00,000 --> 00:00:02,000\\nHello there.\\n\\n' > \"$out.srt\"\n");
        }

        return new StubExecutable(script.ToString());
    }

    private static string ArgumentsPath() =>
        Path.Combine(Path.GetTempPath(), $"whisper-args-{Guid.NewGuid():N}.txt");

    [Fact]
    public void It_needs_a_program_a_models_folder_and_a_model()
    {
        AddModel("ggml-base.en");

        Assert.True(Build().IsConfigured);
        Assert.False(Build(modelsDirectory: " ").IsConfigured);
        Assert.False(Build(model: null).IsConfigured);
    }

    [Fact]
    public async Task Audio_that_is_not_there_fails_before_a_process_is_started()
    {
        AddModel("ggml-base.en");

        var request = new AiTranscriptionRequest { AudioPath = "/no/such/file.wav" };

        var error = await Assert.ThrowsAsync<AiProviderException>(
            () => Build().TranscribeAsync(request, CancellationToken.None));

        Assert.Equal("audio-missing", error.Code);
    }

    [Theory]
    [InlineData("../../../etc/passwd")]
    [InlineData("sub/model")]
    [InlineData("..")]
    public async Task A_model_name_may_not_escape_the_configured_folder(string model)
    {
        var error = await Assert.ThrowsAsync<AiProviderException>(
            () => Build(model: model).TranscribeAsync(Request(), CancellationToken.None));

        Assert.Equal("model-invalid", error.Code);
    }

    [Fact]
    public async Task A_model_that_is_not_installed_says_so_rather_than_failing_in_the_tool()
    {
        var error = await Assert.ThrowsAsync<AiProviderException>(
            () => Build().TranscribeAsync(Request(), CancellationToken.None));

        Assert.Equal("model-not-found", error.Code);
    }

    [Fact]
    public async Task It_reads_back_the_subtitles_the_tool_wrote_beside_the_base_path()
    {
        if (OperatingSystem.IsWindows()) return;

        AddModel("ggml-base.en");

        var argumentsPath = ArgumentsPath();
        using var stub = Recorder(argumentsPath);

        try
        {
            var result = await Build(executable: stub.Path)
                .TranscribeAsync(Request(), CancellationToken.None);

            Assert.Equal("srt", result.Format);
            Assert.Contains("Hello there.", result.SubtitleText, StringComparison.Ordinal);
            Assert.Equal("ggml-base.en", result.Provenance.Model);

            var arguments = await File.ReadAllLinesAsync(argumentsPath, CancellationToken.None);

            Assert.Contains("--output-srt", arguments);
            Assert.Contains(_audioPath, arguments);

            // The base path is handed over without the .srt the tool appends itself, so the
            // file it writes is exactly the one the scratch wrapper cleans up afterwards.
            var outputBase = arguments[Array.IndexOf(arguments, "--output-file") + 1];

            Assert.False(outputBase.EndsWith(".srt", StringComparison.Ordinal));
            Assert.False(File.Exists(outputBase + ".srt"));
        }
        finally
        {
            File.Delete(argumentsPath);
        }
    }

    [Fact]
    public async Task Word_timings_are_asked_for_one_word_per_cue()
    {
        if (OperatingSystem.IsWindows()) return;

        AddModel("ggml-base.en");

        var argumentsPath = ArgumentsPath();
        using var stub = Recorder(argumentsPath);

        try
        {
            await Build(executable: stub.Path)
                .TranscribeAsync(Request(words: true), CancellationToken.None);

            var arguments = await File.ReadAllLinesAsync(argumentsPath, CancellationToken.None);

            Assert.Contains("--max-len", arguments);
            Assert.Contains("--split-on-word", arguments);
        }
        finally
        {
            File.Delete(argumentsPath);
        }
    }

    [Theory]
    [InlineData("en", "en")]
    [InlineData("en-GB", "en")]
    [InlineData("hi_IN", "hi")]
    public async Task A_language_hint_is_passed_as_the_base_code(string hint, string expected)
    {
        if (OperatingSystem.IsWindows()) return;

        AddModel("ggml-base.en");

        var argumentsPath = ArgumentsPath();
        using var stub = Recorder(argumentsPath);

        try
        {
            var result = await Build(executable: stub.Path)
                .TranscribeAsync(Request(language: hint), CancellationToken.None);

            var arguments = await File.ReadAllLinesAsync(argumentsPath, CancellationToken.None);

            Assert.Equal(expected, arguments[Array.IndexOf(arguments, "--language") + 1]);
            Assert.NotNull(result.Language);
        }
        finally
        {
            File.Delete(argumentsPath);
        }
    }

    [Theory]
    [InlineData("english (British)")]
    [InlineData("e")]
    [InlineData("en;rm -rf /")]
    public async Task A_hint_that_is_not_a_language_code_falls_back_to_detection(string hint)
    {
        if (OperatingSystem.IsWindows()) return;

        AddModel("ggml-base.en");

        var argumentsPath = ArgumentsPath();
        using var stub = Recorder(argumentsPath);

        try
        {
            // Dropped rather than refused: losing a whole transcription because a locale
            // string had a stray character in it is a poor trade for a hint.
            var result = await Build(executable: stub.Path)
                .TranscribeAsync(Request(language: hint), CancellationToken.None);

            var arguments = await File.ReadAllLinesAsync(argumentsPath, CancellationToken.None);

            Assert.DoesNotContain("--language", arguments);
            Assert.Null(result.Language);
        }
        finally
        {
            File.Delete(argumentsPath);
        }
    }

    [Fact]
    public async Task A_tool_that_fails_becomes_a_named_error_rather_than_silence()
    {
        if (OperatingSystem.IsWindows()) return;

        AddModel("ggml-base.en");

        using var stub = new StubExecutable(
            "#!/bin/sh\necho \"failed to load model\" >&2\nexit 2\n");

        var error = await Assert.ThrowsAsync<AiProviderException>(
            () => Build(executable: stub.Path).TranscribeAsync(Request(), CancellationToken.None));

        Assert.Equal("transcription-failed", error.Code);
    }

    [Fact]
    public async Task A_tool_that_exits_cleanly_but_writes_nothing_is_a_failure()
    {
        if (OperatingSystem.IsWindows()) return;

        AddModel("ggml-base.en");

        var argumentsPath = ArgumentsPath();
        using var stub = Recorder(argumentsPath, writeOutput: false);

        try
        {
            var error = await Assert.ThrowsAsync<AiProviderException>(
                () => Build(executable: stub.Path).TranscribeAsync(Request(), CancellationToken.None));

            Assert.Equal("empty-response", error.Code);
        }
        finally
        {
            File.Delete(argumentsPath);
        }
    }
}

public class OpenAiCompatibleAsrProviderTests : IDisposable
{
    private readonly string _audioPath =
        Path.Combine(Path.GetTempPath(), $"asr-audio-{Guid.NewGuid():N}.wav");

    public OpenAiCompatibleAsrProviderTests() => File.WriteAllBytes(_audioPath, new byte[1024]);

    public void Dispose()
    {
        try
        {
            File.Delete(_audioPath);
        }
        catch (IOException)
        {
            // A leaked scratch file is not worth failing a test run over.
        }

        GC.SuppressFinalize(this);
    }

    private (OpenAiCompatibleAsrProvider Provider, StubHandler Handler) Build(
        Action<AiProviderOptions>? configure = null)
    {
        var providerOptions = new AiProviderOptions
        {
            Enabled = true,
            BaseUrl = "http://localhost:8000/v1/",
            IsLocal = true,
            Model = "Systran/faster-whisper-small"
        };

        configure?.Invoke(providerOptions);

        var options = new AiOptions { Providers = { ["faster-whisper"] = providerOptions } };
        var handler = new StubHandler();

        var provider = new OpenAiCompatibleAsrProvider(
            AiProviderId.Parse("faster-whisper"),
            new StubHttpClientFactory(handler, providerOptions.BaseUrl!),
            new StubSecretResolver(null),
            new StaticOptionsMonitor<AiOptions>(options),
            NullLogger<OpenAiCompatibleAsrProvider>.Instance);

        return (provider, handler);
    }

    private AiTranscriptionRequest Request(bool words = false, string? language = null) => new()
    {
        AudioPath = _audioPath,
        RequestWordTimings = words,
        LanguageHint = language
    };

    private const string TwoSegments =
        """
        {
          "language": "english",
          "text": "Hello there. And the crowd goes wild.",
          "segments": [
            { "start": 0.0, "end": 2.0, "text": " Hello there.", "avg_logprob": -0.1 },
            { "start": 2.0, "end": 3725.5, "text": " And the crowd goes wild.", "avg_logprob": -0.3 }
          ]
        }
        """;

    [Fact]
    public async Task It_builds_subrip_from_the_segments_rather_than_asking_for_it()
    {
        var (provider, handler) = Build();
        handler.RespondJson(TwoSegments);

        var result = await provider.TranscribeAsync(Request(), CancellationToken.None);

        Assert.Equal("srt", result.Format);
        Assert.Equal(
            "1\n00:00:00,000 --> 00:00:02,000\nHello there.\n\n" +
            "2\n00:00:02,000 --> 01:02:05,500\nAnd the crowd goes wild.",
            result.SubtitleText);
    }

    [Fact]
    public async Task The_detected_language_and_a_confidence_come_back_with_it()
    {
        var (provider, handler) = Build();
        handler.RespondJson(TwoSegments);

        var result = await provider.TranscribeAsync(Request(), CancellationToken.None);

        Assert.Equal("english", result.Language);

        // The mean of exp(avg_logprob) across the segments: the closest thing to a
        // confidence Whisper actually reports.
        Assert.Equal((Math.Exp(-0.1) + Math.Exp(-0.3)) / 2, result.Confidence!.Value, precision: 6);
    }

    [Fact]
    public async Task The_upload_asks_for_verbose_json_and_names_the_model()
    {
        var (provider, handler) = Build();
        handler.RespondJson(TwoSegments);

        await provider.TranscribeAsync(Request(language: "en"), CancellationToken.None);

        var sent = handler.Bodies[0];

        Assert.Contains("verbose_json", sent, StringComparison.Ordinal);
        Assert.Contains("Systran/faster-whisper-small", sent, StringComparison.Ordinal);
        Assert.Contains("audio.wav", sent, StringComparison.Ordinal);
        Assert.Contains("name=\"language\"", sent, StringComparison.Ordinal);
    }

    [Fact]
    public async Task An_unset_model_is_left_out_because_a_local_server_serves_what_it_loaded()
    {
        var (provider, handler) = Build(o => o.Model = null);
        handler.RespondJson(TwoSegments);

        await provider.TranscribeAsync(Request(), CancellationToken.None);

        Assert.DoesNotContain("name=\"model\"", handler.Bodies[0], StringComparison.Ordinal);
    }

    [Fact]
    public async Task Word_timings_are_asked_for_and_become_one_cue_per_word()
    {
        var (provider, handler) = Build();
        handler.RespondJson(
            """
            {
              "text": "Hello there",
              "segments": [ { "start": 0.0, "end": 1.0, "text": "Hello there" } ],
              "words": [
                { "word": "Hello", "start": 0.0, "end": 0.4 },
                { "word": "there", "start": 0.4, "end": 1.0 }
              ]
            }
            """);

        var result = await provider.TranscribeAsync(Request(words: true), CancellationToken.None);

        Assert.Contains("timestamp_granularities[]", handler.Bodies[0], StringComparison.Ordinal);
        Assert.Contains(
            "00:00:00,000 --> 00:00:00,400\nHello", result.SubtitleText, StringComparison.Ordinal);
        Assert.Contains(
            "00:00:00,400 --> 00:00:01,000\nthere", result.SubtitleText, StringComparison.Ordinal);
    }

    [Fact]
    public async Task Word_timings_are_read_from_inside_the_segments_when_that_is_where_they_are()
    {
        var (provider, handler) = Build();
        handler.RespondJson(
            """
            {
              "text": "Hello there",
              "segments": [ { "start": 0.0, "end": 1.0, "text": "Hello there",
                              "words": [ { "word": "Hello", "start": 0.0, "end": 0.4 } ] } ]
            }
            """);

        var result = await provider.TranscribeAsync(Request(words: true), CancellationToken.None);

        Assert.Equal("1\n00:00:00,000 --> 00:00:00,400\nHello", result.SubtitleText);
    }

    [Fact]
    public async Task A_service_that_ignored_verbose_json_still_yields_a_transcript()
    {
        var (provider, handler) = Build();
        handler.RespondJson("""{ "text": "Hello there. And the crowd goes wild." }""");

        var result = await provider.TranscribeAsync(Request(), CancellationToken.None);

        // Estimated cue times beat no transcript: the parser synthesizes them from a
        // reading rate for exactly this case.
        Assert.Equal("text", result.Format);
        Assert.Equal("Hello there. And the crowd goes wild.", result.SubtitleText);
    }

    [Fact]
    public async Task A_segment_whose_times_make_no_sense_is_dropped_rather_than_written()
    {
        var (provider, handler) = Build();
        handler.RespondJson(
            """
            {
              "text": "fallback",
              "segments": [
                { "start": 5.0, "end": 2.0, "text": "backwards" },
                { "start": 2.0, "text": "no end" },
                { "start": 0.0, "end": 1.0, "text": "kept" }
              ]
            }
            """);

        var result = await provider.TranscribeAsync(Request(), CancellationToken.None);

        // A cue that ends before it starts puts the subtitle file into a state ffmpeg
        // reads as a corrupt stream.
        Assert.Equal("1\n00:00:00,000 --> 00:00:01,000\nkept", result.SubtitleText);
    }

    [Fact]
    public async Task A_newline_inside_a_segment_cannot_break_the_file_it_is_written_into()
    {
        var (provider, handler) = Build();
        handler.RespondJson(
            """
            { "segments": [ { "start": 0.0, "end": 1.0,
                              "text": "one\n\n2\n00:00:09,000 --> 00:00:10,000\ninjected" } ] }
            """);

        var result = await provider.TranscribeAsync(Request(), CancellationToken.None);

        // Recognizer output is model output: a cue carrying its own blank line would
        // otherwise become a second, forged cue in the SubRip.
        Assert.Equal(
            "1\n00:00:00,000 --> 00:00:01,000\none 2 00:00:09,000 --> 00:00:10,000 injected",
            result.SubtitleText);
    }

    [Fact]
    public async Task A_response_with_nothing_in_it_is_a_failure()
    {
        var (provider, handler) = Build();
        handler.RespondJson("""{ "segments": [] }""");

        var error = await Assert.ThrowsAsync<AiProviderException>(
            () => provider.TranscribeAsync(Request(), CancellationToken.None));

        Assert.Equal("empty-response", error.Code);
    }

    [Fact]
    public async Task Audio_that_is_not_there_fails_before_anything_is_uploaded()
    {
        var (provider, handler) = Build();

        var request = new AiTranscriptionRequest { AudioPath = "/no/such/file.wav" };

        var error = await Assert.ThrowsAsync<AiProviderException>(
            () => provider.TranscribeAsync(request, CancellationToken.None));

        Assert.Equal("audio-missing", error.Code);
        Assert.Empty(handler.Requests);
    }

    [Fact]
    public async Task An_over_sized_file_is_refused_here_rather_than_by_the_service()
    {
        var oversized = Path.Combine(Path.GetTempPath(), $"asr-big-{Guid.NewGuid():N}.wav");

        // Sparse where the filesystem allows it: the declared length is the whole point,
        // and writing 25MB of real bytes to prove a length check would be a waste.
        await using (var file = File.Create(oversized))
        {
            file.SetLength(26L * 1024 * 1024);
        }

        try
        {
            var (provider, handler) = Build();

            var error = await Assert.ThrowsAsync<AiProviderException>(() =>
                provider.TranscribeAsync(
                    new AiTranscriptionRequest { AudioPath = oversized }, CancellationToken.None));

            // Refused before the upload: otherwise this comes back as a 413 several minutes
            // and one wasted allowance later.
            Assert.Equal("request-too-large", error.Code);
            Assert.Empty(handler.Requests);
        }
        finally
        {
            File.Delete(oversized);
        }
    }

    [Fact]
    public async Task A_failure_status_becomes_a_coded_error_and_carries_no_response_body()
    {
        var (provider, handler) = Build();
        handler.Respond(HttpStatusCode.BadRequest,
            """{ "error": { "code": "invalid_request", "message": "the user said: secret" } }""");

        var error = await Assert.ThrowsAsync<AiProviderException>(
            () => provider.TranscribeAsync(Request(), CancellationToken.None));

        Assert.Equal("bad-request", error.Code);
        Assert.Contains("invalid_request", error.Message, StringComparison.Ordinal);
        Assert.DoesNotContain("secret", error.Message, StringComparison.Ordinal);
    }
}
