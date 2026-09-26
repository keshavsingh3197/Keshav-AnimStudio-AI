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

export interface ClipAudioSetting {
  volume: number;
  audioAssetId: string;
  audioVolume: number;
  keepOriginalAudio: boolean;
  audioTrimStartSeconds?: number;
  audioTrimEndSeconds?: number;
  duckMode?: 'Normal' | 'Ducked' | 'MuteOnAudio' | 'LeadVoice';
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
}

export interface ScheduledClip {
  clip: Clip;
  index: number;
  startSeconds: number;
  endSeconds: number;
  durationSeconds: number;
  junctionTransition: string;
  junctionSeconds: number;
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

