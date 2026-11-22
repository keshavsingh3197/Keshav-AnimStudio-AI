import { EffectCategory } from '../../core/models/effects.models';

export type StudioGraphicTemplateId =
  | 'subscribe-pill'
  | 'lower-third'
  | 'palace-frame'
  | 'temple-frame'
  | 'rec-viewfinder'
  | 'cinema-vignette'
  | 'logo-crest'
  | 'end-screen';

export type StudioThemeId = 'royal-gold' | 'comedy-fire' | 'sacred-saffron' | 'cyber-neon';

export type StudioSfxId =
  | 'boing'
  | 'pop'
  | 'whoosh'
  | 'ding'
  | 'boom'
  | 'snip'
  | 'temple-bell'
  | 'tabla-taal'
  | 'buzzer';

export type StudioAnimatedClipId =
  | 'anim-subscribe'
  | 'anim-petals'
  | 'anim-swipe'
  | 'anim-intro';

export interface StudioGraphicOptions {
  template: StudioGraphicTemplateId;
  theme: StudioThemeId;
  title: string;
  subtitle: string;
  aspect: '16:9' | '9:16';
}

export interface StudioGraphicMeta {
  readonly id: StudioGraphicTemplateId;
  readonly label: string;
  readonly category: EffectCategory;
  readonly tags: readonly string[];
}

export interface StudioSfxMeta {
  readonly id: StudioSfxId;
  readonly name: string;
  readonly icon: string;
  readonly durationSec: number;
  readonly description: string;
  readonly tags: readonly string[];
}

export interface StudioVideoMeta {
  readonly id: StudioAnimatedClipId;
  readonly name: string;
  readonly icon: string;
  readonly category: EffectCategory;
  readonly durationSec: number;
  readonly isGreenScreen: boolean;
  readonly description: string;
  readonly tags: readonly string[];
}

interface ThemePalette {
  bgDark: string;
  bgAccent: string;
  accent: string;
  text: string;
}

const THEMES: Record<StudioThemeId, ThemePalette> = {
  'royal-gold': { bgDark: '#3f0d1b', bgAccent: '#7f1d1d', accent: '#fbbf24', text: '#fef3c7' },
  'comedy-fire': { bgDark: '#1e1b4b', bgAccent: '#f97316', accent: '#fde047', text: '#ffffff' },
  'sacred-saffron': { bgDark: '#2d1206', bgAccent: '#ea580c', accent: '#fcd34d', text: '#fffbeb' },
  'cyber-neon': { bgDark: '#0f172a', bgAccent: '#06b6d4', accent: '#38bdf8', text: '#f0f9ff' },
};

export const STUDIO_GRAPHIC_TEMPLATES: readonly StudioGraphicMeta[] = [
  { id: 'subscribe-pill', label: '🔔 Subscribe & Bell Badge (Transparent)', category: 'Subscribe', tags: ['subscribe', 'bell', 'callout', 'badge'] },
  { id: 'lower-third', label: '🏷 Channel / Speaker Lower Third', category: 'LowerThird', tags: ['lower-third', 'title', 'bar', 'speaker'] },
  { id: 'palace-frame', label: '🏰 Samode Palace Gold Arch Frame', category: 'Overlay', tags: ['palace', 'gold', 'frame', 'dance'] },
  { id: 'temple-frame', label: '🪷 Sacred Mandala Corner Frame', category: 'Overlay', tags: ['temple', 'mandala', 'katha', 'frame'] },
  { id: 'rec-viewfinder', label: '📷 Camera 4K REC Viewfinder HUD', category: 'Overlay', tags: ['camera', 'rec', 'viewfinder', 'hud'] },
  { id: 'cinema-vignette', label: '✨ Warm Cinema Glow Vignette', category: 'Overlay', tags: ['vignette', 'glow', 'warm', 'cinema'] },
  { id: 'logo-crest', label: '✴ Studio Monogram Logo Crest', category: 'LogoReveal', tags: ['logo', 'crest', 'brand', 'watermark'] },
  { id: 'end-screen', label: '🏁 End Screen Card (2 Slots)', category: 'EndScreen', tags: ['outro', 'end-screen', 'subscribe'] },
];

