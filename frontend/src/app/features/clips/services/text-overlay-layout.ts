import { OverlayMotion, OverlayShape, TextBoxStyle, TimelineItemTextStyle } from '../../../core/models/api.models';
import { MAX_MOTION_SECONDS } from './frame-media';

/*
 * Text overlay layout - the SAME rules as TextOverlayLayout.cs on the server. drawtext
 * cannot wrap, so the export draws exactly the lines these functions produce; the monitor
 * draws them too, so a caption breaks in the same places on screen and in the video.
 * Change a constant here and it must change there.
 */

/** The short side, in pixels, that a style's sizes are measured against. */
export const TEXT_REFERENCE_SHORT_SIDE = 360;
/** Line pitch as a multiple of the font size. */
export const TEXT_LINE_HEIGHT = 1.25;
const CHAR_WIDTH = 0.6;
const USABLE_WIDTH = 0.9;
export const TEXT_MAX_LINES = 6;
export const TEXT_MAX_CHARS = 500;
export const TEXT_MIN_FONT = 8;
export const TEXT_MAX_FONT = 200;
export const TEXT_MAX_OUTLINE = 10;
export const TEXT_TOP_Y = 12;
export const TEXT_BOTTOM_Y = 86;

export const DEFAULT_TEXT_STYLE: TimelineItemTextStyle = {
  fontSize: 28,
  color: '#ffffff',
  backgroundColor: 'rgba(0,0,0,0.6)',
  position: 'bottom',
  boxStyle: 'box',
  boxColor: '#000000',
  boxOpacity: 0.6,
  outlineColor: '#000000',
  outlineWidth: 0,
  shadow: false,
  uppercase: false,
  transitionIn: 'fade',
  transitionInDuration: 0.5,
  transitionOut: 'fade',
  transitionOutDuration: 0.5,
};

export interface TextLook {
  fontSize: number;
  color: string;
  box: TextBoxStyle;
  boxColor: string;
  boxOpacity: number;
  outlineColor: string;
  outlineWidth: number;
  shadow: boolean;
  uppercase: boolean;
  /** Centre of the block, percent of the frame. */
  x: number;
  y: number;
}

const HEX = /^#[0-9a-fA-F]{6}$/;
const RGBA = /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*([0-9]*\.?[0-9]+)\s*)?\)$/i;

export function isHexColor(value: string | null | undefined): value is string {
  return typeof value === 'string' && HEX.test(value);
}

function clamp(value: number | null | undefined, min: number, max: number, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
}

/** The style with every value checked - what the export will actually draw. */
export function resolveTextLook(style: TimelineItemTextStyle | null | undefined): TextLook {
  const s = style ?? DEFAULT_TEXT_STYLE;
  const [box, boxColor, boxOpacity] = resolveBox(s);

  let x = 50;
  let y = TEXT_BOTTOM_Y;
  if (s.position === 'top') y = TEXT_TOP_Y;
  else if (s.position === 'center') y = 50;
  else if (s.position === 'custom') {
    x = clamp(s.x ?? 50, 0, 100, 50);
    y = clamp(s.y ?? 50, 0, 100, 50);
  }

  return {
    fontSize: clamp(s.fontSize, TEXT_MIN_FONT, TEXT_MAX_FONT, 36),
    color: isHexColor(s.color) ? s.color.toLowerCase() : '#ffffff',
    box,
    boxColor,
    boxOpacity,
    outlineColor: isHexColor(s.outlineColor) ? s.outlineColor.toLowerCase() : '#000000',
    outlineWidth: clamp(s.outlineWidth ?? 0, 0, TEXT_MAX_OUTLINE, 0),
    shadow: !!s.shadow,
    uppercase: !!s.uppercase,
    x,
    y,
  };
}

