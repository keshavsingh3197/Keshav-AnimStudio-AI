import {
  Clip, ClipFit, ClipStudio, ProjectEdit, TimelineItem, TimelineItemTextStyle, TimelineItemTransform,
} from '../../../core/models/api.models';

/**
 * A read-only picture of one cut's timeline - enough to play it back and to show what a
 * chosen part would carry over. Times are seconds on that cut's own timeline, laid out the
 * way the editor lays it out (StudioStateService.clipSchedule / applyRange), so a range
 * picked here lands on the same frames when the editor trims the copy.
 */
export interface PreviewClip {
  id: string;
  assetId: string;
  name: string;
  start: number;
  end: number;
  /** Where in the source file this clip's first frame is. */
  trimStart: number;
}

export type PreviewLane = 'text' | 'image' | 'audio';

export interface PreviewItem {
  id: string;
  lane: PreviewLane;
  /** 'video' for picture-in-picture clips on V2; listed but not drawn in the preview. */
  kind: 'text' | 'image' | 'video' | 'audio';
  label: string;
  start: number;
  end: number;
  /** Asset id for media, the text itself for text. */
  src: string;
  trimStart: number;
  volume: number;
  textStyle?: TimelineItemTextStyle;
  transform?: TimelineItemTransform;
}

export interface PreviewTimeline {
  length: number;
  clips: PreviewClip[];
  items: PreviewItem[];
  fit: ClipFit;
}

const AUDIO_EXT = /\.(mp3|wav|ogg|m4a|aac)$/i;
const IMAGE_EXT = /\.(png|jpe?g|webp|gif)$/i;

/** Mirrors StudioStateService.resolveAssetId for ids that carry a split / copy suffix. */
function resolveAssetId(clip: Clip, studio: ClipStudio): string {
  if (clip.assetId) return clip.assetId;
  let id = clip.id;
  for (let guard = 0; guard < 4; guard++) {
    const direct = studio.clips.find((c) => c.id === id);
    if (direct) return direct.assetId || direct.id;
    const cut = id.indexOf('_');
    const cleaned = cut >= 24 ? id.slice(0, cut) : id.replace(/_(dup|part|[ab]|copy|split).*$/i, '');
    if (cleaned === id) break;
    id = cleaned;
  }
  return id;
}

function isVideoClip(clip: Clip, studio: ClipStudio): boolean {
  if (studio.logoCandidates?.some((l) => l.id === clip.id)) return false;
  if (studio.musicCandidates?.some((m) => m.id === clip.id)) return false;
  return !AUDIO_EXT.test(clip.name) && !IMAGE_EXT.test(clip.name);
}

function parseDraft(json: string | null | undefined): any | null {
  if (!json) return null;
  try {
    const d = JSON.parse(json);
    return d && typeof d === 'object' ? d : null;
  } catch {
    return null;
  }
}

