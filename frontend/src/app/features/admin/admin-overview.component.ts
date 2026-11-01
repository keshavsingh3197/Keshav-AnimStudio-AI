import { DecimalPipe } from '@angular/common';
import { Component, DestroyRef, WritableSignal, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';

import { ApiFailure } from '../../core/interceptors/api-error.interceptor';
import {
  AdminAuditEntry, AdminHealth, AdminJob, AdminProviders, AdminUsage, StorageDetail, formatBytes,
} from '../../core/models/api.models';
import { AdminSignupSummary } from '../../core/models/signup.models';
import { ApiService } from '../../core/services/api.service';
import { SignupService } from '../../core/services/signup.service';
import { AuditRow, toAuditRows } from './admin-audit-catalog';
import { parseUtc, relativeTime } from './admin-format';
import { CAPABILITIES, CapabilitySummary, Tone, capabilityLabel, summariseCapability } from './admin-provider-summary';
import { SETTINGS_GROUPS, SETTINGS_PAGES } from './settings-registry';

/** One card's data: each loads, fails and retries on its own so a slow probe never blanks the page. */
interface Tile<T> {
  state: 'loading' | 'ok' | 'error';
  data: T | null;
  error: string | null;
}

interface Concern {
  tone: 'warn' | 'err';
  text: string;
  link: string;
}

const loading = <T>(): Tile<T> => ({ state: 'loading', data: null, error: null });
/** A render that has been going this long has almost certainly lost its worker. */
const STALE_MS = 2 * 3_600_000;
const WARN_AT = 85;

/**
 * The landing page of the admin console: what needs a decision, what is broken and what is
 * simply fine, drawn from the same calls the individual pages make.
 *
 * Nothing here changes anything. Every card links to the page that does, so the overview
 * can be left open on a second screen without being a place a stray click does harm.
 */
@Component({
  selector: 'app-admin-overview',
  imports: [DecimalPipe, RouterLink],
  templateUrl: './admin-overview.component.html',
  styleUrls: ['./admin-ui.css', './admin-overview.component.css'],
})
export class AdminOverviewComponent {
  private readonly api = inject(ApiService);
  private readonly signupApi = inject(SignupService);

  readonly bytes = formatBytes;
  readonly now = signal(Date.now());
  readonly refreshedAt = signal<number | null>(null);

  readonly signups = signal<Tile<AdminSignupSummary>>(loading());
  readonly health = signal<Tile<AdminHealth>>(loading());
  readonly jobs = signal<Tile<AdminJob[]>>(loading());
  readonly providers = signal<Tile<AdminProviders>>(loading());
  readonly storage = signal<Tile<StorageDetail>>(loading());
  readonly usage = signal<Tile<AdminUsage>>(loading());
  readonly audit = signal<Tile<AdminAuditEntry[]>>(loading());

  readonly directory = SETTINGS_GROUPS
    .map((group) => ({ group, pages: SETTINGS_PAGES.filter((p) => p.group === group && p.id !== 'overview') }))
    .filter((g) => g.pages.length > 0);

  readonly anyLoading = computed(() =>
    [this.signups(), this.health(), this.jobs(), this.providers(), this.storage(), this.usage(), this.audit()]
      .some((t) => t.state === 'loading'));

  // --- derived figures -----------------------------------------------------------------

  readonly healthProblems = computed(() =>
    (this.health().data?.probes ?? [])
      .filter((p) => p.state === 'Degraded' || p.state === 'Failed' || (p.required && p.state !== 'Ok'))
      .sort((a, b) => Number(b.required) - Number(a.required)));

  readonly healthCounts = computed(() => {
    const probes = this.health().data?.probes ?? [];
    const required = probes.filter((p) => p.required);
    return { requiredOk: required.filter((p) => p.state === 'Ok').length, requiredTotal: required.length, total: probes.length };
  });

  readonly jobCounts = computed(() => {
    const jobs = this.jobs().data ?? [];
    const now = this.now();
    const active = jobs.filter((j) => !j.isTerminal);
    return {
      active: active.length,
      stuck: active.filter((j) => now - parseUtc(j.createdAt) > STALE_MS).length,
      failed: jobs.filter((j) => j.status === 'Failed').length,
      done: jobs.filter((j) => j.status === 'Completed' || j.status === 'CompletedWithWarnings').length,
      total: jobs.length,
    };
  });

  /** The jobs worth a glance: what is running, then what failed, newest first. */
  readonly jobHighlights = computed(() => {
    const jobs = this.jobs().data ?? [];
    return [...jobs.filter((j) => !j.isTerminal), ...jobs.filter((j) => j.status === 'Failed')].slice(0, 4);
  });

  readonly capabilities = computed<CapabilitySummary[]>(() => {
    const data = this.providers().data;
    return data ? CAPABILITIES.map((c) => summariseCapability(data, c)) : [];
  });

  readonly storagePct = computed(() => {
    const s = this.storage().data?.summary;
    return s?.capacityBytes ? (s.usedBytes / s.capacityBytes) * 100 : null;
  });

  readonly storageTone = computed<Tone>(() => {
    const pct = this.storagePct();
    return pct === null ? '' : pct >= 100 ? 'err' : pct >= WARN_AT ? 'warn' : 'ok';
  });

  readonly diskLow = computed(() => {
    const d = this.storage().data;
    if (!d || d.diskFreeBytes === null) return false;
    const pct = d.diskTotalBytes ? (d.diskFreeBytes / d.diskTotalBytes) * 100 : null;
    return d.diskFreeBytes < 5 * 1024 ** 3 || (pct !== null && pct < 10);
  });

  readonly todayUsage = computed(() => {
    const rows = this.usage().data?.rows ?? [];
    const requests = rows.reduce((s, r) => s + r.requests, 0);
    const cache = rows.reduce((s, r) => s + r.cacheHits, 0);
    const failures = rows.reduce((s, r) => s + r.failures, 0);
    const fresh = Math.max(0, requests - cache);
    return {
      requests, cache, failures, fresh,
      hitRate: requests === 0 ? 0 : Math.round((cache / requests) * 100),
      failRate: fresh === 0 ? 0 : Math.round((failures / fresh) * 100),
      providers: new Set(rows.map((r) => r.providerId)).size,
    };
  });

  readonly recent = computed<AuditRow[]>(() => toAuditRows(this.audit().data ?? []).slice(0, 8));

  /** Everything that needs a human, most urgent first. Empty when all is well. */
  readonly concerns = computed<Concern[]>(() => {
    const found: Concern[] = [];

    const pending = this.signups().data?.pending ?? 0;
    if (pending > 0) {
      found.push({ tone: 'warn', text: `${pending} access ${pending === 1 ? 'request is' : 'requests are'} waiting for a decision`, link: '/admin/signups' });
    }

    const health = this.health().data;
    if (health && !health.healthy) {
      found.push({ tone: 'err', text: 'Something a render depends on is missing', link: '/admin/health' });
    } else if (this.healthProblems().length > 0) {
      const n = this.healthProblems().length;
      found.push({ tone: 'warn', text: `${n} optional ${n === 1 ? 'tool is' : 'tools are'} installed but not working`, link: '/admin/health' });
    }

    const jobs = this.jobCounts();
    if (jobs.stuck > 0) {
      found.push({ tone: 'err', text: `${jobs.stuck} ${jobs.stuck === 1 ? 'render has' : 'renders have'} been active for over two hours`, link: '/admin/jobs' });
    }
    if (jobs.failed > 0) {
      found.push({ tone: 'warn', text: `${jobs.failed} recent ${jobs.failed === 1 ? 'render' : 'renders'} failed`, link: '/admin/jobs' });
    }

    for (const c of this.capabilities()) {
      if (c.tone === 'err') {
        found.push({ tone: 'err', text: `${capabilityLabel(c.capability)}: ${c.detail}`, link: '/admin/providers' });
      }
    }

    const pct = this.storagePct();
    if (pct !== null && pct >= WARN_AT) {
      found.push({ tone: pct >= 100 ? 'err' : 'warn', text: `Storage is ${Math.round(pct)}% full`, link: '/admin/storage' });
    }
    if (this.diskLow()) {
      found.push({ tone: 'err', text: 'The drive is nearly full', link: '/admin/storage' });
    }

    const usage = this.todayUsage();
    if (usage.fresh >= 5 && usage.failRate >= 25) {
      found.push({ tone: 'warn', text: `${usage.failRate}% of today's AI calls are failing`, link: '/admin/usage' });
    }

    return found.sort((a, b) => Number(b.tone === 'err') - Number(a.tone === 'err'));
  });

  readonly allLoaded = computed(() =>
    [this.signups(), this.health(), this.jobs(), this.providers(), this.storage(), this.usage(), this.audit()]
      .every((t) => t.state === 'ok'));

  constructor() {
    this.reloadAll();

    const timer = setInterval(() => this.now.set(Date.now()), 30_000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  reloadAll(): void {
    this.reloadSignups();
    this.reloadHealth();
    this.reloadJobs();
    this.reloadProviders();
    this.reloadStorage();
    this.reloadUsage();
    this.reloadAudit();
  }

  reloadSignups(): void { this.load(this.signups, this.signupApi.summary()); }
  reloadHealth(): void { this.load(this.health, this.api.adminHealth()); }
  reloadJobs(): void { this.load(this.jobs, this.api.adminJobs(40)); }
  reloadProviders(): void { this.load(this.providers, this.api.adminProviders()); }
  reloadStorage(): void { this.load(this.storage, this.api.adminStorage(false)); }
  reloadUsage(): void { this.load(this.usage, this.api.adminUsage(1)); }
  reloadAudit(): void { this.load(this.audit, this.api.adminAudit(8)); }

  ago(time: number): string {
    return relativeTime(time, this.now());
  }

  startedAgo(job: AdminJob): string {
    return relativeTime(parseUtc(job.createdAt), this.now());
  }

  refreshedLabel(): string {
    const at = this.refreshedAt();
    return at === null ? '' : relativeTime(at, this.now());
  }

  jobTone(job: AdminJob): Tone {
    switch (job.status) {
      case 'Failed': return 'err';
      case 'Completed': return 'ok';
      default: return 'warn';
    }
  }

  jobWord(job: AdminJob): string {
    switch (job.status) {
      case 'Pending': return 'Queued';
      case 'Processing': return 'Rendering';
      case 'CompletedWithWarnings': return 'Done, with warnings';
      default: return job.status;
    }
  }

  capabilityLabel(capability: string): string {
    return capabilityLabel(capability);
  }

  /** Keeps what was already on screen while a refresh is in flight or after it fails. */
  private load<T>(target: WritableSignal<Tile<T>>, source: Observable<T>): void {
    target.update((t) => ({ state: t.data ? 'ok' : 'loading', data: t.data, error: null }));

    source.subscribe({
      next: (data) => {
        target.set({ state: 'ok', data, error: null });
        this.now.set(Date.now());
        this.refreshedAt.set(Date.now());
      },
      error: (failure: unknown) => {
        target.update((t) => ({
          state: 'error', data: t.data,
          error: failure instanceof ApiFailure ? failure.message : 'This could not be loaded.',
        }));
      },
    });
  }
}
