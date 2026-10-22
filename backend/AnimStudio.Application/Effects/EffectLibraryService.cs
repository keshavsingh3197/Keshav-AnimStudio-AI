using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Abstractions.Rendering;
using AnimStudio.Application.Abstractions.Storage;
using AnimStudio.Application.Common;
using AnimStudio.Domain.Assets;
using AnimStudio.Domain.Effects;

namespace AnimStudio.Application.Effects;

/// <summary>Makes a small still from a stored video, for the library's cards.</summary>
public interface IEffectThumbnailer
{
    /// <summary>True when a thumbnail was stored at <paramref name="thumbnailKey"/>.</summary>
    Task<bool> CreateAsync(string videoKey, string thumbnailKey, CancellationToken ct);
}

/// <param name="Open">Opens the uploaded bytes from the start; called once to sniff and once to store.</param>
public sealed record EffectUploadCommand(
    string? Name,
    string? Category,
    IReadOnlyList<string>? Tags,
    bool IsGreenScreen,
    string? FileName,
    string? DeclaredContentType,
    long Length,
    Func<Stream> Open);

/// <summary>A partial edit: null leaves the field as it is.</summary>
public sealed record EffectUpdateCommand(
    string? Name,
    string? Category,
    IReadOnlyList<string>? Tags,
    bool? IsGreenScreen,
    bool? Favorite);

/// <summary>The project asset an effect became, and the effect with its use counted.</summary>
public sealed record EffectUseResult(Asset Asset, EffectClip Effect, bool Reused);

