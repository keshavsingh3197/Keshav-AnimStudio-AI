using AnimStudio.Application.Rendering;
using AnimStudio.Infrastructure.Automation;
using AnimStudio.Infrastructure.Rendering;
using Xunit;

namespace AnimStudio.Application.Tests.Automation;

public sealed class SceneDirectiveTemplateTests
{
    private const string DirectedScript = """
        [CAST]: बालक ध्रुव | child | saffron dhoti, small gold crown
        [CAST]: देवर्षि नारद | sage | white robes, veena
        [CAST]: रानी सुनीति | queen/mother | maroon saree, gold border
        [SCENE]: palace court | day | tense | IMAGE: carved marble royal court with silk drapes
        [सूत्रधार]: राजा उत्तानपाद के महल में एक छोटे बालक का दिल टूट गया।
        [रानी सुनीति]: बेटा ध्रुव, सच्चा सिंहासन भगवान की गोद है, उसे तपस्या से पाओ।
        [बालक ध्रुव]: माँ, मैं वन जाकर भगवान विष्णु की तपस्या करूँगा।
        [SCENE]: forest ashram | dawn | serene | IMAGE: misty forest hermitage under banyan trees
        [देवर्षि नारद]: बालक, यह वन बहुत कठिन है, क्या तुम डरते नहीं?
        [बालक ध्रुव]: नहीं देवर्षि, मुझे केवल प्रभु का दर्शन चाहिए।
        [सूत्रधार]: सच्ची लगन से ध्रुव अमर ध्रुव तारा बन गए।
        """;

    [Fact]
    public void CleanPastedDialogue_keeps_scene_and_cast_directions_without_counting_them_as_dialogue()
    {
        var cleaned = EcosystemAutomationService.CleanPastedDialogue("Sure! Here it is:\n" + DirectedScript + "\nEnjoy.");

        Assert.NotNull(cleaned);
        var lines = cleaned!.Split('\n');
        Assert.Equal(3, lines.Count(l => l.StartsWith("[CAST]: ", StringComparison.Ordinal)));
        Assert.Equal(2, lines.Count(l => l.StartsWith("[SCENE]: ", StringComparison.Ordinal)));
        Assert.Equal(6, lines.Count(l => !l.StartsWith("[CAST]", StringComparison.Ordinal) && !l.StartsWith("[SCENE]", StringComparison.Ordinal)));

        // Directions alone are not a script.
        Assert.Null(EcosystemAutomationService.CleanPastedDialogue("[SCENE]: temple | dawn\n[CAST]: A | king\n[Narrator]: one line"));
    }

    [Fact]
    public void ParsePlan_applies_scene_cues_cast_roles_robes_and_supporting_cast_and_never_speaks_directions()
    {
        var plan = DialogueScriptParser.ParsePlan("ध्रुव की तपस्या", DirectedScript, null, 70, enableDialogue: true);

        Assert.True(plan.HasCharacters);
        Assert.DoesNotContain(plan.Turns, t => t.Text.Contains("IMAGE", StringComparison.Ordinal) || t.Text.Contains("saffron", StringComparison.Ordinal));

        // Two distinct scenes in script order, palace first.
        Assert.Equal(2, plan.SceneCueOrder.Count);
        Assert.Equal(SceneSetting.PalaceCourt, SceneDirectives.FromCue(plan.SceneCueOrder[0]).Setting);
        Assert.Equal((SceneSetting.ForestAshram, SceneTimeOfDay.Dawn), SceneDirectives.FromCue(plan.SceneCueOrder[1]));
        Assert.Equal(plan.SceneCueOrder[0], plan.Turns[0].SceneBackdropCue);
        var naradTurn = plan.Turns.First(t => t.SpeakerName == "देवर्षि नारद");
        Assert.Equal(SceneSetting.ForestAshram, SceneDirectives.FromCue(naradTurn.SceneBackdropCue).Setting);

        Assert.Equal(2, plan.Scenes!.Count);
        Assert.Contains("marble royal court", plan.Scenes[0].ImagePrompt);

        // Cast roles and colours from [CAST]; the third speaker becomes supporting cast.
        var all = new[] { plan.LeftCharacter!, plan.RightCharacter! }.Concat(plan.Supporting).ToList();
        var dhruv = all.Single(c => c.Name == "बालक ध्रुव");
        Assert.Equal(CharacterVisualRole.ChildDevotee, dhruv.Role);
        Assert.Equal("#D9661A", dhruv.RobeHex);
        Assert.Equal(CharacterVisualRole.NobleWoman, all.Single(c => c.Name == "रानी सुनीति").Role);
        Assert.Equal(CharacterVisualRole.SageRishi, all.Single(c => c.Name == "देवर्षि नारद").Role);
        Assert.Single(plan.Supporting);
    }

