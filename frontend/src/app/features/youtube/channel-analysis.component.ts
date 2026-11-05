import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { ApiFailure } from '../../core/interceptors/api-error.interceptor';
import { AnalyzedVideo, ChannelAnalysis, ChannelVideoIdea } from '../../core/models/youtube-analysis.models';
import { YouTubeAnalysisService } from '../../core/services/youtube-analysis.service';
import { csvCell } from './csv';
import { YtNavComponent } from './yt-nav.component';

type Busy = 'refresh' | 'plan' | 'fresh';
type VideoFilter = 'all' | 'short' | 'long';
type SortKey = 'date' | 'views' | 'perDay' | 'engagement' | 'length';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/**
 * Channel analysis: how each connected channel's recent videos are doing for their age, what that shows, and a plan for
 * what to make next. It opens from what the server kept from last time - no call to YouTube or a model - and asks again
 * only when the person refreshes the numbers or wants a plan for new ones.
 */
@Component({
  selector: 'app-channel-analysis',
  imports: [RouterLink, DatePipe, DecimalPipe, YtNavComponent],
  templateUrl: './channel-analysis.component.html',
  styleUrls: ['./channel-analysis.component.css'],
})
export class ChannelAnalysisComponent {
  private readonly analysis = inject(YouTubeAnalysisService);
  private readonly router = inject(Router);

  readonly channels = signal<ChannelAnalysis[] | null>(null);
  readonly selectedId = signal<string | null>(null);
  readonly busy = signal<Busy | null>(null);
  readonly error = signal<string | null>(null);
  readonly goal = signal('');
  readonly filter = signal<VideoFilter>('all');

  readonly current = computed<ChannelAnalysis | null>(() => {
    const all = this.channels() ?? [];
    return all.find((c) => c.channelId === this.selectedId()) ?? all[0] ?? null;
  });

  readonly query = signal('');
  readonly sortKey = signal<SortKey>('date');
  readonly sortDesc = signal(true);
  readonly copied = signal(false);
  readonly page = signal(0);
  readonly pageSize = signal(25);
  readonly pageSizes = [10, 25, 50, 100];
  /** The upload picked in the trend chart, shown in a detail panel under it. */
  readonly pickedId = signal<string | null>(null);

  readonly videos = computed(() => {
    const filter = this.filter();
    const q = this.query().trim().toLowerCase();
    const key = this.sortKey();
    const dir = this.sortDesc() ? -1 : 1;
    let list = this.current()?.videos ?? [];
    if (filter !== 'all') list = list.filter((v) => (filter === 'short') === v.isShort);
    if (q) list = list.filter((v) => v.title.toLowerCase().includes(q));
    const value = (v: AnalyzedVideo): number => {
      switch (key) {
        case 'views': return v.views ?? -1;
        case 'perDay': return v.viewsPerDay;
        case 'engagement': return v.engagement ?? -1;
        case 'length': return v.durationSeconds ?? -1;
        default: return v.publishedAtUtc ? Date.parse(v.publishedAtUtc) : Number.MAX_SAFE_INTEGER;
      }
    };
    return [...list].sort((a, b) => (value(a) - value(b)) * dir);
  });

  /** Totals for what the table currently shows. */
  readonly totals = computed(() => {
    const list = this.videos();
    return {
      count: list.length,
      views: list.reduce((s, v) => s + (v.views ?? 0), 0),
      likes: list.reduce((s, v) => s + (v.likes ?? 0), 0),
      comments: list.reduce((s, v) => s + (v.comments ?? 0), 0),
    };
  });

  /** Typical views a day for each weekday uploads went out on, for the publishing-day chart. */
  readonly weekdays = computed(() => {
    const buckets: number[][] = WEEKDAYS.map(() => []);
    for (const v of this.current()?.videos ?? []) {
      if (v.privacy !== 'public' || !v.publishedAtUtc) continue;
      buckets[(new Date(v.publishedAtUtc).getDay() + 6) % 7].push(v.viewsPerDay);
    }
    const medians = buckets.map((b) => {
      if (b.length === 0) return 0;
      const s = [...b].sort((x, y) => x - y);
      const m = Math.floor(s.length / 2);
      return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
    });
    const max = Math.max(...medians, 0);
    if (max === 0) return null;
    return WEEKDAYS.map((label, i) => ({ label, count: buckets[i].length, median: medians[i], pct: Math.round((medians[i] / max) * 100), best: medians[i] === max }));
  });

