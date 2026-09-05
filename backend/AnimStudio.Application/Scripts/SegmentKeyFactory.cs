using System.Security.Cryptography;
using System.Text;

namespace AnimStudio.Application.Scripts;

/// <summary>
/// Builds the stable identity of a segment.
/// <para>
/// Timing is deliberately EXCLUDED from the key. If the key depended on timing, a caption
/// fix that shifted everything by 200ms would orphan every scene and throw away every
/// manual edit - turning a re-ingest from a useful diff into a data-loss event.
/// </para>
/// </summary>
public static class SegmentKeyFactory
{
    public static string Create(string normalizedText, IEnumerable<string> speakerKeys, int duplicateOrdinal)
    {
        var payload = $"{normalizedText}|{string.Join(">", speakerKeys)}";
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(payload));
        var key = Convert.ToHexStringLower(hash)[..16];

        // A chorus or catchphrase can legitimately repeat within one script.
        return duplicateOrdinal == 0 ? key : $"{key}+{duplicateOrdinal}";
    }

    /// <summary>Text form used for the key: case- and whitespace-insensitive.</summary>
    public static string NormalizeText(string text) =>
        string.Join(' ', text.ToLowerInvariant().Split(' ', StringSplitOptions.RemoveEmptyEntries));
}
