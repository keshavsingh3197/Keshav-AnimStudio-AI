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

/** Whether saving the draft would change anything on YouTube. */
export function draftDiffers(v: YouTubeCheckupVideo, d: Draft): boolean {
  return d.title !== v.title
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
