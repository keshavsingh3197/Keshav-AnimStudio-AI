import { DecimalPipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { ApiFailure } from '../../core/interceptors/api-error.interceptor';
import { BrandChannel, DEFAULT_BRAND_CHANNEL } from '../../core/models/api.models';
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
import { ApiService } from '../../core/services/api.service';
import { StatusService } from '../../core/services/status.service';
import { StoryAgentService } from '../../core/services/story-agent.service';
import { StoryImportDialogComponent } from './story-import-dialog.component';
import { StoryOptionsComponent } from './story-options.component';
import { STATUS_LABEL, saveStoryFile, statusTone, timeAgo } from './story-agent.utils';

/** The page's two halves: the stories already started, and a new one. */
export type StoryAgentView = 'stories' | 'new';

/** The steps of a new story, in order. Any can be opened at any time; Start says what is still missing. */
export type NewStoryStep = 'story' | 'telling' | 'making' | 'start';

const STEPS: { id: NewStoryStep; label: string }[] = [
  { id: 'story', label: 'The story' },
  { id: 'telling', label: 'How it is told' },
  { id: 'making', label: 'Voice, pictures & music' },
  { id: 'start', label: 'Check & start' },
];

/** How the list can be narrowed, by what the person would do next. */
export type StoryListFilter = 'all' | 'working' | 'waiting' | 'done' | 'stopped';

const FILTERS: { id: StoryListFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'waiting', label: 'Needs you' },
  { id: 'working', label: 'Being made' },
  { id: 'done', label: 'Done' },
  { id: 'stopped', label: 'Stopped' },
];

function filterOf(run: StoryRunSummary): Exclude<StoryListFilter, 'all'> {
  if (run.working) return 'working';
  switch (run.status) {
    case 'Completed': return 'done';
    case 'Failed':
    case 'Cancelled': return 'stopped';
    default: return 'waiting';
  }
}

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
 * The Story Agent's front door, in two tabs: the stories already started - to find, open, export or delete - and a new
 * story, made in four short steps instead of one long form. Starting one opens it, and it carries on by itself from
 * there. A story exported earlier can be imported from a dialog.
 */
@Component({
  selector: 'app-story-agent',
  imports: [DecimalPipe, RouterLink, StoryImportDialogComponent, StoryOptionsComponent],
  templateUrl: './story-agent.component.html',
  styleUrls: ['./story-agent.component.css'],
})
export class StoryAgentComponent {
  private readonly stories = inject(StoryAgentService);
  private readonly router = inject(Router);
  private readonly status = inject(StatusService);
  private readonly api = inject(ApiService);

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
  /** The engine that writes the script; '' walks the server's chain. */
  readonly textEngine = signal('');
  /** The brand channels this person may make a story for; only the default one for someone who is not an administrator. */
  readonly channels = signal<BrandChannel[]>([]);
  /**
   * The channel the story is for. Null until the person picks one when there is a choice: a story's project, watermark,
   * end card and YouTube channel all follow it, so it is never guessed.
   */
  readonly channelId = signal<string | null>(null);

  /** Null until the person or the first list answer decides, so an empty list can open on a new story. */
  readonly view = signal<StoryAgentView | null>(null);
  readonly step = signal<NewStoryStep>('story');
  readonly filter = signal<StoryListFilter>('all');
  readonly query = signal('');
  readonly importing = signal(false);
  readonly exporting = signal<string | null>(null);

  readonly steps = STEPS;
  readonly filters = FILTERS;
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
  /** A choice of channel is offered only when there is more than one. */
  readonly choosesChannel = computed(() => this.channels().length > 1);
  readonly channel = computed(() => this.channels().find((c) => c.id === this.channelId()) ?? null);
  readonly channelMissing = computed(() => this.choosesChannel() && !this.channel());

