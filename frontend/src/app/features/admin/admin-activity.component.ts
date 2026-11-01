import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';

import { ApiFailure } from '../../core/interceptors/api-error.interceptor';
import { ApiService } from '../../core/services/api.service';
import { csvCell } from '../youtube/csv';
import { AUDIT_CATEGORIES, AuditCategory, AuditRow, shortActor, toAuditRows } from './admin-audit-catalog';
import {
  copyText, dayKey, dayLabel, downloadText, fileStamp, longDate, relativeTime,
} from './admin-format';

type Range = 'all' | '24h' | '7d' | '30d';

const DAY = 86_400_000;
const RANGE_MS: Record<Exclude<Range, 'all'>, number> = { '24h': DAY, '7d': 7 * DAY, '30d': 30 * DAY };
const PAGE_SIZES = [50, 100, 200, 500] as const;
const PREFS_KEY = 'animstudio.admin.activity';

interface Prefs {
  limit: number;
  category: AuditCategory | 'all';
  range: Range;
  sensitive: boolean;
  auto: boolean;
}

function loadPrefs(): Prefs {
  const fallback: Prefs = { limit: 100, category: 'all', range: 'all', sensitive: false, auto: false };
  try {
    const raw = JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}') as Partial<Prefs>;
    return {
      limit: (PAGE_SIZES as readonly number[]).includes(raw.limit ?? 0) ? raw.limit! : fallback.limit,
      category: raw.category === 'all' || AUDIT_CATEGORIES.some((c) => c.id === raw.category)
        ? raw.category! : fallback.category,
      range: raw.range === '24h' || raw.range === '7d' || raw.range === '30d' ? raw.range : 'all',
      sensitive: raw.sensitive === true,
      auto: raw.auto === true,
    };
  } catch {
    return fallback;
  }
}

/**
 * Every administrative change, in the order it happened.
 *
 * Append-only: there is no edit and no delete, here or in the API, because a record its own
 * subject can tidy away answers no question worth asking. Nothing in it is a secret - a key
 * change records the fingerprint that identifies which key was installed, and never any part
 * of the key itself.
 *
 * Filtering, grouping by day and the CSV export all happen in the browser over the newest
 * page the server returned; none of it changes what is stored.
 */
@Component({
  selector: 'app-admin-activity',
  templateUrl: './admin-activity.component.html',
  styleUrls: ['./admin-ui.css', './admin-activity.component.css'],
})
export class AdminActivityComponent {
  private readonly api = inject(ApiService);
  private readonly prefs = loadPrefs();
  private requestSeq = 0;

  readonly categories = AUDIT_CATEGORIES;
  readonly pageSizes = PAGE_SIZES;
  readonly ranges: readonly { id: Range; label: string }[] = [
    { id: 'all', label: 'Any time' },
    { id: '24h', label: 'Last 24 hours' },
    { id: '7d', label: 'Last 7 days' },
    { id: '30d', label: 'Last 30 days' },
  ];

  readonly rows = signal<AuditRow[]>([]);
  readonly loading = signal(true);
  readonly failure = signal<string | null>(null);
  readonly now = signal(Date.now());

  readonly limit = signal(this.prefs.limit);
  readonly query = signal('');
  readonly category = signal<AuditCategory | 'all'>(this.prefs.category);
  readonly range = signal<Range>(this.prefs.range);
  readonly sensitiveOnly = signal(this.prefs.sensitive);
  readonly actor = signal('all');
  readonly auto = signal(this.prefs.auto);

  readonly open = signal<ReadonlySet<string>>(new Set());
  readonly copied = signal<string | null>(null);

  readonly hasFilters = computed(() =>
    !!this.query().trim() || this.category() !== 'all' || this.range() !== 'all'
    || this.sensitiveOnly() || this.actor() !== 'all');

  readonly filtered = computed(() => this.rows().filter((row) => this.passes(row, false)));

  /** What each category chip would show, with every other filter applied. */
  readonly categoryCounts = computed(() => {
    const byId = new Map<AuditCategory, number>();
    let all = 0;
    for (const row of this.rows()) {
      if (!this.passes(row, true)) continue;
      all++;
      byId.set(row.category.id, (byId.get(row.category.id) ?? 0) + 1);
    }
    return { all, byId };
  });

