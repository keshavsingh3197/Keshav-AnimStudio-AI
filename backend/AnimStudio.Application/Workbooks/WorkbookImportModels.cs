namespace AnimStudio.Application.Workbooks;

public enum ImportAction
{
    /// <summary>Nothing exists with this key yet.</summary>
    Create = 0,

    /// <summary>Something exists and the sheet changes it.</summary>
    Update = 1,

    /// <summary>Something exists, the user edited it by hand, and the sheet would overwrite that.</summary>
    Conflict = 2,

    /// <summary>Nothing to do - the sheet says what the project already says.</summary>
    Unchanged = 3
}

/// <summary>
/// One planned change, in the user's terms rather than the database's.
/// </summary>
/// <param name="Key">What identifies it - a character name, a scene number.</param>
/// <param name="Detail">
/// A short human summary of what changes. Not a field-by-field diff: the useful question
/// before applying is "am I about to overwrite my scene 12", not "which of nine properties".
/// </param>
public sealed record ImportRowPlan(
    string Sheet,
    int RowNumber,
    string Key,
    ImportAction Action,
    string Detail);

public sealed record ImportSheetPlan(
    string Sheet,
    int Create,
    int Update,
    int Conflict,
    int Unchanged,
    IReadOnlyList<ImportRowPlan> Rows);

/// <summary>
/// What an import would do, before it does any of it.
/// </summary>
/// <remarks>
/// A dry run exists because this feature's whole point is bulk: a single upload can rewrite
/// sixty scenes, and "undo" is not a thing a spreadsheet import can offer afterwards. The
/// preview is the undo.
/// </remarks>
public sealed class WorkbookImportPreview
{
    /// <summary>
    /// Single-use handle to the staged upload, so applying does not mean uploading a
    /// hundred megabytes twice.
    /// </summary>
    public required string PreviewToken { get; init; }

    public required DateTime ExpiresAtUtc { get; init; }

    public required IReadOnlyList<ImportSheetPlan> Sheets { get; init; }
    public required IReadOnlyList<WorkbookCellError> Errors { get; init; }
    public required IReadOnlyList<string> Warnings { get; init; }

    /// <summary>Files found under <c>media/</c> that rows actually refer to.</summary>
    public required int MediaFilesUsed { get; init; }
    public required int MediaFilesUnused { get; init; }

    public bool HasTranscript { get; init; }

    /// <summary>
    /// False when something must be fixed in the file first. A preview that cannot be
    /// applied is still worth returning - it is the error report.
    /// </summary>
    public bool CanApply => Errors.Count == 0;
}

/// <summary>What the user chose on the preview screen.</summary>
public sealed record WorkbookImportOptions
{
    /// <summary>
    /// Whether to overwrite rows the user has hand-edited. Defaults to false, matching the
    /// existing re-ingest rule that a human edit outranks a regeneration.
    /// </summary>
    public bool OverwriteUserEdits { get; init; }

    /// <summary>
    /// Whether scenes in the project that the sheet does not mention are removed. Off by
    /// default: a sheet describing three scenes is far more often a partial edit than an
    /// instruction to delete the other fifty.
    /// </summary>
    public bool RemoveMissingScenes { get; init; }
}

public sealed record WorkbookImportResult(
    int CharactersCreated,
    int CharactersUpdated,
    int ScenesCreated,
    int ScenesUpdated,
    int ScenesRemoved,
    int AssetsCreated,
    int DialogueLines,
    bool ProjectUpdated,
    IReadOnlyList<string> Warnings);
