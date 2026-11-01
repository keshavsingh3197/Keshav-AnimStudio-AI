import type {
  EndCardAnimation, OutroBody, OutroKind, WatermarkBody, WatermarkKind, WatermarkPosition,
} from '../../core/models/api.models';

/*
 * Pure helpers for the Branding pages: drafts, their conversion to and from the API bodies,
 * limits, contrast, chunk arithmetic and upload checks. Nothing here touches Angular or the
 * DOM, so every rule can be exercised on its own.
 */

// --- Drafts ---------------------------------------------------------------------------------

/** The watermark form. Opacity and shading are 0-1 fractions; size and margin are % of canvas height. */
export interface WatermarkDraft {
  kind: WatermarkKind;
  text: string;
  logoAssetId: string;
  position: WatermarkPosition;
  opacity: number;
  height: number;
  margin: number;
  color: string;
  backplate: number;
}

export interface OutroDraft {
  kind: OutroKind;
  assetId: string;
  durationSeconds: number;
  transition: string;
  transitionDurationFrames: number;
  qrAssetId: string;
  headline: string;
  subtext: string;
  headlineSecondary: string;
  subtextSecondary: string;
  backgroundHex: string;
  textHex: string;
  animation: EndCardAnimation;
}

export interface ChunkDraft {
  chunkSeconds: number;
  imageSeconds: number;
}

// --- Limits (what the server clamps or rejects) ---------------------------------------------

export const WM_LIMITS = {
  opacity: { min: 15, max: 100 },
  height: { min: 2, max: 20 },
  margin: { min: 0, max: 20 },
  backplate: { min: 0, max: 100 },
  textMax: 200,
} as const;

export const OUTRO_LIMITS = {
  duration: { min: 1, max: 30 },
  fadeSeconds: { min: 0, max: 4 },
  headlineMax: 80,
  subtextMax: 120,
  /** The end card renders at 30 fps, which is what turns frames into seconds. */
  fps: 30,
} as const;

export const CHUNK_LIMITS = {
  chunk: { min: 1, max: 600, sliderMin: 3, sliderMax: 180 },
  image: { min: 0.5, max: 120 },
} as const;

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

// --- Defaults and conversion ------------------------------------------------------------------

export const DEFAULT_WATERMARK_STYLE = {
  position: 'TopRight' as WatermarkPosition,
  opacity: 0.8,
  height: 5.5,
  margin: 4,
  color: '#ffffff',
  backplate: 0.3,
};

export function blankWatermarkDraft(): WatermarkDraft {
  return { kind: 'None', text: '', logoAssetId: '', ...DEFAULT_WATERMARK_STYLE };
}

export function watermarkDraftFromBody(wm: WatermarkBody | null | undefined): WatermarkDraft {
  if (!wm) return blankWatermarkDraft();
  return {
    kind: (wm.kind as WatermarkKind) ?? 'None',
    text: wm.text ?? '',
    logoAssetId: wm.logoAssetId ?? '',
    position: (wm.position as WatermarkPosition) ?? 'TopRight',
    opacity: wm.opacity ?? 0.8,
    height: Math.round((wm.heightFraction ?? 0.055) * 1000) / 10,
    margin: Math.round((wm.marginFraction ?? 0.04) * 1000) / 10,
    color: wm.colorHex ?? '#ffffff',
    backplate: wm.backplateOpacity ?? 0.3,
  };
}

/** What a save sends. */
export function watermarkBodyFromDraft(d: WatermarkDraft): WatermarkBody {
  return {
    kind: d.kind,
    text: d.text.trim() || null,
    logoAssetId: d.logoAssetId || null,
    position: d.position,
    opacity: d.opacity,
    heightFraction: d.height / 100,
    marginFraction: d.margin / 100,
    colorHex: d.color,
    backplateOpacity: d.backplate,
  };
}

export function blankOutroDraft(): OutroDraft {
  return {
    kind: 'None',
    assetId: '',
    durationSeconds: 4,
    transition: 'Fade',
    transitionDurationFrames: 15,
    qrAssetId: '',
    headline: 'Support us for more videos like this',
    subtext: 'Scan the QR code',
    headlineSecondary: '',
    subtextSecondary: '',
    backgroundHex: '#101828',
    textHex: '#FFFFFF',
    animation: 'Rise',
  };
}

