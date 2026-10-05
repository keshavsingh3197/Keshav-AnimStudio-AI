import type { Expression } from './characters';
import { volumeShade } from './characters-3d';

/**
 * A character the presenter designs from parts, drawn in code like the built-ins: it blinks,
 * talks and smiles with them, and gets a full body when the body puppet is on. The design is
 * plain data, so it travels with presets and is checked by {@link sanitizeDesign} on the way in.
 */

export const HEADS = ['round', 'square', 'oval', 'bean'] as const;
export const EYES = ['dots', 'big', 'anime', 'sleepy', 'visor'] as const;
export const MOUTHS = ['smile', 'cat', 'beak', 'teeth'] as const;
export const EARS = ['none', 'cat', 'bear', 'bunny', 'elf'] as const;
export const HAIRS = ['none', 'spiky', 'bob', 'curly', 'mohawk'] as const;
export const HATS = ['none', 'cap', 'crown', 'wizard', 'headphones', 'halo'] as const;
export const GLASSES = ['none', 'round', 'shades'] as const;
/** Lit and shaded for a rounded 3D look, or flat cartoon colours. */
export const FINISHES = ['3d', 'flat'] as const;

export interface CharacterDesign {
  name: string;
  head: (typeof HEADS)[number];
  skin: string;
  eyes: (typeof EYES)[number];
  eyeColor: string;
  mouth: (typeof MOUTHS)[number];
  ears: (typeof EARS)[number];
  hair: (typeof HAIRS)[number];
  hairColor: string;
  hat: (typeof HATS)[number];
  hatColor: string;
  glasses: (typeof GLASSES)[number];
  cheeks: boolean;
  finish: (typeof FINISHES)[number];
  /** Shirt colour of the body puppet. */
  outfit: string;
  /** Trousers and shoes. */
  pants: string;
  /** Gloves. */
  gloves: string;
}

export function defaultDesign(): CharacterDesign {
  return {
    name: 'My character',
    head: 'round',
    skin: '#ffd2a8',
    eyes: 'big',
    eyeColor: '#2a2140',
    mouth: 'smile',
    ears: 'none',
    hair: 'spiky',
    hairColor: '#3b2a5c',
    hat: 'headphones',
    hatColor: '#ff3355',
    glasses: 'none',
    cheeks: true,
    finish: '3d',
    outfit: '#6c8cff',
    pants: '#2a3350',
    gloves: '#ffffff',
  };
}

const COLOR = /^#[0-9a-f]{6}$/i;

function pick<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function color(value: unknown, fallback: string): string {
  return typeof value === 'string' && COLOR.test(value) ? value : fallback;
}

export function sanitizeDesign(raw: unknown): CharacterDesign {
  const d = defaultDesign();
  if (!raw || typeof raw !== 'object') return d;
  const r = raw as Record<string, unknown>;
  return {
    // eslint-disable-next-line no-control-regex
    name: typeof r['name'] === 'string' ? r['name'].replace(/[\u0000-\u001f\u007f]/g, ' ').slice(0, 24) : d.name,
    head: pick(r['head'], HEADS, d.head),
    skin: color(r['skin'], d.skin),
    eyes: pick(r['eyes'], EYES, d.eyes),
    eyeColor: color(r['eyeColor'], d.eyeColor),
    mouth: pick(r['mouth'], MOUTHS, d.mouth),
    ears: pick(r['ears'], EARS, d.ears),
    hair: pick(r['hair'], HAIRS, d.hair),
    hairColor: color(r['hairColor'], d.hairColor),
    hat: pick(r['hat'], HATS, d.hat),
    hatColor: color(r['hatColor'], d.hatColor),
    glasses: pick(r['glasses'], GLASSES, d.glasses),
    cheeks: typeof r['cheeks'] === 'boolean' ? r['cheeks'] : d.cheeks,
    finish: pick(r['finish'], FINISHES, d.finish),
    outfit: color(r['outfit'], d.outfit),
    pants: color(r['pants'], d.pants),
    gloves: color(r['gloves'], d.gloves),
  };
}

const SKINS = ['#ffd2a8', '#f1b98c', '#d8955f', '#a8693f', '#6e4426', '#9be3a4', '#a9c8ff', '#ffb3d1', '#c9b6ff'];
const BRIGHT = ['#ff3355', '#ff8a3d', '#ffd166', '#22d3a6', '#4de3ff', '#6c8cff', '#b06cff', '#ff6cc6', '#1d2433', '#f4f6ff'];
const DARK = ['#2a3350', '#3b2a5c', '#1d1d22', '#5a3a28', '#244a3a', '#4a2030'];

