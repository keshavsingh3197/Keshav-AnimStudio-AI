using AnimStudio.Domain.Projects;

namespace AnimStudio.Application.Tests.Editing;

/// <summary>The free-text labels a cut is grouped and found by.</summary>
public class ProjectEditTests
{
    [Fact]
    public void Trims_dedupes_and_caps_tags()
    {
        var edit = new ProjectEdit
        {
            Name = "  Teaser  ",
            Category = "   ",
            Tags = ["Hindi", " hindi ", "", "bhajan", .. Enumerable.Range(0, 20).Select(i => $"t{i}")]
        };

        edit.NormalizeLabels();

        Assert.Equal("Teaser", edit.Name);
        Assert.Null(edit.Category);
        Assert.Equal(ProjectEdit.MaxTags, edit.Tags.Count);
        Assert.Equal(["Hindi", "bhajan"], edit.Tags.Take(2));
    }

    [Fact]
    public void Never_leaves_a_cut_without_a_name_or_over_the_length_limits()
    {
        var edit = new ProjectEdit { Name = " ", Category = new string('c', 200), Tags = [new string('t', 200)] };

        edit.NormalizeLabels();

        Assert.Equal("Untitled", edit.Name);
        Assert.Equal(ProjectEdit.MaxCategoryLength, edit.Category!.Length);
        Assert.Equal(ProjectEdit.MaxTagLength, edit.Tags[0].Length);
    }
}
