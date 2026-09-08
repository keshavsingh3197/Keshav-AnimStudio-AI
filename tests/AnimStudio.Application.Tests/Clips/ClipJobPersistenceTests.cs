using AnimStudio.Domain.Jobs;
using AnimStudio.Domain.Rendering;
using AnimStudio.Infrastructure.Persistence;
using MongoDB.Bson;
using MongoDB.Bson.Serialization;

namespace AnimStudio.Application.Tests.Clips;

/// <summary>
/// The clip spec's trip through BSON and back.
/// <para>
/// Worth asserting without a database because the mapping is implicit: the class maps are
/// auto-generated from conventions, so nothing in the code says a clip spec should persist
/// - it just happens to, until a property shape makes it not. And the failure lands in the
/// worst possible place: the request succeeds, the job is queued, and the worker picks up a
/// job whose running order came back empty.
/// </para>
/// </summary>
public class ClipJobPersistenceTests
{
    private static RenderJob RoundTrip(RenderJob job)
    {
        MongoMappingRegistrar.Register();
        return BsonSerializer.Deserialize<RenderJob>(job.ToBsonDocument());
    }

    private static RenderJob NewJob() => new()
    {
        // The driver assigns this on insert; serializing by hand needs it up front, because
        // the id is stored as a real ObjectId rather than a string.
        Id = ObjectId.GenerateNewId().ToString(),
        ProjectId = "6a9b051711005fa440dd672b",
        UserId = "local",
        Kind = RenderJobKind.ClipMerge,
        ScenesTotal = 3,
        ClipMerge = new ClipMergeSpec
        {
            AssetIds = ["clip-c", "clip-a", "clip-b"],
            Fit = ClipFit.BlurredBackdrop,
            Transition = SceneTransition.Dissolve,
            TransitionFrames = 15,
            MuteClipAudio = true,
            BackgroundMusicAssetId = "music-1",
            BackgroundMusicVolume = 0.22,
            Watermark = new WatermarkSettings
            {
                Kind = WatermarkKind.Text,
                Text = "animstudio.example",
                Position = WatermarkPosition.TopRight,
                Opacity = 0.65,
                HeightFraction = 0.07,
                MarginFraction = 0.03,
                ColorHex = "#FFE164",
                BackplateOpacity = 0.4
            }
        }
    };

    [Fact]
    public void The_running_order_survives_a_round_trip_in_order()
    {
        // Order IS the edit. A list that comes back sorted, deduplicated or empty is a
        // video in the wrong order, with nothing to indicate anything went wrong.
        var restored = RoundTrip(NewJob());

        Assert.Equal(["clip-c", "clip-a", "clip-b"], restored.ClipMerge!.AssetIds);
    }

    [Fact]
    public void Every_watermark_and_join_setting_survives_a_round_trip()
    {
        var restored = RoundTrip(NewJob()).ClipMerge!;

        Assert.Equal(ClipFit.BlurredBackdrop, restored.Fit);
        Assert.Equal(SceneTransition.Dissolve, restored.Transition);
        Assert.Equal(15, restored.TransitionFrames);
        Assert.True(restored.MuteClipAudio);
        Assert.Equal("music-1", restored.BackgroundMusicAssetId);
        Assert.Equal(0.22, restored.BackgroundMusicVolume, 6);

        Assert.Equal(WatermarkKind.Text, restored.Watermark.Kind);
        Assert.Equal("animstudio.example", restored.Watermark.Text);
        Assert.Equal(WatermarkPosition.TopRight, restored.Watermark.Position);
        Assert.Equal(0.65, restored.Watermark.Opacity, 6);
        Assert.Equal(0.07, restored.Watermark.HeightFraction, 6);
        Assert.Equal(0.03, restored.Watermark.MarginFraction, 6);
        Assert.Equal("#FFE164", restored.Watermark.ColorHex);
        Assert.Equal(0.4, restored.Watermark.BackplateOpacity, 6);
    }

    [Fact]
    public void Enums_are_stored_as_names_not_numbers()
    {
        // Numbers would mean reordering an enum silently changes what old documents say -
        // a queued job coming back as a different transition, or the wrong watermark corner.
        MongoMappingRegistrar.Register();

        var document = NewJob().ToBsonDocument();
        var spec = document["clipMerge"].AsBsonDocument;

        Assert.Equal("ClipMerge", document["kind"].AsString);
        Assert.Equal("BlurredBackdrop", spec["fit"].AsString);
        Assert.Equal("Dissolve", spec["transition"].AsString);
        Assert.Equal("TopRight", spec["watermark"]["position"].AsString);
    }

    [Fact]
    public void A_derived_property_is_not_written_to_the_document()
    {
        // IsEnabled is computed from the other fields. Persisting it would make a stored
        // job disagree with itself the moment the rule behind it changed.
        MongoMappingRegistrar.Register();

        var spec = NewJob().ToBsonDocument()["clipMerge"].AsBsonDocument;

        Assert.False(spec["watermark"].AsBsonDocument.Contains("isEnabled"));
    }

    [Fact]
    public void A_project_render_still_stores_no_clip_spec()
    {
        // The two kinds share one document, so the scene path must not start carrying an
        // empty clip spec around.
        MongoMappingRegistrar.Register();

        var job = new RenderJob
        {
            Id = ObjectId.GenerateNewId().ToString(), ProjectId = "p", UserId = "local"
        };
        var restored = RoundTrip(job);

        Assert.Equal(RenderJobKind.Project, restored.Kind);
        Assert.Null(restored.ClipMerge);
    }

    [Fact]
    public void A_document_written_before_clips_existed_still_loads()
    {
        // Jobs already in the database have neither field. IgnoreExtraElements covers new
        // fields arriving; this covers old documents missing them.
        MongoMappingRegistrar.Register();

        var legacy = new BsonDocument
        {
            { "_id", ObjectId.GenerateNewId() },
            { "projectId", "6a9b051711005fa440dd672b" },
            { "userId", "local" },
            { "status", "Completed" },
            { "progress", 100 },
            { "scenesTotal", 4 },
            { "scenesDone", 4 }
        };

        var restored = BsonSerializer.Deserialize<RenderJob>(legacy);

        Assert.Equal(RenderJobKind.Project, restored.Kind);
        Assert.Null(restored.ClipMerge);
        Assert.Equal(RenderJobStatus.Completed, restored.Status);
    }
}
