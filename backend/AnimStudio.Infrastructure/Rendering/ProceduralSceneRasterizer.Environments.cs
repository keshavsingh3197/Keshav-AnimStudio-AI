using AnimStudio.Application.Rendering;

namespace AnimStudio.Infrastructure.Rendering;

/// <summary>
/// Scene-aware cinematic layer: follows the script's <c>[SCENE]</c> cues (or places named in the dialogue) to paint a
/// matching 3D environment (forest ashram, river ghat, Himalaya, palace court, village, battlefield, archive, city),
/// moves photo backdrops with a slow Ken Burns push, and finishes each frame with time-of-day grading, a lens
/// vignette, light film grain and a short dip at every scene cut.
/// </summary>
public sealed partial class ProceduralSceneRasterizer
{
    /// <summary>The scene the frame is in: what to paint, which photo, and how far through the scene it is.</summary>
    internal readonly record struct SceneMoment(
        SceneSetting Setting,
        SceneTimeOfDay TimeOfDay,
        int SceneIndex,
        double LocalProgress,
        float CutDip);

    internal readonly record struct SceneRun(double Start, double End, SceneSetting Setting, SceneTimeOfDay Time, int Index);

    private const double CutDipSeconds = 0.32;

    private SceneRun[] _sceneRuns = [];
    private float[] _vignetteX = [];
    private float[] _vignetteY = [];
    private uint _grainState;
    private (float X, float Y, float Size, float Phase)[] _stars = [];

    private void InitCinematics(int seed)
    {
        _grainState = (uint)(seed * 2654435761u) | 1u;

        // Separable lens vignette: corners fall to ~72%, centre stays at 100%.
        _vignetteX = new float[Width];
        _vignetteY = new float[Height];
        for (var x = 0; x < Width; x++)
        {
            var nx = (x / (float)(Width - 1)) * 2f - 1f;
            _vignetteX[x] = 1f - 0.16f * nx * nx * nx * nx - 0.06f * nx * nx;
        }
        for (var y = 0; y < Height; y++)
        {
            var ny = (y / (float)(Height - 1)) * 2f - 1f;
            _vignetteY[y] = 1f - 0.12f * ny * ny * ny * ny - 0.05f * ny * ny;
        }

        var rng = new Random(seed ^ 0x5F3759DF);
        _stars = new (float, float, float, float)[70];
        for (var i = 0; i < _stars.Length; i++)
            _stars[i] = ((float)rng.NextDouble(), (float)(rng.NextDouble() * 0.5), 0.6f + (float)rng.NextDouble() * 1.6f, (float)(rng.NextDouble() * Math.PI * 2));

        _sceneRuns = BuildSceneRuns(_dialoguePlan);
    }

    /// <summary>Contiguous turns sharing a cue become one run; the first run starts at 0 and the last ends at +∞.</summary>
    internal static SceneRun[] BuildSceneRuns(ProceduralDialoguePlan? plan)
    {
        if (plan is null) return [];
        var turns = plan.Turns.Where(t => !string.IsNullOrWhiteSpace(t.SceneBackdropCue)).OrderBy(t => t.StartSeconds).ToList();
        if (turns.Count == 0) return [];

        var order = plan.SceneCueOrder;
        var runs = new List<SceneRun>();
        foreach (var turn in turns)
        {
            var (setting, time) = SceneDirectives.FromCue(turn.SceneBackdropCue);
            var index = Math.Max(0, IndexOf(order, turn.SceneBackdropCue!));
            if (runs.Count > 0 && runs[^1].Index == index) continue;
            if (runs.Count > 0) runs[^1] = runs[^1] with { End = turn.StartSeconds };
            runs.Add(new SceneRun(runs.Count == 0 ? 0 : turn.StartSeconds, double.PositiveInfinity, setting, time, index));
        }
        return [.. runs];
    }

    private static int IndexOf(IReadOnlyList<string> list, string value)
    {
        for (var i = 0; i < list.Count; i++)
            if (string.Equals(list[i], value, StringComparison.Ordinal)) return i;
        return -1;
    }

    internal SceneMoment ResolveScene(double t, double duration)
    {
        if (_sceneRuns.Length == 0) return new SceneMoment(SceneSetting.Auto, SceneTimeOfDay.Auto, -1, 0, 1f);

        var i = 0;
        while (i + 1 < _sceneRuns.Length && t >= _sceneRuns[i + 1].Start) i++;
        var run = _sceneRuns[i];
        var end = double.IsPositiveInfinity(run.End) ? duration : run.End;
        var local = Math.Clamp((t - run.Start) / Math.Max(0.5, end - run.Start), 0, 1);

        // Short dip to near-black at each cut, like an edit between camera setups.
        var dip = 1f;
        if (i > 0) dip = MathF.Min(dip, CutDip(t - run.Start));
        if (i + 1 < _sceneRuns.Length) dip = MathF.Min(dip, CutDip(_sceneRuns[i + 1].Start - t));
        return new SceneMoment(run.Setting, run.Time, run.Index, local, dip);
    }

    private static float CutDip(double secondsFromCut)
    {
        if (secondsFromCut < 0 || secondsFromCut >= CutDipSeconds) return 1f;
        var k = (float)(secondsFromCut / CutDipSeconds);
        return 0.18f + 0.82f * k * k * (3f - 2f * k);
    }

    // ------------------------------------------------------------------ photo backdrops

