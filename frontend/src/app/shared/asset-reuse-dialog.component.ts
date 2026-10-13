import { Component, DestroyRef, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Subject, catchError, debounceTime, firstValueFrom, of, switchMap, tap } from 'rxjs';

import { ApiFailure } from '../core/interceptors/api-error.interceptor';
import { AssetSearchHit, AssetSearchScope, BrandChannel, DEFAULT_BRAND_CHANNEL } from '../core/models/api.models';
import { ApiService } from '../core/services/api.service';

type KindFilter = '' | 'video' | 'image' | 'audio' | 'subtitle';

interface SearchRequest { q: string; scope: AssetSearchScope; kind: KindFilter }

/** Typing pauses this long before the search runs, so each keystroke is not a request. */
const SEARCH_DEBOUNCE_MS = 250;

/**
 * Search the user's other projects for files - uploads, downloads, exported cuts - and
 * bring the chosen ones into this project, so something made for an earlier video can be
 * reused without uploading it again. Looks in this project's channel by default; "All
 * channels" widens it, with this channel's files still listed first.
 *
 * Adding copies the file (the server gives this project its own bytes), so deleting it in
 * either project never breaks the other.
 *
 *   @if (reuseOpen()) {
 *     <app-asset-reuse-dialog [projectId]="id" [folderId]="folder" (added)="refresh()" (closed)="..." />
 *   }
 */
