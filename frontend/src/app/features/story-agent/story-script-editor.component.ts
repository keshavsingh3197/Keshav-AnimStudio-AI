import { DecimalPipe } from '@angular/common';
import { Component, DestroyRef, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom, lastValueFrom } from 'rxjs';

import { ApiFailure } from '../../core/interceptors/api-error.interceptor';
import {
  EditStorySceneBody,
  EditStoryScriptBody,
  StoryBasis,
  StoryRun,
  StoryScene,
  StoryScript,
  StorySource,
} from '../../core/models/story-agent.models';
import { StatusService } from '../../core/services/status.service';
import { StoryAgentService } from '../../core/services/story-agent.service';
import { FileDropDirective } from '../../shared/file-drop.directive';
import {
  PICTURE_ACCEPT,
  basisLabel,
  checkBadge,
  clock,
  copyText,
  estimateSeconds,
  naturalCompare,
  picturePrompts,
  pictureProblem,
} from './story-agent.utils';

/** A source as it is edited: the words in the boxes, and what the server last said about the place they name. */
interface DraftSource {
  text: string;
  ref: string;
  note: string;
  server: StorySource | null;
}

/** A scene as it is edited. `number` is the number the server gave it (0: added here), which is how its picture stays with it. */
interface DraftScene {
  key: number;
  number: number;
  headline: string;
  narration: string;
  english: string;
  basis: StoryBasis;
  sources: DraftSource[];
  imagePrompt: string;
  imageKeywords: string[];
  mood: string | null;
}

interface DraftMeta {
  title: string;
  titleEnglish: string;
  summary: string;
  musicQuery: string;
}

const MAX_SCENES = 60;
const MIN_SCENES = 2;

/**
 * Reading, correcting and illustrating the script before the video is made. The person can reword any scene, fix or
 * remove a citation, reorder, add and remove scenes, and put their own picture on each. Nothing is made until Build.
 * While a story is being made the script is shown but cannot be changed.
 *
 * A picture goes up the moment it is chosen; the words wait for Save. Everything that writes goes through one queue,
 * because each write replaces the whole story on the server and two at once would lose one of them.
 */
@Component({
  selector: 'app-story-script-editor',
  imports: [FormsModule, DecimalPipe, FileDropDirective],
  templateUrl: './story-script-editor.component.html',
  styleUrls: ['./story-script-editor.component.css'],
})
export class StoryScriptEditorComponent {
  private readonly stories = inject(StoryAgentService);
  private readonly status = inject(StatusService);

  readonly run = input.required<StoryRun>();
  /** The story came back changed - a picture attached, the script saved - so the page should show this version. */
  readonly runChange = output<StoryRun>();

  readonly accept = PICTURE_ACCEPT;
  readonly basisChoices: { id: StoryBasis; label: string }[] = [
    { id: 'Text', label: 'From the text' },
    { id: 'Tradition', label: 'Tradition' },
    { id: 'Reflection', label: 'Reflection' },
  ];

  readonly meta = signal<DraftMeta>({ title: '', titleEnglish: '', summary: '', musicQuery: '' });
  readonly draft = signal<DraftScene[]>([]);
  readonly dirty = signal(false);
  readonly saving = signal(false);
  /** The scene a picture is being sent for, or 0 while several are. */
  readonly sending = signal<number | null>(null);
  readonly error = signal<string | null>(null);
  readonly copied = signal<string | null>(null);

  /** Object URLs of the pictures, by what identifies that picture; revoked when replaced and on leave. */
  readonly pictures = signal<Record<string, string>>({});

  readonly script = computed(() => this.run().script);
  readonly locked = computed(() => this.run().working);
  readonly vertical = computed(() => this.run().brief.format === 'Vertical');
  readonly byNumber = computed(() => new Map((this.run().script?.scenes ?? []).map((scene) => [scene.number, scene])));
  readonly withPicture = computed(() => (this.run().script?.scenes ?? []).filter((scene) => scene.hasImage && scene.imageSource !== 'plain').length);
  readonly canAdd = computed(() => this.draft().length < MAX_SCENES);
  readonly canRemove = computed(() => this.draft().length > MIN_SCENES);

  private nextKey = 0;
  private signature = '';
  private queue: Promise<unknown> = Promise.resolve();
  private loadingPictures = false;
  private readonly failed = new Set<string>();
  private readonly versions = new Map<number, number>();