    /// <summary>
    /// Photo backdrop with a slow push-in and drift (Ken Burns), one photo per scene when the script has scenes, else
    /// photos shared evenly across the video. Sampled bilinearly through per-row/per-column lookup tables.
    /// </summary>
    private void PaintPhotoBackdropKenBurns(
        IReadOnlyList<byte[]> photos, double t, double u, SceneMoment scene,
        float topR, float topG, float topB, float midR, float midG, float midB, float botR, float botG, float botB)
    {
        int index;
        double local;
        if (scene.SceneIndex >= 0)
        {
            index = scene.SceneIndex % photos.Count;
            local = scene.LocalProgress;
        }
        else
        {
            var scaled = u * photos.Count;
            index = Math.Clamp((int)Math.Floor(scaled), 0, photos.Count - 1);
            local = Math.Clamp(scaled - index, 0, 1);
        }

        var photo = photos[index];
        var eased = (float)(local * local * (3 - 2 * local));
        // A template picture is still and whole by default: characters were placed on exact spots of it. Its optional
        // moves are small and follow the video clock rather than the scene, so a scene cut never makes it jump.
        var isTemplate = IsTemplateBackdrop;
        float zoom, panX, panY;
        if (isTemplate)
        {
            (zoom, panX, panY) = TemplateCameraMove(t);
        }
        else
        {
            zoom = 1.05f + 0.11f * eased;
            var maxPanX = (1f - 1f / zoom) * Width * 0.5f;
            var maxPanY = (1f - 1f / zoom) * Height * 0.5f;
            var dirX = index % 2 == 0 ? 1f : -1f;
            panX = dirX * maxPanX * 0.8f * (eased - 0.5f) * 2f;
            panY = -maxPanY * 0.5f * (eased - 0.5f) * 2f;
        }
        // A template keeps its own colours; other photos are tinted further toward the event colours.
        var photoWeight = isTemplate ? 0.92f : 0.80f;
        var tintWeight = 1f - photoWeight;

        var colX = _kenBurnsColX ??= new int[Width];
        var colF = _kenBurnsColF ??= new float[Width];
        var cx = Width * 0.5f;
        var cy = Height * 0.5f;
        for (var x = 0; x < Width; x++)
        {
            var sx = Math.Clamp((x - cx) / zoom + cx + panX, 0f, Width - 1.001f);
            colX[x] = (int)sx;
            colF[x] = sx - (int)sx;
        }

        var stride = Width * 4;
        ForRowBands(0, Height, (long)Width * Height, (band0, band1) =>
        {
            for (var y = band0; y < band1; y++)
            {
                var sy = Math.Clamp((y - cy) / zoom + cy + panY, 0f, Height - 1.001f);
                var y0 = (int)sy;
                var fy = sy - y0;
                var row0 = y0 * stride;
                var row1 = Math.Min(y0 + 1, Height - 1) * stride;

                var ny = (float)y / (Height - 1);
                var tr = ny < 0.52f ? topR + (midR - topR) * (ny / 0.52f) : midR + (botR - midR) * ((ny - 0.52f) / 0.48f);
                var tg = ny < 0.52f ? topG + (midG - topG) * (ny / 0.52f) : midG + (botG - midG) * ((ny - 0.52f) / 0.48f);
                var tb = ny < 0.52f ? topB + (midB - topB) * (ny / 0.52f) : midB + (botB - midB) * ((ny - 0.52f) / 0.48f);

                var outRow = y * stride;
                for (var x = 0; x < Width; x++)
                {
                    var a = row0 + colX[x] * 4;
                    var b = a + 4;
                    var c = row1 + colX[x] * 4;
                    var d = c + 4;
                    var fx = colF[x];
                    var w00 = (1 - fx) * (1 - fy);
                    var w10 = fx * (1 - fy);
                    var w01 = (1 - fx) * fy;
                    var w11 = fx * fy;
                    var o = outRow + x * 4;
                    // Mostly photo, lightly tinted toward the event colours so captions and characters stay readable.
                    _frame[o] = ClampByte((photo[a] * w00 + photo[b] * w10 + photo[c] * w01 + photo[d] * w11) * photoWeight + tr * tintWeight);
                    _frame[o + 1] = ClampByte((photo[a + 1] * w00 + photo[b + 1] * w10 + photo[c + 1] * w01 + photo[d + 1] * w11) * photoWeight + tg * tintWeight);
                    _frame[o + 2] = ClampByte((photo[a + 2] * w00 + photo[b + 2] * w10 + photo[c + 2] * w01 + photo[d + 2] * w11) * photoWeight + tb * tintWeight);
                    _frame[o + 3] = 255;
                }
            }
        });
    }

    private int[]? _kenBurnsColX;
    private float[]? _kenBurnsColF;

    /// <summary>Seconds for one full breath of the gentle zoom, and one full sweep (there and back) of the slow pan.</summary>
    private const double TemplateZoomCycleSeconds = 20.0;
    private const double TemplatePanCycleSeconds = 32.0;

    /// <summary>
    /// Zoom and pan (in output pixels) of a template backdrop at <paramref name="t"/> seconds. Both moves start at rest
    /// (zoom 1, centred) and are periodic sines, so any video length loops smoothly and the first frame matches the
    /// placement editor.
    /// </summary>
    internal (float Zoom, float PanX, float PanY) TemplateCameraMove(double t)
    {
        switch (_stageLayout?.TemplateMotion ?? TemplateBackdropMotion.Still)
        {
            case TemplateBackdropMotion.GentleZoom:
            {
                // 1.00 -> 1.07 -> 1.00: characters near the middle move by about 1% of the frame.
                var breath = 0.5f - 0.5f * MathF.Cos((float)(t * 2 * Math.PI / TemplateZoomCycleSeconds));
                return (1f + 0.07f * breath, 0f, 0f);
            }
            case TemplateBackdropMotion.SlowPan:
            {
                // A fixed 10% crop leaves room to glide; the sweep uses 90% of that room so the edge never shows.
                const float zoom = 1.10f;
                var maxPanX = (1f - 1f / zoom) * Width * 0.5f;
                var sweep = MathF.Sin((float)(t * 2 * Math.PI / TemplatePanCycleSeconds));
                return (zoom, maxPanX * 0.9f * sweep, 0f);
            }
            default:
                return (1f, 0f, 0f);
        }
    }

    // ------------------------------------------------------------------ painted environments

    private float HorizonY => Height > Width ? Height * 0.56f : Height * 0.64f;

