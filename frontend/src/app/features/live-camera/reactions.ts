import type { ReactionKind } from './gestures';

/**
 * Reaction bursts - hearts, confetti, stars - that rise from where a gesture was made and
 * fade out. Positions are in program pixels; the compositor owns one of these.
 */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  size: number;
  spin: number;
  angle: number;
  glyph: string | null;
  color: string;
}

const GLYPHS: Record<ReactionKind, readonly string[]> = {
  hearts: ['❤️', '💖', '💕', '💗'],
  thumbs: ['👍', '👍', '✨'],
  confetti: ['🎉', '🎊'],
  fire: ['🔥', '🔥', '✨'],
  clap: ['👏', '👏', '✨'],
  wave: ['👋', '✨'],
  wow: ['😮', '🤯', '✨'],
  laugh: ['😂', '🤣', '😆'],
  stars: ['⭐', '🌟', '✨'],
};

const CONFETTI = ['#ff3355', '#ffd166', '#22d3a6', '#4de3ff', '#6c8cff', '#ff6cc6'];
const MAX_PARTICLES = 320;
const EMOJI_FONT = '"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';

export class Reactions {
  private particles: Particle[] = [];

  get active(): boolean {
    return this.particles.length > 0;
  }

  /** Starts a burst at (x, y) on a program `height` pixels tall. */
  burst(kind: ReactionKind, x: number, y: number, height: number, random: () => number = Math.random): void {
    const u = height / 720;
    const glyphs = GLYPHS[kind];
    const count = kind === 'confetti' ? 14 : 12;
    for (let i = 0; i < count; i++) {
      const spread = (random() - 0.5) * Math.PI * 0.9;
      const speed = (180 + random() * 220) * u;
      this.particles.push({
        x, y,
        vx: Math.sin(spread) * speed,
        vy: -Math.cos(spread) * speed,
        age: 0,
        life: 1.6 + random() * 0.8,
        size: (34 + random() * 26) * u,
        spin: (random() - 0.5) * 2,
        angle: (random() - 0.5) * 0.6,
        glyph: glyphs[Math.floor(random() * glyphs.length)],
        color: '#fff',
      });
    }
    if (kind === 'confetti') {
      for (let i = 0; i < 46; i++) {
        const spread = (random() - 0.5) * Math.PI * 1.2;
        const speed = (260 + random() * 320) * u;
        this.particles.push({
          x, y,
          vx: Math.sin(spread) * speed,
          vy: -Math.cos(spread) * speed,
          age: 0,
          life: 1.8 + random() * 1.0,
          size: (8 + random() * 8) * u,
          spin: (random() - 0.5) * 14,
          angle: random() * Math.PI,
          glyph: null,
          color: CONFETTI[Math.floor(random() * CONFETTI.length)],
        });
      }
    }
    if (this.particles.length > MAX_PARTICLES) this.particles.splice(0, this.particles.length - MAX_PARTICLES);
  }

  /** Moves and draws every particle; `dt` in milliseconds. */
  draw(ctx: CanvasRenderingContext2D, dt: number, height: number): void {
    if (!this.particles.length) return;
    const s = Math.min(0.1, dt / 1000);
    const gravity = 260 * (height / 720);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    this.particles = this.particles.filter((p) => {
      p.age += s;
      if (p.age >= p.life) return false;
      // Emoji float up and slow down; confetti falls.
      if (p.glyph) {
        p.vx *= 1 - s * 1.2;
        p.vy = p.vy * (1 - s * 1.6) - 40 * s;
      } else {
        p.vx *= 1 - s * 0.8;
        p.vy += gravity * s;
      }
      p.x += p.vx * s;
      p.y += p.vy * s;
      p.angle += p.spin * s;

      const fade = Math.min(1, (p.life - p.age) / 0.5, p.age / 0.12);
      ctx.globalAlpha = Math.max(0, fade);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      if (p.glyph) {
        const pop = 0.6 + Math.min(1, p.age / 0.25) * 0.4;
        ctx.font = `${Math.round(p.size * pop)}px ${EMOJI_FONT}`;
        ctx.fillText(p.glyph, 0, 0);
      } else {
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      }
      ctx.restore();
      return true;
    });
    ctx.restore();
  }
}
