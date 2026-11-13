import { YouTubeCheckupBrand, YouTubeCheckupPlaylist, YouTubeCheckupVideo } from '../../core/models/youtube.models';
import {
  HandoffSettings, cleanLine, cleanText, extractJson, hasRetiredLink, isRecord, joinLines, promptRules, replaceRetiredLinks,
  replaceRetiredNames,
} from './checkup-ai-handoff';
import { FILE_NAME_TITLE, HASHTAG, SHORT_DESCRIPTION_CHARS, TAGS_BUDGET, hasFooter, splitTags } from './checkup-draft';
import { rank } from './checkup-match';
import { csvCell } from './csv';

/**
 * Export the channel's videos to a file another AI tool (or a spreadsheet) fills in, and read
 * that file back. What comes back is untrusted: it is checked here row by row, only fills
 * drafts for videos already on the page, and every save still runs the server's validator.
 */

/** Marks an AnimStudio export, so an import can tell its own file from any other JSON. */
export const SHEET_FORMAT = 'animstudio.youtube-details.v1';

/** The checkup reads at most 500 videos, so a file never needs more. */
export const MAX_SHEET_VIDEOS = 500;

/** Largest import read: 500 videos × a full description, as JSON or CSV, with room to spare. */
export const MAX_IMPORT_CHARS = 6_000_000;

const MAX_TITLE = 100;
const MAX_DESCRIPTION_BYTES = 5000;
/** YouTube's own limit for the comma-joined tags; drafts aim at TAGS_BUDGET below it. */
const MAX_TAGS_CHARS = 500;
const MAX_TAG = 60;
const MAX_PLAYLISTS = 10;

/** Separates playlist titles in a spreadsheet cell; titles can hold commas, rarely a bar. */
const PLAYLIST_SEPARATOR = ' | ';

export interface SheetContext {
  settings: HandoffSettings;
  playlists: YouTubeCheckupPlaylist[];
  /** The brand channel's credits, links, hashtags and tags, added to every import; null adds none. */
  brand?: YouTubeCheckupBrand | null;
}

/** One video's details as read from an import, checked and ready to review. */
export interface ImportItem {
  videoId: string;
  title: string;
  description: string;
  tags: string[];
  /** Channel playlists to add the video to (matched by title or id), not already holding it. */
  playlistIds: string[];
  /** What AnimStudio added on top of the answer (credits, footer, hashtags, tags, a playlist), one line each. */
  added: string[];
  /** Why it can't be applied: a required field is missing or over YouTube's limit. */
  problems: string[];
  /** Applied anyway, but worth a look. */
  warnings: string[];
  /** Nothing in the title, description, tags or playlists differs from YouTube's. */
  unchanged: boolean;
  /** Comment ideas, when the answer had them; kept in the draft to copy, never posted. */
  pinnedComment?: string;
  engagementComment?: string;
}

export interface ImportResult {
  items: ImportItem[];
  /** Rows left out entirely, one line each. */
  skipped: string[];
  /** Set when nothing could be read at all. */
  error: string | null;
}

// --- export

/** The whole job as one JSON file: instructions on top, then every video with an empty "update" to fill. */
export function buildPackage(videos: YouTubeCheckupVideo[], ctx: SheetContext): string {
  const list = videos.slice(0, MAX_SHEET_VIDEOS);
  const playlistTitle = playlistTitles(ctx.playlists);
  return JSON.stringify({
    format: SHEET_FORMAT,
    channel: { title: ctx.settings.channelTitle, url: ctx.settings.channelUrl ?? null },
    exportedAt: new Date().toISOString(),
    instructions: joinLines([
      ...promptRules({ ...ctx.settings, playlists: ctx.playlists.map((p) => p.title) }, list.length),
      '',
      'This file is the job. Fill in "update" for every video (title, description and tags are required; playlists and pinnedComment are optional)',
      'and leave everything else as it is. Reply with the whole file as JSON - or just the list of videos, each with its videoId and update.',
    ]).split('\n'),
    playlists: ctx.playlists.map((p) => p.title),
    videos: list.map((v) => ({
      videoId: v.videoId,
      url: v.videoUrl,
      kind: v.isShort ? 'short' : 'video',
      durationSeconds: v.durationSeconds === null ? null : Math.round(v.durationSeconds),
      publishedAt: v.publishedAt,
      missing: v.issues.map((i) => i.message),
      current: {
        title: v.title,
        description: v.description,
        tags: v.tags,
        playlists: v.playlistIds.map((id) => playlistTitle.get(id) ?? id),
      },
      update: { title: '', description: '', tags: [] as string[], playlists: [] as string[], pinnedComment: '' },
    })),
  }, null, 2);
}

