import { YouTubeCheckupVideo } from '../../core/models/youtube.models';

/**
 * Hand-off to the creator's own AI tool (ChatGPT, Gemini, …): a prompt to copy that asks for
 * JSON, and a reader for the answer pasted back. The answer is untrusted - it only fills
 * drafts the creator reviews, for videos already on the page, and saving still runs the
 * server's validator.
 */

/** What the AI settings on the page add to every prompt. */
export interface HandoffSettings {
  channelTitle: string;
  /** The channel's public address (youtube.com/@handle), for the subscribe line; null when unknown. */
  channelUrl?: string | null;
  tone: string;
  language: 'en' | 'hi' | string;
  brief: string;
  /** The channel's playlist titles the AI may pick from; empty leaves playlists out of the answer. */
  playlists?: string[];
  /**
   * Set when the brand channel's credits, links, hashtags and tags are added to every answer on
   * import, so the AI is told to leave them out rather than write (and mistype) them.
   */
  brandAdded?: boolean;
  /** Retired channel URLs configured by Admin in Central Admin / Studio settings. */
  retiredUrls?: readonly string[];
  /** Retired channel names/aliases configured by Admin in Central Admin / Studio settings. */
  retiredNames?: readonly string[];
}

/**
 * Default fallback list is empty; live retired addresses come from Central Admin + Studio DB.
 */
export const RETIRED_CHANNEL_URLS: readonly string[] = [];

/**
 * Default fallback list is empty; live retired aliases come from Central Admin + Studio DB.
 */
export const RETIRED_CHANNEL_NAMES: readonly string[] = [];

/**
 * The channel's public address from its handle, or null when the handle isn't known - or matches
 * a configured retired address.
 */
export function channelUrlFor(
  handle: string | null | undefined,
  retiredUrls: readonly string[] = RETIRED_CHANNEL_URLS
): string | null {
  const h = (handle ?? '').trim().replace(/^@/, '');
  if (!/^[\p{L}\p{M}\p{N}._-]{1,100}$/u.test(h)) return null;
  const url = `https://youtube.com/@${h}`;
  return hasRetiredLink(url, retiredUrls) ? null : url;
}

/** Whether the text still links a configured retired channel address. */
export function hasRetiredLink(text: string, retiredUrls: readonly string[] = RETIRED_CHANNEL_URLS): boolean {
  if (!retiredUrls.length) return false;
  const lower = text.toLowerCase();
  return retiredUrls.some((old) => !!old && lower.includes(old.toLowerCase()));
}

/** The text with every link to a retired channel address pointed at the current one. */
export function replaceRetiredLinks(
  text: string,
  channelUrl: string | null,
  retiredUrls: readonly string[] = RETIRED_CHANNEL_URLS
): string {
  if (!channelUrl || !retiredUrls.length) return text;
  let out = text;
  for (const old of retiredUrls) {
    if (!old) continue;
    const escaped = old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    out = out.replace(new RegExp(`(https?://)?(www\\.)?${escaped}/?`, 'gi'), channelUrl);
  }
  return out;
}

/**
 * The text with retired names - as a hashtag or a word - written as the current name.
 */
export function replaceRetiredNames(
  text: string,
  channelName: string | null | undefined,
  retiredNames: readonly string[] = RETIRED_CHANNEL_NAMES
): string {
  const name = (channelName ?? '').trim();
  if (!name || !retiredNames.length || retiredNames.some((old) => old.toLowerCase() === name.toLowerCase())) return text;
  const hashtag = hashtagFor(name);
  let out = text;
  for (const old of retiredNames) {
    if (!old) continue;
    const escaped = old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (hashtag) out = out.replace(new RegExp(`#${escaped}(?![\\p{L}\\p{M}\\p{N}_])`, 'giu'), () => `#${hashtag}`);
    out = out.replace(new RegExp(`(?<![\\p{L}\\p{M}\\p{N}_#@/.-])${escaped}(?![\\p{L}\\p{M}\\p{N}_-])`, 'giu'), () => name);
  }
  return out;
}

