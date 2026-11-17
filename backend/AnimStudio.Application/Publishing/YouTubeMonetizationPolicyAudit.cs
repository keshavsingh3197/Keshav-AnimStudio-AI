using System.Text;
using System.Text.RegularExpressions;
using AnimStudio.Domain.Publishing;

namespace AnimStudio.Application.Publishing;

/// <summary>Snapshot of one video evaluated against YouTube's channel monetization policies (answer/1311392).</summary>
public sealed record YouTubePolicyVideoInput(
    string VideoId,
    string Title,
    string Description,
    IReadOnlyList<string> Tags,
    string? CategoryId,
    bool? MadeForKids,
    bool IsShort,
    DateTime? PublishedAtUtc,
    long? Views,
    string? Privacy,
    bool? InPlaylist = null,
    bool UploadedByApp = false,
    bool? ContainsSyntheticMedia = null);

/// <summary>
/// Pure rule-based auditor modeled on YouTube's official channel monetization policies
/// (<see href="https://support.google.com/youtube/answer/1311392?hl=en"/>).
/// Inspects title/description originality, metadata spam, top &amp; newest reviewer-focus videos, audience declaration,
/// and honestly separates what APIs can verify from what creators must check manually (e.g. mobile uploads outside the app).
/// </summary>
public static partial class YouTubeMonetizationPolicyAudit
{
    public const string OfficialPolicyUrl = "https://support.google.com/youtube/answer/1311392?hl=en";
    public const string DefaultYouTubeCategoryId = "22";