export function outroDraftFromBody(o: OutroBody | null | undefined): OutroDraft {
  if (!o) return blankOutroDraft();
  return {
    kind: (o.kind as OutroKind) ?? 'None',
    assetId: o.assetId ?? '',
    durationSeconds: o.durationSeconds || 4,
    transition: o.transition || 'Fade',
    // `??`, not `||`: 0 frames is a legitimate "no fade" and must survive a reload.
    transitionDurationFrames: o.transitionDurationFrames ?? 15,
    qrAssetId: o.qrAssetId ?? '',
    headline: o.headline ?? '',
    subtext: o.subtext ?? '',
    headlineSecondary: o.headlineSecondary ?? '',
    subtextSecondary: o.subtextSecondary ?? '',
    backgroundHex: o.backgroundHex || '#101828',
    textHex: o.textHex || '#FFFFFF',
    animation: (o.animation ?? 'Rise') as EndCardAnimation,
  };
}

/** What a save (and the exact-render preview) sends. */
export function outroBodyFromDraft(d: OutroDraft): OutroBody {
  return {
    kind: d.kind,
    assetId: d.assetId || null,
    durationSeconds: d.durationSeconds,
    transition: d.transition,
    transitionDurationFrames: d.transitionDurationFrames,
    qrAssetId: d.qrAssetId || null,
    headline: d.headline?.trim() || null,
    subtext: d.subtext?.trim() || null,
    headlineSecondary: d.headlineSecondary?.trim() || null,
    subtextSecondary: d.subtextSecondary?.trim() || null,
    backgroundHex: d.backgroundHex,
    textHex: d.textHex,
    animation: d.animation,
  };
}

// --- Numbers and text -----------------------------------------------------------------------

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function round(value: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round(value * f) / f;
}

/** "5.5", "4", "0.5": no trailing zeros. */
export function trimNumber(value: number, decimals = 1): string {
  return String(round(value, decimals));
}

export function percent(fraction: number): string {
  return `${Math.round(fraction * 100)}%`;
}

/** 45 -> "45 s", 90 -> "1 min 30 s", 600 -> "10 min", 3900 -> "1 h 5 min". */
export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds)) return '-';
  const s = Math.max(0, seconds);
  if (s < 60) return `${trimNumber(s)} s`;
  if (s < 3600) {
    const m = Math.floor(s / 60);
    const rest = Math.round(s - m * 60);
    return rest ? `${m} min ${rest} s` : `${m} min`;
  }
  const h = Math.floor(s / 3600);
  const m = Math.round((s - h * 3600) / 60);
  return m ? `${h} h ${m} min` : `${h} h`;
}

/** Accepts "#abc", "#aabbcc" or "aabbcc"; returns "#aabbcc" or null. */
export function normalizeHex(value: string | null | undefined): string | null {
  if (!value) return null;
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value.trim());
  if (!m) return null;
  let hex = m[1].toLowerCase();
  if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
  return `#${hex}`;
}

const SCRIPTS: readonly (readonly [RegExp, string])[] = [
  [/[\u0900-\u097F]/, 'hi'], [/[\u0980-\u09FF]/, 'bn'], [/[\u0A00-\u0A7F]/, 'pa'], [/[\u0A80-\u0AFF]/, 'gu'],
  [/[\u0B80-\u0BFF]/, 'ta'], [/[\u0C00-\u0C7F]/, 'te'], [/[\u0C80-\u0CFF]/, 'kn'], [/[\u0D00-\u0D7F]/, 'ml'],
];

/** A language tag for a line of Indian-script text, so the browser picks a font that has its letters. */
export function scriptLang(text: string | null | undefined): string | null {
  if (!text) return null;
  for (const [pattern, lang] of SCRIPTS) if (pattern.test(text)) return lang;
  return null;
}

// --- Field specs: what changed between two drafts ------------------------------------------

