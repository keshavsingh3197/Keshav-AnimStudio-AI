/**
 * Offline dance analysis for the 3D remix: pass 1 of 2.
 *
 * Copying a dance live (detect + render on every playback frame) drops frames whenever the
 * models are slower than the video, and any live smoother has to lag behind the dancer. Here we
 * read the whole video once first, keep every landmark (2D and 3D world), bridge short tracking
 * gaps, and smooth with a zero-phase (centred) Gaussian, so the render pass can sample a clean,
 * lag-free pose at any time and stay locked to the music.
 *
 * Also finds the song's beat grid so cuts, camera punches and the leg groove land on the beat.
 */
import { BodyPose, MotionPoint, POSE, WorldPoint } from '../live-camera/motion';

const LANDMARKS = 33;
/** Gaps in tracking shorter than this are bridged by interpolation; longer ones count as lost. */
const MAX_GAP_SEC = 0.6;
/** Smoothing strength (seconds). Depth from a single camera is noisier, so it gets more. */
const SIGMA_XY_SEC = 0.045;
const SIGMA_Z_SEC = 0.09;

export interface DanceTrack {
  readonly duration: number;
  readonly times: Float64Array;
  readonly slots: readonly SlotTrack[];
}

interface SlotTrack {
  readonly present: Uint8Array;
  /** Per sample: 33 × (x, y, z) world metres. */
  readonly world: Float32Array;
  /** Per sample: 33 × (x, y) normalised picture coordinates. */
  readonly norm: Float32Array;
  /** Per sample: 33 visibilities. */
  readonly vis: Float32Array;
}

export interface SampledBody {
  readonly points: MotionPoint[];
  readonly world: WorldPoint[];
}

export interface AnalyzeOptions {
  maxPeople: number;
  onProgress?: (fraction: number) => void;
  isCancelled?: () => boolean;
}

type DetectBodies = (video: HTMLVideoElement) => BodyPose[] | null;

interface RawSample {
  t: number;
  bodies: BodyPose[];
}

/**
 * Plays the (muted) video once, slowed down as far as the pose model needs so no frame is
 * skipped, and records every detected body against the frame's media time.
 */
export async function analyzeDance(
  video: HTMLVideoElement,
  detect: DetectBodies,
  opts: AnalyzeOptions,
): Promise<DanceTrack> {
  const raw: RawSample[] = [];
  const wasMuted = video.muted;
  video.muted = true;
  video.currentTime = 0;
  await waitForSeek(video);

  let rate = 0.5;
  video.playbackRate = rate;
  let detectMsTotal = 0;
  let detectCount = 0;
  let lastMediaTime = -1;
  let frameGap = 1 / 30;
  const useVideoFrames = typeof video.requestVideoFrameCallback === 'function';

  try {
    await new Promise<void>((resolve, reject) => {
      let handle = 0;
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        video.removeEventListener('ended', finish);
        if (useVideoFrames) video.cancelVideoFrameCallback(handle);
        else cancelAnimationFrame(handle);
        video.pause();
        resolve();
      };
      video.addEventListener('ended', finish);

      const step = (mediaTime: number) => {
        if (done) return;
        if (opts.isCancelled?.()) {
          finish();
          return;
        }
        if (mediaTime > lastMediaTime) {
          if (lastMediaTime >= 0) frameGap = frameGap * 0.9 + Math.min(0.1, mediaTime - lastMediaTime) * 0.1;
          lastMediaTime = mediaTime;
          const started = performance.now();
          const bodies = detect(video);
          detectMsTotal += performance.now() - started;
          detectCount++;
          if (bodies) raw.push({ t: mediaTime, bodies: bodies.slice(0, Math.max(1, opts.maxPeople)) });

          // Re-tune speed every 20 frames: as fast as possible while every frame still gets a detection.
          if (detectCount % 20 === 0) {
            const avgMs = detectMsTotal / detectCount;
            const target = Math.max(0.15, Math.min(1, (0.75 * frameGap * 1000) / Math.max(1, avgMs)));
            if (Math.abs(target - rate) > 0.05) {
              rate = target;
              video.playbackRate = rate;
            }
          }
          if (detectCount % 10 === 0 && video.duration) opts.onProgress?.(Math.min(1, mediaTime / video.duration));
        }
        next();
      };

      const next = () => {
        handle = useVideoFrames
          ? video.requestVideoFrameCallback((_now, meta) => step(meta.mediaTime))
          : requestAnimationFrame(() => step(video.currentTime));
      };

      video.play().then(next, (err: unknown) => {
        done = true;
        video.removeEventListener('ended', finish);
        reject(err instanceof Error ? err : new Error('The video could not be played for analysis.'));
      });
    });
  } finally {
    video.playbackRate = 1;
    video.muted = wasMuted;
  }

  return buildTrack(raw, video.duration || (raw.length ? raw[raw.length - 1].t : 0), opts.maxPeople);
}

