using AnimStudio.Application.Characters;
using AnimStudio.Application.Common;
using AnimStudio.Domain.Characters;

namespace AnimStudio.Application.Voices;

/// <summary>From <see cref="StartSeconds"/> into a recording, speak as <see cref="Voice"/> (null: your own).</summary>
public sealed record StudioVoiceSegment(double StartSeconds, CharacterVoice? Voice);

/// <summary>One requested switch of voice, before it is checked.</summary>
public sealed record StudioVoiceSegmentCommand(double StartSeconds, CharacterVoiceCommand? Voice);

/// <summary>The container a recording arrived in; the studio version goes back in the same one.</summary>
public enum StudioVoiceContainer { WebM, Mp4 }

/// <summary>A finished studio render. Disposing it deletes the file behind it.</summary>
public sealed record StudioVoiceOutput(Stream Content, string MimeType) : IAsyncDisposable
{
    public ValueTask DisposeAsync() => Content.DisposeAsync();
}

/// <summary>
/// Re-voices a recording to studio quality: each part is changed into its character's voice
/// with formant-aware pitch shifting, which a browser can't do live. Any picture in the
/// recording is copied untouched, so the result lines up frame for frame with the original.
/// </summary>
public interface IStudioVoiceRenderer
{
    /// <summary>False when the installed ffmpeg lacks what the render needs.</summary>
    bool IsAvailable { get; }

    /// <summary>
    /// <paramref name="samples"/> maps each AI voice's sample asset id to where its file is
    /// stored; the caller has already checked the samples belong to the user and have consent.
    /// </summary>
    Task<StudioVoiceOutput> RenderAsync(
        Stream recording, StudioVoiceContainer container,
        IReadOnlyList<StudioVoiceSegment> segments,
        IReadOnlyDictionary<string, string> samples, CancellationToken ct);

    /// <summary>False until ffmpeg and the AI voice converter are both ready.</summary>
    bool CanReVoice { get; }

    /// <summary>
    /// Speaks <paramref name="speech"/> (a synthesised line, any format ffmpeg reads) again in
    /// the voice heard in the sample stored at <paramref name="sampleStorageKey"/>; returns a
    /// WAV. The caller has already checked the sample belongs to the user and has consent.
    /// </summary>
    Task<byte[]> ReVoiceAsync(byte[] speech, string sampleStorageKey, CancellationToken ct);

    /// <summary>False until ffmpeg is ready.</summary>
    bool CanPrepareReference { get; }

    /// <summary>
    /// The sample stored at <paramref name="sampleStorageKey"/> as a short mono WAV, the
    /// reference a speech engine tunes a voice from. Browser recordings arrive as WebM or MP4,
    /// which engines can't read. The caller has already checked the sample belongs to the user.
    /// </summary>
    Task<byte[]> ReferenceClipAsync(string sampleStorageKey, CancellationToken ct);
}

/// <summary>One part to convert: the performance in <see cref="SourcePath"/>, into the voice heard in <see cref="SamplePath"/>.</summary>
public sealed record VoiceConversionJob(string SourcePath, string SamplePath, string OutputPath);

/// <summary>
/// AI voice conversion running on this machine: a performance becomes a real person's voice
/// (from a short, consented sample) with its timing and acting kept. Slow on a CPU, so it is
/// only used by the studio render, never live.
/// </summary>
public interface IVoiceConverter
{
    /// <summary>False until the converter is installed and switched on in configuration.</summary>
    bool IsAvailable { get; }

    /// <summary>Converts every job in one run, so the models load once. Paths are absolute.</summary>
    Task ConvertAsync(IReadOnlyList<VoiceConversionJob> jobs, string workingDirectory, CancellationToken ct);
}

/// <summary>Thrown when ffmpeg can't render a recording; the message is safe to show.</summary>
public sealed class StudioVoiceException(string message) : Exception(message);

public static class StudioVoiceValidator
{
    /// <summary>Plenty for a commentary that switches voice line by line, and a cap on graph size.</summary>
    public const int MaxSegments = 200;

    /// <summary>Two hours: far beyond any take, and a cap on what a start time can say.</summary>
    public const double MaxSeconds = 2 * 60 * 60;

    /// <summary>
    /// The timeline must start at zero and only move forward, so every moment of the recording
    /// has exactly one voice; each voice is held to the same rules as a saved character's.
    /// </summary>
    public static IReadOnlyList<StudioVoiceSegment> Validate(IReadOnlyList<StudioVoiceSegmentCommand>? segments)
    {
        if (segments is null || segments.Count == 0)
            throw EditingException.Invalid("voice-timeline-empty", "Say which voice the recording uses.");
        if (segments.Count > MaxSegments)
            throw EditingException.Invalid("voice-timeline-too-long", $"A recording can switch voice at most {MaxSegments} times.");

        var result = new List<StudioVoiceSegment>(segments.Count);
        var previous = double.NegativeInfinity;
        foreach (var segment in segments)
        {
            var start = segment.StartSeconds;
            if (!double.IsFinite(start) || start < 0 || start > MaxSeconds)
                throw EditingException.Invalid("voice-timeline-invalid", "A voice switch is outside the recording.");
            if (result.Count == 0 && start != 0)
                throw EditingException.Invalid("voice-timeline-invalid", "The first voice must start at the beginning.");
            if (start <= previous)
                throw EditingException.Invalid("voice-timeline-invalid", "Voice switches must be in order.");

            previous = start;
            var voice = segment.Voice is { } command ? CharacterVoiceRules.ToVoice(command) : null;
            result.Add(new StudioVoiceSegment(start, voice));
        }

        return result;
    }
}
