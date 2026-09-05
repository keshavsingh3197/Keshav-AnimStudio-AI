using AnimStudio.Api.Common;
using AnimStudio.Api.Contracts;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Security;
using Microsoft.AspNetCore.Mvc;

namespace AnimStudio.Api.Controllers;

/// <summary>
/// Read access to what an import produced.
/// <para>
/// Scenes are generated from a script, and until now the only way to reach one was the id
/// returned by the import that made it - so a script could never be reviewed, compared or
/// regenerated from afterwards. These are the endpoints that make an import inspectable.
/// </para>
/// </summary>
[ApiController]
public sealed class ScriptsController(
    IScriptRepository scripts,
    IIngestRepository ingests,
    IProjectRepository projects,
    ICurrentUser currentUser) : ControllerBase
{
    /// <summary>Enough to review a long import without shipping a whole transcript.</summary>
    private const int MaxSegmentsInDetail = 500;

    [HttpGet("api/projects/{projectId}/scripts")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ScriptSummaryResponse>>>> List(
        string projectId, CancellationToken ct)
    {
        await EnsureOwnedAsync(projectId, ct);

        var list = await scripts.ListByProjectAsync(projectId, ct);
        return Ok(ApiResponse<IReadOnlyList<ScriptSummaryResponse>>.Ok(
            [.. list.Select(s => s.ToSummary())]));
    }

    [HttpGet("api/scripts/{id}")]
    public async Task<ActionResult<ApiResponse<ScriptDetailResponse>>> Get(
        string id, CancellationToken ct)
    {
        var script = await scripts.GetAsync(id, ct) ?? throw new KeyNotFoundException();
        await EnsureOwnedAsync(script.ProjectId, ct);

        return Ok(ApiResponse<ScriptDetailResponse>.Ok(script.ToDetail(MaxSegmentsInDetail)));
    }

    /// <summary>
    /// This project's import history, including the failed ones - a failure with its error
    /// code is the only record of an import that produced nothing.
    /// </summary>
    [HttpGet("api/projects/{projectId}/ingests")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<IngestSummaryResponse>>>> ListIngests(
        string projectId, CancellationToken ct)
    {
        await EnsureOwnedAsync(projectId, ct);

        var list = await ingests.ListByProjectAsync(projectId, ct);
        return Ok(ApiResponse<IReadOnlyList<IngestSummaryResponse>>.Ok(
            [.. list.Select(i => i.ToSummary())]));
    }

    private async Task EnsureOwnedAsync(string projectId, CancellationToken ct)
    {
        var project = await projects.GetAsync(projectId, ct) ?? throw new KeyNotFoundException();

        if (!string.Equals(project.UserId, currentUser.UserId, StringComparison.Ordinal))
            throw new UnauthorizedAccessException();
    }
}