/** The same job as plain text, for an AI chat that takes a long message better than a file. */
export function buildPromptText(videos: YouTubeCheckupVideo[], ctx: SheetContext): string {
  const list = videos.slice(0, MAX_SHEET_VIDEOS);
  const playlistTitle = playlistTitles(ctx.playlists);
  return joinLines([
    ...promptRules({ ...ctx.settings, playlists: ctx.playlists.map((p) => p.title) }, list.length),
    '',
    'Reply with ONLY a JSON array, no other text, one item per video, in exactly this shape:',
    '[{"videoId": "…", "title": "…", "description": "…", "tags": ["…", "…"], "playlists": ["…"], "pinnedComment": "…"}]',
    'Use the videoId values exactly as given. title, description and tags are required for every video.',
    list.length > 50 ? 'If the answer is too long for one reply, answer in parts of 50 videos; each part is a JSON array on its own.' : '',
    '',
    ...list.flatMap((v, i) => [
      `### Video ${i + 1}`,
      `videoId: ${v.videoId}`,
      `kind: ${v.isShort ? 'YouTube Short' : 'YouTube video'}${v.durationSeconds ? `, ${Math.round(v.durationSeconds)} seconds` : ''}`,
      `current title: ${v.title || '(none)'}`,
      `current description: ${v.description.trim() || '(none)'}`,
      `current tags: ${v.tags.length ? v.tags.join(', ') : '(none)'}`,
      `current playlists: ${v.playlistIds.length ? v.playlistIds.map((id) => playlistTitle.get(id) ?? id).join(PLAYLIST_SEPARATOR) : '(none)'}`,
      `missing: ${v.issues.length ? v.issues.map((x) => x.message).join(' ') : 'nothing'}`,
      '',
    ]),
  ]);
}

/** A spreadsheet: current details beside empty "new_" columns to fill in Excel, Sheets or by an AI. */
export function buildSheetCsv(videos: YouTubeCheckupVideo[], ctx: SheetContext): string {
  const playlistTitle = playlistTitles(ctx.playlists);
  const header = [
    'videoId', 'url', 'kind', 'missing', 'current_title', 'current_description', 'current_tags', 'current_playlists',
    'new_title', 'new_description', 'new_tags', 'new_playlists', 'new_pinned_comment',
  ];
  const lines = videos.slice(0, MAX_SHEET_VIDEOS).map((v) => [
    v.videoId, v.videoUrl, v.isShort ? 'short' : 'video', v.issues.map((i) => i.message).join(' '),
    v.title, v.description, v.tags.join(', '), v.playlistIds.map((id) => playlistTitle.get(id) ?? id).join(PLAYLIST_SEPARATOR),
    '', '', '', '', '',
  ].map(csvCell).join(','));
  return '﻿' + [header.join(','), ...lines].join('\r\n');
}

