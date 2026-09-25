import { Component, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudioStateService } from '../../services/studio-state.service';
import { Clip } from '../../../../core/models/api.models';
import { ClipRow } from '../../models/clip-studio.models';

@Component({
  selector: 'app-media-dock',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './media-dock.component.html',
  styleUrls: ['./media-dock.component.css'],
})
export class MediaDockComponent implements OnDestroy {
  readonly state = inject(StudioStateService);

  // Local audio preview element - Guardrail 1: DOM Reference Isolation
  private previewAudioEl: HTMLAudioElement | null = null;
  readonly previewingAudioId = signal<string | null>(null);

  ngOnDestroy(): void {
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

  // Safe hover preview tracking (Guardrail: zero persistent background video elements)
  readonly activeHoverId = signal<string | null>(null);

  onCardMouseEnter(id: string): void {
    this.activeHoverId.set(id);
  }

  onCardMouseLeave(): void {
    this.activeHoverId.set(null);
  }

  // Safe hover preview promise tracking
  private hoverPlayPromise: Promise<void> | null = null;
  private activeHoverVideo: HTMLVideoElement | null = null;
  showSelectionMenu = false;

  onThumbLoaded(videoEl: HTMLVideoElement): void {
    try {
      if (videoEl.currentTime < 0.05) {
        videoEl.currentTime = 0.05;
      }
    } catch {
      // ignore seek error on load
    }
  }

  onThumbMouseEnter(videoEl: HTMLVideoElement): void {
    videoEl.muted = true;
    this.activeHoverVideo = videoEl;
    const promise = videoEl.play();
    if (promise !== undefined) {
      this.hoverPlayPromise = promise;
      promise.catch(() => {
        // Suppress browser abort / pause interruptions cleanly
      });
    }
  }

  onThumbMouseLeave(videoEl: HTMLVideoElement): void {
    if (this.hoverPlayPromise) {
      this.hoverPlayPromise
        .then(() => {
          videoEl.pause();
          try {
            videoEl.currentTime = 0.1;
          } catch {
            // ignore seek error
          }
        })
        .catch(() => {
          videoEl.pause();
        });
      this.hoverPlayPromise = null;
    } else {
      videoEl.pause();
      try {
        videoEl.currentTime = 0.1;
      } catch {
        // ignore seek error
      }
    }

    if (this.activeHoverVideo === videoEl) {
      this.activeHoverVideo = null;
    }
  }

  onDragStart(index: number, row: ClipRow): void {
    this.state.onRowDragStart(index, row);
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

