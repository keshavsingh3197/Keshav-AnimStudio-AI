import { Component, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudioStateService } from '../../services/studio-state.service';
import { Clip } from '../../../../core/models/api.models';
import { ClipRow } from '../../models/clip-studio.models';
import { UrlImportDialogComponent } from '../../../../shared/url-import-dialog.component';

@Component({
  selector: 'app-media-dock',
  standalone: true,
  imports: [CommonModule, FormsModule, UrlImportDialogComponent],
  templateUrl: './media-dock.component.html',
  styleUrls: ['./media-dock.component.css'],
})
export class MediaDockComponent implements OnDestroy {
  readonly state = inject(StudioStateService);

  /** The paste-many-links import; the clip list reloads once when it closes, if anything arrived. */
  readonly urlImportOpen = signal(false);
  private urlImported = false;

  onUrlImported(): void {
    this.urlImported = true;
    this.state.store.refreshAssets();
  }

  onUrlImportClosed(): void {
    this.urlImportOpen.set(false);
    if (this.urlImported) this.state.reload(false);
    this.urlImported = false;
  }

  // Local audio preview element - Guardrail 1: DOM Reference Isolation
  private previewAudioEl: HTMLAudioElement | null = null;
  readonly previewingAudioId = signal<string | null>(null);

  ngOnDestroy(): void {
    if (this.hoverTimer) {
      clearTimeout(this.hoverTimer);
      this.hoverTimer = null;
    }
    if (this.activeHoverVideo) {
      try {
        this.activeHoverVideo.pause();
        this.activeHoverVideo.removeAttribute('src');
        this.activeHoverVideo.load();
      } catch {}
      this.activeHoverVideo = null;
    }
    if (this.previewAudioEl) {
      this.previewAudioEl.pause();
      this.previewAudioEl = null;
    }
  }

  togglePreviewAudio(assetId: string, event?: Event): void {
    event?.stopPropagation();
    if (this.previewingAudioId() === assetId) {
      this.previewAudioEl?.pause();
      this.previewingAudioId.set(null);
      return;
    }

    if (this.state.isPlaying()) {
      this.state.pause();
    }

    if (this.previewAudioEl) {
      this.previewAudioEl.pause();
    }

    this.previewAudioEl = new Audio(this.state.assetUrl(assetId));
    this.previewAudioEl.onended = () => this.previewingAudioId.set(null);
    this.previewAudioEl.onerror = () => this.previewingAudioId.set(null);
    this.previewAudioEl.play().catch(() => this.previewingAudioId.set(null));
    this.previewingAudioId.set(assetId);
  }

  constructor() {
    // Automatically refresh thumbnails after 2s and 5s in case any were still generating in background
    setTimeout(() => this.state.refreshThumbnails(), 2000);
    setTimeout(() => this.state.refreshThumbnails(), 5000);
  }

  // Safe hover preview tracking (Guardrail: zero persistent background video elements)
  readonly activeHoverId = signal<string | null>(null);
  private hoverTimer: ReturnType<typeof setTimeout> | null = null;
  private hoverPlayPromise: Promise<void> | null = null;
  private activeHoverVideo: HTMLVideoElement | null = null;
  showSelectionMenu = false;

  onCardMouseEnter(id: string): void {
    if (this.hoverTimer) clearTimeout(this.hoverTimer);
    // 120ms debounce prevents socket storms when rapidly brushing cursor over cards
    this.hoverTimer = setTimeout(() => {
      this.activeHoverId.set(id);
    }, 120);
  }

  onCardMouseLeave(): void {
    if (this.hoverTimer) {
      clearTimeout(this.hoverTimer);
      this.hoverTimer = null;
    }
    if (this.activeHoverVideo) {
      const vid = this.activeHoverVideo;
      this.activeHoverVideo = null;
      try {
        vid.pause();
        vid.removeAttribute('src');
        vid.load();
      } catch {}
    }
    this.activeHoverId.set(null);
  }

  onHoverCanPlay(vid: HTMLVideoElement): void {
    vid.muted = true;
    this.activeHoverVideo = vid;
    const playPromise = vid.play();
    if (playPromise !== undefined) {
      this.hoverPlayPromise = playPromise;
      playPromise.catch(() => {
        // Silently catch browser abort / policy interruption
      });
    }
  }

  onHoverError(id: string): void {
    if (this.activeHoverId() === id) {
      this.activeHoverId.set(null);
    }
  }

  onThumbImgError(event: Event, id: string): void {
    const img = event.target as HTMLImageElement;
    if (!img) return;
    const currentRetries = parseInt(img.dataset['retries'] || '0', 10);
    if (currentRetries < 2) {
      img.dataset['retries'] = String(currentRetries + 1);
      setTimeout(() => {
        img.src = `${this.state.assetThumbnailUrl(id)}&r=${Date.now()}`;
      }, 1500);
    }
  }

  onDragStart(index: number, row: ClipRow, event?: DragEvent): void {
    this.state.onRowDragStart(index, row);
    // Firefox starts no drag at all without data, and the preview and timeline both read
    // the dragged clip from state - so the payload is only an id, under our own type.
    if (event?.dataTransfer) {
      event.dataTransfer.setData('application/x-animstudio-clip', row.clip.id);
      event.dataTransfer.effectAllowed = 'copyMove';
    }
  }

  selectAll(): void {
    this.state.selectAllFiltered();
    this.showSelectionMenu = false;
  }

  selectUnused(): void {
    this.state.selectUnusedMedia();
    this.showSelectionMenu = false;
  }

  selectInCut(): void {
    this.state.selectInCutMedia();
    this.showSelectionMenu = false;
  }

  invertSelection(): void {
    this.state.invertSelection();
    this.showSelectionMenu = false;
  }

  deselectAll(): void {
    this.state.clearAllSelections();
    this.showSelectionMenu = false;
  }
}