export interface FieldSpec<D> {
  readonly key: string;
  readonly label: string;
  /** A comparable, normalised value: equal values are "unchanged". */
  readonly value: (d: D) => string | number | boolean;
  /** The value as a person would read it. */
  readonly format: (d: D) => string;
  /** False when the field does not matter for this draft (a text colour on a logo mark). */
  readonly relevant: (d: D) => boolean;
}

export interface FieldChange {
  readonly key: string;
  readonly label: string;
  readonly from: string;
  readonly to: string;
}

function field<D>(
  key: string, label: string, value: (d: D) => string | number | boolean,
  format: (d: D) => string = (d) => String(value(d)), relevant: (d: D) => boolean = () => true,
): FieldSpec<D> {
  return { key, label, value, format, relevant };
}

export function diffDrafts<D>(specs: readonly FieldSpec<D>[], from: D, to: D): FieldChange[] {
  const changes: FieldChange[] = [];
  for (const spec of specs) {
    const inFrom = spec.relevant(from);
    const inTo = spec.relevant(to);
    if (!inFrom && !inTo) continue;
    if (spec.value(from) === spec.value(to)) continue;
    changes.push({
      key: spec.key,
      label: spec.label,
      from: inFrom ? spec.format(from) : '-',
      to: inTo ? spec.format(to) : '-',
    });
  }
  return changes;
}

/** "Position, Opacity, Size +2 more". */
export function summarizeChanges(changes: readonly { label: string }[], max = 3): string {
  const labels = changes.map((c) => c.label);
  if (labels.length <= max) return labels.join(', ');
  return `${labels.slice(0, max).join(', ')} +${labels.length - max} more`;
}

// --- Watermark ----------------------------------------------------------------------------------

export const WATERMARK_KIND_LABEL: Record<WatermarkKind, string> = {
  None: 'No watermark', Text: 'Text mark', Logo: 'Logo',
};

export const POSITION_LABEL: Record<WatermarkPosition, string> = {
  TopLeft: 'Top left', TopCenter: 'Top centre', TopRight: 'Top right',
  BottomLeft: 'Bottom left', BottomCenter: 'Bottom centre', BottomRight: 'Bottom right',
};

export const POSITION_ARROW: Record<WatermarkPosition, string> = {
  TopLeft: '\u2196', TopCenter: '\u2191', TopRight: '\u2197',
  BottomLeft: '\u2199', BottomCenter: '\u2193', BottomRight: '\u2198',
};

/** The 3x3 picker. The middle row stays empty on purpose: the server has no centre positions. */
export const POSITION_GRID: readonly (readonly (WatermarkPosition | null)[])[] = [
  ['TopLeft', 'TopCenter', 'TopRight'],
  [null, null, null],
  ['BottomLeft', 'BottomCenter', 'BottomRight'],
];

const COLUMNS = ['Left', 'Center', 'Right'] as const;

function split(position: WatermarkPosition): { row: 'Top' | 'Bottom'; col: number } {
  const row = position.startsWith('Top') ? 'Top' : 'Bottom';
  const col = COLUMNS.findIndex((c) => position.endsWith(c));
  return { row, col: col < 0 ? 1 : col };
}

function join(row: 'Top' | 'Bottom', col: number): WatermarkPosition {
  return `${row}${COLUMNS[clamp(col, 0, 2)]}` as WatermarkPosition;
}

/** The anchor a pointer over the frame (x, y in 0..1) snaps to: thirds across, halves down. */
export function nearestPosition(x: number, y: number): WatermarkPosition {
  const col = x < 1 / 3 ? 0 : x < 2 / 3 ? 1 : 2;
  return join(y < 0.5 ? 'Top' : 'Bottom', col);
}

export function stepPosition(position: WatermarkPosition, direction: 'left' | 'right' | 'up' | 'down'): WatermarkPosition {
  const { row, col } = split(position);
  switch (direction) {
    case 'left': return join(row, col - 1);
    case 'right': return join(row, col + 1);
    case 'up': return join('Top', col);
    default: return join('Bottom', col);
  }
}

export interface Aspect {
  readonly label: string;
  readonly width: number;
  readonly height: number;
}