    /// <summary>Paints the scene's environment between the theme sky and the characters.</summary>
    private void DrawSettingLayer(SceneMoment scene, double t)
    {
        if (scene.TimeOfDay == SceneTimeOfDay.Night) DrawNightSky(t);
        else if (scene.TimeOfDay is SceneTimeOfDay.Dawn or SceneTimeOfDay.Sunset) DrawLowSun(scene.TimeOfDay, t);

        // With a real photo behind, only light atmosphere goes on top; painted props would fight the photo.
        if (_backdropFrames is not null)
        {
            DrawLightShafts(t, 255, 226, 170, 0.07f);
            DrawDriftingDust(t, 255, 236, 200);
            if (IsTemplateBackdrop)
            {
                // The template replaces the theme's 3D geometry, so it gets the theme's glowing particles instead.
                var minSide = MathF.Min(Width, Height);
                DrawParticles(t, upward: true,
                    Palette.PrimaryRgb.R, Palette.PrimaryRgb.G, Palette.PrimaryRgb.B,
                    Palette.SecondaryRgb.R, Palette.SecondaryRgb.G, Palette.SecondaryRgb.B,
                    minSide * 0.006f);
            }
            return;
        }

        switch (scene.Setting)
        {
            case SceneSetting.ForestAshram: DrawForestAshram(t); break;
            case SceneSetting.RiverGhat: DrawRiverGhat(t); break;
            case SceneSetting.Himalaya: DrawHimalaya(t); break;
            case SceneSetting.PalaceCourt: DrawPalaceCourt(t); break;
            case SceneSetting.Village: DrawVillage(t); break;
            case SceneSetting.Battlefield: DrawBattlefield(t); break;
            case SceneSetting.Archive: DrawArchive(t); break;
            case SceneSetting.ModernCity: DrawCitySkyline(t); break;
            case SceneSetting.ChaiStall: DrawChaiStall(t); break;
            case SceneSetting.ComedyStage: DrawComedyStage(t); break;
            case SceneSetting.Temple: DrawTempleSanctum(t); break;
            case SceneSetting.Cosmos: DrawCosmosNebula(t); break;
        }
    }

    private void DrawNightSky(double t)
    {
        var minSide = MathF.Min(Width, Height);
        foreach (var (x, y, size, phase) in _stars)
        {
            var twinkle = 0.45f + 0.55f * MathF.Sin((float)t * 2.2f + phase);
            DrawAdditiveDisc(x * Width, Height * (0.17f + y * 0.6f), size * minSide * 0.0028f, 220, 230, 255, 0.55f * twinkle);
        }
        var moonX = Width * 0.78f;
        var moonY = Height * (Height > Width ? 0.24f : 0.22f);
        DrawAdditiveDisc(moonX, moonY, minSide * 0.16f, 140, 160, 220, 0.22f);
        FillEllipse(moonX, moonY, minSide * 0.045f, minSide * 0.045f, 236, 238, 228, 0.96f);
        FillEllipse(moonX + minSide * 0.012f, moonY - minSide * 0.008f, minSide * 0.011f, minSide * 0.009f, 205, 208, 200, 0.6f);
    }

    private void DrawLowSun(SceneTimeOfDay time, double t)
    {
        var minSide = MathF.Min(Width, Height);
        var sunX = time == SceneTimeOfDay.Dawn ? Width * 0.28f : Width * 0.72f;
        var sunY = HorizonY - minSide * 0.06f;
        var (r, g, b) = time == SceneTimeOfDay.Dawn ? ((byte)255, (byte)178, (byte)92) : ((byte)255, (byte)120, (byte)70);
        DrawAdditiveDisc(sunX, sunY, minSide * 0.55f, r, g, b, 0.20f);
        DrawAdditiveDisc(sunX, sunY, minSide * 0.10f, 255, 236, 190, 0.75f);
        DrawLightShafts(t, r, g, b, 0.08f, sunX, sunY);
    }

    /// <summary>God rays fanning from a light source (default: upper left).</summary>
    private void DrawLightShafts(double t, byte r, byte g, byte b, float alpha, float? fromX = null, float? fromY = null)
    {
        var sx = fromX ?? Width * 0.18f;
        var sy = fromY ?? Height * 0.12f;
        var len = MathF.Max(Width, Height) * 1.1f;
        for (var i = 0; i < 6; i++)
        {
            var angle = 0.35f + i * 0.17f + 0.03f * MathF.Sin((float)t * 0.4f + i);
            var ex = sx + MathF.Cos(angle) * len;
            var ey = sy + MathF.Sin(angle) * len;
            DrawGlowLine(sx, sy, ex, ey, MathF.Min(Width, Height) * 0.03f, r, g, b, alpha * (0.6f + 0.4f * MathF.Sin((float)t * 0.7f + i * 1.3f)));
        }
    }

    private void DrawDriftingDust(double t, byte r, byte g, byte b)
    {
        var minSide = MathF.Min(Width, Height);
        for (var i = 0; i < 28; i++)
        {
            var p = _particles[i];
            var x = ((p.BaseX * 0.5f + 0.5f) + (float)t * 0.012f * p.Speed) % 1f;
            var y = ((p.BaseY * 0.5f + 0.5f) + MathF.Sin((float)t * 0.5f + p.Phase) * 0.02f) % 1f;
            DrawAdditiveDisc(x * Width, (0.18f + y * 0.6f) * Height, minSide * 0.004f * p.Size * 0.4f, r, g, b, 0.22f);
        }
    }

    private void FillRect(float x0, float y0, float x1, float y1, byte r, byte g, byte b, float alpha)
    {
        var minX = Math.Clamp((int)MathF.Min(x0, x1), 0, Width);
        var maxX = Math.Clamp((int)MathF.Ceiling(MathF.Max(x0, x1)), 0, Width);
        var minY = Math.Clamp((int)MathF.Min(y0, y1), 0, Height);
        var maxY = Math.Clamp((int)MathF.Ceiling(MathF.Max(y0, y1)), 0, Height);
        var inv = 1f - alpha;
        ForRowBands(minY, maxY, (long)(maxY - minY) * (maxX - minX), (band0, band1) =>
        {
            for (var y = band0; y < band1; y++)
            {
                var row = y * Width * 4;
                for (var x = minX; x < maxX; x++)
                {
                    var i = row + x * 4;
                    _frame[i] = ClampByte(_frame[i] * inv + r * alpha);
                    _frame[i + 1] = ClampByte(_frame[i + 1] * inv + g * alpha);
                    _frame[i + 2] = ClampByte(_frame[i + 2] * inv + b * alpha);
                }
            }
        });
    }

