using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using System.Text.Json.Serialization;
using AnimStudio.Api.Common;
using AnimStudio.Api.Contracts;
using AnimStudio.Application.StoryAgent;
using AnimStudio.Domain.Jobs;
using AnimStudio.Domain.Stories;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Abstractions;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.DependencyInjection;

namespace AnimStudio.Application.Tests.StoryAgent;

/// <summary>
/// What crosses the wire between the Story Agent and the page: what the run turns into, what the page may send, and how
/// a refusal looks. The page is written against these names, so a change to any of them is a change to the page.
/// </summary>
public sealed class StoryAgentApiMappingTests
{
    /// <summary>The API's own settings: camelCase names, enums as their names.</summary>
    private static readonly JsonSerializerOptions Wire = new(JsonSerializerDefaults.Web) { Converters = { new JsonStringEnumConverter() } };

    private static StoryRun Stocked(StoryRunStatus status = StoryRunStatus.ScriptReady)
    {
        var run = StoryTestData.Run(status, "user-1", withScript: true);
        foreach (var scene in run.Script!.Scenes)
        {
            scene.ImageKey = StoryObjectKeys.Image(run.Id, scene.Number, ".png");
            scene.ImageSource = "upload";
            scene.ImageName = $"scene-{scene.Number}.png";
            scene.AudioKey = StoryObjectKeys.Narration(run.Id, scene.Number, "abc123");
            scene.AudioSeconds = 8.5;
        }

        run.Music = new StoryMusicPick
        {
            Provider = "jamendo", TrackId = "1", Title = "Evening Raga", Artist = "Someone", LicenseCode = "by",
            Attribution = "Evening Raga by Someone (CC BY 3.0)", StorageKey = StoryObjectKeys.Music(run.Id)
        };
        return run;
    }

    private static StoryRunResponse Map(StoryRun run, RenderJob? job = null) => StoryAgentMapper.ToResponse(run, job);

    // ------------------------------------------------------------------------------------------------ what leaves the server

    [Fact]
    public void A_run_reaches_the_page_without_a_storage_key_or_an_owner()
    {
        var run = Stocked(StoryRunStatus.Completed);
        run.RenderJobId = "rj1";
        var job = new RenderJob { Id = "rj1", UserId = run.UserId, Status = RenderJobStatus.Completed, Progress = 100, OutputStorageKey = "renders/secret/out.mp4", LogStorageKey = "renders/secret/log.txt" };

        using var doc = JsonDocument.Parse(JsonSerializer.Serialize(Map(run, job), Wire));

        var names = new List<string>();
        var values = new List<string>();
        Walk(doc.RootElement, names, values);

        Assert.NotEmpty(names);
        foreach (var forbidden in new[] { "userId", "storageKey", "imageKey", "audioKey", "audioName", "audioSource", "outputStorageKey", "logStorageKey" })
            Assert.DoesNotContain(forbidden, names, StringComparer.OrdinalIgnoreCase);
        foreach (var leak in new[] { "story-runs/", "renders/secret", run.UserId })
            Assert.DoesNotContain(values, v => v.Contains(leak, StringComparison.Ordinal));
    }

    private static void Walk(JsonElement element, List<string> names, List<string> values)
    {
        switch (element.ValueKind)
        {
            case JsonValueKind.Object:
                foreach (var property in element.EnumerateObject())
                {
                    names.Add(property.Name);
                    Walk(property.Value, names, values);
                }
                break;
            case JsonValueKind.Array:
                foreach (var item in element.EnumerateArray()) Walk(item, names, values);
                break;
            case JsonValueKind.String:
                values.Add(element.GetString()!);
                break;
        }
    }

