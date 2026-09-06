using AnimStudio.Application.Abstractions.Ai;
using AnimStudio.Application.Ai;
using AnimStudio.Application.Options;
using AnimStudio.Domain.Ai;
using Microsoft.Extensions.Logging.Abstractions;

namespace AnimStudio.Application.Tests.Ai;

public class AiProviderRegistryTests
{
    private static readonly DateTimeOffset Start = new(2026, 9, 5, 12, 0, 0, TimeSpan.Zero);

    private static (AiProviderRegistry Registry, ManualTimeProvider Clock, StaticOptionsMonitor<AiOptions> Options)
        Build(AiOptions options, params IAiProvider[] providers)
    {
        var monitor = new StaticOptionsMonitor<AiOptions>(options);
        var clock = new ManualTimeProvider(Start);

        var registry = new AiProviderRegistry(
            providers, monitor, clock, NullLogger<AiProviderRegistry>.Instance);

        return (registry, clock, monitor);
    }

    [Fact]
    public void With_no_configuration_at_all_every_capability_is_unavailable()
    {
        // The application must run with no AI. An empty Ai section is the normal state,
        // not a misconfiguration.
        var (registry, _, _) = Build(new AiOptions());

        Assert.Empty(registry.TextChain());
        Assert.Empty(registry.ImageChain());
        Assert.Empty(registry.SpeechChain());
        Assert.Empty(registry.TranscriptionChain());

        foreach (var status in registry.DescribeAll())
        {
            Assert.False(status.Available);
            Assert.Equal(AiUnavailableReason.NotConfigured, status.Reason);
        }
    }

    [Fact]
    public void The_chain_follows_the_configured_order_not_the_registration_order()
    {
        var options = AiOptionsBuilder.WithChain(AiCapability.Text, "second", "first");

        var (registry, _, _) = Build(options,
            new FakeTextProvider("first"), new FakeTextProvider("second"));

        Assert.Equal(["second", "first"], registry.TextChain().Select(p => p.Id.Value));
    }

    [Fact]
    public void A_provider_named_in_the_chain_but_not_registered_is_skipped()
    {
        var options = AiOptionsBuilder.WithChain(AiCapability.Text, "missing", "present");
        var (registry, _, _) = Build(options, new FakeTextProvider("present"));

        Assert.Equal(["present"], registry.TextChain().Select(p => p.Id.Value));
    }

    [Fact]
    public void An_unconfigured_provider_is_skipped_but_still_listed_in_the_reported_chain()
    {
        var options = AiOptionsBuilder.WithChain(AiCapability.Text, "keyless", "ready");

        var (registry, _, _) = Build(options,
            new FakeTextProvider("keyless", configured: false), new FakeTextProvider("ready"));

        Assert.Equal(["ready"], registry.TextChain().Select(p => p.Id.Value));

        // The UI shows what WOULD be tried, so a user can see the provider they configured
        // is present but not usable.
        var status = registry.Describe(AiCapability.Text);
        Assert.Equal(["keyless", "ready"], status.Chain);
        Assert.Equal("ready", status.ProviderId);
        Assert.True(status.Available);
    }

    [Fact]
    public void A_disabled_provider_is_skipped_without_being_unregistered()
    {
        var options = AiOptionsBuilder.WithChain(AiCapability.Text, "off");
        options.Providers["off"].Enabled = false;

        var (registry, _, _) = Build(options, new FakeTextProvider("off"));

        Assert.Empty(registry.TextChain());
        Assert.Equal(AiUnavailableReason.Disabled, registry.Describe(AiCapability.Text).Reason);
    }

    [Fact]
    public void A_duplicate_entry_is_only_tried_once()
    {
        var options = AiOptionsBuilder.WithChain(AiCapability.Text, "same", "same");
        var (registry, _, _) = Build(options, new FakeTextProvider("same"));

        Assert.Single(registry.TextChain());
    }

    [Fact]
    public void A_malformed_id_in_the_chain_does_not_break_the_rest_of_it()
    {
        var options = new AiOptions();
        options.Chains["Text"] = ["not a valid id", "good"];
        options.Providers["good"] = new AiProviderOptions();

        var (registry, _, _) = Build(options, new FakeTextProvider("good"));

        Assert.Equal(["good"], registry.TextChain().Select(p => p.Id.Value));
    }

