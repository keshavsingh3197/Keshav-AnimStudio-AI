using System.Runtime.CompilerServices;
using AnimStudio.Application.Rendering;

namespace AnimStudio.Infrastructure.Rendering;

/// <summary>
/// Pure managed C# 2D/3D procedural RGBA frame synthesizer. Renders anti-aliased 3D projected
/// geometry, atmospheric multi-stop gradients, light shafts, parallax landscapes, and additive
/// particle fields into a pre-allocated RGBA buffer in milliseconds per frame with zero GPU or
/// native graphics dependencies.
/// </summary>
public sealed partial class ProceduralSceneRasterizer
{
    public int Width { get; }
    public int Height { get; }
    public ProceduralSceneTheme Theme { get; }
    public ProceduralEventPalette Palette { get; }

    private readonly byte[] _frame;
    private readonly Particle[] _particles;
    private readonly (double Azimuth, double Elevation, double Speed)[] _rays;
    private readonly ProceduralDialoguePlan? _dialoguePlan;
    private readonly float[]? _speechEnvelope;
    private readonly double _fps;
    private readonly string _storyHint;
    private readonly IReadOnlyList<byte[]>? _backdropFrames;
    private readonly ProceduralStageLayout? _stageLayout;

    internal float? ActiveSpeechLevel { get; private set; }

    /// <summary>True when a user template picture is the backdrop (shown still, no theme geometry over it).</summary>
    internal bool IsTemplateBackdrop => _backdropFrames is not null && _stageLayout is { TemplateBackdrop: true };

    /// <summary>True when rendering a clean centered rounded-vignette devotional image reel with top spoken captions.</summary>
    internal bool IsDevotionalReel => _stageLayout is { DevotionalReelFrame: true };

    private readonly record struct Particle(float BaseX, float BaseY, float BaseZ, float Speed, float Size, float Phase, byte AccentKind);
    private readonly record struct Vec3(float X, float Y, float Z);
    private readonly record struct ScreenPt(float X, float Y, float Z, bool Visible);

    public ProceduralSceneRasterizer(int width, int height, ProceduralSceneTheme theme, int seed = 108)
        : this(width, height, theme, seed, palette: null, dialoguePlan: null, speechEnvelope: null, fps: 24.0, storyHint: null, backdropFrames: null)
    {
    }

    public ProceduralSceneRasterizer(
        int width,
        int height,
        ProceduralSceneTheme theme,
        int seed,
        ProceduralEventPalette? palette,
        ProceduralDialoguePlan? dialoguePlan,
        float[]? speechEnvelope = null,
        double fps = 24.0,
        string? storyHint = null,
        IReadOnlyList<byte[]>? backdropFrames = null,
        ProceduralStageLayout? stageLayout = null)
    {
        _stageLayout = stageLayout;
        Width = Math.Clamp(width, 160, 2160);
        Height = Math.Clamp(height, 160, 2160);
        Theme = theme == ProceduralSceneTheme.Auto ? ProceduralSceneTheme.VedicTempleSunrise3D : theme;
        Palette = palette ?? ProceduralEventPalette.Resolve(null, Theme);
        _dialoguePlan = dialoguePlan;
        _speechEnvelope = speechEnvelope is { Length: > 0 } ? speechEnvelope : null;
        _fps = fps > 0 ? fps : 24.0;
        _storyHint = (storyHint ?? string.Empty).ToLowerInvariant();
        var expectedBytes = Width * Height * 4;
        _backdropFrames = backdropFrames is { Count: > 0 }
            ? [.. backdropFrames.Where(b => b is not null && b.Length == expectedBytes)]
            : null;
        if (_backdropFrames is { Count: 0 }) _backdropFrames = null;
        _frame = new byte[expectedBytes];

        var rng = new Random(seed ^ ((int)Theme * 7919));
        _particles = new Particle[96];
        for (var i = 0; i < _particles.Length; i++)
        {
            _particles[i] = new Particle(
                (float)(rng.NextDouble() * 2.0 - 1.0),
                (float)(rng.NextDouble() * 2.0 - 1.0),
                (float)(rng.NextDouble() * 2.2 + 0.2),
                (float)(0.22 + rng.NextDouble() * 0.55),
                (float)(1.8 + rng.NextDouble() * 5.2),
                (float)(rng.NextDouble() * Math.PI * 2.0),
                (byte)(i % 3));
        }

        _rays = new (double, double, double)[9];
        for (var i = 0; i < _rays.Length; i++)
        {
            _rays[i] = (-0.85 + i * 0.21, 0.22 + rng.NextDouble() * 0.35, 0.3 + rng.NextDouble() * 0.4);
        }

        InitCinematics(seed);
    }

    public byte[] Buffer => _frame;

    public ReadOnlySpan<byte> RenderFrame(double timeSeconds, double durationSeconds)
    {
        var dur = Math.Max(1.0, durationSeconds);
        var u = Math.Clamp(timeSeconds / dur, 0.0, 1.0);
        var pulse = (float)(0.5 + 0.5 * Math.Sin(timeSeconds * 1.8));
        var scene = ResolveScene(timeSeconds, dur);
        if (IsDevotionalReel)
        {
            PaintDevotionalReelFrame(timeSeconds, dur, u, scene);
            ActiveSpeechLevel = SampleSpeechLevel(timeSeconds);
            return _frame;
        }

        var activeTheme = scene.Setting != SceneSetting.Auto
            ? SceneDirectives.ThemeFor(scene.Setting, Theme)
            : ResolveActTheme(u);

        PaintBackdrop(timeSeconds, u, pulse, activeTheme, scene);

        // A directed scene draws its own environment: the theme's abstract geometry (globe, aurora, grid) only
        // stays for settings that are built from it (temple yantra, cosmos orbits) and never over a real photo.
        // A user template is the whole set: no theme geometry is drawn over it at all.
        var themeGeometry = !IsTemplateBackdrop && scene.Setting switch
        {
            SceneSetting.Auto => true,
            SceneSetting.Temple or SceneSetting.Cosmos => _backdropFrames is null,
            _ => false
        };
        if (themeGeometry)
        switch (activeTheme)
        {
            case ProceduralSceneTheme.VedicTempleSunrise3D:
                RenderVedicSunrise3D(timeSeconds, u, pulse);
                break;
            case ProceduralSceneTheme.CosmosSacred3D:
                RenderCosmosSacred3D(timeSeconds, u, pulse);
                break;
            case ProceduralSceneTheme.HistoryChronicle3D:
                RenderHistoryChronicle3D(timeSeconds, u, pulse);
                break;
            case ProceduralSceneTheme.NeonCyberGrid3D:
                RenderNeonCyberGrid3D(timeSeconds, u, pulse);
                break;
            case ProceduralSceneTheme.SereneNatureGlow:
                RenderSereneNatureGlow(timeSeconds, u, pulse);
                break;
            case ProceduralSceneTheme.ComedyStage3D:
                RenderComedyStage3D(timeSeconds, u, pulse);
                break;
            default:
                RenderVedicSunrise3D(timeSeconds, u, pulse);
                break;
        }

        DrawSettingLayer(scene, timeSeconds);

        ActiveSpeechLevel = SampleSpeechLevel(timeSeconds);
        if (_dialoguePlan is { HasCharacters: true })
        {
            ProceduralCharacterRenderer.RenderDialogueStage(this, timeSeconds, _dialoguePlan, Palette, _stageLayout);
        }
        else if (ActiveSpeechLevel is { } level)
        {
            RenderVoiceWaveIndicator(timeSeconds, level);
        }

        ApplyCinematicGrade(scene, timeSeconds);
        ApplyTopTemplateBand(u);
        ApplyBottomCaptionScrim();
        DrawProgressBar(u);
        return _frame;
    }