    /// <summary>Vertical gradient fill, top colour to bottom colour.</summary>
    private void FillGradientRect(float x0, float y0, float x1, float y1, (byte R, byte G, byte B) top, (byte R, byte G, byte B) bottom, float alpha)
    {
        var minY = Math.Clamp((int)y0, 0, Height);
        var maxY = Math.Clamp((int)MathF.Ceiling(y1), 0, Height);
        var minX = Math.Clamp((int)MathF.Min(x0, x1), 0, Width);
        var maxX = Math.Clamp((int)MathF.Ceiling(MathF.Max(x0, x1)), 0, Width);
        var span = Math.Max(1, maxY - minY);
        var inv = 1f - alpha;
        ForRowBands(minY, maxY, (long)(maxY - minY) * (maxX - minX), (band0, band1) =>
        {
            for (var y = band0; y < band1; y++)
            {
                var k = (y - minY) / (float)span;
                var r = (byte)(top.R + (bottom.R - top.R) * k);
                var g = (byte)(top.G + (bottom.G - top.G) * k);
                var b = (byte)(top.B + (bottom.B - top.B) * k);
                var row = y * Width * 4;
                for (var x = minX; x < maxX; x++)
                {
                    var i = row + x * 4;
                    _frame[i] = ClampByte(_frame[i] * inv + r * alpha);
                    _frame[i + 1] = ClampByte(_frame[i + 1] * inv + g * alpha);
                    _frame[i + 2] = ClampByte(_frame[i + 2] * inv + b * alpha);
                }
            }
        });
    }

    /// <summary>A silhouette band whose top edge follows <paramref name="ridge"/> (0..1 of height, per x fraction).</summary>
    private void FillRidge(Func<float, float> ridge, float bottomY, byte r, byte g, byte b, float alpha)
    {
        var bottom = Math.Clamp((int)bottomY, 0, Height - 1);
        var tops = System.Buffers.ArrayPool<int>.Shared.Rent(Width);
        var highest = bottom;
        for (var x = 0; x < Width; x++)
        {
            tops[x] = Math.Clamp((int)(ridge(x / (float)Width) * Height), 0, bottom);
            highest = Math.Min(highest, tops[x]);
        }

        var inv = 1f - alpha;
        ForRowBands(highest, bottom + 1, (long)(bottom + 1 - highest) * Width, (band0, band1) =>
        {
            for (var y = band0; y < band1; y++)
            {
                var row = y * Width * 4;
                for (var x = 0; x < Width; x++)
                {
                    if (y < tops[x]) continue;
                    var i = row + x * 4;
                    _frame[i] = ClampByte(_frame[i] * inv + r * alpha);
                    _frame[i + 1] = ClampByte(_frame[i + 1] * inv + g * alpha);
                    _frame[i + 2] = ClampByte(_frame[i + 2] * inv + b * alpha);
                }
            }
        });
        System.Buffers.ArrayPool<int>.Shared.Return(tops);
    }

    private void DrawTree(float x, float groundY, float size, double t, float phase, (byte R, byte G, byte B) leaf)
    {
        var sway = MathF.Sin((float)t * 0.9f + phase) * size * 0.04f;
        FillCapsule(x, groundY, x + sway * 0.4f, groundY - size * 0.62f, size * 0.055f, 74, 48, 30, 0.97f);
        FillCapsule(x + sway * 0.2f, groundY - size * 0.38f, x - size * 0.16f + sway * 0.5f, groundY - size * 0.6f, size * 0.025f, 74, 48, 30, 0.95f);
        var cx = x + sway;
        var cy = groundY - size * 0.78f;
        // Canopy: dark core, lit upper-left clusters (simple 3D shading).
        FillEllipse(cx, cy, size * 0.34f, size * 0.26f, (byte)(leaf.R * 0.55f), (byte)(leaf.G * 0.55f), (byte)(leaf.B * 0.55f), 0.97f);
        FillEllipse(cx - size * 0.16f, cy + size * 0.05f, size * 0.2f, size * 0.17f, (byte)(leaf.R * 0.7f), (byte)(leaf.G * 0.7f), (byte)(leaf.B * 0.7f), 0.96f);
        FillEllipse(cx + size * 0.15f, cy + size * 0.06f, size * 0.21f, size * 0.16f, (byte)(leaf.R * 0.62f), (byte)(leaf.G * 0.62f), (byte)(leaf.B * 0.62f), 0.96f);
        FillEllipse(cx - size * 0.07f, cy - size * 0.1f, size * 0.2f, size * 0.15f, leaf.R, leaf.G, leaf.B, 0.9f);
        DrawAdditiveDisc(cx - size * 0.12f, cy - size * 0.14f, size * 0.14f, 255, 240, 180, 0.10f);
    }

    private void DrawHut(float x, float groundY, float size)
    {
        FillRect(x - size * 0.42f, groundY - size * 0.48f, x + size * 0.42f, groundY, 150, 104, 64, 0.97f);
        FillRect(x - size * 0.42f, groundY - size * 0.48f, x - size * 0.30f, groundY, 118, 80, 48, 0.9f);
        FillRect(x - size * 0.1f, groundY - size * 0.3f, x + size * 0.1f, groundY, 48, 30, 20, 0.95f);
        // Thatched roof
        for (var i = 0; i < 6; i++)
        {
            var k = i / 5f;
            var w = size * (0.62f - k * 0.5f);
            var y = groundY - size * (0.46f + k * 0.34f);
            FillCapsule(x - w, y, x + w, y, size * 0.07f, (byte)(176 - i * 6), (byte)(140 - i * 6), (byte)(66 - i * 4), 0.97f);
        }
    }

