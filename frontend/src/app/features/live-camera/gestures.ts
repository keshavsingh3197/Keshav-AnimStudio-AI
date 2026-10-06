/**
 * Turns per-frame hand and face readings into deliberate gestures: a sign must be held for a
 * moment before it counts, fires once per hold, and then waits out a cooldown, so talking
 * with your hands or blinking doesn't set things off. Waves, nods and head shakes are found
 * from motion over the last second instead of a held pose.
 *
 * Pure logic, no browser APIs. What a gesture *does* is up to the caller; the actions on
 * offer can only make the stream safer (privacy card, mute) or add decoration - never reveal.
 */

export const GESTURES = [
  { id: 'Thumb_Up', label: 'Thumbs up', icon: '👍', kind: 'hand' },
  { id: 'Thumb_Down', label: 'Thumbs down', icon: '👎', kind: 'hand' },
  { id: 'Victory', label: 'Peace sign', icon: '✌️', kind: 'hand' },
  { id: 'ILoveYou', label: 'Love-you sign', icon: '🤟', kind: 'hand' },
  { id: 'Pointing_Up', label: 'Point up', icon: '☝️', kind: 'hand' },
  { id: 'Open_Palm', label: 'Open palm (hold)', icon: '✋', kind: 'hand' },
  { id: 'Closed_Fist', label: 'Fist (hold)', icon: '✊', kind: 'hand' },
  { id: 'wave', label: 'Wave', icon: '👋', kind: 'hand' },
  { id: 'wink-left', label: 'Wink left eye', icon: '😉', kind: 'face' },
  { id: 'wink-right', label: 'Wink right eye', icon: '😜', kind: 'face' },
  { id: 'long-blink', label: 'Close both eyes (1 s)', icon: '😌', kind: 'face' },
  { id: 'brows-up', label: 'Raise eyebrows', icon: '🤨', kind: 'face' },
  { id: 'mouth-open', label: 'Open mouth wide', icon: '😮', kind: 'face' },
  { id: 'big-smile', label: 'Big smile', icon: '😁', kind: 'face' },
  { id: 'nod', label: 'Nod', icon: '🙆', kind: 'face' },
  { id: 'shake', label: 'Shake head', icon: '🙅', kind: 'face' },
  { id: 'sign-1', label: 'My sign 1', icon: '1️⃣', kind: 'sign' },
  { id: 'sign-2', label: 'My sign 2', icon: '2️⃣', kind: 'sign' },
  { id: 'sign-3', label: 'My sign 3', icon: '3️⃣', kind: 'sign' },
] as const;

export type GestureId = (typeof GESTURES)[number]['id'];
export const GESTURE_IDS = GESTURES.map((g) => g.id) as readonly GestureId[];

export const REACTIONS = [
  { id: 'hearts', label: 'Hearts', icon: '❤️' },
  { id: 'thumbs', label: 'Thumbs up', icon: '👍' },
  { id: 'confetti', label: 'Confetti', icon: '🎉' },
  { id: 'fire', label: 'Fire', icon: '🔥' },
  { id: 'clap', label: 'Applause', icon: '👏' },
  { id: 'wave', label: 'Wave', icon: '👋' },
  { id: 'wow', label: 'Wow', icon: '😮' },
  { id: 'laugh', label: 'Laugh', icon: '😂' },
  { id: 'stars', label: 'Stars', icon: '⭐' },
] as const;

export type ReactionKind = (typeof REACTIONS)[number]['id'];

export const GESTURE_ACTIONS = [
  { id: 'none', label: 'Nothing' },
  ...REACTIONS.map((r) => ({ id: `react-${r.id}` as const, label: `${r.icon} ${r.label}` })),
  { id: 'scene-brb', label: '☕ Be right back on / off' },
  { id: 'scene-camera', label: '🎥 Back to live (not from privacy)' },
  { id: 'privacy', label: '🔒 Privacy card (turns on only)' },
  { id: 'mute', label: '🔇 Mute (turns on only)' },
  { id: 'snapshot', label: '📸 Save a snapshot' },
  { id: 'next-character', label: '🔁 Next character' },
  { id: 'toggle-qr', label: '🔳 QR code on / off' },
  { id: 'toggle-seal', label: '🏅 Seal on / off' },
] as const;

