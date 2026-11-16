using AnimStudio.Application.Rendering;
using AnimStudio.Infrastructure.Rendering;

namespace AnimStudio.Application.Tests.Rendering;

public sealed class RenderStallWatchdogTests
{
    private static readonly TimeSpan Limit = TimeSpan.FromMilliseconds(250);
    private static readonly TimeSpan Generous = TimeSpan.FromSeconds(10);

    [Fact]
    public async Task A_render_that_keeps_making_progress_is_never_stopped_however_long_it_takes()
    {
        using var watchdog = new RenderStallWatchdog(Limit, CancellationToken.None);

        // Run for four times the stall limit, reporting progress well inside it each time.
        for (var i = 0; i < 16; i++)
        {
            await Task.Delay(Limit / 4);
            watchdog.Touch();
        }

        Assert.False(watchdog.Token.IsCancellationRequested);
        Assert.False(watchdog.Stalled);
    }

    [Fact]
    public async Task A_render_with_no_progress_for_the_limit_is_stopped_and_marked_stalled()
    {
        using var watchdog = new RenderStallWatchdog(Limit, CancellationToken.None);

        await Assert.ThrowsAnyAsync<OperationCanceledException>(() => Task.Delay(Generous, watchdog.Token));
        Assert.True(watchdog.Stalled);
    }

    [Fact]
    public async Task Caller_cancellation_passes_through_without_being_reported_as_a_stall()
    {
        using var caller = new CancellationTokenSource();
        using var watchdog = new RenderStallWatchdog(TimeSpan.FromMinutes(5), caller.Token);

        await caller.CancelAsync();

        Assert.True(watchdog.Token.IsCancellationRequested);
        Assert.False(watchdog.Stalled);
    }

    [Fact]
    public void Stall_limit_must_be_positive()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => new RenderStallWatchdog(TimeSpan.Zero, CancellationToken.None));
    }

    [Fact]
    public void Parallel_and_single_threaded_drawing_produce_identical_frames()
    {
        const string script = """
            [CAST]: सूत्रधार | sage | saffron dhoti
            [CAST]: बिरसा | warrior | white turban, wooden bow
            [SCENE]: village | dawn | serene
            [सूत्रधार]: छोटानागपुर की पावन भूमि पर एक युगपुरुष का जन्म हुआ।
            [बिरसा]: माँ, तुम चिंता मत करो।
            [SCENE]: forest ashram | night | tense
            [सूत्रधार]: जंगलों में आवाज गूँज उठी।
            [SCENE]: battlefield | sunset | dramatic
            [बिरसा]: उलगुलान! जल, जंगल और जमीन पर हमारा अधिकार है!
            [SCENE]: river ghat | day | calm
            [सूत्रधार]: इतिहास ने उन्हें धरती आबा कहा।
            """;
        const int duration = 24;
        var plan = DialogueScriptParser.ParsePlan("बिरसा मुंडा", script, null, duration, enableDialogue: true);
        var palette = ProceduralEventPalette.Resolve(null, ProceduralSceneTheme.HistoryChronicle3D);

        byte[] Render(bool singleThread)
        {
            ProceduralSceneRasterizer.ForceSingleThreadForTests = singleThread;
            try
            {
                // Large enough that every primitive crosses the parallel threshold.
                var rasterizer = new ProceduralSceneRasterizer(540, 960, ProceduralSceneTheme.HistoryChronicle3D, 11, palette, plan);
                using var all = new MemoryStream();
                for (var t = 0.0; t < duration; t += 1.5)
                    all.Write(rasterizer.RenderFrame(t, duration));
                return all.ToArray();
            }
            finally
            {
                ProceduralSceneRasterizer.ForceSingleThreadForTests = false;
            }
        }

        Assert.Equal(Render(singleThread: true), Render(singleThread: false));
    }
}
