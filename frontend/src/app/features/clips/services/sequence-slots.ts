import { TimelineItem } from '../../../core/models/api.models';

/**
 * The picture is ONE sequence. V1 clips, and the images, extra videos and text placed on
 * their own lanes, play one after another - the lanes are only there so each kind is easy
 * to see and grab. An item on one of these lanes takes a slot between two V1 clips (or
 * before the first, or after the last), and every clip after it moves along to make room,
 * so nothing ever plays over anything else and hides it. Audio is the exception: it runs
 * under the picture and keeps its own times.
 *
 * Where an item sits is its `slotIndex`: how many V1 clips play before it. Items sharing a
 * slot play in start-time order. Its `startTime` is always written back from the layout, so
 * the lanes, the monitor and the export all read the same number.
 */

/** Lanes whose items take a slot in the sequence rather than playing over V1. */
export const SLOT_TRACK_IDS: ReadonlySet<string> = new Set(['IMG1', 'IMG', 'IMAGE', 'V2', 'V3', 'TXT1']);

export function isSlotItem(item: Pick<TimelineItem, 'trackId'>): boolean {
  return SLOT_TRACK_IDS.has(item.trackId);
}

/** How far two times may differ and still be the same position. */
const EPS = 1e-6;

/** Shortest slot anything is given, so a zero-length item can still be seen and grabbed. */
const MIN_SLOT_SECONDS = 0.05;

export interface SlotLayout {
  /** Seconds of slotted items played before clip i; the last entry is after the last clip. */
  gapBefore: number[];
  /** Where each clip starts, gaps included. */
  clipStarts: number[];
  /** Where each slotted item starts, by id. */
  itemStarts: Map<string, number>;
  /** Where the whole sequence ends. */
  end: number;
}

interface Placed {
  id: string;
  slot: number;
  /** Decides the order of items sharing a slot. */
  order: number;
  duration: number;
}

const slotSeconds = (duration: number) => Math.max(MIN_SLOT_SECONDS, Number.isFinite(duration) ? duration : 0);

const clampSlot = (slot: number | undefined, clipCount: number): number | null =>
  slot === undefined || slot === null || !Number.isFinite(slot) ? null : Math.min(clipCount, Math.max(0, Math.round(slot)));

