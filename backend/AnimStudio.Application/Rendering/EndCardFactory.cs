using System.Globalization;
using AnimStudio.Application.Abstractions.Storage;
using AnimStudio.Application.Rendering.Models;
using AnimStudio.Domain.Rendering;

namespace AnimStudio.Application.Rendering;

/// <summary>
/// Turns a <see cref="OutroKind.Card"/> outro into a clip plan. Shared by the export,
/// which appends the card to the stitched video, and the standalone preview, which
/// renders the card alone - so the downloadable card is exactly the one exports end with.
/// </summary>
public static class EndCardFactory
{
    /// <summary>Warning recorded when some of the card's text could not be drawn on this host.</summary>
    public const string TextUnavailableWarning = "ENDCARD_TEXT_UNAVAILABLE";

    private enum Role { Headline, HeadlineSecondary, Subtext, SubtextSecondary }

    /// <summary>One line before layout: its text, its file in the workspace and its font.</summary>
    public sealed record LineInput(string Text, string RelativePath, string FontFilePath, bool AboveCode, bool Secondary);

    /// <summary>
    /// Writes the card's texts into the workspace and returns the plan to render.
    /// </summary>
    /// <param name="qrRelativePath">The QR image, already in the workspace, or null for a text-only card.</param>
    /// <param name="fontForText">
    /// A font file that can draw the given text, or null when this host has none - that line
    /// is then left off with a warning rather than drawn as a row of boxes.
    /// </param>
    public static async Task<ClipRenderPlan> PrepareAsync(
        IRenderWorkspace workspace, OutroSettings card, Canvas canvas, string? qrRelativePath,
        Func<string, string?>? fontForText, EncoderProfile encoder, int clipIndex, string outputRelativePath,
        ICollection<string> warnings, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(workspace);
        ArgumentNullException.ThrowIfNull(card);

        var lines = new List<LineInput>();
        var missing = false;

        foreach (var (text, role) in new[]
                 {
                     (card.Headline, Role.Headline), (card.HeadlineSecondary, Role.HeadlineSecondary),
                     (card.Subtext, Role.Subtext), (card.SubtextSecondary, Role.SubtextSecondary)
                 })
        {
            if (string.IsNullOrWhiteSpace(text)) continue;

            var font = fontForText?.Invoke(text);
            if (string.IsNullOrEmpty(font) || !File.Exists(font))
            {
                missing = true;
                continue;
            }

            var path = $"wm/endcard_{role.ToString().ToLowerInvariant()}.txt";
            await workspace.WriteTextAsync(path, text, ct).ConfigureAwait(false);
            lines.Add(new LineInput(text, path, font,
                AboveCode: role is Role.Headline or Role.HeadlineSecondary,
                Secondary: role is Role.HeadlineSecondary or Role.SubtextSecondary));
        }

        if (missing) warnings.Add(TextUnavailableWarning);

        var fade = card.Transition != SceneTransition.None
            ? Math.Min(card.TransitionDurationFrames / canvas.FrameRate.AsDouble, card.DurationSeconds / 2)
            : 0;

        return new ClipRenderPlan
        {
            ClipIndex = clipIndex,
            // Unused for a card - the graph draws from a colour source - but required.
            SourceRelativePath = qrRelativePath ?? string.Empty,
            Canvas = canvas,
            OutputRelativePath = outputRelativePath,
            ExpectedFrames = new FrameCount(
                (int)Math.Max(1, Math.Round(card.DurationSeconds * canvas.FrameRate.AsDouble))),
            SourceIsImage = true,
            ImageDurationSeconds = card.DurationSeconds,
            SourceHasAudio = false,
            Encoder = encoder,
            EndCard = Layout(card, canvas, qrRelativePath, lines) with
            {
                FadeInSeconds = fade,
                Animate = card.Animation == EndCardAnimation.Rise
            }
        };
    }

