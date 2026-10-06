/**
 * Learns hand signs the presenter teaches, on this machine: a few seconds of examples per sign,
 * then each new hand is classified by its nearest neighbours (k-NN). Hands are normalised
 * first - moved to the wrist, scaled by palm length, turned upright and mirrored to one
 * side - so a sign is recognised wherever it is in frame, at any distance, with either hand.
 *
 * Only these normalised shapes are kept (42 numbers per example), never a picture, and only
 * in this browser. Pure logic, no browser APIs.
 */

export const SIGN_SLOTS = 3;
export const MAX_SAMPLES = 80;
/** Fewer examples than this and a sign isn't recognised yet. */
export const MIN_SAMPLES = 8;
const K = 5;
const VECTOR_LENGTH = 42;

export type HandVector = number[];

export interface SignMatch {
  slot: number;
  distance: number;
}

/**
 * Normalises 21 hand landmarks (0-1 of a picture with the given width/height `aspect`).
 * Returns null for a degenerate hand.
 */
export function normalizeHand(points: readonly { x: number; y: number }[], aspect: number, isLeft: boolean): HandVector | null {
  if (points.length !== 21) return null;
  const ox = points[0].x * aspect;
  const oy = points[0].y;
  const rx = points[9].x * aspect - ox;
  const ry = points[9].y - oy;
  const length = Math.hypot(rx, ry);
  if (length < 1e-4) return null;

  // Rotate so the wrist -> middle knuckle line points straight up (0, -1).
  const angle = Math.atan2(rx, -ry);
  const cos = Math.cos(-angle);
  const sin = Math.sin(-angle);
  const out: number[] = [];
  for (const p of points) {
    const x = (p.x * aspect - ox) / length;
    const y = (p.y - oy) / length;
    const rotatedX = x * cos - y * sin;
    const rotatedY = x * sin + y * cos;
    out.push(isLeft ? -rotatedX : rotatedX, rotatedY);
  }
  return out;
}

/** Root-mean-square distance per landmark between two normalised hands. */
export function handDistance(a: HandVector, b: HandVector): number {
  let sum = 0;
  for (let i = 0; i < VECTOR_LENGTH; i++) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return Math.sqrt(sum / 21);
}

export class SignLearner {
  private readonly samples: HandVector[][] = Array.from({ length: SIGN_SLOTS }, () => []);
  /** How far from its examples a hand may be and still count as each sign. */
  private readonly radius: number[] = new Array<number>(SIGN_SLOTS).fill(0.2);

  count(slot: number): number {
    return this.samples[slot]?.length ?? 0;
  }

  ready(slot: number): boolean {
    return this.count(slot) >= MIN_SAMPLES;
  }

  add(slot: number, vector: HandVector): void {
    const list = this.samples[slot];
    if (!list || vector.length !== VECTOR_LENGTH) return;
    list.push(vector);
    if (list.length > MAX_SAMPLES) list.shift();
    this.radius[slot] = acceptRadius(list);
  }

  clear(slot: number): void {
    if (!this.samples[slot]) return;
    this.samples[slot] = [];
    this.radius[slot] = 0.2;
  }

  /** The sign this hand is making, or null when it's none of them (or too unlike any). */
  classify(vector: HandVector): SignMatch | null {
    const neighbours: { slot: number; distance: number }[] = [];
    this.samples.forEach((list, slot) => {
      if (list.length < MIN_SAMPLES) return;
      for (const sample of list) neighbours.push({ slot, distance: handDistance(vector, sample) });
    });
    if (neighbours.length === 0) return null;
    neighbours.sort((a, b) => a.distance - b.distance);

    const votes = new Array<number>(SIGN_SLOTS).fill(0);
    for (const n of neighbours.slice(0, K)) votes[n.slot] += 1 / (n.distance + 0.02);
    const slot = votes.indexOf(Math.max(...votes));
    const nearest = neighbours.find((n) => n.slot === slot)!.distance;
    return nearest <= this.radius[slot] ? { slot, distance: nearest } : null;
  }

  export(): number[][][] {
    return this.samples.map((list) => list.map((v) => v.map((n) => Math.round(n * 1000) / 1000)));
  }

  /** Rebuilds a learner from stored JSON, keeping only well-formed examples. */
  static from(raw: unknown): SignLearner {
    const learner = new SignLearner();
    if (!Array.isArray(raw)) return learner;
    raw.slice(0, SIGN_SLOTS).forEach((list, slot) => {
      if (!Array.isArray(list)) return;
      for (const v of list.slice(-MAX_SAMPLES)) {
        if (Array.isArray(v) && v.length === VECTOR_LENGTH && v.every((n) => typeof n === 'number' && Number.isFinite(n) && Math.abs(n) <= 5)) {
          learner.add(slot, v as number[]);
        }
      }
    });
    return learner;
  }
}

/** Twice the typical gap between an example and its nearest sibling, kept within sensible bounds. */
function acceptRadius(list: readonly HandVector[]): number {
  if (list.length < 2) return 0.2;
  let total = 0;
  for (let i = 0; i < list.length; i++) {
    let best = Infinity;
    for (let j = 0; j < list.length; j++) if (i !== j) best = Math.min(best, handDistance(list[i], list[j]));
    total += best;
  }
  return Math.min(0.35, Math.max(0.12, (total / list.length) * 2.2));
}
