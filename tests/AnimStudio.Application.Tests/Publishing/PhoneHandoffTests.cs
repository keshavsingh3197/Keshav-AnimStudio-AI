using System.Net;
using System.Text;
using System.Text.Json.Nodes;
using AnimStudio.Domain.Publishing;
using AnimStudio.Infrastructure.Publishing;
using Microsoft.Extensions.Logging.Abstractions;

namespace AnimStudio.Application.Tests.Publishing;

/// <summary>Send to phone. Everything here talks to a fake handler; no request leaves the machine.</summary>
public class PhoneHandoffTests
{
    private static readonly DateTime SentAt = new(2026, 10, 17, 12, 0, 0, DateTimeKind.Utc);

    private static PhoneHandoff Handoff(string id = "h1", double? duration = 30) =>
        new() { Id = id, CreatedAt = SentAt.AddMinutes(-1), SentAt = SentAt, DurationSeconds = duration };

    private static YouTubeChannelVideo Video(string id, int minutesAfterSend, double? duration) =>
        new(id, "x", SentAt.AddMinutes(minutesAfterSend), duration, "public", "processed", null);

    [Fact]
    public void The_one_new_video_of_the_renders_length_is_applied_without_asking()
    {
        var handoff = Handoff();
        var candidates = PhoneHandoffMatcher.Candidates(handoff,
            [Video("aaaaaaaaaaa", 5, 30.4), Video("bbbbbbbbbbb", 6, 12), Video("ccccccccccc", -30, 30)], new HashSet<string>());

        Assert.Equal(["aaaaaaaaaaa", "bbbbbbbbbbb"], candidates.Select(c => c.Video.VideoId));
        Assert.True(candidates[0].Likely);
        Assert.Equal("aaaaaaaaaaa", PhoneHandoffMatcher.AutoPick(handoff, candidates, [handoff]));
    }

    [Fact]
    public void Two_videos_of_the_same_length_are_left_for_the_user_to_pick()
    {
        var handoff = Handoff();
        var candidates = PhoneHandoffMatcher.Candidates(handoff, [Video("aaaaaaaaaaa", 5, 30), Video("bbbbbbbbbbb", 6, 29.5)], new HashSet<string>());

        Assert.Null(PhoneHandoffMatcher.AutoPick(handoff, candidates, [handoff]));
        Assert.Equal(2, candidates.Count);
    }

    [Fact]
    public void A_video_another_waiting_handoff_could_claim_is_not_applied()
    {
        var first = Handoff("h1", 30);
        var second = Handoff("h2", 30.5);
        var candidates = PhoneHandoffMatcher.Candidates(first, [Video("aaaaaaaaaaa", 5, 30.2)], new HashSet<string>());

        Assert.Null(PhoneHandoffMatcher.AutoPick(first, candidates, [first, second]));
    }

    [Fact]
    public void Known_videos_and_unknown_lengths_are_never_applied_automatically()
    {
        var handoff = Handoff();
        var candidates = PhoneHandoffMatcher.Candidates(handoff,
            [Video("aaaaaaaaaaa", 5, 30), Video("bbbbbbbbbbb", 6, null)], new HashSet<string> { "aaaaaaaaaaa" });

        Assert.Equal(["bbbbbbbbbbb"], candidates.Select(c => c.Video.VideoId));
        Assert.Null(PhoneHandoffMatcher.AutoPick(handoff, candidates, [handoff]));
        // Without the render's own length nothing is certain.
        Assert.Null(PhoneHandoffMatcher.AutoPick(Handoff(duration: null),
            PhoneHandoffMatcher.Candidates(Handoff(duration: null), [Video("ccccccccccc", 5, 30)], new HashSet<string>()), []));
    }

    [Theory]
    [InlineData("AnimStudio Shorts", true)]
    [InlineData("Shorts 2026 (Hindi) - drafts & ideas", true)]
    [InlineData("भजन शॉर्ट्स", true)]
    [InlineData("it's", false)]
    [InlineData("a/b", false)]
    [InlineData(" leading", false)]
    [InlineData("", false)]
    [InlineData(null, false)]
    public void Folder_names_never_need_escaping_in_a_Drive_query(string? name, bool valid)
    {
        Assert.Equal(valid, GoogleDriveClient.IsValidFolderName(name));
    }