  constructor() {
    effect(() => {
      const signature = signatureOf(this.run().script);
      untracked(() => {
        // The script changed under the editor (a reply was pasted, a rewrite arrived, a save came back): what is on
        // screen is out of date, so it is read again. Pictures arriving or leaving do not change the signature.
        if (signature !== this.signature) {
          this.signature = signature;
          this.reset();
        }
        void this.loadPictures();
      });
    });

    inject(DestroyRef).onDestroy(() => {
      Object.values(this.pictures()).forEach((url) => URL.revokeObjectURL(url));
    });
  }

  // ------------------------------------------------------------------------------------------------ reading

  /** Throws away what was typed and shows the script as the server has it. */
  reset(): void {
    const script = this.run().script;
    this.meta.set({
      title: script?.title ?? '',
      titleEnglish: script?.titleEnglish ?? '',
      summary: script?.summary ?? '',
      musicQuery: script?.musicQuery ?? '',
    });
    this.draft.set((script?.scenes ?? []).map((scene) => this.toDraft(scene)));
    this.dirty.set(false);
    this.error.set(null);
  }

  private toDraft(scene: StoryScene): DraftScene {
    return {
      key: ++this.nextKey,
      number: scene.number,
      headline: scene.headline,
      narration: scene.narration,
      english: scene.english ?? '',
      basis: scene.basis,
      sources: scene.sources.map((source) => ({
        text: source.textName || source.textId,
        ref: source.ref,
        note: source.note ?? '',
        server: source,
      })),
      imagePrompt: scene.imagePrompt ?? '',
      imageKeywords: [...scene.imageKeywords],
      mood: scene.mood,
    };
  }

  /** What the server last said about a citation, but only while the words in the boxes are still the ones it checked. */
  checked(source: DraftSource): StorySource | null {
    const server = source.server;
    return server && source.ref === server.ref && source.text === (server.textName || server.textId) ? server : null;
  }

  badge = checkBadge;
  basis = basisLabel;

  /** How long a scene takes: the real narration when it exists and the words are unchanged, otherwise an estimate. */
  seconds(scene: DraftScene): number {
    const server = this.byNumber().get(scene.number);
    return server?.audioSeconds && server.narration === scene.narration ? server.audioSeconds : estimateSeconds(scene.narration);
  }

  total(): number {
    return this.draft().reduce((sum, scene) => sum + this.seconds(scene), 0);
  }

  totalLabel(): string {
    return clock(this.total());
  }

  characters(scene: DraftScene): number {
    return scene.narration.length;
  }

  touch(): void {
    this.dirty.set(true);
    this.error.set(null);
  }

  setMeta(field: keyof DraftMeta, value: string): void {
    this.meta.update((current) => ({ ...current, [field]: value }));
    this.touch();
  }

  // ------------------------------------------------------------------------------------------------ the scenes

  add(after: number): void {
    if (!this.canAdd()) return;
    const scene: DraftScene = {
      key: ++this.nextKey, number: 0, headline: '', narration: '', english: '', basis: 'Reflection',
      sources: [], imagePrompt: '', imageKeywords: [], mood: null,
    };
    this.draft.update((list) => [...list.slice(0, after + 1), scene, ...list.slice(after + 1)]);
    this.touch();
  }

  remove(index: number): void {
    const scene = this.draft()[index];
    if (!scene || !this.canRemove()) return;
    if (scene.narration.trim() && !confirm(`Remove scene ${index + 1}? Its picture and narration are deleted when you save.`)) return;
    this.draft.update((list) => list.filter((_, at) => at !== index));
    this.touch();
  }

  move(index: number, by: -1 | 1): void {
    const to = index + by;
    this.draft.update((list) => {
      if (to < 0 || to >= list.length) return list;
      const next = [...list];
      [next[index], next[to]] = [next[to], next[index]];
      return next;
    });
    this.touch();
  }

  addSource(scene: DraftScene): void {
    if (scene.sources.length >= 8) return;
    scene.sources = [...scene.sources, { text: '', ref: '', note: '', server: null }];
    this.touch();
  }

  removeSource(scene: DraftScene, index: number): void {
    scene.sources = scene.sources.filter((_, at) => at !== index);
    this.touch();
  }

  // ------------------------------------------------------------------------------------------------ saving

  /** The first thing wrong with what was typed, in words for the person; null when it can be saved. */
  problem(): string | null {
    const scenes = this.draft();
    if (scenes.length < MIN_SCENES) return `A story needs at least ${MIN_SCENES} scenes.`;
    const empty = scenes.findIndex((scene) => !scene.narration.trim());
    if (empty >= 0) return `Scene ${empty + 1} has no narration. Write what the voice says, or remove the scene.`;
    if (!this.meta().title.trim()) return 'Give the story a title.';
    return null;
  }

