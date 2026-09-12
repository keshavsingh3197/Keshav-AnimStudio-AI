import { DatePipe, DecimalPipe, NgStyle } from '@angular/common';
import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import {
  RenderJob, aspectRatioLabel, isTerminal, videoFormat,
} from '../../core/models/api.models';
import { ApiService } from '../../core/services/api.service';
import { ProjectStore } from '../../core/services/project-store';
import { StatusService } from '../../core/services/status.service';

/** Queue a render, watch it, then play or download the result. */
@Component({
  selector: 'app-render',
  imports: [DatePipe, DecimalPipe, FormsModule, NgStyle, RouterLink],
  templateUrl: './render.component.html',
})
export class RenderComponent implements OnDestroy {
  private readonly api = inject(ApiService);

  readonly store = inject(ProjectStore);
  readonly status = inject(StatusService);

  /** Polling handle; cleared on every terminal status and on destroy. */
  private pollHandle: ReturnType<typeof setInterval> | null = null;

  readonly jobs = signal<RenderJob[]>([]);
  readonly job = signal<RenderJob | null>(null);

  readonly previewFit = signal<'contain' | 'cover'>('contain');
  readonly previewZoom = signal<number>(100);
  readonly hasVideoClips = computed(() => this.store.assets().some((a) => a.kind === 'Video'));

  readonly rendererAvailable = computed(() => this.store.renderer()?.available ?? false);

  /** Short / Video / Square, read off the canvas - the same rule every other screen uses. */
  format(width: number, height: number): string {
    return videoFormat(width, height);
  }

  formatClass(width: number, height: number): string {
    return videoFormat(width, height) === 'Short' ? 'pill ok' : 'pill';
  }

  aspect(width: number, height: number): string {
    return aspectRatioLabel(width, height);
  }

  jobFormat(job: RenderJob): string {
    if (job.targetFormat) return job.targetFormat;
    if (job.width && job.height) return videoFormat(job.width, job.height);
    const proj = this.store.project();
    return proj ? videoFormat(proj.width, proj.height) : 'Video';
  }

  jobAspect(job: RenderJob): string {
    if (job.width && job.height) return aspectRatioLabel(job.width, job.height);
    const proj = this.store.project();
    return proj ? aspectRatioLabel(proj.width, proj.height) : '16:9';
  }

  jobResolution(job: RenderJob): string {
    if (job.width && job.height) return `${job.width}\u00d7${job.height}`;
    const proj = this.store.project();
    return proj ? `${proj.width}\u00d7${proj.height}` : '1920\u00d71080';
  }

  jobFormatClass(job: RenderJob): string {
    return this.jobFormat(job) === 'Short' ? 'pill ok' : 'pill';
  }

  renderAsShort(): void {
    const project = this.store.project();
    if (!project) return;

    let width = project.width;
    let height = project.height;
    if (width > height) {
      width = project.height;
      height = project.width;
    }

    this.status.run(
      this.api.updateProject(project.id, {
        name: project.name,
        description: project.description ?? undefined,
        width,
        height,
        fps: project.fps,
        distributionIntent: project.distributionIntent,
        acceptShareAlikeObligation: project.acceptShareAlikeObligation,
        backgroundMusicAssetId: project.backgroundMusicAssetId ?? null,
        backgroundMusicVolume: project.backgroundMusicVolume,
      }),
      (updated) => {
        this.store.project.set(updated);
        this.render();
      }
    );
  }

  readonly blockedReason = computed(() => {
    if (!this.rendererAvailable()) {
      return this.store.renderer()?.unavailableReason
        ?? 'Video rendering is not configured on this server.';
    }

    if (this.store.scenes().length === 0) return 'This project has no scenes yet.';

    const missing = this.store.scenesMissingBackground().length;
    if (missing > 0) return `${missing} scene(s) still need a background image.`;

    return null;
  });

  readonly running = computed(() => {
    const current = this.job();
    return current !== null && !isTerminal(current.status);
  });

  constructor() {
    this.reload();
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  render(): void {
    const projectId = this.store.projectId();
    if (!projectId) return;

    this.status.run(this.api.render(projectId), (job) => {
      this.job.set(job);
      this.jobs.update((list) => [job, ...list]);
      this.startPolling(job.jobId);
    });
  }

  cancel(): void {
    const current = this.job();
    if (!current) return;

    this.status.run(this.api.cancelJob(current.jobId));
  }

  watch(job: RenderJob): void {
    this.job.set(job);
    if (!isTerminal(job.status)) this.startPolling(job.jobId);
  }

  previewUrl(jobId: string): string {
    return this.api.previewUrl(jobId);
  }

  downloadUrl(jobId: string): string {
    return this.api.downloadUrl(jobId);
  }

  /** The project's dialogue as one .srt, timed exactly as it was burned into this render. */
  subtitlesUrl(): string | null {
    const projectId = this.store.projectId();
    const hasDialogue = this.store.scenes().some((s) => s.dialogueLines > 0);
    return projectId && hasDialogue ? this.api.subtitlesUrl(projectId) : null;
  }

  setPreviewFit(fit: 'contain' | 'cover'): void {
    this.previewFit.set(fit);
  }

  setPreviewZoom(zoom: number): void {
    this.previewZoom.set(zoom);
  }

  playerContainerStyle(job: RenderJob): { [key: string]: string } {
    const isShort = this.jobFormat(job) === 'Short' || Boolean(job.width && job.height && job.height > job.width);
    if (isShort) {
      return {
        'aspect-ratio': '9 / 16',
        'max-width': '340px',
        'margin': '0 auto',
      };
    }
    const isSquare = this.jobFormat(job) === 'Square' || Boolean(job.width && job.height && job.height === job.width);
    if (isSquare) {
      return {
        'aspect-ratio': '1 / 1',
        'max-width': '480px',
        'margin': '0 auto',
      };
    }
    return {
      'aspect-ratio': '16 / 9',
      'max-width': '760px',
      'margin': '0 auto',
    };
  }

  statusClass(jobStatus: string): string {
    if (jobStatus === 'Completed' || jobStatus === 'CompletedWithWarnings') return 'pill ok';
    if (jobStatus === 'Failed') return 'pill err';
    if (jobStatus === 'Cancelled') return 'pill warn';
    return 'pill';
  }

  private reload(): void {
    const projectId = this.store.projectId();
    if (!projectId) return;

    this.status.run(this.api.listJobs(projectId), (list) => {
      this.jobs.set(list);

      // Reattach to whatever is still running, so leaving the page does not lose it.
      const active = list.find((j) => !isTerminal(j.status)) ?? list[0];
      if (!active) return;

      this.job.set(active);
      if (!isTerminal(active.status)) this.startPolling(active.jobId);
    });
  }

  private startPolling(jobId: string): void {
    this.stopPolling();

    // Polling rather than a socket, per the current design; the response shape is already
    // what a push transport would deliver, so swapping later changes nothing here.
    this.pollHandle = setInterval(() => {
      this.api.job(jobId).subscribe({
        next: (job) => {
          this.job.set(job);
          this.jobs.update((list) => list.map((j) => (j.jobId === job.jobId ? job : j)));

          if (isTerminal(job.status)) {
            this.stopPolling();
            this.status.notify(job.warnings);
          }
        },
        error: () => this.stopPolling(),
      });
    }, 2000);
  }

  private stopPolling(): void {
    if (this.pollHandle !== null) {
      clearInterval(this.pollHandle);
      this.pollHandle = null;
    }
  }
}
