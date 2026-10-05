/**
 * Turns per-frame face detections into stable people: each keeps its number while it moves
 * ("Guest 2" stays Guest 2), its box and expression are smoothed so masks don't jitter, and
 * a face the model briefly loses stays masked where it was last seen.
 *
 * Pure logic, no browser APIs, so the privacy rules here are easy to reason about.
 */

/** One face as the model saw it in one frame. Coordinates are 0-1 of the source picture. */
export interface FaceObservation {
  cx: number;
  cy: number;
  w: number;
  h: number;
  /** Head tilt in radians, from the line between the eyes. */
  roll: number;
  /** -1 (turned to its left) to 1 (turned to its right). */
  yaw: number;
  /** Nose height below the eyes as a share of the face's height; changes with a nod. */
  pitch: number;
  mouthOpen: number;
  blinkLeft: number;
  blinkRight: number;
  smile: number;
  browUp: number;
  /** Where the eyes look, -1 to 1, in picture directions: positive is toward the right and down. */
  lookX: number;
  lookY: number;
}

export interface TrackedFace extends FaceObservation {
  /** Stable for as long as the person stays tracked. */
  id: number;
  /** 1-based position, left to right, for labels like "Guest 1". */
  number: number;
  /** False while the face is held after the model lost it. */
  visible: boolean;
  lastSeen: number;
  firstSeen: number;
}

const MATCH_DISTANCE = 0.6; // in face widths
const POSITION_SMOOTHING = 0.55;
const EXPRESSION_SMOOTHING = 0.6;

export class FaceTracker {
  private faces: TrackedFace[] = [];
  private nextId = 1;

  get tracked(): readonly TrackedFace[] {
    return this.faces;
  }

  reset(): void {
    this.faces = [];
  }

  /**
   * Matches this frame's detections to the people already tracked (nearest centre, within
   * a fraction of the face's size), adds new people, and drops anyone unseen for longer
   * than `holdMs`.
   */
  update(observations: readonly FaceObservation[], now: number, holdMs: number): TrackedFace[] {
    const unmatched = new Set(this.faces.map((_, i) => i));
    const next: TrackedFace[] = [];

    // Largest faces first: they're the most reliable to match.
    const ordered = [...observations].sort((a, b) => b.w * b.h - a.w * a.h);
    for (const obs of ordered) {
      let best = -1;
      let bestDistance = Infinity;
      for (const i of unmatched) {
        const face = this.faces[i];
        const distance = Math.hypot(face.cx - obs.cx, face.cy - obs.cy) / Math.max(0.01, Math.max(face.w, obs.w));
        if (distance < bestDistance) {
          bestDistance = distance;
          best = i;
        }
      }

      if (best >= 0 && bestDistance <= MATCH_DISTANCE) {
        unmatched.delete(best);
        next.push(smooth(this.faces[best], obs, now));
      } else {
        next.push({ ...obs, id: this.nextId++, number: 0, visible: true, lastSeen: now, firstSeen: now });
      }
    }

    // Lost faces are held where they were last seen, so a missed frame never reveals them.
    for (const i of unmatched) {
      const face = this.faces[i];
      if (now - face.lastSeen <= holdMs) next.push({ ...face, visible: false });
    }

    next.sort((a, b) => a.cx - b.cx);
    next.forEach((face, i) => (face.number = i + 1));
    this.faces = next;
    return next;
  }
}

function smooth(previous: TrackedFace, obs: FaceObservation, now: number): TrackedFace {
  const p = (a: number, b: number) => a * POSITION_SMOOTHING + b * (1 - POSITION_SMOOTHING);
  const e = (a: number, b: number) => a * EXPRESSION_SMOOTHING + b * (1 - EXPRESSION_SMOOTHING);
  return {
    ...previous,
    cx: p(previous.cx, obs.cx),
    cy: p(previous.cy, obs.cy),
    // A face that grows (moves closer) is followed at once, so the mask never lags behind and shows an edge.
    w: Math.max(obs.w, p(previous.w, obs.w)),
    h: Math.max(obs.h, p(previous.h, obs.h)),
    roll: p(previous.roll, obs.roll),
    yaw: p(previous.yaw, obs.yaw),
    pitch: p(previous.pitch, obs.pitch),
    mouthOpen: e(previous.mouthOpen, obs.mouthOpen),
    blinkLeft: e(previous.blinkLeft, obs.blinkLeft),
    blinkRight: e(previous.blinkRight, obs.blinkRight),
    smile: e(previous.smile, obs.smile),
    browUp: e(previous.browUp, obs.browUp),
    lookX: e(previous.lookX, obs.lookX),
    lookY: e(previous.lookY, obs.lookY),
    visible: true,
    lastSeen: now,
  };
}

export interface PrivacyInput {
  /** Faces are being hidden at all. */
  protecting: boolean;
  strict: boolean;
  /** The face model loaded and is running. */
  modelReady: boolean;
  /** When the last detection finished, or null before the first one. */
  lastDetectionAt: number | null;
  now: number;
  visibleFaces: number;
  heldFaces: number;
  /** Share of the picture the person-segmentation model marks as a person, or null when it isn't running. */
  personCoverage: number | null;
}

export interface PrivacyVerdict {
  /** Cover the whole camera picture. */
  curtain: boolean;
  reason: string | null;
}

/** Longer than this without a detection means the model has stalled, which is treated as blind. */
export const DETECTION_STALE_MS = 700;

/** A person filling more of the picture than this, with no face found, is someone the face model is missing. */
export const PERSON_WITHOUT_FACE = 0.04;

/**
 * Whether the camera picture may be shown. With protection on it fails closed: a model that
 * isn't ready or has stalled covers everything. In strict mode, so does a face that was just
 * lost (beyond the per-face hold) or a person the body model sees without a face.
 */
export function privacyVerdict(input: PrivacyInput): PrivacyVerdict {
  if (!input.protecting) return { curtain: false, reason: null };

  if (!input.modelReady) return { curtain: true, reason: 'Starting face tracking…' };
  if (input.lastDetectionAt === null || input.now - input.lastDetectionAt > DETECTION_STALE_MS)
    return { curtain: true, reason: 'Face tracking paused' };

  if (!input.strict) return { curtain: false, reason: null };

  if (input.heldFaces > 0 && input.visibleFaces === 0)
    return { curtain: true, reason: 'Looking for faces…' };
  if (input.personCoverage !== null && input.personCoverage > PERSON_WITHOUT_FACE && input.visibleFaces === 0)
    return { curtain: true, reason: 'Face not found - turn toward the camera' };

  return { curtain: false, reason: null };
}
