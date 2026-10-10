import { Clip, TimelineItem, TimelineItemTransform } from '../../../core/models/api.models';
import {
  ClipAudioSetting, ClipColorSetting, ClipRow, ClipTextSetting, JunctionSetting, MusicTrackRow, isVoiceoverTrack,
} from '../models/clip-studio.models';

/**
 * Taking part of one timeline into another - another cut of the same project, a cut of a
 * different project, or a brand-new cut made from the open one. Pure functions over the
 * saved draft shape (see StudioStateService.buildDraftData), so the same code serves every
 * direction and never touches the open editor's state.
 */

/** The layers of a timeline that can be taken or left behind. */
export type TransferLayer = 'video' | 'overlay' | 'image' | 'text' | 'voice' | 'music' | 'effects';

export const TRANSFER_LAYERS: readonly { id: TransferLayer; label: string; hint: string }[] = [
  { id: 'video', label: 'Video clips', hint: 'The main V1 sequence' },
  { id: 'overlay', label: 'Video overlays', hint: 'Picture-in-picture on V2' },
  { id: 'image', label: 'Images', hint: 'Stills on IMG1' },
  { id: 'text', label: 'Text & titles', hint: 'Titles and captions on TXT1' },
  { id: 'voice', label: 'Voice-over', hint: 'Narration lines on A1' },
  { id: 'music', label: 'Music & sound', hint: 'Score and sound effects on A2' },
  { id: 'effects', label: 'Clip effects', hint: 'Colour, transform, clip audio and transitions of the video clips' },
];

export const ALL_TRANSFER_LAYERS: ReadonlySet<TransferLayer> = new Set(TRANSFER_LAYERS.map((l) => l.id));

export interface TransferRange {
  start: number;
  end: number;
}

export interface TransferOptions {
  layers: ReadonlySet<TransferLayer>;
  /** Seconds of the source timeline to take; null takes all of it. */
  range: TransferRange | null;
  /** Length of an audio file, for a music row that plays to the end of its file. */
  audioLength?: (assetId: string) => number | undefined;
  /**
   * Where each source file lives in the destination (the cross-project copy). Null leaves
   * the element out; omitted keeps every id as it is.
   */
  assetMap?: (assetId: string) => string | null;
}

export type ClipFraming = { fit: 'Contain' | 'Cover'; zoom: number; panY: 'center' | 'top' | 'bottom' };
export type ClipAudioFade = { fadeInSeconds: number; fadeOutSeconds: number };

/** A piece of a timeline, starting at 0, with ids of its own so it can sit beside anything. */
export interface TimelineFragment {
  /** V1 clips, in order, all included. */
  rows: ClipRow[];
  items: TimelineItem[];
  musicTracks: MusicTrackRow[];
  clipSounds: Record<string, ClipAudioSetting>;
  clipTransforms: Record<string, TimelineItemTransform>;
  clipColors: Record<string, ClipColorSetting>;
  clipTexts: Record<string, ClipTextSetting>;
  clipFraming: [string, ClipFraming][];
  clipAudioFade: [string, ClipAudioFade][];
  junctionOverrides: [string, JunctionSetting][];
  /** Length of the V1 clips together. */
  videoSeconds: number;
  /** Where the last thing in the fragment ends. */
  spanSeconds: number;
}

const AUDIO_NAME = /\.(mp3|wav|ogg|m4a|aac)$/i;
const IMAGE_NAME = /\.(png|jpe?g|webp|gif)$/i;
const MIN_PIECE_SECONDS = 0.05;

/** The library file behind a clip, also for split parts and duplicates (`<asset>_part_…`). */
export function baseAssetId(clip: Pick<Clip, 'id' | 'assetId'>): string {
  if (clip.assetId) return clip.assetId;
  const id = clip.id;
  const underscore = id.indexOf('_');
  if (underscore >= 24) return id.slice(0, underscore);
  return id.replace(/_(dup|part|[ab]|copy|split).*$/i, '');
}

function isVideoClip(clip: Clip): boolean {
  return !AUDIO_NAME.test(clip.name ?? '') && !IMAGE_NAME.test(clip.name ?? '');
}

