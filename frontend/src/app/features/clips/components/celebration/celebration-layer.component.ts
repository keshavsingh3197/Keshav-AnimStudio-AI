import { Component, ElementRef, NgZone, OnDestroy, afterNextRender, inject, input, viewChild } from '@angular/core';

import { CelebrationKind, CelebrationPainter, CelebrationSettings, isCelebrationKind } from '../../services/celebration';

/** One celebration on a preview: when it starts and stops on the preview's clock, and what it is. */
export interface CelebrationCue {
  /** Seeds the particles; the export seeds from the same id, so both draw the same shower. */
  id: string;
  kind: string;
  settings?: CelebrationSettings;
  start: number;
  duration: number;
}

/**
 * Draws celebrations over a preview - the studio monitor, Photo Story's stage - on a canvas
 * that fills its parent. It runs its own animation frame loop outside Angular and reads the
 * preview's clock each frame, so playback costs no change detection.
 */
@Component({
  selector: 'app-celebration-layer',
  standalone: true,
  template: `<canvas #canvas aria-hidden="true"></canvas>`,
  styles: [`
    :host { position: absolute; inset: 0; pointer-events: none; z-index: 6; overflow: hidden; }
    canvas { width: 100%; height: 100%; display: block; }
  `],
})
export class CelebrationLayerComponent implements OnDestroy {
  /** What plays, and when. */
  readonly cues = input<CelebrationCue[]>([]);
  /** Seconds on the preview's own timeline, read every frame. */
  readonly clock = input.required<() => number>();
  /** The export's canvas, which particle sizes are planned against. */
  readonly exportWidth = input(1920);
  readonly exportHeight = input(1080);

  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly zone = inject(NgZone);
  private readonly painters = new Map<string, CelebrationPainter>();
  private raf = 0;
  private stopped = false;

  constructor() {
    afterNextRender(() => this.zone.runOutsideAngular(() => this.frame()));
  }

  ngOnDestroy(): void {
    this.stopped = true;
    cancelAnimationFrame(this.raf);
  }

  private frame = (): void => {
    if (this.stopped) return;
    this.raf = requestAnimationFrame(this.frame);
    const canvas = this.canvas().nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Backing store at device pixels, so particles stay crisp at any monitor size.
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(1, Math.round(canvas.clientWidth * ratio));
    const h = Math.max(1, Math.round(canvas.clientHeight * ratio));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    ctx.clearRect(0, 0, w, h);

    const now = this.clock()();
    const live = new Set<string>();
    for (const cue of this.cues()) {
      if (!isCelebrationKind(cue.kind)) continue;
      const t = now - cue.start;
      if (t < 0 || t > cue.duration) continue;
      live.add(cue.id);
      let painter = this.painters.get(cue.id);
      if (!painter) {
        painter = new CelebrationPainter(cue.kind as CelebrationKind, cue.settings, cue.id, cue.duration, this.exportWidth(), this.exportHeight());
        this.painters.set(cue.id, painter);
      } else {
        painter.update(cue.kind as CelebrationKind, cue.settings, cue.id, cue.duration, this.exportWidth(), this.exportHeight());
      }
      painter.draw(ctx, t);
    }
    // Keep the cache to what is on screen; a painter is cheap to make again.
    if (this.painters.size > live.size + 8) {
      for (const id of [...this.painters.keys()]) if (!live.has(id)) this.painters.delete(id);
    }
  };
}