    private void DrawForestAshram(double t)
    {
        var h = HorizonY;
        var minSide = MathF.Min(Width, Height);
        // Misty distant canopy, then a nearer darker one.
        FillRidge(nx => (h / Height) - 0.07f - 0.03f * MathF.Sin(nx * 23f) - 0.02f * MathF.Sin(nx * 51f + 1.3f), h, 30, 64, 48, 0.75f);
        FillRidge(nx => (h / Height) - 0.035f - 0.022f * MathF.Abs(MathF.Sin(nx * 31f + 0.6f)), h + 2, 18, 40, 30, 0.9f);
        FillGradientRect(0, h, Width, Height, (36, 58, 32), (16, 26, 16), 0.85f);
        DrawLightShafts(t, 255, 230, 160, 0.09f);

        DrawHut(Width * (Height > Width ? 0.63f : 0.6f), h - minSide * 0.01f, minSide * 0.15f);
        DrawTree(Width * 0.07f, h + minSide * 0.12f, minSide * 0.62f, t, 0.2f, (52, 120, 60));
        DrawTree(Width * 0.93f, h + minSide * 0.10f, minSide * 0.58f, t, 1.7f, (60, 128, 56));
        DrawTree(Width * 0.22f, h + minSide * 0.02f, minSide * 0.36f, t, 2.9f, (46, 104, 52));
        DrawTree(Width * 0.79f, h + minSide * 0.03f, minSide * 0.34f, t, 4.1f, (54, 112, 50));

        // Low mist band and fireflies.
        for (var i = 0; i < 3; i++)
        {
            var mx = Width * (((float)t * 0.01f * (i + 1) + i * 0.37f) % 1f);
            FillEllipse(mx, h + minSide * 0.02f, Width * 0.35f, minSide * 0.03f, 200, 220, 210, 0.07f);
        }
        for (var i = 0; i < 18; i++)
        {
            var p = _particles[i];
            var x = Width * (0.5f + 0.48f * MathF.Sin((float)t * 0.2f * p.Speed + p.Phase));
            var y = h + minSide * 0.08f * MathF.Sin((float)t * 0.33f + p.Phase * 2f) - minSide * 0.06f;
            DrawAdditiveDisc(x, y, minSide * 0.007f, 220, 255, 150, 0.4f * (0.5f + 0.5f * MathF.Sin((float)t * 3f + p.Phase)));
        }
    }

    private void DrawRiverGhat(double t)
    {
        var h = HorizonY;
        var minSide = MathF.Min(Width, Height);
        var waterBottom = Math.Min(Height, h + minSide * 0.32f);
        // Far bank with small temple silhouettes.
        FillRidge(nx => (h / Height) - 0.018f - (MathF.Abs(nx - 0.3f) < 0.025f || MathF.Abs(nx - 0.66f) < 0.02f ? 0.05f : 0f), h, 34, 28, 40, 0.85f);
        FillGradientRect(0, h, Width, waterBottom, (70, 104, 140), (24, 42, 66), 0.9f);

        // Shimmering reflection streaks drifting with the current.
        for (var i = 0; i < 26; i++)
        {
            var p = _particles[i];
            var y = h + (waterBottom - h) * ((i * 0.618f) % 1f);
            var x = Width * (((p.BaseX * 0.5f + 0.5f) + (float)t * 0.02f * p.Speed) % 1f);
            var w = minSide * (0.03f + 0.05f * p.Size / 7f);
            DrawGlowLine(x - w, y, x + w, y, 1.4f, 255, 214, 150, 0.35f + 0.25f * MathF.Sin((float)t * 2.4f + p.Phase));
        }

        // Ghat steps on the left bank.
        for (var i = 0; i < 6; i++)
        {
            var y = waterBottom - i * minSide * 0.03f;
            var w = Width * (0.34f - i * 0.035f);
            FillRect(0, y - minSide * 0.03f, w, y, (byte)(170 - i * 8), (byte)(140 - i * 8), (byte)(104 - i * 6), 0.95f);
            FillRect(0, y - minSide * 0.004f, w, y, 90, 70, 52, 0.6f);
        }
        // Floating diyas.
        for (var i = 0; i < 5; i++)
        {
            var x = Width * ((0.45f + i * 0.13f + (float)t * 0.008f) % 1f);
            var y = h + (waterBottom - h) * (0.3f + 0.12f * (i % 3)) + MathF.Sin((float)t * 1.3f + i) * 2f;
            FillEllipse(x, y, minSide * 0.016f, minSide * 0.006f, 150, 70, 20, 0.95f);
            DrawAdditiveDisc(x, y - minSide * 0.01f, minSide * 0.03f, 255, 190, 90, 0.55f);
        }
    }

    private void DrawHimalaya(double t)
    {
        var h = HorizonY;
        var minSide = MathF.Min(Width, Height);
        static float Peak(float nx, float a, float f, float p) => a * MathF.Max(0f, 1f - MathF.Abs(((nx * f + p) % 1f) - 0.5f) * 2f);

        Func<float, float> back = nx => (h / Height) - 0.10f - Peak(nx, 0.16f, 2.3f, 0.1f) - Peak(nx, 0.07f, 5.1f, 0.4f);
        Func<float, float> front = nx => (h / Height) - 0.03f - Peak(nx, 0.09f, 3.2f, 0.65f) - Peak(nx, 0.03f, 9f, 0.2f);
        FillRidge(back, h, 92, 104, 132, 0.85f);
        // Snow caps on the back range.
        for (var x = 0; x < Width; x++)
        {
            var top = (int)(back(x / (float)Width) * Height);
            var cap = (int)(minSide * 0.05f);
            for (var y = top; y < top + cap && y < h; y++) BlendPixel(x, y, 240, 244, 250, 0.85f * (1f - (y - top) / (float)cap));
        }
        FillRidge(front, h + 1, 46, 54, 72, 0.92f);
        FillGradientRect(0, h, Width, Height, (60, 70, 84), (24, 28, 36), 0.85f);

        // Slow clouds drifting across the peaks.
        for (var i = 0; i < 4; i++)
        {
            var cx = Width * ((((float)t * 0.012f) + i * 0.29f) % 1.3f - 0.15f);
            var cy = h - minSide * (0.18f + 0.05f * (i % 2));
            FillEllipse(cx, cy, minSide * 0.22f, minSide * 0.04f, 236, 240, 248, 0.16f);
            FillEllipse(cx + minSide * 0.08f, cy - minSide * 0.02f, minSide * 0.14f, minSide * 0.035f, 246, 248, 252, 0.14f);
        }
        DrawDriftingDust(t, 240, 246, 255);
    }

