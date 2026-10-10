import { Component, ElementRef, HostListener, ViewChild, computed, effect, inject, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { OverlayShape } from '../../../../core/models/api.models';
import { StudioStateService } from '../../services/studio-state.service';
import { FrameCrop, FrameImage, MAX_CROP_EDGE } from '../../services/text-overlay-layout';
import { MAX_BORDER_WIDTH, SHAPES, measureMediaAspect, shapeRadius } from '../../services/frame-media';

/** Crop window in percent of the source: left/top corner and size. */
interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

type Handle = 'move' | 'nw' | 'ne' | 'sw' | 'se';

/** Width:height locks offered above the picture. null is free. */
const RATIOS: { id: string; label: string; ratio: number | null }[] = [
  { id: 'free', label: 'Free', ratio: null },
  { id: '1:1', label: '1:1', ratio: 1 },
  { id: '4:5', label: '4:5', ratio: 4 / 5 },
  { id: '9:16', label: '9:16', ratio: 9 / 16 },
  { id: '16:9', label: '16:9', ratio: 16 / 9 },
  { id: '3:2', label: '3:2', ratio: 3 / 2 },
];

/** Smallest crop side, in percent of the source; matches MAX_CROP_EDGE leaving 1%. */
const MIN_SIDE = 100 - 2 * MAX_CROP_EDGE;

/**
 * Crop & shape editor for a frame picture or video. Nothing is cut out of the file: the
 * crop, shape and ring are kept on the layer, so they can be changed again at any time and
 * the export applies exactly what this shows.
 */
@Component({
  selector: 'app-frame-crop-dialog',
  standalone: true,
  imports: [FormsModule, DecimalPipe],
  templateUrl: './frame-crop-dialog.component.html',
  styleUrls: ['./frame-crop-dialog.component.css'],
})
export class FrameCropDialogComponent {
  readonly state = inject(StudioStateService);
  readonly ratios = RATIOS;
  readonly shapes = SHAPES;
  readonly maxBorder = MAX_BORDER_WIDTH;
  readonly ringSwatches = ['#ffffff', '#facc15', '#ef4444', '#22c55e', '#0ea5e9', '#a855f7', '#f97316', '#000000'];

  @ViewChild('stage') stageRef?: ElementRef<HTMLElement>;
  @ViewChild('preview') previewVideoRef?: ElementRef<HTMLVideoElement>;

  readonly layer = this.state.cropLayer;
  readonly rect = signal<Rect>({ x: 0, y: 0, w: 100, h: 100 });
  readonly ratioId = signal('free');
  readonly shape = signal<OverlayShape>('rect');
  readonly borderWidth = signal(0);
  readonly borderColor = signal('#ffffff');
  readonly trimStart = signal(0);
  /** Width / height of the source in pixels. */
  readonly sourceAspect = signal<number | null>(null);

  /** Width / height of the crop as it will be drawn. */
  readonly cropAspect = computed(() => {
    const a = this.sourceAspect();
    const r = this.rect();
    return a && r.h > 0 ? (a * r.w) / r.h : 1;
  });

  readonly radius = computed(() => shapeRadius(this.shape(), this.cropAspect()));

  /** The locked width:height, or null when free. A circle is always 1:1. */
  readonly lockedRatio = computed<number | null>(() =>
    this.shape() === 'circle' ? 1 : RATIOS.find((r) => r.id === this.ratioId())?.ratio ?? null);

  private loadedFor: string | null = null;

  constructor() {
    // Loads the layer's settings each time the dialog opens on a (different) layer.
    effect(() => {
      const layer = this.layer();
      untracked(() => this.load(layer));
    });
  }

  private load(layer: FrameImage | null): void {
    if (!layer) {
      this.loadedFor = null;
      return;
    }
    if (this.loadedFor === layer.id) return;
    this.loadedFor = layer.id;

    const c = layer.crop;
    this.rect.set({ x: c.left, y: c.top, w: 100 - c.left - c.right, h: 100 - c.top - c.bottom });
    this.shape.set(layer.shape);
    this.borderWidth.set(layer.borderWidth);
    this.borderColor.set(layer.borderColor);
    this.trimStart.set(layer.trimStart);
    this.ratioId.set('free');
    this.sourceAspect.set(layer.sourceAspect);
    if (!layer.sourceAspect) {
      void measureMediaAspect(this.state.assetUrl(layer.assetId), layer.kind).then((a) => {
        if (a && this.loadedFor === layer.id) this.sourceAspect.set(a);
      });
    }
  }

  // --- choices ---

  setRatio(id: string): void {
    this.ratioId.set(id);
    this.fitToRatio();
  }

  setShape(shape: OverlayShape): void {
    this.shape.set(shape);
    if (shape === 'circle') this.fitToRatio();
  }

  /** The largest window of the locked ratio that fits, centred on the current one. */
  private fitToRatio(): void {
    const ratio = this.lockedRatio();
    const a = this.sourceAspect();
    if (!ratio || !a) return;
    const r = this.rect();
    // In percent: h% = w% * sourceAspect / ratio.
    let w = r.w;
    let h = (w * a) / ratio;
    if (h > 100) {
      h = 100;
      w = (h * ratio) / a;
    }
    if (w > 100) {
      w = 100;
      h = (w * a) / ratio;
    }
    const cx = r.x + r.w / 2;
    const cy = r.y + r.h / 2;
    this.rect.set(this.clampRect({ x: cx - w / 2, y: cy - h / 2, w, h }));
  }

  /** Picking a colour with no ring yet means "give it a ring". */
  pickRingColor(color: string): void {
    this.borderColor.set(color);
    if (this.borderWidth() === 0) this.borderWidth.set(4);
  }

  reset(): void {
    this.rect.set({ x: 0, y: 0, w: 100, h: 100 });
    this.ratioId.set('free');
    if (this.shape() === 'circle') this.fitToRatio();
  }

  // --- dragging the window ---

  startDrag(event: PointerEvent, handle: Handle): void {
    if (event.button !== 0) return;
    const stage = this.stageRef?.nativeElement;
    if (!stage) return;
    event.preventDefault();
    event.stopPropagation();
    const target = event.currentTarget as HTMLElement;
    target.setPointerCapture(event.pointerId);

    const box = stage.getBoundingClientRect();
    const start = this.rect();
    const x0 = event.clientX, y0 = event.clientY;
    const a = this.sourceAspect() ?? 1;

    const onMove = (e: PointerEvent) => {
      const dx = ((e.clientX - x0) / box.width) * 100;
      const dy = ((e.clientY - y0) / box.height) * 100;
      if (handle === 'move') {
        this.rect.set({
          ...start,
          x: Math.min(100 - start.w, Math.max(0, start.x + dx)),
          y: Math.min(100 - start.h, Math.max(0, start.y + dy)),
        });
        return;
      }

      // The corner opposite the one dragged stays put.
      const left = handle === 'nw' || handle === 'sw';
      const top = handle === 'nw' || handle === 'ne';
      const anchorX = left ? start.x + start.w : start.x;
      const anchorY = top ? start.y + start.h : start.y;
      let w = Math.max(MIN_SIDE, left ? start.w - dx : start.w + dx);
      let h = Math.max(MIN_SIDE, top ? start.h - dy : start.h + dy);
      w = Math.min(w, left ? anchorX : 100 - anchorX);
      h = Math.min(h, top ? anchorY : 100 - anchorY);

      const ratio = this.lockedRatio();
      if (ratio) {
        // Follow whichever side moved more, then shrink both to fit the frame.
        const hFromW = (w * a) / ratio;
        if (hFromW <= h) h = hFromW;
        else w = (h * ratio) / a;
        const maxH = top ? anchorY : 100 - anchorY;
        const maxW = left ? anchorX : 100 - anchorX;
        if (h > maxH) { h = maxH; w = (h * ratio) / a; }
        if (w > maxW) { w = maxW; h = (w * a) / ratio; }
      }

      this.rect.set({ x: left ? anchorX - w : anchorX, y: top ? anchorY - h : anchorY, w, h });
    };
    const onUp = (e: PointerEvent) => {
      target.releasePointerCapture(e.pointerId);
      target.removeEventListener('pointermove', onMove);
      target.removeEventListener('pointerup', onUp);
      target.removeEventListener('pointercancel', onUp);
    };
    target.addEventListener('pointermove', onMove);
    target.addEventListener('pointerup', onUp);
    target.addEventListener('pointercancel', onUp);
  }

  private clampRect(r: Rect): Rect {
    const w = Math.min(100, Math.max(MIN_SIDE, r.w));
    const h = Math.min(100, Math.max(MIN_SIDE, r.h));
    return { w, h, x: Math.min(100 - w, Math.max(0, r.x)), y: Math.min(100 - h, Math.max(0, r.y)) };
  }

  // --- video ---

  onVideoReady(video: HTMLVideoElement): void {
    if (Math.abs(video.currentTime - this.trimStart()) > 0.05) video.currentTime = this.trimStart();
  }

  setTrimStart(value: number): void {
    const v = Number.isFinite(value) ? Math.max(0, value) : 0;
    this.trimStart.set(v);
    const video = this.previewVideoRef?.nativeElement;
    if (video) video.currentTime = v;
  }

  // --- result ---

  /** The kept part of the source, shown in the little result preview. */
  resultStyle(): Record<string, string> {
    const r = this.rect();
    return {
      width: `${(100 * 100) / r.w}%`,
      height: `${(100 * 100) / r.h}%`,
      left: `${(-r.x * 100) / r.w}%`,
      top: `${(-r.y * 100) / r.h}%`,
    };
  }

  apply(): void {
    const layer = this.layer();
    if (!layer) return;
    const r = this.rect();
    const round = (v: number) => Math.round(v * 100) / 100;
    const crop: FrameCrop = {
      left: round(r.x),
      top: round(r.y),
      right: round(Math.max(0, 100 - r.x - r.w)),
      bottom: round(Math.max(0, 100 - r.y - r.h)),
    };
    this.state.updateFrameImage(layer.id, {
      crop,
      shape: this.shape(),
      borderWidth: this.borderWidth(),
      borderColor: this.borderColor(),
      trimStart: this.trimStart(),
      ...(this.sourceAspect() ? { sourceAspect: this.sourceAspect()! } : {}),
    });
    this.close();
  }

  close(): void {
    this.state.closeFrameCrop();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.layer()) this.close();
  }
}
