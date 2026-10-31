import { Component, DestroyRef, ElementRef, inject, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CharacterDesign } from '../live-camera/character-designer';
import { MotionSmoother, VISIBLE } from '../live-camera/motion';
import { P, PuppetLook, drawPuppetBody, lookFor, skeletonFromPose } from '../live-camera/puppet';
import { VisionEngine } from '../live-camera/vision-engine';
import { BackgroundMode, Figure, prepareFigure } from './figure-prep';
import { BoneXform, SpriteRenderer, V2, View, readJoints, skin } from './sprite-rig';

/** Paste this into any AI image tool to get a character picture the rig can use. */
const FIGURE_PROMPT =
  'Full-body image of [describe your character], standing straight and facing the camera, arms held slightly away ' +
  'from the body at about 30 degrees, legs slightly apart, both hands and both feet fully visible, entire body from ' +
  'head to toe in frame, plain solid white background, soft even lighting, no shadows on the background, ' +
  'realistic, high detail, portrait 9:16.';

/**
 * Motion Copy: upload a driving video (a dance, a walk, a wave) and your character, and the
 * character performs the same moves. It is a 2D puppet driven by on-device pose tracking, not
 * a generative video model like MimicMotion, so it runs on any laptop (no NVIDIA GPU) and
 * nothing is uploaded anywhere.
 *
 * Pipeline: MediaPipe pose per frame -> One Euro smoothing -> cartoon skeleton -> canvas ->
 * MediaRecorder, with the driving video's audio mixed in through Web Audio.
 */

const LOOKS: readonly { id: string; label: string }[] = [
  { id: 'hero', label: 'Hero' },
  { id: 'star', label: 'Pop star' },
  { id: 'robot', label: 'Robot' },
  { id: 'cyborg', label: 'Cyborg' },
  { id: 'cat', label: 'Cat' },
  { id: 'fox', label: 'Fox' },
  { id: 'panda', label: 'Panda' },
  { id: 'alien', label: 'Alien' },
  { id: 'astronaut', label: 'Astronaut' },
  { id: 'kid', label: 'Kid' },
];

const NO_DESIGN = { outfit: '#2f6fd6', pants: '#26324a', skin: '#eebd96', gloves: '#eebd96' } as unknown as CharacterDesign;