    [Fact]
    public void The_json_the_page_reads_has_the_names_and_values_it_expects()
    {
        var run = Stocked();

        using var doc = JsonDocument.Parse(JsonSerializer.Serialize(Map(run), Wire));
        var root = doc.RootElement;

        Assert.Equal(run.Id, root.GetProperty("id").GetString());
        Assert.Equal("ScriptReady", root.GetProperty("status").GetString());
        Assert.False(root.GetProperty("working").GetBoolean());
        Assert.Equal(8, root.GetProperty("stages").GetArrayLength());
        Assert.Equal("research", root.GetProperty("stages")[0].GetProperty("id").GetString());
        Assert.Equal("Completed", root.GetProperty("stages")[0].GetProperty("status").GetString());
        Assert.Equal("Pending", root.GetProperty("stages")[2].GetProperty("status").GetString());
        Assert.Equal("Wide", root.GetProperty("brief").GetProperty("format").GetString());
        Assert.Equal("Auto", root.GetProperty("brief").GetProperty("writer").GetString());
        Assert.Equal("Stock", root.GetProperty("options").GetProperty("narration").GetString());

        var script = root.GetProperty("script");
        Assert.Equal(6, script.GetProperty("scenes").GetArrayLength());
        var scene = script.GetProperty("scenes")[1];
        Assert.Equal(2, scene.GetProperty("number").GetInt32());
        Assert.Equal("Text", scene.GetProperty("basis").GetString());
        Assert.True(scene.GetProperty("hasImage").GetBoolean());
        Assert.True(scene.GetProperty("hasAudio").GetBoolean());
        Assert.Equal("upload", scene.GetProperty("imageSource").GetString());
        var source = scene.GetProperty("sources")[0];
        Assert.Equal("bhagavata-purana", source.GetProperty("textId").GetString());
        Assert.Equal("Verified", source.GetProperty("check").GetString());
        Assert.True(source.GetProperty("grounded").GetBoolean());

        Assert.Equal("Evening Raga", root.GetProperty("music").GetProperty("title").GetString());
        Assert.Equal(JsonValueKind.Null, root.GetProperty("kit").ValueKind);
        Assert.Equal(JsonValueKind.Null, root.GetProperty("render").ValueKind);
    }

    [Fact]
    public void A_scene_shows_a_picture_or_narration_only_when_the_file_belongs_to_the_run()
    {
        var run = Stocked();
        var scenes = run.Script!.Scenes;
        scenes[0].ImageKey = "story-runs/sr_someone-else/images/s01-aaaaaaaaaaaa.png";
        scenes[1].ImageKey = $"story-runs/{run.Id}/../sr_someone-else/images/x.png";
        scenes[2].AudioKey = "voice-profiles/vp_x/sample.wav";
        scenes[3].ImageKey = null;

        var shown = Map(run).Script!.Scenes;

        Assert.False(shown[0].HasImage);
        Assert.False(shown[1].HasImage);
        Assert.True(shown[2].HasImage);
        Assert.False(shown[2].HasAudio);
        Assert.True(shown[3].HasAudio);
        Assert.False(shown[3].HasImage);
        Assert.True(shown[4].HasImage && shown[4].HasAudio);
    }

    [Fact]
    public void A_long_passage_is_cut_for_the_page_and_a_short_one_is_not()
    {
        var run = Stocked();
        run.Research!.Passages.Add(new ScripturePassage { TextId = "x", TextName = "X", Ref = "1.1", Excerpt = new string('क', 5_000), Url = "https://example.org" });
        run.Research.Passages.Add(new ScripturePassage { TextId = "x", TextName = "X", Ref = "1.2", Excerpt = "छोटा अंश", Url = "https://example.org" });

        var passages = Map(run).Research!.Passages;

        Assert.EndsWith("...", passages[1].Excerpt, StringComparison.Ordinal);
        Assert.True(passages[1].Excerpt.Length <= 363);
        Assert.Equal("छोटा अंश", passages[2].Excerpt);
    }

    [Fact]
    public void The_script_length_comes_from_the_real_narration_once_it_exists()
    {
        var run = Stocked();
        foreach (var scene in run.Script!.Scenes)
        {
            scene.EstimatedSeconds = 10;
            scene.AudioSeconds = null;
        }

        Assert.Equal(60, Map(run).Script!.EstimatedSeconds);

        run.Script.Scenes[0].AudioSeconds = 20;
        Assert.Equal(70, Map(run).Script!.EstimatedSeconds);
    }

    // ------------------------------------------------------------------------------------------------ the render

