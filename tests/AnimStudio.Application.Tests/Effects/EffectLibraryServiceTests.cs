using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Abstractions.Rendering;
using AnimStudio.Application.Abstractions.Storage;
using AnimStudio.Application.Common;
using AnimStudio.Application.Effects;
using AnimStudio.Application.Tests.Ai;
using AnimStudio.Application.Tests.Editing;
using AnimStudio.Domain.Assets;
using AnimStudio.Domain.Effects;
using AnimStudio.Domain.Projects;

namespace AnimStudio.Application.Tests.Effects;

public sealed class EffectLibraryServiceTests
{
    private static readonly DateTimeOffset Now = new(2026, 10, 22, 9, 0, 0, TimeSpan.Zero);

    private readonly InMemoryEffects _effects = new();
    private readonly FakeAssetRepository _assets = new();
    private readonly FakeProjectRepository _projects = new();
    private readonly FakeObjectStore _store = new();
    private readonly FakeProbe _probe = new();
    private readonly EffectLibraryService _service;

    public EffectLibraryServiceTests()
    {
        _projects.Items.Add(new Project { Id = "p1", UserId = "u1" });
        _projects.Items.Add(new Project { Id = "p2", UserId = "u1" });
        _projects.Items.Add(new Project { Id = "theirs", UserId = "u2" });
        _service = new EffectLibraryService(_effects, _assets, _projects, _store, _probe, new FakeThumbnailer(_store), new ManualTimeProvider(Now));
    }

    private static EffectUploadCommand Upload(string fileName, string type, byte[] bytes, string? category = null, bool green = false) =>
        new(null, category, ["#Subscribe"], green, fileName, type, bytes.Length, () => new MemoryStream(bytes));

    private Task<EffectClip> AddWebm(string user = "u1") =>
        _service.AddAsync(user, Upload("Like_button.webm", "video/webm", EffectRulesTests.WebmBytes()), default);

    [Fact]
    public async Task An_upload_is_stored_under_its_own_id_probed_and_given_a_thumbnail()
    {
        var effect = await AddWebm();

        Assert.Equal("Like button", effect.Name);
        Assert.Equal(EffectCategory.Overlay, effect.Category);
        Assert.Equal(["subscribe"], effect.Tags);
        Assert.Equal($"effects/{effect.Id}/clip.webm", effect.StorageKey);
        Assert.Equal($"effects/{effect.Id}/thumb.jpg", effect.ThumbnailKey);
        Assert.True(effect.Probe.HasAlpha);
        Assert.True(_store.Contents.ContainsKey(effect.StorageKey));
        Assert.Single(_effects.All);
    }

    [Fact]
    public async Task A_rejected_upload_leaves_no_bytes_behind()
    {
        _probe.Next = new MediaProbe { Width = 1920, Height = 1080, DurationSeconds = EffectRules.MaxDurationSeconds + 1 };

        var error = await Assert.ThrowsAsync<EditingException>(() => AddWebm());

        Assert.Equal("too-long", error.Code);
        Assert.Empty(_store.Contents);
        Assert.Empty(_effects.All);
    }

    [Fact]
    public async Task A_green_screen_upload_is_filed_and_flagged_as_one()
    {
        var effect = await _service.AddAsync("u1", Upload("green.mp4", "video/mp4", EffectRulesTests.Mp4Bytes(), green: true), default);

        Assert.Equal(EffectCategory.GreenScreen, effect.Category);
        Assert.True(effect.IsGreenScreen);
    }

