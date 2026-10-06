using AnimStudio.Application.Characters;
using AnimStudio.Application.Common;
using AnimStudio.Application.Projects;
using AnimStudio.Domain.Assets;
using AnimStudio.Domain.Characters;
using AnimStudio.Domain.Rendering;
using AnimStudio.Domain.Scenes;

namespace AnimStudio.Application.Tests.Editing;

public class ProjectEditingServiceTests
{
    private static UpdateProjectCommand Command(EditingWorld world) => new()
    {
        ProjectId = world.Project.Id,
        UserId = EditingWorld.UserId,
        Name = "Renamed",
        Width = 1920,
        Height = 1080,
        Fps = world.Project.Settings.FrameRateNum
    };

    [Fact]
    public async Task Changing_the_frame_rate_keeps_every_scene_the_same_length_in_seconds()
    {
        var world = new EditingWorld(fps: 30);

        var scene = world.AddScene(1, seconds: 5);
        scene.Dialogue.Add(new DialogueLine
        {
            Text = "Hello", RelativeStartFrame = 30, RelativeEndFrame = 90
        });
        scene.Characters.Add(new CharacterPlacement
        {
            CharacterId = "hero", PresenceStartFrame = 0, PresenceEndFrame = 150
        });
        scene.Animation = new AnimationSettings(
            BackgroundEffect.ZoomIn, 0.12, Easing.Linear, new FrameCount(15), new FrameCount(15));
        scene.TransitionDurationFrames = 15;

        await world.ProjectEditing.UpdateAsync(
            Command(world) with { Fps = 60 }, CancellationToken.None);

        // 5s stays 5s: every frame count doubles at twice the rate.
        Assert.Equal(300, scene.DurationFrames);
        Assert.Equal(60, scene.Dialogue[0].RelativeStartFrame);
        Assert.Equal(180, scene.Dialogue[0].RelativeEndFrame);
        Assert.Equal(300, scene.Characters[0].PresenceEndFrame);
        Assert.Equal(30, scene.Animation.FadeIn.Value);
        Assert.Equal(30, scene.TransitionDurationFrames);
    }

    [Fact]
    public async Task An_odd_canvas_is_rounded_up_because_yuv420p_needs_even_dimensions()
    {
        var world = new EditingWorld();

        var project = await world.ProjectEditing.UpdateAsync(
            Command(world) with { Width = 1921, Height = 1081 }, CancellationToken.None);

        Assert.Equal(1922, project.Settings.Width);
        Assert.Equal(1082, project.Settings.Height);
    }

    [Fact]
    public async Task The_music_bed_must_be_an_audio_file_from_this_project()
    {
        var world = new EditingWorld();
        world.AddAsset("picture", AssetKind.Image);

        var error = await Assert.ThrowsAsync<EditingException>(() =>
            world.ProjectEditing.UpdateAsync(
                Command(world) with { BackgroundMusicAssetId = "picture" }, CancellationToken.None));

        Assert.Equal("asset-wrong-kind", error.Code);
    }

    [Fact]
    public async Task Deleting_a_project_takes_its_scenes_characters_and_files_with_it()
    {
        var world = new EditingWorld();
        world.AddScene(1);
        world.AddCharacter("hero", "Hero");
        world.AddAsset("bg", AssetKind.Image);

        await world.ProjectEditing.DeleteAsync(
            world.Project.Id, EditingWorld.UserId, CancellationToken.None);

        Assert.Empty(world.Projects.Items);
        Assert.Empty(world.Scenes.Items);
        Assert.Empty(world.Characters.Items);
        Assert.Empty(world.Assets.Items);
        Assert.Equal(["projects/project-1/assets/bg"], world.Store.Deleted);
    }

    [Fact]
    public async Task Someone_elses_project_cannot_be_edited()
    {
        var world = new EditingWorld();

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            world.ProjectEditing.UpdateAsync(
                Command(world) with { UserId = EditingWorld.OtherUserId }, CancellationToken.None));
    }
}

