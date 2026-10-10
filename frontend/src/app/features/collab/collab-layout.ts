/**
 * Collab layouts: where the original video and the camera sit in the frame, and how one
 * frame is drawn. Everything here is plain geometry plus canvas calls, shared by the live
 * preview, the recording and the re-render after a take, so all three look the same.
 */

export type CollabLayout = 'side' | 'stack' | 'react' | 'green' | 'stitch' | 'commentary' | 'dub';
export type CollabAspect = 'portrait' | 'landscape' | 'square';
export type Fit = 'fill' | 'fit';

/** In a stitch, the original plays first and then it's your turn; a commentary goes back and forth. */
export type StitchPhase = 'source' | 'you';

/** The layouts that take turns with the original rather than playing alongside it. */
export function takesTurns(layout: CollabLayout): boolean {
  return layout === 'stitch' || layout === 'commentary';
}

/**
 * One switch in a turn-taking take: from `at` seconds after the original first started, it's
 * `phase`'s turn, and (for the original) it carries on from `sourceTime`. A take's turns are
 * what lets a rebuild pause and resume the original at exactly the moments you did.
 */
export interface Turn {
  at: number;
  phase: StitchPhase;
  sourceTime: number;
}

/** The entry in force `seconds` after the original started (the first one before that). */
export function cueAt<T extends { at: number }>(cues: readonly T[], seconds: number): T {
  let current = cues[0];
  for (const c of cues) if (c.at <= seconds) current = c;
  return current;
}

/** Whether your voice is in the mix during a phase: not while the original has the floor, unless you're on screen. */
export function voiceHeard(s: CollabSettings, phase: StitchPhase): boolean {
  if (s.layout === 'stitch') return phase === 'you';
  if (s.layout === 'commentary') return phase === 'you' || s.commentaryBubble;
  return true;
}

export interface Spot {
  /** Centre, 0-1 of the frame. */
  x: number;
  y: number;
  /** Width as a share of the frame width. */
  size: number;
}

export interface CollabSettings {
  layout: CollabLayout;
  aspect: CollabAspect;
  quality: 720 | 1080;
  /** Side by side and stacked: you first (left or top). */
  youFirst: boolean;
  /** Share of the frame given to the first pane in side by side and stacked. */
  split: number;
  /** Fill crops the original to its pane; fit shows all of it over a soft blurred copy. */
  sourceFit: Fit;
  mirror: boolean;
  /** React: the camera bubble. */
  react: Spot & { round: boolean };
  /** Green screen: where you stand over the original. */
  green: Spot;
  sourceVolume: number;
  voiceVolume: number;
  /** Lowers the original while you speak. */
  duck: boolean;
  /** Commentary: show you in the react bubble while the original plays. */
  commentaryBubble: boolean;
  countdown: 0 | 3 | 5 | 10;
}

export interface LayoutChoice {
  id: CollabLayout;
  icon: string;
  label: string;
  hint: string;
}

export const LAYOUTS: readonly LayoutChoice[] = [
  { id: 'side', icon: '◫', label: 'Duet', hint: 'Side by side, both playing at once.' },
  { id: 'stack', icon: '⬒', label: 'Stacked', hint: 'Original on top, you below. Best for Shorts from a wide video.' },
  { id: 'react', icon: '◳', label: 'React', hint: 'Original full screen, you in a bubble. Drag it anywhere.' },
  { id: 'green', icon: '🧍', label: 'Green screen', hint: 'You, cut out, standing in front of the original. No green screen needed.' },
  { id: 'stitch', icon: '⏭', label: 'Stitch', hint: 'A part of the original plays, then it\'s your turn.' },
  { id: 'commentary', icon: '💬', label: 'Commentary', hint: 'Play a part, pause it and talk on camera, play the next part, talk again: as often as you like. Pausing the video is your turn.' },
  { id: 'dub', icon: '🎙️', label: 'Dub', hint: 'The video full screen with your voice over it: give its characters your voice. The camera isn\'t needed.' },
];

export const ASPECTS: readonly { id: CollabAspect; label: string }[] = [
  { id: 'portrait', label: '9:16 Shorts' },
  { id: 'landscape', label: '16:9 Video' },
  { id: 'square', label: '1:1 Square' },
];

export const MIN_SPOT = 0.12;
/** How far a take's sync can be corrected by hand, either way. */
export const SYNC_LIMIT_MS = 500;