export const STUDIO_SFX_PRESETS: readonly StudioSfxMeta[] = [
  { id: 'boing', name: 'Comedy Spring Boing', icon: '🪀', durationSec: 0.55, description: 'Bouncy comedy cartoon pitch spring', tags: ['comedy', 'boing', 'mjo'] },
  { id: 'pop', name: 'Bubble Snap Pop', icon: '🫧', durationSec: 0.22, description: 'Crisp UI / subtitle / prop appear pop', tags: ['pop', 'bubble', 'ui'] },
  { id: 'whoosh', name: 'Scene Cut Whoosh', icon: '💨', durationSec: 0.65, description: 'Smooth air sweep for transitions & entrances', tags: ['whoosh', 'transition', 'cut'] },
  { id: 'ding', name: 'Quiz Correct Chime', icon: '🛎️', durationSec: 0.90, description: 'Bright harmonic chime for Pratiyogita / GK reveal', tags: ['ding', 'chime', 'quiz'] },
  { id: 'boom', name: 'Dramatic Bass Boom', icon: '💥', durationSec: 1.15, description: 'Deep impact sub-hit for plot twists & reveals', tags: ['boom', 'impact', 'twist'] },
  { id: 'snip', name: 'Barber Scissor Snip', icon: '✂️', durationSec: 0.55, description: 'Crisp double scissor snip (Salon comedy)', tags: ['snip', 'scissors', 'comedy'] },
  { id: 'temple-bell', name: 'Sacred Temple Bell', icon: '🛕', durationSec: 1.65, description: 'Resonant brass ghanti for Katha / Panchang opens', tags: ['bell', 'temple', 'aarti'] },
  { id: 'tabla-taal', name: 'Tabla & Ghungroo Taal', icon: '🥁', durationSec: 1.50, description: 'Rhythmic dance beat accent for Sufi & folk videos', tags: ['tabla', 'dance', 'guzarish'] },
  { id: 'buzzer', name: 'Comedy Fail Honk', icon: '📯', durationSec: 0.55, description: 'Playful wrong-answer gag buzz', tags: ['buzzer', 'fail', 'comedy'] },
];

export const STUDIO_VIDEO_PRESETS: readonly StudioVideoMeta[] = [
  {
    id: 'anim-subscribe',
    name: 'Animated Subscribe & Bell Pop (Green Screen)',
    icon: '🔔',
    category: 'Subscribe',
    durationSec: 2.6,
    isGreenScreen: true,
    description: 'Bouncing Subscribe pill + ringing golden bell over pure #00ff00 green screen.',
    tags: ['subscribe', 'animated', 'green-screen'],
  },
  {
    id: 'anim-petals',
    name: 'Golden Rose Petals Shower (Green Screen)',
    icon: '🌹',
    category: 'Overlay',
    durationSec: 3.0,
    isGreenScreen: true,
    description: 'Swirling golden & rose celebration petals over #00ff00 for palace dance & devotional reels.',
    tags: ['petals', 'dance', 'palace', 'green-screen'],
  },
  {
    id: 'anim-swipe',
    name: 'Royal Gold Wipe Stinger',
    icon: '⚡',
    category: 'Transition',
    durationSec: 1.1,
    isGreenScreen: false,
    description: 'Fast sweeping gold/indigo diagonal slash transition stinger for sharp scene cuts.',
    tags: ['transition', 'wipe', 'stinger'],
  },
  {
    id: 'anim-intro',
    name: 'Studio Starburst Opener',
    icon: '🎬',
    category: 'Intro',
    durationSec: 2.8,
    isGreenScreen: false,
    description: 'Animated radial sunburst + Keshav Studio crest opener in 960x540.',
    tags: ['intro', 'opener', 'logo'],
  },
];

function canvasToPngFile(canvas: HTMLCanvasElement, filename: string): Promise<File> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('PNG export failed in this browser.'));
        return;
      }
      resolve(new File([blob], filename, { type: 'image/png' }));
    }, 'image/png');
  });
}

function resolveDimensions(opts: StudioGraphicOptions): [number, number] {
  if (opts.template === 'logo-crest') return [800, 800];
  return opts.aspect === '9:16' ? [720, 1280] : [1280, 720];
}

