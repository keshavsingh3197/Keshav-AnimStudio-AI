using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Rendering;
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
    ILogger<RenderJobWorker> logger) : BackgroundService
{
    private readonly RenderOptions _options = options.Value;

    /// <summary>Identifies this process in a job's lease.</summary>
    private readonly string _instanceId = $"{Environment.MachineName}:{Environment.ProcessId}";

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
            return true;
        }

        logger.LogInformation("Claimed job {JobId} (attempt {Attempt}).", job.Id, job.Attempts);

        var orchestrator = scope.ServiceProvider.GetRequiredService<ProjectRenderOrchestrator>();

        var settings = new RenderSettings(
            _options.KenBurnsSupersample,
            _options.MouthFlapHz,
            _options.SubtitleFontName,
            _options.SubtitleFontSize,
            lease);

        await orchestrator.ExecuteAsync(job, _instanceId, settings, ct).ConfigureAwait(false);
        return true;
    }
}
