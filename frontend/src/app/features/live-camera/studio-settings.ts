/**
 * Everything the camera studio can switch on or off, in one serialisable object. It is what
 * a preset saves and what an exported preset file holds, so it never contains a stream key
 * or anything personal - and whatever is read back is passed through {@link sanitizeSettings},
 * which keeps only known values.
 */

export type SourceMode = 'camera' | 'screen' | 'screen-camera';
export type PipCorner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
export type FaceMaskStyle = 'character' | 'pixelate' | 'blur' | 'emoji' | 'block' | 'none';
export type BodyStyle = 'none' | 'silhouette' | 'blur' | 'pixelate';
export type BackgroundStyle = 'none' | 'blur' | 'color' | 'image' | 'gradient';
export type VoiceEffect = 'off' | 'deep' | 'high' | 'robot' | 'radio' | 'alien';
export type SceneId = 'camera' | 'starting' | 'brb' | 'ending' | 'privacy';
export type OverlayCorner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
export type LookFilter = 'none' | 'warm' | 'cool' | 'mono' | 'vintage' | 'vivid' | 'noir';

/** Built-in characters, drawn in code so they need no image files. */
export const BUILT_IN_CHARACTERS = [
  { id: 'robot', name: 'Robot', icon: '🤖' },
  { id: 'cat', name: 'Cat', icon: '🐱' },
  { id: 'fox', name: 'Fox', icon: '🦊' },
  { id: 'panda', name: 'Panda', icon: '🐼' },
  { id: 'alien', name: 'Alien', icon: '👽' },
  { id: 'bear', name: 'Bear', icon: '🐻' },
  { id: 'ghost', name: 'Ghost', icon: '👻' },
  { id: 'frog', name: 'Frog', icon: '🐸' },
  { id: 'astronaut', name: 'Astronaut', icon: '🧑‍🚀' },
  { id: 'pumpkin', name: 'Pumpkin', icon: '🎃' },
] as const;

export type BuiltInCharacterId = (typeof BUILT_IN_CHARACTERS)[number]['id'];

/** A character is a built-in id, a project character (`project:<id>`) or the uploaded image (`upload`). */
export type CharacterRef = string;

/** The smallest mask, as a multiple of the face's size, that still covers the face's corners. */
export const MIN_MASK_SCALE = 1.45;

export const MASK_EMOJIS =['😎', '🙂', '😺', '🤖', '👾', '🦄', '🐵', '🎭', '⭐', '❓'] as const;

export interface IdentitySettings {
  /** Master switch: hide every face on camera. */
  hideFaces: boolean;
  faceStyle: FaceMaskStyle;
  /** The character shown when `faceStyle` is `character`. */
  character: CharacterRef;
  /** Give each person on camera a different character, in this order. */
  characterPerPerson: boolean;
  emoji: string;
  /** How much bigger than the detected face the mask is, so hair and ears are covered too. */
  maskScale: number;
  /** Mirror the presenter's mouth, blinks and head tilt on the character. */
  animateCharacter: boolean;
  /**
   * Fail closed: until faces are tracked, while they're briefly lost, or when the model
   * sees a person but no face, the whole camera picture is covered.
   */
  strictMode: boolean;
  /** How long a lost face stays masked where it was last seen. */
  holdMs: number;
  maxFaces: number;
  /** Detection threshold, 0.3-0.9. Lower finds more faces and more false ones. */
  sensitivity: number;
  bodyStyle: BodyStyle;
  bodyColor: string;
  background: BackgroundStyle;
  backgroundColor: string;
  backgroundBlur: number;
}

export interface VoiceSettings {
  effect: VoiceEffect;
  /** Semitones for the pitch effects, -12 to +12. */
  pitch: number;
  muted: boolean;
  gain: number;
  noiseSuppression: boolean;
  echoCancellation: boolean;
  autoGainControl: boolean;
  /** Share the screen's own sound too, when it is a source. */
  screenAudio: boolean;
  screenAudioGain: number;
}

export interface PictureSettings {
  mirror: boolean;
  look: LookFilter;
  brightness: number;
  contrast: number;
  saturation: number;
  zoom: number;
  /** Keep the people on camera centred by following their faces. */
  autoFrame: boolean;
  pipCorner: PipCorner;
  /** Camera picture-in-picture size, as a share of the frame's width. */
  pipSize: number;
  pipRound: boolean;
}