export function defaultCollabSettings(): CollabSettings {
  return {
    layout: 'side',
    aspect: 'portrait',
    quality: 720,
    youFirst: false,
    split: 0.5,
    sourceFit: 'fill',
    mirror: true,
    react: { x: 0.78, y: 0.78, size: 0.34, round: true },
    green: { x: 0.5, y: 0.62, size: 0.75 },
    sourceVolume: 0.9,
    voiceVolume: 1,
    duck: true,
    commentaryBubble: false,
    countdown: 3,
  };
}

const clamp = (v: unknown, lo: number, hi: number, fallback: number) =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : fallback;

function oneOf<T>(v: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(v as T) ? (v as T) : fallback;
}

function spot(v: unknown, fallback: Spot, maxSize: number): Spot {
  const s = (v ?? {}) as Partial<Spot>;
  return {
    x: clamp(s.x, 0, 1, fallback.x),
    y: clamp(s.y, 0, 1, fallback.y),
    size: clamp(s.size, MIN_SPOT, maxSize, fallback.size),
  };
}

/** Anything read back from browser storage is checked field by field against what's allowed. */
export function sanitizeCollabSettings(raw: unknown): CollabSettings {
  const d = defaultCollabSettings();
  const s = (raw ?? {}) as Partial<CollabSettings>;
  return {
    layout: oneOf(s.layout, LAYOUTS.map((l) => l.id), d.layout),
    aspect: oneOf(s.aspect, ASPECTS.map((a) => a.id), d.aspect),
    quality: oneOf(s.quality, [720, 1080] as const, d.quality),
    youFirst: typeof s.youFirst === 'boolean' ? s.youFirst : d.youFirst,
    split: clamp(s.split, 0.3, 0.7, d.split),
    sourceFit: oneOf(s.sourceFit, ['fill', 'fit'] as const, d.sourceFit),
    mirror: typeof s.mirror === 'boolean' ? s.mirror : d.mirror,
    react: { ...spot(s.react, d.react, 0.6), round: typeof s.react?.round === 'boolean' ? s.react.round : d.react.round },
    green: spot(s.green, d.green, 1.2),
    sourceVolume: clamp(s.sourceVolume, 0, 1.5, d.sourceVolume),
    voiceVolume: clamp(s.voiceVolume, 0, 2, d.voiceVolume),
    duck: typeof s.duck === 'boolean' ? s.duck : d.duck,
    commentaryBubble: typeof s.commentaryBubble === 'boolean' ? s.commentaryBubble : d.commentaryBubble,
    countdown: oneOf(s.countdown, [0, 3, 5, 10] as const, d.countdown),
  };
}

/** Pixel size of the output for an aspect and quality (the short side is the quality). */
export function frameSize(aspect: CollabAspect, quality: 720 | 1080): { width: number; height: number } {
  const long = Math.round(quality * 16 / 9);
  if (aspect === 'portrait') return { width: quality, height: long };
  if (aspect === 'landscape') return { width: long, height: quality };
  return { width: quality, height: quality };
}

/**
 * A sensible starting layout for an original of this shape, so most people never touch the
 * layout picker: a wide video goes on top of you for Shorts, a tall one beside you.
 */
export function suggestLayout(sourceWidth: number, sourceHeight: number): Pick<CollabSettings, 'layout' | 'aspect'> {
  if (!sourceWidth || !sourceHeight) return { layout: 'side', aspect: 'portrait' };
  return sourceWidth > sourceHeight * 1.15 ? { layout: 'stack', aspect: 'portrait' } : { layout: 'side', aspect: 'portrait' };
}

export interface Rect { x: number; y: number; w: number; h: number; }

export interface Placement {
  source: Rect | null;
  camera: Rect | null;
  /** The camera is drawn as a circle (react bubble). */
  round: boolean;
  /** The camera is cut out of its background (green screen). */
  cutout: boolean;
  /** The camera is a movable bubble over the original (react, and commentary while it plays). */
  bubble: boolean;
}