function waitForSeek(video: HTMLVideoElement): Promise<void> {
  if (!video.seeking) return Promise.resolve();
  return new Promise((resolve) => video.addEventListener('seeked', () => resolve(), { once: true }));
}

/** Rewinds for the render pass. */
export async function rewind(video: HTMLVideoElement): Promise<void> {
  video.currentTime = 0;
  await waitForSeek(video);
}

function hipX(body: BodyPose): number {
  const l = body.points[POSE.leftHip];
  const r = body.points[POSE.rightHip];
  const ls = body.points[POSE.leftShoulder];
  const rs = body.points[POSE.rightShoulder];
  if (l && r) return (l.x + r.x) / 2;
  if (ls && rs) return (ls.x + rs.x) / 2;
  return 0.5;
}

function buildTrack(raw: readonly RawSample[], duration: number, maxPeople: number): DanceTrack {
  const n = raw.length;
  const times = new Float64Array(n);
  const slotCount = Math.max(1, Math.min(2, maxPeople));
  const slots: SlotTrack[] = [];
  for (let s = 0; s < slotCount; s++) {
    slots.push({
      present: new Uint8Array(n),
      world: new Float32Array(n * LANDMARKS * 3),
      norm: new Float32Array(n * LANDMARKS * 2),
      vis: new Float32Array(n * LANDMARKS),
    });
  }

  // Keep each dancer in the same slot: sort left-to-right, and when only one body is seen in a
  // duo, give it to whichever slot it was closest to last time.
  const lastX = [0.3, 0.7];
  for (let i = 0; i < n; i++) {
    times[i] = raw[i].t;
    const bodies = raw[i].bodies.filter((b) => b.world && b.world.length >= LANDMARKS);
    let assigned: (BodyPose | undefined)[];
    if (slotCount === 1) {
      assigned = [bodies[0]];
    } else if (bodies.length >= 2) {
      assigned = [...bodies].sort((a, b) => hipX(a) - hipX(b)).slice(0, 2);
    } else if (bodies.length === 1) {
      const x = hipX(bodies[0]);
      assigned = Math.abs(x - lastX[0]) <= Math.abs(x - lastX[1]) ? [bodies[0], undefined] : [undefined, bodies[0]];
    } else {
      assigned = [];
    }

    for (let s = 0; s < slotCount; s++) {
      const body = assigned[s];
      if (!body?.world) continue;
      const slot = slots[s];
      slot.present[i] = 1;
      lastX[s] = hipX(body);
      for (let k = 0; k < LANDMARKS; k++) {
        const w = body.world[k];
        const p = body.points[k];
        slot.world[(i * LANDMARKS + k) * 3] = w.x;
        slot.world[(i * LANDMARKS + k) * 3 + 1] = w.y;
        slot.world[(i * LANDMARKS + k) * 3 + 2] = w.z;
        slot.norm[(i * LANDMARKS + k) * 2] = p?.x ?? 0.5;
        slot.norm[(i * LANDMARKS + k) * 2 + 1] = p?.y ?? 0.5;
        slot.vis[i * LANDMARKS + k] = p?.v ?? 0;
      }
    }
  }

  for (const slot of slots) {
    bridgeGaps(times, slot);
    smoothSlot(times, slot);
  }
  return { duration, times, slots };
}

