/**
 * Celebrations: confetti, a flower shower, hearts, sparkles, snow and balloons over the video.
 *
 * This is a port of the server's CelebrationPlanner (AnimStudio.Application/Rendering/Celebration.cs)
 * and of CelebrationFilters' motion formulas: the same mulberry32 generator, seeded the same
 * way from the item's id, drawing the same random numbers in the same order. So the particles
 * the editor and Photo Story preview are the particles the export draws. Change one side, change
 * both - CelebrationPlannerTests.Matches_the_studio_preview pins numbers this file produces too.
 */

export type CelebrationKind = 'confetti' | 'cannon' | 'flowers' | 'petals' | 'hearts' | 'sparkles' | 'snow' | 'balloons';
export type CelebrationMode = 'burst' | 'rain';

/** What a celebration timeline item carries besides its kind (the item's `src`). */
export interface CelebrationSettings {
  mode?: CelebrationMode;
  /** 1-100: how many particles. */
  density?: number;
  /** 0.5-2: particle size. */
  size?: number;
  /** 0.5-2: how fast they travel. */
  speed?: number;
}

export interface CelebrationOption {
  id: CelebrationKind;
  label: string;
  icon: string;
  hint: string;
}

export const CELEBRATIONS: readonly CelebrationOption[] = [
  { id: 'flowers', label: 'Flower shower', icon: '🌼', hint: 'Marigolds and rose petals drift down - pushp varsha' },
  { id: 'petals', label: 'Rose petals', icon: '🌹', hint: 'Soft red and pink petals float down' },
  { id: 'confetti', label: 'Confetti', icon: '🎊', hint: 'Colourful confetti rains from the top' },
  { id: 'cannon', label: 'Confetti cannon', icon: '🎉', hint: 'Two bursts shoot up from the bottom corners' },
  { id: 'hearts', label: 'Hearts', icon: '💖', hint: 'Hearts float up like live reactions' },
  { id: 'sparkles', label: 'Sparkles', icon: '✨', hint: 'Twinkling golden stars across the frame' },
  { id: 'balloons', label: 'Balloons', icon: '🎈', hint: 'Balloons rise from below' },
  { id: 'snow', label: 'Snow', icon: '❄', hint: 'Gentle snowfall' },
];

export const CELEBRATION_MAX_PARTICLES = 48;
export const CELEBRATION_FADE_SECONDS = 0.4;
export const CELEBRATION_DEFAULT_SECONDS = 5;

type Shape = 'ribbon' | 'petal' | 'marigold' | 'heart' | 'star' | 'flake' | 'balloon';
type Motion = 'fall' | 'rise' | 'cannon' | 'twinkle';

export interface CelebrationParticle {
  shape: Shape;
  rgb: string;
  width: number;
  height: number;
  motion: Motion;
  x0: number;
  y0: number;
  delay: number;
  speed: number;
  swayAmplitude: number;
  swayHz: number;
  phase: number;
  spinDegreesPerSecond: number;
  velocityX: number;
  twinkleHz: number;
  drag: number;
}

interface Normalized { kind: CelebrationKind; mode: CelebrationMode; density: number; size: number; speed: number; seed: number }

const CONFETTI = ['ff4d6d', 'ffd166', '06d6a0', '4cc9f0', '9b5de5', 'f15bb5', 'ffffff'];
const MARIGOLD = ['ff9f1c', 'ffb703', 'fb8500', 'ffd60a'];
const ROSE = ['e63946', 'ff4d6d', 'c9184a', 'ff8fab'];
const HEART = ['ff4d6d', 'ff006e', 'ff8fab', 'e5383b'];
const SPARKLE = ['fff3b0', 'ffd166', 'ffffff', 'ffe8a3'];
const BALLOON = ['ef476f', 'ffd166', '06d6a0', '118ab2', '9b5de5', 'f78c6b'];

const CANNON_DRAG = 2.2;
const CANNON_SETTLE = 0.12;