function layout(clipDurations: readonly number[], placed: readonly Placed[]): SlotLayout {
  const n = clipDurations.length;
  const bySlot: Placed[][] = Array.from({ length: n + 1 }, () => []);
  for (const p of placed) bySlot[p.slot].push(p);

  const gapBefore: number[] = [];
  const clipStarts: number[] = [];
  const itemStarts = new Map<string, number>();
  let cursor = 0;

  for (let k = 0; k <= n; k++) {
    const block = bySlot[k].sort((a, b) => a.order - b.order || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    let gap = 0;
    for (const p of block) {
      itemStarts.set(p.id, cursor);
      const seconds = slotSeconds(p.duration);
      cursor += seconds;
      gap += seconds;
    }
    gapBefore.push(gap);
    if (k < n) {
      clipStarts.push(cursor);
      cursor += clipDurations[k];
    }
  }

  return { gapBefore, clipStarts, itemStarts, end: cursor };
}

/** The sequence as it stands: slotted items at their `slotIndex`, clips flowing around them. */
export function layoutSlots(clipDurations: readonly number[], items: readonly TimelineItem[]): SlotLayout {
  const placed: Placed[] = [];
  for (const it of items) {
    if (!isSlotItem(it)) continue;
    const slot = clampSlot(it.slotIndex, clipDurations.length);
    if (slot === null) continue;
    placed.push({ id: it.id, slot, order: it.startTime, duration: it.duration });
  }
  return layout(clipDurations, placed);
}

/**
 * The slot whose cut point is nearest `time`, in a layout that does not yet hold the item.
 * A slot already holding items counts as the whole stretch they cover, so dropping onto
 * another image lands beside it rather than splitting the clips around it.
 */
function nearestSlot(at: SlotLayout, clipDurations: readonly number[], time: number): number {
  let best = 0;
  let bestDistance = Infinity;
  for (let k = 0; k <= clipDurations.length; k++) {
    const blockEnd = k < clipDurations.length ? at.clipStarts[k] : at.end;
    const blockStart = blockEnd - at.gapBefore[k];
    const distance = time < blockStart ? blockStart - time : time > blockEnd ? time - blockEnd : 0;
    if (distance < bestDistance - EPS) {
      best = k;
      bestDistance = distance;
    }
  }
  return best;
}

/**
 * Puts every slotted item into the sequence and writes back where it lands.
 *
 * An item keeps its slot unless something moved it - its `startTime` differs from where
 * this last placed it (`lastPlaced`), as a drag or a "put it at the playhead" does - or it
 * never had one (new, or saved before slots existed). Those are given the slot nearest
 * their `startTime`, which is how a drag snaps to the closest cut point.
 *
 * Returns null when nothing changed, so a caller writing the result into a signal stops.
 */
export function normalizeSlots(
  clipDurations: readonly number[],
  items: readonly TimelineItem[],
  lastPlaced: ReadonlyMap<string, number>,
): TimelineItem[] | null {
  const n = clipDurations.length;
  const settled: Placed[] = [];
  const loose: TimelineItem[] = [];

  for (const it of items) {
    if (!isSlotItem(it)) continue;
    const slot = clampSlot(it.slotIndex, n);
    const placedAt = lastPlaced.get(it.id);
    const moved = placedAt !== undefined && Math.abs(placedAt - it.startTime) > EPS;
    if (slot === null || moved) loose.push(it);
    else settled.push({ id: it.id, slot, order: it.startTime, duration: it.duration });
  }

  if (settled.length === 0 && loose.length === 0) return null;

  // Settled items are re-ordered by where they actually sit now, so a loose item's raw
  // time compares against real positions rather than ones an earlier edit left stale.
  let current = layout(clipDurations, settled);
  for (const p of settled) p.order = current.itemStarts.get(p.id) ?? p.order;

  for (const it of [...loose].sort((a, b) => a.startTime - b.startTime)) {
    const slot = nearestSlot(current, clipDurations, it.startTime);
    settled.push({ id: it.id, slot, order: it.startTime, duration: it.duration });
    current = layout(clipDurations, settled);
    for (const p of settled) p.order = current.itemStarts.get(p.id) ?? p.order;
  }

  const slotOf = new Map(settled.map((p) => [p.id, p.slot]));
  let changed = false;
  const next = items.map((it) => {
    const slot = slotOf.get(it.id);
    if (slot === undefined) return it;
    const start = current.itemStarts.get(it.id) ?? it.startTime;
    if (it.slotIndex === slot && Math.abs(it.startTime - start) <= EPS) return it;
    changed = true;
    return { ...it, slotIndex: slot, startTime: start };
  });
  return changed ? next : null;
}

/**
 * Keeps each item next to the same clip when V1 changes under it. An item stays after the
 * clip it followed; when that clip is gone it goes before the clip it preceded, and failing
 * that after the nearest earlier clip still in the cut.
 *
 * `prev` and `next` are the cut before and after; rows are matched by identity, then by key.
 */
export function remapSlots<R>(
  prev: readonly R[],
  next: readonly R[],
  items: readonly TimelineItem[],
  keyOf: (row: R) => string,
): TimelineItem[] | null {
  // With no cut before (a cut loading, or the first clip going in) every slot is still 0
  // or is the saved one: there is nothing to translate from.
  if (prev === next || prev.length === 0) return null;

  // The same clips in a new order is a reorder: the images stay where they are and the
  // clips move around them. Carrying each image along with the clip before it made them
  // jump sides whenever that clip was the one moved.
  const before = new Set(prev);
  if (next.length === prev.length && next.every((r) => before.has(r))) return null;

  const find = (row: R): number => {
    const byRef = next.indexOf(row);
    if (byRef >= 0) return byRef;
    const key = keyOf(row);
    return next.findIndex((r) => keyOf(r) === key);
  };

  // A cut with nothing in common with the last one is a different cut (another edit was
  // opened): its items' slots are its own, not something to translate.
  if (prev.length > 0 && next.length > 0 && !prev.some((r) => find(r) >= 0)) return null;

  const remap = (slot: number): number => {
    if (slot <= 0) return 0;
    const after = find(prev[Math.min(slot, prev.length) - 1]);
    if (after >= 0) return after + 1;
    if (slot < prev.length) {
      const before = find(prev[slot]);
      if (before >= 0) return before;
    }
    for (let k = Math.min(slot, prev.length) - 2; k >= 0; k--) {
      const earlier = find(prev[k]);
      if (earlier >= 0) return earlier + 1;
    }
    return 0;
  };

  let changed = false;
  const out = items.map((it) => {
    if (!isSlotItem(it) || it.slotIndex === undefined || it.slotIndex === null) return it;
    const slot = Math.min(next.length, remap(it.slotIndex));
    if (slot === it.slotIndex) return it;
    changed = true;
    return { ...it, slotIndex: slot };
  });
  return changed ? out : null;
}
