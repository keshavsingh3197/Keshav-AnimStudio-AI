using System.Security.Cryptography;
using System.Text;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Abstractions.Transcripts;
using AnimStudio.Application.Options;
using AnimStudio.Application.Scripts;
using AnimStudio.Domain.Assets;
using AnimStudio.Domain.Ingest;
using AnimStudio.Domain.Scripts;
using AnimStudio.Domain.Transcripts;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AnimStudio.Application.Ingest;

/// <summary>
/// Turns a transcript source into a persisted <see cref="Script"/>.
/// </summary>
public sealed class TranscriptIngestService(
    IIngestRepository ingests,
    IScriptRepository scripts,
    IProjectRepository projects,
    IAssetRepository assets,
    ISegmentationEngine segmentation,
    Func<TranscriptSourceKind, ITranscriptSource> sourceResolver,
    IOptions<IngestOptions> ingestOptions,
    IOptions<SegmentationOptions> segmentationOptions,
    TimeProvider clock,
    ILogger<TranscriptIngestService> logger)
{
    private readonly IngestOptions _options = ingestOptions.Value;

    public async Task<IngestResult> CreateAsync(CreateIngestCommand command, CancellationToken ct)
    {
        var project = await projects.GetAsync(command.ProjectId, ct).ConfigureAwait(false)
            ?? throw new TranscriptIngestException("project-not-found", "That project does not exist.");

        // Ownership is enforced here, server-side, on every ingest: an id being hard to
        // guess is not an authorization control.
        if (!string.Equals(project.UserId, command.UserId, StringComparison.Ordinal))
            throw new TranscriptIngestException("forbidden", "You do not have access to that project.");

        // A client retry must return the same ingest rather than creating a second one.
        if (!string.IsNullOrWhiteSpace(command.IdempotencyKey))
        {
            var existing = await ingests
                .FindByIdempotencyKeyAsync(command.ProjectId, command.IdempotencyKey, ct)
                .ConfigureAwait(false);

            if (existing is not null)
            {
                return new IngestResult(existing.Id, existing.ScriptId, existing.CueCount, 0,
                    existing.TimingSource, existing.TimingSource == TimingSource.Real,
                    existing.Warnings);
            }
        }

        var now = clock.GetUtcNow().UtcDateTime;
        var attestation = BuildAttestation(command, now);

        // Resolved here, before the ingest record exists, so an unusable reference fails
        // the request rather than leaving a Failed ingest behind.
        var subtitleKey = command.Source == TranscriptSourceKind.SubtitleFile
            ? await ResolveSubtitleKeyAsync(command, ct).ConfigureAwait(false)
            : null;

        Uri? canonicalUrl = null;
        string? urlHash = null;
        string? videoId = null;

        if (command.Source == TranscriptSourceKind.YouTubeCaptions)
        {
            if (!_options.AllowUrlIngest)
                throw new TranscriptIngestException("url-ingest-disabled",
                    "Importing from a URL is not enabled on this server.");

            var validated = YouTubeUrlValidator.Validate(command.Url, _options.AllowHttpUrls);
            if (!validated.IsValid)
                throw new TranscriptIngestException(validated.ErrorCode ?? "url-invalid",
                    "That does not look like a YouTube video link.");

            canonicalUrl = new Uri(validated.CanonicalUrl!);
            urlHash = validated.UrlHash;
            videoId = validated.VideoId;

            var duplicate = await ingests
                .FindBySourceUrlHashAsync(command.ProjectId, urlHash!, ct).ConfigureAwait(false);

            if (duplicate is not null)
            {
                logger.LogInformation(
                    "Video already ingested for project {ProjectId}; returning ingest {IngestId}.",
                    command.ProjectId, duplicate.Id);

                return new IngestResult(duplicate.Id, duplicate.ScriptId, duplicate.CueCount, 0,
                    duplicate.TimingSource, duplicate.TimingSource == TimingSource.Real,
                    ["This video was already imported; the existing transcript was reused."]);
            }
        }

        var ingest = new TranscriptIngest
        {
            ProjectId = command.ProjectId,
            UserId = command.UserId,
            Status = IngestStatus.Processing,
            SourceKind = command.Source,
            IdempotencyKey = command.IdempotencyKey,
            SourceUrlNormalized = canonicalUrl?.AbsoluteUri,
            SourceUrlHash = urlHash,
            SourceVideoId = videoId,
            // Captions-only unless a media download was both requested and permitted.
            CaptionsOnly = !command.IncludeMedia || !_options.AllowMediaDownload,
            MediaAssetId = command.MediaAssetId,
            RightsAttestation = attestation,
            CreatedAt = now
        };

        await ingests.InsertAsync(ingest, ct).ConfigureAwait(false);

        try
        {
            var source = sourceResolver(command.Source);

            var fetched = await source.FetchAsync(new TranscriptFetchRequest
            {
                IngestId = ingest.Id,
                ProjectId = command.ProjectId,
                Kind = command.Source,
                RawText = command.Text,
                ArtifactObjectKey = subtitleKey,
                CanonicalUrl = canonicalUrl,
                LanguagePreference = _options.PreferredCaptionLanguages,
                IncludeMedia = command.IncludeMedia
            }, ct).ConfigureAwait(false);

            var script = BuildScript(ingest, fetched, now);
            await scripts.InsertAsync(script, ct).ConfigureAwait(false);

            ingest.Status = IngestStatus.Completed;
            ingest.CueCount = fetched.Cues.Count;
            ingest.ScriptId = script.Id;
            ingest.ContentHash = script.ContentHash;
            ingest.TimingSource = fetched.TimingSource;
            ingest.CaptionLanguage = fetched.Language;
            ingest.CaptionIsAutoGenerated = fetched.IsAutoGenerated;
            ingest.RawArtifactObjectKey = fetched.RawArtifactObjectKey;
            ingest.RawArtifactSha256 = fetched.RawArtifactSha256;
            ingest.SourceChannelKey = fetched.SourceChannelKey;
            ingest.SourceTitle = fetched.SourceTitle;
            ingest.SourceVideoId ??= fetched.SourceVideoId;
            ingest.ToolName = fetched.ToolName;
            ingest.ToolVersion = fetched.ToolVersion;
            ingest.Warnings = [.. fetched.Warnings];
            ingest.CompletedAt = clock.GetUtcNow().UtcDateTime;

            await ingests.ReplaceAsync(ingest, ct).ConfigureAwait(false);

            return new IngestResult(ingest.Id, script.Id, fetched.Cues.Count, script.Segments.Count,
                fetched.TimingSource, script.HasSourceTimings, ingest.Warnings);
        }
        catch (Exception ex)
        {
            ingest.Status = IngestStatus.Failed;
            ingest.ErrorCode = ex is TranscriptIngestException typed ? typed.Code : "ingest-failed";
            ingest.CompletedAt = clock.GetUtcNow().UtcDateTime;

            await ingests.ReplaceAsync(ingest, CancellationToken.None).ConfigureAwait(false);
            throw;
        }
    }

    /// <summary>
    /// Turns the caller's asset id into a storage key, refusing anything that is not this
    /// project's own subtitle file.
    /// </summary>
    private async Task<string> ResolveSubtitleKeyAsync(
        CreateIngestCommand command, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(command.SubtitleAssetId))
            throw new TranscriptIngestException("file-required", "Upload a subtitle file to continue.");

        var asset = await assets.GetAsync(command.SubtitleAssetId, ct).ConfigureAwait(false);

        if (asset is null
            || !string.Equals(asset.ProjectId, command.ProjectId, StringComparison.Ordinal))
        {
            throw new TranscriptIngestException("file-missing",
                "That subtitle file is not in this project.");
        }

        if (asset.Kind != AssetKind.Subtitle)
            throw new TranscriptIngestException("file-not-subtitle",
                $"'{asset.Name}' is not a subtitle file.");

        return asset.StorageKey;
    }

    private RightsAttestation? BuildAttestation(CreateIngestCommand command, DateTime now)
    {
        // Only URL ingest asserts rights over someone else's upload; pasted text and an
        // uploaded file are the user's own material by construction.
        var needsAttestation = _options.RequireRightsAttestation
                               && command.Source == TranscriptSourceKind.YouTubeCaptions;

        if (!needsAttestation) return null;

        var supplied = command.RightsAttestation
            ?? throw new TranscriptIngestException("attestation-required",
                "Confirm you have the right to use this video before importing it.");

        if (!supplied.IsOwnerOrLicensed)
            throw new TranscriptIngestException("attestation-required",
                "Confirm you have the right to use this video before importing it.");

        if (!RightsBasis.IsValid(supplied.BasisCode))
            throw new TranscriptIngestException("attestation-basis-invalid",
                "Select how you are entitled to use this video.");

        return new RightsAttestation
        {
            IsOwnerOrLicensed = true,
            BasisCode = supplied.BasisCode,
            BasisNotes = Truncate(supplied.BasisNotes, 1000),
            AttestedByUserId = command.UserId,
            AttestedByName = Truncate(supplied.AttestedByName, 200),
            AcceptedTermsVersion = string.IsNullOrWhiteSpace(supplied.AcceptedTermsVersion)
                ? _options.TermsVersion
                : supplied.AcceptedTermsVersion,
            AttestedAtUtc = now,
            // Snapshot of the policy AT THE TIME, so "media download was off back then" is
            // provable rather than merely asserted.
            ConfigAllowMediaDownload = _options.AllowMediaDownload,
            ConfigYtDlpEnabled = _options.YtDlp.Enabled,
            IncludeMediaRequested = command.IncludeMedia
        };
    }

    private Script BuildScript(TranscriptIngest ingest, TranscriptFetchResult fetched, DateTime now)
    {
        var options = segmentationOptions.Value;
        var segments = segmentation.Segment(fetched.Cues, options);

        var lineageId = Guid.NewGuid().ToString("n");

        return new Script
        {
            ProjectId = ingest.ProjectId,
            IngestId = ingest.Id,
            ScriptLineageId = lineageId,
            Version = 1,
            Status = ScriptStatus.Draft,
            TimingSource = fetched.TimingSource,
            // Synthesized timings do not correspond to real media, so audio slicing is off
            // for the whole script rather than per scene.
            HasSourceTimings = fetched.TimingSource == TimingSource.Real,
            SegmentationOptionsHash = options.ComputeHash(),
            ContentHash = ComputeContentHash(fetched.Cues),
            Segments = [.. segments],
            Warnings = [.. fetched.Warnings],
            CreatedAt = now,
            UpdatedAt = now
        };
    }

    /// <summary>
    /// Hashes the cue stream rather than the URL: the same video's auto-captions improve
    /// over time, so the URL is a poor proxy for "did anything actually change".
    /// </summary>
    private static string ComputeContentHash(IReadOnlyList<TranscriptCue> cues)
    {
        var builder = new StringBuilder();
        foreach (var cue in cues)
        {
            builder.Append(cue.Index).Append('|')
                   .Append((long)cue.Start.TotalMilliseconds).Append('|')
                   .Append((long)cue.End.TotalMilliseconds).Append('|')
                   .Append(cue.SpeakerLabel ?? string.Empty).Append('|')
                   .Append(cue.Text).Append('\n');
        }

        return Convert.ToHexStringLower(SHA256.HashData(Encoding.UTF8.GetBytes(builder.ToString())));
    }

    private static string? Truncate(string? value, int max) =>
        string.IsNullOrWhiteSpace(value) ? null
        : value.Length <= max ? value.Trim() : value[..max].Trim();
}
