import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';

import { StorageDetail, formatBytes } from '../../core/models/api.models';
import { ApiService } from '../../core/services/api.service';
import { StatusService } from '../../core/services/status.service';

/**
 * Where the media goes: how much of the store is used, which folders hold it, and the
 * quota the project hub's storage bar fills against.
 */
@Component({
  selector: 'app-admin-storage',
  imports: [DatePipe],
  template: `
    <section class="st">
      <header class="st-head">
        <div>
          <h2>Storage</h2>
          <p class="muted">Uploaded clips, generated media and finished renders. The project hub's bar shows the same numbers.</p>
        </div>
        <button type="button" class="btn-outline" (click)="load(true)" [disabled]="status.busy()">↻ Measure now</button>
      </header>

      @if (detail(); as d) {
        @if (!d.summary.isMeasurable) {
          <div class="notice">{{ d.summary.provider }} storage is not measured from this server; set a quota anyway to keep the bar meaningful.</div>
        }

        <div class="st-meter" [class.warn]="percent() >= 85" [class.full]="percent() >= 100">
          <div class="st-meter-row">
            <strong>{{ bytes(d.summary.usedBytes) }}</strong>
            <span class="muted">
              @if (d.summary.capacityBytes) {
                of {{ bytes(d.summary.capacityBytes) }}
                ({{ d.summary.capacitySource === 'quota' ? 'quota' : 'whole drive - no quota set' }})
                &middot; {{ percent().toFixed(0) }}%
              }
            </span>
          </div>
          <div class="st-track"><div class="st-fill" [style.width.%]="Math.min(100, percent())"></div></div>
          <div class="st-sub muted">
            {{ d.fileCount }} files
            @if (d.diskFreeBytes !== null) { &middot; {{ bytes(d.diskFreeBytes) }} free on the drive }
            &middot; measured {{ d.summary.measuredAt | date: 'shortTime' }}
          </div>
        </div>

        <div class="st-grid">
          <div class="st-card">
            <h3>Quota</h3>
            <p class="muted">The space set aside for this studio. Leave empty to measure against the whole drive.</p>
            <div class="st-quota">
              <input type="number" min="1" step="1" placeholder="No quota" [value]="d.quotaGb ?? ''"
                     (input)="quotaInput.set($any($event.target).value)" />
              <span>GB</span>
              <button type="button" class="btn-primary-glow" (click)="saveQuota()" [disabled]="status.busy() || !quotaValid()">Save</button>
              @if (d.quotaGb !== null) {
                <button type="button" class="btn-outline" (click)="clearQuota()" [disabled]="status.busy()">Remove quota</button>
              }
            </div>
            @if (!quotaValid()) { <p class="err">Enter a whole number of GB from 1 up, or leave it empty.</p> }
          </div>

          <div class="st-card">
            <h3>By folder</h3>
            @if (d.folders.length === 0) {
              <p class="muted">Nothing stored yet.</p>
            } @else {
              <ul class="st-folders">
                @for (f of d.folders; track f.name) {
                  <li>
                    <span class="name">{{ f.name }}</span>
                    <span class="bar"><span [style.width.%]="d.summary.usedBytes ? (f.bytes / d.summary.usedBytes) * 100 : 0"></span></span>
                    <span class="size">{{ bytes(f.bytes) }}</span>
                    <span class="files muted">{{ f.files }} files</span>
                  </li>
                }
              </ul>
            }
          </div>
        </div>
      } @else {
        <div class="muted">Measuring&hellip;</div>
      }
    </section>
  `,
  styles: [`
    .st-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; margin-bottom: 1rem; }
    .st-head h2 { margin: 0 0 4px; }
    .st-head p { margin: 0; font-size: .85rem; }
    .st-meter { background: var(--surface, #111827); border: 1px solid var(--border, #1e2433); border-radius: 10px; padding: 14px 16px; margin-bottom: 1rem; }
    .st-meter-row { display: flex; gap: 8px; align-items: baseline; margin-bottom: 8px; }
    .st-meter-row strong { font-size: 1.4rem; }
    .st-track { height: 10px; border-radius: 5px; background: var(--bg, #0b0f19); overflow: hidden; }
    .st-fill { height: 100%; background: var(--brand, #6c8cff); transition: width .3s; }
    .st-meter.warn .st-fill { background: #f59e0b; }
    .st-meter.full .st-fill { background: #ef4444; }
    .st-sub { font-size: .75rem; margin-top: 6px; }
    .st-grid { display: grid; grid-template-columns: minmax(260px, 1fr) minmax(320px, 2fr); gap: 1rem; }
    @media (max-width: 900px) { .st-grid { grid-template-columns: 1fr; } }
    .st-card { background: var(--surface, #111827); border: 1px solid var(--border, #1e2433); border-radius: 10px; padding: 14px 16px; }
    .st-card h3 { margin: 0 0 4px; font-size: .95rem; }
    .st-card p { font-size: .8rem; margin: 0 0 10px; }
    .st-quota { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
    .st-quota input { width: 120px; }
    .err { color: #f87171; }
    .st-folders { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
    .st-folders li { display: grid; grid-template-columns: minmax(90px, 1fr) 2fr auto auto; gap: 10px; align-items: center; font-size: .82rem; }
    .st-folders .bar { height: 6px; border-radius: 3px; background: var(--bg, #0b0f19); overflow: hidden; }
    .st-folders .bar span { display: block; height: 100%; background: var(--brand, #6c8cff); }
    .st-folders .size { font-variant-numeric: tabular-nums; }
    .st-folders .files { font-size: .72rem; }
    .notice { margin-bottom: 1rem; }
  `],
})
export class AdminStorageComponent {
  private readonly api = inject(ApiService);
  readonly status = inject(StatusService);
  readonly Math = Math;
  readonly bytes = formatBytes;

  readonly detail = signal<StorageDetail | null>(null);
  readonly quotaInput = signal<string | null>(null);

  readonly percent = computed(() => {
    const s = this.detail()?.summary;
    return s?.capacityBytes ? (s.usedBytes / s.capacityBytes) * 100 : 0;
  });

  /** Null = untouched; empty = no quota; otherwise a positive whole number. */
  readonly quotaValid = computed(() => {
    const raw = this.quotaInput();
    if (raw === null || raw.trim() === '') return true;
    const n = Number(raw);
    return Number.isInteger(n) && n >= 1 && n <= 1_000_000;
  });

  constructor() {
    this.load(false);
  }

  load(refresh: boolean): void {
    this.status.run(this.api.adminStorage(refresh), (d) => this.detail.set(d));
  }

  saveQuota(): void {
    const raw = this.quotaInput();
    if (raw === null || !this.quotaValid()) return;
    const quota = raw.trim() === '' ? null : Number(raw);
    this.status.run(this.api.updateStorageQuota(quota), (d) => {
      this.detail.set(d);
      this.quotaInput.set(null);
      this.status.notify([quota === null ? 'Storage quota removed.' : `Storage quota set to ${quota} GB.`]);
    });
  }

  clearQuota(): void {
    this.status.run(this.api.updateStorageQuota(null), (d) => {
      this.detail.set(d);
      this.quotaInput.set(null);
      this.status.notify(['Storage quota removed.']);
    });
  }
}
