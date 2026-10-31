import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { AdminSettingsService, WebSetting, WebSettingsOverview } from '../../core/services/admin-settings.service';

/**
 * Application settings from the WebSettings table: everything appsettings.json sets that
 * is safe to change at runtime, with where each value comes from. A save applies at once;
 * ↻ re-reads the table (for rows changed in the database directly). Secrets, paths and
 * connection strings are not listed - they stay in configuration.
 */
@Component({
  selector: 'app-admin-settings',
  imports: [DatePipe],
  template: `
    <section class="ws">
      <header class="page-head" style="margin-top: 0">
        <div style="display: flex; align-items: flex-start; gap: 0.85rem">
          <div class="studio-icon-badge" style="width: 2.6rem; height: 2.6rem; margin-top: 2px">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>
            </svg>
          </div>
          <div>
            <div class="row" style="gap: 0.5rem; margin-bottom: 0.15rem">
              <h2 style="margin: 0">Application settings</h2>
              <span class="pill brand">Runtime Config</span>
            </div>
            <p class="muted">Stored in the database and layered over appsettings.json. Changes apply immediately unless marked <span class="badge restart">after restart</span>.</p>
          </div>
        </div>
        <div class="ws-tools">
          <div class="studio-search-wrap" style="min-width: 230px">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
            </svg>
            <input type="search" placeholder="Filter settings…" [value]="filter()" (input)="filter.set($any($event.target).value)" aria-label="Filter settings" />
          </div>
          <button type="button" class="secondary" (click)="refresh()" [disabled]="busy()" title="Reload settings from the database">
            <span [class.spin]="busy()">↻</span> Refresh config
          </button>
        </div>
      </header>

      @if (overview(); as o) {
        @if (o.pendingRestartCount > 0) {
          <div class="notice">{{ o.pendingRestartCount }} {{ o.pendingRestartCount === 1 ? 'change waits' : 'changes wait' }} for a server restart to take effect.</div>
        }
        @if (o.loadedAt) { <p class="muted small" style="margin-bottom: 0.85rem">Loaded from the database {{ o.loadedAt | date: 'medium' }}.</p> }
      }
      @if (error()) { <div class="notice error">{{ error() }}</div> }

      @for (group of groups(); track group.name) {
        <div class="card ws-card">
          <div class="studio-card-head">
            <div class="studio-card-title-group">
              <h3>{{ group.name }}</h3>
              <span class="pill">{{ group.settings.length }}</span>
            </div>
          </div>
          @for (s of group.settings; track s.key) {
            <div class="ws-row" [class.changed]="s.storedValue != null">
              <div class="ws-info">
                <div class="row" style="gap: 0.4rem; margin-bottom: 0.15rem">
                  <label [attr.for]="'ws-' + s.key" style="margin: 0">{{ s.label }}</label>
                  <span class="badge" [class.restart]="!s.appliesLive">{{ s.appliesLive ? 'live' : 'after restart' }}</span>
                  @if (s.pendingRestart) { <span class="badge warn">restart needed</span> }
                </div>
                <p class="muted small">{{ s.description }}</p>
                <div style="margin-top: 0.15rem">
                  <code class="muted small">{{ s.key }}</code>
                  <span class="muted small">
                    · {{ s.storedValue != null ? 'set here' : 'from appsettings' }}
                    @if (s.storedValue != null && s.fileValue != null) { (file: {{ s.fileValue }}) }
                    @if (s.updatedAt) { · {{ s.updatedAt | date: 'short' }} }
                  </span>
                </div>
              </div>

              <div class="ws-edit">
                @switch (s.type) {
                  @case ('Boolean') {
                    <label class="switch">
                      <input type="checkbox" [id]="'ws-' + s.key" [checked]="draftOf(s) === 'true'"
                             (change)="setDraft(s, $any($event.target).checked ? 'true' : 'false')" />
                      <span class="track"></span>
                      <span>{{ draftOf(s) === 'true' ? 'On' : 'Off' }}</span>
                    </label>
                  }
                  @case ('Choice') {
                    <select [id]="'ws-' + s.key" [value]="draftOf(s)" (change)="setDraft(s, $any($event.target).value)">
                      @for (c of s.choices ?? []; track c) { <option [value]="c">{{ c }}</option> }
                    </select>
                  }
                  @case ('Integer') {
                    <input [id]="'ws-' + s.key" type="number" step="1" [min]="s.min ?? null" [max]="s.max ?? null"
                           [value]="draftOf(s)" (input)="setDraft(s, $any($event.target).value)" />
                  }
                  @case ('Number') {
                    <input [id]="'ws-' + s.key" type="number" step="any" [min]="s.min ?? null" [max]="s.max ?? null"
                           [value]="draftOf(s)" (input)="setDraft(s, $any($event.target).value)" />
                  }
                  @default {
                    <input [id]="'ws-' + s.key" [type]="s.type === 'Url' ? 'url' : 'text'" [attr.maxlength]="s.maxLength"
                           [value]="draftOf(s)" (input)="setDraft(s, $any($event.target).value)" />
                  }
                }
                @if (s.min != null && s.max != null) { <span class="muted small">{{ s.min }}–{{ s.max }}</span> }
                <div class="ws-btns">
                  <button type="button" class="small" (click)="save(s)" [disabled]="busy() || !isDirty(s)">Save</button>
                  @if (s.storedValue != null) {
                    <button type="button" class="secondary small" (click)="reset(s)" [disabled]="busy()" title="Go back to the appsettings.json value">Reset</button>
                  }
                </div>
              </div>
            </div>
          }
        </div>
      }
    </section>
  `,
  styles: [`
    .ws-tools { display: flex; gap: .55rem; align-items: center; flex-wrap: wrap; }
    .ws-card h3 { margin: 0; font-size: 1.02rem; }
    .ws-row { display: grid; grid-template-columns: minmax(0, 1.45fr) minmax(0, 1fr); gap: 1rem; padding: .8rem 0;
      border-top: 1px solid var(--border); align-items: center; }
    .ws-row:first-of-type { border-top: 0; padding-top: 0.2rem; }
    .ws-row.changed .ws-info label { color: var(--brand-bright); }
    @media (max-width: 720px) { .ws-row { grid-template-columns: 1fr; } }
    .ws-info { min-width: 0; overflow-wrap: anywhere; }
    .ws-info label { font-weight: 700; color: var(--text); font-size: 0.9rem; }
    .ws-info p { margin: .2rem 0; }
    .ws-edit { display: flex; flex-wrap: wrap; gap: .45rem .6rem; align-items: center; align-content: flex-start; }
    .ws-edit input[type=number] { width: 9rem; }
    .ws-edit input[type=text], .ws-edit input[type=url] { flex: 1; min-width: 12rem; }
    .ws-btns { display: flex; gap: .4rem; }
    .badge { font-size: .68rem; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; padding: .12rem .45rem; border-radius: 999px;
      background: var(--ok-dim); color: var(--ok); vertical-align: middle; }
    .badge.restart { background: rgba(148, 163, 184, .14); color: var(--text-dim); }
    .badge.warn { background: var(--warn-dim); color: var(--warn); margin-left: .25rem; }
    .small { font-size: .78rem; }
    .spin { display: inline-block; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class AdminSettingsComponent implements OnInit {
  private readonly api = inject(AdminSettingsService);

  readonly overview = signal<WebSettingsOverview | null>(null);
  readonly drafts = signal<Record<string, string>>({});
  readonly filter = signal('');
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);

  readonly groups = computed(() => {
    const q = this.filter().trim().toLowerCase();
    const map = new Map<string, WebSetting[]>();
    for (const s of this.overview()?.settings ?? []) {
      if (q && !`${s.label} ${s.key} ${s.description} ${s.group}`.toLowerCase().includes(q)) continue;
      map.set(s.group, [...(map.get(s.group) ?? []), s]);
    }
    return [...map].map(([name, settings]) => ({ name, settings }));
  });

  ngOnInit(): void {
    this.run(this.api.list());
  }

  refresh(): void {
    this.run(this.api.refresh());
  }

  save(s: WebSetting): void {
    this.run(this.api.set(s.key, this.draftOf(s)), s.key);
  }

  reset(s: WebSetting): void {
    if (!confirm(`Reset "${s.label}" to the appsettings.json value (${s.fileValue ?? 'built-in default'})?`)) return;
    this.run(this.api.reset(s.key), s.key);
  }

  draftOf(s: WebSetting): string {
    return this.drafts()[s.key] ?? s.effectiveValue ?? '';
  }

  setDraft(s: WebSetting, value: string): void {
    this.drafts.update((d) => ({ ...d, [s.key]: value }));
  }

  isDirty(s: WebSetting): boolean {
    const draft = this.drafts()[s.key];
    return draft !== undefined && draft !== (s.effectiveValue ?? '');
  }

  private run(call: ReturnType<AdminSettingsService['list']>, clearKey?: string): void {
    this.busy.set(true);
    this.error.set(null);
    call.subscribe({
      next: (o) => {
        this.overview.set(o);
        if (clearKey) this.drafts.update(({ [clearKey]: _, ...rest }) => rest);
        this.busy.set(false);
      },
      error: (e: Error) => {
        this.error.set(e.message);
        this.busy.set(false);
      },
    });
  }
}
