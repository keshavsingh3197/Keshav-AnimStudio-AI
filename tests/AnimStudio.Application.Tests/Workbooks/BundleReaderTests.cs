using System.IO.Compression;
using System.Text;
using AnimStudio.Application.Workbooks;
using AnimStudio.Domain.Assets;

namespace AnimStudio.Application.Tests.Workbooks;

/// <summary>Builds archives in memory, including the malformed ones.</summary>
internal static class Zip
{
    /// <summary>A minimal but real PNG, so magic-byte sniffing has something to find.</summary>
    public static byte[] Png()
    {
        var bytes = new byte[256];
        ReadOnlySpan<byte> signature = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
        signature.CopyTo(bytes);
        return bytes;
    }

    public static byte[] Wav()
    {
        var bytes = new byte[128];
        Encoding.ASCII.GetBytes("RIFF").CopyTo(bytes, 0);
        Encoding.ASCII.GetBytes("WAVE").CopyTo(bytes, 8);
        return bytes;
    }

    public static MemoryStream Of(params (string Path, byte[] Content)[] entries)
    {
        var buffer = new MemoryStream();

        using (var zip = new ZipArchive(buffer, ZipArchiveMode.Create, leaveOpen: true))
        {
            foreach (var (path, content) in entries)
            {
                var entry = zip.CreateEntry(path, CompressionLevel.Optimal);
                using var stream = entry.Open();
                stream.Write(content, 0, content.Length);
            }
        }

        buffer.Position = 0;
        return buffer;
    }

    public static (string, byte[]) Text(string path, string content) =>
        (path, Encoding.UTF8.GetBytes(content));
}

public class BundleReaderTests
{
    private const string TwoScenes =
        "SceneNumber,Title,DurationSeconds,Background\r\n"
        + "1,The entrance,6.5,media/arena.jpg\r\n"
        + "2,The finish,4,media/arena.jpg\r\n";

    [Fact]
    public void It_reads_the_sheets_and_the_media_together()
    {
        using var archive = Zip.Of(
            Zip.Text("Scenes.csv", TwoScenes),
            ("media/arena.jpg", ImageBytes.Jpeg()),
            ("media/rahul-closed.png", Zip.Png()));

        var bundle = BundleReader.Read(archive);

        Assert.NotNull(bundle.Workbook.Table("Scenes"));
        Assert.Equal(2, bundle.Workbook.Table("Scenes")!.Rows.Count);
        Assert.Equal(2, bundle.Media.Count);
    }

    [Fact]
    public void Media_is_identified_by_its_bytes_rather_than_its_extension()
    {
        // A file claiming to be a PNG that is really audio is stored as audio. The
        // extension is a claim; the bytes are the fact.
        using var archive = Zip.Of(("media/not-really.png", Zip.Wav()));

        var bundle = BundleReader.Read(archive);
        var file = bundle.Resolve("media/not-really.png");

        Assert.NotNull(file);
        Assert.Equal(AssetKind.Audio, file!.Kind);
        Assert.Equal("audio/wav", file.MimeType);
    }

    [Fact]
    public void A_media_file_that_is_neither_image_nor_audio_is_ignored_and_named()
    {
        using var archive = Zip.Of(Zip.Text("media/notes.txt", "hello"));

        var bundle = BundleReader.Read(archive);

        Assert.Empty(bundle.Media);
        Assert.Contains(bundle.Warnings, w => w.Contains("notes.txt", StringComparison.Ordinal));
    }

    [Theory]
    [InlineData("media/arena.jpg")]
    [InlineData("Media/Arena.JPG")]
    [InlineData("arena.jpg")]
    public void A_cell_finds_its_file_however_the_user_typed_the_path(string reference)
    {
        using var archive = Zip.Of(("media/arena.jpg", ImageBytes.Jpeg()));

        // All three are what people actually put in a cell, and all three mean the one file.
        Assert.NotNull(BundleReader.Read(archive).Resolve(reference));
    }