    [Fact]
    public async Task Another_users_effect_is_refused_everywhere()
    {
        var effect = await AddWebm("u2");

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _service.GetAsync(effect.Id, "u1", default));
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            _service.UpdateAsync(effect.Id, "u1", new EffectUpdateCommand("Mine now", null, null, null, true), default));
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _service.DeleteAsync(effect.Id, "u1", default));
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _service.OpenAsync(effect.Id, "u1", false, default));
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _service.UseInProjectAsync(effect.Id, "u1", "p1", default));
        await Assert.ThrowsAsync<KeyNotFoundException>(() => _service.GetAsync("../" + effect.Id, "u2", default));
        Assert.Empty(await _service.ListAsync("u1", new EffectQuery(), default));
    }

    [Fact]
    public async Task An_effect_cannot_be_put_into_someone_elses_project()
    {
        var effect = await AddWebm();

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _service.UseInProjectAsync(effect.Id, "u1", "theirs", default));
        await Assert.ThrowsAsync<KeyNotFoundException>(() => _service.UseInProjectAsync(effect.Id, "u1", "global", default));
        Assert.Empty(_assets.Items);
    }

    [Fact]
    public async Task Using_an_effect_copies_it_once_per_project_and_counts_every_use()
    {
        var effect = await AddWebm();

        var first = await _service.UseInProjectAsync(effect.Id, "u1", "p1", default);
        var again = await _service.UseInProjectAsync(effect.Id, "u1", "p1", default);
        var other = await _service.UseInProjectAsync(effect.Id, "u1", "p2", default);

        Assert.False(first.Reused);
        Assert.True(again.Reused);
        Assert.Equal(first.Asset.Id, again.Asset.Id);
        Assert.NotEqual(first.Asset.Id, other.Asset.Id);
        Assert.Equal(3, _effects.All.Single().UseCount);

        var asset = first.Asset;
        Assert.Equal("Like button.webm", asset.Name);
        Assert.StartsWith("projects/p1/assets/", asset.StorageKey);
        Assert.EndsWith(".webm", asset.StorageKey);
        Assert.Equal(AssetReviewStatus.NotRequired, asset.ReviewStatus);
        Assert.Equal((EffectRules.ProvenanceProvider, effect.Id), (asset.Provenance!.SourceProvider, asset.Provenance.ExternalId));
        Assert.True(_store.Contents.ContainsKey(asset.StorageKey));
    }

    [Fact]
    public async Task Deleting_an_effect_removes_its_files_but_not_project_copies()
    {
        var effect = await AddWebm();
        var used = await _service.UseInProjectAsync(effect.Id, "u1", "p1", default);

        await _service.DeleteAsync(effect.Id, "u1", default);

        Assert.Empty(_effects.All);
        Assert.Contains(effect.StorageKey, _store.Deleted);
        Assert.Contains(effect.ThumbnailKey!, _store.Deleted);
        Assert.True(_store.Contents.ContainsKey(used.Asset.StorageKey));
    }

    [Fact]
    public async Task Edits_are_validated_and_partial()
    {
        var effect = await AddWebm();

        var edited = await _service.UpdateAsync(effect.Id, "u1", new EffectUpdateCommand(null, "EndScreen", null, true, true), default);

        Assert.Equal("Like button", edited.Name);
        Assert.Equal(EffectCategory.EndScreen, edited.Category);
        Assert.True(edited.IsGreenScreen && edited.Favorite);
        await Assert.ThrowsAsync<EditingException>(() =>
            _service.UpdateAsync(effect.Id, "u1", new EffectUpdateCommand(null, "SoundEffect", null, null, null), default));
    }

    [Fact]
    public async Task A_project_file_is_saved_to_the_library_once()
    {
        _store.Put("projects/p1/assets/a.mp3", [1, 2, 3]);
        _assets.Items.Add(new Asset
        {
            Id = "a1", ProjectId = "p1", Name = "ding.mp3", StorageKey = "projects/p1/assets/a.mp3",
            Kind = AssetKind.Audio, MimeType = "audio/mpeg", FileSizeBytes = 3,
            Probe = new MediaProbe { DurationSeconds = 1.2 }
        });

        var saved = await _service.SaveFromAssetAsync("u1", "p1", "a1", null, default);
        var again = await _service.SaveFromAssetAsync("u1", "p1", "a1", null, default);

        Assert.Equal(saved.Id, again.Id);
        Assert.Equal(EffectCategory.SoundEffect, saved.Category);
        Assert.Equal("ding", saved.Name);
        Assert.Equal($"effects/{saved.Id}/clip.mp3", saved.StorageKey);
        Assert.Single(_effects.All);

        // The asset must be in the named project, and the project the caller's.
        await Assert.ThrowsAsync<KeyNotFoundException>(() => _service.SaveFromAssetAsync("u1", "p2", "a1", null, default));
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _service.SaveFromAssetAsync("u2", "p1", "a1", null, default));
    }

    [Fact]
    public async Task Saving_a_copy_of_an_effect_returns_the_effect()
    {
        var effect = await AddWebm();
        var used = await _service.UseInProjectAsync(effect.Id, "u1", "p1", default);

        var saved = await _service.SaveFromAssetAsync("u1", "p1", used.Asset.Id, null, default);

        Assert.Equal(effect.Id, saved.Id);
        Assert.Single(_effects.All);
    }

    private sealed class FakeProbe : IMediaProbeService
    {
        public MediaProbe? Next { get; set; }

        public Task<MediaProbe> ProbeAsync(string storageKey, CancellationToken ct) =>
            Task.FromResult(Next ?? new MediaProbe { Width = 1920, Height = 1080, DurationSeconds = 3, HasAlpha = true });
    }

    private sealed class FakeThumbnailer(IObjectStore store) : IEffectThumbnailer
    {
        public async Task<bool> CreateAsync(string videoKey, string thumbnailKey, CancellationToken ct)
        {
            await store.SaveAsync(thumbnailKey, new MemoryStream([0xFF, 0xD8, 0xFF]), "image/jpeg", ct);
            return true;
        }
    }

    private sealed class InMemoryEffects : IEffectClipRepository
    {
        public List<EffectClip> All { get; } = [];

        public Task<EffectClip?> GetAsync(string id, CancellationToken ct) => Task.FromResult(All.FirstOrDefault(e => e.Id == id));

        public Task<IReadOnlyList<EffectClip>> ListByUserAsync(string userId, int limit, CancellationToken ct) =>
            Task.FromResult<IReadOnlyList<EffectClip>>([.. All.Where(e => e.UserId == userId).OrderByDescending(e => e.CreatedAt).Take(limit)]);

        public Task<EffectClip?> FindBySourceAssetAsync(string userId, string sourceAssetId, CancellationToken ct) =>
            Task.FromResult(All.FirstOrDefault(e => e.UserId == userId && e.SourceAssetId == sourceAssetId));

        public Task UpsertAsync(EffectClip effect, CancellationToken ct)
        {
            All.RemoveAll(e => e.Id == effect.Id);
            All.Add(effect);
            return Task.CompletedTask;
        }

        public Task<bool> DeleteAsync(string id, CancellationToken ct) => Task.FromResult(All.RemoveAll(e => e.Id == id) > 0);
    }
}