/** A random but coherent design, for the "surprise me" button. `random` is injectable for tests. */
export function randomDesign(random: () => number = Math.random): CharacterDesign {
  const any = <T>(list: readonly T[]) => list[Math.floor(random() * list.length)];
  return {
    name: 'My character',
    head: any(HEADS),
    skin: any(SKINS),
    eyes: any(EYES),
    eyeColor: any(DARK),
    mouth: any(MOUTHS),
    ears: any(EARS),
    hair: any(HAIRS),
    hairColor: any([...DARK, ...BRIGHT]),
    hat: any(HATS),
    hatColor: any(BRIGHT),
    glasses: random() < 0.3 ? any(GLASSES) : 'none',
    cheeks: random() < 0.6,
    finish: '3d',
    outfit: any(BRIGHT),
    pants: any(DARK),
    gloves: any(['#ffffff', ...BRIGHT]),
  };
}

type Ctx = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

const OUTLINE = 'rgba(20,16,32,.85)';

/**
 * Draws a designed head centred on the origin within radius `r`. Like every character, a
 * solid disc of radius `r` is painted first, so whatever the design, the face underneath is covered.
 */
export function drawDesigned(ctx: Ctx, d: CharacterDesign, r: number, e: Expression): void {
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  drawEars(ctx, d, r);
  if (d.hat === 'halo') drawHalo(ctx, r);

  // The cover disc, in the skin colour.
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = d.skin;
  ctx.fill();

  headShape(ctx, d, r);
  ctx.fillStyle = d.skin;
  ctx.fill();
  if (d.finish === '3d') {
    ctx.save();
    headShape(ctx, d, r);
    ctx.clip();
    volumeShade(ctx, r * 1.05);
    ctx.restore();
    headShape(ctx, d, r);
  }
  ctx.lineWidth = Math.max(1.5, r * 0.04);
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();

  drawHair(ctx, d, r);
  // The face slides across the head as it turns and nods, which reads as the head turning.
  ctx.save();
  ctx.translate(Math.max(-1, Math.min(1, e.yaw ?? 0)) * r * 0.2, Math.max(-1, Math.min(1, e.nod ?? 0)) * r * 0.1);
  if (d.cheeks) {
    const glow = 0.12 + e.smile * 0.08;
    blob(ctx, -0.5 * r, 0.2 * r, glow * r, glow * 0.65 * r, 'rgba(255,110,140,.38)');
    blob(ctx, 0.5 * r, 0.2 * r, glow * r, glow * 0.65 * r, 'rgba(255,110,140,.38)');
  }
  drawEyes(ctx, d, r, e);
  drawMouth(ctx, d, r, e);
  drawGlasses(ctx, d, r);
  ctx.restore();
  if (d.hat !== 'halo') drawHat(ctx, d, r);
  ctx.restore();
}

function blob(ctx: Ctx, x: number, y: number, rx: number, ry: number, fill: string, rotation = 0): void {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.5, rx), Math.max(0.5, ry), rotation, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
}

function outlined(ctx: Ctx, fill: string, width: number): void {
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = width;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
}

function headShape(ctx: Ctx, d: CharacterDesign, r: number): void {
  ctx.beginPath();
  switch (d.head) {
    case 'square':
      ctx.roundRect(-r * 0.95, -r * 0.92, r * 1.9, r * 1.86, r * 0.36);
      break;
    case 'oval':
      ctx.ellipse(0, 0, r * 0.86, r * 1.02, 0, 0, Math.PI * 2);
      break;
    case 'bean':
      ctx.moveTo(-r * 0.9, -r * 0.1);
      ctx.bezierCurveTo(-r * 0.95, -r * 1.05, r * 0.95, -r * 1.05, r * 0.92, -r * 0.1);
      ctx.bezierCurveTo(r * 0.9, r * 0.75, r * 0.45, r * 1.02, 0, r * 1.0);
      ctx.bezierCurveTo(-r * 0.5, r * 1.02, -r * 0.88, r * 0.7, -r * 0.9, -r * 0.1);
      break;
    default:
      ctx.arc(0, 0, r * 0.98, 0, Math.PI * 2);
  }
}

