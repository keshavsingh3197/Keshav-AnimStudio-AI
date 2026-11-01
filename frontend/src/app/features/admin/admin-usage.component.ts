import { Component, computed, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ApiFailure } from '../../core/interceptors/api-error.interceptor';
import { AdminUsage, AdminUsageRow } from '../../core/models/api.models';
import { ApiService } from '../../core/services/api.service';
import { csvCell } from '../youtube/csv';
import { downloadText, fileStamp } from './admin-format';

type SortKey = 'name' | 'requests' | 'fresh' | 'cache' | 'failed' | 'rate';

interface ProviderTotal {
  key: string;
  providerId: string;
  capability: string;
  requests: number;
  cacheHits: number;
  failures: number;
  units: number;
  /** Requests that were not answered from the cache. */
  fresh: number;
  /** Share of requests the cache answered, 0 to 1. */
  hitRate: number;
  /** Share of fresh calls that failed, 0 to 1. */
  failRate: number;
  lastDay: string;
}

interface DayBar {
  day: string;
  label: string;
  requests: number;
  cacheHits: number;
  failures: number;
  /** Fresh calls that did not fail. */
  rest: number;
}

const DAY_OPTIONS = [7, 14, 30, 90] as const;
const PAGE = 25;
const PREFS_KEY = 'animstudio.admin.usage';
/** A provider needs this many fresh calls before a failure rate means anything. */
const MIN_CALLS_FOR_RATE = 5;
const FAIL_RATE_WARN = 0.25;

interface Prefs { days: number; capability: string; }

function loadPrefs(): Prefs {
  try {
    const raw = JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}') as Partial<Prefs>;
    return {
      days: (DAY_OPTIONS as readonly number[]).includes(raw.days ?? 0) ? raw.days! : 14,
      capability: typeof raw.capability === 'string' ? raw.capability : 'all',
    };
  } catch {
    return { days: 14, capability: 'all' };
  }
}

