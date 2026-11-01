import { Component, DestroyRef, HostListener, computed, effect, inject, signal } from '@angular/core';
import { catchError, concatMap, from, map, of, toArray } from 'rxjs';

import { ApiFailure } from '../../core/interceptors/api-error.interceptor';
import { AdminSettingsService, WebSetting, WebSettingsOverview } from '../../core/services/admin-settings.service';
import { copyText, downloadText, fileStamp, parseUtc, relativeTime } from './admin-format';

type Filter = 'all' | 'overridden' | 'unsaved' | 'restart';
type Note = { tone: 'ok' | 'warn' | 'err'; text: string };

const FILTERS: readonly { id: Filter; label: string }[] = [
  { id: 'all', label: 'All settings' },
  { id: 'overridden', label: 'Set here' },
  { id: 'unsaved', label: 'Unsaved' },
  { id: 'restart', label: 'Waiting for restart' },
];
const PREFS_KEY = 'animstudio.admin.settings';

/**
 * Application settings from the WebSettings table: everything appsettings.json sets that
 * is safe to change at runtime, with where each value comes from. A save applies at once;
 * ↻ re-reads the table (for rows changed in the database directly). Secrets, paths and
 * connection strings are not listed - they stay in configuration.
 *
 * Edits are held as drafts until saved, and several can be saved together. The checks on a
 * draft are early feedback only; the server validates every value again.
 */
@Component({
  selector: 'app-admin-settings',
  templateUrl: './admin-settings.component.html',
  styleUrls: ['./admin-ui.css', './admin-settings.component.css'],
})
export class AdminSettingsComponent {
  private readonly api = inject(AdminSettingsService);

  readonly filters = FILTERS;

  readonly overview = signal<WebSettingsOverview | null>(null);
  readonly drafts = signal<Record<string, string>>({});
  readonly loading = signal(true);
  readonly refreshing = signal(false);
  readonly saving = signal(false);
  readonly failure = signal<string | null>(null);
  readonly now = signal(Date.now());

  readonly query = signal('');
  readonly filter = signal<Filter>('all');
  readonly collapsed = signal<ReadonlySet<string>>(this.loadCollapsed());

  /** What happened to a row, shown on the row and gone a few seconds later (errors stay). */
  readonly notes = signal<Record<string, Note>>({});
  readonly working = signal<ReadonlySet<string>>(new Set());
  readonly confirmReset = signal<string | null>(null);
  readonly confirmDiscard = signal(false);
  readonly copied = signal(false);

  private readonly all = computed(() => this.overview()?.settings ?? []);

  readonly dirtyKeys = computed(() => this.all().filter((s) => this.isDirty(s)).map((s) => s.key));
  readonly invalidKeys = computed(() => this.all().filter((s) => this.isDirty(s) && this.problem(s) !== null).map((s) => s.key));
  readonly validCount = computed(() => this.dirtyKeys().length - this.invalidKeys().length);
  readonly groupTotal = computed(() => new Set(this.all().map((s) => s.group)).size);

  readonly counts = computed(() => {
    const matching = this.all().filter((s) => this.matchesQuery(s));
    return {
      all: matching.length,
      overridden: matching.filter((s) => s.storedValue != null).length,
      unsaved: matching.filter((s) => this.isDirty(s)).length,
      restart: matching.filter((s) => s.pendingRestart).length,
    } satisfies Record<Filter, number>;
  });

  readonly groups = computed(() => {
    const map = new Map<string, WebSetting[]>();
    for (const s of this.all()) {
      if (!this.matchesQuery(s) || !this.matchesFilter(s)) continue;
      map.set(s.group, [...(map.get(s.group) ?? []), s]);
    }
    return [...map].map(([name, settings]) => ({
      name,
      settings,
      total: this.all().filter((s) => s.group === name).length,
      overridden: settings.filter((s) => s.storedValue != null).length,
      unsaved: settings.filter((s) => this.isDirty(s)).length,
    }));
  });

  readonly shownCount = computed(() => this.groups().reduce((sum, g) => sum + g.settings.length, 0));
  readonly overrides = computed(() => this.all().filter((s) => s.storedValue != null));
  readonly hasFilters = computed(() => !!this.query().trim() || this.filter() !== 'all');

