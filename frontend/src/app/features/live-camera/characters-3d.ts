import type { Expression } from './characters';

/**
 * The 3D-look characters: stylised people (and a chrome robot) drawn with light and shade,
 * whose faces sit on a sphere and turn and nod with the presenter's head. Every feature is
 * placed by projecting a point on that sphere through the head's turn, so the nose moves more
 * than the eyes, the far eye narrows and the near ear shows - the cues that read as 3D - while
 * staying a plain 2D canvas drawing that costs a fraction of a millisecond.
 *
 * Like every character, each one paints an opaque disc of radius `r` first, so the face
 * underneath is always covered whatever the head is doing.
 */

type Ctx = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

export type HairStyle = 'quiff' | 'long' | 'bald' | 'cap';

interface HumanSpec {
  skin: string;
  hair: string;
  iris: string;
  lips: string;
  style: HairStyle;
  /** Cap colour, for the `cap` style. */
  hat?: string;
  eyeSize: number;
  brow: number;
  lashes?: boolean;
  freckles?: boolean;
  mustache?: boolean;
  glasses?: boolean;
  wrinkles?: boolean;
}

const HUMANS = {
  hero: { skin: '#eebd96', hair: '#4a2c1a', iris: '#6b4423', lips: '#c47a6a', style: 'quiff', eyeSize: 1, brow: 1.1 },
  star: { skin: '#f5cdb0', hair: '#2e1d42', iris: '#3f73a8', lips: '#d4506b', style: 'long', eyeSize: 1.12, brow: 0.8, lashes: true },
  grandpa: { skin: '#e2b08c', hair: '#ece9e4', iris: '#4f6b7a', lips: '#b8735f', style: 'bald', eyeSize: 0.9, brow: 1.5, mustache: true, glasses: true, wrinkles: true },
  kid: { skin: '#c68a5c', hair: '#1f1510', iris: '#3b2414', lips: '#a85f4f', style: 'cap', hat: '#ff4d5e', eyeSize: 1.2, brow: 0.9, freckles: true },
} satisfies Record<string, HumanSpec>;

export type Character3DId = keyof typeof HUMANS | 'cyborg';

export const CHARACTER_3D_IDS: readonly Character3DId[] = ['hero', 'star', 'grandpa', 'kid', 'cyborg'];

export function drawCharacter3D(ctx: Ctx, id: Character3DId, r: number, e: Expression): void {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (id === 'cyborg') drawCyborg(ctx, r, e);
  else drawHuman(ctx, r, e, HUMANS[id]);
  ctx.restore();
}

// ------------------------------------------------------------------ the head as a sphere

interface HeadPose {
  r: number;
  cosY: number;
  sinY: number;
  cosN: number;
  sinN: number;
}

/** A turned head: up to about 37 degrees side to side and 20 up and down. */
function headPose(r: number, e: Expression): HeadPose {
  const yaw = clamp(e.yaw ?? 0, -1, 1) * 0.65;
  const nod = clamp(e.nod ?? 0, -1, 1) * 0.35;
  return { r, cosY: Math.cos(yaw), sinY: Math.sin(yaw), cosN: Math.cos(nod), sinN: Math.sin(nod) };
}

interface Projected {
  x: number;
  y: number;
  /** How much a feature here is squashed across and down by the turn, 0-1. */
  sx: number;
  sy: number;
  /** How much the point faces the viewer, 0 (edge-on or behind) to 1. */
  facing: number;
}

/**
 * Where a point on the face lands after the head turns. `u` runs across the face and `v` down
 * it, both in head radii; `lift` above 1 is for parts that stand out of the sphere, like the nose.
 */
function at(p: HeadPose, u: number, v: number, lift = 1): Projected {
  const z0 = Math.sqrt(Math.max(0.0001, 1 - u * u - v * v));
  const z = z0 * lift;
  const x1 = u * p.cosY + z * p.sinY;
  const z1 = -u * p.sinY + z * p.cosY;
  const y1 = v * p.cosN + z1 * p.sinN;
  const z2 = -v * p.sinN + z1 * p.cosN;
  const slope = 1 / Math.max(0.25, z0);
  return {
    x: x1 * p.r,
    y: y1 * p.r,
    sx: clamp(p.cosY - u * slope * p.sinY, 0.12, 1),
    sy: clamp(p.cosN - v * slope * p.sinN, 0.3, 1),
    facing: clamp(z2 / lift, 0, 1),
  };
}

