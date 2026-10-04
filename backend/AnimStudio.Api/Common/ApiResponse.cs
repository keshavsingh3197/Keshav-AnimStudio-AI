namespace AnimStudio.Api.Common;

public sealed record ApiError(string Code, string Message, string? Field = null, string? Hint = null, string? Detail = null);

/// <summary>
/// The single response envelope every endpoint returns, so clients have one shape to
/// handle for both success and failure.
/// </summary>
public sealed record ApiResponse<T>
{
    public bool Success { get; init; }
    public T? Data { get; init; }
    public string? Message { get; init; }
    public IReadOnlyList<ApiError> Errors { get; init; } = [];

    public static ApiResponse<T> Ok(T data) => new() { Success = true, Data = data };

    public static ApiResponse<T> Fail(string message, params ApiError[] errors) =>
        new() { Success = false, Message = message, Errors = errors };
}

/// <summary>Envelope for endpoints with nothing to return.</summary>
public sealed record EmptyPayload
{
    public static readonly EmptyPayload Value = new();
}