function clipSeconds(clip: Clip): number {
  return clip.durationSeconds ?? 5.0;
}

function itemLayer(item: TimelineItem): TransferLayer | null {
  if (item.trackId === 'V1' || item.trackId === 'video') return null; // V1 lives in the rows
  if (item.type === 'text') return 'text';
  switch (item.trackId) {
    case 'V2': case 'V3': return 'overlay';
    case 'IMG1': case 'IMG': return 'image';
    case 'A1': return 'voice';
    case 'A2': return 'music';
  }
  if (item.type === 'image') return 'image';
  if (item.type === 'audio') return 'music';
  if (item.type === 'video') return 'overlay';
  return null;
}

function trackLayer(track: MusicTrackRow): TransferLayer {
  return isVoiceoverTrack(track) ? 'voice' : 'music';
}

function asArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

function asRecord<T>(v: unknown): Record<string, T> {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, T>) : {};
}

function asEntries<T>(v: unknown): [string, T][] {
  return asArray<unknown>(v).filter(
    (e): e is [string, T] => Array.isArray(e) && e.length === 2 && typeof e[0] === 'string');
}

/** The V1 clips a draft plays, in order. */
export function includedVideoClips(draft: unknown): Clip[] {
  return asArray<ClipRow>(asRecord<unknown>(draft)['rows'])
    .filter((r) => r && r.included && r.clip && typeof r.clip.id === 'string' && isVideoClip(r.clip))
    .map((r) => r.clip);
}

/** Total length of what a draft holds: the clips and anything placed past them. */
export function draftSpanSeconds(draft: unknown, audioLength?: (assetId: string) => number | undefined): number {
  const d = asRecord<unknown>(draft);
  let end = includedVideoClips(draft).reduce((sum, c) => sum + clipSeconds(c), 0);
  for (const it of asArray<TimelineItem>(d['timelineItems'])) {
    if (typeof it?.startTime === 'number' && typeof it?.duration === 'number') end = Math.max(end, it.startTime + it.duration);
  }
  for (const t of asArray<MusicTrackRow>(d['musicTracks'])) {
    if (typeof t?.startSeconds === 'number') end = Math.max(end, t.startSeconds + musicLength(t, audioLength));
  }
  return end;
}

function musicLength(t: MusicTrackRow, audioLength?: (assetId: string) => number | undefined): number {
  if (t.trimEndSeconds != null) return Math.max(0, t.trimEndSeconds - (t.trimStartSeconds ?? 0));
  const file = audioLength?.(t.assetId);
  // An untrimmed row plays its whole file; without the file's length, the timeline's own
  // stand-in (StudioStateService.contentDurationSeconds) is used.
  return file != null ? Math.max(0, file - (t.trimStartSeconds ?? 0)) : 10;
}

/**
 * The part of a saved timeline that `options` asks for, moved to start at 0 and given ids
 * of its own. Overlapping edges are trimmed exactly as StudioStateService.applyRange trims a
 * cut made from part of another.
 */
