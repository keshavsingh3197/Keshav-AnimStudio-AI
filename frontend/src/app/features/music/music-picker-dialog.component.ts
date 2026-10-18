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
          <strong>🎵 Music library</strong>
          <span class="mp-hint">Press ▶ to listen, then "Add to timeline" to place it at the playhead.</span>
          <button type="button" class="mp-x" (click)="closed.emit()" title="Close">✕</button>
        </div>
        <div class="mp-body">
          <app-music-library [inStudio]="true" (addToTimeline)="picked.emit($event)" />
        </div>
      </div>
    </div>
  `,
  styles: [`
    .mp-backdrop { position: fixed; inset: 0; z-index: 2000; background: rgba(2, 6, 23, .7);
      display: flex; align-items: center; justify-content: center; padding: 16px; }
    .mp-dialog { width: min(960px, 100%); max-height: 90vh; display: flex; flex-direction: column; gap: 10px;
      background: #0f1420; color: #e2e8f0; border: 1px solid #263044; border-radius: 10px; padding: 14px 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,.6); }
    .mp-head { display: flex; align-items: center; gap: 12px; }
    .mp-hint { flex: 1; font-size: .75rem; color: #94a3b8; }
    .mp-x { background: none; border: 0; color: #94a3b8; font-size: 1rem; cursor: pointer; }
    .mp-body { overflow-y: auto; min-height: 0; }
  `],
})
export class MusicPickerDialogComponent {
  /** A track was added to the library for the timeline; the dialog stays open for more. */
  readonly picked = output<Asset>();
  readonly closed = output<void>();
}