/** Linearly fills tracking dropouts shorter than MAX_GAP_SEC. */
function bridgeGaps(times: Float64Array, slot: SlotTrack): void {
  const n = times.length;
  let prev = -1;
  for (let i = 0; i < n; i++) {
    if (!slot.present[i]) continue;
    if (prev >= 0 && i - prev > 1 && times[i] - times[prev] <= MAX_GAP_SEC) {
      for (let j = prev + 1; j < i; j++) {
        const a = (times[j] - times[prev]) / (times[i] - times[prev]);
        lerpInto(slot.world, prev, i, j, a, 3);
        lerpInto(slot.norm, prev, i, j, a, 2);
        lerpInto(slot.vis, prev, i, j, a, 1);
        slot.present[j] = 1;
      }
    }
    prev = i;
  }
}

function lerpInto(arr: Float32Array, from: number, to: number, at: number, a: number, stride: number): void {
  const w = LANDMARKS * stride;
  for (let k = 0; k < w; k++) arr[at * w + k] = arr[from * w + k] + (arr[to * w + k] - arr[from * w + k]) * a;
}

/**
 * Centred Gaussian smoothing inside each continuous run, weighted by landmark visibility so
 * the model's guesses for hidden joints pull less than the joints it can actually see.
 */
function smoothSlot(times: Float64Array, slot: SlotTrack): void {
  const n = times.length;
  const world = slot.world.slice();
  const norm = slot.norm.slice();
  const reach = 3 * SIGMA_Z_SEC;
  for (let i = 0; i < n; i++) {
    if (!slot.present[i]) continue;
    // The continuous run of samples around i that the kernel may use.
    let from = i;
    while (from > 0 && slot.present[from - 1] && times[i] - times[from - 1] <= reach) from--;
    let to = i;
    while (to < n - 1 && slot.present[to + 1] && times[to + 1] - times[i] <= reach) to++;

    for (let k = 0; k < LANDMARKS; k++) {
      let sx = 0, sy = 0, sz = 0, nx = 0, ny = 0, wxy = 0, wz = 0;
      for (let j = from; j <= to; j++) {
        const dt = times[j] - times[i];
        const src = j * LANDMARKS + k;
        const v = Math.max(0.05, slot.vis[src]);
        const gz = Math.exp(-(dt * dt) / (2 * SIGMA_Z_SEC * SIGMA_Z_SEC)) * v;
        sz += world[src * 3 + 2] * gz;
        wz += gz;
        if (Math.abs(dt) > 3 * SIGMA_XY_SEC) continue;
        const g = Math.exp(-(dt * dt) / (2 * SIGMA_XY_SEC * SIGMA_XY_SEC)) * v;
        sx += world[src * 3] * g;
        sy += world[src * 3 + 1] * g;
        nx += norm[src * 2] * g;
        ny += norm[src * 2 + 1] * g;
        wxy += g;
      }
      const base = i * LANDMARKS + k;
      if (wxy > 0) {
        slot.world[base * 3] = sx / wxy;
        slot.world[base * 3 + 1] = sy / wxy;
        slot.norm[base * 2] = nx / wxy;
        slot.norm[base * 2 + 1] = ny / wxy;
      }
      if (wz > 0) slot.world[base * 3 + 2] = sz / wz;
    }
  }
}

