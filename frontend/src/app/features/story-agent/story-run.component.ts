import { DecimalPipe, NgTemplateOutlet } from '@angular/common';
import { Component, DestroyRef, computed, effect, inject, input, signal, untracked, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom, lastValueFrom } from 'rxjs';

import { ApiFailure } from '../../core/interceptors/api-error.interceptor';
import { BrandChannel, DEFAULT_BRAND_CHANNEL } from '../../core/models/api.models';
import {
  StoryAgentOptions,
  StoryBudgetReport,
  StoryBuildOptions,
  StoryCaptionResult,
  StoryPublication,
  StoryRun,
  StoryStage,
  StoryStageId,
  StoryWriterMode,
} from '../../core/models/story-agent.models';
import { YouTubePrefill, YouTubeUpload } from '../../core/models/youtube.models';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { StatusService } from '../../core/services/status.service';
import { StoryAgentService } from '../../core/services/story-agent.service';
import { YouTubePublishDialogComponent } from '../../shared/youtube-publish-dialog.component';
import { StoryContinueComponent } from './story-continue.component';
import { StoryKitComponent } from './story-kit.component';
import { StoryOptionsComponent } from './story-options.component';
import { StoryReviewComponent } from './story-review.component';
import { StoryScriptEditorComponent } from './story-script-editor.component';
import {
  REVIEW_LABEL,
  STAGE_INFO,
  STATUS_LABEL,
  clock,
  copyText,
  fileNameOf,
  isTerminal,
  publicationState,
  replyProblem,
  saveBlob,
  saveStoryFile,
  stageMark,
  statusTone,
  timeAgo,
  whenLabel,
} from './story-agent.utils';

/** How often a story being made is asked about (the server saves a step's progress twice a second), and how long to wait after a failed ask. */
const POLL_MS = 1000;
const RETRY_MAX_MS = 10_000;

/** The speeds offered for the video, as multiples of the pace it was built at. */
const SPEEDS = [0.75, 1, 1.25, 1.5, 1.75, 2] as const;

/** Two speeds are the same once rounded the way the server stores them (to 0.05). */
const sameSpeed = (a: number, b: number): boolean => Math.abs(a - b) < 0.001;

type Action = 'cancel' | 'retry' | 'delete' | 'build' | 'rewrite' | 'paste' | 'approve' | 'speed';

/** The story page's tabs, in the order a story goes through them. */
export type StoryTab = 'overview' | 'script' | 'pictures' | 'build' | 'voice' | 'music' | 'publish';

/**
 * In the order a story goes through them, which is the order the server makes things: the pictures (added before the
 * build, or made first in it), the settings where Build is pressed, then the voice, the music and the video.
 */
const TABS: { id: StoryTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'script', label: 'Script' },
  { id: 'pictures', label: 'Pictures' },
  { id: 'build', label: 'Settings' },
  { id: 'voice', label: 'Voice' },
  { id: 'music', label: 'Music' },
  { id: 'publish', label: 'Video & YouTube' },
];

/** The tab that shows each step's work, so the page can follow a build from one step to the next. */
const STAGE_TAB: Record<StoryStageId, StoryTab> = {
  research: 'overview',
  script: 'script',
  visuals: 'pictures',
  narration: 'voice',
  music: 'music',
  assemble: 'publish',
  render: 'publish',
  kit: 'publish',
};

/** The steps that make the video itself, shown together on the Video tab. */
const VIDEO_STAGES: StoryStageId[] = ['assemble', 'render', 'kit'];

/** Tab names from before the voice and the music had a tab each, so old links still open. */
const OLD_TABS: Record<string, StoryTab> = { review: 'voice' };

const isDone = (stage?: StoryStage): boolean => stage?.status === 'Completed' || stage?.status === 'Skipped';
const hasBegun = (stage?: StoryStage): boolean => !!stage && stage.status !== 'Pending';

/** How a tab reads in the bar: finished, the one that needs the person now, not reachable yet, or neither. */
type TabState = 'done' | 'now' | 'locked' | 'todo';

/**
 * One story, from the first search to the video on YouTube, as tabs a person moves through: what is happening, the
 * script to read and approve, the pictures, the build, and the finished video with its subtitles and YouTube details.
 * It follows a story being made by asking the server about it every couple of seconds.
 *
 * Everything the person does is saved on the server as they do it, so leaving and coming back - from the storyboard,
 * or days later - opens the story where it was. The one thing held only on the page is script text typed and not yet
 * saved, and leaving with that asks first.
 */
@Component({
  selector: 'app-story-run',
  imports: [
    RouterLink, FormsModule, DecimalPipe, NgTemplateOutlet, StoryScriptEditorComponent, StoryOptionsComponent, StoryKitComponent, StoryReviewComponent,
    YouTubePublishDialogComponent, StoryContinueComponent,
  ],
  templateUrl: './story-run.component.html',
  styleUrls: ['./story-run.component.css'],
})
export class StoryRunComponent {
  private readonly stories = inject(StoryAgentService);
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly status = inject(StatusService);

