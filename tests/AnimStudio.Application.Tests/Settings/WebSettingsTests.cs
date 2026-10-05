using AnimStudio.Application.Settings;
using AnimStudio.Infrastructure.Ffmpeg;
using AnimStudio.Infrastructure.Settings;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace AnimStudio.Application.Tests.Settings;

public class WebSettingsTests
{
    [Theory]
    [InlineData("Render:Crf", "20", "20")]
    [InlineData("render:crf", " 0 ", "0")]
    [InlineData("Render:Preset", "SLOW", "slow")]
    [InlineData("Render:UseHardwareEncoder", "True", "true")]
    [InlineData("Segmentation:TargetSegmentSeconds", "6.5", "6.5")]
    [InlineData("YouTube:Publish:RedirectUri", "http://localhost:4200/youtube/callback", "http://localhost:4200/youtube/callback")]
    public void Accepts_valid_values_in_invariant_form(string key, string input, string expected)
    {
        var (value, error) = WebSettingCatalog.Normalize(WebSettingCatalog.Find(key)!, input);

        Assert.Null(error);
        Assert.Equal(expected, value);
    }

    [Theory]
    [InlineData("Render:Crf", "52")]
    [InlineData("Render:Crf", "abc")]
    [InlineData("Render:Preset", "placebo")]
    [InlineData("Render:UseHardwareEncoder", "yes")]
    [InlineData("Segmentation:TargetSegmentSeconds", "NaN")]
    [InlineData("YouTube:Publish:RedirectUri", "http://example.com/callback")]
    [InlineData("YouTube:Publish:RedirectUri", "javascript:alert(1)")]
    [InlineData("Render:WatermarkText", "line\nbreak")]
    public void Refuses_invalid_values(string key, string input)
    {
        Assert.NotNull(WebSettingCatalog.Normalize(WebSettingCatalog.Find(key)!, input).Error);
    }

    [Theory]
    [InlineData("Encryption:DataKey")]
    [InlineData("Mongo:ConnectionString")]
    [InlineData("YouTube:Publish:ClientSecret")]
    [InlineData("YouTube:ApiKey")]
    [InlineData("Admin:Mode")]
    [InlineData("Render:ScratchRoot")]
    public void Secrets_paths_and_security_settings_are_not_in_the_catalog(string key)
    {
        Assert.Null(WebSettingCatalog.Find(key));
    }

    [Fact]
    public void Stored_values_override_the_file_and_reach_options_without_a_restart()
    {
        var source = new WebSettingsConfigurationSource();
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["Render:Crf"] = "18", ["Encryption:DataKey"] = "file" })
            .Add(source)
            .Build();

        var services = new ServiceCollection();
        services.Configure<RenderOptions>(configuration.GetSection(RenderOptions.Section));
        services.AddSingleton<IOptions<RenderOptions>, LiveOptions<RenderOptions>>();
        using var provider = services.BuildServiceProvider();
        var options = provider.GetRequiredService<IOptions<RenderOptions>>();

        Assert.Equal(18, options.Value.Crf);

        source.Provider.Apply(new Dictionary<string, string>
        {
            ["Render:Crf"] = "23",
            // Not in the catalog: ignored even if someone inserts the row by hand.
            ["Encryption:DataKey"] = "from-database"
        });

        Assert.Equal(23, options.Value.Crf);
        Assert.Equal("file", configuration["Encryption:DataKey"]);

        source.Provider.Apply(new Dictionary<string, string>());
        Assert.Equal(18, options.Value.Crf);
    }
}
