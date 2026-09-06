using System.Globalization;

namespace AnimStudio.Application.Workbooks;

/// <summary>
/// One validated row, with its cells already coerced to the types the schema declared.
/// </summary>
/// <remarks>
/// Values are read back by column name rather than through a generated class per sheet.
/// Five near-identical record types plus five mappers would be more code saying the same
/// thing, and the schema is already the single description this reads from.
/// </remarks>
public sealed class WorkbookRow(string sheet, int rowNumber)
{
    private readonly Dictionary<string, object?> _values = new(StringComparer.OrdinalIgnoreCase);

    public string Sheet { get; } = sheet;

    /// <summary>The row number as the spreadsheet shows it, so an error is findable.</summary>
    public int RowNumber { get; } = rowNumber;

    internal void Set(string column, object? value) => _values[column] = value;

    public bool HasValue(string column) =>
        _values.TryGetValue(column, out var value) && value is not null;

    public string? Text(string column) => Get<string>(column);

    public int? Integer(string column) => Get<int?>(column);

    public double? Number(string column) => Get<double?>(column);

    public bool? Flag(string column) => Get<bool?>(column);

    public IReadOnlyList<string> List(string column) =>
        Get<IReadOnlyList<string>>(column) ?? [];

    public TEnum? Enum<TEnum>(string column) where TEnum : struct, Enum
    {
        var text = Text(column);

        return text is not null && System.Enum.TryParse<TEnum>(text, ignoreCase: true, out var value)
            ? value
            : null;
    }

    private T? Get<T>(string column) =>
        _values.TryGetValue(column, out var value) && value is T typed ? typed : default;
}

/// <summary>Everything an upload contained, once it is known to be well formed.</summary>
public sealed class WorkbookData
{
    public WorkbookRow? Project { get; init; }
    public IReadOnlyList<WorkbookRow> Characters { get; init; } = [];
    public IReadOnlyList<WorkbookRow> Scenes { get; init; } = [];
    public IReadOnlyList<WorkbookRow> Dialogue { get; init; } = [];
    public IReadOnlyList<WorkbookRow> Assets { get; init; } = [];

    public IReadOnlyList<WorkbookCellError> Errors { get; init; } = [];
    public IReadOnlyList<string> Warnings { get; init; } = [];

    public bool HasErrors => Errors.Count > 0;
}

/// <summary>
/// Turns a grid of strings into typed rows, or into a precise account of why it could not.
/// </summary>
/// <remarks>
/// <para>
/// <b>Nothing is silently defaulted.</b> A duration of <c>"six"</c> becomes an error naming
/// the sheet, row and column - not a 0 that renders a scene nobody can see and nobody can
/// explain. The user is going to fix this in Excel, and they can only do that if the message
/// says where to look.
/// </para>
/// <para>
/// Errors accumulate rather than throwing on the first one. Someone who mistyped forty
/// durations should learn that once, not forty times.
/// </para>
/// </remarks>
public static class WorkbookReader
{
    /// <summary>Past this, the report is noise; the file needs fixing at the source.</summary>
    private const int MaxErrors = 200;

    public static WorkbookData Read(WorkbookDocument document)
    {
        ArgumentNullException.ThrowIfNull(document);

        var errors = new List<WorkbookCellError>();
        var warnings = new List<string>();

        foreach (var table in document.Tables)
        {
            if (WorkbookSchema.Find(table.Name) is null)
                warnings.Add($"Ignored the sheet '{table.Name}': it is not part of the format.");
        }

        var project = ReadSingle(document, WorkbookSchema.Project, errors, warnings);

        return new WorkbookData
        {
            Project = project,
            Characters = ReadRows(document, WorkbookSchema.Characters, errors, warnings),
            Scenes = ReadRows(document, WorkbookSchema.Scenes, errors, warnings),
            Dialogue = ReadRows(document, WorkbookSchema.Dialogue, errors, warnings),
            Assets = ReadRows(document, WorkbookSchema.Assets, errors, warnings),
            Errors = errors,
            Warnings = warnings
        };
    }

