using AnimStudio.Domain.Assets;
using AnimStudio.Domain.Characters;
using AnimStudio.Domain.Ingest;
using AnimStudio.Domain.Jobs;
using AnimStudio.Domain.Projects;
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
            MapWithStringId<Asset>();
            MapWithStringId<Script>();
            MapWithStringId<TranscriptIngest>();
            MapWithStringId<RenderJob>();
        }
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
