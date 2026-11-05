import { DecimalPipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { ApiFailure } from '../../core/interceptors/api-error.interceptor';
import {
  CreateStoryRunBody,
  StoryAgentOptions,
  StoryBuildOptions,
  StoryFormat,
  StoryVoicing,
  StoryGenreOption,
  StoryRunSummary,
  StoryTopic,
  StoryWriterMode,
} from '../../core/models/story-agent.models';
import { StatusService } from '../../core/services/status.service';
import { StoryAgentService } from '../../core/services/story-agent.service';
import { StoryOptionsComponent } from './story-options.component';
import { STATUS_LABEL, statusTone, timeAgo } from './story-agent.utils';

const TOPICS_SHOWN = 8;
/** What a run with no genre is, on the server as here. */
const DEFAULT_GENRE = 'devotional';
const LIST_POLL_MS = 4000;

/** Lengths a story is offered in. The script is written to about this; it is a target, not a promise. */
const LENGTHS: { minutes: number; label: string }[] = [
  { minutes: 1, label: 'About 1 minute' },
  { minutes: 2.5, label: 'About 2½ minutes' },
  { minutes: 4, label: 'About 4 minutes' },
  { minutes: 6, label: 'About 6 minutes' },
  { minutes: 10, label: 'About 10 minutes' },
];

/**
 * The Story Agent's front door: say what the story is about - a title is enough - and choose how it should be made; and
 * below it, the stories already started. Starting one opens it, and it carries on by itself from there.
 */
@Component({
  selector: 'app-story-agent',
  imports: [DecimalPipe, RouterLink, StoryOptionsComponent],
  templateUrl: './story-agent.component.html',
  styleUrls: ['./story-agent.component.css'],
})
export class StoryAgentComponent {
  private readonly stories = inject(StoryAgentService);
  private readonly router = inject(Router);
  private readonly status = inject(StatusService);

  readonly caps = signal<StoryAgentOptions | null>(null);
  readonly capsError = signal<string | null>(null);
  /** Null until the first answer, so the list can tell "loading" from "none yet". */
  readonly runs = signal<StoryRunSummary[] | null>(null);
  readonly listError = signal<string | null>(null);
  readonly starting = signal(false);
  readonly startError = signal<string | null>(null);
  readonly deleting = signal<string | null>(null);

  readonly title = signal('');
  readonly notes = signal('');
  readonly language = signal<'hi' | 'en'>('hi');
  readonly minutes = signal(2.5);
  readonly format = signal<StoryFormat>('Wide');
  readonly writer = signal<StoryWriterMode>('Auto');
  readonly voicing = signal<StoryVoicing>('Narrated');
  readonly packId = signal<string | null>(null);
  readonly genreId = signal<string | null>(null);
  readonly options = signal<StoryBuildOptions | null>(null);
  readonly showAllTopics = signal(false);

  readonly lengths = LENGTHS;
  readonly label = STATUS_LABEL;
  readonly tone = statusTone;
  readonly ago = timeAgo;

  readonly genres = computed<StoryGenreOption[]>(() => this.caps()?.genres ?? []);
  /** The genre picked; null only on a server from before genres, which made devotional stories. */
  readonly genre = computed<StoryGenreOption | null>(() => this.genres().find((g) => g.id === this.genreId()) ?? this.genres()[0] ?? null);
  readonly scripture = computed(() => (this.genre()?.mode ?? 'Scripture') === 'Scripture');

  private readonly allTopics = computed<StoryTopic[]>(() => this.genre()?.topics ?? this.caps()?.topics ?? []);
  readonly topics = computed<StoryTopic[]>(() => {
    const all = this.allTopics();
    return this.showAllTopics() ? all : all.slice(0, TOPICS_SHOWN);
  });
  readonly hiddenTopics = computed(() => Math.max(0, this.allTopics().length - TOPICS_SHOWN));
  /** Only the built-in stories written for the genre picked. */
  readonly packs = computed(() => {
    const genre = this.genre()?.id ?? DEFAULT_GENRE;
    return (this.caps()?.packs ?? []).filter((pack) => (pack.genreId ?? DEFAULT_GENRE) === genre);
  });
  readonly pack = computed(() => this.packs().find((pack) => pack.id === this.packId()) ?? null);
  readonly titleTooShort = computed(() => this.writer() !== 'BuiltIn' && this.title().trim().length < 3);

  /** Why Start is not pressed yet, in words, or null when it can be. */
  readonly missing = computed(() => {
    const caps = this.caps();
    if (!caps) return 'Loading…';
    if (!caps.enabled) return 'The Story Agent is switched off on this server.';
    if (this.writer() === 'BuiltIn') return this.pack() ? null : 'Pick one of the built-in stories.';
    return this.titleTooShort() ? 'Give the story a title.' : null;
  });

  readonly working = computed(() => (this.runs() ?? []).filter((run) => run.working).length);

  private timer: ReturnType<typeof setTimeout> | null = null;
  private destroyed = false;

  constructor() {
    // `?title=&notes=&format=` - an idea from the channel analysis or a series, to start a story from.
    const query = inject(ActivatedRoute).snapshot.queryParamMap;
    const format = query.get('format');
    if (query.get('title')) this.title.set(query.get('title')!.slice(0, 160));
    if (query.get('notes')) this.notes.set(query.get('notes')!.slice(0, 2000));

    this.stories.options().subscribe({
      next: (caps) => {
        this.caps.set(caps);
        this.applyDefaults(caps);
        if (format === 'Wide' || format === 'Vertical') this.format.set(format);
      },
      error: (failure: unknown) => this.capsError.set(failure instanceof ApiFailure ? failure.message : 'The Story Agent could not be reached.'),
    });
    this.refresh();

    inject(DestroyRef).onDestroy(() => {
      this.destroyed = true;
      if (this.timer !== null) clearTimeout(this.timer);
    });
  }

  /** The choices a first-time visitor should find already made: what this server can do, and the person's own voice if it is quick. */
  private applyDefaults(caps: StoryAgentOptions): void {
    const mine = caps.speechEngine ? caps.myVoices.find((voice) => voice.tuned) : undefined;
    this.options.set({
      narration: mine ? 'MyVoice' : caps.speechEngine ? 'Stock' : 'None',
      voiceProfileId: mine?.id ?? null,
      voiceId: null,
      speechEngine: null,
      speechModel: null,
      speechStyle: null,
      castVoices: true,
      speechRate: 0.95,
      closestToMyVoice: false,
      visuals: 'Auto',
      imageStyle: null,
      music: caps.music || !!caps.musicComposer,
      musicSource: 'Auto',
      uploadsAreAiMade: true,
      musicQuery: null,
      musicVolume: 0.2,
      renderWhenReady: caps.renderer,
      autoApprove: false,
      artStyle: 'Auto',
    });
    this.writer.set(caps.textModel ? 'Auto' : 'Manual');
    const first = caps.genres?.[0];
    if (first) this.setGenre(first);
    else this.packId.set(caps.packs[0]?.id ?? null);
  }

  /**
   * Picks a genre and fills in what comes with it - language, length, shape, the picture style, the voice's delivery
   * and the look - so the story is made the genre's way unless the person changes something afterwards.
   */
  setGenre(genre: StoryGenreOption): void {
    this.genreId.set(genre.id);
    this.showAllTopics.set(false);
    this.startError.set(null);
    this.language.set(genre.defaultLanguage === 'en' ? 'en' : 'hi');
    this.format.set(genre.defaultFormat);
    const minutes = genre.defaultTargetSeconds / 60;
    this.minutes.set(LENGTHS.reduce((best, l) => (Math.abs(l.minutes - minutes) < Math.abs(best.minutes - minutes) ? l : best)).minutes);
    this.options.update((o) => (o ? { ...o, imageStyle: genre.imageStyle, speechStyle: genre.speechStyle, lookStyle: genre.lookStyle } : o));

    const packs = this.packs();
    this.packId.set(packs[0]?.id ?? null);
    if (this.writer() === 'BuiltIn' && packs.length === 0) this.writer.set(this.caps()?.textModel ? 'Auto' : 'Manual');
  }

  // ------------------------------------------------------------------------------------------------ the list

  private refresh(): void {
    this.stories.list().subscribe({
      next: (runs) => {
        if (this.destroyed) return;
        this.listError.set(null);
        this.runs.set(runs);
        // Only a story being made changes by itself, so only then is the list asked again.
        if (runs.some((run) => run.working)) this.timer = setTimeout(() => this.refresh(), LIST_POLL_MS);
      },
      error: (failure: unknown) => {
        if (this.destroyed) return;
        this.listError.set(failure instanceof ApiFailure ? failure.message : 'Your stories could not be loaded.');
        if (this.runs() === null) this.runs.set([]);
      },
    });
  }

  async remove(run: StoryRunSummary): Promise<void> {
    if (!confirm(`Delete "${run.title}", with its script, pictures and narration?${run.hasProject ? ' The project and video it made are kept.' : ''}`)) return;
    this.deleting.set(run.id);
    try {
      await firstValueFrom(this.stories.delete(run.id));
      this.runs.update((list) => (list ?? []).filter((item) => item.id !== run.id));
    } catch (failure: unknown) {
      this.status.showError(failure instanceof ApiFailure ? failure.message : 'That story could not be deleted.');
    } finally {
      this.deleting.set(null);
    }
  }

  // ------------------------------------------------------------------------------------------------ starting

  useTopic(topic: StoryTopic): void {
    this.title.set(this.language() === 'hi' ? topic.hindi : topic.name);
  }

  setWriter(writer: StoryWriterMode): void {
    this.writer.set(writer);
    this.startError.set(null);
  }

  async start(): Promise<void> {
    if (this.starting() || this.missing()) return;
    const builtIn = this.writer() === 'BuiltIn';
    const notes = this.notes().trim();

    const body: CreateStoryRunBody = {
      title: builtIn ? undefined : this.title().trim(),
      notes: builtIn || !notes ? undefined : notes,
      language: this.language(),
      targetSeconds: Math.round(this.minutes() * 60),
      format: this.format(),
      writer: this.writer(),
      voicing: builtIn ? undefined : this.voicing(),
      packId: builtIn ? (this.packId() ?? undefined) : undefined,
      genreId: this.genre()?.id,
      options: this.options() ?? undefined,
    };

    this.starting.set(true);
    this.startError.set(null);
    try {
      const run = await firstValueFrom(this.stories.create(body));
      await this.router.navigate(['/story-agent', run.id]);
    } catch (failure: unknown) {
      this.startError.set(failure instanceof ApiFailure ? failure.message : 'The story could not be started.');
    } finally {
      this.starting.set(false);
    }
  }

  text(event: Event): string {
    return (event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value;
  }
}
