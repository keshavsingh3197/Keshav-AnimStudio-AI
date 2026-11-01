import type { BrandChannel } from '../../core/models/api.models';
import type { LiveStreamKeyStatus, LiveStreamSetup } from '../../core/models/live-stream.models';
import type { YouTubeChannel } from '../../core/models/youtube.models';
import { fold } from './admin-channel-utils';

/** Mirrors BrandChannel.MaxNameLength / MaxChannels on the server. */
export const MAX_NAME_LENGTH = 60;
export const MAX_CHANNELS = 1000;

export type Connection = 'connected' | 'reconnect' | 'elsewhere' | 'none' | 'unknown';
/** `off` when Go Live isn't set up, so nothing about keys is shown at all. */
export type KeyState = 'saved' | 'missing' | 'refused' | 'off';

export type ViewFilter = 'all' | 'attention' | 'youtube' | 'not-youtube' | 'unused';
export type SortKey =
  | 'default-first' | 'name-asc' | 'name-desc' | 'projects-desc' | 'projects-asc'
  | 'newest' | 'oldest' | 'attention' | 'custom';
export type WatermarkFilter = 'any' | 'logo' | 'text' | 'none';
export type EndCardFilter = 'any' | 'set' | 'none';
export type KeyFilter = 'any' | 'saved' | 'missing' | 'refused';

export const PAGE_SIZES = [25, 50, 100] as const;
export type PageSize = (typeof PAGE_SIZES)[number];

export interface Facets {
  watermark: WatermarkFilter;
  endCard: EndCardFilter;
  key: KeyFilter;
}

export interface ViewPrefs {
  view: ViewFilter;
  sort: SortKey;
  facets: Facets;
  pageSize: PageSize;
}

export const ANY_FACETS: Facets = { watermark: 'any', endCard: 'any', key: 'any' };
export const DEFAULT_PREFS: ViewPrefs = { view: 'all', sort: 'default-first', facets: ANY_FACETS, pageSize: 25 };

export const VIEW_LABELS: Readonly<Record<ViewFilter, string>> = {
  all: 'All',
  attention: 'Needs attention',
  youtube: 'On YouTube',
  'not-youtube': 'Not on YouTube',
  unused: 'Unused',
};

export const SORT_LABELS: Readonly<Record<SortKey, string>> = {
  'default-first': 'Default first, then name',
  'name-asc': 'Name A to Z',
  'name-desc': 'Name Z to A',
  'projects-desc': 'Most projects',
  'projects-asc': 'Fewest projects',
  newest: 'Newest first',
  oldest: 'Oldest first',
  attention: 'Needs attention first',
  custom: 'My order (this browser)',
};

export const PREFS_KEY = 'animstudio.admin.channels.view';
export const ORDER_KEY = 'animstudio.admin.channels.order';

const oneOf = <T extends string>(allowed: readonly T[], value: unknown, fallback: T): T =>
  typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;

/** Whatever was stored, made safe: unknown or tampered values fall back to the defaults. */
export function sanitizePrefs(raw: unknown): ViewPrefs {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const f = (o['facets'] && typeof o['facets'] === 'object' ? o['facets'] : {}) as Record<string, unknown>;
  const size = PAGE_SIZES.find((s) => s === o['pageSize']) ?? DEFAULT_PREFS.pageSize;
  return {
    view: oneOf(Object.keys(VIEW_LABELS) as ViewFilter[], o['view'], DEFAULT_PREFS.view),
    sort: oneOf(Object.keys(SORT_LABELS) as SortKey[], o['sort'], DEFAULT_PREFS.sort),
    facets: {
      watermark: oneOf(['any', 'logo', 'text', 'none'], f['watermark'], 'any'),
      endCard: oneOf(['any', 'set', 'none'], f['endCard'], 'any'),
      key: oneOf(['any', 'saved', 'missing', 'refused'], f['key'], 'any'),
    },
    pageSize: size,
  };
}

export function sanitizeOrder(raw: unknown): string[] {
  return Array.isArray(raw) ? raw.filter((x): x is string => typeof x === 'string').slice(0, MAX_CHANNELS + 1) : [];
}

