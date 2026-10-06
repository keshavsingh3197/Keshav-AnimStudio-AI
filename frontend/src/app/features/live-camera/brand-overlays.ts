import { encodeQr } from './qr-code';
import { SealFinish } from './studio-settings';

/**
 * Branding drawn over the program: a scannable QR card and an authenticity seal. The seal is
 * a generic design with the presenter's own words on it - it doesn't copy any official
 * hallmark or certification mark.
 */

type Ctx = CanvasRenderingContext2D;

/** Modules of the QR code drawn once, one pixel each, and scaled up crisply when drawn. */
export class QrSprite {
  private key = '';
  private canvas: HTMLCanvasElement | null = null;
  failed = false;

  get(text: string, dark: string, light: string): HTMLCanvasElement | null {
    const key = `${text}\u0000${dark}\u0000${light}`;
    if (key === this.key) return this.canvas;
    this.key = key;
    this.canvas = null;
    this.failed = false;
    if (!text) return null;
    try {
      const qr = encodeQr(text, 'M');
      const canvas = document.createElement('canvas');
      canvas.width = qr.size;
      canvas.height = qr.size;
      const c = canvas.getContext('2d')!;
      c.fillStyle = light;
      c.fillRect(0, 0, qr.size, qr.size);
      c.fillStyle = dark;
      for (let y = 0; y < qr.size; y++) for (let x = 0; x < qr.size; x++) if (qr.modules[y][x]) c.fillRect(x, y, 1, 1);
      this.canvas = canvas;
    } catch {
      this.failed = true;
    }
    return this.canvas;
  }
}

/**
 * Colours that a phone can scan: dark modules on a light ground with enough contrast.
 * Anything else falls back to black on white rather than putting an unscannable code on air.
 */
export function scannableColors(dark: string, light: string): { dark: string; light: string } {
  const ld = luminance(dark);
  const ll = luminance(light);
  return ll > ld && (ll + 0.05) / (ld + 0.05) >= 4 ? { dark, light } : { dark: '#000000', light: '#ffffff' };
}

function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const channel = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}

/** Width and height of the QR card for a given card height. */
export function qrCardSize(height: number, caption: string): { w: number; h: number } {
  const captionH = caption ? height * 0.16 : 0;
  return { w: height - captionH, h: height };
}

/** The QR card: the code with a quiet zone on a rounded light card, and an optional caption under it. */
export function drawQrCard(c: Ctx, sprite: HTMLCanvasElement, x: number, y: number, height: number, caption: string, light: string, accent: string): void {
  const { w } = qrCardSize(height, caption);
  const captionH = height - w;
  c.save();
  c.shadowColor = 'rgba(0,0,0,.35)';
  c.shadowBlur = height * 0.06;
  c.fillStyle = light;
  c.beginPath();
  c.roundRect(x, y, w, height, w * 0.08);
  c.fill();
  c.shadowBlur = 0;

  // A quiet zone of about three modules around the code, which scanners need.
  const quiet = (w / (sprite.width + 6)) * 3;
  c.imageSmoothingEnabled = false;
  c.drawImage(sprite, x + quiet, y + quiet, w - quiet * 2, w - quiet * 2);
  c.imageSmoothingEnabled = true;

  if (caption) {
    c.fillStyle = accent;
    c.beginPath();
    c.roundRect(x, y + w - captionH * 0.05, w, captionH * 1.05, [0, 0, w * 0.08, w * 0.08]);
    c.fill();
    c.fillStyle = '#ffffff';
    c.font = `800 ${Math.round(captionH * 0.52)}px system-ui, sans-serif`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(caption, x + w / 2, y + w + captionH * 0.48, w * 0.92);
  }
  c.restore();
}

/** A brand channel's support card, loaded from its end-card settings. */
export interface SupportCardArt {
  qr: ImageBitmap | null;
  headline: string;
  subtext: string;
  headlineSecondary: string;
  subtextSecondary: string;
  background: string;
  text: string;
}

/** Card width for a given height: portrait, like the channel's end card. */
export function supportCardWidth(height: number): number {
  return Math.round(height * 0.74);
}

/**
 * The channel's support card: headline lines, the uploaded QR on a white square with a quiet
 * zone (so it scans on any background), and the small text under it. `alpha` fades it in and out.
 */
