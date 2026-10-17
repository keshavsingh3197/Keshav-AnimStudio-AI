import { CharacterVoice } from '../../shared/voice/character-voice';

/** Mirrors the backend's single response envelope. */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors: ApiError[];
}

export interface ApiError {
  code: string;
  message: string;
  field?: string;
  hint?: string;
  detail?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  width: number;
  height: number;
  fps: number;
  distributionIntent: string;
  acceptShareAlikeObligation: boolean;
  backgroundMusicAssetId: string | null;
  backgroundMusicVolume: number;
  createdAt: string;
  updatedAt: string;
  isPinned?: boolean;
  customThumbnail?: string | null;
  defaultWatermark?: any;
  defaultOutro?: OutroBody | null;
  /** The brand channel (YouTube channel) this project publishes under; null = default. */
  brandChannelId?: string | null;
  /** True: the watermark is the channel's, live. False: defaultWatermark is this project's own. */
  followChannelWatermark?: boolean;
  /** A music project's renders publish to YouTube Music by default. */
  contentType?: ProjectContentType;
  /** Seconds an image plays when added to the timeline; null = the studio-wide default. */
  defaultImageDurationSeconds?: number | null;
}

/** What a project makes; 'music' sends its renders to YouTube Music (the Music category). */
export type ProjectContentType = 'video' | 'music';

export interface CreateProjectBody {
  name: string;
  description?: string | null;
  width: number;
  height: number;
  fps: number;
  distributionIntent: string;
  /** Channel to publish under; its watermark is copied into the new project. */
  brandChannelId?: string | null;
  contentType?: ProjectContentType;
}

/** The id of the built-in brand channel (the studio's original single branding). */
export const DEFAULT_BRAND_CHANNEL = 'default';

/** One channel's look: the watermark on its videos and the end card they finish with. */
export interface BrandChannel {
  id: string;
  name: string;
  isDefault: boolean;
  watermark: WatermarkBody | null;
  outro: OutroBody | null;
  /** The YouTube channel this brand publishes to, from Settings → YouTube publishing. */
  youTubeChannelId?: string | null;
  youTubeChannelTitle?: string | null;
  /** As YouTube last reported them; a linked brand's name follows the YouTube channel's title. */
  youTubeChannelHandle?: string | null;
  youTubeThumbnailUrl?: string | null;
}

/** What "Sync from YouTube" did, and the channel list after it. */
export interface BrandChannelSyncResult {
  channels: BrandChannel[];
  youTubeChannels: number;
  created: string[];
  renamed: { brandChannelId: string; before: string; after: string }[];
  failed: { channelId: string; channelTitle: string; reason: string }[];
}

export interface UpdateProjectBody extends CreateProjectBody {
  acceptShareAlikeObligation: boolean;
  backgroundMusicAssetId?: string | null;
  backgroundMusicVolume: number;
  defaultWatermark?: WatermarkBody | null;
  defaultOutro?: OutroBody | null;
  /** Omitted leaves it unchanged. */
  followChannelWatermark?: boolean;
  isPinned?: boolean;
  customThumbnail?: string | null;
  /** Omitted leaves it unchanged; 0 goes back to the studio-wide default. */
  defaultImageDurationSeconds?: number;
}

export interface AssetFolder {
  id: string;
  projectId: string;
  name: string;
  parentId?: string;
  createdAt: string;
}

export interface Asset {
  id: string;
  name: string;
  orderIndex: number;
  kind: string;
  mimeType: string;
  fileSizeBytes: number;
  width?: number;
  height?: number;
  hasAlpha: boolean;
  durationSeconds?: number;
  reviewStatus: string;
  folderId?: string | null;
}

/** Where a reuse search looks: this project's channel only, or every project. */
export type AssetSearchScope = 'channel' | 'all';

/** A file in another of the user's projects that could be brought into this one. */
export interface AssetSearchHit {
  asset: Asset;
  projectId: string;
  projectName: string;
  channelId: string;
  sameChannel: boolean;
  /** A cut exported from Clip Studio rather than an upload. */
  isExport: boolean;
  /** This project already has a copy of it. */
  alreadyAdded: boolean;
  createdAt: string;
}

/** How reuse search results are ordered. */
export type AssetSearchSort = 'relevance' | 'newest' | 'oldest' | 'name' | 'largest';

/** A project the reuse search looked in that has matching files. */
export interface AssetSearchProject {
  id: string;
  name: string;
  channelId: string;
  sameChannel: boolean;
  /** Matching files, ignoring the project filter. */
  matches: number;
}

export interface AssetSearchResult {
  /** One page of the matches. */
  items: AssetSearchHit[];
  /** Matches across every page. */
  total: number;
  projectsSearched: number;
  /** More matches follow this page. */
  truncated: boolean;
  /** Matches per lower-case kind ('video', 'image', …), ignoring the type filter. */
  kindCounts: Record<string, number>;
  projects: AssetSearchProject[];
}

export interface AssetSearchOptions {
  q?: string;
  scope?: AssetSearchScope;
  /** One brand channel; overrides `scope`. */
  channel?: string;
  /** One source project. */
  project?: string;
  kind?: string;
  sort?: AssetSearchSort;
  offset?: number;
  limit?: number;
}

/** One voice the server's speech engine can speak a voiceover in. */
export interface VoiceoverVoice {
  id: string;
  name: string;
  languageCode?: string | null;
  gender?: string | null;
}

/** GET /api/voiceover/voices: whether a voiceover can be made right now, and in which voices. */
export interface VoiceoverVoices {
  available: boolean;
  providerId?: string | null;
  reason: string;
  voices: VoiceoverVoice[];
  /** Voices the user added from their own samples. */
  myVoices?: MyVoice[];
  /** False when neither Kokoro voice tuning nor the AI voice converter can make "my voice" lines. */
  myVoicesAvailable?: boolean;
  /** Speech engines that are on, in the configured order. */
  engines?: VoiceoverEngine[];
}

/** A speech engine the voiceover panel can pick; `models` is empty when there is nothing to choose. */
export interface VoiceoverEngine {
  id: string;
  name: string;
  runsLocally: boolean;
  /** The model it uses unless another is picked. */
  model?: string | null;
  models: { id: string; label: string }[];
}