export const PREVIEW_ASPECTS: readonly Aspect[] = [
  { label: '16:9', width: 1920, height: 1080 },
  { label: '9:16', width: 1080, height: 1920 },
  { label: '1:1', width: 1080, height: 1080 },
  { label: '4:5', width: 1080, height: 1350 },
];

/**
 * The inset the renderer really uses, in % of canvas height: the margin setting, raised on
 * an upright canvas to the mobile safe margin (at least 32 px, or 5% of the width).
 * Mirrors `watermarkMarkStyle`, so the guide is drawn where the mark's edge will be.
 */
export function effectiveInsetPct(marginPct: number, canvasWidth: number, canvasHeight: number): number {
  let inset = Math.max(0, marginPct);
  if (canvasHeight > canvasWidth) {
    const safePx = Math.max(32, Math.round(canvasWidth * 0.05));
    inset = Math.max(inset, (safePx / canvasHeight) * 100);
  }
  return inset;
}

/** Rough areas of the frame that a player or app draws over (percent of the frame). Guides, not guarantees. */
export interface UiZones {
  readonly top: number;
  readonly bottom: number;
  readonly right: { readonly width: number; readonly from: number; readonly to: number } | null;
}

export function uiZones(aspect: Aspect): UiZones {
  if (aspect.height > aspect.width * 1.5) return { top: 9, bottom: 22, right: { width: 14, from: 42, to: 80 } };
  if (aspect.height > aspect.width) return { top: 0, bottom: 14, right: null };
  if (aspect.height === aspect.width) return { top: 0, bottom: 12, right: null };
  return { top: 0, bottom: 10, right: null };
}

/** A one-line heads-up about where a mark sits, or null when there is nothing to say. */
export function placementHint(position: WatermarkPosition, aspect: Aspect): string | null {
  if (position.startsWith('Bottom')) {
    return aspect.height > aspect.width
      ? 'Bottom marks can be hidden behind the title, captions and buttons of a vertical feed.'
      : 'Bottom marks can sit under the player controls and captions.';
  }
  return null;
}

// --- Contrast ----------------------------------------------------------------------------------

export type Rgb = readonly [number, number, number];

