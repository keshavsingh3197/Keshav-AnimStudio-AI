using AnimStudio.Domain.Assets;
using AnimStudio.Domain.Projects;
using AnimStudio.Domain.Rendering;

namespace AnimStudio.Application.Workbooks;

public enum WorkbookCellType
{
    /// <summary>A short single-line string.</summary>
    Text = 0,

    /// <summary>Prose. Newlines survive.</summary>
    LongText = 1,

    Integer = 2,
    Decimal = 3,
    Boolean = 4,

    /// <summary>One of <see cref="WorkbookColumn.EnumValues"/>, matched case-insensitively.</summary>
    Enum = 5,

    /// <summary>A semicolon-separated list, e.g. character aliases.</summary>
    TextList = 6,

    /// <summary>
    /// Names something else: a character, or a file inside a bundle's <c>media/</c> folder.
    /// Resolved after every sheet has been read, because a scene may reference a character
    /// defined on a row below it.
    /// </summary>
    Reference = 7
}

/// <summary>
/// One column, and everything three different pieces of code need to agree about it.
/// </summary>
/// <param name="Example">
/// Shown in the template's example rows. It is the fastest documentation there is - most
/// people fill a spreadsheet by copying the row above rather than by reading a README.
/// </param>
public sealed record WorkbookColumn(
    string Name,
    WorkbookCellType Type,
    bool Required = false,
    string? Help = null,
    string? Example = null,
    int MaxLength = 200,
    double? Minimum = null,
    double? Maximum = null,
    IReadOnlyList<string>? EnumValues = null)
{
    public IReadOnlyList<string> Values => EnumValues ?? [];
}

public enum WorkbookSheetShape
{
    /// <summary>Exactly one row of values - the project, the style kit.</summary>
    SingleRow = 0,

    /// <summary>Many rows, identified by <see cref="WorkbookSheet.KeyColumns"/>.</summary>
    Keyed = 1
}

public sealed record WorkbookSheet(
    string Name,
    WorkbookSheetShape Shape,
    IReadOnlyList<string> KeyColumns,
    IReadOnlyList<WorkbookColumn> Columns,
    string Help)
{
    public WorkbookColumn? Column(string name) =>
        Columns.FirstOrDefault(c => string.Equals(c.Name, name, StringComparison.OrdinalIgnoreCase));
}

/// <summary>
/// The workbook format, defined once.
/// </summary>
/// <remarks>
/// <para>
/// The template writer, the reader, the validator and the exporter all read from this. A
/// column that existed in only two of the four is the failure this class exists to prevent:
/// it produces a template nobody can import, and the error names a column the user did type.
/// </para>
/// <para>
/// <b>Identity is by key column, never by row position.</b> Someone will sort the Scenes
/// sheet by title in Excel, and that must be harmless.
/// </para>
/// </remarks>
public static class WorkbookSchema
{
    /// <summary>Bumped only for a change a v1 file cannot survive. Checked on import.</summary>
    public const int Version = 1;

    public const string ProjectSheet = "Project";
    public const string CharactersSheet = "Characters";
    public const string ScenesSheet = "Scenes";
    public const string DialogueSheet = "Dialogue";
    public const string AssetsSheet = "Assets";
    public const string ReadMeSheet = "README";

    /// <summary>Rows per sheet. A production this size is a mistake, not a request.</summary>
    public const int MaxRowsPerSheet = 10_000;

    private static IReadOnlyList<string> Names<TEnum>() where TEnum : struct, Enum =>
        [.. Enum.GetNames<TEnum>()];

    public static readonly WorkbookSheet Project = new(
        ProjectSheet,
        WorkbookSheetShape.SingleRow,
        [],
        [
            new("Name", WorkbookCellType.Text, Required: true,
                Help: "The project's name.", Example: "Championship Final"),
            new("Description", WorkbookCellType.LongText,
                Help: "Free text, for your own reference.", Example: "Recap of the title match.",
                MaxLength: 2000),
            new("Width", WorkbookCellType.Integer,
                Help: "Canvas width in pixels.", Example: "1920", Minimum: 16, Maximum: 7680),
            new("Height", WorkbookCellType.Integer,
                Help: "Canvas height in pixels. Use 1920x1080 for wide, 1080x1920 for vertical.",
                Example: "1080", Minimum: 16, Maximum: 7680),
            new("FrameRate", WorkbookCellType.Integer,
                Help: "Frames per second.", Example: "30", Minimum: 1, Maximum: 120),
            new("DistributionIntent", WorkbookCellType.Enum,
                Help: "Where the finished video is going. This drives the licence check.",
                Example: nameof(DistributionIntent.Personal),
                EnumValues: Names<DistributionIntent>()),
            new("BackgroundMusic", WorkbookCellType.Reference,
                Help: "An Assets row name, or a media/ file in a bundle.",
                Example: "media/theme.mp3"),
            new("BackgroundMusicVolume", WorkbookCellType.Decimal,
                Help: "0 is silent, 1 is full. 0.18 sits under dialogue.",
                Example: "0.18", Minimum: 0, Maximum: 1)
        ],
        "One row describing the whole production. Leave a cell empty to keep what the "
        + "project already has.");