  /** `/story-agent/:runId` - route parameters arrive as inputs. */
  readonly runId = input.required<string>();
  /** `?tab=` - which tab to open on; otherwise the one the story needs next. */
  readonly tab = input<string | undefined>(undefined);

  readonly run = signal<StoryRun | null>(null);
  readonly caps = signal<StoryAgentOptions | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  /** The server could not be reached on the last ask; the page keeps what it had and keeps trying. */
  readonly offline = signal(false);
  readonly busy = signal<Action | null>(null);
  readonly actionError = signal<string | null>(null);
  readonly selected = signal<StoryTab>('overview');
  /** When the server last answered, so a running step's time moves on with every answer. */
  readonly heardAt = signal(Date.now());

  /**
   * Someone who is not signed in is a guest, and a <video> or a download link cannot send the header that says so. For
   * them the video is fetched through the API client and played from memory.
   */
  readonly signedIn = this.auth.isAuthenticated;
  readonly localVideo = signal<{ jobId: string; url: string } | null>(null);
  readonly videoBusy = signal<'watch' | 'save' | null>(null);
  readonly videoError = signal<string | null>(null);
  /**
   * The video's speed. {@link fileSpeed} is the speed the file was made at - what is downloaded and sent to YouTube, with
   * subtitles timed to it. A speed picked here plays at once as a preview; applying it makes the file at that speed.
   */
  readonly speeds = SPEEDS;
  readonly fileSpeed = computed(() => this.run()?.render?.speed ?? 1);
  private readonly pickedSpeed = signal<number | null>(null);
  readonly speed = computed(() => this.pickedSpeed() ?? this.fileSpeed());
  /** A speed is being previewed that the file is not yet made at. */
  readonly speedPending = computed(() => !sameSpeed(this.speed(), this.fileSpeed()));
  /** How long the video will run at the previewed speed, in seconds; null when the length is not known. */
  readonly speedSeconds = computed(() => {
    const seconds = this.run()?.render?.seconds ?? 0;
    return seconds > 0 ? (seconds * this.fileSpeed()) / this.speed() : null;
  });
  /** The player's sound is off (muted, or its volume at zero) - the usual reason a finished video seems silent. */
  readonly videoSilent = signal(false);

  /** The prompt for writing the script by hand, once the search has finished. */
  readonly prompt = signal<string | null>(null);
  readonly promptError = signal<string | null>(null);
  readonly reply = signal('');
  readonly replyError = signal<string | null>(null);
  /** The engine a rewrite asks: null keeps the story's, '' is the server's own order. */
  readonly rewriteEngine = signal<string | null>(null);
  readonly engines = computed(() => this.caps()?.textEngines ?? []);
  readonly exporting = signal(false);
  readonly copied = signal(false);

  /** The choices for building, editable on this page until Build is pressed. */
  readonly buildOptions = signal<StoryBuildOptions | null>(null);

  /** Publishing: the dialog, whether the subtitles follow the video up, and what sending them last said. */
  readonly publishing = signal(false);
  readonly autoCaptions = signal(true);
  readonly captionBusy = signal<string | null>(null);
  readonly captionResults = signal<{ videoId: string; results: StoryCaptionResult[] } | null>(null);
  readonly subtitleBusy = signal<string | null>(null);
  readonly dubBusy = signal(false);

  readonly editor = viewChild(StoryScriptEditorComponent);

  readonly info = STAGE_INFO;
  readonly statusLabel = STATUS_LABEL;
  readonly reviewLabel = REVIEW_LABEL;
  readonly mark = stageMark;
  readonly tone = statusTone;
  readonly ago = timeAgo;
  readonly clock = clock;
  readonly when = whenLabel;
  readonly videoState = publicationState;
  readonly videoStages = VIDEO_STAGES;

  readonly terminal = computed(() => {
    const run = this.run();
    return run ? isTerminal(run.status) : false;
  });
  readonly canBuild = computed(() => {
    const run = this.run();
    return !!run?.script && !run.working && run.status !== 'AwaitingScript';
  });
  readonly approved = computed(() => !!this.run()?.scriptApprovedAtUtc);
  readonly warnings = computed(() => this.run()?.warnings ?? []);
  readonly language = computed(() => this.run()?.brief.language ?? 'hi');
  /** The stage that failed, so the notice can say which step to blame. */
  readonly failedStage = computed<StoryStage | null>(() => this.run()?.stages.find((stage) => stage.status === 'Failed') ?? null);

  /** Scenes with a picture of their own (not the plain background a build falls back to). */
  readonly pictured = computed(() => (this.run()?.script?.scenes ?? []).filter((s) => s.hasImage && s.imageSource !== 'placeholder').length);
  readonly sceneCount = computed(() => this.run()?.script?.scenes.length ?? 0);

