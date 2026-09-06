using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Options;
using AnimStudio.Domain.Ai;

namespace AnimStudio.Application.Ai;

/// <summary>
/// Checks an administrator's settings change before it is stored.
/// </summary>
/// <remarks>
/// <para>
/// Everything here is a trust boundary, because being an administrator is permission to
/// configure this application - not permission to make it fetch arbitrary URLs, run
/// arbitrary programs, or write arbitrary text into a place that ends up in a process
/// argument. The values are checked against allowlists rather than filtered, and a value
/// that does not pass is refused with a message that names the field.
/// </para>
/// <para>
/// The base URL is the sharpest edge: it is the address the server itself will connect to,
/// so it goes through the same <see cref="AiEndpointGuard"/> the outbound call uses, with
/// the host allowlist read from configuration. The allowlist is deliberately NOT editable
/// through the API - a control that can be widened by the thing it constrains is not a
/// control - so widening it stays a change to the server's configuration.
/// </para>
/// </remarks>
public static class AiSettingsValidator
{
    public const int MaxModelLength = 200;
    public const int MaxBaseUrlLength = 400;
    public const int MinTimeoutSeconds = 5;
    public const int MaxTimeoutSeconds = 1800;
    public const int MaxRequestLimit = 1_000_000;

    /// <summary>A fallback order longer than this is a configuration mistake, not a plan.</summary>
    public const int MaxChainLength = 12;

    /// <summary>
    /// What a model name may contain. Wide enough for the real ones -
    /// <c>@cf/black-forest-labs/flux-1-schnell</c>,
    /// <c>meta-llama/Llama-3.3-70B-Instruct-Turbo-Free</c>, <c>gpt-4o-mini:free</c> - and
    /// narrow enough that the value can never become a second argument, a path segment
    /// outside its folder, or a shell metacharacter.
    /// </summary>
    private static bool IsModelCharacter(char c) =>
        c is >= 'a' and <= 'z' or >= 'A' and <= 'Z' or >= '0' and <= '9'
            or '.' or '-' or '_' or '/' or ':' or '@' or '+';

    public static AiProviderSettings ValidateProvider(
        AiProviderId provider,
        AiProviderSettingsRequest request,
        AiOptions options,
        string? actorUserId,
        DateTime nowUtc)
    {
        if (provider.IsEmpty)
            throw new AiSettingsException("provider-invalid", "That is not a valid provider id.");

        var descriptor = KnownAiProviders.Find(provider.Value);
        var configured = options.ProviderFor(provider);

        if (descriptor is null && configured is null)
        {
            throw new AiSettingsException("provider-unknown",
                "This build has no provider with that id. Add it to Ai:Providers with a Family " +
                "first, so the server knows which wire format it speaks.");
        }

        return new AiProviderSettings
        {
            ProviderId = provider.Value,
            Enabled = request.Enabled,
            Model = Model(request.Model),
            BaseUrl = BaseUrl(request.BaseUrl, provider, descriptor, configured, options),
            DailyRequestLimit = Limit(request.DailyRequestLimit, "daily"),
            MonthlyRequestLimit = Limit(request.MonthlyRequestLimit, "monthly"),
            TimeoutSeconds = Timeout(request.TimeoutSeconds),
            SupportsJsonMode = request.SupportsJsonMode,
            UpdatedByUserId = actorUserId,
            UpdatedAt = nowUtc
        };
    }

    /// <summary>
    /// Checks a fallback order. Duplicates are removed rather than refused - the same
    /// provider twice is a slip with an obvious intended meaning - but an id this build
    /// cannot serve for that capability is refused, because silently dropping it would
    /// leave the operator believing in a fallback that does not exist.
    /// </summary>
    public static List<string> ValidateChain(
        AiCapability capability, IReadOnlyList<string> providerIds, AiOptions options)
    {
        if (providerIds.Count > MaxChainLength)
        {
            throw new AiSettingsException("chain-too-long",
                $"A fallback order may name at most {MaxChainLength} providers.");
        }

        var result = new List<string>();

        foreach (var raw in providerIds)
        {
            if (!AiProviderId.TryParse(raw, out var id))
                throw new AiSettingsException("provider-invalid", "That is not a valid provider id.");

            if (result.Contains(id.Value, StringComparer.Ordinal)) continue;

            if (CapabilityOf(id, options) != capability)
            {
                throw new AiSettingsException("provider-wrong-capability",
                    $"'{id.Value}' cannot be used for {capability}.");
            }

            result.Add(id.Value);
        }

        return result;
    }