export function drawStudioGraphic(canvas: HTMLCanvasElement, opts: StudioGraphicOptions): void {
  const [w, h] = resolveDimensions(opts);
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Your browser could not create a 2D canvas.');

  ctx.clearRect(0, 0, w, h);
  const pal = THEMES[opts.theme];
  const title = opts.title.trim() || 'KESHAV STUDIO';
  const sub = opts.subtitle.trim() || '3D Comedy • Music • Stories';
  const portrait = h > w;

  switch (opts.template) {
    case 'subscribe-pill': {
      const boxW = Math.min(w * 0.78, 620);
      const boxH = 118;
      const bx = (w - boxW) / 2;
      const by = h - boxH - (portrait ? 150 : 64);
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.55)';
      ctx.shadowBlur = 24;
      ctx.shadowOffsetY = 8;
      ctx.fillStyle = pal.bgDark;
      ctx.beginPath();
      ctx.roundRect(bx, by, boxW, boxH, 59);
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = pal.accent;
      ctx.stroke();
      ctx.restore();

      // Red CTA pill
      const pillW = Math.min(230, boxW * 0.39);
      const pillX = bx + boxW - pillW - 18;
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.roundRect(pillX, by + 21, pillW, 76, 38);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('SUBSCRIBE 🔔', pillX + pillW / 2, by + 59, pillW - 24);

      ctx.fillStyle = pal.text;
      ctx.font = '800 30px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(title, bx + 34, by + 44, pillX - bx - 48);
      ctx.fillStyle = pal.accent;
      ctx.font = '600 20px sans-serif';
      ctx.fillText(sub, bx + 34, by + 78, pillX - bx - 48);
      break;
    }

    case 'lower-third': {
      const barH = 128;
      const barW = Math.min(w * 0.72, 680);
      const x = portrait ? (w - barW) / 2 : 56;
      const y = h - barH - (portrait ? 170 : 58);

      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 20;
      const grad = ctx.createLinearGradient(x, y, x + barW, y);
      grad.addColorStop(0, pal.bgDark);
      grad.addColorStop(1, pal.bgAccent);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x, y, barW, barH, 20);
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = pal.accent;
      ctx.beginPath();
      ctx.roundRect(x, y, 14, barH, [20, 0, 0, 20]);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = '800 38px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(title, x + 36, y + 48, barW - 60);

      ctx.fillStyle = pal.accent;
      ctx.font = '600 24px sans-serif';
      ctx.fillText(sub, x + 36, y + 90, barW - 60);
      break;
    }

    case 'palace-frame':
    case 'temple-frame': {
      const isPalace = opts.template === 'palace-frame';
      const frameColor = isPalace ? '#fbbf24' : '#fb923c';
      const pad = 26;
      ctx.strokeStyle = frameColor;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.roundRect(pad, pad, w - pad * 2, h - pad * 2, 24);
      ctx.stroke();

      ctx.lineWidth = 2.5;
      ctx.strokeStyle = 'rgba(255, 243, 199, 0.72)';
      ctx.beginPath();
      ctx.roundRect(pad + 12, pad + 12, w - (pad + 12) * 2, h - (pad + 12) * 2, 16);
      ctx.stroke();

      // Corner ornaments
      for (const [cx, cy, sx, sy] of [
        [pad + 22, pad + 22, 1, 1],
        [w - pad - 22, pad + 22, -1, 1],
        [pad + 22, h - pad - 22, 1, -1],
        [w - pad - 22, h - pad - 22, -1, -1],
      ]) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(sx, sy);
        ctx.fillStyle = frameColor;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(54, 0);
        ctx.quadraticCurveTo(18, 18, 0, 54);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.arc(16, 16, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#fef3c7';
        ctx.fill();
        ctx.restore();
      }
      break;
    }

    case 'rec-viewfinder': {
      const m = 44;
      const leg = 64;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 6;
      ctx.lineCap = 'square';
      for (const [x, y, dx, dy] of [
        [m, m, 1, 1],
        [w - m, m, -1, 1],
        [m, h - m, 1, -1],
        [w - m, h - m, -1, -1],
      ]) {
        ctx.beginPath();
        ctx.moveTo(x + dx * leg, y);
        ctx.lineTo(x, y);
        ctx.lineTo(x, y + dy * leg);
        ctx.stroke();
      }
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(m + 34, m + 36, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(`REC  ${w}x${h} • 60FPS`, m + 58, m + 36);
      break;
    }

    case 'cinema-vignette': {
      const grad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.25, w / 2, h / 2, Math.max(w, h) * 0.72);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(0.65, 'rgba(20, 10, 5, 0.22)');
      grad.addColorStop(1, 'rgba(10, 4, 2, 0.78)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      break;
    }

    case 'logo-crest': {
      const mono = title
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0].toUpperCase())
        .join('') || 'KS';
      const grad = ctx.createRadialGradient(400, 360, 40, 400, 380, 290);
      grad.addColorStop(0, pal.bgAccent);
      grad.addColorStop(1, pal.bgDark);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(400, 380, 270, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 14;
      ctx.strokeStyle = pal.accent;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(400, 380, 232, 0, Math.PI * 2);
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(255,255,255,0.45)';
      ctx.stroke();

      ctx.fillStyle = pal.accent;
      ctx.font = '900 185px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(mono, 400, 365);

      ctx.fillStyle = '#ffffff';
      ctx.font = '800 42px sans-serif';
      ctx.fillText(title, 400, 695, 720);
      break;
    }

    case 'end-screen': {
      const bg = ctx.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, pal.bgDark);
      bg.addColorStop(1, '#090d16');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = pal.accent;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `900 ${portrait ? 48 : 54}px sans-serif`;
      ctx.fillText(title, w / 2, portrait ? 130 : 96, w - 80);

      ctx.fillStyle = '#e2e8f0';
      ctx.font = `600 ${portrait ? 28 : 30}px sans-serif`;
      ctx.fillText(sub, w / 2, portrait ? 188 : 154, w - 80);

      const boxW = portrait ? w * 0.78 : 480;
      const boxH = portrait ? 270 : 275;
      const slots = portrait
        ? [[(w - boxW) / 2, 270], [(w - boxW) / 2, 585]]
        : [[w / 2 - boxW - 36, 235], [w / 2 + 36, 235]];
      for (let i = 0; i < slots.length; i++) {
        const [sx, sy] = slots[i];
        ctx.strokeStyle = pal.accent;
        ctx.lineWidth = 4;
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.beginPath();
        ctx.roundRect(sx, sy, boxW, boxH, 20);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.65)';
        ctx.font = '700 24px sans-serif';
        ctx.fillText(i === 0 ? '▶ NEXT RECOMMENDED' : '🔥 WATCH FULL PLAYLIST', sx + boxW / 2, sy + boxH / 2);
      }
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.roundRect(w / 2 - 190, h - 120, 380, 74, 37);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 30px sans-serif';
      ctx.fillText('SUBSCRIBE FOR MORE', w / 2, h - 83);
      break;
    }
  }
}

