using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using AnimStudio.Application.Abstractions.Persistence;
using AnimStudio.Domain.Publishing;
using Microsoft.Extensions.Logging;

namespace AnimStudio.Application.Publishing;

/// <summary>What a set of YouTube details is written from: the same input gives the same fingerprint.</summary>
public sealed record YouTubeSuggestionSource(string Summary, string Style, string Language, string? Tone, string Brief, string? TranscriptText)
{
    public string Fingerprint { get; } = YouTubeSuggestionLibrary.FingerprintOf(Summary, Style, Language, Tone, Brief, TranscriptText);

    public IReadOnlySet<string> Keywords { get; } =
        YouTubeSuggestionLibrary.KeywordsOf(string.Join('\n', Summary, Brief, TranscriptText ?? string.Empty));
}

/// <summary>What the library had for a video: details to use as they are, and titles from similar videos to offer.</summary>
/// <param name="Reused">Saved details for this video (or one very like it), given back instead of asking a model.</param>
/// <param name="Similarity">How alike the reused details' video is, 0-1; 1 for the same input.</param>
/// <param name="Titles">Titles written for similar earlier videos, most similar first.</param>
public sealed record YouTubeLibraryLookup(YouTubeSavedSuggestion? Reused, double Similarity, IReadOnlyList<string> Titles)
{
    public static readonly YouTubeLibraryLookup Empty = new(null, 0, []);
}

