using System.Globalization;
using AnimStudio.Domain.Assets;
using AnimStudio.Domain.Jobs;
using AnimStudio.Domain.Rendering;

namespace AnimStudio.Application.Clips;

/// <summary>What the band above the footage asks or says.</summary>
public enum AutoShortTopMode
{
    None = 0,

    /// <summary>One of the batch's lines, held for the whole short.</summary>
    Hook = 1,

    /// <summary>A quick question - the creator's own, or a sum made up for the short - answered in the last seconds.</summary>
    Quiz = 2,

    /// <summary>"Which one is the funniest?" over numbered parts, so viewers answer in the comments.</summary>
    Poll = 3,

    /// <summary>Each short draws a different one of the above that suits it.</summary>
    Auto = 4
}

/// <summary>The language of the words the packager writes itself (questions, calls to action, part labels).</summary>
public enum AutoShortLanguage
{
    English = 0,
    Hindi = 1,

    /// <summary>Every short is made twice, once in each language, from the same cut.</summary>
    Both = 2
}

/// <summary>How each numbered part is labelled.</summary>
public enum AutoShortPartLabel
{
    /// <summary>"#1".</summary>
    Number = 0,

    /// <summary>"LEVEL 1" / "लेवल 1".</summary>
    Level = 1,

    /// <summary>"PART 1" / "भाग 1".</summary>
    Part = 2
}

/// <summary>A reaction picture or clip the packager may pop over the footage.</summary>
public sealed record AutoShortMeme(string AssetId, AssetKind Kind, double? DurationSeconds);

/// <summary>
/// The dressing around a short's footage: a designed band above and below it, an opening
/// title, numbered parts, a quiz or poll, a call to action and the odd meme. All of it is
/// ordinary timeline items, so nothing new is needed to render it.
/// </summary>
public sealed record AutoShortPackaging
{
    /// <summary>"none" leaves the footage as it is; "auto" gives each short a different design; else a design id.</summary>
    public string Design { get; init; } = "none";

    public AutoShortTopMode Top { get; init; }
    public AutoShortLanguage Language { get; init; }

    /// <summary>Shown over the first seconds, above the footage. Empty for none.</summary>
    public string? Title { get; init; }

    /// <summary>Badge each part with its number, for compilations.</summary>
    public bool NumberParts { get; init; }
    public AutoShortPartLabel PartLabel { get; init; }

    /// <summary>Count the parts down (3, 2, 1) so the best one lands last.</summary>
    public bool CountDown { get; init; }

    /// <summary>A line under the footage asking viewers to comment, follow or share.</summary>
    public bool CallToAction { get; init; }

    /// <summary>The creator's own call to action; empty writes one that suits the short.</summary>
    public string? CallToActionText { get; init; }

    /// <summary>"@name", shown under the footage when there is one.</summary>
    public string? ChannelHandle { get; init; }

    /// <summary>The creator's own questions, each "question | answer".</summary>
    public IReadOnlyList<string> QuizLines { get; init; } = [];

    public IReadOnlyList<AutoShortMeme> Memes { get; init; } = [];

    /// <summary>Memes per short; 0 for none. Long shorts get one more per 20 seconds, up to this.</summary>
    public int MemesPerShort { get; init; }

    public bool IsEmpty =>
        Design == "none" && Top == AutoShortTopMode.None && string.IsNullOrWhiteSpace(Title) && !NumberParts
        && !CallToAction && string.IsNullOrWhiteSpace(ChannelHandle) && (Memes.Count == 0 || MemesPerShort <= 0);
}

/// <summary>
/// Adds the packaging to one planned short. Pure, like <see cref="AutoShortPlanner"/>: all
/// chance comes from the <see cref="Random"/> it is handed, so a short and its other-language
/// twin, given equal seeds, get the same design, question and meme spots.
/// </summary>
public static class AutoShortPackager
{
    public const int MaxTitleLength = 80;
    public const int MaxCallToActionLength = 80;
    public const int MaxQuizLines = 50;
    public const int MaxMemes = 30;
    public const int MaxMemesPerShort = 3;

    /// <summary>Where each band sits, in percent of the frame height.</summary>
    private const double TopY = 9;
    private const double BadgeY = 21;
    private const double BottomY = 90;
    private const double MemeY = 50;

    private const double TitleSeconds = 2.2;
    private const double BadgeSeconds = 1.6;
    private const double MaxMemeSeconds = 2.5;
    private const double MinMemeSeconds = 1.2;