/** The name as a hashtag body: "Channel Name" -> "ChannelName". */
export function hashtagFor(name: string): string {
  return name.replace(/[^\p{L}\p{M}\p{N}_]+/gu, '').slice(0, 30);
}

/** The rules every prompt gives the AI, so the clipboard prompt and the exported file ask for the same thing. */
export function promptRules(settings: HandoffSettings, count: number): string[] {
  const language = settings.language === 'hi'
    ? 'Hindi (Devanagari), with common English and Hinglish search words kept in tags'
    : languageName(settings.language);
  const playlists = settings.playlists ?? [];
  const url = settings.channelUrl;
  const channelTag = settings.channelTitle.replace(/[^\p{L}\p{M}\p{N}]/gu, '');
  const added = !!settings.brandAdded;
  const retiredUrls = settings.retiredUrls ?? RETIRED_CHANNEL_URLS;
  const retiredNames = settings.retiredNames ?? RETIRED_CHANNEL_NAMES;
  return [
    `You are writing YouTube details for ${count === 1 ? 'one video' : `${count} videos`} on the channel "${settings.channelTitle}"${url ? ` (${url})` : ''}.`,
    '',
    'For every video write:',
    '- title (required): at most 100 characters, no < or > characters. Put the main search words first (deity, bhajan, topic).',
    '  Keep the current title only if it is already a real, specific title (not a file name like "VID_1234" or "AnimStudio video").',
    '- description (required): at most 4500 characters. The first two lines are what search results show: a hook with the main keywords.',
    '  Then 2-4 short paragraphs a viewer finds useful (what is sung or shown, its meaning, the occasion). Keep what is good in the current description.',
    '  Add one line "Also searched as: ..." with 4-6 phrases people type on YouTube, Google, WhatsApp and Instagram',
    '  (for example "mahadev whatsapp status", "shiv bhajan status 4k", "bholenath reels").',
    added
      ? '  Do NOT write credits, the creator or studio links, the subscribe link or a channel footer: AnimStudio adds them, exactly, to every video.'
      : url ? `  Include the subscribe link ${url}.` : '',
    added
      ? '  If the current description ends with such a block (credits, links, "Subscribe", a footer), leave it out - it is replaced.'
      : retiredUrls.length > 0
        ? `  If the current description links ${retiredUrls.join(' or ')}, that address no longer works: ${url ? `use ${url} instead` : 'remove it'}.`
        : '',
    retiredNames.length > 0
      ? `  The channel's name is "${settings.channelTitle}"; never call it ${retiredNames.map((n) => `"${n}"`).join(' or ')} or any older name.`
      : `  Always refer to the channel consistently as "${settings.channelTitle}".`,
    added
      ? '  End with 3-5 topic hashtags on the last line; the channel\'s own hashtags (and #shorts for a Short) are added for you.'
      : `  End with 3-6 hashtags on the last line${channelTag ? `, including #${channelTag}` : ''}; for a YouTube Short also #shorts.`,
    '- tags (required): 15-25 search tags as a list, no # sign, all tags together under 350 characters. Mix the exact topic,',
    '  deity names in Hindi and English, Hinglish spellings, and the phrases used to find clips to share ("<deity> status",',
    added
      ? '  "whatsapp status", "bhakti status", "reels"). The channel\'s own tags are added for you.'
      : '  "whatsapp status", "bhakti status", "reels"), and the channel name.',
    playlists.length > 0
      ? `- playlists (optional): 0-2 playlist titles copied exactly from this list, only when one clearly fits: ${playlists.map((p) => JSON.stringify(p)).join(', ')}.`
      : '',
    `- pinnedComment (recommended): 1-2 lines encouraging a jaikara in the comments (e.g. "Har Har Mahadev 🙏") and subscribing${added ? '; the channel link is added for you' : ''}.`,
    '- engagementComment (optional): 1 short question for viewers.',
    '',
    'Uniqueness: every video gets its own title and description. Do not reuse a title, an opening line or a description template',
    'across videos; name what is specific to each one (the bhajan, the deity, the moment, the occasion). Tags may overlap but not be identical.',
    '',
    `Write in ${language}. Tone: ${settings.tone || 'auto'}.`,
    settings.tone === 'devotional-omkr' && !added
      ? `Brand rules: credit "AnimStudio" (the creator's animation tool) and "${settings.channelTitle} 3D Devotional Animations".`
      : '',
    settings.brief.trim() ? `Notes from the creator: ${settings.brief.trim()}` : '',
  ];
}