function drawEars(ctx: Ctx, d: CharacterDesign, r: number): void {
  const w = Math.max(1.5, r * 0.04);
  for (const side of [-1, 1]) {
    ctx.beginPath();
    switch (d.ears) {
      case 'cat':
        ctx.moveTo(side * r * 0.92, -r * 0.25);
        ctx.lineTo(side * r * 0.78, -r * 1.12);
        ctx.lineTo(side * r * 0.22, -r * 0.82);
        ctx.closePath();
        outlined(ctx, d.skin, w);
        break;
      case 'bear':
        ctx.arc(side * r * 0.72, -r * 0.72, r * 0.3, 0, Math.PI * 2);
        outlined(ctx, d.skin, w);
        blob(ctx, side * r * 0.72, -r * 0.72, r * 0.15, r * 0.15, 'rgba(0,0,0,.18)');
        break;
      case 'bunny':
        ctx.ellipse(side * r * 0.38, -r * 1.25, r * 0.18, r * 0.55, side * 0.18, 0, Math.PI * 2);
        outlined(ctx, d.skin, w);
        blob(ctx, side * r * 0.38, -r * 1.22, r * 0.08, r * 0.38, 'rgba(255,120,150,.45)', side * 0.18);
        break;
      case 'elf':
        ctx.moveTo(side * r * 0.85, -r * 0.2);
        ctx.lineTo(side * r * 1.38, -r * 0.62);
        ctx.lineTo(side * r * 0.9, r * 0.18);
        ctx.closePath();
        outlined(ctx, d.skin, w);
        break;
      default:
        return;
    }
  }
}

function drawHair(ctx: Ctx, d: CharacterDesign, r: number): void {
  const w = Math.max(1.5, r * 0.035);
  ctx.beginPath();
  switch (d.hair) {
    case 'spiky': {
      ctx.moveTo(-r * 0.95, -r * 0.2);
      const spikes = 6;
      for (let i = 0; i <= spikes; i++) {
        const a = Math.PI + (i / spikes) * Math.PI;
        const tip = i % 2 === 0 ? 1.28 : 0.95;
        ctx.lineTo(Math.cos(a) * r * tip, Math.sin(a) * r * tip - r * 0.05);
      }
      ctx.lineTo(r * 0.95, -r * 0.2);
      ctx.quadraticCurveTo(0, -r * 0.55, -r * 0.95, -r * 0.2);
      break;
    }
    case 'bob':
      ctx.moveTo(-r * 1.02, r * 0.45);
      ctx.bezierCurveTo(-r * 1.15, -r * 1.25, r * 1.15, -r * 1.25, r * 1.02, r * 0.45);
      ctx.lineTo(r * 0.72, r * 0.45);
      ctx.quadraticCurveTo(r * 0.78, -r * 0.4, 0, -r * 0.45);
      ctx.quadraticCurveTo(-r * 0.78, -r * 0.4, -r * 0.72, r * 0.45);
      ctx.closePath();
      break;
    case 'curly':
      for (let i = 0; i < 9; i++) {
        const a = Math.PI * (1.02 + (i / 8) * 0.96);
        ctx.moveTo(Math.cos(a) * r * 0.9 + r * 0.24, Math.sin(a) * r * 0.9);
        ctx.arc(Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.9, r * 0.24, 0, Math.PI * 2);
      }
      break;
    case 'mohawk':
      ctx.moveTo(-r * 0.16, -r * 0.6);
      ctx.lineTo(-r * 0.2, -r * 1.3);
      ctx.lineTo(0, -r * 1.12);
      ctx.lineTo(r * 0.06, -r * 1.42);
      ctx.lineTo(r * 0.2, -r * 1.2);
      ctx.lineTo(r * 0.16, -r * 0.6);
      ctx.closePath();
      break;
    default:
      return;
  }
  outlined(ctx, d.hairColor, w);
}

