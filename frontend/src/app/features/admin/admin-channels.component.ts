import { DatePipe } from '@angular/common';
import {
  Component, ElementRef, HostListener, Injector, OnDestroy, afterNextRender, computed, effect, inject, signal, viewChild,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable, catchError, map, of } from 'rxjs';

import { BrandChannel, BrandChannelSyncResult, DEFAULT_BRAND_CHANNEL } from '../../core/models/api.models';
import { LiveStreamKeyStatus, LiveStreamSetup } from '../../core/models/live-stream.models';
import { YouTubePublishStatus } from '../../core/models/youtube.models';
import { ApiService } from '../../core/services/api.service';
import { LiveStreamService } from '../../core/services/live-stream.service';
import { StatusService } from '../../core/services/status.service';
import { YouTubePublishService } from '../../core/services/youtube-publish.service';
import { AdminAutofocusDirective, AdminIconComponent } from './admin-channel-kit';
import { copyText, isTypingTarget, messageOf, plural, readStored, safePicture, writeStored } from './admin-channel-utils';
import {
  ANY_FACETS, ChannelRow, EndCardFilter, KeyFilter, MAX_CHANNELS, MAX_NAME_LENGTH, ORDER_KEY, PAGE_SIZES, PREFS_KEY,
  PageSize, SORT_LABELS, SortKey, VIEW_LABELS, ViewFilter, WatermarkFilter, activeFacetCount, buildRows, checkChannelName,
  effectiveOrder, matchesFacets, matchesQuery, matchesView, moveInOrder, pageOf, sanitizeOrder, sanitizePrefs,
  searchTokens, sortRows, swapLiveKeys, swapUsage, swapWithDefault, uniqueCopyName, usageAfterDelete, withoutChannel,
} from './admin-channels.logic';

type PanelKind = 'rename' | 'delete' | 'default' | 'logo' | 'keys';

interface Panel {
  kind: PanelKind;
  id: string;
  /** Why the last attempt failed; shown inside the panel the user is looking at. */
  error: string | null;
}

type Phase = 'loading' | 'ready' | 'error';
type Settled = 'loading' | 'ok' | 'error';
type Attempt<T> = { ok: true; value: T } | { ok: false; message: string };

const attempt = <T>(source: Observable<T>): Observable<Attempt<T>> =>
  source.pipe(
    map((value) => ({ ok: true as const, value })),
    catchError((e: unknown) => of({ ok: false as const, message: messageOf(e) })));

/**
 * Every brand channel in one place: find, add, rename, duplicate and remove them.
 * <p>
 * Built for hundreds of channels, not three: search, filters and sorting narrow the list, it is
 * paged, and each row loads only its own picture. Changes show at once and are rolled back with
 * the reason if the server refuses them. Editing a channel's look happens on the Watermark and
 * End card pages - each row links straight to its channel there.
 * </p>
 */
@Component({
  selector: 'app-admin-channels',
  imports: [RouterLink, DatePipe, AdminIconComponent, AdminAutofocusDirective],
  templateUrl: './admin-channels.component.html',
  styleUrl: './admin-channels.component.css',
})
export class AdminChannelsComponent implements OnDestroy {
  private readonly api = inject(ApiService);
  private readonly youtube = inject(YouTubePublishService);
  private readonly live = inject(LiveStreamService);
  private readonly route = inject(ActivatedRoute);
  private readonly injector = inject(Injector);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly status = inject(StatusService);

  readonly max = MAX_CHANNELS;
  readonly maxName = MAX_NAME_LENGTH;
  readonly pageSizes = PAGE_SIZES;
  readonly viewChips = (Object.keys(VIEW_LABELS) as ViewFilter[]).map((id) => ({ id, label: VIEW_LABELS[id] }));
  readonly sortOptions = (Object.keys(SORT_LABELS) as SortKey[]).map((id) => ({ id, label: SORT_LABELS[id] }));
  readonly skeletons = [0, 1, 2, 3, 4, 5];
  readonly plural = plural;

