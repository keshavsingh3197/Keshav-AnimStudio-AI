export interface TransitionPreviewFrame {
  opacity: number;
  transform: string;
  clipPath: string;
  filter: string;
  zIndex: number;
}

/** CSS stand-ins for xfade, shared by the monitor and the scrubbed transition dialog. */
export function transitionPreviewFrame(kind: string, progress: number, incoming: boolean): TransitionPreviewFrame {
  const p = Math.max(0, Math.min(1, progress));
  const frame: TransitionPreviewFrame = {
    opacity: 1, transform: 'none', clipPath: 'none', filter: 'none', zIndex: incoming ? 2 : 1,
  };
  switch (kind) {
    case 'None':
      frame.opacity = incoming ? Number(p >= 0.5) : Number(p < 0.5);
      break;
    case 'Fade':
    case 'Dissolve':
      if (incoming) frame.opacity = p;
      break;
    case 'Blur':
      frame.filter = `blur(${(Math.sin(Math.PI * p) * 18).toFixed(3)}px)`;
      if (incoming) frame.opacity = p;
      break;
    case 'FadeBlack':
    case 'FadeWhite': {
      const dip = 1 - Math.abs(2 * p - 1);
      frame.opacity = Number(incoming ? p >= 0.5 : p < 0.5);
      frame.filter = kind === 'FadeBlack'
        ? `brightness(${1 - dip})`
        : `contrast(${1 - dip}) brightness(${1 + dip})`;
      break;
    }
    case 'SlideLeft':
    case 'SlideRight':
    case 'SlideUp':
    case 'SlideDown': {
      const axis = kind === 'SlideLeft' || kind === 'SlideRight' ? 'X' : 'Y';
      const sign = kind === 'SlideLeft' || kind === 'SlideUp' ? -1 : 1;
      frame.transform = `translate${axis}(${sign * (incoming ? p - 1 : p) * 100}%)`;
      break;
    }
    case 'WipeLeft':
      if (incoming) frame.clipPath = `inset(0 0 0 ${(1 - p) * 100}%)`;
      break;
    case 'WipeRight':
      if (incoming) frame.clipPath = `inset(0 ${(1 - p) * 100}% 0 0)`;
      break;
    case 'DiagonalWipe':
      if (incoming) {
        const edge = (1 - p) * 200;
        frame.clipPath = edge >= 100
          ? `polygon(100% ${edge - 100}%, 100% 100%, ${edge - 100}% 100%)`
          : `polygon(0 ${edge}%, ${edge}% 0, 100% 0, 100% 100%, 0 100%)`;
      }
      break;
    case 'CircleOpen':
      if (incoming) frame.clipPath = `circle(${p * 71}% at 50% 50%)`;
      break;
    case 'CircleClose':
      frame.zIndex = incoming ? 1 : 2;
      if (!incoming) frame.clipPath = `circle(${(1 - p) * 71}% at 50% 50%)`;
      break;
    case 'CircleCrop':
      frame.opacity = Number(incoming ? p >= 0.5 : p < 0.5);
      frame.clipPath = `circle(${Math.abs(2 * p - 1) * 71}% at 50% 50%)`;
      break;
    case 'ZoomIn':
      frame.transform = `scale(${incoming ? 0.6 + p * 0.4 : 1 + p * 0.5})`;
      if (incoming) frame.opacity = p;
      break;
    default:
      throw new RangeError(`Unknown transition: ${kind}`);
  }
  return frame;
}
