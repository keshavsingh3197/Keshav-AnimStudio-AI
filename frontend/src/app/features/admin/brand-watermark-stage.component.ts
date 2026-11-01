import { NgTemplateOutlet } from '@angular/common';
import { Component, ElementRef, computed, effect, input, output, signal, viewChild } from '@angular/core';

import { WATERMARK_POSITIONS, type WatermarkPosition } from '../../core/models/api.models';
import { watermarkMarkStyle } from '../../shared/watermark-preview.component';
import {
  POSITION_LABEL, clamp, effectiveInsetPct, nearestPosition, parseRgb, round, stepPosition, uiZones, watermarkBodyFromDraft,
  type Aspect, type PreviewBackdrop, type WatermarkDraft,
} from './branding.logic';

interface DragState {
  readonly startX: number;
  readonly startY: number;
  readonly frame: DOMRect;
}

/**
 * One frame of the finished video with the watermark where the renderer will put it.
 * <p>
 * The mark's geometry is `watermarkMarkStyle`'s (the renderer's, in container units), so the
 * preview is the export scaled down. On top of that: guides for the safe area, the inset the
 * renderer really uses and the rough areas apps draw over, a backdrop switch for checking
 * readability, and drag-to-place - the mark snaps to the nearest of the six allowed anchors
 * (there is no centre; a mark there would cover the picture). The arrow keys do the same.
 * </p>
 */
