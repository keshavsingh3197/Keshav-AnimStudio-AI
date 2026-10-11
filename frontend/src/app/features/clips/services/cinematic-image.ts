import { ImageCameraMotion, ImageLook } from '../../../core/models/api.models';

/**
 * Camera moves and grades for stills - the numbers the export draws with
 * (CinematicImageFilters.cs). Change a move here and it must change there, or the preview
 * stops being what the video will look like.
 */

export const IMAGE_MOTION_MIN = 0.02;
export const IMAGE_MOTION_MAX = 0.5;
export const IMAGE_MOTION_DEFAULT = 0.15;

export interface ImageMotionOption { id: ImageCameraMotion; label: string; icon: string; hint: string }
export interface ImageLookOption { id: ImageLook; label: string; swatch: string }

export const IMAGE_MOTIONS: readonly ImageMotionOption[] = [
  { id: 'none', label: 'Still', icon: '■', hint: 'No movement' },
  { id: 'zoom-in', label: 'Push in', icon: '⊕', hint: 'Slowly moves closer to the focus point' },
  { id: 'zoom-out', label: 'Pull out', icon: '⊖', hint: 'Starts close and reveals the whole picture' },
  { id: 'pan-left', label: 'Pan left', icon: '←', hint: 'Camera glides to the left' },
  { id: 'pan-right', label: 'Pan right', icon: '→', hint: 'Camera glides to the right' },
  { id: 'pan-up', label: 'Tilt up', icon: '↑', hint: 'Camera rises' },
  { id: 'pan-down', label: 'Tilt down', icon: '↓', hint: 'Camera lowers' },
  { id: 'drift', label: 'Drift', icon: '↗', hint: 'Diagonal push towards the focus point - very cinematic' },
  { id: 'handheld', label: 'Handheld', icon: '≈', hint: 'Gentle sway like a real camera operator' },
  { id: 'breathe', label: 'Breathe', icon: '◎', hint: 'Zooms in and back out once' },
];

export const IMAGE_LOOKS: readonly ImageLookOption[] = [
  { id: 'none', label: 'Original', swatch: 'linear-gradient(135deg,#888,#ccc)' },
  { id: 'cinematic', label: 'Cinematic', swatch: 'linear-gradient(135deg,#0f4c5c,#e36414)' },
  { id: 'warm', label: 'Golden', swatch: 'linear-gradient(135deg,#f4a259,#f9dc5c)' },
  { id: 'cool', label: 'Cool', swatch: 'linear-gradient(135deg,#3a86ff,#8ecae6)' },
  { id: 'vintage', label: 'Vintage', swatch: 'linear-gradient(135deg,#a68a64,#ede0d4)' },
  { id: 'noir', label: 'Noir', swatch: 'linear-gradient(135deg,#000,#bbb)' },
  { id: 'vivid', label: 'Vivid', swatch: 'linear-gradient(135deg,#ff006e,#8338ec)' },
  { id: 'matte', label: 'Matte', swatch: 'linear-gradient(135deg,#6c757d,#dee2e6)' },
];

/** Everything one still needs to become a shot. */
export interface CinematicImage {
  motion: ImageCameraMotion;
  intensity: number;
  easing: 'ease' | 'linear';
  /** Where a zoom heads, percent across and down the picture. */
  focusX: number;
  focusY: number;
  look: ImageLook;
  vignette: boolean;
  grain: boolean;
  cinemaBars: boolean;
}

export const DEFAULT_CINEMATIC: CinematicImage = {
  motion: 'zoom-in', intensity: IMAGE_MOTION_DEFAULT, easing: 'ease',
  focusX: 50, focusY: 50, look: 'none', vignette: false, grain: false, cinemaBars: false,
};

/** Varied moves in an order that never repeats back to back, for "Auto cinematic". */
const AUTO_SEQUENCE: readonly ImageCameraMotion[] = [
  'zoom-in', 'pan-right', 'drift', 'zoom-out', 'pan-left', 'breathe', 'pan-up', 'drift', 'zoom-in', 'pan-down',
];

export function autoMotion(index: number): ImageCameraMotion {
  return AUTO_SEQUENCE[index % AUTO_SEQUENCE.length];
}

/**
 * The visible window at progress p (0-1) and t seconds in: zoom, and where the crop sits as
 * a 0-1 share of the travel available at that zoom. Same closed forms as the zoompan step.
 */
export function cameraAt(s: CinematicImage, p: number, t: number): { z: number; cx: number; cy: number } {
  const q = s.easing === 'linear' ? p : p * p * (3 - 2 * p);
  const i = s.intensity;
  const fx = s.focusX / 100;
  const fy = s.focusY / 100;
  switch (s.motion) {
    case 'zoom-in': return { z: 1 + i * q, cx: fx, cy: fy };
    case 'zoom-out': return { z: 1 + i - i * q, cx: fx, cy: fy };
    case 'pan-left': return { z: 1 + i, cx: 1 - q, cy: fy };
    case 'pan-right': return { z: 1 + i, cx: q, cy: fy };
    case 'pan-up': return { z: 1 + i, cx: fx, cy: 1 - q };
    case 'pan-down': return { z: 1 + i, cx: fx, cy: q };
    case 'drift': return {
      z: 1 + i * (0.5 + 0.5 * q),
      cx: (1 - fx) * (1 - q) + fx * q,
      cy: (1 - fy) * (1 - q) + fy * q,
    };
    case 'handheld': return {
      z: 1 + i,
      cx: 0.5 + 0.32 * Math.sin(t * 1.13) + 0.18 * Math.sin(t * 2.71 + 1.3),
      cy: 0.5 + 0.3 * Math.sin(t * 0.87 + 2.1) + 0.2 * Math.sin(t * 2.23 + 0.4),
    };
    case 'breathe': return { z: 1 + i * 0.5 * (1 - Math.cos(2 * Math.PI * q)), cx: fx, cy: fy };
    default: return { z: 1, cx: 0.5, cy: 0.5 };
  }
}

/** CSS transform for a box with transform-origin 0 0 that shows the camera's window. */
export function cameraTransform(s: CinematicImage, p: number, t: number): string {
  const { z, cx, cy } = cameraAt(s, Math.min(1, Math.max(0, p)), t);
  const tx = -(z - 1) * cx * 100;
  const ty = -(z - 1) * cy * 100;
  return `translate(${tx.toFixed(3)}%, ${ty.toFixed(3)}%) scale(${z.toFixed(4)})`;
}

/** A close CSS stand-in for each grade; the export's colorbalance/curves are the truth. */
export function lookFilter(look: ImageLook): string {
  switch (look) {
    case 'cinematic': return 'contrast(1.08) saturate(1.12) hue-rotate(-6deg)';
    case 'warm': return 'sepia(0.22) saturate(1.15)';
    case 'cool': return 'hue-rotate(12deg) saturate(0.95) brightness(1.02)';
    case 'vintage': return 'sepia(0.45) contrast(0.95) saturate(0.85)';
    case 'noir': return 'grayscale(1) contrast(1.3) brightness(0.97)';
    case 'vivid': return 'saturate(1.4) contrast(1.06)';
    case 'matte': return 'contrast(0.84) brightness(1.04) saturate(0.85)';
    default: return 'none';
  }
}

/** Each cinema bar's height as a percent of the frame - 2.39:1 on a wide frame, 8% otherwise. */
export function cinemaBarPercent(width: number, height: number): number {
  const bar = width > height ? (height - width / 2.39) / 2 : height * 0.08;
  return Math.max(0, (bar / height) * 100);
}
