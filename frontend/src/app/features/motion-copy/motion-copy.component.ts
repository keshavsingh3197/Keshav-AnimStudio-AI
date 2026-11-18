import { HttpClient } from '@angular/common/http';
import { Component, DestroyRef, ElementRef, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../core/models/api.models';
import { YouTubeChannel } from '../../core/models/youtube.models';
import { YouTubePublishService } from '../../core/services/youtube-publish.service';
import { CharacterDesign } from '../live-camera/character-designer';
import { MotionSmoother, VISIBLE } from '../live-camera/motion';
import { P, PuppetLook, drawPuppetBody, lookFor, skeletonFromPose } from '../live-camera/puppet';
import { VisionEngine } from '../live-camera/vision-engine';
import { BackgroundMode, Figure, prepareFigure } from './figure-prep';
import type {
  CameraAngleMode,
  CharacterRole3D,
  ExternalBodyPose,
  Motion3DStageHandle,
  SceneSetting3D,
  VfxStyle3D,
} from './motion-3d-stage';
import {
  CAMERA_ANGLES_3D,
  PoseTrackerState,
  ROLES_3D,
  STAGES_3D,
  VFX_STYLES_3D,
  playComedyStinger,
  posePointsToExternal3D,
} from './pose-to-3d';
import { BoneXform, SpriteRenderer, V2, View, readJoints, skin } from './sprite-rig';

const FIGURE_PROMPT =
  'Full-body image of [describe your character], standing straight and facing the camera, arms held slightly away ' +
  'from the body at about 30 degrees, legs slightly apart, both hands and both feet fully visible, entire body from ' +
  'head to toe in frame, plain solid white background, soft even lighting, no shadows on the background, ' +
  'realistic, high detail, portrait 9:16.';

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

interface MotionCopyExportResponse {
  renderJobId: string;
  projectId: string;
  storageKey: string;
  automationPostId?: string | null;
  width: number;
  height: number;
  durationSeconds: number;
  sizeBytes: number;
}

@Component({
  selector: 'app-motion-copy',
  imports: [RouterLink, FormsModule],
  template: `
    <section class="mc">
      <header class="mc-head">
        <h1>Motion Copy &amp; 3D Character Remix</h1>
        <p>
          Upload any dance, comedy or challenge video and replace every person with our unique 3D characters,
          3D stages, dynamic camera angles &amp; comedy VFX — ready to publish straight to YouTube or Auto-Post.
        </p>
      </header>

      <div class="mc-grid">
        <div class="mc-panel">
          <label class="mc-field">
            <span>1. Driving video (dance, gag or skit)</span>
            <input type="file" accept="video/*" (change)="pickVideo($event)" [disabled]="busy()" />
          </label>

          <label class="mc-field">
            <span>Animation Engine Mode</span>
            <select [ngModel]="mode()" (ngModelChange)="mode.set($event)" [disabled]="busy()">
              <option value="3d-remix">✨ 3D Character + Background Replacer (Unique Remix)</option>
              <option value="real">Realistic: animate your own character picture</option>
              <option value="cartoon">2D Cartoon puppet</option>
            </select>
          </label>

          @if (mode() === '3d-remix') {
            <div class="mc-card">
              <div class="mc-card-head">
                <strong>3D Cast &amp; Uniqueness Remix</strong>
                <button type="button" class="mc-btn mc-btn-quiet" style="padding:5px 10px; font-size:0.8rem;"
                        (click)="randomizeRemix()" [disabled]="busy()">🎲 Randomize Unique Look</button>
              </div>

              <label class="mc-field">
                <span>Primary 3D Character (Replaces Person 1)</span>
                <select [ngModel]="roleA()" (ngModelChange)="roleA.set($event)" [disabled]="busy()">
                  @for (r of roles3D; track r.id) {
                    <option [value]="r.id">{{ r.label }}</option>
                  }
                </select>
              </label>

              <div class="mc-row-2">
                <label class="mc-field">
                  <span>Primary Colour</span>
                  <input type="color" [ngModel]="colorA()" (ngModelChange)="colorA.set($event)" [disabled]="busy()" />
                </label>
                <label class="mc-field">
                  <span>Partner Colour</span>
                  <input type="color" [ngModel]="colorB()" (ngModelChange)="colorB.set($event)" [disabled]="busy()" />
                </label>
              </div>

              <label class="mc-field">
                <span>Partner 3D Character (Replaces Person 2 or Duo Sync)</span>
                <select [ngModel]="roleB()" (ngModelChange)="roleB.set($event)" [disabled]="busy()">
                  <option value="None">Solo Center Stage (1 Character)</option>
                  @for (r of roles3D; track r.id) {
                    <option [value]="r.id">Duo Partner: {{ r.label }}</option>
                  }
                </select>
              </label>

              <label class="mc-field">
                <span>Full 3D Stage Replacement</span>
                <select [ngModel]="stage3D()" (ngModelChange)="stage3D.set($event)" [disabled]="busy()">
                  @for (s of stages3D; track s.id) {
                    <option [value]="s.id">{{ s.label }}</option>
                  }
                </select>
              </label>

              <label class="mc-field">
                <span>Custom Photo Backdrop (Optional — overrides 3D stage set)</span>
                <input type="file" accept="image/*" (change)="pickCustomBackdrop($event)" [disabled]="busy()" />
              </label>

              <label class="mc-field">
                <span>Camera Framing &amp; Repositioning</span>
                <select [ngModel]="cameraAngle()" (ngModelChange)="cameraAngle.set($event)" [disabled]="busy()">
                  @for (a of cameraAngles; track a.id) {
                    <option [value]="a.id">{{ a.label }}</option>
                  }
                </select>
              </label>

              <label class="mc-field">
                <span>3D Particles &amp; VFX</span>
                <select [ngModel]="vfx3D()" (ngModelChange)="vfx3D.set($event)" [disabled]="busy()">
                  @for (v of vfxStyles; track v.id) {
                    <option [value]="v.id">{{ v.label }}</option>
                  }
                </select>
              </label>

              <label class="mc-field">
                <span>Motion Travel / Centering ({{ travel().toFixed(1) }})</span>
                <input type="range" min="0" max="1" step="0.1" [value]="travel()"
                       (input)="travel.set(+$any($event.target).value)" [disabled]="busy()" />
              </label>

              <label class="mc-check">
                <input type="checkbox" [ngModel]="mirrorPose()" (ngModelChange)="mirrorPose.set($event)" [disabled]="busy()" />
                Mirror choreography left/right (unique transformation)
              </label>
              <label class="mc-check">
                <input type="checkbox" [ngModel]="dynamicZoom()" (ngModelChange)="dynamicZoom.set($event)" [disabled]="busy()" />
                Dynamic smash-zoom camera on jumps &amp; beat energy
              </label>
              <label class="mc-check">
                <input type="checkbox" [ngModel]="remixSfx()" (ngModelChange)="remixSfx.set($event)" [disabled]="busy()" />
                Add cartoon SFX stingers (boing/pop) on sudden movement
              </label>
              <label class="mc-check">
                <input type="checkbox" [ngModel]="muteSourceAudio()" (ngModelChange)="muteSourceAudio.set($event)" [disabled]="busy()" />
                Mute driving video audio (keep SFX only / avoid song copyright)
              </label>
            </div>
          } @else if (mode() === 'real') {
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
            <span>Studio Solid Colour (when stage = Solid Colour or 2D)</span>
            <input type="color" [value]="background()" (input)="background.set($any($event.target).value)" [disabled]="busy()" />
          </label>

          <div class="mc-actions">
            <button type="button" class="mc-btn" (click)="start()" [disabled]="busy() || !videoUrl()">
              {{ busy() ? 'Rendering 3D Remix...' : (mode() === '3d-remix' ? '✨ Generate 3D Remix Video' : 'Copy the motion') }}
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
            Renders in real time on your own GPU via WebGL2 Three.js + on-device MediaPipe body tracking.
          </p>
        </div>

        <div class="mc-stage">
          <canvas #stage class="mc-canvas" width="540" height="960" [hidden]="mode() !== 'cartoon'"></canvas>
          <canvas #glstage class="mc-canvas" width="540" height="960" [hidden]="mode() !== 'real'"></canvas>
          <canvas #gl3dstage class="mc-canvas" width="540" height="960" [hidden]="mode() !== '3d-remix'"></canvas>
          <video #source class="mc-hidden" playsinline preload="auto"></video>

          @if (resultUrl()) {
            <div class="mc-result">
              <video [src]="resultUrl()" controls playsinline></video>
              <div class="mc-actions">
                <a class="mc-btn" [href]="resultUrl()" [download]="'animstudio-3d-remix.' + resultExt()">Download Video</a>
              </div>

              <div class="mc-card mc-export">
                <strong>🚀 Save as YouTube MP4 &amp; Send to Auto-Post</strong>
                <label class="mc-field">
                  <span>Video Title</span>
                  <input type="text" maxlength="100" [ngModel]="exportTitle()" (ngModelChange)="exportTitle.set($event)"
                         placeholder="e.g. Funny 3D Dance Remix #Shorts" [disabled]="exporting()" />
                </label>
                @if (channels().length > 0) {
                  <label class="mc-field">
                    <span>Target YouTube Channel</span>
                    <select [ngModel]="targetChannelId()" (ngModelChange)="targetChannelId.set($event)" [disabled]="exporting()">
                      <option value="">Choose later in Auto-Post / Publish</option>
                      @for (ch of channels(); track ch.channelId) {
                        <option [value]="ch.channelId">{{ ch.channelTitle }} ({{ ch.channelHandle || ch.channelId }})</option>
                      }
                    </select>
                  </label>
                }
                <label class="mc-check">
                  <input type="checkbox" [ngModel]="sendToAutoPost()" (ngModelChange)="sendToAutoPost.set($event)" [disabled]="exporting()" />
                  Queue directly in Daily Auto-Post Hub (Video Ready)
                </label>
                <button type="button" class="mc-btn" (click)="exportToStudio()" [disabled]="exporting() || !recordedBlob">
                  {{ exporting() ? 'Converting to MP4 & Saving...' : 'Convert to MP4 & Save to Studio' }}
                </button>
                @if (exportedInfo()) {
                  <p class="mc-ok">
                    {{ exportedInfo() }}
                    — <a routerLink="/automation">Open Auto-Post Queue ↗</a> | <a routerLink="/youtube">YouTube Publish ↗</a>
                  </p>
                }
              </div>
            </div>
          }
        </div>
      </div>

      <p class="mc-back"><a routerLink="/live/camera">Camera Studio</a> · <a routerLink="/automation">Daily Auto-Post Hub</a></p>
    </section>
  `,
  styles: `
    .mc { box-sizing: border-box; width: 100%; min-width: 0; max-width: 1180px; margin: 0 auto; padding: 24px 16px 48px; color: var(--text, #e8ebf4); }
    .mc-head h1 { margin: 0 0 6px; font-size: 1.65rem; }
    .mc-head p { margin: 0 0 20px; opacity: 0.82; max-width: 68ch; }
    .mc-grid { display: grid; grid-template-columns: minmax(0, 410px) minmax(0, 1fr); gap: 24px; align-items: start; }
    @media (max-width: 840px) { .mc-grid { grid-template-columns: minmax(0, 1fr); } }
    .mc-panel { display: flex; flex-direction: column; gap: 12px; min-width: 0; }
    .mc-card { display: flex; flex-direction: column; gap: 10px; padding: 12px; border-radius: 10px; background: var(--ov-2, rgba(255,255,255,0.04)); border: 1px solid var(--ov-4, rgba(255,255,255,0.1)); }
    .mc-card-head { display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap; }
    .mc-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .mc-field { display: flex; flex-direction: column; gap: 6px; font-size: 0.9rem; }
    .mc-field select, .mc-field input[type='file'], .mc-field input[type='text'] { padding: 7px 8px; border-radius: 8px; border: 1px solid var(--ov-4, rgba(255,255,255,0.14)); background: var(--ov-2, rgba(255,255,255,0.06)); color: inherit; }
    .mc-check { display: flex; gap: 8px; align-items: center; font-size: 0.88rem; }
    .mc-actions { display: flex; flex-wrap: wrap; gap: 10px; }
    .mc-btn { display: inline-block; padding: 10px 16px; border-radius: 10px; border: 0; cursor: pointer; font-weight: 600; background: #6a5cff; color: #fff; text-decoration: none; }
    .mc-btn[disabled] { opacity: 0.5; cursor: not-allowed; }
    .mc-btn-quiet { background: var(--ov-4, rgba(255,255,255,0.14)); color: var(--text, #e8ebf4); }
    .mc-status { margin: 0; font-size: 0.9rem; opacity: 0.85; min-height: 1.2em; }
    .mc-error { margin: 0; color: var(--c-red, #f87171); font-size: 0.9rem; }
    .mc-ok { margin: 0; color: #34d399; font-size: 0.88rem; }
    .mc-ok a { color: #93c5fd; }
    .mc-note { margin: 0; font-size: 0.8rem; opacity: 0.65; }
    .mc-stage { display: flex; flex-direction: column; gap: 16px; align-items: center; }
    .mc-canvas { max-width: 100%; max-height: 70vh; aspect-ratio: 9 / 16; border-radius: 12px; background: var(--surface, #0f172a); }
    .mc-hidden { position: fixed; left: -9999px; width: 1px; height: 1px; }
    .mc-result { display: flex; flex-direction: column; gap: 12px; align-items: center; width: 100%; }
    .mc-result video { max-width: 100%; max-height: 50vh; border-radius: 12px; }
    .mc-export { width: 100%; max-width: 440px; }
    .mc-back { margin-top: 24px; font-size: 0.85rem; opacity: 0.7; }
    .mc-help { font-size: 0.85rem; padding: 8px 10px; border-radius: 8px; background: var(--ov-2); }
    .mc-help summary { cursor: pointer; }
    .mc-help textarea { width: 100%; box-sizing: border-box; margin: 6px 0; padding: 6px; border-radius: 6px; border: 1px solid var(--ov-4); background: var(--sunk-2); color: inherit; font: inherit; }
  `,
})
export class MotionCopyComponent {
  private readonly http = inject(HttpClient);
  private readonly youtube = inject(YouTubePublishService);

  private readonly stage = viewChild.required<ElementRef<HTMLCanvasElement>>('stage');
  private readonly source = viewChild.required<ElementRef<HTMLVideoElement>>('source');
  private readonly glStage = viewChild.required<ElementRef<HTMLCanvasElement>>('glstage');
  private readonly gl3dStage = viewChild.required<ElementRef<HTMLCanvasElement>>('gl3dstage');

  readonly looks = LOOKS;
  readonly roles3D = ROLES_3D;
  readonly stages3D = STAGES_3D;
  readonly cameraAngles = CAMERA_ANGLES_3D;
  readonly vfxStyles = VFX_STYLES_3D;
  readonly prompt = FIGURE_PROMPT;

  readonly mode = signal<'3d-remix' | 'real' | 'cartoon'>('3d-remix');
  readonly roleA = signal<CharacterRole3D>('BrainrotLog');
  readonly roleB = signal<CharacterRole3D | 'None'>('CupDancer');
  readonly colorA = signal('#F97316');
  readonly colorB = signal('#38BDF8');
  readonly stage3D = signal<SceneSetting3D>('DoorwaySet');
  readonly cameraAngle = signal<CameraAngleMode>('autoCut');
  readonly vfx3D = signal<VfxStyle3D>('ComedyBurst');
  readonly mirrorPose = signal(true);
  readonly dynamicZoom = signal(true);
  readonly remixSfx = signal(true);
  readonly muteSourceAudio = signal(false);

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

  readonly channels = signal<YouTubeChannel[]>([]);
  readonly exportTitle = signal('3D Comedy Dance Remix #Shorts');
  readonly targetChannelId = signal('');
  readonly sendToAutoPost = signal(true);
  readonly exporting = signal(false);
  readonly exportedInfo = signal<string | null>(null);
  recordedBlob: Blob | null = null;
  private lastWidth = 540;
  private lastHeight = 960;

  private readonly engine = new VisionEngine();
  private readonly smoother = new MotionSmoother();
  private readonly smootherB = new MotionSmoother();
  private face: HTMLImageElement | null = null;
  private faceUrl: string | null = null;
  private figureImage: HTMLImageElement | null = null;
  private figureUrl: string | null = null;
  private customBackdropUrl: string | null = null;
  private stopRun: (() => void) | null = null;
  private audio: AudioContext | null = null;
  private audioSource: MediaElementAudioSourceNode | null = null;

  constructor() {
    this.youtube.status().subscribe({
      next: (s) => this.channels.set(s?.channels ?? []),
      error: () => { /* anonymous or offline */ },
    });

    inject(DestroyRef).onDestroy(() => {
      this.stopRun?.();
      this.engine.close();
      void this.audio?.close();
      for (const url of [this.videoUrl(), this.resultUrl(), this.faceUrl, this.figureUrl, this.customBackdropUrl]) {
        if (url) URL.revokeObjectURL(url);
      }
    });
  }

  randomizeRemix(): void {
    const roles = ROLES_3D.map((r) => r.id);
    const stages = STAGES_3D.filter((s) => s.id !== 'Auto').map((s) => s.id);
    const angles: CameraAngleMode[] = ['autoCut', 'left34', 'right34', 'lowHero'];
    const paletteA = ['#F97316', '#EF4444', '#22C55E', '#A855F7', '#EAB308'];
    const paletteB = ['#38BDF8', '#EC4899', '#14B8A6', '#F59E0B', '#6366F1'];
    const pick = <T>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];
    this.roleA.set(pick(roles));
    this.roleB.set(pick(roles));
    this.stage3D.set(pick(stages));
    this.cameraAngle.set(pick(angles));
    this.colorA.set(pick(paletteA));
    this.colorB.set(pick(paletteB));
    this.mirrorPose.set(Math.random() > 0.3);
    this.status.set(`Randomized unique 3D combo: ${this.roleA()} + ${this.roleB()} in ${this.stage3D()}.`);
  }

  pickVideo(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const old = this.videoUrl();
    if (old) URL.revokeObjectURL(old);
    this.videoUrl.set(URL.createObjectURL(file));
    const base = file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();
    if (base) this.exportTitle.set(`${base} — 3D Remix #Shorts`.slice(0, 100));
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

  pickCustomBackdrop(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (this.customBackdropUrl) URL.revokeObjectURL(this.customBackdropUrl);
    this.customBackdropUrl = file ? URL.createObjectURL(file) : null;
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
    this.exportedInfo.set(null);
    this.clearResult();
    this.status.set('Loading body tracking...');

    try {
      await this.engine.loadMotion();
      const maxPeople = this.mode() === '3d-remix' && this.roleB() !== 'None' ? 2 : 1;
      await this.engine.configureMotion(maxPeople);

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

  async exportToStudio(): Promise<void> {
    const blob = this.recordedBlob;
    if (!blob || this.exporting()) return;
    this.exporting.set(true);
    this.error.set(null);
    this.exportedInfo.set(null);

    try {
      const form = new FormData();
      const ext = this.resultExt();
      form.append('file', blob, `motion-remix.${ext}`);
      form.append('title', this.exportTitle().trim() || '3D Character Remix #Shorts');
      form.append('sendToAutoPost', String(this.sendToAutoPost()));
      form.append('width', String(this.lastWidth));
      form.append('height', String(this.lastHeight));
      if (this.targetChannelId()) form.append('targetChannelId', this.targetChannelId());

      const res = await firstValueFrom(
        this.http.post<ApiResponse<MotionCopyExportResponse>>(`${environment.apiUrl}/api/motion-copy/export`, form),
      );
      const data = res.data;
      if (!data) throw new Error('Server returned empty export response.');
      this.exportedInfo.set(
        `Saved ${data.width}x${data.height} MP4 (${Math.round(data.durationSeconds)}s)`
        + (data.automationPostId ? ' and queued in Daily Auto-Post Hub!' : '!'),
      );
    } catch (err: unknown) {
      const msg = (err as { error?: { message?: string }; message?: string })?.error?.message
        ?? (err instanceof Error ? err.message : 'Could not save to Studio. Ensure you are signed in.');
      this.error.set(msg);
    } finally {
      this.exporting.set(false);
    }
  }

  private async run(url: string, figure: Figure | null): Promise<void> {
    const video = this.source().nativeElement;
    const is3d = this.mode() === '3d-remix';
    const canvas = (is3d ? this.gl3dStage() : figure ? this.glStage() : this.stage()).nativeElement;
    const ctx = is3d || figure ? null : canvas.getContext('2d')!;

    video.src = url;
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error('This video could not be read. Try an MP4 (H.264) file.'));
    });

    const scale = Math.min(1, 720 / Math.max(video.videoWidth, video.videoHeight));
    canvas.width = Math.round(video.videoWidth * scale) & ~1;
    canvas.height = Math.round(video.videoHeight * scale) & ~1;
    canvas.style.aspectRatio = `${canvas.width} / ${canvas.height}`;
    this.lastWidth = canvas.width;
    this.lastHeight = canvas.height;

    let stage3dHandle: Motion3DStageHandle | null = null;
    if (is3d) {
      this.status.set('Starting Real 3D WebGL stage...');
      const { createMotion3DStage } = await import('./motion-3d-stage');
      stage3dHandle = createMotion3DStage(canvas, {
        width: canvas.width,
        height: canvas.height,
        primaryRole: this.roleA(),
        secondaryRole: this.roleB(),
        primaryColor: this.colorA(),
        secondaryColor: this.colorB(),
        setting: this.stage3D(),
        vfxStyle: this.vfx3D(),
        cameraAngle: this.cameraAngle(),
        customImageUrl: this.customBackdropUrl,
        solidBgHex: this.background(),
        seed: Math.floor(Math.random() * 10000),
        dynamicZoom: this.dynamicZoom(),
      });
    }

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

    this.audio ??= new AudioContext();
    const audio = this.audio;
    this.audioSource ??= audio.createMediaElementSource(video);
    const sink = audio.createMediaStreamDestination();
    if (!(is3d && this.muteSourceAudio())) {
      this.audioSource.connect(sink);
    }

    const stream = canvas.captureStream(30);
    for (const track of sink.stream.getAudioTracks()) stream.addTrack(track);

    const mime = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'].find((m) =>
      MediaRecorder.isTypeSupported(m));
    const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 6_000_000 });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    const recorded = new Promise<void>((resolve) => (recorder.onstop = () => resolve()));

    this.smoother.reset();
    this.smootherB.reset();
    const trackerA: PoseTrackerState = {};
    const trackerB: PoseTrackerState = {};
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
      const nowMs = performance.now();
      const motion = result?.motion ? this.smoother.update(result.motion, nowMs) : null;
      const bodies = motion?.bodies ?? [];
      const body = bodies[0];

      if (stage3dHandle) {
        const poses3d: ExternalBodyPose[] = [];
        let energy = 0;
        if (body) {
          const p0 = posePointsToExternal3D(body.points, trackerA, this.travel());
          poses3d.push(p0.pose);
          energy = p0.kineticEnergy;
          if (bodies[1]) {
            poses3d.push(posePointsToExternal3D(bodies[1].points, trackerB, this.travel()).pose);
          }
          if (this.remixSfx() && energy > 0.65 && (nowMs - (trackerA.lastSfxAtMs ?? 0)) > 900) {
            trackerA.lastSfxAtMs = nowMs;
            playComedyStinger(audio, sink, energy > 0.78);
          }
        } else {
          lost++;
        }
        stage3dHandle.render(video.currentTime || nowMs * 0.001, poses3d, energy, this.mirrorPose());
      } else if (figure) {
        drawReal(body);
      } else {
        ctx!.fillStyle = this.background();
        ctx!.fillRect(0, 0, canvas.width, canvas.height);

        const skeleton = body
          ? skeletonFromPose(body, motion!.hands, (x, y): P => ({ x: x * canvas.width, y: y * canvas.height }), this.thickness(), this.legs())
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
        this.status.set(`Rendering 3D remix... ${Math.min(99, Math.round((video.currentTime / total) * 100))}%`);
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
    try { this.audioSource.disconnect(sink); } catch { /* muted */ }
    renderer?.dispose();
    stage3dHandle?.dispose();

    if (cancelled) {
      this.status.set('Stopped.');
      return;
    }

    const type = recorder.mimeType || 'video/webm';
    const blob = new Blob(chunks, { type });
    this.recordedBlob = blob;
    this.resultExt.set(type.includes('mp4') ? 'mp4' : 'webm');
    this.resultUrl.set(URL.createObjectURL(blob));
    const missed = frames ? Math.round((lost / frames) * 100) : 0;
    this.status.set(missed > 25
      ? `Done, but body tracking missed ${missed}% of frames. A full-body video gives cleaner motion.`
      : 'Done! Preview below, download, or convert & send to YouTube / Auto-Post.');
  }

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
    this.recordedBlob = null;
  }
}
