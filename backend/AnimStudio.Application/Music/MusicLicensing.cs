using System.Text.RegularExpressions;
using AnimStudio.Domain.Projects;

namespace AnimStudio.Application.Music;

/// <summary>
/// Reads a Creative Commons deed URL and decides whether a track may go under this project's
/// videos. Decided on the server for every result and again on import, never in the browser.
/// </summary>
public static partial class MusicLicensing
{
    /// <summary>
    /// <c>https://creativecommons.org/licenses/by-nc-sa/3.0/</c> and the like; <c>http</c> is
    /// accepted because providers still hand those out. Anything else is an unknown licence.
    /// </summary>
    public static MusicLicense Parse(string? deedUrl)
    {
        var unknown = new MusicLicense(string.Empty, null, null, false, false, false, false);
        if (string.IsNullOrWhiteSpace(deedUrl) || deedUrl.Length > 300) return unknown;

        var match = DeedPattern().Match(deedUrl.Trim());
        if (!match.Success) return unknown;

        var kind = match.Groups["kind"].Value;
        var terms = match.Groups["terms"].Value.ToLowerInvariant();
        var version = match.Groups["version"].Success ? match.Groups["version"].Value : null;
        var url = $"https://creativecommons.org/{kind}/{terms}/{(version is null ? string.Empty : version + "/")}";

        if (kind == "publicdomain")
            return new MusicLicense(terms == "zero" ? "CC0" : "Public Domain", version, url, false, false, false, true);

        var parts = terms.Split('-');
        if (parts[0] != "by" || parts.Skip(1).Any(p => p is not ("nc" or "nd" or "sa"))) return unknown;

        return new MusicLicense(
            "CC " + terms.ToUpperInvariant(),
            version,
            url,
            NonCommercial: parts.Contains("nc"),
            NoDerivatives: parts.Contains("nd"),
            ShareAlike: parts.Contains("sa"),
            PublicDomain: false);
    }

    /// <summary>Why this track can't be used in this project's videos, or null when it can.</summary>
    public static string? WhyNotUsable(MusicLicense license, ProjectSettings settings)
    {
        if (license.Code.Length == 0)
            return "The licence couldn't be read, so this track can't be used.";
        if (license.NoDerivatives)
            return "No-derivatives licence: setting music to video counts as adapting it, which this licence doesn't allow.";
        if (license.NonCommercial && settings.DistributionIntent == DistributionIntent.Monetized)
            return "Non-commercial licence: this project is set to Monetized. Change it in Settings if the video won't earn money.";
        if (license.ShareAlike && !settings.AcceptShareAlikeObligation)
            return "Share-alike licence: the video would have to carry the same licence. Accept that in project Settings to use it.";
        return null;
    }

    /// <summary>The credit line the licence asks for, stored with the asset and added to the YouTube description.</summary>
    public static string Attribution(MusicTrack track)
    {
        var page = track.PageUrl is null ? string.Empty : $" ({track.PageUrl})";
        var licence = track.License.PublicDomain
            ? track.License.Code
            : $"{track.License.Code}{(track.License.Version is null ? string.Empty : " " + track.License.Version)}";
        var deed = track.License.Url is null ? string.Empty : $" - {track.License.Url}";
        return $"\"{track.Title}\" by {track.Artist}{page}, licensed under {licence}{deed}";
    }

    [GeneratedRegex(@"^https?://(?:www\.)?creativecommons\.org/(?<kind>licenses|publicdomain)/(?<terms>[a-z-]{2,10})(?:/(?<version>\d\.\d))?(?:/[a-z]{2})?/?$",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex DeedPattern();
}