export interface ChannelRow {
  channel: BrandChannel;
  /** Position on the server: the default first, then oldest to newest. */
  order: number;
  /** Null until the project counts are known (or when they couldn't be read). */
  projects: number | null;
  connection: Connection;
  key: KeyState;
  keyLabel: string;
  watermark: 'logo' | 'text' | 'none';
  endCard: string;
  attention: ('reconnect' | 'key-refused')[];
}

export function connectionOf(c: BrandChannel, connected: readonly YouTubeChannel[] | null): Connection {
  if (!c.youTubeChannelId) return 'none';
  if (!connected) return 'unknown';
  const mine = connected.find((x) => x.channelId === c.youTubeChannelId);
  if (!mine) return 'elsewhere';
  return mine.needsReconnect ? 'reconnect' : 'connected';
}

/** The worst state across a channel's destinations - a refused key is what needs doing first. */
export function keySummary(keys: readonly LiveStreamKeyStatus[]): { state: Exclude<KeyState, 'off'>; label: string } {
  if (keys.some((k) => k.state === 'Rejected' || k.state === 'Unreadable')) return { state: 'refused', label: 'Key refused' };
  const saved = keys.filter((k) => k.state === 'Saved');
  if (saved.length > 0) return { state: 'saved', label: saved.length === 1 ? `Key ${saved[0].masked}` : `${saved.length} keys` };
  return { state: 'missing', label: 'No stream key' };
}

export function buildRows(
  channels: readonly BrandChannel[],
  usage: Readonly<Record<string, number>> | null,
  connected: readonly YouTubeChannel[] | null,
  live: LiveStreamSetup | null,
): ChannelRow[] {
  const liveOn = !!live && live.destinations.length > 0;
  return channels.map((channel, order) => {
    const connection = connectionOf(channel, connected);
    const keys = liveOn ? keySummary(live.channels.find((x) => x.id === channel.id)?.keys ?? []) : null;
    const watermark = channel.watermark?.kind === 'Logo' ? 'logo' : channel.watermark?.kind === 'Text' ? 'text' : 'none';
    const endCard = channel.outro && channel.outro.kind !== 'None' ? channel.outro.kind : 'none';
    const attention: ChannelRow['attention'] = [];
    if (connection === 'reconnect') attention.push('reconnect');
    if (keys?.state === 'refused') attention.push('key-refused');
    return {
      channel, order, connection, watermark, endCard, attention,
      projects: usage ? (usage[channel.id] ?? 0) : null,
      key: keys?.state ?? 'off',
      keyLabel: keys?.label ?? '',
    };
  });
}

export function searchTokens(query: string): string[] {
  return fold(query).split(/\s+/).filter(Boolean);
}

function haystack(r: ChannelRow): string {
  const c = r.channel;
  return fold([c.name, c.youTubeChannelHandle, c.youTubeChannelTitle, c.id, c.youTubeChannelId].filter(Boolean).join(' '));
}

export function matchesQuery(r: ChannelRow, tokens: readonly string[]): boolean {
  if (tokens.length === 0) return true;
  const text = haystack(r);
  return tokens.every((t) => text.includes(t));
}

export function matchesFacets(r: ChannelRow, f: Facets): boolean {
  if (f.watermark !== 'any' && r.watermark !== f.watermark) return false;
  if (f.endCard === 'set' && r.endCard === 'none') return false;
  if (f.endCard === 'none' && r.endCard !== 'none') return false;
  if (f.key !== 'any') {
    const want = f.key === 'saved' ? 'saved' : f.key === 'missing' ? 'missing' : 'refused';
    if (r.key !== want) return false;
  }
  return true;
}

export function matchesView(r: ChannelRow, view: ViewFilter): boolean {
  switch (view) {
    case 'attention': return r.attention.length > 0;
    case 'youtube': return !!r.channel.youTubeChannelId;
    case 'not-youtube': return !r.channel.youTubeChannelId;
    case 'unused': return r.projects === 0;
    default: return true;
  }
}

