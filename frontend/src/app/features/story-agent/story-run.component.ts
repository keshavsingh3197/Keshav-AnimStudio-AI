import { DecimalPipe } from '@angular/common';
import { Component, DestroyRef, computed, effect, inject, input, signal, untracked, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom, lastValueFrom } from 'rxjs';

import { ApiFailure } from '../../core/interceptors/api-error.interceptor';
import {
  StoryAgentOptions,
  StoryBuildOptions,
  StoryRun,
  StoryStage,
  StoryWriterMode,
} from '../../core/models/story-agent.models';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { StatusService } from '../../core/services/status.service';
import { StoryAgentService } from '../../core/services/story-agent.service';
import { StoryKitComponent } from './story-kit.component';
import { StoryOptionsComponent } from './story-options.component';
import { StoryScriptEditorComponent } from './story-script-editor.component';
import { STAGE_INFO, STATUS_LABEL, clock, copyText, isTerminal, replyProblem, stageMark, statusTone, timeAgo } from './story-agent.utils';

/** How often a story being made is asked about, and how long to wait after a failed ask. */
const POLL_MS = 2000;
const RETRY_MAX_MS = 10_000;

type Action = 'cancel' | 'retry' | 'delete' | 'build' | 'rewrite' | 'paste';

/**
 * One story, from the first search to the finished video. It follows a story being made by asking the server about it
 * every couple of seconds, and shows whatever the story needs from the person next: a script to paste, a script to read
 * and illustrate, or - once it is done - the video and the details to upload it with.
 */
@Component({
  selector: 'app-story-run',
  imports: [RouterLink, FormsModule, DecimalPipe, StoryScriptEditorComponent, StoryOptionsComponent, StoryKitComponent],
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

  readonly run = signal<StoryRun | null>(null);
  readonly caps = signal<StoryAgentOptions | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  /** The server could not be reached on the last ask; the page keeps what it had and keeps trying. */
  readonly offline = signal(false);
  readonly busy = signal<Action | null>(null);
  readonly actionError = signal<string | null>(null);

  /**
   * Someone who is not signed in is a guest, and a <video> or a download link cannot send the header that says so. For
   * them the video is fetched through the API client and played from memory.
   */
  readonly signedIn = this.auth.isAuthenticated;
  readonly localVideo = signal<{ jobId: string; url: string } | null>(null);
  readonly videoBusy = signal<'watch' | 'save' | null>(null);
  readonly videoError = signal<string | null>(null);

  /** The prompt for writing the script by hand, once the search has finished. */
  readonly prompt = signal<string | null>(null);
  readonly promptError = signal<string | null>(null);
  readonly reply = signal('');
  readonly replyError = signal<string | null>(null);
  readonly copied = signal(false);

  /** The choices for building, editable on this page until Build is pressed. */
  readonly buildOptions = signal<StoryBuildOptions | null>(null);

  readonly editor = viewChild(StoryScriptEditorComponent);

  readonly info = STAGE_INFO;
  readonly statusLabel = STATUS_LABEL;
  readonly mark = stageMark;
  readonly tone = statusTone;
  readonly ago = timeAgo;
  readonly clock = clock;

  readonly terminal = computed(() => {
    const run = this.run();
    return run ? isTerminal(run.status) : false;
  });
  readonly canBuild = computed(() => {
    const run = this.run();
    return !!run?.script && !run.working && run.status !== 'AwaitingScript';
  });
  readonly warnings = computed(() => this.run()?.warnings ?? []);
  readonly language = computed(() => this.run()?.brief.language ?? 'hi');
  /** The stage that failed, so the notice can say which step to blame. */
  readonly failedStage = computed<StoryStage | null>(() => this.run()?.stages.find((stage) => stage.status === 'Failed') ?? null);

  private timer: ReturnType<typeof setTimeout> | null = null;
  private failures = 0;
  private previous: StoryRun | null = null;
  private destroyed = false;
  /** The story whose prompt has been asked for, so a second look at it does not ask again. */
  private promptFor: string | null = null;

  constructor() {
    effect(() => {
      const id = this.runId();
      untracked(() => this.open(id));
    });

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
    this.run.set(run);

    // The build choices start as the story's own, and start again whenever a fresh script has just arrived to be read.
    if (this.buildOptions() === null || (before?.status !== run.status && run.status === 'ScriptReady')) {
      this.buildOptions.set({ ...run.options });
    }

    if (run.status === 'AwaitingScript' && this.prompt() === null && this.promptError() === null && this.promptFor !== run.id) this.loadPrompt(run.id);
    if (run.status !== 'AwaitingScript') this.promptError.set(null);
    if (before?.status === 'Building' && run.status === 'Completed') this.status.showNotice(`"${run.title}" is ready.`);
    this.schedule();
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
    const kept = run.projectId ? ' The project and video it made are kept.' : '';
    if (!confirm(`Delete "${run.title}", with its script, pictures and narration?${kept}`)) return;
    const deleted = await this.act('delete', async () => {
      this.stopPolling();
      await firstValueFrom(this.stories.delete(run.id));
    });
    if (deleted) await this.router.navigate(['/story-agent']);
    else this.schedule();
  }

  /** Saves what was typed in the script, then starts making the video. */
  async build(): Promise<void> {
    const run = this.run();
    const options = this.buildOptions();
    if (!run || !options) return;

    const editor = this.editor();
    if (editor && !(await editor.save())) return;
    await this.act('build', () => firstValueFrom(this.stories.build(run.id, options)));
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
    await this.act('rewrite', () => firstValueFrom(this.stories.rewrite(run.id, writer)));
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
      const url = URL.createObjectURL(blob);
      if (save) {
        const link = document.createElement('a');
        link.href = url;
        link.download = `${this.fileName(this.run()?.title ?? '')}.mp4`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
      } else {
        this.dropLocalVideo();
        this.localVideo.set({ jobId, url });
      }
    } catch (failure: unknown) {
      this.videoError.set(failure instanceof ApiFailure ? failure.message : 'The video could not be loaded.');
    } finally {
      this.videoBusy.set(null);
    }
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

  /** A title as a file name: no characters Windows refuses, and not so long that it is cut off by the folder. */
  private fileName(title: string): string {
    return title.replace(/[\\/:*?"<>|\x00-\x1f]+/g, '_').trim().slice(0, 60) || 'story';
  }

  /** A progress figure for the whole story, as the list shows it. */
  overall(run: StoryRun): number {
    if (run.stages.length === 0) return 0;
    const done = run.stages.reduce((sum, stage) => {
      if (stage.status === 'Completed' || stage.status === 'Skipped') return sum + 100;
      return stage.status === 'Running' ? sum + stage.progress : sum;
    }, 0);
    return Math.round(done / run.stages.length);
  }
}
