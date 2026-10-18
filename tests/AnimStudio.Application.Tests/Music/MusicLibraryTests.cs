using System.Net;
using System.Text;
using System.Text.Json;
using AnimStudio.Application.Abstractions.Music;
using AnimStudio.Application.Music;
using AnimStudio.Domain.Assets;
using AnimStudio.Domain.Jobs;
using AnimStudio.Domain.Projects;
using AnimStudio.Infrastructure.Music;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace AnimStudio.Application.Tests.Music;

/// <summary>Synthetic catalogue data only; everything talks to a fake handler.</summary>
public class MusicLibraryTests
{
    [Theory]
    [InlineData("http://creativecommons.org/licenses/by/3.0/", "CC BY", LicenseClass.AttributionOnly)]
    [InlineData("https://creativecommons.org/licenses/by-sa/4.0/", "CC BY-SA", LicenseClass.ShareAlike)]
    [InlineData("http://creativecommons.org/licenses/by-nc-sa/3.0/", "CC BY-NC-SA", LicenseClass.NonCommercial)]
    [InlineData("http://creativecommons.org/licenses/by-nc-nd/3.0/", "CC BY-NC-ND", LicenseClass.NoDerivatives)]
    [InlineData("https://creativecommons.org/publicdomain/zero/1.0/", "CC0", LicenseClass.PublicDomain)]
    [InlineData("https://evil.example/licenses/by/3.0/", "", LicenseClass.Unknown)]
    [InlineData("https://creativecommons.org/licenses/by-xx/3.0/", "", LicenseClass.Unknown)]
    [InlineData(null, "", LicenseClass.Unknown)]
    public void Licences_are_read_from_the_deed_url(string? url, string code, LicenseClass expected)
    {
        var license = MusicLicensing.Parse(url);
        Assert.Equal(code, license.Code);
        Assert.Equal(expected, license.Class);
    }

    [Fact]
    public void What_a_project_may_use_follows_its_distribution_settings()
    {
        var nc = MusicLicensing.Parse("http://creativecommons.org/licenses/by-nc/3.0/");
        var sa = MusicLicensing.Parse("http://creativecommons.org/licenses/by-sa/3.0/");
        var nd = MusicLicensing.Parse("http://creativecommons.org/licenses/by-nd/3.0/");
        var by = MusicLicensing.Parse("http://creativecommons.org/licenses/by/3.0/");

        var monetized = new ProjectSettings { DistributionIntent = DistributionIntent.Monetized };
        var personal = new ProjectSettings { DistributionIntent = DistributionIntent.Personal, AcceptShareAlikeObligation = true };

        Assert.NotNull(MusicLicensing.WhyNotUsable(nc, monetized));
        Assert.Null(MusicLicensing.WhyNotUsable(nc, personal));
        Assert.NotNull(MusicLicensing.WhyNotUsable(sa, monetized));
        Assert.Null(MusicLicensing.WhyNotUsable(sa, personal));
        Assert.NotNull(MusicLicensing.WhyNotUsable(nd, personal));
        Assert.Null(MusicLicensing.WhyNotUsable(by, monetized));
        Assert.NotNull(MusicLicensing.WhyNotUsable(MusicLicensing.Parse(null), personal));
    }

    [Fact]
    public void Filters_accept_only_listed_values()
    {
        var ok = MusicFilters.Validate(new("lofi beats", "electronic", "calm", "low", "short", true, "top", 2), true);
        Assert.NotNull(ok.Query);
        Assert.Equal(MusicSort.Top, ok.Query!.Sort);
        Assert.Equal(60, ok.Query.MaxSeconds);

        Assert.Equal("genre", MusicFilters.Validate(new(null, "&client_id=x", null, null, null, false, null, null), true).Field);
        Assert.Equal("sort", MusicFilters.Validate(new(null, null, null, null, null, false, "random", null), true).Field);
        Assert.Equal("page", MusicFilters.Validate(new(null, null, null, null, null, false, null, 0), true).Field);
        Assert.Equal("q", MusicFilters.Validate(new(new string('x', 101), null, null, null, null, false, null, null), true).Field);
    }

