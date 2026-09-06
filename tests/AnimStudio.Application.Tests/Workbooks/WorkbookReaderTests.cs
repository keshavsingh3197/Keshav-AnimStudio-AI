using AnimStudio.Application.Workbooks;
using AnimStudio.Domain.Rendering;

namespace AnimStudio.Application.Tests.Workbooks;

public class CsvGridTests
{
    [Fact]
    public void It_reads_a_header_and_its_rows()
    {
        var table = CsvGrid.Read("Scenes", "SceneNumber,Title\r\n1,The entrance\r\n2,The finish\r\n");

        Assert.Equal(["SceneNumber", "Title"], table.Headers);
        Assert.Equal(2, table.Rows.Count);
        Assert.Equal("The entrance", table.Value(0, "Title"));
    }

    [Fact]
    public void A_header_is_matched_however_the_user_capitalised_it()
    {
        var table = CsvGrid.Read("Scenes", "scenenumber,TITLE\r\n1,Hello\r\n");

        // Someone retyping a header will capitalise it differently, and that is not worth
        // an error.
        Assert.Equal("Hello", table.Value(0, "Title"));
    }

    [Fact]
    public void A_quoted_field_may_contain_commas_quotes_and_newlines()
    {
        var table = CsvGrid.Read("Dialogue",
            "Speaker,Text\r\nRahul,\"He said \"\"stop\"\", then left,\nand did not return\"\r\n");

        Assert.Equal("He said \"stop\", then left,\nand did not return", table.Value(0, "Text"));
    }

    [Fact]
    public void A_byte_order_mark_does_not_become_part_of_the_first_header()
    {
        // Excel writes one, and without this "Name" silently stops matching.
        var table = CsvGrid.Read("Characters", "\uFEFFName,Age\r\nRahul,28\r\n");

        Assert.Equal("Rahul", table.Value(0, "Name"));
    }

    [Fact]
    public void A_file_that_does_not_end_in_a_newline_still_has_its_last_row()
    {
        var table = CsvGrid.Read("Characters", "Name\r\nRahul\r\nPriya");

        Assert.Equal(2, table.Rows.Count);
    }

    [Fact]
    public void A_row_a_user_emptied_rather_than_deleted_is_not_a_record()
    {
        var table = CsvGrid.Read("Characters", "Name,Age\r\nRahul,28\r\n,\r\n,\r\n");

        Assert.Single(table.Rows);
    }

    [Fact]
    public void Writing_then_reading_returns_the_same_values()
    {
        var written = CsvGrid.Write(
            ["Name", "Description"],
            [["Rahul", "He said \"stop\", loudly"], ["Priya", "Line one\nLine two"]]);

        var table = CsvGrid.Read("Characters", written);

        Assert.Equal("He said \"stop\", loudly", table.Value(0, "Description"));
        Assert.Equal("Line one\nLine two", table.Value(1, "Description"));
    }
}

public class CellTextTests
{
    [Theory]
    [InlineData("=cmd|' /C calc'!A0")]
    [InlineData("+1+1")]
    [InlineData("-2+3")]
    [InlineData("@SUM(A1)")]
    public void A_value_a_spreadsheet_would_execute_is_prefixed_on_the_way_out(string value)
    {
        // Export is the dangerous direction: a name that is inert in this database becomes
        // a live formula the moment the file is opened on someone's machine.
        Assert.Equal("'" + value, CellText.ForExport(value));
    }

    [Fact]
    public void An_ordinary_value_is_left_exactly_as_it_is()
    {
        Assert.Equal("Rahul", CellText.ForExport("Rahul"));
        Assert.Equal("3.5", CellText.ForExport("3.5"));
    }

    [Fact]
    public void The_prefix_a_spreadsheet_added_is_removed_on_the_way_back_in()
    {
        // Otherwise a round trip accumulates one apostrophe per export.
        Assert.Equal("=1+1", CellText.FromImport("'=1+1"));
    }

    [Fact]
    public void An_apostrophe_that_is_part_of_the_value_survives()
    {
        Assert.Equal("'tis a name", CellText.FromImport("'tis a name"));
    }

    [Fact]
    public void A_formula_payload_survives_a_full_round_trip_unchanged_and_inert()
    {
        const string payload = "=cmd|' /C calc'!A0";

        var written = CsvGrid.Write(["Name"], [[payload]]);
        var table = CsvGrid.Read("Characters", written);

        Assert.StartsWith("'", table.Value(0, "Name"), StringComparison.Ordinal);
        Assert.Equal(payload, CellText.FromImport(table.Value(0, "Name")));
    }
}

public class WorkbookReaderTests
{
    private static WorkbookData Read(params (string Sheet, string Csv)[] sheets)
    {
        var document = new WorkbookDocument();

        foreach (var (sheet, csv) in sheets) document.Add(CsvGrid.Read(sheet, csv));

        return WorkbookReader.Read(document);
    }

    [Fact]
    public void A_well_formed_sheet_reads_into_typed_values()
    {
        var data = Read(("Characters",
            "Name,Aliases,Age,IsNarrator,Anchor,HeightFraction\r\n"
            + "Rahul,Raj; Rahul Sharma,28,FALSE,BottomLeft,0.8\r\n"));

        Assert.Empty(data.Errors);

        var row = Assert.Single(data.Characters);

        Assert.Equal("Rahul", row.Text("Name"));
        Assert.Equal(["Raj", "Rahul Sharma"], row.List("Aliases"));
        Assert.Equal(28, row.Integer("Age"));
        Assert.False(row.Flag("IsNarrator"));
        Assert.Equal(Anchor.BottomLeft, row.Enum<Anchor>("Anchor"));
        Assert.Equal(0.8, row.Number("HeightFraction"));
    }

