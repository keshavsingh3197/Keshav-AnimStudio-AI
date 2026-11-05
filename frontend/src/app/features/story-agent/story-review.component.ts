import { DecimalPipe } from '@angular/common';
import { Component, DestroyRef, ElementRef, computed, effect, inject, input, output, signal, untracked, viewChild } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ApiFailure } from '../../core/interceptors/api-error.interceptor';
import { VoiceoverVoice } from '../../core/models/api.models';
import {
  EditSceneLookBody,
  STORY_EFFECTS,
  STORY_TRANSITIONS,
  StoryAgentOptions,
  StoryEffect,
  StoryLookStyle,
  StoryReviewStage,
  StoryRun,
  StoryScene,
  StoryTransition,
} from '../../core/models/story-agent.models';
import { ApiService } from '../../core/services/api.service';
import { StatusService } from '../../core/services/status.service';
import { StoryAgentService } from '../../core/services/story-agent.service';
import { copyText, timeAgo } from './story-agent.utils';

/** Must match the server's limits. */
const MAX_STYLE_CHARS = 300;
const MAX_BRIEF_CHARS = 1500;
const MAX_MUSIC_BYTES = 25 * 1024 * 1024;

/** Ready-made delivery instructions for an engine that takes one. */
const DELIVERY_SUGGESTIONS = [
  'Warm, unhurried storyteller', 'Calm and devotional', 'Dramatic and intense', 'Gentle bedtime story for children',
  'Serious documentary narrator', 'Excited and energetic',
];

/** Starting points for the music: the instruments and the feel, put into a full brief at the story's length. */
const MUSIC_SUGGESTIONS = [
  'Calm bansuri flute over a tanpura drone, devotional',
  'Temple bells, soft sitar and gentle tabla',
  'Epic cinematic orchestra with deep drums and soft choir pads, no vocals',
  'Meditative santoor and warm strings',
  'Joyful festive shehnai with light dhol',
  'Mysterious low strings, ambient pads and a distant conch',
];

export const EFFECT_LABEL: Record<StoryEffect, string> = {
  None: 'Still', ZoomIn: 'Push in', ZoomOut: 'Pull back', PanLeft: 'Pan left', PanRight: 'Pan right', PanUp: 'Tilt up', PanDown: 'Tilt down',
};

export const TRANSITION_LABEL: Record<StoryTransition, string> = {
  None: 'Cut', Fade: 'Crossfade', Dissolve: 'Dissolve', WipeLeft: 'Wipe left', WipeRight: 'Wipe right', SlideLeft: 'Slide left',
  SlideRight: 'Slide right', SlideUp: 'Slide up', SlideDown: 'Slide down', CircleOpen: 'Iris open', CircleClose: 'Iris close', ZoomIn: 'Zoom through',
};

const LOOK_STYLES: { id: StoryLookStyle; label: string; hint: string }[] = [
  { id: 'Auto', label: 'Automatic', hint: 'Picked from each scene\'s mood: slow pushes for calm, quicker moves for drama, a reveal for wonder.' },
  { id: 'Gentle', label: 'Gentle', hint: 'Slow, small moves and soft crossfades. Suits devotional and reflective stories.' },
  { id: 'Cinematic', label: 'Cinematic', hint: 'Deliberate pushes and pulls, longer crossfades, an iris reveal at the turning points.' },
  { id: 'Lively', label: 'Lively', hint: 'Quicker moves and slides, for a Short that has to hold attention.' },
];

/** Where Google's own music tool is, for making a track by hand from the brief. */
const GOOGLE_MUSIC_TOOL = 'https://labs.google/fx/tools/music-fx';

type Busy = 'approve' | 'voice' | 'music' | 'upload' | 'look' | null;

/** What the person changed about a scene's look, before they rebuild. */
interface LookEdit {
  effect?: StoryEffect;
  transition?: StoryTransition;
  transitionSeconds?: number;
  auto?: boolean;
}

/**
 * The steps where the person hears or watches what the build made and says yes, or asks for it again: the voice scene by
 * scene, the music with the brief it was composed from, and the look of the rendered video - its effects and transitions.
 * Nothing changes here until a button is pressed, and every button says what it will make again.
 */