    private void DrawPalaceCourt(double t)
    {
        var h = HorizonY;
        var minSide = MathF.Min(Width, Height);
        var topY = Height > Width ? Height * 0.17f : Height * 0.15f;
        // Rich back wall, glowing throne alcove and a polished marble floor.
        FillGradientRect(0, topY, Width, h, (88, 30, 40), (52, 18, 26), 0.55f);
        DrawAdditiveDisc(Width * 0.5f, h - minSide * 0.12f, minSide * 0.32f, 255, 196, 90, 0.22f);
        FillEllipse(Width * 0.5f, h - minSide * 0.11f, minSide * 0.12f, minSide * 0.16f, 160, 110, 40, 0.7f);
        FillRect(Width * 0.5f - minSide * 0.09f, h - minSide * 0.1f, Width * 0.5f + minSide * 0.09f, h, 196, 140, 52, 0.85f);
        FillGradientRect(0, h, Width, Height, (190, 170, 150), (90, 72, 64), 0.8f);
        for (var i = -6; i <= 6; i++)
            DrawGlowLine(Width * 0.5f, h, Width * 0.5f + i * Width * 0.22f, Height, 1.1f, 255, 240, 220, 0.12f);

        // Carved pillars with gold capitals, receding pairs.
        float[] xs = Height > Width ? [0.05f, 0.95f, 0.2f, 0.8f] : [0.06f, 0.94f, 0.22f, 0.78f, 0.36f, 0.64f];
        for (var i = 0; i < xs.Length; i++)
        {
            var depth = i / 2;
            var x = Width * xs[i];
            var w = minSide * (0.045f - depth * 0.01f);
            var bottom = h + minSide * (0.1f - depth * 0.04f);
            FillRect(x - w, topY, x + w, bottom, (byte)(226 - depth * 22), (byte)(206 - depth * 22), (byte)(180 - depth * 20), 0.97f);
            FillRect(x - w, topY, x - w * 0.3f, bottom, (byte)(170 - depth * 20), (byte)(150 - depth * 20), (byte)(130 - depth * 18), 0.6f);
            FillRect(x - w * 1.4f, topY, x + w * 1.4f, topY + minSide * 0.025f, 214, 170, 60, 0.95f);
            FillRect(x - w * 1.3f, bottom - minSide * 0.02f, x + w * 1.3f, bottom, 200, 160, 64, 0.95f);
        }
        // Hanging lamps.
        for (var i = 0; i < 3; i++)
        {
            var x = Width * (0.3f + i * 0.2f);
            var y = topY + minSide * (0.1f + 0.02f * MathF.Sin((float)t * 1.1f + i));
            DrawGlowLine(x, topY, x, y, 1f, 200, 170, 90, 0.5f);
            FillEllipse(x, y, minSide * 0.018f, minSide * 0.022f, 214, 160, 60, 0.95f);
            DrawAdditiveDisc(x, y + minSide * 0.01f, minSide * 0.08f, 255, 200, 110, 0.35f);
        }
    }

    private void DrawVillage(double t)
    {
        var h = HorizonY;
        var minSide = MathF.Min(Width, Height);
        FillRidge(nx => (h / Height) - 0.02f - 0.015f * MathF.Sin(nx * 9f), h, 64, 92, 54, 0.85f);
        // Crop rows in perspective.
        for (var i = 0; i < 9; i++)
        {
            var k = i / 8f;
            var y = h + (Height - h) * k * k;
            var y2 = h + (Height - h) * MathF.Pow((i + 1) / 8f, 2);
            FillRect(0, y, Width, y2, (byte)(i % 2 == 0 ? 120 : 96), (byte)(i % 2 == 0 ? 140 : 116), (byte)(i % 2 == 0 ? 60 : 48), 0.8f);
        }
        DrawHut(Width * 0.16f, h + minSide * 0.02f, minSide * 0.2f);
        DrawHut(Width * 0.84f, h + minSide * 0.015f, minSide * 0.18f);
        DrawTree(Width * 0.5f, h + minSide * 0.005f, minSide * 0.3f, t, 0.9f, (70, 126, 58));
        // Chimney smoke curling up.
        for (var i = 0; i < 6; i++)
        {
            var k = (((float)t * 0.15f) + i / 6f) % 1f;
            var x = Width * 0.16f + MathF.Sin(k * 6f + (float)t) * minSide * 0.02f;
            var y = h - minSide * (0.12f + k * 0.25f);
            FillEllipse(x, y, minSide * (0.02f + k * 0.04f), minSide * (0.015f + k * 0.03f), 210, 210, 214, 0.18f * (1f - k));
        }
    }

    private void DrawBattlefield(double t)
    {
        var h = HorizonY;
        var minSide = MathF.Min(Width, Height);
        FillGradientRect(0, h, Width, Height, (120, 86, 54), (58, 38, 24), 0.85f);
        // Distant army: rows of spear tips and helmets.
        for (var i = 0; i < 60; i++)
        {
            var x = Width * (i / 59f);
            var y = h - minSide * (0.01f + 0.006f * MathF.Sin(i * 1.7f));
            FillEllipse(x, y, minSide * 0.008f, minSide * 0.012f, 40, 30, 26, 0.9f);
            if (i % 3 == 0) DrawGlowLine(x, y, x + minSide * 0.004f, y - minSide * 0.05f, 1f, 180, 170, 150, 0.6f);
        }
        // Banners rippling on poles.
        for (var f = 0; f < 4; f++)
        {
            var px = Width * (0.12f + f * 0.25f);
            var baseY = h + minSide * 0.02f;
            var topY = baseY - minSide * 0.32f;
            FillCapsule(px, baseY, px, topY, minSide * 0.006f, 70, 50, 34, 0.95f);
            var (r, g, b) = f % 2 == 0 ? ((byte)214, (byte)96, (byte)30) : ((byte)200, (byte)40, (byte)50);
            for (var s = 0; s < 10; s++)
            {
                var k = s / 9f;
                var wave = MathF.Sin((float)t * 4f + k * 5f + f) * minSide * 0.012f * k;
                FillCapsule(px + k * minSide * 0.12f, topY + minSide * 0.02f + wave, px + k * minSide * 0.12f, topY + minSide * 0.07f + wave, minSide * 0.008f, r, g, b, 0.9f);
            }
        }
        // Dust haze and embers.
        FillGradientRect(0, h - minSide * 0.2f, Width, h + minSide * 0.1f, (150, 110, 70), (180, 130, 80), 0.16f);
        DrawParticles(t, upward: true, 255, 150, 60, 255, 200, 120, minSide * 0.009f);
    }

