import { Component, DestroyRef, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TimeoutError, catchError, finalize, of, timeout } from 'rxjs';

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
import { TopicPickerComponent } from '../../shared/topic-picker.component';

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

/** Large libraries: render in windows so 100k renders never means 100k DOM rows. */
const GROUPS_PAGE = 20;
const ROWS_PAGE = 50;
const ALERTS_COLLAPSED = 3;
const POOLS_COLLAPSED = 8;
const SEARCH_DEBOUNCE_MS = 250;

/**
 * Every short - grouped into the Auto Shorts batch it came from - with where each one has
 * gone, and bulk actions to send many at once: save to Google Drive, publish to YouTube,
 * download, retry. Used whole on the Shorts page, and narrowed to one project on that
 * project's Videos & Shorts tab.
 */
@Component({
  selector: 'app-shorts-board',
  standalone: true,
  imports: [FormsModule, RouterLink, TopicPickerComponent],
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
  /** What is typed; `search` follows it after a pause so each keystroke doesn't re-filter everything. */
  readonly searchText = signal('');
  readonly search = signal('');
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

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

  /** One pass over the data for all chip counts (not one pass per chip). */
  readonly filterCounts = computed(() => {
    const all = this.overview()?.shorts ?? [];
    const counts = {} as Record<StatusFilter, number>;
    for (const f of STATUS_FILTERS) counts[f.id] = 0;
    for (const r of all) for (const f of STATUS_FILTERS) if (this.matches(r, f.id)) counts[f.id]++;
    return counts;
  });

  readonly groups = computed(() => groupShorts(this.rows()));

  /** How many batches are drawn; "Show more" raises it. */
  readonly groupLimit = signal(GROUPS_PAGE);
  readonly visibleGroups = computed(() => this.groups().slice(0, this.groupLimit()));
  readonly hiddenGroups = computed(() => Math.max(0, this.groups().length - this.groupLimit()));
  readonly rowLimits = signal<Record<string, number>>({});

  /** Per-batch counts, computed once per data change and only for the batches on screen. */
  readonly stats = computed(() => {
    const map = new Map<string, { ready: number; rendering: number; failed: number; youtube: number; drive: number }>();
    for (const g of this.visibleGroups()) {
      const s = { ready: 0, rendering: 0, failed: 0, youtube: 0, drive: 0 };
      for (const r of g.rows) {
        if (isReady(r)) s.ready++;
        if (!isTerminal(r.job.status)) s.rendering++;
        if (r.job.status === 'Failed') s.failed++;
        if (isOnYouTube(r)) s.youtube++;
        if (isOnDrive(r)) s.drive++;
      }
      map.set(g.key, s);
    }
    return map;
  });

  readonly alertsOpen = signal(false);
  readonly poolsOpen = signal(false);
  readonly alerts = computed(() => {
    const list = this.overview()?.alerts ?? [];
    const project = this.projectId();
    return project ? list.filter((a) => !a.projectId || a.projectId === project) : list;
  });
  readonly shownAlerts = computed(() => this.alertsOpen() ? this.alerts() : this.alerts().slice(0, ALERTS_COLLAPSED));

  /** Projects that need attention (out of stock) come first; the rest can be expanded. */
  readonly sortedPools = computed(() => {
    const pools = [...(this.overview()?.pools ?? [])];
    const stock = (p: { unusedVideos: number; unusedImages: number }) => p.unusedVideos + p.unusedImages;
    return pools.sort((a, b) => stock(a) - stock(b) || a.projectName.localeCompare(b.projectName));
  });
  readonly shownPools = computed(() => this.poolsOpen() ? this.sortedPools() : this.sortedPools().slice(0, POOLS_COLLAPSED));
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
  readonly topicId = signal<string | null>(null);
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
    inject(DestroyRef).onDestroy(() => { this.stopTimer(); if (this.searchTimer !== null) clearTimeout(this.searchTimer); });

    // Reload whenever what is asked for changes.
    effect(() => {
      this.projectId();
      this.scope();
      untracked(() => this.load());
    });

    // A new filter starts from the top again.
    effect(() => {
      this.statusFilter(); this.projectFilter(); this.search();
      untracked(() => { this.groupLimit.set(GROUPS_PAGE); this.rowLimits.set({}); });
    });
  }

  onSearch(value: string): void {
    this.searchText.set(value);
    if (this.searchTimer !== null) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.search.set(value), SEARCH_DEBOUNCE_MS);
  }

  showMoreGroups(): void { this.groupLimit.update((n) => n + GROUPS_PAGE); }
  showAllGroups(): void { this.groupLimit.set(this.groups().length); }

  visibleRows(group: ShortsGroup): ShortRow[] {
    const n = this.rowLimits()[group.key] ?? ROWS_PAGE;
    return group.rows.length > n ? group.rows.slice(0, n) : group.rows;
  }

  hiddenRows(group: ShortsGroup): number {
    return Math.max(0, group.rows.length - (this.rowLimits()[group.key] ?? ROWS_PAGE));
  }

  showMoreRows(group: ShortsGroup, all = false): void {
    this.rowLimits.update((m) => ({ ...m, [group.key]: all ? group.rows.length : (m[group.key] ?? ROWS_PAGE) + ROWS_PAGE }));
  }

  /** Opens every shown batch, or folds them all away. */
  setAllOpen(open: boolean): void {
    this.toggled.set(new Set(this.visibleGroups().filter((g, i) => this.isOpen(g, i) !== open).map((g) => g.key)));
  }
  load(): void {
    this.stopTimer();
    this.shorts.overview(this.projectId(), this.scope()).pipe(
      // A stalled request shows the error and Try again rather than "Loading" for ever.
      timeout(30000),
      catchError((err: unknown) => {
        this.loadError.set(err instanceof ApiFailure ? err.message
          : err instanceof TimeoutError ? 'Loading your shorts is taking too long. Try again.'
          : 'Could not load your shorts.');
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
    return this.stats().get(group.key) ?? { ready: 0, rendering: 0, failed: 0, youtube: 0, drive: 0 };
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
      this.shorts.saveToDrive({ jobIds: ids, channelId: this.driveChannelId() || null, folderName: this.driveFolder(), topicId: this.topicId(), again: this.driveAgain() })
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

  readonly checkingDrive = signal(false);

  /**
   * Checks every "On Drive" copy against Drive itself and files older copies into
   * project / day / batch folders, so what the page says matches what Drive shows.
   */
  checkDrive(): void {
    if (this.checkingDrive()) return;
    this.checkingDrive.set(true);
    this.status.run(
      this.shorts.checkDrive(true).pipe(finalize(() => this.checkingDrive.set(false))),
      (res) => {
        const parts = [`Checked ${res.checked} Drive copies: ${res.present} there`];
        if (res.moved) parts.push(`${res.moved} filed into project folders`);
        if (res.missing) parts.push(`${res.missing} gone from Drive - shown under Not on Drive to save again`);
        if (res.failed) parts.push(`${res.failed} couldn't be checked${res.error ? ` (${res.error})` : ''}`);
        this.status.notify([parts.join(' · ')]);
        this.load();
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
      case 'Missing': return { label: 'Gone from Drive', tone: 'err', url: null, title: d.error || 'Deleted on Drive since' };
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
      case 'failed': return r.job.status === 'Failed' || r.drive?.state === 'Failed' || r.drive?.state === 'Missing' || r.youtube?.state === 'Failed';
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
    // A hidden tab doesn't poll; it refreshes once when it is looked at again.
    this.timer = setTimeout(() => {
      if (typeof document !== 'undefined' && document.hidden) { this.waitForVisible(); return; }
      this.load();
    }, this.busy() ? BUSY_POLL_MS : IDLE_POLL_MS);
  }

  private waitForVisible(): void {
    const onVisible = () => { if (!document.hidden) { document.removeEventListener('visibilitychange', onVisible); this.load(); } };
    document.addEventListener('visibilitychange', onVisible);
  }

  private stopTimer(): void {
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
  }
}
