using System.Buffers.Binary;
using System.IO.Compression;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Abstractions.StoryAgent;
using AnimStudio.Application.Ai;
using AnimStudio.Application.StoryAgent;
using AnimStudio.Application.StoryAgent.Stages;
using AnimStudio.Domain.Ai;
using AnimStudio.Domain.Stories;

namespace AnimStudio.Application.Tests.StoryAgent;

public sealed class StoryPlaceholderImageTests
{
    private sealed record Chunk(string Type, byte[] Data, uint Crc);

    private static List<Chunk> Chunks(byte[] png)
    {
        Assert.Equal(new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A }, png[..8]);
        var chunks = new List<Chunk>();
        var at = 8;
        while (at < png.Length)
        {
            var length = BinaryPrimitives.ReadInt32BigEndian(png.AsSpan(at));
            var type = System.Text.Encoding.ASCII.GetString(png, at + 4, 4);
            var data = png[(at + 8)..(at + 8 + length)];
            var crc = BinaryPrimitives.ReadUInt32BigEndian(png.AsSpan(at + 8 + length));
            chunks.Add(new Chunk(type, data, crc));
            at += 12 + length;
        }

        return chunks;
    }

    /// <summary>An independent CRC-32, bit by bit, so the check does not trust the code it checks.</summary>
    private static uint Crc(string type, byte[] data)
    {
        var crc = 0xFFFFFFFFu;
        foreach (var b in System.Text.Encoding.ASCII.GetBytes(type).Concat(data))
        {
            crc ^= b;
            for (var k = 0; k < 8; k++) crc = (crc & 1) != 0 ? (crc >> 1) ^ 0xEDB88320u : crc >> 1;
        }

        return ~crc;
    }

    private static byte[] Pixels(byte[] png, out int width, out int height)
    {
        var chunks = Chunks(png);
        var header = chunks[0].Data;
        width = BinaryPrimitives.ReadInt32BigEndian(header);
        height = BinaryPrimitives.ReadInt32BigEndian(header.AsSpan(4));
        using var deflated = new MemoryStream(chunks.Where(c => c.Type == "IDAT").SelectMany(c => c.Data).ToArray());
        using var zlib = new ZLibStream(deflated, CompressionMode.Decompress);
        using var raw = new MemoryStream();
        zlib.CopyTo(raw);
        return raw.ToArray();
    }

    [Theory]
    [InlineData(false, 480, 270)]
    [InlineData(true, 270, 480)]
    public void A_placeholder_is_a_well_formed_png_in_the_videos_proportions(bool vertical, int width, int height)
    {
        var png = StoryPlaceholderImage.Create(1, vertical);

        var chunks = Chunks(png);
        Assert.Equal(["IHDR", "IDAT", "IEND"], chunks.Select(c => c.Type));
        Assert.All(chunks, c => Assert.Equal(Crc(c.Type, c.Data), c.Crc));

        var header = chunks[0].Data;
        Assert.Equal(13, header.Length);
        Assert.Equal(width, BinaryPrimitives.ReadInt32BigEndian(header));
        Assert.Equal(height, BinaryPrimitives.ReadInt32BigEndian(header.AsSpan(4)));
        Assert.Equal(new byte[] { 8, 2, 0, 0, 0 }, header[8..]);

        var raw = Pixels(png, out _, out _);
        Assert.Equal((width * 3 + 1) * height, raw.Length);
        for (var row = 0; row < height; row++) Assert.Equal(0, raw[row * (width * 3 + 1)]);
    }

    [Fact]
    public void The_sniffers_the_rest_of_the_app_uses_accept_it_as_a_png_and_it_is_small()
    {
        var png = StoryPlaceholderImage.Create(3, vertical: false);

        Assert.Equal(AiImageValidator.Png, AiImageValidator.Sniff(png));
        Assert.InRange(png.Length, 200, 300_000);
    }

    [Fact]
    public void The_picture_is_a_glow_brighter_in_the_middle_than_at_the_corners()
    {
        var raw = Pixels(StoryPlaceholderImage.Create(1, vertical: false), out var width, out var height);

        int Brightness(int x, int y)
        {
            var at = y * (width * 3 + 1) + 1 + x * 3;
            return raw[at] + raw[at + 1] + raw[at + 2];
        }

        Assert.True(Brightness(width / 2, height / 2) > Brightness(0, 0) + 100);
        Assert.True(Brightness(width / 2, height / 2) > Brightness(width - 1, height - 1) + 100);
    }

    [Fact]
    public void The_palette_changes_from_scene_to_scene_repeats_and_never_throws()
    {
        var pictures = Enumerable.Range(1, 4).Select(i => Convert.ToHexString(StoryPlaceholderImage.Create(i, false))).ToArray();

        Assert.Equal(4, pictures.Distinct().Count());
        Assert.Equal(pictures[0], Convert.ToHexString(StoryPlaceholderImage.Create(5, false)));
        Assert.Equal(pictures[0], Convert.ToHexString(StoryPlaceholderImage.Create(1, false)));
        foreach (var odd in new[] { 0, -1, int.MinValue + 1, 10_000 })
            Assert.NotEmpty(StoryPlaceholderImage.Create(odd, false));
    }
}

