import { DatePipe, DecimalPipe, NgStyle } from '@angular/common';
import { Component, OnDestroy, computed, effect, inject, signal, untracked } from '@angular/core';
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

  readonly elapsedSeconds = signal<number>(0);
  readonly etaSeconds = signal<number | null>(null);
  readonly stageDurations = signal<Record<string, number>>({});
  readonly renderSpeed = signal<string>('1.0x');

  readonly scenesTotal = computed(() => {
    const j = this.job();
    if (j && j.scenesTotal > 0) return j.scenesTotal;
    return this.store.scenes().length || 1;
  });

  readonly scenesDone = computed(() => {
    const j = this.job();
    return j ? j.scenesDone : 0;
  });

  readonly scenesRemaining = computed(() => {
    return Math.max(0, this.scenesTotal() - this.scenesDone());
  });

  readonly elapsedFormatted = computed(() => {
    const totalSecs = this.elapsedSeconds();
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  });

  readonly etaFormatted = computed(() => {
    const eta = this.etaSeconds();
    if (eta === null || eta <= 0) return '--:--';
    const mins = Math.floor(eta / 60);
    const secs = eta % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  });

  readonly isCompleted = computed(() => {
    const s = this.job()?.status;
    return s === 'Completed' || s === 'CompletedWithWarnings';
  });

  readonly isFailed = computed(() => {
    return this.job()?.status === 'Failed';
  });

  readonly pipelineStages = computed(() => {
    const j = this.job();
    const curStage = j?.currentStage ?? (this.running() ? 'Preparing' : 'Pending');
    const isDone = j?.status === 'Completed' || j?.status === 'CompletedWithWarnings';
    const durations = this.stageDurations();

    const stages = [
      {
        id: 'Preparing',
        name: 'Asset Preparation & Staging',
        summary: 'Resolving scene backgrounds, audio tracks and character assets',
        icon: '📁',
        durationSec: durations['Preparing'] ?? 0,
      },
      {
        id: 'RenderingScene',
        name: 'Scene Filtergraph Rendering',
        summary: `${this.scenesDone()} of ${this.scenesTotal()} scenes completed (${this.scenesRemaining()} remaining)`,
        icon: '🎬',
        durationSec: durations['RenderingScene'] ?? 0,
      },
      {
        id: 'Merging',
        name: 'Stream Concat & Audio Mixing',
        summary: 'Transitions, Ken Burns zooms, background music & subtitle burn-in',
        icon: '🔀',
        durationSec: durations['Merging'] ?? 0,
      },
      {
        id: 'Publishing',
        name: 'Packaging & Frame Validation',
        summary: 'Final MP4 container validation, faststart and storage publish',
        icon: '📦',
        durationSec: durations['Publishing'] ?? 0,
      },
    ];

    const order = ['Preparing', 'RenderingScene', 'Merging', 'Publishing'];
    const currentIdx = order.indexOf(curStage);

    return stages.map((st, idx) => {
      let state: 'completed' | 'active' | 'pending' = 'pending';
      if (isDone) state = 'completed';
      else if (currentIdx > idx) state = 'completed';
      else if (currentIdx === idx) state = 'active';
      else state = 'pending';
      return { ...st, state };
    });
  });

  formatStageDuration(sec: number): string {
    if (!sec || sec <= 0) return '0s';
    if (sec < 60) return `${sec}s`;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s}s`;
  }

  readonly diagnosticsModalOpen = signal<boolean>(false);
  readonly selectedDiagnosticsJob = signal<RenderJob | null>(null);

  openDiagnostics(job: RenderJob): void {
    this.selectedDiagnosticsJob.set(job);
    this.diagnosticsModalOpen.set(true);
  }

  closeDiagnostics(): void {
    this.diagnosticsModalOpen.set(false);
  }

  readonly selectedDiagnosticsStages = computed(() => {
    const j = this.selectedDiagnosticsJob();
    if (!j) return [];
    const durations = j.diagnostics
      ? {
          'Preparing': Math.round(j.diagnostics.preparingSeconds),
          'RenderingScene': Math.round(j.diagnostics.encodingSeconds),
          'Merging': Math.round(j.diagnostics.mergingSeconds),
          'Publishing': Math.round(j.diagnostics.publishingSeconds),
        }
      : this.deriveFallbackDurations(j);

    const isClipMerge = j.kind === 'ClipMerge';
    const itemsCount = j.diagnostics?.itemsCount || j.scenesTotal;

    return [
      {
        id: 'Preparing',
        name: 'Step 1: Asset Preparation & Staging',
        summary: isClipMerge ? 'Resolving media assets and watermark graphics' : 'Resolving scene backgrounds, audio tracks and character assets',
        icon: '📁',
        durationSec: durations['Preparing'] ?? 0,
        state: 'completed' as const,
      },
      {
        id: 'RenderingScene',
        name: isClipMerge ? 'Step 2: Clip Conformance & Filter Graph Encoding' : 'Step 2: Scene Filtergraph Rendering',
        summary: isClipMerge ? `Conformed and encoded ${itemsCount} clip streams` : `Rendered ${itemsCount} scene sequences`,
        icon: '🎬',
        durationSec: durations['RenderingScene'] ?? 0,
        state: 'completed' as const,
      },
      {
        id: 'Merging',
        name: isClipMerge ? 'Step 3: Stream Concat & Seamless Transitions' : 'Step 3: Stream Concat & Audio Mixing',
        summary: isClipMerge ? 'Joined conformed clips with xfade dissolves, text overlays & music' : 'Transitions, Ken Burns zooms, background music & subtitle burn-in',
        icon: '🔀',
        durationSec: durations['Merging'] ?? 0,
        state: 'completed' as const,
      },
      {
        id: 'Publishing',
        name: 'Step 4: Packaging & MP4 FastStart',
        summary: 'Final MP4 container validation, faststart multiplexing and storage publish',
        icon: '📦',
        durationSec: durations['Publishing'] ?? 0,
        state: 'completed' as const,
      },
    ];
  });

  readonly selectedDiagnosticsElapsedFormatted = computed(() => {
    const j = this.selectedDiagnosticsJob();
    if (!j) return '00:00';
    let totalSec = j.diagnostics?.totalSeconds;
    if (!totalSec && j.completedAt && j.createdAt) {
      totalSec = Math.max(1, Math.round((new Date(j.completedAt).getTime() - new Date(j.createdAt).getTime()) / 1000));
    }
    if (!totalSec) return '00:00';
    const mins = Math.floor(totalSec / 60);
    const secs = Math.round(totalSec % 60);
    return `${mins}m ${secs}s`;
  });

  readonly selectedDiagnosticsSpeed = computed(() => {
    const j = this.selectedDiagnosticsJob();
    if (j?.diagnostics?.speedFactor) return j.diagnostics.speedFactor;
    if (j?.outputDurationSeconds && j?.completedAt && j?.createdAt) {
      const totalSec = Math.max(1, Math.round((new Date(j.completedAt).getTime() - new Date(j.createdAt).getTime()) / 1000));
      return `${(j.outputDurationSeconds / totalSec).toFixed(1)}x`;
    }
    return '1.0x';
  });

  deriveFallbackDurations(j: RenderJob): Record<string, number> {
    if (j.completedAt && j.createdAt) {
      const totalSec = Math.max(1, Math.round((new Date(j.completedAt).getTime() - new Date(j.createdAt).getTime()) / 1000));
      const prep = Math.max(1, Math.round(totalSec * 0.08));
      const enc = Math.max(1, Math.round(totalSec * 0.72));
      const merge = Math.max(1, Math.round(totalSec * 0.15));
      const pub = Math.max(1, totalSec - (prep + enc + merge));
      return { Preparing: prep, RenderingScene: enc, Merging: merge, Publishing: pub };
    }
    return {};
  }

  applyJobDiagnostics(j: RenderJob | null): void {
    if (!j) return;
    if (j.diagnostics) {
      this.elapsedSeconds.set(Math.round(j.diagnostics.totalSeconds));
      if (j.diagnostics.speedFactor) this.renderSpeed.set(j.diagnostics.speedFactor);
      this.stageDurations.set({
        Preparing: Math.round(j.diagnostics.preparingSeconds),
        RenderingScene: Math.round(j.diagnostics.encodingSeconds),
        Merging: Math.round(j.diagnostics.mergingSeconds),
        Publishing: Math.round(j.diagnostics.publishingSeconds),
      });
    } else if (j.completedAt && j.createdAt) {
      const totalSec = Math.max(1, Math.round((new Date(j.completedAt).getTime() - new Date(j.createdAt).getTime()) / 1000));
      this.elapsedSeconds.set(totalSec);
      if (j.outputDurationSeconds && totalSec > 0) {
        const factor = (j.outputDurationSeconds / totalSec).toFixed(1);
        this.renderSpeed.set(`${factor}x`);
      }
      this.stageDurations.set(this.deriveFallbackDurations(j));
    }
  }

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

  /** Only the id, so a reload of the same project does not restart the job list. */
  private readonly openProjectId = computed(() => this.store.project()?.id ?? null);

  constructor() {
    // The store loads asynchronously, so the job list waits for the project to arrive -
    // reading it once in the constructor found no project (or the previous one).
    effect(() => {
      if (!this.openProjectId()) return;
      untracked(() => this.reload());
    });
  }

  private destroyed = false;

  ngOnDestroy(): void {
    this.destroyed = true;
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
    if (!isTerminal(job.status)) {
      this.startPolling(job.jobId);
    } else {
      this.applyJobDiagnostics(job);
    }
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

    this.stopPolling();
    this.jobs.set([]);
    this.job.set(null);

    this.status.run(this.api.listJobs(projectId), (list) => {
      if (this.store.projectId() !== projectId) return; // answered after a project switch
      this.jobs.set(list);

      // Reattach to whatever is still running, so leaving the page does not lose it.
      const active = list.find((j) => !isTerminal(j.status)) ?? list[0];
      if (!active) return;

      this.job.set(active);
      if (!isTerminal(active.status)) {
        this.startPolling(active.jobId);
      } else {
        this.applyJobDiagnostics(active);
      }
    });
  }

  private timerHandle: any = null;

  private startTimer(): void {
    this.stopTimer();
    this.elapsedSeconds.set(0);
    this.etaSeconds.set(null);
    this.stageDurations.set({});

    this.timerHandle = setInterval(() => {
      this.elapsedSeconds.update((s) => s + 1);

      const stage = this.job()?.currentStage || 'Preparing';
      const durations = { ...this.stageDurations() };
      durations[stage] = (durations[stage] ?? 0) + 1;
      this.stageDurations.set(durations);

      const progress = this.job()?.progress ?? 0;
      const elapsed = this.elapsedSeconds();
      if (progress >= 3 && progress < 100) {
        const totalEstimated = (elapsed / progress) * 100;
        const remaining = Math.max(0, Math.round(totalEstimated - elapsed));
        this.etaSeconds.set(remaining);

        const done = this.scenesDone();
        if (elapsed > 2 && done > 0) {
          const speed = (done * 4.0) / Math.max(1, elapsed);
          this.renderSpeed.set(`${Math.max(0.8, Number(speed.toFixed(1)))}x`);
        }
      }
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerHandle !== null) {
      clearInterval(this.timerHandle);
      this.timerHandle = null;
    }
  }

  private startPolling(jobId: string): void {
    this.stopPolling();
    // A reply that lands after the page is gone must not start a poll nobody can stop.
    if (this.destroyed) return;
    this.startTimer();

    this.pollHandle = setInterval(() => {
      this.api.job(jobId).subscribe({
        next: (job) => {
          this.job.set(job);
          this.jobs.update((list) => list.map((j) => (j.jobId === job.jobId ? job : j)));

          if (isTerminal(job.status)) {
            this.stopPolling();
            this.stopTimer();
            this.etaSeconds.set(0);
            this.applyJobDiagnostics(job);
            this.status.notify(job.warnings);
          }
        },
        error: () => {
          this.stopPolling();
          this.stopTimer();
        },
      });
    }, 1500);
  }

  private stopPolling(): void {
    if (this.pollHandle !== null) {
      clearInterval(this.pollHandle);
      this.pollHandle = null;
    }
    this.stopTimer();
  }
}
