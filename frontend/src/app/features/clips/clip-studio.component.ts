import { Component, ElementRef, HostListener, OnDestroy, ViewChild, computed, effect, inject, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { Clip, DEFAULT_BRAND_CHANNEL } from '../../core/models/api.models';
import { StudioStateService } from './services/studio-state.service';
import { StudioHeaderComponent } from './components/studio-header/studio-header.component';
import { MediaDockComponent } from './components/media-dock/media-dock.component';
import { VideoViewportComponent } from './components/video-viewport/video-viewport.component';
import { InspectorDockComponent } from './components/inspector-dock/inspector-dock.component';
import { TimelineDockComponent } from './components/timeline-dock/timeline-dock.component';
import { clipboardFiles } from '../../shared/file-drop.directive';

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
    RouterLink,
  ],
  templateUrl: './clip-studio.component.html',
  styleUrls: ['./clip-studio.component.css'],
})
export class ClipStudioComponent implements OnDestroy {
  readonly state = inject(StudioStateService);

  /** Only the id: a reload of the same project must not throw the open timeline away. */
  private readonly openProjectId = computed(() => this.state.store.project()?.id ?? null);

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly editParam = toSignal(
    this.route.queryParamMap.pipe(map((p) => p.get('edit'))), { initialValue: null });

  readonly splitPreviewingPart = signal<number | null>(null);
  @ViewChild('part1Video') part1VideoRef?: ElementRef<HTMLVideoElement>;
  @ViewChild('part2Video') part2VideoRef?: ElementRef<HTMLVideoElement>;

  constructor() {
    // Loads once the project lands, and again whenever a DIFFERENT project does. This route's
    // own paramMap never changes - :projectId belongs to the parent route - so subscribing
    // to it loaded nothing on a direct visit and never noticed a switch of project.
    // Which cut (video / Short) is open lives in the URL, so a link or a reload reopens it.
    effect(() => {
      const projectId = this.openProjectId();
      const editId = this.editParam();
      if (!projectId) return;
      untracked(() => {
        if (editId) {
          this.state.loadStudio(editId);
          this.setEndCardPreview(null);
          return;
        }
        // No cut named: open the one worked on most recently.
        this.state.api.listEdits(projectId).subscribe({
          next: (list) => {
            if (this.openProjectId() !== projectId || !list[0]) return;
            this.router.navigate([], {
              relativeTo: this.route,
              queryParams: { edit: list[0].id },
              queryParamsHandling: 'merge',
              replaceUrl: true,
            });
          },
          error: () => this.state.status.error.set("Could not load this project's videos."),
        });
      });
    });

    effect(() => {
      // Sync frame preview when split point changes
      const prompt = this.state.splitPrompt();
      const sec = this.state.splitPromptSeconds();
      if (prompt) {
        setTimeout(() => this.updateSplitVideoFrames(), 30);
      }
    });

    // The end card falls back to the project's brand channel, so it follows the project.
    effect(() => {
      const project = this.state.store.project();
      if (!project) return;
      const channelId = project.brandChannelId || DEFAULT_BRAND_CHANNEL;
      untracked(() => this.state.api.listBrandChannels().subscribe({
        next: (list) => {
          if (this.openProjectId() !== project.id) return; // answered after a project switch
          const channel = list.find((c) => c.id === channelId) ?? list.find((c) => c.isDefault);
          this.state.globalOutro.set(channel?.outro ?? null);
          this.state.brandChannelName.set(channel?.name ?? null);
          this.state.channelWatermark.set(channel?.watermark ?? null);
        },
        error: () => this.state.globalOutro.set(null),
      }));
    });
  }

  ngOnDestroy(): void {
    this.setEndCardPreview(null);
  }

  // --- Export dialog: which end card the export appends, and a rendered preview of it ---

  readonly endCardPreviewUrl = signal<string | null>(null);
  readonly endCardPreviewBusy = signal(false);
  readonly endCardPreviewError = signal<string | null>(null);

  previewEndCard(): void {
    const projectId = this.state.store.projectId();
    if (!projectId) return;
    const res = this.state.exportResolution();
    const format = res === 'short_9_16' ? 'vertical' : res === 'square_1_1' ? 'square' : 'landscape';
    this.endCardPreviewBusy.set(true);
    this.endCardPreviewError.set(null);
    this.state.api.previewProjectOutro(projectId, null, format).subscribe({
      next: (blob) => {
        if (this.openProjectId() !== projectId) return;
        this.setEndCardPreview(blob);
        this.endCardPreviewBusy.set(false);
      },
      error: () => {
        this.setEndCardPreview(null);
        this.endCardPreviewBusy.set(false);
        this.endCardPreviewError.set('Could not render the end card. Check Settings → Outro or Admin → Branding.');
      },
    });
  }

  private setEndCardPreview(blob: Blob | null): void {
    const previous = this.endCardPreviewUrl();
    if (previous) URL.revokeObjectURL(previous);
    this.endCardPreviewUrl.set(blob ? URL.createObjectURL(blob) : null);
  }