// ------------------------------------------------------------------ people

function drawHuman(ctx: Ctx, r: number, e: Expression, s: HumanSpec): void {
  const p = headPose(r, e);

  if (s.style === 'long') hairBack(ctx, p, s);
  ears(ctx, p, s);

  // The cover disc, lit from the top left: this is the head itself.
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = sphereFill(ctx, r, s.skin, p);
  ctx.fill();
  ctx.lineWidth = Math.max(1, r * 0.02);
  ctx.strokeStyle = 'rgba(70,35,25,.35)';
  ctx.stroke();

  // Warmth where the light passes through the skin, and the cheeks.
  for (const side of [-1, 1]) {
    const c = at(p, side * 0.5, 0.24);
    if (c.facing < 0.1) continue;
    const glow = r * (0.2 + e.smile * 0.05);
    soft(ctx, c.x, c.y, glow * c.sx, glow * 0.75, `rgba(255,105,110,${0.16 + e.smile * 0.16})`);
  }
  if (s.freckles) freckles(ctx, p);
  if (s.wrinkles) wrinkles(ctx, p);

  for (const side of [-1, 1] as const) eye(ctx, p, side, e, s);
  for (const side of [-1, 1] as const) brow(ctx, p, side, e, s);
  nose(ctx, p, s);
  mouth(ctx, p, e, s);
  if (s.mustache) mustache(ctx, p, s);
  if (s.glasses) glasses(ctx, p);
  hairFront(ctx, p, s);
}

function ears(ctx: Ctx, p: HeadPose, s: HumanSpec): void {
  const r = p.r;
  for (const side of [-1, 1]) {
    // Ears sit on the sides of the sphere; the far one swings in behind the head (painted after).
    const x = side * p.cosY * r * 0.97 + p.sinY * r * 0.05;
    const y = r * 0.06 + p.sinN * r * 0.1;
    ctx.beginPath();
    ctx.ellipse(x, y, r * 0.17, r * 0.26, side * 0.15, 0, Math.PI * 2);
    ctx.fillStyle = tone(s.skin, -0.06);
    ctx.fill();
    ctx.strokeStyle = 'rgba(70,35,25,.35)';
    ctx.lineWidth = Math.max(1, r * 0.02);
    ctx.stroke();
    soft(ctx, x + side * r * 0.02, y, r * 0.07, r * 0.14, 'rgba(120,50,40,.28)');
  }
}

