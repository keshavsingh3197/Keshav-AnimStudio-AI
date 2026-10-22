import { YouTubeCheckupVideo, YouTubePrivacy } from '../../core/models/youtube.models';

/** The details being edited for one video; nothing reaches YouTube until it is saved. */
export interface Draft {
  title: string;
  description: string;
  tagsText: string;
  categoryId: string;
  privacy: YouTubePrivacy;
  madeForKids: boolean | null;
  addPlaylistIds: string[];
  titleOptions: string[];
  descriptionOptions: string[];
  tagIdeas: string[];
  pinnedComment?: string;
  engagementComment?: string;
  transcriptText?: string | null;
  /** Private now, public by itself at `publishAtLocal` (a datetime-local value in the viewer's zone). */
  scheduled?: boolean;
  publishAtLocal?: string;
}

export interface RowState {
  draft: Draft | null;
  busy: 'suggest' | 'save' | null;
  error: string | null;
  saved: boolean;
  warnings: string[];
}

export const EMPTY_STATE: RowState = { draft: null, busy: null, error: null, saved: false, warnings: [] };

/** Tags are sent comma-joined; YouTube's limit is 500 characters, so drafts stop a little short. */
export const TAGS_BUDGET = 450;

/** Mirrors the server's checkup: below this a description says next to nothing. */
const SHORT_DESCRIPTION_CHARS = 80;

export const HASHTAG = /(^|\s)#[\p{L}\p{M}\p{N}_]+/u;
export const HASHTAGS = /#[\p{L}\p{M}\p{N}_]+/gu;

