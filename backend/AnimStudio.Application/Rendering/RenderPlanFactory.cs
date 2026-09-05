using AnimStudio.Application.Rendering.Models;
using AnimStudio.Domain.Assets;
using AnimStudio.Domain.Characters;
using AnimStudio.Domain.Errors;
using AnimStudio.Domain.Rendering;
using AnimStudio.Domain.Scenes;

namespace AnimStudio.Application.Rendering;

/// <summary>Everything a scene needs, already looked up.</summary>
public sealed record SceneRenderContext(
    Scene Scene,
    Canvas Canvas,
    IReadOnlyDictionary<string, Character> CharactersById,
    IReadOnlyDictionary<string, Asset> AssetsById,
    IReadOnlyDictionary<string, string> MaterializedPathsByAssetId,
    string? SubtitleRelativePath,
    int KenBurnsSupersample,
    int MouthFlapHz);

/// <summary>
/// Converts a scene plus its assets into a <see cref="SceneRenderPlan"/>.
/// <para>
/// Pure, so the anchor arithmetic and dialogue-window logic are testable on their own. The
/// factory resolves asset ids to workspace-relative names, which is what lets the
/// filtergraph builder stay ignorant of storage.
/// </para>
/// </summary>
public static class RenderPlanFactory
{
    public static SceneRenderPlan Create(SceneRenderContext context, int sceneIndex, string outputRelativePath)
    {
        var scene = context.Scene;
        var canvas = context.Canvas;

        if (scene.DurationFrames <= 0)
            throw new RenderException(RenderErrorCode.InvalidSceneDuration,
                $"Scene {sceneIndex + 1} has no duration.");

        var background = ResolveBackground(context, sceneIndex);
        var sprites = ResolveSprites(context, canvas);
        var (audioPath, sliceStart, sliceEnd) = ResolveAudio(context);

        return new SceneRenderPlan
        {
            SceneIndex = sceneIndex,
            SceneId = scene.Id,
            Canvas = canvas,
            Duration = scene.Duration,
            BackgroundRelativePath = background,
            BackgroundAnimation = scene.Animation,
            Sprites = sprites,
            AudioRelativePath = audioPath,
            AudioSliceStartSeconds = sliceStart,
            AudioSliceEndSeconds = sliceEnd,
            SubtitleRelativePath = context.SubtitleRelativePath,
            KenBurnsSupersample = context.KenBurnsSupersample,
            MouthFlapHz = context.MouthFlapHz,
            OutputRelativePath = outputRelativePath
        };
    }

    private static string ResolveBackground(SceneRenderContext context, int sceneIndex)
    {
        var assetId = context.Scene.BackgroundAssetId;
        if (string.IsNullOrEmpty(assetId))
            throw new RenderException(RenderErrorCode.AssetMissing,
                $"Scene {sceneIndex + 1} has no background image.");

        EnsureUsable(context, assetId);

        return context.MaterializedPathsByAssetId.TryGetValue(assetId, out var path)
            ? path
            : throw new RenderException(RenderErrorCode.AssetMissing,
                $"Scene {sceneIndex + 1}'s background image is missing.");
    }

    /// <summary>
    /// A searched asset that has not been approved must never reach a render - that is the
    /// mechanism keeping an unusable licence out of a published video.
    /// </summary>
    private static void EnsureUsable(SceneRenderContext context, string assetId)
    {
        if (!context.AssetsById.TryGetValue(assetId, out var asset)) return;

        if (!asset.IsUsableInScene)
            throw new RenderException(RenderErrorCode.AssetNotUsable,
                $"'{asset.Name}' has not been approved for use yet.");
    }