    /// <summary>A whole look: the bar colour and the top, bottom and badge plates.</summary>
    public sealed record Design(
        string Id, string? BarColor,
        string TopColor, string TopBox, string TopBoxColor, string? TopOutline,
        string BottomColor, string BottomBox, string BottomBoxColor,
        string BadgeColor, string BadgeBoxColor, string Accent);

    /// <summary>
    /// The editor's frame designs, plus louder ones for comedy and quizzes. Kept in step with
    /// FRAME_DESIGNS in the studio's text-overlay-layout.ts by id.
    /// </summary>
    public static readonly IReadOnlyList<Design> Designs =
    [
        new("cosmic-glass", "#070b19", "#f8fafc", "box", "#0f172a", "#38bdf8", "#0f172a", "box", "#facc15", "#0f172a", "#facc15", "#facc15"),
        new("gold-report", "#0c0a09", "#fef08a", "band", "#1c1917", "#ca8a04", "#fafaf9", "box", "#292524", "#1c1917", "#facc15", "#facc15"),
        new("midnight", "#0f172a", "#ffffff", "none", "#0f172a", null, "#facc15", "none", "#0f172a", "#0f172a", "#ffffff", "#facc15"),
        new("headline", "#000000", "#ffffff", "band", "#e11d48", null, "#ffffff", "none", "#000000", "#ffffff", "#e11d48", "#facc15"),
        new("meme", "#ffffff", "#000000", "none", "#ffffff", null, "#000000", "none", "#ffffff", "#ffffff", "#000000", "#e11d48"),
        new("podcast", "#1e1b4b", "#ffffff", "box", "#7c3aed", null, "#c4b5fd", "none", "#1e1b4b", "#ffffff", "#7c3aed", "#c4b5fd"),
        new("sunset", "#ea580c", "#ffffff", "none", "#ea580c", "#7c2d12", "#fff7ed", "none", "#ea580c", "#ea580c", "#fff7ed", "#fde047"),
        new("blur", null, "#ffffff", "none", "#000000", "#000000", "#ffffff", "none", "#000000", "#111111", "#facc15", "#facc15"),
        new("comic", "#fde047", "#111111", "box", "#ffffff", null, "#ffffff", "box", "#111111", "#ffffff", "#e11d48", "#e11d48"),
        new("quiz-show", "#1d4ed8", "#ffffff", "box", "#0b1b4d", "#facc15", "#0b1b4d", "box", "#facc15", "#0b1b4d", "#facc15", "#facc15"),
        new("bubblegum", "#db2777", "#ffffff", "box", "#831843", null, "#831843", "box", "#fce7f3", "#ffffff", "#831843", "#fde047"),
        new("neon", "#05060f", "#22d3ee", "none", "#05060f", "#0b1020", "#a3e635", "none", "#05060f", "#05060f", "#22d3ee", "#a3e635"),
    ];

    public static Design? Find(string? id) =>
        Designs.FirstOrDefault(d => string.Equals(d.Id, id, StringComparison.OrdinalIgnoreCase));

    /// <summary>Accepts "none", "auto" and the known ids; anything else is treated as "none".</summary>
    public static string CleanDesignId(string? id) =>
        string.Equals(id, "auto", StringComparison.OrdinalIgnoreCase) ? "auto" : Find(id)?.Id ?? "none";

