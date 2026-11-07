import { DecimalPipe } from '@angular/common';
import { Component, DestroyRef, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom, lastValueFrom } from 'rxjs';

import { ApiFailure } from '../../core/interceptors/api-error.interceptor';
import {
  EditStorySceneBody,
  EditStoryScriptBody,
  StoryShot,
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
  CLIP_ACCEPT,
  MAX_SHOTS,
  PICTURE_ACCEPT,
  THUMBNAIL_FILE,
  basisLabel,
  clipPrompts,
  clipProblem,
  checkBadge,
  clock,
  copyText,
  estimateSeconds,
  isThumbnailFile,
  matchPictures,
  pictureFileName,
  picturePrompts,
  pictureProblem,
  shotFileName,
  shotOf,
} from './story-agent.utils';

/** The words of the script, or its pictures: the same draft, shown on two tabs of the story page. */
export type StoryEditorView = 'script' | 'pictures';

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
  videoPrompt: string;
  imageKeywords: string[];
  mood: string | null;
  shots: DraftShot[];
}

/** One of a scene's further pictures as edited. `picture` is the number the server gave it (0: added here), which keeps its picture with it. */
interface DraftShot {
  key: number;
  picture: number;
  prompt: string;
}

interface DraftMeta {
  title: string;
  titleEnglish: string;
  summary: string;
  musicQuery: string;
  thumbnailPrompt: string;
}

const MAX_SCENES = 60;
const MIN_SCENES = 2;

/**
 * Reading, correcting and illustrating the script before the video is made. The person can reword any scene, fix or
 * remove a citation, reorder, add and remove scenes, and put their own picture on each. Nothing is made until Build.
 * While a story is being made the script is shown but cannot be changed.
 *
 * The story page keeps one editor for both its Script and Pictures tabs and switches `view`, so words typed on one tab
 * are still there - unsaved - on the other.
 *
 * A picture goes up the moment it is chosen; the words wait for Save. Everything that writes goes through one queue,
 * because each write replaces the whole story on the server and two at once would lose one of them.
 */
@Component({
  selector: 'app-story-script-editor',
  imports: [FormsModule, DecimalPipe, FileDropDirective],
  templateUrl: './story-script-editor.component.html',
  styleUrls: ['./story-script-editor.component.css'],
  host: { '(window:beforeunload)': 'onLeave($event)' },
})
export class StoryScriptEditorComponent {
  private readonly stories = inject(StoryAgentService);
  private readonly status = inject(StatusService);

  readonly run = input.required<StoryRun>();
  readonly view = input<StoryEditorView>('script');
  /** The story came back changed - a picture attached, the script saved - so the page should show this version. */
  readonly runChange = output<StoryRun>();

  readonly accept = PICTURE_ACCEPT;
  readonly clipAccept = CLIP_ACCEPT;
  readonly basisChoices: { id: StoryBasis; label: string }[] = [
    { id: 'Text', label: 'From the text' },
    { id: 'Tradition', label: 'Tradition' },
    { id: 'Reflection', label: 'Reflection' },
  ];

  readonly meta = signal<DraftMeta>({ title: '', titleEnglish: '', summary: '', musicQuery: '', thumbnailPrompt: '' });
  readonly draft = signal<DraftScene[]>([]);
  readonly dirty = signal(false);
  readonly saving = signal(false);
  /** The scene a picture is being sent for, or 0 while several are. */
  readonly sending = signal<number | null>(null);
  /** A further picture ("3.2": scene 3, picture 2) or the thumbnail ("thumb") being sent or taken off. */
  readonly sendingShot = signal<string | null>(null);
  /** Anything is being sent, so no other picture is sent alongside it. */
  readonly busy = computed(() => this.sending() !== null || this.sendingShot() !== null);
  readonly maxShots = MAX_SHOTS;
  readonly thumbnailFile = THUMBNAIL_FILE;
  readonly error = signal<string | null>(null);
  readonly copied = signal<string | null>(null);

