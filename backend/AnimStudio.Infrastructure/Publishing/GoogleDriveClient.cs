using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Authentication;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Logging;

namespace AnimStudio.Infrastructure.Publishing;

public sealed record GoogleDriveAccount(string? Name, string? Email);

/// <summary>A file as Drive describes it: enough to tell whether it is still there, and where.</summary>
public sealed record GoogleDriveFileInfo(string Id, string Name, bool Trashed, IReadOnlyList<string> Parents);

/// <summary>
/// The few Drive v3 calls "send to phone" needs: which account this is, a folder to put the
/// video in, and a resumable upload of the file. With the <c>drive.file</c> scope every call
/// only ever sees files this app created.
/// <para>
/// Hosts are fixed, the token travels only in the <c>Authorization</c> header, and only
/// Google's status and reason code are logged - never a file name, title or account.
/// </para>
/// </summary>
public sealed partial class GoogleDriveClient : IDisposable
{
    private const string Api = "https://www.googleapis.com/drive/v3/";
    private const string UploadUrl = "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id";
    private const string FolderMimeType = "application/vnd.google-apps.folder";

    /// <summary>Drive requires every chunk but the last to be a multiple of this.</summary>
    private const int ChunkGranularity = 256 * 1024;
    private const int ChunkSize = 32 * ChunkGranularity;
    private const int MaxRetries = 6;

    private readonly ILogger<GoogleDriveClient> _logger;
    private readonly HttpClient _http;

    public GoogleDriveClient(ILogger<GoogleDriveClient> logger) : this(logger, null)
    {
    }

    /// <summary>Tests pass a handler; production builds one with TLS 1.2+ and no redirects.</summary>
    public GoogleDriveClient(ILogger<GoogleDriveClient> logger, HttpMessageHandler? handler)
    {
        _logger = logger;
        _http = new HttpClient(handler ?? new SocketsHttpHandler
        {
            PooledConnectionLifetime = TimeSpan.FromMinutes(10),
            SslOptions = { EnabledSslProtocols = SslProtocols.Tls12 | SslProtocols.Tls13 },
            // 308 is Drive's "resume incomplete", not a redirect to follow.
            AllowAutoRedirect = false
        })
        {
            // Per request, so per chunk.
            Timeout = TimeSpan.FromMinutes(10)
        };
    }

    /// <summary>The Drive's owner, to show which account it is. Null parts when Drive doesn't say.</summary>
    public async Task<GoogleDriveAccount> GetAccountAsync(string accessToken, CancellationToken ct)
    {
        using var document = await SendJsonAsync(HttpMethod.Get, Api + "about?fields=user(displayName,emailAddress)", null, accessToken, "about.get", ct)
            .ConfigureAwait(false);
        var user = document.RootElement.TryGetProperty("user", out var u) ? u : default;
        return new GoogleDriveAccount(Shorten(ReadString(user, "displayName"), 200), Shorten(ReadString(user, "emailAddress"), 320));
    }

    /// <summary>
    /// The id of an app-made folder called <paramref name="name"/> in the Drive's root: the
    /// remembered one if it is still there, else one found by name, else a new one.
    /// </summary>
    /// <param name="name">Already checked by <see cref="IsValidFolderName"/>, so it can't break out of the query's quotes.</param>
    public async Task<string> EnsureFolderAsync(string accessToken, string name, string? knownId, CancellationToken ct)
    {
        if (!IsValidFolderName(name)) throw new YouTubePublishException("drive-folder-invalid", FolderNameRule);

        if (knownId is not null && IsFileId(knownId))
        {
            try
            {
                using var known = await SendJsonAsync(HttpMethod.Get, $"{Api}files/{Uri.EscapeDataString(knownId)}?fields=id,trashed", null,
                    accessToken, "files.get", ct).ConfigureAwait(false);
                if (known.RootElement.TryGetProperty("trashed", out var trashed) && trashed.ValueKind == JsonValueKind.False) return knownId;
            }
            catch (YouTubePublishException ex) when (ex.Code == "drive-not-found")
            {
                // Deleted on the Drive since; find or make it again below.
            }
        }

        var query = $"mimeType='{FolderMimeType}' and name='{name}' and trashed=false and 'root' in parents";
        using (var found = await SendJsonAsync(HttpMethod.Get,
                   $"{Api}files?q={Uri.EscapeDataString(query)}&fields=files(id)&pageSize=1&spaces=drive", null, accessToken, "files.list", ct)
                   .ConfigureAwait(false))
        {
            if (found.RootElement.TryGetProperty("files", out var files) && files.ValueKind == JsonValueKind.Array
                && files.GetArrayLength() > 0 && ReadString(files[0], "id") is { } id && IsFileId(id))
                return id;
        }

        using var created = await SendJsonAsync(HttpMethod.Post, Api + "files?fields=id",
            new { name, mimeType = FolderMimeType, parents = new[] { "root" } }, accessToken, "files.create", ct).ConfigureAwait(false);
        return ReadString(created.RootElement, "id") is { } newId && IsFileId(newId)
            ? newId
            : throw new YouTubePublishException("drive-failed", "Google Drive didn't create the folder. Try again.");
    }

