namespace AnimStudio.Application.Workbooks;

/// <summary>
/// The formula-injection boundary, in both directions.
/// </summary>
/// <remarks>
/// <para>
/// A spreadsheet cell beginning <c>=</c>, <c>+</c>, <c>-</c>, <c>@</c>, a tab or a carriage
/// return is a formula to Excel, LibreOffice and Google Sheets. That matters twice here,
/// and the two directions are not symmetrical:
/// </para>
/// <para>
/// <b>Import is the smaller half.</b> This application never evaluates a cell, so a formula
/// arriving in an upload is only a value that is not what it looks like. It is kept as
/// literal text and flagged, so the preview shows the user what will actually be stored.
/// </para>
/// <para>
/// <b>Export is the dangerous half</b>, and it is the one people forget. A character called
/// <c>=cmd|' /C calc'!A0</c> is inert in this application's database and becomes a live
/// formula the moment it is written into a workbook and opened on someone's machine. Every
/// value leaving through a sheet is prefixed so the receiving application treats it as text.
/// </para>
/// </remarks>
public static class CellText
{
    private static readonly char[] Dangerous = ['=', '+', '-', '@', '\t', '\r'];

    /// <summary>True when a spreadsheet would read this value as a formula rather than text.</summary>
    public static bool LooksLikeFormula(string? value) =>
        !string.IsNullOrEmpty(value) && Array.IndexOf(Dangerous, value[0]) >= 0;

    /// <summary>
    /// The value as it will be written into a sheet. A leading apostrophe is the
    /// spreadsheet convention for "this is text": it is consumed on open and never becomes
    /// part of the value, so a round trip is lossless.
    /// </summary>
    public static string? ForExport(string? value) =>
        LooksLikeFormula(value) ? "'" + value : value;

    /// <summary>
    /// The value as it will be stored. A leading apostrophe that a spreadsheet added on the
    /// way out is removed here, so exporting and re-importing does not accumulate one per
    /// round trip.
    /// </summary>
    public static string? FromImport(string? value)
    {
        if (string.IsNullOrEmpty(value)) return value;

        return value.Length > 1 && value[0] == '\'' && LooksLikeFormula(value[1..])
            ? value[1..]
            : value;
    }
}
