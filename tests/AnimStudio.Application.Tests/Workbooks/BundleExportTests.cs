using AnimStudio.Application.Tests.Editing;
using AnimStudio.Application.Workbooks;
using AnimStudio.Domain.Assets;
using AnimStudio.Domain.Projects;
using AnimStudio.Domain.Rendering;
using AnimStudio.Domain.Scenes;
using Microsoft.Extensions.Logging.Abstractions;

namespace AnimStudio.Application.Tests.Workbooks;

/// <summary>
/// The export half of the bundle round trip.
/// </summary>
/// <remarks>
/// The test that matters is the last one: what this application writes out, this
/// application reads back in with no errors. A round trip that loses a field is the failure
/// mode nobody notices until a project has been through it twice.
/// </remarks>
public class BundleExportTests
{
    private static (BundleExportService Exporter, EditingWorld World) Build()
    {
        var world = new EditingWorld();

        world.Project.Name = "Championship Final";
        world.Project.Settings.Width = 1080;
        world.Project.Settings.Height = 1920;
        world.Project.Settings.DistributionIntent = DistributionIntent.Public;

        var arena = world.AddAsset("arena", AssetKind.Image);
        var closed = world.AddAsset("rahul closed", AssetKind.Image);
        world.Store.Put(arena.StorageKey, ImageBytes.Jpeg());
        world.Store.Put(closed.StorageKey, Zip.Png());

        var rahul = world.AddCharacter("char-1", "Rahul");
        rahul.Aliases = ["Raj", "Rahul Sharma"];
        rahul.Sprites.ClosedMouthAssetId = closed.Id;
        rahul.Staging.HeightFraction = 0.8;

        var scene = world.AddScene(1, seconds: 6.5, backgroundAssetId: arena.Id);
        scene.Description = "The challenger walks out.";
        scene.Animation = new AnimationSettings(BackgroundEffect.ZoomIn, 0.15);
        scene.TransitionToNext = SceneTransition.Fade;
        scene.TransitionDurationFrames = world.Frames(0.5);
        scene.Characters =
        [
            new CharacterPlacement { CharacterId = rahul.Id, PresenceEndFrame = scene.DurationFrames }
        ];
        scene.Dialogue =
        [
            new DialogueLine
            {
                Index = 0,
                SpeakerCharacterId = rahul.Id,
                Text = "This is my night.",
                RelativeStartFrame = 0,
                RelativeEndFrame = world.Frames(2.5)
            }
        ];

        var exporter = new BundleExportService(
            world.Projects, world.Characters, world.Scenes, world.Assets, world.Store,
            NullLogger<BundleExportService>.Instance);

        return (exporter, world);
    }

    private static async Task<ProjectBundle> ExportAndReadAsync(bool includeMedia = true)
    {
        var (exporter, world) = Build();

        var bytes = await exporter.ExportAsync(world.Project.Id, includeMedia, CancellationToken.None);

        using var archive = new MemoryStream(bytes);
        return BundleReader.Read(archive);
    }

    [Fact]
    public async Task Every_sheet_the_format_defines_comes_out()
    {
        var bundle = await ExportAndReadAsync();

        Assert.Equal(WorkbookSchema.Sheets.Count, bundle.Workbook.Tables.Count);
    }

    [Fact]
    public async Task The_pictures_come_out_with_the_sheets()
    {
        var bundle = await ExportAndReadAsync();

        Assert.Equal(2, bundle.Media.Count);
        Assert.All(bundle.Media, file =>
            Assert.StartsWith("media/", file.Value.Path, StringComparison.Ordinal));
    }

    [Fact]
    public async Task A_cell_that_names_a_file_names_one_that_is_in_the_bundle()
    {
        // The failure this catches: sheets that refer to media/arena.jpg while the zip
        // contains media/arena-1.png, which imports cleanly and loses every picture.
        var bundle = await ExportAndReadAsync();

        var background = bundle.Workbook.Table(WorkbookSchema.ScenesSheet)!.Value(0, "Background");

        Assert.NotNull(background);
        Assert.NotNull(bundle.Resolve(background));
    }