    [Theory]
    [InlineData("Shiv Bhajan: Om Namah <Shivaya>?", "Shiv Bhajan Om Namah Shivaya.mp4")]
    [InlineData("../../etc/passwd", "etc passwd.mp4")]
    [InlineData("   ", "AnimStudio video.mp4")]
    public void Drive_file_names_come_from_the_title_without_path_characters(string title, string expected)
    {
        Assert.Equal(expected, PhoneHandoffManager.FileNameFor(title));
    }

    [Fact]
    public void A_Drive_sign_in_state_only_completes_a_Drive_connection()
    {
        var cache = new YouTubeOAuthStateCache(TimeProvider.System);
        var (state, _) = cache.Create("user-a", "/", YouTubeOAuthStateCache.DriveKind);
        Assert.StartsWith(YouTubeOAuthStateCache.DriveStatePrefix, state);
        Assert.Null(cache.Take(state, "user-a", YouTubeOAuthStateCache.ChannelKind));

        var (again, _) = cache.Create("user-a", "/back", YouTubeOAuthStateCache.DriveKind);
        Assert.Equal("/back", cache.Take(again, "user-a", YouTubeOAuthStateCache.DriveKind)!.ReturnPath);

        var (channel, _) = cache.Create("user-a", "/");
        Assert.False(channel.StartsWith(YouTubeOAuthStateCache.DriveStatePrefix, StringComparison.Ordinal));
    }

    [Fact]
    public async Task Updating_a_phone_upload_keeps_the_fields_AnimStudio_does_not_own()
    {
        JsonObject? sent = null;
        var handler = new StubHandler(async request =>
        {
            if (request.Method == HttpMethod.Get)
                return Json("""
                    {"items":[{"id":"abcdefghijk",
                      "snippet":{"title":"x","description":"","categoryId":"22","defaultLanguage":"hi","channelId":"UC1","publishedAt":"2026-10-17T12:05:00Z","thumbnails":{}},
                      "status":{"privacyStatus":"public","uploadStatus":"processed","license":"creativeCommon","containsSyntheticMedia":true,"madeForKids":false,"selfDeclaredMadeForKids":false}}]}
                    """);
            sent = JsonNode.Parse(await request.Content!.ReadAsStringAsync())!.AsObject();
            return Json("""{"id":"abcdefghijk"}""");
        });
        using var client = new YouTubeChannelVideosClient(NullLogger<YouTubeChannelVideosClient>.Instance, handler);

        await client.UpdateDetailsAsync("t", "abcdefghijk",
            new YouTubeVideoDetails("Om Namah Shivaya", "Bhajan", ["bhajan", "shiv"], "10", "unlisted", false), CancellationToken.None);

        var snippet = sent!["snippet"]!.AsObject();
        var status = sent["status"]!.AsObject();
        Assert.Equal("Om Namah Shivaya", (string?)snippet["title"]);
        Assert.Equal("10", (string?)snippet["categoryId"]);
        Assert.Equal("hi", (string?)snippet["defaultLanguage"]);
        Assert.False(snippet.ContainsKey("publishedAt"));
        Assert.False(snippet.ContainsKey("channelId"));
        Assert.Equal("unlisted", (string?)status["privacyStatus"]);
        Assert.Equal("creativeCommon", (string?)status["license"]);
        Assert.True((bool)status["containsSyntheticMedia"]!);
        Assert.False(status.ContainsKey("uploadStatus"));
        Assert.False(status.ContainsKey("madeForKids"));
    }

    [Fact]
    public async Task Recent_uploads_are_read_from_the_channels_uploads_playlist()
    {
        var handler = new StubHandler(request =>
        {
            var url = request.RequestUri!.ToString();
            if (url.Contains("/channels?")) return Task.FromResult(Json("""{"items":[{"contentDetails":{"relatedPlaylists":{"uploads":"UUabcdefghijklmnop"}}}]}"""));
            if (url.Contains("/playlistItems?")) return Task.FromResult(Json("""{"items":[{"contentDetails":{"videoId":"abcdefghijk"}},{"contentDetails":{"videoId":"bad id"}}]}"""));
            return Task.FromResult(Json("""
                {"items":[{"id":"abcdefghijk","snippet":{"title":"Short","publishedAt":"2026-10-17T12:05:00Z"},
                  "contentDetails":{"duration":"PT31S"},"status":{"privacyStatus":"public","uploadStatus":"processed"}}]}
                """));
        });
        using var client = new YouTubeChannelVideosClient(NullLogger<YouTubeChannelVideosClient>.Instance, handler);

        var recent = await client.ListRecentAsync("t", "UCabcdefghijklmnopqrstuv", 20, CancellationToken.None);

        var video = Assert.Single(recent);
        Assert.Equal("abcdefghijk", video.VideoId);
        Assert.Equal(31, video.DurationSeconds);
    }

