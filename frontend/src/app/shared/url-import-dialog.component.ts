import { Component, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { ApiFailure } from '../core/interceptors/api-error.interceptor';
import { AssetFolder } from '../core/models/api.models';
import { MediaToolsService } from '../core/services/media-tools.service';

/** Most links one batch takes; each is a full yt-dlp download. */
export const MAX_URL_IMPORT = 50;

/** Downloads run two at a time: enough to overlap the waits, few enough not to starve the server. */
const PARALLEL_DOWNLOADS = 2;

type RowState = 'queued' | 'downloading' | 'done' | 'failed' | 'skipped';

interface ImportRow {
  url: string;
  state: RowState;
  message?: string;
}

/**
 * Paste any number of links and get every one of them in the project's media library -
 * straight from the library, without a round trip through Media Studio. Each link goes
 * through the same server download (and the same URL checks) as Media Studio's, one
 * request per link, so a bad link fails alone and the rest still arrive.
 *
 *   @if (urlImportOpen()) {
 *     <app-url-import-dialog [projectId]="id" [folders]="folders" (imported)="refresh()" (closed)="..." />
 *   }
 */
@Component({
  selector: 'app-url-import-dialog',
  standalone: true,
  imports: [FormsModule],
  host: { '(document:keydown.escape)': 'close()' },
  template: `
    <div class="ui-backdrop" (click)="close()">
      <div class="ui-dialog" role="dialog" aria-modal="true" aria-label="Import from links" (click)="$event.stopPropagation()">
        <div class="ui-head">
          <strong>🔗 Import from links</strong>
          <button type="button" class="ui-x" (click)="close()" title="Close" [disabled]="running()">✕</button>
        </div>

        @if (rows().length === 0) {
          <textarea class="ui-text" rows="7" [ngModel]="text()" (ngModelChange)="text.set($event)"
                    placeholder="Paste one link per line (YouTube, Instagram, X, Facebook, direct .mp4 …)"
                    aria-label="Links, one per line"></textarea>
          <div class="ui-hint">
            {{ parsed().length }} link{{ parsed().length === 1 ? '' : 's' }} found
            @if (parsed().length > max) { · only the first {{ max }} are imported }
            @if (duplicates() > 0) { · {{ duplicates() }} duplicate{{ duplicates() === 1 ? '' : 's' }} skipped }
          </div>

          <div class="ui-grid">
            <label>
              <span>Save as</span>
              <select [ngModel]="kind()" (ngModelChange)="kind.set($event)">
                <option value="video">Video (MP4)</option>
                <option value="audio">Audio only (MP3)</option>
              </select>
            </label>
            @if (kind() === 'video') {
              <label>
                <span>Quality</span>
                <select [ngModel]="resolution()" (ngModelChange)="resolution.set($event)">
                  @for (r of resolutions; track r) { <option [value]="r">{{ r === 'best' ? 'Best available' : r }}</option> }
                </select>
              </label>
            }
            <label>
              <span>Folder</span>
              <select [ngModel]="folderId()" (ngModelChange)="folderId.set($event)">
                <option value="">Library root</option>
                @for (f of folders(); track f.id) { <option [value]="f.id">{{ f.name }}</option> }
              </select>
            </label>
          </div>
          @if (kind() === 'video') {
            <label class="ui-check">
              <input type="checkbox" [ngModel]="addToCut()" (ngModelChange)="addToCut.set($event)" />
              Also add the videos to the Clip Studio cut, in this order
            </label>
          }
          <p class="ui-note">Only import media you own or are licensed to use.</p>
          <div class="ui-foot">
            <button type="button" class="ui-btn" (click)="close()">Cancel</button>
            <button type="button" class="ui-btn primary" [disabled]="parsed().length === 0" (click)="start()">
              Import {{ toImport().length }} link{{ toImport().length === 1 ? '' : 's' }}
            </button>
          </div>
        } @else {
          <div class="ui-progress">
            <div class="ui-bar"><span [style.width.%]="progress()"></span></div>
            <span>{{ finished() }} / {{ rows().length }}</span>
          </div>
          <ul class="ui-rows">
            @for (r of rows(); track $index) {
              <li [class]="'ui-row ' + r.state">
                <span class="ui-state">
                  @switch (r.state) {
                    @case ('queued') { ⋯ }
                    @case ('downloading') { ⏳ }
                    @case ('done') { ✓ }
                    @case ('failed') { ✕ }
                    @case ('skipped') { – }
                  }
                </span>
                <span class="ui-url" [title]="r.url">{{ r.url }}</span>
                @if (r.message) { <span class="ui-msg" [title]="r.message">{{ r.message }}</span> }
              </li>
            }
          </ul>
          <div class="ui-foot">
            @if (running()) {
              <button type="button" class="ui-btn" (click)="cancel()">Stop after current</button>
            } @else {
              @if (failedCount() > 0) {
                <button type="button" class="ui-btn" (click)="retryFailed()">Retry {{ failedCount() }} failed</button>
              }
              <button type="button" class="ui-btn primary" (click)="close()">Done</button>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .ui-backdrop { position: fixed; inset: 0; z-index: 2000; background: rgba(2, 6, 23, .7);
      display: flex; align-items: center; justify-content: center; padding: 16px; }
    .ui-dialog { width: min(620px, 100%); max-height: 90vh; display: flex; flex-direction: column; gap: 10px;
      background: #0f1420; color: #e2e8f0; border: 1px solid #263044; border-radius: 10px; padding: 14px 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,.6); }
    .ui-head { display: flex; align-items: center; justify-content: space-between; }
    .ui-x { background: none; border: 0; color: #94a3b8; font-size: 1rem; cursor: pointer; }
    .ui-text { width: 100%; resize: vertical; background: #0b1020; color: #e2e8f0; border: 1px solid #334155;
      border-radius: 6px; padding: 8px; font: 0.8rem/1.5 ui-monospace, monospace; }
    .ui-hint, .ui-note { font-size: .72rem; color: #94a3b8; margin: 0; }
    .ui-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 8px; }
    .ui-grid label { display: flex; flex-direction: column; gap: 3px; font-size: .72rem; color: #94a3b8; }
    .ui-grid select { background: #0b1020; color: #e2e8f0; border: 1px solid #334155; border-radius: 5px; padding: 4px 6px; }
    .ui-check { display: flex; gap: 6px; align-items: center; font-size: .78rem; }
    .ui-foot { display: flex; justify-content: flex-end; gap: 8px; }
    .ui-btn { background: #1e293b; color: #e2e8f0; border: 1px solid #334155; border-radius: 6px;
      padding: 5px 12px; font-size: .8rem; cursor: pointer; }
    .ui-btn.primary { background: #4f46e5; border-color: #6366f1; }
    .ui-btn:disabled { opacity: .5; cursor: not-allowed; }
    .ui-progress { display: flex; align-items: center; gap: 10px; font-size: .75rem; color: #94a3b8; }
    .ui-bar { flex: 1; height: 6px; background: #1e293b; border-radius: 3px; overflow: hidden; }
    .ui-bar span { display: block; height: 100%; background: #6366f1; transition: width .3s; }
    .ui-rows { list-style: none; margin: 0; padding: 0; overflow: auto; max-height: 50vh;
      display: flex; flex-direction: column; gap: 3px; }
    .ui-row { display: grid; grid-template-columns: 20px minmax(0, 1fr) auto; gap: 6px; align-items: center;
      font-size: .75rem; padding: 4px 6px; border-radius: 5px; background: #111827; }
    .ui-row.done .ui-state { color: #22c55e; }
    .ui-row.failed .ui-state, .ui-row.failed .ui-msg { color: #f87171; }
    .ui-row.downloading { background: #1e1b4b; }
    .ui-url { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .ui-msg { max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #94a3b8; }
  `],
})
export class UrlImportDialogComponent {
  private readonly media = inject(MediaToolsService);