@Component({
  selector: 'app-asset-reuse-dialog',
  standalone: true,
  imports: [FormsModule],
  host: { '(document:keydown.escape)': 'onEscape()' },
  template: `
    <div class="ar-backdrop" (click)="close()">
      <div class="ar-dialog" role="dialog" aria-modal="true" aria-label="Reuse from other projects" (click)="$event.stopPropagation()">
        <div class="ar-head">
          <strong>♻️ Reuse from other projects</strong>
          <button type="button" class="ar-x" (click)="close()" title="Close" [disabled]="adding()">✕</button>
        </div>

        <div class="ar-controls">
          <input class="ar-search" type="search" [ngModel]="query()" (ngModelChange)="setQuery($event)"
                 [attr.maxlength]="maxQuery" placeholder="Search by file or project name…" aria-label="Search files" autofocus />
          <div class="ar-seg" role="group" aria-label="Where to search">
            <button type="button" [class.on]="scope() === 'channel'" (click)="setScope('channel')"
                    [title]="'Only projects on ' + channelName(ownChannelId())">This channel</button>
            <button type="button" [class.on]="scope() === 'all'" (click)="setScope('all')"
                    title="Every project - this channel's files still come first">All channels</button>
          </div>
        </div>

        <div class="ar-kinds" role="group" aria-label="File type">
          @for (k of kinds; track k.value) {
            <button type="button" class="ar-chip" [class.on]="kind() === k.value" (click)="setKind(k.value)">{{ k.label }}</button>
          }
          <span class="ar-meta">
            @if (loading()) { Searching… }
            @else if (error()) { <span class="ar-err">{{ error() }}</span> }
            @else {
              {{ hits().length }}{{ truncated() ? '+' : '' }} file{{ hits().length === 1 ? '' : 's' }}
              in {{ projectsSearched() }} project{{ projectsSearched() === 1 ? '' : 's' }}
            }
          </span>
        </div>

        @if (preview(); as p) {
          <div class="ar-preview">
            <div class="ar-preview-media">
              @switch (p.asset.kind) {
                @case ('Video') { <video [src]="api.assetUrl(p.asset.id)" controls autoplay playsinline></video> }
                @case ('Image') { <img [src]="api.assetUrl(p.asset.id)" [alt]="p.asset.name" /> }
                @case ('Audio') { <audio [src]="api.assetUrl(p.asset.id)" controls autoplay></audio> }
                @default { <div class="ar-noprev">No preview for this file type.</div> }
              }
            </div>
            <div class="ar-preview-info">
              <strong [title]="p.asset.name">{{ p.asset.name }}</strong>
              <span>{{ p.projectName }} · {{ channelName(p.channelId) }}</span>
              <span>{{ describe(p) }}</span>
              <div class="ar-preview-actions">
                <button type="button" class="ar-btn" (click)="preview.set(null)">Back to results</button>
                @if (!p.alreadyAdded) {
                  <button type="button" class="ar-btn" (click)="toggle(p)">{{ isSelected(p) ? 'Unselect' : 'Select' }}</button>
                }
              </div>
            </div>
          </div>
        } @else {
          <ul class="ar-grid">
            @for (h of hits(); track h.asset.id) {
              <li class="ar-card" [class.selected]="isSelected(h)" [class.added]="h.alreadyAdded">
                <button type="button" class="ar-thumb" (click)="preview.set(h)" [title]="'Preview ' + h.asset.name">
                  @if (h.asset.kind === 'Video' || h.asset.kind === 'Image') {
                    <img [src]="api.assetThumbnailUrl(h.asset.id)" alt="" loading="lazy" />
                  } @else {
                    <span class="ar-icon">{{ h.asset.kind === 'Audio' ? '🎵' : '💬' }}</span>
                  }
                  @if (h.asset.durationSeconds) { <span class="ar-dur">{{ formatDuration(h.asset.durationSeconds) }}</span> }
                  <span class="ar-play">▶</span>
                </button>
                <div class="ar-body">
                  <span class="ar-name" [title]="h.asset.name">{{ h.asset.name }}</span>
                  <span class="ar-proj" [title]="h.projectName">{{ h.projectName }}</span>
                  <span class="ar-tags">
                    @if (!h.sameChannel) { <span class="ar-tag other">{{ channelName(h.channelId) }}</span> }
                    @if (h.isExport) { <span class="ar-tag">Export</span> }
                    @if (needsReview(h)) { <span class="ar-tag warn" title="Must be approved before it can be rendered">Review</span> }
                  </span>
                </div>
                @if (h.alreadyAdded) {
                  <span class="ar-added">✓ Added</span>
                } @else {
                  <label class="ar-pick" [title]="isSelected(h) ? 'Unselect' : 'Select to add'">
                    <input type="checkbox" [checked]="isSelected(h)" (change)="toggle(h)" />
                  </label>
                }
              </li>
            } @empty {
              @if (!loading() && !error()) {
                <li class="ar-empty">
                  Nothing found{{ query() ? ' for "' + query() + '"' : '' }}.
                  @if (scope() === 'channel') {
                    <button type="button" class="ar-link" (click)="setScope('all')">Search all channels</button>
                  }
                </li>
              }
            }
          </ul>
          @if (truncated()) { <p class="ar-note">Showing the best {{ hits().length }} - type more to narrow it down.</p> }
        }

        @if (addError()) { <p class="ar-err">{{ addError() }}</p> }

        <div class="ar-foot">
          <span class="ar-note">A copy is added, so deleting it in either project never affects the other.</span>
          <button type="button" class="ar-btn" (click)="close()" [disabled]="adding()">Close</button>
          <button type="button" class="ar-btn primary" [disabled]="selected().size === 0 || adding()" (click)="add()">
            {{ adding() ? 'Adding…' : 'Add ' + selected().size + ' to project' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ar-backdrop { position: fixed; inset: 0; z-index: 2000; background: rgba(2, 6, 23, .7);
      display: flex; align-items: center; justify-content: center; padding: 16px; }
    .ar-dialog { width: min(860px, 100%); max-height: 90vh; display: flex; flex-direction: column; gap: 10px;
      background: #0f1420; color: #e2e8f0; border: 1px solid #263044; border-radius: 10px; padding: 14px 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,.6); }
    .ar-head { display: flex; align-items: center; justify-content: space-between; }
    .ar-x { background: none; border: 0; color: #94a3b8; font-size: 1rem; cursor: pointer; }
    .ar-controls { display: flex; gap: 8px; flex-wrap: wrap; }
    .ar-search { flex: 1 1 240px; min-width: 0; background: #0b1020; color: #e2e8f0; border: 1px solid #334155;
      border-radius: 6px; padding: 6px 10px; font-size: .85rem; }
    .ar-seg { display: inline-flex; border: 1px solid #334155; border-radius: 6px; overflow: hidden; }
    .ar-seg button { background: #0b1020; color: #94a3b8; border: 0; padding: 5px 12px; font-size: .78rem; cursor: pointer; }
    .ar-seg button.on { background: #4f46e5; color: #fff; }
    .ar-kinds { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
    .ar-chip { background: #111827; color: #94a3b8; border: 1px solid #263044; border-radius: 999px;
      padding: 2px 10px; font-size: .72rem; cursor: pointer; }
    .ar-chip.on { color: #e2e8f0; border-color: #6366f1; background: #1e1b4b; }
    .ar-meta { margin-left: auto; font-size: .72rem; color: #94a3b8; }
    .ar-grid { list-style: none; margin: 0; padding: 0; overflow: auto; min-height: 160px; max-height: 55vh;
      display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 8px; align-content: start; }
    .ar-card { position: relative; display: flex; flex-direction: column; background: #111827;
      border: 1px solid #1f2937; border-radius: 8px; overflow: hidden; }
    .ar-card.selected { border-color: #6366f1; box-shadow: 0 0 0 1px #6366f1; }
    .ar-card.added { opacity: .65; }
    .ar-thumb { position: relative; aspect-ratio: 16 / 9; background: #0b1020; border: 0; padding: 0; cursor: pointer;
      display: flex; align-items: center; justify-content: center; }
    .ar-thumb img { width: 100%; height: 100%; object-fit: cover; }
    .ar-icon { font-size: 1.8rem; }
    .ar-play { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
      font-size: 1.4rem; color: #fff; background: rgba(0,0,0,.35); opacity: 0; transition: opacity .15s; }
    .ar-thumb:hover .ar-play, .ar-thumb:focus-visible .ar-play { opacity: 1; }
    .ar-dur { position: absolute; right: 4px; bottom: 4px; background: rgba(0,0,0,.75); color: #fff;
      font: .65rem ui-monospace, monospace; padding: 1px 4px; border-radius: 3px; }
    .ar-body { display: flex; flex-direction: column; gap: 2px; padding: 6px 8px 8px; min-width: 0; }
    .ar-name { font-size: .78rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .ar-proj { font-size: .68rem; color: #94a3b8; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .ar-tags { display: flex; gap: 4px; flex-wrap: wrap; }
    .ar-tag { font-size: .62rem; padding: 0 5px; border-radius: 3px; background: #1e293b; color: #cbd5e1; }
    .ar-tag.other { background: #172554; color: #93c5fd; }
    .ar-tag.warn { background: #422006; color: #fbbf24; }
    .ar-pick { position: absolute; top: 6px; left: 6px; background: rgba(0,0,0,.6); border-radius: 4px;
      padding: 2px 4px; display: flex; cursor: pointer; }
    .ar-added { position: absolute; top: 6px; left: 6px; background: #14532d; color: #bbf7d0;
      font-size: .65rem; padding: 1px 6px; border-radius: 4px; }
    .ar-empty { grid-column: 1 / -1; text-align: center; color: #94a3b8; font-size: .8rem; padding: 28px 0; }
    .ar-link { background: none; border: 0; color: #a5b4fc; cursor: pointer; text-decoration: underline; font-size: .8rem; }
    .ar-preview { display: grid; grid-template-columns: minmax(0, 2fr) minmax(0, 1fr); gap: 12px; min-height: 220px; }
    @media (max-width: 640px) { .ar-preview { grid-template-columns: 1fr; } }
    .ar-preview-media { background: #000; border-radius: 8px; display: flex; align-items: center; justify-content: center;
      overflow: hidden; max-height: 55vh; }
    .ar-preview-media video, .ar-preview-media img { max-width: 100%; max-height: 55vh; }
    .ar-preview-media audio { width: 90%; }
    .ar-noprev { color: #94a3b8; font-size: .8rem; padding: 40px; }
    .ar-preview-info { display: flex; flex-direction: column; gap: 6px; font-size: .78rem; color: #94a3b8; min-width: 0; }
    .ar-preview-info strong { color: #e2e8f0; font-size: .9rem; overflow-wrap: anywhere; }
    .ar-preview-actions { display: flex; gap: 6px; flex-wrap: wrap; margin-top: auto; }
    .ar-foot { display: flex; align-items: center; justify-content: flex-end; gap: 8px; flex-wrap: wrap; }
    .ar-foot .ar-note { margin-right: auto; }
    .ar-note { font-size: .7rem; color: #94a3b8; margin: 0; }
    .ar-err { color: #f87171; font-size: .75rem; margin: 0; }
    .ar-btn { background: #1e293b; color: #e2e8f0; border: 1px solid #334155; border-radius: 6px;
      padding: 5px 12px; font-size: .8rem; cursor: pointer; }
    .ar-btn.primary { background: #4f46e5; border-color: #6366f1; }
    .ar-btn:disabled { opacity: .5; cursor: not-allowed; }
  `],
})
export class AssetReuseDialogComponent implements OnInit {
  readonly api = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly projectId = input.required<string>();
  /** This project's channel, for the "This channel" label. Null means the default channel. */
  readonly channelId = input<string | null | undefined>(null);
  /** A folder of this project to put the added files in; null or a virtual folder leaves them at the root. */
  readonly folderId = input<string | null>(null);
  /** Pre-selects a file type, e.g. 'video' when opened from a video timeline. */
  readonly initialKind = input<KindFilter>('');

