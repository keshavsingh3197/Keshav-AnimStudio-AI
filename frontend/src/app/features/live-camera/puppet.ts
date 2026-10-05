import type { CharacterDesign } from './character-designer';
import { tone } from './characters-3d';
import type { ReactionKind } from './gestures';
import { BodyPose, HAND, HandPose, POSE, VISIBLE } from './motion';

/**
 * The body puppet: a cartoon body for a character, posed from the presenter's own body and
 * fingers (so a wave, a thumbs-up or a shrug on camera is a wave, thumbs-up or shrug on the
 * character), or animated on its own for the corner mascot.
 *
 * Only the body is drawn here; the head is the character itself, drawn by the caller on top.
 */

export interface P {
  x: number;
  y: number;
}

/** A body in pixels of the canvas it is drawn on. Left/right are the character's own. */
export interface Skeleton {
  lShoulder: P;
  rShoulder: P;
  lElbow: P;
  rElbow: P;
  lWrist: P;
  rWrist: P;
  lHip: P;
  rHip: P;
  lKnee: P | null;
  rKnee: P | null;
  lAnkle: P | null;
  rAnkle: P | null;
  /** 21 points per hand, or null for a plain mitten. */
  lHand: P[] | null;
  rHand: P[] | null;
  /** Where the head goes, and how big. */
  head: { x: number; y: number; r: number };
  /** Limb thickness in pixels. */
  unit: number;
}

export interface PuppetLook {
  shirt: string;
  pants: string;
  skin: string;
  gloves: string;
  shoes: string;
}

const LOOKS: Record<string, PuppetLook> = {
  hero: { shirt: '#2f6fd6', pants: '#26324a', skin: '#eebd96', gloves: '#eebd96', shoes: '#f1f3f8' },
  star: { shirt: '#c2185b', pants: '#1d1d2b', skin: '#f5cdb0', gloves: '#f5cdb0', shoes: '#f4c542' },
  grandpa: { shirt: '#8a6f4e', pants: '#4a4f5c', skin: '#e2b08c', gloves: '#e2b08c', shoes: '#3a2418' },
  kid: { shirt: '#ffb020', pants: '#2c5aa0', skin: '#c68a5c', gloves: '#c68a5c', shoes: '#ff4d5e' },
  cyborg: { shirt: '#b9c2cf', pants: '#5b6577', skin: '#d7dde6', gloves: '#38e1ff', shoes: '#3d4656' },
  robot: { shirt: '#9aa4b2', pants: '#5b6577', skin: '#c6cdd8', gloves: '#7d8796', shoes: '#3a4150' },
  cat: { shirt: '#f29e4c', pants: '#8a4b1c', skin: '#f29e4c', gloves: '#fff1e6', shoes: '#5a2e10' },
  fox: { shirt: '#e8742c', pants: '#3a2318', skin: '#e8742c', gloves: '#3a2318', shoes: '#2a1810' },
  panda: { shirt: '#1d1d22', pants: '#1d1d22', skin: '#f7f7f5', gloves: '#1d1d22', shoes: '#111114' },
  alien: { shirt: '#7bd88f', pants: '#3f7a4b', skin: '#7bd88f', gloves: '#b7f5c2', shoes: '#24402b' },
  bear: { shirt: '#8b5a3c', pants: '#5a3a28', skin: '#8b5a3c', gloves: '#d9a27f', shoes: '#3a2418' },
  ghost: { shirt: '#f4f6ff', pants: '#dfe3ff', skin: '#f4f6ff', gloves: '#f4f6ff', shoes: '#c9cff5' },
  frog: { shirt: '#5dbb63', pants: '#2f7a3a', skin: '#5dbb63', gloves: '#a8e6a1', shoes: '#1f5a28' },
  astronaut: { shirt: '#eef1f6', pants: '#c9d0dc', skin: '#eef1f6', gloves: '#ff8a3d', shoes: '#9aa4b2' },
  pumpkin: { shirt: '#3f6b2a', pants: '#2a3350', skin: '#f28c28', gloves: '#3f6b2a', shoes: '#1d1d22' },
};

/** The body colours that go with a character. */
export function lookFor(ref: string, design: CharacterDesign, accent: string): PuppetLook {
  if (ref === 'custom') return { shirt: design.outfit, pants: design.pants, skin: design.skin, gloves: design.gloves, shoes: design.pants };
  return LOOKS[ref] ?? { shirt: accent, pants: '#2a3350', skin: '#ffd2a8', gloves: '#ffffff', shoes: '#1d1d22' };
}

