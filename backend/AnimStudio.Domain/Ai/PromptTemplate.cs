namespace AnimStudio.Domain.Ai;

/// <summary>
/// A versioned prompt with a declared variable list and a declared output schema.
/// <para>
/// Variables are declared rather than discovered so that user text cannot reach a slot
/// the template author did not intend: rendering fails on an undeclared variable instead
/// of quietly substituting one. The schema is stored with the template because a prompt
/// and the shape it promises to return are one artefact - changing either without the
/// other is what turns a model response into a parsing bug.
/// </para>
/// </summary>
public sealed class PromptTemplate
{
    public string Id { get; set; } = string.Empty;

    /// <summary>Stable key across versions, e.g. <c>character-extraction</c>.</summary>
    public string TemplateKey { get; set; } = string.Empty;
    public int Version { get; set; } = 1;

    public AiCapability Capability { get; set; } = AiCapability.Text;

    public string? SystemPrompt { get; set; }

    /// <summary>Body with <c>{{variable}}</c> slots.</summary>
    public string Body { get; set; } = string.Empty;

    /// <summary>Every slot the body is allowed to use.</summary>
    public List<string> Variables { get; set; } = [];

    /// <summary>
    /// The subset of <see cref="Variables"/> substituted verbatim - counts, enum values,
    /// language codes. Everything else is fenced as data, because a transcript pasted into
    /// a prompt is untrusted text that would otherwise be read as instructions. A literal
    /// value is held to a strict character allowlist so this list cannot become a hole.
    /// </summary>
    public List<string> LiteralVariables { get; set; } = [];

    /// <summary>JSON Schema the response must satisfy. Null for free-text templates.</summary>
    public string? OutputJsonSchema { get; set; }

    public bool Enabled { get; set; } = true;
    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