    public static readonly WorkbookSheet Characters = new(
        CharactersSheet,
        WorkbookSheetShape.Keyed,
        ["Name"],
        [
            new("Name", WorkbookCellType.Text, Required: true,
                Help: "How this character is named in the Dialogue sheet's Speaker column.",
                Example: "Rahul", MaxLength: 80),
            new("Aliases", WorkbookCellType.TextList,
                Help: "Other names the transcript calls them, separated by semicolons.",
                Example: "Raj; Rahul Sharma", MaxLength: 400),
            new("Description", WorkbookCellType.LongText,
                Help: "Free text.", Example: "The challenger.", MaxLength: 1000),
            new("IsNarrator", WorkbookCellType.Boolean,
                Help: "TRUE for an unseen narrator: their lines become subtitles with no sprite.",
                Example: "FALSE"),
            new("Age", WorkbookCellType.Integer, Help: "Optional.", Example: "28",
                Minimum: 0, Maximum: 120),
            new("Gender", WorkbookCellType.Text, Help: "Optional, free text.", Example: "Male",
                MaxLength: 40),
            new("Hair", WorkbookCellType.Text, Help: "Optional.", Example: "Short black",
                MaxLength: 120),
            new("Clothes", WorkbookCellType.Text, Help: "Optional.", Example: "Red singlet",
                MaxLength: 200),
            new("Details", WorkbookCellType.LongText, Help: "Anything else about their look.",
                Example: "Scar over the left eye.", MaxLength: 500),
            new("ClosedMouthSprite", WorkbookCellType.Reference,
                Help: "An Assets row name, or a media/ file in a bundle. This is the still pose.",
                Example: "media/rahul-closed.png"),
            new("OpenMouthSprite", WorkbookCellType.Reference,
                Help: "The talking pose. Supply both and the mouth flaps while they speak.",
                Example: "media/rahul-open.png"),
            new("Anchor", WorkbookCellType.Enum,
                Help: "Where the sprite sits on the canvas.",
                Example: nameof(Anchor.BottomCenter), EnumValues: Names<Anchor>()),
            new("HeightFraction", WorkbookCellType.Decimal,
                Help: "Sprite height as a fraction of the canvas, so it looks the same at any size.",
                Example: "0.70", Minimum: 0.01, Maximum: 1),
            new("OffsetX", WorkbookCellType.Decimal,
                Help: "Nudge left or right, as a fraction of canvas width.",
                Example: "-0.20", Minimum: -1, Maximum: 1),
            new("FlipHorizontal", WorkbookCellType.Boolean,
                Help: "TRUE to mirror the sprite, so two characters can face each other.",
                Example: "FALSE")
        ],
        "One row per character. The Name column is the identity: change it and you get a new "
        + "character, so rename by editing every sheet that refers to it.");