function languageName(id: string): string {
  const names: Record<string, string> = {
    en: 'English', hinglish: 'Hinglish (Hindi in English letters)', mr: 'Marathi', gu: 'Gujarati', bn: 'Bengali',
    ta: 'Tamil', te: 'Telugu', kn: 'Kannada', pa: 'Punjabi',
  };
  return names[id] ?? 'English';
}

/** The lines joined, with runs of blank lines collapsed to one and none at either end. */
export function joinLines(lines: string[]): string {
  return lines.filter((line, i, all) => line !== '' || (i > 0 && all[i - 1] !== '')).join('\n').trim();
}

/** One video's details as read from a pasted answer. */
export interface HandoffAnswer {
  videoId: string;
  title: string;
  description: string;
  tags: string[];
  pinnedComment?: string;
  engagementComment?: string;
}

export interface HandoffParseResult {
  answers: HandoffAnswer[];
  /** Why items were left out, one line each. */
  skipped: string[];
  /** Set when nothing could be read at all. */
  error: string | null;
}

/** A prompt for more videos than this gets too long for most chat tools' input box. */
export const MAX_PROMPT_VIDEOS = 25;

/** How much of a current description goes into the prompt. */
const DESCRIPTION_IN_PROMPT = 600;

/** Longest answer read back: 25 videos × a 5000-byte description, with room for JSON. */
export const MAX_ANSWER_CHARS = 200_000;

const MAX_TITLE = 100;
const MAX_DESCRIPTION_BYTES = 5000;
const MAX_TAG = 60;
const MAX_TAGS = 40;

export function buildHandoffPrompt(videos: YouTubeCheckupVideo[], settings: HandoffSettings): string {
  const list = videos.slice(0, MAX_PROMPT_VIDEOS).map((v, i) => [
    `### Video ${i + 1}`,
    `videoId: ${v.videoId}`,
    `kind: ${v.isShort ? 'YouTube Short' : 'YouTube video'}${v.durationSeconds ? `, ${Math.round(v.durationSeconds)} seconds` : ''}`,
    `current title: ${v.title || '(none)'}`,
    `current description: ${v.description.trim() ? clip(v.description.trim(), DESCRIPTION_IN_PROMPT) : '(none)'}`,
    `current tags: ${v.tags.length ? v.tags.slice(0, 30).join(', ') : '(none)'}`,
    `missing: ${v.issues.length ? v.issues.map((x) => x.message).join(' ') : 'nothing'}`,
  ].join('\n'));

  return joinLines([
    ...promptRules(settings, list.length),
    '',
    'Reply with ONLY a JSON array, no other text, in exactly this shape:',
    '[{"videoId": "…", "title": "…", "description": "…", "tags": ["…", "…"], "playlists": ["…"], "pinnedComment": "…", "engagementComment": "…"}]',
    'Use the videoId values exactly as given.',
    '',
    ...list.flatMap((block) => [block, '']),
  ]);
}

/**
 * Reads a pasted answer: the JSON array (or `{ "videos": [...] }`), even inside a ```json
 * fence or with chatter around it. Only ids in <paramref name="knownIds"/> are kept.
 */
