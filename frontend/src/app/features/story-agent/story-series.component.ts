import { Component, DestroyRef, computed, effect, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { ApiFailure } from '../../core/interceptors/api-error.interceptor';
import { StoryRun, StoryRunSummary, StorySeries } from '../../core/models/story-agent.models';
import { StoryAgentService } from '../../core/services/story-agent.service';
import { StoryContinueComponent } from './story-continue.component';
import { STATUS_LABEL, clock, publicationState, statusTone, timeAgo } from './story-agent.utils';

const POLL_MS = 5000;

/**
 * Stories told over several videos. Each series shows its parts in order - where each is in the making and what YouTube
 * has of it - and, for the latest part, what could happen next. A story becomes a series the first time it is continued,
 * from its own page or from here.
 */
@Component({
  selector: 'app-story-series',
  imports: [RouterLink, StoryContinueComponent],
  templateUrl: './story-series.component.html',
  styleUrls: ['./story-series.component.css'],
})
export class StorySeriesComponent {
  private readonly stories = inject(StoryAgentService);
  private readonly router = inject(Router);

  /** `?id=` - the series to open. */
  readonly id = input<string | undefined>(undefined);

  readonly all = signal<StorySeries[] | null>(null);
  readonly error = signal<string | null>(null);
  readonly openId = signal<string | null>(null);
  /** The latest part of the open series, in full, for the continue panel. */
  readonly latest = signal<StoryRun | null>(null);
  readonly latestError = signal<string | null>(null);

  readonly label = STATUS_LABEL;
  readonly tone = statusTone;
  readonly ago = timeAgo;
  readonly clock = clock;
  readonly videoState = publicationState;

  readonly open = computed(() => (this.all() ?? []).find((s) => s.id === this.openId()) ?? null);

  private timer: ReturnType<typeof setTimeout> | null = null;
  private destroyed = false;

  constructor() {
    effect(() => {
      const wanted = this.id();
      if (wanted) this.openId.set(wanted);
    });
    effect(() => {
      const series = this.open();
      if (series && this.latest()?.id !== series.latestRunId) void this.loadLatest(series.latestRunId);
    });

    this.refresh();
    inject(DestroyRef).onDestroy(() => {
      this.destroyed = true;
      if (this.timer !== null) clearTimeout(this.timer);
    });
  }

  refresh(): void {
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
    this.stories.series().subscribe({
      next: (all) => {
        if (this.destroyed) return;
        this.error.set(null);
        this.all.set(all);
        if (!this.openId() && all.length > 0) this.openId.set(all[0].id);
        // A part being made changes by itself; only then is the list asked again.
        if (all.some((s) => s.parts.some((p) => p.working))) this.timer = setTimeout(() => this.refresh(), POLL_MS);
      },
      error: (failure: unknown) => {
        if (this.destroyed) return;
        this.error.set(failure instanceof ApiFailure ? failure.message : 'Your series could not be loaded.');
        if (this.all() === null) this.all.set([]);
      },
    });
  }

  select(series: StorySeries): void {
    this.openId.set(series.id);
    void this.router.navigate([], { queryParams: { id: series.id }, replaceUrl: true });
  }

  /** The continue panel changed the latest part (ideas kept, or how far it goes on): keep both views in step. */
  onUpdated(run: StoryRun): void {
    this.latest.set(run);
    this.refresh();
  }

  stateOf(part: StoryRunSummary): { label: string; tone: string } {
    return part.publication ? publicationState(part.publication) : { label: STATUS_LABEL[part.status], tone: statusTone(part.status) };
  }

  totalSeconds(series: StorySeries): number {
    return series.parts.reduce((sum, p) => sum + (p.durationSeconds || 0), 0);
  }

  onYouTube(series: StorySeries): number {
    return series.parts.filter((p) => p.publicationCount > 0).length;
  }

  private async loadLatest(id: string): Promise<void> {
    this.latestError.set(null);
    try {
      const run = await firstValueFrom(this.stories.get(id));
      if (!this.destroyed) this.latest.set(run);
    } catch (failure: unknown) {
      if (!this.destroyed) this.latestError.set(failure instanceof ApiFailure ? failure.message : 'The latest part could not be loaded.');
    }
  }
}
