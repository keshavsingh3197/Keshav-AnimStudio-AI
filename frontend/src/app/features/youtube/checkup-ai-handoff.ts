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
  tone: string;
  language: 'en' | 'hi' | string;
  brief: string;
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
  const language = settings.language === 'hi' ? 'Hindi (Devanagari), with common English search words kept in tags' : 'English';
  const list = videos.slice(0, MAX_PROMPT_VIDEOS).map((v, i) => [
    `### Video ${i + 1}`,
    `videoId: ${v.videoId}`,
    `kind: ${v.isShort ? 'YouTube Short' : 'YouTube video'}${v.durationSeconds ? `, ${Math.round(v.durationSeconds)} seconds` : ''}`,
    `current title: ${v.title || '(none)'}`,
    `current description: ${v.description.trim() ? clip(v.description.trim(), DESCRIPTION_IN_PROMPT) : '(none)'}`,
    `current tags: ${v.tags.length ? v.tags.slice(0, 30).join(', ') : '(none)'}`,
    `missing: ${v.issues.length ? v.issues.map((x) => x.message).join(' ') : 'nothing'}`,
  ].join('\n'));

  return [
    `You are writing YouTube details for ${videos.length === 1 ? 'one video' : `${list.length} videos`} on the channel "${settings.channelTitle}".`,
    '',
    'For every video below write:',
    '- title: at most 100 characters, no < or > characters. Keep the current title if it is already a real title (not a file name like "VID_1234" or "AnimStudio video").',
    '- description: 2-5 short paragraphs a viewer would find useful, at most 4500 characters. Keep what is good in the current description.',
    '  End with two or three topic hashtags; for a YouTube Short also add #shorts.',
    '- tags: 10-20 search tags, no # sign, all tags together under 450 characters.',
    '- pinnedComment: 1-2 lines encouraging comments (e.g. "Har Har Mahadev 🙏" or "Jai Shree Shyam 🙏") and subscribing.',
    '- engagementComment: 1 short interactive question comment for viewers.',
    `Write in ${language}. Tone: ${settings.tone || 'auto'}.`,
    settings.tone === 'devotional-omkr'
      ? 'Brand Rules: Mention "AnimStudio (Built by Creator)" and "OMKR 3D Devotional Animations", and include https://youtube.com/@omkr-shiv in the description.'
      : '',
    settings.brief.trim() ? `Notes from the creator: ${settings.brief.trim()}` : '',
    '',
    'Reply with ONLY a JSON array, no other text, in exactly this shape:',
    '[{"videoId": "…", "title": "…", "description": "…", "tags": ["…", "…"], "pinnedComment": "…", "engagementComment": "…"}]',
    'Use the videoId values exactly as given.',
    '',
    ...list,
  ].filter((line, i, all) => line !== '' || all[i - 1] !== '').join('\n');
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
function extractJson(text: string): string {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(text);
  const body = (fenced ? fenced[1] : text).trim();
  const start = body.search(/[[{]/);
  const end = Math.max(body.lastIndexOf(']'), body.lastIndexOf('}'));
  return start >= 0 && end > start ? body.slice(start, end + 1) : body;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** One line: no control characters or angle brackets (YouTube refuses those in titles and tags). */
function cleanLine(value: string): string {
  return value.replace(/[\p{Cc}<>]/gu, ' ').replace(/\s+/g, ' ').trim();
}

/** Multi-line text without control characters other than newlines and tabs. */
function cleanText(value: string): string {
  return value.replace(/\r\n?/g, '\n').replace(/[^\P{Cc}\n\t]/gu, '').replace(/[<>]/g, '').trim();
}

function fitBytes(value: string, max: number): string {
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

function clip(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}
