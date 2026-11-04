using System.Globalization;
using AnimStudio.Application.Workbooks;
using AnimStudio.Domain.Assets;
using AnimStudio.Domain.Projects;
using AnimStudio.Domain.Rendering;
using AnimStudio.Domain.Stories;

namespace AnimStudio.Application.StoryAgent;

/// <summary>What the build made for one scene, ready to go into the project.</summary>
/// <param name="DurationSeconds">How long the scene runs: the narration with its breath on both sides, or an estimate when there is none.</param>
/// <param name="ImageNote">Where the picture came from, recorded with the asset.</param>
/// <param name="AudioNote">Where the narration came from, recorded with the asset.</param>
public sealed record StoryBundleScene(
    int Number,
    byte[] Image,
    string ImageMime,
    string ImageNote,
    byte[]? Audio,
    string? AudioNote,
    double DurationSeconds,
    IReadOnlyList<StoryPause> Pauses)
{
    /// <summary>A moving clip (MP4) that plays instead of the picture, looped if the scene runs longer.</summary>
    public byte[]? Video { get; init; }

    public string? VideoNote { get; init; }

    /// <summary>How the scene moves and cuts to the next; null for the builder's plain default.</summary>
    public StorySceneLook? Look { get; init; }
}

/// <param name="ContentType"><c>audio/mpeg</c> or <c>audio/wav</c>.</param>
public sealed record StoryBundleMusic(byte[] Content, string Attribution, string? SourceUrl, LicenseClass License, string ContentType = "audio/mpeg");

/// <summary>The bundle, and where each scene lands on the finished video's timeline.</summary>
/// <param name="SceneStarts">Start of each scene in seconds, with the overlap of the transitions taken out.</param>
public sealed record StoryBundleOutput(
    ProjectBundle Bundle,
    IReadOnlyList<double> SceneStarts,
    double TotalSeconds,
    int CaptionCount);

/// <summary>
/// Turns a script and what the build made into a project bundle: the same sheets and media folder a person
/// would upload, so the project is created by the importer that already validates, stores and numbers everything.
/// </summary>
/// <remarks>
/// Building through the bundle rather than writing scenes directly means a Story Agent project is an ordinary
/// project in every respect - and that its production can be exported, edited in a spreadsheet and re-imported.
/// </remarks>
public static class StoryBundleBuilder
{
    public const int FramesPerSecond = 30;
    public const double TransitionSeconds = 0.45;
    public const double EffectIntensity = 0.12;

    private static readonly BackgroundEffect[] EffectCycle =
        [BackgroundEffect.ZoomIn, BackgroundEffect.PanRight, BackgroundEffect.ZoomOut, BackgroundEffect.PanLeft];