/** What was heard in a dictated script, one line per spoken phrase. */
export interface VoiceScriptDictation {
  lines: string[];
}

/** One spoken line in an audio or video file, with where it is said. */
export interface MediaTranscriptLine {
  startSeconds: number;
  endSeconds: number;
  text: string;
}

/**
 * What is said in an audio or video asset. `language` is what the recognizer detected, or
 * the one asked for; `truncated` means only the first two hours were transcribed.
 */
export interface MediaTranscript {
  lines: MediaTranscriptLine[];
  text: string;
  subRip: string;
  language?: string | null;
  provider: string;
  truncated: boolean;
  /** The .srt kept in the library, when saving was asked for. */
  savedAsset?: Asset | null;
}

/** A script rewritten by the AI text model so it reads aloud well. */
export interface VoiceScriptPolish {
  script: string;
  providerId?: string | null;
}

/** A voice the user added from their own consented sample. */
export interface MyVoice {
  id: string;
  name: string;
  /** The built-in voice that speaks the words before they are re-voiced. */
  baseVoiceId: string;
  durationSeconds?: number | null;
  createdAtUtc: string;
  /** Kokoro has a voice tuned from the sample, which speaks lines in any of its languages directly instead of re-voicing them. */
  tuned?: boolean;
}

/** One script line for POST /api/projects/{id}/voiceover. Rate is 0.5-2.0. */
export interface VoiceoverBody {
  text: string;
  voiceId: string;
  rate?: number;
  name?: string;
  /** One of the user's own voices: voiceId speaks the line, then it is re-voiced into this one. */
  myVoiceId?: string;
  /** The speech engine to use instead of the configured order (not with myVoiceId). */
  engine?: string;
  /** One of the engine's offered models. */
  model?: string;
}

export interface CharacterAppearance {
  age?: number;
  gender?: string;
  hair?: string;
  clothes?: string;
  additionalDetails?: string;
}

export interface Character {
  id: string;
  name: string;
  description?: string;
  aliases: string[];
  closedMouthAssetId?: string;
  openMouthAssetId?: string;
  isNarrator: boolean;
  subtitleColorHex?: string;
  appearance: CharacterAppearance;
  /** Absent: the performer's own voice. */
  voice?: CharacterVoice | null;
}

export interface CharacterBody {
  name: string;
  /** Null clears the value; undefined and null are both accepted by the API. */
  description?: string | null;
  aliases: string[];
  closedMouthAssetId?: string | null;
  openMouthAssetId?: string | null;
  subtitleColorHex?: string | null;
  appearance?: CharacterAppearance;
  /** Omitted leaves the voice as it is; `enabled: false` clears it. */
  voice?: (CharacterVoice & { enabled: true }) | { enabled: false };
}

export interface IngestResult {
  ingestId: string;
  scriptId?: string;
  cueCount: number;
  segmentCount: number;
  timingSource: string;
  hasSourceTimings: boolean;
  warnings: string[];
}

export interface ScriptSummary {
  id: string;
  ingestId: string;
  version: number;
  status: string;
  timingSource: string;
  hasSourceTimings: boolean;
  segmentCount: number;
  lineCount: number;
  totalSeconds: number;
  warnings: string[];
  createdAt: string;
}

export interface ScriptLine {
  speakerLabel?: string;
  text: string;
  startSeconds: number;
  endSeconds: number;
}

export interface ScriptSegment {
  order: number;
  segmentKey: string;
  title?: string;
  dominantSpeakerLabel?: string;
  sourceStartSeconds: number;
  sourceEndSeconds: number;
  timelineStartSeconds: number;
  timelineEndSeconds: number;
  breakReason: string;
  lines: ScriptLine[];
}

export interface ScriptDetail extends ScriptSummary {
  projectId: string;
  /** Project or ClipMerge, so a screen can say "clip 2 of 6" rather than "scene 2 of 6". */
  kind: string;
  segments: ScriptSegment[];
  segmentsTruncated: boolean;
}

export interface IngestSummary {
  id: string;
  source: string;
  status: string;
  scriptId?: string;
  cueCount: number;
  timingSource: string;
  sourceTitle?: string;
  captionLanguage?: string;
  captionIsAutoGenerated: boolean;
  captionsOnly: boolean;
  rightsBasisCode?: string;
  toolName?: string;
  toolVersion?: string;
  warnings: string[];
  errorCode?: string;
  createdAt: string;
  completedAt?: string;
}

export interface SceneGenerationResult {
  scenesCreated: number;
  scenesPreserved: number;
  unresolvedSpeakers: string[];
  warnings: string[];
}

/** A scene as it appears in the list. */
export interface Scene {
  id: string;
  sceneNumber: number;
  title?: string;
  durationFrames: number;
  durationSeconds: number;
  backgroundAssetId?: string;
  dialogueLines: number;
  transition: string;
  backgroundEffect: string;
  transitionDurationSeconds: number;
  audioAssetId?: string;
  hasAudioSlice: boolean;
  characterCount: number;
  origin: string;
  isUserEdited: boolean;
}

export interface DialogueLine {
  index: number;
  speakerCharacterId?: string;
  speakerLabel?: string;
  text: string;
  startSeconds: number;
  endSeconds: number;
}

export interface CharacterPlacement {
  characterId: string;
  anchor: string;
  heightFraction: number;
  offsetXFraction: number;
  offsetYFraction: number;
  flipHorizontal: boolean;
  zOrder: number;
  entrance: string;
  entranceDurationSeconds: number;
  presenceStartSeconds: number;
  presenceEndSeconds: number;
}

/** Everything the scene editor needs to draw its form. */
export interface SceneDetail {
  id: string;
  projectId: string;
  /** Project or ClipMerge, so a screen can say "clip 2 of 6" rather than "scene 2 of 6". */
  kind: string;
  sceneNumber: number;
  title?: string;
  description?: string;
  durationFrames: number;
  durationSeconds: number;
  backgroundAssetId?: string;
  backgroundEffect: string;
  intensity: number;
  easing: string;
  fadeInSeconds: number;
  fadeOutSeconds: number;
  transition: string;
  transitionDurationSeconds: number;
  audioAssetId?: string;
  audioSliceStartSeconds?: number;
  audioSliceEndSeconds?: number;
  dialogue: DialogueLine[];
  characters: CharacterPlacement[];
  origin: string;
  isUserEdited: boolean;
  updatedAt: string;
}

