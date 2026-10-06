import type { FaceLandmarker, GestureRecognizer, ImageSegmenter, NormalizedLandmark, PoseLandmarker, Category } from '@mediapipe/tasks-vision';

import { FaceObservation } from './face-tracker';
import { EMPTY_MOTION, MotionFrame } from './motion';

/**
 * On-device face tracking and person segmentation (MediaPipe Tasks, Apache-2.0). Everything
 * runs in this browser: the camera picture is never sent anywhere to be analysed, and the
 * models and WebAssembly runtime are served by this app itself (see
 * scripts/fetch-vision-models.mjs), not fetched from a third party at run time.
 */

const WASM_PATH = 'vision/wasm';
const FACE_MODEL = 'vision/models/face_landmarker.task';
const SEGMENTER_MODEL = 'vision/models/selfie_segmenter.tflite';
const POSE_MODEL = 'vision/models/pose_landmarker_lite.task';
const GESTURE_MODEL = 'vision/models/gesture_recognizer.task';

/** The person mask, as alpha (0-255) on a small canvas the compositor scales up. */
export interface PersonMask {
  canvas: OffscreenCanvas | HTMLCanvasElement;
  /** Share of the picture marked as a person, 0-1. */
  coverage: number;
}

export interface VisionFrame {
  faces: FaceObservation[];
  mask: PersonMask | null;
  /** Bodies and hands, when the motion models are loaded and asked for. */
  motion: MotionFrame | null;
  inferenceMs: number;
}

export interface DetectOptions {
  /** Run the person segmenter too. */
  mask: boolean;
  /** Run the body and hand models too. */
  motion: boolean;
}

export type VisionState = 'idle' | 'loading' | 'ready' | 'failed';

export class VisionEngine {
  private faceLandmarker: FaceLandmarker | null = null;
  private segmenter: ImageSegmenter | null = null;
  private pose: PoseLandmarker | null = null;
  private gestures: GestureRecognizer | null = null;
  private fileset: Awaited<ReturnType<typeof import('@mediapipe/tasks-vision').FilesetResolver.forVisionTasks>> | null = null;
  private loading: Promise<void> | null = null;
  private loadingMotion: Promise<void> | null = null;
  private configuredPoses = 0;
  private maskCanvas: OffscreenCanvas | HTMLCanvasElement | null = null;
  private maskContext: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D | null = null;
  private maskImage: ImageData | null = null;
  private lastTimestamp = 0;
  private configuredFaces = 0;
  private configuredConfidence = 0;

  state: VisionState = 'idle';
  error: string | null = null;
  /** Which processor the models ended up on. */
  delegate: 'GPU' | 'CPU' | null = null;
  /** The body and hand models, loaded separately and only when something uses them. */
  motionState: VisionState = 'idle';
  motionError: string | null = null;

  /** Loads the models once; later calls share the same load. */
  load(): Promise<void> {
    this.loading ??= this.doLoad();
    return this.loading;
  }

  private async doLoad(): Promise<void> {
    this.state = 'loading';
    try {
      const vision = await import('@mediapipe/tasks-vision');
      const base = new URL(WASM_PATH, document.baseURI).href;
      const fileset = await vision.FilesetResolver.forVisionTasks(base);
      this.fileset = fileset;

      // The GPU is much faster, but not every machine or browser can give MediaPipe a WebGL context.
      for (const delegate of ['GPU', 'CPU'] as const) {
        try {
          this.faceLandmarker = await vision.FaceLandmarker.createFromOptions(fileset, {
            baseOptions: { modelAssetPath: new URL(FACE_MODEL, document.baseURI).href, delegate },
            runningMode: 'VIDEO',
            numFaces: 4,
            outputFaceBlendshapes: true,
            minFaceDetectionConfidence: 0.5,
            minFacePresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
          });
          this.segmenter = await vision.ImageSegmenter.createFromOptions(fileset, {
            baseOptions: { modelAssetPath: new URL(SEGMENTER_MODEL, document.baseURI).href, delegate },
            runningMode: 'VIDEO',
            outputConfidenceMasks: true,
            outputCategoryMask: false,
          });
          this.delegate = delegate;
          this.configuredFaces = 4;
          this.configuredConfidence = 0.5;
          break;
        } catch (err) {
          this.faceLandmarker?.close();
          this.faceLandmarker = null;
          if (delegate === 'CPU') throw err;
        }
      }

      this.state = 'ready';
      this.error = null;
    } catch (err) {
      this.state = 'failed';
      this.loading = null;
      this.error = describeLoadError(err);
      throw err;
    }
  }