    /// <summary>
    /// The id of an app-made folder called <paramref name="name"/> directly inside
    /// <paramref name="parentId"/>: found by name, else made.
    /// </summary>
    /// <param name="name">Checked by <see cref="IsValidFolderName"/>, so it can't break out of the query's quotes.</param>
    public async Task<string> EnsureChildFolderAsync(string accessToken, string parentId, string name, CancellationToken ct)
    {
        if (!IsValidFolderName(name)) throw new YouTubePublishException("drive-folder-invalid", FolderNameRule);
        if (!IsFileId(parentId)) throw new YouTubePublishException("drive-failed", "Google Drive returned a folder AnimStudio can't use.");

        var query = $"mimeType='{FolderMimeType}' and name='{name}' and trashed=false and '{parentId}' in parents";
        using (var found = await SendJsonAsync(HttpMethod.Get,
                   $"{Api}files?q={Uri.EscapeDataString(query)}&fields=files(id)&pageSize=1&spaces=drive", null, accessToken, "files.list", ct)
                   .ConfigureAwait(false))
        {
            if (found.RootElement.TryGetProperty("files", out var files) && files.ValueKind == JsonValueKind.Array
                && files.GetArrayLength() > 0 && ReadString(files[0], "id") is { } id && IsFileId(id))
                return id;
        }

        using var created = await SendJsonAsync(HttpMethod.Post, Api + "files?fields=id",
            new { name, mimeType = FolderMimeType, parents = new[] { parentId } }, accessToken, "files.create", ct).ConfigureAwait(false);
        return ReadString(created.RootElement, "id") is { } newId && IsFileId(newId)
            ? newId
            : throw new YouTubePublishException("drive-failed", "Google Drive didn't create the folder. Try again.");
    }

    /// <summary>A file the app made, or null when Drive no longer has it (deleted for good, or never the app's).</summary>
    public async Task<GoogleDriveFileInfo?> GetFileAsync(string accessToken, string fileId, CancellationToken ct)
    {
        if (!IsFileId(fileId)) return null;
        try
        {
            using var doc = await SendJsonAsync(HttpMethod.Get, $"{Api}files/{Uri.EscapeDataString(fileId)}?fields=id,name,trashed,parents",
                null, accessToken, "files.get", ct).ConfigureAwait(false);
            var root = doc.RootElement;
            var parents = new List<string>();
            if (root.TryGetProperty("parents", out var p) && p.ValueKind == JsonValueKind.Array)
            {
                foreach (var parent in p.EnumerateArray())
                {
                    if (parent.ValueKind == JsonValueKind.String && parent.GetString() is { } id && IsFileId(id)) parents.Add(id);
                }
            }
            return new GoogleDriveFileInfo(fileId, Shorten(ReadString(root, "name"), 300) ?? string.Empty,
                root.TryGetProperty("trashed", out var trashed) && trashed.ValueKind == JsonValueKind.True, parents);
        }
        catch (YouTubePublishException ex) when (ex.Code == "drive-not-found")
        {
            return null;
        }
    }

