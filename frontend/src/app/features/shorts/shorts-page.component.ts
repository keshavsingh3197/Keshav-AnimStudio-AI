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
    <div class="sp-page">
      <header class="sp-head">
        <h1>Shorts</h1>
        <p>Every Auto Shorts batch and upright export across your projects. Select any number to save them to Google Drive,
          publish them to YouTube or download them in one go. Batches keep going on the server when you close or refresh a page.</p>
      </header>
      <app-shorts-board [focusBatch]="batch()" />
    </div>
  `,
  styles: [`
    .sp-page { max-width: 1400px; margin: 0 auto; padding: 16px; box-sizing: border-box; }
    .sp-head h1 { margin: 0 0 4px; font-size: 1.4rem; }
    .sp-head p { margin: 0 0 16px; color: var(--muted); font-size: 0.85rem; max-width: 760px; }
  `],
})
export class ShortsPageComponent {
  readonly batch = toSignal(inject(ActivatedRoute).queryParamMap.pipe(map((q) => q.get('batch'))), { initialValue: null });
}