  /** Why Start is not pressed yet, in words, or null when it can be. */
  readonly missing = computed(() => {
    const caps = this.caps();
    if (!caps) return 'Loading…';
    if (!caps.enabled) return 'The Story Agent is switched off on this server.';
    if (this.channelMissing()) return 'Pick the channel this story is for.';
    if (this.writer() === 'BuiltIn') return this.pack() ? null : 'Pick one of the built-in stories.';
    return this.titleTooShort() ? 'Give the story a title.' : null;
  });

  readonly working = computed(() => (this.runs() ?? []).filter((run) => run.working).length);

  readonly engines = computed(() => this.caps()?.textEngines ?? []);
  readonly engineName = computed(() => this.engines().find((e) => e.id === this.textEngine())?.name ?? null);
  readonly stepIndex = computed(() => STEPS.findIndex((s) => s.id === this.step()));

  /** Which steps still need something before Start, so the step strip can mark them. */
  readonly stepMissing = computed<Record<NewStoryStep, boolean>>(() => ({
    story: this.channelMissing() || (this.writer() === 'BuiltIn' ? !this.pack() : this.titleTooShort()),
    telling: false,
    making: false,
    start: this.missing() !== null,
  }));

  readonly counts = computed<Record<StoryListFilter, number>>(() => {
    const counts: Record<StoryListFilter, number> = { all: 0, working: 0, waiting: 0, done: 0, stopped: 0 };
    for (const run of this.runs() ?? []) {
      counts.all++;
      counts[filterOf(run)]++;
    }
    return counts;
  });

  readonly shown = computed(() => {
    const filter = this.filter();
    const words = this.query().trim().toLocaleLowerCase();
    return (this.runs() ?? []).filter((run) =>
      (filter === 'all' || filterOf(run) === filter) && (!words || run.title.toLocaleLowerCase().includes(words)));
  });

  /** The choices as one line each, for the last step. */
  readonly summary = computed(() => {
    const o = this.options();
    const builtIn = this.writer() === 'BuiltIn';
    const writer = this.writer() === 'Auto'
      ? `The AI${this.engineName() ? ' · ' + this.engineName() : this.caps()?.textModel ? '' : ' (no text model on: you will paste it)'}`
      : this.writer() === 'Manual' ? 'You, from a chat' : 'A built-in story';
    const length = LENGTHS.find((l) => l.minutes === this.minutes())?.label ?? `${this.minutes()} minutes`;
    return [
      ...(this.choosesChannel() ? [{ label: 'Channel', value: this.channel()?.name ?? '—', step: 'story' as NewStoryStep }] : []),
      { label: 'Kind', value: this.genre()?.name ?? 'Devotional', step: 'story' as NewStoryStep },
      { label: builtIn ? 'Story' : 'Title', value: (builtIn ? this.pack()?.titleEnglish : this.title().trim()) || '—', step: 'story' as NewStoryStep },
      { label: 'Written by', value: writer, step: 'story' as NewStoryStep },
      { label: 'Language', value: this.language() === 'en' ? 'English' : 'Hindi', step: 'telling' as NewStoryStep },
      { label: 'Length', value: builtIn ? 'As the story is written' : length, step: 'telling' as NewStoryStep },
      { label: 'Told by', value: this.voicing() === 'CharactersOnly' && !builtIn ? 'Characters only' : 'A narrator', step: 'telling' as NewStoryStep },
      { label: 'Shape', value: this.format() === 'Vertical' ? 'Vertical 9:16 · Shorts' : 'Wide 16:9 · YouTube', step: 'telling' as NewStoryStep },
      { label: 'Voice', value: o?.narration === 'MyVoice' ? 'My voice' : o?.narration === 'Stock' ? 'A voice' : 'Subtitles only', step: 'making' as NewStoryStep },
      { label: 'Music', value: o?.music ? 'With music' : 'No music', step: 'making' as NewStoryStep },
      { label: 'Approval', value: o?.autoApprove ? 'Voice, music and video approved for me' : 'I listen and watch before it goes on', step: 'making' as NewStoryStep },
    ];
  });

  private timer: ReturnType<typeof setTimeout> | null = null;
  private destroyed = false;