    public static StoryBundleOutput Build(
        StoryScript script,
        StoryBrief brief,
        StoryBuildOptions options,
        string projectName,
        IReadOnlyList<StoryBundleScene> scenes,
        StoryBundleMusic? music)
    {
        if (scenes.Count == 0 || scenes.Count != script.Scenes.Count)
            throw new InvalidOperationException("Every scene of the script needs its picture before the project can be built.");

        var width = brief.Format == StoryFormat.Vertical ? 1080 : 1920;
        var height = brief.Format == StoryFormat.Vertical ? 1920 : 1080;

        var media = new Dictionary<string, BundleMedia>(StringComparer.Ordinal);
        var document = new WorkbookDocument();
        var projectTable = Table(WorkbookSchema.Project);
        var sceneTable = Table(WorkbookSchema.Scenes);
        var dialogueTable = Table(WorkbookSchema.Dialogue);
        var assetTable = Table(WorkbookSchema.Assets);

        var musicPath = music is null
            ? string.Empty
            : music.ContentType == "audio/wav"
                ? AddMedia(media, "music", ".wav", music.Content, "audio/wav", AssetKind.Audio)
                : AddMedia(media, "music", ".mp3", music.Content, "audio/mpeg", AssetKind.Audio);
        if (music is not null)
        {
            assetTable.Add(Row(WorkbookSchema.Assets,
                ("Name", "music"), ("File", musicPath), ("Kind", nameof(AssetKind.Audio)),
                ("License", music.License.ToString()), ("Attribution", Truncate(music.Attribution, 500)),
                ("SourceUrl", Truncate(music.SourceUrl, 500))));
        }

        projectTable.Add(Row(WorkbookSchema.Project,
            ("Name", Truncate(projectName, 200)),
            ("Description", Truncate(ProjectDescription(script), 2000)),
            ("Width", width.ToString(CultureInfo.InvariantCulture)),
            ("Height", height.ToString(CultureInfo.InvariantCulture)),
            ("FrameRate", FramesPerSecond.ToString(CultureInfo.InvariantCulture)),
            ("DistributionIntent", nameof(DistributionIntent.Monetized)),
            ("BackgroundMusic", musicPath),
            ("BackgroundMusicVolume", Math.Clamp(options.MusicVolume, 0, 1).ToString("0.00", CultureInfo.InvariantCulture))));

        var durationFrames = new List<int>();
        var transitionFrames = new List<int>();
        var captions = 0;

        for (var i = 0; i < scenes.Count; i++)
        {
            var scene = scenes[i];
            var story = script.Scenes[i];
            var key = $"s{scene.Number:00}";
            var last = i == scenes.Count - 1;

            var imagePath = AddMedia(media, $"img-{key}", ImageExtension(scene.ImageMime), scene.Image, scene.ImageMime, AssetKind.Image);
            assetTable.Add(Row(WorkbookSchema.Assets,
                ("Name", $"img-{key}"), ("File", imagePath), ("Kind", nameof(AssetKind.Image)),
                ("License", nameof(LicenseClass.Unknown)), ("Attribution", Truncate(scene.ImageNote, 500))));

            // A clip already moves, so it plays as it is; the picture stays in the project as the fallback.
            var backgroundPath = imagePath;
            var effect = scene.Look?.Effect ?? EffectCycle[i % EffectCycle.Length];
            var intensity = scene.Look?.Intensity ?? EffectIntensity;
            if (scene.Video is { Length: > 0 })
            {
                backgroundPath = AddMedia(media, $"clip-{key}", ".mp4", scene.Video, "video/mp4", AssetKind.Video);
                assetTable.Add(Row(WorkbookSchema.Assets,
                    ("Name", $"clip-{key}"), ("File", backgroundPath), ("Kind", nameof(AssetKind.Video)),
                    ("License", nameof(LicenseClass.Unknown)), ("Attribution", Truncate(scene.VideoNote, 500))));
                effect = BackgroundEffect.None;
            }

            var audioPath = string.Empty;
            if (scene.Audio is { Length: > 0 })
            {
                audioPath = AddMedia(media, $"narration-{key}", ".wav", scene.Audio, "audio/wav", AssetKind.Audio);
                assetTable.Add(Row(WorkbookSchema.Assets,
                    ("Name", $"narration-{key}"), ("File", audioPath), ("Kind", nameof(AssetKind.Audio)),
                    ("License", nameof(LicenseClass.Unknown)), ("Attribution", Truncate(scene.AudioNote, 500))));
            }

            var seconds = Math.Max(0.5, scene.DurationSeconds);
            var kind = last ? SceneTransition.None : scene.Look?.Transition ?? SceneTransition.Fade;
            var transition = kind == SceneTransition.None ? 0.0 : scene.Look?.TransitionSeconds ?? TransitionSeconds;
            durationFrames.Add(Math.Max(1, (int)Math.Round(seconds * FramesPerSecond)));
            transitionFrames.Add((int)Math.Round(transition * FramesPerSecond));

            sceneTable.Add(Row(WorkbookSchema.Scenes,
                ("SceneNumber", scene.Number.ToString(CultureInfo.InvariantCulture)),
                ("Title", Truncate(story.Headline, 200)),
                ("Description", Truncate(SceneDescription(story), 2000)),
                ("DurationSeconds", seconds.ToString("0.00", CultureInfo.InvariantCulture)),
                ("Background", backgroundPath),
                ("Effect", effect.ToString()),
                ("Intensity", intensity.ToString("0.000", CultureInfo.InvariantCulture)),
                ("Transition", kind.ToString()),
                ("TransitionSeconds", transition.ToString("0.00", CultureInfo.InvariantCulture)),
                ("Audio", audioPath)));

            var chunks = StoryPacing.SplitCaptions(story.Narration);
            var spans = scene.Audio is { Length: > 0 }
                ? StoryPacing.Align(chunks, seconds, scene.Pauses)
                : StoryPacing.Spread(chunks, seconds);
            for (var line = 0; line < spans.Count; line++)
            {
                dialogueTable.Add(Row(WorkbookSchema.Dialogue,
                    ("SceneNumber", scene.Number.ToString(CultureInfo.InvariantCulture)),
                    ("Order", (line + 1).ToString(CultureInfo.InvariantCulture)),
                    ("Text", Truncate(spans[line].Text, 1000)),
                    ("StartSeconds", spans[line].Start.ToString("0.00", CultureInfo.InvariantCulture)),
                    ("EndSeconds", spans[line].End.ToString("0.00", CultureInfo.InvariantCulture))));
                captions++;
            }
        }

        document.Add(projectTable);
        document.Add(sceneTable);
        document.Add(dialogueTable);
        document.Add(assetTable);

        // Each scene starts where the one before ends, less the overlap of the fade between them: the same
        // arithmetic the importer and the renderer use, in whole frames, so chapters land on the right second.
        var starts = new List<double>(scenes.Count);
        var frames = 0;
        for (var i = 0; i < durationFrames.Count; i++)
        {
            starts.Add(Math.Round((double)frames / FramesPerSecond, 2));
            frames += durationFrames[i] - transitionFrames[i];
        }

        var bundle = new ProjectBundle { Workbook = document, Media = media };
        return new StoryBundleOutput(bundle, starts, Math.Round((double)frames / FramesPerSecond, 2), captions);
    }