export async function generateStudioGraphicFile(opts: StudioGraphicOptions): Promise<File> {
  const canvas = document.createElement('canvas');
  drawStudioGraphic(canvas, opts);
  return canvasToPngFile(canvas, `${opts.template}-${opts.theme}.png`);
}

function encodeMonoWav(samples: Float32Array, sampleRate: number): Blob {
  const pcm = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    pcm[i] = Math.max(-32767, Math.min(32767, Math.round(samples[i] * 32767)));
  }
  const buf = new ArrayBuffer(44 + pcm.byteLength);
  const view = new DataView(buf);
  const str = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i));
  };
  str(0, 'RIFF');
  view.setUint32(4, 36 + pcm.byteLength, true);
  str(8, 'WAVEfmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  str(36, 'data');
  view.setUint32(40, pcm.byteLength, true);
  new Uint8Array(buf, 44).set(new Uint8Array(pcm.buffer));
  return new Blob([buf], { type: 'audio/wav' });
}

export function generateStudioSfxFile(id: StudioSfxId): File {
  const sr = 44100;
  const meta = STUDIO_SFX_PRESETS.find((s) => s.id === id) ?? STUDIO_SFX_PRESETS[0];
  const n = Math.floor(sr * meta.durationSec);
  const buf = new Float32Array(n);
  let phase = 0;
  let noise = 0;

  for (let i = 0; i < n; i++) {
    const t = i / sr;
    const u = i / n;
    let out = 0;

    if (id === 'boing') {
      const f = 140 + 480 * Math.pow(u, 0.7) * (1 + 0.14 * Math.sin(2 * Math.PI * 16 * t));
      phase += (2 * Math.PI * f) / sr;
      out = 0.72 * Math.exp(-3.2 * u) * Math.sin(phase);
    } else if (id === 'pop') {
      const f = 180 + 780 * u;
      phase += (2 * Math.PI * f) / sr;
      out = 0.85 * Math.sin(Math.PI * Math.min(1, u * 1.15)) * Math.exp(-6 * u) * Math.sin(phase);
    } else if (id === 'whoosh') {
      const white = Math.random() * 2 - 1;
      const env = Math.sin(Math.PI * u);
      const cut = 0.04 + 0.32 * env;
      noise += (white - noise) * cut;
      out = noise * env * 1.45;
    } else if (id === 'ding') {
      const e1 = Math.exp(-3.4 * t);
      out = 0.45 * e1 * (Math.sin(2 * Math.PI * 1046.5 * t) + 0.5 * Math.sin(2 * Math.PI * 1567.98 * t) + 0.35 * Math.sin(2 * Math.PI * 2093 * t));
    } else if (id === 'boom') {
      const f = 120 * Math.exp(-3.8 * t) + 34;
      phase += (2 * Math.PI * f) / sr;
      const thud = 0.85 * Math.exp(-2.8 * t) * Math.sin(phase);
      const rumble = 0.35 * Math.exp(-4.5 * t) * (Math.random() * 2 - 1);
      out = thud + rumble;
    } else if (id === 'snip') {
      // Double metallic scissor snip ("chak-chak")
      const s1 = Math.exp(-Math.pow((t - 0.08) / 0.025, 2));
      const s2 = Math.exp(-Math.pow((t - 0.30) / 0.025, 2));
      const ring = Math.sin(2 * Math.PI * 2850 * t) * 0.35 + (Math.random() * 2 - 1) * 0.5;
      out = ring * (s1 + s2);
    } else if (id === 'temple-bell') {
      const partials = [1, 2.02, 3.01, 4.18, 5.42];
      let sum = 0;
      for (let p = 0; p < partials.length; p++) {
        sum += Math.sin(2 * Math.PI * 528 * partials[p] * t) * Math.exp(-(1.2 + p * 0.9) * t) * (1 / (p + 1));
      }
      out = 0.72 * sum;
    } else if (id === 'tabla-taal') {
      // 3-hit dha-tin-dha accent + ghungroo jingle
      const hits = [0.04, 0.42, 0.80];
      let sum = 0;
      for (const h of hits) {
        const dt = t - h;
        if (dt >= 0) {
          const b = Math.exp(-dt * 12) * Math.sin(2 * Math.PI * (92 + 52 * Math.exp(-dt * 28)) * dt);
          const g = Math.exp(-dt * 16) * (Math.random() * 2 - 1) * 0.25 * Math.sin(2 * Math.PI * 3800 * dt);
          sum += b * 0.7 + g;
        }
      }
      out = sum;
    } else {
      const a = Math.sin(2 * Math.PI * 165 * t) + 0.5 * Math.sin(2 * Math.PI * 330 * t) + 0.3 * Math.sin(2 * Math.PI * 212 * t);
      out = 0.45 * Math.exp(-2.2 * u) * Math.tanh(a);
    }

    const fadeEdge = Math.min(1, i / 120, (n - 1 - i) / 240);
    buf[i] = Math.max(-0.95, Math.min(0.95, out * fadeEdge));
  }

  return new File([encodeMonoWav(buf, sr)], `sfx-${id}.wav`, { type: 'audio/wav' });
}