    private void DrawArchive(double t)
    {
        var h = HorizonY;
        var minSide = MathF.Min(Width, Height);
        var topY = Height > Width ? Height * 0.17f : Height * 0.15f;
        FillGradientRect(0, topY, Width, h, (64, 44, 30), (40, 28, 20), 0.6f);
        FillGradientRect(0, h, Width, Height, (96, 66, 42), (44, 30, 20), 0.85f);
        // Bookshelves on both sides with coloured spines.
        (byte, byte, byte)[] spines = [(150, 40, 40), (40, 80, 140), (60, 120, 70), (180, 140, 60), (110, 60, 120), (170, 90, 40)];
        foreach (var side in new[] { 0, 1 })
        {
            var x0 = side == 0 ? 0f : Width * 0.74f;
            var x1 = side == 0 ? Width * 0.26f : Width;
            FillRect(x0, topY, x1, h + minSide * 0.06f, 70, 46, 28, 0.95f);
            for (var shelf = 0; shelf < 5; shelf++)
            {
                var sy = topY + (h - topY) * (shelf + 1) / 5.2f;
                FillRect(x0, sy, x1, sy + minSide * 0.012f, 110, 74, 44, 0.97f);
                var x = x0 + minSide * 0.01f;
                var n = 0;
                while (x < x1 - minSide * 0.02f)
                {
                    var w = minSide * (0.012f + 0.006f * ((n * 7) % 3));
                    var bh = (h - topY) / 5.2f * (0.7f + 0.2f * ((n * 5) % 3) / 2f);
                    var c = spines[(n + shelf * 2) % spines.Length];
                    FillRect(x, sy - bh, x + w, sy, c.Item1, c.Item2, c.Item3, 0.95f);
                    x += w + 1;
                    n++;
                }
            }
        }
        // Warm lamp and floating dust.
        var lx = Width * 0.5f;
        var ly = topY + minSide * 0.08f;
        DrawAdditiveDisc(lx, ly, minSide * 0.36f, 255, 196, 120, 0.22f);
        FillEllipse(lx, ly, minSide * 0.03f, minSide * 0.02f, 230, 190, 110, 0.95f);
        DrawDriftingDust(t, 255, 220, 170);
    }

    private void DrawCitySkyline(double t)
    {
        var h = HorizonY;
        var minSide = MathF.Min(Width, Height);
        var x = 0f;
        var n = 0;
        while (x < Width)
        {
            var w = minSide * (0.06f + 0.04f * ((n * 7) % 4) / 3f);
            var bh = minSide * (0.12f + 0.22f * ((n * 13) % 5) / 4f);
            FillRect(x, h - bh, x + w, h, 22, 26, 44, 0.95f);
            for (var wy = h - bh + minSide * 0.015f; wy < h - minSide * 0.01f; wy += minSide * 0.022f)
            {
                for (var wx = x + minSide * 0.01f; wx < x + w - minSide * 0.01f; wx += minSide * 0.018f)
                {
                    var on = ((int)(wx * 13 + wy * 7 + n) % 5) != 0 && MathF.Sin((float)t * 0.3f + wx + wy) > -0.7f;
                    if (on) FillRect(wx, wy, wx + minSide * 0.008f, wy + minSide * 0.01f, 255, 214, 140, 0.7f);
                }
            }
            x += w + minSide * 0.006f;
            n++;
        }
        FillGradientRect(0, h, Width, Height, (30, 30, 50), (10, 10, 20), 0.8f);
    }

    private void DrawTempleSanctum(double t)
    {
        var h = HorizonY;
        var minSide = MathF.Min(Width, Height);
        // Stone floor and two brass deepa-stambha lamp pillars flanking the stage.
        FillGradientRect(0, h, Width, Height, (120, 84, 56), (52, 34, 24), 0.6f);
        foreach (var fx in new[] { 0.09f, 0.91f })
        {
            var x = Width * fx;
            var top = h - minSide * 0.3f;
            FillCapsule(x, h + minSide * 0.06f, x, top, minSide * 0.014f, 196, 146, 60, 0.97f);
            for (var tier = 0; tier < 4; tier++)
            {
                var y = top + tier * minSide * 0.08f;
                var w = minSide * (0.03f + tier * 0.012f);
                FillCapsule(x - w, y, x + w, y, minSide * 0.007f, 214, 168, 70, 0.97f);
                for (var f = -1; f <= 1; f += 2)
                {
                    var flick = 0.8f + 0.2f * MathF.Sin((float)t * 9f + tier * 2 + f);
                    DrawAdditiveDisc(x + f * w, y - minSide * 0.012f, minSide * 0.02f * flick, 255, 190, 80, 0.6f);
                }
            }
        }
    }

    private void DrawCosmosNebula(double t)
    {
        var minSide = MathF.Min(Width, Height);
        DrawAdditiveDisc(Width * 0.25f, Height * 0.3f, minSide * 0.45f, 120, 60, 200, 0.12f);
        DrawAdditiveDisc(Width * 0.78f, Height * 0.42f, minSide * 0.4f, 40, 120, 220, 0.12f);
        var px = Width * 0.8f;
        var py = Height * 0.27f;
        FillEllipse(px, py, minSide * 0.05f, minSide * 0.05f, 200, 140, 90, 0.95f);
        FillEllipse(px - minSide * 0.015f, py - minSide * 0.015f, minSide * 0.03f, minSide * 0.03f, 236, 186, 130, 0.6f);
        DrawGlowLine(px - minSide * 0.09f, py + minSide * 0.02f, px + minSide * 0.09f, py - minSide * 0.02f, 1.6f, 230, 210, 170, 0.6f);
        DrawNightSky(t);
    }

