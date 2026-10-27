import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, defer, tap } from 'rxjs';

import { ApiFailure } from '../interceptors/api-error.interceptor';
import { RenderJob, isTerminal } from '../models/api.models';
import { PhoneHandoff, YouTubeUpload, isUploadFinished } from '../models/youtube.models';
import { ApiService } from './api.service';
import { ShortsService } from './shorts.service';
import { YouTubePublishService } from './youtube-publish.service';

export type ActivityKind = 'export' | 'render' | 'youtube' | 'upload' | 'download' | 'drive';
export type ActivityState = 'running' | 'done' | 'warning' | 'failed' | 'cancelled';

export interface ActivityItem {
  id: string;
  kind: ActivityKind;
  title: string;
  /** One line under the title: the current stage, the channel, the file size, the error. */
  detail: string | null;
  state: ActivityState;
  /** 0-100, or null when the work can't say how far along it is. */
  percent: number | null;
  startedAt: Date;
  finishedAt: Date | null;
  /** Router commands for "open" - the page the work belongs to. */
  link: unknown[] | null;
  /** An outside page for the finished work, e.g. the video on YouTube. */
  externalUrl: string | null;
}

/** "12.4 MB" - for the detail line of a file being sent. */
export function formatBytes(bytes: number): string {
  if (!bytes || bytes < 1024) return `${bytes || 0} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[unit]}`;
}

const POLL_MS = 3000;
/** Finished items beyond this are dropped, oldest first, so the list can't grow for ever. */
const MAX_FINISHED = 20;

/**
 * Everything long-running the user has set off - exports, renders, YouTube uploads, file
 * uploads, downloads - in one list the shell shows in a corner panel.
 *
 * Features hand work over here when they start it. Server-side jobs are then polled from
 * here rather than by the page, so a render keeps reporting after the user navigates away
 * from the editor that started it. Items live for the visit; on load, renders, Drive copies
 * and YouTube uploads still running on the server are picked back up, so a refresh in the
 * middle of a batch loses nothing.
 */
@Injectable({ providedIn: 'root' })
export class ActivityService {
  private readonly api = inject(ApiService);
  private readonly youtube = inject(YouTubePublishService);
  private readonly shorts = inject(ShortsService);

  private readonly itemList = signal<ActivityItem[]>([]);
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();
  private nextId = 1;

  /** Newest first. */
  readonly items = this.itemList.asReadonly();
  readonly running = computed(() => this.itemList().filter((i) => i.state === 'running'));
  readonly finished = computed(() => this.itemList().filter((i) => i.state !== 'running'));

  constructor() {
    this.resumeYouTubeUploads();
    this.resumeServerWork();
  }

  /** The row following a render job, if any - e.g. for a dialog to show its live status. */
  jobItem(jobId: string): ActivityItem | undefined {
    return this.itemList().find((i) => i.id === `job:${jobId}`);
  }

  /**
   * Picks up renders and Drive copies running on the server that this visit isn't
   * following yet - after a refresh, or after a batch queued Drive copies of its own.
   */
  resumeServerWork(): void {
    // Quiet on failure, like the YouTube resume: an empty panel is better than a banner.
    this.shorts.active().subscribe({
      next: ({ jobs, driveCopies }) => {
        for (const job of jobs) {
          if (this.find(`job:${job.jobId}`)) continue;
          this.trackRenderJob(job, job.name || 'Render',
            job.batchId ? ['/shorts'] : ['/projects', job.projectId, 'render']);
        }
        for (const copy of driveCopies) {
          if (!this.find(`drive:${copy.id}`)) this.trackDriveCopy(copy);
        }
      },
      error: () => undefined,
    });
  }

  /** Follows a copy to Google Drive until it lands (or fails). */
  trackDriveCopy(copy: PhoneHandoff, link: unknown[] | null = ['/shorts']): void {
    const id = `drive:${copy.id}`;
    this.upsert(id, { kind: 'drive', title: copy.title || 'Copy to Drive', link, ...this.fromHandoff(copy) });
    if (this.find(id)?.state === 'running') this.pollHandoff(id, copy.id);
  }

  /**
   * Follows a render or clip-merge job until it ends. Calling it again for the same job
   * (e.g. the page re-opened it) just refreshes the existing row.
   */
  trackRenderJob(job: RenderJob, title: string, link: unknown[] | null = null): void {
    const id = `job:${job.jobId}`;
    const kind: ActivityKind = job.kind === 'ClipMerge' ? 'export' : 'render';
    this.upsert(id, { kind, title, link, ...this.fromJob(job) });
    if (!isTerminal(job.status)) this.pollJob(id, job.jobId);
  }