    private ProceduralSceneTheme ResolveActTheme(double u)
    {
        if (_dialoguePlan is not { HasCharacters: true } || _dialoguePlan.Turns.Count < 5)
            return Theme;

        // Long or multi-act animated stories evolve across chronological environments instead of staying on 1 backdrop.
        return Theme switch
        {
            ProceduralSceneTheme.VedicTempleSunrise3D => u < 0.34
                ? ProceduralSceneTheme.VedicTempleSunrise3D
                : u < 0.68
                    ? ProceduralSceneTheme.SereneNatureGlow
                    : ProceduralSceneTheme.CosmosSacred3D,
            ProceduralSceneTheme.HistoryChronicle3D => u < 0.50
                ? ProceduralSceneTheme.HistoryChronicle3D
                : ProceduralSceneTheme.VedicTempleSunrise3D,
            _ => Theme
        };
    }

    private void PaintBackdrop(double t, double u, float pulse, ProceduralSceneTheme activeTheme, SceneMoment scene)
    {
        var (topR, topG, topB, midR, midG, midB, botR, botG, botB) = activeTheme switch
        {
            ProceduralSceneTheme.VedicTempleSunrise3D => (22f, 11f, 36f, 148f, 48f, 22f, 22f, 10f, 12f),
            ProceduralSceneTheme.CosmosSacred3D => (8f, 10f, 34f, 34f, 20f, 82f, 10f, 14f, 38f),
            ProceduralSceneTheme.HistoryChronicle3D => (14f, 20f, 38f, 52f, 44f, 68f, 20f, 14f, 12f),
            ProceduralSceneTheme.NeonCyberGrid3D => (9f, 9f, 26f, 32f, 12f, 64f, 6f, 20f, 34f),
            ProceduralSceneTheme.SereneNatureGlow => (9f, 24f, 38f, 22f, 76f, 84f, 8f, 22f, 24f),
            ProceduralSceneTheme.ComedyStage3D => (28f, 12f, 26f, 118f, 44f, 24f, 18f, 10f, 18f),
            _ => (22f, 11f, 36f, 148f, 48f, 22f, 22f, 10f, 12f)
        };

        // Blend theme backdrop smoothly toward fixed event color identity so each event keeps signature hues.
        topR = topR * 0.45f + Palette.TopBackdropRgb.R * 0.55f;
        topG = topG * 0.45f + Palette.TopBackdropRgb.G * 0.55f;
        topB = topB * 0.45f + Palette.TopBackdropRgb.B * 0.55f;
        midR = midR * 0.45f + Palette.MidBackdropRgb.R * 0.55f;
        midG = midG * 0.45f + Palette.MidBackdropRgb.G * 0.55f;
        midB = midB * 0.45f + Palette.MidBackdropRgb.B * 0.55f;
        botR = botR * 0.45f + Palette.BotBackdropRgb.R * 0.55f;
        botG = botG * 0.45f + Palette.BotBackdropRgb.G * 0.55f;
        botB = botB * 0.45f + Palette.BotBackdropRgb.B * 0.55f;

        if (_backdropFrames is { Count: > 0 } photos)
        {
            PaintPhotoBackdropKenBurns(photos, t, u, scene, topR, topG, topB, midR, midG, midB, botR, botG, botB);
            return;
        }

        var shimmer = 0.92f + 0.08f * pulse;
        var shift = (float)Math.Sin(t * 0.45) * 0.06f;

        ForRowBands(0, Height, (long)Width * Height, (band0, band1) =>
        {
            for (var y = band0; y < band1; y++)
            {
                var ny = (float)y / (Height - 1);
                var h = Math.Clamp(ny + shift * (1f - Math.Abs(ny - 0.5f)), 0f, 1f);

                byte r, g, b;
                if (h < 0.52f)
                {
                    var k = h / 0.52f;
                    r = ClampByte((topR + (midR - topR) * k) * shimmer);
                    g = ClampByte((topG + (midG - topG) * k) * shimmer);
                    b = ClampByte((topB + (midB - topB) * k) * shimmer);
                }
                else
                {
                    var k = (h - 0.52f) / 0.48f;
                    r = ClampByte(midR + (botR - midR) * k);
                    g = ClampByte(midG + (botG - midG) * k);
                    b = ClampByte(midB + (botB - midB) * k);
                }

                // One packed RGBA word per pixel: a single vectorised fill per row.
                var rgba = r | (uint)g << 8 | (uint)b << 16 | 0xFF000000u;
                System.Runtime.InteropServices.MemoryMarshal.Cast<byte, uint>(_frame.AsSpan(y * Width * 4, Width * 4)).Fill(rgba);
            }
        });
    }