@Component({
  selector: 'app-brand-watermark-stage',
  imports: [NgTemplateOutlet],
  template: `
    <div class="ws" [class.is-dragging]="dragging()" data-theme="dark">
      <div #frame class="ws-frame" [attr.data-backdrop]="backdrop()" [style.--ar]="ratio()"
           role="group" [attr.aria-label]="groupLabel()">
        @if (backdrop() === 'scene') {
          <div class="ws-scene" aria-hidden="true"><i class="ws-sun"></i><i class="ws-hill a"></i><i class="ws-hill b"></i></div>
        }

        @if (guides()) {
          <div class="ws-guides" aria-hidden="true">
            @if (zones().top > 0) { <i class="ws-zone top" [style.height.%]="zones().top"></i> }
            <i class="ws-zone bottom" [style.height.%]="zones().bottom"></i>
            @if (zones().right; as side) {
              <i class="ws-zone side" [style.width.%]="side.width" [style.top.%]="side.from" [style.height.%]="side.to - side.from"></i>
            }
            <i class="ws-safe"></i>
            <i class="ws-inset" [style.top.cqh]="inset()" [style.bottom.cqh]="inset()" [style.left.cqh]="inset()" [style.right.cqh]="inset()"></i>
          </div>
        }

        @if (dragging()) {
          @for (a of anchors(); track a.position) {
            <i class="ws-anchor" [class.is-hot]="a.position === candidate()" [style]="a.style" aria-hidden="true">
              <ng-container [ngTemplateOutlet]="markBody" />
            </i>
          }
        }

        @if (mark(); as m) {
          <div class="ws-mark" tabindex="0" role="button" [class.is-locked]="!interactive()" [style]="m.style"
               [style.transform]="dragTransform()" [attr.aria-label]="markLabel()"
               (pointerdown)="onPointerDown($event)" (pointermove)="onPointerMove($event)"
               (pointerup)="endDrag($event, true)" (pointercancel)="endDrag($event, false)" (keydown)="onMarkKey($event)">
            <ng-container [ngTemplateOutlet]="markBody" />
          </div>
        } @else {
          <span class="ws-none">No watermark</span>
        }
      </div>
      <span class="sr-only" aria-live="polite">Position: {{ positionName() }}</span>
    </div>

    <ng-template #markBody>
      @if (draft().kind === 'Text') {
        <span class="ws-text" [class.is-placeholder]="!hasText()" [style.color]="ink()" [style.background]="plate()"
              [style.box-shadow]="plateRing()" [style.text-shadow]="shadow()">{{ shownText() }}</span>
      } @else if (logoUrl() && !logoFailed()) {
        <img class="ws-logo" [src]="logoUrl()" alt="" draggable="false" [style.opacity]="draft().opacity" (error)="logoFailed.set(true)" />
      } @else {
        <span class="ws-missing">{{ logoFailed() ? 'Logo not found' : 'Your logo' }}</span>
      }
    </ng-template>
  `,
  styles: [`
    :host { display: block; width: 100%; min-width: 0; }
    .sr-only { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
    .ws { display: flex; justify-content: center; padding: var(--ws-pad, .85rem); border-radius: var(--radius); border: 1px solid var(--border); background: var(--bg); }
    .ws-frame {
      position: relative; flex: none; overflow: hidden; container-type: size;
      width: min(100%, calc(var(--ws-max-h, 420px) * var(--ar, 1.7778))); aspect-ratio: var(--ar, 1.7778);
      border-radius: 9px; border: 1px solid rgba(148, 163, 184, .3); background: #0b0f17;
      box-shadow: 0 12px 32px rgba(0, 0, 0, .5);
    }
    .ws-frame[data-backdrop='dark'] { background: linear-gradient(160deg, #161d2d, #06080d); }
    .ws-frame[data-backdrop='mid'] { background: linear-gradient(160deg, #909090, #6c6c6c); }
    .ws-frame[data-backdrop='bright'] { background: linear-gradient(160deg, #fcfcfc, #e1e1e1); }

    .ws-scene { position: absolute; inset: 0; background: linear-gradient(180deg, #222b3f 0%, #3b5a7a 55%, #222b3f 100%); }
    .ws-sun { position: absolute; width: 18cqh; height: 18cqh; border-radius: 50%; left: 62%; top: 22%; background: radial-gradient(circle, #ffd27a, #f59e0b 70%, transparent 72%); }
    .ws-hill { position: absolute; bottom: -20cqh; border-radius: 50%; }
    .ws-hill.a { left: -10%; width: 80%; height: 55cqh; background: #1f4a3a; }
    .ws-hill.b { right: -15%; width: 75%; height: 45cqh; background: #2b6b45; }

    .ws-guides { position: absolute; inset: 0; pointer-events: none; }
    .ws-zone { position: absolute; background: repeating-linear-gradient(135deg, rgba(244, 67, 80, .34) 0 5px, rgba(244, 67, 80, .12) 5px 10px); }
    .ws-zone.top { top: 0; left: 0; right: 0; }
    .ws-zone.bottom { bottom: 0; left: 0; right: 0; }
    .ws-zone.side { right: 0; }
    .ws-safe { position: absolute; inset: 5cqh 5cqw; border: 1px dashed rgba(255, 255, 255, .9); box-shadow: 0 0 0 1px rgba(0, 0, 0, .4), inset 0 0 0 1px rgba(0, 0, 0, .4); }
    .ws-inset { position: absolute; border: 1px solid #8aa4ff; box-shadow: 0 0 0 1px rgba(0, 0, 0, .4), inset 0 0 0 1px rgba(0, 0, 0, .4); }

    .ws-mark { position: absolute; z-index: 2; display: flex; cursor: grab; touch-action: none; user-select: none; -webkit-user-select: none; border-radius: 3px; }
    .ws-mark::after { content: ''; position: absolute; inset: -12px; }
    .ws-mark:focus-visible { outline: 2px solid #8aa4ff; outline-offset: .45em; }
    .ws-mark.is-locked { cursor: default; }
    .is-dragging .ws-mark { z-index: 5; cursor: grabbing; filter: drop-shadow(0 6px 12px rgba(0, 0, 0, .55)); }
    .ws-text { display: block; font-family: 'Segoe UI', system-ui, sans-serif; font-weight: 700; line-height: 1; white-space: nowrap; }
    .ws-text.is-placeholder { opacity: .6; outline: 1px dashed currentColor; outline-offset: .12em; }
    .ws-logo { display: block; height: 100%; max-width: 35cqw; object-fit: contain; pointer-events: none; }
    .ws-missing, .ws-none {
      display: inline-block; white-space: nowrap; font: 600 .7rem/1 system-ui, sans-serif; padding: 5px 9px; border-radius: 6px;
      color: #dbe3f7; background: rgba(8, 11, 18, .72); border: 1px dashed rgba(219, 227, 247, .5);
    }
    .ws-missing { align-self: center; }
    .ws-none { position: absolute; left: 50%; top: 50%; translate: -50% -50%; }
    .ws-anchor { position: absolute; z-index: 1; display: flex; border: 1px dashed rgba(255, 255, 255, .6); border-radius: 3px; background: rgba(255, 255, 255, .08); pointer-events: none; }
    .ws-anchor > * { visibility: hidden; }
    .ws-anchor.is-hot { border: 2px solid #8aa4ff; background: rgba(108, 140, 255, .32); }
  `],
})
export class BrandWatermarkStageComponent {
  readonly draft = input.required<WatermarkDraft>();
  readonly aspect = input.required<Aspect>();
  readonly logoUrl = input<string | null>(null);
  readonly guides = input(true);
  readonly backdrop = input<PreviewBackdrop>('scene');
  readonly interactive = input(true);
  readonly positionChange = output<WatermarkPosition>();

  private readonly frame = viewChild.required<ElementRef<HTMLElement>>('frame');
  protected readonly dragging = signal(false);
  protected readonly candidate = signal<WatermarkPosition>('TopRight');
  protected readonly logoFailed = signal(false);
  private readonly offset = signal({ x: 0, y: 0 });
  private drag: DragState | null = null;

