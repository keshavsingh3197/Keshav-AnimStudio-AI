using System.Net;
using System.Text;

namespace AnimStudio.Infrastructure.StoryAgent;

/// <summary>
/// Turns the HTML of a Wikisource page into the plain text of the work on it: verses on their own
/// lines, with the navigation boxes, picture captions, footnote marks and the collapsed
/// commentaries that Wikisource wraps around a chapter left out.
/// </summary>
/// <remarks>
/// A Gita chapter page is over 400 KB of HTML because every commentary is on it, folded shut; the
/// verses themselves are about 4 KB. Skipping whole subtrees (rather than stripping tags) is what
/// makes that difference. This is a tolerant scanner, not a validating parser: it reads what
/// MediaWiki emits, which is well formed.
/// </remarks>
public static class WikisourceHtml
{
    private static readonly HashSet<string> SkipTags = new(StringComparer.Ordinal)
    {
        "script", "style", "figure", "noscript", "sup", "sub", "svg", "audio", "video", "nav"
    };

    // Whole class tokens: "mw-collapsible" is skipped and takes "mw-collapsible-content" inside it with it.
    private static readonly HashSet<string> SkipClasses = new(StringComparer.Ordinal)
    {
        "mw-collapsible", "toccolours", "navbox", "ws-noexport", "reference", "noprint", "mw-editsection", "thumb", "hatnote"
    };

    private static readonly HashSet<string> VoidTags = new(StringComparer.Ordinal)
    {
        "br", "hr", "img", "meta", "link", "input", "wbr", "source", "col", "area", "base", "embed", "param", "track"
    };

    private static readonly HashSet<string> BlockTags = new(StringComparer.Ordinal)
    {
        "p", "div", "li", "ul", "ol", "tr", "table", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "dd", "dt", "dl", "section", "pre"
    };

    /// <summary>The page's text, one verse line per line, with at most one blank line in a row.</summary>
    public static string ToText(string? html)
    {
        if (string.IsNullOrWhiteSpace(html)) return string.Empty;

        var output = new StringBuilder(html.Length / 4);
        var open = new List<(string Tag, bool Skipped)>();
        var skipDepth = 0;
        var i = 0;

        while (i < html.Length)
        {
            if (html[i] != '<')
            {
                var next = html.IndexOf('<', i);
                if (next < 0) next = html.Length;
                if (skipDepth == 0) AppendText(output, html.AsSpan(i, next - i));
                i = next;
                continue;
            }

            if (string.CompareOrdinal(html, i, "<!--", 0, 4) == 0)
            {
                var end = html.IndexOf("-->", i + 4, StringComparison.Ordinal);
                i = end < 0 ? html.Length : end + 3;
                continue;
            }

            var isEnd = i + 1 < html.Length && html[i + 1] == '/';
            var nameStart = i + (isEnd ? 2 : 1);
            if (nameStart >= html.Length || !char.IsAsciiLetter(html[nameStart]))
            {
                // A bare "<" in text; MediaWiki escapes these, but a stray one should not swallow the page.
                if (skipDepth == 0) output.Append('<');
                i++;
                continue;
            }

            var close = FindTagEnd(html, nameStart);
            if (close < 0) break;

            var nameEnd = nameStart;
            while (nameEnd < close && (char.IsAsciiLetterOrDigit(html[nameEnd]) || html[nameEnd] == ':')) nameEnd++;
            var tag = html[nameStart..nameEnd].ToLowerInvariant();
            var selfClosing = html[close - 1] == '/';

            if (isEnd)
            {
                for (var depth = open.Count - 1; depth >= 0; depth--)
                {
                    if (open[depth].Tag != tag) continue;
                    for (var j = open.Count - 1; j >= depth; j--)
                        if (open[j].Skipped) skipDepth--;
                    open.RemoveRange(depth, open.Count - depth);
                    break;
                }

                if (skipDepth == 0 && BlockTags.Contains(tag)) output.Append('\n');
            }
            else if (VoidTags.Contains(tag) || selfClosing)
            {
                if (skipDepth == 0 && tag == "br") output.Append('\n');
            }
            else
            {
                var skipped = SkipTags.Contains(tag) || HasSkippedClass(html.AsSpan(nameEnd, close - nameEnd));
                open.Add((tag, skipped));
                if (skipped) skipDepth++;
                if (skipDepth == 0)
                {
                    if (BlockTags.Contains(tag)) output.Append('\n');
                    else if (tag is "td" or "th") output.Append(' ');
                }
            }

            i = close + 1;
        }

        return Tidy(output.ToString());
    }