  constructor() {
    this.load();

    effect(() => {
      try {
        localStorage.setItem(PREFS_KEY, JSON.stringify({ collapsed: [...this.collapsed()] }));
      } catch { /* storage unavailable - the layout just won't be remembered */ }
    });

    const timer = setInterval(() => this.now.set(Date.now()), 60_000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  /** Ctrl+S saves every valid draft at once. */
  @HostListener('document:keydown', ['$event'])
  onKey(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      this.saveAll();
    }
  }

  @HostListener('window:beforeunload', ['$event'])
  onUnload(event: BeforeUnloadEvent): void {
    if (this.dirtyKeys().length > 0) {
      event.preventDefault();
      event.returnValue = '';
    }
  }

  load(): void {
    this.loading.set(true);
    this.api.list().subscribe({
      next: (o) => this.applyOverview(o),
      error: (e: unknown) => {
        this.loading.set(false);
        this.failure.set(this.messageOf(e, 'The settings could not be loaded.'));
      },
    });
  }

  /** Re-reads the WebSettings table on the server, for rows changed in the database directly. */
  refresh(): void {
    this.refreshing.set(true);
    this.api.refresh().subscribe({
      next: (o) => {
        this.refreshing.set(false);
        this.applyOverview(o);
      },
      error: (e: unknown) => {
        this.refreshing.set(false);
        this.failure.set(this.messageOf(e, 'The settings could not be reloaded.'));
      },
    });
  }

  // --- drafts --------------------------------------------------------------------------

  draftOf(s: WebSetting): string {
    return this.drafts()[s.key] ?? s.effectiveValue ?? '';
  }

  setDraft(s: WebSetting, value: string): void {
    this.confirmReset.set(null);
    this.clearNote(s.key);
    this.drafts.update((d) => {
      if (value === (s.effectiveValue ?? '')) {
        const { [s.key]: _, ...rest } = d;
        return rest;
      }
      return { ...d, [s.key]: value };
    });
  }

  revert(s: WebSetting): void {
    this.drafts.update(({ [s.key]: _, ...rest }) => rest);
    this.clearNote(s.key);
  }

  isDirty(s: WebSetting): boolean {
    const draft = this.drafts()[s.key];
    return draft !== undefined && draft !== (s.effectiveValue ?? '');
  }

  /** Why the current draft would be refused, or null. Early feedback; the server decides. */
  problem(s: WebSetting): string | null {
    const value = this.draftOf(s).trim();

    switch (s.type) {
      case 'Integer':
      case 'Number': {
        if (value === '') return 'A number is needed.';
        const n = Number(value);
        if (!Number.isFinite(n)) return 'That is not a number.';
        if (s.type === 'Integer' && !Number.isInteger(n)) return 'Use a whole number.';
        if (s.min != null && n < s.min) return `At least ${s.min}.`;
        if (s.max != null && n > s.max) return `At most ${s.max}.`;
        return null;
      }
      case 'Url': {
        if (value === '') return null;
        try {
          const url = new URL(value);
          return ['http:', 'https:'].includes(url.protocol) ? null : 'Use an http or https address.';
        } catch {
          return 'That is not a valid address.';
        }
      }
      case 'Choice':
        return s.choices && !s.choices.includes(this.draftOf(s)) ? 'Pick one of the choices.' : null;
      case 'Text':
        return value.length > s.maxLength ? `At most ${s.maxLength} characters.` : null;
      default:
        return null;
    }
  }

  // --- saving --------------------------------------------------------------------------

  save(s: WebSetting): void {
    if (!this.isDirty(s) || this.problem(s) !== null || this.isWorking(s)) return;
    this.setWorking([s.key], true);

    this.api.set(s.key, this.draftOf(s)).subscribe({
      next: (o) => {
        this.setWorking([s.key], false);
        this.applyOverview(o, [s.key]);
        this.note(s.key, this.savedNote(s));
      },
      error: (e: unknown) => {
        this.setWorking([s.key], false);
        this.note(s.key, { tone: 'err', text: this.messageOf(e, 'That could not be saved.') }, false);
      },
    });
  }

  /** One call per setting, in order: the server returns the whole table each time, so the last answer wins. */
  saveAll(): void {
    const targets = this.all().filter((s) => this.isDirty(s) && this.problem(s) === null);
    if (targets.length === 0 || this.saving()) return;

    this.saving.set(true);
    this.setWorking(targets.map((s) => s.key), true);

    from(targets).pipe(
      concatMap((s) => this.api.set(s.key, this.draftOf(s)).pipe(
        map((overview) => ({ s, overview, error: null as string | null })),
        catchError((e: unknown) => of({ s, overview: null as WebSettingsOverview | null, error: this.messageOf(e, 'That could not be saved.') })),
      )),
      toArray(),
    ).subscribe((results) => {
      this.saving.set(false);
      this.setWorking(targets.map((s) => s.key), false);

      const last = [...results].reverse().find((r) => r.overview)?.overview;
      const saved = results.filter((r) => !r.error).map((r) => r.s.key);
      if (last) this.applyOverview(last, saved);

      for (const r of results) {
        this.note(r.s.key, r.error ? { tone: 'err', text: r.error } : this.savedNote(r.s), !r.error);
      }
    });
  }

  discardAll(): void {
    this.drafts.set({});
    this.confirmDiscard.set(false);
    this.notes.set({});
  }

  askReset(s: WebSetting): void {
    this.confirmReset.set(s.key);
  }

  reset(s: WebSetting): void {
    this.confirmReset.set(null);
    this.setWorking([s.key], true);

    this.api.reset(s.key).subscribe({
      next: (o) => {
        this.setWorking([s.key], false);
        this.applyOverview(o, [s.key]);
        this.note(s.key, { tone: 'ok', text: 'Back to the appsettings.json value.' });
      },
      error: (e: unknown) => {
        this.setWorking([s.key], false);
        this.note(s.key, { tone: 'err', text: this.messageOf(e, 'That could not be reset.') }, false);
      },
    });
  }

  // --- view ----------------------------------------------------------------------------

  isWorking(s: WebSetting): boolean {
    return this.working().has(s.key);
  }

  noteOf(s: WebSetting): Note | null {
    return this.notes()[s.key] ?? null;
  }

  isCollapsed(group: string): boolean {
    return this.collapsed().has(group);
  }

  toggleGroup(group: string): void {
    this.collapsed.update((set) => {
      const next = new Set(set);
      if (!next.delete(group)) next.add(group);
      return next;
    });
  }

  jumpTo(group: string): void {
    this.collapsed.update((set) => {
      const next = new Set(set);
      next.delete(group);
      return next;
    });
    setTimeout(() => document.getElementById(`ws-group-${group}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  clearFilters(): void {
    this.query.set('');
    this.filter.set('all');
  }

  updated(s: WebSetting): string {
    const at = parseUtc(s.updatedAt);
    return Number.isNaN(at) ? '' : relativeTime(at, this.now());
  }

  loadedAgo(): string {
    const at = parseUtc(this.overview()?.loadedAt);
    return Number.isNaN(at) ? '' : relativeTime(at, this.now());
  }

  who(s: WebSetting): string {
    const id = s.updatedByUserId;
    return !id ? '' : id.includes('@') || id.length <= 12 ? id : `${id.slice(0, 8)}…`;
  }

  // --- backup --------------------------------------------------------------------------

  /** The values set here, as JSON: what would need re-entering on a fresh database. */
  overridesJson(): string {
    return JSON.stringify(Object.fromEntries(this.overrides().map((s) => [s.key, s.storedValue])), null, 2);
  }

  async copyOverrides(): Promise<void> {
    if (!(await copyText(this.overridesJson()))) return;
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 1500);
  }

  downloadOverrides(): void {
    downloadText(`animstudio-settings-${fileStamp()}.json`, this.overridesJson(), 'application/json;charset=utf-8');
  }

  // --- plumbing ------------------------------------------------------------------------

  private applyOverview(o: WebSettingsOverview, savedKeys: readonly string[] = []): void {
    this.overview.set(o);
    this.loading.set(false);
    this.failure.set(null);
    this.now.set(Date.now());
    if (savedKeys.length > 0) {
      this.drafts.update((d) => {
        const next = { ...d };
        for (const key of savedKeys) delete next[key];
        return next;
      });
    }
  }

  private savedNote(s: WebSetting): Note {
    return s.appliesLive
      ? { tone: 'ok', text: 'Saved and applied.' }
      : { tone: 'warn', text: 'Saved. It takes effect after the server restarts.' };
  }

  private note(key: string, note: Note, fade = true): void {
    this.notes.update((all) => ({ ...all, [key]: note }));
    if (fade && note.tone !== 'err') setTimeout(() => this.clearNote(key, note), 4000);
  }

  private clearNote(key: string, only?: Note): void {
    this.notes.update((all) => {
      if (!all[key] || (only && all[key] !== only)) return all;
      const { [key]: _, ...rest } = all;
      return rest;
    });
  }

  private setWorking(keys: readonly string[], on: boolean): void {
    this.working.update((set) => {
      const next = new Set(set);
      for (const key of keys) {
        if (on) next.add(key);
        else next.delete(key);
      }
      return next;
    });
  }

  private matchesQuery(s: WebSetting): boolean {
    const terms = this.query().trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (terms.length === 0) return true;
    const text = `${s.label} ${s.key} ${s.description} ${s.group}`.toLowerCase();
    return terms.every((t) => text.includes(t));
  }

  private matchesFilter(s: WebSetting): boolean {
    switch (this.filter()) {
      case 'overridden': return s.storedValue != null;
      case 'unsaved': return this.isDirty(s);
      case 'restart': return s.pendingRestart;
      default: return true;
    }
  }

  private messageOf(failure: unknown, fallback: string): string {
    return failure instanceof ApiFailure ? failure.message : failure instanceof Error ? failure.message : fallback;
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