    private void RenderVedicSunrise3D(double t, double u, float pulse)
    {
        var cx = Width * 0.5f;
        var isPortrait = Height > Width;
        var horizonY = isPortrait ? Height * 0.56f : Height * 0.64f;
        var sunY = isPortrait ? Height * (0.35f - (float)u * 0.06f) : Height * (0.42f - (float)u * 0.07f);
        var minSide = MathF.Min(Width, Height);

        // Act progression: dawn temple -> warm Sri Yantra tapasya energy -> celestial star / darshan blessing
        var darshanBoost = (float)Math.Clamp((u - 0.50) / 0.45, 0.0, 1.0);
        DrawAdditiveDisc(cx, sunY, minSide * (0.42f + 0.14f * darshanBoost), 255, 165, 45, 0.34f + 0.12f * darshanBoost);
        DrawAdditiveDisc(cx, sunY, minSide * 0.15f, 255, 234, 165, 0.85f);

        for (var i = 0; i < _rays.Length; i++)
        {
            var angle = (float)(_rays[i].Azimuth + t * 0.08 * (i % 2 == 0 ? 1 : -1));
            var rx = cx + MathF.Sin(angle) * minSide * 0.92f;
            var ry = sunY - MathF.Cos(angle) * minSide * 0.92f;
            DrawGlowLine(cx, sunY, rx, ry, minSide * 0.024f, 255, 196, 85, 0.13f + 0.08f * darshanBoost);
        }

        // Swinging sacred brass temple bells near upper corners
        DrawTempleBell(Width * 0.11f, Height * (isPortrait ? 0.165f : 0.145f), minSide * 0.09f, (float)Math.Sin(t * 1.45) * 0.16f);
        DrawTempleBell(Width * 0.89f, Height * (isPortrait ? 0.165f : 0.145f), minSide * 0.09f, (float)Math.Sin(t * 1.45 + 0.8) * 0.16f);

        // 3D perspective golden mandala / Sri Yantra geometry rotating smoothly in space
        var yaw = (float)(t * 0.32);
        var pitch = 0.38f + 0.18f * MathF.Sin((float)t * 0.4f);
        var focal = minSide * 0.90f;
        var camDist = 3.30f - (float)(u * 0.32);

        DrawProjectedRing3D(cx, sunY, focal, camDist, 1.02f, 0f, yaw, pitch, 36, 255, 214, 110, 0.72f, 2.2f);
        DrawProjectedRing3D(cx, sunY, focal, camDist, 0.76f, 0.08f, -yaw * 1.4f, pitch + 0.25f, 24, 255, 145, 50, 0.80f, 2.0f);
        DrawPolygon3D(cx, sunY, focal, camDist, 0.90f, 0.02f, yaw, pitch, 3, 0f, 255, 228, 140, 0.92f, 2.5f);
        DrawPolygon3D(cx, sunY, focal, camDist, 0.90f, -0.02f, yaw, pitch, 3, MathF.PI, 255, 175, 80, 0.88f, 2.5f);
        DrawPolygon3D(cx, sunY, focal, camDist, 0.54f, 0.06f, -yaw * 0.8f, pitch, 8, (float)t * 0.2f, 255, 245, 200, 0.75f, 1.8f);

        // Eternal Pole Star (Dhruva Tara) & Polar Constellation emerging during Tapasya / Darshan climax
        if (darshanBoost > 0.02f)
        {
            var starX = cx;
            var starY = isPortrait ? Height * 0.24f : Height * 0.22f;
            DrawPolarStarAndConstellation(starX, starY, minSide, t, darshanBoost);
        }

        // Temple sanctuary + sacred reflecting pond shimmer below horizon
        DrawPerspectiveGrid(t * 0.45, horizonY, 210, 128, 48, 0.28f);
        DrawMountainAndTempleSilhouette(horizonY, (float)t);
        DrawFloatingDiyas(horizonY, minSide, (float)t);

        // Floating golden diya embers / celestial flower petals (Act 3) drifting peacefully
        DrawParticles(t, upward: u < 0.72, 255, 205, 90, 255, (byte)(u >= 0.72 ? 150 : 120), (byte)(u >= 0.72 ? 175 : 40), minSide * 0.015f);
    }

    private void RenderCosmosSacred3D(double t, double u, float pulse)
    {
        var cx = Width * 0.5f;
        var isPortrait = Height > Width;
        var cy = isPortrait ? Height * 0.36f : Height * 0.43f;
        var horizonY = isPortrait ? Height * 0.57f : Height * 0.69f;
        var minSide = MathF.Min(Width, Height);

        DrawAdditiveDisc(cx, cy, minSide * 0.48f, 120, 82, 232, 0.30f);
        DrawAdditiveDisc(cx, cy, minSide * 0.14f, 255, 224, 150, 0.82f);

        // Warp starfield flying gently in deep space
        DrawStarfieldWarp(t, cx, cy, minSide, 190, 224, 255);

        // Radiant eastern Surya sunrise glow + upper-right waxing Chandra crescent
        DrawAdditiveDisc(Width * 0.18f, horizonY - minSide * 0.04f, minSide * 0.18f, 255, 165, 62, 0.42f);
        var moonX = Width * 0.82f;
        var moonY = isPortrait ? Height * 0.23f : Height * 0.22f;
        DrawAdditiveDisc(moonX, moonY, minSide * 0.07f, 210, 230, 255, 0.58f);
        FillEllipse(moonX, moonY, minSide * 0.036f, minSide * 0.036f, 236, 244, 255, 0.92f);
        FillEllipse(moonX + minSide * 0.014f, moonY - minSide * 0.008f, minSide * 0.030f, minSide * 0.032f, 20, 14, 48, 0.90f);

        // 3D Orbital Nakshatra & Kalachakra rings
        var yaw = (float)(t * 0.28);
        var focal = minSide * 0.94f;
        var camDist = 3.15f - 0.22f * (float)u;

        DrawProjectedRing3D(cx, cy, focal, camDist, 1.12f, 0f, yaw, 0.55f, 48, 125, 211, 252, 0.78f, 2.2f);
        DrawProjectedRing3D(cx, cy, focal, camDist, 0.86f, 0f, -yaw * 1.2f, 1.05f, 40, 245, 198, 96, 0.86f, 2.4f);
        DrawProjectedRing3D(cx, cy, focal, camDist, 0.60f, 0f, yaw * 1.6f, 0.22f, 32, 245, 158, 11, 0.76f, 2.0f);

        // 12 zodiac spoke rays from center Kalachakra hub
        for (var s = 0; s < 12; s++)
        {
            var a = (float)(t * 0.18 + s * (Math.PI * 2.0 / 12.0));
            DrawGlowLine(cx, cy, cx + MathF.Cos(a) * minSide * 0.28f, cy + MathF.Sin(a) * minSide * 0.28f,
                1.4f, 253, 224, 71, 0.28f);
        }

        // Orbiting glowing grahas on rings
        for (var p = 0; p < 5; p++)
        {
            var a = (float)(t * (0.45 + p * 0.17) + p * 1.25);
            var r = 0.60f + (p % 3) * 0.26f;
            var world = Rotate3D(new Vec3(MathF.Cos(a) * r, 0f, MathF.Sin(a) * r), yaw, 0.65f + (p % 2) * 0.3f, 0f);
            var pt = Project(world, cx, cy, focal, camDist);
            if (pt.Visible)
                DrawAdditiveDisc(pt.X, pt.Y, minSide * (0.018f + (p % 2) * 0.008f), 255, 220, 130, 0.95f);
        }

        DrawPerspectiveGrid(t * 0.55, horizonY, 245, 158, 11, 0.24f);
        DrawMountainAndTempleSilhouette(horizonY, (float)t, includeTempleSpire: true);
        DrawParticles(t, upward: false, 165, 180, 255, 252, 211, 102, minSide * 0.013f);
    }

