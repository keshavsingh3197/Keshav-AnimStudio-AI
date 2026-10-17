using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Abstractions.Rendering;
using AnimStudio.Application.Clips;
using AnimStudio.Application.Projects;
using AnimStudio.Application.Rendering;
using AnimStudio.Application.Rendering.Models;
using AnimStudio.Domain.Jobs;
using AnimStudio.Infrastructure.Ffmpeg;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AnimStudio.Infrastructure.Jobs;

/// <summary>
/// Polls the database for render work and runs up to <see cref="RenderOptions.MaxConcurrentJobs"/>
/// jobs side by side - a batch of auto shorts renders together instead of one after another.
/// <para>
/// Each job is claimed atomically by the repository, so two slots (or two servers) never
/// take the same one, and each run holds its lease under its own owner name, so one slot
/// renewing its lease can never renew or steal another's.
/// </para>
/// <para>
/// Uses <see cref="IServiceScopeFactory"/> to create a fresh scope per job rather than
/// capturing scoped services: a background service outlives any request scope, so holding
/// a scoped repository would mean using a disposed object.
/// </para>
/// </summary>
public sealed class RenderJobWorker(
    IServiceScopeFactory scopeFactory,
    IOptions<RenderOptions> options,
    WatermarkFontResolver fonts,
    IRenderCapabilities renderCapabilities,
    ILogger<RenderJobWorker> logger) : BackgroundService
{
    /// <summary>Read on every use: the options are live, so an admin's change applies to the next job.</summary>
    private RenderOptions Options => options.Value;

    /// <summary>The ceiling the admin setting is held to, whatever the configuration says.</summary>
    internal const int MaxSlots = 8;

    /// <summary>Identifies this process; each run's lease owner adds its own number.</summary>
    private readonly string _instanceId = $"{Environment.MachineName}:{Environment.ProcessId}";

    private long _runs;

    /// <summary>
    /// GPU encoder name detected at startup, or null for CPU. Passed into every clip
    /// conformance job so the orchestrator knows which fast path to take.
    /// </summary>
    private readonly string? _hwEncoder = (renderCapabilities as FfmpegCapabilities)?.BestHardwareEncoder;



    private static readonly TimeSpan IdleDelay = TimeSpan.FromSeconds(3);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("Render worker {InstanceId} started.", _instanceId);

        // Give the host a moment to finish starting before touching the database.
        try
        {
            await Task.Delay(TimeSpan.FromSeconds(2), stoppingToken).ConfigureAwait(false);
        }
        catch (OperationCanceledException)
        {
            return;
        }

        var running = new List<Task>();
        while (!stoppingToken.IsCancellationRequested)
        {
            running.RemoveAll(t => t.IsCompleted);
            var slots = Math.Clamp(Options.MaxConcurrentJobs, 1, MaxSlots);

            if (running.Count < slots)
            {
                RenderJob? job = null;
                var leaseOwner = $"{_instanceId}#{Interlocked.Increment(ref _runs)}";
                try
                {
                    job = await ClaimAsync(leaseOwner, stoppingToken).ConfigureAwait(false);
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    break;
                }
                catch (Exception ex)
                {
                    // The loop must survive a database hiccup.
                    logger.LogError(ex, "Render worker could not claim a job.");
                }

                if (job is not null)
                {
                    // Not awaited: the loop goes straight back to fill the next free slot.
                    running.Add(Task.Run(() => RunGuardedAsync(job, leaseOwner, stoppingToken), CancellationToken.None));
                    continue;
                }
            }

            try
            {
                // Idle, or every slot busy: wake on the poll interval, or sooner when a job ends.
                var tick = Task.Delay(IdleDelay, stoppingToken);
                await (running.Count >= slots ? Task.WhenAny([.. running, tick]) : tick).ConfigureAwait(false);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }

        // Jobs see the same token and stop at their next check; their leases then expire
        // and another worker picks them up.
        try
        {
            await Task.WhenAll(running).ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is OperationCanceledException || stoppingToken.IsCancellationRequested)
        {
            // Shutting down.
        }

        logger.LogInformation("Render worker {InstanceId} stopped.", _instanceId);
    }

    private async Task<RenderJob?> ClaimAsync(string leaseOwner, CancellationToken ct)
    {
        using var scope = scopeFactory.CreateScope();
        var jobs = scope.ServiceProvider.GetRequiredService<IRenderJobRepository>();
        return await jobs
            .ClaimNextAsync(leaseOwner, TimeSpan.FromSeconds(Options.LeaseSeconds), Options.MaxAttempts, ct)
            .ConfigureAwait(false);
    }

    private async Task RunGuardedAsync(RenderJob job, string leaseOwner, CancellationToken ct)
    {
        try
        {
            await RunAsync(job, leaseOwner, ct).ConfigureAwait(false);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            // Shutting down; the lease lapses and the job is picked up again.
        }
        catch (Exception ex)
        {
            // One job's failure must never take the worker down with it.
            logger.LogError(ex, "Render job {JobId} failed outside its orchestrator.", job.Id);
        }
    }

    private async Task RunAsync(RenderJob job, string leaseOwner, CancellationToken ct)
    {
        using var scope = scopeFactory.CreateScope();
        var jobs = scope.ServiceProvider.GetRequiredService<IRenderJobRepository>();
        var lease = TimeSpan.FromSeconds(Options.LeaseSeconds);

        // Attempts is incremented by the claim, so exceeding the cap means this job has
        // already taken down a worker MaxAttempts times. Fail it rather than loop forever.
        if (job.Attempts > Options.MaxAttempts)
        {
            job.Status = RenderJobStatus.Failed;
            job.ErrorCode = Domain.Errors.RenderErrorCode.TooManyAttempts.ToString();
            job.ErrorMessage = "Rendering failed repeatedly and was abandoned.";
            await jobs.CompleteAsync(job, ct).ConfigureAwait(false);

            await scope.ServiceProvider.GetRequiredService<ProjectStatusService>()
                .MarkRenderFinishedAsync(job.ProjectId, false, ct).ConfigureAwait(false);

            return;
        }

        logger.LogInformation("Claimed {Kind} job {JobId} (attempt {Attempt}).",
            job.Kind, job.Id, job.Attempts);

        // One queue, two kinds of work. Dispatching here rather than inside a single
        // orchestrator keeps a clip stitch from carrying the scene pipeline's dependencies
        // (characters, subtitles, sprite geometry) that it has no use for.
        if (job.Kind == RenderJobKind.ClipMerge)
        {
            var clips = scope.ServiceProvider.GetRequiredService<ClipMergeOrchestrator>();

            // The resolver hands over a path that exists, or null. It is deliberately not
            // Options.WatermarkFontFile: that setting is empty by default, and the
            // family-name route that used to cover for it kills ffmpeg on any build whose
            // fontconfig has no configuration file.
            var clipSettings = new ClipRenderSettings(
                fonts.FontFilePath, DeliveryProfile(), Options.IntermediatePreset, lease,
                HardwareEncoder: Options.UseHardwareEncoder ? _hwEncoder : null,
                FontForText: fonts.FontFor,
                FontRunsForText: fonts.RunsFor,
                KenBurnsSupersample: Options.KenBurnsSupersample,
                ParallelJobs: Math.Clamp(Options.MaxConcurrentJobs, 1, MaxSlots));

            await clips.ExecuteAsync(job, leaseOwner, clipSettings, ct).ConfigureAwait(false);
        }
        else
        {
            var orchestrator = scope.ServiceProvider.GetRequiredService<ProjectRenderOrchestrator>();

            var settings = new RenderSettings(
                Options.KenBurnsSupersample,
                Options.MouthFlapHz,
                Options.SubtitleFontName,
                Options.SubtitleFontSize,
                lease,
                DeliveryProfile(),
                Options.IntermediatePreset);

            await orchestrator.ExecuteAsync(job, leaseOwner, settings, ct).ConfigureAwait(false);
        }

        // One place to move the project out of Rendering, whichever way the job ended.
        // Skipped when the lease was lost, because another worker still owns this job.
        if (job.IsTerminal)
        {
            var status = scope.ServiceProvider.GetRequiredService<ProjectStatusService>();
            await status
                .MarkRenderFinishedAsync(job.ProjectId, job.OutputStorageKey is not null, ct)
                .ConfigureAwait(false);
        }
    }

    /// <summary>
    /// How the DELIVERED video is encoded, from configuration.
    /// <para>
    /// This exists because <c>Render:Preset</c> and <c>Render:Crf</c> were documented,
    /// bound and then never read: every encode used <see cref="EncoderProfile.Default"/>,
    /// so an operator who turned the preset down to make renders faster got no change at
    /// all and no way to tell.
    /// </para>
    /// </summary>
    private EncoderProfile DeliveryProfile() => DeliveryProfile(Options, logger);

    /// <summary>The same, for anything else that encodes a deliverable - the outro preview.</summary>
    internal static EncoderProfile DeliveryProfile(RenderOptions options, ILogger logger)
    {
        var profile = EncoderProfile.Default;

        if (!string.IsNullOrWhiteSpace(options.Preset))
            profile = profile with { Preset = options.Preset.Trim() };

        // x264's CRF range. Out-of-range values are a configuration typo, and clamping
        // beats letting ffmpeg reject the argument on every clip of every job.
        if (options.Crf is >= 0 and <= 51)
            profile = profile with { Crf = options.Crf };
        else
            logger.LogWarning("Render:Crf is {Crf}, outside 0-51; using {Default}.",
                options.Crf, profile.Crf);

        return profile;
    }
}
