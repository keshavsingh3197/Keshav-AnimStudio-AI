using AnimStudio.Domain.Ai;
using AnimStudio.Domain.Assets;
using AnimStudio.Domain.Characters;
using AnimStudio.Domain.Ingest;
using AnimStudio.Domain.Jobs;
using AnimStudio.Domain.LiveStreams;
using AnimStudio.Domain.Projects;
using AnimStudio.Domain.Publishing;
using AnimStudio.Domain.Scenes;
using AnimStudio.Domain.Scripts;
using MongoDB.Bson;
using MongoDB.Bson.Serialization;
using MongoDB.Bson.Serialization.Conventions;
using MongoDB.Bson.Serialization.Options;
using MongoDB.Bson.Serialization.Serializers;

namespace AnimStudio.Infrastructure.Persistence;

/// <summary>
/// Teaches the Mongo driver how to store the domain entities.
/// <para>
/// Deliberately done with class maps here rather than <c>[BsonId]</c> attributes on the
/// entities: the Domain project must not reference MongoDB, so all persistence knowledge
/// lives in Infrastructure. This is also far less code than a parallel set of persistence
/// models plus mappers, and there is no risk of the two drifting apart.
/// </para>
/// </summary>
public static class MongoMappingRegistrar
{
    private static bool _registered;
    private static readonly Lock Gate = new();

    public static void Register()
    {
        lock (Gate)
        {
            if (_registered) return;
            _registered = true;

            var conventions = new ConventionPack
            {
                new CamelCaseElementNameConvention(),
                // Tolerate documents written by an older or newer build.
                new IgnoreExtraElementsConvention(true),
                new EnumRepresentationConvention(BsonType.String)
            };
            ConventionRegistry.Register("AnimStudio", conventions, _ => true);

            // TimeSpan has no native BSON type. Stored as whole milliseconds so the values
            // stay human-readable in the shell and sortable in a query.
            BsonSerializer.TryRegisterSerializer(
                new TimeSpanSerializer(BsonType.Int64, TimeSpanUnits.Milliseconds));

            MapWithStringId<Project>();
            MapWithStringId<Character>();
            MapWithStringId<Scene>();
            MapWithStringId<AssetFolder>();
            MapWithStringId<Asset>();
            MapWithStringId<Script>();
            MapWithStringId<TranscriptIngest>();
            MapWithStringId<RenderJob>();
            MapWithStringId<AiUsageRecord>();
            MapWithStringId<AiCredential>();
            MapWithStringId<PromptTemplate>();
            MapWithStringId<AdminAuditEntry>();

            // Not an ObjectId: this document's id is the fixed literal "ai-settings", which
            // is what guarantees there is exactly one of it.
            MapWithLiteralId<AiSettings>();

            // App-assigned GUID ids, valid on SQL Server too - not ObjectIds.
            MapWithLiteralId<ProjectEdit>();

            // "{channelId}:{destinationId}" - the id is what keeps one key per channel per destination.
            MapWithLiteralId<LiveStreamKey>();

            // "{userId}:{channelId}" - one connection per user per channel.
            MapWithLiteralId<YouTubeChannelConnection>();
        }
    }

    /// <summary>
    /// Maps an entity whose <c>Id</c> is a string the application chooses, stored as a
    /// string. Used for the singleton documents, where a generated id would defeat the
    /// point of them.
    /// </summary>
    private static void MapWithLiteralId<T>() where T : class
    {
        if (BsonClassMap.IsClassMapRegistered(typeof(T))) return;

        BsonClassMap.RegisterClassMap<T>(map =>
        {
            map.AutoMap();
            map.SetIdMember(map.GetMemberMap("Id"));
        });
    }

    /// <summary>
    /// Maps an entity whose <c>Id</c> is a string but is stored as a real ObjectId, so
    /// _id keeps its native type and index behaviour.
    /// </summary>
    private static void MapWithStringId<T>() where T : class
    {
        if (BsonClassMap.IsClassMapRegistered(typeof(T))) return;

        BsonClassMap.RegisterClassMap<T>(map =>
        {
            map.AutoMap();

            var idMember = map.GetMemberMap("Id");
            map.SetIdMember(idMember);
            idMember.SetSerializer(new StringSerializer(BsonType.ObjectId));
            // A new entity arrives with an empty id; let the driver assign one.
            idMember.SetIdGenerator(MongoDB.Bson.Serialization.IdGenerators
                .StringObjectIdGenerator.Instance);
        });
    }
}
