using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Abstractions.Rendering;
using AnimStudio.Application.Abstractions.Storage;
using AnimStudio.Application.Abstractions.Transcripts;
using AnimStudio.Application.Ingest;
using AnimStudio.Application.Options;
using AnimStudio.Application.Rendering;
using AnimStudio.Application.Scenes;
using AnimStudio.Application.Scripts;
using AnimStudio.Application.Security;
using AnimStudio.Application.Transcripts.Parsing;
using AnimStudio.Domain.Transcripts;
using AnimStudio.Infrastructure.Ffmpeg;
using AnimStudio.Infrastructure.Ffmpeg.Graph;
using AnimStudio.Infrastructure.Ingest;
using AnimStudio.Infrastructure.Jobs;
using AnimStudio.Infrastructure.Persistence;
using AnimStudio.Infrastructure.Storage;
using AnimStudio.Infrastructure.Subtitles;
using KeshavSingh.Mongo.NoSql;
using KeshavSingh.Storage;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

// Both the Application port and KeshavSingh.Storage declare an IObjectStore.
using AppObjectStore = AnimStudio.Application.Abstractions.Storage.IObjectStore;

namespace AnimStudio.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddAnimStudioInfrastructure(
        this IServiceCollection services, IConfiguration configuration)
    {
        // --- options
        services.Configure<FfmpegOptions>(configuration.GetSection(FfmpegOptions.Section));
        services.Configure<RenderOptions>(configuration.GetSection(RenderOptions.Section));
        services.Configure<IngestOptions>(configuration.GetSection(IngestOptions.Section));
        services.Configure<SegmentationOptions>(configuration.GetSection("Segmentation"));
        services.Configure<ParsingOptions>(configuration.GetSection("Parsing"));

        services.AddSingleton(TimeProvider.System);

        // --- shared packages: Mongo access and blob storage come from KeshavSingh.*
        // rather than being reimplemented here.
        services.AddKeshavMongo(configuration);
        services.AddKeshavStorage(configuration);

        MongoMappingRegistrar.Register();

        // Adapts the package's IObjectStore to the Application layer's own port.
        services.AddSingleton<AppObjectStore, KeshavObjectStoreAdapter>();

        // --- persistence
        services.AddScoped<IProjectRepository, MongoProjectRepository>();
        services.AddScoped<ICharacterRepository, MongoCharacterRepository>();
        services.AddScoped<ISceneRepository, MongoSceneRepository>();
        services.AddScoped<IAssetRepository, MongoAssetRepository>();
        services.AddScoped<IScriptRepository, MongoScriptRepository>();
        services.AddScoped<IIngestRepository, MongoIngestRepository>();
        services.AddScoped<IRenderJobRepository, MongoRenderJobRepository>();
        services.AddHostedService<MongoIndexInitializer>();

        // --- identity (local for now; see ICurrentUser)
        services.AddScoped<ICurrentUser, LocalSingleUserProvider>();

        // --- transcripts
        services.AddSingleton<ISubtitleParser>(sp => new SubtitleParser(
            sp.GetRequiredService<Microsoft.Extensions.Options.IOptions<ParsingOptions>>().Value));
        services.AddSingleton<ISegmentationEngine, SegmentationEngine>();
        services.AddSingleton<YtDlpCaptionDownloader>();

        services.AddScoped<ITranscriptSource, PastedTextTranscriptSource>();
        services.AddScoped<ITranscriptSource, UploadedSubtitleTranscriptSource>();
        services.AddScoped<ITranscriptSource, YouTubeCaptionsTranscriptSource>();
        services.AddScoped<TranscriptSourceSelector>();

        services.AddScoped<Func<TranscriptSourceKind, ITranscriptSource>>(sp =>
            kind => sp.GetRequiredService<TranscriptSourceSelector>().Resolve(kind));

        services.AddScoped<TranscriptIngestService>();
        services.AddScoped<SceneGenerationService>();

        // --- rendering
        services.AddSingleton<IFfmpegRunner, FfmpegRunner>();
        services.AddSingleton<FfmpegCapabilityProbe>();

        // Probed once at startup so the graph builder can stay a pure function and the API
        // can refuse a render up front instead of failing deep inside a job.
        services.AddSingleton<IRenderCapabilities>(sp =>
            sp.GetRequiredService<FfmpegCapabilityProbe>()
              .ProbeAsync(CancellationToken.None)
              .GetAwaiter().GetResult());

        services.AddSingleton<IFilterGraphBuilder, FfmpegFilterGraphBuilder>();
        services.AddSingleton<ISubtitleWriter, AssSubtitleWriter>();
        services.AddSingleton<IRenderWorkspaceFactory, RenderWorkspaceFactory>();
        services.AddScoped<IVideoRenderingService, FfmpegVideoRenderingService>();
        services.AddScoped<IMediaProbeService, FfprobeMediaProbeService>();
        services.AddScoped<ProjectRenderOrchestrator>();

        services.AddHostedService<RenderJobWorker>();
        services.AddHostedService<RenderWorkspaceJanitor>();

        return services;
    }
}
