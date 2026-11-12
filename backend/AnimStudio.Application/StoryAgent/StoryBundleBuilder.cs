using System.Globalization;
using AnimStudio.Application.Workbooks;
using AnimStudio.Domain.Assets;
using AnimStudio.Domain.Projects;
using AnimStudio.Domain.Rendering;
using AnimStudio.Domain.Scenes;
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

    public bool VideoHasAudio { get; init; }

    /// <summary>How the scene moves and cuts to the next; null for the builder's plain default.</summary>
    public StorySceneLook? Look { get; init; }

    /// <summary>The scene's further pictures, in order, shown after its own while the narration plays on. Ignored with a clip.</summary>
    public IReadOnlyList<StoryBundleShot> Shots { get; init; } = [];

    /// <summary>A funny ending played for a moment straight after the scene; null for none.</summary>
    public StoryBundleMeme? Meme { get; init; }

    /// <summary>Speaker mouth anchors in the scene's still picture.</summary>
    public IReadOnlyList<StoryFace> Faces { get; init; } = [];

    /// <summary>The scene's picture with the speakers' mouths open, which the renderer blends in while they talk; null for none.</summary>
    public StoryBundleTalkingImage? TalkingImage { get; init; }
}

/// <summary>The open-mouth version of a picture: the same picture with each speaker's mouth open mid-word.</summary>
/// <param name="Faces">The speakers' faces in this picture, which an image model may have framed differently from the original.</param>
public sealed record StoryBundleTalkingImage(byte[] Content, string Mime, IReadOnlyList<StoryFace>? Faces = null);

/// <summary>A meme from the owner's library, ready to play after a scene.</summary>
/// <param name="Content">An MP4 clip, or a PNG, JPEG or WebP still.</param>
/// <param name="HasAudio">The clip has its own sound, which plays with it.</param>
/// <param name="Caption">Shown as a subtitle over it; null for none.</param>
public sealed record StoryBundleMeme(byte[] Content, string Mime, bool IsVideo, bool HasAudio, double Seconds, string? Caption, string Note);

/// <summary>One of a scene's further pictures.</summary>
public sealed record StoryBundleShot(byte[] Image, string ImageMime, string ImageNote)
{
    /// <summary>The speakers' faces in this picture.</summary>
    public IReadOnlyList<StoryFace> Faces { get; init; } = [];

    /// <summary>This picture with the speakers' mouths open; null for none.</summary>
    public StoryBundleTalkingImage? TalkingImage { get; init; }
}

/// <param name="ContentType"><c>audio/mpeg</c> or <c>audio/wav</c>.</param>
public sealed record StoryBundleMusic(byte[] Content, string Attribution, string? SourceUrl, LicenseClass License, string ContentType = "audio/mpeg");

/// <summary>The bundle, and where each scene lands on the finished video's timeline.</summary>
/// <param name="SceneStarts">Start of each scene of the script in seconds, with the overlap of the transitions taken out.</param>
public sealed record StoryBundleOutput(
    ProjectBundle Bundle,
    IReadOnlyList<double> SceneStarts,
    double TotalSeconds,
    int CaptionCount)
{
    /// <summary>Further pictures that could not be shown, said for the person.</summary>
    public IReadOnlyList<string> Warnings { get; init; } = [];

    /// <summary>How many scenes the project has: one per picture, so more than the script when a scene has several.</summary>
    public int ProjectScenes { get; init; }
}

/// <summary>
/// Turns a script and what the build made into a project bundle: the same sheets and media folder a person
/// would upload, so the project is created by the importer that already validates, stores and numbers everything.
/// </summary>
/// <remarks>
/// <para>
/// Building through the bundle rather than writing scenes directly means a Story Agent project is an ordinary
/// project in every respect - and that its production can be exported, edited in a spreadsheet and re-imported.
/// </para>
/// <para>
/// A scene with several pictures becomes one project scene per picture, cut where the voice pauses. Each carries its
/// stretch of the narration on through the transition into the next, and the renderer crossfades the two in a straight
/// line - so over the overlap the same sound fades out of one as it fades into the other and the voice runs on unbroken.
/// The script's scenes keep their timings: the pictures share the time the scene had.
/// </para>
/// </remarks>
public static class StoryBundleBuilder
{
    public const int FramesPerSecond = 30;
    public const double TransitionSeconds = 0.45;
    public const double EffectIntensity = 0.12;

    /// <summary>The least time a picture is on screen; a scene too short for all of its pictures shows the first ones.</summary>
    public const double MinShotSeconds = 2.0;