  readonly tabs = computed(() => {
    const run = this.run();
    if (!run) return [];
    const hasScript = !!run.script;
    const waiting = run.status === 'AwaitingReview' ? run.review ?? null : null;
    const stage = (id: StoryStageId) => run.stages.find((s) => s.id === id);
    const visuals = stage('visuals');
    const narration = stage('narration');
    const music = stage('music');
    const video = VIDEO_STAGES.map(stage);
    const videoRunning = video.some((s) => s?.status === 'Running');
    const started = hasBegun(visuals) && run.status !== 'ScriptReady' && run.status !== 'AwaitingScript';
    const states: Record<StoryTab, TabState> = {
      overview: run.working || run.status === 'Failed' ? 'now' : 'todo',
      script: run.scriptApprovedAtUtc ? 'done' : run.status === 'AwaitingScript' || run.status === 'ScriptReady' ? 'now' : 'todo',
      pictures: !hasScript ? 'locked' : visuals?.status === 'Running' ? 'now'
        : this.pictured() === this.sceneCount() || isDone(visuals) ? 'done' : run.scriptApprovedAtUtc && run.status === 'ScriptReady' ? 'now' : 'todo',
      build: !hasScript || run.status === 'AwaitingScript' ? 'locked' : started ? 'done'
        : run.scriptApprovedAtUtc && run.status === 'ScriptReady' ? 'now' : 'todo',
      voice: !hasBegun(narration) && !this.voiced(run) ? 'locked'
        : waiting === 'narration' || narration?.status === 'Running' ? 'now' : isDone(narration) ? 'done' : 'todo',
      music: !hasBegun(music) && !run.music ? 'locked'
        : waiting === 'music' || music?.status === 'Running' ? 'now' : isDone(music) ? 'done' : 'todo',
      publish: !run.projectId && !run.render && !video.some(hasBegun) ? 'locked' : run.publications.length > 0 ? 'done'
        : run.status === 'Completed' || waiting === 'render' || videoRunning ? 'now' : 'todo',
    };
    const notes: Record<StoryTab, string> = {
      overview: run.working ? `${this.overall(run)}%` : '',
      script: run.scriptApprovedAtUtc ? 'Approved' : hasScript ? 'To approve' : '',
      pictures: visuals?.status === 'Running' ? `${visuals.progress}%` : hasScript ? `${this.pictured()}/${this.sceneCount()}` : '',
      build: started && run.working ? 'Started' : '',
      voice: narration?.status === 'Running' ? `${narration.progress}%` : waiting === 'narration' ? 'Listen'
        : narration?.status === 'Skipped' ? 'None' : '',
      music: music?.status === 'Running' ? `${music.progress}%` : waiting === 'music' ? 'Listen'
        : music?.code === 'music-off' ? 'Off' : '',
      publish: videoRunning ? `Making ${this.progressOf(run, VIDEO_STAGES)}%` : waiting === 'render' ? 'Watch'
        : run.publications.length > 0 ? `${run.publications.length} on YouTube` : '',
    };
    return TABS.map((tab, index) => ({ ...tab, step: index, state: states[tab.id], note: notes[tab.id] }));
  });

  /** What the story needs from the person next, for the Overview tab. */
  readonly next = computed<{ text: string; tab: StoryTab; action: string } | null>(() => {
    const run = this.run();
    if (!run) return null;
    switch (run.status) {
      case 'AwaitingScript': return { text: 'The search is done. Get the script written in any chat and paste it back.', tab: 'script', action: 'Write the script' };
      case 'ScriptReady':
        return run.scriptApprovedAtUtc
          ? { text: 'The script is approved. Add your pictures, or leave them to the AI, then build the video.', tab: 'pictures', action: 'Add the pictures' }
          : { text: 'The script is written. Read it, fix anything, and approve it to move on.', tab: 'script', action: 'Read and approve' };
      case 'AwaitingReview':
        switch (run.review) {
          case 'narration': return { text: 'The voice is ready. Listen to each scene, then approve it or ask for any scene again.', tab: 'voice', action: 'Listen to the voice' };
          case 'music': return { text: 'The music is ready. Listen to it with the voice, then approve it, ask for another, or add your own.', tab: 'music', action: 'Listen to the music' };
          default: return { text: 'The video is rendered. Watch it, then approve it or ask for a new look.', tab: 'publish', action: 'Watch the video' };
        }
      case 'Completed':
        return run.publications.length > 0
          ? { text: 'The video is on YouTube. Check its subtitles and details there.', tab: 'publish', action: 'See it' }
          : { text: 'The video is ready. Watch it once, then publish it to YouTube with its subtitles.', tab: 'publish', action: 'Watch and publish' };
      default: return null;
    }
  });

  /** The story's own YouTube details, for the publish dialog to open with. */
  readonly prefill = computed<YouTubePrefill | null>(() => {
    const run = this.run();
    const kit = run?.kit;
    const thumbnail = this.thumbnail();
    const language = run?.brief.language === 'en' ? 'en' : 'hi';
    if (!kit) return { thumbnail, language };
    return { title: kit.titleOptions[0] ?? null, description: kit.description, tags: kit.tags, firstComment: kit.pinnedComment, thumbnail, language };
  });