    private static WorkbookRow? ReadSingle(
        WorkbookDocument document, WorkbookSheet sheet,
        List<WorkbookCellError> errors, List<string> warnings)
    {
        var rows = ReadRows(document, sheet, errors, warnings);

        if (rows.Count <= 1) return rows.FirstOrDefault();

        // Extra rows are dropped rather than merged: guessing which of two project names
        // was meant is worse than saying only the first was used.
        warnings.Add($"The '{sheet.Name}' sheet describes one thing, so only its first row "
                   + "was read.");

        return rows[0];
    }

    private static List<WorkbookRow> ReadRows(
        WorkbookDocument document, WorkbookSheet sheet,
        List<WorkbookCellError> errors, List<string> warnings)
    {
        var table = document.Table(sheet.Name);
        var rows = new List<WorkbookRow>();

        if (table is null) return rows;

        WarnAboutUnknownColumns(sheet, table, warnings);

        foreach (var column in sheet.Columns)
        {
            if (column.Required && !table.Has(column.Name))
            {
                errors.Add(new WorkbookCellError(sheet.Name, 1, column.Name, "column-missing",
                    $"The '{sheet.Name}' sheet has no '{column.Name}' column."));
            }
        }

        if (table.Rows.Count > WorkbookSchema.MaxRowsPerSheet)
        {
            errors.Add(new WorkbookCellError(sheet.Name, 1, null, "too-many-rows",
                $"The '{sheet.Name}' sheet has more than the "
                + $"{WorkbookSchema.MaxRowsPerSheet:N0} rows this importer accepts."));

            return rows;
        }

        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        for (var index = 0; index < table.Rows.Count; index++)
        {
            if (table.IsBlank(index)) continue;

            var rowNumber = WorkbookTable.RowNumber(index);
            var row = new WorkbookRow(sheet.Name, rowNumber);
            var usable = true;

            foreach (var column in sheet.Columns)
            {
                var raw = CellText.FromImport(table.Value(index, column.Name));

                if (raw is null)
                {
                    if (!column.Required) continue;

                    Add(errors, sheet.Name, rowNumber, column.Name, "value-required",
                        $"'{column.Name}' cannot be empty.");

                    usable = false;
                    continue;
                }

                if (!TryCoerce(column, raw, out var value, out var code, out var message))
                {
                    Add(errors, sheet.Name, rowNumber, column.Name, code!, message!);
                    usable = false;
                    continue;
                }

                row.Set(column.Name, value);
            }

            if (!usable) continue;

            if (sheet.KeyColumns.Count > 0 && !seen.Add(KeyOf(row, sheet)))
            {
                Add(errors, sheet.Name, rowNumber, sheet.KeyColumns[0], "duplicate-key",
                    $"Another row already uses {Describe(row, sheet)}.");

                continue;
            }

            rows.Add(row);
        }

        return rows;
    }

    private static void WarnAboutUnknownColumns(
        WorkbookSheet sheet, WorkbookTable table, List<string> warnings)
    {
        foreach (var header in table.Headers)
        {
            if (string.IsNullOrWhiteSpace(header) || sheet.Column(header) is not null) continue;

            // A warning rather than an error. People add a notes column to help themselves,
            // and refusing the whole import over one would be officious - but saying
            // nothing hides a mistyped header that silently drops real data.
            warnings.Add($"The '{sheet.Name}' sheet has a column named '{header}' that this "
                       + "format does not use; it was ignored.");
        }
    }

