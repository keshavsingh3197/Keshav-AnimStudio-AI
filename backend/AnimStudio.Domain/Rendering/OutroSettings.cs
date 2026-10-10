namespace AnimStudio.Domain.Rendering;

public enum OutroKind
{
    None = 0,

    /// <summary>A video bumper (MP4/WebM) attached at the end of the video.</summary>
    Video = 1,

    /// <summary>A static graphic or end-card image (PNG/JPG/WEBP) held for a specified duration.</summary>
    Image = 2,

    /// <summary>
    /// A composed "support us" card: a QR code centred on a plain background with a
    /// headline above it and a line of small text below, held for the duration.
    /// </summary>
    Card = 3
}

/// <summary>How the pieces of a <see cref="OutroKind.Card"/> arrive.</summary>
public enum EndCardAnimation
{
    /// <summary>Everything is there from the first frame (behind the card's own fade).</summary>
    None = 0,

    /// <summary>
    /// One after another: the headline drops in from above, the code rises into place, the
    /// small text rises from below - each easing in and fading up.
    /// </summary>
    Rise = 1
}

/// <summary>
/// Channel bumper or outro end-card attached to the end of rendered videos.
/// </summary>
public sealed class OutroSettings
{
    public const int MaxHeadlineLength = 80;
    public const int MaxSubtextLength = 120;

    public OutroKind Kind { get; set; } = OutroKind.None;

    /// <summary>Asset ID or storage key of the outro video or end-card graphic.</summary>
    public string? AssetId { get; set; }

    /// <summary>Duration in seconds to display an end-card image (default: 4.0s).</summary>
    public double DurationSeconds { get; set; } = 4.0;

    /// <summary>Transition leading into the outro bumper.</summary>
    public SceneTransition Transition { get; set; } = SceneTransition.Fade;

    /// <summary>Transition duration in frames (default: 15 frames = 0.5s at 30fps).</summary>
    public int TransitionDurationFrames { get; set; } = 15;

    // --- Card. Kept apart from AssetId so switching kinds never loses the other upload.

    /// <summary>The QR code (or any small square image) shown in the middle of a card.</summary>
    public string? QrAssetId { get; set; }

    public string? Headline { get; set; } = "Support us for more videos like this";

    public string? Subtext { get; set; } = "Scan the QR code";

    /// <summary>
    /// Optional second-language lines - say Hindi under English - drawn just below their
    /// primary line, a little smaller and softer, so the two read as one bilingual pair.
    /// </summary>
    public string? HeadlineSecondary { get; set; }

    public string? SubtextSecondary { get; set; }

    /// <summary>#RRGGBB.</summary>
    public string BackgroundHex { get; set; } = "#101828";

    /// <summary>#RRGGBB.</summary>
    public string TextHex { get; set; } = "#FFFFFF";

    /// <summary>Card only. Cards saved before this existed read as <see cref="EndCardAnimation.Rise"/>.</summary>
    public EndCardAnimation Animation { get; set; } = EndCardAnimation.Rise;

    public bool IsEnabled => Kind switch
    {
        OutroKind.Video or OutroKind.Image => !string.IsNullOrWhiteSpace(AssetId),
        // A card with neither a code nor a word on it is just a blank screen.
        OutroKind.Card => !string.IsNullOrWhiteSpace(QrAssetId)
                          || !string.IsNullOrWhiteSpace(Headline)
                          || !string.IsNullOrWhiteSpace(HeadlineSecondary),
        _ => false
    };

    public void Clamp()
    {
        DurationSeconds = Math.Clamp(DurationSeconds, 1.0, 30.0);
        TransitionDurationFrames = Math.Clamp(TransitionDurationFrames, 0, 120);
        Headline = OneLine(Headline, MaxHeadlineLength);
        Subtext = OneLine(Subtext, MaxSubtextLength);
        HeadlineSecondary = OneLine(HeadlineSecondary, MaxHeadlineLength);
        SubtextSecondary = OneLine(SubtextSecondary, MaxSubtextLength);
        BackgroundHex = IsHexColor(BackgroundHex) ? BackgroundHex.ToUpperInvariant() : "#101828";
        TextHex = IsHexColor(TextHex) ? TextHex.ToUpperInvariant() : "#FFFFFF";
        if (!Enum.IsDefined(Animation)) Animation = EndCardAnimation.Rise;
    }

    /// <summary>
    /// Drawn with drawtext, which renders a line break as a new line and a control
    /// character as a box - so the text is one line of printable characters, or nothing.
    /// </summary>
    private static string? OneLine(string? value, int max)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;

        var cleaned = new string([.. value.Select(c => char.IsControl(c) ? ' ' : c)]);
        cleaned = string.Join(' ', cleaned.Split(' ', StringSplitOptions.RemoveEmptyEntries));
        return cleaned.Length <= max ? cleaned : cleaned[..max].TrimEnd();
    }

    public static bool IsHexColor(string? value) =>
        value is { Length: 7 } && value[0] == '#' && value.Skip(1).All(Uri.IsHexDigit);
}
