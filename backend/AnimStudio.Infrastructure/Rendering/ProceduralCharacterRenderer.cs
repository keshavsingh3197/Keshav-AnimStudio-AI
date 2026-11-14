using AnimStudio.Application.Rendering;

namespace AnimStudio.Infrastructure.Rendering;

/// <summary>
/// Renders stylized, expressive 2-character animated dialogue figures directly into
/// <see cref="ProceduralSceneRasterizer"/>'s RGBA buffer with lip-sync cadence, breathing,
/// blinking, gesture arm motion, role headgear (Mukut Crown, Rishi Topknot, Divine Halo,
/// Scholar Scroll), and speaker-highlighted conversation energy waves.
/// </summary>
internal static class ProceduralCharacterRenderer
{
    public static void RenderDialogueStage(
        ProceduralSceneRasterizer canvas,
        double timeSeconds,
        ProceduralDialoguePlan plan,
        ProceduralEventPalette palette)
    {
        if (!plan.HasCharacters || plan.LeftCharacter is null || plan.RightCharacter is null)
            return;

        var w = canvas.Width;
        var h = canvas.Height;
        var minSide = MathF.Min(w, h);
        var isLandscape = w > h;

        var activeTurn = plan.Turns.FirstOrDefault(turn =>
            !turn.IsTitleHook && timeSeconds >= turn.StartSeconds && timeSeconds <= turn.EndSeconds);

        var leftSpeaking = activeTurn?.Slot == DialogueSpeakerSlot.Left;
        var rightSpeaking = activeTurn?.Slot == DialogueSpeakerSlot.Right;

        var stageY = isLandscape ? h * 0.77f : h * 0.67f;
        var scale = isLandscape ? h * 0.255f : w * 0.265f;

        var leftX = w * (isLandscape ? 0.25f : 0.26f);
        var rightX = w * (isLandscape ? 0.75f : 0.74f);

        var leftColor = ParseHexRgb(palette.SpeakerAHex, palette.PrimaryRgb);
        var rightColor = ParseHexRgb(palette.SpeakerBHex, palette.SecondaryRgb);

        // Soft luminous podium beneath both communicating characters
        canvas.FillEllipse(w * 0.5f, stageY + scale * 0.16f, (rightX - leftX) * 0.78f, scale * 0.22f,
            12, 10, 22, 0.58f);
        canvas.DrawAdditiveRing(leftX, stageY + scale * 0.14f, scale * (leftSpeaking ? 0.42f : 0.30f),
            leftColor.R, leftColor.G, leftColor.B, leftSpeaking ? 0.45f : 0.18f);
        canvas.DrawAdditiveRing(rightX, stageY + scale * 0.14f, scale * (rightSpeaking ? 0.42f : 0.30f),
            rightColor.R, rightColor.G, rightColor.B, rightSpeaking ? 0.45f : 0.18f);

        // Animated dialogue energy stream connecting the active speaker toward the listener
        if (leftSpeaking || rightSpeaking)
        {
            var srcX = leftSpeaking ? leftX + scale * 0.26f : rightX - scale * 0.26f;
            var dstX = leftSpeaking ? rightX - scale * 0.26f : leftX + scale * 0.26f;
            var waveColor = leftSpeaking ? leftColor : rightColor;
            var mouthY = stageY - scale * 0.72f;
            var wavePhase = (float)((timeSeconds * 1.45) % 1.0);
            for (var p = 0; p < 5; p++)
            {
                var u = (wavePhase + p * 0.2f) % 1.0f;
                var px = srcX + (dstX - srcX) * u;
                var py = mouthY - MathF.Sin(u * MathF.PI) * scale * 0.14f + MathF.Sin((float)timeSeconds * 6f + p) * 4f;
                var alpha = MathF.Sin(u * MathF.PI) * 0.65f;
                canvas.DrawAdditiveDisc(px, py, minSide * 0.015f, waveColor.R, waveColor.G, waveColor.B, alpha);
            }
        }

        DrawCharacterFigure(canvas, leftX, stageY, scale, facingRight: true, timeSeconds,
            plan.LeftCharacter.Role, leftSpeaking, leftColor, seedOffset: 0.0);

        DrawCharacterFigure(canvas, rightX, stageY, scale, facingRight: false, timeSeconds,
            plan.RightCharacter.Role, rightSpeaking, rightColor, seedOffset: 1.7);
    }