    [Theory]
    [InlineData(RenderJobStatus.Completed, "out.mp4", true)]
    [InlineData(RenderJobStatus.CompletedWithWarnings, "out.mp4", true)]
    [InlineData(RenderJobStatus.Completed, null, false)]
    [InlineData(RenderJobStatus.Processing, null, false)]
    [InlineData(RenderJobStatus.Pending, null, false)]
    [InlineData(RenderJobStatus.Failed, null, false)]
    public void A_render_can_be_downloaded_only_once_it_has_a_file(RenderJobStatus status, string? output, bool downloadable)
    {
        var run = Stocked();
        var job = new RenderJob { Id = "rj", UserId = run.UserId, Status = status, Progress = 40, OutputStorageKey = output };

        var render = Map(run, job).Render!;

        Assert.Equal("rj", render.JobId);
        Assert.Equal(status, render.Status);
        Assert.Equal(40, render.Progress);
        Assert.Equal(downloadable, render.Downloadable);
    }

    [Fact]
    public void A_failed_render_says_why_in_words_written_for_the_person()
    {
        var job = new RenderJob { Id = "rj", Status = RenderJobStatus.Failed, Message = "Rendering", ErrorMessage = "The picture for scene 3 could not be read." };

        Assert.Equal("The picture for scene 3 could not be read.", Map(Stocked(), job).Render!.Message);

        job.Status = RenderJobStatus.Processing;
        Assert.Equal("Rendering", Map(Stocked(), job).Render!.Message);
    }

    // ------------------------------------------------------------------------------------------------ the list

    [Fact]
    public void The_summary_counts_finished_steps_in_full_and_the_running_step_by_its_own_progress()
    {
        var run = Stocked(StoryRunStatus.Building);
        run.Stage(StoryStageIds.Visuals).Status = StoryStageStatus.Completed;
        run.Stage(StoryStageIds.Music).Status = StoryStageStatus.Skipped;
        var narration = run.Stage(StoryStageIds.Narration);
        narration.Status = StoryStageStatus.Running;
        narration.Progress = 50;
        narration.Message = "Narrating scene 3 of 6";

        var summary = StoryAgentMapper.ToSummary(run);

        Assert.Equal((4 * 100 + 50) / 8, summary.Progress);
        Assert.Equal("Narrating scene 3 of 6", summary.Message);
        Assert.True(summary.Working);
        Assert.Equal(run.Id, summary.Id);
        Assert.Equal(run.Title, summary.Title);
    }

    [Theory]
    [InlineData(StoryRunStatus.Completed, "Done.")]
    [InlineData(StoryRunStatus.Cancelled, "Stopped.")]
    [InlineData(StoryRunStatus.ScriptReady, "Script ready to read.")]
    [InlineData(StoryRunStatus.AwaitingScript, "Waiting for the script.")]
    public void A_story_that_is_not_running_says_where_it_stands(StoryRunStatus status, string message)
    {
        var run = Stocked(status);

        Assert.Equal(message, StoryAgentMapper.ToSummary(run).Message);
    }

    [Fact]
    public void A_failed_story_gives_its_reason_and_the_list_says_whether_a_project_and_a_kit_exist()
    {
        var run = Stocked(StoryRunStatus.Failed);
        run.ErrorMessage = "No speech engine is turned on.";

        var bare = StoryAgentMapper.ToSummary(run);
        Assert.Equal("No speech engine is turned on.", bare.Message);
        Assert.False(bare.HasProject);
        Assert.False(bare.HasKit);

        run.ProjectId = "66f1b2c3d4e5f60718293a01";
        run.Kit = new StoryPublishKit();
        var done = StoryAgentMapper.ToSummary(run);
        Assert.True(done.HasProject);
        Assert.True(done.HasKit);
        Assert.False(JsonSerializer.Serialize(done, Wire).Contains("66f1b2c3d4e5f60718293a01", StringComparison.Ordinal));
    }

    // ------------------------------------------------------------------------------------------------ what comes in

    [Fact]
    public void Every_build_choice_can_be_sent_and_arrives_unchanged()
    {
        var request = new StoryBuildOptionsRequest
        {
            Narration = StoryNarrationMode.MyVoice, VoiceProfileId = "vp_0123456789abcdef0123456789abcdef", VoiceId = "hf_alpha",
            SpeechEngine = "kokoro", SpeechRate = 0.9, ClosestToMyVoice = true, Visuals = StoryVisualMode.UploadsOnly,
            ImageStyle = "oil painting", Music = false, UploadsAreAiMade = false, MusicQuery = "flute", MusicVolume = 0.35,
            RenderWhenReady = false, AutoApprove = true
        };

        var options = request.ToOptions();

        Assert.Equal(request.Narration, options.Narration);
        Assert.Equal(request.VoiceProfileId, options.VoiceProfileId);
        Assert.Equal(request.VoiceId, options.VoiceId);
        Assert.Equal(request.SpeechEngine, options.SpeechEngine);
        Assert.Equal(request.SpeechRate, options.SpeechRate);
        Assert.True(options.ClosestToMyVoice);
        Assert.Equal(request.Visuals, options.Visuals);
        Assert.Equal(request.ImageStyle, options.ImageStyle);
        Assert.False(options.Music);
        Assert.False(options.UploadsAreAiMade);
        Assert.Equal(request.MusicQuery, options.MusicQuery);
        Assert.Equal(request.MusicVolume, options.MusicVolume);
        Assert.False(options.RenderWhenReady);
        Assert.True(options.AutoApprove);
    }

