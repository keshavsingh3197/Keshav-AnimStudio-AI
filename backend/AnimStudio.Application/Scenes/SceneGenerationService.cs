using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Casting;
using AnimStudio.Application.Scripts;
using AnimStudio.Domain.Characters;
using AnimStudio.Domain.Rendering;
using AnimStudio.Domain.Scenes;
using AnimStudio.Domain.Scripts;
using Microsoft.Extensions.Options;

namespace AnimStudio.Application.Scenes;

public sealed record SceneGenerationResult(
    int ScenesCreated,
    int ScenesPreserved,
    IReadOnlyList<string> UnresolvedSpeakers,
    IReadOnlyList<string> Warnings);

/// <summary>
/// Turns a confirmed script into renderable scenes.
/// </summary>
public sealed class SceneGenerationService(
    IScriptRepository scripts,
    ISceneRepository scenes,
    ICharacterRepository characters,
    IProjectRepository projects,
    IOptions<SegmentationOptions> segmentationOptions,
    TimeProvider clock)
{
    public async Task<SceneGenerationResult> GenerateAsync(
        string scriptId, string userId, CancellationToken ct)
    {
        var script = await scripts.GetAsync(scriptId, ct).ConfigureAwait(false)
            ?? throw new InvalidOperationException("Script not found.");

        var project = await projects.GetAsync(script.ProjectId, ct).ConfigureAwait(false)
            ?? throw new InvalidOperationException("Project not found.");

        if (!string.Equals(project.UserId, userId, StringComparison.Ordinal))
            throw new UnauthorizedAccessException("You do not have access to that project.");

        var canvas = project.Settings.ToCanvas();
        var options = segmentationOptions.Value;
        var now = clock.GetUtcNow().UtcDateTime;

        var characterList = await characters
            .ListByProjectAsync(script.ProjectId, ct).ConfigureAwait(false);

        // Every project needs a narrator so an unattributed line still renders as a
        // subtitle instead of being dropped.
        var narrator = characterList.FirstOrDefault(c => c.IsNarrator);
        if (narrator is null)
        {
            narrator = CastingService.CreateNarrator(script.ProjectId, now);
            await characters.InsertAsync(narrator, ct).ConfigureAwait(false);
            characterList = [.. characterList, narrator];
        }

        var suggestions = CastingService.Suggest(script, characterList)
            .ToDictionary(s => s.SpeakerKey, StringComparer.Ordinal);

        var existing = await scenes.ListByProjectAsync(script.ProjectId, ct).ConfigureAwait(false);

        // A hand-edited scene is never silently replaced by regeneration.
        var preserved = existing
            .Where(s => s.Origin == SceneOrigin.Manual || s.IsUserEdited)
            .ToList();

        var preservedKeys = preserved
            .Where(s => s.SourceSegmentKey is not null)
            .Select(s => s.SourceSegmentKey!)
            .ToHashSet(StringComparer.Ordinal);

        var created = new List<Scene>();
        var unresolved = new HashSet<string>(StringComparer.Ordinal);
        var orderKey = 1000.0;

        foreach (var segment in script.Segments.OrderBy(s => s.Order))
        {
            if (preservedKeys.Contains(segment.SegmentKey))
            {
                orderKey += 1000;
                continue;
            }

            var scene = BuildScene(
                script, segment, canvas, suggestions, narrator, options, orderKey, now, unresolved);

            created.Add(scene);
            orderKey += 1000;
        }

        await scenes.InsertManyAsync(created, ct).ConfigureAwait(false);

        // Renumber for display across both new and preserved scenes.
        var all = created.Concat(preserved).OrderBy(s => s.OrderKey).ToList();
        for (var i = 0; i < all.Count; i++)
        {
            if (all[i].SceneNumber == i + 1) continue;
            all[i].SceneNumber = i + 1;
            await scenes.ReplaceAsync(all[i], ct).ConfigureAwait(false);
        }

        script.Status = ScriptStatus.Confirmed;
        script.UpdatedAt = now;
        await scripts.ReplaceAsync(script, ct).ConfigureAwait(false);

        var warnings = new List<string>();
        if (unresolved.Count > 0)
        {
            warnings.Add(
                $"{unresolved.Count} speaker(s) had no matching character and were given to the narrator.");
        }

        if (!script.HasSourceTimings)
        {
            warnings.Add(
                "This transcript has estimated timings, so scenes have no audio. Upload audio per scene, "
                + "or import from media you own to get real timings.");
        }

        return new SceneGenerationResult(created.Count, preserved.Count, [.. unresolved], warnings);
    }

    private static Scene BuildScene(
        Script script, ScriptSegment segment, Canvas canvas,
        Dictionary<string, SpeakerSuggestion> suggestions, Character narrator,
        SegmentationOptions options, double orderKey, DateTime now, HashSet<string> unresolved)
    {
        var duration = FrameCount.FromSeconds(segment.TimelineDuration.TotalSeconds, canvas.FrameRate);
        var minimum = FrameCount.FromSeconds(options.MinSceneDurationSeconds, canvas.FrameRate);
        if (duration < minimum) duration = minimum;

        var scene = new Scene
        {
            ProjectId = script.ProjectId,
            SceneNumber = segment.Order,
            OrderKey = orderKey,
            Title = segment.SuggestedTitle,
            DurationFrames = duration.Value,
            SourceScriptLineageId = script.ScriptLineageId,
            SourceSegmentKey = segment.SegmentKey,
            Origin = SceneOrigin.Generated,
            Animation = DefaultAnimation(segment.Order, duration, canvas),
            CreatedAt = now,
            UpdatedAt = now
        };

        // Audio is sliced from the ORIGINAL clock, and only when the timings are real.
        if (script.HasSourceTimings)
        {
            scene.Audio = new SceneAudio
            {
                SliceStartSeconds = Math.Max(
                    segment.SourceStart.TotalSeconds - options.AudioSliceHeadPadSeconds, 0),
                SliceEndSeconds = segment.SourceEnd.TotalSeconds + options.AudioSliceTailPadSeconds
            };
        }

        var speakersInScene = new List<string>();

        foreach (var line in segment.Lines)
        {
            string? characterId = null;

            if (!string.IsNullOrEmpty(line.SpeakerKey)
                && suggestions.TryGetValue(line.SpeakerKey, out var suggestion))
            {
                characterId = suggestion.CharacterId;
                if (characterId is null) unresolved.Add(suggestion.DisplayLabel);
            }

            characterId ??= narrator.Id;

            scene.Dialogue.Add(new DialogueLine
            {
                Index = scene.Dialogue.Count,
                SpeakerLabel = line.SpeakerLabel,
                SpeakerCharacterId = characterId,
                Text = line.Text,
                RelativeStartFrame =
                    FrameCount.FromSeconds(line.RelativeStart.TotalSeconds, canvas.FrameRate).Value,
                RelativeEndFrame =
                    FrameCount.FromSeconds(line.RelativeEnd.TotalSeconds, canvas.FrameRate).Value,
                SourceStartSeconds = line.SourceStart.TotalSeconds,
                SourceEndSeconds = line.SourceEnd.TotalSeconds
            });

            if (!speakersInScene.Contains(characterId)) speakersInScene.Add(characterId);
        }

        // Stage whoever speaks, skipping the narrator - it has no sprite.
        var zOrder = 0;
        foreach (var characterId in speakersInScene)
        {
            if (string.Equals(characterId, narrator.Id, StringComparison.Ordinal)) continue;

            scene.Characters.Add(new CharacterPlacement
            {
                CharacterId = characterId,
                PresenceStartFrame = 0,
                PresenceEndFrame = duration.Value,
                Anchor = speakersInScene.Count > 1
                    ? (zOrder == 0 ? Anchor.BottomLeft : Anchor.BottomRight)
                    : Anchor.BottomCenter,
                HeightFraction = 0.70,
                OffsetXFraction = speakersInScene.Count > 1 ? (zOrder == 0 ? 0.06 : -0.06) : 0,
                ZOrder = zOrder++
            });
        }

        return scene;
    }

    /// <summary>
    /// Alternates the background motion so consecutive scenes do not all push in the same
    /// direction, which reads as mechanical.
    /// </summary>
    private static AnimationSettings DefaultAnimation(int order, FrameCount duration, Canvas canvas)
    {
        var effect = (order % 4) switch
        {
            0 => BackgroundEffect.ZoomIn,
            1 => BackgroundEffect.ZoomOut,
            2 => BackgroundEffect.PanRight,
            _ => BackgroundEffect.PanLeft
        };

        var fade = FrameCount.FromSeconds(0.35, canvas.FrameRate);
        // Never let the fades swallow a very short scene.
        if (fade.Value * 2 > duration.Value) fade = new FrameCount(duration.Value / 4);

        return new AnimationSettings(effect, 0.12, Easing.EaseInOut, fade, fade);
    }
}
