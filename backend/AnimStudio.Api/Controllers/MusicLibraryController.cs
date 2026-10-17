using AnimStudio.Api.Common;
using AnimStudio.Api.Contracts;
using AnimStudio.Application.Abstractions.Music;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Abstractions.Rendering;
using AnimStudio.Application.Abstractions.Storage;
using AnimStudio.Application.Ai;
using AnimStudio.Application.Music;
using AnimStudio.Application.Security;
using AnimStudio.Application.Uploads;
using AnimStudio.Domain.Assets;
using AnimStudio.Domain.Projects;
using AnimStudio.Infrastructure.Music;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace AnimStudio.Api.Controllers;

/// <summary>
/// The music picker: search royalty-free music (trending this week, all-time top, new, or by
/// genre, mood, tempo and length), preview it, and add a track to the project's library as an
/// ordinary audio asset - from there it is a background bed or a timed track like any upload.
/// <para>
/// Licences are decided here, against the project's own distribution settings, for every
/// result and again on import, so the browser can't add a track the project may not use.
/// </para>
/// </summary>
[ApiController]
public sealed class MusicLibraryController(
    IMusicCatalog catalog,
    IProjectRepository projects,
    IAssetRepository assets,
    IObjectStore store,
    IMediaProbeService probe,
    ICurrentUser currentUser,
    TimeProvider clock,
    IOptionsMonitor<MusicLibraryOptions> options,
    ILogger<MusicLibraryController> logger) : ControllerBase
{
    /// <summary>Each import downloads a whole track; a few at once is plenty.</summary>
    private static readonly SemaphoreSlim ImportSlots = new(2, 2);

    [HttpGet("api/music/options")]
    public ActionResult<ApiResponse<MusicOptionsResponse>> Options() =>
        Ok(ApiResponse<MusicOptionsResponse>.Ok(new MusicOptionsResponse(
            catalog.IsConfigured,
            catalog.ProviderId,
            MusicFilters.Genres,
            MusicFilters.Moods,
            MusicFilters.Tempos,
            MusicFilters.LengthOptions,
            [.. Enum.GetNames<MusicSort>()])));

    [HttpGet("api/projects/{projectId}/music/search")]
    public async Task<ActionResult<ApiResponse<MusicSearchResponse>>> Search(
        string projectId,
        [FromQuery] string? q, [FromQuery] string? genre, [FromQuery] string? mood, [FromQuery] string? tempo,
        [FromQuery] string? length, [FromQuery] bool instrumental, [FromQuery] string? sort, [FromQuery] int? page,
        CancellationToken ct)
    {
        var project = await LoadOwnedAsync(projectId, ct);

        var (query, field, error) = MusicFilters.Validate(
            new MusicFilters.Input(q, genre, mood, tempo, length, instrumental, sort, page),
            includeNonCommercial: project.Settings.DistributionIntent != DistributionIntent.Monetized);
        if (query is null)
            return BadRequest(ApiResponse<MusicSearchResponse>.Fail(error!, new ApiError("music-query-invalid", error!, Field: field)));

        try
        {
            var result = await catalog.SearchAsync(query, ct);
            var imported = await ImportedTrackIdsAsync(projectId, ct);
            return Ok(ApiResponse<MusicSearchResponse>.Ok(new MusicSearchResponse(
                [.. result.Tracks.Select(t => Describe(t, project.Settings, imported))],
                result.Page,
                result.HasMore,
                query.Sort.ToString())));
        }
        catch (MusicCatalogException ex)
        {
            return CatalogFailure<MusicSearchResponse>(ex);
        }
    }

    /// <summary>Downloads a track into the project's library; optionally makes it the background bed.</summary>
    [HttpPost("api/projects/{projectId}/music/import")]
    public async Task<ActionResult<ApiResponse<MusicImportResponse>>> Import(
        string projectId, [FromBody] MusicImportRequest? request, CancellationToken ct)
    {
        var project = await LoadOwnedAsync(projectId, ct);

        if (request?.TrackId is not { } trackId || trackId.Length is 0 or > 12 || !trackId.All(char.IsAsciiDigit))
            return Fail<MusicImportResponse>(StatusCodes.Status400BadRequest, "track-invalid", "Choose a track from the list.", "trackId");

        // Already in this project's library: reuse it rather than store the same file twice.
        var existing = (await assets.ListByProjectAsync(projectId, ct)).FirstOrDefault(a =>
            a.Provenance?.SourceProvider == catalog.ProviderId && a.Provenance.ExternalId == trackId);
        if (existing is not null)
        {
            var reused = request.UseAsBackground && await UseAsBackgroundAsync(project, existing.Id, ct);
            return Ok(ApiResponse<MusicImportResponse>.Ok(new MusicImportResponse(existing.ToResponse(), true, reused)));
        }

        try
        {
            // Looked up again by id: the licence and the download link come from the provider, never the browser.
            var track = await catalog.GetAsync(trackId, ct);
            if (track is null)
                return Fail<MusicImportResponse>(StatusCodes.Status404NotFound, "track-not-found", "That track is no longer available.", "trackId");

            if (MusicLicensing.WhyNotUsable(track.License, project.Settings) is { } blocked)
                return Fail<MusicImportResponse>(StatusCodes.Status422UnprocessableEntity, "music-license-blocked", blocked, "trackId");
            if (!track.Downloadable)
                return Fail<MusicImportResponse>(StatusCodes.Status422UnprocessableEntity, "music-not-downloadable",
                    "The artist doesn't allow this track to be downloaded. Pick another one.", "trackId");

            if (!await ImportSlots.WaitAsync(TimeSpan.FromSeconds(30), ct))
                return Fail<MusicImportResponse>(StatusCodes.Status429TooManyRequests, "music-busy",
                    "Other tracks are being added right now. Try again in a minute.");
            byte[] bytes;
            try
            {
                bytes = await catalog.DownloadAsync(track, Math.Clamp(options.CurrentValue.MaxDownloadMegabytes, 1, 100) * 1024L * 1024L, ct);
            }
            finally
            {
                ImportSlots.Release();
            }

            // The bytes decide what the file is; the provider's content type is a claim.
            if (AiAudioValidator.Sniff(bytes) != AiAudioValidator.Mp3)
            {
                logger.LogWarning("Music track {TrackId} from {Provider} wasn't an MP3", trackId, catalog.ProviderId);
                return Fail<MusicImportResponse>(StatusCodes.Status502BadGateway, "music-download-failed",
                    "The track couldn't be downloaded. Try another one.");
            }

            var storageKey = $"projects/{projectId}/assets/{Guid.NewGuid():n}.mp3";
            await using (var content = new MemoryStream(bytes, writable: false))
            {
                await store.SaveAsync(storageKey, content, AiAudioValidator.Mp3, ct);
            }

            var now = clock.GetUtcNow().UtcDateTime;
            var name = UploadValidator.SanitizeDisplayName($"{track.Title} - {track.Artist}.mp3");
            var asset = new Asset
            {
                ProjectId = projectId,
                Name = name,
                DisplayFileName = name,
                StorageKey = storageKey,
                Kind = AssetKind.Audio,
                MimeType = AiAudioValidator.Mp3,
                FileSizeBytes = bytes.LongLength,
                // Fetched online, so it needs approval - given here by the user choosing it after
                // seeing its licence, which the server has just checked against the project.
                ReviewStatus = AssetReviewStatus.Approved,
                UsageScope = AssetUsageScope.SceneUse,
                Provenance = new AssetProvenance
                {
                    SourceProvider = catalog.ProviderId,
                    ExternalId = track.Id,
                    SourceUrl = track.PageUrl,
                    LicenseCode = track.License.Code,
                    LicenseVersion = track.License.Version,
                    LicenseUrl = track.License.Url,
                    LicenseClass = track.License.Class,
                    AttributionText = MusicLicensing.Attribution(track),
                    CreatorName = track.Artist,
                    FetchedAtUtc = now,
                    FetchedByUserId = currentUser.UserId
                },
                CreatedAt = now
            };
            asset.Probe = await probe.ProbeAsync(storageKey, ct);
            if (asset.Probe.DurationSeconds is not > 0.5)
            {
                await store.DeleteAsync(storageKey, ct);
                return Fail<MusicImportResponse>(StatusCodes.Status502BadGateway, "music-download-failed",
                    "The downloaded track has no playable audio. Try another one.");
            }

            await assets.InsertAsync(asset, ct);
            var asBackground = request.UseAsBackground && await UseAsBackgroundAsync(project, asset.Id, ct);

            logger.LogInformation("User {UserId} added {Provider} track {TrackId} ({License}) to project {ProjectId} as asset {AssetId}",
                currentUser.UserId, catalog.ProviderId, track.Id, track.License.Code, projectId, asset.Id);
            return Ok(ApiResponse<MusicImportResponse>.Ok(new MusicImportResponse(asset.ToResponse(), false, asBackground)));
        }
        catch (MusicCatalogException ex)
        {
            return CatalogFailure<MusicImportResponse>(ex);
        }
    }

    private async Task<bool> UseAsBackgroundAsync(Project project, string assetId, CancellationToken ct)
    {
        project.Settings.BackgroundMusicAssetId = assetId;
        project.UpdatedAt = clock.GetUtcNow().UtcDateTime;
        await projects.ReplaceAsync(project, ct);
        return true;
    }

    /// <summary>Track id to asset id, for the tracks this project already has.</summary>
    private async Task<Dictionary<string, string>> ImportedTrackIdsAsync(string projectId, CancellationToken ct) =>
        (await assets.ListByProjectAsync(projectId, ct))
            .Where(a => a.Provenance?.SourceProvider == catalog.ProviderId && a.Provenance.ExternalId is not null)
            .DistinctBy(a => a.Provenance!.ExternalId!)
            .ToDictionary(a => a.Provenance!.ExternalId!, a => a.Id, StringComparer.Ordinal);

    private static MusicTrackResponse Describe(MusicTrack t, ProjectSettings settings, Dictionary<string, string> imported)
    {
        var blocked = MusicLicensing.WhyNotUsable(t.License, settings)
            ?? (t.Downloadable ? null : "The artist doesn't allow this track to be downloaded.");
        return new MusicTrackResponse(
            t.Provider, t.Id, t.Title, t.Artist, t.DurationSeconds, t.ImageUrl, t.PreviewUrl, t.PageUrl,
            t.License.Code, t.License.Version, t.License.Url, t.License.Class.ToString(),
            t.Genres, t.Moods, t.Instruments, t.Instrumental, t.Tempo, t.ReleaseDate,
            blocked is null, blocked, imported.GetValueOrDefault(t.Id));
    }

    private async Task<Project> LoadOwnedAsync(string projectId, CancellationToken ct)
    {
        var project = await projects.GetAsync(projectId, ct) ?? throw new KeyNotFoundException();
        if (!string.Equals(project.UserId, currentUser.UserId, StringComparison.Ordinal))
        {
            logger.LogWarning("User {UserId} tried to use the music library of project {ProjectId}, which is not theirs.",
                currentUser.UserId, projectId);
            throw new UnauthorizedAccessException();
        }
        return project;
    }

    private ObjectResult CatalogFailure<T>(MusicCatalogException ex) => Fail<T>(ex.Code switch
    {
        "music-not-configured" => StatusCodes.Status503ServiceUnavailable,
        "music-too-large" or "music-not-downloadable" => StatusCodes.Status422UnprocessableEntity,
        _ => StatusCodes.Status502BadGateway
    }, ex.Code, ex.Message);

    private ObjectResult Fail<T>(int status, string code, string message, string? field = null) =>
        StatusCode(status, ApiResponse<T>.Fail(message, new ApiError(code, message, Field: field)));
}

