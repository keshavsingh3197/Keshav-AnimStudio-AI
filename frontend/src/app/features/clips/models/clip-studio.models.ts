import { Clip } from '../../../core/models/api.models';

export interface ClipRow {
  clip: Clip;
  included: boolean;
}

export interface JunctionSetting {
  transition: string;
  seconds: number;
}

export interface JunctionView {
  key: string;
  left: Clip;
  right: Clip;
  transition: string;
  seconds: number;
}

export type SideUploadTarget =
  | { kind: 'logo' }
  | { kind: 'music' }
  | { kind: 'clip'; clipId: string };

/**
 * How a video clip's own sound and the music underneath it share the mix while they
 * overlap. One vocabulary, used identically at project, music-track and clip level;
 * `resolveOverlap()` in StudioStateService is the only place precedence is decided.
 */
export type AudioOverlapRule = 'PlayBoth' | 'DuckMusic' | 'DuckVideo' | 'MusicOnly';

/** The same rule where a lower level may defer to the one above it. */
export type AudioOverlapRuleOrInherit = AudioOverlapRule | 'Inherit';

/** Which level of the precedence chain actually decided the rule in force. */
export type AudioOverlapSource = 'clip' | 'track' | 'project';

export interface AudioOverlapChoice {
  id: AudioOverlapRule;
  label: string;
  hint: string;
}

/** Presented in this order everywhere the rule is offered, so the control never moves. */
export const AUDIO_OVERLAP_CHOICES: readonly AudioOverlapChoice[] = [
  { id: 'PlayBoth', label: 'Play both', hint: 'Clip sound and music both stay at their own level.' },
  { id: 'DuckMusic', label: 'Duck music', hint: 'Music drops to the duck level so the clip is heard over it.' },
  { id: 'DuckVideo', label: 'Duck video', hint: 'Clip sound drops to the duck level so the music leads.' },
  { id: 'MusicOnly', label: 'Music only', hint: 'Clip sound is silenced wherever music plays under it.' },
];

export interface ClipAudioSetting {
  volume: number;
  audioAssetId: string;
  audioVolume: number;
  keepOriginalAudio: boolean;
  audioTrimStartSeconds?: number;
  audioTrimEndSeconds?: number;
  /** How this clip shares the mix with music under it. Absent or 'Inherit' defers upward. */
  overlapRule?: AudioOverlapRuleOrInherit;
  /**
   * Duck depth for this clip alone, 0-1, overriding the project duck level. Only read
   * when the resolved rule is DuckMusic or DuckVideo.
   */
  duckLevelOverride?: number | null;
  /** @deprecated Superseded by overlapRule; read once on load to migrate old drafts. */
  duckMode?: 'Normal' | 'Ducked' | 'MuteOnAudio' | 'LeadVoice';
  /** @deprecated Superseded by overlapRule + duckLevelOverride. */
  musicVolumeOverride?: number | null;
}

export interface MusicTrackRow {
  key: string;
  assetId: string;
  startSeconds: number;
  volume: number;
  trimStartSeconds: number | null;
  trimEndSeconds: number | null;
  fadeInSeconds?: number;
  fadeOutSeconds?: number;
  muted?: boolean;
  /** How clips under this track share the mix with it. Absent or 'Inherit' defers to the project. */
  overlapRule?: AudioOverlapRuleOrInherit;
  /** @deprecated Superseded by overlapRule; read once on load to migrate old drafts. */
  clipAudioMode?: 'MuteUnderMusic' | 'KeepAudio' | 'Ducked' | 'Default';
}

/** Lines placed by the Voiceover panel. They share A1 with music but preview on their own player. */
export function isVoiceoverTrack(track: MusicTrackRow): boolean {
  return track.key.startsWith('vo_');
}

export interface ScheduledClip {
  clip: Clip;
  index: number;
  startSeconds: number;
  endSeconds: number;
  durationSeconds: number;
  junctionTransition: string;
  junctionSeconds: number;
  row?: ClipRow;
  rowIndex?: number;
  /**
   * Extra seconds borrowed from spare footage BEFORE trimStart (head extension for the
   * incoming transition from the previous clip). Zero when this is the first clip or when
   * the junction has no transition.
   */
  leadInSeconds: number;
  /**
   * Extra seconds borrowed from spare footage AFTER trimEnd (tail extension for the
   * outgoing transition to the next clip). Zero when this is the last clip or when the
   * junction has no transition.
   */
  tailOutSeconds: number;
  /**
   * True when leadInSeconds could not be satisfied from spare media and the conform pass
   * must freeze the first frame instead of reading real footage.
   */
  freezeHead: boolean;
  /**
   * True when tailOutSeconds could not be satisfied from spare media and the conform pass
   * must freeze the last frame instead of reading real footage.
   */
  freezeTail: boolean;
}

export interface FilterPreset {
  id: string;
  label: string;
  filter: string;
  swatch: string;
}

export interface ClipColorSetting {
  filter: string;
  brightness: number;
  contrast: number;
  saturation: number;
  sepia: number;
  blur: number;
}

export interface ClipTextSetting {
  enabled: boolean;
  title: string;
  subtitle: string;
}

export const FILTER_PRESETS: readonly FilterPreset[] = [
  { id: 'none', label: 'Natural', filter: 'none', swatch: '#64748b' },
  { id: 'warm', label: 'Cinematic Warm', filter: 'sepia(0.2) contrast(1.1) brightness(1.04)', swatch: '#d97706' },
  { id: 'cool', label: 'Cool Sci-Fi', filter: 'hue-rotate(185deg) contrast(1.15)', swatch: '#0284c7' },
  { id: 'vivid', label: 'Vivid Pop', filter: 'saturate(1.5) contrast(1.12)', swatch: '#16a34a' },
  { id: 'golden', label: 'Golden Hour', filter: 'sepia(0.35) saturate(1.3) contrast(1.05) brightness(1.05)', swatch: '#f59e0b' },
  { id: 'teal-orange', label: 'Teal & Orange', filter: 'contrast(1.2) saturate(1.3) hue-rotate(-15deg)', swatch: '#0d9488' },
  { id: 'cyberpunk', label: 'Cyberpunk', filter: 'hue-rotate(280deg) saturate(1.7) contrast(1.25)', swatch: '#a855f7' },
  { id: 'noir', label: 'Film Noir', filter: 'grayscale(1) contrast(1.35) brightness(0.95)', swatch: '#1e293b' },
  { id: 'vintage', label: 'Faded 90s', filter: 'sepia(0.3) saturate(0.85) contrast(0.95) brightness(1.08)', swatch: '#b45309' },
];

export const TRACK_COLORS = {
  V1: '#3b82f6',
  IMG1: '#10b981',
  V2: '#06b6d4',
  V3: '#10b981',
  TXT1: '#f59e0b',
  A1: '#8b5cf6',
  A2: '#a855f7',
  Master: '#6c8cff',
} as const;

export interface FileUploadConflict {
  file: File;
  existingClipId: string;
  existingName: string;
  existingDuration?: number;
  existingSizeBytes?: number;
  existingType?: string;
  resolution: 'skip' | 'overwrite' | 'rename';
}

