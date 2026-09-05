import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { RenderJob, isTerminal } from '../../core/models/api.models';
import { ApiService } from '../../core/services/api.service';
import { ProjectStore } from '../../core/services/project-store';
import { StatusService } from '../../core/services/status.service';

/** Queue a render, watch it, then play or download the result. */
@Component({
  selector: 'app-render',
  imports: [DatePipe, DecimalPipe, RouterLink],
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

  readonly rendererAvailable = computed(() => this.store.renderer()?.available ?? false);

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
