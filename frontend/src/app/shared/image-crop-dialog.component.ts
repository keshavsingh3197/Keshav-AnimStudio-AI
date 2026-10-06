import { Component, DestroyRef, ElementRef, effect, inject, input, output, signal, untracked, viewChild } from '@angular/core';

/** A crop rectangle in the image's own pixels. */
interface Box { x: number; y: number; w: number; h: number; }

type Drag =
  | { mode: 'move'; startX: number; startY: number; from: Box }
  | { mode: 'resize'; handle: Handle; from: Box }
  | { mode: 'draw'; anchorX: number; anchorY: number };

type Handle = 'nw' | 'ne' | 'sw' | 'se';

const MIN_SIDE = 16;

/**
 * Crop (and rotate) an image before it is uploaded: drag a box over it, or drag its corners,
 * then "Use crop". Emits the result as a PNG `File`; the original is never touched.
 *
 *   @if (cropSource(); as src) {
 *     <app-image-crop-dialog [source]="src" [square]="true"
 *                            (cropped)="upload($event)" (cancelled)="cropSource.set(null)" />
 *   }
 */
@Component({
  selector: 'app-image-crop-dialog',
  standalone: true,
  host: { '(document:keydown.escape)': 'cancelled.emit()' },
  template: `
    <div class="crop-backdrop" (click)="cancelled.emit()">
      <div class="crop-dialog" role="dialog" aria-modal="true" [attr.aria-label]="title()" (click)="$event.stopPropagation()">
        <div class="crop-head">
          <h4>✂ {{ title() }}</h4>
          <button type="button" class="crop-x" aria-label="Close" (click)="cancelled.emit()">✕</button>
        </div>
        <p class="crop-hint">Drag on the image to draw a box, drag the box to move it, drag its corners to resize.</p>

        <div class="crop-stage">
          @if (url(); as src) {
            <div #frame class="crop-frame"
                 (pointerdown)="onPointerDown($event)" (pointermove)="onPointerMove($event)"
                 (pointerup)="endDrag($event)" (pointercancel)="endDrag($event)">
              <img [src]="src" alt="Image to crop" draggable="false" (load)="onLoaded($event)" />
              @if (box(); as b) {
                <div class="crop-box" [style.left.%]="pct(b.x, 'w')" [style.top.%]="pct(b.y, 'h')"
                     [style.width.%]="pct(b.w, 'w')" [style.height.%]="pct(b.h, 'h')" data-part="box">
                  @for (h of handles; track h) {
                    <span [class]="'crop-handle crop-' + h" [attr.data-handle]="h"></span>
                  }
                </div>
              }
            </div>
          }
        </div>

        <div class="crop-tools">
          <label class="crop-check">
            <input type="checkbox" [checked]="lockSquare()" (change)="toggleSquare()" /> Keep it square
          </label>
          <button type="button" class="btn-outline" (click)="rotate()">⟳ Rotate 90°</button>
          <button type="button" class="btn-outline" (click)="selectAll()">Whole image</button>
          @if (box(); as b) {
            <span class="crop-size">{{ round(b.w) }} × {{ round(b.h) }} px</span>
          }
        </div>

        <div class="crop-actions">
          <button type="button" class="btn-outline" (click)="cancelled.emit()">Cancel</button>
          <button type="button" class="btn-primary" [disabled]="!box() || busy()" (click)="confirm()">
            {{ busy() ? 'Cropping…' : 'Use crop' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .crop-backdrop { position: fixed; inset: 0; z-index: 1000; background: rgba(2, 6, 23, 0.75);
      display: flex; align-items: center; justify-content: center; padding: 16px; }
    .crop-dialog { background: #0f172a; border: 1px solid rgba(148, 163, 184, 0.2); border-radius: 12px;
      padding: 1rem 1.25rem; width: min(760px, 100%); max-height: calc(100vh - 32px); overflow: auto;
      color: #e2e8f0; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5); }
    .crop-head { display: flex; align-items: center; justify-content: space-between; }
    .crop-head h4 { margin: 0; font-size: 1rem; }
    .crop-x { background: none; border: none; color: #8b9bb4; font-size: 1rem; cursor: pointer; }
    .crop-hint { margin: 0.35rem 0 0.75rem; font-size: 0.78rem; color: #8b9bb4; }
    .crop-stage { display: flex; justify-content: center; background: repeating-conic-gradient(#1e293b 0 25%, #0f172a 0 50%) 0 0 / 16px 16px;
      border-radius: 8px; padding: 12px; overflow: hidden; }
    .crop-frame { position: relative; display: inline-block; touch-action: none; user-select: none; cursor: crosshair; line-height: 0; }
    .crop-frame img { display: block; max-width: 100%; max-height: 60vh; pointer-events: none; }
    .crop-box { position: absolute; box-sizing: border-box; border: 2px solid #60a5fa; cursor: move;
      box-shadow: 0 0 0 9999px rgba(2, 6, 23, 0.6); }
    .crop-handle { position: absolute; width: 14px; height: 14px; background: #fff; border: 2px solid #3b82f6; border-radius: 3px; }
    .crop-nw { left: -8px; top: -8px; cursor: nwse-resize; }
    .crop-ne { right: -8px; top: -8px; cursor: nesw-resize; }
    .crop-sw { left: -8px; bottom: -8px; cursor: nesw-resize; }
    .crop-se { right: -8px; bottom: -8px; cursor: nwse-resize; }
    .crop-tools { display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; margin-top: 0.75rem; }
    .crop-check { display: flex; gap: 0.35rem; align-items: center; font-size: 0.85rem; cursor: pointer; }
    .crop-size { font-size: 0.78rem; color: #8b9bb4; margin-left: auto; }
    .crop-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1rem; }
  `],
})
export class ImageCropDialogComponent {
  readonly source = input.required<Blob>();
  readonly title = input('Crop image');
  /** Starts with the square lock on - right for QR codes and logos. */
  readonly square = input(false);
  readonly fileName = input('cropped.png');

