import { Component, OnInit, inject, input, output, signal } from '@angular/core';

import { Asset } from '../core/models/api.models';
import { ApiService } from '../core/services/api.service';

/**
 * Lets the user pick one of a project's image assets to use as the project thumbnail.
 *
 *   @if (open()) {
 *     <app-asset-thumbnail-picker [projectId]="id" (picked)="use($event)" (closed)="open.set(false)" />
 *   }
 */
@Component({
  selector: 'app-asset-thumbnail-picker',
  standalone: true,
  host: { '(document:keydown.escape)': 'closed.emit()' },
  template: `
    <div class="atp-backdrop" (click)="closed.emit()">
      <div class="atp-dialog" role="dialog" aria-modal="true" aria-label="Choose thumbnail from assets" (click)="$event.stopPropagation()">
        <div class="atp-head">
          <strong>Choose thumbnail from assets</strong>
          <button type="button" class="atp-x" (click)="closed.emit()" aria-label="Close">&times;</button>
        </div>
        <div class="atp-body">
          @if (loading()) {
            <p class="atp-msg">Loading assets…</p>
          } @else if (images().length === 0) {
            <p class="atp-msg">This project has no image assets yet. Upload images in the Asset Library first.</p>
          } @else {
            <div class="atp-grid">
              @for (a of images(); track a.id) {
                <button type="button" class="atp-item" [title]="a.name" (click)="picked.emit(a.id)">
                  <img [src]="api.assetThumbnailUrl(a.id)" [alt]="a.name" loading="lazy" />
                  <span>{{ a.name }}</span>
                </button>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .atp-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.65); z-index: 10000; display: flex; align-items: center; justify-content: center; }
    .atp-dialog { background: #12141c; color: #e6e8ef; border: 1px solid #2a2e3d; border-radius: 12px; width: min(760px, 92vw); max-height: 80vh; display: flex; flex-direction: column; }
    .atp-head { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-bottom: 1px solid #2a2e3d; }
    .atp-x { background: none; border: 0; color: inherit; font-size: 22px; cursor: pointer; }
    .atp-body { padding: 14px; overflow: auto; }
    .atp-msg { opacity: .7; text-align: center; padding: 24px 0; }
    .atp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; }
    .atp-item { background: #1a1d28; border: 1px solid #2a2e3d; border-radius: 8px; padding: 0; cursor: pointer; color: inherit; overflow: hidden; text-align: left; }
    .atp-item:hover { border-color: #6d7cff; }
    .atp-item img { width: 100%; aspect-ratio: 16/9; object-fit: cover; display: block; background: #000; }
    .atp-item span { display: block; padding: 5px 8px; font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  `],
})
export class AssetThumbnailPickerComponent implements OnInit {
  readonly api = inject(ApiService);

  readonly projectId = input.required<string>();
  readonly picked = output<string>();
  readonly closed = output<void>();

  readonly loading = signal(true);
  readonly images = signal<Asset[]>([]);

  ngOnInit(): void {
    this.api.listAssets(this.projectId()).subscribe({
      next: (list) => {
        this.images.set(list.filter((a) => a.kind === 'Image'));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}

