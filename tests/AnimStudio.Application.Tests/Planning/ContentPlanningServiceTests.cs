using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Common;
using AnimStudio.Application.Planning;
using AnimStudio.Application.Tests.Ai;
using AnimStudio.Application.Tests.Editing;
using AnimStudio.Domain.Planning;

namespace AnimStudio.Application.Tests.Planning;

public sealed class ContentPlanningServiceTests
{
    private static readonly DateTimeOffset Now = new(2026, 10, 21, 10, 0, 0, TimeSpan.Zero);

    private readonly InMemoryTopics _topics = new();
    private readonly InMemoryItems _items = new();
    private readonly InMemoryLinks _links = new();
    private readonly ContentPlanningService _service;

    public ContentPlanningServiceTests() =>
        _service = new ContentPlanningService(_topics, _items, _links, new FakeProjectRepository(), new ManualTimeProvider(Now));

    private static ContentTopicCommand Weekly(string name = "Monday motivation") =>
        new(name, null, "#FF0000", null, null, [DayOfWeek.Monday], "18:00", "Asia/Kolkata", 3, 14,
            true, true, ["#motivation", "#motivation"], ["Script", "Record"], false);

    [Fact]
    public async Task Creating_a_topic_plans_its_slots_with_the_default_checklist()
    {
        var topic = await _service.CreateTopicAsync("u1", Weekly(), default);

        Assert.Equal("#ff0000", topic.Color);
        Assert.Single(topic.Tags);
        Assert.Equal(2, _items.All.Count);
        Assert.All(_items.All, i => Assert.Equal(["Script", "Record"], i.Checklist.Select(c => c.Text)));

        // Planning again adds nothing.
        Assert.Equal(0, await _service.PlanSlotsAsync(topic, default));
    }

    [Fact]
    public async Task Deleting_a_planned_slot_keeps_it_from_coming_back()
    {
        var topic = await _service.CreateTopicAsync("u1", Weekly(), default);
        var first = _items.All.OrderBy(i => i.PublishAt).First();

        await _service.DeleteItemAsync(first.Id, "u1", default);

        Assert.Equal(0, await _service.PlanSlotsAsync(topic, default));
        Assert.Single(_items.All);
    }

