using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Ai;
using AnimStudio.Domain.Ai;
using AnimStudio.Domain.Stories;
using Microsoft.Extensions.Logging;

namespace AnimStudio.Application.StoryAgent;

/// <summary>
/// Finds speakers' mouth anchors in a story's pictures with the Gemini key the voices already use: one request per
/// picture with someone speaking, made only once for that picture. The renderer keeps these baked-in faces still.
/// </summary>
/// <remarks>Never fails a build: a picture whose faces cannot be found is shown still, as it was before.</remarks>
public sealed class StoryFaceLocator(
    IAiProviderRegistry registry,
    ILogger<StoryFaceLocator> logger,
    IAiUsageRepository? usage = null,
    TimeProvider? clock = null)
{
    /// <summary>The model asked; the free tier allows thousands of these a day.</summary>
    public const string Model = "gemini-3.8-flash";

    /// <summary>True when an engine that can look at a picture is set up.</summary>
    public bool IsAvailable => Reader() is not null;

    /// <summary>
    /// The faces of <paramref name="speakers"/> in the picture; empty when none can be seen, null when the request
    /// failed (so the next build asks again).
    /// </summary>
    public async Task<List<StoryFace>?> LocateAsync(
        StoryRun run, int sceneNumber, byte[] image, string mimeType, IReadOnlyList<StoryCastMember> speakers, CancellationToken ct)
    {
        if (speakers.Count == 0) return [];
        if (Reader() is not { } reader) return null;

        string answer;
        try
        {
            answer = await reader.ReadImageAsync(image, mimeType, StoryFaces.Prompt(speakers), Model, ct).ConfigureAwait(false);
            await RecordAsync(run, reader, AiCallOutcome.Succeeded, null, ct).ConfigureAwait(false);
        }
        catch (AiProviderException ex)
        {
            await RecordAsync(run, reader, AiCallOutcome.Failed, ex.Code, ct).ConfigureAwait(false);
            logger.LogWarning("Story run {RunId}: the faces in scene {Scene}'s picture could not be found: {Code}", run.Id, sceneNumber, ex.Code);
            return null;
        }

        var faces = StoryFaces.Parse(answer, speakers);
        if (faces is null)
            logger.LogWarning("Story run {RunId}: the answer about scene {Scene}'s faces could not be read.", run.Id, sceneNumber);
        return faces;
    }

    private IImageReadingProvider? Reader() =>
        registry.SpeechChain().OfType<IImageReadingProvider>().FirstOrDefault(p => p.IsConfigured);

    /// <summary>Kept with the other AI calls so the day's requests are counted. Never fails the build.</summary>
    private async Task RecordAsync(StoryRun run, IImageReadingProvider reader, AiCallOutcome outcome, string? code, CancellationToken ct)
    {
        if (usage is null) return;
        try
        {
            var now = (clock ?? TimeProvider.System).GetUtcNow().UtcDateTime;
            await usage.RecordAsync(new AiUsageRecord
            {
                ProviderId = reader.Id.Value,
                Capability = AiCapability.Speech,
                Model = Model,
                UserId = run.UserId,
                DayBucket = AiUsageRecord.BucketFor(now),
                Units = 1,
                Outcome = outcome,
                ErrorCode = code,
                CreatedAt = now
            }, ct).ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning("Story run {RunId}: the face request could not be recorded: {ErrorType}", run.Id, ex.GetType().Name);
        }
    }
}
