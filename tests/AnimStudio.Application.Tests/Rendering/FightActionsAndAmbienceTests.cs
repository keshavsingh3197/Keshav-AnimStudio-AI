using AnimStudio.Application.Rendering;
using AnimStudio.Infrastructure.Rendering;

namespace AnimStudio.Application.Tests.Rendering;

public sealed class FightActionsAndAmbienceTests
{
    private static List<ProceduralDialogueTurn> Spoken(string script) =>
        [.. DialogueScriptParser.ParsePlan("Fight", script, null, 24, enableDialogue: true, "Raju", "Bablu", "FunnyComedy")
            .Turns.Where(t => !t.IsTitleHook)];

    [Fact]
    public void Fight_words_make_the_speaker_strike_and_the_listener_react()
    {
        var turns = Spoken("""
            [Raju]: अब तो मुक्का पड़ेगा तुझे!
            [Bablu]: Flying kick incoming, bhai!
            """);

        Assert.Equal("punching", turns[0].Action);
        Assert.Equal("hitReact", turns[0].ListenerAction);
        Assert.Equal("kicking", turns[1].Action);
        Assert.Equal("shockedFall", turns[1].ListenerAction);
        Assert.All(turns, t => Assert.NotEqual("closeUpSpeaker", t.CameraShot));
    }

    [Fact]
    public void Explicit_tags_set_fight_actions_and_strip_from_the_text()
    {
        var turns = Spoken("""
            [Raju]: Chal shuru karte hain.
            [Bablu]: (attack) Le dhishoom!
            [Raju]: (ouch) Arre dheere!
            """);

        Assert.Equal("punching", turns[1].Action);
        Assert.DoesNotContain("(attack)", turns[1].Text, StringComparison.OrdinalIgnoreCase);
        Assert.Equal("hitReact", turns[2].Action);
    }

    [Theory]
    [InlineData("आज का पंचांग देखो, शुभ मुहूर्त है।")]   // पंच inside पंचांग
    [InlineData("घर के हालात ठीक नहीं हैं।")]          // लात inside हालात
    [InlineData("पूरा परिवार रविवार को आएगा।")]         // वार inside परिवार / रविवार
    [InlineData("Yeh sunke toh heart attack aa jayega!")]
    [InlineData("Wear the white kurta today.")]       // hit inside white
    public void Everyday_words_that_contain_fight_syllables_do_not_start_a_fight(string line)
    {
        var turns = Spoken($"[Raju]: Suno.\n[Bablu]: {line}");

        Assert.DoesNotContain(turns, t => t.Action is "punching" or "kicking");
    }

    [Fact]
    public void Strike_impacts_follow_the_shared_clock_and_stay_inside_the_turn()
    {
        var hits = ProceduralStrikeTiming.ImpactTimes("punching", 2.0, 4.0);

        Assert.NotEmpty(hits);
        Assert.All(hits, h =>
        {
            Assert.InRange(h, 2.12, 3.85);
            var phase = h * ProceduralStrikeTiming.PunchRateHz % 1.0;
            Assert.Equal(ProceduralStrikeTiming.PunchImpactPhase, phase, 6);
        });
        Assert.Empty(ProceduralStrikeTiming.ImpactTimes("waving", 2.0, 4.0));
        Assert.Empty(ProceduralStrikeTiming.ImpactTimes("kicking", 2.0, 2.2));
    }

    [Theory]
    [InlineData(SceneSetting.ForestAshram, SceneTimeOfDay.Day, 4)] // Birds
    [InlineData(SceneSetting.RiverGhat, SceneTimeOfDay.Dawn, 2)] // Water
    [InlineData(SceneSetting.Himalaya, SceneTimeOfDay.Day, 1)] // Wind
    [InlineData(SceneSetting.ModernCity, SceneTimeOfDay.Day, 16)] // City
    [InlineData(SceneSetting.Village, SceneTimeOfDay.Night, 8)] // Crickets
    public void Outdoor_places_get_their_natural_sound_bed(SceneSetting setting, SceneTimeOfDay time, int expectedFlag)
    {
        Assert.True(ProceduralAudioSynthesizer.AmbienceFor(setting, time).HasFlag((ProceduralAudioSynthesizer.PlaceAmbience)expectedFlag));
    }

    [Theory]
    [InlineData(SceneSetting.Bedroom)]
    [InlineData(SceneSetting.Kitchen)]
    [InlineData(SceneSetting.ComedyStage)]
    [InlineData(SceneSetting.Auto)]
    public void Indoor_and_unknown_sets_stay_quiet(SceneSetting setting)
    {
        Assert.Equal(ProceduralAudioSynthesizer.PlaceAmbience.None, ProceduralAudioSynthesizer.AmbienceFor(setting, SceneTimeOfDay.Night));
    }

    [Fact]
    public async Task A_fight_in_a_forest_renders_hits_and_ambience_into_the_sfx_track()
    {
        var plan = DialogueScriptParser.ParsePlan("Forest Fight", """
            [SCENE]: forest | day | action
            [Raju]: (punch) Le dhishoom!
            [Bablu]: (ouch) Arre bas kar!
            """, null, 8, enableDialogue: true, "Raju", "Bablu", "FunnyComedy");
        var path = Path.Combine(Path.GetTempPath(), $"sfx-{Guid.NewGuid():N}.wav");
        try
        {
            await ProceduralAudioSynthesizer.WriteComedySfxWavAsync(path, plan, 8, CancellationToken.None);
            var bytes = await File.ReadAllBytesAsync(path);
            Assert.True(bytes.Length > 44 + 48_000 * 4 * 7);
            // Not silent: the forest bed and the punches put real signal into the PCM body.
            var loud = 0;
            for (var i = 44; i + 1 < bytes.Length; i += 2)
                if (Math.Abs(BitConverter.ToInt16(bytes, i)) > 300) loud++;
            Assert.True(loud > 2000, $"expected audible SFX, got {loud} loud samples");
        }
        finally
        {
            File.Delete(path);
        }
    }
}
