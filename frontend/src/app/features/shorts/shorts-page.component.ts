import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';

import { ShortsBoardComponent } from './shorts-board.component';

/**
 * Every short across every project in one place - what is rendering, what is ready, what
 * still has to go to Google Drive or YouTube - so a batch can be finished and sent on in
 * one go without opening each project.
 */
@Component({
  selector: 'app-shorts-page',
  standalone: true,
  imports: [ShortsBoardComponent],
  template: `
    <div class="sp-page studio-wide-page">
      <header class="sp-head sb-studio-bar">
        <div class="sp-head-left">
          <div class="studio-icon-badge purple">⚡</div>
          <div class="sb-studio-title-col">
            <h2>Shorts Studio</h2>
            <p class="muted">Every Auto Shorts batch and upright export across your projects. Select any number to save them to Google Drive,
              publish them to YouTube or download them in one go. Batches keep going on the server when you close or refresh a page.</p>
          </div>
        </div>
        <div class="sb-studio-actions">
          <span class="pill brand">9:16 Batch Pipeline</span>
        </div>
      </header>
      <app-shorts-board [focusBatch]="batch()" />
    </div>
  `,
  styles: [`
    .sp-page { max-width: 1480px; margin: 0 auto; padding: 16px; box-sizing: border-box; display: flex; flex-direction: column; gap: 16px; }
    .sp-head { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
    .sp-head-left { display: flex; align-items: center; gap: 14px; min-width: 0; }
    .sp-head h2 { margin: 0 0 4px; font-size: 1.35rem; font-weight: 800; letter-spacing: -0.02em; }
    .sp-head p { margin: 0; color: var(--muted); font-size: 0.84rem; max-width: 780px; line-height: 1.45; }
  `],
})
export class ShortsPageComponent {
  readonly batch = toSignal(inject(ActivatedRoute).queryParamMap.pipe(map((q) => q.get('batch'))), { initialValue: null });
}