  updateSplitVideoFrames(): void {
    const prompt = this.state.splitPrompt();
    if (!prompt) return;
    const origTrimStart = prompt.clip.trimStartSeconds ?? 0;
    const splitPoint = origTrimStart + this.state.splitPromptPart1Duration();

    const v1 = this.part1VideoRef?.nativeElement;
    if (v1 && this.splitPreviewingPart() !== 1) {
      if (Math.abs(v1.currentTime - splitPoint) > 0.05) {
        v1.currentTime = Math.max(0, splitPoint);
      }
    }
    const v2 = this.part2VideoRef?.nativeElement;
    if (v2 && this.splitPreviewingPart() !== 2) {
      if (Math.abs(v2.currentTime - splitPoint) > 0.05) {
        v2.currentTime = Math.max(0, splitPoint);
      }
    }
  }

  toggleSplitPreviewPart(part: 1 | 2, prompt: { clip: Clip; clipStart: number; clipEnd: number }): void {
    const v1 = this.part1VideoRef?.nativeElement;
    const v2 = this.part2VideoRef?.nativeElement;
    const targetVideo = part === 1 ? v1 : v2;
    const otherVideo = part === 1 ? v2 : v1;

    if (otherVideo && !otherVideo.paused) {
      otherVideo.pause();
    }

    if (this.splitPreviewingPart() === part) {
      this.stopSplitPreview();
      return;
    }

    if (!targetVideo) return;

    const origTrimStart = prompt.clip.trimStartSeconds ?? 0;
    const p1Dur = this.state.splitPromptPart1Duration();
    const startSec = part === 1 ? origTrimStart : origTrimStart + p1Dur;

    targetVideo.currentTime = Math.max(0, startSec);
    targetVideo.volume = 1.0;
    this.splitPreviewingPart.set(part);

    targetVideo.play().catch(() => this.stopSplitPreview());
  }

  onSplitVideoTimeUpdate(part: 1 | 2, prompt: { clip: Clip; clipStart: number; clipEnd: number }): void {
    if (this.splitPreviewingPart() !== part) return;
    const targetVideo = part === 1 ? this.part1VideoRef?.nativeElement : this.part2VideoRef?.nativeElement;
    if (!targetVideo) return;

    const origTrimStart = prompt.clip.trimStartSeconds ?? 0;
    const p1Dur = this.state.splitPromptPart1Duration();
    const endSec = part === 1
      ? origTrimStart + p1Dur
      : origTrimStart + (prompt.clip.durationSeconds ?? 5.0);

    if (targetVideo.currentTime >= endSec) {
      this.stopSplitPreview();
      targetVideo.currentTime = origTrimStart + p1Dur;
    }
  }

  stopSplitPreview(): void {
    const v1 = this.part1VideoRef?.nativeElement;
    if (v1 && !v1.paused) v1.pause();
    const v2 = this.part2VideoRef?.nativeElement;
    if (v2 && !v2.paused) v2.pause();
    this.splitPreviewingPart.set(null);
  }

  cancelSplit(): void {
    this.stopSplitPreview();
    this.state.cancelSplitPrompt();
  }

  confirmSplit(): void {
    this.stopSplitPreview();
    this.state.confirmSplitPrompt();
  }

  confirmSplitKeepPart(part: 1 | 2): void {
    this.stopSplitPreview();
    this.state.confirmSplitKeepPart(part);
  }


  /** Ctrl+V: files or a screenshot on the clipboard go to the media dock, otherwise copied clips. */
  @HostListener('document:paste', ['$event'])
  handleGlobalPaste(event: ClipboardEvent): void {
    if (event.defaultPrevented) return; // a file-drop zone (e.g. an open dialog) already took it
    const target = event.target as HTMLElement | null;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
      return;
    }
    event.preventDefault();
    const files = clipboardFiles(event);
    if (files.length > 0) {
      this.state.uploadFiles(files);
    } else {
      this.state.pasteClips();
    }
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
        // Left to the browser so a paste event fires: handleGlobalPaste decides between
        // uploading copied files and pasting copied clips. Preventing it here would
        // swallow the event and the files with it.
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
        this.state.deleteOrRemoveCurrentSelection();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        if (this.state.canNudgeSelected()) {
          this.state.nudgeAnySelected(-1, event.shiftKey ? 1.0 : 0.2);
        } else if (event.shiftKey) {
          this.state.extendClipSelection(-1);
        } else {
          this.state.step(-1 / 30);
        }
        break;
      case 'ArrowRight':
        event.preventDefault();
        if (this.state.canNudgeSelected()) {
          this.state.nudgeAnySelected(1, event.shiftKey ? 1.0 : 0.2);
        } else if (event.shiftKey) {
          this.state.extendClipSelection(1);
        } else {
          this.state.step(1 / 30);
        }
        break;
      case 'KeyM':
        event.preventDefault();
        this.state.toggleSelectedMute();
        break;
      case 'Escape':
        event.preventDefault();
        // Cancel split dialog first; if it was not open, fall through to clear selections.
        if (this.state.splitPrompt()) {
          this.cancelSplit();
        } else {
          this.state.clearAllSelections();
        }
        break;
      case 'Enter':
        // Confirm split dialog if it is open and the split point is valid.
        if (this.state.splitPrompt() && !this.state.splitPromptInvalid()) {
          event.preventDefault();
          this.confirmSplit();
        }
        break;
      case 'KeyF':
        event.preventDefault();
        this.state.toggleAppFullscreen();
        break;
    }
  }
}