    private static List<SpritePlan> ResolveSprites(SceneRenderContext context, Canvas canvas)
    {
        var scene = context.Scene;
        var sprites = new List<SpritePlan>();
        var wholeScene = new FrameRange(FrameCount.Zero, scene.Duration);

        foreach (var placement in scene.Characters.OrderBy(c => c.ZOrder))
        {
            if (!context.CharactersById.TryGetValue(placement.CharacterId, out var character))
                continue;

            // A narrator has no sprite; its lines still appear as subtitles.
            var closedId = character.Sprites.ClosedMouthAssetId;
            if (string.IsNullOrEmpty(closedId)) continue;
            if (!context.MaterializedPathsByAssetId.TryGetValue(closedId, out var closedPath)) continue;

            EnsureUsable(context, closedId);

            string? openPath = null;
            var openId = character.Sprites.OpenMouthAssetId;
            if (!string.IsNullOrEmpty(openId)
                && context.MaterializedPathsByAssetId.TryGetValue(openId, out var resolvedOpen))
            {
                EnsureUsable(context, openId);
                openPath = resolvedOpen;
            }

            var presence = placement.Presence.IsEmpty
                ? wholeScene
                : placement.Presence.Clamp(wholeScene);

            var height = (int)Math.Round(canvas.Height * placement.HeightFraction);
            // Even height keeps the scaled width even too, which yuv420p requires.
            if (height % 2 != 0) height++;
            height = Math.Clamp(height, 2, canvas.Height * 2);

            var (x, y) = AnchorExpressions(placement, canvas);

            sprites.Add(new SpritePlan
            {
                CharacterId = character.Id,
                ClosedMouthRelativePath = closedPath,
                OpenMouthRelativePath = openPath,
                HeightPixels = height,
                XExpression = x,
                YExpression = y,
                Presence = presence,
                SpeakingWindows = SpeakingWindows(scene, character.Id, presence),
                Entrance = placement.Entrance,
                EntranceDuration = new FrameCount(placement.EntranceDurationFrames),
                FlipHorizontal = placement.FlipHorizontal,
                ZOrder = placement.ZOrder
            });
        }

        return sprites;
    }

    /// <summary>
    /// Anchor plus fractional offsets as ffmpeg overlay expressions. Using W/H and w/h
    /// rather than pixel constants keeps a scene correct at any canvas size.
    /// </summary>
    internal static (string X, string Y) AnchorExpressions(CharacterPlacement placement, Canvas canvas)
    {
        var offsetX = (int)Math.Round(canvas.Width * placement.OffsetXFraction);
        var offsetY = (int)Math.Round(canvas.Height * placement.OffsetYFraction);

        var x = placement.Anchor switch
        {
            Anchor.BottomLeft or Anchor.CenterLeft => "0",
            Anchor.BottomRight or Anchor.CenterRight => "W-w",
            _ => "(W-w)/2"
        };

        var y = placement.Anchor switch
        {
            Anchor.BottomLeft or Anchor.BottomCenter or Anchor.BottomRight => "H-h",
            _ => "(H-h)/2"
        };

        if (offsetX != 0) x = $"{x}{(offsetX > 0 ? "+" : "-")}{Math.Abs(offsetX)}";
        if (offsetY != 0) y = $"{y}{(offsetY > 0 ? "+" : "-")}{Math.Abs(offsetY)}";

        return (x, y);
    }

    /// <summary>
    /// The windows in which this character has a line, clamped to the time it is actually
    /// on screen so a sprite cannot "talk" while hidden.
    /// </summary>
    internal static List<FrameRange> SpeakingWindows(Scene scene, string characterId, FrameRange presence)
    {
        var windows = new List<FrameRange>();

        foreach (var line in scene.Dialogue)
        {
            if (!string.Equals(line.SpeakerCharacterId, characterId, StringComparison.Ordinal)) continue;

            var window = line.Timing.Clamp(presence);
            if (!window.IsEmpty) windows.Add(window);
        }

        return windows;
    }

    private static (string? Path, double? Start, double? End) ResolveAudio(SceneRenderContext context)
    {
        var audio = context.Scene.Audio;
        if (string.IsNullOrEmpty(audio.AssetId)) return (null, null, null);
        if (!context.MaterializedPathsByAssetId.TryGetValue(audio.AssetId, out var path))
            return (null, null, null);

        return audio.IsSlice
            ? (path, audio.SliceStartSeconds, audio.SliceEndSeconds)
            : (path, null, null);
    }
}
