import { DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, DestroyRef, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { ApiFailure } from '../../core/interceptors/api-error.interceptor';
import { BrandChannel, Character, Project } from '../../core/models/api.models';
import { SupportCardArt } from './brand-overlays';
import {
  CAMERA_ACTIVE_STATES,
  CameraStreamStatus,
  LiveStreamChannel,
  LiveStreamGoLive,
  LiveStreamKeyStatus,
  LiveStreamOrientation,
  LiveStreamQuality,
  LiveStreamSetup,
} from '../../core/models/live-stream.models';
import { ApiService } from '../../core/services/api.service';
import { LiveStreamService } from '../../core/services/live-stream.service';
import { StatusService } from '../../core/services/status.service';
import { AudioMixer } from './audio-mixer';
import { BACKLOG_WARNING, CameraUplink, RecorderFormat, UplinkStats, pickRecorderFormat } from './camera-uplink';
import { EARS, EYES, FINISHES, GLASSES, HAIRS, HATS, HEADS, MOUTHS, CharacterDesign, drawDesigned, randomDesign } from './character-designer';
import { expressionFrom, ImageCharacter } from './characters';
import { Compositor, compact } from './compositor';
import { DETECTION_STALE_MS, FaceTracker, PrivacyVerdict, TrackedFace, privacyVerdict } from './face-tracker';
import { FrameClock } from './frame-clock';
import {
  GESTURES,
  GESTURE_ACTIONS,
  GESTURE_IDS,
  GestureAction,
  GestureDetector,
  GestureEvent,
  GestureId,
  HandSignal,
  REACTIONS,
  ReactionKind,
} from './gestures';
import { MotionFrame, MotionSmoother, palmCentre } from './motion';
import { MascotAct, drawPuppetBody, lookFor, mascotSkeleton } from './puppet';
import { MAX_SAMPLES, MIN_SAMPLES, SIGN_SLOTS, SignLearner, normalizeHand } from './sign-learner';
import {
  BUILT_IN_CHARACTERS,
  CharacterRef,
  MASK_EMOJIS,
  MIN_MASK_SCALE,
  SceneId,
  StudioSettings,
  defaultSettings,
  parseYouTubeChannel,
  parseYouTubeVideo,
  qrIsLink,
  sanitizeSettings,
} from './studio-settings';
import { PersonMask, VisionEngine } from './vision-engine';

type Panel = 'identity' | 'designer' | 'motion' | 'brand' | 'voice' | 'picture' | 'overlays' | 'scenes' | 'stream' | 'health';
type KeyMode = 'channel' | 'paste';
type Sections = Omit<StudioSettings, 'version' | 'source'>;

interface Preset {
  name: string;
  settings: StudioSettings;
}

interface ProjectCharacter {
  ref: CharacterRef;
  name: string;
  thumbnail: string;
}

interface Check {
  label: string;
  ok: boolean;
  /** Blocking checks stop Go live; the others are advice. */
  blocking: boolean;
  hint?: string;
}

/** Per-viewer conveniences only: never the stream key. */
interface Remembered {
  settings?: unknown;
  cameraId?: string;
  micId?: string;
  quality?: LiveStreamQuality;
  orientation?: LiveStreamOrientation;
  keyMode?: KeyMode;
  channelId?: string;
}

const REMEMBER_KEY = 'animstudio.live.camera';
const PRESETS_KEY = 'animstudio.live.camera.presets';
/** Taught hand signs: normalised hand shapes only, never pictures, kept in this browser. */
const SIGNS_KEY = 'animstudio.live.camera.signs';
const TEACH_GET_READY_MS = 1500;
const TEACH_RECORD_MS = 3000;
const LAST_GESTURE_SHOWN_MS = 2500;
const MAX_PRESETS = 30;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const FPS = 30;
const UI_REFRESH_MS = 250;
const STATUS_POLL_MS = 3000;
const AUDIENCE_POLL_MS = 30_000;
/** Share of a frame (ms) face detection may take before it runs only every other frame, or less. */
const DETECTION_BUDGET_MS = 20;
/**
 * However slow detection is, it is started at least this often. Spacing detections by frame
 * count alone let a slow machine (slow detection and slow drawing) drift past the stale-detection
 * limit, so the privacy curtain flickered on and off between detections.
 */
const MAX_DETECTION_GAP_MS = Math.floor(DETECTION_STALE_MS / 3);

export const SCENES: { id: SceneId; label: string; icon: string; key: string }[] = [
  { id: 'camera', label: 'Live', icon: '🎥', key: '1' },
  { id: 'starting', label: 'Starting soon', icon: '⏳', key: '2' },
  { id: 'brb', label: 'Be right back', icon: '☕', key: '3' },
  { id: 'ending', label: 'Ending', icon: '👋', key: '4' },
  { id: 'privacy', label: 'Privacy', icon: '🔒', key: '5' },
];

/**
 * The camera studio: go live from a camera or a shared screen, with each person's identity
 * hidden behind a character, a blur or a block, a disguised voice, overlays (live badge,
 * people on camera, subscribers, viewers, clock, lower third, ticker) and scene cards.
 * <p>
 * Every effect is drawn in this browser before anything is recorded, so the unmasked camera
 * never leaves the presenter's machine. With face hiding on it fails closed: until the face
 * model is running and tracking, the camera is covered completely.
 */
@Component({
  selector: 'app-live-camera',
  imports: [FormsModule, DecimalPipe, RouterLink],
  templateUrl: './live-camera.component.html',
  styleUrls: ['./live-camera.component.css'],
  host: { '(document:keydown)': 'onKey($event)' },
})
export class LiveCameraComponent {
  private readonly live = inject(LiveStreamService);
  private readonly api = inject(ApiService);
  private readonly http = inject(HttpClient);
  private readonly status = inject(StatusService);

  readonly scenes = SCENES;
  readonly builtIns = BUILT_IN_CHARACTERS;
  readonly emojis = MASK_EMOJIS;
  readonly minMaskScale = MIN_MASK_SCALE;
  readonly backlogWarning = BACKLOG_WARNING;
  readonly gestureList = GESTURES;
  readonly gestureActions = GESTURE_ACTIONS;
  readonly reactions = REACTIONS;
  readonly signSlots = Array.from({ length: SIGN_SLOTS }, (_, i) => i);
  readonly minSamples = MIN_SAMPLES;
  readonly designParts = { HEADS, EYES, MOUTHS, EARS, HAIRS, HATS, GLASSES, FINISHES };

  private readonly programCanvas = viewChild<ElementRef<HTMLCanvasElement>>('program');
  private readonly designerCanvas = viewChild<ElementRef<HTMLCanvasElement>>('designerPreview');

  readonly setup = signal<LiveStreamSetup | null>(null);
  readonly settings = signal<StudioSettings>(defaultSettings());
  readonly panel = signal<Panel>('identity');
  readonly scene = signal<SceneId>('camera');
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);

  // Devices
  readonly cameras = signal<MediaDeviceInfo[]>([]);
  readonly mics = signal<MediaDeviceInfo[]>([]);
  readonly running = signal(false);
  readonly starting = signal(false);
  readonly screenShared = signal(false);
  readonly monitor = signal(false);
  cameraId = '';
  micId = '';

  // Live numbers for the page (refreshed a few times a second, not every frame)
  readonly fps = signal(0);
  readonly inferenceMs = signal(0);
  readonly faces = signal<readonly TrackedFace[]>([]);
  readonly privacy = signal<PrivacyVerdict>({ curtain: false, reason: null });
  readonly micLevel = signal(0);
  readonly visionState = signal<'idle' | 'loading' | 'ready' | 'failed'>('idle');
  readonly visionError = signal<string | null>(null);
  readonly visionDelegate = signal<string | null>(null);
  readonly personCoverage = signal<number | null>(null);
  readonly lastFaceSeenAt = signal<number | null>(null);

  // Body, hands and gestures
  readonly motionState = signal<'idle' | 'loading' | 'ready' | 'failed'>('idle');
  readonly motionError = signal<string | null>(null);
  readonly bodiesSeen = signal(0);
  /** What each tracked hand is doing right now, for the page (never drawn on the program). */
  readonly handReadout = signal<string[]>([]);
  readonly heldGestures = signal<{ icon: string; label: string; progress: number }[]>([]);
  readonly lastGesture = signal<{ icon: string; label: string; action: string; at: number } | null>(null);
  readonly signCounts = signal<number[]>(new Array<number>(SIGN_SLOTS).fill(0));
  /** The sign being taught, and whether it is recording yet or still counting down. */
  readonly teaching = signal<{ slot: number; phase: 'ready' | 'recording'; until: number } | null>(null);
  readonly qrFailed = signal(false);

  // A brand channel's support card (its uploaded QR + headline from Settings → End card)
  readonly brandChannels = signal<BrandChannel[]>([]);
  readonly supportCardState = signal<'off' | 'loading' | 'ready' | 'missing' | 'failed'>('off');
  private supportArt: SupportCardArt | null = null;

  // A video file as the source (read locally, never uploaded)
  readonly videoName = signal<string | null>(null);
  readonly videoTime = signal(0);
  readonly videoDuration = signal(0);
  readonly videoPlaying = signal(false);
  readonly videoLoop = signal(true);
  /** Playing the file once from the start while recording the result. */
  readonly processing = signal(false);
  private videoUrl: string | null = null;
  private fileVideo: HTMLVideoElement | null = null;
  private fileVideoMixer: AudioMixer | null = null;
  private supportCardKey = '';
  private supportCardUntil: number | null = null;

  // Stream
  readonly stream = signal<CameraStreamStatus | null>(null);
  readonly uplink = signal<UplinkStats | null>(null);
  readonly goingLive = signal(false);
  readonly format: RecorderFormat | null = pickRecorderFormat();
  form = {
    destination: '',
    quality: 'Hd720' as LiveStreamQuality,
    orientation: 'Landscape' as LiveStreamOrientation,
    autoReconnect: true,
    label: '',
    consent: false,
    keyMode: 'paste' as KeyMode,
    channelId: '',
  };
  /** Held only in this component's memory: never stored, sent only when going live. */
  streamKey = '';
  readonly showKey = signal(false);

  // Audience
  readonly subscribers = signal<number | null>(null);
  readonly subscribersHidden = signal(false);
  readonly channelTitle = signal<string | null>(null);
  readonly viewers = signal<number | null>(null);
  readonly audienceError = signal<string | null>(null);

  // Characters and images (local only: never uploaded)
  readonly projects = signal<Project[]>([]);
  readonly characterProject = signal('');
  readonly projectCharacters = signal<ProjectCharacter[]>([]);
  readonly loadingCharacters = signal(false);
  readonly uploadedCharacter = signal<string | null>(null);
  readonly backgroundName = signal<string | null>(null);

  // Presets and recording
  readonly presets = signal<Preset[]>([]);
  presetName = '';
  readonly recording = signal(false);
  readonly recordingSeconds = signal(0);

  readonly onAir = computed(() => {
    const s = this.stream();
    return !!s && CAMERA_ACTIVE_STATES.includes(s.state);
  });

  readonly checks = computed<Check[]>(() => this.computeChecks());
  readonly blockers = computed(() => this.checks().filter((c) => c.blocking && !c.ok));
  readonly facesVisible = computed(() => this.faces().filter((f) => f.visible).length);
  /** What the compositor draws with: a video file is shown as recorded, never mirrored like a selfie camera. */
  private readonly programSettings = computed(() => {
    const s = this.settings();
    return s.source === 'video' && s.picture.mirror ? { ...s, picture: { ...s.picture, mirror: false } } : s;
  });

  private readonly vision = new VisionEngine();
  private readonly tracker = new FaceTracker();
  private readonly smoother = new MotionSmoother();
  private readonly gestureDetector = new GestureDetector();
  private signs = new SignLearner();
  private motion: MotionFrame | null = null;
  private held: { id: GestureId; progress: number }[] = [];
  private handLabels: string[] = [];
  private designerFrame = 0;
  private previewAct: { kind: ReactionKind; started: number } | null = null;
  private compositor: Compositor | null = null;
  private mixer: AudioMixer | null = null;
  private clock: FrameClock | null = null;
  private cameraVideo: HTMLVideoElement | null = null;
  private screenVideo: HTMLVideoElement | null = null;
  private cameraMedia: MediaStream | null = null;
  private micMedia: MediaStream | null = null;
  private screenMedia: MediaStream | null = null;
  private programMedia: MediaStream | null = null;
  private activeUplink: CameraUplink | null = null;
  private localRecorder: MediaRecorder | null = null;
  private localChunks: Blob[] = [];
  private readonly characters = new Map<CharacterRef, ImageCharacter>();
  private backgroundImage: ImageBitmap | null = null;
  private lastMask: PersonMask | null = null;
  private lastDetectionAt: number | null = null;
  private lastDetectionStartedAt = -Infinity;
  private detectionCount = 0;
  private detectionFailureLogged = false;
  private liveSinceMs: number | null = null;
  private countdownEnds: number | null = null;
  private frames = 0;
  private frameIndex = 0;
  private framesSince = performance.now();
  private lastUi = 0;
  private detecting = false;
  private statusPoll: ReturnType<typeof setInterval> | null = null;
  private audiencePoll: ReturnType<typeof setInterval> | null = null;
  private recordTimer: ReturnType<typeof setInterval> | null = null;
  private rememberTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.restore();
    this.loadPresets();
    this.loadSigns();
    void this.ensureSupportCard();
    this.api.listBrandChannels().subscribe({ next: (c) => this.brandChannels.set(c), error: () => undefined });
    inject(DestroyRef).onDestroy(() => void this.teardown());
    void this.loadSetup();
    void this.listDevices();
    void this.resumeExisting();
    navigator.mediaDevices?.addEventListener?.('devicechange', () => void this.listDevices());
  }

  // ------------------------------------------------------------------ settings

  /** Changes part of one settings section, re-applies audio, and remembers the result. */
  patch<K extends keyof Sections>(section: K, change: Partial<Sections[K]>): void {
    this.settings.update((s) => sanitizeSettings({ ...s, [section]: { ...s[section], ...change } }));
    this.afterSettingsChange();
  }

  setSource(source: StudioSettings['source']): void {
    const before = this.settings().source;
    this.settings.update((s) => ({ ...s, source }));
    this.afterSettingsChange();
    if (!this.running() || before === source) return;
    void this.applySources();
    if (source === 'video') {
      this.micMedia?.getTracks().forEach((t) => t.stop());
      this.micMedia = null;
      this.mixer?.setMicrophone(null);
    } else if (before === 'video') {
      void this.openMicrophone();
    }
  }

  // ------------------------------------------------------------------ video file source

  /**
   * Chooses an existing video to run through the studio: its faces become characters, its
   * people can be cut out or replaced exactly as on camera, and "Process whole video" saves
   * the result. The file is read locally by the browser; nothing is uploaded.
   */
  pickVideo(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      this.error.set('That isn\'t a video file.');
      return;
    }

    this.cancelProcessing();
    this.detachVideoFile();
    if (this.videoUrl) URL.revokeObjectURL(this.videoUrl);
    this.videoUrl = URL.createObjectURL(file);
    this.videoName.set(file.name);
    this.videoTime.set(0);
    this.videoDuration.set(0);

    if (this.settings().source !== 'video') this.setSource('video');
    else if (this.running()) void this.applySources();
  }

  toggleVideoPlay(): void {
    const v = this.fileVideo;
    if (!v) return;
    if (v.paused) void v.play();
    else v.pause();
  }

  seekVideo(seconds: number): void {
    if (this.fileVideo && Number.isFinite(seconds)) this.fileVideo.currentTime = seconds;
  }

  setVideoLoop(loop: boolean): void {
    this.videoLoop.set(loop);
    if (this.fileVideo) this.fileVideo.loop = loop && !this.processing();
  }

  /**
   * Plays the video once from the start while recording the program - characters, masks,
   * background and overlays included - and saves it when the video ends. Runs in real time.
   */
  async processVideo(): Promise<void> {
    const v = this.fileVideo;
    if (!v || !this.running() || this.recording()) return;
    if (!this.format) {
      this.error.set('This browser can\'t record video. Use Chrome or Edge.');
      return;
    }

    v.pause();
    v.loop = false;
    v.currentTime = 0;
    await new Promise<void>((resolve) => v.addEventListener('seeked', () => resolve(), { once: true }));
    this.tracker.reset();
    this.smoother.reset();

    const base = (this.videoName() ?? 'video').replace(/\.[^.]+$/, '').replace(/[^\w.-]+/g, '-').slice(0, 60);
    this.processing.set(true);
    this.startLocalRecording(`${base}-characters`);
    v.addEventListener('ended', this.onProcessedEnd, { once: true });
    await v.play();
  }

  /** Stops processing early; what was recorded so far is still saved. */
  cancelProcessing(): void {
    if (!this.processing()) return;
    this.fileVideo?.removeEventListener('ended', this.onProcessedEnd);
    this.fileVideo?.pause();
    this.onProcessedEnd();
  }

  private readonly onProcessedEnd = () => {
    this.stopLocalRecording();
    this.processing.set(false);
    if (this.fileVideo) this.fileVideo.loop = this.videoLoop();
    this.notice.set('Processed video saved to your downloads.');
  };

  /** Builds the playing element for the chosen file - a fresh one per studio run, as an element binds to one audio context for good. */
  private attachVideoFile(): void {
    if (!this.videoUrl || !this.mixer) return;
    if (this.fileVideo && this.fileVideoMixer === this.mixer) return;

    this.detachVideoFile();
    const video = document.createElement('video');
    video.src = this.videoUrl;
    video.playsInline = true;
    video.preload = 'auto';
    video.loop = this.videoLoop();
    video.addEventListener('loadedmetadata', () => this.videoDuration.set(Number.isFinite(video.duration) ? video.duration : 0));
    video.addEventListener('play', () => this.videoPlaying.set(true));
    video.addEventListener('pause', () => this.videoPlaying.set(false));
    video.addEventListener('error', () => this.error.set('This video can\'t be played in the browser. Try an MP4 (H.264) or WebM file.'));
    this.mixer.setMediaElement(video);
    this.fileVideo = video;
    this.fileVideoMixer = this.mixer;
    this.tracker.reset();
    void video.play().catch(() => undefined);
  }

  private detachVideoFile(): void {
    if (!this.fileVideo) return;
    this.fileVideo.pause();
    if (this.fileVideoMixer === this.mixer) this.mixer?.setMediaElement(null);
    this.fileVideo.removeAttribute('src');
    this.fileVideo.load();
    if (this.cameraVideo === this.fileVideo) this.cameraVideo = null;
    this.fileVideo = null;
    this.fileVideoMixer = null;
    this.videoPlaying.set(false);
  }

  resetSettings(): void {
    if (!confirm('Put every studio setting back to its default?')) return;
    this.settings.set(defaultSettings());
    this.afterSettingsChange();
  }

  private afterSettingsChange(): void {
    const s = this.settings();
    this.mixer?.apply(s.voice);
    if (this.vision.state === 'ready') void this.vision.configure(s.identity.maxFaces, s.identity.sensitivity);
    if (s.identity.hideFaces && this.running() && this.vision.state === 'idle') void this.loadVision();
    if (this.motionWanted() && this.running() && this.motionState() === 'idle') void this.loadMotion();
    if (this.vision.motionState === 'ready') void this.vision.configureMotion(s.identity.maxFaces);
    this.ensureAudiencePolling();
    void this.ensureSupportCard();
    this.scheduleRemember();
  }

  /** Loads the chosen brand channel's card when it is switched on or the channel changes. */
  private async ensureSupportCard(force = false): Promise<void> {
    const b = this.settings().brand;
    const key = b.card ? b.cardChannel : '';
    if (!force && key === this.supportCardKey) return;
    this.supportCardKey = key;
    if (!key) {
      this.supportArt?.qr?.close();
      this.supportArt = null;
      this.supportCardState.set('off');
      return;
    }

    this.supportCardState.set('loading');
    const channel = key === 'default' ? null : key;
    try {
      const outro = await firstValueFrom(this.api.getGlobalOutro(channel));
      let qr: ImageBitmap | null = null;
      if (outro?.qrAssetId) {
        const blob = await firstValueFrom(this.http.get(`${this.api.globalOutroQrUrl(channel)}&v=${encodeURIComponent(outro.qrAssetId)}`, { responseType: 'blob' }));
        qr = await createImageBitmap(blob);
      }
      if (this.supportCardKey !== key) { qr?.close(); return; } // switched again while loading

      this.supportArt?.qr?.close();
      this.supportArt = {
        qr,
        headline: outro?.headline ?? '',
        subtext: outro?.subtext ?? '',
        headlineSecondary: outro?.headlineSecondary ?? '',
        subtextSecondary: outro?.subtextSecondary ?? '',
        background: /^#[0-9a-f]{6}$/i.test(outro?.backgroundHex ?? '') ? outro!.backgroundHex! : '#0f172a',
        text: /^#[0-9a-f]{6}$/i.test(outro?.textHex ?? '') ? outro!.textHex! : '#ffffff',
      };
      this.supportCardState.set(qr || outro?.headline ? 'ready' : 'missing');
    } catch {
      if (this.supportCardKey === key) this.supportCardState.set('failed');
    }
  }

  /** Re-reads the channel's card, after it was changed under Settings → End card. */
  reloadSupportCard(): void {
    void this.ensureSupportCard(true);
  }

  /** Puts the card up now for its usual length, whatever its schedule. */
  showSupportCardNow(): void {
    if (!this.settings().brand.card) this.patch('brand', { card: true });
    this.supportCardUntil = Date.now() + this.settings().brand.cardShowSeconds * 1000;
  }

  /** Hides faces again instantly - the one switch that is always one press away (F). */
  toggleFaces(): void {
    this.patch('identity', { hideFaces: !this.settings().identity.hideFaces });
  }

  // ------------------------------------------------------------------ devices

  async listDevices(): Promise<void> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      this.cameras.set(devices.filter((d) => d.kind === 'videoinput'));
      this.mics.set(devices.filter((d) => d.kind === 'audioinput'));
    } catch {
      // Without permission yet, the lists fill in after the first start.
    }
  }

  /** Opens the camera, microphone (and screen), starts the program and the face model. */
  async startStudio(): Promise<void> {
    if (this.running() || this.starting()) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      this.error.set('This browser can\'t open a camera. Use Chrome, Edge, Firefox or Safari over https or localhost.');
      return;
    }
    this.starting.set(true);
    this.error.set(null);
    try {
      this.mixer = new AudioMixer();
      await this.mixer.init();
      if (this.mixer.pitchUnavailable) this.notice.set('Pitch voice effects aren\'t available in this browser; Radio and the rest still work.');

      const canvas = this.programCanvas()!.nativeElement;
      this.compositor = new Compositor(canvas);
      this.sizeProgram();

      // Processing a video file uses its own soundtrack; the microphone isn't needed.
      if (this.settings().source !== 'video') await this.openMicrophone();
      await this.applySources();
      this.mixer.apply(this.settings().voice);

      this.programMedia = new MediaStream([
        ...canvas.captureStream(FPS).getVideoTracks(),
        ...this.mixer.stream.getAudioTracks(),
      ]);

      this.clock = new FrameClock(FPS, () => this.frame());
      this.clock.start();
      this.running.set(true);
      void this.listDevices();
      if (this.settings().identity.hideFaces) void this.loadVision();
      if (this.motionWanted()) void this.loadMotion();
    } catch (err: unknown) {
      this.error.set(this.describeMediaError(err));
      await this.stopStudio();
    } finally {
      this.starting.set(false);
    }
  }

  async stopStudio(): Promise<void> {
    if (this.onAir() && !confirm('You\'re live. Stopping the studio ends the stream. Continue?')) return;
    await this.endStream(false);
    this.cancelProcessing();
    this.stopLocalRecording();
    this.detachVideoFile();
    this.clock?.stop();
    this.clock = null;
    for (const media of [this.cameraMedia, this.micMedia, this.screenMedia]) media?.getTracks().forEach((t) => t.stop());
    this.cameraMedia = this.micMedia = this.screenMedia = null;
    this.programMedia?.getTracks().forEach((t) => t.stop());
    this.programMedia = null;
    this.cameraVideo = this.screenVideo = null;
    this.screenShared.set(false);
    await this.mixer?.close().catch(() => undefined);
    this.mixer = null;
    this.tracker.reset();
    this.smoother.reset();
    this.gestureDetector.reset();
    this.motion = null;
    this.teaching.set(null);
    this.running.set(false);
  }

  async switchCamera(id: string): Promise<void> {
    this.cameraId = id;
    this.scheduleRemember();
    if (this.running()) await this.applySources(true);
  }

  async switchMic(id: string): Promise<void> {
    this.micId = id;
    this.scheduleRemember();
    if (this.running()) await this.openMicrophone();
  }

  /** Re-opens the microphone with the current processing switches. */
  async openMicrophone(): Promise<void> {
    const v = this.settings().voice;
    this.micMedia?.getTracks().forEach((t) => t.stop());
    try {
      this.micMedia = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: this.micId ? { exact: this.micId } : undefined,
          noiseSuppression: v.noiseSuppression,
          echoCancellation: v.echoCancellation,
          autoGainControl: v.autoGainControl,
          channelCount: 1,
        },
      });
      this.mixer?.setMicrophone(this.micMedia);
    } catch (err: unknown) {
      this.micMedia = null;
      this.mixer?.setMicrophone(null);
      this.notice.set(`No microphone: ${this.describeMediaError(err)} The stream goes out silent.`);
    }
  }

  setMonitor(on: boolean): void {
    this.monitor.set(on);
    this.mixer?.setMonitor(on);
  }

  /** Opens or closes the camera and the screen to match the chosen source. */
  private async applySources(reopenCamera = false): Promise<void> {
    const source = this.settings().source;
    const wantCamera = source === 'camera' || source === 'screen-camera';
    const wantScreen = source === 'screen' || source === 'screen-camera';

    if (!wantCamera || reopenCamera) {
      this.cameraMedia?.getTracks().forEach((t) => t.stop());
      this.cameraMedia = null;
      this.cameraVideo = null;
    }

    // A video file stands in for the camera: the same face, body and character pipeline runs on it.
    if (source === 'video') {
      this.attachVideoFile();
      this.cameraVideo = this.fileVideo;
    } else {
      this.detachVideoFile();
    }
    if (wantCamera && !this.cameraMedia) {
      const frame = this.frameSize();
      this.cameraMedia = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: this.cameraId ? { exact: this.cameraId } : undefined,
          width: { ideal: Math.max(frame.width, frame.height) },
          height: { ideal: Math.min(frame.width, frame.height) },
          frameRate: { ideal: FPS },
        },
      });
      this.cameraVideo = await this.playable(this.cameraMedia);
      this.tracker.reset();
    }

    if (!wantScreen) {
      this.screenMedia?.getTracks().forEach((t) => t.stop());
      this.screenMedia = null;
      this.screenVideo = null;
      this.screenShared.set(false);
      this.mixer?.setScreenAudio(null);
    } else if (!this.screenMedia) {
      await this.shareScreen();
    }
  }

  async shareScreen(): Promise<void> {
    try {
      const media = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: FPS }, audio: this.settings().voice.screenAudio });
      this.screenMedia?.getTracks().forEach((t) => t.stop());
      this.screenMedia = media;
      this.screenVideo = await this.playable(media);
      this.mixer?.setScreenAudio(media);
      this.screenShared.set(true);
      // The browser's own "Stop sharing" button ends the track; fall back to the camera.
      media.getVideoTracks()[0]?.addEventListener('ended', () => {
        if (this.screenMedia !== media) return;
        this.screenMedia = null;
        this.screenVideo = null;
        this.screenShared.set(false);
        this.mixer?.setScreenAudio(null);
        if (this.settings().source === 'screen') this.notice.set('Screen sharing stopped. Share again, or switch to the camera.');
      });
    } catch {
      this.notice.set('Screen sharing was cancelled.');
    }
  }

  private async playable(media: MediaStream): Promise<HTMLVideoElement> {
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.srcObject = media;
    await video.play();
    return video;
  }

  // ------------------------------------------------------------------ vision

  async loadVision(): Promise<void> {
    this.visionState.set('loading');
    try {
      await this.vision.load();
      const identity = this.settings().identity;
      await this.vision.configure(identity.maxFaces, identity.sensitivity);
      this.visionState.set('ready');
      this.visionDelegate.set(this.vision.delegate);
      this.visionError.set(null);
    } catch {
      this.visionState.set('failed');
      this.visionError.set(this.vision.error);
    }
  }

  retryVision(): void {
    this.vision.close();
    this.motionState.set('idle');
    void this.loadVision().then(() => (this.motionWanted() ? this.loadMotion() : undefined));
  }

  /** Whether anything on now needs the body and hand models. */
  motionWanted(): boolean {
    const s = this.settings();
    return s.avatar.body !== 'off'
      || (s.gestures.enabled && s.gestures.hands)
      || (s.brand.mascot && s.brand.mascotMode === 'mirror')
      || this.teaching() !== null;
  }

  async loadMotion(): Promise<void> {
    if (this.vision.state !== 'ready') await this.loadVision();
    if (this.vision.state !== 'ready') return;
    this.motionState.set('loading');
    try {
      await this.vision.loadMotion();
      await this.vision.configureMotion(this.settings().identity.maxFaces);
      this.motionState.set('ready');
      this.motionError.set(null);
    } catch {
      this.motionState.set('failed');
      this.motionError.set(this.vision.motionError);
    }
  }

  // ------------------------------------------------------------------ the frame loop

  private frame(): void {
    if (!this.compositor) return;
    const now = performance.now();
    const s = this.settings();
    const identity = s.identity;
    const cameraUsed = s.source !== 'screen' && !!this.cameraVideo;

    // On a slow machine, detection runs less often than drawing: the picture stays smooth with
    // the latest faces. The gap is measured in time, not frames, and capped well inside the
    // stale-detection limit, so slow drawing can't push a detection late enough to close the curtain.
    this.frameIndex++;
    const gap = Math.min(MAX_DETECTION_GAP_MS, (this.inferenceMs() / DETECTION_BUDGET_MS) * (1000 / FPS));
    const dueForDetection = now - this.lastDetectionStartedAt >= gap;
    const wantMotion = this.motionWanted() && this.vision.motionState === 'ready';
    const facesUsed = identity.hideFaces || s.overlays.peopleCount || s.overlays.faceLabels || s.picture.autoFrame
      || s.gestures.enabled || s.avatar.body !== 'off' || s.brand.mascot;
    if (cameraUsed && dueForDetection && this.vision.state === 'ready' && !this.detecting && (facesUsed || wantMotion)) {
      // Segmentation costs as much again as faces, so it only runs when something uses it.
      const needMask = s.avatar.body !== 'replace'
        && (identity.background !== 'none' || identity.bodyStyle !== 'none' || (identity.hideFaces && identity.strictMode));
      // Faces (which privacy depends on) run every time; when detection is slow, the body and
      // hand models run every other time, so no single frame carries all four models.
      const motionNow = wantMotion && (this.inferenceMs() <= DETECTION_BUDGET_MS * 2 || this.detectionCount % 2 === 0);
      this.detecting = true;
      this.lastDetectionStartedAt = now;
      this.detectionCount++;
      try {
        const result = this.vision.detect(this.cameraVideo!, { mask: needMask || (identity.hideFaces && identity.strictMode), motion: motionNow });
        if (result) {
          this.lastDetectionAt = now;
          this.lastMask = result.mask;
          this.tracker.update(result.faces, now, identity.holdMs);
          if (result.faces.length > 0) this.lastFaceSeenAt.set(Date.now());
          this.inferenceMs.update((v) => v * 0.9 + result.inferenceMs * 0.1);
          if (result.motion) this.motion = this.smoother.update(result.motion, now);
          else if (!wantMotion) this.motion = null;
          if ((s.gestures.enabled || this.teaching()) && (result.motion || !wantMotion)) this.processGestures(now);
        }
      } catch (err) {
        // A failed frame is treated as no detection: the privacy rules cover the camera.
        this.lastMask = null;
        if (!this.detectionFailureLogged) {
          this.detectionFailureLogged = true;
          console.warn('Face detection failed on a frame; the camera stays covered until it recovers.', err);
        }
      } finally {
        this.detecting = false;
      }
    }
    if (!cameraUsed) {
      this.lastMask = null;
      this.motion = null;
    }

    const faces = this.tracker.tracked;
    const verdict = cameraUsed
      ? privacyVerdict({
          protecting: identity.hideFaces,
          strict: identity.strictMode,
          modelReady: this.vision.state === 'ready',
          lastDetectionAt: this.lastDetectionAt,
          now,
          visibleFaces: faces.filter((f) => f.visible).length,
          heldFaces: faces.filter((f) => !f.visible).length,
          personCoverage: this.lastMask?.coverage ?? null,
        })
      : { curtain: false, reason: null };

    this.compositor.render({
      settings: this.programSettings(),
      scene: this.scene(),
      camera: cameraUsed ? this.cameraVideo : null,
      screen: this.screenVideo,
      faces: facesUsed ? faces : [],
      mask: this.lastMask,
      motion: this.motion,
      privacy: verdict,
      characters: this.characters,
      backgroundImage: this.backgroundImage,
      onAir: this.onAir() && this.stream()?.state === 'Live',
      liveSince: this.liveSinceMs,
      subscribers: this.subscribers(),
      subscribersHidden: this.subscribersHidden(),
      viewers: this.viewers(),
      countdownEnds: this.countdownEnds,
      supportCard: this.supportArt,
      supportCardUntil: this.supportCardUntil,
      now: Date.now(),
    });

    this.frames++;
    if (now - this.lastUi >= UI_REFRESH_MS) {
      this.lastUi = now;
      const elapsed = now - this.framesSince;
      if (elapsed >= 1000) {
        this.fps.set(Math.round((this.frames * 1000) / elapsed));
        this.frames = 0;
        this.framesSince = now;
      }
      this.faces.set([...faces]);
      this.privacy.set(verdict);
      this.personCoverage.set(this.lastMask?.coverage ?? null);
      this.micLevel.set(this.mixer?.level() ?? 0);
      if (this.vision.state !== this.visionState() && this.vision.state !== 'idle') this.visionState.set(this.vision.state);
      this.bodiesSeen.set(this.motion?.bodies.length ?? 0);
      this.handReadout.set(this.handLabels);
      this.heldGestures.set(this.held.map((h) => ({ ...this.gestureInfo(h.id), progress: h.progress })));
      this.qrFailed.set(this.compositor.qrFailed);
      if (this.fileVideo) this.videoTime.set(this.fileVideo.currentTime);
      this.advanceTeaching(now);
    }
  }

  // ------------------------------------------------------------------ gestures

  /** Reads hands and the main face, teaches or recognises signs, and runs whatever the gestures are bound to. */
  private processGestures(now: number): void {
    const s = this.settings();
    const video = this.cameraVideo;
    if (!video?.videoWidth) return;
    const aspect = video.videoWidth / video.videoHeight;
    const teaching = this.teaching();

    const hands: HandSignal[] = (this.motion?.hands ?? []).map((hand, i) => {
      const shape = normalizeHand(hand.points, aspect, hand.side === 'Left');
      if (shape && i === 0 && teaching?.phase === 'recording' && this.frameIndex % 2 === 0) this.signs.add(teaching.slot, shape);
      const match = shape && !teaching ? this.signs.classify(shape) : null;
      const palm = palmCentre(hand);
      return { gesture: hand.gesture, score: hand.score, x: palm.x, y: palm.y, sign: match ? (`sign-${match.slot + 1}` as GestureId) : null };
    });
    this.handLabels = hands.map((h) => {
      const id = h.sign ?? (h.score >= 0.6 && h.gesture !== 'None' ? h.gesture : null);
      return id ? `${this.gestureInfo(id as GestureId).icon} ${this.gestureInfo(id as GestureId).label}` : '🖐️ hand';
    });
    if (teaching) {
      this.held = [];
      return;
    }

    const person = this.tracker.tracked.filter((f) => f.visible).sort((a, b) => b.w * b.h - a.w * a.h)[0];
    const bindings = s.gestures.bindings;
    const reading = this.gestureDetector.update(
      { now, hands, face: person ?? null },
      {
        holdMs: s.gestures.holdMs,
        cooldownMs: s.gestures.cooldownMs,
        hand: s.gestures.hands,
        face: s.gestures.face,
        armed: new Set(GESTURE_IDS.filter((id) => bindings[id] !== 'none' && (!id.startsWith('sign-') || this.signs.ready(+id.slice(5) - 1)))),
      },
    );
    this.held = reading.held;
    for (const event of reading.events) this.runGesture(event);
  }

  gestureInfo(id: GestureId): { icon: string; label: string } {
    const g = GESTURES.find((x) => x.id === id);
    if (!g) return { icon: '✋', label: id };
    if (g.kind === 'sign') return { icon: g.icon, label: this.settings().gestures.signNames[+id.slice(5) - 1] ?? g.label };
    return { icon: g.icon, label: g.label };
  }

  actionLabel(action: GestureAction): string {
    return GESTURE_ACTIONS.find((a) => a.id === action)?.label ?? action;
  }

  /**
   * Does what a gesture is bound to. Gestures can only make the stream safer or add decoration:
   * they can turn the privacy card and mute on, but never off, and never show a face.
   */
  private runGesture(event: GestureEvent): void {
    const s = this.settings();
    const action = s.gestures.bindings[event.id];
    switch (action) {
      case 'none':
        return;
      case 'scene-brb':
        if (this.scene() === 'privacy') return;
        this.setScene(this.scene() === 'brb' ? 'camera' : 'brb');
        break;
      case 'scene-camera':
        if (this.scene() === 'privacy') return;
        this.setScene('camera');
        break;
      case 'privacy':
        this.setScene('privacy');
        break;
      case 'mute':
        this.patch('voice', { muted: true });
        break;
      case 'snapshot':
        this.snapshot();
        break;
      case 'next-character':
        this.nextCharacter();
        break;
      case 'toggle-qr':
        this.patch('brand', { qr: !s.brand.qr });
        break;
      case 'toggle-seal':
        this.patch('brand', { seal: !s.brand.seal });
        break;
      default:
        this.compositor?.react(action.slice('react-'.length) as ReactionKind, event.x, event.y, s.brand.mascot && s.brand.mascotReacts);
    }
    this.lastGesture.set({ ...this.gestureInfo(event.id), action: this.actionLabel(action), at: Date.now() });
    setTimeout(() => {
      if (Date.now() - (this.lastGesture()?.at ?? 0) >= LAST_GESTURE_SHOWN_MS) this.lastGesture.set(null);
    }, LAST_GESTURE_SHOWN_MS);
  }

  /** A reaction from a button rather than a gesture - also handy for trying the mascot. */
  react(kind: ReactionKind): void {
    const s = this.settings();
    this.compositor?.react(kind, null, null, s.brand.mascot && s.brand.mascotReacts);
    this.previewAct = { kind, started: performance.now() };
  }

  setBinding(id: GestureId, action: GestureAction): void {
    this.patch('gestures', { bindings: { ...this.settings().gestures.bindings, [id]: action } });
  }

  setSignName(slot: number, name: string): void {
    const names = [...this.settings().gestures.signNames];
    names[slot] = name;
    this.patch('gestures', { signNames: names });
  }

  private nextCharacter(): void {
    const order: CharacterRef[] = ['custom', ...this.builtIns.map((c) => c.id), ...this.projectCharacters().map((c) => c.ref)];
    if (this.uploadedCharacter()) order.push('upload');
    const at = order.indexOf(this.settings().identity.character);
    this.patch('identity', { character: order[(at + 1) % order.length] });
  }

  // ------------------------------------------------------------------ teaching signs

  /** Teaches a sign: a short countdown to get into position, then a few seconds of examples. */
  teachSign(slot: number): void {
    if (!this.running()) {
      this.notice.set('Start the studio first, then hold the sign up to the camera.');
      return;
    }
    this.signs.clear(slot);
    this.signCounts.set(this.signSlots.map((i) => this.signs.count(i)));
    this.teaching.set({ slot, phase: 'ready', until: performance.now() + TEACH_GET_READY_MS });
    if (this.motionState() === 'idle') void this.loadMotion();
  }

  forgetSign(slot: number): void {
    this.signs.clear(slot);
    this.storeSigns();
  }

  private advanceTeaching(now: number): void {
    const teaching = this.teaching();
    if (!teaching) return;
    this.signCounts.set(this.signSlots.map((i) => this.signs.count(i)));
    if (now < teaching.until) return;
    if (teaching.phase === 'ready') {
      this.teaching.set({ ...teaching, phase: 'recording', until: now + TEACH_RECORD_MS });
      return;
    }
    this.teaching.set(null);
    this.gestureDetector.reset();
    this.storeSigns();
    const learned = this.signs.count(teaching.slot);
    if (learned < MIN_SAMPLES) {
      this.notice.set('No hand was seen clearly enough. Hold the sign in front of the camera, in good light, and try again.');
    } else {
      this.status.notify([`Learned "${this.settings().gestures.signNames[teaching.slot]}" from ${learned} examples`]);
      if (this.settings().gestures.bindings[`sign-${teaching.slot + 1}` as GestureId] === 'none') {
        this.setBinding(`sign-${teaching.slot + 1}` as GestureId, 'react-stars');
      }
    }
  }

  teachingSecondsLeft(): number {
    const t = this.teaching();
    return t ? Math.max(0, Math.ceil((t.until - performance.now()) / 1000)) : 0;
  }

  readonly maxSamples = MAX_SAMPLES;

  private loadSigns(): void {
    try {
      this.signs = SignLearner.from(JSON.parse(localStorage.getItem(SIGNS_KEY) ?? '[]'));
    } catch {
      this.signs = new SignLearner();
    }
    this.signCounts.set(this.signSlots.map((i) => this.signs.count(i)));
  }

  private storeSigns(): void {
    this.signCounts.set(this.signSlots.map((i) => this.signs.count(i)));
    try {
      localStorage.setItem(SIGNS_KEY, JSON.stringify(this.signs.export()));
    } catch {
      this.notice.set('This browser wouldn\'t save your taught signs; they last until you leave the page.');
    }
  }

  // ------------------------------------------------------------------ character designer

  openPanel(panel: Panel): void {
    this.panel.set(panel);
    if (panel === 'identity' || panel === 'brand') void this.loadProjects();
    if (panel === 'designer') this.startDesignerPreview();
  }

  design<K extends keyof CharacterDesign>(key: K, value: CharacterDesign[K]): void {
    this.patch('designer', { [key]: value } as Partial<CharacterDesign>);
  }

  surpriseDesign(): void {
    this.patch('designer', { ...randomDesign(), name: this.settings().designer.name });
  }

  wearDesign(): void {
    this.patch('identity', { character: 'custom', faceStyle: 'character', characterPerPerson: false });
    this.status.notify([`Wearing "${this.settings().designer.name}"`]);
  }

  qrIsLink(text: string): boolean {
    return qrIsLink(text);
  }

  /** Animates the designer's preview while that tab is open: idling, copying your face when the studio runs, and acting out reactions. */
  private startDesignerPreview(): void {
    cancelAnimationFrame(this.designerFrame);
    const draw = () => {
      const canvas = this.designerCanvas()?.nativeElement;
      if (this.panel() !== 'designer') return;
      if (canvas) this.drawDesignerPreview(canvas);
      this.designerFrame = requestAnimationFrame(draw);
    };
    this.designerFrame = requestAnimationFrame(draw);
  }

  private drawDesignerPreview(canvas: HTMLCanvasElement): void {
    const c = canvas.getContext('2d');
    if (!c) return;
    const W = canvas.width;
    const H = canvas.height;
    const now = performance.now();
    const s = this.settings();

    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#1a2142');
    g.addColorStop(1, '#0b0e17');
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
    c.fillStyle = 'rgba(255,255,255,.06)';
    c.fillRect(0, H * 0.9, W, H * 0.1);

    let act: MascotAct | null = null;
    if (this.previewAct) {
      const progress = (now - this.previewAct.started) / 1700;
      if (progress >= 1) this.previewAct = null;
      else act = { kind: this.previewAct.kind, progress };
    }
    const box = { x: W * 0.2, y: H * 0.06, w: W * 0.6, h: H * 0.88 };
    const { skeleton, face } = mascotSkeleton(box, now / 1000, act);
    const you = this.running() ? this.tracker.tracked.find((f) => f.visible) : undefined;

    drawPuppetBody(c, skeleton, lookFor('custom', s.designer, s.overlays.accent));
    c.save();
    c.translate(skeleton.head.x, skeleton.head.y);
    if (you) c.rotate(s.picture.mirror ? -you.roll : you.roll);
    drawDesigned(c, s.designer, skeleton.head.r, you ? expressionFrom(you, s.picture.mirror) : {
      mouthOpen: face.mouthOpen,
      blinkLeft: face.blink,
      blinkRight: face.blink,
      smile: face.smile,
      browUp: act?.kind === 'wow' ? 0.9 : 0,
    });
    c.restore();
  }

  private frameSize(): { width: number; height: number } {
    const long = this.form.quality === 'Hd1080' ? 1920 : 1280;
    const short = this.form.quality === 'Hd1080' ? 1080 : 720;
    return this.form.orientation === 'Portrait' ? { width: short, height: long } : { width: long, height: short };
  }

  sizeProgram(): void {
    if (this.onAir()) return;
    const { width, height } = this.frameSize();
    this.compositor?.resize(width, height);
    this.scheduleRemember();
  }

  // ------------------------------------------------------------------ scenes

  setScene(scene: SceneId): void {
    this.scene.set(scene);
    if (scene === 'starting') {
      const minutes = this.settings().scenes.countdownMinutes;
      this.countdownEnds = minutes > 0 ? Date.now() + minutes * 60_000 : null;
    }
  }

  /** Hotkeys: 1-5 scenes, P privacy, F faces, M mute, G gestures. Ignored while typing. */
  onKey(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    if (!this.running() || event.ctrlKey || event.metaKey || event.altKey) return;
    if (target && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))) return;

    const scene = SCENES.find((s) => s.key === event.key);
    if (scene) {
      this.setScene(scene.id);
      event.preventDefault();
      return;
    }
    switch (event.key.toLowerCase()) {
      case 'p':
        this.setScene(this.scene() === 'privacy' ? 'camera' : 'privacy');
        break;
      case 'f':
        this.toggleFaces();
        break;
      case 'm':
        this.patch('voice', { muted: !this.settings().voice.muted });
        break;
      case 'g':
        this.patch('gestures', { enabled: !this.settings().gestures.enabled });
        break;
      default:
        return;
    }
    event.preventDefault();
  }

  // ------------------------------------------------------------------ going live

  private computeChecks(): Check[] {
    const s = this.settings();
    const setup = this.setup();
    const checks: Check[] = [
      { label: 'Studio running', ok: this.running(), blocking: true, hint: 'Press "Start studio" first.' },
      { label: 'Camera streaming allowed on this server', ok: !!setup?.cameraEnabled, blocking: true, hint: 'An admin can enable LiveStream:Camera:Enabled.' },
      { label: 'This browser can record the stream', ok: !!this.format, blocking: true, hint: 'Use a current Chrome, Edge, Firefox or Safari.' },
      { label: 'Destination chosen', ok: !!this.form.destination, blocking: true },
      { label: 'Stream key ready', ok: !this.keyMissing(), blocking: true, hint: this.keyMissing() ?? undefined },
      { label: 'Everyone on camera agreed to be broadcast', ok: this.form.consent, blocking: true },
    ];
    if (s.identity.hideFaces && s.source !== 'screen') {
      checks.push({
        label: 'Face tracking running',
        ok: this.visionState() === 'ready',
        blocking: true,
        hint: this.visionError() ?? 'Faces must be tracked before going live with face hiding on.',
      });
      checks.push({
        label: 'A face was found and masked',
        ok: this.lastFaceSeenAt() !== null,
        blocking: false,
        hint: 'Sit in front of the camera and check the preview shows your character.',
      });
    }
    if (s.source === 'screen' || s.source === 'screen-camera') {
      checks.push({ label: 'Screen shared', ok: this.screenShared(), blocking: s.source === 'screen', hint: 'Press "Share screen".' });
    }
    if (s.source === 'video') {
      checks.push({ label: 'Video file chosen', ok: !!this.videoName(), blocking: true, hint: 'Press "Choose video" under Source.' });
    }
    if (s.overlays.subscribers || s.overlays.viewers) {
      checks.push({
        label: 'Subscriber / viewer numbers available',
        ok: !!setup?.audienceStatsEnabled && !this.audienceError(),
        blocking: false,
        hint: this.audienceError() ?? 'Ask an admin to set YouTube:ApiKey on the server.',
      });
    }
    if (this.motionWanted() && s.source !== 'screen') {
      checks.push({
        label: 'Body & hand tracking running',
        ok: this.motionState() === 'ready',
        blocking: false,
        hint: this.motionError() ?? 'The body puppet and gestures start once it has loaded.',
      });
    }
    if (s.brand.qr) {
      checks.push({ label: 'QR code fits', ok: !!s.brand.qrText && !this.qrFailed(), blocking: false, hint: 'Enter a link or text short enough for a QR code.' });
    }
    if (s.source !== 'video') {
      checks.push({ label: 'Microphone connected', ok: !!this.micMedia || s.voice.muted, blocking: false, hint: 'The stream will go out silent.' });
    }
    return checks;
  }

  keyMissing(): string | null {
    if (this.form.keyMode === 'paste') return this.streamKey.trim() ? null : 'Paste the stream key from YouTube Studio.';
    if (!this.form.channelId) return 'Choose a channel.';
    return this.keyStatus(this.selectedChannel())?.state === 'Saved' ? null : 'That channel has no usable saved key.';
  }

  selectedChannel(): LiveStreamChannel | undefined {
    return this.setup()?.channels.find((c) => c.id === this.form.channelId);
  }

  keyStatus(channel: LiveStreamChannel | undefined): LiveStreamKeyStatus | undefined {
    return channel?.keys.find((k) => k.destinationId === this.form.destination);
  }

  keyHelpUrl(): string | null {
    return this.setup()?.destinations.find((d) => d.id === this.form.destination)?.keyHelpUrl ?? null;
  }

  async goLive(): Promise<void> {
    if (this.blockers().length > 0 || this.goingLive() || this.onAir() || !this.programMedia || !this.format) return;
    this.goingLive.set(true);
    this.error.set(null);
    this.scheduleRemember();
    try {
      const target: LiveStreamGoLive = this.form.keyMode === 'channel'
        ? { channelId: this.form.channelId }
        : { streamKey: this.streamKey.trim() };
      const status = await firstValueFrom(this.live.startCamera({
        destination: this.form.destination,
        orientation: this.form.orientation,
        quality: this.form.quality,
        container: this.format.container,
        autoReconnect: this.form.autoReconnect,
        label: this.form.label.trim() || undefined,
        rightsConfirmed: this.form.consent,
      }, target));
      this.stream.set(status);

      // Record well above the stream bitrate: the server re-encodes, so what it receives should be clean.
      const kbps = this.form.quality === 'Hd1080' ? 6000 : 3000;
      this.activeUplink = new CameraUplink(this.live, status.id, this.programMedia, this.format, kbps * 1000 * 1.6, {
        status: (s) => this.onStatus(s),
        stats: (s) => this.uplink.set(s),
        ended: (message) => {
          this.error.set(message);
          void this.refreshStream();
        },
      });
      this.activeUplink.start(status.generation);
      this.startStatusPolling();
      this.status.notify([`Going live: ${status.label}`]);
    } catch (err: unknown) {
      this.error.set(err instanceof ApiFailure ? `${err.message}${err.hint ? ' ' + err.hint : ''}` : 'The stream could not be started.');
    } finally {
      this.goingLive.set(false);
    }
  }

  async endStream(ask = true): Promise<void> {
    const current = this.stream();
    if (!current || !CAMERA_ACTIVE_STATES.includes(current.state)) return;
    if (ask && !confirm('End the live stream? Viewers will see it end.')) return;
    this.activeUplink?.stop();
    this.activeUplink = null;
    try {
      this.stream.set(await firstValueFrom(this.live.stopCamera(current.id)));
    } catch {
      // The server ends a stream that stops receiving on its own.
    }
    this.liveSinceMs = null;
    this.stopStatusPolling();
  }

  private onStatus(status: CameraStreamStatus): void {
    this.stream.set(status);
    if (status.liveSince && !this.liveSinceMs) this.liveSinceMs = Date.parse(status.liveSince);
    if (!CAMERA_ACTIVE_STATES.includes(status.state)) {
      this.activeUplink?.stop();
      this.activeUplink = null;
      this.stopStatusPolling();
      if (status.state === 'Failed' && status.message) this.error.set(status.message);
      if (status.keyNeedsAttention) void this.loadSetup();
    }
  }

  private async refreshStream(): Promise<void> {
    const current = this.stream();
    if (!current) return;
    try {
      this.onStatus(await firstValueFrom(this.live.cameraStream(current.id)));
    } catch {
      // The next poll tries again.
    }
  }

  private startStatusPolling(): void {
    this.stopStatusPolling();
    this.statusPoll = setInterval(() => void this.refreshStream(), STATUS_POLL_MS);
  }

  private stopStatusPolling(): void {
    if (this.statusPoll) clearInterval(this.statusPoll);
    this.statusPoll = null;
  }

  /** A stream still running on the server from before a reload is shown, so it can be ended. */
  private async resumeExisting(): Promise<void> {
    try {
      const list = await firstValueFrom(this.live.cameraStreams());
      const active = list.find((s) => CAMERA_ACTIVE_STATES.includes(s.state));
      if (active) {
        this.stream.set(active);
        this.notice.set('A camera stream from before is still open on the server. It ends by itself shortly, or end it now.');
      }
    } catch {
      // Nothing to resume.
    }
  }

  stateLabel(): string {
    switch (this.stream()?.state) {
      case 'Connecting': return 'Connecting…';
      case 'Live': return '● LIVE';
      case 'Reconnecting': return 'Reconnecting…';
      case 'Ended': return 'Ended';
      case 'Stopped': return 'Stopped';
      case 'Failed': return 'Failed';
      default: return 'Off air';
    }
  }

  // ------------------------------------------------------------------ audience

  channelRef(): string | null {
    return parseYouTubeChannel(this.settings().overlays.youtubeChannel);
  }

  videoRef(): string | null {
    return parseYouTubeVideo(this.settings().overlays.youtubeVideo);
  }

  private ensureAudiencePolling(): void {
    const o = this.settings().overlays;
    const wanted = !!this.setup()?.audienceStatsEnabled
      && ((o.subscribers && !!this.channelRef()) || (o.viewers && !!this.videoRef()));
    if (wanted && !this.audiencePoll) {
      void this.refreshAudience();
      this.audiencePoll = setInterval(() => void this.refreshAudience(), AUDIENCE_POLL_MS);
    } else if (!wanted && this.audiencePoll) {
      clearInterval(this.audiencePoll);
      this.audiencePoll = null;
    }
  }

  async refreshAudience(): Promise<void> {
    const o = this.settings().overlays;
    const channel = o.subscribers ? this.channelRef() ?? undefined : undefined;
    const video = o.viewers ? this.videoRef() ?? undefined : undefined;
    if (!channel && !video) return;
    try {
      const stats = await firstValueFrom(this.live.audience(channel, video));
      this.subscribers.set(stats.channel?.subscriberCount ?? null);
      this.subscribersHidden.set(!!stats.channel?.subscribersHidden);
      this.channelTitle.set(stats.channel?.title ?? null);
      this.viewers.set(stats.live?.concurrentViewers ?? null);
      this.audienceError.set(channel && !stats.channel ? 'YouTube has no channel with that id or handle.' : null);
    } catch (err: unknown) {
      this.audienceError.set(err instanceof ApiFailure ? err.message : 'Couldn\'t load live numbers.');
    }
  }

  compact(value: number): string {
    return compact(value);
  }

  // ------------------------------------------------------------------ characters and images

  async loadProjects(): Promise<void> {
    if (this.projects().length) return;
    try {
      const projects = await firstValueFrom(this.api.listProjects());
      this.projects.set(projects);
      if (projects[0]) await this.pickCharacterProject(projects[0].id);
    } catch {
      this.notice.set('Couldn\'t load your projects for their characters.');
    }
  }

  /** Loads a project's characters that have artwork, so they can be worn on camera (mouth-open image while talking). */
  async pickCharacterProject(projectId: string): Promise<void> {
    this.characterProject.set(projectId);
    this.loadingCharacters.set(true);
    try {
      const list: Character[] = await firstValueFrom(this.api.listCharacters(projectId));
      const loaded: ProjectCharacter[] = [];
      for (const character of list.filter((c) => c.closedMouthAssetId)) {
        const ref = `project:${character.id}`;
        try {
          const closed = await this.loadAssetImage(character.closedMouthAssetId!);
          const open = character.openMouthAssetId ? await this.loadAssetImage(character.openMouthAssetId).catch(() => undefined) : undefined;
          this.characters.set(ref, { closed, open });
          loaded.push({ ref, name: character.name, thumbnail: this.api.assetUrl(character.closedMouthAssetId!) });
        } catch {
          // A character whose image is missing is just not offered.
        }
      }
      this.projectCharacters.set(loaded);
    } catch {
      this.notice.set('Couldn\'t load that project\'s characters.');
    } finally {
      this.loadingCharacters.set(false);
    }
  }

  /** Through HttpClient (not an <img>), so the image keeps the canvas exportable and goes through the app's request pipeline. */
  private async loadAssetImage(assetId: string): Promise<ImageBitmap> {
    const blob = await firstValueFrom(this.http.get(this.api.assetUrl(assetId), { responseType: 'blob' }));
    return createImageBitmap(blob);
  }

  async onCharacterImage(event: Event): Promise<void> {
    const bitmap = await this.readImage(event);
    if (!bitmap) return;
    this.characters.set('upload', { closed: bitmap });
    this.uploadedCharacter.set('Your image');
    this.patch('identity', { character: 'upload', faceStyle: 'character', characterPerPerson: false });
  }

  async onBackgroundImage(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const name = input.files?.[0]?.name ?? null;
    const bitmap = await this.readImage(event);
    if (!bitmap) return;
    this.backgroundImage?.close();
    this.backgroundImage = bitmap;
    this.backgroundName.set(name);
    this.patch('identity', { background: 'image' });
  }

  /** Reads a picked image locally. It is decoded in the browser and never uploaded. */
  private async readImage(event: Event): Promise<ImageBitmap | null> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return null;
    if (!IMAGE_TYPES.includes(file.type) || file.size > MAX_IMAGE_BYTES) {
      this.error.set('Use a PNG, JPEG or WebP image up to 8 MB.');
      return null;
    }
    try {
      return await createImageBitmap(file);
    } catch {
      this.error.set('That image couldn\'t be read.');
      return null;
    }
  }

  characterName(ref: CharacterRef): string {
    if (ref === 'upload') return 'Your image';
    if (ref === 'custom') return this.settings().designer.name || 'My character';
    return this.builtIns.find((c) => c.id === ref)?.name
      ?? this.projectCharacters().find((c) => c.ref === ref)?.name ?? 'Character';
  }

  // ------------------------------------------------------------------ presets

  savePreset(): void {
    const name = this.presetName.trim().slice(0, 40);
    if (!name) return;
    const list = [{ name, settings: this.settings() }, ...this.presets().filter((p) => p.name !== name)].slice(0, MAX_PRESETS);
    this.presets.set(list);
    this.presetName = '';
    this.storePresets();
    this.status.notify([`Saved preset "${name}"`]);
  }

  applyPreset(preset: Preset): void {
    this.settings.set(sanitizeSettings(preset.settings));
    this.afterSettingsChange();
    if (this.running()) void this.applySources();
  }

  deletePreset(preset: Preset): void {
    if (!confirm(`Delete preset "${preset.name}"?`)) return;
    this.presets.update((list) => list.filter((p) => p !== preset));
    this.storePresets();
  }

  exportPreset(): void {
    const blob = new Blob([JSON.stringify(this.settings(), null, 2)], { type: 'application/json' });
    this.download(blob, 'camera-studio-preset.json');
  }

  async importPreset(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (file.size > 256 * 1024) {
      this.error.set('That file is too large to be a preset.');
      return;
    }
    try {
      this.settings.set(sanitizeSettings(JSON.parse(await file.text())));
      this.afterSettingsChange();
      this.status.notify(['Preset imported']);
    } catch {
      this.error.set('That file isn\'t a camera studio preset.');
    }
  }

  private loadPresets(): void {
    try {
      const raw = JSON.parse(localStorage.getItem(PRESETS_KEY) ?? '[]');
      if (Array.isArray(raw)) {
        this.presets.set(raw
          .filter((p) => p && typeof p.name === 'string')
          .slice(0, MAX_PRESETS)
          .map((p) => ({ name: String(p.name).slice(0, 40), settings: sanitizeSettings(p.settings) })));
      }
    } catch {
      // Presets are a convenience; none is fine.
    }
  }

  private storePresets(): void {
    try {
      localStorage.setItem(PRESETS_KEY, JSON.stringify(this.presets()));
    } catch {
      this.notice.set('This browser wouldn\'t save presets.');
    }
  }

  // ------------------------------------------------------------------ local recording and snapshots

  toggleLocalRecording(): void {
    if (this.recording()) this.stopLocalRecording();
    else this.startLocalRecording();
  }

  /** Saves exactly what viewers see - masked - to a file on this machine. Useful for rehearsals. */
  private startLocalRecording(name = 'camera-studio'): void {
    if (!this.programMedia || !this.format) return;
    this.localChunks = [];
    const recorder = new MediaRecorder(this.programMedia, { mimeType: this.format.mimeType, videoBitsPerSecond: 6_000_000 });
    recorder.ondataavailable = (e) => e.data.size && this.localChunks.push(e.data);
    recorder.onstop = () => {
      const extension = this.format!.container === 'Mp4' ? 'mp4' : 'webm';
      this.download(new Blob(this.localChunks, { type: this.format!.mimeType }), `${name}-${this.stamp()}.${extension}`);
      this.localChunks = [];
    };
    recorder.start(1000);
    this.localRecorder = recorder;
    this.recording.set(true);
    this.recordingSeconds.set(0);
    this.recordTimer = setInterval(() => this.recordingSeconds.update((s) => s + 1), 1000);
  }

  private stopLocalRecording(): void {
    if (this.localRecorder && this.localRecorder.state !== 'inactive') this.localRecorder.stop();
    this.localRecorder = null;
    if (this.recordTimer) clearInterval(this.recordTimer);
    this.recordTimer = null;
    this.recording.set(false);
  }

  snapshot(): void {
    this.programCanvas()?.nativeElement.toBlob((blob) => blob && this.download(blob, `camera-studio-${this.stamp()}.png`), 'image/png');
  }

  private download(blob: Blob, name: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }

  private stamp(): string {
    return new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  }

  // ------------------------------------------------------------------ helpers

  formatClock(seconds: number): string {
    const total = Math.max(0, Math.floor(seconds));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
  }

  formatSize(bytes: number): string {
    if (bytes >= 1024 * 1024 * 1024) return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
    if (bytes >= 1024 * 1024) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
    return `${Math.round(bytes / 1024)} KB`;
  }

  private describeMediaError(err: unknown): string {
    const name = err instanceof DOMException ? err.name : '';
    switch (name) {
      case 'NotAllowedError': return 'Permission was refused. Allow the camera and microphone in the address bar, then try again.';
      case 'NotFoundError': return 'No camera or microphone was found.';
      case 'NotReadableError': return 'The camera is in use by another app. Close it and try again.';
      case 'OverconstrainedError': return 'That camera can\'t do this resolution. Pick another camera or 720p.';
      default: return 'The camera or microphone couldn\'t be opened.';
    }
  }

  private async loadSetup(): Promise<void> {
    try {
      const setup = await firstValueFrom(this.live.setup());
      this.setup.set(setup);
      if (!setup.destinations.some((d) => d.id === this.form.destination)) this.form.destination = setup.destinations[0]?.id ?? '';
      if (!setup.channels.some((c) => c.id === this.form.channelId)) this.form.channelId = setup.channels[0]?.id ?? '';
      if (!setup.canUseSavedKeys) this.form.keyMode = 'paste';
      this.ensureAudiencePolling();
    } catch (err: unknown) {
      this.error.set(err instanceof ApiFailure ? err.message : 'Could not load the stream settings.');
    }
  }

  private restore(): void {
    try {
      const saved = JSON.parse(localStorage.getItem(REMEMBER_KEY) ?? '{}') as Remembered;
      if (saved.settings) this.settings.set(sanitizeSettings(saved.settings));
      if (typeof saved.cameraId === 'string') this.cameraId = saved.cameraId.slice(0, 200);
      if (typeof saved.micId === 'string') this.micId = saved.micId.slice(0, 200);
      if (saved.quality === 'Hd720' || saved.quality === 'Hd1080') this.form.quality = saved.quality;
      if (saved.orientation === 'Landscape' || saved.orientation === 'Portrait') this.form.orientation = saved.orientation;
      if (saved.keyMode === 'channel' || saved.keyMode === 'paste') this.form.keyMode = saved.keyMode;
      if (typeof saved.channelId === 'string') this.form.channelId = saved.channelId.slice(0, 128);
    } catch {
      // Storage unavailable or unreadable: the defaults are fine.
    }
  }

  scheduleRemember(): void {
    if (this.rememberTimer) clearTimeout(this.rememberTimer);
    this.rememberTimer = setTimeout(() => {
      const saved: Remembered = {
        settings: this.settings(),
        cameraId: this.cameraId,
        micId: this.micId,
        quality: this.form.quality,
        orientation: this.form.orientation,
        keyMode: this.form.keyMode,
        channelId: this.form.channelId,
      };
      try {
        localStorage.setItem(REMEMBER_KEY, JSON.stringify(saved));
      } catch {
        // Not worth telling anyone about.
      }
    }, 400);
  }

  private async teardown(): Promise<void> {
    if (this.audiencePoll) clearInterval(this.audiencePoll);
    if (this.rememberTimer) clearTimeout(this.rememberTimer);
    cancelAnimationFrame(this.designerFrame);
    // Leaving the page ends the stream: it is drawn here, so nothing would be left to send.
    await this.endStream(false);
    await this.stopStudio();
    this.vision.close();
    this.backgroundImage?.close();
    this.supportArt?.qr?.close();
    this.supportArt = null;
    if (this.videoUrl) URL.revokeObjectURL(this.videoUrl);
    this.videoUrl = null;
  }
}
