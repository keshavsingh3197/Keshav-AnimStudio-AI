namespace AnimStudio.Domain.LiveStreams;

/// <summary>
/// A Go Live setup a person saved to use again: the playlist, how it is sent, where the key
/// comes from and - for a YouTube broadcast - the title, description and tags to create it with.
/// <para>
/// Picking it fills the Go Live page; playing it creates a <b>new</b> stream (and a new YouTube
/// broadcast) every time, so the same morning or evening program can go out day after day
/// without filling the form again.
/// </para>
/// <para>
/// Never holds a stream key: a pasted key is asked for again, a channel's saved key stays in
/// <see cref="LiveStreamKey"/>, and a YouTube broadcast's key is created on YouTube when played.
/// Files uploaded from the browser aren't kept either; renders, project media, release kits and
/// links are, by reference, and are checked for ownership again whenever the preset is played.
/// </para>
/// </summary>
public sealed class LiveStreamPreset
{
    /// <summary><c>lsp_{guid}</c>.</summary>
    public string Id { get; set; } = string.Empty;

    public string UserId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;

    public LiveStreamPresetSettings Settings { get; set; } = new();
    public List<LiveStreamPresetItem> Items { get; set; } = [];

    /// <summary><c>channel</c>, <c>paste</c> or <c>youtube</c>: where the key comes from when it is played.</summary>
    public string KeyMode { get; set; } = "youtube";

    /// <summary>The brand channel whose saved key is used, when <see cref="KeyMode"/> is <c>channel</c>.</summary>
    public string? ChannelId { get; set; }

    /// <summary>What a new broadcast is created with, when <see cref="KeyMode"/> is <c>youtube</c>.</summary>
    public LiveStreamPresetYouTube? YouTube { get; set; }

    public DateTime CreatedAtUtc { get; set; }
    public DateTime UpdatedAtUtc { get; set; }

    /// <summary>When it was last played; null until then.</summary>
    public DateTime? LastUsedAtUtc { get; set; }

    public int Uses { get; set; }
}

/// <summary>How the stream is sent. Enum values are kept by name, as the API spells them.</summary>
public sealed class LiveStreamPresetSettings
{
    public string Destination { get; set; } = "youtube";
    public string Quality { get; set; } = "Hd720";
    public string Orientation { get; set; } = "Landscape";

    /// <summary>0 means until stopped.</summary>
    public int Loops { get; set; }

    public bool Shuffle { get; set; }
    public bool AutoReconnect { get; set; } = true;

    /// <summary>The name each new stream is listed under in the app.</summary>
    public string? Label { get; set; }
}

/// <summary>One playlist entry, by reference, with what the page shows for it.</summary>
public sealed class LiveStreamPresetItem
{
    /// <summary><c>Render</c>, <c>Asset</c>, <c>Url</c> or <c>ReleaseKit</c> - never <c>Upload</c>.</summary>
    public string Source { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;
    public string? TypeLabel { get; set; }
    public string? Detail { get; set; }

    public string? RenderJobId { get; set; }
    public string? AssetId { get; set; }
    public string? CoverAssetId { get; set; }
    public string? Url { get; set; }
    public bool AudioOnly { get; set; }
    public string? ReleaseKitId { get; set; }
    public bool UseVisualizer { get; set; }

    public double? DurationSeconds { get; set; }
    public int? Width { get; set; }
    public int? Height { get; set; }
    public string? ThumbnailUrl { get; set; }
}

/// <summary>The details a new YouTube broadcast is created with each time the preset is played.</summary>
public sealed class LiveStreamPresetYouTube
{
    /// <summary>The connected channel (<c>UC…</c>) the broadcast is created on.</summary>
    public string ChannelId { get; set; } = string.Empty;

    /// <summary>What the stream is about, as typed for the AI; kept so it can write again.</summary>
    public string? Topic { get; set; }
    public string? Brief { get; set; }
    public string? Tone { get; set; }
    public string? Language { get; set; }

    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public List<string> Tags { get; set; } = [];
    public string CategoryId { get; set; } = "24";
    public string Privacy { get; set; } = "public";
    public bool MadeForKids { get; set; }
    public bool EnableDvr { get; set; } = true;
}