/** The smoothed pose of each slot at time t (null where that dancer is not tracked). */
export function sampleDance(track: DanceTrack, t: number): (SampledBody | null)[] {
  const { times } = track;
  const n = times.length;
  if (n === 0) return track.slots.map(() => null);

  // Binary search: last index with times[i] <= t.
  let lo = 0;
  let hi = n - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (times[mid] <= t) lo = mid;
    else hi = mid - 1;
  }
  const i0 = lo;
  const i1 = Math.min(n - 1, i0 + 1);

  return track.slots.map((slot) => {
    const p0 = !!slot.present[i0] && Math.abs(times[i0] - t) <= MAX_GAP_SEC;
    const p1 = !!slot.present[i1] && Math.abs(times[i1] - t) <= MAX_GAP_SEC;
    if (!p0 && !p1) return null;
    const a = p0 && p1 && i1 !== i0 ? Math.max(0, Math.min(1, (t - times[i0]) / (times[i1] - times[i0]))) : p0 ? 0 : 1;
    const ia = p0 ? i0 : i1;
    const ib = p1 ? i1 : i0;
    const points: MotionPoint[] = new Array(LANDMARKS);
    const world: WorldPoint[] = new Array(LANDMARKS);
    for (let k = 0; k < LANDMARKS; k++) {
      const wa = (ia * LANDMARKS + k) * 3;
      const wb = (ib * LANDMARKS + k) * 3;
      world[k] = {
        x: slot.world[wa] + (slot.world[wb] - slot.world[wa]) * a,
        y: slot.world[wa + 1] + (slot.world[wb + 1] - slot.world[wa + 1]) * a,
        z: slot.world[wa + 2] + (slot.world[wb + 2] - slot.world[wa + 2]) * a,
      };
      const na = (ia * LANDMARKS + k) * 2;
      const nb = (ib * LANDMARKS + k) * 2;
      points[k] = {
        x: slot.norm[na] + (slot.norm[nb] - slot.norm[na]) * a,
        y: slot.norm[na + 1] + (slot.norm[nb + 1] - slot.norm[na + 1]) * a,
        v: slot.vis[ia * LANDMARKS + k] + (slot.vis[ib * LANDMARKS + k] - slot.vis[ia * LANDMARKS + k]) * a,
      };
    }
    return { points, world };
  });
}

/** Share of the video where the lead dancer was tracked (0-1). */
export function trackedShare(track: DanceTrack): number {
  const slot = track.slots[0];
  if (!slot || track.times.length === 0) return 0;
  let present = 0;
  for (let i = 0; i < slot.present.length; i++) present += slot.present[i];
  return present / slot.present.length;
}

// ---------------------------------------------------------------------------------------------
// Beat grid
// ---------------------------------------------------------------------------------------------

export interface BeatGrid {
  readonly bpm: number;
  readonly period: number;
  readonly offset: number;
}

export interface BeatInfo {
  /** Beat number since the first beat (can be negative before it). */
  readonly index: number;
  /** 0 on the beat, rising to 1 just before the next one. */
  readonly phase: number;
}

export function beatAt(grid: BeatGrid, t: number): BeatInfo {
  const x = (t - grid.offset) / grid.period;
  const index = Math.floor(x);
  return { index, phase: x - index };
}

const MAX_AUDIO_BYTES = 400 * 1024 * 1024;
const HOP_SEC = 0.01;

/**
 * Estimates one steady tempo and its phase from the video's soundtrack: a kick-weighted onset
 * envelope, autocorrelation for the period (70-180 BPM, leaning toward ~115) and a comb search
 * for where the beats fall. Returns null when the audio can't be decoded or has no clear pulse.
 */
