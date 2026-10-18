using AnimStudio.Application.Publishing;
using AnimStudio.Domain.Jobs;
using AnimStudio.Infrastructure.Publishing;

namespace AnimStudio.Application.Tests.Publishing;

public class DriveLayoutTests
{
    private static RenderJob BatchShort(int index, int count, string batchName = "KATHU SHYAM shorts") => new()
    {
        Id = "job" + index,
        ProjectId = "p1",
        CreatedAt = new DateTime(2026, 10, 18, 1, 0, 0, DateTimeKind.Utc),
        Batch = new RenderJobBatch
        {
            Id = "b1", Name = batchName, Index = index, Count = count,
            CreatedAt = new DateTime(2026, 10, 17, 11, 1, 0, DateTimeKind.Utc)
        }
    };

    [Fact]
    public void A_batch_short_goes_under_its_project_then_its_day_and_batch()
    {
        var folders = DriveLayout.FoldersFor("KATHU SHYAM", BatchShort(0, 10));
        Assert.Equal(["KATHU SHYAM", "2026-10-17 KATHU SHYAM shorts"], folders);
    }

    [Fact]
    public void A_single_export_goes_under_the_day_it_was_made()
    {
        var job = new RenderJob { Id = "j", ProjectId = "p", CreatedAt = new DateTime(2026, 10, 15, 7, 7, 0, DateTimeKind.Utc) };
        Assert.Equal(["KATHU SHYAM", "2026-10-15 Single exports"], DriveLayout.FoldersFor("KATHU SHYAM", job));
    }

    [Fact]
    public void Batch_shorts_are_numbered_so_drive_sorts_them_in_order()
    {
        Assert.Equal("01 KATHU SHYAM short #1", DriveLayout.FileTitleFor("KATHU SHYAM short #1", BatchShort(0, 12)));
        Assert.Equal("012 Short", DriveLayout.FileTitleFor("Short", BatchShort(11, 120)));
        Assert.Equal("Main video", DriveLayout.FileTitleFor(" Main video ", new RenderJob()));
    }

    [Fact]
    public void A_render_keeps_its_own_name_then_the_typed_export_name()
    {
        Assert.Equal("Main video", DriveLayout.TitleFor(new RenderJob { Id = "abc", Name = " Main video " }, "KATHU SHYAM"));
        Assert.Equal("Aarti", DriveLayout.TitleFor(new RenderJob { Id = "abc", ClipMerge = new ClipMergeSpec { ExportName = "Aarti" } }, "KATHU SHYAM"));
    }

    [Fact]
    public void Unnamed_exports_of_one_project_get_different_titles()
    {
        var first = DriveLayout.TitleFor(new RenderJob { Id = "6711a0c2f1e4b2a1c3d4e5f1", TargetFormat = "Video", ClipMerge = new ClipMergeSpec() }, "KATHU SHYAM");
        var second = DriveLayout.TitleFor(new RenderJob { Id = "6711a0c2f1e4b2a1c3d4e5f2", TargetFormat = "Video", ClipMerge = new ClipMergeSpec() }, "KATHU SHYAM");

        Assert.Equal("KATHU SHYAM video d4e5f1", first);
        Assert.NotEqual(first, second);
        Assert.NotEqual(DriveLayout.PlaceholderFileName, PhoneHandoffManager.FileNameFor(first));
        Assert.Equal("AnimStudio short", DriveLayout.TitleFor(new RenderJob { TargetFormat = "Short" }, null));
    }

    [Theory]
    [InlineData("NAV DURGA - MAA KATYAYANI", "NAV DURGA - MAA KATYAYANI")]
    [InlineData("Shyam's \"best\" / 2026!", "Shyam s best 2026")]
    [InlineData("   ", "Untitled project")]
    [InlineData(null, "Untitled project")]
    [InlineData("श्याम बाबा", "श्याम बाबा")]
    public void Folder_names_keep_only_what_a_drive_query_can_hold(string? name, string expected)
    {
        var cleaned = DriveLayout.CleanFolderName(name, DriveLayout.UntitledProject);
        Assert.Equal(expected, cleaned);
        Assert.True(GoogleDriveClient.IsValidFolderName(cleaned));
    }

    [Fact]
    public void A_long_project_name_is_cut_to_a_valid_folder_name()
    {
        var folders = DriveLayout.FoldersFor(new string('a', 150) + " end", BatchShort(0, 1, new string('b', 150)));
        Assert.All(folders, f => Assert.True(GoogleDriveClient.IsValidFolderName(f), f));
    }
}