    [Fact]
    public void A_search_without_text_sorts_by_trending_and_with_text_by_best_match()
    {
        Assert.Equal(MusicSort.Trending, MusicFilters.Validate(new(null, null, null, null, null, false, null, null), true).Query!.Sort);
        Assert.Equal(MusicSort.BestMatch, MusicFilters.Validate(new("piano", null, null, null, null, false, null, null), true).Query!.Sort);
        Assert.Equal(MusicSort.Trending, MusicFilters.Validate(new(null, null, null, null, null, false, "BestMatch", null), true).Query!.Sort);
    }

    [Theory]
    [InlineData("https://prod-1.storage.jamendo.com/download/track/1/mp32/", true)]
    [InlineData("https://www.jamendo.com/track/1", true)]
    [InlineData("http://www.jamendo.com/track/1", false)]
    [InlineData("https://jamendo.com.evil.example/x", false)]
    [InlineData("https://evil.example/?jamendo.com", false)]
    [InlineData("https://user@prod-1.storage.jamendo.com/x", false)]
    [InlineData("https://prod-1.storage.jamendo.com:8443/x", false)]
    public void Only_https_jamendo_urls_are_kept(string url, bool kept)
    {
        Assert.Equal(kept, JamendoMusicCatalog.ToJamendoUrl(url) is not null);
    }

    [Fact]
    public void Tracks_are_parsed_with_untrusted_fields_vetted()
    {
        using var doc = JsonDocument.Parse(SampleResponse);
        var tracks = JamendoMusicCatalog.ParseTracks(doc.RootElement);

        var track = Assert.Single(tracks);
        Assert.Equal("1001", track.Id);
        Assert.Equal("Sunny Test Track", track.Title);
        Assert.Equal(LicenseClass.ShareAlike, track.License.Class);
        Assert.True(track.Instrumental);
        Assert.Equal(["pop"], track.Genres);
        Assert.Equal(["happy"], track.Moods);
        Assert.Null(track.ImageUrl);            // not a jamendo host
        Assert.NotNull(track.PreviewUrl);
        Assert.True(track.Downloadable);
    }

    [Fact]
    public async Task A_download_never_follows_a_redirect_off_jamendo()
    {
        var handler = new StubHandler(_ =>
        {
            var r = new HttpResponseMessage(HttpStatusCode.Found);
            r.Headers.Location = new Uri("https://evil.example/file.mp3");
            return r;
        });
        using var catalog = Catalog(handler);
        var track = Track("https://prod-1.storage.jamendo.com/download/track/1001/mp32/");

        var ex = await Assert.ThrowsAsync<MusicCatalogException>(() => catalog.DownloadAsync(track, 1024, CancellationToken.None));
        Assert.Equal("music-download-failed", ex.Code);
    }

    [Fact]
    public async Task A_download_stops_at_the_size_limit_even_without_a_length_header()
    {
        var handler = new StubHandler(_ => new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StreamContent(new MemoryStream(new byte[4096]))
        });
        using var catalog = Catalog(handler);

