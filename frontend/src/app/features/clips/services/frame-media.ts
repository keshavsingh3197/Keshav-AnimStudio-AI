import { OverlayMotion, OverlayShape } from '../../../core/models/api.models';

/*
 * Shapes and motion for frame layers - the SAME numbers as MediaOverlayShape.cs and
 * MediaOverlayFilters.cs / TextOverlayFilters.cs on the server, so a layer arrives, moves
 * and leaves on the same frames in the preview and in the export.
 */

/** Thickest ring, in 360-reference pixels. */
export const MAX_BORDER_WIDTH = 24;
/** Corner radius of 'rounded', as a share of the short side. */
export const ROUNDED_CORNER_SHARE = 0.12;
/** How far an image, video or sideways text slides, as a share of the frame along that axis. */
export const SLIDE_SHARE = 0.25;
/** How far text slides up or down, in 360-reference pixels. */
export const TEXT_SLIDE_PX = 40;
/** The size a zoom starts from, as a share of full size. */
export const ZOOM_FROM = 0.5;
/** Longest entrance or exit - long enough to type out a title. ClipMergeOrchestrator.MaxMotionSeconds. */
export const MAX_MOTION_SECONDS = 8;

export interface MotionOption {
  id: OverlayMotion;
  label: string;
}

/** Entrances for pictures and videos. Named for where the layer GOES: "Slide up" rises from below. */
export const MEDIA_IN: MotionOption[] = [
  { id: 'none', label: 'Cut' },
  { id: 'fade', label: 'Fade' },
  { id: 'pop', label: 'Pop' },
  { id: 'zoom', label: 'Zoom' },
  { id: 'slide-down', label: 'From top ↓' },
  { id: 'slide-up', label: 'From bottom ↑' },
  { id: 'slide-right', label: 'From left →' },
  { id: 'slide-left', label: 'From right ←' },
];

export const MEDIA_OUT: MotionOption[] = [
  { id: 'none', label: 'Cut' },
  { id: 'fade', label: 'Fade' },
  { id: 'zoom', label: 'Shrink' },
  { id: 'slide-up', label: 'Exit top ↑' },
  { id: 'slide-down', label: 'Exit bottom ↓' },
  { id: 'slide-left', label: 'Exit left ←' },
  { id: 'slide-right', label: 'Exit right →' },
];

/**
 * Text has no zoom: drawtext cannot scale smoothly, and the preview must not promise it.
 * It can be typed out instead.
 */
export const TEXT_IN: MotionOption[] = [
  ...MEDIA_IN.filter((m) => m.id !== 'pop' && m.id !== 'zoom'),
  { id: 'typewriter', label: '⌨ Typewriter' },
  { id: 'wipe', label: 'Write on →' },
];

/** Entrances that reveal a line from the left rather than move or fade it. */
export function isTextReveal(kind: OverlayMotion | undefined): boolean {
  return kind === 'typewriter' || kind === 'wipe';
}

/**
 * How much of each line a typed / written-on entrance shows at time t, 0-1, or null when
 * the entrance is not one. TextOverlayFilters.Reveal's numbers: the whole block takes the
 * entrance's length (at most 90% of the time on screen), shared out by each line's
 * characters so it types at one even speed; a typewriter steps a character at a time.
 */
export function textReveal(
  t: number, start: number, end: number, kind: OverlayMotion | undefined, duration: number | undefined, lines: string[],
): number[] | null {
  if (!isTextReveal(kind)) return null;
  const total = Math.min(Math.max(0.1, (end - start) * 0.9), Math.max(0.1, duration && duration > 0 ? duration : 1));
  const counts = lines.map((l) => (l.length === 0 ? 0 : Math.max(1, Array.from(l).length)));
  const sum = Math.max(1, counts.reduce((a, b) => a + b, 0));
  let done = 0;
  return counts.map((c) => {
    if (c === 0) return 1;
    const from = start + (total * done) / sum;
    const seconds = Math.max(0.01, (total * c) / sum);
    done += c;
    const p = clip01((t - from) / seconds);
    return kind === 'typewriter' ? Math.floor(p * c) / c : p;
  });
}
export const TEXT_OUT: MotionOption[] = MEDIA_OUT.filter((m) => m.id !== 'zoom');

export const SHAPES: { id: OverlayShape; label: string }[] = [
  { id: 'rect', label: '▭ Square' },
  { id: 'rounded', label: '▢ Rounded' },
  { id: 'circle', label: '◯ Circle' },
];

/** Where and how strongly a layer shows at one instant. */
export interface LayerMotion {
  opacity: number;
  /** Offset as a share of the frame's width / height. */
  dx: number;
  dy: number;
  /** Text only: vertical offset in 360-reference pixels. */
  dyPx: number;
  scale: number;
}

export const STILL: LayerMotion = { opacity: 1, dx: 0, dy: 0, dyPx: 0, scale: 1 };

function clip01(v: number): number {
  return Math.min(1, Math.max(0, v));
}

function seconds(v: number | undefined): number {
  return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : 0.5;
}

