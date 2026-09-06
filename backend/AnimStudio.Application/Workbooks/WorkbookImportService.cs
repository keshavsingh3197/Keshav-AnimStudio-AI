using System.Globalization;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Abstractions.Rendering;
using AnimStudio.Application.Abstractions.Storage;
using AnimStudio.Domain.Assets;
using AnimStudio.Domain.Characters;
using AnimStudio.Domain.Projects;
using AnimStudio.Domain.Rendering;
using AnimStudio.Domain.Scenes;
using Microsoft.Extensions.Logging;

namespace AnimStudio.Application.Workbooks;

/// <summary>
/// Turns a bundle into a project: characters, scenes, dialogue and the media itself.
/// </summary>
/// <remarks>
/// <para>
/// <b>This is the path that needs no AI.</b> Nothing here calls a provider, checks a quota
/// or needs a key. A bundle with a <c>media/</c> folder describes a complete, renderable
/// production, and that is what makes "AI is optional" true rather than aspirational.
/// </para>
/// <para>
/// Order matters and is not incidental: assets first, because characters and scenes point at
/// them; characters next, because scenes and dialogue point at those; then scenes; then
/// dialogue, which needs both a scene and a speaker to exist. Getting this backwards
/// produces rows that reference things not yet written.
/// </para>
/// <para>
/// A hand-edited scene is not overwritten unless the user asks for it, which is the same
/// rule re-ingest already follows. Someone who spent an hour staging scene 12 should not
/// lose it to a spreadsheet that happens to mention scene 12.
/// </para>
/// </remarks>
public sealed class WorkbookImportService(
    IProjectRepository projects,
    ICharacterRepository characters,
    ISceneRepository scenes,
    IAssetRepository assets,
    IObjectStore store,
    IMediaProbeService probe,
    TimeProvider clock,
    ILogger<WorkbookImportService> logger)
{
    /// <summary>
    /// Reports what would change, touching nothing.
    /// </summary>
    public async Task<WorkbookImportPreview> PlanAsync(
        string projectId, ProjectBundle bundle, string previewToken, DateTime expiresAtUtc,
        CancellationToken ct)
    {
        var data = WorkbookReader.Read(bundle.Workbook);

        var existingCharacters = await characters.ListByProjectAsync(projectId, ct);
        var existingScenes = await scenes.ListByProjectAsync(projectId, ct);

        var errors = new List<WorkbookCellError>(data.Errors);
        var warnings = new List<string>(bundle.Warnings.Concat(data.Warnings));

        var referenced = new HashSet<string>(StringComparer.Ordinal);

        var characterPlans = PlanCharacters(data, existingCharacters, bundle, errors, referenced);
        var scenePlans = PlanScenes(data, existingScenes, bundle, errors, referenced);
        var dialoguePlans = PlanDialogue(data, errors);
        var projectPlan = PlanProject(data, bundle, referenced);

        var sheets = new List<ImportSheetPlan>();

        if (projectPlan is not null) sheets.Add(projectPlan);
        sheets.Add(characterPlans);
        sheets.Add(scenePlans);
        sheets.Add(dialoguePlans);

        return new WorkbookImportPreview
        {
            PreviewToken = previewToken,
            ExpiresAtUtc = expiresAtUtc,
            Sheets = sheets,
            Errors = errors,
            Warnings = warnings,
            MediaFilesUsed = referenced.Count,
            MediaFilesUnused = bundle.Media.Count - referenced.Count,
            HasTranscript = bundle.TranscriptText is not null
        };
    }

    /// <summary>
    /// Applies the plan. Re-reads and re-validates rather than trusting the preview, because
    /// the project can have changed in between.
    /// </summary>
    public async Task<WorkbookImportResult> ApplyAsync(
        string projectId, ProjectBundle bundle, WorkbookImportOptions options,
        CancellationToken ct)
    {
        var data = WorkbookReader.Read(bundle.Workbook);

        if (data.HasErrors)
        {
            throw new WorkbookFormatException("import-invalid",
                "That file has errors that must be fixed before it can be applied.");
        }

        var warnings = new List<string>(bundle.Warnings.Concat(data.Warnings));

        // --- assets, because everything else points at them
        var media = await ImportMediaAsync(projectId, bundle, data, warnings, ct);

        // --- characters, because scenes and dialogue point at them
        var (charactersCreated, charactersUpdated, byName) =
            await ApplyCharactersAsync(projectId, data, media, ct);

        // --- scenes
        var (scenesCreated, scenesUpdated, scenesRemoved, dialogueLines) =
            await ApplyScenesAsync(projectId, data, media, byName, options, warnings, ct);

        var projectUpdated = await ApplyProjectAsync(projectId, data, media, ct);

        logger.LogInformation(
            "Bundle import applied to project {ProjectId}: {Characters} characters, "
            + "{Scenes} scenes, {Assets} assets.",
            projectId, charactersCreated + charactersUpdated, scenesCreated + scenesUpdated,
            media.Count);

        return new WorkbookImportResult(
            charactersCreated, charactersUpdated,
            scenesCreated, scenesUpdated, scenesRemoved,
            media.Count, dialogueLines, projectUpdated, warnings);
    }

    // ---------------------------------------------------------------- planning

    private static ImportSheetPlan? PlanProject(
        WorkbookData data, ProjectBundle bundle, HashSet<string> referenced)
    {
        if (data.Project is null) return null;

        Reference(bundle, data.Project.Text("BackgroundMusic"), referenced);

        return new ImportSheetPlan(WorkbookSchema.ProjectSheet, 0, 1, 0, 0,
            [new ImportRowPlan(WorkbookSchema.ProjectSheet, data.Project.RowNumber,
                data.Project.Text("Name") ?? "(unnamed)", ImportAction.Update,
                "Project name, canvas and distribution settings.")]);
    }

    private static ImportSheetPlan PlanCharacters(
        WorkbookData data, IReadOnlyList<Character> existing, ProjectBundle bundle,
        List<WorkbookCellError> errors, HashSet<string> referenced)
    {
        var byName = existing.ToDictionary(c => c.Name, StringComparer.OrdinalIgnoreCase);
        var rows = new List<ImportRowPlan>();

        foreach (var row in data.Characters)
        {
            var name = row.Text("Name")!;

            foreach (var column in (string[])["ClosedMouthSprite", "OpenMouthSprite"])
            {
                var value = row.Text(column);
                if (value is null) continue;

                if (!Reference(bundle, value, referenced) && !NamesAnAssetRow(data, value))
                {
                    errors.Add(new WorkbookCellError(row.Sheet, row.RowNumber, column,
                        "file-not-found",
                        $"Nothing in the bundle matches '{value}'. Put the file under media/ "
                        + "or add a row for it on the Assets sheet."));
                }
            }

            rows.Add(new ImportRowPlan(row.Sheet, row.RowNumber, name,
                byName.ContainsKey(name) ? ImportAction.Update : ImportAction.Create,
                Describe(row)));
        }

        return Summarise(WorkbookSchema.CharactersSheet, rows);

        static string Describe(WorkbookRow row)
        {
            var parts = new List<string>();

            if (row.Flag("IsNarrator") == true) parts.Add("narrator");
            if (row.HasValue("ClosedMouthSprite")) parts.Add("sprite");
            if (row.List("Aliases").Count > 0) parts.Add($"{row.List("Aliases").Count} aliases");

            return parts.Count == 0 ? "No sprite yet." : string.Join(", ", parts);
        }
    }

    private static ImportSheetPlan PlanScenes(
        WorkbookData data, IReadOnlyList<Scene> existing, ProjectBundle bundle,
        List<WorkbookCellError> errors, HashSet<string> referenced)
    {
        var byNumber = existing.ToDictionary(s => s.SceneNumber);
        var knownCharacters = new HashSet<string>(
            data.Characters.Select(c => c.Text("Name")!), StringComparer.OrdinalIgnoreCase);

        var rows = new List<ImportRowPlan>();

        foreach (var row in data.Scenes)
        {
            var number = row.Integer("SceneNumber")!.Value;

            foreach (var column in (string[])["Background", "Audio"])
            {
                var value = row.Text(column);
                if (value is null) continue;

                if (!Reference(bundle, value, referenced) && !NamesAnAssetRow(data, value))
                {
                    errors.Add(new WorkbookCellError(row.Sheet, row.RowNumber, column,
                        "file-not-found",
                        $"Nothing in the bundle matches '{value}'."));
                }
            }

            // Checked against the sheet rather than the database, because a bundle usually
            // defines its characters and scenes together in one upload.
            foreach (var name in row.List("Characters"))
            {
                if (knownCharacters.Contains(name)) continue;

                errors.Add(new WorkbookCellError(row.Sheet, row.RowNumber, "Characters",
                    "unknown-character",
                    $"No character named '{name}' on the Characters sheet."));
            }

            var action = !byNumber.TryGetValue(number, out var scene)
                ? ImportAction.Create
                : scene.IsUserEdited
                    ? ImportAction.Conflict
                    : ImportAction.Update;

            rows.Add(new ImportRowPlan(row.Sheet, row.RowNumber,
                $"Scene {number.ToString(CultureInfo.InvariantCulture)}", action,
                action == ImportAction.Conflict
                    ? "You edited this scene by hand; it will be kept unless you allow overwriting."
                    : $"{row.Number("DurationSeconds")?.ToString("0.#", CultureInfo.InvariantCulture)}s"
                      + $"{(row.HasValue("Background") ? ", background" : string.Empty)}"));
        }

        return Summarise(WorkbookSchema.ScenesSheet, rows);
    }

    private static ImportSheetPlan PlanDialogue(WorkbookData data, List<WorkbookCellError> errors)
    {
        var sceneNumbers = new HashSet<int>(data.Scenes.Select(s => s.Integer("SceneNumber")!.Value));
        var knownCharacters = new HashSet<string>(
            data.Characters.Select(c => c.Text("Name")!), StringComparer.OrdinalIgnoreCase);

        var rows = new List<ImportRowPlan>();

        foreach (var row in data.Dialogue)
        {
            var number = row.Integer("SceneNumber")!.Value;

            if (!sceneNumbers.Contains(number))
            {
                errors.Add(new WorkbookCellError(row.Sheet, row.RowNumber, "SceneNumber",
                    "unknown-scene",
                    $"No scene numbered {number.ToString(CultureInfo.InvariantCulture)} on the "
                    + "Scenes sheet."));

                continue;
            }

            var speaker = row.Text("Speaker");

            if (speaker is not null && !knownCharacters.Contains(speaker))
            {
                errors.Add(new WorkbookCellError(row.Sheet, row.RowNumber, "Speaker",
                    "unknown-character",
                    $"No character named '{speaker}' on the Characters sheet."));

                continue;
            }

            rows.Add(new ImportRowPlan(row.Sheet, row.RowNumber,
                $"Scene {number.ToString(CultureInfo.InvariantCulture)} line "
                + $"{row.Integer("Order")!.Value.ToString(CultureInfo.InvariantCulture)}",
                ImportAction.Create,
                speaker ?? "(unattributed)"));
        }

        return Summarise(WorkbookSchema.DialogueSheet, rows);
    }

    private static ImportSheetPlan Summarise(string sheet, List<ImportRowPlan> rows) =>
        new(sheet,
            rows.Count(r => r.Action == ImportAction.Create),
            rows.Count(r => r.Action == ImportAction.Update),
            rows.Count(r => r.Action == ImportAction.Conflict),
            rows.Count(r => r.Action == ImportAction.Unchanged),
            rows);

    /// <summary>Marks a bundle file as used, and says whether it was found at all.</summary>
    private static bool Reference(ProjectBundle bundle, string? value, HashSet<string> referenced)
    {
        var found = bundle.Resolve(value);
        if (found is null) return false;

        referenced.Add(found.Path);
        return true;
    }

    /// <summary>
    /// True when the value names a row on the Assets sheet instead of a file directly. That
    /// row may point at a media file or merely record a licence, so this is not proof the
    /// bytes exist - only that the user described it deliberately.
    /// </summary>
    private static bool NamesAnAssetRow(WorkbookData data, string value) =>
        data.Assets.Any(a => string.Equals(a.Text("Name"), value, StringComparison.OrdinalIgnoreCase));

    // ---------------------------------------------------------------- applying

    /// <summary>
    /// Stores every referenced media file as a real asset, so bundle-imported art carries
    /// the same provenance and goes through the same store as anything uploaded by hand.
    /// </summary>
    private async Task<Dictionary<string, Asset>> ImportMediaAsync(
        string projectId, ProjectBundle bundle, WorkbookData data,
        List<string> warnings, CancellationToken ct)
    {
        var result = new Dictionary<string, Asset>(StringComparer.OrdinalIgnoreCase);
        var licences = LicencesByFile(bundle, data);

        foreach (var (path, file) in bundle.Media)
        {
            // Server-composed key with a generated name: the bundle's filename is display
            // only and never reaches the object store, exactly as an upload's does not.
            var extension = Path.GetExtension(file.FileName);
            var storageKey = $"projects/{projectId}/assets/{Guid.NewGuid():n}{extension}";

            using (var content = new MemoryStream(file.Content, writable: false))
            {
                await store.SaveAsync(storageKey, content, file.MimeType, ct);
            }

            var asset = new Asset
            {
                ProjectId = projectId,
                Name = Path.GetFileNameWithoutExtension(file.FileName),
                DisplayFileName = file.FileName,
                StorageKey = storageKey,
                Kind = file.Kind,
                MimeType = file.MimeType,
                FileSizeBytes = file.Content.Length,
                // Material the user supplied themselves needs no licence review, the same
                // as an upload. Only assets fetched from a search do.
                ReviewStatus = AssetReviewStatus.NotRequired,
                UsageScope = AssetUsageScope.SceneUse,
                CreatedAt = clock.GetUtcNow().UtcDateTime,
                Provenance = licences.TryGetValue(path, out var provenance) ? provenance : null
            };

            try
            {
                asset.Probe = await probe.ProbeAsync(storageKey, ct);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                // A file that will not probe still imports: the render can fail later with a
                // better message than an import that refuses everything over one bad sprite.
                warnings.Add($"Could not read the dimensions of '{file.FileName}'.");
                logger.LogWarning(ex, "Probe failed for a bundle asset in project {ProjectId}.",
                    projectId);
            }

            await assets.InsertAsync(asset, ct);

            result[path] = asset;
            result[file.FileName] = asset;
        }

        // An Assets sheet row that names a media file also answers to its own Name, so
        // other sheets can refer to "arena" rather than "media/arena.jpg".
        foreach (var row in data.Assets)
        {
            var name = row.Text("Name");
            var file = row.Text("File");

            if (name is null || file is null) continue;

            var resolved = bundle.Resolve(file);

            if (resolved is not null && result.TryGetValue(resolved.Path, out var asset))
                result[name] = asset;
        }

        return result;
    }

    private static Dictionary<string, AssetProvenance> LicencesByFile(
        ProjectBundle bundle, WorkbookData data)
    {
        var result = new Dictionary<string, AssetProvenance>(StringComparer.Ordinal);

        foreach (var row in data.Assets)
        {
            var resolved = bundle.Resolve(row.Text("File"));
            if (resolved is null) continue;

            result[resolved.Path] = new AssetProvenance
            {
                SourceProvider = "bundle",
                SourceUrl = row.Text("SourceUrl"),
                LicenseClass = row.Enum<LicenseClass>("License") ?? LicenseClass.Unknown,
                AttributionText = row.Text("Attribution"),
                FetchedAtUtc = null
            };
        }

        return result;
    }

    private async Task<(int Created, int Updated, Dictionary<string, Character> ByName)>
        ApplyCharactersAsync(
            string projectId, WorkbookData data, Dictionary<string, Asset> media,
            CancellationToken ct)
    {
        var existing = await characters.ListByProjectAsync(projectId, ct);
        var byName = existing.ToDictionary(c => c.Name, StringComparer.OrdinalIgnoreCase);

        var created = 0;
        var updated = 0;
        var now = clock.GetUtcNow().UtcDateTime;

        foreach (var row in data.Characters)
        {
            var name = row.Text("Name")!;
            var isNew = !byName.TryGetValue(name, out var character);

            character ??= new Character
            {
                Id = Guid.NewGuid().ToString("n"),
                ProjectId = projectId,
                CreatedAt = now
            };

            character.Name = name;
            character.Aliases = [.. row.List("Aliases")];
            character.Description = row.Text("Description") ?? character.Description;
            character.IsNarrator = row.Flag("IsNarrator") ?? character.IsNarrator;

            // A bundle-defined character is deliberate, not something the pipeline guessed.
            character.IsAutoCreated = false;

            character.Appearance = new CharacterAppearance
            {
                Age = row.Integer("Age") ?? character.Appearance.Age,
                Gender = row.Text("Gender") ?? character.Appearance.Gender,
                Hair = row.Text("Hair") ?? character.Appearance.Hair,
                Clothes = row.Text("Clothes") ?? character.Appearance.Clothes,
                AdditionalDetails = row.Text("Details") ?? character.Appearance.AdditionalDetails
            };

            character.Sprites = new CharacterSprites
            {
                ClosedMouthAssetId =
                    AssetId(media, row.Text("ClosedMouthSprite")) ?? character.Sprites.ClosedMouthAssetId,
                OpenMouthAssetId =
                    AssetId(media, row.Text("OpenMouthSprite")) ?? character.Sprites.OpenMouthAssetId
            };

            character.Staging = new CharacterStaging
            {
                Anchor = row.Enum<Anchor>("Anchor") ?? character.Staging.Anchor,
                HeightFraction = row.Number("HeightFraction") ?? character.Staging.HeightFraction,
                OffsetXFraction = row.Number("OffsetX") ?? character.Staging.OffsetXFraction,
                OffsetYFraction = character.Staging.OffsetYFraction,
                FlipHorizontal = row.Flag("FlipHorizontal") ?? character.Staging.FlipHorizontal,
                ZOrder = character.Staging.ZOrder
            };

            character.UpdatedAt = now;

            if (isNew)
            {
                await characters.InsertAsync(character, ct);
                byName[name] = character;
                created++;
            }
            else
            {
                await characters.ReplaceAsync(character, ct);
                updated++;
            }
        }

        return (created, updated, byName);
    }

    private async Task<(int Created, int Updated, int Removed, int DialogueLines)>
        ApplyScenesAsync(
            string projectId, WorkbookData data, Dictionary<string, Asset> media,
            Dictionary<string, Character> charactersByName, WorkbookImportOptions options,
            List<string> warnings, CancellationToken ct)
    {
        var project = await projects.GetAsync(projectId, ct)
            ?? throw new WorkbookFormatException("project-missing", "That project no longer exists.");

        var fps = project.Settings.ToCanvas().FrameRate;
        var existing = await scenes.ListByProjectAsync(projectId, ct);
        var byNumber = existing.ToDictionary(s => s.SceneNumber);

        var dialogueByScene = data.Dialogue
            .GroupBy(d => d.Integer("SceneNumber")!.Value)
            .ToDictionary(g => g.Key, g => g.OrderBy(r => r.Integer("Order")!.Value).ToList());

        var created = 0;
        var updated = 0;
        var lines = 0;
        var now = clock.GetUtcNow().UtcDateTime;

        foreach (var row in data.Scenes)
        {
            var number = row.Integer("SceneNumber")!.Value;
            var isNew = !byNumber.TryGetValue(number, out var scene);

            if (!isNew && scene!.IsUserEdited && !options.OverwriteUserEdits)
            {
                warnings.Add($"Scene {number.ToString(CultureInfo.InvariantCulture)} was left "
                           + "alone because you have edited it by hand.");

                continue;
            }

            scene ??= new Scene
            {
                Id = Guid.NewGuid().ToString("n"),
                ProjectId = projectId,
                Origin = SceneOrigin.Manual,
                CreatedAt = now
            };

            scene.SceneNumber = number;
            scene.OrderKey = number;
            scene.Title = row.Text("Title") ?? scene.Title;
            scene.Description = row.Text("Description") ?? scene.Description;

            var seconds = row.Number("DurationSeconds")!.Value;
            scene.DurationFrames = Math.Max(1, (int)Math.Round(seconds * fps.AsDouble));

            if (AssetId(media, row.Text("Background")) is { } background)
                scene.BackgroundAssetId = background;

            if (AssetId(media, row.Text("Audio")) is { } audio)
            {
                scene.Audio = new SceneAudio { AssetId = audio };
            }

            scene.Animation = new AnimationSettings(
                row.Enum<BackgroundEffect>("Effect") ?? scene.Animation.Background,
                row.Number("Intensity") ?? scene.Animation.Intensity,
                scene.Animation.Easing,
                scene.Animation.FadeIn,
                scene.Animation.FadeOut);

            scene.TransitionToNext = row.Enum<SceneTransition>("Transition") ?? scene.TransitionToNext;

            if (row.Number("TransitionSeconds") is { } transitionSeconds)
            {
                scene.TransitionDurationFrames =
                    Math.Max(0, (int)Math.Round(transitionSeconds * fps.AsDouble));
            }

            scene.Characters = [.. row.List("Characters")
                .Where(charactersByName.ContainsKey)
                .Select((name, index) => Placement(charactersByName[name], scene.DurationFrames, index))];

            if (dialogueByScene.TryGetValue(number, out var dialogue))
            {
                scene.Dialogue = BuildDialogue(dialogue, charactersByName, scene.DurationFrames, fps);
                lines += scene.Dialogue.Count;
            }

            scene.UpdatedAt = now;
            scene.RevisionToken = Guid.NewGuid().ToString("n");

            if (isNew)
            {
                await scenes.InsertAsync(scene, ct);
                byNumber[number] = scene;
                created++;
            }
            else
            {
                await scenes.ReplaceAsync(scene, ct);
                updated++;
            }
        }

        var removed = 0;

        if (options.RemoveMissingScenes)
        {
            var mentioned = new HashSet<int>(data.Scenes.Select(s => s.Integer("SceneNumber")!.Value));

            foreach (var scene in existing.Where(s => !mentioned.Contains(s.SceneNumber)))
            {
                await scenes.DeleteAsync(scene.Id, ct);
                removed++;
            }
        }

        return (created, updated, removed, lines);
    }

    private static CharacterPlacement Placement(Character character, int durationFrames, int index) =>
        new()
        {
            CharacterId = character.Id,
            PresenceStartFrame = 0,
            PresenceEndFrame = durationFrames,
            Anchor = character.Staging.Anchor,
            HeightFraction = character.Staging.HeightFraction,
            // Two characters staged at the same anchor would sit on top of each other, so
            // the sheet's order fans them out. A per-scene override is a later feature.
            OffsetXFraction = character.Staging.OffsetXFraction != 0
                ? character.Staging.OffsetXFraction
                : Spread(index),
            FlipHorizontal = character.Staging.FlipHorizontal,
            ZOrder = index
        };

    private static double Spread(int index) => index switch
    {
        0 => -0.22,
        1 => 0.22,
        _ => 0
    };

    /// <summary>
    /// Builds the dialogue for one scene, on both clocks the renderer needs.
    /// </summary>
    /// <remarks>
    /// When the sheet gives no times, lines are spaced evenly across the scene. That is a
    /// stated estimate rather than a guess pretending to be data: subtitles appear in order
    /// and in time with a narration of the same length, which is what a first render needs.
    /// </remarks>
    private static List<DialogueLine> BuildDialogue(
        List<WorkbookRow> rows, Dictionary<string, Character> charactersByName,
        int durationFrames, FrameRate fps)
    {
        var result = new List<DialogueLine>(rows.Count);
        var share = rows.Count == 0 ? durationFrames : durationFrames / rows.Count;

        for (var i = 0; i < rows.Count; i++)
        {
            var row = rows[i];
            var speaker = row.Text("Speaker");

            var start = row.Number("StartSeconds");
            var end = row.Number("EndSeconds");

            var startFrame = start is null ? i * share : (int)Math.Round(start.Value * fps.AsDouble);
            var endFrame = end is null
                ? Math.Min(durationFrames, (i + 1) * share)
                : (int)Math.Round(end.Value * fps.AsDouble);

            result.Add(new DialogueLine
            {
                Index = i,
                SpeakerLabel = speaker,
                SpeakerCharacterId = speaker is not null && charactersByName.TryGetValue(speaker, out var c)
                    ? c.Id
                    : null,
                Text = row.Text("Text")!,
                RelativeStartFrame = Math.Clamp(startFrame, 0, durationFrames),
                RelativeEndFrame = Math.Clamp(Math.Max(endFrame, startFrame + 1), 0, durationFrames),
                SourceStartSeconds = start ?? 0,
                SourceEndSeconds = end ?? 0
            });
        }

        return result;
    }

    private async Task<bool> ApplyProjectAsync(
        string projectId, WorkbookData data, Dictionary<string, Asset> media, CancellationToken ct)
    {
        if (data.Project is null) return false;

        var project = await projects.GetAsync(projectId, ct);
        if (project is null) return false;

        var row = data.Project;

        project.Name = row.Text("Name") ?? project.Name;
        project.Description = row.Text("Description") ?? project.Description;

        project.Settings.Width = row.Integer("Width") ?? project.Settings.Width;
        project.Settings.Height = row.Integer("Height") ?? project.Settings.Height;
        project.Settings.FrameRateNum = row.Integer("FrameRate") ?? project.Settings.FrameRateNum;
        project.Settings.FrameRateDen = 1;

        project.Settings.DistributionIntent =
            row.Enum<DistributionIntent>("DistributionIntent") ?? project.Settings.DistributionIntent;

        if (AssetId(media, row.Text("BackgroundMusic")) is { } music)
            project.Settings.BackgroundMusicAssetId = music;

        project.Settings.BackgroundMusicVolume =
            row.Number("BackgroundMusicVolume") ?? project.Settings.BackgroundMusicVolume;

        project.UpdatedAt = clock.GetUtcNow().UtcDateTime;

        await projects.ReplaceAsync(project, ct);
        return true;
    }

    private static string? AssetId(Dictionary<string, Asset> media, string? reference)
    {
        if (string.IsNullOrWhiteSpace(reference)) return null;

        if (media.TryGetValue(reference, out var direct)) return direct.Id;

        var normalised = BundlePaths.Normalise(reference);

        return media.TryGetValue(normalised, out var byPath) ? byPath.Id : null;
    }
}