  async save(): Promise<boolean> {
    if (!this.dirty()) return true;
    const problem = this.problem();
    if (problem) {
      this.error.set(problem);
      return false;
    }

    this.saving.set(true);
    try {
      const updated = await this.enqueue(() => firstValueFrom(this.stories.editScript(this.run().id, this.body())));
      this.dirty.set(false);
      this.runChange.emit(updated);
      return true;
    } catch (failure: unknown) {
      this.error.set(failure instanceof ApiFailure ? failure.message : 'The script could not be saved.');
      return false;
    } finally {
      this.saving.set(false);
    }
  }

  private body(): EditStoryScriptBody {
    const meta = this.meta();
    const scene = (draft: DraftScene): EditStorySceneBody => ({
      number: draft.number,
      headline: draft.headline.trim(),
      narration: draft.narration.trim(),
      english: draft.english.trim() || null,
      basis: draft.basis,
      sources: draft.sources
        .filter((source) => source.text.trim())
        .map((source) => ({ text: source.text.trim(), ref: source.ref.trim(), note: source.note.trim() || null })),
      imagePrompt: draft.imagePrompt.trim() || null,
      imageKeywords: draft.imageKeywords,
      mood: draft.mood,
    });

    return {
      title: meta.title.trim(),
      titleEnglish: meta.titleEnglish.trim() || null,
      summary: meta.summary.trim() || null,
      musicQuery: meta.musicQuery.trim() || null,
      scenes: this.draft().map(scene),
    };
  }

  // ------------------------------------------------------------------------------------------------ pictures

  /** The picture to show for a scene, once it has arrived. */
  pictureOf(number: number): string | null {
    const scene = this.byNumber().get(number);
    return scene?.hasImage ? (this.pictures()[this.pictureKey(scene)] ?? null) : null;
  }

  hasPicture(number: number): boolean {
    return this.byNumber().get(number)?.hasImage ?? false;
  }

  /** A picture someone chose - or the image engine drew - as against the plain background a build falls back to. */
  hasOwnPicture(number: number): boolean {
    const scene = this.byNumber().get(number);
    return !!scene?.hasImage && scene.imageSource !== 'plain';
  }

  /** Where a scene's picture came from, in a few words. */
  pictureNote(number: number): string {
    const scene = this.byNumber().get(number);
    if (!scene?.hasImage) return '';
    switch (scene.imageSource) {
      case 'upload': return scene.imageName ? `Yours · ${scene.imageName}` : 'Your picture';
      case 'ai': return 'Drawn by the AI image engine';
      case 'plain': return 'A plain background, because no picture was attached';
      default: return '';
    }
  }

  private pictureKey(scene: StoryScene): string {
    return `${scene.number}:${this.versions.get(scene.number) ?? 0}:${scene.imageSource ?? ''}:${scene.imageName ?? ''}`;
  }

  async attach(scene: DraftScene, file: File | undefined): Promise<void> {
    if (!file || scene.number === 0) return;
    const problem = pictureProblem(file);
    if (problem) {
      this.error.set(problem);
      return;
    }

    this.sending.set(scene.number);
    try {
      await this.upload(scene.number, file);
    } catch (failure: unknown) {
      this.error.set(failure instanceof ApiFailure ? failure.message : 'That picture could not be added.');
    } finally {
      this.sending.set(null);
    }
  }

  async detach(scene: DraftScene): Promise<void> {
    if (scene.number === 0) return;
    this.sending.set(scene.number);
    try {
      const updated = await this.enqueue(() => firstValueFrom(this.stories.removeImage(this.run().id, scene.number)));
      this.runChange.emit(updated);
    } catch (failure: unknown) {
      this.error.set(failure instanceof ApiFailure ? failure.message : 'That picture could not be removed.');
    } finally {
      this.sending.set(null);
    }
  }