/**
 * Builds a skeleton from one tracked body. `map` turns camera coordinates (0-1) into canvas
 * pixels, including any crop and mirror. Joints the model can't see are filled in with a
 * relaxed pose - arms hanging, hips below the shoulders - so a seated presenter still gets a
 * whole body. Returns null when the shoulders themselves aren't visible.
 */
export function skeletonFromPose(
  body: BodyPose,
  hands: readonly HandPose[],
  map: (x: number, y: number) => P,
  thickness: number,
  legs: boolean,
): Skeleton | null {
  const pt = body.points;
  const seen = (i: number) => (pt[i]?.v ?? 0) >= VISIBLE;
  const at = (i: number) => map(pt[i].x, pt[i].y);
  if ((pt[POSE.leftShoulder]?.v ?? 0) < 0.4 || (pt[POSE.rightShoulder]?.v ?? 0) < 0.4) return null;

  const ls = at(POSE.leftShoulder);
  const rs = at(POSE.rightShoulder);
  const sw = dist(ls, rs);
  if (sw < 4) return null;

  // "Down" for this body: across the shoulder line, toward the bottom of the picture.
  let down = norm({ x: -(rs.y - ls.y), y: rs.x - ls.x });
  if (down.y < 0) down = { x: -down.x, y: -down.y };
  const mid = lerp(ls, rs, 0.5);
  const outward = (s: P) => norm({ x: s.x - mid.x, y: s.y - mid.y });

  const hip = (i: number, shoulder: P) =>
    seen(i) ? at(i) : add(lerp(shoulder, mid, 0.12), scale(down, sw * 1.35));
  const elbow = (i: number, shoulder: P) =>
    seen(i) ? at(i) : add(add(shoulder, scale(down, sw * 0.72)), scale(outward(shoulder), sw * 0.12));
  const wrist = (i: number, e: P, shoulder: P, elbowSeen: boolean) => {
    if (seen(i)) return at(i);
    const along = elbowSeen ? norm({ x: e.x - shoulder.x, y: e.y - shoulder.y }) : down;
    return add(e, scale(along, sw * 0.66));
  };

  const lElbow = elbow(POSE.leftElbow, ls);
  const rElbow = elbow(POSE.rightElbow, rs);
  let lWrist = wrist(POSE.leftWrist, lElbow, ls, seen(POSE.leftElbow));
  let rWrist = wrist(POSE.rightWrist, rElbow, rs, seen(POSE.rightElbow));
  const lHip = hip(POSE.leftHip, ls);
  const rHip = hip(POSE.rightHip, rs);

  // Each tracked hand goes to the nearer wrist, and the wrist moves to the hand's own (more precise) wrist point.
  let lHand: P[] | null = null;
  let rHand: P[] | null = null;
  for (const hand of hands) {
    const points = hand.points.map((p) => map(p.x, p.y));
    const w = points[HAND.wrist];
    const dl = dist(w, lWrist);
    const dr = dist(w, rWrist);
    if (Math.min(dl, dr) > sw * 0.9) continue;
    if (dl <= dr && !lHand) {
      lHand = points;
      lWrist = w;
    } else if (!rHand) {
      rHand = points;
      rWrist = w;
    }
  }

  const leg = (i: number) => (legs && seen(i) ? at(i) : null);
  const lKnee = leg(POSE.leftKnee);
  const rKnee = leg(POSE.rightKnee);

  let head = { x: mid.x - down.x * sw * 0.75, y: mid.y - down.y * sw * 0.75, r: sw * 0.42 };
  if (seen(POSE.leftEar) && seen(POSE.rightEar)) {
    const c = lerp(at(POSE.leftEar), at(POSE.rightEar), 0.5);
    head = { x: c.x, y: c.y, r: Math.max(sw * 0.35, dist(at(POSE.leftEar), at(POSE.rightEar)) * 0.85) };
  } else if (seen(POSE.nose)) {
    const n = at(POSE.nose);
    head = { x: n.x, y: n.y, r: sw * 0.42 };
  }

  return {
    lShoulder: ls,
    rShoulder: rs,
    lElbow,
    rElbow,
    lWrist,
    rWrist,
    lHip,
    rHip,
    lKnee,
    rKnee,
    lAnkle: lKnee ? leg(POSE.leftAnkle) : null,
    rAnkle: rKnee ? leg(POSE.rightAnkle) : null,
    lHand,
    rHand,
    head,
    unit: sw * 0.24 * thickness,
  };
}