    private static void DrawCharacterFigure(
        ProceduralSceneRasterizer canvas,
        float baseX,
        float baseY,
        float scale,
        bool facingRight,
        double timeSeconds,
        CharacterVisualRole role,
        bool isSpeaking,
        RgbColor accent,
        double seedOffset)
    {
        var dir = facingRight ? 1f : -1f;
        var t = timeSeconds + seedOffset;
        var breathe = (float)Math.Sin(t * 2.1) * scale * (isSpeaking ? 0.022f : 0.011f);
        var gestureBounce = isSpeaking ? (float)Math.Abs(Math.Sin(t * 7.2)) * scale * 0.04f : 0f;
        var nod = isSpeaking ? (float)Math.Sin(t * 5.0) * scale * 0.012f : (float)Math.Sin(t * 1.4) * scale * 0.008f;

        var hipY = baseY;
        var shoulderY = baseY - scale * 0.44f + breathe;
        var headCenterY = shoulderY - scale * 0.27f + nod;
        var headCenterX = baseX + dir * scale * 0.015f;

        // Aura spotlight behind active speaker
        var auraAlpha = isSpeaking ? 0.34f : 0.13f;
        canvas.DrawAdditiveDisc(baseX, shoulderY - scale * 0.06f, scale * (isSpeaking ? 0.85f : 0.56f),
            accent.R, accent.G, accent.B, auraAlpha);

        // Divine halo behind head for Divine or active Sage/King
        if (role == CharacterVisualRole.Divine || isSpeaking)
        {
            var haloR = role == CharacterVisualRole.Divine ? scale * 0.36f : scale * 0.28f;
            canvas.DrawAdditiveDisc(headCenterX, headCenterY, haloR, accent.R, accent.G, accent.B,
                role == CharacterVisualRole.Divine ? 0.48f : 0.22f);
            canvas.DrawAdditiveRing(headCenterX, headCenterY, haloR * 0.85f, 255, 232, 160,
                role == CharacterVisualRole.Divine ? 0.72f : 0.35f);
        }

        // Clothing palette per character role
        var (robeR, robeG, robeB, sashR, sashG, sashB) = role switch
        {
            CharacterVisualRole.KingCrown => ((byte)138, (byte)36, (byte)54, (byte)245, (byte)185, (byte)52),
            CharacterVisualRole.SageRishi => ((byte)214, (byte)102, (byte)24, (byte)252, (byte)218, (byte)130),
            CharacterVisualRole.Divine => ((byte)54, (byte)96, (byte)204, (byte)255, (byte)214, (byte)64),
            _ => ((byte)38, (byte)78, (byte)118, accent.R, accent.G, accent.B)
        };

        if (!isSpeaking)
        {
            // Dim non-speaking listener subtly so attention locks onto speaker
            robeR = (byte)(robeR * 0.78f);
            robeG = (byte)(robeG * 0.78f);
            robeB = (byte)(robeB * 0.78f);
        }

        // Seated/standing lower drape & torso silhouette
        canvas.FillEllipse(baseX, hipY + scale * 0.02f, scale * 0.32f, scale * 0.17f,
            (byte)(robeR * 0.75f), (byte)(robeG * 0.75f), (byte)(robeB * 0.75f), 0.96f);
        canvas.FillCapsule(baseX, hipY, baseX, shoulderY, scale * 0.19f, robeR, robeG, robeB, 0.98f);

        // Diagonal Angavastram / Royal sash across chest
        canvas.DrawGlowLine(
            baseX - dir * scale * 0.15f, shoulderY + scale * 0.04f,
            baseX + dir * scale * 0.15f, hipY - scale * 0.05f,
            scale * 0.055f, sashR, sashG, sashB, isSpeaking ? 0.88f : 0.55f);

        // Neck & Warm Skin Head
        canvas.FillCapsule(baseX, shoulderY, headCenterX, headCenterY + scale * 0.12f,
            scale * 0.065f, 208, 152, 114, 0.98f);

        var (skinR, skinG, skinB) = role == CharacterVisualRole.Divine
            ? ((byte)185, (byte)215, (byte)255)
            : ((byte)228, (byte)176, (byte)136);
        if (!isSpeaking)
        {
            skinR = (byte)(skinR * 0.86f);
            skinG = (byte)(skinG * 0.86f);
            skinB = (byte)(skinB * 0.86f);
        }

        var headRadius = scale * 0.175f;
        canvas.FillEllipse(headCenterX, headCenterY, headRadius, headRadius * 1.08f, skinR, skinG, skinB, 0.99f);

        // Hair / Beards / Headgear by archetype
        switch (role)
        {
            case CharacterVisualRole.KingCrown:
                // Royal three-tier Mukut crown + side ear ornaments
                canvas.FillCapsule(headCenterX - scale * 0.14f, headCenterY - headRadius * 0.82f,
                    headCenterX + scale * 0.14f, headCenterY - headRadius * 0.82f,
                    scale * 0.06f, 236, 178, 36, 0.98f);
                canvas.FillEllipse(headCenterX, headCenterY - headRadius * 1.24f, scale * 0.11f, scale * 0.12f, 250, 204, 21, 0.98f);
                canvas.FillEllipse(headCenterX, headCenterY - headRadius * 1.15f, scale * 0.036f, scale * 0.048f, 225, 29, 72, 0.98f);
                break;

            case CharacterVisualRole.SageRishi:
                // Traditional Jata topknot + flowing white beard
                canvas.FillEllipse(headCenterX - dir * scale * 0.04f, headCenterY - headRadius * 1.08f,
                    scale * 0.105f, scale * 0.095f, 210, 210, 220, 0.98f);
                canvas.FillEllipse(headCenterX + dir * scale * 0.02f, headCenterY + headRadius * 0.72f,
                    scale * 0.125f, scale * 0.16f, 230, 232, 238, 0.94f);
                break;

            case CharacterVisualRole.Divine:
                // Celestial peacock crown gem + dark curls
                canvas.FillEllipse(headCenterX, headCenterY - headRadius * 0.85f, scale * 0.14f, scale * 0.09f, 28, 36, 68, 0.98f);
                canvas.FillEllipse(headCenterX + dir * scale * 0.05f, headCenterY - headRadius * 1.32f, scale * 0.055f, scale * 0.075f, 16, 185, 129, 0.96f);
                canvas.DrawAdditiveDisc(headCenterX, headCenterY - headRadius * 1.2f, scale * 0.09f, 250, 204, 21, 0.65f);
                break;

            default:
                // Scholar hair + neat tilak/turban accent
                canvas.FillEllipse(headCenterX - dir * scale * 0.02f, headCenterY - headRadius * 0.84f,
                    scale * 0.165f, scale * 0.095f, 36, 30, 42, 0.98f);
                break;
        }

        // Tilak on forehead
        canvas.FillCapsule(headCenterX + dir * scale * 0.055f, headCenterY - headRadius * 0.42f,
            headCenterX + dir * scale * 0.055f, headCenterY - headRadius * 0.20f,
            scale * 0.015f, 234, 88, 12, 0.95f);

        // Eyes (blinks cleanly every ~3.8 seconds)
        var blinkWindow = (t % 3.8) > 3.66;
        var eyeX = headCenterX + dir * scale * 0.068f;
        var eyeY = headCenterY - scale * 0.018f;
        if (!blinkWindow)
        {
            canvas.FillEllipse(eyeX, eyeY, scale * 0.024f, scale * 0.019f, 28, 22, 32, 0.96f);
            canvas.FillEllipse(eyeX + dir * scale * 0.006f, eyeY - scale * 0.004f, scale * 0.008f, scale * 0.008f, 255, 255, 255, 0.9f);
        }
        else
        {
            canvas.DrawGlowLine(eyeX - scale * 0.022f, eyeY, eyeX + scale * 0.022f, eyeY, 1.5f, 40, 28, 30, 0.9f);
        }

        // Animated mouth: oscillates cleanly while speaker holds the floor
        var mouthX = headCenterX + dir * scale * 0.088f;
        var mouthY = headCenterY + scale * 0.072f;
        var mouthOpen = isSpeaking
            ? 0.016f + (float)(0.5 + 0.5 * Math.Sin(timeSeconds * 16.5)) * 0.032f
            : 0.009f;
        if (isSpeaking)
        {
            canvas.FillEllipse(mouthX, mouthY, scale * 0.036f, scale * mouthOpen, 120, 24, 34, 0.95f);
        }
        else
        {
            canvas.DrawGlowLine(mouthX - scale * 0.026f, mouthY, mouthX + scale * 0.026f, mouthY - scale * 0.006f,
                1.6f, 130, 54, 48, 0.92f);
        }

        // Gesturing foreground arm toward conversation partner
        var shoulderAnchorX = baseX + dir * scale * 0.13f;
        var shoulderAnchorY = shoulderY + scale * 0.05f;
        var elbowX = shoulderAnchorX + dir * scale * (isSpeaking ? 0.15f : 0.09f);
        var elbowY = shoulderAnchorY + scale * (isSpeaking ? 0.10f : 0.17f);
        var handX = elbowX + dir * scale * (isSpeaking ? 0.16f : 0.08f);
        var handY = elbowY - scale * (isSpeaking ? 0.14f : 0.02f) - gestureBounce;

        canvas.FillCapsule(shoulderAnchorX, shoulderAnchorY, elbowX, elbowY, scale * 0.052f, robeR, robeG, robeB, 0.96f);
        canvas.FillCapsule(elbowX, elbowY, handX, handY, scale * 0.044f, robeR, robeG, robeB, 0.96f);
        canvas.FillEllipse(handX, handY, scale * 0.048f, scale * 0.042f, skinR, skinG, skinB, 0.98f);

        if (isSpeaking)
        {
            canvas.DrawAdditiveDisc(handX, handY, scale * 0.11f, accent.R, accent.G, accent.B, 0.35f);
        }
    }

    private static RgbColor ParseHexRgb(string? hex, RgbColor fallback)
    {
        if (string.IsNullOrWhiteSpace(hex)) return fallback;
        var trimmed = hex.TrimStart('#');
        if (trimmed.Length != 6 || !int.TryParse(trimmed, System.Globalization.NumberStyles.HexNumber,
            System.Globalization.CultureInfo.InvariantCulture, out var rgb))
            return fallback;

        return new RgbColor((byte)((rgb >> 16) & 0xFF), (byte)((rgb >> 8) & 0xFF), (byte)(rgb & 0xFF));
    }
}
