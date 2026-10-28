import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';

import { DriveSyncReport, StorageDetail, formatBytes } from '../../core/models/api.models';
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
      <header class="page-head" style="margin-top: 0">
        <div style="display: flex; align-items: flex-start; gap: 0.85rem">
          <div class="studio-icon-badge emerald" style="width: 2.6rem; height: 2.6rem; margin-top: 2px">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
            </svg>
          </div>
          <div>
            <div class="row" style="gap: 0.5rem; margin-bottom: 0.15rem">
              <h2 style="margin: 0">Storage</h2>
              @if (detail(); as d) {
                <span class="pill brand">{{ d.summary.provider }}</span>
              }
            </div>
            <p class="muted">Uploaded clips, generated media and finished renders. The project hub's bar shows the same numbers.</p>
          </div>
        </div>
        <button type="button" class="secondary" (click)="load(true)" [disabled]="status.busy()">↻ Measure now</button>
      </header>

      @if (detail(); as d) {
        @if (!d.summary.isMeasurable) {
          <div class="notice">{{ d.summary.provider }} storage is not measured from this server; set a quota anyway to keep the bar meaningful.</div>
        }

        <div class="sb-kpi-strip">
          <div class="sb-kpi-card">
            <span class="sb-kpi-label">Used Storage</span>
            <strong class="sb-kpi-val mono">{{ bytes(d.summary.usedBytes) }}</strong>
          </div>
          <div class="sb-kpi-card">
            <span class="sb-kpi-label">Stored Files</span>
            <strong class="sb-kpi-val mono">{{ d.fileCount }}</strong>
          </div>
          @if (d.diskFreeBytes !== null) {
            <div class="sb-kpi-card">
              <span class="sb-kpi-label">Drive Free Space</span>
              <strong class="sb-kpi-val mono" style="color: var(--ok)">{{ bytes(d.diskFreeBytes) }}</strong>
            </div>
          }
          <div class="sb-kpi-card">
            <span class="sb-kpi-label">Quota Limit</span>
            <strong class="sb-kpi-val mono">{{ d.quotaGb ? d.quotaGb + ' GB' : 'Uncapped' }}</strong>
          </div>
        </div>

        <div class="card st-meter" [class.warn]="percent() >= 85" [class.full]="percent() >= 100">
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
          <div class="card st-card">
            <div class="studio-card-head">
              <div class="studio-card-title-group">
                <h3>Quota</h3>
              </div>
            </div>
            <p class="muted">The space set aside for this studio. Leave empty to measure against the whole drive.</p>
            <div class="st-quota">
              <input type="number" min="1" step="1" placeholder="No quota" [value]="d.quotaGb ?? ''"
                     (input)="quotaInput.set($any($event.target).value)" />
              <span class="muted">GB</span>
              <button type="button" (click)="saveQuota()" [disabled]="status.busy() || !quotaValid()">Save</button>
              @if (d.quotaGb !== null) {
                <button type="button" class="secondary" (click)="clearQuota()" [disabled]="status.busy()">Remove quota</button>
              }
            </div>
            @if (!quotaValid()) { <p class="err">Enter a whole number of GB from 1 up, or leave it empty.</p> }
          </div>

          <div class="card st-card">
            <div class="studio-card-head">
              <div class="studio-card-title-group">
                <h3>By folder</h3>
                <span class="pill">{{ d.folders.length }}</span>
              </div>
            </div>
            @if (d.folders.length === 0) {
              <p class="muted">Nothing stored yet.</p>
            } @else {
              <ul class="st-folders">
                @for (f of d.folders; track f.name) {
                  <li>
                    <span class="name mono">{{ f.name }}</span>
                    <span class="bar"><span [style.width.%]="d.summary.usedBytes ? (f.bytes / d.summary.usedBytes) * 100 : 0"></span></span>
                    <span class="size mono">{{ bytes(f.bytes) }}</span>
                    <span class="files muted">{{ f.files }} files</span>
                  </li>
                }
              </ul>
            }
          </div>

          @if (syncAvailable()) {
          <div class="card st-card">
            <div class="studio-card-head">
              <div class="studio-card-title-group"><h3>Sync database</h3></div>
            </div>
            <p class="muted">Keep drive folders, topics, calendar posts and Drive copies the same in MongoDB and SQL Server. Newer topic and post edits win.</p>
            <div class="st-quota">
              <button type="button" (click)="sync('Both')" [disabled]="status.busy()">⇄ Sync both ways</button>
              <button type="button" class="secondary" (click)="sync('MongoToSql')" [disabled]="status.busy()">Mongo → SQL</button>
              <button type="button" class="secondary" (click)="sync('SqlToMongo')" [disabled]="status.busy()">SQL → Mongo</button>
            </div>
            @if (syncReport(); as r) {
              <ul class="st-folders" style="margin-top: 0.75rem">
                @for (x of r.details; track x.name) {
                  <li><span class="name mono">{{ x.name }}</span><span></span><span class="size mono">{{ x.copied }} new, {{ x.updated }} updated</span><span class="files muted">{{ x.skipped }} same</span></li>
                }
              </ul>
            }
          </div>
          }
        </div>
      } @else {
        <div class="card muted" style="display: flex; align-items: center; gap: 0.65rem">
          <span class="spinner"></span> Measuring&hellip;
        </div>
      }
    </section>
  `,
  styles: [`
    .st-meter-row { display: flex; gap: 8px; align-items: baseline; margin-bottom: 10px; }
    .st-meter-row strong { font-size: 1.45rem; font-weight: 800; }
    .st-track { height: 10px; border-radius: 99px; background: var(--surface-2); border: 1px solid var(--border-subtle); overflow: hidden; }
    .st-fill { height: 100%; background: linear-gradient(90deg, var(--brand-dim), var(--brand)); border-radius: 99px; transition: width .3s; }
    .st-meter.warn .st-fill { background: var(--warn); }
    .st-meter.full .st-fill { background: var(--err); }
    .st-sub { font-size: .78rem; margin-top: 8px; }
    .st-grid { display: grid; grid-template-columns: minmax(260px, 1fr) minmax(320px, 2fr); gap: 1.1rem; }
    @media (max-width: 900px) { .st-grid { grid-template-columns: 1fr; } }
    .st-card { margin-bottom: 0; }
    .st-card h3 { margin: 0; font-size: 1rem; }
    .st-card p { font-size: .84rem; margin: 0 0 12px; }
    .st-quota { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
    .st-quota input { width: 120px; }
    .err { color: var(--err); font-size: 0.82rem; margin-top: 0.5rem; }
    .st-folders { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
    .st-folders li { display: grid; grid-template-columns: minmax(90px, 1fr) 2fr auto auto; gap: 12px; align-items: center; font-size: .84rem; }
    .st-folders .bar { height: 7px; border-radius: 99px; background: var(--surface-2); overflow: hidden; }
    .st-folders .bar span { display: block; height: 100%; background: linear-gradient(90deg, var(--brand-dim), var(--brand)); border-radius: 99px; }
    .st-folders .size { font-variant-numeric: tabular-nums; }
    .st-folders .files { font-size: .75rem; }
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
  readonly syncReport = signal<DriveSyncReport | null>(null);
  readonly syncAvailable = signal(false);

  sync(direction: 'MongoToSql' | 'SqlToMongo' | 'Both'): void {
    this.status.run(this.api.syncDriveData(direction), (r) => {
      this.syncReport.set(r);
      this.status.notify([r.message]);
    });
  }

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
    this.api.syncDriveDataAvailable().subscribe({
      next: (ok) => this.syncAvailable.set(ok),
      error: () => this.syncAvailable.set(false),
    });
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