export function activeFacetCount(f: Facets): number {
  return (f.watermark !== 'any' ? 1 : 0) + (f.endCard !== 'any' ? 1 : 0) + (f.key !== 'any' ? 1 : 0);
}

const byName = (a: ChannelRow, b: ChannelRow): number =>
  a.channel.name.localeCompare(b.channel.name, undefined, { sensitivity: 'base', numeric: true });

const defaultFirst = (a: ChannelRow, b: ChannelRow): number => Number(b.channel.isDefault) - Number(a.channel.isDefault);

export function sortRows(rows: readonly ChannelRow[], sort: SortKey, custom: readonly string[]): ChannelRow[] {
  const list = [...rows];
  switch (sort) {
    case 'name-asc': return list.sort(byName);
    case 'name-desc': return list.sort((a, b) => byName(b, a));
    case 'projects-desc': return list.sort((a, b) => (b.projects ?? -1) - (a.projects ?? -1) || byName(a, b));
    case 'projects-asc': return list.sort((a, b) => (a.projects ?? Infinity) - (b.projects ?? Infinity) || byName(a, b));
    case 'newest': return list.sort((a, b) => b.order - a.order);
    case 'oldest': return list.sort((a, b) => a.order - b.order);
    case 'attention': return list.sort((a, b) => b.attention.length - a.attention.length || defaultFirst(a, b) || byName(a, b));
    case 'custom': {
      const at = effectiveOrder(rows.map((r) => r.channel.id), custom);
      const pos = new Map(at.map((id, i) => [id, i]));
      return list.sort((a, b) => (pos.get(a.channel.id) ?? 0) - (pos.get(b.channel.id) ?? 0));
    }
    default: return list.sort((a, b) => defaultFirst(a, b) || byName(a, b));
  }
}

/** The stored order with vanished channels dropped and new ones added at the end, in server order. */
export function effectiveOrder(ids: readonly string[], stored: readonly string[]): string[] {
  const known = new Set(ids);
  const kept = stored.filter((id, i) => known.has(id) && stored.indexOf(id) === i);
  const seen = new Set(kept);
  return [...kept, ...ids.filter((id) => !seen.has(id))];
}

/** Swaps an id with its neighbour in `visible`, inside the full order. */
export function moveInOrder(
  full: readonly string[], visible: readonly string[], id: string, to: 'up' | 'down' | 'top',
): string[] {
  const order = [...full];
  const at = visible.indexOf(id);
  if (at < 0) return order;
  if (to === 'top') {
    const first = visible[0];
    if (first === id) return order;
    order.splice(order.indexOf(id), 1);
    order.splice(order.indexOf(first), 0, id);
    return order;
  }
  const neighbour = visible[at + (to === 'up' ? -1 : 1)];
  if (!neighbour) return order;
  const i = order.indexOf(id);
  const j = order.indexOf(neighbour);
  [order[i], order[j]] = [order[j], order[i]];
  return order;
}

export interface NameCheck {
  /** The name as it would be sent: trimmed. */
  name: string;
  length: number;
  empty: boolean;
  error: string | null;
}

const CONTROL_CHARS = /[\p{Cc}\u2028\u2029]/u;

/**
 * The same rules the server applies (1-60 characters as typed, unique ignoring case), plus two
 * that keep a name safe to show anywhere: no control characters and no angle brackets.
 */
export function checkChannelName(
  raw: string, others: readonly { id: string; name: string }[], selfId: string | null,
): NameCheck {
  const name = raw.trim();
  const base = { name, length: raw.length, empty: name.length === 0 };
  if (base.empty) return { ...base, error: null };
  if (CONTROL_CHARS.test(raw)) return { ...base, error: 'Remove the line breaks or other hidden characters.' };
  if (/[<>]/.test(raw)) return { ...base, error: 'Names can’t contain < or >.' };
  if (raw.length > MAX_NAME_LENGTH) {
    const over = raw.length - MAX_NAME_LENGTH;
    return { ...base, error: `Too long by ${over} character${over === 1 ? '' : 's'} (the limit is ${MAX_NAME_LENGTH}).` };
  }
  const twin = others.find((o) => o.id !== selfId && o.name.trim().toLowerCase() === name.toLowerCase());
  if (twin) return { ...base, error: `There is already a channel called “${twin.name}”. Names are unique, ignoring capitals.` };
  return { ...base, error: null };
}

