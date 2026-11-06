using AnimStudio.Api.Common;
using AnimStudio.Api.Contracts;
using AnimStudio.Api.Controllers;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Options;
using AnimStudio.Application.Security;
using AnimStudio.Application.StoryAgent;
using AnimStudio.Application.StoryAgent.Stages;
using AnimStudio.Application.Tests.Ai;
using AnimStudio.Application.Tests.Editing;
using AnimStudio.Application.Tests.Rendering;
using AnimStudio.Domain.Ai;
using AnimStudio.Domain.Jobs;
using AnimStudio.Domain.Projects;
using AnimStudio.Domain.Rendering;
using AnimStudio.Domain.Stories;
using AnimStudio.Domain.Voices;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;

namespace AnimStudio.Application.Tests.StoryAgent;

/// <summary>
/// The Story Agent's endpoints, called the way the framework calls them: a real service over in-memory stores, a caller
/// who is or is not the run's owner, and the envelope that comes back.
/// </summary>
public sealed class StoryAgentControllerTests
{
    private const string Me = "user-1";
    private const string Someone = "user-2";
    private const string ProfileId = "vp_0123456789abcdef0123456789abcdef";

    private sealed class TestUser(string id, bool authenticated, bool admin = false) : ICurrentUser
    {
        public string UserId => id;
        public string? DisplayName => null;
        public string? Email => null;
        public bool IsAuthenticated => authenticated;
        public bool IsAdmin => admin;
        public IReadOnlyList<string> Roles => [];
    }

    private sealed class MemoryJobs : IRenderJobRepository
    {
        public Dictionary<string, RenderJob> Items { get; } = new(StringComparer.Ordinal);

        public Task<RenderJob?> GetAsync(string id, CancellationToken ct) => Task.FromResult(Items.GetValueOrDefault(id));
        public Task<IReadOnlyList<RenderJob>> ListByProjectAsync(string projectId, CancellationToken ct) => throw new NotSupportedException();
        public Task InsertAsync(RenderJob job, CancellationToken ct) => throw new NotSupportedException();
        public Task<RenderJob?> ClaimNextAsync(string leaseOwner, TimeSpan leaseDuration, int maxAttempts, CancellationToken ct) => throw new NotSupportedException();
        public Task<JobHeartbeatResult> ReportProgressAsync(string jobId, string leaseOwner, int progress, string? message,
            AnimStudio.Domain.Rendering.RenderStage stage, int scenesDone, TimeSpan leaseDuration, CancellationToken ct) => throw new NotSupportedException();
        public Task CompleteAsync(RenderJob job, CancellationToken ct) => throw new NotSupportedException();
        public Task RequestCancelAsync(string jobId, CancellationToken ct) => throw new NotSupportedException();
        public Task DeleteAsync(string jobId, CancellationToken ct) => throw new NotSupportedException();
        public Task<IReadOnlyList<string>> ListActiveJobIdsAsync(CancellationToken ct) => throw new NotSupportedException();
        public Task<IReadOnlyList<RenderJob>> ListRecentAsync(int limit, CancellationToken ct) => throw new NotSupportedException();
        public Task<bool> RequeueAsync(string jobId, CancellationToken ct) => throw new NotSupportedException();
        public Task<bool> RenameAsync(string jobId, string name, CancellationToken ct) => throw new NotSupportedException();
    }

    private sealed class MemorySettings : IAiSettingsRepository
    {
        public AiSettings? Value { get; set; }

        public Task<AiSettings?> GetAsync(CancellationToken ct) => Task.FromResult(Value);
        public Task SaveAsync(AiSettings settings, CancellationToken ct) => throw new NotSupportedException();
    }

    private sealed class World
    {
        public StoryAgentController Controller { get; }
        public InMemoryStoryRuns Runs { get; } = new();
        public FakeQueue Queue { get; } = new();
        public InMemoryObjectStore Store { get; } = new();
        public InMemoryVoices Voices { get; } = new();
        public FakeProjectRepository Projects { get; } = new();
        public MemoryJobs Jobs { get; } = new();
        public AdminOptions Admin { get; } = new();
        public StoryAgentOptions Options { get; } = new();
        public FakeStoryPublishing Publishing { get; } = new();
        public MemorySettings Settings { get; } = new();
        public string UserId { get; }

        public World(string userId = Me, bool authenticated = true, bool admin = false)
        {
            UserId = userId;
            var service = new StoryRunService(Runs, Queue, new FakePrompts(), Store, Voices, new StubRegistry(text: 1, image: 0, speech: 1),
                new FakeMusic(), new FakeCapabilities(), new FakeFinisher(), new StaticOptionsMonitor<StoryAgentOptions>(Options),
                new StoryClock(new DateTimeOffset(StorySamples.Now)), NullLogger<StoryRunService>.Instance);

            var captions = new StoryCaptionPublisher(service, Publishing, new StoryClock(new DateTimeOffset(StorySamples.Now)),
                NullLogger<StoryCaptionPublisher>.Instance);
            Controller = new StoryAgentController(service, Jobs, Projects, Settings, Store, new StaticOptionsMonitor<AdminOptions>(Admin),
                new TestUser(userId, authenticated, admin), Publishing, captions)
            {
                ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() }
            };
        }

        public StoryRun Seed(StoryRunStatus status = StoryRunStatus.ScriptReady, bool withScript = true, string? owner = null)
        {
            var run = StoryTestData.Run(status, owner ?? UserId, withScript);
            Runs.Seed(run);
            return run;
        }

