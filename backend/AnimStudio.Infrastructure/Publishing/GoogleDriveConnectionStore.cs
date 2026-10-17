using System.Security.Cryptography;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Domain.Publishing;
using KeshavSingh.Security;
using Microsoft.Extensions.Logging;

namespace AnimStudio.Infrastructure.Publishing;

/// <summary>What the UI may know about the connected Drive: never the token.</summary>
public sealed record GoogleDriveStatus(
    bool Connected,
    string? AccountName,
    string? AccountEmail,
    string FolderName,
    DateTime? ConnectedAt,
    bool NeedsReconnect);

/// <summary>
/// The Google Drive each user connects for "send to phone". The same OAuth client and
/// encrypted-at-rest refresh token as <see cref="YouTubeConnectionStore"/>, but its own
/// sign-in with only the <c>drive.file</c> scope, so the app sees nothing on the Drive it
/// didn't put there.
/// </summary>
public sealed class GoogleDriveConnectionStore(
    IGoogleDriveConnectionRepository repository,
    YouTubeOAuthClient oauth,
    YouTubeOAuthStateCache pending,
    GoogleDriveClient drive,
    Lazy<DataProtector> protector,
    TimeProvider clock,
    ILogger<GoogleDriveConnectionStore> logger)
{
    public async Task<GoogleDriveStatus> GetStatusAsync(string userId, CancellationToken ct) =>
        Describe(await repository.GetAsync(userId, ct).ConfigureAwait(false));

    /// <summary>Where to send the browser to approve Drive access.</summary>
    public string BeginConnect(string userId, string? returnPath)
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

        var (state, challenge) = pending.Create(userId, YouTubeConnectionStore.SafeReturnPath(returnPath), YouTubeOAuthStateCache.DriveKind);
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

        var existing = await repository.GetAsync(userId, ct).ConfigureAwait(false);
        // Another account's folders aren't on this Drive.
        var sameAccount = existing is not null && existing.AccountEmail is not null
            && string.Equals(existing.AccountEmail, account.Email, StringComparison.OrdinalIgnoreCase);
        var saved = new GoogleDriveConnection
        {
            Id = userId,
            UserId = userId,
            AccountName = account.Name,
            AccountEmail = account.Email,
            RefreshTokenCipher = protector.Value.Encrypt(tokens.RefreshToken),
            Scopes = tokens.Scope,
            FolderName = existing?.FolderName ?? GoogleDriveConnection.DefaultFolderName,
            Folders = sameAccount ? existing!.Folders : [],
            ConnectedAt = clock.GetUtcNow().UtcDateTime,
            RevokedAt = null
        };
        await repository.UpsertAsync(saved, ct).ConfigureAwait(false);
        logger.LogInformation("Google Drive {Action} for user {UserId}", existing is null ? "connected" : "reconnected", userId);

        return (Describe(saved), started.ReturnPath);
    }

    public async Task<bool> DisconnectAsync(string userId, CancellationToken ct)
    {
        var stored = await repository.GetAsync(userId, ct).ConfigureAwait(false);
        if (stored is null) return false;

        if (TryDecrypt(stored) is { } refreshToken)
            await oauth.RevokeAsync(refreshToken, ct).ConfigureAwait(false);

        var removed = await repository.DeleteAsync(userId, ct).ConfigureAwait(false);
        if (removed) logger.LogInformation("Google Drive disconnected for user {UserId}", userId);
        return removed;
    }

    /// <summary>Sets the folder later sends go to by default.</summary>
    public async Task<GoogleDriveStatus> SetFolderAsync(string userId, string? folderName, CancellationToken ct)
    {
        var name = folderName?.Trim();
        if (!GoogleDriveClient.IsValidFolderName(name))
            throw new YouTubePublishException("drive-folder-invalid", GoogleDriveClient.FolderNameRule);

        var stored = await repository.GetAsync(userId, ct).ConfigureAwait(false)
            ?? throw new YouTubePublishException("drive-not-connected", "Connect Google Drive first.");
        stored.FolderName = name!;
        await repository.UpsertAsync(stored, ct).ConfigureAwait(false);
        return Describe(stored);
    }

    /// <summary>A fresh access token. Marks the connection for reconnecting if Google refuses it.</summary>
    public async Task<string> GetAccessTokenAsync(string userId, CancellationToken ct)
    {
        var stored = await repository.GetAsync(userId, ct).ConfigureAwait(false)
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

    /// <summary>The folder's id on the Drive, made if it isn't there yet, and remembered.</summary>
    public async Task<string> EnsureFolderAsync(string userId, string folderName, string accessToken, CancellationToken ct)
    {
        var stored = await repository.GetAsync(userId, ct).ConfigureAwait(false)
            ?? throw new YouTubePublishException("drive-not-connected", "Google Drive isn't connected any more. Connect it again.");

        var known = stored.Folders.FirstOrDefault(f => string.Equals(f.Name, folderName, StringComparison.Ordinal));
        var id = await drive.EnsureFolderAsync(accessToken, folderName, known?.FolderId, ct).ConfigureAwait(false);
        if (known?.FolderId != id)
        {
            stored.Folders.RemoveAll(f => string.Equals(f.Name, folderName, StringComparison.Ordinal));
            stored.Folders.Add(new GoogleDriveFolder { Name = folderName, FolderId = id });
            // A bounded list: folder names typed once and never used again shouldn't pile up.
            if (stored.Folders.Count > 50) stored.Folders.RemoveRange(0, stored.Folders.Count - 50);
            await repository.UpsertAsync(stored, ct).ConfigureAwait(false);
        }
        return id;
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

    private static GoogleDriveStatus Describe(GoogleDriveConnection? c) => c is null
        ? new GoogleDriveStatus(false, null, null, GoogleDriveConnection.DefaultFolderName, null, false)
        : new GoogleDriveStatus(true, c.AccountName, c.AccountEmail, c.FolderName, c.ConnectedAt, c.RevokedAt is not null);
}
