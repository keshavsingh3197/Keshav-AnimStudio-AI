import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { catchError, concatMap, from, map, of, toArray } from 'rxjs';

import { ApiFailure } from '../../core/interceptors/api-error.interceptor';
import {
  AdminChain, AdminProvider, AdminProviderBody, AdminProviders,
} from '../../core/models/api.models';
import { ApiService } from '../../core/services/api.service';
import { StatusService } from '../../core/services/status.service';
import { parseUtc, relativeTime } from './admin-format';
import { CAPABILITIES, CapabilitySummary, Tone, capabilityLabel, summariseCapability } from './admin-provider-summary';

/** The editable copy of one provider, held while a card is open. */
interface Draft {
  enabled: boolean;
  model: string;
  baseUrl: string;
  dailyRequestLimit: number | null;
  monthlyRequestLimit: number | null;
  timeoutSeconds: number | null;
  key: string;
}

type Field = 'model' | 'baseUrl' | 'daily' | 'monthly' | 'timeout';
type Filter = 'all' | 'attention' | 'ready' | 'off' | 'local' | 'cloud';

interface TestResult {
  ok: boolean;
  text: string;
  at: number;
  ms: number;
}

interface Confirm {
  kind: 'removeKey' | 'reset';
  id: string;
}

const FILTERS: readonly { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'attention', label: 'Needs attention' },
  { id: 'ready', label: 'Ready' },
  { id: 'off', label: 'Switched off' },
  { id: 'local', label: 'On this machine' },
  { id: 'cloud', label: 'Cloud' },
];
const PREFS_KEY = 'animstudio.admin.providers';
const MODEL_PATTERN = /^[A-Za-z0-9._\-/:@+]+$/;
const OLD_KEY_DAYS = 180;

/**
 * Full control over the AI layer: which providers exist, whether each is on, what model and
 * address it uses, what it is allowed to spend, in what order they are tried, and whether
 * each one actually answers.
 *
 * Two things this screen will not do. It never shows a key - one can be installed, rotated
 * or removed, and what comes back is a mask. And it never edits an executable path or a
 * model folder for a provider that runs as a program here: those are shown, and changing
 * them needs access to the machine, because a web request that could set the program to run
 * is a web request that could run any program.
 *
 * The checks on the form are early feedback only; the server validates every field again.
 */
@Component({
  selector: 'app-admin-providers',
  imports: [FormsModule, RouterLink],
  templateUrl: './admin-providers.component.html',
  styleUrls: ['./admin-ui.css', './admin-providers.component.css'],
})
export class AdminProvidersComponent {
  private readonly api = inject(ApiService);
  private readonly status = inject(StatusService);

  readonly capabilities = CAPABILITIES;
  readonly filters = FILTERS;

  readonly data = signal<AdminProviders | null>(null);
  readonly loading = signal(true);
  readonly failure = signal<string | null>(null);
  readonly now = signal(Date.now());

  /** The provider whose card is expanded. One at a time keeps the page scannable. */
  readonly open = signal<string | null>(null);
  readonly draft = signal<Draft | null>(null);

  readonly query = signal('');
  readonly filter = signal<Filter>('all');
  readonly collapsed = signal<ReadonlySet<string>>(this.loadCollapsed());
  readonly hostsOpen = signal(false);

  /** Ids with a call in flight: a provider id, or `chain:<capability>`. */
  readonly working = signal<ReadonlySet<string>>(new Set());
  /** An error shown next to what caused it, keyed the same way. */
  readonly errors = signal<Record<string, string>>({});
  readonly notes = signal<Record<string, string>>({});
  readonly confirm = signal<Confirm | null>(null);

  readonly tests = signal<Record<string, TestResult>>({});
  readonly testingAll = signal(false);

  readonly providers = computed(() => this.data()?.providers ?? []);
  readonly anyReady = computed(() => this.providers().some((p) => p.ready));
  readonly enabledCount = computed(() => this.providers().filter((p) => p.enabled).length);
  readonly readyCount = computed(() => this.providers().filter((p) => p.enabled && p.ready).length);
  readonly attention = computed(() => this.providers().filter((p) => this.needsAttention(p)));

  readonly counts = computed(() => {
    const matching = this.providers().filter((p) => this.matchesQuery(p));
    return {
      all: matching.length,
      attention: matching.filter((p) => this.needsAttention(p)).length,
      ready: matching.filter((p) => p.ready).length,
      off: matching.filter((p) => !p.enabled).length,
      local: matching.filter((p) => p.runsLocally).length,
      cloud: matching.filter((p) => !p.runsLocally).length,
    } satisfies Record<Filter, number>;
  });

