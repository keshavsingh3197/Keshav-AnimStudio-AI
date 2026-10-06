import { BuiltInCharacterId } from './studio-settings';
import { CHARACTER_3D_IDS, Character3DId, drawCharacter3D, volumeShade } from './characters-3d';

/** What a character mirrors from the presenter, each 0-1. */
export interface Expression {
  mouthOpen: number;
  blinkLeft: number;
  blinkRight: number;
  smile: number;
  browUp: number;
  /** Head turn as the viewer sees it, -1 (toward the picture's left) to 1. */
  yaw?: number;
  /** Nod, -1 (looking up) to 1 (looking down). */
  nod?: number;
  /** Gaze as the viewer sees it, -1 to 1: right and down are positive. */
  lookX?: number;
  lookY?: number;
}

export const NEUTRAL: Expression = { mouthOpen: 0, blinkLeft: 0, blinkRight: 0, smile: 0.3, browUp: 0 };

/** The face mesh's nose-below-the-eyes measure (FaceObservation.pitch) for a head held level. */
const PITCH_LEVEL = 0.22;

/**
 * A tracked face as a character expression, as the viewer sees it: with the picture mirrored,
 * turning and looking to the right appears on the left, so the character turns that way too.
 */
export function expressionFrom(
  face: Expression & { yaw: number; pitch: number; lookX: number; lookY: number },
  mirror: boolean,
): Expression {
  const flip = mirror ? -1 : 1;
  return {
    mouthOpen: face.mouthOpen,
    blinkLeft: face.blinkLeft,
    blinkRight: face.blinkRight,
    smile: face.smile,
    browUp: face.browUp,
    yaw: face.yaw * flip,
    nod: Math.max(-1, Math.min(1, (face.pitch - PITCH_LEVEL) * 5)),
    lookX: face.lookX * flip,
    lookY: face.lookY,
  };
}

/** A character from a project (closed / open mouth images) or an uploaded image. */
export interface ImageCharacter {
  closed: ImageBitmap | HTMLImageElement;
  open?: ImageBitmap | HTMLImageElement;
}

type Ctx = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

/**
 * Draws a character centred on the origin, filling a circle of radius `r`.
 * Every character first paints a solid disc of that radius: whatever its outline, the face
 * underneath is always fully covered.
 */
export function drawBuiltIn(ctx: Ctx, id: BuiltInCharacterId, r: number, e: Expression): void {
  if ((CHARACTER_3D_IDS as readonly string[]).includes(id)) {
    drawCharacter3D(ctx, id as Character3DId, r, e);
    return;
  }
  const draw = DRAWERS[id as FlatCharacterId] ?? DRAWERS.robot;
  ctx.save();
  draw(ctx, r, e);
  // A little light and shade, so the flat characters look rounded beside the 3D ones.
  volumeShade(ctx, r);
  ctx.restore();
}

/** Draws an image character, switching to its open-mouth image while the presenter talks. */
export function drawImageCharacter(ctx: Ctx, character: ImageCharacter, r: number, e: Expression, cover: string): void {
  const image = e.mouthOpen > 0.25 && character.open ? character.open : character.closed;
  const width = 'width' in image ? image.width : 1;
  const height = 'height' in image ? image.height : 1;
  const scale = (2 * r) / Math.max(1, Math.max(width, height));
  const w = width * scale;
  const h = height * scale;

  ctx.save();
  // The cover disc: a transparent PNG never lets the face through its gaps.
  disc(ctx, r, cover);
  // A little bounce with the voice, so a still image reads as talking.
  const bounce = 1 + e.mouthOpen * 0.04;
  ctx.drawImage(image, (-w / 2) * bounce, (-h / 2) * bounce, w * bounce, h * bounce);
  ctx.restore();
}

// ------------------------------------------------------------------ parts

function disc(ctx: Ctx, r: number, fill: string): void {
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
}

