import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { BrandChannel, BrandChannelSyncResult, DEFAULT_BRAND_CHANNEL } from '../../core/models/api.models';
import { LiveStreamKeyStatus, LiveStreamSetup } from '../../core/models/live-stream.models';
import { ApiService } from '../../core/services/api.service';
import { LiveStreamService } from '../../core/services/live-stream.service';
import { YouTubePublishService } from '../../core/services/youtube-publish.service';
import { YouTubePublishStatus } from '../../core/models/youtube.models';
import { StatusService } from '../../core/services/status.service';

type Filter = 'all' | 'youtube' | 'not-youtube' | 'logo' | 'text' | 'no-watermark' | 'no-end-card' | 'unused' | 'key-refused';
type Sort = 'name' | 'projects' | 'recent';

const PAGE_SIZE = 25;
/** Mirrors BrandChannel.MaxChannels on the server. */
const MAX_CHANNELS = 1000;

/**
 * Every brand channel in one place: find, add, rename, duplicate and remove them.
 * <p>
 * Built for hundreds of channels, not three: search and filters narrow the list, it is
 * paged, and each row loads only its own logo. Editing a channel's look happens on the
 * Watermark and End card pages - each row links straight to its channel there.
 * </p>
 */
@Component({
  selector: 'app-admin-channels',
  imports: [RouterLink, DatePipe],
  template: `
    <section class="ch">
      <header class="page-head" style="margin-top: 0">
        <div style="display: flex; align-items: flex-start; gap: 0.85rem">
          <div class="studio-icon-badge" style="width: 2.6rem; height: 2.6rem; margin-top: 2px">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="7" width="20" height="15" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/>
            </svg>
          </div>
          <div>
            <div class="row" style="gap: 0.5rem; margin-bottom: 0.15rem">
              <h2 style="margin: 0">Channels</h2>
              <span class="pill brand">{{ channels().length }} / {{ max }}</span>
            </div>
            <p class="muted">
              Your YouTube channels and the look of their videos (watermark and end card). Names and pictures come from YouTube:
              connect a channel and it appears here; rename it on YouTube, then press <em>↻</em> to refresh.
            </p>
          </div>
        </div>
        <div class="ch-yt">
          <button type="button" class="btn-primary-glow" (click)="connectYouTube()"
                  [disabled]="connecting() || yt()?.configured === false">＋ Connect a YouTube channel</button>
          <button type="button" class="btn-outline icon" (click)="syncFromYouTube()"
                  [disabled]="syncing() || yt()?.configured === false || !yt()?.channels?.length"
                  title="Refresh names and pictures from YouTube" aria-label="Refresh from YouTube">
            <span [class.spin]="syncing()">↻</span>
          </button>
        </div>
      </header>

      @if (yt(); as st) {
        <div class="sb-kpi-strip">
          <div class="sb-kpi-card">
            <span class="sb-kpi-label">Brand Channels</span>
            <strong class="sb-kpi-val mono">{{ channels().length }}</strong>
          </div>
          <div class="sb-kpi-card">
            <span class="sb-kpi-label">YouTube Connected</span>
            <strong class="sb-kpi-val mono" style="color: var(--ok)">{{ st.channels.length }}</strong>
          </div>
          <div class="sb-kpi-card">
            <span class="sb-kpi-label">OAuth Status</span>
            <strong class="sb-kpi-val" [style.color]="st.configured ? 'var(--ok)' : 'var(--warn)'">
              {{ st.configured ? 'Configured' : 'Not Configured' }}
            </strong>
          </div>
        </div>
      }

      @if (syncFailures().length > 0) {
        <div class="ch-alert" role="alert">
          ⚠️ Couldn't refresh from YouTube:
          @for (f of syncFailures(); track f.channelId) { <span><strong>{{ f.channelTitle }}</strong> - {{ f.reason }}</span> }
          <button type="button" class="btn-outline" (click)="connectYouTube()">Reconnect</button>
        </div>
      }

      @if (rejectedKeys() > 0) {
        <div class="ch-alert" role="alert">
          ⚠️ YouTube refused the saved stream key of {{ rejectedKeys() }} channel{{ rejectedKeys() === 1 ? '' : 's' }} -
          usually because it was reset in YouTube Studio. Go Live won't use it until it's set again.
          <button type="button" class="btn-outline" (click)="filter.set('key-refused'); page.set(0)">Show them</button>
        </div>
      }

      <details class="card ch-manual" style="padding: 0.85rem 1.15rem">
        <summary>➕ Add a brand that isn't a YouTube channel</summary>
        <form class="ch-new" (submit)="$event.preventDefault(); create()">
          <input #newName type="text" maxlength="60" placeholder="Brand name, e.g. Bhakti Kids"
                 [value]="newChannelName()" (input)="newChannelName.set(newName.value)" aria-label="New brand name" />
          <label class="ch-from">Start from
            <select [value]="copyFrom()" (change)="copyFrom.set($any($event.target).value)">
              @for (c of byName(); track c.id) { <option [value]="c.id">{{ c.name }}</option> }
            </select>
          </label>
          <button type="submit" class="btn-outline"
                  [disabled]="!newChannelName().trim() || status.busy() || channels().length >= max">➕ Add brand</button>
        </form>
      </details>

      <div class="card ch-toolbar" style="padding: 0.85rem 1.1rem">
        <div class="studio-search-wrap">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
          </svg>
          <input type="search" placeholder="Search channels…" [value]="query()"
                 (input)="query.set($any($event.target).value); page.set(0)" aria-label="Search channels" />
        </div>
        <div class="ch-filters" role="group" aria-label="Filter">
          @for (f of filters; track f.id) {
            <button type="button" [class.active]="filter() === f.id" (click)="filter.set(f.id); page.set(0)">
              {{ f.label }} <small>{{ filterCount(f.id) }}</small>
            </button>
          }
        </div>
        <label class="ch-sort">Sort
          <select [value]="sort()" (change)="sort.set($any($event.target).value)">
            <option value="name">Name</option>
            <option value="projects">Most projects</option>
            <option value="recent">Newest</option>
          </select>
        </label>
      </div>

      <div class="ch-table">
        @for (c of pageItems(); track c.id) {
          <div class="ch-row" [class.editing]="renaming() === c.id || deleting() === c.id">
            <div class="ch-thumb" [class.avatar]="!!c.youTubeThumbnailUrl"
                 [title]="c.youTubeThumbnailUrl ? 'YouTube channel picture' : hasWatermark(c) ? c.watermark!.kind + ' watermark' : 'No watermark'">
              @if (c.youTubeThumbnailUrl) {
                <img [src]="c.youTubeThumbnailUrl" alt="" loading="lazy" referrerpolicy="no-referrer" />
              } @else if (c.watermark?.kind === 'Logo') {
                <img [src]="logoUrl(c)" alt="" loading="lazy" />
              } @else if (c.watermark?.kind === 'Text') {
                <span class="ch-thumb-text" [style.color]="c.watermark!.colorHex || '#fff'">{{ c.watermark!.text || 'Aa' }}</span>
              } @else {
                <span class="ch-thumb-none">—</span>
              }
            </div>

            <div class="ch-main">
              @if (renaming() === c.id) {
                <form class="ch-rename" (submit)="$event.preventDefault(); saveRename(c)">
                  <input #rn type="text" maxlength="60" [value]="renameValue()" (input)="renameValue.set(rn.value)"
                         aria-label="Channel name" />
                  <button type="submit" class="btn-outline" [disabled]="!renameValue().trim()">Save</button>
                  <button type="button" class="btn-outline" (click)="renaming.set(null)">Cancel</button>
                </form>
              } @else {
                <span class="ch-name">
                  {{ c.name }} @if (c.isDefault) { <span class="pill brand" style="margin-left: 6px; padding: 0.08rem 0.45rem; font-size: 0.65rem">default</span> }
                  @if (youTubeUrl(c); as url) {
                    <a class="ch-yt-link" [href]="url" target="_blank" rel="noopener noreferrer"
                       title="Open on YouTube">{{ c.youTubeChannelHandle || 'YouTube' }} ↗</a>
                  }
                </span>
              }
              <span class="ch-meta">
                @switch (connectionOf(c)) {
                  @case ('connected') { <span class="ok">▶ Connected</span> }
                  @case ('reconnect') { <span class="warn">⚠️ Reconnect needed</span> }
                  @case ('elsewhere') { <span class="off" title="Linked to a YouTube channel you haven't connected">▶ Connected by someone else</span> }
                  @default { <span class="off">Not on YouTube</span> }
                }
                <span [class.off]="!hasWatermark(c)">🛡 {{ hasWatermark(c) ? c.watermark!.kind : 'No watermark' }}</span>
                <span [class.off]="!hasEndCard(c)">🎬 {{ hasEndCard(c) ? c.outro!.kind : 'No end card' }}</span>
                <span>📁 {{ projectsOf(c) }} {{ projectsOf(c) === 1 ? 'project' : 'projects' }}</span>
                @if (liveSetup()) {
                  <span [class.off]="keySummary(c).state === 'Missing'" [class.warn]="keySummary(c).state === 'Rejected'">
                    🔴 {{ keySummary(c).label }}
                  </span>
                }
              </span>
            </div>

            <div class="ch-actions">
              <a class="btn-outline" routerLink="/admin/branding/watermark" [queryParams]="linkParams(c)">Watermark</a>
              <a class="btn-outline" routerLink="/admin/branding/end-card" [queryParams]="linkParams(c)">End card</a>
              <a class="btn-outline" routerLink="/admin/branding/publishing" [queryParams]="linkParams(c)">▶ Publishing</a>
              @if (liveSetup()?.destinations?.length) {
                <button type="button" class="btn-outline" [class.warn]="keySummary(c).state === 'Rejected'"
                        (click)="toggleKeys(c)" [attr.aria-expanded]="editingKeys() === c.id">🔑 Stream key</button>
              }
              @if (connectionOf(c) === 'reconnect') {
                <button type="button" class="btn-outline warn" (click)="connectYouTube()">Reconnect</button>
              }
              @if (c.youTubeThumbnailUrl) {
                <button type="button" class="btn-outline" title="Make the YouTube channel picture this channel's watermark logo"
                        (click)="usePictureAsLogo(c)" [disabled]="status.busy()">🖼 Picture as logo</button>
              }
              @if (!c.youTubeChannelId) {
                <button type="button" class="btn-outline icon" title="Rename" (click)="startRename(c)">✎</button>
              }
              @if (!c.isDefault) {
                <button type="button" class="btn-outline" title="New projects start with this channel; projects without one use it"
                        (click)="makeDefault(c)" [disabled]="status.busy()">★ Make default</button>
              }
              <button type="button" class="btn-outline icon" title="Duplicate" (click)="duplicate(c)"
                      [disabled]="channels().length >= max">⧉</button>
              @if (!c.isDefault || channels().length > 1) {
                <button type="button" class="btn-outline icon danger" title="Delete" (click)="startDelete(c)">🗑</button>
              }
            </div>

            @if (editingKeys() === c.id) {
              <div class="ch-keys">
                <p class="muted">
                  The key from YouTube Studio → <em>Go live</em> → <em>Stream settings</em>. It's encrypted on the server,
                  never shown again, and used by Go Live whenever this channel is picked. YouTube keys don't expire; if you
                  reset it in YouTube Studio, paste the new one here.
                </p>
                @for (d of liveSetup()!.destinations; track d.id) {
                  @let k = keyFor(c.id, d.id);
                  <div class="ch-key-row">
                    <span class="ch-key-dest">{{ d.name }}</span>
                    <span class="ch-key-state" [attr.data-state]="k?.state ?? 'Missing'">
                      @switch (k?.state) {
                        @case ('Saved') { ✅ {{ k!.masked }} @if (k!.lastUsedAt) { · last live {{ k!.lastUsedAt | date: 'short' }} } }
                        @case ('Rejected') { ⚠️ Refused {{ k!.rejectedAt | date: 'short' }} - paste the current key }
                        @default { No key saved }
                      }
                    </span>
                    <form class="ch-key-form" (submit)="$event.preventDefault(); saveKey(c, d.id, keyInput.value); keyInput.value = ''">
                      <input #keyInput type="password" autocomplete="off" spellcheck="false" maxlength="128"
                             [placeholder]="k?.state === 'Saved' ? 'Paste a new key to replace it' : 'Paste the stream key'"
                             [attr.aria-label]="'Stream key for ' + c.name + ' on ' + d.name" />
                      <button type="submit" class="btn-outline">{{ k?.state === 'Missing' || !k ? 'Save' : 'Replace' }}</button>
                      @if (k && k.state !== 'Missing') {
                        <button type="button" class="btn-outline danger" (click)="removeKey(c, d.id)">Remove</button>
                      }
                      @if (d.keyHelpUrl) {
                        <a class="ch-help" [href]="d.keyHelpUrl" target="_blank" rel="noopener noreferrer">Open YouTube Studio ↗</a>
                      }
                    </form>
                  </div>
                }
              </div>
            }

            @if (deleting() === c.id) {
              <div class="ch-delete">
                Delete “{{ c.name }}”?
                @if (c.isDefault) {
                  There's always a default channel - choose the one that takes its place
                  @if (projectsOf(c) > 0) { (its {{ projectsOf(c) }} {{ projectsOf(c) === 1 ? 'project moves' : 'projects move' }} there too) }:
                  <select [value]="moveTo()" (change)="moveTo.set($any($event.target).value)" aria-label="New default channel">
                    @for (o of byName(); track o.id) {
                      @if (!o.isDefault) { <option [value]="o.id">{{ o.name }}</option> }
                    }
                  </select>
                } @else if (projectsOf(c) > 0) {
                  Its {{ projectsOf(c) }} {{ projectsOf(c) === 1 ? 'project moves' : 'projects move' }} to
                  <select [value]="moveTo()" (change)="moveTo.set($any($event.target).value)" aria-label="Move projects to">
                    @for (o of byName(); track o.id) {
                      @if (o.id !== c.id) { <option [value]="o.id">{{ o.name }}</option> }
                    }
                  </select>
                } @else {
                  No project uses it.
                }
                <button type="button" class="btn-outline danger" (click)="confirmDelete(c)" [disabled]="status.busy()">Yes, delete</button>
                <button type="button" class="btn-outline" (click)="deleting.set(null)">Keep</button>
              </div>
            }
          </div>
        } @empty {
          <div class="empty">
            @if (!loaded()) { Loading channels… } @else { No channel matches. }
          </div>
        }
      </div>

      @if (pageCount() > 1) {
        <nav class="ch-pages" aria-label="Pages">
          <button type="button" class="btn-outline" [disabled]="page() === 0" (click)="page.update((p) => p - 1)">‹ Previous</button>
          <span class="muted">{{ page() * pageSize + 1 }}-{{ Math.min((page() + 1) * pageSize, filtered().length) }} of {{ filtered().length }}</span>
          <button type="button" class="btn-outline" [disabled]="page() >= pageCount() - 1" (click)="page.update((p) => p + 1)">Next ›</button>
        </nav>
      }
    </section>
  `,
  styles: [`
    .ch-thumb {
      width: 64px; height: 42px; border-radius: 8px; display: grid; place-items: center; overflow: hidden;
      background: repeating-conic-gradient(#1f2937 0% 25%, #111827 0% 50%) 50% / 12px 12px;
      border: 1px solid var(--border);
    }
    .ch-thumb img { max-width: 100%; max-height: 100%; object-fit: contain; }
    .ch-thumb.avatar { width: 42px; height: 42px; margin-inline: 11px; border-radius: 50%; background: var(--surface-2); border: 2px solid color-mix(in srgb, var(--brand) 45%, var(--border)); }
    .ch-thumb.avatar img { width: 100%; height: 100%; object-fit: cover; }
    .ch-yt { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
    .ch-yt .small, .small { font-size: .78rem; }
    .ch-yt-link { font-size: .75rem; font-weight: 500; margin-left: 6px; color: var(--brand); text-decoration: none; }
    .ch-yt-link:hover { text-decoration: underline; }
    .ch-meta .ok { color: var(--ok); font-weight: 600; }
    .ch-manual { margin-bottom: 1rem; font-size: .84rem; }
    .ch-manual summary { cursor: pointer; color: var(--text-dim); font-weight: 600; }
    .ch-manual[open] summary { margin-bottom: 0.75rem; }
    .ch-thumb-text { font-size: .64rem; font-weight: 700; padding: 0 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
    .ch-thumb-none { color: var(--muted); }
    .btn-primary-glow {
      background: linear-gradient(135deg, var(--brand) 0%, var(--brand-dim) 100%);
      color: #fff; font-size: 0.85rem; font-weight: 600; padding: 0.5rem 1rem; border-radius: 8px;
      border: 1px solid rgba(255,255,255,0.14); cursor: pointer;
    }
    .btn-outline {
      display: inline-flex; align-items: center; gap: 4px; padding: 5px 10px; border-radius: 7px; cursor: pointer;
      background: var(--surface-2); border: 1px solid var(--border); color: var(--text-dim); font-size: .78rem; font-weight: 600;
      box-shadow: none;
    }
    .btn-outline:hover:not([disabled]) { border-color: var(--brand); color: #fff; background: var(--surface-3); transform: none; box-shadow: none; }
    .btn-outline[disabled] { opacity: .45; cursor: default; }
    .ch-new, .ch-toolbar { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; margin-bottom: 1rem; }
    .ch-new { margin-bottom: 0; }
    .ch-new input[type=text] { flex: 1 1 260px; min-width: 200px; }
    .ch-new select, .ch-sort select { width: auto; max-width: 220px; }
    .ch-from, .ch-sort { display: flex; align-items: center; gap: 6px; font-size: .8rem; color: var(--muted); white-space: nowrap; margin: 0; }
    .ch-filters { display: inline-flex; flex-wrap: wrap; gap: 2px; padding: 3px; background: var(--surface-2); border: 1px solid var(--border); border-radius: 9px; overflow: hidden; }
    .ch-filters button { background: transparent; border: none; border-radius: 6px; color: var(--muted); font-size: .76rem; font-weight: 600; padding: 4px 10px; cursor: pointer; box-shadow: none; }
    .ch-filters button:hover:not(:disabled) { color: var(--text); transform: none; box-shadow: none; }
    .ch-filters button small { opacity: .75; margin-left: 2px; }
    .ch-filters button.active { background: linear-gradient(135deg, var(--brand) 0%, var(--brand-dim) 100%); color: #fff; }
    .ch-table { display: grid; gap: 0.55rem; }
    .ch-row {
      display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: 14px; align-items: center;
      padding: 0.75rem 1rem; border-radius: var(--radius);
      background: linear-gradient(180deg, color-mix(in srgb, var(--surface-2) 45%, var(--surface)) 0%, var(--glass) 100%);
      border: 1px solid var(--border); box-shadow: var(--shadow-sm), var(--inner-highlight);
      transition: border-color 0.15s ease;
    }
    .ch-row:hover, .ch-row.editing { border-color: color-mix(in srgb, var(--brand) 50%, var(--border)); }
    .ch-main { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
    .ch-name { font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: flex; align-items: center; }
    .ch-meta { display: flex; gap: 14px; flex-wrap: wrap; font-size: .76rem; color: var(--text-dim); }
    .ch-meta .off { color: var(--muted); }
    .ch-actions { display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }
    .ch-actions a.btn-outline { text-decoration: none; }
    .btn-outline.icon { padding-inline: 8px; }
    .spin { display: inline-block; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .btn-outline.danger { color: var(--err); border-color: color-mix(in oklab, var(--err) 35%, var(--border)); }
    .ch-rename { display: flex; gap: 6px; align-items: center; }
    .ch-rename input { max-width: 280px; }
    .ch-delete { grid-column: 1 / -1; display: flex; gap: 8px; align-items: center; flex-wrap: wrap; font-size: .82rem;
      padding-top: 10px; border-top: 1px dashed var(--border-bright); }
    .ch-delete select { width: auto; max-width: 240px; }
    .ch-meta .warn, .btn-outline.warn { color: var(--warn); }
    .ch-alert { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; margin-bottom: 12px; padding: 10px 14px;
      border: 1px solid color-mix(in oklab, var(--warn) 45%, var(--border)); border-left: 4px solid var(--warn); border-radius: 8px; font-size: .84rem;
      background: linear-gradient(90deg, rgba(245, 158, 11, 0.12) 0%, var(--surface-2) 100%); }
    .ch-keys { grid-column: 1 / -1; display: grid; gap: 10px; padding-top: 10px; border-top: 1px dashed var(--border-bright); font-size: .82rem; }
    .ch-keys p { margin: 0; }
    .ch-key-row { display: grid; grid-template-columns: 120px minmax(0, 1fr); gap: 4px 12px; align-items: center; }
    .ch-key-dest { font-weight: 600; }
    .ch-key-state[data-state='Rejected'] { color: var(--warn); }
    .ch-key-state[data-state='Missing'] { color: var(--muted); }
    .ch-key-form { grid-column: 2; display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
    .ch-key-form input { flex: 1 1 240px; max-width: 360px; font-family: var(--mono, monospace); }
    .ch-help { font-size: .76rem; }
    @media (max-width: 560px) { .ch-key-row { grid-template-columns: minmax(0, 1fr); } .ch-key-form { grid-column: 1; } }
    .ch-pages { display: flex; gap: 12px; align-items: center; justify-content: flex-end; margin-top: 12px; font-size: .82rem; }
    @media (max-width: 760px) { .ch-row { grid-template-columns: auto minmax(0, 1fr); } .ch-actions { grid-column: 1 / -1; justify-content: flex-start; } }
  `],
})
export class AdminChannelsComponent {
  private readonly api = inject(ApiService);
  readonly status = inject(StatusService);
  readonly Math = Math;
  readonly max = MAX_CHANNELS;
  readonly pageSize = PAGE_SIZE;