  trackYouTubeUpload(upload: YouTubeUpload, link: unknown[] | null = ['/youtube']): void {
    const id = `yt:${upload.uploadId}`;
    this.upsert(id, { kind: 'youtube', title: upload.title || 'YouTube upload', link, ...this.fromUpload(upload) });
    if (!isUploadFinished(upload)) this.pollUpload(id, upload.uploadId);
  }

  /**
   * Wraps a one-shot request (a file upload, a download) so it shows in the list while it
   * runs. `start` is handed a callback for percent progress; work that can't report any
   * shows as indeterminate. Unsubscribing early marks the row cancelled.
   */
  trackRequest<T>(
    kind: ActivityKind,
    title: string,
    start: (onProgress: (percent: number) => void) => Observable<T>,
    options: { detail?: string | null; link?: unknown[] | null; reportsProgress?: boolean } = {},
  ): Observable<T> {
    return defer(() => {
      const id = `req:${this.nextId++}`;
      this.upsert(id, {
        kind, title,
        detail: options.detail ?? null,
        link: options.link ?? null,
        state: 'running',
        percent: options.reportsProgress ? 0 : null,
      });
      let ended = false;
      const end = (state: ActivityState, detail?: string) => {
        if (ended) return;
        ended = true;
        this.patch(id, {
          state,
          percent: state === 'done' ? 100 : this.find(id)?.percent ?? null,
          ...(detail !== undefined ? { detail } : {}),
          finishedAt: new Date(),
        });
      };
      return start((percent) => this.patch(id, { percent })).pipe(tap({
        next: () => end('done'),
        complete: () => end('done'),
        error: (failure: unknown) => end('failed', failure instanceof ApiFailure ? failure.message : 'Failed.'),
        unsubscribe: () => end('cancelled'),
      }));
    });
  }

  dismiss(id: string): void {
    this.stopTimer(id);
    this.itemList.update((list) => list.filter((i) => i.id !== id));
  }

  clearFinished(): void {
    this.itemList.update((list) => list.filter((i) => i.state === 'running'));
  }

  /** Follows YouTube uploads running on the server that this visit isn't following yet. */
  resumeYouTubeUploads(): void {
    // Not knowing about an upload is not worth an error banner (YouTube may simply not be
    // set up on this server), so failures here are deliberately quiet.
    this.youtube.uploads().subscribe({
      next: (uploads) => uploads.filter((u) => !isUploadFinished(u)).forEach((u) => this.trackYouTubeUpload(u)),
      error: () => undefined,
    });
  }

  private pollJob(id: string, jobId: string): void {
    this.schedule(id, () => this.api.job(jobId).subscribe({
      next: (job) => {
        if (!this.find(id)) return;
        this.patch(id, this.fromJob(job));
        if (!isTerminal(job.status)) this.pollJob(id, jobId);
      },
      // A blip while polling isn't the job failing; try again a little later. A refusal is
      // permanent, though, and retrying it every few seconds starves the page's own requests.
      error: (err: unknown) => this.retryUnlessRefused(id, err, () => this.pollJob(id, jobId)),
    }));
  }

  private pollHandoff(id: string, handoffId: string): void {
    this.schedule(id, () => this.youtube.handoff(handoffId).subscribe({
      next: (copy) => {
        if (!this.find(id)) return;
        const fields = this.fromHandoff(copy);
        this.patch(id, fields);
        if (fields.state === 'running') this.pollHandoff(id, handoffId);
      },
      error: (err: unknown) => this.retryUnlessRefused(id, err, () => this.pollHandoff(id, handoffId)),
    }));
  }

  private fromHandoff(copy: PhoneHandoff): Partial<ActivityItem> {
    const state: ActivityState =
      copy.state === 'Sending' || copy.state === 'WaitingForRender' ? 'running'
        : copy.state === 'Failed' ? 'failed'
          : copy.state === 'Cancelled' ? 'cancelled'
            : copy.state === 'Expired' ? 'warning'
              : 'done';
    return {
      state,
      percent: copy.state === 'Sending' ? Math.round(copy.percent ?? 0) : state === 'running' ? null : 100,
      detail: state === 'failed'
        ? copy.error || 'Copy to Drive failed.'
        : copy.state === 'WaitingForRender'
          ? 'Copies to Drive when the render finishes'
          : copy.state === 'Sending'
            ? `Copying to Drive · ${copy.folderName}`
            : `On Google Drive · ${copy.folderName}`,
      externalUrl: copy.driveUrl ?? null,
      finishedAt: state === 'running' ? null : new Date(copy.sentAt ?? Date.now()),
    };
  }

