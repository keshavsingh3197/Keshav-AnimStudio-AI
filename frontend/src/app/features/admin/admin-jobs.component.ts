import { DecimalPipe } from '@angular/common';
import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, concatMap, from, map, of, toArray } from 'rxjs';

import { ApiFailure } from '../../core/interceptors/api-error.interceptor';
import { AdminJob } from '../../core/models/api.models';
import { ApiService } from '../../core/services/api.service';
import { csvCell } from '../youtube/csv';
import {
  copyText, downloadText, fileStamp, formatDuration, longDate, parseUtc, relativeTime,
} from './admin-format';

type Group = 'active' | 'failed' | 'done' | 'cancelled';
type StateFilter = 'all' | Group;
type Sort = 'newest' | 'oldest' | 'longest' | 'project';
type Tone = 'ok' | 'warn' | 'err' | '';

interface JobRow {
  job: AdminJob;
  group: Group;
  created: number;
  completed: number;
  /** Lower-cased text the search box looks through. */
  haystack: string;
}

interface Pending {
  kind: 'cancel' | 'retry';
  ids: string[];
}

const SIZES = [40, 100, 200] as const;
const PREFS_KEY = 'animstudio.admin.jobs';
/** A render that has been going this long has almost certainly lost its worker. */
const STALE_MS = 2 * 3_600_000;
const POLL_MS = 5_000;
const IDLE_POLL_EVERY = 6;

interface Prefs { limit: number; state: StateFilter; sort: Sort; live: boolean; }

function loadPrefs(): Prefs {
  const fallback: Prefs = { limit: 40, state: 'all', sort: 'newest', live: true };
  try {
    const raw = JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}') as Partial<Prefs>;
    return {
      limit: (SIZES as readonly number[]).includes(raw.limit ?? 0) ? raw.limit! : fallback.limit,
      state: ['all', 'active', 'failed', 'done', 'cancelled'].includes(raw.state as string) ? raw.state! : 'all',
      sort: ['newest', 'oldest', 'longest', 'project'].includes(raw.sort as string) ? raw.sort! : 'newest',
      live: raw.live !== false,
    };
  } catch {
    return fallback;
  }
}

function groupOf(job: AdminJob): Group {
  switch (job.status) {
    case 'Failed': return 'failed';
    case 'Cancelled': return 'cancelled';
    case 'Completed':
    case 'CompletedWithWarnings': return 'done';
    default: return job.isTerminal ? 'done' : 'active';
  }
}

/**
 * Every render on this server, across every project.
 *
 * The render screen inside a project only ever shows that project's jobs, which is right
 * for the person making a video and useless for the person asking why the queue is stuck.
 * This is the other view: what is running, what failed, and a way to put a failed one back
 * in the queue without finding its project first.
 *
 * It refreshes itself while open so a long render can be watched, and cancelling or
 * re-queueing works on a selection, one confirmed step at a time.
 */
@Component({
  selector: 'app-admin-jobs',
  imports: [DecimalPipe, RouterLink],
  templateUrl: './admin-jobs.component.html',
  styleUrls: ['./admin-ui.css', './admin-jobs.component.css'],
})
export class AdminJobsComponent {
  private readonly api = inject(ApiService);
  private readonly prefs = loadPrefs();
  private requestSeq = 0;
  private tick = 0;