export interface CreateSceneBody {
  title?: string;
  description?: string;
  durationSeconds: number;
  backgroundAssetId?: string;
  afterSceneId?: string;
}

export interface UpdateSceneBody {
  title?: string;
  description?: string;
  durationSeconds: number;
  backgroundEffect: string;
  intensity: number;
  easing: string;
  fadeInSeconds: number;
  fadeOutSeconds: number;
  transition: string;
  transitionDurationSeconds: number;
}

export interface DialogueBody {
  speakerCharacterId?: string | null;
  text: string;
  startSeconds: number;
  endSeconds: number;
}

export interface PlacementBody {
  characterId: string;
  anchor: string;
  heightFraction: number;
  offsetXFraction: number;
  offsetYFraction: number;
  flipHorizontal: boolean;
  zOrder: number;
  entrance: string;
  entranceDurationSeconds: number;
  presenceStartSeconds?: number | null;
  presenceEndSeconds?: number | null;
}

export interface SceneAudioBody {
  assetId?: string | null;
  sliceStartSeconds?: number | null;
  sliceEndSeconds?: number | null;
}

export interface RenderJob {
  jobId: string;
  projectId: string;
  /** Project or ClipMerge, so a screen can say "clip 2 of 6" instead of "scene 2 of 6". */
  kind: string;
  status: string;
  progress: number;
  message?: string;
  currentStage: string;
  scenesTotal: number;
  scenesDone: number;
  errorCode?: string;
  errorMessage?: string;
  warnings: string[];
  hasOutput: boolean;
  outputDurationSeconds?: number;
  width?: number;
  height?: number;
  targetFormat?: string;
  createdAt: string;
  completedAt?: string;
  diagnostics?: RenderDiagnostics;
  /** True when the export recorded where each clip, sound and overlay landed. */
  hasTimeline?: boolean;
  /** Shown on screen and used as the download filename; renamed once the render has finished. */
  name?: string;
}

/** Downloadable forms of an export's timeline: a YouTube description draft, CSV or JSON. */
export type ExportTimelineFormat = 'youtube' | 'csv' | 'json';

export interface RenderDiagnostics {
  totalSeconds: number;
  preparingSeconds: number;
  encodingSeconds: number;
  mergingSeconds: number;
  publishingSeconds: number;
  itemsCount: number;
  outputDurationSeconds?: number;
  speedFactor?: string;
  completedAt?: string;
  /** GPU or CPU encoder used for Step 2 clip conformance, e.g. "h264_nvenc", "h264_qsv", "CPU". */
  hardwareEncoder?: string;
}

export interface RendererStatus {
  available: boolean;
  version?: string;
  unavailableReason?: string;
  burnedSubtitles: boolean;
  kenBurns: boolean;
  transitions: boolean;
}

export interface TranscriptSourceStatus {
  kind: string;
  available: boolean;
  unavailableReason?: string;
  toolVersion?: string;
  requiresAttestation: boolean;
}

export interface IngestCapabilities {
  defaultSource: string;
  mediaDownloadAllowed: boolean;
  sources: TranscriptSourceStatus[];
}

/** Terminal statuses; polling stops on any of these. */
export const TERMINAL_JOB_STATUSES = [
  'Completed',
  'CompletedWithWarnings',
  'Failed',
  'Cancelled',
] as const;

export function isTerminal(status: string): boolean {
  return (TERMINAL_JOB_STATUSES as readonly string[]).includes(status);
}


// --- clip studio: several finished clips joined into one file -----------------

export interface Clip {
  id: string;
  assetId?: string;
  trimStartSeconds?: number;
  trimEndSeconds?: number;
  name: string;
  fileSizeBytes: number;
  durationSeconds?: number;
  width?: number;
  height?: number;
  hasAudio: boolean;
  /** A finished render saved back to the project; the media panel hides these. */
  isExport?: boolean;
  /** When the file was added to the library (UTC ISO string); absent on client-made splits. */
  createdAt?: string;
}

/**
 * How one line of a pasted running order was read. Mirrors the server's ClipOrderMatch,
 * because the UI colours each line by it.
 */
export type ClipOrderMatch = 'Matched' | 'Ambiguous' | 'Unmatched' | 'Duplicate';

export interface ClipOrderLine {
  number: number;
  text: string;
  assetId?: string;
  match: ClipOrderMatch;
}

export interface ClipOrder {
  /** Always a COMPLETE ordering of what was sent, so it can be applied as-is. */
  assetIds: string[];
  lines: ClipOrderLine[];
  /** Clips the text never named. They are kept at the end rather than dropped. */
  appendedAssetIds: string[];
  isExact: boolean;
}

/** The clip screen's data and its server-side limits in one payload. */
export interface ClipStudio {
  clips: Clip[];
  logoCandidates: Asset[];
  musicCandidates: Asset[];
  defaultWatermarkText?: string;
  maxClips: number;
  maxMusicTracks: number;
  maxClipUploadBytes: number;
  maxImageOrAudioUploadBytes: number;
  rendererAvailable: boolean;
  unavailableReason?: string;
  textWatermarkAvailable: boolean;
  logoWatermarkAvailable: boolean;
  transitionsAvailable: boolean;
  blurredBackdropAvailable: boolean;
  studioDraftJson?: string;
}

export type WatermarkKind = 'None' | 'Text' | 'Logo';

/**
 * Note what is missing: there is no centre position. A watermark over the middle of the
 * frame covers what the viewer came to see, so the option does not exist to be chosen.
 */
export const WATERMARK_POSITIONS = [
  'TopRight', 'TopLeft', 'TopCenter', 'BottomRight', 'BottomLeft', 'BottomCenter',
] as const;

export type WatermarkPosition = (typeof WATERMARK_POSITIONS)[number];

export interface WatermarkBody {
  kind: WatermarkKind;
  text?: string | null;
  logoAssetId?: string | null;
  position: WatermarkPosition;
  opacity: number;
  heightFraction: number;
  marginFraction: number;
  colorHex?: string | null;
  backplateOpacity: number;
}

