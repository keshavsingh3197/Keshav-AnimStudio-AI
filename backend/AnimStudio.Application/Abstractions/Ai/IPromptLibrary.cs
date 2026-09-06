using AnimStudio.Domain.Ai;

namespace AnimStudio.Application.Abstractions.Ai;

/// <summary>A template with its variables filled in, ready to become an <see cref="AiTextRequest"/>.</summary>
public sealed record RenderedPrompt(
    string TemplateKey,
    int Version,
    string? SystemPrompt,
    string Body,
    string? OutputJsonSchema);

/// <summary>
/// Resolves prompt templates and renders them.
/// <para>
/// Rendering is strict in both directions: a slot in the body that was not declared is a
/// template error, and a variable that was not supplied is a caller error. Neither is
/// silently substituted with an empty string, because a prompt that quietly lost its
/// transcript still returns confident nonsense.
/// </para>
/// </summary>
public interface IPromptLibrary
{
    Task<RenderedPrompt> RenderAsync(
        string templateKey, IReadOnlyDictionary<string, string?> variables, CancellationToken ct);

    /// <summary>Every template, built-in or overridden, for the admin console.</summary>
    Task<IReadOnlyList<PromptTemplate>> ListAsync(CancellationToken ct);

    Task<PromptTemplate?> FindAsync(string templateKey, CancellationToken ct);
}

public sealed class PromptTemplateException(string code, string message) : Exception(message)
{
    public string Code { get; } = code;
}
