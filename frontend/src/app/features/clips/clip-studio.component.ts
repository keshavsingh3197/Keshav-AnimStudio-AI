import { Component, HostListener, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { StudioStateService } from './services/studio-state.service';
import { StudioHeaderComponent } from './components/studio-header/studio-header.component';
import { MediaDockComponent } from './components/media-dock/media-dock.component';
import { VideoViewportComponent } from './components/video-viewport/video-viewport.component';
import { InspectorDockComponent } from './components/inspector-dock/inspector-dock.component';
import { TimelineDockComponent } from './components/timeline-dock/timeline-dock.component';

@Component({
  selector: 'app-clip-studio',
  standalone: true,
  providers: [StudioStateService],
  imports: [
    CommonModule,
    FormsModule,
    StudioHeaderComponent,
    MediaDockComponent,
    VideoViewportComponent,
    InspectorDockComponent,
    TimelineDockComponent,
  ],
  templateUrl: './clip-studio.component.html',
  styleUrls: ['./clip-studio.component.css'],
})
export class ClipStudioComponent implements OnInit {
  readonly state = inject(StudioStateService);
  private readonly route = inject(ActivatedRoute);

  ngOnInit(): void {
    this.route.paramMap.subscribe(() => {
      this.state.loadStudio();
    });
  }

  // Global Keyboard Shortcuts Guardrail (Guardrail 5)
  @HostListener('window:keydown', ['$event'])
  handleGlobalKeydown(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    if (
      target &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable)
    ) {
      return; // Ignore hotkeys when typing in forms or text fields
    }

    if (event.ctrlKey || event.metaKey) {
      if (event.key.toLowerCase() === 's') {
        event.preventDefault();
        this.state.saveDraft();
      } else if (event.key.toLowerCase() === 'a') {
        event.preventDefault();
        this.state.selectAllTimelineClips();
      } else if (event.key.toLowerCase() === 'd') {
        event.preventDefault();
        this.state.duplicateSelectedTimelineItem();
      } else if (event.key.toLowerCase() === 'c') {
        event.preventDefault();
        this.state.copySelectedClips();
      } else if (event.key.toLowerCase() === 'x') {
        event.preventDefault();
        this.state.cutSelectedClips();
      } else if (event.key.toLowerCase() === 'v') {
        event.preventDefault();
        this.state.pasteClips();
      } else if (event.code === 'ArrowLeft') {
        // The one-second jog used to live on Shift+Arrow; Shift now extends the
        // clip selection, which is the more useful thing to have on the easier chord.
        event.preventDefault();
        this.state.step(-1.0);
      } else if (event.code === 'ArrowRight') {
        event.preventDefault();
        this.state.step(1.0);
      }
      return;
    }

    // Alt+Arrow shuffles the selected clips through the cut order.
    if (event.altKey && (event.code === 'ArrowLeft' || event.code === 'ArrowRight')) {
      event.preventDefault();
      this.state.moveSelectedClips(event.code === 'ArrowRight' ? 1 : -1);
      return;
    }

    switch (event.code) {
      case 'Space':
        event.preventDefault();
        this.state.togglePlayback();
        break;
      case 'KeyS':
        event.preventDefault();
        this.state.splitClipAtPlayhead();
        break;
      case 'Delete':
      case 'Backspace':
        event.preventDefault();
        this.state.deleteSelected();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        if (event.shiftKey) this.state.extendClipSelection(-1);
        else this.state.step(-1 / 30);
        break;
      case 'ArrowRight':
        event.preventDefault();
        if (event.shiftKey) this.state.extendClipSelection(1);
        else this.state.step(1 / 30);
        break;
      case 'KeyM':
        event.preventDefault();
        this.state.toggleSelectedMute();
        break;
      case 'Escape':
        event.preventDefault();
        this.state.clearAllSelections();
        break;
      case 'KeyF':
        event.preventDefault();
        this.state.toggleAppFullscreen();
        break;
    }
  }
}