export async function detectBeats(url: string, audio: AudioContext): Promise<BeatGrid | null> {
  let buffer: AudioBuffer;
  try {
    const blob = await (await fetch(url)).blob();
    if (blob.size > MAX_AUDIO_BYTES) return null;
    buffer = await audio.decodeAudioData(await blob.arrayBuffer());
  } catch {
    return null; // No audio track, or a codec the browser can't decode on its own.
  }
  if (buffer.duration < 4) return null;

  const sr = buffer.sampleRate;
  const hop = Math.max(1, Math.round(sr * HOP_SEC));
  const hopSec = hop / sr;
  const frames = Math.floor(buffer.length / hop);
  const channels = Array.from({ length: buffer.numberOfChannels }, (_, c) => buffer.getChannelData(c));

  const lowEnergy = new Float32Array(frames);
  const fullEnergy = new Float32Array(frames);
  const lpCoeff = 1 - Math.exp((-2 * Math.PI * 150) / sr);
  let lp = 0;
  for (let f = 0; f < frames; f++) {
    let el = 0;
    let ef = 0;
    for (let i = f * hop, end = i + hop; i < end; i++) {
      let s = 0;
      for (const ch of channels) s += ch[i];
      s /= channels.length;
      lp += (s - lp) * lpCoeff;
      el += lp * lp;
      ef += s * s;
    }
    lowEnergy[f] = Math.log1p(el * 1000);
    fullEnergy[f] = Math.log1p(ef * 1000);
  }

  // Onset strength: rectified rise in energy, with the local average removed.
  const onset = new Float32Array(frames);
  for (let f = 1; f < frames; f++) {
    onset[f] = Math.max(0, lowEnergy[f] - lowEnergy[f - 1]) + 0.5 * Math.max(0, fullEnergy[f] - fullEnergy[f - 1]);
  }
  const win = Math.round(0.5 / hopSec);
  let running = 0;
  const detrended = new Float32Array(frames);
  for (let f = 0; f < frames; f++) {
    running += onset[f];
    if (f >= win) running -= onset[f - win];
    detrended[f] = Math.max(0, onset[f] - running / Math.min(f + 1, win));
  }

  const minLag = Math.floor(60 / 180 / hopSec);
  const maxLag = Math.ceil(60 / 70 / hopSec);
  let bestLag = 0;
  let bestScore = 0;
  let total = 0;
  const scores = new Float64Array(maxLag + 2);
  for (let lag = minLag; lag <= maxLag + 1; lag++) {
    let acc = 0;
    for (let f = lag; f < frames; f++) acc += detrended[f] * detrended[f - lag];
    const bpm = 60 / (lag * hopSec);
    const prior = Math.exp(-0.5 * (Math.log2(bpm / 115) / 0.9) ** 2);
    scores[lag] = acc * prior;
    total += scores[lag];
    if (lag <= maxLag && scores[lag] > bestScore) {
      bestScore = scores[lag];
      bestLag = lag;
    }
  }
  const meanScore = total / (maxLag + 2 - minLag);
  if (!bestLag || bestScore < meanScore * 1.15) return null;

  // Parabolic refinement of the lag for a sub-hop period.
  const y0 = scores[bestLag - 1] ?? bestScore;
  const y2 = scores[bestLag + 1] ?? bestScore;
  const denom = y0 - 2 * bestScore + y2;
  const lagF = bestLag + (denom !== 0 ? Math.max(-0.5, Math.min(0.5, (0.5 * (y0 - y2)) / denom)) : 0);

  let bestOffset = 0;
  let bestComb = -1;
  for (let off = 0; off < bestLag; off++) {
    let acc = 0;
    for (let x = off; x < frames; x += lagF) acc += detrended[Math.round(x)] ?? 0;
    if (acc > bestComb) {
      bestComb = acc;
      bestOffset = off;
    }
  }

  // The autocorrelation period is only good to a fraction of a hop, which drifts by whole beats
  // over a song. Lock each predicted beat to its nearest strong onset and least-squares fit
  // period and offset to those, twice.
  let period = lagF;
  let offset = bestOffset;
  for (let pass = 0; pass < 2; pass++) {
    const search = Math.max(2, Math.round(period * (pass === 0 ? 0.2 : 0.1)));
    let n = 0, sk = 0, st = 0, skk = 0, skt = 0;
    let peakSum = 0;
    const hits: { k: number; t: number; s: number }[] = [];
    for (let k = 0, x = offset; x < frames; k++, x = offset + k * period) {
      const c = Math.round(x);
      let best = -1;
      let bestVal = 0;
      for (let f = Math.max(0, c - search); f <= Math.min(frames - 1, c + search); f++) {
        if (detrended[f] > bestVal) {
          bestVal = detrended[f];
          best = f;
        }
      }
      if (best >= 0) {
        hits.push({ k, t: best, s: bestVal });
        peakSum += bestVal;
      }
    }
    const threshold = hits.length ? (peakSum / hits.length) * 0.5 : 0;
    for (const h of hits) {
      if (h.s < threshold) continue;
      n++;
      sk += h.k;
      st += h.t;
      skk += h.k * h.k;
      skt += h.k * h.t;
    }
    const det = n * skk - sk * sk;
    if (n < 8 || det <= 0) break;
    const fitPeriod = (n * skt - sk * st) / det;
    if (!(fitPeriod > minLag * 0.9 && fitPeriod < maxLag * 1.1)) break;
    period = fitPeriod;
    offset = (st - fitPeriod * sk) / n;
  }

  offset = ((offset % period) + period) % period;
  const periodSec = period * hopSec;
  return { bpm: 60 / periodSec, period: periodSec, offset: offset * hopSec };
}
