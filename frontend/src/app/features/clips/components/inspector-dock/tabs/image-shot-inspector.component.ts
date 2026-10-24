import { Component, inject } from '@angular/core';
import { StudioStateService } from '../../../services/studio-state.service';
import { IMAGE_LOOKS, IMAGE_MOTIONS, IMAGE_MOTION_MAX, IMAGE_MOTION_MIN } from '../../../services/cinematic-image';

/**
 * Camera & Look for a picture in the edit: the same moves, grades and lens finish Photo
 * Story offers, set on the picture itself so the monitor plays them and the export draws them.
 */
@Component({
  selector: 'app-image-shot-inspector',
  standalone: true,
  template: `
    @if (state.shotTarget(); as target) {
      @let shot = state.shotSetting();
      <div class="shot">
        <div class="shot-head">
          <span class="shot-title">🎥 Camera &amp; Look</span>
          <span class="shot-name" [title]="target.name">{{ target.name }}</span>
          <button type="button" class="shot-studio-btn" (click)="state.styleStudioOpen.set(true)"
                  title="Open Styles, Effects &amp; Layouts Studio to preview and apply Auto-Short styles to your timeline">
            ✨ Styles Studio
          </button>
        </div>

        <div class="shot-lbl">Camera move</div>
        <div class="shot-grid">
          @for (m of motions; track m.id) {
            <button type="button" class="shot-chip" [class.on]="shot.motion === m.id" [title]="m.hint"
                    (click)="state.updateShot({ motion: m.id })">
              <span class="shot-icon">{{ m.icon }}</span>{{ m.label }}
            </button>
          }
        </div>

        @if (shot.motion !== 'none') {
          <label class="shot-row">
            <span class="shot-k">Strength</span>
            <input type="range" [min]="minIntensity" [max]="maxIntensity" step="0.01" [value]="shot.intensity"
                   (input)="state.updateShot({ intensity: num($event, shot.intensity) })" />
            <span class="shot-v">{{ (shot.intensity * 100).toFixed(0) }}%</span>
          </label>
          <label class="shot-row">
            <span class="shot-k">Focus ↔</span>
            <input type="range" min="0" max="100" step="1" [value]="shot.focusX"
                   (input)="state.updateShot({ focusX: num($event, shot.focusX) })" />
            <span class="shot-v">{{ shot.focusX }}%</span>
          </label>
          <label class="shot-row">
            <span class="shot-k">Focus ↕</span>
            <input type="range" min="0" max="100" step="1" [value]="shot.focusY"
                   (input)="state.updateShot({ focusY: num($event, shot.focusY) })" />
            <span class="shot-v">{{ shot.focusY }}%</span>
          </label>
          <label class="shot-check">
            <input type="checkbox" [checked]="shot.easing === 'ease'"
                   (change)="state.updateShot({ easing: $any($event.target).checked ? 'ease' : 'linear' })" />
            Smooth start and stop
          </label>
        }

        <div class="shot-lbl">Look</div>
        <div class="shot-grid looks">
          @for (l of looks; track l.id) {
            <button type="button" class="shot-chip" [class.on]="shot.look === l.id" (click)="state.updateShot({ look: l.id })">
              <span class="shot-swatch" [style.background]="l.swatch"></span>{{ l.label }}
            </button>
          }
        </div>

        <div class="shot-finish">
          <label class="shot-check"><input type="checkbox" [checked]="shot.vignette"
                 (change)="state.updateShot({ vignette: $any($event.target).checked })" /> Vignette</label>
          <label class="shot-check"><input type="checkbox" [checked]="shot.grain"
                 (change)="state.updateShot({ grain: $any($event.target).checked })" /> Film grain</label>
          <label class="shot-check"><input type="checkbox" [checked]="shot.cinemaBars"
                 (change)="state.updateShot({ cinemaBars: $any($event.target).checked })" /> Cinema bars</label>
        </div>

        @if (target.kind === 'item' && (shot.motion !== 'none' || shot.look !== 'none' || shot.vignette || shot.grain || shot.cinemaBars)) {
          <p class="shot-hint">With a move or look, this picture fills the frame in its slot, as the export draws it.</p>
        }
      </div>
    }
  `,
  styles: [`
    .shot { display: flex; flex-direction: column; gap: 6px; padding: 10px; margin-bottom: 8px;
      border: 1px solid #334155; border-radius: 8px; background: rgba(15, 23, 42, .6); }
    .shot-head { display: flex; align-items: center; gap: 8px; min-width: 0; }
    .shot-title { font-size: .78rem; font-weight: 600; color: #e2e8f0; flex-shrink: 0; }
    .shot-name { font-size: .68rem; color: #64748b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
    .shot-studio-btn { padding: 2px 7px; font-size: .66rem; font-weight: 600; color: #facc15; background: rgba(250, 204, 21, .12);
      border: 1px solid rgba(250, 204, 21, .35); border-radius: 5px; cursor: pointer; flex-shrink: 0; }
    .shot-studio-btn:hover { background: rgba(250, 204, 21, .22); border-color: #facc15; }
    .shot-lbl { font-size: .66rem; color: #94a3b8; text-transform: uppercase; letter-spacing: .04em; margin-top: 2px; }
    .shot-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(84px, 1fr)); gap: 4px; }
    .shot-chip { display: flex; align-items: center; gap: 5px; padding: 4px 6px; font-size: .7rem; color: #cbd5e1;
      background: #0b1020; border: 1px solid #334155; border-radius: 5px; cursor: pointer; text-align: left; }
    .shot-chip:hover { border-color: #64748b; }
    .shot-chip.on { border-color: #6c8cff; color: #fff; background: rgba(108, 140, 255, .18); }
    .shot-icon { width: 12px; text-align: center; opacity: .8; }
    .shot-swatch { width: 12px; height: 12px; border-radius: 3px; flex-shrink: 0; }
    .shot-row { display: flex; align-items: center; gap: 6px; font-size: .7rem; color: #cbd5e1; }
    .shot-row input[type=range] { flex: 1; min-width: 0; }
    .shot-k { width: 58px; flex-shrink: 0; color: #94a3b8; }
    .shot-v { width: 34px; text-align: right; color: #94a3b8; font-variant-numeric: tabular-nums; }
    .shot-check { display: flex; align-items: center; gap: 5px; font-size: .7rem; color: #cbd5e1; cursor: pointer; }
    .shot-finish { display: flex; flex-wrap: wrap; gap: 4px 12px; }
    .shot-hint { margin: 0; font-size: .66rem; color: #64748b; }
  `],
})
export class ImageShotInspectorComponent {
  readonly state = inject(StudioStateService);

  readonly motions = IMAGE_MOTIONS;
  readonly looks = IMAGE_LOOKS;
  readonly minIntensity = IMAGE_MOTION_MIN;
  readonly maxIntensity = IMAGE_MOTION_MAX;

  num(event: Event, fallback: number): number {
    const n = Number((event.target as HTMLInputElement).value);
    return Number.isFinite(n) ? n : fallback;
  }
}
