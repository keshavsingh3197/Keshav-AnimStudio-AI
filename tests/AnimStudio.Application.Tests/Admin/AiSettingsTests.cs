using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Ai;
using AnimStudio.Application.Options;
using AnimStudio.Domain.Ai;

namespace AnimStudio.Application.Tests.Admin;

/// <summary>
/// The rules that decide what an administrator may change. Every case here is a trust
/// boundary: being allowed to configure a provider is not being allowed to point the server
/// at an arbitrary address.
/// </summary>
public class AiSettingsValidatorTests
{
    private static AiOptions Options() => new()
    {
        HostAllowlist = ["api.groq.com"],
        Providers = new(StringComparer.OrdinalIgnoreCase)
        {
            ["groq"] = new AiProviderOptions { BaseUrl = "https://api.groq.com/openai/v1" },
            ["ollama"] = new AiProviderOptions { IsLocal = true, BaseUrl = "http://localhost:11434/v1" }
        }
    };

    private static AiProviderSettings Validate(
        string provider, AiProviderSettingsRequest request, AiOptions? options = null) =>
        AiSettingsValidator.ValidateProvider(
            AiProviderId.Parse(provider), request, options ?? Options(), "tester", DateTime.UnixEpoch);

    [Fact]
    public void A_provider_can_be_switched_on_with_a_model_and_a_ceiling()
    {
        var saved = Validate("groq", new AiProviderSettingsRequest(
            Enabled: true, Model: "llama-3.3-70b-versatile", DailyRequestLimit: 500));

        Assert.True(saved.Enabled);
        Assert.Equal("llama-3.3-70b-versatile", saved.Model);
        Assert.Equal(500, saved.DailyRequestLimit);
        Assert.Equal("tester", saved.UpdatedByUserId);
    }

    [Theory]
    [InlineData("@cf/black-forest-labs/flux-1-schnell")]
    [InlineData("meta-llama/Llama-3.3-70B-Instruct-Turbo-Free")]
    [InlineData("gpt-4o-mini:free")]
    public void The_model_names_real_services_actually_use_are_accepted(string model)
    {
        Assert.Equal(model, Validate("groq", new AiProviderSettingsRequest(true, Model: model)).Model);
    }

    [Theory]
    [InlineData("llama; rm -rf /")]
    [InlineData("model\nname")]
    [InlineData("../../etc/passwd")]
    public void A_model_name_outside_the_permitted_characters_is_refused(string model)
    {
        // A model name reaches a process argument and a filename for the local providers.
        // The dot-dot case is accepted by the character rule and stopped downstream, but it
        // has no business being stored either.
        var error = Assert.Throws<AiSettingsException>(() =>
            Validate("groq", new AiProviderSettingsRequest(true, Model: model)));

        Assert.Contains(error.Code, new[] { "model-invalid", "model-too-long" });
    }

