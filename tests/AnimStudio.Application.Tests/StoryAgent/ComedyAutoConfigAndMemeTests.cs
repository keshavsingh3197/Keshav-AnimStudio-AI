using System.Text.Json;
using AnimStudio.Api.Common;
using AnimStudio.Api.Controllers;
using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Abstractions.StoryAgent;
using AnimStudio.Application.Ai;
using AnimStudio.Application.Automation;
using AnimStudio.Application.Ecosystem;
using AnimStudio.Application.Publishing;
using AnimStudio.Application.Rendering;
using AnimStudio.Application.Security;
using AnimStudio.Application.StoryAgent;
using AnimStudio.Application.StoryAgent.Stages;
using AnimStudio.Domain.Ai;
using AnimStudio.Domain.Assets;
using AnimStudio.Domain.Automation;
using AnimStudio.Domain.Effects;
using AnimStudio.Domain.Publishing;
using AnimStudio.Domain.Rendering;
using AnimStudio.Domain.Stories;
using AnimStudio.Infrastructure.Automation;
using AnimStudio.Infrastructure.Rendering;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;

namespace AnimStudio.Application.Tests.StoryAgent;

public sealed class ComedyAutoConfigAndMemeTests
{
    private sealed class StubEffectsRepository(params EffectClip[] items) : IEffectClipRepository
    {
        public Task<EffectClip?> GetAsync(string id, CancellationToken ct) =>
            Task.FromResult(items.FirstOrDefault(i => string.Equals(i.Id, id, StringComparison.Ordinal)));

        public Task<IReadOnlyList<EffectClip>> ListByUserAsync(string userId, int limit, CancellationToken ct) =>
            Task.FromResult<IReadOnlyList<EffectClip>>(items.Where(i => i.UserId == userId).Take(limit).ToList());

        public Task<EffectClip?> FindBySourceAssetAsync(string userId, string sourceAssetId, CancellationToken ct) =>
            Task.FromResult<EffectClip?>(null);

        public Task UpsertAsync(EffectClip effect, CancellationToken ct) => Task.CompletedTask;
        public Task<bool> DeleteAsync(string id, CancellationToken ct) => Task.FromResult(false);
    }

    private sealed class StubAiSettingsRepository(AiSettings settings) : IAiSettingsRepository
    {
        public Task<AiSettings?> GetAsync(CancellationToken ct) => Task.FromResult<AiSettings?>(settings);
        public Task SaveAsync(AiSettings updated, CancellationToken ct) => Task.CompletedTask;
    }

    private sealed class OwnerUser : ICurrentUser
    {
        public string UserId => "owner-1";
        public string? DisplayName => null;
        public string? Email => null;
        public bool IsAuthenticated => true;
        public bool IsAdmin => false;
        public IReadOnlyList<string> Roles => [];
    }

    private sealed class AllowedAccess : IStudioAccessEvaluator
    {
        public bool HasPermission(ICurrentUser user, string permissionKey) => true;
        public bool CanAccessFeature(ICurrentUser user, string featureKey) => true;
        public (bool Allowed, string? Reason) CheckRenderQuota(ICurrentUser user, double requestedDurationSeconds) => (true, null);
        public (bool Allowed, string? Reason) CheckAiQuota(ICurrentUser user) => (true, null);
    }

    private static EffectClip MemeClip(string id, string name, params string[] tags) => new()
    {
        Id = id,
        UserId = "owner-1",
        Name = name,
        Category = EffectCategory.Reaction,
        Kind = AssetKind.Video,
        Tags = [.. tags],
        StorageKey = $"effects/{id}.mp4"
    };

    [Fact]
    public void Comedy_channel_matcher_and_youtube_sync_keep_funny_channels_separate_from_devotional()
    {
        Assert.True(ComedyChannelMatcher.IsComedyChannelHint("@KESHAV-ANIM-FF", "Keshav Funny"));
        Assert.True(ComedyChannelMatcher.IsComedyChannelHint("Hasya Tapri Shorts"));
        Assert.False(ComedyChannelMatcher.IsComedyChannelHint("Daily Hindu Panchang"));
        Assert.False(ComedyChannelMatcher.IsComedyChannelHint("Sanatan Bhakti Katha"));

        var settings = new AiSettings();
        var ids = 0;
        var sync = BrandChannelYouTubeSync.Apply(settings,
        [
            new YouTubeChannelIdentity("UCfunny12345678901234567", "Keshav Funny Shorts", "@keshav-anim-ff", null),
            new YouTubeChannelIdentity("UCpanch12345678901234567", "Daily Hindu Panchang", "@hindupanchang", null)
        ], createMissing: true, () => $"bc_{++ids}");

        var funny = sync.Created.Single(c => c.Name == "Keshav Funny Shorts");
        var devotional = sync.Created.Single(c => c.Name == "Daily Hindu Panchang");
        Assert.True(funny.IsComedyChannel);
        Assert.True(funny.AutoInsertMidMemes);
        Assert.False(devotional.IsComedyChannel);
    }