@Component({
  selector: 'app-motion-copy',
  imports: [RouterLink],
  template: `
    <section class="mc">
      <header class="mc-head">
        <h1>Motion Copy</h1>
        <p>
          Pick a dance or move video and a character. The character repeats the moves. Runs fully in your
          browser, on your own machine; nothing is uploaded.
        </p>
      </header>

      <div class="mc-grid">
        <div class="mc-panel">
          <label class="mc-field">
            <span>1. Driving video (the moves to copy)</span>
            <input type="file" accept="video/*" (change)="pickVideo($event)" [disabled]="busy()" />
          </label>

          <label class="mc-field">
            <span>Style</span>
            <select (change)="mode.set($any($event.target).value)" [disabled]="busy()">
              <option value="real" [selected]="mode() === 'real'">Realistic: animate your own character picture</option>
              <option value="cartoon" [selected]="mode() === 'cartoon'">Cartoon puppet</option>
            </select>
          </label>

          @if (mode() === 'real') {
            <label class="mc-field">
              <span>2. Character picture (full body, from any AI image tool)</span>
              <input type="file" accept="image/*" (change)="pickFigure($event)" [disabled]="busy()" />
            </label>

            <details class="mc-help">
              <summary>How to make a good character picture</summary>
              <p>Ask your AI image tool for this (put your character in the brackets):</p>
              <textarea readonly rows="6" [value]="prompt"></textarea>
              <button type="button" class="mc-btn mc-btn-quiet" (click)="copyPrompt()">{{ copied() ? 'Copied' : 'Copy prompt' }}</button>
              <p>
                The whole body must be visible, arms slightly away from the body, and the background plain. A
                transparent PNG also works.
              </p>
            </details>

            <label class="mc-field">
              <span>Background of your picture</span>
              <select (change)="backgroundMode.set($any($event.target).value)" [disabled]="busy()">
                <option value="auto" [selected]="backgroundMode() === 'auto'">Detect automatically</option>
                <option value="plain" [selected]="backgroundMode() === 'plain'">Plain colour: remove it</option>
                <option value="ai" [selected]="backgroundMode() === 'ai'">Busy background: cut out with AI</option>
              </select>
            </label>

            <label class="mc-field">
              <span>Follow the dancer's movement ({{ travel().toFixed(1) }})</span>
              <input type="range" min="0" max="1" step="0.1" [value]="travel()"
                (input)="travel.set(+$any($event.target).value)" [disabled]="busy()" />
            </label>
          } @else {
            <label class="mc-field">
              <span>2. Character face (optional photo or drawing)</span>
              <input type="file" accept="image/*" (change)="pickFace($event)" [disabled]="busy()" />
            </label>

            <label class="mc-field">
              <span>3. Character body</span>
              <select (change)="look.set($any($event.target).value)" [disabled]="busy()">
                @for (l of looks; track l.id) {
                  <option [value]="l.id" [selected]="l.id === look()">{{ l.label }}</option>
                }
              </select>
            </label>

            <label class="mc-field">
              <span>Limb thickness ({{ thickness().toFixed(1) }})</span>
              <input type="range" min="0.6" max="1.6" step="0.1" [value]="thickness()"
                (input)="thickness.set(+$any($event.target).value)" [disabled]="busy()" />
            </label>

            <label class="mc-check">
              <input type="checkbox" [checked]="legs()" (change)="legs.set($any($event.target).checked)" [disabled]="busy()" />
              Draw legs (needs the whole body in the video)
            </label>
          }

          <label class="mc-field">
            <span>Background colour</span>
            <input type="color" [value]="background()" (input)="background.set($any($event.target).value)" [disabled]="busy()" />
          </label>

          <div class="mc-actions">
            <button type="button" class="mc-btn" (click)="start()" [disabled]="busy() || !videoUrl()">
              {{ busy() ? 'Working...' : 'Copy the motion' }}
            </button>
            @if (busy()) {
              <button type="button" class="mc-btn mc-btn-quiet" (click)="cancel()">Stop</button>
            }
          </div>

          <p class="mc-status" role="status">{{ status() }}</p>
          @if (error()) {
            <p class="mc-error" role="alert">{{ error() }}</p>
          }
          <p class="mc-note">
            The clip is rendered as it plays, so a 30 second video takes about 30 seconds. Use a video with one
            person, the whole body in view and a steady camera for the best result.
          </p>
        </div>

        <div class="mc-stage">
          <canvas #stage class="mc-canvas" width="540" height="960" [hidden]="mode() === 'real'"></canvas>
          <canvas #glstage class="mc-canvas" width="540" height="960" [hidden]="mode() !== 'real'"></canvas>
          <video #source class="mc-hidden" playsinline preload="auto"></video>

          @if (resultUrl()) {
            <div class="mc-result">
              <video [src]="resultUrl()" controls playsinline></video>
              <a class="mc-btn" [href]="resultUrl()" [download]="'motion-copy.' + resultExt()">Download video</a>
            </div>
          }
        </div>
      </div>

      <p class="mc-back"><a routerLink="/live/camera">Camera Studio</a></p>
    </section>
  `,
  styles: `
    .mc { box-sizing: border-box; width: 100%; min-width: 0; max-width: 1100px; margin: 0 auto; padding: 24px 16px 48px; color: var(--text, #e8ebf4); }
    .mc-head h1 { margin: 0 0 6px; font-size: 1.6rem; }
    .mc-head p { margin: 0 0 20px; opacity: 0.8; max-width: 60ch; }
    .mc-grid { display: grid; grid-template-columns: minmax(0, 380px) minmax(0, 1fr); gap: 24px; align-items: start; }
    @media (max-width: 800px) { .mc-grid { grid-template-columns: minmax(0, 1fr); } }
    .mc-panel { display: flex; flex-direction: column; gap: 14px; min-width: 0; }
    .mc-field { display: flex; flex-direction: column; gap: 6px; font-size: 0.9rem; }
    .mc-field select, .mc-field input[type='file'] { padding: 6px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.18); background: rgba(255, 255, 255, 0.05); color: inherit; }
    .mc-check { display: flex; gap: 8px; align-items: center; font-size: 0.9rem; }
    .mc-actions { display: flex; flex-wrap: wrap; gap: 10px; }
    .mc-btn { display: inline-block; padding: 10px 16px; border-radius: 10px; border: 0; cursor: pointer; font-weight: 600; background: #6a5cff; color: #fff; text-decoration: none; }
    .mc-btn[disabled] { opacity: 0.5; cursor: not-allowed; }
    .mc-btn-quiet { background: rgba(255, 255, 255, 0.12); }
    .mc-status { margin: 0; font-size: 0.9rem; opacity: 0.85; min-height: 1.2em; }
    .mc-error { margin: 0; color: #ff8a8a; font-size: 0.9rem; }
    .mc-note { margin: 0; font-size: 0.8rem; opacity: 0.65; }
    .mc-stage { display: flex; flex-direction: column; gap: 16px; align-items: center; }
    .mc-canvas { max-width: 100%; max-height: 70vh; aspect-ratio: 9 / 16; border-radius: 12px; background: #111; }
    .mc-hidden { position: fixed; left: -9999px; width: 1px; height: 1px; }
    .mc-result { display: flex; flex-direction: column; gap: 10px; align-items: center; }
    .mc-result video { max-width: 100%; max-height: 50vh; border-radius: 12px; }
    .mc-back { margin-top: 24px; font-size: 0.85rem; opacity: 0.7; }
    .mc-help { font-size: 0.85rem; padding: 8px 10px; border-radius: 8px; background: rgba(255, 255, 255, 0.05); }
    .mc-help summary { cursor: pointer; }
    .mc-help textarea { width: 100%; box-sizing: border-box; margin: 6px 0; padding: 6px; border-radius: 6px; border: 1px solid rgba(255, 255, 255, 0.18); background: rgba(0, 0, 0, 0.25); color: inherit; font: inherit; }
  `,
})
export class MotionCopyComponent {
  private readonly stage = viewChild.required<ElementRef<HTMLCanvasElement>>('stage');
  private readonly source = viewChild.required<ElementRef<HTMLVideoElement>>('source');
  private readonly glStage = viewChild.required<ElementRef<HTMLCanvasElement>>('glstage');

