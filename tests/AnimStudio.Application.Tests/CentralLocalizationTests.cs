using AnimStudio.Infrastructure.Ecosystem;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;

namespace AnimStudio.Application.Tests;

public sealed class CentralLocalizationTests
{
    private static CentralLocalizationService CreateService()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["CentralMongo:ConnectionString"] = "",
                ["Mongo:ConnectionString"] = "",
            })
            .Build();
        return new CentralLocalizationService(config, NullLogger<CentralLocalizationService>.Instance);
    }

    [Fact]
    public async Task StudioLocalization_DefaultsToEnglish_WithHindiEnabled_AndUiOnlyNote()
    {
        var svc = CreateService();

        var en = await svc.GetBundleAsync("en");
        Assert.Equal("en", en.Locale);
        Assert.True(en.Policy.UiOnlyNote);
        Assert.Contains("en", en.Policy.EnabledLocales);
        Assert.Contains("hi", en.Policy.EnabledLocales);
        Assert.Equal("Projects", en.Entries["studio.nav.projects"]);
        Assert.Contains("video", en.Entries["studio.language.uiOnlyNote"], StringComparison.OrdinalIgnoreCase);

        var hi = await svc.GetBundleAsync("hi");
        Assert.Equal("hi", hi.Locale);
        Assert.Equal("प्रोजेक्ट्स", hi.Entries["studio.nav.projects"]);
        Assert.Equal("स्टूडियो UI भाषा", hi.Entries["studio.language.label"]);
    }

    [Fact]
    public async Task StudioLocalization_PerSiteOverride_ForcesChosenLocale()
    {
        var svc = CreateService();

        var updated = await svc.UpdateLocalSettingsAsync(
            new UpdateSiteLocalizationRequest(
                OverrideCentralLocalization: true,
                DefaultLocale: "hi",
                EnabledLocales: ["hi", "en"],
                AllowVisitorLanguageSwitch: false,
                ShowLanguagePicker: false,
                ForceLocale: true),
            "admin-1");

        Assert.Equal("site-override", updated.EffectivePolicy.ControlledBy);
        Assert.True(updated.EffectivePolicy.ForceLocale);

        var bundle = await svc.GetBundleAsync("en");
        Assert.Equal("hi", bundle.Locale);
        Assert.Equal("प्रोजेक्ट्स", bundle.Entries["studio.nav.projects"]);
    }

    [Fact]
    public async Task TryLoadCentralEnvelopeFromMongoAsync_ReturnsNull_WhenUnconfigured()
    {
        var svc = CreateService();
        var env = await svc.TryLoadCentralEnvelopeFromMongoAsync();
        Assert.Null(env);
    }
}
