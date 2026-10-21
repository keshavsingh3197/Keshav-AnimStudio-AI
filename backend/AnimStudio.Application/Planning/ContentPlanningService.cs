using System.Text.RegularExpressions;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Common;
using AnimStudio.Application.Media;
using AnimStudio.Domain.Planning;

namespace AnimStudio.Application.Planning;

public sealed record ContentTopicCommand(
    string Name,
    string? Description,
    string? Color,
    string? ChannelId,
    string? ChannelTitle,
    IReadOnlyList<DayOfWeek>? Days,
    string? PublishTime,
    string? TimeZone,
    int LeadDays,
    int PlanAheadDays,
    bool AutoSchedule,
    bool AutoLinkUploads,
    IReadOnlyList<string>? Tags,
    IReadOnlyList<string>? Checklist,
    bool Archived);

public sealed record ContentPlanItemCommand(
    string TopicId,
    string Title,
    string? Notes,
    DateTime PublishAt,
    ContentPlanStatus Status,
    IReadOnlyList<ContentChecklistItem>? Checklist,
    string? ProjectId,
    string? FileLink);

public sealed record ContentLinkCommand(
    string? Url,
    string? Title,
    string? Note,
    string? TopicId,
    string? PlanItemId,
    bool Used);

/// <summary>A planned post with what it needs, ready for the API to shape.</summary>
public sealed record ContentPlanItemView(ContentPlanItem Item, DateTime PrepareBy, IReadOnlyList<ContentAttention> Attention);

