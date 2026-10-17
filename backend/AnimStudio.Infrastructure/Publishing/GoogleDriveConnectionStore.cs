using System.Security.Cryptography;
using System.Text.RegularExpressions;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Domain.Publishing;
using KeshavSingh.Security;
using Microsoft.Extensions.Logging;

namespace AnimStudio.Infrastructure.Publishing;

/// <summary>
/// What the UI may know about a Drive: never the token.
/// </summary>
/// <param name="ChannelId">The channel asked about; null for the personal Drive.</param>
/// <param name="ChannelTitle">That channel's name, for showing.</param>
/// <param name="OwnDrive">
/// True when the channel has a Drive of its own. False for a channel that uses the personal
/// Drive (or nothing yet) - its videos still go to a folder of its own there.
/// </param>
/// <param name="FolderName">Where videos for this channel go unless a send names another.</param>
public sealed record GoogleDriveStatus(
    bool Connected,
    string? AccountName,
    string? AccountEmail,
    string FolderName,
    DateTime? ConnectedAt,
    bool NeedsReconnect,
    string? ChannelId = null,
    string? ChannelTitle = null,
    bool OwnDrive = false);

/// <summary>Which stored Drive serves a channel, and the folder its videos go to there.</summary>
/// <param name="DriveChannelId">The key of the Drive that serves it: the channel's own, or null for the personal one.</param>
public sealed record DriveTarget(string UserId, string? DriveChannelId, string FolderName);