function eye(ctx: Ctx, p: HeadPose, side: -1 | 1, e: Expression, s: HumanSpec): void {
  const r = p.r;
  const c = at(p, side * 0.36, -0.06 - e.browUp * 0.025);
  if (c.sx < 0.22 || c.facing < 0.12) return;
  const rx = r * 0.165 * s.eyeSize * c.sx;
  const ry = r * 0.13 * s.eyeSize * c.sy;
  const blink = side < 0 ? e.blinkLeft : e.blinkRight;
  const open = clamp(1 - blink * 1.15, 0, 1);

  // The socket: a soft shade around the eye.
  soft(ctx, c.x, c.y - ry * 0.2, rx * 1.55, ry * 1.7, 'rgba(90,40,30,.16)');

  ctx.save();
  ctx.beginPath();
  ctx.ellipse(c.x, c.y, rx, ry, 0, 0, Math.PI * 2);
  ctx.clip();

  const white = ctx.createRadialGradient(c.x - rx * 0.3, c.y - ry * 0.4, rx * 0.1, c.x, c.y, rx * 1.1);
  white.addColorStop(0, '#ffffff');
  white.addColorStop(0.6, '#eeeaf0');
  white.addColorStop(1, '#b8adbd');
  ctx.fillStyle = white;
  ctx.fillRect(c.x - rx, c.y - ry, rx * 2, ry * 2);

  // The iris follows the gaze.
  const ir = ry * 0.78;
  const ix = c.x + clamp(e.lookX ?? 0, -1, 1) * rx * 0.42;
  const iy = c.y + clamp(e.lookY ?? 0, -1, 1) * ry * 0.3;
  const irx = ir * Math.max(0.55, c.sx);
  const iris = ctx.createRadialGradient(ix, iy, ir * 0.1, ix, iy, ir);
  iris.addColorStop(0, tone(s.iris, 0.45));
  iris.addColorStop(0.55, s.iris);
  iris.addColorStop(1, tone(s.iris, -0.55));
  ctx.beginPath();
  ctx.ellipse(ix, iy, irx, ir, 0, 0, Math.PI * 2);
  ctx.fillStyle = iris;
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(ix, iy, irx * 0.46, ir * 0.46, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#0b0a10';
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(ix - irx * 0.35, iy - ir * 0.38, ir * 0.24, ir * 0.24, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,.92)';
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(ix + irx * 0.32, iy + ir * 0.3, ir * 0.1, ir * 0.1, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,.7)';
  ctx.fill();

  // The eyelids close over it from above, and push up a little from below with a smile.
  const lidY = c.y - ry * 2.05 * open;
  ctx.beginPath();
  ctx.ellipse(c.x, lidY, rx * 1.15, ry * 1.08, 0, 0, Math.PI * 2);
  ctx.fillStyle = tone(s.skin, -0.04);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(c.x, c.y + ry * (2.05 - e.smile * 0.35), rx * 1.15, ry * 1.08, 0, 0, Math.PI * 2);
  ctx.fillStyle = tone(s.skin, -0.02);
  ctx.fill();
  // The upper lid's shadow on the eyeball.
  ctx.beginPath();
  ctx.ellipse(c.x, lidY + ry * 0.25, rx * 1.15, ry * 1.08, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(60,20,20,.12)';
  ctx.fill();
  ctx.restore();

  // The lash line along the edge of the upper lid.
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(c.x, c.y, rx * 1.18, ry * 1.25, 0, 0, Math.PI * 2);
  ctx.clip();
  ctx.beginPath();
  ctx.ellipse(c.x, lidY, rx * 1.15, ry * 1.08, 0, Math.PI * 0.08, Math.PI * 0.92);
  ctx.lineWidth = Math.max(1.5, r * (s.lashes ? 0.032 : 0.022));
  ctx.strokeStyle = '#1d1216';
  ctx.stroke();
  ctx.restore();

  if (s.lashes && open > 0.25) {
    ctx.strokeStyle = '#1d1216';
    ctx.lineWidth = Math.max(1, r * 0.018);
    const edgeY = lidY + ry * 1.08;
    for (let i = 0; i < 3; i++) {
      const x = c.x + side * rx * (0.55 + i * 0.2);
      const y = edgeY - ry * (0.35 + i * 0.25);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + side * rx * 0.25, y - ry * 0.35);
      ctx.stroke();
    }
  }
}

function brow(ctx: Ctx, p: HeadPose, side: -1 | 1, e: Expression, s: HumanSpec): void {
  const r = p.r;
  const raise = e.browUp * 0.09;
  const inner = at(p, side * 0.16, -0.3 - raise * 1.3);
  const middle = at(p, side * 0.36, -0.37 - raise);
  const outer = at(p, side * 0.55, -0.3 - raise * 0.6);
  if (middle.facing < 0.12) return;
  ctx.beginPath();
  ctx.moveTo(inner.x, inner.y);
  ctx.quadraticCurveTo(middle.x, middle.y - r * 0.04, outer.x, outer.y);
  ctx.lineWidth = Math.max(2, r * 0.065 * s.brow);
  ctx.strokeStyle = tone(s.hair, s.style === 'bald' ? -0.15 : -0.25);
  ctx.stroke();
}

function nose(ctx: Ctx, p: HeadPose, s: HumanSpec): void {
  const r = p.r;
  // The tip stands out of the sphere, so it swings further than the eyes when the head turns.
  const tip = at(p, 0, 0.2, 1.14);
  const bridge = at(p, 0, -0.02, 1.06);
  const shadowSide = p.sinY >= 0 ? -1 : 1;

  // The side of the nose away from the light.
  ctx.beginPath();
  ctx.moveTo(bridge.x + r * 0.04, bridge.y);
  ctx.quadraticCurveTo(tip.x + r * 0.09, tip.y - r * 0.05, tip.x + r * 0.05, tip.y + r * 0.04);
  ctx.lineWidth = Math.max(1, r * 0.035);
  ctx.strokeStyle = 'rgba(110,50,35,.2)';
  ctx.stroke();

  soft(ctx, tip.x + r * 0.02, tip.y + r * 0.07, r * 0.13, r * 0.055, 'rgba(110,45,30,.28)');
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(tip.x + side * r * 0.05 * tip.sx + shadowSide * r * 0.005, tip.y + r * 0.04, r * 0.028, r * 0.017, side * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(80,30,25,.5)';
    ctx.fill();
  }
  soft(ctx, tip.x - r * 0.025, tip.y - r * 0.025, r * 0.07, r * 0.05, tone(s.skin, 0.35));
  soft(ctx, tip.x - r * 0.03, tip.y - r * 0.03, r * 0.025, r * 0.02, 'rgba(255,255,255,.5)');
}

function mouth(ctx: Ctx, p: HeadPose, e: Expression, s: HumanSpec): void {
  const r = p.r;
  const c = at(p, 0, 0.47);
  if (c.facing < 0.1) return;
  const open = clamp(e.mouthOpen * 1.4, 0, 1);
  const w = r * 0.4 * c.sx * (1 + e.smile * 0.18 - open * 0.12);
  const lift = r * (e.smile * 0.08 - 0.01);
  const left = { x: c.x - w / 2, y: c.y - lift };
  const right = { x: c.x + w / 2, y: c.y - lift };

  if (open < 0.08) {
    // Closed: the lower lip catches the light, then the line between the lips.
    soft(ctx, c.x, c.y + r * 0.06, w * 0.34, r * 0.05, tone(s.lips, 0.05));
    soft(ctx, c.x - w * 0.06, c.y + r * 0.045, w * 0.12, r * 0.015, 'rgba(255,255,255,.35)');
    ctx.beginPath();
    ctx.moveTo(left.x, left.y);
    ctx.quadraticCurveTo(c.x, c.y + r * (0.02 + e.smile * 0.08), right.x, right.y);
    ctx.lineWidth = Math.max(1.5, r * 0.03);
    ctx.strokeStyle = tone(s.lips, -0.5);
    ctx.stroke();
    // Dimples at the corners of a smile.
    if (e.smile > 0.35) {
      ctx.lineWidth = Math.max(1, r * 0.018);
      ctx.strokeStyle = 'rgba(110,50,35,.35)';
      for (const [corner, side] of [[left, -1], [right, 1]] as const) {
        ctx.beginPath();
        ctx.moveTo(corner.x + side * r * 0.01, corner.y - r * 0.035);
        ctx.quadraticCurveTo(corner.x + side * r * 0.055, corner.y, corner.x + side * r * 0.015, corner.y + r * 0.035);
        ctx.stroke();
      }
    }
    return;
  }

  // Open: the inside of the mouth, with teeth along the top and the tongue at the bottom.
  const depth = r * (0.05 + open * 0.24);
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(left.x, left.y);
  ctx.quadraticCurveTo(c.x, c.y - r * 0.03, right.x, right.y);
  ctx.quadraticCurveTo(c.x, c.y + depth * 1.6 + r * e.smile * 0.04, left.x, left.y);
  ctx.closePath();
  const inside = ctx.createRadialGradient(c.x, c.y + depth * 0.4, r * 0.01, c.x, c.y + depth * 0.4, w * 0.6);
  inside.addColorStop(0, '#5c1a24');
  inside.addColorStop(1, '#22080d');
  ctx.fillStyle = inside;
  ctx.fill();
  ctx.save();
  ctx.clip();
  const teeth = ctx.createLinearGradient(0, c.y - r * 0.05, 0, c.y + r * 0.05);
  teeth.addColorStop(0, '#ffffff');
  teeth.addColorStop(1, '#d9d4d0');
  ctx.fillStyle = teeth;
  ctx.fillRect(c.x - w * 0.42, c.y - r * 0.06, w * 0.84, r * 0.075);
  soft(ctx, c.x, c.y + depth * 1.2, w * 0.3, depth * 0.45, '#cc5266');
  soft(ctx, c.x - w * 0.06, c.y + depth * 1.05, w * 0.1, depth * 0.12, 'rgba(255,255,255,.25)');
  ctx.restore();
  ctx.lineWidth = Math.max(2, r * 0.045);
  ctx.strokeStyle = s.lips;
  ctx.stroke();
  ctx.restore();
}

function mustache(ctx: Ctx, p: HeadPose, s: HumanSpec): void {
  const r = p.r;
  for (const side of [-1, 1]) {
    const c = at(p, side * 0.13, 0.36, 1.05);
    if (c.facing < 0.1) continue;
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, r * 0.16 * c.sx, r * 0.065, side * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = hairFill(ctx, s.hair, c.y - r * 0.06, c.y + r * 0.06);
    ctx.fill();
  }
}

function glasses(ctx: Ctx, p: HeadPose): void {
  const r = p.r;
  const lenses: Projected[] = [];
  for (const side of [-1, 1]) lenses.push(at(p, side * 0.36, -0.06, 1.08));
  ctx.lineWidth = Math.max(1.5, r * 0.032);
  ctx.strokeStyle = '#3a2a22';
  for (const c of lenses) {
    if (c.sx < 0.2) continue;
    const w = r * 0.25 * c.sx;
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, w, r * 0.19, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(200,225,255,.12)';
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(c.x - w * 0.5, c.y - r * 0.08);
    ctx.lineTo(c.x - w * 0.1, c.y - r * 0.13);
    ctx.lineWidth = Math.max(1, r * 0.02);
    ctx.strokeStyle = 'rgba(255,255,255,.55)';
    ctx.stroke();
    ctx.lineWidth = Math.max(1.5, r * 0.032);
    ctx.strokeStyle = '#3a2a22';
  }
  const bridge = at(p, 0, -0.08, 1.12);
  ctx.beginPath();
  ctx.moveTo(lenses[0].x + r * 0.25 * lenses[0].sx, lenses[0].y);
  ctx.quadraticCurveTo(bridge.x, bridge.y - r * 0.03, lenses[1].x - r * 0.25 * lenses[1].sx, lenses[1].y);
  ctx.stroke();
}

function freckles(ctx: Ctx, p: HeadPose): void {
  const spots: [number, number][] = [[0.38, 0.17], [0.46, 0.22], [0.31, 0.24], [0.52, 0.14], [0.42, 0.29]];
  for (const side of [-1, 1]) {
    for (const [u, v] of spots) {
      const c = at(p, side * u, v);
      if (c.facing < 0.2) continue;
      ctx.beginPath();
      ctx.arc(c.x, c.y, p.r * 0.016, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(110,55,30,.45)';
      ctx.fill();
    }
  }
}

function wrinkles(ctx: Ctx, p: HeadPose): void {
  ctx.lineWidth = Math.max(1, p.r * 0.014);
  ctx.strokeStyle = 'rgba(110,55,35,.22)';
  for (const v of [-0.62, -0.53]) {
    const a = at(p, -0.3, v);
    const m = at(p, 0, v - 0.03);
    const b = at(p, 0.3, v);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.quadraticCurveTo(m.x, m.y, b.x, b.y);
    ctx.stroke();
  }
}

/** Long hair falls behind the head and shoulders, so it is painted before the face. */
function hairBack(ctx: Ctx, p: HeadPose, s: HumanSpec): void {
  const r = p.r;
  const dx = -p.sinY * r * 0.12;
  ctx.beginPath();
  ctx.moveTo(dx - r * 1.08, -r * 0.1);
  ctx.bezierCurveTo(dx - r * 1.2, r * 0.6, dx - r * 1.25, r * 1.2, dx - r * 0.9, r * 1.45);
  ctx.quadraticCurveTo(dx, r * 1.6, dx + r * 0.9, r * 1.45);
  ctx.bezierCurveTo(dx + r * 1.25, r * 1.2, dx + r * 1.2, r * 0.6, dx + r * 1.08, -r * 0.1);
  ctx.arc(dx, -r * 0.05, r * 1.09, -0.05, Math.PI + 0.05, true);
  ctx.closePath();
  ctx.fillStyle = hairFill(ctx, s.hair, -r * 1.1, r * 1.5);
  ctx.fill();
}

/** Side hair facing the viewer less than this is behind a turned head, so it isn't drawn over the face. */
const FAR_SIDE = 0.15;

function hairFront(ctx: Ctx, p: HeadPose, s: HumanSpec): void {
  const r = p.r;
  const cx = -p.sinY * r * 0.05;

  if (s.style === 'bald') {
    // A shine on the scalp, and tufts above the ears.
    soft(ctx, -r * 0.3, -r * 0.62, r * 0.28, r * 0.13, 'rgba(255,255,255,.28)');
    for (const side of [-1, 1]) {
      const c = at(p, side * 0.9, -0.08);
      // On the far side of a turned head it has gone round the back.
      if (c.facing < FAR_SIDE) continue;
      const x = clamp(c.x, -r * 1.02, r * 1.02);
      ctx.beginPath();
      ctx.ellipse(x, c.y, r * 0.16, r * 0.3, side * 0.25, 0, Math.PI * 2);
      ctx.fillStyle = hairFill(ctx, s.hair, c.y - r * 0.3, c.y + r * 0.3);
      ctx.fill();
    }
    return;
  }

  if (s.style === 'cap') {
    // Curls peeking out at the sides, the crown of the cap, then its brim pointing forward.
    for (const side of [-1, 1]) {
      for (const [u, v] of [[0.93, -0.2], [0.98, 0.0], [0.86, -0.36]] as const) {
        const c = at(p, side * u, v);
        if (c.facing < FAR_SIDE) continue;
        ctx.beginPath();
        ctx.arc(clamp(c.x, -r * 1.05, r * 1.05), c.y, r * 0.11, 0, Math.PI * 2);
        ctx.fillStyle = hairFill(ctx, s.hair, c.y - r * 0.1, c.y + r * 0.1);
        ctx.fill();
      }
    }
    const hat = s.hat ?? '#ff4d5e';
    const band: [number, number][] = [[0.98, -0.32], [0.55, -0.5], [0, -0.56], [-0.55, -0.5], [-0.98, -0.32]];
    ctx.beginPath();
    ctx.arc(cx, -r * 0.02, r * 1.06, Math.PI + 0.28, Math.PI * 2 - 0.28);
    for (const [u, v] of band) {
      const c = at(p, u, v, 1.03);
      ctx.lineTo(c.x, c.y);
    }
    ctx.closePath();
    const crown = ctx.createRadialGradient(-r * 0.35, -r * 0.95, r * 0.05, 0, -r * 0.5, r * 1.2);
    crown.addColorStop(0, tone(hat, 0.35));
    crown.addColorStop(0.5, hat);
    crown.addColorStop(1, tone(hat, -0.45));
    ctx.fillStyle = crown;
    ctx.fill();
    // Panel seams.
    ctx.lineWidth = Math.max(1, r * 0.015);
    ctx.strokeStyle = 'rgba(0,0,0,.22)';
    for (const u of [-0.35, 0.35]) {
      const top = at(p, u * 0.3, -0.98);
      const bottom = at(p, u, -0.52, 1.03);
      ctx.beginPath();
      ctx.moveTo(top.x, top.y);
      ctx.lineTo(bottom.x, bottom.y);
      ctx.stroke();
    }
    const brim = at(p, 0, -0.5, 1.32);
    ctx.beginPath();
    ctx.ellipse(brim.x, brim.y + r * 0.02, r * 0.6 * Math.max(0.45, brim.sx), r * 0.13 * Math.max(0.6, p.cosN), 0, 0, Math.PI * 2);
    ctx.fillStyle = tone(hat, -0.25);
    ctx.fill();
    soft(ctx, brim.x, brim.y + r * 0.13, r * 0.5, r * 0.06, 'rgba(40,10,10,.25)');
    soft(ctx, brim.x - r * 0.15, brim.y - r * 0.02, r * 0.25, r * 0.04, 'rgba(255,255,255,.22)');
    return;
  }

  // The hair over the top of the head: an outline that stays put, and a hairline that turns with the face.
  const line: [number, number][] = s.style === 'long'
    ? [[0.93, 0.05], [0.74, -0.3], [0.48, -0.38], [0.22, -0.44], [0, -0.36], [-0.24, -0.45], [-0.5, -0.4], [-0.76, -0.28], [-0.93, 0.05]]
    : [[0.96, -0.12], [0.78, -0.42], [0.42, -0.6], [0, -0.64], [-0.42, -0.6], [-0.78, -0.4], [-0.96, -0.1]];
  ctx.beginPath();
  ctx.arc(cx, 0, r * 1.05, Math.PI + 0.1, Math.PI * 2 - 0.1);
  for (const [u, v] of line) {
    const c = at(p, u, v, 1.02);
    ctx.lineTo(clamp(c.x, -r * 1.05, r * 1.05), c.y);
  }
  ctx.closePath();
  ctx.fillStyle = hairFill(ctx, s.hair, -r * 1.1, r * 0.1);
  ctx.fill();

  if (s.style === 'quiff') {
    const q = at(p, 0.12, -0.8, 1.04);
    ctx.beginPath();
    ctx.ellipse(q.x, q.y - r * 0.12, r * 0.42, r * 0.22, -0.25, 0, Math.PI * 2);
    ctx.fillStyle = hairFill(ctx, s.hair, q.y - r * 0.35, q.y + r * 0.1);
    ctx.fill();
  } else {
    // Strands framing the face.
    for (const side of [-1, 1]) {
      const top = at(p, side * 0.84, -0.2, 1.02);
      if (top.facing < FAR_SIDE) continue;
      const low = at(p, side * 0.9, 0.85);
      const inner = at(p, side * 0.7, 0.55, 1.02);
      const back = at(p, side * 0.7, -0.25, 1.02);
      ctx.beginPath();
      ctx.moveTo(top.x, top.y);
      ctx.quadraticCurveTo(clamp(top.x + side * r * 0.12, -r * 1.1, r * 1.1), (top.y + low.y) / 2, low.x, low.y);
      ctx.quadraticCurveTo(inner.x, inner.y, back.x, back.y);
      ctx.closePath();
      ctx.fillStyle = hairFill(ctx, s.hair, top.y, low.y);
      ctx.fill();
    }
  }

  // A soft sheen across the hair.
  ctx.beginPath();
  ctx.ellipse(cx - r * 0.3, -r * 0.82, r * 0.35, r * 0.08, -0.35, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,.16)';
  ctx.fill();
}

// ------------------------------------------------------------------ the chrome robot

function drawCyborg(ctx: Ctx, r: number, e: Expression): void {
  const p = headPose(r, e);
  const accent = e.mouthOpen > 0.25 ? '#ff4d8d' : '#38e1ff';

  // Ear pods, then the polished head.
  for (const side of [-1, 1]) {
    const x = side * p.cosY * r * 0.98 + p.sinY * r * 0.04;
    ctx.beginPath();
    ctx.roundRect(x - r * 0.13, -r * 0.24, r * 0.26, r * 0.48, r * 0.1);
    ctx.fillStyle = metal(ctx, x, 0, r * 0.3);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, 0, r * 0.05, 0, Math.PI * 2);
    ctx.fillStyle = accent;
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = metal(ctx, 0, 0, r);
  ctx.fill();
  // A window reflection across the top of the dome.
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.beginPath();
  ctx.ellipse(-r * 0.25 - p.sinY * r * 0.2, -r * 0.62, r * 0.55, r * 0.14, -0.2, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,.45)';
  ctx.fill();
  // Panel seams that turn with the head.
  ctx.lineWidth = Math.max(1, r * 0.018);
  ctx.strokeStyle = 'rgba(30,40,55,.35)';
  ctx.beginPath();
  const seam = [-0.95, -0.6, -0.2, 0.2, 0.6, 0.95].map((u) => at(p, u, -0.42, 1));
  seam.forEach((c, i) => (i ? ctx.lineTo(c.x, c.y) : ctx.moveTo(c.x, c.y)));
  ctx.stroke();
  ctx.restore();

  // The visor, with two glowing lenses that follow the eyes.
  const centre = at(p, 0, 0.02, 1.04);
  const vw = r * 1.32 * Math.max(0.5, centre.sx);
  const vh = r * 0.46;
  ctx.beginPath();
  ctx.roundRect(centre.x - vw / 2, centre.y - vh / 2, vw, vh, vh / 2);
  const glass = ctx.createLinearGradient(0, centre.y - vh / 2, 0, centre.y + vh / 2);
  glass.addColorStop(0, '#1e293b');
  glass.addColorStop(1, '#05080f');
  ctx.fillStyle = glass;
  ctx.fill();
  ctx.lineWidth = Math.max(1.5, r * 0.03);
  ctx.strokeStyle = 'rgba(200,215,235,.55)';
  ctx.stroke();

  for (const side of [-1, 1] as const) {
    const c = at(p, side * 0.32, 0.0, 1.05);
    if (c.sx < 0.25) continue;
    const blink = side < 0 ? e.blinkLeft : e.blinkRight;
    const open = clamp(1 - blink * 1.15, 0.1, 1);
    const x = c.x + clamp(e.lookX ?? 0, -1, 1) * r * 0.08;
    const y = c.y + clamp(e.lookY ?? 0, -1, 1) * r * 0.05;
    ctx.save();
    ctx.shadowColor = accent;
    ctx.shadowBlur = r * 0.18;
    ctx.fillStyle = accent;
    if (e.smile > 0.6 && open > 0.5) {
      // Happy eyes: ^ ^
      ctx.beginPath();
      ctx.arc(x, y + r * 0.05, r * 0.11 * c.sx, Math.PI * 1.1, Math.PI * 1.9);
      ctx.lineWidth = r * 0.05;
      ctx.strokeStyle = accent;
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.ellipse(x, y, r * 0.11 * c.sx, r * 0.11 * open, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.ellipse(x - r * 0.03, y - r * 0.03 * open, r * 0.03, r * 0.03 * open, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,.85)';
      ctx.fill();
    }
    ctx.restore();
  }

  // A speaker grille that lights up with the voice.
  const m = at(p, 0, 0.55, 1.02);
  const bars = 7;
  const width = r * 0.5 * m.sx;
  for (let i = 0; i < bars; i++) {
    const level = clamp(e.mouthOpen * 1.6 * (0.55 + 0.45 * Math.sin(i * 1.9 + e.mouthOpen * 11)), 0, 1);
    const x = m.x - width / 2 + (i * width) / (bars - 1);
    const h = r * (0.05 + level * 0.16);
    ctx.beginPath();
    ctx.roundRect(x - r * 0.022, m.y - h / 2, r * 0.044, h, r * 0.02);
    ctx.fillStyle = level > 0.12 ? accent : 'rgba(40,52,70,.7)';
    ctx.fill();
  }
}

function metal(ctx: Ctx, x: number, y: number, r: number): CanvasGradient {
  const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.45, r * 0.05, x, y, r * 1.05);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.3, '#d7dde6');
  g.addColorStop(0.75, '#8a95a6');
  g.addColorStop(1, '#3d4656');
  return g;
}

// ------------------------------------------------------------------ light and shade

/** A sphere lit from the top left; the lit spot drifts as the head turns, as on a real head. */
function sphereFill(ctx: Ctx, r: number, base: string, p: HeadPose): CanvasGradient {
  const lx = -r * 0.32 + p.sinY * r * 0.12;
  const g = ctx.createRadialGradient(lx, -r * 0.42, r * 0.05, 0, 0, r * 1.02);
  g.addColorStop(0, tone(base, 0.28));
  g.addColorStop(0.5, base);
  g.addColorStop(0.85, tone(base, -0.18));
  g.addColorStop(1, tone(base, -0.38));
  return g;
}

function hairFill(ctx: Ctx, hair: string, top: number, bottom: number): CanvasGradient {
  const g = ctx.createLinearGradient(0, top, 0, bottom);
  g.addColorStop(0, tone(hair, 0.22));
  g.addColorStop(0.45, hair);
  g.addColorStop(1, tone(hair, -0.35));
  return g;
}

/** A soft blob: solid in the middle, fading out at its edge. */
function soft(ctx: Ctx, x: number, y: number, rx: number, ry: number, color: string): void {
  if (rx < 0.5 || ry < 0.5) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, ry / rx);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0, color);
  g.addColorStop(0.55, color);
  // Fading to the colour itself, transparent: fading to transparent black leaves a dark halo.
  g.addColorStop(1, clear(color));
  ctx.beginPath();
  ctx.arc(0, 0, rx, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.restore();
}