  /** For each kind of work: can the studio do it right now, and through whom? */
  readonly summaries = computed<CapabilitySummary[]>(() => {
    const data = this.data();
    return data ? CAPABILITIES.map((capability) => summariseCapability(data, capability)) : [];
  });

  readonly hasFilters = computed(() => !!this.query().trim() || this.filter() !== 'all');

  constructor() {
    this.reload();

    effect(() => {
      try {
        localStorage.setItem(PREFS_KEY, JSON.stringify({ collapsed: [...this.collapsed()] }));
      } catch { /* storage unavailable - the layout just won't be remembered */ }
    });
  }

  reload(): void {
    this.loading.set(true);

    this.api.adminProviders().subscribe({
      next: (data) => {
        this.data.set(data);
        this.failure.set(null);
        this.loading.set(false);
        this.now.set(Date.now());
      },
      error: (failure: unknown) => {
        this.loading.set(false);
        this.failure.set(this.messageOf(failure, 'The providers could not be loaded.'));
      },
    });
  }

  // --- grouping and filtering ----------------------------------------------------------

  /** Providers for one capability, in the order they are tried first and the rest after. */
  forCapability(capability: string): AdminProvider[] {
    return this.providers()
      .filter((p) => p.capability === capability && this.matchesQuery(p) && this.matchesFilter(p))
      .sort((a, b) => (a.chainPosition ?? 99) - (b.chainPosition ?? 99) || a.displayName.localeCompare(b.displayName));
  }

  totalFor(capability: string): number {
    return this.providers().filter((p) => p.capability === capability).length;
  }

  chain(capability: string): AdminChain | undefined {
    return this.data()?.chains.find((c) => c.capability === capability);
  }

  /** Providers that could be added to a chain but are not in it yet. */
  spare(capability: string): string[] {
    const chain = this.chain(capability);
    return chain ? chain.candidates.filter((id) => !chain.providerIds.includes(id)) : [];
  }

  providerById(id: string): AdminProvider | undefined {
    return this.providers().find((p) => p.id === id);
  }

  clearFilters(): void {
    this.query.set('');
    this.filter.set('all');
  }

  isCollapsed(capability: string): boolean {
    return this.collapsed().has(capability);
  }

  toggleSection(capability: string): void {
    this.collapsed.update((set) => {
      const next = new Set(set);
      if (!next.delete(capability)) next.add(capability);
      return next;
    });
  }

