import type { BrandChannel } from '../../core/models/api.models';
import { youTubeTagsLength } from '../../core/models/youtube.models';
import type { YouTubeCategory, YouTubePublishStatus } from '../../core/models/youtube.models';
import type { ChannelBranding, ChannelPublishSettings } from '../../core/services/admin-settings.service';

/** The limits below mirror what the server enforces when the page is saved. */
export const MAX_TAGS_LENGTH = 500;
export const MAX_TAG_COUNT = 60;
export const MAX_FOOTER_BYTES = 2500;
export const MAX_DESCRIPTION_BYTES = 5000;
export const MAX_COMMENT_LENGTH = 10_000;

export const PRIVACY_OPTIONS = [
  { id: 'public', label: 'Public', hint: 'Anyone can find and watch it the moment it is uploaded.' },
  { id: 'unlisted', label: 'Unlisted', hint: 'Only people with the link can watch it.' },
  { id: 'private', label: 'Private', hint: 'Only you can watch it until you change it.' },
] as const;

export type Privacy = (typeof PRIVACY_OPTIONS)[number]['id'];

export function isPrivacy(value: unknown): value is Privacy {
  return PRIVACY_OPTIONS.some((o) => o.id === value);
}

// ---------------------------------------------------------------------------------------- tags

export interface TagRules {
  noun: string;
  maxCount: number;
  maxLength: number | null;
  /** The total the list may add up to, measured the way the server measures it. */
  budget: { limit: number; unit: string; measure: (tags: readonly string[]) => number } | null;
  /** Characters that cut pasted or typed text into separate tags. */
  split: RegExp;
  clean: (raw: string) => string;
  /** Why a cleaned tag can't be used, or null. */
  reject: (tag: string) => string | null;
}

