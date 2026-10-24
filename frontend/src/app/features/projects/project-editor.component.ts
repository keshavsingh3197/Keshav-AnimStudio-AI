import html2canvas from 'html2canvas';
import { ApiService } from '../../core/services/api.service';
import { StatusService } from '../../core/services/status.service';
import { Component, computed, effect, inject, input } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { aspectRatioLabel, videoFormat } from '../../core/models/api.models';
import { ProjectStore } from '../../core/services/project-store';

/**
 * The frame around one project: its header, its tabs and the outlet the feature screens
 * render into. Loading happens here so a child screen can assume the cast, the files and
 * the scene list are already in hand.
 */
@Component({
  selector: 'app-project-editor',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './project-editor.component.html',
  // Owned by this component, so the open project's state lives exactly as long as the editor
  // for that project - every routed screen below the outlet shares this one instance.
  providers: [ProjectStore],
})
export class ProjectEditorComponent {
  /** Bound from the route by withComponentInputBinding(). */
  readonly projectId = input.required<string>();

  readonly store = inject(ProjectStore);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly status = inject(StatusService);

  readonly totalDurationSeconds = computed(() =>
    this.store.scenes().reduce((acc, s) => acc + (s.durationSeconds || 0), 0)
  );

  readonly totalDurationFormatted = computed(() => {
    const total = Math.round(this.totalDurationSeconds());
    if (total <= 0) return '0s';
    const m = Math.floor(total / 60);
    const s = total % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  });

  get isVideoEditor(): boolean {
    return this.router.url.includes('/clips');
  }

  constructor() {
    // Re-runs if the route swaps to another project without destroying the component.
    effect(() => this.store.load(this.projectId()));
  }

  /**
   * Draft until every scene has a background, then Ready; Rendered once a video has come
   * out of it, which stays true even after later edits.
   */
  /** Short / Video / Square, derived from the canvas so it can never be out of date. */
  format(width: number, height: number): string {
    return videoFormat(width, height);
  }

  formatClass(width: number, height: number): string {
    return videoFormat(width, height) === 'Short' ? 'pill ok' : 'pill';
  }

  aspect(width: number, height: number): string {
    return aspectRatioLabel(width, height);
  }

  statusClass(status: string): string {
    if (status === 'Rendered') return 'pill ok';
    if (status === 'Rendering') return 'pill warn';
    if (status === 'Ready') return 'pill ok';
    return 'pill';
  }

  renameProject(): void {
    const p = this.store.project();
    if (!p) return;
    const next = prompt('Rename project:', p.name);
    if (!next || !next.trim() || next.trim() === p.name) return;

    const intent = (p.distributionIntent && p.distributionIntent !== 'Social Media')
      ? p.distributionIntent
      : 'Public';

    this.status.run(
      this.api.updateProject(p.id, {
        name: next.trim(),
        description: p.description,
        width: p.width,
        height: p.height,
        fps: p.fps,
        isPinned: p.isPinned,
        distributionIntent: intent,
        acceptShareAlikeObligation: p.acceptShareAlikeObligation,
        backgroundMusicAssetId: p.backgroundMusicAssetId,
        backgroundMusicVolume: p.backgroundMusicVolume,
        customThumbnail: p.customThumbnail,
        brandChannelId: p.brandChannelId ?? null,
      }),
      (updated) => {
        this.store.project.set(updated);
        this.status.notify([`Project renamed to "${updated.name}".`]);
      }
    );
  }

  exportBundle(): void {
    const p = this.store.project();
    if (!p) return;
    window.open(this.api.bundleExportUrl(p.id, false), '_blank');
  }

  captureScreenshot(): void {
    this.status.notify(['Capturing screenshot...']);
    html2canvas(document.body, {
      useCORS: true,
      windowWidth: document.body.scrollWidth,
      windowHeight: document.body.scrollHeight,
    }).then(canvas => {
      const base64Image = canvas.toDataURL('image/jpeg', 0.8);
      const viewName = window.location.pathname.split('/').pop() || 'screenshot';

      this.status.run(this.api.saveDebugScreenshot(base64Image, viewName), () => {
        this.status.notify(['Screenshot saved to App_Data/screenshots']);
      });
    }).catch(err => {
      this.status.error.set('Capture failed: ' + err.message);
    });
  }
}