  /** Ids of the files now in this project, once some were added. */
  readonly added = output<string[]>();
  readonly closed = output<void>();

  readonly maxQuery = 100;
  readonly kinds: { value: KindFilter; label: string }[] = [
    { value: '', label: 'All' },
    { value: 'video', label: '🎬 Videos' },
    { value: 'image', label: '🖼 Images' },
    { value: 'audio', label: '🎵 Audio' },
    { value: 'subtitle', label: '💬 Subtitles' },
  ];

  readonly query = signal('');
  readonly scope = signal<AssetSearchScope>('channel');
  readonly kind = signal<KindFilter>('');

  readonly hits = signal<AssetSearchHit[]>([]);
  readonly projectsSearched = signal(0);
  readonly truncated = signal(false);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly preview = signal<AssetSearchHit | null>(null);
  /** Selected hits by asset id; kept across searches so a pick survives refining the query. */
  readonly selected = signal(new Map<string, AssetSearchHit>());
  readonly adding = signal(false);
  readonly addError = signal<string | null>(null);

  private readonly channels = signal<BrandChannel[]>([]);
  readonly ownChannelId = computed(() => this.channelId() || DEFAULT_BRAND_CHANNEL);

  private readonly searches = new Subject<SearchRequest>();

  constructor() {
    this.searches.pipe(
      debounceTime(SEARCH_DEBOUNCE_MS),
      tap(() => { this.loading.set(true); this.error.set(null); }),
      switchMap((r) => this.api.searchReusableAssets(this.projectId(), {
        q: r.q || undefined, scope: r.scope, kind: r.kind || undefined,
      }).pipe(catchError((err: unknown) => {
        this.error.set(err instanceof ApiFailure && err.message ? err.message : 'Search failed.');
        return of(null);
      }))),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((result) => {
      this.loading.set(false);
      if (!result) { this.hits.set([]); return; }
      this.hits.set(result.items);
      this.projectsSearched.set(result.projectsSearched);
      this.truncated.set(result.truncated);
    });
  }

  ngOnInit(): void {
    this.kind.set(this.initialKind());
    this.api.listBrandChannels().pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (c) => this.channels.set(c), error: () => this.channels.set([]) });
    this.search();
  }

  setQuery(value: string): void {
    this.query.set((value ?? '').slice(0, this.maxQuery));
    this.search();
  }

  setScope(scope: AssetSearchScope): void {
    if (this.scope() === scope) return;
    this.scope.set(scope);
    this.search();
  }

  setKind(kind: KindFilter): void {
    if (this.kind() === kind) return;
    this.kind.set(kind);
    this.search();
  }

  isSelected(h: AssetSearchHit): boolean {
    return this.selected().has(h.asset.id);
  }

  toggle(h: AssetSearchHit): void {
    if (h.alreadyAdded) return;
    this.selected.update((current) => {
      const next = new Map(current);
      if (next.has(h.asset.id)) next.delete(h.asset.id); else next.set(h.asset.id, h);
      return next;
    });
  }

  channelName(id: string): string {
    const channel = this.channels().find((c) => c.id === id) ?? (id === DEFAULT_BRAND_CHANNEL ? this.channels().find((c) => c.isDefault) : undefined);
    return channel?.name ?? (id === DEFAULT_BRAND_CHANNEL ? 'Default channel' : 'Another channel');
  }

  needsReview(h: AssetSearchHit): boolean {
    return h.asset.reviewStatus !== 'NotRequired' && h.asset.reviewStatus !== 'Approved';
  }

  describe(h: AssetSearchHit): string {
    const a = h.asset;
    const parts: string[] = [a.kind];
    if (a.width && a.height) parts.push(`${a.width}×${a.height}`);
    if (a.durationSeconds) parts.push(this.formatDuration(a.durationSeconds));
    parts.push(`${(a.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB`);
    if (h.isExport) parts.push('exported cut');
    return parts.join(' · ');
  }

  formatDuration(seconds: number): string {
    const s = Math.round(seconds);
    const m = Math.floor(s / 60);
    return `${m}:${String(s % 60).padStart(2, '0')}`;
  }

  /**
   * Copies the selection in, one request per source project (the copy endpoint takes one
   * source at a time), then files the copies into the chosen folder.
   */
  async add(): Promise<void> {
    const picks = [...this.selected().values()];
    if (picks.length === 0 || this.adding()) return;
    this.adding.set(true);
    this.addError.set(null);

    const bySource = new Map<string, string[]>();
    for (const h of picks) bySource.set(h.projectId, [...(bySource.get(h.projectId) ?? []), h.asset.id]);

    const addedIds: string[] = [];
    const copiedSources = new Set<string>();
    let failed = 0;

    for (const [sourceProjectId, ids] of bySource) {
      try {
        const mapping = await firstValueFrom(this.api.copyAssetsFromProject(this.projectId(), sourceProjectId, ids));
        for (const id of ids) {
          if (mapping[id]) { addedIds.push(mapping[id]); copiedSources.add(id); } else failed++;
        }
      } catch {
        failed += ids.length;
      }
    }

    // The files are in the project either way; a failed move only leaves one at the root.
    let unfiled = 0;
    const folder = this.folderId();
    if (folder) {
      for (const id of addedIds) {
        try { await firstValueFrom(this.api.moveAssetToFolder(this.projectId(), id, folder)); }
        catch { unfiled++; }
      }
    }

    this.hits.update((list) => list.map((h) => (copiedSources.has(h.asset.id) ? { ...h, alreadyAdded: true } : h)));
    this.selected.update((current) => {
      const next = new Map(current);
      for (const id of copiedSources) next.delete(id);
      return next;
    });
    const problems: string[] = [];
    if (failed > 0) problems.push(`${failed} file${failed === 1 ? '' : 's'} could not be added.`);
    if (unfiled > 0) problems.push(`${unfiled} added file${unfiled === 1 ? ' was' : 's were'} left at the library root.`);
    this.addError.set(problems.length > 0 ? problems.join(' ') : null);
    this.adding.set(false);
    if (addedIds.length > 0) this.added.emit(addedIds);
  }

  onEscape(): void {
    if (this.preview()) this.preview.set(null); else this.close();
  }

  close(): void {
    if (this.adding()) return;
    this.closed.emit();
  }

  private search(): void {
    this.searches.next({ q: this.query().trim(), scope: this.scope(), kind: this.kind() });
  }
}