export const OUTRO_KINDS = ['None', 'Video', 'Image', 'Card'] as const;
export type OutroKind = (typeof OUTRO_KINDS)[number];

export interface OutroBody {
  kind: OutroKind;
  assetId?: string | null;
  durationSeconds: number;
  transition: string;
  transitionDurationFrames: number;
  /** Card only: the QR code shown in the middle, and the lines above and below it. */
  qrAssetId?: string | null;
  headline?: string | null;
  subtext?: string | null;
  /** Optional second-language lines, drawn under the headline and the subtext. */
  headlineSecondary?: string | null;
  subtextSecondary?: string | null;
  backgroundHex?: string | null;
  textHex?: string | null;
  /** Card only: 'Rise' brings the headline, code and small text in one after another. */
  animation?: EndCardAnimation | null;
}

export const END_CARD_ANIMATIONS = ['Rise', 'None'] as const;
export type EndCardAnimation = (typeof END_CARD_ANIMATIONS)[number];

export const CLIP_FITS = ['Contain', 'Cover', 'BlurredBackdrop'] as const;

export type ClipFit = (typeof CLIP_FITS)[number];

/** Delivered picture quality. High is the default and what an omitted value means. */
export const EXPORT_QUALITIES = ['Fast', 'High', 'Best'] as const;

export type ExportQuality = (typeof EXPORT_QUALITIES)[number];

/** One gap between two consecutive clips, overriding the timeline's default transition. */
export interface ClipJunctionBody {
  transition: string;
  transitionSeconds: number;
  /**
   * Seconds the RIGHT clip (clip k+1) extends before its trimStart to supply material for
   * the dissolve. When freezeTail is true the backend freezes the first real frame instead.
   */
  leadInSeconds?: number;
  /**
   * Seconds the LEFT clip (clip k) extends after its trimEnd to supply material for the
   * dissolve. When freezeHead is true the backend freezes the last real frame instead.
   */
  tailOutSeconds?: number;
  /** True → the backend must freeze the RIGHT clip's first frame for the leadIn window. */
  freezeHead?: boolean;
  /** True → the backend must freeze the LEFT clip's last frame for the tailOut window. */
  freezeTail?: boolean;
}

/** One music (or other audio) clip, placed at its own point on the timeline. */
export interface TimedMusicClipBody {
  assetId: string;
  startSeconds: number;
  volume: number;
  trimStartSeconds?: number | null;
  trimEndSeconds?: number | null;
  /** A voiceover line on A1: music ducks under it, and it never ducks itself. */
  isVoiceover?: boolean;
}

/**
 * One clip's sound. Position in the list IS the clip it names, so the list either covers
 * every clip in the cut or is left out entirely.
 */
export interface ClipAudioBody {
  /** The clip's own audio: 1 as recorded, 0 silent, up to MAX_CLIP_GAIN a boost. */
  volume: number;
  /** A sound for this clip alone - a voice-over, a sting, a music change. */
  audioAssetId?: string | null;
  audioVolume: number;
  /** Plays that sound over the clip's own audio rather than instead of it. */
  keepOriginalAudio: boolean;
  trimStartSeconds?: number | null;
  trimEndSeconds?: number | null;
  /** Sound only: the export blanks this clip's picture to the backdrop colour. */
  hideVideo?: boolean;
}

/** Loudest anything may be lifted. Mirrors ClipAudioSpec.MaxGain on the server. */
export const MAX_CLIP_GAIN = 2;

export type TimelineItemType = 'video' | 'image' | 'audio' | 'text' | 'celebration';

export interface TimelineItemTransform {
  scale: number;
  /** Image/video overlays: width in percent of the canvas width; replaces scale when set. */
  widthPercent?: number;
  x: number;
  y: number;
  opacity: number;
  /** Clockwise rotation in degrees */
  rotation?: number;
  /** Crop percentages [0-99] from each edge */
  cropLeft?: number;
  cropRight?: number;
  cropTop?: number;
  cropBottom?: number;
  /** When true, editing any single crop edge mirrors to all four */
  cropLinked?: boolean;
  /** Request video stabilization for this clip */
  stabilization?: boolean;
  /** Existing marks in the source footage to wipe before our own watermark is drawn */
  eraseRegions?: EraseRegion[];
  /** Transition In style for image overlay */
  transitionIn?: OverlayMotion;
  transitionInDuration?: number;
  /** Transition Out style for image overlay */
  transitionOut?: OverlayMotion;
  transitionOutDuration?: number;
  /** Image/video overlays: the outline it is cut to. */
  shape?: OverlayShape;
  /** Ring inside the overlay's edge, in 360-reference pixels like text sizes. */
  borderWidth?: number;
  /** #rrggbb */
  borderColor?: string;
  /** Width / height after the crop, so the export sizes a shaped overlay exactly. */
  aspectRatio?: number;
  /** Image clips on V1: the camera move over the still. Absent holds it still. */
  motion?: ImageCameraMotion;
  /** Zoom amount or pan travel as a fraction of the frame, 0.02-0.5. */
  motionIntensity?: number;
  motionEasing?: 'ease' | 'linear';
  /** Where a zoom heads, in percent of the image across and down. */
  focusX?: number;
  focusY?: number;
  /** Image clips: colour grade. */
  look?: ImageLook;
  vignette?: boolean;
  grain?: boolean;
  cinemaBars?: boolean;
}

/** Camera moves over a still. Mirrors ImageMotion on the server (CinematicImage.cs). */
export type ImageCameraMotion =
  | 'none' | 'zoom-in' | 'zoom-out' | 'pan-left' | 'pan-right' | 'pan-up' | 'pan-down'
  | 'drift' | 'handheld' | 'breathe';

/** Colour grades for a still. Mirrors ImageLook on the server. */
export type ImageLook = 'none' | 'cinematic' | 'warm' | 'cool' | 'vintage' | 'noir' | 'vivid' | 'matte';

/** How an overlay arrives or leaves. 'pop' is an entrance only; as an exit it shrinks like 'zoom'. */
export type OverlayMotion =
  | 'none' | 'fade' | 'slide-left' | 'slide-right' | 'slide-up' | 'slide-down'
  | 'zoom' | 'zoom-in' | 'zoom-out' | 'pop'
  /** Text only: typed out a character at a time, or wiped on left to right. */
  | 'typewriter' | 'wipe';

