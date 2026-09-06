import { Component, computed, inject, signal } from '@angular/core';

import { AdminUsage, AdminUsageRow } from '../../core/models/api.models';
import { ApiService } from '../../core/services/api.service';
import { StatusService } from '../../core/services/status.service';

interface ProviderTotal {
  providerId: string;
  capability: string;
  requests: number;
  cacheHits: number;
  failures: number;
}

/**
 * What the AI providers have actually been asked to do.
 *
 * The number worth watching is the cache-hit rate: a forty-scene render reuses far more
 * than it generates, and that ratio is what decides whether a free tier survives a project
 * at all. Failures next to it answer the other question - whether a provider is quietly
 * refusing everything.
 */
@Component({
  selector: 'app-admin-usage',
  templateUrl: './admin-usage.component.html',
})
export class AdminUsageComponent {
  private readonly api = inject(ApiService);

  readonly status = inject(StatusService);
  readonly usage = signal<AdminUsage | null>(null);
  readonly days = signal(14);

  readonly totals = computed<ProviderTotal[]>(() => {
    const byProvider = new Map<string, ProviderTotal>();

    for (const row of this.usage()?.rows ?? []) {
      const existing = byProvider.get(row.providerId) ?? {
        providerId: row.providerId,
        capability: row.capability,
        requests: 0,
        cacheHits: 0,
        failures: 0,
      };

      existing.requests += row.requests;
      existing.cacheHits += row.cacheHits;
      existing.failures += row.failures;
      byProvider.set(row.providerId, existing);
    }

    return [...byProvider.values()].sort((a, b) => b.requests - a.requests);
  });

  readonly busiest = computed(() =>
    Math.max(1, ...this.totals().map((t) => t.requests + t.cacheHits)));

  readonly nothingYet = computed(() => (this.usage()?.rows.length ?? 0) === 0);

  constructor() {
    this.reload();
  }

  reload(): void {
    this.status.run(this.api.adminUsage(this.days()), (usage) => this.usage.set(usage));
  }

  setDays(days: number): void {
    this.days.set(days);
    this.reload();
  }

  /** Calls the cache answered, as a share of everything asked for. */
  hitRate(total: ProviderTotal): number {
    const asked = total.requests + total.cacheHits;
    return asked === 0 ? 0 : Math.round((total.cacheHits / asked) * 100);
  }

  width(total: ProviderTotal): string {
    return `${Math.round(((total.requests + total.cacheHits) / this.busiest()) * 100)}%`;
  }

  byDay(): AdminUsageRow[] {
    return [...(this.usage()?.rows ?? [])].sort((a, b) => b.day.localeCompare(a.day));
  }
}