        /// <summary>Gives every scene a stored picture, as an attach or a build would.</summary>
        public async Task<StoryRun> SeedWithPictures(StoryRunStatus status = StoryRunStatus.ScriptReady)
        {
            var run = StoryTestData.Run(status, UserId, withScript: true);
            foreach (var scene in run.Script!.Scenes)
            {
                scene.ImageKey = StoryObjectKeys.Image(run.Id, scene.Number, ".png");
                scene.ImageSource = "upload";
                await Store.SaveAsync(scene.ImageKey, new MemoryStream(StoryTestData.Png(scene.Number)), "image/png");
            }

            Runs.Seed(run);
            return run;
        }
    }

    private static StoryRunResponse Data(ActionResult<ApiResponse<StoryRunResponse>> result) =>
        ((ApiResponse<StoryRunResponse>)Assert.IsType<OkObjectResult>(result.Result).Value!).Data!;

    private static ApiError RefusalOf(ActionResult<ApiResponse<StoryRunResponse>> result, int status)
    {
        var refused = Assert.IsAssignableFrom<ObjectResult>(result.Result);
        Assert.Equal(status, refused.StatusCode);
        return Assert.Single(((ApiResponse<StoryRunResponse>)refused.Value!).Errors);
    }

    private static FormFile Upload(byte[] bytes, string name = "picture.png", long? claimedLength = null) =>
        new(new MemoryStream(bytes), 0, claimedLength ?? bytes.Length, "file", name);

    // ------------------------------------------------------------------------------------------------ starting

    [Fact]
    public async Task A_title_starts_a_story_for_the_caller_and_hands_it_to_the_worker()
    {
        var world = new World();

        var shown = Data(await world.Controller.Create(new CreateStoryRunRequest { Title = "Why we light diyas" }, CancellationToken.None));

        Assert.Equal("Why we light diyas", shown.Title);
        Assert.Equal(StoryRunStatus.Researching, shown.Status);
        Assert.True(shown.Working);
        Assert.Equal(StoryStageIds.All.Count, shown.Stages.Count);
        Assert.Equal([shown.Id], world.Queue.Enqueued);
        Assert.Equal(Me, world.Runs.Read(shown.Id)!.UserId);
    }

    [Fact]
    public async Task What_was_asked_for_is_what_the_story_starts_with()
    {
        var world = new World();

        var shown = Data(await world.Controller.Create(new CreateStoryRunRequest
        {
            Title = "Dhanteras", Notes = "Cover Dhanvantari.", Language = "en", TargetSeconds = 90, Format = StoryFormat.Vertical,
            Writer = StoryWriterMode.Manual, Options = new StoryBuildOptionsRequest { Narration = StoryNarrationMode.None, Music = false }
        }, CancellationToken.None));

        Assert.Equal("Cover Dhanvantari.", shown.Brief.Notes);
        Assert.Equal("en", shown.Brief.Language);
        Assert.Equal(90, shown.Brief.TargetSeconds);
        Assert.Equal(StoryFormat.Vertical, shown.Brief.Format);
        Assert.Equal(StoryWriterMode.Manual, shown.Brief.Writer);
        Assert.Equal(StoryNarrationMode.None, shown.Options.Narration);
        Assert.False(shown.Options.Music);
    }

    [Fact]
    public async Task A_story_is_made_for_the_channel_picked_before_it_starts()
    {
        var world = new World(admin: true);
        world.Settings.Value = new AiSettings { Channels = [new BrandChannel { Id = "kids", Name = "Kids" }] };

        var shown = Data(await world.Controller.Create(new CreateStoryRunRequest { Title = "The clever crow", BrandChannelId = "kids" }, CancellationToken.None));

        Assert.Equal("kids", shown.Brief.BrandChannelId);
        Assert.Equal("kids", world.Runs.Read(shown.Id)!.Brief.BrandChannelId);
    }

    [Fact]
    public async Task No_channel_is_the_default_channel()
    {
        var world = new World();

        var shown = Data(await world.Controller.Create(new CreateStoryRunRequest { Title = "The clever crow", BrandChannelId = "default" }, CancellationToken.None));

        Assert.Equal(BrandChannel.DefaultId, shown.Brief.BrandChannelId);
        Assert.Null(world.Runs.Read(shown.Id)!.Brief.BrandChannelId);
    }

    [Fact]
    public async Task Only_an_administrator_makes_a_story_for_a_studio_channel()
    {
        var world = new World();
        world.Settings.Value = new AiSettings { Channels = [new BrandChannel { Id = "kids", Name = "Kids" }] };

        var refusal = RefusalOf(await world.Controller.Create(new CreateStoryRunRequest { Title = "The clever crow", BrandChannelId = "kids" }, CancellationToken.None), 403);

        Assert.Equal("channel-forbidden", refusal.Code);
        Assert.Empty(world.Queue.Enqueued);
    }

    [Fact]
    public async Task A_channel_that_does_not_exist_is_refused()
    {
        var world = new World(admin: true);

        var refusal = RefusalOf(await world.Controller.Create(new CreateStoryRunRequest { Title = "The clever crow", BrandChannelId = "gone" }, CancellationToken.None), 400);

        Assert.Equal("unknown-channel", refusal.Code);
        Assert.Empty(world.Queue.Enqueued);
    }

    [Fact]
    public async Task A_built_in_story_needs_no_title_of_its_own()
    {
        var world = new World();
        var pack = StoryPacks.All[0];

        var shown = Data(await world.Controller.Create(new CreateStoryRunRequest { Writer = StoryWriterMode.BuiltIn, PackId = pack.Id }, CancellationToken.None));

        Assert.Equal(pack.Title, shown.Title);
        Assert.Equal(pack.Id, shown.Brief.PackId);
    }

    [Fact]
    public async Task A_story_without_a_title_is_refused_with_the_field_named()
    {
        var world = new World();

        var refusal = await Assert.ThrowsAsync<StoryRunException>(() => world.Controller.Create(new CreateStoryRunRequest(), CancellationToken.None));

        Assert.Equal("title-required", refusal.Code);
        Assert.Equal("title", refusal.Field);
        Assert.Empty(world.Queue.Enqueued);
    }

    [Fact]
    public async Task A_story_switched_off_for_the_server_is_not_found()
    {
        var world = new World();
        world.Options.Enabled = false;

        var refusal = await Assert.ThrowsAsync<StoryRunException>(() => world.Controller.Create(new CreateStoryRunRequest { Title = "Diwali" }, CancellationToken.None));
        var options = ((ApiResponse<StoryAgentOptionsResponse>)Assert.IsType<OkObjectResult>((await world.Controller.Options(CancellationToken.None)).Result).Value!).Data!;

        Assert.Equal(StoryRunErrorKind.NotFound, refusal.Kind);
        Assert.False(options.Enabled);
    }

    // ------------------------------------------------------------------------------------------------ guests

    [Fact]
    public async Task A_guest_is_refused_when_the_platform_does_not_let_guests_make_projects()
    {
        var world = new World("guest_ip_1", authenticated: false);
        world.Admin.AnonymousPolicy.AllowGuestProjectCreation = false;

        var error = RefusalOf(await world.Controller.Create(new CreateStoryRunRequest { Title = "Diwali" }, CancellationToken.None), 403);

        Assert.Equal("guest-forbidden", error.Code);
        Assert.Empty(world.Queue.Enqueued);
        Assert.Empty(world.Runs.All());
    }

    [Fact]
    public async Task A_guest_at_the_project_limit_is_refused_and_a_story_still_being_made_counts_as_a_project()
    {
        var world = new World("guest_ip_1", authenticated: false);
        world.Admin.AnonymousPolicy.MaxGuestProjects = 1;

        // One project they already have.
        world.Projects.Items.Add(new Project { Id = "p1", UserId = "guest_ip_1", Name = "Mine" });
        var error = RefusalOf(await world.Controller.Create(new CreateStoryRunRequest { Title = "Diwali" }, CancellationToken.None), 400);
        Assert.Equal("guest-limit-reached", error.Code);

        // Or one story on its way to becoming one.
        var other = new World("guest_ip_2", authenticated: false);
        other.Admin.AnonymousPolicy.MaxGuestProjects = 1;
        other.Seed(StoryRunStatus.Building);
        Assert.Equal("guest-limit-reached", RefusalOf(await other.Controller.Create(new CreateStoryRunRequest { Title = "Diwali" }, CancellationToken.None), 400).Code);
    }

    [Fact]
    public async Task A_story_that_failed_or_was_stopped_does_not_count_against_a_guest()
    {
        var world = new World("guest_ip_1", authenticated: false);
        world.Admin.AnonymousPolicy.MaxGuestProjects = 1;
        world.Seed(StoryRunStatus.Failed);
        world.Seed(StoryRunStatus.Cancelled);

        var started = Data(await world.Controller.Create(new CreateStoryRunRequest { Title = "Diwali" }, CancellationToken.None));

        Assert.Equal(StoryRunStatus.Researching, started.Status);
    }

    [Fact]
    public async Task A_finished_story_counts_through_its_project_and_not_a_second_time_as_a_story()
    {
        var world = new World("guest_ip_1", authenticated: false);
        world.Admin.AnonymousPolicy.MaxGuestProjects = 2;
        var finished = world.Seed(StoryRunStatus.Completed);
        finished.ProjectId = "p1";
        world.Runs.Seed(finished);
        world.Projects.Items.Add(new Project { Id = "p1", UserId = "guest_ip_1", Name = "Done" });

        var started = Data(await world.Controller.Create(new CreateStoryRunRequest { Title = "Another" }, CancellationToken.None));
        Assert.Equal(StoryRunStatus.Researching, started.Status);

        // Now there is a project and a story on its way to being one: two, which is the limit.
        var refusal = RefusalOf(await world.Controller.Create(new CreateStoryRunRequest { Title = "A third" }, CancellationToken.None), 400);
        Assert.Equal("guest-limit-reached", refusal.Code);
    }

    [Fact]
    public async Task A_signed_in_person_is_never_held_to_the_guest_limits()
    {
        var world = new World(Me, authenticated: true);
        world.Admin.AnonymousPolicy.AllowGuestProjectCreation = false;
        world.Admin.AnonymousPolicy.MaxGuestProjects = 0;

        var shown = Data(await world.Controller.Create(new CreateStoryRunRequest { Title = "Diwali" }, CancellationToken.None));

        Assert.Equal(StoryRunStatus.Researching, shown.Status);
    }

    // ------------------------------------------------------------------------------------------------ reading

    [Fact]
    public async Task A_story_is_shown_to_its_owner_in_full()
    {
        var world = new World();
        var run = world.Seed();

        var shown = Data(await world.Controller.Get(run.Id, CancellationToken.None));

        Assert.Equal(run.Id, shown.Id);
        Assert.Equal(StoryRunStatus.ScriptReady, shown.Status);
        Assert.Equal(6, shown.Script!.Scenes.Count);
        Assert.NotNull(shown.Research);
    }

    [Fact]
    public async Task Someone_elses_story_answers_exactly_as_one_that_does_not_exist()
    {
        var world = new World();
        var theirs = world.Seed(owner: Someone);

        var foreign = await Assert.ThrowsAsync<StoryRunException>(() => world.Controller.Get(theirs.Id, CancellationToken.None));
        var missing = await Assert.ThrowsAsync<StoryRunException>(() => world.Controller.Get("sr_" + new string('0', 32), CancellationToken.None));

        Assert.Equal(StoryRunErrorKind.NotFound, foreign.Kind);
        Assert.Equal(missing.Code, foreign.Code);
        Assert.Equal(missing.Message, foreign.Message);
    }

    [Fact]
    public async Task Every_call_that_names_a_story_refuses_a_stranger_the_same_way()
    {
        var world = new World();
        var theirs = world.Seed(owner: Someone);
        var token = CancellationToken.None;
        var calls = new Dictionary<string, Func<Task>>
        {
            ["get"] = () => world.Controller.Get(theirs.Id, token),
            ["prompt"] = () => world.Controller.Prompt(theirs.Id, token),
            ["paste"] = () => world.Controller.Paste(theirs.Id, new PasteStoryScriptRequest { Reply = StorySamples.ReplyJson }, token),
            ["edit"] = () => world.Controller.Edit(theirs.Id, new EditStoryScriptRequest(), token),
            ["rewrite"] = () => world.Controller.Rewrite(theirs.Id, null, token),
            ["attach"] = () => world.Controller.AttachImage(theirs.Id, 1, Upload(StoryTestData.Png()), token),
            ["remove"] = () => world.Controller.RemoveImage(theirs.Id, 1, token),
            ["image"] = () => world.Controller.Image(theirs.Id, 1, token),
            ["build"] = () => world.Controller.Build(theirs.Id, null, token),
            ["retry"] = () => world.Controller.Retry(theirs.Id, token),
            ["cancel"] = () => world.Controller.Cancel(theirs.Id, token),
            ["delete"] = () => world.Controller.Delete(theirs.Id, token),
            ["approve"] = () => world.Controller.Approve(theirs.Id, token),
            ["subtitles"] = () => world.Controller.Subtitles(theirs.Id, "hi", token),
            ["send subtitles"] = () => world.Controller.SendSubtitles(theirs.Id, new SendStoryCaptionsRequest { VideoId = "abcdefghijk" }, token)
        };

        foreach (var (name, call) in calls)
        {
            var refusal = await Assert.ThrowsAsync<StoryRunException>(call);
            Assert.True(refusal is { Kind: StoryRunErrorKind.NotFound, Code: "story-not-found" }, $"{name}: {refusal.Code}");
        }

        Assert.Equal(StoryRunStatus.ScriptReady, world.Runs.Read(theirs.Id)!.Status);
        Assert.Empty(world.Queue.Enqueued);
    }

    [Fact]
    public async Task The_list_holds_only_the_callers_stories()
    {
        var world = new World();
        var mine = world.Seed();
        world.Seed(owner: Someone);

        var list = ((ApiResponse<IReadOnlyList<StoryRunSummaryResponse>>)Assert.IsType<OkObjectResult>((await world.Controller.List(CancellationToken.None)).Result).Value!).Data!;

        Assert.Equal([mine.Id], list.Select(s => s.Id));
    }

    [Fact]
    public async Task The_options_list_the_built_in_stories_the_topics_and_only_the_callers_voices()
    {
        var world = new World();
        world.Voices.Items[ProfileId] = new VoiceProfile { Id = ProfileId, UserId = Me, Name = "My voice", BaseVoiceId = "hm_omega", StorageKey = "voice-profiles/x/sample.wav" };
        world.Voices.Items["vp_ffffffffffffffffffffffffffffffff"] = new VoiceProfile { Id = "vp_ffffffffffffffffffffffffffffffff", UserId = Someone, Name = "Theirs", BaseVoiceId = "hm_omega", StorageKey = "voice-profiles/y/sample.wav" };

        var options = ((ApiResponse<StoryAgentOptionsResponse>)Assert.IsType<OkObjectResult>((await world.Controller.Options(CancellationToken.None)).Result).Value!).Data!;

        Assert.True(options.Enabled);
        Assert.True(options.TextModel);
        Assert.True(options.SpeechEngine);
        Assert.False(options.ImageEngine);
        Assert.Contains(options.Packs, p => p.Id == "diwali");
        Assert.Contains(options.Topics, t => t.Id == "diwali" && t.Hindi.Length > 0);
        Assert.Equal("My voice", Assert.Single(options.MyVoices).Name);
        Assert.Equal(2, options.MaxActiveRuns);
    }

    [Fact]
    public async Task The_prompt_for_writing_by_hand_is_ready_once_the_research_is()
    {
        var world = new World();
        var run = world.Seed(StoryRunStatus.AwaitingScript);

        var prompt = ((ApiResponse<StoryPromptResponse>)Assert.IsType<OkObjectResult>((await world.Controller.Prompt(run.Id, CancellationToken.None)).Result).Value!).Data!;

        Assert.Contains("WRITE:", prompt.Prompt, StringComparison.Ordinal);

        var early = world.Seed(StoryRunStatus.Researching, withScript: false);
        var refusal = await Assert.ThrowsAsync<StoryRunException>(() => world.Controller.Prompt(early.Id, CancellationToken.None));
        Assert.Equal("research-not-ready", refusal.Code);
    }

    // ------------------------------------------------------------------------------------------------ approving, subtitles, YouTube

    /// <summary>A finished story whose project is the caller's and was built: scenes ten seconds apart.</summary>
    private static StoryRun Finished(World world)
    {
        var run = world.Seed(StoryRunStatus.Completed);
        run.ProjectId = "66f1b2c3d4e5f60718293a01";
        run.RenderJobId = "job-1";
        run.SceneStarts = [.. run.Script!.Scenes.Select((_, i) => i * 10.0)];
        run.TotalSeconds = run.Script.Scenes.Count * 10.0;
        world.Runs.Seed(run);
        world.Projects.Items.Add(new Project { Id = run.ProjectId, UserId = Me, Name = "Mine" });
        return run;
    }

    [Fact]
    public async Task Approving_says_when_and_the_story_stays_where_it_was()
    {
        var world = new World();
        var run = world.Seed();

        var approved = Data(await world.Controller.Approve(run.Id, CancellationToken.None));

        Assert.Equal(StorySamples.Now, approved.ScriptApprovedAtUtc);
        Assert.Equal(StoryRunStatus.ScriptReady, approved.Status);
        Assert.Empty(world.Queue.Enqueued);
    }

    [Fact]
    public async Task A_built_story_offers_hindi_and_english_subtitles_as_srt_files()
    {
        var world = new World();
        var run = Finished(world);

        var detail = Data(await world.Controller.Get(run.Id, CancellationToken.None));
        Assert.Equal(["hi", "en"], detail.Subtitles.Select(s => s.Language));

        var file = Assert.IsType<FileContentResult>(await world.Controller.Subtitles(run.Id, "HI", CancellationToken.None));
        Assert.Equal("application/x-subrip", file.ContentType);
        Assert.Equal($"{run.Id}.hi.srt", file.FileDownloadName);
        Assert.Equal([0xEF, 0xBB, 0xBF], file.FileContents.Take(3));
        Assert.StartsWith("1\n00:00:00,", System.Text.Encoding.UTF8.GetString(file.FileContents.AsSpan(3)));
        Assert.Equal("private, no-store", world.Controller.Response.Headers.CacheControl.ToString());

        var refusal = await Assert.ThrowsAsync<StoryRunException>(() => world.Controller.Subtitles(run.Id, "../x", CancellationToken.None));
        Assert.Equal("subtitles-not-found", refusal.Code);

        var unbuilt = world.Seed();
        Assert.Empty(Data(await world.Controller.Get(unbuilt.Id, CancellationToken.None)).Subtitles);
    }

    [Fact]
    public async Task The_videos_made_from_the_story_are_shown_with_which_render_they_are_and_on_the_list_card()
    {
        var world = new World();
        var run = Finished(world);
        world.Publishing.Videos.Add(FakeStoryPublishing.Video(run.ProjectId!, videoId: "aaaaaaaaaaa", jobId: "old-job"));
        world.Publishing.Videos.Add(FakeStoryPublishing.Video(run.ProjectId!, videoId: "bbbbbbbbbbb", jobId: "job-1", privacy: "private",
            publishAt: StorySamples.Now.AddDays(2)) with { PublishedAtUtc = StorySamples.Now.AddMinutes(5) });
        world.Publishing.Videos.Add(FakeStoryPublishing.Video("someone-elses-project", videoId: "ccccccccccc"));

        var detail = Data(await world.Controller.Get(run.Id, CancellationToken.None));

        Assert.Equal(["bbbbbbbbbbb", "aaaaaaaaaaa"], detail.Publications.Select(p => p.VideoId));
        Assert.True(detail.Publications[0].CurrentRender);
        Assert.False(detail.Publications[1].CurrentRender);
        Assert.Equal(StorySamples.Now.AddDays(2), detail.Publications[0].PublishAtUtc);

        var list = ((ApiResponse<IReadOnlyList<StoryRunSummaryResponse>>)Assert.IsType<OkObjectResult>((await world.Controller.List(CancellationToken.None)).Result).Value!).Data!;
        var card = Assert.Single(list);
        Assert.Equal(2, card.PublicationCount);
        Assert.Equal("bbbbbbbbbbb", card.Publication!.VideoId);
        Assert.True(card.HasRender);
        Assert.Equal(run.Script!.Scenes.Count, card.SceneCount);
    }

    [Fact]
    public async Task Subtitles_are_sent_to_the_storys_video_and_each_language_is_reported()
    {
        var world = new World();
        var run = Finished(world);
        world.Publishing.Videos.Add(FakeStoryPublishing.Video(run.ProjectId!));

        var result = await world.Controller.SendSubtitles(run.Id, new SendStoryCaptionsRequest { VideoId = "abcdefghijk", Languages = ["en"] }, CancellationToken.None);
        var sent = ((ApiResponse<StoryCaptionsSentResponse>)Assert.IsType<OkObjectResult>(result.Result).Value!).Data!;

        Assert.Equal("added", Assert.Single(sent.Results).Outcome);
        Assert.Equal(["en"], Assert.Single(sent.Run.Publications).Captions);
        Assert.Equal("en", Assert.Single(world.Publishing.Captions).Language);
    }

    [Fact]
    public async Task A_guest_cannot_send_subtitles_to_youtube()
    {
        var world = new World(authenticated: false);
        var run = Finished(world);
        world.Publishing.Videos.Add(FakeStoryPublishing.Video(run.ProjectId!));

        var result = await world.Controller.SendSubtitles(run.Id, new SendStoryCaptionsRequest { VideoId = "abcdefghijk" }, CancellationToken.None);

        Assert.Equal(403, Assert.IsAssignableFrom<ObjectResult>(result.Result).StatusCode);
        Assert.Empty(world.Publishing.Captions);
    }

    // ------------------------------------------------------------------------------------------------ the project and the render

    [Fact]
    public async Task The_project_is_linked_only_while_it_exists_and_is_the_callers()
    {
        var world = new World();
        var run = world.Seed(StoryRunStatus.Completed);
        run.ProjectId = "66f1b2c3d4e5f60718293a01";
        world.Runs.Seed(run);

        Assert.Null(Data(await world.Controller.Get(run.Id, CancellationToken.None)).ProjectId);

        world.Projects.Items.Add(new Project { Id = run.ProjectId, UserId = Someone, Name = "Not mine" });
        Assert.Null(Data(await world.Controller.Get(run.Id, CancellationToken.None)).ProjectId);

        world.Projects.Items.Clear();
        world.Projects.Items.Add(new Project { Id = run.ProjectId, UserId = Me, Name = "Mine" });
        Assert.Equal(run.ProjectId, Data(await world.Controller.Get(run.Id, CancellationToken.None)).ProjectId);
    }

    [Fact]
    public async Task The_render_is_shown_with_its_progress_and_never_when_it_is_not_the_callers()
    {
        var world = new World();
        var run = world.Seed(StoryRunStatus.Building);
        run.RenderJobId = "rj1";
        world.Runs.Seed(run);

        Assert.Null(Data(await world.Controller.Get(run.Id, CancellationToken.None)).Render);

        world.Jobs.Items["rj1"] = new RenderJob { Id = "rj1", UserId = Someone, Status = RenderJobStatus.Processing, Progress = 30 };
        Assert.Null(Data(await world.Controller.Get(run.Id, CancellationToken.None)).Render);

        world.Jobs.Items["rj1"] = new RenderJob { Id = "rj1", UserId = Me, Status = RenderJobStatus.Processing, Progress = 30, Message = "Rendering scene 3" };
        var render = Data(await world.Controller.Get(run.Id, CancellationToken.None)).Render!;
        Assert.Equal(30, render.Progress);
        Assert.Equal("Rendering scene 3", render.Message);
        Assert.False(render.Downloadable);
    }

    // ------------------------------------------------------------------------------------------------ the script

    [Fact]
    public async Task A_pasted_reply_gives_a_waiting_story_its_script()
    {
        var world = new World();
        var run = world.Seed(StoryRunStatus.AwaitingScript, withScript: false);
        run.Research = StorySamples.Research();
        run.Brief.Writer = StoryWriterMode.Manual;
        run.Stage(StoryStageIds.Research).Status = StoryStageStatus.Completed;
        world.Runs.Seed(run);

        var shown = Data(await world.Controller.Paste(run.Id, new PasteStoryScriptRequest { Reply = StorySamples.ReplyJson }, CancellationToken.None));

        Assert.Equal(StoryRunStatus.ScriptReady, shown.Status);
        Assert.Equal(6, shown.Script!.Scenes.Count);
        Assert.Equal("pasted reply", shown.Script.WrittenBy);
        Assert.NotEmpty(shown.ScriptWarnings);
    }

    [Fact]
    public async Task A_reply_that_is_not_a_script_is_refused_with_the_reply_named_and_the_story_is_unharmed()
    {
        var world = new World();
        var run = world.Seed(StoryRunStatus.AwaitingScript, withScript: false);
        run.Research = StorySamples.Research();
        world.Runs.Seed(run);

        var refusal = await Assert.ThrowsAsync<StoryRunException>(() =>
            world.Controller.Paste(run.Id, new PasteStoryScriptRequest { Reply = "Sure! Here is a lovely story about lamps." }, CancellationToken.None));

        Assert.Equal(StoryRunErrorKind.Invalid, refusal.Kind);
        Assert.Equal("reply", refusal.Field);
        Assert.Equal(StoryRunStatus.AwaitingScript, world.Runs.Read(run.Id)!.Status);
    }

    [Fact]
    public async Task An_edit_keeps_a_scenes_picture_by_its_number()
    {
        var world = new World();
        var run = await world.SeedWithPictures();
        var second = run.Script!.Scenes[1];

        var shown = Data(await world.Controller.Edit(run.Id, new EditStoryScriptRequest
        {
            Title = "नया शीर्षक",
            Scenes =
            [
                new EditStorySceneRequest { Number = second.Number, Narration = "नई कथा।", Basis = "reflection" },
                new EditStorySceneRequest { Number = 0, Narration = "एक नया दृश्य।", Basis = "reflection" }
            ]
        }, CancellationToken.None));

        Assert.Equal("नया शीर्षक", shown.Script!.Title);
        Assert.Equal(2, shown.Script.Scenes.Count);
        Assert.Equal("नई कथा।", shown.Script.Scenes[0].Narration);
        Assert.True(shown.Script.Scenes[0].HasImage);
        Assert.False(shown.Script.Scenes[1].HasImage);
        Assert.Contains("(edited)", shown.Script.WrittenBy, StringComparison.Ordinal);
    }

    [Fact]
    public async Task A_rewrite_needs_no_body_and_goes_back_to_writing()
    {
        var world = new World();
        var run = await world.SeedWithPictures();

        var shown = Data(await world.Controller.Rewrite(run.Id, null, CancellationToken.None));

        Assert.Equal(StoryRunStatus.WritingScript, shown.Status);
        Assert.Null(shown.Script);
        Assert.Equal([run.Id], world.Queue.Enqueued);
        Assert.DoesNotContain(world.Store.Keys, k => k.Contains("/images/", StringComparison.Ordinal));
    }

    [Fact]
    public async Task A_rewrite_can_switch_to_writing_by_hand()
    {
        var world = new World();
        var run = world.Seed();

        var shown = Data(await world.Controller.Rewrite(run.Id, new RewriteStoryScriptRequest { Writer = StoryWriterMode.Manual }, CancellationToken.None));

        Assert.Equal(StoryWriterMode.Manual, shown.Brief.Writer);
    }

    // ------------------------------------------------------------------------------------------------ pictures

    [Fact]
    public async Task A_picture_is_kept_under_the_story_and_the_scene_shows_it()
    {
        var world = new World();
        var run = world.Seed();

        var shown = Data(await world.Controller.AttachImage(run.Id, 1, Upload(StoryTestData.Png(), @"C:\Users\me\My Pic.png"), CancellationToken.None));

        var scene = shown.Script!.Scenes[0];
        Assert.True(scene.HasImage);
        Assert.Equal("upload", scene.ImageSource);
        Assert.Equal("My Pic.png", scene.ImageName);
        Assert.False(shown.Script.Scenes[1].HasImage);
        var key = Assert.Single(world.Store.Keys);
        Assert.StartsWith($"story-runs/{run.Id}/images/", key, StringComparison.Ordinal);
    }

    [Fact]
    public async Task A_replacement_picture_takes_the_place_of_the_old_one_and_removes_its_file()
    {
        var world = new World();
        var run = world.Seed();
        await world.Controller.AttachImage(run.Id, 1, Upload(StoryTestData.Png(1)), CancellationToken.None);
        var first = Assert.Single(world.Store.Keys);

        await world.Controller.AttachImage(run.Id, 1, Upload(StoryTestData.Png(2)), CancellationToken.None);

        var now = Assert.Single(world.Store.Keys);
        Assert.NotEqual(first, now);
    }

    [Fact]
    public async Task A_picture_that_cannot_be_used_is_refused_with_a_reason_and_nothing_is_stored()
    {
        var world = new World();
        var run = world.Seed();
        var limit = VisualsStage.MaxImageBytes;

        var none = await Assert.ThrowsAsync<StoryRunException>(() => world.Controller.AttachImage(run.Id, 1, null, CancellationToken.None));
        var empty = await Assert.ThrowsAsync<StoryRunException>(() => world.Controller.AttachImage(run.Id, 1, Upload([]), CancellationToken.None));
        var huge = await Assert.ThrowsAsync<StoryRunException>(() => world.Controller.AttachImage(run.Id, 1, Upload([1, 2, 3], claimedLength: limit + 1), CancellationToken.None));
        var notAPicture = await Assert.ThrowsAsync<StoryRunException>(() => world.Controller.AttachImage(run.Id, 1, Upload("not a picture"u8.ToArray(), "evil.png"), CancellationToken.None));
        var noScene = await Assert.ThrowsAsync<StoryRunException>(() => world.Controller.AttachImage(run.Id, 99, Upload(StoryTestData.Png()), CancellationToken.None));

        Assert.Equal("image-required", none.Code);
        Assert.Equal("image-required", empty.Code);
        Assert.Equal("image-too-large", huge.Code);
        Assert.Equal("image-invalid", notAPicture.Code);
        Assert.Equal("scene-not-found", noScene.Code);
        Assert.Equal(StoryRunErrorKind.NotFound, noScene.Kind);
        Assert.Empty(world.Store.Keys);
    }

    [Fact]
    public async Task A_picture_cannot_be_changed_while_the_story_is_being_made()
    {
        var world = new World();
        var run = world.Seed(StoryRunStatus.Building);

        var refusal = await Assert.ThrowsAsync<StoryRunException>(() => world.Controller.AttachImage(run.Id, 1, Upload(StoryTestData.Png()), CancellationToken.None));

        Assert.Equal(StoryRunErrorKind.Conflict, refusal.Kind);
        Assert.Equal("script-locked", refusal.Code);
    }

    [Fact]
    public async Task Removing_a_picture_removes_the_scenes_claim_and_its_file()
    {
        var world = new World();
        var run = await world.SeedWithPictures();
        var before = world.Store.Keys.Count;

        var shown = Data(await world.Controller.RemoveImage(run.Id, 1, CancellationToken.None));

        Assert.False(shown.Script!.Scenes[0].HasImage);
        Assert.True(shown.Script.Scenes[1].HasImage);
        Assert.Equal(before - 1, world.Store.Keys.Count);
    }

    [Fact]
    public async Task A_picture_is_served_to_its_owner_with_its_kind_and_no_caching()
    {
        var world = new World();
        var run = await world.SeedWithPictures();

        var file = Assert.IsType<FileStreamResult>(await world.Controller.Image(run.Id, 2, CancellationToken.None));

        Assert.Equal("image/png", file.ContentType);
        using var copy = new MemoryStream();
        await file.FileStream.CopyToAsync(copy);
        Assert.Equal(StoryTestData.Png(2), copy.ToArray());
        Assert.Equal("private, no-store", world.Controller.Response.Headers.CacheControl.ToString());
        Assert.Equal("nosniff", world.Controller.Response.Headers.XContentTypeOptions.ToString());
    }

    [Fact]
    public async Task A_picture_the_run_does_not_own_is_never_served_even_if_its_record_says_so()
    {
        var world = new World();
        var run = await world.SeedWithPictures();
        var stranger = $"story-runs/sr_{new string('9', 32)}/images/s01-aaaaaaaaaaaa.png";
        await world.Store.SaveAsync(stranger, new MemoryStream(StoryTestData.Png()), "image/png");
        await world.Store.SaveAsync("voice-profiles/vp_x/sample.wav", new MemoryStream([1, 2, 3]), "audio/wav");
        run.Script!.Scenes[0].ImageKey = stranger;
        run.Script.Scenes[1].ImageKey = "voice-profiles/vp_x/sample.wav";
        run.Script.Scenes[2].ImageKey = $"story-runs/{run.Id}/../{stranger}";
        world.Runs.Seed(run);

        foreach (var scene in new[] { 1, 2, 3 })
        {
            var refusal = await Assert.ThrowsAsync<StoryRunException>(() => world.Controller.Image(run.Id, scene, CancellationToken.None));
            Assert.Equal("image-not-found", refusal.Code);
        }
    }

    [Fact]
    public async Task A_scene_with_no_picture_or_a_picture_that_is_gone_is_not_found()
    {
        var world = new World();
        var run = world.Seed();
        run.Script!.Scenes[1].ImageKey = StoryObjectKeys.Image(run.Id, 2, ".png");
        world.Runs.Seed(run);

        var none = await Assert.ThrowsAsync<StoryRunException>(() => world.Controller.Image(run.Id, 1, CancellationToken.None));
        var gone = await Assert.ThrowsAsync<StoryRunException>(() => world.Controller.Image(run.Id, 2, CancellationToken.None));
        var noScene = await Assert.ThrowsAsync<StoryRunException>(() => world.Controller.Image(run.Id, 99, CancellationToken.None));

        Assert.All(new[] { none, gone, noScene }, e => Assert.Equal(("image-not-found", StoryRunErrorKind.NotFound), (e.Code, e.Kind)));
    }

    [Theory]
    [InlineData(".png", "image/png")]
    [InlineData(".jpg", "image/jpeg")]
    [InlineData(".webp", "image/webp")]
    public async Task A_picture_is_served_as_the_kind_the_server_stored_it_as(string extension, string contentType)
    {
        var world = new World();
        var run = world.Seed();
        var key = StoryObjectKeys.Image(run.Id, 1, extension);
        run.Script!.Scenes[0].ImageKey = key;
        world.Runs.Seed(run);
        await world.Store.SaveAsync(key, new MemoryStream(StoryTestData.Png()), contentType);

        var file = Assert.IsType<FileStreamResult>(await world.Controller.Image(run.Id, 1, CancellationToken.None));

        Assert.Equal(contentType, file.ContentType);
    }

    // ------------------------------------------------------------------------------------------------ building

    [Fact]
    public async Task Building_with_no_body_uses_what_the_story_started_with()
    {
        var world = new World();
        var run = world.Seed();

        var shown = Data(await world.Controller.Build(run.Id, null, CancellationToken.None));

        Assert.Equal(StoryRunStatus.Building, shown.Status);
        Assert.Equal([run.Id], world.Queue.Enqueued);
        Assert.False(shown.Options.Music);
        Assert.False(shown.Options.RenderWhenReady);
    }

    [Fact]
    public async Task Building_with_a_body_replaces_the_choices_the_story_started_with()
    {
        var world = new World();
        var run = world.Seed();

        var shown = Data(await world.Controller.Build(run.Id, new StoryBuildOptionsRequest
        {
            Narration = StoryNarrationMode.None, Music = true, MusicVolume = 0.4, RenderWhenReady = false
        }, CancellationToken.None));

        Assert.Equal(StoryNarrationMode.None, shown.Options.Narration);
        Assert.True(shown.Options.Music);
        Assert.Equal(0.4, shown.Options.MusicVolume);
    }

    [Fact]
    public async Task Building_a_story_with_no_script_or_one_already_being_made_is_a_conflict()
    {
        var world = new World();
        var waiting = world.Seed(StoryRunStatus.AwaitingScript, withScript: false);
        var busy = world.Seed(StoryRunStatus.Building);

        foreach (var id in new[] { waiting.Id, busy.Id })
        {
            var refusal = await Assert.ThrowsAsync<StoryRunException>(() => world.Controller.Build(id, null, CancellationToken.None));
            Assert.Equal(("build-not-allowed", StoryRunErrorKind.Conflict), (refusal.Code, refusal.Kind));
        }
    }

    [Fact]
    public async Task A_stopped_story_can_be_started_again_from_where_it_stopped()
    {
        var world = new World();
        var run = world.Seed(StoryRunStatus.Building);

        var stopped = Data(await world.Controller.Cancel(run.Id, CancellationToken.None));
        Assert.Equal(StoryRunStatus.Cancelled, stopped.Status);
        Assert.False(stopped.Working);

        var again = Data(await world.Controller.Retry(run.Id, CancellationToken.None));
        Assert.True(again.Working);
        Assert.Equal([run.Id], world.Queue.Enqueued);
    }

    [Fact]
    public async Task Deleting_a_story_removes_it_and_its_files_and_returns_nothing()
    {
        var world = new World();
        var run = await world.SeedWithPictures();
        Assert.NotEmpty(world.Store.Keys);

        var result = await world.Controller.Delete(run.Id, CancellationToken.None);

        Assert.IsType<NoContentResult>(result);
        Assert.Null(world.Runs.Read(run.Id));
        Assert.Empty(world.Store.Keys);
    }

    // ------------------------------------------------------------------------------------------------ how the controller is built

    [Fact]
    public void The_controller_answers_under_its_own_prefix_and_turns_refusals_into_the_envelope()
    {
        var type = typeof(StoryAgentController);

        Assert.Equal("api/story-agent", Assert.Single(type.GetCustomAttributes(typeof(RouteAttribute), inherit: false).Cast<RouteAttribute>()).Template);
        Assert.NotEmpty(type.GetCustomAttributes(typeof(ApiControllerAttribute), inherit: false));
        Assert.NotEmpty(type.GetCustomAttributes(typeof(StoryRunErrorsAttribute), inherit: false));
    }

    [Fact]
    public void No_endpoint_lets_the_caller_say_whose_story_it_is()
    {
        var actions = typeof(StoryAgentController).GetMethods(System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.DeclaredOnly);

        Assert.NotEmpty(actions);
        foreach (var action in actions)
        {
            var routed = action.GetCustomAttributes(typeof(Microsoft.AspNetCore.Mvc.Routing.HttpMethodAttribute), inherit: false)
                .Cast<Microsoft.AspNetCore.Mvc.Routing.HttpMethodAttribute>().ToList();
            Assert.True(routed.Count == 1, $"{action.Name} is not exactly one HTTP endpoint.");
            Assert.DoesNotContain("user", routed[0].Template ?? string.Empty, StringComparison.OrdinalIgnoreCase);
            Assert.DoesNotContain(action.GetParameters(), p => p.Name!.Contains("user", StringComparison.OrdinalIgnoreCase) || p.Name.Contains("owner", StringComparison.OrdinalIgnoreCase));
        }
    }

    [Fact]
    public void A_picture_upload_has_a_size_limit_a_little_over_the_pictures_own()
    {
        var upload = typeof(StoryAgentController).GetMethod(nameof(StoryAgentController.AttachImage))!;

        Assert.Single(upload.GetCustomAttributes(typeof(RequestSizeLimitAttribute), inherit: false));
        var form = Assert.Single(upload.GetCustomAttributes(typeof(RequestFormLimitsAttribute), inherit: false).Cast<RequestFormLimitsAttribute>());

        Assert.True(form.MultipartBodyLengthLimit > VisualsStage.MaxImageBytes);
        Assert.True(form.MultipartBodyLengthLimit < VisualsStage.MaxImageBytes + 1024 * 1024);
    }

    [Fact]
    public void Every_endpoint_that_reads_a_body_refuses_an_oversized_one_before_reading_it()
    {
        var reading = typeof(StoryAgentController)
            .GetMethods(System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.DeclaredOnly)
            .Where(m => m.GetParameters().Any(p => p.GetCustomAttributes(typeof(FromBodyAttribute), inherit: false).Length > 0
                                                   || p.ParameterType == typeof(IFormFile)))
            .ToList();

        Assert.True(reading.Count >= 6, "The endpoints that read a body were not found.");
        foreach (var action in reading)
            Assert.True(action.GetCustomAttributes(typeof(RequestSizeLimitAttribute), inherit: false).Length == 1,
                $"{action.Name} reads a body with no size limit.");
    }

    [Fact]
    public void A_script_the_service_would_accept_is_never_refused_for_its_size_first()
    {
        long Limit(string name) =>
            (long)typeof(StoryAgentController).GetField(name, System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static)!.GetRawConstantValue()!;

        // A character a client escapes as \uXXXX takes six bytes, so that is the most any accepted text can weigh.
        Assert.True(Limit("MaxReplyRequestBytes") >= StoryRunService.MaxScriptReplyChars * 6L);
        Assert.True(Limit("MaxBriefRequestBytes") >= (StoryRunService.MaxTitleChars + StoryRunService.MaxNotesChars) * 6L);
        Assert.True(Limit("MaxScriptRequestBytes") >= StoryScriptParser.MaxTotalNarrationChars * 6L * 2);
    }
}