    /// <summary>How hard a still meme punches in while it is on screen.</summary>
    private const double MemeIntensity = 0.18;

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
        var firstPart = new List<int>(scenes.Count);
        var warnings = new List<string>();
        var captions = 0;

        for (var i = 0; i < scenes.Count; i++)
        {
            var scene = scenes[i];
            var story = script.Scenes[i];
            var key = $"s{scene.Number:00}";
            var last = i == scenes.Count - 1;
            var hasAudio = scene.Audio is { Length: > 0 };

            var imagePath = AddMedia(media, $"img-{key}", ImageExtension(scene.ImageMime), scene.Image, scene.ImageMime, AssetKind.Image);
            assetTable.Add(Row(WorkbookSchema.Assets,
                ("Name", $"img-{key}"), ("File", imagePath), ("Kind", nameof(AssetKind.Image)),
                ("License", nameof(LicenseClass.Unknown)), ("Attribution", Truncate(scene.ImageNote, 500))));

            // A clip already moves, so it plays as it is; the picture stays in the project as the fallback.
            var backgroundPath = imagePath;
            var effect = scene.Look?.Effect ?? EffectCycle[i % EffectCycle.Length];
            var intensity = scene.Look?.Intensity ?? EffectIntensity;
            var isClip = scene.Video is { Length: > 0 };
            if (isClip)
            {
                backgroundPath = AddMedia(media, $"clip-{key}", ".mp4", scene.Video!, "video/mp4", AssetKind.Video);
                assetTable.Add(Row(WorkbookSchema.Assets,
                    ("Name", $"clip-{key}"), ("File", backgroundPath), ("Kind", nameof(AssetKind.Video)),
                    ("License", nameof(LicenseClass.Unknown)), ("Attribution", Truncate(scene.VideoNote, 500))));
                effect = BackgroundEffect.None;
            }

            var seconds = Math.Max(0.5, scene.DurationSeconds);
            var totalFrames = Math.Max(1, (int)Math.Round(seconds * FramesPerSecond));
            var kind = last ? SceneTransition.None : scene.Look?.Transition ?? SceneTransition.Fade;
            var transition = kind == SceneTransition.None ? 0.0 : scene.Look?.TransitionSeconds ?? TransitionSeconds;

            // When each speaker talks, timed against the voice like the subtitles; their mouths in each picture follow it.
            var talking = isClip ? [] : StoryFaces.Talking(story, seconds, hasAudio ? scene.Pauses : null);

            var chunks = StoryPacing.SplitCaptions(story.Narration);
            var spans = hasAudio
                ? StoryPacing.Align(chunks, seconds, scene.Pauses)
                : StoryPacing.Spread(chunks, seconds);

            // The scene's pictures, and where the cut to each falls (in frames from the scene's start).
            List<StoryBundleShot> shots = isClip ? [] : [.. scene.Shots.Take(Math.Max(0, (int)(seconds / MinShotSeconds) - 1))];
            if (!isClip && shots.Count < scene.Shots.Count)
                warnings.Add($"Scene {scene.Number} is too short for all of its pictures, so {scene.Shots.Count - shots.Count} of them are left out.");
            var cuts = Cuts(shots.Count + 1, totalFrames, seconds, hasAudio ? scene.Pauses : null, spans);

            var parts = new List<(int From, int To, int Overlap, string Background, BackgroundEffect Effect, SceneTransition Transition)>();
            var previous = effect;
            for (var p = 0; p <= shots.Count; p++)
            {
                var from = cuts[p];
                var to = cuts[p + 1];
                var lastPart = p == shots.Count;
                var background = backgroundPath;
                var partEffect = effect;
                if (p > 0)
                {
                    var shot = shots[p - 1];
                    background = AddMedia(media, $"img-{key}-{p + 1}", ImageExtension(shot.ImageMime), shot.Image, shot.ImageMime, AssetKind.Image);
                    assetTable.Add(Row(WorkbookSchema.Assets,
                        ("Name", $"img-{key}-{p + 1}"), ("File", background), ("Kind", nameof(AssetKind.Image)),
                        ("License", nameof(LicenseClass.Unknown)), ("Attribution", Truncate(shot.ImageNote, 500))));
                    partEffect = StoryLook.ShotEffect(previous, p, brief.Format);
                }

                var (partKind, partSeconds) = lastPart ? (kind, transition) : StoryLook.ShotTransition(options.LookStyle, brief.Format, p + 1);
                var overlap = partKind == SceneTransition.None ? 0 : (int)Math.Round(partSeconds * FramesPerSecond);
                // Within the scene a cut never takes more than a third of either picture it joins.
                if (!lastPart) overlap = Math.Clamp(overlap, 1, Math.Max(1, Math.Min(to - from, cuts[p + 2] - to) / 3));
                parts.Add((from, to, lastPart ? 0 : overlap, background, partEffect, partKind));
                previous = partEffect;
            }

            // Each part's stretch of the narration, running on through the cut into the next part.
            var audioPaths = new string?[parts.Count];
            if (hasAudio)
            {
                List<byte[]?> slices = parts.Count == 1
                    ? [scene.Audio!]
                    : [.. parts.Select(part => StoryWav.Slice(scene.Audio!, Seconds(part.From),
                        part.Overlap > 0 ? Seconds(part.To + part.Overlap) : null))];
                if (slices.Any(s => s is null))
                {
                    // Not plain PCM, so it cannot be cut: the scene stays on its first picture.
                    warnings.Add($"Scene {scene.Number}'s narration could not be shared between its pictures, so it shows only the first.");
                    parts = [parts[0] with { To = totalFrames, Overlap = 0, Transition = kind }];
                    cuts = [0, totalFrames];
                    slices = [scene.Audio!];
                }

                for (var p = 0; p < parts.Count; p++)
                {
                    var name = p == 0 ? $"narration-{key}" : $"narration-{key}-{p + 1}";
                    audioPaths[p] = AddMedia(media, name, ".wav", slices[p]!, "audio/wav", AssetKind.Audio);
                    assetTable.Add(Row(WorkbookSchema.Assets,
                        ("Name", name), ("File", audioPaths[p]), ("Kind", nameof(AssetKind.Audio)),
                        ("License", nameof(LicenseClass.Unknown)), ("Attribution", Truncate(scene.AudioNote, 500))));
                }
            }

            firstPart.Add(durationFrames.Count);
            for (var p = 0; p < parts.Count; p++)
            {
                var part = parts[p];
                var lastPart = p == parts.Count - 1;
                // A funny ending pops in on a hard cut, and takes over the scene's own cut into the next.
                var cutToMeme = lastPart && scene.Meme is not null;
                var number = (durationFrames.Count + 1).ToString(CultureInfo.InvariantCulture);
                var length = part.To - part.From + part.Overlap;
                var overlap = cutToMeme ? 0 : lastPart ? (int)Math.Round(transition * FramesPerSecond) : part.Overlap;
                durationFrames.Add(length);
                transitionFrames.Add(overlap);

                // The picture's mouths, and its open-mouth version when someone in it talks during this part.
                var openImage = isClip ? null : p == 0 ? scene.TalkingImage : shots[p - 1].TalkingImage;
                var mouthsCell = isClip ? string.Empty
                    : MouthsCell(p == 0 ? scene.Faces : shots[p - 1].Faces, talking, Seconds(part.From), Seconds(part.To + part.Overlap),
                        openImage?.Faces);
                string? talkingPath = null;
                if (mouthsCell.Length > 0 && openImage is { } open)
                {
                    var talkName = p == 0 ? $"talk-{key}" : $"talk-{key}-{p + 1}";
                    talkingPath = AddMedia(media, talkName, ImageExtension(open.Mime), open.Content, open.Mime, AssetKind.Image);
                    assetTable.Add(Row(WorkbookSchema.Assets,
                        ("Name", talkName), ("File", talkingPath), ("Kind", nameof(AssetKind.Image)),
                        ("License", nameof(LicenseClass.Unknown)),
                        ("Attribution", "The scene's picture with the speakers' mouths open, redrawn by a Gemini image model (AI).")));
                }

                sceneTable.Add(Row(WorkbookSchema.Scenes,
                    ("SceneNumber", number),
                    ("Title", Truncate(parts.Count == 1 ? story.Headline : $"{story.Headline} ({p + 1}/{parts.Count})", 200)),
                    ("Description", Truncate(SceneDescription(story), 2000)),
                    ("DurationSeconds", (parts.Count == 1 ? seconds : Seconds(length)).ToString("0.00", CultureInfo.InvariantCulture)),
                    ("Background", part.Background),
                    ("Effect", part.Effect.ToString()),
                    ("Intensity", intensity.ToString("0.000", CultureInfo.InvariantCulture)),
                    ("Transition", (cutToMeme ? SceneTransition.None : part.Transition).ToString()),
                    ("TransitionSeconds", (cutToMeme ? 0 : lastPart ? transition : Seconds(overlap)).ToString("0.00", CultureInfo.InvariantCulture)),
                    ("Audio", audioPaths[p] ?? string.Empty),
                    ("BackgroundAudio", isClip && scene.VideoHasAudio && options.KeepClipAudio ? "TRUE" : "FALSE"),
                    ("Mouths", mouthsCell),
                    ("TalkingBackground", talkingPath ?? string.Empty)));

                // The subtitles under this picture, timed from its start. One the cut falls inside is shown on both sides of it.
                var from = Seconds(part.From);
                var to = lastPart ? seconds : Seconds(part.To);
                var order = 0;
                foreach (var span in spans)
                {
                    var (start, end) = parts.Count == 1 ? (span.Start, span.End) : (Math.Max(span.Start, from) - from, Math.Min(span.End, to) - from);
                    if (parts.Count > 1 && end - start < 0.1) continue;
                    dialogueTable.Add(Row(WorkbookSchema.Dialogue,
                        ("SceneNumber", number),
                        ("Order", (++order).ToString(CultureInfo.InvariantCulture)),
                        ("Text", Truncate(span.Text, 1000)),
                        ("StartSeconds", start.ToString("0.00", CultureInfo.InvariantCulture)),
                        ("EndSeconds", end.ToString("0.00", CultureInfo.InvariantCulture))));
                    captions++;
                }
            }

            if (scene.Meme is { } meme)
            {
                var name = $"meme-{key}";
                var memePath = AddMedia(media, name, meme.IsVideo ? ".mp4" : ImageExtension(meme.Mime), meme.Content, meme.Mime,
                    meme.IsVideo ? AssetKind.Video : AssetKind.Image);
                assetTable.Add(Row(WorkbookSchema.Assets,
                    ("Name", name), ("File", memePath), ("Kind", (meme.IsVideo ? AssetKind.Video : AssetKind.Image).ToString()),
                    ("License", nameof(LicenseClass.Unknown)), ("Attribution", Truncate(meme.Note, 500))));

                // Played for its full moment: the cut into the next scene overlaps time added for it.
                var memeOverlap = (int)Math.Round(transition * FramesPerSecond);
                var memeFrames = Math.Max(1, (int)Math.Round(meme.Seconds * FramesPerSecond)) + memeOverlap;
                var number = (durationFrames.Count + 1).ToString(CultureInfo.InvariantCulture);
                durationFrames.Add(memeFrames);
                transitionFrames.Add(memeOverlap);

                sceneTable.Add(Row(WorkbookSchema.Scenes,
                    ("SceneNumber", number),
                    ("Title", Truncate($"{story.Headline} (funny ending)", 200)),
                    ("Description", Truncate(meme.Caption ?? "Funny ending", 2000)),
                    ("DurationSeconds", Seconds(memeFrames).ToString("0.00", CultureInfo.InvariantCulture)),
                    ("Background", memePath),
                    // A clip already moves; a still gets a quick punch-in.
                    ("Effect", (meme.IsVideo ? BackgroundEffect.None : BackgroundEffect.ZoomIn).ToString()),
                    ("Intensity", MemeIntensity.ToString("0.000", CultureInfo.InvariantCulture)),
                    ("Transition", kind.ToString()),
                    ("TransitionSeconds", transition.ToString("0.00", CultureInfo.InvariantCulture)),
                    ("Audio", string.Empty),
                    ("BackgroundAudio", meme.IsVideo && meme.HasAudio ? "TRUE" : "FALSE")));

                if (meme.Caption is { Length: > 0 } caption)
                {
                    dialogueTable.Add(Row(WorkbookSchema.Dialogue,
                        ("SceneNumber", number),
                        ("Order", "1"),
                        ("Text", Truncate(caption, 1000)),
                        ("StartSeconds", "0.00"),
                        ("EndSeconds", Seconds(memeFrames - memeOverlap).ToString("0.00", CultureInfo.InvariantCulture))));
                    captions++;
                }
            }
        }