/// <summary>
/// The user's effects library: subscribe buttons, stingers, end screens, sound effects and
/// green-screen clips uploaded once and reused in every project.
/// <para>
/// Effects belong to a user, never to a project, and every call checks the caller owns the
/// effect - and, when one is named, the project. Using an effect copies its bytes into the
/// project as an ordinary asset, so a render still reads only its own project's files and
/// deleting the effect later never breaks a video it was used in.
/// </para>
/// </summary>
public sealed class EffectLibraryService(
    IEffectClipRepository effects,
    IAssetRepository assets,
    IProjectRepository projects,
    IObjectStore store,
    IMediaProbeService probe,
    IEffectThumbnailer thumbnails,
    TimeProvider clock)
{
    private DateTime Now => clock.GetUtcNow().UtcDateTime;

    public async Task<IReadOnlyList<EffectClip>> ListAsync(string userId, EffectQuery query, CancellationToken ct)
    {
        var mine = await effects.ListByUserAsync(userId, EffectRules.MaxEffectsPerUser, ct).ConfigureAwait(false);
        return EffectRules.Filter(mine, query);
    }

    public async Task<EffectClip> GetAsync(string id, string userId, CancellationToken ct)
    {
        if (!EffectRules.IsEffectId(id)) throw new KeyNotFoundException();
        var effect = await effects.GetAsync(id, ct).ConfigureAwait(false) ?? throw new KeyNotFoundException();
        if (!string.Equals(effect.UserId, userId, StringComparison.Ordinal)) throw new UnauthorizedAccessException();
        return effect;
    }

    /// <summary>Adds an uploaded file. The bytes decide what it is; the name and declared type are never trusted.</summary>
    public async Task<EffectClip> AddAsync(string userId, EffectUploadCommand command, CancellationToken ct)
    {
        if (command.Length <= 0)
            throw EditingException.Invalid("file-required", "Choose a file to upload.");
        if (command.Length > EffectRules.MaxVideoBytes)
            throw EditingException.Invalid("file-too-large", "Effects can be at most 200MB.");

        // Checked before the bytes are read, so a bad name doesn't cost an upload.
        var name = command.Name is null ? EffectRules.NameFromFile(command.FileName) : EffectRules.NormalizeName(command.Name);
        var tags = EffectRules.NormalizeTags(command.Tags);
        var category = EffectRules.ParseCategory(command.Category);

        await EnsureRoomAsync(userId, ct).ConfigureAwait(false);

        Uploads.UploadValidationResult validation;
        await using (var sniff = command.Open())
        {
            validation = await EffectRules.SniffAsync(command.FileName, command.DeclaredContentType, sniff, ct).ConfigureAwait(false);
        }
        if (!validation.IsValid) throw EditingException.Invalid(validation.Code!, validation.Message!);

        if (command.Length > EffectRules.MaxBytesFor(validation.Kind))
            throw EditingException.Invalid("file-too-large", "Stills and sounds can be at most 25MB.");

        var resolvedCategory = category ?? (command.IsGreenScreen ? EffectCategory.GreenScreen : EffectRules.DefaultCategory(validation.Kind));
        EffectRules.EnsureCategoryFits(resolvedCategory, validation.Kind);
        if (command.IsGreenScreen && validation.Kind == AssetKind.Audio)
            throw EditingException.Invalid("green-screen-audio", "A sound can't be a green-screen clip.");

        var effect = new EffectClip
        {
            Id = Guid.NewGuid().ToString("N"),
            UserId = userId,
            Name = name,
            Category = resolvedCategory,
            Kind = validation.Kind,
            Tags = tags,
            ContentType = validation.MimeType!,
            SizeBytes = command.Length,
            IsGreenScreen = command.IsGreenScreen || resolvedCategory == EffectCategory.GreenScreen,
            CreatedAt = Now,
            UpdatedAt = Now
        };
        effect.StorageKey = EffectRules.StorageKey(effect.Id, validation.CanonicalExtension!);

        await using (var content = command.Open())
        {
            await store.SaveAsync(effect.StorageKey, content, effect.ContentType, ct).ConfigureAwait(false);
        }

        return await FinishAsync(effect, probeNow: true, ct).ConfigureAwait(false);
    }

    /// <summary>
    /// Saves a file already in one of the caller's projects to the library, for a clip they
    /// made or imported there. Saving the same file again returns the first save.
    /// </summary>
    public async Task<EffectClip> SaveFromAssetAsync(string userId, string projectId, string assetId, string? category, CancellationToken ct)
    {
        await EnsureProjectOwnedAsync(projectId, userId, ct).ConfigureAwait(false);

        var asset = await assets.GetAsync(assetId, ct).ConfigureAwait(false) ?? throw new KeyNotFoundException();
        if (!string.Equals(asset.ProjectId, projectId, StringComparison.Ordinal)) throw new KeyNotFoundException();

        // A copy of one of the caller's own effects is already in the library.
        if (string.Equals(asset.Provenance?.SourceProvider, EffectRules.ProvenanceProvider, StringComparison.Ordinal)
            && asset.Provenance?.ExternalId is { } fromEffect
            && EffectRules.IsEffectId(fromEffect)
            && await effects.GetAsync(fromEffect, ct).ConfigureAwait(false) is { } original
            && string.Equals(original.UserId, userId, StringComparison.Ordinal))
        {
            return original;
        }

        if (await effects.FindBySourceAssetAsync(userId, asset.Id, ct).ConfigureAwait(false) is { } saved)
            return saved;

        if (!EffectRules.IsLibraryType(asset))
            throw EditingException.Invalid("file-type-not-allowed", "Only videos, stills and sounds can go in the effects library.");
        if (asset.FileSizeBytes > EffectRules.MaxBytesFor(asset.Kind))
            throw EditingException.Invalid("file-too-large", asset.Kind == AssetKind.Video
                ? "Effects can be at most 200MB."
                : "Stills and sounds can be at most 25MB.");

        var resolvedCategory = EffectRules.ParseCategory(category) ?? EffectRules.DefaultCategory(asset.Kind);
        EffectRules.EnsureCategoryFits(resolvedCategory, asset.Kind);
        await EnsureRoomAsync(userId, ct).ConfigureAwait(false);

        var effect = new EffectClip
        {
            Id = Guid.NewGuid().ToString("N"),
            UserId = userId,
            Name = EffectRules.NameFromFile(asset.Name),
            Category = resolvedCategory,
            Kind = asset.Kind,
            ContentType = asset.MimeType,
            SizeBytes = asset.FileSizeBytes,
            Probe = asset.Probe,
            IsGreenScreen = resolvedCategory == EffectCategory.GreenScreen,
            SourceAssetId = asset.Id,
            CreatedAt = Now,
            UpdatedAt = Now
        };
        effect.StorageKey = EffectRules.StorageKey(effect.Id, Path.GetExtension(asset.StorageKey).ToLowerInvariant());

        await using (var content = await store.OpenAsync(asset.StorageKey, ct).ConfigureAwait(false)
            ?? throw new KeyNotFoundException())
        {
            await store.SaveAsync(effect.StorageKey, content, effect.ContentType, ct).ConfigureAwait(false);
        }

        // An older asset may never have been probed.
        return await FinishAsync(effect, probeNow: effect.Probe.DurationSeconds is null && effect.Probe.Width is null, ct)
            .ConfigureAwait(false);
    }

    public async Task<EffectClip> UpdateAsync(string id, string userId, EffectUpdateCommand command, CancellationToken ct)
    {
        var effect = await GetAsync(id, userId, ct).ConfigureAwait(false);

        if (command.Name is not null) effect.Name = EffectRules.NormalizeName(command.Name);
        if (command.Tags is not null) effect.Tags = EffectRules.NormalizeTags(command.Tags);
        if (EffectRules.ParseCategory(command.Category) is { } category)
        {
            EffectRules.EnsureCategoryFits(category, effect.Kind);
            effect.Category = category;
        }
        if (command.IsGreenScreen is { } green)
        {
            if (green && effect.Kind == AssetKind.Audio)
                throw EditingException.Invalid("green-screen-audio", "A sound can't be a green-screen clip.");
            effect.IsGreenScreen = green;
        }
        if (command.Favorite is { } favorite) effect.Favorite = favorite;

        effect.UpdatedAt = Now;
        await effects.UpsertAsync(effect, ct).ConfigureAwait(false);
        return effect;
    }

    /// <summary>Deletes the effect and its stored bytes. Copies already in projects are their own files and stay.</summary>
    public async Task DeleteAsync(string id, string userId, CancellationToken ct)
    {
        var effect = await GetAsync(id, userId, ct).ConfigureAwait(false);

        // The record goes first: an orphaned blob wastes disk, an orphaned record is a broken card.
        await effects.DeleteAsync(effect.Id, ct).ConfigureAwait(false);
        await store.DeleteAsync(effect.StorageKey, ct).ConfigureAwait(false);
        if (effect.ThumbnailKey is { } thumb) await store.DeleteAsync(thumb, ct).ConfigureAwait(false);
    }

    /// <summary>The stored bytes (or the thumbnail) and their type, for the caller's own effect.</summary>
    public async Task<(Stream Content, string ContentType)> OpenAsync(string id, string userId, bool thumbnail, CancellationToken ct)
    {
        var effect = await GetAsync(id, userId, ct).ConfigureAwait(false);

        var (key, type) = thumbnail switch
        {
            true when effect.ThumbnailKey is { } thumb => (thumb, "image/jpeg"),
            true when effect.Kind == AssetKind.Image => (effect.StorageKey, effect.ContentType),
            true => throw new KeyNotFoundException(),
            false => (effect.StorageKey, effect.ContentType)
        };

        var stream = await store.OpenAsync(key, ct).ConfigureAwait(false) ?? throw new KeyNotFoundException();
        return (stream, type);
    }

    /// <summary>
    /// Puts the effect in the project as an ordinary asset the editor can place. Using the
    /// same effect in the same project again returns the copy already there.
    /// </summary>
    public async Task<EffectUseResult> UseInProjectAsync(string id, string userId, string projectId, CancellationToken ct)
    {
        var effect = await GetAsync(id, userId, ct).ConfigureAwait(false);
        await EnsureProjectOwnedAsync(projectId, userId, ct).ConfigureAwait(false);

        var existing = (await assets.ListByProjectAsync(projectId, ct).ConfigureAwait(false))
            .FirstOrDefault(a => IsCopyOf(a, effect.Id));

        var asset = existing;
        if (asset is null)
        {
            await using var content = await store.OpenAsync(effect.StorageKey, ct).ConfigureAwait(false)
                ?? throw new KeyNotFoundException();

            // Its own bytes, as a project-to-project copy gets: deleting the effect later must
            // never pull the file out from under a video that uses it.
            var storageKey = $"projects/{projectId}/assets/{Guid.NewGuid():n}{Path.GetExtension(effect.StorageKey)}";
            await store.SaveAsync(storageKey, content, effect.ContentType, ct).ConfigureAwait(false);

            var name = EffectRules.AssetNameFor(effect);
            asset = new Asset
            {
                ProjectId = projectId,
                Name = name,
                DisplayFileName = name,
                StorageKey = storageKey,
                Kind = effect.Kind,
                MimeType = effect.ContentType,
                FileSizeBytes = effect.SizeBytes,
                Probe = effect.Probe,
                // The user's own upload, so no licence review - the same as uploading it here.
                ReviewStatus = AssetReviewStatus.NotRequired,
                UsageScope = AssetUsageScope.SceneUse,
                Provenance = new AssetProvenance
                {
                    SourceProvider = EffectRules.ProvenanceProvider,
                    ExternalId = effect.Id,
                    FetchedAtUtc = Now,
                    FetchedByUserId = userId
                },
                CreatedAt = Now
            };
            await assets.InsertAsync(asset, ct).ConfigureAwait(false);
        }

        effect.UseCount++;
        effect.LastUsedAt = Now;
        await effects.UpsertAsync(effect, ct).ConfigureAwait(false);

        return new EffectUseResult(asset, effect, existing is not null);
    }

    private static bool IsCopyOf(Asset asset, string effectId) =>
        string.Equals(asset.Provenance?.SourceProvider, EffectRules.ProvenanceProvider, StringComparison.Ordinal)
        && string.Equals(asset.Provenance?.ExternalId, effectId, StringComparison.Ordinal);

    /// <summary>Probes, checks the length, makes a thumbnail and saves - removing the bytes if any check fails.</summary>
    private async Task<EffectClip> FinishAsync(EffectClip effect, bool probeNow, CancellationToken ct)
    {
        try
        {
            if (probeNow) effect.Probe = await probe.ProbeAsync(effect.StorageKey, ct).ConfigureAwait(false);

            if (effect.Kind != AssetKind.Image)
            {
                if (effect.Probe.DurationSeconds is not { } seconds || !double.IsFinite(seconds) || seconds <= 0)
                    throw EditingException.Invalid("file-unreadable", "That file couldn't be read as a video or sound.");
                if (seconds > EffectRules.MaxDurationSeconds)
                    throw EditingException.Invalid("too-long", "Effects can be at most 10 minutes long.");
            }

            // A WebM with only sound in it would be shown and placed as a video.
            if (effect.Kind == AssetKind.Video && effect.Probe.Width is null)
                throw EditingException.Invalid("no-picture", "That video has no picture. Use MP3, WAV or M4A for sounds.");

            if (effect.Kind == AssetKind.Video)
            {
                var thumbKey = EffectRules.ThumbnailKey(effect.Id);
                if (await thumbnails.CreateAsync(effect.StorageKey, thumbKey, ct).ConfigureAwait(false))
                    effect.ThumbnailKey = thumbKey;
            }

            await effects.UpsertAsync(effect, ct).ConfigureAwait(false);
            return effect;
        }
        catch
        {
            // Nothing points at the bytes yet, so they go with the failed add.
            await store.DeleteAsync(effect.StorageKey, CancellationToken.None).ConfigureAwait(false);
            if (effect.ThumbnailKey is { } thumb) await store.DeleteAsync(thumb, CancellationToken.None).ConfigureAwait(false);
            throw;
        }
    }

    private async Task EnsureRoomAsync(string userId, CancellationToken ct)
    {
        var mine = await effects.ListByUserAsync(userId, EffectRules.MaxEffectsPerUser, ct).ConfigureAwait(false);
        if (mine.Count >= EffectRules.MaxEffectsPerUser)
            throw EditingException.Invalid("library-full", $"The effects library holds up to {EffectRules.MaxEffectsPerUser} files. Delete some first.");
    }

    /// <summary>Only the caller's own projects; the shared global/system pseudo-projects are not targets.</summary>
    private async Task EnsureProjectOwnedAsync(string projectId, string userId, CancellationToken ct)
    {
        var project = await projects.GetAsync(projectId, ct).ConfigureAwait(false) ?? throw new KeyNotFoundException();
        if (!string.Equals(project.UserId, userId, StringComparison.Ordinal)) throw new UnauthorizedAccessException();
    }
}