    [Fact]
    public void Scene_inference_matches_whole_words_only()
    {
        // "जीवन" (life) must not read as "वन" (forest); "toward" must not read as "war".
        Assert.Equal(SceneSetting.Auto, SceneDirectives.InferSetting("यह जीवन का सबसे बड़ा सबक है"));
        Assert.Equal(SceneSetting.Auto, SceneDirectives.InferSetting("They walked toward the light"));
        Assert.Equal(SceneSetting.ForestAshram, SceneDirectives.InferSetting("ध्रुव घने वन में चले गए"));
        Assert.Equal(SceneSetting.Temple, SceneDirectives.InferSetting("the temple by the river"));
        Assert.Equal(SceneSetting.RiverGhat, SceneDirectives.InferSetting("गंगा के घाट पर मंदिरों की आरती"));
    }

    [Fact]
    public void ParsePlan_without_scene_lines_moves_the_stage_when_dialogue_names_a_place()
    {
        const string script = """
            [सूत्रधार]: आज की कथा एक राजमहल से शुरू होती है।
            [ध्रुव]: माँ, मुझे पिता की गोद क्यों नहीं मिली?
            [नारद]: बालक, घने वन में जाकर तपस्या करो।
            [ध्रुव]: मैं प्रभु के दर्शन तक नहीं रुकूँगा।
            """;
        var plan = DialogueScriptParser.ParsePlan("ध्रुव", script, null, 40, enableDialogue: true);

        Assert.Equal(SceneSetting.PalaceCourt, SceneDirectives.FromCue(plan.Turns[1].SceneBackdropCue).Setting);
        Assert.Equal(SceneSetting.ForestAshram, SceneDirectives.FromCue(plan.Turns[^1].SceneBackdropCue).Setting);
    }

    [Fact]
    public void Rasterizer_renders_directed_scenes_with_supporting_cast_and_photo_backdrops()
    {
        var plan = DialogueScriptParser.ParsePlan("ध्रुव की तपस्या", DirectedScript, null, 20, enableDialogue: true);
        var palette = ProceduralEventPalette.Resolve("DailyKatha", ProceduralSceneTheme.Auto);

        var painted = new ProceduralSceneRasterizer(180, 320, ProceduralSceneTheme.VedicTempleSunrise3D, 7, palette, plan);
        var first = painted.RenderFrame(0.5, 20).ToArray();
        var last = painted.RenderFrame(19.0, 20).ToArray();
        Assert.NotEqual(first, last); // palace court vs forest ashram

        var photo = new byte[180 * 320 * 4];
        for (var i = 0; i < photo.Length; i += 4) { photo[i] = 40; photo[i + 1] = 120; photo[i + 2] = 200; photo[i + 3] = 255; }
        var withPhotos = new ProceduralSceneRasterizer(180, 320, ProceduralSceneTheme.VedicTempleSunrise3D, 7, palette, plan,
            backdropFrames: [photo, photo]);
        var a = withPhotos.RenderFrame(1.0, 20).ToArray();
        var b = withPhotos.RenderFrame(9.0, 20).ToArray();
        Assert.Equal(180 * 320 * 4, a.Length);
        Assert.NotEqual(a, b); // Ken Burns motion + characters move
    }

