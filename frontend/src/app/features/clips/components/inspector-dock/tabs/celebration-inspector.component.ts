import { DecimalPipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { CelebrationKind, CelebrationMode, celebrationOption } from '../../../services/celebration';
import { StudioStateService } from '../../../services/studio-state.service';
import { CelebrationTilesComponent } from '../../celebration/celebration-tiles.component';

/**
 * Celebrations in the Effects tab: pick one to drop it at the playhead on FX1, or - with a
 * celebration selected - change its kind, amount, size, speed and length.
 */
@Component({
  selector: 'app-celebration-inspector',
  standalone: true,
  imports: [FormsModule, DecimalPipe, CelebrationTilesComponent],
  template: `
    <div class="cel-card">
      <div class="cel-head">
        <span class="cel-icon" aria-hidden="true">🎉</span>
        <div>
          <div class="cel-title">{{ item() ? 'Celebration' : 'Celebrations' }}</div>
          <div class="cel-sub">{{ item() ? 'Change it, or pick another kind below' : 'Click one to drop it at the playhead - it plays over everything' }}</div>
        </div>
      </div>

      <app-celebration-tiles [selected]="item()?.src ?? null" (picked)="pick($event)"
                             [label]="item() ? 'Change celebration' : 'Add a celebration'" />

      @if (item(); as it) {
        @let c = it.celebration ?? {};
        <div class="cel-seg" role="radiogroup" aria-label="How it plays">
          <button type="button" role="radio" [class.on]="(c.mode ?? 'burst') === 'burst'" [attr.aria-checked]="(c.mode ?? 'burst') === 'burst'"
                  (click)="set(it.id, { mode: 'burst' })" title="One shower that falls (or rises) and is gone">Once</button>
          <button type="button" role="radio" [class.on]="c.mode === 'rain'" [attr.aria-checked]="c.mode === 'rain'"
                  (click)="set(it.id, { mode: 'rain' })" title="Keeps coming for as long as it lasts">Keep going</button>
        </div>
        <label class="cel-slider"><span>Amount</span>
          <input type="range" min="1" max="100" step="1" [ngModel]="c.density ?? 50" (ngModelChange)="set(it.id, { density: +$event })" />
          <span class="mono">{{ c.density ?? 50 }}</span></label>
        <label class="cel-slider"><span>Size</span>
          <input type="range" min="0.5" max="2" step="0.05" [ngModel]="c.size ?? 1" (ngModelChange)="set(it.id, { size: +$event })" />
          <span class="mono">{{ (c.size ?? 1) * 100 | number:'1.0-0' }}%</span></label>
        <label class="cel-slider"><span>Speed</span>
          <input type="range" min="0.5" max="2" step="0.05" [ngModel]="c.speed ?? 1" (ngModelChange)="set(it.id, { speed: +$event })" />
          <span class="mono">{{ (c.speed ?? 1) * 100 | number:'1.0-0' }}%</span></label>
        <label class="cel-slider"><span>Length</span>
          <input type="range" min="1" max="30" step="0.5" [ngModel]="it.duration" (ngModelChange)="state.setCelebrationDuration(it.id, +$event)" />
          <span class="mono">{{ it.duration | number:'1.1-1' }}s</span></label>
        <div class="cel-actions">
          <button type="button" class="cel-btn primary" (click)="playIt(it.startTime)">▶ Play it</button>
          <button type="button" class="cel-btn" (click)="state.removeTimelineItem(it.id)">✕ Remove</button>
        </div>
        <p class="cel-hint">The monitor shows the particles the export draws. Drag the FX1 bar to move it.</p>
      }
    </div>
  `,
  styles: [`
    .cel-card { background: var(--surface-2, #161b27); border: 1px solid var(--border, #1e2433); border-radius: 8px;
      padding: 12px; display: flex; flex-direction: column; gap: 10px; }
    .cel-head { display: flex; gap: 8px; align-items: flex-start; }
    .cel-icon { font-size: 1.1rem; line-height: 1.2; }
    .cel-title { font-weight: 700; font-size: 0.86rem; }
    .cel-sub { font-size: 0.72rem; opacity: 0.65; }
    .cel-seg { display: inline-flex; align-self: flex-start; padding: 2px; border-radius: 999px; border: 1px solid var(--border, #1e2433); }
    .cel-seg button { border: 0; background: transparent; color: inherit; opacity: 0.7; padding: 3px 12px; border-radius: 999px;
      font-size: 0.75rem; font-weight: 600; cursor: pointer; }
    .cel-seg button.on { background: #ec4899; color: #fff; opacity: 1; }
    .cel-slider { display: grid; grid-template-columns: 56px 1fr 44px; align-items: center; gap: 8px; font-size: 0.76rem; margin: 0; }
    .cel-slider input { width: 100%; accent-color: #ec4899; }
    .mono { font-variant-numeric: tabular-nums; font-family: ui-monospace, monospace; font-size: 0.72rem; text-align: right; }
    .cel-actions { display: flex; gap: 6px; }
    .cel-btn { flex: 1; padding: 5px 8px; border-radius: 6px; border: 1px solid var(--border, #1e2433); background: rgba(255, 255, 255, 0.04);
      color: inherit; font-size: 0.76rem; cursor: pointer; }
    .cel-btn.primary { background: #ec4899; border-color: #ec4899; color: #fff; font-weight: 600; }
    .cel-hint { margin: 0; font-size: 0.7rem; opacity: 0.55; }
  `],
})
export class CelebrationInspectorComponent {
  readonly state = inject(StudioStateService);

  /** The selected timeline item, when it is a celebration. */
  readonly item = computed(() => {
    const it = this.state.selectedTimelineItem();
    return it?.type === 'celebration' ? it : null;
  });

  pick(kind: CelebrationKind | null): void {
    if (!kind) return;
    const it = this.item();
    if (it) {
      this.state.updateCelebration(it.id, { kind });
      this.state.status.notify([`Changed to ${celebrationOption(kind)?.label ?? kind}.`]);
    } else {
      this.state.addCelebration(kind);
    }
  }

  set(id: string, patch: { mode?: CelebrationMode; density?: number; size?: number; speed?: number }): void {
    this.state.updateCelebration(id, patch);
  }

  playIt(start: number): void {
    this.state.seekTo(start);
    this.state.play();
  }
}
