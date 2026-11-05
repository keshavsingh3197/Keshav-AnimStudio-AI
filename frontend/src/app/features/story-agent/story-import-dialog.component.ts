import { Component, computed, inject, input, output, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { ApiFailure } from '../../core/interceptors/api-error.interceptor';
import { StoryExportFile, StoryGenreOption } from '../../core/models/story-agent.models';
import { StoryAgentService } from '../../core/services/story-agent.service';
import { FileDropDirective } from '../../shared/file-drop.directive';
import { STORY_FILE_ACCEPT, readStoryFile } from './story-agent.utils';

/**
 * Starts a new story from a story file exported earlier - here or on another server. The file is looked at before
 * anything is sent, so the person sees which story it is; the server then searches afresh and reads the script with the
 * same checks as a pasted reply, and the story waits for the script to be read and approved as any other does.
 *
 *   @if (importing()) { <app-story-import-dialog [genres]="genres()" (closed)="importing.set(false)" /> }
 */
@Component({
  selector: 'app-story-import-dialog',
  imports: [FileDropDirective],
  host: { '(document:keydown.escape)': 'close()' },
  template: `
    <div class="si-backdrop" (click)="close()">
      <div class="si-dialog" role="dialog" aria-modal="true" aria-labelledby="si-title" (click)="$event.stopPropagation()">
        <div class="si-head">
          <strong id="si-title">⬆ Import a story</strong>
          <button type="button" class="si-x" (click)="close()" title="Close" aria-label="Close" [disabled]="sending()">✕</button>
        </div>

        <label class="si-drop" [class.si-drop-ready]="file()" [appFileDrop]="accept" (filesDropped)="pick($event[0])">
          <input type="file" [accept]="accept" (change)="choose($event)" [disabled]="sending()" />
          @if (file()) {
            <span class="si-drop-icon" aria-hidden="true">📄</span>
            <span><strong>{{ name() }}</strong> · choose another file to change it</span>
          } @else {
            <span class="si-drop-icon" aria-hidden="true">⬆</span>
            <span><strong>Drop a .story.json file here</strong>, or click to choose one. Export one from any story's page.</span>
          }
        </label>

        @if (problem(); as p) {
          <div class="notice error" role="alert">{{ p }}</div>
        }

        @if (file(); as f) {
          <dl class="si-facts">
            <div><dt>Title</dt><dd [attr.lang]="f.story.language">{{ f.script?.title || f.story.title }}</dd></div>
            <div><dt>Kind</dt><dd>{{ genreName() }}</dd></div>
            <div><dt>Scenes</dt><dd>{{ f.script?.scenes?.length ?? 0 }}</dd></div>
            <div><dt>Language</dt><dd>{{ f.story.language === 'en' ? 'English' : 'Hindi' }}</dd></div>
            <div><dt>Shape</dt><dd>{{ f.story.format === 'Vertical' ? '9:16 vertical' : '16:9 wide' }}</dd></div>
            <div><dt>Exported</dt><dd>{{ exported() }}</dd></div>
          </dl>
          <p class="si-note">
            A new story is started from this file. Its sources are searched again and the script is checked as if it had been
            pasted, so you read and approve it before anything is made. A voice or AI engine that isn't yours or isn't on
            here is left out.
          </p>
        }

        <div class="si-actions">
          <button type="button" class="secondary" (click)="close()" [disabled]="sending()">Cancel</button>
          <button type="button" [disabled]="!file() || sending()" (click)="start()">
            @if (sending()) { <span class="spinner" aria-hidden="true"></span> }
            Start this story
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .si-backdrop { position: fixed; inset: 0; z-index: 2000; background: color-mix(in srgb, var(--bg) 76%, transparent);
      backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center; padding: 16px; }
    .si-dialog { width: min(560px, 100%); max-height: 90vh; overflow-y: auto; display: flex; flex-direction: column; gap: 14px;
      background: var(--surface); color: var(--text); border: 1px solid var(--border-bright); border-radius: 15px; padding: 16px 18px;
      box-shadow: 0 24px 64px rgba(0,0,0,.72), inset 0 1px 0 rgba(255,255,255,.06); }
    .si-head { display: flex; align-items: center; justify-content: space-between; padding-bottom: 10px; border-bottom: 1px solid var(--border); }
    .si-head strong { font-size: 1.02rem; font-weight: 800; }
    .si-x { background: var(--surface-2); border: 1px solid var(--border); border-radius: 7px; padding: 3px 8px; color: var(--muted); font-size: .95rem; cursor: pointer; box-shadow: none; }
    .si-x:hover:not(:disabled) { color: var(--text); border-color: var(--border-bright); background: var(--surface-3); transform: none; box-shadow: none; }
    .si-drop { position: relative; display: flex; align-items: center; gap: .8rem; margin: 0; padding: 1.2rem 1rem; cursor: pointer;
      border: 1.5px dashed var(--border-bright); border-radius: var(--radius-sm); background: var(--ov-1);
      font-size: .88rem; font-weight: 400; line-height: 1.45; color: var(--text-dim); }
    .si-drop:hover, .si-drop:focus-within { border-color: var(--brand); color: var(--text); }
    .si-drop-ready { border-style: solid; border-color: color-mix(in oklab, var(--brand) 55%, var(--border)); }
    .si-drop input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
    .si-drop-icon { font-size: 1.5rem; flex: 0 0 auto; }
    .si-facts { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: .6rem; margin: 0; }
    .si-facts div { display: grid; gap: .15rem; padding: .5rem .65rem; border: 1px solid var(--border); border-radius: var(--radius-sm); }
    .si-facts dt { font-size: .74rem; color: var(--muted); }
    .si-facts dd { margin: 0; font-weight: 650; overflow-wrap: anywhere; }
    .si-note { margin: 0; font-size: .8rem; line-height: 1.5; color: var(--muted); }
    .si-actions { display: flex; justify-content: flex-end; gap: .6rem; flex-wrap: wrap; }
  `],
})
export class StoryImportDialogComponent {
  private readonly stories = inject(StoryAgentService);
  private readonly router = inject(Router);