  readonly sizes = SIZES;
  readonly sorts: readonly { id: Sort; label: string }[] = [
    { id: 'newest', label: 'Newest first' },
    { id: 'oldest', label: 'Oldest first' },
    { id: 'longest', label: 'Longest running' },
    { id: 'project', label: 'Project name' },
  ];
  readonly states: readonly { id: StateFilter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'active', label: 'Active' },
    { id: 'failed', label: 'Failed' },
    { id: 'done', label: 'Completed' },
    { id: 'cancelled', label: 'Cancelled' },
  ];

  readonly rows = signal<JobRow[]>([]);
  /** False until the first answer, so an empty list is never shown while it is still loading. */
  readonly loaded = signal(false);
  readonly loading = signal(true);
  readonly failure = signal<string | null>(null);
  readonly now = signal(Date.now());

  readonly limit = signal(this.prefs.limit);
  readonly state = signal<StateFilter>(this.prefs.state);
  readonly sort = signal<Sort>(this.prefs.sort);
  readonly live = signal(this.prefs.live);
  readonly query = signal('');

  readonly selected = signal<ReadonlySet<string>>(new Set());
  readonly open = signal<ReadonlySet<string>>(new Set());
  readonly working = signal<ReadonlySet<string>>(new Set());
  readonly pending = signal<Pending | null>(null);
  readonly flash = signal<{ tone: 'ok' | 'err'; text: string } | null>(null);
  readonly copied = signal<string | null>(null);

  readonly hasFilters = computed(() => !!this.query().trim() || this.state() !== 'all');

  readonly visible = computed(() => {
    const rows = this.rows().filter((row) => this.passes(row, false));
    switch (this.sort()) {
      case 'oldest': return rows.sort((a, b) => a.created - b.created);
      case 'longest': return rows.sort((a, b) => this.durationOf(b) - this.durationOf(a));
      case 'project':
        return rows.sort((a, b) =>
          (a.job.projectName ?? '').localeCompare(b.job.projectName ?? '') || b.created - a.created);
      default: return rows.sort((a, b) => b.created - a.created);
    }
  });

  /** What each state chip would show, with the search applied. */
  readonly counts = computed(() => {
    const counts: Record<StateFilter, number> = { all: 0, active: 0, failed: 0, done: 0, cancelled: 0 };
    for (const row of this.rows()) {
      if (!this.passes(row, true)) continue;
      counts.all++;
      counts[row.group]++;
    }
    return counts;
  });

  readonly stats = computed(() => {
    const rows = this.rows();
    const active = rows.filter((r) => r.group === 'active');
    const done = rows.filter((r) => r.group === 'done');
    const failed = rows.filter((r) => r.group === 'failed').length;
    const took = done.map((r) => r.completed - r.created).filter((ms) => Number.isFinite(ms) && ms >= 0);
    const finished = done.length + failed;

    return {
      active: active.length,
      queued: active.filter((r) => r.job.status === 'Pending').length,
      rendering: active.filter((r) => r.job.status !== 'Pending').length,
      failed,
      done: done.length,
      warnings: done.filter((r) => r.job.status === 'CompletedWithWarnings').length,
      rate: finished === 0 ? null : Math.round((done.length / finished) * 100),
      average: took.length === 0 ? null : took.reduce((sum, ms) => sum + ms, 0) / took.length,
      stale: active.filter((r) => this.isStale(r)).length,
    };
  });

  readonly selectedRows = computed(() => this.rows().filter((r) => this.selected().has(r.job.id)));
  readonly cancelable = computed(() => this.selectedRows().filter((r) => r.group === 'active'));
  readonly retryable = computed(() =>
    this.selectedRows().filter((r) => r.group === 'failed' || r.group === 'cancelled'));
  readonly allVisibleSelected = computed(() => {
    const visible = this.visible();
    return visible.length > 0 && visible.every((r) => this.selected().has(r.job.id));
  });

  constructor() {
    this.reload();

    const timer = setInterval(() => {
      this.now.set(Date.now());
      this.tick++;
      const busy = this.stats().active > 0;
      if (this.live() && !document.hidden && !this.loading() && (busy || this.tick % IDLE_POLL_EVERY === 0)) {
        this.reload(true);
      }
    }, POLL_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));

    effect(() => {
      const prefs: Prefs = { limit: this.limit(), state: this.state(), sort: this.sort(), live: this.live() };
      try {
        localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
      } catch { /* storage unavailable - the view just won't be remembered */ }
    });
  }

  /** `quiet` is the background refresh: it never replaces what is on screen with an error. */
  reload(quiet = false): void {
    const mine = ++this.requestSeq;
    this.loading.set(true);

    this.api.adminJobs(this.limit()).subscribe({
      next: (jobs) => {
        if (mine !== this.requestSeq) return;
        const rows = jobs.map((job): JobRow => ({
          job,
          group: groupOf(job),
          created: parseUtc(job.createdAt),
          completed: parseUtc(job.completedAt),
          haystack: [job.projectName ?? 'a deleted project', job.id, job.projectId, job.status, job.stage,
            job.message, job.errorCode, job.errorMessage].filter(Boolean).join(' ').toLowerCase(),
        }));
        this.rows.set(rows);
        this.failure.set(null);
        this.loaded.set(true);
        this.loading.set(false);
        this.now.set(Date.now());

        const ids = new Set(rows.map((r) => r.job.id));
        this.selected.update((current) => new Set([...current].filter((id) => ids.has(id))));
      },
      error: (failure: unknown) => {
        if (mine !== this.requestSeq) return;
        this.loading.set(false);
        if (quiet && this.loaded()) return;
        this.failure.set(failure instanceof ApiFailure ? failure.message : 'The render queue could not be loaded.');
      },
    });
  }

  setLimit(limit: number): void {
    if (limit === this.limit()) return;
    this.limit.set(limit);
    this.reload();
  }

  setLive(on: boolean): void {
    this.live.set(on);
    if (on) this.reload(true);
  }

  clearFilters(): void {
    this.query.set('');
    this.state.set('all');
  }

  /** Only a render that ended badly is worth queueing again. */
  canRetry(row: JobRow): boolean {
    return row.group === 'failed' || row.group === 'cancelled';
  }

  tone(job: AdminJob): Tone {
    switch (job.status) {
      case 'Completed': return 'ok';
      case 'CompletedWithWarnings': return 'warn';
      case 'Failed': return 'err';
      case 'Cancelled': return '';
      default: return 'warn';
    }
  }

  label(job: AdminJob): string {
    switch (job.status) {
      case 'Pending': return 'Queued';
      case 'Processing': return 'Rendering';
      case 'CompletedWithWarnings': return 'Done, with warnings';
      default: return job.status;
    }
  }

  isStale(row: JobRow): boolean {
    return row.group === 'active' && this.now() - row.created > STALE_MS;
  }

  durationOf(row: JobRow): number {
    const end = row.group === 'active' ? this.now() : row.completed;
    const ms = end - row.created;
    return Number.isFinite(ms) && ms >= 0 ? ms : 0;
  }

  duration(row: JobRow): string {
    return formatDuration(this.durationOf(row));
  }

  /** A queued render is waiting, not running; only a started one has a run time. */
  durationWord(row: JobRow): string {
    if (row.group !== 'active') return 'took';
    return row.job.status === 'Pending' ? 'waiting' : 'running';
  }

  formatDuration(ms: number): string {
    return formatDuration(ms);
  }

  started(row: JobRow): string {
    return relativeTime(row.created, this.now());
  }

  whenLong(time: number, fallback = ''): string {
    return longDate(time, fallback);
  }

  // --- selection -----------------------------------------------------------------------

  isSelected(row: JobRow): boolean {
    return this.selected().has(row.job.id);
  }

  toggleSelected(row: JobRow): void {
    this.selected.update((current) => {
      const next = new Set(current);
      if (!next.delete(row.job.id)) next.add(row.job.id);
      return next;
    });
  }

  toggleAllVisible(): void {
    if (this.allVisibleSelected()) {
      const visible = new Set(this.visible().map((r) => r.job.id));
      this.selected.update((current) => new Set([...current].filter((id) => !visible.has(id))));
    } else {
      this.selected.update((current) => new Set([...current, ...this.visible().map((r) => r.job.id)]));
    }
  }

  selectFailed(): void {
    this.selected.set(new Set(this.visible().filter((r) => r.group === 'failed').map((r) => r.job.id)));
  }

  clearSelection(): void {
    this.selected.set(new Set());
    this.pending.set(null);
  }

  isOpen(row: JobRow): boolean {
    return this.open().has(row.job.id);
  }

  toggleOpen(row: JobRow): void {
    this.open.update((current) => {
      const next = new Set(current);
      if (!next.delete(row.job.id)) next.add(row.job.id);
      return next;
    });
  }

  isWorking(row: JobRow): boolean {
    return this.working().has(row.job.id);
  }

  // --- actions -------------------------------------------------------------------------

  askCancel(row: JobRow): void {
    this.flash.set(null);
    this.pending.set({ kind: 'cancel', ids: [row.job.id] });
  }

  askBulk(kind: 'cancel' | 'retry'): void {
    const ids = (kind === 'cancel' ? this.cancelable() : this.retryable()).map((r) => r.job.id);
    if (ids.length === 0) return;
    this.flash.set(null);
    this.pending.set({ kind, ids });
  }

  dismissPending(): void {
    this.pending.set(null);
  }

  isPendingFor(row: JobRow): boolean {
    const pending = this.pending();
    return !!pending && pending.ids.length === 1 && pending.ids[0] === row.job.id;
  }

  retry(row: JobRow): void {
    this.flash.set(null);
    this.execute('retry', [row.job.id]);
  }

  confirmPending(): void {
    const pending = this.pending();
    if (!pending) return;
    this.pending.set(null);
    this.execute(pending.kind, pending.ids);
  }

  /** One call per job, in order: the server has no batch endpoint and a failure on one must not stop the rest. */
  private execute(kind: 'cancel' | 'retry', ids: string[]): void {
    this.working.set(new Set(ids));

    const call = (id: string) => kind === 'cancel' ? this.api.cancelAdminJob(id) : this.api.retryAdminJob(id);

    from(ids).pipe(
      concatMap((id) => call(id).pipe(
        map(() => ({ id, error: null as string | null })),
        catchError((failure: unknown) =>
          of({ id, error: failure instanceof ApiFailure ? failure.message : 'It could not be done.' })),
      )),
      toArray(),
    ).subscribe((results) => {
      this.working.set(new Set());
      this.selected.set(new Set());

      const failed = results.filter((r) => r.error);
      const ok = results.length - failed.length;
      const verb = kind === 'cancel' ? 'Cancelled' : 'Queued again';
      const noun = ok === 1 ? 'render' : 'renders';

      if (failed.length === 0) {
        this.flash.set({ tone: 'ok', text: `${verb} ${ok} ${noun}.` });
      } else {
        this.flash.set({
          tone: 'err',
          text: `${ok > 0 ? `${verb} ${ok} ${noun}; ` : ''}${failed.length} could not be done: ${failed[0].error}`,
        });
      }

      this.reload(true);
    });
  }

  async copy(text: string | null, token: string): Promise<void> {
    if (!text || !(await copyText(text))) return;
    this.copied.set(token);
    setTimeout(() => this.copied.update((c) => (c === token ? null : c)), 1500);
  }

  exportCsv(): void {
    const rows = this.visible();
    if (rows.length === 0) return;

    const header = ['Job id', 'Project', 'Project id', 'Status', 'Stage', 'Progress %', 'Scenes done',
      'Scenes total', 'Attempts', 'Created (UTC)', 'Completed (UTC)', 'Seconds', 'Error code', 'Error'];
    const lines = rows.map((r) => [
      r.job.id, r.job.projectName ?? '(deleted project)', r.job.projectId, r.job.status, r.job.stage,
      Math.round(r.job.progress), r.job.scenesDone, r.job.scenesTotal, r.job.attempts, r.job.createdAt,
      r.job.completedAt, Math.round(this.durationOf(r) / 1000), r.job.errorCode, r.job.errorMessage,
    ].map(csvCell).join(','));

    downloadText(`animstudio-renders-${fileStamp()}.csv`, [header.join(','), ...lines].join('\r\n'));
  }

  private passes(row: JobRow, ignoreState: boolean): boolean {
    const terms = this.query().trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (terms.length && !terms.every((term) => row.haystack.includes(term))) return false;
    return ignoreState || this.state() === 'all' || row.group === this.state();
  }
}
