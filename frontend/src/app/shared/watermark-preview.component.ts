import { Component, computed, input } from '@angular/core';

import { WatermarkBody } from '../core/models/api.models';

/**
 * A frame of the finished video with the watermark where the renderer will put it.
 * <p>
 * The geometry is ClipPlanFactory.CreateWatermark's, in container-query units instead of
 * pixels: the mark's height and its inset are fractions of the canvas HEIGHT, a logo is
 * capped at 35% of the width, and an upright canvas gets the mobile safe margin (at least
 * 32px of canvas or 5% of its width). So the preview at any size is the export scaled
 * down - not a guess at it - and switching 16:9 to 9:16 moves the mark exactly as the
 * render will.
 * </p>
 */
@Component({
  selector: 'app-watermark-preview',
  template: `
    <div class="wp-frame" [style.aspect-ratio]="width() + ' / ' + height()"
         [style.height.px]="boxHeight()" [style.width.px]="boxHeight() ? boxHeight()! * width() / height() : null"
         [class.has-image]="!!background()"
         [style.background-image]="background() ? 'url(' + background() + ')' : null">
      @if (!background()) {
        <div class="wp-scene" aria-hidden="true">
          <span class="wp-sun"></span><span class="wp-hill a"></span><span class="wp-hill b"></span>
        </div>
      }
      @if (mark(); as m) {
        <div class="wp-mark" [style]="m.style">
          @if (m.kind === 'Logo') {
            @if (logoUrl(); as url) {
              <img [src]="url" alt="" [style.opacity]="m.opacity" />
            } @else {
              <span class="wp-missing">No logo uploaded</span>
            }
          } @else {
            <span class="wp-text" [style.color]="m.color" [style.opacity]="m.opacity"
                  [style.background]="'rgba(0,0,0,' + m.backplate + ')'">{{ m.text }}</span>
          }
        </div>
      } @else if (showNone()) {
        <span class="wp-none">No watermark</span>
      }
      @if (label(); as l) { <span class="wp-label">{{ l }}</span> }
    </div>
  `,
  styles: [`
    :host { display: block; flex-shrink: 0; }
    .wp-frame {
      position: relative; width: 100%; overflow: hidden; flex-shrink: 0;
      border-radius: 6px; border: 1px solid var(--border, #1e2433);
      container-type: size; background: #0b1020 center / cover no-repeat;
    }
    .wp-scene { position: absolute; inset: 0;
      background: linear-gradient(180deg, #1e3a5f 0%, #3b5a7a 55%, #22324a 100%); }
    .wp-sun { position: absolute; width: 18cqh; height: 18cqh; border-radius: 50%;
      left: 62%; top: 22%; background: radial-gradient(circle, #ffd27a, #f59e0b 70%, transparent 72%); }
    .wp-hill { position: absolute; bottom: -20cqh; border-radius: 50%; }
    .wp-hill.a { left: -10%; width: 80%; height: 55cqh; background: #1f3b2d; }
    .wp-hill.b { right: -15%; width: 75%; height: 45cqh; background: #2c4a36; }
    .wp-mark { position: absolute; display: flex; }
    .wp-mark img { height: 100%; max-width: 35cqw; object-fit: contain; display: block; }
    .wp-text { font-weight: 700; line-height: 1; padding: 0 0.25em; white-space: nowrap;
      font-family: 'Segoe UI', system-ui, sans-serif; }
    .wp-missing, .wp-none { font-size: 0.7rem; color: #cbd5e1; background: rgba(0,0,0,.55);
      padding: 2px 6px; border-radius: 4px; border: 1px dashed #475569; white-space: nowrap; }
    .wp-none { position: absolute; left: 50%; top: 50%; translate: -50% -50%; }
    .wp-label { position: absolute; left: 6px; bottom: 6px; font-size: 0.65rem; color: #e2e8f0;
      background: rgba(0,0,0,.55); padding: 1px 6px; border-radius: 4px; }
  `],
})
export class WatermarkPreviewComponent {
  readonly watermark = input<WatermarkBody | null | undefined>(null);
  /** Canvas size in pixels. Only the ratio is used for the frame; the pixels set the safe margin. */
  readonly width = input(1920);
  readonly height = input(1080);
  readonly logoUrl = input<string | null>(null);
  /** A real frame to show behind the mark - a thumbnail. Null draws a neutral scene. */
  readonly background = input<string | null>(null);
  readonly label = input<string | null>(null);
  readonly showNone = input(true);
  /** Fixed height in px, width following the aspect - keeps an upright canvas from towering. */
  readonly boxHeight = input<number | null>(null);

  readonly mark = computed(() => {
    const w = this.watermark();
    if (!w || w.kind === 'None') return null;
    return {
      kind: w.kind,
      style: watermarkMarkStyle(w, this.width(), this.height()),
      opacity: w.opacity,
      color: w.colorHex || '#ffffff',
      backplate: w.backplateOpacity ?? 0,
      text: w.text || 'yoursite.example',
    };
  });
}

/**
 * Where and how big ClipPlanFactory.CreateWatermark draws the corner mark, as CSS in
 * container-query units of a frame that is a size container: height and inset are
 * fractions of the canvas HEIGHT, and an upright canvas gets the mobile safe margin (at
 * least 32px of canvas or 5% of its width). Shared with the editor's monitor so the
 * preview there is the export scaled down, not a fixed-pixel guess at it.
 */
export function watermarkMarkStyle(w: WatermarkBody, canvasWidth: number, canvasHeight: number): Record<string, string> {
  const cw = canvasWidth, ch = canvasHeight;
  const size = Math.max(8 / ch, w.heightFraction) * 100;          // cqh
  let margin = Math.max(0, w.marginFraction) * 100;                // cqh
  if (ch > cw) {
    // The renderer's vertical safe area, converted from canvas pixels to cqh.
    const safePx = Math.max(32, Math.round(cw * 0.05));
    margin = Math.max(margin, (safePx / ch) * 100);
  }

  const pos = w.position;
  const style: Record<string, string> = { height: `${size}cqh` };
  if (pos.startsWith('Top')) style['top'] = `${margin}cqh`; else style['bottom'] = `${margin}cqh`;
  if (pos.endsWith('Left')) style['left'] = `${margin}cqh`;
  else if (pos.endsWith('Right')) style['right'] = `${margin}cqh`;
  else { style['left'] = '50%'; style['translate'] = '-50% 0'; }
  if (w.kind === 'Text') style['font-size'] = `${size}cqh`;
  return style;
}
