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
  cameraShot = 'auto',
  action = 'none',
  turnChanged = false,
  turnLocal = 0.5,
  speakerHeadY = 1.38,
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

  // Gentle organic handheld drift + comic punch-in / smash-cut shake
  const comedy = !!job.isComedyMode;
  let shakeX = Math.sin(t * (comedy ? 1.8 : 0.9)) * (comedy ? 0.045 : 0.03);
  let shakeY = Math.cos(t * (comedy ? 1.4 : 0.7)) * (comedy ? 0.032 : 0.02);
  let rollZ = 0;

  if (emotion === 'surprised' || emotion === 'angry') {
    targetZ *= comedy ? 0.68 : 0.93;
    if (comedy) {
      lookY = isPortrait ? 0.88 : 1.18;
      targetY = isPortrait ? 1.18 : 1.25;
      rollZ = Math.sin(t * 5.2) * (emotion === 'angry' ? 0.045 : -0.035);
    }
    shakeX += Math.sin(t * 28) * (comedy ? 0.042 : 0.02);
    shakeY += Math.cos(t * 33) * (comedy ? 0.032 : 0.015);
  } else if (comedy && emotion === 'laughing') {
    targetZ *= 0.82;
    shakeY += Math.abs(Math.sin(t * 9.5)) * 0.035;
    rollZ = Math.sin(t * 7.5) * 0.024;
  }

  // Situational MJO-style cinematography overrides driven by script/action cues
  const hasTemplateLock = !!job.stageLayout?.templateBackdrop;
  if (!hasTemplateLock && !isTitleHook) {
    const activeX = activeSlot === 'Left' ? leftX : activeSlot === 'Right' ? rightX : (leftX + rightX) * 0.5;
    if (cameraShot === 'closeUpSpeaker' && activeSlot !== 'Narrator') {
      targetX = activeX + (activeSlot === 'Left' ? 0.14 : -0.14);
      targetY = Math.max(0.85, speakerHeadY * 0.94);
      targetZ = isPortrait ? 2.65 : 2.15;
      lookX = activeX;
      lookY = Math.max(0.78, speakerHeadY * 0.92);
    } else if (cameraShot === 'crashPunch' && activeSlot !== 'Narrator') {
      const punch = Math.max(0, 1 - Math.min(1, turnLocal / 0.28));
      targetX = activeX;
      targetY = Math.max(0.88, speakerHeadY * 0.95);
      targetZ = (isPortrait ? 2.42 : 1.98) - punch * 0.36;
      lookX = activeX;
      lookY = Math.max(0.82, speakerHeadY * 0.92);
      rollZ += Math.sin(t * 28) * 0.032 * punch;
      shakeX += Math.cos(t * 42) * 0.035 * punch;
      shakeY += Math.sin(t * 36) * 0.03 * punch;
    } else if (cameraShot === 'reactionZoom') {
      const reactX = activeSlot === 'Left' ? rightX : leftX;
      targetX = reactX * 0.88;
      targetY = 1.28;
      targetZ = isPortrait ? 2.85 : 2.28;
      lookX = reactX;
      lookY = 1.24;
    } else if (cameraShot === 'wideEstablishing') {
      targetX = (leftX + rightX) * 0.25;
      targetY = isPortrait ? 1.48 : 1.44;
      targetZ = isPortrait ? 5.75 : 4.45;
      lookX = (leftX + rightX) * 0.35;
      lookY = isPortrait ? 0.86 : 0.92;
    } else if (cameraShot === 'lowDramatic') {
      targetX = activeX * 0.45;
      targetY = 0.68;
      targetZ = isPortrait ? 3.55 : 2.95;
      lookX = activeX * 0.8;
      lookY = Math.max(1.12, speakerHeadY * 0.9);
    } else if (cameraShot === 'overShoulder' && activeSlot !== 'Narrator') {
      const oppX = activeSlot === 'Left' ? rightX : leftX;
      targetX = oppX * 0.9;
      targetY = 1.38;
      targetZ = isPortrait ? 3.45 : 2.75;
      lookX = activeX;
      lookY = Math.max(0.9, speakerHeadY * 0.9);
    }

    if (action === 'walking' || action === 'running') {
      targetX = activeX * 0.65;
      lookX = activeX * 0.85;
    }
  }

  let targetPos = new THREE.Vector3(targetX + shakeX, targetY + shakeY, targetZ);
  let targetLook = new THREE.Vector3(lookX, lookY, 0);

  // Seamless Shorts loop reset: smoothly converge to exact neutral opening framing at end of clip
  if (job.isSeamlessLoop) {
    const restPos = new THREE.Vector3(0, defaultY, defaultZ);
    const restLook = new THREE.Vector3(0, defaultLookY, 0);
    if (u > 0.86) {
      const k = Math.min(1, (u - 0.86) / 0.14);
      targetPos.lerp(restPos, k);
      targetLook.lerp(restLook, k);
      rollZ *= 1 - k;
    } else if (u < 0.06) {
      const k = 1 - u / 0.06;
      targetPos.lerp(restPos, k);
      targetLook.lerp(restLook, k);
      rollZ *= 1 - k;
    }
  }

  // Comedy smash-cut snaps instantaneously on turn change instead of sluggish gliding
  if (turnChanged && !hasTemplateLock && (comedy || cameraShot === 'crashPunch' || cameraShot === 'closeUpSpeaker')) {
    rig.currentPos.lerp(targetPos, 0.86);
    rig.currentLook.lerp(targetLook, 0.86);
  } else {
    const speed = comedy ? 13.0 : (cameraShot === 'wideEstablishing' ? 4.2 : 6.4);
    const alpha = 1 - Math.exp(-speed / Math.max(1, job.fps));
    rig.currentPos.lerp(targetPos, alpha);
    rig.currentLook.lerp(targetLook, alpha);
  }

  rig.camera.position.copy(rig.currentPos);
  rig.camera.lookAt(rig.currentLook);
  rig.camera.rotation.z += rollZ;
}
