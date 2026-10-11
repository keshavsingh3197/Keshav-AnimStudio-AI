import { Component, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { ApiFailure } from '../core/interceptors/api-error.interceptor';
import {
  AssetFolder, EDIT_FORMATS, EditFormat, ProjectEdit, editNamePrefix, nextEditNumber,
} from '../core/models/api.models';
import { ActivityService } from '../core/services/activity.service';
import { ApiService } from '../core/services/api.service';
import { MediaToolsService } from '../core/services/media-tools.service';

/** Most links one batch takes; each is a full yt-dlp download. */
export const MAX_URL_IMPORT = 50;

/** Folder choice meaning "a folder per website", decided by the server from each link. */
export const FOLDER_BY_SOURCE = '__by-source__';

/** Downloads run two at a time: enough to overlap the waits, few enough not to starve the server. */
const PARALLEL_DOWNLOADS = 2;

type RowState = 'queued' | 'downloading' | 'done' | 'failed' | 'skipped';

interface ImportRow {
  url: string;
  state: RowState;
  message?: string;
  /** What the link became in the library - a video asset only. */
  assetId?: string;
  title?: string;
}

/** A video made from the imported links, listed so each one can be told apart and opened. */
interface MadeVideo {
  /** The links' order numbers (#1, #2...) it was made from. */
  orders: number[];
  edit?: ProjectEdit;
  error?: string;
}

/** Room left for the title after "Short 14 – " inside the 120-character name limit. */
const MAX_TITLE_IN_NAME = 80;

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
  imports: [FormsModule, RouterLink],
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
                <option [value]="bySource">📂 Sort by website (YouTube, Instagram…)</option>
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
                <span class="ui-order" title="Order in the list of links">#{{ $index + 1 }}</span>
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

          @if (!running() && importedVideos().length > 0 && !madeAny()) {
            <div class="ui-make">
              <strong>🎬 Make videos from the {{ importedVideos().length }} imported video{{ importedVideos().length === 1 ? '' : 's' }}</strong>
              <p class="ui-note">
                They join this project's videos (the switcher at the top), numbered in the order of the links above.
              </p>
              <div class="ui-make-row">
                <label>
                  <span>Format</span>
                  <select [ngModel]="makeFormat()" (ngModelChange)="makeFormat.set($event)" [disabled]="making()">
                    @for (f of formats; track f.value) { <option [value]="f.value">{{ f.label }} ({{ f.ratio }})</option> }
                  </select>
                </label>
                <button type="button" class="ui-btn primary" (click)="makeVideos('each')" [disabled]="making()"
                        [title]="'One ' + makeLabel() + ' per link, each named after its video'">
                  One {{ makeLabel() }} per video ({{ importedVideos().length }})
                </button>
                @if (importedVideos().length > 1) {
                  <button type="button" class="ui-btn" (click)="makeVideos('all')" [disabled]="making()"
                          [title]="'One ' + makeLabel() + ' with every video, in link order'">
                    All in one {{ makeLabel() }}
                  </button>
                }
              </div>
            </div>
          }

          @if (made().length > 0) {
            <div class="ui-make">
              <strong>{{ making() ? 'Creating…' : 'Created in this project' }}</strong>
              <ul class="ui-rows">
                @for (m of made(); track $index) {
                  <li class="ui-row" [class.failed]="!!m.error">
                    <span class="ui-order">{{ orderLabel(m.orders) }}</span>
                    <span class="ui-state">{{ m.edit ? '✓' : m.error ? '✕' : '⏳' }}</span>
                    @if (m.edit; as e) {
                      <a class="ui-url ui-link" [routerLink]="['/projects', projectId(), 'clips']" [queryParams]="{ edit: e.id }"
                         (click)="close()" [title]="'Open ' + e.name">#{{ e.number }} · {{ e.name }}</a>
                    } @else {
                      <span class="ui-url">{{ m.error ?? '…' }}</span>
                    }
                  </li>
                }
              </ul>
            </div>
          }

          <div class="ui-foot">
            @if (running()) {
              <button type="button" class="ui-btn" (click)="cancel()">Stop after current</button>
            } @else {
              @if (failedCount() > 0) {
                <button type="button" class="ui-btn" (click)="retryFailed()">Retry {{ failedCount() }} failed</button>
              }
              <button type="button" class="ui-btn primary" (click)="close()" [disabled]="making()">Done</button>
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
    .ui-row { display: grid; grid-template-columns: auto 20px minmax(0, 1fr) auto; gap: 6px; align-items: center;
      font-size: .75rem; padding: 4px 6px; border-radius: 5px; background: #111827; }
    .ui-row.done .ui-state { color: #22c55e; }
    .ui-row.failed .ui-state, .ui-row.failed .ui-msg { color: #f87171; }
    .ui-row.downloading { background: #1e1b4b; }
    .ui-url { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .ui-order { font: .7rem ui-monospace, monospace; color: #a5b4fc; min-width: 22px; }
    .ui-link { color: #a5b4fc; text-decoration: none; }
    .ui-link:hover { text-decoration: underline; }
    .ui-make { display: flex; flex-direction: column; gap: 6px; border: 1px solid #263044; border-radius: 8px;
      padding: 8px 10px; background: #0b1020; font-size: .8rem; }
    .ui-make-row { display: flex; flex-wrap: wrap; gap: 8px; align-items: flex-end; }
    .ui-make-row label { display: flex; flex-direction: column; gap: 3px; font-size: .72rem; color: #94a3b8; }
    .ui-make-row select { background: #0b1020; color: #e2e8f0; border: 1px solid #334155; border-radius: 5px; padding: 4px 6px; }
    .ui-msg { max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #94a3b8; }
  `],
})
export class UrlImportDialogComponent {
  private readonly media = inject(MediaToolsService);
  private readonly activity = inject(ActivityService);
  private readonly api = inject(ApiService);

  readonly projectId = input.required<string>();
  readonly folders = input<AssetFolder[]>([]);
  /** The folder picked when the dialog opens, e.g. the one the library is showing. */
  readonly initialFolderId = input<string | null>(null);

  /** After every link that lands, so the library can show it straight away. */
  readonly imported = output<void>();
  readonly closed = output<void>();
  /** After videos or Shorts were made from the imported links. */
  readonly editsCreated = output<ProjectEdit[]>();

  readonly max = MAX_URL_IMPORT;
  readonly bySource = FOLDER_BY_SOURCE;
  readonly resolutions = ['best', '1080p', '720p', '480p'];

  readonly text = signal('');
  readonly kind = signal<'video' | 'audio'>('video');
  readonly resolution = signal('1080p');
  /** Sorting by website is the default; opening from inside a folder picks that folder instead. */
  readonly folderId = signal<string>(FOLDER_BY_SOURCE);
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

  // --- making videos / Shorts from what was imported
  readonly formats = EDIT_FORMATS;
  readonly makeFormat = signal<EditFormat>('Short');
  readonly making = signal(false);
  readonly made = signal<MadeVideo[]>([]);
  readonly madeAny = computed(() => this.made().some((m) => !!m.edit));

  /** Imported videos with their link order (1-based), in the order the links were pasted. */
  readonly importedVideos = computed(() =>
    this.rows().flatMap((r, i) => (r.assetId ? [{ order: i + 1, assetId: r.assetId, title: r.title }] : [])));

  makeLabel(): string {
    return this.makeFormat() === 'Short' ? 'Short' : this.makeFormat() === 'Square' ? 'square video' : 'video';
  }

  orderLabel(orders: number[]): string {
    return orders.length === 1 ? `#${orders[0]}` : `#${orders[0]}–${orders[orders.length - 1]}`;
  }

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
    if (this.running() || this.making()) return;
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
          const url = this.rows()[i].url;
          const res = await firstValueFrom(this.activity.trackRequest('download', url, () => this.media.downloadMedia({
            url,
            format: this.kind() === 'audio' ? 'mp3' : 'mp4',
            resolution: this.kind() === 'audio' ? undefined : this.resolution(),
            audioBitrate: this.kind() === 'audio' ? '192k' : undefined,
            projectId: this.projectId(),
            importAsAsset: true,
            folderId: this.folderId() && this.folderId() !== FOLDER_BY_SOURCE ? this.folderId() : undefined,
            folderBySource: this.folderId() === FOLDER_BY_SOURCE,
            addToClipOrder: this.kind() === 'video' && this.addToCut(),
          })));
          this.setRow(i, {
            state: 'done',
            message: res.folderName ? `${res.folderName} / ${res.fileName}` : res.fileName,
            assetId: res.isAudioOnly ? undefined : res.assetId,
            title: res.assetName,
          });
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

  /**
   * Creates the videos one after another, in link order, so their numbers and names follow
   * the list: "each" makes one per imported video named after it, "all" one with every
   * video. Names continue the project's "Short N" numbering, so none repeats.
   */
  async makeVideos(mode: 'each' | 'all'): Promise<void> {
    const videos = this.importedVideos();
    if (videos.length === 0 || this.making()) return;
    this.making.set(true);
    const format = this.makeFormat();
    const groups = mode === 'each' ? videos.map((v) => [v]) : [videos];
    this.made.set(groups.map((g) => ({ orders: g.map((v) => v.order) })));
    const created: ProjectEdit[] = [];

    try {
      const existing = await firstValueFrom(this.api.listEdits(this.projectId()));
      for (let k = 0; k < groups.length; k++) {
        const group = groups[k];
        const n = nextEditNumber(format, [...existing, ...created]);
        const title = group.length === 1 ? this.cleanTitle(group[0].title) : '';
        const name = title ? `${editNamePrefix(format)} ${n} – ${title}` : `${editNamePrefix(format)} ${n}`;
        try {
          const edit = await firstValueFrom(this.api.createEdit(this.projectId(), {
            name,
            format,
            category: format === 'Short' ? 'Short' : null,
            mode: 'Blank',
            initialAssetIds: group.map((v) => v.assetId),
          }));
          created.push(edit);
          this.setMade(k, { edit });
        } catch (err: unknown) {
          this.setMade(k, { error: err instanceof ApiFailure && err.message ? err.message : 'Could not create it.' });
        }
      }
    } catch {
      this.made.update((list) => list.map((m) => (m.edit ? m : { ...m, error: "Could not read this project's videos." })));
    } finally {
      this.making.set(false);
      if (created.length > 0) this.editsCreated.emit(created);
    }
  }

  /** A title short enough to sit in a name, on one line. */
  private cleanTitle(title: string | undefined): string {
    const flat = (title ?? '').replace(/\s+/g, ' ').trim();
    return flat.length <= MAX_TITLE_IN_NAME ? flat : `${flat.slice(0, MAX_TITLE_IN_NAME - 1).trimEnd()}…`;
  }

  private setMade(index: number, patch: Partial<MadeVideo>): void {
    this.made.update((list) => list.map((m, k) => (k === index ? { ...m, ...patch } : m)));
  }

  private setRow(index: number, patch: Partial<ImportRow>): void {
    this.rows.update((rows) => rows.map((r, k) => (k === index ? { ...r, ...patch } : r)));
  }
}