  protected readonly ratio = computed(() => round(this.aspect().width / this.aspect().height, 4));
  protected readonly positionName = computed(() => POSITION_LABEL[this.draft().position]);
  protected readonly hasText = computed(() => this.draft().text.trim().length > 0);
  protected readonly shownText = computed(() => this.draft().text.trim() || 'Your text');
  protected readonly zones = computed(() => uiZones(this.aspect()));
  protected readonly inset = computed(() => {
    const a = this.aspect();
    return effectiveInsetPct(this.draft().margin, a.width, a.height);
  });

  protected readonly ink = computed(() => {
    const d = this.draft();
    const [r, g, b] = parseRgb(d.color) ?? [255, 255, 255];
    return `rgba(${r}, ${g}, ${b}, ${d.opacity})`;
  });
  /** The renderer's plate is black at its own opacity, independent of the text's. */
  protected readonly plate = computed(() => (this.draft().backplate > 0 ? `rgba(0, 0, 0, ${this.draft().backplate})` : 'transparent'));
  /** The plate extends 30% of the font size beyond the text (drawtext's boxborderw). */
  protected readonly plateRing = computed(() => (this.draft().backplate > 0 ? `0 0 0 .3em rgba(0, 0, 0, ${this.draft().backplate})` : 'none'));
  protected readonly shadow = computed(() => (this.draft().backplate > 0 ? 'none' : '.04em .04em 0 rgba(0, 0, 0, .6)'));

  protected readonly mark = computed(() => {
    const d = this.draft();
    return d.kind === 'None' ? null : { style: this.styleFor(d, d.position) };
  });

  protected readonly anchors = computed(() => {
    const d = this.draft();
    return d.kind === 'None' ? [] : WATERMARK_POSITIONS.map((position) => ({ position, style: this.styleFor(d, position) }));
  });

  protected readonly dragTransform = computed(() => {
    if (!this.dragging()) return null;
    const { x, y } = this.offset();
    return `translate(${x}px, ${y}px)`;
  });

  protected readonly groupLabel = computed(() => {
    const d = this.draft();
    const what = d.kind === 'None' ? 'No watermark' : d.kind === 'Text' ? 'Text watermark' : 'Logo watermark';
    return `${what}, preview at ${this.aspect().label}`;
  });
  protected readonly markLabel = computed(() =>
    `Watermark, ${this.positionName()}. ${this.interactive() ? 'Drag it, or use the arrow keys, to move it.' : ''}`);

  constructor() {
    effect(() => {
      this.logoUrl();
      this.logoFailed.set(false);
    });
  }

  private styleFor(d: WatermarkDraft, position: WatermarkPosition): Record<string, string> {
    const a = this.aspect();
    const body = watermarkBodyFromDraft(d);
    // A text plate grows outward from the text, so the renderer insets the mark by at least that border.
    if (d.kind === 'Text' && d.backplate > 0) body.marginFraction = Math.max(body.marginFraction, body.heightFraction * 0.3);
    return watermarkMarkStyle({ ...body, position }, a.width, a.height);
  }

  protected onPointerDown(event: PointerEvent): void {
    if (!this.interactive() || event.button !== 0) return;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    this.drag = { startX: event.clientX, startY: event.clientY, frame: this.frame().nativeElement.getBoundingClientRect() };
    this.offset.set({ x: 0, y: 0 });
    this.candidate.set(this.draft().position);
    this.dragging.set(true);
    event.preventDefault();
  }

  protected onPointerMove(event: PointerEvent): void {
    const drag = this.drag;
    if (!drag) return;
    const x = clamp((event.clientX - drag.frame.left) / drag.frame.width, 0, 1);
    const y = clamp((event.clientY - drag.frame.top) / drag.frame.height, 0, 1);
    this.candidate.set(nearestPosition(x, y));
    this.offset.set({ x: event.clientX - drag.startX, y: event.clientY - drag.startY });
  }

  protected endDrag(event: PointerEvent, commit: boolean): void {
    if (!this.drag) return;
    this.drag = null;
    (event.currentTarget as HTMLElement).releasePointerCapture?.(event.pointerId);
    const target = this.candidate();
    this.dragging.set(false);
    if (commit && target !== this.draft().position) this.positionChange.emit(target);
  }

  protected onMarkKey(event: KeyboardEvent): void {
    if (!this.interactive()) return;
    const directions: Record<string, 'left' | 'right' | 'up' | 'down'> = {
      ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
    };
    const direction = directions[event.key];
    if (!direction) return;
    event.preventDefault();
    const next = stepPosition(this.draft().position, direction);
    if (next !== this.draft().position) this.positionChange.emit(next);
  }
}