  /**
   * Loads the body (pose) and hand (gesture) models, after the face model, on the same
   * processor. They are about 14 MB together, so they load only when the body puppet,
   * gestures or a copying mascot is switched on.
   */
  loadMotion(): Promise<void> {
    this.loadingMotion ??= this.doLoadMotion();
    return this.loadingMotion;
  }

  private async doLoadMotion(): Promise<void> {
    this.motionState = 'loading';
    try {
      await this.load();
      const vision = await import('@mediapipe/tasks-vision');
      const delegate = this.delegate ?? 'CPU';
      this.pose = await vision.PoseLandmarker.createFromOptions(this.fileset!, {
        baseOptions: { modelAssetPath: new URL(POSE_MODEL, document.baseURI).href, delegate },
        runningMode: 'VIDEO',
        numPoses: 2,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
        outputSegmentationMasks: false,
      });
      this.configuredPoses = 2;
      this.gestures = await vision.GestureRecognizer.createFromOptions(this.fileset!, {
        baseOptions: { modelAssetPath: new URL(GESTURE_MODEL, document.baseURI).href, delegate },
        runningMode: 'VIDEO',
        numHands: 2,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
        cannedGesturesClassifierOptions: { scoreThreshold: 0.4 },
      });
      this.motionState = 'ready';
      this.motionError = null;
    } catch (err) {
      this.pose?.close();
      this.gestures?.close();
      this.pose = null;
      this.gestures = null;
      this.motionState = 'failed';
      this.loadingMotion = null;
      this.motionError = describeLoadError(err, 'body and hand tracking');
      throw err;
    }
  }

  /** Tracks as many bodies as faces, up to 3 (each body costs time). */
  async configureMotion(maxPeople: number): Promise<void> {
    const poses = Math.max(1, Math.min(3, maxPeople));
    if (!this.pose || poses === this.configuredPoses) return;
    this.configuredPoses = poses;
    await this.pose.setOptions({ numPoses: poses });
  }

  /** Applies the face count and sensitivity; MediaPipe takes new options without reloading the model. */
  async configure(maxFaces: number, sensitivity: number): Promise<void> {
    if (!this.faceLandmarker) return;
    if (maxFaces === this.configuredFaces && sensitivity === this.configuredConfidence) return;
    this.configuredFaces = maxFaces;
    this.configuredConfidence = sensitivity;
    await this.faceLandmarker.setOptions({
      numFaces: maxFaces,
      minFaceDetectionConfidence: sensitivity,
      minFacePresenceConfidence: sensitivity,
    });
  }

