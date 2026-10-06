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
      <header class="ws-head">
        <div>
          <h2>Application settings</h2>
          <p class="muted">Stored in the database and layered over appsettings.json. Changes apply immediately unless marked <span class="badge restart">after restart</span>.</p>
        </div>
        <div class="ws-tools">
          <input type="search" placeholder="Filter settings" [value]="filter()" (input)="filter.set($any($event.target).value)" aria-label="Filter settings" />
          <button type="button" class="btn-outline icon" (click)="refresh()" [disabled]="busy()" title="Reload settings from the database">
            <span [class.spin]="busy()">↻</span> Refresh config
          </button>
        </div>
      </header>

      @if (overview(); as o) {
        @if (o.pendingRestartCount > 0) {
          <div class="notice">{{ o.pendingRestartCount }} {{ o.pendingRestartCount === 1 ? 'change waits' : 'changes wait' }} for a server restart to take effect.</div>
        }
        @if (o.loadedAt) { <p class="muted small">Loaded from the database {{ o.loadedAt | date: 'medium' }}.</p> }
      }
      @if (error()) { <p class="err">{{ error() }}</p> }

      @for (group of groups(); track group.name) {
        <div class="ws-card">
          <h3>{{ group.name }}</h3>
          @for (s of group.settings; track s.key) {
            <div class="ws-row" [class.changed]="s.storedValue != null">
              <div class="ws-info">
                <label [attr.for]="'ws-' + s.key">{{ s.label }}</label>
                <span class="badge" [class.restart]="!s.appliesLive">{{ s.appliesLive ? 'live' : 'after restart' }}</span>
                @if (s.pendingRestart) { <span class="badge warn">restart needed</span> }
                <p class="muted small">{{ s.description }}</p>
                <code class="muted small">{{ s.key }}</code>
                <span class="muted small">
                  · {{ s.storedValue != null ? 'set here' : 'from appsettings' }}
                  @if (s.storedValue != null && s.fileValue != null) { (file: {{ s.fileValue }}) }
                  @if (s.updatedAt) { · {{ s.updatedAt | date: 'short' }} }
                </span>
              </div>

              <div class="ws-edit">
                @switch (s.type) {
                  @case ('Boolean') {
                    <label class="switch">
                      <input type="checkbox" [id]="'ws-' + s.key" [checked]="draftOf(s) === 'true'"
                             (change)="setDraft(s, $any($event.target).checked ? 'true' : 'false')" />
                      {{ draftOf(s) === 'true' ? 'On' : 'Off' }}
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
                  <button type="button" class="btn-primary-glow" (click)="save(s)" [disabled]="busy() || !isDirty(s)">Save</button>
                  @if (s.storedValue != null) {
                    <button type="button" class="btn-outline" (click)="reset(s)" [disabled]="busy()" title="Go back to the appsettings.json value">Reset</button>
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
    .ws-head { display: flex; justify-content: space-between; gap: 1rem; flex-wrap: wrap; align-items: flex-start; margin-bottom: .75rem; }
    .ws-head h2 { margin: 0 0 .25rem; }
    .ws-tools { display: flex; gap: .5rem; align-items: center; }
    .ws-tools input { min-width: 200px; }
    .ws-card { border: 1px solid var(--border, rgba(148, 163, 184, .2)); border-radius: 12px; padding: .75rem 1rem; margin-bottom: 1rem; }
    .ws-card h3 { margin: .25rem 0 .5rem; font-size: 1rem; }
    .ws-row { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr); gap: 1rem; padding: .65rem 0;
      border-top: 1px solid var(--border, rgba(148, 163, 184, .12)); }
    .ws-row:first-of-type { border-top: 0; }
    .ws-row.changed .ws-info label { color: var(--brand, #6c8cff); }
    @media (max-width: 720px) { .ws-row { grid-template-columns: 1fr; } }
    .ws-info label { font-weight: 600; margin-right: .4rem; }
    .ws-info p { margin: .2rem 0; }
    .ws-edit { display: flex; flex-wrap: wrap; gap: .4rem .6rem; align-items: center; align-content: flex-start; }
    .ws-edit input[type=number] { width: 9rem; }
    .ws-edit input[type=text], .ws-edit input[type=url] { flex: 1; min-width: 12rem; }
    .ws-btns { display: flex; gap: .4rem; }
    .switch { display: inline-flex; align-items: center; gap: .4rem; cursor: pointer; }
    .badge { font-size: .68rem; text-transform: uppercase; letter-spacing: .04em; padding: .1rem .4rem; border-radius: 999px;
      background: rgba(34, 197, 94, .15); color: #86efac; vertical-align: middle; }
    .badge.restart { background: rgba(148, 163, 184, .15); color: #cbd5e1; }
    .badge.warn { background: rgba(245, 158, 11, .18); color: #fcd34d; margin-left: .25rem; }
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
