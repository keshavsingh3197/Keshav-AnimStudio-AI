import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';

import { Asset, AssetFolder } from '../../core/models/api.models';
import { ApiService } from '../../core/services/api.service';
import { ProjectStore } from '../../core/services/project-store';
import { StatusService } from '../../core/services/status.service';
import { FileDropDirective } from '../../shared/file-drop.directive';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-asset-library',
  imports: [DecimalPipe, FormsModule, FileDropDirective],
  templateUrl: './asset-library.component.html',
  styleUrls: ['./asset-library.component.css']
})
export class AssetLibraryComponent {
  private readonly api = inject(ApiService);
  readonly store = inject(ProjectStore);
  readonly status = inject(StatusService);

  readonly confirming = signal<string | null>(null);
  readonly previewAsset = signal<Asset | null>(null);
  readonly copiedAssetId = signal<string | null>(null);
  readonly isDraggingFiles = signal<boolean>(false);
  
  // View mode & sorting
  readonly viewMode = signal<'grid' | 'table'>('grid');
  readonly sortBy = signal<'order' | 'name' | 'size' | 'duration' | 'type'>('order');
  readonly sortAsc = signal<boolean>(true);

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

  // Storage and type statistics
  readonly totalStorageBytes = computed(() => {
    return this.store.assets().reduce((acc, a) => acc + (a.fileSizeBytes || 0), 0);
  });
  readonly videoCount = computed(() => this.store.assets().filter(a => a.kind === 'Video').length);
  readonly audioCount = computed(() => this.store.assets().filter(a => a.kind === 'Audio').length);
  readonly imageCount = computed(() => this.store.assets().filter(a => a.kind === 'Image').length);
  readonly subtitleCount = computed(() => this.store.assets().filter(a => a.kind === 'Subtitle').length);

  readonly filteredAssets = computed(() => {
    let assets = [...this.store.assets()];

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

    const sort = this.sortBy();
    const asc = this.sortAsc();
    assets.sort((a, b) => {
      let cmp = 0;
      if (sort === 'name') {
        cmp = a.name.localeCompare(b.name);
      } else if (sort === 'size') {
        cmp = (a.fileSizeBytes || 0) - (b.fileSizeBytes || 0);
      } else if (sort === 'duration') {
        cmp = (a.durationSeconds || 0) - (b.durationSeconds || 0);
      } else if (sort === 'type') {
        cmp = a.kind.localeCompare(b.kind);
      } else {
        cmp = (a.orderIndex || 0) - (b.orderIndex || 0);
      }
      return asc ? cmp : -cmp;
    });

    return assets;
  });

  upload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.processUploadFiles(input.files);
    }
    input.value = '';
  }

  processUploadFiles(files: FileList | File[]): void {
    const projectId = this.store.projectId();
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
  }

  onFileDragOver(event: DragEvent): void {
    if (event.dataTransfer?.types?.includes('Files')) {
      event.preventDefault();
      event.stopPropagation();
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'copy';
      }
      this.isDraggingFiles.set(true);
    }
  }

  onFileDragLeave(event: DragEvent): void {
    const rect = (event.currentTarget as HTMLElement)?.getBoundingClientRect();
    if (rect) {
      if (
        event.clientX <= rect.left ||
        event.clientX >= rect.right ||
        event.clientY <= rect.top ||
        event.clientY >= rect.bottom
      ) {
        this.isDraggingFiles.set(false);
      }
    } else {
      this.isDraggingFiles.set(false);
    }
  }

  onFileDrop(event: DragEvent): void {
    if (event.dataTransfer?.types?.includes('Files')) {
      event.preventDefault();
      event.stopPropagation();
      this.isDraggingFiles.set(false);

      const files = event.dataTransfer.files;
      if (files && files.length > 0) {
        this.processUploadFiles(files);
      }
    }
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

  assetThumbnailUrl(assetId: string): string {
    return this.api.assetThumbnailUrl(assetId);
  }

  isImage(asset: Asset): boolean {
    return asset.kind === 'Image';
  }

  isVideo(asset: Asset): boolean {
    return asset.kind === 'Video';
  }

  isAudio(asset: Asset): boolean {
    return asset.kind === 'Audio';
  }

  isSubtitle(asset: Asset): boolean {
    return asset.kind === 'Subtitle';
  }

  isAudible(asset: Asset): boolean {
    // Only genuine audio assets use the audio player inline! Videos have video thumbnails.
    return asset.kind === 'Audio';
  }

  formatDuration(sec?: number | null): string {
    if (sec == null || isNaN(sec) || sec <= 0) return '--';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 10);
    if (m > 0) {
      return `${m}:${s.toString().padStart(2, '0')}`;
    }
    return `${s}.${ms}s`;
  }

  formatFileSize(bytes?: number | null): string {
    if (bytes == null || isNaN(bytes) || bytes <= 0) return '0 B';
    if (bytes >= 1024 * 1024 * 1024) return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
    if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    if (bytes >= 1024) return (bytes / 1024).toFixed(0) + ' KB';
    return bytes + ' B';
  }

  openPreview(asset: Asset): void {
    this.previewAsset.set(asset);
  }

  closePreview(): void {
    this.previewAsset.set(null);
  }

  copyAssetId(id: string): void {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(id);
      this.copiedAssetId.set(id);
      setTimeout(() => this.copiedAssetId.set(null), 2000);
    }
  }

  toggleSort(type: 'order' | 'name' | 'size' | 'duration' | 'type'): void {
    if (this.sortBy() === type) {
      this.sortAsc.update(a => !a);
    } else {
      this.sortBy.set(type);
      this.sortAsc.set(type === 'order' || type === 'name');
    }
  }
}