type Ctx = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

const OUTLINE = 'rgba(20,16,32,.9)';

/** Draws the body: legs, torso, neck, arms and hands. The head is drawn afterwards by the caller. */
export function drawPuppetBody(ctx: Ctx, sk: Skeleton, look: PuppetLook): void {
  const u = Math.max(3, sk.unit);
  const o = Math.max(1.5, u * 0.14);
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Legs, behind the torso.
  for (const [hip, knee, ankle] of [[sk.lHip, sk.lKnee, sk.lAnkle], [sk.rHip, sk.rKnee, sk.rAnkle]] as const) {
    if (!knee) continue;
    limb(ctx, ankle ? [hip, knee, ankle] : [hip, knee], u * 1.25, look.pants, o);
    if (ankle) {
      ctx.beginPath();
      ctx.ellipse(ankle.x, ankle.y + u * 0.2, u * 0.85, u * 0.5, 0, 0, Math.PI * 2);
      fillOutlined(ctx, look.shoes, o);
    }
  }

  // Neck, then the torso as a soft trapezoid from the shoulders to the hips.
  const mid = lerp(sk.lShoulder, sk.rShoulder, 0.5);
  limb(ctx, [mid, lerp(mid, sk.head, 0.55)], u * 0.9, look.skin, o);

  const across = norm({ x: sk.rShoulder.x - sk.lShoulder.x, y: sk.rShoulder.y - sk.lShoulder.y });
  const ls = add(sk.lShoulder, scale(across, -u * 0.45));
  const rs = add(sk.rShoulder, scale(across, u * 0.45));
  const lh = add(sk.lHip, scale(across, -u * 0.3));
  const rh = add(sk.rHip, scale(across, u * 0.3));
  const hipMid = lerp(lh, rh, 0.5);
  ctx.beginPath();
  ctx.moveTo(ls.x, ls.y);
  ctx.quadraticCurveTo(mid.x, mid.y - u * 0.35, rs.x, rs.y);
  ctx.quadraticCurveTo((rs.x + rh.x) / 2 + across.x * u * 0.25, (rs.y + rh.y) / 2, rh.x, rh.y);
  ctx.quadraticCurveTo(hipMid.x, hipMid.y + u * 0.25, lh.x, lh.y);
  ctx.quadraticCurveTo((ls.x + lh.x) / 2 - across.x * u * 0.25, (ls.y + lh.y) / 2, ls.x, ls.y);
  ctx.closePath();
  // Lit from the top left, like the heads, so the torso reads as round rather than flat.
  const reach = Math.max(u, dist(ls, rh));
  const torso = ctx.createRadialGradient(ls.x + (rs.x - ls.x) * 0.3, ls.y, reach * 0.05, mid.x, (mid.y + hipMid.y) / 2, reach * 0.85);
  torso.addColorStop(0, tone(look.shirt, 0.25));
  torso.addColorStop(0.55, look.shirt);
  torso.addColorStop(1, tone(look.shirt, -0.35));
  fillOutlined(ctx, torso, o);

  // Arms: a sleeve to the elbow, then the forearm, then the hand.
  for (const [shoulder, elbow, wrist, hand] of [
    [sk.lShoulder, sk.lElbow, sk.lWrist, sk.lHand],
    [sk.rShoulder, sk.rElbow, sk.rWrist, sk.rHand],
  ] as const) {
    limb(ctx, [shoulder, elbow, wrist], u, look.skin, o);
    limb(ctx, [shoulder, lerp(shoulder, elbow, 0.92)], u * 1.12, look.shirt, o);
    if (hand) drawHand(ctx, hand, look.gloves, o);
    else {
      ctx.beginPath();
      ctx.arc(wrist.x, wrist.y, u * 0.72, 0, Math.PI * 2);
      fillOutlined(ctx, look.gloves, o);
    }
  }
  ctx.restore();
}

