import { TimelineItemTransform } from '../../core/models/api.models';
import { EffectClip } from '../../core/models/effects.models';

/** Where the user asked for the effect: at the needle, or finishing with the video. */
export type EffectPlacementMode = 'playhead' | 'end';

export interface EffectPlacement {
  /** Lane the effect goes on: V2 for pictures, A1/A2 for sounds. */
  trackId: 'V2' | 'A1' | 'A2';
  /** Seconds on the timeline. */
  start: number;
  /** Transform patch for picture effects; undefined for sounds. */
  transform?: Partial<TimelineItemTransform>;
}

/** Pure green; what a green-screen effect is keyed on until the user picks another colour. */
export const DEFAULT_CHROMA_KEY = { enabled: true, color: '#00ff00', similarity: 0.3, blend: 0.1 } as const;

/**
 * Where an effect lands and how it is framed. Pictures go full-frame on the V2 overlay lane
 * (subscribe buttons, stingers, end screens and green-screen clips are made for the whole
 * frame); sounds go on the voiceover lane, or the music bed when it is busy there. An end
 * screen asked for "at the end" finishes when the video does.
 */
export function planEffectPlacement(
  effect: Pick<EffectClip, 'kind' | 'category' | 'durationSeconds' | 'isGreenScreen' | 'hasAlpha'>,
  mode: EffectPlacementMode,
  playhead: number,
  timelineEnd: number,
  imageSeconds: number,
): EffectPlacement {
  const length = effect.kind === 'Image' ? imageSeconds : Math.max(0.1, effect.durationSeconds ?? imageSeconds);
  const end = Math.max(0, timelineEnd);
  const start = mode === 'end'
    ? Math.max(0, end - length)
    : Math.max(0, Math.min(playhead, end > 0 ? end : playhead));

  if (effect.kind === 'Audio') {
    return { trackId: 'A1', start };
  }

  // Cuts in and out on its own animation: a stinger or button that fades too looks muddy.
  const hardCut = effect.category === 'Transition' || effect.category === 'Subscribe' || effect.category === 'LogoReveal' || effect.hasAlpha;
  const transform: Partial<TimelineItemTransform> = {
    widthPercent: 100,
    x: 0,
    y: 0,
    opacity: 1,
    transitionIn: hardCut ? 'none' : 'fade',
    transitionOut: hardCut ? 'none' : 'fade',
  };
  if (effect.isGreenScreen) transform.chromaKey = { ...DEFAULT_CHROMA_KEY };

  return { trackId: 'V2', start, transform };
}