    [Fact]
    public void StoryScriptPrompt_injects_KhadiBhasha_TuTadak_and_library_memes_only_for_comedy()
    {
        var comedyRun = new StoryRun
        {
            UserId = "owner-1",
            Brief = new StoryBrief
            {
                Title = "टपरी पर उधार कांड",
                Language = "hi",
                TargetSeconds = 30,
                GenreId = StoryGenres.FunnyId,
                Mode = StoryGenreMode.Creative,
                ComedyStyle = ComedyToneStyle.KhadiBhasha,
                AutoInsertMemes = true
            },
            Genre = StoryGenres.Funny(),
            Research = new StoryResearch()
        };
        var memes = new[]
        {
            MemeClip("m1", "Are Baawle Shock", "shocked", "surprise"),
            MemeClip("m2", "Khatam Tata Bye", "ending", "roast")
        };

        var (_, comedyVars) = StoryScriptPrompt.For(comedyRun, memes);
        Assert.Contains("खड़ी भाषा", comedyVars["genre"]);
        Assert.Contains("Are Baawle Shock", comedyVars["genre"]);
        Assert.Contains("MIDDLE", comedyVars["genre"]);

        var devotionalRun = new StoryRun
        {
            UserId = "owner-1",
            Brief = StorySamples.Brief("hi", 150),
            Genre = StoryGenres.Devotional(),
            Research = StorySamples.Research()
        };
        var (devKey, devVars) = StoryScriptPrompt.For(devotionalRun, memes);
        Assert.Equal(BuiltInPrompts.StoryScript, devKey);
        Assert.False(devVars.ContainsKey("genre"));
        Assert.DoesNotContain("Are Baawle Shock", devVars["notes"] ?? string.Empty);
    }

    [Fact]
    public async Task ScriptStage_auto_inserts_mid_video_and_climax_memes_for_comedy_runs_only()
    {
        var aiReply = """
            {
              "title": "टपरी का बिल",
              "titleEnglish": "Tapri Bill",
              "summary": "Funny tapri bill story",
              "musicQuery": "playful comedy",
              "cast": [
                { "name": "पप्पू", "gender": "male", "age": "adult" },
                { "name": "बबलू", "gender": "male", "age": "adult" }
              ],
              "scenes": [
                { "headline": "ओपनिंग", "narration": "अबे पप्पू आज समोसे तू खिला रहा है ना?", "english": "Scene 1", "imagePrompt": "Tapri day", "videoPrompt": "Talking", "mood": "playful", "lines": [{ "speaker": "बबलू", "text": "अबे पप्पू आज समोसे तू खिला रहा है ना?", "emotion": "excited" }] },
                { "headline": "बहाना", "narration": "अरे यार मेरा यूपीआई नेटवर्क अटक गया!", "english": "Scene 2", "imagePrompt": "Tapri shock", "videoPrompt": "Shocked", "mood": "playful", "lines": [{ "speaker": "पप्पू", "text": "अरे यार मेरा यूपीआई नेटवर्क अटक गया!", "emotion": "surprised" }] },
                { "headline": "पोपट", "narration": "टपरी वाले भैया के पास तेरा उधार पहले से लिखा है!", "english": "Scene 3", "imagePrompt": "Tapri board", "videoPrompt": "Laughing", "mood": "happy", "lines": [{ "speaker": "बबलू", "text": "टपरी वाले भैया के पास तेरा उधार पहले से लिखा है!", "emotion": "laughing" }] }
              ]
            }
            """;

        var effectsRepo = new StubEffectsRepository(
            MemeClip("mem_mid", "Dimag Hang", "surprised", "shock"),
            MemeClip("mem_end", "Khatam Tata Bye", "laughing", "happy"));

        var ai = new FakeAi { Text = _ => FakeAi.TextOk(aiReply, "gemini") };
        var stage = new ScriptStage(
            ai,
            new FakePrompts(),
            new StoryClock(new DateTimeOffset(StorySamples.Now)),
            NullLogger<ScriptStage>.Instance,
            effectsRepo,
            new StubAiSettingsRepository(new AiSettings()));

        var run = new StoryRun
        {
            Id = "sr_test1",
            UserId = "owner-1",
            Status = StoryRunStatus.WritingScript,
            Brief = new StoryBrief
            {
                Title = "टपरी का बिल",
                Language = "hi",
                TargetSeconds = 30,
                GenreId = StoryGenres.FunnyId,
                Mode = StoryGenreMode.Creative,
                ComedyStyle = ComedyToneStyle.TuTadak,
                AutoInsertMemes = true
            },
            Genre = StoryGenres.Funny(),
            Research = new StoryResearch()
        };

        var outcome = await stage.RunAsync(new StoryStageContext
        {
            Run = run,
            Report = (_, _) => Task.CompletedTask,
            Save = () => Task.CompletedTask
        }, CancellationToken.None);

        Assert.Equal(StoryStageResult.Completed, outcome.Result);
        Assert.NotNull(run.Script);
        Assert.Null(run.Script!.Scenes[0].Meme);
        Assert.NotNull(run.Script.Scenes[1].Meme); // middle buildup scene automatically gets mid-video meme
        Assert.Equal("mem_mid", run.Script.Scenes[1].Meme!.EffectId);
        Assert.NotNull(run.Script.Scenes[2].Meme); // climax scene also gets payoff meme
        Assert.Equal("mem_end", run.Script.Scenes[2].Meme!.EffectId);
    }