function resolveBox(s: TimelineItemTextStyle): [TextBoxStyle, string, number] {
  if (s.boxStyle) {
    const box: TextBoxStyle = s.boxStyle === 'box' || s.boxStyle === 'band' ? s.boxStyle : 'none';
    return [box, isHexColor(s.boxColor) ? s.boxColor.toLowerCase() : '#000000', clamp(s.boxOpacity ?? 0.6, 0, 1, 0.6)];
  }
  // Items saved before plates had their own fields: the three CSS colours the old buttons set.
  const css = (s.backgroundColor ?? '').trim();
  if (!css || css === 'transparent' || css === 'none') return ['none', '#000000', 0];
  if (isHexColor(css)) return ['box', css.toLowerCase(), 1];
  const m = RGBA.exec(css);
  if (m) {
    const hex = [m[1], m[2], m[3]].map((v) => Math.min(255, Number(v)).toString(16).padStart(2, '0')).join('');
    return ['box', `#${hex}`, m[4] !== undefined ? clamp(Number(m[4]), 0, 1, 1) : 1];
  }
  return ['box', '#000000', 0.6];
}

/** Characters that fit across the frame at this size. */
export function maxCharsPerLine(fontSize: number, frameWidth: number, frameHeight: number): number {
  const size = clamp(fontSize, TEXT_MIN_FONT, TEXT_MAX_FONT, 36);
  const widthInReference = (frameWidth / Math.min(frameWidth, frameHeight)) * TEXT_REFERENCE_SHORT_SIDE;
  return Math.max(4, Math.floor((USABLE_WIDTH * widthInReference) / (CHAR_WIDTH * size)));
}

/** The lines the export will draw: explicit breaks kept, long lines wrapped at words. */
export function wrapText(text: string, fontSize: number, frameWidth: number, frameHeight: number): string[] {
  if (!text || !text.trim() || frameWidth <= 0 || frameHeight <= 0) return [];

  const limit = maxCharsPerLine(fontSize, frameWidth, frameHeight);
  const lines: string[] = [];
  const clipped = text.length > TEXT_MAX_CHARS ? text.slice(0, TEXT_MAX_CHARS) : text;

  for (const paragraph of clipped.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')) {
    let current = '';
    for (const word of paragraph.split(' ').filter((w) => w.length > 0)) {
      let rest = word;
      while (rest.length > limit) {
        if (current.length > 0) { lines.push(current); current = ''; }
        lines.push(rest.slice(0, limit));
        rest = rest.slice(limit);
      }
      if (rest.length === 0) continue;
      if (current.length === 0) current = rest;
      else if (current.length + 1 + rest.length <= limit) current += ' ' + rest;
      else { lines.push(current); current = rest; }
    }
    lines.push(current);
  }

  while (lines.length > 0 && lines[lines.length - 1].length === 0) lines.pop();
  while (lines.length > 0 && lines[0].length === 0) lines.shift();
  return lines.slice(0, TEXT_MAX_LINES);
}

/** `#rrggbb` + opacity as a CSS colour. */
export function hexToRgba(hex: string, opacity: number): string {
  const h = isHexColor(hex) ? hex.slice(1) : '000000';
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return `rgba(${r},${g},${b},${Math.min(1, Math.max(0, opacity))})`;
}

// --- designs ------------------------------------------------------------------

/** A ready-made look for a text overlay. Changes how it looks, never where it is. */
export interface TextDesign {
  id: string;
  label: string;
  style: Partial<TimelineItemTextStyle>;
}

export const TEXT_DESIGNS: TextDesign[] = [
  { id: 'caption', label: 'Caption', style: { color: '#ffffff', boxStyle: 'box', boxColor: '#000000', boxOpacity: 0.6, outlineWidth: 0, shadow: false, uppercase: false } },
  { id: 'outline', label: 'Bold outline', style: { color: '#ffffff', boxStyle: 'none', outlineColor: '#000000', outlineWidth: 2.5, shadow: true, uppercase: false } },
  { id: 'punch', label: 'Yellow punch', style: { color: '#ffd400', boxStyle: 'none', outlineColor: '#000000', outlineWidth: 2.5, shadow: false, uppercase: true } },
  { id: 'headline', label: 'Headline band', style: { color: '#ffffff', boxStyle: 'band', boxColor: '#e11d48', boxOpacity: 1, outlineWidth: 0, shadow: false, uppercase: true } },
  { id: 'news', label: 'News strip', style: { color: '#ffffff', boxStyle: 'band', boxColor: '#1d4ed8', boxOpacity: 0.95, outlineWidth: 0, shadow: false, uppercase: false } },
  { id: 'paper', label: 'Paper', style: { color: '#111827', boxStyle: 'box', boxColor: '#ffffff', boxOpacity: 0.92, outlineWidth: 0, shadow: false, uppercase: false } },
  { id: 'neon', label: 'Neon', style: { color: '#22d3ee', boxStyle: 'none', outlineColor: '#0b1020', outlineWidth: 1.5, shadow: true, uppercase: true } },
  { id: 'minimal', label: 'Minimal', style: { color: '#ffffff', boxStyle: 'none', outlineWidth: 0, shadow: true, uppercase: false } },
];