  jumpTo(capability: string): void {
    this.collapsed.update((set) => {
      const next = new Set(set);
      next.delete(capability);
      return next;
    });
    setTimeout(() => document.getElementById(`cap-${capability}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  // --- one card ------------------------------------------------------------------------

  toggleOpen(provider: AdminProvider): void {
    if (this.open() === provider.id) {
      this.closeCard();
      return;
    }

    this.confirm.set(null);
    this.open.set(provider.id);
    this.draft.set({
      enabled: provider.enabled,
      model: provider.model ?? '',
      baseUrl: provider.baseUrl ?? '',
      dailyRequestLimit: provider.dailyRequestLimit,
      monthlyRequestLimit: provider.monthlyRequestLimit,
      timeoutSeconds: provider.timeoutSeconds,
      key: '',
    });
  }

  closeCard(): void {
    this.open.set(null);
    this.draft.set(null);
    this.confirm.set(null);
  }

  /** What differs between the form and what is saved - the Save button's whole condition. */
  dirty(provider: AdminProvider, draft: Draft): boolean {
    return draft.model.trim() !== (provider.model ?? '')
      || draft.baseUrl.trim() !== (provider.baseUrl ?? '')
      || (draft.dailyRequestLimit ?? null) !== provider.dailyRequestLimit
      || (draft.monthlyRequestLimit ?? null) !== provider.monthlyRequestLimit
      || (draft.timeoutSeconds ?? null) !== provider.timeoutSeconds;
  }

  problems(provider: AdminProvider, draft: Draft): Partial<Record<Field, string>> {
    const found: Partial<Record<Field, string>> = {};
    const model = draft.model.trim();
    const url = draft.baseUrl.trim();

    if (model && (model.length > 200 || !MODEL_PATTERN.test(model))) {
      found.model = 'Use letters, digits and . - _ / : @ + only.';
    }

    if (url && !provider.needsExecutable) {
      try {
        const parsed = new URL(url);
        if (!['http:', 'https:'].includes(parsed.protocol)) found.baseUrl = 'Use an http or https address.';
        else if (!provider.runsLocally && parsed.protocol !== 'https:') found.baseUrl = 'A cloud address must be https.';
      } catch {
        found.baseUrl = 'That is not a valid address.';
      }
    }

    const daily = draft.dailyRequestLimit;
    const monthly = draft.monthlyRequestLimit;
    if (daily !== null && daily !== undefined && (!Number.isInteger(daily) || daily < 1)) found.daily = 'Use a whole number from 1 up, or leave it empty.';
    if (monthly !== null && monthly !== undefined && (!Number.isInteger(monthly) || monthly < 1)) found.monthly = 'Use a whole number from 1 up, or leave it empty.';
    if (!found.daily && !found.monthly && daily && monthly && monthly < daily) found.monthly = 'The monthly limit is lower than the daily one.';

    const timeout = draft.timeoutSeconds;
    if (timeout !== null && timeout !== undefined && (!Number.isInteger(timeout) || timeout < 5 || timeout > 1800)) {
      found.timeout = 'Between 5 and 1800 seconds.';
    }
    return found;
  }

  hasProblems(provider: AdminProvider, draft: Draft): boolean {
    return Object.keys(this.problems(provider, draft)).length > 0;
  }

  /**
   * The switch saves on its own rather than waiting for the form, because turning a
   * provider off is the one action someone reaches for in a hurry.
   */
  toggleEnabled(provider: AdminProvider): void {
    this.save(provider, { ...this.bodyFrom(provider), enabled: !provider.enabled }, provider.enabled ? 'Switched off.' : 'Switched on.');
  }

  saveDraft(provider: AdminProvider): void {
    const draft = this.draft();
    if (!draft || this.hasProblems(provider, draft)) return;

    this.save(provider, {
      enabled: provider.enabled,
      model: draft.model.trim() || null,
      baseUrl: draft.baseUrl.trim() || null,
      dailyRequestLimit: draft.dailyRequestLimit ?? null,
      monthlyRequestLimit: draft.monthlyRequestLimit ?? null,
      timeoutSeconds: draft.timeoutSeconds ?? null,
      supportsJsonMode: null,
    }, 'Saved.');
  }

  discardDraft(provider: AdminProvider): void {
    const draft = this.draft();
    if (!draft) return;
    this.draft.set({
      ...draft,
      model: provider.model ?? '',
      baseUrl: provider.baseUrl ?? '',
      dailyRequestLimit: provider.dailyRequestLimit,
      monthlyRequestLimit: provider.monthlyRequestLimit,
      timeoutSeconds: provider.timeoutSeconds,
    });
    this.setError(provider.id, null);
  }

  askReset(provider: AdminProvider): void {
    this.confirm.set({ kind: 'reset', id: provider.id });
  }

  reset(provider: AdminProvider): void {
    this.confirm.set(null);
    this.mutate(provider.id, this.api.resetProvider(provider.id), 'Back to the configuration file.', () => {
      this.closeCard();
    });
  }

  // --- keys ----------------------------------------------------------------------------

  saveKey(provider: AdminProvider): void {
    const key = this.draft()?.key.trim();
    if (!key) return;

    this.mutate(provider.id, this.api.setProviderKey(provider.id, key), 'Key saved. Test it to be sure.', () => {
      // Cleared from memory the moment it has been sent. It is never coming back from the
      // server, and there is no reason for it to sit in a component.
      this.draft.update((current) => (current ? { ...current, key: '' } : current));
      this.status.notify([`Key saved for ${provider.displayName}. Test it to be sure.`]);
    });
  }

  askRemoveKey(provider: AdminProvider): void {
    this.confirm.set({ kind: 'removeKey', id: provider.id });
  }

  removeKey(provider: AdminProvider): void {
    this.confirm.set(null);
    this.mutate(provider.id, this.api.deleteProviderKey(provider.id), 'Key removed.');
  }

  /** "installed 3 months ago, rotated 2 weeks ago" - and a nudge when it has been a long time. */
  keyAge(provider: AdminProvider): { text: string; old: boolean } | null {
    const key = provider.key;
    if (!key.configured) return null;

    const created = parseUtc(key.createdAt);
    const rotated = parseUtc(key.rotatedAt);
    const latest = Number.isNaN(rotated) ? created : rotated;
    if (Number.isNaN(latest)) return null;

    const parts: string[] = [];
    if (!Number.isNaN(created)) parts.push(`installed ${relativeTime(created, this.now())}`);
    if (!Number.isNaN(rotated)) parts.push(`rotated ${relativeTime(rotated, this.now())}`);
    return { text: parts.join(', '), old: this.now() - latest > OLD_KEY_DAYS * 86_400_000 };
  }

  // --- testing -------------------------------------------------------------------------

  test(provider: AdminProvider): void {
    this.runTest(provider.id).subscribe();
  }

  /** Each enabled provider in turn, so one slow answer does not hide the rest. */
  testAll(): void {
    const ids = this.providers().filter((p) => p.enabled).map((p) => p.id);
    if (ids.length === 0 || this.testingAll()) return;

    this.testingAll.set(true);
    from(ids).pipe(concatMap((id) => this.runTest(id)), toArray()).subscribe(() => this.testingAll.set(false));
  }

  testResult(provider: AdminProvider): TestResult | null {
    return this.tests()[provider.id] ?? null;
  }

  ago(time: number): string {
    return relativeTime(time, this.now());
  }

  private runTest(id: string) {
    const started = performance.now();
    this.busy(id, true);

    return this.api.testProvider(id).pipe(
      map((result) => ({
        ok: result.healthy,
        text: result.healthy ? 'Answered - this one is working.' : result.reason ?? 'No answer.',
      })),
      catchError((failure: unknown) => of({ ok: false, text: this.messageOf(failure, 'The test could not be run.') })),
      map((outcome) => {
        this.busy(id, false);
        this.tests.update((all) => ({
          ...all,
          [id]: { ...outcome, at: Date.now(), ms: Math.round(performance.now() - started) },
        }));
        this.now.set(Date.now());
      }),
    );
  }

  // --- fallback order ------------------------------------------------------------------

  moveUp(capability: string, index: number): void {
    const order = [...(this.chain(capability)?.providerIds ?? [])];
    if (index <= 0) return;

    [order[index - 1], order[index]] = [order[index], order[index - 1]];
    this.saveChain(capability, order);
  }

  moveDown(capability: string, index: number): void {
    const order = [...(this.chain(capability)?.providerIds ?? [])];
    if (index >= order.length - 1) return;

    [order[index], order[index + 1]] = [order[index + 1], order[index]];
    this.saveChain(capability, order);
  }

  removeFromChain(capability: string, providerId: string): void {
    const order = (this.chain(capability)?.providerIds ?? []).filter((id) => id !== providerId);
    this.saveChain(capability, order);
  }

  addToChain(capability: string, providerId: string): void {
    if (!providerId) return;
    this.saveChain(capability, [...(this.chain(capability)?.providerIds ?? []), providerId]);
  }

  resetChain(capability: string): void {
    this.saveChain(capability, []);
  }

  // --- state ---------------------------------------------------------------------------

  isBusy(id: string): boolean {
    return this.working().has(id);
  }

  anyBusy(): boolean {
    return this.working().size > 0;
  }

  needsAttention(provider: AdminProvider): boolean {
    return provider.enabled && !provider.ready;
  }

  state(provider: AdminProvider): Tone {
    if (provider.ready) return 'ok';

    switch (provider.readyReason) {
      case 'Disabled': return '';
      case 'CircuitOpen': return 'err';
      default: return 'warn';
    }
  }

  /** The server's reason code turned into something worth acting on. */
  explain(provider: AdminProvider): string {
    if (provider.ready) {
      return provider.dailyRemaining === null
        ? 'Ready. No daily limit set.'
        : `Ready. ${provider.dailyRemaining} calls left today.`;
    }

    switch (provider.readyReason) {
      case 'Disabled':
        return 'Switched off.';
      case 'NotConfigured':
        return provider.needsExecutable
          ? 'Needs the program’s path setting in the server’s configuration file.'
          : provider.requiresApiKey
            ? 'Needs an API key.'
            : 'Needs an address.';
      case 'QuotaExhausted':
        return 'Today’s allowance is used up. It resets tomorrow.';
      case 'CircuitOpen':
        return 'Recent calls kept failing, so it is being skipped for a few minutes.';
      default:
        return provider.readyReason;
    }
  }

  /** What is used of today's allowance, when there is one to measure against. */
  quota(provider: AdminProvider): { used: number; limit: number; pct: number } | null {
    const limit = provider.dailyRequestLimit;
    const left = provider.dailyRemaining;
    if (!limit || left === null) return null;

    const used = Math.max(0, limit - left);
    return { used, limit, pct: Math.min(100, (used / limit) * 100) };
  }

  /** Why this card is asking for attention, in a few words, for the list above the page. */
  shortReason(provider: AdminProvider): string {
    switch (provider.readyReason) {
      case 'NotConfigured':
        return provider.needsExecutable ? 'program path not set' : provider.requiresApiKey ? 'no API key' : 'no address';
      case 'QuotaExhausted': return 'daily allowance used up';
      case 'CircuitOpen': return 'failing, being skipped';
      default: return provider.readyReason;
    }
  }

  label(capability: string): string {
    return capabilityLabel(capability);
  }

  icon(capability: string): string {
    return capability === 'Text' ? '✍️' : capability === 'Image' ? '🎨' : capability === 'Speech' ? '🗣️' : '🎧';
  }

  describe(capability: string): string {
    switch (capability) {
      case 'Text':
        return 'Inventing characters, scene descriptions and titles from a transcript.';
      case 'Image':
        return 'Drawing character sprites and scene backgrounds.';
      case 'Speech':
        return 'Reading dialogue aloud, one call per line.';
      case 'Transcription':
        return 'Turning audio into a transcript when a video has no captions.';
      default: return '';
    }
  }

  // --- plumbing ------------------------------------------------------------------------

  private matchesQuery(provider: AdminProvider): boolean {
    const terms = this.query().trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (terms.length === 0) return true;
    const text = `${provider.displayName} ${provider.id} ${provider.family} ${provider.model ?? ''} ${provider.capability} ${this.label(provider.capability)}`.toLowerCase();
    return terms.every((term) => text.includes(term));
  }

  private matchesFilter(provider: AdminProvider): boolean {
    switch (this.filter()) {
      case 'attention': return this.needsAttention(provider);
      case 'ready': return provider.ready;
      case 'off': return !provider.enabled;
      case 'local': return provider.runsLocally;
      case 'cloud': return !provider.runsLocally;
      default: return true;
    }
  }

  private bodyFrom(provider: AdminProvider): AdminProviderBody {
    return {
      enabled: provider.enabled,
      model: provider.model,
      baseUrl: provider.baseUrl,
      dailyRequestLimit: provider.dailyRequestLimit,
      monthlyRequestLimit: provider.monthlyRequestLimit,
      timeoutSeconds: provider.timeoutSeconds,
      supportsJsonMode: null,
    };
  }

  private save(provider: AdminProvider, body: AdminProviderBody, note: string): void {
    this.mutate(provider.id, this.api.saveProvider(provider.id, body), note);
  }

  private saveChain(capability: string, providerIds: string[]): void {
    this.mutate(`chain:${capability}`, this.api.saveChain(capability, providerIds), 'Order saved.');
  }

  /**
   * One write, with its spinner and its error right where it was asked for. Every write
   * returns the whole provider list, so the screen is replaced by the server's truth.
   */
  private mutate(scope: string, call: ReturnType<ApiService['saveProvider']>, note: string, done?: () => void): void {
    this.busy(scope, true);
    this.setError(scope, null);

    call.subscribe({
      next: (data) => {
        this.busy(scope, false);
        this.data.set(data);
        this.now.set(Date.now());
        this.notes.update((all) => ({ ...all, [scope]: note }));
        setTimeout(() => this.notes.update((all) => {
          const { [scope]: _, ...rest } = all;
          return rest;
        }), 3000);
        done?.();
      },
      error: (failure: unknown) => {
        this.busy(scope, false);
        this.setError(scope, this.messageOf(failure, 'That could not be saved.'));
      },
    });
  }

  private busy(id: string, on: boolean): void {
    this.working.update((set) => {
      const next = new Set(set);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  private setError(scope: string, message: string | null): void {
    this.errors.update((all) => {
      if (message === null) {
        const { [scope]: _, ...rest } = all;
        return rest;
      }
      return { ...all, [scope]: message };
    });
  }

  private messageOf(failure: unknown, fallback: string): string {
    return failure instanceof ApiFailure ? failure.message : fallback;
  }

  private loadCollapsed(): ReadonlySet<string> {
    try {
      const raw = JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}') as { collapsed?: unknown };
      return new Set(Array.isArray(raw.collapsed) ? raw.collapsed.filter((c): c is string => typeof c === 'string') : []);
    } catch {
      return new Set();
    }
  }
}
