import { firstValueFrom } from 'rxjs';

import { ApiFailure } from '../../core/interceptors/api-error.interceptor';
import { CameraContainer, CameraStreamStatus } from '../../core/models/live-stream.models';
import { LiveStreamService } from '../../core/services/live-stream.service';

/** A recording format this browser can produce, and the container the server is told to expect. */
export interface RecorderFormat {
  mimeType: string;
  container: CameraContainer;
}

/** Best first: H.264 is cheapest for the server to decode; VP8/VP9 are what Firefox offers; MP4 is Safari. */
const FORMATS: RecorderFormat[] = [
  { mimeType: 'video/webm;codecs=h264,opus', container: 'WebM' },
  { mimeType: 'video/webm;codecs=vp8,opus', container: 'WebM' },
  { mimeType: 'video/webm;codecs=vp9,opus', container: 'WebM' },
  { mimeType: 'video/webm', container: 'WebM' },
  { mimeType: 'video/mp4;codecs=avc1,mp4a', container: 'Mp4' },
  { mimeType: 'video/mp4', container: 'Mp4' },
];

export function pickRecorderFormat(): RecorderFormat | null {
  if (typeof MediaRecorder === 'undefined') return null;
  return FORMATS.find((f) => MediaRecorder.isTypeSupported(f.mimeType)) ?? null;
}

export interface UplinkStats {
  sentChunks: number;
  sentBytes: number;
  /** Chunks recorded but not yet accepted by the server. */
  queued: number;
  /** Upload rate over the last few chunks, kilobits per second. */
  kbps: number;
  /** How long the server took to accept the last chunk. */
  lastAckMs: number;
  retries: number;
  restarts: number;
}

export interface UplinkEvents {
  status(status: CameraStreamStatus): void;
  /** The stream can't continue; the page should show why. */
  ended(message: string): void;
  stats(stats: UplinkStats): void;
}

/** One second per chunk: short enough for low delay, long enough that a request per chunk is cheap. */
const TIMESLICE_MS = 1000;
/** Retries keep going for about as long as the server waits before it ends a quiet stream. */
const RETRY_DELAYS = [500, 1000, 2000, 3000, 4000, 5000];
/** More than this many seconds waiting means the upload can't keep up with the recording. */
export const BACKLOG_WARNING = 6;

/**
 * Records the program and sends it to the server in numbered chunks, one at a time and in
 * order. A failed send is retried with the same number (the server acknowledges a repeat
 * without writing it twice). When the server restarts its encoder it asks for a fresh
 * recording - a recording's header is only in its first chunk - and the uplink starts one.
 */
export class CameraUplink {
  private recorder: MediaRecorder | null = null;
  private queue: Blob[] = [];
  private sending = false;
  private stopped = false;
  private generation = 0;
  private sequence = 0;
  private readonly recent: { at: number; bytes: number }[] = [];
  private readonly stats: UplinkStats = { sentChunks: 0, sentBytes: 0, queued: 0, kbps: 0, lastAckMs: 0, retries: 0, restarts: 0 };

  constructor(
    private readonly live: LiveStreamService,
    private readonly streamId: string,
    private readonly media: MediaStream,
    private readonly format: RecorderFormat,
    private readonly videoBitsPerSecond: number,
    private readonly events: UplinkEvents,
  ) {}

  start(generation = 0): void {
    this.generation = generation;
    this.sequence = 0;
    this.queue = [];
    const recorder = new MediaRecorder(this.media, {
      mimeType: this.format.mimeType,
      videoBitsPerSecond: this.videoBitsPerSecond,
      audioBitsPerSecond: 128_000,
    });
    recorder.ondataavailable = (event) => {
      if (this.stopped || recorder !== this.recorder || event.data.size === 0) return;
      this.queue.push(event.data);
      this.publish();
      void this.pump();
    };
    recorder.onerror = () => this.fail('The browser stopped recording. Check that the camera is still connected.');
    this.recorder = recorder;
    recorder.start(TIMESLICE_MS);
  }

  /** Stops recording and sending. The page asks the server to end the stream separately. */
  stop(): void {
    this.stopped = true;
    this.queue = [];
    if (this.recorder && this.recorder.state !== 'inactive') this.recorder.stop();
    this.recorder = null;
  }

  private restart(generation: number): void {
    if (this.recorder && this.recorder.state !== 'inactive') this.recorder.stop();
    this.recorder = null;
    this.stats.restarts++;
    this.start(generation);
  }

  private async pump(): Promise<void> {
    if (this.sending) return;
    this.sending = true;
    try {
      while (!this.stopped && this.queue.length > 0) {
        const chunk = this.queue[0];
        const outcome = await this.send(chunk);
        if (outcome === 'stop') return;
        if (outcome === 'restart') continue;
        this.queue.shift();
        this.publish();
      }
    } finally {
      this.sending = false;
    }
  }

  /** Sends one chunk, retrying through brief network trouble. */
  private async send(chunk: Blob): Promise<'sent' | 'restart' | 'stop'> {
    for (let attempt = 0; ; attempt++) {
      if (this.stopped) return 'stop';
      const started = performance.now();
      try {
        const status = await firstValueFrom(this.live.sendCameraChunk(this.streamId, this.generation, this.sequence, chunk));
        this.sequence++;
        this.stats.lastAckMs = Math.round(performance.now() - started);
        this.account(chunk.size);
        this.events.status(status);
        return 'sent';
      } catch (err: unknown) {
        if (err instanceof ApiFailure) {
          switch (err.code) {
            case 'restart-recording': {
              // The server moves to the new generation before it reconnects, so its status says which one to record.
              const current = await firstValueFrom(this.live.cameraStream(this.streamId)).catch(() => null);
              if (this.stopped) return 'stop';
              this.restart(current ? current.generation : this.generation + 1);
              if (current) this.events.status(current);
              return 'restart';
            }
            case 'camera-ended':
            case 'not-found':
              this.fail(err.message);
              return 'stop';
            case 'chunk-too-large':
            case 'chunk-not-media':
              this.fail(`${err.message} Lower the quality and try again.`);
              return 'stop';
          }
        }
        if (attempt >= RETRY_DELAYS.length) {
          this.fail('Lost the connection to the studio server while sending. Check this machine\'s network.');
          return 'stop';
        }
        this.stats.retries++;
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS[attempt]));
      }
    }
  }

  private account(bytes: number): void {
    const now = performance.now();
    this.stats.sentChunks++;
    this.stats.sentBytes += bytes;
    this.recent.push({ at: now, bytes });
    while (this.recent.length > 0 && now - this.recent[0].at > 5000) this.recent.shift();
    const span = Math.max(1000, now - (this.recent[0]?.at ?? now) + TIMESLICE_MS);
    this.stats.kbps = Math.round((this.recent.reduce((s, r) => s + r.bytes, 0) * 8) / span);
  }

  private publish(): void {
    this.stats.queued = this.queue.length;
    this.events.stats({ ...this.stats });
  }

  private fail(message: string): void {
    if (this.stopped) return;
    this.stop();
    this.events.ended(message);
  }
}
