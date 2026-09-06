using System.Text;

namespace AnimStudio.Application.Workbooks;

/// <summary>
/// Writes the prompts to paste into any free AI chat to get the sheets filled in.
/// </summary>
/// <remarks>
/// <para>
/// This is the bridge between "use free AI tools" and "need no API key". The user does the
/// AI part in whatever chat window they already have open, pastes the resulting table into
/// the CSV, and uploads a bundle. No provider is configured, no quota is spent, and the
/// application never sends their transcript anywhere.
/// </para>
/// <para>
/// Generated from <see cref="WorkbookSchema"/> rather than written out by hand, so a column
/// added to the format appears in the prompt automatically. A prompt pack listing columns
/// the importer does not accept would send people to an AI tool to produce a file that then
/// fails to import - which is worse than having no prompt pack.
/// </para>
/// </remarks>
public static class PromptPackWriter
{
    public const string FileName = "animstudio-ai-prompts.md";

    public static string Write()
    {
        var text = new StringBuilder();

        text.Append("# Filling an AnimStudio bundle with any AI chat\r\n\r\n");
        text.Append("You do not need to configure an AI provider in AnimStudio to use these. ");
        text.Append("Paste a prompt into whatever free chat tool you already use, give it your ");
        text.Append("source material, then paste the table it produces into the matching `.csv` ");
        text.Append("file from the bundle template.\r\n\r\n");

        text.Append("## Before you start\r\n\r\n");
        text.Append("- Download the bundle template from the Import screen. Every prompt below ");
        text.Append("produces one of its sheets.\r\n");
        text.Append("- Ask for **CSV output**. Most chat tools will otherwise answer with a ");
        text.Append("markdown table, which is more work to paste in.\r\n");
        text.Append("- Keep the header row exactly as written. The importer matches on column ");
        text.Append("names, and a renamed column is silently ignored.\r\n");
        text.Append("- The AI cannot draw your characters into the bundle. Generate images ");
        text.Append("separately, save them into `media/`, and put the filenames in the sheet.\r\n\r\n");

        text.Append("---\r\n\r\n");

        foreach (var sheet in WorkbookSchema.Sheets)
        {
            text.Append(SheetPrompt(sheet));
            text.Append("\r\n---\r\n\r\n");
        }

        text.Append(Closing());

        return text.ToString();
    }

    private static string SheetPrompt(WorkbookSheet sheet)
    {
        var text = new StringBuilder();

        text.Append($"## {sheet.Name}\r\n\r\n");
        text.Append(sheet.Help).Append("\r\n\r\n");
        text.Append("Copy everything in the box below, then paste your material after it.\r\n\r\n");
        text.Append("```text\r\n");

        text.Append($"Produce a CSV table for the '{sheet.Name}' sheet of an animation project.\r\n\r\n");
        text.Append("Output rules:\r\n");
        text.Append("- Reply with CSV only. No explanation, no markdown fences.\r\n");
        text.Append("- The first line must be exactly this header row:\r\n");
        text.Append($"  {string.Join(",", sheet.Columns.Select(c => c.Name))}\r\n");

        if (sheet.Shape == WorkbookSheetShape.SingleRow)
            text.Append("- Output exactly one data row.\r\n");
        else
            text.Append("- One row per item. Leave a cell empty rather than inventing a value.\r\n");

        text.Append("- Quote any value containing a comma.\r\n");
        text.Append("- Never begin a value with =, +, - or @.\r\n\r\n");

        text.Append("Columns:\r\n");

        foreach (var column in sheet.Columns)
        {
            text.Append($"- {column.Name}");
            if (column.Required) text.Append(" (required)");
            text.Append(": ").Append(column.Help ?? "Free text.");

            if (column.Values.Count > 0)
                text.Append($" Must be one of: {string.Join(", ", column.Values)}.");

            if (column.Type == WorkbookCellType.TextList)
                text.Append(" Separate multiple values with semicolons.");

            if (column.Type == WorkbookCellType.Boolean)
                text.Append(" Use TRUE or FALSE.");

            if (column.Type == WorkbookCellType.Reference)
                text.Append(" Leave this empty - filenames are added by hand afterwards.");

            text.Append("\r\n");
        }

        text.Append("\r\n").Append(Guidance(sheet.Name));
        text.Append("\r\nMy material follows.\r\n");
        text.Append("```\r\n");

        return text.ToString();
    }

    /// <summary>
    /// The sheet-specific part of the instruction. This is where most of the quality comes
    /// from: the generic column list tells a model what shape to answer in, and these lines
    /// tell it what a good answer contains.
    /// </summary>
    private static string Guidance(string sheet) => sheet switch
    {
        WorkbookSchema.CharactersSheet =>
            "Identify only people who actually speak or are clearly present. Put every name "
            + "the material calls them into Aliases, because that is what matches spoken lines "
            + "to characters. Describe appearance only where the material supports it; leave a "
            + "field empty rather than inventing a look. Add one character with IsNarrator set "
            + "to TRUE if any lines are unattributed commentary.\r\n",

        WorkbookSchema.ScenesSheet =>
            "Cut the material into scenes at changes of place, topic or speaker group - not at "
            + "a fixed interval. Aim for 4 to 12 seconds each. Give every scene a Location-like "
            + "Title, and use the same wording whenever the setting repeats, so one background "
            + "image can be reused. Description should read like a note to an illustrator.\r\n",

        WorkbookSchema.DialogueSheet =>
            "One row per spoken line, in order. Keep the wording as spoken. Speaker must match "
            + "a Name from the Characters sheet exactly. If the material has timestamps, convert "
            + "them to seconds measured from the start of that line's own scene; if it does not, "
            + "leave StartSeconds and EndSeconds empty and the lines will be spaced evenly.\r\n",

        WorkbookSchema.ProjectSheet =>
            "Choose 1920x1080 for a normal video or 1080x1920 for a phone-shaped one. Use 30 "
            + "for FrameRate unless there is a reason not to.\r\n",

        WorkbookSchema.AssetsSheet =>
            "List only files you actually have. Leave File empty for now and fill in the "
            + "media/ filenames by hand. Set License honestly - it is what decides whether a "
            + "monetized render is allowed.\r\n",

        _ => string.Empty
    };

    private static string Closing()
    {
        var text = new StringBuilder();

        text.Append("## Getting the pictures\r\n\r\n");
        text.Append("The sheets describe the video; the images still have to come from ");
        text.Append("somewhere. Any of these works, and none of them needs AnimStudio to have ");
        text.Append("a key:\r\n\r\n");
        text.Append("- A free image generator in your browser. Ask for a **transparent ");
        text.Append("background** for characters, and generate a closed-mouth and an open-mouth ");
        text.Append("version of each so their mouths move while they speak.\r\n");
        text.Append("- Your own photos or drawings.\r\n");
        text.Append("- A public-domain or Creative Commons library. Record the licence on the ");
        text.Append("Assets sheet if you do.\r\n\r\n");
        text.Append("Save everything into the bundle's `media/` folder, zip it, upload it.\r\n\r\n");

        text.Append("## A note on what you paste in\r\n\r\n");
        text.Append("Anything you paste into an outside chat tool leaves your machine and is ");
        text.Append("subject to that tool's terms. If the material is private, use the local ");
        text.Append("providers instead, or fill the sheets in yourself - the bundle path works ");
        text.Append("either way.\r\n");

        return text.ToString();
    }
}