  /** The story's thumbnail picture, fetched as the publish dialog opens so it starts out chosen. */
  private readonly thumbnail = signal<Blob | null>(null);

  private timer: ReturnType<typeof setTimeout> | null = null;
  private failures = 0;
  private previous: StoryRun | null = null;
  private destroyed = false;
  /** The story whose prompt has been asked for, so a second look at it does not ask again. */
  private promptFor: string | null = null;

  /** The brand channels, to name the one a story is for; only worth saying when there is more than one. */
  private readonly channels = signal<BrandChannel[]>([]);

  constructor() {
    effect(() => {
      const id = this.runId();
      untracked(() => this.open(id));
    });
    this.api.listBrandChannels().subscribe({ next: (list) => this.channels.set(list), error: () => this.channels.set([]) });

    inject(DestroyRef).onDestroy(() => {
      this.destroyed = true;
      this.stopPolling();
      this.dropLocalVideo();
    });
  }

  // ------------------------------------------------------------------------------------------------ following the story

  private open(id: string): void {
    this.stopPolling();
    this.dropLocalVideo();
    this.videoError.set(null);
    this.run.set(null);
    this.previous = null;
    this.loading.set(true);
    this.loadError.set(null);
    this.offline.set(false);
    this.prompt.set(null);
    this.promptError.set(null);
    this.promptFor = null;
    this.reply.set('');
    this.replyError.set(null);
    this.actionError.set(null);
    this.buildOptions.set(null);
    this.publishing.set(false);
    this.captionResults.set(null);
    this.failures = 0;

    if (!this.caps()) {
      this.stories.options().subscribe({ next: (caps) => this.caps.set(caps), error: () => undefined });
    }
    this.ask(id);
  }

  private ask(id: string): void {
    this.stories.get(id).subscribe({
      next: (run) => {
        if (this.destroyed || id !== this.runId()) return;
        this.failures = 0;
        this.offline.set(false);
        this.loading.set(false);
        this.take(run);
        this.schedule();
      },
      error: (failure: unknown) => {
        if (this.destroyed || id !== this.runId()) return;
        this.loading.set(false);
        if (failure instanceof ApiFailure && failure.status === 404) {
          this.loadError.set('That story was not found. It may have been deleted.');
          return;
        }
        if (this.run() === null) {
          this.loadError.set(failure instanceof ApiFailure ? failure.message : 'The story could not be loaded.');
          return;
        }
        this.failures++;
        this.offline.set(true);
        this.schedule();
      },
    });
  }

  /** Shows a version of the story that came from the server - by polling, or as the answer to something the person did. */
  take(run: StoryRun): void {
    if (this.destroyed || run.id !== this.runId()) return;
    const before = this.previous;
    this.previous = run;
    this.heardAt.set(Date.now());
    this.run.set(run);

    // The build choices start as the story's own, and start again whenever a fresh script has just arrived to be read.
    if (this.buildOptions() === null || (before?.status !== run.status && run.status === 'ScriptReady')) {
      this.buildOptions.set({ ...run.options });
    }

    // The first look opens the tab asked for, or the one the story needs; a change of step moves on with it.
    if (before === null) {
      const named = this.tab() ?? '';
      const asked = OLD_TABS[named] ?? TABS.find((tab) => tab.id === named)?.id;
      this.selected.set(asked && this.tabs().find((tab) => tab.id === asked)?.state !== 'locked' ? asked : this.defaultTab(run));
    } else if (before.status !== run.status && run.status !== 'Building') {
      if (run.status === 'Failed') this.go('overview');
      else if (run.status === 'AwaitingReview') this.go(this.reviewTab(run));
      else if (run.status === 'Completed' && before.status === 'Building') this.go('publish');
      else if (run.status === 'ScriptReady' || run.status === 'AwaitingScript') this.go('script');
    } else {
      this.follow(before, run);
    }

    if (run.status === 'AwaitingScript' && this.prompt() === null && this.promptError() === null && this.promptFor !== run.id) this.loadPrompt(run.id);
    if (run.status !== 'AwaitingScript') this.promptError.set(null);
    if (before?.status === 'Building' && run.status === 'Completed') this.status.showNotice(`"${run.title}" is ready.`);
    if (before?.status === 'Building' && run.status === 'AwaitingReview' && run.review) this.status.showNotice(`${REVIEW_LABEL[run.review]}: it is ready for you.`);
    this.schedule();
  }

  /**
   * When one step of a build finishes and the next begins, moves to the new step's tab - but only for someone watching
   * the step that just finished (or the Settings tab they pressed Build on). Anyone reading something else is left
   * where they are, and the overview follows the whole story by itself.
   */
  private follow(before: StoryRun, run: StoryRun): void {
    const to = this.workTab(run);
    if (to === null) return;
    const from = this.workTab(before) ?? (before.status === 'AwaitingReview' ? this.reviewTab(before) : null);
    if (to === from) return;
    const watching = this.selected() === 'build' || (from !== null && this.selected() === from);
    if (watching) this.go(to);
  }