    [Fact]
    public async Task Leaving_the_media_out_leaves_the_sheets_intact()
    {
        var bundle = await ExportAndReadAsync(includeMedia: false);

        Assert.Empty(bundle.Media);
        Assert.Equal(WorkbookSchema.Sheets.Count, bundle.Workbook.Tables.Count);
    }

    [Fact]
    public async Task Two_assets_with_the_same_name_do_not_overwrite_each_other()
    {
        var (exporter, world) = Build();

        var first = world.AddAsset("logo", AssetKind.Image);
        var second = world.Assets.Items[^1];
        second.Id = "logo-2";
        second.Name = "logo";
        world.Store.Put(first.StorageKey, Zip.Png());

        var duplicate = world.AddAsset("logo-copy", AssetKind.Image);
        duplicate.Name = "logo";
        world.Store.Put(duplicate.StorageKey, Zip.Png());

        var bytes = await exporter.ExportAsync(world.Project.Id, true, CancellationToken.None);

        using var archive = new MemoryStream(bytes);
        var bundle = BundleReader.Read(archive);

        Assert.Equal(
            bundle.Media.Count,
            bundle.Media.Select(m => m.Value.Path).Distinct(StringComparer.Ordinal).Count());
    }

    [Theory]
    [InlineData("Championship Final", "championship-final-bundle.zip")]
    [InlineData("../../etc/passwd", "etc-passwd-bundle.zip")]
    [InlineData("   ", "animstudio-bundle.zip")]
    public void The_download_name_is_composed_rather_than_carried_over(string name, string expected)
    {
        // A download name is written to someone's disk, so it is not a place for stored
        // text to arrive intact.
        Assert.Equal(expected, BundleExportService.FileNameFor(name));
    }

    [Fact]
    public async Task What_this_application_writes_out_it_reads_back_in()
    {
        var bundle = await ExportAndReadAsync();
        var data = WorkbookReader.Read(bundle.Workbook);

        Assert.Empty(data.Errors);

        Assert.Equal("Championship Final", data.Project!.Text("Name"));
        Assert.Equal(1080, data.Project.Integer("Width"));

        var character = Assert.Single(data.Characters);
        Assert.Equal("Rahul", character.Text("Name"));
        Assert.Equal(["Raj", "Rahul Sharma"], character.List("Aliases"));
        Assert.Equal(0.8, character.Number("HeightFraction"));

        var scene = Assert.Single(data.Scenes);
        Assert.Equal(6.5, scene.Number("DurationSeconds"));
        Assert.Equal(["Rahul"], scene.List("Characters"));
        Assert.Equal(SceneTransition.Fade, scene.Enum<SceneTransition>("Transition"));

        var line = Assert.Single(data.Dialogue);
        Assert.Equal("This is my night.", line.Text("Text"));
        Assert.Equal(1, line.Integer("Order"));
        Assert.Equal(2.5, line.Number("EndSeconds"));
    }

    [Fact]
    public async Task A_name_a_spreadsheet_would_execute_leaves_inert()
    {
        var (exporter, world) = Build();

        world.Characters.Items[0].Name = "=cmd|' /C calc'!A0";

        var bytes = await exporter.ExportAsync(world.Project.Id, false, CancellationToken.None);

        using var archive = new MemoryStream(bytes);
        var bundle = BundleReader.Read(archive);

        var raw = bundle.Workbook.Table(WorkbookSchema.CharactersSheet)!.Value(0, "Name");

        // Prefixed in the file so Excel treats it as text, and the prefix is not part of
        // the value when it comes back.
        Assert.StartsWith("'", raw, StringComparison.Ordinal);
        Assert.Equal("=cmd|' /C calc'!A0", CellText.FromImport(raw));
    }
}