/** A gloved hand from 21 points: the palm, then each finger as a rounded stroke through its joints. */
export function drawHand(ctx: Ctx, points: readonly P[], glove: string, outline: number): void {
  const palmSize = dist(points[HAND.wrist], points[HAND.middle[0]]);
  if (palmSize < 2) return;
  const finger = Math.max(2, palmSize * 0.3);

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const chains = [HAND.thumb, HAND.index, HAND.middle, HAND.ring, HAND.pinky].map((c) => [points[c === HAND.thumb ? HAND.wrist : c[0]], ...c.map((i) => points[i])]);

  // Outline pass for everything first, so fingers merge into the palm without seams.
  ctx.strokeStyle = OUTLINE;
  ctx.fillStyle = OUTLINE;
  ctx.lineWidth = finger + outline * 2;
  for (const chain of chains) polyline(ctx, chain);
  palmPath(ctx, points);
  ctx.lineWidth = outline * 2;
  ctx.stroke();
  ctx.fill();

  ctx.strokeStyle = glove;
  ctx.fillStyle = glove;
  ctx.lineWidth = finger;
  for (const chain of chains) polyline(ctx, chain);
  palmPath(ctx, points);
  ctx.fill();
  ctx.restore();
}

function palmPath(ctx: Ctx, points: readonly P[]): void {
  ctx.beginPath();
  HAND.palm.forEach((i, k) => (k === 0 ? ctx.moveTo(points[i].x, points[i].y) : ctx.lineTo(points[i].x, points[i].y)));
  ctx.closePath();
}

function polyline(ctx: Ctx, pts: readonly P[]): void {
  ctx.beginPath();
  pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.stroke();
}

function limb(ctx: Ctx, pts: readonly P[], width: number, color: string, outline: number): void {
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = width + outline * 2;
  polyline(ctx, pts);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  polyline(ctx, pts);
  // Shade and a highlight along the limb, so it looks like a cylinder. Both stay inside the
  // limb: offset plus half their width is under half the limb's width.
  const shifted = (k: number) => pts.map((p) => ({ x: p.x + width * k, y: p.y + width * k }));
  ctx.strokeStyle = 'rgba(10,5,20,.2)';
  ctx.lineWidth = width * 0.3;
  polyline(ctx, shifted(0.2));
  ctx.strokeStyle = 'rgba(255,255,255,.22)';
  ctx.lineWidth = width * 0.28;
  polyline(ctx, shifted(-0.18));
}

function fillOutlined(ctx: Ctx, fill: string | CanvasGradient, outline: number): void {
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = outline;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
}

// ------------------------------------------------------------------ hand shapes for the mascot

export type HandShape = 'open' | 'fist' | 'thumb' | 'victory' | 'point' | 'love';

const EXTENDED: Record<HandShape, readonly boolean[]> = {
  open: [true, true, true, true, true],
  fist: [false, false, false, false, false],
  thumb: [true, false, false, false, false],
  victory: [false, true, true, false, false],
  point: [false, true, false, false, false],
  love: [true, true, false, false, true],
};

/**
 * 21 hand points for a shape, with the wrist at `wrist`, fingers pointing along `angle`
 * (radians, 0 = up) and the palm `size` pixels long. `side` -1 puts the thumb on the left.
 */
export function handTemplate(shape: HandShape, wrist: P, angle: number, size: number, side: 1 | -1 = 1): P[] {
  const ext = EXTENDED[shape];
  // In hand space: wrist at the origin, fingers toward -y, palm one unit long.
  const local: P[] = [{ x: 0, y: 0 }];
  // Thumb: points up when it's the only finger out (a thumbs-up), outward otherwise.
  const thumbDir = ext[0] ? (shape === 'thumb' ? norm({ x: -0.15, y: -1 }) : norm({ x: -0.8, y: -0.6 })) : norm({ x: 0.7, y: -0.5 });
  let tp = { x: -0.32, y: -0.22 };
  local.push(tp);
  for (const len of [0.32, 0.26, 0.22]) {
    tp = add(tp, scale(thumbDir, len));
    local.push(tp);
  }
  const knuckles = [{ x: -0.26, y: -1 }, { x: -0.06, y: -1.06 }, { x: 0.14, y: -1.0 }, { x: 0.32, y: -0.88 }];
  knuckles.forEach((k, f) => {
    local.push(k);
    if (ext[f + 1]) {
      const spread = norm({ x: (f - 1.5) * 0.14, y: -1 });
      let p = k;
      for (const len of [0.38, 0.27, 0.22]) {
        p = add(p, scale(spread, len));
        local.push(p);
      }
    } else {
      // Curled into the palm.
      local.push({ x: k.x, y: k.y - 0.18 }, { x: k.x * 0.9, y: k.y + 0.12 }, { x: k.x * 0.8, y: k.y + 0.3 });
    }
  });

  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return local.map((p) => {
    const x = p.x * side * size;
    const y = p.y * size;
    return { x: wrist.x + x * cos - y * sin, y: wrist.y + x * sin + y * cos };
  });
}