    [Fact]
    public void Scene_image_prompt_uses_the_directive_and_always_asks_for_an_empty_photoreal_plate()
    {
        var scene = SceneDirectives.ParseScene("river ghat | night | devotional | IMAGE: Varanasi ghats with floating lamps");
        var prompt = EcosystemAutomationService.BuildSceneImagePrompt(scene, scene.Setting, scene.TimeOfDay);

        Assert.StartsWith("Varanasi ghats with floating lamps", prompt);
        Assert.Contains("moonlit night", prompt);
        Assert.Contains("no people", prompt);

        var fallback = EcosystemAutomationService.BuildSceneImagePrompt(null, SceneSetting.Himalaya, SceneTimeOfDay.Dawn);
        Assert.Contains("Himalayan", fallback);
    }

    [Fact]
    public void Dialogue_template_asks_for_cast_scenes_images_and_supporting_characters()
    {
        var post = new AnimStudio.Domain.Automation.AutomationPost
        {
            Title = "ध्रुव की तपस्या",
            SourceTitle = "Dhruva",
            Script = "[सूत्रधार]: draft",
            Language = "hi",
            TargetSeconds = 60
        };
        var prompt = EcosystemAutomationService.BuildDialogueTemplatePrompt(post, null);

        Assert.Contains("[CAST]:", prompt);
        Assert.Contains("[SCENE]:", prompt);
        Assert.Contains("IMAGE:", prompt);
        Assert.Contains("supporting characters", prompt);
        Assert.Contains("9:16 tall vertical frame", prompt);
    }

    private const string RepeatedPlaceScript = """
        [SCENE]: palace court | day | calm | IMAGE: royal court at peace, king on the throne
        [Narrator]: The king held court on a bright, quiet morning in the old palace.
        [King]: Bring the humble visitor in, I wish to hear him speak today.
        [SCENE]: palace court | day | tense | IMAGE: same royal court, guards blocking the great carved doors
        [Guard]: Majesty, the beggar at the gate claims he is your childhood friend.
        [King]: Then open the doors at once and let my friend walk in.
        [SCENE]: forest ashram | dawn | warm | IMAGE: hermitage clearing where two boys once studied
        [Narrator]: Long ago, two boys had shared everything in a forest school.
        """;

    [Fact]
    public void Every_directed_scene_gets_its_own_picture_even_when_place_and_light_repeat()
    {
        var plan = DialogueScriptParser.ParsePlan("Friends", RepeatedPlaceScript, null, 60, enableDialogue: true);

        Assert.Equal(3, plan.SceneCueOrder.Count);
        Assert.Equal([1, 2, 3], plan.SceneCueOrder.Select(c => SceneDirectives.SceneNumber(c)!.Value));
        // The setting and light are still read from a numbered cue.
        Assert.Equal((SceneSetting.PalaceCourt, SceneTimeOfDay.Day), SceneDirectives.FromCue(plan.SceneCueOrder[1]));
        Assert.Null(SceneDirectives.SceneNumber(SceneDirectives.ToCue(SceneSetting.Temple, SceneTimeOfDay.Dawn)));
    }

    [Fact]
    public void Scene_picture_plan_lists_one_prompt_per_scene_in_render_order_with_a_numbered_batch_prompt()
    {
        var post = new AnimStudio.Domain.Automation.AutomationPost { Title = "Friends", Language = "en" };
        var plan = EcosystemAutomationService.BuildScenePicturePlan(post, RepeatedPlaceScript);

        Assert.Equal("9:16", plan.AspectRatio);
        Assert.Equal(3, plan.Scenes.Count);
        Assert.StartsWith("same royal court, guards blocking", plan.Scenes[1].Prompt);
        Assert.Contains("Create 3 separate images", plan.BatchPrompt);
        Assert.Contains("2. same royal court", plan.BatchPrompt);
        Assert.Contains("3. hermitage clearing", plan.BatchPrompt);

        var none = EcosystemAutomationService.BuildScenePicturePlan(post, "[Narrator]: no scenes here at all, only words.");
        Assert.Empty(none.Scenes);
        Assert.Equal(string.Empty, none.BatchPrompt);
    }
}