  readonly projectId = input.required<string>();
  readonly folders = input<AssetFolder[]>([]);
  /** The folder picked when the dialog opens, e.g. the one the library is showing. */
  readonly initialFolderId = input<string | null>(null);

  /** After every link that lands, so the library can show it straight away. */
  readonly imported = output<void>();
  readonly closed = output<void>();

  readonly max = MAX_URL_IMPORT;
  readonly resolutions = ['best', '1080p', '720p', '480p'];

  readonly text = signal('');
  readonly kind = signal<'video' | 'audio'>('video');
  readonly resolution = signal('1080p');
  readonly folderId = signal('');
  readonly addToCut = signal(false);
  readonly rows = signal<ImportRow[]>([]);
  readonly running = signal(false);
  private stopRequested = false;

  /** Every http(s) link in the text, one per line or separated by spaces and commas. */
  readonly parsed = computed(() =>
    this.text().split(/[\s,]+/).map((s) => s.trim()).filter((s) => /^https?:\/\/\S+$/i.test(s)));

  readonly toImport = computed(() => [...new Set(this.parsed())].slice(0, MAX_URL_IMPORT));
  readonly duplicates = computed(() => this.parsed().length - new Set(this.parsed()).size);

  readonly finished = computed(() => this.rows().filter((r) => r.state !== 'queued' && r.state !== 'downloading').length);
  readonly failedCount = computed(() => this.rows().filter((r) => r.state === 'failed').length);
  readonly progress = computed(() => (this.rows().length ? (this.finished() / this.rows().length) * 100 : 0));

