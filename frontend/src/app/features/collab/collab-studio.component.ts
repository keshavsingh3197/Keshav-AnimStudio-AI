import { DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, DestroyRef, ElementRef, afterNextRender, computed, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { ApiFailure } from '../../core/interceptors/api-error.interceptor';
import { Asset, Project } from '../../core/models/api.models';
import { ApiService, StudioVoiceSegment } from '../../core/services/api.service';
import { CharacterVoice, describeVoice, sanitizeVoice } from '../../shared/voice/character-voice';
import { FrameClock } from '../live-camera/frame-clock';
import { VisionEngine } from '../live-camera/vision-engine';
import {
  ASPECTS,
  CollabPainter,
  CollabSettings,
  LAYOUTS,
  MIN_SPOT,
  SYNC_LIMIT_MS,
  StitchPhase,
  Turn,
  cueAt,
  defaultCollabSettings,
  frameSize,
  sanitizeCollabSettings,
  suggestLayout,
  takesTurns,
  voiceHeard,
} from './collab-layout';
import { CollabMixer, MixLevels } from './collab-mixer';

type RecState = 'idle' | 'countdown' | 'recording' | 'rendering' | 'saving' | 'voicing';
type SourceTab = 'computer' | 'project';

/** Who you were speaking as, from `at` seconds after the original started. */
interface VoiceCue {
  at: number;
  characterId: string | null;
  name: string;
  /** A copy, so editing the character later doesn't change a take already made. */
  voice: CharacterVoice | null;
}

/** A project character you can speak as. */
interface Speaker {
  id: string;
  name: string;
  voice: CharacterVoice;
}

/** One recording: the finished mix, plus the raw camera take it can be rebuilt from. */
interface Take {
  id: number;
  mix: Blob;
  mixUrl: string;
  raw: Blob;
  rawUrl: string;
  mimeType: string;
  seconds: number;
  /** Seconds the camera was recording before the original started. */
  lead: number;
  /** How late you heard the original when recording, seconds (the automatic sync correction). */
  latency: number;
  sourceIn: number;
  sourceOut: number;
  /** Which original it was recorded against; it can only be rebuilt against the same one. */
  sourceKey: number;
  /** The hand sync correction the mix was made with, ms; positive shows you earlier. */
  syncMs: number;
  /** The settings the mix was made with, to tell when it's out of date. */
  look: string;
  /** When the original paused for you and carried on; one entry for a take that never paused. */
  turns: Turn[];
  /** Which voice you spoke in, and when you switched. */
  voices: VoiceCue[];
  /**
   * The raw take re-voiced on the server at studio quality (null: the live browser voice).
   * When set, rebuilds use it as the take and apply no voice effect of their own.
   */
  studio: { raw: Blob; url: string } | null;
  savedAs: string | null;
}

/** Per-viewer conveniences: never anything that has to persist reliably. */
interface Remembered {
  settings?: unknown;
  cameraId?: string;
  micId?: string;
  projectId?: string;
}

/** Best first: MP4 can be saved straight into a project; WebM can still be downloaded. */
const FORMATS = [
  'video/mp4;codecs=avc1.640028,mp4a.40.2',
  'video/mp4;codecs=avc1,mp4a',
  'video/mp4',
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm',
];
/** For a microphone-only take (a dub): just your voice, no picture. */
const AUDIO_FORMATS = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm'];
const REMEMBER_KEY = 'animstudio.collab';
const FPS = 30;
const UI_REFRESH_MS = 200;
const MAX_TAKES = 6;
/** The longest a recording may run, so a forgotten take can't fill the browser's memory. */
const MAX_RECORD_SECONDS = 10 * 60;
/** Number keys pick a voice: 0 is your own, 1-9 the project's characters in order. */
const MAX_VOICE_KEYS = 9;
/** The server's limit on voice switches in one studio voice. */
const STUDIO_MAX_SWITCHES = 200;
/** In a stitch (or after a commentary's last part), your part ends by itself after this long if you don't stop it. */
const MAX_YOUR_TURN_SECONDS = 3 * 60;
/** "Your turn" shows this long before the original stops in a stitch. */
const TURN_WARNING_SECONDS = 3;
/** A segmentation slower than this per frame runs every other frame. */
const SEGMENT_BUDGET_MS = 18;

function pickFormat(formats: readonly string[] = FORMATS): string | null {
  if (typeof MediaRecorder === 'undefined') return null;
  return formats.find((f) => MediaRecorder.isTypeSupported(f)) ?? null;
}

/** Everything that changes how the mix looks or sounds. */
function lookOf(s: CollabSettings): string {
  const { countdown: _countdown, ...look } = s;
  return JSON.stringify(look);
}

function once(target: EventTarget, event: string): Promise<void> {
  return new Promise((resolve) => target.addEventListener(event, () => resolve(), { once: true }));
}

/**
 * Collab Studio: record yourself with an existing video - side by side, stacked, reacting in a
 * bubble, cut out in front of it, or answering after a part of it (a stitch).
 * <p>
 * The browser draws the frame and records it, so a take is ready the moment it ends. It also
 * keeps the raw camera take, so layout, sync and volume can be changed afterwards and the mix
 * rebuilt without filming again. Nothing leaves this machine unless it's saved to a project.
 */
@Component({
  selector: 'app-collab-studio',
  imports: [FormsModule, DecimalPipe, RouterLink],
  templateUrl: './collab-studio.component.html',
  styleUrls: ['./collab-studio.component.css'],
  host: { '(document:keydown)': 'onKey($event)' },
})
export class CollabStudioComponent {
  private readonly api = inject(ApiService);
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);

  readonly layouts = LAYOUTS;
  readonly aspects = ASPECTS;
  readonly minSpot = MIN_SPOT;
  readonly syncLimit = SYNC_LIMIT_MS;
  readonly format = pickFormat();
  readonly canSaveToProject = !!this.format?.startsWith('video/mp4');

  private readonly canvasRef = viewChild<ElementRef<HTMLCanvasElement>>('program');

  readonly settings = signal<CollabSettings>(defaultCollabSettings());
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);

  // The original
  readonly sourceTab = signal<SourceTab>('computer');
  readonly sourceName = signal<string | null>(null);
  readonly sourceDuration = signal(0);
  readonly sourceTime = signal(0);
  readonly sourcePlaying = signal(false);
  readonly rangeIn = signal(0);
  readonly rangeOut = signal(0);
  readonly loadingSource = signal(false);
  readonly projects = signal<Project[]>([]);
  readonly projectVideos = signal<Asset[]>([]);
  readonly loadingVideos = signal(false);
  projectId = '';

  // Camera
  readonly cameras = signal<MediaDeviceInfo[]>([]);
  readonly mics = signal<MediaDeviceInfo[]>([]);
  /** The camera, or for a dub just the microphone, is open: you're ready to record. */
  readonly cameraOn = signal(false);
  /** Only the microphone is open (no picture of you). */
  readonly micOnly = signal(false);
  readonly openingCamera = signal(false);
  readonly micLevel = signal(0);
  readonly cutoutState = signal<'off' | 'loading' | 'ready' | 'failed'>('off');
  cameraId = '';
  micId = '';

  // Recording and takes
  readonly state = signal<RecState>('idle');
  readonly countdownLeft = signal(0);
  readonly recordSeconds = signal(0);
  readonly phase = signal<StitchPhase>('source');
  readonly yourTurnIn = signal<number | null>(null);
  readonly renderProgress = signal(0);
  /** How many times you've talked in the take being recorded. */
  readonly talkCount = signal(0);

  // Speaking as a character
  readonly speakers = signal<Speaker[]>([]);
  readonly speakAsId = signal<string | null>(null);
  readonly hearVoice = signal(false);
  readonly pitchUnavailable = signal(false);
  /** The server can make studio voices. */
  readonly studioAvailable = signal(false);
  readonly describeVoice = describeVoice;
  readonly takes = signal<Take[]>([]);
  readonly selectedId = signal<number | null>(null);
  /** The sync correction being tried on the selected take, ms. */
  readonly syncMs = signal(0);

  readonly selected = computed(() => this.takes().find((t) => t.id === this.selectedId()) ?? null);
  readonly busy = computed(() => this.state() !== 'idle');
  readonly portrait = computed(() => this.settings().aspect === 'portrait');
  readonly square = computed(() => this.settings().aspect === 'square');
  readonly rangeSeconds = computed(() => Math.max(0, this.rangeOut() - this.rangeIn()));
  readonly layoutHint = computed(() => LAYOUTS.find((l) => l.id === this.settings().layout)?.hint ?? '');
  readonly turnBased = computed(() => takesTurns(this.settings().layout));
  readonly speakingAs = computed(() => this.speakers().find((c) => c.id === this.speakAsId()) ?? null);
  /** The selected take was made with other settings, and can be rebuilt with these. */
  readonly takeOutdated = computed(() => {
    const take = this.selected();
    return !!take && take.sourceKey === this.sourceKeyNow()
      && (take.look !== lookOf(this.settings()) || take.syncMs !== this.syncMs());
  });
  readonly canRecord = computed(() =>
    !this.busy() && this.cameraOn() && !!this.sourceName() && !!this.format && this.rangeSeconds() > 0.5
    && (!this.micOnly() || this.settings().layout === 'dub'));
  readonly recordBlocker = computed(() => {
    if (!this.format) return 'This browser can\'t record video. Use a current Chrome or Edge.';
    if (!this.sourceName()) return 'Pick a video to collab with first.';
    if (!this.cameraOn()) return this.settings().layout === 'dub' ? 'Turn on your microphone first.' : 'Turn on your camera first.';
    if (this.micOnly() && this.settings().layout !== 'dub') return 'This layout shows you: turn the camera on, or pick the Dub layout.';
    if (this.rangeSeconds() <= 0.5) return 'The chosen part of the video is too short.';
    return null;
  });

  private painter: CollabPainter | null = null;
  private clock: FrameClock | null = null;
  private mixer: CollabMixer | null = null;
  private readonly vision = new VisionEngine();
  private mask: CanvasImageSource | null = null;
  private segmentSlow = false;
  private frameIndex = 0;
  private lastUi = 0;

  private sourceVideo: HTMLVideoElement | null = null;
  private sourceUrl: string | null = null;
  /** The source URL belongs to this page (a file or a project video), not to a take. */
  private sourceOwned = false;
  /** Which original is loaded; bumped each time it changes. */
  readonly sourceKeyNow = signal(0);
  private sourceKnownSeconds = 0;
  private layoutChosen = false;

  private cameraVideo: HTMLVideoElement | null = null;
  private cameraMedia: MediaStream | null = null;

  private countdownTimer: ReturnType<typeof setInterval> | null = null;
  private recording: {
    mix: MediaRecorder;
    raw: MediaRecorder;
    mixChunks: Blob[];
    rawChunks: Blob[];
    canvasTrack: MediaStreamTrack;
    startedAt: number;
    lead: number;
    /** Set when the original reaches its end and the last turn is yours. */
    yourTurnAt: number | null;
    turns: Turn[];
    voices: VoiceCue[];
    resuming: boolean;
  } | null = null;
  private render: {
    take: Take;
    source: HTMLVideoElement;
    camera: HTMLVideoElement;
    mixer: CollabMixer;
    startAt: number;
    sourceIn: number;
    phase: StitchPhase;
    turn: Turn;
    cue: VoiceCue;
    /** Playing a studio-voiced take: the voice is already in it. */
    studio: boolean;
    tick: () => void;
  } | null = null;
  /** The phase the preview last drew, so the bubble is only dragged when it's on screen. */
  private drawnPhase: StitchPhase = 'source';
  private nextTakeId = 1;
  private rememberTimer: ReturnType<typeof setTimeout> | null = null;
  private drag: { kind: 'spot' | 'split'; pointerId: number; dx: number; dy: number } | null = null;

  constructor() {
    this.restore();
    void this.listDevices();
    void this.loadProjects();
    void firstValueFrom(this.api.studioVoiceAvailable())
      .then((status) => this.studioAvailable.set(status.available))
      .catch(() => this.studioAvailable.set(false));
    navigator.mediaDevices?.addEventListener?.('devicechange', this.onDeviceChange);

    afterNextRender(() => {
      this.painter = new CollabPainter(this.canvasRef()!.nativeElement);
      this.sizeCanvas();
      this.clock = new FrameClock(FPS, () => this.frame());
      this.clock.start();
    });

    inject(DestroyRef).onDestroy(() => void this.teardown());

    const query = this.route.snapshot.queryParamMap;
    const project = query.get('project');
    const asset = query.get('asset');
    if (project && asset) {
      this.projectId = project;
      this.sourceTab.set('project');
      void this.loadProjectVideos().then(() => {
        const video = this.projectVideos().find((v) => v.id === asset);
        if (video) void this.pickAsset(video);
      });
    }
  }

  // ------------------------------------------------------------------ settings

  patch(change: Partial<CollabSettings>): void {
    if (change.layout) this.layoutChosen = true;
    const before = this.settings();
    this.settings.set(sanitizeCollabSettings({ ...before, ...change }));
    if (change.aspect || change.quality) this.sizeCanvas();
    this.mixer?.apply(this.levels());
    if (this.settings().layout === 'green') void this.ensureCutout();
    this.scheduleRemember();
  }

  patchSpot(which: 'react' | 'green', change: Partial<CollabSettings['react']>): void {
    this.patch({ [which]: { ...this.settings()[which], ...change } } as Partial<CollabSettings>);
  }

  setSync(ms: number): void {
    this.syncMs.set(Math.round(Math.min(SYNC_LIMIT_MS, Math.max(-SYNC_LIMIT_MS, ms))));
  }

  private levels(): MixLevels {
    const s = this.settings();
    return { sourceVolume: s.sourceVolume, voiceVolume: s.voiceVolume, duck: s.duck };
  }

  private sizeCanvas(): void {
    const s = this.settings();
    const { width, height } = frameSize(s.aspect, s.quality);
    this.painter?.resize(width, height);
  }

  // ------------------------------------------------------------------ the original video

  pickFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      this.error.set('That isn\'t a video file.');
      return;
    }
    this.ensureMixer();
    this.useSource(URL.createObjectURL(file), file.name, true);
  }

  async loadProjects(): Promise<void> {
    try {
      this.projects.set(await firstValueFrom(this.api.listProjects()));
      if (this.projectId && !this.projects().some((p) => p.id === this.projectId)) this.projectId = '';
      if (!this.projectId && this.projects().length) this.projectId = this.projects()[0].id;
      if (this.sourceTab() === 'project') void this.loadProjectVideos();
      void this.loadSpeakers();
    } catch {
      // Projects are optional here: a file from this computer still works.
    }
  }

  onProjectChange(): void {
    this.scheduleRemember();
    if (this.sourceTab() === 'project') void this.loadProjectVideos();
    if (!this.busy()) void this.loadSpeakers();
  }

  // ------------------------------------------------------------------ speaking as a character

  /** The project's characters that have a voice, to speak as. */
  async loadSpeakers(): Promise<void> {
    if (!this.projectId) {
      this.speakers.set([]);
      this.speakAs(null);
      return;
    }
    try {
      const list = await firstValueFrom(this.api.listCharacters(this.projectId));
      const speakers: Speaker[] = [];
      for (const c of list) {
        const voice = sanitizeVoice(c.voice);
        if (voice) speakers.push({ id: c.id, name: c.name, voice });
      }
      this.speakers.set(speakers);
    } catch {
      // Voices are optional: without them you record in your own voice.
      this.speakers.set([]);
    }
    if (!this.speakingAs()) this.speakAs(null);
    else this.mixer?.setCharacterVoice(this.speakingAs()!.voice);
  }

  /** Switches voice; mid-take too, which the take remembers so a rebuild switches at the same moment. */
  speakAs(characterId: string | null): void {
    if (this.state() === 'rendering') return;
    const speaker = this.speakers().find((c) => c.id === characterId) ?? null;
    this.speakAsId.set(speaker?.id ?? null);
    this.mixer?.setCharacterVoice(speaker?.voice ?? null);
    const rec = this.recording;
    if (rec) rec.voices.push(this.voiceCue((performance.now() - rec.startedAt) / 1000));
  }

  setHearVoice(on: boolean): void {
    this.hearVoice.set(on);
    this.mixer?.setVoiceMonitor(on);
  }

  private voiceCue(at: number): VoiceCue {
    const speaker = this.speakingAs();
    return { at, characterId: speaker?.id ?? null, name: speaker?.name ?? 'You', voice: speaker ? { ...speaker.voice } : null };
  }

  /** "You, Vishnu and Ravana" for a take's card. */
  voicesUsed(take: Take): string {
    const names = [...new Set(take.voices.map((v) => v.name))];
    return names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : names[0] ?? 'You';
  }

  talksIn(take: Take): number {
    return take.turns.filter((t) => t.phase === 'you').length;
  }

  showTab(tab: SourceTab): void {
    this.sourceTab.set(tab);
    if (tab === 'project' && !this.projectVideos().length) void this.loadProjectVideos();
  }

  async loadProjectVideos(): Promise<void> {
    if (!this.projectId) return;
    this.loadingVideos.set(true);
    try {
      const assets = await firstValueFrom(this.api.listAssets(this.projectId));
      this.projectVideos.set(assets.filter((a) => a.kind === 'Video'));
    } catch (err: unknown) {
      this.projectVideos.set([]);
      this.error.set(this.describe(err, 'Couldn\'t list that project\'s videos.'));
    } finally {
      this.loadingVideos.set(false);
    }
  }

  thumbnail(asset: Asset): string {
    return this.api.assetThumbnailUrl(asset.id);
  }

  async pickAsset(asset: Asset): Promise<void> {
    if (this.busy()) return;
    this.ensureMixer();
    this.loadingSource.set(true);
    this.error.set(null);
    try {
      // Fetched through HttpClient so the request carries the same sign-in as the rest of the app.
      const blob = await firstValueFrom(this.http.get(this.api.assetUrl(asset.id), { responseType: 'blob' }));
      this.useSource(URL.createObjectURL(blob), asset.name, true);
    } catch (err: unknown) {
      this.error.set(this.describe(err, 'Couldn\'t load that video.'));
    } finally {
      this.loadingSource.set(false);
    }
  }

  /** Collab with a finished take: a duet with your own duet, a reply to your reply. */
  useTakeAsSource(take: Take): void {
    if (this.busy()) return;
    this.ensureMixer();
    this.useSource(take.mixUrl, `Take ${take.id}`, false, take.seconds);
    this.notice.set(`Take ${take.id} is now the original. Record again to add another layer.`);
  }

  /** `knownSeconds` covers browser recordings, which often don't say how long they are. */
  private useSource(url: string, name: string, owned: boolean, knownSeconds = 0): void {
    this.detachSource();
    if (this.sourceOwned && this.sourceUrl) URL.revokeObjectURL(this.sourceUrl);
    this.sourceUrl = url;
    this.sourceOwned = owned;
    this.sourceKnownSeconds = knownSeconds;
    this.sourceKeyNow.update((k) => k + 1);
    this.sourceName.set(name);
    this.sourceTime.set(0);
    this.sourceDuration.set(0);
    this.rangeIn.set(0);
    this.rangeOut.set(0);
    this.attachSource();
  }

  /** A fresh element per mixer: an element is tied to one audio context for good. */
  private attachSource(): void {
    if (!this.sourceUrl || !this.mixer) return;
    const video = this.makeVideo(this.sourceUrl);
    video.addEventListener('loadedmetadata', () => {
      const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : this.sourceKnownSeconds;
      this.sourceDuration.set(duration);
      if (!this.rangeOut()) this.rangeOut.set(duration);
      if (!this.layoutChosen && !this.takes().length) {
        this.settings.update((s) => ({ ...s, ...suggestLayout(video.videoWidth, video.videoHeight) }));
        this.sizeCanvas();
      }
    });
    video.addEventListener('play', () => this.sourcePlaying.set(true));
    video.addEventListener('pause', () => this.sourcePlaying.set(false));
    video.addEventListener('error', () =>
      this.error.set('This video can\'t be played in the browser. Try an MP4 (H.264) or WebM file.'));
    this.mixer.setSource(video);
    this.sourceVideo = video;
  }

  private detachSource(): void {
    if (!this.sourceVideo) return;
    this.sourceVideo.pause();
    this.mixer?.setSource(null);
    this.sourceVideo.removeAttribute('src');
    this.sourceVideo.load();
    this.sourceVideo = null;
    this.sourcePlaying.set(false);
  }

  togglePlay(): void {
    // In a commentary take, pausing the video is how you take your turn, and playing it hands back.
    if (this.state() === 'recording' && this.settings().layout === 'commentary') {
      void this.toggleTurn();
      return;
    }
    const v = this.sourceVideo;
    if (!v || this.busy()) return;
    void this.mixer?.resume();
    if (v.paused) {
      if (v.currentTime < this.rangeIn() || v.currentTime >= this.rangeOut() - 0.05) v.currentTime = this.rangeIn();
      void v.play();
    } else {
      v.pause();
    }
  }

  seek(seconds: number): void {
    if (this.sourceVideo && Number.isFinite(seconds) && !this.busy()) this.sourceVideo.currentTime = seconds;
  }

  setIn(seconds: number): void {
    this.rangeIn.set(Math.max(0, Math.min(seconds, this.rangeOut() - 0.5)));
    this.seek(this.rangeIn());
  }

  setOut(seconds: number): void {
    this.rangeOut.set(Math.min(this.sourceDuration(), Math.max(seconds, this.rangeIn() + 0.5)));
  }

  markIn(): void {
    this.setIn(this.sourceTime());
  }

  markOut(): void {
    this.setOut(this.sourceTime());
  }

  // ------------------------------------------------------------------ camera

  async listDevices(): Promise<void> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      this.cameras.set(devices.filter((d) => d.kind === 'videoinput'));
      this.mics.set(devices.filter((d) => d.kind === 'audioinput'));
    } catch {
      // Until permission is given the lists fill in after the camera opens.
    }
  }

  private readonly onDeviceChange = () => void this.listDevices();

  /** `withVideo` false opens only the microphone, for a dub. */
  async openCamera(withVideo = true): Promise<void> {
    if (this.openingCamera()) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      this.error.set('This browser can\'t open a camera. Use Chrome, Edge, Firefox or Safari over https or localhost.');
      return;
    }
    this.ensureMixer();
    this.openingCamera.set(true);
    this.error.set(null);
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: withVideo ? {
          deviceId: this.cameraId ? { exact: this.cameraId } : undefined,
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: FPS },
        } : false,
        // The browser's echo cancelling keeps the original (from the speakers) out of your voice.
        audio: {
          deviceId: this.micId ? { exact: this.micId } : undefined,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      this.closeCameraMedia();
      this.cameraMedia = media;
      if (withVideo) {
        const video = document.createElement('video');
        video.muted = true;
        video.playsInline = true;
        video.srcObject = new MediaStream(media.getVideoTracks());
        await video.play();
        this.cameraVideo = video;
      }
      this.micOnly.set(!withVideo);
      this.mixer!.setVoice(new MediaStream(media.getAudioTracks()));
      void this.mixer!.resume();
      this.cameraOn.set(true);
      this.scheduleRemember();
      void this.listDevices();
      if (this.settings().layout === 'green') void this.ensureCutout();
    } catch (err: unknown) {
      this.error.set(this.describeMediaError(err));
    } finally {
      this.openingCamera.set(false);
    }
  }

  async switchDevice(): Promise<void> {
    this.scheduleRemember();
    if (this.cameraOn() && !this.busy()) await this.openCamera(!this.micOnly());
  }

  closeCamera(): void {
    if (this.busy()) return;
    this.closeCameraMedia();
    this.mixer?.setVoice(null);
    this.cameraOn.set(false);
    this.micOnly.set(false);
  }

  private closeCameraMedia(): void {
    this.cameraMedia?.getTracks().forEach((t) => t.stop());
    this.cameraMedia = null;
    if (this.cameraVideo) this.cameraVideo.srcObject = null;
    this.cameraVideo = null;
  }

  /** The person model, loaded only when the green screen is first used. */
  private async ensureCutout(): Promise<void> {
    if (this.cutoutState() === 'loading' || this.cutoutState() === 'ready') return;
    this.cutoutState.set('loading');
    try {
      await this.vision.load();
      this.cutoutState.set('ready');
    } catch {
      this.cutoutState.set('failed');
      this.error.set(`The green screen couldn't start: ${this.vision.error ?? 'the person model didn\'t load'}. Run "npm run vision:models" once, or pick another layout.`);
    }
  }

  private ensureMixer(): void {
    if (this.mixer) return;
    this.mixer = new CollabMixer(true);
    this.mixer.apply(this.levels());
    this.mixer.setCharacterVoice(this.speakingAs()?.voice ?? null);
    this.mixer.setVoiceMonitor(this.hearVoice());
    void this.mixer.init().then((pitch) => this.pitchUnavailable.set(!pitch));
    this.attachSource();
  }

  // ------------------------------------------------------------------ the frame

  private frame(): void {
    if (!this.painter) return;
    this.frameIndex++;
    if (this.render) {
      this.render.tick();
      return;
    }

    const s = this.settings();
    const v = this.sourceVideo;
    const recording = this.recording;

    if (v && !recording && this.state() === 'idle' && !v.paused && v.currentTime >= this.rangeOut() - 0.03 && this.rangeOut() > 0) {
      // Previewing loops the chosen part, so it's easy to rehearse.
      v.currentTime = this.rangeIn();
    }

    if (recording) this.recordTick(recording);

    // A stitch or commentary preview shows you while the original is paused, so you can frame yourself.
    const phase: StitchPhase = recording ? this.phase() : takesTurns(s.layout) && (!v || v.paused) ? 'you' : 'source';
    this.drawnPhase = phase;
    this.updateMask(this.cameraVideo);
    this.painter.draw({ settings: s, source: v, camera: this.cameraVideo, mask: this.mask, phase });

    const level = this.mixer?.tick() ?? 0;
    const now = performance.now();
    if (now - this.lastUi > UI_REFRESH_MS) {
      this.lastUi = now;
      this.micLevel.set(this.cameraOn() ? level : 0);
      if (v) this.sourceTime.set(v.currentTime);
      if (recording) this.recordSeconds.set((now - recording.startedAt) / 1000);
    }
  }

  private updateMask(video: HTMLVideoElement | null): void {
    if (this.settings().layout !== 'green' || this.cutoutState() !== 'ready' || !video) {
      this.mask = null;
      return;
    }
    if (this.segmentSlow && this.frameIndex % 2 === 1 && this.mask) return;
    const started = performance.now();
    try {
      this.mask = this.vision.segment(video)?.canvas ?? this.mask;
    } catch {
      this.mask = null;
    }
    this.segmentSlow = performance.now() - started > SEGMENT_BUDGET_MS;
  }

  // ------------------------------------------------------------------ recording

  /** Counts down, then starts the camera take, then the original, then the mix. */
  async record(): Promise<void> {
    if (!this.canRecord()) return;
    const v = this.sourceVideo!;
    this.error.set(null);
    void this.mixer!.resume();

    v.pause();
    v.currentTime = this.rangeIn();
    await once(v, 'seeked');
    this.phase.set('source');
    this.yourTurnIn.set(null);
    this.talkCount.set(0);

    const seconds = this.settings().countdown;
    if (seconds > 0) {
      this.state.set('countdown');
      this.countdownLeft.set(seconds);
      const finished = await new Promise<boolean>((resolve) => {
        this.countdownTimer = setInterval(() => {
          if (this.state() !== 'countdown') {
            this.clearCountdown();
            resolve(false);
            return;
          }
          this.countdownLeft.update((n) => n - 1);
          if (this.countdownLeft() <= 0) {
            this.clearCountdown();
            resolve(true);
          }
        }, 1000);
      });
      if (!finished) return;
    }
    await this.beginRecording(v);
  }

  cancelCountdown(): void {
    if (this.state() === 'countdown') this.state.set('idle');
  }

  private clearCountdown(): void {
    if (this.countdownTimer) clearInterval(this.countdownTimer);
    this.countdownTimer = null;
  }

  private async beginRecording(v: HTMLVideoElement): Promise<void> {
    const canvas = this.canvasRef()!.nativeElement;
    const s = this.settings();
    this.state.set('recording');
    this.mixer!.setVoiceOn(voiceHeard(s, 'source'));

    try {
      const canvasTrack = canvas.captureStream(FPS).getVideoTracks()[0];
      const program = new MediaStream([canvasTrack, ...this.mixer!.stream.getAudioTracks()]);
      const bitrate = s.quality === 1080 ? 10_000_000 : 6_000_000;
      // Without a camera the raw take is just your voice; a video format can't record that everywhere.
      const rawFormat = this.micOnly() ? pickFormat(AUDIO_FORMATS) : this.format!;
      if (!rawFormat) throw new Error('this browser can\'t record the microphone on its own');
      const raw = new MediaRecorder(this.cameraMedia!, this.micOnly()
        ? { mimeType: rawFormat, audioBitsPerSecond: 128_000 }
        : { mimeType: rawFormat, videoBitsPerSecond: 6_000_000 });
      const mix = new MediaRecorder(program, { mimeType: this.format!, videoBitsPerSecond: bitrate });
      const rec = {
        mix, raw, mixChunks: [] as Blob[], rawChunks: [] as Blob[], canvasTrack, startedAt: 0, lead: 0,
        yourTurnAt: null as number | null,
        turns: [{ at: 0, phase: 'source', sourceTime: this.rangeIn() }] as Turn[],
        voices: [this.voiceCue(0)],
        resuming: false,
      };
      raw.ondataavailable = (e) => e.data.size && rec.rawChunks.push(e.data);
      mix.ondataavailable = (e) => e.data.size && rec.mixChunks.push(e.data);

      // The camera starts first, so the take always covers the start of the original.
      const rawStarted = once(raw, 'start');
      raw.start(1000);
      await rawStarted;
      const t0 = performance.now();
      await v.play();
      const t1 = performance.now();
      mix.start(1000);
      rec.startedAt = t1;
      rec.lead = (t1 - t0) / 1000;
      this.recording = rec;
    } catch (err: unknown) {
      this.state.set('idle');
      this.mixer!.setVoiceOn(true);
      this.error.set(`Recording couldn't start: ${err instanceof Error ? err.message : 'unknown error'}.`);
    }
  }

  private recordTick(rec: NonNullable<typeof this.recording>): void {
    const v = this.sourceVideo;
    const now = performance.now();
    const elapsed = (now - rec.startedAt) / 1000;
    if (!v || elapsed > MAX_RECORD_SECONDS) {
      void this.stopRecording();
      return;
    }

    const atEnd = v.ended || v.currentTime >= this.rangeOut() - 0.02;
    if (!takesTurns(this.settings().layout)) {
      if (atEnd) void this.stopRecording();
      return;
    }

    if (this.phase() === 'source') {
      const left = this.rangeOut() - v.currentTime;
      this.yourTurnIn.set(left <= TURN_WARNING_SECONDS ? Math.max(1, Math.ceil(left)) : null);
      if (atEnd && !rec.resuming) {
        v.pause();
        this.switchTurn(rec, 'you', v.currentTime);
        rec.yourTurnAt = now;
      }
    } else if (rec.yourTurnAt && (now - rec.yourTurnAt) / 1000 > MAX_YOUR_TURN_SECONDS) {
      void this.stopRecording();
    }
  }

  /**
   * Commentary: pauses the original so you can talk, or plays its next part. Each switch is
   * kept with the take, so a rebuild pauses and resumes at the same moments.
   */
  async toggleTurn(): Promise<void> {
    const rec = this.recording;
    const v = this.sourceVideo;
    if (!rec || !v || this.settings().layout !== 'commentary' || rec.resuming) return;

    if (this.phase() === 'source') {
      v.pause();
      this.switchTurn(rec, 'you', v.currentTime);
      return;
    }
    if (v.ended || v.currentTime >= this.rangeOut() - 0.05) {
      this.notice.set('That was the end of the chosen part. Press stop when you\'ve finished talking.');
      return;
    }
    rec.resuming = true;
    try {
      await v.play();
    } catch (err: unknown) {
      this.error.set(`The original couldn't carry on: ${err instanceof Error ? err.message : 'unknown error'}.`);
      return;
    } finally {
      rec.resuming = false;
    }
    // Stopped while it was starting up: leave it paused.
    if (this.recording !== rec) {
      v.pause();
      return;
    }
    this.switchTurn(rec, 'source', v.currentTime);
  }

  private switchTurn(rec: NonNullable<typeof this.recording>, phase: StitchPhase, sourceTime: number): void {
    rec.turns.push({ at: (performance.now() - rec.startedAt) / 1000, phase, sourceTime });
    this.phase.set(phase);
    this.yourTurnIn.set(null);
    this.mixer!.setVoiceOn(voiceHeard(this.settings(), phase));
    if (phase === 'you') this.talkCount.update((n) => n + 1);
  }

  async stopRecording(): Promise<void> {
    const rec = this.recording;
    if (!rec) return;
    this.recording = null;
    this.sourceVideo?.pause();
    this.mixer?.setVoiceOn(true);
    this.yourTurnIn.set(null);

    const stopped = Promise.all([once(rec.mix, 'stop'), once(rec.raw, 'stop')]);
    rec.mix.stop();
    rec.raw.stop();
    await stopped;
    rec.canvasTrack.stop();

    const seconds = (performance.now() - rec.startedAt) / 1000;
    const mix = new Blob(rec.mixChunks, { type: this.format! });
    const raw = new Blob(rec.rawChunks, { type: rec.raw.mimeType || this.format! });
    const take: Take = {
      id: this.nextTakeId++,
      mix,
      mixUrl: URL.createObjectURL(mix),
      raw,
      rawUrl: URL.createObjectURL(raw),
      mimeType: this.format!,
      seconds,
      lead: rec.lead,
      latency: this.mixer?.outputLatency ?? 0,
      sourceIn: this.rangeIn(),
      sourceOut: this.rangeOut(),
      sourceKey: this.sourceKeyNow(),
      syncMs: 0,
      look: lookOf(this.settings()),
      turns: rec.turns,
      voices: rec.voices,
      studio: null,
      savedAs: null,
    };

    const kept = [take, ...this.takes()];
    for (const old of kept.slice(MAX_TAKES)) this.releaseTake(old);
    this.takes.set(kept.slice(0, MAX_TAKES));
    this.selectedId.set(take.id);
    this.syncMs.set(0);
    this.phase.set('source');
    this.state.set('idle');
    this.recordSeconds.set(0);
  }

  toggleRecord(): void {
    if (this.state() === 'recording') void this.stopRecording();
    else if (this.state() === 'countdown') this.cancelCountdown();
    else void this.record();
  }

  // ------------------------------------------------------------------ takes

  selectTake(take: Take): void {
    if (this.busy()) return;
    this.selectedId.set(take.id);
    this.syncMs.set(take.syncMs);
  }

  deleteTake(take: Take): void {
    if (this.busy()) return;
    if (this.sourceUrl === take.mixUrl) {
      this.error.set('That take is the current original. Pick another video first.');
      return;
    }
    this.releaseTake(take);
    this.takes.update((list) => list.filter((t) => t.id !== take.id));
    if (this.selectedId() === take.id) this.selectedId.set(this.takes()[0]?.id ?? null);
  }

  private releaseTake(take: Take): void {
    URL.revokeObjectURL(take.mixUrl);
    URL.revokeObjectURL(take.rawUrl);
    if (take.studio) URL.revokeObjectURL(take.studio.url);
  }

  // ------------------------------------------------------------------ studio voice

  /** Some of the take is spoken as an AI voice (a real person's sample), which takes minutes. */
  usesAiVoice(take: Take): boolean {
    return take.voices.some((v) => !!v.voice?.aiSampleAssetId);
  }

  /** A take spoken (at least partly) as a character, so a studio voice would change it. */
  hasCharacterVoice(take: Take): boolean {
    return take.voices.some((v) => v.voice);
  }

  /**
   * Sends the raw take to the server to be re-voiced at studio quality - pitch and body moved
   * separately, so each character sounds like a person rather than an effect - then rebuilds
   * the mix from it. The picture comes back untouched, so sync and turns are unchanged.
   */
  async makeStudioVoice(take: Take): Promise<void> {
    if (this.busy() || take.sourceKey !== this.sourceKeyNow()) return;
    const timeline = this.studioTimeline(take);
    if (!timeline) {
      this.error.set('This take switches voice too often for a studio voice. Record it in shorter takes.');
      return;
    }
    this.sourceVideo?.pause();
    this.state.set('voicing');
    this.error.set(null);
    let voiced: Take;
    try {
      const raw = await firstValueFrom(this.api.studioVoice(take.raw, timeline));
      if (take.studio) URL.revokeObjectURL(take.studio.url);
      voiced = { ...take, studio: { raw, url: URL.createObjectURL(raw) } };
      this.takes.update((list) => list.map((t) => (t.id === take.id ? voiced : t)));
    } catch (err: unknown) {
      this.error.set(this.describe(err, 'The studio voice couldn\'t be made.'));
      return;
    } finally {
      this.state.set('idle');
    }
    await this.applyChanges(voiced, `Take ${take.id} now speaks with its studio voice.`);
  }

  /** Back to the voice heard while recording. */
  async useLiveVoice(take: Take): Promise<void> {
    if (this.busy() || !take.studio) return;
    URL.revokeObjectURL(take.studio.url);
    const live: Take = { ...take, studio: null };
    this.takes.update((list) => list.map((t) => (t.id === take.id ? live : t)));
    await this.applyChanges(live, `Take ${take.id} is back to the live voice.`);
  }

  /**
   * The take's voice switches in the raw recording's own time: it started `lead` seconds
   * before the original, and its first voice covers everything up to the first switch.
   * Switches closer together than a hundredth of a second keep the later one.
   */
  private studioTimeline(take: Take): StudioVoiceSegment[] | null {
    const segments: StudioVoiceSegment[] = [];
    for (const cue of take.voices) {
      const start = segments.length ? Math.round(Math.max(0, cue.at + take.lead) * 1000) / 1000 : 0;
      const voice = cue.voice ? { ...cue.voice, enabled: true as const } : null;
      const previous = segments[segments.length - 1];
      if (previous && start <= previous.startSeconds + 0.01) previous.voice = voice;
      else segments.push({ startSeconds: start, voice });
    }
    return segments.length <= STUDIO_MAX_SWITCHES ? segments : null;
  }

  /**
   * Rebuilds the selected take's mix with the current layout, sync and volumes, from the raw
   * camera take and the original. Plays both in step and records the result, so it takes as
   * long as the take; nothing has to be filmed again.
   */
  async applyChanges(target?: Take, doneMessage?: string): Promise<void> {
    const take = target ?? this.selected();
    if (!take || this.busy() || take.sourceKey !== this.sourceKeyNow() || !this.sourceUrl || !this.format) return;
    this.sourceVideo?.pause();
    this.state.set('rendering');
    this.renderProgress.set(0);
    this.error.set(null);

    const s = this.settings();
    const syncMs = this.syncMs();
    const mixer = new CollabMixer(false);
    const source = this.makeVideo(this.sourceUrl);
    const camera = this.makeVideo(take.studio?.url ?? take.rawUrl);
    let recorder: MediaRecorder | null = null;
    let canvasTrack: MediaStreamTrack | null = null;

    try {
      mixer.setSource(source);
      mixer.setVoice(camera);
      mixer.apply(this.levels());
      mixer.setVoiceOn(voiceHeard(s, 'source'));
      await mixer.init();
      // A studio-voiced take already speaks as its characters.
      mixer.setCharacterVoice(take.studio ? null : take.voices[0]?.voice ?? null);
      void mixer.resume();
      await Promise.all([once(source, 'loadeddata'), once(camera, 'loadeddata')]);

      // The take's time when the original reached its start, corrected for how late it was heard.
      const offset = take.lead + take.latency + syncMs / 1000;
      const startAt = Math.max(0, offset);
      const sourceIn = take.sourceIn + Math.max(0, -offset);
      source.currentTime = sourceIn;
      await once(source, 'seeked');

      const chunks: Blob[] = [];
      canvasTrack = this.canvasRef()!.nativeElement.captureStream(FPS).getVideoTracks()[0];
      recorder = new MediaRecorder(new MediaStream([canvasTrack, ...mixer.stream.getAudioTracks()]), {
        mimeType: this.format,
        videoBitsPerSecond: s.quality === 1080 ? 10_000_000 : 6_000_000,
      });
      recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      const activeRecorder = recorder;

      const done = new Promise<void>((resolve, reject) => {
        let started = false;
        const job = {
          take, source, camera, mixer, startAt, sourceIn, phase: 'source' as StitchPhase,
          turn: take.turns[0], cue: take.voices[0], studio: !!take.studio,
          tick: () => {
            try {
              // Before the original starts the camera runs on its own, unrecorded, to reach its spot.
              if (!started && camera.currentTime >= startAt) {
                started = true;
                source.currentTime = sourceIn + (camera.currentTime - startAt);
                void source.play();
                activeRecorder.start(1000);
              }
              if (started) this.renderStep(job, take, s, resolve);
              this.updateMask(camera);
              this.painter!.draw({ settings: s, source, camera, mask: this.mask, phase: job.phase });
              mixer.tick();
            } catch (err) {
              reject(err);
            }
          },
        };
        camera.addEventListener('ended', () => resolve(), { once: true });
        camera.addEventListener('error', () => reject(new Error('the camera take couldn\'t be played')), { once: true });
        this.render = job;
      });
      await camera.play();
      await done;

      const stopped = once(recorder, 'stop');
      if (recorder.state !== 'inactive') recorder.stop();
      await stopped;

      const mix = new Blob(chunks, { type: this.format });
      URL.revokeObjectURL(take.mixUrl);
      const rebuilt: Take = { ...take, mix, mixUrl: URL.createObjectURL(mix), look: lookOf(s), syncMs, savedAs: null };
      this.takes.update((list) => list.map((t) => (t.id === take.id ? rebuilt : t)));
      this.notice.set(doneMessage ?? `Take ${take.id} rebuilt with your changes.`);
    } catch (err: unknown) {
      if (recorder && recorder.state !== 'inactive') recorder.stop();
      this.error.set(`The take couldn't be rebuilt: ${err instanceof Error ? err.message : 'unknown error'}.`);
    } finally {
      this.render = null;
      canvasTrack?.stop();
      for (const v of [source, camera]) {
        v.pause();
        v.removeAttribute('src');
        v.load();
      }
      await mixer.close().catch(() => undefined);
      this.renderProgress.set(0);
      this.state.set('idle');
    }
  }

  /**
   * One frame of a rebuild: replays the take's turns and voice switches at the times they
   * happened, keeps the camera take in step with the original, and finds the end.
   */
  private renderStep(job: NonNullable<typeof this.render>, take: Take, s: CollabSettings, finish: () => void): void {
    const { source, camera } = job;
    const elapsed = camera.currentTime - job.startAt;

    const cue = cueAt(take.voices, elapsed);
    if (cue && cue !== job.cue && !job.studio) {
      job.cue = cue;
      job.mixer.setCharacterVoice(cue.voice);
    }

    const turn = cueAt(take.turns, elapsed);
    if (turn !== job.turn) {
      job.turn = turn;
      job.phase = turn.phase;
      job.mixer.setVoiceOn(voiceHeard(s, turn.phase));
      camera.playbackRate = 1;
      if (turn.phase === 'you') {
        source.pause();
      } else {
        source.currentTime = turn.sourceTime + Math.max(0, elapsed - turn.at);
        void source.play();
      }
    }

    if (job.phase === 'source') {
      const atEnd = source.ended || source.currentTime >= take.sourceOut - 0.02;
      if (atEnd) {
        if (!takesTurns(s.layout)) {
          finish();
          return;
        }
        // The original is over: the rest is yours (also when the take was recorded in another layout).
        source.pause();
        camera.playbackRate = 1;
        job.phase = 'you';
        job.mixer.setVoiceOn(voiceHeard(s, 'you'));
      } else if (!source.paused && !source.seeking) {
        // Nudges the take's speed rather than seeking: a browser recording often can't seek.
        const expected = job.startAt + job.turn.at + (source.currentTime - job.turn.sourceTime);
        const drift = camera.currentTime - expected;
        camera.playbackRate = Math.abs(drift) < 0.03 ? 1 : Math.min(1.1, Math.max(0.9, 1 - drift));
      }
    }

    // The rebuild is as long as the take was, however much camera footage follows it.
    const total = Math.max(1, take.seconds);
    const done = Math.max(0, elapsed);
    if (done >= take.seconds) {
      finish();
      return;
    }
    if (this.frameIndex % 6 === 0) this.renderProgress.set(Math.min(1, done / total));
  }

  download(take: Take): void {
    const a = document.createElement('a');
    a.href = take.mixUrl;
    a.download = this.fileName(take);
    a.click();
  }

  async saveToProject(take: Take): Promise<void> {
    if (!this.projectId || this.busy()) return;
    if (!take.mimeType.startsWith('video/mp4')) {
      this.error.set('Only MP4 takes can be saved to a project, and this browser records WebM. Download it instead, or use Chrome or Edge.');
      return;
    }
    this.state.set('saving');
    this.error.set(null);
    try {
      const name = this.fileName(take);
      await firstValueFrom(this.api.uploadAsset(this.projectId, new File([take.mix], name, { type: 'video/mp4' })));
      this.takes.update((list) => list.map((t) => (t.id === take.id ? { ...t, savedAs: name } : t)));
      this.notice.set(`Saved to the project as ${name}. It's ready in the video editor.`);
      if (this.sourceTab() === 'project') void this.loadProjectVideos();
    } catch (err: unknown) {
      this.error.set(this.describe(err, 'Couldn\'t save the take to the project.'));
    } finally {
      this.state.set('idle');
    }
  }

  private fileName(take: Take): string {
    const extension = take.mimeType.startsWith('video/mp4') ? 'mp4' : 'webm';
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    return `collab-${this.settings().layout}-take${take.id}-${stamp}.${extension}`;
  }

  // ------------------------------------------------------------------ dragging on the preview

  onPointerDown(event: PointerEvent): void {
    if (this.state() === 'rendering' || !this.painter) return;
    const s = this.settings();
    const p = this.toFrame(event);
    if (!p) return;

    const spotKey = this.spotKey();
    if (spotKey) {
      const r = this.painter.lastCamera;
      if (!r || p.x < r.x || p.x > r.x + r.w || p.y < r.y || p.y > r.y + r.h) return;
      const spot = s[spotKey];
      this.drag = { kind: 'spot', pointerId: event.pointerId, dx: spot.x - p.nx, dy: spot.y - p.ny };
    } else if (s.layout === 'side' || s.layout === 'stack') {
      const along = s.layout === 'side' ? p.nx : p.ny;
      if (Math.abs(along - s.split) > 0.04) return;
      this.drag = { kind: 'split', pointerId: event.pointerId, dx: 0, dy: 0 };
    } else {
      return;
    }
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
    event.preventDefault();
  }

  onPointerMove(event: PointerEvent): void {
    const drag = this.drag;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const p = this.toFrame(event);
    if (!p) return;
    const s = this.settings();
    if (drag.kind === 'split') {
      this.patch({ split: s.layout === 'side' ? p.nx : p.ny });
    } else {
      const spotKey = this.spotKey();
      if (spotKey) this.patchSpot(spotKey, { x: p.nx + drag.dx, y: p.ny + drag.dy });
    }
  }

  onPointerUp(event: PointerEvent): void {
    if (this.drag?.pointerId === event.pointerId) this.drag = null;
  }

  /** The mouse wheel over the bubble (or you, on the green screen) resizes it. */
  onWheel(event: WheelEvent): void {
    const spotKey = this.spotKey();
    if (!spotKey) return;
    event.preventDefault();
    const spot = this.settings()[spotKey];
    this.patchSpot(spotKey, { size: spot.size * (event.deltaY < 0 ? 1.06 : 1 / 1.06) });
  }

  /** Which movable spot the preview shows right now, if any (a commentary's bubble only while the original plays). */
  private spotKey(): 'react' | 'green' | null {
    const s = this.settings();
    if (s.layout === 'react' || s.layout === 'green') return s.layout;
    if (s.layout === 'commentary' && s.commentaryBubble && this.drawnPhase === 'source') return 'react';
    return null;
  }

  private toFrame(event: PointerEvent): { x: number; y: number; nx: number; ny: number } | null {
    const canvas = this.canvasRef()?.nativeElement;
    if (!canvas) return null;
    const box = canvas.getBoundingClientRect();
    if (!box.width || !box.height) return null;
    const nx = (event.clientX - box.left) / box.width;
    const ny = (event.clientY - box.top) / box.height;
    return { x: nx * canvas.width, y: ny * canvas.height, nx, ny };
  }

  // ------------------------------------------------------------------ keys

  onKey(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    if (target && /^(INPUT|SELECT|TEXTAREA|BUTTON)$/.test(target.tagName)) return;
    if (event.key === ' ' || event.key === 'r' || event.key === 'R') {
      event.preventDefault();
      this.toggleRecord();
    } else if (event.key === 'Escape') {
      this.cancelCountdown();
    } else if (event.key === 'k' || event.key === 'K') {
      this.togglePlay();
    } else if (event.key === 't' || event.key === 'T' || event.key === 'Enter') {
      if (this.state() !== 'recording') return;
      event.preventDefault();
      void this.toggleTurn();
    } else if (/^[0-9]$/.test(event.key) && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const index = Number(event.key);
      if (index === 0) this.speakAs(null);
      else if (index <= MAX_VOICE_KEYS && this.speakers()[index - 1]) this.speakAs(this.speakers()[index - 1].id);
    }
  }

  // ------------------------------------------------------------------ helpers

  formatClock(seconds: number): string {
    const total = Math.max(0, Math.floor(seconds));
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
  }

  formatSize(bytes: number): string {
    return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`;
  }

  private makeVideo(url: string): HTMLVideoElement {
    const video = document.createElement('video');
    video.src = url;
    video.playsInline = true;
    video.preload = 'auto';
    return video;
  }

  private describe(err: unknown, fallback: string): string {
    if (err instanceof ApiFailure) return err.hint ? `${err.message} ${err.hint}` : err.message;
    return fallback;
  }

  private describeMediaError(err: unknown): string {
    const name = err instanceof DOMException ? err.name : '';
    if (name === 'NotAllowedError') return 'Camera or microphone permission was refused. Allow it in the address bar, then try again.';
    if (name === 'NotFoundError' || name === 'OverconstrainedError') return 'That camera or microphone isn\'t available. Pick another one.';
    if (name === 'NotReadableError') return 'The camera is in use by another app or tab. Close it and try again.';
    return 'The camera couldn\'t be opened.';
  }

  private restore(): void {
    try {
      const saved = JSON.parse(localStorage.getItem(REMEMBER_KEY) ?? '{}') as Remembered;
      this.settings.set(sanitizeCollabSettings(saved.settings));
      this.cameraId = typeof saved.cameraId === 'string' ? saved.cameraId : '';
      this.micId = typeof saved.micId === 'string' ? saved.micId : '';
      this.projectId = typeof saved.projectId === 'string' ? saved.projectId : '';
    } catch {
      this.settings.set(defaultCollabSettings());
    }
  }

  scheduleRemember(): void {
    if (this.rememberTimer) clearTimeout(this.rememberTimer);
    this.rememberTimer = setTimeout(() => {
      try {
        const remembered: Remembered = {
          settings: this.settings(), cameraId: this.cameraId, micId: this.micId, projectId: this.projectId,
        };
        localStorage.setItem(REMEMBER_KEY, JSON.stringify(remembered));
      } catch {
        // Storage can be unavailable (private windows); the page works the same without it.
      }
    }, 400);
  }

  private async teardown(): Promise<void> {
    this.clearCountdown();
    if (this.rememberTimer) clearTimeout(this.rememberTimer);
    navigator.mediaDevices?.removeEventListener?.('devicechange', this.onDeviceChange);
    this.clock?.stop();
    const rec = this.recording;
    this.recording = null;
    if (rec) {
      for (const r of [rec.mix, rec.raw]) if (r.state !== 'inactive') r.stop();
      rec.canvasTrack.stop();
    }
    this.closeCameraMedia();
    this.detachSource();
    if (this.sourceOwned && this.sourceUrl) URL.revokeObjectURL(this.sourceUrl);
    for (const take of this.takes()) this.releaseTake(take);
    this.vision.close();
    await this.mixer?.close().catch(() => undefined);
  }
}