    private void RenderHistoryChronicle3D(double t, double u, float pulse)
    {
        var cx = Width * 0.5f;
        var cy = Height * 0.44f;
        var minSide = MathF.Min(Width, Height);
        var focal = minSide * 0.92f;
        var camDist = 3.05f - 0.22f * (float)u;
        var yaw = (float)(t * 0.35);
        var pitch = 0.28f + 0.08f * MathF.Sin((float)t * 0.5f);

        DrawAdditiveDisc(cx, cy, minSide * 0.45f, 180, 122, 42, 0.28f);

        // Rotating 3D wireframe globe (latitudes + longitudes)
        const float globeRadius = 0.88f;
        for (var lat = -2; lat <= 2; lat++)
        {
            var phi = lat * 0.42f;
            var ringR = globeRadius * MathF.Cos(phi);
            var ringY = globeRadius * MathF.Sin(phi);
            DrawProjectedRing3D(cx, cy, focal, camDist, ringR, ringY, yaw, pitch, 32, 245, 198, 92, 0.62f, 1.8f);
        }

        for (var lon = 0; lon < 6; lon++)
        {
            var lonAngle = lon * MathF.PI / 6f + yaw;
            DrawVerticalMeridian3D(cx, cy, focal, camDist, globeRadius, lonAngle, pitch, 28, 148, 197, 253, 0.52f, 1.5f);
        }

        // Documentary radar sweep ring around equator
        var ripple = (float)((t * 0.45) % 1.0);
        DrawAdditiveRing(cx, cy, minSide * (0.18f + ripple * 0.34f), 255, 215, 120, (1f - ripple) * 0.55f);
        DrawPerspectiveGrid(t * 0.45, Height * 0.70f, 217, 159, 64, 0.30f);
        DrawParticles(t, upward: true, 255, 214, 130, 160, 210, 255, minSide * 0.012f);
    }

    private void RenderNeonCyberGrid3D(double t, double u, float pulse)
    {
        var cx = Width * 0.5f;
        var horizonY = Height * 0.52f;
        var minSide = MathF.Min(Width, Height);
        var focal = minSide * 0.90f;
        var camDist = 3.15f;

        // Synthwave glow sun + equalizer halo
        DrawAdditiveDisc(cx, horizonY - minSide * 0.08f, minSide * 0.36f, 236, 72, 153, 0.32f);
        DrawAdditiveDisc(cx, horizonY - minSide * 0.08f, minSide * 0.22f, 6, 182, 212, 0.34f);

        // Endless scrolling 3D perspective floor grid
        DrawPerspectiveGrid(t * 1.45, horizonY, 34, 211, 238, 0.72f);

        // Floating rotating 3D octahedron wireframe center-stage
        var yaw = (float)(t * 0.65);
        var pitch = 0.45f + 0.25f * MathF.Sin((float)t * 0.7f);
        DrawOctahedron3D(cx, Height * 0.39f, focal, camDist, 0.72f, yaw, pitch, 34, 211, 238, 244, 114, 182);

        // Animated audio-reactive horizon waveform bars
        var barCount = 24;
        var barW = Width * 0.72f / barCount;
        var startX = Width * 0.14f;
        for (var i = 0; i < barCount; i++)
        {
            var amp = 0.25f + 0.75f * MathF.Abs(MathF.Sin((float)t * 3.8f + i * 0.55f));
            var bh = minSide * 0.11f * amp;
            var bx = startX + i * barW + barW * 0.5f;
            DrawGlowLine(bx, horizonY, bx, horizonY - bh, MathF.Max(2f, barW * 0.25f), 244, 114, 182, 0.75f);
        }

        DrawStarfieldWarp(t * 0.7, cx, horizonY * 0.72f, minSide, 103, 232, 249);
    }

    private void RenderSereneNatureGlow(double t, double u, float pulse)
    {
        var cx = Width * 0.5f;
        var horizonY = Height * 0.63f;
        var minSide = MathF.Min(Width, Height);

        // Soft aurora sun & sky ribbons
        DrawAdditiveDisc(cx, Height * 0.34f, minSide * 0.42f, 52, 211, 153, 0.28f);
        DrawAdditiveDisc(cx, Height * 0.34f, minSide * 0.16f, 253, 230, 138, 0.55f);

        for (var w = 0; w < 3; w++)
        {
            var prevX = 0f;
            var prevY = Height * (0.22f + w * 0.08f);
            for (var seg = 1; seg <= 20; seg++)
            {
                var x = Width * (seg / 20f);
                var y = Height * (0.22f + w * 0.08f) + MathF.Sin((float)t * 0.9f + seg * 0.45f + w) * Height * 0.045f;
                var r = (byte)(w == 0 ? 52 : w == 1 ? 16 : 245);
                var g = (byte)(w == 0 ? 211 : w == 1 ? 185 : 198);
                var b = (byte)(w == 0 ? 153 : w == 1 ? 215 : 102);
                DrawGlowLine(prevX, prevY, x, y, minSide * 0.022f, r, g, b, 0.35f);
                prevX = x;
                prevY = y;
            }
        }

        DrawMountainAndTempleSilhouette(horizonY, (float)t, includeTempleSpire: false);
        DrawPerspectiveGrid(t * 0.35, horizonY, 52, 211, 153, 0.24f);
        DrawParticles(t, upward: true, 167, 243, 208, 253, 230, 138, minSide * 0.014f);
    }

    private void RenderComedyStage3D(double t, double u, float pulse)
    {
        var cx = Width * 0.5f;
        var horizonY = Height * 0.62f;
        var minSide = MathF.Min(Width, Height);

        // Twin crisscrossing stage spotlight beams + warm center comedic glow
        var swayA = MathF.Sin((float)t * 1.4f) * Width * 0.16f;
        var swayB = MathF.Cos((float)t * 1.2f) * Width * 0.16f;
        DrawAdditiveDisc(cx + swayA, horizonY * 0.68f, minSide * 0.34f, 249, 115, 22, 0.24f);
        DrawAdditiveDisc(cx + swayB, horizonY * 0.68f, minSide * 0.28f, 250, 204, 21, 0.24f);
        DrawGlowLine(Width * 0.18f, Height * 0.06f, cx + swayA, horizonY, minSide * 0.032f, 255, 224, 130, 0.22f);
        DrawGlowLine(Width * 0.82f, Height * 0.06f, cx + swayB, horizonY, minSide * 0.032f, 255, 165, 90, 0.22f);

        // Marquee bokeh rings + upbeat bounce grid + sparkles
        DrawAdditiveRing(cx, Height * 0.42f, minSide * (0.24f + pulse * 0.04f), 250, 204, 21, 0.28f);
        DrawPerspectiveGrid(t * 1.15, horizonY, 249, 115, 22, 0.36f);
        DrawParticles(t, upward: true, 250, 204, 21, 249, 115, 22, minSide * 0.016f);
    }

    private void DrawPerspectiveGrid(double t, float horizonY, byte r, byte g, byte b, float alpha)
    {
        var cx = Width * 0.5f;
        var bottomY = Height * 1.0f;

        // Perspective radiating floor spokes from vanishing point
        for (var i = -7; i <= 7; i++)
        {
            var spreadX = cx + i * (Width * 0.18f);
            DrawGlowLine(cx, horizonY, spreadX, bottomY, 1.2f, r, g, b, alpha * 0.65f);
        }

        // Exponentially spaced moving horizontal grid planes advancing toward camera
        const int planes = 11;
        var travel = (float)(t * 0.55 % 1.0);
        for (var i = 0; i < planes; i++)
        {
            var z = ((i + travel) / planes);
            var depthY = horizonY + (bottomY - horizonY) * (z * z);
            DrawGlowLine(0, depthY, Width - 1, depthY, 1.3f, r, g, b, alpha * Math.Clamp(z + 0.25f, 0f, 1f));
        }
    }