  private pollUpload(id: string, uploadId: string): void {
    this.schedule(id, () => this.youtube.upload(uploadId).subscribe({
      next: (upload) => {
        if (!this.find(id)) return;
        this.patch(id, this.fromUpload(upload));
        if (!isUploadFinished(upload)) this.pollUpload(id, uploadId);
      },
      error: (err: unknown) => this.retryUnlessRefused(id, err, () => this.pollUpload(id, uploadId)),
    }));
  }

  private fromJob(job: RenderJob): Partial<ActivityItem> {
    const terminal = isTerminal(job.status);
    const state: ActivityState =
      job.status === 'Completed' ? 'done'
        : job.status === 'CompletedWithWarnings' ? 'warning'
          : job.status === 'Failed' ? 'failed'
            : terminal ? 'cancelled'
              : 'running';
    const unit = job.kind === 'ClipMerge' ? 'clip' : 'scene';
    const counted = job.scenesTotal > 0 ? ` · ${unit} ${Math.min(job.scenesDone + 1, job.scenesTotal)} of ${job.scenesTotal}` : '';
    return {
      state,
      percent: state === 'done' || state === 'warning' ? 100 : Math.round(job.progress ?? 0),
      detail: state === 'failed'
        ? job.errorMessage || 'Export failed.'
        : terminal
          ? (state === 'cancelled' ? 'Cancelled' : 'Ready to download')
          : `${job.message || job.currentStage || 'Working'}${counted}`,
      finishedAt: terminal ? new Date(job.completedAt ?? Date.now()) : null,
    };
  }

  private fromUpload(upload: YouTubeUpload): Partial<ActivityItem> {
    const state: ActivityState =
      upload.state === 'Completed' ? (upload.warning ? 'warning' : 'done')
        : upload.state === 'Failed' ? 'failed'
          : upload.state === 'Cancelled' ? 'cancelled'
            : 'running';
    return {
      state,
      percent: upload.state === 'Queued' ? null : Math.round(upload.percent ?? 0),
      detail: state === 'failed'
        ? upload.error || 'Upload failed.'
        : upload.state === 'Completed'
          ? upload.warning || `Published to ${upload.channelTitle}`
          : upload.state === 'Queued'
            ? `Waiting to upload to ${upload.channelTitle}`
            : `Uploading to ${upload.channelTitle}`,
      externalUrl: upload.videoUrl ?? null,
      finishedAt: isUploadFinished(upload) ? new Date(upload.completedAt ?? Date.now()) : null,
    };
  }

  private upsert(id: string, fields: Partial<ActivityItem>): void {
    if (this.find(id)) {
      this.patch(id, fields);
      return;
    }
    const item: ActivityItem = {
      id,
      kind: 'upload',
      title: '',
      detail: null,
      state: 'running',
      percent: null,
      startedAt: new Date(),
      finishedAt: null,
      link: null,
      externalUrl: null,
      ...fields,
    };
    this.itemList.update((list) => this.trim([item, ...list]));
  }

  private patch(id: string, fields: Partial<ActivityItem>): void {
    this.itemList.update((list) => this.trim(list.map((i) => (i.id === id ? { ...i, ...fields } : i))));
  }

  private find(id: string): ActivityItem | undefined {
    return this.itemList().find((i) => i.id === id);
  }

  private trim(list: ActivityItem[]): ActivityItem[] {
    let finished = 0;
    return list.filter((i) => i.state === 'running' || ++finished <= MAX_FINISHED);
  }

  /**
   * Retries a failed poll, except when the server refused it (signed out, not yours, gone):
   * that row stops and says so. Work still running on the server is picked up again by
   * {@link resumeServerWork} on the next visit.
   */
  private retryUnlessRefused(id: string, err: unknown, retry: () => void): void {
    const status = err instanceof ApiFailure ? err.status : (err as { status?: number } | null)?.status;
    if (status === 401 || status === 403 || status === 404) {
      if (!this.find(id)) return;
      this.stopTimer(id);
      this.patch(id, {
        state: 'failed',
        detail: status === 404 ? 'No longer on the server.' : 'Not available to this account. Sign in again to follow it.',
        finishedAt: new Date(),
      });
      return;
    }
    retry();
  }

  private schedule(id: string, work: () => void): void {
    this.stopTimer(id);
    this.timers.set(id, setTimeout(() => {
      this.timers.delete(id);
      work();
    }, POLL_MS));
  }

  private stopTimer(id: string): void {
    const handle = this.timers.get(id);
    if (handle !== undefined) clearTimeout(handle);
    this.timers.delete(id);
  }
}
