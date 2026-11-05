using System.Text.Json;
using AnimStudio.Api.Common;
using AnimStudio.Api.Contracts;
using AnimStudio.Api.Security;
using AnimStudio.Application.Admin;
using AnimStudio.Application.Security;
using AnimStudio.Application.StoryAgent;
using AnimStudio.Domain.Stories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AnimStudio.Api.Controllers;

/// <summary>
/// The Story Agent's genres: what kinds of story it makes, and what each one bundles - the writer's style guide, the
/// topics and, for a scripture genre, where in the Granths each topic is told, plus the look, music, voice, tags and links.
/// </summary>
/// <remarks>
/// Behind <see cref="AdminAccess.Policy"/> like the rest of the console. A genre's text reaches a prompt and the
/// description of every video made in it, so each change is checked by <see cref="StoryGenreRules"/> and written to the
/// audit trail.
/// </remarks>
[ApiController]
[Authorize(Policy = AdminAccess.Policy)]
[Route("api/admin/story-genres")]
public sealed class AdminStoryGenresController(
    StoryGenreService genres,
    AdminAuditService audit,
    ICurrentUser currentUser) : ControllerBase
{
    private const long MaxGenreRequestBytes = 512 * 1024;

    [HttpGet]
    public async Task<ActionResult<ApiResponse<StoryGenresPageResponse>>> List(CancellationToken ct)
    {
        var all = await genres.ListAsync(enabledOnly: false, ct);
        var texts = GranthCatalog.Texts
            .Select(t => new GranthTextResponse(t.Id, t.English, t.Hindi, t.Kind.ToString(), t.DivisionLabel, t.UnitLabel))
            .ToList();
        return Ok(ApiResponse<StoryGenresPageResponse>.Ok(
            new StoryGenresPageResponse(all, texts, StoryGenreRules.YouTubeCategories, "Wikisource (sa.wikisource.org)")));
    }

    [HttpPost]
    [RequestSizeLimit(MaxGenreRequestBytes)]
    public Task<ActionResult<ApiResponse<StoryGenre>>> Create([FromBody] StoryGenreRequest request, CancellationToken ct) =>
        SaveAsync(request.ToGenre(), creating: true, ct);

    [HttpPut("{id}")]
    [RequestSizeLimit(MaxGenreRequestBytes)]
    public async Task<ActionResult<ApiResponse<StoryGenre>>> Update(string id, [FromBody] StoryGenreRequest request, CancellationToken ct)
    {
        if (!string.Equals(id, request.Id, StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(ApiResponse<StoryGenre>.Fail("The id cannot be changed.",
                new ApiError("genre-id-mismatch", "The id cannot be changed. Make a new genre instead.", "id")));
        }

        return await SaveAsync(request.ToGenre(), creating: false, ct);
    }

    /// <summary>Deletes a genre an administrator made, or puts a built-in one back as it shipped.</summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<StoryGenre?>>> Delete(string id, CancellationToken ct)
    {
        try
        {
            var left = await genres.DeleteOrResetAsync(id, currentUser.UserId, ct);
            await audit.RecordAsync(left is null ? "story.genre.deleted" : "story.genre.reset", Target(id), null, null, RemoteAddress(), ct);
            return Ok(ApiResponse<StoryGenre?>.Ok(left));
        }
        catch (StoryGenreException ex)
        {
            return Refused<StoryGenre?>(ex);
        }
    }

    private async Task<ActionResult<ApiResponse<StoryGenre>>> SaveAsync(StoryGenre input, bool creating, CancellationToken ct)
    {
        try
        {
            var before = creating ? null : await genres.GetAsync(input.Id, ct);
            var saved = await genres.SaveAsync(input, currentUser.UserId, creating, ct);
            await audit.RecordAsync(creating ? "story.genre.created" : "story.genre.updated", Target(saved.Id),
                before is null ? null : Summary(before), Summary(saved), RemoteAddress(), ct);
            return Ok(ApiResponse<StoryGenre>.Ok(saved));
        }
        catch (StoryGenreException ex)
        {
            return Refused<StoryGenre>(ex);
        }
    }

    private ActionResult<ApiResponse<T>> Refused<T>(StoryGenreException ex)
    {
        var body = ApiResponse<T>.Fail(ex.Message, new ApiError(ex.Code, ex.Message, ex.Field));
        if (ex.NotFound) return NotFound(body);
        if (ex.Code == "genre-exists") return Conflict(body);
        return BadRequest(body);
    }

    /// <summary>What the audit trail keeps: the settings, not the whole topic list.</summary>
    private static string Summary(StoryGenre g) => JsonSerializer.Serialize(new
    {
        g.Name, g.Enabled, g.Mode, g.Order, g.DefaultLanguage, g.DefaultTargetSeconds, Topics = g.Topics.Count, g.Tags, g.Hashtags,
        Links = g.Links.Select(l => l.Url)
    });

    private static string Target(string id) => $"story-genre:{(id.Length > 40 ? id[..40] : id)}";

    private string? RemoteAddress() => HttpContext.Connection.RemoteIpAddress?.ToString();
}
