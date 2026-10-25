using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Abstractions.Storage;
using AnimStudio.Application.Ai;
using AnimStudio.Application.Options;
using AnimStudio.Application.Transcripts.Parsing;
using AnimStudio.Application.Uploads;
using AnimStudio.Domain.Assets;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AnimStudio.Application.Transcripts;

/// <summary>One stretch of a file's speech as 16 kHz mono WAV, and where it starts in the file.</summary>
public sealed record SpeechAudioPart(string AudioPath, TimeSpan Offset);

/// <summary>
/// Pulls the speech out of a stored audio or video file as the 16 kHz mono WAV every
/// recognizer here expects, cut into parts no longer than <c>partLength</c>.
/// </summary>
public interface ISpeechAudioExtractor
{
    /// <summary>False when ffmpeg isn't available on this server.</summary>
    bool IsAvailable { get; }

    /// <summary>The parts in playing order. Only the first <paramref name="maxLength"/> of the file is read.</summary>
    Task<IReadOnlyList<SpeechAudioPart>> ExtractAsync(
        IRenderWorkspace workspace, string storageKey, TimeSpan partLength, TimeSpan maxLength, CancellationToken ct);
}

/// <summary>The file has no sound track, or ffmpeg could not read one out of it.</summary>
public sealed class SpeechAudioExtractionException(bool noAudio, string message) : Exception(message)
{
    public bool NoAudio { get; } = noAudio;
}

/// <summary>Raised when a transcript cannot be made. The code is what the API returns.</summary>
public sealed class MediaTranscriptionException(string code, string message) : Exception(message)
{
    public string Code { get; } = code;
}

public sealed record MediaTranscriptionCommand(
    string ProjectId, string AssetId, string UserId, string? Language, bool SaveAsSubtitle);

public sealed record MediaTranscriptLine(TimeSpan Start, TimeSpan End, string Text);

public sealed record MediaTranscription(
    IReadOnlyList<MediaTranscriptLine> Lines,
    string SubRip,
    string? Language,
    string ProviderId,
    bool Truncated,
    Asset? SavedSubtitle);