export function isCelebrationKind(value: string | undefined | null): value is CelebrationKind {
  return CELEBRATIONS.some((c) => c.id === value);
}

export function celebrationOption(kind: string | undefined): CelebrationOption | undefined {
  return CELEBRATIONS.find((c) => c.id === kind);
}

/** Weather keeps falling; showers happen once. */
export function defaultCelebrationMode(kind: CelebrationKind): CelebrationMode {
  return kind === 'snow' || kind === 'sparkles' ? 'rain' : 'burst';
}

/** FNV-1a over UTF-16 code units, as `CelebrationPlanner.Seed` does. */
export function celebrationSeed(source: string): number {
  let hash = 2166136261;
  for (let i = 0; i < source.length; i++) {
    hash ^= source.charCodeAt(i);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash & 0x7fffffff;
}

function clamp(v: number | undefined, fallback: number, min: number, max: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback;
}

function normalize(kind: CelebrationKind, s: CelebrationSettings | undefined, seedSource: string): Normalized {
  return {
    kind,
    mode: s?.mode === 'rain' || s?.mode === 'burst' ? s.mode : defaultCelebrationMode(kind),
    density: Math.round(clamp(s?.density, 50, 1, 100)),
    size: clamp(s?.size, 1, 0.5, 2),
    speed: clamp(s?.speed, 1, 0.5, 2),
    seed: celebrationSeed(seedSource),
  };
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** C#'s Math.Round is banker's rounding; the planner's pixel sizes must round the same way. */
function roundHalfEven(v: number): number {
  const f = Math.floor(v);
  const d = v - f;
  if (d > 0.5) return f + 1;
  if (d < 0.5) return f;
  return f % 2 === 0 ? f : f + 1;
}

const px = (v: number) => Math.max(4, roundHalfEven(v / 2) * 2);

/** The particles of one celebration, exactly as the server plans them. */
export function planCelebration(kind: CelebrationKind, settings: CelebrationSettings | undefined, seedSource: string,
                                canvasWidth: number, canvasHeight: number, seconds: number): CelebrationParticle[] {
  const s = normalize(kind, settings, seedSource);
  const random = mulberry32(s.seed);
  const count = roundHalfEven(8 + (CELEBRATION_MAX_PARTICLES - 8) * (s.density - 1) / 99);
  const unit = Math.min(canvasWidth, canvasHeight) / 100 * s.size;
  const window = s.mode === 'burst' ? Math.max(0.3, Math.min(seconds * 0.45, 2.5)) : seconds;
  const list: CelebrationParticle[] = [];

  const R = () => random();
  const between = (a: number, b: number) => a + (b - a) * R();
  const pick = (colors: string[]) => colors[Math.trunc(R() * colors.length) % colors.length];
  const sign = (r: number) => (r < 0.5 ? -1 : 1);
  const make = (p: Omit<CelebrationParticle, 'drag'> & { drag?: number }): CelebrationParticle => ({ drag: 0, ...p });

  for (let i = 0; i < count; i++) {
    const delay = between(0, window);
    const phase = between(0, Math.PI * 2);
    switch (s.kind) {
      case 'confetti': {
        const w = px(unit * between(1.8, 2.8));
        const rgb = pick(CONFETTI);
        const h = px(w * 0.45);
        const x0 = R(); const y0 = between(0, 0.4);
        const speed = between(0.32, 0.55) * s.speed; const amp = between(0.01, 0.04); const hz = between(0.4, 1.1);
        const spin = between(180, 540) * sign(R());
        list.push(make({ shape: 'ribbon', rgb, width: w, height: h, motion: 'fall', x0, y0, delay, speed,
          swayAmplitude: amp, swayHz: hz, phase, spinDegreesPerSecond: spin, velocityX: 0, twinkleHz: 0 }));
        break;
      }
      case 'cannon': {
        const w = px(unit * between(1.8, 2.8));
        const left = i % 2 === 0;
        const rgb = pick(CONFETTI);
        const h = px(w * 0.45);
        const d = between(0, Math.min(0.6, window));
        const speed = between(0.9, 2.3) * s.speed; const amp = between(0.005, 0.03); const hz = between(0.4, 1.2);
        const spin = between(240, 720) * sign(R());
        const vx = (left ? 1 : -1) * between(0.08, 0.85) * s.speed;
        const drag = between(1.2, 3.6);
        list.push(make({ shape: 'ribbon', rgb, width: w, height: h, motion: 'cannon', x0: left ? 0.04 : 0.96, y0: 1, delay: d, speed,
          swayAmplitude: amp, swayHz: hz, phase, spinDegreesPerSecond: spin, velocityX: vx, twinkleHz: 0, drag }));
        break;
      }
      case 'flowers':
      case 'petals': {
        const marigold = s.kind === 'flowers' && R() < 0.55;
        const w = px(unit * (marigold ? between(3.0, 4.6) : between(2.4, 3.6)));
        const rgb = marigold ? pick(MARIGOLD) : pick(ROSE);
        const h = marigold ? w : px(w * 0.62);
        const x0 = R(); const y0 = between(0, 0.25);
        const speed = between(0.2, 0.36) * s.speed; const amp = between(0.02, 0.05); const hz = between(0.25, 0.6);
        const spin = between(40, 160) * sign(R());
        list.push(make({ shape: marigold ? 'marigold' : 'petal', rgb, width: w, height: h, motion: 'fall', x0, y0, delay, speed,
          swayAmplitude: amp, swayHz: hz, phase, spinDegreesPerSecond: spin, velocityX: 0, twinkleHz: 0 }));
        break;
      }
      case 'hearts': {
        const w = px(unit * between(2.8, 4.6));
        const rgb = pick(HEART);
        const x0 = between(0.05, 0.95); const y0 = between(0, 0.4);
        const speed = between(0.16, 0.3) * s.speed; const amp = between(0.015, 0.04); const hz = between(0.3, 0.7);
        const spin = between(-25, 25);
        list.push(make({ shape: 'heart', rgb, width: w, height: w, motion: 'rise', x0, y0, delay, speed,
          swayAmplitude: amp, swayHz: hz, phase, spinDegreesPerSecond: spin, velocityX: 0, twinkleHz: 0 }));
        break;
      }
      case 'sparkles': {
        const w = px(unit * between(2.2, 4.2));
        const rgb = pick(SPARKLE);
        const x0 = R(); const y0 = between(0.04, 0.96);
        const speed = between(0.01, 0.04) * s.speed; const amp = between(0.004, 0.012); const hz = between(0.2, 0.5);
        const spin = between(20, 70) * sign(R());
        const twinkle = between(0.6, 1.6) * s.speed;
        list.push(make({ shape: 'star', rgb, width: w, height: w, motion: 'twinkle', x0, y0, delay, speed,
          swayAmplitude: amp, swayHz: hz, phase, spinDegreesPerSecond: spin, velocityX: 0, twinkleHz: twinkle }));
        break;
      }
      case 'snow': {
        const w = px(unit * between(0.8, 2.0));
        const x0 = R(); const y0 = between(0, 0.4);
        const speed = between(0.08, 0.18) * s.speed; const amp = between(0.01, 0.03); const hz = between(0.15, 0.4);
        list.push(make({ shape: 'flake', rgb: 'ffffff', width: w, height: w, motion: 'fall', x0, y0, delay, speed,
          swayAmplitude: amp, swayHz: hz, phase, spinDegreesPerSecond: 0, velocityX: 0, twinkleHz: 0 }));
        break;
      }
      case 'balloons': {
        const w = px(unit * between(4.2, 6.0));
        const rgb = pick(BALLOON);
        const h = px(w * 1.35);
        const x0 = between(0.05, 0.95); const y0 = between(0, 0.4);
        const speed = between(0.14, 0.24) * s.speed; const amp = between(0.01, 0.025); const hz = between(0.2, 0.45);
        const spin = between(-12, 12);
        list.push(make({ shape: 'balloon', rgb, width: w, height: h, motion: 'rise', x0, y0, delay, speed,
          swayAmplitude: amp, swayHz: hz, phase, spinDegreesPerSecond: spin, velocityX: 0, twinkleHz: 0 }));
        break;
      }
    }
  }
  return list;
}

/** The rotated sprite's box, as ffmpeg's `rotate=ow=hypot(iw,ih)` makes it. */
function box(p: CelebrationParticle): { w: number; h: number } {
  if (p.spinDegreesPerSecond === 0) return { w: p.width, h: p.height };
  const d = Math.ceil(Math.hypot(p.width, p.height) / 2) * 2;
  return { w: d, h: d };
}

const mod = (a: number, b: number) => a - b * Math.floor(a / b);

/** Centre of a particle at time `t` into the celebration, in canvas pixels (CelebrationFilters.Position). */
export function particleCentre(p: CelebrationParticle, mode: CelebrationMode, seconds: number, t: number,
                               W: number, H: number): { x: number; y: number } {
  const { w, h } = box(p);
  const sway = p.swayAmplitude * W * Math.sin(p.swayHz * Math.PI * 2 * t + p.phase);
  let left = p.x0 * W + sway - w / 2;
  const offset = seconds <= 0 ? 0 : p.delay / seconds;
  let top: number;
  switch (p.motion) {
    case 'rise':
      top = mode === 'rain' ? H + h / 2 - mod(p.speed * H * t + offset * (H + h), H + h) - h / 2 : H + p.y0 * H - p.speed * H * (t - p.delay);
      break;
    case 'cannon': {
      const tau = Math.max(0, t - p.delay);
      const drag = p.drag > 0 ? p.drag : CANNON_DRAG;
      const push = (1 - Math.exp(-drag * tau)) / drag;
      left = p.x0 * W + p.velocityX * W * push + sway - w / 2;
      top = H + h / 2 - p.speed * H * push + CANNON_SETTLE * H * tau - h / 2;
      break;
    }
    case 'twinkle':
      top = p.y0 * H - p.speed * H * t - h / 2;
      break;
    default:
      top = mode === 'rain' ? mod(p.speed * H * t + offset * (H + h), H + h) - h : -h - p.y0 * H + p.speed * H * (t - p.delay);
  }
  return { x: left + w / 2, y: top + h / 2 };
}

/** The layer's own fade in and out, as the export applies it. */
export function celebrationAlpha(seconds: number, t: number): number {
  if (t < 0 || t > seconds) return 0;
  const fade = Math.min(CELEBRATION_FADE_SECONDS, seconds / 3);
  if (fade <= 0) return 1;
  return Math.max(0, Math.min(1, t / fade, (seconds - t) / fade));
}

/** A drawable celebration for the editor and Photo Story previews, scaled to whatever canvas it lands on. */
export class CelebrationPainter {
  private particles: CelebrationParticle[] = [];
  private key = '';

  constructor(private kind: CelebrationKind, private settings: CelebrationSettings | undefined,
              private seedSource: string, private seconds: number,
              /** The export's canvas, which the particle sizes are planned for. */
              private exportWidth: number, private exportHeight: number) {}

  update(kind: CelebrationKind, settings: CelebrationSettings | undefined, seedSource: string, seconds: number,
         exportWidth: number, exportHeight: number): void {
    Object.assign(this, { kind, settings, seedSource, seconds, exportWidth, exportHeight });
  }

  /** Draws the celebration at `t` seconds into it onto a canvas of any size. */
  draw(ctx: CanvasRenderingContext2D, t: number): void {
    const key = JSON.stringify([this.kind, this.settings, this.seedSource, this.seconds, this.exportWidth, this.exportHeight]);
    if (key !== this.key) {
      this.key = key;
      this.particles = planCelebration(this.kind, this.settings, this.seedSource, this.exportWidth, this.exportHeight, this.seconds);
    }
    const alpha = celebrationAlpha(this.seconds, t);
    if (alpha <= 0) return;
    const W = this.exportWidth;
    const H = this.exportHeight;
    const scale = ctx.canvas.width / W;
    const mode = this.settings?.mode === 'rain' || this.settings?.mode === 'burst' ? this.settings.mode : defaultCelebrationMode(this.kind);
    ctx.save();
    ctx.scale(scale, ctx.canvas.height / H);
    for (const p of this.particles) {
      const c = particleCentre(p, mode, this.seconds, t, W, H);
      const half = Math.hypot(p.width, p.height) / 2;
      if (c.x < -half || c.x > W + half || c.y < -half || c.y > H + half) continue;
      let a = alpha;
      if (p.motion === 'twinkle') a *= 0.2 + 0.8 * Math.abs(Math.sin(t * p.twinkleHz * Math.PI * 2 + p.phase));
      ctx.save();
      ctx.globalAlpha = a;
      ctx.translate(c.x, c.y);
      // ffmpeg's rotate turns clockwise for a positive angle, as the canvas does.
      if (p.spinDegreesPerSecond !== 0) ctx.rotate(p.spinDegreesPerSecond * Math.PI / 180 * t + p.phase);
      drawShape(ctx, p);
      ctx.restore();
    }
    ctx.restore();
  }
}

function drawShape(ctx: CanvasRenderingContext2D, p: CelebrationParticle): void {
  const w = p.width;
  const h = p.height;
  const color = `#${p.rgb}`;
  ctx.fillStyle = color;
  switch (p.shape) {
    case 'ribbon':
      ctx.fillRect(-w / 2, -h / 2, w, h);
      break;
    case 'petal':
      ctx.beginPath();
      ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'marigold': {
      ctx.beginPath();
      for (let k = 0; k <= 60; k++) {
        const a = (k / 60) * Math.PI * 2;
        const r = (w / 2) * (0.8 + 0.15 * Math.cos(10 * a));
        const x = Math.cos(a) * r;
        const y = Math.sin(a) * r;
        if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.arc(0, 0, w * 0.2, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'heart': {
      const s = w / 2;
      ctx.beginPath();
      ctx.moveTo(0, s * 0.75);
      ctx.bezierCurveTo(-s * 1.1, -s * 0.05, -s * 0.55, -s * 0.95, 0, -s * 0.4);
      ctx.bezierCurveTo(s * 0.55, -s * 0.95, s * 1.1, -s * 0.05, 0, s * 0.75);
      ctx.fill();
      break;
    }
    case 'star': {
      const s = w / 2;
      const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 0.7);
      glow.addColorStop(0, 'rgba(255,255,255,0.55)');
      glow.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(-s, -s, w, w);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.quadraticCurveTo(0, 0, s, 0);
      ctx.quadraticCurveTo(0, 0, 0, s);
      ctx.quadraticCurveTo(0, 0, -s, 0);
      ctx.quadraticCurveTo(0, 0, 0, -s);
      ctx.fill();
      break;
    }
    case 'flake': {
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, w / 2);
      g.addColorStop(0, 'rgba(255,255,255,0.92)');
      g.addColorStop(0.55, 'rgba(255,255,255,0.75)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, w / 2, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'balloon': {
      const ry = h * 0.4;
      const cy = -h * 0.085;
      ctx.beginPath();
      ctx.ellipse(0, cy, w * 0.475, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-w * 0.05, h * 0.31);
      ctx.lineTo(w * 0.05, h * 0.31);
      ctx.lineTo(0, h * 0.37);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = Math.max(1, w * 0.03);
      ctx.beginPath();
      ctx.moveTo(0, h * 0.37);
      ctx.lineTo(0, h * 0.5);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.beginPath();
      ctx.ellipse(-w * 0.17, cy - ry * 0.4, w * 0.08, ry * 0.18, -0.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
  }
}