    private void DrawChaiStall(double t)
    {
        var h = HorizonY;
        var minSide = MathF.Min(Width, Height);

        // Warm evening street floor and roadside tea-stall timber counter
        FillGradientRect(0, h, Width, Height, (72, 46, 36), (26, 16, 14), 0.78f);
        var roofY = h - minSide * 0.42f;
        var stallL = Width * 0.10f;
        var stallR = Width * 0.90f;

        // Striped orange & cream canvas canopy
        const int stripes = 10;
        var sw = (stallR - stallL) / stripes;
        for (var i = 0; i < stripes; i++)
        {
            var isAccent = (i & 1) == 0;
            FillRect(stallL + i * sw, roofY, stallL + (i + 1) * sw, roofY + minSide * 0.065f,
                isAccent ? (byte)228 : (byte)245,
                isAccent ? (byte)98 : (byte)228,
                isAccent ? (byte)32 : (byte)192, 0.92f);
        }

        // Bamboo support posts & lower tea counter plank
        FillCapsule(stallL + minSide * 0.02f, roofY + minSide * 0.06f, stallL + minSide * 0.02f, h + minSide * 0.04f,
            minSide * 0.012f, 142, 92, 54, 0.95f);
        FillCapsule(stallR - minSide * 0.02f, roofY + minSide * 0.06f, stallR - minSide * 0.02f, h + minSide * 0.04f,
            minSide * 0.012f, 142, 92, 54, 0.95f);
        FillRect(Width * 0.18f, h - minSide * 0.07f, Width * 0.82f, h, 118, 72, 42, 0.94f);

        // Steaming brass chai kettle + rising steam curls + terracotta kulhads
        var kx = Width * 0.5f;
        var ky = h - minSide * 0.105f;
        FillEllipse(kx, ky, minSide * 0.046f, minSide * 0.036f, 212, 162, 72, 0.96f);
        for (var s = 0; s < 3; s++)
        {
            var lift = (float)((t * 0.7 + s * 0.33) % 1.0);
            var sx = kx + MathF.Sin((float)t * 3f + s * 2f) * minSide * 0.018f;
            var sy = ky - minSide * (0.045f + lift * 0.11f);
            DrawAdditiveDisc(sx, sy, minSide * (0.016f + lift * 0.018f), 255, 244, 224, (1f - lift) * 0.45f);
        }
        foreach (var cxCup in new[] { kx - minSide * 0.09f, kx + minSide * 0.09f })
        {
            FillEllipse(cxCup, h - minSide * 0.088f, minSide * 0.022f, minSide * 0.026f, 186, 98, 62, 0.95f);
        }

        // Warm string bulbs hanging under canopy
        for (var b = 0; b < 7; b++)
        {
            var bx = stallL + (stallR - stallL) * ((b + 0.5f) / 7f);
            var by = roofY + minSide * 0.08f + MathF.Sin(b * 0.9f) * minSide * 0.01f;
            var glow = 0.75f + 0.25f * MathF.Sin((float)t * 4.5f + b);
            DrawAdditiveDisc(bx, by, minSide * 0.028f * glow, 255, 212, 110, 0.65f);
            FillEllipse(bx, by, minSide * 0.008f, minSide * 0.010f, 255, 245, 200, 0.96f);
        }
    }

    private void DrawComedyStage(double t)
    {
        var h = HorizonY;
        var minSide = MathF.Min(Width, Height);

        // Polished wood stage floor & velvet side theater drapes
        FillGradientRect(0, h, Width, Height, (108, 58, 34), (44, 22, 14), 0.85f);
        foreach (var dx in new[] { 0f, Width * 0.88f })
        {
            FillRect(dx, 0, dx + Width * 0.12f, h, 128, 22, 38, 0.92f);
            FillRect(dx + Width * 0.04f, 0, dx + Width * 0.07f, h, 168, 36, 54, 0.55f);
        }

        // Center chrome stand-up mic Stand + warm footlight bulbs along stage edge
        var mx = Width * 0.5f;
        FillCapsule(mx, h + minSide * 0.02f, mx, h - minSide * 0.24f, minSide * 0.006f, 195, 205, 218, 0.95f);
        FillEllipse(mx, h - minSide * 0.255f, minSide * 0.016f, minSide * 0.022f, 225, 232, 240, 0.98f);
        for (var f = 1; f <= 5; f++)
        {
            var fx = Width * (f / 6f);
            var pulse = 0.75f + 0.25f * MathF.Sin((float)t * 5f + f * 1.1f);
            DrawAdditiveDisc(fx, h + minSide * 0.02f, minSide * 0.032f * pulse, 255, 208, 92, 0.52f);
        }
    }

    // ------------------------------------------------------------------ final grade

    /// <summary>One pass over the stage: time-of-day colour grade, lens vignette, cut dip and light film grain.</summary>
    private void ApplyCinematicGrade(SceneMoment scene, double t)
    {
        var (gr, gg, gb) = scene.TimeOfDay switch
        {
            SceneTimeOfDay.Dawn => (1.06f, 0.98f, 0.90f),
            SceneTimeOfDay.Sunset => (1.10f, 0.92f, 0.86f),
            SceneTimeOfDay.Night => (0.72f, 0.80f, 1.02f),
            SceneTimeOfDay.Day => (1.04f, 1.04f, 1.02f),
            _ => (1f, 1f, 1f)
        };
        var dip = scene.CutDip;
        _grainState = _grainState * 1664525u + 1013904223u;
        var grainSeed = _grainState;

        // Grain is seeded per row, so rows are independent and can be graded in parallel bands.
        ForRowBands(0, Height, (long)Width * Height, (band0, band1) =>
        {
            for (var y = band0; y < band1; y++)
            {
                var vy = _vignetteY[y] * dip;
                var row = y * Width * 4;
                var h = grainSeed ^ (uint)(y * 0x9E3779B1);
                for (var x = 0; x < Width; x++)
                {
                    h ^= h << 13;
                    h ^= h >> 17;
                    h ^= h << 5;
                    var grain = ((h & 0xFF) - 127.5f) * 0.022f;
                    var v = vy * _vignetteX[x];
                    var i = row + x * 4;
                    _frame[i] = ClampByte(_frame[i] * gr * v + grain);
                    _frame[i + 1] = ClampByte(_frame[i + 1] * gg * v + grain);
                    _frame[i + 2] = ClampByte(_frame[i + 2] * gb * v + grain);
                }
            }
        });
    }
}
