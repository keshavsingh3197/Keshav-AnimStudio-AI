import * as THREE from 'three';
import { EmotionKind, RenderJobJson } from './types';

export interface CameraRig {
  camera: THREE.PerspectiveCamera;
  currentPos: THREE.Vector3;
  currentLook: THREE.Vector3;
  baseFov: number;
}

export function createCameraRig(job: RenderJobJson): CameraRig {
  const aspect = job.width / job.height;
  const isPortrait = job.height > job.width;
  const baseFov = isPortrait ? 39 : 36;
  const camera = new THREE.PerspectiveCamera(baseFov, aspect, 0.1, 100);

  const z = isPortrait ? 6.4 : 4.8;
  const y = isPortrait ? 1.15 : 1.05;
  const lookY = isPortrait ? 0.48 : 0.92;

  camera.position.set(0, y, z);
  camera.lookAt(0, lookY, 0);

  return {
    camera,
    currentPos: new THREE.Vector3(0, y, z),
    currentLook: new THREE.Vector3(0, lookY, 0),
    baseFov,
  };
}

export function updateCameraRig(
  rig: CameraRig,
  job: RenderJobJson,
  t: number,
  u: number,
  activeSlot: 'Left' | 'Right' | 'Narrator',
  leftX: number,
  rightX: number,
  emotion: EmotionKind,
  isTitleHook: boolean,
): void {
  const isPortrait = job.height > job.width;
  const defaultZ = isPortrait ? 6.4 : 4.8;
  const defaultY = isPortrait ? 1.15 : 1.05;
  const defaultLookY = isPortrait ? 0.48 : 0.92;

  // When a template background is locked, freeze perspective framing 1:1 with placement coordinates
  if (job.stageLayout?.templateBackdrop) {
    rig.camera.position.set(0, defaultY, defaultZ);
    rig.camera.lookAt(0, defaultLookY, 0);
    return;
  }

  let targetX = 0;
  let targetY = defaultY;
  let targetZ = defaultZ;
  let lookX = 0;
  let lookY = defaultLookY;

  if (!job.enableDynamicCamera || isTitleHook) {
    // Slow cinematic dolly crane-in during Title hook
    const hookZoom = isTitleHook ? Math.min(1, t / 2.6) * 0.45 : 0;
    targetZ = defaultZ - hookZoom;
    targetY = defaultY + (isTitleHook ? (1 - Math.min(1, t / 2.6)) * 0.25 : 0);
  } else if (u > 0.88) {
    // Final moral / climax graceful pull-back wide shot
    targetZ = defaultZ + 0.35;
    targetY = defaultY + 0.12;
  } else if (activeSlot === 'Left') {
    // Gentle 3D framing shift toward Left speaker while keeping partner clearly in frame
    targetX = leftX * 0.20;
    targetZ = defaultZ * 0.92;
    targetY = defaultY + 0.03;
    lookX = leftX * 0.16;
    lookY = defaultLookY + 0.05;
  } else if (activeSlot === 'Right') {
    // Smooth reverse shift toward Right speaker
    targetX = rightX * 0.20;
    targetZ = defaultZ * 0.92;
    targetY = defaultY + 0.03;
    lookX = rightX * 0.16;
    lookY = defaultLookY + 0.05;
  }

  // Gentle organic handheld drift + comic punch-in / shock shake
  let shakeX = Math.sin(t * 0.9) * 0.03;
  let shakeY = Math.cos(t * 0.7) * 0.02;
  if (emotion === 'surprised' || emotion === 'angry') {
    targetZ *= 0.93;
    shakeX += Math.sin(t * 28) * 0.02;
    shakeY += Math.cos(t * 33) * 0.015;
  }

  const targetPos = new THREE.Vector3(targetX + shakeX, targetY + shakeY, targetZ);
  const targetLook = new THREE.Vector3(lookX, lookY, 0);

  // Smooth exponential camera glide (~0.35s settle time across frame steps)
  const alpha = 1 - Math.exp(-3.4 / Math.max(1, job.fps));
  rig.currentPos.lerp(targetPos, alpha);
  rig.currentLook.lerp(targetLook, alpha);

  rig.camera.position.copy(rig.currentPos);
  rig.camera.lookAt(rig.currentLook);
}
