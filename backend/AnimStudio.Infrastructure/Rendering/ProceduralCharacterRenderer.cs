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
        ProceduralEventPalette palette,
        ProceduralStageLayout? layout = null)
    {
        if (!plan.HasCharacters || plan.LeftCharacter is null || plan.RightCharacter is null)
            return;

        var w = canvas.Width;
        var h = canvas.Height;
        var minSide = MathF.Min(w, h);
        var isLandscape = w > h;

        var activeTurn = plan.Turns.FirstOrDefault(turn =>
            !turn.IsTitleHook && timeSeconds >= turn.StartSeconds && timeSeconds <= turn.EndSeconds);

        // A supporting character speaking stays in the back row and steps forward; the main pair keeps its places.
        var supporting = plan.Supporting;
        var activeSupportIndex = activeTurn is null ? -1 : IndexOfName(supporting, activeTurn.SpeakerName);
        var leftSpeaking = activeSupportIndex < 0 && activeTurn?.Slot == DialogueSpeakerSlot.Left;
        var rightSpeaking = activeSupportIndex < 0 && activeTurn?.Slot == DialogueSpeakerSlot.Right;

        // On 9:16 mobile Shorts, position characters safely above the bottom 27% UI overlay & mid-lower subtitles (y=0.60..0.72).
        var stageY = isLandscape ? h * 0.77f : h * 0.555f;
        var scale = isLandscape ? h * 0.255f : w * 0.238f;

        var leftX = w * (isLandscape ? 0.24f : 0.27f);
        var rightX = w * (isLandscape ? 0.76f : 0.73f);
        float leftY = stageY, rightY = stageY, leftMul = 1f, rightMul = 1f;

        // Placements chosen on a template picture: each main character stands on its own spot and size.
        var placed = layout is { Left: not null } or { Right: not null };
        if (layout?.Left is { } lp)
        {
            leftX = w * (float)lp.X;
            leftY = h * (float)lp.Y;
            leftMul = (float)lp.Scale;
        }
        if (layout?.Right is { } rp)
        {
            rightX = w * (float)rp.X;
            rightY = h * (float)rp.Y;
            rightMul = (float)rp.Scale;
        }
        var leftFacesRight = leftX <= rightX;

        var leftColor = ParseHexRgb(palette.SpeakerAHex, palette.PrimaryRgb);
        var rightColor = ParseHexRgb(palette.SpeakerBHex, palette.SecondaryRgb);

        DrawSupportingCast(canvas, timeSeconds, supporting, activeSupportIndex, (leftY + rightY) * 0.5f, scale, isLandscape, palette);

        // Soft luminous podium beneath both communicating characters. Characters placed on a picture stand on its
        // own ground instead (each figure still casts its contact shadow).
        if (!placed)
        {
            canvas.FillEllipse(w * 0.5f, stageY + scale * 0.16f, (rightX - leftX) * 0.78f, scale * 0.20f,
                14, 10, 26, 0.62f);
        }
        var leftRingScale = scale * leftMul;
        var rightRingScale = scale * rightMul;
        canvas.DrawAdditiveRing(leftX, leftY + leftRingScale * 0.14f, leftRingScale * (leftSpeaking ? 0.44f : 0.30f),
            leftColor.R, leftColor.G, leftColor.B, leftSpeaking ? 0.48f : 0.18f);
        canvas.DrawAdditiveRing(rightX, rightY + rightRingScale * 0.14f, rightRingScale * (rightSpeaking ? 0.44f : 0.30f),
            rightColor.R, rightColor.G, rightColor.B, rightSpeaking ? 0.48f : 0.18f);

        // Animated dialogue energy stream connecting the active speaker toward the listener
        if (leftSpeaking || rightSpeaking)
        {
            var inward = leftFacesRight ? 1f : -1f;
            var srcX = leftSpeaking ? leftX + inward * leftRingScale * 0.26f : rightX - inward * rightRingScale * 0.26f;
            var dstX = leftSpeaking ? rightX - inward * rightRingScale * 0.26f : leftX + inward * leftRingScale * 0.26f;
            var waveColor = leftSpeaking ? leftColor : rightColor;
            var mouthY = leftSpeaking ? leftY - leftRingScale * 0.70f : rightY - rightRingScale * 0.70f;
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

        var activeLeftName = leftSpeaking && activeTurn is { SpeakerName.Length: > 0 }
            ? activeTurn.SpeakerName
            : plan.LeftCharacter.Name;
        var activeLeftRole = leftSpeaking && activeTurn?.SpeakerRole is { } lRole && lRole != CharacterVisualRole.Narrator
            ? lRole
            : plan.LeftCharacter.Role;
        var activeRightName = rightSpeaking && activeTurn is { SpeakerName.Length: > 0 }
            ? activeTurn.SpeakerName
            : plan.RightCharacter.Name;
        var activeRightRole = rightSpeaking && activeTurn?.SpeakerRole is { } rRole && rRole != CharacterVisualRole.Narrator
            ? rRole
            : plan.RightCharacter.Role;

        var leftScale = (activeLeftRole == CharacterVisualRole.ChildDevotee ? scale * 0.85f : scale) * leftMul;
        var rightScale = (activeRightRole == CharacterVisualRole.ChildDevotee ? scale * 0.85f : scale) * rightMul;

        DrawCharacterFigure(canvas, leftX, leftY, leftScale, facingRight: leftFacesRight, timeSeconds,
            activeLeftName, activeLeftRole, leftSpeaking, leftColor, seedOffset: 0.0,
            robeHex: string.Equals(activeLeftName, plan.LeftCharacter.Name, StringComparison.OrdinalIgnoreCase) ? plan.LeftCharacter.RobeHex : null,
            emotion: leftSpeaking ? activeTurn?.Emotion : activeTurn?.ListenerEmotion);

        DrawCharacterFigure(canvas, rightX, rightY, rightScale, facingRight: !leftFacesRight, timeSeconds,
            activeRightName, activeRightRole, rightSpeaking, rightColor, seedOffset: 1.7,
            robeHex: string.Equals(activeRightName, plan.RightCharacter.Name, StringComparison.OrdinalIgnoreCase) ? plan.RightCharacter.RobeHex : null,
            emotion: rightSpeaking ? activeTurn?.Emotion : activeTurn?.ListenerEmotion);
    }

    private static int IndexOfName(IReadOnlyList<ProceduralCharacterProfile> cast, string? name)
    {
        if (string.IsNullOrWhiteSpace(name)) return -1;
        for (var i = 0; i < cast.Count; i++)
            if (string.Equals(cast[i].Name, name, StringComparison.OrdinalIgnoreCase)) return i;
        return -1;
    }

    /// <summary>
    /// Up to three supporting characters stand further back (smaller, slightly hazed by depth). The one speaking
    /// steps forward with an aura so viewers always see who talks.
    /// </summary>
    private static void DrawSupportingCast(
        ProceduralSceneRasterizer canvas,
        double timeSeconds,
        IReadOnlyList<ProceduralCharacterProfile> supporting,
        int activeIndex,
        float stageY,
        float scale,
        bool isLandscape,
        ProceduralEventPalette palette)
    {
        if (supporting.Count == 0) return;
        var w = canvas.Width;
        float[] slots = supporting.Count switch
        {
            1 => [0.5f],
            2 => isLandscape ? [0.42f, 0.58f] : [0.5f, 0.12f],
            _ => isLandscape ? [0.5f, 0.38f, 0.62f] : [0.5f, 0.11f, 0.89f]
        };
        var accent = ParseHexRgb(palette.SpeakerBHex, palette.SecondaryRgb);
        for (var i = 0; i < supporting.Count && i < slots.Length; i++)
        {
            var member = supporting[i];
            var speaking = i == activeIndex;
            var depthScale = scale * (speaking ? 0.74f : 0.6f) * (member.Role == CharacterVisualRole.ChildDevotee ? 0.85f : 1f);
            var baseY = stageY - scale * (speaking ? 0.2f : 0.3f);
            var x = w * slots[i];
            DrawCharacterFigure(canvas, x, baseY, depthScale, facingRight: x < w * 0.5f || (x == w * 0.5f && i % 2 == 0), timeSeconds,
                member.Name, member.Role, speaking, accent, seedOffset: 3.1 + i * 1.3, robeHex: member.RobeHex, depthDim: speaking ? 0f : 0.28f);
        }
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
        double seedOffset,
        string? robeHex = null,
        float depthDim = 0f,
        string? emotion = null)
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

        // Soft contact shadow grounds the figure on the stage floor.
        canvas.FillEllipse(baseX + dir * scale * 0.06f, baseY + scale * 0.13f, scale * 0.42f, scale * 0.07f, 6, 4, 10, 0.42f * (1f - depthDim));

        // Aura spotlight behind active speaker
        var auraAlpha = isSpeaking ? 0.38f : 0.14f;
        canvas.DrawAdditiveDisc(baseX, shoulderY - scale * 0.08f, scale * (isSpeaking ? 0.92f : 0.58f),
            accent.R, accent.G, accent.B, auraAlpha);

        // Divine / Pauranik radiance halo behind head
        var isGoddess = role == CharacterVisualRole.NobleWoman && IsGoddessName(speakerName);
        if (role is CharacterVisualRole.Divine or CharacterVisualRole.SageRishi || isGoddess || isSpeaking)
        {
            var divineGlow = role == CharacterVisualRole.Divine || isGoddess;
            var haloR = divineGlow ? scale * 0.38f : scale * 0.29f;
            canvas.DrawAdditiveDisc(headCenterX, headCenterY, haloR, accent.R, accent.G, accent.B,
                divineGlow ? 0.50f : (isSpeaking ? 0.26f : 0.12f));
            canvas.DrawAdditiveRing(headCenterX, headCenterY, haloR * 0.86f, 255, 232, 160,
                divineGlow ? 0.74f : (isSpeaking ? 0.42f : 0.16f));
        }

        // Clothing palette distinct per character archetype
        var (robeR, robeG, robeB, sashR, sashG, sashB) = role switch
        {
            CharacterVisualRole.KingCrown => ((byte)146, (byte)36, (byte)58, (byte)245, (byte)190, (byte)56),
            CharacterVisualRole.SageRishi => ((byte)216, (byte)104, (byte)24, (byte)253, (byte)224, (byte)130),
            CharacterVisualRole.Divine => ((byte)50, (byte)96, (byte)214, (byte)255, (byte)216, (byte)64),
            CharacterVisualRole.ChildDevotee => ((byte)234, (byte)162, (byte)32, (byte)225, (byte)86, (byte)42),
            CharacterVisualRole.NobleWoman => ((byte)196, (byte)44, (byte)86, (byte)248, (byte)196, (byte)70),
            CharacterVisualRole.Warrior => ((byte)120, (byte)84, (byte)52, (byte)178, (byte)182, (byte)192),
            CharacterVisualRole.BrainrotLog => ((byte)146, (byte)92, (byte)46, (byte)245, (byte)190, (byte)56),
            CharacterVisualRole.CupDancer => ((byte)236, (byte)244, (byte)255, (byte)244, (byte)114, (byte)182),
            CharacterVisualRole.CartoonTank => ((byte)72, (byte)114, (byte)64, (byte)250, (byte)204, (byte)21),
            CharacterVisualRole.ComicBobble => ((byte)249, (byte)115, (byte)22, (byte)56, (byte)189, (byte)248),
            _ => ((byte)40, (byte)84, (byte)128, accent.R, accent.G, accent.B)
        };
        if (robeHex is not null)
        {
            var custom = ParseHexRgb(robeHex, new RgbColor(robeR, robeG, robeB));
            (robeR, robeG, robeB) = (custom.R, custom.G, custom.B);
        }

        var dim = (isSpeaking ? 1f : 0.82f) * (1f - depthDim);
        robeR = (byte)(robeR * dim);
        robeG = (byte)(robeG * dim);
        robeB = (byte)(robeB * dim);

        // Seated lotus / padmasana lower drape & torso silhouette
        canvas.FillEllipse(baseX, hipY + scale * 0.02f, scale * 0.33f, scale * 0.17f,
            (byte)(robeR * 0.74f), (byte)(robeG * 0.74f), (byte)(robeB * 0.74f), 0.97f);
        canvas.FillCapsule(baseX, hipY, baseX + lean * 0.4f, shoulderY, scale * 0.19f, robeR, robeG, robeB, 0.98f);
        // Form shading: the side away from the key light falls into shadow, the near side catches a rim light.
        canvas.FillCapsule(baseX - dir * scale * 0.09f, hipY, baseX - dir * scale * 0.09f + lean * 0.4f, shoulderY + scale * 0.04f,
            scale * 0.09f, (byte)(robeR * 0.62f), (byte)(robeG * 0.62f), (byte)(robeB * 0.62f), 0.55f);
        canvas.DrawGlowLine(baseX + dir * scale * 0.17f, hipY - scale * 0.04f, baseX + dir * scale * 0.15f + lean * 0.4f, shoulderY + scale * 0.06f,
            scale * 0.02f, 255, 236, 200, isSpeaking ? 0.38f : 0.18f);

        if (role == CharacterVisualRole.NobleWoman)
        {
            // Saree pallu flowing from the shoulder, with a gold border.
            canvas.FillCapsule(baseX + dir * scale * 0.12f, shoulderY + scale * 0.02f, baseX - dir * scale * 0.2f, hipY + scale * 0.06f,
                scale * 0.06f, (byte)(robeR * 0.8f), (byte)(robeG * 0.8f), (byte)(robeB * 0.8f), 0.9f);
            canvas.DrawGlowLine(baseX + dir * scale * 0.12f, shoulderY + scale * 0.02f, baseX - dir * scale * 0.2f, hipY + scale * 0.06f,
                scale * 0.012f, 255, 214, 100, 0.85f);
        }
        else if (role == CharacterVisualRole.Warrior)
        {
            // Round shield on the back arm and a spear held upright.
            var shieldX = baseX - dir * scale * 0.2f;
            var shieldY = hipY - scale * 0.2f;
            canvas.FillEllipse(shieldX, shieldY, scale * 0.15f, scale * 0.15f, 120, 70, 34, 0.97f);
            canvas.DrawAdditiveRing(shieldX, shieldY, scale * 0.13f, 220, 190, 120, 0.6f);
            canvas.FillEllipse(shieldX, shieldY, scale * 0.035f, scale * 0.035f, 214, 190, 130, 0.97f);
            var spearX = baseX + dir * scale * 0.33f;
            canvas.FillCapsule(spearX, hipY + scale * 0.12f, spearX, shoulderY - scale * 0.6f, scale * 0.012f, 110, 78, 44, 0.97f);
            canvas.FillEllipse(spearX, shoulderY - scale * 0.64f, scale * 0.02f, scale * 0.06f, 210, 214, 222, 0.97f);
        }

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
        var skinDim = (isSpeaking ? 1f : 0.88f) * (1f - depthDim);
        skinR = (byte)(skinR * skinDim);
        skinG = (byte)(skinG * skinDim);
        skinB = (byte)(skinB * skinDim);

        var headRadius = scale * 0.178f;
        if (role == CharacterVisualRole.NobleWoman)
        {
            // Long braid falling behind the shoulder (drawn first so the head sits over it).
            canvas.FillCapsule(headCenterX - dir * scale * 0.1f, headCenterY, headCenterX - dir * scale * 0.16f, shoulderY + scale * 0.3f,
                scale * 0.05f, 30, 22, 30, 0.97f);
            canvas.DrawAdditiveDisc(headCenterX - dir * scale * 0.16f, shoulderY + scale * 0.3f, scale * 0.04f, 255, 210, 220, 0.5f);
        }
        canvas.FillEllipse(headCenterX, headCenterY, headRadius, headRadius * 1.07f, skinR, skinG, skinB, 0.99f);
        // Head shading: shadowed back of the head, warm highlight on the lit cheek.
        canvas.FillEllipse(headCenterX - dir * headRadius * 0.42f, headCenterY + headRadius * 0.08f, headRadius * 0.55f, headRadius * 0.9f,
            (byte)(skinR * 0.74f), (byte)(skinG * 0.72f), (byte)(skinB * 0.72f), 0.45f);
        canvas.DrawAdditiveDisc(headCenterX + dir * headRadius * 0.35f, headCenterY - headRadius * 0.2f, headRadius * 0.45f, 255, 226, 196, 0.12f);

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

            case CharacterVisualRole.NobleWoman:
                // Centre-parted hair, maang-tikka and a small crown for queens / goddesses.
                canvas.FillEllipse(headCenterX - dir * scale * 0.02f, headCenterY - headRadius * 0.8f,
                    scale * 0.17f, scale * 0.1f, 30, 22, 30, 0.98f);
                canvas.FillEllipse(headCenterX + dir * scale * 0.03f, headCenterY - headRadius * 0.52f, scale * 0.018f, scale * 0.022f, 250, 204, 21, 0.98f);
                if (isGoddess || speakerName.Contains("rani", StringComparison.OrdinalIgnoreCase) || speakerName.Contains("रानी", StringComparison.Ordinal))
                {
                    canvas.FillCapsule(headCenterX - scale * 0.1f, headCenterY - headRadius * 0.95f,
                        headCenterX + scale * 0.1f, headCenterY - headRadius * 0.95f, scale * 0.03f, 236, 178, 36, 0.98f);
                    canvas.FillEllipse(headCenterX, headCenterY - headRadius * 1.12f, scale * 0.045f, scale * 0.06f, 250, 204, 21, 0.98f);
                }
                break;

            case CharacterVisualRole.Warrior:
                // Helmet with a red crest plume.
                canvas.FillEllipse(headCenterX, headCenterY - headRadius * 0.55f, headRadius * 1.02f, headRadius * 0.62f, 150, 156, 168, 0.98f);
                canvas.FillCapsule(headCenterX - headRadius, headCenterY - headRadius * 0.3f, headCenterX + headRadius, headCenterY - headRadius * 0.3f,
                    scale * 0.02f, 196, 160, 70, 0.98f);
                for (var plume = 0; plume < 4; plume++)
                {
                    var wave = MathF.Sin((float)t * 3f + plume) * scale * 0.01f;
                    canvas.FillEllipse(headCenterX - dir * plume * scale * 0.035f, headCenterY - headRadius * 1.12f + plume * scale * 0.012f + wave,
                        scale * 0.04f, scale * 0.025f, 200, 36, 44, 0.95f);
                }
                break;

            case CharacterVisualRole.Divine:
                canvas.FillEllipse(headCenterX, headCenterY - headRadius * 0.85f, scale * 0.14f, scale * 0.09f, 28, 36, 68, 0.98f);
                canvas.FillEllipse(headCenterX + dir * scale * 0.05f, headCenterY - headRadius * 1.32f, scale * 0.055f, scale * 0.075f, 16, 185, 129, 0.96f);
                canvas.DrawAdditiveDisc(headCenterX, headCenterY - headRadius * 1.2f, scale * 0.09f, 250, 204, 21, 0.65f);
                break;

            case CharacterVisualRole.CartoonTank:
                canvas.FillEllipse(headCenterX, headCenterY, headRadius * 1.2f, headRadius * 0.72f, 72, 114, 64, 0.99f);
                canvas.FillCapsule(headCenterX + dir * headRadius * 0.6f, headCenterY - headRadius * 0.1f,
                    headCenterX + dir * headRadius * 1.9f, headCenterY - headRadius * 0.1f, scale * 0.036f, 54, 88, 48, 0.98f);
                break;

            case CharacterVisualRole.BrainrotLog:
                canvas.FillCapsule(headCenterX, hipY, headCenterX, headCenterY - headRadius * 0.9f, headRadius * 0.85f, 146, 92, 46, 0.98f);
                canvas.FillCapsule(baseX + dir * scale * 0.28f, shoulderY, baseX + dir * scale * 0.36f, shoulderY - scale * 0.32f,
                    scale * 0.042f, 186, 128, 68, 0.97f);
                break;

            case CharacterVisualRole.CupDancer:
                canvas.FillCapsule(headCenterX - scale * 0.14f, headCenterY - headRadius * 0.45f,
                    headCenterX + scale * 0.14f, headCenterY - headRadius * 0.45f, scale * 0.024f, 248, 200, 52, 0.98f);
                break;

            case CharacterVisualRole.ComicBobble:
                canvas.FillEllipse(headCenterX, headCenterY, headRadius * 1.18f, headRadius * 1.18f, skinR, skinG, skinB, 0.99f);
                canvas.FillEllipse(headCenterX - dir * scale * 0.02f, headCenterY - headRadius * 0.95f,
                    scale * 0.18f, scale * 0.095f, 36, 30, 42, 0.98f);
                break;

            default:
                canvas.FillEllipse(headCenterX - dir * scale * 0.02f, headCenterY - headRadius * 0.84f,
                    scale * 0.165f, scale * 0.095f, 36, 30, 42, 0.98f);
                break;
        }

        // Sacred forehead tilak (a bindi for women; none under a warrior's helmet)
        if (role == CharacterVisualRole.NobleWoman)
        {
            canvas.FillEllipse(headCenterX + dir * scale * 0.055f, headCenterY - headRadius * 0.3f, scale * 0.014f, scale * 0.014f, 200, 20, 40, 0.97f);
        }
        else if (role != CharacterVisualRole.Warrior)
        {
            canvas.FillCapsule(headCenterX + dir * scale * 0.055f, headCenterY - headRadius * 0.44f,
                headCenterX + dir * scale * 0.055f, headCenterY - headRadius * 0.22f,
                scale * 0.015f, 234, 88, 12, 0.95f);
        }

        // Expressive eyebrow & blinking eyes (including smug squint, scared pop + sweat, sad tear, proud sparkles)
        var blinkWindow = (t % 3.8) > 3.66;
        var eyeX = headCenterX + dir * scale * 0.068f;
        var eyeY = headCenterY - scale * 0.016f;
        var emo = (emotion ?? "calm").ToLowerInvariant();
        var browLift = emo is "surprised" or "scared" or "laughing" or "proud" or "smug"
            ? scale * (emo == "scared" ? 0.026f : 0.020f)
            : (isSpeaking ? scale * 0.010f : 0f);
        var browSlant = emo == "angry"
            ? scale * 0.014f
            : (emo is "sad" or "confused" or "scared" ? -scale * 0.012f : emo == "smug" ? -scale * 0.016f : -scale * 0.004f);
        canvas.DrawGlowLine(eyeX - scale * 0.028f, eyeY - scale * 0.040f - browLift,
            eyeX + scale * 0.028f, eyeY - scale * 0.040f - browLift + browSlant * dir, 1.5f, 44, 30, 28, 0.85f);

        if (emo == "smug" && !blinkWindow)
        {
            // Half-lidded knowing sarcastic squint
            canvas.FillEllipse(eyeX, eyeY + scale * 0.004f, scale * 0.024f, scale * 0.010f, 28, 22, 32, 0.96f);
            canvas.DrawGlowLine(eyeX - scale * 0.026f, eyeY - scale * 0.005f, eyeX + scale * 0.026f, eyeY - scale * 0.005f,
                1.8f, 40, 28, 30, 0.92f);
        }
        else if (!blinkWindow && emo != "laughing")
        {
            var eyeRy = emo is "surprised" or "scared" ? scale * 0.029f : scale * 0.020f;
            canvas.FillEllipse(eyeX, eyeY, scale * 0.025f, eyeRy, 28, 22, 32, 0.96f);
            var glintR = emo == "scared" ? scale * 0.006f : scale * 0.008f;
            canvas.FillEllipse(eyeX + dir * scale * 0.006f, eyeY - scale * 0.004f, glintR, glintR, 255, 255, 255, 0.94f);
        }
        else
        {
            canvas.DrawGlowLine(eyeX - scale * 0.022f, eyeY, eyeX + scale * 0.022f, eyeY - (emo == "laughing" ? scale * 0.009f : 0f),
                1.6f, 40, 28, 30, 0.9f);
        }

        if (emo == "sad")
        {
            var tearDrop = (float)((t * 1.4) % 1.0);
            canvas.FillEllipse(eyeX - dir * scale * 0.008f, eyeY + scale * (0.028f + tearDrop * 0.045f),
                scale * 0.009f, scale * 0.014f, 56, 189, 248, 0.90f);
        }
        else if (emo == "scared")
        {
            var sweatDrop = (float)((t * 2.0) % 1.0);
            canvas.FillEllipse(headCenterX - dir * scale * 0.095f, headCenterY - headRadius * (0.36f - sweatDrop * 0.16f),
                scale * 0.012f, scale * 0.020f, 56, 189, 248, 0.92f);
        }
        else if (emo == "proud")
        {
            var sparkleR = scale * (0.011f + 0.005f * (float)Math.Abs(Math.Sin(t * 7.5)));
            canvas.FillEllipse(headCenterX - dir * scale * 0.14f, headCenterY - headRadius * 0.72f, sparkleR, sparkleR, 250, 204, 21, 0.92f);
            canvas.FillEllipse(headCenterX + dir * scale * 0.14f, headCenterY - headRadius * 0.68f, sparkleR, sparkleR, 250, 204, 21, 0.92f);
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
        else if (emo == "scared")
        {
            canvas.FillEllipse(mouthX, mouthY, scale * 0.020f, scale * 0.024f, 128, 26, 36, 0.95f);
        }
        else
        {
            var smirkLift = emo is "proud" or "smug" or "happy" or "laughing" ? scale * 0.014f : scale * 0.007f;
            canvas.DrawGlowLine(mouthX - scale * 0.026f, mouthY, mouthX + scale * 0.026f, mouthY - smirkLift,
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

    private static readonly string[] GoddessTokens =
        ["devi", "mata", "durga", "lakshmi", "laxmi", "saraswati", "parvati", "sita", "radha", "देवी", "माता", "दुर्गा", "लक्ष्मी", "सरस्वती", "पार्वती", "सीता", "राधा"];

    private static bool IsGoddessName(string name) =>
        GoddessTokens.Any(t => name.Contains(t, StringComparison.OrdinalIgnoreCase));

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