  readonly genres = input<StoryGenreOption[]>([]);
  readonly closed = output<void>();

  readonly accept = STORY_FILE_ACCEPT;
  readonly file = signal<StoryExportFile | null>(null);
  readonly name = signal('');
  readonly problem = signal<string | null>(null);
  readonly sending = signal(false);

  readonly genreName = computed(() => {
    const id = this.file()?.story.genreId;
    return this.genres().find((g) => g.id === id)?.name ?? (id || 'Devotional');
  });
  readonly exported = computed(() => {
    const at = this.file()?.exportedAtUtc;
    return at ? new Date(at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '-';
  });

  choose(event: Event): void {
    const input = event.target as HTMLInputElement;
    const picked = input.files?.[0];
    input.value = '';
    if (picked) void this.pick(picked);
  }

  async pick(picked: File): Promise<void> {
    this.problem.set(null);
    try {
      this.file.set(await readStoryFile(picked));
      this.name.set(picked.name);
    } catch (error: unknown) {
      this.file.set(null);
      this.problem.set(error instanceof Error ? error.message : 'That file could not be read.');
    }
  }

  async start(): Promise<void> {
    const file = this.file();
    if (!file || this.sending()) return;
    this.sending.set(true);
    this.problem.set(null);
    try {
      const run = await firstValueFrom(this.stories.importStory(file));
      this.closed.emit();
      await this.router.navigate(['/story-agent', run.id]);
    } catch (failure: unknown) {
      this.problem.set(failure instanceof ApiFailure ? failure.message : 'The story could not be imported.');
    } finally {
      this.sending.set(false);
    }
  }

  close(): void {
    if (!this.sending()) this.closed.emit();
  }
}
