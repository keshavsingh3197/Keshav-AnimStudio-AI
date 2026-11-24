import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { ApiFailure } from '../../core/interceptors/api-error.interceptor';
import {
  AdminApiKey,
  AdminApiKeys,
  AdminApiKeyTest,
  AdminApiKeyVendor,
} from '../../core/models/api.models';
import { ApiService } from '../../core/services/api.service';
import { StatusService } from '../../core/services/status.service';
import { parseUtc, relativeTime } from './admin-format';

interface KeyDraft {
  label: string;
  notes: string;
  allInVendor: boolean;
  providerIds: string[];
  enabled: boolean;
  key: string;
  clearCooldown: boolean;
}

/**
 * Grouped API Key Vault & Failover Pool Manager (`/admin/api-keys`).
 * Stores multiple encrypted project keys under vendor groups (starting with Google)
 * so quota exhaustion, rate limits, or revoked keys automatically fail over to healthy backups.
 */
@Component({
  selector: 'app-admin-api-keys',
  imports: [FormsModule, RouterLink],
  templateUrl: './admin-api-keys.component.html',
  styleUrls: ['./admin-ui.css', './admin-api-keys.component.css'],
})
export class AdminApiKeysComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly status = inject(StatusService);

  readonly data = signal<AdminApiKeys | null>(null);
  readonly loading = signal(true);
  readonly failure = signal<string | null>(null);
  readonly busy = signal<string | null>(null);

  readonly collapsed = signal<Record<string, boolean>>({});
  readonly addingVendor = signal<string | null>(null);
  readonly addDraft = signal<KeyDraft | null>(null);

  readonly editingKeyId = signal<string | null>(null);
  readonly editDraft = signal<KeyDraft | null>(null);

  readonly confirmDeleteId = signal<string | null>(null);
  readonly testResults = signal<Record<string, AdminApiKeyTest & { testedAt: number }>>({});
  readonly highlightedProvider = signal<string | null>(null);

  readonly vendors = computed(() => this.data()?.vendors ?? []);
  readonly googleVendor = computed(() =>
    this.vendors().find((v) => v.vendor === 'google') ?? null,
  );
  readonly googleStats = computed(() => {
    const keys = this.googleVendor()?.keys ?? [];
    const active = keys.filter((k) => k.enabled).length;
    const ready = keys.filter((k) => k.enabled && k.status === 'Ready').length;
    return { total: keys.length, active, ready };
  });
  readonly totalKeys = computed(() =>
    this.vendors().reduce((sum, v) => sum + v.keys.length, 0),
  );
  readonly readyKeys = computed(() =>
    this.vendors().reduce(
      (sum, v) => sum + v.keys.filter((k) => k.enabled && k.status === 'Ready').length,
      0,
    ),
  );
  readonly cooldownKeys = computed(() =>
    this.vendors().reduce(
      (sum, v) =>
        sum +
        v.keys.filter(
          (k) =>
            k.enabled &&
            (k.status === 'QuotaExhausted' || k.status === 'Cooldown' || k.status === 'Rejected'),
        ).length,
      0,
    ),
  );

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const pid = params.get('provider');
      this.highlightedProvider.set(pid);
    });
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.failure.set(null);

    this.api.adminApiKeys().subscribe({
      next: (snapshot) => {
        this.applySnapshot(snapshot);
        this.loading.set(false);
      },
      error: (err) => {
        this.failure.set(this.errorText(err, 'Could not load API keys.'));
        this.loading.set(false);
      },
    });
  }

  isVendorCollapsed(vendor: AdminApiKeyVendor): boolean {
    const state = this.collapsed()[vendor.vendor];
    if (state !== undefined) return state;
    const focused = this.highlightedProvider();
    if (focused && vendor.providers.some((p) => p.id === focused)) return false;
    return !vendor.expandedByDefault;
  }

  toggleVendor(vendor: AdminApiKeyVendor): void {
    const currentlyCollapsed = this.isVendorCollapsed(vendor);
    this.collapsed.update((curr) => ({ ...curr, [vendor.vendor]: !currentlyCollapsed }));
  }

  startAdd(vendor: AdminApiKeyVendor): void {
    this.editingKeyId.set(null);
    this.editDraft.set(null);
    this.confirmDeleteId.set(null);
    this.collapsed.update((curr) => ({ ...curr, [vendor.vendor]: false }));

    const focused = this.highlightedProvider();
    const useFocused = focused && vendor.providers.some((p) => p.id === focused);

    this.addingVendor.set(vendor.vendor);
    this.addDraft.set({
      label: '',
      notes: '',
      allInVendor: !useFocused,
      providerIds: useFocused ? [focused] : vendor.providers.map((p) => p.id),
      enabled: true,
      key: '',
      clearCooldown: false,
    });
  }

  cancelAdd(): void {
    this.addingVendor.set(null);
    this.addDraft.set(null);
  }

  submitAdd(vendor: AdminApiKeyVendor): void {
    const draft = this.addDraft();
    if (!draft) return;

    const secret = draft.key.trim();
    if (!secret) {
      this.status.notify(['Paste the API key before saving.']);
      return;
    }

    const label = draft.label.trim() || `${vendor.displayName} Key #${vendor.keys.length + 1}`;
    const providerIds = draft.allInVendor ? [] : [...draft.providerIds];
    if (!draft.allInVendor && providerIds.length === 0) {
      this.status.notify(['Select at least one provider or choose "All services in group".']);
      return;
    }

    this.busy.set(`add:${vendor.vendor}`);
    this.api
      .createAdminApiKey({
        vendor: vendor.vendor,
        label,
        notes: draft.notes.trim() || null,
        providerIds,
        key: secret,
        enabled: draft.enabled,
      })
      .subscribe({
        next: (snapshot) => {
          this.applySnapshot(snapshot);
          this.addingVendor.set(null);
          this.addDraft.set(null);
          this.busy.set(null);
          this.status.notify([`Added API key "${label}" under ${vendor.displayName}.`]);
        },
        error: (err) => {
          this.busy.set(null);
          this.status.notify([this.errorText(err, 'Could not add API key.')]);
        },
      });
  }

  startEdit(vendor: AdminApiKeyVendor, key: AdminApiKey): void {
    this.addingVendor.set(null);
    this.addDraft.set(null);
    this.confirmDeleteId.set(null);

    const allInVendor = key.providerIds.length === 0;
    this.editingKeyId.set(key.id);
    this.editDraft.set({
      label: key.label,
      notes: key.notes ?? '',
      allInVendor,
      providerIds: allInVendor ? vendor.providers.map((p) => p.id) : [...key.providerIds],
      enabled: key.enabled,
      key: '',
      clearCooldown: false,
    });
  }

  cancelEdit(): void {
    this.editingKeyId.set(null);
    this.editDraft.set(null);
  }

  saveEdit(vendor: AdminApiKeyVendor, key: AdminApiKey): void {
    const draft = this.editDraft();
    if (!draft) return;

    const label = draft.label.trim() || key.label;
    const providerIds = draft.allInVendor ? [] : [...draft.providerIds];
    if (!draft.allInVendor && providerIds.length === 0) {
      this.status.notify(['Select at least one provider or choose "All services in group".']);
      return;
    }

    this.busy.set(key.id);
    this.api
      .updateAdminApiKey(key.id, {
        label,
        notes: draft.notes.trim() || null,
        providerIds,
        enabled: draft.enabled,
        key: draft.key.trim() || null,
        clearCooldown: draft.clearCooldown,
      })
      .subscribe({
        next: (snapshot) => {
          this.applySnapshot(snapshot);
          this.editingKeyId.set(null);
          this.editDraft.set(null);
          this.busy.set(null);
          this.status.notify([`Saved "${label}".`]);
        },
        error: (err) => {
          this.busy.set(null);
          this.status.notify([this.errorText(err, 'Could not save API key changes.')]);
        },
      });
  }

  toggleEnabled(key: AdminApiKey): void {
    if (key.source !== 'Database') return;
    this.busy.set(key.id);
    this.api
      .updateAdminApiKey(key.id, {
        label: key.label,
        notes: key.notes,
        providerIds: key.providerIds,
        enabled: !key.enabled,
        clearCooldown: !key.enabled,
      })
      .subscribe({
        next: (snapshot) => {
          this.applySnapshot(snapshot);
          this.busy.set(null);
          this.status.notify([
            key.enabled ? `Paused "${key.label}".` : `Enabled "${key.label}".`,
          ]);
        },
        error: (err) => {
          this.busy.set(null);
          this.status.notify([this.errorText(err, 'Could not update key state.')]);
        },
      });
  }

  moveKey(vendor: AdminApiKeyVendor, key: AdminApiKey, delta: -1 | 1): void {
    const dbKeys = vendor.keys.filter((k) => k.source === 'Database');
    const idx = dbKeys.findIndex((k) => k.id === key.id);
    const target = idx + delta;
    if (idx < 0 || target < 0 || target >= dbKeys.length) return;

    const ordered = dbKeys.map((k) => k.id);
    const [moved] = ordered.splice(idx, 1);
    ordered.splice(target, 0, moved);

    this.busy.set(key.id);
    this.api.reorderAdminApiKeys(vendor.vendor, ordered).subscribe({
      next: (snapshot) => {
        this.applySnapshot(snapshot);
        this.busy.set(null);
        this.status.notify([`Updated failover order under ${vendor.displayName}.`]);
      },
      error: (err) => {
        this.busy.set(null);
        this.status.notify([this.errorText(err, 'Could not reorder keys.')]);
      },
    });
  }

  testKey(key: AdminApiKey): void {
    if (key.source !== 'Database') return;
    this.busy.set(key.id);
    this.api.testAdminApiKey(key.id).subscribe({
      next: (res) => {
        this.applySnapshot(res.snapshot);
        this.testResults.update((curr) => ({
          ...curr,
          [key.id]: { ...res, testedAt: Date.now() },
        }));
        this.busy.set(null);
      },
      error: (err) => {
        this.busy.set(null);
        this.status.notify([this.errorText(err, `Could not test "${key.label}".`)]);
      },
    });
  }

  resetStatus(key: AdminApiKey): void {
    if (key.source !== 'Database') return;
    this.busy.set(key.id);
    this.api.resetAdminApiKeyStatus(key.id).subscribe({
      next: (snapshot) => {
        this.applySnapshot(snapshot);
        this.busy.set(null);
        this.status.notify([`Cleared cooldown for "${key.label}".`]);
      },
      error: (err) => {
        this.busy.set(null);
        this.status.notify([this.errorText(err, 'Could not reset key status.')]);
      },
    });
  }

  deleteKey(key: AdminApiKey): void {
    if (key.source !== 'Database') return;
    this.busy.set(key.id);
    this.api.deleteAdminApiKey(key.id).subscribe({
      next: (snapshot) => {
        this.applySnapshot(snapshot);
        this.confirmDeleteId.set(null);
        this.busy.set(null);
        this.status.notify([`Deleted "${key.label}".`]);
      },
      error: (err) => {
        this.busy.set(null);
        this.status.notify([this.errorText(err, 'Could not delete API key.')]);
      },
    });
  }

  toggleScopeProvider(draft: KeyDraft, providerId: string, allVendorProviders: string[]): void {
    if (draft.allInVendor) {
      draft.allInVendor = false;
      draft.providerIds = [providerId];
      return;
    }

    const idx = draft.providerIds.indexOf(providerId);
    if (idx >= 0) {
      draft.providerIds = draft.providerIds.filter((id) => id !== providerId);
    } else {
      draft.providerIds = [...draft.providerIds, providerId];
    }

    if (
      allVendorProviders.length > 0 &&
      draft.providerIds.length === allVendorProviders.length
    ) {
      draft.allInVendor = true;
    }
  }

  onAllInVendorToggle(draft: KeyDraft, checked: boolean, allVendorProviders: string[]): void {
    draft.allInVendor = checked;
    draft.providerIds = checked ? [...allVendorProviders] : [];
  }

  providerIdsOf(vendor: AdminApiKeyVendor): string[] {
    return vendor.providers.map((p) => p.id);
  }

  canMoveUp(vendor: AdminApiKeyVendor, key: AdminApiKey): boolean {
    if (key.source !== 'Database') return false;
    const dbKeys = vendor.keys.filter((k) => k.source === 'Database');
    return dbKeys.findIndex((k) => k.id === key.id) > 0;
  }

  canMoveDown(vendor: AdminApiKeyVendor, key: AdminApiKey): boolean {
    if (key.source !== 'Database') return false;
    const dbKeys = vendor.keys.filter((k) => k.source === 'Database');
    const idx = dbKeys.findIndex((k) => k.id === key.id);
    return idx >= 0 && idx < dbKeys.length - 1;
  }

  statusLabel(key: AdminApiKey): string {
    switch (key.status) {
      case 'Ready':
        return 'Active';
      case 'QuotaExhausted':
        return 'Quota cooldown';
      case 'Cooldown':
        return 'Rate cooldown';
      case 'Rejected':
        return 'Rejected';
      case 'Disabled':
        return 'Paused';
    }
  }

  statusClass(key: AdminApiKey): string {
    switch (key.status) {
      case 'Ready':
        return 'ok';
      case 'QuotaExhausted':
      case 'Cooldown':
        return 'warn';
      case 'Rejected':
        return 'err';
      default:
        return '';
    }
  }

  formatLocalTime(iso: string | null): string {
    const ms = parseUtc(iso);
    if (Number.isNaN(ms)) return '';
    return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  ago(iso: string | null): string {
    const ms = parseUtc(iso);
    return Number.isNaN(ms) ? 'never' : relativeTime(ms, Date.now());
  }

  scopeText(vendor: AdminApiKeyVendor, key: AdminApiKey): string {
    if (key.providerIds.length === 0) return `All ${vendor.providers.length} services`;
    return key.providerIds.join(', ');
  }

  readyCountForVendor(vendor: AdminApiKeyVendor): number {
    return vendor.keys.filter((k) => k.enabled && k.status === 'Ready').length;
  }

  private applySnapshot(snapshot: AdminApiKeys): void {
    this.data.set(snapshot);
  }

  private errorText(err: unknown, fallback: string): string {
    if (err instanceof ApiFailure) return err.message;
    return fallback;
  }
}