  /** Object URLs of the pictures, by what identifies that picture; revoked when replaced and on leave. */
  readonly pictures = signal<Record<string, string>>({});

  readonly script = computed(() => this.run().script);
  readonly locked = computed(() => this.run().working);
  readonly vertical = computed(() => this.run().brief.format === 'Vertical');
  readonly byNumber = computed(() => new Map((this.run().script?.scenes ?? []).map((scene) => [scene.number, scene])));
  readonly withClip = computed(() => (this.run().script?.scenes ?? []).filter((scene) => scene.hasVideo).length);
  readonly withPicture = computed(() => (this.run().script?.scenes ?? []).filter((scene) => scene.hasImage && scene.imageSource !== 'placeholder').length);
  readonly canAdd = computed(() => this.draft().length < MAX_SCENES);
  readonly canRemove = computed(() => this.draft().length > MIN_SCENES);

  private nextKey = 0;
  private signature = '';
  private queue: Promise<unknown> = Promise.resolve();
  private loadingPictures = false;
  private readonly failed = new Set<string>();
  /** How many times each picture was replaced here, by its id ("3", "3.2", "thumb"), so a replaced one is fetched again. */
  private readonly versions = new Map<string, number>();

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
      thumbnailPrompt: script?.thumbnailPrompt ?? '',
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
      videoPrompt: scene.videoPrompt ?? '',
      imageKeywords: [...scene.imageKeywords],
      mood: scene.mood,
      shots: (scene.shots ?? []).map((shot) => ({ key: ++this.nextKey, picture: shot.picture, prompt: shot.imagePrompt ?? '' })),
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
      sources: [], imagePrompt: '', videoPrompt: '', imageKeywords: [], mood: null, shots: [],
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
      videoPrompt: draft.videoPrompt.trim() || null,
      imageKeywords: draft.imageKeywords,
      mood: draft.mood,
      shots: draft.shots.map((shot) => ({ picture: shot.picture, imagePrompt: shot.prompt.trim() || null })),
    });

    return {
      title: meta.title.trim(),
      titleEnglish: meta.titleEnglish.trim() || null,
      summary: meta.summary.trim() || null,
      musicQuery: meta.musicQuery.trim() || null,
      thumbnailPrompt: meta.thumbnailPrompt.trim(),
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
    return !!scene?.hasImage && scene.imageSource !== 'placeholder';
  }

  /** The file name this scene's picture should be saved as, for adding a whole set at once. */
  fileName(index: number): string {
    return pictureFileName(index, this.draft().length);
  }

  /** Where a scene's picture came from, in a few words. */
  pictureNote(number: number): string {
    const scene = this.byNumber().get(number);
    return scene?.hasImage ? sourceNote(scene.imageSource, scene.imageName) : '';
  }

  private pictureKey(scene: StoryScene): string {
    return this.keyOf(String(scene.number), scene.imageSource, scene.imageName);
  }

  /** Identifies one version of a picture: its id, how often it was replaced here, and what the server says it is. */
  private keyOf(id: string, source: string | null | undefined, name: string | null | undefined): string {
    return `${id}:${this.versions.get(id) ?? 0}:${source ?? ''}:${name ?? ''}`;
  }

  private bump(id: string): void {
    this.versions.set(id, (this.versions.get(id) ?? 0) + 1);
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

  /**
   * Several pictures at once - the whole set from an image tool. A file named by its scene (01.png, scene-3.jpg) goes to
   * that scene; otherwise the files go to the scenes in file-name order. A scene's further pictures (01-2.png) go after
   * its own, in order, and thumbnail.png becomes the thumbnail.
   */
  async attachMany(files: File[]): Promise<void> {
    const refused = files.map(pictureProblem).find((problem) => problem !== null);
    if (refused) {
      this.error.set(refused);
      return;
    }

    const thumbnail = files.find((file) => isThumbnailFile(file.name));
    const shotFiles = files
      .filter((file) => file !== thumbnail && shotOf(file.name) !== null)
      .map((file) => ({ file, ...shotOf(file.name)! }))
      .sort((a, b) => a.scene - b.scene || a.picture - b.picture);
    const sceneFiles = files.filter((file) => file !== thumbnail && shotOf(file.name) === null);

    const scenes = this.draft();
    const { byNumber, slots } = matchPictures(sceneFiles.map((file) => file.name), scenes.length);
    // A scene added here and not saved yet has no number on the server, so nothing can be attached to it.
    const plan = sceneFiles
      .map((file, at) => ({ file, position: slots[at] }))
      .filter((item) => item.position >= 0 && scenes[item.position].number > 0)
      .sort((a, b) => a.position - b.position);
    // Further pictures need the words saved, so the server's numbering of each scene's pictures is the one on screen.
    const shots = this.dirty() ? [] : shotFiles.filter((item) => scenes[item.scene - 1]?.number > 0);

    this.sending.set(0);
    let added = 0;
    try {
      for (const item of plan) {
        await this.upload(scenes[item.position].number, item.file);
        added++;
      }
      // A picture numbered past the scene's last goes on after it, so 01-4.png with no 01-3.png still lands.
      const counts = new Map((this.run().script?.scenes ?? []).map((scene) => [scene.number, scene.shots?.length ?? 0]));
      for (const item of shots) {
        const number = scenes[item.scene - 1].number;
        const count = counts.get(number) ?? 0;
        const picture = Math.min(item.picture, count + 2);
        await this.uploadShot(number, picture, item.file);
        if (picture === count + 2) counts.set(number, count + 1);
        added++;
      }
      if (thumbnail) {
        await this.uploadThumbnail(thumbnail);
        added++;
      }
      const skipped = files.length - added;
      const where = byNumber ? 'by the number in each file name' : 'in file-name order';
      const why = this.dirty() && shotFiles.length > 0 ? ' Save your changes, then add the scenes\' further pictures (01-2.png …).' : '';
      this.status.showNotice(`Added ${added} picture${added === 1 ? '' : 's'} ${where}.${skipped > 0 ? ` ${skipped} had no place to go, so they were left out.` : ''}${why}`);
    } catch (failure: unknown) {
      this.error.set(`${failure instanceof ApiFailure ? failure.message : 'A picture could not be added.'}${added > 0 ? ` (${added} were added before it.)` : ''}`);
    } finally {
      this.sending.set(null);
    }
  }

  private async upload(number: number, file: File): Promise<void> {
    const updated = await this.enqueue(() => firstValueFrom(this.stories.attachImage(this.run().id, number, file)));
    this.bump(String(number));
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

  // ------------------------------------------------------------------------------------------------ further pictures

  /** The server's record of a scene's further picture, by the number it gave it; null for one added here and not saved. */
  shotOn(number: number, picture: number): StoryShot | null {
    return picture > 0 ? (this.byNumber().get(number)?.shots?.find((shot) => shot.picture === picture) ?? null) : null;
  }

  shotPictureOf(number: number, picture: number): string | null {
    const shot = this.shotOn(number, picture);
    return shot?.hasImage ? (this.pictures()[this.keyOf(`${number}.${picture}`, shot.imageSource, shot.imageName)] ?? null) : null;
  }

  shotNote(number: number, picture: number): string {
    const shot = this.shotOn(number, picture);
    return shot?.hasImage ? sourceNote(shot.imageSource, shot.imageName) : '';
  }

  shotFile(index: number, at: number): string {
    return shotFileName(index, this.draft().length, at + 2);
  }

  /** A prompt for one more picture, to write now and save; its picture is added after saving. */
  addShot(scene: DraftScene): void {
    if (scene.shots.length >= MAX_SHOTS) return;
    scene.shots = [...scene.shots, { key: ++this.nextKey, picture: 0, prompt: '' }];
    this.touch();
  }

  removeShot(scene: DraftScene, shot: DraftShot): void {
    if (this.shotOn(scene.number, shot.picture)?.hasImage && !confirm('Remove this picture from the scene? It is deleted when you save.')) return;
    scene.shots = scene.shots.filter((s) => s !== shot);
    this.touch();
  }

  moveShot(scene: DraftScene, index: number, by: -1 | 1): void {
    const to = index + by;
    if (to < 0 || to >= scene.shots.length) return;
    const next = [...scene.shots];
    [next[index], next[to]] = [next[to], next[index]];
    scene.shots = next;
    this.touch();
  }

  /**
   * Puts a picture on a further picture of a scene - `picture` 0 adds a new one after the last. Pictures go up the moment
   * they are chosen, so this waits for the words to be saved: the server numbers the scene's pictures as it has them.
   */
  async attachShot(scene: DraftScene, picture: number, file: File | undefined): Promise<void> {
    if (!file || scene.number === 0 || this.dirty()) return;
    const problem = pictureProblem(file);
    if (problem) {
      this.error.set(problem);
      return;
    }

    const at = picture > 0 ? picture : (this.byNumber().get(scene.number)?.shots?.length ?? 0) + 2;
    this.sendingShot.set(`${scene.number}.${picture}`);
    try {
      await this.uploadShot(scene.number, at, file);
    } catch (failure: unknown) {
      this.error.set(failure instanceof ApiFailure ? failure.message : 'That picture could not be added.');
    } finally {
      this.sendingShot.set(null);
    }
  }

  async detachShot(scene: DraftScene, shot: DraftShot): Promise<void> {
    if (scene.number === 0 || shot.picture === 0 || this.dirty()) return;
    this.sendingShot.set(`${scene.number}.${shot.picture}`);
    try {
      const updated = await this.enqueue(() => firstValueFrom(this.stories.removeShot(this.run().id, scene.number, shot.picture)));
      this.runChange.emit(updated);
    } catch (failure: unknown) {
      this.error.set(failure instanceof ApiFailure ? failure.message : 'That picture could not be removed.');
    } finally {
      this.sendingShot.set(null);
    }
  }

  private async uploadShot(number: number, picture: number, file: File): Promise<StoryRun> {
    const updated = await this.enqueue(() => firstValueFrom(this.stories.attachShot(this.run().id, number, picture, file)));
    this.bump(`${number}.${picture}`);
    this.runChange.emit(updated);
    return updated;
  }

  onPickedShot(scene: DraftScene, picture: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    void this.attachShot(scene, picture, input.files?.[0]);
    input.value = '';
  }

  async copyShotPrompt(scene: DraftScene, index: number, shot: DraftShot, at: number): Promise<void> {
    const style = this.run().options.imageStyle?.trim();
    const context = this.context(scene);
    const parts = [
      context ? `What happens: ${context}` : '',
      shot.prompt.trim(),
      style ? `Style: ${style}` : '',
      `${this.vertical() ? '9:16 vertical' : '16:9 wide'}. Save as ${this.shotFile(index, at)}.png`,
    ];
    await this.flash(`p${shot.key}`, parts.filter(Boolean).join('\n\n'), `Picture ${at + 2} of scene ${index + 1} is copied.`);
  }

  // ------------------------------------------------------------------------------------------------ the thumbnail

  thumbnailPicture(): string | null {
    const script = this.run().script;
    return script?.hasThumbnail ? (this.pictures()[this.keyOf('thumb', script.thumbnailSource, script.thumbnailName)] ?? null) : null;
  }

  hasThumbnail(): boolean {
    return this.run().script?.hasThumbnail ?? false;
  }

  thumbnailNote(): string {
    const script = this.run().script;
    return script?.hasThumbnail ? sourceNote(script.thumbnailSource ?? null, script.thumbnailName ?? null) : '';
  }

  async attachThumbnail(file: File | undefined): Promise<void> {
    if (!file) return;
    const problem = pictureProblem(file);
    if (problem) {
      this.error.set(problem);
      return;
    }

    this.sendingShot.set('thumb');
    try {
      await this.uploadThumbnail(file);
    } catch (failure: unknown) {
      this.error.set(failure instanceof ApiFailure ? failure.message : 'That thumbnail could not be added.');
    } finally {
      this.sendingShot.set(null);
    }
  }

  async detachThumbnail(): Promise<void> {
    this.sendingShot.set('thumb');
    try {
      const updated = await this.enqueue(() => firstValueFrom(this.stories.removeThumbnail(this.run().id)));
      this.runChange.emit(updated);
    } catch (failure: unknown) {
      this.error.set(failure instanceof ApiFailure ? failure.message : 'The thumbnail could not be removed.');
    } finally {
      this.sendingShot.set(null);
    }
  }

  private async uploadThumbnail(file: File): Promise<void> {
    const updated = await this.enqueue(() => firstValueFrom(this.stories.attachThumbnail(this.run().id, file)));
    this.bump('thumb');
    this.runChange.emit(updated);
  }

  onPickedThumbnail(event: Event): void {
    const input = event.target as HTMLInputElement;
    void this.attachThumbnail(input.files?.[0]);
    input.value = '';
  }

  async copyThumbnailPrompt(): Promise<void> {
    const style = this.run().options.imageStyle?.trim();
    const parts = [
      this.meta().thumbnailPrompt.trim(),
      style ? `Style: ${style}` : '',
      `16:9 wide (landscape), a YouTube thumbnail. No words or letters. Save as ${THUMBNAIL_FILE}.png`,
    ];
    await this.flash('thumb', parts.filter(Boolean).join('\n\n'), 'The thumbnail prompt is copied.');
  }

  // ------------------------------------------------------------------------------------------------ moving clips

  hasClip(number: number): boolean {
    return this.byNumber().get(number)?.hasVideo ?? false;
  }

  clipName(number: number): string {
    return this.byNumber().get(number)?.videoName ?? '';
  }

  /** A character speaks in the scene, so its animation moves their lips. */
  speaks(number: number): boolean {
    return this.byNumber().get(number)?.speaks ?? false;
  }

  /** What the video engine is asked for this scene, as the server composes it from the saved script. */
  animationPrompt(number: number): string | null {
    return this.byNumber().get(number)?.animationPrompt ?? null;
  }

  async copyAnimationPrompt(scene: DraftScene, prompt: string): Promise<void> {
    const shape = this.vertical() ? '9:16 vertical' : '16:9 wide';
    await this.flash(`a${scene.key}`, `${prompt}\n\n8 seconds, ${shape}. Start from the attached picture.`, 'The animation prompt is copied.');
  }

  async attachClip(scene: DraftScene, file: File | undefined): Promise<void> {
    if (!file || scene.number === 0) return;
    const problem = clipProblem(file);
    if (problem) {
      this.error.set(problem);
      return;
    }

    this.sending.set(scene.number);
    try {
      await this.uploadClip(scene.number, file);
    } catch (failure: unknown) {
      this.error.set(failure instanceof ApiFailure ? failure.message : 'That clip could not be added.');
    } finally {
      this.sending.set(null);
    }
  }

  async detachClip(scene: DraftScene): Promise<void> {
    if (scene.number === 0) return;
    this.sending.set(scene.number);
    try {
      const updated = await this.enqueue(() => firstValueFrom(this.stories.removeVideo(this.run().id, scene.number)));
      this.runChange.emit(updated);
    } catch (failure: unknown) {
      this.error.set(failure instanceof ApiFailure ? failure.message : 'That clip could not be removed.');
    } finally {
      this.sending.set(null);
    }
  }

  /** Every clip at once, matched to scenes the same way as pictures: 01.mp4 to scene 1, otherwise in file-name order. */
  async attachManyClips(files: File[]): Promise<void> {
    const refused = files.map(clipProblem).find((problem) => problem !== null);
    if (refused) {
      this.error.set(refused);
      return;
    }

    const scenes = this.draft();
    const { byNumber, slots } = matchPictures(files.map((file) => file.name), scenes.length);
    const plan = files
      .map((file, at) => ({ file, position: slots[at] }))
      .filter((item) => item.position >= 0 && scenes[item.position].number > 0)
      .sort((a, b) => a.position - b.position);

    this.sending.set(0);
    let added = 0;
    try {
      for (const item of plan) {
        await this.uploadClip(scenes[item.position].number, item.file);
        added++;
      }
      const skipped = files.length - plan.length;
      const where = byNumber ? 'by the number in each file name' : 'in file-name order';
      this.status.showNotice(`Added ${added} clip${added === 1 ? '' : 's'} ${where}.${skipped > 0 ? ` ${skipped} had no scene to go to, so they were left out.` : ''}`);
    } catch (failure: unknown) {
      this.error.set(`${failure instanceof ApiFailure ? failure.message : 'A clip could not be added.'}${added > 0 ? ` (${added} were added before it.)` : ''}`);
    } finally {
      this.sending.set(null);
    }
  }

  private async uploadClip(number: number, file: File): Promise<void> {
    const updated = await this.enqueue(() => firstValueFrom(this.stories.attachVideo(this.run().id, number, file)));
    this.runChange.emit(updated);
  }

  onPickedClip(scene: DraftScene, event: Event): void {
    const input = event.target as HTMLInputElement;
    void this.attachClip(scene, input.files?.[0]);
    input.value = '';
  }

  onPickedManyClips(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';
    if (files.length > 0) void this.attachManyClips(files);
  }

  /** Every picture the server has for the story, with what fetches it: the scenes', their further ones, the thumbnail. */
  private wantedPictures(run: StoryRun): { id: string; key: string; fetch: () => Promise<Blob> }[] {
    const wanted: { id: string; key: string; fetch: () => Promise<Blob> }[] = [];
    for (const scene of run.script?.scenes ?? []) {
      if (scene.hasImage) {
        wanted.push({ id: String(scene.number), key: this.pictureKey(scene), fetch: () => lastValueFrom(this.stories.sceneImage(run.id, scene.number)) });
      }
      for (const shot of scene.shots ?? []) {
        if (!shot.hasImage) continue;
        const id = `${scene.number}.${shot.picture}`;
        wanted.push({ id, key: this.keyOf(id, shot.imageSource, shot.imageName), fetch: () => lastValueFrom(this.stories.shotImage(run.id, scene.number, shot.picture)) });
      }
    }
    if (run.script?.hasThumbnail) {
      wanted.push({ id: 'thumb', key: this.keyOf('thumb', run.script.thumbnailSource, run.script.thumbnailName), fetch: () => lastValueFrom(this.stories.thumbnailImage(run.id)) });
    }
    return wanted;
  }

  /** Fetches the pictures the server has, one at a time, as they appear. A picture that will not load is not asked for again. */
  private async loadPictures(): Promise<void> {
    if (this.loadingPictures) return;
    this.loadingPictures = true;
    try {
      for (;;) {
        const wanted = this.wantedPictures(this.run()).find((item) => !this.pictures()[item.key] && !this.failed.has(item.key));
        if (!wanted) break;

        try {
          const blob = await wanted.fetch();
          this.pictures.update((all) => {
            // A replaced picture's old copy is no longer shown anywhere.
            const stale = Object.keys(all).filter((k) => k.startsWith(`${wanted.id}:`));
            stale.forEach((k) => URL.revokeObjectURL(all[k]));
            const kept = Object.fromEntries(Object.entries(all).filter(([k]) => !stale.includes(k)));
            return { ...kept, [wanted.key]: URL.createObjectURL(blob) };
          });
        } catch {
          this.failed.add(wanted.key);
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
    const meta = this.meta();
    const title = meta.title || run.title;
    const text = picturePrompts(
      meta.titleEnglish.trim() ? `${title} (${meta.titleEnglish.trim()})` : title,
      meta.summary,
      this.draft().map((scene) => ({
        headline: scene.headline, imagePrompt: scene.imagePrompt, context: this.context(scene), shots: scene.shots.map((shot) => shot.prompt),
      })),
      run.options.imageStyle,
      this.vertical(),
      meta.thumbnailPrompt,
    );
    await this.flash('all', text, 'The picture prompts are copied, numbered. Save each picture under its number, then add them all at once.');
  }

  async copyClipPrompts(): Promise<void> {
    const run = this.run();
    const meta = this.meta();
    const title = meta.title || run.title;
    const text = clipPrompts(
      meta.titleEnglish.trim() ? `${title} (${meta.titleEnglish.trim()})` : title,
      meta.summary,
      this.draft().map((scene) => ({
        headline: scene.headline, videoPrompt: scene.videoPrompt, imagePrompt: scene.imagePrompt,
        context: this.context(scene), seconds: this.seconds(scene),
      })),
      run.options.imageStyle,
      this.vertical(),
    );
    await this.flash('clips', text, 'The video clip prompts are copied, numbered. Save each clip under its number (01.mp4 …), then add them all at once.');
  }

  async copyClipPrompt(scene: DraftScene, index: number): Promise<void> {
    const style = this.run().options.imageStyle?.trim();
    const parts = [
      scene.imagePrompt.trim() ? `Shot: ${scene.imagePrompt.trim()}` : '',
      `Motion: ${scene.videoPrompt.trim() || 'a gentle, slow push in; light and cloth move softly'}`,
      style ? `Look: ${style}` : '',
      `8 seconds, ${this.vertical() ? '9:16 vertical' : '16:9 wide'}, no speech, no words or letters. Save as ${this.fileName(index)}.mp4`,
    ];
    await this.flash(`v${scene.key}`, parts.filter(Boolean).join('\n\n'), `Scene ${index + 1}'s clip prompt is copied.`);
  }

  async copyPrompt(scene: DraftScene, index: number): Promise<void> {
    const style = this.run().options.imageStyle?.trim();
    const context = this.context(scene);
    const parts = [
      context ? `What happens: ${context}` : '',
      scene.imagePrompt.trim(),
      style ? `Style: ${style}` : '',
      `${this.vertical() ? '9:16 vertical' : '16:9 wide'}. Save as ${this.fileName(index)}.png`,
    ];
    await this.flash(`s${scene.key}`, parts.filter(Boolean).join('\n\n'), `Scene ${index + 1}'s prompt is copied.`);
  }

  /** What happens in a scene, in words an image tool reads: the English meaning, or the narration of an English story. */
  private context(scene: DraftScene): string | null {
    const text = scene.english.trim() || (this.run().brief.language === 'en' ? scene.narration.trim() : '');
    return text || null;
  }

  /** Closing or reloading the tab with words not yet saved asks first, as the browser allows. */
  onLeave(event: BeforeUnloadEvent): void {
    if (this.dirty()) event.preventDefault();
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

/** Where a picture came from, in a few words. The server names the image engine that drew one by its provider id. */
function sourceNote(source: string | null, name: string | null): string {
  switch (source) {
    case 'upload': return name ? `Yours · ${name}` : 'Your picture';
    case 'placeholder': return 'A plain background, because no picture was attached';
    case null: case '': return '';
    default: return `Drawn by the AI image engine (${source})`;
  }
}

/** Identifies the words of a script - not its pictures or narration files - so the editor knows when they changed under it. */
function signatureOf(script: StoryScript | null): string {
  if (!script) return '';
  return JSON.stringify([
    script.title, script.titleEnglish, script.summary, script.musicQuery, script.writtenBy,
    script.scenes.map((scene) => [
      scene.number, scene.headline, scene.narration, scene.english, scene.basis, scene.imagePrompt, scene.videoPrompt ?? null,
      scene.sources.map((source) => [source.textId, source.ref, source.note, source.check]),
      (scene.shots ?? []).map((shot) => [shot.picture, shot.imagePrompt]),
    ]),
    script.thumbnailPrompt ?? null,
  ]);
}
