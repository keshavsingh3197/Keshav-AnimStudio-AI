using System.Text.RegularExpressions;

namespace AnimStudio.Application.Transcripts.Parsing;

/// <summary>
/// Recognizes cues that describe sound rather than speech - "[MUSIC]", "(applause)".
/// These are kept on the transcript for audit but normally excluded from dialogue, since
/// putting them in a character's mouth reads as a mistake.
/// </summary>
public static partial class NonSpeechClassifier
{
    [GeneratedRegex(@"^\s*[\[\(\<][^\]\)\>]*[\]\)\>]\s*$",
        RegexOptions.CultureInvariant, matchTimeoutMilliseconds: 500)]
    private static partial Regex BracketedOnly();

    [GeneratedRegex(@"^\s*[♪♫\s]+$", RegexOptions.CultureInvariant, matchTimeoutMilliseconds: 500)]
    private static partial Regex MusicSymbolsOnly();

    public static bool IsNonSpeech(string text) =>
        text.Length > 0 && (BracketedOnly().IsMatch(text) || MusicSymbolsOnly().IsMatch(text));
}