public class CharacterEditingServiceTests
{
    [Fact]
    public async Task Deleting_a_character_hands_its_lines_to_the_narrator_and_unstages_it()
    {
        var world = new EditingWorld();
        world.AddCharacter("narrator", "Narrator", isNarrator: true);
        world.AddCharacter("hero", "Hero");

        var scene = world.AddScene(1);
        scene.Dialogue.Add(new DialogueLine { SpeakerCharacterId = "hero", Text = "Mine" });
        scene.Characters.Add(new CharacterPlacement { CharacterId = "hero" });

        var touched = await world.CharacterEditing.DeleteAsync(
            "hero", EditingWorld.UserId, CancellationToken.None);

        Assert.Equal(1, touched);
        Assert.Empty(scene.Characters);
        Assert.Equal("narrator", scene.Dialogue[0].SpeakerCharacterId);
        Assert.Equal("Mine", scene.Dialogue[0].Text);
        Assert.DoesNotContain(world.Characters.Items, c => c.Id == "hero");
    }

    [Fact]
    public async Task The_narrator_cannot_be_deleted()
    {
        var world = new EditingWorld();
        world.AddCharacter("narrator", "Narrator", isNarrator: true);

        var error = await Assert.ThrowsAsync<EditingException>(() =>
            world.CharacterEditing.DeleteAsync(
                "narrator", EditingWorld.UserId, CancellationToken.None));

        Assert.Equal("narrator-required", error.Code);
    }

    [Fact]
    public async Task A_sprite_must_be_an_image_from_this_project()
    {
        var world = new EditingWorld();
        world.AddAsset("song", AssetKind.Audio);

        var error = await Assert.ThrowsAsync<EditingException>(() =>
            world.CharacterEditing.UpsertAsync(new UpsertCharacterCommand
            {
                ProjectId = world.Project.Id,
                UserId = EditingWorld.UserId,
                Name = "Hero",
                ClosedMouthAssetId = "song"
            }, CancellationToken.None));

        Assert.Equal("asset-wrong-kind", error.Code);
    }

    [Fact]
    public async Task A_subtitle_colour_must_be_a_hex_value()
    {
        var world = new EditingWorld();

        var error = await Assert.ThrowsAsync<EditingException>(() =>
            world.CharacterEditing.UpsertAsync(new UpsertCharacterCommand
            {
                ProjectId = world.Project.Id,
                UserId = EditingWorld.UserId,
                Name = "Hero",
                SubtitleColorHex = "yellow"
            }, CancellationToken.None));

        Assert.Equal("colour-invalid", error.Code);
    }

    [Fact]
    public async Task A_voice_is_saved_with_the_character()
    {
        var world = new EditingWorld();

        var saved = await world.CharacterEditing.UpsertAsync(
            VoiceCommand(world, new CharacterVoiceCommand
            {
                Enabled = true, Preset = "divine", PitchSemitones = -3, BassDecibels = 4, Reverb = 0.6
            }), CancellationToken.None);

        Assert.NotNull(saved.Voice);
        Assert.Equal("divine", saved.Voice.Preset);
        Assert.Equal(-3, saved.Voice.PitchSemitones);
        Assert.Equal(0.6, saved.Voice.Reverb);
    }

    [Fact]
    public async Task Leaving_the_voice_out_keeps_it_and_disabling_it_clears_it()
    {
        var world = new EditingWorld();
        var hero = world.AddCharacter("hero", "Hero");
        hero.Voice = new CharacterVoice { Preset = "giant", PitchSemitones = -9 };

        var kept = await world.CharacterEditing.UpsertAsync(
            VoiceCommand(world, null) with { CharacterId = "hero" }, CancellationToken.None);
        Assert.Equal(-9, kept.Voice?.PitchSemitones);

        var cleared = await world.CharacterEditing.UpsertAsync(
            VoiceCommand(world, new CharacterVoiceCommand { Enabled = false, PitchSemitones = 99 })
                with { CharacterId = "hero" }, CancellationToken.None);
        Assert.Null(cleared.Voice);
    }

