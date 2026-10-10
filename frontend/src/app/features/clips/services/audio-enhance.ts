/**
 * The arithmetic behind "auto-enhance": where the music ducks, how a music file is laid under
 * the whole video, and where a sound effect lands on each cut. Pure, so it can be checked
 * without a studio.
 */

export interface DuckWindow {
  startSeconds: number;
  endSeconds: number;
  level: number;
}

/**
 * Overlapping windows as non-overlapping ones where the deepest duck wins. The server
 * multiplies overlapping windows, which is right for two separate reasons to step back but
 * would bury the music under a clip that already ducks it when a voice line speaks too.
 */
export function deepestDuck(windows: DuckWindow[]): DuckWindow[] {
  const valid = windows.filter((w) => w.endSeconds > w.startSeconds && w.level < 1);
  const edges = [...new Set(valid.flatMap((w) => [w.startSeconds, w.endSeconds]))].sort((a, b) => a - b);
  const out: DuckWindow[] = [];
  for (let i = 0; i < edges.length - 1; i++) {
    const [from, to] = [edges[i], edges[i + 1]];
    const covering = valid.filter((w) => w.startSeconds <= from && w.endSeconds >= to);
    if (covering.length === 0) continue;
    const level = Math.min(...covering.map((w) => w.level));
    const last = out[out.length - 1];
    if (last && last.level === level && Math.abs(last.endSeconds - from) < 0.001) last.endSeconds = to;
    else out.push({ startSeconds: from, endSeconds: to, level });
  }
  return out;
}

export interface BedPiece {
  startSeconds: number;
  /** Seconds of the file to play, from its start. */
  lengthSeconds: number;
  fadeInSeconds: number;
  fadeOutSeconds: number;
}

/**
 * A music file repeated end to end until it covers the video, the last copy cut to end with
 * it. The whole bed fades in at the start and out at the end; the joins get a short fade so
 * a loop that doesn't end on its first beat doesn't click.
 */
export function bedPieces(fileSeconds: number, videoSeconds: number, maxPieces = 40): BedPiece[] {
  if (!(fileSeconds > 0.5) || !(videoSeconds > 0)) return [];
  const pieces: BedPiece[] = [];
  for (let start = 0; start < videoSeconds - 0.05 && pieces.length < maxPieces; start += fileSeconds) {
    const length = Math.min(fileSeconds, videoSeconds - start);
    pieces.push({ startSeconds: round(start), lengthSeconds: round(length), fadeInSeconds: 0.3, fadeOutSeconds: 0.3 });
  }
  if (pieces.length === 0) return pieces;
  pieces[0].fadeInSeconds = Math.min(1.5, pieces[0].lengthSeconds / 3);
  const last = pieces[pieces.length - 1];
  last.fadeOutSeconds = Math.min(2.5, last.lengthSeconds / 2);
  return pieces;
}

/**
 * Where a sound effect starts for each cut: a little before it, so a whoosh peaks as the
 * picture changes. Never before the video starts.
 */
export function cutEffectStarts(clipStarts: number[], effectSeconds: number): number[] {
  const lead = Math.min(0.25, Math.max(0, effectSeconds) / 2);
  return clipStarts.slice(1).map((t) => round(Math.max(0, t - lead)));
}

function round(seconds: number): number {
  return Math.round(seconds * 100) / 100;
}
