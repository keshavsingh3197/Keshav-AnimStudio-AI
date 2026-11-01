import { DatePipe } from '@angular/common';
import { Component, ElementRef, HostListener, OnDestroy, OnInit, computed, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';

import {
  YouTubeChannelOverview, YouTubeDashboard, YouTubePublication, YouTubeUpload, YouTubeVideoStats,
  isUploadFinished, needsAttention,
} from '../../core/models/youtube.models';
import { YouTubePublishService } from '../../core/services/youtube-publish.service';
import { AuthService } from '../../core/services/auth.service';
import { csvCell } from './csv';

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

type VideoFilter = 'all' | 'public' | 'unlisted' | 'private' | 'attention';
export type VideoSort = 'newest' | 'oldest' | 'views' | 'likes' | 'comments' | 'engagement' | 'title';
export type DashboardViewMode = 'list' | 'grid' | 'table';
export type FormatFilter = 'all' | 'long' | 'short';
export type RangeFilter = 'all' | '7' | '30' | '90' | '365';

export interface VideoRow {
  video: YouTubePublication;
  stats: YouTubeVideoStats | undefined;
  privacy: string;
  isShort: boolean;
  publishedMs: number;
  /** (likes + comments) as a percentage of views; null until YouTube reports views. */
  engagement: number | null;
}

const NO_STATS: Record<string, YouTubeVideoStats> = {};

/** Rows per page: enough to scan, few enough that hundreds of videos don't make one endless list. */
export const PAGE_SIZES = [12, 24, 48, 100] as const;
const DEFAULT_PAGE_SIZE = 24;

const PREFS_KEY = 'animstudio.youtube.dashboard';
const SORTS: readonly VideoSort[] = ['newest', 'oldest', 'views', 'likes', 'comments', 'engagement', 'title'];
const VIEW_MODES: readonly DashboardViewMode[] = ['list', 'grid', 'table'];

interface Prefs {
  viewMode: DashboardViewMode;
  sort: VideoSort;
  pageSize: number;
  format: FormatFilter;
  range: RangeFilter;
}

const DEFAULT_PREFS: Prefs = { viewMode: 'list', sort: 'newest', pageSize: DEFAULT_PAGE_SIZE, format: 'all', range: 'all' };

function loadPrefs(): Prefs {
  try {
    const raw = JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}') as Partial<Prefs>;
    return {
      viewMode: VIEW_MODES.includes(raw.viewMode as DashboardViewMode) ? raw.viewMode! : DEFAULT_PREFS.viewMode,
      sort: SORTS.includes(raw.sort as VideoSort) ? raw.sort! : DEFAULT_PREFS.sort,
      pageSize: (PAGE_SIZES as readonly number[]).includes(raw.pageSize as number) ? raw.pageSize! : DEFAULT_PREFS.pageSize,
      format: ['all', 'long', 'short'].includes(raw.format as string) ? raw.format! : DEFAULT_PREFS.format,
      range: ['all', '7', '30', '90', '365'].includes(raw.range as string) ? raw.range! : DEFAULT_PREFS.range,
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

/**
 * One page for everything published to YouTube from the app: each connected channel with its
 * subscriber and view counts, what is uploading right now, and every uploaded video with its
 * links and numbers. Counters come from YouTube via the API (cached there for a few minutes).
 */
@Component({
  selector: 'app-youtube-dashboard',
  imports: [DatePipe, FormsModule, RouterLink],
  templateUrl: './youtube-dashboard.component.html',
  styleUrl: './youtube-dashboard.component.css',
})
export class YouTubeDashboardComponent implements OnInit, OnDestroy {
  private readonly api = inject(YouTubePublishService);
  private readonly sanitizer = inject(DomSanitizer);
  readonly auth = inject(AuthService);
  private pollTimer: ReturnType<typeof setTimeout> | null = null;

  readonly data = signal<YouTubeDashboard | null>(null);
  readonly uploads = signal<YouTubeUpload[]>([]);
  readonly loading = signal(true);
  readonly refreshing = signal(false);
  readonly connecting = signal(false);
  readonly error = signal<string | null>(null);
  readonly copiedId = signal<string | null>(null);

  private readonly prefs = loadPrefs();
  readonly pageSizes = PAGE_SIZES;
  readonly searchBox = viewChild<ElementRef<HTMLInputElement>>('searchBox');

  readonly filter = signal<VideoFilter>('all');
  readonly sort = signal<VideoSort>(this.prefs.sort);
  readonly channelFilter = signal<string>('all');
  readonly format = signal<FormatFilter>(this.prefs.format);
  readonly range = signal<RangeFilter>(this.prefs.range);
  readonly query = signal('');
  readonly viewMode = signal<DashboardViewMode>(this.prefs.viewMode);
  readonly pageSize = signal<number>(this.prefs.pageSize);
  readonly page = signal(0);
  readonly selected = signal<ReadonlySet<string>>(new Set());
  readonly notice = signal<string | null>(null);

  // Video preview player modal
  readonly previewVideo = signal<YouTubePublication | null>(null);
  readonly previewEmbedUrl = computed<SafeResourceUrl | null>(() => {
    const v = this.previewVideo();
    if (!v) return null;
    return VIDEO_ID.test(v.videoId)
      ? this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube-nocookie.com/embed/${v.videoId}?autoplay=1&rel=0`)
      : null;
  });

  /** Where the open preview sits in the filtered list, so it can step to the neighbours. */
  readonly previewPosition = computed(() => {
    const v = this.previewVideo();
    return v ? this.rows().findIndex((r) => r.video.id === v.id) : -1;
  });
  readonly previewRow = computed(() => {
    const v = this.previewVideo();
    return v ? this.rows().find((r) => r.video.id === v.id) ?? null : null;
  });

  openPreview(v: YouTubePublication): void {
    this.previewVideo.set(v);
  }

  closePreview(): void {
    this.previewVideo.set(null);
  }

  stepPreview(delta: number): void {
    const rows = this.rows();
    const i = this.previewPosition();
    if (i < 0) return;
    const next = rows[i + delta];
    if (next) this.previewVideo.set(next.video);
  }

  setViewMode(mode: DashboardViewMode): void {
    this.viewMode.set(mode);
    this.savePrefs();
  }

  setFilter(f: VideoFilter): void {
    this.filter.set(f);
    this.page.set(0);
  }

  setQuery(q: string): void {
    this.query.set(q);
    this.page.set(0);
  }

  setChannel(id: string): void {
    this.channelFilter.set(id);
    this.page.set(0);
  }

  setFormat(f: FormatFilter): void {
    this.format.set(f);
    this.page.set(0);
    this.savePrefs();
  }

  setRange(r: RangeFilter): void {
    this.range.set(r);
    this.page.set(0);
    this.savePrefs();
  }

  setSort(s: VideoSort): void {
    this.sort.set(s);
    this.page.set(0);
    this.savePrefs();
  }

  setPageSize(n: number): void {
    this.pageSize.set(Number(n));
    this.page.set(0);
    this.savePrefs();
  }

  /** Column headers in the table: a second click on the same column flips the date order. */
  sortByColumn(column: 'title' | 'date' | 'views' | 'likes' | 'comments' | 'engagement'): void {
    const current = this.sort();
    if (column === 'date') this.setSort(current === 'newest' ? 'oldest' : 'newest');
    else this.setSort(column);
  }

  readonly hasActiveFilters = computed(() =>
    this.filter() !== 'all' || this.query().trim() !== '' || this.channelFilter() !== 'all'
    || this.format() !== 'all' || this.range() !== 'all');

  resetFilters(): void {
    this.filter.set('all');
    this.query.set('');
    this.channelFilter.set('all');
    this.format.set('all');
    this.range.set('all');
    this.page.set(0);
    this.savePrefs();
  }

  private savePrefs(): void {
    const prefs: Prefs = {
      viewMode: this.viewMode(), sort: this.sort(), pageSize: this.pageSize(), format: this.format(), range: this.range(),
    };
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch { /* private mode: preferences just aren't remembered */ }
  }

  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent): void {
    const target = e.target as HTMLElement | null;
    const typing = !!target && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));
    if (this.previewVideo()) {
      if (e.key === 'Escape') this.closePreview();
      else if (e.key === 'ArrowLeft' && !typing) this.stepPreview(-1);
      else if (e.key === 'ArrowRight' && !typing) this.stepPreview(1);
      return;
    }
    if (e.key === '/' && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const box = this.searchBox()?.nativeElement;
      if (box) { e.preventDefault(); box.focus(); box.select(); }
    }
  }

  readonly channels = computed(() => this.data()?.channels ?? []);
  readonly videos = computed(() => this.data()?.videos ?? []);
  readonly videoStats = computed(() => this.data()?.videoStats ?? NO_STATS);
  readonly activeUploads = computed(() => this.uploads().filter((u) => !isUploadFinished(u)));

  readonly totals = computed(() => {
    const stats = this.videoStats();
    let views = 0, likes = 0, comments = 0, attention = 0, live = 0;
    for (const v of this.videos()) {
      const s = stats[v.videoId];
      views += s?.views ?? 0;
      likes += s?.likes ?? 0;
      comments += s?.comments ?? 0;
      if (needsAttention(v)) attention++;
      else if (privacyOf(v) === 'public') live++;
    }
    const subscribers = this.channels().reduce((sum, c) => sum + (c.subscribers ?? 0), 0);
    return { uploaded: this.videos().length, views, likes, comments, attention, live, subscribers };
  });

  readonly counts = computed(() => {
    const c = { all: 0, public: 0, unlisted: 0, private: 0, attention: 0 };
    for (const v of this.videos()) {
      c.all++;
      if (needsAttention(v)) c.attention++;
      const p = privacyOf(v);
      if (p === 'public' || p === 'unlisted' || p === 'private') c[p]++;
    }
    return c;
  });

  readonly filters = computed<{ key: VideoFilter; label: string; n: number }[]>(() => {
    const c = this.counts();
    return [
      { key: 'all', label: 'All', n: c.all },
      { key: 'public', label: 'Public', n: c.public },
      { key: 'unlisted', label: 'Unlisted', n: c.unlisted },
      { key: 'private', label: 'Private', n: c.private },
      { key: 'attention', label: 'Needs attention', n: c.attention },
    ];
  });

  readonly rows = computed<VideoRow[]>(() => {
    const stats = this.videoStats();
    const filter = this.filter();
    const channel = this.channelFilter();
    const format = this.format();
    const days = this.range() === 'all' ? 0 : Number(this.range());
    const cutoff = days > 0 ? Date.now() - days * 86_400_000 : 0;
    const q = this.query().trim().toLowerCase();

    const rows = this.videos()
      .map((video): VideoRow => {
        const s = stats[video.videoId];
        const views = s?.views ?? null;
        return {
          video,
          stats: s,
          privacy: privacyOf(video),
          isShort: this.isShortVideo(video),
          publishedMs: Date.parse(video.publishedAt) || 0,
          engagement: views && views > 0 ? (((s?.likes ?? 0) + (s?.comments ?? 0)) / views) * 100 : null,
        };
      })
      .filter((r) => channel === 'all' || r.video.channelId === channel)
      .filter((r) => filter === 'all'
        || (filter === 'attention' ? needsAttention(r.video) : r.privacy === filter))
      .filter((r) => format === 'all' || (format === 'short' ? r.isShort : !r.isShort))
      .filter((r) => cutoff === 0 || r.publishedMs >= cutoff)
      .filter((r) => !q || r.video.title.toLowerCase().includes(q) || r.video.videoId.toLowerCase().includes(q));

    const by = (pick: (r: VideoRow) => number | null | undefined) =>
      rows.sort((a, b) => (pick(b) ?? -1) - (pick(a) ?? -1));
    switch (this.sort()) {
      case 'views': by((r) => r.stats?.views); break;
      case 'likes': by((r) => r.stats?.likes); break;
      case 'comments': by((r) => r.stats?.comments); break;
      case 'engagement': by((r) => r.engagement); break;
      case 'oldest': rows.sort((a, b) => a.publishedMs - b.publishedMs); break;
      case 'title': rows.sort((a, b) => a.video.title.localeCompare(b.video.title, undefined, { sensitivity: 'base' })); break;
      default: rows.sort((a, b) => b.publishedMs - a.publishedMs);
    }
    return rows;
  });

  readonly pageCount = computed(() => Math.max(1, Math.ceil(this.rows().length / this.pageSize())));
  /** The page actually shown; clamped so a narrower filter never leaves an empty page. */
  readonly pageIndex = computed(() => Math.min(this.page(), this.pageCount() - 1));
  readonly pageRows = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.rows().slice(start, start + this.pageSize());
  });
  readonly rangeLabel = computed(() => {
    const total = this.rows().length;
    if (total === 0) return '0';
    const start = this.pageIndex() * this.pageSize();
    return `${start + 1}–${Math.min(start + this.pageSize(), total)} of ${total}`;
  });

  /** Page buttons: first, last and the neighbours of the current page; null is a gap. */
  readonly pageButtons = computed<(number | null)[]>(() => {
    const last = this.pageCount() - 1;
    const cur = this.pageIndex();
    const wanted = [...new Set([0, cur - 1, cur, cur + 1, last])].filter((p) => p >= 0 && p <= last).sort((a, b) => a - b);
    const out: (number | null)[] = [];
    wanted.forEach((p, i) => {
      if (i > 0 && p - wanted[i - 1] > 1) out.push(null);
      out.push(p);
    });
    return out;
  });

  /** What the filtered list adds up to, so a narrowed view still answers "how are these doing?". */
  readonly summary = computed(() => {
    let views = 0, likes = 0, comments = 0, withViews = 0, engagementSum = 0, peak = 0;
    for (const r of this.rows()) {
      views += r.stats?.views ?? 0;
      likes += r.stats?.likes ?? 0;
      comments += r.stats?.comments ?? 0;
      peak = Math.max(peak, r.stats?.views ?? 0);
      if (r.engagement !== null) { withViews++; engagementSum += r.engagement; }
    }
    const n = this.rows().length;
    return {
      count: n, views, likes, comments, peak,
      avgViews: n > 0 ? Math.round(views / n) : 0,
      avgEngagement: withViews > 0 ? engagementSum / withViews : null,
    };
  });

  // --- selection

  readonly selectedRows = computed(() => {
    const picked = this.selected();
    return picked.size === 0 ? [] : this.rows().filter((r) => picked.has(r.video.id));
  });
  /** Only what the current filters show: a video filtered out is never exported by accident. */
  readonly selectedCount = computed(() => this.selectedRows().length);
  readonly pageAllSelected = computed(() => {
    const rows = this.pageRows();
    const picked = this.selected();
    return rows.length > 0 && rows.every((r) => picked.has(r.video.id));
  });
  readonly pageSomeSelected = computed(() => !this.pageAllSelected() && this.pageRows().some((r) => this.selected().has(r.video.id)));

  toggle(id: string): void {
    this.selected.update((s) => {
      const next = new Set(s);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  togglePage(): void {
    const all = this.pageAllSelected();
    this.selected.update((s) => {
      const next = new Set(s);
      for (const r of this.pageRows()) { if (all) next.delete(r.video.id); else next.add(r.video.id); }
      return next;
    });
  }

  selectAllFiltered(): void {
    this.selected.set(new Set(this.rows().map((r) => r.video.id)));
  }

  clearSelection(): void {
    this.selected.set(new Set());
  }

  copySelectedLinks(): void {
    const links = this.selectedRows().map((r) => r.video.videoUrl).join('\n');
    if (!links) return;
    this.flash(navigator.clipboard
      ? navigator.clipboard.writeText(links).then(() => `Copied ${this.selectedCount()} link${this.selectedCount() === 1 ? '' : 's'}.`,
        () => 'The browser did not allow copying. Allow clipboard access for this site and try again.')
      : Promise.resolve('The browser did not allow copying.'));
  }

  /** Exports the selection, or every video the filters show when nothing is selected. */
  exportCsv(): void {
    const rows = this.selectedCount() > 0 ? this.selectedRows() : this.rows();
    if (rows.length === 0) return;
    const header = ['Title', 'Video ID', 'URL', 'Channel', 'Published', 'Privacy', 'Health', 'Format', 'Views', 'Likes', 'Comments', 'Engagement %'];
    const lines = rows.map((r) => [
      r.video.title, r.video.videoId, r.video.videoUrl, r.video.channelTitle, r.video.publishedAt, r.privacy,
      this.healthLabel(r.video).text, r.isShort ? 'Short' : 'Video',
      r.stats?.views ?? '', r.stats?.likes ?? '', r.stats?.comments ?? '',
      r.engagement === null ? '' : r.engagement.toFixed(2),
    ].map(csvCell).join(','));
    const blob = new Blob(['﻿' + [header.join(','), ...lines].join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `youtube-videos-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    this.flash(Promise.resolve(`Exported ${rows.length} video${rows.length === 1 ? '' : 's'} to CSV.`));
  }

  private flash(message: Promise<string>): void {
    void message.then((m) => {
      this.notice.set(m);
      setTimeout(() => { if (this.notice() === m) this.notice.set(null); }, 3000);
    });
  }

  /** 0–100: how this video's views compare with the best one in the current list. */
  viewShare(r: VideoRow): number {
    const peak = this.summary().peak;
    return peak > 0 ? Math.round(((r.stats?.views ?? 0) / peak) * 100) : 0;
  }

  engagementText(r: VideoRow): string {
    return r.engagement === null ? '—' : `${r.engagement.toFixed(r.engagement >= 10 ? 0 : 1)}%`;
  }

  ago(iso: string): string {
    const days = Math.floor((Date.now() - Date.parse(iso)) / 86_400_000);
    if (!Number.isFinite(days) || days < 0) return '';
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 30) return `${days}d ago`;
    if (days < 365) return `${Math.floor(days / 30)}mo ago`;
    return `${Math.floor(days / 365)}y ago`;
  }

  readonly topVideo = computed(() => {
    const stats = this.videoStats();
    let best: YouTubePublication | null = null;
    let bestViews = 0;
    for (const v of this.videos()) {
      const views = stats[v.videoId]?.views ?? 0;
      if (views > bestViews) { best = v; bestViews = views; }
    }
    return best ? { video: best, views: bestViews } : null;
  });

  readonly needsAttention = needsAttention;

  ngOnInit(): void {
    if (this.auth.isAnonymous()) {
      this.loading.set(false);
      return;
    }
    this.load(false);
    this.pollUploads();
  }

  ngOnDestroy(): void {
    if (this.pollTimer) clearTimeout(this.pollTimer);
  }

  load(force: boolean): void {
    if (force) this.refreshing.set(true);
    this.api.dashboard(force).subscribe({
      next: (d) => {
        this.data.set(d);
        this.loading.set(false);
        this.refreshing.set(false);
        this.error.set(null);
        // Health (rejected, removed…) is checked separately; the API skips videos checked recently.
        if (d.configured && d.videos.length > 0) this.refreshHealth(force);
      },
      error: (e: Error) => {
        this.loading.set(false);
        this.refreshing.set(false);
        this.error.set(e.message);
      },
    });
  }

  connect(): void {
    this.connecting.set(true);
    this.api.startConnect('/youtube').subscribe({
      next: (url) => { window.location.href = url; },
      error: (e: Error) => { this.connecting.set(false); this.error.set(e.message); },
    });
  }

  copy(video: YouTubePublication): void {
    void navigator.clipboard?.writeText(video.videoUrl).then(() => {
      this.copiedId.set(video.id);
      setTimeout(() => { if (this.copiedId() === video.id) this.copiedId.set(null); }, 1500);
    });
  }

  channelTitle(channelId: string): string {
    return this.channels().find((c) => c.channelId === channelId)?.channelTitle
      ?? this.videos().find((v) => v.channelId === channelId)?.channelTitle
      ?? channelId;
  }

  /** Channels that have app uploads, including ones since disconnected. */
  readonly filterChannels = computed(() => {
    const ids = new Set(this.videos().map((v) => v.channelId));
    return [...ids].map((id) => ({ id, title: this.channelTitle(id) }));
  });

  healthLabel(v: YouTubePublication): { text: string; tone: string } {
    switch (v.health) {
      case 'Ok': return { text: 'Live', tone: 'ok' };
      case 'Processing': return { text: 'Processing', tone: 'warn' };
      case 'Issue': return { text: 'Needs attention', tone: 'err' };
      case 'Removed': return { text: 'Removed', tone: 'err' };
      default: return { text: 'Not checked', tone: '' };
    }
  }

  subscriberText(c: YouTubeChannelOverview): string {
    if (c.subscribersHidden) return 'Hidden';
    return compact(c.subscribers);
  }

  isShortVideo(v: YouTubePublication): boolean {
    return /#shorts/i.test(v.title) || v.videoUrl.includes('/shorts/');
  }

  compact = compact;
  full = full;

  private refreshHealth(force: boolean): void {
    this.api.refreshVideos(undefined, force).subscribe({
      next: (videos) => this.data.update((d) => (d ? { ...d, videos } : d)),
      // The numbers already loaded; a failed health check isn't worth a banner.
      error: () => undefined,
    });
  }

  private pollUploads(): void {
    this.api.uploads().subscribe({
      next: (list) => {
        const wasActive = this.activeUploads().length;
        this.uploads.set(list);
        // An upload just finished: its video now has a record, so show it.
        if (wasActive > this.activeUploads().length) this.load(false);
        this.pollTimer = setTimeout(() => this.pollUploads(), this.activeUploads().length > 0 ? 3000 : 20000);
      },
      error: () => { this.pollTimer = setTimeout(() => this.pollUploads(), 30000); },
    });
  }
}

/** What YouTube last said, falling back to what it was uploaded as. */
function privacyOf(v: YouTubePublication): string {
  return (v.privacyStatus || v.privacy || '').toLowerCase();
}

const compactFormat = new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 });
const fullFormat = new Intl.NumberFormat();

function compact(n: number | null | undefined): string {
  return n === null || n === undefined ? '—' : compactFormat.format(n);
}

function full(n: number | null | undefined): string {
  return n === null || n === undefined ? 'Not available' : fullFormat.format(n);
}
