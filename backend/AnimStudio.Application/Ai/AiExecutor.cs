using System.Diagnostics;
using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Options;
using AnimStudio.Domain.Ai;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AnimStudio.Application.Ai;

/// <summary>
/// Runs one AI request against the configured provider chain, applying cache, quota,
/// usage accounting and the circuit breaker in that order.
/// </summary>
/// <remarks>
/// The ordering is deliberate. The cache is consulted first because a hit costs nothing
/// and must not be blocked by an exhausted quota - refusing to hand back a result already
/// paid for would be perverse. Quota is checked next so an exhausted provider is skipped
/// before the network is touched. Only then is the provider called, and a failure moves to
/// the next candidate rather than ending the request.
/// </remarks>
public sealed class AiExecutor(
    IAiProviderRegistry registry,
    IAiResultCache cache,
    IAiQuotaGuard quota,
    IAiUsageRepository usage,
    IOptionsMonitor<AiOptions> options,
    TimeProvider clock,
    ILogger<AiExecutor> logger) : IAiExecutor
{
    public Task<AiOutcome<AiTextResult>> TextAsync(
        AiTextRequest request, AiCallContext context, CancellationToken ct) =>
        ExecuteAsync(
            AiCapability.Text,
            registry.TextChain(),
            FingerprintOf(request),
            request.BypassCache,
            request.Seed,
            request.PromptTemplateKey,
            request.PromptTemplateVersion,
            (provider, token) => provider.CompleteAsync(request, token),
            result => new AiCacheEntry(
                Encoding.UTF8.GetBytes(result.Text), "text/plain; charset=utf-8",
                result.Provenance.ProviderId, result.Provenance.Model, default),
            (entry, provenance) => new AiTextResult(
                Encoding.UTF8.GetString(entry.Content), provenance),
            (result, provenance) => result with { Provenance = provenance },
            context, ct);

    public Task<AiOutcome<AiImageResult>> ImageAsync(
        AiImageRequest request, AiCallContext context, CancellationToken ct) =>
        ExecuteAsync(
            AiCapability.Image,
            registry.ImageChain(),
            FingerprintOf(request),
            request.BypassCache,
            request.Seed,
            request.PromptTemplateKey,
            request.PromptTemplateVersion,
            (provider, token) => provider.GenerateAsync(request, token),
            result => new AiCacheEntry(
                result.Content, result.MimeType,
                result.Provenance.ProviderId, result.Provenance.Model, default),
            (entry, provenance) => new AiImageResult(entry.Content, entry.ContentType, provenance),
            (result, provenance) => result with { Provenance = provenance },
            context, ct);

    public Task<AiOutcome<AiSpeechResult>> SpeechAsync(
        AiSpeechRequest request, AiCallContext context, CancellationToken ct) =>
        ExecuteAsync(
            AiCapability.Speech,
            request.ProviderId is null
                ? registry.SpeechChain()
                : [.. registry.SpeechChain().Where(p =>
                    string.Equals(p.Id.Value, request.ProviderId, StringComparison.OrdinalIgnoreCase))],
            FingerprintOf(request),
            request.BypassCache,
            null,
            null,
            0,
            (provider, token) => provider.SynthesizeAsync(request, token),
            result => new AiCacheEntry(
                result.Content, result.MimeType,
                result.Provenance.ProviderId, result.Provenance.Model, default,
                DurationSeconds: result.DurationSeconds),
            (entry, provenance) => new AiSpeechResult(
                entry.Content, entry.ContentType, entry.DurationSeconds, provenance),
            (result, provenance) => result with { Provenance = provenance },
            context, ct, request.Model);

    public Task<AiOutcome<AiTranscriptionResult>> TranscribeAsync(
        AiTranscriptionRequest request, AiCallContext context, CancellationToken ct) =>
        ExecuteAsync(
            AiCapability.Transcription,
            registry.TranscriptionChain(),
            FingerprintOf(request),
            bypassCache: false,
            null,
            null,
            0,
            (provider, token) => provider.TranscribeAsync(request, token),
            result => new AiCacheEntry(
                Encoding.UTF8.GetBytes(result.SubtitleText), "text/plain; charset=utf-8",
                result.Provenance.ProviderId, result.Provenance.Model, default,
                Format: result.Format, Language: result.Language),
            (entry, provenance) => new AiTranscriptionResult(
                Encoding.UTF8.GetString(entry.Content), entry.Format ?? "srt", provenance,
                entry.Language),
            (result, provenance) => result with { Provenance = provenance },
            context, ct);

    private async Task<AiOutcome<TResult>> ExecuteAsync<TProvider, TResult>(
        AiCapability capability,
        IReadOnlyList<TProvider> chain,
        string? fingerprint,
        bool bypassCache,
        long? seed,
        string? templateKey,
        int templateVersion,
        Func<TProvider, CancellationToken, Task<TResult>> invoke,
        Func<TResult, AiCacheEntry> toCacheEntry,
        Func<AiCacheEntry, AiProvenance, TResult> fromCacheEntry,
        Func<TResult, AiProvenance, TResult> withProvenance,
        AiCallContext context,
        CancellationToken ct,
        string? modelOverride = null)
        where TProvider : class, IAiProvider
        where TResult : class
    {
        if (chain.Count == 0)
        {
            var status = registry.Describe(capability);
            return AiOutcome<TResult>.Unavailable(
                status.Reason == AiUnavailableReason.None
                    ? AiUnavailableReason.NotConfigured
                    : status.Reason,
                $"No {capability} provider is available.");
        }

        var configuration = options.CurrentValue;
        var refusedByQuota = false;
        string? lastErrorCode = null;

        foreach (var provider in chain)
        {
            ct.ThrowIfCancellationRequested();

            // A per-request model is part of the cache key and the usage record, so a Pro take
            // is never served for a Flash request, nor billed under the wrong name.
            var model = modelOverride ?? configuration.ProviderFor(provider.Id)?.Model;
            var key = fingerprint is null
                ? default
                : AiCacheKey.Create(provider.Id, capability, model, fingerprint);

            // 1. Cache. A hit is free and must not be gated on quota.
            if (!bypassCache && !key.IsEmpty)
            {
                var cached = await cache.TryGetAsync(key, ct).ConfigureAwait(false);
                if (cached is not null)
                {
                    await RecordAsync(provider, capability, model, AiCallOutcome.CacheHit,
                        context, 0, null, ct).ConfigureAwait(false);

                    var provenance = BuildProvenance(
                        provider, capability, cached.Model ?? model, fingerprint, seed,
                        templateKey, templateVersion, fromCache: true);

                    return AiOutcome<TResult>.Success(fromCacheEntry(cached, provenance));
                }
            }

            // 2. Quota, before the network rather than after it.
            var verdict = await quota.CheckAsync(provider.Id, ct).ConfigureAwait(false);
            if (!verdict.Allowed)
            {
                refusedByQuota = true;

                await RecordAsync(provider, capability, model, AiCallOutcome.RefusedByQuota,
                    context, 0, "quota-exhausted", ct).ConfigureAwait(false);

                logger.LogInformation(
                    "AI provider {ProviderId} is out of quota for {Capability}; trying the next one.",
                    provider.Id.Value, capability);

                continue;
            }

            // 3. The call itself.
            var stopwatch = Stopwatch.StartNew();
            try
            {
                var result = await invoke(provider, ct).ConfigureAwait(false);
                stopwatch.Stop();

                registry.ReportOutcome(provider.Id, success: true);

                await RecordAsync(provider, capability, model, AiCallOutcome.Succeeded,
                    context, (int)stopwatch.ElapsedMilliseconds, null, ct).ConfigureAwait(false);

                var provenance = BuildProvenance(
                    provider, capability, model, fingerprint, seed,
                    templateKey, templateVersion, fromCache: false);

                var stamped = withProvenance(result, provenance);

                if (!key.IsEmpty)
                {
                    var entry = toCacheEntry(stamped) with
                    {
                        ProviderId = provider.Id.Value,
                        Model = model
                    };

                    await cache.SaveAsync(key, entry, ct).ConfigureAwait(false);
                }

                return AiOutcome<TResult>.Success(stamped);
            }
            catch (OperationCanceledException) when (ct.IsCancellationRequested)
            {
                // The caller gave up. Not a provider fault, so it must not open the circuit.
                throw;
            }
            catch (Exception ex)
            {
                stopwatch.Stop();
                lastErrorCode = ex is AiProviderException typed ? typed.Code : "provider-failed";

                registry.ReportOutcome(provider.Id, success: false);

                await RecordAsync(provider, capability, model, AiCallOutcome.Failed,
                    context, (int)stopwatch.ElapsedMilliseconds, lastErrorCode, ct)
                    .ConfigureAwait(false);

                // Provider id and error code only: an exception message can carry a
                // response body, and a response body can carry the user's transcript.
                logger.LogWarning(
                    "AI provider {ProviderId} failed a {Capability} call with {ErrorCode}; " +
                    "falling through to the next provider.",
                    provider.Id.Value, capability, lastErrorCode);
            }
        }

        // Everything was tried. "Out of quota" is a different answer from "it broke", and
        // the caller may well want to say so.
        return refusedByQuota && lastErrorCode is null
            ? AiOutcome<TResult>.Unavailable(
                AiUnavailableReason.QuotaExhausted,
                $"Every {capability} provider is out of quota.")
            : AiOutcome<TResult>.Failed(
                lastErrorCode ?? "no-provider-succeeded",
                $"No {capability} provider could complete the request.");
    }

    private async Task RecordAsync(
        IAiProvider provider, AiCapability capability, string? model, AiCallOutcome outcome,
        AiCallContext context, int durationMs, string? errorCode, CancellationToken ct)
    {
        var now = clock.GetUtcNow().UtcDateTime;

        try
        {
            await usage.RecordAsync(new AiUsageRecord
            {
                ProviderId = provider.Id.Value,
                Capability = capability,
                Model = model,
                ProjectId = context.ProjectId,
                UserId = context.UserId,
                DayBucket = AiUsageRecord.BucketFor(now),
                Units = 0,
                RequestCount = 1,
                Outcome = outcome,
                ErrorCode = errorCode,
                DurationMs = durationMs,
                CreatedAt = now
            }, ct).ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            // Accounting is not the job. Losing a usage row must not lose the render.
            logger.LogWarning(ex, "Could not record AI usage for {ProviderId}.", provider.Id.Value);
        }
    }

    private AiProvenance BuildProvenance(
        IAiProvider provider, AiCapability capability, string? model, string? fingerprint,
        long? seed, string? templateKey, int templateVersion, bool fromCache) => new()
        {
            ProviderId = provider.Id.Value,
            Capability = capability,
            Model = model,
            PromptTemplateKey = templateKey,
            PromptTemplateVersion = templateVersion,
            PromptHash = fingerprint is null ? null : Sha256(fingerprint),
            Seed = seed,
            FromCache = fromCache,
            GeneratedAtUtc = clock.GetUtcNow().UtcDateTime
        };

    // --- fingerprints -------------------------------------------------------------
    // Everything that changes the result goes in, and nothing that does not. A field
    // missing from one of these is a cache that returns the wrong answer, so each list is
    // deliberately exhaustive over its request type.

    private static string FingerprintOf(AiTextRequest r) => Join(
        r.SystemPrompt, r.Prompt, r.JsonSchema,
        r.MaxOutputTokens.ToString(CultureInfo.InvariantCulture),
        r.Temperature.ToString("R", CultureInfo.InvariantCulture),
        r.Seed?.ToString(CultureInfo.InvariantCulture),
        r.PromptTemplateKey, r.PromptTemplateVersion.ToString(CultureInfo.InvariantCulture));

    private static string FingerprintOf(AiImageRequest r) => Join(
        r.Prompt, r.NegativePrompt,
        r.Width.ToString(CultureInfo.InvariantCulture),
        r.Height.ToString(CultureInfo.InvariantCulture),
        r.Seed?.ToString(CultureInfo.InvariantCulture),
        r.TransparentBackground ? "alpha" : "opaque",
        r.PromptTemplateKey, r.PromptTemplateVersion.ToString(CultureInfo.InvariantCulture));

    private static string FingerprintOf(AiSpeechRequest r) => Join(
        r.Text, r.VoiceId,
        r.Rate.ToString("R", CultureInfo.InvariantCulture),
        r.Pitch.ToString("R", CultureInfo.InvariantCulture),
        r.LanguageCode);

    /// <summary>Null when the caller supplied no audio digest - see the request's comment.</summary>
    private static string? FingerprintOf(AiTranscriptionRequest r) =>
        r.CacheFingerprint is null
            ? null
            : Join(r.CacheFingerprint, r.LanguageHint, r.RequestWordTimings ? "words" : "cues");

    private static string Join(params string?[] parts) =>
        string.Join('\n', parts.Select(p => p ?? string.Empty));

    private static string Sha256(string value) =>
        Convert.ToHexStringLower(SHA256.HashData(Encoding.UTF8.GetBytes(value)));
}

/// <summary>
/// Thrown by a provider when it can name what went wrong. The code travels into the usage
/// record and the outcome; the message must never contain a response body or a key.
/// </summary>
public sealed class AiProviderException(string code, string message, Exception? inner = null)
    : Exception(message, inner)
{
    public string Code { get; } = code;
}
