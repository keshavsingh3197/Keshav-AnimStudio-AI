import { Component, ElementRef, NgZone, OnDestroy, afterNextRender, inject, input, output, signal, viewChildren } from '@angular/core';

import { CELEBRATIONS, CelebrationKind, CelebrationPainter } from '../../services/celebration';

/** Length of each tile's looping preview. */
const LOOP_SECONDS = 4;

/**
 * The celebrations as a grid of small tiles, each with a live preview of its particles. Only
 * the hovered, focused or chosen tile moves; the rest hold a still frame, so an open panel
 * costs almost nothing.
 */
@Component({
  selector: 'app-celebration-tiles',
  standalone: true,
  template: `
    <div class="cel-grid" role="radiogroup" [attr.aria-label]="label()">
      @if (allowNone()) {
        <button type="button" role="radio" class="cel-tile none" [class.on]="!selected()" [attr.aria-checked]="!selected()"
                (click)="picked.emit(null)" title="No celebration">
          <span class="cel-stage"><span class="cel-none-mark">∅</span></span>
          <span class="cel-name">None</span>
        </button>
      }
      @for (c of options; track c.id; let i = $index) {
        <button type="button" role="radio" class="cel-tile" [class.on]="selected() === c.id" [attr.aria-checked]="selected() === c.id"
                [title]="c.hint" (click)="picked.emit(c.id)"
                (mouseenter)="hover.set(c.id)" (mouseleave)="hover.set(null)" (focus)="hover.set(c.id)" (blur)="hover.set(null)">
          <span class="cel-stage"><canvas #tile [attr.data-kind]="c.id" width="160" height="90"></canvas></span>
          <span class="cel-name"><span aria-hidden="true">{{ c.icon }}</span> {{ c.label }}</span>
        </button>
      }
    </div>
  `,
  styles: [`
    .cel-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 6px; }
    .cel-tile { display: grid; gap: 4px; padding: 4px; border-radius: 8px; border: 1px solid var(--border, #1e2433);
      background: rgba(255, 255, 255, 0.03); color: inherit; cursor: pointer; text-align: left; }
    .cel-tile:hover { border-color: rgba(236, 72, 153, 0.55); }
    .cel-tile.on { border-color: #ec4899; background: rgba(236, 72, 153, 0.14); box-shadow: 0 0 0 1px #ec4899 inset; }
    .cel-tile:focus-visible { outline: 2px solid #f9a8d4; outline-offset: 1px; }
    .cel-stage { position: relative; display: block; aspect-ratio: 16 / 9; border-radius: 5px; overflow: hidden;
      background: radial-gradient(120% 90% at 50% 0%, #334155 0%, #0f172a 70%); }
    .cel-stage canvas { width: 100%; height: 100%; display: block; }
    .cel-none-mark { position: absolute; inset: 0; display: grid; place-items: center; font-size: 1.2rem; opacity: 0.5; }
    .cel-name { font-size: 0.72rem; font-weight: 600; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  `],
})
export class CelebrationTilesComponent implements OnDestroy {
  readonly selected = input<string | null>(null);
  readonly allowNone = input(false);
  readonly label = input('Celebration');
  readonly picked = output<CelebrationKind | null>();

  readonly options = CELEBRATIONS;
  readonly hover = signal<string | null>(null);

  private readonly tiles = viewChildren<ElementRef<HTMLCanvasElement>>('tile');
  private readonly zone = inject(NgZone);
  private readonly painters = new Map<string, CelebrationPainter>();
  private raf = 0;
  private stopped = false;
  private readonly started = performance.now();
  /** Tiles drawn once as a still, so they are not redrawn every frame. */
  private readonly stills = new Set<string>();

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
    const loop = ((performance.now() - this.started) / 1000) % LOOP_SECONDS;
    for (const ref of this.tiles()) {
      const canvas = ref.nativeElement;
      const kind = canvas.dataset['kind'] as CelebrationKind;
      const moving = this.hover() === kind || this.selected() === kind;
      if (!moving && this.stills.has(kind)) continue;
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;
      let painter = this.painters.get(kind);
      if (!painter) {
        painter = new CelebrationPainter(kind, { density: 70, size: 2 }, `tile-${kind}`, LOOP_SECONDS, 1280, 720);
        this.painters.set(kind, painter);
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      painter.draw(ctx, moving ? loop : 2.2);
      if (moving) this.stills.delete(kind); else this.stills.add(kind);
    }
  };
}