export function extractFragment(draft: unknown, options: TransferOptions): TimelineFragment {
  const d = asRecord<unknown>(draft);
  const layers = options.layers;
  const start = options.range ? Math.max(0, options.range.start) : 0;
  const end = options.range ? options.range.end : Number.POSITIVE_INFINITY;
  const mapAsset = options.assetMap ?? ((id: string) => id);
  const stamp = Date.now().toString(36);

  const fragment: TimelineFragment = {
    rows: [], items: [], musicTracks: [],
    clipSounds: {}, clipTransforms: {}, clipColors: {}, clipTexts: {},
    clipFraming: [], clipAudioFade: [], junctionOverrides: [],
    videoSeconds: 0, spanSeconds: 0,
  };
  if (!(end > start)) return fragment;

  // --- V1 clips: walked in play order, kept where they meet the range.
  const idMap = new Map<string, string>();
  if (layers.has('video')) {
    let cursor = 0;
    includedVideoClips(draft).forEach((clip, i) => {
      const dur = clipSeconds(clip);
      const clipStart = cursor;
      const clipEnd = cursor + dur;
      cursor = clipEnd;
      if (clipEnd <= start || clipStart >= end) return;

      const asset = mapAsset(baseAssetId(clip));
      if (!asset) return;

      const head = Math.max(0, start - clipStart);
      const tail = Math.max(0, clipEnd - end);
      const kept = dur - head - tail;
      if (kept < MIN_PIECE_SECONDS) return;

      const trimStart = clip.trimStartSeconds ?? 0;
      const trimEnd = clip.trimEndSeconds ?? trimStart + dur;
      // `_part_` keeps the id resolvable to its file both here and on the server.
      const newId = `${asset}_part_imp${stamp}_${i}`;
      idMap.set(clip.id, newId);
      fragment.rows.push({
        included: true,
        clip: {
          ...clip,
          id: newId,
          assetId: asset,
          trimStartSeconds: trimStart + head,
          trimEndSeconds: trimEnd - tail,
          durationSeconds: kept,
        },
      });
      fragment.videoSeconds += kept;
    });
  }

  // --- what each of those clips carries with it.
  if (layers.has('effects') && idMap.size > 0) {
    const copyKeyed = <T>(source: Record<string, T>, target: Record<string, T>) => {
      for (const [oldId, newId] of idMap) {
        if (source[oldId] !== undefined) target[newId] = structuredClone(source[oldId]);
      }
    };
    copyKeyed(asRecord<TimelineItemTransform>(d['clipTransforms']), fragment.clipTransforms);
    copyKeyed(asRecord<ClipColorSetting>(d['clipColors']), fragment.clipColors);
    copyKeyed(asRecord<ClipTextSetting>(d['clipTexts']), fragment.clipTexts);

    const sounds = asRecord<ClipAudioSetting>(d['clipSounds']);
    for (const [oldId, newId] of idMap) {
      const s = sounds[oldId];
      if (!s) continue;
      // A replacement soundtrack is a file too; without its copy, the clip keeps its own sound.
      const audioAssetId = s.audioAssetId ? mapAsset(s.audioAssetId) ?? '' : '';
      fragment.clipSounds[newId] = { ...structuredClone(s), audioAssetId };
    }

    for (const [k, v] of asEntries<ClipFraming>(d['clipFraming'])) {
      const id = idMap.get(k);
      if (id) fragment.clipFraming.push([id, { ...v }]);
    }
    for (const [k, v] of asEntries<ClipAudioFade>(d['clipAudioFade'])) {
      const id = idMap.get(k);
      if (id) fragment.clipAudioFade.push([id, { ...v }]);
    }

    // Older drafts kept transitions only as an object; newer ones as entries.
    const junctions = Array.isArray(d['junctionOverrides'])
      ? asEntries<JunctionSetting>(d['junctionOverrides'])
      : Object.entries(asRecord<JunctionSetting>(d['junctions']));
    for (const [key, setting] of junctions) {
      const [left, right] = key.split(':');
      const l = idMap.get(left);
      const r = idMap.get(right);
      if (l && r && setting) fragment.junctionOverrides.push([`${l}:${r}`, { ...setting }]);
    }
  }

  // --- overlays, images, text and audio items on their own lanes.
  asArray<TimelineItem>(d['timelineItems']).forEach((it, i) => {
    if (!it || typeof it.startTime !== 'number' || typeof it.duration !== 'number') return;
    const layer = itemLayer(it);
    if (!layer || !layers.has(layer)) return;

    const itEnd = it.startTime + it.duration;
    if (itEnd <= start || it.startTime >= end) return;

    let src = it.src;
    if (it.type !== 'text' && src) {
      const mapped = mapAsset(src);
      if (!mapped) return;
      src = mapped;
    }

    const head = Math.max(0, start - it.startTime);
    const duration = Math.min(itEnd, end) - Math.max(it.startTime, start);
    if (duration < MIN_PIECE_SECONDS) return;

    const prefix = (it.id || it.type).split('_')[0] || it.type;
    const next: TimelineItem = {
      ...structuredClone(it),
      id: `${prefix}_imp${stamp}_${i}`,
      src,
      startTime: Math.max(0, it.startTime - start),
      duration,
    };
    if (it.trimStartSeconds !== undefined || head > 0) next.trimStartSeconds = (it.trimStartSeconds ?? 0) + head;
    if (it.trimEndSeconds !== undefined) next.trimEndSeconds = (next.trimStartSeconds ?? 0) + duration;
    fragment.items.push(next);
  });

  // --- voice and music rows.
  asArray<MusicTrackRow>(d['musicTracks']).forEach((t, i) => {
    if (!t || typeof t.startSeconds !== 'number' || !t.assetId) return;
    const layer = trackLayer(t);
    if (!layers.has(layer)) return;

    const len = musicLength(t, options.audioLength);
    const tEnd = t.startSeconds + len;
    if (tEnd <= start || t.startSeconds >= end) return;

    const asset = mapAsset(t.assetId);
    if (!asset) return;

    const head = Math.max(0, start - t.startSeconds);
    const trimStart = (t.trimStartSeconds ?? 0) + head;
    const kept = Math.min(tEnd, end) - Math.max(t.startSeconds, start);
    if (kept < MIN_PIECE_SECONDS) return;

    fragment.musicTracks.push({
      ...t,
      // The key prefix is what puts a row on its lane (see audioLaneOf).
      key: `${layer === 'voice' ? 'vo' : 'music'}_imp${stamp}_${i}`,
      assetId: asset,
      startSeconds: Math.max(0, t.startSeconds - start),
      trimStartSeconds: head > 0 || t.trimStartSeconds != null ? trimStart : t.trimStartSeconds,
      trimEndSeconds: tEnd > end ? trimStart + kept : t.trimEndSeconds,
    });
  });

  fragment.spanSeconds = Math.max(
    fragment.videoSeconds,
    ...fragment.items.map((it) => it.startTime + it.duration),
    ...fragment.musicTracks.map((t) => t.startSeconds + musicLength(t, options.audioLength)),
    0,
  );
  return fragment;
}