export function drawSupportCard(
  c: Ctx, art: SupportCardArt, x: number, y: number, height: number,
  lines: 'primary' | 'secondary' | 'both', alpha: number,
): void {
  const w = supportCardWidth(height);
  const pad = w * 0.07;
  const pick = (primary: string, secondary: string) =>
    (lines === 'primary' ? [primary] : lines === 'secondary' ? [secondary || primary] : [primary, secondary])
      .map((s) => s.trim()).filter(Boolean);
  const top = pick(art.headline, art.headlineSecondary);
  const bottom = pick(art.subtext, art.subtextSecondary);

  c.save();
  c.globalAlpha = alpha;
  c.shadowColor = 'rgba(0,0,0,.4)';
  c.shadowBlur = height * 0.05;
  c.fillStyle = art.background;
  c.beginPath();
  c.roundRect(x, y, w, height, w * 0.07);
  c.fill();
  c.shadowBlur = 0;

  c.fillStyle = art.text;
  c.textAlign = 'center';
  c.textBaseline = 'top';
  const lineH = height * 0.062;
  let ty = y + pad * 0.8;
  for (const [i, line] of top.entries()) {
    c.font = `${i === 0 ? 800 : 600} ${Math.round(lineH * (i === 0 ? 0.95 : 0.8))}px system-ui, 'Nirmala UI', sans-serif`;
    for (const part of wrap(c, line, w - pad * 2, 2)) {
      c.fillText(part, x + w / 2, ty, w - pad * 2);
      ty += lineH * 1.1;
    }
  }

  const bottomH = bottom.length * lineH * 1.05 + pad * 0.6;
  const qrSide = Math.max(0, Math.min(w - pad * 2, y + height - bottomH - ty - pad * 0.5));
  const qx = x + (w - qrSide) / 2;
  const qy = ty + pad * 0.3;
  c.fillStyle = '#ffffff';
  c.beginPath();
  c.roundRect(qx, qy, qrSide, qrSide, qrSide * 0.05);
  c.fill();
  if (art.qr && qrSide > 0) {
    const quiet = qrSide * 0.07;
    const inner = qrSide - quiet * 2;
    const scale = Math.min(inner / art.qr.width, inner / art.qr.height);
    const dw = art.qr.width * scale;
    const dh = art.qr.height * scale;
    c.drawImage(art.qr, qx + (qrSide - dw) / 2, qy + (qrSide - dh) / 2, dw, dh);
  }

  c.fillStyle = art.text;
  let by = qy + qrSide + pad * 0.4;
  for (const line of bottom) {
    c.font = `600 ${Math.round(lineH * 0.72)}px system-ui, 'Nirmala UI', sans-serif`;
    c.fillText(line, x + w / 2, by, w - pad * 2);
    by += lineH * 1.05;
  }
  c.restore();
}

/** Just the channel's QR image, on a white rounded square with a quiet zone so it scans on any picture. */
export function drawSupportQr(c: Ctx, qr: ImageBitmap, x: number, y: number, side: number, alpha: number): void {
  c.save();
  c.globalAlpha = alpha;
  c.shadowColor = 'rgba(0,0,0,.35)';
  c.shadowBlur = side * 0.06;
  c.fillStyle = '#ffffff';
  c.beginPath();
  c.roundRect(x, y, side, side, side * 0.06);
  c.fill();
  c.shadowBlur = 0;
  const quiet = side * 0.07;
  const inner = side - quiet * 2;
  const scale = Math.min(inner / qr.width, inner / qr.height);
  const dw = qr.width * scale;
  const dh = qr.height * scale;
  c.drawImage(qr, x + (side - dw) / 2, y + (side - dh) / 2, dw, dh);
  c.restore();
}

/** Word-wraps to at most `max` lines; the last one is squeezed by fillText's maxWidth if needed. */
function wrap(c: Ctx, text: string, width: number, max: number): string[] {
  const lines: string[] = [];
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const last = lines.length - 1;
    if (last >= 0 && (lines.length === max || c.measureText(`${lines[last]} ${word}`).width <= width)) {
      lines[last] = `${lines[last]} ${word}`;
    } else {
      lines.push(word);
    }
  }
  return lines;
}

const FINISH: Record<Exclude<SealFinish, 'accent'>, [string, string, string]> = {
  gold: ['#fff1b8', '#e0a526', '#8a5a07'],
  silver: ['#ffffff', '#b9c2cf', '#5d6676'],
  rose: ['#ffe0dc', '#e79a8f', '#8e4a43'],
};

export interface SealContent {
  top: string;
  bottom: string;
  center: string;
  serial: string;
  date: string | null;
  finish: SealFinish;
  accent: string;
}