    [Fact]
    public async Task A_Drive_folder_is_found_by_name_before_one_is_made()
    {
        var calls = new List<string>();
        var handler = new StubHandler(request =>
        {
            calls.Add($"{request.Method} {request.RequestUri!.AbsolutePath}");
            return Task.FromResult(Json("""{"files":[{"id":"folder_1234567890"}]}"""));
        });
        using var client = new GoogleDriveClient(NullLogger<GoogleDriveClient>.Instance, handler);

        var id = await client.EnsureFolderAsync("t", "AnimStudio Shorts", null, CancellationToken.None);

        Assert.Equal("folder_1234567890", id);
        Assert.Equal(["GET /drive/v3/files"], calls);
        await Assert.ThrowsAsync<YouTubePublishException>(() => client.EnsureFolderAsync("t", "it's", null, CancellationToken.None));
    }

    [Fact]
    public async Task Listing_Drive_folders_drops_ids_that_are_not_Drive_ids()
    {
        var handler = new StubHandler(_ => Task.FromResult(Json(
            """{"files":[{"id":"folder_1234567890","name":"Bhakti Shorts"},{"id":"../x","name":"Bad"}]}""")));
        using var client = new GoogleDriveClient(NullLogger<GoogleDriveClient>.Instance, handler);

        var folders = await client.ListFoldersAsync("t", CancellationToken.None);

        Assert.Equal([("folder_1234567890", "Bhakti Shorts")], folders);
    }

    [Theory]
    [InlineData("Bhakti Sagar", "Bhakti Sagar Shorts")]
    [InlineData("  Kids: Fun/Learn!  ", "Kids Fun Learn Shorts")]
    [InlineData("भक्ति सागर", "भक्ति सागर Shorts")]
    [InlineData("***", GoogleDriveConnection.DefaultFolderName)]
    [InlineData(null, GoogleDriveConnection.DefaultFolderName)]
    public void A_channel_gets_a_Drive_folder_named_after_it(string? title, string expected)
    {
        var name = GoogleDriveConnectionStore.AutoFolderName(title);

        Assert.Equal(expected, name);
        Assert.True(GoogleDriveClient.IsValidFolderName(name));
    }

    [Fact]
    public void A_long_channel_name_still_makes_a_valid_folder()
    {
        var name = GoogleDriveConnectionStore.AutoFolderName(new string('a', 300));

        Assert.True(GoogleDriveClient.IsValidFolderName(name));
        Assert.EndsWith(" Shorts", name, StringComparison.Ordinal);
    }

    [Fact]
    public void The_personal_Drive_keeps_the_key_it_had_before_channels_had_their_own()
    {
        Assert.Equal("user-a", GoogleDriveConnection.KeyFor("user-a", null));
        Assert.Equal("user-a", GoogleDriveConnection.KeyFor("user-a", ""));
        Assert.Equal("user-a:UCabc", GoogleDriveConnection.KeyFor("user-a", "UCabc"));
    }

    [Fact]
    public void A_Drive_sign_in_carries_the_channel_it_was_started_for()
    {
        var cache = new YouTubeOAuthStateCache(TimeProvider.System);
        var (state, _) = cache.Create("user-a", "/", YouTubeOAuthStateCache.DriveKind, "UCabcdefghijklmnopqrstuv");

        Assert.Equal("UCabcdefghijklmnopqrstuv", cache.Take(state, "user-a", YouTubeOAuthStateCache.DriveKind)!.Target);
    }

    private static HttpResponseMessage Json(string body) =>
        new(HttpStatusCode.OK) { Content = new StringContent(body, Encoding.UTF8, "application/json") };

    private sealed class StubHandler(Func<HttpRequestMessage, Task<HttpResponseMessage>> respond) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct) => respond(request);
    }
}
