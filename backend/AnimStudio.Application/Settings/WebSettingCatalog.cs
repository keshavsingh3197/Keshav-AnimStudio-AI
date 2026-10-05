using System.Globalization;

namespace AnimStudio.Application.Settings;

public enum WebSettingType
{
    Boolean,
    Integer,
    Number,
    Text,
    Choice,
    Url
}

/// <summary>
/// One setting the admin console may change.
/// </summary>
/// <param name="Key">The configuration path, exactly as appsettings.json nests it.</param>
/// <param name="AppliesLive">
/// True when a change takes effect on the next request or job. False when the value is read
/// once by a long-lived background service (the render worker, the stream managers), so
/// the change waits for a restart - the console says so rather than appearing to do nothing.
/// </param>
public sealed record WebSettingDefinition(
    string Key,
    string Group,
    string Label,
    string Description,
    WebSettingType Type,
    bool AppliesLive,
    double? Min = null,
    double? Max = null,
    IReadOnlyList<string>? Choices = null,
    int MaxLength = 200);

/// <summary>
/// The allowlist of settings that can be stored in the WebSettings table. Anything not
/// listed here - paths, connection strings, keys, secrets - can only be set in
/// configuration, and a stored value for an unlisted key is ignored when settings load.
/// </summary>
public static class WebSettingCatalog
{
    private static readonly string[] X264Presets =
        ["ultrafast", "superfast", "veryfast", "faster", "fast", "medium", "slow", "slower", "veryslow"];