/** Where each picture goes in a W×H frame. `cameraAspect` is width / height of the camera picture. */
export function place(s: CollabSettings, W: number, H: number, cameraAspect: number, phase: StitchPhase): Placement {
  const full: Rect = { x: 0, y: 0, w: W, h: H };
  switch (s.layout) {
    case 'side': {
      const first = Math.round(W * s.split);
      const a: Rect = { x: 0, y: 0, w: first, h: H };
      const b: Rect = { x: first, y: 0, w: W - first, h: H };
      return { source: s.youFirst ? b : a, camera: s.youFirst ? a : b, round: false, cutout: false, bubble: false };
    }
    case 'stack': {
      const first = Math.round(H * s.split);
      const a: Rect = { x: 0, y: 0, w: W, h: first };
      const b: Rect = { x: 0, y: first, w: W, h: H - first };
      return { source: s.youFirst ? b : a, camera: s.youFirst ? a : b, round: false, cutout: false, bubble: false };
    }
    case 'react':
      return reactBubble(s, W, H, full);
    case 'green': {
      const w = Math.round(W * s.green.size);
      const h = Math.round(w / (cameraAspect || 16 / 9));
      return { source: full, camera: spotRect(s.green, w, h, W, H), round: false, cutout: true, bubble: false };
    }
    case 'stitch':
      return phase === 'source'
        ? { source: full, camera: null, round: false, cutout: false, bubble: false }
        : { source: null, camera: full, round: false, cutout: false, bubble: false };
    case 'dub':
      return { source: full, camera: null, round: false, cutout: false, bubble: false };
    case 'commentary':
      if (phase === 'you') return { source: null, camera: full, round: false, cutout: false, bubble: false };
      return s.commentaryBubble
        ? reactBubble(s, W, H, full)
        : { source: full, camera: null, round: false, cutout: false, bubble: false };
  }
}

function reactBubble(s: CollabSettings, W: number, H: number, full: Rect): Placement {
  const w = Math.round(W * s.react.size);
  const h = s.react.round ? w : Math.round(w * (H >= W ? 4 / 3 : 3 / 4));
  return { source: full, camera: spotRect(s.react, w, h, W, H), round: s.react.round, cutout: false, bubble: true };
}

/** A box of w×h centred on the spot, kept at least partly inside the frame so it can always be grabbed. */
function spotRect(p: Spot, w: number, h: number, W: number, H: number): Rect {
  const x = Math.round(Math.min(W - w * 0.25, Math.max(-w * 0.75, p.x * W - w / 2)));
  const y = Math.round(Math.min(H - h * 0.25, Math.max(-h * 0.75, p.y * H - h / 2)));
  return { x, y, w, h };
}

/** The visible part of an iw×ih picture drawn into a w×h box, as shares (0-1) of the picture. */
export function coverCrop(iw: number, ih: number, w: number, h: number): { sx: number; sy: number; sw: number; sh: number } {
  const scale = Math.max(w / iw, h / ih);
  const sw = Math.min(1, w / scale / iw);
  const sh = Math.min(1, h / scale / ih);
  return { sx: (1 - sw) / 2, sy: (1 - sh) / 2, sw, sh };
}

export interface DrawInput {
  settings: CollabSettings;
  source: HTMLVideoElement | null;
  camera: HTMLVideoElement | null;
  /** The person mask for the camera picture (alpha = person), for the green screen. */
  mask: CanvasImageSource | null;
  phase: StitchPhase;
}

const BACKDROP = '#0b0d14';

/**
 * Draws one frame. Kept cheap on purpose - a few drawImage calls and one small scratch
 * canvas - because it runs 30 times a second while two recorders encode.
 */
