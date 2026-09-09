using System.Globalization;
using System.Text;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Application.Common;
using AnimStudio.Application.Rendering;
using AnimStudio.Application.Security;
using AnimStudio.Domain.Rendering;

namespace AnimStudio.Application.Subtitles;

/// <summary>
/// SRT timestamps: "HH:MM:SS,mmm" - a comma decimal and millisecond precision, unlike ASS's
/// "H:MM:SS.cc" centiseconds.
/// </summary>
public static class SrtTimecode
{
    public static string Format(TimeSpan value)
    {
        if (value < TimeSpan.Zero) value = TimeSpan.Zero;

        var totalMs = (long)Math.Round(value.TotalMilliseconds);
        var ms = totalMs % 1000;
        var totalSeconds = totalMs / 1000;
        var seconds = totalSeconds % 60;
        var minutes = totalSeconds / 60 % 60;
        var hours = totalSeconds / 3600;

        return string.Create(CultureInfo.InvariantCulture,
            $"{hours:D2}:{minutes:D2}:{seconds:D2},{ms:D3}");
    }
}

/// <summary>
/// Exports a project's scenes as one project-wide .srt file - the same dialogue the render
/// burns in, as a sidecar anyone can hand to a player or a platform.
/// <para>
/// Timing mirrors the merge exactly. Each scene's dialogue is relative to ITS OWN start, and
/// consecutive scenes overlap by their transition length when joined - so a scene's absolute
/// start on the finished timeline is the same cumulative-length-minus-transitions offset the
/// renderer itself uses, not just the sum of the durations before it.
/// </para>
/// </summary>
public sealed class SceneSubtitleExportService(
    IProjectRepository projects,
    ISceneRepository scenes,
    ICurrentUser currentUser)
{
    public async Task<string> ExportAsync(string projectId, CancellationToken ct)
    {
        var project = await projects.GetAsync(projectId, ct).ConfigureAwait(false)
            ?? throw new KeyNotFoundException();

        if (!string.Equals(project.UserId, currentUser.UserId, StringComparison.Ordinal))
            throw new UnauthorizedAccessException();

        var sceneList = await scenes.ListByProjectAsync(projectId, ct).ConfigureAwait(false);

        if (sceneList.Count == 0)
        {
            throw EditingException.Invalid("no-scenes",
                "This project has no scenes to export subtitles from.");
        }

        var rate = project.Settings.ToCanvas().FrameRate;

        var lengths = sceneList.Select(s => s.Duration).ToList();
        var transitions = sceneList
            .Take(Math.Max(sceneList.Count - 1, 0))
            .Select(s => s.Transition.IsCut ? FrameCount.Zero : s.Transition.Duration)
            .ToList();

        // Scene 0 starts at zero; every scene after that starts where its predecessor's
        // xfade begins blending in - exactly RenderTimeline's own offsets.
        var starts = new FrameCount[sceneList.Count];
        if (sceneList.Count > 1)
        {
            var offsets = RenderTimeline.XfadeOffsets(lengths, transitions);
            for (var i = 1; i < sceneList.Count; i++) starts[i] = offsets[i - 1];
        }

        var builder = new StringBuilder();
        var cueNumber = 1;

        for (var i = 0; i < sceneList.Count; i++)
        {
            foreach (var line in sceneList[i].Dialogue.OrderBy(l => l.RelativeStartFrame))
            {
                var text = line.Text.Trim();
                if (text.Length == 0) continue;

                var start = new FrameCount(starts[i].Value + line.RelativeStartFrame).ToTimeSpan(rate);
                var end = new FrameCount(starts[i].Value + line.RelativeEndFrame).ToTimeSpan(rate);

                builder.Append(cueNumber++).Append('\n')
                       .Append(SrtTimecode.Format(start)).Append(" --> ").Append(SrtTimecode.Format(end))
                       .Append('\n')
                       .Append(text).Append("\n\n");
            }
        }

        if (cueNumber == 1)
        {
            throw EditingException.Invalid("no-dialogue",
                "None of this project's scenes have any dialogue yet.");
        }

        return builder.ToString();
    }
}