    public static readonly IReadOnlyList<WebSettingDefinition> All =
    [
        // --- Rendering: read per render job, so live.
        new("Render:Crf", "Rendering", "Quality (CRF)", "x264 constant rate factor for delivered videos. Lower is better quality and bigger files; 18 is visually lossless.", WebSettingType.Integer, true, 0, 51),
        new("Render:Preset", "Rendering", "Encoder preset", "x264 preset for delivered videos. Slower presets make smaller files at the same quality.", WebSettingType.Choice, true, Choices: X264Presets),
        new("Render:IntermediatePreset", "Rendering", "Intermediate preset", "x264 preset for throw-away clip files inside a stitch.", WebSettingType.Choice, true, Choices: X264Presets),
        new("Render:Fps", "Rendering", "Frame rate", "Frames per second of project renders.", WebSettingType.Integer, true, 12, 60),
        new("Render:UseHardwareEncoder", "Rendering", "Use GPU for intermediates", "Send intermediate clip encodes to the hardware encoder found at startup.", WebSettingType.Boolean, true),
        new("Render:KenBurnsSupersample", "Rendering", "Ken Burns supersampling", "Renders pans and zooms at this multiple of the output size to keep them smooth.", WebSettingType.Integer, true, 1, 4),
        new("Render:MouthFlapHz", "Rendering", "Mouth flap rate", "How many times per second a talking character's mouth opens.", WebSettingType.Integer, true, 2, 20),
        new("Render:SubtitleFontSize", "Rendering", "Subtitle size", "Burned-in subtitle font size at 1080p.", WebSettingType.Integer, true, 16, 160),
        new("Render:WatermarkText", "Rendering", "Default watermark text", "Pre-fills the watermark box on the clip screen.", WebSettingType.Text, true, MaxLength: 80),
        new("Render:MaxConcurrentJobs", "Rendering", "Renders at once", "How many render jobs run in parallel.", WebSettingType.Integer, false, 1, 8),
        new("Render:MaxAttempts", "Rendering", "Render retries", "How many times a failed render is attempted before it is marked failed.", WebSettingType.Integer, false, 1, 10),
        new("Render:WorkspaceRetentionHours", "Rendering", "Keep render workspaces (hours)", "How long a render's temporary folder is kept.", WebSettingType.Integer, false, 1, 720),
        new("Render:ClipCacheMaxGigabytes", "Rendering", "Clip cache size (GB)", "Disk space for conformed clips reused between exports. 0 turns the cache off.", WebSettingType.Integer, false, 0, 2000),

        // --- FFmpeg: the runner is a singleton.
        new("Ffmpeg:SceneTimeoutMinutes", "FFmpeg", "Scene timeout (minutes)", "A single scene encode is stopped after this long.", WebSettingType.Integer, false, 1, 240),
        new("Ffmpeg:MergeTimeoutMinutes", "FFmpeg", "Merge timeout (minutes)", "Joining all scenes is stopped after this long.", WebSettingType.Integer, false, 1, 600),
        new("Ffmpeg:Threads", "FFmpeg", "Encoder threads", "0 lets FFmpeg choose.", WebSettingType.Integer, false, 0, 64),
        new("Ffmpeg:MergeDecoderThreads", "FFmpeg", "Decoder threads per clip", "Caps memory when many clips are joined at once.", WebSettingType.Integer, false, 0, 16),
        new("Ffmpeg:MaxMergeInputs", "FFmpeg", "Clips per join", "Larger stitches are joined in stages above this.", WebSettingType.Integer, false, 2, 200),

        // --- Import: read per request.
        new("Ingest:AllowUrlIngest", "Import", "Allow importing from links", "Lets users import transcripts from YouTube and other links.", WebSettingType.Boolean, true),
        new("Ingest:RequireRightsAttestation", "Import", "Require a rights confirmation", "Users must confirm they have the rights to imported material.", WebSettingType.Boolean, true),
        new("Ingest:MaxTranscriptCharacters", "Import", "Longest transcript (characters)", "Bigger transcripts are refused.", WebSettingType.Integer, true, 1_000, 5_000_000),
        new("Ingest:MaxCueCount", "Import", "Most subtitle cues", "Subtitle files with more cues are refused.", WebSettingType.Integer, true, 100, 200_000),
        new("Ingest:MaxSubtitleUploadBytes", "Import", "Largest subtitle file (bytes)", "Bigger subtitle uploads are refused.", WebSettingType.Integer, true, 10_000, 50_000_000),
        new("Ingest:YtDlp:Enabled", "Import", "Use yt-dlp", "Download captions and media with yt-dlp.", WebSettingType.Boolean, false),
        new("Ingest:YtDlp:TimeoutSeconds", "Import", "yt-dlp timeout (seconds)", "A yt-dlp run is stopped after this long.", WebSettingType.Integer, false, 10, 3600),

        // --- Scene splitting: read per import.
        new("Segmentation:MinSegmentSeconds", "Scene splitting", "Shortest scene (s)", "Scenes shorter than this are merged into a neighbour.", WebSettingType.Number, true, 0.2, 30),
        new("Segmentation:TargetSegmentSeconds", "Scene splitting", "Target scene length (s)", "What the splitter aims for.", WebSettingType.Number, true, 0.5, 60),
        new("Segmentation:MaxSegmentSeconds", "Scene splitting", "Longest scene (s)", "Longer stretches are split.", WebSettingType.Number, true, 1, 300),
        new("Segmentation:MaxCharsPerSegment", "Scene splitting", "Most characters per scene", "Longer text is split across scenes.", WebSettingType.Integer, true, 20, 5000),

        // --- Live streaming: the stream managers are singletons.
        new("LiveStream:MaxConcurrentStreams", "Live streaming", "Streams at once", "How many playlist streams can be live together.", WebSettingType.Integer, false, 1, 20),
        new("LiveStream:MaxStreamsPerUser", "Live streaming", "Streams per user", "How many streams one user can run.", WebSettingType.Integer, false, 1, 20),
        new("LiveStream:MaxHours", "Live streaming", "Longest stream (hours)", "Even a looping stream ends after this long.", WebSettingType.Integer, false, 1, 48),
        new("LiveStream:ReconnectAttempts", "Live streaming", "Reconnect attempts", "How often a dropped stream reconnects before giving up.", WebSettingType.Integer, false, 0, 20),
        new("LiveStream:AllowSavedKeysForNonAdmins", "Live streaming", "Saved keys for everyone", "Let non-admins stream with a channel's saved stream key.", WebSettingType.Boolean, false),
        new("LiveStream:Camera:Enabled", "Live streaming", "Camera Studio", "Allow streaming from Camera Studio.", WebSettingType.Boolean, false),
        new("LiveStream:Camera:MaxConcurrent", "Live streaming", "Camera streams at once", "How many Camera Studio streams can run together.", WebSettingType.Integer, false, 1, 10),
        new("LiveStream:Camera:Preset", "Live streaming", "Camera encoder preset", "x264 preset for the real-time camera encode.", WebSettingType.Choice, false, Choices: ["ultrafast", "superfast", "veryfast", "faster"]),

        // --- YouTube: read through IOptionsMonitor, so live.
        new("YouTube:CacheSeconds", "YouTube", "Audience numbers cache (s)", "How long subscriber and viewer counts are reused.", WebSettingType.Integer, true, 5, 600),
        new("YouTube:Publish:ClientId", "YouTube", "OAuth client ID", "The Google OAuth client used to connect channels. The client secret stays in user-secrets or Key Vault.", WebSettingType.Text, true, MaxLength: 200),
        new("YouTube:Publish:RedirectUri", "YouTube", "OAuth redirect URI", "The app's /youtube/callback address, exactly as listed on the OAuth client.", WebSettingType.Url, true, MaxLength: 300),
        new("YouTube:Publish:ChunkSizeMegabytes", "YouTube", "Upload chunk size (MB)", "Each upload request sends this much of the video.", WebSettingType.Integer, true, 1, 128),
        new("YouTube:Publish:MaxUploadsPerUser", "YouTube", "Uploads per user", "How many uploads one user can run at once.", WebSettingType.Integer, true, 1, 20),
        new("YouTube:Publish:KeepFinishedHours", "YouTube", "Keep finished uploads (hours)", "How long a finished upload stays in the list.", WebSettingType.Integer, true, 1, 168),
        new("YouTube:Publish:MaxConcurrentUploads", "YouTube", "Uploads at once", "How many uploads run in parallel on the server.", WebSettingType.Integer, false, 1, 8),
    ];

