import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { ApiFailure } from '../../core/interceptors/api-error.interceptor';
import { AnalyzedVideo, ChannelAnalysis, ChannelVideoIdea } from '../../core/models/youtube-analysis.models';
import { YouTubeAnalysisService } from '../../core/services/youtube-analysis.service';

type Busy = 'refresh' | 'plan' | 'fresh';
type VideoFilter = 'all' | 'short' | 'long';

/**
 * Channel analysis: how each connected channel's recent videos are doing for their age, what that shows, and a plan for
 * what to make next. It opens from what the server kept from last time - no call to YouTube or a model - and asks again
 * only when the person refreshes the numbers or wants a plan for new ones.
 */
@Component({
  selector: 'app-channel-analysis',
  imports: [RouterLink, DatePipe, DecimalPipe],
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

  readonly videos = computed(() => {
    const filter = this.filter();
    const list = this.current()?.videos ?? [];
    return filter === 'all' ? list : list.filter((v) => (filter === 'short') === v.isShort);
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