export type GestureAction = (typeof GESTURE_ACTIONS)[number]['id'];
export const GESTURE_ACTION_IDS = GESTURE_ACTIONS.map((a) => a.id) as readonly GestureAction[];

export type GestureBindings = Record<GestureId, GestureAction>;

export function defaultBindings(): GestureBindings {
  const bindings = Object.fromEntries(GESTURE_IDS.map((id) => [id, 'none'])) as GestureBindings;
  bindings.Thumb_Up = 'react-thumbs';
  bindings.Victory = 'react-confetti';
  bindings.ILoveYou = 'react-hearts';
  bindings.Pointing_Up = 'react-stars';
  bindings.wave = 'react-wave';
  bindings['brows-up'] = 'react-wow';
  return bindings;
}

/** One hand as the gesture model saw it. Coordinates are 0-1 of the camera picture. */
export interface HandSignal {
  /** MediaPipe's canned gesture name, or "None". */
  gesture: string;
  score: number;
  x: number;
  y: number;
  /** A sign the presenter taught, which wins over the canned gesture. */
  sign: GestureId | null;
}

export interface FaceSignal {
  blinkLeft: number;
  blinkRight: number;
  browUp: number;
  mouthOpen: number;
  smile: number;
  yaw: number;
  pitch: number;
  cx: number;
  cy: number;
}

export interface GestureInput {
  now: number;
  hands: readonly HandSignal[];
  face: FaceSignal | null;
}

export interface GestureOptions {
  holdMs: number;
  cooldownMs: number;
  hand: boolean;
  face: boolean;
  /** Only gestures that do something are tracked to completion. */
  armed: ReadonlySet<GestureId>;
}

export interface GestureEvent {
  id: GestureId;
  /** Where it happened, 0-1 of the camera picture. */
  x: number;
  y: number;
}

export interface GestureReading {
  events: GestureEvent[];
  /** Gestures being held right now, with how far along the hold they are (0-1). */
  held: { id: GestureId; progress: number }[];
}

const HAND_GESTURES = new Set<string>(['Thumb_Up', 'Thumb_Down', 'Victory', 'ILoveYou', 'Pointing_Up', 'Open_Palm', 'Closed_Fist']);
const MIN_SCORE = 0.6;
/** A gesture missing for less than this is still being held (the model drops the odd frame). */
const DROPOUT_MS = 180;
const SWING_WINDOW_MS = 1200;

interface Hold {
  since: number;
  lastSeen: number;
  fired: boolean;
  x: number;
  y: number;
}

interface Sample {
  t: number;
  v: number;
}

export class GestureDetector {
  private readonly holds = new Map<GestureId, Hold>();
  private readonly lastFired = new Map<GestureId, number>();
  private palmTrail: Sample[] = [];
  private yawTrail: Sample[] = [];
  private pitchTrail: Sample[] = [];

  reset(): void {
    this.holds.clear();
    this.palmTrail = [];
    this.yawTrail = [];
    this.pitchTrail = [];
  }

