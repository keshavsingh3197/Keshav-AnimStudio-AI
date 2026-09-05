using System.Text;
using AnimStudio.Application.Uploads;
using AnimStudio.Domain.Assets;

namespace AnimStudio.Application.Tests.Uploads;

public class UploadValidatorTests
{
    private static Task<UploadValidationResult> ValidateAsync(
        string fileName, string? contentType, string content) =>
        UploadValidator.ValidateAsync(
            fileName, contentType, new MemoryStream(Encoding.UTF8.GetBytes(content)),
            CancellationToken.None);

    private static Task<UploadValidationResult> ValidateAsync(
        string fileName, string? contentType, byte[] content) =>
        UploadValidator.ValidateAsync(
            fileName, contentType, new MemoryStream(content), CancellationToken.None);

    private const string Srt =
        "1\n00:00:01,000 --> 00:00:03,000\nHey Priya, look at this park!\n\n";

    private const string Vtt =
        "WEBVTT\n\n00:00:01.000 --> 00:00:03.000\nHey Priya, look at this park!\n";

    [Fact]
    public async Task Accepts_a_subrip_file()
    {
        var result = await ValidateAsync("captions.srt", "application/x-subrip", Srt);

        Assert.True(result.IsValid);
        Assert.Equal(AssetKind.Subtitle, result.Kind);
        Assert.Equal(".srt", result.CanonicalExtension);
    }

    [Fact]
    public async Task Accepts_a_webvtt_file()
    {
        var result = await ValidateAsync("captions.vtt", "text/vtt", Vtt);

        Assert.True(result.IsValid);
        Assert.Equal(AssetKind.Subtitle, result.Kind);
    }

    [Theory]
    [InlineData("")]
    [InlineData("text/plain")]
    [InlineData("application/octet-stream")]
    public async Task Accepts_the_vague_content_types_browsers_send_for_subtitles(string declared)
    {
        // Browsers rarely know these formats, so an absent or generic type is normal and
        // must not be the thing that rejects a valid file.
        var result = await ValidateAsync("captions.srt", declared, Srt);

        Assert.True(result.IsValid);
    }

    [Fact]
    public async Task Rejects_a_subtitle_whose_declared_type_is_media()
    {
        var result = await ValidateAsync("captions.srt", "image/png", Srt);

        Assert.False(result.IsValid);
        Assert.Equal("file-type-mismatch", result.Code);
    }

    [Fact]
    public async Task Rejects_a_webvtt_file_without_its_signature_line()
    {
        var result = await ValidateAsync("captions.vtt", "text/vtt", Srt);

        Assert.False(result.IsValid);
        Assert.Equal("file-content-mismatch", result.Code);
    }

    [Fact]
    public async Task Rejects_a_text_file_with_no_timings_in_it()
    {
        var result = await ValidateAsync("notes.srt", "text/plain", "just some prose, no cues");

        Assert.False(result.IsValid);
        Assert.Equal("file-content-mismatch", result.Code);
    }

    [Fact]
    public async Task Rejects_a_binary_renamed_to_srt()
    {
        // A PNG header: valid as an image, and exactly the kind of thing a rename hides.
        byte[] png = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 13, 1, 2, 3, 4];

        var result = await ValidateAsync("sneaky.srt", "text/plain", png);

        Assert.False(result.IsValid);
        Assert.Equal("file-content-mismatch", result.Code);
    }

    [Fact]
    public async Task Rejects_text_carrying_control_bytes()
    {
        var result = await ValidateAsync(
            "captions.srt", "text/plain", "1\n00:00:01,000 --> 00:00:03,000\nHi\0\0\0");

        Assert.False(result.IsValid);
        Assert.Equal("file-content-mismatch", result.Code);
    }

    [Fact]
    public async Task Accepts_a_subtitle_file_that_starts_with_a_byte_order_mark()
    {
        var result = await ValidateAsync("captions.vtt", "text/vtt", "﻿" + Vtt);

        Assert.True(result.IsValid);
    }

    [Fact]
    public async Task Accepts_a_long_file_whose_probe_window_cuts_a_character_in_half()
    {
        // Padding chosen so the 4KB window is guaranteed to land mid-rune.
        var padded = Srt + string.Concat(Enumerable.Repeat("नमस्ते ", 2000));

        var result = await ValidateAsync("captions.srt", "text/plain", padded);

        Assert.True(result.IsValid);
    }

    [Fact]
    public async Task Still_rejects_an_unknown_extension()
    {
        var result = await ValidateAsync("script.docx", "application/octet-stream", Srt);

        Assert.False(result.IsValid);
        Assert.Equal("file-type-not-allowed", result.Code);
    }

    [Fact]
    public async Task Still_accepts_a_png()
    {
        byte[] png = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 13, 1, 2, 3, 4];

        var result = await ValidateAsync("bg.png", "image/png", png);

        Assert.True(result.IsValid);
        Assert.Equal(AssetKind.Image, result.Kind);
    }
}