  /**
   * Analyses one video frame. The person segmenter costs about as much again as the faces,
   * so it only runs when a body or background effect (or strict mode) needs it; the body and
   * hand models likewise only when asked for.
   */
  detect(video: HTMLVideoElement, options: DetectOptions): VisionFrame | null {
    if (!this.faceLandmarker || video.readyState < 2 || !video.videoWidth) return null;

    // MediaPipe needs strictly increasing timestamps in video mode.
    const now = performance.now();
    const timestamp = now <= this.lastTimestamp ? this.lastTimestamp + 1 : now;
    this.lastTimestamp = timestamp;

    const started = performance.now();
    const result = this.faceLandmarker.detectForVideo(video, timestamp);
    const aspect = video.videoWidth / video.videoHeight;
    const faces = result.faceLandmarks.map((landmarks, i) =>
      toObservation(landmarks, result.faceBlendshapes[i]?.categories ?? [], aspect));

    let mask: PersonMask | null = null;
    if (options.mask && this.segmenter) {
      const segmented = this.segmenter.segmentForVideo(video, timestamp);
      const confidence = segmented.confidenceMasks?.[0];
      if (confidence) {
        mask = this.toMask(confidence.getAsFloat32Array(), confidence.width, confidence.height);
      }
      segmented.close();
    }

    let motion: MotionFrame | null = null;
    if (options.motion && this.pose && this.gestures) {
      const bodies = this.pose.detectForVideo(video, timestamp);
      const hands = this.gestures.recognizeForVideo(video, timestamp);
      motion = {
        bodies: bodies.landmarks.map((points) => ({ points: points.map((p) => ({ x: p.x, y: p.y, v: p.visibility ?? 1 })) })),
        hands: hands.landmarks.map((points, i) => ({
          points: points.map((p) => ({ x: p.x, y: p.y, v: 1 })),
          side: hands.handedness[i]?.[0]?.categoryName === 'Left' ? 'Left' as const : 'Right' as const,
          gesture: hands.gestures[i]?.[0]?.categoryName ?? 'None',
          score: hands.gestures[i]?.[0]?.score ?? 0,
        })),
      };
    } else if (options.motion) {
      motion = EMPTY_MOTION;
    }

    return { faces, mask, motion, inferenceMs: performance.now() - started };
  }

  /** The person mask alone, without face tracking: for cutting someone out (Collab green screen). */
  segment(video: HTMLVideoElement): PersonMask | null {
    if (!this.segmenter || video.readyState < 2 || !video.videoWidth) return null;
    const now = performance.now();
    const timestamp = now <= this.lastTimestamp ? this.lastTimestamp + 1 : now;
    this.lastTimestamp = timestamp;

    const segmented = this.segmenter.segmentForVideo(video, timestamp);
    const confidence = segmented.confidenceMasks?.[0];
    const mask = confidence ? this.toMask(confidence.getAsFloat32Array(), confidence.width, confidence.height) : null;
    segmented.close();
    return mask;
  }

  close(): void {
    this.faceLandmarker?.close();
    this.segmenter?.close();
    this.pose?.close();
    this.gestures?.close();
    this.faceLandmarker = null;
    this.segmenter = null;
    this.pose = null;
    this.gestures = null;
    this.loading = null;
    this.loadingMotion = null;
    this.state = 'idle';
    this.motionState = 'idle';
  }

  private toMask(values: Float32Array, width: number, height: number): PersonMask {
    if (!this.maskCanvas || this.maskCanvas.width !== width || this.maskCanvas.height !== height) {
      this.maskCanvas = typeof OffscreenCanvas !== 'undefined'
        ? new OffscreenCanvas(width, height)
        : Object.assign(document.createElement('canvas'), { width, height });
      this.maskContext = this.maskCanvas.getContext('2d') as OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;
      this.maskImage = this.maskContext.createImageData(width, height);
    }

    const pixels = this.maskImage!.data;
    let person = 0;
    for (let i = 0; i < values.length; i++) {
      const alpha = values[i];
      if (alpha > 0.5) person++;
      const o = i * 4;
      pixels[o] = 255;
      pixels[o + 1] = 255;
      pixels[o + 2] = 255;
      // A soft edge, but sharpened around 0.5 so the outline doesn't halo.
      pixels[o + 3] = Math.max(0, Math.min(255, (alpha - 0.3) * 637));
    }
    this.maskContext!.putImageData(this.maskImage!, 0, 0);
    return { canvas: this.maskCanvas, coverage: person / values.length };
  }
}

/** Landmark indices in MediaPipe's 478-point face mesh. */
const LEFT_EYE_OUTER = 33;
const RIGHT_EYE_OUTER = 263;
const NOSE_TIP = 1;
const LEFT_CHEEK = 234;
const RIGHT_CHEEK = 454;

