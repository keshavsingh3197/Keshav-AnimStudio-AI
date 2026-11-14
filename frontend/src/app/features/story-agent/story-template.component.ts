import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { ApiFailure } from '../../core/interceptors/api-error.interceptor';
import { Character, Project } from '../../core/models/api.models';
import { EffectClip } from '../../core/models/effects.models';
import { ApiService } from '../../core/services/api.service';
import { EffectsService } from '../../core/services/effects.service';
import { StoryAgentService } from '../../core/services/story-agent.service';
import {
  FunnyEndingRule, PackAge, PackCharacter, PackGender, PackLibrary, PackMeme, PackSettings, STORY_PACK_GENRES,
  STORY_PACK_MAX_EPISODES, StoryPack, autoFixStoryPack, backgroundPrompts, buildPackPrompt, buildPackTemplate,
  characterPrompts, episodeFiles, parseStoryPack, reviewStoryPack,
} from './story-pack';
import { saveBlob } from './story-agent.utils';
import { LoadingStateComponent } from '../../shared/loading-state.component';

interface ImportResult { episode: number; title: string; runId?: string; error?: string }

const DRAFT_KEY = 'animstudio.story-template.reply';

/**
 * The Story Template Studio: build one template for many episodes with characters from the character pages and memes
 * from the library, fill it in any outside AI tool, paste it back, see every scene, and create the stories. Nothing on
 * this page calls an AI engine; importing only starts Story Agent runs, which wait for the person to build them.
 */
@Component({
  selector: 'app-story-template',
  imports: [FormsModule, RouterLink, LoadingStateComponent],
  templateUrl: './story-template.component.html',
  styleUrl: './story-template.component.css',
})
export class StoryTemplateComponent implements OnInit, OnDestroy {
  private readonly api = inject(ApiService);
  private readonly effects = inject(EffectsService);
  private readonly stories = inject(StoryAgentService);

  readonly Math = Math;
  readonly genres = STORY_PACK_GENRES;
  readonly maxEpisodes = STORY_PACK_MAX_EPISODES;

  // --- the story
  readonly title = signal('');
  readonly idea = signal('');
  readonly genreId = signal('funny');
  readonly language = signal<'hi' | 'en'>('hi');
  readonly style = signal<'2D' | '3D'>('2D');
  readonly format = signal<'Vertical' | 'Wide'>('Vertical');
  readonly voicing = signal<'CharactersOnly' | 'Narrated'>('CharactersOnly');
  readonly episodes = signal(3);
  readonly scenesPerEpisode = signal(6);
  readonly secondsPerEpisode = signal(60);
  readonly funnyEndings = signal<FunnyEndingRule>('episode-end');
  readonly visuals = signal<'UploadsOnly' | 'Auto'>('UploadsOnly');

  // --- characters and memes
  readonly projects = signal<Project[]>([]);
  readonly projectId = signal('');
  readonly projectCharacters = signal<Character[]>([]);
  readonly picked = signal<PackCharacter[]>([]);
  readonly newName = signal('');
  readonly newGender = signal<PackGender | ''>('');
  readonly newAge = signal<PackAge | ''>('');
  readonly newLook = signal('');
  readonly memeLibrary = signal<EffectClip[]>([]);
  readonly memeIds = signal<ReadonlySet<string>>(new Set());

