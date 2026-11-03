using AnimStudio.Domain.Stories;

namespace AnimStudio.Application.Abstractions.StoryAgent;

/// <summary>One spoken line, finished: mastered, with a breath on either side, and where the speaker paused.</summary>
/// <param name="Wav">48 kHz mono 16-bit WAV.</param>
/// <param name="Pauses">Quiet stretches from the start of the audio, which the captions are cut at.</param>
public sealed record FinishedLine(byte[] Wav, double DurationSeconds, IReadOnlyList<StoryPause> Pauses);

/// <summary>
/// Makes a synthesised line sit in a video the way a recorded one would: even level, no rumble, a breath before the first
/// word and after the last so scenes do not run into each other, and a note of where the speaker paused so the subtitles
/// can be cut there. Implemented with ffmpeg.
/// </summary>
public interface IStoryAudioFinisher
{
    /// <summary>False when ffmpeg is not available on this server.</summary>
    bool IsAvailable { get; }

    /// <exception cref="StoryStageException">The audio could not be finished.</exception>
    Task<FinishedLine> FinishAsync(byte[] speech, double leadSeconds, double tailSeconds, CancellationToken ct);
}