  ngOnInit(): void {
    const initial = this.initialFolderId();
    if (initial && this.folders().some((f) => f.id === initial)) this.folderId.set(initial);
  }

  start(): void {
    const urls = this.toImport();
    if (urls.length === 0) return;
    this.rows.set(urls.map((url) => ({ url, state: 'queued' })));
    void this.run();
  }

  retryFailed(): void {
    this.rows.update((rows) => rows.map((r) => (r.state === 'failed' ? { url: r.url, state: 'queued' } : r)));
    void this.run();
  }

  cancel(): void {
    this.stopRequested = true;
  }

  close(): void {
    if (this.running()) return;
    this.closed.emit();
  }

  /**
   * Works through the queue a couple of links at a time. Adding to the cut is done in
   * order, so it runs one at a time - parallel downloads would append in finishing order.
   */
  private async run(): Promise<void> {
    this.running.set(true);
    this.stopRequested = false;
    const lanes = this.addToCut() && this.kind() === 'video' ? 1 : PARALLEL_DOWNLOADS;
    const next = (): number => this.rows().findIndex((r) => r.state === 'queued');

    const lane = async () => {
      for (let i = next(); i >= 0 && !this.stopRequested; i = next()) {
        this.setRow(i, { state: 'downloading', message: undefined });
        try {
          const res = await firstValueFrom(this.media.downloadMedia({
            url: this.rows()[i].url,
            format: this.kind() === 'audio' ? 'mp3' : 'mp4',
            resolution: this.kind() === 'audio' ? undefined : this.resolution(),
            audioBitrate: this.kind() === 'audio' ? '192k' : undefined,
            projectId: this.projectId(),
            importAsAsset: true,
            folderId: this.folderId() || undefined,
            addToClipOrder: this.kind() === 'video' && this.addToCut(),
          }));
          this.setRow(i, { state: 'done', message: res.fileName });
          this.imported.emit();
        } catch (err: unknown) {
          const message = err instanceof ApiFailure ? err.message || 'Download failed.' : 'Download failed.';
          this.setRow(i, { state: 'failed', message });
        }
      }
    };

    await Promise.all(Array.from({ length: lanes }, lane));
    if (this.stopRequested) {
      this.rows.update((rows) => rows.map((r) => (r.state === 'queued' ? { ...r, state: 'skipped' as RowState, message: 'Stopped' } : r)));
    }
    this.running.set(false);
  }

  private setRow(index: number, patch: Partial<ImportRow>): void {
    this.rows.update((rows) => rows.map((r, k) => (k === index ? { ...r, ...patch } : r)));
  }
}