    [Theory]
    [InlineData(ComedyToneStyle.KhadiBhasha, "बावले", "[MEME]:")]
    [InlineData(ComedyToneStyle.TuTadak, "अबे सुन", "[MEME]:")]
    [InlineData(ComedyToneStyle.FamilyClean, "अरे वाह", "[MEME]:")]
    public void AutomationContentComposer_generates_distinct_comedy_dialects_with_mid_video_meme_cues(
        ComedyToneStyle style,
        string expectedPhrase,
        string expectedMemeMarker)
    {
        var rule = new AutomationRule
        {
            Id = "ar_funny",
            SourceType = AutomationSourceType.FunnyComedy,
            Language = "hi",
            ComedyStyle = style,
            AutoInsertMemes = true,
            EnableCharacterDialogue = true,
            SpeakerAName = "पप्पू भैया",
            SpeakerBName = "बबलू यार"
        };
        var signals = new EcosystemSignalsSnapshot(
            DateKey: "2026-11-17",
            Location: "New Delhi",
            Panchang: null,
            UpcomingFestivals: [],
            DailyKatha: null,
            HistoricalIncidents: [],
            Competitions: [],
            FunnelCampaigns: [],
            Warnings: [],
            FetchedAtUtc: DateTimeOffset.UtcNow);
        var ecosystem = new StudioEcosystemConfig(
            StudioTitle: "AnimStudio AI",
            StudioTagline: "Comedy Studio",
            CreatorName: "Keshav Singh",
            CreatorPortfolioUrl: "https://keshavsingh.in",
            LegalUpdatedDate: "2026-11-17",
            CopyrightNotice: "Copyright Keshav",
            AdminUrl: "https://admin.keshavsingh.in",
            IdpUrl: "https://admin.keshavsingh.in",
            StudioUrl: "https://studio.example.com",
            DefaultChannelKey: "keshav-anim-ff",
            EngineName: "AnimStudio",
            VisualsCredit: "AnimStudio",
            DefaultBranding: new ChannelBranding(),
            Websites: [new EcosystemWebsiteItem("studio", "Studio", "Studio", "Studio", "https://studio.example.com", "Studio", "🎬", "LIVE", "#F97316", true, 1)],
            Channels: [],
            SocialLinks: [],
            RetiredChannelUrls: [],
            RetiredChannelNames: [],
            SyncedFromCentral: true,
            LastSyncedAt: DateTimeOffset.UtcNow);

        var composed = AutomationContentComposer.ComposeForRule(rule, signals, ecosystem).Single();
        Assert.Contains(expectedPhrase, composed.Script);
        Assert.Contains(expectedMemeMarker, composed.Script);
    }