export type OverlayShape = 'rect' | 'rounded' | 'circle';

/**
 * Blur smears the mark; Patch covers it with the footage beside it; Fill paints a box;
 * Brand patches it and draws the project's own watermark in its place.
 */
export type EraseStyle = 'Blur' | 'Fill' | 'Patch' | 'Brand' | 'Clean';

/** Which neighbouring footage a Patch / Brand box copies from. */
export type EraseSource = 'Auto' | 'Above' | 'Below' | 'Left' | 'Right';

/**
 * A rectangle of a clip's SOURCE frame to erase, in percent of that frame - so it means
 * the same patch of footage whatever the crop, fit or output size. Mirrors EraseRegionSpec.
 */
export interface EraseRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  style: EraseStyle;
  /** #rrggbb, used by 'Fill' */
  fillColor?: string;
  /** 0-100: blur amount, or how much a patch is softened */
  strength?: number;
  /** 0-100: how far the edge fades into the footage around the box */
  feather?: number;
  /** 0-100: density of a Fill */
  opacity?: number;
  /** Patch / Brand: where the cover footage is copied from */
  source?: EraseSource;
  /** Brand: also draw the watermark at its usual corner (default: only in this box) */
  keepCornerMark?: boolean;
}

/** Mirrors EraseRegionSpec.DefaultStrength / DefaultFeather on the server. */
export const ERASE_DEFAULT_STRENGTH = 60;
export const ERASE_DEFAULT_FEATHER = 30;

/** Mirrors EraseRegionSpec.MaxPerClip / MinSizePercent on the server. */
export const MAX_ERASE_REGIONS = 8;
export const MIN_ERASE_SIZE = 1;

export type TextBoxStyle = 'none' | 'box' | 'band';

/** What a text card does while its words show. Mirrors TextCardEffect on the server. */
export type TextCardEffect = 'none' | 'fade' | 'vignette';

export interface TimelineItemTextStyle {
  /** Pixels on a frame whose short side is 360 (the monitor); the export scales it to the canvas. */
  fontSize: number;
  /** #rrggbb */
  color: string;
  /** Legacy CSS plate colour; superseded by boxStyle/boxColor/boxOpacity when those are set. */
  backgroundColor: string;
  /** 'custom' places the centre of the text at x/y. */
  position: 'top' | 'center' | 'bottom' | 'custom';
  /** Centre of the text block, percent of the frame (custom position only). */
  x?: number;
  y?: number;
  /** none, a plate behind each line, or a full-width strip. */
  boxStyle?: TextBoxStyle;
  /** #rrggbb */
  boxColor?: string;
  /** 0-1 */
  boxOpacity?: number;
  /** #rrggbb; drawn only while outlineWidth > 0 */
  outlineColor?: string;
  /** Same units as fontSize */
  outlineWidth?: number;
  shadow?: boolean;
  uppercase?: boolean;
  /**
   * #rrggbb filling the whole frame behind the words while they show - the card a title in
   * its own slot sits on. Absent: no card, the words lie over whatever is underneath.
   */
  cardColor?: string;
  /** 0-1; absent is fully opaque. */
  cardOpacity?: number;
  cardEffect?: TextCardEffect;
  /** Transition In animation for text overlay */
  transitionIn?: 'none' | 'fade' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right' | 'zoom' | 'zoom-in' | 'zoom-out' | 'typewriter' | 'wipe';
  transitionInDuration?: number;
  /** Transition Out animation for text overlay */
  transitionOut?: 'none' | 'fade' | 'slide-down' | 'slide-up' | 'slide-left' | 'slide-right' | 'zoom' | 'zoom-in' | 'zoom-out';
  transitionOutDuration?: number;
}

export interface TimelineItem {
  id: string;
  type: TimelineItemType;
  trackId: string;
  startTime: number;
  duration: number;
  src: string;
  name?: string;
  transform?: TimelineItemTransform;
  textStyle?: TimelineItemTextStyle;
  volume?: number;
  muted?: boolean;
  trimStartSeconds?: number;
  trimEndSeconds?: number;
  duckMode?: 'Normal' | 'Ducked' | 'MuteOnAudio' | 'LeadVoice';
  musicVolumeOverride?: number | null;
  /**
   * Image, overlay-video and text lanes only: how many V1 clips play before this item. The
   * item takes its own slot in the sequence there instead of playing over a clip, and
   * `startTime` is derived from it. See sequence-slots.ts.
   */
  slotIndex?: number;
  /** Type 'celebration' on FX1: the kind is `src`; how many, how big and how fast are here. */
  celebration?: TimelineCelebration;
  /**
   * Text only. Off (the default): the text takes its own slot in the sequence, on its card.
   * On: it plays over whatever image or video is under it, for its own start and length,
   * and takes no slot - nothing moves to make room.
   */
  overlay?: boolean;
}

/** Mirrors CelebrationRequest on the server; see features/clips/services/celebration.ts. */
export interface TimelineCelebration {
  mode?: 'burst' | 'rain';
  density?: number;
  size?: number;
  speed?: number;
}

export interface TrackControlState {
  id: string;
  name: string;
  label: string;
  kind: 'text' | 'image' | 'video' | 'audio';
  visible: boolean;
  muted: boolean;
  locked: boolean;
  color: string;
}

/** Pace and finish of a batch of auto shorts; Mixed lets each short pick its own. */
export const AUTO_SHORT_STYLES = ['Mixed', 'Energetic', 'Cinematic', 'Calm'] as const;
export type AutoShortStyle = (typeof AUTO_SHORT_STYLES)[number];

/** How the batch's lines go on screen. */
export const AUTO_SHORT_TEXT_MODES = ['None', 'Hook', 'PerShot', 'HookAndPerShot'] as const;
export type AutoShortTextMode = (typeof AUTO_SHORT_TEXT_MODES)[number];