    public static YouTubeMonetizationAuditReport Analyze(
        IReadOnlyList<YouTubePolicyVideoInput> videos,
        bool? playlistsKnown = null)
    {
        var items = new List<YouTubePolicyFinding>();
        var total = videos.Count;
        var appCount = videos.Count(v => v.UploadedByApp);
        var mobileOrExternalCount = total - appCount;

        if (total == 0)
        {
            items.Add(new(
                "policy-no-videos",
                "verify",
                "Channel Review",
                "No uploads analysed yet",
                "Fetch or refresh your channel's videos first so titles, descriptions, audience declarations and reviewer focus uploads can be audited.",
                [
                    "Upload original videos or connect your channel and click Check / Refresh.",
                    $"Review YouTube's monetization standards at {OfficialPolicyUrl}."
                ]));
            return new(OfficialPolicyUrl, "NeedsAttention", 60, 0, 0, 0, items);
        }

        var perVideo = videos.Select(v => new
        {
            Video = v,
            Issues = YouTubeDetailsAudit.Check(new YouTubeDetailsFacts(
                v.Title, v.Description, v.Tags, v.InPlaylist, v.MadeForKids, v.IsShort)),
            TitleStem = NormalizeTemplateStem(v.Title),
            DescStem = NormalizeDescriptionSignature(v.Description)
        }).ToList();

        var score = 100;

        // 1. Inauthentic Content — Title uniqueness & filename/template risk
        var fileNameTitles = perVideo.Where(x => x.Issues.Any(i => i.Code == "title-default")).ToList();
        var duplicateTitleVideos = perVideo
            .Where(x => !string.IsNullOrWhiteSpace(x.TitleStem))
            .GroupBy(x => x.TitleStem, StringComparer.OrdinalIgnoreCase)
            .Where(g => g.Count() >= 2)
            .SelectMany(g => g)
            .ToList();

        if (fileNameTitles.Count > 0 || (total >= 3 && duplicateTitleVideos.Count * 5 >= total))
        {
            var combinedIds = fileNameTitles.Select(x => x.Video.VideoId)
                .Concat(duplicateTitleVideos.Select(x => x.Video.VideoId))
                .Distinct(StringComparer.Ordinal)
                .ToList();
            score -= Math.Min(22, combinedIds.Count * 4 + 6);
            var examples = string.Join("; ", perVideo
                .Where(x => combinedIds.Contains(x.Video.VideoId))
                .Take(3)
                .Select(x => $"\"{Truncate(x.Video.Title, 45)}\""));
            items.Add(new(
                "policy-inauthentic-titles",
                "wrong",
                "Inauthentic Content",
                $"{combinedIds.Count} upload(s) show repetitive template or default filename titles",
                $"Under YouTube's Inauthentic Content rule, mass-produced or near-identical titles ({examples}) make videos look automated or interchangeable — hurting both YPP review and Home/Browse CTR.",
                [
                    "Give each episode a distinct hook naming what specifically changes in that video (character, dilemma, fact, or twist).",
                    "Rename any file-name titles (VID_..., Short 1, .mp4) immediately in Details Checkup.",
                    "Keep the core promise inside the first 55 characters so mobile viewers don't only see repeated boilerplate."
                ],
                fileNameTitles.Count > 0 ? "title-default" : null,
                combinedIds));
        }
        else
        {
            items.Add(new(
                "policy-titles-unique",
                "good",
                "Inauthentic Content",
                "Titles look distinct and non-repetitive",
                $"Across {total} uploads, titles have strong topic variation with zero default filename placeholders.",
                [
                    "Keep leading every title with the unique story angle or question rather than a repeated template prefix."
                ]));
        }

        // 2. Description originality, no keyword/hashtag stuffing, broken links
        var missingDesc = perVideo.Where(x => x.Issues.Any(i => i.Code is "description-missing" or "description-short")).ToList();
        var spamMeta = perVideo.Where(x => x.Issues.Any(i => i.Code is "hashtag-stuffing" or "description-tag-stuffing")).ToList();
        var oldLinks = perVideo.Where(x => x.Issues.Any(i => i.Code == "channel-link-old")).ToList();
        var duplicateDescs = perVideo
            .Where(x => x.DescStem.Length >= 40)
            .GroupBy(x => x.DescStem, StringComparer.OrdinalIgnoreCase)
            .Where(g => g.Count() >= 3)
            .SelectMany(g => g)
            .ToList();

        if (missingDesc.Count > 0 || spamMeta.Count > 0 || duplicateDescs.Count > 0 || oldLinks.Count > 0)
        {
            var problemParts = new List<string>();
            if (missingDesc.Count > 0) problemParts.Add($"{missingDesc.Count} empty/one-line descriptions");
            if (duplicateDescs.Count > 0) problemParts.Add($"{duplicateDescs.Count} identical copy-pasted descriptions");
            if (spamMeta.Count > 0) problemParts.Add($"{spamMeta.Count} with >15 hashtags or keyword tag-dumps");
            if (oldLinks.Count > 0) problemParts.Add($"{oldLinks.Count} linking to retired channel URLs");

            score -= Math.Min(20, (missingDesc.Count > 0 ? 6 : 0) + (spamMeta.Count > 0 ? 10 : 0) + (duplicateDescs.Count > 0 ? 8 : 0) + (oldLinks.Count > 0 ? 5 : 0));
            var affected = missingDesc.Concat(spamMeta).Concat(duplicateDescs).Concat(oldLinks)
                .Select(x => x.Video.VideoId).Distinct(StringComparer.Ordinal).ToList();

            var issueCode = spamMeta.Any(x => x.Issues.Any(i => i.Code == "description-tag-stuffing")) ? "description-tag-stuffing"
                : spamMeta.Count > 0 ? "hashtag-stuffing"
                : oldLinks.Count > 0 ? "channel-link-old"
                : missingDesc.Any(x => x.Issues.Any(i => i.Code == "description-missing")) ? "description-missing"
                : "description-short";

            items.Add(new(
                "policy-metadata-quality",
                "wrong",
                "Metadata & Spam Policy",
                "Description issues found (" + string.Join(", ", problemParts) + ")",
                "YouTube rejects keyword stuffing inside descriptions and treats identical boilerplate across dozens of uploads as low-effort / inauthentic packaging.",
                [
                    "Write 2–3 unique sentences summarizing that specific video at the top of its description before your channel footer/links.",
                    "Keep hashtags between 3 and 8 per video (never over 15), and put comma-separated keywords ONLY in the Tags field.",
                    "Use Details Checkup to generate tailored descriptions and replace any retired channel links."
                ],
                issueCode,
                affected));
        }
        else
        {
            items.Add(new(
                "policy-metadata-clean",
                "good",
                "Metadata & Spam Policy",
                "Descriptions are descriptive, unique, and spam-free",
                "All checked uploads carry real descriptions without >15 hashtag stuffing, keyword dumps, or dead links.",
                [
                    "Keep writing a fresh 2-line video context above your standard channel credits on every new upload."
                ]));
        }

        // 3. Reused Content clues & Mobile-truncation / Packaging check
        var reusedClues = perVideo.Where(x => x.Issues.Any(i => i.Code == "reused-clue")).ToList();
        var longTitles = perVideo.Where(x => x.Issues.Any(i => i.Code == "title-too-long")).ToList();
        if (reusedClues.Count > 0)
        {
            score -= Math.Min(18, reusedClues.Count * 8 + 6);
            items.Add(new(
                "policy-reused-clues",
                "wrong",
                "Reused Content",
                $"{reusedClues.Count} video(s) read like unedited status/reupload clips",
                "YouTube's Reused Content rule rejects channels repurposing clips, episodes, or status snippets without substantial original commentary, narrative, or transformation — even without copyright claims.",
                [
                    "Explain the original narration, commentary, or creative transformation clearly in the title and top lines of the description.",
                    "Remove plain clip compilations or unedited reuploads before applying for YPP monetization review."
                ],
                "reused-clue",
                [.. reusedClues.Select(x => x.Video.VideoId)]));
        }

        if (longTitles.Count >= 3 || (total > 0 && longTitles.Count * 3 >= total))
        {
            score -= 6;
            items.Add(new(
                "policy-mobile-titles",
                "wrong",
                "Recommendation & CTR",
                $"{longTitles.Count} titles exceed 70 chars and truncate on mobile",
                "When viewers on phones can't read the full hook before '...', click-through drops and YouTube pushes the video to fewer home feeds.",
                [
                    "Front-load the curiosity hook or key subject within the first 50–55 characters.",
                    "Move secondary keywords or series tags to the description and Tags box."
                ],
                "title-too-long",
                [.. longTitles.Select(x => x.Video.VideoId)]));
        }

        // 4. Reviewer Focus: Top Most-Viewed & Newest Videos (answer/1311392 "What we check")
        var newest5 = perVideo
            .OrderByDescending(x => x.Video.PublishedAtUtc ?? DateTime.MinValue)
            .Take(5);
        var top5 = perVideo
            .Where(x => (x.Video.Views ?? 0) > 0)
            .OrderByDescending(x => x.Video.Views ?? 0)
            .Take(5);
        var reviewerFocus = newest5.Concat(top5).DistinctBy(x => x.Video.VideoId).ToList();
        var reviewerHighProblems = reviewerFocus.Where(x => x.Issues.Any(i => i.Severity == "high")).ToList();
        var defaultCategoriesCount = reviewerFocus.Count(x =>
            string.IsNullOrWhiteSpace(x.Video.CategoryId) || x.Video.CategoryId == DefaultYouTubeCategoryId);

        if (reviewerHighProblems.Count > 0)
        {
            score -= 10;
            var sampleNames = string.Join(", ", reviewerHighProblems.Take(3).Select(x => $"\"{Truncate(x.Video.Title, 38)}\""));
            items.Add(new(
                "policy-reviewer-focus-wrong",
                "wrong",
                "YPP Reviewer Focus",
                $"{reviewerHighProblems.Count} of your top-viewed / newest videos have high-priority metadata gaps",
                $"Per YouTube's review process, reviewers inspect your most-viewed and newest videos first. Fix missing descriptions, tags, hashtags, or audience on: {sampleNames}.",
                [
                    "Prioritize your top 5 most-viewed and 5 newest videos first inside Details Checkup.",
                    playlistsKnown == true ? "Group recurring series into clear playlists so viewers binge consecutive episodes." : "Ensure top videos sit in themed playlists inside YouTube Studio."
                ],
                AffectedVideoIds: [.. reviewerHighProblems.Select(x => x.Video.VideoId)]));
        }
        else
        {
            items.Add(new(
                "policy-reviewer-focus-good",
                "good",
                "YPP Reviewer Focus",
                "Top-viewed and newest videos pass core packaging checks",
                $"All {reviewerFocus.Count} key uploads that human reviewers check first (most viewed + newest) have titles, descriptions, tags, and declared audiences."
                + (defaultCategoriesCount > reviewerFocus.Count / 2 ? " Consider setting a specific category (Film & Animation, Education, Music) instead of People & Blogs." : string.Empty),
                [
                    "Keep top-performing videos grouped into themed playlists to lift session watch time and suggested views."
                ]));
        }

        // 5. Audience Declaration (COPPA) & Series Organisation
        var unsetAudience = perVideo.Where(x => x.Issues.Any(i => i.Code == "audience-unset")).ToList();
        if (unsetAudience.Count > 0)
        {
            score -= Math.Min(12, unsetAudience.Count * 3);
            items.Add(new(
                "policy-audience-unset",
                "wrong",
                "Audience & Safety",
                $"{unsetAudience.Count} video(s) have no audience (Made for Kids) declaration",
                "YouTube requires an explicit Made for Kids / Not Made for Kids selection for compliance and ad suitability.",
                [
                    "Select affected videos in Details Checkup and apply 'Audience: Not made for kids' (or 'Made for kids' where specifically directed to children)."
                ],
                "audience-unset",
                [.. unsetAudience.Select(x => x.Video.VideoId)]));
        }
        else
        {
            items.Add(new(
                "policy-audience-ok",
                "good",
                "Audience & Safety",
                "All checked videos declare their Made for Kids setting",
                "Every scanned upload explicitly sets Made for Kids vs Not Made for Kids.",
                ["Keep declaring audience consistently on every new mobile or desktop upload."]));
        }

        if (playlistsKnown == true)
        {
            var notInPlaylist = perVideo.Where(x => x.Video.InPlaylist == false).ToList();
            if (notInPlaylist.Count == 0)
            {
                items.Add(new(
                    "policy-playlists-good",
                    "good",
                    "Watch-Time Architecture",
                    "Every video belongs to a playlist",
                    "Organizing uploads into series playlists helps YouTube recommend the next episode and increases session watch time.",
                    ["Add end screens pointing to the next video or playlist on long-form uploads."]));
            }
            else if (notInPlaylist.Count >= 3 || notInPlaylist.Count == total)
            {
                score -= 5;
                items.Add(new(
                    "policy-playlists-missing",
                    "wrong",
                    "Watch-Time Architecture",
                    $"{notInPlaylist.Count} video(s) are not in any playlist",
                    "Standalone videos without playlists lose automatic Up Next episode chaining, reducing overall channel watch time.",
                    [
                        "Select ungrouped uploads in Details Checkup and add them to a series or topic playlist."
                    ],
                    "playlist-missing",
                    [.. notInPlaylist.Select(x => x.Video.VideoId)]));
            }
        }

        // 6. Mandatory Unobservable Checks (Mobile / External Uploads & Visual/Audio Policy Scope)
        var uploadOriginSummary = mobileOrExternalCount > 0
            ? appCount > 0
                ? $"{mobileOrExternalCount} of {total} videos were uploaded outside AnimStudio (e.g. phone/mobile app or YouTube Studio), and {appCount} via AnimStudio."
                : $"All {total} videos were uploaded outside AnimStudio (e.g. from your mobile YouTube app or YouTube Studio)."
            : $"All {appCount} checked videos were published through AnimStudio.";

        items.Add(new(
            "verify-reused-audio-visual",
            "verify",
            "Reused Content (Visual & Audio)",
            mobileOrExternalCount > 0
                ? $"Verify original audio & visuals on {mobileOrExternalCount} mobile / external upload(s)"
                : "Verify no third-party clip or song reuse inside the video file",
            $"{uploadOriginSummary} Apps only read YouTube metadata — we cannot watch inside uploaded video frames or listen to audio to confirm originality under YouTube's Reused Content policy.",
            [
                "Ensure every upload contains your own original script, voiceover, commentary, or unique animated/filmed visuals — not unedited TV/movie/Reels/TikTok clips.",
                "Even if a clip or song has zero Copyright Strike, using someone else's media without significant transformation fails Reused Content review.",
                "Make sure no external social-media watermarks (TikTok, Instagram, CapCut, Kinemaster) appear in frame."
            ]));

        items.Add(new(
            "verify-inauthentic-visuals",
            "verify",
            "Inauthentic Content (Visual Variety)",
            "Confirm videos don't look mass-produced or visually repetitive",
            "YouTube checks whether recent and top videos use the exact same looping background, static slide, or robotic TTS without viewer value — especially important for AI & animated storytelling.",
            [
                "Vary camera angles, character expressions, backgrounds, and pacing across episodes (use per-scene pictures or 3D scene directives rather than one reused background).",
                "Listen to the voiceover and check subtitles for natural pacing and zero awkward pronunciation."
            ]));

        var syntheticDeclared = videos.Count(v => v.ContainsSyntheticMedia == true);
        items.Add(new(
            "verify-altered-content",
            "verify",
            "Altered / Synthetic AI Content",
            syntheticDeclared > 0
                ? $"Altered content label is set on {syntheticDeclared} upload(s) — verify remaining realistic AI videos"
                : "Check YouTube Studio's Altered Content toggle on realistic AI uploads",
            "YouTube requires creators to disclose realistic altered or synthetic visuals/voices (when realistic people, places, or events are depicted). Stylized 2D/3D cartoons usually don't require the realistic altered-content disclosure, but realistic scenes/voices do.",
            [
                "Open YouTube Studio → Video Details → Altered content for realistic AI scenes uploaded from mobile or Studio.",
                "AnimStudio preserves any Altered Content toggle already set on YouTube when saving details."
            ]));

        items.Add(new(
            "verify-studio-earn-copyright",
            "verify",
            "Thumbnails, YPP Thresholds & Studio Checks",
            "Verify thumbnails, zero strikes & Partner Program status in YouTube Studio",
            "YouTube does not share click-through rate (CTR), Content ID claims, Community Guidelines strikes, or YPP watch-hour thresholds with apps.",
            [
                "Check YouTube Studio → Analytics → Reach for low thumbnail CTR and test clearer 2–3 word thumbnail hooks.",
                "Check YouTube Studio → Content for any Copyright claims on mobile uploads (replace claimed music if needed).",
                "Open YouTube Studio → Earn to verify 2-step verification, zero active strikes, and watch-hour / Shorts view progress.",
                $"Read the full official guidelines: {OfficialPolicyUrl}"
            ]));

        score = Math.Clamp(score, 20, 100);
        var wrongCount = items.Count(i => i.Verdict == "wrong");
        var overallStatus = score >= 82 && wrongCount == 0
            ? "Strong"
            : score >= 62 && wrongCount <= 2
                ? "NeedsAttention"
                : "AtRisk";

        return new YouTubeMonetizationAuditReport(
            OfficialPolicyUrl,
            overallStatus,
            score,
            total,
            appCount,
            mobileOrExternalCount,
            items);
    }

