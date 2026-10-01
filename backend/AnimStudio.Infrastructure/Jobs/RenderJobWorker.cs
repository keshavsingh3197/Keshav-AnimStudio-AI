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
/// Polls Mongo for render work and runs it.
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
    private readonly RenderOptions _options = options.Value;

    /// <summary>Identifies this process in a job's lease.</summary>
    private readonly string _instanceId = $"{Environment.MachineName}:{Environment.ProcessId}";

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

        while (!stoppingToken.IsCancellationRequested)
        {
            var didWork = false;

            try
            {
                didWork = await TryRunOneAsync(stoppingToken).ConfigureAwait(false);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                // The loop must survive anything a single job can throw.
                logger.LogError(ex, "Render worker loop error.");
            }

            if (didWork) continue;

            try
            {
                await Task.Delay(IdleDelay, stoppingToken).ConfigureAwait(false);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }

        logger.LogInformation("Render worker {InstanceId} stopped.", _instanceId);
    }

    private async Task<bool> TryRunOneAsync(CancellationToken ct)
    {
        using var scope = scopeFactory.CreateScope();
        var jobs = scope.ServiceProvider.GetRequiredService<IRenderJobRepository>();

        var lease = TimeSpan.FromSeconds(_options.LeaseSeconds);
        var job = await jobs
            .ClaimNextAsync(_instanceId, lease, _options.MaxAttempts, ct)
            .ConfigureAwait(false);

        if (job is null) return false;

        // Attempts is incremented by the claim, so exceeding the cap means this job has
        // already taken down a worker MaxAttempts times. Fail it rather than loop forever.
        if (job.Attempts > _options.MaxAttempts)
        {
            job.Status = RenderJobStatus.Failed;
            job.ErrorCode = Domain.Errors.RenderErrorCode.TooManyAttempts.ToString();
            job.ErrorMessage = "Rendering failed repeatedly and was abandoned.";
            await jobs.CompleteAsync(job, ct).ConfigureAwait(false);

            await scope.ServiceProvider.GetRequiredService<ProjectStatusService>()
                .MarkRenderFinishedAsync(job.ProjectId, false, ct).ConfigureAwait(false);

            return true;
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
            // _options.WatermarkFontFile: that setting is empty by default, and the
            // family-name route that used to cover for it kills ffmpeg on any build whose
            // fontconfig has no configuration file.
            var clipSettings = new ClipRenderSettings(
                fonts.FontFilePath, DeliveryProfile(), _options.IntermediatePreset, lease,
                HardwareEncoder: _options.UseHardwareEncoder ? _hwEncoder : null);

            await clips.ExecuteAsync(job, _instanceId, clipSettings, ct).ConfigureAwait(false);
        }
        else
        {
            var orchestrator = scope.ServiceProvider.GetRequiredService<ProjectRenderOrchestrator>();

            var settings = new RenderSettings(
                _options.KenBurnsSupersample,
                _options.MouthFlapHz,
                _options.SubtitleFontName,
                _options.SubtitleFontSize,
                lease,
                DeliveryProfile(),
                _options.IntermediatePreset);

            await orchestrator.ExecuteAsync(job, _instanceId, settings, ct).ConfigureAwait(false);
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

        return true;
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
    private EncoderProfile DeliveryProfile()
    {
        var profile = EncoderProfile.Default;

        if (!string.IsNullOrWhiteSpace(_options.Preset))
            profile = profile with { Preset = _options.Preset.Trim() };

        // x264's CRF range. Out-of-range values are a configuration typo, and clamping
        // beats letting ffmpeg reject the argument on every clip of every job.
        if (_options.Crf is >= 0 and <= 51)
            profile = profile with { Crf = _options.Crf };
        else
            logger.LogWarning("Render:Crf is {Crf}, outside 0-51; using {Default}.",
                _options.Crf, profile.Crf);

        return profile;
    }
}