function num(v: unknown, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

export function buildPreviewTimeline(edit: ProjectEdit, studio: ClipStudio): PreviewTimeline {
  const draft = parseDraft(edit.draftJson);

  // The V1 sequence. Without a saved timeline the editor fills the first cut (and copies)
  // with every project clip; any other cut starts empty.
  let rows: { clip: Clip; included: boolean }[];
  if (draft && Array.isArray(draft.rows)) {
    rows = draft.rows.filter((r: any) => r?.clip && isVideoClip(r.clip, studio));
  } else {
    const fill = edit.id.startsWith('main-') || !!edit.sourceEditId;
    rows = studio.clips.filter((c) => isVideoClip(c, studio)).map((clip) => ({ clip, included: fill }));
  }

  const clips: PreviewClip[] = [];
  let cursor = 0;
  for (const r of rows) {
    if (!r.included) continue;
    const dur = num(r.clip.durationSeconds, 5);
    clips.push({
      id: r.clip.id,
      assetId: resolveAssetId(r.clip, studio),
      name: r.clip.name,
      start: cursor,
      end: cursor + dur,
      trimStart: num(r.clip.trimStartSeconds, 0),
    });
    cursor += dur;
  }

  const items: PreviewItem[] = [];
  const timelineItems: TimelineItem[] = draft && Array.isArray(draft.timelineItems) ? draft.timelineItems : [];
  for (const it of timelineItems) {
    if (!it || it.trackId === 'V1') continue;
    const start = num(it.startTime, 0);
    const end = start + Math.max(0, num(it.duration, 0));
    const base = { id: it.id, start, end, src: it.src, trimStart: num(it.trimStartSeconds, 0), volume: num(it.volume, 1) };
    if (it.type === 'text') {
      items.push({ ...base, lane: 'text', kind: 'text', label: it.src || it.name || 'Text', textStyle: it.textStyle });
    } else if (it.type === 'image') {
      items.push({ ...base, lane: 'image', kind: 'image', label: it.name || 'Image', transform: it.transform });
    } else if (it.type === 'video') {
      items.push({ ...base, lane: 'image', kind: 'video', label: it.name || 'Video overlay', transform: it.transform });
    } else if (it.type === 'audio' && !it.muted) {
      items.push({ ...base, lane: 'audio', kind: 'audio', label: it.name || 'Audio' });
    }
  }

  const trackVolume = num(draft?.trackA1Volume, 1);
  const tracks: any[] = draft && Array.isArray(draft.musicTracks) ? draft.musicTracks : [];
  for (const t of tracks) {
    if (!t?.assetId || t.muted) continue;
    const asset = studio.musicCandidates?.find((m) => m.id === t.assetId);
    const trimStart = num(t.trimStartSeconds, 0);
    const trimEnd = num(t.trimEndSeconds, num(asset?.durationSeconds, 6));
    const start = num(t.startSeconds, 0);
    items.push({
      id: `music:${t.key ?? t.assetId}`,
      lane: 'audio',
      kind: 'audio',
      label: asset?.name ?? 'Music',
      start,
      end: start + Math.max(0.25, trimEnd - trimStart),
      src: t.assetId,
      trimStart,
      volume: num(t.volume, 1) * trackVolume,
    });
  }

  // The older single background track plays under the whole cut from its first second.
  const musicAssetId = typeof draft?.musicAssetId === 'string' ? draft.musicAssetId : '';
  const musicVolume = num(draft?.musicVolume, 0);
  if (musicAssetId && musicVolume > 0 && cursor > 0) {
    const asset = studio.musicCandidates?.find((m) => m.id === musicAssetId);
    items.push({
      id: 'music:background', lane: 'audio', kind: 'audio', label: asset?.name ?? 'Background music',
      start: 0, end: cursor, src: musicAssetId, trimStart: 0, volume: musicVolume * trackVolume,
    });
  }

  const fit: ClipFit = draft?.fit === 'Cover' || draft?.fit === 'BlurredBackdrop' ? draft.fit : 'Contain';
  const full: PreviewTimeline = { length: cursor, clips, items, fit };

  // A cut made from part of another and never opened still holds the whole copied
  // timeline; show only the part it will keep.
  const ps = edit.pendingRangeStart;
  const pe = edit.pendingRangeEnd;
  return ps !== null && pe !== null && pe > ps ? windowTimeline(full, ps, Math.min(pe, full.length || pe)) : full;
}

/** Keeps [from, to) of a timeline and shifts it to start at zero - applyRange, read-only. */
export function windowTimeline(t: PreviewTimeline, from: number, to: number): PreviewTimeline {
  const cut = <T extends { start: number; end: number; trimStart: number }>(seg: T): T | null => {
    if (seg.end <= from || seg.start >= to) return null;
    const head = Math.max(0, from - seg.start);
    return { ...seg, start: Math.max(seg.start, from) - from, end: Math.min(seg.end, to) - from, trimStart: seg.trimStart + head };
  };
  return {
    length: Math.max(0, Math.min(t.length, to) - from),
    clips: t.clips.map(cut).filter((c): c is PreviewClip => c !== null),
    items: t.items.map(cut).filter((i): i is PreviewItem => i !== null),
    fit: t.fit,
  };
}

/** Index of the V1 clip on screen at `time`, or -1 past the end / on an empty timeline. */
export function clipIndexAt(clips: PreviewClip[], time: number): number {
  for (let i = 0; i < clips.length; i++) {
    if (time >= clips[i].start && time < clips[i].end) return i;
  }
  const last = clips.length - 1;
  return last >= 0 && Math.abs(time - clips[last].end) < 1e-3 ? last : -1;
}