  // --- the reply
  readonly reply = signal('');
  readonly pack = signal<StoryPack | null>(null);
  readonly parseError = signal<string | null>(null);
  readonly results = signal<ImportResult[]>([]);
  readonly busy = signal(false);
  readonly loading = signal(false);
  readonly loadingCharacters = signal(false);
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);
  private parseTimer: ReturnType<typeof setTimeout> | null = null;

  readonly memes = computed<PackMeme[]>(() => {
    const ids = this.memeIds();
    return this.memeLibrary().filter(m => ids.has(m.id)).map(m => ({ id: m.id, name: m.name }));
  });

  readonly settings = computed<PackSettings>(() => ({
    title: this.title(), idea: this.idea(), genreId: this.genreId(), language: this.language(), style: this.style(),
    format: this.format(), voicing: this.voicing(), episodes: this.episodes(), scenesPerEpisode: this.scenesPerEpisode(),
    secondsPerEpisode: this.secondsPerEpisode(), funnyEndings: this.funnyEndings(), visuals: this.visuals(),
  }));

  /** The prompt, rebuilt as every choice above changes, so what is copied is always what is shown. */
  readonly prompt = computed(() => buildPackPrompt(this.settings(), this.picked(), this.memes()));

  readonly library = computed<PackLibrary>(() => ({
    characters: this.picked().filter(c => c.fromLibrary).map(c => c.name)
      .concat(this.projectCharacters().map(c => c.name)),
    memes: this.memeLibrary().map(m => ({ id: m.id, name: m.name, tags: m.tags })),
  }));

  readonly review = computed(() => {
    const pack = this.pack();
    return pack ? reviewStoryPack(pack, this.library()) : null;
  });

  async ngOnInit(): Promise<void> {
    try {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) this.updateReply(draft);
    } catch {
      // Browser storage is a convenience only; the page works without it.
    }
    this.loading.set(true);
    try {
      const [projects, effects] = await Promise.all([
        firstValueFrom(this.api.listProjects()),
        firstValueFrom(this.effects.list()),
      ]);
      this.projects.set(projects);
      // Memes and reactions first; sounds cannot be shown as a funny ending.
      this.memeLibrary.set(effects
        .filter(e => e.kind !== 'Audio')
        .sort((a, b) => Number(b.category === 'Reaction') - Number(a.category === 'Reaction') || a.name.localeCompare(b.name)));
    } catch (failure: unknown) {
      this.error.set(this.message(failure, 'Your projects and memes could not be loaded.'));
    } finally {
      this.loading.set(false);
    }
  }

  ngOnDestroy(): void {
    if (this.parseTimer) clearTimeout(this.parseTimer);
  }

  // ------------------------------------------------------------------------------ characters

  async selectProject(id: string): Promise<void> {
    this.projectId.set(id);
    this.projectCharacters.set([]);
    if (!id) return;
    this.loadingCharacters.set(true);
    try {
      const characters = await firstValueFrom(this.api.listCharacters(id));
      this.projectCharacters.set(characters.filter(c => !c.isNarrator));
    } catch (failure: unknown) {
      this.error.set(this.message(failure, 'That project’s characters could not be loaded.'));
    } finally {
      this.loadingCharacters.set(false);
    }
  }

  isPicked(name: string): boolean {
    return this.picked().some(c => c.name.toLowerCase() === name.toLowerCase());
  }

  toggleCharacter(character: Character): void {
    if (this.isPicked(character.name)) {
      this.picked.update(list => list.filter(c => c.name.toLowerCase() !== character.name.toLowerCase()));
      return;
    }
    this.picked.update(list => [...list, fromLibrary(character)]);
  }

  addCharacter(): void {
    const name = this.newName().trim().slice(0, 60);
    if (!name || this.isPicked(name)) return;
    this.picked.update(list => [...list, {
      name, gender: this.newGender() || null, age: this.newAge() || null, look: this.newLook().trim().slice(0, 300) || null,
    }]);
    this.newName.set('');
    this.newLook.set('');
  }

  removeCharacter(name: string): void {
    this.picked.update(list => list.filter(c => c.name !== name));
  }

  // ------------------------------------------------------------------------------ memes

  toggleMeme(id: string): void {
    this.memeIds.update(ids => {
      const next = new Set(ids);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  // ------------------------------------------------------------------------------ the template

  async copy(text: string, what: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      this.notice.set(`${what} copied.`);
      this.error.set(null);
    } catch {
      this.error.set(`Could not copy the ${what.toLowerCase()}. Select and copy the text instead.`);
    }
  }

  downloadPrompt(): void {
    saveBlob(new Blob([this.prompt()], { type: 'text/plain;charset=utf-8' }), 'story-template-prompt.txt');
  }

  downloadTemplate(): void {
    const template = buildPackTemplate(this.settings(), this.picked(), this.memes());
    saveBlob(new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' }), 'story-template.pack.json');
  }

  // ------------------------------------------------------------------------------ the reply

  updateReply(value: string): void {
    this.reply.set(value);
    this.results.set([]);
    try {
      localStorage.setItem(DRAFT_KEY, value);
    } catch {
      // Not saved; the text is still on the page.
    }
    if (this.parseTimer) clearTimeout(this.parseTimer);
    this.parseTimer = setTimeout(() => this.parseNow(), 300);
  }

  private parseNow(): void {
    if (!this.reply().trim()) {
      this.pack.set(null);
      this.parseError.set(null);
      return;
    }
    try {
      this.pack.set(parseStoryPack(this.reply()));
      this.parseError.set(null);
    } catch (failure: unknown) {
      this.pack.set(null);
      this.parseError.set(this.message(failure, 'The text could not be read.'));
    }
  }

  async pickFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      this.error.set(`"${file.name}" is too big to be a story pack.`);
      return;
    }
    this.updateReply(await file.text());
  }

  autoFix(): void {
    const pack = this.pack();
    if (!pack) return;
    const { pack: fixed, fixes } = autoFixStoryPack(pack);
    this.updateReply(JSON.stringify(fixed, null, 2));
    this.notice.set(fixes ? `${fixes} thing(s) fixed. Check the preview again.` : 'Nothing needed fixing.');
  }

  downloadPack(): void {
    const pack = this.pack();
    if (!pack) return;
    saveBlob(new Blob([JSON.stringify(pack, null, 2)], { type: 'application/json' }), 'story.pack.json');
  }

  characterPrompts(): string {
    const pack = this.pack();
    return pack ? characterPrompts({ ...pack, characters: [...pack.characters, ...this.picked()] }, this.style()) : '';
  }

  backgroundPrompts(): string {
    const pack = this.pack();
    return pack ? backgroundPrompts(pack, this.style(), this.format()) : '';
  }

  clearReply(): void {
    this.updateReply('');
  }

  // ------------------------------------------------------------------------------ importing

  /** Starts one Story Agent run per episode (or only <paramref name="only"/>), one after another. */
  async importEpisodes(only?: number): Promise<void> {
    const pack = this.pack();
    if (!pack || this.busy()) return;
    this.busy.set(true);
    this.error.set(null);
    this.notice.set(null);
    const files = episodeFiles({ ...pack, characters: [...pack.characters, ...this.picked()] }, this.library());
    const results: ImportResult[] = only ? this.results().filter(r => r.episode !== only) : [];
    try {
      for (const [index, file] of files.entries()) {
        const episode = index + 1;
        if (only && episode !== only) continue;
        const title = String(file.story.title ?? file.script?.title ?? `Episode ${episode}`);
        try {
          const run = await firstValueFrom(this.stories.importStory(file));
          results.push({ episode, title, runId: run.id });
        } catch (failure: unknown) {
          results.push({ episode, title, error: this.message(failure, 'It could not be imported.') });
        }
        this.results.set([...results].sort((a, b) => a.episode - b.episode));
      }
      const made = results.filter(r => r.runId).length;
      this.notice.set(`${made} of ${results.length} episode(s) created in Story Agent. Open each to review, add pictures and build.`);
    } finally {
      this.busy.set(false);
    }
  }

  resultFor(episode: number): ImportResult | undefined {
    return this.results().find(r => r.episode === episode);
  }

  formatSeconds(seconds: number): string {
    const s = Math.round(seconds);
    return s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`;
  }

  private message(failure: unknown, fallback: string): string {
    return failure instanceof ApiFailure || failure instanceof Error ? failure.message : fallback;
  }
}

/** A character from a project's character page, described the way the template and picture prompts need. */
function fromLibrary(character: Character): PackCharacter {
  const a = character.appearance ?? {};
  const gender = a.gender?.trim().toLowerCase();
  const look = [character.description, a.hair && `${a.hair} hair`, a.clothes && `wearing ${a.clothes}`, a.additionalDetails]
    .filter((v): v is string => !!v && !!v.trim()).join(', ');
  return {
    name: character.name,
    gender: gender?.startsWith('f') || gender === 'woman' || gender === 'girl' ? 'female' : gender?.startsWith('m') || gender === 'man' || gender === 'boy' ? 'male' : null,
    age: typeof a.age === 'number' ? (a.age < 13 ? 'child' : a.age < 25 ? 'young' : a.age < 60 ? 'adult' : 'elder') : null,
    look: look ? look.slice(0, 300) : null,
    fromLibrary: true,
  };
}