    private void DrawMountainAndTempleSilhouette(float horizonY, float t, bool includeTempleSpire = true)
    {
        var scroll = MathF.Sin(t * 0.12f) * Width * 0.04f;
        var horizonInt = Math.Clamp((int)horizonY, 2, Height - 2);

        for (var x = 0; x < Width; x++)
        {
            var nx = (float)x / Width;
            var ridgeBack = horizonY - Height * (0.07f * MathF.Sin(nx * 6.5f + scroll * 0.004f) + 0.06f * MathF.Sin(nx * 14f) + 0.05f);
            var ridgeFront = horizonY - Height * (0.035f * MathF.Cos(nx * 9f - scroll * 0.006f) + 0.025f);

            // Stylized sacred temple Shikhara silhouette centered on ridge
            if (includeTempleSpire)
            {
                var distFromCenter = MathF.Abs(nx - 0.5f);
                if (distFromCenter < 0.11f)
                {
                    var spireFactor = MathF.Max(0f, 1f - distFromCenter / 0.11f);
                    var spireTop = horizonY - Height * (0.04f + MathF.Pow(spireFactor, 1.65f) * 0.17f);
                    ridgeFront = MathF.Min(ridgeFront, spireTop);
                }
            }

            var yBack = Math.Clamp((int)ridgeBack, 0, horizonInt);
            for (var y = yBack; y < horizonInt; y++)
            {
                BlendPixel(x, y, 24, 14, 28, 0.55f);
            }

            var yFront = Math.Clamp((int)ridgeFront, 0, horizonInt);
            for (var y = yFront; y <= horizonInt; y++)
            {
                BlendPixel(x, y, 10, 6, 14, 0.88f);
            }
        }
    }

    private void DrawOctahedron3D(float cx, float cy, float focal, float camDist, float size, float yaw, float pitch,
        byte r1, byte g1, byte b1, byte r2, byte g2, byte b2)
    {
        Span<Vec3> verts =
        [
            new(0, -size, 0),
            new(size, 0, 0),
            new(0, 0, size),
            new(-size, 0, 0),
            new(0, 0, -size),
            new(0, size, 0)
        ];

        Span<ScreenPt> proj = stackalloc ScreenPt[6];
        for (var i = 0; i < 6; i++)
            proj[i] = Project(Rotate3D(verts[i], yaw, pitch, yaw * 0.4f), cx, cy, focal, camDist);

        ReadOnlySpan<(int A, int B)> edges =
        [
            (0, 1), (0, 2), (0, 3), (0, 4),
            (5, 1), (5, 2), (5, 3), (5, 4),
            (1, 2), (2, 3), (3, 4), (4, 1)
        ];

        for (var i = 0; i < edges.Length; i++)
        {
            var a = proj[edges[i].A];
            var b = proj[edges[i].B];
            if (!a.Visible || !b.Visible) continue;
            var useSecond = i >= 8;
            DrawGlowLine(a.X, a.Y, b.X, b.Y, 2.2f, useSecond ? r2 : r1, useSecond ? g2 : g1, useSecond ? b2 : b1, 0.90f);
        }
    }

    private void DrawPolygon3D(float cx, float cy, float focal, float camDist, float radius, float zOffset,
        float yaw, float pitch, int sides, float twist, byte r, byte g, byte b, float alpha, float thickness)
    {
        Span<ScreenPt> pts = stackalloc ScreenPt[Math.Min(sides, 24)];
        var count = pts.Length;
        for (var i = 0; i < count; i++)
        {
            var angle = twist + i * (MathF.PI * 2f / count);
            var local = new Vec3(MathF.Cos(angle) * radius, MathF.Sin(angle) * radius, zOffset);
            pts[i] = Project(Rotate3D(local, yaw, pitch, 0f), cx, cy, focal, camDist);
        }

        for (var i = 0; i < count; i++)
        {
            var p1 = pts[i];
            var p2 = pts[(i + 1) % count];
            if (p1.Visible && p2.Visible)
                DrawGlowLine(p1.X, p1.Y, p2.X, p2.Y, thickness, r, g, b, alpha);
        }
    }

    private void DrawProjectedRing3D(float cx, float cy, float focal, float camDist, float radius, float yOffset,
        float yaw, float pitch, int segments, byte r, byte g, byte b, float alpha, float thickness)
    {
        var step = MathF.PI * 2f / segments;
        var prev = default(ScreenPt);
        for (var i = 0; i <= segments; i++)
        {
            var a = i * step;
            var local = new Vec3(MathF.Cos(a) * radius, yOffset, MathF.Sin(a) * radius);
            var curr = Project(Rotate3D(local, yaw, pitch, 0f), cx, cy, focal, camDist);
            if (i > 0 && prev.Visible && curr.Visible)
                DrawGlowLine(prev.X, prev.Y, curr.X, curr.Y, thickness, r, g, b, alpha);
            prev = curr;
        }
    }

    private void DrawVerticalMeridian3D(float cx, float cy, float focal, float camDist, float radius,
        float lonAngle, float pitch, int segments, byte r, byte g, byte b, float alpha, float thickness)
    {
        var step = MathF.PI * 2f / segments;
        var prev = default(ScreenPt);
        for (var i = 0; i <= segments; i++)
        {
            var a = i * step;
            var local = new Vec3(
                MathF.Sin(a) * MathF.Cos(lonAngle) * radius,
                MathF.Cos(a) * radius,
                MathF.Sin(a) * MathF.Sin(lonAngle) * radius);
            var curr = Project(Rotate3D(local, 0f, pitch, 0f), cx, cy, focal, camDist);
            if (i > 0 && prev.Visible && curr.Visible)
                DrawGlowLine(prev.X, prev.Y, curr.X, curr.Y, thickness, r, g, b, alpha);
            prev = curr;
        }
    }

    private void DrawStarfieldWarp(double t, float cx, float cy, float minSide, byte r, byte g, byte b)
    {
        for (var i = 0; i < _particles.Length; i++)
        {
            var p = _particles[i];
            var z = ((p.BaseZ - (float)(t * p.Speed * 0.55)) % 2.2f + 2.2f) % 2.2f + 0.15f;
            var scale = 1.2f / z;
            var x = cx + p.BaseX * minSide * 0.45f * scale;
            var y = cy + p.BaseY * minSide * 0.45f * scale;
            var prevScale = 1.2f / (z + 0.14f);
            var px = cx + p.BaseX * minSide * 0.45f * prevScale;
            var py = cy + p.BaseY * minSide * 0.45f * prevScale;

            var bright = Math.Clamp(1.1f - z / 2.3f, 0.1f, 0.9f);
            DrawGlowLine(px, py, x, y, 1.4f, r, g, b, bright);
        }
    }

