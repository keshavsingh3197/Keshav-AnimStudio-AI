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

  onDragStart(index: number, row: ClipRow): void {
    this.state.onRowDragStart(index, row);
  }
}

