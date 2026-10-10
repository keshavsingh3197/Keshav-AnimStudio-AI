import { Component, input, output } from '@angular/core';
import { OverlayMotion } from '../../../../../core/models/api.models';
import { MAX_MOTION_SECONDS, MotionOption, isTextReveal } from '../../../services/frame-media';

/** One layer's entrance and exit, as the picker shows and edits them. */
export interface LayerMotionValue {
  in: OverlayMotion;
  inSeconds: number;
  out: OverlayMotion;
  outSeconds: number;
}

/**
 * Entrance and exit for one layer - a text, a picture or the subtitles - each with its
 * length. The same control everywhere a layer animates, so a layer is animated the same
 * way in its own card and in the Animations list.
 */
@Component({
  selector: 'app-motion-picker',
  standalone: true,
  template: `
    <div class="mp" [class.compact]="compact()">
      <div class="mp-row">
        <span class="mp-lbl">In</span>
        <select class="mp-sel" [value]="value().in" (change)="set({ in: $any($event.target).value })" aria-label="Entrance">
          @for (m of inOptions(); track m.id) { <option [value]="m.id" [selected]="m.id === value().in">{{ m.label }}</option> }
        </select>
        <input type="number" class="mp-num" min="0.1" [max]="max" step="0.1" [disabled]="value().in === 'none'"
               [value]="value().inSeconds" (change)="seconds('inSeconds', $any($event.target).value)"
               [title]="isReveal() ? 'Typing time for the whole text (seconds)' : 'Entrance length (seconds)'" />
        <span class="mp-unit">s</span>
      </div>
      <div class="mp-row">
        <span class="mp-lbl">Out</span>
        <select class="mp-sel" [value]="value().out" (change)="set({ out: $any($event.target).value })" aria-label="Exit">
          @for (m of outOptions(); track m.id) { <option [value]="m.id" [selected]="m.id === value().out">{{ m.label }}</option> }
        </select>
        <input type="number" class="mp-num" min="0.1" [max]="max" step="0.1" [disabled]="value().out === 'none'"
               [value]="value().outSeconds" (change)="seconds('outSeconds', $any($event.target).value)"
               title="Exit length (seconds)" />
        <span class="mp-unit">s</span>
      </div>
      @if (isReveal() && !compact()) {
        <p class="mp-hint">Typed left to right over {{ value().inSeconds }}s - at most 90% of the time it is on screen.</p>
      }
    </div>
  `,
  styles: [`
    .mp { display: flex; flex-direction: column; gap: 4px; }
    .mp.compact { flex-direction: row; gap: 8px; flex-wrap: wrap; }
    .mp-row { display: flex; align-items: center; gap: 5px; flex: 1; min-width: 0; }
    .mp-lbl { width: 24px; font-size: .68rem; color: #94a3b8; flex-shrink: 0; }
    .mp-sel { flex: 1; min-width: 0; background: #0b1020; color: #e2e8f0; border: 1px solid #334155;
      border-radius: 4px; font-size: .72rem; padding: 2px 4px; }
    .mp-num { width: 46px; background: #0b1020; color: #e2e8f0; border: 1px solid #334155; border-radius: 4px;
      font-size: .72rem; padding: 2px 4px; }
    .mp-num:disabled { opacity: .4; }
    .mp-unit { font-size: .66rem; color: #64748b; }
    .mp-hint { margin: 0; font-size: .66rem; color: #64748b; padding-left: 29px; }
  `],
})
export class MotionPickerComponent {
  readonly value = input.required<LayerMotionValue>();
  readonly inOptions = input.required<MotionOption[]>();
  readonly outOptions = input.required<MotionOption[]>();
  /** One line, In and Out side by side - for the Animations list. */
  readonly compact = input(false);

  readonly changed = output<Partial<LayerMotionValue>>();

  readonly max = MAX_MOTION_SECONDS;

  isReveal(): boolean {
    return isTextReveal(this.value().in);
  }

  set(patch: Partial<LayerMotionValue>): void {
    // Typing needs time to read: a typed entrance starts at a second and a half, not a fade's half second.
    if (patch.in && isTextReveal(patch.in) && !isTextReveal(this.value().in) && this.value().inSeconds < 1) {
      patch = { ...patch, inSeconds: 1.5 };
    }
    this.changed.emit(patch);
  }

  seconds(key: 'inSeconds' | 'outSeconds', raw: string): void {
    const n = Number(raw);
    if (!Number.isFinite(n)) return;
    this.changed.emit({ [key]: Math.min(MAX_MOTION_SECONDS, Math.max(0.1, n)) });
  }
}
