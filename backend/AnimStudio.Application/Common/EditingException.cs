namespace AnimStudio.Application.Common;

/// <summary>
/// An edit the server understood but refuses to apply.
/// <para>
/// Separate from an argument exception so the API can answer with a stable
/// <see cref="Code"/> and a message that was written for a user to read, rather than
/// falling through to the generic 500 the global handler gives anything it does
/// not recognize.
/// </para>
/// </summary>
public sealed class EditingException : Exception
{
    private EditingException(string code, string message, bool isConflict) : base(message)
    {
        Code = code;
        IsConflict = isConflict;
    }

    public string Code { get; }

    /// <summary>True when the edit clashes with existing state rather than being malformed.</summary>
    public bool IsConflict { get; }

    /// <summary>The request itself is not valid - 400.</summary>
    public static EditingException Invalid(string code, string message) => new(code, message, false);

    /// <summary>The request is well formed but the current state forbids it - 409.</summary>
    public static EditingException Conflict(string code, string message) => new(code, message, true);
}
