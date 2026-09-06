namespace AnimStudio.Application.Abstractions.Ai;

public enum AiOutcomeKind
{
    /// <summary>The call produced a result, from a provider or from the cache.</summary>
    Success = 0,

    /// <summary>Nothing was configured, enabled or within quota. The caller degrades.</summary>
    Unavailable = 1,

    /// <summary>Something was tried and every candidate failed.</summary>
    Failed = 2
}

/// <summary>
/// The result of asking for AI help, which is allowed to be "no".
/// <para>
/// A result type rather than an exception because "unavailable" is the normal state of
/// this application, not an error: the blueprint requires every feature to work with no AI
/// configured. An exception would push callers towards catch blocks that swallow real
/// failures too, and would make the non-AI path the exceptional one when it is the default.
/// </para>
/// </summary>
public sealed record AiOutcome<T> where T : class
{
    private AiOutcome(AiOutcomeKind kind, T? value, AiUnavailableReason reason,
        string? errorCode, string? message)
    {
        Kind = kind;
        Value = value;
        Reason = reason;
        ErrorCode = errorCode;
        Message = message;
    }

    public AiOutcomeKind Kind { get; }
    public T? Value { get; }
    public AiUnavailableReason Reason { get; }
    public string? ErrorCode { get; }

    /// <summary>Safe to show a user: never carries a provider response body or a key.</summary>
    public string? Message { get; }

    public bool IsSuccess => Kind == AiOutcomeKind.Success && Value is not null;

    public static AiOutcome<T> Success(T value) =>
        new(AiOutcomeKind.Success, value, AiUnavailableReason.None, null, null);

    public static AiOutcome<T> Unavailable(AiUnavailableReason reason, string? message = null) =>
        new(AiOutcomeKind.Unavailable, null, reason, null, message);

    public static AiOutcome<T> Failed(string errorCode, string? message = null) =>
        new(AiOutcomeKind.Failed, null, AiUnavailableReason.None, errorCode, message);
}

/// <summary>
/// The one way the rest of the application asks for AI work.
/// <para>
/// Everything a caller would otherwise have to remember lives here: walk the provider
/// chain, serve from cache, respect the quota, record the usage, report the outcome to the
/// circuit breaker, and fall through to the next provider on failure. A caller writes one
/// line and gets graceful degradation for free, which is the only way a rule like "AI is
/// always optional" survives contact with a dozen call sites.
/// </para>
/// </summary>
public interface IAiExecutor
{
    Task<AiOutcome<AiTextResult>> TextAsync(
        AiTextRequest request, AiCallContext context, CancellationToken ct);

    Task<AiOutcome<AiImageResult>> ImageAsync(
        AiImageRequest request, AiCallContext context, CancellationToken ct);

    Task<AiOutcome<AiSpeechResult>> SpeechAsync(
        AiSpeechRequest request, AiCallContext context, CancellationToken ct);

    Task<AiOutcome<AiTranscriptionResult>> TranscribeAsync(
        AiTranscriptionRequest request, AiCallContext context, CancellationToken ct);
}