/** Same rule as the server's: a file name or placeholder rather than a real title. */
const FILE_NAME_TITLE = /\.(mp4|mov|m4v|webm|mkv|avi)$|^((VID|IMG|PXL|MOV)[\s_-]?\d[\d_\s-]*|(short|video|clip|untitled)\s*[#(]?\d*\)?|AnimStudio video)$/i;

export function splitTags(text: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of text.split(',')) {
    const tag = raw.trim().replace(/^#/, '');
    if (!tag || seen.has(tag.toLowerCase())) continue;
    seen.add(tag.toLowerCase());
    out.push(tag);
  }
  return out;
}

/** Keeps tags in order until the comma-joined list would pass the budget. */
export function fitTags(tags: string[]): string[] {
  const out: string[] = [];
  let length = 0;
  for (const tag of splitTags(tags.join(','))) {
    const add = (out.length ? 1 : 0) + tag.length;
    if (length + add > TAGS_BUDGET) break;
    out.push(tag);
    length += add;
  }
  return out;
}

export function hasFooter(description: string, footer: string | null): boolean {
  if (!footer?.trim()) return false;
  const f = footer.trim();
  if (description.includes(f)) return true;
  const lines = f.split('\n').map((l) => l.trim()).filter(Boolean);
  return lines.length > 0 && description.includes(lines[0]);
}

/** Adds the channel footer at the very end, once. */
export function withFooter(description: string, footer: string | null): string {
  if (!footer?.trim() || hasFooter(description, footer)) return description;
  return description.trim() ? `${description.trimEnd()}\n\n${footer.trim()}` : footer.trim();
}

/** Adds a block of text above the channel footer, so the footer stays last. */
export function insertAboveFooter(description: string, block: string, footer: string | null): string {
  const text = block.trim();
  if (!text || description.includes(text)) return description;
  if (!description.trim()) return text;
  if (footer && hasFooter(description, footer)) {
    const at = description.lastIndexOf(footer.trim());
    return `${description.slice(0, at).trimEnd()}\n\n${text}\n\n${description.slice(at)}`;
  }
  return `${description.trimEnd()}\n\n${text}`;
}

/**
 * Safely truncates a string so its UTF-8 byte count is at most maxBytes.
 * Tries to cleanly cut at a paragraph, sentence or word boundary without breaking multi-byte characters.
 */
export function trimUtf8Bytes(text: string, maxBytes: number): string {
  const encoder = new TextEncoder();
  if (encoder.encode(text).length <= maxBytes) return text;

  let low = 0;
  let high = text.length;
  let best = 0;

  while (low <= high) {
    const mid = (low + high) >> 1;
    const sub = text.slice(0, mid);
    if (encoder.encode(sub).length <= maxBytes) {
      best = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  let result = text.slice(0, best);
  const lastNewline = result.lastIndexOf('\n');
  if (lastNewline > best * 0.85) {
    result = result.slice(0, lastNewline);
  } else {
    const lastSpace = result.lastIndexOf(' ');
    if (lastSpace > best * 0.9) {
      result = result.slice(0, lastSpace);
    }
  }
  return result.trimEnd();
}

/** YouTube wants a scheduled time comfortably ahead; ten minutes is what the page asks for. */
export const MIN_SCHEDULE_LEAD_MS = 10 * 60 * 1000;
const MAX_SCHEDULE_LEAD_MS = 365 * 24 * 60 * 60 * 1000;

/** An ISO time as a `datetime-local` value in the viewer's own zone ("2026-10-22T18:30"). */
export function toLocalInput(iso: string | null | undefined): string {
  const t = iso ? Date.parse(iso) : NaN;
  if (!Number.isFinite(t)) return '';
  const d = new Date(t);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** A `datetime-local` value (viewer's zone) as ISO UTC, or null when it isn't a time. */
export function fromLocalInput(value: string | null | undefined): string | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const t = new Date(value).getTime();
  return Number.isFinite(t) ? new Date(t).toISOString() : null;
}

/** The earliest time the picker offers: ten minutes from now, rounded up to the next five. */
export function earliestScheduleLocal(now = Date.now()): string {
  const step = 5 * 60 * 1000;
  return toLocalInput(new Date(Math.ceil((now + MIN_SCHEDULE_LEAD_MS) / step) * step).toISOString());
}

/** Why a scheduled time can't be used, or null when it can. */
export function scheduleProblem(value: string | null | undefined, now = Date.now()): string | null {
  const iso = fromLocalInput(value);
  if (!iso) return 'Pick a date and time.';
  const t = Date.parse(iso);
  if (t < now + MIN_SCHEDULE_LEAD_MS) return 'Pick a time at least 10 minutes from now.';
  if (t > now + MAX_SCHEDULE_LEAD_MS) return 'Pick a time within the next year.';
  return null;
}

/** The viewer's time zone, for the label next to the picker ("Asia/Kolkata, UTC+5:30"). */
export function viewerZone(): string {
  const offset = -new Date().getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  const abs = Math.abs(offset);
  const utc = `UTC${sign}${Math.floor(abs / 60)}${abs % 60 ? ':' + String(abs % 60).padStart(2, '0') : ''}`;
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return zone ? `${zone}, ${utc}` : utc;
  } catch {
    return utc;
  }
}

/** Whether saving would change the video's scheduled publish time. */
export function scheduleDiffers(v: YouTubeCheckupVideo, d: Draft): boolean {
  const current = v.privacy === 'private' && v.scheduledAt ? Date.parse(v.scheduledAt) : null;
  if (!d.scheduled) return current !== null && d.privacy === 'private';
  const wanted = fromLocalInput(d.publishAtLocal);
  return wanted === null || current === null || Math.abs(Date.parse(wanted) - current) >= 60_000;
}

/** Whether saving the draft would change anything on YouTube. */
export function draftDiffers(v: YouTubeCheckupVideo, d: Draft): boolean {
  return scheduleDiffers(v, d)
    || d.title !== v.title
    || d.description !== v.description
    || splitTags(d.tagsText).join(',') !== v.tags.join(',')
    || d.madeForKids !== v.madeForKids
    || (!!v.privacy && d.privacy !== v.privacy)
    || (!!v.categoryId && d.categoryId !== v.categoryId)
    || d.addPlaylistIds.length > 0;
}

export interface ChecklistItem {
  label: string;
  ok: boolean;
  /** Missing but not something YouTube or the checkup counts against the video. */
  optional?: boolean;
}

/** What the draft still lacks, judged as the server's checkup would once it is saved. */
export function draftChecklist(v: YouTubeCheckupVideo, d: Draft, footer: string | null, playlistsKnown: boolean): ChecklistItem[] {
  const title = d.title.trim();
  const description = d.description.trim();
  const items: ChecklistItem[] = [
    { label: 'A real title', ok: title.length > 0 && !FILE_NAME_TITLE.test(title) },
    { label: `A description (${SHORT_DESCRIPTION_CHARS}+ characters)`, ok: description.length >= SHORT_DESCRIPTION_CHARS },
    { label: 'Tags', ok: splitTags(d.tagsText).length > 0 },
    { label: v.isShort ? 'Hashtags (#shorts and a few topics)' : 'Hashtags', ok: HASHTAG.test(`${title}\n${description}`) },
    { label: 'Audience declared', ok: d.madeForKids !== null },
  ];
  if (playlistsKnown) items.push({ label: 'In a playlist (recommended)', ok: v.playlistIds.length > 0 || d.addPlaylistIds.length > 0, optional: true });
  if (footer) items.push({ label: 'Channel footer (links, credits)', ok: hasFooter(d.description, footer), optional: true });
  return items;
}

/** A tone id as the pickers show it. */
export function toneLabel(t: string): string {
  const labels: Record<string, string> = {
    auto: '🎯 Auto Tone',
    'devotional-omkr': '🕉️ OMKR 3D Devotional (Brand Rules)',
    devotional: '🙏 Devotional',
    funny: '😂 Funny',
    emotional: '🥹 Emotional',
    dramatic: '🎭 Dramatic',
    informative: '📘 Informative',
    energetic: '⚡ Energetic',
    kids: '🧸 For Kids',
    motivational: '💪 Motivational',
    'clickbait-free': '✅ Honest / No Clickbait',
  };
  return labels[t] ?? t;
}