    private void DrawParticles(double t, bool upward, byte r1, byte g1, byte b1, byte r2, byte g2, byte b2, float maxRadius)
    {
        for (var i = 0; i < _particles.Length; i++)
        {
            var p = _particles[i];
            var phaseY = ((p.BaseY * 0.5f + 0.5f) + (upward ? -1 : 1) * (float)(t * p.Speed * 0.18));
            var normY = phaseY - MathF.Floor(phaseY);
            var normX = 0.5f + p.BaseX * 0.48f + 0.03f * MathF.Sin((float)t * 1.4f + p.Phase);
            var px = normX * Width;
            var py = normY * Height;
            var twinkle = 0.45f + 0.55f * (0.5f + 0.5f * MathF.Sin((float)t * 2.5f + p.Phase));
            var useAccent = p.AccentKind == 0;
            DrawAdditiveDisc(px, py, MathF.Min(maxRadius, p.Size * 1.6f),
                useAccent ? r2 : r1, useAccent ? g2 : g1, useAccent ? b2 : b1, twinkle * 0.72f);
        }
    }

    private void DrawTempleBell(float anchorX, float anchorY, float ropeLen, float swingAngle)
    {
        var sin = MathF.Sin(swingAngle);
        var cos = MathF.Cos(swingAngle);
        var bellX = anchorX + sin * ropeLen;
        var bellY = anchorY + cos * ropeLen;
        var bellScale = ropeLen * 0.34f;

        DrawGlowLine(anchorX, anchorY - 4f, bellX, bellY, 1.5f, 250, 204, 21, 0.85f);
        FillEllipse(bellX, bellY, bellScale, bellScale * 0.85f, 217, 152, 34, 0.95f);
        FillEllipse(bellX, bellY + bellScale * 0.55f, bellScale * 1.28f, bellScale * 0.38f, 250, 204, 21, 0.96f);
        FillEllipse(bellX + sin * bellScale * 0.4f, bellY + bellScale * 0.88f, bellScale * 0.28f, bellScale * 0.28f, 255, 232, 160, 0.95f);
        DrawAdditiveDisc(bellX, bellY + bellScale * 0.4f, bellScale * 2.1f, 255, 198, 80, 0.24f);
    }

    private void DrawPolarStarAndConstellation(float cx, float cy, float minSide, double t, float intensity)
    {
        var sparkle = 0.85f + 0.15f * MathF.Sin((float)t * 4.2f);
        DrawAdditiveDisc(cx, cy, minSide * 0.16f, 180, 224, 255, 0.36f * intensity * sparkle);
        DrawAdditiveDisc(cx, cy, minSide * 0.055f, 255, 250, 220, 0.85f * intensity);

        // 8-point radiant Dhruva Tara star spikes
        for (var i = 0; i < 8; i++)
        {
            var a = i * (MathF.PI / 4f) + (float)t * 0.08f;
            var len = minSide * (i % 2 == 0 ? 0.11f : 0.065f) * intensity * sparkle;
            DrawGlowLine(cx, cy, cx + MathF.Cos(a) * len, cy + MathF.Sin(a) * len,
                i % 2 == 0 ? 2.2f : 1.5f, 255, 244, 196, 0.86f * intensity);
        }

        // Supporting Saptarishi constellation arc flanking the Pole Star
        Span<(float Dx, float Dy)> starOffsets =
        [
            (-0.26f, 0.06f), (-0.18f, 0.03f), (-0.10f, 0.05f),
            (0.11f, 0.04f), (0.19f, 0.02f), (0.27f, 0.07f)
        ];
        for (var i = 0; i < starOffsets.Length; i++)
        {
            var sx = cx + starOffsets[i].Dx * Width;
            var sy = cy + starOffsets[i].Dy * Height;
            DrawAdditiveDisc(sx, sy, minSide * 0.020f, 224, 242, 254, 0.70f * intensity);
            if (i > 0 && i != 3)
            {
                var px = cx + starOffsets[i - 1].Dx * Width;
                var py = cy + starOffsets[i - 1].Dy * Height;
                DrawGlowLine(px, py, sx, sy, 1.1f, 148, 197, 253, 0.35f * intensity);
            }
        }
    }

    private void DrawFloatingDiyas(float horizonY, float minSide, float t)
    {
        for (var i = 0; i < 5; i++)
        {
            var fx = Width * (0.12f + i * 0.19f) + MathF.Sin(t * 0.7f + i * 1.4f) * Width * 0.015f;
            var fy = horizonY + MathF.Sin(t * 1.3f + i * 0.9f) * 3.5f + (i % 2) * 8f;
            DrawAdditiveDisc(fx, fy - 4f, minSide * 0.045f, 255, 165, 45, 0.42f);
            FillEllipse(fx, fy + 2f, minSide * 0.024f, minSide * 0.009f, 146, 64, 14, 0.92f);
            FillEllipse(fx, fy - 4f, minSide * 0.008f, minSide * 0.014f, 255, 228, 128, 0.96f);
        }
    }

    private void ApplyTopTemplateBand(double progress)
    {
        var bandBottom = Height > Width
            ? Math.Max(68, (int)(Height * 0.165f))
            : Math.Max(48, (int)(Height * 0.145f));
        ForRowBands(0, Math.Min(bandBottom, Height), (long)bandBottom * Width, (band0, band1) =>
        {
            for (var y = band0; y < band1; y++)
            {
                var k = (float)y / bandBottom;
                var darken = 0.40f + k * 0.48f;
                var rowStart = y * Width * 4;
                for (var x = 0; x < Width; x++)
                {
                    var idx = rowStart + x * 4;
                    _frame[idx] = (byte)(_frame[idx] * darken);
                    _frame[idx + 1] = (byte)(_frame[idx + 1] * darken);
                    _frame[idx + 2] = (byte)(_frame[idx + 2] * darken);
                }
            }
        });

        // Fixed event-colored accent divider separating top title header from 3D stage
        var ruleH = Math.Max(2, Height / 260);
        var p1 = Palette.PrimaryRgb;
        var p2 = Palette.SecondaryRgb;
        var sweepX = Width * (float)progress;
        for (var y = bandBottom - ruleH; y < bandBottom; y++)
        {
            if ((uint)y >= (uint)Height) continue;
            var rowStart = y * Width * 4;
            for (var x = 0; x < Width; x++)
            {
                var t = (float)x / Math.Max(1, Width - 1);
                var shimmer = MathF.Abs(x - sweepX) < Width * 0.08f ? 1.28f : 0.88f;
                var idx = rowStart + x * 4;
                _frame[idx] = ClampByte(_frame[idx] * 0.25f + (p1.R + (p2.R - p1.R) * t) * 0.75f * shimmer);
                _frame[idx + 1] = ClampByte(_frame[idx + 1] * 0.25f + (p1.G + (p2.G - p1.G) * t) * 0.75f * shimmer);
                _frame[idx + 2] = ClampByte(_frame[idx + 2] * 0.25f + (p1.B + (p2.B - p1.B) * t) * 0.75f * shimmer);
            }
        }
    }