    /// <summary>Moves an app-made file into <paramref name="folderId"/> (out of every other folder) and renames it.</summary>
    public async Task MoveFileAsync(string accessToken, GoogleDriveFileInfo file, string folderId, string newName, CancellationToken ct)
    {
        if (!IsFileId(file.Id) || !IsFileId(folderId)) throw new YouTubePublishException("drive-failed", "Google Drive returned a file AnimStudio can't use.");
        var remove = string.Join(',', file.Parents.Where(p => p != folderId));
        var url = $"{Api}files/{Uri.EscapeDataString(file.Id)}?fields=id&addParents={Uri.EscapeDataString(folderId)}"
            + (remove.Length > 0 ? "&removeParents=" + Uri.EscapeDataString(remove) : string.Empty);
        using (await SendJsonAsync(HttpMethod.Patch, url, new { name = newName }, accessToken, "files.update", ct).ConfigureAwait(false))
        {
        }
    }

    /// <summary>Moves an app-made file to the Drive trash (recoverable there for 30 days).</summary>
    public async Task TrashFileAsync(string accessToken, string fileId, CancellationToken ct)
    {
        if (!IsFileId(fileId)) return;
        using (await SendJsonAsync(HttpMethod.Patch, $"{Api}files/{Uri.EscapeDataString(fileId)}?fields=id", new { trashed = true }, accessToken, "files.trash", ct).ConfigureAwait(false))
        {
        }
    }

    /// <summary>
    /// Streams an app-made file's content into the stream <paramref name="open"/> returns. The
    /// destination is only opened once Drive has agreed to send the file, so a failure can still
    /// be answered with an error instead of a half-written download.
    /// </summary>
    /// <param name="open">Given the file's size when Drive says it; returns where the bytes go.</param>
    public async Task DownloadAsync(string accessToken, string fileId, Func<long?, Task<Stream>> open, CancellationToken ct)
    {
        if (!IsFileId(fileId)) throw new YouTubePublishException("drive-not-found", "That item isn't on Google Drive any more.");

        using var request = new HttpRequestMessage(HttpMethod.Get, $"{Api}files/{Uri.EscapeDataString(fileId)}?alt=media");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        HttpResponseMessage response;
        try
        {
            response = await _http.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, ct).ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException && !ct.IsCancellationRequested)
        {
            _logger.LogWarning("Google Drive could not be reached for download: {ErrorType}", ex.GetType().Name);
            throw new YouTubePublishException("drive-unreachable", "Google Drive couldn't be reached. Try again in a minute.");
        }