public sealed record MusicOptionsResponse(
    bool Configured,
    string Provider,
    IReadOnlyList<MusicFilterOption> Genres,
    IReadOnlyList<MusicFilterOption> Moods,
    IReadOnlyList<MusicFilterOption> Tempos,
    IReadOnlyList<MusicFilterOption> Lengths,
    IReadOnlyList<string> Sorts);

public sealed record MusicTrackResponse(
    string Provider,
    string Id,
    string Title,
    string Artist,
    double DurationSeconds,
    string? ImageUrl,
    string? PreviewUrl,
    string? PageUrl,
    string LicenseCode,
    string? LicenseVersion,
    string? LicenseUrl,
    string LicenseClass,
    IReadOnlyList<string> Genres,
    IReadOnlyList<string> Moods,
    IReadOnlyList<string> Instruments,
    bool Instrumental,
    string? Tempo,
    string? ReleaseDate,
    /// <summary>Whether this project may use it; when false, <see cref="BlockedReason"/> says why.</summary>
    bool Usable,
    string? BlockedReason,
    /// <summary>The library asset this track was added as, if it already was.</summary>
    string? AssetId);

public sealed record MusicSearchResponse(IReadOnlyList<MusicTrackResponse> Tracks, int Page, bool HasMore, string Sort);

public sealed record MusicImportRequest(string? TrackId, bool UseAsBackground);

public sealed record MusicImportResponse(AssetResponse Asset, bool AlreadyAdded, bool UsedAsBackground);