// --- frame layout (Shorts bars) ----------------------------------------------------

/**
 * Everything drawn on the frame for the video as a whole, on top of the clips: how the bars
 * around a clip are filled ('auto' leaves it to Framing & Aspect Fit), any number of text
 * layers and images placed anywhere on it, and timed subtitles.
 */
export interface FrameLayout {
  bars: 'auto' | 'blur' | 'color';
  barColor: string;
  texts: FrameText[];
  images: FrameImage[];
  subtitles: FrameSubtitles;
}

/** A time window on the finished video; null on either end runs from the start / to the end. */
export interface FrameTiming {
  start?: number | null;
  end?: number | null;
}

export interface FrameText extends FrameTiming {
  id: string;
  /** What the panel calls it - "Headline", "Caption", "Text 3". */
  label: string;
  text: string;
  style: TimelineItemTextStyle;
}

/** A crop on the source, in percent cut from each edge. */
export interface FrameCrop {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export const NO_CROP: FrameCrop = { left: 0, top: 0, right: 0, bottom: 0 };

/** How a layer arrives and leaves. */
export interface FrameMotion {
  animIn: OverlayMotion;
  animInDuration: number;
  animOut: OverlayMotion;
  animOutDuration: number;
}

/**
 * A logo, sticker, picture or video placed on the frame - cut to a crop and a shape, with
 * an optional ring, brought in and out with its own animation.
 */
export interface FrameImage extends FrameTiming, FrameMotion {
  id: string;
  /** 'video' plays a clip picture-in-picture; older drafts have no kind and are images. */
  kind: 'image' | 'video';
  assetId: string;
  name: string;
  /** Centre, in percent of the frame. */
  x: number;
  y: number;
  /** Width in percent of the frame width; the height follows the (cropped) picture's shape. */
  width: number;
  /** 0-1. */
  opacity: number;
  crop: FrameCrop;
  shape: OverlayShape;
  /** Ring width in 360-reference pixels; 0 for none. */
  borderWidth: number;
  borderColor: string;
  /**
   * Width / height of the SOURCE in pixels, measured when it was added or cropped; with the
   * crop it gives the layer's shape. Null until measured.
   */
  sourceAspect: number | null;
  /** Video only: where in the clip to start playing, in seconds. */
  trimStart: number;
}

/** One subtitle line and when it is on screen, in seconds on the finished video. */
export interface SubtitleCue {
  id: string;
  start: number;
  end: number;
  text: string;
}

/** Every cue shares one style, so a whole video's captions restyle in one go. */
export interface FrameSubtitles {
  style: TimelineItemTextStyle;
  cues: SubtitleCue[];
}

export const FRAME_TOP_Y = 15;
export const FRAME_BOTTOM_Y = 85;
/** Where subtitles sit by default: above a Short's caption bar and the app's own buttons. */
export const SUBTITLE_Y = 70;

export const MAX_FRAME_TEXTS = 10;
/** Pictures and videos together. Each video is one more decoder in the export. */
export const MAX_FRAME_IMAGES = 12;
/** Below the server's ceiling on text overlays (TextOverlayLayout.MaxOverlays), leaving room for titles. */
export const MAX_SUBTITLE_CUES = 380;
export const MIN_CUE_SECONDS = 0.2;
export const FRAME_IMAGE_MIN_WIDTH = 3;
export const FRAME_IMAGE_MAX_WIDTH = 100;
/** Most a crop may take off one edge, in percent; leaves at least 1% of the source. */
export const MAX_CROP_EDGE = 49.5;

export function newLayerId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/** New layers arrive with a little life; subtitles cut, since they change every second. */
export const DEFAULT_LAYER_MOTION: FrameMotion = { animIn: 'fade', animInDuration: 0.5, animOut: 'fade', animOutDuration: 0.4 };

function frameStyle(
  y: number, fontSize: number, look: Partial<TimelineItemTextStyle>,
  motion: [OverlayMotion, OverlayMotion] = ['none', 'none'],
): TimelineItemTextStyle {
  return {
    ...DEFAULT_TEXT_STYLE,
    boxStyle: 'none',
    fontSize,
    ...look,
    position: 'custom',
    x: 50,
    y,
    transitionIn: motion[0] as TimelineItemTextStyle['transitionIn'],
    transitionInDuration: 0.5,
    transitionOut: motion[1] as TimelineItemTextStyle['transitionOut'],
    transitionOutDuration: 0.4,
  };
}

export function defaultSubtitleStyle(): TimelineItemTextStyle {
  return frameStyle(SUBTITLE_Y, 22, {
    color: '#ffffff', boxStyle: 'none', outlineColor: '#000000', outlineWidth: 2.5, shadow: true,
  });
}

/** A new text layer: the first two are the familiar headline and caption slots. */
export function newFrameText(existing: FrameText[]): FrameText {
  const n = existing.length;
  if (n === 0) {
    return { id: newLayerId('ft'), label: 'Headline', text: '', style: frameStyle(FRAME_TOP_Y, 26, { color: '#ffffff', uppercase: true }, ['slide-down', 'fade']) };
  }
  if (n === 1) {
    return { id: newLayerId('ft'), label: 'Caption', text: '', style: frameStyle(FRAME_BOTTOM_Y, 20, { color: '#ffffff' }, ['slide-up', 'fade']) };
  }
  return {
    id: newLayerId('ft'),
    label: `Text ${n + 1}`,
    text: '',
    style: frameStyle(50, 22, { color: '#ffffff', outlineColor: '#000000', outlineWidth: 2, shadow: true }, ['fade', 'fade']),
  };
}

export function defaultFrameLayout(): FrameLayout {
  const top = newFrameText([]);
  return {
    bars: 'auto',
    barColor: '#111827',
    texts: [top, newFrameText([top])],
    images: [],
    subtitles: { style: defaultSubtitleStyle(), cues: [] },
  };
}

/** Whether a layer with this timing is on screen at `t`, on a video `duration` long. */
export function isLayerActive(timing: FrameTiming, t: number, duration: number): boolean {
  const [start, end] = layerWindow(timing, duration);
  return t >= start && t < end;
}

/** The window a layer occupies, held inside the video. */
export function layerWindow(timing: FrameTiming, duration: number): [number, number] {
  const start = Math.max(0, Math.min(duration, timing.start ?? 0));
  const end = Math.max(start, Math.min(duration, timing.end ?? duration));
  return [start, end];
}

/** A whole look for a Short: bar colour plus the headline and caption styles. */
export interface FrameDesign {
  id: string;
  label: string;
  bars: 'blur' | 'color';
  barColor: string;
  top: Partial<TimelineItemTextStyle>;
  bottom: Partial<TimelineItemTextStyle>;
  topSize: number;
  bottomSize: number;
}

export const FRAME_DESIGNS: FrameDesign[] = [
  {
    id: 'midnight', label: 'Midnight', bars: 'color', barColor: '#0f172a', topSize: 26, bottomSize: 20,
    top: { color: '#ffffff', boxStyle: 'none', uppercase: true, outlineWidth: 0, shadow: false },
    bottom: { color: '#facc15', boxStyle: 'none', uppercase: false, outlineWidth: 0, shadow: false },
  },
  {
    id: 'headline', label: 'Headline', bars: 'color', barColor: '#000000', topSize: 24, bottomSize: 20,
    top: { color: '#ffffff', boxStyle: 'band', boxColor: '#e11d48', boxOpacity: 1, uppercase: true, outlineWidth: 0, shadow: false },
    bottom: { color: '#ffffff', boxStyle: 'none', uppercase: false, outlineWidth: 0, shadow: false },
  },
  {
    id: 'meme', label: 'Meme', bars: 'color', barColor: '#ffffff', topSize: 28, bottomSize: 22,
    top: { color: '#000000', boxStyle: 'none', uppercase: true, outlineWidth: 0, shadow: false },
    bottom: { color: '#000000', boxStyle: 'none', uppercase: false, outlineWidth: 0, shadow: false },
  },
  {
    id: 'podcast', label: 'Podcast', bars: 'color', barColor: '#1e1b4b', topSize: 24, bottomSize: 18,
    top: { color: '#ffffff', boxStyle: 'box', boxColor: '#7c3aed', boxOpacity: 1, uppercase: true, outlineWidth: 0, shadow: false },
    bottom: { color: '#c4b5fd', boxStyle: 'none', uppercase: false, outlineWidth: 0, shadow: false },
  },
  {
    id: 'sunset', label: 'Sunset', bars: 'color', barColor: '#ea580c', topSize: 26, bottomSize: 20,
    top: { color: '#ffffff', boxStyle: 'none', uppercase: true, outlineColor: '#7c2d12', outlineWidth: 1.5, shadow: false },
    bottom: { color: '#fff7ed', boxStyle: 'none', uppercase: false, outlineWidth: 0, shadow: false },
  },
  {
    id: 'blur', label: 'Soft blur', bars: 'blur', barColor: '#111827', topSize: 26, bottomSize: 20,
    top: { color: '#ffffff', boxStyle: 'none', uppercase: true, outlineColor: '#000000', outlineWidth: 2.5, shadow: true },
    bottom: { color: '#ffffff', boxStyle: 'none', uppercase: false, outlineColor: '#000000', outlineWidth: 2, shadow: true },
  },
];

/**
 * Applies a design, keeping the user's words and where they put them. Text in the top half
 * takes the design's headline look, the rest its caption look; subtitles keep their own.
 */
export function applyFrameDesign(layout: FrameLayout, design: FrameDesign): FrameLayout {
  return {
    ...layout,
    bars: design.bars,
    barColor: design.barColor,
    texts: layout.texts.map((t) => {
      const upper = resolveTextLook(t.style).y < 50;
      return {
        ...t,
        style: { ...t.style, ...(upper ? design.top : design.bottom), fontSize: upper ? design.topSize : design.bottomSize },
      };
    }),
  };
}

// --- reading saved drafts ------------------------------------------------------------

function finiteOrNull(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : null;
}

function readTiming(raw: Partial<FrameTiming> | undefined): FrameTiming {
  return { start: finiteOrNull(raw?.start), end: finiteOrNull(raw?.end) };
}

function readText(raw: unknown, fallback: FrameText): FrameText {
  const t = (raw && typeof raw === 'object' ? raw : {}) as Partial<FrameText>;
  return {
    id: typeof t.id === 'string' && t.id ? t.id.slice(0, 64) : fallback.id,
    label: typeof t.label === 'string' && t.label ? t.label.slice(0, 40) : fallback.label,
    text: typeof t.text === 'string' ? t.text.slice(0, TEXT_MAX_CHARS) : fallback.text,
    style: t.style && typeof t.style === 'object' ? { ...fallback.style, ...t.style } : fallback.style,
    ...readTiming(t),
  };
}

const MOTIONS: readonly OverlayMotion[] = [
  'none', 'fade', 'slide-left', 'slide-right', 'slide-up', 'slide-down', 'zoom', 'zoom-in', 'zoom-out', 'pop',
];

export function readMotion(value: unknown, fallback: OverlayMotion): OverlayMotion {
  return typeof value === 'string' && (MOTIONS as readonly string[]).includes(value) ? (value as OverlayMotion) : fallback;
}

export function readCrop(raw: unknown): FrameCrop {
  const c = (raw && typeof raw === 'object' ? raw : {}) as Partial<FrameCrop>;
  return {
    left: clamp(c.left, 0, MAX_CROP_EDGE, 0),
    top: clamp(c.top, 0, MAX_CROP_EDGE, 0),
    right: clamp(c.right, 0, MAX_CROP_EDGE, 0),
    bottom: clamp(c.bottom, 0, MAX_CROP_EDGE, 0),
  };
}

/** Width / height of a layer as drawn: the source's shape, less its crop. */
export function layerAspect(layer: Pick<FrameImage, 'crop' | 'sourceAspect'>): number | null {
  if (!layer.sourceAspect) return null;
  const w = 100 - layer.crop.left - layer.crop.right;
  const h = 100 - layer.crop.top - layer.crop.bottom;
  return h > 0 ? (layer.sourceAspect * w) / h : null;
}

function readImage(raw: unknown): FrameImage | null {
  if (!raw || typeof raw !== 'object') return null;
  const i = raw as Partial<FrameImage>;
  if (typeof i.assetId !== 'string' || !i.assetId) return null;
  // Drafts saved before animations had none: they keep cutting in and out.
  const saved = i.animIn !== undefined;
  return {
    id: typeof i.id === 'string' && i.id ? i.id.slice(0, 64) : newLayerId('fi'),
    kind: i.kind === 'video' ? 'video' : 'image',
    assetId: i.assetId.slice(0, 64),
    name: typeof i.name === 'string' ? i.name.slice(0, 120) : 'Image',
    x: clamp(i.x, 0, 100, 50),
    y: clamp(i.y, 0, 100, 50),
    width: clamp(i.width, FRAME_IMAGE_MIN_WIDTH, FRAME_IMAGE_MAX_WIDTH, 30),
    opacity: clamp(i.opacity, 0, 1, 1),
    crop: readCrop(i.crop),
    shape: i.shape === 'rounded' || i.shape === 'circle' ? i.shape : 'rect',
    borderWidth: clamp(i.borderWidth, 0, 24, 0),
    borderColor: isHexColor(i.borderColor) ? i.borderColor : '#ffffff',
    sourceAspect: typeof i.sourceAspect === 'number' && Number.isFinite(i.sourceAspect) && i.sourceAspect > 0
      ? Math.min(20, Math.max(0.05, i.sourceAspect)) : null,
    trimStart: clamp(i.trimStart, 0, 86400, 0),
    animIn: saved ? readMotion(i.animIn, 'none') : 'none',
    animInDuration: clamp(i.animInDuration, 0.1, MAX_MOTION_SECONDS, 0.5),
    animOut: saved ? readMotion(i.animOut, 'none') : 'none',
    animOutDuration: clamp(i.animOutDuration, 0.1, MAX_MOTION_SECONDS, 0.4),
    ...readTiming(i),
  };
}

function readCue(raw: unknown): SubtitleCue | null {
  if (!raw || typeof raw !== 'object') return null;
  const c = raw as Partial<SubtitleCue>;
  const start = finiteOrNull(c.start);
  const end = finiteOrNull(c.end);
  if (start === null || end === null || end - start < MIN_CUE_SECONDS / 2 || typeof c.text !== 'string') return null;
  return {
    id: typeof c.id === 'string' && c.id ? c.id.slice(0, 64) : newLayerId('sc'),
    start, end, text: c.text.slice(0, TEXT_MAX_CHARS),
  };
}

/**
 * A saved draft's layout, with anything missing or malformed replaced by the default.
 * Drafts saved before layers existed have a fixed `top` and `bottom`; they become the first
 * two text layers.
 */
export function readFrameLayout(raw: unknown): FrameLayout {
  const base = defaultFrameLayout();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<FrameLayout> & { top?: unknown; bottom?: unknown };

  let texts: FrameText[];
  if (Array.isArray(r.texts)) {
    texts = [];
    for (const t of r.texts.slice(0, MAX_FRAME_TEXTS)) texts.push(readText(t, newFrameText(texts)));
  } else {
    texts = [readText(r.top, base.texts[0]), readText(r.bottom, base.texts[1])];
  }

  const subs = (r.subtitles && typeof r.subtitles === 'object' ? r.subtitles : {}) as Partial<FrameSubtitles>;
  return {
    bars: r.bars === 'blur' || r.bars === 'color' ? r.bars : 'auto',
    barColor: isHexColor(r.barColor) ? r.barColor : base.barColor,
    texts,
    images: (Array.isArray(r.images) ? r.images : [])
      .slice(0, MAX_FRAME_IMAGES).map(readImage).filter((i): i is FrameImage => i !== null),
    subtitles: {
      style: subs.style && typeof subs.style === 'object' ? { ...base.subtitles.style, ...subs.style } : base.subtitles.style,
      cues: sortCues((Array.isArray(subs.cues) ? subs.cues : [])
        .slice(0, MAX_SUBTITLE_CUES).map(readCue).filter((c): c is SubtitleCue => c !== null)),
    },
  };
}

// --- subtitles -------------------------------------------------------------------------

export function sortCues(cues: SubtitleCue[]): SubtitleCue[] {
  return [...cues].sort((a, b) => a.start - b.start || a.end - b.end);
}

const CUE_TIME = /(?:(\d{1,2}):)?(\d{1,2}):(\d{1,2})(?:[.,](\d{1,3}))?/;

function parseCueTime(value: string): number | null {
  const m = CUE_TIME.exec(value.trim());
  if (!m) return null;
  const [, h, mm, ss, ms] = m;
  return (Number(h ?? 0) * 3600) + Number(mm) * 60 + Number(ss) + (ms ? Number(ms.padEnd(3, '0')) / 1000 : 0);
}

/**
 * Cues from an .srt or .vtt file's text. Styling tags (`<i>`, `{\an8}`) are dropped - the
 * export draws plain text - and so are cues with no words or no length.
 */
export function parseSubtitleFile(content: string): SubtitleCue[] {
  const cues: SubtitleCue[] = [];
  const blocks = content.replace(/^﻿/, '').replace(/\r\n?/g, '\n').split(/\n\s*\n/);
  for (const block of blocks) {
    const lines = block.split('\n');
    const timingAt = lines.findIndex((l) => l.includes('-->'));
    if (timingAt < 0) continue;
    const [from, to] = lines[timingAt].split('-->');
    const start = parseCueTime(from);
    // VTT puts cue settings after the end time ("00:01.000 align:start"); the regex skips them.
    const end = parseCueTime(to ?? '');
    const text = lines.slice(timingAt + 1)
      .map((l) => l.replace(/<[^>]*>/g, '').replace(/\{\\[^}]*\}/g, '').trim())
      .filter((l) => l.length > 0)
      .join('\n');
    if (start === null || end === null || end - start < MIN_CUE_SECONDS / 2 || !text) continue;
    cues.push({ id: newLayerId('sc'), start, end, text: text.slice(0, TEXT_MAX_CHARS) });
    if (cues.length >= MAX_SUBTITLE_CUES) break;
  }
  return sortCues(cues);
}