function addDays(day: string, n: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/**
 * What the AI providers have actually been asked to do.
 *
 * A request is any attempted call, so it includes the ones the cache answered and the ones
 * that failed - the server counts every attempt and breaks out the cache hits and failures
 * as subsets. The number worth watching is the cache-hit rate: a forty-scene render reuses
 * far more than it generates, and that ratio is what decides whether a free tier survives a
 * project at all. Failures next to it answer the other question - whether a provider is
 * quietly refusing everything.
 */
@Component({
  selector: 'app-admin-usage',
  imports: [RouterLink],
  templateUrl: './admin-usage.component.html',
  styleUrls: ['./admin-ui.css', './admin-usage.component.css'],
})
export class AdminUsageComponent {
  private readonly api = inject(ApiService);
  private readonly prefs = loadPrefs();
  private requestSeq = 0;

  readonly dayOptions = DAY_OPTIONS;

  readonly usage = signal<AdminUsage | null>(null);
  readonly loading = signal(true);
  readonly failure = signal<string | null>(null);

  readonly days = signal(this.prefs.days);
  readonly capability = signal(this.prefs.capability);
  readonly query = signal('');
  readonly focus = signal<string | null>(null);
  readonly sortKey = signal<SortKey>('requests');
  readonly sortDesc = signal(true);
  readonly shown = signal(PAGE);

  private readonly allRows = computed(() => this.usage()?.rows ?? []);
  readonly nothingYet = computed(() => this.allRows().length === 0);

  /** Capability chips: only the kinds that actually appear, with their request counts. */
  readonly capabilities = computed(() => {
    const counts = new Map<string, number>();
    for (const row of this.allRows()) counts.set(row.capability, (counts.get(row.capability) ?? 0) + row.requests);
    return [...counts].map(([id, requests]) => ({ id, requests })).sort((a, b) => b.requests - a.requests);
  });

  /** Rows after the capability and search filters - what the provider table summarises. */
  private readonly base = computed(() => {
    const capability = this.capability();
    const terms = this.query().trim().toLowerCase().split(/\s+/).filter(Boolean);
    return this.allRows().filter((row) =>
      (capability === 'all' || row.capability === capability)
      && terms.every((t) => `${row.providerId} ${row.capability}`.toLowerCase().includes(t)));
  });

  /** ...and further narrowed to the focused provider: what the KPIs, chart and day list show. */
  readonly scoped = computed(() => {
    const focus = this.focus();
    return focus ? this.base().filter((row) => this.keyOf(row) === focus) : this.base();
  });

  readonly totals = computed(() => this.summarise(this.base()));
  readonly sortedTotals = computed(() => {
    const dir = this.sortDesc() ? -1 : 1;
    const key = this.sortKey();
    const value = (t: ProviderTotal): number | string => {
      switch (key) {
        case 'name': return `${t.providerId} ${t.capability}`;
        case 'fresh': return t.fresh;
        case 'cache': return t.cacheHits;
        case 'failed': return t.failures;
        case 'rate': return t.failRate;
        default: return t.requests;
      }
    };
    return [...this.totals()].sort((a, b) => {
      const x = value(a);
      const y = value(b);
      return (typeof x === 'string' ? x.localeCompare(y as string) : x - (y as number)) * dir
        || b.requests - a.requests;
    });
  });

  readonly sums = computed(() => {
    const rows = this.scoped();
    const requests = rows.reduce((s, r) => s + r.requests, 0);
    const cacheHits = rows.reduce((s, r) => s + r.cacheHits, 0);
    const failures = rows.reduce((s, r) => s + r.failures, 0);
    const fresh = Math.max(0, requests - cacheHits);
    return {
      requests, cacheHits, failures, fresh,
      hitRate: requests === 0 ? 0 : cacheHits / requests,
      failRate: fresh === 0 ? 0 : Math.min(1, failures / fresh),
      providers: new Set(rows.map((r) => r.providerId)).size,
    };
  });

  /** One bar per calendar day in the window, including the quiet ones. */
  readonly series = computed<DayBar[]>(() => {
    const usage = this.usage();
    if (!usage) return [];

    const byDay = new Map<string, { requests: number; cacheHits: number; failures: number }>();
    for (const row of this.scoped()) {
      const d = byDay.get(row.day) ?? { requests: 0, cacheHits: 0, failures: 0 };
      d.requests += row.requests;
      d.cacheHits += row.cacheHits;
      d.failures += row.failures;
      byDay.set(row.day, d);
    }

    const seen = [...byDay.keys()].sort();
    const first = usage.fromDay || seen[0];
    const last = usage.toDay || seen[seen.length - 1];
    if (!first || !last) return [];

    const bars: DayBar[] = [];
    for (let day = first, guard = 0; day <= last && guard < 400; day = addDays(day, 1), guard++) {
      const d = byDay.get(day) ?? { requests: 0, cacheHits: 0, failures: 0 };
      bars.push({
        day,
        label: new Date(`${day}T00:00:00Z`).toLocaleDateString(undefined, {
          weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC',
        }),
        requests: d.requests,
        cacheHits: d.cacheHits,
        failures: d.failures,
        rest: Math.max(0, d.requests - d.cacheHits - d.failures),
      });
    }
    return bars;
  });

  readonly peak = computed(() => Math.max(1, ...this.series().map((b) => b.requests)));
  readonly busiest = computed(() => {
    const bars = this.series().filter((b) => b.requests > 0);
    return bars.length === 0 ? null : bars.reduce((a, b) => (b.requests > a.requests ? b : a));
  });
  readonly axis = computed(() => {
    const bars = this.series();
    if (bars.length === 0) return [];
    const middle = bars[Math.floor((bars.length - 1) / 2)];
    return [bars[0], middle, bars[bars.length - 1]].map((b) =>
      new Date(`${b.day}T00:00:00Z`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', timeZone: 'UTC' }));
  });

  /** Providers that are failing often enough to deserve a look. */
  readonly warnings = computed(() =>
    this.totals().filter((t) => t.fresh >= MIN_CALLS_FOR_RATE && t.failRate >= FAIL_RATE_WARN)
      .sort((a, b) => b.failRate - a.failRate));

  readonly dayRows = computed(() =>
    [...this.scoped()].sort((a, b) => b.day.localeCompare(a.day) || a.providerId.localeCompare(b.providerId)));
  readonly visibleDayRows = computed(() => this.dayRows().slice(0, this.shown()));

  readonly hasFilters = computed(() =>
    this.capability() !== 'all' || !!this.query().trim() || this.focus() !== null);

  constructor() {
    this.reload();

    effect(() => {
      try {
        localStorage.setItem(PREFS_KEY, JSON.stringify({ days: this.days(), capability: this.capability() }));
      } catch { /* storage unavailable - the view just won't be remembered */ }
    });
  }

  reload(): void {
    const mine = ++this.requestSeq;
    this.loading.set(true);

    this.api.adminUsage(this.days()).subscribe({
      next: (usage) => {
        if (mine !== this.requestSeq) return;
        this.usage.set(usage);
        this.failure.set(null);
        this.loading.set(false);
        this.shown.set(PAGE);
        if (this.capability() !== 'all' && !usage.rows.some((r) => r.capability === this.capability())) {
          this.capability.set('all');
        }
      },
      error: (failure: unknown) => {
        if (mine !== this.requestSeq) return;
        this.loading.set(false);
        this.failure.set(failure instanceof ApiFailure ? failure.message : 'Usage could not be loaded.');
      },
    });
  }

  setDays(days: number): void {
    if (days === this.days()) return;
    this.days.set(days);
    this.focus.set(null);
    this.reload();
  }

  setCapability(id: string): void {
    this.capability.set(id);
    this.focus.set(null);
    this.shown.set(PAGE);
  }

  clearFilters(): void {
    this.capability.set('all');
    this.query.set('');
    this.focus.set(null);
    this.shown.set(PAGE);
  }

  toggleFocus(total: ProviderTotal): void {
    this.focus.set(this.focus() === total.key ? null : total.key);
    this.shown.set(PAGE);
  }

  sortBy(key: SortKey): void {
    if (this.sortKey() === key) {
      this.sortDesc.update((d) => !d);
    } else {
      this.sortKey.set(key);
      this.sortDesc.set(key !== 'name');
    }
  }

  ariaSort(key: SortKey): 'ascending' | 'descending' | 'none' {
    return this.sortKey() !== key ? 'none' : this.sortDesc() ? 'descending' : 'ascending';
  }

  focusLabel(): string {
    const key = this.focus();
    const total = key ? this.totals().find((t) => t.key === key) : null;
    return total ? `${total.providerId} · ${total.capability}` : '';
  }

  percent(ratio: number): string {
    const pct = ratio * 100;
    return `${pct > 0 && pct < 1 ? '<1' : Math.round(pct)}%`;
  }

  barHeight(count: number): string {
    return `${(count / this.peak()) * 100}%`;
  }

  barTitle(bar: DayBar): string {
    const fresh = Math.max(0, bar.requests - bar.cacheHits);
    return `${bar.label}: ${bar.requests} requests · ${bar.cacheHits} from cache · ${fresh} fresh · ${bar.failures} failed`;
  }

  share(total: ProviderTotal): string {
    const all = this.totals().reduce((s, t) => s + t.requests, 0);
    return `${all === 0 ? 0 : Math.round((total.requests / all) * 100)}%`;
  }

  fresh(row: AdminUsageRow): number {
    return Math.max(0, row.requests - row.cacheHits);
  }

  exportCsv(): void {
    const rows = this.dayRows();
    if (rows.length === 0) return;

    const header = ['Day (UTC)', 'Provider', 'For', 'Requests', 'From cache', 'Fresh calls', 'Failed', 'Units'];
    const lines = rows.map((r) => [
      r.day, r.providerId, r.capability, r.requests, r.cacheHits, this.fresh(r), r.failures, r.units,
    ].map(csvCell).join(','));

    downloadText(`animstudio-ai-usage-${fileStamp()}.csv`, [header.join(','), ...lines].join('\r\n'));
  }

  private keyOf(row: AdminUsageRow): string {
    return `${row.providerId}|${row.capability}`;
  }

  private summarise(rows: readonly AdminUsageRow[]): ProviderTotal[] {
    const byKey = new Map<string, ProviderTotal>();

    for (const row of rows) {
      const key = this.keyOf(row);
      const t = byKey.get(key) ?? {
        key, providerId: row.providerId, capability: row.capability, requests: 0, cacheHits: 0, failures: 0,
        units: 0, fresh: 0, hitRate: 0, failRate: 0, lastDay: '',
      };
      t.requests += row.requests;
      t.cacheHits += row.cacheHits;
      t.failures += row.failures;
      t.units += row.units;
      if (row.requests > 0 && row.day > t.lastDay) t.lastDay = row.day;
      byKey.set(key, t);
    }

    for (const t of byKey.values()) {
      t.fresh = Math.max(0, t.requests - t.cacheHits);
      t.hitRate = t.requests === 0 ? 0 : t.cacheHits / t.requests;
      t.failRate = t.fresh === 0 ? 0 : Math.min(1, t.failures / t.fresh);
    }
    return [...byKey.values()];
  }
}
