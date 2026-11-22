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
import { BeatGrid, DanceTrack, analyzeDance, beatAt, detectBeats, rewind, sampleDance, trackedShare } from './dance-track';
import { BackgroundMode, Figure, prepareFigure } from './figure-prep';
import type {
  CameraAngleMode,
  CharacterRole3D,
  DanceChoreographyStyle,
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
  sampleToPose3D,
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
          <div class="mc-card">
            <div class="mc-card-head">
              <strong>💃 Quick 3D Dance Presets</strong>
            </div>
            <div class="mc-actions">
              <button type="button" class="mc-btn mc-btn-quiet" style="padding:6px 10px; font-size:0.8rem;"
                      (click)="applyGuzarishPreset()" [disabled]="busy()">🏰 Guzarish Royal Sufi Dance (6 Dancers)</button>
              <button type="button" class="mc-btn mc-btn-quiet" style="padding:6px 10px; font-size:0.8rem;"
                      (click)="applySlapstickPreset()" [disabled]="busy()">😂 MJO Slapstick Bounce</button>
            </div>
          </div>

          <label class="mc-field">
            <span>1. Driving video or song audio (MP4, WebM, MP3, WAV)</span>
            <input type="file" accept="video/*,audio/*" (change)="pickVideo($event)" [disabled]="busy()" />
          </label>
          <button type="button" class="mc-btn mc-btn-quiet" style="font-size:0.82rem; padding:7px 12px;"
                  (click)="loadBuiltInSufiTrack()" [disabled]="busy()">
            🎵 Use Built-in 92 BPM Royal Sufi Music Track (16s — Ready Now)
          </button>

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

              <div class="mc-row-2">
                <label class="mc-field">
                  <span>Backup Troupe Dancers</span>
                  <select [ngModel]="troupeCount()" (ngModelChange)="troupeCount.set(+$event)" [disabled]="busy()">
                    <option [value]="0">None (Solo / Duo)</option>
                    <option [value]="2">2 Flanking Dancers</option>
                    <option [value]="4">4 Palace Troupe</option>
                    <option [value]="6">6 Royal Court Troupe</option>
                  </select>
                </label>
                <label class="mc-field">
                  <span>Choreography Style</span>
                  <select [ngModel]="choreoStyle()" (ngModelChange)="choreoStyle.set($event)" [disabled]="busy()">
                    <option value="auto">Auto-Match Stage &amp; Roles</option>
                    <option value="sufiKathak">Sufi &amp; Kathak (Adaab + Spin)</option>
                    <option value="bhangra">Bhangra / Folk Energy</option>
                    <option value="viralBounce">Viral Comedy Bounce</option>
                  </select>
                </label>
              </div>

              <label class="mc-field">
                <span>Output Aspect &amp; Framing</span>
                <select [ngModel]="aspectPreset()" (ngModelChange)="aspectPreset.set($event)" [disabled]="busy()">
                  <option value="auto">Auto (Match Video, or 16:9 for Music)</option>
                  <option value="16:9">16:9 Widescreen Cinema (Palace Wide)</option>
                  <option value="9:16">9:16 Vertical Shorts / Reels</option>
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
    .mc-canvas { width: auto; height: auto; max-width: 100%; max-height: 70vh; border-radius: 12px; background: var(--surface, #0f172a); object-fit: contain; }
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
  readonly troupeCount = signal(0);
  readonly choreoStyle = signal<'auto' | DanceChoreographyStyle>('auto');
  readonly aspectPreset = signal<'auto' | '16:9' | '9:16'>('auto');
  readonly stage3D = signal<SceneSetting3D>('DoorwaySet');
  readonly cameraAngle = signal<CameraAngleMode>('autoCut');
  readonly vfx3D = signal<VfxStyle3D>('ComedyBurst');
  readonly mirrorPose = signal(true);
  readonly dynamicZoom = signal(true);
  readonly remixSfx = signal(true);
  readonly muteSourceAudio = signal(false);
  readonly isAudioTrack = signal(false);

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

  applyGuzarishPreset(): void {
    this.mode.set('3d-remix');
    this.roleA.set('KingCrown');
    this.roleB.set('NobleWoman');
    this.colorA.set('#7F1D1D');
    this.colorB.set('#FDE68A');
    this.troupeCount.set(6);
    this.choreoStyle.set('sufiKathak');
    this.aspectPreset.set('16:9');
    this.stage3D.set('PalaceCourt');
    this.vfx3D.set('DivineAura');
    this.cameraAngle.set('autoCut');
    this.remixSfx.set(false);
    this.exportTitle.set('Guzarish Royal Sufi Palace 3D Dance');
    this.status.set('Preset loaded: Guzarish Royal Sufi Dance (2 Leads + 6 Palace Dancers). Pick a video/song or load demo track!');
  }

  applySlapstickPreset(): void {
    this.mode.set('3d-remix');
    this.roleA.set('ComicBobble');
    this.roleB.set('CupDancer');
    this.colorA.set('#F97316');
    this.colorB.set('#38BDF8');
    this.troupeCount.set(0);
    this.choreoStyle.set('viralBounce');
    this.aspectPreset.set('9:16');
    this.stage3D.set('ComedyStage');
    this.vfx3D.set('ComedyBurst');
    this.remixSfx.set(true);
    this.exportTitle.set('3D Comedy Dance Remix #Shorts');
    this.status.set('Preset loaded: MJO Slapstick Bounce.');
  }

  loadBuiltInSufiTrack(): void {
    const old = this.videoUrl();
    if (old) URL.revokeObjectURL(old);
    const wavBlob = buildRoyalSufiDemoWavBlob(16, 92);
    this.videoUrl.set(URL.createObjectURL(wavBlob));
    this.isAudioTrack.set(true);
    this.applyGuzarishPreset();
    this.clearResult();
    this.error.set(null);
    this.status.set('Ready: Built-in 92 BPM Royal Sufi Music Track (16s) + 6 Palace Dancers loaded. Click Generate!');
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
    this.isAudioTrack.set(file.type.startsWith('audio/') || /\.(mp3|wav|m4a|ogg|aac)$/i.test(file.name));
    const base = file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();
    if (base) this.exportTitle.set(`${base} — 3D Remix`.slice(0, 100));
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

    try {
      if (this.mode() === 'real' && this.isAudioTrack()) {
        throw new Error('Realistic photo animation needs a dance video; switch to 3D Remix mode for music/audio songs.');
      }
      if (!this.isAudioTrack()) {
        this.status.set('Loading body tracking...');
        await this.engine.loadMotion();
        const maxPeople = this.mode() === '3d-remix' && this.roleB() !== 'None' ? 2 : 1;
        await this.engine.configureMotion(maxPeople);
      }

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
      video.onerror = () => reject(new Error('This media could not be read. Try an MP4, WebM, MP3, or WAV file.'));
    });

    const hasVideoFrames = video.videoWidth > 0 && video.videoHeight > 0;
    if (!hasVideoFrames && !is3d) {
      throw new Error('2D modes need a driving video with frames. Use 3D Character Remix for audio songs.');
    }

    const presetAspect = this.aspectPreset();
    if (presetAspect === '16:9') {
      canvas.width = 960;
      canvas.height = 540;
    } else if (presetAspect === '9:16') {
      canvas.width = 540;
      canvas.height = 960;
    } else if (hasVideoFrames) {
      const scale = Math.min(1, 720 / Math.max(video.videoWidth, video.videoHeight));
      canvas.width = Math.round(video.videoWidth * scale) & ~1;
      canvas.height = Math.round(video.videoHeight * scale) & ~1;
    } else {
      canvas.width = 960;
      canvas.height = 540;
    }
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
        troupeCount: this.troupeCount(),
        troupeRole: this.stage3D() === 'PalaceCourt' ? 'NobleWoman' : this.roleB() !== 'None' ? this.roleB() as CharacterRole3D : this.roleA(),
        troupeColor: this.stage3D() === 'PalaceCourt' ? '#7F1D1D' : this.colorB(),
        choreographyStyle: this.choreoStyle(),
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

    // 3D remix, pass 1: extract beat grid + read any visible dancers in video (or pure beat-driven choreography for songs/closeups).
    let track: DanceTrack | null = null;
    let beats: BeatGrid | null = null;
    if (stage3dHandle) {
      let analysisCancelled = false;
      this.stopRun = () => { analysisCancelled = true; };
      this.status.set(hasVideoFrames ? 'Pass 1 of 2: reading the dance and the beat...' : 'Detecting music beat grid...');
      const beatsPromise = detectBeats(url, audio);
      try {
        if (hasVideoFrames) {
          track = await analyzeDance(video, (v) => this.engine.detectBodies(v), {
            maxPeople: this.roleB() !== 'None' ? 2 : 1,
            onProgress: (f) => this.status.set(`Pass 1 of 2: reading the dance... ${Math.round(f * 100)}%`),
            isCancelled: () => analysisCancelled,
          });
          if (!analysisCancelled) await rewind(video);
        }
        beats = await beatsPromise;
      } catch (err) {
        stage3dHandle.dispose();
        throw err;
      }
      if (analysisCancelled) {
        stage3dHandle.dispose();
        this.status.set('Stopped.');
        return;
      }
      const share = track ? trackedShare(track) : 0;
      const modeLabel = !hasVideoFrames || share < 0.05 ? 'choreographed beat-sync' : 'motion-copied';
      this.status.set(beats
        ? `Rendering ${modeLabel} 3D stage at ${Math.round(beats.bpm)} BPM...`
        : `Rendering ${modeLabel} 3D stage...`);
    }

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
      const nowMs = performance.now();

      if (stage3dHandle) {
        // Pass 2: sample the pre-analysed, smoothed dance at the exact playback time.
        const t = video.currentTime;
        const sampled = track ? sampleDance(track, t) : [];
        const lead = sampled[0] ?? sampled[1] ?? null;
        const second = sampled[0] ? sampled[1] ?? null : null;
        const poses3d: ExternalBodyPose[] = [];
        let energy = 0;
        if (lead) {
          const p0 = sampleToPose3D(lead, trackerA, this.travel(), t);
          poses3d.push(p0.pose);
          energy = p0.kineticEnergy;
          if (second) poses3d.push(sampleToPose3D(second, trackerB, this.travel(), t).pose);
          if (this.remixSfx() && energy > 0.65 && (nowMs - (trackerA.lastSfxAtMs ?? 0)) > 900) {
            trackerA.lastSfxAtMs = nowMs;
            playComedyStinger(audio, sink, energy > 0.78);
          }
        } else {
          lost++;
        }
        stage3dHandle.render(t, poses3d, energy, this.mirrorPose(), beats ? beatAt(beats, t) : null);
        frames++;
        if (frames % 15 === 0) {
          const total = video.duration || 1;
          this.status.set(`Pass 2 of 2: rendering 3D remix... ${Math.min(99, Math.round((t / total) * 100))}%`);
        }
        next();
        return;
      }

      const result = this.engine.detect(video, { mask: false, motion: true });
      const motion = result?.motion ? this.smoother.update(result.motion, nowMs) : null;
      const bodies = motion?.bodies ?? [];
      const body = bodies[0];

      if (figure) {
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

    // The 3D pass renders at display rate from the pre-analysed track (no per-frame detection),
    // so it doesn't need to wait for decoded video frames.
    const useVideoFrames = !stage3dHandle && 'requestVideoFrameCallback' in video;
    const next = () => {
      handle = useVideoFrames ? video.requestVideoFrameCallback(draw) : requestAnimationFrame(draw);
    };

    recorder.start(250);
    await audio.resume();
    await video.play();
    next();
    await finished;

    if (useVideoFrames) video.cancelVideoFrameCallback(handle);
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
    this.status.set(!stage3dHandle && missed > 25
      ? `Done, but body tracking missed ${missed}% of frames. A full-body video gives cleaner motion.`
      : 'Done! Beat-synced 3D dance ready to preview, download, or send to YouTube / Auto-Post.');
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

/** Synthesizes a royalty-free warm Sufi tanpura drone + 92 BPM tabla/ghungroo pulse WAV for instant testing. */
function buildRoyalSufiDemoWavBlob(durationSec: number, bpm: number): Blob {
  const sr = 22050;
  const totalSamples = Math.floor(sr * durationSec);
  const pcm = new Int16Array(totalSamples);
  const beatSec = 60 / bpm;
  // Soft C# / Yaman-inspired drone + plucked sitar motif + warm dholak downbeat
  const motif = [277.18, 311.13, 349.23, 415.30, 466.16, 415.30, 349.23, 311.13];

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sr;
    const beatPos = t / beatSec;
    const beatIdx = Math.floor(beatPos);
    const beatFrac = beatPos - beatIdx;
    const noteHz = motif[beatIdx % motif.length];

    // Warm tanpura fifths (Sa + Pa)
    const drone = 0.14 * Math.sin(2 * Math.PI * 138.59 * t) + 0.09 * Math.sin(2 * Math.PI * 207.65 * t);
    // Expressive plucked sitar/harmonium melody synced to beat
    const pluckEnv = Math.exp(-beatFrac * 3.8);
    const melody = 0.24 * pluckEnv * (Math.sin(2 * Math.PI * noteHz * t) + 0.35 * Math.sin(4 * Math.PI * noteHz * t));
    // Soft tabla bayan thump on beats 1 & 3, subtle ghungroo shimmer on every beat
    const drumEnv = Math.exp(-beatFrac * 18);
    const drumFreq = 82 + 45 * Math.exp(-beatFrac * 32);
    const isAccent = beatIdx % 2 === 0;
    const drum = (isAccent ? 0.34 : 0.18) * drumEnv * Math.sin(2 * Math.PI * drumFreq * beatFrac);
    const fade = Math.min(1, t * 2, (durationSec - t) * 2);
    const sample = Math.max(-0.95, Math.min(0.95, (drone + melody + drum) * fade));
    pcm[i] = Math.round(sample * 32767);
  }

  const headerSize = 44;
  const buf = new ArrayBuffer(headerSize + pcm.byteLength);
  const view = new DataView(buf);
  const writeStr = (off: number, s: string) => {
    for (let j = 0; j < s.length; j++) view.setUint8(off + j, s.charCodeAt(j));
  };
  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + pcm.byteLength, true);
  writeStr(8, 'WAVEfmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sr, true);
  view.setUint32(28, sr * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, pcm.byteLength, true);
  new Uint8Array(buf, headerSize).set(new Uint8Array(pcm.buffer));
  return new Blob([buf], { type: 'audio/wav' });
}
