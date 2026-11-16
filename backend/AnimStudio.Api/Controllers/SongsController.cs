using System.ComponentModel.DataAnnotations;
using AnimStudio.Api.Common;
using AnimStudio.Application.Security;
using AnimStudio.Application.Songs;
using AnimStudio.Domain.Songs;
using Microsoft.AspNetCore.Mvc;

namespace AnimStudio.Api.Controllers;

/// <summary>
/// The Songs page: AI-drafted lyrics the person edits, songs composed from them with Google Lyria, and the list of songs
/// made. Every song belongs to the signed-in user; ids are checked against that user's own list.
/// </summary>
[ApiController]
[Route("api/songs")]
public sealed class SongsController(
    SongLibrary songs,
    IStudioAccessEvaluator access,
    ICurrentUser currentUser) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<SongListResponse>>> List(CancellationToken ct)
    {
        if (Denied<SongListResponse>() is { } denied) return denied;
        return await Run(async () => new SongListResponse(
            [.. (await songs.ListAsync(currentUser.UserId, ct)).Select(SongResponse.From)],
            songs.ComposerConfigured,
            SongLibrary.MaxLyricsChars));
    }

    [HttpPost("lyrics")]
    [RequestSizeLimit(64 * 1024)]
    public async Task<ActionResult<ApiResponse<SongLyricsDraft>>> WriteLyrics([FromBody] WriteSongLyricsRequest request, CancellationToken ct)
    {
        if (Denied<SongLyricsDraft>() is { } denied) return denied;
        var (allowed, reason) = access.CheckAiQuota(currentUser);
        if (!allowed) return Fail<SongLyricsDraft>(403, "ai-not-allowed", reason ?? "AI use is not available.");
        return await Run(() => songs.WriteLyricsAsync(currentUser.UserId,
            new SongLyricsBrief(request.Theme, request.Language, request.Style, request.Mood), ct));
    }

    [HttpPost]
    [RequestSizeLimit(64 * 1024)]
    public async Task<ActionResult<ApiResponse<SongResponse>>> Compose([FromBody] ComposeSongRequest request, CancellationToken ct)
    {
        if (Denied<SongResponse>() is { } denied) return denied;
        var (allowed, reason) = access.CheckAiQuota(currentUser);
        if (!allowed) return Fail<SongResponse>(403, "ai-not-allowed", reason ?? "AI use is not available.");
        return await Run(async () => SongResponse.From(await songs.ComposeAsync(currentUser.UserId, new SongComposeRequest(
            request.Title, request.Theme, request.Language, request.Style, request.Mood, request.Lyrics,
            request.Instrumental, request.FullLength, request.SourcePostId), ct)));
    }

    /// <summary>The song's audio (MP3 or WAV), fetched by the page with the caller's identity.</summary>
    [HttpGet("{id}/audio")]
    public async Task<IActionResult> Audio(string id, CancellationToken ct)
    {
        if (!currentUser.IsAuthenticated) return Fail<object>(403, "auth-required", "Sign in to use Songs.").Result!;
        if (!SongLibrary.IsSongId(id)) return Fail<object>(404, "song-not-found", "That song was not found.").Result!;
        try
        {
            var opened = await songs.OpenAudioAsync(currentUser.UserId, id, ct);
            if (opened is not { } found) return Fail<object>(404, "song-audio-missing", "That song's audio file is missing.").Result!;
            var extension = found.Song.MimeType == "audio/mpeg" ? "mp3" : "wav";
            return File(found.Content, found.Song.MimeType, $"{SafeFileName(found.Song.Title)}.{extension}", enableRangeProcessing: true);
        }
        catch (SongException ex)
        {
            return Fail<object>(ex.Status, ex.Code, ex.Message).Result!;
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(string id, CancellationToken ct)
    {
        if (Denied<bool>() is { } denied) return denied;
        if (!SongLibrary.IsSongId(id)) return Fail<bool>(404, "song-not-found", "That song was not found.");
        return await Run(async () =>
        {
            await songs.DeleteAsync(currentUser.UserId, id, ct);
            return true;
        });
    }

    private async Task<ActionResult<ApiResponse<T>>> Run<T>(Func<Task<T>> work)
    {
        try
        {
            return Ok(ApiResponse<T>.Ok(await work()));
        }
        catch (SongException ex)
        {
            return Fail<T>(ex.Status, ex.Code, ex.Message);
        }
    }

    private ActionResult<ApiResponse<T>>? Denied<T>() =>
        currentUser.IsAuthenticated ? null : Fail<T>(403, "auth-required", "Sign in to use Songs.");

    private ActionResult<ApiResponse<T>> Fail<T>(int status, string code, string message) =>
        StatusCode(status, ApiResponse<T>.Fail(message, new ApiError(code, message)));

    /// <summary>A download name from the title: letters (any script), digits, spaces and dashes only.</summary>
    private static string SafeFileName(string title)
    {
        var clean = new string([.. title.Where(c => char.IsLetterOrDigit(c) || c is ' ' or '-' or '_')]).Trim();
        return clean.Length == 0 ? "song" : clean[..Math.Min(clean.Length, 80)];
    }
}

public sealed record WriteSongLyricsRequest
{
    [Required, StringLength(SongLibrary.MaxThemeChars, MinimumLength = 3)]
    public string Theme { get; init; } = string.Empty;

    [RegularExpression("^(hi|en)$")]
    public string Language { get; init; } = "hi";

    [Required, StringLength(SongLibrary.MaxStyleChars, MinimumLength = 2)]
    public string Style { get; init; } = "bhajan";

    [StringLength(SongLibrary.MaxStyleChars)]
    public string? Mood { get; init; }
}

public sealed record ComposeSongRequest
{
    [Required, StringLength(SongLibrary.MaxTitleChars, MinimumLength = 1)]
    public string Title { get; init; } = string.Empty;

    [StringLength(SongLibrary.MaxThemeChars)]
    public string? Theme { get; init; }

    [RegularExpression("^(hi|en)$")]
    public string Language { get; init; } = "hi";

    [Required, StringLength(SongLibrary.MaxStyleChars, MinimumLength = 2)]
    public string Style { get; init; } = "bhajan";

    [StringLength(SongLibrary.MaxStyleChars)]
    public string? Mood { get; init; }

    /// <summary>Checked against the exact limit by the library, so a too-long paste gets a clear message.</summary>
    [StringLength(SongLibrary.MaxLyricsChars + 400)]
    public string? Lyrics { get; init; }

    public bool Instrumental { get; init; }

    /// <summary>True: a complete song (Lyria 3 Pro). False: a 30-second clip (Lyria 3 Clip).</summary>
    public bool FullLength { get; init; } = true;

    [StringLength(80)]
    public string? SourcePostId { get; init; }
}

public sealed record SongListResponse(IReadOnlyList<SongResponse> Songs, bool ComposerConfigured, int MaxLyricsChars);

/// <summary>A song as the page shows it; the storage key stays on the server.</summary>
public sealed record SongResponse(
    string Id, string Title, string? Theme, string Language, string Style, string? Mood, string? Lyrics,
    bool Instrumental, string Model, string MimeType, double? DurationSeconds, string? SourcePostId, DateTime CreatedAtUtc)
{
    public static SongResponse From(Song s) => new(
        s.Id, s.Title, s.Theme, s.Language, s.Style, s.Mood, s.Lyrics, s.Instrumental, s.Model, s.MimeType,
        s.DurationSeconds, s.SourcePostId, s.CreatedAtUtc);
}