  /** Several pictures at once - the whole set from an image tool - go to the scenes in file-name order. */
  async attachMany(files: File[]): Promise<void> {
    const saved = this.draft().filter((scene) => scene.number > 0);
    const usable = [...files].sort((a, b) => naturalCompare(a.name, b.name));
    const refused = usable.map(pictureProblem).find((problem) => problem !== null);
    if (refused) {
      this.error.set(refused);
      return;
    }

    const chosen = usable.slice(0, saved.length);
    this.sending.set(0);
    let added = 0;
    try {
      for (const [index, file] of chosen.entries()) {
        await this.upload(saved[index].number, file);
        added++;
      }
      const skipped = usable.length - chosen.length;
      this.status.showNotice(`Added ${added} picture${added === 1 ? '' : 's'} to scenes 1-${added}.${skipped > 0 ? ` ${skipped} more than there are scenes, so they were left out.` : ''}`);
    } catch (failure: unknown) {
      this.error.set(`${failure instanceof ApiFailure ? failure.message : 'A picture could not be added.'}${added > 0 ? ` (${added} were added before it.)` : ''}`);
    } finally {
      this.sending.set(null);
    }
  }

  private async upload(number: number, file: File): Promise<void> {
    const updated = await this.enqueue(() => firstValueFrom(this.stories.attachImage(this.run().id, number, file)));
    this.versions.set(number, (this.versions.get(number) ?? 0) + 1);
    this.runChange.emit(updated);
  }

  onPicked(scene: DraftScene, event: Event): void {
    const input = event.target as HTMLInputElement;
    void this.attach(scene, input.files?.[0]);
    input.value = '';
  }

  onPickedMany(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';
    if (files.length > 0) void this.attachMany(files);
  }

  /** Fetches the pictures the server has, one at a time, as they appear. A picture that will not load is not asked for again. */
  private async loadPictures(): Promise<void> {
    if (this.loadingPictures) return;
    this.loadingPictures = true;
    try {
      for (;;) {
        const run = this.run();
        const wanted = (run.script?.scenes ?? []).find((scene) => {
          const key = this.pictureKey(scene);
          return scene.hasImage && !this.pictures()[key] && !this.failed.has(key);
        });
        if (!wanted) break;

        const key = this.pictureKey(wanted);
        try {
          const blob = await lastValueFrom(this.stories.sceneImage(run.id, wanted.number));
          this.pictures.update((all) => {
            // A replaced picture's old copy is no longer shown anywhere.
            const stale = Object.keys(all).filter((k) => k.startsWith(`${wanted.number}:`));
            stale.forEach((k) => URL.revokeObjectURL(all[k]));
            const kept = Object.fromEntries(Object.entries(all).filter(([k]) => !stale.includes(k)));
            return { ...kept, [key]: URL.createObjectURL(blob) };
          });
        } catch {
          this.failed.add(key);
        }
      }
    } finally {
      this.loadingPictures = false;
    }
  }

  private enqueue<T>(job: () => Promise<T>): Promise<T> {
    const next = this.queue.then(job, job);
    this.queue = next.catch(() => undefined);
    return next;
  }

  // ------------------------------------------------------------------------------------------------ prompts

  async copyPrompts(): Promise<void> {
    const run = this.run();
    const text = picturePrompts(
      this.meta().title || run.title,
      this.draft().map((scene) => ({ headline: scene.headline, imagePrompt: scene.imagePrompt })),
      run.options.imageStyle,
      this.vertical(),
    );
    await this.flash('all', text, 'The picture prompts are copied. Paste them into your image tool.');
  }

  async copyPrompt(scene: DraftScene, index: number): Promise<void> {
    const style = this.run().options.imageStyle?.trim();
    await this.flash(`s${scene.key}`, style ? `${scene.imagePrompt.trim()}\n\nStyle: ${style}` : scene.imagePrompt.trim(), `Scene ${index + 1}'s prompt is copied.`);
  }

  private async flash(id: string, text: string, notice: string): Promise<void> {
    if (!text.trim()) return;
    if (await copyText(text)) {
      this.status.showNotice(notice);
      this.copied.set(id);
      setTimeout(() => this.copied.update((current) => (current === id ? null : current)), 1800);
    } else {
      this.error.set('The browser did not allow copying. Allow clipboard access for this site and try again.');
    }
  }
}

/** Identifies the words of a script - not its pictures or narration files - so the editor knows when they changed under it. */
function signatureOf(script: StoryScript | null): string {
  if (!script) return '';
  return JSON.stringify([
    script.title, script.titleEnglish, script.summary, script.musicQuery, script.writtenBy,
    script.scenes.map((scene) => [
      scene.number, scene.headline, scene.narration, scene.english, scene.basis, scene.imagePrompt,
      scene.sources.map((source) => [source.textId, source.ref, source.note, source.check]),
    ]),
  ]);
}
