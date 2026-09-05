using AnimStudio.Application.Common;
using AnimStudio.Application.Scenes;
using AnimStudio.Domain.Assets;
using AnimStudio.Domain.Rendering;
using AnimStudio.Domain.Scenes;

namespace AnimStudio.Application.Tests.Editing;

public class SceneEditingServiceTests
{
    // --- creating and ordering ---------------------------------------------------

    [Fact]
    public async Task Creating_a_scene_appends_it_and_renumbers()
    {
        var world = new EditingWorld();
        world.AddScene(1);
        world.AddScene(2);

        var created = await world.SceneEditing.CreateAsync(new CreateSceneCommand
        {
            ProjectId = world.Project.Id,
            UserId = EditingWorld.UserId,
            Title = "Third",
            DurationSeconds = 4
        }, CancellationToken.None);

        Assert.Equal(SceneOrigin.Manual, created.Origin);
        Assert.Equal(world.Frames(4), created.DurationFrames);

        var order = await world.SceneEditing.ListAsync(
            world.Project.Id, EditingWorld.UserId, CancellationToken.None);

        Assert.Equal(["Scene 1", "Scene 2", "Third"], order.Select(s => s.Title));
        Assert.Equal([1, 2, 3], order.Select(s => s.SceneNumber));
    }

    [Fact]
    public async Task Creating_after_a_scene_inserts_between_its_neighbours()
    {
        var world = new EditingWorld();
        world.AddScene(1);
        world.AddScene(2);
        world.AddScene(3);

        await world.SceneEditing.CreateAsync(new CreateSceneCommand
        {
            ProjectId = world.Project.Id,
            UserId = EditingWorld.UserId,
            Title = "Inserted",
            AfterSceneId = "scene-1"
        }, CancellationToken.None);

        var order = await world.SceneEditing.ListAsync(
            world.Project.Id, EditingWorld.UserId, CancellationToken.None);

        Assert.Equal(["Scene 1", "Inserted", "Scene 2", "Scene 3"], order.Select(s => s.Title));
        Assert.Equal([1, 2, 3, 4], order.Select(s => s.SceneNumber));
    }

    [Fact]
    public async Task Deleting_a_scene_closes_the_gap_in_the_numbering()
    {
        var world = new EditingWorld();
        world.AddScene(1);
        world.AddScene(2);
        world.AddScene(3);

        await world.SceneEditing.DeleteAsync("scene-2", EditingWorld.UserId, CancellationToken.None);

        var order = await world.SceneEditing.ListAsync(
            world.Project.Id, EditingWorld.UserId, CancellationToken.None);

        Assert.Equal(["Scene 1", "Scene 3"], order.Select(s => s.Title));
        Assert.Equal([1, 2], order.Select(s => s.SceneNumber));
    }

    [Fact]
    public async Task Reordering_rewrites_both_the_sort_key_and_the_display_number()
    {
        var world = new EditingWorld();
        world.AddScene(1);
        world.AddScene(2);
        world.AddScene(3);

        await world.SceneEditing.ReorderAsync(
            world.Project.Id, EditingWorld.UserId, ["scene-3", "scene-1", "scene-2"],
            CancellationToken.None);

        var order = await world.SceneEditing.ListAsync(
            world.Project.Id, EditingWorld.UserId, CancellationToken.None);

        Assert.Equal(["Scene 3", "Scene 1", "Scene 2"], order.Select(s => s.Title));
        Assert.Equal([1, 2, 3], order.Select(s => s.SceneNumber));
    }

    [Fact]
    public async Task Reordering_refuses_a_list_that_does_not_name_every_scene()
    {
        var world = new EditingWorld();
        world.AddScene(1);
        world.AddScene(2);

        var error = await Assert.ThrowsAsync<EditingException>(() =>
            world.SceneEditing.ReorderAsync(
                world.Project.Id, EditingWorld.UserId, ["scene-1"], CancellationToken.None));

        Assert.Equal("order-mismatch", error.Code);
    }