    public static readonly WorkbookSheet Scenes = new(
        ScenesSheet,
        WorkbookSheetShape.Keyed,
        ["SceneNumber"],
        [
            new("SceneNumber", WorkbookCellType.Integer, Required: true,
                Help: "The scene's position, starting at 1. Rows may be in any order.",
                Example: "1", Minimum: 1, Maximum: MaxRowsPerSheet),
            new("Title", WorkbookCellType.Text, Help: "Shown in the scene list.",
                Example: "The entrance", MaxLength: 200),
            new("Description", WorkbookCellType.LongText,
                Help: "What happens. Also the prompt if you later generate a background.",
                Example: "The challenger walks out to a roaring crowd.", MaxLength: 2000),
            new("DurationSeconds", WorkbookCellType.Decimal, Required: true,
                Help: "How long the scene runs.", Example: "6.5", Minimum: 0.1, Maximum: 3600),
            new("Background", WorkbookCellType.Reference,
                Help: "An Assets row name, or a media/ file in a bundle.",
                Example: "media/arena.jpg"),
            new("Characters", WorkbookCellType.TextList,
                Help: "Character names on screen, separated by semicolons.",
                Example: "Rahul; Priya", MaxLength: 400),
            new("Effect", WorkbookCellType.Enum,
                Help: "Slow background motion. ZoomIn is the safe default.",
                Example: nameof(BackgroundEffect.ZoomIn), EnumValues: Names<BackgroundEffect>()),
            new("Intensity", WorkbookCellType.Decimal,
                Help: "How far the motion travels. 0.15 is a gentle 15% push.",
                Example: "0.15", Minimum: 0, Maximum: 1),
            new("Transition", WorkbookCellType.Enum,
                Help: "How this scene hands over to the next one.",
                Example: nameof(SceneTransition.Fade), EnumValues: Names<SceneTransition>()),
            new("TransitionSeconds", WorkbookCellType.Decimal,
                Help: "Length of that transition.", Example: "0.5", Minimum: 0, Maximum: 10),
            new("Audio", WorkbookCellType.Reference,
                Help: "Audio for this scene: an Assets row name or a media/ file.",
                Example: "media/scene-01.wav")
        ],
        "One row per scene, in the order they play. SceneNumber is the identity, so you can "
        + "sort this sheet however you like without breaking anything.");

    public static readonly WorkbookSheet Dialogue = new(
        DialogueSheet,
        WorkbookSheetShape.Keyed,
        ["SceneNumber", "Order"],
        [
            new("SceneNumber", WorkbookCellType.Integer, Required: true,
                Help: "Which scene this line belongs to.", Example: "1",
                Minimum: 1, Maximum: MaxRowsPerSheet),
            new("Order", WorkbookCellType.Integer, Required: true,
                Help: "Line order within the scene, starting at 1.", Example: "1",
                Minimum: 1, Maximum: 1000),
            new("Speaker", WorkbookCellType.Reference,
                Help: "A Characters row name. Leave empty for an unattributed line.",
                Example: "Rahul"),
            new("Text", WorkbookCellType.LongText, Required: true,
                Help: "What is said. This becomes the subtitle.",
                Example: "This is my night.", MaxLength: 1000),
            new("StartSeconds", WorkbookCellType.Decimal,
                Help: "When the line starts, measured from the beginning of its scene.",
                Example: "0.0", Minimum: 0, Maximum: 3600),
            new("EndSeconds", WorkbookCellType.Decimal,
                Help: "When it ends. Leave both empty to space the lines evenly.",
                Example: "2.5", Minimum: 0, Maximum: 3600)
        ],
        "One row per spoken line. If you already have a transcript, put it in the bundle as "
        + "transcript.srt instead and leave this sheet empty.");

    public static readonly WorkbookSheet Assets = new(
        AssetsSheet,
        WorkbookSheetShape.Keyed,
        ["Name"],
        [
            new("Name", WorkbookCellType.Text, Required: true,
                Help: "The name other sheets use to refer to this file.",
                Example: "arena", MaxLength: 120),
            new("File", WorkbookCellType.Reference,
                Help: "The file inside the bundle's media/ folder.",
                Example: "media/arena.jpg"),
            new("Kind", WorkbookCellType.Enum,
                Help: "What it is. Checked against the file's actual contents.",
                Example: nameof(AssetKind.Image), EnumValues: Names<AssetKind>()),
            new("License", WorkbookCellType.Enum,
                Help: "The licence on the file itself.",
                Example: nameof(LicenseClass.PublicDomain), EnumValues: Names<LicenseClass>()),
            new("Attribution", WorkbookCellType.LongText,
                Help: "Credit line, if the licence needs one.",
                Example: "Photo by A. Person, CC BY 4.0", MaxLength: 500),
            new("SourceUrl", WorkbookCellType.Text,
                Help: "Where it came from. Recorded, not fetched.",
                Example: "https://example.org/arena", MaxLength: 500)
        ],
        "One row per file. In a bundle you can skip this sheet entirely and point the other "
        + "sheets straight at media/ filenames - it exists for recording licences.");

    public static IReadOnlyList<WorkbookSheet> Sheets { get; } =
        [Project, Characters, Scenes, Dialogue, Assets];

    public static WorkbookSheet? Find(string? name) =>
        name is null
            ? null
            : Sheets.FirstOrDefault(s => string.Equals(s.Name, name, StringComparison.OrdinalIgnoreCase));
}