export function parseHandoffAnswer(text: string, knownIds: ReadonlySet<string>): HandoffParseResult {
  const empty = (error: string): HandoffParseResult => ({ answers: [], skipped: [], error });
  if (!text.trim()) return empty('Paste the answer from your AI tool first.');
  if (text.length > MAX_ANSWER_CHARS) return empty('That answer is too long. Ask for fewer videos at a time.');

  let data: unknown;
  try {
    data = JSON.parse(extractJson(text));
  } catch {
    return empty('The answer isn\'t valid JSON. Ask your AI tool to reply with only the JSON array.');
  }
  const items = Array.isArray(data) ? data : isRecord(data) && Array.isArray(data['videos']) ? data['videos'] : isRecord(data) ? [data] : null;
  if (!items) return empty('The answer should be a JSON array of videos.');

  const answers: HandoffAnswer[] = [];
  const skipped: string[] = [];
  const seen = new Set<string>();
  items.forEach((item: unknown, i: number) => {
    if (!isRecord(item)) { skipped.push(`Item ${i + 1} isn't an object.`); return; }
    const videoId = typeof item['videoId'] === 'string' ? item['videoId'].trim() : '';
    if (!knownIds.has(videoId)) { skipped.push(`Item ${i + 1}: "${clip(videoId, 20) || 'no videoId'}" isn't a video on this page.`); return; }
    if (seen.has(videoId)) { skipped.push(`Item ${i + 1}: ${videoId} appears twice; the first one was used.`); return; }

    const title = cleanLine(typeof item['title'] === 'string' ? item['title'] : '').slice(0, MAX_TITLE).trim();
    const description = typeof item['description'] === 'string' ? fitBytes(cleanText(item['description']), MAX_DESCRIPTION_BYTES) : '';
    const tags = (Array.isArray(item['tags']) ? item['tags'] : typeof item['tags'] === 'string' ? item['tags'].split(',') : [])
      .filter((t: unknown): t is string => typeof t === 'string')
      .map((t: string) => cleanLine(t).replace(/^#/, '').trim().slice(0, MAX_TAG))
      .filter(Boolean)
      .slice(0, MAX_TAGS);
    if (!title && !description && tags.length === 0) { skipped.push(`Item ${i + 1}: ${videoId} has no title, description or tags.`); return; }

    const pinnedComment = typeof item['pinnedComment'] === 'string' ? cleanText(item['pinnedComment']).slice(0, 1000) : undefined;
    const engagementComment = typeof item['engagementComment'] === 'string' ? cleanText(item['engagementComment']).slice(0, 1000) : undefined;
    seen.add(videoId);
    answers.push({ videoId, title, description, tags, pinnedComment, engagementComment });
  });

  return { answers, skipped, error: answers.length === 0 && skipped.length === 0 ? 'No videos found in the answer.' : null };
}

/** The JSON part of a chat answer: inside a code fence if there is one, else from the first [ or { to the last ] or }. */
export function extractJson(text: string): string {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(text);
  const body = (fenced ? fenced[1] : text).trim();
  const start = body.search(/[[{]/);
  const end = Math.max(body.lastIndexOf(']'), body.lastIndexOf('}'));
  return start >= 0 && end > start ? body.slice(start, end + 1) : body;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** One line: no control characters or angle brackets (YouTube refuses those in titles and tags). */
export function cleanLine(value: string): string {
  return value.replace(/[\p{Cc}<>]/gu, ' ').replace(/\s+/g, ' ').trim();
}

/** Multi-line text without control characters other than newlines and tabs. */
export function cleanText(value: string): string {
  return value.replace(/\r\n?/g, '\n').replace(/[^\P{Cc}\n\t]/gu, '').replace(/[<>]/g, '').trim();
}

export function fitBytes(value: string, max: number): string {
  const encoder = new TextEncoder();
  if (encoder.encode(value).length <= max) return value;
  let bytes = 0;
  let end = 0;
  for (const ch of value) {
    bytes += encoder.encode(ch).length;
    if (bytes > max) break;
    end += ch.length;
  }
  return value.slice(0, end).trimEnd();
}

export function clip(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}