public sealed class StoryPausesTests
{
    private const string Log = """
        [silencedetect @ 0000023d0a1b2c40] silence_start: 0
        [silencedetect @ 0000023d0a1b2c40] silence_end: 0.48 | silence_duration: 0.48
        [silencedetect @ 0000023d0a1b2c40] silence_start: 3.212
        [silencedetect @ 0000023d0a1b2c40] silence_end: 3.5 | silence_duration: 0.288
        [silencedetect @ 0000023d0a1b2c40] silence_start: 7.61
        size=N/A time=00:00:08.20 bitrate=N/A speed= 800x
        """;

    [Fact]
    public void Quiet_stretches_are_read_from_what_silencedetect_printed_and_a_silence_open_at_the_end_is_closed_there()
    {
        var pauses = StoryPacing.ParsePauses(Log, 8.2);

        Assert.Equal(
            new[] { (0.0, 0.48), (3.212, 3.5), (7.61, 8.2) },
            pauses.Select(p => (p.Start, p.End)).ToArray());
    }

    [Fact]
    public void A_silence_that_ends_after_the_audio_is_cut_at_the_audio_and_a_slightly_negative_start_is_zero()
    {
        var pauses = StoryPacing.ParsePauses("silence_start: -0.002\nsilence_end: 9.5 | silence_duration: 9.5", 3.0);

        var only = Assert.Single(pauses);
        Assert.Equal(0.0, only.Start);
        Assert.Equal(3.0, only.End);
    }

    [Fact]
    public void An_end_without_a_start_begins_at_zero_and_an_empty_stretch_is_dropped()
    {
        var pauses = StoryPacing.ParsePauses("silence_end: 0.4 | silence_duration: 0.4\nsilence_start: 2\nsilence_end: 2", 5);

        var only = Assert.Single(pauses);
        Assert.Equal((0.0, 0.4), (only.Start, only.End));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("nothing to see here\nframe=  12 fps=0.0")]
    public void A_log_with_no_silence_in_it_has_no_pauses(string? log) =>
        Assert.Empty(StoryPacing.ParsePauses(log, 10));

    [Fact]
    public void The_pauses_cut_captions_where_the_speaker_paused()
    {
        var pauses = StoryPacing.ParsePauses(Log, 8.2);

        var spans = StoryPacing.Align(["पहला वाक्य यहाँ है।", "दूसरा वाक्य यहाँ है।"], 8.2, pauses);

        Assert.Equal(2, spans.Count);
        Assert.InRange(spans[0].End, 3.2, 3.5);
        Assert.Equal(spans[0].End, spans[1].Start, 2);
    }
}

public sealed class StoryHedgeTests
{
    [Theory]
    [InlineData("पुराणों में कथा है कि इसी दिन यमराज अपनी बहन के घर पधारे।", true)]
    [InlineData("भागवत पुराण के अनुसार, मंथन से धन्वंतरि प्रकट हुए।", true)]
    [InlineData("यह कथा प्रचलित है।", true)]
    [InlineData("यमराज अपनी बहन के घर पधारे।", false)]
    public void More_ways_of_saying_it_is_passed_down_are_recognised(string text, bool expected) =>
        Assert.Equal(expected, StoryPacing.UsesHedge(text));

    private static List<string> Warnings(params (string Narration, string Basis)[] scenes)
    {
        var json = System.Text.Json.JsonSerializer.Serialize(new
        {
            scenes = scenes.Select(s => new { narration = s.Narration, basis = s.Basis })
        });
        return [.. StoryScriptParser.Parse(json, StorySamples.Brief(), null, "x", StorySamples.Now, false).Warnings
            .Where(w => w.Contains("rests on tradition", StringComparison.Ordinal))];
    }