    private void ApplyBottomCaptionScrim()
    {
        // On portrait Shorts, subtly boost contrast across the safe-zone subtitle window (57%..78%) and calm bottom chrome below 78%.
        var scrimTop = Height > Width ? (int)(Height * 0.57f) : (int)(Height * 0.72f);
        var span = Math.Max(1, Height - scrimTop);
        ForRowBands(scrimTop, Height, (long)span * Width, (band0, band1) =>
        {
            for (var y = band0; y < band1; y++)
            {
                var k = (float)(y - scrimTop) / span;
                var darken = Height > Width
                    ? 0.78f - k * 0.34f
                    : 1f - k * 0.56f;
                var rowStart = y * Width * 4;
                for (var x = 0; x < Width; x++)
                {
                    var idx = rowStart + x * 4;
                    _frame[idx] = (byte)(_frame[idx] * darken);
                    _frame[idx + 1] = (byte)(_frame[idx + 1] * darken);
                    _frame[idx + 2] = (byte)(_frame[idx + 2] * darken);
                }
            }
        });
    }

    private void DrawProgressBar(double progress)
    {
        var barH = Math.Max(4, Height / 160);
        var endX = Math.Clamp((int)(Width * progress), 1, Width);
        var y0 = Height - barH;
        var p1 = Palette.PrimaryRgb;
        var p2 = Palette.SecondaryRgb;
        for (var y = y0; y < Height; y++)
        {
            var rowStart = y * Width * 4;
            for (var x = 0; x < endX; x++)
            {
                var t = (float)x / Math.Max(1, Width - 1);
                var idx = rowStart + x * 4;
                _frame[idx] = ClampByte(p1.R + (p2.R - p1.R) * t);
                _frame[idx + 1] = ClampByte(p1.G + (p2.G - p1.G) * t);
                _frame[idx + 2] = ClampByte(p1.B + (p2.B - p1.B) * t);
            }
        }
        DrawAdditiveDisc(endX, y0, barH * 2.2f, p2.R, p2.G, p2.B, 0.8f);
    }

    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    private static Vec3 Rotate3D(Vec3 v, float yaw, float pitch, float roll)
    {
        // Rotate around Y (yaw)
        var cy = MathF.Cos(yaw);
        var sy = MathF.Sin(yaw);
        var x1 = v.X * cy + v.Z * sy;
        var z1 = -v.X * sy + v.Z * cy;

        // Rotate around X (pitch)
        var cx = MathF.Cos(pitch);
        var sx = MathF.Sin(pitch);
        var y2 = v.Y * cx - z1 * sx;
        var z2 = v.Y * sx + z1 * cx;

        if (roll == 0f) return new Vec3(x1, y2, z2);

        var cz = MathF.Cos(roll);
        var sz = MathF.Sin(roll);
        return new Vec3(x1 * cz - y2 * sz, x1 * sz + y2 * cz, z2);
    }

    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    private ScreenPt Project(Vec3 v, float cx, float cy, float focal, float camDist)
    {
        var depth = v.Z + camDist;
        if (depth <= 0.15f) return new ScreenPt(0, 0, depth, false);
        var scale = focal / depth;
        return new ScreenPt(cx + v.X * scale, cy + v.Y * scale, depth, true);
    }

    internal void DrawGlowLine(float x0, float y0, float x1, float y1, float radius, byte r, byte g, byte b, float alpha)
    {
        var dx = x1 - x0;
        var dy = y1 - y0;
        var dist = MathF.Sqrt(dx * dx + dy * dy);
        if (dist < 0.5f) return;

        var steps = Math.Clamp((int)MathF.Ceiling(dist * 0.9f), 1, 900);
        var stepX = dx / steps;
        var stepY = dy / steps;
        var radInt = Math.Clamp((int)MathF.Ceiling(radius), 1, 14);
        var maxDistSq = radius * radius + 0.5f;
        var diameter = radInt * 2 + 1;

        // The stamp's falloff depends only on (ox, oy), so it is worked out once instead of once per stamp.
        var kernel = System.Buffers.ArrayPool<float>.Shared.Rent(diameter * diameter);
        for (var oy = -radInt; oy <= radInt; oy++)
        for (var ox = -radInt; ox <= radInt; ox++)
        {
            var d2 = ox * ox + oy * oy;
            kernel[(oy + radInt) * diameter + ox + radInt] = d2 > maxDistSq
                ? OutsideStamp
                : (1f - MathF.Sqrt(d2) / (radius + 0.5f)) * alpha * 0.35f;
        }

        var minY = Math.Max(0, (int)MathF.Min(y0, y1) - radInt - 1);
        var maxY = Math.Min(Height, (int)MathF.Max(y0, y1) + radInt + 2);

        // Each band replays every stamp in order but only writes its own rows, so overlapping stamps still add up in
        // exactly the same order as on one thread.
        ForRowBands(minY, maxY, (long)(steps + 1) * diameter * diameter, (band0, band1) =>
        {
            for (var s = 0; s <= steps; s++)
            {
                var px = (int)(x0 + stepX * s);
                var py = (int)(y0 + stepY * s);
                if (px + radInt < 0 || px - radInt >= Width || py + radInt < 0 || py - radInt >= Height) continue;

                var oyFrom = Math.Max(-radInt, Math.Max(0, band0) - py);
                var oyTo = Math.Min(radInt, Math.Min(Height, band1) - 1 - py);
                var oxFrom = Math.Max(-radInt, -px);
                var oxTo = Math.Min(radInt, Width - 1 - px);
                for (var oy = oyFrom; oy <= oyTo; oy++)
                {
                    var rowStart = (py + oy) * Width * 4;
                    var kRow = (oy + radInt) * diameter + radInt;
                    for (var ox = oxFrom; ox <= oxTo; ox++)
                    {
                        var falloff = kernel[kRow + ox];
                        if (falloff == OutsideStamp) continue;
                        var idx = rowStart + (px + ox) * 4;
                        _frame[idx] = ClampByte(_frame[idx] + r * falloff);
                        _frame[idx + 1] = ClampByte(_frame[idx + 1] + g * falloff);
                        _frame[idx + 2] = ClampByte(_frame[idx + 2] + b * falloff);
                    }
                }
            }
        });
        System.Buffers.ArrayPool<float>.Shared.Return(kernel);
    }

    /// <summary>Marks kernel cells outside a glow stamp's circle; no real falloff is ever negative infinity.</summary>
    private const float OutsideStamp = float.NegativeInfinity;

    internal void DrawAdditiveDisc(float cx, float cy, float radius, byte r, byte g, byte b, float alpha)
    {
        var rad = (int)MathF.Ceiling(radius);
        if (rad <= 0) return;

        var minY = Math.Max(0, (int)cy - rad);
        var maxY = Math.Min(Height - 1, (int)cy + rad);
        var minX = Math.Max(0, (int)cx - rad);
        var maxX = Math.Min(Width - 1, (int)cx + rad);
        var invRadius = 1f / MathF.Max(1f, radius);

        ForRowBands(minY, maxY + 1, (long)(maxY - minY + 1) * (maxX - minX + 1), (band0, band1) =>
        {
            for (var y = band0; y < band1; y++)
            {
                var dy = y - cy;
                var dySq = dy * dy;
                var rowStart = y * Width * 4;
                for (var x = minX; x <= maxX; x++)
                {
                    var dx = x - cx;
                    var distSq = dx * dx + dySq;
                    if (distSq >= radius * radius) continue;

                    var k = 1f - MathF.Sqrt(distSq) * invRadius;
                    var a = k * k * alpha;
                    var idx = rowStart + x * 4;
                    _frame[idx] = ClampByte(_frame[idx] + r * a);
                    _frame[idx + 1] = ClampByte(_frame[idx + 1] + g * a);
                    _frame[idx + 2] = ClampByte(_frame[idx + 2] + b * a);
                }
            }
        });
    }