  /** The tab of the step being made now, or null when nothing is. */
  private workTab(run: StoryRun): StoryTab | null {
    const running = run.stages.find((stage) => stage.status === 'Running');
    return running ? STAGE_TAB[running.id] : null;
  }

  /** The tab where the person checks what the build stopped for. */
  private reviewTab(run: StoryRun): StoryTab {
    return run.review === 'render' ? 'publish' : run.review === 'music' ? 'music' : 'voice';
  }

  private defaultTab(run: StoryRun): StoryTab {
    switch (run.status) {
      case 'AwaitingScript': return 'script';
      case 'ScriptReady': return run.scriptApprovedAtUtc ? 'pictures' : 'script';
      case 'AwaitingReview': return this.reviewTab(run);
      case 'Completed': return 'publish';
      case 'Building': return this.workTab(run) ?? 'overview';
      default: return 'overview';
    }
  }

  private schedule(): void {
    this.stopPolling();
    const run = this.run();
    if (this.destroyed || !run || (!run.working && !this.offline())) return;
    const wait = Math.min(RETRY_MAX_MS, POLL_MS * 2 ** Math.min(this.failures, 3));
    this.timer = setTimeout(() => this.ask(run.id), wait);
  }

  private stopPolling(): void {
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
  }

  // ------------------------------------------------------------------------------------------------ tabs

  /** Opens a tab and puts it in the address, so a reload or a shared link opens the same one. */
  go(tab: StoryTab): void {
    if (this.tabs().find((t) => t.id === tab)?.state === 'locked') return;
    this.selected.set(tab);
    void this.router.navigate([], { queryParams: { tab }, queryParamsHandling: 'merge', replaceUrl: true });
  }

  /** Arrow keys move along the tab bar, as a tab list should. */
  onTabKey(event: KeyboardEvent, index: number): void {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const open = this.tabs().filter((tab) => tab.state !== 'locked');
    const at = open.findIndex((tab) => tab.id === this.tabs()[index].id);
    const target = open[(at + step + open.length) % open.length];
    this.go(target.id);
    document.getElementById(`sr-tab-${target.id}`)?.focus();
  }

  /** Asked by the route before leaving: script text typed and not saved would be lost. */
  canLeave(): boolean {
    return !this.editor()?.dirty() || confirm('You have script changes that are not saved. Leave without saving them?');
  }

  // ------------------------------------------------------------------------------------------------ what the person does

  private async act(action: Action, call: () => Promise<StoryRun | void>): Promise<boolean> {
    if (this.busy() !== null) return false;
    this.busy.set(action);
    this.actionError.set(null);
    try {
      const result = await call();
      if (result) this.take(result);
      return true;
    } catch (failure: unknown) {
      this.actionError.set(failure instanceof ApiFailure ? failure.message : 'That did not work. Please try again.');
      return false;
    } finally {
      this.busy.set(null);
    }
  }

  async cancel(): Promise<void> {
    const run = this.run();
    if (!run) return;
    await this.act('cancel', () => firstValueFrom(this.stories.cancel(run.id)));
  }

  async retry(): Promise<void> {
    const run = this.run();
    if (!run) return;
    await this.act('retry', () => firstValueFrom(this.stories.retry(run.id)));
  }

  async remove(): Promise<void> {
    const run = this.run();
    if (!run) return;
    const kept = run.projectId ? ' The project and video it made are kept, and so is anything on YouTube.' : '';
    if (!confirm(`Delete "${run.title}", with its script, pictures and narration?${kept}`)) return;
    const deleted = await this.act('delete', async () => {
      this.stopPolling();
      await firstValueFrom(this.stories.delete(run.id));
    });
    if (deleted) {
      this.editor()?.reset();
      await this.router.navigate(['/story-agent']);
    } else {
      this.schedule();
    }
  }

  /** Saves what was typed, then marks the script approved and moves on to the pictures. */
  async approve(): Promise<void> {
    const run = this.run();
    if (!run) return;
    const editor = this.editor();
    if (editor && !(await editor.save())) {
      this.status.showError('The script has something to fix before it can be approved. See the note above the save bar.');
      return;
    }
    if (await this.act('approve', () => firstValueFrom(this.stories.approve(run.id)))) {
      this.status.showNotice('Script approved and saved.');
      this.go('pictures');
    }
  }

  /** Saves what was typed in the script, then starts making the video. Pressing Build approves the script too. */
  async build(): Promise<void> {
    const run = this.run();
    const options = this.buildOptions();
    if (!run || !options) return;

    const editor = this.editor();
    if (editor && !(await editor.save())) {
      this.go('script');
      return;
    }
    // A build that would pass the warning share of a paid Google daily limit asks first; a failed check never blocks.
    let report: StoryBudgetReport | null = null;
    try {
      report = await firstValueFrom(this.stories.budget(run.id, options));
    } catch {
      report = null;
    }
    if (report && report.status !== 'ok' && report.lines.some((l) => l.status !== 'ok')) {
      this.budgetWarning.set({ report, options });
      return;
    }
    await this.startBuild(options);
  }