/** The same colour with no opacity. Takes #rrggbb, rgb() and rgba(). */
function clear(color: string): string {
  if (color.startsWith('#') && color.length === 7) {
    const n = parseInt(color.slice(1), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},0)`;
  }
  const parts = color.match(/[\d.]+/g);
  return parts && parts.length >= 3 ? `rgba(${parts[0]},${parts[1]},${parts[2]},0)` : 'rgba(0,0,0,0)';
}

/**
 * Light and shade over any round character, for a rounded, 3D look: a highlight at the top
 * left and a shadow toward the bottom right, inside a circle of radius `r`.
 */
export function volumeShade(ctx: Ctx, r: number): void {
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.clip();
  const g = ctx.createRadialGradient(-r * 0.35, -r * 0.45, r * 0.05, 0, 0, r * 1.05);
  g.addColorStop(0, 'rgba(255,255,255,.32)');
  g.addColorStop(0.4, 'rgba(255,255,255,0)');
  g.addColorStop(0.75, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(10,5,20,.32)');
  ctx.fillStyle = g;
  ctx.fillRect(-r, -r, r * 2, r * 2);
  ctx.restore();
}

/** Mixes a #rrggbb colour toward white (amount > 0) or black (amount < 0). */
export function tone(hex: string, amount: number): string {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return hex;
  const n = parseInt(hex.slice(1), 16);
  const target = amount < 0 ? 0 : 255;
  const k = Math.min(1, Math.abs(amount));
  const mix = (c: number) => Math.round(c + (target - c) * k);
  return `rgb(${mix((n >> 16) & 255)},${mix((n >> 8) & 255)},${mix(n & 255)})`;
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}
