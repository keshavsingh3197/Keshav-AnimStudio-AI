using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Abstractions.Rendering;
using AnimStudio.Application.Abstractions.Storage;
using AnimStudio.Application.Abstractions.Diagnostics;
using AnimStudio.Application.Abstractions.Transcripts;
using AnimStudio.Application.Abstractions.Workbooks;
using AnimStudio.Application.Admin;
using AnimStudio.Application.Ai;
using AnimStudio.Application.Assets;
using AnimStudio.Application.Characters;
using AnimStudio.Application.Clips;
using AnimStudio.Application.Ingest;
using AnimStudio.Application.Options;
using AnimStudio.Application.Projects;
using AnimStudio.Application.Rendering;
using AnimStudio.Application.Scenes;
using AnimStudio.Application.Scripts;
using AnimStudio.Application.Security;
using AnimStudio.Application.Transcripts.Parsing;
using AnimStudio.Application.Workbooks;
using AnimStudio.Domain.Ai;
using AnimStudio.Domain.Transcripts;
using AnimStudio.Infrastructure.Ai;
using AnimStudio.Infrastructure.Ai.Providers;
using AnimStudio.Infrastructure.Ffmpeg;
using AnimStudio.Infrastructure.Ffmpeg.Graph;
using AnimStudio.Infrastructure.Ingest;
using AnimStudio.Infrastructure.Jobs;
using AnimStudio.Infrastructure.Persistence;
using AnimStudio.Infrastructure.Storage;
using AnimStudio.Infrastructure.Subtitles;
using AnimStudio.Infrastructure.Diagnostics;
using AnimStudio.Infrastructure.Workbooks;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using KeshavSingh.Mongo.NoSql;
using KeshavSingh.Security;
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
        services.Configure<AiOptions>(configuration.GetSection(AiOptions.Section));

        // The administrator-editable half of the AI configuration, laid over the values
        // bound above. Registered as a post-configure plus a change-token source so that
        // every existing consumer keeps reading IOptionsMonitor<AiOptions> and none of them
        // has to know an admin console exists - see AiRuntimeSettings.
        services.AddSingleton<AiRuntimeSettings>();
        services.AddSingleton<IPostConfigureOptions<AiOptions>, AiSettingsPostConfigure>();
        services.AddSingleton<IOptionsChangeTokenSource<AiOptions>, AiSettingsChangeTokenSource>();

        services.AddSingleton(TimeProvider.System);

        // --- shared packages: Mongo access and blob storage come from KeshavSingh.*
        // rather than being reimplemented here.
        RequireMongoConnectionString(configuration);
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
        services.AddScoped<IAiUsageRepository, MongoAiUsageRepository>();
        services.AddScoped<IAiCredentialRepository, MongoAiCredentialRepository>();
        services.AddScoped<IPromptTemplateRepository, MongoPromptTemplateRepository>();
        services.AddScoped<IAiSettingsRepository, MongoAiSettingsRepository>();
        services.AddScoped<IAdminAuditRepository, MongoAdminAuditRepository>();
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

        // --- editing
        services.AddScoped<ProjectStatusService>();
        services.AddScoped<ProjectEditingService>();
        services.AddScoped<CharacterEditingService>();
        services.AddScoped<SceneEditingService>();
        services.AddScoped<AssetLibraryService>();

        // --- ai
        // Singleton because the registry owns the per-provider circuit state, which has to
        // outlive a request to be worth anything.
        services.AddSingleton<IAiProviderRegistry, AiProviderRegistry>();

        // The cache is a singleton over the object store; the quota guard and the executor
        // are scoped because they read the usage collection through a scoped repository.
        services.AddSingleton<IAiResultCache, AiResultCache>();
        services.AddScoped<IAiQuotaGuard, AiQuotaGuard>();
        services.AddScoped<IAiExecutor, AiExecutor>();
        services.AddScoped<IPromptLibrary, PromptLibrary>();

        // Provider keys are encrypted at rest with the family's AES-256-GCM data protector,
        // which already handles key rotation. Registered lazily: an app with no AI provider
        // has no reason to require an Encryption:DataKey, and demanding one would make the
        // no-AI default harder to run than the AI one.
        services.Configure<EncryptionOptions>(configuration.GetSection(EncryptionOptions.Section));
        services.AddSingleton<DataProtector>();
        services.AddSingleton(sp => new Lazy<DataProtector>(sp.GetRequiredService<DataProtector>));
        services.AddScoped<IAiCredentialStore, AiCredentialStore>();
        services.AddScoped<IAiSettingsStore, AiSettingsStore>();

        // One pooled client per provider endpoint, with the SSRF checks applied at connect
        // time. Singleton so connections are actually reused.
        services.AddSingleton<IAiHttpClientFactory, AiHttpClientFactory>();

        // Bridges the singleton providers to the scoped credential store, and is what makes
        // IAiProvider.IsConfigured answerable without an await. Warmed at startup so a
        // database-held key is not reported missing for the first request after a restart.
        services.AddSingleton<IAiSecretResolver, AiSecretResolver>();
        services.AddHostedService<AiSecretWarmup>();
        services.AddHostedService<AiSettingsWarmup>();

        services.AddAiProviders(configuration);

        // --- rendering
        services.AddSingleton<IFfmpegRunner, FfmpegRunner>();
        services.AddSingleton<FfmpegCapabilityProbe>();

        // Probed once at startup so the graph builder can stay a pure function and the API
        // can refuse a render up front instead of failing deep inside a job.
        services.AddSingleton<IRenderCapabilities>(sp =>
            sp.GetRequiredService<FfmpegCapabilityProbe>()
              .ProbeAsync(CancellationToken.None)
              .GetAwaiter().GetResult());

        // Singleton because the answer is a property of the machine, not of the job: a
        // per-clip scan of the system font directories would repeat work with a fixed
        // result.
        services.AddSingleton<WatermarkFontResolver>();

        services.AddSingleton<IFilterGraphBuilder, FfmpegFilterGraphBuilder>();
        services.AddSingleton<ISubtitleWriter, AssSubtitleWriter>();
        services.AddSingleton<IRenderWorkspaceFactory, RenderWorkspaceFactory>();
        services.AddScoped<IVideoRenderingService, FfmpegVideoRenderingService>();
        services.AddScoped<IMediaProbeService, FfprobeMediaProbeService>();
        services.AddScoped<ProjectRenderOrchestrator>();

        // The clip stitch. Shares the queue, the workspace and the merge with the project
        // render above; only the per-clip conform pass is its own.
        services.AddScoped<ClipMergeService>();
        services.AddScoped<ClipMergeOrchestrator>();

        // The bundle path: no AI provider, no quota, no network. Staging is a singleton
        // because its token index is process-wide state; the importer is scoped like every
        // other service that writes through the repositories.
        services.AddSingleton<IWorkbookImportStaging, WorkbookImportStaging>();
        services.AddScoped<WorkbookImportService>();
        services.AddScoped<BundleExportService>();

        // --- running the server
        services.AddScoped<AdminAuditService>();
        services.AddScoped<ISystemHealthService, SystemHealthService>();

        services.AddHostedService<RenderJobWorker>();
        services.AddHostedService<RenderWorkspaceJanitor>();

        return services;
    }

    /// <summary>
    /// Registers one provider instance per known or configured provider id.
    /// </summary>
    /// <remarks>
    /// <para>
    /// Every catalogue entry is registered whether or not it is configured. A registered
    /// provider that has no key reports <c>NotConfigured</c>, which is what lets
    /// <c>GET /api/ai/capabilities</c> tell a user "Groq is supported, add a key" rather
    /// than staying silent about a provider this build can actually talk to. Enablement and
    /// configuration are read from IOptionsMonitor at call time, so turning a provider on
    /// does not need a restart.
    /// </para>
    /// <para>
    /// A configured id that is NOT in the catalogue is registered too, as long as it names
    /// a <c>Family</c>. That is what lets an operator point at any OpenAI-compatible service
    /// this build has never heard of without anyone writing a class - and it is safe to
    /// allow because the endpoint still has to pass the host allowlist and the connect-time
    /// address check before a single byte leaves the machine.
    /// </para>
    /// </remarks>
    private static IServiceCollection AddAiProviders(
        this IServiceCollection services, IConfiguration configuration)
    {
        var families = new Dictionary<AiProviderId, AiProviderFamily>();

        foreach (var descriptor in KnownAiProviders.All)
            families[descriptor.ProviderId] = descriptor.Family;

        var options = configuration.GetSection(AiOptions.Section).Get<AiOptions>() ?? new AiOptions();

        foreach (var (name, providerOptions) in options.Providers)
        {
            if (!AiProviderId.TryParse(name, out var id) || families.ContainsKey(id)) continue;

            if (Enum.TryParse<AiProviderFamily>(providerOptions.Family, ignoreCase: true, out var family))
                families[id] = family;
        }

        foreach (var (id, family) in families)
        {
            // Captured per iteration on purpose: each registration builds a provider bound
            // to one id, which is how a single class serves five services.
            var providerId = id;

            switch (family)
            {
                case AiProviderFamily.OpenAiCompatibleText:
                    services.AddSingleton<IAiProvider>(sp => new OpenAiCompatibleTextProvider(
                        providerId,
                        sp.GetRequiredService<IAiHttpClientFactory>(),
                        sp.GetRequiredService<IAiSecretResolver>(),
                        sp.GetRequiredService<IOptionsMonitor<AiOptions>>(),
                        sp.GetRequiredService<ILogger<OpenAiCompatibleTextProvider>>()));
                    break;

                case AiProviderFamily.GeminiText:
                    services.AddSingleton<IAiProvider>(sp => new GeminiTextProvider(
                        providerId,
                        sp.GetRequiredService<IAiHttpClientFactory>(),
                        sp.GetRequiredService<IAiSecretResolver>(),
                        sp.GetRequiredService<IOptionsMonitor<AiOptions>>(),
                        sp.GetRequiredService<ILogger<GeminiTextProvider>>()));
                    break;

                case AiProviderFamily.PollinationsImage:
                    services.AddSingleton<IAiProvider>(sp => new PollinationsImageProvider(
                        providerId,
                        sp.GetRequiredService<IAiHttpClientFactory>(),
                        sp.GetRequiredService<IAiSecretResolver>(),
                        sp.GetRequiredService<IOptionsMonitor<AiOptions>>(),
                        sp.GetRequiredService<ILogger<PollinationsImageProvider>>()));
                    break;

                case AiProviderFamily.CloudflareWorkersAiImage:
                    services.AddSingleton<IAiProvider>(sp => new CloudflareWorkersAiImageProvider(
                        providerId,
                        sp.GetRequiredService<IAiHttpClientFactory>(),
                        sp.GetRequiredService<IAiSecretResolver>(),
                        sp.GetRequiredService<IOptionsMonitor<AiOptions>>(),
                        sp.GetRequiredService<ILogger<CloudflareWorkersAiImageProvider>>()));
                    break;

                case AiProviderFamily.HuggingFaceImage:
                    services.AddSingleton<IAiProvider>(sp => new HuggingFaceImageProvider(
                        providerId,
                        sp.GetRequiredService<IAiHttpClientFactory>(),
                        sp.GetRequiredService<IAiSecretResolver>(),
                        sp.GetRequiredService<IOptionsMonitor<AiOptions>>(),
                        sp.GetRequiredService<ILogger<HuggingFaceImageProvider>>()));
                    break;

                case AiProviderFamily.PiperSpeech:
                    services.AddSingleton<IAiProvider>(sp => new PiperLocalSpeechProvider(
                        providerId,
                        sp.GetRequiredService<IOptionsMonitor<AiOptions>>(),
                        sp.GetRequiredService<ILogger<PiperLocalSpeechProvider>>()));
                    break;

                case AiProviderFamily.OpenAiCompatibleTts:
                    services.AddSingleton<IAiProvider>(sp => new OpenAiCompatibleTtsProvider(
                        providerId,
                        sp.GetRequiredService<IAiHttpClientFactory>(),
                        sp.GetRequiredService<IAiSecretResolver>(),
                        sp.GetRequiredService<IOptionsMonitor<AiOptions>>(),
                        sp.GetRequiredService<ILogger<OpenAiCompatibleTtsProvider>>()));
                    break;

                case AiProviderFamily.ComfyUiImage:
                    services.AddSingleton<IAiProvider>(sp => new ComfyUiLocalImageProvider(
                        providerId,
                        sp.GetRequiredService<IAiHttpClientFactory>(),
                        sp.GetRequiredService<IAiSecretResolver>(),
                        sp.GetRequiredService<IOptionsMonitor<AiOptions>>(),
                        sp.GetRequiredService<ILogger<ComfyUiLocalImageProvider>>()));
                    break;

                case AiProviderFamily.WhisperCppTranscription:
                    services.AddSingleton<IAiProvider>(sp => new WhisperCppLocalTranscriptionProvider(
                        providerId,
                        sp.GetRequiredService<IOptionsMonitor<AiOptions>>(),
                        sp.GetRequiredService<ILogger<WhisperCppLocalTranscriptionProvider>>()));
                    break;

                case AiProviderFamily.OpenAiCompatibleAsr:
                    services.AddSingleton<IAiProvider>(sp => new OpenAiCompatibleAsrProvider(
                        providerId,
                        sp.GetRequiredService<IAiHttpClientFactory>(),
                        sp.GetRequiredService<IAiSecretResolver>(),
                        sp.GetRequiredService<IOptionsMonitor<AiOptions>>(),
                        sp.GetRequiredService<ILogger<OpenAiCompatibleAsrProvider>>()));
                    break;
            }
        }

        return services;
    }

    /// <summary>
    /// Refuses to start without a connection string, and says where to put one.
    /// <para>
    /// The alternative is a driver exception several seconds later that reads like a
    /// network fault, which is how a placeholder ends up being "fixed" by pasting a real
    /// credential into appsettings.json - the mistake this guard exists to prevent. The
    /// message deliberately names both supported sources and never echoes the value.
    /// </para>
    /// </summary>
    private static void RequireMongoConnectionString(IConfiguration configuration)
    {
        var options = configuration.GetMongoOptions();

        if (!string.IsNullOrWhiteSpace(options.ConnectionString)) return;

        throw new InvalidOperationException(
            "MongoDB is not configured. The connection string is a secret and must never be " +
            "committed to appsettings.json. Supply it with either:\n" +
            "  dotnet user-secrets set \"Mongo:ConnectionString\" \"mongodb://localhost:27017\"\n" +
            "  (run from backend/AnimStudio.Api)\n" +
            "or the environment variable Mongo__ConnectionString.\n" +
            "See SECURITY.md.");
    }
}