@Component({
  selector: 'app-story-review',
  imports: [DecimalPipe],
  templateUrl: './story-review.component.html',
  styleUrls: ['./story-review.component.css'],
})
export class StoryReviewComponent {
  private readonly stories = inject(StoryAgentService);
  private readonly api = inject(ApiService);
  private readonly status = inject(StatusService);

  readonly run = input.required<StoryRun>();
  readonly caps = input<StoryAgentOptions | null>(null);
  /** `sound`: the voice and the music. `look`: the effects and transitions of the rendered video. */
  readonly part = input<'sound' | 'look'>('sound');
  readonly runChange = output<StoryRun>();

  readonly busy = signal<Busy>(null);
  readonly error = signal<string | null>(null);
  readonly ago = timeAgo;

  readonly deliverySuggestions = DELIVERY_SUGGESTIONS;
  readonly musicSuggestions = MUSIC_SUGGESTIONS;
  readonly lookStyles = LOOK_STYLES;
  readonly effects = STORY_EFFECTS;
  readonly transitions = STORY_TRANSITIONS;
  readonly effectLabel = EFFECT_LABEL;
  readonly transitionLabel = TRANSITION_LABEL;
  readonly maxStyleChars = MAX_STYLE_CHARS;
  readonly maxBriefChars = MAX_BRIEF_CHARS;
  readonly googleMusicTool = GOOGLE_MUSIC_TOOL;

  // --- the voice --------------------------------------------------------------------------------
  readonly retake = signal<ReadonlySet<number>>(new Set());
  readonly voiceId = signal<string | null>(null);
  readonly delivery = signal('');
  readonly rate = signal(1);
  readonly castVoices = signal(true);
  readonly voices = signal<VoiceoverVoice[]>([]);

  // --- the music --------------------------------------------------------------------------------
  readonly brief = signal('');
  readonly volume = signal(0.2);
  readonly copied = signal(false);

  // --- the look ---------------------------------------------------------------------------------
  readonly lookStyle = signal<StoryLookStyle>('Auto');
  readonly edits = signal<Record<number, LookEdit>>({});

  // --- listening --------------------------------------------------------------------------------
  /** Object URLs of the files fetched to listen to, by what they are (so a new take is fetched afresh). */
  readonly audio = signal<Record<string, string>>({});
  readonly loadingAudio = signal<string | null>(null);
  /** Playing every scene in order, optionally over the music at the chosen level. */
  readonly sequence = signal<{ index: number; withMusic: boolean } | null>(null);
  readonly sequenceSrc = signal<string | null>(null);
  readonly bedSrc = signal<string | null>(null);
  private readonly bed = viewChild<ElementRef<HTMLAudioElement>>('bed');

  readonly scenes = computed(() => this.run().script?.scenes ?? []);
  readonly review = computed<StoryReviewStage | null>(() => (this.run().status === 'AwaitingReview' ? this.run().review ?? null : null));
  readonly voiced = computed(() => this.scenes().filter((s) => s.hasAudio));
  readonly speaksStyle = computed(() => (this.run().options.speechEngine ?? '').startsWith('gemini'));
  readonly composer = computed(() => !!this.caps()?.musicComposer);
  readonly musicStage = computed(() => this.run().stages.find((s) => s.id === 'music') ?? null);
  /** The music could not be made (no composer, no catalogue key): the person's own track is the way forward. */
  readonly musicMissing = computed(() => !this.run().music && this.musicStage()?.status === 'Skipped' && this.musicStage()?.code !== 'music-off');
  readonly musicOff = computed(() => !this.run().options.music);
  readonly briefSeconds = computed(() => this.run().musicBrief?.seconds ?? Math.round(this.run().script?.estimatedSeconds ?? 60));
  readonly lookEdited = computed(() => Object.keys(this.edits()).length > 0);
  readonly voiceChanged = computed(() => {
    const o = this.run().options;
    return (this.voiceId() ?? null) !== (o.voiceId ?? null)
      || (this.delivery().trim() || null) !== (o.speechStyle ?? null)
      || this.rate() !== o.speechRate
      || this.castVoices() !== (o.castVoices ?? true);
  });

