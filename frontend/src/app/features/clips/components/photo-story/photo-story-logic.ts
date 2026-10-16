import { ImageCameraMotion, ImageLook } from '../../../../core/models/api.models';
import { IMAGE_MOTION_DEFAULT, autoMotion } from '../../services/cinematic-image';
import { CelebrationKind } from '../../services/celebration';

/**
 * Pure helpers behind Photo Story's bulk tools: ordering, timing and style presets. Kept
 * free of Angular so the arithmetic can be checked on its own.
 */

/** The export clamps every still to this window (buildPhotoStory), so the tools do too. */
export const SLIDE_MIN_SECONDS = 1;
export const SLIDE_MAX_SECONDS = 60;
export const CAPTION_MAX_CHARS = 140;

const tenth = (v: number) => Math.round(v * 10) / 10;
const clampSeconds = (v: number) => Math.min(SLIDE_MAX_SECONDS, Math.max(SLIDE_MIN_SECONDS, v));

/**
 * New on-screen times that add up to `target` seconds, keeping each shot's share of the
 * story (a shot twice as long stays twice as long) wherever the 1-60s window allows.
 * Shots that hit a bound are pinned and the rest re-share what is left. Results are in
 * tenths of a second; the last free shot absorbs the rounding so the sum lands exactly.
 * A target outside what the shots can reach is clamped to the nearest reachable length.
 */
export function fitDurations(seconds: readonly number[], target: number): number[] {
  const n = seconds.length;
  if (n === 0) return [];
  const goal = Math.min(n * SLIDE_MAX_SECONDS, Math.max(n * SLIDE_MIN_SECONDS, Number(target) || 0));
  const weights = seconds.map((s) => (Number.isFinite(s) && s > 0 ? s : SLIDE_MIN_SECONDS));
  const out: (number | null)[] = new Array(n).fill(null);

  // Water-filling: scale the free shots, pin any that cross a bound, repeat until none do.
  for (let pass = 0; pass < n; pass++) {
    const pinned = out.reduce<number>((sum, v) => sum + (v ?? 0), 0);
    const freeWeight = weights.reduce((sum, w, k) => sum + (out[k] === null ? w : 0), 0);
    if (freeWeight <= 0) break;
    const scale = (goal - pinned) / freeWeight;
    let changed = false;
    for (let k = 0; k < n; k++) {
      if (out[k] !== null) continue;
      const v = weights[k] * scale;
      if (v < SLIDE_MIN_SECONDS || v > SLIDE_MAX_SECONDS) { out[k] = clampSeconds(v); changed = true; }
    }
    if (!changed) {
      for (let k = 0; k < n; k++) if (out[k] === null) out[k] = weights[k] * scale;
      break;
    }
  }

  const rounded = out.map((v) => clampSeconds(tenth(v ?? SLIDE_MIN_SECONDS)));
  // Hand the rounding drift out a tenth at a time, from the last shot back, to shots with
  // room - so the total is exact and no one shot soaks up all of it.
  let drift = Math.round((goal - rounded.reduce((a, b) => a + b, 0)) * 10);
  while (drift !== 0) {
    let moved = false;
    for (let k = n - 1; k >= 0 && drift !== 0; k--) {
      const next = tenth(rounded[k] + Math.sign(drift) / 10);
      if (next < SLIDE_MIN_SECONDS || next > SLIDE_MAX_SECONDS) continue;
      rounded[k] = next;
      drift -= Math.sign(drift);
      moved = true;
    }
    if (!moved) break;
  }
  return rounded;
}

/** Equal on-screen times that add up to `target` seconds (same bounds and rounding). */
export function evenDurations(count: number, target: number): number[] {
  return fitDurations(new Array(Math.max(0, count)).fill(1), target);
}

/** A copy with the entry at `from` moved to `to` (indices into the original list). */
export function moveItem<T>(list: readonly T[], from: number, to: number): T[] {
  const out = [...list];
  if (from < 0 || from >= out.length) return out;
  const [item] = out.splice(from, 1);
  out.splice(Math.min(Math.max(0, to), out.length), 0, item);
  return out;
}

/** A Fisher-Yates shuffle; with two or more entries it never hands back the same order. */
export function shuffled<T>(list: readonly T[], random: () => number = Math.random): T[] {
  if (list.length < 2) return [...list];
  for (let attempt = 0; attempt < 8; attempt++) {
    const out = [...list];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    if (out.some((v, k) => v !== list[k])) return out;
  }
  // A stubborn random source: rotating by one is still a different order.
  return [...list.slice(1), list[0]];
}

/** Names compared as people read them, so "IMG_2" comes before "IMG_10". */
export function byName<T extends { name: string }>(list: readonly T[]): T[] {
  return [...list].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
}

/**
 * Oldest first by the time each file was added; files with no known time keep their
 * relative order after the dated ones.
 */