function ellipse(ctx: Ctx, x: number, y: number, rx: number, ry: number, fill: string, rotation = 0): void {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.5, rx), Math.max(0.5, ry), rotation, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
}

function eyes(ctx: Ctx, r: number, e: Expression, opts: { y?: number; gap?: number; size?: number; color?: string; shine?: boolean } = {}): void {
  const y = (opts.y ?? -0.12) * r;
  const gap = (opts.gap ?? 0.32) * r;
  const size = (opts.size ?? 0.11) * r;
  const color = opts.color ?? '#1b1b1f';
  // The eyes follow the presenter's gaze.
  const lookX = (e.lookX ?? 0) * size * 0.45;
  const lookY = (e.lookY ?? 0) * size * 0.3;
  for (const [side, blink] of [[-1, e.blinkLeft], [1, e.blinkRight]] as const) {
    const open = Math.max(0.12, 1 - blink);
    const x = side * gap + lookX;
    const ey = y - e.browUp * 0.05 * r + lookY;
    ellipse(ctx, x, ey, size, size * 1.15 * open, color);
    if (opts.shine !== false && open > 0.4) ellipse(ctx, x + size * 0.35, ey - size * 0.45, size * 0.3, size * 0.3, 'rgba(255,255,255,.85)');
  }
}

function mouth(ctx: Ctx, r: number, e: Expression, opts: { y?: number; width?: number; color?: string; inside?: string } = {}): void {
  const y = (opts.y ?? 0.32) * r;
  const width = (opts.width ?? 0.36) * r;
  const open = Math.min(1, e.mouthOpen * 1.4);

  if (open > 0.08) {
    ellipse(ctx, 0, y + open * 0.04 * r, width * (0.55 + e.smile * 0.25), Math.max(0.03 * r, open * 0.2 * r), opts.inside ?? '#3a0d16');
    ellipse(ctx, 0, y + open * 0.12 * r, width * 0.3, open * 0.07 * r, '#e0566b');
  } else {
    ctx.beginPath();
    const curve = (0.04 + e.smile * 0.14) * r;
    ctx.moveTo(-width / 2, y);
    ctx.quadraticCurveTo(0, y + curve, width / 2, y);
    ctx.lineWidth = Math.max(2, r * 0.05);
    ctx.lineCap = 'round';
    ctx.strokeStyle = opts.color ?? '#1b1b1f';
    ctx.stroke();
  }
}

function cheeks(ctx: Ctx, r: number, e: Expression, color = 'rgba(255,120,150,.35)'): void {
  const glow = 0.12 + e.smile * 0.1;
  ellipse(ctx, -0.48 * r, 0.16 * r, glow * r, glow * 0.65 * r, color);
  ellipse(ctx, 0.48 * r, 0.16 * r, glow * r, glow * 0.65 * r, color);
}

