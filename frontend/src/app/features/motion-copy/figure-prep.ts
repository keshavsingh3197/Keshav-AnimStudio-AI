import { VisionEngine } from '../live-camera/vision-engine';
import { Mesh, SpriteRig, buildMesh, readJoints } from './sprite-rig';

/**
 * Turns one picture of a character (made by any AI image tool) into something that can be
 * animated: cuts out the background, finds the joints, and builds the skinned mesh.
 */

export type BackgroundMode = 'auto' | 'plain' | 'ai';

export interface Figure {
  /** The cut-out character, transparent around it. */
  picture: HTMLCanvasElement;
  rig: SpriteRig;
  mesh: Mesh;
  /** What was done about the background, for the status line. */
  note: string;
}

const MAX_SIDE = 1024;

export function prepareFigure(image: HTMLImageElement, engine: VisionEngine, mode: BackgroundMode): Figure {
  const scale = Math.min(1, MAX_SIDE / Math.max(image.naturalWidth, image.naturalHeight));
  const w = Math.max(2, Math.round(image.naturalWidth * scale));
  const h = Math.max(2, Math.round(image.naturalHeight * scale));

  const picture = document.createElement('canvas');
  picture.width = w;
  picture.height = h;
  const ctx = picture.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(image, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h);

  // The pose model sees the picture on white, so a transparent PNG isn't read as black.
  const flat = document.createElement('canvas');
  flat.width = w;
  flat.height = h;
  const flatCtx = flat.getContext('2d')!;
  flatCtx.fillStyle = '#fff';
  flatCtx.fillRect(0, 0, w, h);
  flatCtx.drawImage(image, 0, 0, w, h);

  const transparent = hasTransparency(data);
  const corners = cornerColour(data);
  let chosen: 'keep' | 'plain' | 'ai' = 'keep';
  if (!transparent) chosen = mode === 'auto' ? (corners.agree ? 'plain' : 'ai') : mode;

  const scan = engine.analyseStill(flat, chosen === 'ai');
  if (!scan.body) {
    throw new Error('No person was found in the character picture. Use one full-body, front-facing character, head to toe.');
  }
  const full = SpriteRig.complete(readJoints(scan.body.points, w, h, 0.3));
  if (!full) {
    throw new Error('Not the whole body is visible in the character picture (head, arms and legs are all needed). Use a full-body picture.');
  }

  let note = 'Used your picture as is (it has a transparent background).';
  if (chosen === 'plain') {
    removePlainBackground(data, corners.colour);
    note = 'Removed the plain background.';
  } else if (chosen === 'ai' && scan.mask) {
    applyMask(data, scan.mask);
    note = 'Cut the character out with AI. A plain white background gives cleaner edges.';
  } else if (chosen === 'ai') {
    throw new Error('The cut-out model is not loaded. Run "npm run vision:models" in the frontend folder, then reload.');
  }
  ctx.putImageData(data, 0, 0);

  const rig = new SpriteRig(full);
  const mesh = buildMesh(data.data, w, h, rig);
  return { picture, rig, mesh, note };
}

function hasTransparency(image: ImageData): boolean {
  let clear = 0;
  const total = image.width * image.height;
  for (let i = 3; i < image.data.length; i += 4) if (image.data[i] < 250) clear++;
  return clear / total > 0.01;
}

/** The average colour of the four corners, and whether they all agree (a plain backdrop). */
function cornerColour(image: ImageData): { colour: [number, number, number]; agree: boolean } {
  const { width: w, height: h, data } = image;
  const patch = 6;
  const spots: [number, number, number][] = [];
  for (const [x0, y0] of [[0, 0], [w - patch, 0], [0, h - patch], [w - patch, h - patch]]) {
    let r = 0, g = 0, b = 0;
    for (let y = y0; y < y0 + patch; y++) {
      for (let x = x0; x < x0 + patch; x++) {
        const i = (y * w + x) * 4;
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
      }
    }
    const n = patch * patch;
    spots.push([r / n, g / n, b / n]);
  }
  const colour: [number, number, number] = [
    spots.reduce((s, c) => s + c[0], 0) / 4,
    spots.reduce((s, c) => s + c[1], 0) / 4,
    spots.reduce((s, c) => s + c[2], 0) / 4,
  ];
  const agree = spots.every((c) => Math.hypot(c[0] - colour[0], c[1] - colour[1], c[2] - colour[2]) < 40);
  return { colour, agree };
}

/** Clears the backdrop by flood-filling in from the picture's edges, so a white shirt on white stays. */
function removePlainBackground(image: ImageData, bg: [number, number, number]): void {
  const { width: w, height: h, data } = image;
  const tolerance = 55;
  const distance = (p: number) => Math.hypot(data[p * 4] - bg[0], data[p * 4 + 1] - bg[1], data[p * 4 + 2] - bg[2]);

  const removed = new Uint8Array(w * h);
  const queue = new Int32Array(w * h);
  let head = 0;
  let tail = 0;
  const push = (p: number) => {
    if (removed[p] || distance(p) > tolerance) return;
    removed[p] = 1;
    queue[tail++] = p;
  };
  for (let x = 0; x < w; x++) {
    push(x);
    push((h - 1) * w + x);
  }
  for (let y = 0; y < h; y++) {
    push(y * w);
    push(y * w + w - 1);
  }
  while (head < tail) {
    const p = queue[head++];
    const x = p % w;
    if (x > 0) push(p - 1);
    if (x < w - 1) push(p + 1);
    if (p >= w) push(p - w);
    if (p < w * (h - 1)) push(p + w);
  }

  for (let p = 0; p < w * h; p++) {
    if (removed[p]) {
      data[p * 4 + 3] = 0;
      continue;
    }
    const x = p % w;
    const edge = (x > 0 && removed[p - 1]) || (x < w - 1 && removed[p + 1]) || (p >= w && removed[p - w]) || (p < w * (h - 1) && removed[p + w]);
    if (edge) {
      const soft = (distance(p) - tolerance * 0.5) / tolerance;
      data[p * 4 + 3] = Math.max(0, Math.min(255, soft * 255));
    }
  }
}

function applyMask(image: ImageData, mask: { values: Float32Array; width: number; height: number }): void {
  const { width: w, height: h, data } = image;
  for (let y = 0; y < h; y++) {
    const my = Math.min(mask.height - 1, Math.floor((y * mask.height) / h));
    for (let x = 0; x < w; x++) {
      const mx = Math.min(mask.width - 1, Math.floor((x * mask.width) / w));
      const a = mask.values[my * mask.width + mx];
      data[(y * w + x) * 4 + 3] = Math.max(0, Math.min(255, (a - 0.3) * 637));
    }
  }
}