function toObservation(landmarks: NormalizedLandmark[], shapes: Category[], aspect: number): FaceObservation {
  let minX = 1, minY = 1, maxX = 0, maxY = 0;
  for (const p of landmarks) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }

  const left = landmarks[LEFT_EYE_OUTER];
  const right = landmarks[RIGHT_EYE_OUTER];
  // x and y are normalised separately, so the aspect ratio is restored before taking the angle.
  const roll = Math.atan2((right.y - left.y), (right.x - left.x) * aspect);

  const nose = landmarks[NOSE_TIP];
  const cheekL = landmarks[LEFT_CHEEK];
  const cheekR = landmarks[RIGHT_CHEEK];
  const span = Math.max(0.001, cheekR.x - cheekL.x);
  const yaw = Math.max(-1, Math.min(1, ((nose.x - cheekL.x) / span - 0.5) * 2));

  const shape = (name: string) => shapes.find((c) => c.categoryName === name)?.score ?? 0;

  // How far below the eyes the nose sits, relative to the face's height: rises and falls with a nod.
  const eyeY = (left.y + right.y) / 2;
  const pitch = (nose.y - eyeY) / Math.max(0.001, maxY - minY);

  return {
    cx: (minX + maxX) / 2,
    cy: (minY + maxY) / 2,
    w: maxX - minX,
    h: maxY - minY,
    roll,
    yaw,
    pitch,
    mouthOpen: shape('jawOpen'),
    blinkLeft: shape('eyeBlinkLeft'),
    blinkRight: shape('eyeBlinkRight'),
    smile: (shape('mouthSmileLeft') + shape('mouthSmileRight')) / 2,
    browUp: shape('browInnerUp'),
    lookX: gazeAcross(landmarks),
    // Up and down are the same on both eyes, so the blendshapes can be averaged without caring which eye is which.
    lookY: clamp1((shape('eyeLookDownLeft') + shape('eyeLookDownRight') - shape('eyeLookUpLeft') - shape('eyeLookUpRight')) * 0.9),
  };
}

/** Eye corners in the face mesh, as [outer, inner] for each eye. */
const EYE_CORNERS: readonly [number, number][] = [[33, 133], [263, 362]];
/** Iris centres (the model's last 10 points are the two irises). */
const IRIS_CENTRES = [468, 473];

/**
 * Sideways gaze from where each iris sits between its eye's corners, in picture coordinates.
 * Each iris is paired with the nearer eye, so the result doesn't depend on which index is which eye.
 */
function gazeAcross(landmarks: NormalizedLandmark[]): number {
  if (landmarks.length <= IRIS_CENTRES[1]) return 0;
  let sum = 0;
  let count = 0;
  for (const i of IRIS_CENTRES) {
    const iris = landmarks[i];
    let best: [number, number] | null = null;
    let bestDistance = Infinity;
    for (const pair of EYE_CORNERS) {
      const a = landmarks[pair[0]];
      const b = landmarks[pair[1]];
      const d = Math.abs((a.x + b.x) / 2 - iris.x);
      if (d < bestDistance) {
        bestDistance = d;
        best = pair;
      }
    }
    if (!best) continue;
    const left = Math.min(landmarks[best[0]].x, landmarks[best[1]].x);
    const width = Math.abs(landmarks[best[0]].x - landmarks[best[1]].x);
    if (width < 1e-4) continue;
    sum += (iris.x - left) / width - 0.5;
    count++;
  }
  // The iris travels about a third of the eye's width, so ±0.17 is looking fully to one side.
  return count ? clamp1((sum / count) * 6) : 0;
}

function clamp1(v: number): number {
  return Math.max(-1, Math.min(1, v));
}

function describeLoadError(err: unknown, what = 'face tracking'): string {
  const text = err instanceof Error ? err.message : String(err);
  if (/404|Failed to fetch|NetworkError|not found/i.test(text)) {
    return `The ${what} models are missing. Run "npm run vision:models" in the frontend folder, then reload.`;
  }
  return `${what[0].toUpperCase()}${what.slice(1)} could not start in this browser. Try Chrome or Edge with hardware acceleration on.`;
}