/// <summary>
/// The content calendar: topics with a cadence, the posts they plan, and the source links
/// kept for each. Every call is scoped to the caller; the YouTube side (linking, schedule
/// sync) lives in Infrastructure because it needs the channel's OAuth token.
/// </summary>
public sealed partial class ContentPlanningService(
    IContentTopicRepository topics,
    IContentPlanItemRepository items,
    IContentSourceLinkRepository links,
    IProjectRepository projects,
    TimeProvider clock)
{
    public const int MaxTopicsPerUser = 50;
    public const int MaxItemsPerList = 1000;
    public const int MaxLinksPerList = 500;
    private const int MaxDismissedSlots = 400;

    private DateTime Now => clock.GetUtcNow().UtcDateTime;

    // ---------------------------------------------------------------- topics

    public Task<IReadOnlyList<ContentTopic>> ListTopicsAsync(string userId, CancellationToken ct) =>
        topics.ListByUserAsync(userId, ct);

    public async Task<ContentTopic> GetTopicAsync(string id, string userId, CancellationToken ct)
    {
        var topic = await topics.GetAsync(id, ct) ?? throw new KeyNotFoundException();
        if (!string.Equals(topic.UserId, userId, StringComparison.Ordinal)) throw new UnauthorizedAccessException();
        return topic;
    }

    public async Task<ContentTopic> CreateTopicAsync(string userId, ContentTopicCommand command, CancellationToken ct)
    {
        var existing = await topics.ListByUserAsync(userId, ct);
        if (existing.Count >= MaxTopicsPerUser)
            throw EditingException.Conflict("topic-limit", $"You can have up to {MaxTopicsPerUser} topics. Archive or delete one first.");

        var topic = new ContentTopic { Id = Guid.NewGuid().ToString("N"), UserId = userId, CreatedAt = Now };
        Apply(topic, command);
        topic.UpdatedAt = topic.CreatedAt;
        await topics.UpsertAsync(topic, ct);
        await PlanSlotsAsync(topic, ct);
        return topic;
    }

    public async Task<ContentTopic> UpdateTopicAsync(string id, string userId, ContentTopicCommand command, CancellationToken ct)
    {
        var topic = await GetTopicAsync(id, userId, ct);
        var previousChannel = topic.ChannelId;
        Apply(topic, command);
        topic.UpdatedAt = Now;
        await topics.UpsertAsync(topic, ct);

        if (!string.Equals(previousChannel, topic.ChannelId, StringComparison.Ordinal))
        {
            // Upcoming posts without a video follow the topic to its new channel.
            foreach (var post in await items.ListByTopicAsync(topic.Id, MaxItemsPerList, ct))
            {
                if (post.VideoId is not null || post.PublishAt <= Now) continue;
                post.ChannelId = topic.ChannelId;
                await items.UpsertAsync(post, ct);
            }
        }

        await PlanSlotsAsync(topic, ct);
        return topic;
    }

    /// <summary>Deletes the topic. Its posts go too when <paramref name="deletePosts"/>; its links are kept, unassigned.</summary>
    public async Task DeleteTopicAsync(string id, string userId, bool deletePosts, CancellationToken ct)
    {
        var topic = await GetTopicAsync(id, userId, ct);
        var posts = await items.ListByTopicAsync(topic.Id, MaxItemsPerList, ct);
        if (posts.Count > 0 && !deletePosts)
            throw EditingException.Conflict("topic-has-posts",
                $"This topic has {posts.Count} planned post(s). Delete them with it, or archive the topic instead.");

        foreach (var link in await links.ListByUserAsync(userId, topic.Id, null, MaxLinksPerList, ct))
        {
            link.TopicId = null;
            link.PlanItemId = null;
            await links.UpsertAsync(link, ct);
        }
        await items.DeleteByTopicAsync(topic.Id, ct);
        await topics.DeleteAsync(topic.Id, ct);
    }

    /// <summary>Adds the posts the topic's cadence asks for and the calendar doesn't have yet. Returns how many.</summary>
    public async Task<int> PlanSlotsAsync(ContentTopic topic, CancellationToken ct)
    {
        if (topic.Archived || topic.Days.Count == 0) return 0;
        var existing = await items.ListByTopicAsync(topic.Id, MaxItemsPerList, ct);
        var missing = ContentPlanRules.MissingSlots(topic, existing, Now);
        foreach (var slot in missing)
        {
            await items.UpsertAsync(new ContentPlanItem
            {
                Id = Guid.NewGuid().ToString("N"),
                UserId = topic.UserId,
                TopicId = topic.Id,
                Title = ContentPlanRules.SlotTitle(topic, slot.LocalDate),
                PublishAt = slot.PublishAtUtc,
                SlotKey = slot.SlotKey,
                ChannelId = topic.ChannelId,
                Checklist = [.. topic.Checklist.Select(t => new ContentChecklistItem { Text = t })],
                CreatedAt = Now,
                UpdatedAt = Now
            }, ct);
        }
        return missing.Count;
    }

    private static void Apply(ContentTopic topic, ContentTopicCommand c)
    {
        topic.Name = Required(c.Name, 80, "name", "Give the topic a name.");
        topic.Description = Optional(c.Description, 500, "description");
        topic.Color = c.Color is { } color && ColorPattern().IsMatch(color) ? color.ToLowerInvariant() : "#6c8cff";

        topic.ChannelId = string.IsNullOrWhiteSpace(c.ChannelId) ? null : c.ChannelId.Trim();
        if (topic.ChannelId is not null && !ChannelIdPattern().IsMatch(topic.ChannelId))
            throw EditingException.Invalid("channel-invalid", "Pick a connected YouTube channel.");
        topic.ChannelTitle = topic.ChannelId is null ? null : Optional(c.ChannelTitle, 200, "channelTitle");

        topic.Days = [.. (c.Days ?? []).Where(Enum.IsDefined).Distinct().Order()];

        var time = string.IsNullOrWhiteSpace(c.PublishTime) ? "18:00" : c.PublishTime.Trim();
        if (!ContentPlanRules.TryParseTime(time, out _))
            throw EditingException.Invalid("time-invalid", "Publish time must be HH:mm, e.g. 18:30.");
        topic.PublishTime = time;

        var zone = string.IsNullOrWhiteSpace(c.TimeZone) ? "UTC" : c.TimeZone.Trim();
        if (!ContentPlanRules.TryFindTimeZone(zone, out _))
            throw EditingException.Invalid("timezone-invalid", "That time zone isn't known on this server.");
        topic.TimeZone = zone;

        topic.LeadDays = Math.Clamp(c.LeadDays, 0, ContentPlanRules.MaxLeadDays);
        topic.PlanAheadDays = Math.Clamp(c.PlanAheadDays, 1, ContentPlanRules.MaxPlanAheadDays);
        topic.AutoSchedule = c.AutoSchedule;
        topic.AutoLinkUploads = c.AutoLinkUploads;
        topic.Tags = CleanList(c.Tags, 30, 60);
        topic.Checklist = CleanList(c.Checklist, 30, 200);
        topic.Archived = c.Archived;
    }

    // ---------------------------------------------------------------- posts

    public async Task<IReadOnlyList<ContentPlanItemView>> ListItemsAsync(
        string userId, DateTime fromUtc, DateTime toUtc, string? topicId, CancellationToken ct)
    {
        if (toUtc <= fromUtc || toUtc - fromUtc > TimeSpan.FromDays(400))
            throw EditingException.Invalid("range-invalid", "Pick a date range of up to 400 days.");
        if (topicId is not null) await GetTopicAsync(topicId, userId, ct);

        var list = await items.ListByUserAsync(userId, fromUtc, toUtc, topicId, MaxItemsPerList, ct);
        var leads = (await topics.ListByUserAsync(userId, ct)).ToDictionary(t => t.Id, t => t.LeadDays, StringComparer.Ordinal);
        return [.. list.Select(i => View(i, leads.GetValueOrDefault(i.TopicId, 3)))];
    }

    public async Task<ContentPlanItem> GetItemAsync(string id, string userId, CancellationToken ct)
    {
        var item = await items.GetAsync(id, ct) ?? throw new KeyNotFoundException();
        if (!string.Equals(item.UserId, userId, StringComparison.Ordinal)) throw new UnauthorizedAccessException();
        return item;
    }

    public async Task<ContentPlanItemView> GetItemViewAsync(string id, string userId, CancellationToken ct)
    {
        var item = await GetItemAsync(id, userId, ct);
        return await ViewAsync(item, ct);
    }

    public async Task<ContentPlanItemView> ViewAsync(ContentPlanItem item, CancellationToken ct)
    {
        var topic = await topics.GetAsync(item.TopicId, ct);
        return View(item, topic?.LeadDays ?? 3);
    }

    public ContentPlanItemView View(ContentPlanItem item, int leadDays) =>
        new(item, ContentPlanRules.PrepareBy(item, leadDays), ContentPlanRules.Attention(item, leadDays, Now));

    public async Task<ContentPlanItemView> CreateItemAsync(string userId, ContentPlanItemCommand command, CancellationToken ct)
    {
        var topic = await GetTopicAsync(command.TopicId, userId, ct);
        var item = new ContentPlanItem
        {
            Id = Guid.NewGuid().ToString("N"),
            UserId = userId,
            ChannelId = topic.ChannelId,
            CreatedAt = Now,
            Checklist = [.. topic.Checklist.Select(t => new ContentChecklistItem { Text = t })]
        };
        await ApplyAsync(item, topic, command, userId, ct);
        await items.UpsertAsync(item, ct);
        return View(item, topic.LeadDays);
    }

    public async Task<ContentPlanItemView> UpdateItemAsync(string id, string userId, ContentPlanItemCommand command, CancellationToken ct)
    {
        var item = await GetItemAsync(id, userId, ct);
        var topic = await GetTopicAsync(command.TopicId, userId, ct);
        if (!string.Equals(item.TopicId, topic.Id, StringComparison.Ordinal))
        {
            // Moved to another topic: it is no longer that topic's cadence slot.
            item.SlotKey = null;
            item.ChannelId ??= topic.ChannelId;
        }
        await ApplyAsync(item, topic, command, userId, ct);
        await items.UpsertAsync(item, ct);
        return View(item, topic.LeadDays);
    }

    public async Task<ContentPlanItemView> SetStatusAsync(string id, string userId, ContentPlanStatus status, CancellationToken ct)
    {
        if (!Enum.IsDefined(status)) throw EditingException.Invalid("status-invalid", "Unknown status.");
        var item = await GetItemAsync(id, userId, ct);
        SetStatus(item, status);
        item.UpdatedAt = Now;
        await items.UpsertAsync(item, ct);
        return await ViewAsync(item, ct);
    }

    /// <summary>Deletes a post. A cadence slot is remembered as dismissed so the planner doesn't recreate it.</summary>
    public async Task DeleteItemAsync(string id, string userId, CancellationToken ct)
    {
        var item = await GetItemAsync(id, userId, ct);
        if (item.SlotKey is not null && await topics.GetAsync(item.TopicId, ct) is { } topic
            && !topic.DismissedSlots.Contains(item.SlotKey))
        {
            topic.DismissedSlots.Add(item.SlotKey);
            if (topic.DismissedSlots.Count > MaxDismissedSlots)
                topic.DismissedSlots.RemoveRange(0, topic.DismissedSlots.Count - MaxDismissedSlots);
            await topics.UpsertAsync(topic, ct);
        }
        foreach (var link in await links.ListByUserAsync(userId, null, item.Id, MaxLinksPerList, ct))
        {
            link.PlanItemId = null;
            await links.UpsertAsync(link, ct);
        }
        await items.DeleteAsync(item.Id, ct);
    }

    private async Task ApplyAsync(ContentPlanItem item, ContentTopic topic, ContentPlanItemCommand c, string userId, CancellationToken ct)
    {
        item.TopicId = topic.Id;
        item.Title = Required(c.Title, 200, "title", "Give the post a title.");
        item.Notes = Optional(c.Notes, 4000, "notes");

        var publishAt = c.PublishAt.Kind == DateTimeKind.Unspecified
            ? DateTime.SpecifyKind(c.PublishAt, DateTimeKind.Utc)
            : c.PublishAt.ToUniversalTime();
        if (publishAt < new DateTime(2020, 1, 1, 0, 0, 0, DateTimeKind.Utc) || publishAt > Now.AddYears(3))
            throw EditingException.Invalid("publish-at-invalid", "Pick a publish date within the next three years.");
        if (item.PublishAt != publishAt && item.SlotKey is not null
            && item.SlotKey != ContentPlanRules.SlotKeyFor(topic.Id, ContentPlanRules.LocalDate(publishAt, topic)))
        {
            // Moved off its cadence day: the original day counts as handled, not empty.
            if (!topic.DismissedSlots.Contains(item.SlotKey))
            {
                topic.DismissedSlots.Add(item.SlotKey);
                await topics.UpsertAsync(topic, ct);
            }
            item.SlotKey = null;
        }
        item.PublishAt = publishAt;

        item.Checklist = c.Checklist is null
            ? item.Checklist
            : [.. c.Checklist.Take(30)
                .Select(x => new ContentChecklistItem { Text = (x.Text ?? string.Empty).Trim(), Done = x.Done })
                .Where(x => x.Text.Length is > 0 and <= 200)];

        if (string.IsNullOrWhiteSpace(c.ProjectId))
        {
            item.ProjectId = null;
        }
        else
        {
            var project = await projects.GetAsync(c.ProjectId, ct) ?? throw new KeyNotFoundException();
            if (!string.Equals(project.UserId, userId, StringComparison.Ordinal)) throw new UnauthorizedAccessException();
            item.ProjectId = project.Id;
        }

        item.FileLink = string.IsNullOrWhiteSpace(c.FileLink) ? null : SafeHttpsUrl(c.FileLink, "fileLink");

        if (Enum.IsDefined(c.Status)) SetStatus(item, c.Status);
        item.UpdatedAt = Now;
    }

    private void SetStatus(ContentPlanItem item, ContentPlanStatus status)
    {
        if (status >= ContentPlanStatus.Ready && status != ContentPlanStatus.Skipped) item.ReadyAt ??= Now;
        else if (status < ContentPlanStatus.Ready) item.ReadyAt = null;
        item.Status = status;
    }

    // ---------------------------------------------------------------- links

    public async Task<IReadOnlyList<ContentSourceLink>> ListLinksAsync(string userId, string? topicId, string? planItemId, CancellationToken ct)
    {
        if (topicId is not null) await GetTopicAsync(topicId, userId, ct);
        if (planItemId is not null) await GetItemAsync(planItemId, userId, ct);
        return await links.ListByUserAsync(userId, topicId, planItemId, MaxLinksPerList, ct);
    }

    /// <summary>Saves a link by hand. The same link saved twice updates the first record.</summary>
    public async Task<ContentSourceLink> AddLinkAsync(string userId, ContentLinkCommand command, CancellationToken ct)
    {
        var (url, platformId, platformName) = CanonicalLink(command.Url);
        var (topicId, itemId) = await ResolveTargetsAsync(userId, command.TopicId, command.PlanItemId, ct);

        var hash = ContentPlanRules.HashUrl(url);
        var link = await links.FindByUrlHashAsync(userId, hash, ct) ?? new ContentSourceLink
        {
            Id = Guid.NewGuid().ToString("N"),
            UserId = userId,
            Url = url,
            UrlHash = hash,
            PlatformId = platformId,
            PlatformName = platformName,
            Origin = ContentLinkOrigin.Manual,
            CreatedAt = Now
        };
        link.Title = Optional(command.Title, 300, "title") ?? (link.Title.Length > 0 ? link.Title : platformName);
        link.Note = Optional(command.Note, 1000, "note") ?? link.Note;
        link.TopicId = topicId ?? link.TopicId;
        link.PlanItemId = itemId ?? link.PlanItemId;
        link.Used = command.Used || link.Used;
        link.LastCapturedAt = Now;
        await links.UpsertAsync(link, ct);
        return link;
    }

    public async Task<ContentSourceLink> UpdateLinkAsync(string id, string userId, ContentLinkCommand command, CancellationToken ct)
    {
        var link = await GetLinkAsync(id, userId, ct);
        var (topicId, itemId) = await ResolveTargetsAsync(userId, command.TopicId, command.PlanItemId, ct);
        link.Title = Optional(command.Title, 300, "title") ?? link.PlatformName;
        link.Note = Optional(command.Note, 1000, "note");
        link.TopicId = topicId;
        link.PlanItemId = itemId;
        link.Used = command.Used;
        await links.UpsertAsync(link, ct);
        return link;
    }

    public async Task DeleteLinkAsync(string id, string userId, CancellationToken ct)
    {
        var link = await GetLinkAsync(id, userId, ct);
        await links.DeleteAsync(link.Id, ct);
    }

    /// <summary>
    /// Checks a download's topic and post belong to the caller before anything is fetched,
    /// so a foreign id is a 403/404 rather than a link filed somewhere it shouldn't be.
    /// </summary>
    public async Task<(string? TopicId, string? PlanItemId)> ResolveTargetsAsync(
        string userId, string? topicId, string? planItemId, CancellationToken ct)
    {
        string? resolvedTopic = null;
        string? resolvedItem = null;
        if (!string.IsNullOrWhiteSpace(planItemId))
        {
            var item = await GetItemAsync(planItemId, userId, ct);
            resolvedItem = item.Id;
            resolvedTopic = item.TopicId;
        }
        if (!string.IsNullOrWhiteSpace(topicId))
        {
            var topic = await GetTopicAsync(topicId, userId, ct);
            if (resolvedTopic is not null && resolvedTopic != topic.Id)
                throw EditingException.Invalid("link-target-mismatch", "That post belongs to a different topic.");
            resolvedTopic = topic.Id;
        }
        return (resolvedTopic, resolvedItem);
    }

    /// <summary>
    /// Records a link that was just downloaded. <paramref name="canonicalUrl"/> must be the
    /// validator's canonical form; targets must already be resolved for this user.
    /// </summary>
    public async Task<ContentSourceLink> CaptureDownloadAsync(
        string userId, string canonicalUrl, string? platformId, string platformName, string? title,
        string? topicId, string? planItemId, string? projectId, string? assetId, CancellationToken ct)
    {
        var hash = ContentPlanRules.HashUrl(canonicalUrl);
        var link = await links.FindByUrlHashAsync(userId, hash, ct) ?? new ContentSourceLink
        {
            Id = Guid.NewGuid().ToString("N"),
            UserId = userId,
            Url = canonicalUrl,
            UrlHash = hash,
            PlatformId = platformId,
            PlatformName = platformName,
            Origin = ContentLinkOrigin.Download,
            CreatedAt = Now
        };
        if (link.Title.Length == 0 || link.Title == link.PlatformName)
        {
            var clean = (title ?? string.Empty).Trim();
            link.Title = clean.Length == 0 ? platformName : clean.Length <= 300 ? clean : clean[..300];
        }
        link.TopicId = topicId ?? link.TopicId;
        link.PlanItemId = planItemId ?? link.PlanItemId;
        link.ProjectId = projectId ?? link.ProjectId;
        link.AssetId = assetId ?? link.AssetId;
        link.DownloadCount++;
        link.LastCapturedAt = Now;
        await links.UpsertAsync(link, ct);
        return link;
    }

    private async Task<ContentSourceLink> GetLinkAsync(string id, string userId, CancellationToken ct)
    {
        var link = await links.GetAsync(id, ct) ?? throw new KeyNotFoundException();
        if (!string.Equals(link.UserId, userId, StringComparison.Ordinal)) throw new UnauthorizedAccessException();
        return link;
    }

    /// <summary>
    /// A downloadable link is rebuilt by the media validator; any other https page is kept as
    /// a plain reference, rebuilt from its parsed parts (no credentials, default port only).
    /// </summary>
    private static (string Url, string? PlatformId, string PlatformName) CanonicalLink(string? raw)
    {
        var media = MediaSourceValidator.Validate(raw);
        if (media.IsValid) return (media.CanonicalUrl!, media.Platform!.Id, media.Platform.Name);

        var url = SafeHttpsUrl(raw, "url");
        return (url, null, new Uri(url).IdnHost);
    }

    private static string SafeHttpsUrl(string? raw, string field)
    {
        if (string.IsNullOrWhiteSpace(raw) || raw.Length > 2048
            || !Uri.TryCreate(raw.Trim(), UriKind.Absolute, out var uri)
            || uri.Scheme != Uri.UriSchemeHttps || !string.IsNullOrEmpty(uri.UserInfo) || !uri.IsDefaultPort
            || uri.IdnHost.Length == 0)
            throw EditingException.Invalid($"{field}-invalid", "Use a full https:// link.");
        return uri.AbsoluteUri;
    }

    // ---------------------------------------------------------------- helpers

    private static string Required(string? value, int max, string field, string message)
    {
        var v = value?.Trim() ?? string.Empty;
        if (v.Length == 0) throw EditingException.Invalid($"{field}-required", message);
        if (v.Length > max || v.Any(char.IsControl))
            throw EditingException.Invalid($"{field}-invalid", $"Keep it to {max} characters, on one line.");
        return v;
    }

    private static string? Optional(string? value, int max, string field)
    {
        var v = value?.Trim();
        if (string.IsNullOrEmpty(v)) return null;
        if (v.Length > max) throw EditingException.Invalid($"{field}-too-long", $"Keep it to {max} characters.");
        return v;
    }

    private static List<string> CleanList(IReadOnlyList<string>? values, int maxCount, int maxLength) =>
        [.. (values ?? [])
            .Select(v => v?.Trim() ?? string.Empty)
            .Where(v => v.Length is > 0 && v.Length <= maxLength && !v.Any(char.IsControl))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(maxCount)];

    [GeneratedRegex("^#[0-9a-fA-F]{6}$")]
    private static partial Regex ColorPattern();

    [GeneratedRegex("^UC[A-Za-z0-9_-]{22}$")]
    private static partial Regex ChannelIdPattern();
}