const tidy = (raw: string): string => raw.replace(/\p{Cc}/gu, ' ').trim().replace(/^#+/, '').replace(/\s+/g, ' ').trim();
const BAD_TAG = /[<>,"]/;

/** The tags added to every upload of a channel: YouTube's 500-character budget applies. */
export const CHANNEL_TAG_RULES: TagRules = {
  noun: 'tag',
  maxCount: MAX_TAG_COUNT,
  maxLength: null,
  budget: { limit: MAX_TAGS_LENGTH, unit: 'characters', measure: (tags) => youTubeTagsLength([...tags]) },
  split: /[,\n\r]/,
  clean: tidy,
  reject: (t) => (BAD_TAG.test(t) ? 'Tags can’t contain < > , or quotes.' : null),
};

/** Hashtags in AI-written descriptions: letters, numbers and _ only. */
export const HASHTAG_RULES: TagRules = {
  noun: 'hashtag',
  maxCount: 10,
  maxLength: 30,
  budget: null,
  split: /[\s,]/,
  clean: (raw) => raw.replace(/\p{Cc}/gu, ' ').trim().replace(/^#+/, '').trim(),
  reject: (t) => (/^[\p{L}\p{M}\p{N}_]+$/u.test(t) ? null : 'Hashtags use letters, numbers and _ only.'),
};

/** Extra search tags offered with a video. */
export const BRAND_TAG_RULES: TagRules = {
  noun: 'tag',
  maxCount: 15,
  maxLength: 40,
  budget: null,
  split: /[,\n\r]/,
  clean: tidy,
  reject: (t) => (BAD_TAG.test(t) ? 'Tags can’t contain < > , or quotes.' : null),
};

export interface AddTagsResult {
  tags: string[];
  added: string[];
  duplicates: string[];
  rejected: { tag: string; reason: string }[];
  /** Left out because the list is full or would pass the budget. */
  overflow: { tag: string; reason: string }[];
}

/** Adds typed or pasted text to a list: split, cleaned, de-duplicated ignoring case, and kept inside the rules. */
export function addTags(existing: readonly string[], raw: string, rules: TagRules): AddTagsResult {
  const tags = [...existing];
  const seen = new Set(tags.map((t) => t.toLowerCase()));
  const out: AddTagsResult = { tags, added: [], duplicates: [], rejected: [], overflow: [] };

  for (const piece of raw.split(rules.split)) {
    const tag = rules.clean(piece);
    if (!tag) continue;
    if (seen.has(tag.toLowerCase())) { out.duplicates.push(tag); continue; }
    if (rules.maxLength !== null && tag.length > rules.maxLength) {
      out.rejected.push({ tag, reason: `Longer than ${rules.maxLength} characters.` });
      continue;
    }
    const why = rules.reject(tag);
    if (why) { out.rejected.push({ tag, reason: why }); continue; }
    if (tags.length >= rules.maxCount) {
      out.overflow.push({ tag, reason: `Up to ${rules.maxCount} ${rules.noun}s fit.` });
      continue;
    }
    if (rules.budget && rules.budget.measure([...tags, tag]) > rules.budget.limit) {
      out.overflow.push({ tag, reason: `It would pass the ${rules.budget.limit}-${rules.budget.unit.replace(/s$/, '')} budget.` });
      continue;
    }
    seen.add(tag.toLowerCase());
    tags.push(tag);
    out.added.push(tag);
  }
  return out;
}

export function tagBudget(tags: readonly string[], rules: TagRules): { used: number; limit: number; left: number; unit: string } | null {
  if (!rules.budget) return null;
  const used = rules.budget.measure(tags);
  return { used, limit: rules.budget.limit, left: rules.budget.limit - used, unit: rules.budget.unit };
}

/** Why a list already in the form (loaded from the server) breaks the rules, or null. */
export function tagListProblem(tags: readonly string[], rules: TagRules): string | null {
  if (tags.length > rules.maxCount) return `Use at most ${rules.maxCount} ${rules.noun}s (there are ${tags.length}).`;
  const b = tagBudget(tags, rules);
  if (b && b.used > b.limit) return `${rules.noun[0].toUpperCase()}${rules.noun.slice(1)}s can total at most ${b.limit} ${b.unit} (these are ${b.used}).`;
  for (const t of tags) {
    if (rules.maxLength !== null && t.length > rules.maxLength) return `“${t}” is longer than ${rules.maxLength} characters.`;
    const why = rules.reject(t);
    if (why) return `“${t}”: ${why}`;
  }
  return null;
}

// ------------------------------------------------------------------------------ text, as the server reads it

/** Trims, and drops control characters YouTube would reject, keeping line breaks - as the server does. */
export function cleanMultiline(value: string | null | undefined): string {
  if (!value) return '';
  let out = '';
  for (const ch of value.replace(/\r\n/g, '\n')) {
    if (ch === '\n') out += ch;
    else if (/\p{Cc}/u.test(ch)) { if (ch === '\t') out += ' '; }
    else out += ch;
  }
  return out.trim();
}

export function utf8Bytes(text: string): number {
  return new TextEncoder().encode(text).length;
}

export interface FooterReport {
  text: string;
  bytes: number;
  chars: number;
  lines: number;
  limit: number;
  left: number;
  hasAngle: boolean;
  over: boolean;
  /** Bytes each video's own description keeps for itself. */
  roomForVideo: number;
}

export function footerReport(footer: string | null | undefined): FooterReport {
  const text = cleanMultiline(footer);
  const bytes = utf8Bytes(text);
  return {
    text, bytes,
    chars: Array.from(text).length,
    lines: text ? text.split('\n').length : 0,
    limit: MAX_FOOTER_BYTES,
    left: MAX_FOOTER_BYTES - bytes,
    hasAngle: /[<>]/.test(text),
    over: bytes > MAX_FOOTER_BYTES,
    roomForVideo: MAX_DESCRIPTION_BYTES - bytes - (text ? 2 : 0),
  };
}

export function footerProblem(footer: string | null | undefined): string | null {
  const r = footerReport(footer);
  if (r.over) return `The footer can be at most ${MAX_FOOTER_BYTES} bytes (this one is ${r.bytes}; emoji and non-Latin letters count as more than one).`;
  if (r.hasAngle) return 'YouTube doesn’t allow < or > in a description.';
  return null;
}

export function commentProblem(comment: string | null | undefined): string | null {
  const text = (comment ?? '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  if (text.length > MAX_COMMENT_LENGTH) return `A comment can be at most ${MAX_COMMENT_LENGTH} characters (this one is ${text.length}).`;
  if (/[\p{Cc}]/u.test(text.replace(/[\n\t]/g, ''))) return 'The comment contains characters YouTube won’t accept.';
  return null;
}

/** A line of the footer split into plain text and web addresses, so a preview can colour the links. */
export function footerSegments(line: string): { text: string; link: boolean }[] {
  const parts: { text: string; link: boolean }[] = [];
  let last = 0;
  for (const m of line.matchAll(/https?:\/\/[^\s<>"]+/g)) {
    if (m.index > last) parts.push({ text: line.slice(last, m.index), link: false });
    parts.push({ text: m[0], link: true });
    last = m.index + m[0].length;
  }
  if (last < line.length) parts.push({ text: line.slice(last), link: false });
  return parts;
}

// --------------------------------------------------------------------------------------- branding

export const BRAND_TEXT_MAX: Readonly<Record<'channelName' | 'tagline' | 'engineName' | 'visualsCredit', number>> = {
  channelName: 80, tagline: 120, engineName: 60, visualsCredit: 120,
};

export function brandTextProblem(value: string | null | undefined, max: number): string | null {
  const clean = (value ?? '').replace(/[\p{C}\s]+/gu, ' ').trim();
  if (!clean) return null;
  if (/[<>]/.test(clean)) return 'Branding text can’t contain < or >.';
  return clean.length > max ? `Keep this under ${max} characters (it is ${clean.length}).` : null;
}

export function brandUrlProblem(value: string | null | undefined): string | null {
  const clean = (value ?? '').trim();
  if (!clean) return null;
  if (clean.length > 300 || /\s/.test(clean) || /[<>]/.test(clean)) return 'Use a full https:// link, up to 300 characters, with no spaces.';
  try {
    return new URL(clean).protocol === 'https:' ? null : 'Use a full https:// link.';
  } catch {
    return 'Use a full https:// link.';
  }
}

export function emptyBranding(): ChannelBranding {
  return {
    channelName: null, tagline: null, channelUrl: null, studioUrl: null, creatorUrl: null,
    engineName: null, visualsCredit: null, hashtags: [], tags: [],
  };
}

/** The single-line branding fields, in form order. */
export type BrandTextField = 'channelName' | 'tagline' | 'channelUrl' | 'studioUrl' | 'creatorUrl' | 'engineName' | 'visualsCredit';

/** The fields that are the same for every channel, and so live in the studio-wide defaults. */
export const SHARED_BRAND_FIELDS: readonly BrandTextField[] = ['tagline', 'studioUrl', 'creatorUrl', 'engineName', 'visualsCredit'];

export type BrandSource = 'studio' | 'youtube';

/** What a blank field shows instead, and where it comes from. */
export interface Inherited {
  value: string | null;
  source: BrandSource | null;
}

export interface InheritedBranding {
  fields: Record<BrandTextField, Inherited>;
  hashtags: string[];
  tags: string[];
  /** False while neither the channel nor the studio has set anything: nothing is added then, not even the YouTube values. */
  active: boolean;
}

const filled = (v: string | null | undefined): string | null => ((v ?? '').trim() ? (v ?? '').trim() : null);

export function hasAnyBranding(b: ChannelBranding | null | undefined): boolean {
  if (!b) return false;
  return (['channelName', 'tagline', 'channelUrl', 'studioUrl', 'creatorUrl', 'engineName', 'visualsCredit'] as const).some((k) => !!filled(b[k]))
    || (b.hashtags?.length ?? 0) > 0 || (b.tags?.length ?? 0) > 0;
}

/** The channel's YouTube address, built the way the server builds it (YouTubeBrandKit.AutoChannelUrl). */
export function autoChannelUrl(handle: string | null | undefined, channelId: string | null | undefined): string | null {
  const h = (handle ?? '').trim().replace(/^@+/, '');
  if (h && h.length <= 100 && /^[\p{L}\p{M}\p{N}._-]+$/u.test(h)) return `https://youtube.com/@${h}`;
  const id = (channelId ?? '').trim();
  return id && id.length <= 64 && /^[A-Za-z0-9_-]+$/.test(id) ? `https://www.youtube.com/channel/${id}` : null;
}

/**
 * What each blank branding field of a channel falls back to - mirrors YouTubeBrandKit.Effective on the
 * server: the studio-wide default, else (name and link only) the linked YouTube channel.
 */
export function inheritedBranding(
  studio: ChannelBranding | null | undefined, settings: ChannelPublishSettings | null | undefined, brandName: string | null | undefined,
): InheritedBranding {
  const from = (value: string | null, source: BrandSource): Inherited => (value ? { value, source } : { value: null, source: null });
  const name = filled((settings?.youTubeChannelTitle ?? brandName ?? '').replace(/[<>]/g, ''));
  const fields = {
    channelName: from(name, 'youtube'),
    channelUrl: from(autoChannelUrl(settings?.youTubeChannelHandle, settings?.youTubeChannelId), 'youtube'),
  } as Record<BrandTextField, Inherited>;
  for (const k of SHARED_BRAND_FIELDS) fields[k] = from(filled(studio?.[k]), 'studio');
  return {
    fields,
    hashtags: [...(studio?.hashtags ?? [])],
    tags: [...(studio?.tags ?? [])],
    active: hasAnyBranding(settings?.branding) || hasAnyBranding(studio),
  };
}

// ----------------------------------------------------------------------------------------- health

export type HealthLevel = 'ok' | 'info' | 'warn' | 'err';
export type HealthAction = 'reconnect' | 'link' | 'visibility' | 'tags' | 'footer' | 'comment' | null;

export interface HealthIssue {
  id: string;
  level: HealthLevel;
  title: string;
  detail: string;
  action: HealthAction;
}

export interface Health {
  level: HealthLevel;
  label: string;
  issues: HealthIssue[];
}

const RANK: Readonly<Record<HealthLevel, number>> = { ok: 0, info: 1, warn: 2, err: 3 };

export function worst(levels: readonly HealthLevel[]): HealthLevel {
  return levels.reduce<HealthLevel>((a, b) => (RANK[b] > RANK[a] ? b : a), 'ok');
}

/**
 * What is wrong (or merely worth knowing) about a channel's publishing setup. The connection
 * facts come from the brand channel list and the admin's YouTube connections - no extra call -
 * and the defaults are judged once they have been read.
 */
export function channelHealth(
  brand: BrandChannel, yt: YouTubePublishStatus | null, settings: ChannelPublishSettings | null | undefined,
): Health {
  const issues: HealthIssue[] = [];
  const linked = brand.youTubeChannelId ?? null;
  const conn = linked && yt ? yt.channels.find((c) => c.channelId === linked) : undefined;
  const comment = (settings?.firstComment ?? '').trim();

  if (!linked) {
    issues.push({
      id: 'unlinked', level: 'info', title: 'Not linked to a YouTube channel', action: 'link',
      detail: 'The Publish dialog asks which YouTube channel to use each time.',
    });
  } else if (yt) {
    if (!conn) {
      issues.push({
        id: 'not-connected', level: 'warn', title: 'Not connected under your account', action: 'reconnect',
        detail: 'Whoever publishes to this channel has to connect it with Google first.',
      });
    } else if (conn.needsReconnect) {
      issues.push({
        id: 'token', level: 'err', title: 'Reconnect needed', action: 'reconnect',
        detail: 'Google no longer accepts the saved access (it expired or was revoked), so uploads to this channel fail.',
      });
    } else if (!conn.canComment) {
      issues.push({
        id: 'permission', level: comment ? 'warn' : 'info', title: 'Comment permission missing', action: 'reconnect',
        detail: comment
          ? 'This connection was made before comments were requested, so the first comment can’t be posted. Reconnect to allow it.'
          : 'This connection can’t post comments. Reconnect if you want a first comment on uploads.',
      });
    }
  }

  if (settings) {
    if (!isPrivacy((settings.privacy ?? '').toLowerCase())) {
      issues.push({
        id: 'visibility', level: 'warn', title: 'No default visibility', action: 'visibility',
        detail: 'Choose Public, Unlisted or Private so uploads don’t start with an arbitrary setting.',
      });
    }
    if (tagListProblem(settings.tags ?? [], CHANNEL_TAG_RULES)) {
      issues.push({ id: 'tags', level: 'warn', title: 'Tags break YouTube’s limits', action: 'tags', detail: tagListProblem(settings.tags ?? [], CHANNEL_TAG_RULES)! });
    }
    const fp = footerProblem(settings.descriptionFooter);
    if (fp) issues.push({ id: 'footer', level: 'warn', title: 'Description footer is not valid', action: 'footer', detail: fp });
    if (comment && settings.madeForKids) {
      issues.push({
        id: 'kids-comment', level: 'info', title: 'First comment won’t be posted', action: 'comment',
        detail: 'YouTube turns comments off on videos made for kids.',
      });
    } else if (comment && (settings.privacy ?? '').toLowerCase() === 'private') {
      issues.push({
        id: 'private-comment', level: 'info', title: 'First comment waits for a public video', action: 'comment',
        detail: 'A private video has no one to read a comment, so it isn’t posted while uploads start private.',
      });
    }
  }

  const level = worst(issues.map((i) => i.level));
  const top = [...issues].sort((a, b) => RANK[b.level] - RANK[a.level])[0];
  return { level, label: top ? top.title : 'Ready to publish', issues: issues.sort((a, b) => RANK[b.level] - RANK[a.level]) };
}

export const HEALTH_SHORT: Readonly<Record<HealthLevel, string>> = { ok: 'Ready', info: 'Note', warn: 'Check', err: 'Reconnect' };

// ------------------------------------------------------------------------------------ bulk apply

export type BulkTagMode = 'off' | 'add' | 'replace';

export interface BulkChoice {
  privacy: boolean;
  categoryId: boolean;
  madeForKids: boolean;
  notifySubscribers: boolean;
  tags: BulkTagMode;
  descriptionFooter: boolean;
  firstComment: boolean;
  /**
   * The shared AI branding fields (tagline, links, credits, hashtags, tags) as the form has them -
   * blanks included, which clears a target's own value so it inherits the studio defaults again.
   * The channel name and YouTube link are each channel's own and are never copied.
   */
  branding: boolean;
}

export const NO_BULK: BulkChoice = {
  privacy: false, categoryId: false, madeForKids: false, notifySubscribers: false, tags: 'off', descriptionFooter: false, firstComment: false,
  branding: false,
};

export function bulkFieldCount(c: BulkChoice): number {
  return [c.privacy, c.categoryId, c.madeForKids, c.notifySubscribers, c.tags !== 'off', c.descriptionFooter, c.firstComment, c.branding]
    .filter(Boolean).length;
}

/** How many branding fields a channel sets itself (the rest inherit). */
export function brandOverrideCount(b: ChannelBranding | null | undefined): number {
  if (!b) return 0;
  return (['channelName', 'tagline', 'channelUrl', 'studioUrl', 'creatorUrl', 'engineName', 'visualsCredit'] as const).filter((k) => !!filled(b[k])).length
    + ((b.hashtags?.length ?? 0) > 0 ? 1 : 0) + ((b.tags?.length ?? 0) > 0 ? 1 : 0);
}

/** The target's branding with the source's shared fields copied over; the target keeps its own name and link. */
export function copySharedBranding(source: ChannelBranding | null | undefined, target: ChannelBranding | null | undefined): ChannelBranding | null {
  const next: ChannelBranding = { ...emptyBranding(), ...(target ?? {}), hashtags: [...(source?.hashtags ?? [])], tags: [...(source?.tags ?? [])] };
  for (const k of SHARED_BRAND_FIELDS) next[k] = filled(source?.[k]);
  next.channelName = filled(target?.channelName);
  next.channelUrl = filled(target?.channelUrl);
  return hasAnyBranding(next) ? next : null;
}

const overridesLabel = (b: ChannelBranding | null | undefined): string => {
  const n = brandOverrideCount(b);
  return n === 0 ? 'all inherited' : `${n} own value${n === 1 ? '' : 's'}`;
};

export interface BulkChange {
  field: string;
  from: string;
  to: string;
}

export interface BulkPlan {
  after: ChannelPublishSettings;
  changes: BulkChange[];
  /** Why this channel can't take the change, or null. */
  blocked: string | null;
}

const sameText = (a: string | null | undefined, b: string | null | undefined): boolean => cleanMultiline(a) === cleanMultiline(b);

const shorten = (text: string, n = 38): string => {
  const one = text.replace(/\s+/g, ' ').trim();
  return one.length > n ? `${one.slice(0, n - 1)}…` : one || 'empty';
};

const tagCount = (n: number): string => `${n} tag${n === 1 ? '' : 's'}`;

/** What applying the chosen fields of `source` does to `target`. */
export function planBulk(
  source: ChannelPublishSettings, target: ChannelPublishSettings, choice: BulkChoice, categories: readonly YouTubeCategory[],
): BulkPlan {
  const after: ChannelPublishSettings = { ...target, tags: [...(target.tags ?? [])] };
  const changes: BulkChange[] = [];
  let blocked: string | null = null;
  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? id;
  const privacyName = (p: string) => PRIVACY_OPTIONS.find((o) => o.id === (p ?? '').toLowerCase())?.label ?? (p || 'not set');

  if (choice.privacy && (source.privacy ?? '').toLowerCase() !== (target.privacy ?? '').toLowerCase()) {
    after.privacy = (source.privacy ?? '').toLowerCase() as Privacy;
    changes.push({ field: 'Visibility', from: privacyName(target.privacy), to: privacyName(source.privacy) });
  }
  if (choice.categoryId && source.categoryId !== target.categoryId) {
    after.categoryId = source.categoryId;
    changes.push({ field: 'Category', from: categoryName(target.categoryId), to: categoryName(source.categoryId) });
  }
  if (choice.madeForKids && source.madeForKids !== target.madeForKids) {
    after.madeForKids = source.madeForKids;
    changes.push({ field: 'Audience', from: target.madeForKids ? 'Made for kids' : 'Not for kids', to: source.madeForKids ? 'Made for kids' : 'Not for kids' });
  }
  if (choice.notifySubscribers && source.notifySubscribers !== target.notifySubscribers) {
    after.notifySubscribers = source.notifySubscribers;
    changes.push({ field: 'Notify subscribers', from: target.notifySubscribers ? 'On' : 'Off', to: source.notifySubscribers ? 'On' : 'Off' });
  }

  if (choice.tags === 'replace') {
    const next = source.tags ?? [];
    const now = target.tags ?? [];
    if (next.length !== now.length || next.some((t, i) => t !== now[i])) {
      after.tags = [...next];
      changes.push({ field: 'Tags', from: tagCount(now.length), to: `${tagCount(next.length)} (replaced)` });
    }
  } else if (choice.tags === 'add') {
    const merged = addTags(target.tags ?? [], (source.tags ?? []).join('\n'), CHANNEL_TAG_RULES);
    if (merged.overflow.length > 0) {
      blocked = `The tags won’t fit: ${merged.overflow.length} would pass the limit (${merged.overflow[0].reason})`;
    } else if (merged.added.length > 0) {
      after.tags = merged.tags;
      changes.push({ field: 'Tags', from: tagCount((target.tags ?? []).length), to: `+${merged.added.length}: ${shorten(merged.added.join(', '))}` });
    }
  }

  if (choice.descriptionFooter && !sameText(source.descriptionFooter, target.descriptionFooter)) {
    const text = cleanMultiline(source.descriptionFooter);
    after.descriptionFooter = text || null;
    changes.push({
      field: 'Footer',
      from: cleanMultiline(target.descriptionFooter) ? `${utf8Bytes(cleanMultiline(target.descriptionFooter))} bytes` : 'empty',
      to: text ? `${utf8Bytes(text)} bytes` : 'cleared',
    });
  }
  if (choice.firstComment && !sameText(source.firstComment, target.firstComment)) {
    const text = (source.firstComment ?? '').trim();
    after.firstComment = text || null;
    changes.push({ field: 'First comment', from: (target.firstComment ?? '').trim() ? shorten(target.firstComment ?? '') : 'none', to: text ? shorten(text) : 'cleared' });
  }
  if (choice.branding) {
    const next = copySharedBranding(source.branding, target.branding);
    const norm = (b: ChannelBranding | null | undefined) => JSON.stringify(hasAnyBranding(b) ? copySharedBranding(b, b) : null);
    if (norm(next) !== norm(target.branding)) {
      after.branding = next;
      changes.push({ field: 'AI branding', from: overridesLabel(target.branding), to: overridesLabel(next) });
    }
  }

  return { after, changes, blocked };
}

/** The form fields a bulk apply reads, as one string - to notice when the form changed after a preview. */
export function bulkStamp(source: ChannelPublishSettings | null, choice: BulkChoice): string {
  if (!source) return '';
  return JSON.stringify([
    choice, source.privacy, source.categoryId, source.madeForKids, source.notifySubscribers, source.tags, source.descriptionFooter, source.firstComment,
    source.branding ?? null,
  ]);
}

/** A short name for what each choice is, for the summary line. */
export function describeChoice(c: BulkChoice): string {
  const parts: string[] = [];
  if (c.privacy) parts.push('visibility');
  if (c.categoryId) parts.push('category');
  if (c.madeForKids) parts.push('audience');
  if (c.notifySubscribers) parts.push('notifications');
  if (c.tags !== 'off') parts.push(c.tags === 'add' ? 'tags (added)' : 'tags (replaced)');
  if (c.descriptionFooter) parts.push('footer');
  if (c.firstComment) parts.push('first comment');
  if (c.branding) parts.push('AI branding');
  return parts.join(', ');
}

export function brandKey(c: BrandChannel): string {
  return c.isDefault ? 'default' : c.id;
}