/** Eased progress in and out, the server's curves: cubic ease-out in, quadratic out. */
function ease(t: number, start: number, end: number, inDur: number, outDur: number): [number, number, number] {
  const p = clip01((t - start) / inDur);
  return [p, 1 - Math.pow(1 - p, 3), Math.pow(clip01((end - t) / outDur), 2)];
}

function slide(kind: OverlayMotion | undefined, into: boolean, amount: number): [number, number] {
  const k = 1 - amount;
  switch (kind) {
    case 'slide-up': return [0, into ? k : -k];
    case 'slide-down': return [0, into ? -k : k];
    case 'slide-left': return [into ? k : -k, 0];
    case 'slide-right': return [into ? -k : k, 0];
    default: return [0, 0];
  }
}

/**
 * A picture or video layer at time t. The fade is linear like ffmpeg's `fade`; the slide and
 * zoom eased like the export's overlay expressions.
 */
export function mediaMotion(
  t: number, start: number, end: number,
  inKind: OverlayMotion | undefined, inDuration: number | undefined,
  outKind: OverlayMotion | undefined, outDuration: number | undefined,
): LayerMotion {
  const inDur = seconds(inDuration);
  const outDur = seconds(outDuration);
  const [p, easeIn, easeOut] = ease(t, start, end, inDur, outDur);

  let opacity = 1;
  if (inKind && inKind !== 'none') opacity = Math.min(opacity, clip01((t - start) / inDur));
  if (outKind && outKind !== 'none') opacity = Math.min(opacity, clip01((end - t) / outDur));

  const [ix, iy] = slide(inKind, true, easeIn);
  const [ox, oy] = slide(outKind, false, easeOut);

  let scale = 1;
  if (inKind === 'zoom' || inKind === 'zoom-in') scale *= ZOOM_FROM + (1 - ZOOM_FROM) * easeIn;
  else if (inKind === 'pop') {
    const q = p - 1;
    scale *= ZOOM_FROM + (1 - ZOOM_FROM) * (1 + 2.70158 * q * q * q + 1.70158 * q * q);
  }
  if (outKind === 'zoom' || outKind === 'zoom-out' || outKind === 'pop') scale *= ZOOM_FROM + (1 - ZOOM_FROM) * easeOut;

  return { opacity, dx: (ix + ox) * SLIDE_SHARE, dy: (iy + oy) * SLIDE_SHARE, dyPx: 0, scale };
}

/** A text layer at time t: eased fade, up/down in reference pixels, sideways by a share of the width. */
export function textMotion(
  t: number, start: number, end: number,
  inKind: OverlayMotion | undefined, inDuration: number | undefined,
  outKind: OverlayMotion | undefined, outDuration: number | undefined,
): LayerMotion {
  const inDur = seconds(inDuration);
  const outDur = seconds(outDuration);
  const [, easeIn, easeOut] = ease(t, start, end, inDur, outDur);
  // A typed entrance arrives at full strength; textReveal draws it.
  const a = !inKind || inKind === 'none' || isTextReveal(inKind) ? 1 : easeIn;
  const b = !outKind || outKind === 'none' ? 1 : easeOut;

  const [ix, iy] = slide(inKind, true, easeIn);
  const [ox, oy] = slide(outKind, false, easeOut);
  return { opacity: Math.min(a, b), dx: (ix + ox) * SLIDE_SHARE, dy: 0, dyPx: (iy + oy) * TEXT_SLIDE_PX, scale: 1 };
}

/**
 * Width / height of a picture or video in pixels, read from the file itself. Null when it
 * cannot be loaded within a few seconds - the layer then just sizes by its width.
 */
export function measureMediaAspect(url: string, kind: 'image' | 'video'): Promise<number | null> {
  return new Promise((resolve) => {
    const done = (w: number, h: number) => resolve(w > 0 && h > 0 ? w / h : null);
    const timer = setTimeout(() => resolve(null), 8000);
    if (kind === 'image') {
      const img = new Image();
      img.onload = () => { clearTimeout(timer); done(img.naturalWidth, img.naturalHeight); };
      img.onerror = () => { clearTimeout(timer); resolve(null); };
      img.src = url;
      return;
    }
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.onloadedmetadata = () => {
      clearTimeout(timer);
      done(video.videoWidth, video.videoHeight);
      video.removeAttribute('src');
      video.load();
    };
    video.onerror = () => { clearTimeout(timer); resolve(null); };
    video.src = url;
  });
}

/** CSS border-radius for a shape on a box `aspect` wide per unit of height. */
export function shapeRadius(shape: OverlayShape | undefined, aspect: number): string | null {
  if (shape === 'circle') return '50%';
  if (shape === 'rounded') {
    // A share of the SHORT side, written per axis so a wide box still gets round corners.
    const shortW = aspect >= 1 ? 1 / aspect : 1;
    const shortH = aspect >= 1 ? 1 : aspect;
    return `${ROUNDED_CORNER_SHARE * shortW * 100}% / ${ROUNDED_CORNER_SHARE * shortH * 100}%`;
  }
  return null;
}
