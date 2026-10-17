import { Component, DestroyRef, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { catchError, finalize, of } from 'rxjs';

import { ApiFailure } from '../../core/interceptors/api-error.interceptor';
import { isTerminal } from '../../core/models/api.models';
import {
  ShortRow, ShortsBulkResponse, ShortsGroup, ShortsOverview, groupShorts, isOnDrive, isOnYouTube, isReady,
} from '../../core/models/shorts.models';
import { GoogleDriveStatus, YouTubeChannel, isValidDriveFolderName } from '../../core/models/youtube.models';
import { ActivityService } from '../../core/services/activity.service';
import { ApiService } from '../../core/services/api.service';
import { ShortsService } from '../../core/services/shorts.service';
import { StatusService } from '../../core/services/status.service';
import { YouTubePublishService } from '../../core/services/youtube-publish.service';

type StatusFilter = 'all' | 'rendering' | 'ready' | 'needs-youtube' | 'needs-drive' | 'on-youtube' | 'failed';
type Panel = 'drive' | 'youtube' | null;

const STATUS_FILTERS: readonly { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'rendering', label: 'Rendering' },
  { id: 'ready', label: 'Ready' },
  { id: 'needs-youtube', label: 'Not on YouTube' },
  { id: 'needs-drive', label: 'Not on Drive' },
  { id: 'on-youtube', label: 'On YouTube' },
  { id: 'failed', label: 'Failed' },
];

/** Fast while something is moving, so progress reads live; slow otherwise, to pick up work started elsewhere. */
const BUSY_POLL_MS = 4000;
const IDLE_POLL_MS = 60000;

/**
 * Every short - grouped into the Auto Shorts batch it came from - with where each one has
 * gone, and bulk actions to send many at once: save to Google Drive, publish to YouTube,
 * download, retry. Used whole on the Shorts page, and narrowed to one project on that
 * project's Videos & Shorts tab.
 */
@Component({
  selector: 'app-shorts-board',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './shorts-board.component.html',
  styleUrl: './shorts-board.component.css',
})
export class ShortsBoardComponent {
  private readonly shorts = inject(ShortsService);
  private readonly api = inject(ApiService);
  private readonly youtube = inject(YouTubePublishService);
  private readonly activity = inject(ActivityService);
  private readonly status = inject(StatusService);

  /** Narrows the board to one project (the Videos & Shorts tab). */
  readonly projectId = input<string | null>(null);
  /** Opens (and scrolls to) this batch, e.g. from the Auto Shorts dialog's link. */
  readonly focusBatch = input<string | null>(null);
  /** The project tab's tighter version: no stock tiles for other projects, fewer batches open. */
  readonly compact = input(false);