  readonly cropped = output<File>();
  readonly cancelled = output<void>();

  readonly handles: readonly Handle[] = ['nw', 'ne', 'sw', 'se'];
  readonly url = signal<string | null>(null);
  readonly box = signal<Box | null>(null);
  readonly lockSquare = signal(false);
  readonly busy = signal(false);

  private readonly frame = viewChild<ElementRef<HTMLDivElement>>('frame');
  private image: HTMLImageElement | null = null;
  private natW = 1;
  private natH = 1;
  private drag: Drag | null = null;

  constructor() {
    effect(() => {
      const square = this.square();
      untracked(() => this.lockSquare.set(square));
    });
    effect(() => {
      const source = this.source();
      untracked(() => this.show(source));
    });
    inject(DestroyRef).onDestroy(() => this.revoke());
  }

  round(n: number): number {
    return Math.round(n);
  }

  pct(value: number, axis: 'w' | 'h'): number {
    return (value / (axis === 'w' ? this.natW : this.natH)) * 100;
  }

  onLoaded(event: Event): void {
    this.image = event.target as HTMLImageElement;
    this.natW = this.image.naturalWidth || 1;
    this.natH = this.image.naturalHeight || 1;
    this.box.set(this.initialBox());
  }

  toggleSquare(): void {
    this.lockSquare.update((v) => !v);
    const b = this.box();
    if (this.lockSquare() && b) {
      const side = Math.min(b.w, b.h);
      this.box.set(this.clamp({ x: b.x + (b.w - side) / 2, y: b.y + (b.h - side) / 2, w: side, h: side }));
    }
  }

  selectAll(): void {
    this.box.set(this.lockSquare() ? this.initialBox() : { x: 0, y: 0, w: this.natW, h: this.natH });
  }

  /** Bakes a 90° turn into a new source image, so the crop always works on upright pixels. */
  rotate(): void {
    const img = this.image;
    if (!img) return;
    const canvas = document.createElement('canvas');
    canvas.width = this.natH;
    canvas.height = this.natW;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.translate(canvas.width, 0);
    ctx.rotate(Math.PI / 2);
    ctx.drawImage(img, 0, 0);
    canvas.toBlob((blob) => { if (blob) this.show(blob); }, 'image/png');
  }

  // --- Dragging -------------------------------------------------------------------------

  onPointerDown(event: PointerEvent): void {
    if (event.button !== 0) return;
    const target = event.target as HTMLElement;
    const p = this.toImage(event);
    const b = this.box();
    const handle = target.dataset['handle'] as Handle | undefined;

    if (handle && b) {
      this.drag = { mode: 'resize', handle, from: b };
    } else if (target.dataset['part'] === 'box' && b) {
      this.drag = { mode: 'move', startX: p.x, startY: p.y, from: b };
    } else {
      this.drag = { mode: 'draw', anchorX: p.x, anchorY: p.y };
    }
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    event.preventDefault();
  }

