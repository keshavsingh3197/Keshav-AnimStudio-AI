using System.Runtime.CompilerServices;
using AnimStudio.Application.Rendering;

namespace AnimStudio.Infrastructure.Rendering;

/// <summary>
/// Pure managed C# 2D/3D procedural RGBA frame synthesizer. Renders anti-aliased 3D projected
/// geometry, atmospheric multi-stop gradients, light shafts, parallax landscapes, and additive
/// particle fields into a pre-allocated RGBA buffer in milliseconds per frame with zero GPU or
/// native graphics dependencies.
/// </summary>
public sealed class ProceduralSceneRasterizer
{
    public int Width { get; }
    public int Height { get; }
    public ProceduralSceneTheme Theme { get; }

    private readonly byte[] _frame;
    private readonly Particle[] _particles;
    private readonly (double Azimuth, double Elevation, double Speed)[] _rays;

    private readonly record struct Particle(float BaseX, float BaseY, float BaseZ, float Speed, float Size, float Phase, byte AccentKind);
    private readonly record struct Vec3(float X, float Y, float Z);
    private readonly record struct ScreenPt(float X, float Y, float Z, bool Visible);

    public ProceduralSceneRasterizer(int width, int height, ProceduralSceneTheme theme, int seed = 108)
    {
        Width = Math.Clamp(width, 160, 2160);
        Height = Math.Clamp(height, 160, 2160);
        Theme = theme == ProceduralSceneTheme.Auto ? ProceduralSceneTheme.VedicTempleSunrise3D : theme;
        _frame = new byte[Width * Height * 4];

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
    }

    public byte[] Buffer => _frame;

    public ReadOnlySpan<byte> RenderFrame(double timeSeconds, double durationSeconds)
    {
        var dur = Math.Max(1.0, durationSeconds);
        var u = Math.Clamp(timeSeconds / dur, 0.0, 1.0);
        var pulse = (float)(0.5 + 0.5 * Math.Sin(timeSeconds * 1.8));

        PaintBackdrop(timeSeconds, u, pulse);

        switch (Theme)
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
            default:
                RenderVedicSunrise3D(timeSeconds, u, pulse);
                break;
        }