function triangle(ctx: Ctx, points: [number, number][], fill: string): void {
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (const [x, y] of points.slice(1)) ctx.lineTo(x, y);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

// ------------------------------------------------------------------ characters

type FlatCharacterId = Exclude<BuiltInCharacterId, Character3DId>;

const DRAWERS: Record<FlatCharacterId, (ctx: Ctx, r: number, e: Expression) => void> = {
  robot(ctx, r, e) {
    disc(ctx, r, '#9aa4b2');
    ctx.fillStyle = '#c6cdd8';
    ctx.beginPath();
    ctx.roundRect(-r * 0.92, -r * 0.82, r * 1.84, r * 1.7, r * 0.32);
    ctx.fill();
    // Antenna
    ctx.fillStyle = '#7d8796';
    ctx.fillRect(-r * 0.04, -r * 1.05, r * 0.08, r * 0.25);
    ellipse(ctx, 0, -r * 1.08, r * 0.11, r * 0.11, e.mouthOpen > 0.2 ? '#ff4d6d' : '#ffd166');
    // Visor
    ctx.fillStyle = '#1d2433';
    ctx.beginPath();
    ctx.roundRect(-r * 0.7, -r * 0.42, r * 1.4, r * 0.5, r * 0.2);
    ctx.fill();
    for (const side of [-1, 1]) {
      const blink = side < 0 ? e.blinkLeft : e.blinkRight;
      ctx.fillStyle = '#4de3ff';
      ctx.shadowColor = '#4de3ff';
      ctx.shadowBlur = r * 0.15;
      const h = r * 0.2 * Math.max(0.12, 1 - blink);
      ctx.fillRect(side * r * 0.32 - r * 0.13, -r * 0.17 - h / 2, r * 0.26, h);
      ctx.shadowBlur = 0;
    }
    // Grille mouth: bars light up with the voice.
    const bars = 7;
    for (let i = 0; i < bars; i++) {
      const level = Math.min(1, e.mouthOpen * 1.6 * (0.6 + 0.4 * Math.sin(i * 1.7 + e.mouthOpen * 9)));
      ctx.fillStyle = level > 0.15 ? `rgba(77,227,255,${0.35 + level * 0.65})` : '#5b6577';
      const x = -r * 0.45 + i * (r * 0.9 / (bars - 1)) - r * 0.035;
      const h = r * (0.08 + level * 0.18);
      ctx.fillRect(x, r * 0.42 - h / 2, r * 0.07, h);
    }
  },

  cat(ctx, r, e) {
    triangle(ctx, [[-r * 0.95, -r * 0.2], [-r * 0.75, -r * 1.12], [-r * 0.2, -r * 0.8]], '#f29e4c');
    triangle(ctx, [[r * 0.95, -r * 0.2], [r * 0.75, -r * 1.12], [r * 0.2, -r * 0.8]], '#f29e4c');
    triangle(ctx, [[-r * 0.78, -r * 0.42], [-r * 0.72, -r * 0.92], [-r * 0.38, -r * 0.72]], '#ffc8a8');
    triangle(ctx, [[r * 0.78, -r * 0.42], [r * 0.72, -r * 0.92], [r * 0.38, -r * 0.72]], '#ffc8a8');
    disc(ctx, r, '#f29e4c');
    ellipse(ctx, 0, r * 0.28, r * 0.5, r * 0.36, '#fff1e6');
    eyes(ctx, r, e, { color: '#2b5d34', size: 0.13 });
    triangle(ctx, [[-r * 0.08, r * 0.08], [r * 0.08, r * 0.08], [0, r * 0.18]], '#e5677d');
    mouth(ctx, r, e, { y: 0.3, width: 0.3 });
    ctx.strokeStyle = 'rgba(60,40,30,.55)';
    ctx.lineWidth = Math.max(1.5, r * 0.025);
    for (const side of [-1, 1]) {
      for (const tilt of [-0.08, 0.04]) {
        ctx.beginPath();
        ctx.moveTo(side * r * 0.32, r * 0.18);
        ctx.lineTo(side * r * 0.95, r * (0.12 + tilt));
        ctx.stroke();
      }
    }
  },

  fox(ctx, r, e) {
    triangle(ctx, [[-r * 0.95, -r * 0.1], [-r * 0.7, -r * 1.2], [-r * 0.15, -r * 0.75]], '#e8742c');
    triangle(ctx, [[r * 0.95, -r * 0.1], [r * 0.7, -r * 1.2], [r * 0.15, -r * 0.75]], '#e8742c');
    triangle(ctx, [[-r * 0.72, -r * 0.4], [-r * 0.66, -r * 0.98], [-r * 0.35, -r * 0.7]], '#3a2318');
    triangle(ctx, [[r * 0.72, -r * 0.4], [r * 0.66, -r * 0.98], [r * 0.35, -r * 0.7]], '#3a2318');
    disc(ctx, r, '#e8742c');
    triangle(ctx, [[-r, r * 0.05], [0, r * 1.0], [r, r * 0.05]], '#fff6ee');
    ellipse(ctx, 0, r * 0.62, r * 0.42, r * 0.38, '#fff6ee');
    eyes(ctx, r, e, { size: 0.1, gap: 0.34 });
    ellipse(ctx, 0, r * 0.2, r * 0.1, r * 0.075, '#1b1b1f');
    mouth(ctx, r, e, { y: 0.4, width: 0.28 });
  },

  panda(ctx, r, e) {
    ellipse(ctx, -r * 0.72, -r * 0.72, r * 0.3, r * 0.3, '#1d1d22');
    ellipse(ctx, r * 0.72, -r * 0.72, r * 0.3, r * 0.3, '#1d1d22');
    disc(ctx, r, '#f7f7f5');
    ellipse(ctx, -r * 0.34, -r * 0.1, r * 0.22, r * 0.28, '#1d1d22', -0.5);
    ellipse(ctx, r * 0.34, -r * 0.1, r * 0.22, r * 0.28, '#1d1d22', 0.5);
    eyes(ctx, r, e, { color: '#f7f7f5', size: 0.07, gap: 0.34, y: -0.1, shine: false });
    ellipse(ctx, 0, r * 0.2, r * 0.13, r * 0.09, '#1d1d22');
    mouth(ctx, r, e, { y: 0.4, width: 0.3 });
    cheeks(ctx, r, e);
  },

  alien(ctx, r, e) {
    ellipse(ctx, 0, -r * 0.1, r * 0.98, r * 1.08, '#7bd88f');
    disc(ctx, r * 0.98, '#7bd88f');
    for (const side of [-1, 1]) {
      const blink = side < 0 ? e.blinkLeft : e.blinkRight;
      ellipse(ctx, side * r * 0.38, -r * 0.08, r * 0.3, r * 0.42 * Math.max(0.1, 1 - blink), '#101418', side * -0.45);
      if (blink < 0.6) ellipse(ctx, side * r * 0.3, -r * 0.24, r * 0.07, r * 0.07, 'rgba(255,255,255,.8)');
    }
    mouth(ctx, r, e, { y: 0.48, width: 0.24, inside: '#183b22' });
  },

  bear(ctx, r, e) {
    ellipse(ctx, -r * 0.74, -r * 0.7, r * 0.32, r * 0.32, '#8b5a3c');
    ellipse(ctx, r * 0.74, -r * 0.7, r * 0.32, r * 0.32, '#8b5a3c');
    ellipse(ctx, -r * 0.74, -r * 0.7, r * 0.17, r * 0.17, '#d9a27f');
    ellipse(ctx, r * 0.74, -r * 0.7, r * 0.17, r * 0.17, '#d9a27f');
    disc(ctx, r, '#8b5a3c');
    ellipse(ctx, 0, r * 0.32, r * 0.46, r * 0.36, '#d9a27f');
    eyes(ctx, r, e, { size: 0.1 });
    ellipse(ctx, 0, r * 0.16, r * 0.14, r * 0.1, '#2a1a12');
    mouth(ctx, r, e, { y: 0.4, width: 0.3 });
  },

  ghost(ctx, r, e) {
    disc(ctx, r, '#f4f6ff');
    ctx.beginPath();
    ctx.moveTo(-r, 0);
    ctx.arc(0, 0, r, Math.PI, 0);
    const waves = 4;
    ctx.lineTo(r, r * 1.15);
    for (let i = waves; i > 0; i--) {
      const x = -r + (2 * r * (i - 0.5)) / waves;
      ctx.quadraticCurveTo(x, r * (0.95 + 0.12 * Math.sin(i + e.mouthOpen * 4)), -r + (2 * r * (i - 1)) / waves, r * 1.15);
    }
    ctx.closePath();
    ctx.fillStyle = '#f4f6ff';
    ctx.fill();
    eyes(ctx, r, e, { size: 0.14, color: '#20223a', shine: false });
    const open = Math.max(0.12, Math.min(1, e.mouthOpen * 1.5));
    ellipse(ctx, 0, r * 0.32, r * 0.14, r * 0.2 * open, '#20223a');
    cheeks(ctx, r, e, 'rgba(160,170,255,.35)');
  },

  frog(ctx, r, e) {
    for (const side of [-1, 1]) {
      const blink = side < 0 ? e.blinkLeft : e.blinkRight;
      ellipse(ctx, side * r * 0.48, -r * 0.72, r * 0.34, r * 0.32, '#5dbb63');
      ellipse(ctx, side * r * 0.48, -r * 0.72, r * 0.2, r * 0.2 * Math.max(0.1, 1 - blink), '#fff');
      ellipse(ctx, side * r * 0.48, -r * 0.7, r * 0.1, r * 0.1 * Math.max(0.1, 1 - blink), '#1b1b1f');
    }
    disc(ctx, r, '#5dbb63');
    ellipse(ctx, 0, r * 0.35, r * 0.7, r * 0.42, '#a8e6a1');
    mouth(ctx, r, e, { y: 0.22, width: 0.9, inside: '#7a2234' });
    cheeks(ctx, r, e);
  },

  astronaut(ctx, r, e) {
    disc(ctx, r, '#eef1f6');
    ellipse(ctx, 0, r * 0.02, r * 0.8, r * 0.68, '#12162a');
    // Stars in the visor: no face is ever drawn here.
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    for (const [x, y, s] of [[-0.4, -0.2, 0.03], [0.2, -0.35, 0.025], [0.45, 0.1, 0.02], [-0.15, 0.3, 0.02], [0.05, 0.05, 0.035]]) {
      ctx.beginPath();
      ctx.arc(x * r, y * r, s * r, 0, Math.PI * 2);
      ctx.fill();
    }
    ellipse(ctx, -r * 0.35, -r * 0.3, r * 0.22, r * 0.1, 'rgba(255,255,255,.28)', -0.5);
    // A small level meter on the chin lights up with the voice.
    const level = Math.min(1, e.mouthOpen * 1.6);
    ctx.fillStyle = level > 0.15 ? '#4de3ff' : '#9aa4b2';
    ctx.fillRect(-r * 0.25, r * 0.8, r * 0.5 * Math.max(0.15, level), r * 0.07);
  },

  pumpkin(ctx, r, e) {
    ctx.fillStyle = '#3f6b2a';
    ctx.fillRect(-r * 0.08, -r * 1.12, r * 0.16, r * 0.3);
    disc(ctx, r, '#f28c28');
    for (const x of [-0.55, 0.55]) ellipse(ctx, x * r, 0, r * 0.45, r * 0.95, 'rgba(200,100,20,.35)');
    for (const side of [-1, 1]) {
      const blink = side < 0 ? e.blinkLeft : e.blinkRight;
      const h = 0.22 * Math.max(0.15, 1 - blink);
      triangle(ctx, [[side * r * 0.5, -r * (0.02)], [side * r * 0.18, -r * 0.02], [side * r * 0.34, -r * (0.02 + h)]], '#3a1404');
    }
    const open = Math.min(1, e.mouthOpen * 1.4);
    ctx.beginPath();
    ctx.moveTo(-r * 0.55, r * 0.3);
    for (let i = 0; i <= 6; i++) ctx.lineTo(-r * 0.55 + i * r * 0.183, r * (i % 2 ? 0.38 : 0.3));
    ctx.lineTo(r * 0.55, r * (0.42 + open * 0.2));
    ctx.quadraticCurveTo(0, r * (0.62 + open * 0.25), -r * 0.55, r * (0.42 + open * 0.2));
    ctx.closePath();
    ctx.fillStyle = '#3a1404';
    ctx.fill();
  },
};