    /// <summary>
    /// The short with its packaging: <paramref name="command"/>'s V1 shots and text untouched,
    /// the bands, badges and memes added, and the bars coloured when the design has a colour.
    /// </summary>
    public static ClipMergeCommand Apply(
        ClipMergeCommand command, AutoShortPackaging packaging, Design? design, AutoShortTopMode top,
        AutoShortLanguage language, string? hook, Random random)
    {
        ArgumentNullException.ThrowIfNull(command);
        ArgumentNullException.ThrowIfNull(packaging);
        var hi = language == AutoShortLanguage.Hindi;
        var items = (command.TimelineItems ?? []).ToList();
        var shots = items.Where(i => i.TrackId == "V1").OrderBy(i => i.StartTime).ToList();
        var total = Round(shots.Sum(s => s.Duration));
        if (shots.Count == 0 || total < 1) return command;

        // The band owns the top: an older hook line there would sit under it.
        if (top != AutoShortTopMode.None) items.RemoveAll(i => i.Id == "auto_hook");

        var parts = PartsOf(shots);
        var numbered = packaging.NumberParts && parts.Count >= 2;

        // --- top band ---
        var title = AutoShortPlanner.CleanLine(packaging.Title);
        if (title.Length > MaxTitleLength) title = title[..MaxTitleLength].TrimEnd();
        var titleEnd = title.Length > 0 ? Round(Math.Min(TitleSeconds, total * 0.3)) : 0;
        if (title.Length > 0)
            items.Add(Text("pkg_title", "Title", title, 0, titleEnd, TopStyle(design, 30, "zoom", "fade")));

        var bandStart = titleEnd;
        var bandLength = Round(total - bandStart);
        string? bottomLine = null;
        if (bandLength >= 1.5)
        {
            switch (top)
            {
                case AutoShortTopMode.Hook when !string.IsNullOrEmpty(hook):
                    items.Add(Text("pkg_top", "Hook", hook, bandStart, bandLength, TopStyle(design, 26, "slide-down", "fade")));
                    break;

                case AutoShortTopMode.Poll when parts.Count >= 2:
                    items.Add(Text("pkg_top", "Poll",
                        hi ? $"सबसे मज़ेदार कौन सा? 1-{parts.Count}" : $"Which one is the funniest? 1-{parts.Count}",
                        bandStart, bandLength, TopStyle(design, 26, "slide-down", "fade")));
                    bottomLine = hi ? "अपना फेवरेट नंबर कमेंट करो!" : "Comment your favourite number!";
                    break;

                case AutoShortTopMode.Quiz:
                    var (question, answer) = QuizFor(packaging.QuizLines, random, hi);
                    var reveal = Round(Math.Clamp(total * 0.2, 1.5, 3.0));
                    var asking = Round(bandLength - reveal);
                    if (asking >= 1.5)
                    {
                        items.Add(Text("pkg_top", "Quiz", question, bandStart, asking, TopStyle(design, 26, "slide-down", "fade")));
                        items.Add(Text("pkg_answer", "Answer", (hi ? "जवाब: " : "Answer: ") + answer,
                            Round(bandStart + asking), reveal, TopStyle(design, 28, "zoom", "none", accent: true)));
                    }
                    else
                    {
                        items.Add(Text("pkg_top", "Quiz", question, bandStart, bandLength, TopStyle(design, 26, "slide-down", "fade")));
                    }
                    bottomLine = hi ? "जवाब आने से पहले कमेंट करो!" : "Comment your answer before it shows!";
                    break;
            }
        }

        // --- numbered parts ---
        if (numbered)
        {
            for (var k = 0; k < parts.Count; k++)
            {
                var number = packaging.CountDown ? parts.Count - k : k + 1;
                var shot = parts[k];
                var length = Round(Math.Min(BadgeSeconds, shot.Duration * 0.8));
                if (length < 0.5) continue;
                items.Add(Text($"pkg_part_{k}", "Part", PartLabel(packaging.PartLabel, number, hi),
                    shot.StartTime, length, BadgeStyle(design)));
            }
        }

        // --- bottom band ---
        var handle = CleanHandle(packaging.ChannelHandle);
        if (packaging.CallToAction || handle is not null)
        {
            var own = AutoShortPlanner.CleanLine(packaging.CallToActionText);
            if (own.Length > MaxCallToActionLength) own = own[..MaxCallToActionLength].TrimEnd();
            var ask = packaging.CallToAction
                ? own.Length > 0 ? own
                  : bottomLine ?? (numbered
                      ? hi ? "सबसे मज़ेदार नंबर कमेंट करो!" : "Comment the funniest number!"
                      : hi ? "लाइक करो और दोस्तों को भेजो!" : "Like and send it to a friend!")
                : null;
            var follow = handle is null ? null : hi ? $"और मज़े के लिए फ़ॉलो करो {handle}" : $"Follow {handle} for more";

            if (ask is not null && follow is not null && total >= 6)
            {
                // The ask while the viewer is deciding, then who to follow as it ends.
                var split = Round(total * 0.6);
                items.Add(Text("pkg_bottom", "Call to action", ask, 0, split, BottomStyle(design, "slide-up", "fade")));
                items.Add(Text("pkg_follow", "Follow", follow, split, Round(total - split), BottomStyle(design, "slide-up", "fade")));
            }
            else if ((ask ?? follow) is { } line)
            {
                items.Add(Text("pkg_bottom", "Call to action", line, 0, total, BottomStyle(design, "slide-up", "fade")));
            }
        }

        // --- memes ---
        items.AddRange(MemeItems(packaging, shots, total, titleEnd, random));

        var bars = design?.BarColor;
        return command with
        {
            TimelineItems = items,
            // Coloured bars need room to show: the footage fits inside the frame rather than filling it.
            Fit = bars is not null ? ClipFit.Contain : command.Fit,
            BackgroundColor = bars ?? command.BackgroundColor,
        };
    }