export interface OverlaySettings {
  liveBadge: boolean;
  liveBadgeCorner: OverlayCorner;
  peopleCount: boolean;
  peopleCountCorner: OverlayCorner;
  faceLabels: boolean;
  /** "Guest" → Guest 1, Guest 2... */
  faceLabelPrefix: string;
  subscribers: boolean;
  subscribersCorner: OverlayCorner;
  /** A UC… id or an @handle. */
  youtubeChannel: string;
  subscriberGoal: number;
  showGoalBar: boolean;
  viewers: boolean;
  /** The live broadcast's video id or watch link, for the concurrent viewer count. */
  youtubeVideo: string;
  clock: boolean;
  clockCorner: OverlayCorner;
  lowerThird: boolean;
  lowerThirdName: string;
  lowerThirdTitle: string;
  ticker: boolean;
  tickerText: string;
  tickerSpeed: number;
  watermark: boolean;
  watermarkText: string;
  accent: string;
  /** Scale for every overlay, so they read on a phone as well as a TV. */
  overlayScale: number;
}

export interface SceneSettings {
  startingTitle: string;
  brbTitle: string;
  endingTitle: string;
  privacyTitle: string;
  subtitle: string;
  /** Show a countdown on the "starting soon" card. */
  countdownMinutes: number;
}

export interface StudioSettings {
  version: 1;
  source: SourceMode;
  identity: IdentitySettings;
  voice: VoiceSettings;
  picture: PictureSettings;
  overlays: OverlaySettings;
  scenes: SceneSettings;
}

export function defaultSettings(): StudioSettings {
  return {
    version: 1,
    source: 'camera',
    identity: {
      hideFaces: true,
      faceStyle: 'character',
      character: 'robot',
      characterPerPerson: true,
      emoji: '😎',
      maskScale: 1.6,
      animateCharacter: true,
      strictMode: true,
      holdMs: 1200,
      maxFaces: 4,
      sensitivity: 0.5,
      bodyStyle: 'none',
      bodyColor: '#6c8cff',
      background: 'none',
      backgroundColor: '#101828',
      backgroundBlur: 14,
    },
    voice: {
      effect: 'off',
      pitch: -4,
      muted: false,
      gain: 1,
      noiseSuppression: true,
      echoCancellation: true,
      autoGainControl: true,
      screenAudio: true,
      screenAudioGain: 0.8,
    },
    picture: {
      mirror: true,
      look: 'none',
      brightness: 1,
      contrast: 1,
      saturation: 1,
      zoom: 1,
      autoFrame: false,
      pipCorner: 'bottom-right',
      pipSize: 0.28,
      pipRound: false,
    },
    overlays: {
      liveBadge: true,
      liveBadgeCorner: 'top-left',
      peopleCount: true,
      peopleCountCorner: 'top-right',
      faceLabels: false,
      faceLabelPrefix: 'Guest',
      subscribers: false,
      subscribersCorner: 'bottom-right',
      youtubeChannel: '',
      subscriberGoal: 1000,
      showGoalBar: true,
      viewers: false,
      youtubeVideo: '',
      clock: false,
      clockCorner: 'bottom-left',
      lowerThird: false,
      lowerThirdName: 'Anonymous host',
      lowerThirdTitle: 'Live now',
      ticker: false,
      tickerText: 'Welcome to the stream! Like and subscribe 💙',
      tickerSpeed: 1,
      watermark: false,
      watermarkText: '',
      accent: '#ff3355',
      overlayScale: 1,
    },
    scenes: {
      startingTitle: 'Starting soon',
      brbTitle: 'Be right back',
      endingTitle: 'Thanks for watching',
      privacyTitle: 'Camera paused',
      subtitle: '',
      countdownMinutes: 5,
    },
  };
}

// ------------------------------------------------------------------ sanitising

const SOURCE: readonly SourceMode[] = ['camera', 'screen', 'screen-camera'];
const CORNERS: readonly OverlayCorner[] = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
const FACE_STYLES: readonly FaceMaskStyle[] = ['character', 'pixelate', 'blur', 'emoji', 'block', 'none'];
const BODY: readonly BodyStyle[] = ['none', 'silhouette', 'blur', 'pixelate'];
const BACKGROUND: readonly BackgroundStyle[] = ['none', 'blur', 'color', 'image', 'gradient'];
const VOICE: readonly VoiceEffect[] = ['off', 'deep', 'high', 'robot', 'radio', 'alien'];
const LOOKS: readonly LookFilter[] = ['none', 'warm', 'cool', 'mono', 'vintage', 'vivid', 'noir'];
const COLOR = /^#[0-9a-f]{6}$/i;
const CHARACTER = /^(?:[a-z]{2,16}|upload|project:[A-Za-z0-9_-]{1,64})$/;