    [Fact]
    public async Task Another_users_topic_and_post_are_refused()
    {
        var topic = await _service.CreateTopicAsync("u1", Weekly(), default);
        var post = _items.All[0];

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _service.GetTopicAsync(topic.Id, "u2", default));
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _service.SetStatusAsync(post.Id, "u2", ContentPlanStatus.Ready, default));
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _service.ResolveTargetsAsync("u2", topic.Id, null, default));
    }

    [Fact]
    public async Task Invalid_topic_input_is_rejected()
    {
        await Assert.ThrowsAsync<EditingException>(() =>
            _service.CreateTopicAsync("u1", Weekly() with { TimeZone = "Mars/Olympus" }, default));
        await Assert.ThrowsAsync<EditingException>(() =>
            _service.CreateTopicAsync("u1", Weekly() with { PublishTime = "25:00" }, default));
        await Assert.ThrowsAsync<EditingException>(() =>
            _service.CreateTopicAsync("u1", Weekly() with { ChannelId = "not-a-channel" }, default));
    }

    [Fact]
    public async Task A_topic_with_posts_needs_explicit_confirmation_to_delete()
    {
        var topic = await _service.CreateTopicAsync("u1", Weekly(), default);
        await Assert.ThrowsAsync<EditingException>(() => _service.DeleteTopicAsync(topic.Id, "u1", false, default));

        await _service.DeleteTopicAsync(topic.Id, "u1", true, default);
        Assert.Empty(_items.All);
        Assert.Empty(_topics.All);
    }

    [Fact]
    public async Task Marking_ready_records_when()
    {
        await _service.CreateTopicAsync("u1", Weekly(), default);
        var view = await _service.SetStatusAsync(_items.All[0].Id, "u1", ContentPlanStatus.Ready, default);

        Assert.Equal(ContentPlanStatus.Ready, view.Item.Status);
        Assert.Equal(Now.UtcDateTime, view.Item.ReadyAt);

        view = await _service.SetStatusAsync(view.Item.Id, "u1", ContentPlanStatus.InProgress, default);
        Assert.Null(view.Item.ReadyAt);
    }

    [Fact]
    public async Task The_same_download_is_one_link_counted_twice_and_keeps_its_topic()
    {
        var topic = await _service.CreateTopicAsync("u1", Weekly(), default);
        const string url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

        await _service.CaptureDownloadAsync("u1", url, "youtube", "YouTube", "A song", topic.Id, null, null, null, default);
        var again = await _service.CaptureDownloadAsync("u1", url, "youtube", "YouTube", "A song", null, null, null, null, default);

        Assert.Single(_links.All);
        Assert.Equal(2, again.DownloadCount);
        Assert.Equal(topic.Id, again.TopicId);
        Assert.Equal("A song", again.Title);

        // Another user downloading the same link gets their own record.
        await _service.CaptureDownloadAsync("u2", url, "youtube", "YouTube", "A song", null, null, null, null, default);
        Assert.Equal(2, _links.All.Count);
    }

    [Fact]
    public async Task Manual_links_are_canonicalised_and_must_be_https()
    {
        var media = await _service.AddLinkAsync("u1", new ContentLinkCommand("https://youtu.be/dQw4w9WgXcQ?si=xyz", null, null, null, null, false), default);
        Assert.Equal("https://www.youtube.com/watch?v=dQw4w9WgXcQ", media.Url);
        Assert.Equal("youtube", media.PlatformId);

        var page = await _service.AddLinkAsync("u1", new ContentLinkCommand("https://example.com/article", "Idea", null, null, null, false), default);
        Assert.Null(page.PlatformId);
        Assert.Equal("example.com", page.PlatformName);

        await Assert.ThrowsAsync<EditingException>(() =>
            _service.AddLinkAsync("u1", new ContentLinkCommand("javascript:alert(1)", null, null, null, null, false), default));
        await Assert.ThrowsAsync<EditingException>(() =>
            _service.AddLinkAsync("u1", new ContentLinkCommand("http://example.com", null, null, null, null, false), default));
    }

    // ---------------------------------------------------------------- in-memory stores

    private sealed class InMemoryTopics : IContentTopicRepository
    {
        public List<ContentTopic> All { get; } = [];
        public Task<ContentTopic?> GetAsync(string id, CancellationToken ct) => Task.FromResult(All.FirstOrDefault(t => t.Id == id));
        public Task<IReadOnlyList<ContentTopic>> ListByUserAsync(string userId, CancellationToken ct) =>
            Task.FromResult<IReadOnlyList<ContentTopic>>([.. All.Where(t => t.UserId == userId)]);
        public Task<IReadOnlyList<ContentTopic>> ListActiveAsync(int limit, CancellationToken ct) =>
            Task.FromResult<IReadOnlyList<ContentTopic>>([.. All.Where(t => !t.Archived).Take(limit)]);
        public Task UpsertAsync(ContentTopic topic, CancellationToken ct)
        {
            All.RemoveAll(t => t.Id == topic.Id);
            All.Add(topic);
            return Task.CompletedTask;
        }
        public Task<bool> DeleteAsync(string id, CancellationToken ct) => Task.FromResult(All.RemoveAll(t => t.Id == id) > 0);
    }

    private sealed class InMemoryItems : IContentPlanItemRepository
    {
        public List<ContentPlanItem> All { get; } = [];
        public Task<ContentPlanItem?> GetAsync(string id, CancellationToken ct) => Task.FromResult(All.FirstOrDefault(i => i.Id == id));
        public Task<IReadOnlyList<ContentPlanItem>> ListByUserAsync(string userId, DateTime fromUtc, DateTime toUtc, string? topicId, int limit, CancellationToken ct) =>
            Task.FromResult<IReadOnlyList<ContentPlanItem>>([.. All.Where(i => i.UserId == userId && i.PublishAt >= fromUtc && i.PublishAt < toUtc
                && (topicId == null || i.TopicId == topicId)).OrderBy(i => i.PublishAt).Take(limit)]);
        public Task<IReadOnlyList<ContentPlanItem>> ListByTopicAsync(string topicId, int limit, CancellationToken ct) =>
            Task.FromResult<IReadOnlyList<ContentPlanItem>>([.. All.Where(i => i.TopicId == topicId).Take(limit)]);
        public Task<IReadOnlyList<ContentPlanItem>> ListInWindowAsync(DateTime fromUtc, DateTime toUtc, int limit, CancellationToken ct) =>
            Task.FromResult<IReadOnlyList<ContentPlanItem>>([.. All.Where(i => i.PublishAt >= fromUtc && i.PublishAt < toUtc).Take(limit)]);
        public Task<ContentPlanItem?> FindByVideoIdAsync(string userId, string videoId, CancellationToken ct) =>
            Task.FromResult(All.FirstOrDefault(i => i.UserId == userId && i.VideoId == videoId));
        public Task UpsertAsync(ContentPlanItem item, CancellationToken ct)
        {
            All.RemoveAll(i => i.Id == item.Id);
            All.Add(item);
            return Task.CompletedTask;
        }
        public Task<bool> DeleteAsync(string id, CancellationToken ct) => Task.FromResult(All.RemoveAll(i => i.Id == id) > 0);
        public Task<int> DeleteByTopicAsync(string topicId, CancellationToken ct) => Task.FromResult(All.RemoveAll(i => i.TopicId == topicId));
    }

    private sealed class InMemoryLinks : IContentSourceLinkRepository
    {
        public List<ContentSourceLink> All { get; } = [];
        public Task<ContentSourceLink?> GetAsync(string id, CancellationToken ct) => Task.FromResult(All.FirstOrDefault(l => l.Id == id));
        public Task<ContentSourceLink?> FindByUrlHashAsync(string userId, string urlHash, CancellationToken ct) =>
            Task.FromResult(All.FirstOrDefault(l => l.UserId == userId && l.UrlHash == urlHash));
        public Task<IReadOnlyList<ContentSourceLink>> ListByUserAsync(string userId, string? topicId, string? planItemId, int limit, CancellationToken ct) =>
            Task.FromResult<IReadOnlyList<ContentSourceLink>>([.. All.Where(l => l.UserId == userId
                && (topicId == null || l.TopicId == topicId) && (planItemId == null || l.PlanItemId == planItemId)).Take(limit)]);
        public Task UpsertAsync(ContentSourceLink link, CancellationToken ct)
        {
            All.RemoveAll(l => l.Id == link.Id);
            All.Add(link);
            return Task.CompletedTask;
        }
        public Task<bool> DeleteAsync(string id, CancellationToken ct) => Task.FromResult(All.RemoveAll(l => l.Id == id) > 0);
    }
}
