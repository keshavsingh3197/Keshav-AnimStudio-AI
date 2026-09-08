using AnimStudio.Application.Rendering.Models;

namespace AnimStudio.Infrastructure.Ffmpeg;

/// <summary>
/// Assembles the ffmpeg argument vector from a graph plan. Extracted so it can be
/// asserted as a list in tests, with no escaping guesswork and no shell involved.
/// </summary>
internal static class FfmpegArgumentBuilder
{
    /// <param name="graphFromFileOption">
    /// True to pass the graph with <c>-/filter_complex</c> (ffmpeg 7.0+), false for the
    /// older <c>-filter_complex_script</c>. Not a style choice: the old spelling was
    /// REMOVED in ffmpeg 8, so guessing wrong means every render fails with
    /// "Unrecognized option".
    /// </param>
    public static List<string> Build(
        FilterGraphPlan plan, string? filterScriptRelativePath, int threads,
        bool graphFromFileOption = true)
    {
        var arguments = new List<string>
        {
            // ffmpeg reads the parent's stdin unless told not to, which can hang a service.
            "-nostdin",
            "-hide_banner",
            "-loglevel", "error",
            "-y"
        };

        // Machine-readable progress on stdout beats scraping the human-readable stderr line.
        arguments.Add("-nostats");
        arguments.Add("-progress");
        arguments.Add("pipe:1");

        if (threads > 0)
        {
            arguments.Add("-threads");
            arguments.Add(threads.ToString(System.Globalization.CultureInfo.InvariantCulture));
        }

        foreach (var input in plan.Inputs)
        {
            arguments.AddRange(input.PreInputArguments);
            arguments.Add("-i");
            arguments.Add(input.RelativePath);
        }

        // Always a script file rather than an inline filtergraph: a merge of forty scenes
        // approaches the platform command-line limit, and having the exact graph on disk
        // next to the stderr log makes a failed job reproducible by hand.
        if (filterScriptRelativePath is not null && plan.FilterComplex.Length > 0)
        {
            arguments.Add(graphFromFileOption ? "-/filter_complex" : "-filter_complex_script");
            arguments.Add(filterScriptRelativePath);
        }

        arguments.AddRange(plan.OutputArguments);
        arguments.Add(plan.OutputRelativePath);

        return arguments;
    }
}