/** Several different shorts cut automatically from the chosen clips, pictures and lines. */
export interface AutoShortsBody {
  sourceAssetIds: string[];
  lines: string[];
  musicAssetIds: string[];
  count: number;
  targetSeconds: number;
  style: AutoShortStyle;
  textMode: AutoShortTextMode;
  transitions: boolean;
  motion: boolean;
  keepClipAudio: boolean;
  exportName?: string | null;
  width: number;
  height: number;
  fit: ClipFit;
  quality: ExportQuality;
  watermark: WatermarkBody;
  includeOutro: boolean;
  seed?: number | null;
  /** Copy each short to Google Drive as soon as it has rendered - on the server. */
  saveToDrive?: boolean;
  /** Whose Drive and folder; null is the personal Drive. */
  driveChannelId?: string | null;
  /** A folder for this batch; empty uses the channel's (or the Drive's) default. */
  driveFolderName?: string | null;
}

export interface ClipMergeBody {
  exportName?: string;
  assetIds: string[];
  fit: ClipFit;
  /** #rrggbb fill for the Contain bars; omitted is black. */
  backgroundColor?: string | null;
  outputWidth?: number;
  outputHeight?: number;
  quality?: ExportQuality;
  transition: string;
  transitionSeconds: number;
  /** One entry per gap between clips; omitted or empty means every gap uses the default. */
  junctions?: ClipJunctionBody[] | null;
  muteClipAudio: boolean;
  backgroundMusicAssetId?: string | null;
  backgroundMusicVolume: number;
  musicTracks: TimedMusicClipBody[];
  /** One entry per clip in the cut; omitted means every clip plays as recorded. */
  clipAudio?: ClipAudioBody[] | null;
  watermark: WatermarkBody;
  /** End with the saved outro or QR end card (Admin &gt; Branding, or the project's own). */
  includeOutro?: boolean;
  /** Seconds to hold the last frame before the end card, so it starts after music/text that runs on. */
  outroHoldSeconds?: number;
  /** Level the finished mix to YouTube's -14 LUFS. */
  youTubeLoudness?: boolean;
  timelineItems?: TimelineItem[] | null;
  /**
   * Stretches where the music must drop under the clips above it. Ducking the music cannot be
   * folded into a clip's own volume, so the server builds a gain envelope from these.
   */
  musicDuckWindows?: MusicDuckWindowBody[] | null;
  /**
   * Blank stretches the cut opens for images, overlay videos and text that take their own
   * slot, which the export then draws into. Omitted means the clips play back to back.
   */
  slots?: ClipSlotBody[] | null;
}

/** A blank stretch in the cut, played before clip `beforeClipIndex` (the clip count = after the last). */
export interface ClipSlotBody {
  beforeClipIndex: number;
  seconds: number;
}

/** One stretch of the finished timeline over which the music plays at a reduced level. */
export interface MusicDuckWindowBody {
  startSeconds: number;
  endSeconds: number;
  /** Multiplier applied to the music across the window, 0-1. */
  level: number;
}
// --- option lists, kept beside the models so a select and its API value cannot drift ---

export const BACKGROUND_EFFECTS = [
  'None', 'ZoomIn', 'ZoomOut', 'PanLeft', 'PanRight', 'PanUp', 'PanDown',
] as const;

export const EASINGS = ['Linear', 'EaseInOut'] as const;

export const TRANSITIONS = [
  'None', 'Fade', 'Dissolve', 'WipeLeft', 'WipeRight',
  'SlideLeft', 'SlideRight', 'CircleOpen', 'CircleClose',
] as const;

export const ANCHORS = [
  'BottomLeft', 'BottomCenter', 'BottomRight', 'Center', 'CenterLeft', 'CenterRight',
] as const;

export const ENTRANCES = [
  'None', 'FadeIn', 'SlideFromLeft', 'SlideFromRight', 'SlideFromBottom',
] as const;

export const DISTRIBUTION_INTENTS = ['Personal', 'Public', 'Monetized'] as const;

/**
 * Canvas presets, named for where the video is GOING rather than for its arithmetic.
 *
 * "1080x1920" is a fact about a canvas; "YouTube Short" is the reason anyone picks it.
 * The numbers are still shown beside each one, because they are what a phone recording
 * has to be checked against.
 */
export const CANVAS_PRESETS = [
  { label: 'Video — landscape, for YouTube', width: 1920, height: 1080 },
  { label: 'Video — landscape, 720p', width: 1280, height: 720 },
  { label: 'Short — upright, for YouTube Shorts, Reels and TikTok', width: 1080, height: 1920 },
  { label: 'Square — for a feed post', width: 1080, height: 1080 },
] as const;

/**
 * What a finished video IS, read off its shape.
 *
 * Derived, never stored. The shape of the canvas is the only thing that decides which
 * shelf a video lands on, so a stored label could only ever disagree with it - resize a
 * project and a stored tag would be a lie, while this cannot be.
 */
export type VideoFormat = 'Short' | 'Video' | 'Square';

/**
 * How long a Short may run.
 *
 * YouTube treats an upright or square video of three minutes or less as a Short; past
 * that it is published as an ordinary video, whatever shape it is. The ceiling was sixty
 * seconds until YouTube raised it in October 2024.
 */
export const SHORTS_MAX_SECONDS = 180;

export function videoFormat(width: number, height: number): VideoFormat {
  if (height > width) return 'Short';
  if (height === width) return 'Square';
  return 'Video';
}

/**
 * The shape as a ratio: "16:9", "9:16", "4:5".
 *
 * Reduced by the greatest common divisor, so it reports what the canvas actually is
 * rather than what it was probably meant to be. An awkward size that reduces to nothing
 * legible falls back to a decimal, because "1001:500" tells a reader less than "2.00:1".
 */
export function aspectRatioLabel(width: number, height: number): string {
  if (width <= 0 || height <= 0) return '';

  const divisor = greatestCommonDivisor(width, height);
  const w = width / divisor;
  const h = height / divisor;

  if (w <= 50 && h <= 50) return `${w}:${h}`;

  return `${(width / height).toFixed(2)}:1`;
}

/** "Short · 9:16" - the tag shown wherever a project or a render is listed. */
export function videoFormatTag(width: number, height: number): string {
  return `${videoFormat(width, height)} · ${aspectRatioLabel(width, height)}`;
}

function greatestCommonDivisor(a: number, b: number): number {
  return b === 0 ? a : greatestCommonDivisor(b, a % b);
}

// --- bundle import (the no-AI path: one .zip with sheets, images and audio) ---