/**
 * Cues from a typed or pasted script, timed across [from, to]: split into short chunks of
 * at most `wordsPerCue` words (a sentence end always closes one), each given time in
 * proportion to its length - roughly how long it takes to say.
 */
export function cuesFromScript(script: string, from: number, to: number, wordsPerCue: number): SubtitleCue[] {
  const span = to - from;
  if (span <= 0) return [];
  const perCue = Math.max(1, Math.min(12, Math.round(wordsPerCue)));

  const chunks: string[] = [];
  for (const paragraph of script.replace(/\r\n?/g, '\n').split('\n')) {
    let current: string[] = [];
    for (const word of paragraph.split(/\s+/).filter((w) => w.length > 0)) {
      current.push(word);
      if (current.length >= perCue || /[.!?…]$/.test(word)) {
        chunks.push(current.join(' '));
        current = [];
      }
    }
    if (current.length > 0) chunks.push(current.join(' '));
  }
  const kept = chunks.slice(0, MAX_SUBTITLE_CUES);
  if (kept.length === 0) return [];

  // A little weight per cue, so one-word cues are not flashed past.
  const weight = (c: string) => c.length + 6;
  const total = kept.reduce((sum, c) => sum + weight(c), 0);
  const cues: SubtitleCue[] = [];
  let t = from;
  for (const chunk of kept) {
    const length = (weight(chunk) / total) * span;
    cues.push({ id: newLayerId('sc'), start: round2(t), end: round2(t + length), text: chunk });
    t += length;
  }
  return cues;
}

/** Cues as an .srt file, for a platform that wants captions as a sidecar too. */
export function cuesToSrt(cues: SubtitleCue[]): string {
  const stamp = (s: number) => {
    const ms = Math.round(s * 1000);
    const pad = (n: number, w = 2) => String(n).padStart(w, '0');
    return `${pad(Math.floor(ms / 3600000))}:${pad(Math.floor(ms / 60000) % 60)}:${pad(Math.floor(ms / 1000) % 60)},${pad(ms % 1000, 3)}`;
  };
  return sortCues(cues).map((c, i) => `${i + 1}\n${stamp(c.start)} --> ${stamp(c.end)}\n${c.text}\n`).join('\n');
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}