    private static string AddMedia(
        Dictionary<string, BundleMedia> media, string name, string extension, byte[] content, string mime, AssetKind kind)
    {
        var fileName = $"{name}{extension}";
        var path = BundlePaths.MediaFolder + fileName;
        media[BundlePaths.Normalise(path)] = new BundleMedia(BundlePaths.Normalise(path), fileName, content, mime, kind);
        return path;
    }

    public static string ImageExtension(string mime) => mime switch
    {
        "image/png" => ".png",
        "image/webp" => ".webp",
        _ => ".jpg"
    };

    private static WorkbookTable Table(WorkbookSheet sheet) =>
        new(sheet.Name, [.. sheet.Columns.Select(c => c.Name)]);

    private static IReadOnlyList<string> Row(WorkbookSheet sheet, params (string Column, string? Value)[] values)
    {
        var cells = new string[sheet.Columns.Count];
        Array.Fill(cells, string.Empty);
        foreach (var (column, value) in values)
        {
            var index = sheet.Columns.ToList().FindIndex(c => string.Equals(c.Name, column, StringComparison.OrdinalIgnoreCase));
            if (index < 0) throw new InvalidOperationException($"The '{sheet.Name}' sheet has no '{column}' column.");
            cells[index] = value ?? string.Empty;
        }
        return cells;
    }

    private static string ProjectDescription(StoryScript script)
    {
        var parts = new List<string>();
        if (!string.IsNullOrWhiteSpace(script.TitleEnglish)) parts.Add(script.TitleEnglish!);
        if (!string.IsNullOrWhiteSpace(script.Summary)) parts.Add(script.Summary!);
        parts.Add("Made with the Story Agent. Review the script and its sources before publishing.");
        return string.Join('\n', parts);
    }

    private static string SceneDescription(StoryScene scene)
    {
        var sources = string.Join("; ", scene.Sources
            .Where(s => s.Check is CitationStatus.Verified or CitationStatus.Unchecked && s.TextName.Length > 0)
            .Select(s => $"{s.TextName} {s.Ref}".Trim()));
        var basis = scene.Basis switch
        {
            StoryBasis.Tradition => "Tradition",
            StoryBasis.Reflection => "Reflection",
            _ => "Text"
        };

        var parts = new List<string>();
        if (!string.IsNullOrWhiteSpace(scene.English)) parts.Add(scene.English!);
        parts.Add(sources.Length > 0 ? $"Source: {sources}" : $"Basis: {basis}");
        return string.Join(" | ", parts);
    }

    private static string Truncate(string? value, int max)
    {
        if (string.IsNullOrEmpty(value)) return string.Empty;
        if (value.Length <= max) return value;
        var cut = char.IsHighSurrogate(value[max - 1]) ? max - 1 : max;
        return value[..cut].TrimEnd();
    }
}