    [Fact]
    public void A_base_url_on_a_host_nobody_allowed_is_refused()
    {
        var error = Assert.Throws<AiSettingsException>(() =>
            Validate("groq", new AiProviderSettingsRequest(true, BaseUrl: "https://evil.example/v1")));

        Assert.Equal("base-url-refused", error.Code);
        Assert.Contains("allowlist", error.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void The_cloud_metadata_address_is_refused_for_a_hosted_provider()
    {
        // The whole reason the endpoint guard exists: an admin endpoint that accepted this
        // would fetch instance credentials on a caller's behalf.
        var error = Assert.Throws<AiSettingsException>(() =>
            Validate("groq", new AiProviderSettingsRequest(true, BaseUrl: "http://169.254.169.254/")));

        Assert.Equal("base-url-refused", error.Code);
    }

    [Fact]
    public void A_local_provider_may_be_pointed_at_this_machine()
    {
        var saved = Validate("ollama", new AiProviderSettingsRequest(
            true, BaseUrl: "http://localhost:11434/v1"));

        Assert.Equal("http://localhost:11434/v1", saved.BaseUrl);
    }

    [Fact]
    public void A_provider_that_is_not_local_may_not_be_pointed_at_this_machine()
    {
        var error = Assert.Throws<AiSettingsException>(() =>
            Validate("groq", new AiProviderSettingsRequest(true, BaseUrl: "http://localhost:8080/v1")));

        Assert.Equal("base-url-refused", error.Code);
    }

    [Fact]
    public void A_key_smuggled_into_the_address_is_refused()
    {
        var error = Assert.Throws<AiSettingsException>(() =>
            Validate("groq", new AiProviderSettingsRequest(
                true, BaseUrl: "https://user:secret@api.groq.com/openai/v1")));

        Assert.Equal("base-url-refused", error.Code);

        // And the refusal never quotes the address back, which would put the credential in
        // a response body and a browser's network log.
        Assert.DoesNotContain("secret", error.Message, StringComparison.Ordinal);
    }

    [Fact]
    public void An_empty_daily_limit_means_no_ceiling_rather_than_an_error()
    {
        Assert.Null(Validate("groq", new AiProviderSettingsRequest(true)).DailyRequestLimit);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(2_000_000)]
    public void A_nonsensical_ceiling_is_refused(int limit)
    {
        Assert.Throws<AiSettingsException>(() =>
            Validate("groq", new AiProviderSettingsRequest(true, DailyRequestLimit: limit)));
    }

    [Theory]
    [InlineData(1)]
    [InlineData(5000)]
    public void A_timeout_outside_the_sane_range_is_refused(int seconds)
    {
        Assert.Throws<AiSettingsException>(() =>
            Validate("groq", new AiProviderSettingsRequest(true, TimeoutSeconds: seconds)));
    }

    [Fact]
    public void A_provider_this_build_cannot_construct_is_refused()
    {
        var error = Assert.Throws<AiSettingsException>(() =>
            Validate("some-service", new AiProviderSettingsRequest(true)));

        Assert.Equal("provider-unknown", error.Code);
    }
}

public class AiChainValidationTests
{
    private static readonly AiOptions Empty = new();

    [Fact]
    public void A_fallback_order_of_real_text_providers_is_accepted()
    {
        var chain = AiSettingsValidator.ValidateChain(
            AiCapability.Text, ["groq", "gemini", "ollama"], Empty);

        Assert.Equal(["groq", "gemini", "ollama"], chain);
    }

    [Fact]
    public void A_provider_that_cannot_do_the_job_is_refused_rather_than_dropped()
    {
        // Silently dropping it would leave the operator believing in a fallback that is
        // not there - which they would only discover when the first one rate-limits.
        var error = Assert.Throws<AiSettingsException>(() =>
            AiSettingsValidator.ValidateChain(AiCapability.Text, ["groq", "piper-local"], Empty));

        Assert.Equal("provider-wrong-capability", error.Code);
    }

    [Fact]
    public void The_same_provider_twice_is_a_slip_with_an_obvious_meaning()
    {
        var chain = AiSettingsValidator.ValidateChain(
            AiCapability.Image, ["pollinations", "pollinations"], Empty);

        Assert.Single(chain);
    }

    [Fact]
    public void An_absurdly_long_order_is_refused()
    {
        var many = Enumerable.Range(0, AiSettingsValidator.MaxChainLength + 1)
            .Select(i => $"provider-{i}")
            .ToList();

        Assert.Equal("chain-too-long",
            Assert.Throws<AiSettingsException>(() =>
                AiSettingsValidator.ValidateChain(AiCapability.Text, many, Empty)).Code);
    }

    [Fact]
    public void A_configured_service_this_build_has_never_heard_of_is_placed_by_its_family()
    {
        var options = new AiOptions
        {
            Providers = new(StringComparer.OrdinalIgnoreCase)
            {
                ["my-llm"] = new AiProviderOptions { Family = "OpenAiCompatibleText" }
            }
        };

        Assert.Equal(["my-llm"],
            AiSettingsValidator.ValidateChain(AiCapability.Text, ["my-llm"], options));

        Assert.Throws<AiSettingsException>(() =>
            AiSettingsValidator.ValidateChain(AiCapability.Speech, ["my-llm"], options));
    }
}

public class AiSettingsOverlayTests
{
    private static AiOptions Configured() => new()
    {
        Chains = new(StringComparer.OrdinalIgnoreCase) { ["Text"] = ["groq", "gemini"] },
        Providers = new(StringComparer.OrdinalIgnoreCase)
        {
            ["groq"] = new AiProviderOptions
            {
                Enabled = false,
                Model = "llama-3.3-70b-versatile",
                BaseUrl = "https://api.groq.com/openai/v1",
                DailyRequestLimit = 900,
                TimeoutSeconds = 120
            }
        }
    };

    [Fact]
    public void What_an_administrator_saved_wins_over_the_configuration_file()
    {
        var options = Configured();

        AiSettingsOverlay.Apply(options, new AiSettings
        {
            Providers = [new AiProviderSettings { ProviderId = "groq", Enabled = true }]
        });

        Assert.True(options.Providers["groq"].Enabled);
    }

    [Fact]
    public void A_field_left_empty_keeps_what_the_configuration_file_says()
    {
        var options = Configured();

        AiSettingsOverlay.Apply(options, new AiSettings
        {
            Providers = [new AiProviderSettings { ProviderId = "groq", Enabled = true, Model = null }]
        });

        Assert.Equal("llama-3.3-70b-versatile", options.Providers["groq"].Model);
        Assert.Equal(120, options.Providers["groq"].TimeoutSeconds);
    }

    [Fact]
    public void A_cleared_ceiling_removes_the_one_configuration_set()
    {
        // "No limit" is a real choice, so it has to be able to override a configured limit -
        // otherwise clearing the box in the console would appear to do nothing.
        var options = Configured();

        AiSettingsOverlay.Apply(options, new AiSettings
        {
            Providers = [new AiProviderSettings
            {
                ProviderId = "groq", Enabled = true, DailyRequestLimit = null
            }]
        });

        Assert.Null(options.Providers["groq"].DailyRequestLimit);
    }

    [Fact]
    public void Switching_on_a_provider_the_file_never_mentioned_gets_the_catalogue_defaults()
    {
        var options = Configured();

        AiSettingsOverlay.Apply(options, new AiSettings
        {
            Providers = [new AiProviderSettings { ProviderId = "pollinations", Enabled = true }]
        });

        var created = options.Providers["pollinations"];

        Assert.True(created.Enabled);
        Assert.Equal("https://image.pollinations.ai", created.BaseUrl);
        Assert.Equal("flux", created.Model);
    }

    [Fact]
    public void A_saved_fallback_order_replaces_the_configured_one()
    {
        var options = Configured();

        AiSettingsOverlay.Apply(options, new AiSettings
        {
            Chains = new(StringComparer.OrdinalIgnoreCase) { ["Text"] = ["ollama"] }
        });

        Assert.Equal(["ollama"], options.ChainFor(AiCapability.Text));
    }

    [Fact]
    public void An_empty_saved_order_does_not_blank_out_the_configured_one()
    {
        // Otherwise a stored document with an empty list would silently switch off every
        // capability it names.
        var options = Configured();

        AiSettingsOverlay.Apply(options, new AiSettings
        {
            Chains = new(StringComparer.OrdinalIgnoreCase) { ["Text"] = [] }
        });

        Assert.Equal(["groq", "gemini"], options.ChainFor(AiCapability.Text));
    }

    [Fact]
    public void Nothing_stored_leaves_the_configuration_exactly_as_it_was()
    {
        var options = Configured();

        AiSettingsOverlay.Apply(options, null);

        Assert.False(options.Providers["groq"].Enabled);
        Assert.Equal(900, options.Providers["groq"].DailyRequestLimit);
    }
}
