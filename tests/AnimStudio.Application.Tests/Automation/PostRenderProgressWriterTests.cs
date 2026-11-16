using AnimStudio.Application.Rendering;
using AnimStudio.Domain.Automation;
using AnimStudio.Infrastructure.Automation;
using Microsoft.Extensions.Logging.Abstractions;

namespace AnimStudio.Application.Tests.Automation;

public sealed class PostRenderProgressWriterTests
{
    private sealed class RecordingStore
    {
        private readonly object gate = new();
        public List<(int? Percent, string? Stage)> Saves { get; } = [];

        public Task SaveAsync(AutomationPost post, CancellationToken ct)
        {
            lock (gate) Saves.Add((post.StoryProgressPercent, post.StoryStageSummary));
            return Task.CompletedTask;
        }
    }

    private static AutomationPost NewPost() => new() { Id = "post-1", UserId = "user-1", Title = "Test" };

    [Fact]
    public async Task Burst_of_reports_is_coalesced_and_the_newest_value_is_saved_last()
    {
        var store = new RecordingStore();
        var post = NewPost();
        var writer = new PostRenderProgressWriter(post, store.SaveAsync, TimeProvider.System, NullLogger.Instance, CancellationToken.None);

        for (var i = 50; i <= 90; i++)
            writer.Report(new ProceduralRenderProgress(i, $"Animating 3D frames ({i})"));

        // First save is immediate; the trailing value is saved after one interval.
        await Task.Delay(PostRenderProgressWriter.MinInterval * 2.5);
        await writer.StopAsync();

        Assert.InRange(store.Saves.Count, 1, 3);
        Assert.Equal((90, "Animating 3D frames (90)"), store.Saves[^1]);
    }

    [Fact]
    public async Task Progress_ticks_never_claim_100_percent()
    {
        var store = new RecordingStore();
        var post = NewPost();
        var writer = new PostRenderProgressWriter(post, store.SaveAsync, TimeProvider.System, NullLogger.Instance, CancellationToken.None);

        await writer.SaveNowAsync(150, "Saving video to Studio");

        Assert.Equal(99, post.StoryProgressPercent);
        Assert.Single(store.Saves);
    }

    [Fact]
    public async Task Reports_after_stop_are_ignored()
    {
        var store = new RecordingStore();
        var post = NewPost();
        var writer = new PostRenderProgressWriter(post, store.SaveAsync, TimeProvider.System, NullLogger.Instance, CancellationToken.None);

        await writer.StopAsync();
        writer.Report(new ProceduralRenderProgress(60, "Animating"));
        await Task.Delay(50);

        Assert.Empty(store.Saves);
        Assert.Null(post.StoryProgressPercent);
    }

    [Fact]
    public async Task A_failing_save_does_not_throw_into_the_render()
    {
        var post = NewPost();
        var writer = new PostRenderProgressWriter(
            post, (_, _) => throw new InvalidOperationException("db down"), TimeProvider.System, NullLogger.Instance, CancellationToken.None);

        await writer.SaveNowAsync(10, "Writing character dialogue");
        writer.Report(new ProceduralRenderProgress(20, "Voice line 1 of 4"));
        await writer.StopAsync();
    }

    [Fact]
    public void Stage_bands_only_move_forward()
    {
        Assert.Equal(ProceduralRenderStages.VoicesStart, ProceduralRenderStages.VoicePercent(0, 8));
        Assert.Equal(ProceduralRenderStages.VoicesEnd, ProceduralRenderStages.VoicePercent(8, 8));
        Assert.Equal(ProceduralRenderStages.FramesStart, ProceduralRenderStages.FramePercent(0, 4320));
        Assert.Equal(ProceduralRenderStages.FramesEnd, ProceduralRenderStages.FramePercent(4320, 4320));

        int[] order =
        [
            ProceduralRenderStages.Dialogue, ProceduralRenderStages.VoicesStart, ProceduralRenderStages.VoicesEnd,
            ProceduralRenderStages.Music, ProceduralRenderStages.Captions, ProceduralRenderStages.Backdrops,
            ProceduralRenderStages.FramesStart, ProceduralRenderStages.FramesEnd, ProceduralRenderStages.Encode,
            ProceduralRenderStages.Save
        ];
        Assert.Equal(order.OrderBy(x => x), order);
        Assert.True(order[^1] < 100);
    }
}