/** An embossed rosette seal: scalloped metal edge, ring text top and bottom, a big centre mark and a serial line. */
export function drawSeal(c: Ctx, cx: number, cy: number, r: number, seal: SealContent, t: number): void {
  const [hi, mid, lo] = seal.finish === 'accent' ? [mixWhite(seal.accent, 0.6), seal.accent, mixBlack(seal.accent, 0.45)] : FINISH[seal.finish];
  c.save();
  c.translate(cx, cy);
  c.rotate(-0.12);

  // Scalloped rosette edge.
  const bumps = 28;
  c.beginPath();
  for (let i = 0; i <= bumps * 2; i++) {
    const a = (i / (bumps * 2)) * Math.PI * 2;
    const rr = i % 2 === 0 ? r : r * 0.92;
    if (i === 0) c.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
    else c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  c.closePath();
  const metal = c.createLinearGradient(-r, -r, r, r);
  metal.addColorStop(0, hi);
  metal.addColorStop(0.5, mid);
  metal.addColorStop(1, lo);
  c.shadowColor = 'rgba(0,0,0,.4)';
  c.shadowBlur = r * 0.15;
  c.fillStyle = metal;
  c.fill();
  c.shadowBlur = 0;

  // Inner face with two engraved rings.
  disc(c, r * 0.84, lo);
  const face = c.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r * 0.82);
  face.addColorStop(0, hi);
  face.addColorStop(1, mid);
  disc(c, r * 0.8, face);
  ring(c, r * 0.56, lo, r * 0.02);
  ring(c, r * 0.76, lo, r * 0.015);

  // Ring text.
  c.fillStyle = lo;
  c.font = `800 ${Math.round(r * 0.13)}px system-ui, sans-serif`;
  c.textBaseline = 'middle';
  c.textAlign = 'center';
  arcText(c, seal.top.toUpperCase(), r * 0.66, -Math.PI / 2, true);
  arcText(c, seal.bottom.toUpperCase(), r * 0.66, Math.PI / 2, false);
  for (const side of [-1, 1]) c.fillText('★', side * r * 0.66, 0);

  // The centre mark, sized to fit.
  const center = seal.center || '★';
  c.font = `900 ${Math.round(r * (center.length <= 2 ? 0.5 : center.length <= 4 ? 0.34 : 0.26))}px system-ui, "Segoe UI Emoji", sans-serif`;
  c.fillStyle = 'rgba(255,255,255,.55)';
  c.fillText(center, r * 0.015, -r * 0.03 + r * 0.015);
  c.fillStyle = lo;
  c.fillText(center, 0, -r * 0.05);

  const line = [seal.serial, seal.date].filter(Boolean).join(' · ');
  if (line) {
    c.font = `700 ${Math.round(r * 0.09)}px ui-monospace, Consolas, monospace`;
    c.fillText(line, 0, r * 0.3, r * 0.95);
  }

  // A slow shine sweeping across the metal.
  const sweep = ((t / 4000) % 1) * 2.4 - 1.2;
  const shine = c.createLinearGradient((sweep - 0.25) * r, -r, (sweep + 0.25) * r, r);
  shine.addColorStop(0, 'rgba(255,255,255,0)');
  shine.addColorStop(0.5, 'rgba(255,255,255,.28)');
  shine.addColorStop(1, 'rgba(255,255,255,0)');
  disc(c, r * 0.92, shine);
  c.restore();
}

function disc(c: Ctx, r: number, fill: string | CanvasGradient): void {
  c.beginPath();
  c.arc(0, 0, r, 0, Math.PI * 2);
  c.fillStyle = fill;
  c.fill();
}

function ring(c: Ctx, r: number, stroke: string, width: number): void {
  c.beginPath();
  c.arc(0, 0, r, 0, Math.PI * 2);
  c.strokeStyle = stroke;
  c.lineWidth = Math.max(1, width);
  c.stroke();
}

/** Writes text along a circle, centred on `centre` (radians); `top` text reads clockwise, bottom text anticlockwise so both read upright. */
function arcText(c: Ctx, text: string, radius: number, centre: number, top: boolean): void {
  if (!text) return;
  const chars = [...text];
  const widths = chars.map((ch) => c.measureText(ch).width * 1.12);
  const total = widths.reduce((a, b) => a + b, 0);
  // Never wrap past the side stars.
  const maxAngle = Math.PI * 0.82;
  const squeeze = Math.min(1, (maxAngle * radius) / Math.max(1, total));
  let angle = centre + (top ? -1 : 1) * (total * squeeze) / radius / 2;
  for (let i = 0; i < chars.length; i++) {
    const step = (widths[i] * squeeze) / radius;
    const a = angle + (top ? 1 : -1) * step / 2;
    c.save();
    c.translate(Math.cos(a) * radius, Math.sin(a) * radius);
    c.rotate(top ? a + Math.PI / 2 : a - Math.PI / 2);
    c.scale(squeeze, 1);
    c.fillText(chars[i], 0, 0);
    c.restore();
    angle += (top ? 1 : -1) * step;
  }
}

function mixWhite(hex: string, t: number): string {
  return mix(hex, 255, t);
}

function mixBlack(hex: string, t: number): string {
  return mix(hex, 0, t);
}

function mix(hex: string, target: number, t: number): string {
  const n = parseInt(hex.slice(1), 16);
  const m = (v: number) => Math.round(v + (target - v) * t);
  return `rgb(${m((n >> 16) & 255)},${m((n >> 8) & 255)},${m(n & 255)})`;
}
