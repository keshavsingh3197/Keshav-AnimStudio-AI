using AnimStudio.Application.LiveStreams;
using AnimStudio.Domain.LiveStreams;

namespace AnimStudio.Application.Tests.LiveStreams;

public class LiveStreamPresetValidatorTests
{
    private static readonly string[] Destinations = ["youtube"];

    private static LiveStreamPresetRequest Valid(Func<LiveStreamPresetRequest, LiveStreamPresetRequest>? change = null)
    {
        var request = new LiveStreamPresetRequest
        {
            Name = "Morning bhajans",
            Settings = new LiveStreamPresetSettings { Destination = "youtube", Quality = "Hd720", Orientation = "Landscape" },
            Items =
            [
                new LiveStreamPresetItem { Source = "Render", Title = "Episode 1", RenderJobId = "job_123" },
                new LiveStreamPresetItem { Source = "Url", Title = "Song", Url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }
            ],
            KeyMode = "youtube",
            YouTube = new LiveStreamPresetYouTube
            {
                ChannelId = "UC1234567890123456789012",
                Title = "🔴 LIVE: Morning bhajans {date}",
                Description = "Every morning.",
                Tags = ["bhajan", "live"],
                CategoryId = "10",
                Privacy = "public"
            }
        };
        return change is null ? request : change(request);
    }

    [Fact]
    public void Accepts_a_complete_preset() =>
        Assert.Null(LiveStreamPresetValidator.Validate(Valid(), Destinations));

    [Fact]
    public void Accepts_a_pasted_key_preset_without_youtube_details() =>
        Assert.Null(LiveStreamPresetValidator.Validate(Valid(r => r with { KeyMode = "paste", YouTube = null }), Destinations));

    [Fact]
    public void Refuses_uploaded_files_which_a_preset_cannot_keep() =>
        Assert.Contains("can't keep", LiveStreamPresetValidator.Validate(Valid(r => r with
        {
            Items = [new LiveStreamPresetItem { Source = "Upload", Title = "song.wav" }]
        }), Destinations));

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("line\nbreak")]
    public void Refuses_a_missing_or_multiline_name(string name) =>
        Assert.NotNull(LiveStreamPresetValidator.Validate(Valid(r => r with { Name = name }), Destinations));

    [Theory]
    [InlineData("1")]
    [InlineData("hd720")]
    [InlineData("Hd4k")]
    public void Refuses_quality_that_is_not_an_enum_name(string quality) =>
        Assert.NotNull(LiveStreamPresetValidator.Validate(
            Valid(r => r with { Settings = new LiveStreamPresetSettings { Destination = "youtube", Quality = quality, Orientation = "Landscape" } }),
            Destinations));

    [Fact]
    public void Refuses_an_unknown_destination() =>
        Assert.NotNull(LiveStreamPresetValidator.Validate(
            Valid(r => r with { Settings = new LiveStreamPresetSettings { Destination = "elsewhere" } }), Destinations));

    [Theory]
    [InlineData("stream-key")]
    [InlineData("")]
    [InlineData(null)]
    public void Refuses_an_unknown_key_mode(string? keyMode) =>
        Assert.NotNull(LiveStreamPresetValidator.Validate(Valid(r => r with { KeyMode = keyMode }), Destinations));

    [Fact]
    public void Channel_mode_needs_a_valid_channel_id() =>
        Assert.NotNull(LiveStreamPresetValidator.Validate(
            Valid(r => r with { KeyMode = "channel", ChannelId = "../other" }), Destinations));

    [Fact]
    public void YouTube_mode_needs_details() =>
        Assert.NotNull(LiveStreamPresetValidator.Validate(Valid(r => r with { YouTube = null }), Destinations));

    [Fact]
    public void Refuses_angle_brackets_youtube_rejects()
    {
        var request = Valid();
        request.YouTube!.Title = "<b>LIVE</b>";
        Assert.NotNull(LiveStreamPresetValidator.Validate(request, Destinations));
    }

    [Fact]
    public void Refuses_an_unknown_category()
    {
        var request = Valid();
        request.YouTube!.CategoryId = "999";
        Assert.NotNull(LiveStreamPresetValidator.Validate(request, Destinations));
    }

    [Theory]
    [InlineData("javascript:alert(1)")]
    [InlineData("http://example.com/t.jpg")]
    public void Thumbnails_must_be_https(string url)
    {
        var request = Valid();
        request.Items![0].ThumbnailUrl = url;
        Assert.NotNull(LiveStreamPresetValidator.Validate(request, Destinations));
    }

    [Fact]
    public void Link_items_go_through_the_stream_link_checks()
    {
        var request = Valid();
        request.Items![1].Url = "file:///etc/passwd";
        Assert.NotNull(LiveStreamPresetValidator.Validate(request, Destinations));
    }
}