    [Fact]
    public void A_build_choice_added_to_the_run_must_be_added_to_the_request_too()
    {
        var sent = typeof(StoryBuildOptionsRequest).GetProperties().Select(p => p.Name).ToHashSet(StringComparer.Ordinal);

        foreach (var property in typeof(StoryBuildOptions).GetProperties())
            Assert.True(sent.Contains(property.Name), $"StoryBuildOptionsRequest cannot carry {property.Name}.");
    }

    [Fact]
    public void A_script_edit_carries_words_and_numbers_but_never_a_file()
    {
        var request = new EditStoryScriptRequest
        {
            Title = "शीर्षक", TitleEnglish = "Title", Summary = "सार", MusicQuery = "flute",
            Scenes =
            [
                new EditStorySceneRequest
                {
                    Number = 2, Headline = "सिर्फ़", Narration = "कथा", English = "Story", Basis = "tradition",
                    Sources = [new EditStorySourceRequest { Text = "Bhagavata Purana", Ref = "8.8", Note = "note" }],
                    ImagePrompt = "a lamp", ImageKeywords = ["lamp", "dusk"], Mood = "calm"
                }
            ]
        };

        var edit = request.ToEdit();

        Assert.Equal("शीर्षक", edit.Title);
        Assert.Equal("flute", edit.MusicQuery);
        var scene = Assert.Single(edit.Scenes!);
        Assert.Equal(2, scene.Number);
        Assert.Equal("कथा", scene.Narration);
        Assert.Equal("tradition", scene.Basis);
        Assert.Equal("Bhagavata Purana", Assert.Single(scene.Sources!).Text);
        Assert.Equal(["lamp", "dusk"], scene.ImageKeywords);

        foreach (var type in new[] { typeof(EditStorySceneRequest), typeof(StorySceneEdit) })
        {
            Assert.DoesNotContain(type.GetProperties(), p => p.Name.EndsWith("Key", StringComparison.Ordinal) || p.Name.StartsWith("Audio", StringComparison.Ordinal)
                || p.Name is "ImageSource" or "ImageName");
        }
    }

    [Fact]
    public void An_edit_with_nothing_in_it_is_an_empty_script_edit_not_an_error()
    {
        var edit = new EditStoryScriptRequest().ToEdit();

        Assert.Empty(edit.Scenes!);
    }

    private static List<ValidationResult> Check(object model)
    {
        var results = new List<ValidationResult>();
        Validator.TryValidateObject(model, new ValidationContext(model), results, validateAllProperties: true);
        return results;
    }

    [Fact]
    public void The_limits_the_api_refuses_at_are_the_ones_the_service_would_cut_at()
    {
        Assert.Empty(Check(new CreateStoryRunRequest { Title = new string('a', StoryRunService.MaxTitleChars), Notes = new string('b', StoryRunService.MaxNotesChars) }));

        var title = Assert.Single(Check(new CreateStoryRunRequest { Title = new string('a', StoryRunService.MaxTitleChars + 1) }));
        Assert.Contains("160", title.ErrorMessage, StringComparison.Ordinal);
        var notes = Assert.Single(Check(new CreateStoryRunRequest { Notes = new string('b', StoryRunService.MaxNotesChars + 1) }));
        Assert.Contains("2000", notes.ErrorMessage, StringComparison.Ordinal);

        Assert.Empty(Check(new EditStorySceneRequest { Narration = new string('क', StoryScriptParser.MaxNarrationChars) }));
        Assert.Single(Check(new EditStorySceneRequest { Narration = new string('क', StoryScriptParser.MaxNarrationChars + 1) }));
        Assert.Single(Check(new EditStorySceneRequest { ImageKeywords = [.. Enumerable.Repeat("k", 9)] }));
        Assert.Single(Check(new EditStorySceneRequest { Sources = [.. Enumerable.Repeat(new EditStorySourceRequest(), 9)] }));
        Assert.Single(Check(new EditStoryScriptRequest { Scenes = [.. Enumerable.Repeat(new EditStorySceneRequest(), StoryScriptParser.MaxScenes + 1)] }));
        Assert.Single(Check(new PasteStoryScriptRequest { Reply = new string('x', StoryRunService.MaxScriptReplyChars + 1) }));
    }