  private destroyed = false;
  /** The run and step the fields were last filled from, so a poll does not overwrite what the person is typing. */
  private filledFor = '';
  private voicesFor: string | null | undefined = undefined;

  constructor() {
    effect(() => {
      const run = this.run();
      untracked(() => this.fill(run));
    });

    inject(DestroyRef).onDestroy(() => {
      this.destroyed = true;
      Object.values(this.audio()).forEach((url) => URL.revokeObjectURL(url));
    });
  }

  /** Fills the fields from the story whenever it arrives at a new step (or a new take is made), not on every poll. */
  private fill(run: StoryRun): void {
    const key = `${run.id}|${run.status}|${run.review ?? ''}|${this.stageDone(run, 'narration')}|${this.stageDone(run, 'music')}|${this.stageDone(run, 'assemble')}`;
    if (key === this.filledFor) return;
    this.filledFor = key;

    const o = run.options;
    this.retake.set(new Set());
    this.voiceId.set(o.voiceId ?? null);
    this.delivery.set(o.speechStyle ?? '');
    this.rate.set(o.speechRate);
    this.castVoices.set(o.castVoices ?? true);
    this.brief.set(o.musicPrompt ?? run.musicBrief?.prompt ?? '');
    this.volume.set(o.musicVolume);
    this.lookStyle.set(o.lookStyle ?? 'Auto');
    this.edits.set({});
    this.stopAll();

    if (this.voicesFor !== (o.speechEngine ?? null) && o.narration === 'Stock') this.loadVoices(o.speechEngine ?? null);
  }

  private stageDone(run: StoryRun, id: string): string {
    return run.stages.find((s) => s.id === id)?.completedAtUtc ?? '';
  }

  /** A failed list only means the picker is not offered; the story keeps its own voice. */
  private loadVoices(engine: string | null): void {
    this.voicesFor = engine;
    this.api.voiceoverVoices(engine ?? undefined).subscribe({
      next: (list) => {
        if (!this.destroyed && this.voicesFor === engine) this.voices.set(list.voices ?? []);
      },
      error: () => undefined,
    });
  }

  // ------------------------------------------------------------------------------------------------ listening

  /** What a scene's narration file is, so a new take is not served from an older fetch. */
  sceneKey(scene: StoryScene): string {
    return `scene:${scene.number}:${scene.audioTake ?? 0}:${scene.audioSeconds ?? 0}:${this.stageDone(this.run(), 'narration')}`;
  }

  musicKey(): string {
    return `music:${this.run().music?.title ?? ''}:${this.stageDone(this.run(), 'music')}`;
  }

  async listen(scene: StoryScene): Promise<void> {
    await this.fetchAudio(this.sceneKey(scene), () => this.stories.sceneAudio(this.run().id, scene.number));
  }

  async listenMusic(): Promise<void> {
    await this.fetchAudio(this.musicKey(), () => this.stories.musicFile(this.run().id));
  }

  private async fetchAudio(key: string, fetch: () => ReturnType<StoryAgentService['musicFile']>): Promise<string | null> {
    const have = this.audio()[key];
    if (have) return have;
    this.loadingAudio.set(key);
    try {
      const blob = await firstValueFrom(fetch());
      if (this.destroyed) return null;
      const url = URL.createObjectURL(blob);
      this.audio.update((all) => ({ ...all, [key]: url }));
      return url;
    } catch (failure: unknown) {
      this.error.set(failure instanceof ApiFailure ? failure.message : 'That audio could not be loaded.');
      return null;
    } finally {
      this.loadingAudio.set(null);
    }
  }

  /** Every scene in order, as the video will play them; with the music under it at the chosen level when asked. */
  async playAll(withMusic: boolean): Promise<void> {
    this.stopAll();
    if (this.voiced().length === 0) return;
    if (withMusic && this.run().music) {
      const url = await this.fetchAudio(this.musicKey(), () => this.stories.musicFile(this.run().id));
      this.bedSrc.set(url);
    }
    await this.playAt(0, withMusic);
  }

