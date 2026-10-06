/**
 * Body and hand tracking results, and the smoothing that makes a character's movement look
 * deliberate rather than jittery. Raw landmarks shake by a few pixels every frame; a One Euro
 * filter (Casiez et al., CHI 2012) smooths hard while you're still and lets fast moves through
 * with little lag, which a fixed moving average can't do.
 *
 * Pure logic, no browser APIs.
 */

/** One landmark, 0-1 of the camera picture (not mirrored). `v` is the model's visibility, 0-1. */
export interface MotionPoint {
  x: number;
  y: number;
  v: number;
}

/** The 33 MediaPipe pose landmarks of one person. */
export interface BodyPose {
  points: MotionPoint[];
}

/** The 21 landmarks of one hand, with the gesture the model recognised on it. */
export interface HandPose {
  points: MotionPoint[];
  side: 'Left' | 'Right';
  gesture: string;
  score: number;
}

export interface MotionFrame {
  bodies: BodyPose[];
  hands: HandPose[];
}

export const EMPTY_MOTION: MotionFrame = { bodies: [], hands: [] };

/** Indices into the 33-point pose. Left/right are the person's own. */
export const POSE = {
  nose: 0,
  leftEar: 7,
  rightEar: 8,
  leftShoulder: 11,
  rightShoulder: 12,
  leftElbow: 13,
  rightElbow: 14,
  leftWrist: 15,
  rightWrist: 16,
  leftHip: 23,
  rightHip: 24,
  leftKnee: 25,
  rightKnee: 26,
  leftAnkle: 27,
  rightAnkle: 28,
} as const;

/** Indices into the 21-point hand. */
export const HAND = {
  wrist: 0,
  thumb: [1, 2, 3, 4],
  index: [5, 6, 7, 8],
  middle: [9, 10, 11, 12],
  ring: [13, 14, 15, 16],
  pinky: [17, 18, 19, 20],
  palm: [0, 1, 5, 9, 13, 17],
} as const;

/** Visibility below this means the model is guessing where the joint is. */
export const VISIBLE = 0.5;

export class OneEuroFilter {
  private x: number | null = null;
  private dx = 0;
  private t = 0;

  /**
   * @param minCutoff Hz; lower smooths more when still.
   * @param beta how quickly the cutoff rises with speed; higher lags less on fast moves.
   */
  constructor(private readonly minCutoff = 1.4, private readonly beta = 3, private readonly dCutoff = 1) {}

  filter(value: number, seconds: number): number {
    if (this.x === null) {
      this.x = value;
      this.t = seconds;
      return value;
    }
    const dt = Math.max(1e-3, seconds - this.t);
    this.t = seconds;
    const speed = (value - this.x) / dt;
    this.dx += alpha(this.dCutoff, dt) * (speed - this.dx);
    const cutoff = this.minCutoff + this.beta * Math.abs(this.dx);
    this.x += alpha(cutoff, dt) * (value - this.x);
    return this.x;
  }
}

function alpha(cutoff: number, dt: number): number {
  const tau = 1 / (2 * Math.PI * cutoff);
  return 1 / (1 + tau / dt);
}

/** A body or hand that vanishes for less than this is kept where it was, so the character doesn't flicker. */
const HOLD_MS = 250;

/**
 * Smooths each landmark of each body and hand over time. Bodies are kept in left-to-right
 * order and hands by side, so a filter keeps following the same joint; when the number of
 * people or hands changes, the affected filters start fresh rather than blending two people.
 */
export class MotionSmoother {
  private readonly filters = new Map<string, OneEuroFilter>();
  private bodyCount = 0;
  private handKeys = '';
  private last: MotionFrame = EMPTY_MOTION;
  private lastBodiesAt = 0;
  private lastHandsAt = 0;

  reset(): void {
    this.filters.clear();
    this.bodyCount = 0;
    this.handKeys = '';
    this.last = EMPTY_MOTION;
  }

  update(frame: MotionFrame, nowMs: number): MotionFrame {
    const seconds = nowMs / 1000;

    let bodies = [...frame.bodies].sort((a, b) => shoulderX(a) - shoulderX(b));
    if (bodies.length === 0 && nowMs - this.lastBodiesAt < HOLD_MS) {
      bodies = this.last.bodies;
    } else {
      if (bodies.length !== this.bodyCount) this.clear('b');
      this.bodyCount = bodies.length;
      bodies = bodies.map((body, i) => ({ points: this.smooth(`b${i}`, body.points, seconds) }));
      if (bodies.length) this.lastBodiesAt = nowMs;
    }

    let hands = [...frame.hands].sort((a, b) => (a.side === b.side ? a.points[0].x - b.points[0].x : a.side < b.side ? -1 : 1));
    if (hands.length === 0 && nowMs - this.lastHandsAt < HOLD_MS) {
      hands = this.last.hands;
    } else {
      const keys = hands.map((h, i) => `${h.side}${i}`).join(',');
      if (keys !== this.handKeys) this.clear('h');
      this.handKeys = keys;
      hands = hands.map((hand, i) => ({ ...hand, points: this.smooth(`h${hand.side}${i}`, hand.points, seconds) }));
      if (hands.length) this.lastHandsAt = nowMs;
    }

    this.last = { bodies, hands };
    return this.last;
  }

  private smooth(key: string, points: readonly MotionPoint[], seconds: number): MotionPoint[] {
    return points.map((p, i) => ({
      x: this.filter(`${key}:${i}:x`).filter(p.x, seconds),
      y: this.filter(`${key}:${i}:y`).filter(p.y, seconds),
      v: p.v,
    }));
  }

  private filter(key: string): OneEuroFilter {
    let f = this.filters.get(key);
    if (!f) {
      f = new OneEuroFilter();
      this.filters.set(key, f);
    }
    return f;
  }

  private clear(prefix: string): void {
    for (const key of [...this.filters.keys()]) if (key.startsWith(prefix)) this.filters.delete(key);
  }
}

function shoulderX(body: BodyPose): number {
  const l = body.points[POSE.leftShoulder];
  const r = body.points[POSE.rightShoulder];
  return l && r ? (l.x + r.x) / 2 : 0.5;
}

/** The centre of a hand's palm. */
export function palmCentre(hand: HandPose): { x: number; y: number } {
  let x = 0;
  let y = 0;
  for (const i of HAND.palm) {
    x += hand.points[i].x;
    y += hand.points[i].y;
  }
  return { x: x / HAND.palm.length, y: y / HAND.palm.length };
}