/// <summary>
/// What is said in an audio or video asset: every spoken line with its time, in whatever
/// language it was spoken, through the same <c>Ai:Chains:Transcription</c> chain dictation
/// uses (whisper.cpp on this machine first, hosted Whisper as a fallback).
/// </summary>
/// <remarks>
/// <para>
/// <b>The audio is transcribed in ten-minute parts.</b> A hosted recognizer takes at most
/// 25 MB in one call, which is about thirteen minutes of 16 kHz WAV, and a local one is
/// bounded by its process timeout; ten-minute parts fit both and are cached one by one, so
/// asking again - to save the transcript after reading it - costs nothing.
/// </para>
/// <para>
/// The result is never logged: what someone said in a recording can be personal data.
/// </para>
/// </remarks>
public sealed class MediaTranscriptionService(
    IProjectRepository projects,
    IAssetRepository assets,
    IObjectStore store,
    IRenderWorkspaceFactory workspaces,
    ISpeechAudioExtractor extractor,
    IAiExecutor ai,
    ISubtitleParser parser,
    IOptions<IngestOptions> ingestOptions,
    TimeProvider clock,
    AnimStudio.Application.Assets.AssetScopeService scope,
    ILogger<MediaTranscriptionService> logger)
{
    public static readonly TimeSpan PartLength = TimeSpan.FromMinutes(10);

    /// <summary>Two hours. On a CPU-only machine that is already an hour or more of recognizing.</summary>
    public static readonly TimeSpan MaxLength = TimeSpan.FromHours(2);

    /// <summary>
    /// The languages a caller may name. Anything else - including nothing - lets the
    /// recognizer detect the language itself, which also copes with Hindi and English mixed.
    /// </summary>
    public static readonly IReadOnlySet<string> Languages = new HashSet<string>(StringComparer.Ordinal)
    {
        "en", "hi", "ur", "pa", "bn", "mr", "gu", "ta", "te", "kn", "ml"
    };

    /// <summary>A long file keeps a CPU (or a metered quota) busy for minutes, so one runs at a time.</summary>
    private static readonly SemaphoreSlim Slot = new(1, 1);

    public async Task<MediaTranscription> TranscribeAsync(MediaTranscriptionCommand command, CancellationToken ct)
    {
        var asset = await LoadOwnedAsync(command, ct).ConfigureAwait(false);

        if (asset.Kind is not (AssetKind.Audio or AssetKind.Video))
            throw new MediaTranscriptionException("not-audible", "Only audio and video files have speech to transcribe.");

        // A probed video with no sound track is refused before ffmpeg is started for nothing.
        if (asset.Kind == AssetKind.Video && asset.Probe.DurationSeconds is not null
            && asset.Probe.AudioCodec is null && asset.Probe.AudioChannels is null)
            throw new MediaTranscriptionException("no-audio", "This video has no sound, so there is nothing to transcribe.");

        if (!extractor.IsAvailable)
            throw new MediaTranscriptionException("ffmpeg-unavailable",
                "ffmpeg isn't available on this server, so the sound can't be read out of the file.");

        var hint = command.Language is not null && Languages.Contains(command.Language) ? command.Language : null;
        var truncated = asset.Probe.DurationSeconds is { } seconds && seconds > MaxLength.TotalSeconds;

        if (!await Slot.WaitAsync(TimeSpan.FromSeconds(30), ct).ConfigureAwait(false))
            throw new MediaTranscriptionException("transcription-busy",
                "Another file is being transcribed right now. Try again when it has finished.");

        var lines = new List<MediaTranscriptLine>();
        var providers = new List<string>();
        string? detected = null;
        try
        {
            await using var workspace = await workspaces
                .CreateAsync($"transcript-{Guid.NewGuid():n}", ct).ConfigureAwait(false);

            IReadOnlyList<SpeechAudioPart> parts;
            try
            {
                parts = await extractor.ExtractAsync(workspace, asset.StorageKey, PartLength, MaxLength, ct)
                    .ConfigureAwait(false);
            }
            catch (SpeechAudioExtractionException ex)
            {
                throw new MediaTranscriptionException(ex.NoAudio ? "no-audio" : "audio-unreadable",
                    ex.NoAudio
                        ? "This file has no sound, so there is nothing to transcribe."
                        : "The sound in this file couldn't be read. Try converting it to MP3 or MP4 and uploading it again.");
            }

            for (var i = 0; i < parts.Count; i++)
            {
                var part = parts[i];
                var outcome = await ai.TranscribeAsync(
                    new AiTranscriptionRequest
                    {
                        AudioPath = part.AudioPath,
                        LanguageHint = hint,
                        // The storage key names immutable bytes, so it and the part's place in
                        // them identify the audio without reading it again to hash it.
                        CacheFingerprint = Fingerprint(asset.StorageKey, i)
                    },
                    new AiCallContext(command.ProjectId, command.UserId), ct).ConfigureAwait(false);

                // A part that is all music or silence comes back empty; that is not a failure
                // of the file, only a stretch of it with nobody speaking.
                if (outcome is { Kind: AiOutcomeKind.Failed, ErrorCode: "empty-response" }) continue;
                if (!outcome.IsSuccess) throw Failure(outcome);

                var result = outcome.Value!;
                detected ??= result.Language;
                if (!providers.Contains(result.Provenance.ProviderId)) providers.Add(result.Provenance.ProviderId);
                lines.AddRange(LinesOf(result, part.Offset));
            }
        }
        finally
        {
            Slot.Release();
        }

        if (lines.Count == 0)
            throw new MediaTranscriptionException("no-speech", "No speech was heard in this file.");

        var subRip = ToSubRip(lines);
        var language = detected ?? hint;
        var saved = command.SaveAsSubtitle
            ? await SaveAsync(asset, subRip, ct).ConfigureAwait(false)
            : null;

        logger.LogInformation(
            "Transcribed {Lines} line(s) from asset {AssetId} in project {ProjectId} with {Providers}; saved: {Saved}.",
            lines.Count, asset.Id, command.ProjectId, string.Join(",", providers), saved is not null);

        return new MediaTranscription(lines, subRip, language, string.Join(", ", providers), truncated, saved);
    }

    /// <summary>
    /// Ownership is checked here, server-side, on every call. An asset that is missing,
    /// in another project or in someone else's project all read as "not found".
    /// </summary>
    private async Task<Asset> LoadOwnedAsync(MediaTranscriptionCommand command, CancellationToken ct)
    {
        var project = await projects.GetAsync(command.ProjectId, ct).ConfigureAwait(false)
            ?? throw new MediaTranscriptionException("project-not-found", "That project does not exist.");

        if (!string.Equals(project.UserId, command.UserId, StringComparison.Ordinal))
        {
            logger.LogWarning("User {UserId} asked to transcribe an asset of project {ProjectId}, which is not theirs.",
                command.UserId, command.ProjectId);
            throw new MediaTranscriptionException("forbidden", "You do not have access to that project.");
        }

        var asset = await assets.GetAsync(command.AssetId, ct).ConfigureAwait(false);
        if (asset is null || !await scope.CanUseAssetAsync(asset, command.ProjectId, ct).ConfigureAwait(false))
            throw new MediaTranscriptionException("asset-not-found", "That file is not in this project.");

        return asset;
    }

    private IEnumerable<MediaTranscriptLine> LinesOf(AiTranscriptionResult result, TimeSpan offset)
    {
        var format = result.Format switch
        {
            AiTranscriptValidator.SubRip => SubtitleFormat.SubRip,
            AiTranscriptValidator.WebVtt => SubtitleFormat.WebVtt,
            _ => SubtitleFormat.PlainText
        };

        // The recognizer's text is untrusted; it goes through the same parser as an uploaded
        // .srt and comes out as plain cue text.
        return parser.Parse(result.SubtitleText, format).Cues
            .Where(c => !c.IsNonSpeech && !string.IsNullOrWhiteSpace(c.Text))
            .Select(c => new MediaTranscriptLine(c.Start + offset, c.End + offset, c.Text.Trim()));
    }

    /// <summary>
    /// Keeps the transcript beside the file as a subtitle asset, so it can be imported as a
    /// script or attached to a video like any uploaded .srt.
    /// </summary>
    private async Task<Asset> SaveAsync(Asset source, string subRip, CancellationToken ct)
    {
        var bytes = new UTF8Encoding(false).GetBytes(subRip);
        if (bytes.Length > ingestOptions.Value.MaxSubtitleUploadBytes)
            throw new MediaTranscriptionException("transcript-too-large",
                "The transcript is larger than a subtitle file may be, so it can't be saved. Copy or download it instead.");

        var storageKey = $"projects/{source.ProjectId}/assets/{Guid.NewGuid():n}.srt";
        using (var content = new MemoryStream(bytes))
        {
            await store.SaveAsync(storageKey, content, "application/x-subrip", ct).ConfigureAwait(false);
        }

        var name = UploadValidator.SanitizeDisplayName($"{Path.GetFileNameWithoutExtension(source.Name)} - transcript.srt");
        var subtitle = new Asset
        {
            ProjectId = source.ProjectId,
            FolderId = source.FolderId,
            Name = name,
            DisplayFileName = name,
            StorageKey = storageKey,
            Kind = AssetKind.Subtitle,
            MimeType = "application/x-subrip",
            FileSizeBytes = bytes.Length,
            ReviewStatus = AssetReviewStatus.NotRequired,
            // As with an uploaded subtitle: source material for an import, never a scene's.
            UsageScope = AssetUsageScope.ReferenceOnly,
            CreatedAt = clock.GetUtcNow().UtcDateTime
        };

        await assets.InsertAsync(subtitle, ct).ConfigureAwait(false);
        return subtitle;
    }

    private static MediaTranscriptionException Failure(AiOutcome<AiTranscriptionResult> outcome) =>
        outcome.Kind == AiOutcomeKind.Unavailable
            ? new MediaTranscriptionException("transcription-unavailable",
                "No speech-to-text engine is turned on. Enable whispercpp-local, faster-whisper or groq-whisper " +
                "under Ai:Providers (see docs/SETUP.md), then restart the API.")
            : new MediaTranscriptionException(outcome.ErrorCode ?? "transcription-failed", outcome.ErrorCode switch
            {
                "transport-failed" =>
                    @"The speech-to-text engine isn't running - nothing answered on its address. Install the local one with scripts\setup-dictation.ps1, then restart the API.",
                "timeout" =>
                    "The speech-to-text engine took too long. The first request after starting loads the model; try again.",
                "not-configured" or "audio-missing" =>
                    @"The speech-to-text engine isn't set up correctly. Run scripts\setup-dictation.ps1, then restart the API.",
                _ => "The speech-to-text engine could not make out the speech in this file. Try again in a minute."
            });

    private static string Fingerprint(string storageKey, int part) =>
        Convert.ToHexStringLower(SHA256.HashData(Encoding.UTF8.GetBytes(
            $"{storageKey}|part={part}|len={PartLength.TotalSeconds:0}")));

    public static string ToSubRip(IReadOnlyList<MediaTranscriptLine> lines)
    {
        var sb = new StringBuilder();
        for (var i = 0; i < lines.Count; i++)
        {
            sb.Append(i + 1).Append('\n')
              .Append(Timecode(lines[i].Start)).Append(" --> ").Append(Timecode(lines[i].End)).Append('\n')
              .Append(lines[i].Text).Append("\n\n");
        }
        return sb.ToString();
    }

    private static string Timecode(TimeSpan t) =>
        string.Create(CultureInfo.InvariantCulture,
            $"{(int)t.TotalHours:00}:{t.Minutes:00}:{t.Seconds:00},{t.Milliseconds:000}");
}
