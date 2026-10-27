using AnimStudio.Api.Common;
using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Admin;
using AnimStudio.Application.Ai;
using AnimStudio.Application.Publishing;
using AnimStudio.Application.Security;
using AnimStudio.Domain.Publishing;
using AnimStudio.Infrastructure.Publishing;
using Microsoft.AspNetCore.Mvc;

namespace AnimStudio.Api.Controllers;

/// <summary>
/// Sets up a YouTube live stream without visiting YouTube Studio: the AI writes a title,
/// description and tags from a few words about the stream, and the broadcast and its stream
/// key are created on a connected channel. Go Live then streams to the broadcast by id - the
/// key is looked up on YouTube at that moment and never sent to the browser.
/// </summary>
[ApiController]
[Route("api/youtube/live")]
public sealed class YouTubeLiveController(
    YouTubeConnectionStore connections,
    YouTubeLiveClient live,
    IAiSettingsRepository settingsRepo,
    IAiExecutor ai,
    IAiProviderRegistry aiProviders,
    IPromptLibrary prompts,
    ICurrentUser currentUser,
    AdminAuditService audit,
    TimeProvider clock,
    ILogger<YouTubeLiveController> logger) : ControllerBase
{
    /// <summary>Shared with nothing else: writing live details is rare and short.</summary>
    private static readonly SemaphoreSlim SuggestSlots = new(2, 2);

    /// <summary>Each broadcast costs about 200 quota units of the app's daily 10,000; a few at once is plenty.</summary>
    private static readonly SemaphoreSlim CreateSlots = new(3, 3);

    /// <summary>The longest stream topic sent to the model.</summary>
    private const int MaxTopicChars = 300;

    /// <summary>
    /// What the live setup panel opens with for a channel: the brand channel's publishing
    /// defaults (visibility, category, tags, footer) and the broadcasts not yet streamed to.
    /// </summary>
    [HttpGet("channels/{channelId}")]
    public async Task<ActionResult<ApiResponse<YouTubeLiveSetupResponse>>> Setup(string channelId, CancellationToken ct)
    {
        if (await OwnedConnectionAsync(channelId, ct) is not { } connection)
            return NotConnected<YouTubeLiveSetupResponse>();

        var defaults = await DefaultsForAsync(channelId, ct);
        IReadOnlyList<YouTubeLiveBroadcastResponse> upcoming = [];
        string? warning = null;
        if (YouTubeOAuthClient.AllowsComments(connection.Scopes))
        {
            try
            {
                var token = await connections.GetAccessTokenAsync(currentUser.UserId, channelId, ct);
                upcoming = [.. (await live.ListUpcomingAsync(token, ct)).Select(Describe)];
            }
            catch (YouTubePublishException ex)
            {
                // The panel still works without the list; say why it's empty.
                warning = ex.Message;
            }
        }

        return Ok(ApiResponse<YouTubeLiveSetupResponse>.Ok(new YouTubeLiveSetupResponse(
            YouTubeOAuthClient.AllowsComments(connection.Scopes),
            defaults?.Privacy ?? "public",
            defaults?.CategoryId ?? "24",
            defaults?.MadeForKids ?? false,
            defaults?.Tags ?? [],
            defaults?.DescriptionFooter,
            upcoming,
            warning)));
    }

    /// <summary>
    /// A title, description and tags for a stream, from the creator's topic and notes. Saves
    /// nothing: the panel fills its fields, and the user reviews them before creating anything.
    /// </summary>
    [HttpPost("suggest")]
    public async Task<ActionResult<ApiResponse<YouTubeSuggestResponse>>> Suggest([FromBody] YouTubeLiveSuggestRequest? request, CancellationToken ct)
    {
        if (request?.Topic is { Length: > MaxTopicChars * 4 }
            || request?.Brief is { Length: > YouTubeMetadataSuggester.MaxBriefChars * 4 }
            || request?.Tone is { } tone && !YouTubeMetadataSuggester.Tones.ContainsKey(tone))
            return SuggestFailure(StatusCodes.Status400BadRequest, "suggest-input-invalid",
                $"Keep the topic under {MaxTopicChars} characters and the notes under {YouTubeMetadataSuggester.MaxBriefChars}, and pick a tone from the list.");

        var topic = YouTubeMetadataSuggester.CleanBrief(request?.Topic);
        if (topic.Length > MaxTopicChars) topic = topic[..MaxTopicChars];
        var brief = YouTubeMetadataSuggester.CleanBrief(request?.Brief);
        if (topic.Length == 0)
            return SuggestFailure(StatusCodes.Status400BadRequest, "suggest-nothing-to-go-on",
                "Say in a few words what the stream is about, then ask again.");

        string? engine = null;
        if (!string.IsNullOrWhiteSpace(request?.ProviderId))
        {
            engine = aiProviders.UsableTextProviders()
                .Select(p => p.Id.Value)
                .FirstOrDefault(id => string.Equals(id, request.ProviderId, StringComparison.OrdinalIgnoreCase));
            if (engine is null)
                return SuggestFailure(StatusCodes.Status400BadRequest, "suggest-engine-unavailable",
                    "That AI engine isn't turned on or isn't ready. Pick another, or choose Auto.");
        }

        var language = request?.Language is { } lang && YouTubeMetadataSuggester.Languages.Contains(lang) ? lang : "en";
        var style = request?.Kind is { } kind && LiveKinds.TryGetValue(kind, out var kindText) ? kindText : LiveKinds["camera"];
        var summary = brief.Length > 0 ? $"Topic: {topic}\nCreator's notes: {brief}" : $"Topic: {topic}";

        RenderedPrompt rendered;
        try
        {
            rendered = await prompts.RenderAsync(BuiltInPrompts.LiveMetadata, new Dictionary<string, string?>
            {
                ["summary"] = summary,
                ["style"] = style,
                ["tone"] = YouTubeMetadataSuggester.ToneText(request?.Tone),
                ["language"] = language,
            }, ct);
        }
        catch (PromptTemplateException ex)
        {
            logger.LogWarning("Live metadata prompt could not be rendered: {Code}", ex.Code);
            return SuggestFailure(StatusCodes.Status503ServiceUnavailable, "suggest-unavailable",
                "The live-metadata prompt is turned off or broken. Check it under Admin > AI prompts.");
        }

        if (!await SuggestSlots.WaitAsync(TimeSpan.FromSeconds(30), ct))
            return SuggestFailure(StatusCodes.Status429TooManyRequests, "youtube-busy",
                "Other suggestions are being written right now. Try again in a minute.");
        AiOutcome<AiTextResult> outcome;
        try
        {
            outcome = await ai.TextAsync(new AiTextRequest
            {
                SystemPrompt = rendered.SystemPrompt,
                Prompt = rendered.Body,
                JsonSchema = rendered.OutputJsonSchema,
                PromptTemplateKey = rendered.TemplateKey,
                PromptTemplateVersion = rendered.Version,
                MaxOutputTokens = 4000,
                Temperature = 0.7,
                BypassCache = request?.Fresh == true,
                ProviderId = engine
            }, new AiCallContext(null, currentUser.UserId), ct);
        }
        finally
        {
            SuggestSlots.Release();
        }

        if (outcome.Kind == AiOutcomeKind.Unavailable)
            return SuggestFailure(StatusCodes.Status503ServiceUnavailable, "suggest-unavailable", engine is null
                ? "No AI text model is turned on. Enable one under Admin > AI providers, or fill in the details by hand."
                : "That AI engine isn't available just now (off, out of quota, or paused after errors). Try Auto or another engine.");
        if (!outcome.IsSuccess)
            return SuggestFailure(StatusCodes.Status502BadGateway, outcome.ErrorCode ?? "suggest-failed",
                "The AI model couldn't write suggestions just now. Try again in a minute.");

        // The model's answer is untrusted: it only fills panel fields, which creation validates again.
        var suggestion = YouTubeMetadataSuggester.Parse(outcome.Value!.Text);
        if (suggestion is null)
            return SuggestFailure(StatusCodes.Status502BadGateway, "suggest-empty", "The AI model's answer wasn't usable. Try again.");

        var footer = YouTubePublishValidator.IsYouTubeChannelId(request?.ChannelId)
            ? (await DefaultsForAsync(request!.ChannelId!, ct))?.DescriptionFooter
            : null;

        logger.LogInformation("Suggested YouTube live details for user {UserId} with {Provider}.",
            currentUser.UserId, outcome.Value.Provenance.ProviderId);
        return Ok(ApiResponse<YouTubeSuggestResponse>.Ok(new YouTubeSuggestResponse(
            suggestion.Title,
            YouTubeMetadataSuggester.ComposeDescription(suggestion.Description, null, footer),
            suggestion.Tags,
            outcome.Value.Provenance.ProviderId,
            suggestion.TitleOptions,
            [.. suggestion.DescriptionOptions.Select(d => YouTubeMetadataSuggester.ComposeDescription(d, null, footer))],
            suggestion.TagIdeas)));
    }

    /// <summary>
    /// Creates the broadcast and its stream on the channel, with auto-start and auto-stop on,
    /// so it goes live when Go Live starts sending and ends when it stops. Returns the
    /// broadcast's id and links - never the stream key.
    /// </summary>
    [HttpPost("broadcasts")]
    public async Task<ActionResult<ApiResponse<YouTubeLiveBroadcastResponse>>> Create(
        [FromBody] YouTubeLiveCreateRequest? request, CancellationToken ct)
    {
        if (!currentUser.IsAuthenticated)
        {
            const string msg = "Creating YouTube live broadcasts is sensitive and requires an authenticated member account. Anonymous visitors cannot create live broadcasts.";
            return StatusCode(403, ApiResponse<YouTubeLiveBroadcastResponse>.Fail(msg, new ApiError("auth-required", msg)));
        }

        if (request is null || !YouTubePublishValidator.IsYouTubeChannelId(request.ChannelId))
            return BadRequest(ApiResponse<YouTubeLiveBroadcastResponse>.Fail("Choose a channel to go live on.",
                new ApiError("channel-missing", "Choose a channel to go live on.", Field: "channelId")));

        if (await OwnedConnectionAsync(request.ChannelId!, ct) is not { } connection)
            return NotConnected<YouTubeLiveBroadcastResponse>();
        if (!YouTubeOAuthClient.AllowsComments(connection.Scopes))
            return Failure<YouTubeLiveBroadcastResponse>(new YouTubePublishException("youtube-live-scope",
                "This channel was connected before live-stream permission was asked for. Reconnect it under YouTube, then try again."));

        var validation = YouTubePublishValidator.ValidateDetails(request.Metadata);
        if (!validation.IsValid)
        {
            var first = validation.Errors[0];
            return BadRequest(ApiResponse<YouTubeLiveBroadcastResponse>.Fail(first.Message,
                [.. validation.Errors.Select(e => new ApiError(e.Code, e.Message, Field: e.Field))]));
        }

        var now = clock.GetUtcNow().UtcDateTime;
        var start = request.ScheduledStartTime?.ToUniversalTime() ?? now.AddMinutes(1);
        if (start < now.AddMinutes(-1) || start > now.AddDays(365))
            return BadRequest(ApiResponse<YouTubeLiveBroadcastResponse>.Fail("Choose a start time within the next year.",
                new ApiError("start-time-invalid", "Choose a start time within the next year.", Field: "scheduledStartTime")));
        if (start < now.AddSeconds(30)) start = now.AddSeconds(30);

        if (!await CreateSlots.WaitAsync(TimeSpan.FromSeconds(20), ct))
            return Failure<YouTubeLiveBroadcastResponse>(new YouTubePublishException("youtube-busy",
                "Other broadcasts are being created right now. Try again in a minute."));
        try
        {
            var token = await connections.GetAccessTokenAsync(currentUser.UserId, request.ChannelId!, ct);
            var created = await live.CreateAsync(validation.Normalized!, start, request.EnableDvr, token, ct);

            await audit.RecordAsync("youtube.live.create", created.BroadcastId, null, request.ChannelId, RemoteAddress(), ct);
            logger.LogInformation("User {UserId} created YouTube broadcast {BroadcastId} on channel {ChannelId}",
                currentUser.UserId, created.BroadcastId, request.ChannelId);
            return Ok(ApiResponse<YouTubeLiveBroadcastResponse>.Ok(Describe(created)));
        }
        catch (YouTubePublishException ex)
        {
            logger.LogWarning("Creating a YouTube broadcast failed for user {UserId} on channel {ChannelId}: {Code}",
                currentUser.UserId, request.ChannelId, ex.Code);
            return Failure<YouTubeLiveBroadcastResponse>(ex);
        }
        finally
        {
            CreateSlots.Release();
        }
    }

    /// <summary>What kind of stream it is, for the prompt; an allowlist, so only this wording reaches it.</summary>
    private static readonly IReadOnlyDictionary<string, string> LiveKinds = new Dictionary<string, string>(StringComparer.Ordinal)
    {
        ["camera"] = "a live camera stream with the creator talking to viewers",
        ["playlist"] = "a live stream playing a programme of pre-made videos and music",
        ["music"] = "a 24/7 music live stream",
    };

    private async Task<YouTubeChannelConnection?> OwnedConnectionAsync(string channelId, CancellationToken ct)
    {
        if (!YouTubePublishValidator.IsYouTubeChannelId(channelId)) return null;
        // Looked up under the caller's own id: another user's channel simply isn't found.
        var connection = await connections.GetAsync(currentUser.UserId, channelId, ct);
        return connection is { RevokedAt: null } ? connection : null;
    }

    /// <summary>The publishing defaults of the brand channel that publishes to this YouTube channel, if any.</summary>
    private async Task<ChannelPublishSettings?> DefaultsForAsync(string youTubeChannelId, CancellationToken ct)
    {
        if (!currentUser.IsAdmin) return null;
        var settings = await settingsRepo.GetAsync(ct);
        if (settings is null) return null;
        if (settings.DefaultPublishing?.YouTubeChannelId == youTubeChannelId) return settings.DefaultPublishing;
        return settings.Channels.Select(c => c.Publishing).FirstOrDefault(p => p?.YouTubeChannelId == youTubeChannelId);
    }

    private static YouTubeLiveBroadcastResponse Describe(YouTubeLiveBroadcast b) =>
        new(b.BroadcastId, b.Title, b.Privacy, b.LifeCycleStatus, b.ScheduledStartTime, b.WatchUrl, b.StudioUrl);

    private ActionResult<ApiResponse<T>> NotConnected<T>() =>
        NotFound(ApiResponse<T>.Fail("That YouTube channel isn't connected. Connect it under YouTube first.",
            new ApiError("youtube-channel-not-connected", "That YouTube channel isn't connected.", Field: "channelId")));

    private ActionResult<ApiResponse<T>> Failure<T>(YouTubePublishException ex)
    {
        var body = ApiResponse<T>.Fail(ex.Message, new ApiError(ex.Code, ex.Message));
        return ex.Code switch
        {
            "youtube-not-configured" or "encryption-not-configured" => StatusCode(StatusCodes.Status503ServiceUnavailable, body),
            "youtube-unreachable" => StatusCode(StatusCodes.Status502BadGateway, body),
            "youtube-busy" => StatusCode(StatusCodes.Status429TooManyRequests, body),
            "youtube-live-scope" or "youtube-reconnect" or "youtube-live-not-enabled" => Conflict(body),
            _ => BadRequest(body)
        };
    }

    private ObjectResult SuggestFailure(int status, string code, string message) =>
        StatusCode(status, ApiResponse<YouTubeSuggestResponse>.Fail(message, new ApiError(code, message)));

    private string? RemoteAddress() => HttpContext.Connection.RemoteIpAddress?.ToString();
}

/// <param name="Kind"><c>camera</c>, <c>playlist</c> or <c>music</c>; anything else reads as camera.</param>
public sealed record YouTubeLiveSuggestRequest(string? Topic, string? Brief = null, string? Tone = null, string? Language = null,
    string? Kind = null, string? ChannelId = null, string? ProviderId = null, bool Fresh = false);

public sealed record YouTubeLiveCreateRequest(string? ChannelId, YouTubeVideoMetadata? Metadata,
    DateTime? ScheduledStartTime = null, bool EnableDvr = true);

public sealed record YouTubeLiveBroadcastResponse(string BroadcastId, string Title, string Privacy, string LifeCycleStatus,
    DateTime? ScheduledStartTime, string WatchUrl, string StudioUrl);

public sealed record YouTubeLiveSetupResponse(
    /// <summary>False when the channel was connected without the live-stream permission; reconnecting fixes it.</summary>
    bool CanManageLive,
    string Privacy,
    string CategoryId,
    bool MadeForKids,
    IReadOnlyList<string> Tags,
    string? DescriptionFooter,
    IReadOnlyList<YouTubeLiveBroadcastResponse> Upcoming,
    string? Warning);