    [Fact]
    public void The_enums_a_client_sends_can_be_names_and_the_defaults_are_the_safe_ones()
    {
        var request = JsonSerializer.Deserialize<CreateStoryRunRequest>(
            """{"title":"दीपावली","writer":"Manual","format":"Vertical","options":{"narration":"MyVoice","visuals":"UploadsOnly"}}""", Wire)!;

        Assert.Equal(StoryWriterMode.Manual, request.Writer);
        Assert.Equal(StoryFormat.Vertical, request.Format);
        Assert.Equal(StoryNarrationMode.MyVoice, request.Options!.Narration);
        Assert.Equal(StoryVisualMode.UploadsOnly, request.Options.Visuals);

        var bare = JsonSerializer.Deserialize<CreateStoryRunRequest>("""{"title":"दीपावली"}""", Wire)!;
        Assert.Equal(StoryWriterMode.Auto, bare.Writer);
        Assert.Equal(StoryFormat.Wide, bare.Format);
        Assert.Equal(150, bare.TargetSeconds);
        Assert.Null(bare.Options);
        Assert.Equal(StoryNarrationMode.Stock, new StoryBuildOptionsRequest().Narration);
        Assert.True(new StoryBuildOptionsRequest().RenderWhenReady);
        Assert.False(new StoryBuildOptionsRequest().AutoApprove);
    }

    // ------------------------------------------------------------------------------------------------ refusals

    private static ExceptionContext Raised(Exception error) =>
        new(new ActionContext(
                new DefaultHttpContext { RequestServices = new ServiceCollection().AddLogging().BuildServiceProvider() },
                new RouteData(), new ActionDescriptor()), [])
        { Exception = error };

    [Theory]
    [InlineData(StoryRunErrorKind.Invalid, 400)]
    [InlineData(StoryRunErrorKind.NotFound, 404)]
    [InlineData(StoryRunErrorKind.Conflict, 409)]
    [InlineData(StoryRunErrorKind.Limit, 429)]
    [InlineData(StoryRunErrorKind.Unavailable, 503)]
    public void A_refusal_becomes_the_standard_envelope_with_the_code_the_message_and_the_field(StoryRunErrorKind kind, int status)
    {
        var context = Raised(new StoryRunException(kind, "some-code", "Say this to the person.", "title"));

        new StoryRunErrorsAttribute().OnException(context);

        Assert.True(context.ExceptionHandled);
        var result = Assert.IsType<ObjectResult>(context.Result);
        Assert.Equal(status, result.StatusCode);
        var body = Assert.IsType<ApiResponse<EmptyPayload>>(result.Value);
        Assert.False(body.Success);
        Assert.Equal("Say this to the person.", body.Message);
        var error = Assert.Single(body.Errors);
        Assert.Equal("some-code", error.Code);
        Assert.Equal("Say this to the person.", error.Message);
        Assert.Equal("title", error.Field);
    }

    [Fact]
    public void A_refusal_without_a_field_leaves_the_field_out_and_anything_else_is_left_to_the_global_handler()
    {
        var refused = Raised(new StoryRunException(StoryRunErrorKind.NotFound, "story-not-found", "That story was not found."));
        new StoryRunErrorsAttribute().OnException(refused);
        Assert.Null(Assert.Single(Assert.IsType<ApiResponse<EmptyPayload>>(Assert.IsType<ObjectResult>(refused.Result).Value).Errors).Field);

        var other = Raised(new InvalidOperationException("secret detail"));
        new StoryRunErrorsAttribute().OnException(other);
        Assert.False(other.ExceptionHandled);
        Assert.Null(other.Result);
    }
}