    [Fact]
    public void DialogueParser_and_CleanPastedDialogue_preserve_mid_meme_cues_and_build_ffmpeg_overlay()
    {
        var script = """
            [CAST]: पप्पू भैया | scholar | orange hoodie
            [CAST]: बबलू यार | child | green hoodie
            [SCENE]: chai stall | day | playful | IMAGE: lively Indian chai tapri
            [पप्पू भैया]: अबे सुन बबलू, आज बिल तेरा भाई देगा!
            [बबलू यार]: (sarcastic) तेरे पास खुद का उधार चुकाने के पैसे हैं?
            [MEME]: shocked_face | भाई का दिमाग़ हैंग! | 1.8
            [पप्पू भैया]: (laughing) अरे टपरी वाले भैया के पास मेरी VIP उधार डायरी है!
            """;

        var cleaned = EcosystemAutomationService.CleanPastedDialogue(script);
        Assert.NotNull(cleaned);
        Assert.Contains("[MEME]: shocked_face | भाई का दिमाग़ हैंग! | 1.8", cleaned);

        var plan = DialogueScriptParser.ParsePlan(
            "Tapri Comedy", cleaned, null, 25, enableDialogue: true, "पप्पू भैया", "बबलू यार", "FunnyComedy");
        Assert.DoesNotContain(plan.Turns, t => t.Text.Contains("shocked_face", StringComparison.OrdinalIgnoreCase));
        var cue = Assert.Single(plan.Memes);
        Assert.Equal("shocked_face", cue.Name);
        Assert.Equal("भाई का दिमाग़ हैंग!", cue.Caption);

        var ffmpegArgs = ProceduralVideoGeneratorService.BuildFfmpegArguments(
            720, 1280, 24, 25, hasSpeech: true, hasBgm: true, hasSubtitles: true,
            memeOverlays: [new ProceduralVideoGeneratorService.ResolvedMemeOverlay("in/meme_0.png", cue.StartSeconds, cue.StartSeconds + 1.8)]);
        var argStr = string.Join(' ', ffmpegArgs);
        Assert.Contains("in/meme_0.png", argStr);
        Assert.Contains("overlay=(W-w)/2:H*0.16:eof_action=repeat:enable='between(t,", argStr);
        Assert.Contains("ass=in/subs.ass[vout]", argStr);
    }

    [Fact]
    public void DialogueTemplatePrompt_adapts_for_FunnyComedy_and_includes_user_memes()
    {
        var post = new AutomationPost
        {
            Id = "ap_1",
            SourceType = AutomationSourceType.FunnyComedy,
            Title = "5 AM Gym Roast",
            Script = "[पप्पू भैया]: कल से पाँच बजे जिम!\n[बबलू यार]: अभी ग्यारह बज रहे हैं!",
            Language = "hi",
            Format = AutomationVideoFormat.Vertical,
            ComedyStyle = ComedyToneStyle.TuTadak,
            AutoInsertMemes = true
        };
        var rule = new AutomationRule { Id = "ar_1", SourceType = AutomationSourceType.FunnyComedy, TargetSeconds = 30 };
        var memes = new[] { MemeClip("m_1", "Dimag Hang", "shock", "funny") };

        var prompt = EcosystemAutomationService.BuildDialogueTemplatePrompt(post, rule, 30, memes);
        Assert.Contains("तू-तड़ाक", prompt);
        Assert.Contains("Dimag Hang", prompt);
        Assert.Contains("[MEME]:", prompt);
        Assert.DoesNotContain("Last line:", prompt);
    }

    [Fact]
    public async Task ComedyWorkspaceController_convert_injects_user_reaction_memes_and_comedy_dialect()
    {
        var ai = new FakeAi { Text = _ => FakeAi.TextOk("{\"kind\":\"animstudio-story\"}") };
        var controller = new ComedyWorkspaceController(
            ai,
            new AllowedAccess(),
            new OwnerUser(),
            new StubEffectsRepository(MemeClip("m1", "Are Baawle", "khadi", "shock")));

        var request = new ComedyWorkspaceRequest
        {
            Title = "Chai Tapri Roast",
            Material = "Pappu forgets wallet at chai tapri.",
            Language = "hi",
            Style = "3D",
            TargetSeconds = 30,
            Voicing = "CharactersOnly",
            ComedyStyle = ComedyToneStyle.KhadiBhasha,
            IncludeMidMemes = true
        };

        var result = Assert.IsType<OkObjectResult>((await controller.Convert(request, CancellationToken.None)).Result);
        Assert.IsType<ApiResponse<ComedyConversionResponse>>(result.Value);
        var sentPrompt = Assert.Single(ai.TextCalls).Prompt;
        Assert.Contains("खड़ी भाषा", sentPrompt);
        Assert.Contains("Are Baawle", sentPrompt);
    }
}