/** Every library file a fragment points at - what a copy into another project must bring. */
export function fragmentAssetIds(fragment: TimelineFragment): string[] {
  const ids = new Set<string>();
  for (const r of fragment.rows) ids.add(baseAssetId(r.clip));
  for (const it of fragment.items) if (it.type !== 'text' && it.src) ids.add(it.src);
  for (const t of fragment.musicTracks) ids.add(t.assetId);
  for (const s of Object.values(fragment.clipSounds)) if (s.audioAssetId) ids.add(s.audioAssetId);
  ids.delete('');
  return [...ids];
}

/** True when the fragment would add nothing. */
export function isEmptyFragment(fragment: TimelineFragment): boolean {
  return fragment.rows.length === 0 && fragment.items.length === 0 && fragment.musicTracks.length === 0;
}

/**
 * A complete draft holding only the fragment - what a new cut made from part of the open
 * one starts with. Project-wide settings (default transition, mix levels, ducking) come
 * along from `base` so the new cut sounds and cuts like the one it came from.
 */
export function fragmentToDraft(fragment: TimelineFragment, base: Record<string, unknown>): Record<string, unknown> {
  return {
    ...base,
    rows: fragment.rows,
    timelineItems: fragment.items,
    musicTracks: fragment.musicTracks,
    musicAssetId: '',
    clipSounds: fragment.clipSounds,
    clipTransforms: fragment.clipTransforms,
    clipColors: fragment.clipColors,
    clipTexts: fragment.clipTexts,
    junctions: Object.fromEntries(fragment.junctionOverrides),
    junctionOverrides: fragment.junctionOverrides,
    clipFraming: fragment.clipFraming,
    clipAudioFade: fragment.clipAudioFade,
    savedAt: new Date().toLocaleTimeString(),
  };
}

/** The effective range on a cut that was made from part of another and not opened since. */
export function withPendingRange(range: TransferRange | null, pending: TransferRange | null): TransferRange | null {
  if (!pending) return range;
  if (!range) return pending;
  return { start: pending.start + range.start, end: Math.min(pending.start + range.end, pending.end) };
}