  readonly actors = computed(() => {
    const counts = new Map<string, number>();
    for (const row of this.rows()) {
      const id = row.entry.actorUserId ?? '';
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    return [...counts]
      .map(([id, count]) => ({ id, count, label: shortActor(id || null) }))
      .sort((a, b) => b.count - a.count);
  });

  readonly groups = computed(() => {
    const now = this.now();
    const groups: { key: string; label: string; rows: AuditRow[] }[] = [];
    for (const row of this.filtered()) {
      const key = dayKey(row.time);
      const last = groups[groups.length - 1];
      if (last && last.key === key) last.rows.push(row);
      else groups.push({ key, label: dayLabel(row.time, now), rows: [row] });
    }
    return groups;
  });

  readonly stats = computed(() => {
    const rows = this.rows();
    const now = this.now();
    return {
      total: rows.length,
      last24: rows.filter((r) => now - r.time <= DAY).length,
      sensitive: rows.filter((r) => r.kind.sensitive).length,
      people: new Set(rows.map((r) => r.entry.actorUserId ?? '')).size,
      newest: rows[0] ?? null,
    };
  });

  /** A full page back means there may be more behind it. */
  readonly canLoadMore = computed(() =>
    this.rows().length >= this.limit() && this.limit() < PAGE_SIZES[PAGE_SIZES.length - 1]);
  readonly atCeiling = computed(() =>
    this.rows().length >= this.limit() && this.limit() >= PAGE_SIZES[PAGE_SIZES.length - 1]);

  constructor() {
    this.reload();

    const timer = setInterval(() => {
      this.now.set(Date.now());
      if (this.auto() && !document.hidden && !this.loading()) this.reload(true);
    }, 30_000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));

    effect(() => {
      const prefs: Prefs = {
        limit: this.limit(), category: this.category(), range: this.range(),
        sensitive: this.sensitiveOnly(), auto: this.auto(),
      };
      try {
        localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
      } catch { /* storage unavailable - the filters just won't be remembered */ }
    });
  }

  /** `quiet` is the background refresh: it never replaces what is on screen with an error. */
  reload(quiet = false): void {
    const mine = ++this.requestSeq;
    this.loading.set(true);

    this.api.adminAudit(this.limit()).subscribe({
      next: (entries) => {
        if (mine !== this.requestSeq) return;
        const rows = toAuditRows(entries);
        this.rows.set(rows);
        this.failure.set(null);
        this.loading.set(false);
        this.now.set(Date.now());
        if (this.actor() !== 'all' && !rows.some((r) => (r.entry.actorUserId ?? '') === this.actor())) {
          this.actor.set('all');
        }
      },
      error: (failure: unknown) => {
        if (mine !== this.requestSeq) return;
        this.loading.set(false);
        if (quiet && this.rows().length > 0) return;
        this.failure.set(failure instanceof ApiFailure ? failure.message : 'The activity log could not be loaded.');
      },
    });
  }

  setLimit(limit: number): void {
    if (limit === this.limit()) return;
    this.limit.set(limit);
    this.reload();
  }

  loadMore(): void {
    const next = PAGE_SIZES.find((size) => size > this.limit());
    if (next) this.setLimit(next);
  }

  setAuto(on: boolean): void {
    this.auto.set(on);
    if (on) this.reload(true);
  }

  clearFilters(): void {
    this.query.set('');
    this.category.set('all');
    this.range.set('all');
    this.sensitiveOnly.set(false);
    this.actor.set('all');
  }

  isOpen(row: AuditRow): boolean {
    return this.open().has(row.key);
  }

  toggle(row: AuditRow): void {
    this.open.update((current) => {
      const next = new Set(current);
      if (!next.delete(row.key)) next.add(row.key);
      return next;
    });
  }

  expandAll(): void {
    this.open.set(new Set(this.filtered().map((r) => r.key)));
  }

  collapseAll(): void {
    this.open.set(new Set());
  }

  relative(time: number): string {
    return relativeTime(time, this.now());
  }

  whenLong(row: AuditRow): string {
    return longDate(row.time, row.entry.atUtc);
  }

  actorName(row: AuditRow): string {
    return shortActor(row.entry.actorUserId);
  }

  async copy(text: string | null, token: string): Promise<void> {
    if (!text || !(await copyText(text))) return;
    this.copied.set(token);
    setTimeout(() => this.copied.update((c) => (c === token ? null : c)), 1500);
  }

  /** Exports what the filters currently show, so "last 7 days of key changes" is one click. */
  exportCsv(): void {
    const rows = this.filtered();
    if (rows.length === 0) return;

    const header = ['When (UTC)', 'Action', 'Description', 'Category', 'Target', 'Before', 'After', 'Actor', 'Address'];
    const lines = rows.map((r) => [
      r.entry.atUtc, r.entry.action, r.kind.label, r.category.label, r.entry.target, r.entry.before,
      r.entry.after, r.entry.actorUserId, r.entry.remoteAddress,
    ].map(csvCell).join(','));

    downloadText(`animstudio-activity-${fileStamp()}.csv`, [header.join(','), ...lines].join('\r\n'));
  }

  private passes(row: AuditRow, ignoreCategory: boolean): boolean {
    const terms = this.query().trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (terms.length && !terms.every((term) => row.haystack.includes(term))) return false;

    if (!ignoreCategory && this.category() !== 'all' && row.category.id !== this.category()) return false;

    const range = this.range();
    if (range !== 'all' && !(this.now() - row.time <= RANGE_MS[range])) return false;

    if (this.sensitiveOnly() && !row.kind.sensitive) return false;

    const actor = this.actor();
    return actor === 'all' || (row.entry.actorUserId ?? '') === actor;
  }
}