  private async playAt(index: number, withMusic: boolean): Promise<void> {
    const scene = this.voiced()[index];
    if (!scene) {
      this.stopAll();
      return;
    }
    const url = await this.fetchAudio(this.sceneKey(scene), () => this.stories.sceneAudio(this.run().id, scene.number));
    if (!url) {
      this.stopAll();
      return;
    }
    this.sequence.set({ index, withMusic });
    this.sequenceSrc.set(url);
  }

  async next(): Promise<void> {
    const at = this.sequence();
    if (at) await this.playAt(at.index + 1, at.withMusic);
  }

  stopAll(): void {
    this.sequence.set(null);
    this.sequenceSrc.set(null);
    this.bed()?.nativeElement.pause();
    this.bedSrc.set(null);
  }

  /** The music under the voice follows the slider as it moves, so the level can be judged by ear. */
  setVolume(value: number): void {
    this.volume.set(Math.min(1, Math.max(0, value)));
  }

  // ------------------------------------------------------------------------------------------------ acting

  private async act(what: Busy, call: () => Promise<StoryRun>, done?: string): Promise<boolean> {
    if (this.busy() !== null) return false;
    this.busy.set(what);
    this.error.set(null);
    this.stopAll();
    try {
      const run = await call();
      this.runChange.emit(run);
      if (done) this.status.showNotice(done);
      return true;
    } catch (failure: unknown) {
      this.error.set(failure instanceof ApiFailure ? failure.message : 'That did not work. Please try again.');
      return false;
    } finally {
      this.busy.set(null);
    }
  }

  async approve(stage: StoryReviewStage): Promise<void> {
    const run = this.run();
    const volume = stage === 'music' && this.volume() !== run.options.musicVolume ? this.volume() : undefined;
    const next = stage === 'narration' ? 'Voice approved. Next: the music.' : stage === 'music' ? 'Music approved. Building the video…' : 'Video approved. The YouTube details are being made.';
    await this.act('approve', () => firstValueFrom(this.stories.approveReview(run.id, stage, volume)), next);
  }

  toggleRetake(number: number, on: boolean): void {
    this.retake.update((set) => {
      const copy = new Set(set);
      if (on) copy.add(number); else copy.delete(number);
      return copy;
    });
  }

  /** Takes the ticked scenes again; with a changed voice, delivery or speed, speaks every scene again. */
  async redoVoice(): Promise<void> {
    const run = this.run();
    const o = run.options;
    const body = {
      scenes: [...this.retake()],
      ...(this.voiceId() !== (o.voiceId ?? null) ? { voiceId: this.voiceId() ?? '' } : {}),
      ...((this.delivery().trim() || null) !== (o.speechStyle ?? null) ? { speechStyle: this.delivery().trim() } : {}),
      ...(this.rate() !== o.speechRate ? { speechRate: this.rate() } : {}),
      ...(this.castVoices() !== (o.castVoices ?? true) ? { castVoices: this.castVoices() } : {}),
    };
    const what = this.voiceChanged() ? 'every scene in the new voice' : body.scenes.length > 0 ? `${body.scenes.length} scene${body.scenes.length === 1 ? '' : 's'}` : 'every scene';
    await this.act('voice', () => firstValueFrom(this.stories.redoNarration(run.id, body)), `Speaking ${what} again…`);
  }

  setDelivery(value: string): void {
    this.delivery.set(value.slice(0, MAX_STYLE_CHARS));
  }

  /** A suggestion becomes a full brief: the instruments and feel, at the story's length, and always instrumental. */
  useSuggestion(style: string): void {
    this.brief.set(
      `Instrumental background score for a narrated Indian mythological story video. Style and instruments: ${style}. `
      + `About ${this.briefSeconds()} seconds long, with a gentle opening, a fuller middle and a calm ending. `
      + 'Keep it soft and steady so a voice speaking over it stays clear. Instrumental only: no vocals, no singing, no lyrics, no spoken words.');
  }

  setBrief(value: string): void {
    this.brief.set(value.slice(0, MAX_BRIEF_CHARS));
  }