/// <summary>
/// The Google Drives each user connects for saving renders and "send to phone": a personal
/// one, and optionally one per YouTube channel. A channel without its own Drive uses the
/// personal one, in a folder named after the channel, so each channel's videos still land
/// apart. The same OAuth client and encrypted-at-rest refresh token as
/// <see cref="YouTubeConnectionStore"/>, but its own sign-in with only the <c>drive.file</c>
/// scope, so the app sees nothing on the Drive it didn't put there.
/// <para>
/// A channel id from the client is only ever used after it is found among the caller's own
/// connected channels.
/// </para>
/// </summary>
public sealed partial class GoogleDriveConnectionStore(
    IGoogleDriveConnectionRepository repository,
    YouTubeConnectionStore channels,
    YouTubeOAuthClient oauth,
    YouTubeOAuthStateCache pending,
    GoogleDriveClient drive,
    Lazy<DataProtector> protector,
    TimeProvider clock,
    ILogger<GoogleDriveConnectionStore> logger)
{
    /// <summary>A bounded list: folder names typed once and never used again shouldn't pile up.</summary>
    private const int MaxRememberedFolders = 50;

    /// <summary>The personal Drive (<paramref name="channelId"/> null), or what a channel would use.</summary>
    public async Task<GoogleDriveStatus> GetStatusAsync(string userId, string? channelId, CancellationToken ct)
    {
        var channel = await OwnedChannelAsync(userId, channelId, ct).ConfigureAwait(false);
        return await DescribeAsync(userId, channel, ct).ConfigureAwait(false);
    }

    /// <summary>The personal Drive first, then what each connected channel uses.</summary>
    public async Task<IReadOnlyList<GoogleDriveStatus>> ListAsync(string userId, CancellationToken ct)
    {
        var stored = await repository.ListByUserAsync(userId, ct).ConfigureAwait(false);
        var personal = stored.FirstOrDefault(d => string.IsNullOrEmpty(d.ChannelId));
        var list = new List<GoogleDriveStatus> { Describe(personal, null, personal) };

        foreach (var c in await channels.ListAsync(userId, ct).ConfigureAwait(false))
        {
            var own = stored.FirstOrDefault(d => string.Equals(d.ChannelId, c.ChannelId, StringComparison.Ordinal));
            list.Add(Describe(own, new ChannelRef(c.ChannelId, c.ChannelTitle), personal));
        }
        return list;
    }

    /// <summary>
    /// The Drive and folder a channel's videos go to: its own Drive if it has one, else the
    /// personal Drive. Throws when neither is connected or the one that would be used needs
    /// reconnecting.
    /// </summary>
    public async Task<DriveTarget> ResolveAsync(string userId, string? channelId, string? folderOverride, CancellationToken ct)
    {
        var channel = await OwnedChannelAsync(userId, channelId, ct).ConfigureAwait(false);
        var status = await DescribeAsync(userId, channel, ct).ConfigureAwait(false);
        if (!status.Connected)
            throw new YouTubePublishException("drive-not-connected",
                channel is null ? "Connect Google Drive first." : $"Connect a Google Drive for {channel.Title} (or your own Drive) first.");
        if (status.NeedsReconnect)
            throw new YouTubePublishException("drive-reconnect", "Google Drive access has expired or was removed. Connect Drive again.");

        var folder = string.IsNullOrWhiteSpace(folderOverride) ? status.FolderName : folderOverride.Trim();
        if (!GoogleDriveClient.IsValidFolderName(folder))
            throw new YouTubePublishException("drive-folder-invalid", GoogleDriveClient.FolderNameRule);

        return new DriveTarget(userId, status.OwnDrive ? channel!.Id : null, folder);
    }

    /// <summary>Where to send the browser to approve Drive access - for a channel, or the personal Drive.</summary>
    public async Task<string> BeginConnectAsync(string userId, string? channelId, string? returnPath, CancellationToken ct)
    {
        if (!oauth.IsConfigured)
            throw new YouTubePublishException("youtube-not-configured",
                "Google sign-in isn't set up on this server. Ask an admin to set YouTube:Publish:ClientId, ClientSecret and RedirectUri.");
        try
        {
            _ = protector.Value;
        }
        catch (InvalidOperationException)
        {
            throw new YouTubePublishException("encryption-not-configured",
                "Connections are stored encrypted, and Encryption:DataKey isn't set on this server. Ask an admin to set it.");
        }

        // Checked now, while the caller is known, and carried on the server - the callback
        // can't be pointed at a channel the user doesn't have.
        var channel = await OwnedChannelAsync(userId, channelId, ct).ConfigureAwait(false);

        var (state, challenge) = pending.Create(userId, YouTubeConnectionStore.SafeReturnPath(returnPath),
            YouTubeOAuthStateCache.DriveKind, channel?.Id);
        return oauth.BuildAuthorizationUrl(state, challenge, YouTubeOAuthClient.DriveScopes);
    }

    public async Task<(GoogleDriveStatus Status, string ReturnPath)> CompleteConnectAsync(
        string userId, string? code, string? state, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(state) || state.Length > 128
            || pending.Take(state, userId, YouTubeOAuthStateCache.DriveKind) is not { } started)
            throw new YouTubePublishException("youtube-state-invalid",
                "This sign-in link has expired or was already used. Start connecting Google Drive again.");

        if (string.IsNullOrWhiteSpace(code) || code.Length > 2048)
            throw new YouTubePublishException("youtube-code-missing", "Google didn't send back a sign-in code. Start connecting Google Drive again.");

        // The channel may have been disconnected while the user was at Google.
        var channel = await OwnedChannelAsync(userId, started.Target, ct).ConfigureAwait(false);

        var tokens = await oauth.ExchangeCodeAsync(code, started.CodeVerifier, ct).ConfigureAwait(false);
        if (!tokens.Scope.Split(' ', StringSplitOptions.RemoveEmptyEntries).Contains(YouTubeOAuthClient.DriveScopes, StringComparer.Ordinal))
        {
            await oauth.RevokeAsync(tokens.RefreshToken ?? tokens.AccessToken, ct).ConfigureAwait(false);
            throw new YouTubePublishException("drive-scope-missing",
                "Permission to add files to Google Drive wasn't granted. Connect again and leave it ticked.");
        }
        if (string.IsNullOrEmpty(tokens.RefreshToken))
            throw new YouTubePublishException("youtube-no-refresh-token",
                "Google didn't grant lasting access. Remove AnimStudio under myaccount.google.com/permissions, then connect again.");

        GoogleDriveAccount account;
        try
        {
            account = await drive.GetAccountAsync(tokens.AccessToken, ct).ConfigureAwait(false);
        }
        catch (YouTubePublishException)
        {
            // Only for showing which Drive it is; the connection works without it.
            account = new GoogleDriveAccount(null, null);
        }

        var existing = await repository.GetAsync(userId, channel?.Id, ct).ConfigureAwait(false);
        // Another account's folders aren't on this Drive.
        var sameAccount = existing is not null && existing.AccountEmail is not null
            && string.Equals(existing.AccountEmail, account.Email, StringComparison.OrdinalIgnoreCase);
        var saved = new GoogleDriveConnection
        {
            Id = GoogleDriveConnection.KeyFor(userId, channel?.Id),
            UserId = userId,
            ChannelId = channel?.Id,
            AccountName = account.Name,
            AccountEmail = account.Email,
            RefreshTokenCipher = protector.Value.Encrypt(tokens.RefreshToken),
            Scopes = tokens.Scope,
            FolderName = existing?.FolderName ?? AutoFolderName(channel?.Title),
            Folders = sameAccount ? existing!.Folders : [],
            ChannelFolders = existing?.ChannelFolders ?? [],
            ConnectedAt = clock.GetUtcNow().UtcDateTime,
            RevokedAt = null
        };
        await repository.UpsertAsync(saved, ct).ConfigureAwait(false);
        logger.LogInformation("Google Drive {Action} for user {UserId}, channel {ChannelId}",
            existing is null ? "connected" : "reconnected", userId, channel?.Id ?? "(personal)");

        return (Describe(saved, channel, null), started.ReturnPath);
    }

    /// <summary>Disconnects the channel's own Drive, or the personal one. Channels using it fall back to nothing.</summary>
    public async Task<bool> DisconnectAsync(string userId, string? channelId, CancellationToken ct)
    {
        var channel = await OwnedChannelOrIdAsync(userId, channelId, ct).ConfigureAwait(false);
        var stored = await repository.GetAsync(userId, channel, ct).ConfigureAwait(false);
        if (stored is null) return false;

        if (TryDecrypt(stored) is { } refreshToken)
            await oauth.RevokeAsync(refreshToken, ct).ConfigureAwait(false);

        var removed = await repository.DeleteAsync(userId, channel, ct).ConfigureAwait(false);
        if (removed) logger.LogInformation("Google Drive disconnected for user {UserId}, channel {ChannelId}", userId, channel ?? "(personal)");
        return removed;
    }

    /// <summary>
    /// Sets the folder later sends go to by default: on the channel's own Drive, or - for a
    /// channel using the personal Drive - that channel's folder there.
    /// </summary>
    public async Task<GoogleDriveStatus> SetFolderAsync(string userId, string? channelId, string? folderName, CancellationToken ct)
    {
        var name = folderName?.Trim();
        if (!GoogleDriveClient.IsValidFolderName(name))
            throw new YouTubePublishException("drive-folder-invalid", GoogleDriveClient.FolderNameRule);

        var channel = await OwnedChannelAsync(userId, channelId, ct).ConfigureAwait(false);
        var own = channel is null ? null : await repository.GetAsync(userId, channel.Id, ct).ConfigureAwait(false);
        if (own is not null)
        {
            own.FolderName = name!;
            await repository.UpsertAsync(own, ct).ConfigureAwait(false);
            return await DescribeAsync(userId, channel, ct).ConfigureAwait(false);
        }

        var personal = await repository.GetAsync(userId, null, ct).ConfigureAwait(false)
            ?? throw new YouTubePublishException("drive-not-connected", "Connect Google Drive first.");
        if (channel is null)
        {
            personal.FolderName = name!;
        }
        else
        {
            personal.ChannelFolders.RemoveAll(f => string.Equals(f.ChannelId, channel.Id, StringComparison.Ordinal));
            personal.ChannelFolders.Add(new GoogleDriveChannelFolder { ChannelId = channel.Id, FolderName = name! });
        }
        await repository.UpsertAsync(personal, ct).ConfigureAwait(false);
        return await DescribeAsync(userId, channel, ct).ConfigureAwait(false);
    }

    /// <summary>
    /// Folder names to pick from on the Drive a channel uses: the ones the app made there
    /// (which, with <c>drive.file</c>, are the only ones it can see), its default first.
    /// </summary>
    public async Task<IReadOnlyList<string>> ListFoldersAsync(string userId, string? channelId, CancellationToken ct)
    {
        var target = await ResolveAsync(userId, channelId, null, ct).ConfigureAwait(false);
        var token = await GetAccessTokenAsync(target, ct).ConfigureAwait(false);
        var live = await drive.ListFoldersAsync(token, ct).ConfigureAwait(false);

        var names = new List<string> { target.FolderName };
        foreach (var name in live.Select(f => f.Name))
        {
            if (GoogleDriveClient.IsValidFolderName(name) && !names.Contains(name, StringComparer.Ordinal)) names.Add(name);
        }
        return names;
    }

    /// <summary>A fresh access token for the Drive a target names. Marks it for reconnecting if Google refuses it.</summary>
    public async Task<string> GetAccessTokenAsync(DriveTarget target, CancellationToken ct)
    {
        var stored = await repository.GetAsync(target.UserId, target.DriveChannelId, ct).ConfigureAwait(false)
            ?? throw new YouTubePublishException("drive-not-connected", "Google Drive isn't connected any more. Connect it again.");

        var refreshToken = TryDecrypt(stored)
            ?? throw new YouTubePublishException("drive-reconnect",
                "The saved Google Drive access can't be read on this server. Connect Drive again.");
        try
        {
            return (await oauth.RefreshAsync(refreshToken, ct).ConfigureAwait(false)).AccessToken;
        }
        catch (YouTubePublishException ex) when (ex.Code == "youtube-reconnect")
        {
            stored.RevokedAt = clock.GetUtcNow().UtcDateTime;
            await repository.UpsertAsync(stored, CancellationToken.None).ConfigureAwait(false);
            throw new YouTubePublishException("drive-reconnect", "Google Drive access has expired or was removed. Connect Drive again.");
        }
    }

    /// <summary>The target folder's id on its Drive, made if it isn't there yet, and remembered.</summary>
    public async Task<string> EnsureFolderAsync(DriveTarget target, string accessToken, CancellationToken ct)
    {
        var stored = await repository.GetAsync(target.UserId, target.DriveChannelId, ct).ConfigureAwait(false)
            ?? throw new YouTubePublishException("drive-not-connected", "Google Drive isn't connected any more. Connect it again.");

        var folderName = target.FolderName;
        var known = stored.Folders.FirstOrDefault(f => string.Equals(f.Name, folderName, StringComparison.Ordinal));
        var id = await drive.EnsureFolderAsync(accessToken, folderName, known?.FolderId, ct).ConfigureAwait(false);
        if (known?.FolderId != id)
        {
            stored.Folders.RemoveAll(f => string.Equals(f.Name, folderName, StringComparison.Ordinal));
            stored.Folders.Add(new GoogleDriveFolder { Name = folderName, FolderId = id });
            if (stored.Folders.Count > MaxRememberedFolders) stored.Folders.RemoveRange(0, stored.Folders.Count - MaxRememberedFolders);
            await repository.UpsertAsync(stored, ct).ConfigureAwait(false);
        }
        return id;
    }

    /// <summary>
    /// The folder a channel's videos go to when nobody chose one: the channel's name plus
    /// "Shorts", cut down to what a folder name may hold. The default folder without one.
    /// </summary>
    public static string AutoFolderName(string? channelTitle)
    {
        if (string.IsNullOrWhiteSpace(channelTitle)) return GoogleDriveConnection.DefaultFolderName;
        var cleaned = Whitespace().Replace(FolderUnsafe().Replace(channelTitle, " "), " ").Trim();
        const string suffix = " Shorts";
        if (cleaned.Length > 100 - suffix.Length) cleaned = cleaned[..(100 - suffix.Length)].TrimEnd();
        var name = cleaned + suffix;
        return GoogleDriveClient.IsValidFolderName(name) ? name : GoogleDriveConnection.DefaultFolderName;
    }

    private sealed record ChannelRef(string Id, string Title);

    /// <summary>The caller's connected channel with this id; null for none asked. Unknown ids are refused.</summary>
    private async Task<ChannelRef?> OwnedChannelAsync(string userId, string? channelId, CancellationToken ct)
    {
        if (string.IsNullOrEmpty(channelId)) return null;
        var connection = await channels.GetAsync(userId, channelId, ct).ConfigureAwait(false)
            ?? throw new YouTubePublishException("youtube-channel-not-connected", "That channel isn't connected. Connect it first.");
        return new ChannelRef(connection.ChannelId, connection.ChannelTitle);
    }

    /// <summary>
    /// For disconnecting: a channel's own Drive can be removed even after the channel itself
    /// was, so a leftover isn't stuck. Only the caller's own stored Drives are ever touched.
    /// </summary>
    private async Task<string?> OwnedChannelOrIdAsync(string userId, string? channelId, CancellationToken ct)
    {
        if (string.IsNullOrEmpty(channelId)) return null;
        if (await channels.GetAsync(userId, channelId, ct).ConfigureAwait(false) is { } connection) return connection.ChannelId;
        return (await repository.GetAsync(userId, channelId, ct).ConfigureAwait(false))?.ChannelId
            ?? throw new YouTubePublishException("youtube-channel-not-connected", "That channel isn't connected.");
    }

    private async Task<GoogleDriveStatus> DescribeAsync(string userId, ChannelRef? channel, CancellationToken ct)
    {
        var personal = await repository.GetAsync(userId, null, ct).ConfigureAwait(false);
        if (channel is null) return Describe(personal, null, personal);
        var own = await repository.GetAsync(userId, channel.Id, ct).ConfigureAwait(false);
        return Describe(own, channel, personal);
    }

    /// <summary>A channel's own Drive if it has one, else the personal Drive in that channel's folder.</summary>
    private static GoogleDriveStatus Describe(GoogleDriveConnection? own, ChannelRef? channel, GoogleDriveConnection? personal)
    {
        if (channel is null)
        {
            var p = own ?? personal;
            return p is null
                ? new GoogleDriveStatus(false, null, null, GoogleDriveConnection.DefaultFolderName, null, false)
                : new GoogleDriveStatus(true, p.AccountName, p.AccountEmail, p.FolderName, p.ConnectedAt, p.RevokedAt is not null);
        }

        if (own is not null)
            return new GoogleDriveStatus(true, own.AccountName, own.AccountEmail, own.FolderName, own.ConnectedAt,
                own.RevokedAt is not null, channel.Id, channel.Title, OwnDrive: true);

        var folder = personal?.ChannelFolders
            .FirstOrDefault(f => string.Equals(f.ChannelId, channel.Id, StringComparison.Ordinal))?.FolderName
            ?? AutoFolderName(channel.Title);
        return personal is null
            ? new GoogleDriveStatus(false, null, null, folder, null, false, channel.Id, channel.Title)
            : new GoogleDriveStatus(true, personal.AccountName, personal.AccountEmail, folder, personal.ConnectedAt,
                personal.RevokedAt is not null, channel.Id, channel.Title);
    }

    private string? TryDecrypt(GoogleDriveConnection stored)
    {
        try
        {
            return protector.Value.Decrypt(stored.RefreshTokenCipher);
        }
        catch (CryptographicException ex)
        {
            logger.LogError(ex,
                "The saved Google Drive token for user {UserId} could not be decrypted. " +
                "If Encryption:DataKey was rotated, add the previous key to Encryption:PreviousDataKeys, or reconnect Drive.",
                stored.UserId);
            return null;
        }
    }

    /// <summary>Anything a folder name may not hold (see <see cref="GoogleDriveClient.IsValidFolderName"/>).</summary>
    [GeneratedRegex(@"[^\p{L}\p{M}\p{N} _.\-()&]")]
    private static partial Regex FolderUnsafe();

    [GeneratedRegex(@"\s+")]
    private static partial Regex Whitespace();
}