  // ---- what the server told us
  readonly channels = signal<BrandChannel[]>([]);
  readonly phase = signal<Phase>('loading');
  readonly loadError = signal<string | null>(null);
  /** Null until the counts are known; a failed read must not look like "no channel is used". */
  readonly usage = signal<Record<string, number> | null>(null);
  readonly usageState = signal<Settled>('loading');
  readonly yt = signal<YouTubePublishStatus | null>(null);
  readonly ytState = signal<Settled>('loading');
  readonly liveSetup = signal<LiveStreamSetup | null>(null);
  readonly liveState = signal<Settled>('loading');

  // ---- how the list is looked at (remembered in this browser)
  private readonly saved = sanitizePrefs(readStored(PREFS_KEY));
  readonly view = signal<ViewFilter>(this.saved.view);
  readonly sort = signal<SortKey>(this.saved.sort);
  readonly facets = signal(this.saved.facets);
  readonly pageSize = signal<PageSize>(this.saved.pageSize);
  readonly customOrder = signal<string[]>(sanitizeOrder(readStored(ORDER_KEY)));
  readonly query = signal('');
  readonly page = signal(0);
  readonly filtersOpen = signal(activeFacetCount(this.saved.facets) > 0);

  // ---- what is being done
  readonly addOpen = signal(false);
  readonly newName = signal('');
  readonly copyFrom = signal<string>(DEFAULT_BRAND_CHANNEL);
  readonly addError = signal<string | null>(null);
  readonly panel = signal<Panel | null>(null);
  readonly renameValue = signal('');
  readonly moveTo = signal<string>(DEFAULT_BRAND_CHANNEL);
  readonly removingKey = signal<string | null>(null);
  readonly keyBusy = signal<string | null>(null);
  readonly menuId = signal<string | null>(null);
  readonly mutating = signal(false);
  readonly pending = signal<ReadonlySet<string>>(new Set());
  readonly flashId = signal<string | null>(null);
  readonly broken = signal<ReadonlySet<string>>(new Set());
  readonly syncing = signal(false);
  readonly connecting = signal(false);
  readonly syncReport = signal<BrandChannelSyncResult | null>(null);
  readonly actionError = signal<string | null>(null);
  readonly toast = signal<string | null>(null);
  readonly liveMessage = signal('');

  private readonly searchBox = viewChild<ElementRef<HTMLInputElement>>('search');
  private seq = 0;
  private timers: ReturnType<typeof setTimeout>[] = [];
  private deepLinkDone = false;
  /** After a moment the page stops waiting for slow side requests and shows what it has. */
  private readonly patience = signal(false);

  /**
   * The list waits (as a skeleton) until the quick status calls have answered, so the banners
   * they decide on don't push the list down a moment after it appeared.
   */
  readonly stage = computed<'loading' | 'ready' | 'error'>(() => {
    if (this.phase() === 'error') return 'error';
    const settled = this.ytState() !== 'loading' && this.usageState() !== 'loading' && this.liveState() !== 'loading';
    return this.phase() === 'ready' && (settled || this.patience()) ? 'ready' : 'loading';
  });

