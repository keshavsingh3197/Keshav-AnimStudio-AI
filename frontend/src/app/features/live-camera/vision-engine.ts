import type { FaceLandmarker, ImageSegmenter, NormalizedLandmark, Category } from '@mediapipe/tasks-vision';

import { FaceObservation } from './face-tracker';

/**
 * On-device face tracking and person segmentation (MediaPipe Tasks, Apache-2.0). Everything
 * runs in this browser: the camera picture is never sent anywhere to be analysed, and the
 * models and WebAssembly runtime are served by this app itself (see
 * scripts/fetch-vision-models.mjs), not fetched from a third party at run time.
 */

const WASM_PATH = 'vision/wasm';
const FACE_MODEL = 'vision/models/face_landmarker.task';
const SEGMENTER_MODEL = 'vision/models/selfie_segmenter.tflite';

/** The person mask, as alpha (0-255) on a small canvas the compositor scales up. */
export interface PersonMask {
  canvas: OffscreenCanvas | HTMLCanvasElement;
  /** Share of the picture marked as a person, 0-1. */
  coverage: number;
}

export interface VisionFrame {
  faces: FaceObservation[];
  mask: PersonMask | null;
  inferenceMs: number;
}

export type VisionState = 'idle' | 'loading' | 'ready' | 'failed';

export class VisionEngine {
  private faceLandmarker: FaceLandmarker | null = null;
  private segmenter: ImageSegmenter | null = null;
  private loading: Promise<void> | null = null;
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
   * Analyses one video frame. `withMask` runs the person segmenter too, which costs about
   * as much again, so it only runs when a body or background effect (or strict mode) needs it.
   */
  detect(video: HTMLVideoElement, withMask: boolean): VisionFrame | null {
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
    if (withMask && this.segmenter) {
      const segmented = this.segmenter.segmentForVideo(video, timestamp);
      const confidence = segmented.confidenceMasks?.[0];
      if (confidence) {
        mask = this.toMask(confidence.getAsFloat32Array(), confidence.width, confidence.height);
      }
      segmented.close();
    }

    return { faces, mask, inferenceMs: performance.now() - started };
  }

  close(): void {
    this.faceLandmarker?.close();
    this.segmenter?.close();
    this.faceLandmarker = null;
    this.segmenter = null;
    this.loading = null;
    this.state = 'idle';
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

  return {
    cx: (minX + maxX) / 2,
    cy: (minY + maxY) / 2,
    w: maxX - minX,
    h: maxY - minY,
    roll,
    yaw,
    mouthOpen: shape('jawOpen'),
    blinkLeft: shape('eyeBlinkLeft'),
    blinkRight: shape('eyeBlinkRight'),
    smile: (shape('mouthSmileLeft') + shape('mouthSmileRight')) / 2,
    browUp: shape('browInnerUp'),
  };
}

function describeLoadError(err: unknown): string {
  const text = err instanceof Error ? err.message : String(err);
  if (/404|Failed to fetch|NetworkError|not found/i.test(text)) {
    return 'The face-tracking models are missing. Run "npm run vision:models" in the frontend folder, then reload.';
  }
  return 'Face tracking could not start in this browser. Try Chrome or Edge with hardware acceleration on.';
}
