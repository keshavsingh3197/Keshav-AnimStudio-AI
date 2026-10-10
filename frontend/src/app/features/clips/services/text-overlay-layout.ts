import { TextBoxStyle, TimelineItemTextStyle } from '../../../core/models/api.models';

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
 * How the bars around a clip are filled - 'auto' leaves it to Framing & Aspect Fit - and
 * the two lines of text that sit on them for the whole video.
 */
export interface FrameLayout {
  bars: 'auto' | 'blur' | 'color';
  barColor: string;
  top: FrameText;
  bottom: FrameText;
}

export interface FrameText {
  text: string;
  style: TimelineItemTextStyle;
}

export const FRAME_TOP_Y = 15;
export const FRAME_BOTTOM_Y = 85;

function frameStyle(y: number, fontSize: number, look: Partial<TimelineItemTextStyle>): TimelineItemTextStyle {
  return {
    ...DEFAULT_TEXT_STYLE,
    boxStyle: 'none',
    fontSize,
    ...look,
    position: 'custom',
    x: 50,
    y,
    transitionIn: 'none',
    transitionOut: 'none',
  };
}

export function defaultFrameLayout(): FrameLayout {
  return {
    bars: 'auto',
    barColor: '#111827',
    top: { text: '', style: frameStyle(FRAME_TOP_Y, 26, { color: '#ffffff', uppercase: true }) },
    bottom: { text: '', style: frameStyle(FRAME_BOTTOM_Y, 20, { color: '#ffffff' }) },
  };
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

/** Applies a design, keeping the user's words and where they put them. */
export function applyFrameDesign(layout: FrameLayout, design: FrameDesign): FrameLayout {
  const keep = (t: FrameText, look: Partial<TimelineItemTextStyle>, size: number): FrameText => ({
    text: t.text,
    style: { ...t.style, ...look, fontSize: size },
  });
  return {
    bars: design.bars,
    barColor: design.barColor,
    top: keep(layout.top, design.top, design.topSize),
    bottom: keep(layout.bottom, design.bottom, design.bottomSize),
  };
}

/** A saved draft's layout, with anything missing or malformed replaced by the default. */
export function readFrameLayout(raw: unknown): FrameLayout {
  const base = defaultFrameLayout();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<FrameLayout>;
  const text = (t: Partial<FrameText> | undefined, fallback: FrameText): FrameText => ({
    text: typeof t?.text === 'string' ? t.text.slice(0, TEXT_MAX_CHARS) : fallback.text,
    style: t?.style && typeof t.style === 'object' ? { ...fallback.style, ...t.style } : fallback.style,
  });
  return {
    bars: r.bars === 'blur' || r.bars === 'color' ? r.bars : 'auto',
    barColor: isHexColor(r.barColor) ? r.barColor : base.barColor,
    top: text(r.top, base.top),
    bottom: text(r.bottom, base.bottom),
  };
}