    [Fact]
    public void A_provider_only_serves_the_capability_it_declares()
    {
        // The same id may be configured for two capabilities; an image chain must not pick
        // up a text provider that happens to share the name.
        var options = AiOptionsBuilder.WithChain(AiCapability.Image, "shared");
        var (registry, _, _) = Build(options, new FakeTextProvider("shared"));

        Assert.Empty(registry.ImageChain());
    }

    [Fact]
    public void Failures_below_the_threshold_leave_the_provider_in_the_chain()
    {
        var options = AiOptionsBuilder.WithChain(AiCapability.Text, "flaky");
        options.Circuit.FailureThreshold = 3;

        var (registry, _, _) = Build(options, new FakeTextProvider("flaky"));
        var id = AiProviderId.Parse("flaky");

        registry.ReportOutcome(id, success: false);
        registry.ReportOutcome(id, success: false);

        Assert.Single(registry.TextChain());
    }

    [Fact]
    public void Consecutive_failures_open_the_circuit_and_the_cooldown_closes_it()
    {
        var options = AiOptionsBuilder.WithChain(AiCapability.Text, "flaky", "backup");
        options.Circuit.FailureThreshold = 2;
        options.Circuit.CooldownSeconds = 60;

        var (registry, clock, _) = Build(options,
            new FakeTextProvider("flaky"), new FakeTextProvider("backup"));

        var id = AiProviderId.Parse("flaky");
        registry.ReportOutcome(id, success: false);
        registry.ReportOutcome(id, success: false);

        // A rate-limited free tier costs one skipped provider, not a failed render.
        Assert.Equal(["backup"], registry.TextChain().Select(p => p.Id.Value));
        Assert.Equal("backup", registry.Describe(AiCapability.Text).ProviderId);

        clock.Advance(TimeSpan.FromSeconds(59));
        Assert.Equal(["backup"], registry.TextChain().Select(p => p.Id.Value));

        clock.Advance(TimeSpan.FromSeconds(2));
        Assert.Equal(["flaky", "backup"], registry.TextChain().Select(p => p.Id.Value));
    }

    [Fact]
    public void A_success_resets_the_failure_count()
    {
        var options = AiOptionsBuilder.WithChain(AiCapability.Text, "flaky");
        options.Circuit.FailureThreshold = 2;

        var (registry, _, _) = Build(options, new FakeTextProvider("flaky"));
        var id = AiProviderId.Parse("flaky");

        registry.ReportOutcome(id, success: false);
        registry.ReportOutcome(id, success: true);
        registry.ReportOutcome(id, success: false);

        // Two failures separated by a success are not two CONSECUTIVE failures.
        Assert.Single(registry.TextChain());
    }

    [Fact]
    public void Describe_reports_the_circuit_as_the_reason_when_every_provider_is_broken()
    {
        var options = AiOptionsBuilder.WithChain(AiCapability.Image, "broken");
        options.Circuit.FailureThreshold = 1;

        var (registry, _, _) = Build(options, new FakeImageProvider("broken"));
        registry.ReportOutcome(AiProviderId.Parse("broken"), success: false);

        var status = registry.Describe(AiCapability.Image);
        Assert.False(status.Available);
        Assert.Equal(AiUnavailableReason.CircuitOpen, status.Reason);
    }

    [Fact]
    public void Describe_reports_the_selected_provider_and_its_model()
    {
        var options = AiOptionsBuilder.WithChain(AiCapability.Text, "groq");
        options.Providers["groq"].Model = "llama-3.3-70b-versatile";

        var (registry, _, _) = Build(options, new FakeTextProvider("groq"));

        var status = registry.Describe(AiCapability.Text);
        Assert.True(status.Available);
        Assert.Equal("groq", status.ProviderId);
        Assert.Equal("llama-3.3-70b-versatile", status.Model);
    }

    [Fact]
    public void Reporting_an_outcome_for_an_empty_id_is_ignored()
    {
        var (registry, _, _) = Build(new AiOptions());

        registry.ReportOutcome(default, success: false);

        Assert.Empty(registry.TextChain());
    }
}