  /** The limits a build is about to pass, waiting for the person's answer. */
  readonly budgetWarning = signal<{ report: StoryBudgetReport; options: StoryBuildOptions } | null>(null);
  readonly budgetBusy = signal(false);

  budgetLines(report: StoryBudgetReport) {
    return report.lines.filter((l) => l.status !== 'ok');
  }

  budgetReset(report: StoryBudgetReport): string {
    return new Date(report.resetsAtUtc).toLocaleString();
  }

  /** True when a flagged line is one of Google's own limits, so its reset time is worth showing. */
  budgetHasGoogle(report: StoryBudgetReport): boolean {
    return this.budgetLines(report).some((l) => l.kind === 'google');
  }

  /** "Proceed anyway", "Proceed with the alternatives" (the free one for each flagged limit) or cancel. */
  async answerBudget(choice: 'anyway' | 'without' | 'cancel'): Promise<void> {
    const pending = this.budgetWarning();
    if (!pending || choice === 'cancel') {
      this.budgetWarning.set(null);
      return;
    }
    if (choice === 'anyway') {
      this.budgetWarning.set(null);
      await this.startBuild(pending.options);
      return;
    }
    this.budgetBusy.set(true);
    try {
      const options = await this.withoutPaid(pending.report, pending.options);
      this.buildOptions.set(options);
      this.budgetWarning.set(null);
      await this.startBuild(options);
    } finally {
      this.budgetBusy.set(false);
    }
  }

  private async startBuild(options: StoryBuildOptions): Promise<void> {
    const run = this.run();
    if (!run) return;
    if (await this.act('build', () => firstValueFrom(this.stories.build(run.id, options)))) this.go('overview');
  }

  /**
   * The same options with the flagged parts swapped for free ones: a speech limit moves narration to the first engine
   * running on this machine (or subtitles only when there is none), a music limit uses a royalty-free track, and an image
   * engine's cap keeps the person's own pictures and gives the other scenes plain backgrounds.
   */
  private async withoutPaid(report: StoryBudgetReport, options: StoryBuildOptions): Promise<StoryBuildOptions> {
    const flagged = this.budgetLines(report);
    const music = flagged.some((l) => l.area === 'music');
    const speech = flagged.some((l) => l.area === 'speech');
    const images = flagged.some((l) => l.area === 'image');
    const next: StoryBuildOptions = { ...options };
    if (music) next.musicSource = 'Search';
    if (images) {
      next.visuals = 'UploadsOnly';
      this.status.showNotice('No pictures will be generated: scenes without a picture of yours get a plain background.');
    }
    if (speech) {
      let local: string | null = null;
      try {
        const voices = await firstValueFrom(this.api.voiceoverVoices());
        local = voices.engines?.find((e) => e.runsLocally)?.id ?? null;
      } catch {
        local = null;
      }
      if (local) {
        Object.assign(next, { speechEngine: local, voiceId: null, speechModel: null, castVoices: false });
        if (next.narration === 'MyVoice') next.narration = 'Stock';
      } else {
        next.narration = 'None';
      }
      this.status.showNotice(local ? `Narration will use ${local}, which runs on this machine.` : 'No free voice is set up, so the video will have subtitles only.');
    }
    return next;
  }

  async rewrite(writer: StoryWriterMode): Promise<void> {
    const run = this.run();
    if (!run) return;
    const lost = run.script
      ? 'This throws the script away - your edits, and the pictures you attached to its scenes - and starts again from the same research. '
      : '';
    if (!confirm(`${lost}${writer === 'Manual' ? 'You will paste the new script in yourself.' : 'The text model will write it again.'} Continue?`)) return;
    this.reply.set('');
    this.prompt.set(null);
    this.promptFor = null;
    const engine = writer === 'Auto' ? (this.rewriteEngine() ?? undefined) : undefined;
    await this.act('rewrite', () => firstValueFrom(this.stories.rewrite(run.id, writer, engine)));
  }

  /** The channel the story is for, by name, when there is a choice of channels. */
  channelName(id: string | null | undefined): string | null {
    const list = this.channels();
    if (list.length < 2) return null;
    const wanted = id || DEFAULT_BRAND_CHANNEL;
    return list.find((c) => c.id === wanted)?.name ?? null;
  }

  /** The name of the engine picked for this story, or null when it walks the server's order. */
  engineName(id: string | null | undefined): string | null {
    return id ? (this.engines().find((e) => e.id === id)?.name ?? id) : null;
  }

  /** Saves the story as a file, to keep or to start again from with Import on the Story Agent page. */
  async exportStory(): Promise<void> {
    const run = this.run();
    if (!run || this.exporting()) return;
    this.exporting.set(true);
    try {
      saveStoryFile(await firstValueFrom(this.stories.exportStory(run.id)), run.title);
    } catch (failure: unknown) {
      this.status.showError(failure instanceof ApiFailure ? failure.message : 'The story could not be exported.');
    } finally {
      this.exporting.set(false);
    }
  }