    /// <summary>
    /// The parts a viewer would number: the videos when the short has more than one, else every shot.
    /// </summary>
    private static List<TimelineItemSpec> PartsOf(List<TimelineItemSpec> shots)
    {
        var videos = shots.Where(s => s.Type == "video").ToList();
        return videos.Count >= 2 ? videos : shots;
    }

    public static string PartLabel(AutoShortPartLabel label, int number, bool hindi) => label switch
    {
        AutoShortPartLabel.Level => (hindi ? "लेवल " : "LEVEL ") + number.ToString(CultureInfo.InvariantCulture),
        AutoShortPartLabel.Part => (hindi ? "भाग " : "PART ") + number.ToString(CultureInfo.InvariantCulture),
        _ => "#" + number.ToString(CultureInfo.InvariantCulture),
    };

    /// <summary>"@name" from what the creator typed, or null when it is not a plausible handle.</summary>
    public static string? CleanHandle(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return null;
        var name = raw.Trim().TrimStart('@');
        if (name.Length is 0 or > 40 || !name.All(c => char.IsAsciiLetterOrDigit(c) || c is '.' or '_' or '-')) return null;
        return "@" + name;
    }

    /// <summary>
    /// One of the creator's "question | answer" lines, or a quick sum made up for the short:
    /// easy enough to answer in the time it is on screen, varied enough that a batch doesn't repeat.
    /// </summary>
    public static (string Question, string Answer) QuizFor(IReadOnlyList<string> own, Random random, bool hindi)
    {
        var usable = own
            .Select(l => l.Split('|', 2))
            .Where(p => p.Length == 2)
            .Select(p => (Q: AutoShortPlanner.CleanLine(p[0]), A: AutoShortPlanner.CleanLine(p[1])))
            .Where(p => p.Q.Length > 0 && p.A.Length > 0)
            .ToList();
        if (usable.Count > 0) return usable[random.Next(usable.Count)];

        var lead = hindi ? "जल्दी बताओ! " : "Quick! ";
        switch (random.Next(5))
        {
            case 0:
            {
                var a = random.Next(12, 60);
                var b = random.Next(11, 40);
                return ($"{lead}{a} + {b} = ?", (a + b).ToString(CultureInfo.InvariantCulture));
            }
            case 1:
            {
                var a = random.Next(3, 13);
                var b = random.Next(3, 13);
                return ($"{lead}{a} x {b} = ?", (a * b).ToString(CultureInfo.InvariantCulture));
            }
            case 2:
            {
                var a = random.Next(40, 100);
                var b = random.Next(11, a - 5);
                return ($"{lead}{a} - {b} = ?", (a - b).ToString(CultureInfo.InvariantCulture));
            }
            case 3:
            {
                // Most people add first; the answer rewards the ones who don't.
                var a = random.Next(2, 10);
                var b = random.Next(2, 10);
                var c = random.Next(2, 6);
                var q = hindi ? $"99% लोग गलत करते हैं: {a} + {b} x {c} = ?" : $"Most people get this wrong: {a} + {b} x {c} = ?";
                return (q, (a + b * c).ToString(CultureInfo.InvariantCulture));
            }
            default:
            {
                var start = random.Next(1, 6);
                var step = random.Next(2, 4);
                var seq = Enumerable.Range(0, 4).Select(i => start * (int)Math.Pow(step, i)).ToList();
                var q = (hindi ? "अगला नंबर? " : "What comes next? ") + string.Join(", ", seq) + ", ?";
                return (q, (seq[^1] * step).ToString(CultureInfo.InvariantCulture));
            }
        }
    }