export function parseRgb(hex: string | null | undefined): Rgb | null {
  const n = normalizeHex(hex);
  if (!n) return null;
  const v = parseInt(n.slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

function linear(channel: number): number {
  const s = channel / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function luminance(c: Rgb): number {
  return 0.2126 * linear(c[0]) + 0.7152 * linear(c[1]) + 0.0722 * linear(c[2]);
}

/** WCAG contrast ratio, 1 (identical) to 21 (black on white). */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

function blend(top: Rgb, bottom: Rgb, alpha: number): Rgb {
  return [
    top[0] * alpha + bottom[0] * (1 - alpha),
    top[1] * alpha + bottom[1] * (1 - alpha),
    top[2] * alpha + bottom[2] * (1 - alpha),
  ];
}

/** Backdrops a mark is tested on: a dark scene, a mid-grey one and a very bright one. */
export const CONTRAST_BACKDROPS = { dark: 24, mid: 128, bright: 232 } as const;

/**
 * Contrast of a text mark over a flat picture of the given grey (0-255), the way ffmpeg draws it:
 * a black plate at `backplate` over the picture, the text at `opacity` over the plate.
 */
export function markContrast(color: string, opacity: number, backplate: number, grey: number): number {
  const picture: Rgb = [grey, grey, grey];
  const plate = blend([0, 0, 0], picture, backplate);
  const ink = blend(parseRgb(color) ?? [255, 255, 255], plate, opacity);
  return contrastRatio(ink, plate);
}

export type ContrastVerdict = 'good' | 'fair' | 'poor';

export interface ContrastReport {
  readonly dark: number;
  readonly mid: number;
  readonly bright: number;
  readonly worst: number;
  readonly verdict: ContrastVerdict;
}

export function textMarkContrast(color: string, opacity: number, backplate: number): ContrastReport {
  const dark = markContrast(color, opacity, backplate, CONTRAST_BACKDROPS.dark);
  const mid = markContrast(color, opacity, backplate, CONTRAST_BACKDROPS.mid);
  const bright = markContrast(color, opacity, backplate, CONTRAST_BACKDROPS.bright);
  const worst = Math.min(dark, mid, bright);
  return { dark, mid, bright, worst, verdict: worst >= 3 ? 'good' : worst >= 1.8 ? 'fair' : 'poor' };
}

/** The lightest shading (steps of 5%) that makes the mark read on every backdrop, or null if none does. */
export function suggestBackplate(color: string, opacity: number): number | null {
  for (let step = 0; step <= 20; step++) {
    const backplate = step * 0.05;
    if (textMarkContrast(color, opacity, backplate).worst >= 3) return round(backplate, 2);
  }
  return null;
}

// --- Field specs, per draft ------------------------------------------------------------------

const wmOn = (d: WatermarkDraft) => d.kind !== 'None';

export const WATERMARK_FIELDS: readonly FieldSpec<WatermarkDraft>[] = [
  field('kind', 'Style', (d) => d.kind, (d) => WATERMARK_KIND_LABEL[d.kind]),
  field('text', 'Text', (d) => d.text.trim(), (d) => d.text.trim() || '(empty)', (d) => d.kind === 'Text'),
  field('logoAssetId', 'Logo', (d) => d.logoAssetId, (d) => (d.logoAssetId ? 'Logo image' : 'No logo'), (d) => d.kind === 'Logo'),
  field('position', 'Position', (d) => d.position, (d) => POSITION_LABEL[d.position], wmOn),
  field('opacity', 'Opacity', (d) => round(d.opacity, 2), (d) => percent(d.opacity), wmOn),
  field('height', 'Size', (d) => round(d.height, 1), (d) => `${trimNumber(d.height)}% of height`, wmOn),
  field('margin', 'Margin', (d) => round(d.margin, 1), (d) => `${trimNumber(d.margin)}% of height`, wmOn),
  field('color', 'Colour', (d) => d.color.toLowerCase(), (d) => d.color.toUpperCase(), (d) => d.kind === 'Text'),
  field('backplate', 'Shading', (d) => round(d.backplate, 2), (d) => percent(d.backplate), (d) => d.kind === 'Text'),
];

export const OUTRO_KIND_LABEL: Record<OutroKind, string> = {
  None: 'No end card', Video: 'Bumper video', Image: 'End graphic', Card: 'Support card',
};

export const TRANSITION_LABEL: Record<string, string> = {
  Fade: 'Fade', Dissolve: 'Dissolve', None: 'Hard cut', WipeLeft: 'Wipe left', WipeRight: 'Wipe right',
};

export function transitionLabel(value: string): string {
  return TRANSITION_LABEL[value] ?? value;
}

export function framesToSeconds(frames: number): number {
  return frames / OUTRO_LIMITS.fps;
}

export function secondsToFrames(seconds: number): number {
  return clamp(Math.round(seconds * OUTRO_LIMITS.fps), 0, 120);
}

const hasMedia = (d: OutroDraft) => d.kind === 'Video' || d.kind === 'Image';
const isCard = (d: OutroDraft) => d.kind === 'Card';

export const OUTRO_FIELDS: readonly FieldSpec<OutroDraft>[] = [
  field('kind', 'Type', (d) => d.kind, (d) => OUTRO_KIND_LABEL[d.kind]),
  field('assetId', 'Media file', (d) => d.assetId, (d) => (d.assetId ? 'Uploaded file' : 'None'), hasMedia),
  field('qrAssetId', 'QR code', (d) => d.qrAssetId, (d) => (d.qrAssetId ? 'QR image' : 'None'), isCard),
  field('headline', 'Headline', (d) => d.headline.trim(), (d) => d.headline.trim() || '(empty)', isCard),
  field('headlineSecondary', 'Second headline', (d) => d.headlineSecondary.trim(), (d) => d.headlineSecondary.trim() || '(empty)', isCard),
  field('subtext', 'Small text', (d) => d.subtext.trim(), (d) => d.subtext.trim() || '(empty)', isCard),
  field('subtextSecondary', 'Second small text', (d) => d.subtextSecondary.trim(), (d) => d.subtextSecondary.trim() || '(empty)', isCard),
  field('backgroundHex', 'Background', (d) => d.backgroundHex.toLowerCase(), (d) => d.backgroundHex.toUpperCase(), isCard),
  field('textHex', 'Text colour', (d) => d.textHex.toLowerCase(), (d) => d.textHex.toUpperCase(), isCard),
  field('animation', 'Animation', (d) => d.animation, (d) => (d.animation === 'Rise' ? 'Rise in' : 'All at once'), isCard),
  field('durationSeconds', 'Duration', (d) => round(d.durationSeconds, 1), (d) => `${trimNumber(d.durationSeconds)} s`, (d) => d.kind === 'Image' || d.kind === 'Card'),
  // A card only distinguishes "fades in" from "hard cut"; a bumper has a named transition.
  field('transition', 'Transition',
    (d) => (isCard(d) ? (d.transition === 'None' ? 'None' : 'Fade') : d.transition),
    (d) => (isCard(d) ? (d.transition === 'None' ? 'Hard cut' : 'Fade in') : transitionLabel(d.transition)),
    (d) => d.kind !== 'None'),
  field('transitionDurationFrames', 'Transition length', (d) => d.transitionDurationFrames,
    (d) => `${trimNumber(framesToSeconds(d.transitionDurationFrames), 2)} s`,
    (d) => d.kind !== 'None' && d.transition !== 'None'),
];

export const CHUNK_FIELDS: readonly FieldSpec<ChunkDraft>[] = [
  field('chunkSeconds', 'Clip length', (d) => round(d.chunkSeconds, 2), (d) => formatDuration(d.chunkSeconds)),
  field('imageSeconds', 'Image duration', (d) => round(d.imageSeconds, 2), (d) => formatDuration(d.imageSeconds)),
];

// --- Chunking --------------------------------------------------------------------------------------

export interface DurationPreset {
  readonly seconds: number;
  readonly note?: string;
  readonly shorts?: boolean;
  readonly recommended?: boolean;
}

export const CHUNK_PRESETS: readonly DurationPreset[] = [
  { seconds: 5, note: 'Rapid cuts' },
  { seconds: 10, note: 'Recommended', recommended: true },
  { seconds: 15, shorts: true },
  { seconds: 30, shorts: true },
  { seconds: 45, shorts: true },
  { seconds: 60, shorts: true, note: 'Longest classic Short' },
  { seconds: 120, note: 'Long clips' },
];

export const IMAGE_PRESETS: readonly number[] = [3, 5, 8, 10, 15];

export const CHUNK_EXAMPLES: readonly { seconds: number; label: string }[] = [
  { seconds: 60, label: '1 min' },
  { seconds: 300, label: '5 min' },
  { seconds: 600, label: '10 min' },
  { seconds: 1800, label: '30 min' },
  { seconds: 3600, label: '1 hour' },
];

export interface ChunkPlan {
  readonly count: number;
  /** Clips that are exactly the chosen length. */
  readonly fullClips: number;
  /** The final clip; equal to the chosen length when it divides evenly. */
  readonly lastSeconds: number;
  readonly tailIsShort: boolean;
}

/**
 * How a video of `totalSeconds` is cut: consecutive clips of `chunkSeconds`, the last one
 * keeping whatever is left (the server does not merge a short tail).
 */
export function chunkPlan(totalSeconds: number, chunkSeconds: number): ChunkPlan | null {
  if (!Number.isFinite(totalSeconds) || !Number.isFinite(chunkSeconds) || totalSeconds <= 0 || chunkSeconds <= 0) return null;
  const count = Math.max(1, Math.ceil(totalSeconds / chunkSeconds - 1e-9));
  const lastSeconds = totalSeconds - (count - 1) * chunkSeconds;
  const even = lastSeconds >= chunkSeconds - 1e-9;
  return {
    count,
    fullClips: even ? count : count - 1,
    lastSeconds: even ? chunkSeconds : lastSeconds,
    tailIsShort: !even && count > 1 && lastSeconds < Math.max(2, chunkSeconds * 0.25),
  };
}

export function validateChunkSeconds(value: number): string | null {
  const { min, max } = CHUNK_LIMITS.chunk;
  if (!Number.isFinite(value)) return 'Enter the clip length in seconds.';
  if (value < min || value > max) return `Clip length must be between ${min} and ${max} seconds.`;
  return null;
}

export function validateImageSeconds(value: number): string | null {
  const { min, max } = CHUNK_LIMITS.image;
  if (!Number.isFinite(value)) return 'Enter the image duration in seconds.';
  if (value < min || value > max) return `Image duration must be between ${min} and ${max} seconds.`;
  return null;
}

// --- Uploads -------------------------------------------------------------------------------------------

export type UploadKind = 'image' | 'video-or-image';

const IMAGE_EXT = ['.png', '.jpg', '.jpeg', '.webp'];
const VIDEO_EXT = ['.mp4', '.webm', '.mov'];
const IMAGE_MIME = ['image/png', 'image/jpeg', 'image/webp'];
const VIDEO_MIME = ['video/mp4', 'video/webm', 'video/quicktime'];

/**
 * A friendly first look at a file before it is sent. The server still decides: this only
 * spares a round trip (and a bare error) for the obvious mistakes.
 */
export function checkUpload(file: { name: string; type: string; size: number }, kind: UploadKind): string | null {
  if (file.size <= 0) return `"${file.name}" is empty.`;
  if (file.size > MAX_UPLOAD_BYTES) {
    return `"${file.name}" is ${round(file.size / (1024 * 1024), 1)} MB; the limit is ${MAX_UPLOAD_BYTES / (1024 * 1024)} MB.`;
  }
  const dot = file.name.lastIndexOf('.');
  const ext = dot < 0 ? '' : file.name.slice(dot).toLowerCase();
  const extensions = kind === 'image' ? IMAGE_EXT : [...IMAGE_EXT, ...VIDEO_EXT];
  const mimes = kind === 'image' ? IMAGE_MIME : [...IMAGE_MIME, ...VIDEO_MIME];
  const wrong = kind === 'image'
    ? `"${file.name}" is not a PNG, JPG or WEBP image.`
    : `"${file.name}" is not an MP4, WebM, MOV, PNG, JPG or WEBP file.`;
  if (!extensions.includes(ext)) return wrong;
  if (file.type && !mimes.includes(file.type.toLowerCase())) return wrong;
  return null;
}

/** Smallest side, in pixels, at which a QR code still scans reliably from a screen. */
export const QR_MIN_SIDE = 160;

export interface QrCheck {
  readonly tone: 'ok' | 'warn';
  readonly text: string;
}

export function checkQrSize(width: number, height: number): QrCheck {
  const side = Math.min(width, height);
  if (side < QR_MIN_SIDE) {
    return { tone: 'warn', text: `Only ${width}\u00d7${height} px: a phone may struggle to scan it from a screen. Use an image of ${QR_MIN_SIDE}px or more.` };
  }
  if (Math.abs(width - height) / Math.max(width, height) > 0.1) {
    return { tone: 'warn', text: `${width}\u00d7${height} px and not square. Crop it to just the code for the best result.` };
  }
  return { tone: 'ok', text: `${width}\u00d7${height} px, square.` };
}

// --- End card layout (mirrors EndCardFactory.Layout, in units of the short side / 100) ----

export interface EndCardLine {
  readonly role: 'headline' | 'headlineSecondary' | 'subtext' | 'subtextSecondary';
  readonly text: string;
  readonly sizeU: number;
  readonly secondary: boolean;
  readonly above: boolean;
}

export interface EndCardLayout {
  /** Which container axis is the short side: cqh on a landscape frame, cqw otherwise. */
  readonly unit: 'h' | 'w';
  readonly qrU: number;
  readonly gapU: number;
  readonly pairGapU: number;
  readonly lines: readonly EndCardLine[];
}

/** One line shrunk until it fits 90% of the frame width, like the renderer's FontFor. */
export function fitSizeU(text: string, preferredU: number, widthU: number): number {
  const glyphs = Math.max(1, [...text].length);
  return Math.max(2, Math.min(preferredU, (0.9 * widthU) / (glyphs * 0.56)));
}

export function endCardLayout(
  card: { headline: string; headlineSecondary: string; subtext: string; subtextSecondary: string },
  hasCode: boolean, width: number, height: number,
): EndCardLayout {
  const widthU = (width / Math.min(width, height)) * 100;
  const rows: { role: EndCardLine['role']; text: string; preferred: number; secondary: boolean; above: boolean }[] = [
    { role: 'headline', text: card.headline.trim(), preferred: 6.8, secondary: false, above: true },
    { role: 'headlineSecondary', text: card.headlineSecondary.trim(), preferred: 5.0, secondary: true, above: true },
    { role: 'subtext', text: card.subtext.trim(), preferred: 4.2, secondary: false, above: false },
    { role: 'subtextSecondary', text: card.subtextSecondary.trim(), preferred: 3.6, secondary: true, above: false },
  ];

  const sized = rows.filter((r) => r.text).map((r) => ({ ...r, size: fitSizeU(r.text, r.preferred, widthU) }));
  // A translation never outranks its original: capped at 80% of its partner's size.
  const lines: EndCardLine[] = sized.map((r) => {
    let size = r.size;
    if (r.secondary) {
      const primary = sized.find((p) => p.above === r.above && !p.secondary);
      if (primary) size = Math.min(size, primary.size * 0.8);
    }
    return { role: r.role, text: r.text, sizeU: size, secondary: r.secondary, above: r.above };
  });

  return {
    unit: width > height ? 'h' : 'w',
    qrU: hasCode ? (height > width ? 62 : 46) : 0,
    gapU: 4.5,
    pairGapU: 1.4,
    lines,
  };
}

// --- Preferences -----------------------------------------------------------------------------------

export type PreviewBackdrop = 'scene' | 'dark' | 'mid' | 'bright';
export type EndCardFormat = 'landscape' | 'vertical' | 'square';

export const BACKDROPS: readonly PreviewBackdrop[] = ['scene', 'dark', 'mid', 'bright'];

export const END_FORMATS: readonly { id: EndCardFormat; label: string; name: string; width: number; height: number }[] = [
  { id: 'landscape', label: '16:9', name: 'Landscape', width: 1920, height: 1080 },
  { id: 'vertical', label: '9:16', name: 'Shorts', width: 1080, height: 1920 },
  { id: 'square', label: '1:1', name: 'Square', width: 1080, height: 1080 },
];

export interface BrandingPrefs {
  aspect: string;
  guides: boolean;
  backdrop: PreviewBackdrop;
  endFormat: EndCardFormat;
}

export const PREFS_KEY = 'animstudio.branding.prefs';

export const DEFAULT_PREFS: BrandingPrefs = { aspect: '16:9', guides: true, backdrop: 'scene', endFormat: 'landscape' };

/** Reads stored UI preferences, ignoring anything that is not a known value. */
export function parsePrefs(raw: string | null | undefined): BrandingPrefs {
  const prefs: BrandingPrefs = { ...DEFAULT_PREFS };
  if (!raw) return prefs;
  try {
    const stored = JSON.parse(raw) as Record<string, unknown> | null;
    if (!stored || typeof stored !== 'object') return prefs;
    const aspect = stored['aspect'];
    if (typeof aspect === 'string' && PREVIEW_ASPECTS.some((a) => a.label === aspect)) prefs.aspect = aspect;
    if (typeof stored['guides'] === 'boolean') prefs.guides = stored['guides'];
    const backdrop = stored['backdrop'];
    if (typeof backdrop === 'string' && (BACKDROPS as readonly string[]).includes(backdrop)) prefs.backdrop = backdrop as PreviewBackdrop;
    const format = stored['endFormat'];
    if (typeof format === 'string' && END_FORMATS.some((f) => f.id === format)) prefs.endFormat = format as EndCardFormat;
  } catch {
    // Corrupt storage: fall back to the defaults.
  }
  return prefs;
}