    /// <summary>
    /// Stacks the lines above the code, the code, and the lines below it, centred as one
    /// block. Sized from the SHORT side, so the same card reads the same on a 16:9 video
    /// and a 9:16 Short. A second-language line sits tight under its partner, smaller and
    /// slightly softer - one bilingual line, not two competing ones.
    /// </summary>
    public static EndCardPlan Layout(
        OutroSettings card, Canvas canvas, string? qrRelativePath, IReadOnlyList<LineInput> lines)
    {
        var (w, h) = (canvas.Width, canvas.Height);
        var shortSide = Math.Min(w, h);
        var gap = (int)Math.Round(shortSide * 0.045);
        var pairGap = (int)Math.Round(shortSide * 0.014);

        // Large enough to scan from a phone held at a TV's distance; the white square
        // includes the quiet zone a scanner needs, whatever the background colour is.
        // A portrait canvas has height to spare, so its code takes more of the width.
        var box = qrRelativePath is null ? 0 : Even(shortSide * (h > w ? 0.62 : 0.46));
        var quiet = box == 0 ? 0 : Math.Max(4, (int)Math.Round(box * 0.07));

        int SizeOf(LineInput line)
        {
            var preferred = (line.AboveCode, line.Secondary) switch
            {
                (true, false) => 0.068,
                (true, true) => 0.05,
                (false, false) => 0.042,
                _ => 0.036
            };
            return FontFor(line.Text, shortSide * preferred, w);
        }

        // A translation never outranks its original: each fits the width on its own, which
        // can leave a short Hindi line larger than a long English one above it.
        List<(LineInput Line, int Size)> Group(bool aboveCode)
        {
            var group = lines.Where(l => l.AboveCode == aboveCode).Select(l => (Line: l, Size: SizeOf(l))).ToList();
            var primary = group.FirstOrDefault(g => !g.Line.Secondary);
            if (primary.Line is null) return group;

            var cap = (int)Math.Round(primary.Size * 0.8);
            return [.. group.Select(g => g.Line.Secondary ? (g.Line, Math.Max(12, Math.Min(g.Size, cap))) : g)];
        }

        var above = Group(aboveCode: true);
        var below = Group(aboveCode: false);

        static int GroupHeight(List<(LineInput Line, int Size)> group, int pairGap) =>
            group.Sum(g => g.Size) + pairGap * Math.Max(0, group.Count - 1);

        var blocks = new[] { GroupHeight(above, pairGap), box, GroupHeight(below, pairGap) }
            .Where(x => x > 0).ToList();
        var y = (h - (blocks.Sum() + gap * Math.Max(0, blocks.Count - 1))) / 2;

        var placed = new List<EndCardLine>();
        void Place(List<(LineInput Line, int Size)> group)
        {
            if (group.Count == 0) return;
            foreach (var (line, size) in group)
            {
                placed.Add(new EndCardLine(line.RelativePath, y, size, line.FontFilePath, line.Secondary ? 0.85 : 1.0));
                y += size + pairGap;
            }
            y += gap - pairGap;
        }

        Place(above);
        var boxY = y;
        if (box > 0) y += box + gap;
        Place(below);

        return new EndCardPlan(
            Rgb(card.BackgroundHex, "101828"), Rgb(card.TextHex, "FFFFFF"),
            qrRelativePath,
            (w - box) / 2, boxY, box, box - 2 * quiet,
            placed);
    }

    /// <summary>
    /// The preferred size, or smaller when the line would overrun 90% of the width. An
    /// average Latin glyph is taken as 0.55 of the font size; Indic, Arabic, Thai and CJK
    /// glyphs run wider, measured at about 0.7 in Nirmala UI. Counted in text elements, so
    /// a Hindi vowel sign riding on its consonant is not charged as a letter of its own.
    /// </summary>
    private static int FontFor(string text, double preferred, int width)
    {
        var length = Math.Max(1, new StringInfo(text).LengthInTextElements);
        var glyph = text.Any(c => c >= 'ऀ') ? 0.7 : 0.55;
        var fitting = width * 0.9 / (glyph * length);
        return Math.Max(12, (int)Math.Round(Math.Min(preferred, fitting)));
    }

    private static int Even(double value) => (int)Math.Round(value / 2) * 2;

    private static string Rgb(string? hex, string fallback) =>
        OutroSettings.IsHexColor(hex) ? hex![1..].ToUpperInvariant() : fallback;
}
