namespace AnimStudio.Application.Scripts;

public static class SentenceBoundaryDetector
{
    // Includes the Devanagari danda, since Hindi transcripts are an expected input.
    private const string Terminators = ".!?।";

    public static bool EndsSentence(string text)
    {
        var trimmed = text.TrimEnd(' ', '"', '\'', ')', ']', '”', '’');
        return trimmed.Length > 0 && Terminators.Contains(trimmed[^1]);
    }
}