export class CollabPainter {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly scratch = document.createElement('canvas');
  private readonly scratchCtx = this.scratch.getContext('2d')!;
  private readonly tiny = document.createElement('canvas');
  private readonly tinyCtx = this.tiny.getContext('2d')!;
  /** Where the camera went in the last frame, for dragging it on the preview. */
  lastCamera: Rect | null = null;

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.tiny.width = 24;
    this.tiny.height = 24;
  }

  resize(width: number, height: number): void {
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
  }

  draw(input: DrawInput): void {
    const { ctx } = this;
    const W = this.canvas.width;
    const H = this.canvas.height;
    const s = input.settings;
    const source = ready(input.source);
    const camera = ready(input.camera);
    const p = place(s, W, H, camera ? camera.videoWidth / camera.videoHeight : 16 / 9, input.phase);

    ctx.fillStyle = BACKDROP;
    ctx.fillRect(0, 0, W, H);

    if (p.source) {
      if (source) this.drawVideo(source, p.source, s.sourceFit, false);
      else this.placeholder(p.source, 'Choose a video to collab with');
    }

    this.lastCamera = p.camera;
    if (!p.camera) return;
    if (!camera) {
      this.placeholder(p.camera, 'Camera');
      return;
    }

    if (p.cutout) {
      // Without a mask yet, nothing of the room is shown rather than all of it.
      if (input.mask) this.drawCutout(camera, input.mask, p.camera, s.mirror);
      return;
    }

    ctx.save();
    if (p.round) {
      const r = p.camera.w / 2;
      ctx.beginPath();
      ctx.arc(p.camera.x + r, p.camera.y + r, r, 0, Math.PI * 2);
      ctx.clip();
    } else if (p.bubble) {
      ctx.beginPath();
      ctx.roundRect(p.camera.x, p.camera.y, p.camera.w, p.camera.h, Math.round(p.camera.w * 0.06));
      ctx.clip();
    }
    this.drawVideo(camera, p.camera, 'fill', s.mirror);
    ctx.restore();

    if (p.bubble) this.outline(p.camera, p.round);
    if (s.layout === 'side' || s.layout === 'stack') this.divider(s, W, H);
  }

  private drawVideo(video: HTMLVideoElement, r: Rect, fit: Fit, mirror: boolean): void {
    const { ctx } = this;
    const iw = video.videoWidth;
    const ih = video.videoHeight;

    if (fit === 'fit') {
      // A soft copy behind the letterbox: a tiny frame scaled up blurs for free.
      this.tinyCtx.drawImage(video, 0, 0, this.tiny.width, this.tiny.height);
      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.imageSmoothingQuality = 'low';
      ctx.drawImage(this.tiny, r.x, r.y, r.w, r.h);
      ctx.restore();
      const scale = Math.min(r.w / iw, r.h / ih);
      const w = iw * scale;
      const h = ih * scale;
      ctx.drawImage(video, r.x + (r.w - w) / 2, r.y + (r.h - h) / 2, w, h);
      return;
    }

    const c = coverCrop(iw, ih, r.w, r.h);
    ctx.save();
    if (mirror) {
      ctx.translate(r.x * 2 + r.w, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, c.sx * iw, c.sy * ih, c.sw * iw, c.sh * ih, r.x, r.y, r.w, r.h);
    ctx.restore();
  }

  /** The camera, kept only where the mask says there's a person. */
  private drawCutout(video: HTMLVideoElement, mask: CanvasImageSource, r: Rect, mirror: boolean): void {
    const w = Math.max(1, r.w);
    const h = Math.max(1, r.h);
    if (this.scratch.width !== w || this.scratch.height !== h) {
      this.scratch.width = w;
      this.scratch.height = h;
    }
    const sc = this.scratchCtx;
    sc.save();
    sc.clearRect(0, 0, w, h);
    if (mirror) {
      sc.translate(w, 0);
      sc.scale(-1, 1);
    }
    sc.globalCompositeOperation = 'source-over';
    sc.drawImage(video, 0, 0, w, h);
    sc.globalCompositeOperation = 'destination-in';
    sc.drawImage(mask, 0, 0, w, h);
    sc.restore();
    this.ctx.drawImage(this.scratch, r.x, r.y);
  }

  private outline(r: Rect, round: boolean): void {
    const { ctx } = this;
    ctx.save();
    ctx.lineWidth = Math.max(2, Math.round(r.w * 0.012));
    ctx.strokeStyle = 'rgba(255,255,255,.9)';
    ctx.beginPath();
    if (round) ctx.arc(r.x + r.w / 2, r.y + r.w / 2, r.w / 2, 0, Math.PI * 2);
    else ctx.roundRect(r.x, r.y, r.w, r.h, Math.round(r.w * 0.06));
    ctx.stroke();
    ctx.restore();
  }

  private divider(s: CollabSettings, W: number, H: number): void {
    const { ctx } = this;
    ctx.fillStyle = 'rgba(0,0,0,.6)';
    const t = Math.max(2, Math.round(Math.min(W, H) * 0.004));
    if (s.layout === 'side') ctx.fillRect(Math.round(W * s.split) - t / 2, 0, t, H);
    else ctx.fillRect(0, Math.round(H * s.split) - t / 2, W, t);
  }

  private placeholder(r: Rect, text: string): void {
    const { ctx } = this;
    ctx.fillStyle = '#151a26';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.fillStyle = 'rgba(255,255,255,.45)';
    ctx.font = `600 ${Math.max(14, Math.round(Math.min(r.w, r.h) * 0.045))}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, r.x + r.w / 2, r.y + r.h / 2);
  }
}

function ready(video: HTMLVideoElement | null): HTMLVideoElement | null {
  return video && video.readyState >= 2 && video.videoWidth > 0 ? video : null;
}