    private static readonly Dictionary<string, WebSettingDefinition> ByKey =
        All.ToDictionary(d => d.Key, StringComparer.OrdinalIgnoreCase);

    public static WebSettingDefinition? Find(string? key) =>
        key is not null && ByKey.TryGetValue(key, out var definition) ? definition : null;

    /// <summary>
    /// The value in the invariant form configuration binding expects, or an error message.
    /// Allowlist checks only: a number must parse and sit in range, a choice must be listed,
    /// text may not hold control characters.
    /// </summary>
    public static (string? Value, string? Error) Normalize(WebSettingDefinition definition, string? input)
    {
        var raw = (input ?? string.Empty).Trim();

        switch (definition.Type)
        {
            case WebSettingType.Boolean:
                return bool.TryParse(raw, out var flag)
                    ? (flag ? "true" : "false", null)
                    : (null, "Must be true or false.");

            case WebSettingType.Integer:
                if (!long.TryParse(raw, NumberStyles.AllowLeadingSign, CultureInfo.InvariantCulture, out var whole))
                    return (null, "Must be a whole number.");
                return InRange(definition, whole) ?? (whole.ToString(CultureInfo.InvariantCulture), null);

            case WebSettingType.Number:
                if (!double.TryParse(raw, NumberStyles.Float, CultureInfo.InvariantCulture, out var number) || !double.IsFinite(number))
                    return (null, "Must be a number.");
                return InRange(definition, number) ?? (number.ToString("R", CultureInfo.InvariantCulture), null);

            case WebSettingType.Choice:
                var choice = definition.Choices?.FirstOrDefault(c => string.Equals(c, raw, StringComparison.OrdinalIgnoreCase));
                return choice is null ? (null, "Choose one of the listed values.") : (choice, null);

            case WebSettingType.Url:
                if (raw.Length > definition.MaxLength) return (null, $"At most {definition.MaxLength} characters.");
                return Uri.TryCreate(raw, UriKind.Absolute, out var uri)
                       && (uri.Scheme == Uri.UriSchemeHttps || (uri.Scheme == Uri.UriSchemeHttp && uri.IsLoopback))
                       && string.IsNullOrEmpty(uri.UserInfo) && string.IsNullOrEmpty(uri.Fragment)
                    // Kept as typed: an OAuth redirect must match the registered one character for character.
                    ? (raw, null)
                    : (null, "Must be an https:// address (http:// only for localhost).");

            default:
                if (raw.Length > definition.MaxLength) return (null, $"At most {definition.MaxLength} characters.");
                if (raw.Any(char.IsControl)) return (null, "Can't contain line breaks or control characters.");
                return (raw, null);
        }
    }

    private static (string?, string?)? InRange(WebSettingDefinition definition, double value)
    {
        if (definition.Min is { } min && value < min || definition.Max is { } max && value > max)
            return (null, $"Must be between {definition.Min?.ToString(CultureInfo.InvariantCulture)} and {definition.Max?.ToString(CultureInfo.InvariantCulture)}.");
        return null;
    }
}