  readonly statusFilters = STATUS_FILTERS;
  readonly Math = Math;
  readonly overview = signal<ShortsOverview | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);

  // --- filters
  readonly scope = signal<'shorts' | 'all'>('shorts');
  readonly statusFilter = signal<StatusFilter>('all');
  readonly projectFilter = signal<string>('');
  readonly search = signal('');

  readonly projects = computed(() => {
    const seen = new Map<string, string>();
    for (const r of this.overview()?.shorts ?? []) seen.set(r.job.projectId, r.projectName);
    return [...seen.entries()].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  });

  readonly rows = computed(() => {
    const f = this.statusFilter();
    const project = this.projectFilter();
    const words = this.search().trim().toLowerCase().split(/\s+/).filter(Boolean);
    return (this.overview()?.shorts ?? []).filter((r) => {
      if (project && r.job.projectId !== project) return false;
      if (!this.matches(r, f)) return false;
      const text = `${r.job.name ?? ''} ${r.job.batchName ?? ''} ${r.projectName}`.toLowerCase();
      return words.every((w) => text.includes(w));
    });
  });

  readonly filterCounts = computed(() => {
    const all = this.overview()?.shorts ?? [];
    const counts = {} as Record<StatusFilter, number>;
    for (const f of STATUS_FILTERS) counts[f.id] = all.filter((r) => this.matches(r, f.id)).length;
    return counts;
  });

  readonly groups = computed(() => groupShorts(this.rows()));

  readonly alerts = computed(() => {
    const list = this.overview()?.alerts ?? [];
    const project = this.projectId();
    return project ? list.filter((a) => !a.projectId || a.projectId === project) : list;
  });

  // --- selection
  readonly selected = signal<ReadonlySet<string>>(new Set());
  readonly selectedRows = computed(() => (this.overview()?.shorts ?? []).filter((r) => this.selected().has(r.job.jobId)));
  readonly selectedReady = computed(() => this.selectedRows().filter(isReady));
  readonly selectedFailed = computed(() => this.selectedRows().filter((r) => r.job.status === 'Failed' || r.job.status === 'Cancelled'));
  readonly selectedForDrive = computed(() => this.selectedRows().filter((r) => !isTerminal(r.job.status) || isReady(r)));

  /** Batches the user has opened or closed; the rest follow the default (newest few open). */
  private readonly toggled = signal<ReadonlySet<string>>(new Set());

  /** The last bulk action's word on each render, shown on its row until the next action. */
  readonly results = signal<Record<string, { ok: boolean; skipped: boolean; message: string }>>({});

  // --- bulk panels
  readonly panel = signal<Panel>(null);
  readonly working = signal(false);

  readonly drives = signal<GoogleDriveStatus[] | null>(null);
  readonly driveChannelId = signal('');
  readonly driveTarget = computed(() => (this.drives() ?? []).find((d) => (d.channelId ?? '') === this.driveChannelId()) ?? null);
  readonly driveFolder = signal('');
  readonly driveFolders = signal<string[]>([]);
  readonly driveAgain = signal(false);
  readonly driveFolderError = computed(() => {
    const name = this.driveFolder().trim();
    return name && !isValidDriveFolderName(name) ? 'Use up to 100 letters, digits, spaces and - _ . ( ) &.' : null;
  });

  readonly channels = signal<YouTubeChannel[] | null>(null);
  readonly ytChannelId = signal('');
  readonly ytPrivacy = signal<'public' | 'unlisted' | 'private'>('private');
  readonly ytMadeForKids = signal(false);
  readonly ytShortsTag = signal(true);
  readonly ytDescription = signal('');
  readonly ytSkipPublished = signal(true);

  private timer: ReturnType<typeof setTimeout> | null = null;
  /** The batch already scrolled to, so a refresh doesn't keep yanking the page back. */
  private scrolledTo: string | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.stopTimer());

    // Reload whenever what is asked for changes.
    effect(() => {
      this.projectId();
      this.scope();
      untracked(() => this.load());
    });
  }

  load(): void {
    this.stopTimer();
    this.shorts.overview(this.projectId(), this.scope()).pipe(
      catchError((err: unknown) => {
        this.loadError.set(err instanceof ApiFailure ? err.message : 'Could not load your shorts.');
        return of(null);
      }),
      finalize(() => this.loading.set(false)),
    ).subscribe((o) => {
      if (o) {
        this.overview.set(o);
        this.loadError.set(null);
        // Selections of renders that are gone are dropped.
        const ids = new Set(o.shorts.map((r) => r.job.jobId));
        this.selected.update((s) => new Set([...s].filter((id) => ids.has(id))));
        this.scrollToFocus();
      }
      this.schedule();
    });
  }

  // --- groups

  isOpen(group: ShortsGroup, index: number): boolean {
    const byDefault = group.key === `batch:${this.focusBatch()}` || index < (this.compact() ? 1 : 3);
    return this.toggled().has(group.key) ? !byDefault : byDefault;
  }

  toggleGroup(group: ShortsGroup): void {
    this.toggled.update((s) => {
      const next = new Set(s);
      if (next.has(group.key)) next.delete(group.key); else next.add(group.key);
      return next;
    });
  }

  groupStats(group: ShortsGroup): { ready: number; rendering: number; failed: number; youtube: number; drive: number } {
    return {
      ready: group.rows.filter(isReady).length,
      rendering: group.rows.filter((r) => !isTerminal(r.job.status)).length,
      failed: group.rows.filter((r) => r.job.status === 'Failed').length,
      youtube: group.rows.filter(isOnYouTube).length,
      drive: group.rows.filter(isOnDrive).length,
    };
  }

  // --- selection

  isSelected(row: ShortRow): boolean {
    return this.selected().has(row.job.jobId);
  }

  toggleRow(row: ShortRow): void {
    this.selected.update((s) => {
      const next = new Set(s);
      if (next.has(row.job.jobId)) next.delete(row.job.jobId); else next.add(row.job.jobId);
      return next;
    });
  }

  groupSelection(group: ShortsGroup): 'all' | 'some' | 'none' {
    const n = group.rows.filter((r) => this.selected().has(r.job.jobId)).length;
    return n === 0 ? 'none' : n === group.rows.length ? 'all' : 'some';
  }

  toggleGroupSelection(group: ShortsGroup): void {
    const on = this.groupSelection(group) !== 'all';
    this.selected.update((s) => {
      const next = new Set(s);
      for (const r of group.rows) { if (on) next.add(r.job.jobId); else next.delete(r.job.jobId); }
      return next;
    });
  }

  /** Selects every shown short that still needs the given step. */
  selectNeeding(what: 'youtube' | 'drive' | 'failed'): void {
    const ids = this.rows().filter((r) =>
      what === 'failed' ? r.job.status === 'Failed' : isReady(r) && !(what === 'youtube' ? isOnYouTube(r) : isOnDrive(r)))
      .map((r) => r.job.jobId);
    this.selected.set(new Set(ids));
  }

  clearSelection(): void {
    this.selected.set(new Set());
    this.panel.set(null);
  }

  // --- bulk actions

  openPanel(p: Panel): void {
    this.panel.set(this.panel() === p ? null : p);
    if (p === 'drive' && this.drives() === null) {
      this.youtube.driveConnections().pipe(catchError(() => of([] as GoogleDriveStatus[]))).subscribe((list) => {
        this.drives.set(list);
        const first = list.find((d) => d.connected && !d.needsReconnect);
        if (first) this.pickDrive(first.channelId ?? '');
      });
    }
    if (p === 'youtube' && this.channels() === null) {
      this.youtube.status().pipe(catchError(() => of(null))).subscribe((s) => {
        const list = s?.channels ?? [];
        this.channels.set(list);
        const first = list.find((c) => !c.needsReconnect);
        if (first) this.ytChannelId.set(first.channelId);
      });
    }
  }

  pickDrive(channelId: string): void {
    this.driveChannelId.set(channelId);
    this.driveFolder.set('');
    this.driveFolders.set([]);
    const d = this.driveTarget();
    if (!d?.connected || d.needsReconnect) return;
    this.youtube.driveFolders(channelId || null).pipe(catchError(() => of([] as string[])))
      .subscribe((f) => { if (this.driveChannelId() === channelId) this.driveFolders.set(f); });
  }

  saveToDrive(): void {
    const ids = this.selectedForDrive().map((r) => r.job.jobId);
    const d = this.driveTarget();
    if (ids.length === 0 || !d?.connected || d.needsReconnect || this.driveFolderError() || this.working()) return;
    this.working.set(true);
    this.status.run(
      this.shorts.saveToDrive({ jobIds: ids, channelId: this.driveChannelId() || null, folderName: this.driveFolder(), again: this.driveAgain() })
        .pipe(finalize(() => this.working.set(false))),
      (res) => {
        this.afterBulk(res, 'saved to Drive');
        this.activity.resumeServerWork();
      },
    );
  }

  publishToYouTube(): void {
    const ids = this.selectedReady().map((r) => r.job.jobId);
    if (ids.length === 0 || !this.ytChannelId() || this.working()) return;
    this.working.set(true);
    this.status.run(
      this.shorts.publishToYouTube({
        jobIds: ids,
        channelId: this.ytChannelId(),
        privacy: this.ytPrivacy(),
        madeForKids: this.ytMadeForKids(),
        titleSuffix: this.ytShortsTag() ? '#shorts' : null,
        description: this.ytDescription().trim() || null,
        skipPublished: this.ytSkipPublished(),
      }).pipe(finalize(() => this.working.set(false))),
      (res) => {
        this.afterBulk(res, 'queued for YouTube');
        this.activity.resumeYouTubeUploads();
      },
    );
  }

  retry(): void {
    const ids = this.selectedFailed().map((r) => r.job.jobId);
    if (ids.length === 0 || this.working()) return;
    this.working.set(true);
    this.status.run(
      this.shorts.retry(ids).pipe(finalize(() => this.working.set(false))),
      (res) => {
        this.afterBulk(res, 'back in the queue');
        this.activity.resumeServerWork();
      },
    );
  }

  /** One download per ready short, a moment apart so the browser doesn't fold them into one. */
  download(): void {
    this.selectedReady().forEach((r, k) => setTimeout(() => {
      const a = document.createElement('a');
      a.href = this.api.downloadUrl(r.job.jobId);
      a.rel = 'noopener';
      a.click();
    }, k * 700));
  }

  downloadUrl(row: ShortRow): string {
    return this.api.downloadUrl(row.job.jobId);
  }

  // --- row display

  seconds(row: ShortRow): number | null {
    return row.job.outputDurationSeconds ?? row.job.diagnostics?.outputDurationSeconds ?? null;
  }

  aspect(row: ShortRow): string {
    const { width: w, height: h } = row.job;
    if (!w || !h) return '';
    return w < h ? '9:16' : w === h ? '1:1' : '16:9';
  }

  renderState(row: ShortRow): { label: string; tone: 'ok' | 'warn' | 'err' | 'busy' | 'muted'; percent: number | null } {
    const s = row.job.status;
    if (s === 'Completed') return { label: 'Ready', tone: 'ok', percent: null };
    if (s === 'CompletedWithWarnings') return { label: 'Ready (warnings)', tone: 'warn', percent: null };
    if (s === 'Failed') return { label: 'Failed', tone: 'err', percent: null };
    if (s === 'Cancelled') return { label: 'Cancelled', tone: 'muted', percent: null };
    if (s === 'Pending') return { label: 'Queued', tone: 'busy', percent: null };
    return { label: `Rendering ${Math.round(row.job.progress ?? 0)}%`, tone: 'busy', percent: Math.round(row.job.progress ?? 0) };
  }

  driveState(row: ShortRow): { label: string; tone: 'ok' | 'warn' | 'err' | 'busy' | 'muted'; url: string | null; title: string } {
    const d = row.drive;
    if (!d) return { label: '—', tone: 'muted', url: null, title: 'Not on Google Drive' };
    switch (d.state) {
      case 'Sending': return { label: 'Copying…', tone: 'busy', url: null, title: `Copying to ${d.folderName}` };
      case 'WaitingForRender': return { label: 'After render', tone: 'busy', url: null, title: `Copies to ${d.folderName} when the render finishes` };
      case 'Failed': return { label: 'Failed', tone: 'err', url: null, title: d.error || 'Copy failed' };
      default: return { label: 'On Drive', tone: 'ok', url: d.driveUrl, title: `In ${d.folderName}` };
    }
  }

  youtubeState(row: ShortRow): { label: string; tone: 'ok' | 'warn' | 'err' | 'busy' | 'muted'; url: string | null; title: string } {
    const y = row.youtube;
    if (!y) return { label: '—', tone: 'muted', url: null, title: 'Not on YouTube' };
    switch (y.state) {
      case 'Published': return { label: y.privacy && y.privacy !== 'public' ? `On YouTube · ${y.privacy}` : 'On YouTube', tone: 'ok', url: y.videoUrl, title: y.channelTitle ?? '' };
      case 'Queued': return { label: 'Waiting', tone: 'busy', url: null, title: `Waiting to upload to ${y.channelTitle}` };
      case 'Uploading': return { label: `Uploading ${y.percent}%`, tone: 'busy', url: null, title: `Uploading to ${y.channelTitle}` };
      default: return { label: 'Failed', tone: 'err', url: null, title: y.error || 'Upload failed' };
    }
  }

  when(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  runTime(seconds: number | null): string {
    if (seconds === null || !Number.isFinite(seconds)) return '';
    const s = Math.round(seconds);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }

  // --- internals

  private scrollToFocus(): void {
    const batch = this.focusBatch();
    if (!batch || this.scrolledTo === batch) return;
    this.scrolledTo = batch;
    setTimeout(() => document.getElementById(`batch:${batch}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  private matches(r: ShortRow, f: StatusFilter): boolean {
    switch (f) {
      case 'rendering': return !isTerminal(r.job.status);
      case 'ready': return isReady(r);
      case 'needs-youtube': return isReady(r) && !isOnYouTube(r);
      case 'needs-drive': return isReady(r) && !isOnDrive(r);
      case 'on-youtube': return isOnYouTube(r);
      case 'failed': return r.job.status === 'Failed' || r.drive?.state === 'Failed' || r.youtube?.state === 'Failed';
      default: return true;
    }
  }

  private afterBulk(res: ShortsBulkResponse, verb: string): void {
    const map: Record<string, { ok: boolean; skipped: boolean; message: string }> = {};
    for (const r of res.results) map[r.jobId] = { ok: r.ok, skipped: r.skipped, message: r.message };
    this.results.set(map);
    const parts = [`${res.started} ${verb}`];
    if (res.skipped) parts.push(`${res.skipped} skipped (already done)`);
    if (res.failed) parts.push(`${res.failed} refused - see the rows`);
    this.status.notify([parts.join(' · ')]);
    this.panel.set(null);
    this.load();
  }

  private busy(): boolean {
    return (this.overview()?.shorts ?? []).some((r) =>
      !isTerminal(r.job.status)
      || r.drive?.state === 'Sending' || r.drive?.state === 'WaitingForRender'
      || r.youtube?.state === 'Queued' || r.youtube?.state === 'Uploading');
  }

  private schedule(): void {
    this.stopTimer();
    this.timer = setTimeout(() => this.load(), this.busy() ? BUSY_POLL_MS : IDLE_POLL_MS);
  }

  private stopTimer(): void {
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
  }
}