    /// <summary>Compact factual summary injected into the AI channel analysis prompt and rule fallback.</summary>
    public static string ToPromptSummary(YouTubeMonetizationAuditReport? report)
    {
        if (report is null) return string.Empty;
        var b = new StringBuilder();
        b.Append($"Monetization Policy Audit ({report.PolicyUrl}): {report.ScoreOutOf100}/100 ({report.OverallStatus}) across {report.VideosEvaluated} uploads (app: {report.AppUploadedCount}, mobile/external: {report.MobileOrExternalCount}).\n");
        foreach (var item in report.Items)
            b.Append($"- [{item.Verdict.ToUpperInvariant()}] {item.Category}: {item.Title} — {item.Detail}\n");
        return b.ToString().TrimEnd();
    }

    private static string NormalizeTemplateStem(string? title)
    {
        if (string.IsNullOrWhiteSpace(title)) return string.Empty;
        var cleaned = HashtagOrBracket().Replace(title, " ");
        cleaned = DigitsAndSeparators().Replace(cleaned, " ");
        return MultiSpaces().Replace(cleaned, " ").Trim().ToLowerInvariant();
    }

    private static string NormalizeDescriptionSignature(string? description)
    {
        if (string.IsNullOrWhiteSpace(description)) return string.Empty;
        var withoutDigits = DigitsAndSeparators().Replace(description, " ");
        return MultiSpaces().Replace(withoutDigits, " ").Trim().ToLowerInvariant();
    }

    private static string Truncate(string? value, int max)
    {
        if (string.IsNullOrWhiteSpace(value)) return string.Empty;
        var trimmed = value.Trim();
        return trimmed.Length <= max ? trimmed : trimmed[..(max - 1)].TrimEnd() + "…";
    }

    [GeneratedRegex(@"(?:#[^\s#]+|\[[^\]]{1,40}\])")]
    private static partial Regex HashtagOrBracket();

    [GeneratedRegex(@"[\d|:\-–—_/.,]+")]
    private static partial Regex DigitsAndSeparators();

    [GeneratedRegex(@"\s+")]
    private static partial Regex MultiSpaces();
}