/// <summary>
/// Keeps the YouTube details a model writes, so asking again for the same video - or for another of the same kind, a
/// second Shiv bhajan a week after the first - is answered from the database instead of a model call. The first Suggest
/// for a video uses what is saved; asking for a new take always goes to the model, and its answer replaces the saved one.
/// </summary>
/// <remarks>
/// A saved answer is an optimisation, never a requirement: if the database cannot be read or written the details are
/// written by the model as before, and the failure is logged.
/// </remarks>
public sealed class YouTubeSuggestionLibrary(
    IYouTubeSavedSuggestionRepository repository,
    TimeProvider clock,
    ILogger<YouTubeSuggestionLibrary> logger)
{
    /// <summary>The engine id the response names when the details came from the library.</summary>
    public const string ProviderId = "saved-library";

    /// <summary>
    /// Videos this alike (shared words over all words, of the video's most frequent words) are treated as the same kind:
    /// their details are given back. High on purpose - a description about another story would be wrong for this one.
    /// </summary>
    public const double ReuseSimilarity = 0.6;

    /// <summary>Videos at least this alike have their titles offered as ideas.</summary>
    public const double OfferSimilarity = 0.2;

    public const int MaxOfferedTitles = 6;

    /// <summary>How many of the person's recent details are compared; older ones are not looked at.</summary>
    private const int Candidates = 200;

    private const int MaxKeywords = 60;
    private const int MaxSubjectChars = 200;
    private const int MaxTranscriptChars = 4000;

    /// <summary>
    /// Words that say nothing about what a video is about: common English and Hindi words, and the labels the summary
    /// is built with ("Project name:", "Chapters:"), which every summary shares.
    /// </summary>
    private static readonly HashSet<string> StopWords = new(StringComparer.Ordinal)
    {
        "the", "and", "for", "with", "this", "that", "from", "are", "was", "were", "you", "your", "our", "his", "her",
        "its", "they", "them", "has", "have", "had", "not", "but", "all", "who", "what", "when", "how", "into", "out",
        "about", "project", "name", "chapters", "clips", "shown", "order", "screen", "text", "scene", "only", "creator",
        "notes", "describe", "video", "videos", "an", "of", "to", "in", "on", "is", "it", "be", "by", "or", "as", "at",
        "और", "के", "की", "का", "है", "हैं", "में", "से", "को", "पर", "एक", "यह", "वह", "भी", "तो", "था", "थी", "थे",
        "ने", "कि", "जो", "ही", "नहीं", "हो", "कर", "करते", "किया", "लिए", "साथ", "अपने", "उनके", "उस", "इस",
    };

    /// <summary>
    /// Saved details for <paramref name="source"/> and titles from similar videos. With <paramref name="allowReuse"/> off
    /// (a new take) nothing is given back to use as it is; the titles are still offered.
    /// </summary>
    public async Task<YouTubeLibraryLookup> LookAsync(string? userId, YouTubeSuggestionSource source, bool allowReuse, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(userId)) return YouTubeLibraryLookup.Empty;

        try
        {
            var exact = allowReuse ? await repository.FindAsync(userId, source.Fingerprint, ct).ConfigureAwait(false) : null;
            var recent = await repository.ListRecentAsync(userId, source.Language, Candidates, ct).ConfigureAwait(false);

            var scored = recent
                .Where(s => s.Id != exact?.Id)
                .Select(s => (Saved: s, Score: Similarity(source.Keywords, s.Keywords)))
                .Where(x => x.Score >= OfferSimilarity)
                .OrderByDescending(x => x.Score)
                .ThenByDescending(x => x.Saved.CreatedAtUtc)
                .ToList();

            var reused = exact;
            var similarity = exact is null ? 0 : 1.0;
            if (allowReuse && reused is null && scored.FirstOrDefault() is { Score: >= ReuseSimilarity } best)
            {
                reused = best.Saved;
                similarity = best.Score;
                scored.RemoveAt(0);
            }

            var titles = scored
                .SelectMany(x => x.Saved.TitleOptions.Prepend(x.Saved.Title))
                .Where(t => !string.IsNullOrWhiteSpace(t))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .Take(MaxOfferedTitles)
                .ToList();

            if (reused is not null)
            {
                reused.Uses++;
                reused.LastUsedAtUtc = clock.GetUtcNow().UtcDateTime;
                await repository.UpsertAsync(reused, ct).ConfigureAwait(false);
                logger.LogInformation("Reused saved YouTube details {SuggestionId} (similarity {Similarity:0.00}) instead of a model call.",
                    reused.Id, similarity);
            }

            return new YouTubeLibraryLookup(reused, Math.Round(similarity, 2), titles);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning(ex, "Could not read the saved YouTube details; the model writes them instead.");
            return YouTubeLibraryLookup.Empty;
        }
    }

    /// <summary>Keeps what a model wrote for <paramref name="source"/>, replacing what was saved for the same input before.</summary>
    public async Task SaveAsync(string? userId, YouTubeSuggestionSource source, YouTubeMetadataSuggestion suggestion,
        string providerId, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(userId) || string.IsNullOrWhiteSpace(suggestion.Title)) return;

        try
        {
            var existing = await repository.FindAsync(userId, source.Fingerprint, ct).ConfigureAwait(false);
            var transcript = suggestion.TranscriptText ?? source.TranscriptText;
            var saved = new YouTubeSavedSuggestion
            {
                Id = existing?.Id ?? $"yss_{Guid.NewGuid():N}",
                UserId = userId,
                Fingerprint = source.Fingerprint,
                Keywords = [.. source.Keywords],
                Language = source.Language,
                Tone = source.Tone,
                Subject = SubjectOf(source.Summary),
                Title = suggestion.Title,
                Description = suggestion.Description,
                Tags = [.. suggestion.Tags],
                TitleOptions = [.. suggestion.TitleOptions],
                DescriptionOptions = [.. suggestion.DescriptionOptions],
                TagIdeas = [.. suggestion.TagIdeas],
                PinnedComment = suggestion.PinnedComment,
                EngagementComment = suggestion.EngagementComment,
                TranscriptText = transcript is { Length: > MaxTranscriptChars } ? transcript[..MaxTranscriptChars] : transcript,
                ProviderId = providerId,
                CreatedAtUtc = clock.GetUtcNow().UtcDateTime,
                Uses = existing?.Uses ?? 0,
                LastUsedAtUtc = existing?.LastUsedAtUtc
            };
            await repository.UpsertAsync(saved, ct).ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning(ex, "Could not save the YouTube details for later; they were still written.");
        }
    }

    /// <summary>Saved details in the shape a model's answer has, ready for the description to be composed for this video.</summary>
    public static YouTubeMetadataSuggestion ToSuggestion(YouTubeSavedSuggestion saved) =>
        new(saved.Title, saved.Description, saved.Tags)
        {
            TitleOptions = saved.TitleOptions,
            DescriptionOptions = saved.DescriptionOptions,
            TagIdeas = saved.TagIdeas,
            PinnedComment = saved.PinnedComment,
            EngagementComment = saved.EngagementComment,
            TranscriptText = saved.TranscriptText
        };

    public static string FingerprintOf(string summary, string style, string language, string? tone, string brief, string? transcript)
    {
        var payload = string.Join('\u001f', Normalize(summary), Normalize(style), language, tone ?? string.Empty,
            Normalize(brief), Normalize(transcript));
        return Convert.ToHexStringLower(SHA256.HashData(Encoding.UTF8.GetBytes(payload)));
    }

    /// <summary>
    /// The text's most frequent meaningful words, lower-cased. Devanagari vowel signs are marks, not letters, so they are
    /// kept inside a word rather than splitting it.
    /// </summary>
    public static IReadOnlySet<string> KeywordsOf(string? text)
    {
        if (string.IsNullOrWhiteSpace(text)) return new HashSet<string>(StringComparer.Ordinal);

        var counts = new Dictionary<string, int>(StringComparer.Ordinal);
        var word = new StringBuilder();

        void Flush()
        {
            if (word.Length >= 2)
            {
                var w = word.ToString().ToLowerInvariant();
                if (!StopWords.Contains(w) && !w.All(char.IsDigit)) counts[w] = counts.GetValueOrDefault(w) + 1;
            }
            word.Clear();
        }

        foreach (var c in text)
        {
            if (char.IsLetterOrDigit(c) || CharUnicodeInfo.GetUnicodeCategory(c) is UnicodeCategory.NonSpacingMark or UnicodeCategory.SpacingCombiningMark)
                word.Append(c);
            else
                Flush();
        }
        Flush();

        return counts
            .OrderByDescending(kv => kv.Value)
            .ThenBy(kv => kv.Key, StringComparer.Ordinal)
            .Take(MaxKeywords)
            .Select(kv => kv.Key)
            .ToHashSet(StringComparer.Ordinal);
    }

    /// <summary>Shared words over all words of the two (Jaccard), 0-1.</summary>
    public static double Similarity(IReadOnlySet<string> a, IEnumerable<string> b)
    {
        var other = b as IReadOnlySet<string> ?? b.ToHashSet(StringComparer.Ordinal);
        if (a.Count == 0 || other.Count == 0) return 0;

        var shared = a.Count(other.Contains);
        return (double)shared / (a.Count + other.Count - shared);
    }

    private static string Normalize(string? text) =>
        string.Join(' ', (text ?? string.Empty).Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries)).ToLowerInvariant();

    private static string SubjectOf(string summary)
    {
        var line = summary.Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).FirstOrDefault() ?? string.Empty;
        return line.Length > MaxSubjectChars ? line[..MaxSubjectChars] : line;
    }
}