export type ImportAction = 'Create' | 'Update' | 'Conflict' | 'Unchanged';

export interface ImportRowPlan {
  sheet: string;
  rowNumber: number;
  key: string;
  action: ImportAction;
  detail: string;
}

export interface ImportSheetPlan {
  sheet: string;
  create: number;
  update: number;
  conflict: number;
  unchanged: number;
  rows: ImportRowPlan[];
}

/** A cell that could not be read, addressed the way the spreadsheet shows it. */
export interface WorkbookCellError {
  sheet: string;
  row: number;
  column: string | null;
  code: string;
  message: string;
}

export interface BundlePreview {
  previewToken: string;
  expiresAtUtc: string;
  sheets: ImportSheetPlan[];
  errors: WorkbookCellError[];
  warnings: string[];
  mediaFilesUsed: number;
  mediaFilesUnused: number;
  hasTranscript: boolean;
  canApply: boolean;
}

export interface BundleApplyBody {
  previewToken: string;
  overwriteUserEdits: boolean;
  removeMissingScenes: boolean;
}

export interface BundleImportResult {
  charactersCreated: number;
  charactersUpdated: number;
  scenesCreated: number;
  scenesUpdated: number;
  scenesRemoved: number;
  assetsCreated: number;
  dialogueLines: number;
  projectUpdated: boolean;
  warnings: string[];
}

// --- AI provider status, for the admin screen ---

export interface AiCapabilityStatus {
  capability: string;
  providerId: string | null;
  model: string | null;
  available: boolean;
  reason: string;
  dailyRemaining: number | null;
  chain: string[];
}

export interface AiCapabilities {
  capabilities: AiCapabilityStatus[];
}

// --- running the server -----------------------------------------------------------------

/** Whether this browser may change the server's settings, and why not when it may not. */
export interface AdminAccess {
  mode: 'Disabled' | 'LocalOnly' | 'Jwt';
  canAdminister: boolean;
  explanation: string;
}

/**
 * What the console is allowed to know about an installed key: enough to prove which key is
 * in place, never enough to use it. There is deliberately no field a key could arrive in.
 */
export interface AdminKey {
  configured: boolean;
  source: 'None' | 'Database' | 'Configuration';
  masked: string;
  fingerprint: string | null;
  createdAt: string | null;
  rotatedAt: string | null;
}

export interface AdminProvider {
  id: string;
  displayName: string;
  capability: string;
  family: string;
  runsLocally: boolean;
  requiresApiKey: boolean;
  freeTierNote: string;
  keyUrl: string | null;

  enabled: boolean;
  model: string | null;
  baseUrl: string | null;
  dailyRequestLimit: number | null;
  monthlyRequestLimit: number | null;
  timeoutSeconds: number | null;
  supportsJsonMode: boolean;

  /** True once it has been saved here, at which point these values beat appsettings.json. */
  managedHere: boolean;

  key: AdminKey;
  ready: boolean;
  readyReason: string;
  dailyRemaining: number | null;
  chainPosition: number | null;

  /** A provider that is a program on this machine. Its paths are shown, never editable. */
  needsExecutable: boolean;
  executableConfigured: boolean;
  modelFolderConfigured: boolean;

  defaultBaseUrl: string | null;
  defaultModel: string | null;
}

export interface AdminChain {
  capability: string;
  providerIds: string[];
  managedHere: boolean;
  candidates: string[];
}

export interface AdminProviders {
  providers: AdminProvider[];
  chains: AdminChain[];
  hostAllowlist: string[];
  encryptionConfigured: boolean;
}

export interface AdminProviderTest {
  providerId: string;
  healthy: boolean;
  reason: string | null;
}

export interface AdminProviderBody {
  enabled: boolean;
  model: string | null;
  baseUrl: string | null;
  dailyRequestLimit: number | null;
  monthlyRequestLimit: number | null;
  timeoutSeconds: number | null;
  supportsJsonMode: boolean | null;
}

export interface AdminUsageRow {
  day: string;
  providerId: string;
  capability: string;
  requests: number;
  units: number;
  cacheHits: number;
  failures: number;
}

export interface AdminUsage {
  fromDay: string;
  toDay: string;
  rows: AdminUsageRow[];
}

export type HealthState = 'Ok' | 'Degraded' | 'Missing' | 'Failed';

export interface AdminHealthProbe {
  key: string;
  displayName: string;
  state: HealthState;
  detail: string | null;
  advice: string | null;
  required: boolean;
}

export interface AdminHealth {
  healthy: boolean;
  checkedAtUtc: string;
  probes: AdminHealthProbe[];
}

export interface AdminJob {
  id: string;
  projectId: string;
  projectName: string | null;
  status: string;
  progress: number;
  message: string | null;
  stage: string;
  scenesTotal: number;
  scenesDone: number;
  attempts: number;
  errorCode: string | null;
  errorMessage: string | null;
  hasOutput: boolean;
  isTerminal: boolean;
  createdAt: string;
  completedAt: string | null;
}

export interface AdminAuditEntry {
  action: string;
  target: string | null;
  actorUserId: string | null;
  remoteAddress: string | null;
  before: string | null;
  after: string | null;
  atUtc: string;
}


export interface HubPreset {
  label: string;
  width: number;
  height: number;
}

export interface HubTemplate {
  id: string;
  name: string;
  wireframeClass: string;
  tags: string[];
}

export interface HubQuickStart {
  id: string;
  icon: string;
  label: string;
  tooltip: string;
}

export interface HubConfig {
  id: string;
  storageUsedGb: number;
  storageTotalGb: number;
  presets: HubPreset[];
  templates: HubTemplate[];
  quickStarts: HubQuickStart[];
}

/** How full the media store is. Mirrors StorageSummaryResponse. */
export interface StorageSummary {
  provider: string;
  isMeasurable: boolean;
  usedBytes: number;
  /** What the bar fills against: the admin's quota, else the drive's size. */
  capacityBytes: number | null;
  capacitySource: 'quota' | 'disk' | 'none';
  measuredAt: string;
}

export interface StorageFolder { name: string; bytes: number; files: number; }

