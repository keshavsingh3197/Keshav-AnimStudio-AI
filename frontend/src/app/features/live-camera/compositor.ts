import { BackgroundStyle, BuiltInCharacterId, BUILT_IN_CHARACTERS, CharacterRef, OverlayCorner, SceneId, StudioSettings } from './studio-settings';
import { drawBuiltIn, drawImageCharacter, Expression, expressionFrom, ImageCharacter } from './characters';
import { drawDesigned } from './character-designer';
import { drawQrCard, drawSeal, qrCardSize, QrSprite, scannableColors } from './brand-overlays';
import { PrivacyVerdict, TrackedFace } from './face-tracker';
import { ReactionKind } from './gestures';
import { BodyPose, MotionFrame, POSE } from './motion';
import { drawPuppetBody, lookFor, MascotAct, mascotSkeleton, P, Skeleton, skeletonFromPose } from './puppet';
import { Reactions } from './reactions';
import { PersonMask } from './vision-engine';

/** Everything one frame needs. The compositor keeps no state about the stream itself. */
export interface FrameInput {
  settings: StudioSettings;
  scene: SceneId;
  camera: HTMLVideoElement | null;
  screen: HTMLVideoElement | null;
  /** Faces in the camera picture's own coordinates (0-1, not mirrored). */
  faces: readonly TrackedFace[];
  mask: PersonMask | null;
  /** Bodies and hands, when the motion models run. */
  motion: MotionFrame | null;
  privacy: PrivacyVerdict;
  characters: ReadonlyMap<CharacterRef, ImageCharacter>;
  backgroundImage: ImageBitmap | HTMLImageElement | null;
  onAir: boolean;
  liveSince: number | null;
  subscribers: number | null;
  subscribersHidden: boolean;
  viewers: number | null;
  /** When the "starting soon" countdown ends, ms since epoch. */
  countdownEnds: number | null;
  now: number;
}

interface Crop { sx: number; sy: number; sw: number; sh: number; }
interface Rect { x: number; y: number; w: number; h: number; }
/** How the last frame placed the camera in the program, so a gesture's spot can be found on screen. */
interface CameraPlacement { rect: Rect; w: number; h: number; crop: Crop; vw: number; vh: number; mirror: boolean; }

type Ctx = CanvasRenderingContext2D;

const CHARACTER_IDS = BUILT_IN_CHARACTERS.map((c) => c.id) as readonly string[];
const COVER_COLOR = '#262b3a';
/** How far above the face's middle a mask is centred, as a share of the face's height. */
const HAIR_RAISE = 0.14;
const MASCOT_ACT_MS = 1700;
/** In "replace" mode, room backgrounds would show the person, so they become the animated stage. */
const STAGE_BACKGROUNDS: readonly BackgroundStyle[] = ['color', 'gradient', 'image'];

const LOOK_FILTERS: Record<string, string> = {
  none: '',
  warm: 'sepia(.25) saturate(1.15) hue-rotate(-8deg)',
  cool: 'saturate(1.05) hue-rotate(12deg) brightness(1.03)',
  mono: 'grayscale(1)',
  vintage: 'sepia(.55) contrast(.92) brightness(1.05)',
  vivid: 'saturate(1.45) contrast(1.08)',
  noir: 'grayscale(1) contrast(1.45) brightness(.92)',
};

/**
 * Draws the program - what viewers see - onto one canvas, frame by frame: the camera or
 * screen, identity protection, the picture look, overlays and scene cards.
 * <p>
 * Order matters for privacy: body and background effects, then face masks, then the strict
 * mode curtain are all drawn onto the camera layer before it reaches the program, and the
 * curtain is opaque, so no camera pixel survives it.
 */
