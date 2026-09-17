import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';

import { Asset, AssetFolder } from '../../core/models/api.models';
import { ApiService } from '../../core/services/api.service';
import { ProjectStore } from '../../core/services/project-store';
import { StatusService } from '../../core/services/status.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-asset-library',
  imports: [DecimalPipe, FormsModule],
  templateUrl: './asset-library.component.html',
  styleUrls: ['./asset-library.component.css']
})
export class AssetLibraryComponent {
  private readonly api = inject(ApiService);
  readonly store = inject(ProjectStore);
  readonly status = inject(StatusService);

  readonly confirming = signal<string | null>(null);
  readonly selectedFolderId = signal<string | null>(null);
  readonly isCreatingFolder = signal(false);
  readonly newFolderName = signal('');
  readonly dragTargetFolder = signal<string | null>(null);

  readonly filteredAssets = computed(() => {
    const folderId = this.selectedFolderId();
    if (folderId === null) return this.store.assets();
    return this.store.assets().filter(a => a.folderId === folderId);
  });

  upload(event: Event): void {
    const input = event.target as HTMLInputElement;
    const projectId = this.store.projectId();
    const files = input.files;
    const folderId = this.selectedFolderId();

    if (!projectId || !files || files.length === 0) return;

    for (const file of Array.from(files)) {
      this.status.run(this.api.uploadAsset(projectId, file, folderId), (asset) => {
        this.store.refreshAssets();

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

  createFolder(): void {
    const projectId = this.store.projectId();
    const name = this.newFolderName().trim();
    if (!projectId || !name) return;

    this.status.run(this.api.createFolder(projectId, name), (f) => {
      this.store.refreshFolders();
      this.isCreatingFolder.set(false);
      this.newFolderName.set('');
    });
  }

  deleteFolder(folderId: string): void {
    const projectId = this.store.projectId();
    if (!projectId) return;

    if (!confirm('Are you sure you want to delete this folder? Assets will be moved to root.')) return;

    this.status.run(this.api.deleteFolder(projectId, folderId), () => {
      if (this.selectedFolderId() === folderId) {
        this.selectedFolderId.set(null);
      }
      this.store.refreshFolders();
      this.store.refreshAssets();
    });
  }

  selectFolder(id: string | null): void {
    this.selectedFolderId.set(id);
  }

  onDragStart(event: DragEvent, asset: Asset): void {
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', asset.id);
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  onDragOver(event: DragEvent, folderId: string | null): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    this.dragTargetFolder.set(folderId);
  }

  onDragLeave(event: DragEvent): void {
    this.dragTargetFolder.set(null);
  }

  onDrop(event: DragEvent, targetFolderId: string | null): void {
    event.preventDefault();
    this.dragTargetFolder.set(null);
    
    if (!event.dataTransfer) return;
    const assetId = event.dataTransfer.getData('text/plain');
    if (!assetId) return;

    const projectId = this.store.projectId();
    if (!projectId) return;

    const asset = this.store.assets().find(a => a.id === assetId);
    if (asset && asset.folderId !== targetFolderId) {
      this.status.run(this.api.moveAssetToFolder(projectId, assetId, targetFolderId), () => {
        this.store.refreshAssets();
      });
    }
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
