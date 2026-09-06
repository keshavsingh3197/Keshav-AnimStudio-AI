using System.Text;

namespace AnimStudio.Application.Workbooks;

/// <summary>
/// RFC 4180 comma-separated values, read and written without a dependency.
/// </summary>
/// <remarks>
/// <para>
/// Hand-written on purpose. CSV is a genuinely small format - quoting, doubled quotes and
/// embedded newlines are the whole of it - and this is the path that has to keep working in
/// a deployment that drops the spreadsheet package. A dependency here would put the
/// no-dependency claim in the plan out of reach for the sake of about eighty lines.
/// </para>
/// <para>
/// A file that a spreadsheet exported can carry a UTF-8 byte order mark and CRLF endings.
/// Both are handled, because "it opened in Excel" is the only test most users will run.
/// </para>
/// </remarks>
public static class CsvGrid
{
    /// <summary>Refused rather than truncated: a file this large is not a hand-made sheet.</summary>
    public const int MaxCharacters = 16 * 1024 * 1024;

    public static WorkbookTable Read(string name, string content)
    {
        ArgumentNullException.ThrowIfNull(content);

        if (content.Length > MaxCharacters)
        {
            throw new WorkbookFormatException("sheet-too-large",
                $"The sheet '{name}' is larger than this importer will read.");
        }

        var rows = Split(content);

        if (rows.Count == 0)
            return new WorkbookTable(name, []);

        var headers = rows[0].Select(h => h.Trim()).ToList();
        var table = new WorkbookTable(name, headers);

        for (var i = 1; i < rows.Count; i++)
        {
            if (rows[i].All(string.IsNullOrWhiteSpace)) continue;

            table.Add(rows[i]);
        }

        return table;
    }

    public static string Write(IReadOnlyList<string> headers, IEnumerable<IReadOnlyList<string?>> rows)
    {
        var builder = new StringBuilder();

        AppendRow(builder, headers);

        foreach (var row in rows) AppendRow(builder, row);

        return builder.ToString();
    }

    private static void AppendRow(StringBuilder builder, IReadOnlyList<string?> row)
    {
        for (var i = 0; i < row.Count; i++)
        {
            if (i > 0) builder.Append(',');

            // Every exported value passes the formula boundary. A name that is inert here
            // becomes a live formula the moment the file is opened somewhere else.
            builder.Append(Quote(CellText.ForExport(row[i])));
        }

        builder.Append("\r\n");
    }

    private static string Quote(string? value)
    {
        if (string.IsNullOrEmpty(value)) return string.Empty;

        var needsQuotes = value.AsSpan().IndexOfAny(',', '"', '\n') >= 0 ||
                          value.Contains('\r', StringComparison.Ordinal);

        return needsQuotes
            ? string.Concat("\"", value.Replace("\"", "\"\"", StringComparison.Ordinal), "\"")
            : value;
    }

    private static List<List<string>> Split(string content)
    {
        var rows = new List<List<string>>();
        var row = new List<string>();
        var field = new StringBuilder();

        var quoted = false;
        var started = false;

        // A byte order mark reaches here as a character and would otherwise become part of
        // the first header, so "Name" silently stops matching.
        var start = content.Length > 0 && content[0] == '\uFEFF' ? 1 : 0;

        for (var i = start; i < content.Length; i++)
        {
            var c = content[i];

            if (quoted)
            {
                if (c != '"')
                {
                    field.Append(c);
                    continue;
                }

                // A doubled quote inside a quoted field is one literal quote.
                if (i + 1 < content.Length && content[i + 1] == '"')
                {
                    field.Append('"');
                    i++;
                    continue;
                }

                quoted = false;
                continue;
            }

            switch (c)
            {
                case '"':
                    quoted = true;
                    started = true;
                    continue;

                case ',':
                    row.Add(field.ToString());
                    field.Clear();
                    started = true;
                    continue;

                case '\r':
                    // Consumed with the \n that follows, so CRLF ends one row rather than two.
                    if (i + 1 < content.Length && content[i + 1] == '\n') continue;
                    goto case '\n';

                case '\n':
                    row.Add(field.ToString());
                    field.Clear();
                    rows.Add(row);
                    row = [];
                    started = false;
                    continue;

                default:
                    field.Append(c);
                    started = true;
                    continue;
            }
        }

        // A file not ending in a newline still has a last row.
        if (started || field.Length > 0 || row.Count > 0)
        {
            row.Add(field.ToString());
            rows.Add(row);
        }

        return rows;
    }
}

/// <summary>
/// The upload is not readable at all - as opposed to readable and wrong.
/// </summary>
/// <remarks>
/// The distinction matters to the caller: a file that cannot be opened has no rows to show
/// the user, so it is an exception, while a file that opens and contains forty bad cells is
/// a normal result carrying forty errors.
/// </remarks>
public sealed class WorkbookFormatException(string code, string message, Exception? inner = null)
    : Exception(message, inner)
{
    public string Code { get; } = code;
}
