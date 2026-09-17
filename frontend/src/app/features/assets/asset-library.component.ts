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
  
  // Virtual folders: 'all', 'images', 'videos', 'audio', 'subtitles', 'exports'
  // Custom folders: folder ID string.
  readonly selectedFolderId = signal<string>('all');
  
  readonly isCreatingFolder = signal(false);
  readonly newFolderName = signal('');
  readonly dragTargetFolder = signal<string | null>(null);
  readonly searchQuery = signal<string>('');

  // Drag and drop reordering state
  readonly dragAssetIndex = signal<number | null>(null);
  readonly dragOverIndex = signal<number | null>(null);

  readonly filteredAssets = computed(() => {
    let assets = [...this.store.assets()];
    
    // Sort by orderIndex
    assets.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));

    const folderId = this.selectedFolderId();
    if (folderId === 'images') assets = assets.filter(a => a.kind === 'Image');
    else if (folderId === 'videos') assets = assets.filter(a => a.kind === 'Video');
    else if (folderId === 'audio') assets = assets.filter(a => a.kind === 'Audio');
    else if (folderId === 'subtitles') assets = assets.filter(a => a.kind === 'Subtitle');
    else if (folderId === 'all') {} // keep all
    else {
      // It's a real folder ID (or 'exports' which is actually a real folder in the DB usually)
      assets = assets.filter(a => a.folderId === folderId);
    }

    const query = this.searchQuery().toLowerCase().trim();
    if (query) {
      assets = assets.filter(a => a.name.toLowerCase().includes(query));
    }

    return assets;
  });

  upload(event: Event): void {
    const input = event.target as HTMLInputElement;
    const projectId = this.store.projectId();
    const files = input.files;
    
    // If a custom folder is selected, upload to it. Otherwise upload to root.
    const currentFolder = this.selectedFolderId();
    const folderId = (['all', 'images', 'videos', 'audio', 'subtitles'].includes(currentFolder)) ? null : currentFolder;

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
      this.selectedFolderId.set(f.id);
    });
  }

  deleteFolder(folderId: string): void {
    const projectId = this.store.projectId();
    if (!projectId) return;

    if (!confirm('Are you sure you want to delete this folder? Assets will be moved to root.')) return;

    this.status.run(this.api.deleteFolder(projectId, folderId), () => {
      if (this.selectedFolderId() === folderId) {
        this.selectedFolderId.set('all');
      }
      this.store.refreshFolders();
      this.store.refreshAssets();
    });
  }

  selectFolder(id: string): void {
    this.selectedFolderId.set(id);
    this.searchQuery.set('');
  }

  onDragStart(event: DragEvent, asset: Asset, index: number): void {
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', asset.id);
      event.dataTransfer.effectAllowed = 'move';
    }
    this.dragAssetIndex.set(index);
  }

  onDragOver(event: DragEvent, targetId: string | null): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    this.dragTargetFolder.set(targetId);
  }

  onDragOverRow(event: DragEvent, index: number): void {
    event.preventDefault();
    this.dragOverIndex.set(index);
  }

  onDragLeave(event: DragEvent): void {
    this.dragTargetFolder.set(null);
    this.dragOverIndex.set(null);
  }

  onDropToFolder(event: DragEvent, targetFolderId: string | null): void {
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

  onDropRow(event: DragEvent, dropIndex: number): void {
    event.preventDefault();
    const dragIndex = this.dragAssetIndex();
    this.dragAssetIndex.set(null);
    this.dragOverIndex.set(null);

    if (dragIndex === null || dragIndex === dropIndex) return;
    
    const projectId = this.store.projectId();
    if (!projectId) return;

    // We are reordering the filteredAssets list.
    const currentList = [...this.filteredAssets()];
    const item = currentList.splice(dragIndex, 1)[0];
    currentList.splice(dropIndex, 0, item);

    // Send the updated order to the backend
    const assetIds = currentList.map(a => a.id);
    
    // Optimistically update the UI locally. (A better way is to update `store.assets` but `refreshAssets` is easier).
    // Let's just wait for backend then refresh
    this.status.run(this.api.reorderAssets(projectId, assetIds), () => {
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