    /// <summary>The index of the <c>&gt;</c> that closes the tag starting at <paramref name="from"/>, skipping quoted attribute values.</summary>
    private static int FindTagEnd(string html, int from)
    {
        char quote = '\0';
        for (var i = from; i < html.Length; i++)
        {
            var c = html[i];
            if (quote != '\0')
            {
                if (c == quote) quote = '\0';
            }
            else if (c is '"' or '\'')
            {
                quote = c;
            }
            else if (c == '>')
            {
                return i;
            }
        }

        return -1;
    }

    private static bool HasSkippedClass(ReadOnlySpan<char> attributes)
    {
        var at = attributes.IndexOf("class", StringComparison.OrdinalIgnoreCase);
        while (at >= 0)
        {
            var rest = attributes[(at + 5)..];
            var trimmed = rest.TrimStart();
            if (trimmed.Length > 0 && trimmed[0] == '=' && (at == 0 || char.IsWhiteSpace(attributes[at - 1])))
            {
                var value = trimmed[1..].TrimStart();
                if (value.Length > 0)
                {
                    ReadOnlySpan<char> classes;
                    if (value[0] is '"' or '\'')
                    {
                        var end = value[1..].IndexOf(value[0]);
                        classes = end < 0 ? value[1..] : value.Slice(1, end);
                    }
                    else
                    {
                        var end = value.IndexOfAny(" \t\r\n/");
                        classes = end < 0 ? value : value[..end];
                    }

                    foreach (var range in classes.Split(' '))
                    {
                        var token = classes[range].Trim();
                        if (token.Length > 0 && SkipClasses.Contains(token.ToString())) return true;
                    }
                }

                return false;
            }

            var next = attributes[(at + 5)..].IndexOf("class", StringComparison.OrdinalIgnoreCase);
            at = next < 0 ? -1 : at + 5 + next;
        }

        return false;
    }

    private static void AppendText(StringBuilder output, ReadOnlySpan<char> raw)
    {
        var decoded = WebUtility.HtmlDecode(raw.ToString());
        var lastWasSpace = output.Length > 0 && output[^1] is ' ' or '\n';
        foreach (var c in decoded)
        {
            if (char.IsWhiteSpace(c) || c == '\u00A0')
            {
                if (!lastWasSpace) output.Append(' ');
                lastWasSpace = true;
            }
            else
            {
                output.Append(c);
                lastWasSpace = false;
            }
        }
    }

    private static string Tidy(string text)
    {
        var lines = new List<string>();
        var blank = 0;
        foreach (var raw in text.Split('\n'))
        {
            var line = raw.Trim();
            if (line.Length == 0)
            {
                blank++;
                if (blank == 1 && lines.Count > 0) lines.Add(string.Empty);
                continue;
            }

            blank = 0;
            lines.Add(line);
        }

        return string.Join('\n', lines).Trim();
    }

    /// <summary>Cuts text to at most <paramref name="max"/> characters at the end of a line, marking the cut.</summary>
    public static string Truncate(string text, int max)
    {
        if (max <= 0 || text.Length <= max) return text;

        var cut = text.LastIndexOf('\n', max - 1);
        if (cut < max / 2) cut = max;
        return text[..cut].TrimEnd() + "\n...";
    }
}