  // ---- derived
  readonly rows = computed(() => buildRows(this.channels(), this.usage(), this.yt()?.channels ?? null, this.liveSetup()));
  private readonly tokens = computed(() => searchTokens(this.query()));
  /** Rows that match the search and the extra filters - the base the quick filters count against. */
  private readonly base = computed(() =>
    this.rows().filter((r) => matchesQuery(r, this.tokens()) && matchesFacets(r, this.facets())));
  readonly filtered = computed(() =>
    sortRows(this.base().filter((r) => matchesView(r, this.view())), this.sort(), this.customOrder()));
  readonly pageCount = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.pageSize())));
  readonly currentPage = computed(() => Math.min(this.page(), this.pageCount() - 1));
  readonly pageItems = computed(() => {
    const start = this.currentPage() * this.pageSize();
    return this.filtered().slice(start, start + this.pageSize());
  });
  readonly pageFrom = computed(() => (this.filtered().length === 0 ? 0 : this.currentPage() * this.pageSize() + 1));
  readonly pageTo = computed(() => Math.min((this.currentPage() + 1) * this.pageSize(), this.filtered().length));
  readonly facetCount = computed(() => activeFacetCount(this.facets()));
  readonly narrowed = computed(() => !!this.query().trim() || this.view() !== 'all' || this.facetCount() > 0);
  readonly maxProjects = computed(() => Math.max(1, ...this.rows().map((r) => r.projects ?? 0)));
  readonly liveOn = computed(() => (this.liveSetup()?.destinations?.length ?? 0) > 0);
  readonly liveDestinations = computed(() => this.liveSetup()?.destinations ?? []);
  readonly reconnectRows = computed(() => this.rows().filter((r) => r.connection === 'reconnect'));
  readonly refusedRows = computed(() => this.rows().filter((r) => r.key === 'refused'));
  readonly defaultChannel = computed(() => this.channels().find((c) => c.isDefault) ?? null);

  readonly canSync = computed(() => this.yt()?.configured !== false && (this.yt()?.channels.length ?? 0) > 0);
  readonly syncHint = computed(() => {
    if (this.ytState() === 'loading') return 'Checking your YouTube connections…';
    if (this.ytState() === 'error') return 'The YouTube connection status couldn’t be read';
    if (this.yt()?.configured === false) return 'YouTube sign-in isn’t set up on this server';
    if (!this.yt()?.channels.length) return 'Connect a YouTube channel first';
    return 'Re-read names and pictures from YouTube, and add a brand for any connected channel that has none';
  });

  readonly kpis = computed(() => {
    const rows = this.rows();
    return {
      total: rows.length,
      onYouTube: rows.filter((r) => !!r.channel.youTubeChannelId).length,
      connected: rows.filter((r) => r.connection === 'connected').length,
      attention: rows.filter((r) => r.attention.length > 0).length,
      unused: this.usage() ? rows.filter((r) => r.projects === 0).length : null,
    };
  });

  /** The name of each channel, default first, for the pickers. */
  readonly byName = computed(() => [...this.channels()].sort((a, b) =>
    Number(b.isDefault) - Number(a.isDefault) || a.name.localeCompare(b.name, undefined, { sensitivity: 'base', numeric: true })));

  readonly newCheck = computed(() => checkChannelName(this.newName(), this.channels(), null));
  readonly renameCheck = computed(() => {
    const p = this.panel();
    return checkChannelName(this.renameValue(), this.channels(), p?.kind === 'rename' ? p.id : null);
  });

  readonly deleteInfo = computed(() => {
    const p = this.panel();
    if (p?.kind !== 'delete') return null;
    const row = this.rows().find((r) => r.channel.id === p.id);
    if (!row) return null;
    const options = this.byName().filter((o) => o.id !== row.channel.id);
    return {
      channel: row.channel,
      projects: row.projects ?? 0,
      projectsKnown: row.projects !== null,
      linked: !!row.channel.youTubeChannelId,
      hasKeys: row.key === 'saved' || row.key === 'refused',
      options,
      destination: options.find((o) => o.id === this.moveTo()) ?? options.at(0) ?? null,
    };
  });

  constructor() {
    effect(() => writeStored(PREFS_KEY, { view: this.view(), sort: this.sort(), facets: this.facets(), pageSize: this.pageSize() }));
    effect(() => writeStored(ORDER_KEY, this.customOrder()));
    this.after(2500, () => this.patience.set(true));
    this.reload();
  }

  ngOnDestroy(): void {
    this.timers.forEach(clearTimeout);
  }

  // ---------------------------------------------------------------------------------- loading

  reload(): void {
    this.loadChannels();
    this.loadYouTube();
    this.loadUsage();
    this.loadLive();
  }

  loadChannels(): void {
    this.phase.set('loading');
    this.loadError.set(null);
    this.run(this.api.listBrandChannels(), (r) => {
      if (r.ok) {
        this.channels.set(r.value);
        this.phase.set('ready');
        this.openDeepLink();
      } else {
        this.phase.set('error');
        this.loadError.set(r.message);
      }
    });
  }

  /** Stored channels only - YouTube itself is asked only when Sync is pressed, so opening the page spends no API quota. */
  loadYouTube(): void {
    this.ytState.set('loading');
    this.youtube.status().subscribe({
      next: (st) => { this.yt.set(st); this.ytState.set('ok'); },
      error: () => { this.yt.set(null); this.ytState.set('error'); },
    });
  }

  loadUsage(): void {
    if (this.usage() === null) this.usageState.set('loading');
    this.api.brandChannelUsage().subscribe({
      next: (u) => { this.usage.set(u); this.usageState.set('ok'); },
      // A background refresh that fails keeps the numbers already shown.
      error: () => { if (this.usage() === null) this.usageState.set('error'); },
    });
  }

  /** Optional: without Go Live configured the page works without any stream-key controls. */
  loadLive(): void {
    this.live.setup().subscribe({
      next: (s) => { this.liveSetup.set(s); this.liveState.set('ok'); },
      error: () => { if (this.liveSetup() === null) this.liveState.set('error'); },
    });
  }

  private run<T>(source: Observable<T>, done: (r: Attempt<T>) => void): void {
    this.status.run(attempt(source), done);
  }

  /** `?keys=<channel id>` (from Go Live) opens that channel's stream keys. */
  private openDeepLink(): void {
    if (this.deepLinkDone) return;
    this.deepLinkDone = true;
    const id = this.route.snapshot.queryParamMap.get('keys');
    if (!id || !this.channels().some((c) => c.id === id)) return;
    this.revealRow(id);
    this.panel.set({ kind: 'keys', id, error: null });
  }

  // ---------------------------------------------------------------------------- list controls

  val(e: Event): string {
    return (e.target as HTMLInputElement | HTMLSelectElement).value;
  }

  onQuery(e: Event): void {
    this.query.set(this.val(e));
    this.page.set(0);
  }

  onQueryKey(e: Event): void {
    if (this.query()) {
      this.clearQuery();
      e.stopPropagation();
    } else {
      (e.target as HTMLElement).blur();
    }
  }

  clearQuery(): void {
    this.query.set('');
    this.page.set(0);
  }

  setView(v: ViewFilter): void {
    this.view.set(v);
    this.page.set(0);
  }

  setFacet(key: 'watermark' | 'endCard' | 'key', e: Event): void {
    const value = this.val(e);
    this.facets.update((f) => ({
      ...f,
      ...(key === 'watermark' ? { watermark: value as WatermarkFilter } : key === 'endCard' ? { endCard: value as EndCardFilter } : { key: value as KeyFilter }),
    }));
    this.page.set(0);
  }

  setSort(e: Event): void {
    this.sort.set(this.val(e) as SortKey);
    this.page.set(0);
  }

  setPageSize(e: Event): void {
    this.pageSize.set(Number(this.val(e)) as PageSize);
    this.page.set(0);
  }

  clearFilters(): void {
    this.query.set('');
    this.view.set('all');
    this.facets.set(ANY_FACETS);
    this.page.set(0);
  }

  showRefusedKeys(): void {
    this.facets.update((f) => ({ ...f, key: 'refused' }));
    this.view.set('all');
    this.filtersOpen.set(true);
    this.page.set(0);
  }

  chipCount(v: ViewFilter): number {
    return this.base().filter((r) => matchesView(r, v)).length;
  }

  goTo(page: number): void {
    this.page.set(Math.max(0, Math.min(page, this.pageCount() - 1)));
  }

  focusSearch(): void {
    const el = this.searchBox()?.nativeElement;
    el?.focus();
    el?.select();
  }

  /** Brings a row into view: widens the filters if they hide it, turns to its page and flashes it. */
  revealRow(id: string): void {
    if (!this.filtered().some((r) => r.channel.id === id)) this.clearFilters();
    this.page.set(pageOf(this.filtered().findIndex((r) => r.channel.id === id), this.pageSize()));
    this.flashId.set(id);
    this.after(2600, () => this.flashId.set(null));
    afterNextRender(() => {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.rowEl(id)?.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
    }, { injector: this.injector });
  }

  private rowEl(id: string): HTMLElement | null {
    return this.host.nativeElement.querySelector<HTMLElement>(`[data-row="${CSS.escape(id)}"]`);
  }

  private focusRowMenu(id: string): void {
    afterNextRender(() => this.rowEl(id)?.querySelector<HTMLElement>('.ch-menu-btn')?.focus(), { injector: this.injector });
  }

  private after(ms: number, fn: () => void): void {
    this.timers.push(setTimeout(fn, ms));
  }

  moveRow(c: BrandChannel, to: 'up' | 'down' | 'top'): void {
    this.menuId.set(null);
    const visible = this.filtered().map((r) => r.channel.id);
    const full = effectiveOrder(this.channels().map((x) => x.id), this.customOrder());
    this.customOrder.set(moveInOrder(full, visible, c.id, to));
    this.page.set(pageOf(this.filtered().findIndex((r) => r.channel.id === c.id), this.pageSize()));
    this.focusRowMenu(c.id);
  }

  canMove(c: BrandChannel, to: 'up' | 'down' | 'top'): boolean {
    const visible = this.filtered();
    const at = visible.findIndex((r) => r.channel.id === c.id);
    return to === 'down' ? at >= 0 && at < visible.length - 1 : at > 0;
  }

  // ------------------------------------------------------------------------------------ keys

  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent): void {
    if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey && !isTypingTarget(e.target)) {
      // The settings sidebar also answers "/"; on this page the list's own search wins.
      e.preventDefault();
      this.focusSearch();
      return;
    }
    if (e.key !== 'Escape') return;
    if (this.menuId()) {
      const id = this.menuId()!;
      this.menuId.set(null);
      this.focusRowMenu(id);
    } else if (this.panel()) {
      this.cancelPanel();
    } else if (this.addOpen()) {
      this.closeAdd();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent): void {
    if (this.menuId() && !(e.target as HTMLElement).closest('.ch-menu-wrap')) this.menuId.set(null);
  }

  toggleMenu(id: string, e: Event): void {
    e.stopPropagation();
    const opening = this.menuId() !== id;
    this.menuId.set(opening ? id : null);
    if (opening) {
      afterNextRender(() => {
        const menu = document.getElementById(`menu-${id}`);
        menu?.querySelector<HTMLElement>('[role="menuitem"]:not([disabled])')?.focus();
        menu?.scrollIntoView({ block: 'nearest' });
      }, { injector: this.injector });
    }
  }

  onMenuKey(e: KeyboardEvent): void {
    const items = Array.from((e.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])'));
    const at = items.indexOf(document.activeElement as HTMLElement);
    const go = (i: number) => { e.preventDefault(); items[(i + items.length) % items.length]?.focus(); };
    if (e.key === 'ArrowDown') go(at + 1);
    else if (e.key === 'ArrowUp') go(at - 1);
    else if (e.key === 'Home') go(0);
    else if (e.key === 'End') go(items.length - 1);
    else if (e.key === 'Tab') this.menuId.set(null);
  }

  // ------------------------------------------------------------------------------- row details

  isPending(id: string): boolean {
    return this.pending().has(id);
  }

  pictureOf(c: BrandChannel): string | null {
    return this.broken().has(`yt:${c.id}`) ? null : safePicture(c.youTubeThumbnailUrl);
  }

  hasLogo(c: BrandChannel): boolean {
    return c.watermark?.kind === 'Logo' && !this.broken().has(`logo:${c.id}`);
  }

  markBroken(key: string): void {
    this.broken.update((s) => new Set(s).add(key));
  }

  logoUrl(c: BrandChannel): string {
    // The asset id busts the cache when the logo is replaced.
    return `${this.api.globalLogoUrl(c.id)}&v=${encodeURIComponent(c.watermark?.logoAssetId ?? '')}`;
  }

  initial(name: string): string {
    return (Array.from(name.trim())[0] ?? '?').toUpperCase();
  }

  /** Only a real channel id becomes a link. */
  youTubeUrl(c: BrandChannel): string | null {
    return c.youTubeChannelId && /^UC[A-Za-z0-9_-]{22}$/.test(c.youTubeChannelId)
      ? `https://www.youtube.com/channel/${c.youTubeChannelId}`
      : null;
  }

  safeHref(url: string | null | undefined): string | null {
    return url?.startsWith('https://') ? url : null;
  }

  handleOf(c: BrandChannel): string {
    return c.youTubeChannelHandle || c.youTubeChannelTitle || 'YouTube';
  }

  watermarkLabel(r: ChannelRow): string {
    return r.watermark === 'logo' ? 'Logo' : r.watermark === 'text' ? 'Text mark' : 'No watermark';
  }

  endCardLabel(r: ChannelRow): string {
    return r.endCard === 'none' ? 'No end card' : `End card: ${r.endCard}`;
  }

  usageShare(r: ChannelRow): number {
    return Math.round(((r.projects ?? 0) / this.maxProjects()) * 100);
  }

  linkParams(c: BrandChannel): Record<string, string> | null {
    return c.isDefault ? null : { channel: c.id };
  }

  keyFor(channelId: string, destinationId: string): LiveStreamKeyStatus | undefined {
    return this.liveSetup()?.channels.find((c) => c.id === channelId)?.keys.find((k) => k.destinationId === destinationId);
  }

  // -------------------------------------------------------------------------------- YouTube

  connectYouTube(): void {
    if (this.connecting()) return;
    this.connecting.set(true);
    this.actionError.set(null);
    this.youtube.startConnect('/admin/channels').subscribe({
      next: (url) => {
        if (url.startsWith('https://accounts.google.com/')) window.location.assign(url);
        else { this.connecting.set(false); this.actionError.set('The server returned an unexpected sign-in address.'); }
      },
      error: (e: unknown) => { this.connecting.set(false); this.actionError.set(messageOf(e)); },
    });
  }

  syncFromYouTube(): void {
    if (this.syncing()) return;
    this.syncing.set(true);
    this.actionError.set(null);
    this.run(this.api.syncBrandChannelsFromYouTube(), (r) => {
      this.syncing.set(false);
      if (!r.ok) { this.actionError.set(`Couldn’t sync with YouTube: ${r.message}`); return; }
      this.channels.set(r.value.channels);
      this.syncReport.set(r.value);
      this.loadUsage();
      this.loadYouTube();
      const changed = r.value.created.length + r.value.renamed.length;
      this.announce(changed > 0
        ? `Synced with YouTube: ${r.value.created.length} added, ${r.value.renamed.length} renamed.`
        : r.value.failed.length === 0 ? 'Everything already matches YouTube.' : 'Sync finished with problems.');
    });
  }

  // ------------------------------------------------------------------------------------- add

  toggleAdd(): void {
    if (this.addOpen()) { this.closeAdd(); return; }
    this.addError.set(null);
    this.addOpen.set(true);
  }

  closeAdd(): void {
    this.addOpen.set(false);
    this.addError.set(null);
  }

  canCreate(): boolean {
    const c = this.newCheck();
    return !c.empty && !c.error && !this.mutating() && this.channels().length < MAX_CHANNELS;
  }

  create(): void {
    if (!this.canCreate()) return;
    const name = this.newCheck().name;
    const from = this.copyFrom();
    this.addError.set(null);
    this.addChannel(name, from, () => this.newName.set(''), (m) => this.addError.set(m),
      `Channel “${name}” added - set its logo and end card from its row.`);
  }

  duplicate(c: BrandChannel): void {
    this.menuId.set(null);
    if (this.mutating() || this.channels().length >= MAX_CHANNELS) return;
    const name = uniqueCopyName(c.name, new Set(this.channels().map((x) => x.name.trim().toLowerCase())));
    this.addChannel(name, c.id, () => undefined, (m) => this.actionError.set(`Couldn’t duplicate “${c.name}”: ${m}`),
      `“${name}” created with ${c.name}’s watermark, end card and publishing defaults.`);
  }

  private addChannel(
    name: string, fromId: string, onDone: () => void, onFail: (message: string) => void, message: string,
  ): void {
    const source = this.channels().find((c) => c.id === fromId) ?? this.channels().find((c) => c.isDefault);
    const tempId = `pending-${++this.seq}`;
    this.mutate({
      pending: [tempId],
      optimistic: () => this.channels.update((l) => [...l, {
        id: tempId, name, isDefault: false, watermark: source?.watermark ?? null, outro: source?.outro ?? null,
      }]),
      request: this.api.createBrandChannel(name, fromId),
      done: (list) => {
        onDone();
        const created = list.find((c) => c.name === name);
        if (created) this.revealRow(created.id);
        this.announce(message);
      },
      fail: onFail,
    });
  }

  // ----------------------------------------------------------------------------------- panels

  private open(kind: PanelKind, c: BrandChannel): void {
    this.menuId.set(null);
    this.removingKey.set(null);
    this.panel.set({ kind, id: c.id, error: null });
  }

  setPanelError(error: string | null): void {
    this.panel.update((p) => (p ? { ...p, error } : p));
  }

  cancelPanel(): void {
    const p = this.panel();
    if (!p) return;
    this.panel.set(null);
    this.removingKey.set(null);
    this.focusRowMenu(p.id);
  }

  // ---------------------------------------------------------------------------------- rename

  startRename(c: BrandChannel): void {
    this.renameValue.set(c.name);
    this.open('rename', c);
  }

  canRename(): boolean {
    const c = this.renameCheck();
    return !c.empty && !c.error && !this.mutating();
  }

  saveRename(c: BrandChannel): void {
    if (!this.canRename()) return;
    const name = this.renameCheck().name;
    if (name === c.name) { this.cancelPanel(); return; }
    this.mutate({
      pending: [c.id],
      optimistic: () => {
        this.panel.set(null);
        this.channels.update((l) => l.map((x) => (x.id === c.id ? { ...x, name } : x)));
      },
      request: this.api.renameBrandChannel(c.id, name),
      done: () => { this.announce(`Renamed “${c.name}” to “${name}”.`); this.focusRowMenu(c.id); },
      // The old name is back; the editor opens again with what was typed and the reason.
      fail: (m) => this.panel.set({ kind: 'rename', id: c.id, error: m }),
    });
  }

  // ----------------------------------------------------------------------------- make default

  askDefault(c: BrandChannel): void {
    this.open('default', c);
  }

  confirmDefault(c: BrandChannel): void {
    if (this.mutating()) return;
    const previous = this.channels().find((x) => x.isDefault)?.name ?? 'Default';
    this.mutate({
      pending: [c.id, DEFAULT_BRAND_CHANNEL],
      optimistic: () => {
        this.panel.set(null);
        this.channels.update((l) => swapWithDefault(l, c.id));
        this.usage.update((u) => (u ? swapUsage(u, c.id, DEFAULT_BRAND_CHANNEL) : u));
        this.liveSetup.update((s) => (s ? swapLiveKeys(s, c.id) : s));
      },
      request: this.api.makeDefaultBrandChannel(c.id),
      done: () => {
        // Stream keys moved with the channels, so their per-id status has to be read again.
        this.loadLive();
        this.announce(`“${c.name}” is now the default channel; “${previous}” is a normal channel.`);
        this.revealRow(DEFAULT_BRAND_CHANNEL);
      },
      fail: (m) => this.panel.set({ kind: 'default', id: c.id, error: m }),
    });
  }

  // ------------------------------------------------------------------------------------ delete

  askDelete(c: BrandChannel): void {
    // The default can only go once another channel is picked to take its place.
    this.moveTo.set(c.isDefault ? (this.byName().find((x) => x.id !== c.id)?.id ?? DEFAULT_BRAND_CHANNEL) : DEFAULT_BRAND_CHANNEL);
    this.open('delete', c);
  }

  confirmDelete(c: BrandChannel): void {
    const info = this.deleteInfo();
    if (!info || !info.destination || this.mutating()) return;
    const target = info.destination;
    const moved = info.projects;
    this.mutate({
      optimistic: () => {
        this.panel.set(null);
        this.channels.update((l) => withoutChannel(l, c, target.id));
        this.usage.update((u) => (u ? usageAfterDelete(u, c, target.id, DEFAULT_BRAND_CHANNEL) : u));
      },
      request: this.api.deleteBrandChannel(c.id, target.id),
      done: () => {
        this.loadLive();
        this.announce(c.isDefault
          ? `Deleted “${c.name}”; “${target.name}” is now the default.`
          : moved > 0
            ? `Deleted “${c.name}”; ${plural(moved, 'project')} moved to ${target.name}.`
            : `Deleted “${c.name}”.`);
      },
      fail: (m) => this.panel.set({ kind: 'delete', id: c.id, error: m }),
    });
  }

  // -------------------------------------------------------------------------- picture as logo

  askLogo(c: BrandChannel): void {
    this.open('logo', c);
  }

  confirmLogo(c: BrandChannel): void {
    if (this.mutating()) return;
    this.mutating.set(true);
    this.run(this.api.useYouTubePictureAsLogo(c.isDefault ? null : c.id), (r) => {
      this.mutating.set(false);
      if (!r.ok) { this.setPanelError(r.message); return; }
      this.channels.update((l) => l.map((x) => (x.id === c.id ? { ...x, watermark: r.value } : x)));
      this.broken.update((s) => { const n = new Set(s); n.delete(`logo:${c.id}`); return n; });
      this.panel.set(null);
      this.announce(`“${c.name}” now uses its YouTube picture as the watermark logo.`);
      this.focusRowMenu(c.id);
    });
  }

  // ------------------------------------------------------------------------------ stream keys

  openKeys(c: BrandChannel): void {
    this.open('keys', c);
  }

  toggleKeys(c: BrandChannel): void {
    const p = this.panel();
    if (p?.kind === 'keys' && p.id === c.id) this.cancelPanel();
    else this.openKeys(c);
  }

  saveKey(c: BrandChannel, destinationId: string, input: HTMLInputElement): void {
    const key = input.value.trim();
    if (!key || this.keyBusy()) return;
    this.keyBusy.set(destinationId);
    this.setPanelError(null);
    this.run(this.live.saveKey(c.id, destinationId, key), (r) => {
      this.keyBusy.set(null);
      if (!r.ok) { this.setPanelError(r.message); return; }
      input.value = '';
      this.loadLive();
      this.announce(`Stream key ${r.value.masked} saved for “${c.name}”.`);
    });
  }

  removeKey(c: BrandChannel, destinationId: string): void {
    if (this.keyBusy()) return;
    this.keyBusy.set(destinationId);
    this.setPanelError(null);
    this.run(this.live.deleteKey(c.id, destinationId), (r) => {
      this.keyBusy.set(null);
      this.removingKey.set(null);
      if (!r.ok) { this.setPanelError(r.message); return; }
      this.loadLive();
      this.announce(`Stream key removed from “${c.name}”.`);
    });
  }

  // ------------------------------------------------------------------------------------- copy

  async copyId(c: BrandChannel, youTube = false): Promise<void> {
    this.menuId.set(null);
    const text = youTube ? (c.youTubeChannelId ?? '') : c.id;
    const ok = !!text && await copyText(text);
    this.flashToast(ok ? `${youTube ? 'YouTube channel ID' : 'Channel ID'} copied: ${text}` : 'Couldn’t copy - select the text and copy it by hand.');
    this.focusRowMenu(c.id);
  }

  private flashToast(message: string): void {
    this.toast.set(message);
    this.liveMessage.set(message);
    this.after(3000, () => { if (this.toast() === message) this.toast.set(null); });
  }

  // ---------------------------------------------------------------------------------- plumbing

  /**
   * Applies a change to the list straight away, asks the server, and puts everything back (with
   * the reason) if it refuses. One change at a time, so a rollback can never undo a newer one.
   */
  private mutate(opts: {
    pending?: string[];
    optimistic: () => void;
    request: Observable<BrandChannel[]>;
    done: (list: BrandChannel[]) => void;
    fail: (message: string) => void;
  }): void {
    const snapshot = { channels: this.channels(), usage: this.usage(), live: this.liveSetup() };
    this.mutating.set(true);
    this.pending.set(new Set(opts.pending ?? []));
    opts.optimistic();
    this.run(opts.request, (r) => {
      this.mutating.set(false);
      this.pending.set(new Set());
      if (r.ok) {
        this.channels.set(r.value);
        this.loadUsage();
        opts.done(r.value);
      } else {
        this.channels.set(snapshot.channels);
        this.usage.set(snapshot.usage);
        this.liveSetup.set(snapshot.live);
        opts.fail(r.message);
      }
    });
  }

  private announce(message: string): void {
    this.liveMessage.set(message);
    this.status.notify([message]);
  }
}