  constructor() {
    // `?title=&notes=&format=` - an idea from the channel analysis or a series, to start a story from.
    const query = inject(ActivatedRoute).snapshot.queryParamMap;
    const format = query.get('format');
    if (query.get('title')) this.title.set(query.get('title')!.slice(0, 160));
    if (query.get('notes')) this.notes.set(query.get('notes')!.slice(0, 2000));
    // `?tab=new|stories` opens that half; an idea to start from opens a new story.
    const tab = query.get('tab');
    if (tab === 'new' || tab === 'stories') this.view.set(tab);
    else if (query.get('title')) this.view.set('new');

    this.stories.options().subscribe({
      next: (caps) => {
        this.caps.set(caps);
        this.applyDefaults(caps);
        if (format === 'Wide' || format === 'Vertical') this.format.set(format);
      },
      error: (failure: unknown) => this.capsError.set(failure instanceof ApiFailure ? failure.message : 'The Story Agent could not be reached.'),
    });
    this.refresh();
    this.loadChannels(query.get('channel'));

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

  /**
   * The channels to choose from. With only one there is nothing to choose; with more, none is picked unless the link
   * names one (`?channel=`), so the person decides before the story starts.
   */
  private loadChannels(wanted: string | null): void {
    this.api.listBrandChannels().subscribe({
      next: (channels) => {
        if (this.destroyed) return;
        this.channels.set(channels);
        if (channels.length === 1) this.channelId.set(channels[0].id);
        else if (wanted && channels.some((c) => c.id === wanted)) this.channelId.set(wanted);
      },
      // Without the list the story is made for the default channel, as it always was.
      error: () => {
        if (this.destroyed) return;
        this.channels.set([]);
        this.channelId.set(null);
      },
    });
  }

  pickChannel(id: string): void {
    this.channelId.set(id);
    this.startError.set(null);
  }

  // ------------------------------------------------------------------------------------------------ the list

  private refresh(): void {
    this.stories.list().subscribe({
      next: (runs) => {
        if (this.destroyed) return;
        this.listError.set(null);
        this.runs.set(runs);
        if (this.view() === null) this.view.set(runs.length === 0 ? 'new' : 'stories');
        // Only a story being made changes by itself, so only then is the list asked again.
        if (runs.some((run) => run.working)) this.timer = setTimeout(() => this.refresh(), LIST_POLL_MS);
      },
      error: (failure: unknown) => {
        if (this.destroyed) return;
        this.listError.set(failure instanceof ApiFailure ? failure.message : 'Your stories could not be loaded.');
        if (this.runs() === null) this.runs.set([]);
        if (this.view() === null) this.view.set('stories');
      },
    });
  }

  // ------------------------------------------------------------------------------------------------ tabs and steps

  setView(view: StoryAgentView): void {
    this.view.set(view);
  }

  onViewKey(event: KeyboardEvent): void {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const next: StoryAgentView = this.view() === 'new' ? 'stories' : 'new';
    this.view.set(next);
    document.getElementById(`sa-tab-${next}`)?.focus();
  }

  goStep(step: NewStoryStep): void {
    this.step.set(step);
  }

  moveStep(by: 1 | -1): void {
    const next = STEPS[this.stepIndex() + by];
    if (next) this.step.set(next.id);
  }

  async exportRun(run: StoryRunSummary): Promise<void> {
    this.exporting.set(run.id);
    try {
      saveStoryFile(await firstValueFrom(this.stories.exportStory(run.id)), run.title);
    } catch (failure: unknown) {
      this.status.showError(failure instanceof ApiFailure ? failure.message : 'That story could not be exported.');
    } finally {
      this.exporting.set(null);
    }
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
    if (this.starting()) return;
    if (this.missing()) {
      if (this.stepMissing().story) this.step.set('story');
      return;
    }
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
      textEngine: this.writer() !== 'BuiltIn' && this.textEngine() ? this.textEngine() : undefined,
      brandChannelId: this.channel() && this.channel()!.id !== DEFAULT_BRAND_CHANNEL ? this.channel()!.id : undefined,
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
