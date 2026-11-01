import { Component, output } from '@angular/core';

import { Asset } from '../../core/models/api.models';
import { MusicLibraryComponent } from './music-library.component';

/**
 * The music library over the video studio: search, preview, and put a track on the timeline
 * without leaving the editor.
 *
 *   @if (musicOpen()) {
 *     <app-music-picker-dialog (picked)="state.addLibraryMusic($event)" (closed)="musicOpen.set(false)" />
 *   }
 */
@Component({
  selector: 'app-music-picker-dialog',
  standalone: true,
  imports: [MusicLibraryComponent],
  host: { '(document:keydown.escape)': 'closed.emit()' },
  template: `
    <div class="mp-backdrop" (click)="closed.emit()">
      <div class="mp-dialog" role="dialog" aria-modal="true" aria-label="Music library" (click)="$event.stopPropagation()">
        <div class="mp-head">
          <div class="mp-title-wrap">
            <span class="studio-icon-badge">🎵</span>
            <div>
              <strong>Music Library</strong>
              <span class="mp-hint">Press ▶ to listen, then "Add to timeline" to place it at the playhead.</span>
            </div>
          </div>
          <button type="button" class="mp-x" (click)="closed.emit()" title="Close">✕</button>
        </div>
        <div class="mp-body">
          <app-music-library [inStudio]="true" (addToTimeline)="picked.emit($event)" />
        </div>
      </div>
    </div>
  `,
  styles: [`
    .mp-backdrop { position: fixed; inset: 0; z-index: 2000; background: color-mix(in srgb, var(--bg) 75%, transparent); backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center; padding: 18px; }
    .mp-dialog { width: min(1040px, 100%); max-height: 90vh; display: flex; flex-direction: column; gap: 12px;
      background: linear-gradient(180deg, var(--surface-2), var(--surface)); color: var(--text, #eef1f8);
      border: 1px solid var(--border-bright, #2f3a56); border-radius: 16px; padding: 16px 18px;
      box-shadow: 0 24px 64px rgba(0,0,0,.68), inset 0 1px 0 rgba(255, 255, 255, 0.06); }
    .mp-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-bottom: 10px; border-bottom: 1px solid var(--ov-2); }
    .mp-title-wrap { display: flex; align-items: center; gap: 12px; min-width: 0; }
    .mp-title-wrap strong { display: block; font-size: 1rem; font-weight: 800; letter-spacing: -0.01em; }
    .mp-hint { display: block; font-size: .76rem; color: var(--muted, #7681a3); margin-top: 2px; }
    .mp-x { background: var(--ov-1); border: 1px solid var(--border, #1f2637); border-radius: 8px; padding: 4px 10px; color: var(--muted, #7681a3); font-size: .95rem; cursor: pointer; }
    .mp-x:hover { color: var(--text); background: var(--ov-3); transform: none; }
    .mp-body { overflow-y: auto; min-height: 0; padding-right: 4px; }
  `],
})
export class MusicPickerDialogComponent {
  /** A track was added to the library for the timeline; the dialog stays open for more. */
  readonly picked = output<Asset>();
  readonly closed = output<void>();
}