  update(input: GestureInput, options: GestureOptions): GestureReading {
    const { now } = input;
    const seen = new Map<GestureId, { x: number; y: number }>();
    const events: GestureEvent[] = [];
    const ready = (id: GestureId) => options.armed.has(id) && now - (this.lastFired.get(id) ?? -Infinity) >= options.cooldownMs;
    const fire = (id: GestureId, x: number, y: number) => {
      this.lastFired.set(id, now);
      events.push({ id, x, y });
    };

    if (options.hand) {
      let palm: HandSignal | null = null;
      for (const hand of input.hands) {
        const id: GestureId | null = hand.sign ?? (hand.score >= MIN_SCORE && HAND_GESTURES.has(hand.gesture) ? (hand.gesture as GestureId) : null);
        if (id) seen.set(id, { x: hand.x, y: hand.y });
        if (!hand.sign && hand.gesture === 'Open_Palm' && hand.score >= MIN_SCORE) palm ??= hand;
      }
      // A wave is an open palm swinging side to side.
      this.palmTrail = trail(this.palmTrail, palm ? palm.x : null, now);
      if (palm && countSwings(this.palmTrail, 0.035) >= 3 && ready('wave')) {
        fire('wave', palm.x, palm.y);
        this.palmTrail = [];
      }
    } else {
      this.palmTrail = [];
    }

    const face = options.face ? input.face : null;
    if (face) {
      const at = { x: face.cx, y: face.cy };
      if (face.blinkLeft > 0.55 && face.blinkRight < 0.3) seen.set('wink-left', at);
      if (face.blinkRight > 0.55 && face.blinkLeft < 0.3) seen.set('wink-right', at);
      if (face.blinkLeft > 0.6 && face.blinkRight > 0.6) seen.set('long-blink', at);
      if (face.browUp > 0.6) seen.set('brows-up', at);
      if (face.mouthOpen > 0.65) seen.set('mouth-open', at);
      if (face.smile > 0.75) seen.set('big-smile', at);
    }
    this.yawTrail = trail(this.yawTrail, face ? face.yaw : null, now);
    this.pitchTrail = trail(this.pitchTrail, face ? face.pitch : null, now);
    if (face && countSwings(this.yawTrail, 0.18) >= 3 && ready('shake')) {
      fire('shake', face.cx, face.cy);
      this.yawTrail = [];
    }
    if (face && countSwings(this.pitchTrail, 0.05) >= 3 && ready('nod')) {
      fire('nod', face.cx, face.cy);
      this.pitchTrail = [];
    }

    for (const [id, at] of seen) {
      let hold = this.holds.get(id);
      if (!hold || now - hold.lastSeen > DROPOUT_MS) {
        hold = { since: now, lastSeen: now, fired: false, ...at };
        this.holds.set(id, hold);
      }
      hold.lastSeen = now;
      hold.x = at.x;
      hold.y = at.y;
    }

    const held: GestureReading['held'] = [];
    for (const [id, hold] of this.holds) {
      if (now - hold.lastSeen > DROPOUT_MS) {
        // Released: the next hold may fire again.
        this.holds.delete(id);
        continue;
      }
      if (hold.fired || !options.armed.has(id)) continue;
      const needed = holdFor(id, options.holdMs);
      const progress = Math.min(1, (now - hold.since) / needed);
      if (progress >= 1 && ready(id)) {
        hold.fired = true;
        fire(id, hold.x, hold.y);
      } else {
        held.push({ id, progress });
      }
    }

    return { events, held };
  }
}

/** How long each gesture must be held. Winks are quick by nature; a closed fist or palm is held longer, as hands rest that way. */
export function holdFor(id: GestureId, holdMs: number): number {
  switch (id) {
    case 'wink-left':
    case 'wink-right':
      return Math.max(150, holdMs * 0.35);
    case 'long-blink':
      return Math.max(1000, holdMs);
    case 'Open_Palm':
    case 'Closed_Fist':
      return holdMs * 1.5;
    default:
      return holdMs;
  }
}

function trail(samples: Sample[], value: number | null, now: number): Sample[] {
  if (value === null) return [];
  const kept = samples.filter((s) => now - s.t <= SWING_WINDOW_MS);
  kept.push({ t: now, v: value });
  return kept;
}

/**
 * Counts the separate movements in a signal - left, right, left is three - ignoring wobbles
 * smaller than `amplitude`: each movement must travel at least that far from the last extreme.
 */
export function countSwings(samples: readonly Sample[], amplitude: number): number {
  if (samples.length < 3) return 0;
  let movements = 0;
  let direction = 0;
  let low = samples[0].v;
  let high = samples[0].v;
  let extreme = samples[0].v;
  for (const { v } of samples) {
    if (direction === 0) {
      low = Math.min(low, v);
      high = Math.max(high, v);
      if (v - low >= amplitude) direction = 1;
      else if (high - v >= amplitude) direction = -1;
      if (direction !== 0) {
        movements = 1;
        extreme = v;
      }
    } else if (direction > 0) {
      if (v > extreme) extreme = v;
      else if (extreme - v >= amplitude) {
        direction = -1;
        extreme = v;
        movements++;
      }
    } else {
      if (v < extreme) extreme = v;
      else if (v - extreme >= amplitude) {
        direction = 1;
        extreme = v;
        movements++;
      }
    }
  }
  return movements;
}