  readonly channels = signal<BrandChannel[]>([]);
  readonly usage = signal<Record<string, number>>({});
  readonly loaded = signal(false);

  readonly query = signal('');
  readonly filter = signal<Filter>('all');
  readonly sort = signal<Sort>('name');
  readonly page = signal(0);

  readonly newChannelName = signal('');
  readonly copyFrom = signal<string>(DEFAULT_BRAND_CHANNEL);
  readonly renaming = signal<string | null>(null);
  readonly renameValue = signal('');
  readonly deleting = signal<string | null>(null);
  readonly moveTo = signal<string>(DEFAULT_BRAND_CHANNEL);

  readonly filters: readonly { id: Filter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'youtube', label: 'On YouTube' },
    { id: 'not-youtube', label: 'Not on YouTube' },
    { id: 'logo', label: 'Logo' },
    { id: 'text', label: 'Text' },
    { id: 'no-watermark', label: 'No watermark' },
    { id: 'no-end-card', label: 'No end card' },
    { id: 'unused', label: 'Unused' },
    { id: 'key-refused', label: 'Key refused' },
  ];

  // ---- Go Live stream keys, saved per channel and destination
  private readonly live = inject(LiveStreamService);
  readonly liveSetup = signal<LiveStreamSetup | null>(null);
  readonly editingKeys = signal<string | null>(inject(ActivatedRoute).snapshot.queryParamMap.get('keys'));

  readonly rejectedKeys = computed(() =>
    this.channels().filter((c) => this.keySummary(c).state === 'Rejected').length);

  readonly byName = computed(() => [...this.channels()].sort((a, b) =>
    a.isDefault ? -1 : b.isDefault ? 1 : a.name.localeCompare(b.name)));

  readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const f = this.filter();
    const list = this.channels().filter((c) =>
      (!q || c.name.toLowerCase().includes(q) || (c.youTubeChannelHandle ?? '').toLowerCase().includes(q))
      && this.matchesFilter(c, f));

    const order = new Map(this.channels().map((c, i) => [c.id, i]));
    switch (this.sort()) {
      case 'projects': return list.sort((a, b) => this.projectsOf(b) - this.projectsOf(a) || a.name.localeCompare(b.name));
      // Channels are stored in the order they were added; newest last.
      case 'recent': return list.sort((a, b) => order.get(b.id)! - order.get(a.id)!);
      default: return list.sort((a, b) => a.isDefault ? -1 : b.isDefault ? 1 : a.name.localeCompare(b.name));
    }
  });

  readonly pageCount = computed(() => Math.max(1, Math.ceil(this.filtered().length / PAGE_SIZE)));
  readonly pageItems = computed(() => {
    const p = Math.min(this.page(), this.pageCount() - 1);
    return this.filtered().slice(p * PAGE_SIZE, (p + 1) * PAGE_SIZE);
  });

  // ---- YouTube: where channel names and pictures come from
  private readonly youtube = inject(YouTubePublishService);
  readonly yt = signal<YouTubePublishStatus | null>(null);
  readonly syncing = signal(false);
  readonly connecting = signal(false);
  readonly syncFailures = signal<BrandChannelSyncResult['failed']>([]);

  constructor() {
    this.load();
  }

  private load(): void {
    this.status.run(this.api.listBrandChannels(), (list) => {
      this.channels.set(list);
      this.loaded.set(true);
    });
    // Stored channels only - YouTube itself is asked only when the refresh button is pressed,
    // so opening the page spends no API quota.
    this.youtube.status().subscribe({
      next: (st) => this.yt.set(st),
      error: () => this.yt.set(null),
    });
    this.api.brandChannelUsage().subscribe({ next: (u) => this.usage.set(u), error: () => this.usage.set({}) });
    this.loadKeys();
  }

  private loadKeys(): void {
    // Optional: without Go Live configured the page works exactly as before.
    this.live.setup().subscribe({ next: (s) => this.liveSetup.set(s), error: () => this.liveSetup.set(null) });
  }

  keyFor(channelId: string, destinationId: string): LiveStreamKeyStatus | undefined {
    return this.liveSetup()?.channels.find((c) => c.id === channelId)?.keys.find((k) => k.destinationId === destinationId);
  }

  /** The worst state across a channel's destinations - a refused key is what needs doing first. */
  keySummary(c: BrandChannel): { state: 'Missing' | 'Saved' | 'Rejected'; label: string } {
    const keys = this.liveSetup()?.channels.find((x) => x.id === c.id)?.keys ?? [];
    if (keys.some((k) => k.state === 'Rejected' || k.state === 'Unreadable')) return { state: 'Rejected', label: 'Key refused' };
    const saved = keys.filter((k) => k.state === 'Saved');
    if (saved.length > 0) return { state: 'Saved', label: saved.length === 1 ? `Key ${saved[0].masked}` : `${saved.length} keys` };
    return { state: 'Missing', label: 'No stream key' };
  }

  toggleKeys(c: BrandChannel): void {
    this.renaming.set(null);
    this.deleting.set(null);
    this.editingKeys.set(this.editingKeys() === c.id ? null : c.id);
  }

  saveKey(c: BrandChannel, destinationId: string, value: string): void {
    const key = value.trim();
    if (!key) return;
    this.status.run(this.live.saveKey(c.id, destinationId, key), (saved) => {
      this.loadKeys();
      this.status.notify([`Stream key ${saved.masked} saved for "${c.name}".`]);
    });
  }

  removeKey(c: BrandChannel, destinationId: string): void {
    if (!confirm(`Remove "${c.name}"'s saved stream key? Go Live will ask for a key until a new one is saved.`)) return;
    this.status.run(this.live.deleteKey(c.id, destinationId), () => {
      this.loadKeys();
      this.status.notify([`Stream key removed from "${c.name}".`]);
    });
  }

  private apply(list: BrandChannel[]): void {
    this.channels.set(list);
    this.api.brandChannelUsage().subscribe({ next: (u) => this.usage.set(u), error: () => {} });
  }

  projectsOf(c: BrandChannel): number {
    return this.usage()[c.id] ?? 0;
  }

  hasWatermark(c: BrandChannel): boolean { return !!c.watermark && c.watermark.kind !== 'None'; }
  hasEndCard(c: BrandChannel): boolean { return !!c.outro && c.outro.kind !== 'None'; }

  private matchesFilter(c: BrandChannel, f: Filter): boolean {
    switch (f) {
      case 'logo': return c.watermark?.kind === 'Logo';
      case 'text': return c.watermark?.kind === 'Text';
      case 'no-watermark': return !this.hasWatermark(c);
      case 'no-end-card': return !this.hasEndCard(c);
      case 'youtube': return !!c.youTubeChannelId;
      case 'not-youtube': return !c.youTubeChannelId;
      case 'unused': return this.projectsOf(c) === 0;
      case 'key-refused': return this.keySummary(c).state === 'Rejected';
      default: return true;
    }
  }

  filterCount(f: Filter): number {
    return this.channels().filter((c) => this.matchesFilter(c, f)).length;
  }

  logoUrl(c: BrandChannel): string {
    // The asset id busts the cache when the logo is replaced.
    return `${this.api.globalLogoUrl(c.id)}&v=${encodeURIComponent(c.watermark?.logoAssetId ?? '')}`;
  }

  /** Only a real channel id becomes a link. */
  youTubeUrl(c: BrandChannel): string | null {
    return c.youTubeChannelId && /^UC[A-Za-z0-9_-]{22}$/.test(c.youTubeChannelId)
      ? `https://www.youtube.com/channel/${c.youTubeChannelId}`
      : null;
  }

  connectionOf(c: BrandChannel): 'connected' | 'reconnect' | 'elsewhere' | 'none' {
    if (!c.youTubeChannelId) return 'none';
    const mine = this.yt()?.channels.find((x) => x.channelId === c.youTubeChannelId);
    if (!mine) return 'elsewhere';
    return mine.needsReconnect ? 'reconnect' : 'connected';
  }

  connectYouTube(): void {
    this.connecting.set(true);
    this.youtube.startConnect('/admin/channels').subscribe({
      next: (url) => {
        if (url.startsWith('https://accounts.google.com/')) window.location.assign(url);
        else { this.connecting.set(false); this.status.notify(['The server returned an unexpected sign-in address.']); }
      },
      error: (e: Error) => { this.connecting.set(false); this.status.notify([e.message]); },
    });
  }

  syncFromYouTube(): void {
    if (this.syncing()) return;
    this.syncing.set(true);
    this.api.syncBrandChannelsFromYouTube().subscribe({
      next: (r) => {
        this.syncing.set(false);
        this.apply(r.channels);
        this.syncFailures.set(r.failed);
        this.youtube.status().subscribe({ next: (st) => this.yt.set(st), error: () => {} });

        const messages = [
          ...r.created.map((name) => `Added "${name}" from YouTube.`),
          ...r.renamed.map((x) => `"${x.before}" is now "${x.after}" (renamed on YouTube).`),
        ];
        if (messages.length > 0) this.status.notify(messages);
        else if (r.failed.length === 0) this.status.notify(['Everything already matches YouTube.']);
      },
      error: (e: Error) => {
        this.syncing.set(false);
        this.status.notify([e.message]);
      },
    });
  }

  usePictureAsLogo(c: BrandChannel): void {
    this.status.run(this.api.useYouTubePictureAsLogo(c.isDefault ? null : c.id), (watermark) => {
      this.channels.update((list) => list.map((x) => x.id === c.id ? { ...x, watermark } : x));
      this.status.notify([`"${c.name}" now uses its YouTube picture as the watermark logo.`]);
    });
  }

  linkParams(c: BrandChannel): Record<string, string> | null {
    return c.isDefault ? null : { channel: c.id };
  }

  create(): void {
    const name = this.newChannelName().trim();
    if (!name) return;
    this.status.run(this.api.createBrandChannel(name, this.copyFrom()), (list) => {
      this.newChannelName.set('');
      this.apply(list);
      this.query.set(name);
      this.page.set(0);
      this.status.notify([`Channel "${name}" added - set its logo and end card from its row.`]);
    });
  }

  duplicate(c: BrandChannel): void {
    const taken = new Set(this.channels().map((x) => x.name.toLowerCase()));
    let name = `${c.name} (copy)`.slice(0, 60);
    for (let i = 2; taken.has(name.toLowerCase()); i++) name = `${c.name} (copy ${i})`.slice(0, 60);
    this.status.run(this.api.createBrandChannel(name, c.id), (list) => {
      this.apply(list);
      this.status.notify([`"${name}" created with ${c.name}'s watermark and end card.`]);
    });
  }

  startRename(c: BrandChannel): void {
    this.deleting.set(null);
    this.renameValue.set(c.name);
    this.renaming.set(c.id);
  }

  saveRename(c: BrandChannel): void {
    const name = this.renameValue().trim();
    if (!name) return;
    this.status.run(this.api.renameBrandChannel(c.id, name), (list) => {
      this.renaming.set(null);
      this.apply(list);
    });
  }

  startDelete(c: BrandChannel): void {
    this.renaming.set(null);
    // The default can only go once another channel is picked to replace it.
    this.moveTo.set(c.isDefault ? (this.byName().find((x) => !x.isDefault)?.id ?? DEFAULT_BRAND_CHANNEL) : DEFAULT_BRAND_CHANNEL);
    this.deleting.set(c.id);
  }

  confirmDelete(c: BrandChannel): void {
    const moved = this.projectsOf(c);
    const destination = this.channels().find((x) => x.id === this.moveTo())?.name ?? 'Default';
    this.status.run(this.api.deleteBrandChannel(c.id, this.moveTo()), (list) => {
      this.deleting.set(null);
      this.apply(list);
      this.loadKeys();
      this.status.notify([c.isDefault
        ? `Deleted "${c.name}"; "${destination}" is now the default.`
        : moved > 0
          ? `Deleted "${c.name}"; ${moved} project(s) moved to ${destination}.`
          : `Deleted "${c.name}".`]);
    });
  }

  makeDefault(c: BrandChannel): void {
    const current = this.channels().find((x) => x.isDefault)?.name ?? 'Default';
    if (!confirm(`Make "${c.name}" the default channel? New projects will start with it. "${current}" stays as a normal channel, and existing projects keep the look they have.`)) return;
    this.status.run(this.api.makeDefaultBrandChannel(c.id), (list) => {
      this.deleting.set(null);
      this.renaming.set(null);
      this.editingKeys.set(null);
      this.apply(list);
      // Stream keys moved with the channels, so their per-id status has to be read again.
      this.loadKeys();
      this.status.notify([`"${c.name}" is now the default channel.`]);
    });
  }
}