  onPointerMove(event: PointerEvent): void {
    const drag = this.drag;
    if (!drag) return;
    const p = this.toImage(event);

    if (drag.mode === 'move') {
      const f = drag.from;
      this.box.set({
        ...f,
        x: Math.min(Math.max(f.x + p.x - drag.startX, 0), this.natW - f.w),
        y: Math.min(Math.max(f.y + p.y - drag.startY, 0), this.natH - f.h),
      });
      return;
    }

    // Resizing is drawing from the opposite (fixed) corner.
    let ax: number, ay: number;
    if (drag.mode === 'resize') {
      const f = drag.from;
      ax = drag.handle.includes('w') ? f.x + f.w : f.x;
      ay = drag.handle.includes('n') ? f.y + f.h : f.y;
    } else {
      ax = drag.anchorX;
      ay = drag.anchorY;
    }
    this.box.set(this.fromCorners(ax, ay, p.x, p.y));
  }

  endDrag(event: PointerEvent): void {
    if (!this.drag) return;
    this.drag = null;
    (event.currentTarget as HTMLElement).releasePointerCapture?.(event.pointerId);
    // A click without a drag leaves a tiny box: treat it as "keep what was there".
    const b = this.box();
    if (b && (b.w < MIN_SIDE || b.h < MIN_SIDE)) this.box.set(this.initialBox());
  }

  // --- Output ---------------------------------------------------------------------------

  confirm(): void {
    const img = this.image;
    const b = this.box();
    if (!img || !b) return;
    const w = Math.max(1, Math.round(b.w));
    const h = Math.max(1, Math.round(b.h));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false; // keep QR modules crisp
    ctx.drawImage(img, Math.round(b.x), Math.round(b.y), w, h, 0, 0, w, h);
    this.busy.set(true);
    canvas.toBlob((blob) => {
      this.busy.set(false);
      if (blob) this.cropped.emit(new File([blob], this.fileName(), { type: 'image/png' }));
    }, 'image/png');
  }

  // --- Helpers --------------------------------------------------------------------------

  private show(blob: Blob): void {
    this.revoke();
    this.image = null;
    this.box.set(null);
    this.url.set(URL.createObjectURL(blob));
  }

  private revoke(): void {
    const old = this.url();
    if (old) URL.revokeObjectURL(old);
  }

  /** Pointer position in image pixels, clamped to the image. */
  private toImage(event: PointerEvent): { x: number; y: number } {
    const el = this.frame()?.nativeElement;
    if (!el) return { x: 0, y: 0 };
    const r = el.getBoundingClientRect();
    const x = ((event.clientX - r.left) / r.width) * this.natW;
    const y = ((event.clientY - r.top) / r.height) * this.natH;
    return { x: Math.min(Math.max(x, 0), this.natW), y: Math.min(Math.max(y, 0), this.natH) };
  }

  private fromCorners(ax: number, ay: number, px: number, py: number): Box {
    let w = Math.abs(px - ax);
    let h = Math.abs(py - ay);
    if (this.lockSquare()) {
      // Largest square that fits on the dragged side of the anchor.
      const roomX = px >= ax ? this.natW - ax : ax;
      const roomY = py >= ay ? this.natH - ay : ay;
      w = h = Math.min(Math.max(w, h), roomX, roomY);
    }
    return {
      x: px >= ax ? ax : ax - w,
      y: py >= ay ? ay : ay - h,
      w,
      h,
    };
  }

  private initialBox(): Box {
    if (!this.lockSquare()) return { x: 0, y: 0, w: this.natW, h: this.natH };
    const side = Math.min(this.natW, this.natH);
    return { x: (this.natW - side) / 2, y: (this.natH - side) / 2, w: side, h: side };
  }

  private clamp(b: Box): Box {
    const w = Math.min(b.w, this.natW);
    const h = Math.min(b.h, this.natH);
    return { x: Math.min(Math.max(b.x, 0), this.natW - w), y: Math.min(Math.max(b.y, 0), this.natH - h), w, h };
  }
}