  /** The newest public uploads, oldest first, as bars of views a day for the trend chart. */
  readonly trend = computed(() => {
    const list = (this.current()?.videos ?? []).filter((v) => v.privacy === 'public' && v.publishedAtUtc).slice(0, 30)
      .sort((a, b) => Date.parse(a.publishedAtUtc!) - Date.parse(b.publishedAtUtc!));
    const median = this.current()?.insights?.medianViewsPerDay ?? 0;
    const max = Math.max(...list.map((v) => v.viewsPerDay), median, 0);
    if (list.length < 3 || max === 0) return null;
    return {
      bars: list.map((v) => ({ video: v, pct: Math.max(3, Math.round((v.viewsPerDay / max) * 100)) })),
      medianPct: Math.round((median / max) * 100),
      median,
      max,
      from: list[0].publishedAtUtc!,
      to: list[list.length - 1].publishedAtUtc!,
    };
  });

  readonly pickedVideo = computed(() => this.current()?.videos.find((v) => v.videoId === this.pickedId()) ?? null);

  /** How far the picked upload is above or below the channel's typical video, in percent. */
  readonly pickedVsTypical = computed(() => {
    const v = this.pickedVideo();
    const median = this.current()?.insights?.medianViewsPerDay ?? 0;
    return v && median > 0 ? Math.round((v.viewsPerDay / median - 1) * 100) : null;
  });

  readonly pageCount = computed(() => Math.max(1, Math.ceil(this.videos().length / this.pageSize())));
  readonly pageIndex = computed(() => Math.min(this.page(), this.pageCount() - 1));
  readonly pageItems = computed(() => {
    const size = this.pageSize();
    return this.videos().slice(this.pageIndex() * size, this.pageIndex() * size + size);
  });
  readonly range = computed(() => {
    const total = this.videos().length;
    const from = total === 0 ? 0 : this.pageIndex() * this.pageSize() + 1;
    return { from, to: Math.min(total, from + this.pageSize() - 1), total };
  });
  /** Page numbers to show, with null where pages are skipped. */
  readonly pageButtons = computed<(number | null)[]>(() => {
    const last = this.pageCount() - 1;
    const at = this.pageIndex();
    const pages = new Set([0, last, at - 1, at, at + 1]);
    const out: (number | null)[] = [];
    let prev = -1;
    for (const p of [...pages].filter((p) => p >= 0 && p <= last).sort((a, b) => a - b)) {
      if (p - prev > 1) out.push(null);
      out.push(p);
      prev = p;
    }
    return out;
  });

  /** The share of the larger median each kind of video gets, for the comparison bars. */
  readonly bars = computed(() => {
    const i = this.current()?.insights;
    if (!i || i.shortsMedianViewsPerDay === null || i.longMedianViewsPerDay === null) return null;
    const max = Math.max(i.shortsMedianViewsPerDay, i.longMedianViewsPerDay, 1);
    return {
      shorts: Math.round((i.shortsMedianViewsPerDay / max) * 100),
      long: Math.round((i.longMedianViewsPerDay / max) * 100),
    };
  });

  constructor() {
    void this.load();
  }

  async load(): Promise<void> {
    this.error.set(null);
    try {
      const all = await firstValueFrom(this.analysis.list());
      this.channels.set(all);
      const current = this.current();
      if (current?.report?.goal && !this.goal()) this.goal.set(current.report.goal);
    } catch (failure: unknown) {
      this.error.set(this.message(failure, 'Your channels could not be loaded.'));
      if (this.channels() === null) this.channels.set([]);
    }
  }

  select(channelId: string): void {
    this.selectedId.set(channelId);
    this.pickedId.set(null);
    this.page.set(0);
    this.query.set('');
    this.goal.set(this.current()?.report?.goal ?? '');
  }

  async refresh(): Promise<void> {
    const channel = this.current();
    if (!channel) return;
    await this.call('refresh', () => firstValueFrom(this.analysis.refresh(channel.channelId)));
  }

  async makePlan(fresh: boolean): Promise<void> {
    const channel = this.current();
    if (!channel) return;
    const goal = this.goal().trim() || null;
    await this.call(fresh ? 'fresh' : 'plan', () => firstValueFrom(this.analysis.plan(channel.channelId, goal, fresh)));
  }

