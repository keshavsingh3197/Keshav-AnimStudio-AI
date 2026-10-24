import { Asset } from './api.models';

/** Mirrors EffectCategory on the server; the server refuses anything else. */
export type EffectCategory =
  | 'Subscribe' | 'Transition' | 'EndScreen' | 'LowerThird' | 'Intro'
  | 'SoundEffect' | 'Overlay' | 'GreenScreen' | 'LogoReveal' | 'Other';

export type EffectKind = 'Image' | 'Video' | 'Audio';

/** One file in the user's effects library (EffectClipResponse). */
export interface EffectClip {
  id: string;
  name: string;
  category: EffectCategory;
  kind: EffectKind;
  tags: string[];
  durationSeconds?: number | null;
  width?: number | null;
  height?: number | null;
  hasAlpha: boolean;
  isGreenScreen: boolean;
  favorite: boolean;
  useCount: number;
  sizeBytes: number;
  contentType: string;
  hasThumbnail: boolean;
  createdAt: string;
  updatedAt: string;
  lastUsedAt?: string | null;
}

export interface EffectQuery {
  category?: EffectCategory | null;
  kind?: EffectKind | null;
  q?: string;
  favorites?: boolean;
}

export interface EffectUpload {
  file: File;
  name?: string;
  category?: EffectCategory | null;
  tags?: string[];
  isGreenScreen?: boolean;
}

/** A partial edit; absent fields stay as they are. */
export interface EffectUpdate {
  name?: string;
  category?: EffectCategory;
  tags?: string[];
  isGreenScreen?: boolean;
  favorite?: boolean;
}

/** What "use in this project" returns: the project asset the editor places. */
export interface EffectUseResult {
  asset: Asset;
  effect: EffectClip;
  reused: boolean;
}

export const EFFECT_CATEGORIES: readonly { id: EffectCategory; label: string; icon: string; hint: string }[] = [
  { id: 'Subscribe', label: 'Subscribe & like', icon: '🔔', hint: 'Subscribe, like and bell button animations' },
  { id: 'Transition', label: 'Transitions', icon: '⚡', hint: 'Stingers and wipes played over a cut' },
  { id: 'EndScreen', label: 'End screens', icon: '🏁', hint: 'Played at the very end of a video' },
  { id: 'LowerThird', label: 'Lower thirds', icon: '🏷', hint: 'Name and title bars' },
  { id: 'Intro', label: 'Intros', icon: '🎬', hint: 'Openers and channel idents' },
  { id: 'LogoReveal', label: 'Logo reveals', icon: '✴', hint: 'Animated logos' },
  { id: 'SoundEffect', label: 'Sound effects', icon: '🔊', hint: 'Whoosh, ding, pop' },
  { id: 'Overlay', label: 'Overlays', icon: '✨', hint: 'Light leaks, dust, frames' },
  { id: 'GreenScreen', label: 'Green screen', icon: '🟩', hint: 'Clips shot on green, keyed out over the video' },
  { id: 'Other', label: 'Other', icon: '📦', hint: 'Anything else' },
];

/** What the upload picker and the drop zone take; the server checks the bytes either way. */
export const EFFECT_ACCEPT = '.mp4,.webm,.mov,.png,.jpg,.jpeg,.webp,.mp3,.wav,.m4a,video/mp4,video/webm,video/quicktime,image/png,image/jpeg,image/webp,audio/mpeg,audio/wav,audio/mp4';

export function effectCategoryLabel(id: EffectCategory): string {
  return EFFECT_CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

export function effectCategoryIcon(id: EffectCategory): string {
  return EFFECT_CATEGORIES.find((c) => c.id === id)?.icon ?? '📦';
}