        ApplyBottomCaptionScrim();
        DrawProgressBar(u);
        return _frame;
    }

    private void PaintBackdrop(double t, double u, float pulse)
    {
        var (topR, topG, topB, midR, midG, midB, botR, botG, botB) = Theme switch
        {
            ProceduralSceneTheme.VedicTempleSunrise3D => (22f, 11f, 36f, 148f, 48f, 22f, 22f, 10f, 12f),
            ProceduralSceneTheme.CosmosSacred3D => (8f, 10f, 34f, 34f, 20f, 82f, 10f, 14f, 38f),
            ProceduralSceneTheme.HistoryChronicle3D => (14f, 20f, 38f, 52f, 44f, 68f, 20f, 14f, 12f),
            ProceduralSceneTheme.NeonCyberGrid3D => (9f, 9f, 26f, 32f, 12f, 64f, 6f, 20f, 34f),
            ProceduralSceneTheme.SereneNatureGlow => (9f, 24f, 38f, 22f, 76f, 84f, 8f, 22f, 24f),
            _ => (22f, 11f, 36f, 148f, 48f, 22f, 22f, 10f, 12f)
        };

        var shimmer = 0.92f + 0.08f * pulse;
        var shift = (float)Math.Sin(t * 0.45) * 0.06f;

        for (var y = 0; y < Height; y++)
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

            // Pack RGBA tuple per row into Span<uint> -> super fast row fill
            var rowStart = y * Width * 4;
            for (var x = 0; x < Width; x++)
            {
                var idx = rowStart + x * 4;
                _frame[idx] = r;
                _frame[idx + 1] = g;
                _frame[idx + 2] = b;
                _frame[idx + 3] = 255;
            }
        }
    }

    private void RenderVedicSunrise3D(double t, double u, float pulse)
    {
        var cx = Width * 0.5f;
        var horizonY = Height * 0.62f;
        var sunY = Height * (0.43f - (float)u * 0.08f);
        var minSide = MathF.Min(Width, Height);

        // Warm rising solar glow & rotating god-rays
        DrawAdditiveDisc(cx, sunY, minSide * 0.44f, 255, 165, 45, 0.34f);
        DrawAdditiveDisc(cx, sunY, minSide * 0.16f, 255, 232, 160, 0.85f);

        for (var i = 0; i < _rays.Length; i++)
        {
            var angle = (float)(_rays[i].Azimuth + t * 0.08 * (i % 2 == 0 ? 1 : -1));
            var rx = cx + MathF.Sin(angle) * minSide * 0.95f;
            var ry = sunY - MathF.Cos(angle) * minSide * 0.95f;
            DrawGlowLine(cx, sunY, rx, ry, minSide * 0.025f, 255, 196, 85, 0.12f);
        }

        // 3D perspective golden mandala / Sri Yantra geometry rotating smoothly in space
        var yaw = (float)(t * 0.32);
        var pitch = 0.38f + 0.18f * MathF.Sin((float)t * 0.4f);
        var focal = minSide * 0.92f;
        var camDist = 3.25f - (float)(u * 0.35);

        DrawProjectedRing3D(cx, sunY, focal, camDist, 1.05f, 0f, yaw, pitch, 36, 255, 214, 110, 0.72f, 2.2f);
        DrawProjectedRing3D(cx, sunY, focal, camDist, 0.78f, 0.08f, -yaw * 1.4f, pitch + 0.25f, 24, 255, 145, 50, 0.80f, 2.0f);

        // Nested 3D rotating interlocking sacred triangles (upward Shiva + downward Shakti)
        DrawPolygon3D(cx, sunY, focal, camDist, 0.92f, 0.02f, yaw, pitch, 3, 0f, 255, 228, 140, 0.92f, 2.5f);
        DrawPolygon3D(cx, sunY, focal, camDist, 0.92f, -0.02f, yaw, pitch, 3, MathF.PI, 255, 175, 80, 0.88f, 2.5f);
        DrawPolygon3D(cx, sunY, focal, camDist, 0.56f, 0.06f, -yaw * 0.8f, pitch, 8, (float)t * 0.2f, 255, 245, 200, 0.75f, 1.8f);

        // 3D Sacred Horizon Grid + Temple Silhouette
        DrawPerspectiveGrid(t, horizonY, 210, 120, 42, 0.34f);
        DrawMountainAndTempleSilhouette(horizonY, (float)t);

        // Floating golden diya embers drifting upward
        DrawParticles(t, upward: true, 255, 205, 90, 255, 120, 40, minSide * 0.015f);
    }

    private void RenderCosmosSacred3D(double t, double u, float pulse)
    {
        var cx = Width * 0.5f;
        var cy = Height * 0.44f;
        var minSide = MathF.Min(Width, Height);

        DrawAdditiveDisc(cx, cy, minSide * 0.50f, 92, 62, 220, 0.32f);
        DrawAdditiveDisc(cx, cy, minSide * 0.14f, 210, 232, 255, 0.85f);

        // Warp starfield flying past camera
        DrawStarfieldWarp(t, cx, cy, minSide, 180, 220, 255);

        // 3D Orbital Zodiac & Nakshatra rings
        var yaw = (float)(t * 0.28);
        var focal = minSide * 0.95f;
        var camDist = 3.1f - 0.25f * (float)u;

        DrawProjectedRing3D(cx, cy, focal, camDist, 1.15f, 0f, yaw, 0.55f, 48, 125, 211, 252, 0.78f, 2.2f);
        DrawProjectedRing3D(cx, cy, focal, camDist, 0.88f, 0f, -yaw * 1.2f, 1.05f, 40, 245, 198, 96, 0.84f, 2.4f);
        DrawProjectedRing3D(cx, cy, focal, camDist, 0.62f, 0f, yaw * 1.6f, 0.22f, 32, 192, 132, 252, 0.75f, 2.0f);

        // Orbiting glowing planets on the primary ring
        for (var p = 0; p < 5; p++)
        {
            var a = (float)(t * (0.45 + p * 0.17) + p * 1.25);
            var r = 0.62f + (p % 3) * 0.26f;
            var world = Rotate3D(new Vec3(MathF.Cos(a) * r, 0f, MathF.Sin(a) * r), yaw, 0.65f + (p % 2) * 0.3f, 0f);
            var pt = Project(world, cx, cy, focal, camDist);
            if (pt.Visible)
                DrawAdditiveDisc(pt.X, pt.Y, minSide * (0.018f + (p % 2) * 0.008f), 255, 220, 130, 0.95f);
        }

        DrawPerspectiveGrid(t * 0.6, Height * 0.72f, 99, 102, 241, 0.28f);
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

    private void ApplyBottomCaptionScrim()
    {
        var scrimTop = (int)(Height * 0.74f);
        var span = Math.Max(1, Height - scrimTop);
        for (var y = scrimTop; y < Height; y++)
        {
            var k = (float)(y - scrimTop) / span;
            var darken = 1f - k * 0.52f;
            var rowStart = y * Width * 4;
            for (var x = 0; x < Width; x++)
            {
                var idx = rowStart + x * 4;
                _frame[idx] = (byte)(_frame[idx] * darken);
                _frame[idx + 1] = (byte)(_frame[idx + 1] * darken);
                _frame[idx + 2] = (byte)(_frame[idx + 2] * darken);
            }
        }
    }

    private void DrawProgressBar(double progress)
    {
        var barH = Math.Max(3, Height / 180);
        var endX = Math.Clamp((int)(Width * progress), 1, Width);
        var y0 = Height - barH;
        for (var y = y0; y < Height; y++)
        {
            var rowStart = y * Width * 4;
            for (var x = 0; x < endX; x++)
            {
                var idx = rowStart + x * 4;
                _frame[idx] = 250;
                _frame[idx + 1] = 204;
                _frame[idx + 2] = 21;
            }
        }
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

    private void DrawGlowLine(float x0, float y0, float x1, float y1, float radius, byte r, byte g, byte b, float alpha)
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

        for (var s = 0; s <= steps; s++)
        {
            var px = (int)(x0 + stepX * s);
            var py = (int)(y0 + stepY * s);
            if (px + radInt < 0 || px - radInt >= Width || py + radInt < 0 || py - radInt >= Height) continue;

            for (var oy = -radInt; oy <= radInt; oy++)
            {
                var yy = py + oy;
                if ((uint)yy >= (uint)Height) continue;
                var rowStart = yy * Width * 4;
                for (var ox = -radInt; ox <= radInt; ox++)
                {
                    var xx = px + ox;
                    if ((uint)xx >= (uint)Width) continue;
                    var d2 = ox * ox + oy * oy;
                    if (d2 > maxDistSq) continue;
                    var falloff = (1f - MathF.Sqrt(d2) / (radius + 0.5f)) * alpha * 0.35f;
                    var idx = rowStart + xx * 4;
                    _frame[idx] = ClampByte(_frame[idx] + r * falloff);
                    _frame[idx + 1] = ClampByte(_frame[idx + 1] + g * falloff);
                    _frame[idx + 2] = ClampByte(_frame[idx + 2] + b * falloff);
                }
            }
        }
    }

    private void DrawAdditiveDisc(float cx, float cy, float radius, byte r, byte g, byte b, float alpha)
    {
        var rad = (int)MathF.Ceiling(radius);
        if (rad <= 0) return;

        var minY = Math.Max(0, (int)cy - rad);
        var maxY = Math.Min(Height - 1, (int)cy + rad);
        var minX = Math.Max(0, (int)cx - rad);
        var maxX = Math.Min(Width - 1, (int)cx + rad);
        var invRadius = 1f / MathF.Max(1f, radius);

        for (var y = minY; y <= maxY; y++)
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
    }

    private void DrawAdditiveRing(float cx, float cy, float radius, byte r, byte g, byte b, float alpha)
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
