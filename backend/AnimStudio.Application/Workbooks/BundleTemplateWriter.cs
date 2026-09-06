using System.IO.Compression;
using System.Text;

namespace AnimStudio.Application.Workbooks;

/// <summary>
/// Writes the starter bundle: the sheets as CSVs, a filled-in example, a README, and an
/// empty <c>media/</c> folder to drop pictures into.
/// </summary>
/// <remarks>
/// <para>
/// The template is a <b>zip of CSVs rather than an .xlsx</b>, and that is the whole reason
/// this path needs no dependency. Excel, LibreOffice, Numbers and Google Sheets all open a
/// CSV and save it back; the format costs nothing to write correctly; and a template that is
/// already the shape of the thing being uploaded means the user's first upload is the
/// template with their own rows in it.
/// </para>
/// <para>
/// What is lost is dropdown validation, which an <c>.xlsx</c> can carry and a CSV cannot.
/// The README and the per-column help text stand in for it until the spreadsheet writer
/// lands, and the importer's error messages list the permitted values anyway.
/// </para>
/// <para>
/// Every example value passes through the same formula boundary as an export, so a template
/// can never be the thing that hands someone a live formula.
/// </para>
/// </remarks>
public static class BundleTemplateWriter
{
    public const string FileName = "animstudio-bundle-template.zip";

    public static byte[] Write()
    {
        using var buffer = new MemoryStream();

        using (var zip = new ZipArchive(buffer, ZipArchiveMode.Create, leaveOpen: true))
        {
            AddText(zip, "README.txt", ReadMe());

            foreach (var sheet in WorkbookSchema.Sheets)
                AddText(zip, $"{sheet.Name}.csv", SheetCsv(sheet));

            // A zip cannot hold a truly empty folder, so the placeholder is what makes
            // "put your pictures here" visible when the bundle is opened.
            AddText(zip, "media/README.txt",
                "Put your images and audio in this folder.\r\n\r\n"
                + "Then refer to them from the sheets exactly as they appear here, for\r\n"
                + "example: media/rahul-closed.png\r\n\r\n"
                + "Images may be PNG, JPEG or WebP. Audio may be WAV, MP3, OGG or FLAC.\r\n"
                + "A PNG with a transparent background makes the best character sprite.\r\n");
        }

        return buffer.ToArray();
    }

    private static string SheetCsv(WorkbookSheet sheet)
    {
        var headers = sheet.Columns.Select(c => c.Name).ToList();

        // One example row, not three. A single row is unmistakably an example to be
        // overwritten; three look like data, and people leave them in and then wonder why
        // their video opens on a scene about an arena.
        var example = sheet.Columns.Select(c => c.Example).ToList();

        return CsvGrid.Write(headers, [example]);
    }

    private static string ReadMe()
    {
        var text = new StringBuilder();

        text.Append("AnimStudio AI - project bundle\r\n");
        text.Append("==============================\r\n\r\n");
        text.Append($"Schema version: {WorkbookSchema.Version}\r\n\r\n");

        text.Append("HOW TO USE THIS\r\n");
        text.Append("---------------\r\n");
        text.Append("1. Open the .csv files in Excel, LibreOffice, Numbers or Google Sheets.\r\n");
        text.Append("2. Replace the single example row in each with your own rows.\r\n");
        text.Append("3. Put your images and audio in the media/ folder.\r\n");
        text.Append("4. Zip the whole folder back up and upload it on the Import screen.\r\n\r\n");

        text.Append("You do not need any AI provider, key or internet connection for this.\r\n");
        text.Append("A bundle describes a complete video on its own.\r\n\r\n");

        text.Append("THINGS WORTH KNOWING\r\n");
        text.Append("--------------------\r\n");
        text.Append("- Do not rename the .csv files or change the header row. Everything else\r\n");
        text.Append("  is yours to edit.\r\n");
        text.Append("- Rows are matched by their key, not their position, so you can sort a\r\n");
        text.Append("  sheet however you like.\r\n");
        text.Append("- Leave a cell empty to keep whatever the project already has.\r\n");
        text.Append("- You will see a preview of every change before anything is saved.\r\n");
        text.Append("- If you already have a transcript, save it as transcript.srt in the\r\n");
        text.Append("  bundle root and leave the Dialogue sheet empty.\r\n");
        text.Append("- A sheet you do not need can be deleted from the bundle entirely.\r\n\r\n");

        foreach (var sheet in WorkbookSchema.Sheets)
        {
            text.Append($"{sheet.Name.ToUpperInvariant()}\r\n");
            text.Append(new string('-', sheet.Name.Length)).Append("\r\n");
            text.Append(Wrap(sheet.Help)).Append("\r\n\r\n");

            if (sheet.KeyColumns.Count > 0)
                text.Append($"  Identified by: {string.Join(" + ", sheet.KeyColumns)}\r\n\r\n");

            foreach (var column in sheet.Columns)
            {
                text.Append($"  {column.Name}");
                if (column.Required) text.Append("  (required)");
                text.Append("\r\n");

                if (column.Help is not null)
                    text.Append($"      {column.Help}\r\n");

                if (column.Values.Count > 0)
                    text.Append($"      One of: {string.Join(", ", column.Values)}\r\n");

                text.Append("\r\n");
            }

            text.Append("\r\n");
        }

        return text.ToString();
    }

    /// <summary>Wraps help text so the README reads in a plain text editor.</summary>
    private static string Wrap(string text, int width = 76)
    {
        var lines = new List<string>();
        var line = new StringBuilder();

        foreach (var word in text.Split(' ', StringSplitOptions.RemoveEmptyEntries))
        {
            if (line.Length > 0 && line.Length + word.Length + 1 > width)
            {
                lines.Add(line.ToString());
                line.Clear();
            }

            if (line.Length > 0) line.Append(' ');
            line.Append(word);
        }

        if (line.Length > 0) lines.Add(line.ToString());

        return string.Join("\r\n", lines);
    }

    private static void AddText(ZipArchive zip, string path, string content)
    {
        var entry = zip.CreateEntry(path, CompressionLevel.Optimal);

        using var stream = entry.Open();

        // No byte order mark: Excel copes without one, and the readers here strip it anyway,
        // so writing one only risks a tool that does not.
        var bytes = new UTF8Encoding(encoderShouldEmitUTF8Identifier: false).GetBytes(content);

        stream.Write(bytes, 0, bytes.Length);
    }
}