/** Hands a file to the browser to save. */
export function download(content: string, fileName: string, type: string): void {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

// --- import

interface RawRow {
  label: string; videoId: string; title: unknown; description: unknown; tags: unknown; playlists: unknown;
  pinnedComment?: unknown; engagementComment?: unknown;
}

/**
 * Reads an import: an AnimStudio package, a JSON array (bare, in a ```json fence or with chat
 * around it), or a CSV spreadsheet. Only videos in <paramref name="videos"/> are kept, and each
 * is checked: title, description and tags are required.
 */
export function parseImport(text: string, videos: ReadonlyMap<string, YouTubeCheckupVideo>, ctx: SheetContext): ImportResult {
  const empty = (error: string): ImportResult => ({ items: [], skipped: [], error });
  const body = text.replace(/^﻿/, '');
  if (!body.trim()) return empty('The file or answer is empty.');
  if (body.length > MAX_IMPORT_CHARS) return empty('That is too much to read at once. Split it into smaller files.');

  const read = looksLikeCsv(body) ? readCsv(body) : readJson(body);
  if (typeof read === 'string') return empty(read);

  const skipped: string[] = [];
  const items: ImportItem[] = [];
  const seen = new Set<string>();
  let blank = 0;
  for (const row of read) {
    if (!videos.has(row.videoId)) {
      skipped.push(`${row.label}: "${row.videoId.slice(0, 20) || 'no videoId'}" isn't one of the videos checked on this page.`);
      continue;
    }
    if (seen.has(row.videoId)) {
      skipped.push(`${row.label}: ${row.videoId} appears twice; the first one was used.`);
      continue;
    }
    const item = checkRow(row, videos.get(row.videoId)!, ctx);
    if (!item) { blank++; continue; }
    seen.add(row.videoId);
    items.push(item);
  }
  if (blank > 0) skipped.push(`${blank} video${blank === 1 ? ' was' : 's were'} left blank in the file, so ${blank === 1 ? 'it was' : 'they were'} left alone.`);
  markDuplicates(items, videos);

  return { items, skipped, error: items.length === 0 && skipped.length === 0 ? 'No videos found in it.' : null };
}

/** One row checked against YouTube's limits and the video it is for; null when nothing was filled in. */
function checkRow(row: RawRow, v: YouTubeCheckupVideo, ctx: SheetContext): ImportItem | null {
  const problems: string[] = [];
  const warnings: string[] = [];
  const channelUrl = ctx.settings.channelUrl ?? null;

  const brand = ctx.brand ?? null;
  const channelName = brand?.channelName ?? ctx.settings.channelTitle;
  const retiredUrls = ctx.settings.retiredUrls ?? [];
  const retiredNames = ctx.settings.retiredNames ?? [];
  const added: string[] = [];

  const title = replaceRetiredNames(cleanLine(typeof row.title === 'string' ? row.title : ''), channelName, retiredNames);
  let description = typeof row.description === 'string' ? replaceRetiredNames(cleanText(row.description), channelName, retiredNames) : '';
  const rawTags = Array.isArray(row.tags) ? row.tags : typeof row.tags === 'string' ? row.tags.split(',') : [];
  const tagList = splitTags(rawTags.filter((t): t is string => typeof t === 'string').map((t) => cleanLine(t).slice(0, MAX_TAG)).join(','));
  const rawPlaylists = Array.isArray(row.playlists) ? row.playlists : typeof row.playlists === 'string' ? row.playlists.split('|') : [];
  const playlistNames = rawPlaylists.filter((p): p is string => typeof p === 'string').map((p) => cleanLine(p)).filter(Boolean);

  if (!title && !description && tagList.length === 0 && playlistNames.length === 0) return null;

  if (!title) problems.push('No title.');
  else if (title.length > MAX_TITLE) problems.push(`The title is ${title.length} characters; YouTube allows ${MAX_TITLE}.`);
  else if (FILE_NAME_TITLE.test(title)) problems.push('The title looks like a file name.');

  if (hasRetiredLink(description, retiredUrls)) {
    if (channelUrl) {
      description = replaceRetiredLinks(description, channelUrl, retiredUrls);
      warnings.push(`The old channel link was changed to ${channelUrl}.`);
    } else {
      warnings.push(`It still links ${retiredUrls.join(', ')}, which no longer opens.`);
    }
  }
  if (description) {
    const finished = finishDescription(description, v.isShort, brand, ctx.settings.language);
    description = finished.text;
    added.push(...finished.added);
    if (finished.leftOut) warnings.push(finished.leftOut);
  }
  const bytes = new TextEncoder().encode(description).length;
  if (!description) problems.push('No description.');
  else if (bytes > MAX_DESCRIPTION_BYTES) problems.push(`The description is ${bytes} bytes; YouTube allows ${MAX_DESCRIPTION_BYTES} (Hindi letters and emoji count as 3-4 each).`);
  else if (description.length < SHORT_DESCRIPTION_CHARS) warnings.push('The description is only a line or two.');

  if (tagList.length === 0) problems.push('No tags.');
  const finishedTags = finishTags(tagList, brand?.tags ?? []);
  const tags = finishedTags.tags;
  if (tagList.length > 0 && finishedTags.brandAdded > 0) added.push(`${finishedTags.brandAdded} channel tag${finishedTags.brandAdded === 1 ? '' : 's'}`);
  if (finishedTags.ownDropped > 0) {
    warnings.push(`${finishedTags.ownDropped} of the AI's tag${finishedTags.ownDropped === 1 ? '' : 's'} left out to stay within YouTube's tag limit${finishedTags.brandAdded > 0 ? ' with the channel tags' : ''}.`);
  }

  if (description && !HASHTAG.test(`${title}\n${description}`)) warnings.push('No hashtags.');
  else if (v.isShort && description && !/#shorts\b/i.test(`${title}\n${description}`)) warnings.push('A Short without #shorts.');

  const playlistIds: string[] = [];
  for (const name of playlistNames.slice(0, MAX_PLAYLISTS)) {
    const match = ctx.playlists.find((p) => p.id === name || p.title.trim().toLowerCase() === name.toLowerCase());
    if (!match) warnings.push(`There is no playlist called "${name.slice(0, 60)}" on this channel; it was left out.`);
    else if (!v.playlistIds.includes(match.id) && !playlistIds.includes(match.id)) playlistIds.push(match.id);
  }
  // A video in no playlist gets the one whose name clearly fits it, as the AI drafts do.
  if (playlistIds.length === 0 && v.playlistIds.length === 0 && ctx.playlists.length > 0 && title) {
    const best = rank(ctx.playlists, (p) => p.title, `${title}\n${tags.join(',')}\n${description.slice(0, 600)}`, null, 1)[0];
    if (best) {
      playlistIds.push(best.item.id);
      added.push(`playlist "${best.item.title.slice(0, 60)}" (it matches the title)`);
    }
  }

  if (v.madeForKids === null) warnings.push('The audience (made for kids or not) was never set - it is set from the choice above when you save.');

  const unchanged = title === v.title && description === v.description
    && tags.join(',') === v.tags.join(',') && playlistIds.length === 0;
  const comment = (value: unknown) => (typeof value === 'string' && value.trim() ? replaceRetiredNames(cleanText(value), channelName, retiredNames).slice(0, 1000) : undefined);
  const pinned = comment(row.pinnedComment);
  const pinnedComment = pinned ? commentWithLinks(pinned, brand, ctx.settings.language) : undefined;
  if (pinned && pinnedComment !== pinned) added.push('the channel link to the pinned comment');
  return {
    videoId: v.videoId, title, description, tags, playlistIds, added, problems, warnings, unchanged,
    pinnedComment, engagementComment: comment(row.engagementComment),
  };
}

/** Mirrors the server's YouTubeBrandKit: the line its credits block starts with. */
const CREDITS_RULE = '━━━━━━━━━━━━━━━━━━━━━━━━━━━';
const MAX_HASHTAGS = 15;
const HASHTAG_TOKEN = /^#[\p{L}\p{M}\p{N}_]+$/u;

/**
 * The answer's description finished the way the server finishes an AI draft (YouTubeBrandKit.Compose):
 * the body, the channel's credits block, the hashtags - the answer's own, #shorts for a Short, then the
 * brand's - and the channel footer last. Whatever doesn't fit YouTube's limit is left out, credits first.
 */
export function finishDescription(
  description: string, isShort: boolean, brand: YouTubeCheckupBrand | null, language: string,
): { text: string; added: string[]; leftOut: string | null } {
  const { body, hashtags: written } = liftHashtags(description);
  const added: string[] = [];

  const hashtags: string[] = [];
  const addTag = (tag: string, note: boolean) => {
    if (hashtags.length >= MAX_HASHTAGS || hashtags.some((h) => h.toLowerCase() === tag.toLowerCase())) return;
    if (!written.some((w) => w.toLowerCase() === tag.toLowerCase()) && new RegExp(`(^|\\s)${tag}(?![\\p{L}\\p{M}\\p{N}_])`, 'iu').test(body)) return;
    hashtags.push(tag);
    if (note) added.push(tag);
  };
  written.forEach((t) => addTag(t, false));
  if (isShort) addTag('#shorts', true);
  (brand?.hashtags ?? []).forEach((h) => addTag(`#${h}`, true));
  const hashLine = hashtags.join(' ');

  const credits = (language === 'hi' ? brand?.creditsHindi : brand?.creditsEnglish)?.trim() ?? '';
  const block = credits && !body.includes(CREDITS_RULE) ? credits : '';
  const footer = brand?.footer?.trim() ?? '';
  const foot = footer && !hasFooter(body, footer) ? footer : '';

  const fits = (text: string) => new TextEncoder().encode(text).length <= MAX_DESCRIPTION_BYTES;
  const join = (...parts: string[]) => parts.map((x) => x.trim()).filter(Boolean).join('\n\n');
  const hashNote = added.length > 0 ? [`hashtags ${added.join(' ')}`] : [];
  const tries: { text: string; added: string[]; leftOut: string | null }[] = [
    { text: join(body, block, hashLine, foot), added: [...(block ? ['credits'] : []), ...hashNote, ...(foot ? ['channel footer'] : [])], leftOut: null },
    { text: join(body, hashLine, foot), added: [...hashNote, ...(foot ? ['channel footer'] : [])], leftOut: block ? 'The credits were left out to stay within YouTube\'s 5000-byte limit.' : null },
    { text: join(body, hashLine), added: hashNote, leftOut: block || foot ? 'The credits and channel footer were left out to stay within YouTube\'s 5000-byte limit - shorten the description to fit them.' : null },
  ];
  return tries.find((t) => fits(t.text)) ?? { text: description, added: [], leftOut: null };
}

/** Hashtag-only lines at the end of the text, taken off it, and the hashtags they held (YouTubeBrandKit.LiftHashtags). */
function liftHashtags(text: string): { body: string; hashtags: string[] } {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const hashtags: string[] = [];
  while (lines.length > 0) {
    const last = lines[lines.length - 1].trim();
    if (!last) { lines.pop(); continue; }
    const tokens = last.split(/\s+/);
    if (!tokens.every((t) => HASHTAG_TOKEN.test(t))) break;
    hashtags.unshift(...tokens);
    lines.pop();
  }
  return { body: lines.join('\n').trimEnd(), hashtags };
}

/** The answer's tags with the channel's own after them; the channel's always fit, the answer's give way. */
function finishTags(own: string[], brand: string[]): { tags: string[]; brandAdded: number; ownDropped: number } {
  const brandTags = fitTagsTo(splitTags(brand.join(',')), 200)
    .filter((b) => !own.some((t) => t.toLowerCase() === b.toLowerCase()));
  const room = TAGS_BUDGET - (brandTags.length ? brandTags.join(',').length + 1 : 0);
  const kept = fitTagsTo(own, room);
  return { tags: [...kept, ...brandTags], brandAdded: brandTags.length, ownDropped: own.length - kept.length };
}

/** The comment with the subscribe link, then the studio and creator links, when it lacks them and they fit (YouTubeBrandKit.WithLinks). */
export function commentWithLinks(comment: string, brand: YouTubeCheckupBrand | null, language: string): string {
  const url = brand?.channelUrl?.trim();
  if (!url) return comment;
  const has = (link: string) => comment.toLowerCase().includes(link.replace(/\/+$/, '').toLowerCase());
  const fit = (text: string, addition: string) => (text.length + 2 + addition.length <= 1000 ? `${text}\n\n${addition}` : text);
  let out = comment.trim();
  if (!has(url)) {
    out = fit(out, language === 'hi'
      ? `🔔 ऐसे और दिव्य वीडियो के लिए चैनल को Subscribe करें: ${url}`
      : `🔔 Subscribe for more: ${url}`);
  }
  const others = [brand?.studioUrl, brand?.creatorUrl].filter((u): u is string => !!u?.trim() && !out.toLowerCase().includes(u.trim().replace(/\/+$/, '').toLowerCase()));
  if (others.length > 0) out = fit(out, `🌐 ${others.map((u) => u.trim()).join(' | ')}`);
  return out;
}

/** Warns where two videos would end up with the same title or description - search treats them as one. */
function markDuplicates(items: ImportItem[], videos: ReadonlyMap<string, YouTubeCheckupVideo>): void {
  const finalTitle = new Map<string, string>();
  const finalBody = new Map<string, string>();
  for (const v of videos.values()) {
    finalTitle.set(v.videoId, v.title.trim().toLowerCase());
    finalBody.set(v.videoId, v.description.trim());
  }
  for (const i of items) {
    finalTitle.set(i.videoId, i.title.trim().toLowerCase());
    finalBody.set(i.videoId, i.description.trim());
  }
  for (const item of items) {
    const title = item.title.trim().toLowerCase();
    const sameTitle = title ? [...finalTitle].filter(([id, t]) => id !== item.videoId && t === title).length : 0;
    if (sameTitle > 0) item.warnings.push(`The same title as ${sameTitle} other video${sameTitle === 1 ? '' : 's'} - make each one unique.`);
    const body = item.description.trim();
    const sameBody = body ? [...finalBody].filter(([id, d]) => id !== item.videoId && d === body).length : 0;
    if (sameBody > 0) item.warnings.push(`The same description as ${sameBody} other video${sameBody === 1 ? '' : 's'}.`);
  }
}

function fitTagsTo(tags: string[], max: number): string[] {
  const out: string[] = [];
  let length = 0;
  for (const tag of tags) {
    const add = (out.length ? 1 : 0) + tag.length;
    if (length + add > max) break;
    out.push(tag);
    length += add;
  }
  return out;
}

/** Rows from a JSON answer or package; a message when it can't be read. */
function readJson(text: string): RawRow[] | string {
  let data: unknown;
  try {
    data = JSON.parse(text.trim().startsWith('{') || text.trim().startsWith('[') ? text : extractJson(text));
  } catch {
    try {
      data = JSON.parse(extractJson(text));
    } catch {
      return 'It isn\'t valid JSON or CSV. Ask your AI tool to reply with only the JSON, or save the spreadsheet as CSV.';
    }
  }
  const list = Array.isArray(data) ? data : isRecord(data) && Array.isArray(data['videos']) ? data['videos'] : isRecord(data) ? [data] : null;
  if (!list) return 'It should be a list of videos.';
  return list.map((item: unknown, i: number): RawRow => {
    const label = `Item ${i + 1}`;
    if (!isRecord(item)) return { label, videoId: '', title: '', description: '', tags: [], playlists: [] };
    const update = isRecord(item['update']) ? item['update'] : isRecord(item['new']) ? item['new'] : item;
    return {
      label,
      videoId: typeof item['videoId'] === 'string' ? item['videoId'].trim() : '',
      title: update['title'],
      description: update['description'],
      tags: update['tags'],
      playlists: update['playlists'],
      pinnedComment: update['pinnedComment'],
      engagementComment: update['engagementComment'],
    };
  });
}

/** Rows from a spreadsheet; the "new_" columns win over plain ones when both are there. */
function readCsv(text: string): RawRow[] | string {
  const table = parseCsv(text);
  if (table.length < 2) return 'The spreadsheet has no rows under its header.';
  const header = table[0].map((h) => h.trim().toLowerCase().replace(/[\s-]+/g, '_'));
  const col = (...names: string[]) => names.map((n) => header.indexOf(n)).find((i) => i >= 0) ?? -1;
  const id = col('videoid', 'video_id', 'id');
  if (id < 0) return 'The spreadsheet needs a videoId column.';
  const title = col('new_title', 'title');
  const description = col('new_description', 'description');
  const tags = col('new_tags', 'tags');
  const playlists = col('new_playlists', 'playlists');
  const pinnedComment = col('new_pinned_comment', 'pinned_comment', 'pinnedcomment');
  const cell = (row: string[], i: number) => (i >= 0 ? unneutralize(row[i] ?? '') : '');
  return table.slice(1)
    .filter((row) => row.some((c) => c.trim()))
    .map((row, i): RawRow => ({
      label: `Row ${i + 2}`,
      videoId: cell(row, id).trim(),
      title: cell(row, title),
      description: cell(row, description),
      tags: cell(row, tags),
      playlists: cell(row, playlists),
      pinnedComment: cell(row, pinnedComment),
    }));
}

/** Whether the text is a spreadsheet rather than JSON: its first line is a header naming a videoId column. */
function looksLikeCsv(text: string): boolean {
  const first = text.trimStart().split(/\r?\n/, 1)[0] ?? '';
  return !/^[[{`]/.test(first) && /(^|,)"?(videoid|video_id|video id)"?(,|$)/i.test(first);
}

/** RFC 4180: quoted cells may hold commas, quotes ("") and line breaks. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"' && cell === '') quoted = true;
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += ch;
  }
  if (cell !== '' || row.length > 0) { row.push(cell); rows.push(row); }
  return rows;
}

/** Undoes csvCell's guard, which puts a ' before a cell starting with = + - or @. */
function unneutralize(value: string): string {
  return /^'[=+\-@\t\r]/.test(value) ? value.slice(1) : value;
}

function playlistTitles(playlists: YouTubeCheckupPlaylist[]): Map<string, string> {
  return new Map(playlists.map((p) => [p.id, p.title]));
}

// --- review

/** Tags the import adds and takes away, for the review's diff. */
export function tagDiff(before: string[], after: string[]): { added: string[]; removed: string[]; kept: number } {
  const was = new Set(before.map((t) => t.toLowerCase()));
  const now = new Set(after.map((t) => t.toLowerCase()));
  return {
    added: after.filter((t) => !was.has(t.toLowerCase())),
    removed: before.filter((t) => !now.has(t.toLowerCase())),
    kept: after.filter((t) => was.has(t.toLowerCase())).length,
  };
}