export function byDate<T>(list: readonly T[], timeOf: (item: T) => number | null): T[] {
  return list
    .map((item, k) => ({ item, k, t: timeOf(item) }))
    .sort((a, b) => {
      if (a.t === null && b.t === null) return a.k - b.k;
      if (a.t === null) return 1;
      if (b.t === null) return -1;
      return a.t - b.t || a.k - b.k;
    })
    .map((e) => e.item);
}

/** 75 -> "1:15", 9.5 -> "0:09.5". */
export function formatRunTime(totalSeconds: number): string {
  // Work in whole tenths so 59.96 rounds up to 1:00 rather than "0:60".
  const tenths = Math.round(Math.max(0, Number(totalSeconds) || 0) * 10);
  const minutes = Math.floor(tenths / 600);
  const secs = Math.floor((tenths % 600) / 10);
  const frac = tenths % 10;
  return `${minutes}:${String(secs).padStart(2, '0')}${frac ? `.${frac}` : ''}`;
}

/**
 * A one-click style: move, pace and transition together, using only the moves, looks and
 * transitions the export already draws. `look` is left alone when the preset has none.
 */
export interface StoryPreset {
  id: string;
  label: string;
  icon: string;
  hint: string;
  seconds: number;
  transition: string;
  transitionSeconds: number;
  intensity: number;
  easing: 'ease' | 'linear';
  /** The move for shot k. */
  motionAt: (k: number) => ImageCameraMotion;
  look?: ImageLook;
  vignette?: boolean;
  grain?: boolean;
  cinemaBars?: boolean;
  /**
   * A celebration for shot k of n, or null for none. Absent leaves every shot's celebration
   * as it is; present, the preset decides them all.
   */
  celebrationAt?: (k: number, n: number) => CelebrationKind | null;
}

const cycle = (moves: readonly ImageCameraMotion[]) => (k: number) => moves[k % moves.length];

export const STORY_PRESETS: readonly StoryPreset[] = [
  {
    id: 'ken-burns', label: 'Ken Burns', icon: '🎞', hint: 'Slow push-ins and pull-outs, long dissolves - the documentary classic',
    seconds: 6, transition: 'Dissolve', transitionSeconds: 1.2, intensity: 0.12, easing: 'ease',
    motionAt: cycle(['zoom-in', 'zoom-out', 'drift']),
  },
  {
    id: 'energetic', label: 'Energetic', icon: '⚡', hint: 'Quick cuts, strong moves and slides - for upbeat music',
    seconds: 2.5, transition: 'SlideLeft', transitionSeconds: 0.4, intensity: 0.25, easing: 'linear',
    motionAt: autoMotion,
  },
  {
    id: 'memories', label: 'Memories', icon: '💭', hint: 'Soft fades, gentle breathing zooms and a warm vintage grade',
    seconds: 5, transition: 'Fade', transitionSeconds: 1.5, intensity: 0.08, easing: 'ease',
    motionAt: cycle(['breathe', 'zoom-in', 'drift']), look: 'vintage', vignette: true, grain: true,
  },
  {
    id: 'cinematic', label: 'Cinematic', icon: '🎬', hint: 'Drifts and pans with a film grade and cinema bars',
    seconds: 5, transition: 'Dissolve', transitionSeconds: 1, intensity: IMAGE_MOTION_DEFAULT, easing: 'ease',
    motionAt: cycle(['drift', 'pan-right', 'zoom-in', 'pan-left']), look: 'cinematic', vignette: true, cinemaBars: true,
  },
  {
    id: 'festive', label: 'Festive', icon: '🎉', hint: 'Bright, lively moves with a flower shower to open and confetti to close - for festivals and birthdays',
    seconds: 4, transition: 'Dissolve', transitionSeconds: 0.8, intensity: 0.18, easing: 'ease',
    motionAt: cycle(['zoom-in', 'pan-right', 'breathe', 'pan-left']), look: 'vivid', vignette: true,
    celebrationAt: (k, n) => (k === 0 ? 'flowers' : k === n - 1 ? 'cannon' : null),
  },
  {
    id: 'devotional', label: 'Devotional', icon: '🙏', hint: 'Slow, reverent push-ins, warm light and petals drifting down over every picture',
    seconds: 6, transition: 'Fade', transitionSeconds: 1.4, intensity: 0.1, easing: 'ease',
    motionAt: cycle(['zoom-in', 'breathe', 'drift']), look: 'warm', vignette: true,
    celebrationAt: (k) => (k % 2 === 0 ? 'flowers' : 'petals'),
  },
  {
    id: 'slideshow', label: 'Slideshow', icon: '🖼', hint: 'Still pictures with simple fades - nothing moves',
    seconds: 4, transition: 'Fade', transitionSeconds: 0.8, intensity: IMAGE_MOTION_DEFAULT, easing: 'ease',
    motionAt: () => 'none',
  },
];
