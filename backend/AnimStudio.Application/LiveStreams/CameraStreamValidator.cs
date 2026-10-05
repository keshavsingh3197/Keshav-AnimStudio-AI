using System.Text.RegularExpressions;

namespace AnimStudio.Application.LiveStreams;

/// <summary>
/// Checks what the camera page sends: the stream settings, the first bytes of the
/// recording, and the YouTube ids used to look up audience numbers.
/// </summary>
public static partial class CameraStreamValidator
{
    /// <summary>A UC… channel id: what YouTube Studio's "Advanced settings" shows.</summary>
    [GeneratedRegex("^UC[A-Za-z0-9_-]{22}$", RegexOptions.CultureInvariant)]
    private static partial Regex ChannelIdShape();

    /// <summary>An @handle. YouTube allows 3-30 letters, digits, '.', '_' and '-'.</summary>
    [GeneratedRegex("^@[A-Za-z0-9._-]{3,30}$", RegexOptions.CultureInvariant)]
    private static partial Regex HandleShape();

    [GeneratedRegex("^[A-Za-z0-9_-]{11}$", RegexOptions.CultureInvariant)]
    private static partial Regex VideoIdShape();

    public static bool IsChannelId(string? value) => value is not null && ChannelIdShape().IsMatch(value);

    public static bool IsHandle(string? value) => value is not null && HandleShape().IsMatch(value);

    public static bool IsVideoId(string? value) => value is not null && VideoIdShape().IsMatch(value);

    public static string? ValidateSettings(CameraStreamSettings? settings, IReadOnlyCollection<string> destinations)
    {
        if (settings is null)
            return "The stream settings are missing.";
        if (string.IsNullOrWhiteSpace(settings.Destination) || !destinations.Contains(settings.Destination))
            return "Choose where to stream to.";
        if (!Enum.IsDefined(settings.Orientation))
            return "Orientation must be landscape or portrait.";
        if (!Enum.IsDefined(settings.Quality))
            return "Quality must be 720p or 1080p.";
        if (!Enum.IsDefined(settings.Container))
            return "This browser records in a format the server doesn't accept.";
        if (settings.Label is { Length: > LiveStreamValidator.MaxLabelLength })
            return $"The label can be at most {LiveStreamValidator.MaxLabelLength} characters.";
        if (settings.Label is not null && settings.Label.Any(char.IsControl))
            return "The label can't contain line breaks.";
        if (!settings.RightsConfirmed)
            return "Confirm that everyone on camera agreed to be broadcast and that you hold the rights to what you show.";
        return null;
    }

    /// <summary>
    /// Whether a recording starts the way the declared container does: WebM's EBML magic
    /// number, or an MP4 <c>ftyp</c> box. Only the first chunk of a recording carries it;
    /// anything else is refused before ffmpeg sees a byte.
    /// </summary>
    public static bool StartsLike(CameraContainer container, ReadOnlySpan<byte> head) => container switch
    {
        CameraContainer.WebM => head.Length >= 4 && head[0] == 0x1A && head[1] == 0x45 && head[2] == 0xDF && head[3] == 0xA3,
        CameraContainer.Mp4 => head.Length >= 8 && head[4] == (byte)'f' && head[5] == (byte)'t' && head[6] == (byte)'y' && head[7] == (byte)'p',
        _ => false
    };
}
