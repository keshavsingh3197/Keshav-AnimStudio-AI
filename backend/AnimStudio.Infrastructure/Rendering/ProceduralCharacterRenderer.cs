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

        // On 9:16 mobile Shorts, position characters safely above the bottom 27% UI overlay & mid-lower subtitles (y=0.60..0.72).
        var stageY = isLandscape ? h * 0.77f : h * 0.555f;
        var scale = isLandscape ? h * 0.255f : w * 0.238f;

        var leftX = w * (isLandscape ? 0.24f : 0.27f);
        var rightX = w * (isLandscape ? 0.76f : 0.73f);

        var leftColor = ParseHexRgb(palette.SpeakerAHex, palette.PrimaryRgb);
        var rightColor = ParseHexRgb(palette.SpeakerBHex, palette.SecondaryRgb);

        // Soft luminous podium beneath both communicating characters
        canvas.FillEllipse(w * 0.5f, stageY + scale * 0.16f, (rightX - leftX) * 0.78f, scale * 0.20f,
            14, 10, 26, 0.62f);
        canvas.DrawAdditiveRing(leftX, stageY + scale * 0.14f, scale * (leftSpeaking ? 0.44f : 0.30f),
            leftColor.R, leftColor.G, leftColor.B, leftSpeaking ? 0.48f : 0.18f);
        canvas.DrawAdditiveRing(rightX, stageY + scale * 0.14f, scale * (rightSpeaking ? 0.44f : 0.30f),
            rightColor.R, rightColor.G, rightColor.B, rightSpeaking ? 0.48f : 0.18f);

        // Animated dialogue energy stream connecting the active speaker toward the listener
        if (leftSpeaking || rightSpeaking)
        {
            var srcX = leftSpeaking ? leftX + scale * 0.26f : rightX - scale * 0.26f;
            var dstX = leftSpeaking ? rightX - scale * 0.26f : leftX + scale * 0.26f;
            var waveColor = leftSpeaking ? leftColor : rightColor;
            var mouthY = stageY - scale * 0.70f;
            var wavePhase = (float)((timeSeconds * 1.45) % 1.0);
            for (var p = 0; p < 6; p++)
            {
                var u = (wavePhase + p * 0.166f) % 1.0f;
                var px = srcX + (dstX - srcX) * u;
                var py = mouthY - MathF.Sin(u * MathF.PI) * scale * 0.15f + MathF.Sin((float)timeSeconds * 6f + p) * 3.5f;
                var alpha = MathF.Sin(u * MathF.PI) * 0.70f;
                canvas.DrawAdditiveDisc(px, py, minSide * 0.014f, waveColor.R, waveColor.G, waveColor.B, alpha);
            }
        }

        var leftScale = plan.LeftCharacter.Role == CharacterVisualRole.ChildDevotee ? scale * 0.85f : scale;
        var rightScale = plan.RightCharacter.Role == CharacterVisualRole.ChildDevotee ? scale * 0.85f : scale;

        DrawCharacterFigure(canvas, leftX, stageY, leftScale, facingRight: true, timeSeconds,
            plan.LeftCharacter.Name, plan.LeftCharacter.Role, leftSpeaking, leftColor, seedOffset: 0.0);

        DrawCharacterFigure(canvas, rightX, stageY, rightScale, facingRight: false, timeSeconds,
            plan.RightCharacter.Name, plan.RightCharacter.Role, rightSpeaking, rightColor, seedOffset: 1.7);
    }

    private static void DrawCharacterFigure(
        ProceduralSceneRasterizer canvas,
        float baseX,
        float baseY,
        float scale,
        bool facingRight,
        double timeSeconds,
        string speakerName,
        CharacterVisualRole role,
        bool isSpeaking,
        RgbColor accent,
        double seedOffset)
    {
        var dir = facingRight ? 1f : -1f;
        var t = timeSeconds + seedOffset;
        var breathe = (float)Math.Sin(t * 2.1) * scale * (isSpeaking ? 0.022f : 0.011f);
        var gestureBounce = isSpeaking ? (float)Math.Abs(Math.Sin(t * 7.2)) * scale * 0.042f : 0f;
        var nod = isSpeaking ? (float)Math.Sin(t * 5.0) * scale * 0.014f : (float)Math.Sin(t * 1.4) * scale * 0.008f;
        var lean = isSpeaking ? dir * scale * 0.028f : 0f;

        var hipY = baseY;
        var shoulderY = baseY - scale * 0.44f + breathe;
        var headCenterY = shoulderY - scale * 0.27f + nod;
        var headCenterX = baseX + dir * scale * 0.018f + lean;

        // Aura spotlight behind active speaker
        var auraAlpha = isSpeaking ? 0.38f : 0.14f;
        canvas.DrawAdditiveDisc(baseX, shoulderY - scale * 0.08f, scale * (isSpeaking ? 0.92f : 0.58f),
            accent.R, accent.G, accent.B, auraAlpha);

        // Divine / Pauranik radiance halo behind head
        if (role is CharacterVisualRole.Divine or CharacterVisualRole.SageRishi || isSpeaking)
        {
            var haloR = role == CharacterVisualRole.Divine ? scale * 0.38f : scale * 0.29f;
            canvas.DrawAdditiveDisc(headCenterX, headCenterY, haloR, accent.R, accent.G, accent.B,
                role == CharacterVisualRole.Divine ? 0.50f : (isSpeaking ? 0.26f : 0.12f));
            canvas.DrawAdditiveRing(headCenterX, headCenterY, haloR * 0.86f, 255, 232, 160,
                role == CharacterVisualRole.Divine ? 0.74f : (isSpeaking ? 0.42f : 0.16f));
        }

        // Clothing palette distinct per character archetype
        var (robeR, robeG, robeB, sashR, sashG, sashB) = role switch
        {
            CharacterVisualRole.KingCrown => ((byte)146, (byte)36, (byte)58, (byte)245, (byte)190, (byte)56),
            CharacterVisualRole.SageRishi => ((byte)216, (byte)104, (byte)24, (byte)253, (byte)224, (byte)130),
            CharacterVisualRole.Divine => ((byte)50, (byte)96, (byte)214, (byte)255, (byte)216, (byte)64),
            CharacterVisualRole.ChildDevotee => ((byte)234, (byte)162, (byte)32, (byte)225, (byte)86, (byte)42),
            _ => ((byte)40, (byte)84, (byte)128, accent.R, accent.G, accent.B)
        };

        if (!isSpeaking)
        {
            robeR = (byte)(robeR * 0.82f);
            robeG = (byte)(robeG * 0.82f);
            robeB = (byte)(robeB * 0.82f);
        }

        // Seated lotus / padmasana lower drape & torso silhouette
        canvas.FillEllipse(baseX, hipY + scale * 0.02f, scale * 0.33f, scale * 0.17f,
            (byte)(robeR * 0.74f), (byte)(robeG * 0.74f), (byte)(robeB * 0.74f), 0.97f);
        canvas.FillCapsule(baseX, hipY, baseX + lean * 0.4f, shoulderY, scale * 0.19f, robeR, robeG, robeB, 0.98f);

        // Diagonal Angavastram / Royal uttariya & pearl kanthi mala
        canvas.DrawGlowLine(
            baseX - dir * scale * 0.15f, shoulderY + scale * 0.03f,
            baseX + dir * scale * 0.15f, hipY - scale * 0.05f,
            scale * 0.052f, sashR, sashG, sashB, isSpeaking ? 0.90f : 0.60f);
        if (role is CharacterVisualRole.ChildDevotee or CharacterVisualRole.KingCrown or CharacterVisualRole.Divine)
        {
            canvas.DrawGlowLine(
                baseX - scale * 0.08f, shoulderY + scale * 0.02f,
                baseX + scale * 0.08f, shoulderY + scale * 0.02f,
                scale * 0.018f, 255, 224, 120, 0.88f);
        }

        // Signature prop for Sage Narada (curved glowing Veena held across torso)
        var isNarada = role == CharacterVisualRole.SageRishi
            && (speakerName.Contains("narad", StringComparison.OrdinalIgnoreCase)
                || speakerName.Contains("नारद", StringComparison.OrdinalIgnoreCase));
        if (isNarada)
        {
            var gourdX = baseX - dir * scale * 0.16f;
            var gourdY = hipY - scale * 0.11f;
            var topVeenaX = baseX + dir * scale * 0.14f;
            var topVeenaY = shoulderY - scale * 0.14f;
            canvas.FillCapsule(gourdX, gourdY, topVeenaX, topVeenaY, scale * 0.022f, 168, 92, 34, 0.98f);
            canvas.FillEllipse(gourdX, gourdY, scale * 0.085f, scale * 0.072f, 212, 128, 46, 0.98f);
            canvas.FillEllipse(topVeenaX, topVeenaY, scale * 0.052f, scale * 0.048f, 232, 166, 62, 0.98f);
            canvas.DrawGlowLine(gourdX, gourdY, topVeenaX, topVeenaY, 1.4f, 255, 234, 150, 0.85f);
        }

        // Neck & Warm Skin Head
        canvas.FillCapsule(baseX + lean * 0.4f, shoulderY, headCenterX, headCenterY + scale * 0.12f,
            scale * 0.064f, 208, 152, 114, 0.98f);

        var (skinR, skinG, skinB) = role == CharacterVisualRole.Divine
            ? ((byte)185, (byte)215, (byte)255)
            : ((byte)232, (byte)180, (byte)140);
        if (!isSpeaking)
        {
            skinR = (byte)(skinR * 0.88f);
            skinG = (byte)(skinG * 0.88f);
            skinB = (byte)(skinB * 0.88f);
        }

        var headRadius = scale * 0.178f;
        canvas.FillEllipse(headCenterX, headCenterY, headRadius, headRadius * 1.07f, skinR, skinG, skinB, 0.99f);

        // Warm cheek tint & golden ear Kundal ornament
        canvas.FillEllipse(headCenterX - dir * scale * 0.12f, headCenterY + scale * 0.02f,
            scale * 0.032f, scale * 0.040f, 245, 198, 66, 0.95f);

        // Hair / Beards / Headgear by archetype
        switch (role)
        {
            case CharacterVisualRole.KingCrown:
                canvas.FillCapsule(headCenterX - scale * 0.14f, headCenterY - headRadius * 0.82f,
                    headCenterX + scale * 0.14f, headCenterY - headRadius * 0.82f,
                    scale * 0.06f, 236, 178, 36, 0.98f);
                canvas.FillEllipse(headCenterX, headCenterY - headRadius * 1.24f, scale * 0.11f, scale * 0.12f, 250, 204, 21, 0.98f);
                canvas.FillEllipse(headCenterX, headCenterY - headRadius * 1.15f, scale * 0.036f, scale * 0.048f, 225, 29, 72, 0.98f);
                break;

            case CharacterVisualRole.ChildDevotee:
                // Crisp dark hair + golden Bal-Mukut prince headband with emerald gem
                canvas.FillEllipse(headCenterX - dir * scale * 0.025f, headCenterY - headRadius * 0.84f,
                    scale * 0.165f, scale * 0.095f, 26, 22, 34, 0.98f);
                canvas.FillCapsule(headCenterX - scale * 0.13f, headCenterY - headRadius * 0.62f,
                    headCenterX + scale * 0.13f, headCenterY - headRadius * 0.62f,
                    scale * 0.025f, 248, 200, 52, 0.98f);
                canvas.FillEllipse(headCenterX + dir * scale * 0.05f, headCenterY - headRadius * 0.78f,
                    scale * 0.034f, scale * 0.040f, 16, 185, 129, 0.98f);
                break;

            case CharacterVisualRole.SageRishi:
                canvas.FillEllipse(headCenterX - dir * scale * 0.04f, headCenterY - headRadius * 1.08f,
                    scale * 0.105f, scale * 0.095f, 220, 222, 232, 0.98f);
                canvas.FillEllipse(headCenterX + dir * scale * 0.02f, headCenterY + headRadius * 0.72f,
                    scale * 0.125f, scale * 0.16f, 236, 238, 244, 0.95f);
                break;

            case CharacterVisualRole.Divine:
                canvas.FillEllipse(headCenterX, headCenterY - headRadius * 0.85f, scale * 0.14f, scale * 0.09f, 28, 36, 68, 0.98f);
                canvas.FillEllipse(headCenterX + dir * scale * 0.05f, headCenterY - headRadius * 1.32f, scale * 0.055f, scale * 0.075f, 16, 185, 129, 0.96f);
                canvas.DrawAdditiveDisc(headCenterX, headCenterY - headRadius * 1.2f, scale * 0.09f, 250, 204, 21, 0.65f);
                break;

            default:
                canvas.FillEllipse(headCenterX - dir * scale * 0.02f, headCenterY - headRadius * 0.84f,
                    scale * 0.165f, scale * 0.095f, 36, 30, 42, 0.98f);
                break;
        }

        // Sacred forehead Tilak
        canvas.FillCapsule(headCenterX + dir * scale * 0.055f, headCenterY - headRadius * 0.44f,
            headCenterX + dir * scale * 0.055f, headCenterY - headRadius * 0.22f,
            scale * 0.015f, 234, 88, 12, 0.95f);

        // Expressive eyebrow & blinking eyes
        var blinkWindow = (t % 3.8) > 3.66;
        var eyeX = headCenterX + dir * scale * 0.068f;
        var eyeY = headCenterY - scale * 0.016f;
        var browLift = isSpeaking ? scale * 0.010f : 0f;
        canvas.DrawGlowLine(eyeX - scale * 0.028f, eyeY - scale * 0.040f - browLift,
            eyeX + scale * 0.028f, eyeY - scale * 0.044f - browLift, 1.4f, 44, 30, 28, 0.85f);

        if (!blinkWindow)
        {
            canvas.FillEllipse(eyeX, eyeY, scale * 0.025f, scale * 0.020f, 28, 22, 32, 0.96f);
            canvas.FillEllipse(eyeX + dir * scale * 0.006f, eyeY - scale * 0.004f, scale * 0.008f, scale * 0.008f, 255, 255, 255, 0.92f);
        }
        else
        {
            canvas.DrawGlowLine(eyeX - scale * 0.022f, eyeY, eyeX + scale * 0.022f, eyeY, 1.5f, 40, 28, 30, 0.9f);
        }

        // Animated mouth: strictly tracks real synthesized audio energy when present so silence never flaps mouth!
        var mouthX = headCenterX + dir * scale * 0.088f;
        var mouthY = headCenterY + scale * 0.072f;
        var speechEnergy = isSpeaking
            ? (canvas.ActiveSpeechLevel is { } realSpeech
                ? realSpeech
                : (float)(0.5 + 0.5 * Math.Sin(timeSeconds * 16.5)))
            : 0f;
        var mouthActive = isSpeaking && speechEnergy > 0.045f;
        if (mouthActive)
        {
            var mouthOpen = 0.012f + speechEnergy * 0.036f;
            canvas.FillEllipse(mouthX, mouthY, scale * 0.036f, scale * mouthOpen, 128, 26, 36, 0.96f);
        }
        else
        {
            canvas.DrawGlowLine(mouthX - scale * 0.026f, mouthY, mouthX + scale * 0.026f, mouthY - scale * 0.007f,
                1.6f, 134, 58, 52, 0.92f);
        }

        // Gesturing foreground arm toward conversation partner (or serene folded Namaste/meditation gesture while listening)
        var shoulderAnchorX = baseX + lean * 0.4f + dir * scale * 0.13f;
        var shoulderAnchorY = shoulderY + scale * 0.05f;
        var elbowX = shoulderAnchorX + dir * scale * (isSpeaking ? 0.16f : 0.08f);
        var elbowY = shoulderAnchorY + scale * (isSpeaking ? 0.09f : 0.16f);
        var handX = elbowX + dir * scale * (isSpeaking ? 0.16f : 0.05f);
        var handY = elbowY - scale * (isSpeaking ? 0.15f : 0.04f) - gestureBounce;

        canvas.FillCapsule(shoulderAnchorX, shoulderAnchorY, elbowX, elbowY, scale * 0.050f, robeR, robeG, robeB, 0.96f);
        canvas.FillCapsule(elbowX, elbowY, handX, handY, scale * 0.042f, robeR, robeG, robeB, 0.96f);
        canvas.FillEllipse(handX, handY, scale * 0.046f, scale * 0.040f, skinR, skinG, skinB, 0.98f);

        if (isSpeaking)
        {
            canvas.DrawAdditiveDisc(handX, handY, scale * 0.11f, accent.R, accent.G, accent.B, 0.36f);
        }

        // Speaker pedestal badge bar beneath active speaker for immediate visual clarity
        var barW = scale * (isSpeaking ? 0.36f : 0.22f);
        var barY = baseY + scale * 0.18f;
        canvas.FillCapsule(baseX - barW, barY, baseX + barW, barY, scale * 0.022f,
            accent.R, accent.G, accent.B, isSpeaking ? 0.85f : 0.30f);
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