    [Theory]
    [InlineData(13, 0, 60, "voice-out-of-range")]
    [InlineData(0, 1.5, 60, "voice-out-of-range")]
    [InlineData(0, 0, 5, "voice-out-of-range")]
    [InlineData(double.NaN, 0, 60, "voice-out-of-range")]
    public async Task A_voice_out_of_range_is_refused_rather_than_clamped(
        double pitch, double reverb, double robotHertz, string code)
    {
        var world = new EditingWorld();

        var error = await Assert.ThrowsAsync<EditingException>(() =>
            world.CharacterEditing.UpsertAsync(
                VoiceCommand(world, new CharacterVoiceCommand
                {
                    Enabled = true, PitchSemitones = pitch, Reverb = reverb, RobotHertz = robotHertz
                }), CancellationToken.None));

        Assert.Equal(code, error.Code);
        Assert.Empty(world.Characters.Items);
    }

    [Fact]
    public async Task A_voice_preset_name_is_a_short_lowercase_slug()
    {
        var world = new EditingWorld();

        var error = await Assert.ThrowsAsync<EditingException>(() =>
            world.CharacterEditing.UpsertAsync(
                VoiceCommand(world, new CharacterVoiceCommand { Enabled = true, Preset = "<b>Divine</b>" }),
                CancellationToken.None));

        Assert.Equal("voice-preset-invalid", error.Code);
    }

    private static UpsertCharacterCommand VoiceCommand(EditingWorld world, CharacterVoiceCommand? voice) => new()
    {
        ProjectId = world.Project.Id,
        UserId = EditingWorld.UserId,
        Name = "Hero",
        Voice = voice
    };
}

public class AssetLibraryServiceTests
{
    [Fact]
    public async Task A_file_still_used_as_a_background_cannot_be_deleted()
    {
        var world = new EditingWorld();
        world.AddAsset("bg", AssetKind.Image);
        world.AddScene(1, backgroundAssetId: "bg");

        var error = await Assert.ThrowsAsync<EditingException>(() =>
            world.AssetLibrary.DeleteAsync("bg", EditingWorld.UserId, CancellationToken.None));

        Assert.Equal("asset-in-use", error.Code);
        Assert.Contains("scene 1", error.Message);
        Assert.NotEmpty(world.Assets.Items);
    }

    [Fact]
    public async Task A_file_used_by_a_character_cannot_be_deleted()
    {
        var world = new EditingWorld();
        world.AddAsset("sprite", AssetKind.Image);

        var hero = world.AddCharacter("hero", "Hero");
        hero.Sprites.ClosedMouthAssetId = "sprite";

        var error = await Assert.ThrowsAsync<EditingException>(() =>
            world.AssetLibrary.DeleteAsync("sprite", EditingWorld.UserId, CancellationToken.None));

        Assert.Equal("asset-in-use", error.Code);
        Assert.Contains("Hero", error.Message);
    }

    [Fact]
    public async Task An_unused_file_is_removed_from_both_the_database_and_the_store()
    {
        var world = new EditingWorld();
        world.AddAsset("spare", AssetKind.Image);

        await world.AssetLibrary.DeleteAsync("spare", EditingWorld.UserId, CancellationToken.None);

        Assert.Empty(world.Assets.Items);
        Assert.Equal(["projects/project-1/assets/spare"], world.Store.Deleted);
    }

    [Fact]
    public async Task A_file_in_someone_elses_project_cannot_be_deleted()
    {
        var world = new EditingWorld();
        world.AddAsset("spare", AssetKind.Image);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            world.AssetLibrary.DeleteAsync("spare", EditingWorld.OtherUserId, CancellationToken.None));
    }
}
