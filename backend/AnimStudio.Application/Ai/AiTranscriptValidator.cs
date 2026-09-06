using System.Text;

namespace AnimStudio.Application.Ai;

/// <summary>
/// Checks and cleans a recognizer's output before it reaches <c>SubtitleParser</c>.
/// </summary>
/// <remarks>
/// <para>
/// This is the transcription counterpart of <see cref="AiImageValidator"/> and
/// <see cref="AiAudioValidator"/>: whatever a provider hands back is untrusted input,
/// whether it arrived as a process's stdout, a scratch file or an HTTP body. The parser
/// downstream is already hardened, but it is entitled to assume it was given text rather
/// than a JSON error page or a gigabyte of repeated tokens - which is what a recognizer
/// fed silence will happily produce.
/// </para>
/// <para>
/// Control characters are stripped rather than rejected. A subtitle file legitimately
/// carries newlines and tabs; everything else in that range is invisible, and an invisible
/// character in a cue is how a line renders as something other than what it reads as.
/// </para>
/// </remarks>
public static class AiTranscriptValidator
{
    /// <summary>
    /// Well past the longest real transcript - a three-hour SubRip file is a few hundred
    /// kilobytes - and far short of anything that could exhaust memory.
    /// </summary>
    public const int MaxCharacters = 4_000_000;

    public const string SubRip = "srt";
    public const string WebVtt = "vtt";
    public const string PlainText = "text";

    /// <summary>
    /// The cleaned transcript, or a coded failure. Never returns an empty string: a
    /// recognizer that produced nothing has failed, and passing "" down the chain would
    /// turn that into a project with a transcript of no cues.
    /// </summary>
    public static string Require(string? text, string providerId)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            throw new AiProviderException("empty-response",
                $"'{providerId}' returned no transcript.");
        }

        if (text.Length > MaxCharacters)
        {
            throw new AiProviderException("response-too-large",
                $"'{providerId}' returned more than the {MaxCharacters} characters allowed.");
        }

        var cleaned = Clean(text);

        if (cleaned.Length == 0)
        {
            throw new AiProviderException("empty-response",
                $"'{providerId}' returned a transcript with no readable text in it.");
        }

        return cleaned;
    }

    /// <summary>
    /// Names the subtitle format without parsing it, so the result can be handed to the
    /// parser with a hint rather than making it sniff a second time.
    /// </summary>
    public static string SniffFormat(string? text)
    {
        if (string.IsNullOrWhiteSpace(text)) return PlainText;

        var head = text.AsSpan(0, Math.Min(text.Length, 512)).TrimStart();

        if (head.StartsWith("WEBVTT", StringComparison.Ordinal)) return WebVtt;

        // "-->" is the one marker both timed formats share, and SubRip is what every
        // recognizer here emits, so its presence without a WEBVTT header settles it.
        return text.Contains("-->", StringComparison.Ordinal) ? SubRip : PlainText;
    }

    /// <summary>
    /// Strips the byte order mark and every control character except the two that carry
    /// meaning in a subtitle file, and normalises line endings so a cue's text does not
    /// depend on which platform the recognizer ran on.
    /// </summary>
    private static string Clean(string text)
    {
        var builder = new StringBuilder(text.Length);

        for (var i = 0; i < text.Length; i++)
        {
            var c = text[i];

            switch (c)
            {
                case '\uFEFF':
                    continue;

                case '\r':
                    // A CRLF pair collapses to one newline; a lone CR still ends a line,
                    // because an old recognizer writing classic Mac endings is not a reason
                    // to hand the parser one enormous cue.
                    if (i + 1 < text.Length && text[i + 1] == '\n') i++;
                    builder.Append('\n');
                    continue;

                case '\n':
                case '\t':
                    builder.Append(c);
                    continue;

                default:
                    if (!char.IsControl(c)) builder.Append(c);
                    continue;
            }
        }

        return builder.ToString().Trim();
    }
}
