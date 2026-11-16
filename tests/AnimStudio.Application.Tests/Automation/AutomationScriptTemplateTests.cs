using AnimStudio.Domain.Automation;
using AnimStudio.Infrastructure.Automation;
using Xunit;

namespace AnimStudio.Application.Tests.Automation;

public sealed class AutomationScriptTemplateTests
{
    [Fact]
    public void CleanPastedDialogue_keeps_only_speaker_lines_from_a_chat_reply()
    {
        const string reply = """
            Here is your script!
            ```
            **[सूत्रधार]**: 1875 में आज ही के दिन एक वीर का जन्म हुआ।
            - [बिरसा मुंडा]: यह जंगल हमारा है, हम इसे नहीं छोड़ेंगे।
            [ग्रामीण]: बिरसा, अंग्रेज़ों की सेना आ रही है!
            ## Notes
            [सूत्रधार]: बिरसा मुंडा का साहस आज भी हमें प्रेरणा देता है।
            ```
            Hope this helps.
            """;

        var cleaned = EcosystemAutomationService.CleanPastedDialogue(reply);

        Assert.NotNull(cleaned);
        var lines = cleaned!.Split('\n');
        Assert.Equal(4, lines.Length);
        Assert.StartsWith("[सूत्रधार]: 1875", lines[0]);
        Assert.StartsWith("[बिरसा मुंडा]: ", lines[1]);
        Assert.DoesNotContain(lines, l => l.Contains("```") || l.Contains("Notes") || l.Contains("**"));
    }

    [Fact]
    public void CleanPastedDialogue_rejects_replies_without_enough_dialogue()
    {
        Assert.Null(EcosystemAutomationService.CleanPastedDialogue("Just a paragraph of prose.\n[Narrator]: one line only."));
    }

    [Fact]
    public void CleanPastedDialogue_caps_the_number_of_turns()
    {
        var reply = string.Join('\n', Enumerable.Range(1, 200).Select(i => $"[Narrator]: line number {i} of the story"));

        var cleaned = EcosystemAutomationService.CleanPastedDialogue(reply);

        Assert.Equal(EcosystemAutomationService.MaxPastedDialogueTurns, cleaned!.Split('\n').Length);
    }

    private static AutomationPost Post(int? targetSeconds = 55, AutomationVideoFormat format = AutomationVideoFormat.Vertical) => new()
    {
        Title = "15 नवंबर 1875: बिरसा मुंडा जयंती",
        SourceTitle = "1875 - Birsa Munda Jayanti",
        Script = "[सूत्रधार]: 15 नवंबर 1875 को बिरसा मुंडा का जन्म हुआ।",
        Language = "hi",
        Format = format,
        TargetSeconds = targetSeconds,
    };

    [Fact]
    public void Full_16x9_video_may_run_up_to_ten_minutes()
    {
        var post = Post(55, AutomationVideoFormat.Wide);

        Assert.Equal(600, EcosystemAutomationService.ResolvePostTargetSeconds(post, null, AutomationNarrativeMode.Auto, 600));
        Assert.Equal(600, EcosystemAutomationService.ResolvePostTargetSeconds(post, null, AutomationNarrativeMode.Auto, 5000));
        Assert.Equal(420, EcosystemAutomationService.ResolvePostTargetSeconds(Post(420, AutomationVideoFormat.Wide), null, AutomationNarrativeMode.Auto, 0));
    }

    [Fact]
    public void Shorts_stay_within_youtubes_three_minute_limit()
    {
        Assert.Equal(180, EcosystemAutomationService.ResolvePostTargetSeconds(Post(55), null, AutomationNarrativeMode.Auto, 600));
        // A length saved while the post was a full video is capped once it is switched back to a Short.
        Assert.Equal(180, EcosystemAutomationService.ResolvePostTargetSeconds(Post(420), null, AutomationNarrativeMode.Auto, 0));
        Assert.Equal(180, EcosystemAutomationService.ResolvePostTargetSeconds(Post(55, AutomationVideoFormat.CommunityPost), null, AutomationNarrativeMode.Auto, 600));
    }

    [Fact]
    public void Ten_minute_full_video_template_asks_for_the_whole_story()
    {
        var prompt = EcosystemAutomationService.BuildDialogueTemplatePrompt(Post(55, AutomationVideoFormat.Wide), null, 600);
        var b = EcosystemAutomationService.DialogueBudget(600);

        Assert.Contains("600-second (10:00 min) complete story as an animated 3D YouTube video (16:9)", prompt);
        Assert.True(b.MinLines >= 65, $"10 minutes needs about 72 lines, got {b.MinLines}");
        Assert.True(b.MaxLines <= EcosystemAutomationService.MaxPastedDialogueTurns, "every line asked for must survive the paste");
        Assert.Equal(AnimStudio.Application.Rendering.DialogueScriptParser.MaxScenes, b.MaxScenes);
    }

    [Fact]
    public void Dialogue_template_uses_the_length_picked_in_the_wizard_over_the_saved_one()
    {
        var prompt = EcosystemAutomationService.BuildDialogueTemplatePrompt(Post(55), rule: null, explicitSeconds: 180);

        Assert.Contains("180-second (3:00 min) complete story", prompt);
        Assert.DoesNotContain("55-second", prompt);
    }

    [Fact]
    public void Dialogue_template_falls_back_to_the_post_length_when_none_is_picked()
    {
        var prompt = EcosystemAutomationService.BuildDialogueTemplatePrompt(Post(55), rule: null);

        Assert.Contains("55-second (0:55 min) short story", prompt);
    }

    [Fact]
    public void Dialogue_template_scales_scenes_and_lines_with_the_length()
    {
        var shortPrompt = EcosystemAutomationService.BuildDialogueTemplatePrompt(Post(), null, 55);
        var longPrompt = EcosystemAutomationService.BuildDialogueTemplatePrompt(Post(), null, 180);
        var s = EcosystemAutomationService.DialogueBudget(55);
        var l = EcosystemAutomationService.DialogueBudget(180);

        Assert.True(l.MinLines > s.MaxLines, "a 3-minute story needs more dialogue than a 55-second one");
        Assert.True(l.MinScenes > s.MinScenes);
        Assert.True(l.Words >= 400 && l.Words <= 460, $"180s should be about 430 words, was {l.Words}");
        Assert.Contains($"Write {l.MinLines} to {l.MaxLines} dialogue lines", longPrompt);
        Assert.Contains($"Split the story into {l.MinScenes} to {l.MaxScenes} scenes", longPrompt);
        Assert.Contains($"Write {s.MinLines} to {s.MaxLines} dialogue lines", shortPrompt);
    }

    [Theory]
    [InlineData(25)]
    [InlineData(55)]
    [InlineData(90)]
    [InlineData(145)]
    [InlineData(180)]
    [InlineData(300)]
    [InlineData(600)]
    public void Dialogue_budget_always_fits_what_the_paste_parser_keeps(int seconds)
    {
        var maxScenes = AnimStudio.Application.Rendering.DialogueScriptParser.MaxScenes;
        var b = EcosystemAutomationService.DialogueBudget(seconds);

        Assert.InRange(b.MinScenes, 2, maxScenes);
        Assert.InRange(b.MaxScenes, b.MinScenes, maxScenes);
        Assert.InRange(b.MaxLines, b.MinLines, EcosystemAutomationService.MaxPastedDialogueTurns);
        Assert.True(b.MinLines >= 5);
    }
}
