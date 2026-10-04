import { ERASE_DEFAULT_FEATHER, EraseRegion } from '../../../core/models/api.models';

/** A rectangle in percent of the clip's source frame. */
export interface EraseRect { x: number; y: number; width: number; height: number; }

/**
 * The box grown by its feather - the area actually redrawn. Mirrors
 * EraseRegionSpec.Outer() so the preview fades exactly where the export does.
 */
export function eraseOuter(r: EraseRegion): EraseRect {
  // A fill is a plain drawbox in the export: hard-edged, never grown.
  const feather = r.style === 'Fill' ? 0 : r.feather ?? ERASE_DEFAULT_FEATHER;
  const mx = (r.width * feather) / 200;
  const my = (r.height * feather) / 200;
  const x = Math.max(0, r.x - mx);
  const y = Math.max(0, r.y - my);
  return { x, y, width: Math.min(100, r.x + r.width + mx) - x, height: Math.min(100, r.y + r.height + my) - y };
}

/**
 * Top-left of the footage a patch copies over eraseOuter(r): the same-sized area one
 * full box away. Mirrors EraseRegionSpec.PatchOrigin().
 */
export function erasePatchOrigin(r: EraseRegion): { x: number; y: number } {
  const o = eraseOuter(r);
  const room = {
    Above: { x: o.x, y: o.y - o.height, fits: o.y - o.height >= 0 },
    Below: { x: o.x, y: o.y + o.height, fits: o.y + 2 * o.height <= 100 },
    Left: { x: o.x - o.width, y: o.y, fits: o.x - o.width >= 0 },
    Right: { x: o.x + o.width, y: o.y, fits: o.x + 2 * o.width <= 100 },
  } as const;

  let side = r.source ?? 'Auto';
  if (side === 'Auto') {
    side = (['Above', 'Below', 'Left', 'Right'] as const).find((s) => room[s].fits)
      ?? (o.y >= 100 - o.y - o.height ? 'Above' : 'Below');
  }
  const p = room[side];
  return {
    x: Math.max(0, Math.min(100 - o.width, p.x)),
    y: Math.max(0, Math.min(100 - o.height, p.y)),
  };
}

/**
 * CSS mask that fades the grown box across its margins only - opaque over the box itself,
 * and no fade on a side pinned against the frame edge. Null when nothing fades.
 */
export function eraseFeatherMask(r: EraseRegion): string | null {
  const o = eraseOuter(r);
  const left = ((r.x - o.x) / o.width) * 100;
  const right = ((o.x + o.width - (r.x + r.width)) / o.width) * 100;
  const top = ((r.y - o.y) / o.height) * 100;
  const bottom = ((o.y + o.height - (r.y + r.height)) / o.height) * 100;
  if (left + right + top + bottom < 0.01) return null;
  const h = `linear-gradient(to right, transparent 0%, #000 ${left}%, #000 ${100 - right}%, transparent 100%)`;
  const v = `linear-gradient(to bottom, transparent 0%, #000 ${top}%, #000 ${100 - bottom}%, transparent 100%)`;
  return `${h}, ${v}`;
}