    /// <summary>
    /// Coerces one cell, and says precisely what was wrong when it cannot.
    /// </summary>
    private static bool TryCoerce(
        WorkbookColumn column, string raw,
        out object? value, out string? code, out string? message)
    {
        value = null;
        code = null;
        message = null;

        // Outer whitespace goes in every case; a long text field keeps its internal
        // newlines, which is the only difference between the two text types here.
        var text = raw.Trim();

        switch (column.Type)
        {
            case WorkbookCellType.Text:
            case WorkbookCellType.LongText:
            case WorkbookCellType.Reference:
                if (text.Length > column.MaxLength)
                {
                    code = "too-long";
                    message = $"'{column.Name}' is longer than the {column.MaxLength} "
                            + "characters allowed.";
                    return false;
                }

                value = text;
                return true;

            case WorkbookCellType.TextList:
                if (text.Length > column.MaxLength)
                {
                    code = "too-long";
                    message = $"'{column.Name}' is longer than the {column.MaxLength} "
                            + "characters allowed.";
                    return false;
                }

                value = (IReadOnlyList<string>)[.. text
                    .Split([';', '|'], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                    .Distinct(StringComparer.OrdinalIgnoreCase)];

                return true;

            case WorkbookCellType.Integer:
                if (!int.TryParse(text, NumberStyles.Integer, CultureInfo.InvariantCulture, out var whole))
                {
                    // Spreadsheets store whole numbers as doubles, so "3" can arrive "3.0".
                    if (double.TryParse(text, NumberStyles.Float, CultureInfo.InvariantCulture,
                            out var asDouble) && Math.Abs(asDouble % 1) < 1e-9)
                    {
                        whole = (int)asDouble;
                    }
                    else
                    {
                        code = "not-a-number";
                        message = $"'{column.Name}' must be a whole number.";
                        return false;
                    }
                }

                if (!InRange(whole, column, out message))
                {
                    code = "out-of-range";
                    return false;
                }

                value = (int?)whole;
                return true;

            case WorkbookCellType.Decimal:
                if (!double.TryParse(text, NumberStyles.Float, CultureInfo.InvariantCulture,
                        out var number) || double.IsNaN(number) || double.IsInfinity(number))
                {
                    code = "not-a-number";
                    message = $"'{column.Name}' must be a number.";
                    return false;
                }

                if (!InRange(number, column, out message))
                {
                    code = "out-of-range";
                    return false;
                }

                value = (double?)number;
                return true;

            case WorkbookCellType.Boolean:
                var flag = text.ToLowerInvariant() switch
                {
                    "true" or "yes" or "y" or "1" => (bool?)true,
                    "false" or "no" or "n" or "0" => false,
                    _ => null
                };

                if (flag is null)
                {
                    code = "not-a-yes-or-no";
                    message = $"'{column.Name}' must be TRUE or FALSE.";
                    return false;
                }

                value = flag;
                return true;

            case WorkbookCellType.Enum:
                var match = column.Values.FirstOrDefault(
                    v => string.Equals(v, text, StringComparison.OrdinalIgnoreCase));

                if (match is null)
                {
                    code = "not-a-choice";
                    message = $"'{column.Name}' must be one of: {string.Join(", ", column.Values)}.";
                    return false;
                }

                // Stored in the schema's own casing, so the enum parse downstream cannot
                // depend on how the user typed it.
                value = match;
                return true;

            default:
                value = text;
                return true;
        }
    }

    private static bool InRange(double value, WorkbookColumn column, out string? message)
    {
        message = null;

        if (column.Minimum is { } min && value < min)
        {
            message = $"'{column.Name}' must be at least {min.ToString("0.###", CultureInfo.InvariantCulture)}.";
            return false;
        }

        if (column.Maximum is { } max && value > max)
        {
            message = $"'{column.Name}' must be at most {max.ToString("0.###", CultureInfo.InvariantCulture)}.";
            return false;
        }

        return true;
    }

    private static void Add(
        List<WorkbookCellError> errors, string sheet, int row, string? column,
        string code, string message)
    {
        if (errors.Count >= MaxErrors) return;

        errors.Add(new WorkbookCellError(sheet, row, column, code, message));
    }

    private static string KeyOf(WorkbookRow row, WorkbookSheet sheet) =>
        string.Join('', sheet.KeyColumns.Select(c =>
            row.Integer(c)?.ToString(CultureInfo.InvariantCulture) ?? row.Text(c) ?? string.Empty));

    private static string Describe(WorkbookRow row, WorkbookSheet sheet) =>
        string.Join(", ", sheet.KeyColumns.Select(c =>
            $"{c} {row.Integer(c)?.ToString(CultureInfo.InvariantCulture) ?? row.Text(c)}"));
}