    [Fact]
    public void A_tradition_told_over_several_scenes_says_so_once_and_the_scenes_after_are_covered()
    {
        var warnings = Warnings(
            ("पुराणों में कथा है कि यमराज बहन के घर गए।", "tradition"),
            ("यमुना ने तिलक कर उनका सत्कार किया।", "tradition"),
            ("और यमराज ने वरदान दिया।", "tradition"));

        Assert.Empty(warnings);
    }

    [Fact]
    public void Without_any_hedge_each_scene_of_a_tradition_is_still_called_out()
    {
        var warnings = Warnings(
            ("यमुना ने तिलक कर उनका सत्कार किया।", "tradition"),
            ("और यमराज ने वरदान दिया।", "tradition"));

        Assert.Equal(2, warnings.Count);
    }

    [Fact]
    public void A_scene_that_is_not_tradition_ends_the_cover_so_a_later_tradition_must_say_so_again()
    {
        var warnings = Warnings(
            ("मान्यता है कि उस रात दीप जले।", "tradition"),
            ("श्रीकृष्ण ने नरकासुर का वध किया।", "reflection"),
            ("यमुना ने तिलक कर उनका सत्कार किया।", "tradition"));

        var only = Assert.Single(warnings);
        Assert.StartsWith("Scene 3 ", only);
    }
}

public sealed class StoryPackTests
{
    [Fact]
    public void Every_pack_is_in_the_assembly_and_reads_through_the_parser_into_a_script_with_no_impossible_citation()
    {
        Assert.NotEmpty(StoryPacks.All);

        foreach (var pack in StoryPacks.All)
        {
            var brief = new StoryBrief { Title = pack.Title, Language = pack.Language, TargetSeconds = pack.TargetSeconds, Writer = StoryWriterMode.BuiltIn, PackId = pack.Id };

            var result = StoryPacks.Read(pack, brief, null, StorySamples.Now);

            Assert.True(result.Script.Scenes.Count >= 4, pack.Id);
            Assert.Equal($"built-in pack: {pack.Id}", result.Script.WrittenBy);
            Assert.All(result.Script.Scenes.SelectMany(s => s.Sources), source =>
                Assert.True(source.Check is CitationStatus.Verified or CitationStatus.Unchecked, $"{pack.Id}: {source.TextName} {source.Ref} - {source.CheckMessage}"));
            Assert.All(result.Script.Scenes, scene =>
            {
                Assert.False(string.IsNullOrWhiteSpace(scene.ImagePrompt), $"{pack.Id} scene {scene.Number} has no picture prompt");
                Assert.False(string.IsNullOrWhiteSpace(scene.Headline));
                Assert.False(StoryPacing.HasDigits(scene.Narration), $"{pack.Id} scene {scene.Number} has digits");
                Assert.False(StoryPacing.HasLatinLetters(scene.Narration), $"{pack.Id} scene {scene.Number} has Latin letters");
            });
        }
    }

    [Fact]
    public void A_pack_is_clean_when_read_so_the_person_sees_no_warnings_on_a_script_that_was_written_by_hand()
    {
        foreach (var pack in StoryPacks.All)
        {
            var brief = new StoryBrief { Title = pack.Title, Language = pack.Language, TargetSeconds = pack.TargetSeconds };

            var warnings = StoryPacks.Read(pack, brief, null, StorySamples.Now).Warnings;

            Assert.Empty(warnings);
        }
    }

    [Fact]
    public void The_diwali_pack_keeps_the_narration_the_person_approved_and_flags_the_lamps_as_tradition()
    {
        var pack = StoryPacks.Find("diwali")!;
        var script = StoryPacks.Read(pack, new StoryBrief { Title = pack.Title, Language = "hi" }, null, StorySamples.Now).Script;

        Assert.Equal(19, script.Scenes.Count);
        Assert.Equal("अंधकार चाहे कितना भी गहरा हो, एक छोटा-सा दीपक उसे मिटा देता है। यही है दीपावली।", script.Scenes[0].Narration);
        Assert.Equal("शुभ दीपावली!", script.Scenes[^1].Narration);
        Assert.Equal(StoryBasis.Tradition, script.Scenes[10].Basis);
        Assert.Contains("मान्यता", script.Scenes[10].Narration);
        Assert.Contains(script.Scenes[3].Sources, s => s is { TextId: "bhagavata-purana", Ref: "8.8", Check: CitationStatus.Verified });
        Assert.Contains(script.Scenes[12].Sources, s => s is { TextId: "bhagavata-purana", Ref: "10.24-25", Check: CitationStatus.Verified });
        Assert.Equal("sitar tanpura devotional", script.MusicQuery);
        Assert.InRange(script.Scenes.Sum(s => s.EstimatedSeconds), 150, 260);
    }

