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

    [Fact]
    public async Task BarberShop_role_lock_prevents_overlap_strips_mouth_sfx_and_emits_real_scissor_audio()
    {
        var plan = DialogueScriptParser.ParsePlan("सैलून कटिंग कांड", """
            [SCENE]: barber | afternoon | comedy
            [पप्पू ग्राहक]: अमरेंद्र भाई, आज एकदम शाही बाहुबली कटिंग करना!
            [अमरेंद्र नाई]: चक-चक-चक! ले पहला झटका!
            [पप्पू ग्राहक]: ख्र्र्र... मैं तो जन्नत पहुँच गया!
            """, null, 18, enableDialogue: true, "पप्पू ग्राहक", "अमरेंद्र नाई", "FunnyComedy");

        var turns = plan.Turns.Where(t => !t.IsTitleHook).ToList();
        Assert.Equal(3, turns.Count);

        // Customer asking for "कटिंग करना" stays on barberChair (NO scissors, NO barberStand overlap!)
        Assert.Equal("barberChair", turns[0].StageTarget);
        Assert.DoesNotContain("scissors", turns[0].SpeakerProp ?? string.Empty);
        Assert.Equal("scissors", turns[0].ListenerProp);

        // Barber holds scissors on barberStand; sound effects never get read from mouth in TTS text!
        Assert.Equal("barberStand", turns[1].StageTarget);
        Assert.Equal("scissors", turns[1].SpeakerProp);
        var spokenCut = DialogueScriptParser.ToSpokenText(turns[1].Text, "hi");
        Assert.DoesNotContain("चक", spokenCut);
        Assert.Contains("पहला झटका", spokenCut);

        var spokenSnore = DialogueScriptParser.ToSpokenText(turns[2].Text, "hi");
        Assert.DoesNotContain("ख्र्र", spokenSnore);
        Assert.Contains("जन्नत", spokenSnore);

        // Real stainless-steel scissor & snore SFX waveforms are still generated from original turns!
        var path = Path.Combine(Path.GetTempPath(), $"salon-sfx-{Guid.NewGuid():N}.wav");
        try
        {
            await ProceduralAudioSynthesizer.WriteComedySfxWavAsync(path, plan, 18, CancellationToken.None, comedyIntensity: true);
            var bytes = await File.ReadAllBytesAsync(path);
            var peaks = 0;
            for (var i = 44; i + 1 < bytes.Length; i += 2)
                if (Math.Abs(BitConverter.ToInt16(bytes, i)) > 600) peaks++;
            Assert.True(peaks > 1500, $"expected crisp scissor & snore SFX samples, got {peaks}");
        }
        finally
        {
            File.Delete(path);
        }
    }

    [Fact]
    public void Comedy_visual_continuity_tracks_ulta_to_sidha_chasma_towel_pull_and_mirror_look()
    {
        var plan = DialogueScriptParser.ParsePlan("Ulta Chasma Salon", """
            [SCENE]: barber | day | comedy
            [पप्पू ग्राहक]: अमरेंद्र भाई, आज एकदम शाही कटिंग करना!
            [अमरेंद्र नाई]: (cutting) चक-चक-चक! देख कैसा जादू करता हूँ!
            [पप्पू ग्राहक]: अरे तौलिया तो हटा! ये क्या कर दिया बे?!
            [अमरेंद्र नाई]: ओह तेरी! चश्मा उल्टा पहना था मैंने!
            [चुन्नू चाचा]: (laughing) अरे भैया शीशे में देख ले, लालटेन लग रहा है!
            """, null, 24, enableDialogue: true, "पप्पू ग्राहक", "अमरेंद्र नाई", "FunnyComedy");

        // Barber confessed "चश्मा उल्टा पहना था मैंने" -> gets glasses wearing 'ulta' before confession, 'flipping' on it, 'normal' after!
        Assert.True(plan.RightCharacter?.HasGlasses);
        var turns = plan.Turns.Where(t => !t.IsTitleHook).ToList();
        Assert.Equal("ulta", turns[0].ListenerGlasses); // Turn 0 (Left speaks): Barber listener wears ulta!
        Assert.Equal("ulta", turns[1].SpeakerGlasses);  // Turn 1 (Barber cuts): Barber wears ulta!
        Assert.Equal("towel", turns[2].SpeakerProp);    // Turn 2: removing towel explicitly yields towel prop!
        Assert.Equal("removingTowel", turns[2].Action);
        Assert.Equal("flipping", turns[3].SpeakerGlasses); // Turn 3: Barber flips chasma ulta -> sidha!
        Assert.Equal("adjustingGlasses", turns[3].Action);
        Assert.Equal("normal", turns[4].ListenerGlasses);  // Turn 4+: Barber wears sidha/normal!
        Assert.Equal("lookInMirror", turns[4].ListenerAction); // Customer turns to mirror!
    }
}
