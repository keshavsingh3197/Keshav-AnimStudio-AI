import { Component, DestroyRef, computed, inject, signal } from '@angular/core';

import { ApiFailure } from '../../core/interceptors/api-error.interceptor';
import { AdminHealth, AdminHealthProbe } from '../../core/models/api.models';
import { ApiService } from '../../core/services/api.service';
import { copyText, downloadText, fileStamp, longDate, parseUtc, relativeTime } from './admin-format';

type Filter = 'all' | 'attention' | 'required' | 'optional' | 'working';
type Tone = 'ok' | 'warn' | 'err' | '';

/**
 * What is actually installed on the machine the server runs on.
 *
 * This is the screen that turns "the render failed" into "ffmpeg is not on this process's
 * PATH" without anyone reading a log. Most of the list is optional, and saying so is the
 * point: only the renderer, the media inspector, the database and file storage have to be
 * there for a bundle to become a video.
 *
 * Problems sort to the top of each group, and the whole report can be copied or saved so it
 * can be pasted into a support request as it is.
 */
@Component({
  selector: 'app-admin-health',
  templateUrl: './admin-health.component.html',
  styleUrls: ['./admin-ui.css', './admin-health.component.css'],
})
export class AdminHealthComponent {
  private readonly api = inject(ApiService);
  private requestSeq = 0;

  readonly filters: readonly { id: Filter; label: string }[] = [
    { id: 'all', label: 'All checks' },
    { id: 'attention', label: 'Needs attention' },
    { id: 'required', label: 'Needed' },
    { id: 'optional', label: 'Optional' },
    { id: 'working', label: 'Working' },
  ];

  readonly health = signal<AdminHealth | null>(null);
  readonly loading = signal(true);
  readonly failure = signal<string | null>(null);
  readonly now = signal(Date.now());
  readonly filter = signal<Filter>('all');
  readonly query = signal('');
  readonly copied = signal<string | null>(null);

  readonly probes = computed(() => this.health()?.probes ?? []);
  readonly checkedAt = computed(() => parseUtc(this.health()?.checkedAtUtc));

  readonly stats = computed(() => {
    const probes = this.probes();
    const required = probes.filter((p) => p.required);
    const optional = probes.filter((p) => !p.required);
    return {
      requiredOk: required.filter((p) => p.state === 'Ok').length,
      requiredTotal: required.length,
      optionalOk: optional.filter((p) => p.state === 'Ok').length,
      optionalTotal: optional.length,
      attention: probes.filter((p) => this.needsAttention(p)).length,
      broken: probes.filter((p) => p.state === 'Failed' || p.state === 'Degraded').length,
    };
  });

  readonly counts = computed(() => {
    const probes = this.probes().filter((p) => this.matchesQuery(p));
    return {
      all: probes.length,
      attention: probes.filter((p) => this.needsAttention(p)).length,
      required: probes.filter((p) => p.required).length,
      optional: probes.filter((p) => !p.required).length,
      working: probes.filter((p) => p.state === 'Ok').length,
    } satisfies Record<Filter, number>;
  });

  private readonly visible = computed(() =>
    this.probes()
      .filter((p) => this.matchesQuery(p) && this.matchesFilter(p))
      .sort((a, b) => this.rank(a) - this.rank(b) || a.displayName.localeCompare(b.displayName)));

  readonly required = computed(() => this.visible().filter((p) => p.required));
  readonly optional = computed(() => this.visible().filter((p) => !p.required));

  constructor() {
    this.reload();

    const timer = setInterval(() => this.now.set(Date.now()), 30_000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  reload(): void {
    const mine = ++this.requestSeq;
    this.loading.set(true);

    this.api.adminHealth().subscribe({
      next: (health) => {
        if (mine !== this.requestSeq) return;
        this.health.set(health);
        this.failure.set(null);
        this.loading.set(false);
        this.now.set(Date.now());
      },
      error: (failure: unknown) => {
        if (mine !== this.requestSeq) return;
        this.loading.set(false);
        this.failure.set(failure instanceof ApiFailure ? failure.message : 'The system check could not be run.');
      },
    });
  }

  clearFilters(): void {
    this.query.set('');
    this.filter.set('all');
  }

  tone(probe: AdminHealthProbe): Tone {
    switch (probe.state) {
      case 'Ok': return 'ok';
      case 'Degraded': return 'warn';
      case 'Failed': return 'err';
      default: return probe.required ? 'err' : '';
    }
  }

  word(probe: AdminHealthProbe): string {
    switch (probe.state) {
      case 'Ok': return 'working';
      case 'Degraded': return 'partly';
      case 'Failed': return 'broken';
      default: return probe.required ? 'missing' : 'not installed';
    }
  }

  glyph(probe: AdminHealthProbe): string {
    switch (probe.state) {
      case 'Ok': return '✓';
      case 'Degraded': return '!';
      case 'Failed': return '✕';
      default: return probe.required ? '✕' : '–';
    }
  }

  /** A needed check that is not working, or any check that is installed but broken. */
  needsAttention(probe: AdminHealthProbe): boolean {
    if (probe.state === 'Degraded' || probe.state === 'Failed') return true;
    return probe.required && probe.state !== 'Ok';
  }

  checked(): string {
    return relativeTime(this.checkedAt(), this.now());
  }

  checkedLong(): string {
    return longDate(this.checkedAt(), this.health()?.checkedAtUtc ?? '');
  }

  async copy(text: string | null, token: string): Promise<void> {
    if (!text || !(await copyText(text))) return;
    this.copied.set(token);
    setTimeout(() => this.copied.update((c) => (c === token ? null : c)), 1500);
  }

  report(): string {
    const health = this.health();
    if (!health) return '';

    const lines = [
      `AnimStudio system check - ${this.checkedLong()}`,
      `Overall: ${health.healthy ? 'everything required is working' : 'attention needed'}`,
      '',
    ];

    for (const probe of [...health.probes].sort((a, b) => this.rank(a) - this.rank(b))) {
      lines.push(`[${probe.required ? 'needed' : 'optional'}] ${probe.displayName}: ${this.word(probe)}`);
      if (probe.detail) lines.push(`    ${probe.detail}`);
      if (probe.advice) lines.push(`    fix: ${probe.advice}`);
    }

    return lines.join('\n');
  }

  copyReport(): Promise<void> {
    return this.copy(this.report(), 'report');
  }

  downloadReport(): void {
    const report = this.report();
    if (report) downloadText(`animstudio-system-check-${fileStamp()}.txt`, report, 'text/plain;charset=utf-8');
  }

  /** Problems first; installed-and-fine before not-installed, which is the least interesting. */
  private rank(probe: AdminHealthProbe): number {
    if (probe.state === 'Failed') return 0;
    if (probe.required && probe.state === 'Missing') return 1;
    if (probe.state === 'Degraded') return 2;
    if (probe.state === 'Ok') return 3;
    return 4;
  }

  private matchesQuery(probe: AdminHealthProbe): boolean {
    const terms = this.query().trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (terms.length === 0) return true;
    const text = `${probe.displayName} ${probe.key} ${probe.detail ?? ''} ${probe.advice ?? ''} ${this.word(probe)}`.toLowerCase();
    return terms.every((term) => text.includes(term));
  }

  private matchesFilter(probe: AdminHealthProbe): boolean {
    switch (this.filter()) {
      case 'attention': return this.needsAttention(probe);
      case 'required': return probe.required;
      case 'optional': return !probe.required;
      case 'working': return probe.state === 'Ok';
      default: return true;
    }
  }
}