    internal void DrawAdditiveRing(float cx, float cy, float radius, byte r, byte g, byte b, float alpha)
    {
        const int segs = 40;
        var step = MathF.PI * 2f / segs;
        var px = cx + radius;
        var py = cy;
        for (var i = 1; i <= segs; i++)
        {
            var a = i * step;
            var x = cx + MathF.Cos(a) * radius;
            var y = cy + MathF.Sin(a) * radius;
            DrawGlowLine(px, py, x, y, 2.0f, r, g, b, alpha);
            px = x;
            py = y;
        }
    }

    internal void FillEllipse(float cx, float cy, float rx, float ry, byte r, byte g, byte b, float alpha)
    {
        if (rx <= 0.5f || ry <= 0.5f) return;
        var minY = Math.Max(0, (int)MathF.Floor(cy - ry - 1f));
        var maxY = Math.Min(Height - 1, (int)MathF.Ceiling(cy + ry + 1f));
        var minX = Math.Max(0, (int)MathF.Floor(cx - rx - 1f));
        var maxX = Math.Min(Width - 1, (int)MathF.Ceiling(cx + rx + 1f));
        var invRx = 1f / rx;
        var invRy = 1f / ry;

        ForRowBands(minY, maxY + 1, (long)(maxY - minY + 1) * (maxX - minX + 1), (band0, band1) =>
        {
            for (var y = band0; y < band1; y++)
            {
                var ny = (y - cy) * invRy;
                var nySq = ny * ny;
                if (nySq > 1.08f) continue;
                var rowStart = y * Width * 4;
                for (var x = minX; x <= maxX; x++)
                {
                    var nx = (x - cx) * invRx;
                    var d = MathF.Sqrt(nx * nx + nySq);
                    if (d >= 1.04f) continue;
                    var edge = Math.Clamp((1.04f - d) * 14f, 0f, 1f) * alpha;
                    var inv = 1f - edge;
                    var idx = rowStart + x * 4;
                    _frame[idx] = ClampByte(_frame[idx] * inv + r * edge);
                    _frame[idx + 1] = ClampByte(_frame[idx + 1] * inv + g * edge);
                    _frame[idx + 2] = ClampByte(_frame[idx + 2] * inv + b * edge);
                }
            }
        });
    }

    internal void FillCapsule(float x0, float y0, float x1, float y1, float radius, byte r, byte g, byte b, float alpha)
    {
        if (radius <= 0.5f) return;
        var pad = radius + 2f;
        var minX = Math.Max(0, (int)MathF.Floor(MathF.Min(x0, x1) - pad));
        var maxX = Math.Min(Width - 1, (int)MathF.Ceiling(MathF.Max(x0, x1) + pad));
        var minY = Math.Max(0, (int)MathF.Floor(MathF.Min(y0, y1) - pad));
        var maxY = Math.Min(Height - 1, (int)MathF.Ceiling(MathF.Max(y0, y1) + pad));

        var abX = x1 - x0;
        var abY = y1 - y0;
        var abLenSq = MathF.Max(0.0001f, abX * abX + abY * abY);

        ForRowBands(minY, maxY + 1, (long)(maxY - minY + 1) * (maxX - minX + 1), (band0, band1) =>
        {
            for (var y = band0; y < band1; y++)
            {
                var py = y - y0;
                var rowStart = y * Width * 4;
                for (var x = minX; x <= maxX; x++)
                {
                    var px = x - x0;
                    var h = Math.Clamp((px * abX + py * abY) / abLenSq, 0f, 1f);
                    var dx = px - abX * h;
                    var dy = py - abY * h;
                    var dist = MathF.Sqrt(dx * dx + dy * dy);
                    if (dist >= radius + 1.2f) continue;
                    var edge = Math.Clamp((radius + 1.2f - dist) * 0.85f, 0f, 1f) * alpha;
                    var inv = 1f - edge;
                    var idx = rowStart + x * 4;
                    _frame[idx] = ClampByte(_frame[idx] * inv + r * edge);
                    _frame[idx + 1] = ClampByte(_frame[idx + 1] * inv + g * edge);
                    _frame[idx + 2] = ClampByte(_frame[idx + 2] * inv + b * edge);
                }
            }
        });
    }

    private float? SampleSpeechLevel(double timeSeconds)
    {
        if (_speechEnvelope is null) return null;
        var idx = Math.Clamp((int)Math.Floor(timeSeconds * _fps), 0, _speechEnvelope.Length - 1);
        return _speechEnvelope[idx];
    }

    private void RenderVoiceWaveIndicator(double t, float speechLevel)
    {
        var centerX = Width * 0.5f;
        var baseY = Height > Width ? Height * 0.56f : Height * 0.72f;
        var unit = MathF.Min(Width, Height) * 0.008f;
        const int bars = 9;
        var spacing = unit * 2.4f;
        var accent = Palette.PrimaryRgb;

        for (var i = 0; i < bars; i++)
        {
            var offset = (i - (bars - 1) * 0.5f) * spacing;
            var distFactor = 1.0f - MathF.Abs(i - (bars - 1) * 0.5f) / ((bars - 1) * 0.65f);
            var shimmer = 0.65f + 0.35f * MathF.Sin((float)(t * 14.0 + i * 1.1));
            var barH = MathF.Max(unit * 0.9f, unit * (1.2f + speechLevel * 8.5f * distFactor * shimmer));
            FillCapsule(
                centerX + offset, baseY - barH * 0.5f,
                centerX + offset, baseY + barH * 0.5f,
                unit * 0.68f,
                accent.R, accent.G, accent.B, 0.25f + speechLevel * 0.68f);
        }
    }

    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    private void BlendPixel(int x, int y, byte r, byte g, byte b, float alpha)
    {
        if ((uint)x >= (uint)Width || (uint)y >= (uint)Height) return;
        var idx = (y * Width + x) * 4;
        var inv = 1f - alpha;
        _frame[idx] = ClampByte(_frame[idx] * inv + r * alpha);
        _frame[idx + 1] = ClampByte(_frame[idx + 1] * inv + g * alpha);
        _frame[idx + 2] = ClampByte(_frame[idx + 2] * inv + b * alpha);
    }

    [MethodImpl(MethodImplOptions.AggressiveInlining)]
    private static byte ClampByte(float value)
    {
        if (value <= 0f) return 0;
        if (value >= 255f) return 255;
        return (byte)value;
    }
}