// ------------------------------------------------------------------ the mascot's own animation

export interface MascotAct {
  kind: ReactionKind;
  /** 0-1 through the act. */
  progress: number;
}

/** Expression changes a mascot makes while acting. */
export interface MascotFace {
  mouthOpen: number;
  smile: number;
  blink: number;
}

/**
 * A procedurally animated mascot body in `box`: idle breathing and swaying, an occasional blink,
 * and a short act for each reaction - waving, thumbs-up, a heart over the head, cheering, clapping.
 */
export function mascotSkeleton(box: { x: number; y: number; w: number; h: number }, t: number, act: MascotAct | null): { skeleton: Skeleton; face: MascotFace } {
  const { x, y, w, h } = box;
  const cx = x + w / 2;
  const ease = act ? Math.sin(Math.min(1, act.progress) * Math.PI) : 0; // in and out
  const hop = act && ['confetti', 'stars', 'fire', 'laugh'].includes(act.kind) ? Math.abs(Math.sin(act.progress * Math.PI * 4)) * h * 0.04 : 0;
  const breathe = Math.sin(t * 2.2) * h * 0.006;
  const sway = Math.sin(t * 1.3) * w * 0.012;
  const top = y - hop + breathe;

  const ls = { x: cx - w * 0.17 + sway, y: top + h * 0.47 };
  const rs = { x: cx + w * 0.17 + sway, y: top + h * 0.47 };
  const lh = { x: cx - w * 0.11, y: top + h * 0.72 };
  const rh = { x: cx + w * 0.11, y: top + h * 0.72 };
  const arm = h * 0.15;
  const palm = h * 0.06;
  const hang = (s: P, side: -1 | 1, phase: number) => {
    const e = { x: s.x + side * w * 0.03, y: s.y + arm };
    const wr = { x: e.x + side * w * 0.01 + Math.sin(t * 1.3 + phase) * w * 0.01, y: e.y + arm * 0.95 };
    return { e, wr };
  };

  let l = hang(ls, -1, 0);
  let r = hang(rs, 1, 1.4);
  let lShape: HandShape = 'open';
  let rShape: HandShape = 'open';
  let lAngle = Math.PI; // pointing down
  let rAngle = Math.PI;
  let face: MascotFace = { mouthOpen: 0, smile: 0.4, blink: blinkAt(t) };

  if (act) {
    const k = ease;
    const mix = (a: P, b: P) => lerp(a, b, k);
    face = { ...face, smile: 0.4 + 0.6 * k };
    switch (act.kind) {
      case 'wave': {
        const e = { x: rs.x + w * 0.16, y: rs.y - arm * 0.15 };
        const swing = Math.sin(act.progress * Math.PI * 6) * 0.45;
        const wr = { x: e.x + Math.sin(swing) * arm, y: e.y - Math.cos(swing) * arm };
        r = { e: mix(r.e, e), wr: mix(r.wr, wr) };
        rAngle = lerpAngle(Math.PI, swing, k);
        face.mouthOpen = 0.25 * k;
        break;
      }
      case 'thumbs': {
        const e = { x: rs.x + w * 0.12, y: rs.y + arm * 0.6 };
        const wr = { x: e.x + w * 0.02, y: e.y - arm * 0.6 };
        r = { e: mix(r.e, e), wr: mix(r.wr, wr) };
        rShape = k > 0.3 ? 'thumb' : 'open';
        rAngle = lerpAngle(Math.PI, 0, k);
        break;
      }
      case 'hearts': {
        const headTop = top + h * 0.06;
        for (const side of [-1, 1] as const) {
          const s = side < 0 ? ls : rs;
          const e = { x: s.x + side * w * 0.14, y: s.y - arm * 0.7 };
          const wr = { x: cx + side * w * 0.03, y: headTop };
          const moved = { e: lerp(side < 0 ? l.e : r.e, e, k), wr: lerp(side < 0 ? l.wr : r.wr, wr, k) };
          if (side < 0) l = moved;
          else r = moved;
        }
        lAngle = lerpAngle(Math.PI, 0.9, k);
        rAngle = lerpAngle(Math.PI, -0.9, k);
        break;
      }
      case 'clap': {
        const meet = Math.abs(Math.sin(act.progress * Math.PI * 7)) * w * 0.07;
        for (const side of [-1, 1] as const) {
          const s = side < 0 ? ls : rs;
          const e = { x: s.x + side * w * 0.08, y: s.y + arm * 0.8 };
          const wr = { x: cx + side * (w * 0.02 + meet), y: s.y + arm * 0.35 };
          const moved = { e: lerp(side < 0 ? l.e : r.e, e, k), wr: lerp(side < 0 ? l.wr : r.wr, wr, k) };
          if (side < 0) l = moved;
          else r = moved;
        }
        lAngle = lerpAngle(Math.PI, 0.25, k);
        rAngle = lerpAngle(Math.PI, -0.25, k);
        face.mouthOpen = 0.35 * k;
        break;
      }
      case 'wow':
      case 'laugh': {
        for (const side of [-1, 1] as const) {
          const s = side < 0 ? ls : rs;
          const e = { x: s.x + side * w * 0.07, y: s.y + arm * 0.7 };
          const wr = { x: cx + side * w * 0.12, y: top + h * 0.3 };
          const moved = { e: lerp(side < 0 ? l.e : r.e, e, k), wr: lerp(side < 0 ? l.wr : r.wr, wr, k) };
          if (side < 0) l = moved;
          else r = moved;
        }
        lAngle = lerpAngle(Math.PI, 0.2, k);
        rAngle = lerpAngle(Math.PI, -0.2, k);
        face.mouthOpen = (act.kind === 'wow' ? 0.8 : 0.45 + Math.abs(Math.sin(act.progress * 20)) * 0.3) * k;
        break;
      }
      default: {
        // Cheer: both arms up in a V.
        for (const side of [-1, 1] as const) {
          const s = side < 0 ? ls : rs;
          const e = { x: s.x + side * w * 0.12, y: s.y - arm * 0.7 };
          const wr = { x: s.x + side * w * 0.2, y: s.y - arm * 1.6 };
          const moved = { e: lerp(side < 0 ? l.e : r.e, e, k), wr: lerp(side < 0 ? l.wr : r.wr, wr, k) };
          if (side < 0) l = moved;
          else r = moved;
        }
        lAngle = lerpAngle(Math.PI, -0.35, k);
        rAngle = lerpAngle(Math.PI, 0.35, k);
        face.mouthOpen = 0.5 * k;
      }
    }
  }

  return {
    skeleton: {
      lShoulder: ls,
      rShoulder: rs,
      lElbow: l.e,
      rElbow: r.e,
      lWrist: l.wr,
      rWrist: r.wr,
      lHip: lh,
      rHip: rh,
      lKnee: { x: lh.x - w * 0.01, y: top + h * 0.85 },
      rKnee: { x: rh.x + w * 0.01, y: top + h * 0.85 },
      lAnkle: { x: lh.x - w * 0.02, y: y + h * 0.96 },
      rAnkle: { x: rh.x + w * 0.02, y: y + h * 0.96 },
      lHand: handTemplate(lShape, l.wr, lAngle, palm, -1),
      rHand: handTemplate(rShape, r.wr, rAngle, palm, 1),
      head: { x: cx + sway, y: top + h * 0.25, r: w * 0.24 },
      unit: w * 0.075,
    },
    face,
  };
}

/** A quick blink every few seconds. */
function blinkAt(t: number): number {
  const phase = t % 3.7;
  return phase < 0.14 ? Math.sin((phase / 0.14) * Math.PI) : 0;
}

// ------------------------------------------------------------------ vector helpers

function dist(a: P, b: P): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function lerp(a: P, b: P, t: number): P {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

function lerpAngle(a: number, b: number, t: number): number {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

function add(a: P, b: P): P {
  return { x: a.x + b.x, y: a.y + b.y };
}

function scale(a: P, s: number): P {
  return { x: a.x * s, y: a.y * s };
}

function norm(a: P): P {
  const l = Math.hypot(a.x, a.y) || 1;
  return { x: a.x / l, y: a.y / l };
}