  /** Opens the Story Agent with the idea's title filled in. */
  makeStory(idea: ChannelVideoIdea): void {
    const notes = [idea.why, idea.format === 'short' ? 'Make it a Short: vertical, under a minute.' : null].filter(Boolean).join(' ');
    void this.router.navigate(['/story-agent'], { queryParams: { title: idea.title, notes: notes || null, format: idea.format === 'short' ? 'Vertical' : null } });
  }

  /** Opens the Story Agent to make a sequel of a video that is doing well. */
  followUp(video: AnalyzedVideo): void {
    void this.router.navigate(['/story-agent'], {
      queryParams: { title: `${video.title} - Part 2`, notes: `A follow-up to "${video.title}", which is doing well on the channel. Carry on its story or theme.` },
    });
  }

  sortBy(key: SortKey): void {
    if (this.sortKey() === key) this.sortDesc.update((d) => !d);
    else { this.sortKey.set(key); this.sortDesc.set(true); }
    this.page.set(0);
  }

  setFilter(filter: VideoFilter): void {
    this.filter.set(filter);
    this.page.set(0);
  }

  setQuery(value: string): void {
    this.query.set(value);
    this.page.set(0);
  }

  setPageSize(value: string): void {
    this.pageSize.set(Number(value) || 25);
    this.page.set(0);
  }

  goTo(page: number): void {
    this.page.set(Math.min(Math.max(0, page), this.pageCount() - 1));
  }

  pick(id: string): void {
    this.pickedId.update((cur) => (cur === id ? null : id));
  }

  /** Shows an upload in the table: searches its title and jumps to the first page. */
  findInTable(v: AnalyzedVideo): void {
    this.filter.set('all');
    this.setQuery(v.title);
    document.getElementById('ca-all')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  arrow(key: SortKey): string {
    return this.sortKey() === key ? (this.sortDesc() ? ' \u25BC' : ' \u25B2') : '';
  }

  /** How a video's daily views compare with the channel's typical video. */
  rating(v: AnalyzedVideo): 'hit' | 'ok' | 'low' | null {
    const median = this.current()?.insights?.medianViewsPerDay ?? 0;
    if (v.privacy !== 'public' || median <= 0) return null;
    return v.viewsPerDay >= median * 1.5 ? 'hit' : v.viewsPerDay < median * 0.5 ? 'low' : 'ok';
  }

  exportCsv(): void {
    const c = this.current();
    if (!c) return;
    const head = ['Title', 'URL', 'Published', 'Privacy', 'Type', 'Length (s)', 'Views', 'Views a day', 'Likes', 'Comments', 'Engagement %'];
    const rows = this.videos().map((v) => [v.title, v.url, v.publishedAtUtc, v.privacy, v.isShort ? 'Short' : 'Video', v.durationSeconds, v.views, v.viewsPerDay.toFixed(2), v.likes, v.comments, v.engagement?.toFixed(2)]);
    const csv = [head, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${c.channelTitle.replace(/[^\w-]+/g, '_')}-videos.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /** Copies the plan as plain text. */
  async copyPlan(): Promise<void> {
    const rep = this.current()?.report;
    if (!rep) return;
    const lines = [rep.summary, '', 'What works:', ...rep.whatWorks.map((w) => '- ' + w), '', 'What to fix:', ...rep.whatToFix.map((w) => '- ' + w), '',
      'Do next:', ...rep.suggestions.map((s, i) => `${i + 1}. [${s.priority}] ${s.title}${s.detail ? ' - ' + s.detail : ''}`), '',
      'Next two weeks:', ...rep.plan.map((p) => `- ${p.when ? p.when + ': ' : ''}${p.action}`), '',
      'Ideas:', ...rep.ideas.map((i) => `- (${i.format}) ${i.title}`)];
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    } catch { this.error.set('Could not copy to the clipboard.'); }
  }

  length(seconds: number | null): string {
    if (seconds === null) return '–';
    const s = Math.round(seconds);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }

  text(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  private async call(kind: Busy, work: () => Promise<ChannelAnalysis>): Promise<void> {
    if (this.busy() !== null) return;
    this.busy.set(kind);
    this.error.set(null);
    try {
      const updated = await work();
      this.channels.update((all) => (all ?? []).map((c) => (c.channelId === updated.channelId ? updated : c)));
      this.selectedId.set(updated.channelId);
    } catch (failure: unknown) {
      this.error.set(this.message(failure, 'That did not work. Please try again.'));
    } finally {
      this.busy.set(null);
    }
  }

  private message(failure: unknown, fallback: string): string {
    return failure instanceof ApiFailure ? failure.message : fallback;
  }
}