    [Fact]
    public void A_scene_the_pack_cites_becomes_grounded_when_the_research_read_that_chapter()
    {
        var pack = StoryPacks.Find("diwali")!;

        var script = StoryPacks.Read(pack, new StoryBrief { Title = pack.Title, Language = "hi" }, StorySamples.Research(), StorySamples.Now).Script;

        Assert.True(script.Scenes[3].Sources.Single().Grounded);
        Assert.False(script.Scenes[12].Sources.Single().Grounded);
    }

    [Theory]
    [InlineData("diwali", true)]
    [InlineData(" DIWALI ", true)]
    [InlineData("nope", false)]
    [InlineData("", false)]
    [InlineData(null, false)]
    public void Packs_are_found_by_id_in_any_case(string? id, bool found) =>
        Assert.Equal(found, StoryPacks.Find(id) is not null);
}

public sealed class StoryObjectKeysTests
{
    [Fact]
    public void Every_file_of_a_run_is_under_its_own_folder_and_found_again_from_the_document()
    {
        var run = StoryTestData.Run(StoryRunStatus.Completed, withScript: true);
        foreach (var scene in run.Script!.Scenes)
        {
            scene.ImageKey = StoryObjectKeys.Image(run.Id, scene.Number, ".png");
            scene.AudioKey = StoryObjectKeys.Narration(run.Id, scene.Number, "0123456789abcdef");
        }

        run.Music = new StoryMusicPick { StorageKey = StoryObjectKeys.Music(run.Id) };

        var keys = StoryObjectKeys.All(run);

        Assert.Equal(run.Script.Scenes.Count * 2 + 1, keys.Count);
        Assert.Equal(keys.Count, keys.Distinct().Count());
        Assert.All(keys, key => Assert.True(StoryObjectKeys.Owns(run.Id, key), key));
        Assert.All(keys, key => Assert.StartsWith($"story-runs/{run.Id}/", key));
    }

    [Fact]
    public void Two_pictures_for_one_scene_never_share_a_name()
    {
        var a = StoryObjectKeys.Image("sr_1", 4, ".png");
        var b = StoryObjectKeys.Image("sr_1", 4, ".png");

        Assert.NotEqual(a, b);
        Assert.Matches(@"^story-runs/sr_1/images/s04-[0-9a-f]{12}\.png$", a);
    }

    [Theory]
    [InlineData("story-runs/sr_1/images/s01-a.png", true)]
    [InlineData("story-runs/sr_1/music.mp3", true)]
    [InlineData("story-runs/sr_10/images/s01-a.png", false)]
    [InlineData("story-runs/sr_1", false)]
    [InlineData("story-runs/sr_1/../sr_2/images/s01-a.png", false)]
    [InlineData("voice-profiles/vp_1/lines/x.wav", false)]
    [InlineData("", false)]
    [InlineData(null, false)]
    public void Only_a_key_inside_the_runs_own_folder_is_the_runs_to_delete(string? key, bool owned) =>
        Assert.Equal(owned, StoryObjectKeys.Owns("sr_1", key));
}

public sealed class StoryRunWarningsTests
{
    [Fact]
    public void A_warning_is_added_once_trimmed_and_bounded_and_blank_ones_are_ignored()
    {
        var run = StoryTestData.Run();

        StoryRunWarnings.Add(run, "  Check scene 3.  ");
        StoryRunWarnings.Add(run, "Check scene 3.");
        StoryRunWarnings.Add(run, "");
        StoryRunWarnings.Add(run, null);
        StoryRunWarnings.Add(run, new string('x', 2_000));

        Assert.Equal(2, run.Warnings.Count);
        Assert.Equal("Check scene 3.", run.Warnings[0]);
        Assert.Equal(603, run.Warnings[1].Length);
        Assert.EndsWith("...", run.Warnings[1]);
    }

