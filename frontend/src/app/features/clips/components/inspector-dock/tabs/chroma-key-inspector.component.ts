import { DecimalPipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';

import { TimelineChromaKey } from '../../../../../core/models/api.models';
import { DEFAULT_CHROMA_KEY } from '../../../../effects/effect-placement';
import { StudioStateService } from '../../../services/studio-state.service';

/** Overlay lanes a picture or video can be keyed on. */
const KEYABLE_TRACKS = new Set(['V2', 'V3', 'IMG1', 'IMG']);

/**
 * Green screen for the selected picture or video overlay: the backdrop colour is keyed out
 * in the export (ffmpeg colorkey). The monitor still shows the clip as shot, so the panel
 * says so rather than pretending otherwise.
 */
@Component({
  selector: 'app-chroma-key-inspector',
  standalone: true,
  imports: [DecimalPipe],
  template: `
    @if (item(); as it) {
      @let key = current();
      <div class="ck">
        <label class="ck-head">
          <input type="checkbox" [checked]="key.enabled" (change)="set(it.id, { enabled: $any($event.target).checked })" />
          <span class="ck-title">🟩 Green screen (remove a colour)</span>
        </label>
        @if (key.enabled) {
          <div class="ck-row">
            <span class="ck-k">Colour</span>
            <input type="color" [value]="key.color" (input)="set(it.id, { color: $any($event.target).value })" aria-label="Colour to remove" />
            <button type="button" class="ck-chip" (click)="set(it.id, { color: '#00ff00' })" title="Green screen">Green</button>
            <button type="button" class="ck-chip" (click)="set(it.id, { color: '#0000ff' })" title="Blue screen">Blue</button>
          </div>
          <label class="ck-row">
            <span class="ck-k">Range</span>
            <input type="range" min="0.01" max="0.8" step="0.01" [value]="key.similarity"
                   (input)="set(it.id, { similarity: num($event, key.similarity) })" />
            <span class="ck-v">{{ key.similarity | number:'1.2-2' }}</span>
          </label>
          <label class="ck-row">
            <span class="ck-k">Soft edge</span>
            <input type="range" min="0" max="0.5" step="0.01" [value]="key.blend"
                   (input)="set(it.id, { blend: num($event, key.blend) })" />
            <span class="ck-v">{{ key.blend | number:'1.2-2' }}</span>
          </label>
          <p class="ck-hint">Applied in the export. The monitor shows the clip as shot. Raise Range if green edges remain; lower it if the subject turns see-through.</p>
        }
      </div>
    }
  `,
  styles: [`
    .ck { display: flex; flex-direction: column; gap: 8px; padding: 10px; margin: 8px 0; border: 1px solid var(--border); border-radius: 8px; background: rgba(255, 255, 255, .03); }
    .ck-head { display: flex; align-items: center; gap: 8px; cursor: pointer; }
    .ck-head input { width: auto; accent-color: var(--ok, #22d36b); }
    .ck-title { font-size: .8rem; font-weight: 700; }
    .ck-row { display: flex; align-items: center; gap: 8px; }
    .ck-k { width: 64px; flex: none; font-size: .74rem; color: var(--muted); }
    .ck-row input[type='range'] { flex: 1; min-width: 0; }
    .ck-row input[type='color'] { width: 34px; height: 24px; padding: 0; border: 1px solid var(--border); border-radius: 4px; background: none; }
    .ck-v { width: 34px; text-align: right; font-size: .72rem; font-variant-numeric: tabular-nums; color: var(--text-dim); }
    .ck-chip { padding: 2px 8px; font-size: .72rem; border-radius: 99px; border: 1px solid var(--border); background: var(--surface-2, #161b27); color: var(--text-dim); }
    .ck-hint { margin: 0; font-size: .7rem; line-height: 1.4; color: var(--muted); }
  `],
})
export class ChromaKeyInspectorComponent {
  readonly state = inject(StudioStateService);

  /** The selected overlay picture or video, when there is one. */
  readonly item = computed(() => {
    const it = this.state.selectedTimelineItem();
    return it && (it.type === 'video' || it.type === 'image') && KEYABLE_TRACKS.has(it.trackId) ? it : null;
  });

  readonly current = computed<TimelineChromaKey>(() => {
    const key = this.item()?.transform?.chromaKey;
    return key ?? { ...DEFAULT_CHROMA_KEY, enabled: false };
  });

  set(itemId: string, patch: Partial<TimelineChromaKey>): void {
    const next: TimelineChromaKey = { ...this.current(), ...patch };
    if (!/^#[0-9a-fA-F]{6}$/.test(next.color)) return;
    this.state.updateImageItemTransform(itemId, { chromaKey: next });
  }

  num(event: Event, fallback: number): number {
    const value = parseFloat((event.target as HTMLInputElement).value);
    return Number.isFinite(value) ? value : fallback;
  }
}