        using (response)
        {
            if (!response.IsSuccessStatusCode) throw await FailureAsync(response, "files.download", ct).ConfigureAwait(false);
            var destination = await open(response.Content.Headers.ContentLength).ConfigureAwait(false);
            await using var source = await response.Content.ReadAsStreamAsync(ct).ConfigureAwait(false);
            await source.CopyToAsync(destination, 81920, ct).ConfigureAwait(false);
        }
    }

    /// <summary>
    /// The folders in the Drive's root that this app made - with <c>drive.file</c>, the only
    /// ones it can see - most recently changed first.
    /// </summary>
    public async Task<IReadOnlyList<(string Id, string Name)>> ListFoldersAsync(string accessToken, CancellationToken ct)
    {
        var query = $"mimeType='{FolderMimeType}' and trashed=false and 'root' in parents";
        using var found = await SendJsonAsync(HttpMethod.Get,
            $"{Api}files?q={Uri.EscapeDataString(query)}&fields=files(id,name)&pageSize=100&orderBy=modifiedTime%20desc&spaces=drive",
            null, accessToken, "files.list", ct).ConfigureAwait(false);

        var list = new List<(string, string)>();
        if (found.RootElement.TryGetProperty("files", out var files) && files.ValueKind == JsonValueKind.Array)
        {
            foreach (var f in files.EnumerateArray())
            {
                if (ReadString(f, "id") is { } id && IsFileId(id) && ReadString(f, "name") is { } name)
                    list.Add((id, Shorten(name, 200)!));
            }
        }
        return list;
    }

    /// <summary>
    /// Sends <paramref name="content"/> into <paramref name="folderId"/> with Drive's resumable
    /// protocol, one chunk in memory at a time; a dropped connection costs a chunk, not the file.
    /// </summary>
    /// <param name="accessToken">Returns a usable token; <c>true</c> asks for a fresh one after a 401.</param>
    /// <returns>The new file's id.</returns>
    public async Task<string> UploadAsync(
        Stream content, long length, string fileName, string folderId, string? description,
        Func<bool, CancellationToken, Task<string>> accessToken, IProgress<long> progress, CancellationToken ct)
    {
        var token = await accessToken(false, ct).ConfigureAwait(false);
        var (session, sessionToken) = await OpenSessionAsync(length, fileName, folderId, description, token, accessToken, ct).ConfigureAwait(false);
        token = sessionToken;

        var buffer = new byte[ChunkSize];
        long confirmed = 0;
        var retries = 0;
        var refreshes = 0;

        while (true)
        {
            ct.ThrowIfCancellationRequested();
            var chunkStart = confirmed;
            var read = await ReadFullyAsync(content, buffer, (int)Math.Min(ChunkSize, length - chunkStart), ct).ConfigureAwait(false);
            if (read == 0 && chunkStart < length)
                throw new YouTubePublishException("video-truncated", "The video file ended sooner than expected. Render it again and retry.");

            var offsetInChunk = 0;
            while (offsetInChunk < read)
            {
                var from = chunkStart + offsetInChunk;
                Chunk result;
                try
                {
                    using var request = new HttpRequestMessage(HttpMethod.Put, session)
                    {
                        Content = new ByteArrayContent(buffer, offsetInChunk, read - offsetInChunk)
                    };
                    request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
                    request.Content.Headers.ContentType = new MediaTypeHeaderValue("video/mp4");
                    request.Content.Headers.ContentRange = new ContentRangeHeaderValue(from, chunkStart + read - 1, length);
                    using var response = await _http.SendAsync(request, ct).ConfigureAwait(false);
                    result = await InterpretAsync(response, ct).ConfigureAwait(false);
                }
                catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException && !ct.IsCancellationRequested)
                {
                    _logger.LogWarning("Drive upload chunk failed in transit ({ErrorType}); asking how much arrived", ex.GetType().Name);
                    result = Chunk.Retry;
                }

                if (result.Kind == ChunkKind.Unauthorized)
                {
                    if (++refreshes > 3)
                        throw new YouTubePublishException("drive-reconnect", "Google Drive stopped accepting AnimStudio's access. Connect Drive again.");
                    token = await accessToken(true, ct).ConfigureAwait(false);
                    continue;
                }

                if (result.Kind == ChunkKind.Retry)
                {
                    if (++retries > MaxRetries)
                        throw new YouTubePublishException("drive-unreachable", "The copy to Google Drive kept failing. Try again later.");
                    await Task.Delay(Backoff(retries), ct).ConfigureAwait(false);
                    result = await QueryStatusAsync(session, length, token, ct).ConfigureAwait(false);
                    if (result.Kind is ChunkKind.Retry or ChunkKind.Unauthorized) continue;
                }

                if (result.Kind == ChunkKind.Done)
                {
                    progress.Report(length);
                    return result.FileId!;
                }

                retries = 0;
                refreshes = 0;
                if (result.Received < chunkStart || result.Received > chunkStart + read)
                    throw new YouTubePublishException("drive-failed", "Google Drive lost track of the copy. Send it again.");

                progress.Report(result.Received);
                offsetInChunk = (int)(result.Received - chunkStart);
                confirmed = result.Received;
            }
        }
    }

    /// <summary>Letters, digits, spaces and a few separators, up to 100 characters - nothing that needs escaping in a Drive query.</summary>
    public static bool IsValidFolderName(string? name) =>
        name is { Length: > 0 and <= 100 } && name.Trim() == name && FolderNamePattern().IsMatch(name);

    public const string FolderNameRule =
        "Use a folder name of up to 100 letters, digits, spaces and - _ . ( ) &, with no space at either end.";

    private async Task<(Uri Session, string Token)> OpenSessionAsync(
        long length, string fileName, string folderId, string? description, string token,
        Func<bool, CancellationToken, Task<string>> accessToken, CancellationToken ct)
    {
        var body = JsonSerializer.Serialize(new { name = fileName, mimeType = "video/mp4", parents = new[] { folderId }, description = description ?? string.Empty });
        for (var attempt = 1; ; attempt++)
        {
            using var request = new HttpRequestMessage(HttpMethod.Post, UploadUrl)
            {
                Content = new StringContent(body, System.Text.Encoding.UTF8, "application/json")
            };
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            request.Headers.Add("X-Upload-Content-Type", "video/mp4");
            request.Headers.Add("X-Upload-Content-Length", length.ToString(System.Globalization.CultureInfo.InvariantCulture));

            HttpResponseMessage response;
            try
            {
                response = await _http.SendAsync(request, ct).ConfigureAwait(false);
            }
            catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException && !ct.IsCancellationRequested)
            {
                if (attempt > 3) throw new YouTubePublishException("drive-unreachable", "Google Drive couldn't be reached. Try again later.");
                await Task.Delay(Backoff(attempt), ct).ConfigureAwait(false);
                continue;
            }

            using (response)
            {
                if (response.StatusCode == HttpStatusCode.Unauthorized && attempt == 1)
                {
                    token = await accessToken(true, ct).ConfigureAwait(false);
                    continue;
                }
                if ((int)response.StatusCode >= 500 && attempt <= 3)
                {
                    await Task.Delay(Backoff(attempt), ct).ConfigureAwait(false);
                    continue;
                }
                if (!response.IsSuccessStatusCode)
                    throw await FailureAsync(response, "files.create (upload)", ct).ConfigureAwait(false);

                // The session URL carries its own upload id; it must stay on Google's upload host.
                var location = response.Headers.Location;
                if (location is null || !location.IsAbsoluteUri || location.Scheme != Uri.UriSchemeHttps
                    || !string.Equals(location.Host, "www.googleapis.com", StringComparison.OrdinalIgnoreCase))
                    throw new YouTubePublishException("drive-failed", "Google Drive didn't open an upload session. Try again.");

                return (location, token);
            }
        }
    }

    private async Task<Chunk> QueryStatusAsync(Uri session, long total, string token, CancellationToken ct)
    {
        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Put, session) { Content = new ByteArrayContent([]) };
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            request.Content.Headers.ContentRange = new ContentRangeHeaderValue(total);
            using var response = await _http.SendAsync(request, ct).ConfigureAwait(false);
            return await InterpretAsync(response, ct).ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException && !ct.IsCancellationRequested)
        {
            return Chunk.Retry;
        }
    }

    private async Task<Chunk> InterpretAsync(HttpResponseMessage response, CancellationToken ct)
    {
        var status = (int)response.StatusCode;
        if (status == 308)
        {
            // "Range: bytes=0-N" - N is the last byte held. No header means nothing arrived yet.
            var received = 0L;
            if (response.Headers.TryGetValues("Range", out var ranges)
                && ranges.FirstOrDefault() is { } range
                && range.LastIndexOf('-') is var dash and > 0
                && long.TryParse(range[(dash + 1)..], System.Globalization.NumberStyles.None, System.Globalization.CultureInfo.InvariantCulture, out var last))
            {
                received = last + 1;
            }
            return new Chunk(ChunkKind.Incomplete, received);
        }

        if (status is 200 or 201)
        {
            await using var body = await response.Content.ReadAsStreamAsync(ct).ConfigureAwait(false);
            using var document = await JsonDocument.ParseAsync(body, cancellationToken: ct).ConfigureAwait(false);
            return ReadString(document.RootElement, "id") is { } id && IsFileId(id)
                ? new Chunk(ChunkKind.Done, FileId: id)
                : throw new YouTubePublishException("drive-failed", "Google Drive finished the copy but didn't return the file.");
        }

        if (status == 401) return Chunk.Unauthorized;
        if (status >= 500) return Chunk.Retry;
        throw await FailureAsync(response, "upload chunk", ct).ConfigureAwait(false);
    }

    private async Task<JsonDocument> SendJsonAsync(HttpMethod method, string url, object? body, string accessToken, string operation, CancellationToken ct)
    {
        using var request = new HttpRequestMessage(method, url);
        if (body is not null) request.Content = JsonContent.Create(body);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        HttpResponseMessage response;
        try
        {
            response = await _http.SendAsync(request, ct).ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException && !ct.IsCancellationRequested)
        {
            _logger.LogWarning("Google Drive could not be reached for {Operation}: {ErrorType}", operation, ex.GetType().Name);
            throw new YouTubePublishException("drive-unreachable", "Google Drive couldn't be reached. Try again in a minute.");
        }

        using (response)
        {
            if (!response.IsSuccessStatusCode) throw await FailureAsync(response, operation, ct).ConfigureAwait(false);
            await using var content = await response.Content.ReadAsStreamAsync(ct).ConfigureAwait(false);
            return await JsonDocument.ParseAsync(content, cancellationToken: ct).ConfigureAwait(false);
        }
    }

    private async Task<YouTubePublishException> FailureAsync(HttpResponseMessage response, string operation, CancellationToken ct)
    {
        var reason = await GoogleErrors.ReadReasonAsync(response, ct).ConfigureAwait(false);
        _logger.LogWarning("Google Drive {Operation} answered {Status} ({Reason})", operation, (int)response.StatusCode, reason ?? "unknown");

        return ((int)response.StatusCode, reason) switch
        {
            (401, _) or (403, "insufficientPermissions" or "authError") => new("drive-reconnect",
                "Google Drive refused AnimStudio's access. Connect Drive again."),
            // The Drive API is switched off in the Google Cloud project the app's OAuth client belongs to.
            (403, "accessNotConfigured" or "SERVICE_DISABLED") => new("drive-api-disabled",
                "The Google Drive API isn't enabled for this app's Google Cloud project. An admin needs to enable it (Google Cloud console > APIs & Services > Library > Google Drive API), then send again."),
            (403, "storageQuotaExceeded") => new("drive-full", "Your Google Drive is full. Free up space, then send again."),
            (403, "userRateLimitExceeded" or "rateLimitExceeded" or "dailyLimitExceeded") or (429, _) => new("drive-busy",
                "Google Drive is limiting requests right now. Try again in a few minutes."),
            (404, _) => new("drive-not-found", "That item isn't on Google Drive any more."),
            _ => new("drive-failed", $"Google Drive refused the request (HTTP {(int)response.StatusCode}).")
        };
    }

    private static async Task<int> ReadFullyAsync(Stream stream, byte[] buffer, int count, CancellationToken ct)
    {
        var total = 0;
        while (total < count)
        {
            var read = await stream.ReadAsync(buffer.AsMemory(total, count - total), ct).ConfigureAwait(false);
            if (read == 0) break;
            total += read;
        }
        return total;
    }

    private static TimeSpan Backoff(int attempt) =>
        TimeSpan.FromSeconds(Math.Min(60, Math.Pow(2, attempt)) + Random.Shared.NextDouble());

    private static string? ReadString(JsonElement element, string name) =>
        element.ValueKind == JsonValueKind.Object && element.TryGetProperty(name, out var value) && value.ValueKind == JsonValueKind.String
            ? value.GetString()
            : null;

    private static string? Shorten(string? value, int max) => value is null || value.Length <= max ? value : value[..max];

    private static bool IsFileId(string value) => FileIdPattern().IsMatch(value);

    public void Dispose() => _http.Dispose();

    private enum ChunkKind { Incomplete, Done, Retry, Unauthorized }

    private sealed record Chunk(ChunkKind Kind, long Received = 0, string? FileId = null)
    {
        public static readonly Chunk Retry = new(ChunkKind.Retry);
        public static readonly Chunk Unauthorized = new(ChunkKind.Unauthorized);
    }

    // \p{M}: the vowel signs of Devanagari and other scripts are marks, not letters.
    [GeneratedRegex(@"^[\p{L}\p{M}\p{N} _.\-()&]+$")]
    private static partial Regex FolderNamePattern();

    [GeneratedRegex("^[A-Za-z0-9_-]{10,200}$")]
    private static partial Regex FileIdPattern();
}