function drawEyes(ctx: Ctx, d: CharacterDesign, r: number, e: Expression): void {
  const y = -r * 0.1 - e.browUp * 0.05 * r;
  if (d.eyes === 'visor') {
    ctx.beginPath();
    ctx.roundRect(-r * 0.66, y - r * 0.2, r * 1.32, r * 0.4, r * 0.2);
    outlined(ctx, '#1d2433', Math.max(1.5, r * 0.035));
    for (const [side, blink] of [[-1, e.blinkLeft], [1, e.blinkRight]] as const) {
      const h = r * 0.16 * Math.max(0.12, 1 - blink);
      ctx.fillStyle = d.eyeColor === '#1d2433' ? '#4de3ff' : lighten(d.eyeColor);
      ctx.fillRect(side * r * 0.3 - r * 0.12, y - h / 2, r * 0.24, h);
    }
    return;
  }
  // Pupils follow the presenter's gaze.
  const gx = Math.max(-1, Math.min(1, e.lookX ?? 0)) * r * 0.05;
  const gy = Math.max(-1, Math.min(1, e.lookY ?? 0)) * r * 0.035;
  for (const [side, blink] of [[-1, e.blinkLeft], [1, e.blinkRight]] as const) {
    const open = Math.max(0.1, 1 - blink);
    const x = side * r * 0.34;
    switch (d.eyes) {
      case 'dots':
        blob(ctx, x + gx, y + gy, r * 0.08, r * 0.09 * open, d.eyeColor);
        break;
      case 'anime':
        blob(ctx, x, y, r * 0.15, r * 0.21 * open, '#ffffff');
        blob(ctx, x + gx * 0.8, y + r * 0.02 + gy, r * 0.11, r * 0.17 * open, d.eyeColor);
        if (open > 0.4) {
          blob(ctx, x + gx * 0.8 + r * 0.04, y - r * 0.07 + gy, r * 0.045, r * 0.045, '#ffffff');
          blob(ctx, x + gx * 0.8 - r * 0.04, y + r * 0.07 + gy, r * 0.025, r * 0.025, '#ffffff');
        }
        break;
      case 'sleepy':
        ctx.beginPath();
        ctx.ellipse(x, y, r * 0.13, r * 0.11 * Math.min(open, 0.55), 0, 0, Math.PI);
        ctx.fillStyle = d.eyeColor;
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x - r * 0.15, y);
        ctx.lineTo(x + r * 0.15, y);
        ctx.lineWidth = Math.max(2, r * 0.04);
        ctx.strokeStyle = OUTLINE;
        ctx.stroke();
        break;
      default: // big
        blob(ctx, x, y, r * 0.15, r * 0.17 * open, '#ffffff');
        blob(ctx, x + gx, y + r * 0.02 + gy, r * 0.09, r * 0.11 * open, d.eyeColor);
        if (open > 0.4) blob(ctx, x + gx + r * 0.035, y - r * 0.04 + gy, r * 0.035, r * 0.035, '#ffffff');
    }
  }
}

function drawMouth(ctx: Ctx, d: CharacterDesign, r: number, e: Expression): void {
  const y = r * 0.36;
  const open = Math.min(1, e.mouthOpen * 1.4);
  const w = Math.max(2, r * 0.05);
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = w;

  if (d.mouth === 'beak') {
    ctx.beginPath();
    ctx.moveTo(-r * 0.2, y - r * 0.08);
    ctx.lineTo(r * 0.2, y - r * 0.08);
    ctx.lineTo(0, y + r * 0.08);
    ctx.closePath();
    outlined(ctx, '#ffb43d', w * 0.7);
    if (open > 0.08) {
      ctx.beginPath();
      ctx.moveTo(-r * 0.16, y + r * 0.02);
      ctx.lineTo(r * 0.16, y + r * 0.02);
      ctx.lineTo(0, y + r * (0.1 + open * 0.2));
      ctx.closePath();
      outlined(ctx, '#ff8a3d', w * 0.7);
    }
    return;
  }

  if (open > 0.08) {
    ctx.beginPath();
    ctx.ellipse(0, y + open * 0.04 * r, r * (0.2 + e.smile * 0.08), Math.max(0.03 * r, open * 0.2 * r), 0, 0, Math.PI * 2);
    outlined(ctx, '#3a0d16', w * 0.7);
    if (d.mouth === 'teeth') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-r * 0.14, y + open * 0.04 * r - open * 0.18 * r, r * 0.28, r * 0.07);
    } else {
      blob(ctx, 0, y + open * 0.13 * r, r * 0.11, open * 0.07 * r, '#e0566b');
    }
    return;
  }

  ctx.beginPath();
  const curve = (0.04 + e.smile * 0.14) * r;
  if (d.mouth === 'cat') {
    ctx.moveTo(-r * 0.2, y);
    ctx.quadraticCurveTo(-r * 0.1, y + curve, 0, y);
    ctx.quadraticCurveTo(r * 0.1, y + curve, r * 0.2, y);
  } else {
    ctx.moveTo(-r * 0.2, y);
    ctx.quadraticCurveTo(0, y + curve * 1.4, r * 0.2, y);
  }
  ctx.stroke();
  if (d.mouth === 'teeth') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-r * 0.05, y + curve * 0.5, r * 0.1, r * 0.06);
  }
}

