import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { ApiFailure } from '../../core/interceptors/api-error.interceptor';
import { StoryGenreOption } from '../../core/models/story-agent.models';
import { AnalyzedVideo, ChannelAnalysis, ChannelVideoIdea, DailyPoint, VideoLookup } from '../../core/models/youtube-analysis.models';
import { StoryAgentService } from '../../core/services/story-agent.service';
import { YouTubeAnalysisService } from '../../core/services/youtube-analysis.service';
import { csvCell } from './csv';
import { YtNavComponent } from './yt-nav.component';

type Busy = 'refresh' | 'plan' | 'fresh';
type VideoFilter = 'all' | 'short' | 'long';
type SortKey = 'date' | 'views' | 'perDay' | 'engagement' | 'length' | 'subs' | 'retention';
/** What the "best videos" list ranks by. */
type BestBy = 'age' | 'views' | 'subs' | 'retention' | 'engagement';
type DailyMetric = 'subs' | 'views';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_MS = 86_400_000;
/** Publishing times are grouped into three-hour windows of the viewer's own clock. */
const HOUR_BANDS = [0, 3, 6, 9, 12, 15, 18, 21];
/** The idea's kind of story is remembered per channel, in this browser only. */
const GENRE_KEY = 'ca-idea-genre:';

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const s = [...values].sort((x, y) => x - y);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function clock(h: number): string {
  return `${h % 12 === 0 ? 12 : h % 12}${h < 12 || h === 24 ? 'am' : 'pm'}`;
}

/** A yyyy-MM-dd day from YouTube Analytics as a local date. */
function dayDate(day: string): Date {
  return new Date(`${day}T00:00:00`);
}