    /// <summary>
    /// Memes spaced through the short, clear of the title and the last second, each popping in
    /// over the middle of the frame for a moment. A picture is drawn on IMG1, a clip plays on V3.
    /// </summary>
    private static IEnumerable<TimelineItemSpec> MemeItems(
        AutoShortPackaging packaging, List<TimelineItemSpec> shots, double total, double titleEnd, Random random)
    {
        var memes = packaging.Memes.Where(m => m.Kind is AssetKind.Image or AssetKind.Video).ToList();
        if (memes.Count == 0 || packaging.MemesPerShort <= 0) yield break;

        var wanted = Math.Min(Math.Clamp(packaging.MemesPerShort, 0, MaxMemesPerShort), 1 + (int)(total / 20));
        var window = total - titleEnd - 1.0;
        if (wanted <= 0 || window < MinMemeSeconds * 2) yield break;

        var order = memes.OrderBy(_ => random.Next()).ToList();
        for (var n = 0; n < wanted; n++)
        {
            var meme = order[n % order.Count];
            var length = meme.Kind == AssetKind.Video && meme.DurationSeconds is > 0
                ? Math.Clamp(meme.DurationSeconds.Value, MinMemeSeconds, MaxMemeSeconds)
                : 1.8;
            // Evenly through the short, nudged a little so a batch doesn't pop on the same beat.
            var centre = titleEnd + window * (n + 1) / (wanted + 1) + (random.NextDouble() - 0.5) * 0.8;
            var start = Round(Math.Clamp(centre - length / 2, titleEnd, total - 1.0 - length));
            if (start < 0 || start + length > total) continue;

            var video = meme.Kind == AssetKind.Video;
            yield return new TimelineItemSpec
            {
                Id = $"pkg_meme_{n}",
                Type = video ? "video" : "image",
                TrackId = video ? "V3" : "IMG1",
                StartTime = start,
                Duration = Round(length),
                Src = meme.AssetId,
                Name = "Meme",
                TrimStartSeconds = video ? 0 : null,
                TrimEndSeconds = video ? Round(length) : null,
                Transform = new TimelineItemTransformSpec
                {
                    Scale = 1,
                    WidthPercent = Round(38 + random.NextDouble() * 10),
                    X = Round((random.NextDouble() - 0.5) * 16),
                    Y = MemeY - 50,
                    Rotation = Round((random.NextDouble() - 0.5) * 8),
                    Shape = "rounded",
                    BorderWidth = 3,
                    BorderColor = "#ffffff",
                    TransitionIn = "zoom", TransitionInDuration = 0.15,
                    TransitionOut = "fade", TransitionOutDuration = 0.2,
                },
            };
        }
    }

    private static TimelineItemSpec Text(string id, string name, string text, double start, double duration, TimelineItemTextStyleSpec style) => new()
    {
        Id = id,
        Type = "text",
        TrackId = "TXT1",
        StartTime = Round(start),
        Duration = Round(duration),
        Src = text,
        Name = name,
        TextStyle = style,
    };

    private static TimelineItemTextStyleSpec TopStyle(Design? d, double size, string animIn, string animOut, bool accent = false) => new()
    {
        FontSize = size,
        Color = accent ? d?.BadgeColor ?? "#111111" : d?.TopColor ?? "#ffffff",
        AccentColor = d?.Accent ?? "#facc15",
        Position = "custom", X = 50, Y = TopY,
        BoxStyle = accent ? "box" : d?.TopBox ?? "box",
        BoxColor = accent ? d?.BadgeBoxColor ?? "#facc15" : d?.TopBoxColor ?? "#000000",
        BoxOpacity = accent ? 0.98 : d is null ? 0.6 : 0.92,
        OutlineColor = d?.TopOutline ?? "#000000",
        OutlineWidth = d?.TopOutline is null && d is not null ? 0 : 1.5,
        Shadow = true,
        Uppercase = false,
        TransitionIn = animIn, TransitionInDuration = 0.3,
        TransitionOut = animOut, TransitionOutDuration = animOut == "none" ? 0 : 0.25,
    };

    private static TimelineItemTextStyleSpec BottomStyle(Design? d, string animIn, string animOut) => new()
    {
        FontSize = 20,
        Color = d?.BottomColor ?? "#ffffff",
        AccentColor = d?.Accent ?? "#facc15",
        Position = "custom", X = 50, Y = BottomY,
        BoxStyle = d?.BottomBox ?? "box",
        BoxColor = d?.BottomBoxColor ?? "#000000",
        BoxOpacity = d is null ? 0.6 : 0.92,
        OutlineColor = "#000000",
        OutlineWidth = d?.BottomBox is "none" && d.BarColor is null ? 2 : 0,
        Shadow = true,
        Uppercase = false,
        TransitionIn = animIn, TransitionInDuration = 0.3,
        TransitionOut = animOut, TransitionOutDuration = 0.25,
    };

    private static TimelineItemTextStyleSpec BadgeStyle(Design? d) => new()
    {
        FontSize = 34,
        Color = d?.BadgeColor ?? "#111111",
        Position = "custom", X = 50, Y = BadgeY,
        BoxStyle = "box",
        BoxColor = d?.BadgeBoxColor ?? "#facc15",
        BoxOpacity = 0.98,
        OutlineColor = "#000000",
        OutlineWidth = 0,
        Shadow = true,
        Uppercase = true,
        TransitionIn = "zoom", TransitionInDuration = 0.12,
        TransitionOut = "fade", TransitionOutDuration = 0.2,
    };

    private static double Round(double v) => Math.Round(v, 2, MidpointRounding.AwayFromZero);
}
