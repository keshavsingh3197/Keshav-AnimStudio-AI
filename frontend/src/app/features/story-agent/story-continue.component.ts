import { Component, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { ApiFailure } from '../../core/interceptors/api-error.interceptor';
import { ContinueStoryBody, StoryRun } from '../../core/models/story-agent.models';
import { StoryAgentService } from '../../core/services/story-agent.service';

type Busy = 'ideas' | 'fresh' | 'continue' | 'auto';

/** How many parts ahead the series can be told to keep going by itself (the server allows up to ten). */
const AHEAD = [1, 2, 3, 5, 10] as const;

/**
 * "What happens next": carries a story on as Part 2, Part 3 and on. Ideas for the next part are suggested once and kept
 * on the story, so opening it again costs nothing; the person picks one, writes their own, or lets the series go on by
 * itself for a few parts. A new part is an ordinary story that opens on its own page.
 */
@Component({
  selector: 'app-story-continue',
  imports: [FormsModule, RouterLink],
  templateUrl: './story-continue.component.html',
  styleUrls: ['./story-continue.component.css'],
})
export class StoryContinueComponent {
  private readonly stories = inject(StoryAgentService);
  private readonly router = inject(Router);

  readonly run = input.required<StoryRun>();
  /** The story changed here (ideas kept, or how far it goes on by itself). */
  readonly updated = output<StoryRun>();

  readonly busy = signal<Busy | null>(null);
  readonly error = signal<string | null>(null);
  readonly title = signal('');
  readonly notes = signal('');
  /** Parts ahead to make by themselves after the next one; 0 for none. */
  readonly ahead = signal(0);
  readonly aheadChoices = AHEAD;

  readonly part = computed(() => this.run().series?.part ?? 1);
  readonly nextPart = computed(() => this.part() + 1);
  readonly seriesName = computed(() => this.run().series?.name ?? this.run().title);
  /** A story can be continued once its script exists and nothing is being made. */
  readonly ready = computed(() => !!this.run().script && !this.run().working);
  readonly ideas = computed(() => this.run().nextParts ?? []);
  readonly autoTo = computed(() => this.run().series?.autoContinueTo ?? null);

  async suggest(fresh: boolean): Promise<void> {
    await this.call(fresh ? 'fresh' : 'ideas', async () => {
      this.updated.emit(await firstValueFrom(this.stories.suggestNextParts(this.run().id, fresh)));
    });
  }

  /** Starts the next part from an idea, or from what was typed when no idea is given. */
  async make(ideaIndex?: number, again = false): Promise<void> {
    const body: ContinueStoryBody = { again };
    if (ideaIndex !== undefined) body.ideaIndex = ideaIndex;
    else {
      if (this.title().trim()) body.title = this.title().trim();
      if (this.notes().trim()) body.notes = this.notes().trim();
    }
    if (this.ahead() > 0) body.autoContinueTo = this.nextPart() + this.ahead();

    await this.call('continue', async () => {
      const created = await firstValueFrom(this.stories.continueStory(this.run().id, body));
      await this.router.navigate(['/story-agent', created.id]);
    });
  }

  /** Lets a finished part start the next by itself (when nothing has been made from it yet), or stops that. */
  async setAuto(event: Event): Promise<void> {
    const value = Number((event.target as HTMLSelectElement).value);
    const upTo = value > 0 ? this.part() + value : null;
    await this.call('auto', async () => {
      this.updated.emit(await firstValueFrom(this.stories.setSeriesAuto(this.run().id, upTo)));
    });
  }

  aheadOf(autoTo: number | null): number {
    return autoTo ? autoTo - this.part() : 0;
  }

  text(event: Event): string {
    return (event.target as HTMLInputElement | HTMLTextAreaElement).value;
  }

  private async call(kind: Busy, work: () => Promise<void>): Promise<void> {
    if (this.busy() !== null) return;
    this.busy.set(kind);
    this.error.set(null);
    try {
      await work();
    } catch (failure: unknown) {
      this.error.set(failure instanceof ApiFailure ? failure.message : 'That did not work. Please try again.');
    } finally {
      this.busy.set(null);
    }
  }
}