/** "X (copy)", then "X (copy 2)"…, shortening X so the suffix always fits. */
export function uniqueCopyName(base: string, taken: ReadonlySet<string>): string {
  const attempt = (suffix: string) => `${base.slice(0, Math.max(1, MAX_NAME_LENGTH - suffix.length)).trimEnd()}${suffix}`;
  let name = attempt(' (copy)');
  for (let i = 2; taken.has(name.toLowerCase()); i++) name = attempt(` (copy ${i})`);
  return name;
}

export function pageOf(index: number, pageSize: number): number {
  return index < 0 ? 0 : Math.floor(index / pageSize);
}

// ---- Optimistic updates: what the list will look like once the server has done it. -------------

/** What moves when a channel swaps places with the default: its name, look and YouTube link. */
const swapped = (c: BrandChannel) => ({
  name: c.name, watermark: c.watermark, outro: c.outro,
  youTubeChannelId: c.youTubeChannelId, youTubeChannelTitle: c.youTubeChannelTitle,
  youTubeChannelHandle: c.youTubeChannelHandle, youTubeThumbnailUrl: c.youTubeThumbnailUrl,
});

/** The ids stay where they are; the content trades places, exactly as the server swaps it. */
export function swapWithDefault(list: readonly BrandChannel[], id: string): BrandChannel[] {
  const def = list.find((c) => c.isDefault);
  const other = list.find((c) => c.id === id);
  if (!def || !other || def === other) return [...list];
  return list.map((c) => (c === def ? { ...c, ...swapped(other) } : c === other ? { ...c, ...swapped(def) } : c));
}

export function swapUsage(usage: Readonly<Record<string, number>>, id: string, defaultId: string): Record<string, number> {
  const next = { ...usage };
  const a = usage[defaultId];
  const b = usage[id];
  if (b === undefined) delete next[defaultId]; else next[defaultId] = b;
  if (a === undefined) delete next[id]; else next[id] = a;
  return next;
}

/** Saved stream keys follow the look they were saved for, so they swap with it. */
export function swapLiveKeys(setup: LiveStreamSetup, id: string): LiveStreamSetup {
  const def = setup.channels.find((c) => c.isDefault);
  const other = setup.channels.find((c) => c.id === id);
  if (!def || !other) return setup;
  const retag = (keys: LiveStreamKeyStatus[], channelId: string) => keys.map((k) => ({ ...k, channelId }));
  return {
    ...setup,
    channels: setup.channels.map((c) =>
      c === def ? { ...c, keys: retag(other.keys, def.id) } : c === other ? { ...c, keys: retag(def.keys, other.id) } : c),
  };
}

/**
 * The list after deleting a channel. Deleting the default first hands the default's place to
 * `replacementId`, then removes the old default - which by then sits under the replacement's id.
 */
export function withoutChannel(list: readonly BrandChannel[], c: BrandChannel, replacementId: string): BrandChannel[] {
  if (c.isDefault) return swapWithDefault(list, replacementId).filter((x) => x.id !== replacementId);
  return list.filter((x) => x.id !== c.id);
}

export function usageAfterDelete(
  usage: Readonly<Record<string, number>>, c: BrandChannel, moveTo: string, defaultId: string,
): Record<string, number> {
  if (c.isDefault) {
    const next = swapUsage(usage, moveTo, defaultId);
    next[defaultId] = (next[defaultId] ?? 0) + (next[moveTo] ?? 0);
    delete next[moveTo];
    return next;
  }
  const next = { ...usage };
  next[moveTo] = (next[moveTo] ?? 0) + (next[c.id] ?? 0);
  delete next[c.id];
  return next;
}