function localDay(at: Date): string {
  return `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, '0')}-${String(at.getDate()).padStart(2, '0')}`;
}

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
  private readonly stories = inject(StoryAgentService);
  private readonly router = inject(Router);

  /** The kinds of story an idea can be made as; empty when the Story Agent can't be reached. */
  readonly genres = signal<StoryGenreOption[]>([]);
  /** The kind picked for this channel's ideas; '' lets the Story Agent use its first. */
  readonly ideaGenre = signal('');

  /** Ticks every minute so "when to upload next" counts down while the page is open. */
  readonly now = signal(Date.now());

  readonly lookupLink = signal('');
  readonly lookupBusy = signal(false);
  readonly lookupError = signal<string | null>(null);
  readonly lookup = signal<VideoLookup | null>(null);

  readonly bestBy = signal<BestBy>('age');
  readonly dailyMetric = signal<DailyMetric>('subs');
  /** The bar picked in a daily chart, shown under it. */
  readonly pickedDay = signal<string | null>(null);
  readonly pickedLookupDay = signal<string | null>(null);

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
        case 'subs': return v.analytics?.subscribersGained ?? -1;
        case 'retention': return v.analytics?.averageViewPercent ?? -1;
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

  /** Any video has YouTube Analytics numbers, so their columns and lists are worth showing. */
  readonly hasAnalytics = computed(() => (this.current()?.videos ?? []).some((v) => v.analytics !== null));

  /** Public videos at least two days old: young ones have not settled enough to rank. */
  private readonly settled = computed(() => {
    const now = this.now();
    return (this.current()?.videos ?? []).filter((v) => v.privacy === 'public' && v.publishedAtUtc && now - Date.parse(v.publishedAtUtc) >= 2 * DAY_MS);
  });

  /** The five best videos by what the person picked. */
  readonly best = computed(() => {
    const by = this.bestBy();
    const value = (v: AnalyzedVideo): number | null => {
      switch (by) {
        case 'views': return v.views;
        case 'subs': return v.analytics?.subscribersGained ?? null;
        case 'retention': return v.analytics?.averageViewPercent ?? null;
        case 'engagement': return v.views !== null && v.views >= 100 ? v.engagement : null;
        default: return v.viewsPerDay;
      }
    };
    return this.settled()
      .map((v) => ({ video: v, value: value(v) }))
      .filter((x): x is { video: AnalyzedVideo; value: number } => x.value !== null)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  });

  /** Typical views a day by the local time of day uploads went out at. */
  readonly hours = computed(() => {
    const buckets: number[][] = HOUR_BANDS.map(() => []);
    for (const v of this.settled()) buckets[Math.floor(new Date(v.publishedAtUtc!).getHours() / 3)].push(v.viewsPerDay);
    const medians = buckets.map(median);
    const max = Math.max(...medians.map((m, i) => (buckets[i].length >= 2 ? m : 0)), 0);
    if (max === 0) return null;
    return HOUR_BANDS.map((h, i) => ({
      hour: h, label: clock(h), range: `${clock(h)}–${clock(h + 3)}`, count: buckets[i].length, median: medians[i],
      pct: Math.min(100, Math.round((medians[i] / max) * 100)), best: buckets[i].length >= 2 && medians[i] === max,
    }));
  });

  /**
   * When to put the next video up: the last upload plus the gap this channel's history recommends, moved to its best
   * weekday when that is within three days, at its best time of day.
   */
  readonly nextUpload = computed(() => {
    const c = this.current();
    const r = c?.insights?.rhythm;
    if (!c?.insights || !r?.lastUploadAtUtc) return null;
    const now = this.now();
    const last = Date.parse(r.lastUploadAtUtc);
    const earliest = last + r.recommendedGapDays * DAY_MS;

    const bestHour = this.hours()?.find((h) => h.best)?.hour ?? null;
    const bestDay = this.weekdays()?.findIndex((d) => d.best && d.count >= 2) ?? -1;
    const from = Math.max(now, earliest);
    let slot = new Date(from);
    if (bestHour !== null) {
      slot.setHours(bestHour + 1, 0, 0, 0);
      if (slot.getTime() < from) slot = new Date(slot.getTime() + DAY_MS);
    }
    if (bestDay >= 0) {
      for (let k = 0; k <= 3; k++) {
        const candidate = new Date(slot.getTime() + k * DAY_MS);
        if ((candidate.getDay() + 6) % 7 === bestDay) { slot = candidate; break; }
      }
    }

    const wait = earliest - now;
    // Bars are scaled to the gaps with enough videos to trust, so a lone outlier does not dwarf them.
    const maxScore = Math.max(...r.buckets.filter((b) => b.videos >= 2).map((b) => b.medianScore), 0.01);
    const bestTrusted = Math.max(...r.buckets.filter((b) => b.videos >= 2).map((b) => b.medianScore), -1);
    return {
      ready: wait <= 0,
      waitDays: Math.floor(wait / DAY_MS),
      waitHours: Math.max(0, Math.floor((wait % DAY_MS) / 3_600_000)),
      earliest: new Date(earliest),
      slot,
      lastAt: new Date(last),
      lastAgeDays: Math.max(0, Math.floor((now - last) / DAY_MS)),
      rhythm: r,
      format: this.formatAdvice(),
      buckets: r.buckets.map((b) => ({ ...b, pct: Math.min(100, Math.max(4, Math.round((b.medianScore / maxScore) * 100))), trusted: b.videos >= 2, best: r.fromHistory && b.videos >= 2 && b.medianScore === bestTrusted })),
    };
  });

  /** Whether the next upload should be a Short or a longer video, from views a day and subscribers per view. */
  private formatAdvice(): { kind: 'short' | 'long' | 'either'; why: string } {
    const i = this.current()?.insights;
    const s = i?.shortsMedianViewsPerDay ?? null;
    const l = i?.longMedianViewsPerDay ?? null;
    const subs = (short: boolean) => {
      const list = this.settled().filter((v) => v.isShort === short && v.analytics && (v.views ?? 0) > 0);
      const views = list.reduce((t, v) => t + (v.views ?? 0), 0);
      return list.length >= 2 && views > 0 ? (list.reduce((t, v) => t + v.analytics!.subscribersGained, 0) * 1000) / views : null;
    };
    const ss = subs(true);
    const ls = subs(false);
    const subsNote = ss !== null && ls !== null && Math.max(ss, ls) > 0
      ? ` ${ls > ss ? 'Longer videos' : 'Shorts'} win more subscribers per thousand views (${Math.max(ss, ls).toFixed(1)} against ${Math.min(ss, ls).toFixed(1)}).`
      : '';
    if (s === null || l === null || s <= 0 || l <= 0) {
      return { kind: 'either', why: 'Not enough of both kinds yet to compare them; keep making what you planned.' + subsNote };
    }
    if (s >= l * 1.2) return { kind: 'short', why: `Shorts get ${(s / l).toFixed(1)}× the views a day of longer videos here.${subsNote}` };
    if (l >= s * 1.2) return { kind: 'long', why: `Longer videos get ${(l / s).toFixed(1)}× the views a day of Shorts here.${subsNote}` };
    return { kind: 'either', why: `Shorts and longer videos do about as well here.${subsNote}` };
  }

  /** The channel day by day as bars, with the days uploads went out marked. */
  readonly dailyChart = computed(() => {
    const c = this.current();
    const days = c?.daily ?? [];
    if (days.length < 7) return null;
    const metric = this.dailyMetric();
    const value = (d: DailyPoint) => (metric === 'subs' ? d.subscribersGained : d.views);
    const max = Math.max(...days.map(value), 1);
    const uploads = new Map<string, AnalyzedVideo[]>();
    for (const v of c?.videos ?? []) {
      if (!v.publishedAtUtc || v.privacy !== 'public') continue;
      const key = localDay(new Date(v.publishedAtUtc));
      uploads.set(key, [...(uploads.get(key) ?? []), v]);
    }
    const gained = days.reduce((t, d) => t + d.subscribersGained, 0);
    const lost = days.reduce((t, d) => t + d.subscribersLost, 0);
    const views = days.reduce((t, d) => t + d.views, 0);
    const bestDay = days.reduce((b, d) => (value(d) > value(b) ? d : b), days[0]);
    return {
      bars: days.map((d) => ({ point: d, value: value(d), pct: Math.max(2, Math.round((value(d) / max) * 100)), uploads: uploads.get(d.day) ?? [] })),
      max, gained, lost, net: gained - lost, views, bestDay, from: days[0].day, to: days[days.length - 1].day,
    };
  });

  readonly pickedDailyBar = computed(() => this.dailyChart()?.bars.find((b) => b.point.day === this.pickedDay()) ?? null);

  /** A looked-up video's days as bars, with when it did best and whether it is still growing. */
  readonly lookupChart = computed(() => {
    const l = this.lookup();
    const days = l?.daily ?? [];
    if (!l || days.length === 0) return null;
    const max = Math.max(...days.map((d) => d.views), 1);
    const total = days.reduce((t, d) => t + d.views, 0);
    const peak = days.reduce((b, d) => (d.views > b.views ? d : b), days[0]);
    const published = l.publishedAtUtc ? Date.parse(l.publishedAtUtc) : dayDate(days[0].day).getTime();
    const first7 = days.filter((d) => dayDate(d.day).getTime() - published < 7 * DAY_MS).reduce((t, d) => t + d.views, 0);
    const recent = days.slice(-7).reduce((t, d) => t + d.views, 0);
    const before = days.slice(-14, -7).reduce((t, d) => t + d.views, 0);
    return {
      bars: days.map((d) => ({ point: d, pct: Math.max(2, Math.round((d.views / max) * 100)) })),
      max, total, peak,
      peakAfterDays: Math.max(0, Math.round((dayDate(peak.day).getTime() - published) / DAY_MS)),
      first7Share: total > 0 && days.length >= 7 ? Math.round((first7 / total) * 100) : null,
      trend: days.length >= 14 && before > 0 ? Math.round((recent / before - 1) * 100) : null,
      subs: days.reduce((t, d) => t + d.subscribersGained, 0),
      from: days[0].day, to: days[days.length - 1].day,
    };
  });

  readonly pickedLookupBar = computed(() => this.lookupChart()?.bars.find((b) => b.point.day === this.pickedLookupDay()) ?? null);

  /** How the looked-up video compares with this channel's typical video of its kind, in percent. */
  readonly lookupVsTypical = computed(() => {
    const l = this.lookup();
    const i = this.current()?.insights;
    if (!l || !i) return null;
    const typical = (l.isShort ? i.shortsMedianViewsPerDay : i.longMedianViewsPerDay) ?? i.medianViewsPerDay;
    return typical > 0 ? Math.round((l.viewsPerDay / typical - 1) * 100) : null;
  });

  constructor() {
    void this.load();
    this.stories.options().subscribe({
      next: (caps) => this.genres.set(caps.genres ?? []),
      error: () => this.genres.set([]),
    });
    const timer = setInterval(() => this.now.set(Date.now()), 60_000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  async load(): Promise<void> {
    this.error.set(null);
    try {
      const all = await firstValueFrom(this.analysis.list());
      this.channels.set(all);
      const current = this.current();
      if (current?.report?.goal && !this.goal()) this.goal.set(current.report.goal);
      this.restoreGenre();
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
    this.lookup.set(null);
    this.lookupError.set(null);
    this.pickedDay.set(null);
    this.restoreGenre();
  }

  setIdeaGenre(id: string): void {
    this.ideaGenre.set(id);
    const channel = this.current()?.channelId;
    if (!channel) return;
    try { localStorage.setItem(GENRE_KEY + channel, id); } catch { /* storage off: the choice lasts this visit */ }
  }

  private restoreGenre(): void {
    const channel = this.current()?.channelId;
    let saved = '';
    try { saved = (channel && localStorage.getItem(GENRE_KEY + channel)) || ''; } catch { /* storage off */ }
    this.ideaGenre.set(saved);
  }

  /** Hindi when the title is written in Devanagari, English otherwise: what the story is told in. */
  private languageOf(title: string): 'hi' | 'en' {
    return /[ऀ-ॿ]/.test(title) ? 'hi' : 'en';
  }

  // ------------------------------------------------------------------------------------------------ looking a video up

  /** Looks up the pasted link: any video's public numbers, and Analytics for this channel's own. */
  async lookUp(fresh = false): Promise<void> {
    const link = this.lookupLink().trim();
    if (!link) { this.lookupError.set('Paste a YouTube video link first.'); return; }
    await this.runLookup(link, fresh);
  }

  /** Opens an upload from the lists in the lookup panel, with how it did day by day. */
  async openVideo(video: { videoId: string }): Promise<void> {
    this.lookupLink.set(`https://youtu.be/${video.videoId}`);
    document.getElementById('ca-lookup')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    await this.runLookup(video.videoId, false);
  }

  /** A video looked up before, from what was kept - nothing is asked of YouTube. */
  async openKept(kept: VideoLookup): Promise<void> {
    const channel = this.current();
    if (!channel || this.lookupBusy()) return;
    this.lookupLink.set(kept.url);
    this.lookupBusy.set(true);
    this.lookupError.set(null);
    try {
      this.lookup.set(await firstValueFrom(this.analysis.getLookup(channel.channelId, kept.videoId)));
      this.pickedLookupDay.set(null);
    } catch (failure: unknown) {
      this.lookupError.set(this.message(failure, 'That video could not be opened.'));
    } finally {
      this.lookupBusy.set(false);
    }
  }

  async forget(kept: VideoLookup): Promise<void> {
    const channel = this.current();
    if (!channel) return;
    try {
      await firstValueFrom(this.analysis.removeLookup(channel.channelId, kept.videoId));
      this.channels.update((all) => (all ?? []).map((c) => (c.channelId === channel.channelId ? { ...c, lookups: c.lookups.filter((l) => l.videoId !== kept.videoId) } : c)));
      if (this.lookup()?.videoId === kept.videoId) this.lookup.set(null);
    } catch (failure: unknown) {
      this.lookupError.set(this.message(failure, 'That video could not be removed.'));
    }
  }

  private async runLookup(link: string, fresh: boolean): Promise<void> {
    const channel = this.current();
    if (!channel || this.lookupBusy()) return;
    this.lookupBusy.set(true);
    this.lookupError.set(null);
    try {
      const found = await firstValueFrom(this.analysis.lookup(channel.channelId, link, fresh));
      this.lookup.set(found);
      this.pickedLookupDay.set(null);
      // Keep the list of looked-up videos (without the day-by-day numbers) and the video's row in step.
      const summary: VideoLookup = { ...found, daily: [] };
      this.channels.update((all) => (all ?? []).map((c) => c.channelId !== channel.channelId ? c : {
        ...c,
        lookups: [summary, ...c.lookups.filter((l) => l.videoId !== found.videoId)],
        videos: c.videos.map((v) => v.videoId !== found.videoId || !found.own ? v
          : { ...v, views: found.views ?? v.views, likes: found.likes ?? v.likes, comments: found.comments ?? v.comments, analytics: found.analytics ?? v.analytics }),
      }));
    } catch (failure: unknown) {
      this.lookupError.set(this.message(failure, 'That video could not be looked up.'));
    } finally {
      this.lookupBusy.set(false);
    }
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

  /** Opens the Story Agent on a new story with the idea's title, kind and language filled in. */
  makeStory(idea: ChannelVideoIdea): void {
    const notes = [idea.why, idea.format === 'short' ? 'Make it a Short: vertical, under a minute.' : null].filter(Boolean).join(' ');
    void this.router.navigate(['/story-agent'], {
      queryParams: {
        tab: 'new', title: idea.title, notes: notes || null, format: idea.format === 'short' ? 'Vertical' : 'Wide',
        genre: this.ideaGenre() || null, lang: this.languageOf(idea.title),
      },
    });
  }

  /** Opens the Story Agent to make a sequel of a video that is doing well. */
  followUp(video: { title: string; isShort: boolean }): void {
    void this.router.navigate(['/story-agent'], {
      queryParams: {
        tab: 'new', title: `${video.title} - Part 2`.slice(0, 160),
        notes: `A follow-up to "${video.title}", which is doing well on the channel. Carry on its story or theme.`,
        format: video.isShort ? 'Vertical' : 'Wide', genre: this.ideaGenre() || null, lang: this.languageOf(video.title),
      },
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
    const head = ['Title', 'URL', 'Published', 'Privacy', 'Type', 'Length (s)', 'Views', 'Views a day', 'Likes', 'Comments', 'Engagement %',
      'Subscribers gained', 'Subscribers lost', 'Average % watched', 'Average view (s)', 'Watch minutes', 'Shares'];
    const rows = this.videos().map((v) => [v.title, v.url, v.publishedAtUtc, v.privacy, v.isShort ? 'Short' : 'Video', v.durationSeconds, v.views, v.viewsPerDay.toFixed(2), v.likes, v.comments, v.engagement?.toFixed(2),
      v.analytics?.subscribersGained, v.analytics?.subscribersLost, v.analytics?.averageViewPercent, v.analytics?.averageViewSeconds, v.analytics?.watchMinutes, v.analytics?.shares]);
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