    /// <summary>
    /// What a provider id can do: from the catalogue, or from the <c>Family</c> an operator
    /// named in configuration for a service this build has never heard of.
    /// </summary>
    public static AiCapability? CapabilityOf(AiProviderId id, AiOptions options)
    {
        var descriptor = KnownAiProviders.Find(id.Value);
        if (descriptor is not null) return descriptor.Capability;

        var configured = options.ProviderFor(id);

        return Enum.TryParse<AiProviderFamily>(configured?.Family, ignoreCase: true, out var family)
            ? KnownAiProviders.CapabilityOf(family)
            : null;
    }

    private static string? Model(string? value)
    {
        var trimmed = value?.Trim();
        if (string.IsNullOrEmpty(trimmed)) return null;

        if (trimmed.Length > MaxModelLength)
            throw new AiSettingsException("model-too-long", "That model name is too long.");

        if (!trimmed.All(IsModelCharacter))
        {
            throw new AiSettingsException("model-invalid",
                "A model name may only contain letters, digits and . - _ / : @ +");
        }

        // The slash is permitted because real model names contain one, which means the
        // character rule alone would accept "../../etc/passwd". For a local recognizer the
        // model names a file inside a configured folder, and although the resolver refuses
        // an escape as well, a value with no legitimate reason to contain ".." has no
        // business being stored in the first place.
        if (trimmed.Split('/').Any(segment => segment is "." or "..") || trimmed[0] == '/')
        {
            throw new AiSettingsException("model-invalid",
                "A model name cannot be a path. Use the name the provider publishes.");
        }

        return trimmed;
    }

    private static string? BaseUrl(
        string? value,
        AiProviderId provider,
        AiProviderDescriptor? descriptor,
        AiProviderOptions? configured,
        AiOptions options)
    {
        var trimmed = value?.Trim();
        if (string.IsNullOrEmpty(trimmed)) return null;

        if (trimmed.Length > MaxBaseUrlLength)
            throw new AiSettingsException("base-url-too-long", "That address is too long.");

        // Whether this provider is allowed to be on a private address is settled by
        // configuration and the catalogue, not by the request - otherwise "it is local"
        // would be a one-field bypass of the allowlist.
        var isLocal = configured?.IsLocal ?? descriptor?.RunsLocally ?? false;

        var verdict = AiEndpointGuard.Check(trimmed, isLocal, options.HostAllowlist);

        if (verdict.Allowed) return trimmed;

        throw new AiSettingsException("base-url-refused", Explain(verdict.Rejection, provider, isLocal));
    }

    private static string Explain(EndpointRejection rejection, AiProviderId provider, bool isLocal) =>
        rejection switch
        {
            EndpointRejection.NotAbsolute =>
                "Enter a full address, starting with https:// (or http:// for a provider on this machine).",

            EndpointRejection.SchemeNotAllowed => isLocal
                ? "Use http:// or https://."
                : "A provider outside this machine has to be reached over https://.",

            EndpointRejection.CredentialsInUrl =>
                "Remove the username and password from the address. Keys belong in the key field, " +
                "where they are stored encrypted.",

            EndpointRejection.HostNotAllowed =>
                "That host is not on this server's outbound allowlist. Add it to Ai:HostAllowlist in " +
                "the server's configuration first - the allowlist is what stops this application " +
                "being used to reach addresses on its behalf, so it is deliberately not editable " +
                "from here.",

            EndpointRejection.PrivateAddress =>
                $"That address is on a private network, and '{provider.Value}' is not marked as " +
                "running on this machine. Set IsLocal for it in the server's configuration if it does.",

            EndpointRejection.LocalProviderIsNotLocal =>
                $"'{provider.Value}' is configured as running on this machine, so its address has to " +
                "be localhost or a private one.",

            EndpointRejection.NonDefaultPort =>
                "A hosted service is reached on the standard port for its scheme; remove the port.",

            _ => "That address cannot be used."
        };

    private static int? Limit(int? value, string period)
    {
        if (value is null) return null;

        if (value < 1 || value > MaxRequestLimit)
        {
            throw new AiSettingsException($"{period}-limit-invalid",
                $"A {period} limit has to be between 1 and {MaxRequestLimit:N0}, or empty for no limit.");
        }

        return value;
    }

    private static int? Timeout(int? value)
    {
        if (value is null) return null;

        if (value < MinTimeoutSeconds || value > MaxTimeoutSeconds)
        {
            throw new AiSettingsException("timeout-invalid",
                $"A timeout has to be between {MinTimeoutSeconds} and {MaxTimeoutSeconds} seconds.");
        }

        return value;
    }
}