    [Fact]
    public void A_transcript_in_the_bundle_is_read_instead_of_a_dialogue_sheet()
    {
        using var archive = Zip.Of(
            Zip.Text("transcript.srt", "1\r\n00:00:00,000 --> 00:00:02,000\r\nHello there.\r\n"));

        var bundle = BundleReader.Read(archive);

        Assert.NotNull(bundle.TranscriptText);
        Assert.Contains("Hello there.", bundle.TranscriptText!, StringComparison.Ordinal);
    }

    [Theory]
    [InlineData("../../etc/cron.d/payload")]
    [InlineData("media/../../escape.png")]
    [InlineData("/etc/passwd")]
    [InlineData("C:/Windows/System32/x.png")]
    public void An_entry_that_tries_to_escape_the_bundle_is_refused_not_repaired(string path)
    {
        // Refused rather than sanitized: stripping the ".." and carrying on would import a
        // file the bundle did not honestly describe.
        using var archive = Zip.Of((path, Zip.Png()));

        var error = Assert.Throws<WorkbookFormatException>(() => BundleReader.Read(archive));

        Assert.Equal("unsafe-path", error.Code);
    }

    [Fact]
    public void An_entry_that_expands_far_beyond_its_compressed_size_is_refused()
    {
        // The zip-bomb shape: highly compressible content whose expansion is what matters,
        // not the size declared in the archive's own directory.
        using var archive = Zip.Of(Zip.Text("media/bomb.wav", new string('A', 4 * 1024 * 1024)));

        var error = Assert.Throws<WorkbookFormatException>(() => BundleReader.Read(archive));

        Assert.Equal("suspicious-compression", error.Code);
    }

    [Fact]
    public void A_bundle_with_too_many_files_is_refused()
    {
        var entries = Enumerable
            .Range(0, BundleReader.MaxEntries + 1)
            .Select(i => ($"media/file-{i}.png", Zip.Png()))
            .ToArray();

        using var archive = Zip.Of(entries);

        var error = Assert.Throws<WorkbookFormatException>(() => BundleReader.Read(archive));

        Assert.Equal("too-many-files", error.Code);
    }

    [Fact]
    public void Something_that_is_not_a_zip_says_so_rather_than_throwing_an_io_error()
    {
        using var notAZip = new MemoryStream(Encoding.UTF8.GetBytes("this is a text file"));

        var error = Assert.Throws<WorkbookFormatException>(() => BundleReader.Read(notAZip));

        Assert.Equal("not-a-zip", error.Code);
    }

    [Fact]
    public void A_sheet_the_format_does_not_use_is_ignored_and_named()
    {
        using var archive = Zip.Of(Zip.Text("Budget.csv", "a,b\r\n1,2\r\n"));

        var bundle = BundleReader.Read(archive);

        Assert.Empty(bundle.Workbook.Tables);
        Assert.Contains(bundle.Warnings, w => w.Contains("Budget", StringComparison.Ordinal));
    }

    [Fact]
    public void The_template_this_application_hands_out_imports_cleanly()
    {
        // The test that matters most here. A template nobody can import is worse than no
        // template: the user only finds out after filling it in.
        using var archive = new MemoryStream(BundleTemplateWriter.Write());

        var bundle = BundleReader.Read(archive);
        var data = WorkbookReader.Read(bundle.Workbook);

        Assert.Equal(WorkbookSchema.Sheets.Count, bundle.Workbook.Tables.Count);
        Assert.Empty(data.Errors);

        // And its example rows are real rows, not placeholder text that would fail typing.
        Assert.NotNull(data.Project);
        Assert.Single(data.Characters);
        Assert.Single(data.Scenes);
        Assert.Equal("Rahul", data.Characters[0].Text("Name"));
        Assert.Equal(6.5, data.Scenes[0].Number("DurationSeconds"));
    }
}

/// <summary>Byte patterns the validators recognise, for building believable media.</summary>
internal static class ImageBytes
{
    public static byte[] Jpeg()
    {
        var bytes = new byte[256];
        bytes[0] = 0xFF;
        bytes[1] = 0xD8;
        bytes[2] = 0xFF;
        bytes[^2] = 0xFF;
        bytes[^1] = 0xD9;
        return bytes;
    }
}