  text(event: Event): string {
    return (event.target as HTMLSelectElement).value;
  }

  async paste(): Promise<void> {
    const run = this.run();
    const reply = this.reply().trim();
    if (!run || !reply) return;
    const tooLong = replyProblem(reply);
    if (tooLong) {
      this.replyError.set(tooLong);
      return;
    }
    this.replyError.set(null);

    const accepted = await this.act('paste', () => firstValueFrom(this.stories.paste(run.id, reply)));
    if (accepted) {
      this.reply.set('');
    } else {
      // The server's reason belongs next to the box it is about, not at the top of the page.
      this.replyError.set(this.actionError());
      this.actionError.set(null);
    }
  }

  private loadPrompt(id: string): void {
    this.promptFor = id;
    this.stories.prompt(id).subscribe({
      next: (text) => {
        if (id === this.runId()) this.prompt.set(text);
      },
      error: (failure: unknown) => {
        if (id === this.runId()) this.promptError.set(failure instanceof ApiFailure ? failure.message : 'The prompt could not be prepared.');
      },
    });
  }

  async copyPrompt(): Promise<void> {
    const text = this.prompt();
    if (!text) return;
    if (await copyText(text)) {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 1800);
    } else {
      this.status.showError('The browser did not allow copying. Select the prompt and copy it by hand.');
    }
  }

  /** The run came back from the script editor changed: a picture attached, or the script saved. */
  onEditorChange(run: StoryRun): void {
    this.take(run);
  }

  // ------------------------------------------------------------------------------------------------ YouTube and subtitles

  async openPublish(): Promise<void> {
    if (!this.signedIn()) {
      this.auth.openAuthModal();
      return;
    }
    const run = this.run();
    this.thumbnail.set(null);
    if (run?.script?.hasThumbnail) {
      try {
        this.thumbnail.set(await firstValueFrom(this.stories.thumbnailImage(run.id)));
      } catch {
        // The dialog opens without it; a thumbnail can still be picked there.
      }
    }
    this.publishing.set(true);
  }

  /** The upload finished: show the new video, and send the subtitles after it when that was asked for. */
  async onPublished(upload: YouTubeUpload): Promise<void> {
    const run = this.run();
    if (!run) return;
    try {
      this.take(await firstValueFrom(this.stories.get(run.id)));
    } catch {
      // The next look at the page shows it; the upload itself is done either way.
    }
    if (this.autoCaptions() && upload.videoId && (this.run()?.subtitles.length ?? 0) > 0) {
      await this.sendCaptions(upload.videoId);
    }
  }

  /** Adds the story's subtitles (every language it has, unless one is named) to one of its YouTube videos. */
  async sendCaptions(videoId: string, language?: string): Promise<void> {
    const run = this.run();
    if (!run || this.captionBusy() !== null) return;
    this.captionBusy.set(videoId);
    this.captionResults.set(null);
    try {
      const sent = await firstValueFrom(this.stories.sendSubtitles(run.id, videoId, language ? [language] : undefined));
      this.take(sent.run);
      this.captionResults.set({ videoId, results: sent.results });
      const added = sent.results.filter((r) => r.outcome === 'added').map((r) => r.label);
      if (added.length > 0) this.status.showNotice(`${added.join(' and ')} subtitles added on YouTube.`);
    } catch (failure: unknown) {
      this.captionResults.set({
        videoId,
        results: [{ language: language ?? '', label: 'Subtitles', outcome: 'failed', message: failure instanceof ApiFailure ? failure.message : 'The subtitles could not be sent.' }],
      });
    } finally {
      this.captionBusy.set(null);
    }
  }

  /** The languages this story has that a video does not have yet. */
  missingCaptions(video: StoryPublication): string[] {
    return (this.run()?.subtitles ?? []).map((s) => s.language).filter((language) => !video.captions.includes(language));
  }

  /** The dub track: a WAV the length of the video, added in YouTube Studio as a second audio track. */
  async downloadDub(): Promise<void> {
    const run = this.run();
    if (!run?.dub?.trackReady || this.dubBusy()) return;
    this.dubBusy.set(true);
    try {
      const blob = await lastValueFrom(this.stories.dubTrack(run.id));
      saveBlob(blob, `${fileNameOf(run.script?.titleEnglish || run.title)}.${run.dub.language}-dub.wav`);
    } catch (failure: unknown) {
      this.status.showError(failure instanceof ApiFailure ? failure.message : 'The dub track could not be downloaded.');
    } finally {
      this.dubBusy.set(false);
    }
  }

  async downloadSubtitles(language: string): Promise<void> {
    const run = this.run();
    if (!run || this.subtitleBusy() !== null) return;
    this.subtitleBusy.set(language);
    try {
      const blob = await lastValueFrom(this.stories.subtitleFile(run.id, language));
      saveBlob(blob, `${fileNameOf(run.script?.titleEnglish || run.title)}.${language}.srt`);
    } catch (failure: unknown) {
      this.status.showError(failure instanceof ApiFailure ? failure.message : 'The subtitles could not be downloaded.');
    } finally {
      this.subtitleBusy.set(null);
    }
  }

  // ------------------------------------------------------------------------------------------------ links

  previewUrl(jobId: string): string {
    return this.api.previewUrl(jobId);
  }

  downloadUrl(jobId: string): string {
    return this.api.downloadUrl(jobId);
  }

  /** Fetches the finished video through the API client: to play it here, or to save it as a file. */
  async fetchVideo(jobId: string, save: boolean): Promise<void> {
    if (this.videoBusy() !== null) return;
    this.videoBusy.set(save ? 'save' : 'watch');
    this.videoError.set(null);
    try {
      const blob = await lastValueFrom(this.stories.renderFile(jobId));
      if (save) {
        saveBlob(blob, `${fileNameOf(this.run()?.title ?? '')}.mp4`);
      } else {
        this.dropLocalVideo();
        this.localVideo.set({ jobId, url: URL.createObjectURL(blob) });
      }
    } catch (failure: unknown) {
      this.videoError.set(failure instanceof ApiFailure ? failure.message : 'The video could not be loaded.');
    } finally {
      this.videoBusy.set(null);
    }
  }

  // ------------------------------------------------------------------------------------------------ the player

  /**
   * Starts the player with its sound on, previewing any speed picked but not yet applied. A viewer who muted the player
   * once and forgot hears nothing on the next video, so the sound is put back on each load.
   */
  onVideoReady(video: HTMLVideoElement): void {
    video.muted = false;
    if (video.volume === 0) video.volume = 1;
    video.preservesPitch = true;
    video.playbackRate = this.speed() / this.fileSpeed();
    this.onVolume(video);
  }

  /** Follows speed changes made from the player's own menu too, so the buttons always show the true speed. */
  onRate(video: HTMLVideoElement): void {
    const speed = Math.round(video.playbackRate * this.fileSpeed() * 100) / 100;
    if (!sameSpeed(speed, this.speed())) this.pickedSpeed.set(sameSpeed(speed, this.fileSpeed()) ? null : speed);
  }

  onVolume(video: HTMLVideoElement): void {
    this.videoSilent.set(video.muted || video.volume === 0);
  }

  unmute(video: HTMLVideoElement): void {
    video.muted = false;
    if (video.volume === 0) video.volume = 1;
  }

  /** Previews a speed in the player; the file is changed only by {@link applySpeed}. */
  setSpeed(speed: number, video: HTMLVideoElement): void {
    this.pickedSpeed.set(sameSpeed(speed, this.fileSpeed()) ? null : speed);
    video.playbackRate = speed / this.fileSpeed();
  }

  /** Makes the video at the previewed speed: the download, YouTube and the subtitles then all use it. */
  async applySpeed(): Promise<void> {
    const run = this.run();
    if (!run || !this.speedPending()) return;
    const speed = this.speed();
    if (await this.act('speed', () => firstValueFrom(this.stories.changeSpeed(run.id, speed)))) this.pickedSpeed.set(null);
  }

  private dropLocalVideo(): void {
    const local = this.localVideo();
    if (local) URL.revokeObjectURL(local.url);
    this.localVideo.set(null);
  }

  /** The video held in memory for this render, if it has been loaded. */
  localUrl(jobId: string): string | null {
    const local = this.localVideo();
    return local && local.jobId === jobId ? local.url : null;
  }

  /** Some scene has narration already, from this build or an earlier one. */
  private voiced(run: StoryRun): boolean {
    return (run.script?.scenes ?? []).some((scene) => scene.hasAudio);
  }

  /** A progress figure for the whole story, as the list shows it. */
  overall(run: StoryRun): number {
    return this.progressOf(run, run.stages.map((stage) => stage.id));
  }

  /** How far the given steps have got together, 0-100. */
  progressOf(run: StoryRun, ids: StoryStageId[]): number {
    const stages = run.stages.filter((stage) => ids.includes(stage.id));
    if (stages.length === 0) return 0;
    const done = stages.reduce((sum, stage) => {
      if (isDone(stage)) return sum + 100;
      return stage.status === 'Running' ? sum + stage.progress : sum;
    }, 0);
    return Math.round(done / stages.length);
  }

  /** The given steps that are being made right now, for a tab to show live. */
  live(run: StoryRun, ids: StoryStageId[]): StoryStage[] {
    return run.stages.filter((stage) => stage.status === 'Running' && ids.includes(stage.id));
  }

  /** How long a step has been running, as m:ss, from its start and the last time the server answered. */
  elapsed(stage: StoryStage): string {
    const started = stage.startedAtUtc ? Date.parse(stage.startedAtUtc) : NaN;
    return Number.isNaN(started) ? '' : this.clock(Math.max(0, (this.heardAt() - started) / 1000));
  }
}