        document.Add(projectTable);
        document.Add(sceneTable);
        document.Add(dialogueTable);
        document.Add(assetTable);

        // Each scene starts where the one before ends, less the overlap of the fade between them: the same
        // arithmetic the importer and the renderer use, in whole frames, so chapters land on the right second.
        var partStarts = new List<double>(durationFrames.Count);
        var frames = 0;
        for (var i = 0; i < durationFrames.Count; i++)
        {
            partStarts.Add(Math.Round((double)frames / FramesPerSecond, 2));
            frames += durationFrames[i] - transitionFrames[i];
        }

        var bundle = new ProjectBundle { Workbook = document, Media = media };
        return new StoryBundleOutput(bundle, [.. firstPart.Select(p => partStarts[p])], Math.Round((double)frames / FramesPerSecond, 2), captions)
        {
            Warnings = warnings,
            ProjectScenes = durationFrames.Count
        };
    }

    private static double Seconds(int frames) => (double)frames / FramesPerSecond;

    /// <summary>
    /// The Mouths cell of the project scene that shows one picture from <paramref name="from"/> to <paramref name="to"/>
    /// of its story scene: each face in it whose character talks then, with the talking timed from the picture's start.
    /// Kept inside the cell's length by leaving out the last mouths, so it can never fail the import.
    /// </summary>
    /// <param name="openFaces">
    /// The same faces in the picture's open-mouth version, when it was framed differently; a face found there is told
    /// where its open mouth is.
    /// </param>
    public static string MouthsCell(
        IReadOnlyList<StoryFace> faces, IReadOnlyDictionary<string, List<(double Start, double End)>> talking, double from, double to,
        IReadOnlyList<StoryFace>? openFaces = null)
    {
        var mouths = new List<SceneMouth>();
        foreach (var face in faces)
        {
            if (mouths.Count == MouthCell.MaxMouths || !talking.TryGetValue(face.Name, out var windows)) continue;

            var inside = windows
                .Select(w => (Start: Math.Max(w.Start, from) - from, End: Math.Min(w.End, to) - from))
                .Where(w => w.End - w.Start >= 0.1)
                .Take(MouthCell.MaxWindows)
                .Select(w => new MouthWindow
                {
                    StartFrame = (int)Math.Round(w.Start * FramesPerSecond),
                    EndFrame = (int)Math.Round(w.End * FramesPerSecond)
                })
                .ToList();
            if (inside.Count == 0) continue;

            var mouth = new SceneMouth { Name = face.Name, X = face.X, Y = face.Y, FaceWidth = face.Width, Windows = inside };
            if (openFaces?.FirstOrDefault(f => string.Equals(f.Name, face.Name, StringComparison.OrdinalIgnoreCase)) is { } open)
                (mouth.OpenX, mouth.OpenY, mouth.OpenFaceWidth) = (open.X, open.Y, open.Width);
            mouths.Add(mouth);
        }

        var rate = new FrameRate(FramesPerSecond, 1);
        var cell = MouthCell.Format(mouths, rate);
        while (cell.Length > MaxMouthsCellChars && mouths.Count > 0)
        {
            mouths.RemoveAt(mouths.Count - 1);
            cell = MouthCell.Format(mouths, rate);
        }
        return cell;
    }

    /// <summary>The Scenes sheet's limit for the Mouths cell.</summary>
    private const int MaxMouthsCellChars = 2000;

    /// <summary>
    /// Where a scene of <paramref name="totalFrames"/> is cut to show <paramref name="pieces"/> pictures, as frame
    /// offsets from 0 to the end. Each cut goes to the pause in the voice (or the gap between subtitles) nearest an even
    /// share, so a picture changes between words; with none near, at the even share itself.
    /// </summary>
    private static int[] Cuts(int pieces, int totalFrames, double seconds, IReadOnlyList<StoryPause>? pauses, IReadOnlyList<CaptionSpan> spans)
    {
        var cuts = new int[pieces + 1];
        cuts[pieces] = totalFrames;
        if (pieces == 1) return cuts;

        var quiet = pauses is { Count: > 0 }
            ? pauses.Select(p => (p.Start + p.End) / 2).ToList()
            : spans.Zip(spans.Skip(1), (a, b) => (a.End + b.Start) / 2).ToList();
        var share = seconds / pieces;
        var least = (int)Math.Round(MinShotSeconds * FramesPerSecond);

        for (var k = 1; k < pieces; k++)
        {
            var even = share * k;
            var low = cuts[k - 1] + least;
            var high = totalFrames - least * (pieces - k);
            var best = quiet
                .Select(q => (int)Math.Round(q * FramesPerSecond))
                .Where(f => f >= low && f <= high && Math.Abs(Seconds(f) - even) <= share / 2)
                .OrderBy(f => Math.Abs(Seconds(f) - even))
                .Cast<int?>()
                .FirstOrDefault();
            cuts[k] = best ?? Math.Clamp((int)Math.Round(even * FramesPerSecond), low, Math.Max(low, high));
        }

        return cuts;
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