export async function generateStudioAnimatedClipFile(id: StudioAnimatedClipId, theme: StudioThemeId, title: string): Promise<File> {
  const meta = STUDIO_VIDEO_PRESETS.find((v) => v.id === id) ?? STUDIO_VIDEO_PRESETS[0];
  const pal = THEMES[theme];
  const w = 960;
  const h = 540;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not initialize canvas recorder.');

  const mime = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find((m) =>
    MediaRecorder.isTypeSupported(m));
  if (!mime) throw new Error('WebM video recording is not supported in this browser.');

  const stream = canvas.captureStream(30);
  const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 3_500_000 });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const done = new Promise<void>((resolve) => (recorder.onstop = () => resolve()));

  const label = title.trim() || 'KESHAV STUDIO';
  const petals = Array.from({ length: 34 }, (_, i) => ({
    x: ((i * 197) % w),
    y: -((i * 83) % h),
    vx: ((i % 5) - 2) * 35,
    vy: 140 + (i % 4) * 45,
    rot: i * 0.7,
    size: 12 + (i % 3) * 6,
    gold: i % 2 === 0,
  }));

  const drawFrame = (u: number) => {
    ctx.clearRect(0, 0, w, h);
    if (meta.isGreenScreen) {
      ctx.fillStyle = '#00ff00';
      ctx.fillRect(0, 0, w, h);
    } else {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, pal.bgDark);
      grad.addColorStop(1, '#090d16');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }

    if (id === 'anim-subscribe') {
      const popIn = Math.min(1, u / 0.2);
      const popOut = u > 0.82 ? Math.max(0, 1 - (u - 0.82) / 0.18) : 1;
      const ease = (1 - Math.pow(1 - popIn, 3)) * popOut;
      const y = h - 125 * ease + 20 * (1 - ease);
      ctx.save();
      ctx.globalAlpha = ease;
      ctx.fillStyle = pal.bgDark;
      ctx.beginPath();
      ctx.roundRect(w / 2 - 250, y, 500, 86, 43);
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = pal.accent;
      ctx.stroke();

      const pulse = 1 + 0.08 * Math.sin(u * Math.PI * 10);
      ctx.translate(w / 2 + 125, y + 43);
      ctx.scale(pulse, pulse);
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.roundRect(-95, -28, 190, 56, 28);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('SUBSCRIBE 🔔', 0, 1);
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = ease;
      ctx.fillStyle = '#ffffff';
      ctx.font = '800 24px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, w / 2 - 216, y + 44, 215);
      ctx.restore();
    } else if (id === 'anim-petals') {
      const t = u * meta.durationSec;
      for (const p of petals) {
        const px = (p.x + p.vx * t + w * 2) % w;
        const py = (p.y + p.vy * t + h) % (h + 40) - 20;
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(p.rot + t * 2.4);
        ctx.fillStyle = p.gold ? '#fbbf24' : '#f43f5e';
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    } else if (id === 'anim-swipe') {
      const x = -w * 0.4 + u * w * 1.8;
      ctx.fillStyle = pal.accent;
      ctx.beginPath();
      ctx.moveTo(x - 160, 0);
      ctx.lineTo(x + 220, 0);
      ctx.lineTo(x + 60, h);
      ctx.lineTo(x - 320, h);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(x - 30, 0);
      ctx.lineTo(x + 40, 0);
      ctx.lineTo(x - 120, h);
      ctx.lineTo(x - 190, h);
      ctx.closePath();
      ctx.fill();
    } else {
      const spin = u * Math.PI * 2;
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.rotate(spin * 0.35);
      for (let r = 0; r < 12; r++) {
        ctx.rotate((Math.PI * 2) / 12);
        ctx.fillStyle = 'rgba(251, 191, 36, 0.14)';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-22, -420);
        ctx.lineTo(22, -420);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      const scale = Math.min(1, u * 3);
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.scale(scale, scale);
      ctx.fillStyle = pal.bgAccent;
      ctx.beginPath();
      ctx.arc(0, 0, 96, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 8;
      ctx.strokeStyle = pal.accent;
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 44px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, 0, 145, 760);
      ctx.fillText(label.slice(0, 2).toUpperCase(), 0, 4);
      ctx.restore();
    }
  };

  recorder.start(100);
  const startMs = performance.now();
  const totalMs = meta.durationSec * 1000;
  await new Promise<void>((resolve) => {
    const tick = () => {
      const elapsed = performance.now() - startMs;
      const u = Math.min(1, elapsed / totalMs);
      drawFrame(u);
      if (elapsed < totalMs) requestAnimationFrame(tick);
      else resolve();
    };
    tick();
  });
  recorder.stop();
  await done;
  return new File([new Blob(chunks, { type: mime })], `${id}.webm`, { type: mime });
}