  readonly looks = LOOKS;
  readonly prompt = FIGURE_PROMPT;
  readonly mode = signal<'real' | 'cartoon'>('real');
  readonly backgroundMode = signal<BackgroundMode>('auto');
  readonly travel = signal(0.7);
  readonly copied = signal(false);
  readonly look = signal('hero');
  readonly background = signal('#1b1f33');
  readonly thickness = signal(1);
  readonly legs = signal(true);

  readonly videoUrl = signal<string | null>(null);
  readonly resultUrl = signal<string | null>(null);
  readonly resultExt = signal('webm');
  readonly busy = signal(false);
  readonly status = signal('Choose a video to begin.');
  readonly error = signal<string | null>(null);

  private readonly engine = new VisionEngine();
  private readonly smoother = new MotionSmoother();
  private face: HTMLImageElement | null = null;
  private faceUrl: string | null = null;
  private figureImage: HTMLImageElement | null = null;
  private figureUrl: string | null = null;
  private stopRun: (() => void) | null = null;
  // A video element can be wired into Web Audio only once, so the context and source are kept.
  private audio: AudioContext | null = null;
  private audioSource: MediaElementAudioSourceNode | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.stopRun?.();
      this.engine.close();
      void this.audio?.close();
      for (const url of [this.videoUrl(), this.resultUrl(), this.faceUrl, this.figureUrl]) if (url) URL.revokeObjectURL(url);
    });
  }

  pickVideo(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const old = this.videoUrl();
    if (old) URL.revokeObjectURL(old);
    this.videoUrl.set(URL.createObjectURL(file));
    this.clearResult();
    this.status.set(`Ready: ${file.name}`);
    this.error.set(null);
  }

  pickFace(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (this.faceUrl) URL.revokeObjectURL(this.faceUrl);
    this.face = null;
    this.faceUrl = null;
    if (!file) return;
    this.faceUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => (this.face = img);
    img.src = this.faceUrl;
  }

  pickFigure(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (this.figureUrl) URL.revokeObjectURL(this.figureUrl);
    this.figureImage = null;
    this.figureUrl = null;
    if (!file) return;
    this.figureUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => (this.figureImage = img);
    img.onerror = () => this.error.set('That picture could not be read. Try a PNG or JPG.');
    img.src = this.figureUrl;
  }

  async copyPrompt(): Promise<void> {
    try {
      await navigator.clipboard.writeText(FIGURE_PROMPT);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    } catch {
      this.error.set('Copying was blocked. Select the text and copy it by hand.');
    }
  }

  cancel(): void {
    this.stopRun?.();
  }

  async start(): Promise<void> {
    const url = this.videoUrl();
    if (!url || this.busy()) return;
    if (this.mode() === 'real' && !this.figureImage) {
      this.error.set('Add your character picture first (step 2).');
      return;
    }

    this.busy.set(true);
    this.error.set(null);
    this.clearResult();
    this.status.set('Loading body tracking...');

    try {
      await this.engine.loadMotion();
      await this.engine.configureMotion(1);

      let figure: Figure | null = null;
      if (this.mode() === 'real') {
        this.status.set('Preparing your character...');
        figure = prepareFigure(this.figureImage!, this.engine, this.backgroundMode());
        this.status.set(figure.note);
        await this.engine.configureMotion(1);
      }
      await this.run(url, figure);
    } catch (err) {
      this.error.set(this.engine.motionError ?? (err instanceof Error ? err.message : 'Something went wrong.'));
      this.status.set('Stopped.');
    } finally {
      this.stopRun = null;
      this.busy.set(false);
    }
  }

  /** Plays the driving video, draws the character each frame and records the canvas. */
  private async run(url: string, figure: Figure | null): Promise<void> {
    const video = this.source().nativeElement;
    const canvas = (figure ? this.glStage() : this.stage()).nativeElement;
    const ctx = figure ? null : canvas.getContext('2d')!;

    video.src = url;
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error('This video could not be read. Try an MP4 (H.264) file.'));
    });

    // Match the canvas to the video's shape, capped at 720 on the long side to keep the load light.
    const scale = Math.min(1, 720 / Math.max(video.videoWidth, video.videoHeight));
    canvas.width = Math.round(video.videoWidth * scale) & ~1;
    canvas.height = Math.round(video.videoHeight * scale) & ~1;
    canvas.style.aspectRatio = `${canvas.width} / ${canvas.height}`;

    // Realistic mode: the skinned picture, drawn with WebGL.
    let renderer: SpriteRenderer | null = null;
    let view: View | null = null;
    let positions: Float32Array | null = null;
    let transforms: BoneXform[] | null = null;
    let anchor: { hip: V2; torso: number } | null = null;
    if (figure) {
      renderer = new SpriteRenderer(canvas, figure.picture, figure.mesh);
      positions = new Float32Array(figure.mesh.rest.length);
      const b = figure.mesh.bounds;
      const k = Math.min((canvas.height * 0.88) / b.h, (canvas.width * 0.92) / b.w);
      const hip = figure.rig.hipMid;
      view = {
        k,
        hip,
        screen: { x: canvas.width / 2 + k * (hip.x - (b.x + b.w / 2)), y: canvas.height / 2 + k * (hip.y - (b.y + b.h / 2)) },
      };
    }

    // The video's sound goes to the recording only, not the speakers.
    this.audio ??= new AudioContext();
    const audio = this.audio;
    this.audioSource ??= audio.createMediaElementSource(video);
    const sink = audio.createMediaStreamDestination();
    this.audioSource.connect(sink);

    const stream = canvas.captureStream(30);
    for (const track of sink.stream.getAudioTracks()) stream.addTrack(track);

    const mime = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'].find((m) =>
      MediaRecorder.isTypeSupported(m));
    const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 6_000_000 });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    const recorded = new Promise<void>((resolve) => (recorder.onstop = () => resolve()));

    this.smoother.reset();
    const look = lookFor(this.look(), NO_DESIGN, '#6a5cff');
    let frames = 0;
    let lost = 0;
    let handle = 0;
    let cancelled = false;

    const finished = new Promise<void>((resolve) => {
      const stop = () => {
        cancelled = cancelled || !video.ended;
        video.pause();
        resolve();
      };
      this.stopRun = stop;
      video.onended = stop;
    });

    const drawReal = (body: { points: { x: number; y: number; v: number }[] } | undefined) => {
      const joints = body ? readJoints(body.points, video.videoWidth, video.videoHeight, VISIBLE) : null;
      const rig = figure!.rig;
      const hasTorso = !!(joints?.lS && joints.rS && joints.lH && joints.rH);

      if (hasTorso) {
        const driverHip = { x: (joints!.lH!.x + joints!.rH!.x) / 2, y: (joints!.lH!.y + joints!.rH!.y) / 2 };
        const driverShoulders = { x: (joints!.lS!.x + joints!.rS!.x) / 2, y: (joints!.lS!.y + joints!.rS!.y) / 2 };
        anchor ??= { hip: driverHip, torso: Math.max(8, Math.hypot(driverShoulders.x - driverHip.x, driverShoulders.y - driverHip.y)) };
        // The driver's travel, in the character's own pixels, so a taller or shorter body moves in proportion.
        const unit = (rig.torsoLength / anchor.torso) * this.travel();
        transforms = rig.pose(joints!, { x: (driverHip.x - anchor.hip.x) * unit, y: (driverHip.y - anchor.hip.y) * unit });
      } else {
        lost++;
        transforms ??= rig.pose({}, { x: 0, y: 0 });
      }

      skin(figure!.mesh, transforms!, view!, positions!);
      renderer!.draw(positions!, this.background());
    };

    const draw = () => {
      if (cancelled || video.ended) return;
      const result = this.engine.detect(video, { mask: false, motion: true });
      const motion = result?.motion ? this.smoother.update(result.motion, performance.now()) : null;
      const body = motion?.bodies[0];

      if (figure) {
        drawReal(body);
      } else {
        ctx!.fillStyle = this.background();
        ctx!.fillRect(0, 0, canvas.width, canvas.height);

        const skeleton = body
          ? skeletonFromPose(body, motion.hands, (x, y): P => ({ x: x * canvas.width, y: y * canvas.height }), this.thickness(), this.legs())
          : null;

        if (skeleton) {
          drawPuppetBody(ctx!, skeleton, look);
          this.drawHead(ctx!, skeleton.head, look);
        } else {
          lost++;
        }
      }

      frames++;
      if (frames % 15 === 0) {
        const total = video.duration || 1;
        this.status.set(`Copying the moves... ${Math.min(99, Math.round((video.currentTime / total) * 100))}%`);
      }
      next();
    };

    const next = () => {
      handle = 'requestVideoFrameCallback' in video
        ? video.requestVideoFrameCallback(draw)
        : requestAnimationFrame(draw);
    };

    recorder.start(250);
    await audio.resume();
    await video.play();
    next();
    await finished;

    if ('cancelVideoFrameCallback' in video) video.cancelVideoFrameCallback(handle);
    else cancelAnimationFrame(handle);
    recorder.state !== 'inactive' && recorder.stop();
    await recorded;
    this.audioSource.disconnect(sink);
    renderer?.dispose();

    if (cancelled) {
      this.status.set('Stopped.');
      return;
    }

    const type = recorder.mimeType || 'video/webm';
    this.resultExt.set(type.includes('mp4') ? 'mp4' : 'webm');
    this.resultUrl.set(URL.createObjectURL(new Blob(chunks, { type })));
    const missed = frames ? Math.round((lost / frames) * 100) : 0;
    this.status.set(missed > 25
      ? `Done, but the body was not found in ${missed}% of frames. A clearer full-body video will look better.`
      : 'Done. Preview and download below.');
  }

  /** The head is the uploaded face, cropped to a circle, or a simple cartoon face. */
  private drawHead(ctx: CanvasRenderingContext2D, head: { x: number; y: number; r: number }, look: PuppetLook): void {
    const r = Math.max(8, head.r * 1.15);
    ctx.save();
    ctx.beginPath();
    ctx.arc(head.x, head.y, r, 0, Math.PI * 2);
    ctx.closePath();

    if (this.face) {
      ctx.clip();
      const side = Math.min(this.face.naturalWidth, this.face.naturalHeight);
      ctx.drawImage(
        this.face,
        (this.face.naturalWidth - side) / 2, (this.face.naturalHeight - side) / 2, side, side,
        head.x - r, head.y - r, r * 2, r * 2,
      );
      ctx.restore();
      ctx.beginPath();
      ctx.arc(head.x, head.y, r, 0, Math.PI * 2);
      ctx.lineWidth = Math.max(2, r * 0.07);
      ctx.strokeStyle = 'rgba(20,16,32,.9)';
      ctx.stroke();
      return;
    }

    ctx.fillStyle = look.skin;
    ctx.fill();
    ctx.lineWidth = Math.max(2, r * 0.07);
    ctx.strokeStyle = 'rgba(20,16,32,.9)';
    ctx.stroke();
    ctx.fillStyle = '#1d1d2b';
    for (const dx of [-0.35, 0.35]) {
      ctx.beginPath();
      ctx.arc(head.x + r * dx, head.y - r * 0.1, r * 0.1, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(head.x, head.y + r * 0.2, r * 0.35, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.lineWidth = Math.max(2, r * 0.06);
    ctx.stroke();
    ctx.restore();
  }

  private clearResult(): void {
    const url = this.resultUrl();
    if (url) URL.revokeObjectURL(url);
    this.resultUrl.set(null);
  }
}