function pick<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function num(value: unknown, min: number, max: number, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

/** Plain text for an overlay: no control characters, bounded length. It is drawn on a canvas, never inserted as HTML. */
function text(value: unknown, max: number, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\u0000-\u001f\u007f]/g, ' ').slice(0, max);
}

function color(value: unknown, fallback: string): string {
  return typeof value === 'string' && COLOR.test(value) ? value : fallback;
}

/**
 * Rebuilds settings from untrusted JSON (local storage, an imported preset file): every
 * field is checked against its allowed values or range, and anything unknown is dropped.
 */
export function sanitizeSettings(raw: unknown): StudioSettings {
  const d = defaultSettings();
  if (!raw || typeof raw !== 'object') return d;
  const r = raw as Record<string, any>;
  const i = (r['identity'] ?? {}) as Record<string, unknown>;
  const v = (r['voice'] ?? {}) as Record<string, unknown>;
  const p = (r['picture'] ?? {}) as Record<string, unknown>;
  const o = (r['overlays'] ?? {}) as Record<string, unknown>;
  const s = (r['scenes'] ?? {}) as Record<string, unknown>;

  return {
    version: 1,
    source: pick(r['source'], SOURCE, d.source),
    identity: {
      hideFaces: bool(i['hideFaces'], d.identity.hideFaces),
      faceStyle: pick(i['faceStyle'], FACE_STYLES, d.identity.faceStyle),
      character: typeof i['character'] === 'string' && CHARACTER.test(i['character']) ? i['character'] : d.identity.character,
      characterPerPerson: bool(i['characterPerPerson'], d.identity.characterPerPerson),
      emoji: MASK_EMOJIS.includes(i['emoji'] as never) ? (i['emoji'] as string) : d.identity.emoji,
      // A disc only covers a face's whole box from about 1.42× its size, so smaller isn't allowed.
      maskScale: num(i['maskScale'], MIN_MASK_SCALE, 2.6, d.identity.maskScale),
      animateCharacter: bool(i['animateCharacter'], d.identity.animateCharacter),
      strictMode: bool(i['strictMode'], d.identity.strictMode),
      holdMs: num(i['holdMs'], 0, 5000, d.identity.holdMs),
      maxFaces: Math.round(num(i['maxFaces'], 1, 10, d.identity.maxFaces)),
      sensitivity: num(i['sensitivity'], 0.3, 0.9, d.identity.sensitivity),
      bodyStyle: pick(i['bodyStyle'], BODY, d.identity.bodyStyle),
      bodyColor: color(i['bodyColor'], d.identity.bodyColor),
      background: pick(i['background'], BACKGROUND, d.identity.background),
      backgroundColor: color(i['backgroundColor'], d.identity.backgroundColor),
      backgroundBlur: num(i['backgroundBlur'], 2, 40, d.identity.backgroundBlur),
    },
    voice: {
      effect: pick(v['effect'], VOICE, d.voice.effect),
      pitch: Math.round(num(v['pitch'], -12, 12, d.voice.pitch)),
      muted: bool(v['muted'], d.voice.muted),
      gain: num(v['gain'], 0, 3, d.voice.gain),
      noiseSuppression: bool(v['noiseSuppression'], d.voice.noiseSuppression),
      echoCancellation: bool(v['echoCancellation'], d.voice.echoCancellation),
      autoGainControl: bool(v['autoGainControl'], d.voice.autoGainControl),
      screenAudio: bool(v['screenAudio'], d.voice.screenAudio),
      screenAudioGain: num(v['screenAudioGain'], 0, 2, d.voice.screenAudioGain),
    },
    picture: {
      mirror: bool(p['mirror'], d.picture.mirror),
      look: pick(p['look'], LOOKS, d.picture.look),
      brightness: num(p['brightness'], 0.5, 1.6, d.picture.brightness),
      contrast: num(p['contrast'], 0.5, 1.6, d.picture.contrast),
      saturation: num(p['saturation'], 0, 2, d.picture.saturation),
      zoom: num(p['zoom'], 1, 3, d.picture.zoom),
      autoFrame: bool(p['autoFrame'], d.picture.autoFrame),
      pipCorner: pick(p['pipCorner'], CORNERS, d.picture.pipCorner),
      pipSize: num(p['pipSize'], 0.15, 0.5, d.picture.pipSize),
      pipRound: bool(p['pipRound'], d.picture.pipRound),
    },
    overlays: {
      liveBadge: bool(o['liveBadge'], d.overlays.liveBadge),
      liveBadgeCorner: pick(o['liveBadgeCorner'], CORNERS, d.overlays.liveBadgeCorner),
      peopleCount: bool(o['peopleCount'], d.overlays.peopleCount),
      peopleCountCorner: pick(o['peopleCountCorner'], CORNERS, d.overlays.peopleCountCorner),
      faceLabels: bool(o['faceLabels'], d.overlays.faceLabels),
      faceLabelPrefix: text(o['faceLabelPrefix'], 24, d.overlays.faceLabelPrefix),
      subscribers: bool(o['subscribers'], d.overlays.subscribers),
      subscribersCorner: pick(o['subscribersCorner'], CORNERS, d.overlays.subscribersCorner),
      youtubeChannel: text(o['youtubeChannel'], 200, d.overlays.youtubeChannel),
      subscriberGoal: Math.round(num(o['subscriberGoal'], 0, 1_000_000_000, d.overlays.subscriberGoal)),
      showGoalBar: bool(o['showGoalBar'], d.overlays.showGoalBar),
      viewers: bool(o['viewers'], d.overlays.viewers),
      youtubeVideo: text(o['youtubeVideo'], 200, d.overlays.youtubeVideo),
      clock: bool(o['clock'], d.overlays.clock),
      clockCorner: pick(o['clockCorner'], CORNERS, d.overlays.clockCorner),
      lowerThird: bool(o['lowerThird'], d.overlays.lowerThird),
      lowerThirdName: text(o['lowerThirdName'], 60, d.overlays.lowerThirdName),
      lowerThirdTitle: text(o['lowerThirdTitle'], 80, d.overlays.lowerThirdTitle),
      ticker: bool(o['ticker'], d.overlays.ticker),
      tickerText: text(o['tickerText'], 300, d.overlays.tickerText),
      tickerSpeed: num(o['tickerSpeed'], 0.3, 3, d.overlays.tickerSpeed),
      watermark: bool(o['watermark'], d.overlays.watermark),
      watermarkText: text(o['watermarkText'], 60, d.overlays.watermarkText),
      accent: color(o['accent'], d.overlays.accent),
      overlayScale: num(o['overlayScale'], 0.6, 1.8, d.overlays.overlayScale),
    },
    scenes: {
      startingTitle: text(s['startingTitle'], 60, d.scenes.startingTitle),
      brbTitle: text(s['brbTitle'], 60, d.scenes.brbTitle),
      endingTitle: text(s['endingTitle'], 60, d.scenes.endingTitle),
      privacyTitle: text(s['privacyTitle'], 60, d.scenes.privacyTitle),
      subtitle: text(s['subtitle'], 120, d.scenes.subtitle),
      countdownMinutes: Math.round(num(s['countdownMinutes'], 0, 120, d.scenes.countdownMinutes)),
    },
  };
}

/**
 * Pulls a YouTube channel reference out of whatever was pasted: a UC… id, an @handle, or a
 * channel link. Returns null for anything else, so only an id-shaped value is ever sent.
 */
export function parseYouTubeChannel(input: string): string | null {
  const value = input.trim();
  if (/^UC[A-Za-z0-9_-]{22}$/.test(value)) return value;
  if (/^@[A-Za-z0-9._-]{3,30}$/.test(value)) return value;
  const fromUrl = value.match(/youtube\.com\/(?:channel\/(UC[A-Za-z0-9_-]{22})|(@[A-Za-z0-9._-]{3,30}))/i);
  return fromUrl ? (fromUrl[1] ?? fromUrl[2]) : null;
}

/** Pulls a video id out of a watch / live / youtu.be link, or accepts a bare id. */
export function parseYouTubeVideo(input: string): string | null {
  const value = input.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(value)) return value;
  const fromUrl = value.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|live\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/i);
  return fromUrl ? fromUrl[1] : null;
}