    [Fact]
    public void A_missing_required_value_names_the_sheet_row_and_column()
    {
        var data = Read(("Scenes", "SceneNumber,DurationSeconds\r\n1,\r\n"));

        var error = Assert.Single(data.Errors);

        Assert.Equal("Scenes", error.Sheet);
        // Row 2, because the header is row 1 - the number the user sees in Excel.
        Assert.Equal(2, error.Row);
        Assert.Equal("DurationSeconds", error.Column);
        Assert.Equal("value-required", error.Code);
    }

    [Fact]
    public void A_value_of_the_wrong_type_is_an_error_rather_than_a_silent_zero()
    {
        // A duration of 0 would render a scene nobody can see and nobody can explain.
        var data = Read(("Scenes", "SceneNumber,DurationSeconds\r\n1,six\r\n"));

        Assert.Equal("not-a-number", Assert.Single(data.Errors).Code);
        Assert.Empty(data.Scenes);
    }

    [Fact]
    public void A_whole_number_written_the_way_a_spreadsheet_stores_it_still_reads()
    {
        // Spreadsheets keep integers as doubles, so "1" comes back "1.0".
        var data = Read(("Scenes", "SceneNumber,DurationSeconds\r\n1.0,6\r\n"));

        Assert.Empty(data.Errors);
        Assert.Equal(1, data.Scenes[0].Integer("SceneNumber"));
    }

    [Fact]
    public void A_value_outside_its_range_is_refused()
    {
        var data = Read(("Scenes", "SceneNumber,DurationSeconds,Intensity\r\n1,6,4\r\n"));

        Assert.Equal("out-of-range", Assert.Single(data.Errors).Code);
    }

    [Fact]
    public void A_choice_that_is_not_one_of_the_choices_lists_the_ones_that_are()
    {
        var data = Read(("Scenes",
            "SceneNumber,DurationSeconds,Transition\r\n1,6,Explode\r\n"));

        var error = Assert.Single(data.Errors);

        Assert.Equal("not-a-choice", error.Code);
        Assert.Contains("Dissolve", error.Message, StringComparison.Ordinal);
    }

    [Theory]
    [InlineData("fade")]
    [InlineData("FADE")]
    public void A_choice_is_matched_however_it_was_typed(string value)
    {
        var data = Read(("Scenes",
            $"SceneNumber,DurationSeconds,Transition\r\n1,6,{value}\r\n"));

        Assert.Empty(data.Errors);
        Assert.Equal(SceneTransition.Fade, data.Scenes[0].Enum<SceneTransition>("Transition"));
    }

    [Fact]
    public void Two_rows_with_the_same_key_is_an_error_on_the_second()
    {
        var data = Read(("Characters", "Name,Age\r\nRahul,28\r\nRahul,30\r\n"));

        var error = Assert.Single(data.Errors);

        Assert.Equal("duplicate-key", error.Code);
        Assert.Equal(3, error.Row);
        Assert.Single(data.Characters);
    }

    [Fact]
    public void A_composite_key_does_not_collide_across_its_parts()
    {
        // Scene 1 line 12 and scene 11 line 2 are different rows, and a naive key
        // concatenation would make them the same one.
        var data = Read(("Dialogue",
            "SceneNumber,Order,Text\r\n1,12,First\r\n11,2,Second\r\n"));

        Assert.Empty(data.Errors);
        Assert.Equal(2, data.Dialogue.Count);
    }

    [Fact]
    public void An_extra_column_is_a_warning_rather_than_a_refusal()
    {
        // People add a notes column to help themselves; refusing the import over one
        // would be officious. Saying nothing would hide a mistyped header.
        var data = Read(("Characters", "Name,MyNotes\r\nRahul,remember this\r\n"));

        Assert.Empty(data.Errors);
        Assert.Contains(data.Warnings, w => w.Contains("MyNotes", StringComparison.Ordinal));
    }

    [Fact]
    public void A_sheet_beyond_the_row_cap_is_refused_before_any_of_it_is_read()
    {
        var rows = string.Join(string.Empty,
            Enumerable.Range(1, WorkbookSchema.MaxRowsPerSheet + 1).Select(i => $"{i},6\r\n"));

        var data = Read(("Scenes", $"SceneNumber,DurationSeconds\r\n{rows}"));

        Assert.Equal("too-many-rows", Assert.Single(data.Errors).Code);
    }

    [Fact]
    public void A_single_row_sheet_reads_only_its_first_row_and_says_so()
    {
        var data = Read(("Project", "Name,Width\r\nFirst,1920\r\nSecond,1080\r\n"));

        Assert.Equal("First", data.Project!.Text("Name"));
        Assert.Contains(data.Warnings, w => w.Contains("first row", StringComparison.Ordinal));
    }

    [Fact]
    public void A_formula_in_an_uploaded_cell_is_stored_as_the_text_it_reads_as()
    {
        var data = Read(("Characters", "Name\r\n'=1+1\r\n"));

        // Never evaluated here, and the apostrophe a spreadsheet added is not part of the
        // name the user sees.
        Assert.Equal("=1+1", data.Characters[0].Text("Name"));
    }

    [Fact]
    public void A_sheet_that_is_absent_entirely_is_simply_empty()
    {
        // A bundle describing only characters is a legitimate partial edit.
        var data = Read(("Characters", "Name\r\nRahul\r\n"));

        Assert.Empty(data.Errors);
        Assert.Empty(data.Scenes);
        Assert.Null(data.Project);
    }
}