    [Fact]
    public async Task Another_users_project_is_never_readable()
    {
        var world = new EditingWorld();
        world.AddScene(1);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            world.SceneEditing.ListAsync(
                world.Project.Id, EditingWorld.OtherUserId, CancellationToken.None));
    }

    // --- duration changes drag everything inside the scene with them --------------

    [Fact]
    public async Task Shortening_a_scene_pulls_its_dialogue_and_staging_inside_the_new_length()
    {
        var world = new EditingWorld();
        var scene = world.AddScene(1, seconds: 10);

        scene.Dialogue.Add(new DialogueLine
        {
            Text = "A line that ran to the end",
            RelativeStartFrame = world.Frames(6),
            RelativeEndFrame = world.Frames(10)
        });

        scene.Characters.Add(new CharacterPlacement
        {
            CharacterId = "hero",
            PresenceStartFrame = 0,
            PresenceEndFrame = world.Frames(10)
        });

        await world.SceneEditing.UpdateAsync(new UpdateSceneCommand
        {
            SceneId = scene.Id,
            UserId = EditingWorld.UserId,
            DurationSeconds = 4
        }, CancellationToken.None);

        Assert.Equal(world.Frames(4), scene.DurationFrames);
        Assert.Equal(world.Frames(4), scene.Dialogue[0].RelativeEndFrame);
        Assert.Equal(world.Frames(4), scene.Characters[0].PresenceEndFrame);
        Assert.True(scene.Dialogue[0].RelativeStartFrame <= scene.Dialogue[0].RelativeEndFrame);
    }

    [Fact]
    public async Task Fades_longer_than_the_scene_are_refused()
    {
        var world = new EditingWorld();
        var scene = world.AddScene(1, seconds: 3);

        var error = await Assert.ThrowsAsync<EditingException>(() =>
            world.SceneEditing.UpdateAsync(new UpdateSceneCommand
            {
                SceneId = scene.Id,
                UserId = EditingWorld.UserId,
                DurationSeconds = 3,
                FadeInSeconds = 2,
                FadeOutSeconds = 2
            }, CancellationToken.None));

        Assert.Equal("fades-exceed-duration", error.Code);
    }

    [Fact]
    public async Task Shortening_a_scene_shortens_the_transition_leading_into_it()
    {
        var world = new EditingWorld();

        var first = world.AddScene(1, seconds: 10);
        first.TransitionToNext = SceneTransition.Fade;
        first.TransitionDurationFrames = world.Frames(2);

        var second = world.AddScene(2, seconds: 10);

        // Two seconds of crossfade needs at least four seconds of scene on both sides.
        await world.SceneEditing.UpdateAsync(new UpdateSceneCommand
        {
            SceneId = second.Id,
            UserId = EditingWorld.UserId,
            DurationSeconds = 2
        }, CancellationToken.None);

        Assert.Equal(world.Frames(1), first.TransitionDurationFrames);
    }

    [Fact]
    public async Task A_transition_is_cleared_when_the_scene_is_set_to_cut()
    {
        var world = new EditingWorld();
        var scene = world.AddScene(1, seconds: 10);

        await world.SceneEditing.UpdateAsync(new UpdateSceneCommand
        {
            SceneId = scene.Id,
            UserId = EditingWorld.UserId,
            DurationSeconds = 10,
            Transition = SceneTransition.None,
            TransitionDurationSeconds = 2
        }, CancellationToken.None);

        Assert.Equal(0, scene.TransitionDurationFrames);
    }

    // --- backgrounds and audio ---------------------------------------------------

    [Fact]
    public async Task A_background_must_be_an_image_from_the_same_project()
    {
        var world = new EditingWorld();
        var scene = world.AddScene(1);

        world.AddAsset("music", AssetKind.Audio);
        world.AddAsset("someone-elses", AssetKind.Image, projectId: "other-project");

        var wrongKind = await Assert.ThrowsAsync<EditingException>(() =>
            world.SceneEditing.SetBackgroundAsync(
                scene.Id, EditingWorld.UserId, "music", CancellationToken.None));

        Assert.Equal("asset-wrong-kind", wrongKind.Code);

        var wrongProject = await Assert.ThrowsAsync<EditingException>(() =>
            world.SceneEditing.SetBackgroundAsync(
                scene.Id, EditingWorld.UserId, "someone-elses", CancellationToken.None));

        Assert.Equal("asset-not-found", wrongProject.Code);
    }

    [Fact]
    public async Task An_unapproved_asset_cannot_be_assigned()
    {
        var world = new EditingWorld();
        var scene = world.AddScene(1);

        var asset = world.AddAsset("searched", AssetKind.Image);
        asset.ReviewStatus = AssetReviewStatus.PendingReview;

        var error = await Assert.ThrowsAsync<EditingException>(() =>
            world.SceneEditing.SetBackgroundAsync(
                scene.Id, EditingWorld.UserId, asset.Id, CancellationToken.None));

        Assert.Equal("asset-not-usable", error.Code);
        Assert.True(error.IsConflict);
    }

    [Fact]
    public async Task Applying_one_background_to_every_scene_does_not_mark_them_hand_edited()
    {
        var world = new EditingWorld();
        world.AddScene(1);
        world.AddScene(2);
        world.AddAsset("bg", AssetKind.Image);

        var count = await world.SceneEditing.SetAllBackgroundsAsync(
            world.Project.Id, EditingWorld.UserId, "bg", CancellationToken.None);

        Assert.Equal(2, count);
        Assert.All(world.Scenes.Items, s => Assert.Equal("bg", s.BackgroundAssetId));

        // A bulk default is not a per-scene decision, so a re-ingest may still refresh them.
        Assert.All(world.Scenes.Items, s => Assert.False(s.IsUserEdited));
    }

    [Fact]
    public async Task Picking_the_media_file_makes_every_sliced_scene_audible()
    {
        var world = new EditingWorld();

        var withSlice = world.AddScene(1);
        withSlice.Audio = new SceneAudio { SliceStartSeconds = 0, SliceEndSeconds = 5 };

        world.AddScene(2);   // no slice: generated from a transcript with no timings
        world.AddAsset("voice", AssetKind.Audio, duration: 120);

        var applied = await world.SceneEditing.SetAllAudioAsync(
            world.Project.Id, EditingWorld.UserId, "voice", CancellationToken.None);

        Assert.Equal(1, applied);
        Assert.Equal("voice", world.Scenes.Items[0].Audio.AssetId);
        Assert.Null(world.Scenes.Items[1].Audio.AssetId);
    }

    [Fact]
    public async Task Setting_scene_audio_keeps_the_slice_the_import_recorded()
    {
        var world = new EditingWorld();

        var scene = world.AddScene(1);
        scene.Audio = new SceneAudio { SliceStartSeconds = 12, SliceEndSeconds = 18 };

        world.AddAsset("voice", AssetKind.Audio, duration: 300);

        await world.SceneEditing.SetAudioAsync(new SetSceneAudioCommand
        {
            SceneId = scene.Id,
            UserId = EditingWorld.UserId,
            AssetId = "voice"
        }, CancellationToken.None);

        Assert.Equal("voice", scene.Audio.AssetId);
        Assert.Equal(12, scene.Audio.SliceStartSeconds);
        Assert.Equal(18, scene.Audio.SliceEndSeconds);
    }

    [Fact]
    public async Task A_slice_beyond_the_end_of_the_file_is_refused()
    {
        var world = new EditingWorld();
        var scene = world.AddScene(1);
        world.AddAsset("voice", AssetKind.Audio, duration: 30);

        var error = await Assert.ThrowsAsync<EditingException>(() =>
            world.SceneEditing.SetAudioAsync(new SetSceneAudioCommand
            {
                SceneId = scene.Id,
                UserId = EditingWorld.UserId,
                AssetId = "voice",
                SliceStartSeconds = 45,
                SliceEndSeconds = 50
            }, CancellationToken.None));

        Assert.Equal("audio-slice-past-end", error.Code);
    }

    // --- dialogue ----------------------------------------------------------------

    [Fact]
    public async Task Dialogue_is_reindexed_in_time_order_however_it_was_added()
    {
        var world = new EditingWorld();
        var scene = world.AddScene(1, seconds: 10);
        world.AddCharacter("hero", "Hero");

        await world.SceneEditing.UpsertDialogueAsync(new UpsertDialogueCommand
        {
            SceneId = scene.Id,
            UserId = EditingWorld.UserId,
            SpeakerCharacterId = "hero",
            Text = "Second",
            StartSeconds = 5,
            EndSeconds = 7
        }, CancellationToken.None);

        await world.SceneEditing.UpsertDialogueAsync(new UpsertDialogueCommand
        {
            SceneId = scene.Id,
            UserId = EditingWorld.UserId,
            SpeakerCharacterId = "hero",
            Text = "First",
            StartSeconds = 1,
            EndSeconds = 3
        }, CancellationToken.None);

        Assert.Equal(["First", "Second"], scene.Dialogue.Select(l => l.Text));
        Assert.Equal([0, 1], scene.Dialogue.Select(l => l.Index));
    }

    [Fact]
    public async Task A_line_that_ends_after_the_scene_is_refused()
    {
        var world = new EditingWorld();
        var scene = world.AddScene(1, seconds: 4);

        var error = await Assert.ThrowsAsync<EditingException>(() =>
            world.SceneEditing.UpsertDialogueAsync(new UpsertDialogueCommand
            {
                SceneId = scene.Id,
                UserId = EditingWorld.UserId,
                Text = "Too long",
                StartSeconds = 1,
                EndSeconds = 9
            }, CancellationToken.None));

        Assert.Equal("dialogue-past-end", error.Code);
    }

    [Fact]
    public async Task A_speaker_from_another_project_is_refused()
    {
        var world = new EditingWorld();
        var scene = world.AddScene(1, seconds: 10);

        world.Characters.Items.Add(new Domain.Characters.Character
        {
            Id = "stranger",
            ProjectId = "other-project",
            Name = "Stranger"
        });

        var error = await Assert.ThrowsAsync<EditingException>(() =>
            world.SceneEditing.UpsertDialogueAsync(new UpsertDialogueCommand
            {
                SceneId = scene.Id,
                UserId = EditingWorld.UserId,
                SpeakerCharacterId = "stranger",
                Text = "Hello",
                StartSeconds = 0,
                EndSeconds = 2
            }, CancellationToken.None));

        Assert.Equal("character-not-found", error.Code);
    }

    [Fact]
    public async Task Removing_a_line_reindexes_the_rest()
    {
        var world = new EditingWorld();
        var scene = world.AddScene(1, seconds: 10);

        scene.Dialogue.Add(new DialogueLine { Index = 0, Text = "One", RelativeEndFrame = 30 });
        scene.Dialogue.Add(new DialogueLine
        {
            Index = 1, Text = "Two", RelativeStartFrame = 30, RelativeEndFrame = 60
        });

        await world.SceneEditing.RemoveDialogueAsync(
            scene.Id, EditingWorld.UserId, 0, CancellationToken.None);

        Assert.Equal(["Two"], scene.Dialogue.Select(l => l.Text));
        Assert.Equal(0, scene.Dialogue[0].Index);
    }

    // --- staging -----------------------------------------------------------------

    [Fact]
    public async Task Staging_a_character_defaults_its_presence_to_the_whole_scene()
    {
        var world = new EditingWorld();
        var scene = world.AddScene(1, seconds: 8);
        world.AddCharacter("hero", "Hero");

        await world.SceneEditing.UpsertPlacementAsync(new UpsertPlacementCommand
        {
            SceneId = scene.Id,
            UserId = EditingWorld.UserId,
            CharacterId = "hero",
            Anchor = Anchor.BottomLeft
        }, CancellationToken.None);

        var placement = Assert.Single(scene.Characters);
        Assert.Equal(0, placement.PresenceStartFrame);
        Assert.Equal(world.Frames(8), placement.PresenceEndFrame);
        Assert.Equal(Anchor.BottomLeft, placement.Anchor);
    }

    [Fact]
    public async Task Staging_the_same_character_twice_restages_it_rather_than_duplicating()
    {
        var world = new EditingWorld();
        var scene = world.AddScene(1, seconds: 8);
        world.AddCharacter("hero", "Hero");

        var command = new UpsertPlacementCommand
        {
            SceneId = scene.Id,
            UserId = EditingWorld.UserId,
            CharacterId = "hero"
        };

        await world.SceneEditing.UpsertPlacementAsync(command, CancellationToken.None);
        await world.SceneEditing.UpsertPlacementAsync(
            command with { Anchor = Anchor.BottomRight, ZOrder = 3 }, CancellationToken.None);

        var placement = Assert.Single(scene.Characters);
        Assert.Equal(Anchor.BottomRight, placement.Anchor);
        Assert.Equal(3, placement.ZOrder);
    }

    [Fact]
    public async Task The_narrator_cannot_be_staged_because_it_has_no_sprite()
    {
        var world = new EditingWorld();
        var scene = world.AddScene(1, seconds: 8);
        world.AddCharacter("narrator", "Narrator", isNarrator: true);

        var error = await Assert.ThrowsAsync<EditingException>(() =>
            world.SceneEditing.UpsertPlacementAsync(new UpsertPlacementCommand
            {
                SceneId = scene.Id,
                UserId = EditingWorld.UserId,
                CharacterId = "narrator"
            }, CancellationToken.None));

        Assert.Equal("narrator-has-no-sprite", error.Code);
    }

    [Fact]
    public async Task A_character_cannot_be_on_screen_after_the_scene_ends()
    {
        var world = new EditingWorld();
        var scene = world.AddScene(1, seconds: 5);
        world.AddCharacter("hero", "Hero");

        var error = await Assert.ThrowsAsync<EditingException>(() =>
            world.SceneEditing.UpsertPlacementAsync(new UpsertPlacementCommand
            {
                SceneId = scene.Id,
                UserId = EditingWorld.UserId,
                CharacterId = "hero",
                PresenceStartSeconds = 1,
                PresenceEndSeconds = 9
            }, CancellationToken.None));

        Assert.Equal("presence-past-end", error.Code);
    }

    [Fact]
    public async Task Removing_a_character_that_is_not_staged_says_so()
    {
        var world = new EditingWorld();
        var scene = world.AddScene(1);

        var error = await Assert.ThrowsAsync<EditingException>(() =>
            world.SceneEditing.RemovePlacementAsync(
                scene.Id, EditingWorld.UserId, "ghost", CancellationToken.None));

        Assert.Equal("placement-not-found", error.Code);
    }
}
