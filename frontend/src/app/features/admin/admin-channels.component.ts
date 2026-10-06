import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { BrandChannel, DEFAULT_BRAND_CHANNEL } from '../../core/models/api.models';
import { LiveStreamKeyStatus, LiveStreamSetup } from '../../core/models/live-stream.models';
import { ApiService } from '../../core/services/api.service';
import { LiveStreamService } from '../../core/services/live-stream.service';
import { StatusService } from '../../core/services/status.service';

type Filter = 'all' | 'logo' | 'text' | 'no-watermark' | 'no-end-card' | 'unused' | 'key-refused';
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
      <header class="ch-head">
        <div>
          <h2>Channels</h2>
          <p class="muted">One look per channel: the watermark stamped on its videos and the end card they finish with. Each project publishes under one.</p>
        </div>
        <span class="ch-count">{{ channels().length }} / {{ max }}</span>
      </header>

      @if (rejectedKeys() > 0) {
        <div class="ch-alert" role="alert">
          ⚠️ YouTube refused the saved stream key of {{ rejectedKeys() }} channel{{ rejectedKeys() === 1 ? '' : 's' }} -
          usually because it was reset in YouTube Studio. Go Live won't use it until it's set again.
          <button type="button" class="btn-outline" (click)="filter.set('key-refused'); page.set(0)">Show them</button>
        </div>
      }

      <form class="ch-new" (submit)="$event.preventDefault(); create()">
        <input #newName type="text" maxlength="60" placeholder="New channel name, e.g. Bhakti Kids"
               [value]="newChannelName()" (input)="newChannelName.set(newName.value)" aria-label="New channel name" />
        <label class="ch-from">Start from
          <select [value]="copyFrom()" (change)="copyFrom.set($any($event.target).value)">
            @for (c of byName(); track c.id) { <option [value]="c.id">{{ c.name }}</option> }
          </select>
        </label>
        <button type="submit" class="btn-primary-glow"
                [disabled]="!newChannelName().trim() || status.busy() || channels().length >= max">➕ Add channel</button>
      </form>

      <div class="ch-toolbar">
        <input type="search" placeholder="Search channels…" [value]="query()"
               (input)="query.set($any($event.target).value); page.set(0)" aria-label="Search channels" />
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
            <div class="ch-thumb" [title]="hasWatermark(c) ? c.watermark!.kind + ' watermark' : 'No watermark'">
              @if (c.watermark?.kind === 'Logo') {
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
                <span class="ch-name">{{ c.name }} @if (c.isDefault) { <span class="ch-tag">default</span> }</span>
              }
              <span class="ch-meta">
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
              <button type="button" class="btn-outline icon" title="Rename" (click)="startRename(c)">✎</button>
              <button type="button" class="btn-outline icon" title="Duplicate" (click)="duplicate(c)"
                      [disabled]="channels().length >= max">⧉</button>
              @if (!c.isDefault) {
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
                @if (projectsOf(c) > 0) {
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
          <div class="ch-empty muted">
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
      width: 64px; height: 40px; border-radius: 6px; display: grid; place-items: center; overflow: hidden;
      background: repeating-conic-gradient(#1f2937 0% 25%, #111827 0% 50%) 50% / 12px 12px;
      border: 1px solid var(--border, #1e2433);
    }
    .ch-thumb img { max-width: 100%; max-height: 100%; object-fit: contain; }
    .ch-thumb-text { font-size: .62rem; font-weight: 700; padding: 0 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
    .ch-thumb-none { color: var(--muted, #6b7280); }
    input[type=search], input[type=text] {
      padding: 7px 10px; border-radius: 8px; border: 1px solid var(--border, #1e2433);
      background: var(--bg, #0b0f19); color: inherit; font-size: .84rem;
    }
    input:focus { outline: none; border-color: var(--brand, #6c8cff); }
    .btn-outline {
      display: inline-flex; align-items: center; gap: 4px; padding: 5px 10px; border-radius: 7px; cursor: pointer;
      background: transparent; border: 1px solid var(--border, #1e2433); color: var(--text, #d1d5db); font-size: .78rem;
    }
    .btn-outline:hover:not([disabled]) { border-color: var(--brand, #6c8cff); color: #fff; }
    .btn-outline[disabled] { opacity: .45; cursor: default; }
    .ch-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; margin-bottom: 1rem; }
    .ch-head h2 { margin: 0 0 4px; }
    .ch-head p { margin: 0; font-size: .85rem; max-width: 640px; }
    .ch-count { font-size: .75rem; color: var(--muted, #8b9bb4); border: 1px solid var(--border, #1e2433); padding: 2px 10px; border-radius: 999px; white-space: nowrap; }
    .ch-new, .ch-toolbar { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; margin-bottom: 12px; }
    .ch-new input[type=text] { flex: 1 1 260px; min-width: 200px; }
    .ch-new select, .ch-sort select { width: auto; max-width: 220px; }
    .ch-from, .ch-sort { display: flex; align-items: center; gap: 6px; font-size: .8rem; color: var(--muted, #8b9bb4); white-space: nowrap; }
    .ch-toolbar input[type=search] { flex: 1 1 220px; min-width: 180px; max-width: 360px; }
    .ch-filters { display: inline-flex; flex-wrap: wrap; border: 1px solid var(--border, #1e2433); border-radius: 8px; overflow: hidden; }
    .ch-filters button { background: transparent; border: none; color: var(--muted, #8b9bb4); font-size: .76rem; padding: 5px 10px; cursor: pointer; }
    .ch-filters button small { opacity: .7; margin-left: 2px; }
    .ch-filters button.active { background: var(--brand, #6c8cff); color: #fff; }
    .ch-table { display: grid; gap: 6px; }
    .ch-row {
      display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: 14px; align-items: center;
      padding: 8px 12px; border-radius: 10px; background: var(--surface, #111827); border: 1px solid var(--border, #1e2433);
    }
    .ch-row:hover, .ch-row.editing { border-color: color-mix(in srgb, var(--brand, #6c8cff) 45%, transparent); }
    .ch-main { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
    .ch-name { font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .ch-tag { font-size: .62rem; text-transform: uppercase; letter-spacing: .06em; color: var(--brand, #6c8cff); margin-left: 4px; }
    .ch-meta { display: flex; gap: 14px; flex-wrap: wrap; font-size: .74rem; color: #cbd5e1; }
    .ch-meta .off { color: var(--muted, #6b7280); }
    .ch-actions { display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }
    .ch-actions a.btn-outline { text-decoration: none; }
    .btn-outline.icon { padding-inline: 8px; }
    .btn-outline.danger { color: #f87171; }
    .ch-rename { display: flex; gap: 6px; align-items: center; }
    .ch-rename input { max-width: 280px; }
    .ch-delete { grid-column: 1 / -1; display: flex; gap: 8px; align-items: center; flex-wrap: wrap; font-size: .82rem;
      padding-top: 8px; border-top: 1px dashed var(--border, #1e2433); }
    .ch-delete select { width: auto; max-width: 240px; }
    .ch-meta .warn, .btn-outline.warn { color: #fbbf24; }
    .ch-alert { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; margin-bottom: 12px; padding: 8px 12px;
      border: 1px solid #fbbf24; border-left-width: 3px; border-radius: 8px; font-size: .82rem;
      background: color-mix(in srgb, #fbbf24 8%, transparent); }
    .ch-keys { grid-column: 1 / -1; display: grid; gap: 8px; padding-top: 8px; border-top: 1px dashed var(--border, #1e2433); font-size: .82rem; }
    .ch-keys p { margin: 0; }
    .ch-key-row { display: grid; grid-template-columns: 120px minmax(0, 1fr); gap: 4px 12px; align-items: center; }
    .ch-key-dest { font-weight: 600; }
    .ch-key-state[data-state='Rejected'] { color: #fbbf24; }
    .ch-key-state[data-state='Missing'] { color: var(--muted, #8b9bb4); }
    .ch-key-form { grid-column: 2; display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
    .ch-key-form input { flex: 1 1 240px; max-width: 360px; font-family: var(--mono, monospace); }
    .ch-help { font-size: .76rem; }
    @media (max-width: 560px) { .ch-key-row { grid-template-columns: minmax(0, 1fr); } .ch-key-form { grid-column: 1; } }
    .ch-empty { padding: 1.5rem; text-align: center; border: 1px dashed var(--border, #1e2433); border-radius: 10px; }
    .ch-pages { display: flex; gap: 12px; align-items: center; justify-content: flex-end; margin-top: 12px; font-size: .8rem; }
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
      (!q || c.name.toLowerCase().includes(q)) && this.matchesFilter(c, f));

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

  constructor() {
    this.load();
  }

  private load(): void {
    this.status.run(this.api.listBrandChannels(), (list) => {
      this.channels.set(list);
      this.loaded.set(true);
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
      case 'unused': return this.projectsOf(c) === 0;
      case 'key-refused': return this.keySummary(c).state === 'Rejected';
      default: return true;
    }
  }

  filterCount(f: Filter): number {
    return this.channels().filter((c) => this.matchesFilter(c, f)).length;
  }

  logoUrl(c: BrandChannel): string {
    return this.api.globalLogoUrl(c.id);
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
    this.moveTo.set(DEFAULT_BRAND_CHANNEL);
    this.deleting.set(c.id);
  }

  confirmDelete(c: BrandChannel): void {
    const moved = this.projectsOf(c);
    const destination = this.channels().find((x) => x.id === this.moveTo())?.name ?? 'Default';
    this.status.run(this.api.deleteBrandChannel(c.id, this.moveTo()), (list) => {
      this.deleting.set(null);
      this.apply(list);
      this.status.notify([moved > 0
        ? `Deleted "${c.name}"; ${moved} project(s) moved to ${destination}.`
        : `Deleted "${c.name}".`]);
    });
  }
}