        var ex = await Assert.ThrowsAsync<MusicCatalogException>(() =>
            catalog.DownloadAsync(Track("https://prod-1.storage.jamendo.com/download/track/1001/mp32/"), 1024, CancellationToken.None));
        Assert.Equal("music-too-large", ex.Code);
    }

    [Fact]
    public async Task Search_sends_only_allowlisted_parameters_and_reads_the_page()
    {
        Uri? seen = null;
        var handler = new StubHandler(r =>
        {
            seen = r.RequestUri;
            return new HttpResponseMessage(HttpStatusCode.OK) { Content = new StringContent(SampleResponse, Encoding.UTF8, "application/json") };
        });
        using var catalog = Catalog(handler);
        var query = MusicFilters.Validate(new("sunny day", "pop", "happy", null, null, true, "trending", 1), includeNonCommercial: false).Query!;

        var page = await catalog.SearchAsync(query, CancellationToken.None);

        Assert.Single(page.Tracks);
        Assert.False(page.HasMore);
        Assert.Equal("api.jamendo.com", seen!.Host);
        var q = seen.Query;
        Assert.Contains("order=popularity_week", q);
        Assert.Contains("ccnd=false", q);
        Assert.Contains("ccnc=false", q);
        Assert.Contains("search=sunny%20day", q);
        Assert.Contains("vocalinstrumental=instrumental", q);
    }

    [Fact]
    public async Task A_refused_client_id_reads_as_not_configured()
    {
        var handler = new StubHandler(_ => new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent("""{"headers":{"status":"failed","code":5},"results":[]}""", Encoding.UTF8, "application/json")
        });
        using var catalog = Catalog(handler);

        var ex = await Assert.ThrowsAsync<MusicCatalogException>(() => catalog.GetAsync("1001", CancellationToken.None));
        Assert.Equal("music-not-configured", ex.Code);
    }

    [Fact]
    public void Credits_list_each_licensed_track_once_without_angle_brackets()
    {
        var track = Track("https://prod-1.storage.jamendo.com/x") with { Title = "<Intro>" };
        var asset = new Asset { Provenance = new AssetProvenance { AttributionText = MusicLicensing.Attribution(track) } };
        var narration = new Asset { Provenance = new AssetProvenance { SourceProvider = "narration" } };

        var credits = MusicCredits.Compose([asset, asset, narration]);

        Assert.StartsWith("🎵 Music\n• ", credits);
        Assert.DoesNotContain("<", credits);
        Assert.Single(credits.Split('\n'), l => l.StartsWith("• ", StringComparison.Ordinal));
        Assert.Equal(string.Empty, MusicCredits.Compose([narration]));
    }

    [Fact]
    public void A_clip_export_credits_its_own_music_but_not_voiceover()
    {
        var job = new RenderJob
        {
            ClipMerge = new ClipMergeSpec
            {
                BackgroundMusicAssetId = "bed",
                MusicTracks = [new TimedMusicClipSpec { AssetId = "sting" }, new TimedMusicClipSpec { AssetId = "vo", IsVoiceover = true }]
            }
        };
        Assert.Equal(["bed", "sting"], MusicCredits.AssetIdsUsedBy(job, null));

        var project = new Project { Settings = new ProjectSettings { BackgroundMusicAssetId = "project-bed" } };
        Assert.Equal(["project-bed"], MusicCredits.AssetIdsUsedBy(new RenderJob(), project));
    }

    private static JamendoMusicCatalog Catalog(HttpMessageHandler handler) => new(
        new StaticOptions(new MusicLibraryOptions { JamendoClientId = "test-client" }),
        TimeProvider.System, NullLogger<JamendoMusicCatalog>.Instance, handler);

    private static MusicTrack Track(string downloadUrl) => new(
        JamendoMusicCatalog.Provider, "1001", "Sunny Test Track", "Test Artist", 120, null, null,
        "https://www.jamendo.com/track/1001", MusicLicensing.Parse("http://creativecommons.org/licenses/by/3.0/"),
        [], [], [], true, null, null, downloadUrl);

    private const string SampleResponse = """
    {
      "headers": { "status": "success", "code": 0, "results_count": 1 },
      "results": [
        {
          "id": "1001",
          "name": "Sunny Test Track",
          "duration": 125,
          "artist_name": "Test Artist",
          "album_image": "https://images.evil.example/cover.jpg",
          "audio": "https://prod-1.storage.jamendo.com/?trackid=1001&format=mp31",
          "audiodownload": "https://prod-1.storage.jamendo.com/download/track/1001/mp32/",
          "audiodownload_allowed": true,
          "shareurl": "https://www.jamendo.com/track/1001",
          "license_ccurl": "http://creativecommons.org/licenses/by-sa/3.0/",
          "releasedate": "2024-05-01",
          "musicinfo": {
            "vocalinstrumental": "instrumental",
            "speed": "medium",
            "tags": { "genres": ["pop"], "instruments": ["piano"], "vartags": ["happy", "<script>"] }
          }
        },
        { "id": "not-a-number", "name": "dropped" }
      ]
    }
    """;

    private sealed class StaticOptions(MusicLibraryOptions value) : IOptionsMonitor<MusicLibraryOptions>
    {
        public MusicLibraryOptions CurrentValue => value;
        public MusicLibraryOptions Get(string? name) => value;
        public IDisposable? OnChange(Action<MusicLibraryOptions, string?> listener) => null;
    }

    private sealed class StubHandler(Func<HttpRequestMessage, HttpResponseMessage> respond) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct) =>
            Task.FromResult(respond(request));
    }
}