function drawGlasses(ctx: Ctx, d: CharacterDesign, r: number): void {
  if (d.glasses === 'none') return;
  const y = -r * 0.1;
  ctx.lineWidth = Math.max(2, r * 0.045);
  ctx.strokeStyle = '#1b1b1f';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    if (d.glasses === 'round') {
      ctx.arc(side * r * 0.34, y, r * 0.2, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.roundRect(side * r * 0.34 - r * 0.25, y - r * 0.14, r * 0.5, r * 0.28, r * 0.1);
      ctx.fillStyle = 'rgba(15,15,25,.92)';
      ctx.fill();
      ctx.stroke();
    }
  }
  ctx.beginPath();
  ctx.moveTo(-r * 0.12, y);
  ctx.lineTo(r * 0.12, y);
  ctx.stroke();
}

function drawHat(ctx: Ctx, d: CharacterDesign, r: number): void {
  const w = Math.max(1.5, r * 0.04);
  switch (d.hat) {
    case 'cap':
      ctx.beginPath();
      ctx.moveTo(-r * 0.92, -r * 0.35);
      ctx.bezierCurveTo(-r * 0.9, -r * 1.2, r * 0.9, -r * 1.2, r * 0.92, -r * 0.35);
      ctx.closePath();
      outlined(ctx, d.hatColor, w);
      ctx.beginPath();
      ctx.ellipse(r * 0.55, -r * 0.36, r * 0.6, r * 0.12, 0, 0, Math.PI * 2);
      outlined(ctx, d.hatColor, w);
      break;
    case 'crown':
      ctx.beginPath();
      ctx.moveTo(-r * 0.6, -r * 0.7);
      ctx.lineTo(-r * 0.68, -r * 1.25);
      ctx.lineTo(-r * 0.32, -r * 0.98);
      ctx.lineTo(0, -r * 1.35);
      ctx.lineTo(r * 0.32, -r * 0.98);
      ctx.lineTo(r * 0.68, -r * 1.25);
      ctx.lineTo(r * 0.6, -r * 0.7);
      ctx.closePath();
      outlined(ctx, '#ffd166', w);
      blob(ctx, 0, -r * 0.88, r * 0.08, r * 0.08, d.hatColor);
      break;
    case 'wizard':
      ctx.beginPath();
      ctx.moveTo(-r * 0.75, -r * 0.62);
      ctx.quadraticCurveTo(-r * 0.1, -r * 1.2, r * 0.25, -r * 1.75);
      ctx.quadraticCurveTo(r * 0.2, -r * 1.1, r * 0.75, -r * 0.62);
      ctx.closePath();
      outlined(ctx, d.hatColor, w);
      ctx.beginPath();
      ctx.ellipse(0, -r * 0.64, r * 0.95, r * 0.16, 0, 0, Math.PI * 2);
      outlined(ctx, d.hatColor, w);
      ctx.fillStyle = '#ffd166';
      ctx.font = `${Math.round(r * 0.3)}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('★', 0, -r * 1.0);
      break;
    case 'headphones':
      ctx.beginPath();
      ctx.arc(0, -r * 0.05, r * 1.02, Math.PI * 1.08, Math.PI * 1.92);
      ctx.lineWidth = r * 0.14;
      ctx.strokeStyle = OUTLINE;
      ctx.stroke();
      ctx.lineWidth = r * 0.09;
      ctx.strokeStyle = d.hatColor;
      ctx.stroke();
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.roundRect(side * r * 0.98 - r * 0.15, -r * 0.3, r * 0.3, r * 0.5, r * 0.12);
        outlined(ctx, d.hatColor, w);
      }
      break;
    default:
      break;
  }
}

function drawHalo(ctx: Ctx, r: number): void {
  ctx.beginPath();
  ctx.ellipse(0, -r * 1.12, r * 0.6, r * 0.15, 0, 0, Math.PI * 2);
  ctx.lineWidth = r * 0.09;
  ctx.strokeStyle = '#ffd166';
  ctx.shadowColor = '#ffd166';
  ctx.shadowBlur = r * 0.25;
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function lighten(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * 0.55);
  return `rgb(${mix((n >> 16) & 255)},${mix((n >> 8) & 255)},${mix(n & 255)})`;
}