export class Compositor {
  private readonly ctx: Ctx;
  private readonly layer = document.createElement('canvas');
  private readonly layerCtx: Ctx;
  private readonly scratch = document.createElement('canvas');
  private readonly scratchCtx: Ctx;
  private readonly tiny = document.createElement('canvas');
  private readonly tinyCtx: Ctx;
  private focus = { x: 0.5, y: 0.5, zoom: 1 };
  private tickerOffset = 0;
  private lastFrame = 0;
  private placement: CameraPlacement | null = null;
  private readonly reactions = new Reactions();
  private readonly qr = new QrSprite();
  private mascotAct: { kind: ReactionKind; started: number } | null = null;

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.layerCtx = this.layer.getContext('2d')!;
    this.scratchCtx = this.scratch.getContext('2d')!;
    this.tinyCtx = this.tiny.getContext('2d')!;
  }

  resize(width: number, height: number): void {
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
  }

  /**
   * Starts a reaction burst where a gesture was made (0-1 of the camera picture), or in the
   * lower middle of the program when the camera isn't showing. The mascot acts it out too.
   */
  react(kind: ReactionKind, cameraX: number | null, cameraY: number | null, mascot: boolean): void {
    const at = cameraX !== null && cameraY !== null ? this.cameraToProgram(cameraX, cameraY) : null;
    const W = this.canvas.width;
    const H = this.canvas.height;
    this.reactions.burst(kind, at?.x ?? W / 2, at?.y ?? H * 0.7, H);
    if (mascot) this.mascotAct = { kind, started: Date.now() };
  }

  /** Whether the QR text could be encoded (it can be too long). */
  get qrFailed(): boolean {
    return this.qr.failed;
  }

  private cameraToProgram(x: number, y: number): P | null {
    const m = this.placement;
    if (!m) return null;
    let px = ((x * m.vw - m.crop.sx) / m.crop.sw) * m.w;
    const py = ((y * m.vh - m.crop.sy) / m.crop.sh) * m.h;
    if (m.mirror) px = m.w - px;
    return { x: m.rect.x + px * (m.rect.w / m.w), y: m.rect.y + py * (m.rect.h / m.h) };
  }

  render(input: FrameInput): void {
    const { ctx, canvas } = this;
    const W = canvas.width;
    const H = canvas.height;
    const dt = this.lastFrame ? Math.min(100, input.now - this.lastFrame) : 33;
    this.lastFrame = input.now;
    this.placement = null;

    ctx.save();
    ctx.fillStyle = '#05060a';
    ctx.fillRect(0, 0, W, H);

    if (input.scene !== 'camera') {
      this.drawSceneCard(input, W, H);
    } else {
      this.drawProgram(input, W, H);
    }

    this.drawOverlays(input, W, H, dt);
    ctx.restore();
  }

  // ------------------------------------------------------------------ program

  private drawProgram(input: FrameInput, W: number, H: number): void {
    const { settings, camera, screen } = input;
    const ctx = this.ctx;
    const cameraOn = !!camera && camera.readyState >= 2 && camera.videoWidth > 0;
    const screenOn = !!screen && screen.readyState >= 2 && screen.videoWidth > 0;

    if (settings.source === 'camera' || !screenOn) {
      if (cameraOn) this.drawCameraLayer(input, { x: 0, y: 0, w: W, h: H });
      else this.drawWaiting(W, H, settings.source === 'camera' ? 'Waiting for the camera…' : 'Choose a screen or window to share…');
      return;
    }

    // The screen, letterboxed into the frame.
    const s = Math.min(W / screen!.videoWidth, H / screen!.videoHeight);
    const sw = screen!.videoWidth * s;
    const sh = screen!.videoHeight * s;
    ctx.drawImage(screen!, (W - sw) / 2, (H - sh) / 2, sw, sh);

    if (settings.source === 'screen-camera' && cameraOn) {
      const p = settings.picture;
      const pw = Math.round(W * p.pipSize);
      const ph = p.pipRound ? pw : Math.round(pw * 9 / 16);
      const margin = Math.round(H * 0.03);
      const x = p.pipCorner.endsWith('left') ? margin : W - pw - margin;
      const y = p.pipCorner.startsWith('top') ? margin : H - ph - margin - (settings.overlays.ticker ? H * 0.07 : 0);
      this.drawCameraLayer(input, { x, y, w: pw, h: ph }, p.pipRound);
    }
  }

  /**
   * Draws the camera, with every identity effect applied, into `rect` of the program. All
   * the work happens on an off-screen layer first, so nothing unmasked is ever painted onto
   * the program canvas.
   */
  private drawCameraLayer(input: FrameInput, rect: Rect, round = false): void {
    const { settings, camera, faces, mask, privacy } = input;
    const video = camera!;
    const identity = settings.identity;
    const picture = settings.picture;
    const w = Math.max(2, Math.round(rect.w));
    const h = Math.max(2, Math.round(rect.h));
    if (this.layer.width !== w || this.layer.height !== h) {
      this.layer.width = w;
      this.layer.height = h;
    }
    const lc = this.layerCtx;
    lc.save();
    lc.clearRect(0, 0, w, h);

    const crop = this.cropFor(video.videoWidth, video.videoHeight, w, h, input);
    const mirror = picture.mirror;
    const filter = this.pictureFilter(settings);
    this.placement = { rect, w, h, crop, vw: video.videoWidth, vh: video.videoHeight, mirror };
    const avatar = settings.avatar.body;

    if (privacy.curtain) {
      // Fail closed: no camera pixel is drawn at all.
      this.drawCurtain(lc, w, h, privacy.reason ?? 'Camera hidden');
    } else {
      const background = identity.background;
      const body = identity.bodyStyle;
      const useMask = !!mask && (background !== 'none' || body !== 'none');

      if (avatar === 'replace') {
        // No camera pixel at all: a stage, and the characters acting out what the camera sees.
        this.drawBackground(lc, input, video, crop, w, h, mirror, filter, STAGE_BACKGROUNDS.includes(background) ? background : 'gradient');
      } else if (useMask) {
        this.drawBackground(lc, input, video, crop, w, h, mirror, filter);
        this.drawPerson(lc, input, video, crop, w, h, mirror, filter);
      } else {
        lc.filter = filter || 'none';
        this.drawSource(lc, video, crop, w, h, mirror);
        lc.filter = 'none';
      }

      if (avatar !== 'off') this.drawBodies(lc, input, video, crop, w, h, mirror);

      if (avatar === 'replace') {
        this.drawFaceMasks(lc, input, video, crop, w, h, mirror, true);
        this.drawHeadsWithoutFaces(lc, input, video, crop, w, h, mirror);
      } else if (identity.hideFaces && identity.faceStyle !== 'none') {
        this.drawFaceMasks(lc, input, video, crop, w, h, mirror);
      }
    }

    if (settings.overlays.faceLabels && !privacy.curtain) this.drawFaceLabels(lc, input, video, crop, w, h, mirror);
    lc.restore();

    const ctx = this.ctx;
    ctx.save();
    if (round) {
      ctx.beginPath();
      ctx.arc(rect.x + rect.w / 2, rect.y + rect.h / 2, Math.min(rect.w, rect.h) / 2, 0, Math.PI * 2);
      ctx.clip();
    } else if (rect.w < this.canvas.width) {
      ctx.beginPath();
      ctx.roundRect(rect.x, rect.y, rect.w, rect.h, Math.round(rect.h * 0.06));
      ctx.clip();
    }
    ctx.drawImage(this.layer, rect.x, rect.y, rect.w, rect.h);
    ctx.restore();

    if (rect.w < this.canvas.width) {
      ctx.save();
      ctx.lineWidth = Math.max(2, this.canvas.height * 0.004);
      ctx.strokeStyle = settings.overlays.accent;
      ctx.beginPath();
      if (round) ctx.arc(rect.x + rect.w / 2, rect.y + rect.h / 2, Math.min(rect.w, rect.h) / 2, 0, Math.PI * 2);
      else ctx.roundRect(rect.x, rect.y, rect.w, rect.h, Math.round(rect.h * 0.06));
      ctx.stroke();
      ctx.restore();
    }
  }

  /** Cover-fits the camera into the layer, with the zoom and the auto-framing focus. */
  private cropFor(vw: number, vh: number, w: number, h: number, input: FrameInput): Crop {
    const picture = input.settings.picture;
    let targetX = 0.5;
    let targetY = 0.5;
    let targetZoom = picture.zoom;

    const seen = input.faces.filter((f) => f.visible);
    if (picture.autoFrame && seen.length > 0) {
      const minX = Math.min(...seen.map((f) => f.cx - f.w));
      const maxX = Math.max(...seen.map((f) => f.cx + f.w));
      const minY = Math.min(...seen.map((f) => f.cy - f.h * 1.2));
      const maxY = Math.max(...seen.map((f) => f.cy + f.h * 2));
      targetX = (minX + maxX) / 2;
      targetY = (minY + maxY) / 2;
      // Zoom in until the group fills about two thirds of the frame, never past 2.2×.
      const span = Math.max(maxX - minX, (maxY - minY) * (vh / vw) * (w / h), 0.2);
      targetZoom = Math.max(picture.zoom, Math.min(2.2, 0.66 / span));
    }

    // Eased, so framing glides rather than jumps.
    this.focus.x += (targetX - this.focus.x) * 0.08;
    this.focus.y += (targetY - this.focus.y) * 0.08;
    this.focus.zoom += (targetZoom - this.focus.zoom) * 0.06;

    const scale = Math.max(w / vw, h / vh) * this.focus.zoom;
    const sw = Math.min(vw, w / scale);
    const sh = Math.min(vh, h / scale);
    const sx = Math.min(vw - sw, Math.max(0, this.focus.x * vw - sw / 2));
    const sy = Math.min(vh - sh, Math.max(0, this.focus.y * vh - sh / 2));
    return { sx, sy, sw, sh };
  }

  private drawSource(c: Ctx, source: CanvasImageSource, crop: Crop, w: number, h: number, mirror: boolean, scaleX = 1, scaleY = 1): void {
    c.save();
    if (mirror) {
      c.translate(w, 0);
      c.scale(-1, 1);
    }
    c.drawImage(source, crop.sx * scaleX, crop.sy * scaleY, crop.sw * scaleX, crop.sh * scaleY, 0, 0, w, h);
    c.restore();
  }

  private pictureFilter(settings: StudioSettings): string {
    const p = settings.picture;
    const parts = [LOOK_FILTERS[p.look] ?? ''];
    if (p.brightness !== 1) parts.push(`brightness(${p.brightness})`);
    if (p.contrast !== 1) parts.push(`contrast(${p.contrast})`);
    if (p.saturation !== 1) parts.push(`saturate(${p.saturation})`);
    return parts.filter(Boolean).join(' ');
  }

  private drawBackground(c: Ctx, input: FrameInput, video: HTMLVideoElement, crop: Crop, w: number, h: number, mirror: boolean, filter: string,
    style: BackgroundStyle = input.settings.identity.background): void {
    const identity = input.settings.identity;
    switch (style) {
      case 'blur':
        c.filter = `blur(${Math.round(identity.backgroundBlur * w / 1280)}px) ${filter}`.trim();
        this.drawSource(c, video, crop, w, h, mirror);
        c.filter = 'none';
        break;
      case 'color':
        c.fillStyle = identity.backgroundColor;
        c.fillRect(0, 0, w, h);
        break;
      case 'gradient': {
        const t = input.now / 9000;
        const g = c.createLinearGradient(0, 0, w, h);
        g.addColorStop(0, `hsl(${(t * 40) % 360} 70% 22%)`);
        g.addColorStop(1, `hsl(${(t * 40 + 120) % 360} 70% 12%)`);
        c.fillStyle = g;
        c.fillRect(0, 0, w, h);
        break;
      }
      case 'image':
        if (input.backgroundImage) {
          const img = input.backgroundImage;
          const s = Math.max(w / img.width, h / img.height);
          c.drawImage(img, (w - img.width * s) / 2, (h - img.height * s) / 2, img.width * s, img.height * s);
        } else {
          c.fillStyle = identity.backgroundColor;
          c.fillRect(0, 0, w, h);
        }
        break;
      default:
        c.filter = filter || 'none';
        this.drawSource(c, video, crop, w, h, mirror);
        c.filter = 'none';
    }
  }

  /** The person, cut out by the segmentation mask, with the body effect applied. */
  private drawPerson(c: Ctx, input: FrameInput, video: HTMLVideoElement, crop: Crop, w: number, h: number, mirror: boolean, filter: string): void {
    const identity = input.settings.identity;
    const mask = input.mask!;
    if (this.scratch.width !== w || this.scratch.height !== h) {
      this.scratch.width = w;
      this.scratch.height = h;
    }
    const sc = this.scratchCtx;
    sc.save();
    sc.clearRect(0, 0, w, h);

    switch (identity.bodyStyle) {
      case 'silhouette':
        sc.fillStyle = identity.bodyColor;
        sc.fillRect(0, 0, w, h);
        break;
      case 'blur':
        sc.filter = `blur(${Math.round(w / 45)}px)`;
        this.drawSource(sc, video, crop, w, h, mirror);
        sc.filter = 'none';
        break;
      case 'pixelate':
        this.pixelateInto(sc, video, crop, w, h, mirror, 28);
        break;
      default:
        sc.filter = filter || 'none';
        this.drawSource(sc, video, crop, w, h, mirror);
        sc.filter = 'none';
    }

    // Keep only the person: the mask covers the whole camera picture, so it gets the same crop.
    sc.globalCompositeOperation = 'destination-in';
    const mx = mask.canvas.width / video.videoWidth;
    const my = mask.canvas.height / video.videoHeight;
    this.drawSource(sc, mask.canvas as CanvasImageSource, crop, w, h, mirror, mx, my);
    sc.restore();

    if (identity.bodyStyle === 'none' && identity.background === 'none') return;
    c.drawImage(this.scratch, 0, 0);
  }

  private pixelateInto(c: Ctx, video: HTMLVideoElement, crop: Crop, w: number, h: number, mirror: boolean, blocksAcross: number): void {
    const tw = Math.max(4, blocksAcross);
    const th = Math.max(3, Math.round(blocksAcross * h / w));
    this.tiny.width = tw;
    this.tiny.height = th;
    this.drawSource(this.tinyCtx, video, crop, tw, th, mirror);
    c.imageSmoothingEnabled = false;
    c.drawImage(this.tiny, 0, 0, w, h);
    c.imageSmoothingEnabled = true;
  }

  // ------------------------------------------------------------------ faces

  /** Where a face is on the layer: centre, radius and tilt, after the crop and the mirror. */
  private placeFace(face: TrackedFace, video: HTMLVideoElement, crop: Crop, w: number, h: number, mirror: boolean, scale: number) {
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    // The landmarks stop at the hairline, so the mask is centred a little above the face's
    // middle: hair is as recognisable as a face, and it sits above, not below.
    const raise = face.h * HAIR_RAISE;
    let x = ((face.cx * vw - crop.sx) / crop.sw) * w;
    const y = (((face.cy - raise) * vh - crop.sy) / crop.sh) * h;
    if (mirror) x = w - x;
    const size = Math.max((face.w * vw / crop.sw) * w, ((face.h + raise) * vh / crop.sh) * h);
    return { x, y, r: (size * scale) / 2, roll: mirror ? -face.roll : face.roll, yaw: mirror ? -face.yaw : face.yaw };
  }

  /** Draws one character's head centred on the origin: a designed, image or built-in character. */
  private drawHead(c: Ctx, ref: CharacterRef, r: number, expression: Expression, input: FrameInput): void {
    const image = input.characters.get(ref);
    if (ref === 'custom') drawDesigned(c, input.settings.designer, r, expression);
    else if (image) drawImageCharacter(c, image, r, expression, COVER_COLOR);
    else drawBuiltIn(c, (CHARACTER_IDS.includes(ref) ? ref : 'robot') as BuiltInCharacterId, r, expression);
  }

  /** `forceCharacters` (body replace mode) draws characters whatever the face style, as there is no picture to blur. */
  private drawFaceMasks(c: Ctx, input: FrameInput, video: HTMLVideoElement, crop: Crop, w: number, h: number, mirror: boolean, forceCharacters = false): void {
    const identity = input.settings.identity;
    // Bigger faces last, so a close face is never hidden behind a mask of someone further away.
    const faces = [...input.faces].sort((a, b) => a.w * a.h - b.w * b.h);
    const style = forceCharacters ? 'character' : identity.faceStyle;

    for (const face of faces) {
      const spot = this.placeFace(face, video, crop, w, h, mirror, identity.maskScale);
      const expression: Expression = identity.animateCharacter
        ? expressionFrom(face, mirror)
        : { mouthOpen: 0, blinkLeft: 0, blinkRight: 0, smile: 0.3, browUp: 0 };

      switch (style) {
        case 'character': {
          c.save();
          c.translate(spot.x, spot.y);
          c.rotate(identity.animateCharacter ? spot.roll : 0);
          // A slight turn with the head, without ever narrowing below the face's box.
          if (identity.animateCharacter) c.transform(1, 0, spot.yaw * 0.12, 1, 0, 0);
          this.drawHead(c, this.characterFor(identity.character, identity.characterPerPerson, face.number), spot.r, expression, input);
          c.restore();
          break;
        }
        case 'emoji':
          c.save();
          c.translate(spot.x, spot.y);
          c.rotate(spot.roll);
          c.beginPath();
          c.arc(0, 0, spot.r, 0, Math.PI * 2);
          c.fillStyle = '#ffd34d';
          c.fill();
          c.font = `${Math.round(spot.r * 1.9)}px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif`;
          c.textAlign = 'center';
          c.textBaseline = 'middle';
          c.fillText(identity.emoji, 0, spot.r * 0.08);
          c.restore();
          break;
        case 'block':
          c.save();
          c.translate(spot.x, spot.y);
          c.rotate(spot.roll);
          c.fillStyle = '#0b0d12';
          c.beginPath();
          c.roundRect(-spot.r, -spot.r, spot.r * 2, spot.r * 2, spot.r * 0.25);
          c.fill();
          c.restore();
          break;
        case 'pixelate':
        case 'blur': {
          const box = { x: spot.x - spot.r, y: spot.y - spot.r, s: spot.r * 2 };
          // Only the part of the box inside the frame is sampled. A source rectangle that runs
          // off the canvas is drawn shrunk, which would leave part of the face uncovered.
          const x0 = Math.max(0, box.x);
          const y0 = Math.max(0, box.y);
          const bw = Math.min(w, box.x + box.s) - x0;
          const bh = Math.min(h, box.y + box.s) - y0;
          if (bw < 1 || bh < 1) break;

          // Sample the face first (the layer is both source and target), then cover it opaque,
          // so nothing underneath can show through whatever is drawn on top.
          const pixelate = identity.faceStyle === 'pixelate';
          // 7 blocks across a face: no features survive, only a rough colour.
          const across = pixelate ? Math.max(2, Math.round((7 * bw) / box.s)) : Math.round(bw);
          const down = pixelate ? Math.max(2, Math.round((7 * bh) / box.s)) : Math.round(bh);
          this.tiny.width = across;
          this.tiny.height = down;
          this.tinyCtx.drawImage(this.layer, x0, y0, bw, bh, 0, 0, across, down);

          c.save();
          c.beginPath();
          c.ellipse(spot.x, spot.y, spot.r, spot.r * 1.05, 0, 0, Math.PI * 2);
          c.clip();
          c.fillStyle = COVER_COLOR;
          c.fill();
          if (pixelate) {
            c.imageSmoothingEnabled = false;
            c.drawImage(this.tiny, x0, y0, bw, bh);
            c.imageSmoothingEnabled = true;
          } else {
            c.filter = `blur(${Math.max(8, Math.round(spot.r / 2.5))}px)`;
            c.drawImage(this.tiny, x0, y0, bw, bh);
            c.filter = 'none';
          }
          c.restore();
          break;
        }
      }
    }
  }

  // ------------------------------------------------------------------ bodies

  /** Camera coordinates (0-1) to layer pixels, through the crop and the mirror. */
  private toLayer(x: number, y: number, video: HTMLVideoElement, crop: Crop, w: number, h: number, mirror: boolean): P {
    let px = ((x * video.videoWidth - crop.sx) / crop.sw) * w;
    const py = ((y * video.videoHeight - crop.sy) / crop.sh) * h;
    if (mirror) px = w - px;
    return { x: px, y: py };
  }

  /** The face (if any) that belongs to a body: the one nearest its nose. */
  private faceForBody(body: BodyPose, faces: readonly TrackedFace[]): TrackedFace | null {
    const nose = body.points[POSE.nose];
    let best: TrackedFace | null = null;
    let bestDistance = Infinity;
    for (const face of faces) {
      const d = Math.hypot(face.cx - nose.x, face.cy - nose.y) / Math.max(0.02, face.w);
      if (d < bestDistance) {
        bestDistance = d;
        best = face;
      }
    }
    return bestDistance <= 1.5 ? best : null;
  }

  private bodySkeletons(input: FrameInput, video: HTMLVideoElement, crop: Crop, w: number, h: number, mirror: boolean): { body: BodyPose; skeleton: Skeleton; ref: CharacterRef; face: TrackedFace | null }[] {
    const motion = input.motion;
    if (!motion) return [];
    const avatar = input.settings.avatar;
    const identity = input.settings.identity;
    const map = (x: number, y: number) => this.toLayer(x, y, video, crop, w, h, mirror);
    const hands = avatar.fingers ? motion.hands : [];
    const result = [];
    for (let i = 0; i < motion.bodies.length; i++) {
      const body = motion.bodies[i];
      const skeleton = skeletonFromPose(body, hands, map, avatar.thickness, avatar.legs);
      if (!skeleton) continue;
      const face = this.faceForBody(body, input.faces);
      const ref = this.characterFor(identity.character, identity.characterPerPerson, face?.number ?? i + 1);
      result.push({ body, skeleton, ref, face });
    }
    return result;
  }

  /** The body puppets, posed from each tracked body and its hands. Heads come after, as face masks. */
  private drawBodies(c: Ctx, input: FrameInput, video: HTMLVideoElement, crop: Crop, w: number, h: number, mirror: boolean): void {
    for (const { skeleton, ref } of this.bodySkeletons(input, video, crop, w, h, mirror)) {
      drawPuppetBody(c, skeleton, lookFor(ref, input.settings.designer, input.settings.overlays.accent));
    }
  }

  /** In replace mode, a body whose face isn't tracked (turned away) still gets a head, placed from the pose. */
  private drawHeadsWithoutFaces(c: Ctx, input: FrameInput, video: HTMLVideoElement, crop: Crop, w: number, h: number, mirror: boolean): void {
    for (const { skeleton, ref, face } of this.bodySkeletons(input, video, crop, w, h, mirror)) {
      if (face) continue;
      c.save();
      c.translate(skeleton.head.x, skeleton.head.y);
      this.drawHead(c, ref, skeleton.head.r * 1.15, { mouthOpen: 0, blinkLeft: 0, blinkRight: 0, smile: 0.3, browUp: 0 }, input);
      c.restore();
    }
  }

  private characterFor(selected: CharacterRef, perPerson: boolean, number: number): CharacterRef {
    if (!perPerson || number <= 1) return selected;
    // Person 1 gets the chosen character; everyone else the next ones along, so they're easy to tell apart.
    const start = Math.max(0, CHARACTER_IDS.indexOf(selected));
    return CHARACTER_IDS[(start + number - 1) % CHARACTER_IDS.length];
  }

  private drawFaceLabels(c: Ctx, input: FrameInput, video: HTMLVideoElement, crop: Crop, w: number, h: number, mirror: boolean): void {
    const o = input.settings.overlays;
    const u = (h / 720) * o.overlayScale;
    c.save();
    c.font = `600 ${Math.round(17 * u)}px system-ui, sans-serif`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    for (const face of input.faces) {
      const spot = this.placeFace(face, video, crop, w, h, mirror, input.settings.identity.maskScale);
      const label = `${o.faceLabelPrefix || 'Guest'} ${face.number}`;
      const tw = c.measureText(label).width + 18 * u;
      const y = Math.max(16 * u, spot.y - spot.r - 16 * u);
      c.fillStyle = 'rgba(8,10,16,.72)';
      c.beginPath();
      c.roundRect(spot.x - tw / 2, y - 13 * u, tw, 26 * u, 13 * u);
      c.fill();
      c.fillStyle = '#fff';
      c.fillText(label, spot.x, y + 1);
    }
    c.restore();
  }

  private drawCurtain(c: Ctx, w: number, h: number, reason: string): void {
    const g = c.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#141a2c');
    g.addColorStop(1, '#0a0d16');
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
    const u = Math.min(w, h) / 360;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.font = `${Math.round(48 * u)}px "Segoe UI Emoji","Apple Color Emoji",sans-serif`;
    c.fillText('🛡️', w / 2, h / 2 - 22 * u);
    c.fillStyle = 'rgba(255,255,255,.85)';
    c.font = `600 ${Math.round(14 * u)}px system-ui, sans-serif`;
    c.fillText(reason, w / 2, h / 2 + 26 * u);
  }

  private drawWaiting(W: number, H: number, text: string): void {
    const c = this.ctx;
    c.fillStyle = '#0b0e17';
    c.fillRect(0, 0, W, H);
    c.fillStyle = 'rgba(255,255,255,.6)';
    c.font = `500 ${Math.round(H / 26)}px system-ui, sans-serif`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(text, W / 2, H / 2);
  }

  // ------------------------------------------------------------------ scene cards

  private drawSceneCard(input: FrameInput, W: number, H: number): void {
    const c = this.ctx;
    const s = input.settings.scenes;
    const accent = input.settings.overlays.accent;
    const t = input.now / 1000;

    const g = c.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#0d1224');
    g.addColorStop(1, '#1a0f24');
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);

    // Slow drifting light, so a held card still looks alive to viewers.
    for (let i = 0; i < 3; i++) {
      const x = W * (0.5 + 0.35 * Math.sin(t * 0.2 + i * 2.1));
      const y = H * (0.5 + 0.3 * Math.cos(t * 0.17 + i * 1.3));
      const glow = c.createRadialGradient(x, y, 0, x, y, H * 0.6);
      glow.addColorStop(0, i === 0 ? `${accent}55` : i === 1 ? '#6c8cff33' : '#22d3a633');
      glow.addColorStop(1, 'transparent');
      c.fillStyle = glow;
      c.fillRect(0, 0, W, H);
    }

    const title = { starting: s.startingTitle, brb: s.brbTitle, ending: s.endingTitle, privacy: s.privacyTitle, camera: '' }[input.scene];
    const icon = { starting: '⏳', brb: '☕', ending: '👋', privacy: '🔒', camera: '' }[input.scene];
    const u = H / 720;

    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.font = `${Math.round(72 * u)}px "Segoe UI Emoji","Apple Color Emoji",sans-serif`;
    c.fillText(icon, W / 2, H * 0.34);
    c.fillStyle = '#ffffff';
    c.font = `800 ${Math.round(64 * u)}px system-ui, sans-serif`;
    c.fillText(title || ' ', W / 2, H * 0.5, W * 0.9);

    let line = s.subtitle;
    if (input.scene === 'starting' && input.countdownEnds) {
      const left = Math.max(0, Math.ceil((input.countdownEnds - Date.now()) / 1000));
      line = left > 0 ? `Starting in ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}` : 'Starting now…';
    }
    if (line) {
      c.fillStyle = 'rgba(255,255,255,.75)';
      c.font = `500 ${Math.round(28 * u)}px system-ui, sans-serif`;
      c.fillText(line, W / 2, H * 0.6, W * 0.9);
    }

    c.fillStyle = accent;
    c.fillRect(W / 2 - 60 * u, H * 0.66, 120 * u, 5 * u);
  }

  // ------------------------------------------------------------------ overlays

  private drawOverlays(input: FrameInput, W: number, H: number, dt: number): void {
    const o = input.settings.overlays;
    const c = this.ctx;
    const u = (H / 720) * o.overlayScale;
    const margin = 22 * u;
    const reserveBottom = (o.ticker ? 46 * u : 0) + (o.lowerThird && input.scene === 'camera' ? 96 * u : 0);
    const stacks: Record<OverlayCorner, number> = { 'top-left': 0, 'top-right': 0, 'bottom-left': reserveBottom, 'bottom-right': reserveBottom };

    const pill = (corner: OverlayCorner, text: string, bg: string, extra?: (x: number, y: number, w: number) => number) => {
      c.save();
      c.font = `700 ${Math.round(20 * u)}px system-ui, sans-serif`;
      const tw = c.measureText(text).width;
      const pw = tw + 28 * u;
      const ph = 38 * u;
      const left = corner.endsWith('left');
      const top = corner.startsWith('top');
      const x = left ? margin : W - margin - pw;
      const offset = stacks[corner];
      let y = top ? margin + offset : H - margin - ph - offset;
      const extraHeight = extra ? 14 * u : 0;
      if (!top) y -= extraHeight;
      c.fillStyle = bg;
      c.beginPath();
      c.roundRect(x, y, pw, ph + extraHeight, 10 * u);
      c.fill();
      c.fillStyle = '#fff';
      c.textBaseline = 'middle';
      c.textAlign = 'left';
      c.fillText(text, x + 14 * u, y + ph / 2 + 1);
      if (extra) extra(x + 12 * u, y + ph - 4 * u, pw - 24 * u);
      stacks[corner] = offset + ph + extraHeight + 10 * u;
      c.restore();
    };

    if (o.liveBadge) {
      const elapsed = input.onAir && input.liveSince ? Math.floor((input.now - input.liveSince) / 1000) : 0;
      const label = input.onAir ? `● LIVE  ${clock(elapsed)}` : '● REHEARSAL';
      pill(o.liveBadgeCorner, label, input.onAir ? '#e5233bdd' : 'rgba(40,44,60,.82)');
    }

    if (o.peopleCount && input.scene === 'camera' && input.settings.source !== 'screen') {
      const n = input.faces.length;
      pill(o.peopleCountCorner, `👥 ${n} ${n === 1 ? 'person' : 'people'} on camera`, 'rgba(10,12,20,.72)');
    }

    if (o.subscribers) {
      const text = input.subscribersHidden ? '▶ Subscribers hidden'
        : input.subscribers === null ? '▶ Subscribers …' : `▶ ${compact(input.subscribers)} subscribers`;
      const goal = o.subscriberGoal;
      const withBar = o.showGoalBar && goal > 0 && input.subscribers !== null;
      pill(o.subscribersCorner, text, 'rgba(10,12,20,.78)', withBar ? (x, y, w) => {
        const share = Math.min(1, (input.subscribers ?? 0) / goal);
        c.fillStyle = 'rgba(255,255,255,.18)';
        c.beginPath();
        c.roundRect(x, y, w, 8 * u, 4 * u);
        c.fill();
        c.fillStyle = o.accent;
        c.beginPath();
        c.roundRect(x, y, Math.max(8 * u, w * share), 8 * u, 4 * u);
        c.fill();
        c.font = `600 ${Math.round(11 * u)}px system-ui, sans-serif`;
        c.fillStyle = 'rgba(255,255,255,.8)';
        c.textAlign = 'right';
        c.fillText(`Goal ${compact(goal)}`, x + w, y + 17 * u);
        return 0;
      } : undefined);
    }

    if (o.viewers) {
      pill(o.subscribersCorner, `👁 ${input.viewers === null ? '…' : compact(input.viewers)} watching`, 'rgba(10,12,20,.78)');
    }

    if (o.clock) {
      const d = new Date(input.now);
      pill(o.clockCorner, `🕒 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`, 'rgba(10,12,20,.7)');
    }

    if (o.watermark && o.watermarkText.trim()) {
      c.save();
      c.globalAlpha = 0.55;
      c.font = `700 ${Math.round(18 * u)}px system-ui, sans-serif`;
      c.fillStyle = '#fff';
      c.textAlign = 'right';
      c.textBaseline = 'top';
      c.fillText(o.watermarkText, W - margin, margin + stacks['top-right']);
      c.restore();
      stacks['top-right'] += 30 * u;
    }

    // Branding: each item takes the next free spot in its corner.
    const place = (corner: OverlayCorner, bw: number, bh: number) => {
      const offset = stacks[corner];
      const x = corner.endsWith('left') ? margin : W - margin - bw;
      const y = corner.startsWith('top') ? margin + offset : H - margin - bh - offset;
      stacks[corner] = offset + bh + 12 * u;
      return { x, y };
    };
    const b = input.settings.brand;

    if (b.qr && b.qrText) {
      const colors = scannableColors(b.qrDark, b.qrLight);
      const sprite = this.qr.get(b.qrText, colors.dark, colors.light);
      if (sprite) {
        const height = Math.round(H * b.qrSize);
        const size = qrCardSize(height, b.qrCaption);
        const at = place(b.qrCorner, size.w, size.h);
        drawQrCard(c, sprite, at.x, at.y, height, b.qrCaption, colors.light, o.accent);
      }
    }

    if (b.seal) {
      const d = H * b.sealSize;
      const at = place(b.sealCorner, d, d);
      const date = new Date(input.now);
      drawSeal(c, at.x + d / 2, at.y + d / 2, d / 2, {
        top: b.sealTop,
        bottom: b.sealBottom,
        center: b.sealCenter,
        serial: b.sealSerial,
        date: b.sealDate ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` : null,
        finish: b.sealFinish,
        accent: o.accent,
      }, input.now);
    }

    if (b.mascot) {
      const mh = H * b.mascotSize;
      const mw = mh * 0.62;
      const at = place(b.mascotCorner, mw, mh);
      this.drawMascot(input, { x: at.x, y: at.y, w: mw, h: mh });
    }

    if (o.lowerThird && input.scene === 'camera' && (o.lowerThirdName || o.lowerThirdTitle)) {
      c.save();
      const y = H - margin - (o.ticker ? 46 * u : 0) - 84 * u;
      c.font = `800 ${Math.round(30 * u)}px system-ui, sans-serif`;
      const nameWidth = c.measureText(o.lowerThirdName).width;
      c.font = `500 ${Math.round(19 * u)}px system-ui, sans-serif`;
      const titleWidth = c.measureText(o.lowerThirdTitle).width;
      const bw = Math.max(nameWidth, titleWidth) + 48 * u;
      c.fillStyle = 'rgba(8,10,18,.82)';
      c.beginPath();
      c.roundRect(margin, y, bw, 78 * u, 10 * u);
      c.fill();
      c.fillStyle = o.accent;
      c.fillRect(margin, y, 7 * u, 78 * u);
      c.fillStyle = '#fff';
      c.textBaseline = 'alphabetic';
      c.textAlign = 'left';
      c.font = `800 ${Math.round(30 * u)}px system-ui, sans-serif`;
      c.fillText(o.lowerThirdName, margin + 24 * u, y + 38 * u);
      c.fillStyle = 'rgba(255,255,255,.75)';
      c.font = `500 ${Math.round(19 * u)}px system-ui, sans-serif`;
      c.fillText(o.lowerThirdTitle, margin + 24 * u, y + 64 * u);
      c.restore();
    }

    if (o.ticker && o.tickerText.trim()) {
      c.save();
      const th = 40 * u;
      const y = H - th;
      c.fillStyle = 'rgba(6,8,14,.88)';
      c.fillRect(0, y, W, th);
      c.fillStyle = o.accent;
      c.fillRect(0, y, W, 3 * u);
      c.font = `600 ${Math.round(19 * u)}px system-ui, sans-serif`;
      c.fillStyle = '#fff';
      c.textBaseline = 'middle';
      const text = `${o.tickerText}     •     `;
      const tw = c.measureText(text).width;
      this.tickerOffset = (this.tickerOffset + dt * 0.09 * u * o.tickerSpeed) % Math.max(1, tw);
      for (let x = -this.tickerOffset; x < W; x += tw) c.fillText(text, x, y + th / 2 + 2);
      c.restore();
    }

    this.reactions.draw(c, dt, H);
  }

  // ------------------------------------------------------------------ mascot

  /**
   * The corner mascot. In mirror mode it copies the presenter's body, hands and face, scaled
   * into its box; otherwise it idles, talks when the presenter talks, and acts out reactions.
   */
  private drawMascot(input: FrameInput, box: Rect): void {
    const c = this.ctx;
    const b = input.settings.brand;
    const t = input.now / 1000;
    const person = [...input.faces].filter((f) => f.visible).sort((x, y) => y.w * y.h - x.w * x.h)[0] ?? null;

    let act: MascotAct | null = null;
    if (this.mascotAct) {
      const progress = (input.now - this.mascotAct.started) / MASCOT_ACT_MS;
      if (progress >= 1) this.mascotAct = null;
      else act = { kind: this.mascotAct.kind, progress };
    }

    const mirror = input.settings.picture.mirror;
    let skeleton: Skeleton | null = null;
    let expression: Expression | null = null;
    // Head tilt: copied from the presenter in mirror mode, a gentle idle sway otherwise.
    let roll = Math.sin(t * 0.9) * 0.05;
    if (b.mascotMode === 'mirror' && !act) {
      const copied = this.mirroredSkeleton(input, box, person);
      if (copied) {
        ({ skeleton, expression } = copied);
        if (person) roll = mirror ? -person.roll : person.roll;
      }
    }
    if (!skeleton || !expression) {
      const idle = mascotSkeleton(box, t, act);
      skeleton = idle.skeleton;
      expression = {
        // Talks along with the presenter, and blinks on its own.
        mouthOpen: Math.max(idle.face.mouthOpen, person?.mouthOpen ?? 0),
        blinkLeft: idle.face.blink,
        blinkRight: idle.face.blink,
        smile: Math.max(idle.face.smile, person?.smile ?? 0),
        browUp: act?.kind === 'wow' ? 0.9 : person?.browUp ?? 0,
        // Glances around now and then, so it never looks frozen.
        yaw: Math.sin(t * 0.45) * 0.25,
        nod: Math.sin(t * 0.7 + 1) * 0.15,
        lookX: Math.sin(t * 0.6) * 0.5,
        lookY: Math.sin(t * 0.37) * 0.2,
      };
    }

    c.save();
    // A soft floor shadow grounds it in the corner.
    c.fillStyle = 'rgba(0,0,0,.28)';
    c.beginPath();
    c.ellipse(box.x + box.w / 2, box.y + box.h * 0.975, box.w * 0.32, box.h * 0.025, 0, 0, Math.PI * 2);
    c.fill();
    drawPuppetBody(c, skeleton, lookFor(b.mascotCharacter, input.settings.designer, input.settings.overlays.accent));
    c.translate(skeleton.head.x, skeleton.head.y);
    c.rotate(roll);
    this.drawHead(c, b.mascotCharacter, skeleton.head.r, expression, input);
    c.restore();
  }

  /** The presenter's pose retargeted into the mascot's box: shoulders fixed in place, everything else relative to them. */
  private mirroredSkeleton(input: FrameInput, box: Rect, person: TrackedFace | null): { skeleton: Skeleton; expression: Expression } | null {
    const body = input.motion?.bodies[0];
    const video = input.camera;
    if (!body || !video || !video.videoWidth || input.scene !== 'camera') return null;
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    const mirror = input.settings.picture.mirror;
    const toPx = (x: number, y: number): P => ({ x: mirror ? vw - x * vw : x * vw, y: y * vh });

    const ls = toPx(body.points[POSE.leftShoulder].x, body.points[POSE.leftShoulder].y);
    const rs = toPx(body.points[POSE.rightShoulder].x, body.points[POSE.rightShoulder].y);
    const shoulders = Math.hypot(ls.x - rs.x, ls.y - rs.y);
    if (shoulders < 4) return null;
    const k = (box.w * 0.34) / shoulders;
    const mid = { x: (ls.x + rs.x) / 2, y: (ls.y + rs.y) / 2 };
    const anchor = { x: box.x + box.w / 2, y: box.y + box.h * 0.47 };
    const map = (x: number, y: number): P => {
      const p = toPx(x, y);
      return { x: anchor.x + (p.x - mid.x) * k, y: anchor.y + (p.y - mid.y) * k };
    };

    const skeleton = skeletonFromPose(body, input.settings.avatar.fingers ? input.motion!.hands : [], map, 1, false);
    if (!skeleton) return null;
    // The mascot stands: legs straight down from wherever the hips are.
    const floor = box.y + box.h * 0.96;
    for (const side of ['l', 'r'] as const) {
      const hip = side === 'l' ? skeleton.lHip : skeleton.rHip;
      const knee = { x: hip.x, y: hip.y + (floor - hip.y) * 0.5 };
      const ankle = { x: hip.x, y: floor };
      if (side === 'l') Object.assign(skeleton, { lKnee: knee, lAnkle: ankle });
      else Object.assign(skeleton, { rKnee: knee, rAnkle: ankle });
    }
    skeleton.unit = box.w * 0.075;
    skeleton.head.r = Math.min(box.w * 0.3, Math.max(box.w * 0.2, skeleton.head.r * 1.1));
    if (person) {
      const head = map(person.cx, person.cy - person.h * HAIR_RAISE);
      skeleton.head.x = head.x;
      skeleton.head.y = head.y;
    }
    const expression: Expression = person ? expressionFrom(person, mirror) : { mouthOpen: 0, blinkLeft: 0, blinkRight: 0, smile: 0.4, browUp: 0 };
    return { skeleton, expression };
  }
}

function clock(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
}

/** 1234 → "1.2K", 45600 → "45.6K", 1200000 → "1.2M". */
export function compact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1)}M`;
  if (value >= 10_000) return `${(value / 1000).toFixed(value >= 100_000 ? 0 : 1)}K`;
  return value.toLocaleString();
}
