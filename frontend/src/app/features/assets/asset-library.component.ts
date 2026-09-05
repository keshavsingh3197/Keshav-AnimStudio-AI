import { DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';

import { Asset } from '../../core/models/api.models';
import { ApiService } from '../../core/services/api.service';
import { ProjectStore } from '../../core/services/project-store';
import { StatusService } from '../../core/services/status.service';

/** Uploads: backgrounds, sprites, voice recordings and music. */
@Component({
  selector: 'app-asset-library',
  imports: [DecimalPipe],
  templateUrl: './asset-library.component.html',
})
export class AssetLibraryComponent {
  private readonly api = inject(ApiService);

  readonly store = inject(ProjectStore);
  readonly status = inject(StatusService);

  readonly confirming = signal<string | null>(null);

  upload(event: Event): void {
    const input = event.target as HTMLInputElement;
    const projectId = this.store.projectId();
    const files = input.files;

    if (!projectId || !files || files.length === 0) return;

    for (const file of Array.from(files)) {
      this.status.run(this.api.uploadAsset(projectId, file), (asset) => {
        this.store.refreshAssets();

        // A sprite without transparency composites as an opaque rectangle, so say so now
        // rather than letting it surface in the finished video.
        if (asset.kind === 'Image' && !asset.hasAlpha) {
          this.status.notify([
            `"${asset.name}" has no transparency. That is fine for a background, but as a `
            + 'character sprite it will render as a solid rectangle.',
          ]);
        }
      });
    }

    input.value = '';
  }

  remove(assetId: string): void {
    this.status.run(this.api.deleteAsset(assetId), () => {
      this.confirming.set(null);
      this.store.refreshAssets();
    });
  }

  assetUrl(assetId: string): string {
    return this.api.assetUrl(assetId);
  }

  isImage(asset: Asset): boolean {
    return asset.kind === 'Image';
  }

  isAudible(asset: Asset): boolean {
    return asset.kind === 'Audio' || asset.kind === 'Video';
  }
}