/** The settings page's view of storage. Mirrors StorageDetailResponse. */
export interface StorageDetail {
  summary: StorageSummary;
  quotaGb: number | null;
  fileCount: number;
  diskTotalBytes: number | null;
  diskFreeBytes: number | null;
  folders: StorageFolder[];
}

/** "1.4 GB", "820 MB" - binary units, as the server counts them. */
export function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null || !Number.isFinite(bytes)) return '—';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let v = Math.max(0, bytes), i = 0;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
  return `${v >= 100 || i === 0 ? v.toFixed(0) : v.toFixed(1)} ${units[i]}`;
}

// --- cuts: several videos / Shorts per project, each with its own editor timeline ---

export type EditFormat = 'Video' | 'Short' | 'Square';

/** One cut of a project, as the "Videos & Shorts" page lists it. Mirrors ProjectEdit. */
export interface ProjectEdit {
  id: string;
  name: string;
  format: EditFormat;
  category: string | null;
  tags: string[];
  durationSeconds: number;
  clipCount: number;
  thumbnailAssetId: string | null;
  sourceEditId: string | null;
  /** Set until the editor has trimmed a copied timeline down to the chosen part. */
  pendingRangeStart: number | null;
  pendingRangeEnd: number | null;
  createdAt: string;
  updatedAt: string;
  /** Its place in the project, in the order videos were made (#1, #2...); never reused. */
  number: number;
  /** Library videos the timeline starts with, until the editor first saves it. */
  initialAssetIds: string[];
  /** Exported or not, on YouTube or not. */
  publish: EditPublishInfo;
  /** Only on a single-cut fetch. */
  draftJson?: string | null;
}

export type EditExportState = 'NotExported' | 'Exporting' | 'Exported' | 'Failed';
/** Uploaded = from the app (found through an export); MarkedUploaded = the user said so. */
export type EditYouTubeState = 'NotUploaded' | 'Uploaded' | 'MarkedUploaded';

export interface EditPublishInfo {
  exportState: EditExportState;
  lastExportedAt: string | null;
  youTubeState: EditYouTubeState;
  youTubeVideoId: string | null;
  youTubeUrl: string | null;
  youTubeHealth: string | null;
  uploadedAt: string | null;
}

export interface EditStatusBadge {
  /** CSS modifier: yt | yt-marked | exported | exporting | failed | none */
  kind: 'yt' | 'yt-marked' | 'exported' | 'exporting' | 'failed' | 'none';
  label: string;
  title: string;
}

/** One badge saying how far a video got: on YouTube, exported, or not yet. */
export function editStatusBadge(e: ProjectEdit): EditStatusBadge {
  const p = e.publish;
  if (!p) return { kind: 'none', label: 'Not exported', title: 'Not exported yet' };
  if (p.youTubeState === 'Uploaded') {
    const issue = p.youTubeHealth && p.youTubeHealth !== 'Ok' && p.youTubeHealth !== 'Processing' ? ` (${p.youTubeHealth})` : '';
    return { kind: 'yt', label: `On YouTube${issue}`, title: 'Uploaded to YouTube from AnimStudio' };
  }
  if (p.youTubeState === 'MarkedUploaded') {
    return { kind: 'yt-marked', label: 'On YouTube', title: 'You marked this as uploaded to YouTube' };
  }
  switch (p.exportState) {
    case 'Exported': return { kind: 'exported', label: 'Exported', title: 'Exported, not on YouTube yet' };
    case 'Exporting': return { kind: 'exporting', label: 'Exporting…', title: 'An export is running' };
    case 'Failed': return { kind: 'failed', label: 'Export failed', title: 'The last export failed' };
    default: return { kind: 'none', label: 'Not exported', title: 'Not exported or uploaded yet' };
  }
}

/**
 * The next "Short 7" / "Video 3" style number: one past the highest already used, so a
 * deleted "Short 5" never comes back as a second "Short 5" next to a newer one.
 */
export function nextEditNumber(format: EditFormat, taken: { name: string }[]): number {
  const prefix = editNamePrefix(format).toLowerCase();
  let max = 0;
  for (const e of taken) {
    const m = /^(\S+)\s+(\d+)\b/.exec(e.name.trim().toLowerCase());
    if (m && m[1] === prefix) max = Math.max(max, Number(m[2]));
  }
  return max + 1;
}

export function editNamePrefix(format: EditFormat): string {
  return format === 'Short' ? 'Short' : format === 'Square' ? 'Square' : 'Video';
}

export function nextEditName(format: EditFormat, taken: { name: string }[]): string {
  return `${editNamePrefix(format)} ${nextEditNumber(format, taken)}`;
}

/** Whether another video of the project already uses this name (trimmed, case ignored). */
export function editNameTaken(name: string, edits: { id: string; name: string }[], exceptId?: string): boolean {
  const key = name.trim().toLowerCase();
  return !!key && edits.some((e) => e.id !== exceptId && e.name.trim().toLowerCase() === key);
}

export type CreateEditMode = 'Blank' | 'Copy' | 'Range';

export interface CreateEditBody {
  name: string;
  format: EditFormat;
  category?: string | null;
  tags?: string[];
  mode: CreateEditMode;
  sourceEditId?: string | null;
  rangeStart?: number | null;
  rangeEnd?: number | null;
  /** Blank only: library videos the timeline starts with, in this order. */
  initialAssetIds?: string[];
}

export interface UpdateEditBody {
  name?: string;
  format?: EditFormat;
  category?: string;
  tags?: string[];
}

export interface SaveEditDraftBody {
  draftJson: string;
  durationSeconds: number;
  clipCount: number;
  thumbnailAssetId?: string | null;
  clearPendingRange?: boolean;
}

/** Output size per format, matching the editor's export presets. */
export const EDIT_FORMATS: { value: EditFormat; label: string; ratio: string; width: number; height: number }[] = [
  { value: 'Video', label: 'Video', ratio: '16:9', width: 1920, height: 1080 },
  { value: 'Short', label: 'Short / Reel', ratio: '9:16', width: 1080, height: 1920 },
  { value: 'Square', label: 'Square', ratio: '1:1', width: 1080, height: 1080 },
];

/** Suggested categories; any text is allowed. */
export const EDIT_CATEGORY_SUGGESTIONS = ['Full video', 'Short', 'Teaser', 'Highlight', 'Trailer', 'Reel', 'Clip'];
