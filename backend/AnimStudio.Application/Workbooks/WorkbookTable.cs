namespace AnimStudio.Application.Workbooks;

/// <summary>
/// One problem with one cell, addressed the way the user sees it.
/// </summary>
/// <param name="Row">
/// The row number as it appears in the spreadsheet, header included - so row 2 is the first
/// data row. Telling someone "row 0 of the Dialogue sheet" makes them count.
/// </param>
public sealed record WorkbookCellError(
    string Sheet,
    int Row,
    string? Column,
    string Code,
    string Message);

/// <summary>
/// A sheet as a grid of strings, before any of it means anything.
/// </summary>
/// <remarks>
/// Both readers - the dependency-free CSV one and the <c>.xlsx</c> one - produce this, so
/// everything downstream of parsing is written once and tested once. Whether a file arrived
/// as a workbook or as loose CSVs stops mattering here.
/// </remarks>
public sealed class WorkbookTable(string name, IReadOnlyList<string> headers)
{
    private readonly List<IReadOnlyList<string>> _rows = [];

    public string Name { get; } = name;
    public IReadOnlyList<string> Headers { get; } = headers;
    public IReadOnlyList<IReadOnlyList<string>> Rows => _rows;

    public void Add(IReadOnlyList<string> row) => _rows.Add(row);

    /// <summary>
    /// The value under a header, or null. Case-insensitive, because a user retyping a
    /// header will capitalise it differently and that is not worth an error.
    /// </summary>
    public string? Value(int rowIndex, string column)
    {
        var columnIndex = IndexOf(column);
        if (columnIndex < 0 || rowIndex < 0 || rowIndex >= _rows.Count) return null;

        var row = _rows[rowIndex];
        if (columnIndex >= row.Count) return null;

        var value = row[columnIndex];
        return string.IsNullOrWhiteSpace(value) ? null : value;
    }

    public int IndexOf(string column)
    {
        for (var i = 0; i < Headers.Count; i++)
        {
            if (string.Equals(Headers[i], column, StringComparison.OrdinalIgnoreCase)) return i;
        }

        return -1;
    }

    public bool Has(string column) => IndexOf(column) >= 0;

    /// <summary>
    /// True when every cell in the row is blank. Spreadsheets are full of these - a user
    /// deletes a row's contents rather than the row - and treating one as a record with no
    /// name produces an error the user cannot see the cause of.
    /// </summary>
    public bool IsBlank(int rowIndex) =>
        rowIndex >= 0 && rowIndex < _rows.Count &&
        _rows[rowIndex].All(string.IsNullOrWhiteSpace);

    /// <summary>The spreadsheet row number for a zero-based data index.</summary>
    public static int RowNumber(int rowIndex) => rowIndex + 2;
}

/// <summary>Every sheet found in an upload, keyed by name.</summary>
public sealed class WorkbookDocument
{
    private readonly Dictionary<string, WorkbookTable> _tables = new(StringComparer.OrdinalIgnoreCase);

    public IReadOnlyCollection<WorkbookTable> Tables => _tables.Values;

    public void Add(WorkbookTable table) => _tables[table.Name] = table;

    public WorkbookTable? Table(string name) =>
        _tables.TryGetValue(name, out var table) ? table : null;

    public bool Has(string name) => _tables.ContainsKey(name);
}
