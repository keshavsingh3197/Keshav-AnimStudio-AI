import { DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';

import {
  YouTubeChannelOverview, YouTubeDashboard, YouTubePublication, YouTubeUpload, YouTubeVideoStats,
  isUploadFinished, needsAttention,
} from '../../core/models/youtube.models';
import { YouTubePublishService } from '../../core/services/youtube-publish.service';
import { AuthService } from '../../core/services/auth.service';

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

type VideoFilter = 'all' | 'public' | 'unlisted' | 'private' | 'attention';
type VideoSort = 'newest' | 'views' | 'likes';
export type DashboardViewMode = 'list' | 'grid';

interface VideoRow {
  video: YouTubePublication;
  stats: YouTubeVideoStats | undefined;
  privacy: string;
}

const NO_STATS: Record<string, YouTubeVideoStats> = {};

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

  readonly filter = signal<VideoFilter>('all');
  readonly sort = signal<VideoSort>('newest');
  readonly channelFilter = signal<string>('all');
  readonly query = signal('');
  readonly viewMode = signal<DashboardViewMode>('list');

  // Video preview player modal
  readonly previewVideo = signal<YouTubePublication | null>(null);
  readonly previewEmbedUrl = computed<SafeResourceUrl | null>(() => {
    const v = this.previewVideo();
    if (!v) return null;
    return VIDEO_ID.test(v.videoId)
      ? this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube-nocookie.com/embed/${v.videoId}?autoplay=1&rel=0`)
      : null;
  });

  openPreview(v: YouTubePublication): void {
    this.previewVideo.set(v);
  }

  closePreview(): void {
    this.previewVideo.set(null);
  }

  setViewMode(mode: DashboardViewMode): void {
    this.viewMode.set(mode);
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
    const q = this.query().trim().toLowerCase();

    const rows = this.videos()
      .map((video) => ({ video, stats: stats[video.videoId], privacy: privacyOf(video) }))
      .filter((r) => channel === 'all' || r.video.channelId === channel)
      .filter((r) => filter === 'all'
        || (filter === 'attention' ? needsAttention(r.video) : r.privacy === filter))
      .filter((r) => !q || r.video.title.toLowerCase().includes(q) || r.video.videoId.toLowerCase().includes(q));

    const sort = this.sort();
    if (sort === 'views') rows.sort((a, b) => (b.stats?.views ?? -1) - (a.stats?.views ?? -1));
    else if (sort === 'likes') rows.sort((a, b) => (b.stats?.likes ?? -1) - (a.stats?.likes ?? -1));
    // 'newest' is the API's order already.
    return rows;
  });

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