    [Fact]
    public void The_list_stops_growing_at_its_limit()
    {
        var run = StoryTestData.Run();

        StoryRunWarnings.AddRange(run, Enumerable.Range(1, StoryRunWarnings.Max + 40).Select(i => $"warning {i}"));

        Assert.Equal(StoryRunWarnings.Max, run.Warnings.Count);
    }
}

public sealed class KitStageTests
{
    private sealed class Settings(AiSettings? stored) : IAiSettingsRepository
    {
        public Task<AiSettings?> GetAsync(CancellationToken ct) => Task.FromResult(stored);
        public Task SaveAsync(AiSettings settings, CancellationToken ct) => Task.CompletedTask;
    }

    private static StoryStageContext Context(StoryRun run) => new()
    {
        Run = run,
        Report = (_, _) => Task.CompletedTask,
        Save = () => Task.CompletedTask
    };

    /// <summary>A run of six scenes of twenty seconds: long enough that YouTube chapters can be cut (three or more, ten seconds apart, in a video of a minute or more).</summary>
    private static StoryRun FinishedRun()
    {
        var run = StoryTestData.Run(StoryRunStatus.Building, withScript: true);
        run.Options.Narration = StoryNarrationMode.Stock;
        foreach (var scene in run.Script!.Scenes)
        {
            scene.AudioSeconds = 20;
            scene.ImageSource = "placeholder";
        }

        run.SceneStarts = [.. run.Script.Scenes.Select((_, i) => i * 20.0)];
        run.TotalSeconds = run.Script.Scenes.Count * 20.0;
        return run;
    }

    [Fact]
    public async Task The_kit_is_written_from_the_timeline_the_project_was_built_with()
    {
        var run = FinishedRun();

        var outcome = await new KitStage(new Settings(null)).RunAsync(Context(run), CancellationToken.None);

        Assert.Equal(StoryStageResult.Completed, outcome.Result);
        var kit = run.Kit!;
        Assert.NotEmpty(kit.TitleOptions);
        Assert.All(kit.TitleOptions, t => Assert.True(t.Length <= 100));
        Assert.True(kit.DescriptionBytes is > 0 and <= 5_000);
        Assert.NotEmpty(kit.Tags);
        Assert.Equal("0:00", kit.Chapters[0].Stamp);
        Assert.Equal(0, kit.Chapters[0].StartSeconds);
    }

    [Theory]
    [InlineData("placeholder", true, false)]
    [InlineData("upload", true, true)]
    [InlineData("upload", false, false)]
    [InlineData("pollinations", false, true)]
    public async Task The_kit_discloses_ai_pictures_whether_the_app_made_them_or_the_person_says_theirs_are(string source, bool uploadsAreAi, bool expectedDisclosure)
    {
        var run = FinishedRun();
        run.Options.UploadsAreAiMade = uploadsAreAi;
        foreach (var scene in run.Script!.Scenes) scene.ImageSource = source;
        var withoutAi = FinishedRun();
        withoutAi.Options.UploadsAreAiMade = false;

        await new KitStage(new Settings(null)).RunAsync(Context(run), CancellationToken.None);
        await new KitStage(new Settings(null)).RunAsync(Context(withoutAi), CancellationToken.None);

        var disclosed = !run.Kit!.Checklist.SequenceEqual(withoutAi.Kit!.Checklist) || run.Kit.Description != withoutAi.Kit.Description;
        Assert.Equal(expectedDisclosure, disclosed);
    }

    [Fact]
    public async Task A_run_without_a_timeline_still_gets_a_kit_from_the_scenes_lengths()
    {
        var run = FinishedRun();
        run.SceneStarts = [];
        run.TotalSeconds = 0;

        await new KitStage(new Settings(null)).RunAsync(Context(run), CancellationToken.None);

        Assert.NotNull(run.Kit);
        Assert.NotEmpty(run.Kit.Chapters);
    }

    [Fact]
    public async Task Without_a_script_the_stage_fails_clearly()
    {
        var run = StoryTestData.Run(StoryRunStatus.Building);

        var error = await Assert.ThrowsAsync<StoryStageException>(() => new KitStage(new Settings(null)).RunAsync(Context(run), CancellationToken.None));

        Assert.Equal("no-script", error.Code);
    }
}