  async copyBrief(): Promise<void> {
    if (await copyText(this.brief())) {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 1800);
    } else {
      this.status.showError('The browser did not allow copying. Select the brief and copy it by hand.');
    }
  }

  /** Composes again from the brief as it now reads (the script's own brief when it was not changed). */
  async compose(): Promise<void> {
    const run = this.run();
    const written = this.brief().trim();
    const prompt = written === (run.musicBrief?.prompt ?? '').trim() && !run.options.musicPrompt ? null : written;
    await this.act('music', () => firstValueFrom(this.stories.redoMusic(run.id, { prompt, source: 'Generate', volume: this.volume() })),
      'Composing new music…');
  }

  async searchMusic(): Promise<void> {
    const run = this.run();
    await this.act('music', () => firstValueFrom(this.stories.redoMusic(run.id, { source: 'Search', volume: this.volume() })),
      'Searching for a track…');
  }

  async noMusic(): Promise<void> {
    const run = this.run();
    if (!confirm('Make the video without background music?')) return;
    await this.act('music', () => firstValueFrom(this.stories.redoMusic(run.id, { off: true })), 'The video will have no music.');
  }

  async upload(event: Event): Promise<void> {
    const field = event.target as HTMLInputElement;
    const file = field.files?.[0];
    field.value = '';
    if (!file) return;
    if (file.size > MAX_MUSIC_BYTES) {
      this.error.set('A music file can be at most 25 MB.');
      return;
    }
    const run = this.run();
    await this.act('upload', () => firstValueFrom(this.stories.attachMusic(run.id, file)), `Using "${file.name}". Listen to it, then approve it.`);
  }

  // ------------------------------------------------------------------------------------------------ the look

  effectOf(scene: StoryScene): StoryEffect {
    return this.edits()[scene.number]?.effect ?? scene.effect ?? 'ZoomIn';
  }

  transitionOf(scene: StoryScene): StoryTransition {
    return this.edits()[scene.number]?.transition ?? scene.transition ?? 'Fade';
  }

  secondsOf(scene: StoryScene): number {
    return this.edits()[scene.number]?.transitionSeconds ?? scene.transitionSeconds ?? 0.5;
  }

  /** Set by the person: pinned before, or changed here and not handed back. */
  pinned(scene: StoryScene): boolean {
    const edit = this.edits()[scene.number];
    return edit ? !edit.auto : !!scene.lookPinned;
  }

  editLook(scene: StoryScene, change: LookEdit): void {
    this.edits.update((all) => ({ ...all, [scene.number]: { ...all[scene.number], ...change, auto: false } }));
  }

  automatic(scene: StoryScene): void {
    this.edits.update((all) => ({ ...all, [scene.number]: { auto: true } }));
  }

  /** A fresh automatic pick for every scene not set by hand, in the chosen style. */
  async newLook(): Promise<void> {
    await this.rebuild(true);
  }

  async applyLook(): Promise<void> {
    await this.rebuild(false);
  }

  private async rebuild(newLook: boolean): Promise<void> {
    const run = this.run();
    const scenes: EditSceneLookBody[] = Object.entries(this.edits()).map(([number, edit]) => ({
      number: Number(number),
      ...(edit.auto ? { auto: true } : {
        effect: edit.effect ?? this.scenes().find((s) => s.number === Number(number))?.effect ?? undefined,
        transition: edit.transition ?? this.scenes().find((s) => s.number === Number(number))?.transition ?? undefined,
        transitionSeconds: edit.transitionSeconds,
      }),
    }));
    await this.act('look', () => firstValueFrom(this.stories.redoLook(run.id, {
      newLook, style: this.lookStyle(), musicVolume: this.volume(), scenes,
    })), newLook ? 'Making the video again with a new look…' : 'Making the video again with your changes…');
  }

  // ------------------------------------------------------------------------------------------------ template helpers

  text(event: Event): string {
    return (event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value;
  }

  checked(event: Event): boolean {
    return (event.target as HTMLInputElement).checked;
  }

  numeric(event: Event): number {
    return Number((event.target as HTMLInputElement).value);
  }

  voiceLabel(voice: VoiceoverVoice): string {
    return `${voice.name || voice.id}${voice.gender ? ' · ' + voice.gender : ''}`;
  }
}
