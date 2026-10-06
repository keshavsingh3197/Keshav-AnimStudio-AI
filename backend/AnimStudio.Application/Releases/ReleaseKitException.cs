namespace AnimStudio.Application.Releases;

/// <summary>
/// A release kit that could not be built because of the input, not the server - silent
/// audio, an unreadable cover. The message is safe to show; tool output stays in the log.
/// </summary>
public sealed class ReleaseKitException(string code, string message) : Exception(message)
{
    public string Code { get; } = code;
}
