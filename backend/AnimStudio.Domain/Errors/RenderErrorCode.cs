namespace AnimStudio.Domain.Errors;

/// <summary>
/// Machine-readable render failure reasons. The code is what the API returns and what
/// the UI switches on; the human-readable detail stays in the job log artifact so no
/// internal path or stderr dump reaches an end user.
/// </summary>
public enum RenderErrorCode
{
    None = 0,
    RendererUnavailable = 1,
    RendererTooOld = 2,
    LibassMissing = 3,
    AssetMissing = 4,
    AssetNotUsable = 5,
    SpriteNotTransparent = 6,
    NoScenes = 7,
    InvalidSceneDuration = 8,
    TransitionTooLong = 9,
    FfmpegError = 10,
    Timeout = 11,
    DiskFull = 12,
    FrameCountMismatch = 13,
    TooManyAttempts = 14,
    LeaseLost = 15,
    LicenseGateFailed = 16,
    WorkspaceError = 17
}

public sealed class RenderException : Exception
{
    public RenderErrorCode Code { get; }

    /// <summary>Safe to show a user: no paths, no stderr, no stack detail.</summary>
    public string UserMessage { get; }

    public RenderException(RenderErrorCode code, string userMessage, string? technicalDetail = null,
        Exception? inner = null)
        : base(technicalDetail ?? userMessage, inner)
    {
        Code = code;
        UserMessage = userMessage;
    }
}
